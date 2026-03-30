<p align="center">
  <img src=".github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<p align="center">
  <strong>End-to-end encrypted browser chat plugin for the SimpleGo ecosystem.</strong><br>
  No app install. No registration. No user IDs. Encrypted from the first message.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License"></a>
  <a href="#status"><img src="https://img.shields.io/badge/version-0.0.1--alpha-orange.svg" alt="Version"></a>
  <a href="https://github.com/saschadaemgen/SimpleGo"><img src="https://img.shields.io/badge/ecosystem-SimpleGo-green.svg" alt="SimpleGo"></a>
  <a href="docs/PROTOCOL.md"><img src="https://img.shields.io/badge/docs-protocol-blue.svg" alt="Protocol"></a>
</p>

---

GoChat is a browser-native encrypted chat plugin that brings the SimpleX Messaging Protocol directly into the browser. It allows website visitors to communicate with site owners through end-to-end encrypted channels without installing any application or creating any account.

GoChat is the communication layer of the [SimpleGo ecosystem](#simplego-ecosystem). Its primary purpose is to serve as the encrypted messaging plugin for [GoShop](https://github.com/saschadaemgen/GoShop) - enabling fully encrypted product inquiries, order communication, and customer support between shop and customer. Beyond e-commerce, GoChat works as a standalone encrypted support chat widget for any website.

---

## What GoChat does

GoChat embeds into any website as a chat widget. When a visitor opens the chat, their browser establishes an encrypted connection through an SMP relay server to the site owner. Every message is end-to-end encrypted using the Double Ratchet protocol (the same cryptographic design used by Signal). The relay server sees only opaque 16 KB encrypted blocks - it cannot read, modify, or correlate message content.

```
Website visitor (browser)          SMP Relay Server           Site owner
        |                               |                        |
        |--- WSS + SMP ---------------->|                        |
        |    E2E encrypted              |--- SMP relay --------->|  SimpleX App (phone/desktop)
        |                               |                        |  or SimpleGo terminal
        |<-- WSS + SMP -----------------|<-- SMP relay ----------|
        |    E2E encrypted              |                        |
```

The site owner receives messages in their SimpleX Chat app on phone or desktop - no special software beyond the standard SimpleX client. Alternatively, a [SimpleGo hardware terminal](https://github.com/saschadaemgen/SimpleGo) can serve as a dedicated encrypted countertop device for shops and offices.

### Use cases

- **GoShop e-commerce** - customers ask about products, place orders, share delivery addresses - all encrypted. The hosting provider, CDN, and relay server see nothing.
- **Customer support** - visitors chat with support teams directly from the website, encrypted from the first message
- **Professional services** - freelancers, agencies, lawyers, and consultancies offer clients a private communication channel
- **Healthcare** - patient communication through encrypted channels
- **Communities** - open-source projects, local groups, or hobby communities offer a private contact channel on their website
- **Personal websites** - a private chat widget on a family website or personal blog, reachable without accounts or phone numbers

### Multi-user support

Each website visitor connects via a permanent contact address and receives their own isolated queue pair. The site owner sees each visitor as a separate contact. Multiple concurrent conversations are handled natively by the relay server - no additional infrastructure needed.

---

## Security model - honest and transparent

GoChat is a browser application. This means it has both strengths and inherent limitations that we communicate openly.

### What GoChat protects

**End-to-end encryption between visitor and site owner.** Messages are encrypted in the visitor's browser before transmission and can only be decrypted by the site owner. The SMP relay server, the web hosting provider, CDN providers, and any network observer see only encrypted blobs of identical size (16 KB blocks). They cannot read message content, distinguish message types, or correlate conversations.

**No accounts, no user IDs, no tracking.** Visitors are not identified by phone numbers, email addresses, or usernames. Each conversation uses fresh ephemeral keys that are destroyed when the browser tab closes. There is no persistent identity to track across sessions.

**Strong cryptography from audited libraries.** GoChat uses @noble/curves (6 independent security audits, used by Proton Mail and MetaMask) for all cryptographic operations. The protocol stack includes X25519 key exchange, NaCl crypto_box authenticated encryption, and Double Ratchet with AES-256-GCM for forward secrecy.

### Where GoChat is appropriate

GoChat is designed for a specific trust model: **a site owner communicating with their own visitors.** In this model, the site owner hosts the GoChat code on their own server and has no incentive to tamper with it. The visitor trusts the website they are visiting - just as they trust it with their credit card number, their delivery address, or their login credentials.

This trust model covers the vast majority of real-world use cases: e-commerce, customer support, professional consultations, community engagement. In all these scenarios, both parties want to communicate and neither benefits from compromising the encryption.

### Where GoChat has limitations

**Browser code is delivered by the server.** Unlike a native app that is installed once and audited at a point in time, GoChat's JavaScript is loaded from the web server on every visit. A compromised server could theoretically deliver modified code. This is the fundamental trade-off of all browser-based applications - it applies equally to online banking, cloud email, and every web app that handles sensitive data.

We mitigate this with:
- Subresource Integrity (SRI) hashes that detect code tampering
- Content Security Policy (CSP) that blocks script injection
- Minimal dependencies to reduce supply chain attack surface
- All cryptographic operations isolated in a dedicated Web Worker

**Ephemeral keys only.** GoChat generates fresh keys per session. When the browser tab closes, all key material is destroyed. This provides strong forward secrecy but means conversations do not persist across sessions. For long-lived encrypted conversations, use the SimpleX Chat app directly.

**Not a replacement for dedicated encrypted messengers.** For ongoing private communication between two individuals who need persistent identity, verified contacts, and message history across devices, use SimpleX Chat, Signal, or another dedicated messenger app. GoChat fills a different niche: quick, anonymous, encrypted conversations between website visitors and site owners.

### The honest comparison

Every communication platform requires trust in something:

| Platform | You trust... |
|:---------|:-------------|
| SimpleX App | Google Play / App Store to deliver unmodified code, your OS to not be compromised |
| Signal Desktop | Auto-update mechanism, Electron runtime, your OS |
| WhatsApp Web | Meta's servers, your browser, QR code pairing |
| Online Banking | Your bank's web server, your browser, TLS certificates |
| **GoChat** | The website you are visiting, your browser |

GoChat's trust requirement is identical to online banking: you trust the server that delivers the code. For a shop owner's support chat, this is the same server that already handles your payment information.

---

## Architecture

```
+---------------------------------------------------------------+
|                      BROWSER CLIENT                           |
|    Chat UI  /  Message Store  /  Encrypted Key Storage        |
+---------------------------------------------------------------+
|                      WEB WORKER                               |
|    Crypto Operations (isolated from main thread XSS)          |
+---------------------------------------------------------------+
|                    TRANSPORT LAYER                             |
|    SMP over WebSocket (TLS)                                   |
|    @noble/curves, tweetnacl                                   |
+---------------------------------------------------------------+
|                    SMP RELAY SERVER                            |
|    Queue Management  /  WSS + TLS on port 443                 |
|    Zero-knowledge message storage                             |
+---------------------------------------------------------------+
|                    RECEIVING END                               |
|    SimpleX App (phone/desktop)                                |
|    or SimpleGo hardware terminal                              |
+---------------------------------------------------------------+
```

### Security hardening roadmap

GoChat implements security hardening in phases, documented transparently in [docs/SECURITY-HARDENING-ROADMAP.md](docs/SECURITY-HARDENING-ROADMAP.md):

1. **CSP + SRI + Input Sanitization** - blocks XSS and script tampering
2. **Crypto Web Worker** - isolates key material from the main thread
3. **Non-extractable Web Crypto keys** - prevents raw key export where browser APIs support it
4. **Dependency vendoring** - protects against npm supply chain attacks
5. **Cross-origin iframe** - protects GoChat when embedded on third-party sites
6. **Rust-to-WASM crypto core** - memory-safe, constant-time cryptography (the pattern Signal, Element, and Wire all converged on)

Full security analysis: [docs/RESEARCH.md](docs/RESEARCH.md)

---

## GoShop integration

GoChat is the communication plugin for [GoShop](https://github.com/saschadaemgen/GoShop) - an end-to-end encrypted e-commerce platform. In GoShop, every interaction between customer and shop owner flows through GoChat's encrypted channel:

```
Customer browses products     -> encrypted product catalog delivery
Customer asks a question      -> encrypted support message
Customer places an order      -> encrypted order with delivery address
Shop confirms the order       -> encrypted confirmation
Shop sends shipping update    -> encrypted status message
```

The web hosting provider, CDN, and relay server never see what the customer bought or where they live. Only the shop owner can read this information, on their own device.

GoChat can be used standalone (without GoShop) as a simple encrypted support chat widget on any website. The GoShop integration adds structured e-commerce messaging on top of the same encrypted channel.

---

## What exists vs. what we build

### Done

| Component | Season | Description |
|:----------|:-------|:------------|
| WebSocket transport client | S2 | SMP over WebSocket, ChatTransport interface |
| SMP commands | S3 | 14 command encoders, response decoder, mock server, 187 tests |
| Connection flow | S4 | Contact address parser, X3DH key agreement, Double Ratchet, 413 tests |
| Chat UI | S5 | Left-docked panel, responsive, animations, encryption badge |
| Browser client API | S5 | createBrowserClient(), esbuild IIFE bundle |
| Server infrastructure | S5+S7 | Docker SMP server v6.5.0.11 (PR #1738), WebSocket on same port |
| Real server connectivity | S5 | 15 protocol fixes for SMP v6 compatibility, 485 tests |
| Connection request to SimpleX App | S6 | AgentInvitation, connReq URI, NaCl crypto_box, 12 fixes, 493 tests |
| Server infrastructure overhaul | S7 | Debian 13 clean server, Nginx + Certbot, Docker rebuild |
| SMP v9 command authorization | S8 | CbAuthenticator (X25519 DH + HSalsa20 + XSalsa20-Poly1305), 494 tests |
| sndSecure + SKEY | S8 | Fast Duplex sender queue securing, CLI accepts connection |

### To do

| Component | Season | Description |
|:----------|:-------|:------------|
| MSG processing + ACK | S8 | Decrypt server-to-recipient messages, send acknowledgments |
| AgentConfirmation decryption | S8 | Layer 1 NaCl, X3DH with real keys, Double Ratchet |
| HELLO + CON | S8 | Complete bidirectional connection, real message exchange |
| Production polish | S9 | Animations, SharedWorker, IndexedDB persistence, accessibility |
| Security hardening | S10 | CSP, SRI, Web Worker isolation, security review |
| GoShop integration | S11 | Structured e-commerce messaging, product catalog, order flow |
| simplex-js library | S12 | Standalone npm package for SMP browser client |

Full task breakdown: [docs/PROTOCOL.md](docs/PROTOCOL.md)

---

## Season-based development

We develop in seasons - each with a clear goal, defined scope, and a protocol document recording successes, failures, and learnings. Code is written by Claude Code, directed and reviewed by Sascha, planned by Prinzessin Mausi.

| Season | Focus | Status |
|:-------|:------|:-------|
| **S1** | Planning, documentation, and research | Complete |
| **S2** | WebSocket transport client | Complete |
| **S3** | SMP commands (187 tests) | Complete |
| **S4** | Connection flow + X3DH + Double Ratchet (413 tests) | Complete |
| **S5** | Chat UI + browser client + real server (485 tests) | Complete |
| **S6** | Connection request to SimpleX App (493 tests) | Complete |
| **S7** | Server infrastructure overhaul (Docker, TLS, WebSocket) | Complete |
| **S8** | v9 command authorization + bidirectional messaging (494 tests) | Active |
| **S9** | Production polish (animations, persistence, accessibility) | Planned |
| **S10** | Security hardening + review | Planned |
| **S11** | GoShop integration | Planned |
| **S12** | simplex-js npm library | Planned |

**Critical path:** S1-S7 DONE - S8 (active) - S9 - S10 - S11

Full season plan: [docs/seasons/SEASON-PLAN.md](docs/seasons/SEASON-PLAN.md)

---

## Repository structure

```
GoChat/
+-- .github/assets/                 # Banner and images
+-- .claude/                        # Claude Code project instructions
+-- smp-web/                        # SMP browser client
|   +-- src/
|       +-- index.ts                # Re-exports all public API
|       +-- types.ts                # ChatTransport interface, SMP types
|       +-- transport.ts            # SMPWebSocketTransport (16KB block framing)
|       +-- handshake.ts            # SMP ServerHello/ClientHello encode/decode
|       +-- client.ts               # SMPClient (handshake, session, typed commands)
|       +-- agent.ts                # SMPClientAgent (connection pool, reconnection)
|       +-- commands.ts             # SMP command encoders (14 commands)
|       +-- protocol.ts             # SMP transmission encode/decode, response decoder
|       +-- address.ts              # SimpleX contact address URI parser
|       +-- state.ts                # Connection lifecycle state machine
|       +-- crypto-utils.ts         # Key gen: Ed25519, X25519, X448 + SPKI encoding
|       +-- connection.ts           # ConnectionManager (queue creation + send request)
|       +-- invitation.ts           # AgentInvitation builder (connReq URI, NaCl crypto_box)
|       +-- x3dh.ts                 # Modified 4-DH X3DH key agreement
|       +-- ratchet.ts              # Double Ratchet init + first encrypt (AES-256-GCM)
|       +-- agent-envelope.ts       # Agent confirmation encoding
|       +-- connection-request.ts   # Connection request builder + zstd
|       +-- browser-client.ts       # High-level browser API for chat integration
|       +-- msg-decrypt.ts          # Server-to-recipient MSG decryption (nacl.box.open)
|       +-- __tests__/              # 494 tests across 19 files
|   +-- esbuild.config.mjs         # Browser bundle config (IIFE format)
+-- xftp-web/                       # Shared infrastructure (upstream)
+-- docs/
|   +-- PROTOCOL.md                 # Main technical protocol document
|   +-- RESEARCH.md                 # Browser crypto, security, and design research
|   +-- SECURITY-HARDENING-ROADMAP.md # Six-phase browser security hardening plan
|   +-- seasons/                    # Season closing protocols
+-- LICENSE                         # AGPL-3.0
+-- README.md
```

---

## Getting started

```powershell
git clone https://github.com/saschadaemgen/GoChat.git
cd GoChat
git checkout feat/simplego-support-chat
cd smp-web
npx vitest run                    # Run all 493 tests
npm run build:browser             # Build browser bundle -> dist/gochat-client.js
```

---

## SimpleGo ecosystem

GoChat is one component of a larger ecosystem for encrypted communication across platforms.

| Project | What it does | Repository |
|:--------|:-------------|:-----------|
| **[SimpleGo](https://github.com/saschadaemgen/SimpleGo)** | Dedicated hardware messenger on ESP32-S3. Autonomous encrypted device with hardware key storage. | [SimpleGo](https://github.com/saschadaemgen/SimpleGo) |
| **[GoRelay](https://github.com/saschadaemgen/GoRelay)** | Encrypted relay server. SMP compatible, zero-knowledge message storage with cryptographic deletion. | GoRelay |
| **[GoChat](https://github.com/saschadaemgen/GoChat)** | Browser-native encrypted chat plugin. Support widget and GoShop communication layer. (This project) | [GoChat](https://github.com/saschadaemgen/GoChat) |
| **[GoShop](https://github.com/saschadaemgen/GoShop)** | End-to-end encrypted e-commerce. Product catalog, orders, and delivery addresses - all encrypted. | [GoShop](https://github.com/saschadaemgen/GoShop) |

---

## Status

Seasons 1 through 7 are complete. Season 8 (v9 authorization + bidirectional messaging) is active.

| Component | Status |
|:----------|:-------|
| WebSocket transport + SMP handshake | Done |
| SMP command implementation (14 commands) | Done |
| Contact address parser + connection flow | Done |
| X3DH key agreement + Double Ratchet | Done |
| Chat panel UI (left-docked, responsive) | Done |
| Browser client API + esbuild IIFE bundle | Done |
| SMP server deployment (Docker + WebSocket) | Done |
| Real server connectivity (15 protocol fixes) | Done |
| Connection request to SimpleX App (12 fixes) | Done |
| Security hardening roadmap | Done |
| Server infrastructure overhaul (Debian 13) | Done |
| SMP v9 CbAuthenticator command authorization | Done |
| sndSecure + SKEY (Fast Duplex) | Done |
| MSG processing + bidirectional messaging | Season 8 |
| Production polish | Season 9 |
| Security hardening | Season 10 |
| GoShop integration | Season 11 |

---

## Documentation

| Resource | Link |
|:---------|:-----|
| Technical protocol | [docs/PROTOCOL.md](docs/PROTOCOL.md) |
| Research findings | [docs/RESEARCH.md](docs/RESEARCH.md) |
| Security hardening roadmap | [docs/SECURITY-HARDENING-ROADMAP.md](docs/SECURITY-HARDENING-ROADMAP.md) |
| Season plan | [docs/seasons/SEASON-PLAN.md](docs/seasons/SEASON-PLAN.md) |
| GoShop | [github.com/saschadaemgen/GoShop](https://github.com/saschadaemgen/GoShop) |
| SimpleGo | [github.com/saschadaemgen/SimpleGo](https://github.com/saschadaemgen/SimpleGo) |

---

## License

AGPL-3.0. This project is a derivative work of [SimpleXMQ](https://github.com/simplex-chat/simplexmq) by SimpleX Chat Ltd, licensed under AGPL-3.0. Source code for all components is available in this repository.

## Acknowledgments

[SimpleX Chat](https://simplex.chat/) (SimpleX Messaging Protocol) - [@noble/curves](https://github.com/paulmillr/noble-curves) (Ed25519, X25519, X448) - [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) (XSalsa20-Poly1305, AES-256-GCM) - [tweetnacl](https://github.com/nicedayzhu/tweetnacl-js) (NaCl crypto_box) - [SimpleGo Protocol Analysis Team](https://github.com/saschadaemgen/SimpleGo) (49 sessions of SMP reverse-engineering)

---

<p align="center">
  <i>GoChat is part of the <a href="https://github.com/saschadaemgen/SimpleGo">SimpleGo ecosystem</a> by IT and More Systems, Recklinghausen, Germany.</i>
</p>

<p align="center">
  <strong>GoChat - encrypted messaging in the browser. No app, no account, no compromises.</strong>
</p>
