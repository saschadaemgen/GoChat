// Invitation builder for initial contact request (Step 2).
//
// Crypto parameters from SimpleGo C implementation (smp_ratchet.c).
// Ratchet version 3. All HKDF uses SHA-512.
//
// Layer 1 (inner): encConnInfo - Double Ratchet v3 with AES-256-GCM
//   X3DH: 3 X448 DH ops -> HKDF-SHA512(salt=64zeros, info="SimpleXX3DH") -> HKs, NHKr, RK
//   Root KDF: HKDF-SHA512(salt=RK, ikm=dh_out, info="SimpleXRootRatchet") -> RK', CKs, NHKs
//   Chain KDF: HKDF-SHA512(salt=empty, ikm=CKs, info="SimpleXChainRatchet") -> CK', mk, msg_iv, hdr_iv
//   Header: AES-256-GCM(HKs, hdr_iv, rcAD, MsgHeader 88B) -> emHeader 124B
//   Body: AES-256-GCM(mk, msg_iv, rcAD+emHeader, padded 14832B) -> encConnInfo 14974B
//
// Layer 2 (outer): cmEncBody - NaCl XSalsa20-Poly1305 (unchanged)

import {xsalsa20poly1305} from "@noble/ciphers/salsa"
import {hkdf} from "@noble/hashes/hkdf"
import {sha512} from "@noble/hashes/sha512"
import {
  generateX448KeyPair,
  generateX25519KeyPair,
  generateEd25519KeyPair,
  encodeEd25519PublicKey,
  encodeX448PublicKey,
  encodeX25519PublicKey,
  x448DH,
  x25519DH,
} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import {buildAgentConfirmation} from "./agent-envelope.js"
import type {ManagedConnection} from "./connection.js"

// -- Constants

const E2E_ENC_CONN_INFO_LENGTH = 14832
const E2E_ENC_CONFIRMATION_LENGTH = 15904
const HEADER_PAD_SIZE = 88
const EM_HEADER_SIZE = 124 // v3: 2+16+16+2+88

// HKDF info strings (from C code)
const X3DH_INFO = new TextEncoder().encode("SimpleXX3DH")
const ROOT_RATCHET_INFO = new TextEncoder().encode("SimpleXRootRatchet")
const CHAIN_RATCHET_INFO = new TextEncoder().encode("SimpleXChainRatchet")

// Salts
const X3DH_SALT = new Uint8Array(64) // 64 zero bytes for X3DH

// X448 SPKI prefix for MsgHeader v3
const X448_SPKI_PREFIX = new Uint8Array([
  0x30, 0x42, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6f, 0x03, 0x39, 0x00,
])

// -- Padding

function padPlaintext(plaintext: Uint8Array, targetSize: number): Uint8Array {
  if (2 + plaintext.length > targetSize) {
    throw new Error("padPlaintext: too large: " + (2 + plaintext.length) + " > " + targetSize)
  }
  const padded = new Uint8Array(targetSize)
  padded[0] = (plaintext.length >>> 8) & 0xFF
  padded[1] = plaintext.length & 0xFF
  padded.set(plaintext, 2)
  for (let i = 2 + plaintext.length; i < targetSize; i++) padded[i] = 0x23
  return padded
}

// -- AES-256-GCM (Web Crypto, 16-byte IV)

async function aesGcmEncrypt(
  key: Uint8Array, iv: Uint8Array, aad: Uint8Array, plaintext: Uint8Array
): Promise<{ciphertext: Uint8Array; authTag: Uint8Array}> {
  const ck = await crypto.subtle.importKey("raw", key, {name: "AES-GCM"}, false, ["encrypt"])
  const result = await crypto.subtle.encrypt(
    {name: "AES-GCM", iv, additionalData: aad, tagLength: 128}, ck, plaintext
  )
  const rb = new Uint8Array(result)
  return {ciphertext: rb.slice(0, rb.length - 16), authTag: rb.slice(rb.length - 16)}
}

// -- X3DH: Three DH operations (from smp_ratchet.c line 228)

function performX3DH(
  spk1: KeyPair, spk2: KeyPair,  // our keys (responder)
  rk1: Uint8Array, rk2: Uint8Array // peer keys (initiator), raw 56B X448
): {headerKeySend: Uint8Array; nextHeaderKeyRecv: Uint8Array; rootKey: Uint8Array} {
  const dh1 = x448DH(spk2.privateKey, rk1) // rk1 x spk2
  const dh2 = x448DH(spk1.privateKey, rk2) // rk2 x spk1
  const dh3 = x448DH(spk2.privateKey, rk2) // rk2 x spk2

  const ikm = new Uint8Array(168)
  ikm.set(dh1, 0)
  ikm.set(dh2, 56)
  ikm.set(dh3, 112)

  const output = hkdf(sha512, ikm, X3DH_SALT, X3DH_INFO, 96)
  return {
    headerKeySend: new Uint8Array(output.slice(0, 32)),
    nextHeaderKeyRecv: new Uint8Array(output.slice(32, 64)),
    rootKey: new Uint8Array(output.slice(64, 96)),
  }
}

// -- KDF_ROOT: Additional DH + HKDF after X3DH (line 285-324)

function kdfRoot(rootKey: Uint8Array, dhOut: Uint8Array): {
  newRootKey: Uint8Array; chainKeySend: Uint8Array; nextHeaderKeySend: Uint8Array
} {
  // Salt = rootKey, IKM = dhOut, Info = "SimpleXRootRatchet"
  const output = hkdf(sha512, dhOut, rootKey, ROOT_RATCHET_INFO, 96)
  return {
    newRootKey: new Uint8Array(output.slice(0, 32)),
    chainKeySend: new Uint8Array(output.slice(32, 64)),
    nextHeaderKeySend: new Uint8Array(output.slice(64, 96)),
  }
}

// -- Chain KDF (line 213-224)

function kdfChain(chainKey: Uint8Array): {
  nextChainKey: Uint8Array; messageKey: Uint8Array; msgIV: Uint8Array; headerIV: Uint8Array
} {
  // Salt = empty (null, length 0), IKM = chainKey, Info = "SimpleXChainRatchet"
  // @noble/hashes hkdf with undefined salt uses empty salt
  const output = hkdf(sha512, chainKey, undefined, CHAIN_RATCHET_INFO, 96)
  return {
    nextChainKey: new Uint8Array(output.slice(0, 32)),
    messageKey: new Uint8Array(output.slice(32, 64)),
    msgIV: new Uint8Array(output.slice(64, 80)),
    headerIV: new Uint8Array(output.slice(80, 96)),
  }
}

// -- MsgHeader v3 (88 bytes)

function buildMsgHeader(ratchetPublicKeyRaw: Uint8Array, pn: number, ns: number): Uint8Array {
  const h = new Uint8Array(HEADER_PAD_SIZE)
  let o = 0
  // content_len = 80 (0x0050) - everything after this 2-byte field
  h[o++] = 0x00; h[o++] = 0x50
  // msgMaxVersion = 3 (0x0003)
  h[o++] = 0x00; h[o++] = 0x03
  // SPKI key length = 68 (0x44)
  h[o++] = 0x44
  // X448 SPKI: 12B prefix + 56B raw key
  h.set(X448_SPKI_PREFIX, o); o += 12
  h.set(ratchetPublicKeyRaw, o); o += 56
  // KEM Nothing tag = '0' (0x30)
  h[o++] = 0x30
  // prevChainLen (uint32 BE)
  h[o++] = (pn >>> 24) & 0xFF; h[o++] = (pn >>> 16) & 0xFF
  h[o++] = (pn >>> 8) & 0xFF; h[o++] = pn & 0xFF
  // msgNumber (uint32 BE)
  h[o++] = (ns >>> 24) & 0xFF; h[o++] = (ns >>> 16) & 0xFF
  h[o++] = (ns >>> 8) & 0xFF; h[o++] = ns & 0xFF
  // Padding with '#' to 88
  for (let i = o; i < HEADER_PAD_SIZE; i++) h[i] = 0x23
  return h
}

// -- emHeader v3 (124 bytes)

async function buildEmHeader(
  headerKey: Uint8Array, headerIV: Uint8Array, rcAD: Uint8Array, msgHeader: Uint8Array
): Promise<Uint8Array> {
  const {ciphertext: ehBody, authTag: ehAuthTag} = await aesGcmEncrypt(
    headerKey, headerIV, rcAD, msgHeader
  )
  const em = new Uint8Array(EM_HEADER_SIZE)
  let o = 0
  em[o++] = 0x00; em[o++] = 0x03 // ehVersion = 3
  em.set(headerIV, o); o += 16
  em.set(ehAuthTag, o); o += 16
  em[o++] = 0x00; em[o++] = 0x58 // ehBody length = 88 (0x0058)
  em.set(ehBody, o)
  return em
}

// -- EncRatchetMessage (14974 bytes)

async function buildEncRatchetMessage(
  headerKey: Uint8Array, messageKey: Uint8Array,
  msgIV: Uint8Array, headerIV: Uint8Array,
  rcAD: Uint8Array, ratchetPublicKeyRaw: Uint8Array,
  paddedPayload: Uint8Array
): Promise<Uint8Array> {
  const msgHeader = buildMsgHeader(ratchetPublicKeyRaw, 0, 0)
  const emHeader = await buildEmHeader(headerKey, headerIV, rcAD, msgHeader)

  const bodyAAD = new Uint8Array(rcAD.length + emHeader.length)
  bodyAAD.set(rcAD, 0)
  bodyAAD.set(emHeader, rcAD.length)

  const {ciphertext: emBody, authTag: emAuthTag} = await aesGcmEncrypt(
    messageKey, msgIV, bodyAAD, paddedPayload
  )

  // [2B headerLen=124][124B emHeader][16B bodyTag][14832B body]
  const total = 2 + EM_HEADER_SIZE + 16 + emBody.length
  const result = new Uint8Array(total)
  let o = 0
  result[o++] = 0x00; result[o++] = 0x7C // 124 as uint16 BE
  result.set(emHeader, o); o += EM_HEADER_SIZE
  result.set(emAuthTag, o); o += 16
  result.set(emBody, o)
  return result
}

// -- connInfo JSON

export function buildInvitationConnInfo(displayName: string): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({
    v: "1-16", event: "x.info",
    params: {profile: {displayName, fullName: "",
      preferences: {calls: {allow: "no"}, files: {allow: "no"}, voice: {allow: "no"},
        reactions: {allow: "yes"}, fullDelete: {allow: "no"}, timedMessages: {allow: "yes"}}}}
  }))
}

// -- SMPQueueInfo

function buildSMPQueueInfo(
  host: string, port: number, keyHash: Uint8Array,
  recipientId: Uint8Array, dhPublicSPKI: Uint8Array
): Uint8Array {
  const hb = new TextEncoder().encode(host)
  const pb = new TextEncoder().encode(String(port))
  const p: number[] = []
  p.push(0x01) // clientVersion
  p.push(0x00, 0x04) // smpVersionRange
  p.push(0x00, 0x01) // queueCount
  p.push(0x01) // hostCount
  p.push(hb.length); for (const b of hb) p.push(b)
  if (port !== 5223) { p.push(pb.length); for (const b of pb) p.push(b) } else p.push(0)
  p.push(keyHash.length); for (const b of keyHash) p.push(b)
  p.push(recipientId.length); for (const b of recipientId) p.push(b)
  p.push(dhPublicSPKI.length); for (const b of dhPublicSPKI) p.push(b)
  return new Uint8Array(p)
}

// -- AgentConnInfoReply

function buildAgentConnInfoReply(smpQueueInfo: Uint8Array, connInfo: Uint8Array): Uint8Array {
  const r = new Uint8Array(1 + smpQueueInfo.length + connInfo.length)
  r[0] = 0x44 // 'D' = Duplex
  r.set(smpQueueInfo, 1)
  r.set(connInfo, 1 + smpQueueInfo.length)
  return r
}

// -- ClientMessage

function buildClientMessage(senderAuthKeySPKI: Uint8Array, agentEnvelope: Uint8Array): Uint8Array {
  const r = new Uint8Array(1 + 44 + agentEnvelope.length)
  r[0] = 0x4B // 'K'
  r.set(senderAuthKeySPKI, 1)
  r.set(agentEnvelope, 45)
  return r
}

// -- ClientMsgEnvelope (Layer 2)

function buildClientMsgEnvelope(
  dhPublicSPKI: Uint8Array, nonce: Uint8Array, cmEncBody: Uint8Array
): Uint8Array {
  const r = new Uint8Array(2 + 1 + 1 + 44 + 24 + cmEncBody.length)
  let o = 0
  r[o++] = 0x00; r[o++] = 0x04 // phVersion = 4
  r[o++] = 0x31 // '1' = Just
  r[o++] = 44
  r.set(dhPublicSPKI, o); o += 44
  r.set(nonce, o); o += 24
  r.set(cmEncBody, o)
  return r
}

// -- Full invitation builder

export interface InvitationResult {
  smpEncConfirmation: Uint8Array
  senderAuthKeySPKI: Uint8Array
  ratchetKeyPair: KeyPair
  ephemeralKeyPair: KeyPair
}

export async function buildInvitation(
  conn: ManagedConnection, displayName: string, smpVersion: number
): Promise<InvitationResult> {
  if (!conn.contactQueue) throw new Error("Cannot build invitation: contactQueue is null")
  if (!conn.receiveQueue) throw new Error("Cannot build invitation: receiveQueue is null (IDS not received)")

  const aliceDhRaw = (() => {
    const raw = b64decode(conn.contactQueue.dhPublicKey)
    return raw.length === 44 ? raw.subarray(12) : raw
  })()

  // Our X448 keypairs: spk1 = identity, spk2 = ephemeral
  const spk1 = generateX448KeyPair()
  const spk2 = generateX448KeyPair()

  // Peer's X448 keys (from contact address).
  // For initial contact we don't have peer's X448 keys.
  // Use our own as stand-in - Alice re-derives on acceptance.
  const rk1 = spk1.publicKey
  const rk2 = spk2.publicKey

  // Step 2: X3DH (3 DH ops)
  const x3dh = performX3DH(spk1, spk2, rk1, rk2)
  console.log("[SMP] DIAG X3DH: HKs=" + hex(x3dh.headerKeySend, 8) + "..., RK=" + hex(x3dh.rootKey, 8) + "...")

  // Step 3: Init sender ratchet (additional DH + Root KDF)
  const dhOut = x448DH(spk2.privateKey, rk2)
  const root = kdfRoot(x3dh.rootKey, dhOut)
  console.log("[SMP] DIAG KDF_ROOT: CKs=" + hex(root.chainKeySend, 8) + "...")

  // Step 4: Chain KDF
  const chain = kdfChain(root.chainKeySend)
  console.log("[SMP] DIAG kdf_chain: mk=" + hex(chain.messageKey, 8) + "..., msg_iv=" + hex(chain.msgIV, 8) + "..., hdr_iv=" + hex(chain.headerIV, 8) + "...")

  // rcAD: our spk1 pub (56B) || peer rk1 (56B)
  const rcAD = new Uint8Array(112)
  rcAD.set(spk1.publicKey, 0)
  rcAD.set(rk1, 56)

  // Layer 1: Build AgentConnInfoReply
  const connInfo = buildInvitationConnInfo(displayName)
  const keyHash = b64decode(conn.contactQueue.server.serverIdentity)
  const e2eDhSPKI = encodeX25519PublicKey(conn.keys.e2eDh.publicKey)
  const queueInfo = buildSMPQueueInfo(
    conn.contactQueue.server.hosts[0], 5223, keyHash,
    conn.receiveQueue.recipientId, e2eDhSPKI
  )
  const acir = buildAgentConnInfoReply(queueInfo, connInfo)
  const paddedL1 = padPlaintext(acir, E2E_ENC_CONN_INFO_LENGTH)

  // Build EncRatchetMessage (14974 bytes)
  const encConnInfo = await buildEncRatchetMessage(
    x3dh.headerKeySend, chain.messageKey,
    chain.msgIV, chain.headerIV,
    rcAD, spk2.publicKey, paddedL1
  )
  console.log("[SMP] DIAG encConnInfo:", encConnInfo.length + "B (expected 14974), first 4:", hex(encConnInfo, 4))

  // Layer 2: AgentConfirmation
  const agentEnv = buildAgentConfirmation({
    ratchetPublicKeySPKI: encodeX448PublicKey(spk1.publicKey),
    ephemeralPublicKeySPKI: encodeX448PublicKey(spk2.publicKey),
    encryptedConnInfo: encConnInfo,
  })

  // Layer 3: ClientMessage
  const senderAuth = generateEd25519KeyPair()
  const senderAuthKeySPKI = encodeEd25519PublicKey(senderAuth.publicKey)
  const clientMsg = buildClientMessage(senderAuthKeySPKI, agentEnv)

  // Layer 4: NaCl encrypt (Layer 2)
  const phKeyPair = generateX25519KeyPair()
  const phSecret = x25519DH(phKeyPair.privateKey, aliceDhRaw)
  const paddedL2 = padPlaintext(clientMsg, E2E_ENC_CONFIRMATION_LENGTH)
  const nonce = new Uint8Array(24); crypto.getRandomValues(nonce)
  const cmEncBody = xsalsa20poly1305(phSecret, nonce).encrypt(paddedL2)
  console.log("[SMP] DIAG cmEncBody:", cmEncBody.length + "B (expected 15920)")

  // Layer 5: ClientMsgEnvelope
  const smpEnc = buildClientMsgEnvelope(encodeX25519PublicKey(phKeyPair.publicKey), nonce, cmEncBody)
  console.log("[SMP] DIAG envelope:", smpEnc.length + "B (expected 15992)")

  return {smpEncConfirmation: smpEnc, senderAuthKeySPKI, ratchetKeyPair: spk1, ephemeralKeyPair: spk2}
}

// -- Helpers

function hex(bytes: Uint8Array, n: number = 32): string {
  return Array.from(bytes.slice(0, n)).map(b => b.toString(16).padStart(2, "0")).join(" ")
}

function b64decode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(0)
  let b = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b.length % 4 !== 0) b += "="
  const bin = atob(b)
  const r = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) r[i] = bin.charCodeAt(i)
  return r
}
