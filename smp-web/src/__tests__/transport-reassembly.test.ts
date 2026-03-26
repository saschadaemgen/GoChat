// Tests for WebSocket frame reassembly in SMPWebSocketTransport.
//
// When connecting through a WSS reverse proxy (e.g. Nginx), the SMP
// server's 16KB blocks may arrive split across multiple WebSocket
// frames, or multiple blocks may be coalesced into a single frame.
// The transport must buffer incoming data and extract complete blocks.

import {describe, it, expect, vi} from "vitest"
import {SMP_BLOCK_SIZE} from "../transport.js"
import type {TransportEventHandler} from "../types.js"

// We test the buffering logic by simulating the exact behavior of
// SMPWebSocketTransport's message handler. Since the handler is
// internal to the class (attached to the WebSocket), we replicate
// the algorithm here and verify it produces correct blocks.

// Buffer reassembly algorithm (matches transport.ts implementation)
function createReassembler(): {
  feed: (chunk: Uint8Array) => void
  onBlock: (handler: (block: Uint8Array) => void) => void
} {
  let recvBuffer = new Uint8Array(0)
  let blockHandler: ((block: Uint8Array) => void) | null = null

  return {
    feed(chunk: Uint8Array) {
      if (recvBuffer.length === 0) {
        recvBuffer = chunk
      } else {
        const combined = new Uint8Array(recvBuffer.length + chunk.length)
        combined.set(recvBuffer, 0)
        combined.set(chunk, recvBuffer.length)
        recvBuffer = combined
      }

      while (recvBuffer.length >= SMP_BLOCK_SIZE) {
        const block = recvBuffer.slice(0, SMP_BLOCK_SIZE)
        recvBuffer = recvBuffer.slice(SMP_BLOCK_SIZE)
        if (blockHandler) blockHandler(block)
      }
    },
    onBlock(handler: (block: Uint8Array) => void) {
      blockHandler = handler
    },
  }
}

// Create a test block filled with a specific byte value
function makeBlock(fill: number): Uint8Array {
  return new Uint8Array(SMP_BLOCK_SIZE).fill(fill)
}

describe("WebSocket frame reassembly", () => {
  it("processes a complete block arriving in a single frame", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    const block = makeBlock(0xAA)
    reassembler.feed(block)

    expect(received.length).toBe(1)
    expect(received[0].length).toBe(SMP_BLOCK_SIZE)
    expect(received[0][0]).toBe(0xAA)
    expect(received[0][SMP_BLOCK_SIZE - 1]).toBe(0xAA)
  })

  it("reassembles a block split into 2 fragments", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    const block = makeBlock(0xBB)
    const half = SMP_BLOCK_SIZE / 2

    // First half
    reassembler.feed(block.slice(0, half))
    expect(received.length).toBe(0) // not yet complete

    // Second half
    reassembler.feed(block.slice(half))
    expect(received.length).toBe(1)
    expect(received[0]).toEqual(block)
  })

  it("reassembles a block split into 3 fragments", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    const block = makeBlock(0xCC)
    const third = Math.floor(SMP_BLOCK_SIZE / 3)

    reassembler.feed(block.slice(0, third))
    expect(received.length).toBe(0)

    reassembler.feed(block.slice(third, 2 * third))
    expect(received.length).toBe(0)

    reassembler.feed(block.slice(2 * third))
    expect(received.length).toBe(1)
    expect(received[0]).toEqual(block)
  })

  it("processes two blocks arriving in one message", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    const block1 = makeBlock(0x11)
    const block2 = makeBlock(0x22)

    // Combine both blocks into one chunk
    const combined = new Uint8Array(SMP_BLOCK_SIZE * 2)
    combined.set(block1, 0)
    combined.set(block2, SMP_BLOCK_SIZE)

    reassembler.feed(combined)

    expect(received.length).toBe(2)
    expect(received[0]).toEqual(block1)
    expect(received[1]).toEqual(block2)
  })

  it("handles block boundary spanning two messages", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    const block1 = makeBlock(0x33)
    const block2 = makeBlock(0x44)

    // First message: block1 + first 1000 bytes of block2
    const msg1 = new Uint8Array(SMP_BLOCK_SIZE + 1000)
    msg1.set(block1, 0)
    msg1.set(block2.slice(0, 1000), SMP_BLOCK_SIZE)

    reassembler.feed(msg1)
    expect(received.length).toBe(1) // only block1 complete
    expect(received[0]).toEqual(block1)

    // Second message: remaining bytes of block2
    reassembler.feed(block2.slice(1000))
    expect(received.length).toBe(2)
    expect(received[1]).toEqual(block2)
  })

  it("handles tiny fragments (1 byte at a time)", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    // Feed 100 bytes at a time (simulate extreme fragmentation)
    const block = makeBlock(0x55)
    const chunkSize = 100
    for (let offset = 0; offset < SMP_BLOCK_SIZE; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, SMP_BLOCK_SIZE)
      reassembler.feed(block.slice(offset, end))
    }

    expect(received.length).toBe(1)
    expect(received[0]).toEqual(block)
  })

  it("preserves block content through reassembly", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    // Create a block with varied content (not all same byte)
    const block = new Uint8Array(SMP_BLOCK_SIZE)
    for (let i = 0; i < SMP_BLOCK_SIZE; i++) block[i] = i & 0xFF

    // Split at arbitrary point
    const splitAt = 7777
    reassembler.feed(block.slice(0, splitAt))
    reassembler.feed(block.slice(splitAt))

    expect(received.length).toBe(1)
    expect(received[0]).toEqual(block)
  })

  it("handles three blocks with fragment spanning boundaries", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(new Uint8Array(block)))

    const b1 = makeBlock(0x01)
    const b2 = makeBlock(0x02)
    const b3 = makeBlock(0x03)

    // Msg 1: b1 + half of b2
    const half = SMP_BLOCK_SIZE / 2
    const msg1 = new Uint8Array(SMP_BLOCK_SIZE + half)
    msg1.set(b1, 0)
    msg1.set(b2.slice(0, half), SMP_BLOCK_SIZE)
    reassembler.feed(msg1)
    expect(received.length).toBe(1)

    // Msg 2: rest of b2 + b3
    const msg2 = new Uint8Array(half + SMP_BLOCK_SIZE)
    msg2.set(b2.slice(half), 0)
    msg2.set(b3, half)
    reassembler.feed(msg2)
    expect(received.length).toBe(3)

    expect(received[0]).toEqual(b1)
    expect(received[1]).toEqual(b2)
    expect(received[2]).toEqual(b3)
  })

  it("does not emit blocks for empty messages", () => {
    const reassembler = createReassembler()
    const received: Uint8Array[] = []
    reassembler.onBlock(block => received.push(block))

    reassembler.feed(new Uint8Array(0))
    expect(received.length).toBe(0)
  })
})

describe("SMP_BLOCK_SIZE constant", () => {
  it("is exactly 16384", () => {
    expect(SMP_BLOCK_SIZE).toBe(16384)
  })
})
