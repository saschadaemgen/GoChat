/**
 * GoChat widget HTML templates.
 *
 * WIDGET_TEMPLATE - the main chat panel (no overlay, no Nunjucks syntax).
 * BUBBLE_TEMPLATE - the floating chat bubble button.
 *
 * Adapted from base.njk lines 158-230.  Config (contact address, server URL,
 * header title) is injected at runtime from the embedding script tag - the
 * template itself contains no data-* config attributes.
 */

export const WIDGET_TEMPLATE = `<div class="gc-panel-dock" id="gc-panel-dock">
  <div class="gc-panel">
    <!-- Header with delete confirmation slider -->
    <div class="gc-header" id="gc-header">
      <div class="gc-header-main">
        <div class="gc-header-left">
          <span class="gc-status offline" id="gc-status"></span>
          <span class="gc-header-title" id="gc-header-title">GoChat</span>
          <span class="gc-header-e2e">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            E2E Encrypted
          </span>
        </div>
        <div class="gc-header-actions">
          <button class="gc-header-btn" id="gc-minimize" aria-label="Minimize"><span class="gc-minimize-text">Minimize</span></button>
          <span class="gc-header-sep"></span>
          <button class="gc-header-btn gc-close-btn" id="gc-close" aria-label="Delete chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="gc-header-confirm">
        <div class="gc-confirm-text"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>Delete this chat?</div>
        <div class="gc-confirm-actions">
          <button class="gc-confirm-yes" id="gc-confirm-yes">Delete</button>
          <button class="gc-confirm-no" id="gc-confirm-no">Cancel</button>
        </div>
      </div>
    </div>
    <!-- Step 1: Start -->
    <div class="gc-step active" id="gc-step-start">
      <div class="gc-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
      <div class="gc-step-title">Start an encrypted conversation.</div>
      <button class="gc-start-btn" id="gc-start-btn">Start Encrypted Chat</button>
    </div>
    <!-- Step 2: Name input -->
    <div class="gc-step" id="gc-step-name">
      <div class="gc-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="gc-step-title">How should we call you?</div>
      <input type="text" class="gc-name-input" id="gc-name-input" placeholder="Enter your name" autocomplete="off" />
      <div class="gc-name-actions">
        <button class="gc-start-btn" id="gc-name-go">Start Chat</button>
        <button class="gc-start-btn gc-btn-alt" id="gc-guest-btn">Guest</button>
      </div>
    </div>
    <!-- Step 3: Waiting -->
    <div class="gc-step" id="gc-step-waiting">
      <div class="gc-waiting-spinner"></div>
      <div class="gc-step-title">Connecting to support<span class="gc-waiting-dots"></span></div>
      <div class="gc-waiting-text">Please wait while a support agent accepts your request.</div>
      <div class="gc-offline-prompt" id="gc-offline-prompt">
        <div class="gc-offline-hint">or</div>
        <button class="gc-start-btn gc-btn-alt" id="gc-offline-btn">Leave an Offline Message</button>
      </div>
    </div>
    <!-- Step 4: Chat -->
    <div id="gc-chat-view" style="display:none;flex:1;flex-direction:column;min-height:0;">
      <div class="gc-messages" id="gc-messages"></div>
      <div class="gc-encrypt-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        End-to-end encrypted via SimpleX
      </div>
    </div>
    <!-- Input -->
    <div class="gc-input-area" id="gc-input-area" style="display:none;">
      <textarea class="gc-input" id="gc-input" placeholder="Type a message..." rows="1"></textarea>
      <button class="gc-send" id="gc-send" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
    </div>
    <!-- Offline end -->
    <div class="gc-offline-end" id="gc-offline-end" style="display:none;">
      <button class="gc-offline-end-btn" id="gc-offline-end-btn">Close and Delete Chat</button>
    </div>
  </div>
</div>`;

export const BUBBLE_TEMPLATE = `<button class="gc-float-bubble" id="gc-float-bubble" aria-label="Open chat">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <span class="gc-float-badge" id="gc-float-badge" style="display:none">0</span>
</button>`;
