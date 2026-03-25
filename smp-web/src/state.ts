// Connection lifecycle state machine.
//
// Tracks a browser-to-SimpleX-app connection through typed states
// with validated transitions and event emission. Standalone module
// with zero internal dependencies - synchronous, records state
// changes, does not perform I/O.
//
// States: NEW -> QUEUE_CREATED -> PENDING -> CONFIRMED -> CONNECTED -> CLOSED
//         (+ ERROR from any non-terminal state)
//
// The connection manager (Tasks 3/4) orchestrates async operations
// and calls transition() on success/failure.

// -- Connection states

export type ConnectionState =
  | "NEW"
  | "QUEUE_CREATED"
  | "PENDING"
  | "CONFIRMED"
  | "CONNECTED"
  | "CLOSED"
  | "ERROR"

// -- Actions that trigger transitions

export type ConnectionAction =
  | "createQueues"
  | "sendRequest"
  | "receiveConfirmation"
  | "acknowledgeConfirmation"
  | "close"
  | "error"

// -- Transition table

const TRANSITIONS: Record<ConnectionState, Partial<Record<ConnectionAction, ConnectionState>>> = {
  NEW: {
    createQueues: "QUEUE_CREATED",
    error: "ERROR",
  },
  QUEUE_CREATED: {
    sendRequest: "PENDING",
    error: "ERROR",
    close: "CLOSED",
  },
  PENDING: {
    receiveConfirmation: "CONFIRMED",
    error: "ERROR",
    close: "CLOSED",
  },
  CONFIRMED: {
    acknowledgeConfirmation: "CONNECTED",
    error: "ERROR",
  },
  CONNECTED: {
    close: "CLOSED",
    error: "ERROR",
  },
  CLOSED: {},
  ERROR: {
    close: "CLOSED",
  },
}

// -- Error types

export type ConnectionErrorCode =
  | "QUEUE_CREATION_FAILED"
  | "REQUEST_SEND_FAILED"
  | "CONFIRMATION_TIMEOUT"
  | "CONFIRMATION_FAILED"
  | "ACKNOWLEDGMENT_FAILED"
  | "TRANSPORT_ERROR"
  | "QUEUE_DELETED"
  | "PROTOCOL_ERROR"

export interface ConnectionError {
  code: ConnectionErrorCode
  message: string
  cause?: Error
}

// -- Metadata types

export interface QueuePairInfo {
  receiveQueue: {
    server: string
    recipientId: string
    senderId: string
  }
  sendQueue: {
    server: string
    senderId: string
  }
}

export interface RemotePartyInfo {
  sendQueue: {
    server: string
    senderId: string
  }
}

export interface ConnectionInfo {
  connectionId: string
  createdAt: number
  state: ConnectionState
  stateChangedAt: number
  error?: ConnectionError
  contactAddress?: unknown
  queuePair?: QueuePairInfo
  remoteInfo?: RemotePartyInfo
}

// -- Event types

export interface ConnectionStateEvent {
  connectionId: string
  previousState: ConnectionState
  newState: ConnectionState
  action: ConnectionAction
  timestamp: number
  error?: ConnectionError
}

export type ConnectionStateListener = (event: ConnectionStateEvent) => void

// -- Errors

export class InvalidTransitionError extends Error {
  constructor(
    public readonly currentState: ConnectionState,
    public readonly action: ConnectionAction,
    message: string
  ) {
    super(message)
    this.name = "InvalidTransitionError"
  }
}

// -- Connection ID generation

function generateConnectionId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

// -- States where setQueuePair is valid

const QUEUE_PAIR_VALID_STATES: Set<ConnectionState> = new Set([
  "QUEUE_CREATED", "PENDING", "CONFIRMED", "CONNECTED",
])

// -- States where setRemoteInfo is valid

const REMOTE_INFO_VALID_STATES: Set<ConnectionState> = new Set([
  "CONFIRMED", "CONNECTED",
])

// -- Connection state machine

export class ConnectionStateMachine {
  private readonly connectionId: string
  private readonly createdAt: number
  private currentState: ConnectionState = "NEW"
  private stateChangedAt: number
  private connectionError?: ConnectionError
  private queuePair?: QueuePairInfo
  private remoteInfo?: RemotePartyInfo
  private contactAddress?: unknown
  private listeners: ConnectionStateListener[] = []
  private transitionHistory: ConnectionStateEvent[] = []

  constructor(connectionId?: string) {
    this.connectionId = connectionId ?? generateConnectionId()
    this.createdAt = Date.now()
    this.stateChangedAt = this.createdAt
  }

  get info(): Readonly<ConnectionInfo> {
    return Object.freeze({
      connectionId: this.connectionId,
      createdAt: this.createdAt,
      state: this.currentState,
      stateChangedAt: this.stateChangedAt,
      error: this.connectionError,
      contactAddress: this.contactAddress,
      queuePair: this.queuePair,
      remoteInfo: this.remoteInfo,
    })
  }

  get state(): ConnectionState {
    return this.currentState
  }

  get id(): string {
    return this.connectionId
  }

  get isTerminal(): boolean {
    return this.currentState === "CLOSED" || this.currentState === "ERROR"
  }

  get history(): ReadonlyArray<ConnectionStateEvent> {
    return [...this.transitionHistory]
  }

  canTransition(action: ConnectionAction): boolean {
    const stateTransitions = TRANSITIONS[this.currentState]
    return action in stateTransitions
  }

  transition(action: ConnectionAction, error?: ConnectionError): void {
    const stateTransitions = TRANSITIONS[this.currentState]
    const nextState = stateTransitions[action]

    if (nextState === undefined) {
      throw new InvalidTransitionError(
        this.currentState,
        action,
        "Invalid transition: cannot perform '" + action + "' from state '" + this.currentState + "'"
      )
    }

    const now = Date.now()
    const previousState = this.currentState

    this.currentState = nextState
    this.stateChangedAt = now

    if (nextState === "ERROR" && error) {
      this.connectionError = error
    }

    const event: ConnectionStateEvent = {
      connectionId: this.connectionId,
      previousState,
      newState: nextState,
      action,
      timestamp: now,
      error: nextState === "ERROR" ? error : undefined,
    }

    this.transitionHistory.push(event)

    // Notify listeners synchronously
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  setQueuePair(queuePair: QueuePairInfo): void {
    if (!QUEUE_PAIR_VALID_STATES.has(this.currentState)) {
      throw new InvalidTransitionError(
        this.currentState,
        "createQueues",
        "Cannot set queue pair in state '" + this.currentState + "'"
      )
    }
    this.queuePair = queuePair
  }

  setRemoteInfo(remoteInfo: RemotePartyInfo): void {
    if (!REMOTE_INFO_VALID_STATES.has(this.currentState)) {
      throw new InvalidTransitionError(
        this.currentState,
        "receiveConfirmation",
        "Cannot set remote info in state '" + this.currentState + "'"
      )
    }
    this.remoteInfo = remoteInfo
  }

  onStateChange(listener: ConnectionStateListener): () => void {
    this.listeners.push(listener)
    return () => {
      const idx = this.listeners.indexOf(listener)
      if (idx >= 0) this.listeners.splice(idx, 1)
    }
  }
}
