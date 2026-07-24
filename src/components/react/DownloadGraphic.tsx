"use client";

import { useCallback, useState } from "react";
import {
  AVP_WATERMARK,
  downloadWatermarkedGraphic,
} from "@/modules/avp/shared/lib/watermark-download";

/**
 * Download button that captures the nearest graphic inside `targetRef`
 * (or a CSS selector) and stamps an Arizona Voter Project watermark.
 *
 * @param {{
 *   targetRef?: React.RefObject<HTMLElement | null>;
 *   selector?: string;
 *   filename?: string;
 *   className?: string;
 *   label?: string;
 * }} props
 */
export default function DownloadGraphic({
  targetRef,
  selector,
  filename = "avp-graphic",
  className = "avp-dl-btn",
  label = "Download PNG",
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onClick = useCallback(async () => {
    setErr("");
    setBusy(true);
    try {
      const root =
        targetRef?.current ??
        (selector ? document.querySelector(selector) : null);
      if (!root) throw new Error("Graphic not ready");
      await downloadWatermarkedGraphic(root, filename);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }, [targetRef, selector, filename]);

  return (
    <span className="avp-dl">
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={busy}
        title={`Downloads with “${AVP_WATERMARK}” watermark`}
      >
        {busy ? "Preparing…" : label}
      </button>
      {err && <span className="avp-dl-err">{err}</span>}
    </span>
  );
}
