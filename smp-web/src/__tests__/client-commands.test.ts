import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"
import {Decoder, concatBytes, encodeBytes} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"
import {encodeTransmission, decodeTransmission} from "../protocol.js"
import {buildCommandBlock, parseResponseBlock} from "../handshake.js"
import {SMPClientImpl, SMPCommandError, formatSMPError} from "../client.js"
import type {IDSResponse, NIDResponse} from "../client.js"
import type {ChatTransport, SMPServerAddress, TransportState, TransportEventHandler} from "../types.js"
import type {SMPResponse} from "../protocol.js"

// -- Mock transport

class MockTransport implements ChatTransport {
  sentBlocks: Uint8Array[] = []
  private messageHandler: TransportEventHandler | null = null
  private _state: TransportState = "connected"

  get state(): TransportState {
    return this._state
  }

  async connect(_server: SMPServerAddress): Promise<void> {}

  async send(block: Uint8Array): Promise<void> {
    this.sentBlocks.push(block)
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

  // Test helper: build and inject a response with specific corrId
  injectResponse(corrId: Uint8Array, entityId: Uint8Array, responseBytes: Uint8Array): void {
    const transmission = encodeTransmission(corrId, entityId, responseBytes)
    const block = buildCommandBlock(transmission)
    this.injectBlock(block)
  }

  // Test helper: extract corrId from the last sent block
  extractLastCorrId(): Uint8Array {
    const block = this.sentBlocks[this.sentBlocks.length - 1]
    const transmissionBytes = parseResponseBlock(block)
    const td = new Decoder(transmissionBytes)
    const {corrId} = decodeTransmission(td)
    return corrId
  }

  // Test helper: extract the full transmission from the last sent block
  extractLastTransmission(): {corrId: Uint8Array; entityId: Uint8Array; command: Uint8Array} {
    const block = this.sentBlocks[this.sentBlocks.length - 1]
    const transmissionBytes = parseResponseBlock(block)
    const td = new Decoder(transmissionBytes)
    return decodeTransmission(td)
  }
}

// -- ASCII helper

function ascii(s: string): Uint8Array {
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

function extractTag(command: Uint8Array): string {
  let s = ""
  for (const b of command) {
    if (b === 0x20) break
    s += String.fromCharCode(b)
  }
  return s
}

// -- Test setup

function createTestClient(transport?: MockTransport): {client: SMPClientImpl; transport: MockTransport} {
  const t = transport ?? new MockTransport()
  const sessionId = new Uint8Array(32).fill(0x01)
  const client = new SMPClientImpl(sessionId, 7, t, 30000, 5000) // 5s timeout for tests
  return {client, transport: t}
}

function fakeKey(fill: number): Uint8Array {
  return new Uint8Array(44).fill(fill)
}

// -- createQueue tests

describe("createQueue", () => {
  it("sends NEW command with empty entityId", async () => {
    const {client, transport} = createTestClient()

    const promise = client.createQueue({
      recipientAuthKey: fakeKey(0xAA),
      recipientDhKey: fakeKey(0xBB),
      subscribeMode: "S",
      sndSecure: true,
    })

    // Extract corrId and verify command
    const {corrId, entityId, command} = transport.extractLastTransmission()
    expect(entityId.length).toBe(0) // NEW uses empty entityId
    expect(extractTag(command)).toBe("NEW")

    // Inject IDS response
    const idsResponse = concatBytes(
      ascii("IDS "),
      encodeBytes(new Uint8Array(24).fill(0x11)), // recipientId
      encodeBytes(new Uint8Array(24).fill(0x22)), // senderId
      encodeBytes(new Uint8Array(44).fill(0x33)), // serverDhKey
      ascii("T") // sndSecure
    )
    transport.injectResponse(corrId, new Uint8Array(0), idsResponse)

    const result = await promise
    expect(result.recipientId).toEqual(new Uint8Array(24).fill(0x11))
    expect(result.senderId).toEqual(new Uint8Array(24).fill(0x22))
    expect(result.serverDhKey).toEqual(new Uint8Array(44).fill(0x33))
    expect(result.sndSecure).toBe(true)

    client.close()
  })

  it("throws SMPCommandError on ERR response", async () => {
    const {client, transport} = createTestClient()

    const promise = client.createQueue({
      recipientAuthKey: fakeKey(0xAA),
      recipientDhKey: fakeKey(0xBB),
      subscribeMode: "S",
      sndSecure: false,
    })

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, new Uint8Array(0), ascii("ERR AUTH"))

    await expect(promise).rejects.toThrow(SMPCommandError)
    await expect(promise).rejects.toThrow("AUTH")

    client.close()
  })
})

// -- subscribe tests

describe("subscribe", () => {
  it("sends SUB command with recipientId as entityId", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x55)

    const promise = client.subscribe(recipientId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("SUB")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, ascii("OK"))

    await promise // should resolve without error

    client.close()
  })
})

// -- secureQueue tests

describe("secureQueue", () => {
  it("sends KEY command with recipientId as entityId", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x66)
    const senderKey = fakeKey(0x77)

    const promise = client.secureQueue(recipientId, senderKey)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("KEY")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- secureQueueSender tests

describe("secureQueueSender", () => {
  it("sends SKEY command with senderId as entityId", async () => {
    const {client, transport} = createTestClient()
    const senderId = new Uint8Array(24).fill(0x88)
    const senderKey = fakeKey(0x99)

    const promise = client.secureQueueSender(senderId, senderKey)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(senderId)
    expect(extractTag(command)).toBe("SKEY")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, senderId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- sendMessage tests

describe("sendMessage", () => {
  it("sends SEND command with senderId as entityId", async () => {
    const {client, transport} = createTestClient()
    const senderId = new Uint8Array(24).fill(0xAA)
    const encMessage = new Uint8Array(100).fill(0xBB)

    const promise = client.sendMessage(senderId, {notification: true, encMessage})

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(senderId)
    expect(extractTag(command)).toBe("SEND")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, senderId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- acknowledge tests

describe("acknowledge", () => {
  it("sends ACK command with recipientId and msgId", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0xCC)
    const msgId = new Uint8Array(24).fill(0xDD)

    const promise = client.acknowledge(recipientId, msgId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("ACK")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- deleteQueue tests

describe("deleteQueue", () => {
  it("sends DEL command with recipientId", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0xEE)

    const promise = client.deleteQueue(recipientId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("DEL")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- suspendQueue tests

describe("suspendQueue", () => {
  it("sends OFF command with recipientId", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0xFF)

    const promise = client.suspendQueue(recipientId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("OFF")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- getMessage tests

describe("getMessage", () => {
  it("sends GET command and returns response", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x11)

    const promise = client.getMessage(recipientId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("GET")

    // Inject MSG response (getMessage can return MSG or OK)
    const msgId = new Uint8Array(24).fill(0x22)
    const body = new Uint8Array([0x01, 0x02, 0x03])
    const msgResponse = concatBytes(ascii("MSG "), encodeBytes(msgId), body)
    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, msgResponse)

    const result = await promise
    expect(result.type).toBe("MSG")

    client.close()
  })
})

// -- enableNotifications tests

describe("enableNotifications", () => {
  it("sends NKEY command and returns NID response", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x33)

    const promise = client.enableNotifications(recipientId, {
      notifierKey: fakeKey(0x44),
      recipientNtfDhKey: fakeKey(0x55),
    })

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("NKEY")

    const nidResponse = concatBytes(
      ascii("NID "),
      encodeBytes(new Uint8Array(20).fill(0x66)), // notifierId
      encodeBytes(new Uint8Array(44).fill(0x77)), // serverNtfDhKey
    )
    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, nidResponse)

    const result = await promise
    expect(result.notifierId).toEqual(new Uint8Array(20).fill(0x66))
    expect(result.serverNtfDhKey).toEqual(new Uint8Array(44).fill(0x77))

    client.close()
  })
})

// -- disableNotifications tests

describe("disableNotifications", () => {
  it("sends NDEL command with recipientId", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x88)

    const promise = client.disableNotifications(recipientId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("NDEL")

    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, ascii("OK"))

    await promise

    client.close()
  })
})

// -- getQueueInfo tests

describe("getQueueInfo", () => {
  it("sends QUE command and returns INFO string", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x99)

    const promise = client.getQueueInfo(recipientId)

    const {entityId, command} = transport.extractLastTransmission()
    expect(entityId).toEqual(recipientId)
    expect(extractTag(command)).toBe("QUE")

    const infoJson = '{"status":"active","queued":5}'
    const infoResponse = concatBytes(ascii("INFO "), ascii(infoJson))
    const corrId = transport.extractLastCorrId()
    transport.injectResponse(corrId, recipientId, infoResponse)

    const result = await promise
    expect(result).toBe(infoJson)

    client.close()
  })
})

// -- CorrId matching tests

describe("corrId matching", () => {
  it("matches responses to correct commands when out of order", async () => {
    const {client, transport} = createTestClient()
    const recipientId1 = new Uint8Array(24).fill(0x01)
    const recipientId2 = new Uint8Array(24).fill(0x02)

    // Send two commands
    const promise1 = client.subscribe(recipientId1)
    const corrId1 = transport.extractLastCorrId()

    const promise2 = client.deleteQueue(recipientId2)
    const corrId2 = transport.extractLastCorrId()

    // Respond in reverse order
    transport.injectResponse(corrId2, recipientId2, ascii("OK"))
    transport.injectResponse(corrId1, recipientId1, ascii("OK"))

    // Both should resolve correctly
    await promise1
    await promise2

    client.close()
  })
})

// -- Timeout tests

describe("command timeout", () => {
  it("rejects with TIMEOUT when no response received", async () => {
    const transport = new MockTransport()
    // Use very short timeout (50ms) for testing
    const sessionId = new Uint8Array(32)
    const client = new SMPClientImpl(sessionId, 7, transport, 30000, 50)

    const recipientId = new Uint8Array(24).fill(0x01)
    const promise = client.subscribe(recipientId)

    // Do NOT inject a response - let it timeout

    await expect(promise).rejects.toThrow("timeout")

    client.close()
  })
})

// -- Server push tests

describe("server push dispatch", () => {
  it("dispatches MSG push to onMessage handler", async () => {
    const {client, transport} = createTestClient()

    const receivedMessages: Array<{entityId: Uint8Array; msgId: Uint8Array; body: Uint8Array}> = []
    client.onMessage((entityId, msgId, body) => {
      receivedMessages.push({entityId, msgId, body})
    })

    // Inject MSG push with empty corrId (server push)
    const recipientId = new Uint8Array(24).fill(0xAA)
    const msgId = new Uint8Array(24).fill(0xBB)
    const body = new Uint8Array([0x01, 0x02, 0x03])
    const msgCommand = concatBytes(ascii("MSG "), encodeBytes(msgId), body)

    transport.injectResponse(new Uint8Array(0), recipientId, msgCommand)

    // Wait a tick for async dispatch
    await new Promise(r => setTimeout(r, 10))

    expect(receivedMessages.length).toBe(1)
    expect(receivedMessages[0].entityId).toEqual(recipientId)
    expect(receivedMessages[0].msgId).toEqual(msgId)
    expect(receivedMessages[0].body).toEqual(body)

    client.close()
  })

  it("dispatches END push to onSubscriptionEnd handler", async () => {
    const {client, transport} = createTestClient()

    const receivedEnds: Uint8Array[] = []
    client.onSubscriptionEnd((entityId) => {
      receivedEnds.push(entityId)
    })

    const recipientId = new Uint8Array(24).fill(0xCC)
    transport.injectResponse(new Uint8Array(0), recipientId, ascii("END"))

    await new Promise(r => setTimeout(r, 10))

    expect(receivedEnds.length).toBe(1)
    expect(receivedEnds[0]).toEqual(recipientId)

    client.close()
  })

  it("also fires raw onServerPush for backward compatibility", async () => {
    const {client, transport} = createTestClient()

    const rawPushes: Array<{entityId: Uint8Array; command: Uint8Array}> = []
    client.onServerPush((entityId, command) => {
      rawPushes.push({entityId, command})
    })

    const recipientId = new Uint8Array(24).fill(0xDD)
    transport.injectResponse(new Uint8Array(0), recipientId, ascii("END"))

    await new Promise(r => setTimeout(r, 10))

    expect(rawPushes.length).toBe(1)

    client.close()
  })
})

// -- SMPCommandError formatting tests

describe("SMPCommandError", () => {
  it("formats AUTH error", () => {
    const err = new SMPCommandError({type: "AUTH"})
    expect(err.message).toBe("SMP error: AUTH")
    expect(err.smpError.type).toBe("AUTH")
  })

  it("formats CMD SYNTAX error", () => {
    const err = new SMPCommandError({type: "CMD", cmdError: "SYNTAX"})
    expect(err.message).toBe("SMP error: CMD SYNTAX")
  })

  it("formats PROXY BROKER TIMEOUT error", () => {
    const err = new SMPCommandError({
      type: "PROXY",
      proxyError: {type: "BROKER", brokerError: {type: "TIMEOUT"}},
    })
    expect(err.message).toBe("SMP error: PROXY BROKER TIMEOUT")
  })

  it("formats PROXY BROKER TRANSPORT HANDSHAKE IDENTITY error", () => {
    const err = new SMPCommandError({
      type: "PROXY",
      proxyError: {
        type: "BROKER",
        brokerError: {
          type: "TRANSPORT",
          transportError: {type: "HANDSHAKE", handshakeError: "IDENTITY"},
        },
      },
    })
    expect(err.message).toBe("SMP error: PROXY BROKER TRANSPORT HANDSHAKE IDENTITY")
  })
})

// -- formatSMPError tests

describe("formatSMPError", () => {
  it("formats all simple error types", () => {
    expect(formatSMPError({type: "BLOCK"})).toBe("BLOCK")
    expect(formatSMPError({type: "SESSION"})).toBe("SESSION")
    expect(formatSMPError({type: "QUOTA"})).toBe("QUOTA")
    expect(formatSMPError({type: "LARGE_MSG"})).toBe("LARGE_MSG")
    expect(formatSMPError({type: "INTERNAL"})).toBe("INTERNAL")
  })
})

// -- Close rejects pending commands

describe("close behavior", () => {
  it("rejects pending commands when client is closed", async () => {
    const {client, transport} = createTestClient()
    const recipientId = new Uint8Array(24).fill(0x01)

    const promise = client.subscribe(recipientId)

    // Close without responding
    client.close()

    await expect(promise).rejects.toThrow("closed")
  })
})
