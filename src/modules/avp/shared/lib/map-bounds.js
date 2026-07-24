// Arizona state envelope (official boundary bbox).
export const AZ_BOUNDS = [[-114.816, 31.332], [-109.045, 37.004]];

// Pan limits — asymmetric padding so wide/tall viewports do not clip NW / N edges
// when maxBounds raises the effective minimum zoom.
const MAX_BOUNDS_PAD = { west: 4, south: 3, east: 4, north: 3.5 };
export const AZ_MAX_BOUNDS = [
  [AZ_BOUNDS[0][0] - MAX_BOUNDS_PAD.west, AZ_BOUNDS[0][1] - MAX_BOUNDS_PAD.south],
  [AZ_BOUNDS[1][0] + MAX_BOUNDS_PAD.east, AZ_BOUNDS[1][1] + MAX_BOUNDS_PAD.north],
];

/** Default fit for full-state views (explorer, voting statewide). */
// No low maxZoom cap — capping zoom out (e.g. 5–6) makes the viewport wider than
// maxBounds and MapLibre clips the NW / N edges of the state.
export const AZ_FIT_OPTIONS = { padding: 90, maxZoom: 10 };

/** Tighter fit when zooming to a county or selected unit. */
export const AZ_FIT_OPTIONS_COUNTY = { padding: 48, maxZoom: 9 };

export const AZ_MAP_INIT = {
  bounds: AZ_BOUNDS,
  fitBoundsOptions: AZ_FIT_OPTIONS,
  maxBounds: AZ_MAX_BOUNDS,
  minZoom: 4,
  maxZoom: 14,
  // Required so map canvases can be exported to PNG.
  preserveDrawingBuffer: true,
};

/** Fit the map to the full Arizona state envelope (not data extent). */
export function fitArizonaState(map, options = {}) {
  if (!map) return;
  map.fitBounds(AZ_BOUNDS, { ...AZ_FIT_OPTIONS, ...options });
}
