// SMP command encoders for all queue operations (Season 3).
//
// Each encoder returns raw command bytes (tag + parameters).
// The caller wraps them via encodeTransmission() and buildCommandBlock().
//
// Wire format follows the SMP v9 ABNF specification in protocol/simplex-messaging.md.
// Keys use shortString encoding (1-byte length prefix) via encodeBytes.

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
  recipientAuthKey: Uint8Array   // Ed25519 SPKI DER (44 bytes)
  recipientDhKey: Uint8Array     // X25519 SPKI DER (44 bytes)
  subscribeMode: "S" | "C"      // S = subscribe on create, C = create only
  sndSecure?: boolean            // T = sender can secure queue (v9+ ONLY, omit for v6)
  basicAuth?: Uint8Array         // optional server password
  smpVersion?: number            // negotiated version (controls which fields are sent)
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

// NEW <SP> encodeBytes(authKey) encodeBytes(dhKey) basicAuth subscribeMode [sndSecure]
// basicAuth = "0" / "1" encodeBytes(password)
// sndSecure is v9+ ONLY - omit for v6 servers (causes ERR CMD SYNTAX if present)
export function encodeNEW(params: NewQueueParams): Uint8Array {
  const tag = ascii("NEW ")
  const authKey = encodeBytes(params.recipientAuthKey)
  const dhKey = encodeBytes(params.recipientDhKey)

  let basicAuth: Uint8Array
  if (params.basicAuth !== undefined) {
    basicAuth = concatBytes(new Uint8Array([0x31]), encodeBytes(params.basicAuth))
  } else {
    basicAuth = new Uint8Array([0x30]) // "0" = no auth
  }

  const subscribeMode = ascii(params.subscribeMode)

  // sndSecure is a v9+ field. For v6 servers, omit it entirely.
  const version = params.smpVersion ?? 7
  if (version >= 9) {
    const sndSecure = ascii(params.sndSecure ? "T" : "F")
    return concatBytes(tag, authKey, dhKey, basicAuth, subscribeMode, sndSecure)
  }

  // v6-v8: no sndSecure field
  return concatBytes(tag, authKey, dhKey, basicAuth, subscribeMode)
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
  return concatBytes(
    ascii("SEND "),
    new Uint8Array([flag, 0x20]), // flag + space
    params.encMessage
  )
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
