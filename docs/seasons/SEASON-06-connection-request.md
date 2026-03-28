# Season 6 Closing Protocol
# Browser-to-App Connection Request: First Working AgentInvitation

**Date:** 2026-03-28
**Status:** COMPLETE - Connection request visible in SimpleX App
**Branch:** `feat/simplego-support-chat`
**Tests:** 493 pass, 3 skipped
**PRs merged:** #39, #42, #44, #45 (plus multiple direct pushes for rapid iteration)

---

## Summary

Season 6 achieved the first successful connection request from a browser to the SimpleX App. A website visitor clicking "Start Encrypted Chat" now generates a "New contact request" notification in the support team's SimpleX application. This is Step 2 of the 7-step SimpleX connection flow and marks GoChat as the world's first browser-native SMP client to successfully communicate with the SimpleX ecosystem.

The season was dominated by protocol debugging - discovering that the joining party must send an AgentInvitation (tag 'I' with PHEmpty '_'), not an AgentConfirmation (tag 'C' with PHConfirmation 'K'). This fundamental architectural discovery required analysis of the Haskell source code (simplexmq repository) and invalidated assumptions carried from Season 4.

---

## What Season 6 Accomplished

### Step 1 (from Season 5): Queue creation
Browser connects via WebSocket, completes SMP v6 handshake, sends NEW command, receives IDS response. Queue created on real server.

### Step 2 (Season 6): Connection request accepted by SimpleX App
Browser sends SEND command with AgentInvitation to the contact queue. The SimpleX App receives, decrypts, parses, and displays "Website Visitor - New contact request."

### Connection flow status after Season 6

```
Step 1: Browser NEW -> Queue created (IDS)              DONE (Season 5)
Step 2: Browser SEND AgentInvitation to Contact Queue    DONE (Season 6)
Step 3: App receives MSG, shows Connection Request       DONE (Season 6)
Step 4: App accepts -> Connection error (AUTH)            PARTIAL (Season 7)
Step 5: Browser receives confirmation                     Season 7
Step 6: Both exchange HELLO messages                      Season 7
Step 7: Both reach CON -> "CONNECTED"                     Season 7
```

---

## The Journey: From Empty SEND to Working Invitation

Season 6 was a marathon of protocol debugging. Here is the complete fix progression:

| # | Problem | Root Cause | Fix |
|---|---------|------------|-----|
| 1 | SEND body empty (93B) | sendConnectionRequest() never called | Wire up sendInvitation() after IDS |
| 2 | SEND body wrong size (16008B) | Wrong padding sizes | Correct to 14832/15904 from Haskell constants |
| 3 | A_CRYPTO | xsalsa20poly1305 without HSalsa20 | Use nacl.box() (includes DH + HSalsa20 + XSalsa20) |
| 4 | A_CRYPTO | Full Ratchet encryption for first SEND | Remove Ratchet - encConnInfo is plaintext for initial contact |
| 5 | A_MESSAGE | Wrong message type entirely | AgentInvitation ('I') not AgentConfirmation ('C') |
| 6 | A_MESSAGE | PHConfirmation ('K') with Ed25519 SPKI | PHEmpty ('_') - single byte, no auth key |
| 7 | A_MESSAGE | SMPQueueInfo binary struct in encConnInfo | connReq URI string instead |
| 8 | A_MESSAGE | Missing dh= in SMP queue URI | Add X25519 DH public key to queue URI |
| 9 | A_MESSAGE | Wrong e2e format (dh= with X25519) | x3dh= with two X448 keys (comma separated) |
| 10 | A_MESSAGE | Wrong version ranges (v=1-4) | Agent v=2-7, e2e v=2-3 |
| 11 | A_MESSAGE | Missing q=m in SMP queue URI | Add QMMessaging marker |
| 12 | A_MESSAGE | Missing port in SMP queue URI | Add explicit port 5223 |

12 fixes across approximately 18 hours of debugging. The most impactful discovery was #5 - the joining party sends a completely different message type than the contact address owner.

---

## Key Technical Discoveries

### 1. AgentInvitation vs AgentConfirmation

The SimpleX protocol has two distinct agent message types for connection establishment:

```
Contact Address OWNER responds with:
  AgentConfirmation: 'K' + Ed25519 SPKI + agentVersion + 'C' + E2E params + Ratchet-encrypted encConnInfo

Joining Party (scanning a link) sends:
  AgentInvitation: '_' + agentVersion + 'I' + Large(connReq URI) + Tail(connInfo JSON)
```

The joining party's message is dramatically simpler - no Ed25519 auth key, no X448 E2E params embedded in the body, no encrypted encConnInfo. Instead, the X448 ratchet keys go into the connReq URI as e2e parameters.

This was confirmed by reading the Haskell source code (Agent/Client.hs:1654-1664, Protocol.hs:800-801).

### 2. connReq URI format

The joining party includes a full invitation URI pointing to their own reply queue:

```
simplex:/invitation#/?v=2-7
  &smp=smp://FINGERPRINT@HOST:5223/QUEUE_ID#/?v=1-4&dh=X25519_SPKI_BASE64&q=m
  &e2e=v=2-3&x3dh=X448_KEY1_BASE64,X448_KEY2_BASE64
```

Critical details:
- Agent version range: 2-7 (not 1-4)
- SMP queue URI includes `dh=` (X25519 DH key) and `q=m` (QMMessaging)
- E2E params use `x3dh=` with TWO X448 SPKI keys (not `dh=` with one X25519)
- E2E version range: 2-3 (not 1-4)
- X448 keys are full 68-byte SPKI, base64url encoded, comma separated

### 3. NaCl crypto_box vs raw XSalsa20-Poly1305

Using `@noble/ciphers` xsalsa20poly1305 directly with a DH shared secret produces wrong ciphertext because the HSalsa20 key derivation step is missing. `nacl.box()` from tweetnacl does all three steps internally:

```
crypto_box = crypto_scalarmult(DH) + HSalsa20(key derivation) + XSalsa20-Poly1305(encryption)
```

### 4. First contact has no Ratchet

When joining via a contact address, the joining party does NOT have the peer's X448 keys (they are not in the contact address URI). Therefore X3DH is impossible, and no Double Ratchet state exists. The first message uses only per-queue E2E encryption (NaCl crypto_box with X25519 keys).

The Ratchet begins after the contact owner responds with their AgentConfirmation (which includes their X448 keys for X3DH).

### 5. Current AUTH error

When the SimpleX App accepts the connection request, it tries to connect to our reply queue but gets Connection error (AUTH). This is likely because our queue needs SKEY or KEY registration before the app can send to it, or the queue credentials in our connReq URI do not match what the server expects. This is the starting point for Season 7.

---

## Files Modified in Season 6

### New Files
- `smp-web/src/invitation.ts` - AgentInvitation builder with connReq URI, NaCl encryption, padding
- `docs/SECURITY-HARDENING-ROADMAP.md` - Six-phase security hardening plan with research findings

### Modified Files
- `smp-web/src/browser-client.ts` - calls sendInvitation() after IDS, blocks send() until CONNECTED
- `smp-web/src/connection.ts` - sendInvitation() method, state transition QUEUE_CREATED -> PENDING
- `smp-web/src/commands.ts` - verified SEND encoder (ASCII flags, unsigned)
- `smp-web/src/client.ts` - support for unsigned commands (sigLen=0x00)
- `smp-web/src/__tests__/invitation.test.ts` - 493 tests total

### Website Files (SimpleGo www repo)
- `_includes/base.njk` - updated contact address to current one

---

## Season 6 Metrics

| Metric | Value |
|--------|-------|
| PRs merged | 4 (plus ~10 direct pushes for rapid iteration) |
| Tests | 493 pass, 3 skipped |
| Protocol fixes | 12 |
| A_CRYPTO errors resolved | 2 |
| A_MESSAGE errors resolved | 8+ |
| Lines added (invitation.ts) | ~200 |
| Lines removed (Ratchet code) | ~400 |
| Haskell source searches | 15+ grep commands on simplexmq |
| SimpleGo team consultations | 6 rounds of questions |

---

## What Did NOT Work (and why)

### 1. AgentConfirmation with Ratchet encryption
We spent significant time building full Double Ratchet encryption (AES-256-GCM, X3DH, HKDF-SHA512) for encConnInfo. This was the wrong approach because the joining party cannot do X3DH without the peer's X448 keys.

### 2. AgentConfirmation without Ratchet (plaintext encConnInfo)
Even with plaintext encConnInfo, AgentConfirmation is the wrong message type. The parser expects AgentInvitation for the joining party.

### 3. SMPQueueInfo binary structure
We built a complete binary SMPQueueInfo encoder (queue count, clientVersion, host, port, keyHash, senderId, DH key). This is correct for AgentConfirmation/AgentConnInfoReply but unnecessary for AgentInvitation, which uses a URI string instead.

### 4. Multiple padding size attempts
We tried 16000 (wrong), then 14832/15904 from Haskell constants (correct for Ratchet but not needed for this path). The final working approach uses only 15904 for the outer NaCl layer.

---

## Knowledge for Season 7

### Starting point
The SimpleX App shows "New contact request" from GoChat. When the user accepts, the app tries to connect to our reply queue and gets AUTH error. Season 7 must resolve this.

### Likely causes of AUTH error
1. Our reply queue may need SKEY registration before the app can send to it
2. The senderId in our connReq URI may not match what the server expects
3. The DH key in our connReq URI may not be in the correct format for queue access

### What Season 7 needs to implement (Steps 4-7)
1. Fix AUTH error so the app can send to our reply queue
2. Subscribe (SUB) to our own queue to receive the app's confirmation
3. Decrypt the app's AgentConfirmation (this one IS Ratchet-encrypted with X3DH)
4. Initialize Double Ratchet with the app's X448 keys
5. Exchange HELLO messages (both directions)
6. Reach CON state - bidirectional encrypted messaging

### Ratchet code is needed for Season 7
The X3DH and Double Ratchet code built during Season 6 (then removed from invitation.ts) will be needed when processing the app's AgentConfirmation in Season 7. The building blocks in `x3dh.ts` and `ratchet.ts` from Season 4 should be verified against the corrected parameters discovered in Season 6:
- HKDF-SHA512 (not SHA-256)
- Info strings: "SimpleXX3DH", "SimpleXChainRatchet", "SimpleXRootRatchet"
- Salt: 64 zero bytes for X3DH, empty for Chain KDF, root_key for Root KDF
- Three DH operations (not four): dh1=rk1*spk2, dh2=rk2*spk1, dh3=rk2*spk2
- IV order: msg_iv[64-79], header_iv[80-95]
- Ratchet v3 format: 124-byte emHeader with 2-byte Word16 BE prefix
- MsgHeader v3: content_len + version + 68B SPKI key + KEM Nothing + PN + NS

### Contact address update
The contact address in `base.njk` was outdated during Season 6 testing. Current address verified:
```
Queue ID: QEuTquKK63Txg0UAuWvhd4Q37Hsf6eGW
DH Key: QQdLacyHedAY2-FZd_G68TDwxsQ-PJ9AZmWvxsSF1xo=
```

---

## Infrastructure Notes

- Nginx WSS proxy still does not survive reboot (needs systemd service)
- esbuild.config.mjs must remain IIFE format (check after every rebase)
- SMP server Docker container needs WebSocket activation after restart:
  ```bash
  docker exec simplego-smp sed -i 's/websockets: off/websockets: 5225/' /etc/opt/simplex/smp-server.ini
  docker restart simplego-smp
  ```

---

## Security Hardening Roadmap Created

Season 6 produced a comprehensive security hardening roadmap (`docs/SECURITY-HARDENING-ROADMAP.md`) based on deep research into Web Crypto API, browser threat models, and how Signal, WhatsApp, Element, and Wire handle browser encryption:

1. CSP + SRI + DOMPurify (Season 7-8)
2. Crypto Web Worker isolation (Season 8)
3. Non-extractable Web Crypto keys (Season 8-9)
4. Dependency vendoring (Season 8)
5. Cross-origin iframe for embeddable widget (Season 9-10)
6. Rust-to-WASM crypto core (Season 10+)

---

## Acknowledgments

- **SimpleGo Protocol Team** - 6 rounds of critical protocol questions answered, including the revelation that encConnInfo is plaintext for initial contact and detailed byte-level format specifications
- **Haskell source code analysis** - The Ritter's grep-based research of the simplexmq repository identified the AgentInvitation message type and connReq URI format
- **Season 5 foundation** - The 15 protocol fixes from Season 5 (WebSocket transport, SMP v6 wire format, Ed25519 signing) were essential prerequisites

---

*Season 6 Closing Protocol*
*GoChat - Browser-Native Encrypted Messenger*
*IT and More Systems, Recklinghausen*
*"An die richtige Tuer geklopft." - Prinzessin Mausi*
