// Team — sales members who queries get assigned to. Plain CRUD, inline form
// (no modals): add/edit in the card at the top, list below.

import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Field, Input, Select, Button, IconButton, Badge, Toggle,
  useToast, ConfirmDialog, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

const ROLES = ["Sales", "Operations", "Founder", "Support"];
const blank = () => ({ id: uid("tm"), name: "", email: "", phone: "", role: "Sales", active: true });

export default function Team() {
  const { data, upsert, remove } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(null); // null = closed, object = add/edit form
  const [confirm, setConfirm] = useState(null);

  const members = useMemo(
    () => [...(data.teamMembers || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [data.teamMembers]
  );

  const queriesPer = useMemo(() => {
    const map = {};
    (data.tripQueries || []).forEach((q) => { if (q.assignedTo) map[q.assignedTo] = (map[q.assignedTo] || 0) + 1; });
    return map;
  }, [data.tripQueries]);

  const set = (p) => setDraft((s) => ({ ...s, ...p }));
  const save = () => {
    if (!draft.name.trim()) return toast("Name is required", "error");
    upsert("teamMembers", { ...draft, name: draft.name.trim() });
    toast("Team member saved");
    setDraft(null);
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <PageHeader title="Team" subtitle="Sales members — they show up in every “Assigned to” dropdown.">
        {!draft && <Button variant="primary" icon="plus" onClick={() => setDraft(blank())}>Add member</Button>}
      </PageHeader>

      {draft && (
        <div className="card col gap-4" style={{ marginBottom: "var(--sp-5)" }}>
          <h3 className="section-title">{members.some((m) => m.id === draft.id) ? "Edit member" : "New member"}</h3>
          <div className="form-grid">
            <Field label="Name" required><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Khushnood" /></Field>
            <Field label="Role"><Select value={draft.role} onChange={(e) => set({ role: e.target.value })} options={ROLES} /></Field>
            <Field label="Phone"><Input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
            <Field label="Email"><Input value={draft.email} onChange={(e) => set({ email: e.target.value })} placeholder="sales@myholidaybro.com" /></Field>
          </div>
          <Toggle checked={draft.active !== false} onChange={(v) => set({ active: v })} label="Active — appears in assignment dropdowns" />
          <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" icon="check" onClick={save}>Save member</Button>
          </div>
        </div>
      )}

      {members.length === 0 && !draft ? (
        <EmptyState icon="users" title="No team members yet" message="Add your sales members so queries can be assigned to them."
          action={<Button variant="secondary" icon="plus" onClick={() => setDraft(blank())}>Add member</Button>} />
      ) : (
        <div className="col gap-2">
          {members.map((m) => (
            <div className="tm-row" key={m.id}>
              <span className="tm-avatar">{(m.name || "?")[0]}</span>
              <div className="grow">
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <b style={{ fontSize: 14 }}>{m.name}</b>
                  <Badge tone={m.active === false ? "neutral" : "success"} dot>{m.active === false ? "Inactive" : "Active"}</Badge>
                  <span className="tiny">{m.role || "Sales"}</span>
                </div>
                <div className="tiny" style={{ color: "var(--text-3)", marginTop: 2 }}>
                  {[m.phone, m.email].filter(Boolean).join(" · ") || "No contact info"}
                  {queriesPer[m.name] ? ` · ${queriesPer[m.name]} quer${queriesPer[m.name] === 1 ? "y" : "ies"} assigned` : ""}
                </div>
              </div>
              <IconButton name="edit" title="Edit" onClick={() => setDraft({ ...blank(), ...m })} />
              <IconButton name="trash" className="danger" title="Delete" onClick={() => setConfirm(m)} />
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmDialog title="Delete team member" message={`Remove “${confirm.name}”? Queries already assigned to them keep the name.`}
          onConfirm={() => remove("teamMembers", confirm.id)} onClose={() => setConfirm(null)} />
      )}

      <style>{`
        .tm-row { display:flex; align-items:center; gap:13px; border:1px solid var(--line); border-radius: var(--r-lg); padding: 13px 15px; background: var(--surface); }
        .tm-avatar { width:40px; height:40px; border-radius: 13px; background: var(--accent-soft); color: var(--accent-ink); font-weight: 700; font-size: 17px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
      `}</style>
    </div>
  );
}
