import { useMemo, useState } from "react";
import { useStore, uid } from "../lib/store.jsx";
import { priceNum, PeoplePicker } from "../ui/editorBits.jsx";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Select, SearchInput,
  Stepper, ChipSelect, IconButton, ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import DataTable from "../ui/DataTable.jsx";

const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const STATUSES = ["Draft", "Confirmed", "Cancelled"];
const statusTone = { Draft: "neutral", Confirmed: "success", Cancelled: "danger" };

// Build a flat list of selectable packages from destinations + weekend trips.
function usePackageOptions() {
  const { data } = useStore();
  return useMemo(() => {
    const out = [];
    (data.destinations || []).forEach((d) => (d.packages || []).forEach((p, i) => {
      out.push({ value: `dest:${d.slug}:${i}`, label: `${d.name} — ${p.name} · ${p.price}`, base: priceNum(p.price), name: `${d.name} · ${p.name}`, kind: "Destination" });
    }));
    (data.weekends || []).forEach((w) => {
      out.push({ value: `wk:${w.id}`, label: `Weekend — ${w.name} · ${w.salePrice}`, base: priceNum(w.salePrice), name: `${w.name}`, kind: "Weekend" });
    });
    return out;
  }, [data.destinations, data.weekends]);
}

function pricingOf(a, travelers) {
  const chosen = (a.travelerIds || []).map((id) => travelers.find((t) => t.id === id)).filter(Boolean);
  const adults = chosen.filter((t) => t.group !== "Child").length;
  const children = chosen.filter((t) => t.group === "Child").length;
  const subtotal = adults * (a.adultPrice || 0) + children * (a.childPrice || 0);
  const taxes = subtotal * ((a.taxesPct || 0) / 100);
  return { chosen, adults, children, subtotal, taxes, total: subtotal + taxes };
}

/* ---------------- Assignment editor ---------------- */
function AssignmentEditor({ value, onClose }) {
  const { upsert, data } = useStore();
  const toast = useToast();
  const pkgOptions = usePackageOptions();
  const travelers = data.travelers || [];
  const [a, setA] = useState(() => value || { id: uid("as"), pkg: "", pkgName: "", travelerIds: [], adultPrice: 0, childPrice: 0, taxesPct: 5, status: "Draft", createdAt: new Date().toISOString().slice(0, 10) });
  const set = (p) => setA((s) => ({ ...s, ...p }));

  const onPickPkg = (val) => {
    const opt = pkgOptions.find((o) => o.value === val);
    set({ pkg: val, pkgName: opt?.name || "", adultPrice: opt?.base || 0, childPrice: Math.round((opt?.base || 0) * 0.6) });
  };
  const toggleTraveller = (id) => set({ travelerIds: a.travelerIds.includes(id) ? a.travelerIds.filter((x) => x !== id) : [...a.travelerIds, id] });

  const price = pricingOf(a, travelers);
  const save = () => {
    if (!a.pkg) return toast("Select a package", "error");
    if (!a.travelerIds.length) return toast("Add at least one traveller", "error");
    upsert("assignments", { ...a, total: price.total });
    toast(value ? "Assignment saved" : "Assignment created");
    onClose();
  };

  return (
    <Drawer wide title={value ? a.pkgName || "Edit assignment" : "New package assignment"} subtitle={`${a.travelerIds.length} traveller(s) · ${fmt(price.total)}`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save assignment</Button></>}>
      <div className="col gap-5">
        <Field label="Package" required hint="From your destinations & weekend trips">
          <Select value={a.pkg} placeholder="Select a package…" onChange={(e) => onPickPkg(e.target.value)} options={pkgOptions} />
        </Field>

        <Field label="Travellers" hint="Pick individuals or a whole group — adults & children are counted automatically">
          {travelers.length === 0 ? (
            <div className="card-soft tiny">No travellers yet — add them on the <strong>People</strong> page first.</div>
          ) : (
            <PeoplePicker value={a.travelerIds} onChange={(ids) => set({ travelerIds: ids })} travelers={travelers} groups={data.travelerGroups || []} />
          )}
        </Field>

        <div className="card-soft col gap-3">
          <div className="field-label" style={{ fontSize: "var(--fs-md)" }}>Pricing</div>
          <div className="form-grid">
            <Field label="Price per adult"><Input prefix="₹" type="number" value={a.adultPrice} onChange={(e) => set({ adultPrice: parseInt(e.target.value) || 0 })} /></Field>
            <Field label="Price per child"><Input prefix="₹" type="number" value={a.childPrice} onChange={(e) => set({ childPrice: parseInt(e.target.value) || 0 })} /></Field>
            <Field label={`Taxes — ${a.taxesPct}%`}><Stepper value={a.taxesPct} min={0} max={28} step={1} suffix="%" onChange={(v) => set({ taxesPct: v })} /></Field>
            <Field label="Status"><Select value={a.status} options={STATUSES} onChange={(e) => set({ status: e.target.value })} /></Field>
          </div>
          <div className="price-breakdown">
            <div className="row-between"><span className="tiny">{price.adults} adult × {fmt(a.adultPrice)}</span><span>{fmt(price.adults * a.adultPrice)}</span></div>
            <div className="row-between"><span className="tiny">{price.children} child × {fmt(a.childPrice)}</span><span>{fmt(price.children * a.childPrice)}</span></div>
            <div className="row-between"><span className="tiny">Taxes ({a.taxesPct}%)</span><span>{fmt(price.taxes)}</span></div>
            <div className="row-between price-total"><strong>Total ({price.adults + price.children} pax)</strong><strong>{fmt(price.total)}</strong></div>
          </div>
        </div>
      </div>
      <style>{`
        .price-breakdown { display:flex; flex-direction:column; gap:6px; padding-top:10px; border-top:1px solid var(--line); }
        .price-total { margin-top:6px; padding-top:8px; border-top:1px solid var(--line); font-size:var(--fs-lg); }
      `}</style>
    </Drawer>
  );
}

export default function PackageAssignments() {
  const { data, remove } = useStore();
  const [edit, setEdit] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [q, setQ] = useState("");
  const travelers = data.travelers || [];
  const assignments = data.assignments || [];

  const rows = useMemo(() => assignments.filter((a) => !q || `${a.pkgName}`.toLowerCase().includes(q.toLowerCase())), [assignments, q]);

  const columns = [
    { key: "pkg", header: "Package", render: (r) => <div style={{ fontWeight: 600 }}>{r.pkgName || "—"}</div> },
    {
      key: "travellers", header: "Travellers",
      render: (r) => {
        const p = pricingOf(r, travelers);
        const names = p.chosen.map((t) => t.name).join(", ");
        return <div><div className="tiny">{p.adults} adult · {p.children} child</div><div className="tiny truncate" style={{ maxWidth: 260 }}>{names}</div></div>;
      },
    },
    { key: "total", header: "Total", render: (r) => <strong>{fmt(pricingOf(r, travelers).total)}</strong> },
    { key: "status", header: "Status", render: (r) => <Badge tone={statusTone[r.status]} dot>{r.status}</Badge> },
    {
      key: "actions", actions: true,
      render: (r) => (
        <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
          <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEdit(r); }} />
          <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(r); }} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Package Assignment" subtitle={`${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`}>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>New assignment</Button>
      </PageHeader>

      <div style={{ marginBottom: "var(--sp-4)" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search by package…" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="briefcase" title="No assignments yet" message="Assign a package to travellers and set the pricing."
          action={<Button variant="secondary" icon="plus" onClick={() => setCreating(true)}>New assignment</Button>} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setEdit(r)} />
      )}

      {(creating || edit) && <AssignmentEditor value={edit} onClose={() => { setCreating(false); setEdit(null); }} />}
      {confirm && (
        <ConfirmDialog title="Delete assignment" message={`Delete the assignment for “${confirm.pkgName}”?`}
          onConfirm={() => remove("assignments", confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
