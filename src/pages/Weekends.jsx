import { useMemo, useState, useEffect } from "react";
import { useStore, slugify } from "../lib/store.jsx";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Textarea, Select, Tabs,
  Repeater, StringList, ImagePicker, ImageGrid, SearchInput, IconButton,
  ConfirmDialog, useToast, Stepper, ChipSelect, TagInput, ComboSelect, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import { MonthPicker, monthsLabel, HighlightsEditor, priceNum } from "../ui/editorBits.jsx";
import { guessIcon } from "../ui/travelIcons.jsx";
import DataTable from "../ui/DataTable.jsx";

const REGIONS = ["South", "West", "North", "East"];
// Major Indian departure cities (pickup hubs) — alphabetical. ComboSelect also allows a custom value.
const CITIES = [
  "Agra", "Ahmedabad", "Amritsar", "Bengaluru", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
  "Coimbatore", "Dehradun", "Delhi", "Goa (Panaji)", "Gurugram", "Guwahati", "Hyderabad", "Indore",
  "Jaipur", "Jodhpur", "Kanpur", "Kochi", "Kolkata", "Lucknow", "Madurai", "Mangaluru", "Mumbai",
  "Mysuru", "Nagpur", "Nashik", "Noida", "Patna", "Pune", "Raipur", "Rajkot", "Ranchi", "Surat",
  "Thiruvananthapuram", "Tiruchirappalli", "Udaipur", "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam",
];
const TAGS = ["Best Seller", "Weekend Saver", "Adventure", "Weekend Trip", "Heritage", "Couples", "Hills & Beach", "Nature", "Wildlife", "Quick Escape"];
const AVAILABILITY = [
  { value: "hot", status: "FILLING FAST", label: "Filling fast" },
  { value: "ok", status: "BOOK NOW", label: "Book now" },
  { value: "low", status: "FEW LEFT", label: "Few left" },
];
const toneBadge = { hot: "danger", ok: "success", low: "warning" };

const DEFAULT_INCL = [
  "Round-trip transport from your city",
  "Stay in vetted boutique properties",
  "Daily breakfast included",
  "Activities & entry tickets covered",
];
const DEFAULT_EXCL = [
  "Personal expenses (laundry, calls, tips)",
  "Lunches & dinners unless mentioned",
  "Any activity not in the itinerary",
  "Travel insurance",
];
const DEFAULT_TRUST = ["Small groups", "24×7 on-trip support", "Free changes upto 14 days"];
const DEFAULT_FAQS = [
  { q: "How do I get picked up?", a: "Pickup happens early morning on Day 1. We share the exact point + driver contact 24 hours before." },
  { q: "Can I extend by a day?", a: "Absolutely — message your trip captain. We rebuild the plan and add the extra night's stay + transport at cost." },
  { q: "What's the cancellation policy?", a: "Free up to 14 days before departure. 50% refund 7–14 days out. After that the booking is non-refundable but transferable." },
  { q: "Is this trip safe for solo travellers?", a: "Yes. Most weekend trips have 60–70% solo travellers. The group is small (usually 8–12) and the captain is on-call throughout." },
];

const computeSavings = (w) => {
  const diff = priceNum(w.originalPrice) - priceNum(w.salePrice);
  return diff > 0 ? "₹" + diff.toLocaleString("en-IN") : "";
};

function generateItinerary(w) {
  const first = (w.stops?.[0] || (w.to || "").split("·")[0] || "your destination").trim();
  const days = Math.max(1, w.days || 3);
  const hl = (w.highlights || []).map((h) => h.text || h).filter(Boolean).join(", ");
  const arr = [{ title: `Arrive in ${first}`, body: `Pickup from ${w.from || "your city"} early morning. Drive in with a coffee stop, check in to your stay, freshen up, then a relaxed local walk + dinner.` }];
  if (days > 2) arr.push({ title: `Highlights of ${w.to || first}`, body: `A guided day across the trip's headline spots — ${hl || "the best viewpoints, gardens and local gems"}.` });
  while (arr.length < days - 1) arr.push({ title: "Leisure & local exploring", body: "A flexible day to explore at your own pace with optional add-ons." });
  arr.push({ title: `Slow morning, drive back to ${w.from || "your city"}`, body: "Late breakfast, one last walk, then an easy drive home with great memories." });
  return arr.slice(0, days);
}

function blank() {
  return {
    id: "", name: "", subtitle: "", from: "", to: "", stops: [], region: "South", days: 3, nights: 2,
    salePrice: "", originalPrice: "", savings: "", pricingSubLabel: "per person, twin sharing",
    rating: 4.6, reviews: 0, bestTime: "", bestMonths: [], tag: "Weekend Trip",
    status: "BOOK NOW", statusTone: "ok", image: "", gallery: [], highlights: [], description: "",
    itinerary: [], inclusions: [...DEFAULT_INCL], exclusions: [...DEFAULT_EXCL],
    faqs: structuredClone(DEFAULT_FAQS), trustPoints: [...DEFAULT_TRUST], relatedIds: [],
  };
}

function normalizeWeekend(w) {
  const n = { ...blank(), ...w };
  n.highlights = (n.highlights || []).map((h) =>
    typeof h === "string" ? { text: h, icon: guessIcon(h) } : { text: h.text || "", icon: h.icon || "" }
  );
  n.stops = n.stops?.length ? n.stops : (n.to ? n.to.split("·").map((s) => s.trim()).filter(Boolean) : []);
  if (!n.itinerary?.length) n.itinerary = generateItinerary(n);
  if (!n.inclusions?.length) n.inclusions = [...DEFAULT_INCL];
  if (!n.exclusions?.length) n.exclusions = [...DEFAULT_EXCL];
  if (!n.faqs?.length) n.faqs = structuredClone(DEFAULT_FAQS);
  if (!n.trustPoints?.length) n.trustPoints = [...DEFAULT_TRUST];
  return n;
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

function WeekendEditor({ value, onClose }) {
  const { upsert, data } = useStore();
  const toast = useToast();
  const [w, setW] = useState(() => normalizeWeekend(value || {}));
  const [tab, setTab] = useState("trip");
  const isNew = !value;
  const set = (patch) => setW((s) => ({ ...s, ...patch }));

  const save = () => {
    if (!w.name.trim()) return toast("Name is required", "error");
    const id = w.id || slugify(w.name);
    const dup = data.weekends.find((x) => x.id === id && x.id !== value?.id);
    if (dup) return toast("A weekend with this id already exists", "error");
    const avail = AVAILABILITY.find((a) => a.value === w.statusTone) || AVAILABILITY[1];
    const derived = {
      id,
      to: w.stops?.length ? w.stops.join(" · ") : w.to,
      savings: computeSavings(w) || w.savings,
      status: avail.status,
      bestTime: w.bestMonths?.length ? monthsLabel(w.bestMonths) : w.bestTime,
    };
    upsert("weekends", { ...w, ...derived });
    toast(isNew ? "Weekend trip created" : "Weekend trip saved");
    onClose();
  };

  const others = data.weekends.filter((x) => x.id !== w.id && x.id);
  const setRelated = (ids) => set({ relatedIds: ids.slice(0, 3) });

  return (
    <Drawer
      wide
      title={isNew ? "New weekend trip" : w.name || "Edit weekend"}
      subtitle={w.from ? `${w.from} → ${w.stops?.join(" · ") || w.to}` : "Short getaway details"}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>Save weekend</Button>
      </>}
    >
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "trip", label: "Trip & pricing" },
        { value: "content", label: "About & itinerary" },
        { value: "gallery", label: `Gallery (${w.gallery.length})` },
        { value: "included", label: "Included & FAQs" },
        { value: "extras", label: `Extras` },
      ]} />

      <div style={{ marginTop: "var(--sp-5)" }}>
        {/* ---------------- TRIP & PRICING ---------------- */}
        {tab === "trip" && (
          <div className="col gap-5">
            <ImagePicker label="Cover image" value={w.image} onChange={(v) => set({ image: v })} hint="Hero image for the trip page & cards" />
            <div className="form-grid">
              <Field label="Name" required><Input value={w.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ooty, Coonoor & Isha" /></Field>
              <Field label="Id" hint="Auto from name if blank"><Input value={w.id} onChange={(e) => set({ id: slugify(e.target.value) })} placeholder="ooty-coonoor" /></Field>
              <Field label="Subtitle" className="span-2"><Input value={w.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Hills, gardens & calm" /></Field>
              <Field label="Pickup city" hint="Pick a city or add your own">
                <ComboSelect value={w.from} onChange={(v) => set({ from: v })} options={CITIES} placeholder="Select a city…" customPlaceholder="Enter pickup city" />
              </Field>
              <Field label="Region"><ChipSelect value={w.region} onChange={(v) => set({ region: v })} options={REGIONS} /></Field>
              <Field label="Stops / route" className="span-2" hint="Type a stop and press Enter">
                <TagInput value={w.stops} onChange={(stops) => set({ stops, to: stops.join(" · ") })} placeholder="Ooty" />
              </Field>
              <Field label="Days"><Stepper value={w.days} min={1} max={14} onChange={(v) => set({ days: v })} /></Field>
              <Field label="Nights"><Stepper value={w.nights} min={0} max={14} onChange={(v) => set({ nights: v })} /></Field>
              <Field label="Tag"><Select value={w.tag} options={TAGS} onChange={(e) => set({ tag: e.target.value })} /></Field>
              <Field label="Availability" hint="Shown as the status badge">
                <ChipSelect value={w.statusTone} onChange={(v) => set({ statusTone: v })} options={AVAILABILITY} />
              </Field>
              <Field label="Rating" hint="Synced from reviews">
                <div className="synced-stat"><strong>{Number(w.rating || 0).toFixed(1)} ★</strong><Badge tone="neutral" dot>Synced</Badge></div>
              </Field>
              <Field label="Reviews" hint="Synced from reviews">
                <div className="synced-stat"><strong>{(w.reviews || 0).toLocaleString("en-IN")}</strong><Badge tone="neutral" dot>Synced</Badge></div>
              </Field>
            </div>

            <SectionCard title="Best time to visit" hint={w.bestMonths?.length ? `Reads as “${monthsLabel(w.bestMonths)}”` : "Select the good-weather months"}>
              <MonthPicker value={w.bestMonths} onChange={(bestMonths) => set({ bestMonths, bestTime: monthsLabel(bestMonths) })} />
            </SectionCard>

            <SectionCard title="Pricing">
              <div className="form-grid">
                <Field label="Sale price"><Input value={w.salePrice} onChange={(e) => set({ salePrice: e.target.value })} placeholder="₹6,999" /></Field>
                <Field label="Original price"><Input value={w.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })} placeholder="₹9,999" /></Field>
                <Field label="Savings" hint="Auto-calculated">
                  <div className="synced-stat"><strong>{computeSavings(w) || w.savings || "—"}</strong><Badge tone="neutral" dot>Auto</Badge></div>
                </Field>
                <Field label="Price sub-label"><Input value={w.pricingSubLabel} onChange={(e) => set({ pricingSubLabel: e.target.value })} placeholder="per person, twin sharing" /></Field>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ---------------- ABOUT & ITINERARY ---------------- */}
        {tab === "content" && (
          <div className="col gap-6">
            <Field label="About the trip" hint="The intro paragraph on the detail page">
              <Textarea value={w.description} onChange={(e) => set({ description: e.target.value })} rows={3} placeholder="Tea-garden mornings, the famous toy train, and a quiet evening at the Isha temple…" />
            </Field>
            <Field label="Highlights" hint="Pick an icon + label for each — drag to reorder">
              <HighlightsEditor value={w.highlights} onChange={(v) => set({ highlights: v })} placeholder="Toy train ride" />
            </Field>
            <div className="col gap-3">
              <div className="row-between" style={{ alignItems: "center" }}>
                <div className="field-label">Day-by-day plan</div>
                <Button variant="ghost" size="sm" icon="sparkle" onClick={() => set({ itinerary: generateItinerary(w) })}>Auto-generate</Button>
              </div>
              <Repeater
                value={w.itinerary}
                onChange={(v) => set({ itinerary: v })}
                blank={{ title: "", body: "" }}
                title={(i, it) => `Day ${i + 1}${it.title ? " · " + it.title : ""}`}
                addLabel="Add day"
                renderItem={(it, update) => (
                  <div className="col gap-3">
                    <Field label="Title"><Input value={it.title} onChange={(e) => update({ title: e.target.value })} placeholder="Arrive in Ooty" /></Field>
                    <Field label="Description"><Textarea value={it.body} onChange={(e) => update({ body: e.target.value })} placeholder="Pickup from Bengaluru early morning…" /></Field>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* ---------------- GALLERY ---------------- */}
        {tab === "gallery" && (
          <div className="col gap-4">
            <p className="muted" style={{ fontSize: 13 }}>Postcards from this trip — these power the gallery grid and the full-screen lightbox. The cover image is shown first automatically.</p>
            <ImageGrid label="Gallery photos" value={w.gallery} onChange={(v) => set({ gallery: v })} />
          </div>
        )}

        {/* ---------------- INCLUDED & FAQs ---------------- */}
        {tab === "included" && (
          <div className="col gap-6">
            <SectionCard title="What's included">
              <StringList value={w.inclusions} onChange={(v) => set({ inclusions: v })} placeholder="Round-trip transport from your city" addLabel="Add inclusion" />
            </SectionCard>
            <SectionCard title="Not included">
              <StringList value={w.exclusions} onChange={(v) => set({ exclusions: v })} placeholder="Travel insurance" addLabel="Add exclusion" />
            </SectionCard>
            <SectionCard title="FAQs">
              <Repeater
                value={w.faqs}
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

        {/* ---------------- EXTRAS ---------------- */}
        {tab === "extras" && (
          <div className="col gap-6">
            <SectionCard title="Trust points" hint="Shown under the booking form (✓ Small groups …)">
              <StringList value={w.trustPoints} onChange={(v) => set({ trustPoints: v })} placeholder="Small groups" addLabel="Add point" />
            </SectionCard>
            <SectionCard title="More weekend trips" hint={`Pick up to 3 related getaways. ${w.relatedIds.length}/3 selected.`}>
              <div className="related-grid">
                {others.map((o) => {
                  const on = w.relatedIds.includes(o.id);
                  const full = !on && w.relatedIds.length >= 3;
                  return (
                    <button key={o.id} type="button" className={`related-card ${on ? "on" : ""} ${full ? "disabled" : ""}`} disabled={full}
                      onClick={() => setRelated(on ? w.relatedIds.filter((s) => s !== o.id) : [...w.relatedIds, o.id])}>
                      <img src={o.image} alt="" />
                      <div className="col gap-1" style={{ minWidth: 0 }}>
                        <strong className="truncate">{o.name}</strong>
                        <span className="tiny">{o.subtitle} · {o.salePrice}</span>
                      </div>
                      {on && <span className="related-check"><IconButton name="check" size="sm" /></span>}
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </Drawer>
  );
}

// Setup checklist — which key sections a weekend trip has filled in.
const wkSetupItems = (w) => [
  ["Cover image", !!w.image],
  ["Description", !!(w.description || "").trim()],
  ["Highlights", (w.highlights || []).length > 0],
  ["Itinerary", (w.itinerary || []).length > 0],
  ["Gallery", (w.gallery || []).length > 0],
  ["FAQs", (w.faqs || []).length > 0],
];
const wkSetupScore = (w) => {
  const it = wkSetupItems(w);
  return Math.round((it.filter((x) => x[1]).length / it.length) * 100);
};

function WkSetupBar({ w }) {
  const items = wkSetupItems(w);
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

const WK_SORTS = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Rating: high → low" },
  { value: "savings", label: "Biggest savings" },
  { value: "setup", label: "Least complete" },
];

export default function Weekends() {
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
    const list = data.weekends;
    const rated = list.filter((w) => Number(w.rating) > 0);
    const avgRating = rated.length ? rated.reduce((n, w) => n + Number(w.rating || 0), 0) / rated.length : 0;
    const prices = list.map((w) => priceNum(w.salePrice)).filter(Boolean);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const needs = list.filter((w) => wkSetupScore(w) < 100).length;
    return { total: list.length, avgRating, avgPrice, needs };
  }, [data.weekends]);

  const rows = useMemo(() => {
    let list = data.weekends.filter((w) => {
      if (region !== "all" && w.region !== region) return false;
      if (q && !`${w.name} ${w.to} ${w.from}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    list = [...list];
    switch (sort) {
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": list.sort((a, b) => priceNum(a.salePrice) - priceNum(b.salePrice)); break;
      case "price-desc": list.sort((a, b) => priceNum(b.salePrice) - priceNum(a.salePrice)); break;
      case "rating": list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)); break;
      case "savings": list.sort((a, b) => priceNum(b.savings) - priceNum(a.savings)); break;
      case "setup": list.sort((a, b) => wkSetupScore(a) - wkSetupScore(b)); break;
      default: break;
    }
    return list;
  }, [data.weekends, q, region, sort]);

  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [q, region, sort]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const rangeStart = rows.length ? (safePage - 1) * PER_PAGE + 1 : 0;
  const rangeEnd = Math.min(safePage * PER_PAGE, rows.length);

  const duplicate = (w) => {
    const exists = (i) => data.weekends.some((x) => x.id === i);
    let base = `${w.id}-copy`, id = base, n = 2;
    while (exists(id)) id = `${base}-${n++}`;
    upsert("weekends", { ...structuredClone(w), id, name: `${w.name} (copy)` });
    toast(`Duplicated “${w.name}”`);
  };

  const columns = [
    {
      key: "name", header: "Weekend trip",
      render: (r) => (
        <div className="row gap-3">
          <img className="cell-thumb" src={r.image} alt="" />
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div className="tiny">{r.from} → {r.to}</div>
          </div>
        </div>
      ),
    },
    { key: "tag", header: "Tag", render: (r) => <Badge tone="neutral">{r.tag}</Badge> },
    { key: "days", header: "Length", render: (r) => <span className="tiny">{r.days}D · {r.nights}N</span> },
    { key: "salePrice", header: "Price", render: (r) => (<span><span style={{ fontWeight: 600 }}>{r.salePrice}</span> <span className="tiny" style={{ textDecoration: "line-through" }}>{r.originalPrice}</span></span>) },
    { key: "rating", header: "Rating", render: (r) => <span><span style={{ color: "var(--accent-ink)" }}>★</span> {r.rating} <span className="tiny">({r.reviews})</span></span> },
    { key: "status", header: "Status", render: (r) => <Badge tone={toneBadge[r.statusTone] || "neutral"} dot>{r.status}</Badge> },
    { key: "setup", header: "Setup", render: (r) => <WkSetupBar w={r} /> },
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
    { icon: "calendar", label: "Weekend trips", value: stats.total, sub: "short getaways" },
    { icon: "tag", label: "Avg price", value: stats.avgPrice ? "₹" + stats.avgPrice.toLocaleString("en-IN") : "—", sub: "per person" },
    { icon: "star", label: "Avg rating", value: stats.avgRating ? stats.avgRating.toFixed(1) : "—", sub: "from reviews" },
    { icon: "sparkle", label: "Need setup", value: stats.needs, sub: stats.needs ? "missing sections" : "all complete", warn: stats.needs > 0 },
  ];

  return (
    <div>
      <PageHeader title="Weekend Trips" subtitle={`${data.weekends.length} short getaways`}>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New weekend</Button>
      </PageHeader>

      <div className="list-stats">
        {STAT_CARDS.map((c) => (
          <div className="list-stat" key={c.label}>
            <span className={`list-stat-ico ${c.warn ? "warn" : ""}`}><Icon name={c.icon} size={18} /></span>
            <div>
              <div className="list-stat-num">{c.value}</div>
              <div className="list-stat-label">{c.label}</div>
              <div className="tiny" style={{ color: "var(--text-3)" }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="list-toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search weekends…" />
        <span className="toolbar-spacer" />
        <div className="pill-tabs">
          {["all", ...REGIONS].map((r) => (
            <button key={r} className={`pill-tab ${region === r ? "active" : ""}`} onClick={() => setRegion(r)}>
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
        <div className="sort-wrap"><Select value={sort} options={WK_SORTS} onChange={(e) => setSort(e.target.value)} /></div>
        <div className="seg">
          <button className={`seg-btn ${view === "table" ? "on" : ""}`} title="Table view" onClick={() => setView("table")}><Icon name="menu" size={16} /></button>
          <button className={`seg-btn ${view === "grid" ? "on" : ""}`} title="Grid view" onClick={() => setView("grid")}><Icon name="layout" size={16} /></button>
        </div>
      </div>

      <div className="tiny" style={{ margin: "0 0 var(--sp-3)", color: "var(--text-3)" }}>
        Showing {rangeStart}–{rangeEnd} of {rows.length}{rows.length !== data.weekends.length ? ` (filtered from ${data.weekends.length})` : ""}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="search" title="No weekend trips match" message="Try a different search or region filter." />
      ) : view === "table" ? (
        <DataTable columns={columns} rows={pageRows} rowKey={(r) => r.id} onRowClick={(r) => setEditing(r)} />
      ) : (
        <div className="cat-grid">
          {pageRows.map((r) => (
            <div className="cat-card" key={r.id} onClick={() => setEditing(r)}>
              <div className="cat-card-img">
                <img src={r.image} alt="" />
                <Badge tone={toneBadge[r.statusTone] || "neutral"} dot>{r.status}</Badge>
              </div>
              <div className="cat-card-body">
                <div>
                  <div className="truncate" style={{ fontWeight: 600 }}>{r.name}</div>
                  <div className="tiny truncate">{r.from} → {r.to}</div>
                </div>
                <div className="row-between" style={{ alignItems: "center" }}>
                  <span className="tiny">{r.days}D · {r.nights}N · <span style={{ color: "var(--accent-ink)" }}>★</span> {r.rating}</span>
                  <span><strong>{r.salePrice}</strong> <span className="tiny" style={{ textDecoration: "line-through" }}>{r.originalPrice}</span></span>
                </div>
                <WkSetupBar w={r} />
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
          <button className="pager-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} title="Previous"><Icon name="chevronLeft" size={16} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pager-num ${p === safePage ? "on" : ""}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pager-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} title="Next"><Icon name="chevronRight" size={16} /></button>
        </div>
      )}

      {creating && <WeekendEditor onClose={() => setCreating(false)} />}
      {editing && <WeekendEditor value={editing} onClose={() => setEditing(null)} />}
      {confirm && (
        <ConfirmDialog
          title="Delete weekend trip"
          message={`Delete “${confirm.name}”? This cannot be undone.`}
          onConfirm={() => remove("weekends", confirm.id)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
