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
- Valid scopes: smp, grp, transport, crypto, ui, agent, config, ci, wiki
- NEVER commit directly to feat/simplego-support-chat - always feature/* branches
- Push with `git push --set-upstream origin feature/branch-name`
- NEVER change version numbers without explicit permission
- When creating PRs: ALWAYS verify base repository is saschadaemgen/GoChat, NOT simplex-chat/simplexmq

### Code Style
- NEVER use em dashes - use regular hyphens or rewrite the sentence
- All code, comments, commits, and documentation in English
- TypeScript strict mode
- @noble-only crypto (@noble/curves, @noble/ciphers, @noble/hashes)
- Do NOT import from xftp-web/src/protocol/commands.ts (pulls libsodium)
- Copy helpers locally instead (ascii(), readTag(), readSpace())

### Architecture
- ChatTransport interface for all transport code (SMP and future GRP)
- 16,384-byte fixed blocks for ALL SMP wire communication
- encodeBytes() for shortString (1-byte length prefix)
- encodeLarge() for large data (2-byte length prefix)
- CorrId-matched dispatch for typed command responses

## Build and Test

```bash
cd smp-web
npx vitest run        # Run all tests
npx vitest --watch    # Watch mode
```

## Technology Stack

| Component | Choice |
|---|---|
| Language | TypeScript (strict) |
| Runtime | Browser (no Node.js) |
| Transport | WebSocket (binary frames) |
| Crypto | @noble/curves v2 (Ed25519, X25519) |
| Encryption | NaCl secretbox via xftp-web (XSalsa20-Poly1305) |
| Testing | Vitest |
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
  __tests__/            # 187 tests across 8 files
```

## Current State

Season 3 is COMPLETE. The browser client has full SMP command support:
- 14 command encoders (NEW, SUB, KEY, SKEY, SEND, ACK, DEL, OFF, GET, NKEY, NDEL, NSUB, PING, QUE)
- Full response decoder (IDS, MSG, NID, NMSG, INFO, PONG, END, complete ERR tree)
- 12 typed client methods with CorrId-matched Promise dispatch
- Mock SMP server for integration testing
- 187 tests across 8 files, all passing

Season 4 (Connection Flow) is CURRENT.

## Development Roadmap

- Season 1: Planning and Documentation - COMPLETE
- Season 2: WebSocket Transport (ChatTransport, Handshake, Reconnection) - COMPLETE
- Season 3: SMP Commands (Encoders, Decoders, Typed Client, Integration Tests) - COMPLETE
- Season 4: Connection Flow (Contact Address, Queue Pairs, State Machine) - CURRENT
- Season 5: E2E Encryption (NaCl secretbox, Key Storage, Web Worker)
- Season 6: Chat UI (Intercom-level, Animations, Accessibility)
- Season 7: SimpleGo Website Integration
- Season 7.5: Admin Panel (Browser-based Support Dashboard)
- Season 8: Production Hardening
- Season 9+: GRP Profile (Noise, ML-KEM-768, Two-hop Routing)

## Season 4 Tasks

### Task 1: SimpleX Contact Address Parser
- Parse `simplex:/smp/...` and `https://simplex.chat/contact#...` URIs
- Extract server identity, host, port, queue ID, version range, DH key
- Branch: feature/contact-address-parser

### Task 2: Connection State Machine
- States: NEW, PENDING, CONFIRMED, CONNECTED, CLOSED, ERROR
- Event emitter for state changes
- Branch: feature/connection-state

### Task 3: Queue Pair Creation
- Create bidirectional channel from two unidirectional SMP queues
- Generate X25519 key pairs
- Branch: feature/queue-pair

### Task 4: Connection Request
- Encode and send connection request to contact queue
- Encrypt with shared secret from DH key exchange
- Handle confirmation response
- Branch: feature/connection-request

## Upstream Files (READ ONLY - never modify)

```
xftp-web/src/
  protocol/encoding.ts    # Binary encoding primitives
  protocol/transmission.ts # Block framing
  crypto/keys.ts          # X25519/Ed25519 operations
  crypto/secretbox.ts     # NaCl XSalsa20-Poly1305
  crypto/identity.ts      # Server identity verification

protocol/simplex-messaging.md  # SMP v9 specification
```

## Documentation

1. docs/seasons/SEASON-03-commands.md - Season 3 closing protocol
2. docs/seasons/SEASON-02-transport.md - Season 2 closing protocol
3. docs/PROTOCOL.md - Main technical protocol
4. docs/RESEARCH.md - Security and design research
5. docs/seasons/SEASON-PLAN.md - Full roadmap
