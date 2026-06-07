import { useState } from "react";
import { useSection } from "../lib/store.jsx";
import { SEED_CAREERS } from "../lib/seed.js";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Textarea, Repeater,
  IconButton, ConfirmDialog, useToast, EmptyState, ComboSelect,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import DataTable from "../ui/DataTable.jsx";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Contract / Full-time", "Internship", "Freelance"];
const LOCATIONS = [
  "Remote-friendly", "Remote", "Hybrid", "Anywhere in India",
  "Hyderabad", "Bangalore", "Mumbai", "Delhi", "Chennai", "Pune", "Kolkata",
  "Gurugram", "Noida", "Ahmedabad", "Jaipur", "Kochi", "Chandigarh", "Goa",
];
// "Full-time · Hyderabad / Bangalore"  ⇄  { employment, locations[] }
const parseType = (t = "") => {
  const parts = String(t).split("·").map((s) => s.trim()).filter(Boolean);
  return { employment: parts[0] || "", locations: parts[1] ? parts[1].split("/").map((s) => s.trim()).filter(Boolean) : [] };
};
const buildType = (emp, locs = []) => [emp, locs.join(" / ")].filter(Boolean).join(" · ");

// Multi-value location picker: chips + dropdown + free typing.
function LocationPicker({ value = [], onChange }) {
  const add = (loc) => { const t = (loc || "").trim(); if (t && !value.includes(t)) onChange([...value, t]); };
  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));
  const remaining = LOCATIONS.filter((o) => !value.includes(o));
  return (
    <div className="col gap-2">
      <div className="tag-input">
        {value.map((l, i) => (
          <span className="tag-chip" key={i}>{l}<button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${l}`}><Icon name="close" size={12} /></button></span>
        ))}
        <input className="tag-input-field" placeholder={value.length ? "" : "Type a city + Enter"}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(e.target.value); e.target.value = ""; } }}
          onBlur={(e) => { if (e.target.value) { add(e.target.value); e.target.value = ""; } }} />
      </div>
      <select className="select" value="" onChange={(e) => { if (e.target.value) add(e.target.value); e.target.value = ""; }}>
        <option value="">+ Pick a city / location…</option>
        {remaining.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ---------------- Single role editor (modal/drawer) ---------------- */
function RoleEditor({ value, onSave, onClose }) {
  const toast = useToast();
  const [r, setR] = useState(() => value || { id: "rl" + Math.random().toString(36).slice(2, 7), team: "", title: "", type: "", blurb: "" });
  const set = (p) => setR((s) => ({ ...s, ...p }));
  const save = () => {
    if (!r.title.trim()) return toast("Role title is required", "error");
    onSave(r);
    onClose();
  };
  return (
    <Drawer title={value ? r.title || "Edit role" : "New role"} subtitle={r.team || "Open role"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save role</Button></>}>
      <div className="col gap-5">
        <div className="form-grid">
          <Field label="Department / team"><Input value={r.team} onChange={(e) => set({ team: e.target.value })} placeholder="Engineering" /></Field>
          <Field label="Employment type">
            <ComboSelect value={parseType(r.type).employment} onChange={(emp) => set({ type: buildType(emp, parseType(r.type).locations) })} options={EMPLOYMENT_TYPES} placeholder="Full-time" customPlaceholder="Type employment type" />
          </Field>
          <Field label="Location(s)" className="span-2" hint="Pick cities or type your own — add “Remote-friendly” for remote roles">
            <LocationPicker value={parseType(r.type).locations} onChange={(locs) => set({ type: buildType(parseType(r.type).employment, locs) })} />
          </Field>
          <Field label="Role title" required className="span-2"><Input value={r.title} onChange={(e) => set({ title: e.target.value })} placeholder="Frontend Engineer (Next.js)" /></Field>
        </div>
        <Field label="Blurb" hint="The short description on the role card"><Textarea value={r.blurb} onChange={(e) => set({ blurb: e.target.value })} rows={3} placeholder="What this person owns and the kind of fit we're after." /></Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Careers page content editor (intro, perks, fallback) ---------------- */
function PageContentDrawer({ careers, onSave, onClose }) {
  const [c, setC] = useState(() => structuredClone(careers || {}));
  const set = (p) => setC((s) => ({ ...s, ...p }));
  const setHero = (p) => set({ hero: { ...(c.hero || {}), ...p } });
  const setFallback = (p) => set({ fallback: { ...(c.fallback || {}), ...p } });
  return (
    <Drawer wide title="Careers page content" subtitle="Intro, perks & fallback copy" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={() => { onSave(c); onClose(); }}>Save content</Button></>}>
      <div className="col gap-6">
        <div>
          <div className="field-label" style={{ marginBottom: 8, fontSize: "var(--fs-md)" }}>Page intro</div>
          <div className="form-grid">
            <Field label="Kicker"><Input value={c.hero?.kicker || ""} onChange={(e) => setHero({ kicker: e.target.value })} placeholder="Careers · MyHolidayBro" /></Field>
            <Field label="Apply email" hint="Where applications are sent"><Input value={c.email || ""} onChange={(e) => set({ email: e.target.value })} placeholder="careers@myholidaybro.com" /></Field>
            <Field label="Heading"><Input value={c.hero?.heading || ""} onChange={(e) => setHero({ heading: e.target.value })} placeholder="Build the holiday company you" /></Field>
            <Field label="Heading accent" hint="Highlighted last words"><Input value={c.hero?.accent || ""} onChange={(e) => setHero({ accent: e.target.value })} placeholder="wish existed" /></Field>
            <Field label="Sub-heading" className="span-2"><Textarea value={c.hero?.sub || ""} onChange={(e) => setHero({ sub: e.target.value })} rows={2} /></Field>
          </div>
        </div>
        <Field label="Perks">
          <Repeater value={c.perks || []} onChange={(perks) => set({ perks })} blank={{ t: "", d: "" }}
            title={(i, p) => p.t || `Perk ${i + 1}`} addLabel="Add perk"
            renderItem={(p, u) => (
              <div className="col gap-2">
                <Field label="Title"><Input value={p.t} onChange={(e) => u({ t: e.target.value })} placeholder="Health cover" /></Field>
                <Field label="Description"><Textarea value={p.d} onChange={(e) => u({ d: e.target.value })} rows={2} /></Field>
              </div>
            )} />
        </Field>
        <div>
          <div className="field-label" style={{ marginBottom: 8, fontSize: "var(--fs-md)" }}>“Don't see your role?” block</div>
          <div className="form-grid">
            <Field label="Heading" className="span-2"><Input value={c.fallback?.title || ""} onChange={(e) => setFallback({ title: e.target.value })} placeholder="Don't see your role?" /></Field>
            <Field label="Body" className="span-2"><Textarea value={c.fallback?.body || ""} onChange={(e) => setFallback({ body: e.target.value })} rows={2} /></Field>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function Careers() {
  const [stored, setCareers] = useSection("careers");
  const toast = useToast();
  // self-heal: fall back to seed for any missing pieces (e.g. first run)
  const c = { ...SEED_CAREERS, ...(stored || {}) };
  const roles = c.roles || [];

  const [editRole, setEditRole] = useState(null);
  const [newRole, setNewRole] = useState(false);
  const [pageOpen, setPageOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const saveRole = (role) => {
    const exists = roles.some((x) => x.id === role.id);
    const next = exists ? roles.map((x) => (x.id === role.id ? role : x)) : [...roles, role];
    setCareers({ ...c, roles: next });
    toast(exists ? "Role saved" : "Role added");
  };
  const removeRole = (id) => setCareers({ ...c, roles: roles.filter((x) => x.id !== id) });
  const duplicate = (role) => {
    const id = "rl" + Math.random().toString(36).slice(2, 7);
    setCareers({ ...c, roles: [...roles, { ...role, id, title: `${role.title} (copy)` }] });
    toast("Role duplicated");
  };
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= roles.length) return;
    const next = [...roles];
    [next[i], next[j]] = [next[j], next[i]];
    setCareers({ ...c, roles: next });
  };

  const columns = [
    {
      key: "title", header: "Role",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          {r.team ? <div style={{ marginTop: 3 }}><Badge tone="accent">{r.team}</Badge></div> : null}
        </div>
      ),
    },
    { key: "type", header: "Type · location", render: (r) => <span className="tiny">{r.type || "—"}</span> },
    { key: "blurb", header: "Blurb", render: (r) => <span className="tiny" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 360 }}>{r.blurb}</span> },
    {
      key: "actions", actions: true,
      render: (r) => {
        const i = roles.findIndex((x) => x.id === r.id);
        return (
          <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
            <IconButton name="chevronUp" size="sm" title="Move up" onClick={(e) => { e.stopPropagation(); move(i, -1); }} />
            <IconButton name="chevronDown" size="sm" title="Move down" onClick={(e) => { e.stopPropagation(); move(i, 1); }} />
            <IconButton name="copy" size="sm" title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicate(r); }} />
            <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEditRole(r); }} />
            <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(r); }} />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Careers" subtitle={`${roles.length} open role${roles.length === 1 ? "" : "s"} on the careers page`}>
        <Button variant="ghost" icon="edit" onClick={() => setPageOpen(true)}>Edit page content</Button>
        <Button variant="primary" icon="plus" onClick={() => setNewRole(true)}>New role</Button>
      </PageHeader>

      {roles.length === 0 ? (
        <EmptyState icon="briefcase" title="No open roles" message="Add a role to show it on the careers page."
          action={<Button variant="secondary" icon="plus" onClick={() => setNewRole(true)}>New role</Button>} />
      ) : (
        <DataTable columns={columns} rows={roles} rowKey={(r) => r.id} onRowClick={(r) => setEditRole(r)} />
      )}

      {(newRole || editRole) && (
        <RoleEditor value={editRole} onSave={saveRole} onClose={() => { setNewRole(false); setEditRole(null); }} />
      )}
      {pageOpen && (
        <PageContentDrawer careers={c} onSave={(v) => { setCareers(v); toast("Page content saved"); }} onClose={() => setPageOpen(false)} />
      )}
      {confirm && (
        <ConfirmDialog title="Delete role" message={`Delete “${confirm.title}”? This cannot be undone.`}
          onConfirm={() => removeRole(confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
