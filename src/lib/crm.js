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

// "2026-11" (from <input type=month> / website forms) → "Nov 2026".
export const fmtTravelMonth = (ym) => {
  if (!ym) return "";
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
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

// Random reference id for a new query, e.g. "MHB-7K2F9Q".
export function genRefId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `MHB-${s}`;
}

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

// WhatsApp-ready message for a CUSTOM PACKAGE — the full personalised plan,
// day by day, ready to paste into the traveller's chat.
export function packageShareText(p = {}) {
  const t = p.traveller || {};
  const days = p.days || [];
  const nights = num(p.nights);
  const lines = [];

  lines.push(`Hi ${t.name || "there"}! 🌴`);
  lines.push(`Here's your *personalised ${p.destination || "trip"} plan* from MyHolidayBro ✨`);
  lines.push("");
  lines.push(`*${p.title || `${p.destination} Custom Package`}*`);
  lines.push(`📅 ${fmtDate(p.startDate)} · ${nights}N/${nights + 1}D · ${paxLabel(p)}`);

  if (days.length) {
    lines.push("");
    lines.push(`*Your day-by-day plan*`);
    days.forEach((d, i) => {
      lines.push("");
      lines.push(`*Day ${i + 1}${d.title ? ` — ${d.title}` : ""}*`);
      (d.activities || []).filter(Boolean).forEach((a) => lines.push(`• ${a}`));
      const extras = [d.stay && `🏨 ${d.stay}`, d.meals && `🍽 ${d.meals}`].filter(Boolean);
      if (extras.length) lines.push(extras.join("  ·  "));
    });
  }

  if (p.transport) {
    lines.push("");
    lines.push(`🚗 *Transport:* ${p.transport}`);
  }
  if ((p.inclusions || []).filter(Boolean).length) {
    lines.push("");
    lines.push(`✅ *Included*`);
    p.inclusions.filter(Boolean).forEach((x) => lines.push(`• ${x}`));
  }
  if ((p.exclusions || []).filter(Boolean).length) {
    lines.push("");
    lines.push(`❌ *Not included*`);
    p.exclusions.filter(Boolean).forEach((x) => lines.push(`• ${x}`));
  }

  if (p.price) {
    lines.push("");
    lines.push(`💰 *Total: ${p.price}*${p.priceNote ? ` _(${p.priceNote})_` : ""}`);
    if (p.advance) lines.push(`To lock the dates: ${p.advance} advance`);
  }
  if (p.notes) {
    lines.push("");
    lines.push(p.notes);
  }
  lines.push("");
  lines.push(`Reply here and we'll lock it in! 🔒✈️`);
  return lines.join("\n");
}

/* ================================================================
   PACKAGE BUILDER — the K1-style calculator (Basic → Hotels →
   Transport → Sightseeing → Remarks → Pricing → WhatsApp/Itinerary).
   A "package" is stored in the `customPackages` collection.
   ================================================================ */

// Supplier currencies with an indicative INR conversion rate (editable per package).
export const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee (INR)", symbol: "₹", rate: 1 },
  { code: "THB", label: "฿ Thai Baht (THB)", symbol: "฿", rate: 2.6 },
  { code: "IDR", label: "Rp Indonesian Rupiah (IDR)", symbol: "Rp", rate: 0.0052 },
  { code: "AED", label: "د.إ UAE Dirham (AED)", symbol: "AED", rate: 23 },
  { code: "USD", label: "$ US Dollar (USD)", symbol: "$", rate: 84 },
  { code: "EUR", label: "€ Euro (EUR)", symbol: "€", rate: 91 },
  { code: "SGD", label: "$ Singapore Dollar (SGD)", symbol: "S$", rate: 63 },
  { code: "MYR", label: "RM Malaysian Ringgit (MYR)", symbol: "RM", rate: 18 },
];
export const currencyMeta = (code) => CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];

export const MEAL_PLANS = ["CP", "MAP", "AP", "EP", "Breakfast", "Half Board", "All-inclusive"];
export const STAR_CATEGORIES = ["3 Star", "4 Star", "5 Star", "Boutique", "Resort", "Homestay", "Villa"];
export const TRANSFER_BASIS = ["Private", "SIC"];
export const PACKAGE_STATUSES = ["draft", "approved", "converted", "rejected"];

// Format an amount in a foreign currency, e.g. "27,950.00 THB".
export const fcMoney = (n, code = "INR") => {
  const v = Number(n) || 0;
  const m = currencyMeta(code);
  if (code === "INR") return money(v);
  return `${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${m.code}`;
};

// Per-line auto cost (in the package currency). Each line keeps its own editable
// `cost`; these helpers recompute the suggested cost from catalog unit prices.
export const hotelLineCost = (h = {}) =>
  num(h.nights) * (num(h.price) * num(h.rooms) + num(h.exAdultPrice) * num(h.exAdult) + num(h.exChildPrice) * num(h.exChild));
export const transportLineCost = (t = {}) => num(t.price); // flat per transfer (override for SIC × persons)
export const sightLineCost = (s = {}) => num(s.adultPrice) * num(s.adults) + num(s.childPrice) * num(s.children);

// Total persons on a package (adults + children).
export const packagePax = (p = {}) => num(p.adults) + num(p.children);

// Full costing for a package: supplier total → INR via rate, + per-person
// service charge, optional markup % and GST. givenInr overrides the grand total.
export function packageTotals(p = {}) {
  const pricing = p.pricing || {};
  const rate = pricing.rate == null || pricing.rate === "" ? 1 : num(pricing.rate);
  const hotels = (p.hotels || []).reduce((s, h) => s + num(h.cost), 0);
  const transport = (p.transport || []).reduce((s, t) => s + num(t.cost), 0);
  const sightseeing = (p.sightseeing || []).reduce((s, x) => s + num(x.cost), 0);
  const totalForeign = hotels + transport + sightseeing;

  const markup = totalForeign * (num(pricing.markupPct) / 100);
  const foreignWithMarkup = totalForeign + markup;
  const inrBase = foreignWithMarkup * rate;

  const pax = packagePax(p) || 1;
  const serviceTotal = num(pricing.serviceChargePerPerson) * pax;

  const gst = pricing.includeGst ? (inrBase + serviceTotal) * (num(pricing.gstPct) / 100) : 0;
  const computed = inrBase + serviceTotal + gst;

  const given = pricing.givenInr === "" || pricing.givenInr == null ? null : num(pricing.givenInr);
  const grandInr = given ?? Math.round(computed);
  const perPersonInr = Math.round(grandInr / pax);

  return {
    byKind: { hotels, transport, sightseeing },
    totalForeign, markup, foreignWithMarkup, inrBase, serviceTotal, gst,
    grandInr, perPersonInr, pax,
  };
}

// "5 Adult" / "5 Adult, 1 Child" — the K1 person label.
export const personLabel = (p = {}) => {
  const a = num(p.adults), c = num(p.children);
  return `${a} Adult${a === 1 ? "" : "s"}${c ? `, ${c} Child${c === 1 ? "" : "ren"}` : ""}`;
};

// 1 → "1st", 2 → "2nd", 11 → "11th" …
export const ordinal = (k) => {
  const s = ["th", "st", "nd", "rd"];
  const v = k % 100;
  return `${k}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// Group hotel lines into accommodation rows for the itinerary view, computing a
// running night label ("1st", "2nd"…). Returns the rows ready for the table.
export function packageAccommodation(p = {}) {
  let night = 0;
  return (p.hotels || []).map((h) => {
    const n = Math.max(1, num(h.nights));
    const from = night + 1;
    const to = night + n;
    night = to;
    const label = from === to ? `${ordinal(from)} Night` : `${ordinal(from)}–${ordinal(to)} Nights`;
    return {
      id: h.id, nightLabel: label, nights: n,
      hotel: h.name, category: h.category, roomType: h.roomType,
      city: h.city, rooms: num(h.rooms), meal: h.mealPlan, checkin: h.checkin,
      pax: personLabel(p),
    };
  });
}

// WhatsApp-ready package message in the K1 format — the agent's one-click share.
export function packageWhatsAppText(p = {}) {
  const c = p.customer || {};
  const t = packageTotals(p);
  const L = [];

  L.push(`*Your ${p.destination || "Holiday"} Package*`);
  L.push("");
  if (p.refId) { L.push(`Ref. No.: ${p.refId}`); L.push(""); }
  L.push(`Dear ${c.name || "Guest"}, as per our discussion, please find the package details below.`);
  L.push("");
  L.push(`*Travel Date: ${fmtDate(p.travelDate)}*`);
  L.push(`Total Person (${personLabel(p)})`);

  const hotels = (p.hotels || []).filter((h) => h.name);
  if (hotels.length) {
    L.push("");
    hotels.forEach((h) => {
      const cat = h.category ? ` ${h.category}` : "";
      const room = h.roomType ? ` – ${h.roomType}` : "";
      const rooms = num(h.rooms) ? ` – ${num(h.rooms)} room${num(h.rooms) === 1 ? "" : "s"}` : "";
      L.push(`${num(h.nights)} Nights ${h.city || ""} (${h.name}${cat}${room}${rooms})`.replace(/\s+/g, " ").trim());
    });
  }

  const sights = (p.sightseeing || []).filter((s) => s.name);
  L.push("");
  L.push(`*Includes*`);
  if (hotels.some((h) => /breakfast|cp|map|ap/i.test(h.mealPlan || ""))) L.push(`✨Breakfast`);
  sights.forEach((s) => {
    const basis = s.basis ? ` ${s.basis}` : "";
    L.push(`✨${s.name}${basis} (${personLabel(p)})`);
  });

  const transfers = (p.transport || []).filter((x) => x.name);
  if (transfers.length) {
    L.push("");
    L.push(`*Transfer*`);
    transfers.forEach((x) => L.push(`✨${x.name}`));
  }

  if ((p.inclusions || []).filter(Boolean).length) {
    (p.inclusions || []).filter(Boolean).forEach((x) => L.push(`✨${x}`));
  }

  L.push("");
  L.push(`*All transfers on private basis and sightseeing on SIC basis.*`);

  if (p.remarks) { L.push(""); L.push(p.remarks); }

  L.push("");
  const gstWord = p.pricing?.includeGst ? "Including" : "Excluding";
  L.push(`*Total Package cost ${money(t.grandInr).replace("₹", "")}/- INR ${gstWord} GST*`);
  L.push("");
  L.push(`😍 Tentative Package cost ${money(t.perPersonInr).replace("₹", "")}/- INR per person 😍`);
  return L.join("\n");
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
