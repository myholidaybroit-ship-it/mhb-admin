// Payments — every installment across converted queries in one place.
// Sembark-style collections view: upcoming / overdue / received tabs, totals
// strip, one-click "received", jump back to the query.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Tabs, Badge, Button, IconButton, Select, useToast, EmptyState, ConfirmDialog } from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import Icon from "../ui/icons.jsx";
import { paymentState, money, num, fmtDate, logActivity, PAY_MODES, effectiveStage, stageTone } from "../lib/crm.js";

export default function Payments() {
  const { data, upsert } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const [modes, setModes] = useState({}); // paymentId → selected mode
  const [confirmDel, setConfirmDel] = useState(null); // payment row pending deletion

  const queries = data.tripQueries || [];

  const rows = useMemo(() => {
    const all = queries.flatMap((q) => (q.payments || []).map((p) => ({ ...p, q, state: paymentState(p) })));
    const filtered = tab === "all" ? all : all.filter((r) => r.state === tab);
    return filtered.sort((a, b) => new Date(a.dueAt || "2999-01-01") - new Date(b.dueAt || "2999-01-01"));
  }, [queries, tab]);

  const totals = useMemo(() => {
    const all = queries.flatMap((q) => q.payments || []);
    const sum = (list) => list.reduce((s, p) => s + num(p.amount), 0);
    return {
      upcoming: sum(all.filter((p) => paymentState(p) === "upcoming")),
      overdue: sum(all.filter((p) => paymentState(p) === "overdue")),
      paid: sum(all.filter((p) => p.paidAt)),
    };
  }, [queries]);

  const counts = useMemo(() => {
    const all = queries.flatMap((q) => q.payments || []);
    return {
      upcoming: all.filter((p) => paymentState(p) === "upcoming").length,
      overdue: all.filter((p) => paymentState(p) === "overdue").length,
      paid: all.filter((p) => p.paidAt).length,
      all: all.length,
    };
  }, [queries]);

  const markPaid = (row) => {
    const mode = modes[row.id] || PAY_MODES[0];
    const q = row.q;
    const next = {
      ...q,
      payments: q.payments.map((p) => (p.id === row.id ? { ...p, paidAt: new Date().toISOString(), mode } : p)),
    };
    upsert("tripQueries", { ...next, activity: logActivity(next, `Payment received — ${row.label} ${money(row.amount)} (${mode})`) });
    toast(`${money(row.amount)} recorded as received`);
  };

  const deleteInstallment = (row) => {
    const q = row.q;
    const next = { ...q, payments: q.payments.filter((p) => p.id !== row.id) };
    upsert("tripQueries", { ...next, activity: logActivity(next, `Installment “${row.label}” deleted`) });
    toast("Installment deleted");
  };

  const columns = [
    {
      key: "guest", header: "Traveller / Trip", render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.q.guest?.name || "—"}</div>
          <div className="tiny">{r.q.destination} · {fmtDate(r.q.startDate)}</div>
        </div>
      ),
    },
    { key: "label", header: "Installment", render: (r) => <span style={{ fontWeight: 600, fontSize: 13 }}>{r.label}</span> },
    { key: "amount", header: "Amount", render: (r) => <b>{money(r.amount)}</b> },
    {
      key: "due", header: "Due / Paid", render: (r) => r.paidAt
        ? <Badge tone="success" dot>Paid {fmtDate(r.paidAt)}{r.mode ? ` · ${r.mode}` : ""}</Badge>
        : r.state === "overdue"
          ? <Badge tone="danger" dot>Overdue · {fmtDate(r.dueAt)}</Badge>
          : <span className="tiny">{r.dueAt ? `Due ${fmtDate(r.dueAt)}` : "No due date"}</span>,
    },
    {
      key: "stage", header: "Trip stage", render: (r) => {
        const st = effectiveStage(r.q);
        return <Badge tone={stageTone(st)}>{st}</Badge>;
      },
    },
    {
      key: "act", header: "", actions: true, width: 290, render: (r) => (
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          {!r.paidAt && (
            <>
              <Select style={{ width: 132, flex: "none" }} value={modes[r.id] || PAY_MODES[0]} onChange={(e) => setModes((m) => ({ ...m, [r.id]: e.target.value }))} options={PAY_MODES} />
              <Button variant="secondary" size="sm" icon="check" onClick={() => markPaid(r)}>Received</Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate(`/queries/${r.q.id}`)}>Open query</Button>
          <IconButton name="trash" size="sm" className="danger" title="Delete installment" onClick={() => setConfirmDel(r)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Incoming installments across all converted trips." />

      <div className="pp-strip">
        {[
          { n: money(totals.overdue), l: "Overdue", ico: "bell", tone: totals.overdue > 0 ? "bad" : "" },
          { n: money(totals.upcoming), l: "Upcoming collectable", ico: "calendar" },
          { n: money(totals.paid), l: "Received till date", ico: "check", tone: "good" },
        ].map((s, i) => (
          <div className="pp-item" key={i}>
            <span className={`pp-ico ${s.tone}`}><Icon name={s.ico} size={16} /></span>
            <div><div className="pp-num">{s.n}</div><div className="pp-label">{s.l}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Tabs active={tab} onChange={setTab} tabs={[
          { value: "upcoming", label: `Upcoming (${counts.upcoming})` },
          { value: "overdue", label: `Overdue (${counts.overdue})` },
          { value: "paid", label: `Received (${counts.paid})` },
          { value: "all", label: `All (${counts.all})` },
        ]} />
      </div>

      <div className="mt-4">
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id}
          empty={<EmptyState icon="tag" title="No installments here" message="Payment plans appear when queries are converted using a quote." />} />
      </div>

      {confirmDel && (
        <ConfirmDialog title="Delete installment"
          message={`Delete “${confirmDel.label}” (${money(confirmDel.amount)}) for ${confirmDel.q.guest?.name || "this traveller"}${confirmDel.paidAt ? " — it is already marked received" : ""}? This cannot be undone.`}
          onConfirm={() => deleteInstallment(confirmDel)} onClose={() => setConfirmDel(null)} />
      )}

      <style>{`
        .pp-strip { display:flex; gap:0; background:var(--panel); border:1px solid var(--line); border-radius:var(--r-xl); padding:14px 10px; flex-wrap:wrap; }
        .pp-item { display:flex; align-items:center; gap:10px; flex:1; min-width:170px; padding:4px 16px; border-right:1px solid var(--line); }
        .pp-item:last-child { border-right:none; }
        .pp-ico { width:34px; height:34px; border-radius:10px; background:var(--accent-soft); color:var(--accent-ink); display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .pp-ico.bad { background:#fee2e2; color:#b91c1c; }
        .pp-ico.good { background:#dcfce7; color:#15803d; }
        .pp-num { font-size:17px; font-weight:700; letter-spacing:-0.01em; }
        .pp-label { font-size:11.5px; color:var(--text-2); }
        @media (max-width:760px){ .pp-item{ border-right:none; min-width:45%; } }
      `}</style>
    </div>
  );
}
