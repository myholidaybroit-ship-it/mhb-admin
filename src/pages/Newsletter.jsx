// Newsletter subscribers — the one collection that lives outside the CMS
// content tree. Listed via /admin/newsletter; subscribers can be removed
// (unsubscribe requests, typos, spam).

import { useEffect, useMemo, useState } from "react";
import { admin } from "../lib/api.js";
import {
  PageHeader, Badge, Button, IconButton, SearchInput, EmptyState,
  ConfirmDialog, useToast,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(+d) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function Newsletter() {
  const toast = useToast();
  const [subs, setSubs] = useState(null); // null = loading
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    admin.newsletter()
      .then((r) => setSubs(r?.data || []))
      .catch((e) => { setSubs([]); toast(e?.message || "Couldn't load subscribers", "error"); });
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(
    () => (subs || []).filter((s) => !q || (s.email || "").toLowerCase().includes(q.toLowerCase())),
    [subs, q]
  );

  const removeSub = (s) => {
    admin.removeSubscriber(s._id)
      .then(() => { setSubs((list) => list.filter((x) => x._id !== s._id)); toast("Subscriber removed"); })
      .catch((e) => toast(e?.message || "Couldn't remove subscriber", "error"));
  };

  const columns = [
    { key: "email", header: "Email", render: (s) => <span style={{ fontWeight: 600 }}>{s.email}</span> },
    { key: "source", header: "Source", render: (s) => <span className="tiny">{s.source || "website"}</span> },
    { key: "date", header: "Subscribed", render: (s) => <span className="tiny">{fmt(s.createdAt)}</span> },
    {
      key: "status", header: "Status", render: (s) => s.active === false
        ? <Badge tone="neutral">Inactive</Badge>
        : <Badge tone="success" dot>Active</Badge>,
    },
    {
      key: "actions", header: "", actions: true, width: 50, render: (s) => (
        <IconButton name="trash" size="sm" className="danger" title="Remove subscriber" onClick={() => setConfirm(s)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Newsletter" subtitle={`${subs?.length ?? "…"} subscriber(s) — collected from the website footer & newsletter page.`}>
        <Button variant="ghost" icon="download" onClick={() => {
          const csv = "email,source,subscribed\n" + (subs || []).map((s) => `${s.email},${s.source || "website"},${fmt(s.createdAt)}`).join("\n");
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
          a.download = "newsletter-subscribers.csv";
          a.click();
        }}>Export CSV</Button>
      </PageHeader>

      <div className="row gap-3" style={{ alignItems: "center", marginBottom: "var(--sp-4)" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search email…" />
      </div>

      {subs === null ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><span className="spinner" /></div>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(s) => s._id}
          empty={<EmptyState icon="mail" title="No subscribers yet" message="Signups from the website newsletter forms appear here." />} />
      )}

      {confirm && (
        <ConfirmDialog title="Remove subscriber" message={`Remove ${confirm.email} from the newsletter list? This cannot be undone.`}
          onConfirm={() => removeSub(confirm)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
