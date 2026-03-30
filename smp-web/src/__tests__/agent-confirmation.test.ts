import {describe, it, expect} from "vitest"
import {parseAgentConfirmation} from "../agent-confirmation.js"
import type {ParsedAgentConfirmation} from "../agent-confirmation.js"

// X448 SPKI DER header (12 bytes)
const X448_HEADER = new Uint8Array([0x30, 0x42, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6f, 0x03, 0x39, 0x00])

function makeX448Spki(fill: number): Uint8Array {
  const spki = new Uint8Array(68)
  spki.set(X448_HEADER, 0)
  spki.fill(fill, 12) // 56 bytes raw key
  return spki
}

// Build a complete AgentConfirmation with e2eVersion=3 and KEM Nothing
function buildTestData(encConnInfo: Uint8Array, e2eVersion = 3): Uint8Array {
  const key1 = makeX448Spki(0xAA)
  const key2 = makeX448Spki(0xBB)
  const parts: number[] = []
  // agentVersion = 7
  parts.push(0x00, 0x07)
  // tag 'C'
  parts.push(0x43)
  // Maybe Just
  parts.push(0x31)
  // e2eVersion
  parts.push((e2eVersion >>> 8) & 0xFF, e2eVersion & 0xFF)
  // key1: 1-byte length + 68 bytes SPKI
  parts.push(68)
  for (const b of key1) parts.push(b)
  // key2: 1-byte length + 68 bytes SPKI
  parts.push(68)
  for (const b of key2) parts.push(b)
  // KEM Nothing (only for v >= 3)
  if (e2eVersion >= 3) parts.push(0x30)
  // encConnInfo (Tail - no length prefix)
  for (const b of encConnInfo) parts.push(b)
  return new Uint8Array(parts)
}

describe("parseAgentConfirmation", () => {
  it("parses known hex prefix 00 07 43 31 00 03 44 30 42 30", () => {
    const data = buildTestData(new Uint8Array([0x99, 0x88]))
    expect(data[0]).toBe(0x00) // agentVersion high
    expect(data[1]).toBe(0x07) // agentVersion low
    expect(data[2]).toBe(0x43) // 'C'
    expect(data[3]).toBe(0x31) // Just
    expect(data[4]).toBe(0x00) // e2eVersion high
    expect(data[5]).toBe(0x03) // e2eVersion low
    expect(data[6]).toBe(0x44) // key1 length = 68
    expect(data[7]).toBe(0x30) // start of X448 SPKI
    expect(data[8]).toBe(0x42) // SPKI SEQUENCE length

    const result = parseAgentConfirmation(data)
    expect(result.agentVersion).toBe(7)
    expect(result.e2eEncryption.e2eVersion).toBe(3)
  })

  it("extracts X448 raw keys at SPKI offset 12", () => {
    const data = buildTestData(new Uint8Array([0x01]))
    const result = parseAgentConfirmation(data)
    expect(result.e2eEncryption.key1Raw.length).toBe(56)
    expect(result.e2eEncryption.key2Raw.length).toBe(56)
    // key1 filled with 0xAA, key2 with 0xBB
    expect(result.e2eEncryption.key1Raw[0]).toBe(0xAA)
    expect(result.e2eEncryption.key2Raw[0]).toBe(0xBB)
  })

  it("preserves full SPKI DER (68 bytes)", () => {
    const data = buildTestData(new Uint8Array([0x01]))
    const result = parseAgentConfirmation(data)
    expect(result.e2eEncryption.key1Spki.length).toBe(68)
    expect(result.e2eEncryption.key2Spki.length).toBe(68)
    // Check OID
    expect(result.e2eEncryption.key1Spki[6]).toBe(0x2b) // OID
    expect(result.e2eEncryption.key1Spki[7]).toBe(0x65)
    expect(result.e2eEncryption.key1Spki[8]).toBe(0x6f) // X448
  })

  it("rejects X25519 SPKI (wrong OID)", () => {
    const data = buildTestData(new Uint8Array([0x01]))
    // Corrupt key1 OID from 6f (X448) to 6e (X25519)
    data[6 + 1 + 8] = 0x6e // offset: e2eVer(2) + justTag(1) + e2eVer(2) + keyLen(1) + SPKI byte 8
    expect(() => parseAgentConfirmation(data)).toThrow("Bad OID")
  })

  it("throws on Maybe Nothing (0x30)", () => {
    const parts = [0x00, 0x07, 0x43, 0x30] // version=7, 'C', Nothing
    const data = new Uint8Array(parts)
    expect(() => parseAgentConfirmation(data)).toThrow("Nothing")
  })

  it("parses e2eVersion=2 without KEM field", () => {
    const connInfo = new Uint8Array([0xDE, 0xAD])
    const data = buildTestData(connInfo, 2) // v2: no KEM field
    const result = parseAgentConfirmation(data)
    expect(result.e2eEncryption.e2eVersion).toBe(2)
    expect(result.e2eEncryption.kemParams).toBeUndefined()
    expect(result.encConnInfo).toEqual(connInfo)
  })

  it("parses e2eVersion=3 with KEM Nothing", () => {
    const connInfo = new Uint8Array([0xCA, 0xFE])
    const data = buildTestData(connInfo, 3)
    const result = parseAgentConfirmation(data)
    expect(result.e2eEncryption.e2eVersion).toBe(3)
    expect(result.e2eEncryption.kemParams).toBeUndefined()
    expect(result.encConnInfo).toEqual(connInfo)
  })

  it("extracts encConnInfo as Tail (no length prefix)", () => {
    const connInfo = new Uint8Array(100).fill(0x42)
    const data = buildTestData(connInfo)
    const result = parseAgentConfirmation(data)
    expect(result.encConnInfo.length).toBe(100)
    expect(result.encConnInfo[0]).toBe(0x42)
    expect(result.encConnInfo[99]).toBe(0x42)
  })

  it("full round-trip with all fields", () => {
    const connInfo = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
    const data = buildTestData(connInfo, 3)
    const result = parseAgentConfirmation(data)

    expect(result.agentVersion).toBe(7)
    expect(result.e2eEncryption.e2eVersion).toBe(3)
    expect(result.e2eEncryption.key1Raw.length).toBe(56)
    expect(result.e2eEncryption.key2Raw.length).toBe(56)
    expect(result.e2eEncryption.key1Spki.length).toBe(68)
    expect(result.e2eEncryption.key2Spki.length).toBe(68)
    expect(result.e2eEncryption.kemParams).toBeUndefined()
    expect(result.encConnInfo).toEqual(connInfo)
  })

  it("throws on wrong tag (not 'C')", () => {
    const data = new Uint8Array([0x00, 0x07, 0x49]) // 'I' instead of 'C'
    expect(() => parseAgentConfirmation(data)).toThrow("tag 'C'")
  })
})
