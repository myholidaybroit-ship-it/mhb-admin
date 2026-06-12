// Query detail — minimal & spacious. The important lead info lives in the
// header (who, where, when, worth, what's pending); everything else is chunked
// into tabs so the page never feels heavy:
//
//   ← back · avatar · name · stage · quick actions
//   facts strip (destination · dates · pax · quote · pending)
//   slim stage stepper
//   [ Quotes | Payments | Follow-ups | Details | Activity ]

import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore, uid } from "../lib/store.jsx";
import {
  Field, Input, Textarea, Select, Button, IconButton, Badge, TagInput,
  Stepper, Tabs, useToast, ConfirmDialog, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import {
  MANUAL_STAGES, SOURCES, QUOTE_ITEM_KINDS, PAY_MODES, stageTone,
  effectiveStage, quoteTotals, headlineQuote, money, num, paxLabel, fmtDate,
  fmtDateTime, followUpState, paymentState, paymentSummary, logActivity,
  telHref, mailHref, waHref, quoteShareText,
} from "../lib/crm.js";

const STEP_PATH = ["New", "In Progress", "On Hold", "Converted", "On Trip", "Past Trips"];

/* ---------------- inline quote form ---------------- */
function QuoteForm({ query, quote, onSave, onCancel }) {
  const { data } = useStore();
  const toast = useToast();
  const [qt, setQt] = useState(() => quote || {
    id: uid("qt"), title: `${query.destination} · ${query.nights || "?"}N`, itineraryId: "",
    items: [{ id: uid("li"), kind: "Hotel", name: "", cost: "", markupPct: 15 }],
    gstPct: 5, givenPrice: "", status: "draft", createdAt: new Date().toISOString(),
  });
  const set = (p) => setQt((s) => ({ ...s, ...p }));
  const t = quoteTotals(qt);
  const setItem = (id, p) => set({ items: qt.items.map((it) => (it.id === id ? { ...it, ...p } : it)) });

  const save = () => {
    if (!qt.items.some((it) => num(it.cost) > 0)) return toast("Add at least one costed component", "error");
    onSave(qt);
  };

  return (
    <div className="qf">
      <div className="form-grid">
        <Field label="Quote title"><Input value={qt.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Link itinerary">
          <Select value={qt.itineraryId} onChange={(e) => set({ itineraryId: e.target.value })}
            options={[{ value: "", label: "No itinerary linked" }, ...(data.itineraries || []).map((it) => ({ value: it.id, label: it.title || it.id }))]} />
        </Field>
      </div>

      <div className="row-between mt-4" style={{ marginBottom: 8 }}>
        <span className="qd-label">Components</span>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {QUOTE_ITEM_KINDS.slice(0, 4).map((k) => (
            <Button key={k} variant="ghost" size="sm" icon="plus"
              onClick={() => set({ items: [...qt.items, { id: uid("li"), kind: k, name: "", cost: "", markupPct: 15 }] })}>{k}</Button>
          ))}
        </div>
      </div>
      <div className="col gap-2">
        {qt.items.map((it) => {
          const sell = num(it.cost) * (1 + num(it.markupPct) / 100);
          return (
            <div className="qe-row" key={it.id}>
              <Select value={it.kind} onChange={(e) => setItem(it.id, { kind: e.target.value })} options={QUOTE_ITEM_KINDS} />
              <Input value={it.name} onChange={(e) => setItem(it.id, { name: e.target.value })} placeholder={it.kind === "Hotel" ? "Ubud Resort · 3N · Deluxe" : "Describe the service"} />
              <Input type="number" value={it.cost} onChange={(e) => setItem(it.id, { cost: e.target.value })} placeholder="Cost ₹" />
              <Input type="number" value={it.markupPct} onChange={(e) => setItem(it.id, { markupPct: e.target.value })} placeholder="%" />
              <span className="qe-sell">{money(sell)}</span>
              <IconButton name="trash" size="sm" title="Remove" onClick={() => set({ items: qt.items.filter((x) => x.id !== it.id) })} />
            </div>
          );
        })}
      </div>

      <div className="qe-totals mt-4">
        <div className="form-grid">
          <Field label="GST %"><Stepper value={num(qt.gstPct)} onChange={(v) => set({ gstPct: v })} min={0} max={28} /></Field>
          <Field label="Given price (₹)" hint={`Auto total ${money(t.total)}`}>
            <Input type="number" value={qt.givenPrice} onChange={(e) => set({ givenPrice: e.target.value })} placeholder={String(Math.round(t.total))} />
          </Field>
        </div>
        <div className="qe-sum">
          <div><span>Cost</span><b>{money(t.cost)}</b></div>
          <div><span>Markup</span><b>{money(t.markup)}</b></div>
          <div><span>GST</span><b>{money(t.gst)}</b></div>
          <div className="qe-final"><span>Package</span><b>{money(t.finalPrice)}</b></div>
          <div className={t.profit >= 0 ? "qe-profit" : "qe-loss"}><span>Profit</span><b>{money(t.profit)}</b></div>
        </div>
      </div>

      <div className="row gap-2 mt-4" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>Save quote</Button>
      </div>
    </div>
  );
}

/* ---------------- inline convert panel ---------------- */
function ConvertPanel({ query, quote, onConvert, onCancel }) {
  const toast = useToast();
  const t = quoteTotals(quote);
  const [verified, setVerified] = useState(false);
  const [comment, setComment] = useState("");
  const [insts, setInsts] = useState(() => {
    const half = Math.round(t.finalPrice / 2);
    return [
      { id: uid("pay"), label: "Booking advance", amount: half, dueAt: new Date().toISOString().slice(0, 10) },
      { id: uid("pay"), label: "Balance", amount: t.finalPrice - half, dueAt: query.startDate || "" },
    ];
  });
  const setInst = (id, p) => setInsts((s) => s.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const total = insts.reduce((s, p) => s + num(p.amount), 0);

  const confirm = () => {
    if (!verified) return toast("Tick the verification box first", "error");
    if (!insts.length || total <= 0) return toast("Set at least one installment", "error");
    onConvert({ insts, comment });
  };

  return (
    <div className="cvp">
      <b style={{ fontSize: 13 }}>Convert with “{quote.title}” — {money(t.finalPrice)}</b>
      <label className="cv-verify">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
        I've verified the guest, dates and package details.
      </label>

      <div className="row-between mt-2" style={{ marginBottom: 6 }}>
        <span className="qd-label">Installments</span>
        <Button variant="ghost" size="sm" icon="plus" onClick={() => setInsts((s) => [...s, { id: uid("pay"), label: `Installment ${s.length + 1}`, amount: "", dueAt: "" }])}>Add</Button>
      </div>
      <div className="col gap-2">
        {insts.map((p) => (
          <div className="qe-row pay" key={p.id}>
            <Input value={p.label} onChange={(e) => setInst(p.id, { label: e.target.value })} placeholder="Label" />
            <Input type="number" value={p.amount} onChange={(e) => setInst(p.id, { amount: e.target.value })} placeholder="Amount ₹" />
            <Input type="date" value={p.dueAt} onChange={(e) => setInst(p.id, { dueAt: e.target.value })} />
            <IconButton name="trash" size="sm" title="Remove" onClick={() => setInsts((s) => s.filter((x) => x.id !== p.id))} />
          </div>
        ))}
      </div>
      <div className="tiny mt-2">
        Total <b>{money(total)}</b>{total !== t.finalPrice ? <span style={{ color: "#b91c1c" }}> · differs from package {money(t.finalPrice)}</span> : " · matches ✓"}
      </div>
      <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Operations note (optional)" />
      <div className="row gap-2 mt-2" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={confirm}>Mark as converted</Button>
      </div>
    </div>
  );
}

/* ---------------- payment row ---------------- */
function PaymentRow({ p, onPaid }) {
  const [mode, setMode] = useState(PAY_MODES[0]);
  const st = paymentState(p);
  return (
    <div className="pay-row">
      <div className="grow">
        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div>
        <div className="tiny" style={{ color: "var(--text-3)" }}>
          {p.paidAt ? `Received ${fmtDate(p.paidAt)}${p.mode ? ` · ${p.mode}` : ""}` : p.dueAt ? `Due ${fmtDate(p.dueAt)}` : "No due date"}
        </div>
      </div>
      <b style={{ whiteSpace: "nowrap" }}>{money(p.amount)}</b>
      {st === "paid" ? <Badge tone="success" dot>Paid</Badge> : (
        <>
          {st === "overdue" && <Badge tone="danger" dot>Overdue</Badge>}
          <Select value={mode} onChange={(e) => setMode(e.target.value)} options={PAY_MODES} />
          <Button variant="secondary" size="sm" icon="check" onClick={() => onPaid(mode)}>Received</Button>
        </>
      )}
    </div>
  );
}

/* ================= the page ================= */
export default function QueryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, upsert, remove } = useStore();
  const toast = useToast();

  const q = (data.tripQueries || []).find((x) => x.id === id);

  const [tab, setTab] = useState("quotes");
  const [editQuote, setEditQuote] = useState(null);
  const [convertId, setConvertId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lostMode, setLostMode] = useState(null);
  const [lostReason, setLostReason] = useState("");
  const [fuNote, setFuNote] = useState("");
  const [fuDue, setFuDue] = useState("");

  const stage = q ? effectiveStage(q) : "New";
  const paySum = useMemo(() => (q ? paymentSummary(q) : { total: 0, paid: 0, due: 0 }), [q]);

  if (!q) {
    return (
      <EmptyState icon="inbox" title="Query not found" message="It may have been deleted."
        action={<Link to="/queries"><Button variant="secondary">Back to queries</Button></Link>} />
    );
  }

  const save = (next, log) => upsert("tripQueries", log ? { ...next, activity: logActivity(next, log) } : next);
  const patch = (p) => save({ ...q, ...p });
  const patchGuest = (p) => save({ ...q, guest: { ...q.guest, ...p } });

  const setStage = (status) => { save({ ...q, status }, `Stage changed to ${status}`); toast(`Moved to ${status}`); };
  const markLost = () => {
    save({ ...q, status: lostMode, lostReason: lostReason.trim() }, `Marked ${lostMode}${lostReason ? ` — ${lostReason.trim()}` : ""}`);
    toast(`Marked ${lostMode}`);
    setLostMode(null); setLostReason("");
  };
  const saveQuote = (qt) => {
    const exists = (q.quotes || []).some((x) => x.id === qt.id);
    const quotes = exists ? q.quotes.map((x) => (x.id === qt.id ? qt : x)) : [...(q.quotes || []), qt];
    const status = q.status === "New" ? "In Progress" : q.status;
    save({ ...q, quotes, status }, exists ? `Quote “${qt.title}” updated` : `Quote “${qt.title}” created — ${money(quoteTotals(qt).finalPrice)}`);
    toast(exists ? "Quote updated" : "Quote added");
    setEditQuote(null);
  };
  const setQuoteStatus = (qt, status) =>
    save({ ...q, quotes: q.quotes.map((x) => (x.id === qt.id ? { ...x, status } : x)) }, `Quote “${qt.title}” marked ${status}`);
  const shareQuote = (qt) => {
    const text = quoteShareText(q, qt);
    const wa = waHref(q.guest?.phone, text);
    navigator.clipboard?.writeText(text).then(() => toast("Quote message copied — paste anywhere"));
    if (wa) window.open(wa, "_blank");
    if (qt.status === "draft") setQuoteStatus(qt, "shared");
  };
  const convert = (quote, { insts, comment }) => {
    save({
      ...q,
      status: "Converted",
      quotes: q.quotes.map((x) => (x.id === quote.id ? { ...x, status: "accepted" } : x)),
      conversion: { quoteId: quote.id, convertedAt: new Date().toISOString(), comment },
      payments: insts.map((p) => ({ ...p, amount: num(p.amount) })),
    }, `Converted using “${quote.title}” — ${money(quoteTotals(quote).finalPrice)}`);
    toast("Query converted 🎉");
    setConvertId(null);
    setTab("payments");
  };
  const markPaid = (p, mode) =>
    save({ ...q, payments: q.payments.map((x) => (x.id === p.id ? { ...x, paidAt: new Date().toISOString(), mode } : x)) },
      `Payment received — ${p.label} ${money(p.amount)} (${mode})`);
  const addFollowUp = () => {
    if (!fuNote.trim()) return toast("Write a follow-up note first", "error");
    const f = { id: uid("fu"), note: fuNote.trim(), dueAt: fuDue || "", done: false, createdAt: new Date().toISOString() };
    save({ ...q, followUps: [...(q.followUps || []), f] }, `Follow-up added${fuDue ? ` (due ${fmtDateTime(fuDue)})` : ""}`);
    setFuNote(""); setFuDue("");
  };
  const toggleFollowUp = (f) =>
    save({ ...q, followUps: q.followUps.map((x) => (x.id === f.id ? { ...x, done: !x.done } : x)) });

  const wa = waHref(q.guest?.phone, `Hi ${q.guest?.name || ""}! This is MyHolidayBro about your ${q.destination} trip ✈️`);
  const stepIdx = STEP_PATH.indexOf(stage);
  const isLost = ["Cancelled", "Dropped"].includes(stage);
  const best = headlineQuote(q);
  const openFu = (q.followUps || []).filter((f) => !f.done).length;
  const sortedFu = [...(q.followUps || [])].sort((a, b) => (a.done === b.done ? new Date(b.createdAt || 0) - new Date(a.createdAt || 0) : a.done ? 1 : -1));

  const facts = [
    { ico: "map", v: q.destination },
    { ico: "calendar", v: `${fmtDate(q.startDate)} · ${q.nights || "?"}N` },
    { ico: "users", v: paxLabel(q) },
    best && { ico: "tag", v: `${money(quoteTotals(best).finalPrice)} quote` },
    q.status === "Converted" && paySum.due > 0 && { ico: "bell", v: `${money(paySum.due)} pending`, warn: true },
    q.budget && !best && { ico: "tag", v: `budget ${q.budget}` },
  ].filter(Boolean);

  return (
    <div className="qd">
      <Link to="/queries" className="qd-back"><Icon name="chevronLeft" size={15} /> Queries</Link>

      {/* ---- header: who + the few numbers that matter ---- */}
      <div className="qd-hero">
        <div className="row gap-3" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <span className="qd-avatar">{(q.guest?.name || "?")[0]}</span>
          <div className="grow">
            <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <h1 className="qd-name">{q.guest?.name || "Query"}</h1>
              <Badge tone={stageTone(stage)} dot>{stage}</Badge>
            </div>
            <div className="tiny" style={{ marginTop: 2, color: "var(--text-3)" }}>
              via {q.source}{q.refId ? ` · ${q.refId}` : ""}{q.assignedTo ? ` · ${q.assignedTo}` : ""} · created {fmtDate(q.createdAt)}
              {isLost && q.lostReason ? ` · lost: ${q.lostReason}` : ""}
            </div>
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {wa && <a href={wa} target="_blank" rel="noreferrer"><Button variant="secondary" size="sm" icon="phone">WhatsApp</Button></a>}
            {telHref(q.guest?.phone) && <a href={telHref(q.guest.phone)}><IconButton name="phone" title="Call" /></a>}
            {mailHref(q.guest?.email) && <a href={mailHref(q.guest.email)}><IconButton name="mail" title="Email" /></a>}
            <IconButton name="trash" className="danger" title="Delete query" onClick={() => setConfirmDelete(true)} />
          </div>
        </div>

        <div className="qd-facts">
          {facts.map((f, i) => (
            <span className={`qd-fact ${f.warn ? "warn" : ""}`} key={i}><Icon name={f.ico} size={13} /> {f.v}</span>
          ))}
        </div>

        {/* slim stepper */}
        <div className="qd-stepper">
          {STEP_PATH.map((s, i) => {
            const reached = stepIdx >= 0 && i <= stepIdx && !isLost;
            const clickable = MANUAL_STAGES.includes(s) && !isLost;
            return (
              <button type="button" key={s} disabled={!clickable}
                className={`qd-step ${reached ? "on" : ""} ${stage === s ? "now" : ""}`}
                onClick={() => clickable && s !== q.status && setStage(s)}
                title={clickable ? `Move to ${s}` : `${s} sets itself from trip dates`}>
                {s}
              </button>
            );
          })}
          <span className="grow" />
          {!isLost ? (
            <button type="button" className="qd-lost-link" onClick={() => setLostMode(q.status === "Converted" ? "Dropped" : "Cancelled")}>
              Mark {q.status === "Converted" ? "dropped" : "cancelled"}
            </button>
          ) : (
            <button type="button" className="qd-lost-link" onClick={() => setStage("In Progress")}>Reopen query</button>
          )}
        </div>

        {lostMode && (
          <div className="qd-lostbox">
            <Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder={`Why ${lostMode.toLowerCase()}? (optional — shows in reports)`} />
            <Button variant="ghost" size="sm" onClick={() => setLostMode(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={markLost}>Confirm</Button>
          </div>
        )}
      </div>

      {/* ---- tabs ---- */}
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "quotes", label: `Quotes (${(q.quotes || []).length})` },
        { value: "payments", label: paySum.due > 0 ? `Payments (${money(paySum.due)} due)` : "Payments" },
        { value: "followups", label: openFu ? `Follow-ups (${openFu})` : "Follow-ups" },
        { value: "details", label: "Details" },
        { value: "activity", label: "Activity" },
      ]} />

      <div className="qd-pane">
        {/* QUOTES */}
        {tab === "quotes" && (
          <div className="col gap-4">
            {editQuote === "new" && <QuoteForm query={q} onSave={saveQuote} onCancel={() => setEditQuote(null)} />}

            {(q.quotes || []).length === 0 && editQuote !== "new" && (
              <EmptyState icon="doc" title="No quotes yet" message="Build one with component-wise costing — the first quote moves this query to In Progress."
                action={<Button variant="primary" icon="plus" onClick={() => setEditQuote("new")}>New quote</Button>} />
            )}

            {(q.quotes || []).map((qt) => {
              const t = quoteTotals(qt);
              const linked = qt.itineraryId ? (data.itineraries || []).find((it) => it.id === qt.itineraryId) : null;
              const isEditing = editQuote && editQuote !== "new" && editQuote.id === qt.id;
              return (
                <div className={`qt-card ${qt.status === "accepted" ? "accepted" : ""}`} key={qt.id}>
                  <div className="row-between">
                    <div>
                      <div className="row gap-2" style={{ alignItems: "center" }}>
                        <b>{qt.title}</b>
                        <Badge tone={qt.status === "accepted" ? "success" : qt.status === "shared" ? "info" : "neutral"}>{qt.status}</Badge>
                      </div>
                      <div className="tiny" style={{ marginTop: 2 }}>
                        {(qt.items || []).length} components · profit {money(t.profit)} · {fmtDate(qt.createdAt)}
                        {linked && <> · <Link to="/itineraries" style={{ fontWeight: 600 }}>{linked.title || linked.id}</Link></>}
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, whiteSpace: "nowrap" }}>{money(t.finalPrice)}</div>
                  </div>

                  {!isEditing && convertId !== qt.id && (
                    <div className="row gap-2 mt-3" style={{ flexWrap: "wrap" }}>
                      <Button variant="ghost" size="sm" icon="edit" onClick={() => { setEditQuote(qt); setConvertId(null); }}>Edit</Button>
                      <Button variant="ghost" size="sm" icon="external" onClick={() => shareQuote(qt)}>Share</Button>
                      <Button variant="ghost" size="sm" icon="copy" onClick={() => saveQuote({ ...qt, id: uid("qt"), title: `${qt.title} (copy)`, status: "draft", createdAt: new Date().toISOString() })}>Duplicate</Button>
                      {q.status !== "Converted" && !isLost && (
                        <Button variant="primary" size="sm" icon="check" onClick={() => { setConvertId(qt.id); setEditQuote(null); }}>Convert</Button>
                      )}
                    </div>
                  )}

                  {isEditing && <QuoteForm query={q} quote={qt} onSave={saveQuote} onCancel={() => setEditQuote(null)} />}
                  {convertId === qt.id && <ConvertPanel query={q} quote={qt} onConvert={(args) => convert(qt, args)} onCancel={() => setConvertId(null)} />}
                </div>
              );
            })}

            {(q.quotes || []).length > 0 && editQuote !== "new" && (
              <Button variant="secondary" icon="plus" onClick={() => setEditQuote("new")}>Another quote option</Button>
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div className="col gap-4">
            {q.status !== "Converted" && (q.payments || []).length === 0 ? (
              <EmptyState icon="tag" title="No payment plan yet" message="Installments are set when you convert the query using a quote." />
            ) : (
              <>
                <div className="pay-sum">
                  <div><span>Package</span><b>{money(paySum.total)}</b></div>
                  <div><span>Received</span><b style={{ color: "#15803d" }}>{money(paySum.paid)}</b></div>
                  <div><span>Pending</span><b style={{ color: paySum.due > 0 ? "#b45309" : "inherit" }}>{money(paySum.due)}</b></div>
                </div>
                {(q.payments || []).map((p) => <PaymentRow key={p.id} p={p} onPaid={(mode) => markPaid(p, mode)} />)}
                <div className="row-between">
                  <Button variant="ghost" size="sm" icon="plus"
                    onClick={() => save({ ...q, payments: [...(q.payments || []), { id: uid("pay"), label: `Installment ${(q.payments || []).length + 1}`, amount: 0, dueAt: "" }] }, "Installment added")}>
                    Add installment
                  </Button>
                  <Link to="/payments" className="see-link">All payments</Link>
                </div>
                {q.conversion?.comment && <div className="tiny" style={{ color: "var(--text-2)" }}>Ops note: {q.conversion.comment}</div>}
              </>
            )}
          </div>
        )}

        {/* FOLLOW-UPS */}
        {tab === "followups" && (
          <div className="col gap-4">
            <div className="fu-add">
              <Input value={fuNote} onChange={(e) => setFuNote(e.target.value)} placeholder="Spoke to guest — sending revised quote…" />
              <Input type="datetime-local" value={fuDue} onChange={(e) => setFuDue(e.target.value)} title="Due date (optional)" />
              <Button variant="secondary" icon="plus" onClick={addFollowUp}>Add</Button>
            </div>
            <div className="col gap-2">
              {sortedFu.length === 0 && <EmptyState icon="bell" title="No follow-ups yet" message="Add one after every client conversation — due ones surface in the Follow-ups hub." />}
              {sortedFu.map((f) => {
                const st = followUpState(f);
                return (
                  <div className={`fu-row ${f.done ? "done" : ""}`} key={f.id}>
                    <button type="button" className={`fu-check ${f.done ? "on" : ""}`} onClick={() => toggleFollowUp(f)} title={f.done ? "Reopen" : "Mark done"}>
                      {f.done && <Icon name="check" size={12} />}
                    </button>
                    <div className="grow">
                      <div style={{ fontSize: 13.5 }}>{f.note}</div>
                      <div className="tiny" style={{ color: "var(--text-3)" }}>{fmtDateTime(f.createdAt)}</div>
                    </div>
                    {f.dueAt && !f.done && (
                      <Badge tone={st === "overdue" ? "danger" : st === "today" ? "warning" : "neutral"} dot>
                        {st === "overdue" ? "Overdue · " : ""}{fmtDateTime(f.dueAt)}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETAILS */}
        {tab === "details" && (
          <div className="qd-details">
            <div className="col gap-4">
              <h3 className="section-title">Trip</h3>
              <Field label="Destination"><Input value={q.destination || ""} onChange={(e) => patch({ destination: e.target.value })} /></Field>
              <div className="form-grid">
                <Field label="Start date"><Input type="date" value={q.startDate || ""} onChange={(e) => patch({ startDate: e.target.value })} /></Field>
                <Field label="Nights"><Stepper value={num(q.nights) || 1} onChange={(v) => patch({ nights: v })} min={1} max={60} /></Field>
                <Field label="Adults"><Stepper value={num(q.adults) || 1} onChange={(v) => patch({ adults: v })} min={1} max={40} /></Field>
                <Field label="Children"><Stepper value={num(q.children)} onChange={(v) => patch({ children: v })} min={0} max={20} /></Field>
                <Field label="Budget"><Input value={q.budget || ""} onChange={(e) => patch({ budget: e.target.value })} placeholder="₹80,000" /></Field>
                <Field label="Source"><Select value={q.source || "Website"} onChange={(e) => patch({ source: e.target.value })} options={SOURCES} /></Field>
                <Field label="Reference ID"><Input value={q.refId || ""} onChange={(e) => patch({ refId: e.target.value })} /></Field>
                <Field label="Assigned to"><Input value={q.assignedTo || ""} onChange={(e) => patch({ assignedTo: e.target.value })} /></Field>
              </div>
            </div>
            <div className="col gap-4">
              <h3 className="section-title">Guest</h3>
              <Field label="Name"><Input value={q.guest?.name || ""} onChange={(e) => patchGuest({ name: e.target.value })} /></Field>
              <div className="form-grid">
                <Field label="Phone"><Input value={q.guest?.phone || ""} onChange={(e) => patchGuest({ phone: e.target.value })} /></Field>
                <Field label="City"><Input value={q.guest?.city || ""} onChange={(e) => patchGuest({ city: e.target.value })} /></Field>
              </div>
              <Field label="Email"><Input value={q.guest?.email || ""} onChange={(e) => patchGuest({ email: e.target.value })} /></Field>
              <h3 className="section-title" style={{ marginTop: 8 }}>Tags & requirements</h3>
              <TagInput value={q.tags || []} onChange={(tags) => patch({ tags })} placeholder="hot · honeymoon · repeat-guest…" />
              <Textarea rows={4} value={q.comments || ""} onChange={(e) => patch({ comments: e.target.value })} placeholder="Notes from the first call…" />
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          <div className="col gap-0">
            {[...(q.activity || [])].reverse().map((a, i) => (
              <div className="act-row" key={i}>
                <span className="act-dot" />
                <div className="grow" style={{ fontSize: 13 }}>{a.text}</div>
                <span className="tiny" style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>{fmtDateTime(a.at)}</span>
              </div>
            ))}
            {!(q.activity || []).length && <span className="tiny" style={{ color: "var(--text-3)" }}>Nothing logged yet.</span>}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog title="Delete query" message={`Delete the query for “${q.guest?.name}”? Quotes, follow-ups and payment records go with it.`}
          onConfirm={() => { remove("tripQueries", q.id); navigate("/queries"); }} onClose={() => setConfirmDelete(false)} />
      )}

      <style>{`
        .qd { max-width: 920px; margin: 0 auto; display:flex; flex-direction:column; gap: var(--sp-5); }
        .qd-back { display:inline-flex; align-items:center; gap:4px; font-size:12.5px; font-weight:600; color:var(--text-2); }
        .qd-back:hover { color: var(--ink); }
        .qd-hero { display:flex; flex-direction:column; gap:16px; }
        .qd-avatar { width:54px; height:54px; border-radius:18px; background: var(--accent); color: var(--ink); font-weight:800; font-size:23px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .qd-name { font-size: var(--fs-h2); margin: 0; letter-spacing:-0.02em; }
        .qd-facts { display:flex; gap:8px; flex-wrap:wrap; }
        .qd-fact { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:999px; background: var(--panel); border:1px solid var(--line); font-size:12.5px; font-weight:600; }
        .qd-fact.warn { background:#fef2f2; border-color:#fecaca; color:#b91c1c; }
        .qd-stepper { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
        .qd-step { padding:5px 12px; border-radius:999px; border:none; background:transparent; font-size:12px; font-weight:600; color:var(--text-3); cursor:pointer; transition: all .12s; }
        .qd-step:disabled { cursor:default; }
        .qd-step.on { color: var(--ink); }
        .qd-step.now { background: var(--ink); color: var(--accent); }
        .qd-step:not(:disabled):hover:not(.now) { background: var(--panel-soft); color: var(--ink); }
        .qd-lost-link { background:none; border:none; font-size:12px; font-weight:600; color:var(--text-3); cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
        .qd-lost-link:hover { color:#b91c1c; }
        .qd-lostbox { display:flex; gap:8px; align-items:center; padding:10px; border:1px solid #fca5a5; border-radius: var(--r-md); background:#fef2f2; }
        .qd-lostbox > :first-child { flex:1; }
        .qd-pane { padding-top: var(--sp-4); }
        .qd-label { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-3); }
        .qd-details { display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-7); }
        @media (max-width: 860px){ .qd-details{ grid-template-columns: 1fr; } }
        .qf { border:1.5px dashed var(--line); border-radius: var(--r-lg); padding: 16px; background: var(--panel-soft); }
        .qe-row { display:grid; grid-template-columns: 110px 1fr 100px 64px 84px 32px; gap:8px; align-items:center; }
        .qe-row.pay { grid-template-columns: 1fr 120px 140px 32px; }
        @media (max-width: 720px){ .qe-row { grid-template-columns: 1fr 1fr; } }
        .qe-sell { font-size:12.5px; font-weight:700; text-align:right; color:var(--accent-ink); }
        .qe-totals { border-top:1px dashed var(--line); padding-top:12px; }
        .qe-sum { display:flex; gap:18px; flex-wrap:wrap; margin-top:8px; }
        .qe-sum > div { display:flex; flex-direction:column; }
        .qe-sum span { font-size:11px; color:var(--text-3); }
        .qe-sum b { font-size:14px; }
        .qe-final b { font-size:17px; }
        .qe-profit b { color:#15803d; }
        .qe-loss b { color:#b91c1c; }
        .qt-card { border:1px solid var(--line); border-radius:var(--r-lg); padding:16px; background:var(--surface); }
        .qt-card.accepted { border-color:#86efac; background:#f0fdf4; }
        .cvp { margin-top:12px; border:1.5px solid var(--accent); border-radius:var(--r-lg); padding:14px; background:var(--accent-soft); display:flex; flex-direction:column; gap:8px; }
        .cv-verify { display:flex; gap:8px; align-items:center; font-size:13px; font-weight:600; cursor:pointer; }
        .fu-add { display:grid; grid-template-columns: 1fr 210px auto; gap:8px; }
        @media (max-width:720px){ .fu-add { grid-template-columns: 1fr; } }
        .fu-row { display:flex; gap:10px; align-items:flex-start; border:1px solid var(--line); border-radius:var(--r-md); padding:11px 13px; }
        .fu-row.done { opacity:0.55; }
        .fu-check { width:20px; height:20px; border-radius:6px; border:1.5px solid var(--line); background:var(--surface); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; flex:none; margin-top:2px; }
        .fu-check.on { background:var(--ink); border-color:var(--ink); color:var(--accent); }
        .pay-sum { display:flex; gap:26px; border:1px solid var(--line); border-radius:var(--r-lg); padding:13px 16px; background:var(--panel-soft); }
        .pay-sum > div { display:flex; flex-direction:column; }
        .pay-sum span { font-size:11px; color:var(--text-3); }
        .pay-sum b { font-size:16px; }
        .pay-row { display:flex; gap:10px; align-items:center; border:1px solid var(--line); border-radius:var(--r-md); padding:10px 13px; flex-wrap:wrap; }
        .act-row { display:flex; gap:10px; align-items:flex-start; padding:9px 0; border-bottom:1px solid var(--line-soft); }
        .act-row:last-child { border-bottom:none; }
        .act-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); margin-top:6px; flex:none; }
      `}</style>
    </div>
  );
}
