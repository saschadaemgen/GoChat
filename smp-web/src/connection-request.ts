// Connection request builder - the full pipeline.
//
// Assembles all six crypto layers to produce a complete connection request
// that SimpleX apps recognize as "New contact request".
//
// Layers (outside in):
//   1. SMP SEND: smpPubHeader + NaCl XSalsa20-Poly1305 (X25519 per-queue)
//   2. Agent Envelope: agentVersion=7, 'C', e2eEncryption_ with X448 keys
//   3. e2eEncryption_: v3-v3, two X448 SPKI keys, no KEM
//   4. X3DH: 4x X448 DH -> HKDF-SHA512 -> Root Key + Header Keys
//   5. Double Ratchet: AES-256-GCM body + header encrypt
//   6. connInfo: zstd-compressed JSON (ChatMessage x.info with profile)

import {xsalsa20poly1305} from "@noble/ciphers/salsa"
import {
  generateX448KeyPair,
  generateEd25519KeyPair,
  encodeEd25519PublicKey,
  encodeX448PublicKey,
  x25519DH,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import {performX3DH} from "./x3dh.js"
import type {X3DHKeys} from "./x3dh.js"
import {initSendRatchet, ratchetEncrypt} from "./ratchet.js"
import {buildAgentConfirmation} from "./agent-envelope.js"
import type {ContactQueueInfo} from "./connection.js"
import type {ManagedConnection} from "./connection.js"
import type {SMPClientAgent} from "./agent.js"
import type {SMPServerAddress} from "./types.js"

// -- connInfo JSON builder

/**
 * Build the connInfo JSON for a connection request.
 * This is the x.info ChatMessage that the SimpleX app will display.
 */
export function buildConnInfoJSON(displayName: string): string {
  return JSON.stringify({
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
}

// -- Zstd compression

// zstd-codec is callback-based, so we provide a sync wrapper
// that initializes lazily.
let zstdSimple: any = null
let zstdInitPromise: Promise<void> | null = null

async function ensureZstd(): Promise<void> {
  if (zstdSimple) return
  if (zstdInitPromise) {
    await zstdInitPromise
    return
  }
  zstdInitPromise = new Promise<void>((resolve, reject) => {
    try {
      // Dynamic import for zstd-codec
      const {ZstdCodec} = require("zstd-codec")
      ZstdCodec.run((zstd: any) => {
        zstdSimple = new zstd.Simple()
        resolve()
      })
    } catch (e) {
      reject(new Error("Failed to initialize zstd-codec: " + String(e)))
    }
  })
  await zstdInitPromise
}

/**
 * Compress data with zstd at level 3.
 */
export async function zstdCompress(data: Uint8Array): Promise<Uint8Array> {
  await ensureZstd()
  return zstdSimple.compress(data, 3)
}

// -- NaCl Layer 1: SMP encryption

// Derive shared secret for NaCl crypto_box from X25519 DH.
// NaCl crypto_box uses HSalsa20 key derivation internally, but
// xsalsa20poly1305 takes the raw shared secret directly.
// For SMP, the shared secret = X25519 DH(our e2eDh private, their DH public).

/**
 * Build the smpEncConfirmation for the SEND command.
 *
 * Layout:
 *   [2 bytes]   smpClientVersion (BE Word16)
 *   [1 byte]    "1" (0x31) - DH key follows
 *   [1 byte]    length of DH key (44)
 *   [44 bytes]  Bob's X25519 DH public key (SPKI DER)
 *   [24 bytes]  NaCl nonce
 *   [15936 bytes] NaCl encrypted body (15920 plaintext + 16 poly1305 tag)
 *
 * Total: 2+1+1+44+24+15936 = 16008 bytes
 */
export function buildSmpEncConfirmation(
  smpVersion: number,
  bobDhPublicKeySPKI: Uint8Array,
  smpConfirmation: Uint8Array,
  sharedSecret: Uint8Array
): Uint8Array {
  // Pad smpConfirmation to 15920 bytes with '#' (0x23)
  const padded = new Uint8Array(15920)
  padded.set(smpConfirmation, 0)
  for (let i = smpConfirmation.length; i < 15920; i++) {
    padded[i] = 0x23
  }

  // Generate 24-byte nonce
  const nonce = new Uint8Array(24)
  crypto.getRandomValues(nonce)

  // Encrypt with XSalsa20-Poly1305
  const cipher = xsalsa20poly1305(sharedSecret, nonce)
  const encrypted = cipher.encrypt(padded) // 15920 + 16 = 15936 bytes

  // Build smpPubHeader + nonce + encrypted
  const headerSize = 2 + 1 + 1 + 44
  const total = headerSize + 24 + encrypted.length
  const result = new Uint8Array(total)
  let offset = 0

  // smpClientVersion (BE Word16)
  result[offset++] = (smpVersion >>> 8) & 0xFF
  result[offset++] = smpVersion & 0xFF

  // "1" = DH key follows
  result[offset++] = 0x31

  // Length of DH key
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

/**
 * Build the smpConfirmation body.
 *
 * For Fast SMP v9 (SKEY already sent): smpConfirmationHeader = "_" (empty header)
 *
 * Layout:
 *   [1 byte]    '_' (0x5F) - no sender key in confirmation (already via SKEY)
 *   [variable]  confirmationBody = Agent Envelope
 */
export function buildSmpConfirmation(
  agentEnvelope: Uint8Array
): Uint8Array {
  const result = new Uint8Array(1 + agentEnvelope.length)
  result[0] = 0x5F // '_' = empty header
  result.set(agentEnvelope, 1)
  return result
}

/**
 * Build the smpConfirmation with sender key (non-SKEY flow).
 *
 * Layout:
 *   [1 byte]    'K' (0x4B) - sender key follows
 *   [1 byte]    length of sender auth key (44)
 *   [44 bytes]  Ed25519 SPKI sender auth key
 *   [variable]  confirmationBody = Agent Envelope
 */
export function buildSmpConfirmationWithKey(
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

// -- Full pipeline

export interface ConnectionRequestParams {
  displayName: string
}

/**
 * Execute the full connection request pipeline.
 *
 * Steps:
 *   1. Build connInfo JSON (x.info ChatMessage)
 *   2. Zstd compress
 *   3. Generate X448 key pairs for ratchet
 *   4. Decode Alice's X448 keys from contact address e2e params
 *      (For now: generate dummy keys - real parsing needs e2eEncryption_ data)
 *   5. Perform X3DH key agreement
 *   6. Init Double Ratchet, encrypt connInfo
 *   7. Build Agent Envelope
 *   8. Build smpConfirmation
 *   9. Build smpEncConfirmation (NaCl Layer 1)
 *  10. Send via SMP SEND command
 */
export async function buildConnectionRequest(
  conn: ManagedConnection,
  params: ConnectionRequestParams,
  aliceKey1Raw: Uint8Array, // Alice's X448 ratchet public key (56 bytes)
  aliceKey2Raw: Uint8Array  // Alice's X448 ephemeral public key (56 bytes)
): Promise<{
  smpEncConfirmation: Uint8Array
  senderAuthKeySPKI: Uint8Array
  x448Keys: X3DHKeys
}> {
  // Layer 6: connInfo payload
  const json = buildConnInfoJSON(params.displayName)
  const jsonBytes = new TextEncoder().encode(json)
  const compressed = await zstdCompress(jsonBytes)

  // Layer 4+3: Generate X448 keys and perform X3DH
  const bobKey1 = generateX448KeyPair() // ratchet key
  const bobKey2 = generateX448KeyPair() // ephemeral key
  const x448Keys: X3DHKeys = {key1: bobKey1, key2: bobKey2}
  const x3dhResult = performX3DH(x448Keys, aliceKey1Raw, aliceKey2Raw)

  // Layer 5: Double Ratchet init + first encrypt
  const ratchetState = initSendRatchet(x3dhResult, bobKey1)
  const encryptedConnInfo = ratchetEncrypt(ratchetState, compressed)

  // Layer 2+3: Agent Envelope
  const agentEnvelope = buildAgentConfirmation({
    ratchetPublicKeySPKI: encodeX448PublicKey(bobKey1.publicKey),
    ephemeralPublicKeySPKI: encodeX448PublicKey(bobKey2.publicKey),
    encryptedConnInfo,
  })

  // Layer 2: smpConfirmation (with sender key for non-SKEY flow)
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const smpConfirmation = buildSmpConfirmationWithKey(senderAuthKeySPKI, agentEnvelope)

  // Layer 1: NaCl encryption
  // Decode Alice's DH public key from base64url in contact queue
  if (!conn.contactQueue) {
    throw new Error("Cannot send connection request: contactQueue is null (short link not resolved)")
  }

  // Compute NaCl shared secret via X25519 DH
  const aliceDhPublicRaw = base64urlDecodeRaw(conn.contactQueue.dhPublicKey)
  // The DH key from contact URI may be SPKI encoded - extract raw 32 bytes
  const aliceDhRaw = aliceDhPublicRaw.length === 44 ? aliceDhPublicRaw.subarray(12) : aliceDhPublicRaw
  const sharedSecret = x25519DH(conn.keys.e2eDh.privateKey, aliceDhRaw)

  const bobDhPublicSPKI = new Uint8Array(44)
  bobDhPublicSPKI.set(new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00]), 0)
  bobDhPublicSPKI.set(conn.keys.e2eDh.publicKey, 12)

  const smpEncConfirmation = buildSmpEncConfirmation(
    conn.state.info.queuePair ? 7 : 7, // SMP version from handshake
    bobDhPublicSPKI,
    smpConfirmation,
    sharedSecret
  )

  return {smpEncConfirmation, senderAuthKeySPKI, x448Keys}
}

// -- Helpers

function base64urlDecodeRaw(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4 !== 0) b64 += "="
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
