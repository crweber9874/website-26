"use client";
import Link from "@/modules/avp/shared/lib/Link";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import VoterFileGrowthChart from "@/modules/avp/understanding/components/VoterFileGrowthChart";
import TimeSeriesCompare from "@/modules/avp/explorer/components/TimeSeriesCompare";
import { fillTemplate } from "@/modules/avp/shared/lib/content-utils";
import { UA } from "@/modules/avp/shared/lib/colors";
import { filterValidWaves, isAffiliationFlow, isCrossPartyFlow } from "@/modules/avp/shared/lib/waves";

const sumVar = (rows, v) => rows.reduce((a, r) => a + (r.variable === v ? r.value || 0 : 0), 0);
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const pct = (n, tot) => (tot ? `${((n / tot) * 100).toFixed(1)}%` : "—");

function weightedMean(rows, valueVar, weightVar) {
  const by = {};
  for (const r of rows) {
    if (!by[r.geoid]) by[r.geoid] = {};
    by[r.geoid][r.variable] = r.value;
  }
  let num = 0;
  let den = 0;
  for (const g of Object.values(by)) {
    if (g[valueVar] != null && g[weightVar]) {
      num += g[valueVar] * g[weightVar];
      den += g[weightVar];
    }
  }
  return den ? num / den : null;
}

export default function Understanding({ sections, county, analysis, st, party, churn }) {
  const buildDate = county.find((r) => r.file_date)?.file_date ?? "2026-07-02";
  const waves = filterValidWaves(analysis.waves);
  const firstWave = waves[0];
  const latestWave = waves[waves.length - 1];

  const totals = Object.fromEntries(
    ["total_registered", "total_active", "total_inactive", "total_canceled",
     "total_suspense", "total_republican", "total_democratic", "total_libertarian",
     "total_nolabels", "total_party_not_specified", "total_other_party"].map((v) => [v, sumVar(county, v)]),
  );
  const flowSum = (pred) =>
    party.reduce((a, r) =>
      a + (r.variable?.startsWith("flow_") && pred(r.variable) ? r.value || 0 : 0), 0);
  const bob = {
    deactivated: sumVar(st, "flow_ACTIVE_INACTIVE"),
    reactivated: sumVar(st, "flow_INACTIVE_ACTIVE"),
    purged: sumVar(st, "flow_ACTIVE_CANCELED"),
    crossParty: flowSum(isCrossPartyFlow),
    affiliation: flowSum(isAffiliationFlow),
    added: sumVar(churn, "n_new"),
    dropped: sumVar(churn, "n_dropped"),
  };
  const rollTotal = totals.total_active + totals.total_inactive + totals.total_canceled;
  const fileRows = rollTotal;
  const firstRows = firstWave?.total_active ?? fileRows;
  const currentRows = latestWave?.total_active ?? fileRows;
  const netGrowth = currentRows - firstRows;
  const growthPct = firstRows ? ((netGrowth / firstRows) * 100).toFixed(1) : "0";
  const medianAge = weightedMean(county, "voter_median_age", "total_active");
  const pevlShare = weightedMean(county, "pevl_share", "total_active");
  const turnout2024 = weightedMean(county, "turnout_gen_2024", "total_active");

  const scale = sections.scale;
  const record = sections.record;
  const summaries = sections.summaries;
  const status = sections.status;
  const reasons = sections.reasons;
  const growth = sections.growth;
  const builds = sections.builds;
  const reference = sections.reference;
  const about = sections.about;

  const partyItems = summaries.json.items.map(({ label, key, color }) => ({
    label,
    key,
    color,
    value: totals[key],
  }));
  const majorPartyHover = `Democratic share: ${pct(totals.total_democratic, totals.total_active)} · Republican share: ${pct(totals.total_republican, totals.total_active)}`;

  return (
    <>
      <section className="hero hero-compact">
        <div className="wrap">
          <div className="eyebrow">{sections.hero.eyebrow}</div>
          <h1>{sections.hero.title}</h1>
          <p className="lede">
            <ContentHtml html={sections.hero.body} />
          </p>
        </div>
      </section>

      <main className="wrap content-after-hero">
      <section className="vf-scale">
        <div className="vf-scale-meta">
          <div className="eyebrow">{scale.eyebrow}</div>
          <p className="note">
            <ContentHtml html={fillTemplate(scale.introTemplate, {
              buildCount: waves.length || analysis.meta?.markov_waves || 38,
              firstDate: firstWave?.file_date?.slice(0, 7) ?? "2022-05",
              buildDate,
            })} />
          </p>
        </div>
        <div className="vf-scale-stat">
          <div className="eyebrow">{scale.statEyebrow}</div>
          <div className="ag-big-num" style={{ color: UA.azblue }}>{fmt(fileRows)}</div>
          <p className="note" style={{ marginTop: 8, maxWidth: "32ch", marginLeft: "auto" }}>
            <ContentHtml html={fillTemplate(scale.growthTemplate, {
              netGrowth: fmt(netGrowth),
              growthPct,
              firstRows: fmt(firstRows),
              currentRows: fmt(currentRows),
              activeTotal: fmt(totals.total_active),
              inactiveTotal: fmt(totals.total_inactive),
              canceledTotal: fmt(totals.total_canceled),
            })} />
          </p>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{record.eyebrow}</div>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12 }}>{record.intro}</p>

        <div className="vf-example">
          <div className="vf-example-head">
            <strong>{record.json.example.label}</strong>
            <span className="tag">{record.json.example.tag}</span>
          </div>
          <p className="note" style={{ marginBottom: 12, lineHeight: 1.5 }}>{record.json.example.note}</p>
          <div className="vf-example-grid">
            {record.json.example.fields.map(([field, value, hint]) => (
              <div className="vf-example-row" key={field}>
                <div className="vf-field" title={`${field}: ${hint}`}>{field}</div>
                <div className="vf-value">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="note" style={{ maxWidth: 680, margin: "16px 0 12px" }}>{record.familiesIntro}</p>
        <div className="modgrid">
          {record.json.families.map((f) => (
            <div className="modcard soon" key={f.group} style={{ cursor: "default" }}>
              <div className="n" style={{ fontSize: 13 }}>{f.group}</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
                {f.fields.map((x) => <li key={x} className="note" style={{ fontSize: 13 }}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{summaries.eyebrow}</div>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12 }}>
          <ContentHtml html={fillTemplate(summaries.introTemplate, {
            buildDate,
            fileRowsTotal: fmt(fileRows),
            activeTotal: fmt(totals.total_active),
            inactiveTotal: fmt(totals.total_inactive),
            canceledTotal: fmt(totals.total_canceled),
            medianAge: medianAge?.toFixed(1) ?? "—",
            pevlPct: pevlShare != null ? `${(pevlShare * 100).toFixed(1)}%` : "—",
            turnoutPct: turnout2024 != null ? `${(turnout2024 * 100).toFixed(1)}%` : "—",
          })} />
        </p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", marginBottom: 16 }}>
          {summaries.json.highlights.map(([label, key, sub]) => (
            <div className="card" key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--mono)" }}>
                {key === "median_age" ? (medianAge?.toFixed(1) ?? "—")
                  : key === "pevl_share" ? (pevlShare != null ? `${(pevlShare * 100).toFixed(1)}%` : "—")
                  : key === "turnout_gen_2024" ? (turnout2024 != null ? `${(turnout2024 * 100).toFixed(1)}%` : "—")
                  : fmt(totals[key] ?? 0)}
              </div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{label}</div>
              <div className="note" style={{ fontSize: 12 }}>{sub}</div>
            </div>
          ))}
        </div>
        <div className="party" style={{ height: 34, borderRadius: 6, overflow: "hidden", display: "flex" }}>
          {partyItems.map(({ label, key, color, value }) => (
            <i key={key} title={`${majorPartyHover} · ${label}: ${fmt(value)} (${pct(value, totals.total_active)} of all active voters)`}
               style={{ width: `${(value / totals.total_active) * 100}%`, background: color, display: "block" }} />
          ))}
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", marginTop: 14 }}>
          {partyItems.map(({ label, key, color, value }) => (
            <div className="card" key={key}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="sw" style={{ background: color, width: 12, height: 12, borderRadius: 2 }} />
                <strong>{label}</strong>
                <span className="note" style={{ marginLeft: "auto", fontFamily: "var(--mono)" }}>
                  {fmt(value)} <span style={{ color: "var(--faint)" }}>({pct(value, totals.total_active)})</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{status.eyebrow}</div>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12 }}>
          <ContentHtml html={fillTemplate(status.introTemplate, { rollTotal: fmt(rollTotal) })} />
        </p>
        <div className="party" style={{ height: 34, borderRadius: 6, overflow: "hidden", display: "flex" }}>
          {status.json.items.map(({ label, key, color }) => (
            <i key={key} title={`${label} registrations on the file: ${fmt(totals[key])} (${pct(totals[key], rollTotal)} of all records)`}
               style={{ width: `${(totals[key] / rollTotal) * 100}%`, background: color, display: "block" }} />
          ))}
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginTop: 14 }}>
          {status.json.items.map(({ label, key, color, description }) => (
            <div className="card" key={key}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="sw" style={{ background: color, width: 12, height: 12, borderRadius: 2 }} />
                <strong>{label}</strong>
                <span className="note" style={{ marginLeft: "auto", fontFamily: "var(--mono)" }}>{fmt(totals[key])}</span>
              </div>
              <p className="note" style={{ marginTop: 6, lineHeight: 1.5 }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{reasons.eyebrow}</div>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12 }}>
          <ContentHtml html={reasons.intro} />
        </p>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {reasons.json.items.map(([r, d]) => (
            <div key={r} className="kv" style={{ display: "block" }}>
              <div className="k" style={{ fontWeight: 600 }}>{r}</div>
              <div className="note" style={{ fontSize: 13, marginTop: 2 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{growth.eyebrow}</div>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12 }}>
          <ContentHtml html={fillTemplate(growth.introTemplate, {
            buildCount: waves.length,
            firstDate: firstWave?.file_date ?? "2022-05-03",
            buildDate,
            firstRows: fmt(firstRows),
            currentRows: fmt(currentRows),
          })} />
        </p>
        <VoterFileGrowthChart waves={waves} buildDate={buildDate} />
        <TimeSeriesCompare waves={waves} buildDate={buildDate} compact />
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{builds.eyebrow}</div>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12 }}>
          <ContentHtml html={builds.intro} />
        </p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
          {builds.json.stats.map(([label, key, sub]) => (
            <div className="card" key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--mono)" }}>{fmt(bob[key])}</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{label}</div>
              <div className="note" style={{ fontSize: 12 }}>{sub}</div>
            </div>
          ))}
        </div>
        <p className="note" style={{ marginTop: 14, lineHeight: 1.55 }}>
          <ContentHtml html={sections.builds.partyNote} />
        </p>
        <p className="note" style={{ marginTop: 10 }}>
          {sections.builds.exploreLink}{" "}
          <Link href="/explorer">Understanding Arizona Democracy through Data &rarr;</Link>
        </p>
      </section>

      <section className="block" style={{ marginTop: 34 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{reference.eyebrow}</div>
        <h2 style={{ marginBottom: 10 }}>{reference.title}</h2>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12, lineHeight: 1.55 }}>{reference.intro}</p>
        <Link className="btn" href={reference.linkHref}>{reference.linkLabel}</Link>
      </section>

      <section id="about" style={{ marginTop: 34, scrollMarginTop: 60 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{about.eyebrow}</div>
        <h2 style={{ marginBottom: 12 }}>{about.title}</h2>
        <p className="note" style={{ maxWidth: 680, marginBottom: 12, lineHeight: 1.55 }}>{about.intro}</p>
        <p>
          <Link href="/story">{about.linkLabel}</Link>
        </p>
      </section>
    </main>
    </>
  );
}
