// UA-brand palette + scales for Module 2. Single source of truth for map colors.
// Party convention (from the AVP dashboard): azblue = DEM, azred = REP, oasis = other.
import { formatValue } from "@/modules/avp/shared/lib/variables";

export const UA = {
  azblue: "#0C234B",
  azred: "#AB0520",
  oasis: "#378DBD",
  azurite: "#1E5288",
  warmgrey: "#F4EDE5",
  coolgrey: "#E2E9EB",
};

export const PARTY = { dem: UA.azblue, rep: UA.azred, oth: UA.oasis };

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
function lerpHex(a, b, t) {
  const rgb = lerp(hexToRgb(a), hexToRgb(b), t);
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

// Sequential single-hue ramp, monotonic in lightness (colorblind-safe):
// light warm-grey -> oasis -> azblue. Low values light, high values dark.
const STOPS = [hexToRgb(UA.warmgrey), hexToRgb(UA.oasis), hexToRgb(UA.azblue)];
export function sequential(t) {
  const x = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  const seg = x < 0.5 ? [STOPS[0], STOPS[1], x / 0.5] : [STOPS[1], STOPS[2], (x - 0.5) / 0.5];
  const [a, b, u] = seg;
  const rgb = lerp(a, b, u);
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export const NO_DATA = "#cdd6dc";

// Party lean: 0 = more Dem (azblue), 1 = more Rep (azred), 0.5 = neutral warm grey.
export function partyDiverging(tRep) {
  const x = Math.max(0, Math.min(1, Number.isFinite(tRep) ? tRep : 0));
  if (x <= 0.5) return lerpHex(UA.azblue, UA.warmgrey, x / 0.5);
  return lerpHex(UA.warmgrey, UA.azred, (x - 0.5) / 0.5);
}

export function isPartyDivergingVar(name) {
  return name === "party_share_dem" || name === "party_share_rep";
}

// Map a variable value to 0 (Dem lean) … 1 (Rep lean) within [min, max].
export function repLeanNorm(variable, value, min, max) {
  const span = max - min || 1;
  const t = (value - min) / span;
  if (variable === "party_share_dem") return 1 - t;
  if (variable === "party_share_rep" || variable === "two_party_rep") return t;
  return t;
}

export function colorForVar(variable, value, min, max) {
  if (isPartyDivergingVar(variable)) {
    return partyDiverging(repLeanNorm(variable, value, min, max));
  }
  const span = max - min || 1;
  return sequential((value - min) / span);
}

// n equal CSS gradient stops for a legend ramp.
export function rampCss(n = 24) {
  return Array.from({ length: n }, (_, i) => sequential(i / (n - 1))).join(", ");
}

export function partyRampCss() {
  return `${UA.azblue}, ${UA.warmgrey}, ${UA.azred}`;
}

export function measureRampCss() {
  return `${UA.warmgrey}, ${UA.oasis}, ${UA.azblue}`;
}

export function rampCssForVar(variable, n = 24) {
  if (isPartyDivergingVar(variable)) return partyRampCss();
  return rampCss(n);
}

export function legendLabels(variable, unit, min, max) {
  if (isPartyDivergingVar(variable)) {
    return { lo: "More Dem", hi: "More Rep" };
  }
  return { lo: formatValue(min, unit), hi: formatValue(max, unit) };
}

export function measureLegendLabels() {
  return { lo: "Lower Yes", hi: "Higher Yes" };
}

export function partyLegendLabels() {
  return { lo: "More Dem", hi: "More Rep" };
}
