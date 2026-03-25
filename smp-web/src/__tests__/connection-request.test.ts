import {describe, it, expect} from "vitest"
import {
  buildConnInfoJSON,
  buildSmpEncConfirmation,
  buildSmpConfirmation,
  buildSmpConfirmationWithKey,
} from "../connection-request.js"
import {
  generateX448KeyPair,
  generateX25519KeyPair,
  encodeEd25519PublicKey,
  generateEd25519KeyPair,
  encodeX448PublicKey,
  x448DH,
  x25519DH,
  decodeX448PublicKey,
} from "../crypto-utils.js"

// -- connInfo JSON tests

describe("buildConnInfoJSON", () => {
  it("produces valid JSON", () => {
    const json = buildConnInfoJSON("Visitor")
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it("has correct structure (v, event, params.profile)", () => {
    const parsed = JSON.parse(buildConnInfoJSON("Test User"))
    expect(parsed.v).toBe("1-16")
    expect(parsed.event).toBe("x.info")
    expect(parsed.params.profile.displayName).toBe("Test User")
    expect(parsed.params.profile.fullName).toBe("")
  })

  it("includes preferences", () => {
    const parsed = JSON.parse(buildConnInfoJSON("Test"))
    expect(parsed.params.profile.preferences.reactions.allow).toBe("yes")
    expect(parsed.params.profile.preferences.calls.allow).toBe("no")
  })

  it("uses the display name parameter", () => {
    const json1 = buildConnInfoJSON("Alice")
    const json2 = buildConnInfoJSON("Bob")
    expect(json1).toContain("Alice")
    expect(json2).toContain("Bob")
  })
})

// -- X448 crypto tests (extended from crypto-utils)

describe("X448 crypto", () => {
  it("generateX448KeyPair returns 56-byte keys", () => {
    const kp = generateX448KeyPair()
    expect(kp.publicKey.length).toBe(56)
    expect(kp.privateKey.length).toBe(56)
  })

  it("generateX448KeyPair returns unique pairs", () => {
    const kp1 = generateX448KeyPair()
    const kp2 = generateX448KeyPair()
    expect(kp1.publicKey).not.toEqual(kp2.publicKey)
  })

  it("x448DH produces 56-byte shared secret", () => {
    const alice = generateX448KeyPair()
    const bob = generateX448KeyPair()
    const shared = x448DH(alice.privateKey, bob.publicKey)
    expect(shared.length).toBe(56)
  })

  it("x448DH is commutative", () => {
    const alice = generateX448KeyPair()
    const bob = generateX448KeyPair()
    const s1 = x448DH(alice.privateKey, bob.publicKey)
    const s2 = x448DH(bob.privateKey, alice.publicKey)
    expect(s1).toEqual(s2)
  })

  it("encodeX448PublicKey produces 68 bytes", () => {
    const kp = generateX448KeyPair()
    const spki = encodeX448PublicKey(kp.publicKey)
    expect(spki.length).toBe(68)
  })

  it("encodeX448PublicKey has correct OID (2b 65 6f = 1.3.101.111)", () => {
    const spki = encodeX448PublicKey(new Uint8Array(56))
    expect(spki[6]).toBe(0x2b)
    expect(spki[7]).toBe(0x65)
    expect(spki[8]).toBe(0x6f) // X448 OID
  })

  it("decodeX448PublicKey roundtrips correctly", () => {
    const kp = generateX448KeyPair()
    const spki = encodeX448PublicKey(kp.publicKey)
    const decoded = decodeX448PublicKey(spki)
    expect(decoded).toEqual(kp.publicKey)
  })

  it("decodeX448PublicKey throws on wrong length", () => {
    expect(() => decodeX448PublicKey(new Uint8Array(44))).toThrow()
  })
})

// -- smpConfirmation tests

describe("buildSmpConfirmation", () => {
  it("starts with _ (0x5F) for empty header", () => {
    const envelope = new Uint8Array([0x01, 0x02])
    const result = buildSmpConfirmation(envelope)
    expect(result[0]).toBe(0x5F)
  })

  it("appends agent envelope after header", () => {
    const envelope = new Uint8Array([0xAA, 0xBB])
    const result = buildSmpConfirmation(envelope)
    expect(result.subarray(1)).toEqual(envelope)
  })
})

describe("buildSmpConfirmationWithKey", () => {
  it("starts with K (0x4B) for sender key header", () => {
    const key = encodeEd25519PublicKey(generateEd25519KeyPair().publicKey)
    const envelope = new Uint8Array([0x01])
    const result = buildSmpConfirmationWithKey(key, envelope)
    expect(result[0]).toBe(0x4B)
  })

  it("has key length 44 at byte 1", () => {
    const key = encodeEd25519PublicKey(generateEd25519KeyPair().publicKey)
    const result = buildSmpConfirmationWithKey(key, new Uint8Array([0x01]))
    expect(result[1]).toBe(44)
  })

  it("contains sender key at bytes 2-45", () => {
    const kp = generateEd25519KeyPair()
    const key = encodeEd25519PublicKey(kp.publicKey)
    const result = buildSmpConfirmationWithKey(key, new Uint8Array([0x01]))
    expect(result.subarray(2, 46)).toEqual(key)
  })
})

// -- smpEncConfirmation tests

describe("buildSmpEncConfirmation", () => {
  it("has smpPubHeader with version at bytes 0-1", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const confirmation = new Uint8Array(100).fill(0x42)
    const sharedSecret = new Uint8Array(32).fill(0x33)

    const result = buildSmpEncConfirmation(7, dhKey, confirmation, sharedSecret)
    // Version 7 = 0x00 0x07
    expect(result[0]).toBe(0x00)
    expect(result[1]).toBe(0x07)
  })

  it("has DH key indicator 1 (0x31) at byte 2", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const result = buildSmpEncConfirmation(7, dhKey, new Uint8Array(100), new Uint8Array(32))
    expect(result[2]).toBe(0x31)
  })

  it("has DH key length 44 at byte 3", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const result = buildSmpEncConfirmation(7, dhKey, new Uint8Array(100), new Uint8Array(32))
    expect(result[3]).toBe(44)
  })

  it("contains DH key at bytes 4-47", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const result = buildSmpEncConfirmation(7, dhKey, new Uint8Array(100), new Uint8Array(32))
    expect(result.subarray(4, 48)).toEqual(dhKey)
  })

  it("has 24-byte nonce after header", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const result = buildSmpEncConfirmation(7, dhKey, new Uint8Array(100), new Uint8Array(32))
    const nonce = result.subarray(48, 72)
    expect(nonce.length).toBe(24)
  })

  it("encrypted body is 15936 bytes (15920 padded + 16 poly1305 tag)", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const result = buildSmpEncConfirmation(7, dhKey, new Uint8Array(100), new Uint8Array(32))
    const encBody = result.subarray(72)
    expect(encBody.length).toBe(15936)
  })

  it("total size is 2+1+1+44+24+15936 = 16008", () => {
    const dhKey = new Uint8Array(44).fill(0x11)
    const result = buildSmpEncConfirmation(7, dhKey, new Uint8Array(100), new Uint8Array(32))
    expect(result.length).toBe(16008)
  })
})

// -- X25519 DH test

describe("x25519DH", () => {
  it("produces 32-byte shared secret", () => {
    const alice = generateX25519KeyPair()
    const bob = generateX25519KeyPair()
    const shared = x25519DH(alice.privateKey, bob.publicKey)
    expect(shared.length).toBe(32)
  })

  it("is commutative", () => {
    const alice = generateX25519KeyPair()
    const bob = generateX25519KeyPair()
    const s1 = x25519DH(alice.privateKey, bob.publicKey)
    const s2 = x25519DH(bob.privateKey, alice.publicKey)
    expect(s1).toEqual(s2)
  })
})
