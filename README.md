<p align="center">
  <img src=".github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<p align="center">
  <strong>End-to-end encrypted browser chat widget for the SimpleGo ecosystem.</strong><br>
  One script tag. No app install. No registration. No user IDs.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License"></a>
  <a href="#status"><img src="https://img.shields.io/badge/version-0.0.1--alpha-orange.svg" alt="Version"></a>
  <a href="https://github.com/saschadaemgen/SimpleGo"><img src="https://img.shields.io/badge/ecosystem-SimpleGo-green.svg" alt="SimpleGo"></a>
  <a href="docs/PROTOCOL.md"><img src="https://img.shields.io/badge/docs-protocol-blue.svg" alt="Protocol"></a>
</p>

---

## Overview

GoChat is a browser-native encrypted chat widget that implements the SimpleX Messaging Protocol (SMP) directly in JavaScript. Website owners embed GoChat with a single script tag. Visitors open the chat, and their browser establishes an end-to-end encrypted connection to the site owner's SimpleX app. No accounts, no phone numbers, no metadata.

GoChat is part of the [SimpleGo ecosystem](#simplego-ecosystem) and serves as the communication layer for [GoShop](https://github.com/saschadaemgen/GoShop), enabling encrypted product inquiries, order communication, and customer support.

---

## Quick Start

### Embed on any website

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="simplex://contact#/..."
        data-server-url="wss://smp.simplego.dev:8444"
        async></script>
```

One line of code. The widget handles everything: Shadow DOM isolation, E2E encryption, key exchange, and UI.

### Configuration

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="simplex://contact#/..."
        data-server-url="wss://smp.simplego.dev:8444"
        data-position="bottom-right"
        data-trigger="floating"
        data-name="Support"
        data-color="#45bdd1"
        async></script>
```

| Attribute | Default | Description |
|:----------|:--------|:------------|
| `data-contact-address` | required | SimpleX contact address from your app |
| `data-server-url` | required | WSS URL of your SMP server |
| `data-position` | `bottom-right` | Widget position (`bottom-right`, `bottom-left`) |
| `data-trigger` | `floating` | `floating` (bubble icon) or `custom` (use `GoChat.open()`) |
| `data-name` | `GoChat` | Header title |
| `data-color` | `#45bdd1` | Primary accent color |
| `data-lang` | `en` | Interface language |
| `data-z-index` | `10000` | CSS z-index |

### Custom trigger

For sites that use their own button or menu item instead of the floating bubble:

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="simplex://contact#/..."
        data-server-url="wss://smp.simplego.dev:8444"
        data-trigger="custom"
        async></script>

<button onclick="GoChat.open()">Contact us</button>
```

### Theming

Customize colors via CSS Custom Properties on your page:

```css
:root {
  --gochat-color-primary: #45bdd1;
  --gochat-color-background: #1a1a2e;
  --gochat-color-text: #e0e0e0;
}
```

---

## How it works

```
Website visitor (browser)          SMP Relay Server           Site owner
        |                               |                        |
        |--- WSS + SMP ---------------->|                        |
        |    E2E encrypted              |--- SMP relay --------->|  SimpleX App
        |                               |                        |
        |<-- WSS + SMP -----------------|<-- SMP relay ----------|
        |    E2E encrypted              |                        |
```

1. Visitor clicks the chat widget on the website
2. Browser generates ephemeral keys and performs X3DH key exchange
3. Double Ratchet session is established (AES-256-GCM, forward secrecy)
4. Messages are encrypted in the browser before transmission
5. The SMP relay server forwards opaque 16 KB blocks - it cannot read content
6. Site owner receives messages in their SimpleX app (desktop or mobile)

The relay server, hosting provider, and CDN never see message content.

---

## Use cases

- **E-commerce** - encrypted product inquiries, orders, and delivery addresses via GoShop
- **Customer support** - private support channel on any website
- **Professional services** - lawyers, agencies, consultancies offering clients a secure contact
- **Healthcare** - encrypted patient communication
- **Personal sites** - private contact without accounts or phone numbers

---

## Features

- End-to-end encryption (X3DH + Double Ratchet, AES-256-GCM)
- Shadow DOM isolation (widget cannot affect host page and vice versa)
- Floating bubble or custom trigger mode
- Multi-step UX flow (Start, Name, Waiting, Chat)
- Visitor name (custom or anonymous guest)
- Offline messaging
- Delivery receipts (double checkmarks)
- Connection lifecycle management (END detection, timeout, delete notification)
- Delete confirmation with destruction sequence
- Responsive design (desktop and mobile)
- Reduced motion support
- Mock mode for development and demos
- AGPL-3.0 licensed

---

## Security model

GoChat is a browser application. This section documents both its protections and its limitations.

### Protections

**End-to-end encryption.** Messages are encrypted in the visitor's browser and can only be decrypted by the site owner. The relay server sees only encrypted 16 KB blocks. It cannot read content, distinguish message types, or correlate conversations.

**No accounts or identifiers.** Visitors are not identified by phone numbers, email, or usernames. Each session uses ephemeral keys destroyed when the tab closes.

**Audited cryptography.** All crypto operations use @noble/curves (6 independent security audits, used by Proton Mail and MetaMask).

### Limitations

**Browser code delivery.** Unlike installed apps, GoChat's JavaScript is loaded from the web server on each visit. A compromised server could deliver modified code. This is the same trust model as online banking and all browser-based applications.

Mitigations include Subresource Integrity (SRI), Content Security Policy (CSP), minimal dependencies, and isolated crypto operations.

**Ephemeral sessions.** Keys are destroyed when the browser tab closes. Conversations do not persist across sessions. For persistent encrypted communication, use the SimpleX app directly.

### Trust comparison

| Platform | Trust requirement |
|:---------|:------------------|
| SimpleX App | App store, OS integrity |
| Signal Desktop | Auto-update mechanism, Electron, OS |
| Online Banking | Bank's web server, browser |
| **GoChat** | Website server, browser |

---

## Architecture

```
Browser Client
  Chat Widget (Shadow DOM)
  Crypto Engine (X3DH, Double Ratchet, NaCl)
  SMP Transport (WebSocket + TLS)
       |
  SMP Relay Server
  Queue Management, Zero-knowledge storage
       |
  SimpleX App (desktop/mobile)
  or SimpleGo hardware terminal
```

### Cryptographic stack

| Layer | Algorithm | Purpose |
|:------|:----------|:--------|
| Key exchange | X3DH (3x X448 DH + HKDF) | Initial shared secret |
| Message encryption | Double Ratchet (AES-256-GCM, 16B IV) | Forward secrecy |
| Transport auth | X25519 DH + HSalsa20 + XSalsa20-Poly1305 | SMP command authorization |
| PQ resistance | SNTRUP761 KEM (parsing support) | Post-quantum key encapsulation |

### Security hardening roadmap

Documented in [docs/SECURITY-HARDENING-ROADMAP.md](docs/SECURITY-HARDENING-ROADMAP.md):

1. CSP + SRI + Input Sanitization
2. Crypto Web Worker isolation
3. Non-extractable Web Crypto keys
4. Dependency vendoring
5. Cross-origin iframe isolation
6. Rust-to-WASM crypto core

---

## Server requirements

GoChat requires an SMP server with WebSocket support. Standard SimpleX public servers do not support WebSocket connections from browsers.

**Options:**

1. **Use SimpleGo's server** - `wss://smp.simplego.dev:8444` (recommended for most users)
2. **Self-host** - Build from the [smp-web branch](https://github.com/simplex-chat/simplexmq/tree/smp-web) of simplexmq (PR #1738 by Evgeny Poberezkin). Requires a 4096-bit RSA Let's Encrypt certificate.

WebSocket support is based on PR #1738, which adds WebSocket connections on the same TLS port via warp-tls. The patch is authored by the SimpleX founder and is maintained in the `smp-web` branch.

---

## Support agent setup

1. Download the [SimpleX Desktop App](https://simplex.chat/downloads/) (or mobile app)
2. Go to Settings > Your SimpleX Contact Address > Create new address
3. Copy the contact address
4. Add the GoChat script tag to your website with your contact address and server URL
5. When visitors start a chat, accept the connection request in your SimpleX app

Each visitor appears as a separate contact. Multiple concurrent conversations are supported.

---

## Development

```powershell
git clone https://github.com/saschadaemgen/GoChat.git
cd GoChat
git checkout feat/simplego-support-chat
cd smp-web
npm install
npx vitest run              # 551+ tests
npm run build:browser       # dist/gochat-client.js (crypto engine)
npm run build:widget        # dist/gochat-widget.js (complete widget)
```

### Repository structure

```
GoChat/
  .github/assets/              # Banner and images
  .claude/                     # Claude Code project configuration
  smp-web/                     # SMP browser client
    src/                       # Protocol + crypto source (25+ TypeScript files)
      __tests__/               # 551+ tests across 23 files
    widget/                    # Widget source (UI, CSS, HTML, bubble)
      reference/               # Original SimpleGo website files (read-only)
    dist/                      # Build output
    esbuild.config.mjs         # Crypto engine build config
    esbuild.widget.mjs         # Widget build config
  docs/
    PROTOCOL.md                # Technical protocol documentation
    RESEARCH.md                # Browser crypto and security research
    SECURITY-HARDENING-ROADMAP.md
    seasons/                   # Season plans and closing protocols
  LICENSE                      # AGPL-3.0
  README.md
```

---

## Status

### Done

| Component | Season | Tests |
|:----------|:-------|:------|
| WebSocket transport + SMP handshake | S2 | - |
| SMP command implementation (14 commands) | S3 | 187 |
| Connection flow + X3DH + Double Ratchet | S4 | 413 |
| Chat UI + browser client API + server connectivity | S5 | 485 |
| Connection request to SimpleX App | S6 | 493 |
| Server infrastructure (Docker, TLS, WebSocket) | S7 | - |
| SMP v9 authorization + MSG processing | S8 | 494 |
| Full E2E pipeline (X3DH, Ratchet, HELLO, CON) | S9 | 537 |
| Chat messaging + Desktop App + UX | S10 | 544 |
| Delivery receipts + connection lifecycle | S11 | 551 |

### In progress

| Component | Season | Description |
|:----------|:-------|:------------|
| GoChat Widget | S12 | Single-file embeddable widget with Shadow DOM |

### Planned

| Component | Season | Description |
|:----------|:-------|:------------|
| Security hardening | S13 | CSP, SRI, Web Worker, vendoring |
| simplex-js npm library | S14 | Standalone JavaScript SimpleX implementation |

### Season overview

| Season | Focus | Status |
|:-------|:------|:-------|
| S1-S11 | Protocol + E2E + Chat + Receipts + Lifecycle | Complete (551+ tests) |
| **S12** | **GoChat Widget Product** | **In progress** |
| S13 | Security Hardening | Planned |
| S14 | simplex-js npm Library | Planned |

---

## GoShop integration

GoChat is the communication layer for [GoShop](https://github.com/saschadaemgen/GoShop). In GoShop, all customer-shop communication flows through GoChat's encrypted channel: product inquiries, orders, delivery addresses, and status updates. The hosting provider, CDN, and relay server cannot read any of this data.

GoChat works standalone as a support chat widget on any website. GoShop adds structured e-commerce messaging on top of the same encrypted channel.

---

## SimpleGo ecosystem

| Project | Description | Repository |
|:--------|:------------|:-----------|
| [SimpleGo](https://github.com/saschadaemgen/SimpleGo) | Dedicated hardware messenger (ESP32-S3) | [GitHub](https://github.com/saschadaemgen/SimpleGo) |
| [GoChat](https://github.com/saschadaemgen/GoChat) | Browser-native encrypted chat widget (this project) | [GitHub](https://github.com/saschadaemgen/GoChat) |
| [GoShop](https://github.com/saschadaemgen/GoShop) | End-to-end encrypted e-commerce | [GitHub](https://github.com/saschadaemgen/GoShop) |
| GoRelay | Encrypted SMP relay server | Planned |

---

## Documentation

| Document | Description |
|:---------|:------------|
| [PROTOCOL.md](docs/PROTOCOL.md) | Technical protocol documentation |
| [RESEARCH.md](docs/RESEARCH.md) | Browser crypto and security research |
| [SECURITY-HARDENING-ROADMAP.md](docs/SECURITY-HARDENING-ROADMAP.md) | Six-phase security hardening plan |
| [SEASON-PLAN.md](docs/seasons/SEASON-PLAN.md) | Season plan and roadmap |

---

## License

AGPL-3.0. Derivative work of [SimpleXMQ](https://github.com/simplex-chat/simplexmq) by SimpleX Chat Ltd.

Commercial licensing available for integration into proprietary products. Contact: info@it-and-more.systems

## Acknowledgments

[SimpleX Chat](https://simplex.chat/) (SimpleX Messaging Protocol) - [@noble/curves](https://github.com/paulmillr/noble-curves) (Ed25519, X25519, X448) - [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) (XSalsa20-Poly1305, AES-256-GCM) - [tweetnacl](https://github.com/nicedayzhu/tweetnacl-js) (NaCl crypto_box)

---

<p align="center">
  <i>GoChat is part of the <a href="https://github.com/saschadaemgen/SimpleGo">SimpleGo ecosystem</a> by <a href="https://it-and-more.systems">IT and More Systems</a>, Recklinghausen, Germany.</i>
</p>
