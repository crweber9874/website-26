// Astro/Vite exposes the configured `base` as import.meta.env.BASE_URL
// (e.g. "/"). Normalise to no trailing slash so joins are predictable.
const RAW = (import.meta.env && import.meta.env.BASE_URL) || "/";
const BASE = RAW === "/" ? "" : RAW.replace(/\/$/, "");

/** Root-relative URL for static public assets (data/, tiles/). */
export function publicUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

/** Rewrite root-relative hrefs in trusted HTML copy for subpath hosting. */
export function prefixContentHrefs(html) {
  if (!BASE || !html) return html;
  return html.replace(/href="(\/(?!\/)[^"]*)"/g, (_, path) => `href="${BASE}${path}"`);
}
