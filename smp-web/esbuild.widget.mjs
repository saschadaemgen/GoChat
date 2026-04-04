// esbuild config for GoChat widget bundle.
// Produces a single self-contained IIFE file with Shadow DOM isolation.
// Includes the full crypto engine from src/ via the same aliases as esbuild.config.mjs.
import {build} from "esbuild"
import path from "path"
import {fileURLToPath} from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

await build({
  entryPoints: ["widget/widget-entry.ts"],
  bundle: true,
  format: "iife",
  globalName: "GoChatWidget",
  outfile: "dist/gochat-widget.js",
  target: ["es2020"],
  platform: "browser",
  minify: false,
  sourcemap: false,
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
console.log("Built dist/gochat-widget.js")
