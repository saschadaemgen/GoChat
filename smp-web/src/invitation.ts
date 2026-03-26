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
 * Build smpConfirmation with embedded sender auth key (non-SKEY flow).
 *
 * Layout:
 *   [1 byte]    'K' (0x4B) - sender key follows
 *   [1 byte]    length of sender auth key (44)
 *   [44 bytes]  Ed25519 SPKI sender auth key
 *   [variable]  confirmationBody = Agent Envelope
 */
function buildSmpConfirmationWithKey(
  senderAuthKeySPKI: Uint8Array,
  agentEnvelope: Uint8Array
): Uint8Array {
  const result = new Uint8Array(1 + 1 + 44 + agentEnvelope.length)
  let offset = 0
  result[offset++] = 0x4B // 'K'
  result[offset++] = 44
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

  // 1. Build connInfo (plain JSON, no ratchet encryption for initial invitation)
  const connInfo = buildInvitationConnInfo(displayName)

  // 2. Generate X448 key pairs for future X3DH
  const ratchetKeyPair = generateX448KeyPair()
  const ephemeralKeyPair = generateX448KeyPair()

  // 3. Build agent envelope with our X448 public keys
  // The connInfo goes unencrypted inside the envelope for the initial invitation.
  // Alice will use our X448 keys to set up X3DH when she accepts.
  const agentEnvelope = buildAgentConfirmation({
    ratchetPublicKeySPKI: encodeX448PublicKey(ratchetKeyPair.publicKey),
    ephemeralPublicKeySPKI: encodeX448PublicKey(ephemeralKeyPair.publicKey),
    encryptedConnInfo: connInfo, // NOT ratchet-encrypted for initial invitation
  })

  // 4. Build smpConfirmation with sender auth key
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const smpConfirmation = buildSmpConfirmationWithKey(senderAuthKeySPKI, agentEnvelope)

  // 5. NaCl Layer 1 encryption
  // Compute shared secret: X25519 DH(bob_e2eDh, alice_dh_from_contact_uri)
  const aliceDhPublicRaw = base64urlDecode(conn.contactQueue.dhPublicKey)
  // The DH key from the contact URI is SPKI encoded (44 bytes) - extract raw 32 bytes
  const aliceDhRaw = aliceDhPublicRaw.length === 44 ? aliceDhPublicRaw.subarray(12) : aliceDhPublicRaw
  const sharedSecret = x25519DH(conn.keys.e2eDh.privateKey, aliceDhRaw)

  // Build Bob's X25519 DH public key in SPKI format for the header
  const bobDhPublicSPKI = encodeX25519PublicKey(conn.keys.e2eDh.publicKey)

  const smpEncConfirmation = buildSmpEncConfirmation(
    smpVersion,
    bobDhPublicSPKI,
    smpConfirmation,
    sharedSecret
  )

  console.log("[SMP] buildInvitation: connInfo=" + connInfo.length + "B, agentEnvelope=" + agentEnvelope.length + "B, smpConfirmation=" + smpConfirmation.length + "B, smpEncConfirmation=" + smpEncConfirmation.length + "B")

  return {smpEncConfirmation, senderAuthKeySPKI, ratchetKeyPair, ephemeralKeyPair}
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
