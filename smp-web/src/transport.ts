// SMPWebSocketTransport - WebSocket transport with SMP 16KB block framing.
//
// Handles ONLY:
// - Opening/closing a WebSocket connection (WSS only)
// - Sending and receiving exactly 16,384-byte blocks
// - Connection state tracking
// - Connect timeout
//
// Does NOT handle:
// - SMP handshake (Task 2)
// - Reconnection logic (Task 4)
// - Connection pooling (Task 4)
// - PING/PONG (Task 2, needs handshake first)
// - SMP command encoding/decoding (Season 3)

import type {
  ChatTransport,
  SMPServerAddress,
  TransportState,
  TransportEventHandler,
} from "./types.js"
import {SMPTransportError} from "./types.js"

// SMP uses the same 16,384-byte block size as XFTP (XFTP_BLOCK_SIZE).
// Defined here to avoid pulling in the xftp-web dependency chain
// (which requires libsodium-wrappers-sumo). This is a fixed protocol constant.
export const SMP_BLOCK_SIZE = 16384

export interface SMPTransportConfig {
  connectTimeoutMs?: number
}

const DEFAULT_CONFIG: Required<SMPTransportConfig> = {
  connectTimeoutMs: 15000,
}

export class SMPWebSocketTransport implements ChatTransport {
  private ws: WebSocket | null = null
  private currentState: TransportState = "disconnected"
  private messageHandler: TransportEventHandler | null = null
  private closeHandler: (() => void) | null = null
  private readonly config: Required<SMPTransportConfig>
  // Receive buffer for reassembling fragmented WebSocket frames.
  // WSS reverse proxies (e.g. Nginx) may split SMP's 16KB blocks
  // across multiple WebSocket messages.
  private recvBuffer: Uint8Array = new Uint8Array(0)

  constructor(config?: SMPTransportConfig) {
    this.config = {...DEFAULT_CONFIG, ...config}
  }

  get state(): TransportState {
    return this.currentState
  }

  async connect(server: SMPServerAddress): Promise<void> {
    if (this.currentState !== "disconnected") {
      throw new SMPTransportError("NETWORK", "Transport is not disconnected")
    }

    this.currentState = "connecting"

    const url = "wss://" + server.host + ":" + server.port

    return new Promise<void>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      let settled = false

      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      }

      const settle = (fn: () => void) => {
        if (settled) return
        settled = true
        cleanup()
        fn()
      }

      try {
        const ws = new WebSocket(url)
        ws.binaryType = "arraybuffer"
        this.ws = ws

        timeoutId = setTimeout(() => {
          settle(() => {
            ws.close()
            this.ws = null
            this.currentState = "disconnected"
            reject(new SMPTransportError("TIMEOUT", "Connection timed out after " + this.config.connectTimeoutMs + "ms"))
          })
        }, this.config.connectTimeoutMs)

        ws.addEventListener("open", () => {
          settle(() => {
            this.currentState = "connected"
            resolve()
          })
        })

        ws.addEventListener("error", () => {
          settle(() => {
            this.ws = null
            this.currentState = "disconnected"
            reject(new SMPTransportError("NETWORK", "WebSocket connection failed to " + url))
          })
        })

        ws.addEventListener("close", () => {
          // If we are still connecting (error before open), the error handler
          // will have already settled the promise. This handles unexpected
          // close after connection was established.
          if (!settled) {
            settle(() => {
              this.ws = null
              this.currentState = "disconnected"
              reject(new SMPTransportError("CLOSED", "Connection closed during connect"))
            })
          } else {
            this.ws = null
            this.currentState = "disconnected"
            if (this.closeHandler !== null) {
              this.closeHandler()
            }
          }
        })

        ws.addEventListener("message", (event: MessageEvent) => {
          const chunk = new Uint8Array(event.data as ArrayBuffer)

          // Append chunk to receive buffer
          if (this.recvBuffer.length === 0) {
            this.recvBuffer = chunk
          } else {
            const combined = new Uint8Array(this.recvBuffer.length + chunk.length)
            combined.set(this.recvBuffer, 0)
            combined.set(chunk, this.recvBuffer.length)
            this.recvBuffer = combined
          }

          // Process complete 16KB blocks from the buffer.
          // WSS reverse proxies may fragment or coalesce frames,
          // so a single WebSocket message may contain a partial block,
          // a complete block, or multiple blocks.
          while (this.recvBuffer.length >= SMP_BLOCK_SIZE) {
            const block = this.recvBuffer.slice(0, SMP_BLOCK_SIZE)
            this.recvBuffer = this.recvBuffer.slice(SMP_BLOCK_SIZE)
            if (this.messageHandler !== null) {
              this.messageHandler(block)
            }
          }
        })
      } catch (e) {
        settle(() => {
          this.ws = null
          this.currentState = "disconnected"
          if (e instanceof SMPTransportError) {
            reject(e)
          } else {
            reject(new SMPTransportError("NETWORK", "Failed to create WebSocket: " + String(e)))
          }
        })
      }
    })
  }

  async send(block: Uint8Array): Promise<void> {
    if (this.currentState !== "connected") {
      throw new SMPTransportError("CLOSED", "Cannot send: transport is not connected")
    }
    if (block.length !== SMP_BLOCK_SIZE) {
      throw new SMPTransportError(
        "BLOCK_SIZE",
        "Block must be exactly " + SMP_BLOCK_SIZE + " bytes, got " + block.length
      )
    }
    this.ws!.send(block)
  }

  onMessage(handler: TransportEventHandler): void {
    this.messageHandler = handler
  }

  // Register handler for connection close/disconnect events.
  // Fires when WebSocket closes after connection was established
  // (not during initial connect - those reject the connect Promise).
  onClose(handler: () => void): void {
    this.closeHandler = handler
  }

  close(): void {
    this.recvBuffer = new Uint8Array(0)
    if (this.ws === null) {
      this.currentState = "disconnected"
      return
    }
    if (this.currentState === "connected" || this.currentState === "connecting") {
      this.currentState = "closing"
      this.ws.close()
    }
  }
}
