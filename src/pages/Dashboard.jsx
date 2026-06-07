import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { Badge, Button } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

/* ============================================================
   Chart primitives — all hand-built SVG, no dependencies
   ============================================================ */

const PAL = ["#ffde5f", "#f4c430", "#e8b21f", "#caa44a", "#1f1d17", "#4a463b", "#7a7363", "#b3ab95"];

function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

function AreaChart({ data, height = 210, fmt = (v) => v }) {
  const W = 680, H = height, padL = 46, padR = 14, padT = 18, padB = 30;
  const vals = data.map((d) => d.value);
  const max = Math.max(...vals, 1), min = 0;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i) => padL + (i / (data.length - 1 || 1)) * innerW;
  const y = (v) => padT + innerH - ((v - min) / (max - min || 1)) * innerH;
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = smoothPath(pts);
  const area = `${line} L ${x(data.length - 1)} ${padT + innerH} L ${padL} ${padT + innerH} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffde5f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffde5f" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {grid.map((g, i) => {
        const gy = padT + innerH - g * innerH;
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3 4"} />
            <text x={padL - 8} y={gy + 3} textAnchor="end" fontSize="9" fill="var(--text-3)">{fmt(min + g * (max - min))}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke="#e0a91b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        data[i].dot !== false ? <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="#fff" stroke="#e0a91b" strokeWidth="2" /> : null
      ))}
      {data.map((d, i) => d.label ? (
        <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="9" fill="var(--text-3)">{d.label}</text>
      ) : null)}
    </svg>
  );
}

function BarChart({ data, height = 210, fmt = (v) => v }) {
  const W = 680, H = height, padL = 40, padR = 12, padT = 18, padB = 38;
  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const bw = innerW / data.length;
  const grid = [0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="100%" stopColor="#f0bd24" />
        </linearGradient>
        <filter id="barShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(224,169,27,0.35)" />
        </filter>
      </defs>
      {grid.map((g, i) => {
        const gy = padT + innerH - g * innerH;
        return <line key={i} x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />;
      })}
      <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke="var(--line)" strokeWidth="1" />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const bx = padL + i * bw + bw * 0.16, bWidth = bw * 0.68, by = padT + innerH - h;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={bWidth} height={Math.max(h, 1)} rx="5" fill="url(#barFill)" filter="url(#barShadow)" />
            <text x={bx + bWidth / 2} y={by - 5} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink)">{d.value}</text>
            <text x={bx + bWidth / 2} y={H - 22} textAnchor="middle" fontSize="8.5" fill="var(--text-2)">{d.short || d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arcPath(cx, cy, r, start, end) {
  const [sx, sy] = polar(cx, cy, r, end);
  const [ex, ey] = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 0 ${ex} ${ey}`;
}
function Gauge({ value, max = 100, label, color = "#e0a91b", size = 110 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 9;
  const START = -130, SWEEP = 260;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div className="gauge">
      <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.82}`}>
        <path d={arcPath(cx, cy, r, START, START + SWEEP)} fill="none" stroke="var(--line)" strokeWidth="9" strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, START, START + SWEEP * frac)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
        <text x={cx} y={cy + 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--ink)">{Math.round(frac * 100)}%</text>
      </svg>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

function shade(hex, amt) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p) + r; g = Math.round((t - g) * p) + g; b = Math.round((t - b) * p) + b;
  return `rgb(${r},${g},${b})`;
}

let DONUT_SEQ = 0;
function Donut({ segments, size = 150, stroke = 16, centerTop, centerSub }) {
  const uid = useMemo(() => `dn${++DONUT_SEQ}`, []);
  const list = segments.filter((s) => s.value > 0);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // crisp hairline gap between segments (butt caps) — only when >1 slice
  const gap = list.length > 1 ? 5 : 0;
  let acc = 0;
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {list.map((s, i) => (
            <linearGradient key={i} id={`${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={shade(s.color, 0.16)} />
              <stop offset="100%" stopColor={s.color} />
            </linearGradient>
          ))}
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={stroke} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {list.map((s, i) => {
            const len = (s.value / total) * c;
            const dash = Math.max(0.5, len - gap);
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${uid}-${i})`}
                strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-(acc + gap / 2)} />
            );
            acc += len;
            return el;
          })}
        </g>
      </svg>
      <div className="donut-center">
        <div className="donut-top">{centerTop ?? total}</div>
        {centerSub && <div className="donut-sub">{centerSub}</div>}
      </div>
    </div>
  );
}

function Legend({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="legend">
      {segments.map((s, i) => (
        <div className="legend-row" key={i}>
          <span className="legend-dot" style={{ background: `linear-gradient(135deg, ${shade(s.color, 0.25)}, ${s.color})` }} />
          <span className="legend-label">{s.label}</span>
          <span className="legend-val">{s.value}</span>
          <span className="legend-pill" style={{ color: shade(s.color, -0.32), background: shade(s.color, 0.84) }}>
            {Math.round((s.value / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function HBar({ label, value, max, suffix = "" }) {
  const pct = max ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div className="hbar">
      <span className="hbar-label truncate">{label}</span>
      <div className="hbar-track"><div className="hbar-fill" style={{ width: `${pct}%` }} /></div>
      <span className="hbar-val">{value}{suffix}</span>
    </div>
  );
}

/* ============================================================ */
const num = (s) => parseInt(String(s ?? "").replace(/[^\d]/g, ""), 10) || 0;
const fmtINR = (n) => "₹" + n.toLocaleString("en-IN");

function Stat({ icon, value, label, to, tone = "accent", foot, meterPct, meterColor = "var(--accent)" }) {
  return (
    <Link to={to} className={`xstat tone-${tone}`}>
      <div className="xstat-top">
        <span className="xstat-ico"><Icon name={icon} size={20} /></span>
        <Icon name="chevronRight" size={16} className="xstat-arrow" />
      </div>
      <div className="xstat-num">{value}</div>
      <div className="xstat-label">{label}</div>
      {meterPct != null && (
        <div className="xstat-meter"><div className="xstat-meter-fill" style={{ width: `${meterPct}%`, background: meterColor }} /></div>
      )}
      {foot && <div className="xstat-foot">{foot}</div>}
    </Link>
  );
}

export default function Dashboard() {
  const { data } = useStore();

  const m = useMemo(() => {
    const dest = data.destinations || [], wk = data.weekends || [], it = data.itineraries || [], enq = data.enquiries || [];

    const regionSeg = [
      { label: "India", value: dest.filter((d) => d.region === "India").length, color: "#ffde5f" },
      { label: "International", value: dest.filter((d) => d.region === "International").length, color: "#1f1d17" },
    ];
    const wkSeg = [
      { label: "Filling fast", value: wk.filter((w) => w.statusTone === "hot").length, color: "#dc2626" },
      { label: "Book now", value: wk.filter((w) => w.statusTone === "ok").length, color: "#15803d" },
      { label: "Few left", value: wk.filter((w) => w.statusTone === "low").length, color: "#c2410c" },
    ];
    const enqSeg = [
      { label: "New", value: enq.filter((e) => e.status === "New").length, color: "#1d4ed8" },
      { label: "In progress", value: enq.filter((e) => e.status === "In progress").length, color: "#c2410c" },
      { label: "Closed", value: enq.filter((e) => e.status === "Closed").length, color: "#15803d" },
    ];

    // theme distribution
    const themeMap = {};
    dest.forEach((d) => (d.themes || []).forEach((t) => (themeMap[t] = (themeMap[t] || 0) + 1)));
    const themeBars = Object.entries(themeMap).sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, short: label.split(" ")[0], value }));

    // price ladder (sorted from-price across catalog, in ₹'000)
    const priceLadder = [...dest].map((d) => num(d.fromPrice)).filter(Boolean).sort((a, b) => a - b)
      .map((v, i, arr) => ({ value: Math.round(v / 1000), label: i === 0 || i === arr.length - 1 || i === Math.floor(arr.length / 2) ? `#${i + 1}` : "", dot: false }));

    // top destinations by reviews
    const topReviews = [...dest].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 6);
    const maxReviews = Math.max(...topReviews.map((d) => d.reviews || 0), 1);

    const finalIt = it.filter((x) => x.status === "Final").length;
    const draftIt = it.length - finalIt;
    const pipeline = it.reduce((s, x) => s + num(x.priceLabel), 0);
    const totalPax = it.reduce((s, x) => s + (parseInt(x.pax) || 0), 0);
    const withPackages = dest.filter((d) => (d.packages || []).length).length;
    const wkOpen = wk.filter((w) => w.statusTone !== "hot").length;
    const closedEnq = enq.filter((e) => e.status === "Closed").length;
    const avgRating = dest.length ? (dest.reduce((s, d) => s + (d.rating || 0), 0) / dest.length).toFixed(2) : "—";

    return {
      dest, wk, it, enq, regionSeg, wkSeg, enqSeg, themeBars, priceLadder, topReviews, maxReviews,
      finalIt, draftIt, pipeline, totalPax, withPackages, wkOpen, closedEnq, avgRating,
    };
  }, [data]);

  const newEnq = m.enq.filter((e) => e.status === "New").length;
  const tone = { New: "info", "In progress": "warning", Closed: "success" };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const quick = [
    { to: "/itineraries", icon: "doc", label: "Generate itinerary PDF", desc: "Build a client trip" },
    { to: "/destinations", icon: "map", label: "Add destination", desc: "Grow the catalog" },
    { to: "/weekends", icon: "calendar", label: "Add weekend trip", desc: "Short getaways" },
    { to: "/library", icon: "sparkle", label: "Manage library", desc: "Places & hotels" },
    { to: "/moments", icon: "star", label: "Add a moment", desc: "Videos & reviews" },
  ];

  return (
    <div className="dash">
      {/* page header */}
      <div className="row-between" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--fs-h1)" }}>Dashboard</h1>
          <p className="muted" style={{ marginTop: 4 }}>Everything that powers the {data.settings?.brandName || "MyHolidayBro"} website, in one place.</p>
        </div>
        <div className="row gap-2">
          <Link to="/destinations"><Button variant="ghost" icon="map">Add destination</Button></Link>
          <Link to="/itineraries"><Button variant="primary" icon="plus">New itinerary</Button></Link>
        </div>
      </div>

      {/* primary stats with meters */}
      <div className="xstat-grid">
        <Stat icon="doc" value={m.it.length} label="Itineraries" to="/itineraries" tone="accent"
          meterPct={pct(m.finalIt, m.it.length)} meterColor="#15803d"
          foot={<span><b className="up">{m.finalIt}</b> final · {m.draftIt} draft</span>} />
        <Stat icon="map" value={m.dest.length} label="Destinations" to="/destinations" tone="ink"
          meterPct={pct(m.withPackages, m.dest.length)}
          foot={<span>{m.withPackages}/{m.dest.length} with packages</span>} />
        <Stat icon="calendar" value={m.wk.length} label="Weekend trips" to="/weekends" tone="ink"
          meterPct={pct(m.wkOpen, m.wk.length)} meterColor="#15803d"
          foot={<span>{m.wkSeg[0].value} filling fast</span>} />
        <Stat icon="inbox" value={m.enq.length} label="Enquiries" to="/enquiries" tone="accent"
          meterPct={pct(m.closedEnq, m.enq.length)} meterColor="#15803d"
          foot={newEnq ? <span><b className="up">{newEnq}</b> new to review</span> : <span>All caught up</span>} />
      </div>

      {/* pipeline band */}
      <div className="pipeline-band">
        {[
          { ico: "tag", n: fmtINR(m.pipeline), l: "Quoted pipeline value" },
          { ico: "sparkle", n: data.places?.length || 0, l: "Places in library" },
          { ico: "home", n: data.hotels?.length || 0, l: "Hotels saved" },
          { ico: "doc", n: data.blocks?.length || 0, l: "Content blocks" },
          { ico: "users", n: data.users?.length || 0, l: "Users" },
        ].map((p, i, arr) => (
          <div className="pl-item" key={i}>
            <span className="pl-ico"><Icon name={p.ico} size={18} /></span>
            <div><div className="pl-num">{p.n}</div><div className="pl-label">{p.l}</div></div>
            {i < arr.length - 1 && <span className="pl-sep" />}
          </div>
        ))}
      </div>

      {/* area + gauges */}
      <div className="grid-2-1">
        <div className="card">
          <div className="row-between"><div><h3 className="section-title">Price spread across the catalog</h3><div className="section-sub">From-price of every destination, sorted (₹ thousands)</div></div><Badge tone="accent">{m.dest.length} trips</Badge></div>
          <div style={{ marginTop: 10 }}><AreaChart data={m.priceLadder} fmt={(v) => `${Math.round(v)}k`} /></div>
        </div>
        <div className="card">
          <h3 className="section-title">Catalog health</h3>
          <div className="gauge-grid">
            <Gauge value={m.finalIt} max={m.it.length || 1} label="Itineraries finalised" color="#15803d" />
            <Gauge value={m.withPackages} max={m.dest.length || 1} label="Have packages" color="#e0a91b" />
            <Gauge value={m.wkOpen} max={m.wk.length || 1} label="Weekends bookable" color="#1d4ed8" />
            <Gauge value={m.closedEnq} max={m.enq.length || 1} label="Enquiries closed" color="#7a7363" />
          </div>
        </div>
      </div>

      {/* bar chart + region donut */}
      <div className="grid-2-1">
        <div className="card">
          <div className="row-between"><h3 className="section-title">Destinations by adventure theme</h3><Link to="/adventure-styles" className="see-link">Manage styles</Link></div>
          <div style={{ marginTop: 10 }}><BarChart data={m.themeBars} /></div>
        </div>
        <div className="card chart-card">
          <div className="row-between"><h3 className="section-title">By region</h3><Link to="/destinations" className="see-link">View all</Link></div>
          <div className="chart-body"><Donut segments={m.regionSeg} centerTop={m.dest.length} centerSub="trips" /><Legend segments={m.regionSeg} /></div>
        </div>
      </div>

      {/* 3 donuts / ranked */}
      <div className="chart-row">
        <div className="card chart-card">
          <div className="row-between"><div className="card-head"><span className="card-head-ico"><Icon name="calendar" size={15} /></span><h3 className="section-title">Weekend availability</h3></div><Link to="/weekends" className="see-link">View all</Link></div>
          <div className="chart-body"><Donut segments={m.wkSeg} centerTop={m.wk.length} centerSub="trips" /><Legend segments={m.wkSeg} /></div>
        </div>
        <div className="card chart-card">
          <div className="row-between"><div className="card-head"><span className="card-head-ico"><Icon name="inbox" size={15} /></span><h3 className="section-title">Enquiry status</h3></div><Link to="/enquiries" className="see-link">View all</Link></div>
          <div className="chart-body"><Donut segments={m.enqSeg} centerTop={m.enq.length} centerSub="total" /><Legend segments={m.enqSeg} /></div>
        </div>
        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}><div className="card-head"><span className="card-head-ico"><Icon name="star" size={15} /></span><h3 className="section-title">Most reviewed</h3></div><Link to="/destinations" className="see-link">View all</Link></div>
          <div className="review-list">
            {m.topReviews.map((d, i) => (
              <div className="review-row" key={d.slug}>
                <span className={`review-rank ${i === 0 ? "gold" : ""}`}>{i + 1}</span>
                <img className="review-thumb" src={d.image} alt="" />
                <div className="review-main">
                  <div className="review-name truncate">{d.name}</div>
                  <div className="review-track"><div className="review-fill" style={{ width: `${Math.max(6, Math.round(((d.reviews || 0) / m.maxReviews) * 100))}%` }} /></div>
                </div>
                <span className="review-val">{d.reviews || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* recent itineraries + enquiries */}
      <div className="dash-grid">
        <div className="card">
          <div className="row-between" style={{ marginBottom: "var(--sp-4)" }}><h3 className="section-title">Recent itineraries</h3><Link to="/itineraries" className="see-link">View all</Link></div>
          {m.it.slice(0, 4).map((i) => (
            <Link to="/itineraries" key={i.id} className="lrow">
              <img className="lrow-thumb" src={i.heroImage} alt="" />
              <div className="grow truncate"><div className="lrow-title truncate">{i.title || "Untitled"}</div><div className="tiny truncate">{i.clientName || "—"} · {i.dateRangeLabel || `${(i.days || []).length} days`}</div></div>
              {i.priceLabel && <span className="lrow-price">₹{i.priceLabel}</span>}
              <Badge tone={i.status === "Final" ? "success" : "warning"} dot>{i.status}</Badge>
            </Link>
          ))}
          {!m.it.length && <p className="muted">No itineraries yet.</p>}
        </div>
        <div className="card">
          <div className="row-between" style={{ marginBottom: "var(--sp-4)" }}><h3 className="section-title">Recent enquiries</h3>{newEnq > 0 && <Badge tone="accent">{newEnq} new</Badge>}</div>
          {m.enq.slice(0, 4).map((e) => (
            <Link to="/enquiries" key={e.id} className="enq-row">
              <span className="avatar" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>{e.name.charAt(0)}</span>
              <div className="grow truncate"><div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">{e.subject}</div><div className="tiny truncate">{e.name} · {e.createdAt}</div></div>
              <Badge tone={tone[e.status]}>{e.status}</Badge>
            </Link>
          ))}
          {!m.enq.length && <p className="muted">No enquiries yet.</p>}
          <div className="mt-4"><Link to="/enquiries"><Button variant="ghost" size="sm">View all enquiries</Button></Link></div>
        </div>
      </div>

      {/* quick actions */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: "var(--sp-4)" }}><h3 className="section-title">Quick actions</h3></div>
        <div className="quick-grid">
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className="quick-tile">
              <span className="quick-ico"><Icon name={q.icon} size={18} /></span>
              <span className="quick-text"><span className="quick-label">{q.label}</span><span className="quick-desc">{q.desc}</span></span>
              <Icon name="chevronRight" size={15} />
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .dash { display:flex; flex-direction:column; gap: var(--sp-6); }

        .xstat-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: var(--sp-4); }
        @media (max-width: 920px){ .xstat-grid{ grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px){ .xstat-grid{ grid-template-columns: 1fr; } }
        .xstat { display:block; background: var(--panel); border:1px solid var(--line); border-radius: var(--r-xl); padding: 18px; transition: box-shadow 140ms ease, transform 90ms ease, border-color 140ms ease; }
        .xstat:hover { box-shadow: var(--sh-2); border-color:#ddd6c4; transform: translateY(-1px); }
        .xstat-top { display:flex; align-items:center; justify-content:space-between; }
        .xstat-ico { width:42px; height:42px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; }
        .tone-accent .xstat-ico { background: var(--accent); color: var(--ink); }
        .tone-ink .xstat-ico { background: var(--ink); color: var(--accent); }
        .xstat-arrow { color: var(--text-3); }
        .xstat-num { font-size:30px; font-weight:700; letter-spacing:-0.02em; margin-top:12px; color: var(--ink); }
        .xstat-label { font-size:13px; color: var(--text-2); font-weight:500; }
        .xstat-meter { height:6px; border-radius:999px; background: var(--panel-soft); overflow:hidden; margin-top:11px; }
        .xstat-meter-fill { height:100%; border-radius:999px; transition: width 500ms ease; }
        .xstat-foot { font-size:11.5px; color: var(--text-3); margin-top:8px; }
        .xstat-foot .up { color: var(--success); font-weight:700; }

        .pipeline-band { display:flex; align-items:center; gap:0; background: var(--panel); border:1px solid var(--line); border-radius: var(--r-xl); padding: 16px 14px; flex-wrap:wrap; }
        .pl-item { position:relative; display:flex; align-items:center; gap:11px; flex:1; min-width:150px; padding: 4px 16px; }
        .pl-ico { width:38px; height:38px; border-radius:11px; background: var(--accent-soft); color: var(--accent-ink); display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .pl-num { font-size:18px; font-weight:700; letter-spacing:-0.01em; }
        .pl-label { font-size:11.5px; color: var(--text-2); }
        .pl-sep { position:absolute; right:0; top:50%; transform:translateY(-50%); width:1px; height:34px; background: var(--line); }
        @media (max-width: 720px){ .pl-sep{ display:none; } .pl-item{ min-width:45%; } }

        .grid-2-1 { display:grid; grid-template-columns: 2fr 1fr; gap: var(--sp-6); }
        @media (max-width: 980px){ .grid-2-1{ grid-template-columns: 1fr; } }
        .chart-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-6); }
        @media (max-width: 980px){ .chart-row{ grid-template-columns: 1fr; } }

        .gauge-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px; }
        .gauge { display:flex; flex-direction:column; align-items:center; padding: 6px 4px; }
        .gauge-label { font-size:11px; color: var(--text-2); text-align:center; margin-top:2px; }

        .chart-card { padding: var(--sp-5); }
        .chart-body { display:flex; align-items:center; gap: var(--sp-5); margin-top: var(--sp-4); }
        .card-head { display:flex; align-items:center; gap:9px; }
        .card-head-ico { width:28px; height:28px; border-radius:8px; background: var(--accent-soft); color: var(--accent-ink); display:inline-flex; align-items:center; justify-content:center; flex:none; }

        .donut-wrap { position:relative; flex:none; }
        .donut-wrap::before { content:""; position:absolute; inset:18px; border-radius:50%; background: radial-gradient(circle, rgba(255,222,95,0.14), transparent 72%); }
        .donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .donut-top { font-size:30px; font-weight:700; letter-spacing:-0.03em; color: var(--ink); }
        .donut-sub { font-size:10.5px; color: var(--text-3); margin-top:-2px; text-transform:uppercase; letter-spacing:0.06em; }
        .legend { flex:1; display:flex; flex-direction:column; gap:5px; min-width:0; }
        .legend-row { display:flex; align-items:center; gap:9px; font-size:12.5px; padding:6px 8px; border-radius:10px; transition: background 130ms ease; }
        .legend-row:hover { background: var(--panel-soft); }
        .legend-dot { width:11px; height:11px; border-radius:4px; flex:none; box-shadow: 0 1px 2px rgba(17,17,17,0.18); }
        .legend-label { color: var(--text); font-weight:500; flex:1; }
        .legend-val { font-weight:700; font-size:13px; }
        .legend-pill { font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; min-width:42px; text-align:center; }

        .review-list { display:flex; flex-direction:column; }
        .review-row { display:flex; align-items:center; gap:11px; padding:9px 0; border-bottom:1px solid var(--line-soft); }
        .review-row:last-child { border-bottom:none; }
        .review-rank { width:22px; height:22px; border-radius:999px; background: var(--panel-soft); color: var(--text-2); font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .review-rank.gold { background: linear-gradient(180deg, #ffe480, #f3c331); color: var(--ink); box-shadow: 0 2px 6px rgba(243,195,49,0.4); }
        .review-thumb { width:36px; height:36px; border-radius:10px; object-fit:cover; background: var(--panel-soft); flex:none; }
        .review-main { flex:1; min-width:0; }
        .review-name { font-size:12.5px; font-weight:600; margin-bottom:6px; }
        .review-track { height:7px; border-radius:999px; background: var(--line-soft); overflow:hidden; }
        .review-fill { height:100%; border-radius:999px; background: linear-gradient(90deg, #ffe27a, #f0bd24); box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); transition: width 600ms cubic-bezier(.22,1,.36,1); }
        .review-val { font-size:13px; font-weight:700; color: var(--accent-ink); width:42px; text-align:right; flex:none; }
        .see-link { font-size:12px; font-weight:600; color: var(--text-2); }
        .see-link:hover { color: var(--ink); }

        .hbar { display:flex; align-items:center; gap:12px; padding:8px 0; }
        .hbar-label { font-size:12.5px; font-weight:600; width:90px; flex:none; color: var(--ink); }
        .hbar-track { flex:1; height:11px; border-radius:999px; background: var(--line-soft); overflow:hidden; box-shadow: inset 0 1px 2px rgba(17,17,17,0.05); }
        .hbar-fill { height:100%; border-radius:999px; transition: width 600ms cubic-bezier(.22,1,.36,1);
          background: linear-gradient(90deg, #ffe27a, #f0bd24); box-shadow: inset 0 1px 0 rgba(255,255,255,0.55); }
        .hbar-val { font-size:12.5px; font-weight:700; color: var(--accent-ink); width:42px; text-align:right; }

        .dash-grid { display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-6); }
        @media (max-width: 860px){ .dash-grid{ grid-template-columns:1fr; } }
        .lrow, .enq-row { display:flex; align-items:center; gap:11px; padding:10px 0; border-bottom:1px solid var(--line-soft); }
        .lrow:last-of-type, .enq-row:last-of-type { border-bottom:none; }
        .lrow:hover, .enq-row:hover { background: var(--panel-soft); }
        .lrow-thumb { width:46px; height:36px; border-radius:8px; object-fit:cover; background: var(--panel-soft); flex:none; }
        .lrow-title { font-weight:600; font-size:13px; }
        .lrow-price { font-weight:700; font-size:12.5px; }

        .quick-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; }
        @media (max-width: 760px){ .quick-grid{ grid-template-columns:1fr 1fr; } }
        @media (max-width: 480px){ .quick-grid{ grid-template-columns:1fr; } }
        .quick-tile { display:flex; align-items:center; gap:11px; padding:12px 13px; border:1px solid var(--line); border-radius:var(--r-md); transition:background 130ms ease, border-color 130ms ease; }
        .quick-tile:hover { background:var(--panel-soft); border-color:#ddd6c4; }
        .quick-ico { width:36px; height:36px; border-radius:10px; background:var(--accent-soft); color:var(--accent-ink); display:inline-flex; align-items:center; justify-content:center; flex:none; }
        .quick-text { flex:1; display:flex; flex-direction:column; }
        .quick-label { font-size:13px; font-weight:600; }
        .quick-desc { font-size:11px; color: var(--text-3); }
      `}</style>
    </div>
  );
}
