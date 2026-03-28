<p align="center">
  <img src="../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<h1 align="center">GoChat - Research Findings</h1>

<p align="center">
  <strong>Deep research on browser-native encrypted messaging, design patterns, and security.</strong><br>
  Dual-profile architecture: SMP for everyday use, GRP for high-security environments.<br>
  Conducted during Season 1 planning phase, updated with Season 5 real-server findings.
</p>

---

## 1. Market position: GoChat would be a world first

No browser-native SMP client exists anywhere. Not from SimpleX Chat, not from the community, not from any third party. GitHub Issue #747 (open since June 2022) requests a web interface but has no official response.

The only TypeScript packages from SimpleX (`simplex-chat` on npm and `@simplex-chat/webrtc-client`) wrap the compiled Haskell native library or control the CLI via WebSocket. Neither implements the SMP protocol itself in JavaScript.

Additionally, no open-source support chat tool offers E2E encryption on the customer-facing widget side:

| Tool | GitHub Stars | Customer-facing E2E | Internal E2E |
|:-----|:------------|:-------------------|:-------------|
| Chatwoot | 27,700+ | No | No |
| Rocket.Chat | 41,000+ | No | Yes (RSA-OAEP + AES-GCM) |
| Crisp | Closed source | No | No |
| Intercom | Closed source | No | No |
| tawk.to | Closed source | No | No |
| Papercups | 5,700 (maintenance mode) | No | No |
| **GoChat** | **New** | **Yes** | **N/A** |

GoChat would be first on three counts: first browser-native SMP client, first E2E encrypted customer support widget, and the only browser messenger offering a dual-profile architecture where users can choose between standard SMP encryption for everyday use and a high-security GRP profile with post-quantum cryptography, Noise transport, and two-hop relay routing.

No existing tool - open source or commercial - offers anything comparable to the GRP profile in a browser context. Signal, Matrix, and Wire provide strong E2E encryption but none offer post-quantum transport, mandatory multi-hop routing, or cover traffic in their web clients.

---

## 2. Browser cryptography maturity

### 2.1 Native Web Crypto API support (2025+)

X25519 and Ed25519 are now natively available across all major browsers:

| Browser | X25519 | Ed25519 | Since |
|:--------|:-------|:--------|:------|
| Chrome | 133+ | 133+ | February 2025 |
| Firefox | 135+ | 135+ | 2025 |
| Safari | 17+ | 17+ | 2023-2025 |

This was a multi-year effort by Igalia funded by Protocol Labs.

For GoChat's SMP profile, this means the core key exchange primitives are natively available in all target browsers. The GRP profile requires additional algorithms (ChaCha20-Poly1305 for Noise, ML-KEM-768 for post-quantum) that are not yet in Web Crypto and must come from external libraries or WASM modules.

### 2.2 What Web Crypto still lacks

- XSalsa20-Poly1305 (needed for SMP NaCl crypto_box)
- XChaCha20-Poly1305
- ChaCha20-Poly1305 AEAD (needed for GRP Noise transport)
- ML-KEM-768 (needed for GRP post-quantum key exchange)
- BLAKE2s (needed for GRP Noise hash function)
- Argon2 (key derivation)
- sntrup761 (post-quantum KEM, used by SimpleGo hardware)

These require external JavaScript libraries. For the SMP profile, the @noble suite covers all needs. For the GRP profile, ML-KEM-768 is the biggest open question - no mature, audited JavaScript implementation exists yet. Options include a pure JS implementation (auditable but potentially vulnerable to side-channel attacks) or a WASM-compiled Rust/C library (better side-channel resistance but harder to audit in the browser context).

### 2.3 Recommended crypto library: @noble/curves

The noble cryptography suite by Paul Miller is the recommended choice for both profiles:

- **6 professional security audits** (Cure53 x4, Trail of Bits x1, Kudelski Security x1)
- Zero dependencies, PGP-signed releases, transparent npm builds
- ~5KB for Ed25519 (vs ~290KB for libsodium.js)
- Used in production by: Proton Mail, Tutanota, MetaMask, Phantom, ethers.js, Trezor Suite
- The xftp-web infrastructure in the smp-web spike already uses @noble/hashes

Relevant packages:
- `@noble/curves` - Ed25519, X25519 (both profiles)
- `@noble/ciphers` - XSalsa20-Poly1305 (SMP), ChaCha20-Poly1305 (GRP Noise), AES-256-GCM (key storage)
- `@noble/hashes` - SHA-256, SHA-512, HKDF, BLAKE2s (GRP Noise)

For the GRP profile specifically, @noble/ciphers provides ChaCha20-Poly1305 and @noble/hashes provides BLAKE2s - both required by the Noise cipher suite `Noise_IK_25519_ChaChaPoly_BLAKE2s`. This means a single library family covers the cryptographic needs of both communication profiles.

### 2.4 Industry trend: Rust to WASM

Every major encrypted messenger has converged on Rust crypto compiled to WASM:

- **Element Web** (Matrix): Migrated to matrix-sdk-crypto (Rust->WASM), 14x faster key sharing
- **Signal Desktop**: Uses libsignal (Rust->WASM)
- **Wire**: Uses core-crypto (Rust->WASM), encrypts IndexedDB with AES-256-GCM

For GoChat's SMP profile: Pure TypeScript with noble libraries is simpler to ship. For the GRP profile: a WASM-compiled ML-KEM-768 implementation may be necessary because post-quantum algorithms are computationally heavier and more sensitive to side-channel attacks than classical algorithms. This decision will be revisited when the GRP profile enters active development (Season 10+).

### 2.5 Post-quantum cryptography in the browser (GRP profile)

The GRP profile mandates hybrid X25519 + ML-KEM-768 key exchange. This creates a unique browser challenge because no standardized Web Crypto API for ML-KEM exists yet. Options for the GRP profile:

| Approach | Pros | Cons |
|:---------|:-----|:-----|
| Pure JS (@noble-style) | Auditable, no build tooling, consistent with SMP profile | Side-channel risk in JS, no FIPS validation |
| WASM (Rust compiled) | Better side-channel resistance, faster, FIPS-validated source | Harder to audit in-browser, larger bundle, build complexity |
| WebAssembly + JS hybrid | Best of both: WASM for ML-KEM, JS for classical crypto | Two crypto runtimes to maintain |

Go 1.24's stdlib includes FIPS-validated ML-KEM-768 - GoRelay uses this server-side. The browser needs an equivalent. This is an open research question tracked as GRP-2 in the protocol document.

### 2.6 Crypto algorithms verified in practice (Seasons 4 and 5)

During Seasons 4 and 5, the SimpleGo team (an independent C implementation of the SimpleX protocol) provided exact crypto specifications from their working implementation and packet captures. The following was confirmed:

| Algorithm | Usage | Library |
|:----------|:------|:--------|
| X448 (Curve448) | Double Ratchet key exchange, X3DH | @noble/curves/ed448 |
| X25519 (Curve25519) | Per-queue NaCl crypto_box (Layer 1) | @noble/curves/ed25519 |
| Ed25519 | SMP command authorization (signing) | @noble/curves/ed25519 |
| AES-256-GCM | Double Ratchet body + header encryption | @noble/ciphers/aes |
| XSalsa20-Poly1305 | NaCl crypto_box (SMP Layer 1) | @noble/ciphers |
| NaCl crypto_box (nacl.box) | Per-queue E2E encryption (Layer 1) | tweetnacl |
| HKDF-SHA512 | X3DH key derivation ("SimpleXX3DH") | @noble/hashes/hkdf |
| HKDF-SHA256 | Ratchet chain key derivation ("SimpleXMK"/"SimpleXCK") | @noble/hashes/hkdf |
| SHA-256 | Server identity fingerprint (keyHash in ClientHello) | @noble/hashes/sha256 |
| Zstd (level 3) | connInfo payload compression | zstd-codec |

**Critical finding:** SimpleX uses X448 (not X25519) for the Double Ratchet layer. This is a different curve than the per-queue NaCl layer. Confusing the two was documented as one of SimpleGo's earliest implementation bugs. GoChat uses both: X25519 for Layer 1 (SMP transport encryption), X448 for Ratchet (E2E encryption).

**X3DH variant:** SimpleX uses a modified symmetric 4-DH scheme, not Signal's 3-DH. Both sides generate two X448 key pairs, producing four DH shared secrets that are concatenated and fed into HKDF-SHA512 with salt=zeros(32) and info="SimpleXX3DH". This produces 96 bytes split into Root Key (32) + Header Key (32) + Next Header Key (32).

**Agent confirmation format (from SimpleGo packet captures):**
- agentVersion = 7 (2 bytes Big-Endian)
- 'C' confirmation tag (1 byte)
- Just(e2eEncryption_): e2e version v3-v3, two X448 SPKI keys (68 bytes each, OID 1.3.101.111), optional KEM key
- encConnInfo: zstd-compressed JSON (ChatMessage v1-16, x.info event with profile)

### 2.7 Ed25519 signing for SMP commands (Season 5)

Season 5 real-server testing revealed the exact Ed25519 signing requirements for SMP v6 commands. This knowledge came from 15 protocol fixes against a real SMP v6.4.5.1 server, with critical assistance from the SimpleGo protocol analysis team.

**Signing process for SMP v6:**

1. Generate Ed25519 keypair (privateKey 32B seed, publicKey 32B)
2. Public key is SPKI-wrapped (44 bytes: `30 2a 30 05 06 03 2b 65 70 03 21 00 [32B key]`)
3. SPKI-wrapped key goes in the command body (e.g., NEW authKey)
4. Raw 32-byte seed is used for signing via `ed25519.sign()`

**What gets signed (v6 - the critical trap):**

```
signedData = [0x20][sessionId 32B] + [corrIdLen 1B][corrId 24B] + [entityIdLen 1B][entityId] + [command]
```

The `[0x20]` byte (length prefix for the 32-byte sessionId) MUST be included in the signed data. This cost the SimpleGo team an entire day to discover. Their error progression:
1. sign(corrId + entityId + cmd) - ERR AUTH
2. sign(sessionId + corrId + entityId + cmd) - ERR AUTH
3. sign([0x20] + sessionId + corrId + entityId + cmd) - SUCCESS

The @noble/curves ed25519 library accepts the 32-byte private key (seed) directly and expands it internally, which is compatible with libsodium's `crypto_sign_detached()` behavior.

**SPKI format reminder:**
- Ed25519 (OID `2b 65 70`): `30 2a 30 05 06 03 2b 65 70 03 21 00 [32B key]` = 44 bytes
- X25519 (OID `2b 65 6e`): `30 2a 30 05 06 03 2b 65 6e 03 21 00 [32B key]` = 44 bytes

The OID difference is ONE BYTE: `70` for Ed25519 (signing), `6e` for X25519 (DH). The SimpleGo team documented confusing these as a common early bug.

The @noble ecosystem covers all required algorithms from a single audited source.

### 2.8 NaCl crypto_box architecture (Season 6)

Season 6 real-server testing revealed a critical distinction between `nacl.box()` (tweetnacl)
and raw `xsalsa20poly1305` (@noble/ciphers):

```
nacl.box(plaintext, nonce, peerPublicKey, ourPrivateKey):
  1. DH: shared_secret = X25519(ourPrivateKey, peerPublicKey)      // 32 bytes
  2. HSalsa20: symmetric_key = HSalsa20(shared_secret, zeros[16])  // 32 bytes
  3. XSalsa20-Poly1305: ciphertext = encrypt(symmetric_key, nonce, plaintext)
```

Using `@noble/ciphers` xsalsa20poly1305 directly with the raw DH shared secret skips step 2
(HSalsa20 key derivation), producing ciphertext that the peer cannot decrypt (A_CRYPTO error).

The HSalsa20 step exists because the raw DH output has non-uniform distribution. HSalsa20 acts
as a key derivation function, producing a uniformly distributed symmetric key. This is part of
Daniel Bernstein's original NaCl design.

For GoChat, the fix was simple: use `nacl.box()` from tweetnacl instead of manually composing
the cipher.

### 2.9 AgentInvitation discovery (Season 6)

Season 6 discovered that the SimpleX protocol uses two distinct agent message types for
connection establishment, with completely different wire formats:

| Property | AgentConfirmation (owner) | AgentInvitation (joiner) |
|:---------|:--------------------------|:-------------------------|
| PrivHeader | 'K' + 44B Ed25519 SPKI | '_' (PHEmpty, 1 byte) |
| Tag | 'C' (0x43) | 'I' (0x49) |
| E2E params | Inline (X448 SPKI keys) | In connReq URI (x3dh= param) |
| Queue info | Binary SMPQueueInfo | URI string in connReq |
| connInfo | Ratchet-encrypted encConnInfo | Plaintext Tail bytes |
| Encryption | Per-queue E2E + Ratchet | Per-queue E2E only |

The contact address owner sends AgentConfirmation (as implemented by SimpleGo in Session 8).
The joining party sends AgentInvitation (as discovered by GoChat in Season 6).

This distinction was not documented anywhere outside the Haskell source code. The definitive
answer came from reading Agent/Client.hs:1654-1664 and Protocol.hs:800-801.

**Key implication for Season 7:** When the app accepts and responds, it sends an
AgentConfirmation back. This IS Ratchet-encrypted and contains X448 keys for X3DH.

**Key implication for SimpleGo:** The SimpleGo team now has the complete joining-party
protocol specification, enabling them to implement contact link scanning on the ESP32-S3.

---

## 3. Security analysis

### 3.1 The existential threat: XSS

A single XSS vulnerability defeats ALL encryption - both SMP and GRP profiles - by intercepting plaintext before encryption or after decryption. The 2022 Matrix "Nebuchadnezzar" vulnerabilities demonstrated this in practice - researchers found exploitable bugs allowing confidentiality breaks and impersonation.

This is the fundamental limitation of browser-based encryption that no amount of protocol-level security can fix. The GRP profile with its Noise transport, post-quantum crypto, and two-hop routing is still vulnerable to XSS at the browser endpoint. This is why GoChat's security documentation (SEC-4) must be transparent about the trust boundary.

For the highest security requirements, the GRP profile combined with a SimpleGo hardware endpoint eliminates the browser trust boundary entirely on the receiving side - the hardware device runs auditable firmware with no server-delivered code, no smartphone OS, and hardware-backed key storage with optional eFuse protection.

**Mitigations (both profiles):**
- Strict CSP: `script-src 'self'` - no eval, no inline scripts (SEC-1)
- Subresource Integrity (SRI) on all external scripts (SEC-2)
- Minimal dependencies to reduce supply chain attack surface
- All crypto operations in a dedicated Web Worker (SEC-3), isolated from main thread

The September 2025 npm supply chain attack compromised packages with 1 billion+ weekly downloads (chalk, debug, ansi-styles) - a stark reminder that dependency minimization is security-critical. GoChat's @noble-only crypto policy limits the attack surface to three well-audited packages.

### 3.2 The trust boundary: server-delivered code

Unlike native apps distributed through signed app stores, web applications reload from the server on every visit. A compromised or malicious server can serve different code to different users.

This trust boundary affects both profiles equally. Even GRP's Noise + ML-KEM-768 transport provides no protection if the browser code itself is compromised.

**GoChat must document this trust boundary honestly while mitigating with:**
- Reproducible builds
- SRI hashes
- Potentially browser extension-based code verification
- Transparent security documentation

**The dual-profile architecture provides a natural escape from this limitation:** for communications where the browser trust boundary is unacceptable, the GRP profile with a SimpleGo hardware endpoint on the receiving side ensures that at least one party is running verified, non-server-delivered code. The browser side remains the weaker link, but the hardware side is fully controlled.

### 3.3 TLS certificate challenge (resolved in Season 5)

SMP servers use self-signed certificate chains where the offline CA certificate hash is embedded in the server address (`smp://fingerprint@host`). Browsers reject WSS connections to servers with untrusted certificates.

**Solution implemented in Season 5:** A standalone Nginx reverse proxy terminates TLS with a trusted Let's Encrypt certificate and forwards WebSocket connections to the SMP server's internal WebSocket port. The SMP server's own TLS (with self-signed certs) runs between Nginx and the SMP server on localhost.

```
Browser --WSS (LE cert)--> Nginx :8444 --WSS (self-signed)--> SMP :5225
```

The SMP server fingerprint from the contact address is used for application-layer identity verification (keyHash in ClientHello), not for TLS certificate validation. This means the browser trusts the Let's Encrypt certificate for transport, while the SMP protocol's own fingerprint check verifies the server identity independently of the CA chain.

**Key implementation detail:** The Nginx proxy requires `proxy_ssl_conf_command Options UnsafeLegacyRenegotiation` because the SMP server's TLS implementation uses older renegotiation that modern OpenSSL rejects by default.

For the GRP profile, this challenge does not apply in the same way. Noise Protocol uses the server's 32-byte Curve25519 public key as identity - no certificates, no CA chain, no expiry. The key IS the fingerprint. However, the initial WebSocket connection to the GoRelay server still needs a valid TLS certificate for the browser to accept the WSS upgrade. The Noise handshake then provides a second, independent encryption layer inside the WebSocket.

### 3.4 WebSocket-specific attacks

**Cross-Site WebSocket Hijacking (CSWSH):** Since WebSocket is not bound by Same-Origin Policy, a malicious page can open connections using the victim's cookies.

**Solution:** Use token-based authentication (not cookies) - pass tokens in the first WebSocket message after connection. This eliminates CSWSH entirely since there are no ambient credentials. This applies to both SMP and GRP profiles.

### 3.5 Browser key storage

Recommended layered approach (both profiles share the same key storage architecture):
- Store CryptoKey objects in IndexedDB with `extractable: false`
- Encrypt all sensitive data with AES-256-GCM before writing to IndexedDB
- Derive wrapping key from user password/PIN via PBKDF2 (>=2^19 iterations)
- Run crypto operations in a dedicated Web Worker
- Clear key material from memory as aggressively as JS GC allows

The GRP profile stores additional key material compared to SMP: the Noise static key pair, ML-KEM-768 keys (significantly larger - 1,184 bytes for the encapsulation key vs 32 bytes for X25519), and potentially Shamir share metadata. The IndexedDB encryption layer handles this transparently since it operates on arbitrary byte arrays.

---

## 4. WebSocket architecture

### 4.1 SharedWorker for connection management

To maintain chat state across tab switches and SPA navigation:

```
Browser Tab(s) <-> SharedWorker (WS Pool + Reconnection + Queue) <-> SMP/GRP Servers
                       |
                  IndexedDB (persistent message queue + encrypted key store)
```

The SharedWorker manages connections for both profiles. A single SharedWorker instance can maintain WebSocket connections to SMP servers (port 443) and GoRelay servers (port 7443) simultaneously, routing messages to the correct profile handler based on connection type.

### 4.2 Reconnection strategy

Production messaging apps use exponential backoff with jitter:
- 500ms base delay
- 2x multiplier per attempt
- 30-second maximum cap
- 50-100% multiplicative jitter (prevents thundering herd)
- After 12 attempts (~2 minutes): show "Connection lost" with manual reconnect
- Use `navigator.onLine` and `visibilitychange` for network-aware behavior

For the GRP profile, reconnection must re-establish the Noise session (full handshake) since Noise sessions cannot be trivially resumed. This adds approximately 100-400 microseconds for the hybrid PQ key exchange - imperceptible to users but architecturally different from SMP reconnection where the TLS session may be resumable.

### 4.3 Performance considerations

- Disable `permessage-deflate` compression (encrypted payloads are incompressible)
- Use binary WebSocket frames (not text) to avoid 33% Base64 overhead
- Browser limits: ~6-30 WebSocket connections per domain in Chrome, ~200 total in Firefox
- Multiplex multiple SMP queues over a single WebSocket per server

GRP connections through GoRelay's two-hop routing add 5-15ms latency per hop for same-region servers. For messaging where delivery latency of 1-5 seconds is normal, this is imperceptible. The cover traffic generated by GoRelay (Poisson-distributed dummy messages) adds bandwidth overhead but no user-visible latency.

### 4.4 WebSocket proxy architecture (Season 5 finding)

Real-world deployment revealed that browsers cannot connect directly to SMP servers because:

1. SMP servers use self-signed certificates (browsers reject these for WSS)
2. The SMP WebSocket port (5225) may not be directly accessible
3. Corporate firewalls often block non-standard ports

The proven architecture uses a reverse proxy:

```
Browser --> WSS :8444 (Nginx, LE cert) --> HTTPS :5225 (SMP server, self-signed)
```

**Nginx as standalone process:** On servers managed by Plesk or similar panels, the system nginx is owned by the panel. A standalone nginx instance with its own config file and PID avoids conflicts:

```bash
nginx -c /etc/nginx/smp-proxy.conf   # Separate config, separate PID
```

**Critical proxy settings for SMP binary protocol:**
- `proxy_buffering off` - SMP uses fixed 16KB blocks; buffering breaks framing
- `proxy_request_buffering off` - commands must flow through immediately
- `tcp_nodelay on` - no Nagle algorithm delay for small packets
- `proxy_max_temp_file_size 0` - never write to disk
- `proxy_read_timeout 86400` - keep long-lived connections alive (24h)
- `proxy_ssl_verify off` - accept SMP server's self-signed cert
- `proxy_ssl_conf_command Options UnsafeLegacyRenegotiation` - SMP server uses older TLS

**What does NOT work as a proxy:**
- Apache mod_proxy_wstunnel: fails with "downstream server wanted client certificate" (SMP mutual TLS)
- Nginx stream module (TCP proxy): WebSocket requires HTTP Upgrade, TCP proxy cannot handle it
- Nginx with `proxy_pass http://`: SMP WebSocket port speaks TLS, not plain HTTP

**Production TODO:** The standalone nginx process does not survive server reboots. Requires a systemd service for production deployment.

---

## 5. SMP v6 protocol findings (Season 5)

Season 5's 15 protocol fixes against a real SMP v6.4.5.1 server produced a comprehensive understanding of the v6 wire format that was not previously documented anywhere outside the Haskell source code. The SimpleGo protocol analysis team (49 sessions, 81 bugs, 270 lessons) provided critical knowledge at several turning points.

### 5.1 SMP v6 vs v7 - key differences for browser clients

| Aspect | v6 (implySessId=false) | v7+ (implySessId=true) |
|:-------|:----------------------|:----------------------|
| SessionId in outgoing commands | Present (after signature) | Not present |
| SessionId in incoming responses | Present (must skip when parsing) | Not present |
| SessionId in signed data | Included with 0x20 length prefix | Included differently |
| NEW command | `"NEW " + authKey + dhKey + "S"` | May include basicAuth, sndSecure |
| Field separators in commands | ShortString self-delimiting (no spaces) | May use spaces for some fields |

### 5.2 Batch framing (mandatory since v4)

Every 16KB block sent to or received from the SMP server uses batch framing:

```
[2B contentLen (Word16 BE)] [1B txCount] [2B txLen (Word16 BE)] [transmission] ['#' padding to 16384]
```

`batch = True` is hardcoded in the Haskell server's `Transport.hs` since v4. There is NO fallback to unbatched format. The only exception is the handshake blocks (ServerHello/ClientHello) which use a simpler format.

The SimpleGo team discovered this as their Bug #31 (Session 31), where a `txCount == 1` filter in their parser silently discarded batched responses containing MSG frames. The one-character fix (`==` to `>=`) resolved three weeks of debugging.

### 5.3 Asymmetric sessionId behavior over WebSocket

When connecting through a WSS reverse proxy, the sessionId behavior is asymmetric:

- **Outgoing commands:** SessionId IS included in the wire format (after signature, before corrId)
- **Incoming responses:** SessionId IS present (must skip 33 bytes: 1B length + 32B sessionId before reading corrId)
- **Signed data:** SessionId IS included WITH its `0x20` length prefix

This asymmetry exists because the SMP server computes sessionId from TLS channel binding (`tls-unique` per RFC 5929). Over WebSocket through a proxy, the TLS session between Nginx and the SMP server provides the sessionId. The server sends this value in the ServerHello, and the client must echo it back in every command.

### 5.4 SMP command authentication

Every signed SMP command (NEW, SUB, KEY, ACK, DEL) carries its authentication in the wire format:

```
[sigLen 1B] [signature sigLen bytes] [sessIdLen 1B] [sessionId 32B] [corrIdLen 1B] [corrId] [entityIdLen 1B] [entityId] [command]
```

For unsigned commands: `sigLen = 0x00`, no signature bytes follow.
For signed commands: `sigLen = 0x40` (64 bytes Ed25519 signature).

The server verifies signatures using the public key associated with the queue. For NEW commands, the public key is extracted from the command body itself (the authKey parameter).

### 5.5 Length encoding conventions

From the SimpleGo protocol analysis (Session 4, the #1 bug class with 8 occurrences):

- **ShortString (1-byte length):** Used for keys, sessionId, corrId, entityId within transmissions
- **Large (2-byte Word16 BE):** Used for ByteString fields in agent-level messages (emHeader, ehBody, etc.)
- **Word16 BE:** Used for version numbers, content lengths in block framing

The SMP command body uses shortString (1-byte) for key fields. This is self-delimiting - the parser reads the length byte, then reads that many bytes for the value. No space separators needed between fields.

### 5.6 Error progression pattern

Real-server debugging follows a predictable progression where each fix reveals the next layer:

```
Network errors      -> Fix proxy/TLS/ports
Decode errors       -> Fix wire format parsing  
ERR SESSION         -> Fix sessionId handling
ERR CMD SYNTAX      -> Fix command body format
ERR CMD NO_AUTH     -> Fix signature presence
ERR AUTH            -> Fix signed data content
IDS / OK            -> Command accepted!
```

This pattern held exactly during Season 5's 15 fixes and mirrors the SimpleGo team's experience across 49 sessions.

---

## 6. Design specifications

### 6.1 Premium design targets

GoChat must achieve Intercom-level polish, not Chatwoot-level "it works".

| Element | Specification |
|:--------|:-------------|
| Panel width | 380px (350-400px range) |
| Panel height | 520-550px (100vh on mobile) |
| Panel position | Left-docked, flush with viewport edge |
| Message font | 14px, system font stack, 1.5 line-height |
| Bubble border-radius | 18px (4px on tail corner) |
| Bubble max-width | 70-75% of container |
| Incoming bubbles | Dark background with cyan/accent left border |
| Outgoing bubbles | Accent color background with 2px tail corner |
| Message spacing | 16px between senders, 2-4px within same sender |
| Dark mode background | #121212 (never pure black - causes halation) |
| Dark mode text | #E0E0E0 (never pure white) |
| Input field | Pill-shaped (border-radius: 20px), dark background |
| Send button | 40px circle, centered, accent color |
| Transitions | 200-300ms ease-out, only transform + opacity for 60fps |

### 6.2 Animation patterns

- **Message appear:** fade + translateY(10px->0) at 200ms ease-out
- **Panel open:** slideInLeft with 300ms ease
- **Panel close:** slideOutLeft with 300ms ease
- **Typing indicator:** Three 8px dots with staggered animation-delay, scale(0.6)->scale(1) at 1.4s
- **All animations must respect** `prefers-reduced-motion`

### 6.3 The encryption indicator

GoChat's unique visual differentiator: A persistent lock icon with "End-to-end encrypted" badge, always visible. This is not just a feature - it is the brand. No competitor can match this.

The encryption badge uses a shimmer animation matching the player cover art effect on the SimpleGo website, creating visual consistency across the design system.

For the dual-profile architecture, the encryption indicator should also communicate which profile is active. When using the GRP profile, an additional visual element (such as a shield icon or "Post-quantum secured" label) signals the elevated security level. The user should always know whether they are on SMP (standard encryption, any server) or GRP (Noise + PQ, GoRelay only).

### 6.4 Chat panel implementation (Season 5)

The chat panel was implemented in Season 5 with the following architecture:

- **CSS:** All classes prefixed with `gc-` to avoid conflicts with the existing SimpleGo design system
- **JS:** Panel logic with mock/real mode detection. If `window.createBrowserClient` is available and a contact address is configured, real mode activates. Otherwise, demo messages show the UI.
- **HTML:** Placed outside `#page-content` in the base template so the chat panel persists across SPA page navigation
- **Integration:** "Chat" tab in the util-bar alongside "GitHub", replacing the old "Contact Us" link

### 6.5 Accessibility requirements

- Chat container: `role="log"` with `aria-live="polite"`
- All interactive elements: visible focus indicators + keyboard operability
- Touch targets: minimum 44x44px
- Color never the sole status indicator - always combine with icons or text

### 6.6 UX anti-patterns to avoid

Based on user complaints across all platforms:
1. **Never auto-open** the chat widget - use subtle launcher with optional badge
2. **Always provide** explicit "Talk to a human" button
3. **Never lose** conversation history between sessions (IndexedDB solves this)
4. **Never hide** the encryption status - transparency builds trust, especially when offering two security tiers

---

## 7. Competitive analysis summary

### 7.1 Feature comparison

| Feature | Intercom | Crisp | Chatwoot | GoChat (SMP) | GoChat (GRP) |
|:--------|:---------|:------|:---------|:-------------|:-------------|
| E2E encrypted | No | No | No | **Yes** | **Yes** |
| Post-quantum | No | No | No | No | **Yes (ML-KEM-768)** |
| No account needed | No | Partial | No | **Yes** | **Yes** |
| Self-hosted | No | No | Yes | **Yes** | **Yes** |
| Open source | No | No | Yes (MIT) | **Yes (AGPL-3.0)** | **Yes (AGPL-3.0)** |
| Dark mode | Yes | Yes | Yes | **Yes** | **Yes** |
| Multi-hop routing | No | No | No | No | **Yes (two-hop)** |
| Cover traffic | No | No | No | No | **Yes (Poisson)** |
| File sharing | Yes | Yes | Yes | **Planned** | **Planned** |
| Mobile responsive | Yes | Yes | Yes | **Done** | **Planned** |
| Multi-agent | Yes | Yes | Yes | **Planned** | **Planned** |

### 7.2 Dual-profile positioning

The dual-profile architecture gives GoChat a unique market position that no competitor can replicate without fundamental re-architecture:

**SMP profile** competes with Chatwoot and open-source alternatives on features while adding E2E encryption as the key differentiator. The target audience is everyday businesses, communities, and personal use cases where "encrypted by default" is a selling point but the threat model does not include state-level adversaries.

**GRP profile** has no direct competitors in the browser space. Signal, Matrix, and Wire offer strong E2E encryption but none provide post-quantum transport, mandatory multi-hop routing, or cover traffic in their web clients. The closest comparison would be using Tor Browser with a messaging app - but that requires a separate application and does not integrate into a website.

The combination of both profiles in a single chat interface - selectable per connection - is unprecedented. A shop owner uses SMP for customer support. A journalist on the same website switches to GRP when contacting a source. Same UI, same codebase, fundamentally different security properties.

### 7.3 Encrypted messenger comparison (beyond support chat)

| Feature | Signal Web | Element Web | Wire Web | GoChat (SMP) | GoChat (GRP) |
|:--------|:-----------|:------------|:---------|:-------------|:-------------|
| Browser-native protocol | No (bridge) | Yes (Matrix) | Yes (Proteus/MLS) | **Yes (SMP)** | **Yes (GRP)** |
| Post-quantum transport | No | No | No | No | **Yes** |
| No app install | No | Yes | Yes | **Yes** | **Yes** |
| Embeddable widget | No | No | No | **Yes** | **Yes** |
| Noise transport | No | No | No | No | **Yes** |
| Cover traffic | No | No | No | No | **Yes** |
| Two-hop routing | No | No | No | No | **Yes** |
| Hardware endpoint | No | No | No | No | **Yes (SimpleGo)** |

---

## 8. Impact on GoChat season plan

### New tasks identified from research

- **WS-4:** SharedWorker for WebSocket connection pool management (both profiles)
- **SEC-1:** Content Security Policy implementation (strict, no eval)
- **SEC-2:** Subresource Integrity for all external scripts
- **SEC-3:** Web Worker isolation for crypto operations
- **SEC-4:** Security documentation - transparent trust boundary communication
- **SEC-5:** TLS certificate strategy (Let's Encrypt + SMP fingerprint at app layer) - RESOLVED in Season 5
- **UI-6:** Intercom-level animation system (panel, messages, typing, launcher)
- **UI-7:** Encryption indicator design and placement (with profile-aware display)
- **UI-8:** Accessibility audit (WCAG 2.1 AA compliance)

### Key architectural decisions

- **Dual-profile architecture:** SMP for everyday use, GRP for high-security. Both profiles share the same chat UI and the same ChatTransport interface abstraction. This is the single most important architectural decision in Season 1.
- **Crypto library:** Use @noble/curves + @noble/ciphers + @noble/hashes for both profiles. The @noble family covers SMP needs (X25519, NaCl) and GRP needs (ChaCha20-Poly1305, BLAKE2s) from a single audited source.
- **Post-quantum:** Defer ML-KEM-768 browser implementation to GRP development (Season 10+). No mature, audited JS implementation exists yet. Evaluate @noble/post-quantum vs WASM when the time comes.
- **Design ambition:** Target Intercom-level polish, not "functional minimum". The encryption badge is the brand.
- **WebSocket architecture:** SharedWorker layer for tab persistence, managing connections to both SMP and GoRelay servers.
- **ChatTransport interface from day one:** All transport code goes through the abstract interface. This ensures GRP can be added later without touching application-level code.
- **GRP as extension, not replacement:** GoChat does not replace SimpleX. It fills the browser gap. The GRP profile extends the SimpleX ecosystem for high-security environments via GoRelay's dual-protocol bridge.
- **X448 for Ratchet, X25519 for NaCl:** Verified via SimpleGo team. Two different elliptic curves for two different encryption layers. This is non-negotiable - the SimpleX app expects X448 for ratchet parameters.
- **Agent envelope format:** Confirmed by SimpleGo team from actual packet captures: agentVersion=7, 'C' confirmation tag, e2e version v3-v3 with X448 SPKI keys (68 bytes each, OID 1.3.101.111).
- **Zstd always required:** Even the first connection request uses zstd compression for connInfo. Verified by SimpleGo team.
- **Nginx WSS proxy for browser TLS:** Resolved in Season 5. Standalone Nginx process with Let's Encrypt cert terminates browser TLS, forwards to SMP server's internal WebSocket port. Self-signed SMP cert accepted by Nginx with verify off.
- **SMP v6 wire format:** Fully documented in Season 5 through 15 protocol fixes. SessionId asymmetry, batch framing, Ed25519 signing with sessionId in signed data - all verified against real server.
- **AgentInvitation for joining party:** Confirmed from Haskell source (Season 6). The joining party sends AgentInvitation ('I' + PHEmpty '_' + connReq URI), NOT AgentConfirmation ('C' + PHConfirmation 'K'). This is non-negotiable - sending the wrong type causes A_MESSAGE.
- **nacl.box() for NaCl encryption:** Use tweetnacl's nacl.box() instead of composing DH + xsalsa20poly1305 manually. The HSalsa20 key derivation step is essential and easy to miss with manual composition.
- **connReq URI for queue info:** The joining party's queue information goes into a URI string (simplex:/invitation#/?...) inside the AgentInvitation, not into a binary SMPQueueInfo structure. The URI contains smp= (queue address with dh= and q=m) and e2e= (x3dh= with two X448 keys).

### Modified decisions from initial planning

- **Crypto library:** Use @noble/curves + @noble/ciphers instead of direct Web Crypto API
- **Post-quantum (SMP):** sntrup761 deferred - no mature JS implementation. GRP uses ML-KEM-768 instead (NIST FIPS 203, Go stdlib available server-side).
- **Design ambition:** Target Intercom-level polish, not "functional minimum"
- **WebSocket architecture:** Add SharedWorker layer for tab persistence
- **Transport abstraction:** ChatTransport interface mandatory from the first line of transport code
- **TLS strategy:** Nginx reverse proxy with LE cert (Season 5) instead of configuring SMP server with LE directly
- **Season scope:** Season 5 shifted from E2E hardening to real-server connectivity (correct decision - exposed 15 bugs mocks could not catch)

---

## 9. References

| Topic | Source |
|:------|:-------|
| SMP Protocol Specification | simplex-chat/simplexmq protocol/simplex-messaging.md |
| SMP Server Hosting Guide | simplex.chat/docs/server.html |
| Noble Cryptography | paulmillr.com/noble/ |
| Ed25519 in Chrome | blogs.igalia.com (February 2025, August 2025) |
| Matrix Nebuchadnezzar Vulns | nebuchadnezzar-megolm.github.io |
| Element R (Rust->WASM crypto) | element.io/blog/meet-element-r |
| Wire core-crypto | github.com/wireapp/core-crypto |
| Browser E2E Encryption Overview | thomasbandt.com/browser-based-end-to-end-encryption-overview |
| OWASP WebSocket Security | cheatsheetseries.owasp.org |
| WebSocket Reconnection Guide | websocket.org/guides/reconnection/ |
| Chatwoot | github.com/chatwoot/chatwoot |
| Chat UI Design Patterns 2025 | bricxlabs.com/blogs/message-screen-ui-design |
| CSS Chat Box Templates | wpdean.com/css-chat-box/ |
| W3C ARIA role=log | w3.org/WAI/WCAG21/Techniques/aria/ARIA23 |
| Noise Protocol Framework | noiseprotocol.org |
| NIST FIPS 203 (ML-KEM) | csrc.nist.gov/pubs/fips/203/final |
| WireGuard Noise Implementation | wireguard.com/protocol/ |
| GoRelay Architecture | docs/ARCHITECTURE_AND_SECURITY.md (internal) |
| GoRelay Noise vs TLS Research | docs/research/03-noise-vs-tls.md (internal) |
| GoRelay PQ Landscape Research | docs/research/04-post-quantum-landscape.md (internal) |
| GoRelay Cover Traffic Research | docs/research/05-cover-traffic.md (internal) |
| GoRelay Two-Hop Routing Research | docs/research/06-dual-relay-routing.md (internal) |
| GoRelay Triple Shield Research | docs/research/12-triple-shield.md (internal) |
| SimpleGo Protocol Analysis | github.com/saschadaemgen/SimpleGo docs/protocol-analysis/ (49 sessions) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Initial research document. Comprehensive analysis of browser crypto, security, design, and competitive landscape. |
| 2026-03-25 | Dual-profile update. Added GRP security context throughout, expanded competitive analysis with dual-profile positioning, added post-quantum browser crypto section, referenced GoRelay research documents, updated architectural decisions with ChatTransport interface and dual-profile as key Season 1 decision. |
| 2026-03-25 | Season 4 crypto verification. Added Section 2.6 documenting all crypto algorithms confirmed by SimpleGo team. X448 mandatory for ratchet, X25519 for NaCl Layer 1 only. Added X3DH variant details and agent confirmation format. Updated architectural decisions with three new verified findings. |
| 2026-03-26 | Season 5 real-server findings. Added Section 2.7 (Ed25519 signing for SMP v6). Added Section 4.4 (WebSocket proxy architecture). Added Section 5 (SMP v6 protocol findings - batch framing, sessionId asymmetry, command authentication, length encoding, error progression). Updated Section 3.3 with implemented TLS solution (Nginx WSS proxy). Updated Section 6.1 design specs with implemented panel design (left-docked). Added Section 6.4 (chat panel implementation). Updated competitive analysis (mobile responsive: Done). Updated architectural decisions with Nginx proxy and v6 wire format findings. Added SimpleGo Protocol Analysis to references. |
| 2026-03-28 | Season 6 findings. Added Section 2.8 (NaCl crypto_box architecture - HSalsa20 key derivation). Added Section 2.9 (AgentInvitation vs AgentConfirmation discovery). Added tweetnacl to algorithm table. Added three new architectural decisions. |
