import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Button, Badge, Modal, Drawer, Field, Input, SearchInput,
  IconButton, ConfirmDialog, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import DataTable from "../ui/DataTable.jsx";

const roleTone = { Customer: "neutral" };
const statusTone = { New: "info", "In progress": "warning", Closed: "success" };
const TYPE_LABEL = { quote: "Quote request", weekend: "Weekend trip", contact: "Contact form" };
const fmt = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const enqSummary = (e) => {
  const t = e.type || "contact";
  if (t === "quote") return [e.destination, e.package].filter(Boolean).join(" · ");
  if (t === "weekend") return [e.trip, e.channel].filter(Boolean).join(" · ");
  return [e.category, e.destination].filter(Boolean).join(" · ") || e.message || "";
};

/* ---------------- Create / edit user ---------------- */
function UserModal({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [u, setU] = useState(() => value || { id: uid("u"), name: "", email: "", phone: "", role: "Customer", createdAt: new Date().toISOString().slice(0, 10) });
  const set = (patch) => setU((s) => ({ ...s, ...patch }));
  const save = () => {
    if (!u.name.trim() || !u.email.trim()) return toast("Name and email are required", "error");
    upsert("users", u);
    toast(value ? "User saved" : "User created");
    onClose();
  };
  return (
    <Modal title={value ? "Edit user" : "New user"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save</Button></>}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Name" required><Input value={u.name} onChange={(e) => set({ name: e.target.value })} placeholder="Aisha Khan" /></Field>
          <Field label="Email" required><Input type="email" value={u.email} onChange={(e) => set({ email: e.target.value })} placeholder="aisha@example.com" /></Field>
          <Field label="Phone"><Input value={u.phone || ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
          <Field label="Joined"><Input type="date" value={u.createdAt} onChange={(e) => set({ createdAt: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="umetric">
      <span className="umetric-ico"><Icon name={icon} size={16} /></span>
      <div><div className="umetric-num">{value}</div><div className="tiny">{label}</div></div>
    </div>
  );
}

/* ---------------- Full user detail (drawer) ---------------- */
function UserDetail({ user, onClose, onEdit }) {
  const { data, upsert } = useStore();
  const toast = useToast();
  const email = (user.email || "").toLowerCase();
  const enquiries = (data.enquiries || []).filter((e) => (e.email || "").toLowerCase() === email);
  const traveler = (data.travelers || []).find((t) => t.userId === user.id || (t.email && t.email.toLowerCase() === email));
  const assignments = traveler ? (data.assignments || []).filter((a) => (a.travelerIds || []).includes(traveler.id)) : [];
  const spend = assignments.reduce((n, a) => n + (a.total || 0), 0);

  const addAsTraveller = () => {
    upsert("travelers", { id: uid("t"), name: user.name, email: user.email, phone: user.phone || "", age: 25, group: "Adult", source: "user", userId: user.id });
    toast(`${user.name} added as a traveller`);
  };

  return (
    <Drawer wide title={user.name} subtitle={user.email} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button variant="secondary" icon="edit" onClick={() => { onEdit(user); onClose(); }}>Edit user</Button></>}>
      <div className="col gap-5">
        <div className="card-soft row gap-4" style={{ alignItems: "center" }}>
          <span className="avatar-lg">{(user.name || "?").charAt(0)}</span>
          <div className="col gap-1" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name}</div>
            <div className="row gap-3 wrap" style={{ alignItems: "center" }}>
              <a className="tiny" href={`mailto:${user.email}`}>{user.email}</a>
              {user.phone ? <span className="tiny">{user.phone}</span> : null}
              <Badge tone={roleTone[user.role]}>{user.role}</Badge>
              <span className="tiny">Joined {user.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="umetrics">
          <Metric icon="inbox" label="Enquiries" value={enquiries.length} />
          <Metric icon="briefcase" label="Assignments" value={assignments.length} />
          <Metric icon="user" label="Traveller" value={traveler ? "Yes" : "No"} />
          <Metric icon="tag" label="Total value" value={fmt(spend)} />
        </div>

        {/* Enquiries */}
        <div className="col gap-2">
          <div className="field-label">Enquiries ({enquiries.length})</div>
          {enquiries.length === 0 ? <div className="card-soft tiny">No enquiries from this email.</div> : enquiries.map((e) => (
            <div className="card-soft row-between" key={e.id} style={{ alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{TYPE_LABEL[e.type || "contact"]}</div>
                <div className="tiny truncate" style={{ maxWidth: 360 }}>{enqSummary(e)}</div>
              </div>
              <div className="row gap-2" style={{ alignItems: "center" }}><span className="tiny">{e.createdAt}</span><Badge tone={statusTone[e.status]} dot>{e.status}</Badge></div>
            </div>
          ))}
        </div>

        {/* Traveller record */}
        <div className="col gap-2">
          <div className="row-between" style={{ alignItems: "center" }}>
            <div className="field-label">Traveller record</div>
            {!traveler && <Button variant="ghost" size="sm" icon="plus" onClick={addAsTraveller}>Add as traveller</Button>}
          </div>
          {traveler ? (
            <div className="card-soft row gap-5 wrap">
              <div><div className="tiny">Age</div><strong>{traveler.age}</strong></div>
              <div><div className="tiny">Group</div><Badge tone={traveler.group === "Child" ? "warning" : "accent"}>{traveler.group}</Badge></div>
              <div><div className="tiny">Phone</div><div style={{ fontWeight: 500 }}>{traveler.phone || "—"}</div></div>
              <div><div className="tiny">Source</div><Badge tone="info">From signup</Badge></div>
            </div>
          ) : <div className="card-soft tiny">Not added as a traveller yet.</div>}
        </div>

        {/* Assignments */}
        <div className="col gap-2">
          <div className="field-label">Package assignments ({assignments.length})</div>
          {assignments.length === 0 ? <div className="card-soft tiny">Not part of any package assignment.</div> : assignments.map((a) => (
            <div className="card-soft row-between" key={a.id} style={{ alignItems: "center" }}>
              <div style={{ fontWeight: 600 }}>{a.pkgName || "—"}</div>
              <div className="row gap-2" style={{ alignItems: "center" }}><strong>{fmt(a.total)}</strong><Badge tone="neutral">{a.status}</Badge></div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .avatar-lg { width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--accent-soft); color:var(--accent-ink); font-weight:700; font-size:20px; flex:none; }
        .umetrics { display:grid; grid-template-columns:repeat(4,1fr); gap:var(--sp-3); }
        .umetric { display:flex; gap:10px; align-items:center; padding:var(--sp-3); border:1px solid var(--line); border-radius:var(--r-md); background:var(--panel); }
        .umetric-ico { width:34px; height:34px; flex:none; display:flex; align-items:center; justify-content:center; border-radius:var(--r-sm); background:var(--accent-soft); color:var(--accent-ink); }
        .umetric-num { font-size:18px; font-weight:700; line-height:1.1; }
        @media (max-width:680px){ .umetrics { grid-template-columns:repeat(2,1fr); } }
      `}</style>
    </Drawer>
  );
}

export default function Users() {
  const { data, remove } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");

  const users = data.users || [];
  const stats = useMemo(() => {
    const travelerEmails = new Set((data.travelers || []).map((t) => (t.email || "").toLowerCase()).filter(Boolean));
    const travelerUserIds = new Set((data.travelers || []).map((t) => t.userId).filter(Boolean));
    const enquiryEmails = new Set((data.enquiries || []).map((e) => (e.email || "").toLowerCase()));
    return {
      total: users.length,
      customers: users.filter((u) => u.role === "Customer").length,
      travellers: users.filter((u) => travelerUserIds.has(u.id) || travelerEmails.has((u.email || "").toLowerCase())).length,
      withEnquiries: users.filter((u) => enquiryEmails.has((u.email || "").toLowerCase())).length,
    };
  }, [users, data.travelers, data.enquiries]);

  const rows = useMemo(() => users.filter((u) => {
    if (q && !`${u.name} ${u.email} ${u.phone || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [users, q]);

  const columns = [
    { key: "name", header: "User", render: (r) => (
      <div className="row gap-3">
        <span className="avatar" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>{(r.name || "?").charAt(0)}</span>
        <div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="tiny">{r.email}</div></div>
      </div>
    ) },
    { key: "phone", header: "Phone", render: (r) => <span className="tiny">{r.phone || "—"}</span> },
    { key: "role", header: "Role", render: (r) => <Badge tone={roleTone[r.role] || "neutral"}>{r.role}</Badge> },
    { key: "createdAt", header: "Joined", render: (r) => <span className="tiny">{r.createdAt}</span> },
    { key: "actions", actions: true, render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="eye" size="sm" title="View" onClick={(e) => { e.stopPropagation(); setViewing(r); }} />
        <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEditing(r); }} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(r); }} />
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered users`}>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New user</Button>
      </PageHeader>

      <div className="list-stats">
        <div className="list-stat"><span className="list-stat-ico"><Icon name="users" size={18} /></span><div><div className="list-stat-num">{stats.total}</div><div className="list-stat-label">Total users</div></div></div>
        <div className="list-stat"><span className="list-stat-ico"><Icon name="user" size={18} /></span><div><div className="list-stat-num">{stats.customers}</div><div className="list-stat-label">Customers</div></div></div>
        <div className="list-stat"><span className="list-stat-ico"><Icon name="map" size={18} /></span><div><div className="list-stat-num">{stats.travellers}</div><div className="list-stat-label">Also travellers</div></div></div>
        <div className="list-stat"><span className="list-stat-ico"><Icon name="inbox" size={18} /></span><div><div className="list-stat-num">{stats.withEnquiries}</div><div className="list-stat-label">With enquiries</div></div></div>
      </div>

      <div style={{ marginBottom: "var(--sp-4)" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search users…" />
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setViewing(r)} />

      {viewing && <UserDetail user={viewing} onClose={() => setViewing(null)} onEdit={(u) => setEditing(u)} />}
      {creating && <UserModal onClose={() => setCreating(false)} />}
      {editing && <UserModal value={editing} onClose={() => setEditing(null)} />}
      {confirm && (
        <ConfirmDialog title="Delete user" message={`Delete ${confirm.name}? This cannot be undone.`}
          onConfirm={() => remove("users", confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
