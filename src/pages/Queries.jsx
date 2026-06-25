// Query inbox — every enquiry submitted from the website (quote, weekend and
// contact forms) lands here. A simple list with status filters and search;
// click a row to read the full enquiry and set its status.

import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Tabs, IconButton, Badge, SearchInput, EmptyState, ConfirmDialog, useToast } from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";

const STATUSES = ["New", "In Progress", "Done"];
const STATUS_TONE = { New: "warning", "In Progress": "neutral", Done: "success" };
const normStatus = (q) => (STATUSES.includes(q.status) ? q.status : "New");

const FORM_LABEL = { quote: "Quote", weekend: "Weekend", contact: "Contact" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const paxLabel = (q) => {
  const a = Number(q.adults) || 0;
  const c = Number(q.children) || 0;
  if (!a && !c) return "—";
  return `${a} adult${a !== 1 ? "s" : ""}${c ? `, ${c} child${c !== 1 ? "ren" : ""}` : ""}`;
};

export default function Queries() {
  const { data, remove } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const queries = data.tripQueries || [];

  // Old deep links (?id=…) still open the query page.
  useEffect(() => {
    const id = params.get("id");
    if (id) navigate(`/queries/${id}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const m = { All: queries.length, New: 0, "In Progress": 0, Done: 0 };
    queries.forEach((q) => { m[normStatus(q)] += 1; });
    return m;
  }, [queries]);

  const rows = useMemo(() => {
    const ql = search.toLowerCase();
    return queries
      .filter((q) => tab === "All" || normStatus(q) === tab)
      .filter((q) => !ql || [q.guest?.name, q.guest?.phone, q.guest?.email, q.destination, q.id]
        .some((v) => String(v || "").toLowerCase().includes(ql)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [queries, tab, search]);

  const columns = [
    {
      key: "guest", header: "Traveller", render: (q) => (
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <span className="ql-avatar">{(q.guest?.name || "?")[0]}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{q.guest?.name || "—"}</div>
            <div className="tiny">{q.guest?.phone || q.guest?.email || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "trip", header: "Trip", render: (q) => (
        <div>
          <div style={{ fontWeight: 600 }}>{q.destination || "—"}</div>
          <div className="tiny">{q.travelMonth ? `Planning ${q.travelMonth}` : "Dates open"} · {paxLabel(q)}</div>
        </div>
      ),
    },
    { key: "form", header: "Form", render: (q) => <Badge tone="neutral">{FORM_LABEL[q.formType] || "Website"}</Badge> },
    { key: "received", header: "Received", render: (q) => <span className="tiny">{fmtDate(q.createdAt)}</span> },
    { key: "status", header: "Status", render: (q) => <Badge tone={STATUS_TONE[normStatus(q)]} dot>{normStatus(q)}</Badge> },
    {
      key: "actions", header: "", actions: true, width: 50, render: (q) => (
        <IconButton name="trash" size="sm" className="danger" title="Delete query" onClick={() => setConfirmDel(q)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Queries" subtitle="Every enquiry from the website — quote, weekend and contact forms." />

      <Tabs active={tab} onChange={setTab}
        tabs={["All", ...STATUSES].map((s) => ({ value: s, label: `${s} (${counts[s] || 0})` }))} />

      <div className="row gap-3 mt-4" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search traveller, phone, destination…" />
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(q) => navigate(`/queries/${q.id}`)}
          empty={<EmptyState icon="inbox" title={`No ${tab === "All" ? "" : tab + " "}queries`}
            message="Enquiries submitted on the website show up here automatically." />}
        />
      </div>

      {confirmDel && (
        <ConfirmDialog title="Delete query"
          message={`Delete the query from “${confirmDel.guest?.name || "this traveller"}”? This cannot be undone.`}
          onConfirm={() => { remove("tripQueries", confirmDel.id); toast("Query deleted"); setConfirmDel(null); }}
          onClose={() => setConfirmDel(null)} />
      )}

      <style>{`
        .ql-avatar { width:34px; height:34px; border-radius:50%; background: var(--accent-soft); color: var(--accent-ink); font-weight:700; font-size:14px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
      `}</style>
    </div>
  );
}
