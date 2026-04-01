// ConnectionManager - orchestrates connection establishment.
//
// Given a SimpleX contact address URI, parses the address, generates
// crypto key pairs, creates the browser's receiving queue on the SMP
// server, and drives the state machine to QUEUE_CREATED.
//
// Integrates: Task 1 (address parser), Task 2 (state machine),
// Season 3 (SMP client), and crypto-utils for key generation.
//
// Bob creates ONE queue (his inbox). Alice's contact queue already
// exists in the contact address URI.

import {parseContactAddress} from "./address.js"
import type {ParsedContactAddress, SMPQueueURI, SMPServer} from "./address.js"
import {ConnectionStateMachine} from "./state.js"
import type {QueuePairInfo} from "./state.js"
import {
  generateX25519KeyPair,
  encodeX25519PublicKey,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import type {SMPClientAgent} from "./agent.js"
import type {SMPServerAddress} from "./types.js"
import {buildConnectionRequest} from "./connection-request.js"
import type {ConnectionRequestParams} from "./connection-request.js"
import {buildInvitation} from "./invitation.js"
import {decryptMsgBody, parseRcvMsgBody, extractRawX25519} from "./msg-decrypt.js"
import {parseSmpEncConfirmation, decryptLayer1, parseSmpConfirmation} from "./layer1-decrypt.js"
import {parseAgentConfirmation} from "./agent-confirmation.js"
import {x3dhReceiver} from "./x3dh-agreement.js"
import {initRcvRatchet, decryptEncConnInfo, rcDecrypt, rcEncrypt, pad} from "./ratchet-decrypt.js"
import {sha256} from "@noble/hashes/sha256"
import type {RatchetState} from "./ratchet-decrypt.js"
import nacl from "tweetnacl"
import {parseAgentConnInfoReply} from "./reply-queue.js"
import type {ReplyQueueInfo} from "./reply-queue.js"

// -- Types

/**
 * All key material for a connection, stored in memory.
 * NEVER persisted to disk or sent over the network as-is.
 */
export interface ConnectionKeys {
  /** Ed25519 key pair for authorizing recipient commands (SUB, ACK, DEL) */
  recipientAuth: KeyPair
  /** X25519 key pair for server-to-recipient message body encryption */
  recipientDh: KeyPair
  /** X25519 key pair for E2E encryption with the remote party */
  e2eDh: KeyPair
}

/**
 * The contact queue from Alice's contact address.
 * This is where we send the connection request (Task 4).
 */
export interface ContactQueueInfo {
  server: {
    hosts: string[]
    port: number
    serverIdentity: string
  }
  senderId: string
  dhPublicKey: string
  smpVersion: {min: number; max: number}
  sndSecure: boolean
}

/**
 * A managed connection - the main object users interact with.
 */
export interface ManagedConnection {
  state: ConnectionStateMachine
  keys: ConnectionKeys
  contactAddress: ParsedContactAddress
  contactQueue: ContactQueueInfo | null
  receiveQueue: {
    recipientId: Uint8Array
    senderId: Uint8Array
    serverDhKey: Uint8Array
  } | null
  /** X25519 private key for Layer 1 NaCl decryption (from invitation queueDhKeyPair) */
  queueDhPrivateKey: Uint8Array | null
  /** X448 keypair 1 for X3DH (from invitation, e2ePubKey1) */
  e2eKey1: KeyPair | null
  /** X448 keypair 2 for X3DH (from invitation, e2ePubKey2) */
  e2eKey2: KeyPair | null
  /** Double Ratchet state (set after first AgentConfirmation decrypt) */
  ratchetState: RatchetState | null
  /** Peer's X25519 DH public key from first smpEncConfirmation (reused for subsequent msgs) */
  e2eDhPubKey: Uint8Array | null
  /** Count of received MSGs (0 = AgentConfirmation, 1+ = subsequent messages like HELLO) */
  msgCount: number
  /** CLI's reply queue info (parsed from AgentConnInfoReply) */
  replyQueue: ReplyQueueInfo | null
  /** Whether handshake reply has been sent to CLI's reply queue */
  handshakeSent: boolean
  /** X25519 keypair for per-queue E2E with reply queue (created in sendHandshake, reused) */
  replyE2eKeyPair: { publicKey: Uint8Array; secretKey: Uint8Array } | null
  /** X25519 private key for signing SENDs to reply queue (from sender auth key in AgentConfirmation) */
  replySenderAuthPrivKey: Uint8Array | null
  /** Callback for received chat messages (JSON text from x.msg.new) */
  onChatMessage: ((text: string) => void) | null
  /** Callback when a delivery receipt is received for a sent message */
  onDeliveryReceipt: ((agentMsgId: number) => void) | null
  /** Callback when the connection is ended by the peer (queue deleted) */
  onConnectionEnded: (() => void) | null
  /** Send message counter (starts at 1, increments per message) */
  sndMsgId: number
  /** SHA256 of last sent AgentMessage (empty for first message) */
  prevMsgHash: Uint8Array
}

/**
 * Configuration for the ConnectionManager.
 */
export interface ConnectionManagerConfig {
  queueServer?: {hosts: string[]; port: number; serverIdentity: string}
  timeout?: number
  subscribeMode?: "S" | "C"
  sndSecure?: boolean
}

// -- Helpers

function toHex(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16)
  return s
}

function serverToString(server: {hosts: string[]; port: number}): string {
  return server.hosts[0] + ":" + server.port
}

/**
 * Convert a parsed SMPServer to the SMPServerAddress format
 * expected by SMPClientAgent.getClient().
 */
function toSMPServerAddress(server: {hosts: string[]; port: number; serverIdentity: string}): SMPServerAddress {
  // SMPServerAddress uses host (string), port (number), keyHash (Uint8Array)
  // The keyHash is the SHA-256 fingerprint of the CA cert, base64url-decoded.
  // It MUST be the real server fingerprint from the contact address - the SMP
  // server verifies this in the ClientHello and rejects the connection if wrong.
  const keyHash = base64urlDecode(server.serverIdentity)
  if (keyHash.length === 0) {
    // For mock tests: use 32 zero bytes when no identity is available.
    // For production: this should never happen - the contact address
    // always contains the server fingerprint.
    return {host: server.hosts[0], port: server.port, keyHash: new Uint8Array(32)}
  }
  return {
    host: server.hosts[0],
    port: server.port,
    keyHash,
  }
}

function base64urlDecode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(0)
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4 !== 0) b64 += "="
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function extractContactQueue(queue: SMPQueueURI): ContactQueueInfo {
  return {
    server: {
      hosts: queue.server.hosts,
      port: queue.server.port,
      serverIdentity: queue.server.serverIdentity,
    },
    senderId: queue.senderId,
    dhPublicKey: queue.dhPublicKey,
    smpVersion: queue.smpVersion,
    sndSecure: queue.sndSecure,
  }
}

// -- ConnectionManager

export class ConnectionManager {
  private readonly agent: SMPClientAgent
  private readonly config: ConnectionManagerConfig
  private readonly connections: Map<string, ManagedConnection> = new Map()

  constructor(agent: SMPClientAgent, config?: ConnectionManagerConfig) {
    this.agent = agent
    this.config = config ?? {}
  }

  async initiateConnection(contactAddressUri: string): Promise<ManagedConnection> {
    // 1. Parse the contact address
    console.log("[SMP] initiateConnection: parsing contact address")
    const contactAddress = parseContactAddress(contactAddressUri)
    console.log("[SMP] initiateConnection: format=" + contactAddress.format)

    // 2. Create state machine
    const state = new ConnectionStateMachine()

    // 3. Generate key pairs
    console.log("[SMP] initiateConnection: generating key pairs")
    // v7+ uses X25519 for per-queue auth (CbAuthenticator), not Ed25519
    const keys: ConnectionKeys = {
      recipientAuth: generateX25519KeyPair(),  // X25519 for v7+ CbAuthenticator
      recipientDh: generateX25519KeyPair(),
      e2eDh: generateX25519KeyPair(),
    }

    // 4. Extract contact queue info (only for full links)
    let contactQueue: ContactQueueInfo | null = null
    if (contactAddress.format === "full") {
      contactQueue = extractContactQueue(contactAddress.data.smpQueues[0])
    }

    // 5. Determine target server for Bob's receiving queue
    const targetServer = this.resolveTargetServer(contactAddress)
    console.log("[SMP] initiateConnection: target server=" + targetServer.hosts[0] + ":" + targetServer.port + ", identity=" + (targetServer.serverIdentity ? targetServer.serverIdentity.substring(0, 12) + "..." : "(empty)"))

    // 6. Create managed connection (initially without receiveQueue)
    const conn: ManagedConnection = {
      state,
      keys,
      contactAddress,
      contactQueue,
      receiveQueue: null,
      queueDhPrivateKey: null,
      e2eKey1: null,
      e2eKey2: null,
      ratchetState: null,
      e2eDhPubKey: null,
      msgCount: 0,
      replyQueue: null,
      handshakeSent: false,
      replyE2eKeyPair: null,
      replySenderAuthPrivKey: null,
      onChatMessage: null,
      onDeliveryReceipt: null,
      onConnectionEnded: null,
      sndMsgId: 1,
      prevMsgHash: new Uint8Array(0),
    }

    // 7. Create receiving queue on the SMP server
    try {
      const serverAddress = toSMPServerAddress(targetServer)
      console.log("[SMP] initiateConnection: keyHash=" + serverAddress.keyHash.length + "B, first 4 bytes: " + Array.from(serverAddress.keyHash.subarray(0, 4)).map(b => b.toString(16).padStart(2, "0")).join(" "))
      console.log("[SMP] initiateConnection: calling agent.getClient")
      const client = await this.agent.getClient(serverAddress)
      console.log("[SMP] initiateConnection: agent.getClient returned, calling createQueue")

      const ids = await client.createQueue({
        recipientAuthKey: encodeX25519PublicKey(keys.recipientAuth.publicKey), // X25519 SPKI for v7+ CbAuth
        recipientAuthPrivateKey: keys.recipientAuth.privateKey, // X25519 private key for CbAuthenticator
        recipientDhKey: encodeX25519PublicKey(keys.recipientDh.publicKey),
        subscribeMode: this.config.subscribeMode ?? "S",
        sndSecure: this.config.sndSecure ?? true,
      })
      console.log("[SMP] initiateConnection: createQueue returned IDS, recipientId=" + ids.recipientId.length + "B")

      // 8. Store receive queue info
      conn.receiveQueue = {
        recipientId: ids.recipientId,
        senderId: ids.senderId,
        serverDhKey: ids.serverDhKey,
      }

      // 9. Drive state machine to QUEUE_CREATED
      state.transition("createQueues")

      // 10. Set queue pair info on state machine
      const queuePair: QueuePairInfo = {
        receiveQueue: {
          server: serverToString(targetServer),
          recipientId: toHex(ids.recipientId),
          senderId: toHex(ids.senderId),
        },
        sendQueue: {
          server: contactQueue ? serverToString(contactQueue.server) : serverToString(targetServer),
          senderId: contactQueue ? contactQueue.senderId : "",
        },
      }
      state.setQueuePair(queuePair)

    } catch (err) {
      state.transition("error", {
        code: "QUEUE_CREATION_FAILED",
        message: err instanceof Error ? err.message : "Unknown error",
        cause: err instanceof Error ? err : undefined,
      })
      this.connections.set(state.id, conn)
      throw err
    }

    // 11. Store and return
    this.connections.set(state.id, conn)
    return conn
  }

  getConnection(connectionId: string): ManagedConnection | undefined {
    return this.connections.get(connectionId)
  }

  getActiveConnections(): ManagedConnection[] {
    const active: ManagedConnection[] = []
    for (const conn of this.connections.values()) {
      if (!conn.state.isTerminal) {
        active.push(conn)
      }
    }
    return active
  }

  /**
   * Send a connection request on an existing managed connection.
   * The connection must be in QUEUE_CREATED state with a non-null contactQueue.
   *
   * Steps:
   * 1. Build the full connection request (6 crypto layers)
   * 2. Get SMP client for Alice's contact queue server
   * 3. Send SKEY to secure sender on contact queue (Fast SMP v9)
   * 4. Send SEND to contact queue with the confirmation
   * 5. Drive state machine to PENDING
   */
  async sendConnectionRequest(
    connectionId: string,
    params: ConnectionRequestParams,
    aliceKey1Raw: Uint8Array,
    aliceKey2Raw: Uint8Array
  ): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) throw new Error("Connection not found: " + connectionId)

    if (conn.state.state !== "QUEUE_CREATED") {
      throw new Error("Connection must be in QUEUE_CREATED state, got: " + conn.state.state)
    }

    if (!conn.contactQueue) {
      throw new Error("Cannot send connection request: contactQueue is null (short link not resolved)")
    }

    try {
      // 1. Build the connection request
      const {smpEncConfirmation, senderAuthKeySPKI} = await buildConnectionRequest(
        conn, params, aliceKey1Raw, aliceKey2Raw
      )

      // 2. Get SMP client for Alice's server
      const contactServer = toSMPServerAddress(conn.contactQueue.server)
      const client = await this.agent.getClient(contactServer)

      // 3. Decode the senderId from the contact queue for entityId
      const senderIdBytes = base64urlDecode(conn.contactQueue.senderId)

      // 4. SKEY to secure sender (Fast SMP v9)
      await client.secureQueueSender(senderIdBytes, senderAuthKeySPKI)

      // 5. SEND the confirmation
      await client.sendMessage(senderIdBytes, {
        notification: true,
        encMessage: smpEncConfirmation,
      })

      // 6. Drive state machine to PENDING
      conn.state.transition("sendRequest")

    } catch (err) {
      conn.state.transition("error", {
        code: "REQUEST_SEND_FAILED",
        message: err instanceof Error ? err.message : "Unknown error",
        cause: err instanceof Error ? err : undefined,
      })
      throw err
    }
  }

  /**
   * Send a connection invitation to the contact queue (Step 2).
   * Simpler than sendConnectionRequest - no X3DH/Double Ratchet needed.
   * Uses NaCl Layer 1 encryption only.
   *
   * The connection must be in QUEUE_CREATED state with a non-null contactQueue.
   * After success, state transitions to PENDING.
   */
  async sendInvitation(
    connectionId: string,
    displayName: string
  ): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) throw new Error("Connection not found: " + connectionId)

    if (conn.state.state !== "QUEUE_CREATED") {
      throw new Error("Connection must be in QUEUE_CREATED state, got: " + conn.state.state)
    }

    if (!conn.contactQueue) {
      throw new Error("Cannot send invitation: contactQueue is null (short link not resolved)")
    }

    try {
      console.log("[SMP] sendInvitation: building invitation for '" + displayName + "'")

      // 1. Build the invitation (NaCl-encrypted agent envelope with our keys)
      const {smpEncConfirmation, queueDhKeyPair, ratchetKeyPair, ephemeralKeyPair} = await buildInvitation(conn, displayName, 6)
      conn.queueDhPrivateKey = queueDhKeyPair.privateKey
      conn.e2eKey1 = ratchetKeyPair
      conn.e2eKey2 = ephemeralKeyPair

      // 2. Get SMP client for the contact queue server.
      // The contact queue may be on a DIFFERENT server than our queue.
      // We need a separate connection with its own sessionId.
      const contactServer = toSMPServerAddress({
        hosts: conn.contactQueue.server.hosts,
        port: conn.contactQueue.server.port,
        serverIdentity: conn.contactQueue.server.serverIdentity,
      })

      // If using a WSS proxy, override host:port but keep server identity
      let serverForConnection = contactServer
      if (this.config.queueServer) {
        serverForConnection = toSMPServerAddress({
          hosts: this.config.queueServer.hosts,
          port: this.config.queueServer.port,
          serverIdentity: conn.contactQueue.server.serverIdentity,
        })
      }

      console.log("[SMP] sendInvitation: connecting to contact queue server " + serverForConnection.host + ":" + serverForConnection.port)
      const client = await this.agent.getClient(serverForConnection)

      // 3. The entityId for SEND = senderId from the contact address URI
      const contactSenderIdBytes = base64urlDecode(conn.contactQueue.senderId)
      console.log("[SMP] sendInvitation: entityId (contact senderId) = " + toHex(contactSenderIdBytes) + " (" + contactSenderIdBytes.length + "B)")

      // 4. SEND the invitation (unsigned, flag='F' = no push notification)
      console.log("[SMP] sendInvitation: smpEncConfirmation=" + smpEncConfirmation.length + "B, first 8:", Array.from(smpEncConfirmation.subarray(0, 8)).map(b => b.toString(16).padStart(2, "0")).join(" "))
      if (smpEncConfirmation.length < 100) {
        console.log("[SMP] sendInvitation: WARNING - encMessage too small! Expected ~16008B, got " + smpEncConfirmation.length + "B")
      }
      console.log("[SMP] sendInvitation: calling client.sendMessage with " + smpEncConfirmation.length + "B body")
      await client.sendMessage(contactSenderIdBytes, {
        notification: false,
        encMessage: smpEncConfirmation,
      })
      console.log("[SMP] sendInvitation: SEND accepted by server (OK)")

      // 5. Drive state machine to PENDING
      conn.state.transition("sendRequest")
      console.log("[SMP] sendInvitation: state -> PENDING")

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.log("[SMP] sendInvitation: FAILED: " + msg)
      conn.state.transition("error", {
        code: "REQUEST_SEND_FAILED",
        message: msg,
        cause: err instanceof Error ? err : undefined,
      })
      throw err
    }
  }

  /**
   * Set up MSG handler for a connection. Decrypts incoming MSG bodies
   * using the server DH key and recipient DH private key, parses the
   * RcvMsgBody, and sends ACK.
   *
   * @param connectionId - ID of the managed connection
   * @param onMsgBody - callback with the decrypted SEND body (smpEncConfirmation)
   */
  async setupMsgHandler(
    connectionId: string,
    onMsgBody: (msgBody: Uint8Array) => void
  ): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn || !conn.receiveQueue) return

    const targetServer = this.resolveTargetServer(conn.contactAddress)
    let serverForConnection = toSMPServerAddress(targetServer)
    if (this.config.queueServer) {
      serverForConnection = toSMPServerAddress({
        hosts: this.config.queueServer.hosts,
        port: this.config.queueServer.port,
        serverIdentity: targetServer.serverIdentity,
      })
    }

    const client = await this.agent.getClient(serverForConnection)
    const serverDhRaw = extractRawX25519(conn.receiveQueue.serverDhKey)
    const recipientDhPriv = conn.keys.recipientDh.privateKey
    const recipientAuthPriv = conn.keys.recipientAuth.privateKey
    const layer1DhPriv = conn.queueDhPrivateKey || conn.keys.recipientDh.privateKey
    const recipientId = conn.receiveQueue.recipientId

    client.onMessage((entityId, msgId, encBody) => {
      conn.msgCount++
      const msgNum = conn.msgCount
      console.log("[SMP] MSG #" + msgNum + " received: msgId=" + msgId.length + "B, encBody=" + encBody.length + "B")

      // Step 1: Decrypt server-to-recipient encryption
      const decrypted = decryptMsgBody(encBody, msgId, serverDhRaw, recipientDhPriv)
      if (!decrypted) {
        console.log("[SMP] MSG server decryption FAILED")
        return
      }
      console.log("[SMP] MSG server-decrypted: " + decrypted.length + "B")
      const msg = parseRcvMsgBody(decrypted)
      console.log("[SMP] MSG parsed: msgBody=" + msg.msgBody.length + "B, flags=" + msg.msgFlags)

      // Step 2: Decrypt Layer 1 NaCl (smpEncConfirmation -> smpConfirmation)
      try {
        const envelope = parseSmpEncConfirmation(msg.msgBody)
        const hasNewKey = envelope.aliceDhPublicKeyRaw !== null
        console.log("[SMP] Layer1: e2ePubKey=" + (hasNewKey ? envelope.aliceDhPublicKeyRaw!.length + "B" : "Nothing (reuse stored)") +
                    ", encBody=" + envelope.encryptedBody.length + "B")

        // Save alice DH key from first message for reuse
        if (hasNewKey && !conn.e2eDhPubKey) {
          conn.e2eDhPubKey = new Uint8Array(envelope.aliceDhPublicKeyRaw!)
          console.log("[SMP] Stored e2eDhPubKey for subsequent messages")
        }

        const l1Decrypted = decryptLayer1(envelope, layer1DhPriv, conn.e2eDhPubKey ?? undefined)
        if (!l1Decrypted) {
          console.log("[SMP] Layer1 decryption FAILED")
          onMsgBody(msg.msgBody)
          return
        }
        console.log("[SMP] Layer1 decrypted: " + l1Decrypted.length + "B")

        const confirmation = parseSmpConfirmation(l1Decrypted)
        console.log("[SMP] smpConfirmation: senderKey=" +
                    (confirmation.senderAuthKeySPKI ? confirmation.senderAuthKeySPKI.length + "B" : "none") +
                    ", body=" + confirmation.agentConfirmation.length + "B")
        const innerBody = confirmation.agentConfirmation

        if (msgNum === 1) {
          // --- First MSG: AgentConfirmation ---
          this.handleAgentConfirmation(conn, innerBody, onMsgBody, msg.msgBody)
        } else {
          // --- Subsequent MSGs: AgentMsgEnvelope (HELLO, etc.) ---
          this.handleAgentMsgEnvelope(conn, innerBody, msgNum, onMsgBody, msg.msgBody)
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e)
        console.log("[SMP] Layer1 parse/decrypt error: " + errMsg)
        onMsgBody(msg.msgBody)
      }

      // Step 3: ACK the message
      client.acknowledge(recipientId, msgId, recipientAuthPriv).then(() => {
        console.log("[SMP] ACK sent for msgId")
      }).catch((err: Error) => {
        console.log("[SMP] ACK failed: " + err.message)
      })
    })

    // Wire END detection - fires when the agent deletes the queue
    client.onSubscriptionEnd((_entityId) => {
      console.log("[SMP] Queue subscription ended (agent deleted contact)")
      if (conn.onConnectionEnded) {
        conn.onConnectionEnded()
      }
    })
  }

  /**
   * Handle the first MSG: AgentConfirmation with X3DH + Ratchet decrypt.
   */
  private handleAgentConfirmation(
    conn: ManagedConnection,
    innerBody: Uint8Array,
    onMsgBody: (body: Uint8Array) => void,
    rawMsgBody: Uint8Array
  ): void {
    console.log("[SMP] AgentConfirmation first 10B:", Array.from(innerBody.subarray(0, Math.min(10, innerBody.length))).map(b => b.toString(16).padStart(2, "0")).join(" "))

    try {
      const parsed = parseAgentConfirmation(innerBody)
      console.log("[SMP] AgentConfirmation parsed: agentVersion=" + parsed.agentVersion +
                  ", e2eVersion=" + parsed.e2eEncryption.e2eVersion +
                  ", encConnInfo=" + parsed.encConnInfo.length + "B")

      if (!conn.e2eKey1 || !conn.e2eKey2) {
        console.log("[SMP] X3DH skipped: e2eKey1/e2eKey2 not stored on connection")
        onMsgBody(rawMsgBody)
        return
      }

      // X3DH key agreement
      const initParams = x3dhReceiver(
        conn.e2eKey1,
        conn.e2eKey2,
        parsed.e2eEncryption.key1Raw,
        parsed.e2eEncryption.key2Raw
      )
      console.log("[SMP] X3DH complete: ratchetKey=" + initParams.ratchetKey.length + "B" +
                  ", sndHK=" + initParams.sndHK.length + "B" +
                  ", rcvNextHK=" + initParams.rcvNextHK.length + "B" +
                  ", assocData=" + initParams.assocData.length + "B")

      // Initialize ratchet and decrypt encConnInfo
      const ratchetState = initRcvRatchet(initParams, conn.e2eKey2)
      const {agentMessage, updatedState} = decryptEncConnInfo(ratchetState, parsed.encConnInfo)
      console.log("[SMP] encConnInfo decrypted! AgentMessage tag=0x" + agentMessage[0].toString(16) + ", length=" + agentMessage.length + "B")

      // Save ratchet state for subsequent messages (HELLO, etc.)
      conn.ratchetState = updatedState
      console.log("[SMP] Ratchet state saved (nr=" + updatedState.nr + ")")

      // Parse AgentConnInfoReply ('D' tag) to extract reply queue + connInfo
      if (agentMessage[0] === 0x44) { // 'D' = AgentConnInfoReply
        try {
          const reply = parseAgentConnInfoReply(agentMessage)
          if (reply.queues.length > 0) {
            conn.replyQueue = reply.queues[0]
            console.log("[SMP] Reply queue: " + reply.queues[0].serverHosts.join(",") + ":" + reply.queues[0].serverPort +
                        ", senderId=" + reply.queues[0].senderId.length + "B" +
                        ", dhKey=" + reply.queues[0].dhPublicKeyRaw.length + "B" +
                        ", sndSecure=" + reply.queues[0].sndSecure)
          }
          // Log connInfo JSON
          try {
            const text = new TextDecoder().decode(reply.connInfo)
            const jsonStart = text.indexOf("{")
            if (jsonStart >= 0) {
              console.log("[SMP] ConnInfo JSON: " + text.substring(jsonStart, jsonStart + 200))
            }
          } catch (_) {}
        } catch (parseErr) {
          console.log("[SMP] AgentConnInfoReply parse error: " + (parseErr instanceof Error ? parseErr.message : String(parseErr)))
          // Fall back to raw JSON search
          try {
            const text = new TextDecoder().decode(agentMessage)
            const jsonStart = text.indexOf("{")
            if (jsonStart >= 0) {
              console.log("[SMP] ConnInfo JSON (fallback): " + text.substring(jsonStart, jsonStart + 200))
            }
          } catch (_) {}
        }
      } else {
        console.log("[SMP] AgentMessage tag=0x" + agentMessage[0].toString(16) + " (expected 'D'=0x44)")
      }

      // Auto-send handshake reply if reply queue is available
      if (conn.replyQueue && !conn.handshakeSent) {
        const connId = conn.state.id
        console.log("[SMP] Auto-sending handshake reply to CLI's reply queue...")
        this.sendHandshake(connId, "GoChat User").then(() => {
          console.log("[SMP] Handshake reply sent successfully!")
        }).catch((err: Error) => {
          console.log("[SMP] Handshake reply FAILED: " + err.message)
        })
      }

      onMsgBody(rawMsgBody)
    } catch (err) {
      console.log("[SMP] AgentConfirmation parse/X3DH/Ratchet error: " + (err instanceof Error ? err.message : String(err)))
      onMsgBody(rawMsgBody)
    }
  }

  /**
   * Handle subsequent MSGs: AgentMsgEnvelope (tag 'M') with ratchet decrypt.
   * Parses the outer AgentMsgEnvelope, ratchet-decrypts the inner message,
   * and identifies the AgentMessage type (HELLO, etc.).
   */
  private handleAgentMsgEnvelope(
    conn: ManagedConnection,
    innerBody: Uint8Array,
    msgNum: number,
    onMsgBody: (body: Uint8Array) => void,
    rawMsgBody: Uint8Array
  ): void {
    // Parse AgentMsgEnvelope: [2B agentVersion][1B tag][...payload]
    let offset = 0
    const agentVersion = (innerBody[offset] << 8) | innerBody[offset + 1]
    offset += 2
    const envTag = innerBody[offset]
    offset += 1
    const envTagChar = String.fromCharCode(envTag)
    console.log("[SMP] MSG #" + msgNum + " AgentMsgEnvelope: agentVersion=" + agentVersion + ", tag='" + envTagChar + "' (0x" + envTag.toString(16) + ")")

    if (envTag !== 0x4D) { // 'M' = AgentMessage
      console.log("[SMP] MSG #" + msgNum + ": unexpected envelope tag '" + envTagChar + "', expected 'M'")
      onMsgBody(rawMsgBody)
      return
    }

    // encAgentMessage = Tail (everything remaining)
    const encAgentMessage = innerBody.subarray(offset)
    console.log("[SMP] encAgentMessage: " + encAgentMessage.length + "B")

    if (!conn.ratchetState) {
      console.log("[SMP] MSG #" + msgNum + ": no ratchet state available (AgentConfirmation not yet processed)")
      onMsgBody(rawMsgBody)
      return
    }

    // Ratchet decrypt
    try {
      const {agentMessage, updatedState} = rcDecrypt(conn.ratchetState, encAgentMessage)
      conn.ratchetState = updatedState
      console.log("[SMP] MSG #" + msgNum + " ratchet decrypted: " + agentMessage.length + "B, ratchet nr=" + updatedState.nr)

      // Parse AgentMessage: [1B tag][...content]
      // 'M' = A_MSG (contains APrivHeader + AMessage)
      const amTag = agentMessage[0]
      const amTagChar = String.fromCharCode(amTag)
      console.log("[SMP] AgentMessage tag='" + amTagChar + "' (0x" + amTag.toString(16) + ")")

      if (amTag === 0x4D) { // 'M' = A_MSG
        // APrivHeader + AMessage follow
        // APrivHeader = [2B prevMsgHash length][hash][...] - skip for now
        // For HELLO detection, scan for 'H' tag in AMessage
        // AMessage types: 'H' = HELLO, 'A' = A_MSG (chat message), etc.
        this.parseAgentMessageContent(conn, agentMessage, msgNum)
      } else {
        console.log("[SMP] MSG #" + msgNum + ": AgentMessage tag '" + amTagChar + "' - not A_MSG")
      }

      onMsgBody(rawMsgBody)
    } catch (err) {
      console.log("[SMP] MSG #" + msgNum + " ratchet decrypt error: " + (err instanceof Error ? err.message : String(err)))
      onMsgBody(rawMsgBody)
    }
  }

  /**
   * Parse AgentMessage content to identify HELLO and other message types.
   * AgentMessage = tag + APrivHeader + AMessage
   *
   * A_MSG ('M'): [1B 'M'][APrivHeader][AMessage]
   * APrivHeader: [Word16 prevMsgHash length][hash bytes]
   * AMessage: HELLO = 'H', A_MSG = 'M', ...
   */
  private parseAgentMessageContent(conn: ManagedConnection, agentMessage: Uint8Array, msgNum: number): void {
    let offset = 1 // skip outer 'M' tag

    // Read sndMsgId (Int64 BE, 8 bytes) - needed for receipt reference
    const incomingSndMsgId = this.readInt64BE(agentMessage, offset)
    offset += 8

    // APrivHeader: 1-byte length prefix for prevMsgHash
    const hashLen = agentMessage[offset]
    offset += 1
    offset += hashLen // skip the hash bytes
    console.log("[DIAG] APrivHeader: sndMsgId=" + incomingSndMsgId + ", prevMsgHash=" + hashLen + "B, remaining=" + (agentMessage.length - offset) + "B")

    // AMessage tag
    if (offset < agentMessage.length) {
      const innerTag = agentMessage[offset]
      const innerTagChar = String.fromCharCode(innerTag)
      console.log("[DIAG] AMessage tag='" + innerTagChar + "' (0x" + innerTag.toString(16) + ")")

      if (innerTag === 0x48) { // 'H' = HELLO
        console.log("[SMP] HELLO received! Connection established.")

        // Transition to CONNECTED on HELLO receive.
        // State machine: PENDING -> receiveConfirmation -> CONFIRMED -> acknowledgeConfirmation -> CONNECTED
        try {
          if (conn.state.state === "PENDING") {
            conn.state.transition("receiveConfirmation")
          }
          if (conn.state.state === "CONFIRMED") {
            conn.state.transition("acknowledgeConfirmation")
          }
          console.log("[SMP] State -> " + conn.state.state)
        } catch (_) {
          console.log("[SMP] State transition skipped (state=" + conn.state.state + ")")
        }

        // Send our HELLO back to CLI (best effort, non-blocking)
        if (conn.replyQueue && conn.handshakeSent) {
          const connId = conn.state.id
          console.log("[SMP] Auto-sending HELLO to CLI...")
          this.sendHello(connId).then(() => {
            console.log("[SMP] HELLO sent to CLI!")
          }).catch((err: Error) => {
            console.log("[SMP] HELLO send failed (non-fatal): " + err.message)
          })
        }
      } else if (innerTag === 0x4D) { // 'M' = A_MSG (chat message)
        const msgBody = agentMessage.slice(offset + 1)
        try {
          const msgText = new TextDecoder().decode(msgBody)
          console.log("[SMP] MSG #" + msgNum + " chat: " + msgText)

          // Parse x.msg.new JSON and extract text for UI callback
          try {
            const parsed = JSON.parse(msgText)
            if (parsed.event === "x.msg.new" && parsed.params?.content?.text) {
              const chatText = parsed.params.content.text
              console.log("[SMP] Chat message text: " + chatText)
              if (conn.onChatMessage) {
                conn.onChatMessage(chatText)
              }

              // Send delivery receipt back (best effort, non-blocking)
              // Do NOT send receipt for non-chat events (only x.msg.new)
              if (conn.replyQueue && conn.handshakeSent && conn.state.state === "CONNECTED") {
                const msgHash = new Uint8Array(sha256(agentMessage))
                this.sendReceipt(conn.state.id, incomingSndMsgId, msgHash).catch((err: Error) => {
                  console.log("[SMP] Receipt send failed (non-fatal): " + err.message)
                })
              }
            } else if (conn.onChatMessage) {
              // Pass raw JSON for non-standard events
              conn.onChatMessage(msgText)
            }
          } catch {
            // Not valid JSON, pass raw text
            if (conn.onChatMessage) {
              conn.onChatMessage(msgText)
            }
          }
        } catch {
          console.log("[SMP] MSG #" + msgNum + ": chat message received (" + msgBody.length + "B binary)")
        }
      } else if (innerTag === 0x56) { // 'V' = A_RCVD (delivery receipt)
        this.parseDeliveryReceipt(conn, agentMessage, offset + 1, msgNum)
      } else {
        console.log("[SMP] MSG #" + msgNum + ": AMessage tag '" + innerTagChar + "'")
      }
    }
  }

  // --- Delivery receipts ---

  /**
   * Read an Int64 BE value from a Uint8Array. Returns as Number (safe for sndMsgId counters).
   */
  private readInt64BE(data: Uint8Array, offset: number): number {
    // High 32 bits (usually 0 for small counters)
    const hi = ((data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]) >>> 0
    const lo = ((data[offset + 4] << 24) | (data[offset + 5] << 16) | (data[offset + 6] << 8) | data[offset + 7]) >>> 0
    return hi * 0x100000000 + lo
  }

  /**
   * Parse incoming A_RCVD delivery receipts (inner_tag 'V').
   * Each receipt references the agentMsgId of a message we sent.
   */
  private parseDeliveryReceipt(conn: ManagedConnection, data: Uint8Array, offset: number, msgNum: number): void {
    // count: Word8 (1 byte, NOT Word16!)
    const count = data[offset]
    offset += 1
    console.log("[SMP] MSG #" + msgNum + " delivery receipt: " + count + " receipt(s)")

    for (let i = 0; i < count; i++) {
      if (offset + 8 > data.length) break

      // agentMsgId: Int64 BE (8 bytes) - the sndMsgId of OUR sent message
      const agentMsgId = this.readInt64BE(data, offset)
      offset += 8

      // hashLen + hash: skip
      const rcptHashLen = data[offset]
      offset += 1 + rcptHashLen

      // rcptInfo: Word16 Large (2 bytes, NOT Word32!)
      offset += 2

      console.log("[SMP] Receipt " + (i + 1) + "/" + count + ": agentMsgId=" + agentMsgId)

      // Notify UI callback
      if (conn.onDeliveryReceipt) {
        conn.onDeliveryReceipt(agentMsgId)
      }
    }
  }

  /**
   * Send a delivery receipt (A_RCVD) for a received chat message.
   * Uses the same sendEncrypted pipeline as chat messages.
   *
   * @param connectionId - Connection ID
   * @param receivedMsgId - sndMsgId from the received message's APrivHeader
   * @param msgHash - SHA256 of the received message body
   */
  async sendReceipt(connectionId: string, receivedMsgId: number, msgHash: Uint8Array): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) return

    console.log("[SMP] sendReceipt: receipt for msgId=" + receivedMsgId)

    // Build AgentMessage: ['M'][APrivHeader]['V'][count=1][agentMsgId][hashLen][hash][rcptInfo]
    const privHeader = this.buildAPrivHeader(conn)

    // Receipt payload: count(1B) + agentMsgId(8B) + hashLen(1B) + hash(32B) + rcptInfo(2B) = 44B
    const receiptPayload = new Uint8Array(1 + 8 + 1 + msgHash.length + 2)
    let rOffset = 0
    receiptPayload[rOffset++] = 1 // count = 1 (Word8!)

    // agentMsgId (Int64 BE)
    receiptPayload[rOffset++] = 0
    receiptPayload[rOffset++] = 0
    receiptPayload[rOffset++] = 0
    receiptPayload[rOffset++] = 0
    receiptPayload[rOffset++] = (receivedMsgId >>> 24) & 0xFF
    receiptPayload[rOffset++] = (receivedMsgId >>> 16) & 0xFF
    receiptPayload[rOffset++] = (receivedMsgId >>> 8) & 0xFF
    receiptPayload[rOffset++] = receivedMsgId & 0xFF

    // hashLen + hash
    receiptPayload[rOffset++] = msgHash.length
    receiptPayload.set(msgHash, rOffset)
    rOffset += msgHash.length

    // rcptInfo (Word16 Large = 2 bytes, NOT Word32!)
    receiptPayload[rOffset++] = 0
    receiptPayload[rOffset++] = 0

    // Full AgentMessage: ['M'][APrivHeader]['V'][receiptPayload]
    const agentMessage = new Uint8Array(1 + privHeader.length + 1 + receiptPayload.length)
    agentMessage[0] = 0x4D // 'M' = A_MSG outer tag
    agentMessage.set(privHeader, 1)
    agentMessage[1 + privHeader.length] = 0x56 // 'V' = A_RCVD inner tag
    agentMessage.set(receiptPayload, 2 + privHeader.length)

    await this.sendEncrypted(
      conn,
      agentMessage,
      1,     // agentVersion = 1 (NOT 7!)
      0x4D,  // 'M' = AgentMsgEnvelope
      null,
      false, // subsequent message
      (envelope) => {
        const smpConf = new Uint8Array(1 + envelope.length)
        smpConf[0] = 0x5F // '_' = PHEmpty
        smpConf.set(envelope, 1)
        return smpConf
      }
    )

    console.log("[SMP] sendReceipt: sent for msgId=" + receivedMsgId)
  }

  // --- Shared send infrastructure ---

  private readonly X25519_SPKI_PREFIX = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00])

  /**
   * Build APrivHeader: [Word32 sndMsgId][1B prevMsgHash length][prevMsgHash bytes]
   */
  private buildAPrivHeader(conn: ManagedConnection): Uint8Array {
    const hashLen = conn.prevMsgHash.length
    const header = new Uint8Array(8 + 1 + hashLen)
    let offset = 0
    // sndMsgId (Int64 BE = Word64 BE) - high 32 bits = 0, low 32 bits = counter
    header[offset++] = 0
    header[offset++] = 0
    header[offset++] = 0
    header[offset++] = 0
    header[offset++] = (conn.sndMsgId >>> 24) & 0xFF
    header[offset++] = (conn.sndMsgId >>> 16) & 0xFF
    header[offset++] = (conn.sndMsgId >>> 8) & 0xFF
    header[offset++] = conn.sndMsgId & 0xFF
    // prevMsgHash: 1-byte length prefix + hash bytes
    header[offset++] = hashLen
    if (hashLen > 0) header.set(conn.prevMsgHash, offset)
    return header
  }

  /**
   * Shared send pipeline for messages to CLI's reply queue.
   *
   * Handles: rcEncrypt, envelope wrapping, NaCl per-queue encrypt, SEND.
   *
   * @param conn - Managed connection with ratchet state and reply queue
   * @param plaintext - AgentMessage plaintext (will be ratchet-encrypted)
   * @param agentVersion - 7 for AgentConfirmation, 1 for AgentMsgEnvelope
   * @param envelopeTag - 0x43 ('C') for confirmation, 0x4D ('M') for messages
   * @param extraEnvelopeBytes - extra bytes after tag (e.g. Maybe e2e Nothing '0' for 'C')
   * @param isFirstMessage - true = e2ePubKey=Just + pad 15904, false = Nothing + pad 15840
   * @param smpConfBuilder - builds smpConfirmation from the envelope bytes
   */
  private async sendEncrypted(
    conn: ManagedConnection,
    plaintext: Uint8Array,
    agentVersion: number,
    envelopeTag: number,
    extraEnvelopeBytes: Uint8Array | null,
    isFirstMessage: boolean,
    smpConfBuilder: (envelope: Uint8Array) => Uint8Array
  ): Promise<void> {
    if (!conn.replyQueue) throw new Error("No reply queue available")
    if (!conn.ratchetState) throw new Error("No ratchet state available")

    // Step 1: Calculate the correct ratchet body pad size.
    // Working backwards from the NaCl pad target:
    //   padTarget - 2 (Word16 prefix) - smpConfOverhead - envelopeOverhead - encRatchetOverhead
    // encRatchetOverhead = 2 (headerLen field) + 124 (emHeader v3 no KEM) + 16 (bodyAuthTag) = 142
    // The smpConfBuilder overhead depends on the caller (PHEmpty '_' = 1B, PHConfirmation 'K' = 46B)
    // We estimate using a test call, then compute the exact body pad.
    const envelopeOverhead = 2 + 1 + (extraEnvelopeBytes ? extraEnvelopeBytes.length : 0) // version + tag + extra
    const dummySmpConf = smpConfBuilder(new Uint8Array(0))
    const smpConfOverhead = dummySmpConf.length // overhead from builder (tag + key etc)
    const naclPadTarget = isFirstMessage ? 15904 : 15840
    const encRatchetOverhead = 142 // 2 + 124 + 16
    const bodyPadSize = naclPadTarget - 2 - smpConfOverhead - envelopeOverhead - encRatchetOverhead
    console.log("[SMP] sendEncrypted: bodyPadSize=" + bodyPadSize + " (naclPad=" + naclPadTarget + ", smpConfOH=" + smpConfOverhead + ", envOH=" + envelopeOverhead + ")")

    // Step 2: Ratchet encrypt with calculated body pad
    const {encrypted: encRatchetMessage, updatedState} = rcEncrypt(conn.ratchetState, plaintext, bodyPadSize)
    conn.ratchetState = updatedState
    console.log("[SMP] sendEncrypted: ratchet encrypted=" + encRatchetMessage.length + "B, ns=" + updatedState.ns)

    // Step 3: Wrap in envelope [Word16 agentVersion][tag][extraBytes][Tail encRatchetMessage]
    const extraLen = extraEnvelopeBytes ? extraEnvelopeBytes.length : 0
    const envelope = new Uint8Array(2 + 1 + extraLen + encRatchetMessage.length)
    envelope[0] = (agentVersion >> 8) & 0xFF
    envelope[1] = agentVersion & 0xFF
    envelope[2] = envelopeTag
    if (extraEnvelopeBytes) envelope.set(extraEnvelopeBytes, 3)
    envelope.set(encRatchetMessage, 3 + extraLen)
    console.log("[SMP] sendEncrypted: envelope=" + envelope.length + "B (v=" + agentVersion + ", tag=0x" + envelopeTag.toString(16) + ")")

    // Step 3: Wrap in smpConfirmation (caller-defined: 'K'+key or '_')
    const smpConfirmation = smpConfBuilder(envelope)

    // Step 4: NaCl encrypt with per-queue E2E
    const replyDhPubRaw = conn.replyQueue.dhPublicKeyRaw

    if (isFirstMessage) {
      // First message: generate new E2E keypair, include pubkey in header, pad 15904
      const senderE2eKeyPair = nacl.box.keyPair()
      conn.replyE2eKeyPair = senderE2eKeyPair

      const paddedSmpConf = pad(smpConfirmation, 15904)
      const nonce = nacl.randomBytes(24)
      const encryptedBody = nacl.box(paddedSmpConf, nonce, replyDhPubRaw, senderE2eKeyPair.secretKey)

      // Build: [Word16 smpClientVersion=4][Maybe '1'][keyLen=44][SPKI][nonce][encrypted]
      const senderDhSpki = new Uint8Array(44)
      senderDhSpki.set(this.X25519_SPKI_PREFIX)
      senderDhSpki.set(senderE2eKeyPair.publicKey, 12)

      const sendBody = new Uint8Array(2 + 1 + 1 + 44 + 24 + encryptedBody.length)
      let offset = 0
      sendBody[offset++] = 0x00; sendBody[offset++] = 0x04  // smpClientVersion=4
      sendBody[offset++] = 0x31 // '1' = Just
      sendBody[offset++] = 44
      sendBody.set(senderDhSpki, offset); offset += 44
      sendBody.set(nonce, offset); offset += 24
      sendBody.set(encryptedBody, offset)

      await this.sendToReplyQueue(conn, sendBody)
    } else {
      // Subsequent messages: reuse E2E keypair, e2ePubKey=Nothing, pad 15840
      if (!conn.replyE2eKeyPair) throw new Error("No E2E keypair for reply queue (handshake not sent?)")

      const paddedSmpConf = pad(smpConfirmation, 15840)
      const nonce = nacl.randomBytes(24)
      const encryptedBody = nacl.box(paddedSmpConf, nonce, replyDhPubRaw, conn.replyE2eKeyPair.secretKey)

      // Build: [Word16 smpClientVersion=4][Maybe '0'][nonce][encrypted]
      const sendBody = new Uint8Array(2 + 1 + 24 + encryptedBody.length)
      let offset = 0
      sendBody[offset++] = 0x00; sendBody[offset++] = 0x04  // smpClientVersion=4
      sendBody[offset++] = 0x30 // '0' = Nothing (reuse stored key)
      sendBody.set(nonce, offset); offset += 24
      sendBody.set(encryptedBody, offset)

      await this.sendToReplyQueue(conn, sendBody)
    }

    // Update send counter + prevMsgHash
    conn.prevMsgHash = new Uint8Array(sha256(plaintext))
    conn.sndMsgId++
  }

  /**
   * Send bytes to the CLI's reply queue via SMP SEND.
   */
  private async sendToReplyQueue(conn: ManagedConnection, sendBody: Uint8Array): Promise<void> {
    const signed = conn.replySenderAuthPrivKey !== null
    console.log("[SMP] sendToReplyQueue: SEND body=" + sendBody.length + "B, signed=" + signed)

    const targetServer = this.resolveTargetServer(conn.contactAddress)
    let serverForConnection = toSMPServerAddress(targetServer)
    if (this.config.queueServer) {
      serverForConnection = toSMPServerAddress({
        hosts: this.config.queueServer.hosts,
        port: this.config.queueServer.port,
        serverIdentity: targetServer.serverIdentity,
      })
    }

    const client = await this.agent.getClient(serverForConnection)
    const params = {notification: false, encMessage: sendBody}

    if (signed && conn.replySenderAuthPrivKey) {
      // Queue is secured after CLI sends KEY - all SENDs must be signed
      await client.sendMessageSigned(conn.replyQueue!.senderId, params, conn.replySenderAuthPrivKey)
    } else {
      // First SEND (handshake) before KEY - unsigned
      await client.sendMessage(conn.replyQueue!.senderId, params)
    }
    console.log("[SMP] sendToReplyQueue: SEND accepted (OK)")
  }

  // --- Public send methods ---

  /**
   * Send AgentConfirmation to CLI's reply queue (handshake completion).
   * Uses agentVersion=7, tag 'C', PHConfirmation 'K', e2ePubKey=Just.
   */
  async sendHandshake(connectionId: string, displayName: string): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) throw new Error("Connection not found: " + connectionId)
    if (conn.handshakeSent) {
      console.log("[SMP] sendHandshake: already sent, skipping")
      return
    }

    console.log("[SMP] sendHandshake: starting for '" + displayName + "'")

    // Build AgentMessage = ['I'][connInfo JSON]
    const connInfoJson = JSON.stringify({
      v: "1-16",
      event: "x.info",
      params: {
        profile: {
          displayName,
          fullName: "",
          preferences: {
            calls: {allow: "no"},
            files: {allow: "no"},
            voice: {allow: "no"},
            reactions: {allow: "yes"},
            fullDelete: {allow: "no"},
            timedMessages: {allow: "yes"},
          },
        },
      },
    })
    const connInfoBytes = new TextEncoder().encode(connInfoJson)
    const agentMessage = new Uint8Array(1 + connInfoBytes.length)
    agentMessage[0] = 0x49 // 'I' = AgentConnInfo
    agentMessage.set(connInfoBytes, 1)

    // Generate sender auth key BEFORE sendEncrypted so we can store it.
    // The CLI will use KEY to secure the reply queue with this public key.
    // After that, all SENDs must be signed with this private key.
    const senderAuthKeyPair = generateX25519KeyPair()
    const senderAuthKeySPKI = encodeX25519PublicKey(senderAuthKeyPair.publicKey)

    await this.sendEncrypted(
      conn,
      agentMessage,
      7,     // agentVersion = 7 for AgentConfirmation
      0x43,  // 'C' = AgentConfirmation
      new Uint8Array([0x30]),  // Maybe e2eEncryption_ = Nothing '0'
      true,  // first message to reply queue -> e2ePubKey=Just, pad 15904
      (envelope) => {
        // PHConfirmation 'K' with sender auth key
        const smpConf = new Uint8Array(1 + 1 + senderAuthKeySPKI.length + envelope.length)
        smpConf[0] = 0x4B // 'K'
        smpConf[1] = senderAuthKeySPKI.length
        smpConf.set(senderAuthKeySPKI, 2)
        smpConf.set(envelope, 2 + senderAuthKeySPKI.length)
        return smpConf
      }
    )

    // Store sender auth private key for signing subsequent SENDs
    // (after CLI sends KEY to secure the reply queue)
    conn.replySenderAuthPrivKey = senderAuthKeyPair.privateKey
    conn.handshakeSent = true
    console.log("[SMP] sendHandshake: complete! (sender auth key stored for signed SENDs)")
  }

  /**
   * Send HELLO to CLI after receiving their HELLO.
   * Uses agentVersion=1, tag 'M'. HELLO has no body after 'H' tag.
   */
  async sendHello(connectionId: string): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) throw new Error("Connection not found: " + connectionId)

    console.log("[SMP] sendHello: sending HELLO to CLI")

    // Build AgentMessage: ['M'][APrivHeader]['H']
    // Outer 'M' = A_MSG, inner 'H' = HELLO
    const privHeader = this.buildAPrivHeader(conn)
    const agentMessage = new Uint8Array(1 + privHeader.length + 1)
    agentMessage[0] = 0x4D // 'M' = A_MSG
    agentMessage.set(privHeader, 1)
    agentMessage[1 + privHeader.length] = 0x48 // 'H' = HELLO

    await this.sendEncrypted(
      conn,
      agentMessage,
      1,     // agentVersion = 1 for AgentMsgEnvelope (NOT 7!)
      0x4D,  // 'M' = AgentMsgEnvelope
      null,  // no extra bytes after tag
      false, // subsequent message -> e2ePubKey=Nothing, pad 15840
      (envelope) => {
        // PHEmpty '_' for messages
        const smpConf = new Uint8Array(1 + envelope.length)
        smpConf[0] = 0x5F // '_'
        smpConf.set(envelope, 1)
        return smpConf
      }
    )

    console.log("[SMP] sendHello: HELLO sent to CLI!")
  }

  /**
   * Send an encrypted chat message to CLI.
   * Uses agentVersion=1, tag 'M'. Body is JSON x.msg.new.
   */
  async sendChatMessage(connectionId: string, text: string): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) throw new Error("Connection not found: " + connectionId)

    console.log("[SMP] sendChatMessage: sending '" + text.substring(0, 50) + "'")

    // Build JSON body
    const jsonBody = new TextEncoder().encode(JSON.stringify({
      event: "x.msg.new",
      params: {
        content: {
          text,
          type: "text",
        },
      },
    }))

    // Build AgentMessage: ['M'][APrivHeader]['M'][Tail jsonBody]
    // Outer 'M' = A_MSG, inner 'M' = A_MSG content (chat message)
    const privHeader = this.buildAPrivHeader(conn)
    const agentMessage = new Uint8Array(1 + privHeader.length + 1 + jsonBody.length)
    agentMessage[0] = 0x4D // 'M' = A_MSG
    agentMessage.set(privHeader, 1)
    agentMessage[1 + privHeader.length] = 0x4D // 'M' = A_MSG content
    agentMessage.set(jsonBody, 2 + privHeader.length)

    await this.sendEncrypted(
      conn,
      agentMessage,
      1,     // agentVersion = 1 for AgentMsgEnvelope (NOT 7!)
      0x4D,  // 'M' = AgentMsgEnvelope
      null,  // no extra bytes after tag
      false, // subsequent message -> e2ePubKey=Nothing, pad 15840
      (envelope) => {
        // PHEmpty '_' for messages
        const smpConf = new Uint8Array(1 + envelope.length)
        smpConf[0] = 0x5F // '_'
        smpConf.set(envelope, 1)
        return smpConf
      }
    )

    console.log("[SMP] sendChatMessage: message sent!")
  }

  /**
   * Send x.direct.del notification to the agent before disconnecting.
   * Best effort - silently fails if connection is not CONNECTED or queue is gone.
   */
  async sendDeleteNotification(connectionId: string): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) return
    if (conn.state.state !== "CONNECTED") return
    if (!conn.replyQueue || !conn.handshakeSent) return

    console.log("[SMP] sendDeleteNotification: notifying agent")

    const jsonBody = new TextEncoder().encode(JSON.stringify({
      event: "x.direct.del",
      params: {},
    }))

    const privHeader = this.buildAPrivHeader(conn)
    const agentMessage = new Uint8Array(1 + privHeader.length + 1 + jsonBody.length)
    agentMessage[0] = 0x4D // 'M' = A_MSG
    agentMessage.set(privHeader, 1)
    agentMessage[1 + privHeader.length] = 0x4D // 'M' = A_MSG content
    agentMessage.set(jsonBody, 2 + privHeader.length)

    await this.sendEncrypted(
      conn,
      agentMessage,
      1,     // agentVersion = 1 (NOT 7!)
      0x4D,  // 'M' = AgentMsgEnvelope
      null,
      false,
      (envelope) => {
        const smpConf = new Uint8Array(1 + envelope.length)
        smpConf[0] = 0x5F // '_'
        smpConf.set(envelope, 1)
        return smpConf
      }
    )

    console.log("[SMP] sendDeleteNotification: agent notified")
  }

  async closeConnection(connectionId: string): Promise<void> {
    const conn = this.connections.get(connectionId)
    if (!conn) return

    // If queue was created and not yet in terminal state, try to delete it
    if (conn.receiveQueue && !conn.state.isTerminal) {
      try {
        const targetServer = this.resolveTargetServer(conn.contactAddress)
        const serverAddress = toSMPServerAddress(targetServer)
        const client = await this.agent.getClient(serverAddress)
        await client.deleteQueue(conn.receiveQueue.recipientId)
      } catch (_e) {
        // Best effort - queue deletion may fail if server is unreachable
      }
    }

    // Drive to CLOSED if not already terminal
    if (!conn.state.isTerminal) {
      conn.state.transition("close")
    } else if (conn.state.state === "ERROR") {
      conn.state.transition("close")
    }
  }

  private resolveTargetServer(contactAddress: ParsedContactAddress): {hosts: string[]; port: number; serverIdentity: string} {
    // Extract the server identity from the contact address.
    // This is the SHA-256 fingerprint of the SMP server's CA cert,
    // needed for the ClientHello keyHash even when connecting via WSS proxy.
    let addressIdentity = ""
    if (contactAddress.format === "full") {
      addressIdentity = contactAddress.data.smpQueues[0].server.serverIdentity
    } else {
      addressIdentity = contactAddress.data.server.serverIdentity
    }

    // Priority: explicit config (host:port) > address-derived
    // But ALWAYS preserve the server identity from the contact address
    // for the SMP handshake keyHash, even when overriding host:port
    // with a WSS proxy URL.
    if (this.config.queueServer) {
      return {
        hosts: this.config.queueServer.hosts,
        port: this.config.queueServer.port,
        serverIdentity: this.config.queueServer.serverIdentity || addressIdentity,
      }
    }

    if (contactAddress.format === "full") {
      const q = contactAddress.data.smpQueues[0]
      return {
        hosts: q.server.hosts,
        port: q.server.port,
        serverIdentity: q.server.serverIdentity,
      }
    }

    // Short link: use the server from the link data
    return {
      hosts: contactAddress.data.server.hosts,
      port: contactAddress.data.server.port,
      serverIdentity: contactAddress.data.server.serverIdentity,
    }
  }
}
