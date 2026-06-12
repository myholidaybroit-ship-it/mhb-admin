// Sales CRM — queries pipeline list. Clean and scannable: stage pills,
// search, lean table. Click a row → the full query detail PAGE (/queries/:id).
// Creating a query is its own page too (/queries/new) — no modals.

import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Tabs, Select, Button, IconButton, Badge, SearchInput, EmptyState, ConfirmDialog, useToast } from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import Icon from "../ui/icons.jsx";
import {
  STAGES, effectiveStage, stageTone, headlineQuote, quoteTotals, nextFollowUp,
  followUpState, paymentSummary, money, paxLabel, fmtDate, fmtDateTime, fmtTravelMonth,
} from "../lib/crm.js";

export default function Queries() {
  const { data, remove } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(location.state?.stage || "In Progress");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [confirmDel, setConfirmDel] = useState(null); // query pending deletion

  const queries = data.tripQueries || [];

  // Deep links (old ?id= links from Payments still work → go to the page).
  useEffect(() => {
    const id = params.get("id");
    if (id) navigate(`/queries/${id}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTags = useMemo(() => [...new Set(queries.flatMap((q) => q.tags || []))], [queries]);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.key, 0]));
    queries.forEach((q) => { map[effectiveStage(q)] = (map[effectiveStage(q)] || 0) + 1; });
    return map;
  }, [queries]);

  const rows = useMemo(() => {
    const ql = search.toLowerCase();
    return queries
      .filter((q) => effectiveStage(q) === tab)
      .filter((q) => !tagFilter || (q.tags || []).includes(tagFilter))
      .filter((q) => !ql || [q.guest?.name, q.guest?.phone, q.guest?.email, q.destination, q.assignedTo, q.id]
        .some((v) => String(v || "").toLowerCase().includes(ql)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [queries, tab, search, tagFilter]);

  const columns = [
    {
      key: "guest", header: "Traveller", render: (q) => (
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <span className="ql-avatar">{(q.guest?.name || "?")[0]}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{q.guest?.name || "—"}</div>
            <div className="tiny">{q.guest?.phone || q.guest?.email || q.source}</div>
          </div>
        </div>
      ),
    },
    {
      key: "trip", header: "Trip", render: (q) => (
        <div>
          <div style={{ fontWeight: 600 }}>{q.destination}</div>
          <div className="tiny">
            {q.startDate ? `${fmtDate(q.startDate)} · ${q.nights || "?"}N` : q.travelMonth ? `Planning ${fmtTravelMonth(q.travelMonth)}` : "Dates open"} · {paxLabel(q)}
          </div>
        </div>
      ),
    },
    {
      key: "followup", header: "Next follow-up", render: (q) => {
        const f = nextFollowUp(q);
        if (!f) return <span className="tiny" style={{ color: "var(--text-3)" }}>—</span>;
        const st = followUpState(f);
        return f.dueAt
          ? <Badge tone={st === "overdue" ? "danger" : st === "today" ? "warning" : "neutral"} dot>{fmtDateTime(f.dueAt)}</Badge>
          : <span className="tiny truncate" style={{ maxWidth: 160, display: "inline-block" }}>{f.note}</span>;
      },
    },
    {
      key: "quote", header: "Quote", render: (q) => {
        const best = headlineQuote(q);
        if (!best) return <span className="tiny" style={{ color: "var(--text-3)" }}>Not quoted</span>;
        return <b>{money(quoteTotals(best).finalPrice)}</b>;
      },
    },
    {
      key: "payments", header: "Collection", render: (q) => {
        if (q.status !== "Converted") return <span className="tiny" style={{ color: "var(--text-3)" }}>—</span>;
        const p = paymentSummary(q);
        if (!p.total) return <span className="tiny" style={{ color: "var(--text-3)" }}>No plan</span>;
        return p.due > 0 ? <Badge tone="warning">{money(p.due)} due</Badge> : <Badge tone="success">Paid ✓</Badge>;
      },
    },
    {
      key: "assigned", header: "Assigned", render: (q) => q.assignedTo
        ? <span className="tiny" style={{ fontWeight: 600 }}>{q.assignedTo}</span>
        : <span className="tiny" style={{ color: "var(--text-3)" }}>—</span>,
    },
    {
      key: "actions", header: "", actions: true, width: 50, render: (q) => (
        <IconButton name="trash" size="sm" className="danger" title="Delete query" onClick={() => setConfirmDel(q)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Queries" subtitle="Every trip enquiry, from first hello to happy traveller.">
        <Link to="/sales"><Button variant="ghost" icon="compass">Overview</Button></Link>
        <Button variant="primary" icon="plus" onClick={() => navigate("/queries/new")}>New query</Button>
      </PageHeader>

      <Tabs active={tab} onChange={setTab}
        tabs={STAGES.map((s) => ({ value: s.key, label: `${s.key} (${byStage[s.key] || 0})` }))} />

      <div className="row gap-3 mt-4" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search traveller, phone, destination…" />
        {allTags.length > 0 && (
          <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
            options={["", ...allTags].map((t) => ({ value: t, label: t || "All tags" }))} />
        )}
        <span className="tiny" style={{ marginLeft: "auto", color: "var(--text-3)" }}>
          <Icon name="sparkle" size={12} /> {STAGES.find((s) => s.key === tab)?.hint}
        </span>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(q) => navigate(`/queries/${q.id}`)}
          empty={<EmptyState icon="inbox" title={`No queries in ${tab}`}
            message={tab === "New" ? "Add your first trip query to start the pipeline." : "Queries land here as they move through the pipeline."}
            action={tab === "New" ? <Button variant="secondary" icon="plus" onClick={() => navigate("/queries/new")}>New query</Button> : null} />}
        />
      </div>

      {confirmDel && (
        <ConfirmDialog title="Delete query"
          message={`Delete the query for “${confirmDel.guest?.name || "this guest"}” (${confirmDel.destination})? Quotes, follow-ups and payment records go with it.`}
          onConfirm={() => { remove("tripQueries", confirmDel.id); toast("Query deleted"); }}
          onClose={() => setConfirmDel(null)} />
      )}

      <style>{`
        .ql-avatar { width:34px; height:34px; border-radius:50%; background: var(--accent-soft); color: var(--accent-ink); font-weight:700; font-size:14px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
      `}</style>
    </div>
  );
}
