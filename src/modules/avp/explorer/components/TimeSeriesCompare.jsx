"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  filterValidWaves,
  WAVE_VARIABLES,
  waveSeries,
  waveVarMeta,
  GEO_HISTORY_BASE,
} from "@/modules/avp/shared/lib/waves";
import { formatValue } from "@/modules/avp/shared/lib/variables";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const DEFAULT_KEYS = ["total_active", "party_share_dem", "party_share_rep"];
const UNIT_GROUPS = ["share", "count"];

function unitName(geoid, geo) {
  if (!geoid) return "Arizona statewide";
  const tail = geoid.replace(/^AZ-[A-Z]+-/, "");
  if (geo === "county") return `${tail.charAt(0) + tail.slice(1).toLowerCase()} County`;
  if (geo === "cd") return `CD ${Number(tail)}`;
  if (geo === "ld") return `LD ${Number(tail)}`;
  if (geo === "zcta" || geo === "zip") return `ZIP ${tail}`;
  return tail;
}

function countTick(v) {
  const n = Math.abs(v);
  if (n >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return Math.round(v).toLocaleString("en-US");
}

function buildChartOptions({ waves, unit, vars }) {
  const values = vars.flatMap((v) => waveSeries(waves, v.key).map((p) => p.value));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: vars.length > 1,
        position: "bottom",
        labels: { boxWidth: 10, boxHeight: 10, padding: 14, font: { size: 11 } },
      },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => {
            const w = waves[items[0]?.dataIndex];
            return w ? `Monthly voter-file build · ${w.file_date}` : "";
          },
          label: (ctx) => {
            const meta = waveVarMeta(ctx.dataset.variable);
            return `${meta?.label ?? ctx.dataset.label}: ${formatValue(ctx.parsed.y, unit)}`;
          },
        },
      }),
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: 8,
          font: { size: 10, family: "IBM Plex Mono, monospace" },
          color: "#7a8794",
        },
      },
      y: {
        min: unit === "share" ? Math.max(0, min - (max - min) * 0.08) : min * (min >= 0 ? 0.92 : 1.08),
        max: unit === "share" ? Math.min(1, max + (max - min) * 0.08) : max * 1.04,
        ticks: {
          callback: (v) => (unit === "share" ? `${(v * 100).toFixed(0)}%` : countTick(v)),
          font: { size: 10, family: "IBM Plex Mono, monospace" },
          color: "#7a8794",
        },
        grid: { color: "rgba(12, 35, 75, 0.06)" },
      },
    },
  };
}

function WaveChart({ waves, vars, unit }) {
  const labels = useMemo(() => filterValidWaves(waves).map((w) => w.file_date.slice(0, 7)), [waves]);
  const validWaves = useMemo(() => filterValidWaves(waves), [waves]);

  const data = useMemo(() => ({
    labels,
    datasets: vars.map((v) => ({
      label: v.label,
      variable: v.key,
      data: waveSeries(waves, v.key).map((p) => p.value),
      borderColor: v.color,
      backgroundColor: "transparent",
      tension: 0.22,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
    })),
  }), [waves, vars, labels]);

  const options = useMemo(
    () => buildChartOptions({ waves: validWaves, unit, vars }),
    [validWaves, unit, vars],
  );

  if (!vars.length) return null;

  return (
    <div className="ts-compare-canvas">
      <Line data={data} options={options} />
    </div>
  );
}

export default function TimeSeriesCompare({
  waves: wavesProp,
  geo,
  selectedGeoid,
  buildDate,
  compact = false,
}) {
  const [waves, setWaves] = useState(() => filterValidWaves(wavesProp ?? []));
  const [selected, setSelected] = useState(DEFAULT_KEYS);
  const [geoHistoryReady, setGeoHistoryReady] = useState(false);

  useEffect(() => {
    if (wavesProp?.length) {
      setWaves(filterValidWaves(wavesProp));
      return;
    }
    let cancelled = false;
    fetch(publicUrl("data/party/transition_analysis.json"))
      .then((r) => r.json())
      .then((data) => !cancelled && setWaves(filterValidWaves(data.waves)))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [wavesProp]);

  // Scaffold: load per-geography multi-wave summaries when published.
  useEffect(() => {
    if (!selectedGeoid || !geo) {
      setGeoHistoryReady(false);
      return;
    }
    let cancelled = false;
    const path = `${GEO_HISTORY_BASE}/${geo}/${selectedGeoid.replace(/^AZ-[A-Z]+-/, "")}.json`;
    fetch(publicUrl(path))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setGeoHistoryReady(Boolean(data?.waves?.length));
      })
      .catch(() => !cancelled && setGeoHistoryReady(false));
    return () => { cancelled = true; };
  }, [geo, selectedGeoid]);

  const toggle = (key) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.length > 1 ? prev.filter((k) => k !== key) : prev;
      return [...prev, key];
    });
  };

  const grouped = useMemo(() => {
    const chosen = WAVE_VARIABLES.filter((v) => selected.includes(v.key));
    return UNIT_GROUPS.map((unit) => ({
      unit,
      vars: chosen.filter((v) => v.unit === unit),
    })).filter((g) => g.vars.length);
  }, [selected]);

  const scope = unitName(selectedGeoid, geo);
  const latestDate = buildDate ?? waves[waves.length - 1]?.file_date ?? "";

  if (!waves.length) return null;

  return (
    <div className={`panel ts-compare${compact ? " ts-compare-compact" : ""}`} style={{ marginTop: compact ? 0 : 12 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Compare over time · {scope}
      </div>
      <p className="note" style={{ marginBottom: 12, lineHeight: 1.5 }}>
        {geoHistoryReady
          ? `Trends for ${scope} across ${waves.length} monthly file builds. Select characteristics below.`
          : selectedGeoid
            ? `Statewide trends across ${waves.length} monthly builds. Per-area time series for ${scope} will appear when multi-wave summary data is published.`
            : `Statewide trends across ${waves.length} monthly voter-file builds. Select characteristics to compare.`}
      </p>

      <div className="ts-compare-picker">
        {WAVE_VARIABLES.map((v) => (
          <button
            key={v.key}
            type="button"
            className="varbtn"
            aria-pressed={selected.includes(v.key)}
            onClick={() => toggle(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {grouped.map(({ unit, vars }) => (
        <figure key={unit} className="vf-growth" style={{ marginTop: 14 }}>
          <figcaption>
            {unit === "share" ? "Shares across builds" : "Counts across builds"}
            {latestDate && <span className="vf-growth-date">Latest: {latestDate}</span>}
          </figcaption>
          <WaveChart waves={waves} vars={vars} unit={unit} />
        </figure>
      ))}

      {!geoHistoryReady && (
        <p className="note" style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5 }}>
          Geographic drill-down requires per-build summary files at{" "}
          <code>{GEO_HISTORY_BASE}/&lt;geo&gt;/&lt;unit-id&gt;.json</code> (one row per
          variable per build). Current public data ships the latest build only.
        </p>
      )}
    </div>
  );
}
