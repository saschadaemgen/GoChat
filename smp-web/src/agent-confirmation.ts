// AgentConfirmation parser for Season 9.
//
// Parses the decrypted Layer 1 payload into structured data.
// Reference: Simplex.Messaging.Agent.Protocol (AgentMsgEnvelope)
// Reference: Simplex.Messaging.Crypto.Ratchet (E2ERatchetParams)
// Reference: SimpleGo WIRE_FORMAT.md (confirmed byte layouts)

// --- Types ---

export interface E2ERatchetParams {
  /** E2E encryption version (2 = kdfX3DH, 3 = pqRatchet) */
  e2eVersion: number
  /** First X448 public key - SPKI DER encoded (68 bytes) */
  key1Spki: Uint8Array
  /** First X448 public key - raw 56 bytes */
  key1Raw: Uint8Array
  /** Second X448 public key - SPKI DER encoded (68 bytes) */
  key2Spki: Uint8Array
  /** Second X448 public key - raw 56 bytes */
  key2Raw: Uint8Array
  /** KEM parameters (only present if e2eVersion >= 3) */
  kemParams?: KemParams
}

export interface KemParams {
  type: "proposed" | "accepted"
  /** KEM public key (for 'proposed' and 'accepted') */
  publicKey: Uint8Array
  /** KEM ciphertext (only for 'accepted') */
  ciphertext?: Uint8Array
}

export interface ParsedAgentConfirmation {
  /** Agent protocol version */
  agentVersion: number
  /** E2E ratchet parameters (CLI's X448 keys) */
  e2eEncryption: E2ERatchetParams
  /** Ratchet-encrypted connInfo (for Phase 3 decryption) */
  encConnInfo: Uint8Array
}

// --- Constants ---

const X448_SPKI_SIZE = 68
const X448_RAW_SIZE = 56
const X448_RAW_OFFSET = 12
const PQ_RATCHET_VERSION = 3

// --- Main Parser ---

export function parseAgentConfirmation(data: Uint8Array): ParsedAgentConfirmation {
  let offset = 0

  // 1. agentVersion (Word16 BE)
  const agentVersion = (data[offset] << 8) | data[offset + 1]
  offset += 2
  console.log("[DIAG] agentVersion: " + agentVersion)

  // 2. Tag byte - must be 'C' (0x43)
  const tag = data[offset]
  offset += 1
  if (tag !== 0x43) {
    throw new Error("Expected AgentConfirmation tag 'C' (0x43), got 0x" + tag.toString(16))
  }
  console.log("[DIAG] tag: 'C' (AgentConfirmation)")

  // 3. Maybe E2ERatchetParams - ASCII '0' = Nothing, '1' = Just
  const maybeByte = data[offset]
  offset += 1

  if (maybeByte === 0x30) {
    throw new Error("AgentConfirmation has no e2eEncryption (Nothing) - cannot do X3DH")
  }
  if (maybeByte !== 0x31) {
    throw new Error("Expected Maybe '0' (0x30) or '1' (0x31), got 0x" + maybeByte.toString(16))
  }
  console.log("[DIAG] e2eEncryption: Just (present)")

  // 4. Parse E2ERatchetParams

  // 4a. e2eVersion (Word16 BE)
  const e2eVersion = (data[offset] << 8) | data[offset + 1]
  offset += 2
  console.log("[DIAG] e2eVersion: " + e2eVersion)

  // 4b. First X448 SPKI key (1-byte length prefix, CONFIRMED by SimpleGo team)
  const key1Len = data[offset]
  offset += 1
  if (key1Len !== X448_SPKI_SIZE) {
    throw new Error("key1 SPKI length " + key1Len + " != expected " + X448_SPKI_SIZE)
  }
  const key1Spki = data.slice(offset, offset + key1Len)
  offset += key1Len
  validateSpkiX448(key1Spki, "key1")
  const key1Raw = key1Spki.slice(X448_RAW_OFFSET, X448_RAW_OFFSET + X448_RAW_SIZE)

  // 4c. Second X448 SPKI key (1-byte length prefix, CONFIRMED)
  const key2Len = data[offset]
  offset += 1
  if (key2Len !== X448_SPKI_SIZE) {
    throw new Error("key2 SPKI length " + key2Len + " != expected " + X448_SPKI_SIZE)
  }
  const key2Spki = data.slice(offset, offset + key2Len)
  offset += key2Len
  validateSpkiX448(key2Spki, "key2")
  const key2Raw = key2Spki.slice(X448_RAW_OFFSET, X448_RAW_OFFSET + X448_RAW_SIZE)

  console.log("[DIAG] key1Raw: " + hexPrefix(key1Raw))
  console.log("[DIAG] key2Raw: " + hexPrefix(key2Raw))

  // 4d. KEM params (only if e2eVersion >= 3)
  let kemParams: KemParams | undefined
  if (e2eVersion >= PQ_RATCHET_VERSION) {
    const kemResult = parseMaybeKemParams(data, offset)
    kemParams = kemResult.params
    offset = kemResult.newOffset
    console.log("[DIAG] KEM: " + (kemParams ? kemParams.type : "Nothing"))
  }

  const e2eEncryption: E2ERatchetParams = {
    e2eVersion,
    key1Spki, key1Raw,
    key2Spki, key2Raw,
    kemParams,
  }

  // 5. encConnInfo = everything remaining (Tail - NO length prefix!)
  const encConnInfo = data.slice(offset)
  console.log("[DIAG] encConnInfo: " + encConnInfo.length + " bytes (starts: " + hexPrefix(encConnInfo) + ")")

  return {agentVersion, e2eEncryption, encConnInfo}
}

// --- Helpers ---

function validateSpkiX448(spki: Uint8Array, label: string): void {
  if (spki[0] !== 0x30 || spki[1] !== 0x42) {
    throw new Error(label + ": Bad SPKI header, expected 30 42, got " + hexBytes(spki, 0, 2))
  }
  if (spki[4] !== 0x06 || spki[5] !== 0x03 || spki[6] !== 0x2b || spki[7] !== 0x65 || spki[8] !== 0x6f) {
    throw new Error(label + ": Bad OID, expected 06 03 2b 65 6f (X448), got " + hexBytes(spki, 4, 5))
  }
}

/**
 * Read SMP length-prefixed field.
 * Standard: 1-byte length for values <= 254
 * Large: 0xFF marker + Word16 BE for values > 254
 */
function readLengthPrefixed(
  data: Uint8Array, offset: number
): {value: Uint8Array; newOffset: number} {
  let len: number
  if (data[offset] === 0xff) {
    offset += 1
    len = (data[offset] << 8) | data[offset + 1]
    offset += 2
  } else {
    len = data[offset]
    offset += 1
  }
  const value = data.slice(offset, offset + len)
  return {value, newOffset: offset + len}
}

function parseMaybeKemParams(
  data: Uint8Array, offset: number
): {params?: KemParams; newOffset: number} {
  const maybeByte = data[offset]
  offset += 1

  if (maybeByte === 0x30) { // '0' = Nothing
    return {params: undefined, newOffset: offset}
  }

  if (maybeByte !== 0x31) { // '1' = Just
    throw new Error("KEM Maybe: expected '0'/'1', got 0x" + maybeByte.toString(16))
  }

  const kemTag = data[offset]
  offset += 1

  if (kemTag === 0x50) { // 'P' = Proposed: length-prefixed KEMPublicKey
    const keyResult = readLengthPrefixed(data, offset)
    console.log("[DIAG] KEM Proposed: key " + keyResult.value.length + " bytes")
    return {params: {type: "proposed", publicKey: keyResult.value}, newOffset: keyResult.newOffset}
  }

  if (kemTag === 0x41) { // 'A' = Accepted: length-prefixed ciphertext + key
    const ctResult = readLengthPrefixed(data, offset)
    const keyResult = readLengthPrefixed(data, ctResult.newOffset)
    console.log("[DIAG] KEM Accepted: ct " + ctResult.value.length + "B, key " + keyResult.value.length + "B")
    return {
      params: {type: "accepted", publicKey: keyResult.value, ciphertext: ctResult.value},
      newOffset: keyResult.newOffset,
    }
  }

  throw new Error("KEM tag: expected 'P' (0x50) or 'A' (0x41), got 0x" + kemTag.toString(16))
}

function hexBytes(data: Uint8Array, offset: number, count: number): string {
  return Array.from(data.slice(offset, offset + count)).map(b => b.toString(16).padStart(2, "0")).join(" ")
}

function hexPrefix(data: Uint8Array, n = 8): string {
  const show = Math.min(n, data.length)
  return hexBytes(data, 0, show) + (data.length > show ? "..." : "")
}
