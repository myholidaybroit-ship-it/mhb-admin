// Custom packages — personalised trip plans built for individual travellers.
// List → open the builder; send any package to the traveller's WhatsApp.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Button, IconButton, Badge, SearchInput, EmptyState,
  ConfirmDialog, useToast,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import Icon from "../ui/icons.jsx";
import ShareActions from "../ui/ShareActions.jsx";
import { packageShareText, paxLabel, fmtDate, fmtDateTime, num } from "../lib/crm.js";

export default function CustomPackages() {
  const { data, upsert, remove } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const packages = data.customPackages || [];
  const counts = {
    all: packages.length,
    draft: packages.filter((p) => p.status !== "sent").length,
    sent: packages.filter((p) => p.status === "sent").length,
  };

  const rows = useMemo(() => {
    const ql = search.toLowerCase();
    return packages
      .filter((p) => tab === "all" || (tab === "sent" ? p.status === "sent" : p.status !== "sent"))
      .filter((p) => !ql || [p.title, p.destination, p.traveller?.name, p.traveller?.phone]
        .some((v) => String(v || "").toLowerCase().includes(ql)))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [packages, tab, search]);

  // WhatsApp/Mail mark the package as sent; Copy leaves the status alone.
  const onShared = (p) => (channel) => {
    if (channel === "whatsapp" || channel === "mail") {
      upsert("customPackages", { ...p, status: "sent", sentAt: new Date().toISOString() });
      toast(`Package marked sent (${channel === "whatsapp" ? "WhatsApp" : "email"})`);
    }
  };

  const columns = [
    {
      key: "traveller", header: "Traveller", render: (p) => (
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <span className="ql-avatar">{(p.traveller?.name || "?")[0]}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{p.traveller?.name || "—"}</div>
            <div className="tiny">{p.traveller?.phone || "no number"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "package", header: "Package", render: (p) => (
        <div>
          <div style={{ fontWeight: 600 }}>{p.title || `${p.destination} custom plan`}</div>
          <div className="tiny">{p.destination} · {fmtDate(p.startDate)} · {num(p.nights)}N · {paxLabel(p)}</div>
        </div>
      ),
    },
    { key: "days", header: "Days planned", render: (p) => <Badge tone="neutral">{(p.days || []).length} day{(p.days || []).length === 1 ? "" : "s"}</Badge> },
    { key: "price", header: "Price", render: (p) => p.price ? <b>{p.price}</b> : <span className="tiny" style={{ color: "var(--text-3)" }}>—</span> },
    {
      key: "status", header: "Status", render: (p) => p.status === "sent"
        ? <Badge tone="success" dot>Sent · {fmtDateTime(p.sentAt)}</Badge>
        : <Badge tone="warning" dot>Draft</Badge>,
    },
    {
      key: "actions", header: "", actions: true, width: 210, render: (p) => (
        <div className="row gap-1" style={{ justifyContent: "flex-end", alignItems: "center" }}>
          <ShareActions labels={false} phone={p.traveller?.phone} email={p.traveller?.email}
            subject={`${p.title || `Your ${p.destination || "trip"} plan`} — MyHolidayBro ✈️`}
            text={packageShareText(p)} onShared={onShared(p)} />
          <IconButton name="edit" size="sm" title="Open builder" onClick={() => navigate(`/packages/${p.id}`)} />
          <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirmDel(p)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Custom packages" subtitle="Personally designed plans for individual travellers — built, then sent straight to WhatsApp.">
        <Button variant="primary" icon="plus" onClick={() => navigate("/packages/new")}>New custom package</Button>
      </PageHeader>

      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "all", label: `All (${counts.all})` },
        { value: "draft", label: `Drafts (${counts.draft})` },
        { value: "sent", label: `Sent (${counts.sent})` },
      ]} />

      <div className="row gap-3 mt-4" style={{ alignItems: "center" }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search traveller, destination, title…" />
      </div>

      <div className="mt-4">
        <DataTable columns={columns} rows={rows}
          onRowClick={(p) => navigate(`/packages/${p.id}`)}
          empty={<EmptyState icon="sparkle" title="No custom packages yet"
            message="Design a personal trip plan for a traveller and send it to their WhatsApp in one click."
            action={<Button variant="secondary" icon="plus" onClick={() => navigate("/packages/new")}>New custom package</Button>} />}
        />
      </div>

      {confirmDel && (
        <ConfirmDialog title="Delete custom package"
          message={`Delete “${confirmDel.title || confirmDel.destination}” for ${confirmDel.traveller?.name || "this traveller"}? This cannot be undone.`}
          onConfirm={() => { remove("customPackages", confirmDel.id); toast("Package deleted"); }}
          onClose={() => setConfirmDel(null)} />
      )}

      <style>{`
        .ql-avatar { width:34px; height:34px; border-radius:50%; background: var(--accent-soft); color: var(--accent-ink); font-weight:700; font-size:14px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
      `}</style>
    </div>
  );
}
