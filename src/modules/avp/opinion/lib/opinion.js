import fs from "node:fs";
import path from "node:path";

// Build-time loader for Module 3 artifacts. Each file is { meta, rows } as
// emitted by pipeline/r/extract_m3_survey.R.
const M3_DIR = path.join(process.cwd(), "public", "data", "m3");

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(M3_DIR, `${name}.json`), "utf8"));
}

export function loadOpinion() {
  const opinion = read("m3_opinion");
  return {
    opinion: opinion.rows,
    radar: read("m3_radar").rows,
    leastLiked: read("m3_least_liked").rows,
    gap: read("m3_perception_gap").rows,
    meta: opinion.meta,
  };
}
