// Reusable UI primitives for the admin. These are the "utilities" used
// across every module: buttons, fields, modals, drawers, tables, repeaters,
// string lists, image pickers, badges, tabs, etc.

import { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import Icon from "./icons.jsx";
import { media } from "../lib/api.js";

/* Read an uploaded file as a data URL (used by upload-only pickers). */
export function fileToDataURL(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

/* Downscale + compress an uploaded image to a data URL so it stays small
   enough for the browser store. Falls back to the raw data URL on error. */
export function compressImage(file, { maxW = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    fileToDataURL(file).then((dataUrl) => {
      if (!file.type.startsWith("image/") || file.type === "image/gif") return resolve(dataUrl);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / (img.width || maxW));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        try {
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  });
}

/* ---------------- Button ---------------- */
export function Button({ variant = "primary", size, icon, children, className = "", ...rest }) {
  const cls = ["btn", `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

export function IconButton({ name, size = "", className = "", title, ...rest }) {
  return (
    <button className={`icon-btn ${size} ${className}`} title={title} aria-label={title} {...rest}>
      <Icon name={name} />
    </button>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ tone = "neutral", dot, children }) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

/* ---------------- Field wrappers ---------------- */
export function Field({ label, hint, error, required, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      {label && (
        <span className="field-label">
          {label}
          {required && <span className="field-req">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Input({ invalid, prefix, ...rest }) {
  if (prefix) {
    return (
      <span className="input-affix">
        <span className="prefix">{prefix}</span>
        <input className={`input ${invalid ? "invalid" : ""}`} {...rest} />
      </span>
    );
  }
  return <input className={`input ${invalid ? "invalid" : ""}`} {...rest} />;
}

export function Textarea({ invalid, ...rest }) {
  return <textarea className={`textarea ${invalid ? "invalid" : ""}`} {...rest} />;
}

export function Select({ invalid, options = [], placeholder, children, ...rest }) {
  return (
    <select className={`select ${invalid ? "invalid" : ""}`} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const val = typeof o === "object" ? o.value : o;
        const lbl = typeof o === "object" ? o.label : o;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
      {children}
    </select>
  );
}

// Dropdown with a built-in "custom" escape hatch — pick from options or type your own.
export function ComboSelect({ value, onChange, options = [], placeholder = "Select…", customLabel = "Other (type your own)…", customPlaceholder = "Type a value" }) {
  const inList = options.some((o) => (typeof o === "object" ? o.value : o) === value);
  const [customMode, setCustomMode] = useState(!!value && !inList);
  const showCustom = customMode || (!!value && !inList);
  const sel = inList ? value : (showCustom ? "__custom__" : "");
  const onSel = (e) => {
    const v = e.target.value;
    if (v === "__custom__") { setCustomMode(true); if (inList) onChange(""); }
    else { setCustomMode(false); onChange(v); }
  };
  return (
    <div className="col gap-2">
      <Select value={sel} placeholder={placeholder} options={options} onChange={onSel}>
        <option value="__custom__">{customLabel}</option>
      </Select>
      {sel === "__custom__" && (
        <Input value={inList ? "" : value} placeholder={customPlaceholder} onChange={(e) => onChange(e.target.value)} autoFocus />
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
      {label && <span className="field-label">{label}</span>}
    </label>
  );
}

/* ---------------- Tabs ---------------- */
// Overflowing tabs are paged with ‹ › arrow buttons (no scrollbar). The active
// tab is always scrolled into view.
export function Tabs({ tabs, active, onChange }) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    sync();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => { el.removeEventListener("scroll", sync); window.removeEventListener("resize", sync); };
  }, [sync, tabs.length]);

  // keep the active tab visible when it changes
  useEffect(() => {
    const el = scrollerRef.current;
    const node = el?.querySelector(".tab.active");
    node?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const page = (dir) => scrollerRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  return (
    <div className="tabs-nav">
      <button type="button" className={`tabs-arrow ${canLeft ? "" : "is-hidden"}`} onClick={() => page(-1)} aria-label="Previous tabs">
        <Icon name="chevronLeft" size={18} />
      </button>
      <div className="tabs" role="tablist" ref={scrollerRef}>
        {tabs.map((t) => {
          const val = typeof t === "object" ? t.value : t;
          const lbl = typeof t === "object" ? t.label : t;
          return (
            <button
              key={val}
              role="tab"
              className={`tab ${active === val ? "active" : ""}`}
              onClick={(e) => { onChange(val); e.currentTarget.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }}
            >
              {lbl}
            </button>
          );
        })}
      </div>
      <button type="button" className={`tabs-arrow ${canRight ? "" : "is-hidden"}`} onClick={() => page(1)} aria-label="Next tabs">
        <Icon name="chevronRight" size={18} />
      </button>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={wide ? { width: "min(720px, calc(100vw - 32px))" } : undefined}>
        <div className="panel-head">
          <h3 className="section-title">{title}</h3>
          <IconButton name="close" size="sm" title="Close" onClick={onClose} />
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Drawer ---------------- */
export function Drawer({ title, subtitle, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`drawer ${wide ? "wide" : ""}`}>
        <div className="panel-head">
          <div>
            <h3 className="section-title">{title}</h3>
            {subtitle && <div className="section-sub">{subtitle}</div>}
          </div>
          <IconButton name="close" size="sm" title="Close" onClick={onClose} />
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Confirm dialog ---------------- */
export function ConfirmDialog({ title, message, confirmLabel = "Delete", tone = "danger", onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}

/* ---------------- Toast system ---------------- */
const ToastCtx = createContext(null);
export function useToast() {
  return useContext(ToastCtx);
}
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, msg, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="toast-wrap">
          {items.map((t) => (
            <div key={t.id} className={`toast ${t.tone}`}>
              <span className="toast-dot" />
              {t.msg}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

/* ---------------- Page header ---------------- */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="row-between" style={{ marginBottom: "var(--sp-6)", alignItems: "flex-start" }}>
      <div>
        <h1 style={{ fontSize: "var(--fs-h1)" }}>{title}</h1>
        {subtitle && <p className="muted" style={{ marginTop: 4 }}>{subtitle}</p>}
      </div>
      <div className="row gap-2">{children}</div>
    </div>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ icon = "inbox", title, message, action }) {
  return (
    <div className="empty">
      <div className="empty-ico">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="section-title">{title}</h3>
      {message && <p className="muted" style={{ marginTop: 4, maxWidth: 360, marginInline: "auto" }}>{message}</p>}
      {action && <div style={{ marginTop: "var(--sp-4)" }}>{action}</div>}
    </div>
  );
}

/* ---------------- Search input ---------------- */
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <span className="input-affix" style={{ minWidth: 220 }}>
      <span className="prefix">
        <Icon name="search" size={15} />
      </span>
      <input
        className="input"
        style={{ paddingLeft: 32 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </span>
  );
}

/* ---------------- String list (editable array of strings) ---------------- */
export function StringList({ value = [], onChange, placeholder = "Add item…", addLabel = "Add item" }) {
  const [dragIndex, setDragIndex] = useState(null);
  const update = (i, v) => onChange(value.map((x, idx) => (idx === i ? v : x)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, ""]);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <div className="string-list">
      {value.map((item, i) => (
        <div className={`string-row ${dragIndex === i ? "dragging" : ""}`} key={i}
          onDragOver={(e) => { if (dragIndex !== null) e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); reorder(dragIndex, i); setDragIndex(null); }}>
          <span className="drag-dot" draggable onDragStart={() => setDragIndex(i)} onDragEnd={() => setDragIndex(null)} title="Drag to reorder">
            <Icon name="grip" size={14} />
          </span>
          <Input value={item} placeholder={placeholder} onChange={(e) => update(i, e.target.value)} />
          <IconButton name="chevronUp" size="sm" title="Move up" onClick={() => move(i, -1)} />
          <IconButton name="chevronDown" size="sm" title="Move down" onClick={() => move(i, 1)} />
          <IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => remove(i)} />
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" icon="plus" onClick={add}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Repeater (array of objects) ---------------- */
// Supports HTML5 drag-and-drop reordering (grab the grip handle) plus
// up/down buttons. renderItem receives (item, update, index).
export function Repeater({ value = [], onChange, renderItem, blank, title = (i) => `Item ${i + 1}`, addLabel = "Add", collapsible = false }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const update = (i, patch) => onChange(value.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, typeof blank === "function" ? blank() : { ...blank }]);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const reorder = (from, to) => {
    if (from == null || to == null || from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  return (
    <div className="repeater">
      {value.map((item, i) => (
        <div
          className={`repeater-item ${dragIndex === i ? "dragging" : ""} ${overIndex === i && dragIndex !== i ? "drag-over" : ""}`}
          key={i}
          onDragOver={(e) => { if (dragIndex !== null) { e.preventDefault(); setOverIndex(i); } }}
          onDrop={(e) => { e.preventDefault(); reorder(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
        >
          <div className="repeater-item-head">
            <span
              className="repeater-handle"
              draggable
              onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              title="Drag to reorder"
            >
              <Icon name="grip" size={15} />
              {title(i, item)}
            </span>
            <div className="row gap-1">
              <IconButton name="chevronUp" size="sm" title="Move up" onClick={() => move(i, -1)} />
              <IconButton name="chevronDown" size="sm" title="Move down" onClick={() => move(i, 1)} />
              <IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => remove(i)} />
            </div>
          </div>
          {renderItem(item, (patch) => update(i, patch), i)}
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" icon="plus" onClick={add}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Image picker (upload only) ---------------- */
export function ImagePicker({ value, onChange, label = "Image", hint }) {
  const fileRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [lib, setLib] = useState(false);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    try {
      const result = await media.uploadViaServer(f, "content");
      onChange(result.url);
    } catch (err) {
      toast?.(err?.message || "Upload failed", "danger");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="img-picker">
        <button type="button" className={`img-thumb upload ${value ? "" : "empty"}`} onClick={() => fileRef.current?.click()} disabled={uploading} title="Click to upload">
          {uploading ? <span className="upload-hint"><span className="spinner" /><span className="tiny">Uploading…</span></span>
            : value ? <img src={value} alt="" /> : <span className="upload-hint"><Icon name="upload" size={20} /><span className="tiny">Upload</span></span>}
        </button>
        <div className="grow col gap-2">
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <Button variant="ghost" size="sm" icon="upload" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : value ? "Replace image" : "Upload from computer"}</Button>
            <Button variant="ghost" size="sm" icon="image" onClick={() => setLib(true)} disabled={uploading}>Choose from library</Button>
            {value && !uploading && <Button variant="ghost" size="sm" icon="trash" className="danger" onClick={() => onChange("")}>Remove</Button>}
          </div>
          {hint && <span className="field-hint">{hint}</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
      {lib && <MediaLibraryModal type="image" onPick={(m) => onChange(m.url)} onClose={() => setLib(false)} />}
    </div>
  );
}

/* ---------------- Multi image grid (computer or library) ---------------- */
export function ImageGrid({ value = [], onChange, label }) {
  const fileRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [lib, setLib] = useState(false);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const results = await Promise.all(files.map((f) => media.uploadViaServer(f, "content")));
      onChange([...value, ...results.map((r) => r.url)]);
    } catch (err) {
      toast?.(err?.message || "Upload failed", "danger");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="img-grid">
        {value.map((src, i) => (
          <div key={i} className="img-grid-item">
            {src ? <img src={src} alt="" /> : <div className="img-thumb empty" style={{ width: "100%", height: "100%" }}><Icon name="image" size={20} /></div>}
            <span className="rm">
              <IconButton name="trash" size="sm" className="danger" title="Remove" onClick={() => remove(i)} />
            </span>
          </div>
        ))}
        <button type="button" className="img-grid-add" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload from computer">
          {uploading ? <><span className="spinner" /><span className="tiny">Uploading…</span></>
            : <><Icon name="upload" size={20} /><span className="tiny">Upload</span></>}
        </button>
        <button type="button" className="img-grid-add" onClick={() => setLib(true)} disabled={uploading} title="Choose from library">
          <Icon name="image" size={20} /><span className="tiny">Library</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      {lib && <MediaLibraryModal type="image" multiple onPick={(items) => onChange([...value, ...items.map((m) => m.url)])} onClose={() => setLib(false)} />}
    </div>
  );
}

/* ---------------- Slider (range) ---------------- */
export function Slider({ value, onChange, min = 0, max = 100, step = 1, suffix = "", format }) {
  const v = Number(value) || 0;
  const pct = max === min ? 0 : ((v - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <input
        type="range" min={min} max={max} step={step} value={v}
        style={{ background: `linear-gradient(90deg, var(--accent) ${pct}%, var(--line) ${pct}%)` }}
        onChange={(e) => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
      />
      <span className="slider-val">{format ? format(v) : `${v}${suffix}`}</span>
    </div>
  );
}

/* ---------------- Stepper (− value +) ---------------- */
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix = "" }) {
  const v = Number(value) || 0;
  const set = (n) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={() => set(v - step)} disabled={v <= min} aria-label="Decrease">−</button>
      <span className="stepper-val">{v}{suffix}</span>
      <button type="button" className="stepper-btn" onClick={() => set(v + step)} disabled={v >= max} aria-label="Increase">+</button>
    </div>
  );
}

/* ---------------- Chip select (single or multi) ---------------- */
export function ChipSelect({ value, onChange, options = [], multiple = false }) {
  const isOn = (o) => (multiple ? (value || []).includes(o) : value === o);
  const toggle = (o) => {
    if (multiple) {
      const set = new Set(value || []);
      set.has(o) ? set.delete(o) : set.add(o);
      onChange([...set]);
    } else onChange(o);
  };
  return (
    <div className="chip-select">
      {options.map((o) => {
        const val = typeof o === "object" ? o.value : o;
        const lbl = typeof o === "object" ? o.label : o;
        return (
          <button type="button" key={val} className={`chip ${isOn(val) ? "on" : ""}`} onClick={() => toggle(val)}>
            {isOn(val) && multiple ? <Icon name="check" size={12} /> : null}{lbl}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Tag input (multi-value chips) ---------------- */
export function TagInput({ value = [], onChange, placeholder = "Add…" }) {
  const [draft, setDraft] = useState("");
  const add = (v) => {
    const t = (v || "").trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); }
    else if (e.key === "Backspace" && !draft && value.length) removeAt(value.length - 1);
  };
  return (
    <div className="tag-input">
      {value.map((t, i) => (
        <span className="tag-chip" key={i}>
          {t}
          <button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${t}`}>
            <Icon name="close" size={12} />
          </button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={draft}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft && add(draft)}
      />
    </div>
  );
}

/* ---------------- PDF picker (upload only) ---------------- */
export function PdfPicker({ value, name, onChange, label = "PDF attachment", hint }) {
  const fileRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [lib, setLib] = useState(false);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    try {
      const result = await media.uploadViaServer(f, "pdfs");
      onChange({ url: result.url, name: f.name });
    } catch (err) {
      toast?.(err?.message || "Upload failed", "danger");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="pdf-picker">
        <span className={`pdf-chip ${value ? "has" : ""}`}>
          {uploading ? <span className="spinner" /> : <Icon name="doc" size={16} />}
          {uploading ? "Uploading…" : value ? (name || "Attached PDF") : "No PDF attached"}
        </span>
        <div className="grow col gap-2">
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <Button variant="ghost" size="sm" icon="upload" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : value ? "Replace PDF" : "Upload from computer"}</Button>
            <Button variant="ghost" size="sm" icon="doc" onClick={() => setLib(true)} disabled={uploading}>Choose from library</Button>
            {value && !uploading ? <Button variant="ghost" size="sm" icon="trash" className="danger" onClick={() => onChange({ url: "", name: "" })}>Remove</Button> : null}
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onFile} />
          {hint && <span className="field-hint">{hint}</span>}
        </div>
      </div>
      {lib && <MediaLibraryModal type="file" onPick={(m) => onChange({ url: m.url, name: m.name || "Attached PDF" })} onClose={() => setLib(false)} />}
    </div>
  );
}

/* ---------------- Video picker (computer or library, with preview) ---------------- */
export function VideoPicker({ value, onChange, label = "Video", hint }) {
  const fileRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [lib, setLib] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e) => e.key === "Escape" && setPreview(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    try {
      const result = await media.uploadViaServer(f, "content");
      onChange(result.url);
    } catch (err) {
      toast?.(err?.message || "Upload failed", "danger");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="img-picker">
        <button type="button" className={`img-thumb upload ${value ? "" : "empty"}`} style={{ aspectRatio: "3/4", width: 96, height: "auto", position: "relative" }}
          onClick={() => (value ? setPreview(true) : fileRef.current?.click())} disabled={uploading}
          title={value ? "Play video" : "Click to upload"}>
          {uploading ? <span className="upload-hint"><span className="spinner" /><span className="tiny">Uploading…</span></span>
            : value ? (
              <>
                <video src={value} muted loop autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span className="vp-play">▶</span>
              </>
            ) : <span className="upload-hint"><Icon name="upload" size={20} /><span className="tiny">Upload</span></span>}
        </button>
        <div className="grow col gap-2">
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <Button variant="ghost" size="sm" icon="upload" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : value ? "Replace video" : "Upload from computer"}</Button>
            <Button variant="ghost" size="sm" icon="image" onClick={() => setLib(true)} disabled={uploading}>Choose from library</Button>
            {value && !uploading && <Button variant="ghost" size="sm" icon="trash" className="danger" onClick={() => onChange("")}>Remove</Button>}
          </div>
          {hint && <span className="field-hint">{hint}</span>}
        </div>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={onFile} />
      </div>
      {lib && <MediaLibraryModal type="video" onPick={(m) => onChange(m.url)} onClose={() => setLib(false)} />}
      {preview && value && createPortal(
        <div className="vp-lightbox" onMouseDown={(e) => e.target === e.currentTarget && setPreview(false)}>
          <button type="button" className="vp-lightbox-close" onClick={() => setPreview(false)} aria-label="Close"><Icon name="close" size={18} /></button>
          <video src={value} controls autoPlay playsInline />
        </div>,
        document.body
      )}
    </div>
  );
}

/* ---------------- SearchSelect (searchable combobox) ----------------
   Type to filter, click to pick. With allowCustom the typed text itself is the
   value, so it doubles as a free-text field with suggestions. */
export function SearchSelect({ value = "", onChange, options = [], placeholder = "Search…", allowCustom = false, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(null); // null = not typing, show value
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(null); } };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const opts = options.map((o) => (typeof o === "object" ? o : { value: o, label: o }));
  const text = q !== null ? q : (opts.find((o) => o.value === value)?.label ?? value ?? "");
  const ql = (q || "").toLowerCase();
  const filtered = q ? opts.filter((o) => o.label.toLowerCase().includes(ql)) : opts;

  const pick = (o) => {
    onChange(o.value);
    onPick?.(o);
    setQ(null);
    setOpen(false);
  };

  return (
    <div className="sselect" ref={ref}>
      <input
        className="input"
        value={text}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          if (allowCustom) onChange(e.target.value);
        }}
      />
      <span className="sselect-caret" onClick={() => setOpen((o) => !o)}><Icon name="chevronDown" size={15} /></span>
      {open && filtered.length > 0 && (
        <div className="sselect-pop">
          {filtered.slice(0, 60).map((o) => (
            <button type="button" key={o.value} className={`sselect-opt ${o.value === value ? "on" : ""}`} onMouseDown={(e) => { e.preventDefault(); pick(o); }}>
              <span className="grow truncate">{o.label}</span>
              {o.hint && <span className="tiny" style={{ color: "var(--text-3)" }}>{o.hint}</span>}
              {o.value === value && <Icon name="check" size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- DatePicker (calendar popover) ----------------
   Stores ISO yyyy-mm-dd. A friendly calendar instead of the native input. */
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function DatePicker({ value, onChange, placeholder = "Pick a date" }) {
  const [open, setOpen] = useState(false);
  const sel = value ? new Date(value) : null;
  const valid = sel && !Number.isNaN(+sel);
  const [view, setView] = useState(() => (valid ? new Date(sel.getFullYear(), sel.getMonth(), 1) : (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); })()));
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const today = new Date();
  const firstDay = (view.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const moveMonth = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));
  const isSame = (d, x) => x && d === x.getDate() && view.getMonth() === x.getMonth() && view.getFullYear() === x.getFullYear();

  const label = valid
    ? sel.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="dpick" ref={ref}>
      <button type="button" className={`dpick-btn ${valid ? "" : "empty"}`} onClick={() => setOpen((o) => !o)}>
        <Icon name="calendar" size={15} />
        <span className="grow" style={{ textAlign: "left" }}>{label || placeholder}</span>
        {valid && (
          <span className="dpick-clear" onClick={(e) => { e.stopPropagation(); onChange(""); }} title="Clear"><Icon name="close" size={13} /></span>
        )}
      </button>
      {open && (
        <div className="dpick-pop">
          <div className="dpick-head">
            <button type="button" className="dpick-nav" onClick={() => moveMonth(-1)}><Icon name="chevronLeft" size={15} /></button>
            <b>{MONTH_NAMES[view.getMonth()]} {view.getFullYear()}</b>
            <button type="button" className="dpick-nav" onClick={() => moveMonth(1)}><Icon name="chevronRight" size={15} /></button>
          </div>
          <div className="dpick-grid">
            {WEEKDAYS.map((w) => <span key={w} className="dpick-wd">{w}</span>)}
            {cells.map((d, i) => d === null
              ? <span key={`x${i}`} />
              : (
                <button type="button" key={d}
                  className={`dpick-day ${isSame(d, valid ? sel : null) ? "sel" : ""} ${isSame(d, today) ? "today" : ""}`}
                  onClick={() => { onChange(toISO(new Date(view.getFullYear(), view.getMonth(), d))); setOpen(false); }}>
                  {d}
                </button>
              ))}
          </div>
          <div className="dpick-foot">
            <button type="button" className="dpick-link" onClick={() => { onChange(toISO(today)); setView(new Date(today.getFullYear(), today.getMonth(), 1)); setOpen(false); }}>Today</button>
            <button type="button" className="dpick-link" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Media library browser ----------------
   Every picker offers "Upload from computer" OR "Choose from library".
   This modal is the library half: browse/search everything ever uploaded
   (the S3-backed media collection), pick one (or many), or upload right here —
   uploads always land in the library either way. */
const LIB_ACCEPT = { image: "image/*", video: "video/*", file: "application/pdf" };

export function MediaLibraryModal({ type, multiple = false, onPick, onClose }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [items, setItems] = useState(null); // null = loading
  const [q, setQ] = useState("");
  const [sel, setSel] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      media.list(`?${params}`)
        .then((r) => { if (alive) setItems(r?.data || []); })
        .catch((e) => { if (alive) { setItems([]); toast(e?.message || "Couldn't load the media library", "error"); } });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type]);

  const isSel = (m) => sel.some((x) => x._id === m._id);
  const toggle = (m) => {
    if (!multiple) return setSel(isSel(m) ? [] : [m]);
    setSel((s) => (s.some((x) => x._id === m._id) ? s.filter((x) => x._id !== m._id) : [...s, m]));
  };

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const up = await Promise.all(files.map((f) => media.uploadViaServer(f, type === "file" ? "pdfs" : "content")));
      setItems((list) => [...up, ...(list || [])]);
      setSel((s) => (multiple ? [...s, ...up] : [up[0]]));
    } catch (err) {
      toast(err?.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const confirm = () => {
    if (!sel.length) return toast("Select something first", "error");
    onPick(multiple ? sel : sel[0]);
    onClose();
  };

  return (
    <Modal wide title="Media library" onClose={onClose}
      footer={
        <>
          <span className="tiny" style={{ marginRight: "auto", color: "var(--text-3)" }}>
            {sel.length ? `${sel.length} selected` : `${items?.length ?? "…"} item(s) in library`}
          </span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={confirm} disabled={!sel.length}>
            Use selected{multiple && sel.length > 1 ? ` (${sel.length})` : ""}
          </Button>
        </>
      }>
      <div className="col gap-3">
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search by file name…" />
          <Button variant="secondary" size="sm" icon="upload" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload from computer"}
          </Button>
          <input ref={fileRef} type="file" accept={LIB_ACCEPT[type] || undefined} multiple={multiple} hidden onChange={onFiles} />
        </div>

        {items === null ? (
          <div className="medialib-empty"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="medialib-empty">
            <Icon name="image" size={22} />
            <span className="tiny">{q ? "No matches — try another search." : "Library is empty. Upload your first file."}</span>
          </div>
        ) : (
          <div className="medialib-grid">
            {items.map((m) => (
              <button type="button" key={m._id} className={`medialib-item ${isSel(m) ? "on" : ""}`} onClick={() => toggle(m)} title={m.name}>
                {m.type === "image" ? (
                  <img src={m.url} alt={m.alt || m.name} loading="lazy" />
                ) : m.type === "video" ? (
                  <video src={m.url} muted loop playsInline preload="metadata" />
                ) : (
                  <span className="medialib-doc"><Icon name="doc" size={22} /></span>
                )}
                <span className="medialib-name truncate">{m.name || m.key}</span>
                <span className="medialib-check"><Icon name="check" size={13} /></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
