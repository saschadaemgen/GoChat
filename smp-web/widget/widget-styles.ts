// GoChat Widget CSS - Shadow DOM styles adapted from chat.css
// All styles are scoped via Shadow DOM; :host maps customer-facing --gochat-* variables.

export const WIDGET_CSS = `
:host {
  --bg-card: var(--gochat-color-background, #1a1a2e);
  --bg-deep: var(--gochat-color-surface, #0f0f23);
  --border: rgba(69, 189, 209, 0.12);
  --accent: var(--gochat-color-primary, #45bdd1);
  --accent-border: rgba(69, 189, 209, 0.2);
  --accent-subtle: rgba(69, 189, 209, 0.08);
  --accent-dim: rgba(69, 189, 209, 0.3);
  --accent-glow: rgba(69, 189, 209, 0.15);
  --text-bright: var(--gochat-color-text, #e0e0e0);
  --text-dim: rgba(224, 224, 224, 0.5);
  --warning: #f0ad4e;
  --success: #4caf50;
  --danger: #ff5050;
}

/* === FLOAT BUBBLE === */
.gc-float-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:var(--accent);color:#000;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:transform 0.2s,box-shadow 0.2s;z-index:1;}
.gc-float-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,0.4),0 0 20px rgba(69,189,209,0.3);}
.gc-float-bubble svg{width:24px;height:24px;}
.gc-float-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:var(--danger);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;pointer-events:none;animation:gc-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes gc-badge-pop{0%{transform:scale(0);}60%{transform:scale(1.15);}100%{transform:scale(1);}}

/* === PANEL DOCK === */
.gc-panel-dock{position:fixed;bottom:90px;right:24px;z-index:2;width:380px;max-width:calc(100vw - 48px);opacity:0;transform:translateY(20px) scale(0.95);transition:opacity 0.3s,transform 0.3s cubic-bezier(0.4,0,0.2,1);pointer-events:none;}
.gc-panel-dock.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}

/* === PANEL === */
.gc-panel{width:100%;background:var(--bg-card);border:1px solid var(--accent-border);border-radius:14px;box-shadow:0 16px 50px rgba(0,0,0,0.3),0 0 1px var(--accent-dim);display:flex;flex-direction:column;overflow:hidden;height:min(520px,calc(100vh - 140px));position:relative;}

/* Screen shake */
.gc-panel.shaking{animation:gc-shake 0.5s ease-out;}
@keyframes gc-shake{
  0%,100%{transform:translate(0,0);}
  10%{transform:translate(-4px,-2px);}
  20%{transform:translate(3px,1px);}
  30%{transform:translate(-2px,3px);}
  40%{transform:translate(4px,-1px);}
  50%{transform:translate(-1px,2px);}
  60%{transform:translate(3px,-3px);}
  70%{transform:translate(-3px,1px);}
  80%{transform:translate(2px,-2px);}
  90%{transform:translate(-1px,1px);}
}

/* === HEADER === */
.gc-header{height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0;background:var(--bg-deep);border-bottom:1px solid var(--border);position:relative;overflow:hidden;}
.gc-header-left{display:flex;align-items:center;gap:0.4rem;}
.gc-header-title{font-family:'JetBrains Mono',monospace;font-size:0.72rem;font-weight:700;color:var(--text-bright);}
.gc-status{width:6px;height:6px;border-radius:50%;flex-shrink:0;transition:background 0.3s;}
.gc-status.offline{background:var(--text-dim);}
.gc-status.connecting{background:var(--warning);animation:gc-pulse-dot 1.2s ease-in-out infinite;}
.gc-status.waiting{background:var(--warning);animation:gc-pulse-dot 1.2s ease-in-out infinite;}
.gc-status.connected{background:var(--success);}
.gc-status.error{background:var(--danger);}
@keyframes gc-pulse-dot{0%,100%{opacity:1;}50%{opacity:0.3;}}
.gc-header-e2e{font-family:'JetBrains Mono',monospace;font-size:0.48rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-dim);display:flex;align-items:center;gap:0.25rem;}
.gc-header-e2e svg{width:9px;height:9px;color:var(--accent);opacity:0.7;}
.gc-header-actions{display:flex;align-items:center;gap:0.15rem;}
.gc-header-btn{background:none;border:none;cursor:pointer;color:var(--text-dim);padding:3px;display:flex;align-items:center;transition:color 0.15s,transform 0.3s;border-radius:4px;}
.gc-header-btn:hover{color:var(--accent);}
.gc-header-btn svg{width:13px;height:13px;}
.gc-minimize-text{font-family:'JetBrains Mono',monospace;font-size:0.46rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;padding:0.15rem 0.45rem;border:1px solid var(--accent-border);border-radius:4px;transition:border-color 0.15s,color 0.15s;}
.gc-header-btn:hover .gc-minimize-text{border-color:var(--accent);color:var(--accent);}
.gc-header-sep{width:1px;height:14px;background:var(--border);flex-shrink:0;margin:0 0.2rem;}
.gc-header-btn.gc-close-btn{color:rgba(255,80,80,0.5);transition:color 0.15s,transform 0.4s;}
.gc-header-btn.gc-close-btn:hover{color:rgba(255,80,80,1);}
.gc-header-btn.gc-close-btn svg{width:16px;height:16px;}
.gc-header-btn.gc-close-btn.spinning{animation:gc-spin-x 0.4s ease-in-out;}
@keyframes gc-spin-x{0%{transform:rotate(0deg);}100%{transform:rotate(180deg);}}

/* === DELETE CONFIRMATION SLIDER === */
.gc-header-main{display:flex;align-items:center;justify-content:space-between;width:100%;height:100%;padding:0 0.7rem;transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);}
.gc-header-confirm{position:absolute;top:0;right:0;width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 0.7rem;background:rgba(180,40,40,0.15);transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);box-sizing:border-box;}
.gc-header.confirming .gc-header-main{transform:translateX(-100%);}
.gc-header.confirming .gc-header-confirm{transform:translateX(0);}
.gc-confirm-text{font-family:'JetBrains Mono',monospace;font-size:0.6rem;font-weight:600;color:rgba(255,80,80,0.9);display:flex;align-items:center;gap:0.3rem;}
.gc-confirm-text svg{width:12px;height:12px;color:rgba(255,80,80,0.9);}
.gc-confirm-actions{display:flex;align-items:center;gap:0.4rem;}
.gc-confirm-yes{background:rgba(255,80,80,0.15);color:rgba(255,80,80,1);border:1px solid rgba(255,80,80,0.3);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.52rem;font-weight:600;padding:0.2rem 0.6rem;border-radius:4px;transition:background 0.15s,transform 0.1s;}
.gc-confirm-yes:hover{background:rgba(255,80,80,0.3);}
.gc-confirm-yes:active{transform:scale(0.95);}
.gc-confirm-no{background:none;color:var(--text-dim);border:1px solid var(--border);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.52rem;font-weight:600;padding:0.2rem 0.6rem;border-radius:4px;transition:background 0.15s;}
.gc-confirm-no:hover{background:var(--accent-subtle);color:var(--text-bright);}

/* ============================================
   DESTRUCTION SEQUENCE - HOLLYWOOD EDITION
   ============================================ */

/* Intense cyan flash - multiple pulses */
.gc-destruct-flash{position:absolute;inset:0;top:38px;background:rgba(69,189,209,0.4);opacity:0;z-index:50;pointer-events:none;mix-blend-mode:screen;}
.gc-destruct-flash.active{animation:gc-flash 1s ease-out forwards;}
@keyframes gc-flash{
  0%{opacity:0;}
  5%{opacity:1;}
  10%{opacity:0.2;}
  15%{opacity:0.9;}
  25%{opacity:0.1;}
  35%{opacity:0.7;}
  50%{opacity:0.05;}
  65%{opacity:0.4;}
  80%{opacity:0.02;}
  100%{opacity:0;}
}

/* Heavy scanlines sweeping down */
.gc-destruct-scanline{position:absolute;inset:0;top:38px;z-index:51;pointer-events:none;opacity:0;}
.gc-destruct-scanline.active{opacity:1;animation:gc-scanline-sweep 1.5s ease-out forwards;}
.gc-destruct-scanline::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(69,189,209,0.08) 3px,rgba(69,189,209,0.08) 5px);}
.gc-destruct-scanline::after{content:'';position:absolute;left:0;right:0;height:4px;background:rgba(69,189,209,0.5);box-shadow:0 0 20px rgba(69,189,209,0.8),0 0 40px rgba(69,189,209,0.4);animation:gc-scanbeam 1.2s ease-in-out forwards;}
@keyframes gc-scanbeam{0%{top:-4px;opacity:1;}100%{top:100%;opacity:0.3;}}
@keyframes gc-scanline-sweep{0%{opacity:1;}80%{opacity:0.6;}100%{opacity:0;}}

/* Message glitch before dissolve */
.gc-msg.glitching{animation:gc-glitch 0.3s ease-out forwards;}
@keyframes gc-glitch{
  0%{transform:translateX(0);filter:brightness(1);}
  15%{transform:translateX(-8px) skewX(-2deg);filter:brightness(2) hue-rotate(90deg);}
  30%{transform:translateX(6px) skewX(3deg);filter:brightness(1.5);}
  45%{transform:translateX(-4px) skewX(-1deg);filter:brightness(3) hue-rotate(-90deg);}
  60%{transform:translateX(3px);filter:brightness(2);}
  75%{transform:translateX(-2px);filter:brightness(1.5) saturate(2);}
  100%{transform:translateX(0);filter:brightness(2.5);}
}

/* Message explode outward */
.gc-msg.exploding{animation:gc-explode 0.5s ease-in forwards;}
@keyframes gc-explode{
  0%{opacity:1;transform:scale(1);filter:brightness(2.5);}
  30%{opacity:0.8;transform:scale(1.1);filter:brightness(3) blur(1px);}
  100%{opacity:0;transform:scale(0.3) translateY(-40px);filter:brightness(0) blur(12px);}
}

/* Spark particles - bigger, glowing */
.gc-spark{position:absolute;width:5px;height:5px;border-radius:50%;pointer-events:none;z-index:52;box-shadow:0 0 8px 2px currentColor;}
.gc-spark.active{animation:gc-spark-fly 1.2s ease-out forwards;}
@keyframes gc-spark-fly{
  0%{opacity:1;transform:translate(0,0) scale(1);}
  50%{opacity:0.8;}
  100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0);}
}

/* Spark trail effect */
.gc-spark-trail{position:absolute;width:2px;height:2px;border-radius:50%;pointer-events:none;z-index:52;opacity:0.6;}
.gc-spark-trail.active{animation:gc-trail-fade 0.6s ease-out forwards;}
@keyframes gc-trail-fade{0%{opacity:0.6;transform:scale(1);}100%{opacity:0;transform:scale(0);}}

/* Shockwave ring */
.gc-shockwave{position:absolute;border-radius:50%;border:2px solid rgba(69,189,209,0.6);pointer-events:none;z-index:53;opacity:0;}
.gc-shockwave.active{animation:gc-shockwave-expand 0.8s ease-out forwards;}
@keyframes gc-shockwave-expand{
  0%{opacity:1;transform:scale(0);box-shadow:0 0 20px rgba(69,189,209,0.4);}
  50%{opacity:0.6;}
  100%{opacity:0;transform:scale(3);box-shadow:0 0 0 rgba(69,189,209,0);}
}

/* === DESTROYED OVERLAY === */
.gc-destroyed-overlay{position:absolute;inset:0;top:38px;z-index:55;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.6rem;opacity:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(69,189,209,0.08) 0%,transparent 60%);}
.gc-destroyed-overlay.active{animation:gc-overlay-in 0.5s ease-out 0.3s forwards;}
@keyframes gc-overlay-in{to{opacity:1;}}
.gc-destroyed-icon{width:56px;height:56px;opacity:0;animation:gc-icon-slam 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s forwards;}
.gc-destroyed-icon svg{width:56px;height:56px;color:rgba(69,189,209,0.9);filter:drop-shadow(0 0 15px rgba(69,189,209,0.7)) drop-shadow(0 0 30px rgba(69,189,209,0.4));}
@keyframes gc-icon-slam{
  0%{opacity:0;transform:scale(3) rotate(180deg);filter:blur(8px);}
  60%{opacity:1;transform:scale(0.9) rotate(-10deg);filter:blur(0);}
  80%{transform:scale(1.05) rotate(3deg);}
  100%{opacity:1;transform:scale(1) rotate(0);filter:blur(0);}
}
.gc-destroyed-text{font-family:'JetBrains Mono',monospace;font-size:0.75rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(69,189,209,0.95);text-shadow:0 0 15px rgba(69,189,209,0.7),0 0 35px rgba(69,189,209,0.4),0 0 60px rgba(69,189,209,0.15);opacity:0;animation:gc-text-slam 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.7s forwards;}
@keyframes gc-text-slam{
  0%{opacity:0;transform:translateY(20px) scaleY(3) scaleX(0.3);filter:blur(6px);}
  50%{opacity:1;transform:translateY(-3px) scaleY(0.9) scaleX(1.05);filter:blur(0);}
  70%{transform:translateY(1px) scaleY(1.05) scaleX(0.98);}
  100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0);}
}
.gc-destroyed-sub{font-family:'JetBrains Mono',monospace;font-size:0.46rem;color:var(--text-dim);letter-spacing:0.08em;opacity:0;animation:gc-step-fade-in 0.4s ease-out 1.2s forwards;}
.gc-destroyed-line{width:100px;height:1px;background:linear-gradient(90deg,transparent,rgba(69,189,209,0.6),transparent);opacity:0;animation:gc-line-expand 0.5s ease-out 0.9s forwards;}
@keyframes gc-line-expand{0%{opacity:0;width:0;}100%{opacity:1;width:100px;}}

/* === MESSAGES === */
.gc-messages{flex:1;min-height:0;overflow-y:auto;padding:0.6rem 0.7rem 0.4rem;display:flex;flex-direction:column;gap:0.5rem;scrollbar-width:thin;scrollbar-color:var(--accent-dim) transparent;}
.gc-messages::-webkit-scrollbar{width:2px;}
.gc-messages::-webkit-scrollbar-thumb{background:var(--accent-dim);border-radius:2px;}
.gc-msg{display:flex;align-items:flex-end;gap:0.4rem;opacity:0;transform:translateY(8px);animation:gc-msg-in 0.2s ease-out forwards;}
@keyframes gc-msg-in{to{opacity:1;transform:translateY(0);}}
.gc-msg.incoming{justify-content:flex-start;}
.gc-msg.outgoing{justify-content:flex-end;}
.gc-avatar{width:24px;height:24px;border-radius:50%;background:var(--accent-subtle);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.gc-avatar svg{width:12px;height:12px;color:var(--accent);}
.gc-msg.outgoing .gc-avatar{display:none;}
.gc-bubble{max-width:85%;padding:0.5rem 0.65rem;font-family:'JetBrains Mono',monospace;font-size:0.82rem;line-height:1.55;word-break:break-word;}
.gc-msg.incoming .gc-bubble{background:var(--bg-deep);color:var(--text-bright);border-radius:14px 14px 14px 4px;border:1px solid var(--accent-border);}
.gc-msg.outgoing .gc-bubble{background:var(--accent);color:#000;border-radius:14px 14px 2px 14px;}
[data-theme="dark"] .gc-msg.outgoing .gc-bubble{color:#000;}
.gc-time{font-family:'JetBrains Mono',monospace;font-size:0.46rem;color:var(--text-dim);margin-top:0.15rem;}
.gc-msg.incoming .gc-time{text-align:left;padding-left:2.2rem;}
.gc-msg.outgoing .gc-time{text-align:right;}
.gc-check{display:inline-flex;align-items:center;margin-left:0.2rem;}
.gc-check svg{width:10px;height:10px;color:var(--text-dim);}
.gc-typing{display:flex;align-items:flex-end;gap:0.4rem;}
.gc-typing-dots{display:flex;gap:3px;padding:0.55rem 0.7rem;background:var(--bg-deep);border:1px solid var(--accent-border);border-radius:14px 14px 14px 4px;}
.gc-typing-dots span{width:6px;height:6px;border-radius:50%;background:var(--text-dim);animation:gc-dot-bounce 1.2s ease-in-out infinite;}
.gc-typing-dots span:nth-child(2){animation-delay:0.15s;}
.gc-typing-dots span:nth-child(3){animation-delay:0.3s;}
@keyframes gc-dot-bounce{0%,60%,100%{transform:scale(0.5);opacity:0.4;}30%{transform:scale(1);opacity:1;}}

/* === STEP VIEWS === */
.gc-step{display:none;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:0.8rem;padding:2rem 1.5rem;text-align:center;}
.gc-step.active{display:flex;}
.gc-step-icon{width:48px;height:48px;border-radius:50%;background:var(--accent-subtle);border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.1s forwards;}
.gc-step-icon svg{width:24px;height:24px;color:var(--accent);}
.gc-step-title{font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--text-dim);line-height:1.5;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.2s forwards;}
@keyframes gc-step-fade-in{to{opacity:1;}}
.gc-start-btn{background:var(--accent);color:#000;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.68rem;font-weight:600;padding:0.5rem 1.2rem;border-radius:8px;transition:transform 0.15s,box-shadow 0.15s;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.3s forwards;}
.gc-start-btn:hover{transform:scale(1.04);box-shadow:0 0 12px var(--accent-glow);}
.gc-start-btn:active{transform:scale(0.97);}
.gc-name-input{width:100%;max-width:240px;padding:0.5rem 0.8rem;background:var(--bg-deep);border:1px solid var(--accent-border);border-radius:8px;color:var(--text-bright);font-family:'JetBrains Mono',monospace;font-size:0.72rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;text-align:center;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.25s forwards;}
.gc-name-input::placeholder{color:var(--text-dim);}
.gc-name-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-glow);}
.gc-name-actions{display:flex;gap:0.5rem;width:100%;max-width:240px;opacity:0;animation:gc-step-fade-in 0.4s ease-out 0.35s forwards;}
.gc-name-actions .gc-start-btn{flex:1;margin:0;opacity:1;animation:none;}
.gc-btn-alt{background:var(--bg-deep);color:var(--text-dim);border:1px solid var(--accent-border);}
.gc-btn-alt:hover{color:var(--text-bright);border-color:var(--accent);box-shadow:0 0 8px var(--accent-glow);transform:scale(1.04);}
.gc-waiting-spinner{width:48px;height:48px;border-radius:50%;border:2px solid var(--accent-border);border-top-color:var(--accent);animation:gc-spin 1s linear infinite;}
@keyframes gc-spin{to{transform:rotate(360deg);}}
.gc-waiting-text{font-family:'JetBrains Mono',monospace;font-size:0.62rem;color:var(--text-dim);line-height:1.6;max-width:220px;}
.gc-waiting-dots::after{content:'';animation:gc-ellipsis 1.5s steps(3) infinite;}
@keyframes gc-ellipsis{0%{content:'';}33%{content:'.';}66%{content:'..';}100%{content:'...';}}
.gc-offline-prompt{display:flex;flex-direction:column;align-items:center;gap:0.5rem;margin-top:0.5rem;opacity:0;animation:gc-step-fade-in 0.6s ease-out 0.5s forwards;}
.gc-offline-prompt .gc-start-btn{opacity:1;animation:none;font-size:0.6rem;padding:0.4rem 1rem;}
.gc-offline-hint{font-family:'JetBrains Mono',monospace;font-size:0.5rem;color:var(--text-dim);opacity:0.6;}
.gc-offline-end{display:flex;align-items:center;justify-content:center;padding:0.5rem 0.7rem;border-top:1px solid var(--border);background:var(--bg-deep);}
.gc-offline-end-btn{background:rgba(255,80,80,0.1);color:rgba(255,80,80,0.7);border:1px solid rgba(255,80,80,0.2);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:0.56rem;font-weight:600;padding:0.35rem 0.8rem;border-radius:6px;transition:background 0.15s,color 0.15s;width:100%;}
.gc-offline-end-btn:hover{background:rgba(255,80,80,0.2);color:rgba(255,80,80,1);}

/* === ENCRYPTION BADGE === */
.gc-encrypt-badge{flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:0.3rem;padding:0.35rem 0.7rem;background:var(--accent-subtle);border-top:1px solid var(--border);font-family:'JetBrains Mono',monospace;font-size:0.52rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);position:relative;overflow:hidden;}
.gc-encrypt-badge svg{width:10px;height:10px;color:var(--accent);flex-shrink:0;}
.gc-encrypt-badge::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.04) 45%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 55%,transparent 70%);animation:gc-shimmer 5s ease-in-out infinite;pointer-events:none;}
@keyframes gc-shimmer{0%{left:-100%;}35%{left:150%;}100%{left:150%;}}

/* === INPUT AREA === */
.gc-input-area{flex-shrink:0;display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.7rem 0.7rem;border-top:1px solid var(--border);background:var(--bg-deep);}
.gc-input-area.disabled{opacity:0.4;pointer-events:none;}
.gc-input{flex:1;min-height:40px;max-height:120px;resize:none;border:1px solid var(--accent-border);border-radius:20px;padding:0.5rem 0.8rem;font-family:'JetBrains Mono',monospace;font-size:0.82rem;line-height:1.5;color:var(--text-bright);background:var(--bg-card);outline:none;transition:border-color 0.2s,box-shadow 0.2s;scrollbar-width:thin;scrollbar-color:var(--accent-dim) transparent;}
.gc-input::-webkit-scrollbar{width:2px;}
.gc-input::-webkit-scrollbar-thumb{background:var(--accent-dim);border-radius:2px;}
.gc-input::placeholder{color:var(--text-dim);font-size:0.72rem;}
.gc-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-glow);}
.gc-send{width:40px;height:40px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;color:#000;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 0.15s,box-shadow 0.15s,opacity 0.2s;opacity:0.4;}
.gc-send.active{opacity:1;}
.gc-send:hover{box-shadow:0 0 12px var(--accent-glow);}
.gc-send:active{transform:scale(0.92);}
.gc-send svg{width:16px;height:16px;}

/* === RESPONSIVE === */
@media(max-width:768px){
  .gc-float-bubble{bottom:16px;right:16px;width:52px;height:52px;}
  .gc-float-bubble svg{width:22px;height:22px;}
  .gc-panel-dock{position:fixed;bottom:0;left:0;right:0;width:100vw;max-width:100vw;border-radius:0;}
  .gc-panel{height:calc(100vh - 60px);border-radius:14px 14px 0 0;border-left:none;border-right:none;border-bottom:none;}
  .gc-header{padding:0;}
  .gc-header-main{padding:0 1.4rem 0 1rem;}
  .gc-header-confirm{padding:0 1.4rem 0 1rem;}
  .gc-messages{padding:0.6rem 1.4rem 0.4rem 1rem;}
  .gc-encrypt-badge{padding:0.35rem 1.4rem 0.35rem 1rem;}
  .gc-input-area{padding:0.6rem 1.4rem 0.7rem 1rem;}
  .gc-step{padding:2rem 1.4rem 2rem 1.2rem;}
  .gc-bubble{max-width:85%;}
  .gc-input{min-height:48px;}
}

/* === BUBBLE ANIMATIONS (internal only - nothing outside bubble) === */

/* 1. inner-glow: soft inner box-shadow pulsing */
@keyframes gc-inner-glow{0%,100%{box-shadow:inset 0 0 12px rgba(255,255,255,0);}50%{box-shadow:inset 0 0 20px rgba(255,255,255,0.35);}}
.gc-float-bubble.anim-inner-glow{animation:gc-inner-glow 3s ease-in-out infinite;}

/* 2. icon-breathe: only SVG icon scales */
@keyframes gc-icon-breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.15);}}
.gc-float-bubble.anim-icon-breathe svg{animation:gc-icon-breathe 2.5s ease-in-out infinite;}

/* 3. shimmer: light streak sweeps across */
@keyframes gc-shimmer-sweep{0%{left:-100%;}100%{left:200%;}}
.gc-float-bubble.anim-shimmer{position:relative;overflow:hidden;}
.gc-float-bubble.anim-shimmer::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:gc-shimmer-sweep 3s ease-in-out infinite;pointer-events:none;}

/* 4. wiggle: icon shakes briefly */
@keyframes gc-wiggle{0%,85%,100%{transform:rotate(0deg);}88%{transform:rotate(-12deg);}91%{transform:rotate(10deg);}94%{transform:rotate(-8deg);}97%{transform:rotate(5deg);}}
.gc-float-bubble.anim-wiggle svg{animation:gc-wiggle 4s ease-in-out infinite;}

/* 5. color-shift: brightness shifts */
@keyframes gc-color-shift{0%,100%{filter:brightness(1);}50%{filter:brightness(1.2);}}
.gc-float-bubble.anim-color-shift{animation:gc-color-shift 3s ease-in-out infinite;}

/* 6. icon-flip: Y-axis rotation */
@keyframes gc-icon-flip{0%,80%,100%{transform:rotateY(0deg);}90%{transform:rotateY(180deg);}}
.gc-float-bubble.anim-icon-flip svg{animation:gc-icon-flip 5s ease-in-out infinite;transform-style:preserve-3d;}

/* 7. notification-dot: pulsing white dot inside */
@keyframes gc-dot-pulse{0%,100%{opacity:0;transform:scale(0);}50%{opacity:1;transform:scale(1);}}
.gc-float-bubble.anim-notification-dot{position:relative;}
.gc-float-bubble.anim-notification-dot::after{content:'';position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;background:#fff;animation:gc-dot-pulse 2s ease-in-out infinite;pointer-events:none;z-index:3;}

/* 8. radar-sweep: rotating conic gradient inside */
@keyframes gc-sweep{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
.gc-float-bubble.anim-radar-sweep{position:relative;overflow:hidden;}
.gc-float-bubble.anim-radar-sweep::after{content:'';position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,transparent 0%,rgba(255,255,255,0.25) 25%,transparent 50%);animation:gc-sweep 3s linear infinite;pointer-events:none;}

/* 9. shimmer-flip (DEFAULT): shimmer + icon-flip combined */
.gc-float-bubble.anim-shimmer-flip{position:relative;overflow:hidden;}
.gc-float-bubble.anim-shimmer-flip::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);animation:gc-shimmer-sweep 3s ease-in-out infinite;pointer-events:none;}
.gc-float-bubble.anim-shimmer-flip svg{animation:gc-icon-flip 5s ease-in-out infinite;transform-style:preserve-3d;}

/* 10. pulse: classic expanding rings */
@keyframes gc-pulse-ring{0%{transform:scale(1);opacity:0.5;}100%{transform:scale(1.9);opacity:0;}}
.gc-float-bubble.anim-pulse{position:relative;}
.gc-float-bubble.anim-pulse::before,.gc-float-bubble.anim-pulse::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--gochat-color-primary,#45bdd1);animation:gc-pulse-ring 2.2s ease-out infinite;pointer-events:none;}
.gc-float-bubble.anim-pulse::after{animation-delay:1.1s;}

/* 11. neon: hue-rotate color cycling */
@keyframes gc-neon{0%{filter:hue-rotate(0deg) brightness(1.1);}25%{filter:hue-rotate(90deg) brightness(1.2);}50%{filter:hue-rotate(180deg) brightness(1.1);}75%{filter:hue-rotate(270deg) brightness(1.2);}100%{filter:hue-rotate(360deg) brightness(1.1);}}
.gc-float-bubble.anim-neon{animation:gc-neon 6s linear infinite;}

/* 12. heartbeat: two quick pulses then pause */
@keyframes gc-heartbeat{0%,100%{transform:scale(1);}14%{transform:scale(1.12);}20%{transform:scale(1);}28%{transform:scale(1.08);}34%{transform:scale(1);}}
.gc-float-bubble.anim-heartbeat{animation:gc-heartbeat 2s ease-in-out infinite;}

/* 13. jelly: wobbly elastic effect */
@keyframes gc-jelly{0%,100%{transform:scale(1,1);}25%{transform:scale(0.9,1.1);}50%{transform:scale(1.1,0.9);}75%{transform:scale(0.95,1.05);}}
.gc-float-bubble.anim-jelly{animation:gc-jelly 3s ease-in-out infinite;}

/* 14. ring-rotate: spinning ring border */
@keyframes gc-ring-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
.gc-float-bubble.anim-ring-rotate{position:relative;}
.gc-float-bubble.anim-ring-rotate::before{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid transparent;border-top-color:var(--gochat-color-primary,#45bdd1);border-right-color:var(--gochat-color-primary,#45bdd1);animation:gc-ring-spin 1.5s linear infinite;pointer-events:none;}

/* 15. float: gentle up-down hover */
@keyframes gc-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
.gc-float-bubble.anim-float{animation:gc-float 4s ease-in-out infinite;}

/* Suppress animations when panel is open */
.gc-float-bubble.panel-open,.gc-float-bubble.panel-open svg{animation:none !important;}
.gc-float-bubble.panel-open::before,.gc-float-bubble.panel-open::after{display:none;}

/* === REDUCED MOTION === */
@media(prefers-reduced-motion:reduce){
  .gc-panel-dock,.gc-header-main,.gc-header-confirm,.gc-float-bubble{transition:none;}
  .gc-msg,.gc-step-icon,.gc-step-title,.gc-start-btn,.gc-name-input,.gc-name-actions{animation:none;opacity:1;transform:none;}
  .gc-typing-dots span,.gc-encrypt-badge::after,.gc-float-badge,.gc-waiting-spinner{animation:none;}
  .gc-panel.shaking,.gc-header-btn.gc-close-btn.spinning,.gc-msg.glitching,.gc-msg.exploding,.gc-destruct-flash.active,.gc-destruct-scanline.active{animation:none;}
  .gc-destroyed-icon,.gc-destroyed-text,.gc-destroyed-sub,.gc-destroyed-line{animation:none;opacity:1;}
  .gc-float-bubble,.gc-float-bubble svg{animation:none !important;}
  .gc-float-bubble::before,.gc-float-bubble::after{display:none;}
}
`;
