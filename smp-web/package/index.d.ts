/**
 * GoChat Widget - End-to-end encrypted chat widget
 * https://github.com/saschadaemgen/GoChat
 */

declare global {
  interface Window {
    GoChat: GoChatAPI;
  }
}

interface GoChatAPI {
  /** Open the chat panel */
  open(): void;
  /** Close the chat panel */
  close(): void;
  /** Toggle the chat panel */
  toggle(): void;
  /** Check if panel is open */
  isOpen(): boolean;
  /** Set status indicator (offline, connecting, waiting, connected, error) */
  setStatus(state: string): void;
  /** Add a message to the chat */
  addMessage(text: string, type: 'incoming' | 'outgoing', delay?: number): void;
  /** Show typing indicator, returns element for removal */
  showTyping(): HTMLElement | null;
  /** Remove typing indicator */
  removeTyping(el: HTMLElement | null): void;
  /** Set unread badge count */
  setUnread(n: number): void;
  /** Reset chat to initial state */
  reset(): void;
}

export {};
