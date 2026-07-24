// Data-driven variable metadata for Module 2. The tidy artifact already carries
// `unit` per row, so units come from the data (see reshape.js). Here we only
// supply nice human labels and a grouping rule; anything not listed still shows
// up (humanized name, "Other" group), so new pipeline variables appear
// automatically without touching this file.

export const LABELS = {
  // registration & party
  party_share_dem: "Democratic share",
  party_share_rep: "Republican share",
  party_share_oth: "Independent / other share",
  total_registered: "Registered voters",
  total_republican: "Republicans",
  total_democratic: "Democrats",
  total_libertarian: "Libertarians",
  total_nolabels: "No Labels",
  total_party_not_specified: "Party not specified",
  total_other_party: "Other party",
  // roll status
  total_active: "Active",
  total_inactive: "Inactive",
  total_canceled: "Canceled",
  total_suspense: "Suspense",
  pct_active: "Active share",
  pct_inactive: "Inactive share",
  voter_median_age: "Median voter age",
  // participation
  turnout_gen_2024: "Turnout — 2024 General",
  turnout_gen_2022: "Turnout — 2022 General",
  turnout_gen_2020: "Turnout — 2020 General",
  turnout_prim_2024: "Turnout — 2024 Primary",
  turnout_prim_2022: "Turnout — 2022 Primary",
  turnout_presp_2024: "Turnout — 2024 Pres. Pref.",
  pevl_share: "On permanent early voting list",
  early_share_gen_2024: "Early vote — 2024 General",
  generalVoterScore: "General voting score",
  primaryVoterScore: "Primary voting score",
  averageGeneral: "Avg. general voters",
  averagePrimary: "Avg. primary voters",
  averageMidterm: "Avg. midterm voters",
  // why inactive
  inactive_nvra: "Failed to respond (NVRA)",
  inactive_deceased: "Deceased",
  inactive_moved: "Moved / residency",
  inactive_felony: "Felony",
  inactive_citizenship: "Citizenship / eligibility",
  inactive_duplicate: "Duplicate / merge",
  inactive_voter_request: "Voter request",
  inactive_incapacitated: "Incapacitated",
  inactive_administrative: "Administrative",
  inactive_other: "Other reason",
  // census (ACS)
  total_population: "Total population",
  latino: "Hispanic / Latino",
  latino_share: "Hispanic / Latino share",
  non_latino_white: "White, non-Hispanic",
  white_alone: "White alone",
  black_alone: "Black alone",
  american_indian_alone: "American Indian alone",
  asian_alone: "Asian alone",
  pacific_islander_alone: "Pacific Islander alone",
  two_or_more_races: "Two or more races",
  median_household_income: "Median household income",
  gini_index: "Income inequality (Gini)",
  median_age: "Median age (ACS)",
  poverty_rate: "Poverty rate",
};

export function labelFor(name) {
  return (
    LABELS[name] ??
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Grouping rules — first match wins. Kept as predicates so prefixed families
// (turnout_*, inactive_*, party_share_*) sweep in future variables too.
const RULES = [
  ["registration", (n) =>
    n.startsWith("party_share_") ||
    ["total_registered", "total_republican", "total_democratic", "total_libertarian",
     "total_nolabels", "total_party_not_specified", "total_other_party"].includes(n)],
  ["status", (n) =>
    ["total_active", "total_inactive", "total_canceled", "total_suspense",
     "pct_active", "pct_inactive", "voter_median_age"].includes(n)],
  ["participation", (n) =>
    n.startsWith("turnout_") || n.startsWith("early_share") || n === "pevl_share" ||
    n.endsWith("VoterScore") || n.startsWith("average")],
  ["inactive", (n) => n.startsWith("inactive_")],
  ["census", (n) =>
    ["total_population", "latino", "latino_share", "non_latino_white", "white_alone",
     "black_alone", "american_indian_alone", "asian_alone", "pacific_islander_alone",
     "two_or_more_races", "median_household_income", "gini_index", "median_age",
     "poverty_rate"].includes(n)],
];

const GROUP_LABELS = {
  registration: "Registration & party",
  status: "Roll status",
  participation: "Participation",
  inactive: "Why inactive",
  census: "Census (ACS)",
  other: "Other",
};
const GROUP_ORDER = ["registration", "status", "participation", "inactive", "census", "other"];

export function groupOf(name) {
  for (const [id, test] of RULES) if (test(name)) return id;
  return "other";
}

// Given the variables actually present in a geography, build ordered picker
// sections. Empty groups are dropped.
export function buildGroups(varNames) {
  const by = {};
  for (const v of varNames) (by[groupOf(v)] ??= []).push(v);
  return GROUP_ORDER.filter((id) => by[id]?.length).map((id) => ({
    id,
    label: GROUP_LABELS[id],
    vars: by[id].sort(),
  }));
}

// Continuous measures suit scatter plots and KDE histograms; small integer domains
// (e.g. roll-status counts) are shown as discrete bar charts instead.
export function varKind(name, unit, values) {
  if (["share", "rate", "score", "usd", "years", "index"].includes(unit)) return "continuous";
  const nums = values.filter(Number.isFinite);
  if (nums.length < 2) return "continuous";
  const uniq = [...new Set(nums.map((v) => Math.round(v * 1e6) / 1e6))];
  if (uniq.length <= 12) {
    const allInt = uniq.every((v) => Math.abs(v - Math.round(v)) < 1e-6);
    const span = Math.max(...uniq) - Math.min(...uniq);
    if (allInt && span <= 20) return "discrete";
  }
  return "continuous";
}

export function isContinuousVar(name, unit, values) {
  return varKind(name, unit, values) === "continuous";
}

// Pick a readable tick step for linear axes (avoid labeling every integer).
export function niceStep(min, max, target = 6) {
  const span = max - min || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  return step;
}

export function formatValue(value, unit) {
  if (value == null || Number.isNaN(value)) return "—";
  switch (unit) {
    case "share":
    case "rate":
      return `${(value * 100).toFixed(1)}%`;
    case "score":
      return value.toFixed(3);
    case "usd":
      return `$${Math.round(value).toLocaleString("en-US")}`;
    case "index":
      return value.toFixed(3);
    case "years":
      return value.toFixed(1);
    case "count":
    default:
      return Math.round(value).toLocaleString("en-US");
  }
}
