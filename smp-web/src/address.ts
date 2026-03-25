// SimpleX contact address URI parser.
//
// Handles two generations of contact link formats:
//
// Generation 1 (Legacy, pre-v6.4): Full connection data in the URI.
//   simplex:/contact#/?v=1-7&smp=smp%3A%2F%2F...
//   https://simplex.chat/contact#/?v=1-7&smp=smp%3A%2F%2F...
//
// Generation 2 (Short links, v6.4+): Server + encrypted key only.
//   https://smp6.simplex.im/a#<base64url-key>
//   simplex:/a#<base64url-key>?h=smp6.simplex.im
//
// The parser returns a discriminated union (ParsedContactAddress) with
// format: "short" or format: "full". Short links require LGET resolution
// (handled by downstream code, not here).

// -- Error types

export type ContactAddressErrorCode =
  | "INVALID_SCHEME"
  | "INVALID_PATH"
  | "MISSING_FRAGMENT"
  | "INVALID_SMP_URI"
  | "INVALID_VERSION"
  | "MISSING_DH_KEY"
  | "INVALID_BASE64"
  | "MISSING_SERVER"
  | "INVALID_PORT"

export class ContactAddressError extends Error {
  constructor(
    public readonly code: ContactAddressErrorCode,
    message: string
  ) {
    super(message)
    this.name = "ContactAddressError"
  }
}

// -- Data types

export interface SMPServer {
  /** SHA-256 hash of server certificate SPKI, base64url-encoded */
  serverIdentity: string
  /** Server hostname(s) - multiple for failover */
  hosts: string[]
  /** Server port (default: 5223) */
  port: number
}

export interface SMPQueueURI {
  /** Server address */
  server: SMPServer
  /** Sender queue ID, base64url-encoded */
  senderId: string
  /** Recipient's X25519 DH public key, base64url-encoded */
  dhPublicKey: string
  /** SMP protocol version range */
  smpVersion: {min: number; max: number}
  /** Whether sender can secure queue (SKEY command, v9+) */
  sndSecure: boolean
}

export type ConnectionMode = "contact" | "invitation"

export interface ShortLinkData {
  /** Which SMP server hosts this link */
  server: SMPServer
  /** Link type */
  linkType: ConnectionMode
  /** Base64url-encoded key material from hash fragment */
  linkKey: string
}

export interface FullLinkData {
  /** Link type */
  linkType: ConnectionMode
  /** Agent protocol version range */
  agentVersion: {min: number; max: number}
  /** One or more SMP queue URIs */
  smpQueues: SMPQueueURI[]
  /** Optional E2E encryption parameters */
  e2eParams?: string
}

export type ParsedContactAddress =
  | {format: "short"; data: ShortLinkData}
  | {format: "full"; data: FullLinkData}

// -- Base64url validation

const BASE64URL_RE = /^[A-Za-z0-9_-]+=*$/

/**
 * Validate base64url string format (RFC 4648 section 5).
 * Does not decode to bytes - just validates characters.
 */
export function validateBase64url(input: string): string {
  if (input.length === 0 || !BASE64URL_RE.test(input)) {
    throw new ContactAddressError("INVALID_BASE64", "Invalid base64url encoding: " + input)
  }
  return input
}

// -- Version range parsing

function parseVersionRange(s: string): {min: number; max: number} {
  const dashIdx = s.indexOf("-")
  if (dashIdx === -1) {
    const v = parseInt(s, 10)
    if (isNaN(v)) throw new ContactAddressError("INVALID_VERSION", "Invalid version: " + s)
    return {min: v, max: v}
  }
  const min = parseInt(s.substring(0, dashIdx), 10)
  const max = parseInt(s.substring(dashIdx + 1), 10)
  if (isNaN(min) || isNaN(max)) {
    throw new ContactAddressError("INVALID_VERSION", "Invalid version range: " + s)
  }
  return {min, max}
}

// -- SMP server parsing

/**
 * Parse an SMP server address string.
 * Format: identity@host1[,host2]:port
 */
export function parseSMPServer(serverStr: string): SMPServer {
  const atIdx = serverStr.indexOf("@")
  if (atIdx === -1) {
    throw new ContactAddressError("INVALID_SMP_URI", "Missing @ in server address: " + serverStr)
  }

  const identity = serverStr.substring(0, atIdx)
  validateBase64url(identity)

  const hostPart = serverStr.substring(atIdx + 1)
  if (hostPart.length === 0) {
    throw new ContactAddressError("MISSING_SERVER", "Empty host in server address")
  }

  // Port is after the last colon, but only if the part after colon is numeric
  const lastColon = hostPart.lastIndexOf(":")
  let hostsStr: string
  let port = 5223

  if (lastColon > 0) {
    const portCandidate = hostPart.substring(lastColon + 1)
    const portNum = parseInt(portCandidate, 10)
    if (!isNaN(portNum) && portNum > 0 && portNum <= 65535 && portCandidate === String(portNum)) {
      hostsStr = hostPart.substring(0, lastColon)
      port = portNum
    } else {
      // Not a valid port - treat entire thing as host
      hostsStr = hostPart
    }
  } else {
    hostsStr = hostPart
  }

  const hosts = hostsStr.split(",").filter(h => h.length > 0)
  if (hosts.length === 0) {
    throw new ContactAddressError("MISSING_SERVER", "No hosts in server address")
  }

  return {serverIdentity: identity, hosts, port}
}

// -- SMP queue URI parsing

/**
 * Parse a single SMP queue URI.
 * Format: smp://identity@host:port/queueId#/?v=1-7&dh=key[&k=s]
 */
export function parseSMPQueueURI(uri: string): SMPQueueURI {
  if (!uri.startsWith("smp://")) {
    throw new ContactAddressError("INVALID_SMP_URI", "SMP queue URI must start with smp://")
  }

  const rest = uri.substring(6) // strip "smp://"

  // Split on first "/" to get server and remainder
  const slashIdx = rest.indexOf("/")
  if (slashIdx === -1) {
    throw new ContactAddressError("INVALID_SMP_URI", "Missing queue ID in SMP URI")
  }

  const serverStr = rest.substring(0, slashIdx)
  const pathAndFragment = rest.substring(slashIdx + 1)

  const server = parseSMPServer(serverStr)

  // Split on "#/?" to get queueId and params
  const fragIdx = pathAndFragment.indexOf("#/?")
  if (fragIdx === -1) {
    throw new ContactAddressError("INVALID_SMP_URI", "Missing fragment (#/?) in SMP URI")
  }

  const senderId = pathAndFragment.substring(0, fragIdx)
  validateBase64url(senderId)

  const paramsStr = pathAndFragment.substring(fragIdx + 3) // skip "#/?"
  const params = parseQueryParams(paramsStr)

  // Version
  const vStr = params.get("v")
  if (!vStr) {
    throw new ContactAddressError("INVALID_VERSION", "Missing v= in SMP queue URI")
  }
  const smpVersion = parseVersionRange(vStr)

  // DH key
  const dhKey = params.get("dh")
  if (!dhKey) {
    throw new ContactAddressError("MISSING_DH_KEY", "Missing dh= in SMP queue URI")
  }
  validateBase64url(dhKey)

  // sndSecure
  const sndSecure = params.get("k") === "s"

  return {server, senderId, dhPublicKey: dhKey, smpVersion, sndSecure}
}

// -- Main parser

/**
 * Parse any SimpleX contact address format.
 * Accepts both legacy long URIs and new short links.
 */
export function parseContactAddress(uri: string): ParsedContactAddress {
  if (!uri || uri.length === 0) {
    throw new ContactAddressError("INVALID_SCHEME", "Empty URI")
  }

  if (uri.startsWith("simplex:/")) {
    return parseSimplexScheme(uri)
  }

  if (uri.startsWith("https://")) {
    return parseHttpsScheme(uri)
  }

  throw new ContactAddressError("INVALID_SCHEME", "Unsupported URI scheme, expected simplex:/ or https://")
}

// -- simplex:/ scheme parsing

function parseSimplexScheme(uri: string): ParsedContactAddress {
  // Format: simplex:/<path>#<fragment>[?<query>]
  // The path starts after "simplex:/"
  const afterScheme = uri.substring(9) // strip "simplex:/"

  // Find fragment marker
  const hashIdx = afterScheme.indexOf("#")
  if (hashIdx === -1) {
    throw new ContactAddressError("MISSING_FRAGMENT", "Missing # fragment in URI")
  }

  const pathAndQuery = afterScheme.substring(0, hashIdx)
  const fragment = afterScheme.substring(hashIdx + 1)

  if (fragment.length === 0) {
    throw new ContactAddressError("MISSING_FRAGMENT", "Empty fragment in URI")
  }

  // Determine path (may include query params after ?)
  const qIdx = pathAndQuery.indexOf("?")
  const path = qIdx === -1 ? pathAndQuery : pathAndQuery.substring(0, qIdx)

  // Legacy full format
  if (path === "contact" || path === "invitation") {
    const linkType: ConnectionMode = path === "contact" ? "contact" : "invitation"
    return parseFullLinkFragment(linkType, fragment)
  }

  // Short format
  if (path === "a" || path === "i") {
    const linkType: ConnectionMode = path === "a" ? "contact" : "invitation"

    // For simplex:/ short links, fragment is the key and query has server info
    // Fragment may contain query params: key?h=host&p=port&c=cert
    // But actually the format is: simplex:/a#<key>?h=host
    // The ? query is BEFORE the # in practice for simplex:/ variant
    // So pathAndQuery = "a?h=host" and fragment = "key"
    const queryStr = qIdx === -1 ? "" : pathAndQuery.substring(qIdx + 1)
    const queryParams = parseQueryParams(queryStr)

    const host = queryParams.get("h")
    if (!host) {
      throw new ContactAddressError("MISSING_SERVER", "Missing ?h= host parameter in simplex:/ short link")
    }

    const portStr = queryParams.get("p")
    let port = 5223
    if (portStr) {
      port = parseInt(portStr, 10)
      if (isNaN(port) || port <= 0 || port > 65535) {
        throw new ContactAddressError("INVALID_PORT", "Invalid port: " + portStr)
      }
    }

    const certFingerprint = queryParams.get("c")

    // The fragment is the link key - but it might have its own query params
    const fragQIdx = fragment.indexOf("?")
    const linkKey = fragQIdx === -1 ? fragment : fragment.substring(0, fragQIdx)
    validateBase64url(linkKey)

    const server: SMPServer = {
      serverIdentity: certFingerprint || "",
      hosts: [host],
      port,
    }

    return {format: "short", data: {server, linkType, linkKey}}
  }

  throw new ContactAddressError("INVALID_PATH", "Unrecognized path: /" + path)
}

// -- https:// scheme parsing

function parseHttpsScheme(uri: string): ParsedContactAddress {
  // Use manual parsing to avoid URL API issues with fragments
  const afterScheme = uri.substring(8) // strip "https://"

  // Find fragment
  const hashIdx = afterScheme.indexOf("#")
  if (hashIdx === -1) {
    throw new ContactAddressError("MISSING_FRAGMENT", "Missing # fragment in URI")
  }

  const hostAndPath = afterScheme.substring(0, hashIdx)
  const fragment = afterScheme.substring(hashIdx + 1)

  if (fragment.length === 0) {
    throw new ContactAddressError("MISSING_FRAGMENT", "Empty fragment in URI")
  }

  // Split host and path
  const firstSlash = hostAndPath.indexOf("/")
  if (firstSlash === -1) {
    throw new ContactAddressError("INVALID_PATH", "Missing path in HTTPS URI")
  }

  const hostPart = hostAndPath.substring(0, firstSlash)
  const pathPart = hostAndPath.substring(firstSlash) // includes leading /

  // Determine link type from path
  if (pathPart === "/contact" || pathPart === "/invitation") {
    // Legacy full format (any host, but typically simplex.chat)
    const linkType: ConnectionMode = pathPart === "/contact" ? "contact" : "invitation"

    // Check if fragment starts with /? (legacy params format)
    if (fragment.startsWith("/?") || fragment.startsWith("/")) {
      return parseFullLinkFragment(linkType, fragment)
    }

    // Otherwise it could be a short link on a server using /contact path
    // Treat as short link
    return parseHttpsShortLink(hostPart, linkType, fragment)
  }

  if (pathPart === "/a" || pathPart === "/i") {
    // Short link format
    const linkType: ConnectionMode = pathPart === "/a" ? "contact" : "invitation"
    return parseHttpsShortLink(hostPart, linkType, fragment)
  }

  throw new ContactAddressError("INVALID_PATH", "Unrecognized path: " + pathPart)
}

function parseHttpsShortLink(hostPart: string, linkType: ConnectionMode, fragment: string): ParsedContactAddress {
  // Parse host:port
  const colonIdx = hostPart.lastIndexOf(":")
  let hostname: string
  let port = 443

  if (colonIdx > 0) {
    const portCandidate = hostPart.substring(colonIdx + 1)
    const portNum = parseInt(portCandidate, 10)
    if (!isNaN(portNum) && portNum > 0 && portNum <= 65535 && portCandidate === String(portNum)) {
      hostname = hostPart.substring(0, colonIdx)
      port = portNum
    } else {
      hostname = hostPart
    }
  } else {
    hostname = hostPart
  }

  const linkKey = fragment
  validateBase64url(linkKey)

  const server: SMPServer = {
    serverIdentity: "",
    hosts: [hostname],
    port,
  }

  return {format: "short", data: {server, linkType, linkKey}}
}

// -- Legacy full link fragment parsing

function parseFullLinkFragment(linkType: ConnectionMode, fragment: string): ParsedContactAddress {
  // Fragment format: /?v=1-7&smp=<encoded>[&e2e=<params>]
  // Strip leading /? if present
  let paramsStr = fragment
  if (paramsStr.startsWith("/?")) {
    paramsStr = paramsStr.substring(2)
  } else if (paramsStr.startsWith("/")) {
    paramsStr = paramsStr.substring(1)
  }

  const params = parseQueryParams(paramsStr)

  // Version
  const vStr = params.get("v")
  if (!vStr) {
    throw new ContactAddressError("INVALID_VERSION", "Missing v= in contact address")
  }
  const agentVersion = parseVersionRange(vStr)

  // SMP queues
  const smpRaw = params.get("smp")
  if (!smpRaw) {
    throw new ContactAddressError("INVALID_SMP_URI", "Missing smp= in contact address")
  }

  // URL-decode the smp value, then split by semicolons
  const smpDecoded = decodeURIComponent(smpRaw)
  const queueStrs = smpDecoded.split(";").filter(s => s.length > 0)
  if (queueStrs.length === 0) {
    throw new ContactAddressError("INVALID_SMP_URI", "Empty smp= value in contact address")
  }

  const smpQueues = queueStrs.map(q => parseSMPQueueURI(q))

  // Optional E2E params
  const e2eParams = params.get("e2e") || undefined

  return {
    format: "full",
    data: {linkType, agentVersion, smpQueues, e2eParams},
  }
}

// -- Query parameter parsing

function parseQueryParams(qs: string): Map<string, string> {
  const params = new Map<string, string>()
  if (!qs || qs.length === 0) return params

  const pairs = qs.split("&")
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=")
    if (eqIdx === -1) {
      params.set(pair, "")
    } else {
      params.set(pair.substring(0, eqIdx), pair.substring(eqIdx + 1))
    }
  }
  return params
}
