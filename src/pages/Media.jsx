import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { media } from "../lib/api.js";
import { PageHeader, Button, SearchInput, Badge, IconButton, ConfirmDialog, useToast, EmptyState } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

const isVideo = (a) => a.type === "video" || /^video\//.test(a.mime || "") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(a.url || "");

function formatBytes(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Media() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [assets, setAssets] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const st = await media.status();
      const on = !!st?.data?.enabled;
      setEnabled(on);
      if (on) {
        const res = await media.list("?limit=500");
        setAssets(Array.isArray(res?.data) ? res.data : []);
      } else {
        setAssets([]);
      }
    } catch (err) {
      toast(err?.message || "Could not load media library", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const onPick = () => fileRef.current?.click();

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    try {
      await media.uploadViaServer(f, "library");
      await load();
      toast("File uploaded");
    } catch (err) {
      toast(err?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const doDelete = async (asset) => {
    try {
      await media.remove(asset._id);
      setAssets((s) => s.filter((a) => a._id !== asset._id));
      toast("File deleted");
    } catch (err) {
      toast(err?.message || "Delete failed", "error");
    }
  };

  const copy = (url) => {
    navigator.clipboard?.writeText(url);
    toast("URL copied");
  };

  const rows = useMemo(() => assets.filter((a) => {
    const t = isVideo(a) ? "video" : "image";
    if (type !== "all" && t !== type) return false;
    if (q && !`${a.name || ""} ${a.folder || ""} ${a.url || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [assets, type, q]);

  return (
    <div>
      <PageHeader title="Media Library" subtitle={`${assets.length} files in your media library`}>
        <Button variant="primary" icon="upload" onClick={onPick} disabled={!enabled || uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onFile} />
      </PageHeader>

      <div className="row-between wrap gap-3" style={{ marginBottom: "var(--sp-4)" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search media…" />
        <div className="pill-tabs">
          {[["all", "All"], ["image", "Images"], ["video", "Videos"]].map(([v, l]) => (
            <button key={v} className={`pill-tab ${type === v ? "active" : ""}`} onClick={() => setType(v)}>{l}</button>
          ))}
        </div>
      </div>

      {!enabled ? (
        <div className="card"><EmptyState icon="image" title="Media storage not configured" message="S3 storage isn't enabled on the backend, so the media library is unavailable. Configure the S3 credentials on the server to start uploading and managing assets." /></div>
      ) : loading ? (
        <div className="card"><EmptyState icon="image" title="Loading media…" message="Fetching your media library from storage." /></div>
      ) : rows.length === 0 ? (
        <div className="card"><EmptyState icon="image" title="No media found" message={assets.length ? "No assets match your search." : "Upload an image or video to get started."} /></div>
      ) : (
        <div className="media-grid">
          {rows.map((a) => {
            const video = isVideo(a);
            return (
              <div key={a._id} className="media-card">
                <div className="media-thumb" onClick={() => copy(a.url)} title="Click to copy URL">
                  {video ? (
                    <video src={a.url} muted loop playsInline preload="metadata" onMouseOver={(e) => e.currentTarget.play?.()} onMouseOut={(e) => e.currentTarget.pause?.()} />
                  ) : (
                    <img src={a.url} alt={a.alt || a.name || ""} loading="lazy" onError={(e) => (e.currentTarget.style.opacity = 0.2)} />
                  )}
                  <span className="media-copy"><Icon name="copy" size={14} /></span>
                  <span className="media-del">
                    <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(a); }} />
                  </span>
                </div>
                <div className="media-meta">
                  <Badge tone={video ? "info" : "neutral"}>{video ? "video" : "image"}</Badge>
                  <span className="tiny truncate" style={{ flex: 1 }} title={a.name}>{a.name || a.folder || a.url}</span>
                  {a.size ? <span className="tiny" style={{ color: "var(--text-3)" }}>{formatBytes(a.size)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <ConfirmDialog title="Delete file" message={`Delete "${confirm.name || confirm.url}"? This removes it from storage and cannot be undone.`}
          onConfirm={() => doDelete(confirm)} onClose={() => setConfirm(null)} />
      )}

      <style>{`
        .media-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:var(--sp-4); }
        .media-card { border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; background:var(--panel); transition:box-shadow 130ms ease; }
        .media-card:hover { box-shadow:var(--sh-2); }
        .media-thumb { position:relative; aspect-ratio:4/3; background:var(--panel-soft); cursor:pointer; }
        .media-thumb:active { transform:translateY(1px); }
        .media-thumb img, .media-thumb video { width:100%; height:100%; object-fit:cover; display:block; }
        .media-copy { position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; background:rgba(255,255,255,.92); display:flex; align-items:center; justify-content:center; color:var(--ink); }
        .media-del { position:absolute; top:8px; left:8px; }
        .media-del .icon-btn { background:rgba(255,255,255,.92); }
        .media-meta { display:flex; align-items:center; gap:8px; padding:10px 12px; }
      `}</style>
    </div>
  );
}
