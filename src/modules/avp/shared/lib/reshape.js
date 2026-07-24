// Pure, client-safe reshape of the tidy-long artifact into the explorer's
// lookup shape. No node built-ins here so it can be imported into client
// components (server-side loading lives in data.js, which calls this).
//   byGeoid[geoid] = { geoid, n, values: { variable: value } }
//   domains[variable] = [min, max]   (choropleth normalization)
//   units[variable]   = unit          (carried by the data itself)
export function reshape(rows) {
  const byGeoid = {};
  const domains = {};
  const units = {};
  let fileDate = null;
  let vintage = null;

  for (const r of rows) {
    fileDate ??= r.file_date;
    vintage ??= r.vintage;
    units[r.variable] ??= r.unit;
    (byGeoid[r.geoid] ??= { geoid: r.geoid, n: r.n, values: {} }).values[r.variable] = r.value;
    if (r.value != null && Number.isFinite(r.value)) {
      const d = (domains[r.variable] ??= [Infinity, -Infinity]);
      if (r.value < d[0]) d[0] = r.value;
      if (r.value > d[1]) d[1] = r.value;
    }
  }

  return {
    byGeoid,
    domains,
    units,
    fileDate,
    vintage,
    geoids: Object.keys(byGeoid).sort(),
    variables: Object.keys(units).sort(),
  };
}
