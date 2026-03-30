// SMP protocol commands and transmission format.
// Mirrors: Simplex.Messaging.Protocol

import {
  Decoder, concatBytes,
  encodeBytes, decodeBytes,
  decodeLarge
} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"
import {ed25519} from "@noble/curves/ed25519"
import nacl from "tweetnacl"
import {sha512} from "@noble/hashes/sha512"

// readTag/readSpace inlined from xftp-web/protocol/commands.ts to avoid
// pulling libsodium through the commands.ts -> keys.ts import chain.

function readTag(d: Decoder): string {
  const start = d.offset()
  while (d.remaining() > 0) {
    if (d.buf[d.offset()] === 0x20 || d.buf[d.offset()] === 0x0a) break
    d.anyByte()
  }
  let s = ""
  for (let i = start; i < d.offset(); i++) s += String.fromCharCode(d.buf[i])
  return s
}

function readSpace(d: Decoder): void {
  if (d.anyByte() !== 0x20) throw new Error("expected space")
}

// -- Transmission encoding
//
// SMP v6: [sigLen][signature?][sessId shortString][corrId][entityId][cmd]
//   Ed25519 signature. SessionId on wire. Signed data includes sessionId with length prefix.
//
// SMP v7+/v9: [authLen][authenticator?][corrId][entityId][cmd]
//   CbAuthenticator (80 bytes). SessionId NOT on wire but IN authenticated data.
//   CorrId = nonce (24 bytes). Auth = nacl.secretbox(sha512(tForAuth), nonce, rawDhSecret).

export type TransmissionAuth =
  | {type: "ed25519"; signKey: Uint8Array}
  | {type: "cb"; serverPubKeyRaw: Uint8Array; queuePrivKeyRaw: Uint8Array}
  | {type: "none"}

export function encodeTransmission(
  corrId: Uint8Array,
  entityId: Uint8Array,
  command: Uint8Array,
  sessionId?: Uint8Array,
  auth?: TransmissionAuth,
  implySessId: boolean = true
): Uint8Array {
  const tToSend = concatBytes(
    encodeBytes(corrId),
    encodeBytes(entityId),
    command
  )

  // tForAuth always includes sessionId (with length prefix) even when not on wire
  const tForAuth = sessionId
    ? concatBytes(encodeBytes(sessionId), tToSend)
    : tToSend

  const parts: Uint8Array[] = []

  if (auth && auth.type === "ed25519") {
    // v6: Ed25519 signature (64 bytes)
    const signature = ed25519.sign(tForAuth, auth.signKey)
    parts.push(new Uint8Array([0x40])) // sigLen = 64
    parts.push(signature)
  } else if (auth && auth.type === "cb") {
    // v7+/v9: CbAuthenticator (80 bytes)
    console.log("[SMP-AUTH] === CbAuthenticator Debug ===")
    console.log("[SMP-AUTH] serverPubKeyRaw (" + auth.serverPubKeyRaw.length + "B):", Array.from(auth.serverPubKeyRaw).map(b => b.toString(16).padStart(2, "0")).join(""))
    console.log("[SMP-AUTH] queuePrivKeyRaw (" + auth.queuePrivKeyRaw.length + "B):", Array.from(auth.queuePrivKeyRaw).map(b => b.toString(16).padStart(2, "0")).join(""))
    console.log("[SMP-AUTH] tForAuth (" + tForAuth.length + "B) first 80:", Array.from(tForAuth.subarray(0, 80)).map(b => b.toString(16).padStart(2, "0")).join(""))
    console.log("[SMP-AUTH] tForAuth last 20:", Array.from(tForAuth.subarray(tForAuth.length - 20)).map(b => b.toString(16).padStart(2, "0")).join(""))
    const hash = sha512(tForAuth)
    console.log("[SMP-AUTH] sha512(tForAuth) (" + hash.length + "B):", Array.from(hash).map(b => b.toString(16).padStart(2, "0")).join(""))
    console.log("[SMP-AUTH] nonce/corrId (" + corrId.length + "B):", Array.from(corrId).map(b => b.toString(16).padStart(2, "0")).join(""))
    // nacl.box does DH + HSalsa20 + XSalsa20-Poly1305 internally
    const authenticator = nacl.box(hash, corrId, auth.serverPubKeyRaw, auth.queuePrivKeyRaw) // 80 bytes
    console.log("[SMP-AUTH] authenticator (" + authenticator.length + "B):", Array.from(authenticator).map(b => b.toString(16).padStart(2, "0")).join(""))
    console.log("[SMP-AUTH] === End Debug ===")
    parts.push(new Uint8Array([0x50])) // authLen = 80
    parts.push(authenticator)
  } else {
    // Unsigned: [0x00]
    parts.push(new Uint8Array([0x00]))
  }

  // v6 (implySessId=false): sessionId goes on wire AFTER auth, BEFORE corrId
  // v7+ (implySessId=true): sessionId NOT on wire
  if (sessionId && !implySessId) {
    parts.push(encodeBytes(sessionId))
  }

  parts.push(tToSend)
  return concatBytes(...parts)
}

// -- Transmission parsing (Protocol.hs:1629-1642)
//
// SMP v6: [sigLen][sig?][sessId shortString][corrId][entityId][cmd]
// SMP v7: [sigLen][sig?][corrId][entityId][cmd]

export interface RawTransmission {
  corrId: Uint8Array
  entityId: Uint8Array
  command: Uint8Array
}

export function decodeTransmission(d: Decoder, hasSessionId?: boolean): RawTransmission {
  const _auth = decodeBytes(d) // sigLen + signature (empty for unsigned)
  // For SMP v6: read and discard sessionId AFTER auth, BEFORE corrId
  if (hasSessionId) {
    decodeBytes(d) // sessionId
  }
  const corrId = decodeBytes(d)
  const entityId = decodeBytes(d)
  const command = d.takeAll()
  return {corrId, entityId, command}
}

// -- SMP command tags

const SPACE = 0x20

function ascii(s: string): Uint8Array {
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

// -- LGET command (Protocol.hs:1709)
// No parameters. EntityId carries LinkId in transmission.

export function encodeLGET(): Uint8Array {
  return ascii("LGET")
}

// -- LNK response (Protocol.hs:1834)
// LNK sId d -> e (LNK_, ' ', sId, d)
// where d = (EncFixedDataBytes, EncUserDataBytes), both Large-encoded

export interface LNKResponse {
  senderId: Uint8Array
  encFixedData: Uint8Array
  encUserData: Uint8Array
}

export function decodeLNK(d: Decoder): LNKResponse {
  const senderId = decodeBytes(d)
  const encFixedData = decodeLarge(d)
  const encUserData = decodeLarge(d)
  return {senderId, encFixedData, encUserData}
}

// -- Error types (mirrors SMP v9 ABNF error tree)

export type HandshakeError = "PARSE" | "IDENTITY" | "BAD_AUTH"

export type TransportError =
  | "BLOCK"
  | "VERSION"
  | "LARGE_MSG"
  | "SESSION"
  | "NO_AUTH"
  | {type: "HANDSHAKE"; handshakeError: HandshakeError}

export type BrokerError =
  | {type: "RESPONSE"; info: string}
  | {type: "UNEXPECTED"; info: string}
  | {type: "NETWORK"}
  | {type: "TIMEOUT"}
  | {type: "HOST"}
  | {type: "TRANSPORT"; transportError: TransportError}

export type ProxyError =
  | {type: "PROTOCOL"; error: SMPError}
  | {type: "BASIC_AUTH"}
  | {type: "NO_SESSION"}
  | {type: "BROKER"; brokerError: BrokerError}

export type CMDError =
  | "SYNTAX"
  | "PROHIBITED"
  | "NO_AUTH"
  | "HAS_AUTH"
  | "NO_ENTITY"
  | "UNKNOWN"

export type SMPError =
  | {type: "BLOCK"}
  | {type: "SESSION"}
  | {type: "AUTH"}
  | {type: "QUOTA"}
  | {type: "LARGE_MSG"}
  | {type: "INTERNAL"}
  | {type: "CMD"; cmdError: CMDError}
  | {type: "PROXY"; proxyError: ProxyError}

// -- Error decoders

function decodeCMDError(d: Decoder): CMDError {
  const tag = readTag(d)
  switch (tag) {
    case "SYNTAX": return "SYNTAX"
    case "PROHIBITED": return "PROHIBITED"
    case "NO_AUTH": return "NO_AUTH"
    case "HAS_AUTH": return "HAS_AUTH"
    case "NO_ENTITY": return "NO_ENTITY"
    default: return "UNKNOWN"
  }
}

function decodeTransportError(d: Decoder): TransportError {
  const tag = readTag(d)
  switch (tag) {
    case "BLOCK": return "BLOCK"
    case "VERSION": return "VERSION"
    case "LARGE_MSG": return "LARGE_MSG"
    case "SESSION": return "SESSION"
    case "NO_AUTH": return "NO_AUTH"
    case "HANDSHAKE": {
      readSpace(d)
      const hsTag = readTag(d)
      let handshakeError: HandshakeError
      switch (hsTag) {
        case "PARSE": handshakeError = "PARSE"; break
        case "IDENTITY": handshakeError = "IDENTITY"; break
        case "BAD_AUTH": handshakeError = "BAD_AUTH"; break
        default: handshakeError = "PARSE"; break
      }
      return {type: "HANDSHAKE", handshakeError}
    }
    default: return "BLOCK"
  }
}

function decodeBrokerError(d: Decoder): BrokerError {
  const tag = readTag(d)
  switch (tag) {
    case "RESPONSE": {
      readSpace(d)
      const info = decodeBytes(d)
      let s = ""
      for (const b of info) s += String.fromCharCode(b)
      return {type: "RESPONSE", info: s}
    }
    case "UNEXPECTED": {
      readSpace(d)
      const info = decodeBytes(d)
      let s = ""
      for (const b of info) s += String.fromCharCode(b)
      return {type: "UNEXPECTED", info: s}
    }
    case "NETWORK": return {type: "NETWORK"}
    case "TIMEOUT": return {type: "TIMEOUT"}
    case "HOST": return {type: "HOST"}
    case "TRANSPORT": {
      readSpace(d)
      return {type: "TRANSPORT", transportError: decodeTransportError(d)}
    }
    default: return {type: "NETWORK"}
  }
}

function decodeProxyError(d: Decoder): ProxyError {
  const tag = readTag(d)
  switch (tag) {
    case "PROTOCOL": {
      readSpace(d)
      return {type: "PROTOCOL", error: decodeError(d)}
    }
    case "BASIC_AUTH": return {type: "BASIC_AUTH"}
    case "NO_SESSION": return {type: "NO_SESSION"}
    case "BROKER": {
      readSpace(d)
      return {type: "BROKER", brokerError: decodeBrokerError(d)}
    }
    default: return {type: "NO_SESSION"}
  }
}

export function decodeError(d: Decoder): SMPError {
  const tag = readTag(d)
  switch (tag) {
    case "BLOCK": return {type: "BLOCK"}
    case "SESSION": return {type: "SESSION"}
    case "AUTH": return {type: "AUTH"}
    case "QUOTA": return {type: "QUOTA"}
    case "LARGE_MSG": return {type: "LARGE_MSG"}
    case "INTERNAL": return {type: "INTERNAL"}
    case "CMD": {
      readSpace(d)
      return {type: "CMD", cmdError: decodeCMDError(d)}
    }
    case "PROXY": {
      readSpace(d)
      return {type: "PROXY", proxyError: decodeProxyError(d)}
    }
    default: return {type: "INTERNAL"}
  }
}

// -- Response dispatch (same pattern as xftp-web decodeResponse)

export type SMPResponse =
  | {type: "LNK"; response: LNKResponse}
  | {type: "OK"}
  | {type: "IDS"; recipientId: Uint8Array; senderId: Uint8Array; serverDhKey: Uint8Array; sndSecure: boolean}
  | {type: "MSG"; msgId: Uint8Array; encryptedBody: Uint8Array}
  | {type: "NID"; notifierId: Uint8Array; serverNtfDhKey: Uint8Array}
  | {type: "NMSG"; nmsgNonce: Uint8Array; encryptedMeta: Uint8Array}
  | {type: "INFO"; info: string}
  | {type: "PONG"}
  | {type: "END"}
  | {type: "ERR"; error: SMPError}

export function decodeResponse(d: Decoder): SMPResponse {
  const tag = readTag(d)
  switch (tag) {
    case "LNK": {
      readSpace(d)
      return {type: "LNK", response: decodeLNK(d)}
    }
    case "OK":
      return {type: "OK"}
    case "IDS": {
      readSpace(d)
      const recipientId = decodeBytes(d)
      const senderId = decodeBytes(d)
      const serverDhKey = decodeBytes(d)
      // sndSecure is optional (v9+), default false
      let sndSecure = false
      if (d.remaining() > 0) {
        const flag = d.anyByte()
        sndSecure = flag === 0x54 // "T"
      }
      return {type: "IDS", recipientId, senderId, serverDhKey, sndSecure}
    }
    case "MSG": {
      readSpace(d)
      const msgId = decodeBytes(d)
      const encryptedBody = d.takeAll()
      return {type: "MSG", msgId, encryptedBody}
    }
    case "NID": {
      readSpace(d)
      const notifierId = decodeBytes(d)
      const serverNtfDhKey = decodeBytes(d)
      return {type: "NID", notifierId, serverNtfDhKey}
    }
    case "NMSG": {
      readSpace(d)
      const nmsgNonce = d.take(24)
      const encryptedMeta = d.takeAll()
      return {type: "NMSG", nmsgNonce, encryptedMeta}
    }
    case "INFO": {
      readSpace(d)
      const bytes = d.takeAll()
      let info = ""
      for (const b of bytes) info += String.fromCharCode(b)
      return {type: "INFO", info}
    }
    case "PONG":
      return {type: "PONG"}
    case "END":
      return {type: "END"}
    case "ERR": {
      readSpace(d)
      return {type: "ERR", error: decodeError(d)}
    }
    default:
      throw new Error("unknown SMP response: " + tag)
  }
}
