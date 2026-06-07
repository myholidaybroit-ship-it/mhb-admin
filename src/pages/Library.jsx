import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Button, Badge, Modal, Field, Input, Textarea, Select,
  StringList, ImagePicker, ImageGrid, Repeater, Toggle, SearchInput, IconButton,
  ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";

/* ============================== Places ============================== */
function PlaceModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [p, setP] = useState(() => value || { id: uid("pl"), name: "", description: "", image: "", duration: "", note: "Entrance ticket is included" });
  const set = (patch) => setP((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!p.name.trim()) return toast("Name is required", "error");
    upsert("places", p);
    toast(value ? "Place saved" : "Place added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit place" : "New place"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save</Button></>}>
      <div className="col gap-4">
        <ImagePicker label="Image" value={p.image} onChange={(v) => set({ image: v })} />
        <div className="form-grid">
          <Field label="Name" required><Input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="Uluwatu Temple" /></Field>
          <Field label="Duration" hint="Optional badge e.g. 6 Hrs"><Input value={p.duration} onChange={(e) => set({ duration: e.target.value })} /></Field>
        </div>
        <Field label="Description"><Textarea value={p.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Note" hint="Shown as 'Note: …' under the activity"><Input value={p.note} onChange={(e) => set({ note: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function PlacesTab() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const rows = useMemo(() => data.places.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())), [data.places, q]);

  const columns = [
    { key: "name", header: "Place", render: (r) => (
      <div className="row gap-3"><img className="cell-thumb" src={r.image} alt="" />
        <div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny truncate" style={{ maxWidth: 380 }}>{r.description}</div></div></div>
    )},
    { key: "duration", header: "Duration", render: (r) => r.duration ? <Badge tone="accent">{r.duration}</Badge> : <span className="tiny">—</span> },
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
        <SearchInput value={q} onChange={setQ} placeholder="Search places…" />
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New place</Button>
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(r) => setEditing(r)} />
      {creating && <PlaceModal onClose={() => setCreating(false)} />}
      {editing && <PlaceModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete place" message={`Delete “${confirm.name}”?`} onConfirm={() => remove("places", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Hotels ============================== */
function HotelModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [h, setH] = useState(() => value || { id: uid("ht"), name: "", location: "", rating: 4, score: "", checkin: "2:00 PM", checkout: "12:00 PM", images: [], rooms: [{ type: "Deluxe Room", refundable: false, breakfast: true }] });
  const set = (patch) => setH((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!h.name.trim()) return toast("Name is required", "error");
    upsert("hotels", h);
    toast(value ? "Hotel saved" : "Hotel added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit hotel" : "New hotel"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save</Button></>}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Hotel name" required className="span-2"><Input value={h.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Location"><Input value={h.location} onChange={(e) => set({ location: e.target.value })} placeholder="Near to Legian Beach" /></Field>
          <Field label="Rating (stars)"><Input type="number" min="0" max="5" value={h.rating} onChange={(e) => set({ rating: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Review score"><Input value={h.score} onChange={(e) => set({ score: e.target.value })} placeholder="4.0" /></Field>
          <Field label="Check-in"><Input value={h.checkin} onChange={(e) => set({ checkin: e.target.value })} /></Field>
          <Field label="Check-out"><Input value={h.checkout} onChange={(e) => set({ checkout: e.target.value })} /></Field>
        </div>
        <ImageGrid label="Photos" value={h.images} onChange={(images) => set({ images })} />
        <Field label="Room types">
          <Repeater value={h.rooms} onChange={(rooms) => set({ rooms })} blank={{ type: "", refundable: false, breakfast: true }}
            title={(i, r) => r.type || `Room ${i + 1}`} addLabel="Add room"
            renderItem={(r, u) => (
              <div className="col gap-3">
                <Field label="Room type"><Input value={r.type} onChange={(e) => u({ type: e.target.value })} placeholder="Deluxe Room" /></Field>
                <div className="row gap-4">
                  <Toggle checked={r.refundable} onChange={(v) => u({ refundable: v })} label="Refundable" />
                  <Toggle checked={r.breakfast} onChange={(v) => u({ breakfast: v })} label="Breakfast included" />
                </div>
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
  const rows = useMemo(() => data.hotels.filter((h) => !q || h.name.toLowerCase().includes(q.toLowerCase())), [data.hotels, q]);
  const columns = [
    { key: "name", header: "Hotel", render: (r) => (
      <div className="row gap-3"><img className="cell-thumb" src={r.images?.[0]} alt="" />
        <div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{r.location}</div></div></div>
    )},
    { key: "rating", header: "Rating", render: (r) => <span>{"★".repeat(r.rating)} <span className="tiny">{r.score}</span></span> },
    { key: "rooms", header: "Rooms", render: (r) => `${r.rooms?.length || 0}` },
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
        <SearchInput value={q} onChange={setQ} placeholder="Search hotels…" />
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New hotel</Button>
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(r) => setEditing(r)} />
      {creating && <HotelModal onClose={() => setCreating(false)} />}
      {editing && <HotelModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete hotel" message={`Delete “${confirm.name}”?`} onConfirm={() => remove("hotels", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Content blocks ============================== */
function BlockModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [b, setB] = useState(() => value || { id: uid("bk"), title: "", kind: "list", items: [], sections: [] });
  const set = (patch) => setB((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!b.title.trim()) return toast("Title is required", "error");
    upsert("blocks", b);
    toast(value ? "Block saved" : "Block added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit content block" : "New content block"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save</Button></>}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Title" required><Input value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="Standard Inclusions" /></Field>
          <Field label="Type" hint="List = bullets · Sections = heading + body">
            <Select value={b.kind} options={[{ value: "list", label: "Bullet list" }, { value: "sections", label: "Heading sections" }]} onChange={(e) => set({ kind: e.target.value })} />
          </Field>
        </div>
        {b.kind === "list" ? (
          <Field label="Items"><StringList value={b.items} onChange={(items) => set({ items })} addLabel="Add item" /></Field>
        ) : (
          <Field label="Sections">
            <Repeater value={b.sections} onChange={(sections) => set({ sections })} blank={{ heading: "", body: "" }}
              title={(i, sx) => sx.heading || `Section ${i + 1}`} addLabel="Add section"
              renderItem={(sx, u) => (
                <div className="col gap-3">
                  <Field label="Heading"><Input value={sx.heading} onChange={(e) => u({ heading: e.target.value })} /></Field>
                  <Field label="Body"><Textarea value={sx.body} onChange={(e) => u({ body: e.target.value })} /></Field>
                </div>
              )} />
          </Field>
        )}
      </div>
    </Modal>
  );
}

function BlocksTab() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const columns = [
    { key: "title", header: "Block", render: (r) => <span style={{ fontWeight: 600 }}>{r.title}</span> },
    { key: "kind", header: "Type", render: (r) => <Badge tone="neutral">{r.kind === "list" ? "List" : "Sections"}</Badge> },
    { key: "count", header: "Entries", render: (r) => r.kind === "list" ? `${r.items?.length || 0} items` : `${r.sections?.length || 0} sections` },
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
        <p className="muted" style={{ fontSize: 13 }}>Reusable notes, inclusions, exclusions and terms you can drop into any itinerary.</p>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New block</Button>
      </div>
      <DataTable columns={columns} rows={data.blocks} onRowClick={(r) => setEditing(r)} />
      {creating && <BlockModal onClose={() => setCreating(false)} />}
      {editing && <BlockModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete block" message={`Delete “${confirm.title}”?`} onConfirm={() => remove("blocks", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Page ============================== */
export default function Library() {
  const [tab, setTab] = useState("places");
  return (
    <div>
      <PageHeader title="Library" subtitle="Pre-made building blocks — reuse these to assemble itineraries fast." />
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "places", label: "Places & Activities" },
        { value: "hotels", label: "Hotels" },
        { value: "blocks", label: "Content Blocks" },
      ]} />
      <div style={{ marginTop: "var(--sp-5)" }}>
        {tab === "places" && <PlacesTab />}
        {tab === "hotels" && <HotelsTab />}
        {tab === "blocks" && <BlocksTab />}
      </div>
    </div>
  );
}
