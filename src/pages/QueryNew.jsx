// New trip query — full page, four steps:
//   1 source (team-member dropdown + auto reference id)
//   2 destination (searchable) & duration (nights ⇄ days synced) & calendar
//   3 travellers — pick from registered site users OR enter manually
//   4 requirements

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore, uid } from "../lib/store.jsx";
import { admin } from "../lib/api.js";
import {
  PageHeader, Field, Input, Textarea, Select, Button, IconButton, Stepper,
  SearchSelect, DatePicker, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import { SOURCES, genRefId, logActivity } from "../lib/crm.js";

const STEPS = [
  { n: 1, title: "Query source", icon: "compass" },
  { n: 2, title: "Destination & duration", icon: "map" },
  { n: 3, title: "Travellers", icon: "users" },
  { n: 4, title: "Requirements", icon: "doc" },
];

export default function QueryNew() {
  const { data, upsert } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState(() => ({
    id: uid("tq"),
    source: "Website", refId: genRefId(), assignedTo: "",
    destination: "", startDate: "", nights: 4, adults: 2, children: 0, childAges: "",
    guest: { name: "", phone: "", email: "", city: "" },
    budget: "", comments: "",
    status: "New", tags: [], quotes: [], followUps: [], payments: [],
  }));
  const [guestMode, setGuestMode] = useState("users"); // "users" | "manual"
  const [users, setUsers] = useState(null); // null = loading
  const set = (p) => setQ((s) => ({ ...s, ...p }));
  const setGuest = (p) => setQ((s) => ({ ...s, guest: { ...s.guest, ...p } }));

  // Registered site users — for the "pick from user list" mode.
  useEffect(() => {
    let alive = true;
    admin.users()
      .then((r) => { if (alive) setUsers(r?.data || []); })
      .catch(() => { if (alive) setUsers([]); });
    return () => { alive = false; };
  }, []);

  const destOptions = useMemo(() => {
    const names = [...(data.destinations || []).map((d) => d.name), ...(data.weekends || []).map((w) => w.name)];
    return [...new Set(names)].filter(Boolean);
  }, [data]);

  const team = useMemo(
    () => (data.teamMembers || []).filter((m) => m.active !== false).map((m) => m.name).filter(Boolean),
    [data.teamMembers]
  );

  const userOptions = useMemo(
    () => (users || []).map((u) => ({
      value: u._id || u.id,
      label: u.name || u.email,
      hint: u.phone || u.email || "",
    })),
    [users]
  );

  const pickUser = (id) => {
    const u = (users || []).find((x) => (x._id || x.id) === id);
    if (!u) return;
    setGuest({ name: u.name || "", phone: u.phone || "", email: u.email || "", city: u.city || "" });
  };

  const save = () => {
    if (!q.guest.name.trim()) return toast("Traveller name is required", "error");
    if (!q.destination.trim()) return toast("Destination is required", "error");
    const item = { ...q, createdAt: new Date().toISOString(), activity: logActivity(q, `Query created (${q.source})`) };
    upsert("tripQueries", item);
    toast("Query added to the pipeline 🎉");
    navigate(`/queries/${item.id}`);
  };

  const Step = ({ n }) => (
    <div className="qn-step">
      <span className="qn-step-n">{STEPS[n - 1].n}</span>
      <Icon name={STEPS[n - 1].icon} size={15} />
      <h3 className="section-title">{STEPS[n - 1].title}</h3>
    </div>
  );

  return (
    <div className="qn">
      <Link to="/queries" className="qd-back"><Icon name="chevronLeft" size={15} /> Back to queries</Link>
      <PageHeader title="New trip query" subtitle="Capture the enquiry — you can quote it right after." />

      <div className="qn-cards">
        {/* 1 · source */}
        <div className="card col gap-4">
          <Step n={1} />
          <div className="form-grid">
            <Field label="Source"><Select value={q.source} onChange={(e) => set({ source: e.target.value })} options={SOURCES} /></Field>
            <Field label="Reference ID" hint="Auto-generated — tap ↻ for a new one, or type your own">
              <div className="row gap-2">
                <Input value={q.refId} onChange={(e) => set({ refId: e.target.value })} />
                <IconButton name="copy" title="New random id" onClick={() => set({ refId: genRefId() })} />
              </div>
            </Field>
          </div>
          <Field label="Assigned to"
            hint={team.length ? "Pick a sales member" : <span>No team yet — <Link to="/team" style={{ fontWeight: 600 }}>add members</Link> to assign queries</span>}>
            <SearchSelect value={q.assignedTo} onChange={(v) => set({ assignedTo: v })} options={team} placeholder="Search team…" allowCustom />
          </Field>
        </div>

        {/* 2 · destination & duration */}
        <div className="card col gap-4">
          <Step n={2} />
          <div className="form-grid">
            <Field label="Destination" required>
              <SearchSelect value={q.destination} onChange={(v) => set({ destination: v })} options={destOptions} placeholder="Search destinations…" allowCustom />
            </Field>
            <Field label="Tour start date">
              <DatePicker value={q.startDate} onChange={(v) => set({ startDate: v })} placeholder="Pick a date" />
            </Field>
            <Field label="Planned month" hint="If exact dates aren't fixed yet">
              <Input type="month" value={q.travelMonth || ""} onChange={(e) => set({ travelMonth: e.target.value })} />
            </Field>
            <Field label="Nights"><Stepper value={q.nights} onChange={(v) => set({ nights: v })} min={1} max={60} /></Field>
            <Field label="Days" hint="Stays in sync with nights"><Stepper value={(Number(q.nights) || 0) + 1} onChange={(v) => set({ nights: Math.max(1, v - 1) })} min={2} max={61} /></Field>
            <Field label="Adults"><Stepper value={q.adults} onChange={(v) => set({ adults: v })} min={1} max={40} /></Field>
            <Field label="Children"><Stepper value={q.children} onChange={(v) => set({ children: v })} min={0} max={20} /></Field>
            {q.children > 0 && (
              <Field label="Child ages" hint="Comma separated"><Input value={q.childAges} onChange={(e) => set({ childAges: e.target.value })} placeholder="7, 9" /></Field>
            )}
          </div>
        </div>

        {/* 3 · travellers */}
        <div className="card col gap-4">
          <div className="row-between">
            <Step n={3} />
            <div className="qn-toggle">
              <button type="button" className={guestMode === "users" ? "on" : ""} onClick={() => setGuestMode("users")}>From user list</button>
              <button type="button" className={guestMode === "manual" ? "on" : ""} onClick={() => setGuestMode("manual")}>Enter manually</button>
            </div>
          </div>

          {guestMode === "users" && (
            <Field label="Registered users" hint={users === null ? "Loading users…" : `${userOptions.length} site account(s) — picking one fills the fields below`}>
              <SearchSelect value="" onChange={pickUser} options={userOptions} placeholder="Search by name, phone or email…" />
            </Field>
          )}

          <div className="form-grid">
            <Field label="Traveller name" required><Input value={q.guest.name} onChange={(e) => setGuest({ name: e.target.value })} placeholder="Aisha Khan" /></Field>
            <Field label="Phone"><Input value={q.guest.phone} onChange={(e) => setGuest({ phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
            <Field label="Email"><Input value={q.guest.email} onChange={(e) => setGuest({ email: e.target.value })} placeholder="aisha@example.com" /></Field>
            <Field label="Origin city"><Input value={q.guest.city} onChange={(e) => setGuest({ city: e.target.value })} placeholder="Mumbai" /></Field>
          </div>
        </div>

        {/* 4 · requirements */}
        <div className="card col gap-4">
          <Step n={4} />
          <div className="form-grid">
            <Field label="Budget (approx)"><Input value={q.budget} onChange={(e) => set({ budget: e.target.value })} placeholder="₹80,000 total" /></Field>
          </div>
          <Field label="Comments" hint="Hotel category, must-do activities, special occasions…">
            <Textarea rows={3} value={q.comments} onChange={(e) => set({ comments: e.target.value })} placeholder="Honeymoon — wants a private pool villa and a candle-light dinner." />
          </Field>
        </div>
      </div>

      <div className="row gap-2 mt-5" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={() => navigate("/queries")}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>Add query</Button>
      </div>

      <style>{`
        .qn-cards { display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-5); }
        @media (max-width: 980px){ .qn-cards{ grid-template-columns: 1fr; } }
        .qn-step { display:flex; align-items:center; gap:9px; }
        .qn-step-n { width:24px; height:24px; border-radius:50%; background: var(--ink); color: var(--accent); font-size:12px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; }
        .qd-back { display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600; color:var(--text-2); margin-bottom: 10px; }
        .qd-back:hover { color: var(--ink); }
        .qn-toggle { display:inline-flex; background: var(--panel-soft); border:1px solid var(--line); border-radius:999px; padding:3px; }
        .qn-toggle button { border:none; background:transparent; padding:6px 14px; border-radius:999px; font-size:12px; font-weight:600; color:var(--text-2); cursor:pointer; }
        .qn-toggle button.on { background: var(--ink); color: var(--accent); }
      `}</style>
    </div>
  );
}
