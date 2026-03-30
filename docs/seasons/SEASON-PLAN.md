<p align="center">
  <img src="../../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<h1 align="center">GoChat - Season Plan</h1>

<p align="center">
  <strong>Season-based development roadmap for the GoChat encrypted web messenger.</strong><br>
  Each season has a clear goal, defined scope, and produces a protocol document with learnings.
</p>

---

**Project:** GoChat - Browser-Native Encrypted Messenger  
**Parent project:** [SimpleGo](https://github.com/saschadaemgen/SimpleGo)  
**Workflow:** Season-based development with Claude Code  
**Planning by:** Prinzessin Mausi  
**Code by:** Claude Code  
**Direction by:** Sascha (saschadaemgen)  
**Repository:** [saschadaemgen/GoChat](https://github.com/saschadaemgen/GoChat)  
**Base branch:** `feat/simplego-support-chat`

---

## How we work

Each season has a clear goal, a defined scope, and produces a protocol document at the end documenting all successes, failures, and learnings. Code is written by Claude Code, directed and reviewed by Sascha, planned by Prinzessin Mausi in the chat sessions.

**Three-role workflow:**
- **Prinzessin Mausi** (Claude chat): Planning, briefings, UI design, protocol analysis, documentation
- **Der Prinz / Sascha**: Direction, PR reviews, testing, server administration, final decisions
- **Der Ritter / Claude Code**: Implementation, receives briefings, pushes feature branches

**Ground rule (all seasons):** Nothing invented. What is missing gets asked. The Prinzessin shows everything needed.

All commits follow Conventional Commits format: `type(scope): description`

Season protocol documents live in `docs/seasons/` and serve as a development diary - anyone can look at the source code and understand how and why we built things the way we did.

At the end of each season, ALL project documents are updated: README.md, PROTOCOL.md, RESEARCH.md, SEASON-PLAN.md, CLAUDE.md, and SECURITY-HARDENING-ROADMAP.md. This is a main priority and non-negotiable.

```
docs/
  PROTOCOL.md                    # Main technical protocol
  RESEARCH.md                    # Browser crypto, security, design research
  SECURITY-HARDENING-ROADMAP.md  # Six-phase browser security hardening plan
  seasons/
    SEASON-PLAN.md               # This file
    SEASON-01-planning.md        # Planning and documentation
    SEASON-02-transport.md       # WebSocket transport
    SEASON-03-commands.md        # SMP commands
    SEASON-04-connection-flow.md # Connection flow + X3DH + Double Ratchet
    SEASON-05-real-server.md     # Chat UI + browser client + real server connectivity
    SEASON-06-connection-request.md # Connection request to SimpleX App
    SEASON-07-server-upgrade.md  # Server upgrade, ALPN fix, v6-18 over WebSocket
    SEASON-08-v9-auth.md         # v9 CbAuthenticator, server rebuild, MSG + Layer 1 decrypt
    SEASON-09-x3dh-ratchet.md    # AgentConfirmation, X3DH, Double Ratchet, HELLO, CON (next)
```

---

## Season 1: Planning and documentation

**Status:** Complete  
**Goal:** Complete project analysis, fork setup, dual-profile architecture design, deep research, community contact, roadmap, and workflow definition.

### Deliverables

- [x] Analyze `ep/smp-web-spike` branch - understand what exists
- [x] Analyze PR #1738 (WebSocket on SMP server port)
- [x] Analyze xftp-web shared infrastructure (crypto, encoding, transport)
- [x] Write main protocol document (`PROTOCOL.md`)
- [x] Fork repository (GoChat)
- [x] Clean repo: remove all Haskell code, 80+ upstream branches
- [x] Replace README with project documentation
- [x] Research SimpleX community discussion about smp-web
- [x] Post in SimpleX community about our plans
- [x] Evgeny Poberezkin (SimpleX founder) confirms smp-web is active WIP
- [x] Community feedback: "10 of 10 Points" for architecture diagram
- [x] Write season plan document
- [x] Deep research: browser crypto maturity, security analysis, design patterns
- [x] Write research document (`RESEARCH.md`)
- [x] Design dual-profile architecture (SMP + GRP)
- [x] Define ChatTransport interface as day-one abstraction requirement
- [x] Update PROTOCOL.md with dual-profile, GRP tasks, SEC tasks, expanded UI tasks
- [x] Update RESEARCH.md with dual-profile context throughout
- [x] Update SEASON-PLAN.md with GRP seasons and expanded scope
- [x] Set up GPG signing (key E13737C02E97E54B)
- [x] Create `.claude/CLAUDE.md` for Claude Code instructions
- [x] Create `.github/assets/gochat_banner.png`
- [x] Create season 1 closing protocol (`SEASON-01-planning.md`)

### Key decisions made

1. **Architecture:** Direct browser-to-SMP-server via WebSocket (no CLI bridge)
2. **Base:** Build on top of `ep/smp-web-spike`, reuse xftp-web infrastructure
3. **Dual-profile architecture:** SMP profile for everyday use, GRP profile for high-security environments
4. **ChatTransport interface from day one:** All transport code goes through an abstract interface
5. **Encryption MVP:** Start with NaCl secretbox via @noble/ciphers, upgrade to Double Ratchet later
6. **Crypto library:** @noble/curves + @noble/ciphers + @noble/hashes for both profiles
7. **Multi-user:** Native via SimpleX contact address system
8. **UI ambition:** Intercom-level polish, not "functional minimum". Encryption badge is the brand.
9. **Project name:** GoChat (ecosystem: SimpleGo, GoRelay, GoChat)
10. **No mobile app:** SimpleX covers mobile/desktop. GoChat fills the browser gap.
11. **GoChat extends SimpleX, does not replace it.**

---

## Season 2: WebSocket transport client

**Status:** Complete  
**Goal:** Browser can establish a WebSocket connection to an SMP server, complete the handshake, and send/receive raw SMP blocks.
**Result:** 3 tasks, 3 PRs merged. Transport layer stack fully operational.

### Success criteria

- [x] Browser opens WebSocket to SMP server on port 443
- [x] Handshake completes successfully
- [x] PING/PONG keepalive works
- [x] Connection auto-reconnects after drop
- [x] Can send a raw SMP block and receive a response
- [x] Transport class implements ChatTransport interface

---

## Season 3: SMP commands

**Status:** Complete  
**Goal:** Implement all SMP commands needed for basic messaging.
**Result:** 4 tasks, 4 PRs merged (#4, #5, #6, #7), 187 tests across 8 files. Full command layer operational with mock integration testing.

### Deliverables

- [x] 14 command encoders in `commands.ts` (NEW, SUB, KEY, SKEY, SEND, ACK, DEL, OFF, GET, NKEY, NDEL, NSUB, PING, QUE)
- [x] Extended response decoder in `protocol.ts` (IDS, MSG, NID, NMSG, INFO, PONG, END, full ERR tree)
- [x] 12 typed client methods with CorrId-matched dispatch in `client.ts`
- [x] Mock SMP server for integration testing
- [x] End-to-end roundtrip tests (NEW -> KEY -> SEND -> MSG -> ACK -> DEL)

### Success criteria

- [x] Can create a queue on SMP server (NEW -> IDS)
- [x] Can subscribe to a queue (SUB)
- [x] Can send a message to a queue (SEND -> OK)
- [x] Can receive a message from a queue (MSG event)
- [x] Can acknowledge message receipt (ACK)
- [x] All commands have encode/decode unit tests
- [x] Full integration test with mock SMP server

---

## Season 4: Connection flow

**Status:** Complete  
**Goal:** Full connection establishment from browser to SimpleX app via contact address.
**Result:** 12 PRs merged, 413 tests across 16 files. Complete connection flow with X3DH key agreement and Double Ratchet encryption.

### Deliverables

- [x] Contact address parser (both simplex:/ and https:// formats, short links v6.4+ and legacy)
- [x] Connection state machine (7 states with validated transitions)
- [x] Queue pair creation via ConnectionManager
- [x] X3DH modified 4-DH key agreement (4x X448 DH + HKDF-SHA512 "SimpleXX3DH")
- [x] Double Ratchet initialization + first encrypt (AES-256-GCM, HKDF-SHA256)
- [x] Agent confirmation envelope (agentVersion=7, X448 SPKI keys, e2e v3)
- [x] SMP confirmation with NaCl Layer 1 (XSalsa20-Poly1305)
- [x] connInfo as zstd-compressed JSON (ChatMessage v1-16, x.info event)

### Success criteria

- [x] Can parse a SimpleX contact address link (both simplex:/ and https:// formats)
- [x] Browser creates queue pair on SMP server (against mock)
- [x] X3DH key exchange produces correct shared secrets
- [x] Double Ratchet encrypts first message correctly
- [x] Connection request fully encoded with 6 crypto layers

---

## Season 5: Chat UI + browser client + real server connectivity

**Status:** Complete  
**Goal:** Build the complete pipeline from browser to real SMP server - chat UI, browser client API, server infrastructure, and protocol compatibility.
**Result:** 15 PRs merged (#19-#33), 485 tests across 19 files. First successful queue creation on real SMP v6 server from browser via WebSocket.

**Scope change:** Originally planned as "E2E Encryption Hardening". Shifted to real-server connectivity because the mock tests (413 from Season 4) all passed but the real server exposed 15 protocol incompatibilities.

### Deliverables

**Phase 1: Chat UI**
- [x] chat.css: 380px left-docked panel, responsive, gc- prefix, animations, prefers-reduced-motion
- [x] chat.js: panel logic, mock/real mode, window.GoChat public API
- [x] base.njk: chat HTML integration with data attributes for contact address and server URL

**Phase 2: Browser Client**
- [x] browser-client.ts: createBrowserClient() factory with connect/send/disconnect
- [x] esbuild IIFE bundle: gochat-client.js (~211KB, window.createBrowserClient)
- [x] 24 integration tests across 7 scenarios (lifecycle, reconnect, errors, rapid sends, idempotency)

**Phase 3: Server Infrastructure**
- [x] SMP server: Docker simplexchat/smp-server v6.4.5.1 on smp.simplego.dev
- [x] WebSocket port 5225 activated, native TLS on port 5223
- [x] Nginx WSS reverse proxy on port 8444 with Let's Encrypt TLS termination
- [x] Contact address from own server embedded in website

**Phase 4: Protocol Debugging (15 fixes)**
- [x] ESM to IIFE bundle format
- [x] Address parser URL decode (double-encoded parameters)
- [x] ServerHello without certs (WebSocket mode)
- [x] WebSocket server URL (use config, not contact address port)
- [x] Frame reassembly for proxied 16KB blocks
- [x] Debug logging (console.log at every step)
- [x] Response sessionId skip for v6
- [x] Outgoing sessionId for v6 commands
- [x] Session wire format (position after signature)
- [x] NEW command exact v6 format (no spaces, no basicAuth, no sndSecure)
- [x] Ed25519 signing for NEW command (sigLen=0x40)
- [x] SessionId in signed data with 0x20 length prefix
- [x] Result: NEW -> IDS (queue successfully created on real server!)

### Key lessons

- esbuild.config.mjs gets overwritten by rebases - must be IIFE, not ESM
- SMP v6 sessionId behavior is asymmetric (in/out/signing all different)
- Docker entrypoint resets smp-server.ini on every start
- SimpleGo protocol team (49 sessions) provided critical wire format knowledge
- Full closing protocol: [SEASON-05-real-server.md](SEASON-05-real-server.md)

---

## Season 6: Connection request to SimpleX App

**Status:** Complete  
**Goal:** Send a connection request from the browser that the SimpleX App recognizes and displays.
**Result:** 4 PRs merged (#39, #42, #44, #45) plus ~10 direct pushes for rapid iteration. 493 tests (3 skipped). SimpleX App shows "Website Visitor - New contact request."

**Scope:** Originally planned as "Bidirectional messaging (7-step flow)". Achieved Steps 1-3 (connection request visible in app). Steps 4-7 (handshake completion + messaging) deferred.

### Deliverables

- [x] SEND command with correct format (ASCII flags 'F', unsigned sigLen=0x00)
- [x] NaCl encryption fix: nacl.box() instead of raw xsalsa20poly1305 (HSalsa20 step)
- [x] AgentInvitation ('I' tag) with PHEmpty ('_') instead of AgentConfirmation
- [x] connReq URI builder with X448 x3dh= params
- [x] Security hardening roadmap document

### Fix progression (12 fixes)

| # | Error | Fix |
|---|-------|-----|
| 1-2 | Empty body, wrong sizes | Wire up sendInvitation, correct padding constants |
| 3-4 | A_CRYPTO | nacl.box() for HSalsa20, remove premature Ratchet encryption |
| 5-12 | A_MESSAGE | Tag 'I' not 'C', PHEmpty '_', connReq URI, x3dh= keys, q=m, port 5223 |

### Key discoveries

1. **Joining party sends AgentInvitation, not AgentConfirmation** - completely different message structure
2. **First contact has no Ratchet** - no peer X448 keys available, only per-queue NaCl encryption
3. **nacl.box() includes HSalsa20** - raw XSalsa20-Poly1305 produces wrong ciphertext without it
4. Full closing protocol: [SEASON-06-connection-request.md](SEASON-06-connection-request.md)

---

## Season 7: Server upgrade, ALPN fix, v6-18 over WebSocket

**Status:** Complete  
**Goal:** Resolve the AUTH error when the SimpleX CLI accepts GoChat's invitation by enabling the full SMP protocol range (v6-18) over WebSocket.
**Result:** 4 PRs merged (#47, #48, #49, #50) plus direct pushes. SMP server rebuilt from PR #1738 source. Nginx eliminated. Browser gets v6-18 over WebSocket.

**Scope change:** Originally planned as "Bidirectional messaging (Steps 4-7)". The AUTH error investigation revealed a three-layer root cause chain that required a full server infrastructure overhaul instead of code changes.

### Root cause chain

```
CLI sends SKEY -> AUTH (queue has no sndSecure)
  -> sndSecure needs v9+ negotiation
    -> Server offers v6-v6 over WebSocket (no ALPN "smp/1")
      -> FIX: PR #1738 extends ALPN list, browser gets v6-v18
```

### Key discoveries

1. **SKEY comes before SEND** - CLI aborts immediately if SKEY fails, AgentConfirmation never sent
2. **ALPN determines protocol version range** - no "smp/1" = v6-v6, any ALPN = v6-v18
3. **sndSecure requires v9+ negotiation** - v6 command parser has no sndSecure code
4. **v7+ uses X25519 DH auth** - Ed25519 signatures replaced by crypto_box authorization
5. **PR #1738 extends server ALPN list** to `["smp/1", "h2", "http/1.1"]`
6. Full closing protocol: [SEASON-07-server-upgrade.md](SEASON-07-server-upgrade.md)

---

## Season 8: v9 command authorization, server rebuild, MSG + Layer 1 decrypt

**Status:** Complete  
**Goal:** Implement v9 command authorization (CbAuthenticator), rebuild server infrastructure, process incoming MSG, and decrypt the AgentConfirmation.
**Result:** 13 PRs merged (#52-#65). 494 tests. Server rebuilt on Debian 13. CLI's AgentConfirmation decrypted (14,777 bytes, version 7, tag 'C').

### Deliverables

**Phase 1: v9 CbAuthenticator**
- [x] Parse ServerHello authPubKey from X.509 certificate chain
- [x] Send ClientHello with session X25519 auth public key
- [x] CbAuthenticator: X25519 DH + SHA-512 hash + nacl.box encryption (80 bytes)
- [x] NEW v9 format: 97 bytes with Maybe BasicAuth (ASCII '0') + sndSecure ('T')
- [x] v6 diagnostic fallback to isolate CbAuth as the problem
- [x] Server-side debug logging (3 iterations) to compare browser vs server computations
- [x] THE FIX: nacl.box instead of nacl.secretbox (HSalsa20 key derivation)

**Phase 2: Server infrastructure rebuild**
- [x] Plesk removed (caused Nginx/Apache port conflicts)
- [x] Debian 13 fresh install at IONOS
- [x] Nginx + Certbot (Let's Encrypt, auto-renewal, expires 2026-06-27)
- [x] Docker SMP server v6.5.0.11 rebuilt from PR #1738
- [x] Chrome certificate issue resolved (removed Plesk certs from Windows store)

**Phase 3: MSG processing**
- [x] MSG detection (empty corrId = server push)
- [x] Server-to-recipient decryption: nacl.box.open with serverDhKey + recipientDhPrivKey
- [x] RcvMsgBody parsing: 12B SystemTime + 1B MsgFlags + 1B space + body
- [x] ACK with CbAuthenticator (v9)

**Phase 4: Layer 1 NaCl decryption**
- [x] Parse smpEncConfirmation envelope (no version prefix, Maybe DH key, nonce, encrypted body)
- [x] Decrypt with nacl.box.open using Alice's DH pub + our queueDh private key
- [x] Unpad content (2B BE length prefix + data + '#' fill)
- [x] Parse smpConfirmation (sender auth key + AgentConfirmation body)
- [x] Result: 14,777B AgentConfirmation, starts with 00 07 43 (version 7, tag 'C')

### PRs

| PR | Change | Result |
|:---|:-------|:-------|
| #52 | ServerHello authPubKey + v9 CbAuth | CMD SYNTAX |
| #53 | Fix Maybe BasicAuth (0x00) | CMD SYNTAX |
| #54 | Fix Maybe BasicAuth (ASCII '0') | AUTH |
| #55 | Debug logging | AUTH (visible) |
| #56 | v6 diagnostic fallback | IDS + SEND OK |
| #57 | Revert to v9 | AUTH (server debug) |
| #58 | **nacl.box fix** | **IDS! SKEY! SEND!** |
| #59 | MSG processing + ACK | MSG decrypted, ACK OK |
| #61 | Layer 1 NaCl decrypt | Parse error |
| #62 | Fix SystemTime (12B not 8B) | Body parsed |
| #63 | Fix no version prefix | Wrong key |
| #64 | Fix Layer 1 key | Still wrong key |
| #65 | **Save queueDhKeyPair** | **Layer 1 decrypted!** |

### Key discoveries

1. **HSalsa20 trap:** nacl.box includes HSalsa20, nacl.secretbox does not. Same bug as SimpleGo Session 34.
2. **SMP Maybe = ASCII '0'/'1':** NOT binary 0x00/0x01.
3. **SystemTime = 12 bytes:** Int64 (8B) + Word32 (4B), not 8.
4. **No version prefix in incoming smpEncConfirmation:** Starts directly with Maybe tag.
5. **Four DH keypairs:** recipientAuth, recipientDh, queueDh, e2eDh - each for a different purpose.
6. **queueDhKeyPair must be preserved:** Private key needed for Layer 1, was thrown away in buildInvitation().
7. Full closing protocol: [SEASON-08-v9-auth.md](SEASON-08-v9-auth.md)

---

## Season 9: AgentConfirmation, X3DH, Double Ratchet, HELLO, CON

**Status:** Next  
**Goal:** Parse the decrypted AgentConfirmation, perform X3DH key agreement with real keys, initialize the Double Ratchet, exchange HELLO messages, and reach CON (connected) state for bidirectional encrypted messaging.

### Starting point

The browser has the CLI's decrypted AgentConfirmation (14,777 bytes). The first bytes are `00 07 43` - agentVersion 7, tag 'C'. This data contains Alice's X448 keys and e2eEncryption parameters.

### The plan

```
Phase 1: Parse AgentConfirmation (extract X448 keys, e2e params, connInfo)
Phase 2: X3DH key agreement with real X448 keys (4 DH + HKDF-SHA512)
Phase 3: Double Ratchet initialization (receiving side)
Phase 4: Decrypt CLI's HELLO message
Phase 5: Send our HELLO message
Phase 6: CON state - bidirectional encrypted messaging
Phase 7: Documentation (SMP-VERSIONS.md, SMP-HANDSHAKE.md)
```

### Key references

- `Agent/Client.hs` - AgentConfirmation encoding, X3DH flow
- `Crypto.hs` - X3DH key agreement, Double Ratchet initialization
- Season 4 code (`x3dh.ts`, `ratchet.ts`) - existing building blocks (untested with real data)
- SimpleGo Protocol Analysis Sessions 14-25 - X3DH and Double Ratchet wire format

### Success criteria

- [ ] AgentConfirmation parsed (X448 keys, e2e version, connInfo)
- [ ] X3DH key agreement with real keys produces shared secrets
- [ ] Double Ratchet initialized for receiving direction
- [ ] CLI's HELLO message decrypted
- [ ] Our HELLO message sent and accepted
- [ ] CON state reached
- [ ] Browser sends message, CLI displays it
- [ ] CLI sends message, browser displays it
- [ ] SMP-VERSIONS.md created (version differences table)
- [ ] SMP-HANDSHAKE.md created (complete handshake reference)

### This is the milestone

After this season, a website visitor can click "Start Encrypted Chat", connect to the support team's SimpleX app, and exchange real encrypted messages - end-to-end encrypted from the first message.

---

## Season 10: Production polish and website integration

**Status:** Planned  
**Goal:** Polish the chat experience to Intercom-level quality and fully integrate into the SimpleGo website.

### Scope

- Intercom-level animation system (message appear, panel open, typing indicator, launcher morph)
- SharedWorker for tab persistence (WS-4)
- Message persistence in IndexedDB (chat history survives page reload)
- SPA router integration (chat survives page navigation)
- Mobile responsive polish (full-screen panel, touch targets)
- Encryption badge with SMP/GRP profile indicator
- Accessibility audit (WCAG 2.1 AA)
- Chat + Player coexistence refinement
- Debug logging cleanup (remove all DIAG logs from invitation.ts)

---

## Season 11: Production hardening + security review

**Status:** Planned  
**Goal:** Battle-tested, deployable encrypted support chat with complete security hardening.

### Scope

- Content Security Policy (strict, no eval, no inline scripts)
- Subresource Integrity for all external scripts
- Web Worker isolation for crypto operations
- Trust boundary documentation (honest about browser limitations)
- Key storage (IndexedDB + AES-256-GCM encryption at rest)
- Performance optimization (bundle size, memory)
- Error handling for all edge cases
- Security review

### SMP profile complete after this season

After Season 11, GoChat's SMP profile is production-ready. The GRP profile development begins afterward.

---

## Season 12: simplex-js npm library

**Status:** Planned  
**Goal:** Extract the SMP browser client into a standalone npm library that anyone can use.

### Scope

- API design document for public library
- Package scaffolding (build, bundle, tree-shake, types)
- Extract core modules from GoChat (transport, client, commands, crypto)
- SimpleXClient facade class for easy integration
- Zero-dependency audit (only @noble packages)
- Documentation and examples

---

## Season 13: GRP - Noise transport

**Status:** Future  
**Goal:** Implement the Noise Protocol transport layer for the GRP profile.

### Scope

- `smp-web/src/grp/transport.ts` - GRP transport class implementing `ChatTransport`
  - Noise_IK_25519_ChaChaPoly_BLAKE2s
  - Noise_XX fallback for first-contact scenarios
  - No cipher negotiation - fixed suite per protocol version
  - Rekeying every 2-5 minutes or every 1000 messages
- Browser Noise implementation via @noble/ciphers and @noble/hashes
- Connect to GoRelay server on port 7443 via WSS

### Prerequisites

- GoRelay must have GRP listener implemented (GoRelay Phase 4)

---

## Season 14: GRP - Post-quantum key exchange

**Status:** Future  
**Goal:** Add mandatory ML-KEM-768 hybrid key exchange to the GRP transport.

### Prerequisites

- GoRelay must have ML-KEM-768 hybrid exchange implemented (GoRelay Phase 4)

---

## Season 15: GRP - Two-hop relay routing

**Status:** Future  
**Goal:** Implement mandatory two-hop message routing for the GRP profile.

### Prerequisites

- GoRelay must have two-hop relay implemented (GoRelay Phase 5)
- Minimum two GoRelay servers deployed in different jurisdictions

---

## Season 16+: GRP - Triple Shield and beyond

**Status:** Future  
**Goal:** Implement the Triple Shield defense layer and additional features.

### Potential future seasons

- **Triple Shield 6a:** Zero-Knowledge Queue Authentication (Schnorr DLOG via Fiat-Shamir)
- **Triple Shield 6b:** Shamir's Secret Sharing 2-of-3 across servers
- **Triple Shield 6c:** Steganographic Transport (Pluggable Transports: HTTPS, WebSocket, meek, obfs4)
- **Admin Panel:** Multi-conversation browser dashboard for support agents (E2E encrypted)
- **File sharing:** Send images/files via XFTP protocol
- **Typing indicators:** Show when support team is typing
- **Push notifications:** Browser notifications for new messages
- **Chat transcript export:** User can download their chat history
- **Multiple support agents:** Route to available team member
- **Upstream contribution:** Contribute WebSocket client back to SimpleX project

---

## Quick reference: Season overview

| Season | Focus | Key output | Status |
|:-------|:------|:-----------|:-------|
| S1 | Planning and docs | Protocol, research, season plan, dual-profile design | Complete |
| S2 | WebSocket transport | `transport.ts`, `client.ts`, `agent.ts` | Complete |
| S3 | SMP commands | `commands.ts`, typed client, mock server, 187 tests | Complete |
| S4 | Connection flow | `address.ts`, `connection.ts`, X3DH, Double Ratchet, 413 tests | Complete |
| S5 | Chat UI + real server | Chat panel, browser-client, Nginx proxy, 15 protocol fixes, 485 tests | Complete |
| S6 | Connection request | AgentInvitation, connReq URI, NaCl crypto_box, 12 fixes, 493 tests | Complete |
| S7 | Server upgrade + ALPN | PR #1738 build, v6-18 over WebSocket, Nginx eliminated, 4096-bit cert | Complete |
| S8 | v9 auth + MSG + Layer 1 | CbAuthenticator, server rebuild, MSG decrypt, AgentConfirmation, 494 tests | Complete |
| **S9** | **X3DH + Ratchet + CON** | **Parse AgentConf, X3DH, Double Ratchet, HELLO, real chat** | **Next** |
| S10 | Production polish | Animations, SharedWorker, IndexedDB, accessibility | Planned |
| S11 | Security hardening | CSP, SRI, Web Worker crypto, security review | Planned |
| S12 | simplex-js library | Standalone npm package for SMP browser client | Planned |
| S13 | GRP: Noise transport | `grp/transport.ts`, Noise IK/XX | Future |
| S14 | GRP: Post-quantum | ML-KEM-768 hybrid key exchange | Future |
| S15 | GRP: Two-hop routing | PFWD/RFWD/RRES/PRES, cover traffic | Future |
| S16+ | GRP: Triple Shield | ZKP, Shamir, steganographic transport | Future |

**SMP critical path:** S1 -> S2 -> S3 -> S4 -> S5 -> S6 -> S7 -> S8 -> S9 -> S10 -> S11
**Library track:** S12 after S11
**GRP track:** S13 -> S14 -> S15 -> S16+ (begins after SMP profile is production-ready)
**GRP dependency:** GoRelay must complete its corresponding phases first

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Season plan created by Prinzessin Mausi. Defined 8 seasons covering planning through production. |
| 2026-03-25 | Season 2 complete. Marked S1 and S2 complete, S3 current. Updated Season 2 success criteria. |
| 2026-03-25 | Dual-profile update. Expanded Season 1 deliverables with dual-profile design, deep research, community contact, GPG signing. Added key decisions 3-11. Expanded Season 6 scope to Intercom-level. Added Seasons 9-11 for GRP profile. Added Season 12+ for Triple Shield. |
| 2026-03-25 | Season 3 complete. 4 tasks, 4 PRs (#4-#7), 187 tests. |
| 2026-03-26 | Season 5 complete. Scope shifted from E2E hardening to real-server connectivity. 4 phases: Chat UI, Browser Client (3 tasks), Server Infrastructure (Docker + Nginx WSS proxy), Protocol Debugging (15 fixes). 485 tests, 15 PRs (#19-#33). First NEW -> IDS on real SMP v6 server. |
| 2026-03-28 | Season 6 complete. 4 PRs (#39, #42, #44, #45) plus ~10 direct pushes. 12 protocol fixes (2x A_CRYPTO, 8+ A_MESSAGE). Key discovery: joining party sends AgentInvitation ('I'), not AgentConfirmation ('C'). First browser-native SMP connection request accepted by SimpleX App. 493 tests. Security hardening roadmap created. |
| 2026-03-28 | Season 7 complete. Server upgrade to PR #1738 build. ALPN fix enables v6-18 over WebSocket. Nginx eliminated, Docker direct port mapping (8444->443). 4096-bit RSA Let's Encrypt cert. Three-layer root cause chain resolved (SKEY -> sndSecure -> ALPN). sndSecure confirmed as v9+ only. v7+ command auth identified as Season 8 prerequisite. Season numbers shifted: S8 = v7+ auth + bidirectional messaging, S9 = polish, S10 = security, S11 = library, S12-S15+ = GRP. Added document update rule to workflow section. |
| 2026-03-30 | Season 8 complete. 13 PRs (#52-#65). v9 CbAuthenticator implemented (nacl.box fix for HSalsa20). Server rebuilt on Debian 13 (Plesk removed). MSG processing with server-to-recipient decryption. Layer 1 NaCl decryption of AgentConfirmation (14,777B). 494 tests. Season numbers shifted: S9 = X3DH + Ratchet + CON, S10 = polish, S11 = security, S12 = library, S13+ = GRP. Added CLAUDE.md to document update list. |
