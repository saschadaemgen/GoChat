import {describe, it, expect} from "vitest"
import {
  parseContactAddress,
  parseSMPQueueURI,
  parseSMPServer,
  validateBase64url,
  ContactAddressError,
} from "../address.js"

// -- Test data

// Valid base64url key (32 bytes = 43 chars unpadded)
const SAMPLE_KEY = "lrdvu2d8A1GumSmoKb2krQmtKhWXq-tyGpHuM7aMwsw"
const SAMPLE_IDENTITY = "u2dS9sG8nMNURyZwqASV4yROM28YQxY37YKx2OLSuPA"
const SAMPLE_QUEUE_ID = "Yk2YqYBYnpEE_9JmRSVZ4Q"
const SAMPLE_DH_KEY = "MCowBQYDK2VuAyEAjiswwI3O_NlS8Fk3HJHA868-I-GizH0e2NbGXhYEXx0"

function buildSMPQueueURI(opts?: {port?: number; sndSecure?: boolean; hosts?: string}): string {
  const port = opts?.port ? ":" + opts.port : ""
  const hosts = opts?.hosts || "smp1.example.com"
  const sndSecure = opts?.sndSecure ? "&k=s" : ""
  return "smp://" + SAMPLE_IDENTITY + "@" + hosts + port + "/" + SAMPLE_QUEUE_ID + "#/?v=1-7&dh=" + SAMPLE_DH_KEY + sndSecure
}

function buildLegacyURI(scheme: "simplex" | "https", path: "contact" | "invitation", opts?: {e2e?: string; multiQueue?: boolean}): string {
  const queueURI = buildSMPQueueURI()
  const encodedQueue = encodeURIComponent(queueURI)
  const queues = opts?.multiQueue
    ? encodedQueue + encodeURIComponent(";") + encodedQueue
    : encodedQueue
  const e2e = opts?.e2e ? "&e2e=" + opts.e2e : ""

  if (scheme === "simplex") {
    return "simplex:/" + path + "#/?v=1-7&smp=" + queues + e2e
  }
  return "https://simplex.chat/" + path + "#/?v=1-7&smp=" + queues + e2e
}

// -- Short link parsing (https:// variant)

describe("Short link parsing (https://)", () => {
  it("parses contact address with /a path", () => {
    const result = parseContactAddress("https://smp6.simplex.im/a#" + SAMPLE_KEY)
    expect(result.format).toBe("short")
    if (result.format === "short") {
      expect(result.data.linkType).toBe("contact")
      expect(result.data.linkKey).toBe(SAMPLE_KEY)
      expect(result.data.server.hosts).toEqual(["smp6.simplex.im"])
      expect(result.data.server.port).toBe(443)
    }
  })

  it("parses invitation with /i path", () => {
    const result = parseContactAddress("https://smp6.simplex.im/i#" + SAMPLE_KEY)
    expect(result.format).toBe("short")
    if (result.format === "short") {
      expect(result.data.linkType).toBe("invitation")
    }
  })

  it("parses with custom port in host", () => {
    const result = parseContactAddress("https://smp.example.com:5224/a#" + SAMPLE_KEY)
    expect(result.format).toBe("short")
    if (result.format === "short") {
      expect(result.data.server.hosts).toEqual(["smp.example.com"])
      expect(result.data.server.port).toBe(5224)
    }
  })

  it("throws MISSING_FRAGMENT for missing hash", () => {
    expect(() => parseContactAddress("https://smp6.simplex.im/a"))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("https://smp6.simplex.im/a")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("MISSING_FRAGMENT")
    }
  })

  it("throws MISSING_FRAGMENT for empty hash", () => {
    expect(() => parseContactAddress("https://smp6.simplex.im/a#"))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("https://smp6.simplex.im/a#")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("MISSING_FRAGMENT")
    }
  })
})

// -- Short link parsing (simplex:/ variant)

describe("Short link parsing (simplex:/)", () => {
  it("parses contact address with host param", () => {
    const result = parseContactAddress("simplex:/a?h=smp6.simplex.im#" + SAMPLE_KEY)
    expect(result.format).toBe("short")
    if (result.format === "short") {
      expect(result.data.linkType).toBe("contact")
      expect(result.data.linkKey).toBe(SAMPLE_KEY)
      expect(result.data.server.hosts).toEqual(["smp6.simplex.im"])
      expect(result.data.server.port).toBe(5223)
    }
  })

  it("parses invitation with host and port", () => {
    const result = parseContactAddress("simplex:/i?h=smp.example.com&p=5224#" + SAMPLE_KEY)
    expect(result.format).toBe("short")
    if (result.format === "short") {
      expect(result.data.linkType).toBe("invitation")
      expect(result.data.server.port).toBe(5224)
    }
  })

  it("parses with cert fingerprint", () => {
    const result = parseContactAddress("simplex:/a?h=smp.example.com&c=" + SAMPLE_IDENTITY + "#" + SAMPLE_KEY)
    expect(result.format).toBe("short")
    if (result.format === "short") {
      expect(result.data.server.serverIdentity).toBe(SAMPLE_IDENTITY)
    }
  })

  it("throws MISSING_SERVER when ?h= is missing", () => {
    expect(() => parseContactAddress("simplex:/a#" + SAMPLE_KEY))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("simplex:/a#" + SAMPLE_KEY)
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("MISSING_SERVER")
    }
  })

  it("throws INVALID_PORT for bad port value", () => {
    expect(() => parseContactAddress("simplex:/a?h=host&p=abc#" + SAMPLE_KEY))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("simplex:/a?h=host&p=abc#" + SAMPLE_KEY)
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_PORT")
    }
  })
})

// -- Legacy full link parsing (simplex:/ variant)

describe("Legacy full link parsing (simplex:/)", () => {
  it("parses contact with single queue", () => {
    const uri = buildLegacyURI("simplex", "contact")
    const result = parseContactAddress(uri)
    expect(result.format).toBe("full")
    if (result.format === "full") {
      expect(result.data.linkType).toBe("contact")
      expect(result.data.agentVersion).toEqual({min: 1, max: 7})
      expect(result.data.smpQueues.length).toBe(1)
      expect(result.data.smpQueues[0].server.hosts).toEqual(["smp1.example.com"])
      expect(result.data.smpQueues[0].senderId).toBe(SAMPLE_QUEUE_ID)
      expect(result.data.smpQueues[0].dhPublicKey).toBe(SAMPLE_DH_KEY)
    }
  })

  it("parses with multiple queues (semicolon-separated)", () => {
    const uri = buildLegacyURI("simplex", "contact", {multiQueue: true})
    const result = parseContactAddress(uri)
    expect(result.format).toBe("full")
    if (result.format === "full") {
      expect(result.data.smpQueues.length).toBe(2)
    }
  })

  it("parses invitation with e2e params", () => {
    const uri = buildLegacyURI("simplex", "invitation", {e2e: "v%3D1%26x3dh%3Dparams"})
    const result = parseContactAddress(uri)
    expect(result.format).toBe("full")
    if (result.format === "full") {
      expect(result.data.linkType).toBe("invitation")
      expect(result.data.e2eParams).toBeDefined()
    }
  })

  it("throws for missing smp param", () => {
    expect(() => parseContactAddress("simplex:/contact#/?v=1-7"))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("simplex:/contact#/?v=1-7")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_SMP_URI")
    }
  })
})

// -- Legacy full link parsing (https:// variant)

describe("Legacy full link parsing (https://)", () => {
  it("parses contact from simplex.chat host", () => {
    const uri = buildLegacyURI("https", "contact")
    const result = parseContactAddress(uri)
    expect(result.format).toBe("full")
    if (result.format === "full") {
      expect(result.data.linkType).toBe("contact")
      expect(result.data.smpQueues.length).toBe(1)
    }
  })

  it("parses invitation from simplex.chat host", () => {
    const uri = buildLegacyURI("https", "invitation")
    const result = parseContactAddress(uri)
    expect(result.format).toBe("full")
    if (result.format === "full") {
      expect(result.data.linkType).toBe("invitation")
    }
  })
})

// -- SMP Queue URI parsing

describe("parseSMPQueueURI", () => {
  it("parses basic queue URI", () => {
    const q = parseSMPQueueURI(buildSMPQueueURI())
    expect(q.server.serverIdentity).toBe(SAMPLE_IDENTITY)
    expect(q.server.hosts).toEqual(["smp1.example.com"])
    expect(q.server.port).toBe(5223) // default
    expect(q.senderId).toBe(SAMPLE_QUEUE_ID)
    expect(q.dhPublicKey).toBe(SAMPLE_DH_KEY)
    expect(q.smpVersion).toEqual({min: 1, max: 7})
    expect(q.sndSecure).toBe(false)
  })

  it("parses with explicit port", () => {
    const q = parseSMPQueueURI(buildSMPQueueURI({port: 5223}))
    expect(q.server.port).toBe(5223)
  })

  it("parses with sndSecure flag", () => {
    const q = parseSMPQueueURI(buildSMPQueueURI({sndSecure: true}))
    expect(q.sndSecure).toBe(true)
  })

  it("parses with multiple hosts", () => {
    const q = parseSMPQueueURI(buildSMPQueueURI({hosts: "host1.com,host2.com"}))
    expect(q.server.hosts).toEqual(["host1.com", "host2.com"])
  })

  it("defaults port to 5223", () => {
    const q = parseSMPQueueURI(buildSMPQueueURI())
    expect(q.server.port).toBe(5223)
  })

  it("parses single version number", () => {
    const uri = "smp://" + SAMPLE_IDENTITY + "@host/" + SAMPLE_QUEUE_ID + "#/?v=7&dh=" + SAMPLE_DH_KEY
    const q = parseSMPQueueURI(uri)
    expect(q.smpVersion).toEqual({min: 7, max: 7})
  })

  it("throws MISSING_DH_KEY when dh= is missing", () => {
    const uri = "smp://" + SAMPLE_IDENTITY + "@host/" + SAMPLE_QUEUE_ID + "#/?v=1-7"
    expect(() => parseSMPQueueURI(uri)).toThrow(ContactAddressError)
    try {
      parseSMPQueueURI(uri)
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("MISSING_DH_KEY")
    }
  })

  it("throws INVALID_SMP_URI for wrong scheme", () => {
    expect(() => parseSMPQueueURI("http://identity@host/queue#/?v=1&dh=key"))
      .toThrow(ContactAddressError)
    try {
      parseSMPQueueURI("http://identity@host/queue#/?v=1&dh=key")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_SMP_URI")
    }
  })

  it("throws INVALID_SMP_URI for missing queue ID", () => {
    expect(() => parseSMPQueueURI("smp://" + SAMPLE_IDENTITY + "@host"))
      .toThrow(ContactAddressError)
  })

  it("throws INVALID_SMP_URI for missing fragment", () => {
    expect(() => parseSMPQueueURI("smp://" + SAMPLE_IDENTITY + "@host/" + SAMPLE_QUEUE_ID))
      .toThrow(ContactAddressError)
  })
})

// -- SMP server parsing

describe("parseSMPServer", () => {
  it("parses identity@hostname:port", () => {
    const s = parseSMPServer(SAMPLE_IDENTITY + "@smp.example.com:5223")
    expect(s.serverIdentity).toBe(SAMPLE_IDENTITY)
    expect(s.hosts).toEqual(["smp.example.com"])
    expect(s.port).toBe(5223)
  })

  it("parses identity@hostname without port (defaults to 5223)", () => {
    const s = parseSMPServer(SAMPLE_IDENTITY + "@smp.example.com")
    expect(s.hosts).toEqual(["smp.example.com"])
    expect(s.port).toBe(5223)
  })

  it("parses identity@host1,host2:port", () => {
    const s = parseSMPServer(SAMPLE_IDENTITY + "@host1.com,host2.com:5224")
    expect(s.hosts).toEqual(["host1.com", "host2.com"])
    expect(s.port).toBe(5224)
  })

  it("validates identity is valid base64url", () => {
    expect(() => parseSMPServer("invalid identity!@host"))
      .toThrow(ContactAddressError)
  })

  it("throws for missing @ separator", () => {
    expect(() => parseSMPServer("nothinghere"))
      .toThrow(ContactAddressError)
  })
})

// -- Base64url validation

describe("validateBase64url", () => {
  it("accepts valid base64url (alphanumeric, -, _)", () => {
    expect(validateBase64url("abc123-_")).toBe("abc123-_")
  })

  it("accepts unpadded base64url", () => {
    expect(validateBase64url(SAMPLE_KEY)).toBe(SAMPLE_KEY)
  })

  it("accepts padded base64url (with =)", () => {
    expect(validateBase64url("abc=")).toBe("abc=")
    expect(validateBase64url("abcd==")).toBe("abcd==")
  })

  it("rejects strings with + (standard base64, not url-safe)", () => {
    expect(() => validateBase64url("abc+def")).toThrow(ContactAddressError)
    try {
      validateBase64url("abc+def")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_BASE64")
    }
  })

  it("rejects strings with / (standard base64, not url-safe)", () => {
    expect(() => validateBase64url("abc/def")).toThrow(ContactAddressError)
  })

  it("rejects strings with spaces", () => {
    expect(() => validateBase64url("abc def")).toThrow(ContactAddressError)
  })

  it("rejects empty string", () => {
    expect(() => validateBase64url("")).toThrow(ContactAddressError)
  })
})

// -- Error cases

describe("Error cases", () => {
  it("rejects http:// scheme", () => {
    expect(() => parseContactAddress("http://simplex.chat/contact#/?v=1&smp=test"))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("http://simplex.chat/contact#/?v=1&smp=test")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_SCHEME")
    }
  })

  it("rejects unknown path in simplex:/ scheme", () => {
    expect(() => parseContactAddress("simplex:/unknown#test"))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("simplex:/unknown#test")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_PATH")
    }
  })

  it("rejects unknown path in https:// scheme", () => {
    expect(() => parseContactAddress("https://example.com/unknown#test"))
      .toThrow(ContactAddressError)
    try {
      parseContactAddress("https://example.com/unknown#test")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_PATH")
    }
  })

  it("rejects empty string", () => {
    expect(() => parseContactAddress("")).toThrow(ContactAddressError)
    try {
      parseContactAddress("")
    } catch (e) {
      expect((e as ContactAddressError).code).toBe("INVALID_SCHEME")
    }
  })

  it("rejects garbage input", () => {
    expect(() => parseContactAddress("not a uri at all")).toThrow(ContactAddressError)
  })

  it("rejects ftp:// scheme", () => {
    expect(() => parseContactAddress("ftp://example.com/a#key")).toThrow(ContactAddressError)
  })
})

// -- Cross-format: version range parsing edge cases

describe("Version range edge cases", () => {
  it("parses single version in legacy link", () => {
    const queue = "smp://" + SAMPLE_IDENTITY + "@host/" + SAMPLE_QUEUE_ID + "#/?v=9&dh=" + SAMPLE_DH_KEY
    const encoded = encodeURIComponent(queue)
    const uri = "simplex:/contact#/?v=7&smp=" + encoded
    const result = parseContactAddress(uri)
    if (result.format === "full") {
      expect(result.data.agentVersion).toEqual({min: 7, max: 7})
      expect(result.data.smpQueues[0].smpVersion).toEqual({min: 9, max: 9})
    }
  })

  it("throws for missing version in legacy link", () => {
    const queue = "smp://" + SAMPLE_IDENTITY + "@host/" + SAMPLE_QUEUE_ID + "#/?v=1-7&dh=" + SAMPLE_DH_KEY
    const encoded = encodeURIComponent(queue)
    expect(() => parseContactAddress("simplex:/contact#/?smp=" + encoded))
      .toThrow(ContactAddressError)
  })
})

// -- Real SimpleX app contact URIs (double-encoding regression)

describe("Real SimpleX app contact URI parsing", () => {
  const REAL_SIMPLEX_URI =
    "https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2F6iIcWT_dF2zN_w5xzZEY7HI2Prbh3ldP07YTyDexPjE%3D%40smp10.simplex.im%2Fo9snLUQd6MlAiq7n3nFtB9r6jSqj8FE7%23%2F%3Fv%3D1-4%26dh%3DMCowBQYDK2VuAyEABo11ArKXGHb9zoz_76yzv0fWBdYnSJcm__i0uZAy_38%253D%26q%3Dc%26srv%3Drb2pbttocvnbrngnwziclp2f4ckjq65kebafws6g4hy22cdaiv5dwjqd.onion"

  it("parses real SimpleX app contact URI with double-encoded parameters", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    expect(result.format).toBe("full")
  })

  it("extracts correct server identity from real URI", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    if (result.format !== "full") throw new Error("Expected full format")
    expect(result.data.smpQueues[0].server.serverIdentity).toBe("6iIcWT_dF2zN_w5xzZEY7HI2Prbh3ldP07YTyDexPjE=")
  })

  it("extracts correct host from real URI", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    if (result.format !== "full") throw new Error("Expected full format")
    expect(result.data.smpQueues[0].server.hosts).toEqual(["smp10.simplex.im"])
  })

  it("extracts correct queue ID from real URI", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    if (result.format !== "full") throw new Error("Expected full format")
    expect(result.data.smpQueues[0].senderId).toBe("o9snLUQd6MlAiq7n3nFtB9r6jSqj8FE7")
  })

  it("extracts DH key with correct base64url padding", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    if (result.format !== "full") throw new Error("Expected full format")
    // The DH key ends with = padding which was double-encoded as %253D -> %3D -> =
    expect(result.data.smpQueues[0].dhPublicKey).toBe("MCowBQYDK2VuAyEABo11ArKXGHb9zoz_76yzv0fWBdYnSJcm__i0uZAy_38=")
  })

  it("extracts correct SMP version range from real URI", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    if (result.format !== "full") throw new Error("Expected full format")
    expect(result.data.smpQueues[0].smpVersion).toEqual({min: 1, max: 4})
  })

  it("extracts correct agent version range from real URI", () => {
    const result = parseContactAddress(REAL_SIMPLEX_URI)
    if (result.format !== "full") throw new Error("Expected full format")
    expect(result.data.agentVersion).toEqual({min: 2, max: 7})
  })

  it("parses a second real URI with different server", () => {
    // Another typical SimpleX contact URI with standard encoding
    const uri = "https://simplex.chat/contact#/?v=1-7&smp=smp%3A%2F%2FabcDEF123_-%3D%40smp.example.com%2FqueueID123%23%2F%3Fv%3D1-7%26dh%3DsomeBase64urlKey"
    const result = parseContactAddress(uri)
    expect(result.format).toBe("full")
    if (result.format !== "full") throw new Error("Expected full format")
    expect(result.data.smpQueues[0].server.hosts).toEqual(["smp.example.com"])
    expect(result.data.smpQueues[0].senderId).toBe("queueID123")
    expect(result.data.smpQueues[0].dhPublicKey).toBe("someBase64urlKey")
  })
})
