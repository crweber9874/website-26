// U.S. Census Geocoder (JSONP — no CORS, no API key).
// Maps Census geography codes to AVP geoid strings.
//
// THREAT MODEL (static client-side geocoding)
// - Requests originate in the user's browser and go directly to Census; AVP has
//   no server in the path, so we cannot enforce global rate limits or block IPs.
// - A motivated actor can bypass any client-side guard (DevTools, scripted fetch).
// - Risks: Census throttling shared egress IPs, abusive UX on shared machines,
//   and reputational harm if the site is used to hammer a public API.
//
// CLIENT-SIDE MITIGATIONS (this file + LocatePanel)
// - Explicit submit only (no geocode-on-keystroke), debounced clicks, min length,
//   Arizona validation, session rate limit, honeypot, disable while in-flight.
//
// PRODUCTION HARDENING (requires backend / edge)
// - Backend proxy holding a Census API key (if offered) with per-IP + per-key limits.
// - Cloudflare WAF / bot management in front of the proxy route.
// - CAPTCHA (Turnstile/reCAPTCHA) after N lookups or on suspicious traffic.
// - Respect Census batch limits (1k addresses/batch) via server-side queueing.
// - Logging + alerting on proxy 429/5xx; separate quota from user-facing site IP.

const CENSUS_BASE = "https://geocoding.geo.census.gov/geocoder";
const BENCHMARK = "Public_AR_Current";
const VINTAGE = "Current_Current";
const AZ_STATE_FIPS = "04";
const JSONP_TIMEOUT_MS = 18000;

/** Minimum trimmed address length before calling Census. */
export const MIN_ADDRESS_LENGTH = 8;

/** Max geocoder calls per browser tab per rolling minute (sessionStorage). */
export const RATE_LIMIT_MAX = 12;
export const RATE_LIMIT_WINDOW_MS = 60_000;

const RATE_LIMIT_STORAGE_KEY = "avp_geocode_timestamps";

export class GeocodeRateLimitError extends Error {
  constructor(retryAfterMs) {
    super(formatRateLimitMessage(retryAfterMs));
    this.name = "GeocodeRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

function readTimestamps() {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t) => Number.isFinite(t)) : [];
  } catch {
    return [];
  }
}

function writeTimestamps(timestamps) {
  try {
    sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(timestamps));
  } catch {
    // Private mode / quota — still allow the request; best-effort limit only.
  }
}

function pruneTimestamps(now = Date.now()) {
  return readTimestamps().filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
}

/** Remaining calls in the current window; 0 when limited. */
export function geocodeQuotaRemaining() {
  const now = Date.now();
  return Math.max(0, RATE_LIMIT_MAX - pruneTimestamps(now).length);
}

/** Ms until the oldest call in-window ages out; 0 when not limited. */
export function geocodeRetryAfterMs() {
  const now = Date.now();
  const timestamps = pruneTimestamps(now);
  if (timestamps.length < RATE_LIMIT_MAX) return 0;
  const oldest = Math.min(...timestamps);
  return Math.max(0, RATE_LIMIT_WINDOW_MS - (now - oldest) + 250);
}

export function formatRateLimitMessage(retryAfterMs) {
  const secs = Math.ceil(retryAfterMs / 1000);
  return `Too many lookups. Wait ${secs} second${secs === 1 ? "" : "s"} and try again.`;
}

function assertGeocodeAllowed() {
  const retryAfterMs = geocodeRetryAfterMs();
  if (retryAfterMs > 0) throw new GeocodeRateLimitError(retryAfterMs);
}

function recordGeocodeRequest() {
  const now = Date.now();
  writeTimestamps([...pruneTimestamps(now), now]);
}

/** Arizona county FIPS (04001–04027) → AVP county slug. */
export const FIPS_TO_COUNTY = {
  "001": "APACHE",
  "003": "COCHISE",
  "005": "COCONINO",
  "007": "GILA",
  "009": "GRAHAM",
  "011": "GREENLEE",
  "012": "LAPAZ",
  "013": "MARICOPA",
  "015": "MOHAVE",
  "017": "NAVAJO",
  "019": "PIMA",
  "021": "PINAL",
  "023": "SANTACRUZ",
  "025": "YAVAPAI",
  "027": "YUMA",
};

const COUNTY_NAME_TO_SLUG = Object.fromEntries(
  Object.values(FIPS_TO_COUNTY).map((s) => [s, s]),
);

/** Geography layer id (Explorer) → result.geoids key. */
export const GEO_TO_GEOID_KEY = {
  county: "county",
  cd: "cd",
  ld: "ld",
  tract: "tract",
  blockgroup: "blockgroup",
  zcta: "zcta",
};

/** Inverse: geoids key → Explorer geography layer id. */
export const GEOID_KEY_TO_GEO = Object.fromEntries(
  Object.entries(GEO_TO_GEOID_KEY).map(([geo, key]) => [key, geo]),
);

export const GEO_LABELS = {
  county: "County",
  cd: "Congressional district",
  ld: "Legislative district",
  tract: "Census tract",
  blockgroup: "Block group",
  zcta: "ZIP area (ZCTA)",
};

let jsonpSeq = 0;

function censusJsonp(path, params) {
  assertGeocodeAllowed();
  recordGeocodeRequest();

  const qs = new URLSearchParams({
    benchmark: BENCHMARK,
    vintage: VINTAGE,
    format: "json",
    ...params,
  });
  const url = `${CENSUS_BASE}/${path}?${qs}`;

  return new Promise((resolve, reject) => {
    const cb = `censusGeocode${++jsonpSeq}`;
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Geocoder request timed out. Try again."));
    }, JSONP_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
    }

    window[cb] = (data) => {
      cleanup();
      if (!data || data.errors?.length) {
        reject(new Error(
          data?.errors?.[0]?.message || data?.errors?.[0] || "Geocoder returned an unexpected response.",
        ));
        return;
      }
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Could not reach the U.S. Census geocoder. Check your connection or try again."));
    };
    script.src = `${url}&callback=${cb}`;
    document.head.appendChild(script);
  });
}

/** Require Arizona in the query string; append if missing. */
export function normalizeArizonaAddress(raw) {
  const t = raw.trim();
  if (!t) return "";
  if (/\b(AZ|Arizona)\b/i.test(t)) return t;
  return `${t}, Arizona`;
}

/** Client-side hint before calling Census. */
export function looksLikeArizonaAddress(raw) {
  const t = raw.trim();
  if (t.length < MIN_ADDRESS_LENGTH) return false;
  if (/\b(AZ|Arizona)\b/i.test(t)) return true;
  if (/\b85\d{3}(-\d{4})?\b/.test(t)) return true;
  if (/\b86[0-5]\d{3}(-\d{4})?\b/.test(t)) return true;
  return false;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function countySlugFromCensus(countyRec) {
  if (!countyRec) return null;
  const fips = countyRec.COUNTY;
  if (fips && FIPS_TO_COUNTY[fips]) return FIPS_TO_COUNTY[fips];
  const name = (countyRec.NAME || "").replace(/\s+County$/i, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return COUNTY_NAME_TO_SLUG[name] || name || null;
}

function cdFromCensus(cdRec) {
  if (!cdRec) return null;
  const raw = cdRec.CD118 ?? cdRec.CD116 ?? cdRec.BASENAME ?? cdRec.CD;
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? pad2(n) : null;
}

function ldFromCensus(ldRec) {
  if (!ldRec) return null;
  const raw = ldRec.SLDL ?? ldRec.SLDU ?? ldRec.SLDD ?? ldRec.BASENAME ?? ldRec.SLD;
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? pad2(n) : null;
}

function zctaFromAddress(address) {
  const m = address.match(/\b(85\d{3}|86[0-5]\d{3})(?:-\d{4})?\b/);
  return m ? m[1] : null;
}

function firstGeo(geos, ...keys) {
  for (const k of keys) {
    const v = geos[k];
    if (Array.isArray(v) && v.length) return v[0];
  }
  return null;
}

function blockGroupGeoid(blockRec) {
  if (!blockRec) return null;
  const geoid = blockRec.GEOID || blockRec.BLKGRP || "";
  if (geoid.length >= 12) return geoid.slice(0, 12);
  return null;
}

function parseMatch(match, addressForZip) {
  const geos = match.geographies || {};
  const state = firstGeo(geos, "States");
  if (!state || state.STATE !== AZ_STATE_FIPS) {
    throw new Error("That location is outside Arizona.");
  }

  const countyRec = firstGeo(geos, "Counties");
  const countySlug = countySlugFromCensus(countyRec);
  const cdNum = cdFromCensus(firstGeo(geos,
    "118th Congressional Districts",
    "119th Congressional Districts",
    "Congressional Districts",
  ));
  const ldNum = ldFromCensus(firstGeo(geos,
    "2024 State Legislative Districts - Lower",
    "State Legislative Districts (Lower Chamber)",
    "2024 State Legislative Districts (Lower Chamber)",
  ));
  const tractRec = firstGeo(geos, "Census Tracts", "2020 Census Tracts");
  const tractGeoid = tractRec?.GEOID || (tractRec?.STATE && tractRec?.COUNTY && tractRec?.TRACT
    ? `${tractRec.STATE}${tractRec.COUNTY}${tractRec.TRACT}`
    : null);
  const bgRec = firstGeo(geos,
    "2020 Census Block Groups",
    "Census Block Groups",
  );
  let bgGeoid = bgRec?.GEOID || null;
  if (!bgGeoid) bgGeoid = blockGroupGeoid(firstGeo(geos,
    "2020 Census Blocks",
    "Census Blocks",
  ));
  const zcta = zctaFromAddress(addressForZip || match.matchedAddress || "");

  const geoids = {};
  const labels = {};
  if (countySlug) {
    geoids.county = `AZ-COUNTY-${countySlug}`;
    labels.county = `${countySlug.charAt(0)}${countySlug.slice(1).toLowerCase()} County`;
  }
  if (cdNum) {
    geoids.cd = `AZ-CD-${cdNum}`;
    labels.cd = `CD ${Number(cdNum)}`;
  }
  if (ldNum) {
    geoids.ld = `AZ-LD-${ldNum}`;
    labels.ld = `LD ${Number(ldNum)}`;
  }
  if (tractGeoid) {
    geoids.tract = `AZ-TRACT-${tractGeoid}`;
    labels.tract = tractGeoid.slice(-6).replace(/^0+/, "") || tractGeoid;
  }
  if (bgGeoid) {
    geoids.blockgroup = `AZ-BG-${bgGeoid}`;
    labels.blockgroup = bgGeoid;
  }
  if (zcta) {
    geoids.zcta = `AZ-ZCTA-${zcta}`;
    labels.zcta = `ZIP ${zcta}`;
  }

  return {
    lat: match.coordinates.y,
    lng: match.coordinates.x,
    matchedAddress: match.matchedAddress,
    geoids,
    labels,
  };
}

function pickMatch(data) {
  const matches = data?.result?.addressMatches;
  if (!matches?.length) {
    throw new Error("No match found. Try a full street address in Arizona.");
  }
  return matches[0];
}

/** Geocode a one-line Arizona address via Census geographies endpoint. */
export async function geocodeAddress(rawAddress) {
  const address = normalizeArizonaAddress(rawAddress);
  if (!address) throw new Error("Enter a street address in Arizona.");
  if (!looksLikeArizonaAddress(address)) {
    throw new Error("Include a city and AZ (or an Arizona ZIP code).");
  }

  const data = await censusJsonp("geographies/onelineaddress", { address });
  return parseMatch(pickMatch(data), address);
}

/** Reverse-geocode lat/lng via Census coordinates endpoint. */
export async function geocodeCoordinates(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates.");
  }
  const data = await censusJsonp("geographies/coordinates", {
    x: String(lng),
    y: String(lat),
  });
  const geos = data?.result?.geographies;
  if (!geos) throw new Error("Could not resolve coordinates in Arizona.");
  return parseMatch({
    geographies: geos,
    coordinates: { x: lng, y: lat },
    matchedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  }, "");
}

/** Browser geolocation → Census reverse geocode. */
export function geolocateAndGeocode() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          resolve(await geocodeCoordinates(pos.coords.latitude, pos.coords.longitude));
        } catch (e) {
          reject(e);
        }
      },
      (err) => {
        const msg = err.code === 1
          ? "Location permission denied."
          : "Could not read your location.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/** Geoid for the active Explorer geography layer. */
export function geoidForGeo(result, geo) {
  const key = GEO_TO_GEOID_KEY[geo];
  return key ? result.geoids[key] ?? null : null;
}
