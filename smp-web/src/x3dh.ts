// X3DH key agreement for SimpleX Double Ratchet initialization.
//
// SimpleX uses a symmetric 4-DH scheme where both sides are equal
// (no Identity/Ephemeral distinction like Signal). Four X448 DH
// operations feed into HKDF-SHA512 to produce the Root Key and
// Header Keys for the Double Ratchet.

import {hkdf} from "@noble/hashes/hkdf"
import {sha512} from "@noble/hashes/sha512"
import {x448DH} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"

// -- Types

export interface X3DHKeys {
  key1: KeyPair // Ratchet key pair (56-byte X448 keys)
  key2: KeyPair // Ephemeral key pair (56-byte X448 keys)
}

export interface X3DHResult {
  rootKey: Uint8Array       // 32 bytes
  headerKey: Uint8Array     // 32 bytes (send header key for initiator)
  nextHeaderKey: Uint8Array // 32 bytes
}

// -- Constants

const X3DH_SALT = new Uint8Array(32) // 32 zero bytes
const X3DH_INFO = new TextEncoder().encode("SimpleXX3DH") // 11 bytes

// -- X3DH

/**
 * Perform the SimpleX modified 4-DH X3DH key agreement.
 *
 * DH operations:
 *   DH1 = X448(ourKey1.private, theirKey1)
 *   DH2 = X448(ourKey1.private, theirKey2)
 *   DH3 = X448(ourKey2.private, theirKey1)
 *   DH4 = X448(ourKey2.private, theirKey2)
 *
 * KDF: HKDF-SHA512(DH1||DH2||DH3||DH4, salt=zeros(32), info="SimpleXX3DH", len=96)
 *
 * Output split: rootKey(32) + headerKey(32) + nextHeaderKey(32)
 */
export function performX3DH(
  ourKeys: X3DHKeys,
  theirKey1: Uint8Array,
  theirKey2: Uint8Array
): X3DHResult {
  // Four DH operations
  const dh1 = x448DH(ourKeys.key1.privateKey, theirKey1)
  const dh2 = x448DH(ourKeys.key1.privateKey, theirKey2)
  const dh3 = x448DH(ourKeys.key2.privateKey, theirKey1)
  const dh4 = x448DH(ourKeys.key2.privateKey, theirKey2)

  // Concatenate: 56*4 = 224 bytes
  const ikm = new Uint8Array(224)
  ikm.set(dh1, 0)
  ikm.set(dh2, 56)
  ikm.set(dh3, 112)
  ikm.set(dh4, 168)

  // HKDF-SHA512 -> 96 bytes
  const output = hkdf(sha512, ikm, X3DH_SALT, X3DH_INFO, 96)

  return {
    rootKey: output.slice(0, 32),
    headerKey: output.slice(32, 64),
    nextHeaderKey: output.slice(64, 96),
  }
}
