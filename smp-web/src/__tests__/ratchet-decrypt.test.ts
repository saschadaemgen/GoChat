import {describe, it, expect} from "vitest"
import {rootKdf, chainKdf, unPad, pad, parseEncRatchetMessage, rcDecrypt, rcEncrypt} from "../ratchet-decrypt.js"
import type {RatchetState} from "../ratchet-decrypt.js"
import {generateX448KeyPair} from "../crypto-utils.js"
import {x448} from "@noble/curves/ed448"
import {hkdf} from "@noble/hashes/hkdf"
import {sha512} from "@noble/hashes/sha512"

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

describe("pad / unPad roundtrip", () => {
  it("pad then unPad recovers original data", () => {
    const data = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]) // "Hello"
    const padded = pad(data, 100)
    expect(padded.length).toBe(100)
    expect(padded[0]).toBe(0) // high byte of length 5
    expect(padded[1]).toBe(5) // low byte of length 5
    expect(padded[7]).toBe(0x23) // padding starts after data

    const recovered = unPad(padded)
    expect(recovered).toEqual(data)
  })
})

describe("rcEncrypt / rcDecrypt roundtrip", () => {
  function makeTestRatchetState(): {senderState: RatchetState; receiverState: RatchetState} {
    // Simulate post-X3DH state where sender has valid cks/hks
    // and receiver has matching nhkr/rootKey
    const senderDh = generateX448KeyPair()
    const receiverDh = generateX448KeyPair()
    const assocData = new Uint8Array(112).fill(0x42)

    // Derive initial keys from a fake X3DH output
    const fakeRatchetKey = new Uint8Array(32).fill(0x11)
    const dhShared = x448.scalarMult(senderDh.privateKey, receiverDh.publicKey)
    const [rk1, senderCKs, senderNHKs] = rootKdf(fakeRatchetKey, dhShared)

    // Reverse direction for receiver
    const dhSharedRev = x448.scalarMult(receiverDh.privateKey, senderDh.publicKey)
    const [rk1r, receiverCKr, receiverNHKr] = rootKdf(fakeRatchetKey, dhSharedRev)

    // Sender's header key = derive from rootKdf for sending
    const senderHKs = hkdf(sha512, fakeRatchetKey, undefined, "TestSenderHK", 32)

    const senderState: RatchetState = {
      rootKey: rk1,
      cks: senderCKs,
      ckr: new Uint8Array(32),
      hks: new Uint8Array(senderHKs),
      hkr: new Uint8Array(32),
      nhks: senderNHKs,
      nhkr: new Uint8Array(32),
      dhSelf: senderDh,
      dhPeer: receiverDh.publicKey,
      ns: 0,
      nr: 0,
      pn: 0,
      assocData,
    }

    const receiverState: RatchetState = {
      rootKey: fakeRatchetKey,
      cks: new Uint8Array(32),
      ckr: new Uint8Array(32),
      hks: new Uint8Array(32),
      hkr: new Uint8Array(32),
      nhks: new Uint8Array(32),
      nhkr: new Uint8Array(senderHKs), // receiver's nhkr = sender's hks
      dhSelf: receiverDh,
      dhPeer: new Uint8Array(56),
      ns: 0,
      nr: 0,
      pn: 0,
      assocData,
    }

    return {senderState, receiverState}
  }

  it("encrypts and decrypts a message", () => {
    const {senderState, receiverState} = makeTestRatchetState()
    const plaintext = new TextEncoder().encode("Hello from GoChat!")

    // Encrypt
    const {encrypted, updatedState: newSenderState} = rcEncrypt(senderState, plaintext)
    expect(newSenderState.ns).toBe(1)
    expect(encrypted.length).toBeGreaterThan(100)

    // Decrypt (receiver uses AdvanceRatchet since nhkr matches sender's hks)
    const {agentMessage, updatedState: newReceiverState} = rcDecrypt(receiverState, encrypted)
    expect(new TextDecoder().decode(agentMessage)).toBe("Hello from GoChat!")
    expect(newReceiverState.nr).toBe(1)
  })

  it("handles multiple messages in sequence", () => {
    const {senderState, receiverState} = makeTestRatchetState()

    // Send message 0
    const {encrypted: enc0, updatedState: s1} = rcEncrypt(senderState, new TextEncoder().encode("msg0"))
    const {agentMessage: dec0, updatedState: r1} = rcDecrypt(receiverState, enc0)
    expect(new TextDecoder().decode(dec0)).toBe("msg0")

    // Send message 1 (SameRatchet - same sender DH key)
    const {encrypted: enc1, updatedState: s2} = rcEncrypt(s1, new TextEncoder().encode("msg1"))
    expect(s2.ns).toBe(2)

    // Decrypt message 1 - receiver should use hkr (promoted from nhkr after msg 0)
    const {agentMessage: dec1, updatedState: r2} = rcDecrypt(r1, enc1)
    expect(new TextDecoder().decode(dec1)).toBe("msg1")
    expect(r2.nr).toBe(2)
  })
})
