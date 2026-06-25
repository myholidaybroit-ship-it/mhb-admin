// A single website enquiry — read everything the traveller submitted, set a
// status (New → In Progress → Done), and keep a private note. No CRM machinery.

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Button, Badge, Textarea, ConfirmDialog, EmptyState, useToast } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

const STATUSES = ["New", "In Progress", "Done"];
const STATUS_TONE = { New: "warning", "In Progress": "neutral", Done: "success" };
const normStatus = (s) => (STATUSES.includes(s) ? s : "New");
const FORM_LABEL = { quote: "Quote form", weekend: "Weekend form", contact: "Contact form" };
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default function QueryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, patchItem, remove } = useStore();
  const query = (data.tripQueries || []).find((q) => q.id === id || q._id === id);

  const [notes, setNotes] = useState(query?.notes || "");
  const [confirmDel, setConfirmDel] = useState(false);

  if (!query) {
    return (
      <div>
        <PageHeader title="Query" />
        <EmptyState icon="inbox" title="Query not found" message="It may have been deleted."
          action={<Link to="/queries"><Button variant="secondary">Back to queries</Button></Link>} />
      </div>
    );
  }

  const status = normStatus(query.status);
  const setStatus = (s) => { patchItem("tripQueries", query.id, { status: s }); toast(`Marked ${s}`); };
  const saveNotes = () => { patchItem("tripQueries", query.id, { notes }); toast("Notes saved"); };

  const g = query.guest || {};
  const wa = (g.phone || "").replace(/[^\d]/g, "");

  const facts = [
    ["Destination", query.destination],
    ["Travel month", query.travelMonth],
    ["Travellers", [query.adults && `${query.adults} adults`, query.children && `${query.children} children`].filter(Boolean).join(", ")],
    ["Budget", query.budget],
    ["City", g.city],
    ["Form", FORM_LABEL[query.formType] || query.source || "Website"],
    ["Received", fmtDateTime(query.createdAt)],
  ].filter(([, v]) => v);

  return (
    <div>
      <PageHeader title={g.name || "Website enquiry"} subtitle={query.destination || "Enquiry"}>
        <Link to="/queries"><Button variant="ghost" icon="chevronLeft">All queries</Button></Link>
        <Button variant="ghost" className="danger" icon="trash" onClick={() => setConfirmDel(true)}>Delete</Button>
      </PageHeader>

      <div className="qd-grid">
        <div className="col gap-4">
          <div className="qd-card">
            <div className="qd-card-title">Contact</div>
            <div className="qd-facts">
              {g.phone && <a className="qd-contact" href={`tel:${g.phone}`}><Icon name="phone" size={15} /> {g.phone}</a>}
              {g.email && <a className="qd-contact" href={`mailto:${g.email}`}><Icon name="mail" size={15} /> {g.email}</a>}
              {wa && <a className="qd-contact" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><Icon name="external" size={15} /> WhatsApp</a>}
              {!g.phone && !g.email && <span className="tiny">No contact details provided.</span>}
            </div>
          </div>

          <div className="qd-card">
            <div className="qd-card-title">Trip details</div>
            <table className="qd-table"><tbody>
              {facts.map(([k, v]) => (<tr key={k}><td>{k}</td><td>{v}</td></tr>))}
            </tbody></table>
          </div>

          {query.comments && (
            <div className="qd-card">
              <div className="qd-card-title">Message</div>
              <p style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{query.comments}</p>
            </div>
          )}
        </div>

        <div className="col gap-4">
          <div className="qd-card">
            <div className="qd-card-title">Status</div>
            <div style={{ marginBottom: 12 }}><Badge tone={STATUS_TONE[status]} dot>{status}</Badge></div>
            <div className="qd-status-btns">
              {STATUSES.map((s) => (
                <button key={s} type="button" className={`qd-status ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="qd-card">
            <div className="qd-card-title">Internal notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Private note about this enquiry…" />
            <div className="mt-3"><Button variant="secondary" icon="check" onClick={saveNotes}>Save notes</Button></div>
          </div>
        </div>
      </div>

      {confirmDel && (
        <ConfirmDialog title="Delete query" message={`Delete the query from “${g.name || "this traveller"}”? This cannot be undone.`}
          onConfirm={() => { remove("tripQueries", query.id); toast("Query deleted"); navigate("/queries"); }}
          onClose={() => setConfirmDel(false)} />
      )}

      <style>{`
        .qd-grid { display:grid; grid-template-columns: 1fr 320px; gap: var(--sp-4); align-items:start; }
        @media (max-width: 900px){ .qd-grid { grid-template-columns: 1fr; } }
        .qd-card { background:#fff; border:1px solid var(--line, #ebe7d8); border-radius:14px; padding:18px; }
        .qd-card-title { font-weight:700; margin-bottom:12px; }
        .qd-facts { display:flex; flex-direction:column; gap:10px; }
        .qd-contact { display:inline-flex; align-items:center; gap:8px; font-weight:600; color: var(--ink, #111); }
        .qd-table { width:100%; border-collapse:collapse; }
        .qd-table td { padding:7px 0; font-size:14px; vertical-align:top; }
        .qd-table td:first-child { color: var(--text-3, #888); width:130px; }
        .qd-table td:last-child { font-weight:600; }
        .qd-status-btns { display:flex; gap:8px; }
        .qd-status { flex:1; padding:9px 8px; border-radius:10px; border:1px solid var(--line,#ebe7d8); background:#fff; font-weight:600; cursor:pointer; font-size:13px; }
        .qd-status.on { background: var(--accent, #ffde5f); border-color: var(--accent,#ffde5f); }
      `}</style>
    </div>
  );
}
