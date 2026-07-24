"use client";
import { useEffect, useMemo, useState } from "react";
import { reshape } from "@/modules/avp/shared/lib/reshape";
import { buildGroups, labelFor, formatValue } from "@/modules/avp/shared/lib/variables";
import { publicUrl } from "@/modules/avp/shared/lib/public-url";

const GEOS = [
  { id: "county", label: "County" },
  { id: "cd", label: "Congressional district" },
  { id: "ld", label: "Legislative district" },
  { id: "zcta", label: "ZIP area (ZCTA)" },
  { id: "tract", label: "Census tract" },
];

export default function SearchApp() {
  const [geo, setGeo] = useState("county");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sortVar, setSortVar] = useState("total_registered");
  const [dir, setDir] = useState(-1);
  const [cols, setCols] = useState(["total_registered", "party_share_dem", "party_share_rep", "voter_median_age"]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let c = false;
    setLoading(true);
    fetch(publicUrl(`data/${geo}/summary.json`))
      .then((r) => r.json())
      .then((rows) => { if (!c) { setData(reshape(rows)); setLoading(false); } })
      .catch(() => !c && setLoading(false));
    return () => { c = true; };
  }, [geo]);

  const numeric = useMemo(
    () => (data ? data.variables.filter((v) => data.geoids.some((g) => Number.isFinite(data.byGeoid[g].values[v]))) : []),
    [data],
  );

  // keep column + sort selections valid for the current geography
  useEffect(() => {
    if (!data) return;
    setCols((cs) => {
      const keep = cs.filter((c) => numeric.includes(c));
      return keep.length ? keep : numeric.slice(0, 4);
    });
    if (!numeric.includes(sortVar)) setSortVar(numeric.includes("total_registered") ? "total_registered" : numeric[0]);
  }, [data, numeric, sortVar]);

  const rows = useMemo(() => {
    if (!data) return [];
    let gs = data.geoids;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      gs = gs.filter((g) => g.toLowerCase().includes(s));
    }
    return [...gs].sort((a, b) => {
      const av = data.byGeoid[a].values[sortVar];
      const bv = data.byGeoid[b].values[sortVar];
      const an = Number.isFinite(av) ? av : -Infinity;
      const bn = Number.isFinite(bv) ? bv : -Infinity;
      return (an - bn) * dir;
    });
  }, [data, q, sortVar, dir]);

  const groups = useMemo(() => buildGroups(numeric), [numeric]);
  const toggleCol = (v) => setCols((cs) => (cs.includes(v) ? cs.filter((c) => c !== v) : [...cs, v]));
  const setSort = (v) => { if (v === sortVar) setDir((d) => -d); else { setSortVar(v); setDir(-1); } };
  const name = (g) => g.replace(/^AZ-[A-Z]+-/, "");

  return (
    <div className="search">
      <div className="search-bar">
        <div className="georow">
          {GEOS.map((g) => (
            <button key={g.id} className="varbtn" aria-pressed={geo === g.id} onClick={() => setGeo(g.id)}>{g.label}</button>
          ))}
        </div>
        <input
          className="search-input"
          placeholder="Filter units by id (e.g. MARICOPA, 85281, 0401900…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="colpicker">
          <button className="varbtn" onClick={() => setPickerOpen((o) => !o)} aria-expanded={pickerOpen}>
            Columns ({cols.length}) ▾
          </button>
          {pickerOpen && (
            <div className="colmenu">
              {groups.map((grp) => (
                <div key={grp.id} className="colgroup">
                  <div className="gl">{grp.label}</div>
                  {grp.vars.map((v) => (
                    <label key={v} className="colopt">
                      <input type="checkbox" checked={cols.includes(v)} onChange={() => toggleCol(v)} />
                      {labelFor(v)}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="search-meta">
        {loading ? "Loading…" : `${rows.length.toLocaleString("en-US")} of ${data?.geoids.length.toLocaleString("en-US")} units · click a column to sort`}
      </div>

      <div className="search-table-wrap">
        <table className="search-table">
          <thead>
            <tr>
              <th className="sticky-col">Unit</th>
              {cols.map((v) => (
                <th key={v} onClick={() => setSort(v)} className={sortVar === v ? "sorted" : ""}>
                  {labelFor(v)}{sortVar === v ? (dir < 0 ? " ▼" : " ▲") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 500).map((g) => (
              <tr key={g}>
                <td className="sticky-col">{name(g)}</td>
                {cols.map((v) => (
                  <td key={v} className="num">{formatValue(data.byGeoid[g].values[v], data.units[v])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 500 && <div className="search-meta">Showing first 500 — refine the filter to narrow.</div>}
      </div>
    </div>
  );
}
