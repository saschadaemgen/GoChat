// GoChat Widget Entry Point
// Self-contained embeddable widget with Shadow DOM isolation.
//
// Usage:
//   <script src="gochat-widget.js"
//           data-contact-address="simplex://contact#/..."
//           data-server-url="wss://smp.simplego.dev:8444"
//           async></script>

import {WIDGET_CSS} from './widget-styles.js'
import {WIDGET_TEMPLATE, BUBBLE_TEMPLATE} from './widget-template.js'
import {initUI} from './widget-ui.js'
import type {WidgetConfig} from './widget-ui.js'

// Import crypto engine from existing source - bundled into the widget
import {createBrowserClient, generateRandomVisitorName, DEFAULT_CONTACT_ADDRESS} from '../src/browser-client.js'
import * as GoChatClientExports from '../src/index.js'

// Expose on window so widget-ui.ts can find them
;(window as any).createBrowserClient = createBrowserClient
;(window as any).GoChatClient = {
  ...GoChatClientExports,
  createBrowserClient,
  generateRandomVisitorName,
  DEFAULT_CONTACT_ADDRESS,
}

// Capture script tag immediately (only available during initial execution)
const scriptTag = document.currentScript as HTMLScriptElement | null

/**
 * Normalize SimpleX contact address formats:
 *   simplex://contact#/...  -> https://simplex.chat/contact#/...
 *   https://simplex.chat/... -> unchanged
 *   anything else           -> unchanged
 */
export function normalizeContactAddress(addr: string): string {
  if (addr.startsWith('simplex://')) {
    return 'https://simplex.chat/' + addr.slice('simplex://'.length)
  }
  return addr
}

function initWidget(): void {
  // Read config from script tag data attributes
  const rawAddress = scriptTag?.getAttribute('data-contact-address') || ''
  const config: WidgetConfig = {
    contactAddress: normalizeContactAddress(rawAddress),
    serverUrl: scriptTag?.getAttribute('data-server-url') || '',
    position: scriptTag?.getAttribute('data-position') || 'bottom-right',
    trigger: scriptTag?.getAttribute('data-trigger') || 'floating',
    name: scriptTag?.getAttribute('data-name') || 'GoChat',
    welcome: scriptTag?.getAttribute('data-welcome') || '',
    color: scriptTag?.getAttribute('data-color') || '#45bdd1',
    bubbleAnimation: scriptTag?.getAttribute('data-bubble-animation') || 'shimmer-flip',
    lang: scriptTag?.getAttribute('data-lang') || 'en',
  }
  const zIndex = parseInt(scriptTag?.getAttribute('data-z-index') || '10000', 10)

  // Check Shadow DOM support
  if (typeof HTMLElement.prototype.attachShadow !== 'function') {
    console.error('[GoChat] Shadow DOM not supported in this browser')
    return
  }

  // Create host element
  const host = document.createElement('div')
  host.id = 'gochat-widget-host'
  host.style.cssText = 'position:fixed;z-index:' + zIndex + ';bottom:0;right:0;pointer-events:none;'
  document.body.appendChild(host)

  // Attach Shadow DOM
  const shadow = host.attachShadow({mode: 'open'})

  // Load Google Fonts (JetBrains Mono) inside Shadow DOM
  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'
  shadow.appendChild(fontLink)

  // Inject CSS
  const style = document.createElement('style')
  let css = WIDGET_CSS
  // Apply custom color if provided
  if (config.color && config.color !== '#45bdd1') {
    css = css.replace(
      'var(--gochat-color-primary, #45bdd1)',
      'var(--gochat-color-primary, ' + config.color + ')'
    )
  }
  // Apply position
  if (config.position === 'bottom-left') {
    css = css.replace('bottom:24px;right:24px;', 'bottom:24px;left:24px;')
    css = css.replace('bottom:90px;right:24px;', 'bottom:90px;left:24px;')
    css = css.replace('bottom:16px;right:16px;', 'bottom:16px;left:16px;')
  }
  style.textContent = css
  shadow.appendChild(style)

  // Inject HTML template
  const container = document.createElement('div')
  container.style.cssText = 'pointer-events:all;'
  container.innerHTML = WIDGET_TEMPLATE
  shadow.appendChild(container)

  // Inject floating bubble (unless trigger is 'custom')
  if (config.trigger !== 'custom') {
    const bubbleContainer = document.createElement('div')
    bubbleContainer.style.cssText = 'pointer-events:all;'
    bubbleContainer.innerHTML = BUBBLE_TEMPLATE
    shadow.appendChild(bubbleContainer)
  }

  // Initialize UI logic
  initUI(shadow, host, config)

  console.log('[GoChat] Widget initialized' +
    (config.contactAddress ? '' : ' (mock mode - no contact address)'))
}

// Initialize when DOM is ready
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { initWidget() } catch (err) {
        console.error('[GoChat] Widget initialization failed:', err)
      }
    })
  } else {
    initWidget()
  }
} catch (err) {
  console.error('[GoChat] Widget initialization failed:', err)
}
