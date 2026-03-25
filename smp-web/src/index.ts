// SMP protocol client for web/browser environments.
// Re-exports encoding primitives from xftp-web for convenience.
export {
  Decoder,
  encodeBytes, decodeBytes,
  encodeLarge, decodeLarge,
  encodeWord16, decodeWord16,
  encodeBool, decodeBool,
  encodeMaybe, decodeMaybe,
  encodeList, decodeList,
  concatBytes
} from "@simplex-chat/xftp-web/dist/protocol/encoding.js"

// ChatTransport interface and SMP transport types
export type {
  ChatTransport,
  SMPServerAddress,
  TransportState,
  TransportEventHandler,
  SMPTransportErrorCode,
  SMPClientState,
  SMPResponseHandler,
  SMPPushHandler,
  ConnectionEvent,
  ConnectionChangeHandler,
} from "./types.js"
export {SMPTransportError} from "./types.js"

// WebSocket transport implementation
export {SMPWebSocketTransport} from "./transport.js"
export type {SMPTransportConfig} from "./transport.js"

// SMP handshake encoding/decoding
export type {
  VersionRange,
  SMPServerHandshake,
  SMPClientHandshake,
  SignedKey,
} from "./handshake.js"
export {
  decodeSMPServerHandshake,
  encodeSMPClientHandshake,
  compatibleVRange,
  smpClientVersionRange,
  verifyServerIdentity,
  blockPad,
  blockUnpad,
  buildCommandBlock,
  parseResponseBlock,
} from "./handshake.js"

// SMP client with handshake and command dispatch
export type {SMPClient, SMPClientConfig} from "./client.js"
export {connectSMP, encodePING} from "./client.js"

// SMPClientAgent with connection pooling and reconnection
export type {SMPClientAgent, SMPAgentConfig} from "./agent.js"
export {newSMPAgent, calculateBackoff, serverKey} from "./agent.js"

// SMP command encoders (Season 3)
export type {NewQueueParams, SendParams, EnableNotificationsParams} from "./commands.js"
export {
  encodeNEW,
  encodeSUB,
  encodeKEY,
  encodeSKEY,
  encodeSEND,
  encodeACK,
  encodeDEL,
  encodeOFF,
  encodeGET,
  encodeNKEY,
  encodeNDEL,
  encodeNSUB,
  encodeQUE,
} from "./commands.js"
// Note: encodePING is already exported from client.js above.
// commands.ts also exports encodePING for standalone use.

// Contact address URI parser (Season 4)
export type {
  SMPServer,
  SMPQueueURI,
  ConnectionMode,
  ShortLinkData,
  FullLinkData,
  ParsedContactAddress,
  ContactAddressErrorCode,
} from "./address.js"
export {
  parseContactAddress,
  parseSMPQueueURI,
  parseSMPServer,
  validateBase64url,
  ContactAddressError,
} from "./address.js"

// Connection state machine (Season 4)
export type {
  ConnectionState,
  ConnectionAction,
  ConnectionInfo,
  QueuePairInfo,
  RemotePartyInfo,
  ConnectionError,
  ConnectionErrorCode,
  ConnectionStateEvent,
  ConnectionStateListener,
} from "./state.js"
export {
  ConnectionStateMachine,
  InvalidTransitionError,
} from "./state.js"

// Crypto utilities (Season 4)
export type {KeyPair} from "./crypto-utils.js"
export {
  generateX25519KeyPair,
  generateEd25519KeyPair,
  generateX448KeyPair,
  encodeEd25519PublicKey,
  encodeX25519PublicKey,
  encodeX448PublicKey,
  decodeX448PublicKey,
  x448DH,
  x25519DH,
} from "./crypto-utils.js"

// ConnectionManager (Season 4)
export type {
  ConnectionKeys,
  ContactQueueInfo,
  ManagedConnection,
  ConnectionManagerConfig,
} from "./connection.js"
export {ConnectionManager} from "./connection.js"

// X3DH key agreement (Season 4)
export type {X3DHKeys, X3DHResult} from "./x3dh.js"
export {performX3DH} from "./x3dh.js"

// Double Ratchet (Season 4)
export type {RatchetSendState} from "./ratchet.js"
export {initSendRatchet, ratchetEncrypt} from "./ratchet.js"

// Agent envelope (Season 4)
export type {AgentConfirmationParams} from "./agent-envelope.js"
export {buildAgentConfirmation} from "./agent-envelope.js"

// Connection request builder (Season 4)
export type {ConnectionRequestParams} from "./connection-request.js"
export {
  buildConnInfoJSON,
  buildSmpEncConfirmation,
  buildSmpConfirmation,
  buildSmpConfirmationWithKey,
  buildConnectionRequest,
  zstdCompress,
} from "./connection-request.js"
