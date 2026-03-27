import {describe, it, expect} from "vitest"
import {buildInvitation, buildInvitationConnInfo} from "../invitation.js"
import {ConnectionStateMachine} from "../state.js"
import {generateEd25519KeyPair, generateX25519KeyPair} from "../crypto-utils.js"
import {encodeSEND} from "../commands.js"
import type {ManagedConnection} from "../connection.js"

// -- Helpers

function createMockConnection(): ManagedConnection {
  const state = new ConnectionStateMachine()
  state.transition("createQueues")
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
  })

  it("contains display name", () => {
    const bytes = buildInvitationConnInfo("Alice")
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    expect(parsed.params.profile.displayName).toBe("Alice")
  })
})

// -- buildInvitation tests (now async)

describe("buildInvitation", () => {
  it("produces non-empty smpEncConfirmation", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    expect(result.smpEncConfirmation.length).toBeGreaterThan(0)
  })

  it("smpEncConfirmation starts with phVersion 4 (0x00 0x04)", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    expect(result.smpEncConfirmation[0]).toBe(0x00)
    expect(result.smpEncConfirmation[1]).toBe(0x04)
  })

  it("smpEncConfirmation has Just DH key tag 0x31 at byte 2", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    expect(result.smpEncConfirmation[2]).toBe(0x31)
  })

  it("total SEND body is 15992 bytes", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    expect(result.smpEncConfirmation.length).toBe(15992)
  })

  it("cmEncBody is 15920 bytes (15904 padded + 16 MAC)", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    const cmEncBodyLen = result.smpEncConfirmation.length - 72
    expect(cmEncBodyLen).toBe(15920)
  })

  it("produces 44-byte sender auth key SPKI", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    expect(result.senderAuthKeySPKI.length).toBe(44)
    expect(result.senderAuthKeySPKI[0]).toBe(0x30)
  })

  it("produces 56-byte X448 ratchet key pair", async () => {
    const conn = createMockConnection()
    const result = await buildInvitation(conn, "Visitor", 4)
    expect(result.ratchetKeyPair.publicKey.length).toBe(56)
    expect(result.ratchetKeyPair.privateKey.length).toBe(56)
  })

  it("throws when contactQueue is null", async () => {
    const conn = createMockConnection()
    conn.contactQueue = null
    await expect(buildInvitation(conn, "Visitor", 4)).rejects.toThrow("contactQueue is null")
  })

  it("throws when receiveQueue is null", async () => {
    const conn = createMockConnection()
    conn.receiveQueue = null
    await expect(buildInvitation(conn, "Visitor", 4)).rejects.toThrow("receiveQueue is null")
  })

  it("generates unique keys on each call", async () => {
    const conn = createMockConnection()
    const r1 = await buildInvitation(conn, "Visitor", 4)
    const r2 = await buildInvitation(conn, "Visitor", 4)
    expect(r1.senderAuthKeySPKI).not.toEqual(r2.senderAuthKeySPKI)
    expect(r1.ratchetKeyPair.publicKey).not.toEqual(r2.ratchetKeyPair.publicKey)
  })
})

// -- SEND command format verification

describe("SEND command format (unsigned)", () => {
  it("encodeSEND with notification=false uses ASCII F (0x46)", () => {
    const result = encodeSEND({notification: false, encMessage: new Uint8Array([0x01])})
    expect(result[5]).toBe(0x46)
  })

  it("encodeSEND with notification=true uses ASCII T (0x54)", () => {
    const result = encodeSEND({notification: true, encMessage: new Uint8Array([0x01])})
    expect(result[5]).toBe(0x54)
  })

  it("SEND flag is followed by space (0x20)", () => {
    const result = encodeSEND({notification: false, encMessage: new Uint8Array([0x01])})
    expect(result[6]).toBe(0x20)
  })
})
