// Double Ratchet init and first message encrypt.
//
// Implements only the SENDING side for the first message (connection request).
// Uses AES-256-GCM for body and header encryption.
// Chain key derivation uses HKDF-SHA256 with "SimpleXMK"/"SimpleXCK" info strings.

import {hkdf} from "@noble/hashes/hkdf"
import {sha256} from "@noble/hashes/sha256"
import {gcm} from "@noble/ciphers/aes"
import type {KeyPair} from "./crypto-utils.js"
import type {X3DHResult} from "./x3dh.js"

// -- Constants

const MK_INFO = new TextEncoder().encode("SimpleXMK")  // 9 bytes
const CK_INFO = new TextEncoder().encode("SimpleXCK")  // 9 bytes
const KDF_SALT = new Uint8Array(32) // 32 zero bytes
const HEADER_PAD_SIZE = 2346 // Header plaintext size before encryption

// -- Types

export interface RatchetSendState {
  rootKey: Uint8Array         // 32 bytes
  chainKey: Uint8Array        // 32 bytes
  headerKey: Uint8Array       // 32 bytes
  nextHeaderKey: Uint8Array   // 32 bytes
  ratchetPublicKey: Uint8Array // X448 raw public key (56 bytes)
  messageNumber: number       // ns counter
  previousChainLength: number // pn
}

// -- Init

/**
 * Initialize the sending side of the Double Ratchet.
 * The first Chain Key is derived from the Root Key using HKDF-SHA256.
 */
export function initSendRatchet(
  x3dhResult: X3DHResult,
  ratchetKeyPair: KeyPair
): RatchetSendState {
  // Derive first chain key from root key
  const chainKey = hkdf(sha256, x3dhResult.rootKey, KDF_SALT, CK_INFO, 32)

  return {
    rootKey: x3dhResult.rootKey,
    chainKey: new Uint8Array(chainKey),
    headerKey: x3dhResult.headerKey,
    nextHeaderKey: x3dhResult.nextHeaderKey,
    ratchetPublicKey: ratchetKeyPair.publicKey,
    messageNumber: 0,
    previousChainLength: 0,
  }
}

// -- Encrypt

/**
 * Derive message key from chain key, advance chain.
 */
function deriveMessageKey(chainKey: Uint8Array): {messageKey: Uint8Array; nextChainKey: Uint8Array} {
  const messageKey = hkdf(sha256, chainKey, KDF_SALT, MK_INFO, 32)
  const nextChainKey = hkdf(sha256, chainKey, KDF_SALT, CK_INFO, 32)
  return {
    messageKey: new Uint8Array(messageKey),
    nextChainKey: new Uint8Array(nextChainKey),
  }
}

/**
 * Build the body IV from the message number.
 * IV = [msgNumber as BE uint32 (4 bytes)] + [0x00 * 8]
 */
function buildBodyIV(messageNumber: number): Uint8Array {
  const iv = new Uint8Array(12)
  iv[0] = (messageNumber >>> 24) & 0xFF
  iv[1] = (messageNumber >>> 16) & 0xFF
  iv[2] = (messageNumber >>> 8) & 0xFF
  iv[3] = messageNumber & 0xFF
  return iv
}

/**
 * Build the plaintext header (padded to HEADER_PAD_SIZE).
 *
 * Layout:
 *   [56 bytes]  X448 ratchet public key (raw)
 *   [4 bytes]   Previous chain length (pn, BE uint32)
 *   [4 bytes]   Message number (ns, BE uint32)
 *   [2282 bytes] Zero padding
 */
function buildHeader(
  ratchetPublicKey: Uint8Array,
  previousChainLength: number,
  messageNumber: number
): Uint8Array {
  const header = new Uint8Array(HEADER_PAD_SIZE) // zero-filled
  header.set(ratchetPublicKey, 0)
  // pn (BE uint32) at offset 56
  header[56] = (previousChainLength >>> 24) & 0xFF
  header[57] = (previousChainLength >>> 16) & 0xFF
  header[58] = (previousChainLength >>> 8) & 0xFF
  header[59] = previousChainLength & 0xFF
  // ns (BE uint32) at offset 60
  header[60] = (messageNumber >>> 24) & 0xFF
  header[61] = (messageNumber >>> 16) & 0xFF
  header[62] = (messageNumber >>> 8) & 0xFF
  header[63] = messageNumber & 0xFF
  // Rest is zero padding
  return header
}

/**
 * Encrypt a message with the Double Ratchet (first message).
 *
 * @param state - Current ratchet sending state (mutated: increments counter, advances chain)
 * @param plaintext - The message to encrypt (zstd-compressed connInfo)
 * @returns Encrypted envelope: headerNonce(12) + encryptedHeader(2362) + encryptedBody(variable)
 */
export function ratchetEncrypt(
  state: RatchetSendState,
  plaintext: Uint8Array
): Uint8Array {
  // 1. Derive message key and advance chain
  const {messageKey, nextChainKey} = deriveMessageKey(state.chainKey)

  // 2. Encrypt body with AES-256-GCM
  const bodyIV = buildBodyIV(state.messageNumber)
  const bodyGcm = gcm(messageKey, bodyIV)
  const encryptedBody = bodyGcm.encrypt(plaintext) // ciphertext + 16-byte tag

  // 3. Build and encrypt header
  const headerPlaintext = buildHeader(
    state.ratchetPublicKey,
    state.previousChainLength,
    state.messageNumber
  )
  const headerNonce = new Uint8Array(12)
  crypto.getRandomValues(headerNonce)
  const headerGcm = gcm(state.headerKey, headerNonce)
  const encryptedHeader = headerGcm.encrypt(headerPlaintext) // 2346 + 16 = 2362 bytes

  // 4. Advance state
  state.chainKey = nextChainKey
  state.messageNumber += 1

  // 5. Assemble envelope: headerNonce(12) + encryptedHeader(2362) + encryptedBody
  const envelope = new Uint8Array(12 + encryptedHeader.length + encryptedBody.length)
  envelope.set(headerNonce, 0)
  envelope.set(encryptedHeader, 12)
  envelope.set(encryptedBody, 12 + encryptedHeader.length)

  return envelope
}
