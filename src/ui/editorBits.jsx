// Shared editor building blocks used across Destinations & Weekend Trips.
import { useState, useRef, useEffect } from "react";
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

// Multi-select dropdown for travellers — pick individuals or whole groups.
export function PeoplePicker({ value = [], onChange, travelers = [], groups = [] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const selected = travelers.filter((t) => value.includes(t.id));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const addGroup = (g) => { const ids = new Set(value); (g.memberIds || []).forEach((id) => ids.add(id)); onChange([...ids]); };
  const ql = q.toLowerCase();
  const fPeople = travelers.filter((t) => !q || (t.name || "").toLowerCase().includes(ql));
  const fGroups = groups.filter((g) => !q || (g.name || "").toLowerCase().includes(ql));
  return (
    <div className="people-picker" ref={ref}>
      <div className="people-chips" onClick={() => setOpen(true)}>
        {selected.length === 0 ? <span className="tiny" style={{ color: "var(--text-3)" }}>No travellers selected — click to add</span> : selected.map((t) => (
          <span className="tag-chip" key={t.id}>{t.name} <span style={{ opacity: 0.6, fontWeight: 400 }}>· {t.group}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); toggle(t.id); }} aria-label={`Remove ${t.name}`}><Icon name="close" size={12} /></button>
          </span>
        ))}
        <button type="button" className="people-add" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}><Icon name="plus" size={14} /> Add</button>
      </div>
      {open && (
        <div className="people-pop">
          <input className="icon-pop-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or groups…" />
          <div className="people-pop-list">
            {fGroups.length > 0 && <div className="pop-label">Groups</div>}
            {fGroups.map((g) => (
              <button type="button" key={g.id} className="pop-row" onClick={() => addGroup(g)}>
                <Icon name="users" size={15} /><span className="grow">{g.name}</span><span className="tiny">{(g.memberIds || []).length} people · add all</span>
              </button>
            ))}
            <div className="pop-label">People</div>
            {fPeople.length === 0 && <div className="tiny" style={{ padding: 8, color: "var(--text-3)" }}>No matches</div>}
            {fPeople.map((t) => {
              const on = value.includes(t.id);
              return (
                <button type="button" key={t.id} className={`pop-row ${on ? "on" : ""}`} onClick={() => toggle(t.id)}>
                  <span className="pop-check">{on ? <Icon name="check" size={14} /> : null}</span>
                  <span className="grow">{t.name}</span><span className="tiny">{t.group} · {t.age}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
