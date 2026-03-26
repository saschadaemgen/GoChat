# Season 4 Closing Protocol

**Date:** 2026-03-25
**Session:** Season 4 (single chat session, four tasks)
**Status:** COMPLETE
**Prepared by:** Prinzessin Mausi

---

## What Was Accomplished

### Season 4: Connection Flow - COMPLETE

Four tasks, four PRs merged. 226 new tests (413 total across project).

**Task 1 (PR #9): Contact Address Parser**
- `smp-web/src/address.ts` (466 lines) - Parses all SimpleX contact address formats
- `smp-web/src/__tests__/address.test.ts` - 46 tests
- Short links (v6.4+): `https://server/a#key` and `simplex:/a#key?h=host`
- Legacy full links: `simplex:/contact#/?v=...&smp=...` and `https://simplex.chat/contact#/...`
- Embedded SMP queue URI: `smp://identity@host:port/queue#/?v=...&dh=...`
- Discriminated union: `ParsedContactAddress` with `format: "short"` or `format: "full"`
- Error handling: `ContactAddressError` with 9 typed error codes

**Task 2 (PR #10): Connection State Machine**
- `smp-web/src/state.ts` (284 lines) - Standalone lifecycle state machine
- `smp-web/src/__tests__/state.test.ts` - 79 tests
- States: NEW -> QUEUE_CREATED -> PENDING -> CONFIRMED -> CONNECTED -> CLOSED (+ ERROR)
- Validated transitions via lookup table
- Event emitter for state change listeners
- Connection metadata (queue pair, remote info)
- Transition history tracking
- Zero internal dependencies (standalone module)

**Task 3 (PR #11): Queue Pair Creation**
- `smp-web/src/crypto-utils.ts` (75 lines) - Ed25519/X25519 key gen + SPKI encoding
- `smp-web/src/connection.ts` (292 lines) - ConnectionManager
- `smp-web/src/__tests__/connection.test.ts` - 42 tests
- Integrates Task 1 (parser) + Task 2 (state machine) + Season 3 (SMP client)
- Generates 3 key pairs (recipientAuth Ed25519, recipientDh X25519, e2eDh X25519)
- Creates receiving queue via SMPClient.createQueue()
- Key correction: Bob creates ONE queue, not two (Alice's contact queue already exists)

**Task 4 (PR #12): Connection Request (Full Monty)**
- `smp-web/src/x3dh.ts` (72 lines) - Modified 4-DH X3DH key agreement
- `smp-web/src/ratchet.ts` (154 lines) - Double Ratchet init + first encrypt
- `smp-web/src/agent-envelope.ts` (82 lines) - Agent confirmation encoding
- `smp-web/src/connection-request.ts` (366 lines) - Full pipeline + zstd
- `smp-web/src/crypto-utils.ts` extended with X448 support
- `smp-web/src/connection.ts` extended with sendConnectionRequest()
- Tests: 59 across 4 test files
- Six crypto layers fully implemented:
  - Layer 1: NaCl XSalsa20-Poly1305 (X25519 per-queue)
  - Layer 2: Agent Envelope (agentVersion=7, 'C', e2eEncryption_)
  - Layer 3: X448 SPKI keys (v3-v3, two 68-byte keys, no KEM)
  - Layer 4: X3DH (4x X448 DH + HKDF-SHA512 "SimpleXX3DH")
  - Layer 5: Double Ratchet (AES-256-GCM, HKDF-SHA256 "SimpleXMK"/"SimpleXCK")
  - Layer 6: connInfo (zstd level 3, ChatMessage v1-16, x.info event)

---

## Current Repository State

### Branch structure
```
feat/simplego-support-chat     <-- main working branch, all merges land here
  |
  +-- Season 2 branches (all MERGED)
  |   +-- feature/ws-transport         (PR #1)
  |   +-- feature/smp-handshake        (PR #2)
  |   +-- feature/ws-reconnect         (PR #3)
  |
  +-- Season 3 branches (all MERGED)
  |   +-- feature/smp-commands-encode   (PR #4)
  |   +-- feature/smp-response-decode   (PR #5)
  |   +-- feature/smp-client-commands   (PR #6)
  |   +-- feature/smp-integration-test  (PR #7)
  |
  +-- Season 4 branches (all MERGED)
      +-- feature/contact-address-parser   (PR #9)
      +-- feature/connection-state         (PR #10)
      +-- feature/queue-pair               (PR #11)
      +-- feature/connection-request       (PR #12)
```

### All files in smp-web/src/ (our code)
```
smp-web/src/
  index.ts                  # Re-exports all public API
  types.ts                  # ChatTransport, SMPServerAddress, TransportState, errors
  transport.ts              # SMPWebSocketTransport (WebSocket + 16KB blocks)
  handshake.ts              # SMP ServerHello/ClientHello encode/decode
  client.ts                 # SMPClient (handshake, session, typed commands, corrId dispatch)
  agent.ts                  # SMPClientAgent (pool, reconnect, network-aware)
  commands.ts               # SMP command encoders (14 commands)
  protocol.ts               # SMP transmission encode/decode, response decoder
  address.ts                # SimpleX contact address URI parser (all formats)    [S4-T1]
  state.ts                  # Connection lifecycle state machine                  [S4-T2]
  crypto-utils.ts           # Key gen (Ed25519, X25519, X448) + SPKI encoding     [S4-T3/T4]
  connection.ts             # ConnectionManager (queue creation + send request)    [S4-T3/T4]
  x3dh.ts                   # Modified 4-DH X3DH key agreement                   [S4-T4]
  ratchet.ts                # Double Ratchet init + first encrypt (AES-256-GCM)   [S4-T4]
  agent-envelope.ts         # Agent confirmation encoding                         [S4-T4]
  connection-request.ts     # Connection request builder + zstd                   [S4-T4]
  __tests__/
    transport.test.ts       # 17 transport tests
    handshake.test.ts       # Handshake encoding tests
    client.test.ts          # Client and dispatch tests
    agent.test.ts           # Agent pooling tests
    commands.test.ts        # Command encoder tests
    protocol.test.ts        # Response decoder tests (36 tests)
    client-commands.test.ts # Typed client method tests (60 tests)
    mock-smp-server.ts      # Mock SMP server for integration testing
    integration.test.ts     # End-to-end integration tests (12 tests)
    address.test.ts         # Contact address parser tests (46 tests)             [S4-T1]
    state.test.ts           # Connection state machine tests (79 tests)           [S4-T2]
    connection.test.ts      # ConnectionManager tests (42 tests)                  [S4-T3]
    x3dh.test.ts            # X3DH tests                                          [S4-T4]
    ratchet.test.ts         # Ratchet tests                                       [S4-T4]
    agent-envelope.test.ts  # Agent envelope tests                                [S4-T4]
    connection-request.test.ts # Connection request tests                         [S4-T4]
  vitest.config.ts          # Vitest with aliases for xftp-web + @noble/*
```

### Test count by season
```
Season 2 (Transport):    ~35 tests across 4 files
Season 3 (Commands):     ~152 tests across 4 files + mock server
Season 4 (Connection):   ~226 tests across 7 files
TOTAL:                   413 tests, 0 regressions
```

### Dependencies added in Season 4
```
@noble/curves      - X25519, X448, Ed25519 key generation and DH
@noble/hashes      - HKDF-SHA256, HKDF-SHA512, SHA-256, SHA-512
@noble/ciphers     - AES-256-GCM, XSalsa20-Poly1305
zstd-codec         - Zstd compression (level 3) for connInfo payload
```

---

## Critical Protocol Knowledge (from SimpleGo Team)

This information was provided by the SimpleGo team during Season 4 and is ESSENTIAL for future work.

### Agent Confirmation Format
```
[00 07]              agentVersion = 7 (Big-Endian)
[43]                 'C' = Confirmation
[31]                 Just(e2eEncryption_)
  [00 03] [00 03]    e2e version v3-v3
  [00 44] [68 bytes] X448 SPKI Key1 (ratchet pubkey, OID 1.3.101.111)
  [00 44] [68 bytes] X448 SPKI Key2 (ephemeral pubkey, OID 1.3.101.111)
  [00]               Nothing (no KEM / post-quantum)
[...]                encConnInfo (ratchet-encrypted, zstd-compressed JSON)
```

### X3DH: Symmetric 4-DH Scheme
```
DH1 = X448(Bob_Key1_Private, Alice_Key1_Public)
DH2 = X448(Bob_Key1_Private, Alice_Key2_Public)
DH3 = X448(Bob_Key2_Private, Alice_Key1_Public)
DH4 = X448(Bob_Key2_Private, Alice_Key2_Public)

HKDF-SHA512(ikm=DH1||DH2||DH3||DH4, salt=zeros(32), info="SimpleXX3DH", len=96)
-> Root Key (32) + Header Key (32) + Next Header Key (32)
```

### Double Ratchet
```
Message Key:  HKDF-SHA256(ikm=ChainKey, salt=zeros(32), info="SimpleXMK", len=32)
Next Chain:   HKDF-SHA256(ikm=ChainKey, salt=zeros(32), info="SimpleXCK", len=32)
Body cipher:  AES-256-GCM, IV = [msgNum(4 BE) + zeros(8)]
Header:       [X448_pubkey(56) + pn(4 BE) + ns(4 BE) + padding] = 2346 bytes
              AES-256-GCM encrypted -> 2362 bytes + 12 byte nonce = 2374 in envelope
```

### connInfo JSON
```json
{
  "v": "1-16",
  "event": "x.info",
  "params": {
    "profile": {
      "displayName": "...",
      "fullName": "",
      "preferences": { ... }
    }
  }
}
```
Zstd compression level 3 (default). Always compressed, even for first message.

### Key Hierarchy
```
X25519 -> Layer 1 (per-queue NaCl crypto_box) - SMP transport encryption
X448   -> Layer 2+ (Double Ratchet / X3DH) - E2E encryption
Ed25519 -> Command authorization (recipient auth key, sender auth key)
```

WARNING: Do NOT confuse X25519 (Layer 1) with X448 (Ratchet). This was one of SimpleGo's earliest bugs.

---

## Caveats and Open Items for Season 5+

### Must verify against real traffic
1. **X448 SPKI DER prefix** - our 12-byte prefix `3042300506032b656f033900` should be verified against actual SimpleX app X448 keys
2. **Chain Key initialization** - exact sequence from Root Key to first Chain Key may need adjustment
3. **Alice's X448 ratchet keys** - currently passed as parameters; need to extract from contact address e2e params or LGET response
4. **Short link LGET resolution** - deferred; needed for v6.4+ links

### SimpleGo team offered
- **Reference dump from Hasi** - complete byte-by-byte Confirmation from their logs, layer by layer. This would be the ultimate verification for our crypto stack.
- Ongoing protocol questions can be directed to the SimpleGo chat

### Library vision (Season 9)
- simplex-js npm package confirmed as project goal
- Package name and license TBD by the Prinz
- Target API: three lines to start an encrypted SimpleX chat

---

## Season Stats

| Metric | Value |
|:-------|:------|
| Tasks completed | 4 |
| PRs merged | 4 (#9, #10, #11, #12) |
| New tests | 226 |
| Total tests | 413 |
| Regressions | 0 |
| New source files | 8 |
| Modified source files | 3 |
| New test files | 7 |
| Total source lines (new) | ~1,900 |
| Crypto algorithms | X448, X25519, Ed25519, AES-256-GCM, XSalsa20-Poly1305, HKDF-SHA256, HKDF-SHA512, Zstd |
| New dependencies | @noble/ciphers, zstd-codec |

---

## Season Overview (updated)

| Season | Focus | Status | Tests |
|:-------|:------|:-------|:------|
| S1 | Planning and documentation | COMPLETE | - |
| S2 | WebSocket transport | COMPLETE | ~35 |
| S3 | SMP commands | COMPLETE | ~152 |
| S4 | Connection flow | COMPLETE | ~226 |
| S5 | E2E encryption hardening | NEXT | |
| S6 | Chat UI | Planned | |
| S7 | SimpleGo integration | Planned | |
| S7.5 | Admin Panel | Planned | |
| S8 | Production hardening | Planned | |
| S9 | simplex-js npm library | Planned | |
| S10+ | GRP profile | Future | |

**Total across all seasons: 413 tests, 12 PRs, 0 regressions.**

---

## What Was Learned in Season 4

1. **The SimpleGo team is the protocol oracle.** Their answers on X448, X3DH, and Ratchet details turned Task 4 from "months of reverse engineering" to "one task with clear specs."
2. **Bob creates ONE queue, not two.** The handover had this wrong. Always verify against the spec.
3. **SimpleX has two link format generations.** Short links (v6.4+) use server-stored encrypted data via LGET; legacy links embed everything in the URI.
4. **X25519 and X448 serve different layers.** Confusing them was one of SimpleGo's earliest bugs. X25519 = Layer 1 (NaCl), X448 = Ratchet.
5. **Six crypto layers is manageable when each is its own module.** x3dh.ts, ratchet.ts, agent-envelope.ts, connection-request.ts - each does one job.
6. **79 tests for a state machine is not overkill.** The Ritter delivered nearly double the briefing target and it caught edge cases.
7. **A support chat project became a library project.** The vision expanded from "widget for SimpleGo" to "first npm SimpleX package." The code supports both goals.
8. **Documentation-first continues to pay dividends.** Four complete briefings, four clean first-pass implementations.
9. **The @noble ecosystem covers everything.** X25519, X448, Ed25519, AES-GCM, HKDF, SHA-256/512 - all from one family of packages.
10. **One day, four seasons, twelve PRs.** Planning (S1) + Transport (S2) + Commands (S3) + Connection (S4) in a single day. The briefing system scales.

---

*Closing protocol prepared by Prinzessin Mausi, 2026-03-25*
*Ground rule: Nothing invented. What is missing gets asked. The Prinzessin shows everything needed.*
*Season 4 complete. 413 tests. Zero regressions. The browser speaks SimpleX.*
