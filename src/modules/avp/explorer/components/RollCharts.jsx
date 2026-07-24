"use client";
import {
  Chart as ChartJS, ArcElement, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(ArcElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const pct = (n, tot) => (tot ? `${((n / tot) * 100).toFixed(1)}%` : "—");

// Doughnut of the on-file statuses at the latest build.
export function StatusDonut({ latest }) {
  const onRolls = latest.active + latest.inactive;
  const data = {
    labels: ["Active", "Inactive", "Canceled (removed)"],
    datasets: [{
      data: [latest.active, latest.inactive, latest.canceled],
      backgroundColor: ["#378DBD", "#E0A800", "#9AA7B1"],
      borderColor: "#fff", borderWidth: 2,
    }],
  };
  const opts = {
    maintainAspectRatio: false, cutout: "58%",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
      tooltip: chartTooltip({
        callbacks: {
          label: (c) => {
            const total = latest.active + latest.inactive + latest.canceled;
            return `${c.label}: ${fmt(c.parsed)} registrations (${pct(c.parsed, total)} of all records)`;
          },
        },
      }),
    },
  };
  return (
    <div className="rolldonut">
      <div className="rolldonut-canvas"><Doughnut data={data} options={opts} /></div>
      <div className="rolldonut-note">
        <b>{fmt(onRolls)}</b> registrations on the rolls — <b>{fmt(latest.active)}</b> active,{" "}
        <b>{fmt(latest.inactive)}</b> inactive. Canceled records are removed from the rolls.
      </div>
    </div>
  );
}

// Inactive registrations at each build (a valid stock per snapshot).
export function BuildsChart({ series }) {
  const labels = series.map((s) => s.date.slice(0, 4) + (s.code.includes("GENERAL") ? " Gen" : s.code.includes("PRIMARY") ? " Pri" : " PP"));
  const data = {
    labels,
    datasets: [
      {
        label: "Inactive", data: series.map((s) => s.inactive),
        borderColor: "#E0A800", backgroundColor: "rgba(224,168,0,0.14)",
        fill: true, tension: 0.3, pointRadius: 3, borderWidth: 2,
      },
      {
        label: "Active", data: series.map((s) => s.active),
        borderColor: "#378DBD", backgroundColor: "transparent",
        fill: false, tension: 0.3, pointRadius: 2, borderWidth: 1.5, borderDash: [4, 4],
      },
    ],
  };
  const opts = {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 }, padding: 10 } },
      tooltip: chartTooltip({
        callbacks: {
          title: (items) => `Voter-file build · ${series[items[0]?.dataIndex]?.date ?? items[0].label}`,
          label: (c) => `${c.dataset.label} registrations on the file: ${fmt(c.parsed.y)}`,
        },
      }),
    },
    scales: {
      x: { ticks: { maxRotation: 60, minRotation: 60, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { callback: (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}k`) } },
    },
  };
  return <div className="buildschart"><Line data={data} options={opts} /></div>;
}
