// Invitation builder for initial contact request (Step 2 of connection flow).
//
// Builds an smpEncConfirmation for the first SEND to a contact queue.
// This is simpler than the full connection-request.ts pipeline:
// - NaCl Layer 1 encryption only (X25519 DH with contact address key)
// - No X3DH key agreement (Alice hasn't sent us her X448 keys yet)
// - No Double Ratchet encryption (no shared ratchet key yet)
// - connInfo contains our queue URI so Alice can connect back
//
// The agent envelope includes our X448 public keys so Alice can
// perform X3DH when she accepts the connection.

import {xsalsa20poly1305} from "@noble/ciphers/salsa"
import {
  generateX448KeyPair,
  generateEd25519KeyPair,
  encodeEd25519PublicKey,
  encodeX448PublicKey,
  encodeX25519PublicKey,
  x25519DH,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import {buildAgentConfirmation} from "./agent-envelope.js"
import type {ManagedConnection} from "./connection.js"

// -- connInfo for invitation

/**
 * Build the connInfo JSON for an initial connection invitation.
 * Contains a ChatMessage x.info event with the visitor's profile.
 */
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

// -- smpConfirmation with sender key

/**
 * Build ClientMessage (the plaintext inside NaCl encryption).
 *
 * Layout (from SimpleGo protocol team):
 *   [1 byte]    'K' (0x4B) = PHConfirmation
 *   [44 bytes]  Ed25519 SPKI sender auth key (NO length prefix!)
 *   [REST]      AgentMsgEnvelope (tail - everything after the 44B SPKI)
 */
function buildClientMessage(
  senderAuthKeySPKI: Uint8Array,
  agentEnvelope: Uint8Array
): Uint8Array {
  // NO length prefix before the 44-byte SPKI key!
  const result = new Uint8Array(1 + 44 + agentEnvelope.length)
  let offset = 0
  result[offset++] = 0x4B // 'K' = PHConfirmation
  result.set(senderAuthKeySPKI, offset)
  offset += 44
  result.set(agentEnvelope, offset)
  return result
}

// -- NaCl Layer 1 encryption

/**
 * Build smpEncConfirmation: NaCl-encrypted wrapper for SEND.
 *
 * Layout:
 *   [2 bytes]   smpClientVersion (BE Word16)
 *   [1 byte]    "1" (0x31) - DH key follows
 *   [1 byte]    length of DH key (44 for X25519 SPKI)
 *   [44 bytes]  Bob's X25519 DH public key (SPKI DER)
 *   [24 bytes]  NaCl nonce
 *   [variable]  NaCl encrypted body (plaintext + 16 poly1305 tag)
 */
function buildSmpEncConfirmation(
  smpVersion: number,
  bobDhPublicKeySPKI: Uint8Array,
  plaintext: Uint8Array,
  sharedSecret: Uint8Array
): Uint8Array {
  // Pad plaintext to 15920 bytes with '#' (0x23)
  const padded = new Uint8Array(15920)
  padded.set(plaintext, 0)
  for (let i = plaintext.length; i < 15920; i++) {
    padded[i] = 0x23
  }

  // Generate 24-byte nonce
  const nonce = new Uint8Array(24)
  crypto.getRandomValues(nonce)

  // Encrypt with XSalsa20-Poly1305
  const cipher = xsalsa20poly1305(sharedSecret, nonce)
  const encrypted = cipher.encrypt(padded) // 15920 + 16 = 15936 bytes

  // Build header + nonce + encrypted
  const headerSize = 2 + 1 + 1 + 44 // version + "1" + keyLen + key
  const total = headerSize + 24 + encrypted.length
  const result = new Uint8Array(total)
  let offset = 0

  // smpClientVersion (BE Word16)
  result[offset++] = (smpVersion >>> 8) & 0xFF
  result[offset++] = smpVersion & 0xFF

  // "1" = DH key follows
  result[offset++] = 0x31

  // Key length
  result[offset++] = 44

  // Bob's X25519 DH public key (SPKI DER)
  result.set(bobDhPublicKeySPKI, offset)
  offset += 44

  // Nonce
  result.set(nonce, offset)
  offset += 24

  // Encrypted body
  result.set(encrypted, offset)

  return result
}

// -- Full invitation builder

export interface InvitationResult {
  /** The encrypted message body to pass to SEND */
  smpEncConfirmation: Uint8Array
  /** Sender auth key (SPKI) for SKEY if needed later */
  senderAuthKeySPKI: Uint8Array
  /** Bob's X448 ratchet key pair (for future X3DH) */
  ratchetKeyPair: KeyPair
  /** Bob's X448 ephemeral key pair (for future X3DH) */
  ephemeralKeyPair: KeyPair
}

/**
 * Build a connection invitation for SEND to a contact queue.
 *
 * This is simpler than the full 6-layer pipeline:
 * 1. Build connInfo (x.info JSON with display name)
 * 2. Generate X448 key pairs (for future X3DH, included in envelope)
 * 3. Build agent envelope with our X448 public keys
 * 4. Build smpConfirmation with sender auth key
 * 5. Encrypt with NaCl Layer 1 (X25519 DH)
 */
export function buildInvitation(
  conn: ManagedConnection,
  displayName: string,
  smpVersion: number
): InvitationResult {
  if (!conn.contactQueue) {
    throw new Error("Cannot build invitation: contactQueue is null")
  }

  // === LAYER 1: ConnInfo JSON (innermost) ===
  const connInfo = buildInvitationConnInfo(displayName)
  const connInfoJson = new TextDecoder().decode(connInfo)
  console.log("[SMP] DIAG L1 connInfo JSON:", connInfoJson)
  console.log("[SMP] DIAG L1 connInfo bytes:", connInfo.length + "B, hex:", hex(connInfo, 64))

  // === LAYER 2: X448 key pairs for future X3DH ===
  const ratchetKeyPair = generateX448KeyPair()
  const ephemeralKeyPair = generateX448KeyPair()
  const ratchetSPKI = encodeX448PublicKey(ratchetKeyPair.publicKey)
  const ephemeralSPKI = encodeX448PublicKey(ephemeralKeyPair.publicKey)
  console.log("[SMP] DIAG L2 ratchetKey SPKI:", ratchetSPKI.length + "B, first 12:", hex(ratchetSPKI, 12))
  console.log("[SMP] DIAG L2 ephemeralKey SPKI:", ephemeralSPKI.length + "B, first 12:", hex(ephemeralSPKI, 12))

  // === LAYER 3: AgentConfirmation ===
  // Layout: [00 07=agentV7][43='C'][31='1'=Just][00 02=e2eV2][44=key1Len][68B key1][44=key2Len][68B key2][connInfo...]
  const agentEnvelope = buildAgentConfirmation({
    ratchetPublicKeySPKI: ratchetSPKI,
    ephemeralPublicKeySPKI: ephemeralSPKI,
    encryptedConnInfo: connInfo, // NOT ratchet-encrypted for initial invitation
  })
  console.log("[SMP] DIAG L3 agentConfirmation:", agentEnvelope.length + "B, first 64:", hex(agentEnvelope, 64))
  console.log("[SMP] DIAG L3 agentVersion:", hex(agentEnvelope.subarray(0, 2), 2), "(expected: 00 07)")
  console.log("[SMP] DIAG L3 tag:", "0x" + agentEnvelope[2].toString(16), "(expected: 0x43='C')")
  console.log("[SMP] DIAG L3 justTag:", "0x" + agentEnvelope[3].toString(16), "(expected: 0x31='1')")
  console.log("[SMP] DIAG L3 e2eVersion:", hex(agentEnvelope.subarray(4, 6), 2), "(expected: 00 02)")
  console.log("[SMP] DIAG L3 key1Len:", agentEnvelope[6], "(expected: 68)")
  console.log("[SMP] DIAG L3 key2Len:", agentEnvelope[75], "(expected: 68)")

  // === LAYER 4: ClientMessage (plaintext before NaCl encryption) ===
  // Layout: [4B='K'][44B Ed25519 SPKI authKey][REST=AgentConfirmation]
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const clientMessage = buildClientMessage(senderAuthKeySPKI, agentEnvelope)
  console.log("[SMP] DIAG L4 clientMessage:", clientMessage.length + "B, first 64:", hex(clientMessage, 64))
  console.log("[SMP] DIAG L4 privHeader tag:", "0x" + clientMessage[0].toString(16), "(expected: 0x4b='K')")
  console.log("[SMP] DIAG L4 authKey SPKI first 12:", hex(clientMessage.subarray(1, 13), 12), "(expected: 30 2a 30 05 06 03 2b 65 70 03 21 00)")
  console.log("[SMP] DIAG L4 agentEnvelope starts at byte 45, first 8:", hex(clientMessage.subarray(45, 53), 8), "(expected: 00 07 43 31 00 02 44 ...)")

  // === DH keys for NaCl Layer 1 encryption ===
  const aliceDhPublicRaw = base64urlDecode(conn.contactQueue.dhPublicKey)
  const aliceDhRaw = aliceDhPublicRaw.length === 44 ? aliceDhPublicRaw.subarray(12) : aliceDhPublicRaw
  console.log("[SMP] DIAG DH alice dhPublicKey (from URI):", aliceDhPublicRaw.length + "B, raw 32B:", hex(aliceDhRaw, 32))
  console.log("[SMP] DIAG DH bob e2eDh.publicKey (raw 32B):", hex(conn.keys.e2eDh.publicKey, 32))
  console.log("[SMP] DIAG DH bob e2eDh.privateKey (raw 32B):", hex(conn.keys.e2eDh.privateKey, 32))

  const sharedSecret = x25519DH(conn.keys.e2eDh.privateKey, aliceDhRaw)
  console.log("[SMP] DIAG DH sharedSecret (32B):", hex(sharedSecret, 32))

  const bobDhPublicSPKI = encodeX25519PublicKey(conn.keys.e2eDh.publicKey)
  console.log("[SMP] DIAG DH bob SPKI (44B) first 12:", hex(bobDhPublicSPKI, 12), "(expected: 30 2a 30 05 06 03 2b 65 6e 03 21 00)")

  // === LAYER 5: ClientMsgEnvelope (final SEND body) ===
  const smpEncConfirmation = buildSmpEncConfirmation(
    4, // phVersion = 4, fixed per SimpleGo protocol team
    bobDhPublicSPKI,
    clientMessage,
    sharedSecret
  )
  console.log("[SMP] DIAG L5 envelope:", smpEncConfirmation.length + "B, first 64:", hex(smpEncConfirmation, 64))
  console.log("[SMP] DIAG L5 phVersion:", hex(smpEncConfirmation.subarray(0, 2), 2), "(expected: 00 04)")
  console.log("[SMP] DIAG L5 maybeDhKey tag:", "0x" + smpEncConfirmation[2].toString(16), "(expected: 0x31='1')")
  console.log("[SMP] DIAG L5 dhKeyLen:", smpEncConfirmation[3], "(expected: 44)")
  console.log("[SMP] DIAG L5 dhKey SPKI first 12:", hex(smpEncConfirmation.subarray(4, 16), 12), "(expected: 30 2a 30 05 06 03 2b 65 6e 03 21 00)")
  console.log("[SMP] DIAG L5 nonce (24B):", hex(smpEncConfirmation.subarray(48, 72), 24))
  console.log("[SMP] DIAG L5 cmEncBody start (16B):", hex(smpEncConfirmation.subarray(72, 88), 16))
  console.log("[SMP] DIAG L5 cmEncBody length:", smpEncConfirmation.length - 72, "B (expected: 15936 = 15920 padded + 16 poly1305)")

  console.log("[SMP] buildInvitation: SUMMARY connInfo=" + connInfo.length + "B, agentEnvelope=" + agentEnvelope.length + "B, clientMessage=" + clientMessage.length + "B, smpEncConfirmation=" + smpEncConfirmation.length + "B")

  return {smpEncConfirmation, senderAuthKeySPKI, ratchetKeyPair, ephemeralKeyPair}
}

// -- Diagnostic hex helper

function hex(bytes: Uint8Array, maxBytes: number = 32): string {
  return Array.from(bytes.slice(0, maxBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join(" ")
}

// -- Helpers

function base64urlDecode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(0)
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4 !== 0) b64 += "="
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
