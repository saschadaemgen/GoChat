import {describe, it, expect} from "vitest"
import {Decoder, concatBytes, encodeBytes, encodeLarge} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"
import {decodeResponse, decodeError} from "../protocol.js"
import type {SMPResponse, SMPError} from "../protocol.js"

// -- Helpers

function ascii(s: string): Uint8Array {
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

// Build raw response bytes: tag + optional space + params
function buildResponse(tag: string, ...parts: Uint8Array[]): Uint8Array {
  if (parts.length === 0) return ascii(tag)
  return concatBytes(ascii(tag + " "), ...parts)
}

function decode(bytes: Uint8Array): SMPResponse {
  return decodeResponse(new Decoder(bytes))
}

// -- OK response (existing)

describe("OK response", () => {
  it("decodes OK tag", () => {
    const result = decode(ascii("OK"))
    expect(result.type).toBe("OK")
  })
})

// -- PONG response

describe("PONG response", () => {
  it("decodes PONG tag with no parameters", () => {
    const result = decode(ascii("PONG"))
    expect(result.type).toBe("PONG")
  })
})

// -- END response

describe("END response", () => {
  it("decodes END tag with no parameters", () => {
    const result = decode(ascii("END"))
    expect(result.type).toBe("END")
  })
})

// -- IDS response

describe("IDS response", () => {
  function buildIDS(recipientId: Uint8Array, senderId: Uint8Array, dhKey: Uint8Array, sndSecure?: string): Uint8Array {
    const parts = [encodeBytes(recipientId), encodeBytes(senderId), encodeBytes(dhKey)]
    if (sndSecure !== undefined) parts.push(ascii(sndSecure))
    return buildResponse("IDS", ...parts)
  }

  it("decodes recipientId, senderId, serverDhKey", () => {
    const recipientId = new Uint8Array(24).fill(0x11)
    const senderId = new Uint8Array(24).fill(0x22)
    const dhKey = new Uint8Array(44).fill(0x33)
    const result = decode(buildIDS(recipientId, senderId, dhKey))

    expect(result.type).toBe("IDS")
    if (result.type !== "IDS") return
    expect(result.recipientId).toEqual(recipientId)
    expect(result.senderId).toEqual(senderId)
    expect(result.serverDhKey).toEqual(dhKey)
  })

  it("decodes sndSecure = T", () => {
    const result = decode(buildIDS(
      new Uint8Array(16).fill(0x01),
      new Uint8Array(16).fill(0x02),
      new Uint8Array(44).fill(0x03),
      "T"
    ))
    if (result.type !== "IDS") throw new Error("expected IDS")
    expect(result.sndSecure).toBe(true)
  })

  it("decodes sndSecure = F", () => {
    const result = decode(buildIDS(
      new Uint8Array(16).fill(0x01),
      new Uint8Array(16).fill(0x02),
      new Uint8Array(44).fill(0x03),
      "F"
    ))
    if (result.type !== "IDS") throw new Error("expected IDS")
    expect(result.sndSecure).toBe(false)
  })

  it("defaults sndSecure to false when missing", () => {
    const result = decode(buildIDS(
      new Uint8Array(16).fill(0x01),
      new Uint8Array(16).fill(0x02),
      new Uint8Array(44).fill(0x03)
    ))
    if (result.type !== "IDS") throw new Error("expected IDS")
    expect(result.sndSecure).toBe(false)
  })
})

// -- MSG response

describe("MSG response", () => {
  it("decodes msgId and encrypted body", () => {
    const msgId = new Uint8Array(24).fill(0xAA)
    const body = new Uint8Array([0x01, 0x02, 0x03, 0xFF])
    const bytes = buildResponse("MSG", encodeBytes(msgId), body)
    const result = decode(bytes)

    expect(result.type).toBe("MSG")
    if (result.type !== "MSG") return
    expect(result.msgId).toEqual(msgId)
    expect(result.encryptedBody).toEqual(body)
  })

  it("handles large encrypted body", () => {
    const msgId = new Uint8Array(24).fill(0xBB)
    const body = new Uint8Array(16064).fill(0xCC)
    const bytes = buildResponse("MSG", encodeBytes(msgId), body)
    const result = decode(bytes)

    if (result.type !== "MSG") throw new Error("expected MSG")
    expect(result.msgId.length).toBe(24)
    expect(result.encryptedBody.length).toBe(16064)
    expect(result.encryptedBody[0]).toBe(0xCC)
    expect(result.encryptedBody[16063]).toBe(0xCC)
  })

  it("preserves binary content in body", () => {
    const msgId = new Uint8Array(24).fill(0x00)
    const body = new Uint8Array(256)
    for (let i = 0; i < 256; i++) body[i] = i
    const bytes = buildResponse("MSG", encodeBytes(msgId), body)
    const result = decode(bytes)

    if (result.type !== "MSG") throw new Error("expected MSG")
    for (let i = 0; i < 256; i++) {
      expect(result.encryptedBody[i]).toBe(i)
    }
  })
})

// -- NID response

describe("NID response", () => {
  it("decodes notifierId and serverNtfDhKey", () => {
    const notifierId = new Uint8Array(20).fill(0xDD)
    const dhKey = new Uint8Array(44).fill(0xEE)
    const bytes = buildResponse("NID", encodeBytes(notifierId), encodeBytes(dhKey))
    const result = decode(bytes)

    expect(result.type).toBe("NID")
    if (result.type !== "NID") return
    expect(result.notifierId).toEqual(notifierId)
    expect(result.serverNtfDhKey).toEqual(dhKey)
  })
})

// -- NMSG response

describe("NMSG response", () => {
  it("decodes nonce (24 bytes fixed) and encrypted metadata", () => {
    const nonce = new Uint8Array(24).fill(0x42)
    const meta = new Uint8Array([0x10, 0x20, 0x30])
    const bytes = buildResponse("NMSG", nonce, meta)
    const result = decode(bytes)

    expect(result.type).toBe("NMSG")
    if (result.type !== "NMSG") return
    expect(result.nmsgNonce).toEqual(nonce)
    expect(result.encryptedMeta).toEqual(meta)
  })

  it("handles empty metadata after nonce", () => {
    const nonce = new Uint8Array(24).fill(0x99)
    const bytes = buildResponse("NMSG", nonce)
    const result = decode(bytes)

    if (result.type !== "NMSG") throw new Error("expected NMSG")
    expect(result.nmsgNonce.length).toBe(24)
    expect(result.encryptedMeta.length).toBe(0)
  })
})

// -- INFO response

describe("INFO response", () => {
  it("decodes JSON string", () => {
    const json = '{"queued":3,"status":"active"}'
    const bytes = buildResponse("INFO", ascii(json))
    const result = decode(bytes)

    expect(result.type).toBe("INFO")
    if (result.type !== "INFO") return
    expect(result.info).toBe(json)
  })
})

// -- LNK response (existing, regression)

describe("LNK response", () => {
  it("decodes senderId, encFixedData, encUserData (regression)", () => {
    const senderId = new Uint8Array(16).fill(0x11)
    const fixedData = new Uint8Array(100).fill(0x22)
    const userData = new Uint8Array(200).fill(0x33)

    // LNK uses Large encoding (2-byte length prefix) for data fields
    const bytes = buildResponse("LNK", encodeBytes(senderId), encodeLarge(fixedData), encodeLarge(userData))
    const result = decode(bytes)

    expect(result.type).toBe("LNK")
    if (result.type !== "LNK") return
    expect(result.response.senderId).toEqual(senderId)
    expect(result.response.encFixedData).toEqual(fixedData)
    expect(result.response.encUserData).toEqual(userData)
  })
})

// -- ERR responses

describe("ERR responses", () => {
  function decodeErr(errStr: string): SMPError {
    const bytes = buildResponse("ERR", ascii(errStr))
    const result = decode(bytes)
    if (result.type !== "ERR") throw new Error("expected ERR, got " + result.type)
    return result.error
  }

  // Simple error types
  it("decodes ERR AUTH", () => {
    const err = decodeErr("AUTH")
    expect(err.type).toBe("AUTH")
  })

  it("decodes ERR QUOTA", () => {
    const err = decodeErr("QUOTA")
    expect(err.type).toBe("QUOTA")
  })

  it("decodes ERR LARGE_MSG", () => {
    const err = decodeErr("LARGE_MSG")
    expect(err.type).toBe("LARGE_MSG")
  })

  it("decodes ERR INTERNAL", () => {
    const err = decodeErr("INTERNAL")
    expect(err.type).toBe("INTERNAL")
  })

  it("decodes ERR BLOCK", () => {
    const err = decodeErr("BLOCK")
    expect(err.type).toBe("BLOCK")
  })

  it("decodes ERR SESSION", () => {
    const err = decodeErr("SESSION")
    expect(err.type).toBe("SESSION")
  })

  // CMD errors
  it("decodes ERR CMD SYNTAX", () => {
    const err = decodeErr("CMD SYNTAX")
    expect(err.type).toBe("CMD")
    if (err.type !== "CMD") return
    expect(err.cmdError).toBe("SYNTAX")
  })

  it("decodes ERR CMD PROHIBITED", () => {
    const err = decodeErr("CMD PROHIBITED")
    expect(err.type).toBe("CMD")
    if (err.type !== "CMD") return
    expect(err.cmdError).toBe("PROHIBITED")
  })

  it("decodes ERR CMD NO_AUTH", () => {
    const err = decodeErr("CMD NO_AUTH")
    expect(err.type).toBe("CMD")
    if (err.type !== "CMD") return
    expect(err.cmdError).toBe("NO_AUTH")
  })

  it("decodes ERR CMD HAS_AUTH", () => {
    const err = decodeErr("CMD HAS_AUTH")
    expect(err.type).toBe("CMD")
    if (err.type !== "CMD") return
    expect(err.cmdError).toBe("HAS_AUTH")
  })

  it("decodes ERR CMD NO_ENTITY", () => {
    const err = decodeErr("CMD NO_ENTITY")
    expect(err.type).toBe("CMD")
    if (err.type !== "CMD") return
    expect(err.cmdError).toBe("NO_ENTITY")
  })

  // PROXY errors
  it("decodes ERR PROXY BASIC_AUTH", () => {
    const err = decodeErr("PROXY BASIC_AUTH")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BASIC_AUTH")
  })

  it("decodes ERR PROXY NO_SESSION", () => {
    const err = decodeErr("PROXY NO_SESSION")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("NO_SESSION")
  })

  // PROXY BROKER errors
  it("decodes ERR PROXY BROKER NETWORK", () => {
    const err = decodeErr("PROXY BROKER NETWORK")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BROKER")
    if (err.proxyError.type !== "BROKER") return
    expect(err.proxyError.brokerError.type).toBe("NETWORK")
  })

  it("decodes ERR PROXY BROKER TIMEOUT", () => {
    const err = decodeErr("PROXY BROKER TIMEOUT")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BROKER")
    if (err.proxyError.type !== "BROKER") return
    expect(err.proxyError.brokerError.type).toBe("TIMEOUT")
  })

  it("decodes ERR PROXY BROKER HOST", () => {
    const err = decodeErr("PROXY BROKER HOST")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BROKER")
    if (err.proxyError.type !== "BROKER") return
    expect(err.proxyError.brokerError.type).toBe("HOST")
  })

  // PROXY BROKER TRANSPORT errors
  it("decodes ERR PROXY BROKER TRANSPORT VERSION", () => {
    const err = decodeErr("PROXY BROKER TRANSPORT VERSION")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BROKER")
    if (err.proxyError.type !== "BROKER") return
    expect(err.proxyError.brokerError.type).toBe("TRANSPORT")
    if (err.proxyError.brokerError.type !== "TRANSPORT") return
    expect(err.proxyError.brokerError.transportError).toBe("VERSION")
  })

  // PROXY BROKER TRANSPORT HANDSHAKE errors
  it("decodes ERR PROXY BROKER TRANSPORT HANDSHAKE IDENTITY", () => {
    const err = decodeErr("PROXY BROKER TRANSPORT HANDSHAKE IDENTITY")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BROKER")
    if (err.proxyError.type !== "BROKER") return
    expect(err.proxyError.brokerError.type).toBe("TRANSPORT")
    if (err.proxyError.brokerError.type !== "TRANSPORT") return
    const te = err.proxyError.brokerError.transportError
    expect(typeof te).toBe("object")
    if (typeof te === "string") return
    expect(te.type).toBe("HANDSHAKE")
    expect(te.handshakeError).toBe("IDENTITY")
  })

  it("decodes ERR PROXY BROKER TRANSPORT HANDSHAKE BAD_AUTH", () => {
    const err = decodeErr("PROXY BROKER TRANSPORT HANDSHAKE BAD_AUTH")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("BROKER")
    if (err.proxyError.type !== "BROKER") return
    expect(err.proxyError.brokerError.type).toBe("TRANSPORT")
    if (err.proxyError.brokerError.type !== "TRANSPORT") return
    const te = err.proxyError.brokerError.transportError
    if (typeof te === "string") throw new Error("expected HANDSHAKE object")
    expect(te.handshakeError).toBe("BAD_AUTH")
  })

  // PROXY PROTOCOL (recursive SMPError)
  it("decodes ERR PROXY PROTOCOL AUTH", () => {
    const err = decodeErr("PROXY PROTOCOL AUTH")
    expect(err.type).toBe("PROXY")
    if (err.type !== "PROXY") return
    expect(err.proxyError.type).toBe("PROTOCOL")
    if (err.proxyError.type !== "PROTOCOL") return
    expect(err.proxyError.error.type).toBe("AUTH")
  })
})

// -- Unknown tag

describe("unknown response tag", () => {
  it("throws error for unknown tag", () => {
    expect(() => decode(ascii("XYZZY"))).toThrow("unknown SMP response: XYZZY")
  })
})
