// Package View — the read-only output of a package, generated from the builder
// data. Mirrors the K1 layout: Summary + Accommodation table + day-by-day
// Transport & Activities timeline, plus a WhatsApp tab with the copy-ready
// message and an "Open WhatsApp" deep link. Print → browser PDF.

import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { PageHeader, Tabs, Button, Badge, EmptyState, useToast } from "../ui/kit.jsx";
import {
  packageWhatsAppText, packageAccommodation, packageTotals, personLabel,
  fmtDate, money, num, waHref,
} from "../lib/crm.js";

const STATUS_TONE = { draft: "warning", approved: "info", converted: "success", rejected: "danger" };

// Group transport + sightseeing into dated days for the timeline.
function buildTimeline(pkg) {
  const items = [
    ...(pkg.transport || []).filter((t) => t.name).map((t) => ({ date: t.date, kind: "Transport", name: t.name, sub: [t.vehicle, t.basis, num(t.persons) ? `${num(t.persons)} pax` : null].filter(Boolean).join(" · ") })),
    ...(pkg.sightseeing || []).filter((s) => s.name).map((s) => ({ date: s.date, kind: "Sightseeing", name: s.name, sub: [s.basis, personLabel({ adults: s.adults, children: s.children })].filter(Boolean).join(" · ") })),
  ];
  const dated = items.filter((x) => x.date);
  const undated = items.filter((x) => !x.date);
  const byDate = {};
  dated.forEach((x) => { (byDate[x.date] ||= []).push(x); });
  const days = Object.keys(byDate).sort().map((d, i) => ({ label: `Day ${i + 1}`, date: d, items: byDate[d] }));
  if (undated.length) days.push({ label: "Flexible", date: "", items: undated });
  return days;
}

export default function PackageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data } = useStore();
  const [tab, setTab] = useState("itinerary");

  const pkg = (data.customPackages || []).find((p) => p.id === id);
  const accommodation = useMemo(() => (pkg ? packageAccommodation(pkg) : []), [pkg]);
  const timeline = useMemo(() => (pkg ? buildTimeline(pkg) : []), [pkg]);
  const totals = useMemo(() => (pkg ? packageTotals(pkg) : null), [pkg]);
  const waText = useMemo(() => (pkg ? packageWhatsAppText(pkg) : ""), [pkg]);

  if (!pkg) {
    return (
      <div>
        <PageHeader title="Package" />
        <EmptyState icon="inbox" title="Package not found" message="It may have been deleted."
          action={<Button variant="secondary" onClick={() => navigate("/packages")}>Back to packages</Button>} />
      </div>
    );
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(waText); toast("WhatsApp message copied"); }
    catch { toast("Press Ctrl/Cmd+C to copy", "error"); }
  };
  const wa = waHref(pkg.customer?.phone, waText);
  const nights = num(pkg.nights);

  return (
    <div className="pv">
      <PageHeader title={pkg.title || `${pkg.destination} Package`}
        subtitle={<>Ref {pkg.refId}{pkg.queryId ? <> · <Link to={`/queries/${pkg.queryId}`}>linked query</Link></> : null}</>}>
        <Badge tone={STATUS_TONE[pkg.status] || "neutral"} dot>{(pkg.status || "draft")[0].toUpperCase() + (pkg.status || "draft").slice(1)}</Badge>
        <Button variant="ghost" icon="edit" onClick={() => navigate(`/packages/${pkg.id}`)}>Edit</Button>
        <Button variant="secondary" icon="doc" onClick={() => window.print()}>Print / PDF</Button>
      </PageHeader>

      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "itinerary", label: "Itinerary" },
        { value: "whatsapp", label: "WhatsApp" },
      ]} />

      <div style={{ marginTop: "var(--sp-5)" }}>
        {tab === "itinerary" && (
          <div className="pv-doc col gap-5">
            {/* Summary */}
            <section>
              <h2 className="pv-h">Summary</h2>
              <div className="pv-summary">
                <div><span className="pv-k">Travel Date</span><span className="pv-v">{fmtDate(pkg.travelDate)}</span></div>
                <div><span className="pv-k">Guest Name</span><span className="pv-v">{pkg.customer?.name || "—"}<br /><span className="tiny">{pkg.customer?.phone}</span></span></div>
                <div><span className="pv-k">Duration</span><span className="pv-v">{nights} Night{nights === 1 ? "" : "s"}, {nights + 1} Day{nights ? "s" : ""}</span></div>
                <div><span className="pv-k">PAX</span><span className="pv-v">{personLabel(pkg)}</span></div>
                <div><span className="pv-k">Package</span><span className="pv-v">{money(totals.grandInr)} <span className="tiny">({money(totals.perPersonInr)}/person)</span></span></div>
              </div>
            </section>

            {/* Accommodation */}
            <section>
              <h2 className="pv-h">🛏 Accommodation</h2>
              {accommodation.length ? (
                <table className="pv-table">
                  <thead><tr><th>Night</th><th>Hotel</th><th>Rooms</th><th>Pax</th><th>Meal</th></tr></thead>
                  <tbody>
                    {accommodation.map((a) => (
                      <tr key={a.id}>
                        <td><b>{a.nightLabel}</b>{a.checkin ? <div className="tiny">{fmtDate(a.checkin)}</div> : null}</td>
                        <td>{a.hotel}{a.category ? ` ${a.category}` : ""}{a.roomType ? ` – ${a.roomType}` : ""}<div className="tiny">{a.city}</div></td>
                        <td>{a.rooms || "—"}</td>
                        <td>{a.pax}</td>
                        <td>{a.meal || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="muted tiny">No accommodation added.</p>}
            </section>

            {/* Transport & Activities */}
            <section>
              <h2 className="pv-h">🚐 Transportation & Activities</h2>
              {timeline.length ? (
                <div className="pv-timeline">
                  {timeline.map((day, i) => (
                    <div className="pv-day" key={i}>
                      <div className="pv-day-tag"><b>{day.label}</b><div className="tiny">{day.date ? fmtDate(day.date) : "Flexible"}</div></div>
                      <div className="pv-day-items">
                        {day.items.map((it, j) => (
                          <div className="pv-item" key={j}>
                            <Badge tone={it.kind === "Transport" ? "neutral" : "accent"}>{it.kind}</Badge>
                            <div><div style={{ fontWeight: 600 }}>{it.name}</div>{it.sub ? <div className="tiny">{it.sub}</div> : null}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="muted tiny">No transport or activities added.</p>}
            </section>

            {(pkg.inclusions?.filter(Boolean).length || pkg.exclusions?.filter(Boolean).length || pkg.remarks) ? (
              <section className="pv-notes">
                {pkg.remarks ? <p style={{ marginTop: 0 }}>{pkg.remarks}</p> : null}
                {pkg.inclusions?.filter(Boolean).length ? <><h2 className="pv-h">✅ Includes</h2><ul>{pkg.inclusions.filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}</ul></> : null}
                {pkg.exclusions?.filter(Boolean).length ? <><h2 className="pv-h">❌ Excludes</h2><ul>{pkg.exclusions.filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}</ul></> : null}
              </section>
            ) : null}
          </div>
        )}

        {tab === "whatsapp" && (
          <div className="col gap-4" style={{ maxWidth: 640 }}>
            <div className="row gap-2">
              <Button variant="primary" icon="copy" onClick={copy}>Copy message</Button>
              {wa
                ? <a className="btn btn-secondary" href={wa} target="_blank" rel="noreferrer"><span>Open WhatsApp</span></a>
                : <Button variant="secondary" disabled title="Add a customer phone number first">Open WhatsApp</Button>}
            </div>
            <textarea className="textarea" style={{ minHeight: 460, fontFamily: "ui-monospace, monospace", fontSize: 13, lineHeight: 1.5 }} readOnly value={waText} />
            <p className="tiny muted">Edit the package to change anything in this message — it regenerates automatically.</p>
          </div>
        )}
      </div>

      <style>{`
        .pv .pv-h { font-size:15px; font-weight:700; color: var(--accent-ink, #1d4ed8); margin:0 0 10px; }
        .pv .pv-summary { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:14px; background:var(--surface-2, #f6f8fb); border:1px solid var(--line); border-radius:14px; padding:16px; }
        .pv .pv-k { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3); font-weight:700; margin-bottom:4px; }
        .pv .pv-v { font-weight:600; }
        .pv .pv-table { width:100%; border-collapse:collapse; font-size:13px; }
        .pv .pv-table th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-3); border-bottom:1px solid var(--line); padding:8px 10px; }
        .pv .pv-table td { border-bottom:1px solid var(--line); padding:10px; vertical-align:top; }
        .pv .pv-timeline { display:flex; flex-direction:column; gap:12px; }
        .pv .pv-day { display:flex; gap:14px; border:1px solid var(--line); border-radius:14px; padding:12px 14px; }
        .pv .pv-day-tag { min-width:90px; border-right:1px solid var(--line); padding-right:14px; }
        .pv .pv-day-items { display:flex; flex-direction:column; gap:10px; flex:1; }
        .pv .pv-item { display:flex; gap:10px; align-items:flex-start; }
        .pv .pv-notes ul { margin:6px 0 14px; padding-left:18px; font-size:13px; }
        @media print {
          .admin-sidebar, .admin-topbar, .tabs-nav, .page-header .row, .btn { display:none !important; }
          .pv-doc { display:block !important; }
        }
      `}</style>
    </div>
  );
}
