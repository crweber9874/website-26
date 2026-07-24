"use client";
import { useEffect, useMemo, useState } from "react";
import PrecinctMap from "@/modules/avp/voting/components/PrecinctMap";
import PrecinctCountyAnalytics from "@/modules/avp/voting/components/PrecinctCountyAnalytics";
import PrecinctDistribution from "@/modules/avp/voting/components/PrecinctDistribution";
import {
  contestsIn, prettyContest, contestTooltip, isMeasure, fillExpr, legendEnds, legendRampCss,
  fmtInt, fmtPct, precinctKey, contestWinner, headlineNote, metricLabel,
} from "@/modules/avp/voting/lib/precinct";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";
import { mapTipMuted, partyShareMapHtml } from "@/modules/avp/shared/lib/map-tooltip";

const YEARS = [
  { id: 2024, label: "2024 general" },
  { id: 2022, label: "2022 general" },
];

export default function PrecinctExplorer() {
  const [year, setYear] = useState(2024);
  const [fc, setFc] = useState(null);
  const [contest, setContest] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [county, setCounty] = useState("");
  const [bwMult, setBwMult] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setSelectedKey(null); setCounty("");
    const url = publicUrl(`data/precinct/precinct_${year}.geojson`);
    fetch(url).then((r) => r.json()).then((json) => {
      if (cancelled) return;
      setFc(json);
      setContest(json.headline_contest ?? contestsIn(json)[0]);
      setLoading(false);
    }).catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [year]);

  const contests = useMemo(() => (fc ? contestsIn(fc) : []), [fc]);
  const counties = useMemo(() => {
    if (!fc) return [];
    return [...new Set(fc.features.map((f) => f.properties.county))].sort();
  }, [fc]);

  const allRecords = useMemo(
    () => (fc ? fc.features.map((f) => f.properties) : []),
    [fc],
  );

  const byKey = useMemo(() => {
    const m = {};
    if (fc) {
      for (const f of fc.features) {
        const p = f.properties;
        m[precinctKey(p.county, p.precinct_id)] = p;
      }
    }
    return m;
  }, [fc]);

  const countyRecords = useMemo(() => {
    if (!fc || !county) return [];
    return fc.features
      .filter((f) => f.properties.county === county)
      .map((f) => f.properties);
  }, [fc, county]);

  const headline = fc?.headline_contest;
  const activeContest = contest && contests.includes(contest) ? contest : contests[0];
  const expr = useMemo(() => (activeContest ? fillExpr(activeContest) : "#ccc"), [activeContest]);
  const [loEnd, hiEnd] = activeContest ? legendEnds(activeContest) : ["", ""];
  const rec = selectedKey ? byKey[selectedKey] : null;
  const measureTip = activeContest ? contestTooltip(activeContest, year) : "";
  const winner = rec && activeContest
    ? contestWinner(rec[activeContest], activeContest, year)
    : null;
  const showHeadlineNote = activeContest === "two_party_rep"
    || (headline && activeContest === headline);

  const describe = (key) => {
    const p = byKey[key];
    if (!p) return null;
    const v = p[activeContest];
    const metric = metricLabel(activeContest);
    const tip = contestTooltip(activeContest, year);
    const w = contestWinner(v, activeContest, year);
    const winLine = w
      ? `<br><strong style="color:${w.color}">Precinct winner: ${w.label}${w.partyTag ? ` (${w.partyTag})` : ""} · ${fmtPct(w.share)}</strong>`
      : "";
    const partyHtml = partyShareMapHtml(p.dem_share, p.rep_share, fmtPct);
    return `<strong>${p.precinct_id} · ${p.county} County</strong><br>` +
      `${mapTipMuted(`${year} general · ${prettyContest(activeContest)}`)}<br>` +
      `${metric}: <strong>${fmtPct(v)}</strong>${winLine}<br>` +
      (partyHtml ? `${partyHtml}<br>` : "") +
      (tip ? `${mapTipMuted(tip)}<br>` : "") +
      `Ballots counted in this precinct: <strong>${fmtInt(p.total)}</strong>`;
  };

  return (
    <>
      <div className="panel" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span className="gl" style={{ marginRight: 4 }}>Election</span>
        {YEARS.map((y) => (
          <button key={y.id} className="varbtn" aria-pressed={year === y.id} onClick={() => setYear(y.id)}>
            {y.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <span className="gl" style={{ marginRight: 4 }}>County</span>
        <select
          className="varbtn"
          value={county}
          onChange={(e) => { setCounty(e.target.value); setSelectedKey(null); }}
          style={{ maxWidth: 180 }}
          aria-label="Filter by county"
        >
          <option value="">All counties</option>
          {counties.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="gl" style={{ marginRight: 4 }}>Contest</span>
        <select
          className="varbtn"
          value={activeContest ?? ""}
          onChange={(e) => setContest(e.target.value)}
          style={{ maxWidth: 320 }}
          title={measureTip}
          aria-label="Contest"
        >
          {contests.map((c) => (
            <option key={c} value={c} title={contestTooltip(c, year)}>
              {prettyContest(c)}{c === headline ? " (headline)" : ""}
            </option>
          ))}
        </select>
      </div>

      {headline && (
        <p className="note" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
          {headlineNote(headline, year)}
          {activeContest !== headline && !isMeasure(activeContest) && (
            <> Showing <strong>{prettyContest(activeContest)}</strong> — a separate contest from the headline race.</>
          )}
        </p>
      )}

      {measureTip && isMeasure(activeContest ?? "") && (
        <p className="note" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>{measureTip}</p>
      )}

      <div className="explorer">
        <div>
          <PrecinctMap
            data={fc}
            fillExpr={expr}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            describe={describe}
            countyFilter={county || null}
            precinctYear={year}
          />
          <div className="card" style={{ marginTop: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              {activeContest ? prettyContest(activeContest) : ""}{loading ? " · loading…" : ""}
              {county ? ` · ${county} County` : ""}
              {activeContest && !isMeasure(activeContest) ? " · two-party Republican share" : ""}
              {activeContest && isMeasure(activeContest) ? " · Yes share" : ""}
            </div>
            <div className="ramp" style={{
              background: activeContest
                ? `linear-gradient(90deg, ${legendRampCss(activeContest)})`
                : undefined,
            }} />
            <div className="ramp-labels"><span>{loEnd}</span><span>{hiEnd}</span></div>
          </div>
        </div>

        <div className="detail">
          {rec ? (
            <>
              <div className="eyebrow">{rec.precinct_id}</div>
              <h3 style={{ margin: "4px 0 10px" }}>{rec.county} County</h3>

              {winner && (
                <div
                  className="winner-badge"
                  style={{
                    background: winner.color,
                    marginBottom: 12,
                  }}
                >
                  <span className="winner-badge-label">Winner</span>
                  <strong>{winner.label}</strong>
                  {winner.partyTag && (
                    <span className="winner-badge-party">({winner.partyTag})</span>
                  )}
                  <span className="winner-badge-share">{fmtPct(winner.share)}</span>
                </div>
              )}

              <div className="kv">
                <span>{prettyContest(activeContest ?? "")}</span>
                <strong>
                  {fmtPct(rec[activeContest])}
                  {isMeasure(activeContest ?? "") ? " Yes" : " Rep (2-party)"}
                </strong>
              </div>
              {showHeadlineNote && headline && activeContest === headline && (
                <p className="note" style={{ margin: "8px 0", fontSize: 12, lineHeight: 1.45 }}>
                  Same as <strong>Two-party Rep</strong> below — both reflect the headline race.
                </p>
              )}
              <hr style={{ border: "none", borderTop: "1px solid #e2e9eb", margin: "10px 0" }} />
              <div className="kv"><span>Ballots cast</span><strong>{fmtInt(rec.total)}</strong></div>
              <div className="kv"><span>Democratic</span><strong>{fmtInt(rec.dem)} · {fmtPct(rec.dem_share)}</strong></div>
              <div className="kv"><span>Republican</span><strong>{fmtInt(rec.rep)} · {fmtPct(rec.rep_share)}</strong></div>
              <div className="kv"><span>Other</span><strong>{fmtInt(rec.other)}</strong></div>
              <div className="kv">
                <span>Two-party Rep{headline ? ` (${prettyContest(headline)})` : ""}</span>
                <strong>{fmtPct(rec.two_party_rep)}</strong>
              </div>
            </>
          ) : (
            <p className="note">
              Click a precinct for certified returns, or choose a county to open the
              analytics panel below (distributions, univariate stats, scatter plots).
            </p>
          )}
        </div>
      </div>

      {(county || rec) && activeContest && (
        <PrecinctDistribution
          statewideRecords={allRecords}
          countyRecords={countyRecords}
          selectedRecord={rec}
          county={county || rec?.county}
          activeContest={activeContest}
          year={year}
          bwMult={bwMult}
          onBwChange={setBwMult}
        />
      )}

      {county && (
        <PrecinctCountyAnalytics
          county={county}
          records={countyRecords}
          activeContest={activeContest}
          contests={contests}
          year={year}
          bwMult={bwMult}
          onBwChange={setBwMult}
        />
      )}

      <p className="note" style={{ marginTop: 16 }}>
        Certified precinct returns from the Arizona Secretary of State
        ({year === 2024 ? "1,735" : "1,725"} precincts). County boundaries overlay
        Census cartographic lines; precincts are re-drawn each cycle. Public aggregates only.
      </p>
    </>
  );
}
