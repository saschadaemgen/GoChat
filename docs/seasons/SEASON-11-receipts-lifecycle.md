# Season 11 Protocol
# GoChat - Delivery Receipts, Connection Lifecycle, .env Integration
# Date: 2026-04-01 to 2026-04-02

---

## Season Summary

Season 11 delivered delivery receipts (bidirectional double checkmarks),
connection lifecycle management (END detection, timeout, delete
notification), and .env integration for the SimpleGo website. The
season also produced a chat.js update for receipt UI and answered a
community security question about server-targeted JavaScript attacks.

Five GoChat PRs merged (#91-#95), chat.js updated with receipt UI,
.env integration completed on the website, and a receipt msgHash bug
required three attempts to resolve (the full agentMessage buffer must
be hashed, not a subset).

**Duration:** 1 day (2026-04-02)
**PRs merged:** #91 through #95 (5 PRs)
**Tests:** 544 -> 551+ (zero regressions)
**Website changes:** chat.js v9 (receipt UI), .env integration
**Status:** COMPLETE - delivery receipts + connection lifecycle live

---

## What Works After Season 11

### Everything from Season 10, plus:

1. **Delivery Receipts (bidirectional)**
   - Browser sends receipt when receiving a chat message (A_RCVD, tag 'V')
   - Browser receives receipt when Desktop App reads our message
   - Single checkmark (sent) -> double checkmark (delivered)
   - Wire format: count=Word8, rcptInfo=Word16 (not Word16/Word32!)
   - agentVersion=1 for outgoing receipts (not 7!)
   - No receipt sent for received receipts (no infinite loop)

2. **Connection Lifecycle**
   - Agent deletes contact -> browser shows "Connection ended" (END detection)
   - Agent ignores request -> 2-minute timeout with message
   - Visitor destroys chat -> Desktop App receives x.direct.del notification
   - sendDeleteNotification() before closeConnection() in disconnect()

3. **Receipt UI in chat.js**
   - pendingChecks queue tracks outgoing message DOM elements
   - onDeliveryReceipt callback wired from gochat-client.js
   - upgradeCheck() adds second SVG checkmark + .delivered CSS class
   - Queue cleared on chat reset

4. **.env Integration**
   - dotenv installed in 11ty project
   - .eleventy.js loads .env, exposes gochat global data
   - base.njk uses {{ gochat.contactAddress }} and {{ gochat.serverUrl }}
   - Contact address in quotes in .env (# is comment character in dotenv!)

---

## The Journey

### Phase 1: Delivery Receipts (PR #91)

Prinzessin Mausi analyzed the SimpleGo ESP32 implementation (Session
25, Milestone 5) and the protocol-analysis docs to build a complete
briefing with byte-level wire format. The Ritter implemented both
directions cleanly on first attempt.

| Direction | What happens |
|:----------|:-------------|
| Receive | Desktop App sends A_RCVD (tag 'V') with agentMsgId matching our sent message |
| Send | GoChat sends A_RCVD back when receiving x.msg.new chat messages |

Wire format for A_RCVD:
```
'M' + APrivHeader + 'V' + count(1B Word8) + [AMessageReceipt...]

AMessageReceipt:
  agentMsgId (8B Int64 BE)
  msgHash (1B len + 32B SHA256)
  rcptInfo (2B Word16)
```

Critical traps from ESP32 experience (both avoided):
- count=Word8, NOT Word16 (Bug #37 on ESP32)
- rcptInfo=Word16, NOT Word32 (Bug #38 on ESP32)

### Phase 2: Receipt msgHash Bug (PRs #92, #93)

Desktop App showed red double checkmarks (= bad message hash). Three
attempts needed to find the correct hash scope:

| Attempt | Hash scope | Result |
|:--------|:-----------|:-------|
| 1 | `sha256(agentMessage.slice(offset + 1))` - JSON only | RED |
| 2 | `sha256(agentMessage.slice(offset))` - inner tag + JSON | RED |
| 3 | `sha256(agentMessage)` - full buffer | WHITE |

Root cause: The Desktop App hashes the FULL serialized AgentMessage
buffer (outer tag + APrivHeader + inner tag + body) before encrypting
it with the Ratchet. GoChat must hash the same scope.

**New critical trap documented:**
```
Receipt msgHash scope: sha256 over the FULL agentMessage buffer
(outer tag + APrivHeader + inner tag + body), NOT just the JSON
or inner content.
```

### Phase 3: chat.js Receipt UI Update

Prinzessin Mausi updated chat.js directly (website file, not GoChat
repo). Four changes:

1. `pendingChecks=[]` array added to variable declarations
2. `pendingChecks=[]` in resetChat() for cleanup
3. addMessage() pushes outgoing .gc-check elements to queue
4. upgradeCheck() adds second SVG checkmark + .delivered CSS class
5. onDeliveryReceipt callback wired in startRealChat()

The .delivered CSS class is the styling hook for color/animation.

### Phase 4: Connection Lifecycle (PRs #94, #95)

**PR #94: END Detection + Timeout**

The SMP transport layer already had `subscriptionEndHandler` and
`onSubscriptionEnd()` but they were never wired. When the Desktop App
deletes a contact, the SMP server sends END to the subscriber. GoChat
now catches this and shows "Connection ended."

Additionally, a 2-minute timeout was added for unresponsive agents.

**PR #95: Delete Notification**

When the visitor destroys the chat (red X button), GoChat now sends
`{"event":"x.direct.del","params":{}}` through the full encrypted
pipeline BEFORE calling closeConnection(). The Desktop App receives
the notification. Best effort - failure does not block disconnect.

### Phase 5: .env Integration (Website)

Done directly by Sascha with Mausi's guidance. Four steps:

1. `npm install dotenv` in SimpleGo www
2. `.env` file with GOCHAT_CONTACT_ADDRESS and GOCHAT_SERVER_URL
3. `require('dotenv').config()` + addGlobalData in .eleventy.js
4. `{{ gochat.contactAddress }}` in base.njk (replaces hardcoded URL)

**Critical discovery:** dotenv treats `#` as comment character. The
SimpleX contact address URL contains `contact#/` which gets truncated.
Fix: wrap the URL in double quotes in the .env file.

### Phase 6: Community Security Response

Answered a question from OutlandishIdeal in the SimpleGo chat group
about server-targeted JavaScript attacks. Response covered:
- VPN/Tor hides IP but not browser fingerprint
- SRI + CSP as planned defenses
- Fundamental browser trust problem (all web E2E has this)
- GoChat as support chat, not high-security tool
- SimpleGo Class 1/2/3 for high-security use cases
- Response provided in English and German

---

## PRs and Key Changes

| PR | Title | Key Achievement |
|:---|:------|:----------------|
| #91 | feat(protocol): delivery receipts (send and receive) | Bidirectional receipts, 551 tests |
| #92 | fix(protocol): include inner tag in receipt msgHash | Still red (wrong scope) |
| #93 | fix(protocol): hash full agentMessage for receipt msgHash | White checkmarks! |
| #94 | feat(protocol): wire onSubscriptionEnd for queue END detection | Connection end + timeout |
| #95 | feat: connection lifecycle (delete notification) | x.direct.del before disconnect |

---

## Protocol Discoveries (Season 11)

### Receipt msgHash = full agentMessage
The SHA256 hash in AMessageReceipt must cover the ENTIRE decrypted
agentMessage buffer: outer 'M' tag + APrivHeader (sndMsgId + prevMsgHash)
+ inner 'M' tag + JSON body. Not just the JSON, not just inner tag + JSON.
Three attempts needed. New entry for Critical Traps list.

### dotenv # comment trap
dotenv interprets `#` as inline comment start. SimpleX contact addresses
contain `contact#/` which gets silently truncated to `contact`. Fix:
wrap the value in double quotes in the .env file.

### onSubscriptionEnd was dead code
The SMP transport layer had full END detection infrastructure
(subscriptionEndHandler, onSubscriptionEnd setter, dispatch check)
but the handler was never registered. One line of wiring fixed it.

### Connection rejection is a protocol limit
When the agent rejects (not accepts) a connection request, nothing
happens on SMP level. No END, no message. The rejection is purely
local to the Desktop App. Only a timeout can catch this case.

---

## What Did NOT Work (and why)

### 1. Receipt msgHash with partial buffer (2 failed attempts)
First tried hashing only JSON body (offset+1), then inner tag + JSON
(offset). Neither matched what the Desktop App computed. The Desktop
App hashes the full serialized AgentMessage before Ratchet encryption.

### 2. Instant rejection detection
Hoped the SMP server would send END when the agent rejects. It does
not - rejection is a local-only action in the Desktop App. No protocol
signal exists for this. Timeout is the only option.

---

## Website File Changes

| File | Version | Change |
|:-----|:--------|:-------|
| chat.js | v9 | onDeliveryReceipt, pendingChecks, upgradeCheck() |
| .eleventy.js | - | require('dotenv'), addGlobalData('gochat') |
| base.njk | v9 | {{ gochat.contactAddress }}, {{ gochat.serverUrl }} |
| .env | NEW | GOCHAT_CONTACT_ADDRESS, GOCHAT_SERVER_URL |

---

## Test Results

- 551+ vitest tests passing (544 from S10 + 7 new receipt tests)
- Delivery receipts: white double checkmarks in both directions
- Connection END: Desktop App deletes -> browser shows "Connection ended"
- Delete notification: browser destroys -> Desktop App notified
- .env integration: contact address loaded from environment variable
- Zero regressions

---

## Known Issues / Not Implemented

- Instant rejection detection (protocol limit, timeout only)
- GoBot (removed from S11 scope, future project)
- simplex-js library extraction (discussed, deferred)
- GoChat Configurator admin tool (discussed, deferred)
- Light theme testing for destruction effects
- Compression bomb mitigation

---

## Infrastructure

- Docker image: `local/smp-server-pr1738` (SMP v6.5.0.11)
- Ports: 5223 (TLS), 8444 (WSS), 5224 (Control)
- Let's Encrypt cert expires: 2026-06-26
- Server: smp.simplego.dev (ssh root@smp.simplego.dev)
- Website: /var/www/simplego.dev/

---

## Build and Deploy Workflow

```powershell
# GoChat bundle
cd C:\Projects\GoChat\smp-web
git pull
npx vitest run
npm run build:browser
copy dist\gochat-client.js "C:\Projects\SimpleGo www\www\src\assets\js\gochat-client.js"

# Website build
cd "C:\Projects\SimpleGo www\www"
npm run build

# Deploy
scp -r "C:\Projects\SimpleGo www\www\_site\*" root@smp.simplego.dev:/var/www/simplego.dev/
```

Chrome WSS cert fix after crash: visit https://smp.simplego.dev:8444

---

## Season 11 Statistics

| Metric | Value |
|:-------|:------|
| Duration | 1 day |
| PRs merged | 5 (#91-#95) |
| Tests added | 7+ |
| Total tests | 551+ |
| Regressions | 0 |
| Website files modified | 3 (chat.js, .eleventy.js, base.njk) |
| New website files | 1 (.env) |
| Briefings created | 4 (receipts, hash fix v3, connection lifecycle, .env) |
| Hash fix attempts | 3 |
| Community questions answered | 1 (security) |

---

## What Was Learned in Season 11

1. **Receipt msgHash covers the full agentMessage.** Not the JSON, not
   inner tag + body. The full buffer including outer tag and APrivHeader.
   Three attempts needed. Document this prominently.

2. **dotenv treats # as comment.** SimpleX contact addresses contain #
   which gets silently truncated. Always quote URLs in .env files.

3. **Dead infrastructure can be valuable.** onSubscriptionEnd existed
   but was never wired. One line of code activated END detection.

4. **Protocol limits are real.** Connection rejection produces no SMP
   signal. Timeout is the only option. Accept it and move on.

5. **ESP32 bug documentation saves browser debug time.** The receipt
   Wire format traps (Word8 count, Word16 rcptInfo) were documented
   from SimpleGo Session 25. Zero debug cycles needed on GoChat.

6. **Post-merge commands are mandatory.** After EVERY PR merge, the
   full build/test/deploy PowerShell block must be provided. No
   exceptions, no asking, no forgetting.

---

## Season Overview (updated)

| Season | Focus | Status | Tests |
|:-------|:------|:-------|:------|
| S1 | Planning and documentation | COMPLETE | - |
| S2 | WebSocket transport | COMPLETE | ~35 |
| S3 | SMP commands | COMPLETE | ~152 |
| S4 | Connection flow | COMPLETE | ~226 |
| S5 | Chat UI + real server | COMPLETE | 485 |
| S6 | Connection request | COMPLETE | 493 |
| S7 | Server upgrade + ALPN | COMPLETE | 493 |
| S8 | v9 auth + MSG + Layer 1 | COMPLETE | 494 |
| S9 | X3DH + Ratchet + CON | COMPLETE | 537 |
| S10 | Bidirectional chat + UX | COMPLETE | 544+ |
| **S11** | **Receipts + Lifecycle + .env** | **COMPLETE** | **551+** |
| S12 | Security hardening | Next | |
| S13 | simplex-js npm library | Planned | |
| S14+ | GRP Profile | Future | |

**Total across all seasons: 551+ tests, 11 seasons complete, 0 regressions.**

---

*Season 11 Protocol by Prinzessin Mausi, 2026-04-02*
*"Your messages don't just arrive. They get confirmed."*
