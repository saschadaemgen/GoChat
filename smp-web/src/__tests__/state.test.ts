import {describe, it, expect, vi} from "vitest"
import {
  ConnectionStateMachine,
  InvalidTransitionError,
} from "../state.js"
import type {
  ConnectionState,
  ConnectionAction,
  ConnectionError,
  ConnectionStateEvent,
  QueuePairInfo,
  RemotePartyInfo,
} from "../state.js"

// -- Test helpers

function makeError(code: ConnectionError["code"] = "TRANSPORT_ERROR"): ConnectionError {
  return {code, message: "test error"}
}

function makeQueuePair(): QueuePairInfo {
  return {
    receiveQueue: {server: "smp1.example.com", recipientId: "rcv1", senderId: "snd1"},
    sendQueue: {server: "smp2.example.com", senderId: "snd2"},
  }
}

function makeRemoteInfo(): RemotePartyInfo {
  return {
    sendQueue: {server: "smp3.example.com", senderId: "snd3"},
  }
}

// Run through full happy path and return the machine
function fullLifecycle(id?: string): ConnectionStateMachine {
  const sm = new ConnectionStateMachine(id)
  sm.transition("createQueues")
  sm.transition("sendRequest")
  sm.transition("receiveConfirmation")
  sm.transition("acknowledgeConfirmation")
  sm.transition("close")
  return sm
}

// -- Construction

describe("Construction", () => {
  it("creates with auto-generated connectionId", () => {
    const sm = new ConnectionStateMachine()
    expect(sm.id).toBeDefined()
    expect(sm.id.length).toBe(32) // 16 bytes hex = 32 chars
  })

  it("creates with custom connectionId", () => {
    const sm = new ConnectionStateMachine("my-conn-123")
    expect(sm.id).toBe("my-conn-123")
  })

  it("starts in NEW state", () => {
    const sm = new ConnectionStateMachine()
    expect(sm.state).toBe("NEW")
  })

  it("has correct initial ConnectionInfo", () => {
    const before = Date.now()
    const sm = new ConnectionStateMachine("test-id")
    const after = Date.now()
    const info = sm.info

    expect(info.connectionId).toBe("test-id")
    expect(info.state).toBe("NEW")
    expect(info.createdAt).toBeGreaterThanOrEqual(before)
    expect(info.createdAt).toBeLessThanOrEqual(after)
    expect(info.stateChangedAt).toBe(info.createdAt)
    expect(info.error).toBeUndefined()
    expect(info.queuePair).toBeUndefined()
    expect(info.remoteInfo).toBeUndefined()
  })

  it("history starts empty", () => {
    const sm = new ConnectionStateMachine()
    expect(sm.history).toEqual([])
  })

  it("auto-generated IDs are unique", () => {
    const ids = new Set<string>()
    for (let i = 0; i < 20; i++) {
      ids.add(new ConnectionStateMachine().id)
    }
    expect(ids.size).toBe(20)
  })
})

// -- Happy path transitions

describe("Happy path transitions", () => {
  it("NEW -> QUEUE_CREATED via createQueues", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    expect(sm.state).toBe("QUEUE_CREATED")
  })

  it("QUEUE_CREATED -> PENDING via sendRequest", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    expect(sm.state).toBe("PENDING")
  })

  it("PENDING -> CONFIRMED via receiveConfirmation", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    expect(sm.state).toBe("CONFIRMED")
  })

  it("CONFIRMED -> CONNECTED via acknowledgeConfirmation", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("acknowledgeConfirmation")
    expect(sm.state).toBe("CONNECTED")
  })

  it("CONNECTED -> CLOSED via close", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("acknowledgeConfirmation")
    sm.transition("close")
    expect(sm.state).toBe("CLOSED")
  })

  it("full lifecycle: NEW -> CLOSED", () => {
    const sm = fullLifecycle()
    expect(sm.state).toBe("CLOSED")
    expect(sm.isTerminal).toBe(true)
  })
})

// -- Error transitions

describe("Error transitions", () => {
  it("NEW -> ERROR via error action", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError("QUEUE_CREATION_FAILED"))
    expect(sm.state).toBe("ERROR")
    expect(sm.info.error?.code).toBe("QUEUE_CREATION_FAILED")
  })

  it("QUEUE_CREATED -> ERROR via error action", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("error", makeError("REQUEST_SEND_FAILED"))
    expect(sm.state).toBe("ERROR")
    expect(sm.info.error?.code).toBe("REQUEST_SEND_FAILED")
  })

  it("PENDING -> ERROR via error action", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("error", makeError("CONFIRMATION_TIMEOUT"))
    expect(sm.state).toBe("ERROR")
  })

  it("CONFIRMED -> ERROR via error action", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("error", makeError("ACKNOWLEDGMENT_FAILED"))
    expect(sm.state).toBe("ERROR")
  })

  it("CONNECTED -> ERROR via error action", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("acknowledgeConfirmation")
    sm.transition("error", makeError("TRANSPORT_ERROR"))
    expect(sm.state).toBe("ERROR")
  })

  it("ERROR -> CLOSED via close (cleanup)", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    sm.transition("close")
    expect(sm.state).toBe("CLOSED")
  })

  it("error info is stored in ConnectionInfo", () => {
    const sm = new ConnectionStateMachine()
    const err = makeError("PROTOCOL_ERROR")
    sm.transition("error", err)
    expect(sm.info.error).toEqual(err)
  })
})

// -- Close transitions (early termination)

describe("Close transitions (early termination)", () => {
  it("QUEUE_CREATED -> CLOSED via close (abort before sending)", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("close")
    expect(sm.state).toBe("CLOSED")
  })

  it("PENDING -> CLOSED via close (cancel while waiting)", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("close")
    expect(sm.state).toBe("CLOSED")
  })
})

// -- Invalid transitions

describe("Invalid transitions", () => {
  const invalidCases: Array<{from: ConnectionState; setup: (sm: ConnectionStateMachine) => void; action: ConnectionAction}> = [
    {from: "NEW", setup: () => {}, action: "sendRequest"},
    {from: "NEW", setup: () => {}, action: "receiveConfirmation"},
    {from: "NEW", setup: () => {}, action: "acknowledgeConfirmation"},
    {from: "NEW", setup: () => {}, action: "close"},
    {from: "QUEUE_CREATED", setup: sm => sm.transition("createQueues"), action: "receiveConfirmation"},
    {from: "QUEUE_CREATED", setup: sm => sm.transition("createQueues"), action: "acknowledgeConfirmation"},
    {from: "PENDING", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest") }, action: "createQueues"},
    {from: "PENDING", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest") }, action: "sendRequest"},
    {from: "PENDING", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest") }, action: "acknowledgeConfirmation"},
    {from: "CONFIRMED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation") }, action: "createQueues"},
    {from: "CONFIRMED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation") }, action: "sendRequest"},
    {from: "CONFIRMED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation") }, action: "receiveConfirmation"},
    {from: "CONNECTED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation"); sm.transition("acknowledgeConfirmation") }, action: "createQueues"},
    {from: "CONNECTED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation"); sm.transition("acknowledgeConfirmation") }, action: "sendRequest"},
    {from: "CONNECTED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation"); sm.transition("acknowledgeConfirmation") }, action: "receiveConfirmation"},
    {from: "CONNECTED", setup: sm => { sm.transition("createQueues"); sm.transition("sendRequest"); sm.transition("receiveConfirmation"); sm.transition("acknowledgeConfirmation") }, action: "acknowledgeConfirmation"},
  ]

  for (const {from, setup, action} of invalidCases) {
    it(`${from} -> ${action} throws InvalidTransitionError`, () => {
      const sm = new ConnectionStateMachine()
      setup(sm)
      expect(() => sm.transition(action)).toThrow(InvalidTransitionError)
    })
  }

  it("CLOSED -> any action throws (terminal state)", () => {
    const actions: ConnectionAction[] = [
      "createQueues", "sendRequest", "receiveConfirmation",
      "acknowledgeConfirmation", "close", "error",
    ]
    for (const action of actions) {
      const sm = new ConnectionStateMachine()
      sm.transition("createQueues")
      sm.transition("close")
      expect(() => sm.transition(action)).toThrow(InvalidTransitionError)
    }
  })

  it("ERROR -> createQueues throws (no restart)", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(() => sm.transition("createQueues")).toThrow(InvalidTransitionError)
  })

  it("ERROR -> sendRequest throws", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(() => sm.transition("sendRequest")).toThrow(InvalidTransitionError)
  })

  it("ERROR -> error throws (already in error)", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(() => sm.transition("error", makeError())).toThrow(InvalidTransitionError)
  })

  it("InvalidTransitionError has correct properties", () => {
    const sm = new ConnectionStateMachine()
    try {
      sm.transition("sendRequest")
      expect.fail("Should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidTransitionError)
      if (e instanceof InvalidTransitionError) {
        expect(e.currentState).toBe("NEW")
        expect(e.action).toBe("sendRequest")
        expect(e.message).toContain("sendRequest")
        expect(e.message).toContain("NEW")
      }
    }
  })
})

// -- canTransition()

describe("canTransition()", () => {
  it("returns true for valid next actions from NEW", () => {
    const sm = new ConnectionStateMachine()
    expect(sm.canTransition("createQueues")).toBe(true)
    expect(sm.canTransition("error")).toBe(true)
  })

  it("returns false for invalid actions from NEW", () => {
    const sm = new ConnectionStateMachine()
    expect(sm.canTransition("sendRequest")).toBe(false)
    expect(sm.canTransition("close")).toBe(false)
    expect(sm.canTransition("receiveConfirmation")).toBe(false)
  })

  it("returns false for all actions from CLOSED", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("close")
    const actions: ConnectionAction[] = [
      "createQueues", "sendRequest", "receiveConfirmation",
      "acknowledgeConfirmation", "close", "error",
    ]
    for (const action of actions) {
      expect(sm.canTransition(action)).toBe(false)
    }
  })

  it("returns true for close from ERROR", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(sm.canTransition("close")).toBe(true)
  })

  it("returns false for non-close actions from ERROR", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(sm.canTransition("createQueues")).toBe(false)
    expect(sm.canTransition("error")).toBe(false)
  })
})

// -- isTerminal

describe("isTerminal", () => {
  it("false for NEW", () => {
    expect(new ConnectionStateMachine().isTerminal).toBe(false)
  })

  it("false for QUEUE_CREATED", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    expect(sm.isTerminal).toBe(false)
  })

  it("false for PENDING", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    expect(sm.isTerminal).toBe(false)
  })

  it("false for CONFIRMED", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    expect(sm.isTerminal).toBe(false)
  })

  it("false for CONNECTED", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("acknowledgeConfirmation")
    expect(sm.isTerminal).toBe(false)
  })

  it("true for CLOSED", () => {
    const sm = fullLifecycle()
    expect(sm.isTerminal).toBe(true)
  })

  it("true for ERROR", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(sm.isTerminal).toBe(true)
  })
})

// -- Event listeners

describe("Event listeners", () => {
  it("listener receives event on transition", () => {
    const sm = new ConnectionStateMachine("evt-test")
    const events: ConnectionStateEvent[] = []
    sm.onStateChange(e => events.push(e))

    sm.transition("createQueues")

    expect(events.length).toBe(1)
    expect(events[0].connectionId).toBe("evt-test")
    expect(events[0].previousState).toBe("NEW")
    expect(events[0].newState).toBe("QUEUE_CREATED")
    expect(events[0].action).toBe("createQueues")
    expect(events[0].timestamp).toBeGreaterThan(0)
  })

  it("error event includes error details", () => {
    const sm = new ConnectionStateMachine()
    const events: ConnectionStateEvent[] = []
    sm.onStateChange(e => events.push(e))

    const err = makeError("QUEUE_CREATION_FAILED")
    sm.transition("error", err)

    expect(events[0].error).toEqual(err)
  })

  it("non-error event has no error details", () => {
    const sm = new ConnectionStateMachine()
    const events: ConnectionStateEvent[] = []
    sm.onStateChange(e => events.push(e))
    sm.transition("createQueues")
    expect(events[0].error).toBeUndefined()
  })

  it("multiple listeners all receive events", () => {
    const sm = new ConnectionStateMachine()
    const events1: ConnectionStateEvent[] = []
    const events2: ConnectionStateEvent[] = []
    sm.onStateChange(e => events1.push(e))
    sm.onStateChange(e => events2.push(e))

    sm.transition("createQueues")

    expect(events1.length).toBe(1)
    expect(events2.length).toBe(1)
  })

  it("unsubscribe function works", () => {
    const sm = new ConnectionStateMachine()
    const events: ConnectionStateEvent[] = []
    const unsub = sm.onStateChange(e => events.push(e))

    sm.transition("createQueues")
    expect(events.length).toBe(1)

    unsub()
    sm.transition("sendRequest")
    expect(events.length).toBe(1) // no new event
  })

  it("listeners called synchronously in registration order", () => {
    const sm = new ConnectionStateMachine()
    const order: number[] = []
    sm.onStateChange(() => order.push(1))
    sm.onStateChange(() => order.push(2))
    sm.onStateChange(() => order.push(3))

    sm.transition("createQueues")

    expect(order).toEqual([1, 2, 3])
  })
})

// -- setQueuePair / setRemoteInfo

describe("setQueuePair", () => {
  it("works in QUEUE_CREATED state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.setQueuePair(makeQueuePair())
    expect(sm.info.queuePair).toEqual(makeQueuePair())
  })

  it("works in PENDING state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.setQueuePair(makeQueuePair())
    expect(sm.info.queuePair).toBeDefined()
  })

  it("works in CONFIRMED state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.setQueuePair(makeQueuePair())
    expect(sm.info.queuePair).toBeDefined()
  })

  it("works in CONNECTED state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("acknowledgeConfirmation")
    sm.setQueuePair(makeQueuePair())
    expect(sm.info.queuePair).toBeDefined()
  })

  it("throws in NEW state", () => {
    const sm = new ConnectionStateMachine()
    expect(() => sm.setQueuePair(makeQueuePair())).toThrow(InvalidTransitionError)
  })

  it("throws in CLOSED state", () => {
    const sm = fullLifecycle()
    expect(() => sm.setQueuePair(makeQueuePair())).toThrow(InvalidTransitionError)
  })

  it("throws in ERROR state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(() => sm.setQueuePair(makeQueuePair())).toThrow(InvalidTransitionError)
  })
})

describe("setRemoteInfo", () => {
  it("works in CONFIRMED state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.setRemoteInfo(makeRemoteInfo())
    expect(sm.info.remoteInfo).toEqual(makeRemoteInfo())
  })

  it("works in CONNECTED state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    sm.transition("receiveConfirmation")
    sm.transition("acknowledgeConfirmation")
    sm.setRemoteInfo(makeRemoteInfo())
    expect(sm.info.remoteInfo).toBeDefined()
  })

  it("throws in NEW state", () => {
    const sm = new ConnectionStateMachine()
    expect(() => sm.setRemoteInfo(makeRemoteInfo())).toThrow(InvalidTransitionError)
  })

  it("throws in QUEUE_CREATED state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    expect(() => sm.setRemoteInfo(makeRemoteInfo())).toThrow(InvalidTransitionError)
  })

  it("throws in PENDING state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    sm.transition("sendRequest")
    expect(() => sm.setRemoteInfo(makeRemoteInfo())).toThrow(InvalidTransitionError)
  })

  it("throws in CLOSED state", () => {
    const sm = fullLifecycle()
    expect(() => sm.setRemoteInfo(makeRemoteInfo())).toThrow(InvalidTransitionError)
  })

  it("throws in ERROR state", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("error", makeError())
    expect(() => sm.setRemoteInfo(makeRemoteInfo())).toThrow(InvalidTransitionError)
  })
})

// -- History

describe("History", () => {
  it("records all transitions in order", () => {
    const sm = fullLifecycle("hist-test")
    const hist = sm.history
    expect(hist.length).toBe(5) // createQueues, sendRequest, receiveConfirmation, acknowledgeConfirmation, close
    expect(hist[0].action).toBe("createQueues")
    expect(hist[1].action).toBe("sendRequest")
    expect(hist[2].action).toBe("receiveConfirmation")
    expect(hist[3].action).toBe("acknowledgeConfirmation")
    expect(hist[4].action).toBe("close")
  })

  it("history is a copy (not a reference)", () => {
    const sm = new ConnectionStateMachine()
    sm.transition("createQueues")
    const hist1 = sm.history
    sm.transition("sendRequest")
    const hist2 = sm.history
    expect(hist1.length).toBe(1)
    expect(hist2.length).toBe(2)
  })

  it("full lifecycle has correct state sequence", () => {
    const sm = fullLifecycle()
    const states = sm.history.map(e => e.newState)
    expect(states).toEqual(["QUEUE_CREATED", "PENDING", "CONFIRMED", "CONNECTED", "CLOSED"])
  })
})

// -- Timestamp updates

describe("Timestamp updates", () => {
  it("stateChangedAt updates on each transition", () => {
    const sm = new ConnectionStateMachine()
    const t1 = sm.info.stateChangedAt
    sm.transition("createQueues")
    const t2 = sm.info.stateChangedAt
    expect(t2).toBeGreaterThanOrEqual(t1)
  })

  it("createdAt does not change on transitions", () => {
    const sm = new ConnectionStateMachine()
    const created = sm.info.createdAt
    sm.transition("createQueues")
    sm.transition("sendRequest")
    expect(sm.info.createdAt).toBe(created)
  })
})
