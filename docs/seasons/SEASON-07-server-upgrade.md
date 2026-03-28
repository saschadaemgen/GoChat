# Season 7 Closing Protocol
# Server Upgrade: ALPN Fix, PR #1738 Build, and Infrastructure Overhaul

**Date:** 2026-03-28
**Status:** COMPLETE - Server upgraded, v6-18 over WebSocket, Nginx eliminated
**Branch:** `feat/simplego-support-chat`
**Tests:** 493 pass, 3 skipped
**PRs merged:** #47, #48, #49, #50 (plus direct pushes for rapid iteration)

---

## Summary

Season 7 was a marathon debugging and infrastructure session that discovered and resolved three interconnected root causes preventing the SimpleX CLI from accepting GoChat's connection invitation. The session transformed from a code debugging task into a full server infrastructure overhaul.

The AUTH error when the CLI runs `/ac` was traced through multiple layers: the CLI sends SKEY (sender key registration) before SEND, but our queue was created without sndSecure because the server only offered protocol v6 over WebSocket. The server offered v6 because browser WebSocket connections lack ALPN "smp/1" in the TLS handshake, causing the server to fall back to legacy v6-only mode.

The fix required building the SMP server from Evgeny's unmerged PR #1738 ("smp: allow websocket connections on the same port"), which extends the server's ALPN list to include "h2" and "http/1.1". This allows browser WebSocket connections to negotiate ALPN successfully, unlocking the full v6-18 protocol range.

Season 7 ended with the server successfully advertising v6-18 over WebSocket and the browser negotiating v6. The remaining blocker for the connection flow is implementing v7+ command authorization (X25519 DH instead of Ed25519 signatures), which will allow negotiating v9+ and enabling sndSecure. This is the starting point for Season 8.

---

## What Season 7 Accomplished

### Root cause chain discovered and resolved

```
Symptom:  CLI sends /ac -> "connection authorization failed" (AUTH)
  |
  +-> CLI sends SKEY before SEND (Debug log: "yr7g SEND SKEY <key>")
        |
        +-> Queue has no sndSecure (server store: sk= empty)
              |
              +-> "S T" in NEW gives CMD SYNTAX on v6
                    |
                    +-> Server offers v6-v6 over WebSocket (not v6-v18)
                          |
                          +-> Browser cannot send ALPN "smp/1" (always "h2"/"http/1.1")
                                |
                                +-> Server code: getSessionALPN = Nothing -> legacyServerSMPRelayVRange (v6-v6)
                                      |
                                      +-> FIX: PR #1738 extends ALPN list to ["smp/1", "h2", "http/1.1"]
                                            Browser proposes "h2" -> server matches -> Just "h2" -> full v6-v18
```

### Infrastructure changes

| Change | Before | After |
|--------|--------|-------|
| Docker image | `simplexchat/smp-server:v6.4.5` (v6.4.5.1) | `local/smp-server-pr1738` (v6.5.0.11 + PR #1738) |
| Server protocol range | v6-v6 (WebSocket), v6-v18 (TLS) | v6-v18 (both) |
| WebSocket path | Nginx HTTP proxy -> Port 5225 (separate WS) | Docker 443 -> Host 8444 (direct, no Nginx) |
| TLS certificate | 2048-bit RSA (Nginx Let's Encrypt) | 4096-bit RSA (Let's Encrypt, mounted into Docker) |
| Nginx | Required (TLS termination + WS proxy) | Eliminated (SMP server handles TLS + WS + HTTP) |
| WebSocket port | 5225 (deprecated separate listener) | 443 (shared with TLS, via warp-tls + SNI) |
| Nginx version | 1.22.1 (Debian oldstable) | 1.28.3 (upgraded but no longer used) |

### Connection flow status after Season 7

```
Step 1: Browser NEW -> Queue created (IDS)              DONE (Season 5)
Step 2: Browser SEND AgentInvitation to Contact Queue    DONE (Season 6)
Step 3: App/CLI receives MSG, shows Connection Request   DONE (Season 6)
Step 4: CLI accepts -> SKEY AUTH (queue has no sndSecure) BLOCKED (needs v9+)
Step 5: Browser receives confirmation                     Season 8
Step 6: Both exchange HELLO messages                      Season 8
Step 7: Both reach CON -> "CONNECTED"                     Season 8
```

---

## The Journey: From AUTH to v6-18

### Phase 1: Identifying SKEY as the culprit

The CLI v6.4.10 was started with debug logging (`simplex-chat -l debug --log-agent --log-tls-errors`). After accepting the GoChat invitation with `/ac`, the debug log showed:

```
A (1) --> smp.simplego.dev:5223 : yr7g SEND SKEY <key>
A (1) <-- smp.simplego.dev:5223 :  SMP {smpErr = AUTH}
```

Only ONE outgoing command (SKEY), then AUTH, then nothing. The CLI never sends the AgentConfirmation because SKEY fails first. SKEY is a v9+ feature (Fast Duplex) that registers the sender's auth key on the queue.

### Phase 2: sndSecure attempts (all failed on v6)

| PR | Change | Result | Why |
|----|--------|--------|-----|
| #47 | `"ST"` (no space) | CMD SYNTAX | v6 parser reads unknown command |
| #48 | Revert #47 | OK (95B NEW works again) | - |
| #49 | `"S T"` (with space) | CMD SYNTAX | v6 parser still does not know sndSecure |
| #50 | Revert + maxVersion=6 | CMD SYNTAX on beta server too | v6 command parser has no sndSecure code |

The SimpleGo Protocol Team confirmed: sndSecure is a v9+ feature. The v6 command parser literally does not contain the code to parse it, regardless of what the server binary internally supports.

### Phase 3: ALPN discovery

The SimpleGo Protocol Team identified the Haskell code in `Transport.hs:755`:

```haskell
smpVersionRange = maybe legacyServerSMPRelayVRange (const smpVRange) $ getSessionALPN c
```

- `getSessionALPN = Nothing` -> v6-v6 (legacy, for old clients without ALPN)
- `getSessionALPN = Just _` -> v6-v18 (full range)

Browser WebSocket connections go through TLS but send "h2"/"http/1.1" as ALPN (browser limitation). The server sees no "smp/1" and treats it as a legacy client.

### Phase 4: Server upgrade attempts

1. **Docker image upgrade** (`simplexchat/smp-server:6.5.0-beta.6`): Server v6.5.0.11, but WebSocket port still gets v6-v6 because the ALPN check is unchanged.

2. **Nginx ALPN passthrough**: Attempted `proxy_ssl_alpn`, `proxy_ssl_conf_command ALPNProtocols` - neither exists in Nginx (even 1.28.3). Nginx has no directive to set ALPN on backend connections in the http module.

3. **Stream module TCP passthrough**: `ssl_preread on` - passes raw TCP but browser rejects self-signed SMP cert.

4. **WebSocket off + Nginx to port 5223**: SMP server on 5223 does not handle WebSocket upgrade (expects raw SMP over TLS).

### Phase 5: PR #1738 discovery and build

The Ritter analyzed `C:\Projects\simplexmq-latest` (branch `pr-1738`) and found the fix:

The server's TLS configuration adds `["smp/1", "h2", "http/1.1"]` to its ALPN list. When a browser connects and proposes "h2", the server matches it. `getSessionALPN` returns `Just "h2"` (not `Nothing`), so the full v6-v18 range is advertised.

Additionally, PR #1738 adds WebSocket handling on the shared HTTPS/TLS port (443) via warp-tls + SNI detection + wai-websockets. No separate WebSocket port needed.

**Build on server:**
```bash
cd /root && git clone simplexmq -> git fetch origin pull/1738/head:pr-1738
DOCKER_BUILDKIT=1 docker build -t local/smp-server-pr1738 --build-arg APP="smp-server" --build-arg APP_PORT="5223" .
```

### Phase 6: Infrastructure overhaul

1. **4096-bit RSA certificate**: PR #1738 requires 4096-bit RSA for the HTTPS handler. Generated with certbot (had to stop Apache briefly for port 80).

2. **Nginx eliminated**: Docker maps container port 443 directly to host port 8444. The SMP server handles TLS termination, WebSocket upgrade, and HTTP serving itself.

3. **Config changes**:
   - `websockets: off` (deprecated separate WS port disabled)
   - `static_path: /var/opt/simplex/www` (enables HTTPS/WS handler on port 443)
   - `cert: /certificates/web.crt` and `key: /certificates/web.key` (Let's Encrypt 4096-bit RSA)

### Phase 7: Victory - v6-18 over WebSocket

Browser console output after deploying PR #1738 server:

```
ServerHello decoded, version=6-18, sessionId=48B, certs=2
negotiated version=6
HANDSHAKE COMPLETE, creating SMPClient v6
NEW cmd 95B -> IDS (Queue created!)
SEND -> OK (Invitation sent!)
```

The server now offers the full protocol range over WebSocket. The ALPN fix works.

---

## Key Technical Discoveries

### 1. SKEY comes before SEND in the connection flow

The CLI v6.4.10 uses Fast Duplex (v9+). When accepting a contact request, the order is:
1. Connect to the queue server
2. SKEY (register sender auth key on the queue)
3. SEND (AgentConfirmation with profile and reply queue)

If SKEY fails (AUTH), the CLI aborts immediately. The AgentConfirmation is never sent. This means KEY (the v6 recipient-side command) cannot be used as a workaround because the CLI never gets far enough to send its sender key.

### 2. ALPN determines the protocol version range

The SMP server uses TLS ALPN to decide which protocol versions to offer:
- Native clients send ALPN "smp/1" -> server offers v6-v18
- Browsers send ALPN "h2" or "http/1.1" -> server offers v6-v6 (legacy)
- PR #1738 adds "h2" and "http/1.1" to the server's ALPN list -> browsers get v6-v18

### 3. sndSecure requires v9+ negotiation, not just v9+ server

Even with a server that internally supports v18, the negotiated protocol version determines which command parser is used. Negotiating v6 means the v6 parser runs, which has no sndSecure code. To use "S T" in NEW, the client must negotiate v9+.

### 4. v7+ command authorization is different from v6

v6 uses Ed25519 signatures for command authorization. v7+ uses X25519 DH-based authorization (crypto_box). Our code currently implements v6 auth. When we tried negotiating v7 (maxSMPClientVersion=7), the server rejected NEW with AUTH because our auth format was wrong.

### 5. PR #1738 WebSocket architecture

The PR uses warp-tls for HTTPS on the SMP port (443). SNI detection routes browser connections to the HTTP/Warp handler. wai-websockets detects the WebSocket Upgrade header and creates a WS transport. The WS transport carries the ALPN from the TLS session, so `getSessionALPN` returns `Just "h2"`.

This requires:
- `static_path` set in smp-server.ini (enables web handler)
- 4096-bit RSA certificate for HTTPS (2048-bit rejected)
- Port 443 in the `port:` config line

---

## PRs Created in Season 7

| PR | Branch | Change | Result |
|----|--------|--------|--------|
| #47 | s7/001-sndSecure-new-command | "ST" (no space) in NEW | CMD SYNTAX, reverted |
| #48 | s7/002-revert-sndSecure | Revert #47 | Back to 95B |
| #49 | s7/003-sndSecure-with-space | "S T" (with space) in NEW + `&k=s` in URI | CMD SYNTAX on v6, reverted |
| #50 | s7/004-cap-v6-enable-sndSecure | maxVersion=6 + "S T" | CMD SYNTAX (v6 parser), reverted |

Plus direct pushes:
- `maxSMPClientVersion = 6` (cap version to prevent v7 AUTH errors)

---

## Current Server Configuration

| Property | Value |
|----------|-------|
| Docker image | `local/smp-server-pr1738` |
| Software version | SMP server v6.5.0.11 (built from PR #1738 branch) |
| Ports | 5223 (TLS), 8444->443 (HTTPS+WebSocket), 5224 (Control) |
| Fingerprint | `7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow=` |
| TLS cert (SMP) | Self-signed Ed25519 (server-generated) |
| TLS cert (HTTPS/WS) | Let's Encrypt 4096-bit RSA (expires 2026-06-26) |
| WebSocket | Via warp-tls on port 443 (no separate WS port) |
| Nginx | STOPPED (no longer needed) |
| Protocol range (WebSocket) | v6-v18 |
| Protocol range (TLS) | v6-v18 |
| Config backup | `/root/simplex/smp/config.backup.v6.4.5` |
| Server source | `/root/simplexmq-pr1738` (branch pr-1738) |

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

## Files Modified in Season 7

### GoChat Code Changes (all reverted by end of season)
- `smp-web/src/handshake.ts` - maxSMPClientVersion capped at 6 (kept)
- `smp-web/src/commands.ts` - sndSecure attempts (all reverted)
- `smp-web/src/invitation.ts` - `&k=s` URI param (reverted)
- `smp-web/src/__tests__/commands.test.ts` - test updates (reverted)
- `smp-web/src/__tests__/handshake.test.ts` - version cap tests (kept)

### Server Infrastructure Changes (permanent)
- `/root/simplex/smp/config/smp-server.ini` - websockets: off, static_path enabled, web cert paths
- `/root/simplex/smp/config/certificates/web.crt` - 4096-bit RSA Let's Encrypt cert
- `/root/simplex/smp/config/certificates/web.key` - 4096-bit RSA private key
- `/etc/nginx/smp-proxy.conf` - exists but Nginx is stopped
- Nginx upgraded to 1.28.3 (from official repo, but no longer used)

### External Repositories Cloned
- `C:\Projects\simplexmq-latest` (master branch, for code analysis)
- `/root/simplexmq-pr1738` (PR #1738 branch, for Docker build)

---

## Season 7 Metrics

| Metric | Value |
|--------|-------|
| PRs merged | 4 (#47, #48, #49, #50) plus direct pushes |
| PRs reverted | 3 (#47, #49, #50 - sndSecure attempts) |
| Tests | 493 pass, 3 skipped (unchanged from S6) |
| Server rebuilds | 3 (beta image, PR #1738 build, cert fixes) |
| Nginx configs tried | 5 (HTTP proxy, stream proxy, ALPN attempts) |
| Root causes identified | 3 (SKEY, ALPN, v6 parser) |
| SimpleGo team consultations | 4 rounds |
| Docker image built from source | 1 (PR #1738, ~20 min Haskell build) |
| Certificate generations | 2 (2048-bit rejected, 4096-bit accepted) |
| Hours | ~8 (marathon session) |

---

## What Did NOT Work (and why)

### 1. sndSecure on v6 (3 attempts)
"ST", "S T", and "S T" with maxVersion=6 all produced CMD SYNTAX. The v6 command parser does not contain sndSecure code. This is a parser limitation, not a format issue.

### 2. Server image upgrade alone
Upgrading from v6.4.5 to v6.5.0-beta.6 did not fix the WebSocket ALPN problem. The ALPN check code is identical in both versions. Only PR #1738 (unmerged) changes it.

### 3. Nginx ALPN passthrough
Nginx has no directive to set ALPN on backend TLS connections in the http module. `proxy_ssl_alpn` does not exist. `proxy_ssl_conf_command ALPNProtocols` is not a valid OpenSSL conf command. The stream module has `proxy_ssl_alpn` but cannot handle WebSocket upgrade (HTTP-level operation).

### 4. WebSocket off + port 5223
Disabling the separate WebSocket port and pointing Nginx to port 5223 failed because the SMP server on 5223 expects raw SMP over TLS, not HTTP WebSocket upgrade.

### 5. Stream proxy (TCP passthrough)
Raw TCP passthrough works but the browser rejects the SMP server's self-signed certificate. The browser needs a trusted CA certificate for WSS.

### 6. v7 negotiation without v7 auth
Setting maxSMPClientVersion=7 caused the server to negotiate v7. Our NEW command then got AUTH because v7 uses X25519 DH-based command authorization instead of Ed25519 signatures.

---

## Knowledge for Season 8

### Starting point
The server offers v6-18 over WebSocket. The browser negotiates v6 and can create queues (NEW -> IDS) and send invitations (SEND -> OK). The CLI receives the invitation correctly. But the CLI's SKEY fails because the queue has no sndSecure (v6 cannot create sndSecure queues).

### What Season 8 must implement

1. **v7+ command authorization** - X25519 DH-based auth instead of Ed25519 signatures. This is the v7 "cmd-auth" scheme from PR #982. The ClientHello must include `authPubKey` (X25519), and commands are authorized via crypto_box instead of Ed25519 signatures.

2. **Negotiate v9+** - Once v7+ auth works, increase maxSMPClientVersion to 9+ so the server uses the v9+ command parser which supports sndSecure.

3. **Enable sndSecure** - "S T" in NEW command (97 bytes) + `&k=s` in connReq URI. This allows the CLI to successfully SKEY on our queue.

4. **Complete Steps 4-7** - After SKEY succeeds, the CLI sends AgentConfirmation. Browser must SUB to receive it, decrypt (X3DH + Ratchet), exchange HELLO, reach CON state.

### v7+ auth reference (from PR #982 and Evgeny's code)

The v7 ClientHello adds fields after the keyHash:
```
ClientHello v7: Word16(version) + shortString(keyHash) + shortString(authPubKey) + Maybe(proxyServer) + Maybe(clientService)
```

Command authorization changes from Ed25519 signature to X25519 DH crypto_box:
- Generate ephemeral X25519 keypair per command
- Include ephemeral public key in the transmission
- Authorize via crypto_box(command, nonce, serverDHKey, ephemeralPrivateKey)

### Infrastructure notes
- Let's Encrypt cert expires 2026-06-26 (auto-renewal via certbot timer)
- Must copy renewed cert to `/root/simplex/smp/config/certificates/web.crt` and `.key`
- Docker container has `--restart always` but cert copy is manual
- Nginx 1.28.3 installed but stopped - can be removed or repurposed
- `C:\Projects\simplexmq-latest` on branch `pr-1738` has the full server source for reference
- esbuild.config.mjs must remain IIFE format (check after every rebase)

### Contact address
The contact address in `base.njk` points to the CLI's address on smp.simplego.dev (set during Season 7 CLI testing). This should be updated to a permanent contact address for Season 8.

---

## Acknowledgments

- **SimpleGo Protocol Team** - 4 rounds of critical questions answered: SKEY behavior, ALPN Haskell code location, sndSecure wire format with space, KEY vs SKEY flow comparison
- **The Ritter (Claude Code)** - PR #1738 source code analysis identifying the exact ALPN fix mechanism, plus 4 PRs for sndSecure testing
- **Evgeny Poberezkin** - PR #1738 "smp: allow websocket connections on the same port" which solved the browser ALPN problem

---

*Season 7 Closing Protocol*
*GoChat - Browser-Native Encrypted Messenger*
*IT and More Systems, Recklinghausen*
*"Drei Ursachen, eine Loesung, null Nginx." - Prinzessin Mausi*
