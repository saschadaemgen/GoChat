import {describe, it, expect} from "vitest"
import {parseAgentConnInfoReply} from "../reply-queue.js"

// Helper to build a test SMPQueueInfo binary blob
function buildTestSMPQueueInfo(opts: {
  clientVersion: number
  host: string
  port: string
  keyHash: Uint8Array
  senderId: Uint8Array
  dhKeySpki: Uint8Array
  sndSecure: boolean
}): Uint8Array {
  const parts: number[] = []

  // clientVersion (Word16 BE)
  parts.push((opts.clientVersion >> 8) & 0xFF, opts.clientVersion & 0xFF)

  // SMPServer: NonEmpty hosts
  parts.push(1) // 1 host
  const hostBytes = new TextEncoder().encode(opts.host)
  parts.push(hostBytes.length)
  parts.push(...hostBytes)

  // Port: 1-byte length prefixed
  const portBytes = new TextEncoder().encode(opts.port)
  parts.push(portBytes.length)
  parts.push(...portBytes)

  // KeyHash: 1-byte length prefixed
  parts.push(opts.keyHash.length)
  parts.push(...opts.keyHash)

  // SenderId: 1-byte length prefixed
  parts.push(opts.senderId.length)
  parts.push(...opts.senderId)

  // DH public key: 1-byte length prefixed
  parts.push(opts.dhKeySpki.length)
  parts.push(...opts.dhKeySpki)

  // sndSecure: Bool
  parts.push(opts.sndSecure ? 0x54 : 0x46) // 'T' or 'F'

  return new Uint8Array(parts)
}

function buildTestAgentConnInfoReply(
  queueInfos: Uint8Array[],
  connInfo: Uint8Array
): Uint8Array {
  const parts: number[] = []
  parts.push(0x44) // 'D' tag
  parts.push(queueInfos.length) // queue count
  for (const qi of queueInfos) {
    parts.push(...qi)
  }
  parts.push(...connInfo)
  return new Uint8Array(parts)
}

describe("parseAgentConnInfoReply", () => {
  const keyHash = new Uint8Array(32).fill(0xAA)
  const senderId = new Uint8Array(24).fill(0xBB)
  // X25519 SPKI header + 32 bytes raw key
  const spkiHeader = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00])
  const rawKey = new Uint8Array(32).fill(0xCC)
  const dhKeySpki = new Uint8Array(44)
  dhKeySpki.set(spkiHeader)
  dhKeySpki.set(rawKey, 12)

  it("parses a single queue with connInfo", () => {
    const queueInfo = buildTestSMPQueueInfo({
      clientVersion: 8,
      host: "smp.example.com",
      port: "5223",
      keyHash,
      senderId,
      dhKeySpki,
      sndSecure: true,
    })
    const connInfoJson = new TextEncoder().encode('{"v":"1","event":"x.info"}')
    const data = buildTestAgentConnInfoReply([queueInfo], connInfoJson)

    const result = parseAgentConnInfoReply(data)
    expect(result.queues.length).toBe(1)

    const q = result.queues[0]
    expect(q.clientVersion).toBe(8)
    expect(q.serverHosts).toEqual(["smp.example.com"])
    expect(q.serverPort).toBe("5223")
    expect(q.keyHash).toEqual(keyHash)
    expect(q.senderId).toEqual(senderId)
    expect(q.dhPublicKeySpki).toEqual(dhKeySpki)
    expect(q.dhPublicKeyRaw).toEqual(rawKey)
    expect(q.sndSecure).toBe(true)

    // ConnInfo should be the JSON
    const connInfoStr = new TextDecoder().decode(result.connInfo)
    expect(connInfoStr).toBe('{"v":"1","event":"x.info"}')
  })

  it("parses queue with sndSecure=false", () => {
    const queueInfo = buildTestSMPQueueInfo({
      clientVersion: 7,
      host: "localhost",
      port: "443",
      keyHash: new Uint8Array(32).fill(0x11),
      senderId: new Uint8Array(16).fill(0x22),
      dhKeySpki,
      sndSecure: false,
    })
    const data = buildTestAgentConnInfoReply([queueInfo], new Uint8Array(0))

    const result = parseAgentConnInfoReply(data)
    expect(result.queues[0].sndSecure).toBe(false)
    expect(result.queues[0].serverPort).toBe("443")
    expect(result.connInfo.length).toBe(0)
  })

  it("parses multiple queues", () => {
    const q1 = buildTestSMPQueueInfo({
      clientVersion: 8,
      host: "smp1.example.com",
      port: "5223",
      keyHash,
      senderId: new Uint8Array(24).fill(0x01),
      dhKeySpki,
      sndSecure: true,
    })
    const q2 = buildTestSMPQueueInfo({
      clientVersion: 8,
      host: "smp2.example.com",
      port: "5224",
      keyHash,
      senderId: new Uint8Array(24).fill(0x02),
      dhKeySpki,
      sndSecure: false,
    })
    const connInfo = new TextEncoder().encode("tail data")
    const data = buildTestAgentConnInfoReply([q1, q2], connInfo)

    const result = parseAgentConnInfoReply(data)
    expect(result.queues.length).toBe(2)
    expect(result.queues[0].serverHosts[0]).toBe("smp1.example.com")
    expect(result.queues[1].serverHosts[0]).toBe("smp2.example.com")
    expect(result.queues[0].senderId[0]).toBe(0x01)
    expect(result.queues[1].senderId[0]).toBe(0x02)
    expect(new TextDecoder().decode(result.connInfo)).toBe("tail data")
  })

  it("throws on wrong tag", () => {
    const data = new Uint8Array([0x43, 0x01]) // 'C' instead of 'D'
    expect(() => parseAgentConnInfoReply(data)).toThrow("Expected AgentConnInfoReply tag 'D'")
  })

  it("parses queue with multiple hosts", () => {
    // Build manually: 2 hosts
    const parts: number[] = []
    // clientVersion
    parts.push(0x00, 0x08)
    // SMPServer: NonEmpty with 2 hosts
    parts.push(2) // 2 hosts
    const host1 = new TextEncoder().encode("primary.example.com")
    parts.push(host1.length, ...host1)
    const host2 = new TextEncoder().encode("fallback.example.com")
    parts.push(host2.length, ...host2)
    // Port
    const port = new TextEncoder().encode("5223")
    parts.push(port.length, ...port)
    // KeyHash
    parts.push(32, ...new Uint8Array(32).fill(0xDD))
    // SenderId
    parts.push(24, ...new Uint8Array(24).fill(0xEE))
    // DH key
    parts.push(44, ...dhKeySpki)
    // sndSecure
    parts.push(0x54) // 'T'

    const queueInfo = new Uint8Array(parts)
    const data = buildTestAgentConnInfoReply([queueInfo], new Uint8Array(0))

    const result = parseAgentConnInfoReply(data)
    expect(result.queues[0].serverHosts).toEqual(["primary.example.com", "fallback.example.com"])
  })

  it("parses raw 32-byte DH key (no SPKI)", () => {
    const rawDhKey = new Uint8Array(32).fill(0xFF)
    const queueInfo = buildTestSMPQueueInfo({
      clientVersion: 8,
      host: "smp.example.com",
      port: "5223",
      keyHash,
      senderId,
      dhKeySpki: rawDhKey, // 32 bytes, not SPKI
      sndSecure: true,
    })
    const data = buildTestAgentConnInfoReply([queueInfo], new Uint8Array(0))

    const result = parseAgentConnInfoReply(data)
    expect(result.queues[0].dhPublicKeySpki).toEqual(rawDhKey)
    expect(result.queues[0].dhPublicKeyRaw).toEqual(rawDhKey)
  })
})
