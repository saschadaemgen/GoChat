// GoChat Admin Panel - Passkey-protected configuration UI.
//
// States:
//   UNSUPPORTED - browser lacks WebAuthn
//   NO_CREDENTIAL - first time, show Register button
//   LOGIN - credential exists, show Sign In button
//   SETTINGS - authenticated, show settings form
//
// Renders into #admin-root element. Dark theme matching GoChat widget.

import {
  isWebAuthnSupported,
  registerPasskey,
  loginWithPasskey,
  getStoredCredential,
  getStoredSettings,
  storeSettings,
  DEFAULT_SETTINGS,
} from "./webauthn.js"
import type {GoChatSettings} from "./webauthn.js"

// -- CSS (inline)

const ADMIN_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #0A0A0A;
  color: #FFFFFF;
  font-family: system-ui, -apple-system, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
}
.admin-card {
  background: #1E1E1E;
  border-radius: 12px;
  padding: 32px;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.admin-title {
  font-size: 20px;
  font-weight: 600;
}
.admin-subtitle {
  font-size: 14px;
  color: #A0A0A0;
  margin-bottom: 24px;
  line-height: 1.5;
}
.admin-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}
.admin-label {
  font-size: 13px;
  color: #A0A0A0;
  margin-bottom: 6px;
  display: block;
  margin-top: 16px;
}
.admin-label:first-of-type { margin-top: 0; }
.admin-input, .admin-textarea, .admin-select {
  width: 100%;
  background: #121212;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 12px;
  color: #FFFFFF;
  font-size: 14px;
  font-family: inherit;
}
.admin-textarea { resize: vertical; min-height: 64px; }
.admin-input:focus, .admin-textarea:focus, .admin-select:focus {
  border-color: #4CAF50;
  outline: none;
}
.admin-select option { background: #121212; color: #FFFFFF; }
.admin-color-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.admin-color-row input[type="color"] {
  width: 40px;
  height: 40px;
  border: 1px solid #333;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  padding: 2px;
}
.admin-color-row input[type="text"] { flex: 1; }
.admin-btn {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 24px;
  transition: background 150ms ease-out;
}
.admin-btn:hover { background: #66BB6A; }
.admin-btn:disabled { background: #333; cursor: not-allowed; }
.btn-logout {
  background: none;
  border: 1px solid #333;
  color: #A0A0A0;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}
.btn-logout:hover { border-color: #666; color: #FFF; }
.config-output {
  background: #0A0A0A;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #A0A0A0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 16px;
}
.btn-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.btn-secondary {
  background: #333333;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
  flex: 1;
  transition: background 150ms ease-out;
}
.btn-secondary:hover { background: #444444; }
.admin-msg {
  text-align: center;
  color: #66BB6A;
  font-size: 13px;
  margin-top: 8px;
}
.admin-error {
  text-align: center;
  color: #EF5350;
  font-size: 13px;
  margin-top: 8px;
}
`

// -- State

type AdminState = "unsupported" | "no_credential" | "login" | "settings"

let currentState: AdminState = "no_credential"
let currentSettings: GoChatSettings = {...DEFAULT_SETTINGS}
let root: HTMLElement

// -- Render helpers

function h(tag: string, attrs: Record<string, string> = {}, ...children: (string | HTMLElement)[]): HTMLElement {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") el.className = v
    else el.setAttribute(k, v)
  }
  for (const child of children) {
    if (typeof child === "string") el.appendChild(document.createTextNode(child))
    else el.appendChild(child)
  }
  return el
}

function clear(): void {
  root.innerHTML = ""
}

function injectCSS(): void {
  if (document.getElementById("gochat-admin-css")) return
  const style = document.createElement("style")
  style.id = "gochat-admin-css"
  style.textContent = ADMIN_CSS
  document.head.appendChild(style)
}

// -- Render states

function renderUnsupported(): void {
  clear()
  const card = h("div", {className: "admin-card"})
  card.appendChild(h("div", {className: "admin-icon"}, "🔒"))
  card.appendChild(h("div", {className: "admin-title"}, "Browser Not Supported"))
  card.appendChild(h("div", {className: "admin-subtitle"},
    "Your browser does not support Passkeys. Please use a modern browser: Chrome, Safari, Firefox, or Edge."))
  root.appendChild(card)
}

function renderRegister(): void {
  clear()
  const card = h("div", {className: "admin-card"})
  card.appendChild(h("div", {className: "admin-icon"}, "🔑"))
  card.appendChild(h("div", {className: "admin-title"}, "GoChat Admin Setup"))
  card.appendChild(h("div", {className: "admin-subtitle"},
    "Set up Passkey authentication to manage your GoChat widget. Use your fingerprint, Face ID, or Windows Hello."))

  const btn = h("button", {className: "admin-btn"}, "Register Passkey")
  const msgDiv = h("div", {})
  btn.addEventListener("click", async () => {
    btn.setAttribute("disabled", "true")
    btn.textContent = "Waiting for biometric..."
    msgDiv.innerHTML = ""
    try {
      await registerPasskey()
      currentState = "settings"
      render()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      msgDiv.innerHTML = ""
      msgDiv.appendChild(h("div", {className: "admin-error"}, msg))
      btn.removeAttribute("disabled")
      btn.textContent = "Register Passkey"
    }
  })
  card.appendChild(btn)
  card.appendChild(msgDiv)
  root.appendChild(card)
}

function renderLogin(): void {
  clear()
  const card = h("div", {className: "admin-card"})
  card.appendChild(h("div", {className: "admin-icon"}, "🔑"))
  card.appendChild(h("div", {className: "admin-title"}, "GoChat Admin"))
  card.appendChild(h("div", {className: "admin-subtitle"},
    "Sign in with your Passkey to manage widget settings."))

  const btn = h("button", {className: "admin-btn"}, "Sign In")
  const msgDiv = h("div", {})
  btn.addEventListener("click", async () => {
    btn.setAttribute("disabled", "true")
    btn.textContent = "Waiting for biometric..."
    msgDiv.innerHTML = ""
    try {
      const ok = await loginWithPasskey()
      if (ok) {
        // Load saved settings
        const saved = await getStoredSettings()
        if (saved) currentSettings = saved
        currentState = "settings"
        render()
      } else {
        msgDiv.appendChild(h("div", {className: "admin-error"}, "Authentication failed"))
        btn.removeAttribute("disabled")
        btn.textContent = "Sign In"
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      msgDiv.appendChild(h("div", {className: "admin-error"}, msg))
      btn.removeAttribute("disabled")
      btn.textContent = "Sign In"
    }
  })
  card.appendChild(btn)
  card.appendChild(msgDiv)
  root.appendChild(card)
}

function renderSettings(): void {
  clear()
  const card = h("div", {className: "admin-card"})

  // Header with logout
  const header = h("div", {className: "admin-header"})
  header.appendChild(h("div", {className: "admin-title"}, "GoChat Admin"))
  const logoutBtn = h("button", {className: "btn-logout"}, "Logout")
  logoutBtn.addEventListener("click", () => {
    currentState = "login"
    render()
  })
  header.appendChild(logoutBtn)
  card.appendChild(header)

  // Contact Address
  card.appendChild(h("label", {className: "admin-label"}, "SimpleX Contact Address"))
  const addrInput = h("textarea", {className: "admin-textarea", rows: "3", placeholder: "https://simplex.chat/contact#/..."}) as HTMLTextAreaElement
  addrInput.value = currentSettings.contactAddress
  addrInput.addEventListener("input", () => { currentSettings.contactAddress = addrInput.value })
  card.appendChild(addrInput)

  // Display Name
  card.appendChild(h("label", {className: "admin-label"}, "Display Name"))
  const nameInput = h("input", {className: "admin-input", type: "text", placeholder: "Website Visitor"}) as HTMLInputElement
  nameInput.value = currentSettings.displayName
  nameInput.addEventListener("input", () => { currentSettings.displayName = nameInput.value })
  card.appendChild(nameInput)

  // Welcome Message
  card.appendChild(h("label", {className: "admin-label"}, "Welcome Message (optional)"))
  const welcomeInput = h("input", {className: "admin-input", type: "text", placeholder: "Hi! How can we help you?"}) as HTMLInputElement
  welcomeInput.value = currentSettings.welcomeMessage
  welcomeInput.addEventListener("input", () => { currentSettings.welcomeMessage = welcomeInput.value })
  card.appendChild(welcomeInput)

  // Widget Position
  card.appendChild(h("label", {className: "admin-label"}, "Widget Position"))
  const posSelect = h("select", {className: "admin-select"}) as HTMLSelectElement
  const opt1 = h("option", {value: "bottom-right"}, "Bottom-right") as HTMLOptionElement
  const opt2 = h("option", {value: "bottom-left"}, "Bottom-left") as HTMLOptionElement
  if (currentSettings.widgetPosition === "bottom-left") opt2.selected = true
  else opt1.selected = true
  posSelect.appendChild(opt1)
  posSelect.appendChild(opt2)
  posSelect.addEventListener("change", () => {
    currentSettings.widgetPosition = posSelect.value as "bottom-right" | "bottom-left"
  })
  card.appendChild(posSelect)

  // Accent Color
  card.appendChild(h("label", {className: "admin-label"}, "Accent Color"))
  const colorRow = h("div", {className: "admin-color-row"})
  const colorPicker = h("input", {type: "color", value: currentSettings.accentColor}) as HTMLInputElement
  const colorText = h("input", {className: "admin-input", type: "text", value: currentSettings.accentColor, placeholder: "#4CAF50"}) as HTMLInputElement
  colorPicker.addEventListener("input", () => {
    currentSettings.accentColor = colorPicker.value
    colorText.value = colorPicker.value
  })
  colorText.addEventListener("input", () => {
    currentSettings.accentColor = colorText.value
    if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) {
      colorPicker.value = colorText.value
    }
  })
  colorRow.appendChild(colorPicker)
  colorRow.appendChild(colorText)
  card.appendChild(colorRow)

  // Save button
  const msgDiv = h("div", {})
  const configOutput = h("div", {className: "config-output", style: "display:none"})
  const btnRow = h("div", {className: "btn-row", style: "display:none"})

  const saveBtn = h("button", {className: "admin-btn"}, "Save & Generate Config")
  saveBtn.addEventListener("click", async () => {
    try {
      await storeSettings(currentSettings)
      const configJs = generateConfig(currentSettings)
      configOutput.textContent = configJs
      configOutput.style.display = "block"
      btnRow.style.display = "flex"
      msgDiv.innerHTML = ""
      msgDiv.appendChild(h("div", {className: "admin-msg"}, "Settings saved!"))
    } catch (e) {
      msgDiv.innerHTML = ""
      msgDiv.appendChild(h("div", {className: "admin-error"}, "Failed to save: " + (e instanceof Error ? e.message : String(e))))
    }
  })
  card.appendChild(saveBtn)
  card.appendChild(msgDiv)
  card.appendChild(configOutput)

  // Copy + Download buttons
  const copyBtn = h("button", {className: "btn-secondary"}, "Copy to Clipboard")
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(configOutput.textContent || "").then(() => {
      copyBtn.textContent = "Copied!"
      setTimeout(() => { copyBtn.textContent = "Copy to Clipboard" }, 2000)
    })
  })
  const dlBtn = h("button", {className: "btn-secondary"}, "Download")
  dlBtn.addEventListener("click", () => {
    const blob = new Blob([configOutput.textContent || ""], {type: "application/javascript"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gochat-config.js"
    a.click()
    URL.revokeObjectURL(url)
  })
  btnRow.appendChild(copyBtn)
  btnRow.appendChild(dlBtn)
  card.appendChild(btnRow)

  root.appendChild(card)
}

// -- Config generation

function generateConfig(settings: GoChatSettings): string {
  const obj: Record<string, string> = {}
  if (settings.contactAddress) obj.contactAddress = settings.contactAddress
  if (settings.displayName && settings.displayName !== "Website Visitor") obj.displayName = settings.displayName
  if (settings.welcomeMessage) obj.welcomeMessage = settings.welcomeMessage
  if (settings.widgetPosition !== "bottom-right") obj.widgetPosition = settings.widgetPosition
  if (settings.accentColor !== "#4CAF50") obj.accentColor = settings.accentColor

  return "// GoChat Widget Configuration\n" +
    "// Generated by GoChat Admin Panel\n" +
    "// Date: " + new Date().toISOString() + "\n" +
    "window.GOCHAT_CONFIG = " + JSON.stringify(obj, null, 2) + ";\n"
}

// -- Main render

function render(): void {
  switch (currentState) {
    case "unsupported": renderUnsupported(); break
    case "no_credential": renderRegister(); break
    case "login": renderLogin(); break
    case "settings": renderSettings(); break
  }
}

// -- Init

async function init(): Promise<void> {
  root = document.getElementById("admin-root") as HTMLElement
  if (!root) {
    console.log("[Admin] No #admin-root element found")
    return
  }

  injectCSS()

  if (!isWebAuthnSupported()) {
    currentState = "unsupported"
    render()
    return
  }

  // Check if credential exists
  const cred = await getStoredCredential()
  if (cred) {
    // Load saved settings for after login
    const saved = await getStoredSettings()
    if (saved) currentSettings = saved
    currentState = "login"
  } else {
    currentState = "no_credential"
  }

  render()
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => init())
} else {
  init()
}
