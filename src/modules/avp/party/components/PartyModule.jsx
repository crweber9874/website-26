"use client";
import { useEffect, useState } from "react";
import Link from "@/modules/avp/shared/lib/Link";
import {
  Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import TransitionSankey from "@/modules/avp/party/components/TransitionSankey";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { chartTooltip } from "@/modules/avp/shared/lib/chart-tooltip";
import { partyLabel } from "@/modules/avp/shared/lib/map-tooltip";
import { fillTemplate } from "@/modules/avp/shared/lib/content-utils";
import { filterValidWaves } from "@/modules/avp/shared/lib/waves";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip);

const PC = { DEM: "#0C234B", REP: "#AB0520", PND: "#6b7785", LBT: "#C9A227", NOL: "#378DBD", OTH: "#9AA7B1" };
const pct = (v) => (v == null ? "—" : `${(v * 100).toFixed(v < 0.01 ? 3 : 1)}%`);

// OLS line for the scatter (steady_partisan ~ party_share_rep), drawn client-side.
function fit(pts) {
  const n = pts.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
  return { a, b };
}

export default function PartyModule({ copy }) {
  const [mk, setMk] = useState(null);
  const [zip, setZip] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [dl, setDl] = useState(null);
  useEffect(() => {
    const u = (p) => publicUrl(`/data/party/${p}`);
    fetch(u("markov.json")).then((r) => r.json()).then(setMk).catch(() => {});
    fetch(u("zip_transitions.json")).then((r) => r.json()).then(setZip).catch(() => {});
    fetch(u("transition_analysis.json")).then((r) => r.json()).then(setAnalysis).catch(() => {});
    fetch(publicUrl("/data/transitions/downloads/manifest.json"))
      .then((r) => (r.ok ? r.json() : null))
      .then(setDl)
      .catch(() => {});
  }, []);

  const states = mk?.states ?? [];
  const P = mk?.transition_matrix ?? [];
  const steady = mk?.steady_state ?? {};
  const rowOf = (s) => {
    const i = states.indexOf(s);
    return i >= 0 ? P[i] : null;
  };
  const demStay = rowOf("DEM")?.DEM;
  const demToRep = rowOf("DEM")?.REP;
  const repStay = rowOf("REP")?.REP;
  const repToDem = rowOf("REP")?.DEM;

  const zpts = (zip?.rows ?? [])
    .filter((r) => Number.isFinite(r.party_share_rep) && Number.isFinite(r.steady_partisan))
    .map((r) => ({
      x: r.party_share_rep,
      y: r.steady_partisan,
      zip: r.zip,
      demShare: r.party_share_dem,
      repShare: r.party_share_rep,
    }));
  const line = zpts.length > 2 ? fit(zpts.map((p) => [p.x, p.y])) : null;
  const xs = zpts.map((p) => p.x);
  const lineData = line ? [Math.min(...xs), Math.max(...xs)].map((x) => ({ x, y: line.a + line.b * x })) : [];

  const cov = analysis?.zip_covariates?.steady_partisan;
  const ageParty = analysis?.age_party;
  const primaryWin = analysis?.primary_affiliation_window;
  const recentWaves = filterValidWaves(analysis?.waves).slice(-6);
  const entrants = analysis?.entrant_party_skew;
  const entState = entrants?.statewide;
  const entAvail = entrants?.meta?.available;
  const entrantByDate = Object.fromEntries(
    (entrants?.waves ?? []).map((w) => [w.file_date, w])
  );
  const pp = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)} pp`);

  return (
    <>
      <section className="hero hero-compact">
        <div className="wrap">
          <div className="eyebrow">{copy.hero.eyebrow}</div>
          <h1>{copy.hero.title}</h1>
          <p className="lede">
            <ContentHtml
              html={fillTemplate(copy.hero.ledeTemplate, {
                nTransitions: mk
                  ? Number(mk.meta.n_transitions).toLocaleString("en-US")
                  : "230M+",
              })}
            />
          </p>
        </div>
      </section>

      <main className="wrap content-after-hero">
      {/* transition matrix */}
      <section className="op-section">
        <div className="op-head">
          <span className="op-eyebrow">{copy.sankey.eyebrow}</span>
          <h2>{copy.sankey.title}</h2>
          <p>{copy.sankey.body}</p>
        </div>
        <TransitionSankey />
      </section>

      <section className="op-section">
        <div className="op-head">
          <span className="op-eyebrow">{copy.matrix.eyebrow}</span>
          <h2><ContentHtml html={copy.matrix.title} /></h2>
          <p>{copy.matrix.body}</p>
        </div>
        <div className="op-tablewrap">
          <table className="op-table" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
            <thead>
              <tr><th>from \ to</th>{states.map((s) => <th key={s}>{s}</th>)}</tr>
            </thead>
            <tbody>
              {P.map((row, i) => (
                <tr key={states[i]}>
                  <td style={{ fontWeight: 600 }}>{states[i]}</td>
                  {states.map((s) => {
                    const v = row[s] ?? 0, diag = s === states[i];
                    const bg = diag ? "#eef2f5" : `rgba(171,5,32,${Math.min(1, v * 120)})`;
                    const from = states[i], to = s;
                    const plain = diag
                      ? `Among ${partyLabel(from)} one month ago, ${(v * 100).toFixed(1)}% are still ${partyLabel(to)} this month.`
                      : `Among ${partyLabel(from)} one month ago, ${(v * 100).toFixed(2)}% switched to ${partyLabel(to)} this month.`;
                    return <td key={s} title={plain} style={{ background: bg, textAlign: "right", color: !diag && v * 120 > 0.5 ? "#fff" : "inherit" }}>{pct(v)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Number.isFinite(demStay) && Number.isFinite(repStay) && (
          <p className="note" style={{ marginTop: 8 }}>
            <ContentHtml
              html={fillTemplate(copy.matrix.interpretTemplate, {
                demStay: (demStay * 100).toFixed(1),
                demToRep: (demToRep * 100).toFixed(2),
                repStay: (repStay * 100).toFixed(1),
                repToDem: (repToDem * 100).toFixed(2),
              })}
            />
          </p>
        )}
      </section>

      <section className="op-section">
        <div className="op-head">
          <span className="op-eyebrow">{copy.steady.eyebrow}</span>
          <h2>{copy.steady.title}</h2>
          <p><ContentHtml html={copy.steady.body} /></p>
        </div>
        <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          {states.filter((s) => steady[s] > 0.005).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 42, fontFamily: "var(--mono)", fontSize: 12 }}>{s}</span>
              <div style={{ flex: 1, background: "#eef2f5", borderRadius: 4, height: 20, overflow: "hidden" }}>
                <div style={{ width: `${steady[s] * 100}%`, height: "100%", background: PC[s] }} />
              </div>
              <span style={{ width: 52, textAlign: "right", fontFamily: "var(--mono)", fontSize: 12 }}>{pct(steady[s])}</span>
            </div>
          ))}
        </div>
        {mk?.two_state && (
          <p className="note" style={{ marginTop: 12 }}>
            <ContentHtml
              html={fillTemplate(copy.steady.twoStateTemplate, {
                partisanPct: pct(mk.two_state.steady_state.Partisan),
                nonpartisanPct: pct(mk.two_state.steady_state.Nonpartisan),
              })}
            />
          </p>
        )}
      </section>

      <section className="op-section">
        <div className="op-head">
          <span className="op-eyebrow">{copy.zip.eyebrow}</span>
          <h2><ContentHtml html={copy.zip.title} /></h2>
          <p>
            <ContentHtml
              html={fillTemplate(copy.zip.body, { r2: zip?.meta?.r2 ?? "≈0.48" })}
            />
          </p>
        </div>
        <div className="scatter-canvas" style={{ height: 360 }}>
          {zpts.length > 0 && (
            <Scatter
              data={{
                datasets: [
                  { label: "ZIPs", data: zpts, backgroundColor: "rgba(30,82,136,0.55)", pointRadius: 3 },
                  { label: "fit", data: lineData, type: "line", borderColor: "#AB0520", borderWidth: 2, pointRadius: 0 },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: chartTooltip({
                    callbacks: {
                      label: (c) => {
                        if (!c.raw?.zip) return null;
                        const steady = (c.raw.y * 100).toFixed(0);
                        const lines = [
                          `ZIP ${c.raw.zip}: Markov steady-state partisan share ${steady}%`,
                        ];
                        if (Number.isFinite(c.raw.demShare)) {
                          lines.push(`Democratic share: ${(c.raw.demShare * 100).toFixed(1)}%`);
                        }
                        if (Number.isFinite(c.raw.repShare)) {
                          lines.push(`Republican share: ${(c.raw.repShare * 100).toFixed(1)}%`);
                        }
                        return lines;
                      },
                    },
                  }),
                },
                scales: {
                  x: { title: { display: true, text: "Republican registration share" }, ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` } },
                  y: { title: { display: true, text: "Markov steady-state partisan share" }, ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` } },
                },
              }}
            />
          )}
        </div>
        <p className="note" style={{ marginTop: 8 }}>
          {fillTemplate(copy.zip.footnoteTemplate, {
            nZips: zip?.meta?.n_zips ?? "≈395",
          })}
        </p>
        <div className="story-cta" style={{ marginTop: 14 }}>
          {copy.zip.json.ctas.map((cta) => (
            <Link className="btn" href={cta.href} key={cta.href}>{cta.label}</Link>
          ))}
        </div>
      </section>

      {copy.download && dl && (
        <section className="op-section">
          <div className="op-head">
            <span className="op-eyebrow">{copy.download.eyebrow}</span>
            <h2>{copy.download.title}</h2>
            <p>
              <ContentHtml
                html={fillTemplate(copy.download.body, {
                  window: dl.waves?.[0]?.window ?? "2026-06-01..2026-07-02",
                })}
              />
            </p>
          </div>
          <div className="story-cta">
            <a className="btn" href={publicUrl("/data/transitions/downloads/zip_party_flows.csv")} download>
              ZIP party flows ({Number(dl.files?.["zip_party_flows.csv"]?.rows ?? 0).toLocaleString("en-US")} rows)
            </a>
            <a className="btn" href={publicUrl("/data/transitions/downloads/zip_covariates.csv")} download>
              ZIP covariates ({Number(dl.files?.["zip_covariates.csv"]?.rows ?? 0).toLocaleString("en-US")} rows)
            </a>
            <a className="btn" href={publicUrl("/data/transitions/downloads/zip_acs_full.csv")} download>
              ZIP ACS full ({Number(dl.files?.["zip_acs_full.csv"]?.rows ?? 0).toLocaleString("en-US")} ZIPs)
            </a>
            <a className="btn" href={publicUrl("/data/transitions/downloads/statewide_markov_flows.csv")} download>
              Statewide pooled flows
            </a>
            <Link className="btn" href={copy.download.schemaLink}>Schema &amp; privacy →</Link>
          </div>
          <p className="note" style={{ marginTop: 10 }}>
            Six party buckets per row (DEM, REP, PND, LBT, NOL, OTH). Counts only — ZIPs with
            &lt;50 matched registrants suppressed.{" "}
            {dl.waves?.length === 1 && (
              <>Multi-wave ZIP panels require re-running <code>build_transitions.R</code> for each adjacent build pair.</>
            )}
          </p>
        </section>
      )}

      {/* appended transition research */}
      {analysis && (
        <>
          <section className="op-section">
            <div className="op-head">
              <span className="op-eyebrow">{copy.covariates.eyebrow}</span>
              <h2>{copy.covariates.title}</h2>
              <p>
                <ContentHtml
                  html={fillTemplate(copy.covariates.body, {
                    nZipsSteady: analysis.meta?.n_zips_steady ?? "≈394",
                    r2: cov?.r2 != null ? cov.r2.toFixed(2) : "≈0.48",
                  })}
                />
              </p>
            </div>
            <div style={{ display: "grid", gap: 10, maxWidth: 640 }}>
              {copy.covariates.json.coefLabels.map(([label, key, sign]) => (
                <div key={label} className="kv" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span>{label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                    {cov?.coef?.[key] == null ? "—" : `${sign}${Math.abs(cov.coef[key]) < 0.01 ? cov.coef[key].toExponential(2) : cov.coef[key].toFixed(3)}`}
                  </span>
                </div>
              ))}
            </div>
            <p className="note" style={{ marginTop: 10 }}>
              <ContentHtml
                html={fillTemplate(copy.covariates.crossPartyNoteTemplate, {
                  r2: analysis.zip_covariates?.dem_to_rep_one_month?.r2?.toFixed(2) ?? "≈0.00",
                })}
              />
            </p>
          </section>

          <section className="op-section">
            <div className="op-head">
              <span className="op-eyebrow">{copy.entrants.eyebrow}</span>
              <h2>{copy.entrants.title}</h2>
              <p>
                <ContentHtml
                  html={fillTemplate(copy.entrants.body, {
                    markovWaves: analysis.meta?.markov_waves ?? 38,
                  })}
                />
              </p>
            </div>
            {primaryWin && (
              <p className="note" style={{ marginBottom: 10 }}>
                <b>Primary affiliation surge ({primaryWin.from} → {primaryWin.to}).</b>{" "}
                Unaffiliated share moved {primaryWin.pnd_share_change_pp > 0 ? "+" : ""}
                {primaryWin.pnd_share_change_pp} pp
                {primaryWin.pnd_flows != null && (
                  <>
                    {" "}while {Number(primaryWin.pnd_flows).toLocaleString("en-US")} affiliation toggles
                    {primaryWin.cross_party_switches != null && (
                      <>
                        {" "}and {Number(primaryWin.cross_party_switches).toLocaleString("en-US")} cross-party switches
                      </>
                    )}
                    {" "}occurred
                  </>
                )}
                {primaryWin.pnd_flows == null && primaryWin.movement_reliable === false && (
                  <> — matched-voter movement counts are suppressed for this window because the Nov 2024 build pair is unreliable.</>
                )}
                {primaryWin.pnd_flows != null && (
                  <> — affiliation flows dwarf true DEM↔REP movement roughly 10-to-1.</>
                )}
              </p>
            )}
            <div className="op-tablewrap">
              <table className="op-table" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>Build date</th><th>File rows</th><th>Net Δ</th>
                    <th>DEM</th><th>REP</th><th>PND</th>
                    {entAvail && <th>Entrant Rep skew</th>}
                  </tr>
                </thead>
                <tbody>
                  {recentWaves.map((w) => {
                    const ent = entrantByDate[w.file_date];
                    return (
                    <tr key={w.file_date}>
                      <td>{w.file_date}</td>
                      <td>{Number(w.total_active).toLocaleString("en-US")}</td>
                      <td>{w.net_growth == null ? "—" : (w.net_growth >= 0 ? "+" : "") + w.net_growth.toLocaleString("en-US")}</td>
                      <td>{w.party_share_dem != null ? `${(w.party_share_dem * 100).toFixed(1)}%` : "—"}</td>
                      <td>{w.party_share_rep != null ? `${(w.party_share_rep * 100).toFixed(1)}%` : "—"}</td>
                      <td>{w.party_share_pnd != null ? `${(w.party_share_pnd * 100).toFixed(1)}%` : "—"}</td>
                      {entAvail && (
                        <td>{ent?.skew_rep_pp != null ? pp(ent.skew_rep_pp) : "—"}</td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {entAvail && entState ? (
              <>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", maxWidth: 820, marginTop: 14 }}>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)" }}>
                      {entState.n_entrants?.toLocaleString("en-US") ?? "—"}
                    </div>
                    <div className="note">New registrants ({entrants.meta?.window})</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: PC.DEM }}>
                      {entState.party_share_dem != null ? `${(entState.party_share_dem * 100).toFixed(1)}%` : "—"}
                    </div>
                    <div className="note">Entrant DEM share · {pp(entState.skew_dem_pp)} vs file</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: PC.REP }}>
                      {entState.party_share_rep != null ? `${(entState.party_share_rep * 100).toFixed(1)}%` : "—"}
                    </div>
                    <div className="note">Entrant REP share · {pp(entState.skew_rep_pp)} vs file</div>
                  </div>
                  <div className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)" }}>
                      {entState.new_median_age ?? "—"}
                    </div>
                    <div className="note">Entrant median age (years)</div>
                  </div>
                </div>
                <p className="note" style={{ marginTop: 10 }}>
                  <b>New-entrant party mix.</b> {entState.interpretation}{" "}
                  Across {entrants.zip_skew?.n_zips ?? 0} ZIPs with ≥50 entrants, mean Rep skew is{" "}
                  {pp(entrants.zip_skew?.mean_skew_rep_pp)} (entrant Rep share correlates with local file
                  composition at r={entrants.zip_skew?.entrant_vs_file_rep_r?.toFixed(2) ?? "—"}).
                </p>
              </>
            ) : (
              <p className="note" style={{ marginTop: 10 }}>
                <b>New-entrant party mix.</b> Stage A supports an <code>entrant</code> transition
                dimension (<code>build_transitions.R entrant</code>) that publishes each geography&apos;s
                new-registrant party counts and median age. Rebuild with BigQuery access to populate
                entrant skew in this section automatically.
              </p>
            )}
          </section>

          <section className="op-section">
            <div className="op-head">
              <span className="op-eyebrow">6 · Age and party lean</span>
              <h2>Are younger voters leaning to a party?</h2>
              <p>
                At ZIP scale, younger registrant populations lean substantially less Republican. This
                pattern shows up in both static registration shares and the Markov steady-state models
                above — but monthly <em>switching</em> rates remain tiny for all age groups.
              </p>
            </div>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", maxWidth: 640 }}>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)" }}>
                  {ageParty?.age_vs_rep_share_r != null ? ageParty.age_vs_rep_share_r.toFixed(2) : "—"}
                </div>
                <div className="note">Age vs Rep share (r across ZIPs)</div>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)" }}>
                  {ageParty?.mean_rep_share_age_under_40 != null
                    ? `${(ageParty.mean_rep_share_age_under_40 * 100).toFixed(0)}%`
                    : "—"}
                </div>
                <div className="note">Mean Rep share · ZIPs with median age &lt; 40</div>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)" }}>
                  {ageParty?.mean_rep_share_age_55_plus != null
                    ? `${(ageParty.mean_rep_share_age_55_plus * 100).toFixed(0)}%`
                    : "—"}
                </div>
                <div className="note">Mean Rep share · ZIPs with median age ≥ 55</div>
              </div>
            </div>
            <p className="note" style={{ marginTop: 10 }}>
              Younger ZIPs average{" "}
              {Math.round((ageParty?.mean_rep_share_age_under_40 ?? 0) * 100)}% Republican registration vs{" "}
              {Math.round((ageParty?.mean_rep_share_age_55_plus ?? 0) * 100)}% in older ZIPs — a{" "}
              {ageParty
                ? Math.round((ageParty.mean_rep_share_age_55_plus - ageParty.mean_rep_share_age_under_40) * 100)
                : "—"}
              -point gap. The Markov steady state tilts more Republican than today&apos;s stock (
              {analysis.markov_statewide?.steady_state_rep != null
                ? `${(analysis.markov_statewide.steady_state_rep * 100).toFixed(1)}%`
                : "44.5%"}
              {" "}steady-state Rep vs{" "}
              {analysis.markov_statewide?.steady_state_dem != null
                ? `${(analysis.markov_statewide.steady_state_dem * 100).toFixed(1)}%`
                : "22.6%"}
              {" "}Dem), a diagnostic of switching direction — not a demographic forecast.
            </p>
          </section>
        </>
      )}
    </main>
    </>
  );
}
