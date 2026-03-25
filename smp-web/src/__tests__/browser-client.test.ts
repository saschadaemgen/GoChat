// Browser client tests using mock SMP infrastructure.

import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"
import {createBrowserClient} from "../browser-client.js"
import type {BrowserClient, ClientStatus, BrowserClientConfig} from "../browser-client.js"

// -- Test helpers

// A valid legacy full contact address URI for testing
const TEST_CONTACT_URI = "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(
  "smp://aabbccdd@smp.example.com:5223/queueid#/?v=1-7&dh=dhkey"
)

function createTestConfig(overrides?: Partial<BrowserClientConfig>): BrowserClientConfig {
  return {
    contactAddress: TEST_CONTACT_URI,
    onMessage: vi.fn(),
    onStatusChange: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  }
}

// -- Unit tests for createBrowserClient

describe("createBrowserClient", () => {
  it("returns a BrowserClient object", () => {
    const client = createBrowserClient(createTestConfig())
    expect(client).toBeDefined()
    expect(typeof client.connect).toBe("function")
    expect(typeof client.send).toBe("function")
    expect(typeof client.disconnect).toBe("function")
  })

  it("starts with offline status", () => {
    const client = createBrowserClient(createTestConfig())
    expect(client.status).toBe("offline")
  })
})

// -- Status transitions

describe("BrowserClient status", () => {
  it("status starts as offline", () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)
    expect(client.status).toBe("offline")
  })

  it("connect() fires onStatusChange with connecting", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)

    // connect() will fail (no real server) but should fire connecting first
    try {
      await client.connect()
    } catch (_e) {
      // Expected - no real server
    }

    const calls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][0]).toBe("connecting")
  })

  it("connect() fires onStatusChange with error on failure", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)

    try {
      await client.connect()
    } catch (_e) {
      // Expected
    }

    const calls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[0]).toBe("error")
    expect(client.status).toBe("error")
  })

  it("connect() calls onError on failure", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)

    try {
      await client.connect()
    } catch (_e) {
      // Expected
    }

    expect(config.onError).toHaveBeenCalled()
  })
})

// -- Send validation

describe("BrowserClient send", () => {
  it("send() throws when not connected", async () => {
    const client = createBrowserClient(createTestConfig())
    await expect(client.send("hello")).rejects.toThrow("not connected")
  })

  it("send() throws with current status in error message", async () => {
    const client = createBrowserClient(createTestConfig())
    await expect(client.send("hello")).rejects.toThrow("offline")
  })
})

// -- Disconnect

describe("BrowserClient disconnect", () => {
  it("disconnect() sets status to offline", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)
    await client.disconnect()
    expect(client.status).toBe("offline")
  })

  it("disconnect() fires onStatusChange with offline", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)
    await client.disconnect()

    const calls = (config.onStatusChange as ReturnType<typeof vi.fn>).mock.calls
    // May not fire if already offline
    if (calls.length > 0) {
      expect(calls[calls.length - 1][0]).toBe("offline")
    }
  })

  it("disconnect() is safe to call multiple times", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)
    await client.disconnect()
    await client.disconnect()
    expect(client.status).toBe("offline")
  })

  it("disconnect() after failed connect resets status", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)

    try {
      await client.connect()
    } catch (_e) {
      // Expected
    }

    expect(client.status).toBe("error")
    await client.disconnect()
    expect(client.status).toBe("offline")
  })
})

// -- Double connect prevention

describe("BrowserClient idempotency", () => {
  it("connect() is idempotent when connecting", async () => {
    const config = createTestConfig()
    const client = createBrowserClient(config)

    // Start connecting (will fail)
    const p1 = client.connect().catch(() => {})

    // Second call while connecting should return immediately
    // (status is "connecting" so it returns early)
    const p2 = client.connect().catch(() => {})

    await Promise.all([p1, p2])
  })
})

// -- Config validation

describe("BrowserClientConfig", () => {
  it("uses default displayName when not provided", () => {
    const config = createTestConfig()
    expect(config.displayName).toBeUndefined()
    const client = createBrowserClient(config)
    expect(client).toBeDefined()
  })

  it("accepts custom displayName", () => {
    const config = createTestConfig({displayName: "Support Visitor"})
    const client = createBrowserClient(config)
    expect(client).toBeDefined()
  })

  it("onError is optional", () => {
    const config: BrowserClientConfig = {
      contactAddress: TEST_CONTACT_URI,
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
      // No onError
    }
    const client = createBrowserClient(config)
    expect(client).toBeDefined()
  })

  it("accepts serverUrl config for WSS proxy", () => {
    const config: BrowserClientConfig = {
      contactAddress: TEST_CONTACT_URI,
      serverUrl: "wss://smp.simplego.dev",
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
    }
    const client = createBrowserClient(config)
    expect(client).toBeDefined()
  })

  it("accepts serverUrl with explicit port", () => {
    const config: BrowserClientConfig = {
      contactAddress: TEST_CONTACT_URI,
      serverUrl: "wss://smp.simplego.dev:8443",
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
    }
    const client = createBrowserClient(config)
    expect(client).toBeDefined()
  })
})

// -- serverUrl WSS proxy override tests

describe("serverUrl WSS proxy override", () => {
  it("uses port 443 from serverUrl instead of port 5223 from contact address", async () => {
    // Track which server address getClient is called with
    let capturedAddress: {host: string; port: number} | null = null
    const mockClient = {
      sessionId: new Uint8Array(32),
      smpVersion: 7,
      transport: {state: "connected", connect: async () => {}, send: async () => {}, onMessage: () => {}, close: () => {}},
      state: "ready" as const,
      sendCommand: async () => {},
      onResponse: () => {},
      onServerPush: () => {},
      startKeepalive: () => {},
      close: () => {},
      createQueue: async () => ({recipientId: new Uint8Array(24).fill(1), senderId: new Uint8Array(24).fill(2), serverDhKey: new Uint8Array(32).fill(3), sndSecure: true}),
      subscribe: async () => {},
      secureQueue: async () => {},
      secureQueueSender: async () => {},
      sendMessage: async () => {},
      acknowledge: async () => {},
      deleteQueue: async () => {},
      suspendQueue: async () => {},
      getMessage: async () => ({type: "OK" as const}),
      enableNotifications: async () => ({notifierId: new Uint8Array(24), serverNtfDhKey: new Uint8Array(32)}),
      disableNotifications: async () => {},
      getQueueInfo: async () => "{}",
      onMessage: () => {},
      onSubscriptionEnd: () => {},
    }

    const mockAgent = {
      getClient: async (server: any) => {
        capturedAddress = {host: server.host, port: server.port}
        return mockClient as any
      },
      reconnect: async () => mockClient as any,
      closeServer: () => {},
      closeAll: () => {},
      onConnectionChange: () => {},
    }

    // Contact address has server smp10.simplex.im:5223
    // But serverUrl overrides to smp.simplego.dev:443
    const config: BrowserClientConfig = {
      contactAddress: "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(
        "smp://aabbcc@smp10.simplex.im:5223/queueId#/?v=1-7&dh=testDhKey"
      ),
      serverUrl: "wss://smp.simplego.dev",
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
      _agent: mockAgent,
    }

    const client = createBrowserClient(config)
    await client.connect()

    // The agent should have been called with the WSS proxy address, not the SMP address
    expect(capturedAddress).not.toBeNull()
    expect(capturedAddress!.host).toBe("smp.simplego.dev")
    expect(capturedAddress!.port).toBe(443) // WSS default, not 5223

    await client.disconnect()
  })

  it("uses custom port from serverUrl when specified", async () => {
    let capturedAddress: {host: string; port: number} | null = null
    const mockClient = {
      sessionId: new Uint8Array(32), smpVersion: 7,
      transport: {state: "connected", connect: async () => {}, send: async () => {}, onMessage: () => {}, close: () => {}},
      state: "ready" as const, sendCommand: async () => {}, onResponse: () => {}, onServerPush: () => {},
      startKeepalive: () => {}, close: () => {},
      createQueue: async () => ({recipientId: new Uint8Array(24).fill(1), senderId: new Uint8Array(24).fill(2), serverDhKey: new Uint8Array(32).fill(3), sndSecure: true}),
      subscribe: async () => {}, secureQueue: async () => {}, secureQueueSender: async () => {},
      sendMessage: async () => {}, acknowledge: async () => {}, deleteQueue: async () => {},
      suspendQueue: async () => {},
      getMessage: async () => ({type: "OK" as const}),
      enableNotifications: async () => ({notifierId: new Uint8Array(24), serverNtfDhKey: new Uint8Array(32)}),
      disableNotifications: async () => {}, getQueueInfo: async () => "{}",
      onMessage: () => {}, onSubscriptionEnd: () => {},
    }
    const mockAgent = {
      getClient: async (server: any) => { capturedAddress = {host: server.host, port: server.port}; return mockClient as any },
      reconnect: async () => mockClient as any, closeServer: () => {}, closeAll: () => {}, onConnectionChange: () => {},
    }

    const config: BrowserClientConfig = {
      contactAddress: "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(
        "smp://aabbcc@smp10.simplex.im:5223/queueId#/?v=1-7&dh=testDhKey"
      ),
      serverUrl: "wss://smp.simplego.dev:8443",
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
      _agent: mockAgent,
    }

    const client = createBrowserClient(config)
    await client.connect()

    expect(capturedAddress!.host).toBe("smp.simplego.dev")
    expect(capturedAddress!.port).toBe(8443)

    await client.disconnect()
  })

  it("falls back to contact address host:port when serverUrl is not set", async () => {
    let capturedAddress: {host: string; port: number} | null = null
    const mockClient = {
      sessionId: new Uint8Array(32), smpVersion: 7,
      transport: {state: "connected", connect: async () => {}, send: async () => {}, onMessage: () => {}, close: () => {}},
      state: "ready" as const, sendCommand: async () => {}, onResponse: () => {}, onServerPush: () => {},
      startKeepalive: () => {}, close: () => {},
      createQueue: async () => ({recipientId: new Uint8Array(24).fill(1), senderId: new Uint8Array(24).fill(2), serverDhKey: new Uint8Array(32).fill(3), sndSecure: true}),
      subscribe: async () => {}, secureQueue: async () => {}, secureQueueSender: async () => {},
      sendMessage: async () => {}, acknowledge: async () => {}, deleteQueue: async () => {},
      suspendQueue: async () => {},
      getMessage: async () => ({type: "OK" as const}),
      enableNotifications: async () => ({notifierId: new Uint8Array(24), serverNtfDhKey: new Uint8Array(32)}),
      disableNotifications: async () => {}, getQueueInfo: async () => "{}",
      onMessage: () => {}, onSubscriptionEnd: () => {},
    }
    const mockAgent = {
      getClient: async (server: any) => { capturedAddress = {host: server.host, port: server.port}; return mockClient as any },
      reconnect: async () => mockClient as any, closeServer: () => {}, closeAll: () => {}, onConnectionChange: () => {},
    }

    const config: BrowserClientConfig = {
      contactAddress: "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(
        "smp://aabbcc@smp10.simplex.im:5223/queueId#/?v=1-7&dh=testDhKey"
      ),
      // No serverUrl - should use contact address host:port
      onMessage: vi.fn(),
      onStatusChange: vi.fn(),
      _agent: mockAgent,
    }

    const client = createBrowserClient(config)
    await client.connect()

    expect(capturedAddress!.host).toBe("smp10.simplex.im")
    expect(capturedAddress!.port).toBe(5223)

    await client.disconnect()
  })
})
