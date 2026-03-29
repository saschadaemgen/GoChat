import {describe, it, expect} from "vitest"
import {
  encodeSMPClientHandshake,
  decodeSMPServerHandshake,
  compatibleVRange,
  smpClientVersionRange,
  blockPad,
  blockUnpad,
  constantTimeEqual,
} from "../handshake.js"
import type {VersionRange, SMPClientHandshake} from "../handshake.js"
import {SMPTransportError} from "../types.js"
import {SMP_BLOCK_SIZE} from "../transport.js"
import {concatBytes, encodeBytes, encodeLarge, encodeWord16} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"

describe("encodeSMPClientHandshake", () => {
  it("produces a 16384-byte block", () => {
    const ch: SMPClientHandshake = {
      smpVersion: 7,
      keyHash: new Uint8Array(32).fill(0xab),
    }
    const block = encodeSMPClientHandshake(ch)
    expect(block.length).toBe(SMP_BLOCK_SIZE)
  })

  it("encodes version and keyHash correctly", () => {
    const keyHash = new Uint8Array(32)
    keyHash[0] = 0xde
    keyHash[31] = 0xad
    const ch: SMPClientHandshake = {smpVersion: 7, keyHash}
    const block = encodeSMPClientHandshake(ch)

    // blockUnpad to get the content
    const content = blockUnpad(block)
    // Content: Word16(version=7) + shortString(keyHash)
    // Word16(7) = [0x00, 0x07]
    expect(content[0]).toBe(0x00)
    expect(content[1]).toBe(0x07)
    // shortString: [length=32] + 32 bytes
    expect(content[2]).toBe(32)
    expect(content[3]).toBe(0xde)
    expect(content[34]).toBe(0xad)
    // Total content length: 2 (version) + 1 (len prefix) + 32 (hash) = 35
    expect(content.length).toBe(35)
  })

  it("encodes version 6 correctly", () => {
    const ch: SMPClientHandshake = {
      smpVersion: 6,
      keyHash: new Uint8Array(32),
    }
    const block = encodeSMPClientHandshake(ch)
    const content = blockUnpad(block)
    // Word16(6) = [0x00, 0x06]
    expect(content[0]).toBe(0x00)
    expect(content[1]).toBe(0x06)
  })
})

describe("decodeSMPServerHandshake", () => {
  it("rejects short error blocks with HANDSHAKE error", () => {
    // Simulate server sending "HANDSHAKE" as an error response
    const errorText = new TextEncoder().encode("HANDSHAKE")
    const block = blockPad(errorText)
    expect(() => decodeSMPServerHandshake(block)).toThrow(SMPTransportError)
    try {
      decodeSMPServerHandshake(block)
    } catch (e) {
      expect(e).toBeInstanceOf(SMPTransportError)
      expect((e as SMPTransportError).code).toBe("HANDSHAKE")
      expect((e as SMPTransportError).message).toContain("HANDSHAKE")
    }
  })

  it("rejects SESSION error blocks", () => {
    const errorText = new TextEncoder().encode("SESSION")
    const block = blockPad(errorText)
    expect(() => decodeSMPServerHandshake(block)).toThrow(SMPTransportError)
    try {
      decodeSMPServerHandshake(block)
    } catch (e) {
      expect((e as SMPTransportError).code).toBe("HANDSHAKE")
      expect((e as SMPTransportError).message).toContain("SESSION")
    }
  })
})

describe("compatibleVRange", () => {
  it("negotiates v6 when server offers v6-18 (DIAGNOSTIC: client capped at v6)", () => {
    const serverRange: VersionRange = {minVersion: 6, maxVersion: 18}
    const result = compatibleVRange(serverRange, smpClientVersionRange)
    expect(result).not.toBeNull()
    expect(result!.minVersion).toBe(6)
    expect(result!.maxVersion).toBe(6)
  })

  it("returns null when server only supports v7 (DIAGNOSTIC: client capped at v6)", () => {
    const serverRange: VersionRange = {minVersion: 7, maxVersion: 7}
    const result = compatibleVRange(serverRange, smpClientVersionRange)
    expect(result).toBeNull()
  })

  it("negotiates when server only supports v6", () => {
    const serverRange: VersionRange = {minVersion: 6, maxVersion: 6}
    const result = compatibleVRange(serverRange, smpClientVersionRange)
    expect(result).not.toBeNull()
    expect(result!.maxVersion).toBe(6)
  })

  it("returns null for incompatible version (server min=8)", () => {
    const serverRange: VersionRange = {minVersion: 8, maxVersion: 18}
    const result = compatibleVRange(serverRange, smpClientVersionRange)
    expect(result).toBeNull()
  })

  it("returns null for incompatible version (server max=5)", () => {
    const serverRange: VersionRange = {minVersion: 3, maxVersion: 5}
    const result = compatibleVRange(serverRange, smpClientVersionRange)
    expect(result).toBeNull()
  })

  it("selects highest mutual version (DIAGNOSTIC: capped at v6)", () => {
    const serverRange: VersionRange = {minVersion: 5, maxVersion: 8}
    const result = compatibleVRange(serverRange, smpClientVersionRange)
    expect(result).not.toBeNull()
    expect(result!.maxVersion).toBe(6)
  })
})

describe("blockPad/blockUnpad roundtrip", () => {
  it("pads to exactly 16384 bytes and unpads correctly", () => {
    const msg = new Uint8Array([1, 2, 3, 4, 5])
    const padded = blockPad(msg)
    expect(padded.length).toBe(SMP_BLOCK_SIZE)
    const unpadded = blockUnpad(padded)
    expect(unpadded).toEqual(msg)
  })

  it("fills padding with '#' (0x23)", () => {
    const msg = new Uint8Array([0xaa])
    const padded = blockPad(msg)
    // Content starts at byte 2 (after 2-byte length prefix)
    // Message is at byte 2, padding starts at byte 3
    expect(padded[3]).toBe(0x23)
    expect(padded[SMP_BLOCK_SIZE - 1]).toBe(0x23)
  })
})

describe("constantTimeEqual", () => {
  it("returns true for equal arrays", () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([1, 2, 3])
    expect(constantTimeEqual(a, b)).toBe(true)
  })

  it("returns false for different arrays", () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([1, 2, 4])
    expect(constantTimeEqual(a, b)).toBe(false)
  })

  it("returns false for different lengths", () => {
    const a = new Uint8Array([1, 2])
    const b = new Uint8Array([1, 2, 3])
    expect(constantTimeEqual(a, b)).toBe(false)
  })
})

// -- WebSocket ServerHello (simplified format without certificate chain)

describe("decodeSMPServerHandshake WebSocket format", () => {
  it("decodes real SMP server WebSocket ServerHello", () => {
    // Real data from smp.simplego.dev:8444 (via Nginx WSS proxy).
    // The ServerHello contains only version range + sessionId,
    // no certificate chain or signed DH key.
    //
    // Raw block starts with:
    // 00 25 = length prefix (37 bytes)
    // 00 06 00 06 = version range min=6, max=6
    // 20 = sessionId length (32)
    // [32 bytes sessionId]
    // 23 23 23... = '#' padding
    const sessionIdBytes = new Uint8Array([
      0x4c, 0x04, 0x8e, 0x33, 0xae, 0xcb, 0xb9, 0x51,
      0xf8, 0x9f, 0x6d, 0x1c, 0xc7, 0xd9, 0x7f, 0xdb,
      0xb4, 0x5c, 0xe6, 0x83, 0x00, 0x29, 0x10, 0x00,
      0xd8, 0xc3, 0xfa, 0xb5, 0x16, 0xec, 0x59, 0x32,
    ])

    // Build the content: versionRange(4) + sessionId(1+32) = 37 bytes
    const content = new Uint8Array(37)
    content[0] = 0x00; content[1] = 0x06 // min version 6
    content[2] = 0x00; content[3] = 0x06 // max version 6
    content[4] = 0x20 // sessionId length = 32
    content.set(sessionIdBytes, 5)

    // Pad to 16KB block
    const block = blockPad(content)
    expect(block.length).toBe(SMP_BLOCK_SIZE)

    // Decode
    const result = decodeSMPServerHandshake(block)
    expect(result.smpVersionRange.minVersion).toBe(6)
    expect(result.smpVersionRange.maxVersion).toBe(6)
    expect(result.sessionId).toEqual(sessionIdBytes)
    expect(result.certChainDer).toEqual([]) // no certs in WebSocket format
    expect(result.signedKeyDer).toEqual(new Uint8Array(0)) // no signed key
  })

  it("decodes WebSocket ServerHello with version range v6-v7", () => {
    const sessionId = new Uint8Array(24).fill(0xAB) // 24-byte sessionId

    const content = new Uint8Array(4 + 1 + 24) // vRange + sessId
    content[0] = 0x00; content[1] = 0x06 // min 6
    content[2] = 0x00; content[3] = 0x07 // max 7
    content[4] = 24 // sessionId length
    content.set(sessionId, 5)

    const block = blockPad(content)
    const result = decodeSMPServerHandshake(block)

    expect(result.smpVersionRange).toEqual({minVersion: 6, maxVersion: 7})
    expect(result.sessionId).toEqual(sessionId)
    expect(result.certChainDer.length).toBe(0)
  })

  it("still decodes full format with certificate chain", () => {
    // Verify backward compatibility: if cert chain is present, it is decoded.
    // Build a minimal valid full-format ServerHello.
    const vRange = concatBytes(encodeWord16(6), encodeWord16(7))
    const sessId = encodeBytes(new Uint8Array(32).fill(0x11))
    // NonEmpty Large cert chain: count=1, then one Large cert blob
    const fakeCert = new Uint8Array(100).fill(0x22)
    const certChain = concatBytes(new Uint8Array([1]), encodeLarge(fakeCert)) // count + Large(cert)
    const signedKey = encodeLarge(new Uint8Array(80).fill(0x33))

    const content = concatBytes(vRange, sessId, certChain, signedKey)
    const block = blockPad(content)
    const result = decodeSMPServerHandshake(block)

    expect(result.smpVersionRange).toEqual({minVersion: 6, maxVersion: 7})
    expect(result.sessionId).toEqual(new Uint8Array(32).fill(0x11))
    expect(result.certChainDer.length).toBe(1)
    expect(result.certChainDer[0]).toEqual(fakeCert)
    expect(result.signedKeyDer).toEqual(new Uint8Array(80).fill(0x33))
  })
})

// -- ClientHello byte-level encoding verification

describe("ClientHello byte-level encoding", () => {
  it("produces correct wire bytes for v6 with known keyHash", () => {
    const keyHash = new Uint8Array(32)
    for (let i = 0; i < 32; i++) keyHash[i] = i + 1 // 01 02 03 ... 20

    const block = encodeSMPClientHandshake({smpVersion: 6, keyHash})

    // Block should be exactly 16384 bytes
    expect(block.length).toBe(16384)

    // First 2 bytes: content length = 35 (Word16 BE: 0x00 0x23)
    // Content: Word16(6) = 0x00 0x06, shortString(keyHash) = 0x20 + 32 bytes
    // Total content: 2 + 1 + 32 = 35 = 0x23
    expect(block[0]).toBe(0x00) // content length high
    expect(block[1]).toBe(0x23) // content length low = 35

    // Version: 0x00 0x06
    expect(block[2]).toBe(0x00)
    expect(block[3]).toBe(0x06)

    // keyHash shortString: length prefix = 0x20 (32)
    expect(block[4]).toBe(0x20)

    // keyHash data: 01 02 03 ... 20
    for (let i = 0; i < 32; i++) {
      expect(block[5 + i]).toBe(i + 1)
    }

    // Padding starts at offset 2 + 35 = 37
    expect(block[37]).toBe(0x23) // '#' padding
  })

  it("uses correct format: blockPad(Word16(version) + shortString(keyHash))", () => {
    // Per SimpleGo protocol team: no sessionId in ClientHello.
    // Format is: blockPad(Word16(smpVersion) + encodeBytes(keyHash))
    const keyHash = new Uint8Array(32).fill(0xFF)
    const block = encodeSMPClientHandshake({smpVersion: 7, keyHash})

    // Unpad to verify content structure
    const content = blockUnpad(block)
    expect(content.length).toBe(35) // 2 (version) + 1 (len) + 32 (hash)

    // Version = 7
    expect(content[0]).toBe(0x00)
    expect(content[1]).toBe(0x07)

    // shortString length = 32
    expect(content[2]).toBe(0x20)

    // keyHash bytes
    for (let i = 0; i < 32; i++) {
      expect(content[3 + i]).toBe(0xFF)
    }
  })
})
