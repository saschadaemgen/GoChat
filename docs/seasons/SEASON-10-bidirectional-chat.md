# Season 10 Protocol
# GoChat - Bidirectional E2E Chat, Desktop App, Multi-Step UX
# Date: 2026-03-31 to 2026-04-01

---

## Season Summary

Season 10 was the largest season in GoChat history. Starting from
Season 9's "HELLO received, CONNECTION ESTABLISHED", it delivered
the complete end-user experience: bidirectional encrypted messaging
with the SimpleX Desktop App, a polished multi-step UX flow with
visitor name support, offline messaging, and a Hollywood-grade
cyberpunk destruction sequence for chat deletion.

The season was a marathon spanning two days, involving 11 GoChat PRs
(#79-#89), 8 website file iterations (v1-v8 of chat.css, chat.js,
base.njk), multiple architectural pivots (admin panel to .env, DOM
injection to pure API, single-step to multi-step flow), and four
separate destruction sequence bug hunts.

**Duration:** 2 days (2026-03-31 to 2026-04-01)
**PRs merged:** #79 through #89 (11 PRs)
**Tests:** 537 -> 544+ (zero regressions)
**Website file versions:** v1 through v8 (chat.css, chat.js, base.njk)
**Status:** COMPLETE - bidirectional E2E chat live on simplego.dev

---

## What Works After Season 10

### Complete E2E Chat Pipeline
1. WebSocket + SMP v9 Handshake (Season 5-8)
2. Queue creation + AgentInvitation with visitor name (Season 6, S10)
3. Server-level MSG decrypt (Season 8)
4. Layer 1 NaCl decrypt (Season 8)
5. AgentConfirmation parse with PQ KEM (Season 9)
6. X3DH key agreement (Season 9)
7. Double Ratchet init + decrypt (Season 9)
8. HELLO receive + send (Season 9, S10)
9. Chat message send + receive (Season 10)
10. PING/PONG keepalive 30s (Season 10)
11. x.direct.del event handling (Season 10)
12. Visitor name in SimpleX Desktop App (Season 10)

### Complete UX Flow
- Step 1: "Start Encrypted Chat" button
- Step 2: Name input with "Start Chat" / "Guest" buttons
- Step 3: Waiting spinner with "Leave an Offline Message" option
- Step 4: Connected chat with E2E encryption badge
- Delete: Confirm slider + Hollywood destruction sequence
- Reset: Clean return to Step 1

---

## The Journey: From HELLO to Complete Chat Experience

### Phase 1: Fix the Pipeline (PRs #79-#84)

Season 9 left three blockers: duplicate WebSocket connections after
HELLO, no outgoing messages, and no HELLO send from browser.

| PR | Problem | Root Cause | Fix |
|:---|:--------|:-----------|:----|
| #79 | Duplicate WebSocket connections after HELLO | New WS opened for each queue operation | Single WS per queue, prevent reconnect |
| #80 | Cannot send HELLO or chat messages | agentVersion=7 used for messages | agentVersion=1 for AgentMsgEnvelope (not 7!) |
| #81 | Connection drops after ~60s | No keepalive | PING/PONG every 30 seconds after handshake |
| #82 | sendHello crashes | bodyPadSize 15696 wrong | bodyPadSize 15692 (4 bytes less), state transition fix |
| #83 | sendChatMessage sends plaintext to wrong queue | Not wired through crypto pipeline | Route through rcEncrypt + NaCl to reply queue |
| #84 | CLI shows A_MESSAGE | sndMsgId encoded as Word32 (4 bytes) | sndMsgId is Word64 BE (8 bytes, 4 missing zeros) |

After PR #84: First successful bidirectional E2E chat between browser
and SimpleX CLI. Messages sent from browser, encrypted through Double
Ratchet, decrypted by CLI. Messages from CLI decrypted and displayed
in browser console.

### Phase 2: Desktop App Integration (PR #85)

Switched from SimpleX CLI to SimpleX Desktop App as the support agent
interface. Created new contact address in Desktop App settings,
updated base.njk data-contact-address. Added message buffer for
pre-connection queuing and Desktop App setup guide to README.

### Phase 3: Admin Panel Debate and .env Decision (PR #86-#87)

**The admin.html approach (PR #86):** Built a Passkey-protected admin
panel (admin.html + gochat-admin.js) for configuring the contact
address. Deployed, tested, worked technically.

**The Prinz said no.** "Das geht gar nicht, schlage mal Alternativen
vor die sicherer und zeitgemaesser sind!"

**Four alternatives proposed:**
1. Admin mode inside the widget (secret URL param + Passkey)
2. Server-side admin API (Express in Docker)
3. Config via SimpleX Bot (GoBot - configure GoChat THROUGH GoChat)
4. Build-time .env file (zero attack surface)

**Decision:** .env NOW, GoBot LATER. The admin.html approach was
immediately deprecated. GoBot was noted for Season 11+.

**PR #87 delivered:**
- `resolveContactAddress()` with priority chain:
  1. `window.GOCHAT_CONFIG.contactAddress` (future GoBot)
  2. HTML `data-contact-address` on `#gc-panel-dock`
  3. `DEFAULT_CONTACT_ADDRESS` in bundle fallback
- `resolveServerUrl()` with same priority chain
- `generateRandomVisitorName()` exported on GoChatClient
- .env.example with placeholder values in GoChat repo
- gochat-admin.js deleted from website assets

### Phase 4: The DOM Injection Disaster (PR #88-#89)

**PR #88 - The wrong approach:** The Ritter built the visitor name
input INSIDE gochat-client.js using DOM injection. The `showNameInput()`
method did `container.innerHTML = ""` on `#gc-start`, destroying the
entire multi-step flow that chat.js and base.njk provided. Every
visitor saw broken buttons, wrong styling, and no step navigation.

**Three bugs found in the deployed bundle:**

1. **showNameInput() destroys external UI (CRITICAL):**
   `container.innerHTML = ""` wipes the step-1 content, then injects
   its own buttons with wrong CSS classes. The multi-step flow from
   chat.js was completely overwritten.

2. **setStatus("connected") fires immediately (CRITICAL):**
   After sending the invitation, `connectWithName()` immediately called
   `setStatus("connected")`, skipping the entire waiting screen. The
   visitor saw the chat input before the agent even received the request.

3. **Raw JSON displayed as chat messages (MEDIUM):**
   When the agent deleted the contact, `x.direct.del` appeared as raw
   JSON in a chat bubble instead of "Connection ended".

**PR #89 - The fix:** Complete architectural cleanup.
- Deleted `showNameInput()` entirely (70+ lines of DOM injection removed)
- `connect(displayName?)` accepts the name directly from external UI
- "connected" only fires from state machine after HELLO received
- "pending" for intermediate states (PENDING, CONFIRMED)
- `handleChatPayload()` parses incoming JSON events:
  - `x.msg.new` -> extract text, display in chat
  - `x.direct.del` -> "Connection ended", set offline
  - Unknown events -> silently logged, not displayed

**Key architectural rule established:** gochat-client.js is a PURE
API library. It must NEVER create DOM elements. All UI lives in
chat.js + chat.css + base.njk on the website.

### Phase 5: Multi-Step UX Flow (Website v1-v4)

With the GoChat bundle fixed, Prinzessin Mausi rebuilt the website
files from scratch through four iterations:

**v1 (chat.js, base.njk):** Basic name input added to start view.
Name + "Start Chat" + "Stay Anonymous" all visible at once.
Problem: ugly, asymmetric, no flow.

**v2 (chat.css, chat.js, base.njk):** Proper CSS with gc-name-input,
gc-start-actions, gc-btn-alt classes. Styling matches design system.
Problem: still all on one screen, no step navigation.

**v3 (complete rewrite):** Multi-step flow introduced:
- Step 1 (gc-step-start): Original "Start Encrypted Chat" button
- Step 2 (gc-step-name): Name input + "Start Chat" / "Guest"
- Step 3 (gc-step-waiting): Spinner + "Waiting for support" + offline option
- Step 4 (gc-chat-view): Connected chat with input
- CSS: gc-step classes with fade-in animations
- JS: showStep() state machine, beginConnection(), offline mode

**v4:** Fixed `client.connect(displayName)` call (was missing name
parameter after PR #89 changes). Removed 60-second timeout for
offline prompt - available immediately in waiting step.

### Phase 6: Delete Confirmation + Destruction Sequence (v5-v8)

**v5 (base.njk):** Header redesign with gc-header-main and
gc-header-confirm slider. Red X button (16px, rgba(255,80,80)).
Click X: spins 180 degrees, confirmation bar slides in from right.
"Delete this chat?" with Delete/Cancel buttons.

**v6 (chat.css, chat.js, base.njk):** First destruction sequence.
Red flash, dissolving messages, "MESSAGES DESTROYED" text. Offline
end button with destruction. Problems: effects too subtle, red
instead of cyan, sparks at wrong position.

**v7 (Terminator Edition):** Close/Open text on minimize button,
destruction with screen shake, glitch effects, explosion particles.
Problems: "Close" label looked like X button description, needed
separator. Effects still landing at 0,0 (top-left corner).

**v8 (Hollywood FINAL):** Final version with all fixes:
- Minimize as pill button with border ("Minimize" text, not dynamic)
- Vertical separator between Minimize and X
- Cyan neon color scheme (rgba(69,189,209,...)) for all effects
- Screen shake (3 phases), intense flash (8 pulses)
- Scan beam sweeps top to bottom with glow
- Each message: GLITCH (horizontal jitter, hue-rotate, skew)
  then EXPLODE (brightness blast, scale up, blur out)
- 12 cyan sparks per bubble with glow shadows + 3 trail particles
- Shockwave rings expand from each bubble center
- "MESSAGES DESTROYED" text SLAMS in (scaleY squeeze, bounce)
- Shield-X icon rotates in with blur-to-sharp
- Panel closes smoothly, name input cleared, resets to Step 1

### Destruction Sequence Bug Hunt

| Bug | Symptom | Root Cause | Fix |
|:----|:--------|:-----------|:----|
| Sparks at 0,0 | All effects in top-left corner | chatView display:none, getBoundingClientRect returns 0 | Keep chatView visible during destruction |
| Messages vanish instantly | No glitch/explode animation visible | CSS gc-msg-in animation conflicts with gc-glitch | Direct el.style.animation override |
| Layout not ready | Positions wrong after display change | requestAnimationFrame fires before layout | Double requestAnimationFrame before reading positions |
| Step views visible during destruction | Start/Name step shows through destruction | Only messages hidden, not steps | Hide all steps at destruction start, keep chatView |
| Name persists after reset | Old name in input on new chat | nameInput.value not cleared | Add nameInput.value='' in resetChat() |

---

## PRs and Key Changes

| PR | Title | Key Achievement |
|:---|:------|:----------------|
| #79 | fix(ws): prevent duplicate WebSocket connections after HELLO | Single WS per queue |
| #80 | feat(chat): send HELLO and chat messages from browser | agentVersion=1 for outgoing |
| #81 | feat(ws): activate PING/PONG keep-alive after SMP handshake | 30s interval keepalive |
| #82 | fix(chat): fix sendHello crash, state transition, PONG | bodyPadSize 15696->15692 |
| #83 | fix(chat): wire sendChatMessage through encrypted pipeline | Was plaintext to wrong queue |
| #84 | fix(agent): encode sndMsgId as Word64 BE in APrivHeader | 4 missing zero bytes |
| #85 | feat(chat): message buffer + Desktop App docs | Desktop App replaces CLI |
| #86 | feat(admin): Passkey admin panel + contact address update | DEPRECATED same day |
| #87 | feat: visitor name field + .env config + admin config | resolveContactAddress() chain |
| #88 | feat(ui): visitor name input built into widget | DOM injection - WRONG approach |
| #89 | fix(client): remove DOM injection, fix status + events | Pure API, handleChatPayload() |

---

## Website File Evolution

All website files live in SimpleGo www (NOT in GoChat repo).

| Version | chat.css | chat.js | base.njk | Key Change |
|:--------|:---------|:--------|:---------|:-----------|
| v1 | Original S5 | Added name refs | Added name input HTML | Basic name support |
| v2 | gc-name-input, gc-btn-alt | startChat(name) | gc-start-actions div | Styled name input |
| v3 | gc-step classes, animations | Multi-step showStep() | 4 step views in HTML | Complete UX flow |
| v4 | No change | connect(displayName) fix | No change | Bug fix |
| v5 | No change | No change | gc-header-main/confirm | Delete confirmation header |
| v6 | Destruction CSS | Destruction + confirm flow | Confirm bar HTML | First destruction |
| v7 | Minimize text, separator | Close/Open text toggle | Minimize pill + separator | Header redesign |
| v8 | Cyan neon, Hollywood effects | Glitch, explode, shockwave, sparks | Static "Minimize" text | Final destruction |

**IMPORTANT:** base.njk lives in `_includes/` NOT `src/_includes/`!
SimpleGo www is NOT a git repo - never run git commands there.

---

## Config Decisions

### Admin Panel: DEPRECATED (same day as created)
Passkey admin.html approach built in PR #86, deprecated immediately
after Sascha's feedback. Replaced by:
- **NOW:** .env file at build time (zero attack surface)
- **LATER:** GoBot (SimpleX bot for runtime config via chat commands)

### Widget Architecture: Pure API
gochat-client.js must NEVER create DOM elements. Lesson learned from
PR #88 where showNameInput() destroyed the external multi-step flow.
The widget exports: connect(displayName?), send(text), disconnect(),
onMessage, onStatusChange, onError. All UI in chat.js.

### Desktop App replaces CLI
Support agent uses SimpleX Desktop App (not CLI). Contact address
created in Desktop App settings. Easier for non-technical users.

---

## Protocol Discoveries (Season 10)

### agentVersion split
- AgentConfirmation (handshake): agentVersion=7
- AgentMsgEnvelope (HELLO, chat messages): agentVersion=**1**
- Using 7 for messages causes A_VERSION on the receiver

### sndMsgId is Word64 BE
APrivHeader contains sndMsgId as Int64 Big-Endian (8 bytes). Season 9
used Word32 (4 bytes), causing 4 missing zero bytes and A_MESSAGE
errors on the CLI. Fixed in PR #84.

### bodyPadSize for HELLO
sendHello used bodyPadSize 15696 (from Season 9 calculations). The
correct value is 15692 (4 bytes less due to different header format
for HELLO vs chat messages). Caused crash in PR #82.

### Status must come from state machine
Setting "connected" immediately after invitation send skips the
entire waiting flow. The correct sequence:
- "connecting" during WebSocket + handshake
- "pending" after invitation sent (waiting for agent)
- "connected" ONLY after HELLO received from state machine

### x.direct.del event
When the agent deletes a contact in SimpleX, the browser receives:
`{"v":"1-16","event":"x.direct.del","params":{}}`
Must be parsed and displayed as "Connection ended", not raw JSON.

### Chrome WSS cert issue
After browser crash or long idle, Chrome rejects the WSS connection
to smp.simplego.dev:8444. Fix: visit https://smp.simplego.dev:8444
in a new tab to re-accept the self-signed cert.

---

## What Did NOT Work (and why)

### 1. Admin panel (admin.html + Passkey)
Built, deployed, immediately deprecated. Client-side Passkey
verification is not truly secure, and the workflow (generate config,
download, copy, rebuild) is worse than editing .env directly.

### 2. DOM injection in gochat-client.js
The Ritter built the visitor name input inside the widget bundle
using `container.innerHTML = ""`. This destroyed the external
multi-step flow, caused wrong button styling, and skipped the
waiting screen. Lesson: the widget is an API, not a UI.

### 3. Destruction effects at wrong position
Three iterations needed to fix getBoundingClientRect() returning 0,0
when chatView was display:none. Required: keep chatView visible
during destruction, double requestAnimationFrame for layout, direct
el.style.animation override to prevent CSS conflicts.

### 4. Red destruction effects
First version used red (rgba(255,30,30,...)). Sascha wanted cyan
neon to match the SimpleGo design system. Changed all flash,
scanlines, sparks, icon, text, and lines to rgba(69,189,209,...).

---

## Current Contact Address

```
https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow%3D%40smp.simplego.dev%2FrvmTVkY_dMRMA9L4jlaQsDPZeyCUktxq%23%2F%3Fv%3D1-4%26dh%3DMCowBQYDK2VuAyEAnIg32wSmfYdGHlO7qthFkn2wZmwcF2cOJHbmVnkkZjI%253D%26q%3Dc
```

Lives in base.njk data-contact-address AND as DEFAULT_CONTACT_ADDRESS
in gochat-client.js bundle. The base.njk version takes priority.

---

## Test Results

- 544+ vitest tests passing (537 from S9 + new)
- Bidirectional chat: browser to Desktop App and back
- Visitor name appears correctly in Desktop App contact list
- Offline message queued and delivered when agent comes online
- x.direct.del shows "Connection ended" + offline status
- Destruction sequence: sparks at correct message positions
- Name input cleared on chat reset
- PING/PONG keepalive every 30 seconds
- Multi-step flow: Start -> Name -> Waiting -> Chat works correctly
- Delete confirmation: header slide, cancel works, delete triggers destruction

---

## Known Issues / Not Implemented

- Connection rejection handling (agent rejects instead of accepts)
- Delivery receipts (double checkmarks in UI)
- .env integration for SimpleGo website (dotenv + .eleventy.js)
- Light theme testing for destruction effects
- x.direct.del may be broken after later PRs (needs investigation)
- Compression bomb mitigation
- Private Message Routing

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

## Season 10 Statistics

| Metric | Value |
|:-------|:------|
| Duration | 2 days |
| PRs merged | 11 (#79-#89) |
| Tests added | 7+ |
| Total tests | 544+ |
| Regressions | 0 |
| Website file versions | 8 (v1-v8) |
| Website files modified | 3 (chat.css, chat.js, base.njk) |
| GoChat source files modified | ~6 (browser-client.ts, connection.ts, etc.) |
| Briefings created | 4 (Phase 6, Phase 7, Phase 7 Updated, Bugfix) |
| Destruction sequence bugs fixed | 5 |
| Architectural pivots | 3 (admin panel, DOM injection, UX flow) |
| Deployments to production | 10+ |

---

## What Was Learned in Season 10

1. **The widget must be a pure API.** DOM injection from gochat-client.js
   destroyed the external UI. The architectural boundary is clear:
   gochat-client.js = protocol + crypto, chat.js = UI.

2. **Status must come from the state machine.** Setting "connected"
   immediately after invitation send skips the entire waiting flow.
   Only the state machine (after HELLO) can transition to connected.

3. **Desktop App is better than CLI.** Non-technical support agents
   can use the SimpleX Desktop App. No terminal needed.

4. **Admin panels are unnecessary for config.** A .env file at build
   time has zero attack surface and simpler workflow. GoBot for
   runtime config is the future.

5. **getBoundingClientRect() returns 0,0 for hidden elements.**
   The destruction sequence needed double requestAnimationFrame and
   visible chatView to get correct spark positions.

6. **CSS animation conflicts are silent.** The existing gc-msg-in
   animation prevented gc-glitch from firing. Direct el.style.animation
   override was the only reliable fix.

7. **The three-role workflow scales to complex UX work.** Prinzessin
   Mausi designed the multi-step flow and destruction sequence,
   Der Ritter implemented the GoChat PRs, Sascha tested and directed.
   Website files were built collaboratively in the planning chat.

8. **base.njk lives in _includes/ NOT src/_includes/.** This caused
   confusion multiple times. SimpleGo www is NOT a git repo.

9. **Cyan neon is the brand color.** All effects, glows, and accents
   use rgba(69,189,209,...) - matching the SimpleGo design system.

10. **Marathon sessions produce results but accumulate debt.** 11 PRs
    in two days is impressive, but the UX went through 8 iterations
    that could have been fewer with more upfront planning.

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
| **S10** | **Bidirectional chat + UX** | **COMPLETE** | **544+** |
| S11 | GoBot + .env + Polish | Next | |
| S12 | Security hardening | Planned | |
| S13 | simplex-js npm library | Planned | |
| S14+ | GRP Profile | Future | |

**Total across all seasons: 544+ tests, 11 seasons, 0 regressions.**

---

*Season 10 Protocol by Prinzessin Mausi, 2026-04-01*
*"Your messages don't just disappear. They detonate."*
