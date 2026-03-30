// X3DH Key Agreement for Season 9
//
// Performs the receiving-side X3DH (pqX3dhRcv) to derive the initial
// Double Ratchet keys from our two X448 keypairs (from invitation)
// and the CLI's two X448 public keys (from AgentConfirmation).
//
// Reference: Simplex.Messaging.Crypto.Ratchet (pqX3dhRcv, pqX3dh)
// Reference: SimpleGo CRYPTO.md (X3DH Key Agreement)

import {x448} from "@noble/curves/ed448"
import {hkdf} from "@noble/hashes/hkdf"
import {sha512} from "@noble/hashes/sha512"

// --- Types ---

export interface X448KeyPair {
  publicKey: Uint8Array  // 56 bytes
  privateKey: Uint8Array // 56 bytes
}

export interface RatchetInitParams {
  /** Associated data: initiator_key1_raw || responder_key1_raw (112B) */
  assocData: Uint8Array
  /** Root key for Double Ratchet (32B) */
  ratchetKey: Uint8Array
  /** Send header key (32B) */
  sndHK: Uint8Array
  /** Receive next header key (32B) */
  rcvNextHK: Uint8Array
}

// --- Constants ---

const X3DH_SALT_LEN = 64
const X3DH_INFO = "SimpleXX3DH"
const X3DH_OUTPUT_LEN = 96
const X448_KEY_LEN = 56

// --- X3DH ---

/**
 * Perform X3DH key agreement as the receiving side (Bob/responder).
 *
 * We created the connection and sent the invitation. The CLI joined
 * and sent AgentConfirmation with its X448 keys.
 *
 * Three DH computations:
 *   dh1 = X448(peerKey2, ourKey1.private)
 *   dh2 = X448(peerKey1, ourKey2.private)
 *   dh3 = X448(peerKey2, ourKey2.private)
 *
 * HKDF-SHA512(salt=64zeros, ikm=dh1||dh2||dh3, info="SimpleXX3DH", 96B)
 *   -> [0:32] sndHK, [32:64] rcvNextHK, [64:96] ratchetKey
 *
 * assocData = initiator_key1_raw(56B) || responder_key1_raw(56B) = 112B
 * CRITICAL: initiator (CLI) first, responder (us) second. RAW keys, NOT SPKI.
 */
export function x3dhReceiver(
  ourKey1: X448KeyPair,
  ourKey2: X448KeyPair,
  peerKey1: Uint8Array,
  peerKey2: Uint8Array
): RatchetInitParams {
  if (peerKey1.length !== X448_KEY_LEN) {
    throw new Error("peerKey1 size " + peerKey1.length + " != " + X448_KEY_LEN)
  }
  if (peerKey2.length !== X448_KEY_LEN) {
    throw new Error("peerKey2 size " + peerKey2.length + " != " + X448_KEY_LEN)
  }

  // Three DH computations (from pqX3dhRcv in Ratchet.hs)
  const dh1 = x448.scalarMult(ourKey1.privateKey, peerKey2)
  const dh2 = x448.scalarMult(ourKey2.privateKey, peerKey1)
  const dh3 = x448.scalarMult(ourKey2.privateKey, peerKey2)

  console.log("[DIAG] X3DH dh1: " + hexPrefix(dh1))
  console.log("[DIAG] X3DH dh2: " + hexPrefix(dh2))
  console.log("[DIAG] X3DH dh3: " + hexPrefix(dh3))

  // Concatenate: dhs = dh1 || dh2 || dh3 (168 bytes)
  const dhs = new Uint8Array(3 * X448_KEY_LEN)
  dhs.set(dh1, 0)
  dhs.set(dh2, X448_KEY_LEN)
  dhs.set(dh3, 2 * X448_KEY_LEN)

  // HKDF-SHA512
  const salt = new Uint8Array(X3DH_SALT_LEN)
  const output = hkdf(sha512, dhs, salt, X3DH_INFO, X3DH_OUTPUT_LEN)

  // Split: [0:32] headerKey, [32:64] nextHeaderKey, [64:96] rootKey
  const sndHK = new Uint8Array(output.slice(0, 32))
  const rcvNextHK = new Uint8Array(output.slice(32, 64))
  const ratchetKey = new Uint8Array(output.slice(64, 96))

  console.log("[DIAG] X3DH sndHK: " + hexPrefix(sndHK))
  console.log("[DIAG] X3DH rcvNextHK: " + hexPrefix(rcvNextHK))
  console.log("[DIAG] X3DH ratchetKey: " + hexPrefix(ratchetKey))

  // Associated data: initiator (CLI) key1 first, responder (us) key1 second
  // CRITICAL: RAW keys (56B), NOT SPKI (68B)
  const assocData = new Uint8Array(2 * X448_KEY_LEN)
  assocData.set(peerKey1, 0)
  assocData.set(ourKey1.publicKey, X448_KEY_LEN)

  console.log("[DIAG] X3DH assocData (112B): " + hexPrefix(assocData, 16))

  return {assocData, ratchetKey, sndHK, rcvNextHK}
}

function hexPrefix(data: Uint8Array, n = 8): string {
  const show = Math.min(n, data.length)
  return Array.from(data.slice(0, show)).map(b => b.toString(16).padStart(2, "0")).join(" ") + (data.length > show ? "..." : "")
}
