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
import {initRcvRatchet, decryptEncConnInfo, rcDecrypt} from "./ratchet-decrypt.js"
import type {RatchetState} from "./ratchet-decrypt.js"
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
        this.parseAgentMessageContent(agentMessage, msgNum)
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
  private parseAgentMessageContent(agentMessage: Uint8Array, msgNum: number): void {
    let offset = 1 // skip outer 'M' tag
    offset += 8    // skip sndMsgId (Int64 BE, 8 bytes)

    // APrivHeader: Word16 BE length prefix for prevMsgHash
    const hashLen = agentMessage[offset]
    offset += 1
    offset += hashLen // skip the hash bytes
    console.log("[DIAG] APrivHeader: prevMsgHash=" + hashLen + "B, remaining=" + (agentMessage.length - offset) + "B")

    // AMessage tag
    if (offset < agentMessage.length) {
      const innerTag = agentMessage[offset]
      const innerTagChar = String.fromCharCode(innerTag)
      console.log("[DIAG] AMessage tag='" + innerTagChar + "' (0x" + innerTag.toString(16) + ")")

      if (innerTag === 0x48) { // 'H' = HELLO
        console.log("[SMP] HELLO received! Connection established.")
        console.log("[SMP] MSG #" + msgNum + " is HELLO - bidirectional ratchet confirmed")
      } else if (innerTag === 0x4D) { // 'M' = A_MSG (chat message)
        console.log("[SMP] MSG #" + msgNum + ": chat message received")
      } else {
        console.log("[SMP] MSG #" + msgNum + ": AMessage tag '" + innerTagChar + "'")
      }
    }
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
