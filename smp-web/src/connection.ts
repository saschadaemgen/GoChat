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
  generateEd25519KeyPair,
  generateX25519KeyPair,
  encodeEd25519PublicKey,
  encodeX25519PublicKey,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import type {SMPClientAgent} from "./agent.js"
import type {SMPServerAddress} from "./types.js"
import {buildConnectionRequest} from "./connection-request.js"
import type {ConnectionRequestParams} from "./connection-request.js"

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
  // For now, we pass a placeholder since the real verification happens in the
  // TLS handshake. The mock tests use fake servers anyway.
  // In production, the serverIdentity from the URI would be decoded to keyHash.
  const keyHash = base64urlDecode(server.serverIdentity)
  return {
    host: server.hosts[0],
    port: server.port,
    keyHash,
  }
}

function base64urlDecode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(32) // placeholder for empty identity
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
    const contactAddress = parseContactAddress(contactAddressUri)

    // 2. Create state machine
    const state = new ConnectionStateMachine()

    // 3. Generate key pairs
    const keys: ConnectionKeys = {
      recipientAuth: generateEd25519KeyPair(),
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

    // 6. Create managed connection (initially without receiveQueue)
    const conn: ManagedConnection = {
      state,
      keys,
      contactAddress,
      contactQueue,
      receiveQueue: null,
    }

    // 7. Create receiving queue on the SMP server
    try {
      const serverAddress = toSMPServerAddress(targetServer)
      const client = await this.agent.getClient(serverAddress)

      const ids = await client.createQueue({
        recipientAuthKey: encodeEd25519PublicKey(keys.recipientAuth.publicKey),
        recipientDhKey: encodeX25519PublicKey(keys.recipientDh.publicKey),
        subscribeMode: this.config.subscribeMode ?? "S",
        sndSecure: this.config.sndSecure ?? true,
      })

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
