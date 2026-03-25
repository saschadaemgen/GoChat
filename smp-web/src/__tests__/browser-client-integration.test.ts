// Browser client integration tests using mock SMP server.
//
// Tests the full lifecycle: connect -> send -> receive -> disconnect
// using MockTransport + MockSMPServer from Season 3/4.

import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"
import {createBrowserClient} from "../browser-client.js"
import type {BrowserClient, ClientStatus, BrowserClientConfig} from "../browser-client.js"
import {MockTransport, MockSMPServer} from "./mock-smp-server.js"
import {SMPClientImpl} from "../client.js"
import type {SMPClient} from "../client.js"
import type {SMPClientAgent} from "../agent.js"
import type {SMPServerAddress} from "../types.js"
import {Decoder, encodeBytes, concatBytes} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"
import {encodeTransmission} from "../protocol.js"
import {buildCommandBlock} from "../handshake.js"

// -- Test infrastructure

const TEST_IDENTITY = "aabbccdd"
const TEST_HOST = "smp.test.local"
const TEST_PORT = 5223
const TEST_QUEUE_ID = "testqueue123"
const TEST_DH_KEY = "dGVzdGRoa2V5"

const TEST_SMP_URI = "smp://" + TEST_IDENTITY + "@" + TEST_HOST + ":" + TEST_PORT + "/" + TEST_QUEUE_ID + "#/?v=1-7&dh=" + TEST_DH_KEY
const TEST_CONTACT_URI = "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(TEST_SMP_URI)

function ascii(s: string): Uint8Array {
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

function createMockInfrastructure(): {
  agent: SMPClientAgent
  transport: MockTransport
  server: MockSMPServer
  client: SMPClientImpl
} {
  const transport = new MockTransport()
  const server = new MockSMPServer(transport)
  server.start()

  const sessionId = new Uint8Array(32).fill(0xAA)
  const client = new SMPClientImpl(sessionId, 7, transport, 30000, 5000)

  const agent: SMPClientAgent = {
    getClient: async (_server: SMPServerAddress) => client,
    reconnect: async (_server: SMPServerAddress) => client,
    closeServer: (_server: SMPServerAddress) => {},
    closeAll: () => {
      server.stop()
      client.close()
    },
    onConnectionChange: () => {},
  }

  return {agent, transport, server, client}
}

// Create infrastructure with a pre-existing contact queue so send() works.
// The trick: create a queue via the mock server first, then build a contact
// URI that uses the resulting senderId.
async function createMockInfrastructureWithContactQueue(): Promise<{
  agent: SMPClientAgent
  transport: MockTransport
  server: MockSMPServer
  client: SMPClientImpl
  contactUri: string
  contactSenderId: Uint8Array
}> {
  const transport = new MockTransport()
  const server = new MockSMPServer(transport)
  server.start()

  const sessionId = new Uint8Array(32).fill(0xAA)
  const client = new SMPClientImpl(sessionId, 7, transport, 30000, 5000)

  // Create a "contact queue" (Alice's queue) in the mock server
  const contactIds = await client.createQueue({
    recipientAuthKey: new Uint8Array(44).fill(0xCC),
    recipientDhKey: new Uint8Array(44).fill(0xDD),
    subscribeMode: "S",
    sndSecure: false,
  })

  // Secure the queue so SEND is accepted
  await client.secureQueue(contactIds.recipientId, new Uint8Array(44).fill(0xEE))

  // Build a contact URI that uses the real senderId from the mock server
  const senderIdB64 = uint8ToBase64url(contactIds.senderId)
  const smpUri = "smp://" + TEST_IDENTITY + "@" + TEST_HOST + ":" + TEST_PORT + "/" + senderIdB64 + "#/?v=1-7&dh=" + TEST_DH_KEY
  const contactUri = "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(smpUri)

  const agent: SMPClientAgent = {
    getClient: async (_server: SMPServerAddress) => client,
    reconnect: async (_server: SMPServerAddress) => client,
    closeServer: (_server: SMPServerAddress) => {},
    closeAll: () => {
      server.stop()
      client.close()
    },
    onConnectionChange: () => {},
  }

  return {agent, transport, server, client, contactUri, contactSenderId: contactIds.senderId}
}

function uint8ToBase64url(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function createTestConfig(
  agent: SMPClientAgent,
  contactUri?: string,
  overrides?: Partial<BrowserClientConfig>
): BrowserClientConfig {
  return {
    contactAddress: contactUri ?? TEST_CONTACT_URI,
    onMessage: vi.fn(),
    onStatusChange: vi.fn(),
    onError: vi.fn(),
    _agent: agent,
    ...overrides,
  }
}

function tick(ms = 30): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// -- Scenario 1: Full lifecycle

describe("Scenario 1: Full lifecycle (connect -> send -> receive -> disconnect)", () => {
  it("connect() transitions through connecting to connected", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()

    const calls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[0][0]).toBe("connecting")
    expect(calls[calls.length - 1][0]).toBe("connected")
    expect(client.status).toBe("connected")

    await client.disconnect()
    infra.server.stop()
  })

  it("send() delivers message through mock server", async () => {
    const infra = await createMockInfrastructureWithContactQueue()
    const config = createTestConfig(infra.agent, infra.contactUri)
    const client = createBrowserClient(config)

    await client.connect()
    await client.send("Hello support!")
    await tick()

    // Verify blocks were sent (NEW for bob's queue + SEND for contact queue)
    expect(infra.transport.sentBlocks.length).toBeGreaterThanOrEqual(2)
    expect(client.status).toBe("connected")

    await client.disconnect()
    infra.server.stop()
  })

  it("incoming message fires onMessage callback", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await tick()

    // After connect, the client registers an onMessage handler on the SMPClient.
    // We can trigger it by injecting a MSG push via the transport.
    // Build a MSG push with empty corrId targeting our queue.
    const msgBody = new TextEncoder().encode("Hello from support!")
    const msgCommand = concatBytes(ascii("MSG "), encodeBytes(new Uint8Array(24).fill(0x42)), msgBody)
    const transmission = encodeTransmission(new Uint8Array(0), new Uint8Array(24).fill(0x01), msgCommand)
    const block = buildCommandBlock(transmission)
    infra.transport.injectBlock(block)
    await tick()

    expect(config.onMessage).toHaveBeenCalledWith("Hello from support!")

    await client.disconnect()
    infra.server.stop()
  })

  it("disconnect() sets status to offline and fires callback", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await client.disconnect()

    expect(client.status).toBe("offline")
    const calls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[calls.length - 1][0]).toBe("offline")

    infra.server.stop()
  })

  it("full sequence: connect -> send -> disconnect", async () => {
    const infra = await createMockInfrastructureWithContactQueue()
    const config = createTestConfig(infra.agent, infra.contactUri)
    const client = createBrowserClient(config)

    await client.connect()
    expect(client.status).toBe("connected")

    await client.send("test message")
    await tick()

    await client.disconnect()
    expect(client.status).toBe("offline")

    const statuses = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: [ClientStatus]) => c[0]
    )
    expect(statuses[0]).toBe("connecting")
    expect(statuses).toContain("connected")
    expect(statuses[statuses.length - 1]).toBe("offline")

    infra.server.stop()
  })
})

// -- Scenario 2: Reconnect after disconnect

describe("Scenario 2: Reconnect after disconnect", () => {
  it("can reconnect after disconnect", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    expect(client.status).toBe("connected")

    await client.disconnect()
    expect(client.status).toBe("offline")

    // Reconnect with fresh infra (since closeAll stopped old one)
    const infra2 = createMockInfrastructure()
    ;(config as any)._agent = infra2.agent

    await client.connect()
    expect(client.status).toBe("connected")

    await client.disconnect()
    infra.server.stop()
    infra2.server.stop()
  })

  it("onStatusChange sequence is correct across reconnect", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await client.disconnect()

    const infra2 = createMockInfrastructure()
    ;(config as any)._agent = infra2.agent

    await client.connect()
    await client.disconnect()

    const statuses = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: [ClientStatus]) => c[0]
    )
    expect(statuses).toEqual([
      "connecting", "connected", "offline",
      "connecting", "connected", "offline",
    ])

    infra.server.stop()
    infra2.server.stop()
  })

  it("messaging works after reconnect", async () => {
    const infra = await createMockInfrastructureWithContactQueue()
    const config = createTestConfig(infra.agent, infra.contactUri)
    const client = createBrowserClient(config)

    await client.connect()
    await client.send("before disconnect")
    await tick()
    await client.disconnect()

    // Reconnect with fresh infra that also has a contact queue
    const infra2 = await createMockInfrastructureWithContactQueue()
    ;(config as any)._agent = infra2.agent
    ;(config as any).contactAddress = infra2.contactUri

    await client.connect()
    await client.send("after reconnect")
    await tick()

    expect(client.status).toBe("connected")

    await client.disconnect()
    infra.server.stop()
    infra2.server.stop()
  })
})

// -- Scenario 3: Connection error handling

describe("Scenario 3: Connection error handling", () => {
  it("fires onStatusChange(error) when connection fails", async () => {
    const failingAgent: SMPClientAgent = {
      getClient: async () => { throw new Error("Connection refused") },
      reconnect: async () => { throw new Error("Connection refused") },
      closeServer: () => {},
      closeAll: () => {},
      onConnectionChange: () => {},
    }

    const config = createTestConfig(failingAgent)
    const client = createBrowserClient(config)

    await expect(client.connect()).rejects.toThrow()

    expect(client.status).toBe("error")
    const calls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[calls.length - 1][0]).toBe("error")
  })

  it("fires onError callback with error details", async () => {
    const failingAgent: SMPClientAgent = {
      getClient: async () => { throw new Error("Test error details") },
      reconnect: async () => { throw new Error("Test error details") },
      closeServer: () => {},
      closeAll: () => {},
      onConnectionChange: () => {},
    }

    const config = createTestConfig(failingAgent)
    const client = createBrowserClient(config)

    try { await client.connect() } catch (_e) {}

    expect(config.onError).toHaveBeenCalled()
    const errorArg = (config.onError as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(errorArg).toBeInstanceOf(Error)
    expect(errorArg.message).toContain("Test error details")
  })

  it("send() rejects when not connected after error", async () => {
    const failingAgent: SMPClientAgent = {
      getClient: async () => { throw new Error("fail") },
      reconnect: async () => { throw new Error("fail") },
      closeServer: () => {},
      closeAll: () => {},
      onConnectionChange: () => {},
    }

    const config = createTestConfig(failingAgent)
    const client = createBrowserClient(config)

    try { await client.connect() } catch (_e) {}

    expect(client.status).toBe("error")
    await expect(client.send("hello")).rejects.toThrow("not connected")
  })

  it("onError is optional - connect still throws on failure", async () => {
    const failingAgent: SMPClientAgent = {
      getClient: async () => { throw new Error("fail") },
      reconnect: async () => { throw new Error("fail") },
      closeServer: () => {},
      closeAll: () => {},
      onConnectionChange: () => {},
    }

    const config: BrowserClientConfig = {
      contactAddress: TEST_CONTACT_URI,
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
      _agent: failingAgent,
      // No onError
    }

    const client = createBrowserClient(config)
    await expect(client.connect()).rejects.toThrow()
    expect(client.status).toBe("error")
  })
})

// -- Scenario 4: Multiple rapid sends

describe("Scenario 4: Multiple rapid sends", () => {
  it("5 rapid sends all complete without error", async () => {
    const infra = await createMockInfrastructureWithContactQueue()
    const config = createTestConfig(infra.agent, infra.contactUri)
    const client = createBrowserClient(config)

    await client.connect()

    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(client.send("message " + i))
    }
    await Promise.all(promises)
    await tick()

    expect(infra.transport.sentBlocks.length).toBeGreaterThanOrEqual(5)

    await client.disconnect()
    infra.server.stop()
  })

  it("messages arrive at server in order", async () => {
    const infra = await createMockInfrastructureWithContactQueue()
    const config = createTestConfig(infra.agent, infra.contactUri)
    const client = createBrowserClient(config)

    await client.connect()
    const blocksBefore = infra.transport.sentBlocks.length

    await client.send("first")
    await client.send("second")
    await client.send("third")
    await tick()

    // 3 new SEND blocks after connect
    const newBlocks = infra.transport.sentBlocks.length - blocksBefore
    expect(newBlocks).toBe(3)

    await client.disconnect()
    infra.server.stop()
  })

  it("no message is lost with 10 sends", async () => {
    const infra = await createMockInfrastructureWithContactQueue()
    const config = createTestConfig(infra.agent, infra.contactUri)
    const client = createBrowserClient(config)

    await client.connect()
    const blocksBefore = infra.transport.sentBlocks.length

    for (let i = 0; i < 10; i++) {
      await client.send("msg-" + i)
    }
    await tick()

    const newBlocks = infra.transport.sentBlocks.length - blocksBefore
    expect(newBlocks).toBe(10)

    await client.disconnect()
    infra.server.stop()
  })
})

// -- Scenario 5: Incoming message independent of UI state

describe("Scenario 5: Incoming message fires regardless of panel state", () => {
  it("onMessage fires for injected MSG push", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await tick()

    // Inject a MSG push via mock transport
    const text = "message while panel closed"
    const msgBody = new TextEncoder().encode(text)
    const msgCommand = concatBytes(ascii("MSG "), encodeBytes(new Uint8Array(24).fill(0x55)), msgBody)
    const transmission = encodeTransmission(new Uint8Array(0), new Uint8Array(24).fill(0x01), msgCommand)
    const block = buildCommandBlock(transmission)
    infra.transport.injectBlock(block)
    await tick()

    expect(config.onMessage).toHaveBeenCalledWith(text)

    await client.disconnect()
    infra.server.stop()
  })

  it("multiple incoming messages all fire onMessage", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await tick()

    for (let i = 0; i < 3; i++) {
      const msgBody = new TextEncoder().encode("msg-" + i)
      const msgCommand = concatBytes(ascii("MSG "), encodeBytes(new Uint8Array(24).fill(i + 1)), msgBody)
      const transmission = encodeTransmission(new Uint8Array(0), new Uint8Array(24).fill(0x01), msgCommand)
      infra.transport.injectBlock(buildCommandBlock(transmission))
    }
    await tick()

    expect(config.onMessage).toHaveBeenCalledTimes(3)
    expect(config.onMessage).toHaveBeenCalledWith("msg-0")
    expect(config.onMessage).toHaveBeenCalledWith("msg-1")
    expect(config.onMessage).toHaveBeenCalledWith("msg-2")

    await client.disconnect()
    infra.server.stop()
  })
})

// -- Scenario 6: Double connect / double disconnect

describe("Scenario 6: Double connect / double disconnect", () => {
  it("connect() is idempotent when already connected", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    expect(client.status).toBe("connected")

    // Second connect is a no-op
    await client.connect()
    expect(client.status).toBe("connected")

    const connectingCount = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: [ClientStatus]) => c[0] === "connecting").length
    expect(connectingCount).toBe(1)

    await client.disconnect()
    infra.server.stop()
  })

  it("disconnect() is safe when already offline", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.disconnect()
    await client.disconnect()
    await client.disconnect()

    expect(client.status).toBe("offline")
    infra.server.stop()
  })

  it("disconnect() is idempotent after connect", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await client.disconnect()
    expect(client.status).toBe("offline")

    await client.disconnect()
    expect(client.status).toBe("offline")

    // Only one "offline" callback
    const offlineCalls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: [ClientStatus]) => c[0] === "offline")
    expect(offlineCalls.length).toBe(1)

    infra.server.stop()
  })
})

// -- Scenario 7: State consistency

describe("Scenario 7: State consistency", () => {
  it("status property always matches last onStatusChange call", async () => {
    const infra = createMockInfrastructure()
    const statuses: ClientStatus[] = []
    const config = createTestConfig(infra.agent, undefined, {
      onStatusChange: (s: ClientStatus) => statuses.push(s),
    })
    const client = createBrowserClient(config)

    expect(client.status).toBe("offline")

    await client.connect()
    expect(client.status).toBe(statuses[statuses.length - 1])

    await client.disconnect()
    expect(client.status).toBe(statuses[statuses.length - 1])
    expect(client.status).toBe("offline")

    infra.server.stop()
  })

  it("send fails immediately after disconnect", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await client.disconnect()

    await expect(client.send("should fail")).rejects.toThrow("not connected")

    infra.server.stop()
  })

  it("internal state is cleaned up after disconnect", async () => {
    const infra = createMockInfrastructure()
    const config = createTestConfig(infra.agent)
    const client = createBrowserClient(config)

    await client.connect()
    await client.disconnect()

    // All internal state reset
    expect(client.status).toBe("offline")
    await expect(client.send("test")).rejects.toThrow()

    infra.server.stop()
  })

  it("error status prevents send", async () => {
    const failingAgent: SMPClientAgent = {
      getClient: async () => { throw new Error("fail") },
      reconnect: async () => { throw new Error("fail") },
      closeServer: () => {},
      closeAll: () => {},
      onConnectionChange: () => {},
    }

    const config = createTestConfig(failingAgent)
    const client = createBrowserClient(config)

    try { await client.connect() } catch (_e) {}
    expect(client.status).toBe("error")

    await expect(client.send("nope")).rejects.toThrow("not connected")
    expect(client.status).toBe("error")
  })
})
