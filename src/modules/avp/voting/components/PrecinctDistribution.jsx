"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS, BarElement, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { kdeCounts, histModel, univariateStats } from "@/modules/avp/shared/lib/kde";
import { niceStep } from "@/modules/avp/shared/lib/variables";
import { UA } from "@/modules/avp/shared/lib/colors";
import {
  prettyContest, contestTooltip, fmtPct, isMeasure, metricLabel,
} from "@/modules/avp/voting/lib/precinct";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

function valsOf(records, key) {
  return records.map((r) => r[key]).filter(Number.isFinite);
}

function binIndex(model, val) {
  return Math.min(model.NB - 1, Math.max(0, Math.floor((val - model.min) / model.w)));
}

function pctBelow(vals, val) {
  if (!Array.isArray(vals) || vals.length === 0) return null;
  const below = vals.filter((v) => v <= val).length;
  return Math.round((below / vals.length) * 100);
}

export default function PrecinctDistribution({
  statewideRecords,
  countyRecords,
  selectedRecord,
  county,
  activeContest,
  year,
  bwMult,
  onBwChange,
}) {
  const statewideVals = useMemo(
    () => valsOf(statewideRecords, activeContest),
    [statewideRecords, activeContest],
  );
  const countyVals = useMemo(
    () => (county ? valsOf(countyRecords, activeContest) : []),
    [county, countyRecords, activeContest],
  );

  const model = useMemo(() => {
    if (statewideVals.length < 3) return null;
    const hist = histModel(statewideVals);
    if (!hist) return null;
    const density = kdeCounts(statewideVals, hist.centers, hist.w, bwMult);
    const stats = univariateStats(statewideVals);
    return { ...hist, density, stats };
  }, [statewideVals, bwMult]);

  if (!model || !activeContest) return null;

  const selVal = selectedRecord?.[activeContest];
  const hasSel = Number.isFinite(selVal);
  const selBin = hasSel ? binIndex(model, selVal) : -1;

  const countyBins = new Set();
  for (const v of countyVals) countyBins.add(binIndex(model, v));

  const barColors = model.counts.map((_, i) => {
    if (i === selBin) return UA.azred;
    if (countyBins.has(i)) return "rgba(30,82,136,0.55)";
    return "rgba(55,141,189,0.35)";
  });

  const contestLabel = prettyContest(activeContest);
  const metric = metricLabel(activeContest);
  const tip = contestTooltip(activeContest, year);

  const countyStats = countyVals.length >= 3 ? univariateStats(countyVals) : null;

  let note;
  if (hasSel) {
    const pct = pctBelow(statewideVals, selVal);
    note = (
      <>
        Precinct <strong>{selectedRecord.precinct_id}</strong> ({selectedRecord.county} County) —
        {" "}{metric} <strong>{fmtPct(selVal)}</strong>.
        {pct != null && (
          <> Higher than <strong>{pct}%</strong> of Arizona&apos;s {model.n} precincts</>
        )}
        {" "}(statewide median{" "}
        {fmtPct(model.stats.median)}).
        {countyStats && (
          <> County median {fmtPct(countyStats.median)}.</>
        )}
        {" "}Red bar marks this precinct; darker bars contain {county || "selected"} county precincts.
      </>
    );
  } else if (county && countyStats) {
    note = (
      <>
        <strong>{county} County</strong> — {countyVals.length} precincts, median {metric}{" "}
        <strong>{fmtPct(countyStats.median)}</strong> (statewide median {fmtPct(model.stats.median)}).
        Darker bars mark bins where county precincts fall. Click a precinct to pin one on the distribution.
      </>
    );
  } else {
    note = (
      <>
        Distribution of {metric} for <strong>{contestLabel}</strong> across all {model.n} Arizona
        precincts (median {fmtPct(model.stats.median)}). Select a county or click a precinct to situate it.
      </>
    );
  }

  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 6 }}>
        <span className="eyebrow">
          Statewide distribution · {contestLabel}
        </span>
        <label style={{ marginLeft: "auto", fontSize: 12 }}>
          KDE bandwidth
          <input
            type="range" min="0.25" max="3" step="0.05" value={bwMult}
            onChange={(e) => onBwChange(+e.target.value)}
            style={{ marginLeft: 8, verticalAlign: "middle" }}
            aria-label="KDE bandwidth multiplier"
          />
          {" "}{bwMult.toFixed(2)}×
        </label>
      </div>
      {tip && (
        <p className="note" style={{ margin: "0 0 8px", lineHeight: 1.45, fontSize: 12 }}>
          {tip}
        </p>
      )}
      <div style={{ height: 150 }}>
        <Chart
          type="bar"
          data={{
            labels: model.centers.map((c) => fmtPct(c)),
            datasets: [
              {
                type: "bar",
                data: model.counts,
                backgroundColor: barColors,
                borderWidth: 0,
                barPercentage: 1,
                categoryPercentage: 1,
                order: 2,
              },
              {
                type: "line",
                data: model.density,
                borderColor: UA.azblue,
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.4,
                order: 1,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: chartTooltip({
                callbacks: {
                  title: (items) => `${metric} near ${items[0].label}`,
                  label: (ctx) => ctx.dataset.type === "bar"
                    ? `${ctx.raw} precincts in this range`
                    : null,
                  filter: (ctx) => ctx.dataset.type === "bar",
                },
              }),
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 6, autoSkip: true, stepSize: niceStep(model.min, model.max) },
              },
              y: { display: false, beginAtZero: true },
            },
          }}
        />
      </div>
      <p className="note" style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
        {note}
      </p>
    </section>
  );
}
