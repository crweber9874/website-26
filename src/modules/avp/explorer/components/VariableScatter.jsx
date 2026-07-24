"use client";
import { useMemo, useState } from "react";
import {
  Chart as ChartJS, BarElement, LinearScale, CategoryScale,
  PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { Scatter, Bar } from "react-chartjs-2";
import { labelFor, formatValue, isContinuousVar, niceStep } from "@/modules/avp/shared/lib/variables";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";
import { UA, PARTY } from "@/modules/avp/shared/lib/colors";

ChartJS.register(
  BarElement, LinearScale, CategoryScale, PointElement, LineElement, Tooltip, Legend,
);

function ols(pts) {
  const n = pts.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; }
  const cov = sxy - (sx * sy) / n, vx = sxx - (sx * sx) / n, vy = syy - (sy * sy) / n;
  if (vx === 0 || vy === 0) return null;
  const slope = cov / vx, intercept = (sy - slope * sx) / n, r = cov / Math.sqrt(vx * vy);
  return { slope, intercept, r, r2: r * r, n };
}

function loess(pts, span = 0.5) {
  const xs = pts.map((p) => p[0]);
  const min = Math.min(...xs), max = Math.max(...xs);
  const k = Math.max(2, Math.floor(span * pts.length));
  const out = [];
  for (let i = 0; i < 50; i++) {
    const x0 = min + ((max - min) * i) / 49;
    const d = pts.map((p) => Math.abs(p[0] - x0)).sort((a, b) => a - b);
    const h = d[Math.min(k, d.length - 1)] || 1e-9;
    let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
    for (const [x, y] of pts) {
      const u = Math.abs(x - x0) / h;
      if (u >= 1) continue;
      const w = (1 - u ** 3) ** 3;
      sw += w; swx += w * x; swy += w * y; swxx += w * x * x; swxy += w * x * y;
    }
    const denom = sw * swxx - swx * swx;
    const y = Math.abs(denom) < 1e-12
      ? (sw ? swy / sw : 0)
      : (() => { const b = (sw * swxy - swx * swy) / denom; return (swy - b * swx) / sw + b * x0; })();
    out.push({ x: x0, y });
  }
  return out;
}

function discreteHist(values, unit) {
  const counts = new Map();
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    const k = Math.round(v);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const labels = [...counts.keys()].sort((a, b) => a - b);
  return {
    labels: labels.map((v) => formatValue(v, unit)),
    counts: labels.map((v) => counts.get(v)),
  };
}

function linearTicks(min, max, unit) {
  const step = niceStep(min, max);
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let v = start; v <= max + step * 0.01; v += step) ticks.push(+v.toFixed(10));
  return {
    maxTicksLimit: 8,
    callback: (v) => formatValue(v, unit),
    ...(ticks.length >= 2 ? { stepSize: step } : {}),
  };
}

const ACTIVE_EXCLUDE = /^(total_inactive|total_canceled|total_registered|total_suspense|pct_inactive|inactive_)/;

function filterActiveData(data, minActive = 25) {
  const geoids = data.geoids.filter((g) => {
    const active = data.byGeoid[g]?.values?.total_active;
    return Number.isFinite(active) && active >= minActive;
  });
  const domains = {};
  const vars = data.variables.filter((v) => !ACTIVE_EXCLUDE.test(v));
  for (const v of vars) {
    for (const g of geoids) {
      const val = data.byGeoid[g].values[v];
      if (val != null && Number.isFinite(val)) {
        const d = (domains[v] ??= [Infinity, -Infinity]);
        if (val < d[0]) d[0] = val;
        if (val > d[1]) d[1] = val;
      }
    }
  }
  return { ...data, geoids, domains, variables: vars };
}

export default function VariableScatter({
  data,
  geoLabel,
  defaultX = "voter_median_age",
  defaultY = "party_share_dem",
  activeOnly = false,
}) {
  const scoped = useMemo(
    () => (activeOnly ? filterActiveData(data) : data),
    [data, activeOnly],
  );
  const { byGeoid, geoids, units, variables } = scoped;
  const numeric = useMemo(
    () => variables.filter((v) => geoids.some((g) => Number.isFinite(byGeoid[g].values[v]))),
    [variables, geoids, byGeoid],
  );
  const valsOf = (v) => geoids.map((g) => byGeoid[g].values[v]).filter(Number.isFinite);
  const kindOf = (v) => isContinuousVar(v, units[v], valsOf(v)) ? "continuous" : "discrete";

  const pick = (want, avoid) => (numeric.includes(want) ? want : numeric.find((v) => v !== avoid) ?? numeric[0]);
  const [xVar, setX] = useState(() => pick(defaultX, defaultY));
  const [yVar, setY] = useState(() => pick(defaultY, defaultX));
  const [sizeVar, setSize] = useState("");
  const [maxR, setMaxR] = useState(14);
  const [showFit, setShowFit] = useState(true);
  const [showLoess, setShowLoess] = useState(false);

  const xKind = kindOf(xVar);
  const yKind = kindOf(yVar);
  const scatterMode = xKind === "continuous" && yKind === "continuous";

  const { points, pts, colors, radii } = useMemo(() => {
    const points = [], pts = [], colors = [], radii = [];
    let smin = Infinity, smax = -Infinity;
    if (sizeVar) for (const g of geoids) {
      const s = byGeoid[g].values[sizeVar];
      if (Number.isFinite(s)) { smin = Math.min(smin, s); smax = Math.max(smax, s); }
    }
    const span = smax - smin || 1;
    for (const g of geoids) {
      const x = byGeoid[g].values[xVar], y = byGeoid[g].values[yVar];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const dem = byGeoid[g].values.party_share_dem, rep = byGeoid[g].values.party_share_rep;
      const c = Number.isFinite(dem) && Number.isFinite(rep)
        ? (dem > rep ? `${PARTY.dem}a6` : `${PARTY.rep}a6`)
        : `${UA.oasis}a6`;
      const s = sizeVar ? byGeoid[g].values[sizeVar] : null;
      const r = sizeVar && Number.isFinite(s) ? 3 + ((s - smin) / span) * (maxR - 3) : 4;
      points.push({ x, y, r, geoid: g, s });
      pts.push([x, y]); colors.push(c); radii.push(r);
    }
    return { points, pts, colors, radii };
  }, [xVar, yVar, sizeVar, maxR, geoids, byGeoid]);

  const fit = scatterMode ? ols(pts) : null;
  const xmin = scatterMode ? Math.min(...pts.map((p) => p[0])) : 0;
  const xmax = scatterMode ? Math.max(...pts.map((p) => p[0])) : 1;
  const ymin = scatterMode ? Math.min(...pts.map((p) => p[1])) : 0;
  const ymax = scatterMode ? Math.max(...pts.map((p) => p[1])) : 1;
  const line = fit ? [{ x: xmin, y: fit.intercept + fit.slope * xmin }, { x: xmax, y: fit.intercept + fit.slope * xmax }] : [];
  const smooth = scatterMode && showLoess && pts.length >= 6 ? loess(pts) : [];

  const scatterData = {
    datasets: [
      { type: "scatter", label: "units", data: points, backgroundColor: colors,
        pointRadius: (ctx) => ctx.raw.r, pointHoverRadius: (ctx) => ctx.raw.r + 2, order: 3 },
      ...(showFit && line.length ? [{ type: "line", label: "OLS fit", data: line,
        borderColor: UA.azred, borderWidth: 2, pointRadius: 0, order: 1 }] : []),
      ...(smooth.length ? [{ type: "line", label: "loess", data: smooth,
        borderColor: UA.azurite, borderWidth: 2, borderDash: [5, 4], pointRadius: 0, tension: 0.4, order: 2 }] : []),
    ],
  };
  const scatterOpts = {
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: true },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { title: { display: true, text: labelFor(xVar) }, ticks: linearTicks(xmin, xmax, units[xVar]) },
      y: { title: { display: true, text: labelFor(yVar) }, ticks: linearTicks(ymin, ymax, units[yVar]) },
    },
  };

  const xHist = useMemo(() => discreteHist(valsOf(xVar), units[xVar]), [xVar, geoids, byGeoid, units]);
  const yHist = useMemo(() => discreteHist(valsOf(yVar), units[yVar]), [yVar, geoids, byGeoid, units]);

  const Menu = ({ value, onChange, id, extra }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={id}>
      {extra && <option value="">{extra}</option>}
      {numeric.map((v) => (
        <option key={v} value={v}>
          {labelFor(v)}{kindOf(v) === "discrete" ? " (categories)" : ""}
        </option>
      ))}
    </select>
  );

  return (
    <div className="scatter">
      <div className="scatter-controls" style={{ flexWrap: "wrap", gap: 10 }}>
        <label>Y <Menu value={yVar} onChange={setY} id="y axis" /></label>
        <label>X <Menu value={xVar} onChange={setX} id="x axis" /></label>
        {scatterMode && (
          <>
            <label>Bubble size <Menu value={sizeVar} onChange={setSize} id="size" extra="Uniform" /></label>
            {sizeVar && (
              <label>Scale
                <input type="range" min="8" max="30" value={maxR} onChange={(e) => setMaxR(+e.target.value)} />
              </label>
            )}
            <label><input type="checkbox" checked={showFit} onChange={(e) => setShowFit(e.target.checked)} /> Trend line</label>
            <label><input type="checkbox" checked={showLoess} onChange={(e) => setShowLoess(e.target.checked)} /> Loess trend</label>
          </>
        )}
      </div>

      {scatterMode ? (
        <div className="scatter-canvas">
          <Scatter data={scatterData} options={scatterOpts} />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[["x", xVar, xHist], ["y", yVar, yHist]].map(([axis, v, hist]) => (
            <div key={axis}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {labelFor(v)} · {geoLabel ?? "areas"}
              </div>
              <div style={{ height: 160 }}>
                <Bar
                  data={{
                    labels: hist.labels,
                    datasets: [{ data: hist.counts, backgroundColor: "rgba(55,141,189,0.55)", borderWidth: 0 }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: chartTooltip({
                        callbacks: {
                          title: (items) => `${labelFor(v)} · ${items[0].label}`,
                          label: (ctx) => `${ctx.raw} ${geoLabel ?? "areas"} at this level`,
                        },
                      }),
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
                      y: { display: false, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!scatterMode && (
        <p className="note" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Scatter plots need two continuous measures.{" "}
          {xKind !== "continuous" && yKind !== "continuous"
            ? "Both axes here are categorical or small-integer counts — showing bar histograms instead."
            : "One axis is categorical — pick two continuous variables (shares, rates, ages, scores) for a scatter plot."}
        </p>
      )}

      <div className="scatter-r" style={{ marginTop: 6 }}>
        {geoLabel ? `${geoLabel} · ` : ""}n={points.length}
        {scatterMode && (
          <span className="legend" style={{ marginLeft: 12 }}>
            <span><span className="sw" style={{ background: PARTY.dem }} />Dem lean</span>
            <span><span className="sw" style={{ background: PARTY.rep }} />Rep lean</span>
          </span>
        )}
      </div>
    </div>
  );
}
