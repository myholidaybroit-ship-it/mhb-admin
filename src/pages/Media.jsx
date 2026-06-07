import { useMemo, useState } from "react";
import { useStore } from "../lib/store.jsx";
import { PageHeader, SearchInput, Badge, useToast, EmptyState } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

// Walk the whole content tree and collect every image/video URL with a path label.
function collectMedia(obj, path = "", out = []) {
  if (obj == null) return out;
  if (typeof obj === "string") {
    if (/^https?:\/\//.test(obj) && /\.(avif|jpe?g|png|webp|gif|svg|mp4|webm)(\?|$)/i.test(obj)) {
      out.push({ url: obj, path, type: /\.(mp4|webm)(\?|$)/i.test(obj) ? "video" : "image" });
    }
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => collectMedia(v, `${path}[${i}]`, out));
    return out;
  }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) collectMedia(obj[k], path ? `${path}.${k}` : k, out);
  }
  return out;
}

export default function Media() {
  const { data } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const media = useMemo(() => {
    const all = collectMedia({
      home: data.home, destinations: data.destinations, weekends: data.weekends,
      nav: data.nav, content: data.content, adventureStyles: data.adventureStyles,
    });
    // de-dupe by url, keep first path
    const seen = new Map();
    for (const m of all) if (!seen.has(m.url)) seen.set(m.url, m);
    return [...seen.values()];
  }, [data]);

  const rows = media.filter((m) => {
    if (type !== "all" && m.type !== type) return false;
    if (q && !`${m.url} ${m.path}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const copy = (url) => {
    navigator.clipboard?.writeText(url);
    toast("URL copied");
  };

  return (
    <div>
      <PageHeader title="Media Library" subtitle={`${media.length} assets referenced across the site`} />

      <div className="row-between wrap gap-3" style={{ marginBottom: "var(--sp-4)" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search media…" />
        <div className="pill-tabs">
          {[["all", "All"], ["image", "Images"], ["video", "Videos"]].map(([v, l]) => (
            <button key={v} className={`pill-tab ${type === v ? "active" : ""}`} onClick={() => setType(v)}>{l}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card"><EmptyState icon="image" title="No media found" message="Add image URLs to your content and they'll appear here." /></div>
      ) : (
        <div className="media-grid">
          {rows.map((m) => (
            <div key={m.url} className="media-card" onClick={() => copy(m.url)} title="Click to copy URL">
              <div className="media-thumb">
                {m.type === "video" ? (
                  <div className="media-video"><Icon name="newspaper" size={22} /><span>Video</span></div>
                ) : (
                  <img src={m.url} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.opacity = 0.2)} />
                )}
                <span className="media-copy"><Icon name="copy" size={14} /></span>
              </div>
              <div className="media-meta">
                <Badge tone={m.type === "video" ? "info" : "neutral"}>{m.type}</Badge>
                <span className="tiny truncate" style={{ flex: 1 }}>{m.path}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .media-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:var(--sp-4); }
        .media-card { border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; background:var(--panel); cursor:pointer; transition:box-shadow 130ms ease, transform 80ms ease; }
        .media-card:hover { box-shadow:var(--sh-2); }
        .media-card:active { transform:translateY(1px); }
        .media-thumb { position:relative; aspect-ratio:4/3; background:var(--panel-soft); }
        .media-thumb img { width:100%; height:100%; object-fit:cover; }
        .media-video { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:var(--text-3); font-size:12px; }
        .media-copy { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,.92); display:flex; align-items:center; justify-content:center; color:var(--ink); }
        .media-meta { display:flex; align-items:center; gap:8px; padding:10px 12px; }
      `}</style>
    </div>
  );
}
