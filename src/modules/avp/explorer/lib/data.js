import fs from "node:fs";
import path from "node:path";
import { reshape } from "@/modules/avp/shared/lib/reshape";

// Server-side loader (build time). Reads a contract-validated tidy artifact and
// reshapes it for the explorer. The client fetches other geographies' summary
// JSON at runtime and calls reshape() directly (see Explorer.js).
const DATA_DIR = path.join(process.cwd(), "public", "data");

export function loadGeo(geo) {
  const rows = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, geo, "summary.json"), "utf8"),
  );
  return reshape(rows);
}

// First-paint default: Congressional districts.
export const loadCd = () => loadGeo("cd");
