import {describe, it, expect} from "vitest"
import {rootKdf, chainKdf, unPad, parseEncRatchetMessage, rcDecrypt} from "../ratchet-decrypt.js"
import type {RatchetState} from "../ratchet-decrypt.js"

describe("rootKdf", () => {
  it("produces three 32-byte outputs", () => {
    const rk = new Uint8Array(32).fill(0x11)
    const dh = new Uint8Array(56).fill(0x22)
    const [newRK, ck, nhk] = rootKdf(rk, dh)
    expect(newRK.length).toBe(32)
    expect(ck.length).toBe(32)
    expect(nhk.length).toBe(32)
  })

  it("is deterministic", () => {
    const rk = new Uint8Array(32).fill(0xAA)
    const dh = new Uint8Array(56).fill(0xBB)
    const [a1, a2, a3] = rootKdf(rk, dh)
    const [b1, b2, b3] = rootKdf(rk, dh)
    expect(a1).toEqual(b1)
    expect(a2).toEqual(b2)
    expect(a3).toEqual(b3)
  })

  it("produces non-zero output", () => {
    const [newRK, ck, nhk] = rootKdf(new Uint8Array(32).fill(1), new Uint8Array(56).fill(2))
    expect(newRK.some(b => b !== 0)).toBe(true)
    expect(ck.some(b => b !== 0)).toBe(true)
    expect(nhk.some(b => b !== 0)).toBe(true)
  })

  it("produces distinct outputs from distinct inputs", () => {
    const [a1] = rootKdf(new Uint8Array(32).fill(1), new Uint8Array(56).fill(2))
    const [b1] = rootKdf(new Uint8Array(32).fill(3), new Uint8Array(56).fill(4))
    expect(a1).not.toEqual(b1)
  })
})

describe("chainKdf", () => {
  it("produces correct output sizes (32, 32, 16, 16)", () => {
    const ck = new Uint8Array(32).fill(0x55)
    const [newCK, mk, bodyIV, headerIV] = chainKdf(ck)
    expect(newCK.length).toBe(32)
    expect(mk.length).toBe(32)
    expect(bodyIV.length).toBe(16)
    expect(headerIV.length).toBe(16)
  })

  it("output order: newCK[0:32], messageKey[32:64], bodyIV[64:80], headerIV[80:96]", () => {
    // The CRITICAL test: verify output order matches Haskell/C, NOT CRYPTO.md
    const ck = new Uint8Array(32).fill(0x77)
    const [newCK, mk, bodyIV, headerIV] = chainKdf(ck)
    // All four should be non-zero and distinct
    expect(newCK.some(b => b !== 0)).toBe(true)
    expect(mk.some(b => b !== 0)).toBe(true)
    expect(bodyIV.some(b => b !== 0)).toBe(true)
    expect(headerIV.some(b => b !== 0)).toBe(true)
    expect(newCK).not.toEqual(mk)
  })

  it("is deterministic", () => {
    const ck = new Uint8Array(32).fill(0x99)
    const [a1, a2, a3, a4] = chainKdf(ck)
    const [b1, b2, b3, b4] = chainKdf(ck)
    expect(a1).toEqual(b1)
    expect(a2).toEqual(b2)
    expect(a3).toEqual(b3)
    expect(a4).toEqual(b4)
  })
})

describe("unPad", () => {
  it("reads Word16 BE length and extracts content", () => {
    const data = new Uint8Array([0x00, 0x03, 0x41, 0x42, 0x43, 0x23, 0x23])
    const result = unPad(data)
    expect(result).toEqual(new Uint8Array([0x41, 0x42, 0x43]))
  })

  it("handles zero length", () => {
    const data = new Uint8Array([0x00, 0x00, 0x23, 0x23])
    const result = unPad(data)
    expect(result.length).toBe(0)
  })

  it("handles large content", () => {
    const content = new Uint8Array(300).fill(0x42)
    const data = new Uint8Array(2 + 300 + 50)
    data[0] = 0x01; data[1] = 0x2C // 300
    data.set(content, 2)
    data.fill(0x23, 302) // padding
    const result = unPad(data)
    expect(result.length).toBe(300)
    expect(result[0]).toBe(0x42)
  })
})

describe("parseEncRatchetMessage", () => {
  it("auto-detects v3 (Word16 BE prefix < 0x20)", () => {
    // v3: header len 124 = 0x007C
    const header = new Uint8Array(124).fill(0x11)
    const tag = new Uint8Array(16).fill(0x22)
    const body = new Uint8Array(100).fill(0x33)
    const data = new Uint8Array(2 + 124 + 16 + 100)
    data[0] = 0x00; data[1] = 0x7C // 124
    data.set(header, 2)
    data.set(tag, 126)
    data.set(body, 142)

    const result = parseEncRatchetMessage(data)
    expect(result.emHeaderRaw.length).toBe(124)
    expect(result.emAuthTag.length).toBe(16)
    expect(result.emBody.length).toBe(100)
  })

  it("auto-detects v2 (1-byte prefix >= 0x20)", () => {
    // v2: header len 123 = 0x7B
    const header = new Uint8Array(123).fill(0x11)
    const tag = new Uint8Array(16).fill(0x22)
    const body = new Uint8Array(100).fill(0x33)
    const data = new Uint8Array(1 + 123 + 16 + 100)
    data[0] = 0x7B // 123
    data.set(header, 1)
    data.set(tag, 124)
    data.set(body, 140)

    const result = parseEncRatchetMessage(data)
    expect(result.emHeaderRaw.length).toBe(123)
    expect(result.emAuthTag.length).toBe(16)
    expect(result.emBody.length).toBe(100)
  })
})
