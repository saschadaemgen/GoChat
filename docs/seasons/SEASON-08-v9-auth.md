# Season 8 Closing Protocol
# v9 Command Authorization, Server Rebuild, MSG Processing, Layer 1 Decryption

**Date:** 2026-03-28 to 2026-03-30 (3 days)
**Status:** COMPLETE - v9 CbAuthenticator working, MSG decrypted, AgentConfirmation decrypted
**Branch:** `feat/simplego-support-chat`
**Tests:** 494 pass
**PRs merged:** #52, #53, #54, #55, #56, #57, #58, #59, #61, #62, #63, #64, #65

---

## Summary

Season 8 implemented SMP v9 command authorization (CbAuthenticator), resolved the critical AUTH error that blocked bidirectional messaging since Season 6, rebuilt the server infrastructure from scratch (Debian 13, no Plesk), and successfully decrypted the first real AgentConfirmation from the SimpleX CLI.

The season started with a clear root cause chain identified in Season 7: the browser negotiated v6, the CLI sent SKEY (v9+ Fast Duplex), and the server returned AUTH because the queue had no sndSecure. The fix required implementing v7+ command authorization using X25519 DH crypto_box (CbAuthenticator) instead of Ed25519 signatures.

The critical breakthrough was discovering that Haskell's `cryptoBox` includes an HSalsa20 key derivation step internally, meaning JavaScript must use `nacl.box` (which includes HSalsa20) instead of `nacl.secretbox` (which skips it). This is the same bug that was found and fixed in SimpleGo Session 34 ("crypto_box_beforenm vs crypto_scalarmult").

Season 8 ended with the browser receiving and decrypting the CLI's AgentConfirmation (14,777 bytes), containing Alice's X448 keys and e2eEncryption parameters. This is the gateway to X3DH key agreement and Double Ratchet initialization in Season 9.

---

## What Season 8 Accomplished

### v9 command authorization (CbAuthenticator)

The SMP protocol uses two different command authorization schemes depending on the negotiated version:

- **v6:** Ed25519 signatures (64 bytes)
- **v7+:** CbAuthenticator (80 bytes) - X25519 DH + HSalsa20 + XSalsa20-Poly1305

Season 8 implemented the v7+ CbAuthenticator path. This required:

1. Parsing the server's X25519 auth public key from the ServerHello certificate chain
2. Sending our session X25519 auth public key in the ClientHello
3. Computing the CbAuthenticator for each command:
   - X25519 DH between our queue auth private key and server auth public key
   - SHA-512 hash of the authorized data (sessionId + corrId + entityId + command)
   - NaCl crypto_box encryption of the hash using the DH secret and corrId as nonce
4. Placing the 80-byte authenticator in the transmission instead of a 64-byte signature

### Server infrastructure rebuilt from scratch

Plesk caused repeated port conflicts (Nginx and Apache fighting over port 80). After multiple failed attempts to fix Plesk, the decision was made to reinstall the server completely:

- **Before:** Debian 12 with Plesk (50+ packages, mail server, FTP, PHP, Apache, Nginx)
- **After:** Debian 13 clean install (Nginx + Docker + Certbot only)

The new server is minimal, clean, and under full control.

### MSG processing with server-to-recipient decryption

When the CLI accepts the connection and sends an AgentConfirmation, it arrives as a MSG push on the browser's queue. Season 8 implemented:

1. MSG detection (empty corrId = server push)
2. Server-to-recipient decryption using `nacl.box.open` with the server DH key and recipient DH private key
3. RcvMsgBody parsing (12-byte SystemTime + 1-byte MsgFlags + 1-byte space + body)
4. ACK with CbAuthenticator (v9)

### Layer 1 NaCl decryption of AgentConfirmation

The CLI's AgentConfirmation is wrapped in an smpEncConfirmation envelope (NaCl crypto_box). Season 8 decrypted this layer:

1. Parse the smpEncConfirmation (Maybe DH key tag, Alice's X25519 DH public key, nonce, encrypted body)
2. Decrypt with `nacl.box.open` using Alice's DH public key and our queue DH private key
3. Unpad the content (2-byte BE length prefix + data + '#' fill)
4. Parse the smpConfirmation (sender auth key tag + AgentConfirmation body)

Result: 14,777 bytes of decrypted AgentConfirmation starting with `00 07 43` (agentVersion 7, tag 'C' = Confirmation).

### Connection flow status after Season 8

```
Step 1: Browser NEW -> Queue created (IDS)                    DONE (Season 5)
Step 2: Browser SEND AgentInvitation to Contact Queue          DONE (Season 6)
Step 3: App/CLI receives MSG, shows Connection Request         DONE (Season 6)
Step 4: CLI accepts -> SKEY + AgentConfirmation                DONE (Season 8!)
Step 5: Browser receives MSG, decrypts Layer 1                 DONE (Season 8!)
Step 6: Parse AgentConfirmation, X3DH, Double Ratchet          Season 9
Step 7: HELLO exchange, CON state, real messages                Season 9
```

---

## The Journey: From CMD SYNTAX to Decrypted AgentConfirmation

### Day 1: Haskell Analysis and First CbAuth Implementation (2026-03-28 evening - 2026-03-29)

**Phase 1: Haskell source analysis**

Sascha provided `Transport.hs` and `Protocol.hs` from the simplexmq reference code (branch `pr-1738`). Later, `Crypto.hs` and `Client.hs` were also analyzed. Key findings:

From `Transport.hs`:
- ServerHello includes `authPubKey` field (X25519 SPKI in certificate chain)
- ClientHello v7+ adds `authPubKey`, `proxyServer`, `clientService` fields
- `THandleAuth` stores the server's auth private key for DH computation

From `Protocol.hs`:
- `TransmissionAuth` has two constructors: `TASignature` (v6) and `TAAuthenticator` (v7+)
- `encodeTransmission` selects auth type based on negotiated version
- `checkCredentials` validates by checking authenticator length (80B vs 64B)
- NEW v9 format includes Maybe BasicAuth + SubscriptionMode + senderCanSecure

From `Crypto.hs`:
- `CbAuthenticator` = `cbEncryptNoPad(dh'(k,pk), nonce, sha512Hash(msg))`
- `cryptoBox` = 16B Poly1305 tag + XSalsa20 encrypted data
- Internal XSalsa20 uses `HSalsa20(key, zeros16)` as first step

From `Client.hs`:
- `authTransmission` generates random 24-byte corrId (line 1351)
- corrId IS the NaCl nonce
- DH is computed between queue auth key and server auth key

**PR #52 (s8/001 + s8/002): ServerHello authPubKey + v9 CbAuthenticator**

First briefing combined two tasks into one PR:
- Parse ServerHello authPubKey from X.509 certificate chain (extract raw 32B X25519 key from SPKI DER)
- Implement CbAuthenticator: X25519 DH + SHA-512 hash + nacl.secretbox encryption
- Changed maxSMPClientVersion from 6 to 9
- NEW command format changed to 97 bytes: `"NEW " + [authKey] + [dhKey] + "0ST"`

Result: CMD SYNTAX from server. The Maybe BasicAuth encoding was wrong.

**PR #53 (s8/003): Fix Maybe BasicAuth - first attempt**

Changed from binary 0x00 to empty (removed the byte entirely). Still CMD SYNTAX. The actual encoding uses ASCII characters.

**PR #54 (s8/004): Fix Maybe BasicAuth - correct fix**

Changed to ASCII '0' (0x30) for Maybe Nothing. NEW command now 97 bytes as expected. Server no longer returned CMD SYNTAX but returned AUTH instead. The CbAuthenticator computation was wrong.

**PR #55 (s8/005): Debug logging**

Added comprehensive `[SMP-AUTH]` debug logging to trace every value in the CbAuthenticator computation: serverPubKeyRaw, queuePrivKeyRaw, rawDhSecret, tForAuth, SHA-512 hash, nonce/corrId, authenticator.

### Day 2: Diagnostic Tests, Server Rebuild, and The Critical Fix (2026-03-29)

**PR #56 (s8/006): v6 diagnostic fallback**

Temporarily reverted to v6 (Ed25519 signatures) while keeping v9 code intact. Purpose: isolate whether the problem was CbAuth-specific or something else in the v9 flow.

Result: **v6 worked perfectly.** IDS returned, SEND accepted, CLI received the invitation and accepted it, SKEY succeeded, AgentConfirmation was sent. This proved:
- Server infrastructure is correct
- Wire format is correct
- The problem is specifically in the CbAuthenticator computation

**Server infrastructure overhaul**

Plesk caused repeated port conflicts. Nginx couldn't start because Apache held port 80. Apache couldn't start because Nginx held port 80. After multiple failed repair attempts, Sascha ordered a complete server reinstall at IONOS.

Steps:
1. Backup: `tar czf server-backup-small.tar.gz simplego.dev/httpdocs/ simplex/` (12MB)
2. Download via `pscp` with PPK key to local PC
3. IONOS: "Image neu installieren" - Debian 13
4. Fresh install: `apt install nginx certbot python3-certbot-nginx docker.io curl git`
5. Upload and extract backup
6. Nginx config for simplego.dev + smp.simplego.dev
7. Certbot Let's Encrypt: `certbot --nginx -d simplego.dev -d www.simplego.dev -d smp.simplego.dev`
8. Docker SMP server build from PR #1738

**Critical mistake:** First Docker build cloned `simplex-chat/simplexmq` main branch instead of fetching PR #1738. This produced server version 6.4.8.0 (no WebSocket support on HTTPS port). The info page loaded but WebSocket connections got CLOSE 1006. Fixed by:
```bash
git clone https://github.com/simplex-chat/simplexmq.git simplexmq-pr1738-fix
cd simplexmq-pr1738-fix
git fetch origin pull/1738/head:pr-1738
git checkout pr-1738
```

**.dev HSTS preload:** All `.dev` domains are in the browser HSTS preload list. The site appeared "offline" because browsers redirect http:// to https:// automatically. Fixed by setting up Certbot before testing.

**PR #57 (s8/007): Revert to v9**

Reverted the v6 fallback to trigger server-side debug logging. The server now had trace logging in `verifyCmdAuth`.

**Server-side debug logging (3 iterations)**

Three iterations of patches to `Server.hs` in `verifyCmdAuth`:

1. **First patch:** Haskell `show` format for raw bytes was unreadable (`\EOT\SO\NUL...`)
2. **Second patch:** Base64 encoding for corrId, authorized data length, first 40 bytes, last 20 bytes, result
3. **Third patch:** Base64 for queuePubKey and DH secret

Results from comparing browser `[SMP-AUTH]` output with server `[SMP-DEBUG]` output:

| Value | Browser | Server | Match? |
|:------|:--------|:-------|:-------|
| corrId | `baa2bd14f76824ed...` | `baa2bd14f76824ed...` | YES |
| authorized first 40B | `303659e8edd3eaaf...` | `303659e8edd3eaaf...` | YES |
| authorized last 20B | `8fa3b7b659e12a1a...` | `8fa3b7b659e12a1a...` | YES |
| authorized length | 172 | 172 | YES |
| DH secret | `ef4e19efb9ba2e14...` | `ef4e19efb9ba2e14...` | YES |
| result | - | False | FAIL |

All inputs were identical but the server returned `result=False`. This could only mean one thing: the XSalsa20-Poly1305 implementation differed between JavaScript and Haskell.

**PR #58 (s8/008): THE CRITICAL FIX - nacl.box instead of nacl.secretbox**

Root cause: Haskell's `cryptoBox` function includes an HSalsa20 key derivation step internally:

```haskell
state0 = XSalsa.initialize 20 secret (zero `B.append` iv0)
-- zeros(16) ++ nonce[0:8] as initialization vector
-- This IS the HSalsa20 "beforenm" step!
```

In JavaScript:
- `nacl.secretbox(msg, nonce, key)` = XSalsa20-Poly1305 only (NO HSalsa20)
- `nacl.box(msg, nonce, peerPub, myPriv)` = scalarMult + HSalsa20 + XSalsa20-Poly1305

The fix was replacing `nacl.scalarMult` + `nacl.secretbox` with a single `nacl.box` call.

This is the **exact same bug** found in SimpleGo Session 34: "crypto_box_beforenm vs crypto_scalarmult".

After this fix: **Server returned IDS!** Queue creation with v9 CbAuthenticator worked! CLI accepted the connection! SKEY succeeded! AgentConfirmation arrived!

### Day 3: MSG Processing and Layer 1 Decryption (2026-03-30)

**PR #59 (s8/009): MSG processing + ACK**

New file `msg-decrypt.ts` with:
- `decryptMsgBody()`: `nacl.box.open(encBody, msgId, serverDhPub, recipientDhPriv)`
- `parseRcvMsgBody()`: extract 12B SystemTime + 1B MsgFlags + 1B space + body, strip '#' padding
- `extractRawX25519()`: strip SPKI prefix (44B to 32B) or pass through raw key

Updated `connection.ts` with MSG handler that decrypts, parses, and sends ACK with CbAuthenticator.

Result: MSG received, decrypted (16,106B plaintext), parsed (15,994B body), ACK accepted (OK).

**PR #62 (s8/012): Fix RcvMsgBody timestamp size**

Briefing error: stated SystemTime = 8 bytes. Actual Haskell SystemTime = Int64 (8B) + Word32 (4B) = 12 bytes. `parseRcvMsgBody` read 4 bytes too early, corrupting the body start. Fixed `bodyStart` from 10 to 14.

**PR #61 (s8/011): Layer 1 NaCl decryption**

New file `layer1-decrypt.ts` with:
- `parseSmpEncConfirmation()`: extract Maybe DH key, nonce, encrypted body
- `decryptLayer1()`: `nacl.box.open` with Alice's DH public key and our private key, unpad
- `parseSmpConfirmation()`: extract sender auth key ('K' tag) or skip ('_' tag)

**PR #63 (s8/013): Fix - no version prefix in incoming smpEncConfirmation**

The CLI does NOT send a 2-byte smpClientVersion prefix. The data starts directly with the Maybe DH key tag ('1'/'0'). Our parser expected a version prefix (because that's what WE send), offsetting everything by 2 bytes. Fixed by removing version parsing.

**PR #64 (s8/014): Fix Layer 1 key (wrong private key)**

First tried `e2eDh.privateKey` (wrong - that's for X448 X3DH layer). Then tried `recipientDh.privateKey` (wrong - that's the queue recipient DH key). Neither worked.

**PR #65 (s8/015): Save queueDhKeyPair - THE REAL FIX**

The correct key for Layer 1 decryption is the `queueDhKeyPair` - the X25519 keypair whose public key goes into the connReq URI `dh=` parameter. The CLI uses this public key to encrypt the smpEncConfirmation back to us. But the private key was generated inside `buildInvitation()` and thrown away after the SEND.

Fix: Return `queueDhKeyPair` from `buildInvitation()` and store it on `ManagedConnection.queueDhPrivateKey`.

After this fix: **Layer 1 decryption succeeded!** 14,777 bytes decrypted! AgentConfirmation starts with `00 07 43` (version 7, tag 'C').

---

## Key Technical Discoveries

### 1. HSalsa20 trap (THE big one)

Haskell's `cryptoBox` includes HSalsa20 key derivation internally. JavaScript `nacl.secretbox` skips this step. Always use `nacl.box` for SMP crypto_box operations.

This is the same bug found in SimpleGo Session 34: "crypto_box_beforenm vs crypto_scalarmult". It cost the SimpleGo team days to discover. It cost us days too.

**Rule:** ALWAYS `nacl.box` / `nacl.box.open`. NEVER `nacl.secretbox` / `nacl.secretbox.open` for SMP protocol operations.

### 2. SMP Maybe encoding uses ASCII characters

- Nothing = ASCII '0' (0x30)
- Just = ASCII '1' (0x31)

NOT binary 0x00/0x01. This caused CMD SYNTAX errors. Two PRs (#53 and #54) were needed to get this right.

### 3. SMP Bool encoding uses ASCII characters

- True = ASCII 'T' (0x54)
- False = ASCII 'F' (0x46)

### 4. SystemTime = 12 bytes, not 8

Haskell SystemTime = Int64 (8 bytes BE) + Word32 (4 bytes BE) = 12 bytes total. Briefing stated 8 bytes, causing `parseRcvMsgBody` to read 4 bytes too early.

### 5. Incoming smpEncConfirmation has no version prefix

The CLI does NOT send a 2-byte smpClientVersion at the beginning. The data starts directly with the Maybe DH key tag. Our outgoing format includes it, but the incoming format does not.

### 6. Four different DH keypairs in play

| Name | Algorithm | Purpose | Stored On |
|:-----|:----------|:--------|:----------|
| recipientAuth | X25519 | SMP command authorization (CbAuth) | ManagedConnection.keys.recipientAuth |
| recipientDh | X25519 | Server encrypts MSG for recipient | ManagedConnection.keys.recipientDh |
| queueDh | X25519 | Peer encrypts smpEncConfirmation | ManagedConnection.queueDhPrivateKey |
| e2eDh | X448 (2 pairs) | X3DH ratchet initialization | ManagedConnection.keys.e2eDh |

Confusing these keys caused PRs #64 and #65. The `queueDhKeyPair` private key MUST be preserved after `buildInvitation()`.

### 7. CbAuthenticator wire format

80 bytes total: 16B Poly1305 tag + 64B encrypted SHA-512 hash. The authorized data (tForAuth) for v7+ includes SessionId (48B, implied - not on wire but in hash) + corrId (24B) + entityId + command body. corrId serves as both correlation ID and NaCl nonce.

### 8. Server distinguishes auth type by length

Server's `checkCredentials` function checks the byte length of the auth field: 80 bytes = CbAuthenticator (v7+), 64 bytes = Ed25519 signature (v6). No version tag needed.

### 9. Docker SMP server MUST be built from PR #1738

The official `simplex-chat/simplexmq` main branch does NOT have WebSocket support on the HTTPS port. Only PR #1738 adds this. Building from main produces v6.4.8.0 which serves HTTP on port 443 but cannot upgrade WebSocket connections. PR #1738 produces v6.5.0.11.

### 10. .dev domains force HTTPS

All `.dev` TLDs are in the browser HSTS preload list. Browsers redirect http:// to https:// automatically. Must set up Certbot before testing.

---

## PRs Created in Season 8

| PR | Branch | Change | Result |
|:---|:-------|:-------|:-------|
| #52 | s8/001+002 | ServerHello authPubKey + v9 CbAuthenticator | CMD SYNTAX (wrong Maybe encoding) |
| #53 | s8/003 | Fix Maybe BasicAuth (remove 0x00) | CMD SYNTAX (still wrong) |
| #54 | s8/004 | Fix Maybe BasicAuth (ASCII '0') | AUTH (CbAuth computation wrong) |
| #55 | s8/005 | Debug logging for CbAuth | AUTH (but now visible what's happening) |
| #56 | s8/006 | v6 diagnostic fallback | IDS + SEND OK (v6 works, problem is CbAuth) |
| #57 | s8/007 | Revert to v9 for server debug | AUTH (triggers server debug logging) |
| #58 | s8/008 | **nacl.box fix (THE critical fix)** | **IDS! SKEY OK! SEND OK!** |
| #59 | s8/009 | MSG processing + ACK | MSG decrypted, ACK OK |
| #61 | s8/011 | Layer 1 NaCl decryption | Parse error (no version prefix) |
| #62 | s8/012 | Fix RcvMsgBody timestamp (12B not 8B) | Body parsed correctly |
| #63 | s8/013 | Fix no version prefix in smpEncConfirmation | Decrypt failed (wrong key) |
| #64 | s8/014 | Fix Layer 1 key (recipientDh) | Decrypt failed (still wrong key) |
| #65 | s8/015 | **Save queueDhKeyPair** | **Layer 1 decrypted! 14,777B AgentConfirmation!** |

Total: 13 PRs, all merged to `feat/simplego-support-chat`.

---

## Current Server Configuration

| Property | Value |
|:---------|:------|
| OS | Debian 13 (fresh install 2026-03-29) |
| IP | 194.164.197.247 |
| Provider | IONOS VPS XL (8 vCore, 16 GB RAM, 320 GB SSD) |
| Web server | Nginx with Certbot auto-renewal |
| Docker image | `local/smp-server-pr1738` |
| SMP version | v6.5.0.11 (built from PR #1738 branch) |
| Container name | `simplego-smp` |
| Ports | 5223 (SMP TLS), 5224 (Control), 8444->443 (HTTPS+WebSocket) |
| Firewall | 22, 80, 443, 5223, 5224, 8444 |
| TLS cert (Nginx) | Let's Encrypt (auto-renewal, expires 2026-06-27) |
| TLS cert (SMP WS) | Let's Encrypt (manual copy to Docker mount after renewal) |
| Fingerprint | `7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow=` |
| Website | `/var/www/simplego.dev/` |
| SMP config | `/root/simplex/smp/config/smp-server.ini` |
| SMP source | `/root/simplexmq-pr1738-fix` (branch `pr-1738`) |
| Protocol range | v6-v18 (both TLS and WebSocket) |

Docker run command:
```bash
docker run -d --name simplego-smp --restart always \
  -p 5223:5223 -p 5224:5224 -p 8444:443 \
  -v /root/simplex/smp/config/certificates:/certificates:z \
  -v /root/simplex/smp/config:/etc/opt/simplex:z \
  -v /root/simplex/smp/logs:/var/opt/simplex:z \
  local/smp-server-pr1738
```

---

## Infrastructure Changes

| Property | Before (Season 7) | After (Season 8) |
|:---------|:-------------------|:-----------------|
| OS | Debian 12 with Plesk | Debian 13 clean (no Plesk) |
| Web server | Plesk Nginx + Apache (conflicts) | Nginx only |
| SSL management | Plesk Let's Encrypt | Certbot with auto-renewal |
| Packages | 50+ Plesk packages | Minimal (nginx, docker.io, certbot) |
| Mail/FTP/PHP | Installed (unused) | Not installed |
| Docker image | `local/smp-server-pr1738` | `local/smp-server-pr1738` (rebuilt) |
| SMP source | `/root/simplexmq-pr1738` | `/root/simplexmq-pr1738-fix` (clean clone) |

---

## Files Modified in Season 8

### New files
- `smp-web/src/msg-decrypt.ts` - Server-to-recipient MSG decryption, RcvMsgBody parser
- `smp-web/src/layer1-decrypt.ts` - smpEncConfirmation parser, Layer 1 NaCl decryption

### Modified files
- `smp-web/src/handshake.ts` - maxSMPClientVersion=9, parse ServerHello authPubKey, send ClientHello sessionAuthKey
- `smp-web/src/protocol.ts` - CbAuthenticator computation (nacl.box), v9 transmission encoding with implySessId
- `smp-web/src/commands.ts` - NEW v9 format (97B with Maybe BasicAuth '0' + Subscribe 'S' + sndSecure 'T')
- `smp-web/src/client.ts` - v9 auth selection (CbAuth vs Ed25519), acknowledge() with auth key, MSG dispatch to push handler
- `smp-web/src/connection.ts` - setupMsgHandler(), queueDhPrivateKey storage, Layer 1 decrypt pipeline
- `smp-web/src/invitation.ts` - Return queueDhKeyPair in InvitationResult
- `smp-web/src/browser-client.ts` - MSG handler callback, state management for PENDING
- `smp-web/src/crypto-utils.ts` - X25519 key generation for recipientAuth (v9)
- `smp-web/src/index.ts` - Exports for new modules

### Server files (temporary, reverted)
- `/root/simplexmq-pr1738-fix/src/Simplex/Messaging/Server.hs` - Debug logging in verifyCmdAuth (3 iterations, all reverted to backup)

---

## Season 8 Metrics

| Metric | Value |
|:-------|:------|
| Duration | 3 days (2026-03-28 to 2026-03-30) |
| PRs merged | 13 (#52-#65, gap at #60) |
| Tests passing | 494 |
| New source files | 2 (msg-decrypt.ts, layer1-decrypt.ts) |
| Briefings created | 11 |
| Server Docker rebuilds | 5 (3 debug patches, 1 wrong branch, 1 clean) |
| Server OS reinstalls | 1 (Debian 13 from scratch) |
| Haskell files analyzed | 4 (Transport.hs, Protocol.hs, Crypto.hs, Client.hs) |
| Wire format bugs fixed | 5 (Maybe encoding x2, SystemTime, version prefix, key selection) |
| Critical discovery | nacl.box vs nacl.secretbox (HSalsa20) |
| AgentConfirmation size | 14,777 bytes (decrypted) |

---

## What Did NOT Work (and why)

### 1. nacl.secretbox for CbAuthenticator (PRs #52-#57)

`nacl.secretbox` uses XSalsa20-Poly1305 directly on the raw DH secret. Haskell's `cryptoBox` applies HSalsa20(key, zeros16) first to derive a subkey. The missing HSalsa20 step produced authenticators that the server couldn't verify. Fix: use `nacl.box` which includes HSalsa20.

### 2. Binary 0x00 for Maybe Nothing (PR #53)

SMP uses ASCII characters for Maybe encoding: '0' (0x30) for Nothing, '1' (0x31) for Just. Binary 0x00 produced CMD SYNTAX because the server's text parser doesn't recognize it.

### 3. Removing the Maybe byte entirely (PR #53)

An empty field is not the same as "Nothing". The server parser expects exactly one byte for the Maybe tag.

### 4. Plesk port conflict resolution

Multiple attempts to fix Apache/Nginx port conflicts through Plesk tools failed. The fundamental architecture of Plesk (Nginx reverse proxy in front of Apache) makes port conflicts inevitable after reboots. Complete removal was the only reliable solution.

### 5. Docker build from main branch (wrong version)

`git clone https://github.com/simplex-chat/simplexmq.git` clones the main branch (v6.4.8.0) which has no WebSocket support on HTTPS. Must explicitly fetch PR #1738: `git fetch origin pull/1738/head:pr-1738`.

### 6. e2eDh.privateKey for Layer 1 decryption (PR #64)

The e2eDh keypairs are X448 keys for X3DH ratchet initialization - a completely different crypto layer. Layer 1 NaCl uses X25519.

### 7. recipientDh.privateKey for Layer 1 decryption (PR #64)

The recipientDh key is used by the server to encrypt MSG for the recipient (server-to-client encryption). Layer 1 is peer-to-peer encryption using the queueDh key from the connReq URI.

### 8. Assuming smpEncConfirmation has a version prefix (PR #63)

Our outgoing smpEncConfirmation includes a 2-byte smpClientVersion. The incoming one from the CLI does not. Asymmetric format.

---

## Knowledge for Season 9

### Starting point

The browser receives and decrypts the CLI's AgentConfirmation (14,777 bytes). The first bytes are `00 07 43` - agentVersion 7, tag 'C' (Confirmation). This data contains Alice's X448 keys and e2eEncryption parameters needed for X3DH and Double Ratchet.

### What Season 9 must implement

1. **Parse AgentConfirmation** - Extract agentVersion, sender key, e2eEncryption params (version, two X448 SPKI keys, optional PQ KEM key), and connInfo (zstd-compressed profile JSON)

2. **X3DH key agreement** - Four X448 DH computations using Alice's keys and our stored ratchet + ephemeral keypairs from `buildInvitation()`. Feed into HKDF-SHA512 with salt=zeros(32) and info="SimpleXX3DH" to get Root Key (32B) + Header Key (32B) + Next Header Key (32B).

3. **Double Ratchet initialization** - Initialize the receiving ratchet with the X3DH-derived keys. Decrypt the CLI's HELLO message.

4. **HELLO send and receive** - Exchange HELLO messages in both directions.

5. **CON state** - Both parties reach CONNECTED. Real encrypted messages can flow.

### Key references for Season 9

- `Agent/Client.hs` - AgentConfirmation encoding, X3DH flow
- `Crypto.hs` - X3DH key agreement, Double Ratchet initialization
- Season 4 code (`x3dh.ts`, `ratchet.ts`) - X3DH and Double Ratchet building blocks (already exist but untested with real data)
- SimpleGo Protocol Analysis Sessions 14-25 - detailed X3DH and Double Ratchet wire format documentation

### Infrastructure notes

- Let's Encrypt cert expires 2026-06-27 (auto-renewal for Nginx, manual copy for SMP Docker)
- Server source at `/root/simplexmq-pr1738-fix` (branch `pr-1738`)
- esbuild.config.mjs must remain `format: "iife"` (check after every rebase)
- Debug logging: use `console.log`, not `console.debug` (browsers filter verbose by default)
- DIAG logs in `invitation.ts` should be cleaned up (left from Season 6)

### Pending document updates

- README.md update (briefing s8/010 ready but not yet merged)
- PROTOCOL.md needs Season 8 tasks and wire format updates
- RESEARCH.md needs CbAuth, HSalsa20, SystemTime findings
- SEASON-PLAN.md needs S8 as Complete, S9 scope

---

## Acknowledgments

- **SimpleGo Protocol Analysis Team** - The HSalsa20 trap was first discovered in Session 34. Without that prior knowledge, the nacl.box fix might have taken even longer.
- **Der Ritter (Claude Code)** - 13 PRs in 3 days, including complex crypto implementations and rapid iteration on wire format bugs. 494 tests passing throughout.
- **Evgeny Poberezkin** - PR #1738 "smp: allow websocket connections on the same port" which makes browser-native SMP possible.

---

*Season 8 Closing Protocol*
*GoChat - Browser-Native Encrypted Messenger*
*IT and More Systems, Recklinghausen*
*"Von CMD SYNTAX ueber AUTH bis zur entschluesselten AgentConfirmation - durch dunkle Protokoll-Waelder zum Licht." - Prinzessin Mausi*
