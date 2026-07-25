"use client";
import { useEffect, useState } from "react";
import TransitionSankey from "@/modules/avp/party/components/TransitionSankey";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import { partyLabel } from "@/modules/avp/shared/lib/map-tooltip";
import { fillTemplate } from "@/modules/avp/shared/lib/content-utils";
import { filterValidWaves } from "@/modules/avp/shared/lib/waves";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";

const PC = { DEM: "#0C234B", REP: "#AB0520", PND: "#6b7785", LBT: "#C9A227", NOL: "#378DBD", OTH: "#9AA7B1" };
const pct = (v) => (v == null ? "—" : `${(v * 100).toFixed(v < 0.01 ? 3 : 1)}%`);

function matrixRow(P, from, states) {
  const row = P?.[from];
  if (!row) return null;
  if (Array.isArray(row)) {
    return Object.fromEntries(states.map((s, i) => [s, Number(row[i]) || 0]));
  }
  return row;
}

export default function PartyModule({ copy }) {
  const [mk, setMk] = useState(null);
  const [ct, setCt] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  useEffect(() => {
    const u = (p) => publicUrl(`/data/party/${p}`);
    fetch(u("markov.json")).then((r) => r.json()).then(setMk).catch(() => {});
    fetch(u("ct_markov.json")).then((r) => r.json()).then(setCt).catch(() => {});
    fetch(u("transition_analysis.json")).then((r) => r.json()).then(setAnalysis).catch(() => {});
  }, []);

  const states = ct?.states ?? mk?.states ?? [];
  const P30 = ct?.P_horizons?.["30"] ?? null;
  const P = states.map((from) => matrixRow(P30, from, states) ?? mk?.transition_matrix?.[states.indexOf(from)] ?? {});
  const steady = ct?.stationary ?? mk?.steady_state ?? {};
  const rowOf = (s) => {
    const i = states.indexOf(s);
    return i >= 0 ? P[i] : null;
  };
  const demStay = rowOf("DEM")?.DEM;
  const demToRep = rowOf("DEM")?.REP;
  const repStay = rowOf("REP")?.REP;
  const repToDem = rowOf("REP")?.DEM;
  const dwell = ct?.mean_dwell_years ?? {};
  const exitRate = ct?.exit_rate_per_year ?? {};
  const currentShare = ct?.current_share ?? {};
  const dwellOrder = [...states].sort((a, b) => (dwell[b] ?? 0) - (dwell[a] ?? 0));

  const cov = analysis?.zip_covariates?.steady_partisan;
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
                nTransitions: Number(ct?.meta?.n_transitions ?? mk?.meta?.n_transitions ?? 234749790)
                  .toLocaleString("en-US"),
                nWindows: ct?.meta?.n_windows ?? 36,
                windowMin: ct?.meta?.window_days_min ?? 7,
                windowMax: ct?.meta?.window_days_max ?? 183,
              })}
            />
          </p>
        </div>
      </section>

      <main className="wrap content-after-hero">
      <section className="op-section">
        <div className="op-head">
          <span className="op-eyebrow">{copy.sankey.eyebrow}</span>
          <h2>{copy.sankey.title}</h2>
          <p><ContentHtml html={copy.sankey.body} /></p>
        </div>
        <TransitionSankey />
      </section>

      {ct && copy.msm && (
        <section className="op-section">
          <div className="op-head">
            <span className="op-eyebrow">{copy.msm.eyebrow}</span>
            <h2>{copy.msm.title}</h2>
            <p><ContentHtml html={copy.msm.body} /></p>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", maxWidth: 900, marginBottom: 18 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: PC.REP }}>
                {dwell.REP != null ? `${dwell.REP.toFixed(0)} yr` : "—"}
              </div>
              <div className="note">Typical Republican dwell</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: PC.DEM }}>
                {dwell.DEM != null ? `${dwell.DEM.toFixed(0)} yr` : "—"}
              </div>
              <div className="note">Typical Democrat dwell</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: PC.PND }}>
                {dwell.PND != null ? `${dwell.PND.toFixed(0)} yr` : "—"}
              </div>
              <div className="note">Typical unaffiliated dwell</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)" }}>
                {ct.half_life_years != null ? `${ct.half_life_years.toFixed(0)} yr` : "—"}
              </div>
              <div className="note">Half-life of a mix shock</div>
            </div>
          </div>

          <div className="op-tablewrap">
            <table className="op-table" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Party</th>
                  <th style={{ textAlign: "right" }}>Mean dwell</th>
                  <th style={{ textAlign: "right" }}>Exit / year</th>
                  <th style={{ textAlign: "right" }}>Today</th>
                  <th style={{ textAlign: "right" }}>Long-run</th>
                  <th style={{ textAlign: "right" }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                {dwellOrder.map((s) => {
                  const now = currentShare[s];
                  const pi = steady[s];
                  const gap = now != null && pi != null ? (pi - now) * 100 : null;
                  return (
                    <tr key={s}>
                      <td style={{ fontWeight: 600, color: PC[s] || "inherit" }}>{s}</td>
                      <td style={{ textAlign: "right" }}>
                        {dwell[s] != null ? `${dwell[s].toFixed(1)} yr` : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {exitRate[s] != null ? exitRate[s].toFixed(3) : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>{pct(now)}</td>
                      <td style={{ textAlign: "right" }}>{pct(pi)}</td>
                      <td style={{ textAlign: "right", color: gap == null ? "inherit" : gap > 0 ? PC.REP : PC.DEM }}>
                        {gap == null ? "—" : `${gap > 0 ? "+" : ""}${gap.toFixed(1)} pp`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="note" style={{ marginTop: 8 }}>
            {copy.msm.dwellNote}
          </p>
        </section>
      )}

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
                      ? `Among ${partyLabel(from)} today, ${(v * 100).toFixed(1)}% are still ${partyLabel(to)} in 30 days.`
                      : `Among ${partyLabel(from)} today, ${(v * 100).toFixed(2)}% switch to ${partyLabel(to)} within 30 days.`;
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
                <ContentHtml html={copy.entrants.entrantPlaceholder} />
              </p>
            )}
          </section>
        </>
      )}
    </main>
    </>
  );
}
