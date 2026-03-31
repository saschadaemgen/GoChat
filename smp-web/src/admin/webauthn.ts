// WebAuthn (Passkey) helpers for GoChat Admin Panel.
//
// Provides registration, authentication, and IndexedDB storage for
// WebAuthn credentials and admin settings. Client-side verification
// only (sufficient for single-admin static site deployment).

// -- Types

export interface StoredCredential {
  credentialId: Uint8Array
  created: number
}

export interface GoChatSettings {
  contactAddress: string
  displayName: string
  welcomeMessage: string
  widgetPosition: "bottom-right" | "bottom-left"
  accentColor: string
}

export const DEFAULT_SETTINGS: GoChatSettings = {
  contactAddress: "",
  displayName: "Website Visitor",
  welcomeMessage: "",
  widgetPosition: "bottom-right",
  accentColor: "#4CAF50",
}

// -- IndexedDB

const DB_NAME = "gochat-admin"
const DB_VERSION = 1
const CRED_STORE = "credentials"
const SETTINGS_STORE = "settings"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(CRED_STORE)) {
        db.createObjectStore(CRED_STORE, {keyPath: "id"})
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, {keyPath: "id"})
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// -- Credential storage

export async function storeCredential(cred: StoredCredential): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(CRED_STORE, "readwrite")
  // Convert Uint8Array to regular array for IndexedDB storage
  tx.objectStore(CRED_STORE).put({
    id: "admin",
    credentialId: Array.from(cred.credentialId),
    created: cred.created,
  })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getStoredCredential(): Promise<StoredCredential | null> {
  const db = await openDB()
  const tx = db.transaction(CRED_STORE, "readonly")
  const req = tx.objectStore(CRED_STORE).get("admin")
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      if (!req.result) {
        resolve(null)
        return
      }
      resolve({
        credentialId: new Uint8Array(req.result.credentialId),
        created: req.result.created,
      })
    }
    req.onerror = () => reject(req.error)
  })
}

// -- Settings storage

export async function storeSettings(settings: GoChatSettings): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(SETTINGS_STORE, "readwrite")
  tx.objectStore(SETTINGS_STORE).put({id: "config", ...settings})
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getStoredSettings(): Promise<GoChatSettings | null> {
  const db = await openDB()
  const tx = db.transaction(SETTINGS_STORE, "readonly")
  const req = tx.objectStore(SETTINGS_STORE).get("config")
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      if (!req.result) {
        resolve(null)
        return
      }
      const {id: _, ...settings} = req.result
      resolve(settings as GoChatSettings)
    }
    req.onerror = () => reject(req.error)
  })
}

// -- WebAuthn Registration

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials !== "undefined"
}

export async function registerPasskey(): Promise<void> {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn not supported in this browser")
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userId = crypto.getRandomValues(new Uint8Array(16))

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: "GoChat Admin",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: "admin",
        displayName: "GoChat Admin",
      },
      pubKeyCredParams: [
        {alg: -7, type: "public-key"},     // ES256
        {alg: -257, type: "public-key"},   // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  }) as PublicKeyCredential | null

  if (!credential) {
    throw new Error("Passkey registration cancelled")
  }

  await storeCredential({
    credentialId: new Uint8Array(credential.rawId),
    created: Date.now(),
  })

  console.log("[Admin] Passkey registered successfully")
}

// -- WebAuthn Authentication

export async function loginWithPasskey(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false

  const stored = await getStoredCredential()
  if (!stored) return false

  const challenge = crypto.getRandomValues(new Uint8Array(32))

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
          id: stored.credentialId,
          type: "public-key",
        }],
        userVerification: "required",
        timeout: 60000,
      },
    }) as PublicKeyCredential | null

    if (assertion) {
      console.log("[Admin] Passkey login successful")
      return true
    }
    return false
  } catch (e) {
    console.log("[Admin] Passkey login failed:", e instanceof Error ? e.message : String(e))
    return false
  }
}
