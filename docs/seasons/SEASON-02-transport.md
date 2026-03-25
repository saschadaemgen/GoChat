<p align="center">
  <img src="../../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<h1 align="center">GoChat - Season 2 Protocol</h1>

<p align="center">
  <strong>Season 2: WebSocket Transport Client</strong><br>
  Complete record of the transport layer implementation - tasks, commits, decisions, and lessons learned.
</p>

---

**Season:** 2
**Duration:** 2026-03-25 (same day as Season 1 - full day session)
**Status:** Complete
**Goal:** Browser can establish a WebSocket connection to an SMP server, complete the SMP handshake, send/receive raw 16KB blocks, and automatically reconnect on failure.

---

## 1. What happened

Season 2 was executed in three tasks on the same day as Season 1. Claude Code implemented all three tasks while Prinzessin Mausi and the planning chat prepared briefings and managed the PR workflow. Each task was developed on a separate feature branch, reviewed, and merged via Pull Request into `feat/simplego-support-chat`.

The transport layer stack was built bottom-up:

**Task 1 (WS-1) - Raw WebSocket pipe:** ChatTransport interface definition and SMPWebSocketTransport with strict 16KB block framing. Binary WebSocket frames only. Connect timeout with state machine tracking. 17 unit tests.

**Task 2 (WS-2) - SMP handshake and client:** SMP ServerHello/ClientHello exchange over WebSocket blocks. Certificate fingerprint verification. SMP v6/v7 version negotiation. Async command dispatch separating responses from server pushes. PING/PONG keepalive. @noble/curves v2 added for Ed25519 signature verification.

**Task 3 (WS-3) - Connection pooling and reconnection:** SMPClientAgent managing Map-based connection pool. Exponential backoff reconnection (500ms base, 2x multiplier, 30s cap, 50% jitter, 12 max attempts). Network-aware behavior (navigator.onLine, visibilitychange, online event). Transport onClose handler for disconnect detection.

---

## 2. Commits

### Task 1: feature/ws-transport (PR #1)

| Hash | Message | Description |
|:-----|:--------|:------------|
| (ws-t1) | `feat(transport): define ChatTransport interface and SMP transport types` | ChatTransport, SMPServerAddress, TransportState, SMPTransportError |
| (ws-t2) | `feat(transport): implement SMPWebSocketTransport with block framing` | WebSocket transport with 16KB validation, binary frames, connect timeout |
| (ws-t3) | `test(transport): add unit tests for WebSocket transport and types` | 17 unit tests, all passing |
| (ws-t4) | `feat(transport): export ChatTransport types and transport from index` | Re-exports from package index |

### Task 2: feature/smp-handshake (PR #2)

| Hash | Message | Description |
|:-----|:--------|:------------|
| (hs-t1) | `feat(transport): implement SMP handshake encoding and decoding` | ServerHello decode, ClientHello encode, SMP v6/v7 versions |
| (hs-t2) | `feat(transport): implement SMPClient with handshake and command dispatch` | Full handshake flow, async dispatch, PING/PONG keepalive |
| (hs-t3) | `feat(transport): add SMPClient types for handshake and dispatch` | SMPClientState, SMPResponseHandler, SMPPushHandler |
| (hs-t4) | `test(transport): add handshake and client unit tests` | Handshake encoding, version negotiation, dispatch routing |
| (hs-t5) | `feat(transport): export handshake and client from package index` | Re-exports |

### Task 3: feature/ws-reconnect (PR #3)

| Hash | Message | Description |
|:-----|:--------|:------------|
| (rc-t1) | `feat(transport): add connection event types for agent` | ConnectionEvent union, ConnectionChangeHandler |
| (rc-t2) | `feat(transport): add onClose handler to SMPWebSocketTransport` | Disconnect notification callback for agent |
| (rc-t3) | `feat(transport): implement SMPClientAgent with connection pooling and reconnection` | Map-based pool, exponential backoff, network-aware |
| (rc-t4) | `test(transport): add SMPClientAgent unit tests` | Pooling, backoff calculation, connection events |
| (rc-t5) | `feat(transport): export SMPClientAgent and connection events from index` | Re-exports |

### Merge commits

| Message | Description |
|:--------|:------------|
| `Merge pull request #1: Season 2 Task 1 - WebSocket transport` | feature/ws-transport -> feat/simplego-support-chat |
| `Merge pull request #2: Season 2 Task 2 - SMP handshake and client` | feature/smp-handshake -> feat/simplego-support-chat |
| `Merge pull request #3: Season 2 Task 3 - Connection pooling and reconnection` | feature/ws-reconnect -> feat/simplego-support-chat |

---

## 3. Files created

| File | Purpose | Task |
|:-----|:--------|:-----|
| `smp-web/src/types.ts` | ChatTransport interface, SMPServerAddress, TransportState, errors, events | T1, T2, T3 |
| `smp-web/src/transport.ts` | SMPWebSocketTransport - WebSocket + 16KB block framing + onClose | T1, T3 |
| `smp-web/src/handshake.ts` | SMP ServerHello decode, ClientHello encode, version constants | T2 |
| `smp-web/src/client.ts` | SMPClient - handshake, session, PING/PONG, command dispatch | T2 |
| `smp-web/src/agent.ts` | SMPClientAgent - connection pool, reconnection, network awareness | T3 |
| `smp-web/src/__tests__/transport.test.ts` | Transport unit tests (17 tests) | T1 |
| `smp-web/src/__tests__/handshake.test.ts` | Handshake encoding/decoding tests | T2 |
| `smp-web/src/__tests__/client.test.ts` | Client and dispatch tests | T2 |
| `smp-web/src/__tests__/agent.test.ts` | Agent pooling and reconnection tests | T3 |
| `smp-web/vitest.config.ts` | Vitest config with xftp-web alias | T1 |

### Files modified

| File | Change | Task |
|:-----|:-------|:-----|
| `smp-web/src/index.ts` | Added re-exports for all new types and classes | T1, T2, T3 |
| `smp-web/tsconfig.json` | Added `DOM` lib for WebSocket/MessageEvent types | T1 |
| `smp-web/package.json` | Added vitest, @noble/curves v2, test scripts | T1, T2 |

---

## 4. Key decisions made during implementation

| # | Decision | Rationale |
|:--|:---------|:----------|
| 1 | `SMP_BLOCK_SIZE = 16384` defined locally instead of importing from xftp-web | Importing `XFTP_BLOCK_SIZE` from xftp-web's `transmission.ts` pulls in `libsodium-wrappers-sumo` via the `keys.ts` import chain. A constant is not worth a heavy native dependency. |
| 2 | @noble/curves v2 added as direct dependency | Needed for Ed25519 signature verification in the SMP handshake. The xftp-web dependency chain does not cleanly expose this. |
| 3 | Feature branch workflow per task | Each task gets its own branch, PR with description, merge into main branch. Professional, reviewable, reversible. |
| 4 | Vitest for testing (not Jest) | Lighter, faster, native ESM support, better TypeScript integration. Configured with xftp-web path alias. |
| 5 | Binary WebSocket frames only | Text frames would add 33% Base64 overhead on encrypted payloads. Binary is mandatory for SMP's 16KB block format. |
| 6 | onClose handler added to transport in Task 3 | The agent needs disconnect notification to trigger reconnection. Added as a simple callback rather than changing the ChatTransport interface. |

---

## 5. Architecture established

After Season 2, the transport layer stack:

```
Layer 3: SMPClientAgent         (agent.ts)
  - Map<serverKey, ServerConnection> connection pool
  - Exponential backoff: 500ms * 2^attempt, 30s cap, 50% jitter
  - 12 max attempts (~2 min) before ConnectionEvent 'reconnect_failed'
  - navigator.onLine, visibilitychange, online event listeners
  |
Layer 2: SMPClient              (client.ts)
  - connectSMP() handshake flow: ServerHello -> verify -> negotiate -> ClientHello
  - Session ID extraction for transmission auth
  - Async dispatch: corrId match -> onResponse, else -> onServerPush
  - PING/PONG keepalive at configurable interval
  |
Layer 1: SMPWebSocketTransport  (transport.ts)
  - new WebSocket('wss://host:port'), binaryType = 'arraybuffer'
  - Strict 16,384-byte block validation (send and receive)
  - State machine: disconnected -> connecting -> connected -> closing
  - Connect timeout (default 15s)
  - onClose callback for agent disconnect detection
  |
  ChatTransport interface       (types.ts)
  - connect(server) / send(block) / onMessage(handler) / close()
  - SMPWebSocketTransport implements this (Season 2)
  - GRPWebSocketTransport will implement this (Season 9)
```

---

## 6. Tasks completed (from PROTOCOL.md)

| Task | Status | Notes |
|:-----|:-------|:------|
| WS-1 | DONE | SMPWebSocketTransport with ChatTransport interface, 16KB framing |
| WS-2 | DONE | SMPClient with SMP handshake, version negotiation, PING/PONG, dispatch |
| WS-3 | DONE | SMPClientAgent with pooling, exponential backoff, network awareness |
| SEC-5 | PARTIAL | TLS strategy documented (Let's Encrypt + SMP fingerprint at app layer), implementation deferred to deployment (Season 8) |

---

## 7. What went well

1. **Speed.** All three tasks completed in one session. Claude Code executed each briefing cleanly, producing working code with tests on the first pass.

2. **Briefing quality paid off.** The detailed task briefings with exact file names, interface definitions, implementation notes, and "What NOT to do" lists eliminated back-and-forth. Claude Code knew exactly what to build.

3. **Feature branch workflow worked smoothly.** Three PRs, each with descriptive title and body, merged cleanly. The commit history is readable and professional.

4. **The libsodium avoidance was smart.** Claude Code independently decided to define `SMP_BLOCK_SIZE` locally to avoid pulling in libsodium-wrappers-sumo. This saved a massive dependency and kept the package lightweight.

5. **ChatTransport abstraction proved its value immediately.** Even within Season 2, the layered architecture (transport -> client -> agent) showed clean separation. Each layer only depends on the one below it.

---

## 8. What went wrong

1. **Feature branches were initially confusing.** The first push created a branch on GitHub but without an upstream, leading to confusion about where commits were. Lesson: include `git push --set-upstream` in every briefing.

2. **GitHub defaults to upstream PRs.** When clicking "Compare & pull request", GitHub defaults to creating a PR against the original simplex-chat/simplexmq repo, not our fork. This happened twice. Lesson: always verify base repository is saschadaemgen/GoChat before creating a PR.

3. **Patch documents are useless.** An attempt to create a "patch document" instead of a complete file was confusing and unhelpful. Lesson: always create complete, ready-to-use files. Never create "apply these 6 patches" instructions.

4. **Documentation updates lag behind code.** PROTOCOL.md, SEASON-PLAN.md, and CLAUDE.md still reference Season 2 as "current" and don't reflect the completed tasks. These need updating as part of the closing protocol.

---

## 9. Lessons learned

1. **Task briefings are the product.** The quality of Claude Code's output directly correlates with the quality of the briefing. Specific interface definitions, exact file names, "files to study" lists, and explicit prohibitions produce clean first-pass implementations.

2. **Include push commands in briefings.** Every briefing should end with the exact git push command including `--set-upstream` for new branches. This prevents confusion.

3. **PRs within the fork need explicit base branch.** GitHub's default base is always the upstream repo for forks. The briefing should mention: "When creating PR, set base to feat/simplego-support-chat on saschadaemgen/GoChat."

4. **One session can cover multiple seasons.** Season 1 (planning) and Season 2 (transport) were both completed in a single day. The documentation-first approach from Season 1 made Season 2 execution fast because all decisions were already made.

5. **The @noble ecosystem works.** @noble/curves v2 integrated cleanly for Ed25519. The @noble-only crypto policy is validated. No dependency issues, no bundling problems.

---

## 10. Season 3 briefing

### Goal

Implement all SMP commands needed for basic messaging: queue creation (NEW/IDS), sending (SEND/SKEY), receiving (SUB/MSG/ACK), queue management (KEY/DEL), and link commands (LSND).

### Tasks

| ID | Description | Priority |
|:---|:------------|:---------|
| CMD-1 | Queue creation commands (NEW/IDS) | Highest |
| CMD-2 | Sender commands (SEND/SKEY) | Highest |
| CMD-3 | Recipient commands (SUB/ACK/KEY/DEL/MSG) | Highest |
| CMD-4 | Connection link commands (LSND, extend existing LGET/LNK) | High |
| CMD-5 | Utility commands (extended PING/PONG, error type parsing) | Medium |

### Key files Claude Code must study FIRST

These files contain the patterns and protocol details needed for Season 3:

1. **`smp-web/src/protocol.ts`** - existing SMP transmission code from the spike
   - encodeTransmission/decodeTransmission already handle the wire format
   - LGET/LNK already implemented as reference for new commands
   - The decodeResponse pattern shows how to dispatch by command tag

2. **`smp-web/src/client.ts`** - Season 2 output
   - SMPClient.sendCommand() for sending encoded blocks
   - onResponse/onServerPush dispatch for receiving
   - How to build a 16KB block from a command

3. **`protocol/simplex-messaging.md`** - the official SMP protocol specification
   - Section "SMP commands" for exact ABNF syntax of each command
   - Section "Create queue command" for NEW/IDS format
   - Section "Send message" for SEND format and message structure
   - Section "Deliver queue message" for MSG format
   - Section "Error responses" for all error types
   - Section "SMP Transmission and transport block structure" for framing

4. **`xftp-web/src/protocol/encoding.ts`** - binary encoding primitives
   - Decoder class, encodeBytes, decodeLarge, Word16/32/64
   - These are the building blocks for command encoding

5. **`xftp-web/src/protocol/commands.ts`** - XFTP command patterns
   - Shows how xftp-web structures command encoders/decoders
   - readTag/readSpace for response parsing (already imported in protocol.ts)

6. **`xftp-web/src/crypto/keys.ts`** - X25519 and Ed25519 operations
   - generateX25519KeyPair, encodePubKeyX25519, decodePubKeyX25519
   - sign/verify for Ed25519
   - Needed for NEW command (recipient auth key + DH key)

### Architecture for Season 3

```
smp-web/src/
  commands.ts     # [NEW] All SMP command encoders/decoders
  protocol.ts     # [EXTEND] Add new response types (IDS, MSG, PONG, ERR subtypes)
  client.ts       # [EXTEND] Add typed command methods on SMPClient
```

### Success criteria

- [ ] Can create a queue on SMP server (NEW -> IDS)
- [ ] Can subscribe to a queue (SUB -> OK or MSG)
- [ ] Can send a message to a queue (SEND -> OK)
- [ ] Can receive a message from a queue (MSG server push)
- [ ] Can acknowledge message receipt (ACK -> OK)
- [ ] Can set sender key (KEY -> OK)
- [ ] Can delete a queue (DEL -> OK)
- [ ] All error types parsed (AUTH, QUOTA, NO_MSG, CMD subtypes, INTERNAL)
- [ ] All commands have encode/decode unit tests
- [ ] Integration test: full message roundtrip (NEW -> KEY -> SUB -> SEND -> MSG -> ACK)

### Watch out for

- SMP v7 uses `implySessId = True` - sessionId NOT on wire but IS in signature computation
- Ed25519 signatures use SPKI encoding (44 bytes DER) not raw 32-byte keys
- NEW command includes subscribeMode ('S' for subscribe on create, 'C' for create only)
- MSG delivery is server-encrypted with DH secret from queue creation (NaCl crypto_box)
- Error responses must be parsed with nested subtypes (CMD SYNTAX, CMD PROHIBITED, etc.)
- The existing decodeResponse in protocol.ts needs extending, not replacing

---

*Season 2 protocol prepared by Prinzessin Mausi, 2026-03-25.*
*Ground rule: Nothing invented. What is missing gets asked. The Prinzessin shows everything needed.*
