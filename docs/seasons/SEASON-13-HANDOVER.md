# Season 13 Handover: Security Hardening

**For:** Der Ritter (Claude Code)
**Repository:** `saschadaemgen/GoChat`
**Branch:** `feat/simplego-support-chat` (to be renamed to `main` at season start)
**Working directory:** `C:\Projects\GoChat\smp-web`
**Previous season:** Season 12 (Widget Product) - Complete

---

## Context

GoChat is now a distributable product. The widget (461KB single file) is live on cdn.simplego.dev, embedded on simplego.dev and it-and-more.systems, published on npm as gochat-widget@1.0.0. The simplex-js protocol library is published separately. 15 bubble animations are configurable via data-attributes. A demo platform runs at demo.it-and-more.systems.

Season 13 focuses on making this product production-ready from a security perspective.

---

## Goal

Production-ready security hardening: CSP, SRI, dependency vendoring, input sanitization review, trust boundary documentation, crypto operations review, error handling, and performance optimization.

---

## Scope

### Phase 1: Content Security Policy (CSP)

Add strict nonce-based CSP to the SimpleGo website and document CSP requirements for customers embedding the widget.

Key considerations:
- The widget loads from cdn.simplego.dev (cross-origin)
- The widget opens WebSocket to smp.simplego.dev
- CSP must include `script-src` for CDN and `connect-src` for WSS
- Nonce-based approach for inline scripts
- Document recommended CSP headers for customer websites

### Phase 2: Subresource Integrity (SRI)

Add SRI hash to the widget script tag so browsers verify the file was not tampered with.

```html
<script src="https://cdn.simplego.dev/gochat.js"
        integrity="sha384-..."
        crossorigin="anonymous"
        data-contact-address="..."
        data-server-url="wss://smp.simplego.dev"
        async></script>
```

Challenge: SRI hash changes with every build. Need a workflow that updates the hash after CDN deployment.

### Phase 3: Dependency vendoring

Vendor @noble/curves, @noble/hashes, @noble/ciphers, and tweetnacl into the repository. This eliminates supply chain risk from npm.

Steps:
- Copy current versions into `vendor/` directory
- Update import paths or esbuild aliases
- Document vendored versions and their audit status
- Add script to check for upstream security patches

### Phase 4: Input sanitization review

Review all user input handling:
- `escHtml()` already exists for HTML escaping
- Evaluate if DOMPurify is needed (Shadow DOM provides isolation)
- Check visitor name input for injection
- Check welcome message handling
- Review all innerHTML usage in widget code

### Phase 5: Widget security audit

Shadow DOM specific security:
- Verify no script injection through data-attributes
- Verify no CSS injection through CSS Custom Properties
- Check event handler boundaries (click, message events)
- Verify postMessage is not used (attack vector)
- Document Shadow DOM security boundaries

### Phase 6: Crypto operations review

Review all cryptographic operations:
- Verify no timing side channels in comparison operations
- Check key material cleanup after use
- Review nonce generation (must be unique per message)
- Verify HKDF parameters match SimpleX specification
- Check for proper error handling on decryption failure

### Phase 7: Documentation

- Trust boundary document (honest about browser limitations)
- Security model documentation for customers
- Incident response plan
- Update README security section

---

## Current architecture

```
Browser
  gochat-widget.js (461KB, Shadow DOM)
    widget-entry.ts -> reads data-attributes, creates Shadow DOM
    widget-ui.ts -> UI logic, animations, panel
    widget-styles.ts -> CSS (template literal)
    widget-html.ts -> HTML (template literal)
    src/*.ts -> 25+ protocol + crypto files
      |
  CDN: cdn.simplego.dev/gochat.js
      |
  WSS: smp.simplego.dev:443 (Nginx stream -> Docker:8444)
      |
  SMP Server v6.5.0.11 (PR #1738)
      |
  SimpleX App (Desktop/Mobile)
```

---

## Server infrastructure

- **smp.simplego.dev** (194.164.197.247)
- Port 443: Nginx stream module, SNI routing
  - `smp.simplego.dev` -> TCP passthrough to Docker 127.0.0.1:8444
  - All others -> Nginx HTTP 127.0.0.1:8443
- Port 5223: Native TLS (CLI/App)
- Docker: `local/smp-server-pr1738` (SMP v6.5.0.11)
- SSL: RSA Let's Encrypt (simplego.dev, www, smp, cdn subdomains)
- CDN root: `/var/www/cdn.simplego.dev/`
- Demo root: `/var/www/demo.it-and-more.systems/`

---

## Build and deploy workflow

```powershell
cd C:\Projects\GoChat\smp-web
git checkout feat/simplego-support-chat   # or main after rename
git pull
npx vitest run
npm run build:widget
scp dist/gochat-widget.js root@smp.simplego.dev:/var/www/cdn.simplego.dev/gochat.js
```

---

## npm packages

- **gochat-widget@1.0.0** - https://www.npmjs.com/package/gochat-widget
  - Package dir: `smp-web/package/`
  - After widget build: `copy dist/gochat-widget.js package/gochat-widget.js` then `cd package && npm publish`

- **simplex-js@1.0.0** - https://www.npmjs.com/package/simplex-js
  - Separate repo: `C:\Projects\simplex-js`
  - Build: `npm run build` then `npm publish`

---

## Known traps (from Season 12)

45. Browser TLS preflight required for WebSocket
46. Nginx stream proxy for SMP (not HTTP reverse proxy)
47. Port 443 stream block requires all sites on 8443
48. Widget crypto engine import required in widget-entry.ts
49. CDN CORS headers needed
50. npm name "simplex" taken, use "simplex-js"
51. npm 2FA bypass required for Granular Access Token
52. esbuild xftp-web alias: point to src/ not dist/

See CLAUDE.md for full trap list (1-52).

---

## Files to modify this season

Primarily widget files and configuration:
- `widget/widget-entry.ts` - CSP nonce support
- `widget/widget-ui.ts` - input sanitization
- `widget/widget-styles.ts` - CSP-safe styles
- Website configs for CSP headers
- `vendor/` directory (new) for vendored dependencies
- `docs/SECURITY-HARDENING-ROADMAP.md` - update progress

---

## Branch naming

Season 13 tasks use branches: `feat/security-{description}` from `feat/simplego-support-chat` (or `main` after rename).

PR target: `feat/simplego-support-chat` (or `main`)
PR title format: `feat(security): description` or `fix(security): description`

---

## Success criteria

1. CSP headers deployed on simplego.dev with no widget breakage
2. SRI hash on widget script tag, verified by browser
3. All @noble packages vendored, npm supply chain eliminated
4. Input sanitization audit complete, no injection vectors
5. Shadow DOM security boundaries documented
6. Crypto operations reviewed, no timing side channels
7. Trust boundary document published
8. All tests still passing (551+)

---

## Post-merge workflow (MANDATORY)

After EVERY PR merge:

```powershell
cd C:\Projects\GoChat\smp-web
git checkout feat/simplego-support-chat
git pull
npx vitest run
npm run build:widget
scp dist/gochat-widget.js root@smp.simplego.dev:/var/www/cdn.simplego.dev/gochat.js
```

---

## Pending from Season 12

- Branch rename `feat/simplego-support-chat` to `main` (do at season start)
- Demo page redesign (Sascha does this himself)
- npm token should be rotated (token was shown in chat)

---

*Season 13 handover by Prinzessin Mausi, 2026-04-04*
