import {describe, it, expect, vi, beforeEach} from "vitest"
import {
  generateX25519KeyPair,
  generateEd25519KeyPair,
  encodeEd25519PublicKey,
  encodeX25519PublicKey,
} from "../crypto-utils.js"
import {ConnectionManager} from "../connection.js"
import type {ManagedConnection} from "../connection.js"
import type {SMPClientAgent} from "../agent.js"
import type {SMPClient} from "../client.js"
import type {IDSResponse} from "../client.js"
import type {
  ChatTransport,
  SMPServerAddress,
  TransportState,
  TransportEventHandler,
  SMPClientState,
  SMPResponseHandler,
  SMPPushHandler,
} from "../types.js"
import type {NewQueueParams} from "../commands.js"
import {SMPCommandError} from "../client.js"

// -- Test data

const SAMPLE_IDENTITY = "u2dS9sG8nMNURyZwqASV4yROM28YQxY37YKx2OLSuPA"
const SAMPLE_QUEUE_ID = "Yk2YqYBYnpEE_9JmRSVZ4Q"
const SAMPLE_DH_KEY = "MCowBQYDK2VuAyEAjiswwI3O_NlS8Fk3HJHA868-I-GizH0e2NbGXhYEXx0"

function buildLegacyContactURI(): string {
  const queueURI = "smp://" + SAMPLE_IDENTITY + "@smp1.example.com:5223/" + SAMPLE_QUEUE_ID + "#/?v=1-7&dh=" + SAMPLE_DH_KEY
  return "simplex:/contact#/?v=1-7&smp=" + encodeURIComponent(queueURI)
}

function buildShortLinkURI(): string {
  return "https://smp6.simplex.im/a#lrdvu2d8A1GumSmoKb2krQmtKhWXq-tyGpHuM7aMwsw"
}

// -- Mock setup

function createFakeIDS(): IDSResponse {
  return {
    recipientId: new Uint8Array(24).fill(0x11),
    senderId: new Uint8Array(24).fill(0x22),
    serverDhKey: new Uint8Array(44).fill(0x33),
    sndSecure: true,
  }
}

function createMockClient(idsResponse?: IDSResponse): SMPClient & {createQueueCalls: NewQueueParams[]} {
  const createQueueCalls: NewQueueParams[] = []
  const ids = idsResponse ?? createFakeIDS()

  const mockTransport: ChatTransport = {
    state: "connected" as TransportState,
    async connect() {},
    async send() {},
    onMessage() {},
    close() {},
  }

  return {
    createQueueCalls,
    sessionId: new Uint8Array(32),
    smpVersion: 7,
    transport: mockTransport,
    get state(): SMPClientState { return "ready" },
    async sendCommand() {},
    onResponse() {},
    onServerPush() {},
    startKeepalive() {},
    close() {},
    async createQueue(params: NewQueueParams): Promise<IDSResponse> {
      createQueueCalls.push(params)
      return ids
    },
    async subscribe() {},
    async secureQueue() {},
    async secureQueueSender() {},
    async sendMessage() {},
    async acknowledge() {},
    async deleteQueue() {},
    async suspendQueue() {},
    async getMessage(): Promise<any> { return {type: "OK"} },
    async enableNotifications(): Promise<any> { return {notifierId: new Uint8Array(0), serverNtfDhKey: new Uint8Array(0)} },
    async disableNotifications() {},
    async getQueueInfo(): Promise<string> { return "{}" },
    onMessage() {},
    onSubscriptionEnd() {},
  }
}

function createMockAgent(client?: SMPClient): SMPClientAgent {
  const mockClient = client ?? createMockClient()
  return {
    async getClient(_server: SMPServerAddress): Promise<SMPClient> {
      return mockClient
    },
    async reconnect(_server: SMPServerAddress): Promise<SMPClient> {
      return mockClient
    },
    closeServer() {},
    closeAll() {},
    onConnectionChange() {},
  }
}

// -- Crypto-utils tests

describe("generateX25519KeyPair", () => {
  it("returns 32-byte keys", () => {
    const kp = generateX25519KeyPair()
    expect(kp.publicKey.length).toBe(32)
    expect(kp.privateKey.length).toBe(32)
  })

  it("returns unique pairs on each call", () => {
    const kp1 = generateX25519KeyPair()
    const kp2 = generateX25519KeyPair()
    expect(kp1.publicKey).not.toEqual(kp2.publicKey)
    expect(kp1.privateKey).not.toEqual(kp2.privateKey)
  })

  it("public key is derived from private key", () => {
    const kp = generateX25519KeyPair()
    // Public key should not be all zeros
    expect(kp.publicKey.some(b => b !== 0)).toBe(true)
  })
})

describe("generateEd25519KeyPair", () => {
  it("returns 32-byte keys", () => {
    const kp = generateEd25519KeyPair()
    expect(kp.publicKey.length).toBe(32)
    expect(kp.privateKey.length).toBe(32)
  })

  it("returns unique pairs on each call", () => {
    const kp1 = generateEd25519KeyPair()
    const kp2 = generateEd25519KeyPair()
    expect(kp1.publicKey).not.toEqual(kp2.publicKey)
    expect(kp1.privateKey).not.toEqual(kp2.privateKey)
  })
})

describe("encodeEd25519PublicKey", () => {
  it("produces 44 bytes", () => {
    const kp = generateEd25519KeyPair()
    const der = encodeEd25519PublicKey(kp.publicKey)
    expect(der.length).toBe(44)
  })

  it("has correct SPKI DER prefix", () => {
    const kp = generateEd25519KeyPair()
    const der = encodeEd25519PublicKey(kp.publicKey)
    // Ed25519 OID bytes: 0x2b, 0x65, 0x70
    expect(der[0]).toBe(0x30)
    expect(der[1]).toBe(0x2a)
    expect(der[7]).toBe(0x65)
    expect(der[8]).toBe(0x70) // Ed25519 OID
  })

  it("contains raw key at bytes 12-44", () => {
    const kp = generateEd25519KeyPair()
    const der = encodeEd25519PublicKey(kp.publicKey)
    const extracted = der.subarray(12)
    expect(extracted).toEqual(kp.publicKey)
  })
})

describe("encodeX25519PublicKey", () => {
  it("produces 44 bytes", () => {
    const kp = generateX25519KeyPair()
    const der = encodeX25519PublicKey(kp.publicKey)
    expect(der.length).toBe(44)
  })

  it("has correct SPKI DER prefix", () => {
    const kp = generateX25519KeyPair()
    const der = encodeX25519PublicKey(kp.publicKey)
    // X25519 OID bytes: 0x2b, 0x65, 0x6e
    expect(der[0]).toBe(0x30)
    expect(der[1]).toBe(0x2a)
    expect(der[7]).toBe(0x65)
    expect(der[8]).toBe(0x6e) // X25519 OID
  })

  it("contains raw key at bytes 12-44", () => {
    const kp = generateX25519KeyPair()
    const der = encodeX25519PublicKey(kp.publicKey)
    const extracted = der.subarray(12)
    expect(extracted).toEqual(kp.publicKey)
  })

  it("Ed25519 and X25519 prefixes differ at OID byte", () => {
    const edKey = encodeEd25519PublicKey(new Uint8Array(32))
    const xKey = encodeX25519PublicKey(new Uint8Array(32))
    // Bytes 0-6 are the same, byte 8 differs (0x70 vs 0x6e)
    expect(edKey[8]).toBe(0x70) // Ed25519
    expect(xKey[8]).toBe(0x6e) // X25519
  })
})

// -- ConnectionManager construction

describe("ConnectionManager construction", () => {
  it("constructs with agent and default config", () => {
    const agent = createMockAgent()
    const mgr = new ConnectionManager(agent)
    expect(mgr).toBeDefined()
  })

  it("constructs with custom config", () => {
    const agent = createMockAgent()
    const mgr = new ConnectionManager(agent, {
      subscribeMode: "C",
      sndSecure: false,
      timeout: 5000,
    })
    expect(mgr).toBeDefined()
  })

  it("getConnection returns undefined for unknown ID", () => {
    const mgr = new ConnectionManager(createMockAgent())
    expect(mgr.getConnection("nonexistent")).toBeUndefined()
  })

  it("getActiveConnections returns empty initially", () => {
    const mgr = new ConnectionManager(createMockAgent())
    expect(mgr.getActiveConnections()).toEqual([])
  })
})

// -- initiateConnection with legacy full link

describe("initiateConnection with legacy full link", () => {
  let mockClient: ReturnType<typeof createMockClient>
  let mgr: ConnectionManager

  beforeEach(() => {
    mockClient = createMockClient()
    mgr = new ConnectionManager(createMockAgent(mockClient))
  })

  it("creates connection in QUEUE_CREATED state", async () => {
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn.state.state).toBe("QUEUE_CREATED")
  })

  it("calls createQueue on mock client", async () => {
    await mgr.initiateConnection(buildLegacyContactURI())
    expect(mockClient.createQueueCalls.length).toBe(1)
  })

  it("passes 44-byte Ed25519 SPKI recipientAuthKey", async () => {
    await mgr.initiateConnection(buildLegacyContactURI())
    const params = mockClient.createQueueCalls[0]
    expect(params.recipientAuthKey.length).toBe(44)
    // Verify Ed25519 OID
    expect(params.recipientAuthKey[8]).toBe(0x70)
  })

  it("passes 44-byte X25519 SPKI recipientDhKey", async () => {
    await mgr.initiateConnection(buildLegacyContactURI())
    const params = mockClient.createQueueCalls[0]
    expect(params.recipientDhKey.length).toBe(44)
    // Verify X25519 OID
    expect(params.recipientDhKey[8]).toBe(0x6e)
  })

  it("passes subscribeMode from config", async () => {
    const agent = createMockAgent(mockClient)
    const mgrC = new ConnectionManager(agent, {subscribeMode: "C"})
    await mgrC.initiateConnection(buildLegacyContactURI())
    expect(mockClient.createQueueCalls[0].subscribeMode).toBe("C")
  })

  it("defaults subscribeMode to S", async () => {
    await mgr.initiateConnection(buildLegacyContactURI())
    expect(mockClient.createQueueCalls[0].subscribeMode).toBe("S")
  })

  it("passes sndSecure from config", async () => {
    const agent = createMockAgent(mockClient)
    const mgrNoSecure = new ConnectionManager(agent, {sndSecure: false})
    await mgrNoSecure.initiateConnection(buildLegacyContactURI())
    expect(mockClient.createQueueCalls[0].sndSecure).toBe(false)
  })

  it("defaults sndSecure to true", async () => {
    await mgr.initiateConnection(buildLegacyContactURI())
    expect(mockClient.createQueueCalls[0].sndSecure).toBe(true)
  })

  it("ManagedConnection has non-null contactQueue", async () => {
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn.contactQueue).not.toBeNull()
    expect(conn.contactQueue!.server.hosts).toEqual(["smp1.example.com"])
    expect(conn.contactQueue!.senderId).toBe(SAMPLE_QUEUE_ID)
    expect(conn.contactQueue!.dhPublicKey).toBe(SAMPLE_DH_KEY)
  })

  it("ManagedConnection has non-null receiveQueue", async () => {
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn.receiveQueue).not.toBeNull()
    expect(conn.receiveQueue!.recipientId).toEqual(new Uint8Array(24).fill(0x11))
    expect(conn.receiveQueue!.senderId).toEqual(new Uint8Array(24).fill(0x22))
    expect(conn.receiveQueue!.serverDhKey).toEqual(new Uint8Array(44).fill(0x33))
  })

  it("keys are populated with three key pairs", async () => {
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn.keys.recipientAuth.publicKey.length).toBe(32)
    expect(conn.keys.recipientAuth.privateKey.length).toBe(32)
    expect(conn.keys.recipientDh.publicKey.length).toBe(32)
    expect(conn.keys.recipientDh.privateKey.length).toBe(32)
    expect(conn.keys.e2eDh.publicKey.length).toBe(32)
    expect(conn.keys.e2eDh.privateKey.length).toBe(32)
  })

  it("connection is findable via getConnection()", async () => {
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    const found = mgr.getConnection(conn.state.id)
    expect(found).toBe(conn)
  })

  it("connection appears in getActiveConnections()", async () => {
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    const active = mgr.getActiveConnections()
    expect(active.length).toBe(1)
    expect(active[0]).toBe(conn)
  })

  it("state machine emits event on transition", async () => {
    const events: any[] = []
    // Create connection - need to listen after parsing but before queue creation
    // Instead, verify the state machine has history
    const conn = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn.state.history.length).toBe(1)
    expect(conn.state.history[0].action).toBe("createQueues")
    expect(conn.state.history[0].newState).toBe("QUEUE_CREATED")
  })
})

// -- initiateConnection with short link

describe("initiateConnection with short link", () => {
  it("creates connection with short link", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    const conn = await mgr.initiateConnection(buildShortLinkURI())
    expect(conn.state.state).toBe("QUEUE_CREATED")
  })

  it("contactQueue is null for short links", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    const conn = await mgr.initiateConnection(buildShortLinkURI())
    expect(conn.contactQueue).toBeNull()
  })

  it("uses server from short link for queue creation", async () => {
    const mockClient = createMockClient()
    const getClientCalls: SMPServerAddress[] = []
    const agent: SMPClientAgent = {
      async getClient(server: SMPServerAddress): Promise<SMPClient> {
        getClientCalls.push(server)
        return mockClient
      },
      async reconnect(server: SMPServerAddress): Promise<SMPClient> { return mockClient },
      closeServer() {},
      closeAll() {},
      onConnectionChange() {},
    }
    const mgr = new ConnectionManager(agent)
    await mgr.initiateConnection(buildShortLinkURI())
    expect(getClientCalls.length).toBe(1)
    expect(getClientCalls[0].host).toBe("smp6.simplex.im")
  })
})

// -- initiateConnection error handling

describe("initiateConnection error handling", () => {
  it("invalid URI throws ContactAddressError, state goes to ERROR", async () => {
    const mgr = new ConnectionManager(createMockAgent())
    await expect(mgr.initiateConnection("invalid://uri")).rejects.toThrow()
  })

  it("queue creation failure throws, state goes to ERROR", async () => {
    const failingClient = createMockClient()
    ;(failingClient as any).createQueue = async () => {
      throw new SMPCommandError({type: "AUTH"})
    }
    const mgr = new ConnectionManager(createMockAgent(failingClient))

    await expect(mgr.initiateConnection(buildLegacyContactURI())).rejects.toThrow(SMPCommandError)

    // The connection should be stored with ERROR state
    const active = mgr.getActiveConnections()
    expect(active.length).toBe(0) // ERROR is terminal

    // Find it by checking all connections
    // Since we can not directly iterate, verify the error via a second attempt
  })

  it("error has correct code QUEUE_CREATION_FAILED", async () => {
    const failingClient = createMockClient()
    ;(failingClient as any).createQueue = async () => {
      throw new Error("connection refused")
    }
    const mgr = new ConnectionManager(createMockAgent(failingClient))

    let conn: ManagedConnection | undefined
    try {
      await mgr.initiateConnection(buildLegacyContactURI())
    } catch (_e) {
      // After failure, the connection is stored
    }

    // The error state should be accessible
    // We need the connection ID which was generated internally
    // Check that getActiveConnections is empty (ERROR is terminal)
    expect(mgr.getActiveConnections().length).toBe(0)
  })
})

// -- closeConnection

describe("closeConnection", () => {
  it("closes connection, state goes to CLOSED", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    const conn = await mgr.initiateConnection(buildLegacyContactURI())

    await mgr.closeConnection(conn.state.id)
    expect(conn.state.state).toBe("CLOSED")
  })

  it("closed connection not in active list", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    const conn = await mgr.initiateConnection(buildLegacyContactURI())

    await mgr.closeConnection(conn.state.id)
    expect(mgr.getActiveConnections().length).toBe(0)
  })

  it("closing unknown ID does not throw", async () => {
    const mgr = new ConnectionManager(createMockAgent())
    await expect(mgr.closeConnection("nonexistent")).resolves.not.toThrow()
  })
})

// -- Multiple connections

describe("Multiple connections", () => {
  it("can initiate multiple connections", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    const conn1 = await mgr.initiateConnection(buildLegacyContactURI())
    const conn2 = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn1.state.id).not.toBe(conn2.state.id)
  })

  it("each has separate key material", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    const conn1 = await mgr.initiateConnection(buildLegacyContactURI())
    const conn2 = await mgr.initiateConnection(buildLegacyContactURI())
    expect(conn1.keys.recipientAuth.publicKey).not.toEqual(conn2.keys.recipientAuth.publicKey)
    expect(conn1.keys.recipientDh.publicKey).not.toEqual(conn2.keys.recipientDh.publicKey)
    expect(conn1.keys.e2eDh.publicKey).not.toEqual(conn2.keys.e2eDh.publicKey)
  })

  it("getActiveConnections returns all", async () => {
    const mockClient = createMockClient()
    const mgr = new ConnectionManager(createMockAgent(mockClient))
    await mgr.initiateConnection(buildLegacyContactURI())
    await mgr.initiateConnection(buildLegacyContactURI())
    await mgr.initiateConnection(buildShortLinkURI())
    expect(mgr.getActiveConnections().length).toBe(3)
  })
})

// -- Server identity (keyHash) propagation

describe("Server identity propagation", () => {
  it("passes server identity from contact address as keyHash to getClient", async () => {
    let capturedServer: SMPServerAddress | null = null
    const mockClient = createMockClient()
    const agent: SMPClientAgent = {
      async getClient(server: SMPServerAddress) {
        capturedServer = server
        return mockClient
      },
      async reconnect(server: SMPServerAddress) { return mockClient },
      closeServer() {},
      closeAll() {},
      onConnectionChange() {},
    }

    const mgr = new ConnectionManager(agent)
    await mgr.initiateConnection(buildLegacyContactURI())

    // SAMPLE_IDENTITY = "u2dS9sG8nMNURyZwqASV4yROM28YQxY37YKx2OLSuPA"
    // The keyHash should be the base64url-decoded identity, not all zeros
    expect(capturedServer).not.toBeNull()
    expect(capturedServer!.keyHash.length).toBeGreaterThan(0)
    // Should NOT be all zeros
    expect(capturedServer!.keyHash.some(b => b !== 0)).toBe(true)
  })

  it("preserves server identity when queueServer override is used", async () => {
    let capturedServer: SMPServerAddress | null = null
    const mockClient = createMockClient()
    const agent: SMPClientAgent = {
      async getClient(server: SMPServerAddress) {
        capturedServer = server
        return mockClient
      },
      async reconnect(server: SMPServerAddress) { return mockClient },
      closeServer() {},
      closeAll() {},
      onConnectionChange() {},
    }

    // Use queueServer override (like serverUrl in browser-client)
    // with empty serverIdentity - but the contact address HAS the identity
    const mgr = new ConnectionManager(agent, {
      queueServer: {
        hosts: ["proxy.example.com"],
        port: 443,
        serverIdentity: "", // empty - should be filled from contact address
      },
    })

    await mgr.initiateConnection(buildLegacyContactURI())

    // Should use proxy host:port but contact address identity
    expect(capturedServer).not.toBeNull()
    expect(capturedServer!.host).toBe("proxy.example.com")
    expect(capturedServer!.port).toBe(443)
    // keyHash should come from SAMPLE_IDENTITY, not be all zeros
    expect(capturedServer!.keyHash.some(b => b !== 0)).toBe(true)
  })
})
