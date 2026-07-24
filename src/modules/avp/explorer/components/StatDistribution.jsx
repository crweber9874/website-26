"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS, BarElement, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { labelFor, formatValue, isContinuousVar, niceStep } from "@/modules/avp/shared/lib/variables";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";
import { kdeCounts, histModel } from "@/modules/avp/shared/lib/kde";
import { UA } from "@/modules/avp/shared/lib/colors";

ChartJS.register(BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const GEO_PLURAL = {
  cd: "congressional districts", county: "counties", ld: "legislative districts",
  tract: "census tracts", zcta: "ZIP areas", zip: "ZIP codes", blockgroup: "block groups",
};

function unitName(geoid, geo) {
  const tail = geoid.replace(/^AZ-[A-Z]+-/, "");
  if (geo === "county") return tail.charAt(0) + tail.slice(1).toLowerCase() + " County";
  if (geo === "cd") return `CD ${Number(tail)}`;
  if (geo === "ld") return `LD ${Number(tail)}`;
  if (geo === "zcta" || geo === "zip") return `ZIP ${tail}`;
  return tail;
}

function lead(variable, unit, val, name) {
  const p = formatValue(val, unit);
  const gen = variable.match(/^turnout_gen_(\d{4})$/);
  const prim = variable.match(/^turnout_prim_(\d{4})$/);
  const presp = variable.match(/^turnout_presp_(\d{4})$/);
  if (gen) return `In ${name}, ${p} of active voters cast a ballot in the ${gen[1]} General election.`;
  if (prim) return `In ${name}, ${p} of active voters voted in the ${prim[1]} Primary.`;
  if (presp) return `In ${name}, ${p} of active voters voted in the ${presp[1]} Presidential Preference election.`;
  if (variable === "pevl_share") return `${p} of active voters in ${name} are on the Permanent Early Voting List.`;
  if (variable === "early_share_gen_2024") return `Of ${name} voters who cast a 2024 General ballot, ${p} voted early.`;
  if (variable === "party_share_dem") return `${p} of registered voters in ${name} are Democrats.`;
  if (variable === "party_share_rep") return `${p} of registered voters in ${name} are Republicans.`;
  if (variable === "party_share_oth") return `${p} of registered voters in ${name} claim no major party.`;
  if (variable === "pct_active") return `${p} of ${name}'s registrations are active.`;
  return `${name}'s ${labelFor(variable)} is ${p}.`;
}

export default function StatDistribution({ data, variable, geo, selected }) {
  const { byGeoid, geoids, units } = data;
  const unit = units[variable] ?? "count";
  const vals = useMemo(
    () => geoids.map((g) => byGeoid[g].values[variable]).filter(Number.isFinite),
    [variable, geoids, byGeoid],
  );
  const continuous = isContinuousVar(variable, unit, vals);

  const model = useMemo(() => {
    if (vals.length < 3) return null;
    if (!continuous) {
      const counts = new Map();
      for (const v of vals) {
        const k = Math.round(v);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const levels = [...counts.keys()].sort((a, b) => a - b);
      return {
        discrete: true,
        labels: levels.map((v) => formatValue(v, unit)),
        counts: levels.map((v) => counts.get(v)),
        levels,
        n: vals.length,
      };
    }
    const min = Math.min(...vals), max = Math.max(...vals);
    const model = histModel(vals);
    if (!model) return null;
    const density = kdeCounts(vals, model.centers, model.w);
    return { discrete: false, ...model, density, median: (() => {
      const sorted = [...vals].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    })() };
  }, [vals, continuous, unit]);

  if (!model) return null;

  const selVal = selected ? byGeoid[selected]?.values[variable] : null;
  const hasSel = Number.isFinite(selVal);

  if (model.discrete) {
    const selKey = hasSel ? Math.round(selVal) : null;
    const selIdx = selKey != null ? model.levels.indexOf(selKey) : -1;
    const barColors = model.counts.map((_, i) =>
      i === selIdx ? UA.azred : "rgba(55,141,189,0.45)");
    const chart = {
      labels: model.labels,
      datasets: [{ type: "bar", data: model.counts, backgroundColor: barColors, borderWidth: 0 }],
    };
    const opts = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: chartTooltip({
          callbacks: {
            title: (items) => `${labelFor(variable)} at ${items[0].label}`,
            label: (ctx) => `${ctx.raw} ${GEO_PLURAL[geo] ?? "areas"} at this level`,
          },
        }),
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
        y: { display: false, beginAtZero: true },
      },
    };
    return (
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          How {hasSel ? unitName(selected, geo) : "each area"} compares · {labelFor(variable)}
        </div>
        <div style={{ height: 150 }}>
          <Chart type="bar" data={chart} options={opts} />
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          {hasSel
            ? `${lead(variable, unit, selVal, unitName(selected, geo))} Red bar marks this area's category.`
            : `Category counts across ${model.n} ${GEO_PLURAL[geo] ?? "areas"}. Select an area on the map.`}
        </p>
      </div>
    );
  }

  const selBin = hasSel
    ? Math.min(model.NB - 1, Math.max(0, Math.floor((selVal - model.min) / model.w)))
    : -1;
  const pct = hasSel
    ? Math.round((model.counts.reduce((a, c, i) => a + (model.centers[i] <= selVal ? c : 0), 0) / model.n) * 100)
    : null;
  const barColors = model.counts.map((_, i) =>
    i === selBin ? UA.azred : "rgba(55,141,189,0.45)");
  const step = niceStep(model.min, model.max);

  const chart = {
    labels: model.centers.map((c) => formatValue(c, unit)),
    datasets: [
      { type: "bar", label: "count", data: model.counts, backgroundColor: barColors,
        borderWidth: 0, barPercentage: 1, categoryPercentage: 1, order: 2 },
      { type: "line", label: "density", data: model.density, borderColor: UA.azblue,
        borderWidth: 1.5, pointRadius: 0, tension: 0.4, order: 1 },
    ],
  };
  const opts = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => `${labelFor(variable)} around ${items[0].label}`,
          label: (ctx) => ctx.dataset.type === "bar"
            ? `${ctx.raw} ${GEO_PLURAL[geo] ?? "areas"} in this range`
            : null,
          filter: (ctx) => ctx.dataset.type === "bar",
        },
      }),
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 6, autoSkip: true, stepSize: step } },
      y: { display: false, beginAtZero: true },
    },
  };

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        How {hasSel ? unitName(selected, geo) : "each area"} compares · {labelFor(variable)}
      </div>
      <div style={{ height: 150 }}>
        <Chart type="bar" data={chart} options={opts} />
      </div>
      {hasSel ? (
        <p className="note" style={{ marginTop: 8, lineHeight: 1.5 }}>
          {lead(variable, unit, selVal, unitName(selected, geo))}{" "}
          That&apos;s higher than <strong>{pct}%</strong> of Arizona&apos;s {model.n}{" "}
          {GEO_PLURAL[geo] ?? "areas"} (statewide median {formatValue(model.median, unit)}).
          The red bar marks where {unitName(selected, geo)} falls; the curve is the
          full distribution.
        </p>
      ) : (
        <p className="note" style={{ marginTop: 8 }}>
          Distribution across all {model.n} {GEO_PLURAL[geo] ?? "areas"} (median{" "}
          {formatValue(model.median, unit)}). Select an area on the map to situate it.
        </p>
      )}
    </div>
  );
}
