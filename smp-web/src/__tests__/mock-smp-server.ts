// Mock SMP server for integration testing.
//
// Simulates server-side SMP queue operations without network.
// Intercepts blocks sent via MockTransport, parses commands,
// generates appropriate responses, and injects them back.
//
// Does NOT implement real crypto, signature verification, or
// basic auth. Handles happy path and a few error cases.

import {Decoder, concatBytes, encodeBytes} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"
import {encodeTransmission, decodeTransmission} from "../protocol.js"
import {buildCommandBlock, parseResponseBlock} from "../handshake.js"
import type {ChatTransport, SMPServerAddress, TransportState, TransportEventHandler} from "../types.js"

// -- ASCII helper

function ascii(s: string): Uint8Array {
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

function toHex(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16)
  return s
}

// -- Read command tag from raw command bytes

function readCommandTag(command: Uint8Array): string {
  let s = ""
  for (const b of command) {
    if (b === 0x20) break // stop at space
    s += String.fromCharCode(b)
  }
  return s
}

// -- Mock transport (shared with client-commands.test.ts pattern)

export class MockTransport implements ChatTransport {
  sentBlocks: Uint8Array[] = []
  private messageHandler: TransportEventHandler | null = null
  private _state: TransportState = "connected"
  // Callback for when a block is sent (used by MockSMPServer)
  onBlockSent: ((block: Uint8Array) => void) | null = null

  get state(): TransportState {
    return this._state
  }

  async connect(_server: SMPServerAddress): Promise<void> {}

  async send(block: Uint8Array): Promise<void> {
    this.sentBlocks.push(block)
    if (this.onBlockSent) this.onBlockSent(block)
  }

  onMessage(handler: TransportEventHandler): void {
    this.messageHandler = handler
  }

  close(): void {
    this._state = "disconnected"
  }

  // Test helper: inject a 16KB response block
  injectBlock(block: Uint8Array): void {
    if (this.messageHandler) this.messageHandler(block)
  }
}

// -- Mock queue state

interface MockQueue {
  recipientId: Uint8Array
  senderId: Uint8Array
  recipientAuthKey: Uint8Array
  recipientDhKey: Uint8Array
  senderAuthKey: Uint8Array | null
  serverDhKey: Uint8Array
  subscribed: boolean
  suspended: boolean
  messages: Array<{msgId: Uint8Array; body: Uint8Array}>
  sndSecure: boolean
}

// -- Mock SMP server

let nextId = 1

function generateId(len: number): Uint8Array {
  const id = new Uint8Array(len)
  for (let i = 0; i < len; i++) id[i] = (nextId + i) & 0xFF
  nextId += len
  return id
}

export class MockSMPServer {
  private queues: Map<string, MockQueue> = new Map() // keyed by hex recipientId
  private senderIndex: Map<string, string> = new Map() // hex senderId -> hex recipientId
  private readonly transport: MockTransport

  constructor(transport: MockTransport) {
    this.transport = transport
  }

  // Start processing blocks sent by the client
  start(): void {
    this.transport.onBlockSent = (block: Uint8Array) => {
      // Process asynchronously to simulate real server behavior
      queueMicrotask(() => this.processBlock(block))
    }
  }

  // Stop processing
  stop(): void {
    this.transport.onBlockSent = null
  }

  // Simulate subscription takeover: send END to the current subscriber
  simulateSubscriptionTakeover(recipientId: Uint8Array): void {
    const key = toHex(recipientId)
    const queue = this.queues.get(key)
    if (queue && queue.subscribed) {
      queue.subscribed = false
      this.sendPush(recipientId, ascii("END"))
    }
  }

  // Process a sent block
  private processBlock(block: Uint8Array): void {
    try {
      const transmissionBytes = parseResponseBlock(block)
      const td = new Decoder(transmissionBytes)
      const {corrId, entityId, command} = decodeTransmission(td)

      const tag = readCommandTag(command)

      switch (tag) {
        case "NEW": this.handleNEW(corrId, command); break
        case "SUB": this.handleSUB(corrId, entityId); break
        case "KEY": this.handleKEY(corrId, entityId, command); break
        case "SKEY": this.handleSKEY(corrId, entityId, command); break
        case "SEND": this.handleSEND(corrId, entityId, command); break
        case "ACK": this.handleACK(corrId, entityId); break
        case "DEL": this.handleDEL(corrId, entityId); break
        case "OFF": this.handleOFF(corrId, entityId); break
        case "GET": this.handleGET(corrId, entityId); break
        case "PING": this.handlePING(corrId); break
        case "QUE": this.handleQUE(corrId, entityId); break
        default:
          this.sendResponse(corrId, entityId, ascii("ERR CMD SYNTAX"))
      }
    } catch (_e) {
      // Failed to parse block - ignore
    }
  }

  // -- Command handlers

  private handleNEW(corrId: Uint8Array, command: Uint8Array): void {
    // Parse NEW params: skip "NEW " (4 bytes), then read keys
    // Fields separated by spaces per SMP ABNF
    const d = new Decoder(command.subarray(4))
    const recipientAuthKey = this.readShortString(d)
    this.skipSpace(d)
    const recipientDhKey = this.readShortString(d)

    // Read basicAuth (preceded by space)
    this.skipSpace(d)
    const authFlag = d.anyByte()
    if (authFlag === 0x31) {
      // "1" + shortString password - skip it
      this.readShortString(d)
    }

    // Read subscribeMode and sndSecure (preceded by spaces)
    this.skipSpace(d)
    const subMode = String.fromCharCode(d.anyByte())
    let sndSecure = false
    if (d.remaining() > 0) {
      this.skipSpace(d)
      const sndSecureFlag = String.fromCharCode(d.anyByte())
      sndSecure = sndSecureFlag === "T"
    }

    const recipientId = generateId(24)
    const senderId = generateId(24)
    const serverDhKey = generateId(32)

    const queue: MockQueue = {
      recipientId,
      senderId,
      recipientAuthKey,
      recipientDhKey,
      senderAuthKey: null,
      serverDhKey,
      subscribed: subMode === "S",
      suspended: false,
      messages: [],
      sndSecure,
    }

    this.queues.set(toHex(recipientId), queue)
    this.senderIndex.set(toHex(senderId), toHex(recipientId))

    // Build IDS response
    const idsResponse = concatBytes(
      ascii("IDS "),
      encodeBytes(recipientId),
      encodeBytes(senderId),
      encodeBytes(serverDhKey),
      ascii(sndSecure ? "T" : "F")
    )
    this.sendResponse(corrId, new Uint8Array(0), idsResponse)
  }

  private handleSUB(corrId: Uint8Array, entityId: Uint8Array): void {
    const queue = this.findQueueByRecipient(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }
    if (queue.suspended) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    queue.subscribed = true

    if (queue.messages.length > 0) {
      // Deliver first pending message
      this.sendResponse(corrId, entityId, ascii("OK"))
      const msg = queue.messages[0]
      this.deliverMessage(entityId, msg.msgId, msg.body)
    } else {
      this.sendResponse(corrId, entityId, ascii("OK"))
    }
  }

  private handleKEY(corrId: Uint8Array, entityId: Uint8Array, command: Uint8Array): void {
    const queue = this.findQueueByRecipient(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    // Parse KEY: skip "KEY " (4 bytes), read key (Word16 BE prefix)
    const d = new Decoder(command.subarray(4))
    const senderAuthKey = this.readShortString(d)
    queue.senderAuthKey = senderAuthKey

    this.sendResponse(corrId, entityId, ascii("OK"))
  }

  private handleSKEY(corrId: Uint8Array, entityId: Uint8Array, command: Uint8Array): void {
    const queue = this.findQueueBySender(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    // Parse SKEY: skip "SKEY " (5 bytes), read key (Word16 BE prefix)
    const d = new Decoder(command.subarray(5))
    const senderAuthKey = this.readShortString(d)
    queue.senderAuthKey = senderAuthKey

    this.sendResponse(corrId, entityId, ascii("OK"))
  }

  private handleSEND(corrId: Uint8Array, entityId: Uint8Array, command: Uint8Array): void {
    const queue = this.findQueueBySender(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }
    if (queue.suspended) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    // Parse SEND: skip "SEND " (5 bytes), then flag + space + body
    // Flag is T or F (1 byte), then space (1 byte), then encrypted message
    const body = command.subarray(7) // 5 (SEND ) + 1 (flag) + 1 (space)

    const msgId = generateId(24)
    queue.messages.push({msgId, body: new Uint8Array(body)})

    this.sendResponse(corrId, entityId, ascii("OK"))

    // If subscribed, deliver immediately
    if (queue.subscribed && queue.messages.length === 1) {
      this.deliverMessage(queue.recipientId, msgId, new Uint8Array(body))
    }
  }

  private handleACK(corrId: Uint8Array, entityId: Uint8Array): void {
    const queue = this.findQueueByRecipient(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }
    if (!queue.subscribed) {
      this.sendResponse(corrId, entityId, ascii("ERR CMD PROHIBITED"))
      return
    }

    // Remove first message
    if (queue.messages.length > 0) {
      queue.messages.shift()
    }

    this.sendResponse(corrId, entityId, ascii("OK"))

    // Deliver next message if any
    if (queue.messages.length > 0 && queue.subscribed) {
      const next = queue.messages[0]
      this.deliverMessage(entityId, next.msgId, next.body)
    }
  }

  private handleDEL(corrId: Uint8Array, entityId: Uint8Array): void {
    const key = toHex(entityId)
    const queue = this.queues.get(key)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    this.queues.delete(key)
    this.senderIndex.delete(toHex(queue.senderId))

    this.sendResponse(corrId, entityId, ascii("OK"))
  }

  private handleOFF(corrId: Uint8Array, entityId: Uint8Array): void {
    const queue = this.findQueueByRecipient(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    queue.suspended = true
    queue.subscribed = false

    this.sendResponse(corrId, entityId, ascii("OK"))
  }

  private handleGET(corrId: Uint8Array, entityId: Uint8Array): void {
    const queue = this.findQueueByRecipient(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    if (queue.messages.length > 0) {
      const msg = queue.messages[0]
      const msgResponse = concatBytes(ascii("MSG "), encodeBytes(msg.msgId), msg.body)
      this.sendResponse(corrId, entityId, msgResponse)
    } else {
      this.sendResponse(corrId, entityId, ascii("OK"))
    }
  }

  private handlePING(corrId: Uint8Array): void {
    this.sendResponse(corrId, new Uint8Array(0), ascii("PONG"))
  }

  private handleQUE(corrId: Uint8Array, entityId: Uint8Array): void {
    const queue = this.findQueueByRecipient(entityId)
    if (!queue) {
      this.sendResponse(corrId, entityId, ascii("ERR AUTH"))
      return
    }

    const info = JSON.stringify({
      queued: queue.messages.length,
      subscribed: queue.subscribed,
      suspended: queue.suspended,
    })
    const infoResponse = concatBytes(ascii("INFO "), ascii(info))
    this.sendResponse(corrId, entityId, infoResponse)
  }

  // -- Helpers

  private findQueueByRecipient(entityId: Uint8Array): MockQueue | undefined {
    return this.queues.get(toHex(entityId))
  }

  private findQueueBySender(entityId: Uint8Array): MockQueue | undefined {
    const recipientKey = this.senderIndex.get(toHex(entityId))
    if (!recipientKey) return undefined
    return this.queues.get(recipientKey)
  }

  private readShortString(d: Decoder): Uint8Array {
    const len = d.anyByte()
    return d.take(len)
  }

  private skipSpace(d: Decoder): void {
    if (d.remaining() > 0 && d.buf[d.offset()] === 0x20) {
      d.anyByte() // consume space
    }
  }

  private sendResponse(corrId: Uint8Array, entityId: Uint8Array, responseCommand: Uint8Array): void {
    const transmission = encodeTransmission(corrId, entityId, responseCommand)
    const block = buildCommandBlock(transmission)
    this.transport.injectBlock(block)
  }

  private sendPush(recipientId: Uint8Array, command: Uint8Array): void {
    // Server pushes use empty corrId
    this.sendResponse(new Uint8Array(0), recipientId, command)
  }

  private deliverMessage(recipientId: Uint8Array, msgId: Uint8Array, body: Uint8Array): void {
    const msgCommand = concatBytes(ascii("MSG "), encodeBytes(msgId), body)
    this.sendPush(recipientId, msgCommand)
  }
}
