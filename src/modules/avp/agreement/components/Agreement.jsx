"use client";
import { useMemo, useRef, useState } from "react";
import { OverlapDensity } from "./AgreementCharts";
import { measureSortKey } from "../lib/measure-config";
import { PARTY, UA } from "@/modules/avp/shared/lib/colors";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import DownloadGraphic from "@/components/react/DownloadGraphic";

// Module 4 · Common Ground in Arizona Politics — an analysis tool over the
// attitude-overlap artifact: pick a way of dividing Arizonans (party, race,
// religion, demographics) and see, measure by measure, how much the two groups'
// opinion distributions actually overlap (the OVL coefficient).

const pct = (x) => `${Math.round(x * 100)}%`;

// group A / B colors: party keeps the DEM/REP convention; every other split is
// a neutral two-hue pair so we never imply partisanship where there is none.
function colorsFor(dimension) {
  if (dimension === "party") return [PARTY.dem, PARTY.rep];
  return [UA.azurite, UA.oasis];
}

export default function Agreement({ rows, densityByKey, meta, copy }) {
  // dimensions in first-seen order; measures ranked by overlap within a dimension
  const dims = useMemo(() => {
    const seen = new Map();
    for (const r of rows)
      if (!seen.has(r.dimension))
        seen.set(r.dimension, { id: r.dimension, label: r.dimension_label,
          cat_a: r.cat_a, cat_b: r.cat_b });
    return [...seen.values()];
  }, [rows]);

  const [dim, setDim] = useState(dims[0]?.id ?? "party");
  const dimMeta = dims.find((d) => d.id === dim);
  const [colorA, colorB] = colorsFor(dim);

  const ranked = useMemo(
    () => rows
      .filter((r) => r.dimension === dim)
      .sort((a, b) => measureSortKey(a.measure) - measureSortKey(b.measure)),
    [rows, dim],
  );

  // default-select the LEAST-overlapping measure — the one place the two groups
  // actually part ways — so the tool leads with the interesting contrast.
  const [measure, setMeasure] = useState(null);
  const leastOverlap = useMemo(
    () => (ranked.length
      ? ranked.reduce((min, r) => (r.ovl < min.ovl ? r : min), ranked[0])
      : null),
    [ranked],
  );
  const selected =
    ranked.find((r) => r.measure === measure) ?? leastOverlap;

  const avg = ranked.length
    ? ranked.reduce((s, r) => s + r.ovl, 0) / ranked.length : 0;
  const most = useMemo(
    () => (ranked.length
      ? ranked.reduce((max, r) => (r.ovl > max.ovl ? r : max), ranked[0])
      : null),
    [ranked],
  );
  const least = leastOverlap;
  const dens = selected ? densityByKey[`${dim}::${selected.measure}`] : null;
  const chartRef = useRef(null);

  return (
    <div className="ag-wrap">
      {/* dimension selector ------------------------------------------------ */}
      <div className="ag-dims" role="tablist" aria-label="Compare across">
        {dims.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={d.id === dim}
            className={`ag-dim${d.id === dim ? " is-active" : ""}`}
            onClick={() => { setDim(d.id); setMeasure(null); }}
          >
            <span className="ag-dim-label">{d.label}</span>
            <span className="ag-dim-cats">{d.cat_a} · {d.cat_b}</span>
          </button>
        ))}
      </div>

      {/* headline ---------------------------------------------------------- */}
      <div className="ag-headline">
        <div className="ag-big">
          <span className="ag-big-num" style={{ color: avg < 0.5 ? UA.azred : UA.azurite }}>
            {pct(avg)}
          </span>
          <span className="ag-big-cap">
            <ContentHtml
              html={copy.avgCaption
                .replace("{catA}", dimMeta?.cat_a ?? "")
                .replace("{catB}", dimMeta?.cat_b ?? "")
                .replace("{count}", ranked.length)}
            />
          </span>
        </div>
        <p className="ag-lede">
          <ContentHtml
            html={copy.lede
              .replace("{mostLabel}", most?.label ?? "")
              .replace("{mostPct}", most ? pct(most.ovl) : "")
              .replace("{leastLabel}", least?.label ?? "")
              .replace("{leastPct}", least ? pct(least.ovl) : "")}
          />
        </p>
      </div>

      <div className="ag-grid">
        {/* ranking ------------------------------------------------------- */}
        <div className="ag-rank">
          <div className="ag-rank-head">{copy.rankHead}</div>
          {ranked.map((r) => {
            const on = r.measure === selected?.measure;
            return (
              <button
                key={r.measure}
                className={`ag-row${on ? " is-active" : ""}`}
                onClick={() => setMeasure(r.measure)}
              >
                <span className="ag-row-label">{r.label}</span>
                <span className="ag-meter">
                  <span
                    className="ag-meter-fill"
                    style={{
                      width: `${r.ovl_pct}%`,
                      background: r.ovl < 0.5 ? UA.azred : UA.oasis,
                    }}
                  />
                </span>
                <span className="ag-row-pct">{r.ovl_pct}%</span>
              </button>
            );
          })}
        </div>

        {/* selected-measure overlap picture ------------------------------ */}
        <div className="ag-detail">
          {selected && (
            <>
              <div className="ag-detail-head">
                <span className="op-eyebrow">{selected.label}</span>
                <h3>
                  {selected.ovl_pct}% overlap ·{" "}
                  {selected.ovl >= 0.7 ? copy.overlapBroad
                    : selected.ovl >= 0.45 ? copy.overlapPartial
                    : copy.overlapLow}
                </h3>
              </div>
              <div className="ag-legend" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span><i style={{ background: colorA }} /> {selected.cat_a}</span>
                  <span><i style={{ background: colorB }} /> {selected.cat_b}</span>
                  <span><i style={{ background: "rgba(12,35,75,0.34)" }} /> {copy.sharedLegend}</span>
                </div>
                <DownloadGraphic
                  targetRef={chartRef}
                  filename={`avp-common-ground-${dim}-${selected.measure}`}
                  label="Download chart"
                />
              </div>
              <div ref={chartRef}>
                <OverlapDensity row={selected} dens={dens} colorA={colorA} colorB={colorB} />
              </div>
              <p className="ag-read">
                {selected.share_a_high != null && selected.share_b_high != null ? (
                  <ContentHtml
                    html={copy.readHigh
                      .replace("{shareA}", pct(selected.share_a_high))
                      .replace("{shareB}", pct(selected.share_b_high))
                      .replace("{catA}", selected.cat_a)
                      .replace("{catB}", selected.cat_b)
                      .replace("{highLabel}", selected.high_label)
                      .replace("{ovlPct}", selected.ovl_pct)}
                  />
                ) : (
                  <ContentHtml html={copy.read.replace("{ovlPct}", selected.ovl_pct)} />
                )}
                <span className="ag-n">
                  {" "}
                  <ContentHtml
                    html={copy.n
                      .replace("{nA}", selected.n_a.toLocaleString())
                      .replace("{catA}", selected.cat_a)
                      .replace("{nB}", selected.n_b.toLocaleString())
                      .replace("{catB}", selected.cat_b)}
                  />
                </span>
              </p>
            </>
          )}
        </div>
      </div>

      <footer className="op-foot">
        <ContentHtml html={copy.footer} />
      </footer>
    </div>
  );
}
