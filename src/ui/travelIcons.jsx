// Travel / activity icon library used by highlights & experiences.
// Stroke-based 24x24 paths (same style as ui/icons.jsx) so they render crisp at
// any size and match the admin's line-icon look. Multi-stroke icons pack
// several subpaths into one `d` string.
import { useEffect, useRef, useState } from "react";
import Icon from "./icons.jsx";

export const TRAVEL_ICONS = {
  mountain: "M8 3l4 8 5-5 5 15H2z",
  waves: "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4",
  sunset: "M12 10V2M4.9 10.9l1.4 1.4M2 18h2M20 18h2M17.7 12.3l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0",
  tree: "M12 2L5 12h4l-4 7h14l-4-7h4L12 2zM12 19v3",
  leaf: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6",
  flower: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 7.5V3M12 16.5V21M7.5 12H3M16.5 12H21M8.8 8.8 6 6M15.2 8.8 18 6M8.8 15.2 6 18M15.2 15.2 18 18",
  camera: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 8l-2 6-6 2 2-6 6-2z",
  binoculars: "M5 22a3 3 0 0 1-3-3v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3zM19 22a3 3 0 0 0 3-3v-2a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2a3 3 0 0 0 3 3zM10 15h4M9 15V5a2 2 0 0 1 2-2M15 15V5a2 2 0 0 0-2-2",
  landmark: "M12 2 2 8h20L12 2zM6 11v7M10 11v7M14 11v7M18 11v7M3 22h18M4 18h16",
  ship: "M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M4 18l-1-7 9-3 9 3-1 7M12 8V4M9 4h6",
  anchor: "M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 7v15M5 12H2a10 10 0 0 0 20 0h-3M5 12l2 2M19 12l-2 2",
  fish: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zM18 11h.01M2 12l-1-2M2 12l-1 2",
  plane: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
  car: "M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14a2 2 0 0 1 2 2v4H3v-4a2 2 0 0 1 2-2zM7 17v2M17 17v2M7 14h.01M17 14h.01",
  bed: "M2 4v16M2 9h16a4 4 0 0 1 4 4v7M22 14H2M6 9V6h7v3",
  utensils: "M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2M5 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  coffee: "M10 2v2M14 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1M6 2v2",
  martini: "M3 3h18l-9 11zM12 14v8M8 22h8",
  ticket: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2zM13 5v14",
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  shopping: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  snowflake: "M12 2v20M2 12h20M5 5l14 14M19 5 5 19M12 2l-2 3M12 2l2 3M2 12l3-2M2 12l3 2M22 12l-3-2M22 12l-3 2M12 22l-2-3M12 22l2-3",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z",
  star: "M12 2l3 6.5 7 .9-5 4.9 1.2 7L12 18l-6.2 3.3L7 14.3l-5-4.9 7-.9L12 2z",
  mappin: "M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  // ---- info / good-to-know utility icons ----
  wallet: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4z",
  creditcard: "M2 5h20v14H2zM2 10h20M6 15h4",
  passport: "M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 17h6",
  plug: "M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z",
  wifi: "M5 12.55a11 11 0 0 1 14 0M8.5 16.1a6 6 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0M12 20h.01",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  calendar: "M3 5h18v16H3zM3 9h18M8 3v4M16 3v4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  key: "M15 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM13 9l-9 9v3h3l1-1v-2h2v-2h2l1-1",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z",
  umbrella: "M12 2a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 11v8a2 2 0 0 0 4 0",
  thermometer: "M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z",
  language: "M2 5h12M8 3v2M5 14c2.5-1 5-3.5 6-9M3 9c1.5 2.5 4 4.5 7 5M13 21l5-11 5 11M15 17h6",
};

export const TRAVEL_ICON_KEYS = Object.keys(TRAVEL_ICONS);

export function TravelIcon({ name, size = 18, className, style }) {
  const d = TRAVEL_ICONS[name];
  if (!d) return null;
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// Smart default: guess an icon from a highlight's text.
const GUESS = [
  [/(beach|sea|water sport|surf|lagoon|coast|shack)/, "waves"],
  [/(sunset)/, "sunset"],
  [/(sunrise|volcano|mount|mountain|peak|hill|trek|hike)/, "mountain"],
  [/(temple|church|fort|palace|heritage|monument|mosque|ruin)/, "landmark"],
  [/(rice|terrace|forest|jungle|nature|park|garden|valley|plantation tour)/, "tree"],
  [/(coffee|plantation|cafe|tea)/, "coffee"],
  [/(food|cuisine|dinner|lunch|cooking|street food|dine)/, "utensils"],
  [/(club|night|bar|party|pub)/, "martini"],
  [/(cruise|boat|ferry|island|dhow|kayak|sail)/, "ship"],
  [/(snorkel|dive|reef|fish|aquarium)/, "fish"],
  [/(shopping|market|souk|mall|bazaar)/, "shopping"],
  [/(safari|wildlife|zoo|jungle drive)/, "binoculars"],
  [/(photo|viewpoint|view|scenic|gram)/, "camera"],
  [/(spa|wellness|yoga|massage)/, "flower"],
  [/(snow|ski|glacier|ice)/, "snowflake"],
  [/(flight|airport|fly)/, "plane"],
  [/(transfer|drive|cab|road)/, "car"],
  [/(hotel|stay|resort|villa|check-in)/, "bed"],
  [/(ticket|entry|pass|show|fire dance|kecak)/, "ticket"],
  [/(music|concert|festival)/, "music"],
];
export const guessIcon = (text = "") => {
  const t = text.toLowerCase();
  for (const [re, key] of GUESS) if (re.test(t)) return key;
  return "mappin";
};

// Smart default icon for a "good to know" fact, based on its label.
const FACT_GUESS = [
  [/(currency|money|pay|cash|price)/, "wallet"],
  [/(card|payment)/, "creditcard"],
  [/(visa|passport|document)/, "passport"],
  [/(plug|socket|power|adapter)/, "plug"],
  [/(connect|wifi|internet|sim|network|data)/, "wifi"],
  [/(language|speak|english|hindi)/, "language"],
  [/(best time|season|month|when)/, "clock"],
  [/(weather|climate|rain|temperature)/, "umbrella"],
  [/(time zone|timezone|gmt)/, "clock"],
  [/(safety|safe|emergency|police)/, "shield"],
  [/(phone|call|contact)/, "phone"],
  [/(country|region|local)/, "globe"],
];
export const guessFactIcon = (label = "") => {
  const t = label.toLowerCase();
  for (const [re, key] of FACT_GUESS) if (re.test(t)) return key;
  return "info";
};

// Popover icon picker — a button that opens a searchable grid of all icons.
export function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const keys = q ? TRAVEL_ICON_KEYS.filter((k) => k.includes(q.toLowerCase())) : TRAVEL_ICON_KEYS;
  return (
    <div className="icon-picker" ref={ref}>
      <button type="button" className={`icon-picker-btn ${value ? "has" : ""}`} title="Choose icon" onClick={() => setOpen((o) => !o)}>
        {value && TRAVEL_ICONS[value] ? <TravelIcon name={value} size={18} /> : <Icon name="sparkle" size={15} />}
      </button>
      {open && (
        <div className="icon-pop">
          <input className="icon-pop-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons…" />
          <div className="icon-pop-grid">
            <button type="button" className={`icon-opt ${!value ? "on" : ""}`} title="No icon" onClick={() => { onChange(""); setOpen(false); }}>
              <Icon name="close" size={14} />
            </button>
            {keys.map((k) => (
              <button type="button" key={k} className={`icon-opt ${value === k ? "on" : ""}`} title={k} onClick={() => { onChange(k); setOpen(false); }}>
                <TravelIcon name={k} size={18} />
              </button>
            ))}
            {keys.length === 0 && <span className="tiny" style={{ padding: 8, color: "var(--text-3)" }}>No matches</span>}
          </div>
        </div>
      )}
    </div>
  );
}
