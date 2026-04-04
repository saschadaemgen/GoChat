// GoChat Widget UI Logic - adapted from chat.js v9
// All DOM access goes through shadow root, no document.getElementById

export interface WidgetConfig {
  contactAddress: string
  serverUrl: string
  name: string
  welcome: string
  color: string
  position: string
  trigger: string
}

export function initUI(shadow: ShadowRoot, host: HTMLElement, config: WidgetConfig): void {
  // --- DOM refs (all from shadow root) ---
  const dock = shadow.getElementById('gc-panel-dock')
  const messages = shadow.getElementById('gc-messages')
  const input = shadow.getElementById('gc-input') as HTMLTextAreaElement | null
  const sendBtn = shadow.getElementById('gc-send')
  const statusDot = shadow.getElementById('gc-status')
  const inputArea = shadow.getElementById('gc-input-area')
  const header = shadow.getElementById('gc-header')
  const panel = dock ? dock.querySelector('.gc-panel') as HTMLElement : null
  const headerTitle = shadow.getElementById('gc-header-title')

  const stepStart = shadow.getElementById('gc-step-start')
  const stepName = shadow.getElementById('gc-step-name')
  const stepWaiting = shadow.getElementById('gc-step-waiting')
  const chatView = shadow.getElementById('gc-chat-view')

  const startBtn = shadow.getElementById('gc-start-btn')
  const nameInput = shadow.getElementById('gc-name-input') as HTMLInputElement | null
  const nameGoBtn = shadow.getElementById('gc-name-go')
  const guestBtn = shadow.getElementById('gc-guest-btn')
  const offlineBtn = shadow.getElementById('gc-offline-btn')

  const minimizeBtn = shadow.getElementById('gc-minimize')
  const closeBtn = shadow.getElementById('gc-close')
  const confirmYes = shadow.getElementById('gc-confirm-yes')
  const confirmNo = shadow.getElementById('gc-confirm-no')

  const offlineEndWrap = shadow.getElementById('gc-offline-end')
  const offlineEndBtn = shadow.getElementById('gc-offline-end-btn')

  const bubble = shadow.getElementById('gc-float-bubble')
  const floatBadge = shadow.getElementById('gc-float-badge')

  // --- State ---
  let panelOpen = false
  let connected = false
  let unreadCount = 0
  let offlineMode = false
  let offlineSent = false
  let confirmMode = false
  let exploding = false
  let client: any = null
  let pendingChecks: HTMLElement[] = []

  // --- Set header title from config ---
  if (headerTitle && config.name) headerTitle.textContent = config.name

  // --- Panel toggle ---
  function openPanel() {
    if (panelOpen || exploding) return
    panelOpen = true
    if (dock) dock.classList.add('open')
    clearUnread()
    if (connected && input) setTimeout(() => input.focus(), 400)
  }
  function closePanel() {
    if (!panelOpen) return
    panelOpen = false
    if (dock) dock.classList.remove('open')
    if (offlineSent) setTimeout(() => resetChat(), 400)
  }
  function togglePanel() {
    if (panelOpen) closePanel()
    else openPanel()
  }

  // Bubble click
  if (bubble) bubble.addEventListener('click', (e) => { e.preventDefault(); togglePanel() })

  // Click outside to close
  document.addEventListener('click', (e) => {
    const target = e.target as Node
    if (panelOpen && !exploding && !host.contains(target)) closePanel()
  })

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (exploding) return
      if (confirmMode) { cancelConfirm(); return }
      if (panelOpen) closePanel()
    }
  })

  if (minimizeBtn) minimizeBtn.addEventListener('click', () => {
    if (exploding) return
    if (confirmMode) { cancelConfirm(); return }
    togglePanel()
  })
  if (closeBtn) closeBtn.addEventListener('click', () => {
    if (exploding) return
    if (confirmMode) { cancelConfirm(); return }
    showConfirm()
  })

  // --- Delete confirmation ---
  function showConfirm() {
    confirmMode = true
    if (closeBtn) closeBtn.classList.add('spinning')
    setTimeout(() => {
      if (closeBtn) closeBtn.classList.remove('spinning')
      if (header) header.classList.add('confirming')
    }, 400)
  }
  function cancelConfirm() {
    confirmMode = false
    if (header) header.classList.remove('confirming')
  }
  function confirmDelete() {
    confirmMode = false
    if (header) header.classList.remove('confirming')
    runDestructionSequence()
  }
  if (confirmYes) confirmYes.addEventListener('click', confirmDelete)
  if (confirmNo) confirmNo.addEventListener('click', cancelConfirm)

  // --- Destruction sequence (Hollywood edition) ---
  function runDestructionSequence() {
    if (exploding || !panel) return
    exploding = true

    if (stepStart) stepStart.classList.remove('active')
    if (stepName) stepName.classList.remove('active')
    if (stepWaiting) stepWaiting.classList.remove('active')
    if (chatView) chatView.style.display = 'flex'
    if (inputArea) inputArea.style.display = 'none'
    if (offlineEndWrap) offlineEndWrap.style.display = 'none'
    const encBadge = panel.querySelector('.gc-encrypt-badge') as HTMLElement | null
    if (encBadge) encBadge.style.display = 'none'
    if (messages) messages.style.overflow = 'visible'

    requestAnimationFrame(() => requestAnimationFrame(() => {
      startDestructionPhases(encBadge)
    }))
  }

  function startDestructionPhases(encBadge: HTMLElement | null) {
    if (!panel) return

    panel.classList.add('shaking')
    const flash = document.createElement('div')
    flash.className = 'gc-destruct-flash active'
    panel.appendChild(flash)
    const scanline = document.createElement('div')
    scanline.className = 'gc-destruct-scanline active'
    panel.appendChild(scanline)

    const msgs = messages ? Array.from(messages.querySelectorAll('.gc-msg')) as HTMLElement[] : []

    for (let i = 0; i < msgs.length; i++) {
      const el = msgs[i]
      const glitchDelay = i * 200
      const explodeDelay = glitchDelay + 350

      setTimeout(() => {
        el.style.opacity = '1'
        el.style.transform = 'none'
        el.style.animation = 'gc-glitch 0.35s ease-out forwards'
      }, glitchDelay)

      setTimeout(() => {
        el.style.animation = 'gc-explode 0.5s ease-in forwards'
        spawnSparks(el, 12)
        spawnShockwave(el)
      }, explodeDelay)
    }

    const totalTime = msgs.length > 0 ? ((msgs.length - 1) * 200 + 350 + 500) : 200

    setTimeout(() => panel!.classList.remove('shaking'), 500)

    if (msgs.length > 0) {
      setTimeout(() => {
        panel!.classList.add('shaking')
        setTimeout(() => panel!.classList.remove('shaking'), 500)
      }, 350)
    }

    setTimeout(() => {
      if (chatView) chatView.style.display = 'none'
      if (messages) { messages.style.overflow = ''; messages.style.display = '' }

      panel!.classList.add('shaking')
      setTimeout(() => panel!.classList.remove('shaking'), 500)

      const ov = document.createElement('div')
      ov.className = 'gc-destroyed-overlay active'
      ov.innerHTML =
        '<div class="gc-destroyed-line"></div>' +
        '<div class="gc-destroyed-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9" x2="15" y2="15" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke-width="2"/></svg></div>' +
        '<div class="gc-destroyed-text">Messages Destroyed</div>' +
        '<div class="gc-destroyed-sub">End-to-end encrypted session terminated</div>' +
        '<div class="gc-destroyed-line"></div>'
      panel!.appendChild(ov)

      setTimeout(() => {
        closePanel()
        setTimeout(() => {
          flash.remove(); scanline.remove(); ov.remove()
          const debris = panel!.querySelectorAll('.gc-spark,.gc-spark-trail,.gc-shockwave')
          for (let s = 0; s < debris.length; s++) debris[s].remove()
          if (encBadge) encBadge.style.display = ''
          resetChat(); exploding = false
        }, 500)
      }, 2200)
    }, totalTime + 300)
  }

  function spawnSparks(el: HTMLElement, count: number) {
    if (!panel) return
    const panelRect = panel.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const cx = elRect.left - panelRect.left + elRect.width / 2
    const cy = elRect.top - panelRect.top + elRect.height / 2
    const colors = ['rgba(69,189,209,1)', 'rgba(100,220,240,1)', 'rgba(140,230,250,0.9)', 'rgba(50,170,200,1)', 'rgba(200,245,255,0.8)']
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div')
      spark.className = 'gc-spark'
      const angle = Math.random() * Math.PI * 2
      const dist = 60 + Math.random() * 120
      const sx = Math.cos(angle) * dist
      const sy = Math.sin(angle) * dist
      const col = colors[Math.floor(Math.random() * colors.length)]
      spark.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;background:' + col + ';color:' + col + ';--sx:' + sx + 'px;--sy:' + sy + 'px;'
      panel.appendChild(spark)
      spark.classList.add('active')
      for (let t = 0; t < 3; t++) {
        ((tx: number, ty: number, c: string, delay: number) => {
          setTimeout(() => {
            const trail = document.createElement('div')
            trail.className = 'gc-spark-trail'
            trail.style.cssText = 'left:' + (cx + tx * 0.2) + 'px;top:' + (cy + ty * 0.2) + 'px;background:' + c + ';'
            panel!.appendChild(trail)
            trail.classList.add('active')
            setTimeout(() => trail.remove(), 600)
          }, delay)
        })(sx * (t + 1) * 0.15, sy * (t + 1) * 0.15, col, (t + 1) * 80)
      }
      setTimeout((s: HTMLElement) => s.remove(), 1200, spark)
    }
  }

  function spawnShockwave(el: HTMLElement) {
    if (!panel) return
    const panelRect = panel.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const cx = elRect.left - panelRect.left + elRect.width / 2
    const cy = elRect.top - panelRect.top + elRect.height / 2
    const wave = document.createElement('div')
    wave.className = 'gc-shockwave'
    wave.style.cssText = 'left:' + (cx - 40) + 'px;top:' + (cy - 40) + 'px;width:80px;height:80px;'
    panel.appendChild(wave)
    wave.classList.add('active')
    setTimeout(() => wave.remove(), 800)
  }

  if (offlineEndBtn) offlineEndBtn.addEventListener('click', () => runDestructionSequence())

  // --- Chat state management ---
  function resetChat() {
    if (client) { client.disconnect().catch(() => {}).finally(() => { client = null }) }
    connected = false; offlineMode = false; offlineSent = false; confirmMode = false; pendingChecks = []
    if (messages) messages.innerHTML = ''
    if (nameInput) nameInput.value = ''
    if (offlineEndWrap) offlineEndWrap.style.display = 'none'
    if (header) header.classList.remove('confirming')
    if (messages) { messages.style.overflow = ''; messages.style.display = '' }
    setStatus('offline'); showStep('start')
  }

  function showStep(step: string) {
    if (stepStart) stepStart.classList.remove('active')
    if (stepName) stepName.classList.remove('active')
    if (stepWaiting) stepWaiting.classList.remove('active')
    if (chatView) chatView.style.display = 'none'
    if (inputArea) inputArea.style.display = 'none'
    if (offlineEndWrap) offlineEndWrap.style.display = 'none'
    if (step === 'start' && stepStart) stepStart.classList.add('active')
    if (step === 'name' && stepName) stepName.classList.add('active')
    if (step === 'waiting' && stepWaiting) stepWaiting.classList.add('active')
    if (step === 'chat') { if (chatView) chatView.style.display = 'flex'; if (inputArea) { inputArea.style.display = 'flex'; inputArea.classList.remove('disabled') } }
    if (step === 'offline') { if (chatView) chatView.style.display = 'flex'; if (inputArea) { inputArea.style.display = 'flex'; inputArea.classList.remove('disabled') } }
  }

  // --- Badge + status ---
  function setUnread(n: number) {
    unreadCount = n
    const badgeEl = floatBadge
    if (!badgeEl) return
    if (n > 0) { badgeEl.textContent = n > 99 ? '99+' : String(n); badgeEl.style.display = 'flex' }
    else { badgeEl.style.display = 'none' }
  }
  function clearUnread() { setUnread(0) }
  function incrementUnread() { if (!panelOpen) setUnread(unreadCount + 1) }
  function setStatus(state: string) { if (!statusDot) return; statusDot.className = 'gc-status ' + state }
  function scrollToBottom() { if (messages) messages.scrollTop = messages.scrollHeight }

  function addMessage(text: string, type: string, delay?: number) {
    if (!messages) return
    const row = document.createElement('div')
    row.className = 'gc-msg ' + type
    row.style.animationDelay = (delay || 0) + 'ms'
    if (type === 'incoming') {
      row.innerHTML =
        '<div class="gc-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
        '<div><div class="gc-bubble">' + escHtml(text) + '</div><div class="gc-time">' + timeNow() + '</div></div>'
    } else {
      row.innerHTML =
        '<div><div class="gc-bubble">' + escHtml(text) + '</div><div class="gc-time">' + timeNow() +
        ' <span class="gc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span></div></div>'
    }
    messages.appendChild(row)
    if (type === 'outgoing') {
      const chk = row.querySelector('.gc-check') as HTMLElement | null
      if (chk) pendingChecks.push(chk)
    }
    requestAnimationFrame(() => scrollToBottom())
  }

  function upgradeCheck(el: HTMLElement) {
    if (!el || el.classList.contains('delivered')) return
    el.classList.add('delivered')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2.5')
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
    poly.setAttribute('points', '20 6 9 17 4 12')
    svg.appendChild(poly); el.appendChild(svg)
  }

  function showTyping(): HTMLElement | null {
    if (!messages) return null
    const row = document.createElement('div')
    row.className = 'gc-typing gc-msg incoming'
    row.innerHTML =
      '<div class="gc-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
      '<div class="gc-typing-dots"><span></span><span></span><span></span></div>'
    messages.appendChild(row); scrollToBottom()
    return row
  }
  function removeTyping(el: HTMLElement | null) { if (el && el.parentNode) el.parentNode.removeChild(el) }
  function escHtml(s: string) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML }
  function timeNow() { const d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) }

  // --- Step flow ---
  if (startBtn) startBtn.addEventListener('click', () => {
    showStep('name')
    if (nameInput) setTimeout(() => nameInput.focus(), 400)
  })

  function beginConnection(displayName: string) {
    showStep('waiting')
    setStatus('connecting')
    if ((window as any).createBrowserClient && config.contactAddress) {
      startRealChat(displayName)
    } else {
      startMockChat()
    }
  }

  if (nameGoBtn) nameGoBtn.addEventListener('click', () => {
    beginConnection((nameInput && nameInput.value.trim()) || 'Website Visitor')
  })
  if (guestBtn) guestBtn.addEventListener('click', () => {
    const GCC = (window as any).GoChatClient
    beginConnection(GCC ? GCC.generateRandomVisitorName() : 'Visitor-' + Math.random().toString(36).substr(2, 4))
  })
  if (nameInput) nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (nameGoBtn) (nameGoBtn as HTMLButtonElement).click() }
  })
  if (offlineBtn) offlineBtn.addEventListener('click', () => {
    offlineMode = true; showStep('offline')
    addMessage('Support is currently offline. Leave a message and we will get back to you.', 'incoming', 0)
    if (input) setTimeout(() => input.focus(), 100)
  })

  // --- Real connection ---
  function startRealChat(displayName: string) {
    try {
      client = (window as any).createBrowserClient({
        contactAddress: config.contactAddress,
        serverUrl: config.serverUrl,
        displayName: displayName,
        onMessage: (text: string) => {
          addMessage(text, 'incoming', 0)
          if (!panelOpen) incrementUnread()
        },
        onStatusChange: (status: string) => {
          if (status === 'connected') {
            connected = true; setStatus('connected'); showStep('chat')
            addMessage(config.welcome || 'Connected! This chat is end-to-end encrypted via SimpleX.', 'incoming', 0)
            if (input) setTimeout(() => input.focus(), 100)
          } else if (status === 'pending' || status === 'confirmed') {
            setStatus('waiting')
          } else if (status === 'offline') {
            connected = false; setStatus('offline')
          } else {
            setStatus(status)
          }
        },
        onError: (err: Error) => {
          console.error('[GoChat]', err); setStatus('error')
        },
        onDeliveryReceipt: () => {
          const chk = pendingChecks.shift()
          if (chk) upgradeCheck(chk)
        },
      })
      client.connect(displayName).catch((err: Error) => {
        console.error('[GoChat] connect failed:', err); setStatus('error'); showStep('start')
      })
    } catch (err) {
      console.error('[GoChat] init failed:', err); setStatus('error'); showStep('start')
    }
  }

  // --- Mock mode ---
  function startMockChat() {
    setTimeout(() => {
      setStatus('waiting')
      setTimeout(() => {
        connected = true; setStatus('connected'); showStep('chat')
        addMessage('Welcome! This is a demo chat.', 'incoming', 0)
        setTimeout(() => addMessage('This chat is end-to-end encrypted. How can we help you?', 'incoming', 0), 400)
      }, 3000)
    }, 1200)
  }

  // --- Send ---
  function sendMessage() {
    if (!input) return
    const text = input.value.trim()
    if (!text) return
    if (!connected && !offlineMode) return
    addMessage(text, 'outgoing', 0)
    input.value = ''; input.style.height = 'auto'; updateSendBtn()
    if (client) {
      client.send(text).catch((err: Error) => {
        console.error('[GoChat] send failed:', err)
        addMessage('Failed to send. Please try again.', 'incoming', 0)
      })
    } else {
      const typing = showTyping()
      setTimeout(() => {
        removeTyping(typing)
        addMessage(getMockReply(), 'incoming', 0)
        if (!panelOpen) incrementUnread()
      }, 800 + Math.random() * 800)
    }
    if (offlineMode) {
      offlineSent = true; offlineMode = false
      setTimeout(() => addMessage('Thank you! We will get back to you as soon as possible.', 'incoming', 200), 300)
      if (inputArea) inputArea.classList.add('disabled')
      if (offlineEndWrap) offlineEndWrap.style.display = 'flex'
    }
  }

  const REPLIES = [
    'That is a great question! Let me check with the team.',
    'Our products ship with hardware-encrypted messaging built in.',
    'You can find more details on our website.',
    'We use the SimpleX protocol for zero-metadata communication.',
    'All communication is end-to-end encrypted by default.',
    'Feel free to ask any questions!',
    'We are happy to help you.',
  ]
  let replyIdx = 0
  function getMockReply() { return REPLIES[replyIdx++ % REPLIES.length] }

  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = Math.min(this.scrollHeight, 120) + 'px'
      updateSendBtn()
    })
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    })
  }
  if (sendBtn) sendBtn.addEventListener('click', sendMessage)
  function updateSendBtn() { if (!sendBtn || !input) return; sendBtn.classList.toggle('active', input.value.trim().length > 0) }

  // --- Public API ---
  ;(window as any).GoChat = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    isOpen: () => panelOpen,
    setStatus: setStatus,
    addMessage: addMessage,
    showTyping: showTyping,
    removeTyping: removeTyping,
    setUnread: setUnread,
    reset: resetChat,
  }

  // --- Init ---
  setStatus('offline')
  setUnread(0)
  showStep('start')
}
