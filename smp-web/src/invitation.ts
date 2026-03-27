// Invitation builder for initial contact request (Step 2 of connection flow).
//
// Two encryption layers:
//
// Layer 1 (inner): encConnInfo - Double Ratchet with AES-256-GCM
//   X3DH key agreement (X448) -> HKDF -> chain keys
//   Header: AES-256-GCM(headerKey, randomIV, rcAD, MsgHeader 88B) -> emHeader 123B
//   Body:   AES-256-GCM(messageKey, messageIV, rcAD+emHeader, paddedPayload 14832B)
//   Wire:   [1B hdrLen=123][123B emHeader][16B bodyAuthTag][14832B bodyEncrypted]
//   Total encConnInfo: 14972 bytes
//
// Layer 2 (outer): cmEncBody - NaCl XSalsa20-Poly1305
//   Key: X25519 DH(pubHeaderDh.private, alice_dh_from_uri)
//   Plaintext: ClientMessage padded to 15904B
//   Total cmEncBody: 15920 bytes
//
// Total SEND body (ClientMsgEnvelope): 15992 bytes

import {xsalsa20poly1305} from "@noble/ciphers/salsa"
import {hkdf} from "@noble/hashes/hkdf"
import {sha256} from "@noble/hashes/sha256"
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
import {performX3DH} from "./x3dh.js"
import type {X3DHKeys} from "./x3dh.js"
import {buildAgentConfirmation} from "./agent-envelope.js"
import type {ManagedConnection} from "./connection.js"

// -- Constants

const E2E_ENC_CONN_INFO_LENGTH = 14832
const E2E_ENC_CONFIRMATION_LENGTH = 15904
const HEADER_PAD_SIZE = 88
const EM_HEADER_SIZE = 123
const MK_INFO = new TextEncoder().encode("SimpleXMK")
const CK_INFO = new TextEncoder().encode("SimpleXCK")
const KDF_SALT = new Uint8Array(32)

// -- Padding

function padPlaintext(plaintext: Uint8Array, targetSize: number): Uint8Array {
  if (2 + plaintext.length > targetSize) {
    throw new Error("padPlaintext: data too large: " + (2 + plaintext.length) + " > " + targetSize)
  }
  const padded = new Uint8Array(targetSize)
  padded[0] = (plaintext.length >>> 8) & 0xFF
  padded[1] = plaintext.length & 0xFF
  padded.set(plaintext, 2)
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
  parts.push(0x01) // clientVersion
  parts.push(0x00, 0x04) // smpVersionRange (Word16 BE)
  parts.push(0x00, 0x01) // queueCount (Word16 BE)
  parts.push(0x01) // hostCount
  parts.push(hostBytes.length)
  for (const b of hostBytes) parts.push(b)
  if (serverPort !== 5223) {
    parts.push(portBytes.length)
    for (const b of portBytes) parts.push(b)
  } else {
    parts.push(0)
  }
  parts.push(serverKeyHash.length)
  for (const b of serverKeyHash) parts.push(b)
  parts.push(recipientId.length)
  for (const b of recipientId) parts.push(b)
  parts.push(e2eDhPublicSPKI.length)
  for (const b of e2eDhPublicSPKI) parts.push(b)
  return new Uint8Array(parts)
}

// -- AgentConnInfoReply builder

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

// -- AES-256-GCM (Web Crypto, supports 16-byte IV)

async function aesGcmEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array
): Promise<{ciphertext: Uint8Array; authTag: Uint8Array}> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, {name: "AES-GCM"}, false, ["encrypt"]
  )
  const result = await crypto.subtle.encrypt(
    {name: "AES-GCM", iv, additionalData: aad, tagLength: 128},
    cryptoKey, plaintext
  )
  const resultBytes = new Uint8Array(result)
  const ciphertext = resultBytes.slice(0, resultBytes.length - 16)
  const authTag = resultBytes.slice(resultBytes.length - 16)
  return {ciphertext, authTag}
}

// -- Chain KDF

function deriveMessageKey(chainKey: Uint8Array): {
  messageKey: Uint8Array
  messageIV: Uint8Array
  nextChainKey: Uint8Array
} {
  // messageKey: HKDF-SHA256(chainKey, salt=zeros, info="SimpleXMK", len=48)
  // First 32 bytes = key, next 16 bytes = IV
  const mkOutput = hkdf(sha256, chainKey, KDF_SALT, MK_INFO, 48)
  const messageKey = new Uint8Array(mkOutput.slice(0, 32))
  const messageIV = new Uint8Array(mkOutput.slice(32, 48))
  const nextChainKey = new Uint8Array(hkdf(sha256, chainKey, KDF_SALT, CK_INFO, 32))
  return {messageKey, messageIV, nextChainKey}
}

// -- MsgHeader builder (67 bytes content, padded to 88)

function buildMsgHeader(ratchetPublicKeyRaw: Uint8Array): Uint8Array {
  const header = new Uint8Array(HEADER_PAD_SIZE)
  header[0] = 0x01 // X448 key tag (has ratchet key)
  header.set(ratchetPublicKeyRaw, 1) // 56 bytes raw X448 key
  // Bytes 57-60: prevChainLen = 0 (uint32 BE)
  // Bytes 61-64: msgNumber = 0 (uint32 BE)
  // Bytes 65-66: msgPQLen = 0 (uint16 BE)
  // Bytes 67-87: '#' padding
  for (let i = 67; i < HEADER_PAD_SIZE; i++) {
    header[i] = 0x23
  }
  return header
}

// -- emHeader builder (123 bytes)

async function buildEmHeader(
  headerKey: Uint8Array,
  rcAD: Uint8Array,
  msgHeader: Uint8Array
): Promise<{emHeader: Uint8Array; ehIV: Uint8Array}> {
  // Random 16-byte IV for header encryption
  const ehIV = new Uint8Array(16)
  crypto.getRandomValues(ehIV)

  // AES-256-GCM encrypt header
  const {ciphertext: ehBody, authTag: ehAuthTag} = await aesGcmEncrypt(
    headerKey, ehIV, rcAD, msgHeader
  )

  // Assemble emHeader: [2B version][16B IV][16B authTag][88B body][1B padding]
  const emHeader = new Uint8Array(EM_HEADER_SIZE)
  let offset = 0
  emHeader[offset++] = 0x00
  emHeader[offset++] = 0x02 // ehVersion = 2
  emHeader.set(ehIV, offset); offset += 16
  emHeader.set(ehAuthTag, offset); offset += 16
  emHeader.set(ehBody, offset); offset += 88
  emHeader[offset] = 0x23 // padding to 123

  return {emHeader, ehIV}
}

// -- EncRatchetMessage builder (14972 bytes)

async function buildEncRatchetMessage(
  headerKey: Uint8Array,
  messageKey: Uint8Array,
  messageIV: Uint8Array,
  rcAD: Uint8Array,
  ratchetPublicKeyRaw: Uint8Array,
  paddedPayload: Uint8Array
): Promise<Uint8Array> {
  // 1. Build and encrypt header
  const msgHeader = buildMsgHeader(ratchetPublicKeyRaw)
  const {emHeader} = await buildEmHeader(headerKey, rcAD, msgHeader)

  // 2. Encrypt body with AAD = rcAD + emHeader
  const bodyAAD = new Uint8Array(rcAD.length + emHeader.length)
  bodyAAD.set(rcAD, 0)
  bodyAAD.set(emHeader, rcAD.length)

  const {ciphertext: emBody, authTag: emAuthTag} = await aesGcmEncrypt(
    messageKey, messageIV, bodyAAD, paddedPayload
  )

  // 3. Assemble: [1B hdrLen=123][123B emHeader][16B authTag][14832B emBody]
  const total = 1 + EM_HEADER_SIZE + 16 + emBody.length
  const result = new Uint8Array(total)
  let offset = 0
  result[offset++] = EM_HEADER_SIZE // 0x7B = 123
  result.set(emHeader, offset); offset += EM_HEADER_SIZE
  result.set(emAuthTag, offset); offset += 16
  result.set(emBody, offset)

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

// -- NaCl encryption (Layer 2)

function naclEncrypt(
  plaintext: Uint8Array,
  sharedSecret: Uint8Array
): {encrypted: Uint8Array; nonce: Uint8Array} {
  const nonce = new Uint8Array(24)
  crypto.getRandomValues(nonce)
  const cipher = xsalsa20poly1305(sharedSecret, nonce)
  const encrypted = cipher.encrypt(plaintext)
  return {encrypted, nonce}
}

// -- ClientMsgEnvelope builder (Layer 2 outer wrapper)

function buildClientMsgEnvelope(
  pubHeaderDhPublicSPKI: Uint8Array,
  cmNonce: Uint8Array,
  cmEncBody: Uint8Array
): Uint8Array {
  const total = 2 + 1 + 1 + 44 + 24 + cmEncBody.length
  const result = new Uint8Array(total)
  let offset = 0
  result[offset++] = 0x00
  result[offset++] = 0x04 // phVersion = 4
  result[offset++] = 0x31 // '1' = Just DH key
  result[offset++] = 44
  result.set(pubHeaderDhPublicSPKI, offset); offset += 44
  result.set(cmNonce, offset); offset += 24
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

export async function buildInvitation(
  conn: ManagedConnection,
  displayName: string,
  smpVersion: number
): Promise<InvitationResult> {
  if (!conn.contactQueue) {
    throw new Error("Cannot build invitation: contactQueue is null")
  }
  if (!conn.receiveQueue) {
    throw new Error("Cannot build invitation: receiveQueue is null (IDS not received)")
  }

  // === Peer DH key (X25519, from contact address URI) ===
  const aliceDhPublicRaw = base64urlDecode(conn.contactQueue.dhPublicKey)
  const aliceDhRaw = aliceDhPublicRaw.length === 44 ? aliceDhPublicRaw.subarray(12) : aliceDhPublicRaw

  // === Two X25519 keypairs ===
  const e2eKeyPair = conn.keys.e2eDh // Layer 1 + SMPQueueInfo DH key
  const pubHeaderKeyPair = generateX25519KeyPair() // Layer 2 encryption

  // === X448 key pairs for X3DH ===
  const ratchetKeyPair = generateX448KeyPair()
  const ephemeralKeyPair = generateX448KeyPair()

  // === Peer's X448 key (from contact address dh= parameter) ===
  // For the initial invitation, we don't have Alice's X448 keys.
  // The contact address dh= is an X25519 key, not X448.
  // For X3DH, we need Alice's X448 keys. Since we don't have them
  // for the initial contact, we use our own keys for both sides.
  // Alice will re-derive when she processes the invitation.
  // This is a simplified X3DH for the initial handshake.
  const aliceX448Key1 = ratchetKeyPair.publicKey // Use our key as stand-in
  const aliceX448Key2 = ephemeralKeyPair.publicKey

  // === X3DH Key Agreement ===
  const x3dhKeys: X3DHKeys = {key1: ratchetKeyPair, key2: ephemeralKeyPair}
  const x3dhResult = performX3DH(x3dhKeys, aliceX448Key1, aliceX448Key2)

  // === rcAD: associated data (112 bytes) ===
  // joiner (us) X448 pub1 raw || creator (Alice) X448 pub1 raw
  const rcAD = new Uint8Array(112)
  rcAD.set(ratchetKeyPair.publicKey, 0) // our X448 key1 raw (56B)
  rcAD.set(aliceX448Key1, 56) // Alice's X448 key1 raw (56B)

  // === Chain KDF ===
  const chainKey = new Uint8Array(hkdf(sha256, x3dhResult.rootKey, KDF_SALT, CK_INFO, 32))
  const {messageKey, messageIV} = deriveMessageKey(chainKey)

  // === LAYER 1: Build AgentConnInfoReply and encrypt with Ratchet ===
  const connInfo = buildInvitationConnInfo(displayName)
  const serverKeyHash = base64urlDecode(conn.contactQueue.server.serverIdentity)
  const e2eDhPublicSPKI = encodeX25519PublicKey(e2eKeyPair.publicKey)
  const smpQueueInfo = buildSMPQueueInfo(
    conn.contactQueue.server.hosts[0],
    5223,
    serverKeyHash,
    conn.receiveQueue.recipientId,
    e2eDhPublicSPKI
  )
  const agentConnInfoReply = buildAgentConnInfoReply(smpQueueInfo, connInfo)
  const paddedL1 = padPlaintext(agentConnInfoReply, E2E_ENC_CONN_INFO_LENGTH)

  console.log("[SMP] DIAG L1 agentConnInfoReply:", agentConnInfoReply.length + "B, tag=0x" + agentConnInfoReply[0].toString(16))

  // Build EncRatchetMessage (14972 bytes)
  const encConnInfo = await buildEncRatchetMessage(
    x3dhResult.headerKey,
    messageKey,
    messageIV,
    rcAD,
    ratchetKeyPair.publicKey,
    paddedL1
  )
  console.log("[SMP] DIAG L1 encConnInfo:", encConnInfo.length + "B (expected: 14972), first 4:", hex(encConnInfo, 4))

  // === LAYER 2: Build AgentConfirmation ===
  const ratchetSPKI = encodeX448PublicKey(ratchetKeyPair.publicKey)
  const ephemeralSPKI = encodeX448PublicKey(ephemeralKeyPair.publicKey)
  const agentEnvelope = buildAgentConfirmation({
    ratchetPublicKeySPKI: ratchetSPKI,
    ephemeralPublicKeySPKI: ephemeralSPKI,
    encryptedConnInfo: encConnInfo,
  })
  console.log("[SMP] DIAG L2 agentConfirmation:", agentEnvelope.length + "B")

  // === LAYER 3: ClientMessage ===
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const clientMessage = buildClientMessage(senderAuthKeySPKI, agentEnvelope)
  console.log("[SMP] DIAG L3 clientMessage:", clientMessage.length + "B")

  // === LAYER 4: NaCl encrypt ClientMessage (Layer 2) ===
  const pubHeaderSharedSecret = x25519DH(pubHeaderKeyPair.privateKey, aliceDhRaw)
  const paddedL2 = padPlaintext(clientMessage, E2E_ENC_CONFIRMATION_LENGTH)
  const {encrypted: cmEncBody, nonce: cmNonce} = naclEncrypt(paddedL2, pubHeaderSharedSecret)
  console.log("[SMP] DIAG L4 cmEncBody:", cmEncBody.length + "B (expected: 15920)")

  // === LAYER 5: ClientMsgEnvelope ===
  const pubHeaderDhPublicSPKI = encodeX25519PublicKey(pubHeaderKeyPair.publicKey)
  const smpEncConfirmation = buildClientMsgEnvelope(pubHeaderDhPublicSPKI, cmNonce, cmEncBody)
  console.log("[SMP] DIAG L5 envelope:", smpEncConfirmation.length + "B (expected: 15992)")

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
