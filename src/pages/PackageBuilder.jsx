// Package Builder — the K1-style calculator. One screen builds a fully priced
// package: Basic Info → Hotels → Transport → Sightseeing → Remarks → Pricing.
// Every line is picked from the Booking Catalog (price auto-fills) or entered
// custom. All money is INR (B2C). Saves to the `customPackages` collection.

import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useStore, uid } from "../lib/store.jsx";
import {
  PageHeader, Button, Field, Input, Textarea, Select, ComboSelect, DatePicker,
  StringList, Toggle, IconButton, Badge, useToast,
} from "../ui/kit.jsx";
import {
  MEAL_PLANS, STAR_CATEGORIES, TRANSFER_BASIS, PACKAGE_STATUSES,
  packageTotals, hotelLineCost, transportLineCost, sightLineCost,
  money, num, genRefId, personLabel,
} from "../lib/crm.js";

const STATUS_OPTS = PACKAGE_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

// Number-dropdown option lists (travellers, nights, rooms, quantities).
const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: String(min + i) }));
const NIGHTS_OPTS = range(0, 30);
const ADULTS_OPTS = range(1, 20);
const CHILDREN_OPTS = range(0, 15);
const ROOMS_OPTS = range(1, 15);
const QTY_OPTS = range(0, 15);
const PERSONS_OPTS = range(0, 30);

const blankHotel = () => ({ id: uid("hl"), custom: false, hotelId: "", name: "", city: "", category: "", roomType: "", mealPlan: "CP", rooms: 1, nights: 1, exAdult: 0, exChild: 0, checkin: "", price: "", exAdultPrice: "", exChildPrice: "", cost: 0 });
const blankTransport = () => ({ id: uid("tl"), custom: false, transportId: "", name: "", city: "", vehicle: "", basis: "Private", persons: 0, date: "", price: "", cost: 0 });
const blankSight = () => ({ id: uid("sl"), custom: false, placeId: "", name: "", city: "", basis: "SIC", adults: 0, children: 0, date: "", adultPrice: "", childPrice: "", cost: 0 });

const recalcHotel = (h) => ({ ...h, cost: hotelLineCost(h) });
const recalcTransport = (t) => ({ ...t, cost: transportLineCost(t) });
const recalcSight = (s) => ({ ...s, cost: sightLineCost(s) });

// Select-from-catalog with a "Custom…" escape hatch. `value` is the catalog id.
function PickField({ options, value, custom, name, onPick, onCustom, onName, placeholder }) {
  return (
    <div className="col gap-2">
      <Select
        value={custom ? "__custom__" : value || ""}
        placeholder={placeholder}
        options={options}
        onChange={(e) => (e.target.value === "__custom__" ? onCustom() : onPick(e.target.value))}
      >
        <option value="__custom__">✏️ Custom…</option>
      </Select>
      {custom && <Input value={name} placeholder="Type a name" onChange={(e) => onName(e.target.value)} autoFocus />}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="builder-sec-head">
      <span className="builder-sec-line" />
      <h2 className="builder-sec-title">{children}</h2>
      <span className="builder-sec-line" />
      {action}
    </div>
  );
}

export default function PackageBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data, upsert } = useStore();
  const toast = useToast();

  const queryId = params.get("query") || "";
  const existing = id && id !== "new" ? (data.customPackages || []).find((p) => p.id === id) : null;

  const [pkg, setPkg] = useState(() => {
    if (existing) return structuredClone(existing);
    // Prefill from a linked trip-query if provided.
    const q = queryId ? (data.tripQueries || []).find((x) => x.id === queryId) : null;
    return {
      id: uid("cp"), refId: genRefId(), status: "draft", queryId: q?.id || "",
      title: q ? `${q.destination || "Trip"} Package` : "",
      destination: q?.destination || "",
      customer: { name: q?.guest?.name || "", phone: q?.guest?.phone || "", email: q?.guest?.email || "", city: q?.guest?.city || "" },
      travelDate: q?.startDate || "", nights: num(q?.nights) || 0, adults: num(q?.adults) || 2, children: num(q?.children) || 0,
      hotels: [], transport: [], sightseeing: [],
      remarks: "", inclusions: [], exclusions: [],
      pricing: { currency: "INR", rate: 1, serviceChargePerPerson: "", markupPct: "", gstPct: 5, includeGst: false, givenInr: "" },
      createdAt: new Date().toISOString(),
    };
  });

  // Keep the route in sync once a brand-new package gets its id.
  useEffect(() => {
    if ((!id || id === "new") && pkg.id) navigate(`/packages/${pkg.id}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch) => setPkg((p) => ({ ...p, ...patch }));
  const setCustomer = (patch) => setPkg((p) => ({ ...p, customer: { ...p.customer, ...patch } }));
  const setPricing = (patch) => setPkg((p) => ({ ...p, pricing: { ...p.pricing, ...patch } }));

  const cityOptions = useMemo(() => {
    const s = new Set();
    (data.hotels || []).forEach((h) => h.city && s.add(h.city));
    (data.transports || []).forEach((t) => t.city && s.add(t.city));
    (data.places || []).forEach((p) => p.city && s.add(p.city));
    (data.destinations || []).forEach((d) => d.name && s.add(d.name));
    if (pkg.destination) s.add(pkg.destination);
    return [...s].sort().map((c) => ({ value: c, label: c }));
  }, [data.hotels, data.transports, data.places, data.destinations, pkg.destination]);

  /* ---- hotel line ops ---- */
  const setHotel = (lid, patch) => set({ hotels: pkg.hotels.map((h) => (h.id === lid ? recalcHotel({ ...h, ...patch }) : h)) });
  const pickHotel = (lid, hotelId) => {
    const ht = (data.hotels || []).find((x) => x.id === hotelId);
    if (!ht) return;
    const room = (ht.rooms || [])[0] || {};
    setHotel(lid, {
      custom: false, hotelId, name: ht.name, city: ht.city || "", category: ht.category || "",
      roomType: room.type || "", mealPlan: room.mealPlan || ht.mealPlan || "CP",
      price: room.price ?? "", exAdultPrice: room.exAdult ?? "", exChildPrice: room.exChild ?? "",
    });
  };
  const pickRoom = (lid, hotelId, roomType) => {
    const ht = (data.hotels || []).find((x) => x.id === hotelId);
    const room = (ht?.rooms || []).find((r) => r.type === roomType) || {};
    setHotel(lid, { roomType, mealPlan: room.mealPlan || "CP", price: room.price ?? "", exAdultPrice: room.exAdult ?? "", exChildPrice: room.exChild ?? "" });
  };

  /* ---- transport line ops ---- */
  const setTransport = (lid, patch) => set({ transport: pkg.transport.map((t) => (t.id === lid ? recalcTransport({ ...t, ...patch }) : t)) });
  const pickTransport = (lid, trId) => {
    const tr = (data.transports || []).find((x) => x.id === trId);
    if (!tr) return;
    setTransport(lid, { custom: false, transportId: trId, name: tr.name, city: tr.city || "", vehicle: tr.vehicle || "", basis: tr.basis || "Private", price: tr.price ?? "" });
  };

  /* ---- sightseeing line ops ---- */
  const setSight = (lid, patch) => set({ sightseeing: pkg.sightseeing.map((s) => (s.id === lid ? recalcSight({ ...s, ...patch }) : s)) });
  const pickSight = (lid, plId) => {
    const pl = (data.places || []).find((x) => x.id === plId);
    if (!pl) return;
    setSight(lid, { custom: false, placeId: plId, name: pl.name, city: pl.city || "", basis: pl.basis || "SIC", adultPrice: pl.adultPrice ?? "", childPrice: pl.childPrice ?? "" });
  };

  const totals = useMemo(() => packageTotals(pkg), [pkg]);

  const save = (then) => {
    if (!pkg.customer?.name?.trim()) return toast("Customer name is required", "error");
    const clean = { ...pkg, title: pkg.title || `${pkg.destination || "Trip"} Package`, updatedAt: new Date().toISOString() };
    upsert("customPackages", clean);
    toast("Package saved");
    then?.(clean);
  };

  const hotelOpts = (city) => (data.hotels || []).filter((h) => !city || h.city === city).map((h) => ({ value: h.id, label: `${h.name}${h.category ? ` · ${h.category}` : ""}` }));
  const transportOpts = (city) => (data.transports || []).filter((t) => !city || t.city === city).map((t) => ({ value: t.id, label: `${t.name}${t.price ? ` · ${money(t.price)}` : ""}` }));
  const sightOpts = (city) => (data.places || []).filter((p) => !city || p.city === city).map((p) => ({ value: p.id, label: p.name }));
  const roomOpts = (hotelId) => ((data.hotels || []).find((h) => h.id === hotelId)?.rooms || []).map((r) => ({ value: r.type, label: `${r.type}${r.price ? ` · ${money(r.price)}` : ""}` }));

  const days = num(pkg.nights) ? `${num(pkg.nights) + 1}` : "0";

  return (
    <div className="pb">
      <PageHeader title={existing ? "Edit package" : "New package"}
        subtitle={<>Ref {pkg.refId}{pkg.queryId ? <> · linked to <Link to={`/queries/${pkg.queryId}`}>query</Link></> : null}</>}>
        <Button variant="ghost" onClick={() => save(() => navigate(`/packages/${pkg.id}/view`))}>Save & view</Button>
        <Button variant="primary" icon="check" onClick={() => save()}>Save</Button>
      </PageHeader>

      {/* ---------------- Basic Info ---------------- */}
      <SectionTitle>Basic Info</SectionTitle>
      <div className="form-grid">
        <Field label="Customer name" required><Input value={pkg.customer.name} onChange={(e) => setCustomer({ name: e.target.value })} placeholder="Mrs. Jayalakshmi Kotha" /></Field>
        <Field label="Phone number"><Input value={pkg.customer.phone} onChange={(e) => setCustomer({ phone: e.target.value })} placeholder="9666698990" /></Field>
        <Field label="Email"><Input value={pkg.customer.email} onChange={(e) => setCustomer({ email: e.target.value })} /></Field>
        <Field label="Destination"><ComboSelect value={pkg.destination} onChange={(destination) => set({ destination })} options={cityOptions} placeholder="Destination…" /></Field>
        <Field label="Travel date"><DatePicker value={pkg.travelDate} onChange={(travelDate) => set({ travelDate })} /></Field>
        <Field label="No. of nights" hint={`= ${days} days`}><Select value={String(num(pkg.nights))} options={NIGHTS_OPTS} onChange={(e) => set({ nights: num(e.target.value) })} /></Field>
        <Field label="No. of adults"><Select value={String(num(pkg.adults))} options={ADULTS_OPTS} onChange={(e) => set({ adults: num(e.target.value) })} /></Field>
        <Field label="No. of children"><Select value={String(num(pkg.children))} options={CHILDREN_OPTS} onChange={(e) => set({ children: num(e.target.value) })} /></Field>
        <Field label="Status"><Select value={pkg.status} options={STATUS_OPTS} onChange={(e) => set({ status: e.target.value })} /></Field>
        <Field label="Package title" className="span-2"><Input value={pkg.title} onChange={(e) => set({ title: e.target.value })} placeholder="Your Thailand Package" /></Field>
      </div>

      {/* ---------------- Hotel Info ---------------- */}
      <SectionTitle action={<Button variant="ghost" size="sm" icon="plus" onClick={() => set({ hotels: [...pkg.hotels, blankHotel()] })}>Add More</Button>}>Hotel Info</SectionTitle>
      {!pkg.hotels.length && <p className="muted tiny">No hotels yet — “Add More” to add a stay.</p>}
      <div className="col gap-3">
        {pkg.hotels.map((h, i) => (
          <div className="pb-line" key={h.id}>
            <div className="pb-line-head"><b>Hotel {i + 1}</b><IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => set({ hotels: pkg.hotels.filter((x) => x.id !== h.id) })} /></div>
            <div className="form-grid">
              <Field label="City"><ComboSelect value={h.city} onChange={(city) => setHotel(h.id, { city })} options={cityOptions} placeholder="City…" /></Field>
              <Field label="Hotel" className="span-2">
                <PickField options={hotelOpts(h.city)} value={h.hotelId} custom={h.custom} name={h.name} placeholder="Select hotel…"
                  onPick={(v) => pickHotel(h.id, v)} onCustom={() => setHotel(h.id, { custom: true, hotelId: "", name: "" })} onName={(name) => setHotel(h.id, { name })} />
              </Field>
              <Field label="Category"><ComboSelect value={h.category} onChange={(category) => setHotel(h.id, { category })} options={STAR_CATEGORIES} placeholder="Category…" /></Field>
              <Field label="Room type">
                {h.custom ? <Input value={h.roomType} onChange={(e) => setHotel(h.id, { roomType: e.target.value })} placeholder="Superior room" />
                  : <ComboSelect value={h.roomType} onChange={(roomType) => pickRoom(h.id, h.hotelId, roomType)} options={roomOpts(h.hotelId)} placeholder="Room…" />}
              </Field>
              <Field label="Meal"><ComboSelect value={h.mealPlan} onChange={(mealPlan) => setHotel(h.id, { mealPlan })} options={MEAL_PLANS} placeholder="Meal…" /></Field>
              <Field label="Rooms"><Select value={String(num(h.rooms))} options={ROOMS_OPTS} onChange={(e) => setHotel(h.id, { rooms: num(e.target.value) })} /></Field>
              <Field label="Nights"><Select value={String(num(h.nights))} options={NIGHTS_OPTS} onChange={(e) => setHotel(h.id, { nights: num(e.target.value) })} /></Field>
              <Field label="Check-in"><DatePicker value={h.checkin} onChange={(checkin) => setHotel(h.id, { checkin })} /></Field>
              <Field label="Room price / night (₹)"><Input type="number" value={h.price} onChange={(e) => setHotel(h.id, { price: e.target.value })} /></Field>
              <Field label="EX adult (qty)"><Select value={String(num(h.exAdult))} options={QTY_OPTS} onChange={(e) => setHotel(h.id, { exAdult: num(e.target.value) })} /></Field>
              <Field label="EX child (qty)"><Select value={String(num(h.exChild))} options={QTY_OPTS} onChange={(e) => setHotel(h.id, { exChild: num(e.target.value) })} /></Field>
            </div>
            <div className="pb-line-foot">Line total: <b>{money(h.cost)}</b> <span className="tiny">({num(h.nights)}N × {num(h.rooms)} room)</span></div>
          </div>
        ))}
      </div>

      {/* ---------------- Transport Info ---------------- */}
      <SectionTitle action={<Button variant="ghost" size="sm" icon="plus" onClick={() => set({ transport: [...pkg.transport, blankTransport()] })}>Add More</Button>}>Transport Info</SectionTitle>
      {!pkg.transport.length && <p className="muted tiny">No transport yet — “Add More” to add a transfer.</p>}
      <div className="col gap-3">
        {pkg.transport.map((t, i) => (
          <div className="pb-line" key={t.id}>
            <div className="pb-line-head"><b>Transport {i + 1}</b><IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => set({ transport: pkg.transport.filter((x) => x.id !== t.id) })} /></div>
            <div className="form-grid">
              <Field label="City"><ComboSelect value={t.city} onChange={(city) => setTransport(t.id, { city })} options={cityOptions} placeholder="City…" /></Field>
              <Field label="Transport" className="span-2">
                <PickField options={transportOpts(t.city)} value={t.transportId} custom={t.custom} name={t.name} placeholder="Select transport…"
                  onPick={(v) => pickTransport(t.id, v)} onCustom={() => setTransport(t.id, { custom: true, transportId: "", name: "" })} onName={(name) => setTransport(t.id, { name })} />
              </Field>
              <Field label="Basis"><Select value={t.basis} options={TRANSFER_BASIS} onChange={(e) => setTransport(t.id, { basis: e.target.value })} /></Field>
              <Field label="No. of person"><Select value={String(num(t.persons))} options={PERSONS_OPTS} onChange={(e) => setTransport(t.id, { persons: num(e.target.value) })} /></Field>
              <Field label="Date"><DatePicker value={t.date} onChange={(date) => setTransport(t.id, { date })} /></Field>
              <Field label="Price (₹)"><Input type="number" value={t.price} onChange={(e) => setTransport(t.id, { price: e.target.value })} /></Field>
            </div>
            <div className="pb-line-foot">Line total: <b>{money(t.cost)}</b></div>
          </div>
        ))}
      </div>

      {/* ---------------- Sightseeing Info ---------------- */}
      <SectionTitle action={<Button variant="ghost" size="sm" icon="plus" onClick={() => set({ sightseeing: [...pkg.sightseeing, blankSight()] })}>Add More</Button>}>Sightseeing Info</SectionTitle>
      {!pkg.sightseeing.length && <p className="muted tiny">No sightseeing yet — “Add More” to add an activity.</p>}
      <div className="col gap-3">
        {pkg.sightseeing.map((s, i) => (
          <div className="pb-line" key={s.id}>
            <div className="pb-line-head"><b>Sightseeing {i + 1}</b><IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => set({ sightseeing: pkg.sightseeing.filter((x) => x.id !== s.id) })} /></div>
            <div className="form-grid">
              <Field label="City"><ComboSelect value={s.city} onChange={(city) => setSight(s.id, { city })} options={cityOptions} placeholder="City…" /></Field>
              <Field label="Sightseeing" className="span-2">
                <PickField options={sightOpts(s.city)} value={s.placeId} custom={s.custom} name={s.name} placeholder="Select sightseeing…"
                  onPick={(v) => pickSight(s.id, v)} onCustom={() => setSight(s.id, { custom: true, placeId: "", name: "" })} onName={(name) => setSight(s.id, { name })} />
              </Field>
              <Field label="Basis"><Select value={s.basis} options={TRANSFER_BASIS} onChange={(e) => setSight(s.id, { basis: e.target.value })} /></Field>
              <Field label="No. of adult"><Select value={String(num(s.adults))} options={CHILDREN_OPTS} onChange={(e) => setSight(s.id, { adults: num(e.target.value) })} /></Field>
              <Field label="No. of child"><Select value={String(num(s.children))} options={CHILDREN_OPTS} onChange={(e) => setSight(s.id, { children: num(e.target.value) })} /></Field>
              <Field label="Date"><DatePicker value={s.date} onChange={(date) => setSight(s.id, { date })} /></Field>
              <Field label="Adult price (₹)"><Input type="number" value={s.adultPrice} onChange={(e) => setSight(s.id, { adultPrice: e.target.value })} /></Field>
              <Field label="Child price (₹)"><Input type="number" value={s.childPrice} onChange={(e) => setSight(s.id, { childPrice: e.target.value })} /></Field>
            </div>
            <div className="pb-line-foot">Line total: <b>{money(s.cost)}</b></div>
          </div>
        ))}
      </div>

      {/* ---------------- Remarks ---------------- */}
      <SectionTitle>Remarks & Notes</SectionTitle>
      <div className="form-grid">
        <Field label="Remarks" hint="Free text — appears in the WhatsApp message" className="span-2"><Textarea value={pkg.remarks} onChange={(e) => set({ remarks: e.target.value })} placeholder="All transfers on private basis and sightseeing on SIC basis." /></Field>
        <Field label="Extra inclusions"><StringList value={pkg.inclusions} onChange={(inclusions) => set({ inclusions })} addLabel="Add inclusion" /></Field>
        <Field label="Exclusions"><StringList value={pkg.exclusions} onChange={(exclusions) => set({ exclusions })} addLabel="Add exclusion" /></Field>
      </div>

      {/* ---------------- Pricing (INR) ---------------- */}
      <SectionTitle>Pricing</SectionTitle>
      <div className="pb-pricing">
        <div className="form-grid grow">
          <Field label="Service charge / person (₹)"><Input type="number" value={pkg.pricing.serviceChargePerPerson} onChange={(e) => setPricing({ serviceChargePerPerson: e.target.value })} /></Field>
          <Field label="Markup %" hint="Optional"><Input type="number" value={pkg.pricing.markupPct} onChange={(e) => setPricing({ markupPct: e.target.value })} /></Field>
          <Field label="GST">
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <Toggle checked={pkg.pricing.includeGst} onChange={(includeGst) => setPricing({ includeGst })} label="Include" />
              {pkg.pricing.includeGst && <Input type="number" style={{ width: 70 }} value={pkg.pricing.gstPct} onChange={(e) => setPricing({ gstPct: e.target.value })} />}
            </div>
          </Field>
          <Field label="Override total (₹)" hint="Optional — replaces the computed grand total"><Input type="number" value={pkg.pricing.givenInr} onChange={(e) => setPricing({ givenInr: e.target.value })} /></Field>
        </div>

        <div className="pb-total">
          <div className="pb-total-row"><span>Hotels</span><b>{money(totals.byKind.hotels)}</b></div>
          <div className="pb-total-row"><span>Transport</span><b>{money(totals.byKind.transport)}</b></div>
          <div className="pb-total-row"><span>Sightseeing</span><b>{money(totals.byKind.sightseeing)}</b></div>
          <div className="pb-total-row total"><span>Subtotal</span><b>{money(totals.totalForeign)}</b></div>
          {!!num(pkg.pricing.markupPct) && <div className="pb-total-row"><span>+ Markup {pkg.pricing.markupPct}%</span><b>{money(totals.markup)}</b></div>}
          {!!totals.serviceTotal && <div className="pb-total-row"><span>+ Service ({totals.pax} pax)</span><b>{money(totals.serviceTotal)}</b></div>}
          {!!totals.gst && <div className="pb-total-row"><span>+ GST {pkg.pricing.gstPct}%</span><b>{money(totals.gst)}</b></div>}
          <div className="pb-total-row grand"><span>Grand total</span><b>{money(totals.grandInr)}</b></div>
          <div className="pb-total-row per"><span>Per person</span><Badge tone="success">{money(totals.perPersonInr)}</Badge></div>
        </div>
      </div>

      <div className="row gap-2" style={{ justifyContent: "flex-end", margin: "var(--sp-6) 0" }}>
        <Button variant="secondary" icon="eye" onClick={() => save(() => navigate(`/packages/${pkg.id}/view`))}>Save & view / WhatsApp</Button>
        <Button variant="primary" icon="check" onClick={() => save()}>Save package</Button>
      </div>

      <style>{`
        .pb .builder-sec-head { display:flex; align-items:center; gap:12px; margin:var(--sp-7) 0 var(--sp-4); }
        .pb .builder-sec-line { height:1px; background:var(--line); flex:1; }
        .pb .builder-sec-title { font-size:15px; font-weight:700; letter-spacing:.02em; white-space:nowrap; margin:0; }
        .pb .pb-line { border:1px solid var(--line); border-radius:14px; padding:14px 16px; background:var(--surface, #fff); }
        .pb .pb-line-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .pb .pb-line-foot { margin-top:10px; padding-top:10px; border-top:1px dashed var(--line); text-align:right; font-size:13px; }
        .pb .pb-pricing { display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start; }
        .pb .pb-pricing .grow { flex:1; min-width:320px; }
        .pb .pb-total { width:300px; border:1px solid var(--line); border-radius:14px; padding:16px; background:var(--surface, #fff); }
        .pb .pb-total-row { display:flex; justify-content:space-between; align-items:center; padding:5px 0; font-size:13px; }
        .pb .pb-total-row.total { border-top:1px solid var(--line); margin-top:6px; padding-top:10px; font-size:14px; }
        .pb .pb-total-row.grand { border-top:2px solid var(--ink, #111); margin-top:8px; padding-top:10px; font-size:15px; }
        .pb .pb-total-row.per { padding-top:8px; }
      `}</style>
    </div>
  );
}
