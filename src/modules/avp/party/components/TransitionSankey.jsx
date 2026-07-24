"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { partyLabel } from "@/modules/avp/shared/lib/map-tooltip";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";
import DownloadGraphic from "@/components/react/DownloadGraphic";

const PARTY_STATES = ["DEM", "REP", "NOL", "LBT", "PND", "OTH"];

const PARTY_COLORS = {
  DEM: "#0C234B",
  REP: "#AB0520",
  NOL: "#378DBD",
  LBT: "#C9A227",
  PND: "#8FA2B5",
  OTH: "#9AA7B1",
};

const GEO_OPTIONS = [
  ["county", "County"],
  ["cd", "Congressional district"],
  ["ld", "Legislative district"],
  ["zip", "ZIP"],
  ["zcta", "ZCTA"],
];

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const fmt1 = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 1 });
const pct1 = (x) => `${(x * 100).toFixed(1)}%`;

function parseWindowMonths(window) {
  if (!window || !window.includes("..")) return 1;
  const [a, b] = window.split("..");
  const start = new Date(a);
  const end = new Date(b);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const days = Math.max(1, (end.getTime() - start.getTime()) / 86400000);
  return days / 30.4375;
}

function matrixMultiply(A, B) {
  const n = A.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let k = 0; k < n; k += 1) {
      const aik = A[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < n; j += 1) out[i][j] += aik * B[k][j];
    }
  }
  return out;
}

function matrixPower(M, k) {
  const n = M.length;
  let exp = Math.max(1, Math.round(k));
  let base = M.map((row) => [...row]);
  let out = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  while (exp > 0) {
    if (exp % 2 === 1) out = matrixMultiply(out, base);
    base = matrixMultiply(base, base);
    exp = Math.floor(exp / 2);
  }
  return out;
}

function titleFromGeoid(geoid) {
  if (!geoid) return "";
  if (geoid.startsWith("AZ-COUNTY-")) {
    return geoid.replace("AZ-COUNTY-", "").replaceAll("-", " ");
  }
  if (geoid.startsWith("AZ-CD-")) return `CD ${geoid.slice(-2)}`;
  if (geoid.startsWith("AZ-LD-")) return `LD ${geoid.slice(-2)}`;
  if (geoid.startsWith("AZ-ZIP-")) return `ZIP ${geoid.replace("AZ-ZIP-", "")}`;
  if (geoid.startsWith("AZ-ZCTA-")) return `ZCTA ${geoid.replace("AZ-ZCTA-", "")}`;
  return geoid;
}

function buildModel(rows, states) {
  const matrix = Object.fromEntries(
    states.map((s) => [s, Object.fromEntries(states.map((t) => [t, 0]))]),
  );
  const fromMarginals = Object.fromEntries(states.map((s) => [s, 0]));
  let hasDiagonalVars = false;
  let hasFromMarginals = false;

  for (const r of rows) {
    const m = /^flow_([A-Z]+)_([A-Z]+)$/.exec(r.variable || "");
    if (m) {
      const from = m[1];
      const to = m[2];
      if (states.includes(from) && states.includes(to)) {
        matrix[from][to] += Number(r.value) || 0;
        if (from === to) hasDiagonalVars = true;
      }
      continue;
    }
    const fm = /^from_([A-Z]+)$/.exec(r.variable || "");
    if (fm && states.includes(fm[1])) {
      fromMarginals[fm[1]] += Number(r.value) || 0;
      hasFromMarginals = true;
    }
  }

  if (!hasFromMarginals) {
    for (const s of states) {
      fromMarginals[s] = states.reduce((acc, t) => acc + (matrix[s][t] || 0), 0);
    }
  }

  const P = states.map((from) => {
    const den = fromMarginals[from] || 0;
    if (den <= 0) {
      return states.map((to) => (to === from ? 1 : 0));
    }
    return states.map((to) => (matrix[from][to] || 0) / den);
  });

  return {
    matrix,
    fromMarginals,
    hasProjectionInputs: hasFromMarginals || hasDiagonalVars,
    P,
  };
}

function buildSankeyData({ states, model, monthsInWindow, horizonMonths, project }) {
  const rows = states;
  const values = {};

  if (project) {
    const k = Math.max(1, Math.round(horizonMonths));
    const Pk = matrixPower(model.P, k);
    for (let i = 0; i < states.length; i += 1) {
      const from = states[i];
      for (let j = 0; j < states.length; j += 1) {
        const to = states[j];
        values[`${from}|${to}`] = (model.fromMarginals[from] || 0) * Pk[i][j];
      }
    }
  } else {
    for (const from of states) {
      for (const to of states) values[`${from}|${to}`] = model.matrix[from][to] || 0;
    }
  }

  const perMonthDivisor = project ? Math.max(1, Math.round(horizonMonths)) : Math.max(1e-6, monthsInWindow);

  const links = [];
  for (const from of states) {
    for (const to of states) {
      if (from === to) continue;
      const raw = values[`${from}|${to}`] || 0;
      const value = raw / perMonthDivisor;
      if (value > 0) links.push({ from, to, value, raw });
    }
  }

  const outTotals = Object.fromEntries(rows.map((s) => [s, 0]));
  const inTotals = Object.fromEntries(rows.map((s) => [s, 0]));
  for (const l of links) {
    outTotals[l.from] += l.value;
    inTotals[l.to] += l.value;
  }

  return { links, outTotals, inTotals };
}

export default function TransitionSankey() {
  const [geography, setGeography] = useState("county");
  const [rows, setRows] = useState([]);
  const [geoid, setGeoid] = useState("");
  const [loading, setLoading] = useState(false);
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    fetch(publicUrl(`/data/transitions/party/${geography}/summary.json`))
      .then((r) => r.json())
      .then((d) => {
        if (!canceled) setRows(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (!canceled) setRows([]);
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [geography]);

  const states = PARTY_STATES;
  const colors = PARTY_COLORS;

  const geoids = useMemo(() => {
    const by = new Map();
    for (const r of rows) {
      const n = Number(r.n) || 0;
      if (!by.has(r.geoid) || n > by.get(r.geoid)) by.set(r.geoid, n);
    }
    return [...by.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => ({ id, n }));
  }, [rows]);

  useEffect(() => {
    if (geoids.length === 0) {
      setGeoid("");
      return;
    }
    const maricopa = geoids.find((g) => g.id === "AZ-COUNTY-MARICOPA");
    const first = maricopa?.id || geoids[0].id;
    if (!geoid || !geoids.some((g) => g.id === geoid)) setGeoid(first);
  }, [geoids, geoid]);

  const selectedRows = useMemo(() => rows.filter((r) => r.geoid === geoid), [rows, geoid]);
  const timeWindow = selectedRows[0]?.window || "";
  const monthsInWindow = parseWindowMonths(timeWindow);
  const model = useMemo(() => buildModel(selectedRows, states), [selectedRows, states]);
  const canProject = model.hasProjectionInputs;

  const sankey = useMemo(
    () =>
      buildSankeyData({
        states,
        model,
        monthsInWindow,
        horizonMonths,
        project: canProject,
      }),
    [states, model, monthsInWindow, horizonMonths, canProject],
  );

  const svg = useMemo(() => {
    const width = 920;
    const height = 440;
    const leftX = 160;
    const rightX = 720;
    const nodeWidth = 16;
    const topPad = 22;
    const rowGap = 10;

    const totals = sankey.outTotals;
    const totalFlow = Object.values(totals).reduce((a, b) => a + b, 0);
    const freeHeight = height - topPad * 2 - rowGap * (states.length - 1);
    const scale = totalFlow > 0 ? freeHeight / totalFlow : 0;

    const left = {};
    const right = {};

    let y = topPad;
    for (const s of states) {
      const h = (sankey.outTotals[s] || 0) * scale;
      left[s] = { y, h };
      y += h + rowGap;
    }

    y = topPad;
    for (const s of states) {
      const h = (sankey.inTotals[s] || 0) * scale;
      right[s] = { y, h };
      y += h + rowGap;
    }

    const sourceCur = Object.fromEntries(states.map((s) => [s, left[s].y]));
    const targetCur = Object.fromEntries(states.map((s) => [s, right[s].y]));

    const paths = sankey.links
      .slice()
      .sort((a, b) => states.indexOf(a.to) - states.indexOf(b.to))
      .map((l, i) => {
        const t = l.value * scale;
        const y0 = sourceCur[l.from] + t / 2;
        const y1 = targetCur[l.to] + t / 2;
        sourceCur[l.from] += t;
        targetCur[l.to] += t;
        const c1x = leftX + 180;
        const c2x = rightX - 180;
        return {
          id: `${l.from}-${l.to}-${i}`,
          d: `M ${leftX + nodeWidth} ${y0} C ${c1x} ${y0}, ${c2x} ${y1}, ${rightX} ${y1}`,
          stroke: colors[l.from] || "#7a8a99",
          width: Math.max(1, t),
          from: l.from,
          to: l.to,
          value: l.value,
          raw: l.raw,
        };
      });

    return { width, height, leftX, rightX, nodeWidth, left, right, paths, totalFlow };
  }, [sankey, states, colors]);

  const selectedN = selectedRows[0]?.n ?? null;
  const monthlySwitchers = sankey.links.reduce((acc, l) => acc + l.value, 0);

  const tooltip = useMemo(() => {
    if (!hovered) return null;
    const outDen = sankey.outTotals[hovered.from] || 0;
    const inDen = sankey.inTotals[hovered.to] || 0;
    return {
      ...hovered,
      outShare: outDen > 0 ? hovered.value / outDen : 0,
      inShare: inDen > 0 ? hovered.value / inDen : 0,
      windowCount: canProject
        ? (hovered.raw ?? hovered.value * horizonMonths)
        : hovered.value * monthsInWindow,
    };
  }, [hovered, sankey, canProject, monthsInWindow, horizonMonths]);

  return (
    <div className="sankey-wrap">
      <div className="sankey-controls">
        <label>
          Geography
          <select value={geography} onChange={(e) => setGeography(e.target.value)}>
            {GEO_OPTIONS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Unit
          <select value={geoid} onChange={(e) => setGeoid(e.target.value)}>
            {geoids.map((g) => (
              <option key={g.id} value={g.id}>{titleFromGeoid(g.id)}</option>
            ))}
          </select>
        </label>
        <label>
          Horizon (months)
          <input
            type="range"
            min={1}
            max={24}
            step={1}
            value={horizonMonths}
            onChange={(e) => setHorizonMonths(Number(e.target.value) || 1)}
            disabled={!canProject}
          />
          <span className="stat">{horizonMonths}</span>
        </label>
        <DownloadGraphic
          targetRef={svgRef}
          filename={`avp-party-transitions-${geography}-${geoid || "unit"}`}
          label="Download diagram"
        />
      </div>

      <div className="sankey-meta stat">
        {loading ? "Loading transitions..." : null}
        {!loading && geoid ? `${titleFromGeoid(geoid)} · ${timeWindow || "window unavailable"}` : null}
        {!loading && timeWindow ? ` · ${(monthsInWindow).toFixed(2)} months` : null}
        {!loading && selectedN ? ` · matched n=${fmt(selectedN)}` : null}
      </div>

      <div className="sankey-meta">
        Switchers shown (off-diagonal only): {fmt1(monthlySwitchers)} per month
        {canProject ? ` (computed via P^${horizonMonths} and scaled back to monthly rate)` : ""}
      </div>

      {!canProject ? (
        <p className="note">
          Projection is disabled because this artifact is missing diagonal or from-state marginals.
          Rebuild transitions after the builder update to enable matrix composition.
        </p>
      ) : null}

      <div className="sankey-svgbox" ref={svgRef}>
        <svg viewBox={`0 0 ${svg.width} ${svg.height}`} role="img" aria-label="Transition Sankey">
          <text x={svg.leftX} y={16} className="sankey-label">From</text>
          <text x={svg.rightX} y={16} className="sankey-label">To</text>

          {svg.paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke={p.stroke}
              strokeOpacity="0.3"
              strokeWidth={p.width}
              fill="none"
              onMouseMove={(e) => {
                const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                const x = box ? e.clientX - box.left : 0;
                const y = box ? e.clientY - box.top : 0;
                setHovered({ ...p, x, y });
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{`${partyLabel(p.from)} switched to ${partyLabel(p.to)}: about ${fmt1(p.value)} voters per month`}</title>
            </path>
          ))}

          {states.map((s) => (
            <g key={`left-${s}`}>
              <rect
                x={svg.leftX}
                y={svg.left[s].y}
                width={svg.nodeWidth}
                height={Math.max(0.8, svg.left[s].h)}
                fill={colors[s] || "#7a8a99"}
                opacity="0.95"
              />
              <text x={svg.leftX - 8} y={svg.left[s].y + Math.max(10, svg.left[s].h / 2)} textAnchor="end" className="sankey-state">
                {s}
              </text>
            </g>
          ))}

          {states.map((s) => (
            <g key={`right-${s}`}>
              <rect
                x={svg.rightX}
                y={svg.right[s].y}
                width={svg.nodeWidth}
                height={Math.max(0.8, svg.right[s].h)}
                fill={colors[s] || "#7a8a99"}
                opacity="0.95"
              />
              <text x={svg.rightX + svg.nodeWidth + 8} y={svg.right[s].y + Math.max(10, svg.right[s].h / 2)} className="sankey-state">
                {s}
              </text>
            </g>
          ))}
        </svg>
        {tooltip ? (
          <div
            className="sankey-tooltip"
            style={{ left: `${Math.max(8, Math.min(tooltip.x + 14, svg.width - 240))}px`, top: `${Math.max(8, tooltip.y - 84)}px` }}
          >
            <div className="sankey-tooltip-title">{partyLabel(tooltip.from)} → {partyLabel(tooltip.to)}</div>
            <div className="sankey-tooltip-lede">Monthly party switchers in this geography</div>
            <div>Average monthly flow: <b>{fmt1(tooltip.value)}</b> voters</div>
            <div>
              {canProject
                ? `If this rate held for ${horizonMonths} months`
                : "Total in the selected window"}: <b>{fmt1(tooltip.windowCount)}</b> voters
            </div>
            <div>Share leaving {partyLabel(tooltip.from)}: <b>{pct1(tooltip.outShare)}</b></div>
            <div>Share entering {partyLabel(tooltip.to)}: <b>{pct1(tooltip.inShare)}</b></div>
          </div>
        ) : null}
      </div>

      <p className="note">
        Time-gap handling: widths are monthly-normalized to keep windows comparable, and multi-month horizons are composed with matrix powers (P^k) instead of interpreting distant endpoint changes as direct paths.
      </p>
      <p className="note">
        Interpretation guardrail: endpoint snapshots are interval-censored. Longer gaps hide intermediate moves, so this view is conservative about total mobility and should be read with the window length.
      </p>
    </div>
  );
}
