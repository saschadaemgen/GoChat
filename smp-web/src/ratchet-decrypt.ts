// Double Ratchet decrypt for Season 9.
//
// Initializes the receiving ratchet from X3DH output and decrypts
// the CLI's encConnInfo (EncRatchetMessage) to recover the profile
// JSON and reply queue information.
//
// Reference: Simplex.Messaging.Crypto.Ratchet (initRcvRatchet, rcDecrypt)
// Reference: SimpleGo smp_ratchet.c (verified C implementation)

import {gcm} from "@noble/ciphers/aes"
import {hkdf} from "@noble/hashes/hkdf"
import {sha512} from "@noble/hashes/sha512"
import {x448} from "@noble/curves/ed448"
import {generateX448KeyPair} from "./crypto-utils.js"
import type {KeyPair} from "./crypto-utils.js"
import type {RatchetInitParams, X448KeyPair} from "./x3dh-agreement.js"

// --- Types ---

export interface RatchetState {
  rootKey: Uint8Array
  nhks: Uint8Array
  nhkr: Uint8Array
  hks: Uint8Array
  hkr: Uint8Array
  cks: Uint8Array
  ckr: Uint8Array
  dhSelf: KeyPair
  dhPeer: Uint8Array
  ns: number
  nr: number
  pn: number
  assocData: Uint8Array
}

export interface DecryptResult {
  agentMessage: Uint8Array
  updatedState: RatchetState
}

// --- KDF Functions ---

// CRITICAL: chainKdf output order verified against Haskell + C source.
// CRYPTO.md has the pairs SWAPPED - do NOT use CRYPTO.md order.

export function rootKdf(rootKey: Uint8Array, dhOutput: Uint8Array): [Uint8Array, Uint8Array, Uint8Array] {
  // salt=rootKey, ikm=dhOutput, info="SimpleXRootRatchet"
  const output = hkdf(sha512, dhOutput, rootKey, "SimpleXRootRatchet", 96)
  return [
    new Uint8Array(output.slice(0, 32)),   // new_root_key
    new Uint8Array(output.slice(32, 64)),  // chain_key
    new Uint8Array(output.slice(64, 96)),  // next_header_key
  ]
}

export function chainKdf(chainKey: Uint8Array): [Uint8Array, Uint8Array, Uint8Array, Uint8Array] {
  // salt="" (empty), ikm=chainKey, info="SimpleXChainRatchet"
  const output = hkdf(sha512, chainKey, undefined, "SimpleXChainRatchet", 96)
  return [
    new Uint8Array(output.slice(0, 32)),   // new_chain_key
    new Uint8Array(output.slice(32, 64)),  // message_key
    new Uint8Array(output.slice(64, 80)),  // body_iv (16B)
    new Uint8Array(output.slice(80, 96)),  // header_iv (16B)
  ]
}

// --- Helpers ---

export function unPad(data: Uint8Array): Uint8Array {
  const len = (data[0] << 8) | data[1]
  return data.slice(2, 2 + len)
}

function readWord32BE(data: Uint8Array, offset: number): number {
  return ((data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]) >>> 0
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  let len = 0
  for (const a of arrays) len += a.length
  const r = new Uint8Array(len)
  let o = 0
  for (const a of arrays) { r.set(a, o); o += a.length }
  return r
}

function hex(data: Uint8Array, n = 8): string {
  return Array.from(data.slice(0, Math.min(n, data.length))).map(b => b.toString(16).padStart(2, "0")).join(" ") + (data.length > n ? "..." : "")
}

// --- Init ---

export function initRcvRatchet(params: RatchetInitParams, ourDhKey2: KeyPair): RatchetState {
  return {
    rootKey: params.ratchetKey,
    nhks: params.rcvNextHK,     // our send NHK = their receive NHK
    nhkr: params.sndHK,         // our receive NHK = their send HK
    hks: new Uint8Array(32),
    hkr: new Uint8Array(32),
    cks: new Uint8Array(32),
    ckr: new Uint8Array(32),
    dhSelf: ourDhKey2,
    dhPeer: new Uint8Array(56),
    ns: 0,
    nr: 0,
    pn: 0,
    assocData: params.assocData,
  }
}

// --- Parse EncRatchetMessage ---

export interface ParsedEncRatchetMessage {
  emHeaderRaw: Uint8Array
  emAuthTag: Uint8Array
  emBody: Uint8Array
}

export function parseEncRatchetMessage(data: Uint8Array): ParsedEncRatchetMessage {
  let offset = 0
  let emHeaderLen: number

  // Auto-detect v2 vs v3 by first byte
  if (data[0] < 0x20) {
    // v3: Word16 BE length prefix
    emHeaderLen = (data[0] << 8) | data[1]
    offset = 2
  } else {
    // v2: 1-byte length prefix
    emHeaderLen = data[0]
    offset = 1
  }

  console.log("[DIAG] EncRatchetMessage: headerLen=" + emHeaderLen + ", v" + (offset === 2 ? "3" : "2"))

  const emHeaderRaw = data.slice(offset, offset + emHeaderLen)
  offset += emHeaderLen
  const emAuthTag = data.slice(offset, offset + 16)
  offset += 16
  const emBody = data.slice(offset)

  console.log("[DIAG] emHeader=" + emHeaderRaw.length + "B, emAuthTag=" + emAuthTag.length + "B, emBody=" + emBody.length + "B")

  return {emHeaderRaw, emAuthTag, emBody}
}

// --- Parse EncMessageHeader ---

interface ParsedHeader {
  ehVersion: number
  ehIV: Uint8Array
  ehAuthTag: Uint8Array
  ehBody: Uint8Array
}

function parseEncMessageHeader(emHeader: Uint8Array): ParsedHeader {
  let offset = 0
  const ehVersion = (emHeader[offset] << 8) | emHeader[offset + 1]
  offset += 2
  const ehIV = emHeader.slice(offset, offset + 16)
  offset += 16
  const ehAuthTag = emHeader.slice(offset, offset + 16)
  offset += 16

  // ehBody length prefix: v3 = Word16 BE, v2 = 1 byte
  let ehBodyLen: number
  if (ehVersion >= 3) {
    ehBodyLen = (emHeader[offset] << 8) | emHeader[offset + 1]
    offset += 2
  } else {
    ehBodyLen = emHeader[offset]
    offset += 1
  }

  const ehBody = emHeader.slice(offset, offset + ehBodyLen)
  console.log("[DIAG] ehVersion=" + ehVersion + ", ehBodyLen=" + ehBodyLen + ", ehBody=" + ehBody.length + "B")

  return {ehVersion, ehIV, ehAuthTag, ehBody}
}

// --- Parse MsgHeader ---

interface ParsedMsgHeader {
  msgVersion: number
  peerDhRaw: Uint8Array
  msgPN: number
  msgNs: number
}

function parseMsgHeader(paddedHeader: Uint8Array): ParsedMsgHeader {
  // unPad first
  const content = unPad(paddedHeader)
  let offset = 0

  const msgVersion = (content[offset] << 8) | content[offset + 1]
  offset += 2

  const dhKeyLen = content[offset]
  offset += 1

  const peerDhSpki = content.slice(offset, offset + dhKeyLen)
  offset += dhKeyLen
  const peerDhRaw = peerDhSpki.slice(12, 12 + 56) // raw X448 from SPKI

  // KEM field (v >= 3)
  if (msgVersion >= 3) {
    const kemTag = content[offset]
    offset += 1
    if (kemTag === 0x31) { // '1' = Just - skip KEM params
      // KEM tag + data - simplified skip
      const kemType = content[offset]
      offset += 1
      if (kemType === 0x50) { // 'P' = Proposed
        const kLen = content[offset]; offset += 1
        offset += kLen
      } else if (kemType === 0x41) { // 'A' = Accepted
        // ciphertext + key (both length-prefixed)
        if (content[offset] === 0xff) { offset += 1; const l = (content[offset] << 8) | content[offset+1]; offset += 2 + l }
        else { const l = content[offset]; offset += 1 + l }
        if (content[offset] === 0xff) { offset += 1; const l = (content[offset] << 8) | content[offset+1]; offset += 2 + l }
        else { const l = content[offset]; offset += 1 + l }
      }
    }
  }

  const msgPN = readWord32BE(content, offset); offset += 4
  const msgNs = readWord32BE(content, offset)

  console.log("[DIAG] MsgHeader: version=" + msgVersion + ", peerDH=" + hex(peerDhRaw) + ", PN=" + msgPN + ", Ns=" + msgNs)

  return {msgVersion, peerDhRaw, msgPN, msgNs}
}

// --- Main Decrypt ---

export function decryptEncConnInfo(state: RatchetState, encConnInfo: Uint8Array): DecryptResult {
  // Step 1: Parse EncRatchetMessage
  const {emHeaderRaw, emAuthTag, emBody} = parseEncRatchetMessage(encConnInfo)

  // Step 2: Parse EncMessageHeader
  const {ehVersion, ehIV, ehAuthTag, ehBody} = parseEncMessageHeader(emHeaderRaw)

  // Step 3: Decrypt header with NHKr (next header key for receiving)
  console.log("[DIAG] Decrypting header with NHKr: " + hex(state.nhkr))
  const headerCipherInput = concat(ehBody, ehAuthTag)
  const headerCipher = gcm(state.nhkr, ehIV, state.assocData)
  const decryptedHeader = headerCipher.decrypt(headerCipherInput)
  console.log("[DIAG] Header decrypted: " + decryptedHeader.length + "B")

  // Step 4: Parse MsgHeader
  const msgHeader = parseMsgHeader(decryptedHeader)

  // Step 5: AdvanceRatchet (two rootKdf + new keypair)
  // 5a: Receiving chain
  const dhRecv = x448.scalarMult(state.dhSelf.privateKey, msgHeader.peerDhRaw)
  console.log("[DIAG] AdvanceRatchet dhRecv: " + hex(dhRecv))
  const [newRK1, ckr, nhkrNew] = rootKdf(state.rootKey, dhRecv)
  console.log("[DIAG] rootKdf recv: newRK=" + hex(newRK1) + ", ckr=" + hex(ckr))

  // 5b: Generate new DH keypair
  const newDhSelf = generateX448KeyPair()

  // 5c: Sending chain
  const dhSend = x448.scalarMult(newDhSelf.privateKey, msgHeader.peerDhRaw)
  console.log("[DIAG] AdvanceRatchet dhSend: " + hex(dhSend))
  const [newRK2, cks, nhksNew] = rootKdf(newRK1, dhSend)
  console.log("[DIAG] rootKdf send: newRK=" + hex(newRK2) + ", cks=" + hex(cks))

  // Step 6: chainKdf
  const [newCKr, messageKey, bodyIV, _headerIV] = chainKdf(ckr)
  console.log("[DIAG] chainKdf: mk=" + hex(messageKey) + ", bodyIV=" + hex(bodyIV))

  // Step 7: Decrypt body
  // AAD = assocData (112B) + raw emHeader bytes
  const bodyAAD = concat(state.assocData, emHeaderRaw)
  console.log("[DIAG] Body AAD: " + bodyAAD.length + "B (assocData " + state.assocData.length + " + emHeader " + emHeaderRaw.length + ")")

  const bodyCipherInput = concat(emBody, emAuthTag)
  const bodyCipher = gcm(messageKey, bodyIV, bodyAAD)
  const decryptedBody = bodyCipher.decrypt(bodyCipherInput)
  console.log("[DIAG] Body decrypted: " + decryptedBody.length + "B")

  // Step 8: unPad
  const agentMessage = unPad(decryptedBody)
  console.log("[DIAG] AgentMessage: " + agentMessage.length + "B, tag=0x" + agentMessage[0].toString(16))

  // Step 9: Update state
  const updatedState: RatchetState = {
    rootKey: newRK2,
    ckr: newCKr,
    cks,
    hks: state.nhks,
    hkr: state.nhkr,
    nhks: nhksNew,
    nhkr: nhkrNew,
    dhSelf: newDhSelf,
    dhPeer: msgHeader.peerDhRaw,
    pn: state.ns,
    nr: msgHeader.msgNs + 1,
    ns: 0,
    assocData: state.assocData,
  }

  return {agentMessage, updatedState}
}
