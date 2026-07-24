"use client";
import { useEffect, useRef, useState } from "react";
import {
  GEO_LABELS,
  GEO_TO_GEOID_KEY,
  GeocodeRateLimitError,
  MIN_ADDRESS_LENGTH,
  geocodeAddress,
  geocodeQuotaRemaining,
  geocodeRetryAfterMs,
  geolocateAndGeocode,
  looksLikeArizonaAddress,
} from "@/modules/avp/explorer/lib/geocode";

const ORDER = ["county", "cd", "ld", "tract", "blockgroup", "zcta"];

/** Min ms between explicit submit / geolocation clicks (anti double-fire). */
const SUBMIT_DEBOUNCE_MS = 800;
const COLLAPSED_KEY = "avp-locate-collapsed";

function locateErrorMessage(err, mode) {
  if (err instanceof GeocodeRateLimitError) return err.message;
  const msg = err?.message || "";
  if (msg === "Failed to fetch" || msg.includes("NetworkError")) {
    return mode === "precinct"
      ? "Network error loading precinct data or geocoder. Check your connection and try again."
      : "Network error reaching the geocoder. Check your connection and try again.";
  }
  return msg || "Lookup failed.";
}

function PinIcon() {
  return (
    <svg className="locate-pin-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
      />
    </svg>
  );
}

/**
 * Address / geolocation lookup panel.
 *
 * Geocoding runs only on explicit button click or Enter — never on input change
 * or paste — so keystroke/paste spam cannot hit Census directly.
 *
 * Client-side guards (rate limit, honeypot, validation) are bypassable via
 * DevTools; see geocode.js for production hardening (backend proxy, WAF, CAPTCHA).
 *
 * @param {"explorer"|"precinct"} mode
 * @param {string} [geo] — active Explorer geography layer
 * @param {(result: object) => void|Promise<void>} onResult
 */
export default function LocatePanel({ mode = "explorer", geo, onResult }) {
  const [address, setAddress] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const lastSubmitAt = useRef(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(COLLAPSED_KEY) === "1") setCollapsed(true);
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  const setPanelCollapsed = (next) => {
    setCollapsed(next);
    try {
      sessionStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* sessionStorage unavailable */
    }
  };

  const trimmed = address.trim();
  const addressReady = trimmed.length >= MIN_ADDRESS_LENGTH && looksLikeArizonaAddress(trimmed);

  const run = async (fn) => {
    const now = Date.now();
    if (now - lastSubmitAt.current < SUBMIT_DEBOUNCE_MS) {
      setError("Please wait a moment before trying again.");
      return;
    }
    if (geocodeQuotaRemaining() <= 0) {
      setError(new GeocodeRateLimitError(geocodeRetryAfterMs() || 60_000).message);
      return;
    }

    lastSubmitAt.current = now;
    setLoading(true);
    setError("");
    let geocoded = null;
    try {
      geocoded = await fn();
      setResult(geocoded);
    } catch (e) {
      setResult(null);
      setError(locateErrorMessage(e, mode));
      setLoading(false);
      return;
    }
    try {
      await onResult(geocoded);
    } catch (e) {
      setError(locateErrorMessage(e, mode));
    } finally {
      setLoading(false);
    }
  };

  const submitAddress = () => {
    if (honeypot) return;

    if (trimmed.length < MIN_ADDRESS_LENGTH) {
      setError(`Enter at least ${MIN_ADDRESS_LENGTH} characters for a street address.`);
      return;
    }
    if (!looksLikeArizonaAddress(trimmed)) {
      setError("Enter a full Arizona address (include city and AZ, or a ZIP).");
      return;
    }
    run(() => geocodeAddress(trimmed));
  };

  const useMyLocation = () => {
    if (honeypot) return;
    run(geolocateAndGeocode);
  };

  const pickGeoid = async (key) => {
    if (!result?.geoids[key]) return;
    await onResult({ ...result, _pickGeo: key });
  };

  const activeKey = geo ? GEO_TO_GEOID_KEY[geo] : null;

  if (collapsed) {
    return (
      <div className="locate-panel is-collapsed">
        <button
          type="button"
          className="locate-expand"
          onClick={() => setPanelCollapsed(false)}
          aria-expanded="false"
          aria-label="Expand address lookup"
        >
          <PinIcon />
          <span>Find my area</span>
        </button>
      </div>
    );
  }

  return (
    <div className="locate-panel">
      <div className="locate-header">
        <span className="locate-header-title">Find my area</span>
        <button
          type="button"
          className="locate-minimize"
          onClick={() => setPanelCollapsed(true)}
          aria-expanded="true"
          aria-label="Minimize address lookup"
          title="Collapse address lookup panel"
        >
          −
        </button>
      </div>
      {/* Honeypot: hidden from users; bots that fill every field never geocode. */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="locate-honeypot"
      />
      <div className="locate-row">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && addressReady) submitAddress();
          }}
          placeholder={mode === "precinct" ? "Your Arizona address…" : "Find by Arizona address…"}
          aria-label="Arizona street address"
          disabled={loading}
          className="locate-input"
        />
        <button
          type="button"
          className="locate-btn"
          onClick={submitAddress}
          disabled={loading || !addressReady}
        >
          {loading ? "Finding…" : "Find my area"}
        </button>
      </div>
      <div className="locate-actions">
        <button
          type="button"
          className="locate-link"
          onClick={useMyLocation}
          disabled={loading}
        >
          Use my location
        </button>
      </div>
      {error && <p className="locate-error" role="alert">{error}</p>}
      {result && (
        <div className="locate-result">
          <div className="locate-match">{result.matchedAddress}</div>
          <ul className="locate-geos">
            {ORDER.filter((k) => result.geoids[k]).map((k) => (
              <li key={k}>
                <button
                  type="button"
                  className={"locate-geo" + (activeKey === k ? " is-active" : "")}
                  onClick={() => pickGeoid(k)}
                  title={mode === "explorer"
                    ? `Show ${result.labels[k]} on the ${GEO_LABELS[k]} map layer`
                    : undefined}
                >
                  <span className="locate-geo-label">{GEO_LABELS[k]}</span>
                  <span className="locate-geo-val">{result.labels[k]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="locate-privacy">
        Address sent to the U.S. Census Bureau geocoder; not stored by AVP.
      </p>
    </div>
  );
}
