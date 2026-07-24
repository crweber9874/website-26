"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/modules/avp/shared/lib/Link";
import VariablePicker from "@/modules/avp/explorer/components/VariablePicker";
import DetailPanel from "@/modules/avp/explorer/components/DetailPanel";
import ChoroplethMap from "@/modules/avp/explorer/components/ChoroplethMap";
import StatDistribution from "@/modules/avp/explorer/components/StatDistribution";
import TimeSeriesCompare from "@/modules/avp/explorer/components/TimeSeriesCompare";
import DownloadGraphic from "@/components/react/DownloadGraphic";
import { colorForVar, rampCssForVar, legendLabels } from "@/modules/avp/shared/lib/colors";
import { GEO_TO_GEOID_KEY } from "@/modules/avp/explorer/lib/geocode";
import { reshape } from "@/modules/avp/shared/lib/reshape";
import { buildGroups, labelFor, formatValue } from "@/modules/avp/shared/lib/variables";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";
import { choroplethMapTip } from "@/modules/avp/shared/lib/map-tooltip";

// Geographies with a combined summary.json (choropleth-ready) + boundary
// geometry in /tiles. The ZIP layer maps to ZCTA: the pipeline already
// crosswalks ZIP->ZCTA at the record level (ZIP and ZCTA totals match to
// 0.03%), so ZCTA IS the ZIP-area layer — a separate raw-ZIP layer would just
// double-count. Block group (finest level; carries turnout + inactive-reason
// measures) is parked for now behind a heavier payload.
const GEOS = [
  { id: "cd", label: "Congressional district" },
  { id: "county", label: "County" },
  { id: "ld", label: "Legislative district" },
  { id: "tract", label: "Census tract" },
  { id: "blockgroup", label: "Block group" },
  { id: "zcta", label: "ZIP area (ZCTA)" },
];
const DEFAULT_VAR = "party_share_dem";

export default function Explorer({ initialData, initialGeo = "cd" }) {
  const [geo, setGeo] = useState(initialGeo);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [variable, setVariable] = useState(DEFAULT_VAR);
  const [selected, setSelected] = useState(null);
  const [pendingLocate, setPendingLocate] = useState(null);
  const mapExportRef = useRef(null);

  // fetch a geography's aggregates on demand (initialGeo is already loaded)
  useEffect(() => {
    if (geo === initialGeo) {
      setData(initialData);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setSelected(null);
    const url = publicUrl(`data/${geo}/summary.json`);
    fetch(url)
      .then((r) => r.json())
      .then((rows) => {
        if (!cancelled) {
          setData(reshape(rows));
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [geo, initialGeo, initialData]);

  const groups = useMemo(() => buildGroups(data.variables), [data]);

  // keep the active variable valid across geographies
  useEffect(() => {
    if (!data.variables.includes(variable)) {
      setVariable(data.variables.includes(DEFAULT_VAR) ? DEFAULT_VAR : data.variables[0]);
    }
  }, [data, variable]);

  const { byGeoid, domains, units, geoids } = data;
  const [min, max] = domains[variable] ?? [0, 1];

  useEffect(() => {
    if (!pendingLocate || loading) return;
    const pickKey = pendingLocate._pickGeo ?? GEO_TO_GEOID_KEY[geo];
    const id = pickKey ? pendingLocate.geoids[pickKey] : null;
    if (id && byGeoid[id]) setSelected(id);
  }, [geo, loading, pendingLocate, byGeoid]);

  const colors = useMemo(() => {
    const out = {};
    for (const g of geoids) {
      const val = byGeoid[g].values[variable];
      if (val == null || !Number.isFinite(val)) continue;
      out[g] = colorForVar(variable, val, min, max);
    }
    return out;
  }, [variable, geoids, byGeoid, min, max]);

  const unit = units[variable] ?? "count";
  const { lo: legendLo, hi: legendHi } = legendLabels(variable, unit, min, max);

  // tooltip + search label for the map: nice unit name + current variable value
  const nameOf = (geoid) => {
    const tail = geoid.replace(/^AZ-[A-Z]+-/, "");
    if (geo === "county") return tail.charAt(0) + tail.slice(1).toLowerCase() + " County";
    if (geo === "cd") return `CD ${Number(tail)}`;
    if (geo === "ld") return `LD ${Number(tail)}`;
    if (geo === "zcta" || geo === "zip") return `ZIP ${tail}`;
    return tail;
  };
  const describe = (geoid, labelOnly) => {
    const name = nameOf(geoid);
    if (labelOnly) return name;
    const vals = byGeoid[geoid]?.values;
    const val = vals?.[variable];
    const varLabel = labelFor(variable);
    const geoLabel = GEOS.find((g) => g.id === geo)?.label ?? "Area";
    return choroplethMapTip({
      name, context: geoLabel, varLabel, value: val, unit, formatValue,
      demShare: vals?.party_share_dem, repShare: vals?.party_share_rep,
    });
  };

  return (
    <>
      <div
        className="panel"
        style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <span className="gl" style={{ marginRight: 4 }}>Geography</span>
        {GEOS.map((g) => (
          <button
            key={g.id}
            className="varbtn"
            aria-pressed={geo === g.id}
            onClick={() => setGeo(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="explorer">
        <VariablePicker groups={groups} value={variable} onChange={setVariable} labelFor={labelFor} />

        <div>
          <div ref={mapExportRef} className="explorer-map-export">
            <ChoroplethMap
              geo={geo}
              colors={colors}
              selectedGeoid={selected}
              onSelect={setSelected}
              describe={describe}
              onGeoChange={(newGeo, result) => {
                setPendingLocate(result);
                setGeo(newGeo);
              }}
              pendingLocate={pendingLocate}
              onLocateApplied={() => setPendingLocate(null)}
            />
          </div>
          <div
            className="card"
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {labelFor(variable)}{loading ? " · loading…" : ""}
              </div>
              <div className="ramp" style={{ background: `linear-gradient(90deg, ${rampCssForVar(variable)})` }} />
              <div className="ramp-labels">
                <span>{legendLo}</span>
                <span>{legendHi}</span>
              </div>
            </div>
            <DownloadGraphic
              targetRef={mapExportRef}
              filename={`avp-explorer-${geo}-${variable}`}
              label="Download map"
            />
          </div>
          <StatDistribution data={data} variable={variable} geo={geo} selected={selected} />
          <TimeSeriesCompare geo={geo} selectedGeoid={selected} buildDate={data.fileDate} />
        </div>

        <DetailPanel record={selected ? byGeoid[selected] : null} geo={geo} groups={groups} units={units} />
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        <b>Go deeper:</b>{" "}
        <Link href="/understanding#about">What is the Arizona Voter Project?</Link> ·{" "}
        <Link href="/party">party transitions (Markov)</Link> ·{" "}
        <Link href="/reference">how these numbers are built</Link>
      </p>
      <p className="note" style={{ marginTop: 8 }}>
        Disclosure-safe aggregates only — every value is a group total, never an
        individual record. Small units (fewer than 50 registrants) are suppressed.
      </p>
    </>
  );
}
