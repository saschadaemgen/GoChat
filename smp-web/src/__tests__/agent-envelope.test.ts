import {describe, it, expect} from "vitest"
import {buildAgentConfirmation} from "../agent-envelope.js"

function fakeKey(fill: number, size: number): Uint8Array {
  return new Uint8Array(size).fill(fill)
}

describe("buildAgentConfirmation", () => {
  it("starts with agentVersion bytes (0x00 0x07)", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[0]).toBe(0x00)
    expect(buf[1]).toBe(0x07)
  })

  it("has Confirmation tag C (0x43) at byte 2", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[2]).toBe(0x43)
  })

  it("has Just tag (0x31) at byte 3", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[3]).toBe(0x31)
  })

  it("has e2eVersion = 2 (0x00 0x02) at bytes 4-5", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[4]).toBe(0x00)
    expect(buf[5]).toBe(0x02)
  })

  it("has Key1 1-byte length prefix 68 (0x44) at byte 6", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[6]).toBe(0x44) // 68 decimal = 1-byte prefix
  })

  it("has Key1 data at bytes 7-74", () => {
    const key1 = fakeKey(0x11, 68)
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: key1,
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf.subarray(7, 75)).toEqual(key1)
  })

  it("has Key2 1-byte length prefix 68 (0x44) at byte 75", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[75]).toBe(0x44) // 68 decimal
  })

  it("has Key2 data at bytes 76-143", () => {
    const key2 = fakeKey(0x22, 68)
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: key2,
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf.subarray(76, 144)).toEqual(key2)
  })

  it("appends encConnInfo at byte 144 (tail, no length prefix)", () => {
    const connInfo = new Uint8Array([0xAA, 0xBB, 0xCC])
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: connInfo,
    })
    expect(buf.subarray(144)).toEqual(connInfo)
  })

  it("total size is 144 + encConnInfo length", () => {
    const connInfo = new Uint8Array(100).fill(0x42)
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: connInfo,
    })
    expect(buf.length).toBe(144 + 100)
  })
})
