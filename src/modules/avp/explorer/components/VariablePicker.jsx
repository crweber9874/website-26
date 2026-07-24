"use client";

// Grouped color-by selector. Sections are built from the variables actually
// present in the selected geography (see Explorer -> buildGroups), so every
// measure in the data shows up.
export default function VariablePicker({ groups, value, onChange, labelFor }) {
  return (
    <div className="panel">
      <h4>Color the map by</h4>
      {groups.map((g) => (
        <div className="vargroup" key={g.id}>
          <div className="gl">{g.label}</div>
          {g.vars.map((v) => (
            <button
              key={v}
              className="varbtn"
              aria-pressed={value === v}
              onClick={() => onChange(v)}
            >
              {labelFor(v)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
