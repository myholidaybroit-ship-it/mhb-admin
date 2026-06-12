// Sales CRM helpers — trip-query stages, costing math and date logic.
// Pipeline modelled on travel-CRM practice (Sembark-style): a query moves
// New → In Progress (first quote) → On Hold → Converted, then auto-shows as
// On Trip / Past Trips by travel dates. Cancelled = never converted;
// Dropped = cancelled after conversion.

export const STAGES = [
  { key: "New",         tone: "info",    hint: "Fresh enquiry — quote it" },
  { key: "In Progress", tone: "warning", hint: "Quoted, in follow-up" },
  { key: "On Hold",     tone: "neutral", hint: "Confirmed, awaiting payment" },
  { key: "Converted",   tone: "success", hint: "Booked — collect & operate" },
  { key: "On Trip",     tone: "accent",  hint: "Travelling right now" },
  { key: "Past Trips",  tone: "neutral", hint: "Completed — ask for reviews" },
  { key: "Cancelled",   tone: "danger",  hint: "Didn't convert" },
  { key: "Dropped",     tone: "danger",  hint: "Cancelled after conversion" },
];

export const stageTone = (s) => STAGES.find((x) => x.key === s)?.tone || "neutral";

// Stages you can set by hand (On Trip / Past Trips derive from dates).
export const MANUAL_STAGES = STAGES.map((s) => s.key).filter((k) => k !== "On Trip" && k !== "Past Trips");

export const SOURCES = ["Website", "Instagram", "WhatsApp", "Referral", "B2B Agent", "Google Ads", "Walk-in", "Other"];

export const QUOTE_ITEM_KINDS = ["Hotel", "Transport", "Activity", "Flight", "Visa", "Guide", "Other"];

export const PAY_MODES = ["UPI", "Bank transfer", "Card", "Cash", "Payment link"];

const DAY = 86400000;

// Where the query *shows* in the pipeline: Converted queries auto-advance to
// On Trip / Past Trips once their travel dates arrive (no cron needed).
export function effectiveStage(q) {
  if (q.status !== "Converted") return q.status || "New";
  if (!q.startDate) return "Converted";
  const start = new Date(q.startDate);
  if (Number.isNaN(+start)) return "Converted";
  const end = new Date(+start + (Number(q.nights) || 0) * DAY);
  const now = new Date();
  if (now > end) return "Past Trips";
  if (now >= start) return "On Trip";
  return "Converted";
}

/* ---------------- money & costing ---------------- */

export const money = (n) => "₹" + (Math.round(Number(n) || 0)).toLocaleString("en-IN");
export const num = (v) => (Number(v) || 0);

// Component-wise markup → auto tour costing (cost + markup per line, then GST).
export function quoteTotals(quote = {}) {
  const items = quote.items || [];
  const cost = items.reduce((s, it) => s + num(it.cost), 0);
  const sell = items.reduce((s, it) => s + num(it.cost) * (1 + num(it.markupPct) / 100), 0);
  const gst = sell * (num(quote.gstPct) / 100);
  const total = sell + gst;
  const given = quote.givenPrice === "" || quote.givenPrice == null ? null : num(quote.givenPrice);
  const finalPrice = given ?? Math.round(total);
  return { cost, sell, markup: sell - cost, gst, total, finalPrice, profit: finalPrice - gst - cost };
}

// Best price to show on listings: accepted quote first, else latest quote.
export function headlineQuote(q) {
  const quotes = q.quotes || [];
  if (!quotes.length) return null;
  return quotes.find((x) => x.status === "accepted") || quotes[quotes.length - 1];
}

/* ---------------- follow-ups & payments ---------------- */

export function followUpState(f) {
  if (f.done) return "done";
  if (!f.dueAt) return "open";
  const due = new Date(f.dueAt);
  const now = new Date();
  if (due < now) return "overdue";
  if (due - now < DAY && due.getDate() === now.getDate()) return "today";
  return "open";
}

export function nextFollowUp(q) {
  const open = (q.followUps || []).filter((f) => !f.done);
  if (!open.length) return null;
  return [...open].sort((a, b) => new Date(a.dueAt || "2999-01-01") - new Date(b.dueAt || "2999-01-01"))[0];
}

export function paymentState(p) {
  if (p.paidAt) return "paid";
  if (p.dueAt && new Date(p.dueAt) < new Date()) return "overdue";
  return "upcoming";
}

export function paymentSummary(q) {
  const pays = q.payments || [];
  const total = pays.reduce((s, p) => s + num(p.amount), 0);
  const paid = pays.filter((p) => p.paidAt).reduce((s, p) => s + num(p.amount), 0);
  return { total, paid, due: total - paid };
}

/* ---------------- misc ---------------- */

export const paxLabel = (q) => {
  const a = num(q.adults), c = num(q.children);
  return `${a} adult${a === 1 ? "" : "s"}${c ? ` · ${c} child${c === 1 ? "" : "ren"}` : ""}`;
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

// Append an activity-log entry (immutable copy).
export const logActivity = (q, text) => [
  ...(q.activity || []),
  { at: new Date().toISOString(), text },
];

/* ---------------- quick-contact links & quote sharing ---------------- */

const digits = (phone = "") => String(phone).replace(/[^\d]/g, "");
export const telHref = (phone) => (phone ? `tel:${phone}` : null);
export const mailHref = (email) => (email ? `mailto:${email}` : null);
export const waHref = (phone, text = "") => {
  const d = digits(phone);
  if (!d) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

// WhatsApp-ready quote message — the agent's "share quote in one click".
export function quoteShareText(q, quote) {
  const t = quoteTotals(quote);
  const lines = [
    `Hi ${q.guest?.name || "there"}! 👋 Here's your ${q.destination} plan from MyHolidayBro:`,
    ``,
    `✈️ ${quote.title}`,
    `📅 ${fmtDate(q.startDate)} · ${q.nights || "?"} nights · ${paxLabel(q)}`,
    ``,
    ...(quote.items || []).filter((it) => it.name).map((it) => `• ${it.kind}: ${it.name}`),
    ``,
    `💰 Package price: ${money(t.finalPrice)} (all-inclusive)`,
    ``,
    `Shall we lock it in? Reply here and I'll hold the dates! 🌴`,
  ];
  return lines.join("\n");
}

/* ---------------- analytics (Sales Overview) ---------------- */

export const monthKey = (iso) => (iso || "").slice(0, 7);
export const fmtMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
};

// Last `n` month keys ending this month, oldest first.
export function lastMonths(n = 6) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

// Headline business numbers across all queries.
export function salesStats(queries = []) {
  const converted = queries.filter((q) => q.status === "Converted");
  const closedOrLost = queries.filter((q) => ["Cancelled", "Dropped"].includes(q.status));
  const decided = converted.length + closedOrLost.length;
  const booked = converted.reduce((s, q) => s + paymentSummary(q).total, 0);
  const received = converted.reduce((s, q) => s + paymentSummary(q).paid, 0);
  return {
    total: queries.length,
    converted: converted.length,
    conversionRate: decided ? Math.round((converted.length / decided) * 100) : 0,
    booked,
    received,
    pending: booked - received,
    avgDeal: converted.length ? Math.round(booked / converted.length) : 0,
  };
}

export function bySource(queries = []) {
  const map = {};
  queries.forEach((q) => { const k = q.source || "Other"; map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

export function byDestination(queries = []) {
  const map = {};
  queries.forEach((q) => { const k = q.destination || "—"; map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
