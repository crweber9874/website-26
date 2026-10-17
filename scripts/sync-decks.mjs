#!/usr/bin/env node
// Copy each Quarto deck's rendered HTML (plus small sibling assets) from
// decks/<name>/ into public/decks/<name>/ so Astro serves it statically.
// The deck's primary HTML becomes index.html; small companion files
// (images, JSON, CSS) are copied alongside. Large caches are skipped.

import { readdir, stat, mkdir, copyFile, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, extname, basename } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const SRC = join(ROOT, "decks")
const DEST = join(ROOT, "public", "decks")

const SIBLING_EXT = new Set([".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".json", ".css", ".js"])
const MAX_SIBLING_BYTES = 2 * 1024 * 1024

if (!existsSync(SRC)) {
  console.log("[sync-decks] no decks/ directory; skipping")
  process.exit(0)
}

await rm(DEST, { recursive: true, force: true })
await mkdir(DEST, { recursive: true })

const decks = (await readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory())
for (const deck of decks) {
  const srcDir = join(SRC, deck.name)
  const entries = await readdir(srcDir)
  const html = entries.find((e) => e.endsWith(".html") && e !== "avp-url.html") ?? entries.find((e) => e.endsWith(".html"))
  if (!html) continue
  const outDir = join(DEST, deck.name)
  await mkdir(outDir, { recursive: true })
  await copyFile(join(srcDir, html), join(outDir, "index.html"))
  for (const name of entries) {
    if (name === html || name.startsWith("_") || name.startsWith(".")) continue
    const ext = extname(name).toLowerCase()
    if (!SIBLING_EXT.has(ext)) continue
    const info = await stat(join(srcDir, name))
    if (!info.isFile() || info.size > MAX_SIBLING_BYTES) continue
    await copyFile(join(srcDir, name), join(outDir, basename(name)))
  }
  console.log(`[sync-decks] ${deck.name} → public/decks/${deck.name}/`)
}
