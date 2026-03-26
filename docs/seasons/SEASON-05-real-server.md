<p align="center">
  <img src="../../.github/assets/gochat_banner.png" alt="GoChat" width="1500" height="230">
</p>

<h1 align="center">GoChat - Season 5 Closing Protocol</h1>

<p align="center">
  <strong>Chat UI + Browser Client + Real Server Connectivity</strong><br>
  From static mockup to first queue creation on a real SMP server.<br>
  15 protocol fixes. 485 tests. 2 days. One browser, one server, one connection.
</p>

---

**Season:** 5
**Date:** 2026-03-25 to 2026-03-26
**Duration:** 2 days (approximately 20 hours of active work)
**Status:** COMPLETE
**Branch:** `feat/simplego-support-chat`
**PRs merged:** 15 (PR #19 through PR #33)
**Tests:** 485 total across 19 files (up from 413 in Season 4)
**Previous:** [Season 4 - Connection Flow](SEASON-04-connection-flow.md)

---

## Scope change

Season 5 was originally planned as "E2E Encryption Hardening" (tasks E2E-1 through E2E-6, SEC-3). During planning, the scope shifted dramatically. Instead of hardening encryption that only worked against mock servers, we decided to build the complete real-world pipeline: chat UI, browser client, server infrastructure, and whatever protocol fixes were needed to talk to a real SMP server.

This turned out to be the right call. The mock server tests (413 from Season 4) all passed, but the real server exposed 15 separate protocol incompatibilities that no mock could have caught. Each fix taught us something new about the SMP v6 wire format.

The original E2E tasks remain deferred for a future season.

---

## Team

- **Prinzessin Mausi** (this chat): Planning, UI design, briefings, protocol analysis, server debugging
- **Der Prinz / Sascha**: Direction, PR merges, testing, server administration
- **Der Ritter / Claude Code**: Implementation (separate session, receives briefings)
- **SimpleGo Protocol Team** (separate chat): Protocol knowledge from 49 sessions of SMP reverse-engineering

Communication: German for conversation, English for code and documentation.

---

## Phase 1: Chat UI

### Decision: Left-docked panel

The chat panel docks to the LEFT side of the viewport, flush against the edge (no gap). It replaces the "Contact Us" link in the util-bar. No floating bubble launcher, no auto-open. The player and chat coexist as separate panels (one visible at a time).

### Files created

**chat.css** (deployed to `src/assets/css/chat.css` in SimpleGo www)
- Panel: 380px desktop, full-screen mobile (<768px), left-aligned flush
- All classes prefixed with `gc-` to avoid conflicts
- Incoming bubbles: `var(--bg-deep)` background with `var(--accent-border)` cyan left border
- Outgoing bubbles: `var(--accent)` background with 2px tail corner (bottom-right)
- Input area: pill-shaped (border-radius: 20px), `--bg-deep` background, centered send button (40px circle)
- Encryption badge: shimmer animation matching the player cover art effect
- Start view: lock icon, "Start Encrypted Chat" button with full-width accent styling
- Animations: slideInLeft/slideOutLeft with 300ms ease, prefers-reduced-motion respected
- Mobile: 1rem left padding, 1.4rem right padding, full viewport height

**chat.js** (deployed to `src/assets/js/chat.js` in SimpleGo www)
- Panel toggle logic with open/close/toggle methods
- Mock message flow (Welcome, encryption info, help prompt) for demo mode
- Real mode: detects `window.createBrowserClient` + `cfg.contactAddress`
- Public API on `window.GoChat`: open, close, toggle, isOpen, setStatus, addMessage, showTyping, removeTyping, setUnread, startChat
- Send handler: creates outgoing bubble immediately, sends via client.send()
- Status management: offline/connecting/connected/error with visual indicators

**base.njk** (modified in `_includes/base.njk` in SimpleGo www)
- Chat HTML structure placed OUTSIDE `#page-content` for SPA persistence
- `gc-panel-dock` element with `data-contact-address` and `data-server-url` attributes
- CSS and JS loaded in base template so chat is available on every page
- "Chat" tab added to util-bar alongside "GitHub"

### Design iterations

1. Initially planned as right-side floating bubble - changed to left-docked panel
2. Close tab below header initially included, then removed (X button in header suffices)
3. Incoming bubble border changed from default to cyan/accent after review
4. Outgoing tail corner sharpened from border-radius to 2px for visual distinction
5. Mobile padding adjusted from symmetric to asymmetric (1rem/1.4rem) after testing

---

## Phase 2: Browser Client

### Task 1: browser-client.ts (PR merged)

High-level browser API wrapping ConnectionManager:

```typescript
export interface BrowserClient {
  connect(): Promise<void>;
  send(text: string): Promise<void>;
  disconnect(): Promise<void>;
  status: 'offline' | 'connecting' | 'connected' | 'error';
}

export function createBrowserClient(config: BrowserClientConfig): BrowserClient;
```

- Factory pattern with config object (contactAddress, serverUrl, callbacks)
- connect() orchestrates: address parsing, WebSocket transport, handshake, queue creation, message subscription
- send() validates connected state, encodes and sends via SMP SEND
- disconnect() graceful cleanup with DEL queue, agent teardown
- Idempotent: double-connect is no-op, double-disconnect is safe

### Task 2: esbuild bundle

**CRITICAL LEARNING: esbuild.config.mjs gets overwritten by rebases.**

The Ritter initially created the config with `format: "esm"`. This caused `Unexpected token 'export'` in the browser because chat.js loads the bundle as a regular script, not an ES module. The fix:

```javascript
format: "iife",
globalName: "GoChatClient",
footer: { js: "window.createBrowserClient = GoChatClient.createBrowserClient;" },
```

This file was overwritten THREE times during the session by rebases. Each time it reverted to ESM and had to be manually fixed. Future seasons must either commit this file separately or add a pre-build check.

Build command: `npm run build:browser`
Output: `dist/gochat-client.js` (~211KB, IIFE, ES2022, browser platform)
Copy to website: `copy dist\gochat-client.js "C:\Projects\SimpleGo www\www\src\assets\js\gochat-client.js"`

### Task 3: Integration tests (24 tests, 7 scenarios)

1. Full lifecycle (5 tests): status transitions, message delivery, MSG push, connect-send-disconnect
2. Reconnect after disconnect (3 tests): fresh agent, correct status sequence, messaging after reconnect
3. Connection error handling (4 tests): failing agent, send rejects in error state, optional onError
4. Multiple rapid sends (3 tests): 5 concurrent via Promise.all, sequential order, 10 sends no loss
5. Incoming messages (2 tests): single and multiple MSG pushes
6. Idempotency (3 tests): double-connect no-op, triple-disconnect safe
7. State consistency (4 tests): status property matches callbacks, send fails after disconnect

---

## Phase 3: Server Infrastructure

### SMP server (Docker)

```bash
docker run -d \
  --name simplego-smp \
  -e "ADDR=smp.simplego.dev" \
  -p 5223:5223 -p 5225:5225 \
  -v $HOME/simplex/smp/config:/etc/opt/simplex \
  -v $HOME/simplex/smp/logs:/var/opt/simplex \
  simplexchat/smp-server:latest
```

Version: v6.4.5.1
Host: smp.simplego.dev (194.164.197.247)
Fingerprint: `7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow=`

**WebSocket activation:** The Docker entrypoint resets `smp-server.ini` on every start. Must `docker exec sed` to add `websockets: 5225` AFTER container start, then `docker restart`.

**Key backup lesson:** Container recreation generates new CA keys, changing the fingerprint. The old fingerprint `7qw4hvuS...` was preserved because the volume mount kept the keys. Always backup `ca.key` and `server.key`.

### Nginx WSS reverse proxy

Plesk owns the system nginx, so we run a standalone instance:

```nginx
# /etc/nginx/smp-proxy.conf
worker_processes 1;
pid /tmp/smp-proxy.pid;
error_log /tmp/smp-proxy-error.log info;
events { worker_connections 128; }
http {
    access_log off;
    server {
        listen 8444 ssl;
        server_name smp.simplego.dev;
        ssl_certificate /etc/nginx/ssl/smp.crt;
        ssl_certificate_key /etc/nginx/ssl/smp.key;
        location / {
            proxy_pass https://127.0.0.1:5225;
            proxy_ssl_verify off;
            proxy_ssl_protocols TLSv1.2 TLSv1.3;
            proxy_ssl_conf_command Options UnsafeLegacyRenegotiation;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_buffering off;
            proxy_request_buffering off;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
            tcp_nodelay on;
            proxy_max_temp_file_size 0;
        }
    }
}
```

Start: `nginx -c /etc/nginx/smp-proxy.conf`
SSL certs: extracted from Plesk's Let's Encrypt store (`/opt/psa/var/certificates/`)

**Does NOT survive reboot.** Needs a systemd service (Season 6 TODO).

### Proxy evolution (what we tried)

1. Apache ProxyPass (Plesk default): `wss://` to backend failed with "downstream server wanted client certificate"
2. Apache with SSLProxy options: "unsafe legacy renegotiation disabled"
3. Nginx sites-enabled: Port 80 conflict with Plesk's Apache
4. Nginx conf.d: Same port 80 conflict
5. Standalone nginx on port 8443: Port conflict with Plesk
6. Standalone nginx on port 8444: SUCCESS (after fixing UnsafeLegacyRenegotiation)
7. Nginx stream module (TCP proxy): WebSocket needs HTTP Upgrade, TCP proxy doesn't work
8. Nginx http proxy with `proxy_pass http://` (plain): "no valid HTTP/1.0 header" (SMP speaks binary)
9. Final: Nginx http proxy with `proxy_pass https://` + ssl_verify off + legacy renegotiation

### Provider firewall ports opened

5223 (SMP native), 5224 (GoRelay SMP), 5225 (SMP WebSocket), 5234 (XFTP), 7443 (GoRelay GRP), 8444 (Nginx WSS proxy)

### Contact address

Created from SimpleX Desktop app test profile configured with `smp.simplego.dev` as SMP server. Address embedded in base.njk as `data-contact-address` attribute on the `gc-panel-dock` element. `data-server-url` points to `wss://smp.simplego.dev:8444`.

---

## Phase 4: Protocol Debugging (15 Fixes)

The heart of Season 5. Each fix resolved one layer of incompatibility between our browser client and the real SMP v6.4.5.1 server. The SimpleGo protocol analysis team provided critical knowledge at several turning points.

### Fix progression

```
#  PR   Error                  Root Cause                              
1  #19  Unexpected token       ESM bundle, browser needs IIFE          
2  #20  Invalid base64url      Double-encoded %253D in contact URI     
3  #21  unexpected end input   ServerHello decoder expects certs       
4  #22  Wrong port             Client uses contact address port 5223   
5  #23  Frame reassembly       16KB blocks fragmented by proxy         
6  #24  No debug output        console.debug filtered by browser       
7  #25  No trace               Needed console.log at every step        
8  #26  CorrId invisible       Response dispatch not logging matches   
9  #27  CorrId mismatch        v6 responses include sessionId first    
10 #28  ERR SESSION             Outgoing commands missing sessionId     
11 #29  ERR SESSION             SessionId at wrong position in wire     
12 #30  ERR CMD SYNTAX          NEW format: spaces, basicAuth, sndSecure
13 #31  ERR CMD SYNTAX          NEW v6 exact format from SimpleGo team  
14 #32  ERR CMD NO_AUTH         NEW command not signed (sigLen=0x00)    
15 #33  ERR AUTH                SessionId not in signed data            
         IDS                    QUEUE CREATED!                          
```

### Key discoveries

**Fix #9 - SessionId in responses (from debug trace):**
The server returns `[sessionId 32B][corrId 24B]...` in v6 responses. Our parser read the 32-byte sessionId as the corrId, so nothing matched. One-line fix: `hasSessionId = this.smpVersion < 7` for incoming.

**Fix #12 - NEW command format (from SimpleGo team):**
SMP commands are NOT space-delimited like HTTP. Keys use shortString encoding (1-byte length prefix) which is self-delimiting. The SimpleGo team provided the exact working C code:
```c
buf[p++] = 'N'; buf[p++] = 'E'; buf[p++] = 'W'; buf[p++] = ' ';
buf[p++] = 44; memcpy(&buf[p], rcv_auth_spki, 44); p += 44;  // authKey
buf[p++] = 44; memcpy(&buf[p], rcv_dh_spki, 44); p += 44;    // dhKey
buf[p++] = 'S';                                                 // subMode
```

**Fix #15 - SessionId in signed data (from SimpleGo team, cost them a full day):**
v6 signed data = `[0x20][sessionId 32B] + [corrIdLen][corrId] + [entityIdLen][entityId] + [command]`

The `0x20` byte (length prefix for sessionId) MUST be in the signed data. The SimpleGo team's error progression was identical to ours:
1. sign(corrId + entityId + cmd) - ERR AUTH
2. sign(sessionId + corrId + entityId + cmd) - ERR AUTH (without 0x20 prefix!)
3. sign([0x20] + sessionId + corrId + entityId + cmd) - SUCCESS

### SimpleGo Protocol Team contributions

The SimpleGo team (separate Claude chat with 49 sessions of SMP protocol reverse-engineering) provided critical knowledge at three turning points:

1. **Client authentication:** Confirmed no TLS client certificate needed. Authentication is per-command via Ed25519 signature. SimpleGo's ESP32 uses `MBEDTLS_SSL_VERIFY_NONE` and works fine.

2. **NEW command format:** Provided byte-exact C code for the working v6 NEW command. Identified that spaces between fields, basicAuth, and sndSecure are all wrong for v6.

3. **Signed data format:** Identified the `[0x20]` sessionId length prefix trap in signed data. Cost them a full day during their own implementation. Saved us hours.

4. **PING test suggestion:** Proposed a diagnostic PING to isolate wire format issues from sessionId issues.

---

## Test progression

| Point in Season | Tests | Files |
|:----------------|------:|------:|
| Season 4 end | 413 | 16 |
| After browser-client (BC-1) | 429 | 17 |
| After integration tests (BC-3) | 453 | 17 |
| After address parser fix (#20) | 461 | 17 |
| After all protocol fixes | 485 | 19 |

---

## Files created or modified

### New files (in GoChat repo, smp-web/)

| File | Lines | Description |
|:-----|------:|:------------|
| src/browser-client.ts | ~270 | High-level browser API |
| esbuild.config.mjs | ~25 | Browser bundle config (MUST be IIFE) |
| src/__tests__/browser-client.test.ts | ~200 | 16 unit tests |
| src/__tests__/browser-client-integration.test.ts | ~470 | 24 integration tests |

### New files (in SimpleGo www/)

| File | Lines | Description |
|:-----|------:|:------------|
| src/assets/css/chat.css | ~350 | Chat panel styles |
| src/assets/js/chat.js | ~200 | Chat panel logic |
| src/assets/js/gochat-client.js | ~7000 | Built bundle (generated) |

### Modified files

| File | Change |
|:-----|:-------|
| _includes/base.njk | Added chat HTML, CSS/JS includes, data attributes |
| src/handshake.ts | ServerHello without certs (WebSocket mode) |
| src/client.ts | connectSMP v6 sessionId, debug logging |
| src/protocol.ts | encodeTransmission/decodeTransmission v6 sessionId |
| src/commands.ts | encodeNEW v6 format, Ed25519 signing |
| src/transport.ts | Frame reassembly buffer, debug logging |
| src/connection.ts | serverUrl passthrough, signing key |
| src/address.ts | URL decode for nested parameters |

### Server files

| File | Description |
|:-----|:------------|
| /etc/nginx/smp-proxy.conf | Standalone Nginx WSS proxy config |
| /etc/nginx/ssl/smp.crt | Let's Encrypt cert (from Plesk) |
| /etc/nginx/ssl/smp.key | Private key (from Plesk) |

---

## Lessons learned

**L1 (CRITICAL): esbuild.config.mjs gets overwritten by rebases.** Must be IIFE format, not ESM. Browser loads via `<script>` tag, not `import`. Check after every rebase.

**L2 (CRITICAL): SMP v6 sessionId behavior is asymmetric over WebSocket.** Outgoing commands: sessionId included in wire format after signature. Incoming responses: sessionId present, must skip when parsing. Signed data: sessionId included WITH its 0x20 length prefix. This cost multiple hours to debug.

**L3 (CRITICAL): SMP v6 NEW command has no spaces between fields.** ShortString encoding (1-byte length prefix) is self-delimiting. No basicAuth, no sndSecure for v6. Just: `"NEW " + shortString(authKey) + shortString(dhKey) + "S"`.

**L4 (HIGH): Docker entrypoint resets smp-server.ini.** WebSocket activation requires post-start sed + restart. Volume mount preserves keys but not config modifications.

**L5 (HIGH): Nginx standalone process needed on Plesk servers.** Plesk owns the system nginx. Run a separate instance with its own config file and PID. Does not survive reboot - needs systemd service.

**L6 (HIGH): UnsafeLegacyRenegotiation required for SMP backend TLS.** The SMP server uses older TLS renegotiation that modern nginx/openssl rejects by default.

**L7 (HIGH): Debug logging must use console.log, not console.debug.** Browser DevTools filter out console.debug by default and the filter toggle is not obvious.

**L8 (MEDIUM): Let's Encrypt certs for Nginx must be extracted from Plesk's certificate store.** Plesk stores certs in `/opt/psa/var/certificates/` as combined files containing CSR + key + cert chain. Must grep for `BEGIN CERTIFICATE` and `BEGIN PRIVATE KEY` separately.

**L9 (MEDIUM): git pull required after GitHub PR merge.** PR merges happen on GitHub, not locally. Must `git pull` before rebuilding the bundle, otherwise the old code gets bundled.

**L10 (MEDIUM): The SimpleGo protocol analysis team is invaluable.** 49 sessions of SMP reverse-engineering produced exact byte-level knowledge that saved hours of guessing. Three critical assists in this season alone.

**L11 (LOW): TCP stream proxy does not work for WebSocket.** WebSocket requires HTTP Upgrade handshake. Nginx stream module passes raw TCP without HTTP awareness, so the WebSocket upgrade never happens.

**L12 (LOW): Contact address URL encoding is nested.** The `smp=` parameter in the HTTPS contact format contains a URL-encoded SMP URI whose own parameters are double-encoded. The address parser must decode parameter values after splitting.

---

## What works at end of Season 5

- Chat panel opens from util-bar "Chat" tab
- Left-docked, responsive, animations, encryption badge
- Mock mode works (Welcome messages, demo flow)
- Real mode: browser connects to wss://smp.simplego.dev:8444
- WebSocket opens, SMP handshake completes (ServerHello/ClientHello)
- NEW command sent with correct v6 format and Ed25519 signature
- Server responds with IDS (queue successfully created)
- "Connected! This chat is end-to-end encrypted via SimpleX." displayed

## What does NOT work yet

- No invitation sent to contact queue (SKEY + SEND with connection request)
- SimpleX app does not see a connection request (Steps 2-7 of 7-step flow missing)
- Messages sent from chat have one checkmark but don't reach the app
- Nginx proxy does not survive server reboot
- Debug console.log statements still present in production code
- esbuild.config.mjs still vulnerable to rebase overwrites

---

## Season 5 achievement: the 7-step connection flow

From the SimpleGo protocol analysis (Session 23), the full connection requires 7 steps:

```
1. Browser: NEW -> Queue created (IDS)          DONE (Season 5)
2. Browser: SEND Invitation to Contact Queue     Season 6
3. App: receives MSG, shows Connection Request   Season 6
4. App: accepts, sends CONF back                 Season 6
5. Browser: receives KEY                         Season 6
6. Both: HELLO exchange                          Season 6
7. Both: CON -> "CONNECTED"                      Season 6
```

Season 5 completed Step 1. Season 6 will complete Steps 2-7.

---

## Commit log (Season 5)

### Phase 2 PRs (Browser Client)

| PR | Branch | Commit message |
|:---|:-------|:---------------|
| #16 | feature/browser-client | feat(smp): add high-level browser client API for chat integration |
| #17 | feature/browser-client-test | test(smp): add browser client integration tests (24 tests, 7 scenarios) |

### Phase 4 PRs (Protocol Fixes)

| PR | Branch | Commit message |
|:---|:-------|:---------------|
| #19 | fix/esbuild-iife | fix(smp): use IIFE bundle format for browser compatibility |
| #20 | fix/address-parser-url-decode | fix(smp): decode nested URL parameters in contact address parser |
| #21 | fix/serverhello-websocket-decode | fix(smp): handle ServerHello without certs in WebSocket mode |
| #22 | fix/websocket-server-url | fix(smp): use serverUrl config for WebSocket connection |
| #23 | fix/websocket-frame-reassembly | fix(smp): buffer and reassemble fragmented WebSocket frames |
| #24 | fix/post-handshake-stall | fix(smp): add post-handshake transport state check and debug logging |
| #25 | fix/real-server-debug | fix(smp): add console.log debug trace at every step of connection flow |
| #26 | fix/response-dispatch | fix(smp): add corrId dispatch logging to diagnose response matching |
| #27 | fix/response-sessionid-skip | fix(smp): skip sessionId in v6 server responses to fix corrId matching |
| #28 | fix/outgoing-sessionid-v6 | fix(smp): include sessionId in outgoing v6 commands |
| #29 | fix/session-error | fix(smp): remove sessionId from outgoing commands (WebSocket implicit) |
| #30 | fix/session-wire-format | fix(smp): correct sessionId position and re-enable for v6 |
| #31 | fix/new-exact-v6-format | fix(smp): exact v6 NEW format (no spaces, no basicAuth, no sndSecure) |
| #32 | fix/new-command-signing | fix(smp): sign NEW command with Ed25519 (sigLen=0x40) |
| #33 | fix/sign-includes-sessionid | fix(smp): include sessionId with 0x20 prefix in v6 signed data |

---

## Open items for Season 6

1. Complete 7-step connection flow (Steps 2-7)
2. Send invitation with X3DH + Double Ratchet encryption to contact queue
3. Handle connection confirmation from SimpleX app
4. Bidirectional encrypted messaging
5. Remove debug console.log statements from production code
6. Nginx proxy systemd service for reboot persistence
7. Commit esbuild.config.mjs as IIFE (prevent rebase overwrites)
8. Clean up Apache vhost_ssl.conf remnants on smp.simplego.dev

---

## Infrastructure reference

### Build and test workflow

```bash
cd "C:\Projects\GoChat"
git pull
cd smp-web
npm run build:browser
copy dist\gochat-client.js "C:\Projects\SimpleGo www\www\src\assets\js\gochat-client.js"
# In another terminal:
cd "C:\Projects\SimpleGo www\www"
npm run dev
# Browser: Ctrl+Shift+R for hard refresh
```

### Server management

```bash
# Check SMP server
docker ps | grep smp
docker logs simplego-smp --tail 20

# Check Nginx proxy
ss -tlnp | grep 8444
cat /tmp/smp-proxy-error.log | tail -10

# Restart Nginx proxy (after reboot)
nginx -c /etc/nginx/smp-proxy.conf

# Restart SMP server (preserves keys via volume)
docker restart simplego-smp

# Activate WebSocket after container restart
docker exec simplego-smp sed -i 's/websockets: off/websockets: 5225/' /etc/opt/simplex/smp-server.ini
docker restart simplego-smp
```

### Contact address (current)

```
https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow%3D%40smp.simplego.dev%2FOtolWWr-RvadOYmWcXEdPESO9gv3QHRG%23%2F%3Fv%3D1-4%26dh%3DMCowBQYDK2VuAyEAfnheD7px24u0f4cqnHRfINe29PNBkOmRImDc7Q1d604%253D%26q%3Dc
```

Server URL: `wss://smp.simplego.dev:8444`

---

*Season 5 Closing Protocol*
*GoChat - Browser-Native Encrypted Messenger*
*2026-03-25 to 2026-03-26*
*15 protocol fixes, 485 tests, first queue on real server*
*"Der Server redet mit uns!" - Prinzessin Mausi*
