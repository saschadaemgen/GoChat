import {describe, it, expect} from "vitest"
import {
  encodeNEW,
  encodeSUB,
  encodeKEY,
  encodeSKEY,
  encodeSEND,
  encodeACK,
  encodeDEL,
  encodeOFF,
  encodeGET,
  encodeNKEY,
  encodeNDEL,
  encodeNSUB,
  encodePING,
  encodeQUE,
} from "../commands.js"
import type {
  NewQueueParams,
  SendParams,
  EnableNotificationsParams,
} from "../commands.js"

// -- Helpers

function toAscii(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return s
}

function extractTag(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) {
    if (b === 0x20) break // stop at first space
    s += String.fromCharCode(b)
  }
  return s
}

// Fake 44-byte SPKI DER key (Ed25519 or X25519)
function fakeKey(fill: number): Uint8Array {
  return new Uint8Array(44).fill(fill)
}

// -- Tag-only command tests

describe("tag-only commands", () => {
  it("encodeSUB produces ASCII 'SUB' (3 bytes)", () => {
    const result = encodeSUB()
    expect(result.length).toBe(3)
    expect(toAscii(result)).toBe("SUB")
  })

  it("encodeDEL produces ASCII 'DEL' (3 bytes)", () => {
    const result = encodeDEL()
    expect(result.length).toBe(3)
    expect(toAscii(result)).toBe("DEL")
  })

  it("encodeOFF produces ASCII 'OFF' (3 bytes)", () => {
    const result = encodeOFF()
    expect(result.length).toBe(3)
    expect(toAscii(result)).toBe("OFF")
  })

  it("encodeGET produces ASCII 'GET' (3 bytes)", () => {
    const result = encodeGET()
    expect(result.length).toBe(3)
    expect(toAscii(result)).toBe("GET")
  })

  it("encodeNDEL produces ASCII 'NDEL' (4 bytes)", () => {
    const result = encodeNDEL()
    expect(result.length).toBe(4)
    expect(toAscii(result)).toBe("NDEL")
  })

  it("encodeNSUB produces ASCII 'NSUB' (4 bytes)", () => {
    const result = encodeNSUB()
    expect(result.length).toBe(4)
    expect(toAscii(result)).toBe("NSUB")
  })

  it("encodePING produces ASCII 'PING' (4 bytes)", () => {
    const result = encodePING()
    expect(result.length).toBe(4)
    expect(toAscii(result)).toBe("PING")
    expect(result[0]).toBe(0x50)
    expect(result[1]).toBe(0x49)
    expect(result[2]).toBe(0x4e)
    expect(result[3]).toBe(0x47)
  })

  it("encodeQUE produces ASCII 'QUE' (3 bytes)", () => {
    const result = encodeQUE()
    expect(result.length).toBe(3)
    expect(toAscii(result)).toBe("QUE")
  })
})

// -- NEW command tests

// v6 NEW format (confirmed by SimpleGo working C code, byte for byte):
//   "NEW " [0x2C][44B authKey SPKI] [0x2C][44B dhKey SPKI] "S"
// No spaces between fields. No basicAuth. No sndSecure.
// DIAGNOSTIC: v6 NEW: 4 + 45 + 45 + 1 = 95 bytes ("S" only, no Maybe/sndSecure).

describe("encodeNEW", () => {
  const baseParams: NewQueueParams = {
    recipientAuthKey: fakeKey(0xAA),
    recipientDhKey: fakeKey(0xBB),
    subscribeMode: "S",
  }

  it("starts with ASCII 'NEW '", () => {
    const result = encodeNEW(baseParams)
    expect(extractTag(result)).toBe("NEW")
    expect(result[3]).toBe(0x20)
  })

  it("encodes authKey with 1-byte length prefix (0x2C = 44)", () => {
    const result = encodeNEW(baseParams)
    expect(result[4]).toBe(0x2C)
    expect(result[5]).toBe(0xAA)
  })

  it("encodes dhKey immediately after authKey", () => {
    const result = encodeNEW(baseParams)
    expect(result[49]).toBe(0x2C)
    expect(result[50]).toBe(0xBB)
  })

  it("encodes subscribeMode immediately after dhKey", () => {
    const result = encodeNEW(baseParams)
    expect(result[94]).toBe(0x53) // "S"
  })

  it("encodes subscribeMode 'C' correctly", () => {
    const params: NewQueueParams = {...baseParams, subscribeMode: "C"}
    const result = encodeNEW(params)
    expect(result[94]).toBe(0x43) // "C"
  })

  it("has correct total length: 95 bytes", () => {
    const result = encodeNEW(baseParams)
    expect(result.length).toBe(95)
  })

  it("has NO spaces between key fields", () => {
    const result = encodeNEW(baseParams)
    expect(result[4 + 45]).not.toBe(0x20)
    expect(result[4 + 45]).toBe(0x2C)
  })

  it("last byte is subscribeMode", () => {
    const result = encodeNEW(baseParams)
    expect(result[result.length - 1]).toBe(0x53) // "S"
  })

  it("exact byte sequence matches v6 format", () => {
    const expected = new Uint8Array(95)
    expected[0] = 0x4E; expected[1] = 0x45; expected[2] = 0x57; expected[3] = 0x20
    expected[4] = 0x2C
    expected.fill(0xAA, 5, 49)
    expected[49] = 0x2C
    expected.fill(0xBB, 50, 94)
    expected[94] = 0x53 // "S"
    expected[96] = 0x54 // "T" sndSecure

    const result = encodeNEW(baseParams)
    expect(result).toEqual(expected)
  })
})

// -- KEY command tests

describe("encodeKEY", () => {
  it("starts with ASCII 'KEY '", () => {
    const result = encodeKEY(fakeKey(0xCC))
    expect(extractTag(result)).toBe("KEY")
    expect(result[3]).toBe(0x20)
  })

  it("encodes key with 1-byte length prefix", () => {
    const key = fakeKey(0xCC)
    const result = encodeKEY(key)
    expect(result[4]).toBe(44) // length prefix
    expect(result[5]).toBe(0xCC) // first byte of key
  })

  it("has correct total length", () => {
    const result = encodeKEY(fakeKey(0xCC))
    // "KEY "(4) + len(1) + key(44)
    expect(result.length).toBe(4 + 45)
  })
})

// -- SKEY command tests

describe("encodeSKEY", () => {
  it("starts with ASCII 'SKEY '", () => {
    const result = encodeSKEY(fakeKey(0xDD))
    expect(extractTag(result)).toBe("SKEY")
    expect(result[4]).toBe(0x20)
  })

  it("encodes key with 1-byte length prefix", () => {
    const key = fakeKey(0xDD)
    const result = encodeSKEY(key)
    expect(result[5]).toBe(44) // length prefix
    expect(result[6]).toBe(0xDD) // first byte of key
  })

  it("has correct total length", () => {
    const result = encodeSKEY(fakeKey(0xDD))
    // "SKEY "(5) + len(1) + key(44)
    expect(result.length).toBe(5 + 45)
  })
})

// -- SEND command tests

describe("encodeSEND", () => {
  it("starts with ASCII 'SEND '", () => {
    const result = encodeSEND({notification: true, encMessage: new Uint8Array(10)})
    expect(extractTag(result)).toBe("SEND")
    expect(result[4]).toBe(0x20)
  })

  it("encodes notification flag T", () => {
    const result = encodeSEND({notification: true, encMessage: new Uint8Array(0)})
    expect(result[5]).toBe(0x54) // "T"
  })

  it("encodes notification flag F", () => {
    const result = encodeSEND({notification: false, encMessage: new Uint8Array(0)})
    expect(result[5]).toBe(0x46) // "F"
  })

  it("has space separator between flag and message", () => {
    const result = encodeSEND({notification: true, encMessage: new Uint8Array(1)})
    expect(result[6]).toBe(0x20) // space
  })

  it("preserves binary message content", () => {
    const msg = new Uint8Array([0x00, 0xFF, 0x42, 0x99])
    const result = encodeSEND({notification: false, encMessage: msg})
    // "SEND "(5) + "F"(1) + " "(1) + message(4) = 11
    expect(result.length).toBe(11)
    expect(result[7]).toBe(0x00)
    expect(result[8]).toBe(0xFF)
    expect(result[9]).toBe(0x42)
    expect(result[10]).toBe(0x99)
  })

  it("handles empty message body", () => {
    const result = encodeSEND({notification: true, encMessage: new Uint8Array(0)})
    // "SEND "(5) + "T"(1) + " "(1) = 7
    expect(result.length).toBe(7)
  })

  it("handles large message body (16064 bytes)", () => {
    const largeMsg = new Uint8Array(16064).fill(0xAB)
    const result = encodeSEND({notification: true, encMessage: largeMsg})
    // "SEND "(5) + "T"(1) + " "(1) + 16064 = 16071
    expect(result.length).toBe(16071)
    expect(result[7]).toBe(0xAB) // first message byte
    expect(result[16070]).toBe(0xAB) // last message byte
  })
})

// -- ACK command tests

describe("encodeACK", () => {
  it("starts with ASCII 'ACK '", () => {
    const msgId = new Uint8Array(24).fill(0x11)
    const result = encodeACK(msgId)
    expect(extractTag(result)).toBe("ACK")
    expect(result[3]).toBe(0x20)
  })

  it("encodes msgId with 1-byte length prefix (0x18 = 24)", () => {
    const msgId = new Uint8Array(24).fill(0x22)
    const result = encodeACK(msgId)
    expect(result[4]).toBe(0x18) // 24 decimal = 0x18 hex
    expect(result[5]).toBe(0x22) // first byte of msgId
    expect(result[28]).toBe(0x22) // last byte of msgId (4+1+23)
  })

  it("has correct total length", () => {
    const msgId = new Uint8Array(24).fill(0x33)
    const result = encodeACK(msgId)
    // "ACK "(4) + len(1) + msgId(24) = 29
    expect(result.length).toBe(29)
  })

  it("preserves msgId bytes exactly", () => {
    const msgId = new Uint8Array(24)
    for (let i = 0; i < 24; i++) msgId[i] = i
    const result = encodeACK(msgId)
    for (let i = 0; i < 24; i++) {
      expect(result[5 + i]).toBe(i)
    }
  })
})

// -- NKEY command tests

describe("encodeNKEY", () => {
  it("starts with ASCII 'NKEY '", () => {
    const params: EnableNotificationsParams = {
      notifierKey: fakeKey(0xEE),
      recipientNtfDhKey: fakeKey(0xFF),
    }
    const result = encodeNKEY(params)
    expect(extractTag(result)).toBe("NKEY")
    expect(result[4]).toBe(0x20)
  })

  it("encodes both keys with 1-byte length prefixes", () => {
    const params: EnableNotificationsParams = {
      notifierKey: fakeKey(0xEE),
      recipientNtfDhKey: fakeKey(0xFF),
    }
    const result = encodeNKEY(params)
    // First key at offset 5: len(44) + 44 bytes
    expect(result[5]).toBe(44)
    expect(result[6]).toBe(0xEE)
    // Second key at offset 5+45=50: len(44) + 44 bytes
    expect(result[50]).toBe(44)
    expect(result[51]).toBe(0xFF)
  })

  it("has correct total length", () => {
    const params: EnableNotificationsParams = {
      notifierKey: fakeKey(0xEE),
      recipientNtfDhKey: fakeKey(0xFF),
    }
    const result = encodeNKEY(params)
    // "NKEY "(5) + key1(1+44) + key2(1+44) = 95
    expect(result.length).toBe(95)
  })
})

// -- Cross-cutting tag tests

describe("all commands start with correct ASCII tag", () => {
  const commands: Array<{name: string; tag: string; encode: () => Uint8Array}> = [
    {name: "NEW", tag: "NEW", encode: () => encodeNEW({recipientAuthKey: fakeKey(1), recipientDhKey: fakeKey(2), subscribeMode: "S", sndSecure: true})},
    {name: "SUB", tag: "SUB", encode: () => encodeSUB()},
    {name: "KEY", tag: "KEY", encode: () => encodeKEY(fakeKey(1))},
    {name: "SKEY", tag: "SKEY", encode: () => encodeSKEY(fakeKey(1))},
    {name: "SEND", tag: "SEND", encode: () => encodeSEND({notification: true, encMessage: new Uint8Array(0)})},
    {name: "ACK", tag: "ACK", encode: () => encodeACK(new Uint8Array(24))},
    {name: "DEL", tag: "DEL", encode: () => encodeDEL()},
    {name: "OFF", tag: "OFF", encode: () => encodeOFF()},
    {name: "GET", tag: "GET", encode: () => encodeGET()},
    {name: "NKEY", tag: "NKEY", encode: () => encodeNKEY({notifierKey: fakeKey(1), recipientNtfDhKey: fakeKey(2)})},
    {name: "NDEL", tag: "NDEL", encode: () => encodeNDEL()},
    {name: "NSUB", tag: "NSUB", encode: () => encodeNSUB()},
    {name: "PING", tag: "PING", encode: () => encodePING()},
    {name: "QUE", tag: "QUE", encode: () => encodeQUE()},
  ]

  for (const cmd of commands) {
    it(cmd.name + " starts with '" + cmd.tag + "'", () => {
      const result = cmd.encode()
      expect(extractTag(result)).toBe(cmd.tag)
    })
  }
})
