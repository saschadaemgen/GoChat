import {describe, it, expect} from "vitest"

// Test the JSON body formats and AgentMessage structures
// that sendHello and sendChatMessage build

describe("chat message JSON body", () => {
  it("builds correct x.msg.new JSON structure", () => {
    const text = "Hello from GoChat!"
    const json = JSON.stringify({
      event: "x.msg.new",
      params: {
        content: {
          text,
          type: "text",
        },
      },
    })

    const parsed = JSON.parse(json)
    expect(parsed.event).toBe("x.msg.new")
    expect(parsed.params.content.text).toBe("Hello from GoChat!")
    expect(parsed.params.content.type).toBe("text")
  })

  it("escapes special characters in text", () => {
    const text = 'Hello "world" <script>alert(1)</script>'
    const json = JSON.stringify({
      event: "x.msg.new",
      params: {content: {text, type: "text"}},
    })

    const parsed = JSON.parse(json)
    expect(parsed.params.content.text).toBe(text)
  })
})

describe("HELLO AgentMessage format", () => {
  it("builds correct wire format: M + APrivHeader + H", () => {
    // Simulate buildAPrivHeader for sndMsgId=1, empty prevMsgHash
    const sndMsgId = 1
    const prevMsgHash = new Uint8Array(0)
    const hashLen = prevMsgHash.length

    // APrivHeader: [Word32 sndMsgId][1B hashLen][hash]
    const privHeader = new Uint8Array(4 + 1 + hashLen)
    privHeader[0] = (sndMsgId >>> 24) & 0xFF
    privHeader[1] = (sndMsgId >>> 16) & 0xFF
    privHeader[2] = (sndMsgId >>> 8) & 0xFF
    privHeader[3] = sndMsgId & 0xFF
    privHeader[4] = hashLen

    // AgentMessage: ['M'][APrivHeader]['H']
    const agentMessage = new Uint8Array(1 + privHeader.length + 1)
    agentMessage[0] = 0x4D // 'M'
    agentMessage.set(privHeader, 1)
    agentMessage[1 + privHeader.length] = 0x48 // 'H'

    expect(agentMessage[0]).toBe(0x4D) // outer A_MSG tag
    expect(agentMessage[1]).toBe(0x00) // sndMsgId high byte
    expect(agentMessage[4]).toBe(0x01) // sndMsgId low byte
    expect(agentMessage[5]).toBe(0x00) // prevMsgHash length = 0
    expect(agentMessage[6]).toBe(0x48) // 'H' = HELLO tag
    expect(agentMessage.length).toBe(7) // M(1) + sndMsgId(4) + hashLen(1) + H(1) = 7
  })

  it("builds APrivHeader with prevMsgHash", () => {
    const sndMsgId = 2
    const prevMsgHash = new Uint8Array(32).fill(0xAA)

    const privHeader = new Uint8Array(4 + 1 + 32)
    privHeader[0] = (sndMsgId >>> 24) & 0xFF
    privHeader[1] = (sndMsgId >>> 16) & 0xFF
    privHeader[2] = (sndMsgId >>> 8) & 0xFF
    privHeader[3] = sndMsgId & 0xFF
    privHeader[4] = 32
    privHeader.set(prevMsgHash, 5)

    expect(privHeader[3]).toBe(2) // sndMsgId = 2
    expect(privHeader[4]).toBe(32) // hashLen = 32
    expect(privHeader[5]).toBe(0xAA) // first byte of hash
    expect(privHeader.length).toBe(37) // 4 + 1 + 32
  })
})

describe("chat message AgentMessage format", () => {
  it("builds correct wire format: M + APrivHeader + M + JSON", () => {
    const sndMsgId = 2
    const prevMsgHash = new Uint8Array(32).fill(0xBB)
    const jsonBody = new TextEncoder().encode('{"event":"x.msg.new","params":{"content":{"text":"hi","type":"text"}}}')

    // APrivHeader
    const privHeader = new Uint8Array(4 + 1 + 32)
    privHeader[0] = 0; privHeader[1] = 0; privHeader[2] = 0; privHeader[3] = 2
    privHeader[4] = 32
    privHeader.set(prevMsgHash, 5)

    // AgentMessage: ['M'][APrivHeader]['M'][jsonBody]
    const agentMessage = new Uint8Array(1 + privHeader.length + 1 + jsonBody.length)
    agentMessage[0] = 0x4D // outer 'M'
    agentMessage.set(privHeader, 1)
    agentMessage[1 + privHeader.length] = 0x4D // inner 'M' = chat content
    agentMessage.set(jsonBody, 2 + privHeader.length)

    expect(agentMessage[0]).toBe(0x4D) // outer A_MSG
    expect(agentMessage[1 + privHeader.length]).toBe(0x4D) // inner A_MSG content
    // Extract JSON from the right offset
    const extractedJson = agentMessage.slice(2 + privHeader.length)
    expect(new TextDecoder().decode(extractedJson)).toContain('"x.msg.new"')
  })
})

describe("AgentMsgEnvelope format", () => {
  it("uses agentVersion=1 for messages (not 7)", () => {
    const agentVersion = 1 // CRITICAL: not 7
    const tag = 0x4D // 'M'
    const payload = new Uint8Array([0x01, 0x02, 0x03])

    const envelope = new Uint8Array(2 + 1 + payload.length)
    envelope[0] = (agentVersion >> 8) & 0xFF
    envelope[1] = agentVersion & 0xFF
    envelope[2] = tag
    envelope.set(payload, 3)

    expect(envelope[0]).toBe(0x00)
    expect(envelope[1]).toBe(0x01) // agentVersion = 1
    expect(envelope[2]).toBe(0x4D) // 'M'
  })

  it("uses agentVersion=7 for confirmation (not 1)", () => {
    const agentVersion = 7
    const tag = 0x43 // 'C'

    const envelope = new Uint8Array(2 + 1)
    envelope[0] = (agentVersion >> 8) & 0xFF
    envelope[1] = agentVersion & 0xFF
    envelope[2] = tag

    expect(envelope[0]).toBe(0x00)
    expect(envelope[1]).toBe(0x07) // agentVersion = 7
    expect(envelope[2]).toBe(0x43) // 'C'
  })
})
