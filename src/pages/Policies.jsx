import { useState } from "react";
import { useSection } from "../lib/store.jsx";
import { SEED_POLICIES } from "../lib/seed.js";
import {
  PageHeader, Button, Drawer, Field, Input, Textarea, IconButton,
  ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";

const slugify = (s = "") => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ---------------- Single policy section editor (drawer) ---------------- */
function SectionEditor({ value, onSave, onClose }) {
  const toast = useToast();
  const [s, setS] = useState(() => value || { id: "", title: "", body: "" });
  const set = (p) => setS((x) => ({ ...x, ...p }));
  const save = () => {
    if (!s.title.trim()) return toast("Section title is required", "error");
    onSave({ ...s, id: s.id || slugify(s.title) });
    onClose();
  };
  return (
    <Drawer wide title={value ? s.title || "Edit section" : "New policy section"} subtitle="Policy / terms section" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save section</Button></>}>
      <div className="col gap-5">
        <div className="form-grid">
          <Field label="Section title" required><Input value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="If you cancel your holiday" /></Field>
          <Field label="Anchor id" hint="URL hash (e.g. #cancellation) — auto from title"><Input value={s.id} onChange={(e) => set({ id: slugify(e.target.value) })} placeholder="cancellation" /></Field>
        </div>
        <Field label="Body" hint="Full text. Blank line = new paragraph; start a line with “• ” for a bullet.">
          <Textarea value={s.body} onChange={(e) => set({ body: e.target.value })} rows={16} style={{ lineHeight: 1.6 }} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Page header / meta editor (drawer) ---------------- */
function HeaderEditor({ policies, onSave, onClose }) {
  const [p, setP] = useState(() => structuredClone(policies || {}));
  const set = (patch) => setP((s) => ({ ...s, ...patch }));
  return (
    <Drawer wide title="Policy page header" subtitle="Hero, dates & contact" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={() => { onSave(p); onClose(); }}>Save header</Button></>}>
      <div className="col gap-5">
        <div className="form-grid">
          <Field label="Kicker"><Input value={p.kicker || ""} onChange={(e) => set({ kicker: e.target.value })} placeholder="Legal" /></Field>
          <Field label="Last updated"><Input value={p.lastUpdated || ""} onChange={(e) => set({ lastUpdated: e.target.value })} placeholder="Last updated · January 2026" /></Field>
          <Field label="Title"><Input value={p.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="Terms of Use" /></Field>
          <Field label="Title accent" hint="Highlighted word"><Input value={p.accent || ""} onChange={(e) => set({ accent: e.target.value })} placeholder="Use" /></Field>
          <Field label="Subtitle" className="span-2"><Textarea value={p.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} rows={2} /></Field>
          <Field label="Contact email"><Input value={p.contactEmail || ""} onChange={(e) => set({ contactEmail: e.target.value })} placeholder="contact@myholidaybro.com" /></Field>
          <Field label="Contact phone"><Input value={p.contactPhone || ""} onChange={(e) => set({ contactPhone: e.target.value })} placeholder="+91 96666 98990" /></Field>
        </div>
      </div>
    </Drawer>
  );
}

export default function Policies() {
  const [stored, setPolicies] = useSection("policies");
  const toast = useToast();
  const p = { ...SEED_POLICIES, ...(stored || {}) };
  const sections = p.sections || [];

  const [editSec, setEditSec] = useState(null);
  const [newSec, setNewSec] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const saveSection = (sec) => {
    const exists = sections.some((x) => x.id === sec.id) && (editSec && editSec.id === sec.id);
    const idClash = !editSec && sections.some((x) => x.id === sec.id);
    const finalSec = idClash ? { ...sec, id: `${sec.id}-${Math.random().toString(36).slice(2, 5)}` } : sec;
    const next = exists ? sections.map((x) => (x.id === sec.id ? finalSec : x)) : [...sections, finalSec];
    setPolicies({ ...p, sections: next });
    toast(exists ? "Section saved" : "Section added");
  };
  const removeSection = (id) => setPolicies({ ...p, sections: sections.filter((x) => x.id !== id) });
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setPolicies({ ...p, sections: next });
  };

  const columns = [
    {
      key: "title", header: "Section",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          <div className="tiny">#{r.id}</div>
        </div>
      ),
    },
    { key: "body", header: "Preview", render: (r) => <span className="tiny" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 480 }}>{(r.body || "").replace(/\n+/g, " ")}</span> },
    {
      key: "actions", actions: true,
      render: (r) => {
        const i = sections.findIndex((x) => x.id === r.id);
        return (
          <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
            <IconButton name="chevronUp" size="sm" title="Move up" onClick={(e) => { e.stopPropagation(); move(i, -1); }} />
            <IconButton name="chevronDown" size="sm" title="Move down" onClick={(e) => { e.stopPropagation(); move(i, 1); }} />
            <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEditSec(r); }} />
            <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(r); }} />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Policies" subtitle={`${p.title || "Legal page"} · ${sections.length} sections`}>
        <Button variant="ghost" icon="edit" onClick={() => setHeaderOpen(true)}>Edit page header</Button>
        <Button variant="primary" icon="plus" onClick={() => setNewSec(true)}>New section</Button>
      </PageHeader>

      {sections.length === 0 ? (
        <EmptyState icon="doc" title="No policy sections" message="Add a section to build the policy page."
          action={<Button variant="secondary" icon="plus" onClick={() => setNewSec(true)}>New section</Button>} />
      ) : (
        <DataTable columns={columns} rows={sections} rowKey={(r) => r.id} onRowClick={(r) => setEditSec(r)} />
      )}

      {(newSec || editSec) && (
        <SectionEditor value={editSec} onSave={saveSection} onClose={() => { setNewSec(false); setEditSec(null); }} />
      )}
      {headerOpen && (
        <HeaderEditor policies={p} onSave={(v) => { setPolicies(v); toast("Page header saved"); }} onClose={() => setHeaderOpen(false)} />
      )}
      {confirm && (
        <ConfirmDialog title="Delete section" message={`Delete “${confirm.title}”? This cannot be undone.`}
          onConfirm={() => removeSection(confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
