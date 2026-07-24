"use client";
import { useMemo, useState } from "react";
import {
  Chart as ChartJS, BarElement, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip,
} from "chart.js";
import { Chart, Scatter } from "react-chartjs-2";
import { kdeCounts, univariateStats, histModel } from "@/modules/avp/shared/lib/kde";
import { niceStep } from "@/modules/avp/shared/lib/variables";
import { UA, partyDiverging } from "@/modules/avp/shared/lib/colors";
import {
  analyticsVars, prettyContest, contestTooltip, fmtPct, isMeasure, metricLabel,
} from "@/modules/avp/voting/lib/precinct";
import { chartTooltip, partyShareTooltipLines } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(
  BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip,
);

function valsOf(records, key) {
  return records.map((r) => r[key]).filter(Number.isFinite);
}

export default function PrecinctCountyAnalytics({
  county, records, activeContest, contests, year, bwMult, onBwChange,
}) {
  const vars = useMemo(() => analyticsVars(contests), [contests]);
  const continuous = vars.filter((v) => v.continuous);
  const [xVar, setX] = useState("two_party_rep");
  const [yVar, setY] = useState(() => activeContest ?? "two_party_rep");
  const [distVar, setDistVar] = useState(() => activeContest ?? "two_party_rep");

  const activeX = continuous.find((v) => v.id === xVar)?.id ?? continuous[0]?.id;
  const activeY = continuous.find((v) => v.id === yVar)?.id ?? activeContest ?? continuous[0]?.id;
  const activeDist = continuous.find((v) => v.id === distVar)?.id ?? activeContest ?? continuous[0]?.id;

  const distVals = useMemo(() => valsOf(records, activeDist), [records, activeDist]);
  const stats = useMemo(() => univariateStats(distVals), [distVals]);

  const distChart = useMemo(() => {
    const model = histModel(distVals);
    if (!model) return null;
    const density = kdeCounts(distVals, model.centers, model.w, bwMult);
    return { model, density };
  }, [distVals, bwMult]);

  const scatter = useMemo(() => {
    const pts = [];
    for (const r of records) {
      const x = r[activeX], y = r[activeY];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      pts.push({ x, y, id: r.precinct_id, repLean: r.two_party_rep, demShare: r.dem_share, repShare: r.rep_share });
    }
    return pts;
  }, [records, activeX, activeY]);

  if (!county || !records.length) return null;

  const distLabel = vars.find((v) => v.id === activeDist)?.label ?? prettyContest(activeDist);
  const xLabel = vars.find((v) => v.id === activeX)?.label ?? activeX;
  const yLabel = vars.find((v) => v.id === activeY)?.label ?? activeY;

  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>
        {county} County · precinct analytics
      </div>
      <p className="note" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
        {records.length} precincts · distributions use histogram + KDE (bandwidth{" "}
        {bwMult.toFixed(2)}× Silverman).{" "}
        {MEASURE_INFO_blurb(activeDist, year)}
      </p>

      {/* univariate stats */}
      {stats && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Univariate statistics</div>
          <label style={{ fontSize: 13, marginRight: 8 }}>
            Variable{" "}
            <select value={activeDist} onChange={(e) => setDistVar(e.target.value)} aria-label="Distribution variable">
              {continuous.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </label>
          <table className="regtab" style={{ fontFamily: "var(--mono)", fontSize: 12, width: "100%", marginTop: 8 }}>
            <tbody>
              {[["Precincts (n)", stats.n], ["Mean", fmtPct(stats.mean)], ["Median", fmtPct(stats.median)],
                ["Std. dev.", fmtPct(stats.sd)], ["Min", fmtPct(stats.min)], ["Max", fmtPct(stats.max)],
                ["25th pct", fmtPct(stats.p25)], ["75th pct", fmtPct(stats.p75)]].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td style={{ textAlign: "right" }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* distribution + bandwidth */}
      {distChart && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 6 }}>
            <span className="eyebrow">Distribution · {distLabel}</span>
            <label style={{ marginLeft: "auto", fontSize: 12 }}>
              KDE bandwidth
              <input
                type="range" min="0.25" max="3" step="0.05" value={bwMult}
                onChange={(e) => onBwChange(+e.target.value)}
                style={{ marginLeft: 8, verticalAlign: "middle" }}
              />
              {" "}{bwMult.toFixed(2)}×
            </label>
          </div>
          <div style={{ height: 160 }}>
            <Chart
              type="bar"
              data={{
                labels: distChart.model.centers.map((c) => fmtPct(c)),
                datasets: [
                  { type: "bar", data: distChart.model.counts, backgroundColor: "rgba(55,141,189,0.45)", borderWidth: 0, order: 2 },
                  { type: "line", data: distChart.density, borderColor: UA.azblue, borderWidth: 2, pointRadius: 0, tension: 0.4, order: 1 },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: chartTooltip({
                    callbacks: {
                      title: (items) => `${distLabel} near ${items[0].label}`,
                      label: (ctx) => ctx.dataset.type === "bar"
                        ? `${ctx.raw} precincts in ${county} County`
                        : null,
                      filter: (ctx) => ctx.dataset.type === "bar",
                    },
                  }),
                },
                scales: {
                  x: { grid: { display: false }, ticks: { maxTicksLimit: 6, autoSkip: true } },
                  y: { display: false, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* scatter (continuous only) */}
      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Scatter · continuous measures only</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8, fontSize: 13 }}>
          <label>X <select value={activeX} onChange={(e) => setX(e.target.value)}>{continuous.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
          <label>Y <select value={activeY} onChange={(e) => setY(e.target.value)}>{continuous.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
        </div>
        {scatter.length >= 3 ? (
          <div style={{ height: 220 }}>
            <Scatter
              data={{
                datasets: [{
                  data: scatter,
                  backgroundColor: scatter.map((p) =>
                    Number.isFinite(p.repLean)
                      ? partyDiverging(p.repLean)
                      : `${UA.oasis}8c`,
                  ),
                  pointRadius: 4,
                }],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: chartTooltip({
                    callbacks: {
                      label: (ctx) => {
                        const p = ctx.raw;
                        return [
                          `Precinct ${p.id}: ${xLabel} ${fmtPct(p.x)}, ${yLabel} ${fmtPct(p.y)}`,
                          ...partyShareTooltipLines(p.demShare, p.repShare, fmtPct),
                        ];
                      },
                    },
                  }),
                },
                scales: {
                  x: {
                    title: { display: true, text: xLabel },
                    min: 0, max: 1,
                    ticks: { callback: (v) => fmtPct(v), maxTicksLimit: 6, stepSize: niceStep(0, 1) },
                  },
                  y: {
                    title: { display: true, text: yLabel },
                    min: 0, max: 1,
                    ticks: { callback: (v) => fmtPct(v), maxTicksLimit: 6, stepSize: niceStep(0, 1) },
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="note">Not enough precincts with data for a scatter plot.</p>
        )}
        <p className="note" style={{ marginTop: 8, marginBottom: 0 }}>
          Each point is one precinct, tinted by two-party Republican share (blue = more Dem, red = more Rep).
          Ballot totals and other counts are excluded — only 0–100% shares.
        </p>
      </div>
    </section>
  );
}

function MEASURE_INFO_blurb(slug, year) {
  const tip = contestTooltip(slug, year);
  if (tip && slug.startsWith("proposition_")) return tip;
  if (isMeasure(slug)) return tip;
  return "";
}
