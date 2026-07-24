// Point-in-polygon lookup against bundled precinct GeoJSON.
import { precinctKey } from "@/modules/avp/voting/lib/precinct";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";

let cache = null;
let loadPromise = null;

function loadPrecinctGeojson(year = 2024) {
  if (cache?.year === year) return Promise.resolve(cache.fc);
  if (loadPromise?.year === year) return loadPromise.promise;

  const promise = fetch(publicUrl(`data/precinct/precinct_${year}.geojson`))
    .then((r) => {
      if (!r.ok) throw new Error(`Precinct map data unavailable (${r.status})`);
      return r.json();
    })
    .then((fc) => {
      cache = { year, fc };
      loadPromise = null;
      return fc;
    })
    .catch((e) => {
      loadPromise = null;
      const msg = e?.message || "";
      if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
        throw new Error("Could not load precinct boundaries. Check your connection and try again.");
      }
      throw e;
    });

  loadPromise = { year, promise };
  return promise;
}

/** Ray-casting point-in-ring test. Point = [lng, lat]. */
function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    if (!pointInRing(point, geometry.coordinates[0])) return false;
    for (let h = 1; h < geometry.coordinates.length; h++) {
      if (pointInRing(point, geometry.coordinates[h])) return false;
    }
    return true;
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (pointInRing(point, poly[0])) {
        let inHole = false;
        for (let h = 1; h < poly.length; h++) {
          if (pointInRing(point, poly[h])) inHole = true;
        }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

/**
 * Find the precinct containing [lng, lat].
 * Pass `fc` when the map already loaded precinct GeoJSON to skip a second fetch.
 * @returns {{ key: string, county: string, precinctId: string } | null}
 */
export async function findPrecinctAt(lng, lat, year = 2024, fc = undefined) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  let features;
  if (fc?.features?.length) {
    features = fc.features;
  } else if (fc !== undefined) {
    // Caller passed a feature collection (e.g. map still loading) — don't re-fetch.
    return null;
  } else {
    features = (await loadPrecinctGeojson(year)).features;
  }
  const point = [lng, lat];
  for (const f of features) {
    if (pointInPolygon(point, f.geometry)) {
      const { county, precinct_id: precinctId } = f.properties;
      return { key: precinctKey(county, precinctId), county, precinctId };
    }
  }
  return null;
}

/** Pre-warm precinct geometry (optional). */
export function preloadPrecinctGeojson(year = 2024) {
  return loadPrecinctGeojson(year).catch(() => {});
}
