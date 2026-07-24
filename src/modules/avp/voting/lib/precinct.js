// Voting in Arizona — precinct contest metadata, coloring, formatting.
// Precinct GeoJSON features carry both geometry and certified returns, so the
// map colors straight off feature properties (no separate join).
import {
  UA, NO_DATA, partyRampCss, measureRampCss, partyLegendLabels, measureLegendLabels,
} from "@/modules/avp/shared/lib/colors";

export const BASE_PROPS = new Set([
  "precinct_id", "precinct_name", "county", "total", "dem", "rep", "other",
  "dem_share", "rep_share", "two_party_rep",
]);

// Short plain-language descriptions for ballot measures (tooltips / analytics).
export const MEASURE_INFO = {
  proposition_139: {
    title: "Proposition 139 · Arizona Abortion Access Act",
    blurb: "Constitutional amendment establishing a fundamental right to abortion until fetal viability, with protections after viability when a provider deems it necessary for life or health.",
  },
  proposition_314: {
    title: "Proposition 314 · Secure the Border Act",
    blurb: "State law expanding immigration enforcement (including penalties for unlawful entry), mandating E-Verify for benefits and employment, and increasing fentanyl-sale penalties.",
  },
  proposition_209: {
    title: "Proposition 209 · Predatory Debt Collection Protection Act",
    blurb: "Limits interest and collection actions on medical debt and lowers wage-garnishment thresholds for healthcare-related judgments.",
  },
};

// Candidate races — nominees by election year (two-party summary only in data).
export const CONTEST_META = {
  president_of_the_united_states: {
    title: "President of the United States",
    short: "President",
    candidates: { 2024: { dem: "Kamala Harris", rep: "Donald Trump" } },
  },
  governor: {
    title: "Governor",
    candidates: { 2022: { dem: "Katie Hobbs", rep: "Kari Lake" } },
  },
  u_s_senator: {
    title: "U.S. Senator",
    candidates: {
      2024: { dem: "Ruben Gallego", rep: "Kari Lake" },
      2022: { dem: "Mark Kelly", rep: "Blake Masters" },
    },
  },
  secretary_of_state: {
    title: "Secretary of State",
    candidates: { 2022: { dem: "Adrian Fontes", rep: "Mark Finchem" } },
  },
  attorney_general: {
    title: "Attorney General",
    candidates: { 2022: { dem: "Kris Mayes", rep: "Abraham Hamadeh" } },
  },
  corporation_commissioner: {
    title: "Corporation Commissioner",
    blurb: "Three seats elected statewide by block vote; map shows aggregate two-party Republican share across the three Republican vs three Democratic nominees.",
    candidates: {
      2024: { dem: "Democratic slate", rep: "Republican slate" },
    },
  },
};

export function isMeasure(slug) {
  return /^proposition_/.test(slug) || /^shall_/.test(slug);
}

export function prettyContest(slug) {
  if (MEASURE_INFO[slug]?.title) return MEASURE_INFO[slug].title.split(" · ")[0];
  if (CONTEST_META[slug]?.title) return CONTEST_META[slug].title;
  if (/^shall_/.test(slug)) {
    const m = slug.match(/^shall_([a-z]+)_([a-z]+)/);
    return m ? `Retain ${cap(m[2])} ${cap(m[1])}` : "Judicial retention";
  }
  return slug
    .replace(/_/g, " ")
    .replace(/\bu s\b/gi, "U.S.")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function contestTooltip(slug, year) {
  const measure = MEASURE_INFO[slug];
  if (measure) {
    return `${measure.title.split(" · ")[0]}: ${measure.blurb} Map colors show Yes vote share by precinct.`;
  }
  const meta = CONTEST_META[slug];
  if (meta?.blurb) return `${meta.title}: ${meta.blurb}`;
  if (isMeasure(slug)) {
    return "Statewide ballot measure. Map colors show the share of Yes votes in each precinct.";
  }
  const cands = meta?.candidates?.[year];
  if (cands) {
    return `${prettyContest(slug)} (${year}): ${cands.dem} (D) vs ${cands.rep} (R). Map colors show two-party Republican vote share.`;
  }
  return "Candidate race. Map colors show two-party Republican vote share in each precinct.";
}

/** Plain label for the value shown on maps and charts. */
export function metricLabel(slug) {
  return isMeasure(slug) ? "Yes vote share" : "Two-party Republican share";
}

/** Headline contest drives `two_party_rep` and party registration splits in each artifact. */
export function headlineNote(headlineSlug, year) {
  const name = prettyContest(headlineSlug);
  return `Two-party Rep share and party registration counts reflect the headline race (${name}) for ${year}.`;
}

/** Winner at precinct level from a 0–1 share (Rep or Yes share). */
export function contestWinner(share, slug, year) {
  if (!Number.isFinite(share)) return null;
  if (isMeasure(slug)) {
    const yes = share >= 0.5;
    return {
      label: yes ? "Yes" : "No",
      side: yes ? "yes" : "no",
      color: yes ? UA.azblue : UA.azurite,
      share: yes ? share : 1 - share,
      partyTag: yes ? "Passed" : "Failed",
    };
  }
  const cands = CONTEST_META[slug]?.candidates?.[year];
  const repWins = share >= 0.5;
  const label = repWins ? (cands?.rep ?? "Republican") : (cands?.dem ?? "Democrat");
  return {
    label,
    side: repWins ? "rep" : "dem",
    color: repWins ? UA.azred : UA.azblue,
    share: repWins ? share : 1 - share,
    partyTag: repWins ? "R" : "D",
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function countyGeoid(name) {
  return `AZ-COUNTY-${String(name).toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
}

export function contestsIn(fc) {
  const p0 = fc.features[0]?.properties ?? {};
  const slugs = Object.keys(p0).filter(
    (k) => !BASE_PROPS.has(k) && typeof p0[k] === "number",
  );
  const head = fc.headline_contest;
  slugs.sort((a, b) => (a === head ? -1 : b === head ? 1 : a.localeCompare(b)));
  return slugs;
}

// Analytics variables available per precinct (all 0–1 shares except ballot counts).
export const ANALYTICS_VARS = [
  { id: "two_party_rep", label: "Two-party Republican share", continuous: true },
  { id: "dem_share", label: "Democratic ballot share", continuous: true },
  { id: "rep_share", label: "Republican ballot share", continuous: true },
];

export function analyticsVars(contests) {
  const base = [...ANALYTICS_VARS];
  for (const c of contests) {
    base.push({
      id: c,
      label: prettyContest(c) + (isMeasure(c) ? " (Yes share)" : " (Rep 2-party)"),
      continuous: true,
    });
  }
  return base;
}

export function fillExpr(slug) {
  const g = ["to-number", ["get", slug]];
  const stops = isMeasure(slug)
    ? [0, UA.warmgrey, 0.5, UA.oasis, 1, UA.azblue]
    : [0, UA.azblue, 0.5, UA.warmgrey, 1, UA.azred];
  return [
    "case",
    ["==", ["get", slug], null], NO_DATA,
    ["interpolate", ["linear"], g, ...stops],
  ];
}

export function legendEnds(slug) {
  const { lo, hi } = isMeasure(slug) ? measureLegendLabels() : partyLegendLabels();
  return [lo, hi];
}

export function legendRampCss(slug) {
  return isMeasure(slug) ? measureRampCss() : partyRampCss();
}

export const fmtInt = (n) =>
  n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US");
export const fmtPct = (x) =>
  x == null || !Number.isFinite(x) ? "—" : `${(x * 100).toFixed(1)}%`;

const KEY_SEP = "\u0001";

/** Stable key — precinct_id alone is not unique statewide (2024 reuses ids per county). */
export function precinctKey(county, precinctId) {
  return `${county}${KEY_SEP}${precinctId}`;
}

export function parsePrecinctKey(key) {
  const i = key.indexOf(KEY_SEP);
  if (i < 0) return [null, key];
  return [key.slice(0, i), key.slice(i + KEY_SEP.length)];
}
