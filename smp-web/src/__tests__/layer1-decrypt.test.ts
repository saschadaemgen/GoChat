import {describe, it, expect} from "vitest"
import {parseSmpEncConfirmation} from "../layer1-decrypt.js"

describe("parseSmpEncConfirmation", () => {
  it("parses Just (0x31) with X25519 SPKI key", () => {
    // '1' + keyLen(44) + 44B SPKI + 24B nonce + encrypted body
    const spki = new Uint8Array(44).fill(0xAA)
    const nonce = new Uint8Array(24).fill(0xBB)
    const body = new Uint8Array(100).fill(0xCC)
    const data = new Uint8Array(1 + 1 + 44 + 24 + 100)
    data[0] = 0x31 // '1' = Just
    data[1] = 44   // keyLen
    data.set(spki, 2)
    data.set(nonce, 46)
    data.set(body, 70)

    const result = parseSmpEncConfirmation(data)
    expect(result.aliceDhPublicKeyRaw).not.toBeNull()
    expect(result.aliceDhPublicKeyRaw!.length).toBe(32) // raw extracted from 44B SPKI
    expect(result.nonce).toEqual(nonce)
    expect(result.encryptedBody.length).toBe(100)
  })

  it("parses Nothing (0x30) with null DH key", () => {
    // '0' + 24B nonce + encrypted body
    const nonce = new Uint8Array(24).fill(0xBB)
    const body = new Uint8Array(100).fill(0xCC)
    const data = new Uint8Array(1 + 24 + 100)
    data[0] = 0x30 // '0' = Nothing
    data.set(nonce, 1)
    data.set(body, 25)

    const result = parseSmpEncConfirmation(data)
    expect(result.aliceDhPublicKeyRaw).toBeNull()
    expect(result.nonce).toEqual(nonce)
    expect(result.encryptedBody.length).toBe(100)
  })

  it("throws on unexpected Maybe tag", () => {
    const data = new Uint8Array([0x32, ...new Uint8Array(50)])
    expect(() => parseSmpEncConfirmation(data)).toThrow("unexpected Maybe tag")
  })

  it("parses Just with raw 32-byte key", () => {
    // '1' + keyLen(32) + 32B raw key + 24B nonce + body
    const rawKey = new Uint8Array(32).fill(0xDD)
    const nonce = new Uint8Array(24).fill(0xEE)
    const body = new Uint8Array(50).fill(0xFF)
    const data = new Uint8Array(1 + 1 + 32 + 24 + 50)
    data[0] = 0x31
    data[1] = 32
    data.set(rawKey, 2)
    data.set(nonce, 34)
    data.set(body, 58)

    const result = parseSmpEncConfirmation(data)
    expect(result.aliceDhPublicKeyRaw).not.toBeNull()
    expect(result.aliceDhPublicKeyRaw!.length).toBe(32)
    expect(result.aliceDhPublicKeyRaw).toEqual(rawKey)
  })
})
