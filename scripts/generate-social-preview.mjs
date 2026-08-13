/**
 * Renders public/img/social-preview.png — the default Open Graph card.
 * Run with: node scripts/generate-social-preview.mjs
 */
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import satori from "satori"
import sharp from "sharp"

const root = new URL("../", import.meta.url)
const regular = await readFile(
  fileURLToPath(new URL("src/assets/og/DMSans-Regular.ttf", root)),
)
const bold = await readFile(
  fileURLToPath(new URL("src/assets/og/DMSans-Bold.ttf", root)),
)

const NAME = "Christopher Weber"
const ROLE = "Professor of Political Science · University of Arizona"
const NOTE = "Political psychology · political behavior · voter file data science"

const svg = await satori(
  {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "1200px",
        height: "630px",
        padding: "80px",
        background: "#0C234B",
        color: "#ffffff",
        fontFamily: "DM Sans",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "72px",
              height: "6px",
              background: "#AB0520",
              marginBottom: "48px",
            },
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: "88px", fontWeight: 700, letterSpacing: "-0.02em" },
            children: NAME,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: "34px", marginTop: "24px", color: "#E2E9EB" },
            children: ROLE,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: "26px", marginTop: "40px", color: "#98A4AE" },
            children: NOTE,
          },
        },
      ],
    },
  },
  {
    width: 1200,
    height: 630,
    fonts: [
      { name: "DM Sans", data: regular, weight: 400, style: "normal" },
      { name: "DM Sans", data: bold, weight: 700, style: "normal" },
    ],
  },
)

const out = fileURLToPath(new URL("public/img/social-preview.png", root))
await writeFile(out, await sharp(Buffer.from(svg)).png().toBuffer())
console.log(`wrote ${out}`)

// Placeholder profile avatar — replace src/assets/avatar.png with a headshot.
const avatarSvg = await satori(
  {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "512px",
        height: "512px",
        background: "#0C234B",
        color: "#ffffff",
        fontFamily: "DM Sans",
        fontSize: "200px",
        fontWeight: 700,
        letterSpacing: "-0.03em",
      },
      children: "CW",
    },
  },
  {
    width: 512,
    height: 512,
    fonts: [{ name: "DM Sans", data: bold, weight: 700, style: "normal" }],
  },
)

const avatarOut = fileURLToPath(new URL("src/assets/avatar.png", root))
await writeFile(avatarOut, await sharp(Buffer.from(avatarSvg)).png().toBuffer())
console.log(`wrote ${avatarOut}`)
