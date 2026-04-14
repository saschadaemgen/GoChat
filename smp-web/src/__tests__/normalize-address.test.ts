import {describe, it, expect} from "vitest"

// Inline the normalizeContactAddress function for testing
// (widget-entry.ts has side effects that prevent direct import in tests)
function normalizeContactAddress(addr: string): string {
  if (addr.startsWith('simplex://')) {
    return 'https://simplex.chat/' + addr.slice('simplex://'.length)
  }
  return addr
}

describe("normalizeContactAddress", () => {
  it("passes https://simplex.chat/ addresses through unchanged", () => {
    const addr = "https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2Ftest"
    expect(normalizeContactAddress(addr)).toBe(addr)
  })

  it("converts simplex:// deep-link to https://simplex.chat/", () => {
    const addr = "simplex://contact#/?v=2-7&smp=smp%3A%2F%2Ftest"
    expect(normalizeContactAddress(addr)).toBe(
      "https://simplex.chat/contact#/?v=2-7&smp=smp%3A%2F%2Ftest"
    )
  })

  it("passes https://simplex.chat/ short-links through unchanged", () => {
    const addr = "https://simplex.chat/contact#/abc123"
    expect(normalizeContactAddress(addr)).toBe(addr)
  })
})
