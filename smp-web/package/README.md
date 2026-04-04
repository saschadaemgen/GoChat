# GoChat Widget

End-to-end encrypted chat widget for any website. One script tag, full E2E encryption, Shadow DOM isolated.

Built on the [SimpleX Messaging Protocol](https://simplex.chat/). Same cryptography as Signal (X3DH + Double Ratchet, AES-256-GCM).

## CDN (recommended)

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="your-simplex-address"
        data-server-url="wss://smp.simplego.dev"
        async></script>
```

## npm

```bash
npm install gochat-widget
```

Then include in your HTML:

```html
<script src="node_modules/gochat-widget/gochat-widget.js"
        data-contact-address="your-simplex-address"
        data-server-url="wss://smp.simplego.dev"
        async></script>
```

Or import in a bundler (Webpack, Vite, esbuild):

```javascript
import 'gochat-widget';
```

Note: The widget auto-initializes on load. When importing via bundler, set the config programmatically before the script executes, or use the CDN version with data-attributes.

## Configuration

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-contact-address` | required | Your SimpleX contact address |
| `data-server-url` | required | WebSocket server URL |
| `data-color` | `#45bdd1` | Primary accent color |
| `data-bubble-animation` | `shimmer-flip` | Bubble animation style |
| `data-position` | `bottom-right` | Widget position |
| `data-name` | `GoChat` | Header title |
| `data-welcome` | - | Welcome message after connect |
| `data-trigger` | `floating` | `floating` (bubble) or `custom` (API only) |
| `data-z-index` | `10000` | CSS z-index |

### Animations

`shimmer-flip`, `inner-glow`, `icon-breathe`, `shimmer`, `wiggle`, `color-shift`, `icon-flip`, `radar-sweep`, `pulse`, `neon`, `heartbeat`, `jelly`, `ring-rotate`, `float`, `none`

### Custom trigger

```html
<script src="https://cdn.simplego.dev/gochat.js"
        data-contact-address="..."
        data-server-url="wss://smp.simplego.dev"
        data-trigger="custom"
        async></script>

<button onclick="GoChat.open()">Chat</button>
```

### CSS theming

```css
:root {
  --gochat-color-primary: #ff6600;
  --gochat-color-background: #1a1a1a;
  --gochat-color-text: #ffffff;
}
```

## API

```javascript
GoChat.open()           // Open chat panel
GoChat.close()          // Close chat panel
GoChat.toggle()         // Toggle open/close
GoChat.isOpen()         // Returns boolean
GoChat.reset()          // Reset to initial state
GoChat.setUnread(3)     // Set badge count
```

## Server requirement

GoChat requires an SMP server with WebSocket support. Use `wss://smp.simplego.dev` (free) or [self-host from the smp-web branch](https://github.com/simplex-chat/simplexmq/tree/smp-web).

## License

AGPL-3.0. Commercial licensing available: info@it-and-more.systems

## Links

- [GitHub](https://github.com/saschadaemgen/GoChat)
- [Live Demo](https://demo.it-and-more.systems)
- [IT and More Systems](https://it-and-more.systems)
