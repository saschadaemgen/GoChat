# GoChat - Claude Code Instructions

## Project

GoChat is a browser-native encrypted messenger for the SimpleX ecosystem.
- Speaks SMP (SimpleX Messaging Protocol) over WebSocket
- Future: GRP (GoRelay Protocol) with Noise transport, post-quantum crypto
- Built on the `ep/smp-web-spike` branch of simplexmq
- Repository: github.com/saschadaemgen/GoChat
- License: AGPL-3.0
- Author: Sascha Daemgen, IT and More Systems, Recklinghausen

## Rules (NON-NEGOTIABLE)

### Git
- Conventional Commits ONLY: `feat(scope): description`, `fix(scope): description`
- Valid types: feat, fix, docs, test, refactor, ci, chore
- Valid scopes: smp, grp, transport, crypto, ui, agent, config, ci, wiki, seasons, security
- Feature branches: `s7/NNN-description` pattern (season number + task number)
- Push with `git push --set-upstream origin s7/NNN-description`
- NEVER push directly to `feat/simplego-support-chat` - ALWAYS create PRs
- NEVER change version numbers without explicit permission
- When creating PRs: ALWAYS verify base repository is `saschadaemgen/GoChat`, NOT `simplex-chat/simplexmq`
- PR target branch: `feat/simplego-support-chat`

### GPG Signing Workflow
- Claude Code does NOT have access to the GPG signing key (E13737C02E97E54B)
- Direct pushes from Claude Code produce UNSIGNED commits (no green "Verified" badge)
- Sascha creates signed merge commits when merging PRs via GitHub
- Therefore: ALL code changes MUST go through Pull Requests
- This ensures every commit on `feat/simplego-support-chat` is GPG-verified
- Never push directly to the target branch - always feature branch + PR
- Use squash merge when appropriate to keep history clean

### Code Style
- NEVER use em dashes - use regular hyphens or rewrite the sentence
- All code, comments, commits, and documentation in English
- TypeScript strict mode
- @noble-only crypto (@noble/curves, @noble/ciphers, @noble/hashes)
- tweetnacl for NaCl crypto_box (nacl.box includes HSalsa20 key derivation)
- Do NOT import from xftp-web/src/protocol/commands.ts (pulls libsodium)
- Copy helpers locally instead (ascii(), readTag(), readSpace())
- console.log for debug output (not console.debug - browsers filter verbose by default)

### Architecture
- ChatTransport interface for all transport code (SMP and future GRP)
- 16,384-byte fixed blocks for ALL SMP wire communication
- encodeBytes() for shortString (1-byte length prefix)
- encodeLarge() for large data (2-byte length prefix)
- CorrId-matched dispatch for typed command responses
- esbuild.config.mjs MUST use `format: "iife"` (not "esm") - gets overwritten by rebases

## Build and Test

```bash
cd smp-web
npx vitest run        # Run all tests
npx vitest --watch    # Watch mode
npm run build:browser # Build IIFE bundle -> dist/gochat-client.js
```

## Technology Stack

| Component | Choice |
|---|---|
| Language | TypeScript (strict) |
| Runtime | Browser (no Node.js) |
| Transport | WebSocket (binary frames) |
| Crypto (signing) | @noble/curves v2 (Ed25519) |
| Crypto (DH) | @noble/curves v2 (X25519, X448) |
| Crypto (NaCl) | tweetnacl (nacl.box for crypto_box) |
| Crypto (Ratchet) | @noble/ciphers (AES-256-GCM), @noble/hashes (HKDF-SHA512) |
| Compression | zstd-codec (level 3 for connInfo) |
| Testing | Vitest |
| Bundle | esbuild (IIFE format) |
| Block size | 16,384 bytes (SMP standard) |

## Package Structure

```
smp-web/src/
  index.ts              # Re-exports all public API
  types.ts              # ChatTransport, SMPServerAddress, TransportState, errors
  transport.ts          # SMPWebSocketTransport (WebSocket + 16KB blocks)
  handshake.ts          # SMP ServerHello/ClientHello encode/decode
  client.ts             # SMPClient (handshake, session, typed commands, corrId dispatch)
  agent.ts              # SMPClientAgent (connection pool, reconnection)
  commands.ts           # SMP command encoders (14 commands)
  protocol.ts           # SMP transmission encode/decode, response decoder
  address.ts            # SimpleX contact address URI parser
  state.ts              # Connection lifecycle state machine
  crypto-utils.ts       # Key gen: Ed25519, X25519, X448 + SPKI encoding
  connection.ts         # ConnectionManager (queue creation + send invitation)
  invitation.ts         # AgentInvitation builder (connReq URI, NaCl crypto_box)
  x3dh.ts               # Modified 4-DH X3DH key agreement (for Season 7)
  ratchet.ts            # Double Ratchet init + encrypt (for Season 7)
  agent-envelope.ts     # Agent confirmation encoding (for Season 7)
  connection-request.ts # Connection request builder + zstd (for Season 7)
  browser-client.ts     # High-level browser API for chat integration
  __tests__/            # 493 tests across 19 files
```

## Current State

Season 6 is COMPLETE. The browser client sends a working connection request to the SimpleX App.

### What works (Seasons 1-6)
- WebSocket transport with SMP v6 handshake
- 14 SMP command encoders with full response decoder
- Contact address parser (simplex:/ and https:// formats)
- Connection state machine (7 states)
- Queue creation on real SMP server (NEW -> IDS)
- AgentInvitation with connReq URI sent to contact queue
- NaCl crypto_box encryption (tweetnacl nacl.box)
- SimpleX App shows "Website Visitor - New contact request"
- 493 tests across 19 files

### What does NOT work yet
- App returns AUTH when accepting the connection request (Season 7 first task)
- No incoming message reception (SUB + MSG handling)
- No Double Ratchet for bidirectional encryption
- No HELLO exchange or CON state

## Development Roadmap

- Season 1: Planning and Documentation - COMPLETE
- Season 2: WebSocket Transport - COMPLETE
- Season 3: SMP Commands (187 tests) - COMPLETE
- Season 4: Connection Flow + X3DH + Double Ratchet (413 tests) - COMPLETE
- Season 5: Chat UI + Browser Client + Real Server (485 tests) - COMPLETE
- Season 6: Connection Request to SimpleX App (493 tests) - COMPLETE
- Season 7: Bidirectional Messaging (Steps 4-7, Double Ratchet) - NEXT
- Season 8: Production Polish (animations, SharedWorker, IndexedDB)
- Season 9: Security Hardening (CSP, SRI, Web Worker crypto)
- Season 10: simplex-js npm Library
- Season 11+: GRP Profile (Noise, ML-KEM-768, Two-hop Routing)

## Season 7 Context

### Starting point
SimpleX App shows "Website Visitor - New contact request." When user accepts, app gets
Connection error (AUTH) trying to send to our reply queue. Fix this first.

### Key protocol knowledge (from Season 6)
- Joining party sends AgentInvitation ('I' + PHEmpty '_' + connReq URI)
- Contact owner responds with AgentConfirmation ('C' + PHConfirmation 'K' + Ratchet-encrypted body)
- First contact has NO Ratchet (only per-queue NaCl crypto_box)
- Ratchet begins after receiving owner's AgentConfirmation with X448 keys
- nacl.box() = DH + HSalsa20 + XSalsa20-Poly1305 (never use raw xsalsa20poly1305)

### Corrected Ratchet parameters (for Season 7 implementation)
- All HKDF: SHA-512 (not SHA-256)
- X3DH: salt=64 zeros, info="SimpleXX3DH", 3 DH ops (not 4)
- Chain KDF: salt=empty, info="SimpleXChainRatchet"
- Root KDF: salt=root_key, info="SimpleXRootRatchet"
- IV order: msg_iv[64-79], header_iv[80-95]
- Ratchet v3: 124B emHeader, 2B Word16 BE prefix
- MsgHeader v3: content_len + version + 68B SPKI + KEM Nothing + PN + NS

### Server infrastructure
- SMP server: smp.simplego.dev, port 5223 (native), port 8444 (WSS via Nginx)
- Contact address queue ID: QEuTquKK63Txg0UAuWvhd4Q37Hsf6eGW
- Nginx WSS proxy needs systemd service (does not survive reboot)

## Known Traps

1. GitHub defaults to `simplex-chat/simplexmq` as base repo when creating PRs from the fork - ALWAYS switch to `saschadaemgen/GoChat` / `feat/simplego-support-chat`
2. `esbuild.config.mjs` must use `format: "iife"` not `format: "esm"` - gets overwritten by every rebase
3. `send(text)` must be gated on CONNECTED state to prevent spurious duplicate sends
4. Debug logging must use `console.log` not `console.debug` (browser filters verbose logs)
5. NaCl crypto_box requires nacl.box() not raw xsalsa20poly1305 (HSalsa20 step missing otherwise)
6. X448 has zero browser Web Crypto support - must use @noble/curves with raw byte arrays
7. CSP `'self'` does NOT match `wss://` schemes - must explicitly include `connect-src wss://smp.simplego.dev:8444`

## Upstream Files (READ ONLY - never modify)

```
xftp-web/src/
  protocol/encoding.ts    # Binary encoding primitives
  protocol/transmission.ts # Block framing
  crypto/keys.ts          # X25519/Ed25519 operations
  crypto/secretbox.ts     # NaCl XSalsa20-Poly1305
  crypto/identity.ts      # Server identity verification

protocol/simplex-messaging.md  # SMP specification (upstream reference)
```

## Documentation

1. docs/seasons/SEASON-06-connection-request.md - Season 6 closing protocol
2. docs/seasons/SEASON-05-real-server.md - Season 5 closing protocol
3. docs/seasons/SEASON-PLAN.md - Full roadmap
4. docs/PROTOCOL.md - Main technical protocol
5. docs/RESEARCH.md - Security and design research
6. docs/SECURITY-HARDENING-ROADMAP.md - Six-phase browser security hardening plan
