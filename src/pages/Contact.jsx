import { useState } from "react";
import { useSection } from "../lib/store.jsx";
import {
  PageHeader, Button, Drawer, Field, Input, Textarea, Repeater,
  StringList, ImagePicker, ImageGrid, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

function SectionCard({ icon, title, summary, onEdit }) {
  return (
    <div className="card row-between" style={{ alignItems: "center", padding: "var(--sp-4)", marginBottom: "var(--sp-3)" }}>
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <div className="empty-ico" style={{ width: 40, height: 40, flex: "none" }}><Icon name={icon} size={18} /></div>
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div className="tiny" style={{ color: "var(--text-3)" }}>{summary}</div>
        </div>
      </div>
      <Button variant="ghost" icon="edit" onClick={onEdit}>Edit</Button>
    </div>
  );
}

const footerOf = (onClose, onSave) => (
  <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={onSave}>Save</Button></>
);

/* ---------------- Hero collage (image URL list) ---------------- */
function HeroCollageDrawer({ value, onSave, onClose }) {
  const [list, setList] = useState(() => structuredClone(value || []));
  return (
    <Drawer wide title="Hero collage" subtitle="Top-of-page image grid" onClose={onClose} footer={footerOf(onClose, () => onSave(list))}>
      <div className="col gap-4">
        <ImageGrid label="Collage images" value={list} onChange={setList} />
        <Field label="Image URLs" hint="Or add by URL — each row is one image">
          <StringList value={list} onChange={setList} placeholder="https://…" addLabel="Add image URL" />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Companions (nested items) ---------------- */
function CompanionsDrawer({ value, onSave, onClose }) {
  const [list, setList] = useState(() => structuredClone(value || []));
  return (
    <Drawer wide title="Companions" subtitle="Who you can travel with" onClose={onClose} footer={footerOf(onClose, () => onSave(list))}>
      <Repeater value={list} onChange={setList} blank={{ label: "", sub: "", icon: "", items: [] }}
        title={(i, it) => it.label || `Companion ${i + 1}`} addLabel="Add companion"
        renderItem={(it, u) => (
          <div className="col gap-3">
            <div className="form-grid">
              <Field label="Label"><Input value={it.label} onChange={(e) => u({ label: e.target.value })} /></Field>
              <Field label="Icon"><Input value={it.icon} onChange={(e) => u({ icon: e.target.value })} /></Field>
              <Field label="Sub" className="span-2"><Input value={it.sub} onChange={(e) => u({ sub: e.target.value })} /></Field>
            </div>
            <Field label="Items">
              <Repeater value={it.items || []} onChange={(items) => u({ items })} blank={{ name: "", icon: "" }}
                title={(j, x) => x.name || `Item ${j + 1}`} addLabel="Add item"
                renderItem={(x, ux) => (
                  <div className="form-grid">
                    <Field label="Name"><Input value={x.name} onChange={(e) => ux({ name: e.target.value })} /></Field>
                    <Field label="Icon"><Input value={x.icon} onChange={(e) => ux({ icon: e.target.value })} /></Field>
                  </div>
                )} />
            </Field>
          </div>
        )} />
    </Drawer>
  );
}

/* ---------------- Quick links ---------------- */
function QuickLinksDrawer({ value, onSave, onClose }) {
  const [list, setList] = useState(() => structuredClone(value || []));
  return (
    <Drawer wide title="Quick links" subtitle="Shortcut cards" onClose={onClose} footer={footerOf(onClose, () => onSave(list))}>
      <Repeater value={list} onChange={setList} blank={{ title: "", sub: "", href: "", image: "", tint: "" }}
        title={(i, it) => it.title || `Link ${i + 1}`} addLabel="Add quick link"
        renderItem={(it, u) => (
          <div className="col gap-2">
            <div className="form-grid">
              <Field label="Title"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
              <Field label="Href"><Input value={it.href} onChange={(e) => u({ href: e.target.value })} placeholder="/destinations" /></Field>
              <Field label="Sub" className="span-2"><Input value={it.sub} onChange={(e) => u({ sub: e.target.value })} /></Field>
              <Field label="Tint" hint="Background colour"><Input value={it.tint} onChange={(e) => u({ tint: e.target.value })} placeholder="#fef3c7" /></Field>
            </div>
            <ImagePicker label="Image" value={it.image} onChange={(v) => u({ image: v })} />
            <Field label="Image URL"><Input value={it.image} onChange={(e) => u({ image: e.target.value })} placeholder="https://…" /></Field>
          </div>
        )} />
    </Drawer>
  );
}

/* ---------------- Captain image (single) ---------------- */
function CaptainDrawer({ value, onSave, onClose }) {
  const [v, setV] = useState(value || "");
  return (
    <Drawer title="Captain image" subtitle="Single photo" onClose={onClose} footer={footerOf(onClose, () => onSave(v))}>
      <div className="col gap-3">
        <ImagePicker label="Captain image" value={v} onChange={setV} />
        <Field label="Image URL"><Input value={v} onChange={(e) => setV(e.target.value)} placeholder="https://…" /></Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Offices ---------------- */
function OfficesDrawer({ value, onSave, onClose }) {
  const [list, setList] = useState(() => structuredClone(value || []));
  return (
    <Drawer wide title="Offices" subtitle="Address list" onClose={onClose} footer={footerOf(onClose, () => onSave(list))}>
      <Repeater value={list} onChange={setList} blank={{ city: "", address: "" }}
        title={(i, it) => it.city || `Office ${i + 1}`} addLabel="Add office"
        renderItem={(it, u) => (
          <div className="col gap-2">
            <Field label="City"><Input value={it.city} onChange={(e) => u({ city: e.target.value })} /></Field>
            <Field label="Address"><Textarea value={it.address} onChange={(e) => u({ address: e.target.value })} rows={2} /></Field>
          </div>
        )} />
    </Drawer>
  );
}

const SECTIONS = [
  { key: "heroCollage", icon: "image", title: "Hero collage", summary: (c) => `${(c.heroCollage || []).length} image(s)`, Drawer: HeroCollageDrawer },
  { key: "companions", icon: "users", title: "Companions", summary: (c) => `${(c.companions || []).length} group(s)`, Drawer: CompanionsDrawer },
  { key: "quickLinks", icon: "compass", title: "Quick links", summary: (c) => `${(c.quickLinks || []).length} link(s)`, Drawer: QuickLinksDrawer },
  { key: "captainImage", icon: "user", title: "Captain image", summary: (c) => (c.captainImage ? "1 image" : "Not set"), Drawer: CaptainDrawer },
  { key: "offices", icon: "map", title: "Offices", summary: (c) => `${(c.offices || []).length} office(s)`, Drawer: OfficesDrawer },
];

export default function Contact() {
  const [stored, setContact] = useSection("contact");
  const toast = useToast();
  const c = stored || {};
  const [open, setOpen] = useState(null);

  const current = SECTIONS.find((s) => s.key === open);

  const save = (key, value) => {
    setContact({ ...c, [key]: value });
    toast("Saved");
    setOpen(null);
  };

  return (
    <div>
      <PageHeader title="Contact page" subtitle={`${SECTIONS.length} sections`} />
      {SECTIONS.map((s) => (
        <SectionCard key={s.key} icon={s.icon} title={s.title} summary={s.summary(c)} onEdit={() => setOpen(s.key)} />
      ))}
      {current && (
        <current.Drawer
          value={current.key === "captainImage" ? c.captainImage || "" : c[current.key] || []}
          onSave={(v) => save(current.key, v)}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
