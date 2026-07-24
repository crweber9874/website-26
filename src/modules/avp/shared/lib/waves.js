import { UA } from "./colors";

/** Drop partial/corrupt statewide builds (Nov 2024 gap: 2024-11-04 at 665 rows, 2024-12-05 at ~679k). */
export const MIN_FILE_ROWS = 5_000_000;

/** |net_growth| above this usually means a partial/re-ingested build pair — movement counts untrustworthy. */
export const MAX_NET_GROWTH = 500_000;

/**
 * Matched-voter movement (cross_party_switches, pnd_affiliation_flows) is only meaningful
 * when both builds in the pair are full statewide snapshots with stable row counts.
 */
export function isReliableMovementWave(wave, prevWave) {
  if (!wave || wave.total_active < MIN_FILE_ROWS) return false;
  if (prevWave && prevWave.total_active < MIN_FILE_ROWS) return false;
  if (wave.net_growth != null && Math.abs(wave.net_growth) > MAX_NET_GROWTH) return false;
  return true;
}

/** Wave `total_active` is file row count (misnamed in transition_analysis.json). */
export function filterValidWaves(waves) {
  return (waves ?? []).filter((w) => w.total_active >= MIN_FILE_ROWS);
}

/** Direct Democrat ↔ Republican switch (neither side is PND). */
export function isCrossPartyFlow(variable) {
  return /^flow_(DEM_REP|REP_DEM)$/.test(variable ?? "");
}

/**
 * Party bucket changed to or from PND (unaffiliated).
 * Excludes flow_PND_PND (stayers) and non-flow keys like from_PND.
 */
export function isAffiliationFlow(variable) {
  const m = /^flow_([A-Z]+)_([A-Z]+)$/.exec(variable ?? "");
  if (!m) return false;
  const [, from, to] = m;
  if (from === to) return false;
  return from === "PND" || to === "PND";
}

/**
 * Variables published per wave in party/transition_analysis.json (statewide).
 * Per-geography time series for other measures requires multi-wave summary.json
 * artifacts — see GEO_HISTORY_BASE below.
 */
export const WAVE_VARIABLES = [
  { key: "total_active", label: "Rows on the file", unit: "count", color: UA.azblue },
  { key: "party_share_dem", label: "Democratic share", unit: "share", color: UA.azblue },
  { key: "party_share_rep", label: "Republican share", unit: "share", color: UA.azred },
  { key: "party_share_pnd", label: "Unaffiliated share", unit: "share", color: UA.oasis },
  { key: "pnd_affiliation_flows", label: "New party affiliations", unit: "count", color: UA.oasis },
];

/** Future publish path for per-unit multi-wave summaries (not yet in public data). */
export const GEO_HISTORY_BASE = "data/history";

const waveVarByKey = Object.fromEntries(WAVE_VARIABLES.map((v) => [v.key, v]));

export function waveVarMeta(key) {
  return waveVarByKey[key];
}

/** Extract a statewide time series for one wave variable. */
export function waveSeries(waves, variable) {
  return filterValidWaves(waves)
    .map((w) => ({ date: w.file_date, value: w[variable] }))
    .filter((p) => p.value != null && Number.isFinite(p.value));
}
