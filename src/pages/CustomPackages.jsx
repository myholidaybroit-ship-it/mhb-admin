// Packages — the unified list of built packages. Open the builder to create or
// edit, view the itinerary + WhatsApp message, or share straight to the
// traveller's WhatsApp. Backed by the `customPackages` collection.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Button, IconButton, Badge, SearchInput, EmptyState,
  ConfirmDialog, useToast,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import ShareActions from "../ui/ShareActions.jsx";
import { packageWhatsAppText, packageTotals, personLabel, fmtDate, money, num } from "../lib/crm.js";

const STATUS_TONE = { draft: "warning", approved: "info", converted: "success", rejected: "danger" };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

export default function Packages() {
  const { data, remove } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const packages = data.customPackages || [];
  const statusOf = (p) => p.status || "draft";
  const counts = {
    all: packages.length,
    draft: packages.filter((p) => statusOf(p) === "draft").length,
    approved: packages.filter((p) => statusOf(p) === "approved").length,
    converted: packages.filter((p) => statusOf(p) === "converted").length,
  };

  const rows = useMemo(() => {
    const ql = search.toLowerCase();
    return packages
      .filter((p) => tab === "all" || statusOf(p) === tab)
      .filter((p) => !ql || [p.title, p.destination, p.customer?.name, p.customer?.phone, p.refId]
        .some((v) => String(v || "").toLowerCase().includes(ql)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [packages, tab, search]);

  const columns = [
    {
      key: "customer", header: "Customer", render: (p) => (
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <span className="ql-avatar">{(p.customer?.name || "?")[0]}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{p.customer?.name || "—"}</div>
            <div className="tiny">{p.customer?.phone || "no number"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "package", header: "Package", render: (p) => (
        <div>
          <div style={{ fontWeight: 600 }}>{p.title || `${p.destination} package`}</div>
          <div className="tiny">{[p.destination, fmtDate(p.travelDate), `${num(p.nights)}N`, personLabel(p)].filter(Boolean).join(" · ")}</div>
        </div>
      ),
    },
    { key: "price", header: "Price (INR)", render: (p) => { const t = packageTotals(p); return t.grandInr ? <b>{money(t.grandInr)}</b> : <span className="tiny" style={{ color: "var(--text-3)" }}>—</span>; } },
    { key: "status", header: "Status", render: (p) => <Badge tone={STATUS_TONE[statusOf(p)] || "neutral"} dot>{cap(statusOf(p))}</Badge> },
    {
      key: "actions", header: "", actions: true, width: 240, render: (p) => (
        <div className="row gap-1" style={{ justifyContent: "flex-end", alignItems: "center" }}>
          <ShareActions labels={false} phone={p.customer?.phone} email={p.customer?.email}
            subject={`${p.title || `Your ${p.destination || "trip"} plan`} — MyHolidayBro ✈️`}
            text={packageWhatsAppText(p)} />
          <IconButton name="eye" size="sm" title="View & WhatsApp" onClick={() => navigate(`/packages/${p.id}/view`)} />
          <IconButton name="edit" size="sm" title="Open builder" onClick={() => navigate(`/packages/${p.id}`)} />
          <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirmDel(p)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Packages" subtitle="Build a fully priced package, generate the itinerary, and send it to the traveller's WhatsApp.">
        <Button variant="primary" icon="plus" onClick={() => navigate("/packages/new")}>New package</Button>
      </PageHeader>

      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "all", label: `All (${counts.all})` },
        { value: "draft", label: `Draft (${counts.draft})` },
        { value: "approved", label: `Approved (${counts.approved})` },
        { value: "converted", label: `Converted (${counts.converted})` },
      ]} />

      <div className="row gap-3 mt-4" style={{ alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer, destination, ref…" />
      </div>

      <div className="mt-4">
        <DataTable columns={columns} rows={rows}
          onRowClick={(p) => navigate(`/packages/${p.id}/view`)}
          empty={<EmptyState icon="sparkle" title="No packages yet"
            message="Build a priced package with hotels, transport and sightseeing — then send it to WhatsApp in one click."
            action={<Button variant="secondary" icon="plus" onClick={() => navigate("/packages/new")}>New package</Button>} />}
        />
      </div>

      {confirmDel && (
        <ConfirmDialog title="Delete package"
          message={`Delete “${confirmDel.title || confirmDel.destination}” for ${confirmDel.customer?.name || "this customer"}? This cannot be undone.`}
          onConfirm={() => { remove("customPackages", confirmDel.id); toast("Package deleted"); }}
          onClose={() => setConfirmDel(null)} />
      )}

      <style>{`
        .ql-avatar { width:34px; height:34px; border-radius:50%; background: var(--accent-soft); color: var(--accent-ink); font-weight:700; font-size:14px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
      `}</style>
    </div>
  );
}
