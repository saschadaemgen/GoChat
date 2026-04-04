# Season 12: Widget Product

**Status:** Complete
**Dates:** 2026-04-04
**Season goal:** Transform GoChat from a development proof-of-concept into a distributable product: single-file widget, CDN distribution, npm packages, demo platform, configurable animations.
**Result:** 15+ PRs merged, 2 npm packages published, CDN + demo infrastructure deployed, 15 bubble animations, live configurator, two websites migrated.

---

## Summary

Season 12 was the product launch season. GoChat went from "it works in development" to "anyone can embed it with one line of code." The entire crypto engine, UI, CSS, and HTML were bundled into a single 461KB JavaScript file distributed via CDN. Two npm packages were published: gochat-widget (the embeddable chat) and simplex-js (the world's first JavaScript SimpleX protocol implementation). Infrastructure was rebuilt with Nginx stream proxy on port 443, a dedicated CDN subdomain, and a demo platform.

---

## Achievements

### 1. Widget Core Bundle (PR #96 + subsequent PRs)

Bundled four separate files (gochat-client.js, chat.js, chat.css, base.njk HTML) into a single `gochat-widget.js` with Shadow DOM isolation. The widget auto-initializes from a script tag with data-attributes for configuration.

**Technical approach:**
- `widget-entry.ts`: Reads data-attributes, injects CSS into Shadow DOM, creates UI
- `widget-ui.ts`: Chat panel, bubble, status, typing indicators, message rendering
- `widget-styles.ts`: All CSS as a template literal string
- `widget-html.ts`: All HTML structure as template literal
- `esbuild.widget.mjs`: Separate build config for the widget bundle
- Shadow DOM prevents style leakage in both directions
- Single script tag distribution: `<script src="..." data-color="#E8A838" async></script>`

**Key files created:** `widget/widget-entry.ts`, `widget/widget-ui.ts`, `widget/widget-styles.ts`, `widget/widget-html.ts`, `smp-web/esbuild.widget.mjs`

### 2. Bug Fix: Crypto Engine Missing

The initial widget build only bundled the UI code, not the crypto engine. The widget fell back to mock mode on every page. Root cause: `widget-entry.ts` did not import from `../src/browser-client.js` and `../src/index.js`. After adding these imports, the bundle grew from ~50KB to 461KB - confirming the full crypto engine was now included.

### 3. Bug Fix: TLS Preflight

Browsers refused WebSocket connections to the SMP server without a prior HTTPS handshake. The SMP server uses ALPN multiplexing on the same port, and browsers need to warm the TLS session cache before upgrading to WebSocket.

**Fix:** Silent `fetch()` call before WebSocket connection in `widget-ui.ts` `startRealChat()`. Works on all browsers including mobile, Chrome incognito, and Firefox.

### 4. Nginx Stream Proxy (Port 443)

Moved SMP WebSocket from port 8444 to port 443 via Nginx stream module with SNI routing. This eliminates the non-standard port from the server URL.

**Architecture:**
- Nginx stream block in `/etc/nginx/nginx.conf` listens on port 443
- SNI map routes `smp.simplego.dev` via raw TCP passthrough to Docker (127.0.0.1:8444)
- All other domains route to Nginx HTTP on 127.0.0.1:8443
- All site configs changed from `listen 443` to `listen 8443`
- Stream module installed: `apt install libnginx-mod-stream`

**Server URL change:** `wss://smp.simplego.dev:8444` became `wss://smp.simplego.dev` (port 443 = default, no port needed in URL)

**Sites on server:** simplego.dev, it-and-more.systems, imogo.de, smp.simplego.dev, cdn.simplego.dev, demo.it-and-more.systems

**Failed approach:** HTTP reverse proxy - SMP server does not speak standard HTTP, raw TCP passthrough was required.

### 5. CDN (cdn.simplego.dev)

- DNS A record at IONOS pointing to 194.164.197.247
- SSL cert expanded: `certbot certonly --nginx -d simplego.dev -d www.simplego.dev -d smp.simplego.dev -d cdn.simplego.dev --expand`
- Nginx config at `/etc/nginx/sites-enabled/cdn.simplego.dev` (port 8443, CORS headers, 1hr cache)
- Widget served from `/var/www/cdn.simplego.dev/gochat.js`
- One file on CDN, all customers auto-update

**CDN update command:**
```bash
scp dist/gochat-widget.js root@smp.simplego.dev:/var/www/cdn.simplego.dev/gochat.js
```

### 6. SimpleGo Website Migration

Removed all separate chat files (chat.css, gc-trigger, gc-overlay, gc-panel-dock, gochat-client.js, chat.js, player/chat coordination) and replaced with single CDN widget script tag using Nunjucks variables. Floating bubble mode only.

### 7. it-and-more.systems Chat

Widget embedded via CDN with `data-color="#E8A838"` (Amber Gold). Separate SimpleX contact address for IT and More Systems business inquiries. Demo link added to nav menu.

### 8. Demo Platform (demo.it-and-more.systems)

- DNS, SSL cert (expanded it-and-more.systems cert), Nginx config
- Root: `/var/www/demo.it-and-more.systems/`
- Full demo page with mega-menu dropdown (all 6 SimpleGo products), GoChat live configurator, animated starfield background, DE/EN language switcher
- Live widget reload: configurator changes color/animation/position and the real widget on the page updates immediately

### 9. Bubble Animations (15 total)

**First batch (9 internal animations):**
shimmer-flip (default), inner-glow, icon-breathe, shimmer, wiggle, color-shift, icon-flip, notification-dot, radar-sweep

**Second batch (6 more):**
pulse, neon, heartbeat, jelly, ring-rotate, float

All animations configurable via `data-bubble-animation` attribute. Animations stop when panel is open, restart when closed. All respect `prefers-reduced-motion`.

**Design decision:** Internal animations only (nothing expanding outside the bubble circle) as default. External pulse rings available as opt-in option.

### 10. README Professionalized

Rewritten from emotional/personal tone to professional product documentation. Quick Start with script tag at top. Commercial licensing line added.

### 11. npm: gochat-widget@1.0.0

Published to npmjs.com. Package directory at `smp-web/package/` containing package.json, gochat-widget.js (461KB), index.d.ts (TypeScript types), README.md.

```bash
npm install gochat-widget
```

https://www.npmjs.com/package/gochat-widget

### 12. npm: simplex-js@1.0.0

The world's first JavaScript implementation of the SimpleX Messaging Protocol. Separate repository at `github.com/saschadaemgen/simplex-js`. All protocol source files from GoChat `smp-web/src/` (24 .ts files) plus xftp-web encoding dependencies.

```bash
npm install simplex-js
```

https://www.npmjs.com/package/simplex-js

---

## Infrastructure Changes

### Server: smp.simplego.dev (194.164.197.247)

**Before Season 12:**
- Port 8444: Docker direct mapping (browser WebSocket)
- Port 5223: Native TLS (CLI/App)
- Nginx: Stopped (not needed since Season 7)

**After Season 12:**
- Port 443: Nginx stream module with SNI routing
  - `smp.simplego.dev` -> raw TCP passthrough to Docker (127.0.0.1:8444)
  - All other domains -> Nginx HTTP (127.0.0.1:8443)
- Port 5223: Native TLS (unchanged)
- All site configs: `listen 8443` (not 443)
- New sites: cdn.simplego.dev, demo.it-and-more.systems
- Stream module: `libnginx-mod-stream`

### SSL Certificates

**simplego.dev cert:** Covers simplego.dev, www.simplego.dev, smp.simplego.dev, cdn.simplego.dev
**it-and-more.systems cert:** Covers it-and-more.systems, www.it-and-more.systems, demo.it-and-more.systems

Both RSA (Keep existing key type when certbot asks).

### Docker

Unchanged: `local/smp-server-pr1738` (SMP v6.5.0.11 from PR #1738). Let's Encrypt cert still requires manual copy to Docker mount after renewal.

---

## Key Decisions

1. **Single-file widget** - Everything in one JS file (461KB) rather than separate CSS/JS/HTML files
2. **Shadow DOM** - Complete isolation over CSS namespacing
3. **CDN distribution model** - One file on server, all customers auto-update
4. **data-attributes for config** - No JavaScript API needed for basic setup
5. **Floating bubble only** - Removed util-bar trigger for external sites
6. **Shimmer + Flip as default animation** - Subtle but noticeable, works with any accent color
7. **Internal animations preferred** - Nothing expanding outside the bubble circle for clean layout
8. **Amber Gold (#E8A838) for it-and-more** - Distinct from SimpleGo Cyan (#45BDD1)
9. **demo.it-and-more.systems** - Demo belongs to the business, not the open-source project
10. **Free + Paid model** - CDN widget free (AGPL-3.0), premium features behind API key (future)
11. **Port 443 via stream proxy** - Clean URL without port number

---

## Business Model (Confirmed)

- **Free:** Widget via CDN, basic features, self-hosted option, AGPL-3.0
- **Paid:** Installation service, custom theming, server hosting, support, premium features
- **Future:** API key system for premium features, domain whitelisting, admin panel (GoBot)
- **Dual licensing:** AGPL-3.0 free + commercial license for enterprise (future)

---

## Key Discoveries and Traps

### New traps added this season

45. **Browser TLS preflight required** - Browsers cannot connect WebSocket to SMP server without prior HTTPS fetch to warm TLS cache (ALPN multiplexing issue)
46. **Nginx stream proxy for SMP** - HTTP reverse proxy does NOT work (SMP is not HTTP). Must use stream module with SNI preread for raw TCP passthrough
47. **Port 443 requires stream block** - All existing site configs must change from `listen 443` to `listen 8443` when stream block handles port 443
48. **Widget crypto engine import** - widget-entry.ts MUST import from `../src/browser-client.js` and `../src/index.js` or the bundle only contains UI code (~50KB instead of 461KB)
49. **CDN CORS headers** - Widget loaded cross-origin needs `Access-Control-Allow-Origin *` on CDN response
50. **npm name "simplex" taken** - Published as "simplex-js" instead
51. **npm 2FA required** - Granular Access Token with "Bypass 2FA" checkbox must be enabled for publishing
52. **esbuild xftp-web alias** - Must point to `xftp-web/src` not `xftp-web/dist` (source files, not compiled)

### Confirmed from previous seasons

- `esbuild.config.mjs` must use `format: "iife"` not `format: "esm"` for browser bundle
- `console.log` not `console.debug` for browser debugging
- GitHub defaults to wrong base repo for PRs from fork

---

## Deployment Workflow (Established This Season)

After every PR merge:

```powershell
cd C:\Projects\GoChat\smp-web
git checkout feat/simplego-support-chat
git pull
npx vitest run
npm run build:widget
scp dist/gochat-widget.js root@smp.simplego.dev:/var/www/cdn.simplego.dev/gochat.js
```

Both simplego.dev and it-and-more.systems update automatically via CDN. No rebuild of either website needed.

---

## Files Created This Season

### Widget source (committed)
- `widget/widget-entry.ts` - Entry point, data-attribute parsing, Shadow DOM setup
- `widget/widget-ui.ts` - UI logic, panel, bubble, chat, animations
- `widget/widget-styles.ts` - CSS as template literal
- `widget/widget-html.ts` - HTML as template literal
- `smp-web/esbuild.widget.mjs` - Widget build config

### npm packages (published)
- `smp-web/package/` - gochat-widget npm package files
- `C:\Projects\simplex-js/` - simplex-js repository and npm package

### Server configs (on smp.simplego.dev)
- `/etc/nginx/nginx.conf` - Stream block at bottom for SNI routing
- `/etc/nginx/sites-enabled/cdn.simplego.dev` - CDN config
- `/etc/nginx/sites-enabled/demo.it-and-more.systems` - Demo config
- `/var/www/cdn.simplego.dev/gochat.js` - Widget file
- `/var/www/demo.it-and-more.systems/index.html` - Demo page

---

## Test Count

551+ tests passing (unchanged from Season 11 - widget code is not unit-tested, protocol tests remain stable).

---

## What Was NOT Done

- **Security hardening** (CSP, SRI, Web Worker) - moved to Season 13
- **Branch rename** to `main` - scheduled for Season 12 closing
- **Demo page polish** - Sascha will redesign the demo page himself
- **API key system** - future feature for premium tier
- **Admin panel** - future GoBot feature

---

## Season 13 Preview

**Security Hardening + Review**

Production-ready security: CSP, SRI, dependency vendoring, input sanitization review, trust boundary documentation, crypto review, error handling, performance optimization.

---

## Changelog Entry

| Date | Change |
|------|--------|
| 2026-04-04 | Season 12 complete. Widget product built and deployed. Single-file bundle (461KB), Shadow DOM isolation, CDN distribution (cdn.simplego.dev), 15 bubble animations, live configurator demo (demo.it-and-more.systems), Nginx stream proxy on port 443, 2 npm packages published (gochat-widget@1.0.0, simplex-js@1.0.0). SimpleGo and it-and-more.systems migrated to CDN widget. |

---

*Season 12 closing protocol by Prinzessin Mausi, 2026-04-04*
