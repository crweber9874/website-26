"use client";
import {
  Chart as ChartJS, BarElement, LineElement, PointElement,
  LinearScale, CategoryScale, RadialLinearScale, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";
import { PARTY, UA } from "@/modules/avp/shared/lib/colors";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(
  BarElement, LineElement, PointElement, LinearScale, CategoryScale,
  RadialLinearScale, Tooltip, Legend, Filler,
);

// party -> UA brand color; Independents get a neutral grey.
const PC = { Dem: PARTY.dem, Ind: "#9AA7B1", Rep: PARTY.rep, Overall: UA.azurite };
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const PARTIES = ["Dem", "Ind", "Rep"];
const one = (n) => Number(n).toFixed(1);

// --- 1. Affective polarization: grouped bars, measure x party --------------
// Feeling-thermometer outcomes (0-100). Shows the in-warm / out-neg / affpol
// triad by party — the core affective-polarization picture.
export function AffectChart({ rows }) {
  const measures = [
    { key: "affpol", label: "Affective\npolarization" },
    { key: "inwarm", label: "In-party\nwarmth" },
    { key: "outneg", label: "Out-party\nnegativity" },
  ];
  const byPM = (m, p) =>
    rows.find((r) => r.measure === m && r.party === p)?.value ?? null;
  const data = {
    labels: measures.map((m) => m.label.split("\n")),
    datasets: PARTIES.map((p) => ({
      label: p === "Dem" ? "Democrats" : p === "Rep" ? "Republicans" : "Independents",
      data: measures.map((m) => byPM(m.key, p)),
      backgroundColor: rgba(PC[p], 0.85),
      borderColor: PC[p], borderWidth: 1, borderRadius: 3,
      maxBarThickness: 46,
    })),
  };
  const opts = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 12 } },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => measures[items[0].dataIndex]?.label.replace("\n", " ") ?? "",
          label: (c) => `${c.dataset.label} average: ${one(c.parsed.y)} on a 0–100 feeling thermometer`,
        },
      }),
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { min: 0, max: 100, title: { display: true, text: "0–100 scale", font: { size: 10 } },
           ticks: { font: { size: 10 } } },
    },
  };
  return <div className="op-canvas"><Bar data={data} options={opts} /></div>;
}

// --- 2. Least-liked groups: horizontal thematic bars -----------------------
// Share of wave-2 respondents naming each group as their least-liked
// (Sullivan/Marcus content-controlled tolerance measure).
export function LeastLikedChart({ rows, top = 12 }) {
  const items = [...rows].sort((a, b) => b.count - a.count).slice(0, top);
  // color extremist / fringe groups vs. partisan groups vs. other by hue family.
  const rep = /MAGA|Christian Nationalist|Supremacist|Klan|Fascist|Conservative|Republican|Anti-abortion/i;
  const dem = /Communist|Socialist|Marxist|Liberal|Democrat|BLM|Pro-abortion|LGBT/i;
  const hue = (g) => (rep.test(g) ? PARTY.rep : dem.test(g) ? PARTY.dem : UA.oasis);
  const data = {
    labels: items.map((d) => d.group),
    datasets: [{
      label: "Share naming as least-liked",
      data: items.map((d) => +(d.share * 100).toFixed(1)),
      backgroundColor: items.map((d) => rgba(hue(d.group), 0.82)),
      borderColor: items.map((d) => hue(d.group)),
      borderWidth: 1, borderRadius: 3,
    }],
  };
  const opts = {
    indexAxis: "y", maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => items[0].label,
          label: (c) => {
            const row = items[c.dataIndex];
            return `${one(c.parsed.x)}% of Arizona survey respondents named this group as their least-liked (${row.count} of ${row.n_base})`;
          },
        },
      }),
    },
    scales: {
      x: { min: 0, title: { display: true, text: "% of respondents", font: { size: 10 } },
           ticks: { font: { size: 10 }, callback: (v) => v + "%" } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };
  return <div className="op-canvas op-tall"><Bar data={data} options={opts} /></div>;
}

// --- 3. Radar: partisan profile across all attitude dimensions -------------
// Every measure rescaled to 0-100 so the six axes are comparable; one polygon
// per party. This is the multi-dimensional "who holds which attitudes" view.
export function ProfileRadar({ rows }) {
  const axes = [...new Set(rows.map((r) => r.measure))];
  const labelOf = Object.fromEntries(rows.map((r) => [r.measure, r.label]));
  const val = (m, p) => rows.find((r) => r.measure === m && r.party === p)?.value_pct ?? null;
  const data = {
    labels: axes.map((m) => labelOf[m]),
    datasets: PARTIES.map((p) => ({
      label: p === "Dem" ? "Democrats" : p === "Rep" ? "Republicans" : "Independents",
      data: axes.map((m) => val(m, p)),
      backgroundColor: rgba(PC[p], 0.12),
      borderColor: PC[p], borderWidth: 2,
      pointBackgroundColor: PC[p], pointRadius: 3,
    })),
  };
  const opts = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 12 } },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => labelOf[axes[items[0].dataIndex]] ?? items[0].label,
          label: (c) => `${c.dataset.label} average: ${one(c.parsed.r)} on a 0–100 rescaled scale`,
        },
      }),
    },
    scales: {
      r: {
        min: 0, max: 100, beginAtZero: true,
        ticks: { stepSize: 25, font: { size: 9 }, backdropColor: "transparent" },
        pointLabels: { font: { size: 11 } },
        grid: { color: "rgba(0,0,0,0.08)" }, angleLines: { color: "rgba(0,0,0,0.08)" },
      },
    },
  };
  return <div className="op-canvas op-square"><Radar data={data} options={opts} /></div>;
}

// --- 4. Perception gap: perceived vs actual out-party warmth ---------------
// Paired bars per party: what respondents THINK the out-party feels toward
// their side vs. the out-party's ACTUAL mean thermometer toward that side.
export function PerceptionGap({ rows }) {
  const parties = rows.map((r) => (r.party === "Dem" ? "Democrats" : "Republicans"));
  const data = {
    labels: parties,
    datasets: [
      {
        label: "Perceived out-party warmth", data: rows.map((r) => r.perceived_warmth),
        backgroundColor: rgba(UA.oasis, 0.85), borderColor: UA.oasis,
        borderWidth: 1, borderRadius: 3, maxBarThickness: 54,
      },
      {
        label: "Actual out-party warmth", data: rows.map((r) => r.actual_warmth),
        backgroundColor: rgba(UA.azblue, 0.85), borderColor: UA.azblue,
        borderWidth: 1, borderRadius: 3, maxBarThickness: 54,
      },
    ],
  };
  const opts = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 12 } },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => `${parties[items[0].dataIndex]} · ${items[0].dataset.label}`,
          label: (c) => `${one(c.parsed.y)} on a 0–100 feeling thermometer`,
        },
      }),
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
      y: { min: 0, max: 100, title: { display: true, text: "warmth (0–100)", font: { size: 10 } },
           ticks: { font: { size: 10 } } },
    },
  };
  return <div className="op-canvas"><Bar data={data} options={opts} /></div>;
}
