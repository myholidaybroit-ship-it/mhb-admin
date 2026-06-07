import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Select, SearchInput, Tabs,
  Stepper, ChipSelect, IconButton, ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import { PeoplePicker } from "../ui/editorBits.jsx";
import DataTable from "../ui/DataTable.jsx";

const groupForAge = (age) => (Number(age) < 18 ? "Child" : "Adult");

/* ---------------- Group editor ---------------- */
function GroupEditor({ value, onClose }) {
  const { upsert, data } = useStore();
  const toast = useToast();
  const [g, setG] = useState(() => value || { id: uid("g"), name: "", memberIds: [] });
  const set = (p) => setG((s) => ({ ...s, ...p }));
  const save = () => {
    if (!g.name.trim()) return toast("Group name is required", "error");
    upsert("travelerGroups", g);
    toast(value ? "Group saved" : "Group created");
    onClose();
  };
  return (
    <Drawer title={value ? g.name || "Edit group" : "New group"} subtitle={`${g.memberIds.length} member(s)`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save group</Button></>}>
      <div className="col gap-5">
        <Field label="Group name" required><Input value={g.name} onChange={(e) => set({ name: e.target.value })} placeholder="Verma Family" /></Field>
        <Field label="Members" hint="Pick people from your travellers list">
          <PeoplePicker value={g.memberIds} onChange={(memberIds) => set({ memberIds })} travelers={data.travelers || []} groups={[]} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Traveler editor (manual or from a signup) ---------------- */
function TravelerEditor({ value, onClose }) {
  const { upsert, data } = useStore();
  const toast = useToast();
  const [t, setT] = useState(() => value || { id: uid("t"), name: "", email: "", phone: "", age: 25, group: "Adult", source: "manual", userId: null });
  const set = (p) => setT((s) => ({ ...s, ...p }));
  const setAge = (age) => set({ age, group: groupForAge(age) });
  const pickUser = (userId) => {
    const u = data.users.find((x) => x.id === userId);
    if (!u) { set({ source: "manual", userId: null }); return; }
    set({ source: "user", userId: u.id, name: u.name, email: u.email });
  };
  const save = () => {
    if (!t.name.trim()) return toast("Name is required", "error");
    upsert("travelers", t);
    toast(value ? "Traveller saved" : "Traveller added");
    onClose();
  };
  return (
    <Drawer title={value ? t.name || "Edit traveller" : "New traveller"} subtitle={`${t.group} · age ${t.age}`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save traveller</Button></>}>
      <div className="col gap-5">
        <Field label="Source">
          <ChipSelect value={t.source} onChange={(v) => set({ source: v, userId: v === "manual" ? null : t.userId })}
            options={[{ value: "manual", label: "Manual entry" }, { value: "user", label: "From signup" }]} />
        </Field>
        {t.source === "user" && (
          <Field label="Pick a signed-up user" hint="Fills name & email from the user">
            <Select value={t.userId || ""} placeholder="Select a user…" onChange={(e) => pickUser(e.target.value)}
              options={data.users.map((u) => ({ value: u.id, label: `${u.name} · ${u.email}` }))} />
          </Field>
        )}
        <div className="form-grid">
          <Field label="Name" required><Input value={t.name} onChange={(e) => set({ name: e.target.value })} placeholder="Aisha Khan" /></Field>
          <Field label="Age"><Stepper value={t.age} min={0} max={110} onChange={setAge} /></Field>
          <Field label="Email"><Input value={t.email} onChange={(e) => set({ email: e.target.value })} placeholder="aisha@example.com" /></Field>
          <Field label="Phone"><Input value={t.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
          <Field label="Group" hint="Auto from age — override if needed">
            <ChipSelect value={t.group} onChange={(v) => set({ group: v })} options={["Adult", "Child"]} />
          </Field>
        </div>
      </div>
    </Drawer>
  );
}

export default function Travelers() {
  const { data, remove, upsert } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("people");
  const [edit, setEdit] = useState(null);
  const [creating, setCreating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [newGroup, setNewGroup] = useState(false);
  const [confirm, setConfirm] = useState(null);   // { kind: "traveler" | "group", item }
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");

  const travelers = data.travelers || [];
  const groups = data.travelerGroups || [];
  const rows = useMemo(() => travelers.filter((t) => {
    if (group !== "all" && t.group !== group) return false;
    if (q && !`${t.name} ${t.email} ${t.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [travelers, q, group]);

  const groupColumns = [
    { key: "name", header: "Group", render: (r) => <div style={{ fontWeight: 600 }}>{r.name}</div> },
    {
      key: "members", header: "Members",
      render: (r) => {
        const names = (r.memberIds || []).map((id) => travelers.find((t) => t.id === id)?.name).filter(Boolean);
        return <div><div className="tiny">{names.length} people</div><div className="tiny truncate" style={{ maxWidth: 320 }}>{names.join(", ") || "—"}</div></div>;
      },
    },
    {
      key: "actions", actions: true,
      render: (r) => (
        <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
          <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEditGroup(r); }} />
          <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm({ kind: "group", item: r }); }} />
        </div>
      ),
    },
  ];

  const columns = [
    { key: "name", header: "Traveller", render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{r.email || r.phone || "—"}</div></div>) },
    { key: "age", header: "Age", render: (r) => <span className="tiny">{r.age}</span> },
    { key: "group", header: "Group", render: (r) => <Badge tone={r.group === "Child" ? "warning" : "accent"}>{r.group}</Badge> },
    { key: "source", header: "Source", render: (r) => <Badge tone={r.source === "user" ? "info" : "neutral"}>{r.source === "user" ? "From signup" : "Manual"}</Badge> },
    {
      key: "actions", actions: true,
      render: (r) => (
        <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
          <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEdit(r); }} />
          <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm({ kind: "traveler", item: r }); }} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="People" subtitle={`${travelers.length} travellers · ${groups.length} group${groups.length === 1 ? "" : "s"}`}>
        {tab === "people" ? (
          <>
            <Button variant="ghost" icon="users" onClick={() => setImportOpen(true)}>Import from signups</Button>
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>Add traveller</Button>
          </>
        ) : (
          <Button variant="primary" icon="plus" onClick={() => setNewGroup(true)}>New group</Button>
        )}
      </PageHeader>

      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "people", label: `Travellers (${travelers.length})` },
        { value: "groups", label: `Groups (${groups.length})` },
      ]} />

      {tab === "people" ? (
        <>
          <div className="row-between wrap gap-3" style={{ margin: "var(--sp-4) 0" }}>
            <SearchInput value={q} onChange={setQ} placeholder="Search travellers…" />
            <div className="pill-tabs">
              {["all", "Adult", "Child"].map((g) => (
                <button key={g} className={`pill-tab ${group === g ? "active" : ""}`} onClick={() => setGroup(g)}>{g === "all" ? "All" : g + "s"}</button>
              ))}
            </div>
          </div>
          {rows.length === 0 ? (
            <EmptyState icon="users" title="No travellers yet" message="Add a traveller manually or import from your signed-up users."
              action={<Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>Add traveller</Button>} />
          ) : (
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setEdit(r)} />
          )}
        </>
      ) : (
        <div style={{ marginTop: "var(--sp-4)" }}>
          {groups.length === 0 ? (
            <EmptyState icon="users" title="No groups yet" message="Group travellers together (e.g. a family) so you can assign them all at once."
              action={<Button variant="secondary" icon="plus" onClick={() => setNewGroup(true)}>New group</Button>} />
          ) : (
            <DataTable columns={groupColumns} rows={groups} rowKey={(r) => r.id} onRowClick={(r) => setEditGroup(r)} />
          )}
        </div>
      )}

      {(creating || edit) && <TravelerEditor value={edit} onClose={() => { setCreating(false); setEdit(null); }} />}
      {(newGroup || editGroup) && <GroupEditor value={editGroup} onClose={() => { setNewGroup(false); setEditGroup(null); }} />}
      {importOpen && <ImportDrawer onClose={() => setImportOpen(false)} onImport={(picked) => {
        let n = 0;
        picked.forEach((u) => {
          if (travelers.some((t) => t.userId === u.id)) return;
          upsert("travelers", { id: uid("t"), name: u.name, email: u.email, phone: "", age: 25, group: "Adult", source: "user", userId: u.id });
          n++;
        });
        toast(n ? `Imported ${n} traveller${n === 1 ? "" : "s"}` : "Already imported");
        setImportOpen(false);
      }} />}
      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "group" ? "Delete group" : "Delete traveller"}
          message={confirm.kind === "group" ? `Delete the group “${confirm.item.name}”? (Travellers stay in the list.)` : `Remove “${confirm.item.name}” from the list?`}
          onConfirm={() => remove(confirm.kind === "group" ? "travelerGroups" : "travelers", confirm.item.id)}
          onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}

/* ---------------- Import multiple signups as travellers ---------------- */
function ImportDrawer({ onClose, onImport }) {
  const { data } = useStore();
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState("");
  const travelers = data.travelers || [];
  const toggle = (u) => setPicked((p) => (p.some((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : [...p, u]));
  const users = (data.users || []).filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Drawer title="Import from signups" subtitle={`${picked.length} selected`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" disabled={!picked.length} onClick={() => onImport(picked)}>Import {picked.length || ""}</Button></>}>
      <div className="col gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search users by name or email…" />
        <div className="col gap-2">
          {users.length === 0 ? (
            <div className="card-soft tiny" style={{ color: "var(--text-3)" }}>No users match “{q}”.</div>
          ) : users.map((u) => {
            const already = travelers.some((t) => t.userId === u.id);
            const on = picked.some((x) => x.id === u.id);
            return (
              <button key={u.id} type="button" className={`related-card ${on ? "on" : ""} ${already ? "disabled" : ""}`} disabled={already} onClick={() => toggle(u)} style={{ width: "100%" }}>
                <div className="col gap-1" style={{ minWidth: 0 }}>
                  <strong className="truncate">{u.name}</strong>
                  <span className="tiny">{u.email}{already ? " · already added" : ""}</span>
                </div>
                {on && <span className="related-check"><IconButton name="check" size="sm" /></span>}
              </button>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}
