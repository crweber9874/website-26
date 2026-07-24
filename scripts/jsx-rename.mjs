// Rename AVP .js files that actually contain JSX to .jsx so Vite/esbuild parses
// them. Pure-JS modules (loaders, lib utils) keep their .js extension.
// Vite resolves extensionless imports to .jsx, so import sites are unaffected.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src", "modules", "avp");
const JSX_HINT = /className=|<\/[A-Za-z]|\/>|<[A-Z][A-Za-z]/;

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

let renamed = 0;
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  if (JSX_HINT.test(src)) {
    const next = file.replace(/\.js$/, ".jsx");
    fs.renameSync(file, next);
    renamed++;
    process.stderr.write(`jsx  ${path.relative(process.cwd(), next)}\n`);
  }
}
process.stderr.write(`\n${renamed} files renamed to .jsx\n`);
