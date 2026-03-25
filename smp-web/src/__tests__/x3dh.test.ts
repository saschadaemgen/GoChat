import {describe, it, expect} from "vitest"
import {performX3DH} from "../x3dh.js"
import {generateX448KeyPair} from "../crypto-utils.js"

describe("performX3DH", () => {
  it("produces 96 bytes total (32+32+32)", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const theirKey1 = generateX448KeyPair().publicKey
    const theirKey2 = generateX448KeyPair().publicKey

    const result = performX3DH(ourKeys, theirKey1, theirKey2)
    expect(result.rootKey.length).toBe(32)
    expect(result.headerKey.length).toBe(32)
    expect(result.nextHeaderKey.length).toBe(32)
  })

  it("rootKey is 32 bytes", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const result = performX3DH(ourKeys, generateX448KeyPair().publicKey, generateX448KeyPair().publicKey)
    expect(result.rootKey.length).toBe(32)
  })

  it("headerKey is 32 bytes", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const result = performX3DH(ourKeys, generateX448KeyPair().publicKey, generateX448KeyPair().publicKey)
    expect(result.headerKey.length).toBe(32)
  })

  it("nextHeaderKey is 32 bytes", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const result = performX3DH(ourKeys, generateX448KeyPair().publicKey, generateX448KeyPair().publicKey)
    expect(result.nextHeaderKey.length).toBe(32)
  })

  it("same inputs produce same outputs (deterministic)", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const theirKey1 = generateX448KeyPair().publicKey
    const theirKey2 = generateX448KeyPair().publicKey

    const r1 = performX3DH(ourKeys, theirKey1, theirKey2)
    const r2 = performX3DH(ourKeys, theirKey1, theirKey2)

    expect(r1.rootKey).toEqual(r2.rootKey)
    expect(r1.headerKey).toEqual(r2.headerKey)
    expect(r1.nextHeaderKey).toEqual(r2.nextHeaderKey)
  })

  it("different inputs produce different outputs", () => {
    const ourKeys1 = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const ourKeys2 = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const theirKey1 = generateX448KeyPair().publicKey
    const theirKey2 = generateX448KeyPair().publicKey

    const r1 = performX3DH(ourKeys1, theirKey1, theirKey2)
    const r2 = performX3DH(ourKeys2, theirKey1, theirKey2)

    expect(r1.rootKey).not.toEqual(r2.rootKey)
  })

  it("all three outputs are distinct from each other", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const result = performX3DH(ourKeys, generateX448KeyPair().publicKey, generateX448KeyPair().publicKey)

    expect(result.rootKey).not.toEqual(result.headerKey)
    expect(result.rootKey).not.toEqual(result.nextHeaderKey)
    expect(result.headerKey).not.toEqual(result.nextHeaderKey)
  })

  it("rootKey is not all zeros", () => {
    const ourKeys = {key1: generateX448KeyPair(), key2: generateX448KeyPair()}
    const result = performX3DH(ourKeys, generateX448KeyPair().publicKey, generateX448KeyPair().publicKey)
    expect(result.rootKey.some(b => b !== 0)).toBe(true)
  })

  it("uses all four DH combinations (swapping key pairs changes output)", () => {
    const k1 = generateX448KeyPair()
    const k2 = generateX448KeyPair()
    const theirKey1 = generateX448KeyPair().publicKey
    const theirKey2 = generateX448KeyPair().publicKey

    const r1 = performX3DH({key1: k1, key2: k2}, theirKey1, theirKey2)
    const r2 = performX3DH({key1: k2, key2: k1}, theirKey1, theirKey2)

    // Swapping key1/key2 changes the DH pattern, so output differs
    expect(r1.rootKey).not.toEqual(r2.rootKey)
  })
})
