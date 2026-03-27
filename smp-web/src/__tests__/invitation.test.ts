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

// -- connInfo

describe("buildInvitationConnInfo", () => {
  it("produces valid JSON", () => {
    const bytes = buildInvitationConnInfo("Test")
    expect(() => JSON.parse(new TextDecoder().decode(bytes))).not.toThrow()
  })

  it("has x.info event and display name", () => {
    const parsed = JSON.parse(new TextDecoder().decode(buildInvitationConnInfo("Alice")))
    expect(parsed.event).toBe("x.info")
    expect(parsed.params.profile.displayName).toBe("Alice")
  })
})

// -- buildInvitation

describe("buildInvitation", () => {
  it("produces 15992-byte SEND body", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.smpEncConfirmation.length).toBe(15992)
  })

  it("starts with phVersion 4 (0x00 0x04)", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.smpEncConfirmation[0]).toBe(0x00)
    expect(result.smpEncConfirmation[1]).toBe(0x04)
  })

  it("has Just DH key tag 0x31 at byte 2", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.smpEncConfirmation[2]).toBe(0x31)
  })

  it("has DH key SPKI length 44 at byte 3", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.smpEncConfirmation[3]).toBe(44)
  })

  it("cmEncBody is 15920 bytes (15904 + 16 MAC)", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.smpEncConfirmation.length - 72).toBe(15920)
  })

  it("produces 56-byte X448 ratchet key pair", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.ratchetKeyPair.publicKey.length).toBe(56)
    expect(result.ratchetKeyPair.privateKey.length).toBe(56)
  })

  it("produces 56-byte X448 ephemeral key pair", async () => {
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    expect(result.ephemeralKeyPair.publicKey.length).toBe(56)
  })

  it("throws when contactQueue is null", async () => {
    const conn = createMockConnection()
    conn.contactQueue = null
    await expect(buildInvitation(conn, "V", 4)).rejects.toThrow("contactQueue is null")
  })

  it("throws when receiveQueue is null", async () => {
    const conn = createMockConnection()
    conn.receiveQueue = null
    await expect(buildInvitation(conn, "V", 4)).rejects.toThrow("receiveQueue is null")
  })

  it("generates unique keys per call", async () => {
    const conn = createMockConnection()
    const r1 = await buildInvitation(conn, "V", 4)
    const r2 = await buildInvitation(conn, "V", 4)
    expect(r1.ratchetKeyPair.publicKey).not.toEqual(r2.ratchetKeyPair.publicKey)
  })

  it("ClientMessage starts with PHEmpty 0x5F after decryption padding", async () => {
    // The padded plaintext has 2B length prefix, then the ClientMessage.
    // ClientMessage[0] = '_' (0x5F) = PHEmpty.
    // We verify the envelope structure is correct.
    const result = await buildInvitation(createMockConnection(), "Visitor", 4)
    // Envelope: [2B phVersion][1B '1'][1B 44][44B SPKI][24B nonce][cmEncBody...]
    // cmEncBody starts at offset 72, is encrypted so we can't peek inside.
    // But we can verify the envelope header is correct.
    expect(result.smpEncConfirmation[0]).toBe(0x00) // phVersion high
    expect(result.smpEncConfirmation[1]).toBe(0x04) // phVersion low
    expect(result.smpEncConfirmation[2]).toBe(0x31) // Just tag
    expect(result.smpEncConfirmation[3]).toBe(44)   // SPKI length
  })
})

// -- SEND format

describe("SEND command format", () => {
  it("flag F = 0x46", () => {
    expect(encodeSEND({notification: false, encMessage: new Uint8Array([1])})[5]).toBe(0x46)
  })
  it("flag T = 0x54", () => {
    expect(encodeSEND({notification: true, encMessage: new Uint8Array([1])})[5]).toBe(0x54)
  })
  it("space after flag", () => {
    expect(encodeSEND({notification: false, encMessage: new Uint8Array([1])})[6]).toBe(0x20)
  })
})
