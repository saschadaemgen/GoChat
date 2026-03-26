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

```
docs/
  PROTOCOL.md                    # Main technical protocol
  RESEARCH.md                    # Browser crypto, security, design research
  seasons/
    SEASON-PLAN.md               # This file
    SEASON-01-planning.md        # Planning and documentation
    SEASON-02-transport.md       # WebSocket transport
    SEASON-03-commands.md        # SMP commands
    SEASON-04-connection-flow.md # Connection flow + X3DH + Double Ratchet
    SEASON-05-real-server.md     # Chat UI + browser client + real server connectivity
    SEASON-06-messaging.md       # Bidirectional messaging (next)
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

## Season 6: Bidirectional messaging (NEXT)

**Status:** Next  
**Goal:** Complete the 7-step SimpleX connection flow so browser and SimpleX app can exchange real encrypted messages.

Season 5 completed Step 1 (NEW -> IDS). Season 6 completes Steps 2-7.

### The 7-step connection flow

```
1. Browser: NEW -> Queue created (IDS)           DONE (Season 5)
2. Browser: SEND Invitation to Contact Queue      Season 6
3. App: receives MSG, shows Connection Request    Season 6
4. App: accepts, sends CONF back                  Season 6
5. Browser: receives KEY                          Season 6
6. Both: HELLO exchange                           Season 6
7. Both: CON -> "CONNECTED"                       Season 6
```

### Scope

- Send connection request (SKEY + SEND with X3DH encrypted invitation) to contact queue
- Handle incoming confirmation from SimpleX app (MSG with CONF)
- Exchange HELLO messages (both directions)
- Achieve CON ("CONNECTED") state
- Bidirectional encrypted messaging via Double Ratchet (decrypt incoming, encrypt outgoing)
- E2E encryption receive side (ratchet decrypt, symmetric step, DH step)
- Out-of-order message handling (skipped message keys)

### Infrastructure tasks

- Nginx proxy systemd service (survive reboot)
- Commit esbuild.config.mjs as IIFE (prevent rebase overwrites)
- Remove debug console.log statements from production code
- Clean up Apache vhost_ssl.conf remnants

### Tasks for Claude Code

```
Task references: E2E-1, E2E-2, E2E-3, E2E-4, E2E-5 from PROTOCOL.md
Plus: SEND invitation, CONF handling, HELLO exchange, CON state
```

### Success criteria

- [ ] Connection request reaches SimpleX mobile/desktop app
- [ ] Support team can accept connection
- [ ] Browser receives confirmation and completes handshake
- [ ] Bidirectional message exchange works (browser to app, app to browser)
- [ ] Messages encrypted via Double Ratchet
- [ ] Nginx proxy survives server reboot
- [ ] No debug logging in production bundle

### This is the milestone

After this season, a website visitor can click "Start Encrypted Chat", connect to the support team's SimpleX app, and exchange real encrypted messages. Everything after this is UI polish and hardening.

---

## Season 7: Production polish and website integration

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

### Tasks for Claude Code

```
Task references: UI-3, UI-4, UI-5, UI-6, UI-7, UI-8, WS-4 from PROTOCOL.md
```

### Success criteria

- [ ] Intercom-quality animations (200-300ms ease-out, prefers-reduced-motion)
- [ ] Chat history persists across page navigation and reloads
- [ ] Works on mobile (full-screen, 44x44px touch targets)
- [ ] WCAG 2.1 AA compliance
- [ ] Encryption badge always visible with profile indicator
- [ ] SharedWorker maintains connection across tabs

---

## Season 8: Production hardening + security review

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

### Tasks for Claude Code

```
Task references: SEC-1, SEC-2, SEC-3, SEC-4, E2E-6 from PROTOCOL.md
```

### Success criteria

- [ ] Strict CSP enforced (no eval, no inline scripts)
- [ ] SRI hashes on all external scripts
- [ ] All crypto runs in dedicated Web Worker
- [ ] Security trust boundary documented transparently
- [ ] Key material encrypted at rest in IndexedDB
- [ ] Bundle size < 100KB gzipped
- [ ] No memory leaks in 8+ hour sessions
- [ ] Chat works reliably for 8+ hours

### SMP profile complete after this season

After Season 8, GoChat's SMP profile is production-ready. The GRP profile development begins in Season 9.

---

## Season 9: simplex-js npm library

**Status:** Planned  
**Goal:** Extract the SMP browser client into a standalone npm library that anyone can use.

### Scope

- API design document for public library
- Package scaffolding (build, bundle, tree-shake, types)
- Extract core modules from GoChat (transport, client, commands, crypto)
- SimpleXClient facade class for easy integration
- Zero-dependency audit (only @noble packages)
- Documentation and examples

### Tasks for Claude Code

```
Task references: LIB-1, LIB-2, LIB-3, LIB-4, LIB-5 from PROTOCOL.md
```

---

## Season 10: GRP - Noise transport

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

## Season 11: GRP - Post-quantum key exchange

**Status:** Future  
**Goal:** Add mandatory ML-KEM-768 hybrid key exchange to the GRP transport.

### Prerequisites

- GoRelay must have ML-KEM-768 hybrid exchange implemented (GoRelay Phase 4)

---

## Season 12: GRP - Two-hop relay routing

**Status:** Future  
**Goal:** Implement mandatory two-hop message routing for the GRP profile.

### Prerequisites

- GoRelay must have two-hop relay implemented (GoRelay Phase 5)
- Minimum two GoRelay servers deployed in different jurisdictions

---

## Season 13+: GRP - Triple Shield and beyond

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
| **S6** | **Bidirectional messaging** | **7-step connection flow, encrypted chat with SimpleX app** | **Next** |
| S7 | Production polish | Animations, SharedWorker, IndexedDB, accessibility | Planned |
| S8 | Security hardening | CSP, SRI, Web Worker crypto, security review | Planned |
| S9 | simplex-js library | Standalone npm package for SMP browser client | Planned |
| S10 | GRP: Noise transport | `grp/transport.ts`, Noise IK/XX | Future |
| S11 | GRP: Post-quantum | ML-KEM-768 hybrid key exchange | Future |
| S12 | GRP: Two-hop routing | PFWD/RFWD/RRES/PRES, cover traffic | Future |
| S13+ | GRP: Triple Shield | ZKP, Shamir, steganographic transport | Future |

**SMP critical path:** S1 -> S2 -> S3 -> S4 -> S5 -> S6 -> S7 -> S8
**SMP parallel track:** S7 (polish) can start alongside S6
**Library track:** S9 after S8
**GRP track:** S10 -> S11 -> S12 -> S13+ (begins after SMP profile is production-ready)
**GRP dependency:** GoRelay must complete its corresponding phases first

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Season plan created by Prinzessin Mausi. Defined 8 seasons covering planning through production. |
| 2026-03-25 | Season 2 complete. Marked S1 and S2 complete, S3 current. Updated Season 2 success criteria. |
| 2026-03-25 | Dual-profile update. Expanded Season 1 deliverables with dual-profile design, deep research, community contact, GPG signing. Added key decisions 3-11. Expanded Season 6 scope to Intercom-level. Added Seasons 9-11 for GRP profile. Added Season 12+ for Triple Shield. |
| 2026-03-25 | Season 3 complete. 4 tasks, 4 PRs (#4-#7), 187 tests. |
| 2026-03-26 | Season 5 complete. Scope shifted from E2E hardening to real-server connectivity. 4 phases: Chat UI, Browser Client (3 tasks), Server Infrastructure (Docker + Nginx WSS proxy), Protocol Debugging (15 fixes). 485 tests, 15 PRs (#19-#33). First NEW -> IDS on real SMP v6 server. Restructured future seasons: S6 = bidirectional messaging, S7 = production polish (was S6), S8 = security hardening (unchanged), S9 = simplex-js library (was S9), S10-S13 = GRP track (renumbered). Season 4 closing protocol reference added. |
