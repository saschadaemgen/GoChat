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
**Base branch:** `ep/smp-web-spike`

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

At the end of each season, ALL project documents are updated: README.md, PROTOCOL.md, RESEARCH.md, SEASON-PLAN.md, and SECURITY-HARDENING-ROADMAP.md. This is a main priority and non-negotiable.

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
    SEASON-08-messaging.md       # v7+ auth + bidirectional messaging (next)
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

### Success criteria

- [x] Chat panel visible and functional on website
- [x] Browser connects to real SMP server via WebSocket
- [x] SMP handshake completes (ServerHello/ClientHello)
- [x] NEW command accepted by server (IDS response)
- [x] 485 tests passing, zero regressions
- [ ] ~~Bidirectional messaging with SimpleX app~~ (deferred to Season 6)

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

**Phase 1: SEND Command Implementation**
- [x] Wire up sendInvitation() after IDS response
- [x] SEND command with correct format (ASCII flags 'F', unsigned sigLen=0x00)
- [x] EntityId from contact address URI (not from own IDS response)
- [x] Server returns OK to SEND

**Phase 2: Encryption Fix (A_CRYPTO resolved)**
- [x] Discovered missing HSalsa20 step in NaCl encryption
- [x] Replaced raw xsalsa20poly1305 with nacl.box() (tweetnacl)
- [x] Discovered first contact uses plaintext encConnInfo (no Ratchet)
- [x] Removed unnecessary Double Ratchet encryption from first SEND path
- [x] Built and removed: full X3DH + HKDF-SHA512 + AES-256-GCM Ratchet (code preserved for Season 8)

**Phase 3: Message Type Fix (A_MESSAGE resolved)**
- [x] Discovered joining party sends AgentInvitation ('I'), not AgentConfirmation ('C')
- [x] Changed PrivHeader from PHConfirmation ('K' + Ed25519 SPKI) to PHEmpty ('_')
- [x] Built connReq URI builder (simplex:/invitation#/?v=2-7&smp=...&e2e=...)
- [x] Added x3dh= with two X448 SPKI keys (not dh= with one X25519)
- [x] Added q=m (QMMessaging), dh= (X25519 DH key), correct version ranges
- [x] Added explicit port 5223 in SMP queue URI

**Phase 4: Security Research**
- [x] Deep research: Web Crypto API, CSP/SRI, browser attack vectors, messenger comparison
- [x] Created SECURITY-HARDENING-ROADMAP.md with six-phase plan
- [x] Documented Signal, WhatsApp, Element, Wire browser crypto approaches

### Fix progression (12 fixes)

| # | Error | Root Cause | Fix |
|---|-------|------------|-----|
| 1 | SEND body empty | sendConnectionRequest() never called | Wire up sendInvitation() |
| 2 | Wrong sizes | Incorrect padding (16000 instead of 14832/15904) | Correct Haskell constants |
| 3 | A_CRYPTO | Raw xsalsa20poly1305 without HSalsa20 | Use nacl.box() |
| 4 | A_CRYPTO | Ratchet encryption for first contact | Remove Ratchet, use plaintext encConnInfo |
| 5 | A_MESSAGE | AgentConfirmation instead of AgentInvitation | Tag 'I' not 'C' |
| 6 | A_MESSAGE | PHConfirmation instead of PHEmpty | Tag '_' not 'K' |
| 7 | A_MESSAGE | Binary SMPQueueInfo instead of connReq URI | URI string |
| 8 | A_MESSAGE | Missing dh= in SMP queue URI | Add X25519 DH key |
| 9 | A_MESSAGE | Wrong e2e format (dh= with X25519) | x3dh= with two X448 keys |
| 10 | A_MESSAGE | Wrong version ranges | Agent v=2-7, e2e v=2-3 |
| 11 | A_MESSAGE | Missing q=m in SMP queue URI | Add QMMessaging marker |
| 12 | A_MESSAGE | Missing port in SMP queue URI | Add explicit port 5223 |

### Success criteria

- [x] Connection request reaches SimpleX mobile/desktop app
- [x] App displays "Website Visitor - New contact request"
- [x] NaCl encryption accepted by app (A_CRYPTO resolved)
- [x] Message format accepted by app (A_MESSAGE resolved)
- [x] 493 tests passing, 3 skipped (require CONNECTED state)
- [ ] ~~Support team can accept connection~~ (AUTH error, deferred to Season 7)
- [ ] ~~Bidirectional messaging~~ (deferred to Season 7)

### Key discoveries

1. **Joining party sends AgentInvitation, not AgentConfirmation** - completely different message structure
2. **First contact has no Ratchet** - no peer X448 keys available, only per-queue NaCl encryption
3. **nacl.box() includes HSalsa20** - raw XSalsa20-Poly1305 produces wrong ciphertext without it
4. **connReq URI contains reply queue info** - not a binary SMPQueueInfo structure
5. **x3dh= with two X448 keys** - not dh= with one X25519 key for e2e params
6. Full closing protocol: [SEASON-06-connection-request.md](SEASON-06-connection-request.md)

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

### Deliverables

**Phase 1: Root cause identification**
- [x] CLI debug logging (`simplex-chat -l debug --log-agent --log-tls-errors`)
- [x] Identified SKEY as immediate AUTH cause (CLI sends SKEY before SEND)
- [x] Identified ALPN as version-range root cause (SimpleGo team + Haskell source)
- [x] Confirmed sndSecure is v9+ only (3 attempts, all CMD SYNTAX on v6 parser)

**Phase 2: Server upgrade**
- [x] Upgraded Docker image to v6.5.0-beta.6 (still v6-v6 over WebSocket)
- [x] Found PR #1738 "smp: allow websocket connections on the same port"
- [x] Analyzed PR #1738 source code (Ritter on branch `pr-1738`)
- [x] Built SMP server from PR #1738 Haskell source (~20 min Docker build)

**Phase 3: Infrastructure overhaul**
- [x] Generated 4096-bit RSA Let's Encrypt certificate (PR #1738 requires it)
- [x] Eliminated Nginx (Docker maps port 443 directly to host 8444)
- [x] Configured smp-server.ini: websockets off, static_path enabled, web cert paths
- [x] Verified: browser gets ServerHello v6-18, negotiates v6, NEW/IDS/SEND/OK all work

**Phase 4: Version cap**
- [x] Capped maxSMPClientVersion to 6 (v7 auth not yet implemented)
- [x] Confirmed v7 negotiation causes AUTH (different auth scheme: X25519 DH vs Ed25519)

### PRs (all sndSecure attempts, all reverted)

| PR | Change | Result |
|----|--------|--------|
| #47 | "ST" (no space) | CMD SYNTAX |
| #48 | Revert #47 | OK |
| #49 | "S T" (with space) | CMD SYNTAX on v6 |
| #50 | maxVersion=6 + "S T" | CMD SYNTAX (v6 parser) |

### Infrastructure changes

| Before (S6) | After (S7) |
|:------------|:-----------|
| Docker `simplexchat/smp-server:v6.4.5` | Docker `local/smp-server-pr1738` (v6.5.0.11 + PR #1738) |
| Nginx HTTP proxy -> Port 5225 (separate WS) | Docker 443 -> Host 8444 (direct, no Nginx) |
| 2048-bit RSA (Nginx Let's Encrypt) | 4096-bit RSA (Let's Encrypt, mounted into Docker) |
| Server protocol v6-v6 (WebSocket) | Server protocol v6-v18 (WebSocket) |

### Success criteria

- [x] Root cause chain identified (SKEY -> sndSecure -> ALPN -> v6-v6)
- [x] Server rebuilt from PR #1738 source
- [x] v6-18 over WebSocket confirmed in browser console
- [x] Nginx eliminated
- [x] NEW/IDS/SEND/OK all working on new infrastructure
- [ ] ~~sndSecure enabled~~ (needs v9+ negotiation, deferred to Season 8)
- [ ] ~~SKEY accepted by server~~ (needs sndSecure, deferred to Season 8)

### Key discoveries

1. **SKEY comes before SEND** - CLI aborts immediately if SKEY fails, AgentConfirmation never sent
2. **ALPN determines protocol version range** - no "smp/1" = v6-v6, any ALPN = v6-v18
3. **sndSecure requires v9+ negotiation** - v6 command parser has no sndSecure code
4. **v7+ uses X25519 DH auth** - Ed25519 signatures replaced by crypto_box authorization
5. **PR #1738 extends server ALPN list** to `["smp/1", "h2", "http/1.1"]`
6. Full closing protocol: [SEASON-07-server-upgrade.md](SEASON-07-server-upgrade.md)

---

## Season 8: v7+ command auth, sndSecure, bidirectional messaging (NEXT)

**Status:** Next  
**Goal:** Implement v7+ command authorization (X25519 DH), negotiate v9+, enable sndSecure, and complete the 7-step connection flow for bidirectional encrypted messaging.

### Starting point

Server offers v6-18 over WebSocket. Browser negotiates v6 (maxSMPClientVersion capped). The CLI's SKEY fails because the queue has no sndSecure. To enable sndSecure, we must negotiate v9+. To negotiate v9+, we must implement v7+ command authorization first.

### The plan

```
Phase 1: v7+ command authorization (X25519 DH instead of Ed25519 signatures)
Phase 2: Negotiate v9+ (unlock sndSecure in server parser)
Phase 3: Enable sndSecure "S T" in NEW + &k=s in connReq URI
Phase 4: CLI SKEY succeeds, AgentConfirmation arrives
Phase 5: SUB on own queue, receive and decrypt AgentConfirmation
Phase 6: X3DH with peer X448 keys, initialize Double Ratchet
Phase 7: HELLO exchange, achieve CON state
Phase 8: Bidirectional encrypted messaging
```

### Key references

- PR #982 "smp: command authorization" - defines the v7+ auth scheme
- Evgeny's `ep/smp-web` branch - TypeScript implementation of v7+ auth
- `C:\Projects\simplexmq-latest` (branch `pr-1738`) - server source code
- Season 4 code (`x3dh.ts`, `ratchet.ts`) - X3DH and Double Ratchet building blocks

### Success criteria

- [ ] v7+ command authorization implemented (X25519 DH crypto_box)
- [ ] Server negotiates v9+ with browser
- [ ] sndSecure "S T" accepted in NEW command
- [ ] CLI SKEY succeeds (no more AUTH error)
- [ ] Browser receives AgentConfirmation via SUB
- [ ] X3DH key agreement with app's X448 keys
- [ ] Double Ratchet initialized both directions
- [ ] HELLO exchange completes
- [ ] CON state reached
- [ ] Browser sends message, app displays it
- [ ] App sends message, browser displays it

### This is the milestone

After this season, a website visitor can click "Start Encrypted Chat", connect to the support team's SimpleX app, and exchange real encrypted messages - end-to-end encrypted from the first message.

---

## Season 9: Production polish and website integration

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

### Success criteria

- [ ] Intercom-quality animations (200-300ms ease-out, prefers-reduced-motion)
- [ ] Chat history persists across page navigation and reloads
- [ ] Works on mobile (full-screen, 44x44px touch targets)
- [ ] WCAG 2.1 AA compliance
- [ ] Encryption badge always visible with profile indicator
- [ ] SharedWorker maintains connection across tabs

---

## Season 10: Production hardening + security review

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

After Season 10, GoChat's SMP profile is production-ready. The GRP profile development begins afterward.

---

## Season 11: simplex-js npm library

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

## Season 12: GRP - Noise transport

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

## Season 13: GRP - Post-quantum key exchange

**Status:** Future  
**Goal:** Add mandatory ML-KEM-768 hybrid key exchange to the GRP transport.

### Prerequisites

- GoRelay must have ML-KEM-768 hybrid exchange implemented (GoRelay Phase 4)

---

## Season 14: GRP - Two-hop relay routing

**Status:** Future  
**Goal:** Implement mandatory two-hop message routing for the GRP profile.

### Prerequisites

- GoRelay must have two-hop relay implemented (GoRelay Phase 5)
- Minimum two GoRelay servers deployed in different jurisdictions

---

## Season 15+: GRP - Triple Shield and beyond

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
| **S8** | **v7+ auth + messaging** | **v7+ command auth, sndSecure, Steps 4-7, Double Ratchet, real chat** | **Next** |
| S9 | Production polish | Animations, SharedWorker, IndexedDB, accessibility | Planned |
| S10 | Security hardening | CSP, SRI, Web Worker crypto, security review | Planned |
| S11 | simplex-js library | Standalone npm package for SMP browser client | Planned |
| S12 | GRP: Noise transport | `grp/transport.ts`, Noise IK/XX | Future |
| S13 | GRP: Post-quantum | ML-KEM-768 hybrid key exchange | Future |
| S14 | GRP: Two-hop routing | PFWD/RFWD/RRES/PRES, cover traffic | Future |
| S15+ | GRP: Triple Shield | ZKP, Shamir, steganographic transport | Future |

**SMP critical path:** S1 -> S2 -> S3 -> S4 -> S5 -> S6 -> S7 -> S8 -> S9 -> S10
**SMP parallel track:** S9 (polish) can start alongside S8
**Library track:** S11 after S10
**GRP track:** S12 -> S13 -> S14 -> S15+ (begins after SMP profile is production-ready)
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
