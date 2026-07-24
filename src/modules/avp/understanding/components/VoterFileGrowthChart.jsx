"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { UA } from "@/modules/avp/shared/lib/colors";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const fmt = (n) => Math.round(n).toLocaleString("en-US");

export default function VoterFileGrowthChart({ waves, buildDate }) {
  const { data, options } = useMemo(() => {
    const labels = waves.map((w) => w.file_date.slice(0, 7));
    const values = waves.map((w) => w.total_active);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      data: {
        labels,
        datasets: [{
          label: "Rows on the file",
          data: values,
          borderColor: UA.azblue,
          backgroundColor: "rgba(12, 35, 75, 0.08)",
          fill: true,
          tension: 0.22,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: chartTooltip({
            callbacks: {
              title: (items) => {
                const w = waves[items[0]?.dataIndex];
                return w ? `Monthly voter-file build · ${w.file_date}` : "";
              },
              label: (ctx) => `${fmt(ctx.parsed.y)} active registrations on the file at this build`,
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
            min: min * 0.98,
            max: max * 1.01,
            ticks: {
              callback: (v) => `${(v / 1e6).toFixed(1)}M`,
              font: { size: 10, family: "IBM Plex Mono, monospace" },
              color: "#7a8794",
            },
            grid: { color: "rgba(12, 35, 75, 0.06)" },
          },
        },
      },
    };
  }, [waves]);

  return (
    <figure className="vf-growth">
      <figcaption>
        Rows on the file by monthly build
        <span className="vf-growth-date">Latest: {buildDate}</span>
      </figcaption>
      <div className="vf-growth-canvas">
        <Line data={data} options={options} />
      </div>
    </figure>
  );
}
