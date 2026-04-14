<p align="center">
  <img src=".github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<p align="center">
  <strong>End-to-end encrypted browser chat widget for the SimpleGo ecosystem.</strong><br>
  One script tag. No app install. No registration. No user IDs.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License"></a>
  <a href="https://www.npmjs.com/package/gochat-widget"><img src="https://img.shields.io/npm/v/gochat-widget.svg" alt="npm"></a>
  <a href="https://www.npmjs.com/package/simplex-js"><img src="https://img.shields.io/npm/v/simplex-js.svg" alt="simplex-js"></a>
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
        data-server-url="wss://smp.simplego.dev"
        async></script>
```

One line of code. The widget handles everything: Shadow DOM isolation, E2E encryption, key exchange, and UI.

### Install via npm

```bash
npm install gochat-widget
```

### Protocol library (for developers building custom apps)

```bash
npm install simplex-js
```

### Configuration

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="simplex://contact#/..."
        data-server-url="wss://smp.simplego.dev"
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
| `data-bubble-animation` | `shimmer-flip` | Bubble animation (15 options, see below) |
| `data-welcome` | - | Welcome message after connection |
| `data-lang` | `en` | Interface language |
| `data-z-index` | `10000` | CSS z-index |

### Bubble animations

`shimmer-flip` (default), `inner-glow`, `icon-breathe`, `shimmer`, `wiggle`, `color-shift`, `icon-flip`, `notification-dot`, `radar-sweep`, `pulse`, `neon`, `heartbeat`, `jelly`, `ring-rotate`, `float`, `none`

### Custom trigger

For sites that use their own button or menu item instead of the floating bubble:

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="simplex://contact#/..."
        data-server-url="wss://smp.simplego.dev"
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

GoChat runs in the browser and connects to SMP relay servers via WebSocket (WSS). This requires SMP servers that support WebSocket connections. Standard SimpleX public servers (like `smp8.simplex.im`, `smp10.simplex.im`, etc.) do **not** support WebSocket - they only accept native TLS connections from the SimpleX app.

**This means:** GoChat can only connect to SMP servers that have WebSocket support enabled. If your SimpleX contact address points to a server without WebSocket support, GoChat cannot establish a connection.

**Options:**

1. **Use SimpleGo's public server** - `smp.simplego.dev` (recommended, free, WebSocket-enabled)
2. **Self-host** - Build from the [smp-web branch](https://github.com/simplex-chat/simplexmq/tree/smp-web) of simplexmq (PR #1738 by Evgeny Poberezkin). Requires a 4096-bit RSA Let's Encrypt certificate.

WebSocket support is based on [PR #1738](https://github.com/simplex-chat/simplexmq/pull/1738), authored by the SimpleX founder. The patch adds WebSocket connections on the same TLS port via warp-tls. It is maintained in the `smp-web` branch and has not yet been merged into the main SimpleX release. Once merged, all public SimpleX servers will support WebSocket and GoChat will work with any contact address.

### Why this matters

Every SimpleX contact address contains the SMP server where that user's message queue lives. When a visitor opens GoChat and initiates a connection, GoChat must connect to **that specific server** - not just any server. If the contact address points to `smp8.simplex.im` (no WebSocket), GoChat cannot reach it. The contact address must point to a WebSocket-enabled server like `smp.simplego.dev`.

---

## Setting up your contact address for GoChat

To use GoChat on your website, you need a SimpleX contact address that points to a WebSocket-enabled SMP server. Follow these steps in the SimpleX app (desktop or mobile):

### Step 1: Add the SimpleGo SMP server

1. Open the SimpleX app
2. Go to **Settings** > **Network & Servers**
3. Tap **Your servers**
4. Tap **Add server**
5. Enter the server address:
   ```
   smp://7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow=@smp.simplego.dev
   ```
6. Tap **Test server** - wait for the green checkmark
7. Enable **Use for new connections**
8. Go back to **Network & Servers**
9. Tap **Save Servers**

### Step 2: Create your contact address

If you already have a SimpleX contact address, you need to delete it first and create a new one. The old address points to a server without WebSocket support.

1. Go to **Settings** > **Your SimpleX Contact Address**
2. If you have an existing address, delete it
3. Tap **Create new address**
4. Your new address is now created on `smp.simplego.dev`
5. Tap **Share address** to copy it to your clipboard

### Step 3: Add GoChat to your website

Take the address from your clipboard and add the GoChat script tag to your website:

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="YOUR_COPIED_ADDRESS_HERE"
        data-server-url="wss://smp.simplego.dev"
        async></script>
```

That's it. Visitors can now open the chat widget and their browser establishes an end-to-end encrypted connection directly to your SimpleX app.

### Step 4: Accept incoming chats

When a visitor starts a chat on your website, a connection request appears in your SimpleX app. Accept the request and you can start messaging. Each visitor appears as a separate contact. Multiple concurrent conversations are supported.

---

## Supported address formats

GoChat accepts SimpleX contact addresses in multiple formats. You can use whichever format your SimpleX app provides:

### Full HTTPS format

The standard share link from the SimpleX app:

```
https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F...
```

### Short format

The compact address format:

```
https://smp.simplego.dev/a#ABCDxxxxxxxxxxxxxxxxxxxxxxx
```

### Deep-link format

The `simplex://` URI scheme used by the mobile app. GoChat automatically converts this to the HTTPS format:

```
simplex://contact#/?v=2-7&smp=smp%3A%2F%2F...
```

All three formats work in the `data-contact-address` attribute. GoChat normalizes the address internally before establishing the connection.

### Important: Server compatibility

Regardless of format, the contact address must point to a WebSocket-enabled SMP server. If your address contains a server like `smp8.simplex.im` or `smp10.simplex.im`, GoChat cannot connect because those servers do not support WebSocket. Follow the setup steps above to create an address on `smp.simplego.dev`.

---

## Development

```powershell
git clone https://github.com/saschadaemgen/GoChat.git
cd GoChat
cd smp-web
npm install
npx vitest run              # 554+ tests
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
      __tests__/               # 554+ tests across 23 files
    widget/                    # Widget source (entry, UI, CSS, HTML, animations)
    package/                   # npm package files for gochat-widget
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
| Widget product (CDN, npm, animations, demo) | S12 | 551 |
| Address format normalization | S13 | 554 |

### In progress

| Component | Season | Description |
|:----------|:-------|:------------|
| Security hardening | S13 | CSP, SRI, Web Worker, vendoring |

### Planned

| Component | Season | Description |
|:----------|:-------|:------------|
| GRP: Noise transport | S14 | Noise IK/XX for GoRelay |

### Season overview

| Season | Focus | Status |
|:-------|:------|:-------|
| S1-S11 | Protocol + E2E + Chat + Receipts + Lifecycle | Complete (551+ tests) |
| S12 | Widget Product (CDN, npm, animations, demo) | Complete |
| **S13** | **Security Hardening** | **In progress** |
| S14+ | GRP Profile (Noise, PQ, two-hop) | Future |

### npm packages

| Package | Version | Description |
|:--------|:--------|:------------|
| [gochat-widget](https://www.npmjs.com/package/gochat-widget) | 1.0.0 | Embeddable chat widget with UI |
| [simplex-js](https://www.npmjs.com/package/simplex-js) | 1.0.0 | Protocol library (no UI) |

### Live instances

| URL | Description |
|:----|:------------|
| [cdn.simplego.dev/gochat.js](https://cdn.simplego.dev/gochat.js) | Widget CDN |
| [demo.it-and-more.systems](https://demo.it-and-more.systems) | Live demo with configurator |
| [simplego.dev](https://simplego.dev) | SimpleGo website (GoChat embedded) |
| [it-and-more.systems](https://it-and-more.systems) | IT and More Systems (GoChat embedded) |

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
| [GoRelay](https://github.com/saschadaemgen/GoRelay) | Encrypted dual-protocol relay server (SMP + GRP) | [GitHub](https://github.com/saschadaemgen/GoRelay) |
| [GoBot](https://github.com/saschadaemgen/GoBot) | SimpleX moderation and verification bot | [GitHub](https://github.com/saschadaemgen/GoBot) |
| [GoUNITY](https://github.com/saschadaemgen/GoUNITY) | Verified identity certificate authority | [GitHub](https://github.com/saschadaemgen/GoUNITY) |
| [simplex-js](https://github.com/saschadaemgen/simplex-js) | JavaScript SimpleX protocol implementation | [GitHub](https://github.com/saschadaemgen/simplex-js) |

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
