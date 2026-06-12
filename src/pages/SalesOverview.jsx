// Sales Overview — the CRM's reports page. Everything is computed live from
// the trip-queries collection: funnel, revenue, sources, trend, due follow-ups.

import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Badge, Button, EmptyState } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import {
  STAGES, stageTone, effectiveStage, salesStats, bySource, byDestination,
  lastMonths, monthKey, fmtMonth, money, nextFollowUp, followUpState,
  fmtDateTime, headlineQuote, quoteTotals,
} from "../lib/crm.js";

function StatCard({ icon, value, label, foot, tone = "" }) {
  return (
    <div className={`so-stat ${tone}`}>
      <span className="so-stat-ico"><Icon name={icon} size={18} /></span>
      <div className="so-stat-num">{value}</div>
      <div className="so-stat-label">{label}</div>
      {foot && <div className="so-stat-foot">{foot}</div>}
    </div>
  );
}

function HRow({ label, value, max, suffix = "" }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="so-hrow">
      <span className="so-hrow-label truncate">{label}</span>
      <div className="so-hrow-track"><div className="so-hrow-fill" style={{ width: `${pct}%` }} /></div>
      <span className="so-hrow-val">{value}{suffix}</span>
    </div>
  );
}

export default function SalesOverview() {
  const { data } = useStore();
  const navigate = useNavigate();
  const queries = data.tripQueries || [];

  const m = useMemo(() => {
    const stats = salesStats(queries);
    const funnel = STAGES.map((s) => ({ ...s, count: queries.filter((q) => effectiveStage(q) === s.key).length }));
    const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

    const months = lastMonths(6);
    const trend = months.map((k) => ({
      key: k, label: fmtMonth(k),
      count: queries.filter((q) => monthKey(q.conversion?.convertedAt) === k).length,
      value: queries.filter((q) => monthKey(q.conversion?.convertedAt) === k)
        .reduce((s, q) => s + (headlineQuote(q) ? quoteTotals(headlineQuote(q)).finalPrice : 0), 0),
    }));
    const maxTrend = Math.max(...trend.map((t) => t.count), 1);

    const due = queries
      .map((q) => ({ q, f: nextFollowUp(q) }))
      .filter((x) => x.f && ["overdue", "today"].includes(followUpState(x.f)))
      .sort((a, b) => new Date(a.f.dueAt || 0) - new Date(b.f.dueAt || 0))
      .slice(0, 6);

    return {
      stats, funnel, maxFunnel, trend, maxTrend, due,
      sources: bySource(queries).slice(0, 6),
      dests: byDestination(queries).slice(0, 6),
      maxSource: Math.max(...bySource(queries).map(([, n]) => n), 1),
      maxDest: Math.max(...byDestination(queries).map(([, n]) => n), 1),
    };
  }, [queries]);

  if (!queries.length) {
    return (
      <div>
        <PageHeader title="Sales overview" subtitle="Your pipeline, revenue and follow-ups at a glance." />
        <EmptyState icon="inbox" title="No queries yet" message="Add your first trip query and this page comes alive."
          action={<Link to="/queries"><Button variant="primary" icon="plus">Go to Queries</Button></Link>} />
      </div>
    );
  }

  return (
    <div className="so">
      <PageHeader title="Sales overview" subtitle="Your pipeline, revenue and follow-ups at a glance.">
        <Link to="/queries"><Button variant="primary" icon="plus">New query</Button></Link>
      </PageHeader>

      {/* headline numbers */}
      <div className="so-stats">
        <StatCard icon="inbox" value={m.stats.total} label="Total queries" foot={`${m.funnel.find((f) => f.key === "New")?.count || 0} new`} />
        <StatCard icon="check" value={`${m.stats.conversionRate}%`} label="Conversion rate" foot={`${m.stats.converted} trips booked`} tone="accent" />
        <StatCard icon="tag" value={money(m.stats.booked)} label="Booked value" foot={`avg ${money(m.stats.avgDeal)} / trip`} />
        <StatCard icon="download" value={money(m.stats.received)} label="Received" tone="good" />
        <StatCard icon="bell" value={money(m.stats.pending)} label="Pending collection" tone={m.stats.pending > 0 ? "warn" : ""} />
      </div>

      <div className="so-grid">
        {/* funnel */}
        <div className="card">
          <div className="row-between"><h3 className="section-title">Pipeline funnel</h3><Link to="/queries" className="see-link">Open queries</Link></div>
          <div className="col gap-2 mt-4">
            {m.funnel.map((f) => (
              <button type="button" key={f.key} className="so-funnel-row" onClick={() => navigate("/queries", { state: { stage: f.key } })}>
                <Badge tone={f.tone} dot>{f.key}</Badge>
                <div className="so-hrow-track"><div className="so-hrow-fill" style={{ width: `${Math.max(4, (f.count / m.maxFunnel) * 100)}%` }} /></div>
                <b className="so-hrow-val">{f.count}</b>
              </button>
            ))}
          </div>
        </div>

        {/* monthly trend */}
        <div className="card">
          <h3 className="section-title">Conversions · last 6 months</h3>
          <div className="so-trend mt-4">
            {m.trend.map((t) => (
              <div className="so-trend-col" key={t.key} title={`${t.count} trips · ${money(t.value)}`}>
                <span className="so-trend-n">{t.count || ""}</span>
                <div className="so-trend-bar" style={{ height: `${Math.max(6, (t.count / m.maxTrend) * 100)}%` }} />
                <span className="so-trend-label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* follow-ups due */}
        <div className="card">
          <div className="row-between"><h3 className="section-title">Needs attention</h3><Link to="/followups" className="see-link">All follow-ups</Link></div>
          <div className="col gap-2 mt-4">
            {m.due.length === 0 && <span className="tiny" style={{ color: "var(--text-3)" }}>Nothing due — pipeline is under control 🎉</span>}
            {m.due.map(({ q, f }) => (
              <Link to={`/queries/${q.id}`} key={q.id} className="so-due-row">
                <span className="so-avatar">{(q.guest?.name || "?")[0]}</span>
                <div className="grow truncate">
                  <div className="truncate" style={{ fontWeight: 600, fontSize: 13 }}>{q.guest?.name} · {q.destination}</div>
                  <div className="tiny truncate">{f.note}</div>
                </div>
                <Badge tone={followUpState(f) === "overdue" ? "danger" : "warning"} dot>{fmtDateTime(f.dueAt)}</Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* sources */}
        <div className="card">
          <h3 className="section-title">Where queries come from</h3>
          <div className="col gap-1 mt-4">
            {m.sources.map(([label, n]) => <HRow key={label} label={label} value={n} max={m.maxSource} />)}
          </div>
        </div>

        {/* destinations */}
        <div className="card">
          <h3 className="section-title">Most asked destinations</h3>
          <div className="col gap-1 mt-4">
            {m.dests.map(([label, n]) => <HRow key={label} label={label} value={n} max={m.maxDest} />)}
          </div>
        </div>
      </div>

      <style>{`
        .so { display:flex; flex-direction:column; gap: var(--sp-6); }
        .so-stats { display:grid; grid-template-columns: repeat(5, 1fr); gap: var(--sp-4); }
        @media (max-width: 1100px){ .so-stats{ grid-template-columns: repeat(2, 1fr); } }
        .so-stat { background: var(--panel); border:1px solid var(--line); border-radius: var(--r-xl); padding: 16px; }
        .so-stat-ico { width:36px; height:36px; border-radius:11px; background: var(--accent-soft); color: var(--accent-ink); display:inline-flex; align-items:center; justify-content:center; }
        .so-stat.good .so-stat-ico { background:#dcfce7; color:#15803d; }
        .so-stat.warn .so-stat-ico { background:#fee2e2; color:#b91c1c; }
        .so-stat.accent .so-stat-ico { background: var(--accent); color: var(--ink); }
        .so-stat-num { font-size:24px; font-weight:700; letter-spacing:-0.02em; margin-top:10px; }
        .so-stat-label { font-size:12px; color: var(--text-2); }
        .so-stat-foot { font-size:11px; color: var(--text-3); margin-top:6px; }
        .so-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: var(--sp-6); }
        @media (max-width: 980px){ .so-grid{ grid-template-columns: 1fr; } }
        .so-funnel-row { display:flex; align-items:center; gap:12px; background:none; border:none; padding:6px 4px; cursor:pointer; border-radius: var(--r-sm); text-align:left; }
        .so-funnel-row:hover { background: var(--panel-soft); }
        .so-funnel-row .badge { width: 120px; justify-content:flex-start; }
        .so-hrow { display:flex; align-items:center; gap:12px; padding:7px 0; }
        .so-hrow-label { width:130px; font-size:12.5px; font-weight:600; flex:none; }
        .so-hrow-track { flex:1; height:10px; border-radius:999px; background: var(--line-soft); overflow:hidden; }
        .so-hrow-fill { height:100%; border-radius:999px; background: linear-gradient(90deg, #ffe27a, #f0bd24); transition: width 500ms ease; }
        .so-hrow-val { width:38px; text-align:right; font-weight:700; font-size:13px; flex:none; }
        .so-trend { display:flex; align-items:flex-end; gap:14px; height:150px; padding: 0 6px; }
        .so-trend-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:5px; }
        .so-trend-bar { width:100%; max-width:46px; border-radius:8px 8px 3px 3px; background: linear-gradient(180deg, #ffe27a, #f0bd24); }
        .so-trend-n { font-size:11.5px; font-weight:700; }
        .so-trend-label { font-size:10.5px; color: var(--text-3); }
        .so-due-row { display:flex; align-items:center; gap:10px; padding:8px; border:1px solid var(--line); border-radius: var(--r-md); transition: background .12s; }
        .so-due-row:hover { background: var(--panel-soft); }
        .so-avatar { width:30px; height:30px; border-radius:50%; background: var(--accent-soft); color: var(--accent-ink); font-weight:700; font-size:13px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
      `}</style>
    </div>
  );
}
