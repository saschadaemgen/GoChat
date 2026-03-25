// Agent confirmation envelope encoding.
//
// Builds the AgentConfirmation body that wraps the ratchet-encrypted
// connInfo with e2eEncryption_ parameters (X448 keys for the Double Ratchet).
//
// Layout:
//   [2 bytes]  agentVersion = 7 (BE: 0x00 0x07)
//   [1 byte]   'C' (0x43) = Confirmation tag
//   [1 byte]   0x31 = Just (e2eEncryption_ present)
//     [2 bytes]  e2e version min = 3 (BE: 0x00 0x03)
//     [2 bytes]  e2e version max = 3 (BE: 0x00 0x03)
//     [2 bytes]  length prefix for Key1 = 68 (BE: 0x00 0x44)
//     [68 bytes] X448 SPKI DER Key1 (Bob's ratchet public key)
//     [2 bytes]  length prefix for Key2 = 68 (BE: 0x00 0x44)
//     [68 bytes] X448 SPKI DER Key2 (Bob's ephemeral public key)
//     [1 byte]   0x00 = Nothing (no KEM key)
//   [variable] encConnInfo (ratchet-encrypted payload)

// -- Types

export interface AgentConfirmationParams {
  /** Bob's X448 ratchet public key in SPKI DER (68 bytes) */
  ratchetPublicKeySPKI: Uint8Array
  /** Bob's X448 ephemeral public key in SPKI DER (68 bytes) */
  ephemeralPublicKeySPKI: Uint8Array
  /** Ratchet-encrypted connInfo (variable length) */
  encryptedConnInfo: Uint8Array
}

// -- Builder

/**
 * Build the complete agent confirmation body.
 *
 * Fixed overhead: 2+1+1+2+2+2+68+2+68+1 = 149 bytes + encConnInfo
 */
export function buildAgentConfirmation(params: AgentConfirmationParams): Uint8Array {
  const {ratchetPublicKeySPKI, ephemeralPublicKeySPKI, encryptedConnInfo} = params

  const fixedSize = 149
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

  // e2e version range: min=3, max=3
  buf[offset++] = 0x00
  buf[offset++] = 0x03
  buf[offset++] = 0x00
  buf[offset++] = 0x03

  // Key1 length prefix (68 = 0x0044)
  buf[offset++] = 0x00
  buf[offset++] = 0x44
  // Key1 data (68 bytes)
  buf.set(ratchetPublicKeySPKI, offset)
  offset += 68

  // Key2 length prefix (68 = 0x0044)
  buf[offset++] = 0x00
  buf[offset++] = 0x44
  // Key2 data (68 bytes)
  buf.set(ephemeralPublicKeySPKI, offset)
  offset += 68

  // No KEM key (Nothing)
  buf[offset++] = 0x00

  // encConnInfo (variable)
  buf.set(encryptedConnInfo, offset)

  return buf
}
