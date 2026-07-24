"use client";
import { useState } from "react";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { AffectChart, ProfileRadar, PerceptionGap } from "./OpinionCharts";

// Module 3 · Public Opinion. Presentational: receives the pre-aggregated,
// disclosure-safe artifacts (built by pipeline/r/extract_m3_survey.R) and lays
// them out as themed sections. No data logic beyond small lookups + filters.
export default function Opinion({ opinion, radar, gap, meta, copy }) {
  const affect = opinion.filter((r) => r.theme === "affective_polarization");
  const norms = opinion.filter((r) => r.theme === "democratic_norms");
  const metacog = opinion.filter((r) => r.theme === "metacognition");
  const issueThemes = ["policy", "economy", "elections", "civic_trust"];
  const policyRows = opinion.filter((r) => issueThemes.includes(r.theme));
  const thermRows = opinion.filter((r) => r.theme === "thermometers");

  // Agreement: on the 0-100 rescaled metric, how far apart are Dem & Rep means?
  // small gap = common ground. One entry per measure with both party means.
  const agree = (() => {
    const by = {};
    for (const r of opinion) {
      if (r.value_pct == null) continue;
      (by[r.measure] ??= { label: r.label }).label = r.label;
      by[r.measure][r.party] = r.value_pct;
    }
    return Object.entries(by)
      .filter(([, v]) => v.Dem != null && v.Rep != null)
      .map(([m, v]) => ({ measure: m, label: v.label, dem: v.Dem, rep: v.Rep, gap: Math.abs(v.Dem - v.Rep) }))
      .sort((a, b) => a.gap - b.gap);
  })();

  return (
    <div className="op-wrap">
      {/* How to read the scales -------------------------------------------- */}
      <div className="card" style={{ borderLeft: "3px solid var(--oasis, #378DBD)", marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{copy.scales.eyebrow}</div>
        <p className="note" style={{ lineHeight: 1.55, margin: 0 }}>
          <ContentHtml html={copy.scales.body} />
        </p>
      </div>

      <nav style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", gap: 8, flexWrap: "wrap",
                    padding: "10px 0", margin: "4px 0 8px", background: "var(--bg,#fff)", borderBottom: "1px solid #e3e9ee" }}>
        <span className="gl" style={{ alignSelf: "center", marginRight: 4 }}>Jump to</span>
        {copy.scales.json.nav.map(([id, l]) => (
          <a key={id} href={`#${id}`} className="varbtn" style={{ textDecoration: "none" }}>{l}</a>
        ))}
      </nav>

      <section id="affect" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.affect.eyebrow}</span>
          <h2>{copy.affect.title}</h2>
          <p><ContentHtml html={copy.affect.body} /></p>
        </div>
        <AffectChart rows={affect} />
      </section>

      <section id="radar" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.radar.eyebrow}</span>
          <h2>{copy.radar.title}</h2>
          <p><ContentHtml html={copy.radar.body} /></p>
        </div>
        <InteractiveRadar radar={radar} pickHint={copy.radar.pickHint} />
      </section>

      <section id="norms" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.norms.eyebrow}</span>
          <h2>{copy.norms.title}</h2>
          <p><ContentHtml html={copy.norms.body} /></p>
        </div>
        <NormsTable rows={norms} />
      </section>

      <section id="issues" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.issues.eyebrow}</span>
          <h2>{copy.issues.title}</h2>
          <p><ContentHtml html={copy.issues.body} /></p>
        </div>
        <NormsTable rows={policyRows} />
      </section>

      <section id="feelings" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.feelings.eyebrow}</span>
          <h2>{copy.feelings.title}</h2>
          <p><ContentHtml html={copy.feelings.body} /></p>
        </div>
        <NormsTable rows={thermRows} />
      </section>

      <section id="metacog" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.metacog.eyebrow}</span>
          <h2><ContentHtml html={copy.metacog.title} /></h2>
          <p><ContentHtml html={copy.metacog.body} /></p>
        </div>
        {metacog.length > 0 && <NormsTable rows={metacog} />}
        <div style={{ marginTop: 14 }}>
          <PerceptionGap rows={gap} />
        </div>
      </section>

      <section id="agree" className="op-section" style={{ scrollMarginTop: 60 }}>
        <div className="op-head">
          <span className="op-eyebrow">{copy.agree.eyebrow}</span>
          <h2>{copy.agree.title}</h2>
          <p><ContentHtml html={copy.agree.body} /></p>
        </div>
        <AgreeBars rows={agree} legend={copy.agree.agreeLegend} />
      </section>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{copy.about.eyebrow}</div>
        <p className="note" style={{ lineHeight: 1.55, margin: 0 }}>
          <ContentHtml html={copy.about.body} />
        </p>
        <p className="note" style={{ marginTop: 8 }}>
          <ContentHtml html={copy.about.followup} />
        </p>
      </div>
      <footer className="op-foot">{copy.about.footer}</footer>
    </div>
  );
}

// Radar with a measure picker: tick which 0-100 axes to plot.
function InteractiveRadar({ radar, pickHint }) {
  const all = [...new Map(radar.map((r) => [r.measure, r.label])).entries()];
  const DEFAULT = ["affpol", "inwarm", "outneg", "tolerance", "dem_norms"];
  const [sel, setSel] = useState(
    () => new Set(DEFAULT.filter((m) => all.some(([k]) => k === m))),
  );
  const toggle = (m) =>
    setSel((s) => { const n = new Set(s); n.has(m) ? n.delete(m) : n.add(m); return n; });
  const rows = radar.filter((r) => sel.has(r.measure));
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: 12 }}>
        {all.map(([m, label]) => (
          <label key={m} style={{ fontSize: 12, display: "flex", gap: 5, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={sel.has(m)} onChange={() => toggle(m)} />
            {label}
          </label>
        ))}
      </div>
      {sel.size >= 3
        ? <ProfileRadar rows={rows} />
        : <p className="note">{pickHint}</p>}
    </>
  );
}

// Agreement dumbbells: each measure on a 0-100 track with a Dem and Rep marker;
// the connecting bar's length is the partisan gap. Sorted so common ground is up top.
function AgreeBars({ rows, legend }) {
  const DEM = "#0C234B", REP = "#AB0520";
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {rows.map((r) => {
        const lo = Math.min(r.dem, r.rep), hi = Math.max(r.dem, r.rep);
        return (
          <div key={r.measure} style={{ display: "grid", gridTemplateColumns: "minmax(140px,220px) 1fr 46px", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12.5 }}>{r.label}</span>
            <div style={{ position: "relative", height: 16, background: "#eef2f5", borderRadius: 8 }}>
              <div style={{ position: "absolute", left: `${lo}%`, width: `${hi - lo}%`, top: 6, height: 4, background: "#c3ccd4" }} />
              <span
                className="agree-dot"
                title={`Democrats average ${r.dem.toFixed(0)} on a 0–100 scale for “${r.label}”`}
                style={{ position: "absolute", left: `calc(${r.dem}% - 5px)`, top: 3, width: 10, height: 10, borderRadius: "50%", background: DEM }}
              />
              <span
                className="agree-dot"
                title={`Republicans average ${r.rep.toFixed(0)} on a 0–100 scale for “${r.label}”`}
                style={{ position: "absolute", left: `calc(${r.rep}% - 5px)`, top: 3, width: 10, height: 10, borderRadius: "50%", background: REP }}
              />
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, textAlign: "right", color: r.gap < 15 ? "#2E7D32" : r.gap > 45 ? "#AB0520" : "#5a5346" }}>
              {r.gap.toFixed(0)}
            </span>
          </div>
        );
      })}
      <div className="note" style={{ fontSize: 12, marginTop: 4 }}>
        <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: DEM, marginRight: 4 }} />Democrats
        <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: REP, margin: "0 4px 0 12px" }} />Republicans
        · {legend}
      </div>
    </div>
  );
}

// Small by-party table for any set of measures (bars mislead across scale
// ranges, so we tabulate with inline scale context).
function NormsTable({ rows }) {
  const measures = [...new Map(rows.map((r) => [r.measure, r])).values()];
  const parties = ["Dem", "Ind", "Rep"];
  const cell = (m, p) => rows.find((r) => r.measure === m && r.party === p);
  return (
    <div className="op-tablewrap">
      <table className="op-table">
        <thead>
          <tr>
            <th>Measure</th><th>Scale</th>
            <th className="dem">Dem</th><th className="ind">Ind</th><th className="rep">Rep</th>
          </tr>
        </thead>
        <tbody>
          {measures.map((m) => (
            <tr key={m.measure}>
              <td>{m.label}</td>
              <td className="op-scale">{m.scale_min}–{m.scale_max}</td>
              {parties.map((p) => {
                const c = cell(m.measure, p);
                return (
                  <td key={p} className={p.toLowerCase()}>
                    {c?.value != null ? c.value.toFixed(1) : "—"}
                    <span className="op-n">{c?.n_obs ? `n=${c.n_obs}` : ""}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
