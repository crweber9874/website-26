"use client";

import { useCallback, useRef, useState } from "react";
import {
  downloadWatermarkedDataUrl,
} from "@/modules/avp/shared/lib/watermark-download";

/** Same-origin Plotly sandbox iframe with a watermarked PNG download. */
export default function SandboxChart({
  title,
  src,
}: {
  title: string;
  src: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onDownload = useCallback(async () => {
    setErr("");
    setBusy(true);
    try {
      const win = iframeRef.current?.contentWindow;
      const doc = iframeRef.current?.contentDocument;
      if (!win || !doc) throw new Error("Chart not loaded");

      const Plotly = (win as Window & { Plotly?: any }).Plotly;
      const plot =
        doc.querySelector(".js-plotly-plot") ||
        doc.querySelector(".plotly-graph-div") ||
        doc.querySelector("[class*='plotly']");

      if (Plotly?.toImage && plot) {
        const dataUrl = await Plotly.toImage(plot, {
          format: "png",
          width: Math.max(plot.clientWidth || 900, 900),
          height: Math.max(plot.clientHeight || 500, 500),
          scale: 2,
        });
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        await downloadWatermarkedDataUrl(dataUrl, `avp-${slug || "sandbox"}`);
        return;
      }

      // Fallback: largest canvas inside the iframe (WebGL / 3D plots).
      const canvases = [...doc.querySelectorAll("canvas")].filter(
        (c) => c.width > 0 && c.height > 0,
      );
      if (!canvases.length) throw new Error("Plot not ready yet — try again in a moment");
      canvases.sort((a, b) => b.width * b.height - a.width * a.height);
      const { stampWatermark, cloneCanvas, downloadCanvasPng } = await import(
        "@/modules/avp/shared/lib/watermark-download"
      );
      const stamped = stampWatermark(cloneCanvas(canvases[0]));
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      downloadCanvasPng(stamped, `avp-${slug || "sandbox"}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }, [title]);

  return (
    <div className="sandbox-chart">
      <div className="sandbox-chart-bar">
        <span className="sandbox-chart-title">{title}</span>
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="sandbox-chart-download"
        >
          {busy ? "Preparing…" : "Download PNG"}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        loading="lazy"
        className="sandbox-chart-frame"
      />
      {err && <p className="sandbox-chart-error">{err}</p>}
    </div>
  );
}
