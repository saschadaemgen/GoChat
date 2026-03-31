# Season 9 Closing Protocol
# GoChat - AgentConfirmation, X3DH, Double Ratchet, HELLO, CON
# Date: 2026-03-30 to 2026-03-31

---

## Season Summary

Season 9 implemented the complete E2E encryption pipeline for GoChat,
from AgentConfirmation parsing through X3DH key agreement, Double
Ratchet initialization, bidirectional message encryption/decryption,
and the full duplex handshake. The season culminated in the world's
first browser-native SimpleX connection reaching HELLO/CON state.

**Duration:** 2 days (2026-03-30 to 2026-03-31)
**PRs merged:** #67 through #77 (11 PRs + multiple direct commits)
**Tests:** 524 -> 537 (13 new tests, zero regressions)
**Status:** CONNECTION ESTABLISHED - HELLO received, chat messages decrypted

---

## What Works After Season 9

### Complete Receive Pipeline
1. WebSocket + SMP v9 Handshake (Season 5-8)
2. Queue creation + AgentInvitation (Season 6)
3. Server-level MSG decrypt (Season 8)
4. Layer 1 NaCl decrypt (Season 8)
5. AgentConfirmation parse with PQ KEM (Season 9, PR #67, #70, #71)
6. X3DH key agreement - receiver side (Season 9, PR #68)
7. Double Ratchet init + decrypt encConnInfo (Season 9, PR #69)
8. Reply Queue info parse from AgentConnInfoReply 'D' (Season 9, PR #75)
9. Subsequent MSG decrypt - SameRatchet mode (Season 9, PR #72)
10. HELLO receive + AdvanceRatchet (Season 9, PR #72)
11. Chat message decrypt + JSON display (Season 9, direct commit)

### Complete Send Pipeline
12. Ratchet encrypt - rcEncrypt (Season 9, PR #76)
13. AgentConfirmation format with tag 'C' (Season 9, PR #77)
14. PHConfirmation with sender auth key (Season 9, PR #77)
15. Per-queue E2E NaCl encrypt (Season 9, PR #76)
16. ClientMsgEnvelope with smpClientVersion (Season 9, direct fix)
17. SEND to CLI's reply queue (Season 9, PR #76)

### Verified End-to-End
- CLI profile JSON received: `{"displayName":"test 2",...}`
- CLI chat message decrypted: `{"text":"Hello GoChat","type":"text"}`
- CLI received our profile: changed contact to "GoChat User"
- CLI HELLO received: "bidirectional ratchet confirmed"
- AdvanceRatchet works in both directions (PN=1, Ns=0)

---

## PRs and Commits

### Pull Requests

| PR | Branch | Title | Key Achievement |
|:---|:-------|:------|:----------------|
| #67 | s9/001 | Parse AgentConfirmation | Extract X448 keys + encConnInfo |
| #68 | s9/002 | X3DH Key Agreement | Three X448 DH + HKDF("SimpleXX3DH") |
| #69 | s9/003 | Double Ratchet Decrypt | AES-256-GCM 16B IV, rootKdf, chainKdf |
| #70 | s9/003a | Fix KEM Large Encoding | SNTRUP761 1158B key not consumed |
| #71 | s9/003b | Fix KEM Word16 BE | KEM keys use Word16 BE, not 0xFF+Word16 |
| #72 | s9/004 | MsgHeader KEM + HELLO | Skip PQ KEM in header, receive handler |
| #73 | s9/004 | Merge for HELLO fixes | Branch merge |
| #74 | s9/004b | Fix prevMsgHash | 1-byte length prefix, not Word16 BE |
| #75 | s9/005a | Parse Reply Queue | SMPQueueInfo from AgentConnInfoReply 'D' |
| #76 | s9/005b | Send Handshake | rcEncrypt + full send pipeline |
| #77 | s9/005d | Fix Handshake Format | Tag 'C', PHConfirmation 'K', Maybe '0' |

### Direct Commits (on feat/simplego-support-chat)

| Fix | Description |
|:----|:------------|
| skip sndMsgId | APrivHeader has Int64 BE (8 bytes) before prevMsgHash |
| prevMsgHash 1-byte | Standard ByteString uses 1-byte length, not Word16 |
| chat message log | Display decrypted JSON content in console |
| smpClientVersion | ClientMsgEnvelope needs PubHeader(v=4, e2ePubKey) |
| e2eEncConfirmationLength | First message to new queue pads to 15904, not 15840 |

---

## Protocol Discoveries (Season 9)

### PQ KEM in AgentConfirmation
- CLI sends KEM Proposed with SNTRUP761 public key (1158 bytes)
- KEM keys use Word16 BE length prefix (not 0xFF+Word16 Large encoding)
- MsgHeader also contains KEM Proposed with 1158B key (must be skipped)
- PQ header: 2310 bytes padded (vs 88 bytes non-PQ)
- EncRatchetMessage header: 2346 bytes (vs 124 bytes non-PQ)

### AES-256-GCM with 16-Byte IV
- SimpleX Double Ratchet uses 16-byte IVs (not standard 12-byte)
- Haskell's `initAEAD` transforms 16B IV via GHASH internally
- `@noble/ciphers` gcm() handles non-12-byte IVs correctly
- Haskell comment confirms: "to make it compatible with WebCrypto
  we will need to deprecate it and start using initAEADGCM"

### chainKdf Output Order
- CRYPTO.md from SimpleGo Protocol Team has mk and ck SWAPPED
- Correct order (verified Haskell + C): [newCK, mk, bodyIV, headerIV]
- This was the single most dangerous trap in Season 9

### AgentConfirmation Response Format
- Must use tag 'C' (not 'M') for handshake reply
- PHConfirmation 'K' with sender auth key (not PHEmpty '_')
- e2eEncryption_ = Nothing ('0') since X448 keys already in invitation
- ClientMsgEnvelope needs PubHeader(smpClientVersion=4, e2ePubKey=Just)
- First message pads to 15904 (e2eEncConfirmationLength)

### APrivHeader Format
- Contains sndMsgId (Int64 BE = 8 bytes) BEFORE prevMsgHash
- prevMsgHash uses 1-byte length prefix (standard ByteString)
- Not Word16 BE (which was the initial wrong assumption)

### HELLO Message Structure
- AgentMessage tag 'M' + APrivHeader + AMessage tag 'H'
- Only 1 byte for HELLO body (just the 'H' tag)
- Arrives via AdvanceRatchet (new DH key, PN=1, Ns=0)

---

## Architecture After Season 9

### New Files

| File | Lines | Purpose |
|:-----|:------|:--------|
| agent-confirmation.ts | ~210 | Parse AgentConfirmation with PQ KEM |
| x3dh-agreement.ts | ~115 | X3DH receiver-side key agreement |
| ratchet-decrypt.ts | ~240 | Double Ratchet init + encrypt + decrypt |
| reply-queue.ts | ~140 | Parse SMPQueueInfo from AgentConnInfoReply |

### Modified Files

| File | Changes |
|:-----|:--------|
| connection.ts | MSG handler refactored: handleAgentConfirmation, handleAgentMsgEnvelope, sendHandshake, parseAgentMessageContent |
| layer1-decrypt.ts | Handle Maybe Nothing for e2ePubKey on subsequent MSGs |
| index.ts | Re-export all new types and functions |

### Test Files

| File | Tests | Coverage |
|:-----|:------|:---------|
| agent-confirmation.test.ts | 10 | Parsing, SPKI, KEM, Maybe, round-trip |
| x3dh-agreement.test.ts | 8 | DH, HKDF, assocData, determinism |
| ratchet-decrypt.test.ts | 12 | rootKdf, chainKdf, unPad, EncRatchetMessage |
| layer1-decrypt.test.ts | 4 | Just, Nothing, raw key, invalid tag |
| reply-queue.test.ts | 6 | Single/multi queue, hosts, SPKI, sndSecure |

---

## What's Left for Season 10

### Must Fix
1. **WebSocket reconnection after HELLO** - New connections after HELLO
   disrupt the original subscription. MSG #3+ not received.
2. **Chat message display** - Messages arrive and decrypt but need UI

### Should Fix
3. **Send chat messages** - rcEncrypt works, just need UI trigger
4. **HELLO send** - We should send HELLO back to CLI after receiving theirs
5. **SUB command** - Re-subscribe after connection drops

### Nice to Have
6. **Multiple contacts** - Connection pool management
7. **Reconnection logic** - Handle WebSocket drops gracefully
8. **DIAG log cleanup** - Remove verbose logging for production

---

## Crypto Libraries Used

| Library | Purpose | Season 9 Usage |
|:--------|:--------|:---------------|
| @noble/curves | X448 DH | x3dh-agreement.ts |
| @noble/hashes | HKDF-SHA512 | x3dh-agreement.ts, ratchet-decrypt.ts |
| @noble/ciphers | AES-256-GCM (16B IV) | ratchet-decrypt.ts |
| tweetnacl | NaCl crypto_box | connection.ts (send pipeline) |

---

## KDF Parameter Summary

| KDF | Salt | IKM | Info | Output |
|:----|:-----|:----|:-----|:-------|
| X3DH | 64 x 0x00 | dh1+dh2+dh3 (168B) | "SimpleXX3DH" (11B) | 96B: [hk,nhk,sk] |
| Root | root_key (32B) | dh_output (56B) | "SimpleXRootRatchet" (18B) | 96B: [rk,ck,nhk] |
| Chain | empty (0B) | chain_key (32B) | "SimpleXChainRatchet" (19B) | 96B: [ck,mk,bodyIV,headerIV] |

---

*Season 9 Closing Protocol - Prinzessin Mausi*
*"Neun Staffeln. Der erste Browser-native SimpleX-Client der Welt
 hat HELLO empfangen. Connection Established."*
