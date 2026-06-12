// New trip query — a full page (no modal) with the four intake steps laid out
// as cards: source → destination & duration → guest → requirements.

import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Field, Input, Textarea, Select, Button, Stepper, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import { SOURCES, logActivity } from "../lib/crm.js";

const STEPS = [
  { n: 1, title: "Query source", icon: "compass" },
  { n: 2, title: "Destination & duration", icon: "map" },
  { n: 3, title: "Guest details", icon: "user" },
  { n: 4, title: "Requirements", icon: "doc" },
];

export default function QueryNew() {
  const { data, upsert } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState({
    id: uid("tq"),
    source: "Website", refId: "", assignedTo: "",
    destination: "", startDate: "", nights: 4, adults: 2, children: 0, childAges: "",
    guest: { name: "", phone: "", email: "", city: "" },
    budget: "", comments: "",
    status: "New", tags: [], quotes: [], followUps: [], payments: [],
  });
  const set = (p) => setQ((s) => ({ ...s, ...p }));
  const setGuest = (p) => setQ((s) => ({ ...s, guest: { ...s.guest, ...p } }));

  const destOptions = useMemo(() => {
    const names = [...(data.destinations || []).map((d) => d.name), ...(data.weekends || []).map((w) => w.name)];
    return [...new Set(names)];
  }, [data]);
  const assignees = useMemo(
    () => [...new Set((data.tripQueries || []).map((x) => x.assignedTo).filter(Boolean))],
    [data]
  );

  const save = () => {
    if (!q.guest.name.trim()) return toast("Guest name is required", "error");
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
        <div className="card col gap-4">
          <Step n={1} />
          <div className="form-grid">
            <Field label="Source"><Select value={q.source} onChange={(e) => set({ source: e.target.value })} options={SOURCES} /></Field>
            <Field label="Reference ID" hint="Ad lead id / B2B partner ref (optional)"><Input value={q.refId} onChange={(e) => set({ refId: e.target.value })} placeholder="TT-48211" /></Field>
            <Field label="Assigned to">
              <Input list="crm-assignees" value={q.assignedTo} onChange={(e) => set({ assignedTo: e.target.value })} placeholder="Sales member" />
              <datalist id="crm-assignees">{assignees.map((a) => <option key={a} value={a} />)}</datalist>
            </Field>
          </div>
        </div>

        <div className="card col gap-4">
          <Step n={2} />
          <div className="form-grid">
            <Field label="Destination" required>
              <Input list="crm-destinations" value={q.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="Bali" />
              <datalist id="crm-destinations">{destOptions.map((d) => <option key={d} value={d} />)}</datalist>
            </Field>
            <Field label="Tour start date"><Input type="date" value={q.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
            <Field label="Nights"><Stepper value={q.nights} onChange={(v) => set({ nights: v })} min={1} max={60} /></Field>
            <Field label="Adults"><Stepper value={q.adults} onChange={(v) => set({ adults: v })} min={1} max={40} /></Field>
            <Field label="Children"><Stepper value={q.children} onChange={(v) => set({ children: v })} min={0} max={20} /></Field>
            {q.children > 0 && (
              <Field label="Child ages" hint="Comma separated"><Input value={q.childAges} onChange={(e) => set({ childAges: e.target.value })} placeholder="7, 9" /></Field>
            )}
          </div>
        </div>

        <div className="card col gap-4">
          <Step n={3} />
          <div className="form-grid">
            <Field label="Guest name" required><Input value={q.guest.name} onChange={(e) => setGuest({ name: e.target.value })} placeholder="Aisha Khan" /></Field>
            <Field label="Phone"><Input value={q.guest.phone} onChange={(e) => setGuest({ phone: e.target.value })} placeholder="+91 98765 43210" /></Field>
            <Field label="Email"><Input value={q.guest.email} onChange={(e) => setGuest({ email: e.target.value })} placeholder="aisha@example.com" /></Field>
            <Field label="Origin city"><Input value={q.guest.city} onChange={(e) => setGuest({ city: e.target.value })} placeholder="Mumbai" /></Field>
          </div>
        </div>

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
      `}</style>
    </div>
  );
}
