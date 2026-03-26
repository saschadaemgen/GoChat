import {describe, it, expect} from "vitest"
import {buildInvitation, buildInvitationConnInfo} from "../invitation.js"
import {ConnectionStateMachine} from "../state.js"
import {generateEd25519KeyPair, generateX25519KeyPair} from "../crypto-utils.js"
import type {ManagedConnection} from "../connection.js"

// -- Helpers

function createMockConnection(): ManagedConnection {
  const state = new ConnectionStateMachine()
  state.transition("createQueues") // move to QUEUE_CREATED
  return {
    state,
    keys: {
      recipientAuth: generateEd25519KeyPair(),
      recipientDh: generateX25519KeyPair(),
      e2eDh: generateX25519KeyPair(),
    },
    contactAddress: {
      format: "full" as const,
      data: {
        linkType: "contact" as const,
        agentVersion: {min: 1, max: 7},
        smpQueues: [{
          server: {serverIdentity: "testIdentity", hosts: ["smp.test"], port: 5223},
          senderId: "testSenderId",
          dhPublicKey: "MCowBQYDK2VuAyEAjiswwI3O_NlS8Fk3HJHA868-I-GizH0e2NbGXhYEXx0",
          smpVersion: {min: 1, max: 7},
          sndSecure: false,
        }],
      },
    },
    contactQueue: {
      server: {hosts: ["smp.test"], port: 5223, serverIdentity: "testIdentity"},
      senderId: "testSenderId",
      dhPublicKey: "MCowBQYDK2VuAyEAjiswwI3O_NlS8Fk3HJHA868-I-GizH0e2NbGXhYEXx0",
      smpVersion: {min: 1, max: 7},
      sndSecure: false,
    },
    receiveQueue: {
      recipientId: new Uint8Array(24).fill(0x11),
      senderId: new Uint8Array(24).fill(0x22),
      serverDhKey: new Uint8Array(32).fill(0x33),
    },
  }
}

// -- buildInvitationConnInfo tests

describe("buildInvitationConnInfo", () => {
  it("produces valid JSON bytes", () => {
    const bytes = buildInvitationConnInfo("Test User")
    const json = new TextDecoder().decode(bytes)
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it("contains x.info event", () => {
    const bytes = buildInvitationConnInfo("Test User")
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    expect(parsed.event).toBe("x.info")
    expect(parsed.v).toBe("1-16")
  })

  it("contains display name", () => {
    const bytes = buildInvitationConnInfo("Alice")
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    expect(parsed.params.profile.displayName).toBe("Alice")
  })
})

// -- buildInvitation tests

describe("buildInvitation", () => {
  it("produces non-empty smpEncConfirmation", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    expect(result.smpEncConfirmation.length).toBeGreaterThan(0)
  })

  it("smpEncConfirmation starts with version bytes", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    // Version 6 = 0x00 0x06
    expect(result.smpEncConfirmation[0]).toBe(0x00)
    expect(result.smpEncConfirmation[1]).toBe(0x06)
  })

  it("smpEncConfirmation has DH key indicator at byte 2", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    // "1" = 0x31 -> DH key follows
    expect(result.smpEncConfirmation[2]).toBe(0x31)
  })

  it("smpEncConfirmation has DH key length 44 at byte 3", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    expect(result.smpEncConfirmation[3]).toBe(44)
  })

  it("total size is header(48) + nonce(24) + encrypted(15936)", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    // header: 2(version) + 1("1") + 1(keyLen) + 44(key) = 48
    // nonce: 24
    // encrypted: 15920(padded) + 16(poly1305 tag) = 15936
    expect(result.smpEncConfirmation.length).toBe(48 + 24 + 15936)
  })

  it("produces 44-byte sender auth key SPKI", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    expect(result.senderAuthKeySPKI.length).toBe(44)
    // Ed25519 SPKI prefix
    expect(result.senderAuthKeySPKI[0]).toBe(0x30)
    expect(result.senderAuthKeySPKI[1]).toBe(0x2a)
  })

  it("produces 56-byte X448 ratchet key pair", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    expect(result.ratchetKeyPair.publicKey.length).toBe(56)
    expect(result.ratchetKeyPair.privateKey.length).toBe(56)
  })

  it("produces 56-byte X448 ephemeral key pair", () => {
    const conn = createMockConnection()
    const result = buildInvitation(conn, "Visitor", 6)
    expect(result.ephemeralKeyPair.publicKey.length).toBe(56)
    expect(result.ephemeralKeyPair.privateKey.length).toBe(56)
  })

  it("throws when contactQueue is null", () => {
    const conn = createMockConnection()
    conn.contactQueue = null
    expect(() => buildInvitation(conn, "Visitor", 6)).toThrow("contactQueue is null")
  })

  it("generates unique keys on each call", () => {
    const conn = createMockConnection()
    const r1 = buildInvitation(conn, "Visitor", 6)
    const r2 = buildInvitation(conn, "Visitor", 6)
    expect(r1.senderAuthKeySPKI).not.toEqual(r2.senderAuthKeySPKI)
    expect(r1.ratchetKeyPair.publicKey).not.toEqual(r2.ratchetKeyPair.publicKey)
  })
})

// -- SEND command format verification

import {encodeSEND} from "../commands.js"

describe("SEND command format (unsigned)", () => {
  it("encodeSEND with notification=false uses ASCII F (0x46)", () => {
    const result = encodeSEND({notification: false, encMessage: new Uint8Array([0x01])})
    // "SEND " = 53 45 4e 44 20, then flag F = 46, then space = 20
    expect(result[5]).toBe(0x46) // ASCII 'F'
  })

  it("encodeSEND with notification=true uses ASCII T (0x54)", () => {
    const result = encodeSEND({notification: true, encMessage: new Uint8Array([0x01])})
    expect(result[5]).toBe(0x54) // ASCII 'T'
  })

  it("SEND flag is followed by space (0x20)", () => {
    const result = encodeSEND({notification: false, encMessage: new Uint8Array([0x01])})
    expect(result[6]).toBe(0x20) // space after flag
  })
})
