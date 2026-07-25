"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/modules/avp/shared/lib/Link";
import { ContentHtml } from "@/modules/avp/shared/components/ContentHtml";
import ChoroplethMap from "@/modules/avp/explorer/components/ChoroplethMap";
import RegistrationChart from "@/modules/avp/explorer/components/RegistrationChart";
import { reshape } from "@/modules/avp/shared/lib/reshape";
import { colorForVar } from "@/modules/avp/shared/lib/colors";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";
import { GEO_TO_GEOID_KEY } from "@/modules/avp/explorer/lib/geocode";
import { labelFor, formatValue } from "@/modules/avp/shared/lib/variables";
import { choroplethMapTip } from "@/modules/avp/shared/lib/map-tooltip";

const FIT_DATA_GEOS = new Set(["county", "cd", "ld"]);

function colorsFor(data, variable) {
  const dom = data?.domains?.[variable];
  if (!dom) return {};
  const [min, max] = dom;
  const out = {};
  for (const g of data.geoids) {
    const v = data.byGeoid[g].values[variable];
    if (v == null || !Number.isFinite(v)) continue;
    out[g] = colorForVar(variable, v, min, max);
  }
  return out;
}

const REG_KEYS = [
  "total_republican", "total_democratic", "total_libertarian",
  "total_nolabels", "total_party_not_specified", "total_other_party",
];

export default function Story({ steps, ui }) {
  const STEPS = steps;
  const introStep = STEPS.find((s) => s.introCard) ?? STEPS[0];
  const [active, setActive] = useState(0);
  const [cache, setCache] = useState({});
  const [selected, setSelected] = useState(null);
  const [pendingLocate, setPendingLocate] = useState(null);
  const refs = useRef([]);
  const step = STEPS[active];

  // lazy-load the active step's geography
  useEffect(() => {
    const geo = step.geo;
    if (!geo || cache[geo]) return;
    let c = false;
    fetch(publicUrl(`data/${geo}/summary.json`))
      .then((r) => r.json())
      .then((rows) => !c && setCache((p) => ({ ...p, [geo]: reshape(rows) })))
      .catch(() => {});
    return () => { c = true; };
  }, [step.geo, cache]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number(e.target.dataset.i);
            setActive(i);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [STEPS]);

  const data = cache[step.geo];
  const colors = useMemo(() => (data ? colorsFor(data, step.variable) : {}), [data, step.variable]);

  useEffect(() => {
    if (!pendingLocate || !data?.byGeoid) return;
    const pickKey = pendingLocate._pickGeo ?? GEO_TO_GEOID_KEY[step.geo];
    const id = pickKey ? pendingLocate.geoids[pickKey] : null;
    if (id && data.byGeoid[id]) setSelected(id);
  }, [step.geo, data, pendingLocate]);

  const stateValues = useMemo(() => {
    const c = cache.county;
    if (!c) return null;
    const out = {};
    for (const k of REG_KEYS) out[k] = Object.values(c.byGeoid).reduce((s, u) => s + (u.values[k] || 0), 0);
    return out;
  }, [cache]);

  const cap = `${step.label}${selected ? ` · ${selected.replace(/^AZ-[A-Z]+-/, "")}` : ""}`;
  const selectedForChart = useMemo(() => {
    if (!data?.byGeoid) return null;
    if (selected && data.byGeoid[selected]) return selected;
    if (step.geo === "cd" && data.byGeoid["AZ-CD-06"]) return "AZ-CD-06";
    if (step.geo === "ld" && data.byGeoid["AZ-LD-06"]) return "AZ-LD-06";
    if (step.geo === "county" && data.byGeoid["AZ-COUNTY-MARICOPA"]) return "AZ-COUNTY-MARICOPA";
    return Object.keys(data.byGeoid)[0] ?? null;
  }, [data, selected, step.geo]);
  const selectedValues = selectedForChart ? data?.byGeoid?.[selectedForChart]?.values : null;
  const selectedLabel = selectedForChart
    ? selectedForChart.replace(/^AZ-[A-Z]+-/, "")
    : "Selected area";

  const fitToData = FIT_DATA_GEOS.has(step.geo);

  const describe = useMemo(() => {
    if (!data?.byGeoid) return undefined;
    const unit = data.units[step.variable] ?? "count";
    const varLabel = labelFor(step.variable);
    return (geoid, labelOnly) => {
      const tail = geoid.replace(/^AZ-[A-Z]+-/, "");
      let name = tail;
      if (step.geo === "county") name = tail.charAt(0) + tail.slice(1).toLowerCase() + " County";
      else if (step.geo === "cd") name = `Congressional District ${Number(tail)}`;
      else if (step.geo === "ld") name = `Legislative District ${Number(tail)}`;
      else if (step.geo === "tract") name = `Census tract ${tail}`;
      else if (step.geo === "blockgroup") name = `Block group ${tail}`;
      else if (step.geo === "zcta" || step.geo === "zip") name = `ZIP area ${tail}`;
      if (labelOnly) return name;
      const vals = data.byGeoid[geoid]?.values;
      const val = vals?.[step.variable];
      return choroplethMapTip({
        name, context: step.label, varLabel, value: val, unit, formatValue,
        demShare: vals?.party_share_dem, repShare: vals?.party_share_rep,
      });
    };
  }, [data, step.variable, step.geo, step.label]);

  const lastStepIndex = STEPS.findLastIndex((s) => !s.introCard);
  const appLinks = ui?.json?.appLinks ?? [];

  return (
    <div className="story">
      <div className="story-viz">
        {introStep && (
          <div className="story-intro-card">
            <div className="eyebrow">{introStep.kicker}</div>
            <h2>{introStep.title}</h2>
            {introStep.paras.map((p, j) => (
              <ContentHtml as="p" html={p} key={j} />
            ))}
          </div>
        )}
        <div className="story-map">
          <ChoroplethMap
            geo={step.geo}
            colors={colors}
            selectedGeoid={selected}
            onSelect={setSelected}
            describe={describe}
            fitToData={fitToData}
            onGeoChange={(newGeo, result) => {
              setPendingLocate(result);
              const targetStep = STEPS.find((s) => s.geo === newGeo);
              if (targetStep) {
                const idx = STEPS.indexOf(targetStep);
                refs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
            pendingLocate={pendingLocate}
            onLocateApplied={() => setPendingLocate(null)}
          />
        </div>
        <div className="story-cap">
          <span className="dot" /> {cap}{ui?.mapCaptionSuffix ?? ""}
        </div>
      </div>

      <div className="story-steps">
        {STEPS.map((s, i) => (
          <section
            key={s.id}
            data-i={i}
            ref={(el) => (refs.current[i] = el)}
            className={"story-step" + (i === active ? " is-active" : "") + (s.introCard ? " story-step-intro" : "")}
          >
            <div className="step-card">
              {s.introCard ? (
                <p className="story-scroll-hint">Scroll to begin the tour ↓</p>
              ) : (
                <>
                  <div className="eyebrow">{s.kicker}</div>
                  <h2>{s.title}</h2>
                  {s.paras.map((p, j) => (
                    <ContentHtml as="p" html={p} key={j} />
                  ))}
                </>
              )}

              {s.extra === "reg-state" && stateValues && selectedValues && (
                <RegistrationChart
                  values={selectedValues}
                  label={ui?.regChartCountyLabel ?? "Selected county compared with statewide registration"}
                  compareValues={stateValues}
                  outerLabel={ui?.regChartOuterLabel ?? "Arizona statewide"}
                  innerLabel={selectedLabel}
                  defaultMode="sunburst"
                />
              )}
              {s.extra === "reg-cd6" && stateValues && selectedValues && (
                <RegistrationChart
                  values={selectedValues}
                  label={ui?.regChartDistrictLabel ?? "Selected district compared with statewide registration"}
                  compareValues={stateValues}
                  outerLabel={ui?.regChartOuterLabel ?? "Arizona statewide"}
                  innerLabel={selectedLabel}
                  defaultMode="sunburst"
                />
              )}
              {i === lastStepIndex && appLinks.length > 0 && (
                <div className="story-cta">
                  {appLinks.map((link) => (
                    <Link className={`btn${link.primary ? " primary" : ""}`} href={link.href} key={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
