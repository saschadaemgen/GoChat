// esbuild config for GoChat widget bundle.
// Produces a single self-contained IIFE file with Shadow DOM isolation.
// Separate from the API client bundle (esbuild.config.mjs).
import {build} from "esbuild"

await build({
  entryPoints: ["widget/widget-entry.ts"],
  bundle: true,
  format: "iife",
  globalName: "GoChatWidget",
  outfile: "dist/gochat-widget.js",
  target: ["es2020"],
  minify: false,
  sourcemap: false,
})
console.log("Built dist/gochat-widget.js")
