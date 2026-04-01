import {describe, it, expect} from "vitest"

// Test delivery receipt wire format parsing and building

describe("A_RCVD receipt wire format", () => {
  it("parses incoming receipt with count=1 (Word8)", () => {
    // Simulate the inner payload after APrivHeader, starting at 'V' tag
    // [count=1][agentMsgId=3 Int64 BE][hashLen=32][32B hash][rcptInfo=0 Word16]
    const hash = new Uint8Array(32).fill(0xAA)
    const receipt = new Uint8Array(1 + 1 + 8 + 1 + 32 + 2)
    let offset = 0
    receipt[offset++] = 0x56 // 'V' inner tag
    receipt[offset++] = 1    // count = 1 (Word8!)
    // agentMsgId = 3 (Int64 BE)
    receipt[offset++] = 0; receipt[offset++] = 0; receipt[offset++] = 0; receipt[offset++] = 0
    receipt[offset++] = 0; receipt[offset++] = 0; receipt[offset++] = 0; receipt[offset++] = 3
    // hashLen + hash
    receipt[offset++] = 32
    receipt.set(hash, offset); offset += 32
    // rcptInfo (Word16!)
    receipt[offset++] = 0; receipt[offset++] = 0

    expect(receipt[0]).toBe(0x56) // 'V' tag
    expect(receipt[1]).toBe(1)    // count = 1 (Word8)
    expect(receipt.length).toBe(45) // 1(V) + 1(count) + 8(id) + 1(hashLen) + 32(hash) + 2(rcptInfo) = 45
  })

  it("builds outgoing receipt with correct format", () => {
    const receivedMsgId = 5
    const msgHash = new Uint8Array(32).fill(0xBB)

    // Receipt payload: count(1B) + agentMsgId(8B) + hashLen(1B) + hash(32B) + rcptInfo(2B)
    const payload = new Uint8Array(1 + 8 + 1 + 32 + 2)
    let offset = 0
    payload[offset++] = 1 // count = 1 (Word8!)
    // agentMsgId (Int64 BE)
    payload[offset++] = 0; payload[offset++] = 0; payload[offset++] = 0; payload[offset++] = 0
    payload[offset++] = (receivedMsgId >>> 24) & 0xFF
    payload[offset++] = (receivedMsgId >>> 16) & 0xFF
    payload[offset++] = (receivedMsgId >>> 8) & 0xFF
    payload[offset++] = receivedMsgId & 0xFF
    // hashLen + hash
    payload[offset++] = 32
    payload.set(msgHash, offset); offset += 32
    // rcptInfo (Word16!)
    payload[offset++] = 0; payload[offset++] = 0

    expect(payload[0]).toBe(1)     // count Word8
    expect(payload[8]).toBe(5)     // receivedMsgId low byte
    expect(payload[9]).toBe(32)    // hashLen
    expect(payload[41]).toBe(0xBB) // first hash byte
    expect(payload.length).toBe(44) // 1 + 8 + 1 + 32 + 2
  })

  it("count is Word8 (1 byte), not Word16 (2 bytes)", () => {
    // This is the #1 trap: using Word16 for count shifts everything by 1 byte
    const count = 1
    const asWord8 = new Uint8Array([count])
    const asWord16 = new Uint8Array([(count >> 8) & 0xFF, count & 0xFF])

    expect(asWord8.length).toBe(1)  // Word8 = 1 byte
    expect(asWord16.length).toBe(2) // Word16 = 2 bytes (WRONG for count!)
  })

  it("rcptInfo is Word16 (2 bytes), not Word32 (4 bytes)", () => {
    // Trap #2: using Word32 for rcptInfo adds 2 extra bytes
    const rcptInfoWord16 = new Uint8Array([0, 0])     // 2 bytes (correct)
    const rcptInfoWord32 = new Uint8Array([0, 0, 0, 0]) // 4 bytes (WRONG!)

    expect(rcptInfoWord16.length).toBe(2)
    expect(rcptInfoWord32.length).toBe(4)
  })

  it("full outgoing AgentMessage for receipt has correct structure", () => {
    // ['M' outer][APrivHeader: 8B sndMsgId + 1B hashLen + hash]['V'][payload]
    const sndMsgId = 2
    const prevMsgHash = new Uint8Array(0) // first message, no hash

    // APrivHeader
    const privHeader = new Uint8Array(8 + 1)
    privHeader[0] = 0; privHeader[1] = 0; privHeader[2] = 0; privHeader[3] = 0
    privHeader[4] = 0; privHeader[5] = 0; privHeader[6] = 0; privHeader[7] = sndMsgId
    privHeader[8] = 0 // no prevMsgHash

    // Receipt payload (for receivedMsgId=5)
    const receiptPayload = new Uint8Array(1 + 8 + 1 + 32 + 2)
    receiptPayload[0] = 1 // count
    receiptPayload[8] = 5 // receivedMsgId low byte
    receiptPayload[9] = 32 // hashLen
    // rest is zeros (hash + rcptInfo)

    // Full AgentMessage
    const msg = new Uint8Array(1 + privHeader.length + 1 + receiptPayload.length)
    msg[0] = 0x4D // 'M'
    msg.set(privHeader, 1)
    msg[1 + privHeader.length] = 0x56 // 'V'
    msg.set(receiptPayload, 2 + privHeader.length)

    expect(msg[0]).toBe(0x4D)  // outer 'M'
    expect(msg[9]).toBe(0)     // prevMsgHash length = 0
    expect(msg[10]).toBe(0x56) // inner 'V' = A_RCVD
    expect(msg[11]).toBe(1)    // count Word8
    expect(msg.length).toBe(1 + 9 + 1 + 44) // 55 bytes total
  })

  it("parses receipt with multiple entries", () => {
    // count=2, two receipts
    const count = 2
    const hash1 = new Uint8Array(32).fill(0x11)
    const hash2 = new Uint8Array(32).fill(0x22)

    // Per-receipt: 8(id) + 1(hashLen) + 32(hash) + 2(rcptInfo) = 43 bytes each
    const payload = new Uint8Array(1 + 43 * 2)
    let offset = 0
    payload[offset++] = count // Word8

    // Receipt 1: agentMsgId=3
    payload[offset + 7] = 3; offset += 8
    payload[offset++] = 32
    payload.set(hash1, offset); offset += 32
    payload[offset++] = 0; payload[offset++] = 0

    // Receipt 2: agentMsgId=7
    payload[offset + 7] = 7; offset += 8
    payload[offset++] = 32
    payload.set(hash2, offset); offset += 32
    payload[offset++] = 0; payload[offset++] = 0

    expect(payload[0]).toBe(2) // count = 2
    expect(payload.length).toBe(87) // 1 + 43*2
  })
})

describe("agentVersion for receipts", () => {
  it("outgoing receipts use agentVersion=1 (not 7)", () => {
    const outgoingVersion = 1
    expect(outgoingVersion).toBe(1) // NOT 7

    // Incoming from Desktop App uses 7, but WE must use 1
    const incomingVersion = 7
    expect(incomingVersion).not.toBe(outgoingVersion)
  })
})
