// esbuild config for admin panel bundle.
// Separate from the widget bundle - no crypto dependencies needed.
import {build} from "esbuild"
await build({
  entryPoints: ["src/admin/admin.ts"],
  bundle: true,
  format: "iife",
  globalName: "GoChatAdmin",
  outfile: "dist/gochat-admin.js",
  target: "es2022",
  platform: "browser",
})
console.log("Built dist/gochat-admin.js")
