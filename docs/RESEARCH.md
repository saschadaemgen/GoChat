<p align="center">
  <img src="../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<h1 align="center">GoChat - Research Findings</h1>

<p align="center">
  <strong>Deep research on browser-native encrypted messaging, design patterns, and security.</strong><br>
  Dual-profile architecture: SMP for everyday use, GRP for high-security environments.<br>
  Conducted during Season 1 planning phase, updated with Season 5, 6, and 7 findings.
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

For GoChat's SMP profile: Pure TypeScript with noble libraries is simpler to ship. For the GRP profile: a WASM-compiled ML-KEM-768 implementation may be necessary because post-quantum algorithms are computationally heavier and more sensitive to side-channel attacks than classical algorithms. This decision will be revisited when the GRP profile enters active development (Season 12+).

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
| Ed25519 | SMP command authorization (signing, v6) | @noble/curves/ed25519 |
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

The `[0x20]` byte (length prefix for the 32-byte sessionId) MUST be included in the signed data. This cost the SimpleGo team an entire day to discover.

The @noble/curves ed25519 library accepts the 32-byte private key (seed) directly and expands it internally, which is compatible with libsodium's `crypto_sign_detached()` behavior.

### 2.8 NaCl crypto_box architecture (Season 6)

Season 6 real-server testing revealed a critical distinction between `nacl.box()` (tweetnacl) and raw `xsalsa20poly1305` (@noble/ciphers):

```
nacl.box(plaintext, nonce, peerPublicKey, ourPrivateKey):
  1. DH: shared_secret = X25519(ourPrivateKey, peerPublicKey)      // 32 bytes
  2. HSalsa20: symmetric_key = HSalsa20(shared_secret, zeros[16])  // 32 bytes
  3. XSalsa20-Poly1305: ciphertext = encrypt(symmetric_key, nonce, plaintext)
```

Using `@noble/ciphers` xsalsa20poly1305 directly with the raw DH shared secret skips step 2 (HSalsa20 key derivation), producing ciphertext that the peer cannot decrypt (A_CRYPTO error).

The HSalsa20 step exists because the raw DH output has non-uniform distribution. HSalsa20 acts as a key derivation function, producing a uniformly distributed symmetric key. This is part of Daniel Bernstein's original NaCl design.

For GoChat, the fix was simple: use `nacl.box()` from tweetnacl instead of manually composing the cipher.

### 2.9 AgentInvitation discovery (Season 6)

Season 6 discovered that the SimpleX protocol uses two distinct agent message types for connection establishment, with completely different wire formats:

| Property | AgentConfirmation (owner) | AgentInvitation (joiner) |
|:---------|:--------------------------|:-------------------------|
| PrivHeader | 'K' + 44B Ed25519 SPKI | '_' (PHEmpty, 1 byte) |
| Tag | 'C' (0x43) | 'I' (0x49) |
| E2E params | Inline (X448 SPKI keys) | In connReq URI (x3dh= param) |
| Queue info | Binary SMPQueueInfo | URI string in connReq |
| connInfo | Ratchet-encrypted encConnInfo | Plaintext Tail bytes |
| Encryption | Per-queue E2E + Ratchet | Per-queue E2E only |

The contact address owner sends AgentConfirmation (as implemented by SimpleGo in Session 8). The joining party sends AgentInvitation (as discovered by GoChat in Season 6).

This distinction was not documented anywhere outside the Haskell source code. The definitive answer came from reading Agent/Client.hs:1654-1664 and Protocol.hs:800-801.

**Key implication for Season 8:** When the app accepts and responds, it sends an AgentConfirmation back. This IS Ratchet-encrypted and contains X448 keys for X3DH.

**Key implication for SimpleGo:** The SimpleGo team now has the complete joining-party protocol specification, enabling them to implement contact link scanning on the ESP32-S3.

### 2.10 ALPN and protocol version negotiation (Season 7)

Season 7 discovered that the SMP server uses TLS ALPN (Application-Layer Protocol Negotiation) to determine which protocol version range to advertise in the ServerHello handshake. This has critical implications for browser-based clients.

**The Haskell code (Transport.hs:755):**

```haskell
smpVersionRange = maybe legacyServerSMPRelayVRange (const smpVRange) $ getSessionALPN c
```

**Translation:**
- `getSessionALPN = Nothing` (no ALPN negotiated) -> v6-v6 only (legacy mode)
- `getSessionALPN = Just _` (any ALPN negotiated) -> v6-v18 (full range)

**The browser ALPN problem:**
Native SimpleX clients send ALPN "smp/1" in the TLS ClientHello. The server recognizes this and offers the full protocol range. Browser WebSocket connections cannot set custom ALPN values - they always send "h2" or "http/1.1". On servers without PR #1738, the server sees no recognized ALPN and falls back to legacy v6-v6 mode.

**The PR #1738 fix:**
Evgeny's PR #1738 ("smp: allow websocket connections on the same port") extends the server's ALPN list to `["smp/1", "h2", "http/1.1"]`. When a browser connects and proposes "h2", the server matches it. Since `getSessionALPN` returns `Just "h2"` (not `Nothing`), the full v6-v18 range is advertised.

| Connection type | ALPN result | Version range |
|:----------------|:------------|:--------------|
| Native TLS client (sends "smp/1") | `Just "smp/1"` | v6-v18 |
| Browser WebSocket (legacy server) | `Nothing` | v6-v6 |
| Browser WebSocket (PR #1738 server) | `Just "h2"` | v6-v18 |

**Verification:** After deploying the PR #1738 server build, the browser console showed `ServerHello decoded, version=6-18` - confirming the fix works.

**Why this matters:** Without the full protocol range, sndSecure (v9+) cannot be enabled in the NEW command. Without sndSecure, the CLI's SKEY command fails with AUTH. Without SKEY, the CLI never sends the AgentConfirmation. The ALPN fix is a prerequisite for the entire connection handshake to complete.

### 2.11 SMP command authorization: v6 vs v7+ (Season 7)

Season 7 discovered that SMP protocol versions 6 and 7+ use fundamentally different command authorization schemes. This was revealed when the browser negotiated v7 (after the ALPN fix enabled v6-18) and the server rejected NEW with AUTH.

**v6 authorization (Ed25519 signatures):**
```
[sigLen=0x40][64B Ed25519 signature][sessIdLen=0x20][sessionId 32B][corrId][entityId][command]
signedData = [0x20][sessionId] + [corrId] + [entityId] + [command]
```

**v7+ authorization (X25519 DH crypto_box):**
```
ClientHello includes: authPubKey (X25519 SPKI)
Commands authorized via crypto_box instead of Ed25519 signatures
```

The transition is defined in PR #982 "smp: command authorization". Key changes:
- ClientHello adds `authPubKey` (X25519), `proxyServer`, `clientService` fields
- Commands use DH-based authorization instead of signature-based
- The server DH key from ServerHello is used as the peer key

**Impact on GoChat:** To negotiate v9+ (needed for sndSecure), GoChat must first implement v7+ command authorization. This is the primary task for Season 8. The current code caps maxSMPClientVersion to 6 as a temporary workaround.

**SPKI format for v7+ auth key:**
- X25519 (OID `2b 65 6e`): `30 2a 30 05 06 03 2b 65 6e 03 21 00 [32B key]` = 44 bytes
- Same format as the DH key in the NEW command, but used for authorization, not queue encryption

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

### 3.3 TLS certificate challenge (resolved in Seasons 5 and 7)

SMP servers use self-signed certificate chains where the offline CA certificate hash is embedded in the server address (`smp://fingerprint@host`). Browsers reject WSS connections to servers with untrusted certificates.

**Season 5 solution:** A standalone Nginx reverse proxy terminates TLS with a trusted Let's Encrypt certificate and forwards WebSocket connections to the SMP server's internal WebSocket port.

```
Browser --WSS (LE cert)--> Nginx :8444 --WSS (self-signed)--> SMP :5225
```

**Season 7 evolution:** PR #1738 enables the SMP server to handle HTTPS and WebSocket directly on port 443 via warp-tls + SNI detection. Nginx was eliminated entirely. Docker maps container port 443 to host port 8444. The server uses a 4096-bit RSA Let's Encrypt certificate for the HTTPS handler (separate from the self-signed SMP certificate on port 5223).

```
Browser --WSS (LE cert)--> Docker :8444 -> SMP :443 (warp-tls, handles TLS + WS + HTTP)
```

**Key requirement discovered in Season 7:** PR #1738's HTTPS handler requires 4096-bit RSA certificates. 2048-bit RSA is rejected with "unsupported HTTPS credentials". The Let's Encrypt certificate must be generated with `--rsa-key-size 4096`.

The SMP server fingerprint from the contact address is used for application-layer identity verification (keyHash in ClientHello), not for TLS certificate validation. This means the browser trusts the Let's Encrypt certificate for transport, while the SMP protocol's own fingerprint check verifies the server identity independently of the CA chain.

For the GRP profile, this challenge does not apply in the same way. Noise Protocol uses the server's 32-byte Curve25519 public key as identity - no certificates, no CA chain, no expiry. The key IS the fingerprint.

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

### 4.4 WebSocket proxy architecture evolution (Seasons 5 and 7)

**Season 5 architecture (Nginx proxy):**

Real-world deployment revealed that browsers cannot connect directly to SMP servers with self-signed certificates. A reverse proxy was deployed:

```
Browser --> WSS :8444 (Nginx, LE cert) --> HTTPS :5225 (SMP server, self-signed)
```

**Critical proxy settings for SMP binary protocol:**
- `proxy_buffering off` - SMP uses fixed 16KB blocks; buffering breaks framing
- `proxy_request_buffering off` - commands must flow through immediately
- `tcp_nodelay on` - no Nagle algorithm delay for small packets
- `proxy_max_temp_file_size 0` - never write to disk
- `proxy_read_timeout 86400` - keep long-lived connections alive (24h)
- `proxy_ssl_verify off` - accept SMP server's self-signed cert
- `proxy_ssl_conf_command Options UnsafeLegacyRenegotiation` - SMP server uses older TLS

**Season 7 architecture (Nginx eliminated):**

PR #1738 enables the SMP server to handle HTTPS, WebSocket, and static file serving on port 443 via warp-tls with SNI-based routing. Nginx is no longer needed:

```
Browser --> WSS :8444 (Docker maps to container :443) --> SMP server (warp-tls, handles everything)
```

This architecture is simpler, eliminates the ALPN stripping problem (Nginx could not forward ALPN to the backend), and reduces the number of TLS handshakes from two (browser-to-Nginx + Nginx-to-SMP) to one (browser-to-SMP).

**ALPN limitation of the Nginx approach:** Nginx HTTP module has no directive to set ALPN on backend TLS connections. `proxy_ssl_alpn` does not exist. `proxy_ssl_conf_command ALPNProtocols` is not a valid OpenSSL conf command. The stream module has ALPN support but cannot handle WebSocket upgrade (HTTP-level operation). This limitation was the primary reason Nginx was eliminated in favor of direct Docker port mapping.

---

## 5. SMP v6 protocol findings (Season 5)

Season 5's 15 protocol fixes against a real SMP v6.4.5.1 server produced a comprehensive understanding of the v6 wire format that was not previously documented anywhere outside the Haskell source code. The SimpleGo protocol analysis team (49 sessions, 81 bugs, 270 lessons) provided critical knowledge at several turning points.

### 5.1 SMP v6 vs v7 - key differences for browser clients

| Aspect | v6 (implySessId=false) | v7+ (implySessId=true) |
|:-------|:----------------------|:----------------------|
| SessionId in outgoing commands | Present (after signature) | Not present |
| SessionId in incoming responses | Present (must skip when parsing) | Not present |
| SessionId in signed data | Included with 0x20 length prefix | Included differently |
| Command authorization | Ed25519 signatures | X25519 DH crypto_box |
| NEW command | `"NEW " + authKey + dhKey + "S"` | May include basicAuth, sndSecure |
| sndSecure in NEW | Not supported (CMD SYNTAX) | Supported at v9+ ("S T") |

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

This asymmetry exists because the SMP server computes sessionId from TLS channel binding (`tls-unique` per RFC 5929). Over WebSocket through a proxy, the TLS session between Nginx and the SMP server provides the sessionId.

**Note (Season 7):** With the PR #1738 architecture (no Nginx, browser connects directly to SMP server via warp-tls), the sessionId is 48 bytes instead of 32 bytes. The server also sends certificate chain and signed DH key in the ServerHello, which were absent in the legacy WebSocket-via-proxy mode.

### 5.4 SMP command authentication

Every signed SMP command (NEW, SUB, KEY, ACK, DEL) carries its authentication in the wire format:

```
[sigLen 1B] [signature sigLen bytes] [sessIdLen 1B] [sessionId] [corrIdLen 1B] [corrId] [entityIdLen 1B] [entityId] [command]
```

For unsigned commands: `sigLen = 0x00`, no signature bytes follow.
For v6 signed commands: `sigLen = 0x40` (64 bytes Ed25519 signature).
For v7+ signed commands: Different authorization scheme (X25519 DH crypto_box).

### 5.5 Length encoding conventions

From the SimpleGo protocol analysis (Session 4, the #1 bug class with 8 occurrences):

- **ShortString (1-byte length):** Used for keys, sessionId, corrId, entityId within transmissions
- **Large (2-byte Word16 BE):** Used for ByteString fields in agent-level messages
- **Word16 BE:** Used for version numbers, content lengths in block framing

### 5.6 Error progression pattern

Real-server debugging follows a predictable progression:

```
Network errors      -> Fix proxy/TLS/ports
Decode errors       -> Fix wire format parsing
ERR SESSION         -> Fix sessionId handling
ERR CMD SYNTAX      -> Fix command body format
ERR CMD NO_AUTH     -> Fix signature presence
ERR AUTH            -> Fix signed data content / authorization scheme
IDS / OK            -> Command accepted!
```

This pattern held exactly during Season 5's 15 fixes, Season 6's 12 fixes, and Season 7's v7 AUTH investigation.

---

## 6. SKEY, sndSecure, and Fast Duplex (Season 7)

Season 7 investigated why the SimpleX CLI (v6.4.10) gets AUTH when accepting a GoChat invitation. The root cause chain spans three protocol layers.

### 6.1 SKEY and Fast Duplex (v9+)

Modern SimpleX clients (v6.4+) use Fast Duplex for connection establishment. When accepting a contact request, the CLI sends SKEY (sender key registration) BEFORE SEND (AgentConfirmation):

```
Step 1: CLI connects to GoChat's queue server (TLS handshake)
Step 2: CLI sends SKEY on GoChat's queue (register sender auth key)
Step 3: CLI sends SEND with AgentConfirmation (profile + reply queue)
```

If SKEY fails (AUTH), the CLI aborts immediately. The AgentConfirmation is never sent. This means the KEY command (v6 recipient-side alternative) cannot be used as a workaround because the CLI never gets far enough to send its sender key.

SKEY is a v9+ command. It requires the queue to be created with sndSecure enabled.

### 6.2 sndSecure in NEW command

sndSecure is enabled by adding " T" (space + T) after the subscribeMode in the NEW command:

```
Without sndSecure (v6):    "NEW " [authKey] [dhKey] "S"        (95 bytes)
With sndSecure (v9+):      "NEW " [authKey] [dhKey] "S T"      (97 bytes)
```

The space between "S" and "T" is critical. Without the space, the server reads "ST" as an unknown command. This was confirmed by the SimpleGo Protocol Team from the ABNF:

```
newCmd = "NEW " rcvPublicAuthKey rcvPublicDhKey [basicAuth] subscribeMode [sndSecure]
subscribeMode = "S" / "C"
sndSecure = " T"          <- note the leading space!
```

Additionally, the connReq URI must include `&k=s` to signal that the queue accepts SKEY.

### 6.3 Why sndSecure fails on v6

Even though the server binary internally supports v18, the negotiated protocol version determines which command parser is used. Negotiating v6 means the v6 parser runs, which has no sndSecure code. This was confirmed by three separate attempts (PRs #47, #49, #50), all producing CMD SYNTAX.

To use sndSecure, the client must negotiate v9+. To negotiate v9+, the client must implement v7+ command authorization (X25519 DH instead of Ed25519 signatures).

---

## 7. Design specifications

### 7.1 Premium design targets

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

### 7.2 Animation patterns

- **Message appear:** fade + translateY(10px->0) at 200ms ease-out
- **Panel open:** slideInLeft with 300ms ease
- **Panel close:** slideOutLeft with 300ms ease
- **Typing indicator:** Three 8px dots with staggered animation-delay, scale(0.6)->scale(1) at 1.4s
- **All animations must respect** `prefers-reduced-motion`

### 7.3 The encryption indicator

GoChat's unique visual differentiator: A persistent lock icon with "End-to-end encrypted" badge, always visible. This is not just a feature - it is the brand. No competitor can match this.

The encryption badge uses a shimmer animation matching the player cover art effect on the SimpleGo website, creating visual consistency across the design system.

### 7.4 Chat panel implementation (Season 5)

The chat panel was implemented in Season 5 with the following architecture:

- **CSS:** All classes prefixed with `gc-` to avoid conflicts with the existing SimpleGo design system
- **JS:** Panel logic with mock/real mode detection
- **HTML:** Placed outside `#page-content` in the base template so the chat panel persists across SPA page navigation
- **Integration:** "Chat" tab in the util-bar alongside "GitHub"

### 7.5 Accessibility requirements

- Chat container: `role="log"` with `aria-live="polite"`
- All interactive elements: visible focus indicators + keyboard operability
- Touch targets: minimum 44x44px
- Color never the sole status indicator - always combine with icons or text

---

## 8. Competitive analysis summary

### 8.1 Feature comparison

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

### 8.2 Encrypted messenger comparison

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

## 9. Key architectural decisions

### From Season 1 (planning)
- **Dual-profile architecture:** SMP for everyday use, GRP for high-security
- **Crypto library:** @noble/curves + @noble/ciphers + @noble/hashes for both profiles
- **ChatTransport interface from day one**
- **Design ambition:** Target Intercom-level polish, not "functional minimum"
- **GoChat extends SimpleX, does not replace it**

### From Season 4 (verified by SimpleGo team)
- **X448 for Ratchet, X25519 for NaCl:** Two different curves for two different layers
- **Agent envelope format:** agentVersion=7, 'C' tag, e2e v3-v3 with X448 SPKI keys
- **Zstd always required:** Even the first connection request uses zstd for connInfo

### From Season 5 (real server)
- **Nginx WSS proxy for browser TLS:** Standalone Nginx with LE cert (later eliminated in S7)
- **SMP v6 wire format:** SessionId asymmetry, batch framing, Ed25519 signing

### From Season 6 (connection request)
- **AgentInvitation for joining party:** Tag 'I' + PHEmpty '_' + connReq URI
- **nacl.box() for NaCl encryption:** Use tweetnacl, not manual DH + xsalsa20poly1305
- **connReq URI for queue info:** URI string, not binary SMPQueueInfo

### From Season 7 (server upgrade)
- **PR #1738 server build:** Required for browser WebSocket to get v6-18 protocol range
- **Nginx eliminated:** Docker direct port mapping (8444->443), SMP server handles TLS+WS+HTTP
- **4096-bit RSA required:** PR #1738's HTTPS handler rejects 2048-bit RSA
- **maxSMPClientVersion capped at 6:** Temporary workaround until v7+ auth is implemented
- **v7+ auth before sndSecure:** Must implement X25519 DH authorization to negotiate v9+ for sndSecure
- **SKEY before SEND:** CLI sends SKEY first, aborts if it fails - no workaround via KEY

### From Season 8 (v9 command auth)
- **nacl.box for all crypto_box:** Haskell's cryptoBox includes HSalsa20 internally. JavaScript MUST use nacl.box (DH + HSalsa20 + XSalsa20-Poly1305), NEVER nacl.secretbox (raw key, no DH/HSalsa20).
- **ASCII encoding for Maybe/Bool:** SMP Maybe Nothing = ASCII '0' (0x30), not binary 0x00. Bool True = ASCII 'T' (0x54). These are Haskell Encoding.hs conventions.
- **SystemTime = 12 bytes:** Int64 seconds (8B) + Word32 nanoseconds (4B) = 12 bytes total. NOT 8 bytes.
- **Preserve queueDhKeyPair:** The X25519 keypair from buildInvitation whose public key goes into connReq URI dh=. The private key is needed later for Layer 1 NaCl decryption of peer's response.
- **Four DH keypairs per connection:** recipientAuth (CbAuth), recipientDh (server MSG encryption), queueDh (peer Layer 1 encryption), e2eDh (future X3DH). Confusing any two causes decryption failure.
- **Clean server (Debian 13):** Plesk caused port conflicts and cert issues. Clean Debian with manual Nginx + Certbot + Docker is more reliable and debuggable.

### From Season 9 (X3DH + Double Ratchet + CON)
- **PQ KEM in AgentConfirmation:** CLI sends SNTRUP761 Proposed (1158 bytes public key) with Word16 BE length prefix. MsgHeader also contains KEM Proposed that must be skipped before PN/Ns fields. Using 1-byte or 0xFF+Word16 variable encoding reads only 4 bytes of the 1158-byte key.
- **AES-256-GCM 16-byte IV:** SimpleX Double Ratchet uses 16-byte IVs (not standard 12-byte). Haskell's initAEAD transforms via GHASH. @noble/ciphers handles this correctly.
- **chainKdf output order:** Correct order is [newCK, mk, bodyIV, headerIV]. SimpleGo CRYPTO.md has mk and newCK swapped - this was the most dangerous trap in Season 9.
- **AgentVersion difference:** AgentConfirmation uses agentVersion=7. AgentMsgEnvelope for HELLO/messages uses agentVersion=1. Using 7 for messages causes A_VERSION (SimpleGo Bug #21).
- **Handshake response format:** Must use tag 'C' (AgentConfirmation, not 'M' AgentMsgEnvelope), PHConfirmation 'K' with sender auth key (not PHEmpty '_'), e2eEncryption_=Nothing ('0'), and smpClientVersion in ClientMsgEnvelope PubHeader (omitting it causes A_VERSION).
- **First message to queue pads to 15904:** Haskell e2eEncConfirmationLength. Only subsequent messages (e2ePubKey=Nothing) use 15840.
- **Encoding rules confirmed:** SPKI keys use 1-byte length prefix. KEM keys use Word16 BE length prefix. prevMsgHash uses 1-byte length prefix (not Word16 BE). APrivHeader has sndMsgId (Int64 8B) before prevMsgHash.

### From Season 10 (bidirectional chat + UX)
- **Pure API widget:** gochat-client.js must NEVER create DOM elements. connect(displayName?) accepts name directly. All UI in chat.js.
- **Status from state machine only:** "connected" fires only after HELLO, not after invitation send. "pending" for intermediate states.
- **Event parsing in widget:** handleChatPayload() filters x.msg.new (display), x.direct.del (connection ended), unknown (silent log).
- **Desktop App replaces CLI:** Support agent uses SimpleX Desktop App. Contact address created in Desktop App settings.
- **Admin via .env (now) and GoBot (future):** No runtime admin panel. Config at build time via .env, future runtime config via SimpleX bot commands.

### 2.12 Widget architecture: API-only pattern (Season 10)

Season 10 discovered a critical architectural requirement: the GoChat widget (gochat-client.js) must be a pure API library with zero DOM manipulation. The widget's showNameInput() method used container.innerHTML="" to inject its own name input UI, which destroyed the external multi-step flow built in chat.js and base.njk.

The correct pattern: gochat-client.js exports connect(displayName?), send(text), disconnect(), and status callbacks. All UI rendering lives in the website's own chat.js. This separation ensures the website owner controls their own UI completely, avoids CSS conflicts, prevents DOM race conditions, and allows the widget to be embedded in any framework.

Additionally, setStatus("connected") was firing immediately after invitation send, skipping the waiting screen. The fix: "connected" only fires from the state machine after HELLO is received. JSON event handling (x.msg.new, x.direct.del) must happen inside the widget via handleChatPayload(), filtering unknown events before they reach the UI callback.

---

## 10. References

| Topic | Source |
|:------|:-------|
| SMP Protocol Specification | simplex-chat/simplexmq protocol/simplex-messaging.md |
| SMP Server Hosting Guide | simplex.chat/docs/server.html |
| PR #1738 (WebSocket on same port) | github.com/simplex-chat/simplexmq/pull/1738 |
| PR #982 (v7+ command authorization) | github.com/simplex-chat/simplexmq/pull/982 |
| Noble Cryptography | paulmillr.com/noble/ |
| Ed25519 in Chrome | blogs.igalia.com (February 2025, August 2025) |
| Matrix Nebuchadnezzar Vulns | nebuchadnezzar-megolm.github.io |
| Element R (Rust->WASM crypto) | element.io/blog/meet-element-r |
| Wire core-crypto | github.com/wireapp/core-crypto |
| Browser E2E Encryption Overview | thomasbandt.com/browser-based-end-to-end-encryption-overview |
| OWASP WebSocket Security | cheatsheetseries.owasp.org |
| Chatwoot | github.com/chatwoot/chatwoot |
| Noise Protocol Framework | noiseprotocol.org |
| NIST FIPS 203 (ML-KEM) | csrc.nist.gov/pubs/fips/203/final |
| GoRelay Architecture | docs/ARCHITECTURE_AND_SECURITY.md (internal) |
| SimpleGo Protocol Analysis | github.com/saschadaemgen/SimpleGo (49 sessions) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Initial research document. Comprehensive analysis of browser crypto, security, design, and competitive landscape. |
| 2026-03-25 | Dual-profile update. Added GRP security context throughout, expanded competitive analysis. |
| 2026-03-25 | Season 4 crypto verification. Added Section 2.6 documenting all crypto algorithms. |
| 2026-03-26 | Season 5 real-server findings. Added Section 2.7, 4.4, 5. Updated Section 3.3 with Nginx TLS solution. |
| 2026-03-28 | Season 6 findings. Added Section 2.8 (NaCl crypto_box) and 2.9 (AgentInvitation). |
| 2026-03-28 | Season 7 findings. Added Section 2.10 (ALPN and protocol version negotiation), Section 2.11 (v6 vs v7+ command authorization), Section 6 (SKEY, sndSecure, Fast Duplex). Updated Section 3.3 (TLS cert challenge resolved with PR #1738, Nginx eliminated). Updated Section 4.4 (WebSocket proxy architecture evolution). Updated Section 5.1 (v7+ auth differences). Added Season 7 architectural decisions. Added PR #1738 and PR #982 to references. |
| 2026-03-30 | Season 8 findings. Added Season 8 architectural decisions: nacl.box for all crypto_box (HSalsa20 discovery), ASCII encoding for Maybe/Bool, SystemTime = 12 bytes, preserve queueDhKeyPair, four DH keypairs per connection, clean server (Debian 13). |
| 2026-03-31 | Season 9 findings. PQ KEM Word16 BE length prefix, AES-256-GCM 16-byte IV, chainKdf output order trap (CRYPTO.md wrong), agentVersion 7 vs 1, handshake response format (tag 'C', PHConfirmation 'K', e2eEncryption_=Nothing), first-message pad 15904. |
| 2026-04-01 | Season 10 findings. Added Section 2.12 (widget API-only pattern, DOM injection trap, status from state machine, event handling). Added Season 10 architectural decisions. |
