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
- Valid scopes: smp, grp, transport, crypto, ui, agent, config, ci, wiki, seasons, security, handshake, commands
- Feature branches: `s8/NNN-description` pattern (season number + task number)
- Push with `git push --set-upstream origin s8/NNN-description`
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

Deploy after build:
```powershell
copy dist\gochat-client.js "C:\Projects\SimpleGo www\www\src\assets\js\gochat-client.js"
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
  x3dh.ts               # Modified 4-DH X3DH key agreement (for Season 8)
  ratchet.ts            # Double Ratchet init + encrypt (for Season 8)
  agent-envelope.ts     # Agent confirmation encoding (for Season 8)
  connection-request.ts # Connection request builder + zstd (for Season 9)
  browser-client.ts     # High-level browser API for chat integration
  msg-decrypt.ts        # Server-to-recipient MSG decryption (nacl.box.open)
  layer1-decrypt.ts     # Layer 1 NaCl smpEncConfirmation decryption
  __tests__/            # 494 tests across 19 files
```

## Current State

Season 8 is COMPLETE. v9 CbAuthenticator works, server rebuilt on Debian 13, MSG + Layer 1 decrypted.

### What works (Seasons 1-8)
- WebSocket transport with SMP handshake (v6-18 offered, v9 negotiated)
- 14 SMP command encoders with full response decoder
- Contact address parser (simplex:/ and https:// formats)
- Connection state machine (7 states)
- Queue creation on real SMP server (NEW -> IDS) with v9 CbAuthenticator
- AgentInvitation with connReq URI sent to contact queue (SEND -> OK)
- NaCl crypto_box encryption (tweetnacl nacl.box)
- SimpleX App/CLI shows "Website Visitor - New contact request"
- CLI accepts connection request (SKEY succeeds with sndSecure)
- Server rebuilt on Debian 13 (Nginx + Certbot + Docker, PR #1738 build v6.5.0.11)
- v9 CbAuthenticator (nacl.box over SHA-512 hash, 80-byte authenticator)
- sndSecure + SKEY (Fast Duplex sender queue securing)
- MSG processing with server-to-recipient decryption (nacl.box.open)
- Layer 1 NaCl decryption of smpEncConfirmation (AgentConfirmation extracted)
- ACK with CbAuthenticator
- queueDhKeyPair preserved for Layer 1 decryption
- 494 tests across 19 files

### What does NOT work yet
- AgentConfirmation parsing (e2e params, X448 keys, connInfo)
- X3DH key agreement with real peer X448 keys (only mock keys used so far)
- Double Ratchet initialization from X3DH output
- HELLO exchange (both directions)
- CON state (bidirectional encrypted messaging)
- Remove debug console.log statements

## Development Roadmap

- Season 1: Planning and Documentation - COMPLETE
- Season 2: WebSocket Transport - COMPLETE
- Season 3: SMP Commands (187 tests) - COMPLETE
- Season 4: Connection Flow + X3DH + Double Ratchet (413 tests) - COMPLETE
- Season 5: Chat UI + Browser Client + Real Server (485 tests) - COMPLETE
- Season 6: Connection Request to SimpleX App (493 tests) - COMPLETE
- Season 7: Server Upgrade, ALPN Fix, v6-18 over WebSocket - COMPLETE
- Season 8: v9 Command Auth, Server Rebuild, MSG + Layer 1 (494 tests) - COMPLETE
- Season 9: X3DH + Double Ratchet + HELLO + CON - NEXT
- Season 10: Production Polish (animations, SharedWorker, IndexedDB)
- Season 11: Security Hardening (CSP, SRI, Web Worker crypto)
- Season 12: simplex-js npm Library
- Season 13+: GRP Profile (Noise, ML-KEM-768, Two-hop Routing)

## Season 9 Context

### Starting point
Server offers v6-18 over WebSocket. Browser negotiates v9. CbAuthenticator works.
NEW/IDS/SEND/OK/MSG/ACK all work. CLI accepts invitation. AgentConfirmation received
and decrypted through Layer 1 NaCl. Next: parse AgentConfirmation, perform X3DH with
real X448 keys, initialize Double Ratchet, exchange HELLO messages, achieve CON state.

### Season 8 plan (in order)
1. Implement v7+ command authorization (X25519 DH crypto_box instead of Ed25519 signatures)
2. Increase maxSMPClientVersion to 9+ (unlocks sndSecure in server parser)
3. Enable sndSecure "S T" in NEW (97 bytes) + &k=s in connReq URI
4. CLI SKEY succeeds, AgentConfirmation arrives
5. SUB on own queue to receive AgentConfirmation
6. Decrypt AgentConfirmation (NaCl Layer 1 + Ratchet)
7. X3DH with CLI's X448 keys, initialize Double Ratchet
8. HELLO exchange, achieve CON state
9. Bidirectional encrypted messaging

### v6 vs v7+ command authorization
v6 (current - Ed25519 signatures):
```
[sigLen=0x40][64B Ed25519 signature][sessIdLen][sessionId][corrId][entityId][command]
signedData = [0x20][sessionId] + [corrId] + [entityId] + [command]
```

v7+ (target - X25519 DH crypto_box):
```
ClientHello adds: shortString(authPubKey) + Maybe(proxyServer) + Maybe(clientService)
Commands authorized via crypto_box instead of Ed25519 signatures
```

Reference code for v7+ auth: `C:\Projects\simplexmq-latest` (branch `pr-1738`)
- src/Simplex/Messaging/Transport.hs - handshake with authPubKey
- src/Simplex/Messaging/Protocol.hs - command authorization
- PR #982 on GitHub - "smp: command authorization" design document

### sndSecure wire format (for v9+ NEW command)
```
Without sndSecure (v6, current):  "NEW " [authKey] [dhKey] "S"      (95 bytes)
With sndSecure (v9+, target):     "NEW " [authKey] [dhKey] "S T"    (97 bytes)
                                                            ^ ^ ^
                                                            S SP T
```
Space between "S" and "T" is critical. "ST" without space gives CMD SYNTAX.
connReq URI must include &k=s when sndSecure is enabled.

### Key protocol knowledge (from Seasons 5-7)
- Joining party sends AgentInvitation ('I' + PHEmpty '_' + connReq URI)
- Contact owner responds with AgentConfirmation ('C' + PHConfirmation 'K' + Ratchet-encrypted body)
- First contact has NO Ratchet (only per-queue NaCl crypto_box)
- Ratchet begins after receiving owner's AgentConfirmation with X448 keys
- nacl.box() = DH + HSalsa20 + XSalsa20-Poly1305 (never use raw xsalsa20poly1305)
- SKEY comes BEFORE SEND in the CLI flow - if SKEY fails, CLI aborts immediately
- Browser ALPN is "h2" - PR #1738 server matches this and offers v6-18
- sessionId is 48 bytes on PR #1738 server (was 32 on legacy WebSocket port)
- ServerHello includes certs=2 and signedKey on PR #1738 server

### Corrected Ratchet parameters (for Season 8 implementation)
- All HKDF: SHA-512 (not SHA-256)
- X3DH: salt=64 zeros, info="SimpleXX3DH", 3 DH ops (not 4)
- Chain KDF: salt=empty, info="SimpleXChainRatchet"
- Root KDF: salt=root_key, info="SimpleXRootRatchet"
- IV order: msg_iv[64-79], header_iv[80-95]
- Ratchet v3: 124B emHeader, 2B Word16 BE prefix
- MsgHeader v3: content_len + version + 68B SPKI + KEM Nothing + PN + NS

### Server infrastructure (Season 8 - current, rebuilt on Debian 13)
- Docker image: local/smp-server-pr1738 (built from PR #1738 Haskell source)
- Software: SMP server v6.5.0.11
- Protocol range: v6-18 (both WebSocket and TLS)
- ALPN list: ["smp/1", "h2", "http/1.1"]
- Host: smp.simplego.dev (194.164.197.247)
- Port 5223: native TLS (CLI/App connections)
- Port 8444 -> Docker 443: HTTPS + WebSocket (browser connections, no Nginx)
- Port 5224: Control port
- Fingerprint: 7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow=
- TLS cert (HTTPS): 4096-bit RSA Let's Encrypt (expires 2026-06-26)
- Nginx: STOPPED (no longer needed since Season 7)
- Server source: /root/simplexmq-pr1738 (branch pr-1738)

Docker run command:
```bash
docker run -d --name simplego-smp --restart always \
  -p 5223:5223 -p 5224:5224 -p 8444:443 \
  -v /root/simplex/smp/config/certificates:/certificates:z \
  -v /root/simplex/smp/config:/etc/opt/simplex:z \
  -v /root/simplex/smp/logs:/var/opt/simplex:z \
  local/smp-server-pr1738
```

## Known Traps

1. GitHub defaults to `simplex-chat/simplexmq` as base repo when creating PRs from the fork - ALWAYS switch to `saschadaemgen/GoChat` / `feat/simplego-support-chat`
2. `esbuild.config.mjs` must use `format: "iife"` not `format: "esm"` - gets overwritten by every rebase
3. `send(text)` must be gated on CONNECTED state to prevent spurious duplicate sends
4. Debug logging must use `console.log` not `console.debug` (browser filters verbose logs)
5. NaCl crypto_box requires nacl.box() not raw xsalsa20poly1305 (HSalsa20 step missing otherwise)
6. X448 has zero browser Web Crypto support - must use @noble/curves with raw byte arrays
7. CSP `'self'` does NOT match `wss://` schemes - must explicitly include `connect-src wss://smp.simplego.dev:8444`
8. sndSecure format is "S T" (with space), NOT "ST" - space is critical, "ST" gives CMD SYNTAX
9. sndSecure requires v9+ negotiation - v6 command parser does not know sndSecure
10. v7+ auth is COMPLETELY DIFFERENT from v6 - not just replacing signatures, whole auth scheme changes
11. SKEY comes BEFORE SEND - CLI never sends AgentConfirmation if SKEY fails
12. sessionId is 48 bytes on PR #1738 server (not 32 like on legacy WebSocket port)
13. ServerHello includes certs=2 and signedKey on PR #1738 server (were absent on legacy WS port)
14. queueDhKeyPair private key must be saved on ManagedConnection for Layer 1 decryption (fixed in S8)
15. Contact address in base.njk may point to CLI test address - verify before testing
16. Nginx runs on port 8444 with TLS termination, proxies to SMP server on port 5225 (Debian 13 setup)
17. SMP Maybe encoding uses ASCII '0' (0x30) for Nothing, NOT binary 0x00 - causes CMD SYNTAX
18. CbAuthenticator uses nacl.box (DH + HSalsa20), NOT nacl.secretbox (raw key) - causes ERR AUTH
19. SystemTime in RcvMsgBody is 12 bytes (Int64 seconds + Word32 nanoseconds), NOT 8 bytes
20. smpEncConfirmation format is ASYMMETRIC: outgoing has version prefix, incoming does NOT
21. Four X25519 keypairs per connection - confusing any two causes decryption failure
22. nacl.box.keyPair() generates X25519 keys compatible with both nacl.box and nacl.scalarMult

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

1. docs/seasons/SEASON-08-v9-auth.md - Season 8 closing protocol
2. docs/seasons/SEASON-07-server-upgrade.md - Season 7 closing protocol
2. docs/seasons/SEASON-06-connection-request.md - Season 6 closing protocol
3. docs/seasons/SEASON-05-real-server.md - Season 5 closing protocol
4. docs/seasons/SEASON-PLAN.md - Full roadmap
5. docs/PROTOCOL.md - Main technical protocol
6. docs/RESEARCH.md - Security and design research
7. docs/SECURITY-HARDENING-ROADMAP.md - Six-phase browser security hardening plan
