// esbuild config for browser bundle.
// Resolves bare import specifiers that vitest handles via aliases.
import {build} from "esbuild"
import path from "path"
import {fileURLToPath} from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
await build({
  entryPoints: ["src/browser-client.ts"],
  bundle: true,
  format: "iife",
  globalName: "GoChatClient",
  footer: { js: "window.createBrowserClient = GoChatClient.createBrowserClient;" },
  outfile: "dist/gochat-client.js",
  target: "es2022",
  platform: "browser",
  external: ["zstd-codec"],
  alias: {
    "@simplex-chat/xftp-web/dist": path.resolve(__dirname, "../xftp-web/src"),
    "@noble/curves/ed25519": path.resolve(__dirname, "node_modules/@noble/curves/ed25519.js"),
    "@noble/curves/ed448": path.resolve(__dirname, "node_modules/@noble/curves/ed448.js"),
    "@noble/hashes/hkdf": path.resolve(__dirname, "node_modules/@noble/hashes/hkdf.js"),
    "@noble/hashes/sha512": path.resolve(__dirname, "node_modules/@noble/hashes/sha512.js"),
    "@noble/hashes/sha256": path.resolve(__dirname, "node_modules/@noble/hashes/sha256.js"),
    "@noble/ciphers/aes": path.resolve(__dirname, "node_modules/@noble/ciphers/aes.js"),
    "@noble/ciphers/salsa": path.resolve(__dirname, "node_modules/@noble/ciphers/salsa.js"),
  },
})
console.log("Built dist/gochat-client.js")
