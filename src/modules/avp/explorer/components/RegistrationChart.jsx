"use client";
import { useMemo, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Pie } from "react-chartjs-2";
import { PARTY, UA } from "@/modules/avp/shared/lib/colors";
import { chartTooltip, partyShareTooltipLines } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(ArcElement, Tooltip, Legend);

// Party palette. Rep/Dem in UA brand; the independent family as a graded set so
// the "all independent types" reading stays legible against the single
// "Independent / other" bucket.
const C = {
  rep: PARTY.rep,
  dem: PARTY.dem,
  lbt: "#E0A800", // Libertarian — gold
  nol: UA.oasis, // No Labels — oasis
  pnd: "#8FB8CE", // Party not specified — light oasis
  oth: "#9AA7B1", // Other party — grey
  ind: UA.oasis, // combined Independent / other (inner ring)
};

// value keys -> the six detailed buckets
const DETAIL = [
  ["Republican", "total_republican", C.rep],
  ["Democratic", "total_democratic", C.dem],
  ["Libertarian", "total_libertarian", C.lbt],
  ["No Labels", "total_nolabels", C.nol],
  ["Party not specified", "total_party_not_specified", C.pnd],
  ["Other party", "total_other_party", C.oth],
];

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const pct = (n, tot) => (tot ? `${((n / tot) * 100).toFixed(1)}%` : "—");

export default function RegistrationChart({
  values,
  label,
  defaultMode = "sunburst",
  compareValues = null,
  outerLabel = "Statewide",
  innerLabel = "Selected area",
}) {
  const [mode, setMode] = useState(defaultMode); // "sunburst" | "pie"

  const data = useMemo(() => {
    const detail = DETAIL.map(([name, key, color]) => ({
      name,
      color,
      v: Number(values?.[key]) || 0,
    }));
    const rep = detail[0].v;
    const dem = detail[1].v;
    const ind = detail.slice(2).reduce((s, d) => s + d.v, 0);
    const total = rep + dem + ind;
    return { detail, broad: [
      { name: "Republican", color: C.rep, v: rep },
      { name: "Democratic", color: C.dem, v: dem },
      { name: "Independent / other", color: C.ind, v: ind },
    ], total };
  }, [values]);

  const legendOpts = {
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
      tooltip: chartTooltip({
        callbacks: {
          // The inner (broad) ring carries its own 3-item `labels`; the chart's
          // top-level labels has 6. Resolve per-dataset so the inner ring shows
          // "Independent / other" instead of the 6-bucket label at that index.
          title: (items) => {
            const dsLabels = items[0]?.chart?.data?.datasets?.[items[0].datasetIndex]?.labels;
            const name = dsLabels?.[items[0].dataIndex] ?? items[0].label;
            const ringLabel = items[0].datasetIndex === 0 && compareValues ? innerLabel
              : items[0].datasetIndex === 0 && !compareValues ? "Broad party buckets"
              : compareValues && items[0].datasetIndex === 1 ? outerLabel
              : "Detailed party buckets";
            return `${ringLabel}: ${name}`;
          },
          label: (ctx) => {
            const dsLabels = ctx.chart.data.datasets[ctx.datasetIndex]?.labels;
            const name = dsLabels?.[ctx.dataIndex] ?? ctx.label;
            const ring = ctx.chart.data.datasets[ctx.datasetIndex]?.data ?? [];
            const ringTotal = ring.reduce((s, v) => s + (Number(v) || 0), 0);
            return `${name}: ${fmt(ctx.parsed)} registered voters (${pct(ctx.parsed, ringTotal)} of this ring)`;
          },
          afterBody: (items) => {
            const ctx = items[0];
            const ring = ctx.chart.data.datasets[ctx.datasetIndex]?.data ?? [];
            const labels = ctx.chart.data.datasets[ctx.datasetIndex]?.labels ?? [];
            const ringTotal = ring.reduce((s, v) => s + (Number(v) || 0), 0);
            if (!ringTotal) return [];
            let dem = 0;
            let rep = 0;
            for (let i = 0; i < labels.length; i++) {
              const name = String(labels[i]);
              const v = Number(ring[i]) || 0;
              if (name.includes("Democratic")) dem += v;
              else if (name.includes("Republican")) rep += v;
            }
            return partyShareTooltipLines(
              dem / ringTotal,
              rep / ringTotal,
              (share) => `${(share * 100).toFixed(1)}%`,
            );
          },
        },
      }),
    },
    maintainAspectRatio: false,
  };

  // Sunburst = two concentric doughnut rings that share the same total, so the
  // detailed outer ring nests inside its broad inner ring.
  const sunburst = {
    labels: data.detail.map((d) => d.name),
    datasets: [
      {
        // inner ring: broad (Rep / Dem / Independent-other)
        data: data.broad.map((d) => d.v),
        backgroundColor: data.broad.map((d) => d.color),
        borderColor: "#fff",
        borderWidth: 2,
        weight: 0.55,
        // relabel for tooltip on this ring
        labels: data.broad.map((d) => d.name),
      },
      {
        // outer ring: all six detailed buckets
        data: data.detail.map((d) => d.v),
        backgroundColor: data.detail.map((d) => d.color),
        borderColor: "#fff",
        borderWidth: 2,
        weight: 1,
      },
    ],
  };

  const pie = {
    labels: data.detail.map((d) => d.name),
    datasets: [
      {
        data: data.detail.map((d) => d.v),
        backgroundColor: data.detail.map((d) => d.color),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const compare = useMemo(() => {
    const outer = DETAIL.map(([name, key, color]) => ({
      name,
      color,
      v: Number(compareValues?.[key]) || 0,
    }));
    const inner = DETAIL.map(([name, key, color]) => ({
      name,
      color,
      v: Number(values?.[key]) || 0,
    }));
    return { outer, inner };
  }, [compareValues, values]);

  const compareSunburst = {
    labels: compare.outer.map((d) => d.name),
    datasets: [
      {
        // outer ring: statewide reference
        data: compare.outer.map((d) => d.v),
        backgroundColor: compare.outer.map((d) => d.color),
        borderColor: "#fff",
        borderWidth: 2,
        weight: 1,
        labels: compare.outer.map((d) => `${outerLabel}: ${d.name}`),
      },
      {
        // inner ring: selected unit
        data: compare.inner.map((d) => d.v),
        backgroundColor: compare.inner.map((d) => d.color),
        borderColor: "#fff",
        borderWidth: 2,
        weight: 0.6,
        labels: compare.inner.map((d) => `${innerLabel}: ${d.name}`),
      },
    ],
  };

  return (
    <figure className="regchart">
      <figcaption>
        <span>{label ?? "Party registration"}</span>
        <span className="regtot">{fmt(data.total)} registered</span>
        {compareValues && (
          <span className="note">Outside ring: {outerLabel} · Inside ring: {innerLabel}</span>
        )}
        <span className="regtoggle" role="tablist">
          <button role="tab" aria-selected={mode === "sunburst"} onClick={() => setMode("sunburst")}>Sunburst</button>
          <button role="tab" aria-selected={mode === "pie"} onClick={() => setMode("pie")}>Pie</button>
        </span>
      </figcaption>
      <div className="regcanvas">
        {mode === "sunburst" ? (
          <Doughnut
            data={compareValues ? compareSunburst : sunburst}
            options={{ ...legendOpts, cutout: "32%" }}
          />
        ) : (
          <Pie data={pie} options={legendOpts} />
        )}
      </div>
    </figure>
  );
}
