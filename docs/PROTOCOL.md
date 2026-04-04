<p align="center">
  <img src="../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<h1 align="center">GoChat - Technical Protocol</h1>

<p align="center">
  <strong>Technical protocol document for the GoChat encrypted web messenger.</strong><br>
  Dual-profile architecture, SMP-web spike analysis, implementation roadmap, and task registry.
</p>

---

**Project:** GoChat - Browser-Native Encrypted Messenger
**Parent project:** [SimpleGo](https://github.com/saschadaemgen/SimpleGo)
**Ecosystem:** SimpleGo (hardware) / GoRelay (relay server) / GoChat (browser client)
**Date:** 2026-04-04
**Branch analyzed:** `ep/smp-web-spike` on `simplex-chat/simplexmq`
**Status:** Season 12 complete (Widget Product), Season 13 (Security Hardening) next

---

## Ground rules

These rules apply to this document, all season protocols, and all GoChat development. They are non-negotiable.

1. **Nothing invented. What is missing gets asked. The Prinzessin shows everything needed.** Claude does not fabricate information, assume technical details, or fill gaps with speculation. If a detail is unknown, it is marked as unknown and the question is raised.

2. **Conventional Commits only.** Every commit follows the format `type(scope): description`. Valid types: feat, fix, docs, test, refactor, ci, chore. Commits are as granular as possible, as few as necessary.

3. **No em dashes.** Only regular hyphens (-) or rewritten sentences. Em dashes are an AI giveaway.

4. **No version number changes** without explicit permission from the project owner.

5. **English for all code, commits, comments, and documentation.** Conversations happen in German, artifacts are in English.

6. **TypeScript strict mode, @noble-only crypto, Web Worker isolation** for all browser-side cryptographic operations.

---

## 1. Executive summary

GoChat is a browser-native encrypted messenger built on [SimpleXMQ](https://github.com/simplex-chat/simplexmq). It brings the SimpleX Messaging Protocol directly into the browser, allowing website visitors to communicate through end-to-end encrypted channels without installing any application or creating any account.

GoChat supports two communication profiles selectable per connection:

- **SMP Profile** - everyday encrypted communication via the SimpleX Messaging Protocol over WebSocket, compatible with all SimpleX clients and servers
- **GRP Profile** - high-security communication via the GoRelay Protocol over WebSocket, exclusively through [GoRelay](https://github.com/saschadaemgen/GoRelay) infrastructure, with Noise transport, mandatory post-quantum cryptography, two-hop relay routing, and cover traffic

No browser-native SMP client exists anywhere - not from SimpleX Chat, not from the community, not from any third party. No open-source support chat tool offers E2E encryption on the customer-facing widget side. GoChat would be first on both counts.

GoChat is not a replacement for SimpleX - it is a complementary extension. No mobile app is planned or needed. SimpleX covers mobile and desktop. GoChat fills the browser gap and extends with GRP for high-security environments.

Based on the `ep/smp-web-spike` branch by [@epoberezkin](https://github.com/epoberezkin) (SimpleX founder), which introduces browser-native SMP protocol support. Evgeny confirmed in the SimpleX community chat that smp-web is actively being worked on ("its WIP :)").

---

## 2. How SimpleX messaging works

### 2.1 Core concept: simplex queues

SimpleX uses unidirectional message queues on relay servers. A single chat connection requires two queues (one in each direction). The relay server never sees both queues as belonging to the same conversation.

```
User A                    SMP Relay                    User B
  |                          |                           |
  |--- Queue 1 (A sends) --->|--- Queue 1 (B receives) ->|
  |                          |                           |
  |<-- Queue 2 (B sends) ---|<-- Queue 2 (A receives) --|
  |                          |                           |
```

What the server sees: isolated encrypted blobs in anonymous queues. No user IDs, no metadata linking Queue 1 to Queue 2, no way to correlate sender and receiver.

### 2.2 Connection establishment flow

1. **Contact address creation:** The support team creates a permanent SimpleX contact address in their app. This generates a link containing the server address and a public key.

2. **User connects:** When a website visitor clicks "Support Chat", their browser parses the contact address link, creates a new queue pair on the SMP server, performs X3DH key agreement, and sends a connection request through the contact address queue.

3. **Support accepts:** The SimpleX app on the support team's device automatically accepts the connection (configurable) and establishes the bidirectional channel.

4. **Messaging:** Both parties can now exchange E2E encrypted messages through their dedicated queue pair.

### 2.3 Multi-user architecture

Each new visitor who connects via the contact address gets their own independent queue pair. The support team sees each visitor as a separate contact in their SimpleX app. There is no theoretical limit on concurrent connections - the SMP server handles queue isolation natively.

```
Visitor A ---[Q1/Q2]---> SMP Server ---[Q1/Q2]---> Support Team (Contact: "Anon User 1")
Visitor B ---[Q3/Q4]---> SMP Server ---[Q3/Q4]---> Support Team (Contact: "Anon User 2")
Visitor C ---[Q5/Q6]---> SMP Server ---[Q5/Q6]---> Support Team (Contact: "Anon User 3")
```

The support team can handle multiple conversations simultaneously in the SimpleX desktop or mobile app.

---

## 3. Dual-profile architecture

GoChat supports two communication profiles. Both profiles use the same chat interface - the difference is in the transport layer, encryption strength, and relay infrastructure. The transport layer is abstracted behind a `ChatTransport` interface from day one, ensuring both profiles can be developed independently and swapped at runtime.

### 3.1 SMP Profile - everyday encrypted communication

The standard profile for daily use. Speaks the SimpleX Messaging Protocol over WebSocket, fully compatible with all SimpleX clients and any SMP relay server - including SimpleX's own public infrastructure, self-hosted servers, or GoRelay.

Use cases: product support, online shops (with SimpleGo terminal), communities, families, small businesses, freelancers, education, personal websites.

On the receiving end: SimpleX Chat app (phone/desktop) or a SimpleGo hardware terminal. No special software required.

```
Website visitor (browser)          Any SMP Server           Receiving end
        |                               |                        |
        |--- WSS + SMP --------------->|                        |
        |    E2E encrypted             |--- SMP relay --------->|
        |                               |                        |  SimpleX App (phone/desktop)
        |<-- WSS + SMP ----------------|<-- SMP relay ----------|  or SimpleGo terminal
        |    E2E encrypted             |                        |
```

### 3.2 GRP Profile - high-security environments

An additional security layer for environments where standard encryption is not sufficient. Uses the GoRelay Protocol (GRP) over WebSocket, exclusively through GoRelay infrastructure.

Use cases: journalism and source protection, whistleblower channels, government and public authorities, healthcare, critical infrastructure, legal and financial services, defense, NGOs and human rights.

On the receiving end: SimpleGo hardware (ESP32-S3) with no smartphone OS, no baseband processor, and hardware-backed key storage.

```
Website visitor (browser)          GoRelay Server           Receiving end
        |                               |                        |
        |--- WSS + GRP --------------->|                        |
        |    Noise + Post-quantum      |--- GRP relay --------->|
        |    Two-hop routing           |    Cover traffic       |  SimpleGo hardware
        |    Cover traffic             |                        |  (ESP32-S3)
        |<-- WSS + GRP ----------------|<-- GRP relay ----------|
        |                              |                        |
```

### 3.3 What makes GRP different from SMP

| Property | SMP (TLS 1.3) | GRP (Noise IK) |
|:---------|:--------------|:---------------|
| Handshake size | 1-4 KB | 96-144 bytes |
| Cipher negotiation | Yes (dozens of options) | No (fixed suite, cannot downgrade) |
| Certificate authority | Required (X.509 chain) | Not needed (key IS identity) |
| Identity hiding | Server visible via SNI | Both parties encrypted |
| Deniability | No (signatures in handshake) | Yes (DH only, no signatures) |
| Post-quantum | Not mandatory | Mandatory (X25519 + ML-KEM-768) |
| Routing | Direct (single hop) | Mandatory two-hop relay |
| Cover traffic | No | Yes (Poisson-distributed) |

The elimination of cipher negotiation is the most significant security improvement. TLS has spent two decades fighting downgrade attacks (POODLE, FREAK, Logjam, ROBOT) caused by its negotiation mechanism. Noise cannot have downgrade attacks because there is nothing to downgrade. One fixed cipher suite per protocol version: `Noise_IK_25519_ChaChaPoly_BLAKE2s`.

### 3.4 ChatTransport interface

Both profiles implement the same abstract transport interface. This is a day-one architectural requirement - all code that sends or receives messages must go through this interface, never directly through a WebSocket.

```typescript
interface ChatTransport {
  connect(server: ServerAddress): Promise<void>
  send(block: Uint8Array): Promise<void>
  onMessage(handler: (block: Uint8Array) => void): void
  close(): void
}

// Season 2-9: SMPWebSocketTransport implements ChatTransport
// Season 12+: GRPWebSocketTransport implements ChatTransport
```

The ChatTransport abstraction ensures:
- SMP and GRP code never leak into each other
- Profile switching at runtime requires only swapping the transport instance
- Testing can use a mock transport without network dependencies
- Future transport types (HTTP/2 long-polling fallback, WASM-based) slot in without changing application code

### 3.5 GoRelay as bridge

GoRelay's dual-protocol architecture allows cross-protocol message delivery. SMP on port 5223, GRP on port 7443, shared QueueStore. A message arriving via SMP can be delivered to a GRP subscriber and vice versa. This means a visitor using the SMP profile can reach a SimpleGo hardware device behind GRP - GoRelay handles the translation transparently.

### 3.6 Profile comparison

| Feature | SMP Profile | GRP Profile |
|:--------|:-----------|:------------|
| Protocol | SimpleX Messaging Protocol | GoRelay Protocol |
| Transport | WebSocket + TLS | WebSocket + Noise |
| Key exchange | X25519 + Double Ratchet | X25519 + ML-KEM-768 (post-quantum) |
| Relay servers | Any SMP server | GoRelay only |
| Routing | Direct | Mandatory two-hop |
| Cover traffic | No | Yes (Poisson-distributed) |
| Cipher negotiation | TLS cipher suites | None (fixed, no downgrade possible) |
| Identity hiding | Server visible via SNI | Both parties encrypted |
| Server seizure resistance | Standard encryption | Shamir split across servers (future) |
| Traffic disguise | None | Steganographic transport (future) |
| Queue auth | Ed25519 signature | Zero-knowledge proof (future) |
| Compatible with | All SimpleX clients | SimpleGo hardware |
| Use case | Everyday communication | High-security environments |

### 3.7 Future: Triple Shield architecture (GRP Phase 6)

GoRelay's roadmap includes a Triple Shield layer adding three defense mechanisms on top of the existing encryption stack:

- **6a: Zero-Knowledge Queue Authentication** - Schnorr DLOG via Fiat-Shamir. Clients prove queue ownership without revealing their public key. The server learns exactly one bit: "this client has the right key" or not.
- **6b: Shamir's Secret Sharing (2-of-3)** - Each encrypted message is split into shares across multiple servers. Any single share contains mathematically zero information. Information-theoretic security that holds even against unlimited computing power.
- **6c: Steganographic Transport** - GRP traffic wrapped in protocols mimicking legitimate web traffic. Pluggable Transports framework (HTTPS, WebSocket, meek, obfs4).

When all active, defeating a GoChat-to-SimpleGo communication requires simultaneously breaking eight independent defense layers. Failure at any single point leaves the attacker with nothing.

---

## 4. What already exists (analysis of the spike branch)

### 4.1 Server-side (Haskell - production ready)

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| SMP server with all commands | DONE | `src/Simplex/Messaging/` | NEW, SUB, SEND, MSG, ACK, KEY, DEL, LGET, LNK |
| WebSocket on port 443 | DONE | PR #1738, 2026-03-20 | Browser WS and native TLS on same port via SNI routing |
| ALPN fix for browser WebSocket | DONE | PR #1738 | Server ALPN list includes "h2"/"http/1.1", browser gets v6-18 |
| Contact address / short links | DONE | Protocol level | Permanent contact address for support team |
| XFTP file transfer | DONE | Separate protocol | Could be used for file attachments later |
| TLS + identity verification | DONE | Server handshake | Ed25519 certificate chain verification |

### 4.2 Browser-side shared infrastructure (xftp-web - production tested)

These modules are already battle-tested in the live file transfer tool at `simplex.chat/file/`.

| Component | Status | File | Notes |
|-----------|--------|------|-------|
| Binary encoding/decoding | DONE | `xftp-web/src/protocol/encoding.ts` | Full SMP wire format: Decoder class, encodeBytes, decodeLarge, Word16/32/64, Bool, Maybe, List, NonEmpty |
| HTTP/2 transport | DONE | `xftp-web/src/client.ts` | Browser fetch() transport with timeout, retry, reconnect logic |
| Server handshake | DONE | `xftp-web/src/protocol/handshake.ts` | Client hello, server handshake decode, version negotiation |
| Server identity verification | DONE | `xftp-web/src/crypto/identity.ts` | Ed25519 certificate chain + web challenge verification |
| X25519 key exchange | DONE | `xftp-web/src/crypto/keys.ts` | generateX25519KeyPair, DH key agreement, public key encoding |
| NaCl secretbox encryption | DONE | `xftp-web/src/crypto/secretbox.ts` | XSalsa20-Poly1305 authenticated encryption |
| SHA-256 / SHA-512 digests | DONE | `xftp-web/src/crypto/digest.ts` | Using @noble/hashes |
| Content padding | DONE | `xftp-web/src/crypto/padding.ts` | Block padding/unpadding for fixed-size transmissions |
| Server address parsing | DONE | `xftp-web/src/protocol/address.ts` | Parse server URLs with key hash verification |
| Connection agent (pool) | DONE | `xftp-web/src/client.ts` | Connection pooling, sequential command queue, auto-reconnect |
| Transmission framing | DONE | `xftp-web/src/protocol/transmission.ts` | Block encoding/decoding, session-based auth, correlation IDs |

### 4.3 Browser-side SMP client (smp-web - spike / in progress)

| Component | Status | File | Notes |
|-----------|--------|------|-------|
| Package setup | DONE | `smp-web/package.json` | `@simplex-chat/smp-web` v0.1.0, depends on xftp-web |
| TypeScript config | DONE | `smp-web/tsconfig.json` | ES2022 target, strict mode |
| Re-exported encoding primitives | DONE | `smp-web/src/index.ts` | Decoder, encodeBytes, decodeBytes, etc. |
| SMP transmission encode/decode | DONE | `smp-web/src/protocol.ts` | `encodeTransmission()`, `decodeTransmission()` with auth field |
| LGET command encoding | DONE | `smp-web/src/protocol.ts` | Link GET - retrieve connection data from short link |
| LNK response decoding | DONE | `smp-web/src/protocol.ts` | Parse senderId, encFixedData, encUserData from link response |
| SMP response dispatch | DONE | `smp-web/src/protocol.ts` | Switch on LNK / OK / ERR tags |
| ASCII helper | DONE | `smp-web/src/protocol.ts` | String to Uint8Array conversion for command tags |

### 4.4 Key commits on the branch

| Hash | Date | Description |
|------|------|-------------|
| `4b89a7f` | 2026-03-22 | `encoding/decoding of LGET/LNK` - Core SMP protocol in TypeScript |
| `3eeffff` | 2026-03-22 | `smp web: initial setup` - Package scaffolding |
| `01fe841` | 2026-03-20 | `smp: allow websocket connections on the same port (#1738)` - WebSocket transport on SMP server |
| `1a12ee0` | 2026-03-20 | `xftp-web: version bump to 0.3.0 (#1742)` - Updated shared dependency |
| `dc2921e` | 2026-03-18 | `xftp-server: embed file download widget (#1733)` - Web embedding pattern |
| `328d3b9` | 2026-03-11 | `xftp-web: use XFTP server domain in share link (#1732)` - Security improvement |

---

## 5. What needs to be built

### 5.1 Layer 1: WebSocket SMP transport client (CRITICAL PATH)

**Priority:** Completed in Seasons 2-3.

All transport code implements the `ChatTransport` interface defined in section 3.4.

**Tasks:**

- [x] **WS-1:** Create `smp-web/src/transport.ts` - WebSocket transport class
- [x] **WS-2:** Create `smp-web/src/client.ts` - SMP client with handshake
- [x] **WS-3:** Connection pooling and reconnect
- [ ] **WS-4:** SharedWorker for tab persistence

### 5.1b Browser client and real-server connectivity (Season 5)

**Priority:** Completed in Season 5.

**Tasks:**

- [x] **BC-1:** Browser client API (`browser-client.ts`)
- [x] **BC-2:** Browser bundle (esbuild)
- [x] **BC-3:** Browser client integration tests
- [x] **CHAT-1:** Chat panel UI
- [x] **INFRA-1:** SMP server deployment
- [x] **INFRA-2:** Nginx WSS reverse proxy
- [x] **INFRA-3:** Contact address setup
- [x] **PROTO-1 through PROTO-15:** Real server protocol fixes

### 5.1c Connection request to SimpleX App (Season 6)

**Priority:** Completed in Season 6.

**Tasks:**

- [x] **INV-1:** AgentInvitation builder (`invitation.ts`)
- [x] **INV-2:** connReq URI builder
- [x] **INV-3:** NaCl encryption fix
- [x] **INV-4:** 12 protocol fixes

### 5.1d Server upgrade and ALPN fix (Season 7)

**Priority:** Completed in Season 7.

Season 7 discovered and resolved the root cause chain preventing the SimpleX CLI from accepting GoChat invitations. The CLI sends SKEY (sender key registration, v9+ Fast Duplex) before SEND. SKEY failed with AUTH because the queue had no sndSecure, which requires v9+ negotiation. The server only offered v6 over WebSocket because browser connections lack ALPN "smp/1", causing the server to fall back to legacy v6-only mode.

The fix required building the SMP server from Evgeny's unmerged PR #1738, which extends the server's ALPN list to include "h2" and "http/1.1". This allows browser WebSocket connections to get the full v6-18 protocol range. The infrastructure was overhauled: Nginx was eliminated, Docker maps port 443 directly to host port 8444, and a 4096-bit RSA Let's Encrypt certificate was generated for the HTTPS handler.

**Tasks:**

- [x] **S7-1:** Identify SKEY as AUTH root cause (CLI debug logging)
- [x] **S7-2:** Identify ALPN as version-range root cause (SimpleGo team + Haskell source)
- [x] **S7-3:** Test sndSecure on v6 (3 attempts, all CMD SYNTAX - v6 parser limitation)
- [x] **S7-4:** Upgrade server to v6.5.0-beta.6 (still v6-v6 over WebSocket)
- [x] **S7-5:** Find and analyze PR #1738 source code
- [x] **S7-6:** Build SMP server from PR #1738 branch (Haskell Docker build)
- [x] **S7-7:** Deploy with 4096-bit RSA Let's Encrypt cert
- [x] **S7-8:** Eliminate Nginx, Docker direct port mapping (8444->443)
- [x] **S7-9:** Verify v6-18 over WebSocket (confirmed in browser console)
- [x] **S7-10:** Cap maxSMPClientVersion to 6 (v7 auth not yet implemented)

### 5.1e v9 command authorization, server rebuild, MSG + Layer 1 (Season 8)

**Priority:** Completed in Season 8.

Season 8 implemented SMP v9 command authorization (CbAuthenticator), rebuilt the server infrastructure from scratch (Debian 13, no Plesk), processed incoming MSG pushes with server-to-recipient decryption, and decrypted the CLI's AgentConfirmation through the NaCl Layer 1 envelope. The critical breakthrough was discovering that Haskell's cryptoBox includes an HSalsa20 key derivation step internally, meaning JavaScript must use nacl.box instead of nacl.secretbox.

**Tasks:**

- [x] **S8-1:** Parse server auth X25519 key from ServerHello CertChainPubKey
- [x] **S8-2:** Implement CbAuthenticator (nacl.box over SHA-512 hash of authorized data)
- [x] **S8-3:** Raise maxSMPClientVersion to 9, ClientHello with session X25519 key
- [x] **S8-4:** Per-queue auth keys: Ed25519 -> X25519 for CbAuthenticator
- [x] **S8-5:** v9 NEW command format with Maybe BasicAuth '0' + sndSecure 'T' (97 bytes)
- [x] **S8-6:** Fix SMP Maybe encoding: ASCII '0' (0x30), not binary 0x00
- [x] **S8-7:** Fix CbAuthenticator: nacl.box (DH+HSalsa20+XSalsa20), not nacl.secretbox
- [x] **S8-8:** Server infrastructure rebuild (Debian 13, Nginx + Certbot, Docker)
- [x] **S8-9:** Remove debug logging, clean up protocol.ts and handshake.ts
- [x] **S8-10:** MSG processing with server-to-recipient decryption (nacl.box.open)
- [x] **S8-11:** Parse RcvMsgBody (SystemTime=12B, not 8B)
- [x] **S8-12:** ACK with CbAuthenticator
- [x] **S8-13:** Layer 1 NaCl decryption of smpEncConfirmation
- [x] **S8-14:** Parse smpConfirmation (sender key + AgentConfirmation body)

### 5.1f X3DH + Double Ratchet + HELLO + CON (Season 9)

**Priority:** Completed in Season 9.

Season 9 implemented the full end-to-end encryption pipeline: parsing AgentConfirmation with PQ KEM (SNTRUP761) support, X3DH key agreement (receiver side, 3x X448 DH + HKDF-SHA512), Double Ratchet encrypt and decrypt (AES-256-GCM with 16-byte IVs), reply queue parsing from AgentConnInfoReply, and the duplex handshake (sending AgentConfirmation back to CLI). HELLO received and CONNECTION ESTABLISHED. Chat messages decrypted.

**Tasks:**

- [x] **S9-1:** Parse AgentConfirmation with E2ERatchetParams + PQ KEM (PR #67, #70, #71)
- [x] **S9-2:** X3DH key agreement - receiver side (PR #68)
- [x] **S9-3:** Double Ratchet decrypt for encConnInfo (PR #69)
- [x] **S9-4:** Fix MsgHeader KEM skip + HELLO handler (PR #72, #73, #74)
- [x] **S9-5:** Parse reply queue from AgentConnInfoReply tag 'D' (PR #75)
- [x] **S9-6:** Ratchet encrypt + send handshake to reply queue (PR #76)
- [x] **S9-7:** Fix handshake format: tag 'C', PHConfirmation 'K', e2eEncryption_=Nothing (PR #77)
- [x] **S9-8:** Fix smpClientVersion in ClientMsgEnvelope PubHeader (direct)

**Code Map (Season 9 additions):**

| File | Purpose |
|:-----|:--------|
| agent-confirmation.ts | Parse AgentConfirmation with E2ERatchetParams + PQ KEM |
| x3dh-agreement.ts | X3DH receiver-side (3x X448 DH + HKDF-SHA512) |
| ratchet-decrypt.ts | Double Ratchet init + encrypt (rcEncrypt) + decrypt (rcDecrypt) |
| reply-queue.ts | Parse SMPQueueInfo from AgentConnInfoReply tag 'D' |

### 5.1g Chat messages + Desktop App + UX (Season 10)

**Priority:** Completed in Season 10.

Season 10 delivered bidirectional E2E encrypted chat between browser and SimpleX Desktop App, a multi-step UX flow with visitor name support, offline messaging, and delete confirmation. 11 PRs merged (#79-#89). Critical discoveries: gochat-client.js must never inject DOM elements (showNameInput destroyed external UI), setStatus must only fire from state machine after HELLO (not from connectWithName), and incoming JSON events must be parsed before display.

**Tasks:**

- [x] **S10-1:** Fix WebSocket subscription after HELLO (PR #79)
- [x] **S10-2:** Send HELLO and chat messages (agentVersion=1) (PR #80)
- [x] **S10-3:** PING/PONG keep-alive 30s interval (PR #81)
- [x] **S10-4:** Fix sendHello crash + state transition (PR #82)
- [x] **S10-5:** Wire sendChatMessage through encrypted pipeline (PR #83)
- [x] **S10-6:** Encode sndMsgId as Word64 BE (PR #84)
- [x] **S10-7:** Message buffer + Desktop App docs (PR #85)
- [x] **S10-8:** Visitor name + .env config + admin config (PR #86, #87)
- [x] **S10-9:** Visitor name input in widget (PR #88)
- [x] **S10-10:** Remove DOM injection + fix status + event handling (PR #89)

### 5.1h Delivery receipts + connection lifecycle + .env (Season 11)

**Priority:** Completed in Season 11.

Season 11 delivered bidirectional delivery receipts (double checkmarks), connection lifecycle management (END detection, timeout, x.direct.del send), and .env integration for the SimpleGo website. The receipt msgHash bug required three attempts to resolve: the full agentMessage buffer must be hashed, not a subset. The onSubscriptionEnd handler existed in the transport layer but was never wired - one line of code activated END detection.

**Tasks:**

- [x] **S11-1:** Parse incoming delivery receipts - A_RCVD inner_tag 'V' (PR #91)
- [x] **S11-2:** Send delivery receipts for received chat messages (PR #91)
- [x] **S11-3:** Fix receipt msgHash scope - full agentMessage buffer (PR #92, #93)
- [x] **S11-4:** Wire onSubscriptionEnd for queue END detection (PR #94)
- [x] **S11-5:** Add connection timeout for unresponsive agents (PR #94)
- [x] **S11-6:** Send x.direct.del notification before disconnect (PR #95)
- [x] **S11-7:** chat.js receipt UI - onDeliveryReceipt callback, pendingChecks, upgradeCheck()
- [x] **S11-8:** .env integration - dotenv in 11ty, template variables in base.njk

### 5.2 Layer 2: SMP command implementation

**Priority:** Completed in Season 3.

- [x] **CMD-1:** Queue creation commands (NEW/IDS)
- [x] **CMD-2:** Sender commands (SEND/SKEY)
- [x] **CMD-3:** Recipient commands (SUB/ACK/KEY/DEL/MSG)
- [x] **CMD-4:** Connection link commands (LGET/LNK/LSND)
- [x] **CMD-5:** Utility commands (PING/PONG/ERR)

### 5.3 Layer 3: Connection management (SMP Agent logic)

**Priority:** Completed in Season 4.

- [x] **CONN-1:** Contact address parsing
- [x] **CONN-2:** Connection state machine
- [x] **CONN-3:** Queue pair creation
- [x] **CONN-4:** Connection request with full crypto stack

### 5.4 Layer 4: End-to-end encryption

**Priority:** Completed in Season 9.

- [x] **E2E-1:** Ratchet receive side (decrypt incoming messages)
- [x] **E2E-2:** Symmetric ratchet step (advance chain on each message)
- [x] **E2E-3:** DH ratchet step (re-key on send/receive transitions)
- [ ] **E2E-4:** Out-of-order message handling (skipped message keys)
- [ ] **E2E-5:** Header decryption with current + next header key
- [ ] **E2E-6:** Key storage (IndexedDB + AES-256-GCM encryption at rest)
- [ ] **SEC-3:** Web Worker isolation for all crypto operations

### 5.5 Layer 5: Chat UI (GoChat frontend)

**Priority:** Medium - partially done in Season 5, remaining tasks in Season 9.

- [x] **CHAT-1:** Chat panel UI (Season 5)
- [ ] **UI-1:** Nose-bar integration
- [ ] **UI-2 through UI-8:** Remaining UI tasks

### 5.6 Layer 6: Browser security hardening

**Priority:** High - Season 12.

- [ ] **SEC-1:** Content Security Policy implementation
- [ ] **SEC-2:** Subresource Integrity for all external scripts
- [ ] **SEC-3:** Web Worker isolation for crypto operations
- [ ] **SEC-4:** Security documentation
- [ ] **SEC-5:** TLS certificate strategy (partially resolved in S5/S7)

### 5.7 Layer 7: Deployment and operations

- [x] **OPS-1:** SMP server deployment (S5, upgraded S7)
- [x] **OPS-2:** Contact address setup (S5)
- [ ] **OPS-3:** Monitoring

### 5.8 Layer 8: GRP transport (future - Season 14+)

- [ ] **GRP-1:** Noise Protocol transport
- [ ] **GRP-2:** Mandatory post-quantum key exchange
- [ ] **GRP-3:** Two-hop relay routing
- [ ] **GRP-4:** Triple Shield integration

---

## 6. Implementation roadmap

### Phase 1: Foundation (Season 2-3) - COMPLETE

### Phase 2: Connection flow (Season 4) - COMPLETE

### Phase 3: Chat UI and real-server connectivity (Season 5) - COMPLETE

### Phase 3b: Connection request (Season 6) - COMPLETE

### Phase 3c: Server upgrade and ALPN fix (Season 7)

**Goal:** Resolve the AUTH error when the CLI accepts GoChat's invitation by enabling the full SMP protocol range (v6-18) over WebSocket.

**Status: COMPLETE (Season 7)**

1. Identified SKEY as the immediate cause of AUTH (CLI debug logging)
2. Identified ALPN as the root cause of v6-only over WebSocket
3. Tested sndSecure on v6 (3 PRs, all CMD SYNTAX - v6 parser limitation)
4. Found PR #1738 "smp: allow websocket connections on the same port"
5. Built SMP server from PR #1738 Haskell source
6. Deployed with 4096-bit RSA Let's Encrypt certificate
7. Eliminated Nginx, Docker direct port mapping (8444->443)
8. Verified: browser now gets ServerHello v6-18, negotiates v6
9. Capped maxSMPClientVersion to 6 (v7 auth not yet implemented)
10. Result: NEW/IDS/SEND/OK all working on new server infrastructure

### Phase 3d: v9 command auth, server rebuild, MSG + Layer 1 (Season 8)

**Goal:** Implement v9 CbAuthenticator, rebuild server, process MSG, decrypt Layer 1.

**Status: COMPLETE (Season 8)**

1. Implemented CbAuthenticator (nacl.box over SHA-512, 80-byte authenticator)
2. Raised maxSMPClientVersion to 9, ClientHello with X25519 session key
3. Per-queue auth keys changed from Ed25519 to X25519
4. v9 NEW command with Maybe BasicAuth '0' + sndSecure 'T' (97 bytes)
5. Discovered HSalsa20 requirement: nacl.box not nacl.secretbox
6. Server rebuilt from scratch (Debian 13, Nginx + Certbot, Docker)
7. MSG processing with server-to-recipient decryption
8. RcvMsgBody parsing (SystemTime = 12 bytes, not 8)
9. ACK with CbAuthenticator
10. Layer 1 NaCl decryption of smpEncConfirmation
11. smpConfirmation parsing (sender key + AgentConfirmation body)
12. Result: CLI accepts connection, AgentConfirmation received and decrypted
13. 494 tests across 19 files

### Phase 3e: X3DH + Double Ratchet + CON (Season 9)

**Goal:** Parse AgentConfirmation, perform X3DH with real keys, initialize Double Ratchet, exchange HELLO messages, achieve CON state.

1. Parse AgentConfirmation (e2e params, X448 keys, connInfo)
2. X3DH key agreement with real peer X448 keys
3. Initialize Double Ratchet from X3DH output
4. Decrypt HELLO from peer (first Ratchet message)
5. Send HELLO to peer
6. Achieve CON ("CONNECTED") state
7. Bidirectional encrypted messaging via Double Ratchet
8. Document SMP-VERSIONS.md and SMP-HANDSHAKE.md

### Phase 3f: Bidirectional chat + UX (Season 10)

**Goal:** Production-quality bidirectional E2E chat with Desktop App.

**Status: COMPLETE (Season 10)**

1. Bidirectional E2E encrypted messaging with SimpleX Desktop App
2. Multi-step UX flow (Start -> Name -> Waiting -> Chat)
3. Visitor name support (custom or random guest)
4. Offline messaging with single-message limit
5. Delete confirmation + Hollywood destruction sequence
6. Event handling (x.direct.del, x.msg.new)
7. 544+ tests, 11 PRs (#79-#89)

### Phase 3g: Delivery receipts + connection lifecycle + .env (Season 11)

**Goal:** Delivery confirmations, connection end handling, build-time configuration.

**Status: COMPLETE (Season 11)**

1. Bidirectional delivery receipts (A_RCVD, tag 'V', double checkmarks)
2. Receipt msgHash fix (full agentMessage buffer, 3 attempts)
3. chat.js receipt UI (onDeliveryReceipt, pendingChecks, upgradeCheck)
4. Connection END detection (onSubscriptionEnd wired)
5. Connection timeout for unresponsive agents (2 minutes)
6. x.direct.del send before disconnect
7. .env integration (dotenv + 11ty + base.njk template variables)
8. 551+ tests, 5 PRs (#91-#95)

### Phase 4: Hardening (Season 12)

**Goal:** Production-ready encrypted support chat with security hardening.

1. Browser security hardening: CSP, SRI, Web Worker isolation (SEC-1 to SEC-5)
2. Dependency vendoring (@noble libraries into repo)
3. Error handling and user-facing error states
4. Performance optimization and bundle size
5. Security review and documentation (SEC-4)

### Phase 5: GRP profile (Season 14+)

**Goal:** High-security communication via GoRelay.

---

## 7. Technical reference

### 7.1 SMP wire format

Each SMP transmission is a fixed-size block (16,384 bytes) with '#' padding (0x23):

```
[auth: ByteString] [corrId: ByteString] [entityId: ByteString] [command: raw bytes]
```

### 7.2 Existing code map

```
GoChat/
  smp-web/
    src/
      index.ts                      # Re-exports all public API
      types.ts                      # ChatTransport interface, SMP types
      transport.ts                  # SMPWebSocketTransport (16KB block framing)
      handshake.ts                  # SMP ServerHello/ClientHello encode/decode
      client.ts                     # SMPClient (handshake, session, typed commands, corrId dispatch)
      agent.ts                      # SMPClientAgent (connection pool, reconnection)
      commands.ts                   # SMP command encoders (14 commands)
      protocol.ts                   # SMP transmission encode/decode, response decoder
      address.ts                    # SimpleX contact address URI parser (S4)
      state.ts                      # Connection lifecycle state machine (S4)
      crypto-utils.ts               # Key gen: Ed25519, X25519, X448 + SPKI encoding (S4)
      connection.ts                 # ConnectionManager (queue creation + send request) (S4)
      x3dh.ts                       # Modified 4-DH X3DH key agreement (S4)
      ratchet.ts                    # Double Ratchet init + first encrypt AES-256-GCM (S4)
      agent-envelope.ts             # Agent confirmation encoding (S4)
      connection-request.ts         # Connection request builder + zstd (S4)
      browser-client.ts             # High-level browser API (S5)
      invitation.ts                 # AgentInvitation builder (S6)
      __tests__/                    # 551+ tests across 23 files

+-- src/assets/css/chat.css         # Chat panel styles (S5, lives in SimpleGo www)
+-- src/assets/js/chat.js           # Chat panel logic (S5, lives in SimpleGo www)
+-- _includes/base.njk              # Chat HTML integration (S5, lives in SimpleGo www)

  xftp-web/                         # Shared infrastructure (upstream)
    src/
      client.ts                     # HTTP/2 transport, handshake, retry logic
      protocol/
        encoding.ts                 # Binary encoding (Decoder, encode/decodeBytes, etc.)
        transmission.ts             # Block framing, session auth
        handshake.ts                # Client/server handshake, version negotiation
      crypto/
        keys.ts                     # X25519 key generation + DH
        secretbox.ts                # NaCl XSalsa20-Poly1305
        identity.ts                 # Ed25519 server identity verification
        digest.ts                   # SHA-256 / SHA-512

  docs/
    PROTOCOL.md                     # This file
    RESEARCH.md                     # Browser crypto, security, design research
    SECURITY-HARDENING-ROADMAP.md   # Six-phase browser security hardening plan
    seasons/
      SEASON-PLAN.md                # Season overview and workflow
      SEASON-01 through 06          # Season closing protocols
      SEASON-07-server-upgrade.md   # Season 7 closing protocol
      SEASON-11-receipts-lifecycle.md # Season 11 closing protocol
```

### 7.3 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@noble/hashes` | ^1.5.0 | SHA-256, SHA-512 (used by xftp-web crypto) |
| `@noble/curves` | latest | Ed25519, X25519 (6 audits, used by Proton Mail, MetaMask) |
| `@noble/ciphers` | latest | XSalsa20-Poly1305, AES-256-GCM |
| `zstd-codec` | latest | Zstd compression (level 3) for connInfo payload |
| `@simplex-chat/xftp-web` | file:../xftp-web | Encoding, crypto, transport primitives |
| `typescript` | ^5.4.0 | Build tooling |
| `ws` | ^8.0.0 | WebSocket (dev/test only, browser uses native WebSocket) |

### 7.4 SMP command reference

| Command | Direction | Format | Purpose |
|---------|-----------|--------|---------|
| `NEW` | Client -> Server | `NEW <rcvPubKey> <dhPubKey> <subscribeMode> [sndSecure]` | Create new queue |
| `IDS` | Server -> Client | `IDS <rcvId> <sndId> <srvDhPubKey>` | Queue IDs response |
| `SUB` | Client -> Server | `SUB` (entityId = queueId) | Subscribe to queue |
| `KEY` | Client -> Server | `KEY <sndKey>` | Set sender key on queue |
| `SKEY` | Client -> Server | `SKEY <sndKey>` | Sender registers own key (v9+) |
| `SEND` | Client -> Server | `SEND <msgFlags> <msgBody>` | Send message |
| `MSG` | Server -> Client | `MSG <msgId> <ts> <msgFlags> <msgBody>` | Receive message (async push) |
| `ACK` | Client -> Server | `ACK <msgId>` | Acknowledge receipt |
| `DEL` | Client -> Server | `DEL` | Delete queue |
| `PING` | Client -> Server | `PING` | Keepalive |
| `PONG` | Server -> Client | `PONG` | Keepalive response |
| `OK` | Server -> Client | `OK` | Success |
| `ERR` | Server -> Client | `ERR <errorType>` | Error |
| `END` | Server -> Client | `END` | Queue subscription ended (S11) |

### 7.5 SMP v6 wire format reference (Season 5)

Documented during 15 protocol fixes against real SMP v6.4.5.1 server, with critical assistance from the SimpleGo protocol analysis team (49 sessions, 81 bugs, 270 lessons).

**ServerHello (WebSocket mode - no certs):**
```
[2B contentLen][versionMin 2B][versionMax 2B][sessIdLen 1B][sessionId 32B]['#' padding]
```

**ServerHello (PR #1738 WebSocket mode - with certs):**
```
[2B contentLen][versionMin 2B][versionMax 2B][sessIdLen 1B][sessionId 48B][NonEmpty certs][signedKey]['#' padding]
```
Note: sessionId is 48 bytes on PR #1738 server (vs 32 bytes on legacy WebSocket port). Certificate chain and signed DH key are present because the server handles TLS directly.

**ClientHello (v6):**
```
[2B contentLen][version 2B][keyHashLen 1B][keyHash 32B]['#' padding]
```

**ClientHello (v7+):**
```
[2B contentLen][version 2B][keyHashLen 1B][keyHash 32B][authPubKey][proxyServer][clientService]['#' padding]
```
v7+ adds authPubKey (X25519 SPKI) for DH-based command authorization. This replaces Ed25519 signature-based auth.

**v6 command transmission:**
```
[sigLen=0x40][64B Ed25519 signature]
[sessIdLen=0x20][32B sessionId]
[corrIdLen=0x18][24B corrId]
[entityIdLen][entityId]
[command bytes]
```

**v6 signed data (CRITICAL):**
```
signedData = [0x20][sessionId 32B] + [corrIdLen][corrId] + [entityIdLen][entityId] + [command]
```
The 0x20 length prefix before sessionId MUST be included. Without it: ERR AUTH.

**v6 NEW command:**
```
"NEW " [0x2C][44B Ed25519 SPKI authKey][0x2C][44B X25519 SPKI dhKey]"S"
```
No spaces between fields. No basicAuth. No sndSecure on v6. Keys use 1-byte shortString prefix.

**v9+ NEW command with sndSecure:**
```
"NEW " [0x2C][44B authKey][0x2C][44B dhKey] "S T"
```
Space between subscribeMode "S" and sndSecure "T". Total 97 bytes. Requires v9+ negotiation. Creates queue with `sk=` ready for SKEY registration.

**AgentInvitation wire format (Season 6):**

```
ClientMessage:
  [0]      '_' (0x5F)         PHEmpty (1 byte, no auth key)
  [1-2]    00 07              agentVersion (uint16 BE, v7)
  [3]      'I' (0x49)         AgentInvitation tag
  [4-5]    XX XX              connReq URI length (uint16 BE, Large encoding)
  [6-N]    UTF-8 bytes        connReq URI string
  [N+1+]   UTF-8 bytes        connInfo JSON (Tail, no length prefix)
```

**Delivery Receipt wire format (Season 11):**

```
A_RCVD (inner_tag 'V'):
  ['M'][APrivHeader]['V'][count 1B Word8][AMessageReceipt...]

AMessageReceipt:
  [8B agentMsgId Int64 BE]
  [1B hashLen][32B msgHash SHA256]
  [2B rcptInfo Word16]

CRITICAL: count is Word8 (NOT Word16), rcptInfo is Word16 (NOT Word32)
CRITICAL: msgHash = sha256(full agentMessage buffer), not just JSON body
CRITICAL: agentVersion=1 for outgoing receipts (NOT 7)
```

### 7.6 ALPN and protocol version negotiation (Season 7)

**The ALPN problem and fix:**

The SMP server uses TLS ALPN to decide which protocol version range to advertise:

```haskell
smpVersionRange = maybe legacyServerSMPRelayVRange (const smpVRange) $ getSessionALPN c
```

| Connection type | ALPN result | Version range |
|:----------------|:------------|:--------------|
| Native TLS client (sends "smp/1") | `Just "smp/1"` | v6-v18 (full) |
| Browser WebSocket (legacy server) | `Nothing` | v6-v6 (legacy) |
| Browser WebSocket (PR #1738 server) | `Just "h2"` | v6-v18 (full) |

PR #1738 extends the server's ALPN list to `["smp/1", "h2", "http/1.1"]`. When a browser connects and proposes "h2", the server matches it. Since `getSessionALPN` returns `Just "h2"` (not `Nothing`), the full v6-v18 range is advertised.

**v7+ command authorization (Season 8 prerequisite):**

v6 uses Ed25519 signatures for command authorization. v7+ uses X25519 DH-based authorization (crypto_box). The transition is defined in PR #982 "smp: command authorization":

- ClientHello includes `authPubKey` (X25519 SPKI)
- Commands are authorized via crypto_box instead of Ed25519 signatures
- The server DH key from ServerHello is used as the peer key
- Per-command ephemeral keys may be used

To use sndSecure, the client must negotiate v9+ which requires implementing v7+ auth first.

### 7.7 GRP cipher suite reference (for documentation, not code yet)

```
GRP/1 cipher suite (non-negotiable):
  Noise Pattern:    IK (primary), XX (fallback)
  Key Exchange:     X25519 + ML-KEM-768 hybrid (FIPS 203)
  KDF:              HKDF-SHA-256
  AEAD:             ChaCha20-Poly1305
  Hash:             BLAKE2s
  Signatures:       Ed25519 (upgrade path to ML-DSA-65 in GRP/2)
  Block Size:       16,384 bytes with '#' padding (matches SMP)
  Rekeying:         Every 2-5 minutes or 1000 messages
```

---

## 8. Risk assessment

### 8.1 Protocol and implementation risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| SimpleX changes smp-web API before release | High | Medium | Pin to specific commit, contribute upstream |
| v7+ command auth complexity | Medium | Medium | Reference PR #982, Evgeny's code on ep/smp-web |
| Double Ratchet implementation complexity | Medium | High | Start with NaCl box MVP, upgrade later |
| WebSocket blocked by corporate firewalls | Medium | Low | HTTP/2 long-polling fallback (future) |
| PR #1738 not merged upstream | Low | Medium | We build from source, can track changes |

### 8.2 Browser-specific security risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| XSS defeating all encryption | Critical | Medium | Strict CSP, SRI, Web Worker isolation |
| Server-delivered code manipulation | Critical | Low | Reproducible builds, SRI hashes |
| npm supply chain attack | High | Medium | @noble-only crypto, lockfile pinning |
| Cross-Site WebSocket Hijacking | High | Low | Token-based auth (not cookies) |
| Let's Encrypt cert renewal | Medium | Low | certbot auto-renewal, manual cert copy to Docker |

---

## 9. Open questions

1. **v7+ auth implementation:** How exactly does X25519 DH-based command authorization work? Need to study PR #982 and Evgeny's ep/smp-web code.

2. **Upstream contribution:** Should we contribute our WebSocket transport client back to the `smp-web` package?

3. **Server choice:** Self-hosted SMP server vs using SimpleX's public servers?

4. **Message persistence:** How long should chat history persist in the browser?

5. **Let's Encrypt renewal:** Automate cert copy to Docker mount after certbot renewal.

---

## 10. Ecosystem context

GoChat is one component of the SimpleGo ecosystem for encrypted communication across platforms.

| Project | What it does | Language | Status |
|:--------|:-------------|:---------|:-------|
| **[SimpleGo](https://github.com/saschadaemgen/SimpleGo)** | First native C implementation of SimpleX protocol on ESP32-S3. | C (21,863 lines) | Alpha, 7 contacts verified |
| **GoRelay** | Dual-protocol relay server. SMP + GRP. | Go (~5,000 lines) | Alpha, SimpleX test passing |
| **GoChat** | Browser-native encrypted messenger. (This project) | TypeScript | Season 11 complete |

---

## 11. Task registry (quick reference)

| ID | Layer | Description | Season |
|:---|:------|:------------|:-------|
| WS-1 | Transport | WebSocket transport class (ChatTransport) | S2 DONE |
| WS-2 | Transport | SMP client with handshake | S2 DONE |
| WS-3 | Transport | Connection pooling and reconnect | S2 DONE |
| WS-4 | Transport | SharedWorker for tab persistence | S9 |
| CMD-1 | Commands | Queue creation (NEW/IDS) | S3 DONE |
| CMD-2 | Commands | Sender commands (SEND/SKEY) | S3 DONE |
| CMD-3 | Commands | Recipient commands (SUB/ACK/KEY/DEL/MSG) | S3 DONE |
| CMD-4 | Commands | Connection link commands (LGET/LNK/LSND) | S3 DONE |
| CMD-5 | Commands | Utility commands (PING/PONG/ERR) | S3 DONE |
| CONN-1 | Connection | Contact address parsing (all formats) | S4 DONE |
| CONN-2 | Connection | Connection state machine (7 states) | S4 DONE |
| CONN-3 | Connection | Queue pair creation + ConnectionManager | S4 DONE |
| CONN-4 | Connection | Connection request (X3DH + Ratchet + 6 crypto layers) | S4 DONE |
| E2E-1 | Encryption | Ratchet receive side (decrypt incoming) | S8 |
| E2E-2 | Encryption | Symmetric ratchet step (advance chain) | S8 |
| E2E-3 | Encryption | DH ratchet step (re-key on transitions) | S8 |
| E2E-4 | Encryption | Out-of-order message handling | S8 |
| E2E-5 | Encryption | Header decryption (current + next key) | S8 |
| E2E-6 | Encryption | Key storage (IndexedDB + AES-256-GCM) | S8 |
| BC-1 | Browser Client | Browser client API (browser-client.ts) | S5 DONE |
| BC-2 | Browser Client | Browser bundle (esbuild IIFE) | S5 DONE |
| BC-3 | Browser Client | Integration tests (24 tests, 7 scenarios) | S5 DONE |
| CHAT-1 | Chat UI | Chat panel (CSS, JS, HTML, left-docked, responsive) | S5 DONE |
| INFRA-1 | Infrastructure | SMP server Docker deployment (smp.simplego.dev) | S5 DONE |
| INFRA-2 | Infrastructure | Nginx WSS reverse proxy (port 8444) | S5 DONE (eliminated S7) |
| INFRA-3 | Infrastructure | Contact address setup | S5 DONE |
| PROTO-1:15 | Protocol | 15 real-server SMP v6 protocol fixes | S5 DONE |
| INV-1 | Invitation | AgentInvitation builder (invitation.ts) | S6 DONE |
| INV-2 | Invitation | connReq URI builder (smp + e2e params) | S6 DONE |
| INV-3 | Invitation | NaCl encryption fix (nacl.box vs raw cipher) | S6 DONE |
| INV-4 | Invitation | 12 protocol fixes (A_CRYPTO + A_MESSAGE) | S6 DONE |
| SEC-6 | Security | Security hardening roadmap document | S6 DONE |
| S7-1:10 | Infrastructure | Server upgrade, ALPN fix, PR #1738 build, Nginx elimination | S7 DONE |
| S8-1 | Auth | Parse server auth X25519 key from ServerHello | S8 DONE |
| S8-2 | Auth | CbAuthenticator (nacl.box over SHA-512) | S8 DONE |
| S8-3 | Auth | Negotiate v9, ClientHello with X25519 session key | S8 DONE |
| S8-4 | Auth | Per-queue auth keys Ed25519 -> X25519 | S8 DONE |
| S8-5 | Protocol | v9 NEW with Maybe BasicAuth '0' + sndSecure 'T' | S8 DONE |
| S8-6 | Protocol | Fix SMP Maybe encoding (ASCII '0', not binary 0x00) | S8 DONE |
| S8-7 | Crypto | Fix CbAuth: nacl.box not nacl.secretbox (HSalsa20) | S8 DONE |
| S8-8 | Infrastructure | Server rebuild (Debian 13, Nginx + Certbot, Docker) | S8 DONE |
| S8-9 | Protocol | Remove debug logging, clean up protocol.ts | S8 DONE |
| S8-10 | Protocol | MSG processing with server-to-recipient decryption | S8 DONE |
| S8-11 | Protocol | Parse RcvMsgBody (SystemTime=12B) | S8 DONE |
| S8-12 | Protocol | ACK with CbAuthenticator | S8 DONE |
| S8-13 | Crypto | Layer 1 NaCl decryption of smpEncConfirmation | S8 DONE |
| S8-14 | Crypto | Parse smpConfirmation (sender key + AgentConfirmation) | S8 DONE |
| S9-1:8 | Encryption | AgentConfirmation, X3DH, Ratchet, HELLO, CON | S9 DONE |
| S10-1:10 | Chat + UX | Bidirectional chat, visitor name, multi-step UX, destruction | S10 DONE |
| S11-1 | Protocol | Parse incoming delivery receipts (A_RCVD tag 'V') | S11 DONE |
| S11-2 | Protocol | Send delivery receipts for received chat messages | S11 DONE |
| S11-3 | Protocol | Fix receipt msgHash scope (full agentMessage buffer) | S11 DONE |
| S11-4 | Protocol | Wire onSubscriptionEnd for queue END detection | S11 DONE |
| S11-5 | Client | Add connection timeout for unresponsive agents | S11 DONE |
| S11-6 | Protocol | Send x.direct.del notification before disconnect | S11 DONE |
| S11-7 | UI | chat.js receipt UI (onDeliveryReceipt, pendingChecks) | S11 DONE |
| S11-8 | Config | .env integration (dotenv + 11ty + base.njk) | S11 DONE |
| SEC-1 | Security | Content Security Policy | S12 |
| SEC-2 | Security | Subresource Integrity | S12 |
| SEC-3 | Security | Web Worker crypto isolation | S12 |
| SEC-4 | Security | Trust boundary documentation | S12 |
| SEC-5 | Security | TLS certificate strategy | S5/S7 DONE |
| LIB-1:5 | Library | simplex-js npm library | S13 |
| GRP-1 | GRP Transport | Noise Protocol transport | S14 |
| GRP-2 | GRP Transport | ML-KEM-768 post-quantum | S14 |
| GRP-3 | GRP Transport | Two-hop relay routing | S15+ |
| GRP-4 | GRP Transport | Triple Shield (ZKP, Shamir, Stego) | S16+ |

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Initial protocol document created. Analyzed `ep/smp-web-spike` branch, documented existing infrastructure, defined implementation roadmap. |
| 2026-03-25 | Major update: added dual-profile architecture (SMP + GRP), ChatTransport interface requirement, new task categories (GRP-1 to GRP-4, SEC-1 to SEC-5, UI-6 to UI-8, WS-4), browser-specific risk assessment, ecosystem context, ground rules, task registry. |
| 2026-03-25 | Season 2 complete. WS-1, WS-2, WS-3 implemented. |
| 2026-03-25 | Season 4 complete. CONN-1 to CONN-4 implemented. 226 new tests (413 total). |
| 2026-03-26 | Season 5 complete. Chat UI, browser client API, SMP server infrastructure, 15 protocol fixes. 485 tests. |
| 2026-03-28 | Season 6 complete. Connection request to SimpleX App. 12 protocol fixes. 493 tests. |
| 2026-03-28 | Season 7 complete. Server upgrade to PR #1738 build. ALPN fix enables v6-18 over WebSocket. Nginx eliminated, Docker direct port mapping. 4096-bit RSA cert. sndSecure confirmed as v9+ only (v6 parser limitation). v7+ command auth identified as Season 8 prerequisite. Added Section 5.1d, Phase 3c/3d, Section 7.6, S7 and S8 task IDs. Season numbers shifted: S8 = v7+ auth + bidirectional messaging, S9 = polish, S10 = security, S11 = library, S12+ = GRP. |
| 2026-03-30 | Season 8 complete. Implemented v9 CbAuthenticator (nacl.box over SHA-512), server rebuilt on Debian 13 (Nginx + Certbot + Docker), MSG processing with server-to-recipient decryption (nacl.box.open), Layer 1 NaCl decryption of smpEncConfirmation, RcvMsgBody parsing (SystemTime=12B), ACK with CbAuth. Key discoveries: HSalsa20 in nacl.box (not nacl.secretbox), Maybe encoding = ASCII '0'/'1' (not binary), four DH keypairs per connection, asymmetric smpEncConfirmation format. 494 tests. 14 S8 task IDs (all DONE). E2E tasks renumbered for S9 (X3DH + Double Ratchet + CON). Added Section 5.1e, Phase 3d/3e. |
| 2026-03-31 | Season 9 complete. AgentConfirmation parsing with SNTRUP761 PQ KEM support. X3DH key agreement (receiver side). Double Ratchet encrypt/decrypt (AES-256-GCM with 16-byte IV). Reply queue parsing from AgentConnInfoReply. Full duplex handshake (send AgentConfirmation to CLI). HELLO received - CONNECTION ESTABLISHED. Chat messages received and decrypted. 11 PRs (#67-#77), 537 tests. Added Section 5.1f with 8 S9 task IDs (all DONE). |
| 2026-04-01 | Season 10 complete. Bidirectional E2E chat with Desktop App. 11 PRs (#79-#89), 544+ tests. Visitor name, multi-step UX, offline messaging, delete confirmation. Critical: widget must never inject DOM, status only from state machine, parse JSON events. Added Section 5.1g with 10 S10 task IDs (all DONE). |
| 2026-04-02 | Season 11 complete. Delivery receipts (bidirectional, A_RCVD tag 'V', double checkmarks). Receipt msgHash fix (3 attempts, full agentMessage buffer). Connection lifecycle (END detection, timeout, x.direct.del send). .env integration (dotenv + 11ty). chat.js receipt UI. 5 PRs (#91-#95), 551+ tests. Key discoveries: msgHash = sha256(full agentMessage), dotenv # comment trap, onSubscriptionEnd was dead code. Added Section 5.1h, Phase 3g, delivery receipt wire format in 7.5, END in 7.4, 8 S11 task IDs (all DONE). |
