import { useEffect, useState } from "react";
import { useStore, useSection, uid } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Drawer, Field, Input, Textarea, Button, IconButton, Badge,
  ConfirmDialog, useToast, ImagePicker, VideoPicker, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

function StarPicker({ value = 5, onChange }) {
  return (
    <div className="star-pick">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} className={`star ${n <= value ? "on" : ""}`} onClick={() => onChange(n)} aria-label={`${n} star`}>★</button>
      ))}
    </div>
  );
}

/* ---------------- Video testimonial editor ---------------- */
function VideoEditor({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [v, setV] = useState(() => value || { id: uid("v"), name: "", dest: "", quote: "", video: "", poster: "" });
  const set = (p) => setV((s) => ({ ...s, ...p }));
  const save = () => {
    if (!v.name.trim()) return toast("Name is required", "error");
    upsert("testimonials", v);
    toast(value ? "Video saved" : "Video added");
    onClose();
  };
  return (
    <Drawer title={value ? v.name || "Edit video" : "New video testimonial"} subtitle={v.dest ? `${v.dest} testimonial` : "Traveller video"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save video</Button></>}>
      <div className="col gap-5">
        <VideoPicker label="Video" value={v.video} onChange={(url) => set({ video: url })} hint="Upload a short .mp4 clip" />
        <ImagePicker label="Poster image (optional)" value={v.poster} onChange={(x) => set({ poster: x })} hint="Thumbnail shown before play" />
        <div className="form-grid">
          <Field label="Traveller name" required><Input value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="Aishwarya" /></Field>
          <Field label="Destination tag"><Input value={v.dest} onChange={(e) => set({ dest: e.target.value })} placeholder="Bali" /></Field>
        </div>
        <Field label="Short quote"><Textarea value={v.quote} onChange={(e) => set({ quote: e.target.value })} placeholder="Felt like a private concierge planned every minute." /></Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Traveller story / postcard editor ---------------- */
function StoryEditor({ value, onClose }) {
  const { upsert } = useStore();
  const toast = useToast();
  const [m, setM] = useState(() => value || { id: uid("m"), initial: "", name: "", city: "", caption: "", destination: "", duration: "", rating: 5, title: "", review: "", date: "", image: "" });
  const set = (p) => setM((s) => ({ ...s, ...p }));
  const onName = (name) => set({ name, initial: m.initial || (name ? name[0].toUpperCase() : "") });
  const save = () => {
    if (!m.name.trim()) return toast("Name is required", "error");
    upsert("moments", { ...m, initial: (m.initial || m.name[0] || "?").toUpperCase() });
    toast(value ? "Story saved" : "Story added");
    onClose();
  };
  return (
    <Drawer wide title={value ? m.name || "Edit story" : "New traveller story"} subtitle={m.caption || "Postcard review"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save story</Button></>}>
      <div className="col gap-5">
        <ImagePicker label="Photo" value={m.image} onChange={(x) => set({ image: x })} hint="The postcard image shown in the gallery" />
        <div className="form-grid">
          <Field label="Traveller name" required><Input value={m.name} onChange={(e) => onName(e.target.value)} placeholder="Hari" /></Field>
          <Field label="City"><Input value={m.city} onChange={(e) => set({ city: e.target.value })} placeholder="Mumbai" /></Field>
          <Field label="Avatar initial"><Input value={m.initial} maxLength={2} onChange={(e) => set({ initial: e.target.value.toUpperCase() })} placeholder="H" /></Field>
          <Field label="Date"><Input value={m.date} onChange={(e) => set({ date: e.target.value })} placeholder="Feb 2026" /></Field>
          <Field label="Trip label" className="span-2" hint="Short caption on the card"><Input value={m.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="7 Day Bali deep dive" /></Field>
          <Field label="Destination(s)" hint="Separate with ·"><Input value={m.destination} onChange={(e) => set({ destination: e.target.value })} placeholder="Ubud · Seminyak · Uluwatu" /></Field>
          <Field label="Duration"><Input value={m.duration} onChange={(e) => set({ duration: e.target.value })} placeholder="7 Days · 6 Nights" /></Field>
        </div>
        <Field label="Rating"><StarPicker value={m.rating} onChange={(n) => set({ rating: n })} /></Field>
        <Field label="Review title"><Input value={m.title} onChange={(e) => set({ title: e.target.value })} placeholder="My first solo trip and they nailed it" /></Field>
        <Field label="Review"><Textarea value={m.review} onChange={(e) => set({ review: e.target.value })} rows={4} placeholder="Ubud was my favourite — monkey forest, rice terraces…" /></Field>
      </div>
    </Drawer>
  );
}

/* Fullscreen video lightbox — Esc or click outside to close. */
function VideoLightbox({ video, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="m-lightbox" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <button type="button" className="m-lightbox-close" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
      <div className="m-lightbox-body">
        <video src={video.video} controls autoPlay playsInline poster={video.poster || undefined} />
        <div className="m-lightbox-cap">
          <strong>{video.name}</strong>
          {video.dest && <span className="m-pill">{video.dest}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Moments() {
  const { data, remove } = useStore();
  const [settings, setSettings] = useSection("settings");
  const [tab, setTab] = useState("videos");
  const [editV, setEditV] = useState(null);
  const [newV, setNewV] = useState(false);
  const [editM, setEditM] = useState(null);
  const [newM, setNewM] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, item }
  const [playing, setPlaying] = useState(null); // video being played

  const videos = data.testimonials || [];
  const stories = data.moments || [];

  return (
    <div>
      <PageHeader title="Moments" subtitle="Traveller videos, stories and reviews — straight from the trips.">
        <Button variant="primary" icon="plus" onClick={() => (tab === "videos" ? setNewV(true) : setNewM(true))}>
          {tab === "videos" ? "New video" : "New story"}
        </Button>
      </PageHeader>

      {/* Google rating badge editor */}
      <div className="card row-between gap-4" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <span className="goog-badge">G</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>Google rating badge</div>
            <div className="tiny">Shown on the “Straight from our travellers” hero</div>
          </div>
        </div>
        <div className="row gap-3">
          <Field label="Rating /5"><Input style={{ width: 90 }} value={settings.googleRating || ""} onChange={(e) => setSettings({ ...settings, googleRating: e.target.value })} placeholder="4.6" /></Field>
          <Field label="Reviews"><Input style={{ width: 120 }} value={settings.googleReviews || ""} onChange={(e) => setSettings({ ...settings, googleReviews: e.target.value })} placeholder="1,000" /></Field>
        </div>
      </div>

      <div className="mt-6">
        <Tabs active={tab} onChange={setTab} tabs={[
          { value: "videos", label: `Video testimonials (${videos.length})` },
          { value: "stories", label: `Traveller stories (${stories.length})` },
        ]} />
      </div>

      <div className="mt-5">
        {tab === "videos" && (
          videos.length === 0 ? <EmptyState icon="image" title="No videos yet" message="Add a traveller video testimonial." action={<Button variant="secondary" icon="plus" onClick={() => setNewV(true)}>New video</Button>} /> : (
            <div className="m-grid">
              {videos.map((v) => (
                <div className="m-vcard" key={v.id} onClick={() => setEditV(v)}>
                  <div className="m-vmedia">
                    {v.video ? <video src={v.video} muted loop autoPlay playsInline /> : (v.poster ? <img src={v.poster} alt="" /> : <div className="m-empty"><Icon name="image" size={24} /></div>)}
                    {v.video && (
                      <button type="button" className="m-play" title="Play with sound"
                        onClick={(e) => { e.stopPropagation(); setPlaying(v); }}>▶</button>
                    )}
                    <div className="m-tools" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="m-del" title="Remove" onClick={() => setConfirm({ type: "video", item: v })}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                  <div className="m-vbody">
                    <strong className="truncate">{v.name}</strong>
                    {v.dest ? <span className="m-pill">{v.dest}</span> : null}
                    {v.quote ? <p className="tiny truncate-2" style={{ margin: 0, color: "var(--text-2)" }}>“{v.quote}”</p> : null}
                  </div>
                </div>
              ))}
              <button type="button" className="m-add" onClick={() => setNewV(true)}><Icon name="plus" size={22} /><span>Add video</span></button>
            </div>
          )
        )}

        {tab === "stories" && (
          stories.length === 0 ? <EmptyState icon="image" title="No stories yet" message="Add a traveller story / postcard review." action={<Button variant="secondary" icon="plus" onClick={() => setNewM(true)}>New story</Button>} /> : (
            <div className="m-grid">
              {stories.map((m) => (
                <div className="m-scard" key={m.id} onClick={() => setEditM(m)}>
                  <div className="m-simg">
                    {m.image ? <img src={m.image} alt="" /> : <div className="m-empty"><Icon name="image" size={24} /></div>}
                    {m.date ? <span className="m-date">{m.date}</span> : null}
                    <div className="m-tools" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="m-del" title="Remove" onClick={() => setConfirm({ type: "story", item: m })}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                  <div className="m-sbody">
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <span className="m-avatar">{m.initial || (m.name || "?")[0]}</span>
                      <div style={{ minWidth: 0 }}>
                        <strong className="truncate" style={{ display: "block" }}>{m.name}</strong>
                        <span className="tiny">{m.city}</span>
                      </div>
                      <span className="m-stars">{"★".repeat(m.rating || 0)}</span>
                    </div>
                    <div className="truncate" style={{ fontWeight: 600 }}>{m.title}</div>
                    {m.destination ? <span className="tiny truncate">◉ {m.destination}</span> : null}
                  </div>
                </div>
              ))}
              <button type="button" className="m-add" onClick={() => setNewM(true)}><Icon name="plus" size={22} /><span>Add story</span></button>
            </div>
          )
        )}
      </div>

      {playing && <VideoLightbox video={playing} onClose={() => setPlaying(null)} />}
      {(newV || editV) && <VideoEditor value={editV} onClose={() => { setNewV(false); setEditV(null); }} />}
      {(newM || editM) && <StoryEditor value={editM} onClose={() => { setNewM(false); setEditM(null); }} />}
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.type}`}
          message={`Delete “${confirm.item.name || "this item"}”? This cannot be undone.`}
          onConfirm={() => remove(confirm.type === "video" ? "testimonials" : "moments", confirm.item.id)}
          onClose={() => setConfirm(null)}
        />
      )}

      <style>{`
        .goog-badge { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid var(--line); font-weight:800; font-size:20px; box-shadow:var(--sh-1); color:#4285F4; }
        .star-pick { display:flex; gap:4px; }
        .star-pick .star { font-size:26px; color:var(--line); background:none; border:none; cursor:pointer; line-height:1; padding:0; transition:color .12s; }
        .star-pick .star.on { color:var(--accent-hover); }
        .m-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:var(--sp-4); }
        .m-vcard, .m-scard { border:1px solid var(--line); border-radius:var(--r-lg); background:var(--surface); overflow:hidden; cursor:pointer; transition:box-shadow .15s, transform .15s; }
        .m-vcard:hover, .m-scard:hover { box-shadow:var(--sh-3); transform:translateY(-2px); }
        .m-vmedia { position:relative; aspect-ratio:3/4; background:var(--panel-soft); }
        .m-simg { position:relative; aspect-ratio:4/3; background:var(--panel-soft); }
        .m-vmedia video, .m-vmedia img, .m-simg img { width:100%; height:100%; object-fit:cover; display:block; }
        .m-empty { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-3); }
        .m-play { position:absolute; inset:0; margin:auto; width:42px; height:42px; border-radius:50%; border:none; cursor:pointer; background:rgba(255,255,255,.85); display:flex; align-items:center; justify-content:center; color:var(--ink); font-size:14px; transition: transform .12s ease, background .12s ease; }
        .m-play:hover { background:#fff; transform:scale(1.12); }
        .m-lightbox { position:fixed; inset:0; z-index:100; background:rgba(17,17,17,.86); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:28px; }
        .m-lightbox-close { position:absolute; top:18px; right:18px; width:40px; height:40px; border-radius:50%; border:none; background:rgba(255,255,255,.14); color:#fff; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .m-lightbox-close:hover { background:rgba(255,255,255,.28); }
        .m-lightbox-body { display:flex; flex-direction:column; gap:12px; align-items:center; max-width:min(420px, 92vw); }
        .m-lightbox-body video { width:100%; max-height:76vh; border-radius:18px; background:#000; box-shadow:0 24px 70px rgba(0,0,0,.5); }
        .m-lightbox-cap { display:flex; align-items:center; gap:10px; color:#fff; font-size:14px; }
        .m-tools { position:absolute; top:8px; right:8px; }
        .m-del { width:28px; height:28px; border-radius:var(--r-sm); background:rgba(255,255,255,.92); border:1px solid var(--line); color:var(--text-2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .m-del:hover { color:var(--danger); border-color:var(--danger); }
        .m-date { position:absolute; top:8px; left:8px; font-size:11px; font-weight:600; padding:3px 8px; border-radius:var(--r-pill); background:rgba(0,0,0,.55); color:#fff; }
        .m-vbody, .m-sbody { padding:var(--sp-3); display:flex; flex-direction:column; gap:6px; }
        .m-pill { align-self:flex-start; font-size:11px; font-weight:600; padding:2px 9px; border-radius:var(--r-pill); background:var(--accent-soft); color:var(--accent-ink); }
        .m-avatar { width:30px; height:30px; border-radius:50%; background:var(--ink); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex:none; }
        .m-stars { margin-left:auto; color:var(--accent-hover); font-size:13px; letter-spacing:1px; white-space:nowrap; }
        .truncate-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .m-add { min-height:230px; border:2px dashed var(--line); border-radius:var(--r-lg); background:var(--panel-soft); color:var(--text-3); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-weight:600; font-size:var(--fs-sm); transition:all .15s; }
        .m-add:hover { border-color:var(--accent-ink); color:var(--accent-ink); background:var(--accent-soft); }
      `}</style>
    </div>
  );
}
