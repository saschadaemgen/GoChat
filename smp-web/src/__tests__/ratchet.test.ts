import {describe, it, expect} from "vitest"
import {initSendRatchet, ratchetEncrypt} from "../ratchet.js"
import type {RatchetSendState} from "../ratchet.js"
import {performX3DH} from "../x3dh.js"
import {generateX448KeyPair} from "../crypto-utils.js"

function createTestState(): RatchetSendState {
  const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
  const theirKey1 = generateX448KeyPair().publicKey
  const theirKey2 = generateX448KeyPair().publicKey
  const x3dhResult = performX3DH(ourKeys, theirKey1, theirKey2)
  return initSendRatchet(x3dhResult, ourKeys.key1)
}

describe("initSendRatchet", () => {
  it("creates valid state with 32-byte keys", () => {
    const state = createTestState()
    expect(state.rootKey.length).toBe(32)
    expect(state.chainKey.length).toBe(32)
    expect(state.headerKey.length).toBe(32)
    expect(state.nextHeaderKey.length).toBe(32)
  })

  it("message number starts at 0", () => {
    const state = createTestState()
    expect(state.messageNumber).toBe(0)
  })

  it("previous chain length starts at 0", () => {
    const state = createTestState()
    expect(state.previousChainLength).toBe(0)
  })

  it("ratchet public key is 56 bytes (X448)", () => {
    const state = createTestState()
    expect(state.ratchetPublicKey.length).toBe(56)
  })

  it("chain key is not all zeros", () => {
    const state = createTestState()
    expect(state.chainKey.some(b => b !== 0)).toBe(true)
  })

  it("chain key differs from root key", () => {
    const state = createTestState()
    expect(state.chainKey).not.toEqual(state.rootKey)
  })
})

describe("ratchetEncrypt", () => {
  it("produces output with headerNonce(12) + encryptedHeader(2362) + encryptedBody", () => {
    const state = createTestState()
    const plaintext = new Uint8Array([0x01, 0x02, 0x03, 0x04])
    const envelope = ratchetEncrypt(state, plaintext)

    // headerNonce: 12, encryptedHeader: 2346+16=2362, body: 4+16=20
    expect(envelope.length).toBe(12 + 2362 + (4 + 16))
  })

  it("header nonce is first 12 bytes", () => {
    const state = createTestState()
    const envelope = ratchetEncrypt(state, new Uint8Array([0x01]))
    const nonce = envelope.subarray(0, 12)
    expect(nonce.length).toBe(12)
  })

  it("encrypted header is 2362 bytes (2346 padded + 16 GCM tag)", () => {
    const state = createTestState()
    const envelope = ratchetEncrypt(state, new Uint8Array([0x01]))
    const encHeader = envelope.subarray(12, 12 + 2362)
    expect(encHeader.length).toBe(2362)
  })

  it("increments message number after encrypt", () => {
    const state = createTestState()
    expect(state.messageNumber).toBe(0)
    ratchetEncrypt(state, new Uint8Array([0x01]))
    expect(state.messageNumber).toBe(1)
    ratchetEncrypt(state, new Uint8Array([0x02]))
    expect(state.messageNumber).toBe(2)
  })

  it("advances chain key after encrypt", () => {
    const state = createTestState()
    const ck0 = new Uint8Array(state.chainKey)
    ratchetEncrypt(state, new Uint8Array([0x01]))
    expect(state.chainKey).not.toEqual(ck0)
  })

  it("different plaintexts produce different ciphertexts", () => {
    const state1 = createTestState()
    const state2 = createTestState()
    // Use same keys by copying
    state2.chainKey = new Uint8Array(state1.chainKey)
    state2.headerKey = new Uint8Array(state1.headerKey)
    state2.ratchetPublicKey = new Uint8Array(state1.ratchetPublicKey)

    const e1 = ratchetEncrypt(state1, new Uint8Array([0x01, 0x02]))
    const e2 = ratchetEncrypt(state2, new Uint8Array([0x03, 0x04]))

    // Body portions should differ (after header)
    const body1 = e1.subarray(12 + 2362)
    const body2 = e2.subarray(12 + 2362)
    expect(body1).not.toEqual(body2)
  })

  it("handles empty plaintext", () => {
    const state = createTestState()
    const envelope = ratchetEncrypt(state, new Uint8Array(0))
    // 12 + 2362 + 16 (GCM tag only, no plaintext)
    expect(envelope.length).toBe(12 + 2362 + 16)
  })

  it("handles large plaintext", () => {
    const state = createTestState()
    const big = new Uint8Array(10000).fill(0x42)
    const envelope = ratchetEncrypt(state, big)
    expect(envelope.length).toBe(12 + 2362 + 10000 + 16)
  })
})
