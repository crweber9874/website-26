import fs from "node:fs";
import path from "node:path";
import {
  EXCLUDED_MEASURES,
  FLIPPED_HIGH_LABEL,
  FLIPPED_LOW_LABEL,
  FLIPPED_MEASURES,
  MEASURE_LABELS,
} from "./measure-config";

// Build-time loader for Module 4 (agreement / attitude overlap). Each file is
// { meta, rows } as emitted by pipeline/r/extract_m4_agreement.R. Density rows
// are keyed by dimension+measure so the client can pair a comparison with its
// shared-grid curves without shipping any per-respondent data.
const M4_DIR = path.join(process.cwd(), "public", "data", "m4");

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(M4_DIR, `${name}.json`), "utf8"));
}

function applyLabel(row) {
  const label = MEASURE_LABELS[row.measure] ?? row.label;
  if (!FLIPPED_MEASURES.has(row.measure)) return { ...row, label };
  return {
    ...row,
    label,
    high_label: FLIPPED_HIGH_LABEL,
    low_label: FLIPPED_LOW_LABEL,
    share_a_high: row.share_a_high != null ? 1 - row.share_a_high : null,
    share_b_high: row.share_b_high != null ? 1 - row.share_b_high : null,
  };
}

function flipDensity(d) {
  return {
    ...d,
    grid: [...d.grid].reverse(),
    dens_a: [...d.dens_a].reverse(),
    dens_b: [...d.dens_b].reverse(),
  };
}

export { measureSortKey, MEASURE_ORDER } from "./measure-config";

export function loadAgreement() {
  const overlap = read("m4_overlap");
  const density = read("m4_density");
  const rows = overlap.rows
    .filter((r) => !EXCLUDED_MEASURES.has(r.measure))
    .map(applyLabel);
  const densityByKey = {};
  for (const d of density.rows) {
    if (EXCLUDED_MEASURES.has(d.measure)) continue;
    const entry = { ...d, scale_type: d.scale_type };
    densityByKey[`${d.dimension}::${d.measure}`] =
      FLIPPED_MEASURES.has(d.measure) ? flipDensity(entry) : entry;
  }
  return {
    rows,
    densityByKey,
    meta: overlap.meta,
  };
}
