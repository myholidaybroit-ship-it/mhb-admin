import { useMemo, useState, useEffect } from "react";
import { useStore, slugify } from "../lib/store.jsx";
import { ADVENTURE_THEMES } from "../lib/seed.js";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Textarea, Select, Tabs,
  Repeater, StringList, ImagePicker, ImageGrid, SearchInput, IconButton, ConfirmDialog,
  useToast, Stepper, ChipSelect, PdfPicker, Toggle, TagInput, EmptyState,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import Icon from "../ui/icons.jsx";
import { IconPicker, guessIcon, guessFactIcon } from "../ui/travelIcons.jsx";

const REGIONS = ["India", "International"];
const PKG_TAGS = ["Couple", "Honeymoon", "Friends", "Family", "Group", "Adventure", "Weekend", "Luxury"];
const EXP_PACES = ["Half-day", "Full-day", "Morning", "Evening", "Optional", "2 – 3 hrs"];
const DAY_CHIPS = ["Stay", "Breakfast", "Lunch", "Dinner", "Transfer", "Sightseeing", "Activity", "Flight"];
const PAY_METHODS = ["Credit card", "Debit card", "Internet banking", "Bank transfer", "UPI", "Wallet"];
const IDEAL_OPTIONS = ["Couple", "Solo", "Family", "Friends"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COUNTRIES = [
  "India", "Indonesia", "Thailand", "Malaysia", "Vietnam", "Singapore", "UAE", "Maldives",
  "Sri Lanka", "Nepal", "Bhutan", "Egypt", "Turkey", "Greece", "France", "Switzerland",
  "France & Switzerland", "Italy", "Spain", "Norway", "Japan", "Australia", "Mauritius", "Seychelles",
];

const regionForCountry = (c) => (c === "India" ? "India" : "International");
const priceNum = (s) => parseInt(String(s || "").replace(/[^0-9]/g, ""), 10) || 0;

// Give every package a stable, unique slug (for its own SEO page). Mirrors the
// backend's ensurePackageSlugs so the admin store matches what the API stores.
const derivePackageSlugs = (pkgs = []) => {
  const seen = new Set();
  return pkgs.map((p, i) => {
    const base = slugify(p.slug || p.name || "") || `package-${i + 1}`;
    let slug = base;
    let k = 2;
    while (seen.has(slug)) slug = `${base}-${k++}`;
    seen.add(slug);
    return { ...p, slug };
  });
};
const lowestPackagePrice = (pkgs) => {
  const nums = (pkgs || []).map((p) => priceNum(p.price)).filter(Boolean);
  return nums.length ? "₹" + Math.min(...nums).toLocaleString("en-IN") : "";
};
// Turn a set of selected months into a readable label ("Nov – Feb" / "Year-round" / "Mar, Jun").
const monthsLabel = (months) => {
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

// Group-size behaviour driven by "Ideal for": solo = 1, couple = 2, group = editable range.
const groupMode = (arr = []) => {
  if (arr.includes("Family") || arr.includes("Friends")) return "range";
  if (arr.includes("Couple")) return "couple";
  if (arr.includes("Solo")) return "solo";
  return "range";
};
const groupForMode = (mode, d) =>
  mode === "solo" ? { groupMin: 1, groupMax: 1 }
    : mode === "couple" ? { groupMin: 2, groupMax: 2 }
      : { groupMin: d.groupMin, groupMax: d.groupMax };

function MonthPicker({ value = [], onChange }) {
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

// ---- Per-destination defaults (so the page can render without hardcoded globals) ----
const DEFAULT_AGE_GROUPS = [
  { label: "5 – 17", note: "Kid-friendly", on: false },
  { label: "18 – 25", note: "Youth", on: true },
  { label: "26 – 40", note: "Couples", on: true },
  { label: "41 – 65", note: "Family", on: true },
];
const DEFAULT_CANCELLATION = [
  { window: "30+ days", pct: 90 },
  { window: "15 – 29 days", pct: 50 },
  { window: "7 – 14 days", pct: 25 },
  { window: "Under 7 days", pct: 0 },
];
const DEFAULT_PAYMENT = {
  stages: [
    { label: "Booking", when: "Partial amount", note: "Sum is set per tour operator and confirms your slot." },
    { label: "Balance", when: "Within 3 days", note: "Of paying the booking amount (or earlier if under 30 days to departure)." },
  ],
  methods: ["Credit card", "Debit card", "Internet banking", "Bank transfer"],
  note: "Convenience fees apply on payments made after the booking date (except direct bank transfers).",
};
const DEFAULT_INCLUSIONS = [
  "Accommodation in hand-picked hotels",
  "Daily breakfast at the hotel",
  "All tours & transfers in a private vehicle",
  "Airport pickup and drop-off",
  "Dedicated MyHolidayBro trip advisor",
  "All applicable hotel taxes & service charges",
];
const DEFAULT_EXCLUSIONS = [
  "Airfare (unless a flight-inclusive package is chosen)",
  "GST and TCS as applicable",
  "Optional activities & water sports",
  "Travel insurance",
  "Personal expenses — tips, laundry, calls, alcohol",
  "Anything not mentioned under inclusions",
];
const DEFAULT_FAQS = [
  { q: "How do I book this trip?", a: "Pick a package, send an enquiry, and a dedicated MyHolidayBro advisor will get in touch to lock dates, customise the itinerary, and confirm your booking." },
  { q: "Can the itinerary be customised?", a: "Yes — every trip is tailor-made. Tell your advisor what you'd like to add, skip or upgrade and we'll re-quote." },
  { q: "What's the cancellation policy?", a: "Refunds follow the tiers shown above, based on how far before departure you cancel." },
  { q: "How long do refunds take?", a: "Approved refunds are processed within 45 days to the original payment source." },
];
const defaultGoodToKnow = (d) => {
  const india = d.region === "India";
  return [
    { icon: "wallet", label: "Currency", value: india ? "INR (₹)" : "Pay in ₹" },
    { icon: "passport", label: "Visa", value: india ? "Not required" : d.visa || "Check requirements" },
    { icon: "clock", label: "Best time", value: d.bestTime || "Year-round" },
    { icon: "globe", label: "Language", value: india ? "Hindi · English" : "English guides" },
    { icon: "plug", label: "Plug", value: india ? "Type C / D / M" : "Universal adapter" },
    { icon: "wifi", label: "Connectivity", value: india ? "4G / 5G strong" : "eSIM works" },
  ];
};

function blankDestination() {
  return {
    slug: "", name: "", country: "", region: "India", image: "", imageKey: "",
    fromPrice: "", rating: 4.7, reviews: 0, tagline: "", bestTime: "", bestMonths: [], idealFor: "",
    style: "", groupMin: 2, groupMax: 12, visa: null,
    overview: [], highlights: [], packages: [], itinerary: [],
    experiences: [], ageGroups: structuredClone(DEFAULT_AGE_GROUPS),
    inclusions: [...DEFAULT_INCLUSIONS], exclusions: [...DEFAULT_EXCLUSIONS],
    cancellation: structuredClone(DEFAULT_CANCELLATION), payment: structuredClone(DEFAULT_PAYMENT),
    goodToKnow: [], faqs: structuredClone(DEFAULT_FAQS), relatedSlugs: [],
    galleryKeys: [], themes: [],
  };
}

// Fill any missing section with sensible defaults so older destinations open
// fully populated and the editor always has something to manage.
function normalizeDestination(d) {
  const n = { ...blankDestination(), ...d };
  if (!n.style) n.style = (n.idealFor || "").split("·")[0].trim();
  // Highlights upgraded from plain strings → { text, icon } so each can carry an icon.
  n.highlights = (n.highlights || []).map((h) =>
    typeof h === "string" ? { text: h, icon: guessIcon(h) } : { text: h.text || "", icon: h.icon || "" }
  );
  const pkgSlugSeen = new Set();
  n.packages = (n.packages || []).map((p, pi) => {
    const base = { pdf: { url: "", name: "" }, image: "", slug: "", seoTitle: "", seoDescription: "", ...p };
    base.cities = p.cities || (p.route ? p.route.split("·").map((s) => s.trim()).filter(Boolean) : []);
    // Each package gets its own SEO detail page, so it needs a stable, unique
    // slug within the destination. Honour an admin-typed slug, else derive from
    // the name, and de-duplicate collisions with a numeric suffix.
    const baseSlug = slugify(p.slug || p.name || "") || `package-${pi + 1}`;
    let slug = baseSlug;
    let k = 2;
    while (pkgSlugSeen.has(slug)) slug = `${baseSlug}-${k++}`;
    pkgSlugSeen.add(slug);
    base.slug = slug;
    // Itinerary is per-package. Seed the first package from any legacy
    // destination-level itinerary so existing data isn't lost.
    const days = p.itinerary?.length ? p.itinerary : (pi === 0 ? n.itinerary || [] : []);
    base.itinerary = days.map((it, i) => ({
      day: it.day || i + 1, title: it.title || "", desc: it.desc || "",
      chips: it.chips || ["Stay", "Breakfast", "Transfer", "Sightseeing"],
    }));
    return base;
  });
  n.itinerary = (n.itinerary || []).map((it, i) => ({
    day: it.day || i + 1, title: it.title || "", desc: it.desc || "",
    chips: it.chips || ["Stay", "Breakfast", "Transfer", "Sightseeing"], ...it,
  }));
  if (!n.experiences?.length) {
    n.experiences = (n.highlights || []).slice(0, 6).map((h, i) => ({
      title: h.text || "", pace: EXP_PACES[i % EXP_PACES.length], image: "",
    }));
  }
  if (!n.ageGroups?.length) n.ageGroups = structuredClone(DEFAULT_AGE_GROUPS);
  if (!n.inclusions?.length) n.inclusions = [...DEFAULT_INCLUSIONS];
  if (!n.exclusions?.length) n.exclusions = [...DEFAULT_EXCLUSIONS];
  if (!n.cancellation?.length) n.cancellation = structuredClone(DEFAULT_CANCELLATION);
  if (!n.payment?.stages?.length) n.payment = structuredClone(DEFAULT_PAYMENT);
  if (!n.goodToKnow?.length) n.goodToKnow = defaultGoodToKnow(n);
  n.goodToKnow = n.goodToKnow.map((f) => ({ ...f, icon: f.icon || guessFactIcon(f.label || "") }));
  if (!n.faqs?.length) n.faqs = structuredClone(DEFAULT_FAQS);
  return n;
}

// Compact highlight rows: drag handle + icon picker + text. Each highlight is
// { text, icon }. Typing auto-suggests an icon while none is chosen.
function HighlightsEditor({ value = [], onChange }) {
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
          <Input value={h.text} placeholder="North Goa beaches" onChange={(e) => setText(i, e.target.value)} />
          <IconButton name="chevronUp" size="sm" title="Move up" onClick={() => move(i, -1)} />
          <IconButton name="chevronDown" size="sm" title="Move down" onClick={() => move(i, 1)} />
          <IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => remove(i)} />
        </div>
      ))}
      <div><Button variant="ghost" size="sm" icon="plus" onClick={add}>Add highlight</Button></div>
    </div>
  );
}

function SectionCard({ title, hint, children }) {
  return (
    <div className="card-soft col gap-3">
      <div>
        <div className="field-label" style={{ fontSize: "var(--fs-md)" }}>{title}</div>
        {hint && <div className="field-hint" style={{ marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function DestinationEditor({ value, onClose }) {
  const { upsert, data } = useStore();
  const toast = useToast();
  const [d, setD] = useState(() => normalizeDestination(value || {}));
  const [tab, setTab] = useState("basics");
  const [itinPkg, setItinPkg] = useState(0);
  const isNew = !value;
  const set = (patch) => setD((s) => ({ ...s, ...patch }));
  const setPay = (patch) => setD((s) => ({ ...s, payment: { ...s.payment, ...patch } }));

  const save = () => {
    const slug = d.slug || slugify(d.name);
    if (!d.name.trim()) return toast("Name is required", "error");
    const dup = data.destinations.find((x) => x.slug === slug && x.slug !== value?.slug);
    if (dup) return toast("A destination with this slug already exists", "error");
    // Persist derived fields so listings / front-end stay consistent.
    const derived = {
      slug,
      region: regionForCountry(d.country),
      fromPrice: lowestPackagePrice(d.packages) || d.fromPrice,
      style: (d.themes || [])[0] || d.style || "",
      bestTime: d.bestMonths?.length ? monthsLabel(d.bestMonths) : d.bestTime,
      packages: derivePackageSlugs(d.packages),
      ...groupForMode(groupMode(idealArr), d),
    };
    upsert("destinations", { ...d, ...derived }, "slug");
    toast(isNew ? "Destination created" : "Destination saved");
    onClose();
  };

  // Ideal-for stored as a " · " joined string; edited as chips.
  const idealArr = (d.idealFor || "").split("·").map((s) => s.trim()).filter(Boolean);
  const setIdeal = (arr) => {
    const mode = groupMode(arr);
    const patch = { idealFor: arr.join(" · ") };
    if (mode === "solo") Object.assign(patch, { groupMin: 1, groupMax: 1 });
    else if (mode === "couple") Object.assign(patch, { groupMin: 2, groupMax: 2 });
    else if (d.groupMin === d.groupMax) Object.assign(patch, { groupMin: 2, groupMax: 12 }); // leaving a fixed mode → open a range
    set(patch);
  };

  const toggleTheme = (t) =>
    set({ themes: d.themes.includes(t) ? d.themes.filter((x) => x !== t) : [...d.themes, t] });

  const otherDestinations = data.destinations.filter((x) => x.slug !== d.slug && x.slug);
  const setRelated = (slugs) => set({ relatedSlugs: slugs.slice(0, 4) });

  return (
    <Drawer
      wide
      title={isNew ? "New destination" : d.name || "Edit destination"}
      subtitle={d.country ? `${d.country} · ${d.region}` : "Fill in the trip details"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={save}>Save destination</Button>
        </>
      }
    >
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { value: "basics", label: "Basics" },
          { value: "content", label: "Overview" },
          { value: "packages", label: `Packages (${d.packages.length})` },
          { value: "itinerary", label: `Itinerary (${d.packages[Math.min(itinPkg, Math.max(0, d.packages.length - 1))]?.itinerary?.length || 0})` },
          { value: "experiences", label: `Experiences (${d.experiences.length})` },
          { value: "included", label: "Inclusions & Policies" },
          { value: "info", label: "Good to know" },
          { value: "related", label: `Related (${d.relatedSlugs.length})` },
          { value: "media", label: "Media" },
        ]}
      />

      <div style={{ marginTop: "var(--sp-5)" }}>
        {/* ---------------- BASICS ---------------- */}
        {tab === "basics" && (
          <div className="col gap-5">
            <div className="form-grid">
              <Field label="Name" required>
                <Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Goa" />
              </Field>
              <Field label="Slug" hint="URL id — auto from name if blank">
                <Input value={d.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder="goa" />
              </Field>
              <Field label="Country" hint="Sets the region automatically">
                <Select value={d.country} placeholder="Select a country…"
                  options={COUNTRIES.includes(d.country) || !d.country ? COUNTRIES : [d.country, ...COUNTRIES]}
                  onChange={(e) => set({ country: e.target.value, region: regionForCountry(e.target.value) })} />
              </Field>
              <Field label="Region" hint="Derived from country">
                <div className="synced-stat">
                  <strong>{regionForCountry(d.country)}</strong>
                  <Badge tone="neutral" dot>Auto from country</Badge>
                </div>
              </Field>
              <Field label="From price" hint="Lowest package price">
                <div className="synced-stat">
                  <strong>{lowestPackagePrice(d.packages) || d.fromPrice || "—"}</strong>
                  <Badge tone="neutral" dot>From packages</Badge>
                </div>
              </Field>
              <Field label="Ideal for" hint="Who this trip suits">
                <ChipSelect multiple value={idealArr} onChange={setIdeal} options={IDEAL_OPTIONS} />
              </Field>
              <Field label="Rating" hint="Auto-calculated from verified reviews">
                <div className="synced-stat">
                  <strong>{Number(d.rating || 0).toFixed(1)} ★</strong>
                  <Badge tone="neutral" dot>Synced from reviews</Badge>
                </div>
              </Field>
              <Field label="Reviews" hint="Pulled from the Reviews page">
                <div className="synced-stat">
                  <strong>{(d.reviews || 0).toLocaleString("en-IN")}</strong>
                  <Badge tone="neutral" dot>Synced from reviews</Badge>
                </div>
              </Field>
              <Field label="Adventure styles" className="span-2" hint="Drives the stats strip and Adventure Styles filtering">
                <ChipSelect multiple value={d.themes} onChange={(v) => set({ themes: v })} options={ADVENTURE_THEMES} />
              </Field>
              <Field label="Best time to visit" className="span-2" hint={d.bestMonths?.length ? `Reads as “${monthsLabel(d.bestMonths)}”` : "Select the good-weather months"}>
                <MonthPicker value={d.bestMonths} onChange={(bestMonths) => set({ bestMonths, bestTime: monthsLabel(bestMonths) })} />
              </Field>
              <Field label="Visa note" hint="Leave blank for domestic">
                <Input value={d.visa || ""} onChange={(e) => set({ visa: e.target.value || null })} placeholder="Visa on arrival" />
              </Field>
              {(() => {
                const mode = groupMode(idealArr);
                if (mode === "solo") return (
                  <Field label="Group size" hint="Solo trip — fixed at 1">
                    <div className="synced-stat"><strong>1 traveller</strong><Badge tone="neutral" dot>Solo · Auto</Badge></div>
                  </Field>
                );
                if (mode === "couple") return (
                  <Field label="Group size" hint="Couple trip — fixed at 2">
                    <div className="synced-stat"><strong>2 travellers</strong><Badge tone="neutral" dot>Couple · Auto</Badge></div>
                  </Field>
                );
                return (
                  <Field label="Group size" hint="Min and max travellers">
                    <div className="row gap-3" style={{ alignItems: "center" }}>
                      <Stepper value={d.groupMin} min={1} max={d.groupMax} onChange={(v) => set({ groupMin: v })} />
                      <span className="tiny">to</span>
                      <Stepper value={d.groupMax} min={d.groupMin} max={60} onChange={(v) => set({ groupMax: v })} />
                    </div>
                  </Field>
                );
              })()}
              <Field label="Tagline" className="span-2">
                <Input value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="Beaches, shacks, and Portuguese lanes." />
              </Field>
            </div>
          </div>
        )}

        {/* ---------------- OVERVIEW ---------------- */}
        {tab === "content" && (
          <div className="col gap-6">
            <Field label="Overview paragraphs" hint="First paragraph is shown as the “Why {name}?” intro">
              <div className="string-list">
                {d.overview.map((p, i) => (
                  <div className="string-row" key={i} style={{ alignItems: "flex-start" }}>
                    <Textarea value={p} onChange={(e) => set({ overview: d.overview.map((x, idx) => (idx === i ? e.target.value : x)) })} />
                    <IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => set({ overview: d.overview.filter((_, idx) => idx !== i) })} />
                  </div>
                ))}
                <div><Button variant="ghost" size="sm" icon="plus" onClick={() => set({ overview: [...d.overview, ""] })}>Add paragraph</Button></div>
              </div>
            </Field>
            <Field label="Highlights" hint="Pick an icon + label for each — drag to reorder">
              <HighlightsEditor value={d.highlights} onChange={(v) => set({ highlights: v })} />
            </Field>
          </div>
        )}

        {/* ---------------- PACKAGES ---------------- */}
        {tab === "packages" && (
          <Repeater
            value={d.packages}
            onChange={(v) => set({ packages: v })}
            blank={{ name: "", cities: [], days: 4, nights: 3, price: "", original: "", pdf: { url: "", name: "" }, image: "", slug: "", seoTitle: "", seoDescription: "" }}
            title={(i, it) => it.name || `Package ${i + 1}`}
            addLabel="Add package"
            renderItem={(p, update) => {
              const destSlug = d.slug || slugify(d.name) || "destination";
              const pkgSlug = slugify(p.slug || p.name || "");
              return (
              <div className="col gap-4">
                <div className="form-grid">
                  <Field label="Package name" className="span-2"><Input value={p.name} onChange={(e) => update({ name: e.target.value })} placeholder="Goa Super Saver" /></Field>
                  <Field label="Cities" className="span-2" hint="Type a city and press Enter">
                    <TagInput value={p.cities || []} onChange={(cities) => update({ cities, route: cities.join(" · ") })} placeholder="North Goa" />
                  </Field>
                  <Field label="Days"><Stepper value={p.days} min={1} max={30} onChange={(v) => update({ days: v })} /></Field>
                  <Field label="Nights"><Stepper value={p.nights} min={0} max={30} onChange={(v) => update({ nights: v })} /></Field>
                  <Field label="Sale price"><Input value={p.price} onChange={(e) => update({ price: e.target.value })} placeholder="₹7,999" /></Field>
                  <Field label="Original price" hint="Strike-through; blank = no discount"><Input value={p.original} onChange={(e) => update({ original: e.target.value })} placeholder="₹13,000" /></Field>
                </div>
                <ImagePicker label="Package image" value={p.image} onChange={(v) => update({ image: v })} hint="Cover photo for this package card" />
                <PdfPicker value={p.pdf?.url} name={p.pdf?.name} onChange={(pdf) => update({ pdf })}
                  label="Attach package PDF" hint="Brochure / detailed itinerary offered as a download" />

                {/* ---- SEO: each package has its own public detail page ---- */}
                <div className="card-soft col gap-3" style={{ alignItems: "stretch" }}>
                  <div className="field-label">SEO — package detail page</div>
                  <Field label="URL slug" hint="Auto-derived from the name if left blank. Lowercase, words separated by hyphens.">
                    <Input
                      value={p.slug || ""}
                      onChange={(e) => update({ slug: e.target.value })}
                      onBlur={(e) => update({ slug: slugify(e.target.value) })}
                      placeholder={slugify(p.name) || "package-slug"}
                    />
                  </Field>
                  <div className="tiny muted" style={{ wordBreak: "break-all" }}>
                    Public URL: <strong>/destinations/{destSlug}/{pkgSlug || "…"}</strong>
                  </div>
                  <Field label="SEO title" hint="Browser tab + search result title. Blank = auto from name & duration.">
                    <Input value={p.seoTitle || ""} onChange={(e) => update({ seoTitle: e.target.value })} placeholder={`${p.name || "Package"} — ${p.days}D/${p.nights}N ${d.name} Package`} />
                  </Field>
                  <Field label="Meta description" hint="Search snippet (~150 chars). Blank = auto-generated.">
                    <Textarea value={p.seoDescription || ""} onChange={(e) => update({ seoDescription: e.target.value })} rows={2} placeholder={`Book the ${p.name || "package"} in ${d.name} from ${p.price || "₹—"}. ${p.days} days / ${p.nights} nights.`} />
                  </Field>
                </div>
              </div>
              );
            }}
          />
        )}

        {/* ---------------- ITINERARY (per package) ---------------- */}
        {tab === "itinerary" && (() => {
          if (!d.packages.length) {
            return (
              <div className="card-soft col gap-3" style={{ alignItems: "flex-start" }}>
                <p className="muted" style={{ margin: 0 }}>Add a package on the <strong>Packages</strong> tab first — each package has its own day-by-day itinerary.</p>
                <Button variant="secondary" icon="plus" onClick={() => setTab("packages")}>Go to Packages</Button>
              </div>
            );
          }
          const pi = Math.min(itinPkg, d.packages.length - 1);
          const pkg = d.packages[pi];
          const days = pkg.itinerary || [];
          const setDays = (next) => set({ packages: d.packages.map((p, i) => (i === pi ? { ...p, itinerary: next } : p)) });
          return (
            <div className="col gap-4">
              <div>
                <div className="field-label" style={{ marginBottom: 8 }}>Select a package</div>
                <div className="chip-select">
                  {d.packages.map((p, i) => (
                    <button type="button" key={i} className={`chip ${i === pi ? "on" : ""}`} onClick={() => setItinPkg(i)}>
                      {p.name || `Package ${i + 1}`}<span className="tiny" style={{ opacity: 0.7 }}> · {p.days}d</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-soft row-between" style={{ alignItems: "center" }}>
                <div className="tiny">
                  Designing the itinerary for <strong>{pkg.name || `Package ${pi + 1}`}</strong> — {pkg.days} days, {days.length} added.
                </div>
                {days.length < pkg.days && (
                  <Button variant="ghost" size="sm" icon="plus"
                    onClick={() => setDays([...days, ...Array.from({ length: pkg.days - days.length }, (_, k) => ({ day: days.length + k + 1, title: "", desc: "", chips: ["Stay", "Breakfast", "Transfer", "Sightseeing"] }))])}>
                    Fill {pkg.days - days.length} day{pkg.days - days.length > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
              <Repeater
                value={days}
                onChange={(v) => setDays(v.map((it, i) => ({ ...it, day: i + 1 })))}
                blank={() => ({ day: days.length + 1, title: "", desc: "", chips: ["Stay", "Breakfast", "Transfer", "Sightseeing"] })}
                title={(i, it) => `Day ${i + 1}${it.title ? " · " + it.title : ""}`}
                addLabel="Add day"
                renderItem={(it, update) => (
                  <div className="col gap-3">
                    <Field label="Title"><Input value={it.title} onChange={(e) => update({ title: e.target.value })} placeholder="Arrival in Goa" /></Field>
                    <Field label="Description"><Textarea value={it.desc} onChange={(e) => update({ desc: e.target.value })} placeholder="Airport pickup, hotel check-in and Baga beach in the evening." /></Field>
                    <Field label="Day chips" hint="What this day includes">
                      <ChipSelect multiple value={it.chips || []} onChange={(chips) => update({ chips })} options={DAY_CHIPS} />
                    </Field>
                  </div>
                )}
              />
            </div>
          );
        })()}

        {/* ---------------- EXPERIENCES ---------------- */}
        {tab === "experiences" && (
          <div className="col gap-3">
            <p className="muted" style={{ fontSize: 13 }}>“Top experiences” cards — each gets a category tag, a pace, and its own photo.</p>
            <Repeater
              value={d.experiences}
              onChange={(v) => set({ experiences: v })}
              blank={{ title: "", pace: "Half-day", image: "" }}
              title={(i, it) => it.title || `Experience ${i + 1}`}
              addLabel="Add experience"
              renderItem={(x, update) => (
                <div className="col gap-3">
                  <div className="form-grid">
                    <Field label="Title" className="span-2"><Input value={x.title} onChange={(e) => update({ title: e.target.value })} placeholder="Fort Aguada sunset" /></Field>
                    <Field label="Pace / timing" className="span-2"><Select value={x.pace} options={EXP_PACES} onChange={(e) => update({ pace: e.target.value })} /></Field>
                  </div>
                  <ImagePicker label="Photo" value={x.image} onChange={(v) => update({ image: v })} />
                </div>
              )}
            />
          </div>
        )}

        {/* ---------------- INCLUSIONS & POLICIES ---------------- */}
        {tab === "included" && (
          <div className="col gap-6">
            <SectionCard title="What's included" hint="Green list on the trip page">
              <StringList value={d.inclusions} onChange={(v) => set({ inclusions: v })} placeholder="Daily breakfast at the hotel" addLabel="Add inclusion" />
            </SectionCard>
            <SectionCard title="Not included">
              <StringList value={d.exclusions} onChange={(v) => set({ exclusions: v })} placeholder="Airfare" addLabel="Add exclusion" />
            </SectionCard>
            <SectionCard title="Cancellation refunds" hint="Refund % per cancellation window — drag to reorder">
              <Repeater
                value={d.cancellation}
                onChange={(v) => set({ cancellation: v })}
                blank={{ window: "", pct: 0 }}
                title={(i, t) => `${t.pct}% · ${t.window || "window"}`}
                addLabel="Add tier"
                renderItem={(t, update) => (
                  <div className="form-grid">
                    <Field label="Window"><Input value={t.window} onChange={(e) => update({ window: e.target.value })} placeholder="30+ days" /></Field>
                    <Field label="Refund"><Stepper value={t.pct} min={0} max={100} step={5} suffix="%" onChange={(v) => update({ pct: v })} /></Field>
                  </div>
                )}
              />
            </SectionCard>
            <SectionCard title="Payment policy">
              <Field label="Stages">
                <Repeater
                  value={d.payment.stages}
                  onChange={(stages) => setPay({ stages })}
                  blank={{ label: "", when: "", note: "" }}
                  title={(i, st) => st.label || `Stage ${i + 1}`}
                  addLabel="Add stage"
                  renderItem={(st, update) => (
                    <div className="form-grid">
                      <Field label="Label"><Input value={st.label} onChange={(e) => update({ label: e.target.value })} placeholder="Booking" /></Field>
                      <Field label="When"><Input value={st.when} onChange={(e) => update({ when: e.target.value })} placeholder="Partial amount" /></Field>
                      <Field label="Note" className="span-2"><Input value={st.note} onChange={(e) => update({ note: e.target.value })} /></Field>
                    </div>
                  )}
                />
              </Field>
              <Field label="Accepted methods">
                <ChipSelect multiple value={d.payment.methods} onChange={(methods) => setPay({ methods })} options={PAY_METHODS} />
              </Field>
              <Field label="Footnote">
                <Textarea value={d.payment.note} onChange={(e) => setPay({ note: e.target.value })} />
              </Field>
            </SectionCard>
          </div>
        )}

        {/* ---------------- GOOD TO KNOW ---------------- */}
        {tab === "info" && (
          <div className="col gap-6">
            <SectionCard title="Quick facts" hint="The “Good to know” grid">
              <Repeater
                value={d.goodToKnow}
                onChange={(v) => set({ goodToKnow: v })}
                blank={{ icon: "", label: "", value: "" }}
                title={(i, f) => f.label || `Fact ${i + 1}`}
                addLabel="Add fact"
                renderItem={(f, update) => (
                  <div className="row gap-3 wrap" style={{ alignItems: "flex-end" }}>
                    <Field label="Icon"><IconPicker value={f.icon} onChange={(icon) => update({ icon })} /></Field>
                    <Field label="Label" className="grow"><Input value={f.label} onChange={(e) => update({ label: e.target.value, icon: f.icon || guessFactIcon(e.target.value) })} placeholder="Currency" /></Field>
                    <Field label="Value" className="grow"><Input value={f.value} onChange={(e) => update({ value: e.target.value })} placeholder="INR (₹)" /></Field>
                  </div>
                )}
              />
            </SectionCard>
            <SectionCard title="Who this trip is for" hint="Toggle the age groups this trip suits">
              <Repeater
                value={d.ageGroups}
                onChange={(v) => set({ ageGroups: v })}
                blank={{ label: "", note: "", on: true }}
                title={(i, a) => `${a.label || "Age"} · ${a.note || ""}`}
                addLabel="Add age group"
                renderItem={(a, update) => (
                  <div className="row gap-4 wrap" style={{ alignItems: "flex-end" }}>
                    <Field label="Range"><Input value={a.label} onChange={(e) => update({ label: e.target.value })} placeholder="18 – 25" /></Field>
                    <Field label="Label"><Input value={a.note} onChange={(e) => update({ note: e.target.value })} placeholder="Youth" /></Field>
                    <Toggle checked={a.on} onChange={(v) => update({ on: v })} label="Suited" />
                  </div>
                )}
              />
            </SectionCard>
            <SectionCard title="Quick FAQs">
              <Repeater
                value={d.faqs}
                onChange={(v) => set({ faqs: v })}
                blank={{ q: "", a: "" }}
                title={(i, f) => f.q || `FAQ ${i + 1}`}
                addLabel="Add FAQ"
                renderItem={(f, update) => (
                  <div className="col gap-2">
                    <Field label="Question"><Input value={f.q} onChange={(e) => update({ q: e.target.value })} /></Field>
                    <Field label="Answer"><Textarea value={f.a} onChange={(e) => update({ a: e.target.value })} /></Field>
                  </div>
                )}
              />
            </SectionCard>
          </div>
        )}

        {/* ---------------- RELATED ---------------- */}
        {tab === "related" && (
          <div className="col gap-4">
            <p className="muted" style={{ fontSize: 13 }}>
              Pick up to <strong>4</strong> destinations to feature as “Related trips”. {d.relatedSlugs.length}/4 selected.
            </p>
            <div className="related-grid">
              {otherDestinations.map((o) => {
                const on = d.relatedSlugs.includes(o.slug);
                const full = !on && d.relatedSlugs.length >= 4;
                return (
                  <button
                    key={o.slug}
                    type="button"
                    className={`related-card ${on ? "on" : ""} ${full ? "disabled" : ""}`}
                    disabled={full}
                    onClick={() => setRelated(on ? d.relatedSlugs.filter((s) => s !== o.slug) : [...d.relatedSlugs, o.slug])}
                  >
                    <img src={o.image} alt="" />
                    <div className="col gap-1" style={{ minWidth: 0 }}>
                      <strong className="truncate">{o.name}</strong>
                      <span className="tiny">{o.country} · {o.fromPrice}</span>
                    </div>
                    {on && <span className="related-check"><IconButton name="check" size="sm" /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- MEDIA ---------------- */}
        {tab === "media" && (
          <div className="col gap-6">
            <ImagePicker label="Cover image" value={d.image} onChange={(v) => set({ image: v })} hint="Main image shown in listings and the trip hero" />
            <Field label="Image key" hint="Internal reference key used by the front-end image helper">
              <Input value={d.imageKey} onChange={(e) => set({ imageKey: e.target.value })} placeholder="goa" />
            </Field>
            <ImageGrid label="Gallery images" value={d.galleryKeys} onChange={(v) => set({ galleryKeys: v })} />
            <p className="muted" style={{ fontSize: 13 }}>Adventure styles are set on the <strong>Basics</strong> tab.</p>
          </div>
        )}
      </div>

      <style>{`
        .related-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:var(--sp-3); }
        .related-card { position:relative; display:flex; align-items:center; gap:var(--sp-3); padding:8px; border:1px solid var(--line); border-radius:var(--r-md); background:var(--surface); cursor:pointer; text-align:left; transition:all .15s; }
        .related-card:hover:not(.disabled){ border-color:var(--accent-ink); }
        .related-card.on{ border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-soft); }
        .related-card.disabled{ opacity:.45; cursor:not-allowed; }
        .related-card img{ width:54px; height:54px; border-radius:var(--r-sm); object-fit:cover; flex:none; }
        .related-check{ margin-left:auto; color:var(--accent-ink); }
        .synced-stat{ display:flex; align-items:center; gap:var(--sp-3); height:42px; padding:0 14px; border:1px dashed var(--line); border-radius:var(--r-md); background:var(--panel-soft); }
        .synced-stat strong{ font-size:var(--fs-lg); font-variant-numeric:tabular-nums; }
        .month-grid{ display:grid; grid-template-columns:repeat(6, 1fr); gap:var(--sp-2); }
        .month-cell{ padding:9px 0; border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface); color:var(--text-2); font-size:var(--fs-sm); font-weight:500; cursor:pointer; transition:all .15s; }
        .month-cell:hover{ border-color:var(--accent-ink); color:var(--text); }
        .month-cell.on{ background:var(--accent); border-color:var(--accent); color:var(--accent-ink); font-weight:600; }
        @media (max-width:560px){ .month-grid{ grid-template-columns:repeat(4, 1fr); } }
      `}</style>
    </Drawer>
  );
}

// Setup checklist — which key sections a destination has filled in.
const setupItems = (d) => {
  const days = (d.itinerary?.length || 0) + (d.packages || []).reduce((n, p) => n + (p.itinerary?.length || 0), 0);
  return [
    ["Cover image", !!d.image],
    ["Packages", (d.packages || []).length > 0],
    ["Itinerary", days > 0],
    ["Experiences", (d.experiences || []).length > 0],
    ["Overview", (d.overview || []).some(Boolean)],
    ["Highlights", (d.highlights || []).length > 0],
  ];
};
const setupScore = (d) => {
  const it = setupItems(d);
  return Math.round((it.filter((x) => x[1]).length / it.length) * 100);
};

function ThemeChips({ themes = [] }) {
  if (!themes.length) return <span className="tiny" style={{ color: "var(--text-3)" }}>—</span>;
  return (
    <div className="mini-chips">
      {themes.slice(0, 2).map((t) => <span className="mini-chip" key={t}>{t}</span>)}
      {themes.length > 2 && <span className="mini-chip ghost">+{themes.length - 2}</span>}
    </div>
  );
}

function SetupBar({ d }) {
  const items = setupItems(d);
  const done = items.filter((x) => x[1]).length;
  const pct = Math.round((done / items.length) * 100);
  const tone = pct === 100 ? "var(--success)" : pct >= 50 ? "var(--accent-hover)" : "var(--warning)";
  return (
    <div className="setup" title={items.map((x) => `${x[1] ? "✓" : "✗"} ${x[0]}`).join("\n")}>
      <div className="setup-track"><div className="setup-fill" style={{ width: `${pct}%`, background: tone }} /></div>
      <span className="tiny" style={{ minWidth: 30 }}>{done}/{items.length}</span>
    </div>
  );
}

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Rating: high → low" },
  { value: "packages", label: "Most packages" },
  { value: "setup", label: "Least complete" },
];

export default function Destinations() {
  const { data, remove, upsert } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState("table");

  const stats = useMemo(() => {
    const list = data.destinations;
    const india = list.filter((d) => d.region === "India").length;
    const pkgs = list.reduce((n, d) => n + (d.packages?.length || 0), 0);
    const rated = list.filter((d) => Number(d.rating) > 0);
    const avg = rated.length ? rated.reduce((n, d) => n + Number(d.rating || 0), 0) / rated.length : 0;
    const needs = list.filter((d) => setupScore(d) < 100).length;
    return { total: list.length, india, intl: list.length - india, pkgs, avg, needs };
  }, [data.destinations]);

  const rows = useMemo(() => {
    let list = data.destinations.filter((d) => {
      if (region !== "all" && d.region !== region) return false;
      if (q && !`${d.name} ${d.country}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    list = [...list];
    switch (sort) {
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": list.sort((a, b) => priceNum(a.fromPrice) - priceNum(b.fromPrice)); break;
      case "price-desc": list.sort((a, b) => priceNum(b.fromPrice) - priceNum(a.fromPrice)); break;
      case "rating": list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)); break;
      case "packages": list.sort((a, b) => (b.packages?.length || 0) - (a.packages?.length || 0)); break;
      case "setup": list.sort((a, b) => setupScore(a) - setupScore(b)); break;
      default: break;
    }
    return list;
  }, [data.destinations, q, region, sort]);

  // Pagination — 10 per page
  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [q, region, sort]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const rangeStart = rows.length ? (safePage - 1) * PER_PAGE + 1 : 0;
  const rangeEnd = Math.min(safePage * PER_PAGE, rows.length);

  const duplicate = (d) => {
    const exists = (s) => data.destinations.some((x) => x.slug === s);
    let base = `${d.slug}-copy`, slug = base, n = 2;
    while (exists(slug)) slug = `${base}-${n++}`;
    upsert("destinations", { ...structuredClone(d), slug, name: `${d.name} (copy)` }, "slug");
    toast(`Duplicated “${d.name}”`);
  };

  const columns = [
    {
      key: "name", header: "Destination",
      render: (r) => (
        <div className="row gap-3">
          <img className="cell-thumb" src={r.image} alt="" />
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div className="tiny">{r.country} · /{r.slug}</div>
          </div>
        </div>
      ),
    },
    { key: "region", header: "Region", render: (r) => <Badge tone={r.region === "India" ? "accent" : "info"}>{r.region}</Badge> },
    { key: "themes", header: "Styles", render: (r) => <ThemeChips themes={r.themes} /> },
    { key: "fromPrice", header: "From", render: (r) => <span style={{ fontWeight: 600 }}>{lowestPackagePrice(r.packages) || r.fromPrice || "—"}</span> },
    { key: "rating", header: "Rating", render: (r) => <span><span style={{ color: "var(--accent-ink)" }}>★</span> {r.rating} <span className="tiny">({(r.reviews || 0).toLocaleString("en-IN")})</span></span> },
    { key: "packages", header: "Packages", render: (r) => <span className="row gap-2" style={{ alignItems: "center" }}><Icon name="briefcase" size={14} />{r.packages?.length || 0}</span> },
    { key: "setup", header: "Setup", render: (r) => <SetupBar d={r} /> },
    {
      key: "actions", actions: true,
      render: (r) => (
        <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
          <IconButton name="copy" size="sm" title="Duplicate" onClick={() => duplicate(r)} />
          <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
          <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
        </div>
      ),
    },
  ];

  const STAT_CARDS = [
    { icon: "map", label: "Destinations", value: stats.total, sub: `${stats.india} India · ${stats.intl} Intl` },
    { icon: "briefcase", label: "Total packages", value: stats.pkgs, sub: "across all trips" },
    { icon: "star", label: "Avg rating", value: stats.avg ? stats.avg.toFixed(1) : "—", sub: "from reviews" },
    { icon: "sparkle", label: "Need setup", value: stats.needs, sub: stats.needs ? "missing sections" : "all complete", warn: stats.needs > 0 },
  ];

  return (
    <div>
      <PageHeader title="Destinations" subtitle={`${data.destinations.length} destinations powering the catalog`}>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New destination</Button>
      </PageHeader>

      {/* Summary stat cards */}
      <div className="dest-stats">
        {STAT_CARDS.map((c) => (
          <div className="dest-stat" key={c.label}>
            <span className={`dest-stat-ico ${c.warn ? "warn" : ""}`}><Icon name={c.icon} size={18} /></span>
            <div>
              <div className="dest-stat-num">{c.value}</div>
              <div className="dest-stat-label">{c.label}</div>
              <div className="tiny" style={{ color: "var(--text-3)" }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar (single row) */}
      <div className="dest-toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search destinations…" />
        <span className="toolbar-spacer" />
        <div className="pill-tabs">
          {["all", ...REGIONS].map((r) => (
            <button key={r} className={`pill-tab ${region === r ? "active" : ""}`} onClick={() => setRegion(r)}>
              {r === "all" ? "All regions" : r}
            </button>
          ))}
        </div>
        <div className="sort-wrap"><Select value={sort} options={SORTS} onChange={(e) => setSort(e.target.value)} /></div>
        <div className="seg">
          <button className={`seg-btn ${view === "table" ? "on" : ""}`} title="Table view" onClick={() => setView("table")}><Icon name="menu" size={16} /></button>
          <button className={`seg-btn ${view === "grid" ? "on" : ""}`} title="Grid view" onClick={() => setView("grid")}><Icon name="layout" size={16} /></button>
        </div>
      </div>

      <div className="tiny" style={{ margin: "0 0 var(--sp-3)", color: "var(--text-3)" }}>
        Showing {rangeStart}–{rangeEnd} of {rows.length}{rows.length !== data.destinations.length ? ` (filtered from ${data.destinations.length})` : ""}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="search" title="No destinations match" message="Try a different search term or region filter." />
      ) : view === "table" ? (
        <DataTable columns={columns} rows={pageRows} rowKey={(r) => r.slug} onRowClick={(r) => setEditing(r)} />
      ) : (
        <div className="dest-grid">
          {pageRows.map((r) => (
            <div className="dest-card" key={r.slug} onClick={() => setEditing(r)}>
              <div className="dest-card-img">
                <img src={r.image} alt="" />
                <Badge tone={r.region === "India" ? "accent" : "info"}>{r.region}</Badge>
              </div>
              <div className="dest-card-body">
                <div className="row-between" style={{ alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: 600 }}>{r.name}</div>
                    <div className="tiny">{r.country}</div>
                  </div>
                  <div className="tiny" style={{ whiteSpace: "nowrap" }}><span style={{ color: "var(--accent-ink)" }}>★</span> {r.rating}</div>
                </div>
                <ThemeChips themes={r.themes} />
                <div className="row-between" style={{ alignItems: "center" }}>
                  <span className="tiny"><Icon name="briefcase" size={13} /> {r.packages?.length || 0} pkg</span>
                  <strong>{lowestPackagePrice(r.packages) || r.fromPrice || "—"}</strong>
                </div>
                <SetupBar d={r} />
                <div className="row gap-1" style={{ justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                  <IconButton name="copy" size="sm" title="Duplicate" onClick={() => duplicate(r)} />
                  <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
                  <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > PER_PAGE && (
        <div className="pager">
          <button className="pager-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} title="Previous">
            <Icon name="chevronLeft" size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pager-num ${p === safePage ? "on" : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pager-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} title="Next">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}

      {creating && <DestinationEditor onClose={() => setCreating(false)} />}
      {editing && <DestinationEditor value={editing} onClose={() => setEditing(null)} />}
      {confirm && (
        <ConfirmDialog
          title="Delete destination"
          message={`Delete “${confirm.name}”? This removes it from the catalog. This cannot be undone.`}
          onConfirm={() => remove("destinations", confirm.slug, "slug")}
          onClose={() => setConfirm(null)}
        />
      )}

      <style>{`
        .dest-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--sp-4); margin-bottom:var(--sp-5); }
        .dest-stat { display:flex; gap:var(--sp-3); align-items:center; padding:var(--sp-4); background:var(--panel); border:1px solid var(--line); border-radius:var(--r-xl); box-shadow:var(--sh-1); }
        .dest-stat-ico { width:40px; height:40px; flex:none; display:flex; align-items:center; justify-content:center; border-radius:var(--r-md); background:var(--accent-soft); color:var(--accent-ink); }
        .dest-stat-ico.warn { background:var(--warning-bg); color:var(--warning); }
        .dest-stat-num { font-size:24px; font-weight:700; letter-spacing:-.02em; line-height:1.1; }
        .dest-stat-label { font-size:var(--fs-sm); color:var(--text-2); font-weight:500; }
        .dest-toolbar { display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-3); }
        .dest-toolbar .toolbar-spacer { flex:1 1 auto; min-width:8px; }
        .dest-toolbar .pill-tabs { flex:none; flex-wrap:nowrap; }
        .dest-toolbar .pill-tab { white-space:nowrap; }
        .dest-toolbar .sort-wrap { width:170px; flex:none; }
        .dest-toolbar .seg { flex:none; }
        @media (max-width:860px){ .dest-toolbar { flex-wrap:wrap; } .dest-toolbar .toolbar-spacer { display:none; } .dest-toolbar .sort-wrap { width:auto; flex:1; } }
        .seg { display:inline-flex; border:1px solid var(--line); border-radius:var(--r-sm); overflow:hidden; }
        .seg-btn { width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; border:none; background:var(--surface); color:var(--text-3); cursor:pointer; }
        .seg-btn.on { background:var(--accent); color:var(--accent-ink); }
        .mini-chips { display:flex; gap:4px; flex-wrap:wrap; }
        .mini-chip { font-size:11px; padding:2px 8px; border-radius:var(--r-pill); background:var(--accent-soft); color:var(--accent-ink); white-space:nowrap; }
        .mini-chip.ghost { background:var(--panel-soft); color:var(--text-3); }
        .setup { display:flex; align-items:center; gap:8px; min-width:96px; }
        .setup-track { flex:1; height:6px; border-radius:var(--r-pill); background:var(--line); overflow:hidden; }
        .setup-fill { height:100%; border-radius:var(--r-pill); transition:width .2s; }
        .dest-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr)); gap:var(--sp-4); }
        .dest-card { border:1px solid var(--line); border-radius:var(--r-lg); background:var(--panel); overflow:hidden; cursor:pointer; transition:box-shadow .15s, transform .15s; }
        .dest-card:hover { box-shadow:var(--sh-3); transform:translateY(-2px); }
        .dest-card-img { position:relative; height:130px; }
        .dest-card-img img { width:100%; height:100%; object-fit:cover; }
        .dest-card-img .badge { position:absolute; top:8px; left:8px; }
        .dest-card-body { padding:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-3); }
        @media (max-width:980px){ .dest-stats { grid-template-columns:repeat(2,1fr); } }
        .pager { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:var(--sp-5); }
        .pager-btn, .pager-num { min-width:34px; height:34px; padding:0 6px; display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--line); border-radius:var(--r-sm); background:var(--surface); color:var(--text-2); font-size:var(--fs-sm); font-weight:600; cursor:pointer; transition:all .15s; }
        .pager-btn:hover:not(:disabled), .pager-num:hover { border-color:var(--accent-ink); color:var(--text); }
        .pager-btn:disabled { opacity:.4; cursor:not-allowed; }
        .pager-num.on { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
      `}</style>
    </div>
  );
}
