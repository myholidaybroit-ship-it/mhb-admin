// Booking Catalog — the priced master data that powers the package builder's
// dropdowns. Pick any of these in the builder and the price auto-fills; or type
// a custom one-off. Hotels (city → rooms+price), Transport (city → vehicle+price)
// and Sightseeing (city → adult/child price). All prices are INR (B2C).
// Everything syncs to the backend via the generic resource store (upsert / remove).

import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Button, Badge, Modal, Field, Input, Textarea, Select, ComboSelect,
  ImageGrid, ImagePicker, Repeater, SearchInput, IconButton, ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import { MEAL_PLANS, STAR_CATEGORIES, TRANSFER_BASIS, money, num } from "../lib/crm.js";

// Distinct cities already used across the catalog + destinations — feeds the
// City dropdowns so the same spellings get reused (with a custom escape hatch).
function useCityOptions() {
  const { data } = useStore();
  return useMemo(() => {
    const set = new Set();
    (data.hotels || []).forEach((h) => h.city && set.add(h.city));
    (data.transports || []).forEach((t) => t.city && set.add(t.city));
    (data.places || []).forEach((p) => p.city && set.add(p.city));
    (data.destinations || []).forEach((d) => d.name && set.add(d.name));
    return [...set].sort().map((c) => ({ value: c, label: c }));
  }, [data.hotels, data.transports, data.places, data.destinations]);
}

/* ============================== Hotels ============================== */
function HotelModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const cities = useCityOptions();
  const [h, setH] = useState(() => value || {
    id: uid("ht"), name: "", city: "", category: "3 Star", location: "",
    rating: 3, score: "", mealPlan: "CP", currency: "INR", images: [],
    rooms: [{ type: "Standard room", mealPlan: "CP", price: "", exAdult: "", exChild: "" }],
  });
  const set = (patch) => setH((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!h.name.trim()) return toast("Hotel name is required", "error");
    upsert("hotels", { ...h, currency: "INR" });
    toast(value ? "Hotel saved" : "Hotel added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit hotel" : "New hotel"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save hotel</Button></>}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Hotel name" required className="span-2"><Input value={h.name} onChange={(e) => set({ name: e.target.value })} placeholder="ibis Bangkok Sukhumvit 4" /></Field>
          <Field label="City"><ComboSelect value={h.city} onChange={(city) => set({ city })} options={cities} placeholder="Select city…" /></Field>
          <Field label="Category"><ComboSelect value={h.category} onChange={(category) => set({ category })} options={STAR_CATEGORIES} placeholder="Category…" /></Field>
          <Field label="Location / landmark"><Input value={h.location} onChange={(e) => set({ location: e.target.value })} placeholder="Near to Sukhumvit" /></Field>
          <Field label="Rating (stars)"><Input type="number" min="0" max="5" value={h.rating} onChange={(e) => set({ rating: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Review score"><Input value={h.score} onChange={(e) => set({ score: e.target.value })} placeholder="4.0" /></Field>
          <Field label="Default meal plan"><ComboSelect value={h.mealPlan} onChange={(mealPlan) => set({ mealPlan })} options={MEAL_PLANS} placeholder="Meal plan…" /></Field>
        </div>
        <ImageGrid label="Photos" value={h.images} onChange={(images) => set({ images })} />
        <Field label="Room types & per-night price (₹)" hint="Price is per room, per night. EX adult/child = extra-bed charge per night.">
          <Repeater value={h.rooms} onChange={(rooms) => set({ rooms })} blank={{ type: "", mealPlan: h.mealPlan || "CP", price: "", exAdult: "", exChild: "" }}
            title={(i, r) => r.type || `Room ${i + 1}`} addLabel="Add room type"
            renderItem={(r, u) => (
              <div className="form-grid">
                <Field label="Room type" className="span-2"><Input value={r.type} onChange={(e) => u({ type: e.target.value })} placeholder="Superior room" /></Field>
                <Field label="Meal plan"><ComboSelect value={r.mealPlan} onChange={(mealPlan) => u({ mealPlan })} options={MEAL_PLANS} placeholder="Meal…" /></Field>
                <Field label="Price / night (₹)"><Input type="number" value={r.price} onChange={(e) => u({ price: e.target.value })} placeholder="0" /></Field>
                <Field label="EX adult / night (₹)"><Input type="number" value={r.exAdult} onChange={(e) => u({ exAdult: e.target.value })} placeholder="0" /></Field>
                <Field label="EX child / night (₹)"><Input type="number" value={r.exChild} onChange={(e) => u({ exChild: e.target.value })} placeholder="0" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Modal>
  );
}

function HotelsTab() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data.hotels || []).filter((h) => !q || [h.name, h.city, h.category].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()))), [data.hotels, q]);
  const columns = [
    { key: "name", header: "Hotel", render: (r) => (
      <div className="row gap-3"><img className="cell-thumb" src={r.images?.[0]} alt="" />
        <div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{[r.city, r.location].filter(Boolean).join(" · ")}</div></div></div>
    )},
    { key: "category", header: "Category", render: (r) => <Badge tone="neutral">{r.category || `${r.rating || "?"}★`}</Badge> },
    { key: "rooms", header: "Rooms", render: (r) => (r.rooms || []).length ? `${r.rooms.length} · from ${money(Math.min(...r.rooms.map((x) => num(x.price) || Infinity)))}` : "—" },
    { key: "actions", actions: true, render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
      </div>
    )},
  ];
  return (
    <div className="col gap-4">
      <div className="row-between">
        <SearchInput value={q} onChange={setQ} placeholder="Search hotels, city…" />
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New hotel</Button>
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(r) => setEditing(r)}
        empty={<EmptyState icon="map" title="No hotels yet" message="Add hotels with room types and per-night prices — they'll appear as dropdowns in the package builder."
          action={<Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>New hotel</Button>} />} />
      {creating && <HotelModal onClose={() => setCreating(false)} />}
      {editing && <HotelModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete hotel" message={`Delete “${confirm.name}”?`} onConfirm={() => remove("hotels", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Transport ============================== */
function TransportModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const cities = useCityOptions();
  const [t, setT] = useState(() => value || {
    id: uid("tr"), name: "", city: "", vehicle: "Van", capacity: "", basis: "Private", price: "", currency: "INR", note: "",
  });
  const set = (patch) => setT((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!t.name.trim()) return toast("Transport name is required", "error");
    upsert("transports", { ...t, currency: "INR" });
    toast(value ? "Transport saved" : "Transport added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit transport" : "New transport"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save transport</Button></>}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Transport / route name" required className="span-2"><Input value={t.name} onChange={(e) => set({ name: e.target.value })} placeholder="01 Way Taxi From BKK Airport To Bangkok Hotel" /></Field>
          <Field label="City"><ComboSelect value={t.city} onChange={(city) => set({ city })} options={cities} placeholder="Select city…" /></Field>
          <Field label="Vehicle"><ComboSelect value={t.vehicle} onChange={(vehicle) => set({ vehicle })} options={["Van", "Sedan", "SUV", "Coach", "Speed Boat", "Ferry"]} placeholder="Vehicle…" /></Field>
          <Field label="Capacity (seats)"><Input type="number" value={t.capacity} onChange={(e) => set({ capacity: e.target.value })} placeholder="6" /></Field>
          <Field label="Basis"><Select value={t.basis} options={TRANSFER_BASIS} onChange={(e) => set({ basis: e.target.value })} /></Field>
          <Field label="Price (₹)" hint="Flat price for this transfer."><Input type="number" value={t.price} onChange={(e) => set({ price: e.target.value })} placeholder="0" /></Field>
          <Field label="Note" className="span-2"><Input value={t.note} onChange={(e) => set({ note: e.target.value })} placeholder="Optional" /></Field>
        </div>
      </div>
    </Modal>
  );
}

function TransportTab() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data.transports || []).filter((t) => !q || [t.name, t.city, t.vehicle].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()))), [data.transports, q]);
  const columns = [
    { key: "name", header: "Transport", render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{[r.city, r.vehicle, r.basis].filter(Boolean).join(" · ")}</div></div>) },
    { key: "price", header: "Price", render: (r) => <b>{money(r.price)}</b> },
    { key: "actions", actions: true, render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
      </div>
    )},
  ];
  return (
    <div className="col gap-4">
      <div className="row-between">
        <SearchInput value={q} onChange={setQ} placeholder="Search transport, city…" />
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New transport</Button>
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(r) => setEditing(r)}
        empty={<EmptyState icon="compass" title="No transport yet" message="Add transfers and routes with prices — they'll appear as dropdowns in the package builder."
          action={<Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>New transport</Button>} />} />
      {creating && <TransportModal onClose={() => setCreating(false)} />}
      {editing && <TransportModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete transport" message={`Delete “${confirm.name}”?`} onConfirm={() => remove("transports", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Sightseeing (places) ============================== */
function SightModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const cities = useCityOptions();
  const [p, setP] = useState(() => value || {
    id: uid("pl"), name: "", city: "", category: "Tour", duration: "", basis: "SIC",
    adultPrice: "", childPrice: "", currency: "INR", note: "Entrance ticket is included", description: "", image: "",
  });
  const set = (patch) => setP((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!p.name.trim()) return toast("Name is required", "error");
    upsert("places", { ...p, currency: "INR" });
    toast(value ? "Sightseeing saved" : "Sightseeing added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit sightseeing" : "New sightseeing"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save sightseeing</Button></>}>
      <div className="col gap-4">
        <ImagePicker label="Image" value={p.image} onChange={(image) => set({ image })} />
        <div className="form-grid">
          <Field label="Name" required className="span-2"><Input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Coral Island Tour with lunch on Speed Boat" /></Field>
          <Field label="City"><ComboSelect value={p.city} onChange={(city) => set({ city })} options={cities} placeholder="Select city…" /></Field>
          <Field label="Category"><ComboSelect value={p.category} onChange={(category) => set({ category })} options={["Tour", "Cruise", "Entrance", "Activity", "Show"]} placeholder="Category…" /></Field>
          <Field label="Basis"><Select value={p.basis} options={TRANSFER_BASIS} onChange={(e) => set({ basis: e.target.value })} /></Field>
          <Field label="Duration" hint="Optional badge e.g. 6 Hrs"><Input value={p.duration} onChange={(e) => set({ duration: e.target.value })} /></Field>
          <Field label="Adult price (₹)"><Input type="number" value={p.adultPrice} onChange={(e) => set({ adultPrice: e.target.value })} placeholder="0" /></Field>
          <Field label="Child price (₹)"><Input type="number" value={p.childPrice} onChange={(e) => set({ childPrice: e.target.value })} placeholder="0" /></Field>
        </div>
        <Field label="Description"><Textarea value={p.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Note" hint="Shown as 'Note: …' under the activity"><Input value={p.note} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function SightseeingTab() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data.places || []).filter((p) => !q || [p.name, p.city, p.category].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()))), [data.places, q]);
  const columns = [
    { key: "name", header: "Sightseeing", render: (r) => (
      <div className="row gap-3"><img className="cell-thumb" src={r.image} alt="" />
        <div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{[r.city, r.category, r.basis].filter(Boolean).join(" · ")}</div></div></div>
    )},
    { key: "price", header: "Adult / Child", render: (r) => <span>{money(r.adultPrice)} <span className="tiny">/ {money(r.childPrice)}</span></span> },
    { key: "actions", actions: true, render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
      </div>
    )},
  ];
  return (
    <div className="col gap-4">
      <div className="row-between">
        <SearchInput value={q} onChange={setQ} placeholder="Search sightseeing, city…" />
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New sightseeing</Button>
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(r) => setEditing(r)}
        empty={<EmptyState icon="star" title="No sightseeing yet" message="Add tours and activities with adult/child prices — they'll appear as dropdowns in the package builder."
          action={<Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>New sightseeing</Button>} />} />
      {creating && <SightModal onClose={() => setCreating(false)} />}
      {editing && <SightModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete sightseeing" message={`Delete “${confirm.name}”?`} onConfirm={() => remove("places", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Page ============================== */
export default function Catalog() {
  const [tab, setTab] = useState("hotels");
  return (
    <div>
      <PageHeader title="Booking Catalog" subtitle="Your priced master data (₹) — hotels, transport and sightseeing. Build these once, then pick them (price auto-fills) in the package builder, or enter a custom one-off." />
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "hotels", label: "Hotels" },
        { value: "transport", label: "Transport" },
        { value: "sightseeing", label: "Sightseeing" },
      ]} />
      <div style={{ marginTop: "var(--sp-5)" }}>
        {tab === "hotels" && <HotelsTab />}
        {tab === "transport" && <TransportTab />}
        {tab === "sightseeing" && <SightseeingTab />}
      </div>
    </div>
  );
}
