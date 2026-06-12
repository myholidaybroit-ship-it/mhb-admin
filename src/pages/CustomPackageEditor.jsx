// Custom package builder — a fully personalised trip plan for ONE traveller
// (never shown on the website). Build the trip day by day, then send the whole
// package to their WhatsApp in one click.
//
// Route: /packages/new and /packages/:id

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore, uid } from "../lib/store.jsx";
import { admin } from "../lib/api.js";
import {
  PageHeader, Field, Input, Textarea, Button, IconButton, Badge, Stepper,
  StringList, SearchSelect, DatePicker, useToast, EmptyState, ConfirmDialog,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import ShareActions from "../ui/ShareActions.jsx";
import { packageShareText, paxLabel, num, fmtDate, fmtDateTime } from "../lib/crm.js";

const blankDay = () => ({ id: uid("day"), title: "", activities: [], stay: "", meals: "" });

const blankPackage = () => ({
  id: uid("cp"),
  title: "",
  traveller: { name: "", phone: "", email: "", city: "" },
  destination: "", startDate: "", nights: 4, adults: 2, children: 0,
  days: [blankDay()],
  transport: "", inclusions: [], exclusions: [],
  price: "", priceNote: "all-inclusive", advance: "",
  notes: "",
  status: "draft",
});

const SECTIONS = [
  { n: 1, title: "Traveller", icon: "user" },
  { n: 2, title: "Trip basics", icon: "map" },
  { n: 3, title: "Day-by-day plan", icon: "calendar" },
  { n: 4, title: "Transport & what's included", icon: "briefcase" },
  { n: 5, title: "Pricing & final touches", icon: "tag" },
];

export default function CustomPackageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, upsert, remove } = useStore();
  const toast = useToast();
  const isNew = !id;

  const existing = id ? (data.customPackages || []).find((x) => x.id === id) : null;
  const [p, setP] = useState(() => existing || blankPackage());
  const [travellerMode, setTravellerMode] = useState("manual");
  const [users, setUsers] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // If the route id resolves later (store refresh), sync once.
  useEffect(() => { if (existing && existing.id !== p.id) setP(existing); }, [existing]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => setP((s) => ({ ...s, ...patch }));
  const setTrav = (patch) => setP((s) => ({ ...s, traveller: { ...s.traveller, ...patch } }));
  const setDay = (dayId, patch) => set({ days: p.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) });

  useEffect(() => {
    let alive = true;
    admin.users().then((r) => { if (alive) setUsers(r?.data || []); }).catch(() => { if (alive) setUsers([]); });
    return () => { alive = false; };
  }, []);

  if (id && !existing) {
    return (
      <EmptyState icon="sparkle" title="Package not found" message="It may have been deleted."
        action={<Link to="/packages"><Button variant="secondary">Back to packages</Button></Link>} />
    );
  }

  const destOptions = [...new Set([...(data.destinations || []).map((d) => d.name), ...(data.weekends || []).map((w) => w.name)])].filter(Boolean);
  const userOptions = (users || []).map((u) => ({ value: u._id || u.id, label: u.name || u.email, hint: u.phone || u.email || "" }));
  const pickUser = (uid_) => {
    const u = (users || []).find((x) => (x._id || x.id) === uid_);
    if (u) setTrav({ name: u.name || "", phone: u.phone || "", email: u.email || "", city: u.city || "" });
  };

  // ── Reuse: pull a built itinerary's days straight into this package ──
  const importItinerary = (itId) => {
    const it = (data.itineraries || []).find((x) => x.id === itId);
    if (!it) return;
    const placeName = (pid) => (data.places || []).find((pl) => pl.id === pid)?.name || "";
    const days = (it.days || []).map((d) => ({
      id: uid("day"),
      title: d.segment || d.dateLabel || "",
      activities: (d.items || []).map((x) => {
        const label = x.type === "activity" && x.placeId ? placeName(x.placeId) : (x.title || "");
        return [label, x.duration && `(${x.duration})`].filter(Boolean).join(" ");
      }).filter(Boolean),
      stay: "", meals: "",
    }));
    if (!days.length) return toast("That itinerary has no days yet", "error");
    set({
      days,
      title: p.title || it.title || "",
      destination: p.destination || it.destination || "",
    });
    toast(`Imported ${days.length} day(s) from “${it.title || itId}” — personalise away`);
  };

  // Standard inclusion/exclusion lists from the website content (single source).
  const stdInclusions = data.content?.inclusions || [];
  const stdExclusions = data.content?.exclusions || [];
  const mergeList = (key, std) => set({ [key]: [...new Set([...(p[key] || []), ...std])] });

  const queryGuests = useMemo(() => {
    const seen = new Set();
    return (data.tripQueries || []).map((q) => q.guest).filter((g) => {
      if (!g?.name || seen.has(g.name)) return false;
      seen.add(g.name);
      return true;
    }).map((g) => ({ value: g.name, label: g.name, hint: g.phone || g.email || "" }));
  }, [data.tripQueries]);
  const pickGuest = (name) => {
    const g = (data.tripQueries || []).map((q) => q.guest).find((x) => x?.name === name);
    if (g) setTrav({ name: g.name || "", phone: g.phone || "", email: g.email || "", city: g.city || "" });
  };

  const validate = () => {
    if (!p.traveller.name.trim()) { toast("Traveller name is required", "error"); return false; }
    if (!p.destination.trim()) { toast("Destination is required", "error"); return false; }
    return true;
  };

  const persist = (extra = {}) => {
    const item = { ...p, ...extra, createdAt: p.createdAt || new Date().toISOString() };
    upsert("customPackages", item);
    setP(item);
    return item;
  };

  const save = () => {
    if (!validate()) return;
    persist();
    toast("Package saved");
    if (isNew) navigate(`/packages/${p.id}`, { replace: true });
  };

  const preview = packageShareText(p);
  const mailSubject = `${p.title || `Your ${p.destination || "trip"} plan`} — MyHolidayBro ✈️`;

  // Sharing on WhatsApp/Mail saves the package and marks it sent; Copy just saves.
  const onShared = (channel) => {
    if (!validate()) return;
    const sent = channel === "whatsapp" || channel === "mail";
    const item = persist(sent ? { status: "sent", sentAt: new Date().toISOString() } : {});
    if (sent) toast(`Package marked sent (${channel === "whatsapp" ? "WhatsApp" : "email"})`);
    if (isNew) navigate(`/packages/${item.id}`, { replace: true });
  };

  const Sec = ({ n }) => (
    <div className="qn-step">
      <span className="qn-step-n">{SECTIONS[n - 1].n}</span>
      <Icon name={SECTIONS[n - 1].icon} size={15} />
      <h3 className="section-title">{SECTIONS[n - 1].title}</h3>
    </div>
  );

  return (
    <div className="cpe">
      <Link to="/packages" className="qd-back"><Icon name="chevronLeft" size={15} /> Custom packages</Link>
      <PageHeader
        title={isNew ? "New custom package" : (p.title || "Custom package")}
        subtitle="A trip designed personally for one traveller — finish it and send it straight to their WhatsApp.">
        {p.status === "sent" && <Badge tone="success" dot>Sent {p.sentAt ? fmtDateTime(p.sentAt) : ""}</Badge>}
      </PageHeader>

      <div className="col gap-5">
        {/* 1 · traveller */}
        <div className="card col gap-4">
          <div className="row-between">
            <Sec n={1} />
            <div className="qn-toggle">
              <button type="button" className={travellerMode === "manual" ? "on" : ""} onClick={() => setTravellerMode("manual")}>Enter manually</button>
              <button type="button" className={travellerMode === "users" ? "on" : ""} onClick={() => setTravellerMode("users")}>From user list</button>
              <button type="button" className={travellerMode === "queries" ? "on" : ""} onClick={() => setTravellerMode("queries")}>From queries</button>
            </div>
          </div>

          {travellerMode === "users" && (
            <Field label="Registered users" hint={users === null ? "Loading…" : `${userOptions.length} site account(s) — picking one fills the fields`}>
              <SearchSelect value="" onChange={pickUser} options={userOptions} placeholder="Search by name, phone or email…" />
            </Field>
          )}
          {travellerMode === "queries" && (
            <Field label="Travellers from your queries" hint="Picking one fills the fields">
              <SearchSelect value="" onChange={pickGuest} options={queryGuests} placeholder="Search query guests…" />
            </Field>
          )}

          <div className="form-grid">
            <Field label="Traveller name" required><Input value={p.traveller.name} onChange={(e) => setTrav({ name: e.target.value })} placeholder="Aisha Khan" /></Field>
            <Field label="WhatsApp number" hint="The package will be sent to this number" required>
              <Input value={p.traveller.phone} onChange={(e) => setTrav({ phone: e.target.value })} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email"><Input value={p.traveller.email} onChange={(e) => setTrav({ email: e.target.value })} placeholder="aisha@example.com" /></Field>
            <Field label="City"><Input value={p.traveller.city} onChange={(e) => setTrav({ city: e.target.value })} placeholder="Mumbai" /></Field>
          </div>
        </div>

        {/* 2 · trip basics */}
        <div className="card col gap-4">
          <Sec n={2} />
          <div className="form-grid">
            <Field label="Package title" className="span-2" hint="The headline of the plan">
              <Input value={p.title} onChange={(e) => set({ title: e.target.value })} placeholder={`${p.destination || "Bali"} Honeymoon Special — designed for ${p.traveller.name || "you"}`} />
            </Field>
            <Field label="Destination" required>
              <SearchSelect value={p.destination} onChange={(v) => set({ destination: v })} options={destOptions} allowCustom placeholder="Search or type any destination…" />
            </Field>
            <Field label="Start date"><DatePicker value={p.startDate} onChange={(v) => set({ startDate: v })} /></Field>
            <Field label="Nights"><Stepper value={num(p.nights) || 1} onChange={(v) => set({ nights: v })} min={1} max={60} /></Field>
            <Field label="Days" hint="Stays in sync with nights"><Stepper value={(num(p.nights) || 0) + 1} onChange={(v) => set({ nights: Math.max(1, v - 1) })} min={2} max={61} /></Field>
            <Field label="Adults"><Stepper value={num(p.adults) || 1} onChange={(v) => set({ adults: v })} min={1} max={40} /></Field>
            <Field label="Children"><Stepper value={num(p.children)} onChange={(v) => set({ children: v })} min={0} max={20} /></Field>
          </div>
        </div>

        {/* 3 · day-by-day */}
        <div className="card col gap-4">
          <div className="row-between" style={{ flexWrap: "wrap", gap: 8 }}>
            <Sec n={3} />
            <Button variant="secondary" size="sm" icon="plus" onClick={() => set({ days: [...p.days, blankDay()] })}>Add day</Button>
          </div>
          {(data.itineraries || []).length > 0 && (
            <Field label="Start from an itinerary" hint="Imports its day-by-day plan — then personalise for this traveller">
              <SearchSelect value="" onChange={importItinerary} placeholder="Search your built itineraries…"
                options={(data.itineraries || []).map((it) => ({ value: it.id, label: it.title || it.id, hint: it.destination }))} />
            </Field>
          )}
          {p.days.map((d, i) => (
            <div className="cpe-day" key={d.id}>
              <div className="cpe-day-head">
                <span className="cpe-day-n">Day {i + 1}</span>
                <Input value={d.title} onChange={(e) => setDay(d.id, { title: e.target.value })} placeholder={i === 0 ? "Arrival · beach sunset welcome" : "Give this day a title…"} />
                <IconButton name="chevronUp" size="sm" title="Move up" onClick={() => {
                  if (i === 0) return;
                  const days = [...p.days];
                  [days[i - 1], days[i]] = [days[i], days[i - 1]];
                  set({ days });
                }} />
                <IconButton name="trash" size="sm" className="danger" title="Remove day"
                  onClick={() => p.days.length > 1 && set({ days: p.days.filter((x) => x.id !== d.id) })} />
              </div>
              <StringList value={d.activities || []} onChange={(activities) => setDay(d.id, { activities })}
                placeholder="Add an activity — “Private pool villa check-in”, “Sunset cruise with dinner”…" addLabel="Add activity" />
              <div className="form-grid">
                <Field label="Stay tonight"><Input value={d.stay || ""} onChange={(e) => setDay(d.id, { stay: e.target.value })} placeholder="Ubud Cliffside Resort · Deluxe villa" /></Field>
                <Field label="Meals"><Input value={d.meals || ""} onChange={(e) => setDay(d.id, { meals: e.target.value })} placeholder="Breakfast + candle-light dinner" /></Field>
              </div>
            </div>
          ))}
        </div>

        {/* 4 · transport + inclusions */}
        <div className="card col gap-4">
          <Sec n={4} />
          <Field label="Transport & transfers" hint="Flights, cabs, ferries — summarised in one line or two">
            <Textarea rows={2} value={p.transport} onChange={(e) => set({ transport: e.target.value })} placeholder="Private AC cab throughout · airport pickup & drop · fast-boat to Nusa Penida" />
          </Field>
          <div className="cpe-2col">
            <div className="col gap-2">
              <Field label="Inclusions">
                <StringList value={p.inclusions || []} onChange={(inclusions) => set({ inclusions })} placeholder="Daily breakfast…" addLabel="Add inclusion" />
              </Field>
              {stdInclusions.length > 0 && (
                <Button variant="ghost" size="sm" icon="copy" onClick={() => mergeList("inclusions", stdInclusions)}>Load standard inclusions</Button>
              )}
            </div>
            <div className="col gap-2">
              <Field label="Exclusions">
                <StringList value={p.exclusions || []} onChange={(exclusions) => set({ exclusions })} placeholder="Flights to Bali…" addLabel="Add exclusion" />
              </Field>
              {stdExclusions.length > 0 && (
                <Button variant="ghost" size="sm" icon="copy" onClick={() => mergeList("exclusions", stdExclusions)}>Load standard exclusions</Button>
              )}
            </div>
          </div>
        </div>

        {/* 5 · pricing + notes */}
        <div className="card col gap-4">
          <Sec n={5} />
          <div className="form-grid">
            <Field label="Total price" hint="As you want it to read on WhatsApp"><Input value={p.price} onChange={(e) => set({ price: e.target.value })} placeholder="₹86,999" /></Field>
            <Field label="Price note"><Input value={p.priceNote} onChange={(e) => set({ priceNote: e.target.value })} placeholder="per couple, all-inclusive" /></Field>
            <Field label="Advance to book"><Input value={p.advance} onChange={(e) => set({ advance: e.target.value })} placeholder="₹25,000" /></Field>
          </div>
          <Field label="Personal note" hint="A line written just for them — goes at the end of the message">
            <Textarea rows={2} value={p.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="P.S. we've kept Day 3 light so you two can just live slow in Ubud 💛" />
          </Field>
        </div>

        {/* message preview */}
        <div className="card col gap-3">
          <div className="row-between" style={{ flexWrap: "wrap", gap: 8 }}>
            <h3 className="section-title"><Icon name="phone" size={14} /> Message preview</h3>
            <ShareActions phone={p.traveller.phone} email={p.traveller.email} subject={mailSubject} text={preview} onShared={onShared} />
          </div>
          <pre className="cpe-preview">{preview}</pre>
        </div>
      </div>

      {/* sticky actions */}
      <div className="cpe-actions">
        <Button variant="ghost" onClick={() => navigate("/packages")}>Back</Button>
        {!isNew && <Button variant="ghost" icon="trash" className="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>}
        <span className="grow" />
        <Button variant="secondary" icon="check" onClick={save}>Save draft</Button>
        <ShareActions primary size="" phone={p.traveller.phone} email={p.traveller.email} subject={mailSubject} text={preview} onShared={onShared} />
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Delete custom package"
          message={`Delete “${p.title || p.destination || "this package"}” for ${p.traveller?.name || "this traveller"}? This cannot be undone.`}
          onConfirm={() => { remove("customPackages", p.id); navigate("/packages"); }} onClose={() => setConfirmDelete(false)} />
      )}

      <style>{`
        .cpe { max-width: 860px; margin: 0 auto; display:flex; flex-direction:column; gap: var(--sp-5); padding-bottom: 84px; }
        .qd-back { display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600; color:var(--text-2); }
        .qd-back:hover { color: var(--ink); }
        .qn-step { display:flex; align-items:center; gap:9px; }
        .qn-step-n { width:24px; height:24px; border-radius:50%; background: var(--ink); color: var(--accent); font-size:12px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .qn-toggle { display:inline-flex; background: var(--panel-soft); border:1px solid var(--line); border-radius:999px; padding:3px; flex-wrap:wrap; }
        .qn-toggle button { border:none; background:transparent; padding:6px 13px; border-radius:999px; font-size:12px; font-weight:600; color:var(--text-2); cursor:pointer; }
        .qn-toggle button.on { background: var(--ink); color: var(--accent); }
        .cpe-day { border:1px solid var(--line); border-radius: var(--r-lg); padding: 14px; display:flex; flex-direction:column; gap:12px; background: var(--surface); }
        .cpe-day-head { display:flex; align-items:center; gap:10px; }
        .cpe-day-head > .input, .cpe-day-head input { flex:1; }
        .cpe-day-n { flex:none; font-size:11.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; background: var(--accent); color: var(--ink); padding: 6px 11px; border-radius: 999px; }
        .cpe-2col { display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-5); }
        @media (max-width: 760px){ .cpe-2col { grid-template-columns: 1fr; } }
        .cpe-preview { white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.55; background: #e7f6e9; border: 1px solid #bbe2c0; border-radius: 14px; padding: 14px 16px; margin: 0; max-height: 360px; overflow-y: auto; }
        .cpe-actions { position: fixed; bottom: 0; left: var(--sidebar-w, 260px); right: 0; display:flex; gap:10px; align-items:center; padding: 12px 28px; background: color-mix(in srgb, var(--bg, #faf7ee) 88%, transparent); backdrop-filter: blur(8px); border-top: 1px solid var(--line); z-index: 30; }
        @media (max-width: 900px){ .cpe-actions { left: 0; } }
      `}</style>
    </div>
  );
}
