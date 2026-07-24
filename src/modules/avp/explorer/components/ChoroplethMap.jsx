"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import LocatePanel from "@/modules/avp/explorer/components/LocatePanel";
import { NO_DATA, UA } from "@/modules/avp/shared/lib/colors";
import { geoidForGeo, GEO_TO_GEOID_KEY, GEOID_KEY_TO_GEO } from "@/modules/avp/explorer/lib/geocode";
import { AZ_FIT_OPTIONS, AZ_FIT_OPTIONS_COUNTY, AZ_MAP_INIT, fitArizonaState } from "@/modules/avp/shared/lib/map-bounds";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";

// MapLibre choropleth over a light CARTO raster basemap (streets/places show
// through a semi-transparent fill). Geography-agnostic: it (re)loads
// /tiles/<geo>.geojson on `geo` change and paints from `colors` keyed on the
// feature `geoid`. Includes a client-side unit search and a hover tooltip.
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

function matchExpr(colors) {
  const pairs = [];
  for (const [geoid, color] of Object.entries(colors)) pairs.push(geoid, color);
  if (pairs.length === 0) return NO_DATA;
  return ["match", ["get", "geoid"], ...pairs, NO_DATA];
}

function featureBounds(f) {
  const b = new maplibregl.LngLatBounds();
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) for (const pt of ring) b.extend(pt);
  return b;
}

function fitGeoFeatures(map, features, animate = false) {
  const b = new maplibregl.LngLatBounds();
  for (const f of features) {
    const fb = featureBounds(f);
    if (!fb.isEmpty()) b.extend(fb);
  }
  if (!b.isEmpty()) map.fitBounds(b, { ...AZ_FIT_OPTIONS_COUNTY, animate });
  else fitArizonaState(map, { animate });
}

export default function ChoroplethMap({
  geo, colors, selectedGeoid, onSelect, describe, fitToData = false, showLocate = true,
  onGeoChange, pendingLocate, onLocateApplied,
}) {
  const wrapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const featuresRef = useRef([]);
  const popupRef = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [featuresVersion, setFeaturesVersion] = useState(0);

  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const colorsRef = useRef(colors); colorsRef.current = colors;
  const selectedRef = useRef(selectedGeoid); selectedRef.current = selectedGeoid;
  const describeRef = useRef(describe); describeRef.current = describe;

  // init once
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
    map.on("click", (e) => { const f = pick(e); if (f) onSelectRef.current(f.properties.geoid); });
    map.on("mousemove", (e) => {
      const f = pick(e);
      map.getCanvas().style.cursor = f ? "pointer" : "";
      const text = f && describeRef.current ? describeRef.current(f.properties.geoid) : null;
      if (text) popupRef.current.setLngLat(e.lngLat).setHTML(text).addTo(map);
      else popupRef.current.remove();
    });
    map.on("mouseout", () => popupRef.current.remove());
    map.on("load", () => { readyRef.current = true; });
    return () => map.remove();
  }, []);

  // (re)load geometry on geography change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    setQuery(""); setMatches([]);

    const run = async () => {
      if (!readyRef.current) await new Promise((res) => map.once("load", res));
      if (cancelled) return;
      for (const id of ["fill", "line", "highlight"]) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource("geo")) map.removeSource("geo");

      const url = publicUrl(`tiles/${geo}.geojson`);
      let geojson;
      try {
        geojson = await fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
      } catch { featuresRef.current = []; return; }
      if (cancelled) return;
      featuresRef.current = geojson.features;
      setFeaturesVersion((v) => v + 1);

      map.addSource("geo", { type: "geojson", data: geojson, promoteId: "geoid" });
      map.addLayer({ id: "fill", type: "fill", source: "geo",
        paint: { "fill-color": matchExpr(colorsRef.current), "fill-opacity": 0.62 } });
      map.addLayer({ id: "line", type: "line", source: "geo",
        paint: { "line-color": "#54687a", "line-width": 0.5, "line-opacity": 0.6 } });
      map.addLayer({ id: "highlight", type: "line", source: "geo",
        paint: { "line-color": UA.azblue, "line-width": 3 },
        filter: ["==", ["get", "geoid"], selectedRef.current ?? "__none__"] });

      // Discrete geographies (county, cd, ld) fit their boundaries; fine layers use full state.
      if (fitToData) fitGeoFeatures(map, geojson.features, false);
      else fitArizonaState(map, { animate: false });
    };
    run();
    return () => { cancelled = true; };
  }, [geo, fitToData]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer("fill")) map.setPaintProperty("fill", "fill-color", matchExpr(colors));
  }, [colors]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer("highlight"))
      map.setFilter("highlight", ["==", ["get", "geoid"], selectedGeoid ?? "__none__"]);
  }, [selectedGeoid]);

  const flyToGeoid = (id) => {
    if (!id) return;
    onSelectRef.current(id);
    const map = mapRef.current;
    const f = featuresRef.current.find((x) => x.properties.geoid === id);
    if (map && f) map.fitBounds(featureBounds(f), { padding: 60, maxZoom: fitToData ? 9 : 11 });
  };

  const showMarker = (lng, lat) => {
    const map = mapRef.current;
    if (!map || !Number.isFinite(lng) || !Number.isFinite(lat)) return;
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: UA.azred });
    }
    markerRef.current.setLngLat([lng, lat]).addTo(map);
    if (!featuresRef.current.some((f) => f.properties.geoid === selectedRef.current)) {
      map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 10), duration: 800 });
    }
  };

  useEffect(() => {
    if (!pendingLocate || !featuresRef.current.length) return;
    const pickKey = pendingLocate._pickGeo ?? GEO_TO_GEOID_KEY[geo];
    const id = pickKey ? pendingLocate.geoids[pickKey] : geoidForGeo(pendingLocate, geo);
    if (id) flyToGeoid(id);
    showMarker(pendingLocate.lng, pendingLocate.lat);
    onLocateApplied?.();
  }, [pendingLocate, geo, featuresVersion]);

  // client-side unit search over the loaded features
  const onQuery = (q) => {
    setQuery(q);
    const t = q.trim().toLowerCase();
    if (!t) return setMatches([]);
    const hits = [];
    for (const f of featuresRef.current) {
      const id = f.properties.geoid;
      const label = describeRef.current ? describeRef.current(id, true) : id.replace(/^AZ-[A-Z]+-/, "");
      if (id.toLowerCase().includes(t) || label.toLowerCase().includes(t)) hits.push({ id, label });
      if (hits.length >= 8) break;
    }
    setMatches(hits);
  };
  const choose = (id) => {
    setQuery(""); setMatches([]);
    onSelectRef.current(id);
    const map = mapRef.current;
    const f = featuresRef.current.find((x) => x.properties.geoid === id);
    if (map && f) map.fitBounds(featureBounds(f), { padding: 60, maxZoom: 11 });
  };

  const handleLocate = (result) => {
    const pickKey = result._pickGeo ?? GEO_TO_GEOID_KEY[geo];
    const targetGeo = pickKey ? GEOID_KEY_TO_GEO[pickKey] : geo;
    if (result._pickGeo && targetGeo && targetGeo !== geo && onGeoChange) {
      onGeoChange(targetGeo, result);
      showMarker(result.lng, result.lat);
      return;
    }
    const id = pickKey ? result.geoids[pickKey] : geoidForGeo(result, geo);
    if (id) flyToGeoid(id);
    else if (mapRef.current) {
      mapRef.current.flyTo({ center: [result.lng, result.lat], zoom: 10, duration: 800 });
    }
    showMarker(result.lng, result.lat);
  };

  return (
    <div className="mapwrap" ref={wrapRef}>
      <div ref={mapContainerRef} className="map-canvas" aria-hidden="true" />
      <div className="map-tools">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search an area…"
          aria-label="Search an area"
          className="map-search-input"
        />
        {matches.length > 0 && (
          <div className="map-search-results">
            {matches.map((m) => (
              <button key={m.id} type="button" onClick={() => choose(m.id)}
                className="map-search-hit"
                onMouseDown={(e) => e.preventDefault()}>
                {m.label}
              </button>
            ))}
          </div>
        )}
        {showLocate && (
          <LocatePanel mode="explorer" geo={geo} onResult={handleLocate} />
        )}
      </div>
    </div>
  );
}
