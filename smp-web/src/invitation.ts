// Invitation builder for initial contact request (Step 2).
//
// The FIRST message to a contact queue does NOT use Double Ratchet.
// The contact address contains only X25519 dh= key. There are NO X448 keys
// from the peer. Without peer X448 keys, X3DH is impossible.
//
// encConnInfo is PLAINTEXT (raw AgentConnInfoReply bytes).
// The only encryption is the outer NaCl crypto_box (Layer B, X25519).
//
// X448 keys are generated and sent IN the AgentConfirmation so the peer
// can perform X3DH when responding (Steps 5-7). But they are NOT used
// for encryption in this message.
//
// Ratchet starts at Message 2 (peer -> us) after peer does X3DH.

import nacl from "tweetnacl"
import {
  generateX448KeyPair,
  generateX25519KeyPair,
  generateEd25519KeyPair,
  encodeEd25519PublicKey,
  encodeX448PublicKey,
  encodeX25519PublicKey,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import {buildAgentConfirmation} from "./agent-envelope.js"
import type {ManagedConnection} from "./connection.js"

// -- Constants

const E2E_ENC_CONFIRMATION_LENGTH = 15904

function hex(bytes: Uint8Array, n: number = 32): string {
  return Array.from(bytes.slice(0, n)).map(b => b.toString(16).padStart(2, "0")).join(" ")
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
  return new TextEncoder().encode(JSON.stringify({
    v: "1-16", event: "x.info",
    params: {profile: {displayName, fullName: "",
      preferences: {calls: {allow: "no"}, files: {allow: "no"}, voice: {allow: "no"},
        reactions: {allow: "yes"}, fullDelete: {allow: "no"}, timedMessages: {allow: "yes"}}}}
  }))
}

// -- SMPQueueInfo (our reply queue info so peer knows where to reach us)

function buildSMPQueueInfo(
  host: string, port: number, keyHash: Uint8Array,
  senderId: Uint8Array, dhPublicSPKI: Uint8Array
): Uint8Array {
  const hb = new TextEncoder().encode(host)
  const pb = new TextEncoder().encode(String(port))
  const p: number[] = []
  p.push(0x00, 0x04) // clientVersion (uint16 BE, v4)
  p.push(0x01) // hostCount = 1
  p.push(hb.length); for (const b of hb) p.push(b)
  if (port !== 5223) { p.push(pb.length); for (const b of pb) p.push(b) } else p.push(0)
  p.push(keyHash.length); for (const b of keyHash) p.push(b)
  p.push(senderId.length); for (const b of senderId) p.push(b)
  p.push(dhPublicSPKI.length); for (const b of dhPublicSPKI) p.push(b)
  return new Uint8Array(p)
}

// -- AgentConnInfoReply (plaintext encConnInfo)

function buildAgentConnInfoReply(smpQueueInfo: Uint8Array, connInfo: Uint8Array): Uint8Array {
  // [1B 'D'][2B queueCount=0x0001][smpQueueInfo][connInfo as Tail]
  const r = new Uint8Array(1 + 2 + smpQueueInfo.length + connInfo.length)
  let o = 0
  r[o++] = 0x44 // 'D' = Duplex
  r[o++] = 0x00; r[o++] = 0x01 // queue count (uint16 BE)
  r.set(smpQueueInfo, o); o += smpQueueInfo.length
  r.set(connInfo, o)
  return r
}

// -- ClientMessage ('K' + Ed25519 SPKI + AgentConfirmation)

function buildClientMessage(senderAuthKeySPKI: Uint8Array, agentEnvelope: Uint8Array): Uint8Array {
  const r = new Uint8Array(1 + 44 + agentEnvelope.length)
  r[0] = 0x4B // 'K' = PHConfirmation
  r.set(senderAuthKeySPKI, 1) // NO length prefix before SPKI!
  r.set(agentEnvelope, 45)
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
  senderAuthKeySPKI: Uint8Array
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
  console.log("[SMP] DIAG NaCl peer_dh decoded (" + aliceDhDecoded.length + "B):", hex(aliceDhDecoded, 44))
  console.log("[SMP] DIAG NaCl peer_dh RAW (" + aliceDhRaw.length + "B):", hex(aliceDhRaw, 32))

  // Generate X448 keypairs for E2ERatchetParams.
  // These are NOT used for encryption in this message!
  // They go into AgentConfirmation so the peer can do X3DH when responding.
  const ratchetKeyPair = generateX448KeyPair() // e2ePubKey1 (identity)
  const ephemeralKeyPair = generateX448KeyPair() // e2ePubKey2 (ephemeral)

  // === encConnInfo: PLAINTEXT AgentConnInfoReply ===
  const connInfo = buildInvitationConnInfo(displayName)
  const keyHash = b64decode(conn.contactQueue.server.serverIdentity)
  const e2eDhKeyPair = generateX25519KeyPair() // For SMPQueueInfo DH key
  const e2eDhSPKI = encodeX25519PublicKey(e2eDhKeyPair.publicKey)

  const queueInfo = buildSMPQueueInfo(
    conn.contactQueue.server.hosts[0], 5223, keyHash,
    conn.receiveQueue.senderId, // senderId from IDS = how peer reaches our queue
    e2eDhSPKI
  )
  const encConnInfo = buildAgentConnInfoReply(queueInfo, connInfo)

  console.log("[SMP] DIAG encConnInfo (PLAINTEXT):", encConnInfo.length + "B, tag=0x" + encConnInfo[0].toString(16))
  console.log("[SMP] DIAG encConnInfo first 64:", hex(encConnInfo, 64))
  console.log("[SMP] DIAG smpQueueInfo:", queueInfo.length + "B, hex:", hex(queueInfo, 64))

  // === AgentConfirmation ===
  const agentEnv = buildAgentConfirmation({
    ratchetPublicKeySPKI: encodeX448PublicKey(ratchetKeyPair.publicKey),
    ephemeralPublicKeySPKI: encodeX448PublicKey(ephemeralKeyPair.publicKey),
    encryptedConnInfo: encConnInfo, // PLAINTEXT for first message
  })
  console.log("[SMP] DIAG agentConfirmation:", agentEnv.length + "B")

  // === ClientMessage ===
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const clientMsg = buildClientMessage(senderAuthKeySPKI, agentEnv)
  console.log("[SMP] DIAG clientMessage:", clientMsg.length + "B")
  console.log("[SMP] DIAG clientMessage[45-55] (AgentConf start):", hex(clientMsg.subarray(45, 55), 10))
  console.log("[SMP] DIAG clientMessage[185-195] (encConnInfo area):", hex(clientMsg.subarray(185, 195), 10))
  const encConnInfoStart = 45 + 144 // 'K'(1) + SPKI(44) + AgentConf header(144)
  console.log("[SMP] DIAG clientMessage[" + encConnInfoStart + "] (expected 0x44='D'):", "0x" + (clientMsg[encConnInfoStart] || 0).toString(16))

  // === Layer B: NaCl crypto_box (the ONLY encryption) ===
  // MUST use nacl.box() which does DH + HSalsa20 + XSalsa20-Poly1305 internally.
  // Raw xsalsa20poly1305 skips the HSalsa20 key derivation step!
  const phKeyPair = nacl.box.keyPair()
  console.log("[SMP] DIAG NaCl our_dh_pub  RAW (" + phKeyPair.publicKey.length + "B):", hex(phKeyPair.publicKey, 32))
  console.log("[SMP] DIAG NaCl our_dh_priv RAW (" + phKeyPair.secretKey.length + "B):", hex(phKeyPair.secretKey, 32))

  const paddedClientMsg = padPlaintext(clientMsg, E2E_ENC_CONFIRMATION_LENGTH)
  console.log("[SMP] DIAG NaCl plaintext padded:", paddedClientMsg.length + "B, first 32:", hex(paddedClientMsg, 32))
  console.log("[SMP] DIAG NaCl plaintext[0-1] (length BE):", hex(paddedClientMsg.subarray(0, 2), 2), "= " + ((paddedClientMsg[0] << 8) | paddedClientMsg[1]) + " bytes")

  const nonce = nacl.randomBytes(24)
  console.log("[SMP] DIAG NaCl cmNonce (" + nonce.length + "B):", hex(nonce, 24))

  console.log("[SMP] DIAG NaCl function: nacl.box (tweetnacl - DH + HSalsa20 + XSalsa20-Poly1305)")
  const cmEncBody = nacl.box(paddedClientMsg, nonce, aliceDhRaw, phKeyPair.secretKey)
  console.log("[SMP] DIAG NaCl cmEncBody:", cmEncBody.length + "B (expected 15920), first 32:", hex(cmEncBody, 32))

  // === ClientMsgEnvelope ===
  const phDhPublicSPKI = encodeX25519PublicKey(phKeyPair.publicKey)
  console.log("[SMP] DIAG NaCl our_dh SPKI in envelope (" + phDhPublicSPKI.length + "B):", hex(phDhPublicSPKI, 12), "...")

  const smpEnc = buildClientMsgEnvelope(phDhPublicSPKI, nonce, cmEncBody)
  console.log("[SMP] DIAG envelope:", smpEnc.length + "B (expected 15992)")
  console.log("[SMP] DIAG envelope first 8:", hex(smpEnc, 8), "(expected: 00 04 31 2c 30 2a 30 05)")

  return {
    smpEncConfirmation: smpEnc,
    senderAuthKeySPKI,
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
