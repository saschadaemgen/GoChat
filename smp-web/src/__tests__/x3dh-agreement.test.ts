import {describe, it, expect} from "vitest"
import {x3dhReceiver} from "../x3dh-agreement.js"
import type {X448KeyPair} from "../x3dh-agreement.js"
import {generateX448KeyPair} from "../crypto-utils.js"

function makeKeyPair(): X448KeyPair {
  const kp = generateX448KeyPair()
  return {publicKey: kp.publicKey, privateKey: kp.privateKey}
}

describe("x3dhReceiver", () => {
  it("produces deterministic output for same inputs", () => {
    const our1 = makeKeyPair()
    const our2 = makeKeyPair()
    const peer1 = makeKeyPair().publicKey
    const peer2 = makeKeyPair().publicKey

    const r1 = x3dhReceiver(our1, our2, peer1, peer2)
    const r2 = x3dhReceiver(our1, our2, peer1, peer2)

    expect(r1.ratchetKey).toEqual(r2.ratchetKey)
    expect(r1.sndHK).toEqual(r2.sndHK)
    expect(r1.rcvNextHK).toEqual(r2.rcvNextHK)
    expect(r1.assocData).toEqual(r2.assocData)
  })

  it("produces correct output sizes", () => {
    const r = x3dhReceiver(makeKeyPair(), makeKeyPair(), makeKeyPair().publicKey, makeKeyPair().publicKey)
    expect(r.ratchetKey.length).toBe(32)
    expect(r.sndHK.length).toBe(32)
    expect(r.rcvNextHK.length).toBe(32)
    expect(r.assocData.length).toBe(112)
  })

  it("produces distinct keys (ratchetKey != sndHK != rcvNextHK)", () => {
    const r = x3dhReceiver(makeKeyPair(), makeKeyPair(), makeKeyPair().publicKey, makeKeyPair().publicKey)
    expect(r.ratchetKey).not.toEqual(r.sndHK)
    expect(r.ratchetKey).not.toEqual(r.rcvNextHK)
    expect(r.sndHK).not.toEqual(r.rcvNextHK)
  })

  it("assocData has initiator (peer) key1 first, responder (our) key1 second", () => {
    const our1 = makeKeyPair()
    const our2 = makeKeyPair()
    const peer1 = makeKeyPair().publicKey
    const peer2 = makeKeyPair().publicKey

    const r = x3dhReceiver(our1, our2, peer1, peer2)

    // First 56 bytes = peer key1 (initiator)
    expect(r.assocData.subarray(0, 56)).toEqual(peer1)
    // Next 56 bytes = our key1 public (responder)
    expect(r.assocData.subarray(56, 112)).toEqual(our1.publicKey)
  })

  it("different peer keys produce different output", () => {
    const our1 = makeKeyPair()
    const our2 = makeKeyPair()
    const peer1a = makeKeyPair().publicKey
    const peer1b = makeKeyPair().publicKey
    const peer2 = makeKeyPair().publicKey

    const r1 = x3dhReceiver(our1, our2, peer1a, peer2)
    const r2 = x3dhReceiver(our1, our2, peer1b, peer2)

    expect(r1.ratchetKey).not.toEqual(r2.ratchetKey)
  })

  it("rejects wrong key size (55 bytes)", () => {
    expect(() => x3dhReceiver(
      makeKeyPair(), makeKeyPair(),
      new Uint8Array(55), makeKeyPair().publicKey
    )).toThrow("peerKey1 size 55")
  })

  it("rejects wrong key size (57 bytes)", () => {
    expect(() => x3dhReceiver(
      makeKeyPair(), makeKeyPair(),
      makeKeyPair().publicKey, new Uint8Array(57)
    )).toThrow("peerKey2 size 57")
  })

  it("non-zero output (HKDF produces non-trivial keys)", () => {
    const r = x3dhReceiver(makeKeyPair(), makeKeyPair(), makeKeyPair().publicKey, makeKeyPair().publicKey)
    expect(r.ratchetKey.some(b => b !== 0)).toBe(true)
    expect(r.sndHK.some(b => b !== 0)).toBe(true)
    expect(r.rcvNextHK.some(b => b !== 0)).toBe(true)
  })
})
