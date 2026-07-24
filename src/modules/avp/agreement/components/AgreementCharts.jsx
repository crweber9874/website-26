"use client";
import {
  Chart as ChartJS, BarElement, LineElement, PointElement,
  LinearScale, CategoryScale, Filler, Tooltip,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(
  BarElement, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip,
);

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const xAxisScale = {
  grid: { display: false },
  ticks: {
    maxTicksLimit: 8,
    font: { size: 12, weight: "600" },
    color: "#0C234B",
  },
  title: {
    display: true,
    font: { size: 13, weight: "700" },
    color: "#0C234B",
    padding: { top: 8 },
  },
};

function catLabel(row, v) {
  if (row.scale_type !== "discrete") return String(v);
  if (row.scale_max <= 5 && row.scale_min >= 1) {
    const ord = ["", "Low", "2", "Mid", "4", "High"];
    return ord[Math.round(v)] ?? String(v);
  }
  return `Level ${v}`;
}

// Overlap picture: KDE curves for continuous scales, grouped bars for discrete.
export function OverlapDensity({ row, dens, colorA, colorB }) {
  if (!dens) return <div className="op-canvas" />;

  if (row.scale_type === "discrete" || dens.scale_type === "discrete") {
    const grid = dens.grid ?? [];
    const a = dens.dens_a ?? [];
    const b = dens.dens_b ?? [];
    const mins = a.map((v, i) => Math.min(v, b[i] ?? 0));
    const labels = grid.map((v) => catLabel(row, v));
    const data = {
      labels,
      datasets: [
        { label: row.cat_a, data: a, backgroundColor: rgba(colorA, 0.55), borderWidth: 0, order: 3 },
        { label: row.cat_b, data: b, backgroundColor: rgba(colorB, 0.55), borderWidth: 0, order: 3 },
        { label: "Common ground", data: mins, backgroundColor: rgba("#0C234B", 0.34), borderWidth: 0, order: 1 },
      ],
    };
    const opts = {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: chartTooltip({
          filter: (c) => c.dataset.label !== "Common ground",
          callbacks: {
            title: (items) => `${row.label} · response level ${items[0].label}`,
            label: (c) => `${c.dataset.label}: estimated share of respondents at this level`,
          },
        }),
      },
      scales: {
        x: {
          ...xAxisScale,
          title: {
            ...xAxisScale.title,
            text: `${row.low_label} ←  ${row.label}  → ${row.high_label}`,
          },
        },
        y: { display: false, beginAtZero: true, stacked: false },
      },
    };
    return <div className="op-canvas"><Bar data={data} options={opts} /></div>;
  }

  const { grid, dens_a, dens_b } = dens;
  const mins = dens_a.map((v, i) => Math.min(v, dens_b[i]));
  const fmt = (x) =>
    row.scale_max <= 1 ? x.toFixed(2) : row.scale_max <= 5 ? x.toFixed(1) : Math.round(x);

  const data = {
    labels: grid.map(fmt),
    datasets: [
      {
        label: row.cat_a, data: dens_a, borderColor: colorA,
        backgroundColor: rgba(colorA, 0.14), borderWidth: 2, fill: "origin",
        pointRadius: 0, tension: 0.4, order: 3,
      },
      {
        label: row.cat_b, data: dens_b, borderColor: colorB,
        backgroundColor: rgba(colorB, 0.14), borderWidth: 2, fill: "origin",
        pointRadius: 0, tension: 0.4, order: 3,
      },
      {
        label: "Common ground", data: mins, borderColor: "transparent",
        backgroundColor: rgba("#0C234B", 0.34), borderWidth: 0, fill: "origin",
        pointRadius: 0, tension: 0.4, order: 1,
      },
    ],
  };
  const opts = {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: chartTooltip({
        filter: (c) => c.dataset.label !== "Common ground",
        callbacks: {
          title: (items) => `${row.label} · score ${items[0].label}`,
          label: (c) => `${c.dataset.label}: estimated share of respondents at this score`,
        },
      }),
    },
    scales: {
      x: {
        ...xAxisScale,
        ticks: { ...xAxisScale.ticks, maxTicksLimit: 6 },
        title: {
          ...xAxisScale.title,
          text: `${row.low_label} ←  ${row.label}  → ${row.high_label}`,
        },
      },
      y: { display: false, beginAtZero: true },
    },
  };
  return <div className="op-canvas"><Line data={data} options={opts} /></div>;
}
