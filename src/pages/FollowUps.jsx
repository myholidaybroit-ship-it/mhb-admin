// Follow-ups hub — every open follow-up across every query, as a to-do list:
// Overdue → Today → Upcoming → No date. One-click done, jump to the query.

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Badge, Button, useToast, EmptyState } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import { followUpState, fmtDateTime, effectiveStage, stageTone, logActivity } from "../lib/crm.js";

const GROUPS = [
  { key: "overdue", title: "Overdue", icon: "bell", tone: "danger" },
  { key: "today", title: "Due today", icon: "calendar", tone: "warning" },
  { key: "open", title: "Upcoming", icon: "chevronRight", tone: "neutral" },
];

export default function FollowUps() {
  const { data, upsert } = useStore();
  const toast = useToast();
  const queries = data.tripQueries || [];

  const groups = useMemo(() => {
    const rows = queries.flatMap((q) =>
      (q.followUps || []).filter((f) => !f.done).map((f) => ({ q, f, state: followUpState(f) }))
    );
    const sortByDue = (a, b) => new Date(a.f.dueAt || "2999-01-01") - new Date(b.f.dueAt || "2999-01-01");
    return GROUPS.map((g) => ({ ...g, rows: rows.filter((r) => r.state === g.key).sort(sortByDue) }));
  }, [queries]);

  const doneCount = useMemo(
    () => queries.flatMap((q) => q.followUps || []).filter((f) => f.done).length,
    [queries]
  );
  const openCount = groups.reduce((s, g) => s + g.rows.length, 0);

  const markDone = ({ q, f }) => {
    const next = { ...q, followUps: q.followUps.map((x) => (x.id === f.id ? { ...x, done: true } : x)) };
    upsert("tripQueries", { ...next, activity: logActivity(next, `Follow-up done — ${f.note.slice(0, 60)}`) });
    toast("Marked done ✓");
  };

  return (
    <div>
      <PageHeader title="Follow-ups" subtitle={`${openCount} open · ${doneCount} completed — your call list for the day.`} />

      {openCount === 0 ? (
        <EmptyState icon="check" title="All caught up" message="No open follow-ups. Add them from any query after a client conversation." />
      ) : (
        <div className="fuh">
          {groups.filter((g) => g.rows.length).map((g) => (
            <div className="card col gap-3" key={g.key}>
              <div className="row gap-2" style={{ alignItems: "center" }}>
                <Icon name={g.icon} size={15} />
                <h3 className="section-title">{g.title}</h3>
                <Badge tone={g.tone}>{g.rows.length}</Badge>
              </div>
              <div className="col gap-2">
                {g.rows.map((r) => {
                  const st = effectiveStage(r.q);
                  return (
                    <div className="fuh-row" key={r.f.id}>
                      <button type="button" className="fu-check" onClick={() => markDone(r)} title="Mark done" />
                      <Link to={`/queries/${r.q.id}`} className="grow truncate fuh-main">
                        <div className="row gap-2" style={{ alignItems: "center" }}>
                          <b style={{ fontSize: 13 }}>{r.q.guest?.name || "—"}</b>
                          <span className="tiny">· {r.q.destination}</span>
                          <Badge tone={stageTone(st)}>{st}</Badge>
                        </div>
                        <div className="tiny truncate" style={{ marginTop: 2 }}>{r.f.note}</div>
                      </Link>
                      {r.f.dueAt && (
                        <Badge tone={g.key === "overdue" ? "danger" : g.key === "today" ? "warning" : "neutral"} dot>
                          {fmtDateTime(r.f.dueAt)}
                        </Badge>
                      )}
                      <Link to={`/queries/${r.q.id}`}><Button variant="ghost" size="sm" icon="chevronRight" /></Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fuh { display:flex; flex-direction:column; gap: var(--sp-5); }
        .fuh-row { display:flex; align-items:center; gap:11px; border:1px solid var(--line); border-radius: var(--r-md); padding:10px 12px; }
        .fuh-row:hover { background: var(--panel-soft); }
        .fuh-main { min-width:0; }
        .fu-check { width:21px; height:21px; border-radius:7px; border:1.5px solid var(--line); background:var(--surface); cursor:pointer; flex:none; }
        .fu-check:hover { border-color: var(--ink); background: var(--accent-soft); }
      `}</style>
    </div>
  );
}
