// Invitation builder for initial contact request (Step 2).
//
// The joining party sends an AgentInvitation (tag 'I'), NOT AgentConfirmation.
// From Haskell Agent/Client.hs:1654-1664:
//   let agentEnvelope = AgentInvitation {agentVersion, connReq, connInfo}
//
// Wire format (ClientMessage after PHEmpty '_'):
//   [2B]  agentVersion = 0x00 0x07
//   [1B]  'I' (0x49) = AgentInvitation tag
//   [2B]  connReq length (uint16 BE, Large encoding)
//   [NB]  connReq URI string (UTF-8)
//   [..]  connInfo JSON (Tail - no length prefix)
//
// The connReq is OUR OWN invitation URI so the contact address owner
// can connect back to us. Format:
//   simplex:/invitation#/?v=1-4&smp=<queue_uri>&e2e=<e2e_params>
//
// The FIRST message does NOT use Double Ratchet.
// The only encryption is the outer NaCl crypto_box (X25519 DH).
// Ratchet starts at Message 2 (peer -> us) after peer does X3DH.

import nacl from "tweetnacl"
import {
  generateX448KeyPair,
  generateX25519KeyPair,
  encodeX25519PublicKey,
  encodeX448PublicKey,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import type {ManagedConnection} from "./connection.js"

// -- Constants

const E2E_ENC_CONFIRMATION_LENGTH = 15904

function hex(bytes: Uint8Array, n: number = 32): string {
  return Array.from(bytes.slice(0, n)).map(b => b.toString(16).padStart(2, "0")).join(" ")
}

// -- Base64url encode (no padding)

function b64urlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// -- Padding (2B length prefix + data + '#' fill)

function padPlaintext(plaintext: Uint8Array, targetSize: number): Uint8Array {
  if (2 + plaintext.length > targetSize) {
    throw new Error("padPlaintext: too large: " + (2 + plaintext.length) + " > " + targetSize)
  }
  const padded = new Uint8Array(targetSize)
  padded[0] = (plaintext.length >>> 8) & 0xFF
  padded[1] = plaintext.length & 0xFF
  padded.set(plaintext, 2)
  for (let i = 2 + plaintext.length; i < targetSize; i++) padded[i] = 0x23
  return padded
}

// -- connInfo JSON

export function buildInvitationConnInfo(displayName: string): Uint8Array {
  // Minimal JSON matching SimpleGo reference format (no preferences block)
  return new TextEncoder().encode(JSON.stringify({
    v: "1-16", event: "x.info",
    params: {profile: {displayName, fullName: ""}}
  }))
}

// -- connReq URI builder

function buildConnReqURI(
  serverIdentity: string,
  host: string,
  port: number,
  senderId: Uint8Array,
  queueDhSPKI: Uint8Array,
  e2ePubKey1SPKI: Uint8Array,
  e2ePubKey2SPKI: Uint8Array,
): string {
  // smp queue URI: smp://FINGERPRINT@HOST:PORT/QUEUE_ID#/?v=1-4&dh=X25519_SPKI&q=m
  // dh= is the X25519 DH public key for per-queue E2E encryption
  // q=m = QMMessaging (messaging queue, not contact queue)
  const senderIdB64 = b64urlEncode(senderId)
  const dhB64 = b64urlEncode(queueDhSPKI)
  const smpUri = "smp://" + serverIdentity + "@" + host + ":" + port + "/" + senderIdB64 + "#/?v=1-4&dh=" + dhB64 + "&q=m"

  // e2e params: v=2-3&x3dh=KEY1_BASE64,KEY2_BASE64
  // Two X448 SPKI keys (68B each) for X3DH ratchet initialization
  const key1B64 = b64urlEncode(e2ePubKey1SPKI)
  const key2B64 = b64urlEncode(e2ePubKey2SPKI)
  const e2eParams = "v=2-3&x3dh=" + key1B64 + "," + key2B64

  // Full URI with URL-encoded components in fragment
  // Outer v=2-7 (agent version range)
  return "simplex:/invitation#/?v=2-7&smp=" + encodeURIComponent(smpUri) + "&e2e=" + encodeURIComponent(e2eParams)
}

// -- AgentInvitation encoding

function buildAgentInvitation(
  connReqURI: string,
  connInfo: Uint8Array,
): Uint8Array {
  const connReqBytes = new TextEncoder().encode(connReqURI)

  // agentVersion(2) + 'I'(1) + Large connReq(2 + N) + Tail connInfo
  const total = 2 + 1 + 2 + connReqBytes.length + connInfo.length
  const buf = new Uint8Array(total)
  let o = 0

  // agentVersion = 7 (uint16 BE)
  buf[o++] = 0x00
  buf[o++] = 0x07

  // 'I' = AgentInvitation tag
  buf[o++] = 0x49

  // Large encoding: 2-byte length prefix (uint16 BE)
  buf[o++] = (connReqBytes.length >>> 8) & 0xFF
  buf[o++] = connReqBytes.length & 0xFF

  // connReq URI bytes
  buf.set(connReqBytes, o)
  o += connReqBytes.length

  // connInfo as Tail (no length prefix)
  buf.set(connInfo, o)

  return buf
}

// -- ClientMessage with PHEmpty ('_')

function buildClientMessage(agentInvitation: Uint8Array): Uint8Array {
  // PHEmpty = '_' (0x5F), 1 byte only (no auth key)
  const r = new Uint8Array(1 + agentInvitation.length)
  r[0] = 0x5F // '_' = PHEmpty
  r.set(agentInvitation, 1)
  return r
}

// -- ClientMsgEnvelope (phVersion + DH SPKI + nonce + cmEncBody)

function buildClientMsgEnvelope(
  dhPublicSPKI: Uint8Array, nonce: Uint8Array, cmEncBody: Uint8Array
): Uint8Array {
  const r = new Uint8Array(2 + 1 + 1 + 44 + 24 + cmEncBody.length)
  let o = 0
  r[o++] = 0x00; r[o++] = 0x04 // phVersion = 4
  r[o++] = 0x31 // '1' = Just (has DH key)
  r[o++] = 44 // SPKI length
  r.set(dhPublicSPKI, o); o += 44
  r.set(nonce, o); o += 24
  r.set(cmEncBody, o)
  return r
}

// -- Full invitation builder

export interface InvitationResult {
  smpEncConfirmation: Uint8Array
  ratchetKeyPair: KeyPair
  ephemeralKeyPair: KeyPair
}

export async function buildInvitation(
  conn: ManagedConnection, displayName: string, _smpVersion: number
): Promise<InvitationResult> {
  if (!conn.contactQueue) throw new Error("Cannot build invitation: contactQueue is null")
  if (!conn.receiveQueue) throw new Error("Cannot build invitation: receiveQueue is null (IDS not received)")

  // Peer's X25519 DH key (from contact address URI dh= parameter)
  const aliceDhBase64 = conn.contactQueue.dhPublicKey
  const aliceDhDecoded = b64decode(aliceDhBase64)
  const aliceDhRaw = aliceDhDecoded.length === 44 ? aliceDhDecoded.subarray(12) : aliceDhDecoded
  console.log("[SMP] DIAG NaCl dh= base64url:", aliceDhBase64)
  console.log("[SMP] DIAG NaCl peer_dh RAW (" + aliceDhRaw.length + "B):", hex(aliceDhRaw, 32))

  // Generate X448 keypairs for X3DH ratchet initialization.
  // These go into the connReq URI e2e params so the peer can do X3DH.
  const ratchetKeyPair = generateX448KeyPair()   // e2ePubKey1
  const ephemeralKeyPair = generateX448KeyPair()  // e2ePubKey2

  // === connInfo: profile JSON ===
  const connInfo = buildInvitationConnInfo(displayName)

  // === connReq: our invitation URI with X448 keys ===
  // Generate queue DH key (X25519) - same key goes into envelope PubHeader
  // and into the smp:// URI dh= parameter so peer can encrypt to our queue
  const queueDhKeyPair = generateX25519KeyPair()
  const queueDhSPKI = encodeX25519PublicKey(queueDhKeyPair.publicKey) // 44B

  const ratchetSPKI = encodeX448PublicKey(ratchetKeyPair.publicKey)    // 68B
  const ephemeralSPKI = encodeX448PublicKey(ephemeralKeyPair.publicKey) // 68B

  const connReqURI = buildConnReqURI(
    conn.contactQueue.server.serverIdentity,
    conn.contactQueue.server.hosts[0],
    5223,
    conn.receiveQueue.senderId,
    queueDhSPKI,
    ratchetSPKI,
    ephemeralSPKI,
  )
  console.log("[SMP] DIAG connReq URI:", connReqURI)
  console.log("[SMP] DIAG connReq URI length:", connReqURI.length)

  // === AgentInvitation ===
  const agentInv = buildAgentInvitation(connReqURI, connInfo)
  console.log("[SMP] DIAG agentInvitation:", agentInv.length + "B")
  console.log("[SMP] DIAG agentInvitation[0-2]:", hex(agentInv.subarray(0, 3), 3), "(expected: 00 07 49)")

  // === ClientMessage with PHEmpty ===
  const clientMsg = buildClientMessage(agentInv)
  console.log("[SMP] DIAG clientMessage:", clientMsg.length + "B")
  console.log("[SMP] DIAG clientMessage[0]:", "0x" + clientMsg[0].toString(16), "(expected: 0x5f = '_' PHEmpty)")
  console.log("[SMP] DIAG clientMessage[1-3]:", hex(clientMsg.subarray(1, 4), 3), "(expected: 00 07 49)")

  // === Layer B: NaCl crypto_box (the ONLY encryption) ===
  const phKeyPair = nacl.box.keyPair()
  console.log("[SMP] DIAG NaCl our_dh_pub  RAW (" + phKeyPair.publicKey.length + "B):", hex(phKeyPair.publicKey, 32))

  const paddedClientMsg = padPlaintext(clientMsg, E2E_ENC_CONFIRMATION_LENGTH)
  console.log("[SMP] DIAG NaCl plaintext padded:", paddedClientMsg.length + "B")
  console.log("[SMP] DIAG NaCl plaintext[0-1] (length BE):", hex(paddedClientMsg.subarray(0, 2), 2), "= " + ((paddedClientMsg[0] << 8) | paddedClientMsg[1]) + " bytes")

  const nonce = nacl.randomBytes(24)
  console.log("[SMP] DIAG NaCl cmNonce (" + nonce.length + "B):", hex(nonce, 24))

  console.log("[SMP] DIAG NaCl function: nacl.box (tweetnacl - DH + HSalsa20 + XSalsa20-Poly1305)")
  const cmEncBody = nacl.box(paddedClientMsg, nonce, aliceDhRaw, phKeyPair.secretKey)
  console.log("[SMP] DIAG NaCl cmEncBody:", cmEncBody.length + "B (expected 15920)")

  // === ClientMsgEnvelope ===
  const phDhPublicSPKI = encodeX25519PublicKey(phKeyPair.publicKey)
  const smpEnc = buildClientMsgEnvelope(phDhPublicSPKI, nonce, cmEncBody)
  console.log("[SMP] DIAG envelope:", smpEnc.length + "B (expected 15992)")

  // === Full hex dump for SimpleGo team ===
  console.log("[SMP] DIAG clientMessage FULL HEX (" + clientMsg.length + "B):")
  for (let i = 0; i < clientMsg.length; i += 64) {
    console.log("[SMP]   [" + String(i).padStart(3, "0") + "]", hex(clientMsg.subarray(i, Math.min(i + 64, clientMsg.length)), 64))
  }

  return {
    smpEncConfirmation: smpEnc,
    ratchetKeyPair,
    ephemeralKeyPair,
  }
}

// -- Helpers

function b64decode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(0)
  let b = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b.length % 4 !== 0) b += "="
  const bin = atob(b)
  const r = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) r[i] = bin.charCodeAt(i)
  return r
}
