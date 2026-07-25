"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { partyLabel } from "@/modules/avp/shared/lib/map-tooltip";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";
import DownloadGraphic from "@/components/react/DownloadGraphic";

const FALLBACK_STATES = ["DEM", "REP", "PND", "LBT", "NOL", "OTH"];

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
const pct2 = (x) => `${(x * 100).toFixed(2)}%`;

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

function isCodeGeography(geography) {
  return geography === "zip" || geography === "zcta";
}

function codeFromGeoid(geoid) {
  if (!geoid) return "";
  if (geoid.startsWith("AZ-ZIP-")) return geoid.replace("AZ-ZIP-", "");
  if (geoid.startsWith("AZ-ZCTA-")) return geoid.replace("AZ-ZCTA-", "");
  return "";
}

/** Match a typed ZIP/ZCTA against geoids present in the loaded summary. */
function resolveCodeGeoid(raw, geography, geoids) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const label = geography === "zcta" ? "ZCTA" : "ZIP";
  if (digits.length !== 5) {
    return { error: `Enter a 5-digit ${label}.` };
  }
  const prefix = geography === "zcta" ? "AZ-ZCTA-" : "AZ-ZIP-";
  const id = `${prefix}${digits}`;
  if (!geoids.some((g) => g.id === id)) {
    return { error: `Unknown ${label}.` };
  }
  return { id };
}

/** Pull origin stocks from a geography summary artifact. */
function stockFromRows(rows, states) {
  const fromMarginals = Object.fromEntries(states.map((s) => [s, 0]));
  let hasFromMarginals = false;
  const matrix = Object.fromEntries(
    states.map((s) => [s, Object.fromEntries(states.map((t) => [t, 0]))]),
  );

  for (const r of rows) {
    const m = /^flow_([A-Z]+)_([A-Z]+)$/.exec(r.variable || "");
    if (m) {
      const from = m[1];
      const to = m[2];
      if (states.includes(from) && states.includes(to)) {
        matrix[from][to] += Number(r.value) || 0;
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

  return { fromMarginals, matrix };
}

/** Row of P as either named object or array aligned to states. */
function rowProb(P, from, to, states) {
  const row = P?.[from];
  if (!row) return 0;
  if (Array.isArray(row)) {
    const j = states.indexOf(to);
    return j >= 0 ? Number(row[j]) || 0 : 0;
  }
  return Number(row[to]) || 0;
}

function buildSankeyData({ states, fromMarginals, P }) {
  const links = [];
  for (const from of states) {
    const stock = fromMarginals[from] || 0;
    for (const to of states) {
      if (from === to) continue;
      const p = rowProb(P, from, to, states);
      const value = stock * p;
      if (value > 0) links.push({ from, to, value, p });
    }
  }

  const outTotals = Object.fromEntries(states.map((s) => [s, 0]));
  const inTotals = Object.fromEntries(states.map((s) => [s, 0]));
  for (const l of links) {
    outTotals[l.from] += l.value;
    inTotals[l.to] += l.value;
  }

  return { links, outTotals, inTotals };
}

export default function TransitionSankey() {
  const [geography, setGeography] = useState("county");
  const [rows, setRows] = useState([]);
  const [ct, setCt] = useState(null);
  const [geoid, setGeoid] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
  const typedUnit = isCodeGeography(geography);

  useEffect(() => {
    fetch(publicUrl("/data/party/ct_markov.json"))
      .then((r) => r.json())
      .then(setCt)
      .catch(() => setCt(null));
  }, []);

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

  const states = ct?.states ?? FALLBACK_STATES;
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
      setCodeDraft("");
      setCodeError("");
      return;
    }
    if (geoid && geoids.some((g) => g.id === geoid)) {
      if (typedUnit) {
        setCodeDraft(codeFromGeoid(geoid));
        setCodeError("");
      }
      return;
    }
    if (typedUnit) {
      const preferred =
        geoids.find((g) => /^\d{5}$/.test(codeFromGeoid(g.id))) || geoids[0];
      setGeoid(preferred.id);
      setCodeDraft(codeFromGeoid(preferred.id));
      setCodeError("");
      return;
    }
    const maricopa = geoids.find((g) => g.id === "AZ-COUNTY-MARICOPA");
    setGeoid(maricopa?.id || geoids[0].id);
  }, [geoids, geoid, typedUnit]);

  function applyCodeDraft(raw) {
    const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 5);
    setCodeDraft(digits);
    if (digits.length < 5) {
      setCodeError("");
      return;
    }
    const resolved = resolveCodeGeoid(digits, geography, geoids);
    if (resolved.error) {
      setCodeError(resolved.error);
      return;
    }
    setCodeError("");
    setGeoid(resolved.id);
  }

  const selectedRows = useMemo(() => rows.filter((r) => r.geoid === geoid), [rows, geoid]);
  const timeWindow = selectedRows[0]?.window || ct?.meta?.newest_window || "";

  const stocks = useMemo(() => {
    if (selectedRows.length > 0) return stockFromRows(selectedRows, states);
    // Statewide fallback from the continuous-time fit
    const fromMarginals = Object.fromEntries(
      states.map((s) => [s, Number(ct?.current_stock?.[s]) || 0]),
    );
    return { fromMarginals, matrix: null };
  }, [selectedRows, states, ct]);

  const P = ct?.P_months?.[String(horizonMonths)] ?? null;
  const canProject = Boolean(P);

  const sankey = useMemo(() => {
    if (!canProject) {
      return {
        links: [],
        outTotals: Object.fromEntries(states.map((s) => [s, 0])),
        inTotals: Object.fromEntries(states.map((s) => [s, 0])),
      };
    }
    return buildSankeyData({
      states,
      fromMarginals: stocks.fromMarginals,
      P,
    });
  }, [states, stocks, P, canProject]);

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
          p: l.p,
        };
      });

    return { width, height, leftX, rightX, nodeWidth, left, right, paths, totalFlow };
  }, [sankey, states, colors]);

  const selectedN = selectedRows[0]?.n
    ?? Object.values(stocks.fromMarginals).reduce((a, b) => a + b, 0);
  const horizonSwitchers = sankey.links.reduce((acc, l) => acc + l.value, 0);

  const tooltip = useMemo(() => {
    if (!hovered) return null;
    const outDen = sankey.outTotals[hovered.from] || 0;
    const inDen = sankey.inTotals[hovered.to] || 0;
    const stock = stocks.fromMarginals[hovered.from] || 0;
    return {
      ...hovered,
      outShare: outDen > 0 ? hovered.value / outDen : 0,
      inShare: inDen > 0 ? hovered.value / inDen : 0,
      stock,
    };
  }, [hovered, sankey, stocks]);

  return (
    <div className="sankey-wrap">
      <div className="sankey-controls">
        <label>
          Geography
          <select
            value={geography}
            onChange={(e) => {
              setCodeError("");
              setGeography(e.target.value);
            }}
          >
            {GEO_OPTIONS.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </label>
        {typedUnit ? (
          <label>
            {geography === "zcta" ? "ZCTA" : "ZIP"}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              placeholder="85001"
              value={codeDraft}
              aria-invalid={Boolean(codeError)}
              className={codeError ? "is-invalid" : undefined}
              onChange={(e) => applyCodeDraft(e.target.value)}
              onBlur={() => {
                if (codeDraft.length === 5) {
                  applyCodeDraft(codeDraft);
                  return;
                }
                if (codeDraft.length > 0) {
                  setCodeError(`Enter a 5-digit ${geography === "zcta" ? "ZCTA" : "ZIP"}.`);
                }
                if (geoid) setCodeDraft(codeFromGeoid(geoid));
              }}
            />
            {codeError ? <span className="sankey-unit-error">{codeError}</span> : null}
          </label>
        ) : (
          <label>
            Unit
            <select value={geoid} onChange={(e) => setGeoid(e.target.value)}>
              {geoids.map((g) => (
                <option key={g.id} value={g.id}>{titleFromGeoid(g.id)}</option>
              ))}
            </select>
          </label>
        )}
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
          filename={`avp-party-transitions-ct-${geography}-${geoid || "unit"}`}
          label="Download diagram"
        />
      </div>

      <div className="sankey-meta stat">
        {loading ? "Loading…" : null}
        {!loading && geoid ? `${titleFromGeoid(geoid)} · ${timeWindow || "latest"}` : null}
        {!loading && selectedN ? ` · n=${fmt(selectedN)}` : null}
      </div>

      <div className="sankey-meta">
        Expected switchers · {horizonMonths} mo: <b>{fmt1(horizonSwitchers)}</b>
      </div>

      {!canProject ? (
        <p className="note">Needs <code>ct_markov.json</code>.</p>
      ) : null}

      <div className="sankey-svgbox" ref={svgRef}>
        <svg viewBox={`0 0 ${svg.width} ${svg.height}`} role="img" aria-label="Continuous-time party transition Sankey">
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
              <title>
                {`${partyLabel(p.from)} → ${partyLabel(p.to)}: about ${fmt1(p.value)} expected switchers over ${horizonMonths} months (${pct2(p.p)})`}
              </title>
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
            style={{ left: `${Math.max(8, Math.min(tooltip.x + 14, svg.width - 260))}px`, top: `${Math.max(8, tooltip.y - 96)}px` }}
          >
            <div className="sankey-tooltip-title">{partyLabel(tooltip.from)} → {partyLabel(tooltip.to)}</div>
            <div className="sankey-tooltip-lede">
              Expected movers in {horizonMonths} month{horizonMonths === 1 ? "" : "s"}
            </div>
            <div>Expected flow: <b>{fmt1(tooltip.value)}</b> voters</div>
            <div>Transition probability: <b>{pct2(tooltip.p)}</b></div>
            <div>Among {fmt(tooltip.stock)} starting as {partyLabel(tooltip.from)}</div>
            <div>Share of leavers from {partyLabel(tooltip.from)}: <b>{pct1(tooltip.outShare)}</b></div>
            <div>Share of arrivals to {partyLabel(tooltip.to)}: <b>{pct1(tooltip.inShare)}</b></div>
          </div>
        ) : null}
      </div>

      <p className="note">MSM · projects from fitted Q · horizon = months ahead. Switchers only.</p>
    </div>
  );
}
