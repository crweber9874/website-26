/** Plain-language party codes used in transition charts. */
export const PARTY_LABELS = {
  DEM: "Democrats",
  REP: "Republicans",
  PND: "Party not specified (unaffiliated)",
  NOL: "No Labels",
  LBT: "Libertarians",
  OTH: "Other party",
};

export function partyLabel(code) {
  return PARTY_LABELS[code] ?? code;
}

/** Small muted line for MapLibre popup HTML. */
export function mapTipMuted(text) {
  return `<span style="font-size:12px;color:#54687a;line-height:1.4">${text}</span>`;
}

/** HTML lines for map popups — Democratic share first, Republican share second. */
export function partyShareMapHtml(demShare, repShare, formatShare) {
  const lines = [];
  if (demShare != null && Number.isFinite(demShare)) {
    lines.push(`Democratic share: <strong>${formatShare(demShare)}</strong>`);
  }
  if (repShare != null && Number.isFinite(repShare)) {
    lines.push(`Republican share: <strong>${formatShare(repShare)}</strong>`);
  }
  return lines.length ? lines.join("<br>") : "";
}

/** Hover popup HTML for Module 2 choropleth maps (Explorer + Story). */
export function choroplethMapTip({
  name, context, varLabel, value, unit, formatValue, demShare, repShare,
}) {
  const formatShare = (v) => formatValue(v, "share");
  const partyHtml = partyShareMapHtml(demShare, repShare, formatShare);
  if (value == null || !Number.isFinite(value)) {
    const base = `<strong>${name}</strong><br>${mapTipMuted(`${context} · no data for ${varLabel.toLowerCase()}`)}`;
    return partyHtml ? `${base}<br>${partyHtml}` : base;
  }
  const main = `<strong>${name}</strong><br>${mapTipMuted(context)}<br>${varLabel}: <strong>${formatValue(value, unit)}</strong>`;
  return partyHtml ? `${main}<br>${partyHtml}` : main;
}
