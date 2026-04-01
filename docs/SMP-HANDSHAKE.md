# SMP Handshake Reference
# GoChat - Complete Connection Handshake Flow

*SMP-HANDSHAKE.md - GoChat Protocol Documentation*
*Season 10, 2026-04-01*

---

## Overview

This document describes the complete handshake flow for establishing
a bidirectional E2E encrypted connection between GoChat (browser) and
a SimpleX CLI/App client. The flow involves 17 protocol layers from
WebSocket to decrypted chat messages.

---

## Parties

| Role | Identity | Protocol Role |
|:-----|:---------|:--------------|
| GoChat (Browser) | Bob / Responder | Creates invitation, accepts connection |
| SimpleX CLI/App | Alice / Initiator | Scans invitation, joins connection |

---

## Phase 1: Queue Setup (Browser)

```
Browser                          SMP Server
  |                                  |
  |-- WebSocket Connect ----------->|
  |<-- ServerHello (v6-18) ---------|
  |-- ClientHello (v9) ------------>|
  |          HANDSHAKE COMPLETE      |
  |                                  |
  |-- NEW (recipientAuth key) ----->|
  |<-- IDS (recipientId, senderId) -|
  |                                  |
```

- WebSocket on port 8444 (WSS)
- SMP v9 negotiated (CbAuthenticator for command auth)
- Queue created with X25519 recipientAuth keypair
- recipientId = our queue for receiving
- senderId = contact's ID for sending to us

---

## Phase 2: Invitation (Browser -> Contact Queue)

```
Browser                          SMP Server           CLI
  |                                  |                  |
  |-- SEND AgentInvitation -------->|                  |
  |<-- OK --------------------------|                  |
  |                                  |-- MSG deliver ->|
  |                                  |                  |
```

### AgentInvitation Structure
```
AgentMsgEnvelope:
  [Word16 agentVersion=7]
  ['I' tag]
  [Large connReq URI]  (simplex:/invitation#/...)
  [Tail connInfo]      (profile JSON)

Wrapped in:
  ClientMessage: ['_' PHEmpty] [agentInvitation bytes]
  NaCl encrypt: nacl.box(padded, nonce, peerDhPub, ourDhPriv)
  ClientMsgEnvelope: PubHeader(v=4, e2ePubKey=Just) + nonce + encrypted
```

---

## Phase 3: CLI Accepts (CLI -> Browser Queue)

```
CLI                              SMP Server           Browser
  |                                  |                  |
  |-- SKEY (sender auth key) ------>|                  |
  |<-- OK --------------------------|                  |
  |-- SEND AgentConfirmation ------>|                  |
  |<-- OK --------------------------|                  |
  |                                  |-- MSG deliver ->|
  |                                  |                  |
```

### AgentConfirmation (what Browser receives)
```
AgentMsgEnvelope:
  [Word16 agentVersion=7]
  ['C' tag]
  [Maybe Just '1']
  [E2ERatchetParams:
    [Word16 e2eVersion=3]
    [1B len=68][X448 SPKI key1]     CLI's ratchet key
    [1B len=68][X448 SPKI key2]     CLI's ephemeral key
    [Maybe KEM:                     PQ KEM (if e2eVersion >= 3)
      ['1' Just]['P' Proposed]
      [Word16 1158][SNTRUP761 pubkey]
    ]
  ]
  [Tail encConnInfo]                EncRatchetMessage (ratchet-encrypted)

encConnInfo decrypts to AgentConnInfoReply:
  ['D' tag]
  [1B queueCount=1]
  [SMPQueueInfo:                    CLI's reply queue
    [Word16 clientVersion=4]
    [SMPServer: hosts, port, keyHash]
    [1B len][senderId]
    [1B len=44][X25519 SPKI dhPublicKey]
    [optional queueMode]
  ]
  [Tail connInfo]                   CLI's profile JSON
```

---

## Phase 4: X3DH Key Agreement (Browser)

Browser uses its two X448 private keys (from invitation) and CLI's
two X448 public keys (from AgentConfirmation) to compute shared keys.

```
dh1 = X448(CLI_key2, our_privkey1)     56 bytes
dh2 = X448(CLI_key1, our_privkey2)     56 bytes
dh3 = X448(CLI_key2, our_privkey2)     56 bytes

dhs = dh1 || dh2 || dh3               168 bytes

HKDF-SHA512:
  salt = 64 zero bytes
  ikm  = dhs (168 bytes)
  info = "SimpleXX3DH" (11 bytes)
  output = 96 bytes:
    [0:32]  = sndHK (header key)
    [32:64] = rcvNextHK (next header key)
    [64:96] = ratchetKey (root key)

assocData = CLI_key1_raw (56B) || our_key1_raw (56B)
          = initiator || responder = 112 bytes
```

---

## Phase 5: Ratchet Init + Decrypt (Browser)

### initRcvRatchet
```
rcRK     = ratchetKey        (from X3DH)
rcNHKs   = rcvNextHK         (from X3DH - NOTE: swapped!)
rcNHKr   = sndHK             (from X3DH - NOTE: swapped!)
rcDHRs   = our key2 private  (from invitation)
rcHKs    = zeros             (promoted on AdvanceRatchet)
rcHKr    = zeros             (promoted on AdvanceRatchet)
```

### Decrypt encConnInfo (EncRatchetMessage)
```
1. Parse EncRatchetMessage:
   if first_byte < 0x20: v3 (Word16 header length)
   else: v2 (1-byte header length)
   -> emHeader, emAuthTag (16B), emBody (Tail)

2. Parse EncMessageHeader (from emHeader):
   [Word16 ehVersion][16B ehIV][16B ehAuthTag]
   [1B or Word16 ehBodyLen][ehBody]

3. Decrypt header: AES-256-GCM(NHKr, ehIV, assocData) -> MsgHeader

4. Parse MsgHeader (after unPad):
   [Word16 msgVersion][1B keyLen=68][68B X448 SPKI][KEM field]
   [Word32 PN][Word32 Ns]

5. AdvanceRatchet:
   a. DH recv:  rootKdf(RK, X448(peerDH, ourDHPriv)) -> newRK1, CKr, NHKr_new
   b. New keypair: generate X448
   c. DH send:  rootKdf(newRK1, X448(peerDH, newPriv)) -> newRK2, CKs, NHKs_new

6. chainKdf(CKr) -> [newCKr, messageKey, bodyIV, headerIV]
   WARNING: CRYPTO.md has mk and ck SWAPPED! Use this order.

7. Decrypt body: AES-256-GCM(messageKey, bodyIV, assocData+emHeader)

8. unPad: [Word16 actualLen][content][padding '#']

9. Result: AgentConnInfoReply with CLI queue + profile JSON
```

---

## Phase 6: Send Handshake (Browser -> CLI Queue)

Browser sends AgentConfirmation to CLI's reply queue.

```
1. AgentMessage: ['I'][profile JSON]

2. Ratchet encrypt (rcEncrypt):
   chainKdf(CKs) -> mk, bodyIV, headerIV
   Build MsgHeader, pad to 88B, AES-GCM encrypt with HKs
   Pad body, AES-GCM encrypt with mk
   Assemble EncRatchetMessage

3. AgentConfirmation:
   [Word16 agentVersion=7]['C']['0' Nothing][Tail encRatchetMessage]

4. ClientMessage:
   ['K' PHConfirmation][1B len=44][X25519 SPKI senderAuthKey]
   [agentConfirmation bytes]

5. Pad to 15904 (e2eEncConfirmationLength for first message)

6. NaCl encrypt: nacl.box(padded, nonce, cliDhPub, ourNewE2ePriv)

7. ClientMsgEnvelope:
   [Word16 smpClientVersion=4]
   ['1' Just][1B len=44][X25519 SPKI e2ePubKey]
   [24B nonce][encrypted body]

8. SEND to CLI's reply queue senderId
```

---

## Phase 7: HELLO Exchange

After receiving Browser's confirmation, CLI sends HELLO back.

### CLI -> Browser (HELLO)
```
AgentMsgEnvelope:
  [Word16 agentVersion=7]['M'][Tail encAgentMessage]

encAgentMessage = EncRatchetMessage containing:
  AgentMessage:
    ['M'][APrivHeader: Int64 sndMsgId + 1B hashLen + hash]
    [AMessage: 'H']

Ratchet mode: AdvanceRatchet (new DH key, PN=1, Ns=0)
```

### Browser detects HELLO
```
AMessage tag = 0x48 ('H')
-> "HELLO received! Connection established."
-> "bidirectional ratchet confirmed"
```

---

## Phase 8: Chat Messages

After HELLO, real chat messages flow.

### CLI -> Browser
```
AgentMsgEnvelope:
  [Word16 agentVersion=7]['M'][Tail encAgentMessage]

encAgentMessage = EncRatchetMessage containing:
  AgentMessage:
    ['M'][APrivHeader][A_MSG: ['M'][Tail body]]

body = JSON:
  {"v":"1-16","msgId":"...","event":"x.msg.new",
   "params":{"content":{"text":"Hello GoChat","type":"text"}}}
```

---

## KDF Functions

| KDF | Salt | IKM | Info | Output |
|:----|:-----|:----|:-----|:-------|
| X3DH | 64 x 0x00 | dh1+dh2+dh3 (168B) | "SimpleXX3DH" (11B) | 96B |
| rootKdf | root_key (32B) | dh_output (56B) | "SimpleXRootRatchet" (18B) | 96B |
| chainKdf | empty (0B) | chain_key (32B) | "SimpleXChainRatchet" (19B) | 96B |

### chainKdf Output Split (CORRECT order)
```
[0:32]  = new_chain_key
[32:64] = message_key
[64:80] = body_iv
[80:96] = header_iv
```

---

## Padding Targets

| Message Type | Pad Target | When |
|:-------------|:-----------|:-----|
| AgentInvitation | 15904 | First message to contact queue |
| AgentConfirmation (send) | 15904 | First message to reply queue |
| HELLO / chat messages | 15840 | Subsequent messages |
| Ratchet body (inside) | ~15696 | Depends on header size |

---

## Crypto Libraries (Browser)

| Library | Algorithm | Usage |
|:--------|:----------|:------|
| @noble/curves | X448 DH | X3DH, AdvanceRatchet |
| @noble/hashes | HKDF-SHA512 | X3DH, rootKdf, chainKdf |
| @noble/ciphers | AES-256-GCM (16B IV) | Header + body encrypt/decrypt |
| tweetnacl | NaCl crypto_box | Per-queue E2E (Layer 1) |

---

## Phase 8: Chat Messages (Season 10)

### Browser -> CLI (Chat Message)

After HELLO, browser sends chat messages through the encrypted pipeline:

1. JSON payload: `{"v":"1-16","event":"x.msg.new","params":{"content":{"text":"...","type":"text"}}}`
2. Wrap in AgentMessage: `['M'][APrivHeader: Word64 sndMsgId + 1B hashLen + hash]['M'][Tail body]`
3. Ratchet encrypt (rcEncrypt) with current send chain key
4. Wrap in AgentMsgEnvelope: `[Word16 agentVersion=1]['M'][Tail encRatchetMessage]`
   CRITICAL: agentVersion=1, NOT 7!
5. ClientMessage: `['_' PHEmpty][envelope bytes]`
6. Pad to 15840 (subsequent messages, not 15904)
7. NaCl encrypt: nacl.box with reply queue DH keys
8. ClientMsgEnvelope: PubHeader(v=4, e2ePubKey=Nothing '0') + nonce + encrypted
9. SEND to reply queue senderId

### Event Handling (incoming)

Browser parses incoming JSON before passing to onMessage:
- `x.msg.new`: extract params.content.text, display in chat
- `x.direct.del`: show "Connection ended", set status offline
- Unknown events: log silently, do not display

---

*SMP-HANDSHAKE.md - GoChat Protocol Documentation*
*Season 10, 2026-04-01*
