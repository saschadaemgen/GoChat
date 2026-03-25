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

  it("has e2e version v3-v3 (0x00 0x03 0x00 0x03) at bytes 4-7", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[4]).toBe(0x00)
    expect(buf[5]).toBe(0x03)
    expect(buf[6]).toBe(0x00)
    expect(buf[7]).toBe(0x03)
  })

  it("has Key1 length prefix 68 (0x00 0x44) at bytes 8-9", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[8]).toBe(0x00)
    expect(buf[9]).toBe(0x44)
  })

  it("has Key1 data at bytes 10-77", () => {
    const key1 = fakeKey(0x11, 68)
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: key1,
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf.subarray(10, 78)).toEqual(key1)
  })

  it("has Key2 length prefix 68 (0x00 0x44) at bytes 78-79", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[78]).toBe(0x00)
    expect(buf[79]).toBe(0x44)
  })

  it("has no KEM tag (0x00) at byte 148", () => {
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: new Uint8Array([0x99]),
    })
    expect(buf[148]).toBe(0x00)
  })

  it("appends encConnInfo at byte 149", () => {
    const connInfo = new Uint8Array([0xAA, 0xBB, 0xCC])
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: connInfo,
    })
    expect(buf.subarray(149)).toEqual(connInfo)
  })

  it("total size is 149 + encConnInfo length", () => {
    const connInfo = new Uint8Array(100).fill(0x42)
    const buf = buildAgentConfirmation({
      ratchetPublicKeySPKI: fakeKey(0x11, 68),
      ephemeralPublicKeySPKI: fakeKey(0x22, 68),
      encryptedConnInfo: connInfo,
    })
    expect(buf.length).toBe(149 + 100)
  })
})
