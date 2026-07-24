// One-off: rewrite copied AVP module sources for use inside Astro.
//  - `@/modules/...`            -> `@/modules/avp/...`
//  - import Link from "next/link" -> import Link from "@/modules/avp/shared/lib/Link"
// Not part of the build.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src", "modules", "avp");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  // never rewrite the shim itself
  if (file.endsWith(path.join("shared", "lib", "Link.jsx"))) continue;
  let src = fs.readFileSync(file, "utf8");
  const before = src;

  // next/link -> local shim
  src = src.replace(
    /import\s+Link\s+from\s+["']next\/link["'];?/g,
    'import Link from "@/modules/avp/shared/lib/Link";'
  );

  // alias remap (avoid double-prefixing if already avp)
  src = src.replace(/@\/modules\/(?!avp\/)/g, "@/modules/avp/");

  if (src !== before) {
    fs.writeFileSync(file, src);
    changed++;
    process.stderr.write(`rewrote ${path.relative(process.cwd(), file)}\n`);
  }
}
process.stderr.write(`\n${changed} files changed\n`);
