// BrowserClient - high-level browser API for GoChat.
//
// Wraps ConnectionManager into a simple API that chat.js can call.
// Handles: connection lifecycle, message send/receive, status callbacks,
// auto-reconnect on WebSocket drop, and state persistence via IndexedDB.
//
// Usage:
//   const client = createBrowserClient({
//     contactAddress: 'simplex:/contact#/?v=1-7&smp=...',
//     serverUrl: 'wss://smp.simplego.dev',
//     onMessage: (text) => addMessage(text, 'incoming'),
//     onStatusChange: (status) => setStatus(status),
//   })
//   await client.connect()
//   await client.send('Hello!')
//   await client.disconnect()

import {newSMPAgent} from "./agent.js"
import type {SMPClientAgent} from "./agent.js"
import {ConnectionManager} from "./connection.js"
import type {ManagedConnection} from "./connection.js"
import type {ConnectionStateEvent} from "./state.js"

// -- Default contact address (SimpleX Desktop App on smp.simplego.dev)

export const DEFAULT_CONTACT_ADDRESS = "https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F7qw4hvuS-PvTHbotgtg_xiwrhFUk_s1q2upUQrGIWow%3D%40smp.simplego.dev%2FrvmTVkY_dMRMA9L4jlaQsDPZeyCUktxq%23%2F%3Fv%3D1-4%26dh%3DMCowBQYDK2VuAyEAnIg32wSmfYdGHlO7qthFkn2wZmwcF2cOJHbmVnkkZjI%253D%26q%3Dc"

// -- Visitor name helpers

/**
 * Generate a random visitor name like "Visitor-k7m3".
 * Uses alphanumerics without ambiguous characters (no l, i, o, 0, 1).
 */
export function generateRandomVisitorName(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return "Visitor-" + suffix
}

// -- Config resolution

declare const window: Window & {
  GOCHAT_CONFIG?: {
    contactAddress?: string
    displayName?: string
    welcomeMessage?: string
    widgetPosition?: string
    accentColor?: string
    serverUrl?: string
  }
}

/**
 * Resolve contact address with priority chain:
 * 1. window.GOCHAT_CONFIG.contactAddress (from admin-generated gochat-config.js)
 * 2. HTML data-contact-address attribute on #gc-panel-dock
 * 3. DEFAULT_CONTACT_ADDRESS (bundle fallback)
 */
export function resolveContactAddress(): string {
  // 1. Admin panel config (highest priority)
  if (typeof window !== "undefined" && window.GOCHAT_CONFIG?.contactAddress) {
    return window.GOCHAT_CONFIG.contactAddress
  }
  // 2. HTML data attribute
  if (typeof document !== "undefined") {
    const dock = document.getElementById("gc-panel-dock")
    if (dock?.dataset?.contactAddress) {
      return dock.dataset.contactAddress
    }
  }
  // 3. Bundle default
  return DEFAULT_CONTACT_ADDRESS
}

/**
 * Resolve server URL with priority chain:
 * 1. window.GOCHAT_CONFIG.serverUrl
 * 2. HTML data-server-url attribute on #gc-panel-dock
 * 3. undefined (no override, use address from contact URI)
 */
export function resolveServerUrl(): string | undefined {
  if (typeof window !== "undefined" && window.GOCHAT_CONFIG?.serverUrl) {
    return window.GOCHAT_CONFIG.serverUrl
  }
  if (typeof document !== "undefined") {
    const dock = document.getElementById("gc-panel-dock")
    if (dock?.dataset?.serverUrl) {
      return dock.dataset.serverUrl
    }
  }
  return undefined
}

// -- Types

export type ClientStatus = "offline" | "connecting" | "connected" | "error"

export interface QueuedMessage {
  id: string
  text: string
  timestamp: number
  status: "queued" | "sending" | "sent" | "failed"
}

export interface BrowserClientConfig {
  /** SimpleX contact address URI of the support team */
  contactAddress: string
  /**
   * WebSocket server URL for the WSS proxy (e.g. 'wss://smp.simplego.dev').
   * Browsers connect to this URL (typically port 443) which reverse-proxies
   * to the SMP server (port 5223). If omitted, connects directly to the
   * host:port from the contact address (only works in non-browser envs).
   */
  serverUrl?: string
  /** Display name shown to the support team. If set, skips the name input UI. */
  displayName?: string
  /**
   * DOM element to inject the name input UI into. If not provided and displayName
   * is not set, the name input is injected into #gc-start (the chat widget's
   * start view). Set to false to skip the name input entirely.
   */
  nameInputContainer?: HTMLElement | false
  /** Callback when a message is received */
  onMessage: (text: string) => void
  /** Callback when connection status changes */
  onStatusChange: (status: ClientStatus) => void
  /** Callback for errors (optional) */
  onError?: (error: Error) => void
  /** Callback when user sends a message (fired immediately, even if queued) */
  onOwnMessage?: (msg: QueuedMessage) => void
  /** Callback when a queued message status changes (queued -> sending -> sent/failed) */
  onMessageStatusChange?: (id: string, status: string) => void
  /** @internal Injectable agent for testing - defaults to newSMPAgent() */
  _agent?: SMPClientAgent
}

export interface BrowserClient {
  /** Establish connection to support team via SimpleX */
  connect(): Promise<void>
  /** Send a text message */
  send(text: string): Promise<void>
  /** Close the connection gracefully */
  disconnect(): Promise<void>
  /** Current connection status */
  readonly status: ClientStatus
}

// -- BrowserClient implementation

class BrowserClientImpl implements BrowserClient {
  private readonly config: BrowserClientConfig
  private agent: SMPClientAgent | null = null
  private connManager: ConnectionManager | null = null
  private conn: ManagedConnection | null = null
  private currentStatus: ClientStatus = "offline"
  private unsubscribeState: (() => void) | null = null
  private messageQueue: QueuedMessage[] = []

  constructor(config: BrowserClientConfig) {
    this.config = config
  }

  get status(): ClientStatus {
    return this.currentStatus
  }

  async connect(): Promise<void> {
    if (this.currentStatus === "connecting" || this.currentStatus === "connected") {
      return
    }

    // If displayName is already set, name input is disabled, or no DOM (tests), connect directly.
    // Otherwise, show the name input UI and wait for the user to choose a name.
    const skipNameInput = this.config.displayName
      || this.config.nameInputContainer === false
      || this.config._agent
      || typeof document === "undefined"
    if (skipNameInput) {
      return this.connectWithName(this.config.displayName || "Website Visitor")
    }

    // Show name input UI and wait for name selection
    const name = await this.showNameInput()
    return this.connectWithName(name)
  }

  /**
   * Show the name input UI and return a promise that resolves with the chosen name.
   * Injects DOM elements into the nameInputContainer or #gc-start.
   */
  private showNameInput(): Promise<string> {
    return new Promise<string>((resolve) => {
      const container = this.config.nameInputContainer || document.getElementById("gc-start")
      if (!container) {
        // No container found, use random name
        resolve(generateRandomVisitorName())
        return
      }

      // Inject name input UI
      container.innerHTML = ""

      const icon = document.createElement("div")
      icon.className = "gc-start-icon"
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
      container.appendChild(icon)

      const label = document.createElement("div")
      label.className = "gc-start-text"
      label.textContent = "Enter your name to start chatting:"
      container.appendChild(label)

      const nameField = document.createElement("input")
      nameField.type = "text"
      nameField.className = "gc-name-input"
      nameField.placeholder = "Your name"
      nameField.autocomplete = "off"
      nameField.maxLength = 40
      // Inject minimal styles for the name input (self-contained widget)
      nameField.style.cssText = "width:100%;max-width:240px;background:var(--bg-deep,#121212);border:1px solid var(--accent-border,#333);border-radius:8px;padding:0.5rem 0.65rem;color:var(--text-bright,#fff);font-family:inherit;font-size:0.72rem;outline:none;box-sizing:border-box;"
      container.appendChild(nameField)

      const btnRow = document.createElement("div")
      btnRow.style.cssText = "display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:center;margin-top:0.4rem;"

      const startBtn = document.createElement("button")
      startBtn.className = "gc-start-btn"
      startBtn.textContent = "Start Chat"

      const anonBtn = document.createElement("button")
      anonBtn.className = "gc-start-btn"
      anonBtn.style.cssText = "background:transparent;color:var(--text-dim,#888);border:1px solid var(--accent-border,#333);"
      anonBtn.textContent = "Stay Anonymous"

      btnRow.appendChild(startBtn)
      btnRow.appendChild(anonBtn)
      container.appendChild(btnRow)

      // Focus the input
      setTimeout(() => nameField.focus(), 100)

      // Resolve with chosen name
      const finish = (name: string) => {
        const trimmed = name.trim()
        resolve(trimmed || generateRandomVisitorName())
      }

      startBtn.addEventListener("click", () => finish(nameField.value))
      anonBtn.addEventListener("click", () => resolve(generateRandomVisitorName()))
      nameField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          finish(nameField.value)
        }
      })
    })
  }

  /**
   * Connect to the SMP server with the given display name.
   * This is the actual connection logic, called after the name is chosen.
   */
  private async connectWithName(displayName: string): Promise<void> {
    this.setStatus("connecting")
    console.log("[SMP] BrowserClient.connect: displayName='" + displayName + "'")

    try {
      // 1. Create agent and connection manager
      console.log("[SMP] BrowserClient.connect: creating agent, serverUrl=" + (this.config.serverUrl || "(none)"))
      this.agent = this.config._agent ?? newSMPAgent()

      // Parse serverUrl to override WebSocket connection host:port.
      const queueServer = this.config.serverUrl
        ? parseServerUrl(this.config.serverUrl)
        : undefined

      this.connManager = new ConnectionManager(this.agent, {
        subscribeMode: "S",
        sndSecure: true,
        queueServer,
      })

      // 2. Initiate connection (parse address, create queue)
      try {
        this.conn = await this.connManager.initiateConnection(this.config.contactAddress)
      } catch (initErr) {
        const msg = initErr instanceof Error ? initErr.message : String(initErr)
        throw new Error("initiateConnection failed: " + msg)
      }

      // 3. Listen for state changes
      this.unsubscribeState = this.conn.state.onStateChange((event: ConnectionStateEvent) => {
        this.handleStateChange(event)
      })

      // 4. Register message handler
      this.setupMessageHandler()

      // 5. Send invitation with the chosen display name
      if (this.conn.contactQueue) {
        try {
          await this.connManager.sendInvitation(this.conn.state.id, displayName)
          console.log("[SMP] BrowserClient.connect: invitation sent as '" + displayName + "'")

          await this.connManager.setupMsgHandler(this.conn.state.id, (msgBody) => {
            console.log("[SMP] BrowserClient: received MSG body " + msgBody.length + "B")
          })

          this.conn.onChatMessage = (text: string) => {
            console.log("[SMP] BrowserClient: chat message received: " + text.substring(0, 100))
            this.config.onMessage(text)
          }
        } catch (invErr) {
          const msg = invErr instanceof Error ? invErr.message : String(invErr)
          console.log("[SMP] BrowserClient.connect: invitation FAILED: " + msg)
        }
      }

      this.setStatus("connected")

    } catch (err) {
      this.setStatus("error")
      if (this.config.onError && err instanceof Error) {
        this.config.onError(err)
      }
      throw err
    }
  }

  async send(text: string): Promise<void> {
    if (this.currentStatus === "offline" || this.currentStatus === "error") {
      throw new Error("Cannot send: not connected (status: " + this.currentStatus + ")")
    }

    if (!this.conn || !this.connManager) {
      throw new Error("Cannot send: connection not fully established")
    }

    // Create queued message and notify UI immediately
    const msg: QueuedMessage = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2),
      text,
      timestamp: Date.now(),
      status: "queued",
    }

    if (this.config.onOwnMessage) {
      this.config.onOwnMessage(msg)
    }

    // If CONNECTED: send immediately through encrypted pipeline
    if (this.conn.state.state === "CONNECTED") {
      msg.status = "sending"
      if (this.config.onMessageStatusChange) {
        this.config.onMessageStatusChange(msg.id, "sending")
      }
      try {
        await this.connManager.sendChatMessage(this.conn.state.id, text)
        msg.status = "sent"
        if (this.config.onMessageStatusChange) {
          this.config.onMessageStatusChange(msg.id, "sent")
        }
      } catch (err) {
        msg.status = "failed"
        if (this.config.onMessageStatusChange) {
          this.config.onMessageStatusChange(msg.id, "failed")
        }
        if (this.config.onError && err instanceof Error) {
          this.config.onError(err)
        }
        throw err
      }
    } else {
      // Queue for later - will be sent when state transitions to CONNECTED
      this.messageQueue.push(msg)
      console.log("[SMP] BrowserClient.send: queued message (state=" + this.conn.state.state + ", queue=" + this.messageQueue.length + ")")
    }
  }

  async disconnect(): Promise<void> {
    if (this.conn && this.connManager) {
      try {
        await this.connManager.closeConnection(this.conn.state.id)
      } catch (_e) {
        // Best effort cleanup
      }
    }

    if (this.unsubscribeState) {
      this.unsubscribeState()
      this.unsubscribeState = null
    }

    if (this.agent) {
      this.agent.closeAll()
      this.agent = null
    }

    this.connManager = null
    this.conn = null
    this.setStatus("offline")
  }

  // -- Internal methods

  private setStatus(status: ClientStatus): void {
    if (this.currentStatus === status) return
    this.currentStatus = status
    this.config.onStatusChange(status)
  }

  private handleStateChange(event: ConnectionStateEvent): void {
    switch (event.newState) {
      case "CONNECTED":
        this.setStatus("connected")
        // Flush any messages queued during PENDING/CONFIRMED state
        this.flushMessageQueue()
        break
      case "CLOSED":
        this.setStatus("offline")
        break
      case "ERROR":
        this.setStatus("error")
        if (event.error && this.config.onError) {
          this.config.onError(new Error(event.error.message))
        }
        break
      case "PENDING":
      case "QUEUE_CREATED":
        this.setStatus("connecting")
        break
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return
    if (!this.conn || !this.connManager) return

    const connId = this.conn.state.id
    const queue = [...this.messageQueue]
    this.messageQueue = []
    console.log("[SMP] BrowserClient: flushing " + queue.length + " queued message(s)")

    // Send queued messages sequentially (async, fire-and-forget from state handler)
    const sendNext = async (index: number) => {
      if (index >= queue.length) return
      const msg = queue[index]
      msg.status = "sending"
      if (this.config.onMessageStatusChange) {
        this.config.onMessageStatusChange(msg.id, "sending")
      }
      try {
        await this.connManager!.sendChatMessage(connId, msg.text)
        msg.status = "sent"
        if (this.config.onMessageStatusChange) {
          this.config.onMessageStatusChange(msg.id, "sent")
        }
        console.log("[SMP] BrowserClient: queued message " + (index + 1) + "/" + queue.length + " sent")
      } catch (err) {
        msg.status = "failed"
        if (this.config.onMessageStatusChange) {
          this.config.onMessageStatusChange(msg.id, "failed")
        }
        console.log("[SMP] BrowserClient: queued message " + (index + 1) + " failed: " + (err instanceof Error ? err.message : String(err)))
      }
      await sendNext(index + 1)
    }
    sendNext(0).catch(() => {})
  }

  private setupMessageHandler(): void {
    if (!this.conn || !this.agent) return

    // Get the SMP client for our receiving queue's server
    // and register a message handler.
    // If serverUrl is configured, use WSS proxy host:port instead of
    // the SMP protocol address from the contact URI.
    const wssServer = this.config.serverUrl
      ? parseServerUrl(this.config.serverUrl)
      : null

    let serverHost: string
    let serverPort: number

    if (wssServer) {
      serverHost = wssServer.hosts[0]
      serverPort = wssServer.port
    } else if (this.conn.contactAddress.format === "full") {
      const q = this.conn.contactAddress.data.smpQueues[0]
      serverHost = q.server.hosts[0]
      serverPort = q.server.port
    } else {
      serverHost = this.conn.contactAddress.data.server.hosts[0]
      serverPort = this.conn.contactAddress.data.server.port
    }

    // Get the server identity from the contact address for keyHash
    let serverIdentity = ""
    if (this.conn.contactAddress.format === "full") {
      serverIdentity = this.conn.contactAddress.data.smpQueues[0].server.serverIdentity
    } else {
      serverIdentity = this.conn.contactAddress.data.server.serverIdentity
    }
    const serverAddress = {
      host: serverHost,
      port: serverPort,
      keyHash: base64urlDecode(serverIdentity),
    }

    // Get client and register typed message handler
    this.agent.getClient(serverAddress).then((client) => {
      client.onMessage((_recipientId, _msgId, encryptedBody) => {
        // For MVP: treat message body as plain text
        // Full implementation would decrypt via Double Ratchet
        try {
          const text = new TextDecoder().decode(encryptedBody)
          this.config.onMessage(text)
        } catch (_e) {
          // Failed to decode message body
        }
      })
    }).catch(() => {
      // Failed to get client for message handler
    })
  }
}

// -- Factory

/**
 * Create a new BrowserClient instance.
 *
 * @param config - Client configuration with callbacks
 * @returns BrowserClient ready to connect
 */
export function createBrowserClient(config: BrowserClientConfig): BrowserClient {
  return new BrowserClientImpl(config)
}

// -- Helpers

/**
 * Parse a WSS server URL into host/port/identity for ConnectionManager.
 * Input: 'wss://smp.simplego.dev' or 'wss://smp.simplego.dev:443'
 * Returns the shape expected by ConnectionManagerConfig.queueServer.
 */
function parseServerUrl(url: string): {hosts: string[]; port: number; serverIdentity: string} {
  // Strip wss:// or https:// prefix
  let hostPart = url
  if (hostPart.startsWith("wss://")) hostPart = hostPart.substring(6)
  else if (hostPart.startsWith("https://")) hostPart = hostPart.substring(8)

  // Strip trailing path/slash
  const slashIdx = hostPart.indexOf("/")
  if (slashIdx !== -1) hostPart = hostPart.substring(0, slashIdx)

  // Parse host:port
  const colonIdx = hostPart.lastIndexOf(":")
  let hostname: string
  let port = 443 // Default WSS port

  if (colonIdx > 0) {
    const portCandidate = hostPart.substring(colonIdx + 1)
    const portNum = parseInt(portCandidate, 10)
    if (!isNaN(portNum) && portNum > 0 && portNum <= 65535 && portCandidate === String(portNum)) {
      hostname = hostPart.substring(0, colonIdx)
      port = portNum
    } else {
      hostname = hostPart
    }
  } else {
    hostname = hostPart
  }

  return {hosts: [hostname], port, serverIdentity: ""}
}

function base64urlDecode(s: string): Uint8Array {
  if (!s || s.length === 0) return new Uint8Array(0)
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  while (b64.length % 4 !== 0) b64 += "="
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
