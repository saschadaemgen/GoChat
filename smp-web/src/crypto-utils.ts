// Key generation and SPKI DER encoding for SMP queue operations.
//
// Uses @noble/curves for Ed25519 and X25519 key generation.
// No libsodium dependency - browser-native crypto only.
//
// Ed25519: Used for recipient auth keys (authorizing SUB, ACK, DEL commands).
// X25519: Used for DH key exchange (server encryption, E2E with remote party).

import {ed25519, x25519} from "@noble/curves/ed25519"
import {x448} from "@noble/curves/ed448"

// -- Key pair type

export interface KeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

// -- SPKI DER prefixes (RFC 8410, SubjectPublicKeyInfo)
// Verified against xftp-web/src/crypto/keys.ts constants.

// Ed25519 SPKI prefix (OID 1.3.101.112)
// ASN.1: SEQUENCE { SEQUENCE { OID 1.3.101.112 }, BIT STRING { key } }
const ED25519_SPKI_PREFIX = new Uint8Array([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
])

// X25519 SPKI prefix (OID 1.3.101.110)
// ASN.1: SEQUENCE { SEQUENCE { OID 1.3.101.110 }, BIT STRING { key } }
const X25519_SPKI_PREFIX = new Uint8Array([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00,
])

// X448 SPKI prefix (OID 1.3.101.111)
// ASN.1: SEQUENCE(66) { SEQUENCE(5) { OID(3) 1.3.101.111 }, BIT STRING(57) { 0x00 + 56 bytes } }
const X448_SPKI_PREFIX = new Uint8Array([
  0x30, 0x42, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6f, 0x03, 0x39, 0x00,
])

// -- Key generation

/**
 * Generate an Ed25519 key pair for command authorization.
 * Returns 32-byte private key (secretKey) and 32-byte public key.
 */
export function generateEd25519KeyPair(): KeyPair {
  const kp = ed25519.keygen()
  return {publicKey: kp.publicKey, privateKey: kp.secretKey}
}

/**
 * Generate an X25519 key pair for DH key exchange.
 * Returns 32-byte private key (secretKey) and 32-byte public key.
 */
export function generateX25519KeyPair(): KeyPair {
  const kp = x25519.keygen()
  return {publicKey: kp.publicKey, privateKey: kp.secretKey}
}

/**
 * Generate an X448 key pair for Double Ratchet key exchange.
 * Returns 56-byte private key and 56-byte public key.
 */
export function generateX448KeyPair(): KeyPair {
  const kp = x448.keygen()
  return {publicKey: kp.publicKey, privateKey: kp.secretKey}
}

/**
 * Compute X448 Diffie-Hellman shared secret.
 * @returns 56-byte shared secret
 */
export function x448DH(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x448.getSharedSecret(privateKey, publicKey)
}

// -- SPKI DER encoding

/**
 * Encode an Ed25519 public key in X.509 SubjectPublicKeyInfo DER format.
 * 12-byte prefix + 32-byte raw key = 44 bytes.
 */
export function encodeEd25519PublicKey(rawPublicKey: Uint8Array): Uint8Array {
  const result = new Uint8Array(44)
  result.set(ED25519_SPKI_PREFIX, 0)
  result.set(rawPublicKey, 12)
  return result
}

/**
 * Encode an X25519 public key in X.509 SubjectPublicKeyInfo DER format.
 * 12-byte prefix + 32-byte raw key = 44 bytes.
 */
export function encodeX25519PublicKey(rawPublicKey: Uint8Array): Uint8Array {
  const result = new Uint8Array(44)
  result.set(X25519_SPKI_PREFIX, 0)
  result.set(rawPublicKey, 12)
  return result
}

/**
 * Encode an X448 public key in X.509 SubjectPublicKeyInfo DER format.
 * 12-byte prefix + 56-byte raw key = 68 bytes.
 */
export function encodeX448PublicKey(rawPublicKey: Uint8Array): Uint8Array {
  const result = new Uint8Array(68)
  result.set(X448_SPKI_PREFIX, 0)
  result.set(rawPublicKey, 12)
  return result
}

/**
 * Decode an X448 public key from SPKI DER format.
 * @param spki - 68-byte SPKI DER encoded key
 * @returns 56-byte raw public key
 */
export function decodeX448PublicKey(spki: Uint8Array): Uint8Array {
  if (spki.length !== 68) throw new Error("decodeX448PublicKey: expected 68 bytes, got " + spki.length)
  for (let i = 0; i < X448_SPKI_PREFIX.length; i++) {
    if (spki[i] !== X448_SPKI_PREFIX[i]) throw new Error("decodeX448PublicKey: invalid SPKI prefix")
  }
  return spki.subarray(12)
}

/**
 * Compute X25519 Diffie-Hellman shared secret.
 * @returns 32-byte shared secret
 */
export function x25519DH(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.getSharedSecret(privateKey, publicKey)
}
