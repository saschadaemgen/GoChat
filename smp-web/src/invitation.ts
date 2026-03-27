// Invitation builder for initial contact request (Step 2 of connection flow).
//
// Two-layer NaCl encryption with correct padding sizes:
//
// Layer 1 (inner): encConnInfo
//   Plaintext: AgentConnInfoReply = 'D' + SMPQueueInfo + connInfo JSON
//   Padding: [2B length BE][plaintext][0x23 to 14832B]
//   Encrypted: NaCl crypto_box(padded, nonce, peer_dh, e2e_private) = 14848B
//   Key: X25519 DH(e2eDh.private, alice_dh_from_uri) - "E2E keypair"
//
// Layer 2 (outer): cmEncBody (inside ClientMsgEnvelope)
//   Plaintext: ClientMessage = 'K' + authKey SPKI + AgentConfirmation
//   Padding: [2B length BE][plaintext][0x23 to 15904B]
//   Encrypted: NaCl crypto_box(padded, nonce, peer_dh, pubHeader_private) = 15920B
//   Key: X25519 DH(pubHeaderDh.private, alice_dh_from_uri) - "PubHeader keypair"
//
// Total SEND body: 2 + 1 + 1 + 44 + 24 + 15920 = 15992 bytes

import {xsalsa20poly1305} from "@noble/ciphers/salsa"
import {
  generateX448KeyPair,
  generateX25519KeyPair,
  generateEd25519KeyPair,
  encodeEd25519PublicKey,
  encodeX448PublicKey,
  encodeX25519PublicKey,
  x25519DH,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import {buildAgentConfirmation} from "./agent-envelope.js"
import type {ManagedConnection} from "./connection.js"

// -- Padding constants (from Haskell source / SimpleGo protocol team)

const E2E_ENC_CONN_INFO_LENGTH = 14832   // Layer 1: encConnInfo padding target
const E2E_ENC_CONFIRMATION_LENGTH = 15904 // Layer 2: Confirmation padding target

// -- Padding function

/**
 * Pad plaintext with 2-byte length prefix and '#' fill.
 * Format: [2B original length BE][plaintext][0x23 padding to targetSize]
 */
function padPlaintext(plaintext: Uint8Array, targetSize: number): Uint8Array {
  if (2 + plaintext.length > targetSize) {
    throw new Error("padPlaintext: data too large: " + (2 + plaintext.length) + " > " + targetSize)
  }
  const padded = new Uint8Array(targetSize)
  // First 2 bytes: original length as uint16 BE
  padded[0] = (plaintext.length >>> 8) & 0xFF
  padded[1] = plaintext.length & 0xFF
  // Copy plaintext after length
  padded.set(plaintext, 2)
  // Fill remaining with '#' (0x23)
  for (let i = 2 + plaintext.length; i < targetSize; i++) {
    padded[i] = 0x23
  }
  return padded
}

// -- connInfo JSON

export function buildInvitationConnInfo(displayName: string): Uint8Array {
  const json = JSON.stringify({
    v: "1-16",
    event: "x.info",
    params: {
      profile: {
        displayName: displayName,
        fullName: "",
        preferences: {
          calls: {allow: "no"},
          files: {allow: "no"},
          voice: {allow: "no"},
          reactions: {allow: "yes"},
          fullDelete: {allow: "no"},
          timedMessages: {allow: "yes"},
        },
      },
    },
  })
  return new TextEncoder().encode(json)
}

// -- SMPQueueInfo builder

/**
 * Build SMPQueueInfo for our reply queue.
 *
 * Layout:
 *   [1B clientVersion = 0x01]
 *   [2B smpVersionRange BE = 0x0004]
 *   [2B queueCount BE = 0x0001]
 *   [1B hostCount = 0x01]
 *   [1B hostLen][hostString]
 *   [1B portLen]["5223" or omit if default]
 *   [1B keyHashLen][32B keyHash]
 *   [1B recipientIdLen][recipientId bytes]
 */
function buildSMPQueueInfo(
  serverHost: string,
  serverPort: number,
  serverKeyHash: Uint8Array,
  recipientId: Uint8Array,
  e2eDhPublicSPKI: Uint8Array
): Uint8Array {
  const hostBytes = new TextEncoder().encode(serverHost)
  const portStr = String(serverPort)
  const portBytes = new TextEncoder().encode(portStr)

  const parts: number[] = []

  // clientVersion = 1
  parts.push(0x01)

  // smpVersionRange = 4 (Word16 BE)
  parts.push(0x00, 0x04)

  // queueCount = 1 (Word16 BE)
  parts.push(0x00, 0x01)

  // hostCount = 1
  parts.push(0x01)

  // host (shortString)
  parts.push(hostBytes.length)
  for (const b of hostBytes) parts.push(b)

  // port (shortString) - include if non-default (5223 is default for SMP)
  if (serverPort !== 5223) {
    parts.push(portBytes.length)
    for (const b of portBytes) parts.push(b)
  } else {
    parts.push(0) // empty port = default
  }

  // keyHash (shortString: 1B len + 32B hash)
  parts.push(serverKeyHash.length)
  for (const b of serverKeyHash) parts.push(b)

  // recipientId (shortString: 1B len + bytes)
  parts.push(recipientId.length)
  for (const b of recipientId) parts.push(b)

  // e2eDhPublic (shortString: 1B len + 44B SPKI)
  parts.push(e2eDhPublicSPKI.length)
  for (const b of e2eDhPublicSPKI) parts.push(b)

  return new Uint8Array(parts)
}

// -- AgentConnInfoReply builder

/**
 * Build AgentConnInfoReply (plaintext for Layer 1 encryption).
 *
 * Layout:
 *   [1B tag = 'D' (0x44) = Duplex]
 *   [SMPQueueInfo bytes]
 *   [REST connInfo JSON]
 */
function buildAgentConnInfoReply(
  smpQueueInfo: Uint8Array,
  connInfo: Uint8Array
): Uint8Array {
  const result = new Uint8Array(1 + smpQueueInfo.length + connInfo.length)
  result[0] = 0x44 // 'D' = Duplex
  result.set(smpQueueInfo, 1)
  result.set(connInfo, 1 + smpQueueInfo.length)
  return result
}

// -- ClientMessage builder

function buildClientMessage(
  senderAuthKeySPKI: Uint8Array,
  agentEnvelope: Uint8Array
): Uint8Array {
  const result = new Uint8Array(1 + 44 + agentEnvelope.length)
  result[0] = 0x4B // 'K' = PHConfirmation
  result.set(senderAuthKeySPKI, 1)
  result.set(agentEnvelope, 45)
  return result
}

// -- NaCl encryption helper

function naclEncrypt(
  plaintext: Uint8Array,
  sharedSecret: Uint8Array
): {encrypted: Uint8Array; nonce: Uint8Array} {
  const nonce = new Uint8Array(24)
  crypto.getRandomValues(nonce)
  const cipher = xsalsa20poly1305(sharedSecret, nonce)
  const encrypted = cipher.encrypt(plaintext) // plaintext + 16 MAC
  return {encrypted, nonce}
}

// -- ClientMsgEnvelope builder

function buildClientMsgEnvelope(
  pubHeaderDhPublicSPKI: Uint8Array,
  cmNonce: Uint8Array,
  cmEncBody: Uint8Array
): Uint8Array {
  // [2B phVersion=4][1B '1'][1B 44][44B X25519 SPKI][24B nonce][cmEncBody]
  const total = 2 + 1 + 1 + 44 + 24 + cmEncBody.length
  const result = new Uint8Array(total)
  let offset = 0

  // phVersion = 4 (BE Word16)
  result[offset++] = 0x00
  result[offset++] = 0x04

  // Just DH key
  result[offset++] = 0x31 // '1'
  result[offset++] = 44   // key length

  // PubHeader DH public key (X25519 SPKI)
  result.set(pubHeaderDhPublicSPKI, offset)
  offset += 44

  // Nonce
  result.set(cmNonce, offset)
  offset += 24

  // Encrypted body
  result.set(cmEncBody, offset)

  return result
}

// -- Full invitation builder

export interface InvitationResult {
  smpEncConfirmation: Uint8Array
  senderAuthKeySPKI: Uint8Array
  ratchetKeyPair: KeyPair
  ephemeralKeyPair: KeyPair
}

export function buildInvitation(
  conn: ManagedConnection,
  displayName: string,
  smpVersion: number
): InvitationResult {
  if (!conn.contactQueue) {
    throw new Error("Cannot build invitation: contactQueue is null")
  }
  if (!conn.receiveQueue) {
    throw new Error("Cannot build invitation: receiveQueue is null (IDS not received)")
  }

  // === Peer DH key (from contact address URI) ===
  const aliceDhPublicRaw = base64urlDecode(conn.contactQueue.dhPublicKey)
  const aliceDhRaw = aliceDhPublicRaw.length === 44 ? aliceDhPublicRaw.subarray(12) : aliceDhPublicRaw

  // === Two separate X25519 keypairs ===
  // Keypair 1 (E2E): Layer 1 encryption (encConnInfo) + SMPQueueInfo DH key
  const e2eKeyPair = conn.keys.e2eDh
  const e2eSharedSecret = x25519DH(e2eKeyPair.privateKey, aliceDhRaw)

  // Keypair 2 (PubHeader): Layer 2 encryption (cmEncBody) + ClientMsgEnvelope header
  const pubHeaderKeyPair = generateX25519KeyPair()
  const pubHeaderSharedSecret = x25519DH(pubHeaderKeyPair.privateKey, aliceDhRaw)

  // === X448 key pairs for future X3DH ===
  const ratchetKeyPair = generateX448KeyPair()
  const ephemeralKeyPair = generateX448KeyPair()

  // === LAYER 1: Build and encrypt AgentConnInfoReply ===
  const connInfo = buildInvitationConnInfo(displayName)

  // SMPQueueInfo for our reply queue
  const serverKeyHash = base64urlDecode(conn.contactQueue.server.serverIdentity)
  const e2eDhPublicSPKI = encodeX25519PublicKey(e2eKeyPair.publicKey)
  const smpQueueInfo = buildSMPQueueInfo(
    conn.contactQueue.server.hosts[0],
    5223, // Native SMP port (SimpleX app connects via native TLS, not WebSocket)
    serverKeyHash,
    conn.receiveQueue.recipientId,
    e2eDhPublicSPKI
  )

  const agentConnInfoReply = buildAgentConnInfoReply(smpQueueInfo, connInfo)
  console.log("[SMP] DIAG L1 agentConnInfoReply:", agentConnInfoReply.length + "B, tag=0x" + agentConnInfoReply[0].toString(16) + ", first 32:", hex(agentConnInfoReply, 32))

  // Layer 1 encrypt: pad to 14832, NaCl encrypt -> 14848B
  const paddedL1 = padPlaintext(agentConnInfoReply, E2E_ENC_CONN_INFO_LENGTH)
  const {encrypted: encConnInfo, nonce: _l1Nonce} = naclEncrypt(paddedL1, e2eSharedSecret)
  console.log("[SMP] DIAG L1 encConnInfo:", encConnInfo.length + "B (expected: 14848 = 14832 + 16 MAC)")

  // === LAYER 2: Build AgentConfirmation ===
  const ratchetSPKI = encodeX448PublicKey(ratchetKeyPair.publicKey)
  const ephemeralSPKI = encodeX448PublicKey(ephemeralKeyPair.publicKey)
  const agentEnvelope = buildAgentConfirmation({
    ratchetPublicKeySPKI: ratchetSPKI,
    ephemeralPublicKeySPKI: ephemeralSPKI,
    encryptedConnInfo: encConnInfo, // 14848B encrypted
  })
  console.log("[SMP] DIAG L2 agentConfirmation:", agentEnvelope.length + "B, first 16:", hex(agentEnvelope, 16))

  // === LAYER 3: Build ClientMessage ===
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const clientMessage = buildClientMessage(senderAuthKeySPKI, agentEnvelope)
  console.log("[SMP] DIAG L3 clientMessage:", clientMessage.length + "B, tag=0x" + clientMessage[0].toString(16))

  // === LAYER 4: Encrypt ClientMessage -> cmEncBody ===
  // Layer 2 encrypt: pad to 15904, NaCl encrypt -> 15920B
  const paddedL2 = padPlaintext(clientMessage, E2E_ENC_CONFIRMATION_LENGTH)
  const {encrypted: cmEncBody, nonce: cmNonce} = naclEncrypt(paddedL2, pubHeaderSharedSecret)
  console.log("[SMP] DIAG L4 cmEncBody:", cmEncBody.length + "B (expected: 15920 = 15904 + 16 MAC)")

  // === LAYER 5: Build ClientMsgEnvelope ===
  const pubHeaderDhPublicSPKI = encodeX25519PublicKey(pubHeaderKeyPair.publicKey)
  const smpEncConfirmation = buildClientMsgEnvelope(pubHeaderDhPublicSPKI, cmNonce, cmEncBody)
  console.log("[SMP] DIAG L5 envelope:", smpEncConfirmation.length + "B (expected: 15992)")
  console.log("[SMP] DIAG L5 phVersion:", hex(smpEncConfirmation.subarray(0, 2), 2), "(expected: 00 04)")

  console.log("[SMP] buildInvitation: SUMMARY encConnInfo=" + encConnInfo.length + "B, agentEnvelope=" + agentEnvelope.length + "B, clientMessage=" + clientMessage.length + "B, smpEncConfirmation=" + smpEncConfirmation.length + "B")

  return {smpEncConfirmation, senderAuthKeySPKI, ratchetKeyPair, ephemeralKeyPair}
}

// -- Helpers

function hex(bytes: Uint8Array, maxBytes: number = 32): string {
  return Array.from(bytes.slice(0, maxBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join(" ")
}

function base64urlDecode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(0)
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4 !== 0) b64 += "="
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
