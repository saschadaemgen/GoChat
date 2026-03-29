// SMP command encoders for all queue operations (Season 3).
//
// Each encoder returns raw command bytes (tag + parameters).
// The caller wraps them via encodeTransmission() and buildCommandBlock().
//
// Wire format: keys use 1-byte shortString length prefix (encodeBytes).
// Confirmed by SimpleGo protocol team byte-for-byte wire capture:
//   NEW [0x2C][44B authKey][0x2C][44B dhKey]0ST
// Fields after keys are single ASCII chars with NO length prefix.

import {
  concatBytes,
  encodeBytes,
} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"

// -- ASCII helper (local copy to avoid pulling libsodium via xftp-web commands.ts)

function ascii(s: string): Uint8Array {
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

// -- Command parameter types

export interface NewQueueParams {
  recipientAuthKey: Uint8Array   // Ed25519 SPKI DER (44 bytes) - public key in command body
  recipientAuthPrivateKey?: Uint8Array // Ed25519 private key (32 bytes) - for signing the transmission
  recipientDhKey: Uint8Array     // X25519 SPKI DER (44 bytes)
  subscribeMode: "S" | "C"      // S = subscribe on create, C = create only
  sndSecure?: boolean            // T = sender can secure queue, default false
  basicAuth?: Uint8Array         // optional server password
  smpVersion?: number            // negotiated version (for future use)
}

export interface SendParams {
  notification: boolean          // push notification flag
  encMessage: Uint8Array         // smpEncMessage (up to 16064 bytes)
}

export interface EnableNotificationsParams {
  notifierKey: Uint8Array        // Ed25519/X25519 SPKI DER
  recipientNtfDhKey: Uint8Array  // X25519 SPKI DER
}

// -- Command encoders

// v9 NEW format: "NEW " [authKey SPKI][dhKey SPKI] "0ST"
// authKey: X25519 SPKI for v7+ (was Ed25519 for v6). OID 2b 65 6e.
// dhKey: X25519 SPKI (unchanged).
// Tail "0ST": Maybe BasicAuth Nothing ('0'=0x30) + Subscribe ('S'=0x53) + sndSecure True ('T'=0x54)
// SMP Maybe encoding: '0' (ASCII 0x30) = Nothing, '1' (ASCII 0x31) = Just.
// Total: 4 + 45 + 45 + 3 = 97 bytes.
export function encodeNEW(params: NewQueueParams): Uint8Array {
  return concatBytes(
    ascii("NEW "),
    encodeBytes(params.recipientAuthKey),  // [0x2C][44B X25519 SPKI for v9]
    encodeBytes(params.recipientDhKey),     // [0x2C][44B X25519 SPKI]
    ascii("0" + params.subscribeMode + "T") // "0ST" = Nothing + Subscribe + sndSecure
  )
}

// SUB (no parameters)
export function encodeSUB(): Uint8Array {
  return ascii("SUB")
}

// KEY <SP> encodeBytes(senderAuthKey)
export function encodeKEY(senderAuthKey: Uint8Array): Uint8Array {
  return concatBytes(ascii("KEY "), encodeBytes(senderAuthKey))
}

// SKEY <SP> encodeBytes(senderAuthKey)
export function encodeSKEY(senderAuthKey: Uint8Array): Uint8Array {
  return concatBytes(ascii("SKEY "), encodeBytes(senderAuthKey))
}

// SEND <SP> msgFlags <SP> smpEncMessage
// msgFlags = notificationFlag (T/F)
export function encodeSEND(params: SendParams): Uint8Array {
  const flag = params.notification ? 0x54 : 0x46 // T or F
  console.log("[SMP] encodeSEND: flag=" + String.fromCharCode(flag) + ", encMessage=" + params.encMessage.length + "B")
  const result = concatBytes(
    ascii("SEND "),
    new Uint8Array([flag, 0x20]), // flag + space
    params.encMessage
  )
  console.log("[SMP] encodeSEND: total command=" + result.length + "B (expected: " + (7 + params.encMessage.length) + "B)")
  return result
}

// ACK <SP> encodeBytes(msgId)
// msgId = 24 bytes, encoded as shortString
export function encodeACK(msgId: Uint8Array): Uint8Array {
  return concatBytes(ascii("ACK "), encodeBytes(msgId))
}

// DEL (no parameters)
export function encodeDEL(): Uint8Array {
  return ascii("DEL")
}

// OFF (no parameters)
export function encodeOFF(): Uint8Array {
  return ascii("OFF")
}

// GET (no parameters)
export function encodeGET(): Uint8Array {
  return ascii("GET")
}

// NKEY <SP> encodeBytes(notifierKey) encodeBytes(recipientNtfDhKey)
export function encodeNKEY(params: EnableNotificationsParams): Uint8Array {
  return concatBytes(
    ascii("NKEY "),
    encodeBytes(params.notifierKey),
    encodeBytes(params.recipientNtfDhKey)
  )
}

// NDEL (no parameters)
export function encodeNDEL(): Uint8Array {
  return ascii("NDEL")
}

// NSUB (no parameters)
export function encodeNSUB(): Uint8Array {
  return ascii("NSUB")
}

// PING (no parameters)
export function encodePING(): Uint8Array {
  return ascii("PING")
}

// QUE (no parameters)
export function encodeQUE(): Uint8Array {
  return ascii("QUE")
}
