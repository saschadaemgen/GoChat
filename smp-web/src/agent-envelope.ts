// Agent confirmation envelope encoding (AgentMsgEnvelope).
//
// Builds the AgentConfirmation body that wraps connInfo with
// e2eEncryption_ parameters (X448 keys for the Double Ratchet).
//
// Layout (from SimpleGo protocol team):
//   [2 bytes]  agentVersion = 7 (BE: 0x00 0x07)
//   [1 byte]   'C' (0x43) = Confirmation tag
//   [1 byte]   0x31 = Just (e2eEncryption_ present)
//     [2 bytes]  e2eVersion = 2 (BE: 0x00 0x02)
//     [1 byte]   len = 68 (0x44)
//     [68 bytes] X448 SPKI DER Key1 (Bob's ratchet public key)
//     [1 byte]   len = 68 (0x44)
//     [68 bytes] X448 SPKI DER Key2 (Bob's ephemeral public key)
//   [REST]     encConnInfo (tail - NO length prefix)

// -- Types

export interface AgentConfirmationParams {
  /** Bob's X448 ratchet public key in SPKI DER (68 bytes) */
  ratchetPublicKeySPKI: Uint8Array
  /** Bob's X448 ephemeral public key in SPKI DER (68 bytes) */
  ephemeralPublicKeySPKI: Uint8Array
  /** connInfo payload (variable length) */
  encryptedConnInfo: Uint8Array
}

// -- Builder

/**
 * Build the complete agent confirmation body.
 *
 * Fixed overhead: 2+1+1+2+1+68+1+68 = 144 bytes + encConnInfo
 */
export function buildAgentConfirmation(params: AgentConfirmationParams): Uint8Array {
  const {ratchetPublicKeySPKI, ephemeralPublicKeySPKI, encryptedConnInfo} = params

  const fixedSize = 144
  const total = fixedSize + encryptedConnInfo.length
  const buf = new Uint8Array(total)
  let offset = 0

  // agentVersion = 7 (BE Word16)
  buf[offset++] = 0x00
  buf[offset++] = 0x07

  // 'C' = Confirmation tag
  buf[offset++] = 0x43

  // Just (e2eEncryption_ present)
  buf[offset++] = 0x31 // '1' = Just tag

  // e2eVersion = 2 (BE Word16) - per SimpleGo protocol team
  buf[offset++] = 0x00
  buf[offset++] = 0x02

  // Key1: 1-byte length prefix + 68 bytes SPKI
  buf[offset++] = 68 // 0x44
  buf.set(ratchetPublicKeySPKI, offset)
  offset += 68

  // Key2: 1-byte length prefix + 68 bytes SPKI
  buf[offset++] = 68 // 0x44
  buf.set(ephemeralPublicKeySPKI, offset)
  offset += 68

  // encConnInfo (tail - NO length prefix)
  buf.set(encryptedConnInfo, offset)

  return buf
}
