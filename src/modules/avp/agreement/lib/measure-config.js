// Shared measure display config for Module 4 (safe for client + server imports).

export const EXCLUDED_MEASURES = new Set(["affpol", "inwarm", "outneg", "auth"]);

export const MEASURE_LABELS = {
  ideology5: "Ideology",
  antidem_norms: "Democratic attitudes",
  abortion_restrictive: "Abortion",
  immig_restrictive: "Immigration",
  gun_control: "Gun Control Policy",
};

export const FLIPPED_MEASURES = new Set(["antidem_norms"]);

export const FLIPPED_HIGH_LABEL = "more democratic";
export const FLIPPED_LOW_LABEL = "less democratic";

// Elections items grouped together at the end.
export const MEASURE_ORDER = [
  "ideology5",
  "political_intolerance",
  "antidem_norms",
  "abortion_restrictive",
  "immig_restrictive",
  "gun_control",
  "water_action",
  "crime_concern",
  "econ_personal",
  "econ_biden",
  "vote_confidence",
  "contest_recounts",
  "contest_courts",
  "election_subversion",
];

export function measureSortKey(measure) {
  const i = MEASURE_ORDER.indexOf(measure);
  return i >= 0 ? i : MEASURE_ORDER.length;
}
