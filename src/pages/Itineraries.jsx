import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Button, Badge, SearchInput, IconButton, ConfirmDialog, useToast,
} from "../ui/kit.jsx";
import DataTable from "../ui/DataTable.jsx";
import ItineraryEditor from "./ItineraryEditor.jsx";

function blankItinerary() {
  return {
    id: uid("it"), status: "Draft", title: "", destination: "", clientName: "", pax: 2,
    paxLabel: "", tripId: "", startDate: "", duration: "",
    dateRangeLabel: "", priceLabel: "", priceUnit: "per couple", gstIncluded: true, priceTiers: [],
    greeting: "Our sales team has put together this quote for your upcoming trip. Please go through it and let us know if you would like any changes in any of the provided services. Our contact details are at the end.",
    heroImage: "",
    trustBadges: ["Complete pre-trip and on-trip assistance", "No hidden charges", "Verified hotels and cabs"],
    transport: [], visa: "",
    segments: [], days: [], accommodations: [], notes: [], inclusions: [], exclusions: [], terms: [],
  };
}

export default function Itineraries() {
  const { data, upsert, remove } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");

  const rows = useMemo(
    () => data.itineraries.filter((i) => !q || `${i.title} ${i.clientName} ${i.destination}`.toLowerCase().includes(q.toLowerCase())),
    [data.itineraries, q]
  );

  const duplicate = (r) => {
    const copy = { ...structuredClone(r), id: uid("it"), status: "Draft", title: `${r.title} (copy)`, clientName: "" };
    upsert("itineraries", copy);
    toast("Itinerary duplicated");
    setEditing(copy);
  };

  const create = () => {
    const it = blankItinerary();
    upsert("itineraries", it);
    setEditing(it);
  };

  const columns = [
    { key: "title", header: "Itinerary", render: (r) => (
      <div className="row gap-3">
        <img className="cell-thumb" src={r.heroImage} alt="" />
        <div><div style={{ fontWeight: 600 }}>{r.title || "Untitled"}</div><div className="tiny">{r.destination} · {r.dateRangeLabel}</div></div>
      </div>
    )},
    { key: "clientName", header: "Traveller", render: (r) => (<div><div style={{ fontWeight: 500 }}>{r.clientName || "—"}</div><div className="tiny">{r.pax} pax</div></div>) },
    { key: "price", header: "Price", render: (r) => r.priceLabel ? <span style={{ fontWeight: 600 }}>₹{r.priceLabel}</span> : <span className="tiny">—</span> },
    { key: "days", header: "Days", render: (r) => `${(r.days || []).length}` },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Final" ? "success" : "warning"} dot>{r.status}</Badge> },
    { key: "actions", actions: true, render: (r) => (
      <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
        <IconButton name="copy" size="sm" title="Duplicate" onClick={() => duplicate(r)} />
        <IconButton name="edit" size="sm" title="Edit" onClick={() => setEditing(r)} />
        <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={() => setConfirm(r)} />
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Itineraries" subtitle="Build and generate traveller itinerary PDFs.">
        <Button variant="primary" icon="plus" onClick={create}>New itinerary</Button>
      </PageHeader>

      <div style={{ marginBottom: "var(--sp-4)" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search itineraries…" />
      </div>

      <DataTable columns={columns} rows={rows} onRowClick={(r) => setEditing(r)} />

      {editing && <ItineraryEditor value={editing} onClose={() => setEditing(null)} />}
      {confirm && (
        <ConfirmDialog title="Delete itinerary" message={`Delete “${confirm.title}”? This cannot be undone.`}
          onConfirm={() => remove("itineraries", confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
