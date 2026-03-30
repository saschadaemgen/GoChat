// Layer 1 NaCl decryption for smpEncConfirmation.
//
// The smpEncConfirmation is the outer envelope that the CLI sends via SEND.
// It is encrypted with nacl.box (X25519 DH + HSalsa20 + XSalsa20-Poly1305).
//
// Structure:
//   [2B smpVersion][1B Maybe tag '1'][1B keyLen=44][44B X25519 SPKI][24B nonce][encBody]

import nacl from "tweetnacl"

// -- Parse smpEncConfirmation envelope

export interface SmpEncConfirmation {
  smpVersion: number
  aliceDhPublicKeyRaw: Uint8Array  // 32 bytes raw X25519
  nonce: Uint8Array                 // 24 bytes
  encryptedBody: Uint8Array         // rest (includes 16B Poly1305 tag)
}

export function parseSmpEncConfirmation(data: Uint8Array): SmpEncConfirmation {
  let offset = 0

  const smpVersion = (data[offset] << 8) | data[offset + 1]
  offset += 2

  const maybeTag = data[offset]
  offset += 1

  let aliceDhPublicKeyRaw: Uint8Array
  if (maybeTag === 0x31) { // '1' = Just (key follows)
    const keyLen = data[offset]
    offset += 1
    const keySpki = data.subarray(offset, offset + keyLen)
    offset += keyLen
    aliceDhPublicKeyRaw = keySpki.length === 44 ? keySpki.subarray(12) : keySpki
  } else {
    throw new Error("smpEncConfirmation: no DH key (tag=0x" + maybeTag.toString(16) + ")")
  }

  const nonce = data.subarray(offset, offset + 24)
  offset += 24

  const encryptedBody = data.subarray(offset)

  return {smpVersion, aliceDhPublicKeyRaw, nonce, encryptedBody}
}

// -- Layer 1 NaCl decryption

export function decryptLayer1(
  envelope: SmpEncConfirmation,
  e2eDhPrivateKey: Uint8Array
): Uint8Array | null {
  const decrypted = nacl.box.open(
    envelope.encryptedBody,
    envelope.nonce,
    envelope.aliceDhPublicKeyRaw,
    e2eDhPrivateKey
  )
  if (!decrypted) return null

  // Unpad: 2-byte BE length prefix + content + '#' padding
  const contentLen = (decrypted[0] << 8) | decrypted[1]
  return decrypted.subarray(2, 2 + contentLen)
}

// -- Parse smpConfirmation (inside Layer 1)

export interface SmpConfirmation {
  senderAuthKeySPKI: Uint8Array | null  // 44 bytes Ed25519 SPKI, or null
  agentConfirmation: Uint8Array          // rest
}

export function parseSmpConfirmation(data: Uint8Array): SmpConfirmation {
  let offset = 0
  const tag = data[offset]
  offset += 1

  let senderAuthKeySPKI: Uint8Array | null = null
  if (tag === 0x4B) { // 'K' = sender key follows
    const keyLen = data[offset]
    offset += 1
    senderAuthKeySPKI = data.subarray(offset, offset + keyLen)
    offset += keyLen
  } else if (tag === 0x5F) { // '_' = no sender key
    // nothing
  } else {
    throw new Error("smpConfirmation: unknown tag 0x" + tag.toString(16))
  }

  return {
    senderAuthKeySPKI,
    agentConfirmation: data.subarray(offset),
  }
}
