// SMPClient - wraps transport + handshake + command dispatch + PING/PONG keepalive.
//
// After connectSMP() completes, the client is ready to send commands and receive
// responses. SMP is NOT request/response like XFTP - the server can push MSG
// notifications at any time. The client dispatches incoming blocks by correlation
// ID: matching corrId goes to the response handler, empty corrId goes to the
// server push handler.
//
// Season 3 adds typed command methods that encode commands, send 16KB blocks,
// and return typed Promises resolved via corrId-matched dispatch.

import {Decoder, concatBytes, encodeBytes, encodeLarge} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"
import {encodeTransmission, decodeTransmission, decodeResponse} from "./protocol.js"
import type {SMPResponse, SMPError} from "./protocol.js"
import {SMPWebSocketTransport, SMP_BLOCK_SIZE} from "./transport.js"
import {
  decodeSMPServerHandshake,
  encodeSMPClientHandshake,
  compatibleVRange,
  smpClientVersionRange,
  verifyServerIdentity,
  buildCommandBlock,
  parseResponseBlock,
} from "./handshake.js"
import {
  encodeNEW, encodeSUB, encodeKEY, encodeSKEY, encodeSEND,
  encodeACK, encodeDEL, encodeOFF, encodeGET,
  encodeNKEY, encodeNDEL, encodeNSUB, encodeQUE,
} from "./commands.js"
import type {NewQueueParams, SendParams, EnableNotificationsParams} from "./commands.js"
import type {
  SMPServerAddress,
  ChatTransport,
  SMPClientState,
  SMPResponseHandler,
  SMPPushHandler,
} from "./types.js"
import {SMPTransportError} from "./types.js"

// -- Configuration

export interface SMPClientConfig {
  connectTimeoutMs?: number    // default 15000
  keepaliveIntervalMs?: number // default 30000 (30s PING interval)
  handshakeTimeoutMs?: number  // default 15000
  commandTimeoutMs?: number    // default 30000 (30s command response timeout)
}

const DEFAULT_CLIENT_CONFIG: Required<SMPClientConfig> = {
  connectTimeoutMs: 15000,
  keepaliveIntervalMs: 30000,
  handshakeTimeoutMs: 15000,
  commandTimeoutMs: 30000,
}

// -- Response helper types

export interface IDSResponse {
  recipientId: Uint8Array
  senderId: Uint8Array
  serverDhKey: Uint8Array
  sndSecure: boolean
}

export interface NIDResponse {
  notifierId: Uint8Array
  serverNtfDhKey: Uint8Array
}

// -- Error types

export class SMPCommandError extends Error {
  readonly smpError: SMPError
  constructor(smpError: SMPError) {
    super("SMP error: " + formatSMPError(smpError))
    this.name = "SMPCommandError"
    this.smpError = smpError
  }
}

export function formatSMPError(err: SMPError): string {
  switch (err.type) {
    case "BLOCK": return "BLOCK"
    case "SESSION": return "SESSION"
    case "AUTH": return "AUTH"
    case "QUOTA": return "QUOTA"
    case "LARGE_MSG": return "LARGE_MSG"
    case "INTERNAL": return "INTERNAL"
    case "CMD": return "CMD " + err.cmdError
    case "PROXY": return "PROXY " + formatProxyError(err.proxyError)
  }
}

function formatProxyError(err: import("./protocol.js").ProxyError): string {
  switch (err.type) {
    case "BASIC_AUTH": return "BASIC_AUTH"
    case "NO_SESSION": return "NO_SESSION"
    case "PROTOCOL": return "PROTOCOL " + formatSMPError(err.error)
    case "BROKER": return "BROKER " + formatBrokerError(err.brokerError)
  }
}

function formatBrokerError(err: import("./protocol.js").BrokerError): string {
  switch (err.type) {
    case "RESPONSE": return "RESPONSE " + err.info
    case "UNEXPECTED": return "UNEXPECTED " + err.info
    case "NETWORK": return "NETWORK"
    case "TIMEOUT": return "TIMEOUT"
    case "HOST": return "HOST"
    case "TRANSPORT": {
      const te = err.transportError
      if (typeof te === "string") return "TRANSPORT " + te
      return "TRANSPORT HANDSHAKE " + te.handshakeError
    }
  }
}

// -- Typed push handler types

export type MessageHandler = (recipientId: Uint8Array, msgId: Uint8Array, encryptedBody: Uint8Array) => void
export type SubscriptionEndHandler = (recipientId: Uint8Array) => void

// -- SMPClient interface

export interface SMPClient {
  readonly sessionId: Uint8Array
  readonly smpVersion: number
  readonly transport: ChatTransport
  readonly state: SMPClientState

  // Send a pre-encoded 16KB command block (fire and forget).
  // Response comes through onResponse or onServerPush.
  sendCommand(block: Uint8Array): Promise<void>

  // Register handler for responses to our commands (matched by corrId)
  onResponse(handler: SMPResponseHandler): void

  // Register handler for server-initiated pushes (MSG with empty corrId)
  onServerPush(handler: SMPPushHandler): void

  // Start PING/PONG keepalive
  startKeepalive(): void

  // Stop keepalive and close transport
  close(): void

  // -- Typed command methods (Season 3)

  // Create a new queue on the server. Uses empty entityId.
  createQueue(params: NewQueueParams): Promise<IDSResponse>

  // Subscribe to a queue for message delivery.
  subscribe(recipientId: Uint8Array): Promise<void>

  // Secure queue by recipient (set sender auth key).
  secureQueue(recipientId: Uint8Array, senderAuthKey: Uint8Array): Promise<void>

  // Secure queue by sender (v8+).
  secureQueueSender(senderId: Uint8Array, senderAuthKey: Uint8Array): Promise<void>

  // Send a message to a queue. Uses senderId as entityId.
  sendMessage(senderId: Uint8Array, params: SendParams): Promise<void>

  // Acknowledge message delivery.
  acknowledge(recipientId: Uint8Array, msgId: Uint8Array): Promise<void>

  // Delete a queue.
  deleteQueue(recipientId: Uint8Array): Promise<void>

  // Suspend a queue.
  suspendQueue(recipientId: Uint8Array): Promise<void>

  // Get a single message from queue (non-subscribing).
  getMessage(recipientId: Uint8Array): Promise<SMPResponse>

  // Enable push notifications for a queue.
  enableNotifications(recipientId: Uint8Array, params: EnableNotificationsParams): Promise<NIDResponse>

  // Disable push notifications for a queue.
  disableNotifications(recipientId: Uint8Array): Promise<void>

  // Get queue state information.
  getQueueInfo(recipientId: Uint8Array): Promise<string>

  // Register typed handler for MSG server pushes.
  onMessage(handler: MessageHandler): void

  // Register typed handler for END (subscription takeover) server pushes.
  onSubscriptionEnd(handler: SubscriptionEndHandler): void
}

// -- PING command encoding

// PING: ASCII bytes [0x50, 0x49, 0x4e, 0x47]
export function encodePING(): Uint8Array {
  return new Uint8Array([0x50, 0x49, 0x4e, 0x47])
}

// Generate a random 24-byte correlation ID for client commands.
// Format: 24 random bytes (corrId on wire is shortString: 0x18 + 24 bytes).
function generateCorrId(): Uint8Array {
  const id = new Uint8Array(24)
  crypto.getRandomValues(id)
  return id
}

// Convert Uint8Array to hex string for Map key lookup.
function toHex(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16)
  return s
}

// -- Pending command tracking

interface PendingCommand {
  resolve: (response: SMPResponse) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

// -- SMPClient implementation

export class SMPClientImpl implements SMPClient {
  readonly sessionId: Uint8Array
  readonly smpVersion: number
  readonly transport: ChatTransport
  private currentState: SMPClientState = "ready"
  private responseHandler: SMPResponseHandler | null = null
  private pushHandler: SMPPushHandler | null = null
  private messageHandler: MessageHandler | null = null
  private subscriptionEndHandler: SubscriptionEndHandler | null = null
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null
  private readonly keepaliveIntervalMs: number
  private readonly commandTimeoutMs: number
  private readonly pendingCommands: Map<string, PendingCommand> = new Map()

  constructor(
    sessionId: Uint8Array,
    smpVersion: number,
    transport: ChatTransport,
    keepaliveIntervalMs: number,
    commandTimeoutMs: number = 30000,
  ) {
    this.sessionId = sessionId
    this.smpVersion = smpVersion
    this.transport = transport
    this.keepaliveIntervalMs = keepaliveIntervalMs
    this.commandTimeoutMs = commandTimeoutMs
    this.setupDispatch()
  }

  get state(): SMPClientState {
    return this.currentState
  }

  private setupDispatch(): void {
    this.transport.onMessage((block: Uint8Array) => {
      try {
        // Parse the 16KB block into raw transmission bytes
        const transmissionBytes = parseResponseBlock(block)
        // Decode the transmission: auth, corrId, entityId, command
        const td = new Decoder(transmissionBytes)
        const {corrId, entityId, command} = decodeTransmission(td)

        // Dispatch by corrId:
        // - Non-empty corrId = response to our command
        // - Empty corrId = server push (MSG notification)
        if (corrId.length > 0) {
          const key = toHex(corrId)
          const pending = this.pendingCommands.get(key)
          if (pending) {
            // Matched a pending typed command - resolve Promise
            this.pendingCommands.delete(key)
            clearTimeout(pending.timer)
            try {
              const response = decodeResponse(new Decoder(command))
              pending.resolve(response)
            } catch (parseErr) {
              pending.reject(parseErr instanceof Error ? parseErr : new Error(String(parseErr)))
            }
          } else {
            // No pending typed command - fall through to raw handler
            if (this.responseHandler !== null) {
              this.responseHandler(corrId, entityId, command)
            }
          }
        } else {
          // Server push - dispatch to typed handlers first, then raw handler
          this.dispatchServerPush(entityId, command)
        }
      } catch (_e) {
        // Protocol error in incoming block.
        // Do not crash the dispatch loop. Reconnection handles dead connections.
      }
    })
  }

  private dispatchServerPush(entityId: Uint8Array, command: Uint8Array): void {
    try {
      const response = decodeResponse(new Decoder(command))
      if (response.type === "MSG" && this.messageHandler !== null) {
        this.messageHandler(entityId, response.msgId, response.encryptedBody)
      }
      if (response.type === "END" && this.subscriptionEndHandler !== null) {
        this.subscriptionEndHandler(entityId)
      }
    } catch (_e) {
      // Failed to parse server push. Ignore.
    }

    // Also fire raw push handler for backward compatibility
    if (this.pushHandler !== null) {
      this.pushHandler(entityId, command)
    }
  }

  // Send a typed command and wait for the corrId-matched response.
  private sendTypedCommand(entityId: Uint8Array, command: Uint8Array): Promise<SMPResponse> {
    if (this.currentState !== "ready") {
      return Promise.reject(new SMPTransportError("CLOSED", "Client is not ready"))
    }

    const corrId = generateCorrId()
    const transmission = encodeTransmission(corrId, entityId, command)
    const block = buildCommandBlock(transmission)
    const key = toHex(corrId)

    return new Promise<SMPResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(key)
        reject(new SMPTransportError("TIMEOUT", "Command response timeout after " + this.commandTimeoutMs + "ms"))
      }, this.commandTimeoutMs)

      this.pendingCommands.set(key, {resolve, reject, timer})

      this.transport.send(block).catch((err: Error) => {
        this.pendingCommands.delete(key)
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  // Helper: send command expecting OK, throw on ERR
  private async expectOK(entityId: Uint8Array, command: Uint8Array): Promise<void> {
    const response = await this.sendTypedCommand(entityId, command)
    if (response.type === "OK") return
    if (response.type === "ERR") throw new SMPCommandError(response.error)
    throw new Error("Unexpected response: " + response.type)
  }

  async sendCommand(block: Uint8Array): Promise<void> {
    if (this.currentState !== "ready") {
      throw new SMPTransportError("CLOSED", "Client is not ready")
    }
    await this.transport.send(block)
  }

  onResponse(handler: SMPResponseHandler): void {
    this.responseHandler = handler
  }

  onServerPush(handler: SMPPushHandler): void {
    this.pushHandler = handler
  }

  startKeepalive(): void {
    if (this.keepaliveTimer !== null) return
    this.keepaliveTimer = setInterval(() => {
      if (this.currentState !== "ready") return
      const corrId = generateCorrId()
      const transmission = encodeTransmission(corrId, new Uint8Array(0), encodePING())
      const block = buildCommandBlock(transmission)
      this.transport.send(block).catch(() => {
        // Send failed - connection may be dead.
        // Reconnection handles this.
      })
    }, this.keepaliveIntervalMs)
  }

  close(): void {
    this.currentState = "closed"
    if (this.keepaliveTimer !== null) {
      clearInterval(this.keepaliveTimer)
      this.keepaliveTimer = null
    }
    // Reject all pending commands
    for (const [key, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timer)
      pending.reject(new SMPTransportError("CLOSED", "Client closed"))
      this.pendingCommands.delete(key)
    }
    this.transport.close()
  }

  // -- Typed command methods

  async createQueue(params: NewQueueParams): Promise<IDSResponse> {
    const response = await this.sendTypedCommand(new Uint8Array(0), encodeNEW(params))
    if (response.type === "IDS") {
      return {
        recipientId: response.recipientId,
        senderId: response.senderId,
        serverDhKey: response.serverDhKey,
        sndSecure: response.sndSecure,
      }
    }
    if (response.type === "ERR") throw new SMPCommandError(response.error)
    throw new Error("Unexpected response to NEW: " + response.type)
  }

  async subscribe(recipientId: Uint8Array): Promise<void> {
    await this.expectOK(recipientId, encodeSUB())
  }

  async secureQueue(recipientId: Uint8Array, senderAuthKey: Uint8Array): Promise<void> {
    await this.expectOK(recipientId, encodeKEY(senderAuthKey))
  }

  async secureQueueSender(senderId: Uint8Array, senderAuthKey: Uint8Array): Promise<void> {
    await this.expectOK(senderId, encodeSKEY(senderAuthKey))
  }

  async sendMessage(senderId: Uint8Array, params: SendParams): Promise<void> {
    await this.expectOK(senderId, encodeSEND(params))
  }

  async acknowledge(recipientId: Uint8Array, msgId: Uint8Array): Promise<void> {
    await this.expectOK(recipientId, encodeACK(msgId))
  }

  async deleteQueue(recipientId: Uint8Array): Promise<void> {
    await this.expectOK(recipientId, encodeDEL())
  }

  async suspendQueue(recipientId: Uint8Array): Promise<void> {
    await this.expectOK(recipientId, encodeOFF())
  }

  async getMessage(recipientId: Uint8Array): Promise<SMPResponse> {
    const response = await this.sendTypedCommand(recipientId, encodeGET())
    if (response.type === "ERR") throw new SMPCommandError(response.error)
    return response
  }

  async enableNotifications(recipientId: Uint8Array, params: EnableNotificationsParams): Promise<NIDResponse> {
    const response = await this.sendTypedCommand(recipientId, encodeNKEY(params))
    if (response.type === "NID") {
      return {
        notifierId: response.notifierId,
        serverNtfDhKey: response.serverNtfDhKey,
      }
    }
    if (response.type === "ERR") throw new SMPCommandError(response.error)
    throw new Error("Unexpected response to NKEY: " + response.type)
  }

  async disableNotifications(recipientId: Uint8Array): Promise<void> {
    await this.expectOK(recipientId, encodeNDEL())
  }

  async getQueueInfo(recipientId: Uint8Array): Promise<string> {
    const response = await this.sendTypedCommand(recipientId, encodeQUE())
    if (response.type === "INFO") return response.info
    if (response.type === "ERR") throw new SMPCommandError(response.error)
    throw new Error("Unexpected response to QUE: " + response.type)
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler
  }

  onSubscriptionEnd(handler: SubscriptionEndHandler): void {
    this.subscriptionEndHandler = handler
  }
}

// -- Connect and handshake

// Connect to an SMP server, perform the handshake, and return an SMPClient.
//
// Flow:
// 1. Create SMPWebSocketTransport and open WSS connection
// 2. Wait for first 16KB block from server (ServerHello)
// 3. Decode ServerHello: version range, sessionId, certs, signed DH key
// 4. Verify server identity (fingerprint + DH key signature)
// 5. Version negotiation: agree on highest mutual version
// 6. Send ClientHello: negotiated version + key hash
// 7. Set up command dispatch and return SMPClient
export async function connectSMP(
  server: SMPServerAddress,
  config?: Partial<SMPClientConfig>
): Promise<SMPClient> {
  const cfg: Required<SMPClientConfig> = {...DEFAULT_CLIENT_CONFIG, ...config}

  // 1. Create transport and connect
  const transport = new SMPWebSocketTransport({connectTimeoutMs: cfg.connectTimeoutMs})
  await transport.connect(server)

  try {
    // 2. Wait for ServerHello (first 16KB block from server)
    const serverHelloBlock = await waitForBlock(transport, cfg.handshakeTimeoutMs)

    // 3. Decode ServerHello
    const serverHello = decodeSMPServerHandshake(serverHelloBlock)

    // 4. Verify server identity
    verifyServerIdentity(serverHello, server.keyHash)

    // 5. Version negotiation
    const vr = compatibleVRange(serverHello.smpVersionRange, smpClientVersionRange)
    if (vr === null) {
      throw new SMPTransportError(
        "VERSION",
        "Incompatible SMP version: server " +
          serverHello.smpVersionRange.minVersion + "-" +
          serverHello.smpVersionRange.maxVersion +
          ", client " + smpClientVersionRange.minVersion + "-" +
          smpClientVersionRange.maxVersion
      )
    }
    const smpVersion = vr.maxVersion

    // 6. Send ClientHello
    const clientHello = encodeSMPClientHandshake({
      smpVersion,
      keyHash: server.keyHash,
    })
    await transport.send(clientHello)

    // 7. Return client with command dispatch
    return new SMPClientImpl(
      serverHello.sessionId,
      smpVersion,
      transport,
      cfg.keepaliveIntervalMs,
      cfg.commandTimeoutMs,
    )
  } catch (e) {
    transport.close()
    throw e
  }
}

// Wait for one 16KB block from the transport with a timeout.
// Used to receive the ServerHello during handshake.
function waitForBlock(transport: ChatTransport, timeoutMs: number): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new SMPTransportError("TIMEOUT", "Handshake timeout: no ServerHello received"))
      }
    }, timeoutMs)

    transport.onMessage((block: Uint8Array) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(block)
      }
    })
  })
}
