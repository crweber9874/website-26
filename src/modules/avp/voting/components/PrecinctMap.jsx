"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import LocatePanel from "@/modules/avp/explorer/components/LocatePanel";
import { countyGeoid, parsePrecinctKey, precinctKey } from "@/modules/avp/voting/lib/precinct";
import { findPrecinctAt } from "@/modules/avp/voting/lib/precinct-locate";
import { UA } from "@/modules/avp/shared/lib/colors";
import { AZ_FIT_OPTIONS_COUNTY, AZ_MAP_INIT, fitArizonaState } from "@/modules/avp/shared/lib/map-bounds";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";
const BASEMAP = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#eef3f6" } },
    { id: "basemap", type: "raster", source: "basemap" },
  ],
};

function featureBounds(f) {
  const b = new maplibregl.LngLatBounds();
  const g = f.geometry;
  if (!g) return b;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) for (const pt of ring) b.extend(pt);
  return b;
}

function highlightFilter(key) {
  if (!key) return ["==", ["get", "precinct_id"], "__none__"];
  const [county, precinctId] = parsePrecinctKey(key);
  return ["all",
    ["==", ["get", "county"], county],
    ["==", ["get", "precinct_id"], precinctId],
  ];
}

export default function PrecinctMap({
  data, fillExpr, selectedKey, onSelect, describe, countyFilter, precinctYear = 2024,
}) {
  const wrapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const featuresRef = useRef([]);
  const countyFeaturesRef = useRef([]);
  const popupRef = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);

  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const fillRef = useRef(fillExpr); fillRef.current = fillExpr;
  const selectedRef = useRef(selectedKey); selectedRef.current = selectedKey;
  const describeRef = useRef(describe); describeRef.current = describe;
  const countyRef = useRef(countyFilter); countyRef.current = countyFilter;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP,
      ...AZ_MAP_INIT,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });

    const pick = (e) => map.queryRenderedFeatures(e.point, { layers: ["fill"] })[0];
    map.on("click", (e) => {
      const f = pick(e);
      if (f) {
        const p = f.properties;
        onSelectRef.current(precinctKey(p.county, p.precinct_id));
      }
    });
    map.on("mousemove", (e) => {
      const f = pick(e);
      map.getCanvas().style.cursor = f ? "pointer" : "";
      const text = f && describeRef.current
        ? describeRef.current(precinctKey(f.properties.county, f.properties.precinct_id))
        : null;
      if (text) popupRef.current.setLngLat(e.lngLat).setHTML(text).addTo(map);
      else popupRef.current.remove();
    });
    map.on("mouseout", () => popupRef.current.remove());
    map.on("load", () => { readyRef.current = true; });
    return () => map.remove();
  }, []);

  // load county boundaries once
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    const url = publicUrl("tiles/county.geojson");
    fetch(url).then((r) => r.json()).then((geojson) => {
      if (cancelled) return;
      countyFeaturesRef.current = geojson.features;
      const run = async () => {
        if (!readyRef.current) await new Promise((res) => map.once("load", res));
        if (cancelled) return;
        if (map.getSource("counties")) map.removeSource("counties");
        for (const id of ["county-line", "county-highlight"]) if (map.getLayer(id)) map.removeLayer(id);
        map.addSource("counties", { type: "geojson", data: geojson });
        map.addLayer({
          id: "county-line", type: "line", source: "counties",
          paint: { "line-color": UA.azblue, "line-width": 1.2, "line-opacity": 0.45 },
        });
        map.addLayer({
          id: "county-highlight", type: "line", source: "counties",
          paint: { "line-color": UA.azred, "line-width": 3, "line-opacity": 0.9 },
          filter: ["==", ["get", "geoid"], "__none__"],
        });
      };
      run();
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    let cancelled = false;
    setQuery(""); setMatches([]);

    const run = async () => {
      if (!readyRef.current) await new Promise((res) => map.once("load", res));
      if (cancelled) return;
      for (const id of ["fill", "line", "highlight"]) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource("pct")) map.removeSource("pct");

      featuresRef.current = data.features;

      map.addSource("pct", { type: "geojson", data });
      map.addLayer({ id: "fill", type: "fill", source: "pct",
        paint: {
          "fill-color": fillRef.current,
          "fill-opacity": countyRef.current
            ? ["case", ["==", ["get", "county"], countyRef.current], 0.78, 0.12]
            : 0.72,
        } });
      map.addLayer({ id: "line", type: "line", source: "pct",
        paint: { "line-color": "#54687a", "line-width": 0.3, "line-opacity": 0.5 } });
      map.addLayer({ id: "highlight", type: "line", source: "pct",
        paint: { "line-color": UA.azblue, "line-width": 3 },
        filter: highlightFilter(selectedRef.current) });
      if (map.getLayer("county-line")) map.moveLayer("county-line");
      if (map.getLayer("county-highlight")) map.moveLayer("county-highlight");

      fitView(map, data.features, countyRef.current);
    };
    run();
    return () => { cancelled = true; };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer("fill")) map.setPaintProperty("fill", "fill-color", fillExpr);
  }, [fillExpr]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer("highlight"))
      map.setFilter("highlight", highlightFilter(selectedKey));
  }, [selectedKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("fill")) return;
    map.setPaintProperty("fill", "fill-opacity", countyFilter
      ? ["case", ["==", ["get", "county"], countyFilter], 0.78, 0.12]
      : 0.72);
    if (map.getLayer("county-highlight")) {
      map.setFilter("county-highlight", countyFilter
        ? ["==", ["get", "geoid"], countyGeoid(countyFilter)]
        : ["==", ["get", "geoid"], "__none__"]);
    }
    fitView(map, featuresRef.current, countyFilter);
  }, [countyFilter]);

  const onQuery = (q) => {
    setQuery(q);
    const t = q.trim().toLowerCase();
    if (!t) return setMatches([]);
    const hits = [];
    for (const f of featuresRef.current) {
      const p = f.properties;
      if (countyFilter && p.county !== countyFilter) continue;
      const label = `${p.precinct_id} · ${p.county}`;
      if (label.toLowerCase().includes(t)) {
        hits.push({ key: precinctKey(p.county, p.precinct_id), label });
      }
      if (hits.length >= 8) break;
    }
    setMatches(hits);
  };
  const choose = (key) => {
    setQuery(""); setMatches([]);
    onSelectRef.current(key);
    const map = mapRef.current;
    const [county, precinctId] = parsePrecinctKey(key);
    const f = featuresRef.current.find(
      (x) => x.properties.county === county && x.properties.precinct_id === precinctId,
    );
    if (map && f) map.fitBounds(featureBounds(f), { padding: 60, maxZoom: 12 });
  };

  const showMarker = (lng, lat) => {
    const map = mapRef.current;
    if (!map || !Number.isFinite(lng) || !Number.isFinite(lat)) return;
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: UA.azred });
    }
    markerRef.current.setLngLat([lng, lat]).addTo(map);
  };

  const handleLocate = async (result) => {
    const fc = data ?? (featuresRef.current.length ? { features: featuresRef.current } : null);
    if (!fc?.features?.length) {
      throw new Error("Precinct map is still loading. Wait a moment and try again.");
    }
    const hit = await findPrecinctAt(result.lng, result.lat, precinctYear, fc);
    if (!hit) {
      showMarker(result.lng, result.lat);
      const map = mapRef.current;
      if (map) map.flyTo({ center: [result.lng, result.lat], zoom: 11, duration: 800 });
      throw new Error("Address found, but no matching precinct polygon.");
    }
    choose(hit.key);
    showMarker(result.lng, result.lat);
  };

  return (
    <div className="mapwrap" ref={wrapRef}>
      <div ref={mapContainerRef} className="map-canvas" aria-hidden="true" />
      <div className="map-tools">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search a precinct…"
          aria-label="Search a precinct"
          className="map-search-input"
        />
        {matches.length > 0 && (
          <div className="map-search-results">
            {matches.map((m) => (
              <button key={m.key} type="button" onClick={() => choose(m.key)}
                className="map-search-hit"
                onMouseDown={(e) => e.preventDefault()}>
                {m.label}
              </button>
            ))}
          </div>
        )}
        <LocatePanel mode="precinct" onResult={handleLocate} />
      </div>
    </div>
  );
}

function fitView(map, features, county) {
  if (!map) return;
  if (!county) {
    fitArizonaState(map, { animate: true });
    return;
  }
  if (!features?.length) return;
  try {
    const b = new maplibregl.LngLatBounds();
    for (const f of features) {
      if (f.properties.county !== county) continue;
      b.extend(featureBounds(f));
    }
    if (!b.isEmpty()) map.fitBounds(b, { ...AZ_FIT_OPTIONS_COUNTY, animate: true });
    else fitArizonaState(map, { animate: true });
  } catch { fitArizonaState(map, { animate: false }); }
}
