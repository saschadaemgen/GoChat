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
 *   [8 bytes]  Int64 seconds (BE)
 *   [4 bytes]  Word32 nanoseconds (BE)
 *   [1 byte]   MsgFlags (Bool: 'T'=0x54 or 'F'=0x46)
 *   [1 byte]   space (0x20)
 *   [variable] msgBody: the original SEND body
 *   [padding]  '#' (0x23) bytes
 *
 * Total header: 14 bytes (not 10 - timestamp is Int64 + Word32 = 12 bytes)
 */
export function parseRcvMsgBody(decrypted: Uint8Array): ReceivedMessage {
  // Int64 seconds (8 bytes BE) - read as two Word32 for JS compatibility
  const secondsHi = ((decrypted[0] << 24) | (decrypted[1] << 16) | (decrypted[2] << 8) | decrypted[3]) >>> 0
  const secondsLo = ((decrypted[4] << 24) | (decrypted[5] << 16) | (decrypted[6] << 8) | decrypted[7]) >>> 0
  const seconds = secondsHi * 0x100000000 + secondsLo
  // Word32 nanoseconds (4 bytes BE)
  const nanoseconds = ((decrypted[8] << 24) | (decrypted[9] << 16) | (decrypted[10] << 8) | decrypted[11]) >>> 0
  // MsgFlags (1 byte) + space (1 byte)
  const msgFlags = decrypted[12]
  // byte 13 = space (0x20)
  const bodyStart = 14
  // Strip trailing '#' padding
  let bodyEnd = decrypted.length
  while (bodyEnd > bodyStart && decrypted[bodyEnd - 1] === 0x23) {
    bodyEnd--
  }
  const msgBody = decrypted.subarray(bodyStart, bodyEnd)
  console.log("[SMP] parseRcvMsgBody: msgBody first 20B:", Array.from(msgBody.subarray(0, Math.min(20, msgBody.length))).map(b => b.toString(16).padStart(2, "0")).join(" "))
  return {
    msgTs: {seconds, nanoseconds},
    msgFlags,
    msgBody,
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
