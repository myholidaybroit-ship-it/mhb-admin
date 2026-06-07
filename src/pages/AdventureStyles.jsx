import { useState } from "react";
import { useSection, useStore } from "../lib/store.jsx";
import { PageHeader, useToast, Button } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

export default function AdventureStyles() {
  const [styles, setStyles] = useSection("adventureStyles");
  const { data } = useStore();
  const toast = useToast();
  const set = (patch) => setStyles({ ...(styles || {}), ...patch });

  const list = styles?.styles || [];
  const setList = (v) => set({ styles: v });
  const update = (i, patch) => setList(list.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i) => setList(list.filter((_, idx) => idx !== i));
  const add = () => setList([...list, { name: "", tagline: "", image: "" }]);
  const [dragIndex, setDragIndex] = useState(null);
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    const n = [...list];
    const [m] = n.splice(from, 1);
    n.splice(to, 0, m);
    setList(n);
  };

  // count of destinations per theme (mirrors front-end behaviour)
  const countFor = (name) => data.destinations.filter((d) => (d.themes || []).includes(name)).length;

  // file → data URL upload (no URL typing required)
  const upload = (i) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => update(i, { image: String(r.result) });
      r.readAsDataURL(f);
    };
    inp.click();
  };

  return (
    <div>
      <PageHeader title="Adventure Styles" subtitle="The themed travel-style grid and its intro copy.">
        <Button variant="ghost" icon="check" onClick={() => toast("Saved")}>Saved automatically</Button>
      </PageHeader>

      <div className="card col gap-4">
        <div className="row-between" style={{ alignItems: "center" }}>
          <h3 className="section-title">Styles</h3>
          <span className="tiny" style={{ color: "var(--text-3)" }}>Name must match a destination theme to link trips</span>
        </div>

        <div className="style-grid">
          {list.map((it, i) => (
            <div
              key={i}
              className={`style-card ${dragIndex === i ? "dragging" : ""}`}
              onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); reorder(dragIndex, i); setDragIndex(null); }}
            >
              <div className="style-media" onClick={() => upload(i)} title="Click to upload an image">
                {it.image ? <img src={it.image} alt="" /> : (
                  <div className="style-media-empty"><Icon name="upload" size={22} /><span>Click to upload</span></div>
                )}
                <div className="style-media-tools" onClick={(e) => e.stopPropagation()}>
                  <span className="style-grip" draggable onDragStart={() => setDragIndex(i)} onDragEnd={() => setDragIndex(null)} title="Drag to reorder"><Icon name="grip" size={14} /></span>
                  <button type="button" className="style-del" title="Remove" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
                </div>
                {it.name && <span className="style-trips">{countFor(it.name)} trips</span>}
              </div>
              <div className="style-body">
                <input className="style-name" value={it.name} placeholder="Style name" onChange={(e) => update(i, { name: e.target.value })} />
                <input className="style-sub" value={it.tagline} placeholder="Short sub-description" onChange={(e) => update(i, { tagline: e.target.value })} />
              </div>
            </div>
          ))}

          <button type="button" className="style-add" onClick={add}>
            <Icon name="plus" size={22} />
            <span>Add style</span>
          </button>
        </div>
      </div>

      <style>{`
        .style-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:var(--sp-4); }
        .style-card { border:1px solid var(--line); border-radius:var(--r-lg); background:var(--surface); overflow:hidden; transition:box-shadow .15s; }
        .style-card:hover { box-shadow:var(--sh-3); }
        .style-card.dragging { opacity:.5; }
        .style-media { position:relative; aspect-ratio:16/10; background:var(--panel-soft); cursor:pointer; }
        .style-media img { width:100%; height:100%; object-fit:cover; display:block; }
        .style-media-empty { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:var(--text-3); font-size:var(--fs-sm); }
        .style-media:hover .style-media-empty { color:var(--accent-ink); }
        .style-media-tools { position:absolute; top:8px; right:8px; display:flex; gap:6px; }
        .style-grip, .style-del { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:var(--r-sm); background:rgba(255,255,255,.92); border:1px solid var(--line); color:var(--text-2); cursor:pointer; }
        .style-grip { cursor:grab; }
        .style-del:hover { color:var(--danger); border-color:var(--danger); }
        .style-trips { position:absolute; bottom:8px; left:8px; font-size:11px; font-weight:700; padding:3px 9px; border-radius:var(--r-pill); background:var(--accent); color:var(--accent-ink); }
        .style-body { padding:var(--sp-3); display:flex; flex-direction:column; gap:8px; }
        .style-name { border:none; outline:none; font-size:var(--fs-lg); font-weight:600; background:none; color:var(--text); font-family:inherit; padding:0; }
        .style-sub { border:none; outline:none; font-size:var(--fs-sm); background:none; color:var(--text-2); font-family:inherit; padding:0; }
        .style-name::placeholder, .style-sub::placeholder { color:var(--text-3); }
        .style-url { display:flex; align-items:center; gap:6px; border-top:1px solid var(--line-soft); padding-top:8px; margin-top:2px; color:var(--text-3); cursor:text; }
        .style-url input { flex:1; border:none; outline:none; background:none; font-size:var(--fs-xs); color:var(--text-2); font-family:inherit; padding:0; }
        .style-add { min-height:230px; border:2px dashed var(--line); border-radius:var(--r-lg); background:var(--panel-soft); color:var(--text-3); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-weight:600; font-size:var(--fs-sm); transition:all .15s; }
        .style-add:hover { border-color:var(--accent-ink); color:var(--accent-ink); background:var(--accent-soft); }
      `}</style>
    </div>
  );
}
