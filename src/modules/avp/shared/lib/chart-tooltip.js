/** Shared Chart.js tooltip styling — readable contrast on all chart modules. */
export const CHART_TOOLTIP = {
  backgroundColor: "rgba(12, 35, 75, 0.96)",
  titleColor: "#ffffff",
  bodyColor: "#e8edf1",
  footerColor: "#b8c7d8",
  titleFont: { size: 13, weight: "600", family: "'Source Sans 3', sans-serif" },
  bodyFont: { size: 13, family: "'Source Sans 3', sans-serif" },
  padding: 12,
  cornerRadius: 8,
  boxPadding: 6,
  caretSize: 6,
  displayColors: true,
  boxWidth: 10,
  boxHeight: 10,
};

/** Merge base tooltip styling with plugin-specific overrides. */
export function chartTooltip(overrides = {}) {
  const { callbacks, ...rest } = overrides;
  return {
    ...CHART_TOOLTIP,
    ...rest,
    callbacks: callbacks ?? {},
  };
}

/** Neutral party context for Chart.js tooltips — Democratic share first, Republican second. */
export function partyShareTooltipLines(demShare, repShare, formatShare) {
  const lines = [];
  if (demShare != null && Number.isFinite(demShare)) {
    lines.push(`Democratic share: ${formatShare(demShare)}`);
  }
  if (repShare != null && Number.isFinite(repShare)) {
    lines.push(`Republican share: ${formatShare(repShare)}`);
  }
  return lines;
}
