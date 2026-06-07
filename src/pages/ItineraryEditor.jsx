import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import {
  Drawer, Button, Field, Input, Textarea, Select, Tabs, Repeater, StringList,
  ImagePicker, IconButton, Badge, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import PdfPreview from "./PdfPreview.jsx";

const ITEM_TYPES = [{ value: "transfer", label: "Transfer / Note" }, { value: "activity", label: "Activity / Place" }];

function DayItemEditor({ item, update, places }) {
  const isActivity = item.type === "activity";
  const place = isActivity && item.placeId ? places.find((p) => p.id === item.placeId) : null;
  return (
    <div className="col gap-3">
      <div className="form-grid">
        <Field label="Type">
          <Select value={item.type} options={ITEM_TYPES} onChange={(e) => update({ type: e.target.value })} />
        </Field>
        {isActivity && (
          <Field label="From library" hint="Pick a place to auto-fill, or leave blank for custom">
            <Select value={item.placeId || ""} placeholder="— Custom —" options={places.map((p) => ({ value: p.id, label: p.name }))} onChange={(e) => update({ placeId: e.target.value || null })} />
          </Field>
        )}
      </div>
      {isActivity ? (
        <div className="col gap-3">
          {place ? (
            <div className="row gap-3" style={{ alignItems: "center" }}>
              <img className="cell-thumb" src={place.image} alt="" />
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{place.name}</div><div className="tiny truncate" style={{ maxWidth: 360 }}>{place.description}</div></div>
            </div>
          ) : (
            <div className="form-grid">
              <Field label="Title" className="span-2"><Input value={item.title || ""} onChange={(e) => update({ title: e.target.value })} /></Field>
              <Field label="Duration"><Input value={item.duration || ""} onChange={(e) => update({ duration: e.target.value })} /></Field>
              <div className="span-2"><ImagePicker label="Main image" value={item.image || ""} onChange={(v) => update({ image: v })} hint="Large hero image for this activity" /></div>
              <div className="span-2"><ImageGrid label="Extra photos (gallery)" value={item.gallery || []} onChange={(v) => update({ gallery: v })} /></div>
              <Field label="Description" className="span-2"><Textarea value={item.description || ""} onChange={(e) => update({ description: e.target.value })} /></Field>
              <Field label="Note" className="span-2"><Input value={item.note || ""} onChange={(e) => update({ note: e.target.value })} /></Field>
            </div>
          )}
        </div>
      ) : (
        <div className="form-grid">
          <Field label="Title" className="span-2"><Input value={item.title || ""} onChange={(e) => update({ title: e.target.value })} placeholder="Transfers to Kuta Hotel (Private Transfers)" /></Field>
          <Field label="Duration"><Input value={item.duration || ""} onChange={(e) => update({ duration: e.target.value })} placeholder="6 Hrs" /></Field>
          <Field label="Note"><Input value={item.note || ""} onChange={(e) => update({ note: e.target.value })} placeholder="Pick up at 02:00 PM" /></Field>
        </div>
      )}
    </div>
  );
}

export default function ItineraryEditor({ value, onClose }) {
  const { data, upsert } = useStore();
  const toast = useToast();
  const [it, setIt] = useState(() => structuredClone(value));
  const [tab, setTab] = useState("trip");
  const set = (patch) => setIt((s) => ({ ...s, ...patch }));
  const places = data.places;
  const blocks = data.blocks;

  const save = () => {
    if (!it.title?.trim()) return toast("Title is required", "error");
    upsert("itineraries", it);
    toast("Itinerary saved");
  };
  const saveClose = () => { save(); onClose(); };

  const segmentOptions = (it.segments || []).map((sg) => sg.name).filter(Boolean);

  // insert a content block into a list/section field
  const insertBlock = (target) => (blockId) => {
    const b = blocks.find((x) => x.id === blockId);
    if (!b) return;
    if (target === "terms") {
      const secs = b.kind === "sections" ? b.sections : (b.items || []).map((x) => ({ heading: "", body: x }));
      set({ terms: [...(it.terms || []), ...secs] });
    } else {
      const items = b.kind === "list" ? b.items : (b.sections || []).map((sx) => `${sx.heading}: ${sx.body}`);
      set({ [target]: [...(it[target] || []), ...items] });
    }
    toast("Block inserted");
  };

  const BlockInserter = ({ target, kind }) => {
    const opts = blocks.filter((b) => kind ? true : true);
    return (
      <div className="row gap-2" style={{ marginBottom: 8 }}>
        <Icon name="copy" size={14} />
        <span className="tiny">Insert from library:</span>
        <select className="select" style={{ width: 240 }} value="" onChange={(e) => e.target.value && insertBlock(target)(e.target.value)}>
          <option value="">Choose a content block…</option>
          {opts.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>
    );
  };

  return (
    <Drawer wide title={it.title || "Itinerary"} subtitle={`${it.clientName || "—"} · ${it.dateRangeLabel || ""}`} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button variant="secondary" icon="check" onClick={save}>Save</Button>
        <Button variant="primary" icon="check" onClick={saveClose}>Save &amp; close</Button>
      </>}>
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "trip", label: "Trip" },
        { value: "days", label: `Days (${(it.days || []).length})` },
        { value: "stays", label: `Stays (${(it.accommodations || []).length})` },
        { value: "transport", label: `Transport (${(it.transport || []).length})` },
        { value: "content", label: "Notes & Terms" },
        { value: "preview", label: "PDF Preview" },
      ]} />

      <div style={{ marginTop: "var(--sp-5)" }}>
        {tab === "trip" && (
          <div className="col gap-5">
            <ImagePicker label="Hero / cover image" value={it.heroImage} onChange={(v) => set({ heroImage: v })} hint="Wide landscape photo for the cover" />
            <div className="form-grid">
              <Field label="Itinerary title" required className="span-2"><Input value={it.title} onChange={(e) => set({ title: e.target.value })} placeholder="Magnificent Nusa Penida & Ubud" /></Field>
              <Field label="Destination"><Input value={it.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="Bali" /></Field>
              <Field label="Status"><Select value={it.status} options={["Draft", "Final"]} onChange={(e) => set({ status: e.target.value })} /></Field>
              <Field label="Client name"><Input value={it.clientName} onChange={(e) => set({ clientName: e.target.value })} placeholder="Sushil" /></Field>
              <Field label="Trip ID"><Input value={it.tripId || ""} onChange={(e) => set({ tripId: e.target.value })} placeholder="56802" /></Field>
              <Field label="Start date" hint="Shown on the trip-facts table"><Input value={it.startDate || ""} onChange={(e) => set({ startDate: e.target.value })} placeholder="25 June, 2024" /></Field>
              <Field label="Duration"><Input value={it.duration || ""} onChange={(e) => set({ duration: e.target.value })} placeholder="6 Days" /></Field>
              <Field label="Date range label" hint="Shown on the cover"><Input value={it.dateRangeLabel} onChange={(e) => set({ dateRangeLabel: e.target.value })} placeholder="Jun 25 to Jun 30" /></Field>
              <Field label="Travellers (PAX label)" hint="e.g. 2 Adults, 1 Child (5y)"><Input value={it.paxLabel || ""} onChange={(e) => set({ paxLabel: e.target.value })} placeholder="2 Adults" /></Field>
              <Field label="Number of people" hint="Numeric fallback"><Input type="number" value={it.pax} onChange={(e) => set({ pax: parseInt(e.target.value) || 0 })} /></Field>
              <Field label="Price"><Input value={it.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })} placeholder="68,500" /></Field>
              <Field label="Price unit"><Input value={it.priceUnit} onChange={(e) => set({ priceUnit: e.target.value })} placeholder="per couple" /></Field>
            </div>
            <Toggle checked={it.gstIncluded} onChange={(v) => set({ gstIncluded: v })} label="Price includes GST" />
            <Field label="Greeting message" hint="Intro letter shown under 'Dear {client}'">
              <Textarea value={it.greeting || ""} onChange={(e) => set({ greeting: e.target.value })} rows={3} placeholder="Our sales team has put together this quote…" />
            </Field>
            <Field label="Price breakdown" hint="Per-person / per-child tiers shown under the total">
              <Repeater value={it.priceTiers || []} onChange={(v) => set({ priceTiers: v })} blank={{ amount: "", label: "" }}
                title={(i, t) => t.label || `Tier ${i + 1}`} addLabel="Add price tier"
                renderItem={(t, u) => (
                  <div className="form-grid">
                    <Field label="Amount"><Input value={t.amount} onChange={(e) => u({ amount: e.target.value })} placeholder="34,250" /></Field>
                    <Field label="Label"><Input value={t.label} onChange={(e) => u({ label: e.target.value })} placeholder="Per Person on Double Sharing x 2 Pax" /></Field>
                  </div>
                )} />
            </Field>
            <Field label="Trust badges"><StringList value={it.trustBadges || []} onChange={(v) => set({ trustBadges: v })} addLabel="Add badge" /></Field>
            <Field label="Segments" hint="Group days under named segments (e.g. Kuta + Nusa Penida)">
              <Repeater value={it.segments || []} onChange={(v) => set({ segments: v })} blank={{ name: "", dateLabel: "" }}
                title={(i, sg) => sg.name || `Segment ${i + 1}`} addLabel="Add segment"
                renderItem={(sg, u) => (
                  <div className="form-grid">
                    <Field label="Name"><Input value={sg.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                    <Field label="Dates"><Input value={sg.dateLabel} onChange={(e) => u({ dateLabel: e.target.value })} /></Field>
                  </div>
                )} />
            </Field>
          </div>
        )}

        {tab === "days" && (
          <Repeater value={it.days || []} onChange={(v) => set({ days: v })}
            blank={() => ({ id: "d" + Math.random().toString(36).slice(2, 6), dateLabel: "", segment: segmentOptions[0] || "", items: [] })}
            title={(i, d) => `${d.dateLabel || "Day " + (i + 1)}`} addLabel="Add day"
            renderItem={(d, u) => (
              <div className="col gap-3">
                <div className="form-grid">
                  <Field label="Date label"><Input value={d.dateLabel} onChange={(e) => u({ dateLabel: e.target.value })} placeholder="Jun 25" /></Field>
                  <Field label="Segment">
                    <Select value={d.segment || ""} placeholder="— none —" options={segmentOptions} onChange={(e) => u({ segment: e.target.value })} />
                  </Field>
                </div>
                <Field label="Items (transfers & activities)">
                  <Repeater value={d.items || []} onChange={(items) => u({ items })}
                    blank={{ type: "activity", placeId: null }}
                    title={(j, item) => {
                      if (item.type === "transfer") return item.title || `Transfer ${j + 1}`;
                      const p = item.placeId ? places.find((x) => x.id === item.placeId) : null;
                      return p?.name || item.title || `Activity ${j + 1}`;
                    }}
                    addLabel="Add item"
                    renderItem={(item, ui) => <DayItemEditor item={item} update={ui} places={places} />}
                  />
                </Field>
              </div>
            )} />
        )}

        {tab === "stays" && (
          <Repeater value={it.accommodations || []} onChange={(v) => set({ accommodations: v })}
            blank={() => ({ id: "ac" + Math.random().toString(36).slice(2, 6), name: "", location: "", rating: 4, score: "", checkin: "2:00 PM", checkout: "12:00 PM", dateLabel: "", images: [], rooms: [{ type: "Deluxe Room", refundable: false, breakfast: true }] })}
            title={(i, a) => a.name || `Stay ${i + 1}`} addLabel="Add stay"
            renderItem={(a, u) => (
              <div className="col gap-3">
                <div className="row gap-2" style={{ marginBottom: 4 }}>
                  <Icon name="copy" size={14} />
                  <span className="tiny">Fill from hotel library:</span>
                  <select className="select" style={{ width: 260 }} value="" onChange={(e) => {
                    const h = data.hotels.find((x) => x.id === e.target.value);
                    if (h) u({ hotelId: h.id, name: h.name, location: h.location, rating: h.rating, score: h.score, checkin: h.checkin, checkout: h.checkout, mealPlan: h.mealPlan || "Breakfast", images: [...h.images], rooms: structuredClone(h.rooms) });
                  }}>
                    <option value="">Choose a hotel…</option>
                    {data.hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-grid">
                  <Field label="Hotel name" className="span-2"><Input value={a.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                  <Field label="Nights label" className="span-2" hint="e.g. 1st 2nd 3rd Nights at Kuta, Bali"><Input value={a.nightsLabel || ""} onChange={(e) => u({ nightsLabel: e.target.value })} placeholder="1st 2nd 3rd Nights at Kuta, Bali" /></Field>
                  <Field label="Stay dates"><Input value={a.dateLabel} onChange={(e) => u({ dateLabel: e.target.value })} placeholder="Jun 25 - Jun 28" /></Field>
                  <Field label="Location"><Input value={a.location} onChange={(e) => u({ location: e.target.value })} /></Field>
                  <Field label="Rating"><Input type="number" min="0" max="5" value={a.rating} onChange={(e) => u({ rating: parseInt(e.target.value) || 0 })} /></Field>
                  <Field label="Score"><Input value={a.score} onChange={(e) => u({ score: e.target.value })} /></Field>
                  <Field label="Meal plan"><Input value={a.mealPlan || ""} onChange={(e) => u({ mealPlan: e.target.value })} placeholder="Breakfast" /></Field>
                  <Field label="Check-in"><Input value={a.checkin} onChange={(e) => u({ checkin: e.target.value })} /></Field>
                  <Field label="Check-out"><Input value={a.checkout} onChange={(e) => u({ checkout: e.target.value })} /></Field>
                </div>
                <ImageGridInline value={a.images} onChange={(images) => u({ images })} />
                <Field label="Rooms">
                  <Repeater value={a.rooms || []} onChange={(rooms) => u({ rooms })} blank={{ type: "", occupancy: "2 Pax", refundable: false, breakfast: true }}
                    title={(i, r) => r.type || `Room ${i + 1}`} addLabel="Add room"
                    renderItem={(r, ur) => (
                      <div className="col gap-2">
                        <div className="form-grid">
                          <Field label="Room type"><Input value={r.type} onChange={(e) => ur({ type: e.target.value })} /></Field>
                          <Field label="Occupancy"><Input value={r.occupancy || ""} onChange={(e) => ur({ occupancy: e.target.value })} placeholder="2 Pax" /></Field>
                        </div>
                        <div className="row gap-4">
                          <Toggle checked={r.refundable} onChange={(v) => ur({ refundable: v })} label="Refundable" />
                          <Toggle checked={r.breakfast} onChange={(v) => ur({ breakfast: v })} label="Breakfast" />
                        </div>
                      </div>
                    )} />
                </Field>
              </div>
            )} />
        )}

        {tab === "transport" && (
          <div className="col gap-5">
            <p className="muted" style={{ fontSize: 13 }}>
              Group transfers, cabs and tickets by vehicle or ticket type (e.g. “1 - 04/6 Seater (Avanza) - 10 Hr”, “2 - Adult Ticket”). Each line below it is a transfer or sightseeing item.
            </p>
            <Repeater value={it.transport || []} onChange={(v) => set({ transport: v })} blank={{ vehicle: "", items: [] }}
              title={(i, g) => g.vehicle || `Vehicle / ticket ${i + 1}`} addLabel="Add vehicle / ticket group"
              renderItem={(g, u) => (
                <div className="col gap-3">
                  <Field label="Vehicle / ticket"><Input value={g.vehicle} onChange={(e) => u({ vehicle: e.target.value })} placeholder="1 - 04/6 Seater (Avanza / Xenia) - 10 Hr" /></Field>
                  <Field label="Items / transfers"><StringList value={g.items || []} onChange={(items) => u({ items })} addLabel="Add item" placeholder="Cab for Ubud sightseeing" /></Field>
                </div>
              )} />
            <Field label="Visa / extra line" hint="Optional line shown below the transport groups">
              <Input value={it.visa || ""} onChange={(e) => set({ visa: e.target.value })} placeholder="Indonesia visa-on-arrival assistance" />
            </Field>
          </div>
        )}

        {tab === "content" && (
          <div className="col gap-6">
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Notes</div>
              <BlockInserter target="notes" />
              <StringList value={it.notes || []} onChange={(v) => set({ notes: v })} addLabel="Add note" />
            </div>
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Inclusions</div>
              <BlockInserter target="inclusions" />
              <StringList value={it.inclusions || []} onChange={(v) => set({ inclusions: v })} addLabel="Add inclusion" />
            </div>
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Exclusions</div>
              <BlockInserter target="exclusions" />
              <StringList value={it.exclusions || []} onChange={(v) => set({ exclusions: v })} addLabel="Add exclusion" />
            </div>
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Terms &amp; Conditions</div>
              <BlockInserter target="terms" />
              <Repeater value={it.terms || []} onChange={(v) => set({ terms: v })} blank={{ heading: "", body: "" }}
                title={(i, t) => t.heading || `Term ${i + 1}`} addLabel="Add term"
                renderItem={(t, u) => (
                  <div className="col gap-2">
                    <Field label="Heading"><Input value={t.heading} onChange={(e) => u({ heading: e.target.value })} /></Field>
                    <Field label="Body"><Textarea value={t.body} onChange={(e) => u({ body: e.target.value })} /></Field>
                  </div>
                )} />
            </div>
          </div>
        )}

        {tab === "preview" && <PdfPreview itinerary={it} places={places} settings={data.settings} />}
      </div>
    </Drawer>
  );
}

// small inline image grid (kit's ImageGrid imported lazily to avoid prop churn)
import { ImageGrid, Toggle } from "../ui/kit.jsx";
function ImageGridInline({ value, onChange }) {
  return <ImageGrid label="Photos" value={value || []} onChange={onChange} />;
}
