// End-to-end integration tests for SMP messaging.
//
// Uses MockSMPServer and MockTransport to verify the full flow:
// command encoders (Task 1) + response decoders (Task 2) +
// typed client methods (Task 3) all working together.

import {describe, it, expect, beforeEach, afterEach} from "vitest"
import {MockTransport, MockSMPServer} from "./mock-smp-server.js"
import {SMPClientImpl, SMPCommandError} from "../client.js"
import type {SMPClient} from "../client.js"

// -- Test helpers

function fakeKey(fill: number): Uint8Array {
  return new Uint8Array(44).fill(fill)
}

function createTestSetup(smpVersion = 7): {client: SMPClientImpl; transport: MockTransport; server: MockSMPServer} {
  const transport = new MockTransport()
  const server = new MockSMPServer(transport)
  server.start()
  const sessionId = new Uint8Array(32).fill(0x01)
  const client = new SMPClientImpl(sessionId, smpVersion, transport, 30000, 5000)
  return {client, transport, server}
}

// Helper to wait for async server processing (queueMicrotask)
function tick(): Promise<void> {
  return new Promise(r => setTimeout(r, 20))
}

// -- Scenario 1: Full messaging roundtrip (classic SMP procedure)

describe("Scenario 1: Full messaging roundtrip", () => {
  let client: SMPClientImpl
  let transport: MockTransport
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup()
    client = setup.client
    transport = setup.transport
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("completes NEW -> KEY -> SEND -> MSG -> ACK -> DEL flow", async () => {
    // 1. Create queue
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0xAA),
      recipientDhKey: fakeKey(0xBB),
      subscribeMode: "S",
      sndSecure: false,
    })

    expect(ids.recipientId.length).toBe(24)
    expect(ids.senderId.length).toBe(24)
    expect(ids.serverDhKey.length).toBe(32)
    expect(ids.sndSecure).toBe(false)

    // 2. Secure queue
    await client.secureQueue(ids.recipientId, fakeKey(0xCC))

    // 3. Register message handler
    const receivedMessages: Array<{entityId: Uint8Array; msgId: Uint8Array; body: Uint8Array}> = []
    client.onMessage((entityId, msgId, body) => {
      receivedMessages.push({entityId, msgId, body})
    })

    // 4. Send message
    const testPayload = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]) // "Hello"
    await client.sendMessage(ids.senderId, {notification: true, encMessage: testPayload})

    // Wait for MSG push delivery
    await tick()

    expect(receivedMessages.length).toBe(1)
    expect(receivedMessages[0].entityId).toEqual(ids.recipientId)
    expect(receivedMessages[0].msgId.length).toBe(24)
    expect(receivedMessages[0].body).toEqual(testPayload)

    // 5. Acknowledge
    await client.acknowledge(ids.recipientId, receivedMessages[0].msgId)

    // 6. Delete queue
    await client.deleteQueue(ids.recipientId)
  })
})

// -- Scenario 2: Fast SMP procedure (v9 sender-secured)

describe("Scenario 2: Fast v9 procedure (sndSecure)", () => {
  let client: SMPClientImpl
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup(9) // v9 for sndSecure support
    client = setup.client
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("completes NEW(sndSecure) -> SKEY -> SUB -> SEND -> MSG -> ACK flow", async () => {
    // 1. Create queue with sndSecure and create-only mode (v9)
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x11),
      recipientDhKey: fakeKey(0x22),
      subscribeMode: "C", // create only, subscribe later
      sndSecure: true,
    })

    expect(ids.sndSecure).toBe(true)

    // 2. Secure queue by sender (v9 flow)
    await client.secureQueueSender(ids.senderId, fakeKey(0x33))

    // 3. Subscribe
    await client.subscribe(ids.recipientId)

    // 4. Register message handler
    const receivedMessages: Array<{msgId: Uint8Array; body: Uint8Array}> = []
    client.onMessage((_entityId, msgId, body) => {
      receivedMessages.push({msgId, body})
    })

    // 5. Send message
    const payload = new Uint8Array([0x01, 0x02, 0x03])
    await client.sendMessage(ids.senderId, {notification: false, encMessage: payload})

    await tick()

    expect(receivedMessages.length).toBe(1)
    expect(receivedMessages[0].body).toEqual(payload)

    // 6. Acknowledge
    await client.acknowledge(ids.recipientId, receivedMessages[0].msgId)
  })
})

// -- Scenario 3: Multiple messages - one-at-a-time delivery

describe("Scenario 3: Multiple message one-at-a-time delivery", () => {
  let client: SMPClientImpl
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup()
    client = setup.client
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("delivers messages one at a time via ACK", async () => {
    // 1. Create and secure queue (create-only, no subscription yet)
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x44),
      recipientDhKey: fakeKey(0x55),
      subscribeMode: "C",
      sndSecure: false,
    })

    await client.secureQueue(ids.recipientId, fakeKey(0x66))

    // 2. Send 3 messages before subscribing
    const msg1 = new Uint8Array([0x01])
    const msg2 = new Uint8Array([0x02])
    const msg3 = new Uint8Array([0x03])

    await client.sendMessage(ids.senderId, {notification: true, encMessage: msg1})
    await client.sendMessage(ids.senderId, {notification: true, encMessage: msg2})
    await client.sendMessage(ids.senderId, {notification: true, encMessage: msg3})

    // 3. Track received messages
    const received: Uint8Array[] = []
    const msgIds: Uint8Array[] = []
    client.onMessage((_entityId, msgId, body) => {
      received.push(body)
      msgIds.push(msgId)
    })

    // 4. Subscribe - first message arrives
    await client.subscribe(ids.recipientId)
    await tick()
    expect(received.length).toBe(1)
    expect(received[0]).toEqual(msg1)

    // 5. ACK first - second message arrives
    await client.acknowledge(ids.recipientId, msgIds[0])
    await tick()
    expect(received.length).toBe(2)
    expect(received[1]).toEqual(msg2)

    // 6. ACK second - third message arrives
    await client.acknowledge(ids.recipientId, msgIds[1])
    await tick()
    expect(received.length).toBe(3)
    expect(received[2]).toEqual(msg3)

    // 7. ACK third - no more messages
    await client.acknowledge(ids.recipientId, msgIds[2])
    await tick()
    expect(received.length).toBe(3) // no new messages
  })
})

// -- Scenario 4: Subscription takeover (END notification)

describe("Scenario 4: Subscription takeover", () => {
  let client: SMPClientImpl
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup()
    client = setup.client
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("fires onSubscriptionEnd when subscription is taken over", async () => {
    // 1. Create queue and subscribe
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x77),
      recipientDhKey: fakeKey(0x88),
      subscribeMode: "S",
      sndSecure: false,
    })

    // 2. Register END handler
    const endedQueues: Uint8Array[] = []
    client.onSubscriptionEnd((entityId) => {
      endedQueues.push(entityId)
    })

    // 3. Simulate subscription takeover
    server.simulateSubscriptionTakeover(ids.recipientId)

    await tick()

    // 4. Verify END fired
    expect(endedQueues.length).toBe(1)
    expect(endedQueues[0]).toEqual(ids.recipientId)
  })
})

// -- Scenario 5: Error handling

describe("Scenario 5: Error handling", () => {
  let client: SMPClientImpl
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup()
    client = setup.client
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("throws SMPCommandError with AUTH for non-existent queue", async () => {
    const fakeSenderId = new Uint8Array(24).fill(0xFF)

    await expect(
      client.sendMessage(fakeSenderId, {notification: true, encMessage: new Uint8Array([0x01])})
    ).rejects.toThrow(SMPCommandError)

    try {
      await client.sendMessage(fakeSenderId, {notification: true, encMessage: new Uint8Array([0x01])})
    } catch (e) {
      expect(e).toBeInstanceOf(SMPCommandError)
      if (e instanceof SMPCommandError) {
        expect(e.smpError.type).toBe("AUTH")
      }
    }
  })

  it("throws SMPCommandError with CMD PROHIBITED for ACK without subscription", async () => {
    // Create queue but do NOT subscribe (create-only mode)
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x11),
      recipientDhKey: fakeKey(0x22),
      subscribeMode: "C",
      sndSecure: false,
    })

    const fakeMsgId = new Uint8Array(24).fill(0xAA)

    try {
      await client.acknowledge(ids.recipientId, fakeMsgId)
      expect.fail("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(SMPCommandError)
      if (e instanceof SMPCommandError) {
        expect(e.smpError.type).toBe("CMD")
        if (e.smpError.type === "CMD") {
          expect(e.smpError.cmdError).toBe("PROHIBITED")
        }
      }
    }
  })

  it("throws SMPCommandError with AUTH for subscribe on non-existent queue", async () => {
    const fakeRecipientId = new Uint8Array(24).fill(0xEE)

    await expect(
      client.subscribe(fakeRecipientId)
    ).rejects.toThrow(SMPCommandError)
  })
})

// -- Scenario 6: Suspend and delete

describe("Scenario 6: Suspend and delete", () => {
  let client: SMPClientImpl
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup()
    client = setup.client
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("suspends queue then rejects messages, then deletes", async () => {
    // 1. Create queue
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x99),
      recipientDhKey: fakeKey(0xAA),
      subscribeMode: "S",
      sndSecure: false,
    })

    await client.secureQueue(ids.recipientId, fakeKey(0xBB))

    // 2. Suspend queue
    await client.suspendQueue(ids.recipientId)

    // 3. Attempt to send - should fail with AUTH (queue suspended)
    await expect(
      client.sendMessage(ids.senderId, {notification: true, encMessage: new Uint8Array([0x01])})
    ).rejects.toThrow(SMPCommandError)

    // 4. Delete queue
    await client.deleteQueue(ids.recipientId)

    // 5. After delete, further operations fail
    await expect(
      client.subscribe(ids.recipientId)
    ).rejects.toThrow(SMPCommandError)
  })
})

// -- Scenario 7: PING/PONG keepalive

describe("Scenario 7: PING/PONG keepalive", () => {
  it("PING is sent and PONG response is handled without error", async () => {
    const transport = new MockTransport()
    const server = new MockSMPServer(transport)
    server.start()
    const sessionId = new Uint8Array(32).fill(0x01)
    // Short keepalive interval for testing (50ms)
    const client = new SMPClientImpl(sessionId, 7, transport, 50, 5000)

    client.startKeepalive()

    // Wait for at least one keepalive cycle
    await new Promise(r => setTimeout(r, 120))

    // Verify PING was sent (at least one block in sentBlocks)
    expect(transport.sentBlocks.length).toBeGreaterThanOrEqual(1)

    // The mock server should have responded with PONG.
    // Since PONG is handled internally by the dispatch loop (no pending corrId match),
    // it should not cause any errors. The client should still be in ready state.
    expect(client.state).toBe("ready")

    server.stop()
    client.close()
  })
})

// -- Additional: getMessage and getQueueInfo

describe("Additional commands", () => {
  let client: SMPClientImpl
  let server: MockSMPServer

  beforeEach(() => {
    const setup = createTestSetup()
    client = setup.client
    server = setup.server
  })

  afterEach(() => {
    server.stop()
    client.close()
  })

  it("getMessage returns MSG when messages pending", async () => {
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0xDD),
      recipientDhKey: fakeKey(0xEE),
      subscribeMode: "C",
      sndSecure: false,
    })

    await client.secureQueue(ids.recipientId, fakeKey(0xFF))

    // Send a message
    const payload = new Uint8Array([0x42, 0x43])
    await client.sendMessage(ids.senderId, {notification: true, encMessage: payload})

    // GET should return the message
    const response = await client.getMessage(ids.recipientId)
    expect(response.type).toBe("MSG")
    if (response.type === "MSG") {
      expect(response.encryptedBody).toEqual(payload)
    }
  })

  it("getMessage returns OK when no messages", async () => {
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x11),
      recipientDhKey: fakeKey(0x22),
      subscribeMode: "C",
      sndSecure: false,
    })

    const response = await client.getMessage(ids.recipientId)
    expect(response.type).toBe("OK")
  })

  it("getQueueInfo returns JSON string", async () => {
    const ids = await client.createQueue({
      recipientAuthKey: fakeKey(0x33),
      recipientDhKey: fakeKey(0x44),
      subscribeMode: "C",
      sndSecure: false,
    })

    const info = await client.getQueueInfo(ids.recipientId)
    const parsed = JSON.parse(info)
    expect(parsed.queued).toBe(0)
    expect(parsed.subscribed).toBe(false)
  })
})
