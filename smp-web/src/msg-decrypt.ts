// MSG body decryption for server-to-recipient messages.
//
// When the server delivers a MSG, the body is encrypted with:
//   cbEncryptMaxLenBS(rcvDhSecret, cbNonce(msgId), paddedBody)
// where rcvDhSecret = X25519 DH(serverDhPrivKey, recipientDhPubKey).
//
// Decryption uses nacl.box.open (DH + HSalsa20 + XSalsa20-Poly1305).

import nacl from "tweetnacl"

// -- MSG body decryption

/**
 * Decrypt a MSG body from the server.
 *
 * @param encBody - encrypted body from MSG response
 * @param msgId - 24-byte message ID (used as nonce)
 * @param serverDhPubKeyRaw - 32-byte raw X25519 server DH public key (from IDS)
 * @param recipientDhPrivKeyRaw - 32-byte raw X25519 recipient DH private key
 * @returns decrypted padded body, or null if decryption fails
 */
export function decryptMsgBody(
  encBody: Uint8Array,
  msgId: Uint8Array,
  serverDhPubKeyRaw: Uint8Array,
  recipientDhPrivKeyRaw: Uint8Array
): Uint8Array | null {
  return nacl.box.open(encBody, msgId, serverDhPubKeyRaw, recipientDhPrivKeyRaw)
}

// -- RcvMsgBody parsing

export interface ReceivedMessage {
  msgTs: {seconds: number; nanoseconds: number}
  msgFlags: number
  msgBody: Uint8Array // the original SEND body (smpEncConfirmation)
}

/**
 * Parse a decrypted RcvMsgBody.
 *
 * Format:
 *   [8 bytes] msgTs: SystemTime (2x Word32 BE: seconds + nanoseconds)
 *   [1 byte]  msgFlags: notification flag
 *   [1 byte]  space (0x20)
 *   [variable] msgBody: the original SEND body
 *   [padding]  '#' (0x23) bytes
 */
export function parseRcvMsgBody(decrypted: Uint8Array): ReceivedMessage {
  const seconds = ((decrypted[0] << 24) | (decrypted[1] << 16) | (decrypted[2] << 8) | decrypted[3]) >>> 0
  const nanoseconds = ((decrypted[4] << 24) | (decrypted[5] << 16) | (decrypted[6] << 8) | decrypted[7]) >>> 0
  const msgFlags = decrypted[8]
  // byte 9 = space (0x20)
  const bodyStart = 10
  // Strip trailing '#' padding
  let bodyEnd = decrypted.length
  while (bodyEnd > bodyStart && decrypted[bodyEnd - 1] === 0x23) {
    bodyEnd--
  }
  return {
    msgTs: {seconds, nanoseconds},
    msgFlags,
    msgBody: decrypted.subarray(bodyStart, bodyEnd),
  }
}

// -- Key extraction helper

/**
 * Extract raw 32-byte X25519 key from SPKI (44 bytes) or return as-is if already raw.
 */
export function extractRawX25519(key: Uint8Array): Uint8Array {
  if (key.length === 44) return key.subarray(12)
  if (key.length === 32) return key
  throw new Error("unexpected X25519 key length: " + key.length)
}
