<p align="center">
  <img src="../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

# GoChat Security Hardening Roadmap

**Created:** Season 6 (2026-03-26)
**Updated:** Season 11 (2026-04-02) - Current state updated, S11 findings added
**Status:** Planning - phased implementation across future seasons
**Context:** Browser-native keys are currently stored as plain JS variables. This document defines a realistic hardening path based on research into Web Crypto API capabilities, browser threat models, and how Signal, WhatsApp, Element, and Wire solve these problems.

---

## Current State (Season 11)

- Keys generated fresh per session (Ed25519, X25519, X448)
- Keys stored as raw byte arrays in JavaScript memory
- Ephemeral by design - tab close destroys everything
- No persistent storage, no accounts, no key reuse
- Crypto pipeline: X3DH + Double Ratchet + NaCl crypto_box (Signal-level design)
- SMP transport encryption via WebSocket TLS (wss://)
- Delivery receipts with bidirectional A_RCVD (Season 11)
- Connection lifecycle management: END detection, timeout, x.direct.del (Season 11)
- .env build-time configuration for contact address and server URL (Season 11)
- Input sanitization via escHtml() using textContent auto-escaping (Season 5)
- 551+ tests across 23 files, zero regressions

**Risk assessment:** Acceptable for ephemeral support chat. No long-lived secrets. Attack window is limited to the active browser tab. Ephemeral keys actually provide stronger forward secrecy than persistent-key approaches.

**Important context (Season 11):** GoChat is designed as an encrypted support chat widget for website operators - comparable to Intercom but with E2E encryption via SimpleX. It is not intended as a high-security communication tool. For that use case, SimpleGo offers dedicated hardware devices in Class 1, 2, and 3 with hardware-level key protection, secure enclaves, and no browser in the loop.

---

## Threat Model

Research identified the following prioritized threats for browser-based E2E encryption:

| Attack Vector | Likelihood | Impact | Current Mitigation |
|--------------|-----------|--------|-------------------|
| XSS against crypto keys | High | Critical | escHtml() via textContent (S5) |
| npm supply chain compromise | High | Critical | None |
| Browser extension key theft | Medium-High | Critical | None (technically unsolvable) |
| Embedded widget risks (same-origin) | Medium-High | High | N/A (not embedded yet) |
| Server-side JS tampering | Medium | Critical | None |
| WebSocket MitM | Medium | Low | E2E encryption protects content |
| JS timing side-channels | Low | High | Fundamental JS limitation |

The fundamental unsolved problem shared by ALL browser-based E2E messengers is server trust: the server delivers the JavaScript on every page load. A compromised server can serve modified code that exfiltrates keys. Native apps are auditable at a point in time - web code changes on every load.

---

## Web Crypto API Compatibility (as of early 2026)

| Algorithm | Chrome | Firefox | Safari | Global | Non-extractable? |
|-----------|--------|---------|--------|--------|-----------------|
| Ed25519 (sign/verify) | 137+ | 129+ | 17.0+ | ~83% | Yes |
| X25519 (key agreement) | 133+ | 130+ | 17.0+ | ~83% | Yes |
| HKDF-SHA256 | All modern | All modern | All modern | ~97% | Yes |
| AES-GCM | All modern | All modern | All modern | ~97% | Yes |
| X448 / Ed448 | None | None | None | 0% | N/A |
| XSalsa20-Poly1305 (NaCl) | None | None | None | 0% | N/A |

**Key finding:** Ed25519 and X25519 are formally standardized in W3C Web Crypto Level 2 (April 2025). Both support `extractable: false`. X448 has zero browser support and no implementation plans.

**Hybrid architecture required:** SMP uses NaCl crypto_box (XSalsa20-Poly1305) which is not in Web Crypto. These operations will always require raw key bytes in JS memory (via tweetnacl or @noble/ciphers). Only non-NaCl operations can use non-extractable keys.

---

## What the big messengers do

### Signal Desktop
- Electron app with Rust-to-WASM crypto (libsignal)
- SQLCipher for encrypted local storage
- Until July 2024: DB encryption key stored as plaintext in config.json (known since 2018)
- Now uses Electron safeStorage API (OS-level key protection)
- Identity keys still exist in process memory during runtime

### WhatsApp Web
- Each device generates its own identity keypair (multi-device since 2021)
- Keys stored in IndexedDB using Web Crypto CryptoKey with extractable: false
- Client-fanout encryption: each message encrypted N times, once per device
- Local messages encrypted with AES-CBC using keys from dedicated IndexedDB

### Element Web (Matrix)
- Migrated crypto core to Rust-to-WASM (vodozemac, audited by Least Authority)
- 5-6x faster than previous pure JS implementation
- Keys in IndexedDB with optional passphrase-derived encryption
- Server-side encrypted key backup with recovery key model
- Lesson learned: ephemeral-only is a UX barrier for daily messaging

### Wire
- Proteus protocol (Signal/Axolotl-based) implemented in Rust-to-WASM
- Migrating to MLS (Messaging Layer Security, IETF standard)
- Single Rust codebase compiled for all platforms including web

### SimpleX Chat
- No web client as of March 2026 (GitHub issue #747 exists)
- GoChat would be the first browser-native SMP implementation

**Industry consensus:** Signal, Element, and Wire all independently converged on Rust-to-WASM for browser crypto. This is the proven pattern for production-grade browser E2E.

---

## Implementation Phases

### Phase 1: CSP + SRI + Input Sanitization (Season 12)

**Goal:** Block XSS and script tampering - the two highest-likelihood attacks.
**Effort:** Small (1-2 sessions)
**Impact:** High

**Partial progress:** Input sanitization via escHtml() (textContent auto-escaping) already exists in chat.js since Season 5. DOMPurify evaluation is part of Season 12.

#### Content Security Policy

Deploy strict nonce-based CSP on the SimpleGo website:

```http
Content-Security-Policy:
  default-src 'none';
  script-src 'nonce-{RANDOM}' 'strict-dynamic' https: 'unsafe-inline';
  style-src 'self' 'nonce-{RANDOM}';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src wss://smp.simplego.dev:8444;
  worker-src 'self' blob:;
  frame-ancestors 'none';
  form-action 'none';
  base-uri 'none';
  object-src 'none';
  upgrade-insecure-requests;
  report-to csp-endpoint;
  report-uri /api/csp-report;
```

**Critical WebSocket gotcha:** The `'self'` keyword does NOT match `wss://` schemes. Without explicit `connect-src wss://smp.simplego.dev:8444`, all WebSocket connections will be silently blocked.

The `'unsafe-inline'` and `https:` in script-src are ignored by CSP Level 3 browsers that understand `'strict-dynamic'` - they serve purely as fallbacks for older browsers.

#### Subresource Integrity

esbuild has no native SRI support. Add a post-build script:

```bash
# Generate SRI hash after build
HASH=$(shasum -b -a 384 dist/gochat-client.js | xxd -r -p | base64)
# Inject into script tag
<script src="/assets/js/gochat-client.js"
        integrity="sha384-${HASH}"
        crossorigin="anonymous"></script>
```

**Skip code splitting.** Bundle everything into a single IIFE file (which we already do). This avoids the unsolved problem of SRI verification on dynamically loaded chunks.

#### Input Sanitization

Install DOMPurify. Sanitize ALL rendered message content before inserting into the DOM. Never use innerHTML with unsanitized user input.

```typescript
import DOMPurify from 'dompurify';
chatElement.innerHTML = DOMPurify.sanitize(messageText);
```

**Note (Season 11):** chat.js already uses `escHtml()` which creates a div element, sets `textContent` (auto-escaping), then reads `innerHTML`. This prevents script injection through chat messages. DOMPurify would be an additional defense layer.

#### CSP Reporting

Deploy with `Content-Security-Policy-Report-Only` first. Monitor for violations. Tighten iteratively, then switch to enforcing mode. Sentry supports CSP violation ingestion for monitoring.

---

### Phase 2: Crypto Web Worker (Season 13)

**Goal:** Isolate all key material from the main thread.
**Effort:** Medium (3-5 sessions)
**Impact:** High

Move all cryptographic operations into a dedicated Web Worker (`crypto-worker.ts`). Worker internal variables cannot be directly accessed from the main thread - communication happens only via postMessage.

#### Architecture

```
Main Thread (chat UI)          Web Worker (crypto-worker.ts)
  |                              |
  |-- "generateKeys" --------->  | generateEd25519() [non-extractable]
  |                              | generateX25519()  [non-extractable]
  |<-- "keysReady" -----------   | (keys never leave worker)
  |                              |
  |-- "encrypt", plaintext --->  | ratchetEncrypt(plaintext)
  |<-- "encrypted", ciphertext-  | (key material stays in worker)
  |                              |
  |-- "decrypt", ciphertext -->  | ratchetDecrypt(ciphertext)
  |<-- "decrypted", plaintext -  |
  |                              |
  |-- "smpSend", command ----->  | buildSMPFrame(command)
  |<-- "smpFrame", bytes ------  | (sessionId, signing in worker)
```

#### Security properties

- XSS in main thread cannot read worker memory
- Keys never cross the postMessage boundary
- Only plaintext and ciphertext are exchanged
- Freeze prototypes inside worker before crypto init:
  `Object.freeze(Object.prototype)` prevents prototype pollution

#### Limitations (be honest about these)

- An attacker with XSS CAN intercept postMessage results
- An attacker CAN send requests to the worker to use keys indirectly
- Browser extensions with MAIN world access bypass worker isolation
- This makes theft harder, not impossible

---

### Phase 3: Non-Extractable Keys (Season 13-14)

**Goal:** Prevent raw key bytes from entering JavaScript for supported algorithms.
**Effort:** Medium (3-4 sessions)
**Impact:** Medium

#### What can be non-extractable

| Operation | Non-extractable? | Notes |
|-----------|-----------------|-------|
| Ed25519 identity signing | Yes | Web Crypto native |
| X25519 key agreement | Yes (private key) | DH output is raw bytes by necessity |
| HKDF root chain derivation | Yes (base key) | Output can be non-extractable CryptoKey |
| AES-GCM message encryption | Yes | Derived as non-extractable from HKDF |
| SMP crypto_box (NaCl) | No | tweetnacl/noble requires raw bytes |
| X448 key agreement | No | noble/curves requires raw bytes |
| HMAC chain key ratchet | Partial | HMAC output is raw bytes between steps |

#### What non-extractable actually means (and does not mean)

Non-extractable keys prevent `exportKey()` from returning raw bytes. They do NOT:
- Isolate key material in a separate process or hardware enclave
- Protect against Spectre-class memory reads
- Prevent extensions from monkey-patching crypto.subtle before key creation
- Encrypt keys stored in IndexedDB on disk

The W3C spec places no requirements on how key material is stored internally. In Chrome, Firefox, and Safari, non-extractable key material resides in the same render process memory as page JavaScript. Use as one layer of defense, never as the sole protection.

#### X448 decision point

X448 has zero browser support and no implementation roadmap. Signal uses only X25519. Options:

1. Keep X448 via @noble/curves (current) - no non-extractable protection possible
2. Drop X448 in favor of X25519 only - full non-extractable protection
3. Wait for browser support - could be years or never

This decision affects SMP protocol compatibility. Consult SimpleGo protocol team before changing.

---

### Phase 4: Dependency Hardening (Season 12)

**Goal:** Protect against npm supply chain attacks.
**Effort:** Small-Medium (1-2 sessions)
**Impact:** High

#### Actions

1. **Vendor all crypto dependencies** directly into the repository:
   - @noble/curves (X448, Ed25519 fallback)
   - @noble/hashes (SHA-256, SHA-512, HKDF)
   - @noble/ciphers (XSalsa20-Poly1305) or tweetnacl
   - zstd-codec (compression)

2. **Pin exact versions** with lockfile, use `npm ci` exclusively in CI/CD

3. **Audit diffs** on every dependency update with `npm-diff`

4. **Prefer @noble libraries** - they have minimal dependencies (only @noble/hashes), PGP-signed commits, and token-less CI

---

### Phase 5: Cross-Origin Iframe for Embeddable Widget (Season 14+)

**Goal:** Protect GoChat when embedded on third-party websites.
**Effort:** Medium (2-3 sessions)
**Impact:** High (for embedded use case)

When GoChat is embedded on external websites, serve it from a separate origin (e.g., `chat.gochat.io`). The Same-Origin Policy then prevents the parent page from accessing:
- The iframe's DOM
- JavaScript variables inside the iframe
- CryptoKey objects
- WebSocket connections

#### Rules for cross-origin iframe communication

- Validate postMessage origins against a strict whitelist
- Never use `targetOrigin: '*'`
- Never share key material across the postMessage boundary
- Only pass: "open chat", "close chat", "chat ready" signals
- All crypto stays inside the iframe origin

---

### Phase 6: Rust-to-WASM Crypto Core (Season 15+)

**Goal:** Memory safety, constant-time guarantees, unified codebase.
**Effort:** Large (dedicated season)
**Impact:** Very High

This is the pattern that Signal (libsignal), Element (vodozemac), and Wire all independently converged on. Benefits:

- Memory safety (no buffer overflows, no use-after-free)
- Constant-time operations (JS runtime cannot guarantee this)
- 5-6x performance improvement over pure JS (Element's benchmark)
- NaCl crypto_box runs natively in Rust (crypto_box crate compiles to WASM)
- Single auditable codebase for all platforms
- Solves the NaCl non-extractable gap entirely

#### Approach

1. Write crypto core in Rust using established crates:
   - `ed25519-dalek` for Ed25519
   - `x25519-dalek` for X25519
   - `crypto_box` for NaCl operations
   - `hkdf` + `sha2` for key derivation
   - `aes-gcm` for message encryption

2. Compile to WASM with `wasm-pack`

3. WASM memory is NOT accessible from JavaScript (unlike SharedArrayBuffer)

4. Keys live entirely in WASM linear memory

#### Prerequisites
- Stable chat functionality first (Seasons 6-11 - DONE)
- Proven test suite for protocol compatibility (551+ tests - DONE)
- Build pipeline for WASM (wasm-pack + esbuild integration)

---

## Priority Summary

| Priority | Phase | Protection Against | Effort | Season |
|----------|-------|-------------------|--------|--------|
| 1 | CSP + SRI + DOMPurify | XSS, script tampering | Small | 12 (next) |
| 2 | Dependency vendoring | Supply chain attacks | Small | 12 (next) |
| 3 | Crypto Web Worker | XSS key theft | Medium | 13 |
| 4 | Non-extractable keys | Casual JS key access | Medium | 13-14 |
| 5 | Cross-origin iframe | Third-party embedding | Medium | 14+ |
| 6 | Rust-to-WASM | All JS-level threats | Large | 15+ |

---

## Honest Limitations

Even with all six phases implemented, browser-based E2E encryption has inherent limits:

1. **Server trust problem:** The server delivers new JavaScript on every page load. A compromised server can serve modified code. SRI + Service Worker caching reduce but do not eliminate this risk.

2. **Browser extensions:** Extensions with MAIN world access can intercept any JavaScript operation. No technical solution exists - only user education (dedicated browser profile, minimal extensions).

3. **No hardware key protection:** Unlike mobile apps with Secure Enclave / TEE, browsers have no access to hardware key storage. Keys always exist in software memory.

4. **Process memory:** All browser security mechanisms (non-extractable, Web Workers, WASM) share the same OS process. Spectre-class attacks theoretically bypass all of them.

**GoChat's advantage:** Ephemeral keys by design. Each session generates fresh keys, destroyed on tab close. There are no long-lived secrets to steal, no persistent database to decrypt. An attacker must be present in real-time during the active session. This is genuinely stronger forward secrecy than persistent-key messengers like Signal Desktop.

---

## References

- W3C Web Cryptography API Level 2 (April 2025 FPWD)
- web.dev: Strict CSP with nonce-based approach
- OWASP Content Security Policy Cheat Sheet
- Signal Desktop safeStorage migration (July 2024)
- WhatsApp multi-device architecture (Meta Engineering, 2021)
- Element R / vodozemac audit (Least Authority, 2022)
- @noble/curves - audited JS elliptic curve cryptography
- W3C webcrypto issue #269: non-extractable key security model

---

*"Erst die Mauern, dann die Schloesser, dann die Wachen, dann die Schmiede." - Prinzessin Mausi*
