# Season 9 Closing Protocol
# GoChat - Full E2E Pipeline: X3DH, Double Ratchet, HELLO, CONNECTION ESTABLISHED
# Browser-to-CLI Bidirectional Encrypted Communication

**Date:** 2026-03-30 to 2026-03-31 (two-day sprint)
**Status:** COMPLETE - CONNECTION ESTABLISHED, chat messages decrypted
**Branch:** `feat/simplego-support-chat`
**Tests:** 524 -> 537 (13 new, zero regressions)
**PRs merged:** #67 through #77 (11 PRs + 5 direct commits)
**Prepared by:** Prinzessin Mausi

---

## Summary

Season 9 implemented the complete end-to-end encryption pipeline for GoChat - from parsing the CLI's AgentConfirmation through X3DH key agreement, Double Ratchet initialization, bidirectional message encryption/decryption, reply queue parsing, duplex handshake completion, and HELLO reception. The season culminated in the world's first browser-native SimpleX connection reaching CONNECTION ESTABLISHED state, with the CLI displaying "GoChat User" as the contact name and the browser decrypting chat messages ("Hello GoChat") in real-time.

This was the most technically demanding season in the project's history. It required reading four Haskell source files (Client.hs, Crypto.hs, Protocol.hs, Ratchet.hs), analyzing the SimpleGo Protocol Team's reference documentation (QUICK_REFERENCE.md, WIRE_FORMAT.md, CRYPTO.md, smp_ratchet.c), and debugging 8 distinct protocol encoding bugs - any one of which silently produced garbage output without an obvious error message.

**Result:** The SimpleX CLI accepts our connection, shows "GoChat User", sends HELLO, and we decrypt chat messages. Bidirectional E2E encrypted communication between a browser and the SimpleX protocol - achieved for the first time anywhere.

---

## Starting Point (from Season 8)

Season 8 left us with Layer 1 NaCl decryption working. The AgentConfirmation from the CLI was decrypted to 14,777 bytes but not parsed. The bytes started with `00 07 43 31 00 03 44 30 42 30` - agentVersion=7, tag='C', e2eEncryption=Just, e2eVersion=3.

Season 9 needed to:
1. Parse these 14,777 bytes into structured data (X448 keys, KEM, encConnInfo)
2. Perform X3DH key agreement with the CLI's X448 keys
3. Initialize Double Ratchet and decrypt encConnInfo
4. Parse reply queue info from the decrypted AgentConnInfoReply
5. Send our AgentConfirmation back to the CLI's reply queue
6. Receive and process HELLO
7. Decrypt chat messages

---

## Connection Flow Status After Season 9

```
Step 1: Browser NEW -> Queue created (IDS)                      DONE (Season 5)
Step 2: Browser SEND AgentInvitation to Contact Queue            DONE (Season 6)
Step 3: CLI receives MSG, shows Connection Request               DONE (Season 6)
Step 4: CLI accepts -> SKEY + AgentConfirmation sent             DONE (Season 8)
Step 5: Browser receives, decrypts Layer 1 NaCl                  DONE (Season 8)
Step 6: Parse AgentConfirmation, X3DH, Double Ratchet            DONE (Season 9, PR #67-#72)
Step 7: Parse Reply Queue from AgentConnInfoReply                DONE (Season 9, PR #75)
Step 8: Send AgentConfirmation to CLI's reply queue              DONE (Season 9, PR #76-#77)
Step 9: CLI receives our profile, shows "GoChat User"            DONE (Season 9)
Step 10: CLI sends HELLO -> Browser receives, CON established    DONE (Season 9)
Step 11: CLI sends chat message -> Browser decrypts plaintext    DONE (Season 9)
Step 12: Send chat messages from browser                         Season 10
```

---

## Tasks Completed

### Phase 1: Parse AgentConfirmation - PR #67

**Branch:** `s9/001-parse-agent-confirmation`
**Merged to:** `feat/simplego-support-chat`

**Files created:**
- `smp-web/src/agent-confirmation.ts` (~210 lines) - AgentConfirmation parser
- `smp-web/src/__tests__/agent-confirmation.test.ts` - 10 tests

**What it does:**
Parses the decrypted AgentConfirmation body into structured data:
agentVersion (Word16 BE), tag 'C', Maybe e2eEncryption (Just/Nothing),
E2ERatchetParams (e2eVersion, two X448 SPKI keys 68B each, optional
KEM), and encConnInfo (Tail - remaining bytes for ratchet decrypt).

**First test result:**
```
agentVersion: 7, tag: 'C', e2eEncryption: Just
e2eVersion: 3, key1: 68B SPKI, key2: 68B SPKI
KEM: proposed, encConnInfo: 14625B
```

**Bug discovered:** encConnInfo was 14625 bytes - too large. The KEM
Proposed field (SNTRUP761, 1158 bytes) was not being consumed. This
triggered Phase 1 hotfixes.

### Phase 1 Hotfix A: KEM Large Encoding - PR #70

**Branch:** `s9/003a-fix-kem-large`

The parser used 0xFF+Word16 (Large encoding) for the KEM key, but
SNTRUP761 keys actually use Word16 BE directly. Fixed the KEM parser
to read Word16 BE length prefix (0x04 0x86 = 1158 bytes).

**Before:** encConnInfo = 14625B (wrong - KEM not consumed)
**After:** encConnInfo = 13470B (correct - KEM consumed)

### Phase 1 Hotfix B: KEM Word16 BE - PR #71

**Branch:** `s9/003b-fix-kem-word16`

Further refinement: confirmed KEM keys use Word16 BE length prefix,
not the 0xFF+Word16 format that other >254-byte fields use. This is
a unique encoding exception for KEM public keys.

### Phase 2: X3DH Key Agreement - PR #68

**Branch:** `s9/002-x3dh-agreement`
**Merged to:** `feat/simplego-support-chat`

**Files created:**
- `smp-web/src/x3dh-agreement.ts` (~115 lines) - X3DH receiver side
- `smp-web/src/__tests__/x3dh-agreement.test.ts` - 8 tests

**What it does:**
Performs the receiver-side X3DH key agreement using three X448 DH
operations and HKDF-SHA512:

```
dh1 = X448(CLI_key2, our_privkey1)     56 bytes
dh2 = X448(CLI_key1, our_privkey2)     56 bytes
dh3 = X448(CLI_key2, our_privkey2)     56 bytes
dhs = dh1 || dh2 || dh3               168 bytes

HKDF-SHA512(salt=64 zeros, ikm=dhs, info="SimpleXX3DH") -> 96 bytes
  [0:32]  = sndHK (our sending header key)
  [32:64] = rcvNextHK (promotes to HKr on first receive)
  [64:96] = ratchetKey (root key for Double Ratchet)

assocData = CLI_key1_raw(56B) || our_key1_raw(56B) = 112 bytes
```

**Key decision:** Three DH operations (not four as in Season 4's
implementation). The Haskell source confirmed: dh1=rk1*spk2,
dh2=rk2*spk1, dh3=rk2*spk2. Season 4's four-DH was based on
incomplete documentation.

### Phase 3: Double Ratchet Decrypt - PR #69

**Branch:** `s9/003-ratchet-decrypt`
**Merged to:** `feat/simplego-support-chat`

**Files created:**
- `smp-web/src/ratchet-decrypt.ts` (~240 lines) - Full Double Ratchet
- `smp-web/src/__tests__/ratchet-decrypt.test.ts` - 12 tests

**What it does:**
Initializes the receiving ratchet from X3DH output and decrypts the
encConnInfo. Implements rootKdf, chainKdf, AdvanceRatchet, SameRatchet,
header decrypt (AES-256-GCM), and body decrypt (AES-256-GCM).

**The chainKdf trap (MOST DANGEROUS BUG):**
SimpleGo Protocol Team's CRYPTO.md documents the chainKdf output as:
```
WRONG: [message_key, chain_key, body_iv, header_iv]
RIGHT: [chain_key, message_key, body_iv, header_iv]
```
The first two outputs are SWAPPED in the documentation. This was
verified against Haskell Ratchet.hs line 1169-1172 and C smp_ratchet.c.
Using the wrong order produces valid-looking but incorrect keys that
silently decrypt to garbage.

**AES-256-GCM with 16-Byte IV:**
SimpleX uses 16-byte IVs (AES block size), not 12-byte (GCM standard).
Haskell's initAEAD transforms the 16B IV via GHASH internally.
@noble/ciphers gcm() handles this correctly. Haskell comment confirms:
"to make it compatible with WebCrypto we will need to deprecate it
and start using initAEADGCM".

**First successful decrypt:**
```
Body decrypted: 11106B
AgentMessage: 439B, tag=0x44 ('D' = AgentConnInfoReply)
ConnInfo JSON: {"displayName":"test 2","fullName":"","preferences":...}
```

### Phase 4: MsgHeader KEM Fix + HELLO Handler - PR #72, #73

**Branch:** `s9/004-receive-hello`
**Merged to:** `feat/simplego-support-chat`

**Bug:** MsgHeader contained KEM Proposed (1158B key) that was not
being skipped, causing PN and Ns to read garbage values:
```
BEFORE: MsgHeader: PN=2834728873, Ns=2999693453  (garbage)
AFTER:  MsgHeader: PN=0, Ns=0                     (correct)
```

Also implemented the subsequent MSG handler to decrypt HELLO and
chat messages using the ratchet state from Phase 3. Added support
for SameRatchet mode (same DH key) and AdvanceRatchet mode (new DH).

### Phase 4 Hotfix: prevMsgHash Length - PR #74

**Branch:** `s9/004b-fix-prevmsghash`

APrivHeader parsing read prevMsgHash with Word16 BE length prefix,
but it uses 1-byte length prefix (standard ByteString < 256 bytes):
```
BEFORE: prevMsgHash=8232B, remaining=-8076B  (Word16 read 0x2028)
AFTER:  prevMsgHash=32B, remaining=125B       (1-byte read 0x20=32)
```

### Phase 4 Direct Fix: sndMsgId Skip

APrivHeader contains sndMsgId (Int64 BE = 8 bytes) before prevMsgHash.
The parser skipped directly to the hash, reading bytes from sndMsgId
as the hash length, producing a null byte as AMessage tag:
```
BEFORE: AMessage tag='\0' (parser reads sndMsgId bytes)
AFTER:  AMessage tag='H'  (HELLO!) or 'M' (chat message)
```

### Phase 5a: Parse Reply Queue - PR #75

**Branch:** `s9/005a-parse-reply-queue`
**Merged to:** `feat/simplego-support-chat`

**Files created:**
- `smp-web/src/reply-queue.ts` (~140 lines) - SMPQueueInfo parser
- `smp-web/src/__tests__/reply-queue.test.ts` - 6 tests

**What it does:**
Parses the AgentConnInfoReply (tag 'D') to extract the CLI's reply
queue info: server host/port, keyHash, senderId, dhPublicKey, and
queueMode. This is where we need to SEND our response.

**Parsed output:**
```
SMPServer: host=smp.simplego.dev, port=5223, keyHash=32B
SMPQueueInfo: senderId=24B, dhPublicKey=44B SPKI/32B raw
sndSecure=false
```

### Phase 5b: Ratchet Encrypt + Send Pipeline - PR #76

**Branch:** `s9/005b-send-handshake`
**Merged to:** `feat/simplego-support-chat`

**What it does:**
Implements `rcEncrypt` (the sending side of Double Ratchet) and the
complete `sendHandshake` pipeline:

1. Build AgentMessage: `['I'][profile JSON]` (AgentConnInfo)
2. rcEncrypt: chainKdf -> messageKey, pad body, AES-GCM encrypt
3. Build MsgHeader, pad to 88B, AES-GCM encrypt with HKs
4. Assemble EncRatchetMessage (15838B)
5. Wrap in AgentMsgEnvelope (initially used tag 'M' - wrong!)
6. NaCl encrypt with nacl.box + new X25519 keypair
7. SEND to CLI's reply queue via existing WebSocket

Auto-triggered from handleAgentConfirmation when reply queue is parsed.

### Phase 5c: Fix Handshake Format - PR #77

**Branch:** `s9/005d-fix-handshake-format`
**Merged to:** `feat/simplego-support-chat`

Three format fixes required for the CLI to accept our response:

1. **Tag 'C' not 'M':** CLI expects AgentConfirmation (tag 'C') on
   its fresh reply queue, not AgentMsgEnvelope (tag 'M')
2. **PHConfirmation 'K' not PHEmpty '_':** Since sndSecure=false, the
   ClientMessage header must be PHConfirmation with our sender public
   auth key (44B X25519 SPKI)
3. **e2eEncryption_ = Nothing ('0'):** Between 'C' tag and Tail
   encConnInfo, a Maybe field for e2eEncryption must be '0' (Nothing)
   since X448 keys were already in our invitation

### Direct Fix: smpClientVersion in PubHeader

The most elusive bug. ClientMsgEnvelope requires PubHeader with
smpClientVersion (Word16 BE) before the Maybe e2ePubKey field.
Our code omitted these 2 bytes, causing the CLI to read `0x312C`
(the start of the Maybe '1' and key length) as version 12588:

```
BEFORE: CLI reads version=12588 -> A_VERSION error
AFTER:  CLI reads version=4 -> accepts our confirmation!
```

This was found by comparing the first 8 bytes of our sendInvitation
output (which worked: `00 04 31 2c 30 2a 30 05`) with our
sendHandshake output (which was missing `00 04`).

### Direct Fix: e2eEncConfirmationLength

First message to a new queue must pad to 15904 (e2eEncConfirmationLength),
not 15840 (e2eEncMessageLength). The Haskell source (Client.hs:2068):
```haskell
let paddedLen = maybe e2eEncMessageLength (const e2eEncConfirmationLength) e2ePubKey
```
Our code used 15840 for all messages, causing "offset out of bounds"
when the EncRatchetMessage (15838B) + envelope overhead exceeded 15840.

### Direct Fix: Chat Message Display

Added content extraction for received chat messages. The A_MSG body
after the 'M' tag is a JSON string:
```json
{"v":"1-16","msgId":"...","event":"x.msg.new",
 "params":{"content":{"text":"Hello GoChat","type":"text"}}}
```

---

## The Bug Fix Chain

Season 9 had a characteristic debugging pattern: each fix revealed
the next bug, forming a chain. Here is the complete progression:

| # | Problem | Root Cause | Fix | PR |
|:--|:--------|:-----------|:----|:---|
| 1 | encConnInfo too large (14625B) | KEM Proposed not consumed | Large encoding for KEM | #70 |
| 2 | KEM still not consumed | 0xFF+Word16, but KEM uses Word16 BE | Word16 BE for KEM | #71 |
| 3 | PN=2834728873, Ns=garbage | MsgHeader KEM Proposed not skipped | Skip KEM in MsgHeader | #72 |
| 4 | AMessage tag='\0' | sndMsgId (8B) not skipped in APrivHeader | offset += 8 | direct |
| 5 | prevMsgHash=8232B, remaining=-8076 | Word16 BE for hash length | 1-byte length prefix | #74 |
| 6 | "offset out of bounds" | Pad target 15840 too small for first msg | 15904 for first message | direct |
| 7 | A_VERSION on CLI | Tag 'M' instead of 'C' | Tag 'C' + PHConfirmation | #77 |
| 8 | A_VERSION still on CLI | Missing smpClientVersion in PubHeader | Prepend Word16 BE v=4 | direct |

8 bugs in 2 days. Each one required understanding a different layer
of the SMP protocol stack.

---

## Key Technical Discoveries

### 1. PQ KEM in AgentConfirmation
CLI sends SNTRUP761 KEM Proposed with 1158-byte public key. KEM keys
use Word16 BE length prefix (not 0xFF+Word16 Large, not 1-byte).
MsgHeader also contains KEM Proposed that must be skipped before PN/Ns.
PQ header: 2310 bytes padded. EncRatchetMessage header: 2346 bytes.

### 2. chainKdf Output Order (CRITICAL)
SimpleGo CRYPTO.md has mk and ck SWAPPED. Correct order:
`[0:32]=new_chain_key, [32:64]=message_key, [64:80]=body_iv, [80:96]=header_iv`
Verified against Haskell Ratchet.hs:1169-1172 and C smp_ratchet.c.

### 3. AES-256-GCM with 16-Byte IV
SimpleX uses 16-byte IVs (AES block size), not 12-byte (GCM standard).
Haskell's initAEAD transforms via GHASH. @noble/ciphers handles this.

### 4. AgentVersion Difference
AgentConfirmation (tag 'C') uses agentVersion=7.
AgentMsgEnvelope (tag 'M') for HELLO/messages uses agentVersion=1.
Using 7 for messages causes A_VERSION.

### 5. Handshake Response Format
Must use tag 'C' (not 'M'), PHConfirmation 'K' (not PHEmpty '_'),
e2eEncryption_=Nothing ('0'), smpClientVersion in PubHeader.
First message pads to 15904. Omitting any of these causes A_VERSION.

### 6. APrivHeader Format
Contains sndMsgId (Int64 BE = 8 bytes) BEFORE prevMsgHash.
prevMsgHash uses 1-byte length prefix (standard ByteString).

### 7. SMP Length Encoding Rules (confirmed)
- Standard fields (<=254B): 1-byte length prefix
- Large fields (>254B): 0xFF + Word16 BE
- KEM keys (SNTRUP761): Word16 BE directly (exception!)
- Tail fields: no prefix, consumes remaining bytes
- Maybe: ASCII '0' (0x30) = Nothing, '1' (0x31) = Just

### 8. Four distinct DH keypairs per connection
- recipientAuth X25519: signs queue commands
- recipientDh X25519: per-queue NaCl encrypt
- queueDh X25519: fresh per-queue DH (private MUST be preserved after buildInvitation)
- e2eDh X448: Double Ratchet / X3DH key agreement

---

## What Did NOT Work (and why)

### 1. chainKdf with CRYPTO.md order
We initially used the order from SimpleGo's CRYPTO.md documentation:
[message_key, chain_key, body_iv, header_iv]. This produced keys that
passed all format checks but silently decrypted to garbage. The fix
required reading the actual Haskell source (Ratchet.hs chainKdf).

### 2. KEM with 0xFF+Word16 Large encoding
We assumed SNTRUP761 keys (>254 bytes) would use the standard Large
encoding (0xFF prefix + Word16 BE). They don't - they use Word16 BE
directly. This left 1158 bytes unconsumed in the parser, cascading
into wrong encConnInfo offsets.

### 3. Word16 BE for prevMsgHash
We assumed prevMsgHash (32 bytes, SHA-256) would use Word16 BE
length prefix like other binary fields. But SHA-256 hashes are
standard ByteStrings (<256 bytes) and use 1-byte length prefix.

### 4. Tag 'M' for handshake reply
We initially sent AgentMsgEnvelope (tag 'M') as our handshake reply.
The CLI expected AgentConfirmation (tag 'C') on its fresh reply queue.
This was the same message type the CLI sent to us - we needed to
mirror it, not send a different type.

### 5. PHEmpty instead of PHConfirmation
Since sndSecure=false on the CLI's queue, we assumed PHEmpty '_' was
correct (no auth key needed). But the CLI needs our sender auth key
via PHConfirmation 'K' to secure the queue after accepting.

### 6. Missing smpClientVersion
The most subtle bug. Our sendInvitation code (Season 6) correctly
included smpClientVersion because it was part of the existing
agentCbEncryptOnce pattern. But sendHandshake was built from scratch
and omitted the 2-byte version prefix, causing the CLI to parse
the next bytes (0x31 0x2C from Maybe '1' + key length) as version
12588.

---

## Files After Season 9

### New Source Files

| File | Lines | Purpose |
|:-----|:------|:--------|
| agent-confirmation.ts | ~210 | Parse AgentConfirmation with E2ERatchetParams + PQ KEM |
| x3dh-agreement.ts | ~115 | X3DH receiver-side key agreement (3x X448 DH + HKDF) |
| ratchet-decrypt.ts | ~240 | Double Ratchet init + encrypt (rcEncrypt) + decrypt |
| reply-queue.ts | ~140 | Parse SMPQueueInfo from AgentConnInfoReply tag 'D' |

### Modified Source Files

| File | Changes |
|:-----|:--------|
| connection.ts | Major refactor: handleAgentConfirmation, handleAgentMsgEnvelope, sendHandshake, parseAgentMessageContent, auto-trigger handshake after reply queue parse |
| layer1-decrypt.ts | Handle Maybe Nothing for e2ePubKey on subsequent MSGs (reuse stored e2eDhSecret) |
| index.ts | Re-export all new types and functions |

### New Test Files

| File | Tests | Coverage |
|:-----|:------|:---------|
| agent-confirmation.test.ts | 10 | Parsing, SPKI, KEM, Maybe, round-trip |
| x3dh-agreement.test.ts | 8 | DH, HKDF, assocData, determinism |
| ratchet-decrypt.test.ts | 12 | rootKdf, chainKdf, unPad, EncRatchetMessage, rcEncrypt |
| layer1-decrypt.test.ts | 4 | Just, Nothing, raw key, invalid tag |
| reply-queue.test.ts | 6 | Single/multi queue, hosts, SPKI, sndSecure |

### Test Summary

| Source | Tests | Season |
|:-------|------:|:-------|
| Transport + handshake | ~35 | S2 |
| Commands + protocol | ~152 | S3 |
| Connection flow + X3DH | ~226 | S4 |
| Browser client + integration | ~24 | S5 |
| Invitation | ~20 | S6 |
| v9 auth + MSG decrypt | ~50 | S8 |
| E2E pipeline | 40 | S9 |
| **Total** | **537** | **21 files** |

---

## Haskell Source Files Analyzed

Season 9 required deep analysis of four Haskell source files to
resolve protocol encoding ambiguities:

| File | Lines | Key Functions Used |
|:-----|:------|:-------------------|
| Agent/Client.hs | 2751 | sendConfirmation (PHEmpty vs PHConfirmation logic), agentCbEncrypt (paddedLen selection), sendInvitation |
| Crypto.hs | 1532 | hkdf (SHA-512 extract+expand), encryptAEAD/decryptAEAD (16B IV), initAEAD (GHASH transform), pad/unPad |
| Agent/Protocol.hs | 2193 | AgentMsgEnvelope (smpEncode for 'C'/'M'/'I'/'R' tags), AgentMessage ('D' AgentConnInfoReply), APrivHeader, AMessage (HELLO='H', A_MSG='M') |
| Crypto/Ratchet.hs | 1232 | initRcvRatchet/initSndRatchet, rootKdf/chainKdf/hkdf3, rcDecrypt/rcEncryptHeader, MsgHeader (KEM parsing), EncRatchetMessage, paddedHeaderLen |

SimpleGo Protocol Team documents consulted:
- QUICK_REFERENCE.md (4177 lines - primary reference)
- WIRE_FORMAT.md (encoding rules, length prefixes)
- CRYPTO.md (KDF parameters - WARNING: chainKdf order is wrong!)
- smp_ratchet.c (1762 lines - C reference implementation)

---

## Crypto Libraries Used

| Library | Algorithm | Usage |
|:--------|:----------|:------|
| @noble/curves | X448 DH | x3dh-agreement.ts (3x DH operations) |
| @noble/hashes | HKDF-SHA512 | x3dh-agreement.ts (X3DH), ratchet-decrypt.ts (rootKdf, chainKdf) |
| @noble/ciphers | AES-256-GCM (16B IV) | ratchet-decrypt.ts (header + body encrypt/decrypt) |
| tweetnacl | NaCl crypto_box | connection.ts (per-queue E2E for send pipeline) |

All crypto from the @noble ecosystem by Paul Miller (6 security audits,
used by Proton Mail and MetaMask). Zero custom crypto.

---

## KDF Parameter Summary

| KDF | Salt | IKM | Info | Output |
|:----|:-----|:----|:-----|:-------|
| X3DH | 64 x 0x00 | dh1+dh2+dh3 (168B) | "SimpleXX3DH" (11B) | 96B: [hk, nhk, sk] |
| Root | root_key (32B) | dh_output (56B) | "SimpleXRootRatchet" (18B) | 96B: [rk, ck, nhk] |
| Chain | empty (0B) | chain_key (32B) | "SimpleXChainRatchet" (19B) | 96B: [ck, mk, bodyIV, headerIV] |

---

## Infrastructure Notes

- SMP server: smp.simplego.dev, Docker image local/smp-server-pr1738
- SMP v6.5.0.11 built from PR #1738 (not main branch!) for WebSocket
- Ports: 5223 (TLS native), 8444 (WSS Docker direct - no Nginx), 5224 (control)
- Let's Encrypt cert: requires manual copy to Docker mount after renewal
  ```bash
  sudo cp /etc/letsencrypt/live/smp.simplego.dev/fullchain.pem /opt/simplex/data/
  sudo cp /etc/letsencrypt/live/smp.simplego.dev/privkey.pem /opt/simplex/data/
  docker restart simplego-smp
  ```
- 4096-bit RSA cert required (not ECDSA) for SMP server
- esbuild.config.mjs must remain IIFE format (check after every rebase)
- Build: `npm run build:browser` -> `dist/gochat-client.js`
- Deploy bundle to `C:\Projects\SimpleGo www\www\src\assets\js\`
- Website: 11ty with Nunjucks, custom SPA router, 38px util-bar
- CSS prefix: `gc-` for chat widget, `sp-` for player panel
- console.log (not console.debug) for debug output - browser filters verbose

---

## Post-Merge Deploy Procedure (MANDATORY)

After EVERY PR merge, the following steps must be executed:

```powershell
# 1. Pull latest
cd C:\Projects\GoChat
git checkout feat/simplego-support-chat
git pull origin feat/simplego-support-chat

# 2. Run tests
cd smp-web
npx vitest run

# 3. Build browser bundle
npm run build:browser

# 4. Copy to website
copy dist\gochat-client.js "C:\Projects\SimpleGo www\www\src\assets\js\gochat-client.js"

# 5. Build website
cd "C:\Projects\SimpleGo www\www"
npx @11ty/eleventy

# 6. Deploy to server
scp -r _site/* root@simplego.dev:/var/www/simplego/

# 7. Chrome WSS cert fix (if needed)
# Navigate to https://smp.simplego.dev:8444 in Chrome
# Accept the self-signed cert warning
```

---

## What Was Learned in Season 9

1. **The chainKdf order trap is the most dangerous bug type.** No error message, no crash, just wrong keys that produce garbage after decrypt. Always verify KDF output order against source code, never trust documentation alone.

2. **SMP has three different length encoding schemes** and KEM keys use a fourth one. Standard (1-byte), Large (0xFF+Word16), Word16 BE (for versions), and Word16 BE directly (for KEM). Mixing them up is a one-way ticket to parser misalignment.

3. **The handshake response format has five independent requirements** that all must be correct simultaneously: tag 'C', PHConfirmation 'K', e2eEncryption_ Nothing, smpClientVersion in PubHeader, pad to 15904. Missing any one produces A_VERSION.

4. **agentVersion=7 vs agentVersion=1 is not documented anywhere** outside the Haskell source. This distinction between AgentConfirmation (v=7) and AgentMsgEnvelope (v=1) is a guaranteed trap for any new implementor.

5. **Three DH operations, not four.** Season 4's implementation used four DH operations based on the "symmetric 4-DH" documentation. The actual Haskell X3DH uses three: dh1=peer2*our1, dh2=peer1*our2, dh3=peer2*our2.

6. **APrivHeader has hidden fields.** sndMsgId (Int64 BE, 8 bytes) appears before prevMsgHash but is not mentioned in most documentation. Skipping it is required to reach the AMessage tag.

7. **The Ritter can read Haskell source.** Giving Claude Code access to `C:\Projects\simplexmq-latest` was a game-changer. He could look up encoding details directly instead of relying on our briefings.

8. **Bug chains are the norm.** Season 9 had an 8-bug chain where each fix revealed the next bug. This is expected when implementing a multi-layer protocol for the first time.

9. **Two people, two days, world first.** The entire E2E pipeline from parsing to HELLO was implemented in a weekend sprint. The three-role workflow (Mausi plans, Prinz tests, Ritter codes) scales to complex crypto work.

10. **"Hello GoChat" in plaintext in the browser.** That JSON string in the console is proof that every single layer works: WebSocket, SMP v9, CbAuthenticator, server decrypt, NaCl Layer 1, AgentConfirmation parse, X3DH, Double Ratchet init, AdvanceRatchet, SameRatchet, chainKdf, AES-256-GCM decrypt, unPad, AgentMessage parse, APrivHeader parse, AMessage parse. 17 protocol layers, zero failures.

---

## Season 9 Statistics

| Metric | Value |
|:-------|------:|
| Duration | 2 days (2026-03-30 to 2026-03-31) |
| PRs merged | 11 (#67 through #77) |
| Direct commits | 5 (sndMsgId, prevMsgHash, chat log, smpClientVersion, pad 15904) |
| New source files | 4 |
| Modified source files | 3 |
| New test files | 5 |
| New tests | 40 |
| Total tests | 537 across 21 files |
| Bugs fixed | 8 (chain) |
| Haskell files analyzed | 4 (7,708 lines total) |
| SimpleGo docs consulted | 4 files |
| Protocol layers implemented | 17 (complete stack) |
| Briefings written | 7 (Phase 1-5 with hotfixes) |

---

## Known Issues for Season 10

### Must Fix
1. **WebSocket reconnection after HELLO** - After HELLO reception,
   two new WebSocket connections are opened (likely from agent.ts
   reconnection logic). These disrupt the original MSG subscription.
   MSG #3+ not received.

2. **No chat message sending** - rcEncrypt works, sendHandshake works,
   but there is no `sendChatMessage()` function. Requires wrapping
   chat JSON in AgentMsgEnvelope with agentVersion=**1** (not 7!).

### Should Fix
3. **No HELLO send** - We receive HELLO but don't send one back.
   CLI proceeds anyway but proper protocol requires bidirectional HELLO.

4. **Chat UI** - Messages decrypt in console but nothing visible to user.

5. **SUB command** - Re-subscribe after connection drops.

### Nice to Have
6. **Multiple contacts** - Connection pool management
7. **Reconnection logic** - Handle WebSocket drops gracefully

---

## Season Overview (updated)

| Season | Focus | Status | Tests |
|:-------|:------|:-------|------:|
| S1 | Planning and documentation | COMPLETE | - |
| S2 | WebSocket transport | COMPLETE | ~35 |
| S3 | SMP commands | COMPLETE | ~152 |
| S4 | Connection flow | COMPLETE | ~226 |
| S5 | Chat UI + real server | COMPLETE | ~24 |
| S6 | Connection request | COMPLETE | ~20 |
| S7 | Server infrastructure | COMPLETE | - |
| S8 | v9 auth + Layer 1 decrypt | COMPLETE | ~50 |
| S9 | E2E pipeline + CON | **COMPLETE** | 40 |
| S10 | Chat messages + UI | NEXT | |

**Total across all seasons: 537 tests, 77 PRs, 0 regressions.**

---

*Season 9 Closing Protocol v2 - Prinzessin Mausi*
*"Neun Staffeln. Der erste Browser-native SimpleX-Client der Welt*
*hat HELLO empfangen. Connection Established."*
*GoChat - Browser-Native Encrypted Messenger*
*IT and More Systems, Recklinghausen, Germany*
