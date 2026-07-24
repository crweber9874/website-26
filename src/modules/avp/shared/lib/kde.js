// Shared Gaussian KDE (Silverman bandwidth) for histogram overlays.
// bwMult scales the rule-of-thumb bandwidth (1 = default).
export function silvermanBandwidth(vals) {
  const n = vals.length;
  if (n < 2) return 1e-9;
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1e-9;
  return 1.06 * sd * Math.pow(n, -0.2) || 1e-9;
}

export function kdeCounts(vals, centers, binW, bwMult = 1) {
  const n = vals.length;
  if (n < 2) return centers.map(() => 0);
  const bw = silvermanBandwidth(vals) * bwMult;
  const K = (u) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  return centers.map((x) => {
    let d = 0;
    for (const v of vals) d += K((x - v) / bw);
    return (d / (n * bw)) * n * binW;
  });
}

export function univariateStats(vals) {
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const q = (p) => sorted[Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))];
  return {
    n,
    mean,
    median: q(0.5),
    sd,
    min: sorted[0],
    max: sorted[n - 1],
    p25: q(0.25),
    p75: q(0.75),
  };
}

export function histModel(vals, nb = null) {
  if (vals.length < 3) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const NB = nb ?? Math.min(28, Math.max(10, Math.round(Math.sqrt(vals.length))));
  const w = (max - min) / NB || 1;
  const counts = Array(NB).fill(0);
  const centers = Array.from({ length: NB }, (_, i) => min + (i + 0.5) * w);
  for (const v of vals) counts[Math.min(NB - 1, Math.max(0, Math.floor((v - min) / w)))]++;
  return { min, max, w, NB, counts, centers, n: vals.length };
}
