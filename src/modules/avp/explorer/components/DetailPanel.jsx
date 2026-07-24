"use client";
import { labelFor, formatValue } from "@/modules/avp/shared/lib/variables";
import { PARTY } from "@/modules/avp/shared/lib/colors";

const TITLE = {
  cd: "Congressional District",
  county: "County",
  ld: "Legislative District",
  tract: "Census Tract",
  zcta: "ZCTA",
  zip: "ZIP",
  blockgroup: "Block Group",
};

function unitName(geoid, geo) {
  const tail = geoid.replace(/^AZ-[A-Z]+-/, "");
  if (geo === "county") return tail.charAt(0) + tail.slice(1).toLowerCase();
  if (geo === "cd" || geo === "ld") return `${TITLE[geo]} ${Number(tail)}`;
  return `${TITLE[geo] ?? geo} ${tail}`;
}

const glStyle = {
  fontFamily: "var(--mono)",
  fontSize: 11,
  color: "var(--faint)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: "10px 0 2px",
};

// Click-to-detail: party split (when present) + every measure in the data,
// grouped the same way as the picker.
export default function DetailPanel({ record, geo, groups, units }) {
  if (!record) {
    return (
      <div className="panel detail">
        <h4>Detail</h4>
        <p className="note">Select a unit on the map to see its full profile.</p>
      </div>
    );
  }

  const v = record.values;
  const hasParty = v.party_share_dem != null || v.party_share_rep != null;
  const dem = v.party_share_dem ?? 0;
  const rep = v.party_share_rep ?? 0;
  const oth = v.party_share_oth ?? 0;

  return (
    <div className="panel detail">
      <div className="did">{unitName(record.geoid, geo)}</div>
      <div className="dsub">
        {record.n != null ? `${record.n.toLocaleString("en-US")} registrants` : "—"}
      </div>

      {hasParty && (
        <>
          <div className="gl" style={glStyle}>Party registration</div>
          <div
            className="party"
            role="img"
            aria-label={`Democratic ${(dem * 100).toFixed(0)}%, Republican ${(rep * 100).toFixed(0)}%, other ${(oth * 100).toFixed(0)}%`}
          >
            <i className="dem" style={{ width: `${dem * 100}%` }} />
            <i className="rep" style={{ width: `${rep * 100}%` }} />
            <i className="oth" style={{ width: `${oth * 100}%` }} />
          </div>
          <div className="legend" style={{ marginBottom: 14 }}>
            <span><span className="sw" style={{ background: PARTY.dem }} />Democratic share {formatValue(dem, "share")}</span>
            <span><span className="sw" style={{ background: PARTY.rep }} />Republican share {formatValue(rep, "share")}</span>
            <span><span className="sw" style={{ background: PARTY.oth }} />Other {formatValue(oth, "share")}</span>
          </div>
        </>
      )}

      {groups.map((g) => (
        <div key={g.id}>
          <div className="gl" style={glStyle}>{g.label}</div>
          {g.vars.map((name) => (
            <div className="kv" key={name}>
              <span className="k">{labelFor(name)}</span>
              <span className="v">{formatValue(v[name], units[name])}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
