# SMP Version Reference
# GoChat - SimpleX Messaging Protocol Version Guide

*SMP-VERSIONS.md - GoChat Protocol Documentation*
*Season 10, 2026-04-01*

---

## Overview

SimpleX uses multiple independent version fields across different
protocol layers. Each layer has its own version range and meaning.
Getting the wrong version in the wrong field is a common source of
A_VERSION errors.

---

## Version Fields

### SMP Transport Version (smpClientVersion)

The SMP server-client protocol version. Negotiated during handshake.

| Field | Size | Location |
|:------|:-----|:---------|
| smpClientVersion | Word16 BE | ServerHello, ClientHello, PubHeader, SMPQueueInfo |

| Version | Features |
|:--------|:---------|
| 1 | Initial (legacy server encoding) |
| 2 | Modern server encoding |
| 3 | sndAuthKey support (senderCanSecure) |
| 4 | Current minimum for GoChat connections |
| 6 | maxSMPClientVersion cap in GoChat handshake.ts |
| 8 | shortLinks support |
| 9 | Fast Duplex (SKEY, CbAuthenticator, sndSecure) |
| 18 | Maximum server version (smp.simplego.dev) |

**GoChat negotiates v9** with maxSMPClientVersion capped at 6 in
handshake.ts (workaround). Server supports 6-18.

### SMP Agent Version (agentVersion)

The agent-level protocol version. Determines message format.

| Field | Size | Location |
|:------|:-----|:---------|
| agentVersion | Word16 BE | AgentMsgEnvelope (first 2 bytes after Layer 1 decrypt) |

| Context | Value | Hex | Notes |
|:--------|:------|:----|:------|
| AgentConfirmation (tag 'C') | 7 | 00 07 | Protocol version for handshake |
| AgentMsgEnvelope (tag 'M') | **1** | 00 01 | Message format version - NOT 7! |
| AgentInvitation (tag 'I') | 7 | 00 07 | Same as confirmation |
| AgentRatchetKey (tag 'R') | 7 | 00 07 | Same as confirmation |

**CRITICAL:** AgentMsgEnvelope for HELLO and chat messages uses
agentVersion=**1**, not 2, not 7. Using 7 causes A_VERSION on the
CLI. This was SimpleGo Bug #21 (Session 21).

### E2E Encryption Version (e2eVersion / VersionE2E)

The Double Ratchet encryption version. Determines header format.

| Field | Size | Location |
|:------|:-----|:---------|
| e2eVersion | Word16 BE | E2ERatchetParams, EncMessageHeader (ehVersion) |

| Version | Features |
|:--------|:---------|
| 1 | Initial (deprecated) |
| 2 | KDF X3DH (kdfX3DHE2EEncryptVersion) - minimum supported |
| 3 | PQ Ratchet (pqRatchetE2EEncryptVersion) - current |

**Version 2 vs 3 differences:**

| Aspect | v2 | v3 |
|:-------|:---|:---|
| EncRatchetMessage header prefix | 1-byte length (123) | Word16 BE length (124) |
| EncMessageHeader ehBody prefix | 1-byte length | Word16 BE length |
| MsgHeader KEM field | Not present | Present (Maybe ARKEMParams) |
| MsgHeader padded size | 88 bytes | 88 (no PQ) or 2310 (PQ) |
| EncRatchetMessage header size | 123 bytes | 124 (no PQ) or 2346 (PQ) |

**Auto-detection** (from Haskell largeP / C smp_ratchet.c):
```
if first_byte < 0x20:
  v3 format - Word16 BE length prefix
else:
  v2 format - 1-byte length prefix
```

### Ratchet Version (rcVersion)

Internal ratchet state version, sent in MsgHeader as msgMaxVersion.

| Field | Size | Location |
|:------|:-----|:---------|
| msgMaxVersion | Word16 BE | MsgHeader (first 2 bytes after unPad) |

Typically matches e2eVersion. Used to negotiate PQ support upgrade.

### Agent Version Range (crAgentVRange)

Version range in the connection request URI.

| Context | Range | In URI |
|:--------|:------|:-------|
| GoChat invitation | 2-7 | `v=2-7` |
| CLI response | 2-7 | Negotiated |

---

## Version Checks (Three A_VERSION Gates)

The CLI performs three independent version checks on received
AgentConfirmation messages. Any failure throws A_VERSION.

### Check 1: SMP Client Version Range
```haskell
unless (smpClientVersion `isCompatible` smpAgentVRange) $
  throwE $ AGENT A_VERSION
```
Location: PubHeader smpClientVersion in ClientMsgEnvelope.

### Check 2: Agent Version Compatibility
```haskell
unless (agentVersion `isCompatible` smpAgentVRange
        || agentVersion <= agreedAgentVersion) $
  throwE $ AGENT A_VERSION
```
Location: agentVersion in AgentMsgEnvelope body.

### Check 3: E2E Version Range
```haskell
unless (e2eVersion `isCompatible` e2eEncryptVRange) $
  throwE $ AGENT A_VERSION
```
Location: e2eVersion in E2ERatchetParams (only for AgentConfirmation).

---

## Quick Reference: Which Version Where

| Wire Location | Field | GoChat Value |
|:-------------|:------|:-------------|
| ClientMsgEnvelope PubHeader | smpClientVersion | 4 |
| AgentConfirmation body | agentVersion | 7 |
| AgentMsgEnvelope body (HELLO/MSG) | agentVersion | **1** |
| E2ERatchetParams | e2eVersion | 3 (from CLI) |
| EncMessageHeader | ehVersion | 3 |
| MsgHeader | msgMaxVersion | 3 |
| Invitation URI | crAgentVRange | 2-7 |
| SMPQueueInfo | clientVersion | 4 |

---

*SMP-VERSIONS.md - GoChat Protocol Documentation*
*Season 9, 2026-03-31*
