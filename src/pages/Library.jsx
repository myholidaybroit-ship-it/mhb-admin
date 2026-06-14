// Templates & Blocks — reusable costing sheets (quote templates) and the
// standard notes / inclusions / exclusions / terms blocks dropped into packages.
// (Hotels, Transport and Sightseeing now live in the Booking Catalog page.)

import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Button, Badge, Modal, Field, Input, Textarea, Select,
  StringList, Repeater, SearchInput, IconButton, ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";

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
        <p className="muted" style={{ fontSize: 13 }}>Reusable notes, inclusions, exclusions and terms you can drop into any package.</p>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New block</Button>
      </div>
      <DataTable columns={columns} rows={data.blocks} onRowClick={(r) => setEditing(r)} />
      {creating && <BlockModal onClose={() => setCreating(false)} />}
      {editing && <BlockModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && <ConfirmDialog title="Delete block" message={`Delete “${confirm.title}”?`} onConfirm={() => remove("blocks", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Quote templates ============================== */
const QT_KINDS = ["Hotel", "Transport", "Activity", "Flight", "Visa", "Guide", "Other"];
const qtNum = (v) => Number(v) || 0;
const qtMoney = (n) => "₹" + Math.round(qtNum(n)).toLocaleString("en-IN");
const qtTotal = (t) => {
  const sell = (t.items || []).reduce((s, it) => s + qtNum(it.cost) * (1 + qtNum(it.markupPct) / 100), 0);
  return sell * (1 + qtNum(t.gstPct) / 100);
};

function QuoteTemplateModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [t, setT] = useState(() => value || {
    id: uid("qtpl"), name: "", destination: "",
    items: [{ id: uid("li"), kind: "Hotel", name: "", cost: "", markupPct: 15 }],
    gstPct: 5,
  });
  const set = (p) => setT((s) => ({ ...s, ...p }));
  const setItem = (id, p) => set({ items: t.items.map((it) => (it.id === id ? { ...it, ...p } : it)) });
  const save = () => {
    if (!t.name.trim()) return toast("Template name is required", "error");
    upsert("quoteTemplates", t);
    toast(value ? "Template saved" : "Template added");
    onClose();
  };
  return (
    <Modal wide title={value ? "Edit quote template" : "New quote template"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save template</Button></>}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Template name" required><Input value={t.name} onChange={(e) => set({ name: e.target.value })} placeholder="Bali honeymoon · 5N standard" /></Field>
          <Field label="Destination"><Input value={t.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="Bali" /></Field>
        </div>
        <div className="row-between">
          <span className="tiny" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>Components</span>
          <Button variant="ghost" size="sm" icon="plus" onClick={() => set({ items: [...t.items, { id: uid("li"), kind: "Hotel", name: "", cost: "", markupPct: 15 }] })}>Add line</Button>
        </div>
        <div className="col gap-2">
          {t.items.map((it) => (
            <div className="qtpl-row" key={it.id}>
              <Select value={it.kind} onChange={(e) => setItem(it.id, { kind: e.target.value })} options={QT_KINDS} />
              <Input value={it.name} onChange={(e) => setItem(it.id, { name: e.target.value })} placeholder="Describe the service" />
              <Input type="number" value={it.cost} onChange={(e) => setItem(it.id, { cost: e.target.value })} placeholder="Cost ₹" />
              <Input type="number" value={it.markupPct} onChange={(e) => setItem(it.id, { markupPct: e.target.value })} placeholder="%" />
              <IconButton name="trash" size="sm" title="Remove" onClick={() => set({ items: t.items.filter((x) => x.id !== it.id) })} />
            </div>
          ))}
        </div>
        <div className="form-grid">
          <Field label="GST %"><Input type="number" value={t.gstPct} onChange={(e) => set({ gstPct: e.target.value })} /></Field>
          <Field label="Indicative package price"><Input value={qtMoney(qtTotal(t))} readOnly /></Field>
        </div>
      </div>
      <style>{`.qtpl-row { display:grid; grid-template-columns: 110px 1fr 100px 70px 32px; gap:8px; align-items:center; }`}</style>
    </Modal>
  );
}

function QuoteTemplatesTab() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => (data.quoteTemplates || []).filter((t) => !q || [t.name, t.destination].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()))),
    [data.quoteTemplates, q]
  );
  const columns = [
    { key: "name", header: "Template", render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{r.destination || "Any destination"}</div></div>) },
    { key: "items", header: "Components", render: (r) => <Badge tone="neutral">{(r.items || []).length} line{(r.items || []).length === 1 ? "" : "s"}</Badge> },
    { key: "price", header: "Indicative price", render: (r) => <b>{qtMoney(qtTotal(r))}</b> },
    { key: "actions", actions: true, render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
      </div>
    )},
  ];
  return (
    <div className="col gap-4">
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search templates…" />
        <span className="grow" />
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New quote template</Button>
      </div>
      <DataTable columns={columns} rows={rows}
        empty={<EmptyState icon="copy" title="No quote templates yet" message="Save your standard costing sheets once — load them into any quote from a query, or save an existing quote as a template."
          action={<Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>New quote template</Button>} />} />
      {(creating || editing) && <QuoteTemplateModal value={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
      {confirm && <ConfirmDialog title="Delete template" message={`Delete “${confirm.name}”? Quotes already created from it are unaffected.`} onConfirm={() => remove("quoteTemplates", confirm.id)} onClose={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================== Page ============================== */
export default function Library() {
  const [tab, setTab] = useState("quotes");
  return (
    <div>
      <PageHeader title="Templates & Blocks" subtitle="Build once, reuse forever — costing sheets and reusable content blocks for your packages." />
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "quotes", label: "Quote templates" },
        { value: "blocks", label: "Content Blocks" },
      ]} />
      <div style={{ marginTop: "var(--sp-5)" }}>
        {tab === "quotes" && <QuoteTemplatesTab />}
        {tab === "blocks" && <BlocksTab />}
      </div>
    </div>
  );
}
