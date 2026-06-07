import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import {
  PageHeader, Badge, Drawer, Button, Field, Select, SearchInput, Tabs,
  IconButton, ConfirmDialog, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import DataTable from "../ui/DataTable.jsx";

const STATUSES = ["New", "In progress", "Closed"];
const tone = { New: "info", "In progress": "warning", Closed: "success" };
const TYPE_LABEL = { quote: "Quote request", weekend: "Weekend trip", contact: "Contact form" };

const enqType = (e) => e.type || "contact";
const displayName = (e) => e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || "—";
const summary = (e) => {
  if (enqType(e) === "quote") return [e.destination, e.package].filter(Boolean).join(" · ");
  if (enqType(e) === "weekend") return [e.trip, e.channel].filter(Boolean).join(" · ");
  return [e.category, e.destination].filter(Boolean).join(" · ") || (e.message || "");
};

function Stat({ icon, label, value, warn }) {
  return (
    <div className="list-stat">
      <span className={`list-stat-ico ${warn ? "warn" : ""}`}><Icon name={icon} size={18} /></span>
      <div>
        <div className="list-stat-num">{value}</div>
        <div className="list-stat-label">{label}</div>
      </div>
    </div>
  );
}

function Detail({ label, value, link }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <div className="tiny">{label}</div>
      {link ? <a href={link} style={{ fontWeight: 500 }}>{value}</a> : <div style={{ fontWeight: 500 }}>{value}</div>}
    </div>
  );
}

export default function Enquiries() {
  const { data, upsert, remove } = useStore();
  const toast = useToast();
  const [view, setView] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [tab, setTab] = useState("all");

  const all = data.enquiries || [];
  const counts = useMemo(() => ({
    all: all.length,
    quote: all.filter((e) => enqType(e) === "quote").length,
    weekend: all.filter((e) => enqType(e) === "weekend").length,
    contact: all.filter((e) => enqType(e) === "contact").length,
    new: all.filter((e) => e.status === "New").length,
  }), [all]);

  const rows = useMemo(() => all.filter((e) => {
    if (tab !== "all" && enqType(e) !== tab) return false;
    if (status !== "all" && e.status !== status) return false;
    if (q && !`${displayName(e)} ${e.email} ${summary(e)} ${e.message || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [all, tab, status, q]);

  const setStatusFor = (e, s) => { upsert("enquiries", { ...e, status: s }); toast("Status updated"); };

  const fromCol = { key: "name", header: "From", render: (r) => (<div><div style={{ fontWeight: 600 }}>{displayName(r)}</div><div className="tiny">{r.email}</div></div>) };
  const recvCol = { key: "createdAt", header: "Received", render: (r) => <span className="tiny">{r.createdAt}</span> };
  const statusCol = { key: "status", header: "Status", render: (r) => <Badge tone={tone[r.status]} dot>{r.status}</Badge> };
  const actionsCol = {
    key: "actions", actions: true,
    render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="eye" size="sm" title="View" onClick={(e) => { e.stopPropagation(); setView(r); }} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(r); }} />
      </div>
    ),
  };

  const columns = useMemo(() => {
    if (tab === "quote") return [
      fromCol,
      { key: "pkg", header: "Package", render: (r) => (<div><div style={{ fontWeight: 500 }}>{r.destination}</div><div className="tiny truncate" style={{ maxWidth: 260 }}>{r.package}</div></div>) },
      { key: "pax", header: "Pax", render: (r) => <span className="tiny">{r.adults || 0} adult{(r.adults || 0) === 1 ? "" : "s"} · {r.children || 0} child</span> },
      { key: "total", header: "Total", render: (r) => <strong>{r.total || "—"}</strong> },
      recvCol, statusCol, actionsCol,
    ];
    if (tab === "weekend") return [
      fromCol,
      { key: "trip", header: "Trip", render: (r) => <span style={{ fontWeight: 500 }}>{r.trip}</span> },
      { key: "price", header: "Price", render: (r) => <span>{r.price}</span> },
      { key: "channel", header: "Via", render: (r) => <Badge tone={r.channel === "WhatsApp" ? "success" : "info"}>{r.channel || "Callback"}</Badge> },
      recvCol, statusCol, actionsCol,
    ];
    if (tab === "contact") return [
      fromCol,
      { key: "interest", header: "Interest", render: (r) => <span className="tiny">{[r.category, r.destination].filter(Boolean).join(" · ") || "—"}</span> },
      { key: "message", header: "Message", render: (r) => <span className="tiny truncate" style={{ display: "block", maxWidth: 300 }}>{r.message}</span> },
      recvCol, statusCol, actionsCol,
    ];
    return [
      fromCol,
      { key: "type", header: "Type", render: (r) => <Badge tone="neutral">{TYPE_LABEL[enqType(r)]}</Badge> },
      { key: "summary", header: "Summary", render: (r) => <span className="tiny truncate" style={{ display: "block", maxWidth: 300 }}>{summary(r)}</span> },
      recvCol, statusCol, actionsCol,
    ];
  }, [tab]);

  const t = view && enqType(view);

  return (
    <div>
      <PageHeader title="Enquiries" subtitle={`${all.length} customer enquiries across all forms`} />

      <div className="list-stats">
        <Stat icon="inbox" label="Total enquiries" value={counts.all} />
        <Stat icon="bell" label="New / unread" value={counts.new} warn={counts.new > 0} />
        <Stat icon="map" label="Quote requests" value={counts.quote} />
        <Stat icon="calendar" label="Weekend + contact" value={counts.weekend + counts.contact} />
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "all", label: `All (${counts.all})` },
        { value: "quote", label: `Quote requests (${counts.quote})` },
        { value: "weekend", label: `Weekend trips (${counts.weekend})` },
        { value: "contact", label: `Contact form (${counts.contact})` },
      ]} />

      <div className="row-between wrap gap-3" style={{ margin: "var(--sp-4) 0" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, message…" />
        <div className="pill-tabs">
          {["all", ...STATUSES].map((s) => (
            <button key={s} className={`pill-tab ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>{s === "all" ? "All status" : s}</button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setView(r)} />

      {view && (
        <Drawer title={displayName(view)} subtitle={TYPE_LABEL[t]} onClose={() => setView(null)}
          footer={<Button variant="ghost" onClick={() => setView(null)}>Close</Button>}>
          <div className="col gap-4">
            <Field label="Status">
              <Select value={view.status} options={STATUSES} onChange={(e) => { setStatusFor(view, e.target.value); setView({ ...view, status: e.target.value }); }} />
            </Field>

            <div className="card-soft col gap-3">
              <div className="row gap-5 wrap">
                <Detail label="Email" value={view.email} link={`mailto:${view.email}`} />
                <Detail label="Phone" value={view.phone} link={`tel:${(view.phone || "").replace(/\s/g, "")}`} />
                <Detail label="Received" value={view.createdAt} />
              </div>
            </div>

            {/* Type-specific details */}
            {t === "quote" && (
              <div className="card-soft col gap-3">
                <div className="row gap-5 wrap">
                  <Detail label="Destination" value={view.destination} />
                  <Detail label="Adults" value={view.adults} />
                  <Detail label="Children" value={view.children} />
                  <Detail label="Estimated total" value={view.total} />
                </div>
                <Detail label="Package" value={view.package} />
              </div>
            )}
            {t === "weekend" && (
              <div className="card-soft col gap-3">
                <div className="row gap-5 wrap">
                  <Detail label="Weekend trip" value={view.trip} />
                  <Detail label="Price" value={view.price} />
                  <Detail label="Requested via" value={view.channel} />
                </div>
              </div>
            )}
            {t === "contact" && (
              <>
                <div className="card-soft col gap-3">
                  <div className="row gap-5 wrap">
                    <Detail label="Trip type" value={view.category} />
                    <Detail label="Where to" value={view.destination} />
                    <Detail label="Marketing opt-in" value={view.marketing ? "Yes" : "No"} />
                  </div>
                </div>
                {view.message ? (
                  <Field label="Message"><div className="card-soft" style={{ lineHeight: 1.6 }}>{view.message}</div></Field>
                ) : null}
              </>
            )}

            <div className="row gap-2">
              <a className="btn btn-primary" href={`mailto:${view.email}`}><Icon name="mail" size={15} /> Reply by email</a>
              {view.phone ? <a className="btn btn-ghost" href={`tel:${(view.phone || "").replace(/\s/g, "")}`}><Icon name="phone" size={15} /> Call</a> : null}
            </div>
          </div>
        </Drawer>
      )}

      {confirm && (
        <ConfirmDialog title="Delete enquiry" message={`Delete the enquiry from ${displayName(confirm)}?`}
          onConfirm={() => remove("enquiries", confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
