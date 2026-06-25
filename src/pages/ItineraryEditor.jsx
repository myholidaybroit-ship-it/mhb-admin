import { useState } from "react";
import { useStore } from "../lib/store.jsx";
import {
  Drawer, Button, Field, Input, Textarea, Select, Tabs, Repeater, StringList,
  ImagePicker, ImageGrid, Toggle, useToast,
} from "../ui/kit.jsx";
import PdfPreview from "./PdfPreview.jsx";
import { paxLabel as crmPaxLabel } from "../lib/crm.js";

// "25 June, 2024" — the format the trip-facts table shows.
const longDate = (iso) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(+d)) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};
const shortDate = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const ITEM_TYPES = [{ value: "transfer", label: "Transfer / Note" }, { value: "activity", label: "Activity" }];

// A single day item — manual entry only. (Hotel / transport / sightseeing
// libraries were removed; the itinerary builder is now just trip + days + PDF.)
function DayItemEditor({ item, update }) {
  const isActivity = item.type === "activity";
  return (
    <div className="col gap-3">
      <Field label="Type">
        <Select value={item.type} options={ITEM_TYPES} onChange={(e) => update({ type: e.target.value })} />
      </Field>
      {isActivity ? (
        <div className="form-grid">
          <Field label="Title" className="span-2"><Input value={item.title || ""} onChange={(e) => update({ title: e.target.value })} placeholder="Nusa Penida day tour" /></Field>
          <Field label="Duration"><Input value={item.duration || ""} onChange={(e) => update({ duration: e.target.value })} placeholder="8 Hrs" /></Field>
          <div className="span-2"><ImagePicker label="Main image" value={item.image || ""} onChange={(v) => update({ image: v })} hint="Large hero image for this activity" /></div>
          <div className="span-2"><ImageGrid label="Extra photos (gallery)" value={item.gallery || []} onChange={(v) => update({ gallery: v })} /></div>
          <Field label="Description" className="span-2"><Textarea value={item.description || ""} onChange={(e) => update({ description: e.target.value })} /></Field>
          <Field label="Note" className="span-2"><Input value={item.note || ""} onChange={(e) => update({ note: e.target.value })} /></Field>
        </div>
      ) : (
        <div className="form-grid">
          <Field label="Title" className="span-2"><Input value={item.title || ""} onChange={(e) => update({ title: e.target.value })} placeholder="Transfer to Kuta hotel" /></Field>
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

  const save = () => {
    if (!it.title?.trim()) return toast("Title is required", "error");
    upsert("itineraries", it);
    toast("Itinerary saved");
  };
  const saveClose = () => { save(); onClose(); };

  const segmentOptions = (it.segments || []).map((sg) => sg.name).filter(Boolean);

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
              <Field label="Traveller name" hint="Pick a traveller from your queries, or type a name">
                <div className="col gap-2">
                  <Select value="" placeholder="Pick from queries…" onChange={(e) => {
                    const q = (data.tripQueries || []).find((x) => x.id === e.target.value);
                    if (!q) return;
                    const start = q.startDate ? new Date(q.startDate) : null;
                    const end = start && q.nights ? new Date(+start + q.nights * 86400000) : null;
                    set({
                      clientName: q.guest?.name || "",
                      // fill the trip facts only where this itinerary is still blank
                      destination: it.destination || q.destination || "",
                      startDate: it.startDate || longDate(q.startDate),
                      duration: it.duration || (q.nights ? `${q.nights + 1} Days` : ""),
                      dateRangeLabel: it.dateRangeLabel || (start && end ? `${shortDate(start)} to ${shortDate(end)}` : ""),
                      paxLabel: it.paxLabel || crmPaxLabel(q),
                      pax: it.pax || (Number(q.adults) || 0) + (Number(q.children) || 0),
                    });
                  }}
                    options={(data.tripQueries || []).map((q) => ({
                      value: q.id,
                      label: `${q.guest?.name || "—"} · ${q.destination || "?"}${q.startDate ? ` · ${shortDate(new Date(q.startDate))}` : ""}`,
                    }))} />
                  <Input value={it.clientName} onChange={(e) => set({ clientName: e.target.value })} placeholder="Sushil" />
                </div>
              </Field>
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
            <Field label="Greeting message" hint="Intro letter shown under 'Dear {traveller name}'">
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
                    blank={{ type: "activity" }}
                    title={(j, item) => item.title || (item.type === "transfer" ? `Transfer ${j + 1}` : `Activity ${j + 1}`)}
                    addLabel="Add item"
                    renderItem={(item, ui) => <DayItemEditor item={item} update={ui} />}
                  />
                </Field>
              </div>
            )} />
        )}

        {tab === "content" && (
          <div className="col gap-6">
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Notes</div>
              <StringList value={it.notes || []} onChange={(v) => set({ notes: v })} addLabel="Add note" />
            </div>
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Inclusions</div>
              <StringList value={it.inclusions || []} onChange={(v) => set({ inclusions: v })} addLabel="Add inclusion" />
            </div>
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Exclusions</div>
              <StringList value={it.exclusions || []} onChange={(v) => set({ exclusions: v })} addLabel="Add exclusion" />
            </div>
            <div className="card-soft">
              <div className="field-label" style={{ marginBottom: 8 }}>Terms &amp; Conditions</div>
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

        {tab === "preview" && <PdfPreview itinerary={it} places={[]} settings={data.settings} />}
      </div>
    </Drawer>
  );
}
