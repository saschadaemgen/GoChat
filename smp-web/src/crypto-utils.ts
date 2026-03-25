// Key generation and SPKI DER encoding for SMP queue operations.
//
// Uses @noble/curves for Ed25519 and X25519 key generation.
// No libsodium dependency - browser-native crypto only.
//
// Ed25519: Used for recipient auth keys (authorizing SUB, ACK, DEL commands).
// X25519: Used for DH key exchange (server encryption, E2E with remote party).

import {ed25519, x25519} from "@noble/curves/ed25519"

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
