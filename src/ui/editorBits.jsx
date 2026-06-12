// Shared editor building blocks used across Destinations & Weekend Trips.
import { useState } from "react";
import Icon from "./icons.jsx";
import { Input, IconButton, Button } from "./kit.jsx";
import { IconPicker, guessIcon } from "./travelIcons.jsx";

export const priceNum = (s) => parseInt(String(s || "").replace(/[^0-9]/g, ""), 10) || 0;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Turn selected months into a readable label ("Sep – May" / "Year-round" / "Mar, Jun").
export const monthsLabel = (months) => {
  if (!months?.length) return "";
  if (months.length >= 12) return "Year-round";
  const idx = [...new Set(months.map((m) => MONTHS.indexOf(m)).filter((i) => i >= 0))].sort((a, b) => a - b);
  if (idx.length === 1) return MONTHS[idx[0]];
  let gapStart = 0, gapSize = -1;
  for (let i = 0; i < idx.length; i++) {
    const gap = (idx[(i + 1) % idx.length] - idx[i] + 12) % 12;
    if (gap > gapSize) { gapSize = gap; gapStart = (i + 1) % idx.length; }
  }
  const start = idx[gapStart], end = idx[(gapStart - 1 + idx.length) % idx.length];
  const arcLen = ((end - start + 12) % 12) + 1;
  return arcLen === idx.length ? `${MONTHS[start]} – ${MONTHS[end]}` : idx.map((i) => MONTHS[i]).join(", ");
};

export function MonthPicker({ value = [], onChange }) {
  const toggle = (m) => {
    const set = new Set(value);
    set.has(m) ? set.delete(m) : set.add(m);
    onChange(MONTHS.filter((x) => set.has(x)));
  };
  return (
    <div className="month-grid">
      {MONTHS.map((m) => (
        <button type="button" key={m} className={`month-cell ${value.includes(m) ? "on" : ""}`} onClick={() => toggle(m)}>{m}</button>
      ))}
    </div>
  );
}

// Compact highlight rows: drag handle + icon picker + text. Item shape { text, icon }.
export function HighlightsEditor({ value = [], onChange, placeholder = "North Goa beaches" }) {
  const [dragIndex, setDragIndex] = useState(null);
  const update = (i, patch) => onChange(value.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { text: "", icon: "" }]);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    const next = [...value];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };
  const setText = (i, text) => {
    const cur = value[i];
    update(i, { text, icon: cur.icon || (text ? guessIcon(text) : "") });
  };
  return (
    <div className="string-list">
      {value.map((h, i) => (
        <div className={`string-row ${dragIndex === i ? "dragging" : ""}`} key={i}
          onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); reorder(dragIndex, i); setDragIndex(null); }}>
          <span className="drag-dot" draggable onDragStart={() => setDragIndex(i)} onDragEnd={() => setDragIndex(null)} title="Drag to reorder">
            <Icon name="grip" size={14} />
          </span>
          <IconPicker value={h.icon} onChange={(icon) => update(i, { icon })} />
          <Input value={h.text} placeholder={placeholder} onChange={(e) => setText(i, e.target.value)} />
          <IconButton name="chevronUp" size="sm" title="Move up" onClick={() => move(i, -1)} />
          <IconButton name="chevronDown" size="sm" title="Move down" onClick={() => move(i, 1)} />
          <IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => remove(i)} />
        </div>
      ))}
      <div><Button variant="ghost" size="sm" icon="plus" onClick={add}>Add highlight</Button></div>
    </div>
  );
}
