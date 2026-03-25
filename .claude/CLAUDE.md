# GoChat - Claude Code Instructions

## Project

GoChat is a browser-native encrypted messenger built on SimpleXMQ.
- Two communication profiles: SMP (everyday) and GRP (high-security)
- SMP Profile: SimpleX Messaging Protocol over WebSocket, compatible with all SimpleX clients
- GRP Profile: GoRelay Protocol over WebSocket, Noise transport, mandatory post-quantum (future)
- Built on the `ep/smp-web-spike` branch by Evgeny Poberezkin (SimpleX founder)
- Repository: github.com/saschadaemgen/GoChat
- License: AGPL-3.0
- Author: Sascha Daemgen, IT and More Systems, Recklinghausen
- Part of the SimpleGo ecosystem: SimpleGo (hardware) / GoRelay (relay server) / GoChat (browser)

## Rules (NON-NEGOTIABLE)

### Ground Rule
Nothing invented. What is missing gets asked. Do NOT fabricate information, assume
technical details, or fill gaps with speculation. If a detail is unknown, mark it as
unknown and raise the question.

### Git
- Conventional Commits ONLY: `feat(scope): description`, `fix(scope): description`
- Valid types: feat, fix, docs, test, refactor, ci, chore
- Valid scopes: transport, commands, connection, crypto, ui, security, config, ci
- GPG signing enabled (key E13737C02E97E54B, email sascha.daemgen@t-online.de)
- NEVER change version numbers without explicit permission
- Commits as granular as possible, as few as necessary
- Feature branch per task, push with `git push --set-upstream origin feature/branch-name`

### Code Style
- NEVER use em dashes (the long ones) - use regular hyphens or rewrite the sentence
- All code, comments, commits, and documentation in English
- TypeScript strict mode for ALL code
- Handle all errors explicitly - NEVER use `_` to discard errors
- Use `Uint8Array` for all binary data (not Buffer, not ArrayBuffer directly)

### Crypto Rules (CRITICAL)
- @noble libraries ONLY for all cryptographic operations
  - `@noble/curves` for Ed25519, X25519
  - `@noble/ciphers` for XSalsa20-Poly1305, ChaCha20-Poly1305, AES-256-GCM
  - `@noble/hashes` for SHA-256, SHA-512, HKDF, BLAKE2s
- NEVER use Web Crypto API directly for these primitives
- NEVER use libsodium.js, tweetnacl, or any other crypto library
- Avoid importing from xftp-web if it pulls libsodium dependency chain
- Define simple constants locally if imports are heavy (e.g. SMP_BLOCK_SIZE = 16384)

### Architecture Rules
- ALL transport code MUST implement the ChatTransport interface
- NEVER import SMP-specific code from GRP modules or vice versa
- NEVER modify files in xftp-web/ - this is upstream code, read-only
- NEVER modify files in protocol/ - this is upstream SMP specification
- smp-web/src/ is where ALL our code lives
- Use binary WebSocket frames (not text) - no Base64 overhead
- Fixed 16,384-byte blocks for ALL SMP wire communication, '#' (0x23) padding

## Build and Test

```bash
cd smp-web
npm install
npm run build
npm test
```

## Current State

Season 1 COMPLETE. Season 2 COMPLETE. Season 3 CURRENT.

### Season 2 output (transport layer - all working):
- `types.ts` - ChatTransport interface, SMPServerAddress, TransportState, errors, events
- `transport.ts` - SMPWebSocketTransport (WebSocket + 16KB block framing + onClose)
- `handshake.ts` - SMP ServerHello decode, ClientHello encode, v6/v7 negotiation
- `client.ts` - SMPClient (handshake + session + PING/PONG + async command dispatch)
- `agent.ts` - SMPClientAgent (connection pool + exponential backoff + network-aware)
- `protocol.ts` - SMP transmission encode/decode, LGET/LNK (from upstream spike)

### What Season 3 adds:
- `commands.ts` - ALL SMP command encoders/decoders (NEW, SUB, SEND, MSG, ACK, KEY, DEL, SKEY)
- `protocol.ts` - EXTENDED with IDS, MSG, PONG, full ERR subtype parsing
- `client.ts` - EXTENDED with typed command methods (createQueue, subscribe, send, etc.)

## Package Structure

```
smp-web/src/
  index.ts              # Re-exports all public API
  types.ts              # ChatTransport, SMPServerAddress, errors, events
  transport.ts          # SMPWebSocketTransport (16KB blocks, binary WS)
  handshake.ts          # SMP ServerHello/ClientHello
  client.ts             # SMPClient (handshake, dispatch, PING/PONG)
  agent.ts              # SMPClientAgent (pool, reconnect, network-aware)
  protocol.ts           # SMP transmission format, LGET/LNK, response dispatch
  commands.ts           # [Season 3 NEW] SMP command encoders/decoders
  __tests__/
    transport.test.ts   # 17 tests
    handshake.test.ts
    client.test.ts
    agent.test.ts

xftp-web/src/           # UPSTREAM - READ ONLY
  protocol/encoding.ts  # Decoder, encodeBytes, Word16/32/64
  protocol/commands.ts  # readTag, readSpace (imported by protocol.ts)
  crypto/keys.ts        # X25519 keygen, DH, Ed25519 sign/verify

protocol/
  simplex-messaging.md  # Official SMP v9 spec - THE REFERENCE FOR SEASON 3
```

## SMP Protocol Details

### SMP v7 implySessId (CRITICAL)
- SessionId NOT on wire, but IS in signature computation
- encodeTransmission in protocol.ts already handles this

### Command Reference
| Command | Direction | Season |
|---|---|---|
| LGET/LNK | Both | DONE (spike) |
| PING/PONG | Both | DONE (S2) |
| NEW/IDS | Both | S3 |
| SUB | Client->Server | S3 |
| KEY | Client->Server | S3 |
| SKEY | Client->Server | S3 |
| SEND | Client->Server | S3 |
| MSG | Server->Client | S3 |
| ACK | Client->Server | S3 |
| DEL | Client->Server | S3 |

### Key Encoding Details
- Ed25519/X25519 public keys: SPKI DER encoded (44 bytes), sent as shortString
- corrId: 24 random bytes, prefixed with 0x18 length byte
- Signatures: 64 bytes Ed25519, sent as shortString
- NEW includes: recipientAuthKey + recipientDhKey + subscribeMode('S'/'C') + sndSecure('T'/'F')
- SEND includes: msgFlags(notifyFlag + reserved) + SP + smpEncMessage
- MSG includes: msgId(24 bytes) + server-encrypted body (NaCl crypto_box with DH secret)

## Season 3 Implementation Plan (CURRENT)

### Task 1: commands.ts - Command Encoders/Decoders
- Encode: NEW, SUB, KEY, SKEY, SEND, ACK, DEL
- Decode: IDS, MSG, PONG, OK, ERR (with all subtypes)
- Study protocol/simplex-messaging.md for exact ABNF

### Task 2: Extend protocol.ts - Response Types
- Add IDS, MSG, END to SMPResponse union
- Parse full ERR subtypes (AUTH, QUOTA, CMD SYNTAX, etc.)
- Keep existing LGET/LNK/OK/ERR working

### Task 3: Extend client.ts - Typed Methods
- createQueue, subscribe, sendMessage, acknowledge, setKey, deleteQueue
- Each method: encode -> wrap in block -> send -> parse response

### Files to Study FIRST
1. `protocol/simplex-messaging.md` - SMP commands section (ABNF syntax)
2. `smp-web/src/protocol.ts` - existing transmission code
3. `smp-web/src/client.ts` - Season 2 client (sendCommand, dispatch)
4. `xftp-web/src/protocol/commands.ts` - XFTP command patterns
5. `xftp-web/src/crypto/keys.ts` - X25519/Ed25519 operations
6. `xftp-web/src/protocol/encoding.ts` - binary primitives

## What NOT To Do
- Do NOT modify xftp-web/ or protocol/
- Do NOT use any crypto other than @noble
- Do NOT implement connection flow (Season 4)
- Do NOT implement E2E encryption (Season 5)
- Do NOT build UI (Season 6)
- Do NOT change version numbers
- Do NOT use em dashes

## Development Roadmap
- Season 1: Planning - COMPLETE
- Season 2: WebSocket Transport (WS-1, WS-2, WS-3) - COMPLETE
- Season 3: SMP Commands (CMD-1 to CMD-5) - CURRENT
- Season 4: Connection Flow (CONN-1 to CONN-4)
- Season 5: E2E Encryption (E2E-1 to E2E-3, SEC-3)
- Season 6: Chat UI (UI-1 to UI-8, WS-4)
- Season 7: Website Integration
- Season 7.5: Admin Panel (ADM-1 to ADM-4)
- Season 8: Production Hardening
- Season 9+: GRP Profile

## Documentation
1. docs/PROTOCOL.md - Technical protocol with task registry
2. docs/RESEARCH.md - Browser crypto, security, design
3. docs/seasons/SEASON-PLAN.md - 12-season roadmap
4. docs/seasons/SEASON-02-transport.md - Season 2 closing protocol
5. protocol/simplex-messaging.md - Official SMP specification
