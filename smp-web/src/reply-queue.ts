// Parse AgentConnInfoReply ('D' tag) to extract the CLI's reply queue info.
//
// Wire format (from Haskell smpEncode):
//   AgentConnInfoReply smpQueues cInfo -> smpEncode ('D', smpQueues, Tail cInfo)
//
// smpQueues = NonEmpty SMPQueueInfo:
//   [1B count] [SMPQueueInfo_1] [SMPQueueInfo_2] ...
//
// SMPQueueInfo:
//   [2B clientVersion Word16 BE]
//   [SMPServer] [senderId] [dhPublicKey] [sndSecure]
//
// SMPServer (ProtocolServer):
//   [NonEmpty TransportHost] [port] [keyHash]
//   where NonEmpty = [1B count] [1B+N host1] [1B+N host2] ...
//   port = [1B len][string bytes]
//   keyHash = [1B len][32B hash]
//
// connInfo = Tail (everything remaining after parsing all queues)

function toHex(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += (b < 16 ? "0" : "") + b.toString(16)
  return s
}

// --- Types ---

export interface ReplyQueueInfo {
  clientVersion: number
  serverHosts: string[]
  serverPort: string
  keyHash: Uint8Array
  senderId: Uint8Array
  dhPublicKeySpki: Uint8Array
  dhPublicKeyRaw: Uint8Array
  sndSecure: boolean
}

export interface AgentConnInfoReply {
  queues: ReplyQueueInfo[]
  connInfo: Uint8Array
}

// --- Parser ---

function readByte(data: Uint8Array, offset: number): {value: number; newOffset: number} {
  return {value: data[offset], newOffset: offset + 1}
}

function readWord16BE(data: Uint8Array, offset: number): {value: number; newOffset: number} {
  const value = (data[offset] << 8) | data[offset + 1]
  return {value, newOffset: offset + 2}
}

function readLenPrefixed(data: Uint8Array, offset: number): {value: Uint8Array; newOffset: number} {
  const len = data[offset]
  offset += 1
  const value = data.slice(offset, offset + len)
  return {value, newOffset: offset + len}
}

function readLenPrefixedString(data: Uint8Array, offset: number): {value: string; newOffset: number} {
  const {value, newOffset} = readLenPrefixed(data, offset)
  let s = ""
  for (const b of value) s += String.fromCharCode(b)
  return {value: s, newOffset}
}

/**
 * Parse a single SMPServer (ProtocolServer) from the wire.
 * Format: [NonEmpty hosts][port][keyHash]
 */
function parseSMPServer(
  data: Uint8Array, offset: number
): {hosts: string[]; port: string; keyHash: Uint8Array; newOffset: number} {
  // NonEmpty TransportHost: [1B count][hosts...]
  const hostCount = data[offset]
  offset += 1
  console.log("[DIAG] SMPServer: hostCount=" + hostCount)

  const hosts: string[] = []
  for (let i = 0; i < hostCount; i++) {
    const {value: host, newOffset} = readLenPrefixedString(data, offset)
    hosts.push(host)
    offset = newOffset
    console.log("[DIAG] SMPServer: host[" + i + "]=" + host)
  }

  // Port: 1-byte length prefixed string
  const {value: port, newOffset: afterPort} = readLenPrefixedString(data, offset)
  offset = afterPort
  console.log("[DIAG] SMPServer: port=" + port)

  // KeyHash: 1-byte length prefixed bytes (typically 32B SHA-256)
  const {value: keyHash, newOffset: afterHash} = readLenPrefixed(data, offset)
  offset = afterHash
  console.log("[DIAG] SMPServer: keyHash=" + keyHash.length + "B")

  return {hosts, port, keyHash, newOffset: offset}
}

/**
 * Parse a single SMPQueueInfo from the wire.
 * Format: [2B clientVersion][SMPServer][senderId][dhPublicKey][sndSecure]
 */
function parseSMPQueueInfo(
  data: Uint8Array, offset: number
): {queue: ReplyQueueInfo; newOffset: number} {
  // clientVersion: Word16 BE
  const {value: clientVersion, newOffset: afterVersion} = readWord16BE(data, offset)
  offset = afterVersion
  console.log("[DIAG] SMPQueueInfo: clientVersion=" + clientVersion)

  // SMPServer
  const server = parseSMPServer(data, offset)
  offset = server.newOffset

  // senderId: 1-byte length prefixed
  const {value: senderId, newOffset: afterSenderId} = readLenPrefixed(data, offset)
  offset = afterSenderId
  console.log("[DIAG] SMPQueueInfo: senderId=" + senderId.length + "B (" + toHex(senderId) + ")")

  // dhPublicKey: 1-byte length prefixed (44B SPKI or 32B raw)
  const {value: dhPublicKeySpki, newOffset: afterDhKey} = readLenPrefixed(data, offset)
  offset = afterDhKey
  const dhPublicKeyRaw = dhPublicKeySpki.length === 44 ? dhPublicKeySpki.slice(12) : dhPublicKeySpki
  console.log("[DIAG] SMPQueueInfo: dhPublicKey=" + dhPublicKeySpki.length + "B SPKI, " + dhPublicKeyRaw.length + "B raw")

  // sndSecure: Bool ('T' or 'F')
  const sndSecureByte = data[offset]
  offset += 1
  const sndSecure = sndSecureByte === 0x54 // 'T'
  console.log("[DIAG] SMPQueueInfo: sndSecure=" + sndSecure + " (0x" + sndSecureByte.toString(16) + ")")

  return {
    queue: {
      clientVersion,
      serverHosts: server.hosts,
      serverPort: server.port,
      keyHash: server.keyHash,
      senderId,
      dhPublicKeySpki,
      dhPublicKeyRaw,
      sndSecure,
    },
    newOffset: offset,
  }
}

/**
 * Parse AgentConnInfoReply to extract reply queue info and connInfo.
 *
 * Input: the full AgentMessage bytes starting with 'D' tag (0x44).
 * Returns parsed queue(s) and the remaining connInfo (Tail).
 */
export function parseAgentConnInfoReply(data: Uint8Array): AgentConnInfoReply {
  let offset = 0

  // Tag: 'D' (0x44)
  const tag = data[offset]
  offset += 1
  if (tag !== 0x44) {
    throw new Error("Expected AgentConnInfoReply tag 'D' (0x44), got 0x" + tag.toString(16))
  }

  // NonEmpty SMPQueueInfo: [1B count][items...]
  const queueCount = data[offset]
  offset += 1
  console.log("[DIAG] AgentConnInfoReply: queueCount=" + queueCount)

  const queues: ReplyQueueInfo[] = []
  for (let i = 0; i < queueCount; i++) {
    console.log("[DIAG] Parsing queue " + (i + 1) + "/" + queueCount + " at offset " + offset)
    const {queue, newOffset} = parseSMPQueueInfo(data, offset)
    queues.push(queue)
    offset = newOffset
  }

  // Tail: everything remaining is connInfo
  const connInfo = data.slice(offset)
  console.log("[DIAG] AgentConnInfoReply: connInfo=" + connInfo.length + "B at offset " + offset)

  // Try to decode connInfo as text for logging
  try {
    const text = new TextDecoder().decode(connInfo)
    const jsonStart = text.indexOf("{")
    if (jsonStart >= 0) {
      console.log("[DIAG] ConnInfo JSON: " + text.substring(jsonStart, jsonStart + 200))
    }
  } catch (_) {}

  return {queues, connInfo}
}
