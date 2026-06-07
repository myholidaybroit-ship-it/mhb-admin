import { useState } from "react";
import { useSection } from "../lib/store.jsx";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Textarea, Repeater,
  StringList, IconButton, ConfirmDialog, useToast, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";
import DataTable from "../ui/DataTable.jsx";

const slugify = (s = "") => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const footerOf = (onClose, onSave) => (
  <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={onSave}>Save</Button></>
);

/* ---------------- FAQ category editor (drawer) ---------------- */
function CategoryEditor({ value, onSave, onClose }) {
  const toast = useToast();
  const [c, setC] = useState(() => value || { id: "", title: "", items: [] });
  const set = (p) => setC((s) => ({ ...s, ...p }));
  const save = () => {
    if (!c.title.trim()) return toast("Category title is required", "error");
    onSave({ ...c, id: c.id || slugify(c.title) });
    onClose();
  };
  return (
    <Drawer wide title={value ? c.title || "Edit category" : "New FAQ category"} subtitle={`${(c.items || []).length} question(s)`} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>Save category</Button></>}>
      <div className="col gap-5">
        <Field label="Category title" required hint="Section heading on the FAQ page"><Input value={c.title} onChange={(e) => set({ title: e.target.value })} placeholder="Bookings & Quotes" /></Field>
        <Field label="Questions" hint="Drag to reorder — order matches the FAQ page">
          <Repeater value={c.items || []} onChange={(items) => set({ items })} blank={{ q: "", a: "" }}
            title={(i, it) => it.q || `Question ${i + 1}`} addLabel="Add question"
            renderItem={(it, u) => (
              <div className="col gap-3">
                <Field label="Question"><Input value={it.q} onChange={(e) => u({ q: e.target.value })} placeholder="How do I get a trip quote?" /></Field>
                <Field label="Answer"><Textarea value={it.a} onChange={(e) => u({ a: e.target.value })} rows={4} /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Page intro editor (drawer) ---------------- */
function IntroEditor({ intro, onSave, onClose }) {
  const [i, setI] = useState(() => structuredClone(intro || {}));
  const set = (p) => setI((s) => ({ ...s, ...p }));
  return (
    <Drawer title="FAQ page header" subtitle="Help-centre hero copy" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={() => { onSave(i); onClose(); }}>Save header</Button></>}>
      <div className="col gap-4">
        <Field label="Eyebrow"><Input value={i.eyebrow || ""} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="Help centre" /></Field>
        <Field label="Title"><Input value={i.title || ""} onChange={(e) => set({ title: e.target.value })} placeholder="Frequently asked questions." /></Field>
        <Field label="Subtitle"><Textarea value={i.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} rows={3} /></Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Trip-detail content lists ---------------- */
// Generic drawer wrapping a single edit body; the parent passes the saved value back.

function StringListDrawer({ title, subtitle, value, placeholder, addLabel, onSave, onClose }) {
  const [list, setList] = useState(() => structuredClone(value || []));
  return (
    <Drawer wide title={title} subtitle={subtitle} onClose={onClose} footer={footerOf(onClose, () => onSave(list))}>
      <StringList value={list} onChange={setList} placeholder={placeholder} addLabel={addLabel} />
    </Drawer>
  );
}

function RepeaterDrawer({ title, subtitle, value, blank, itemTitle, addLabel, fields, onSave, onClose }) {
  const [list, setList] = useState(() => structuredClone(value || []));
  return (
    <Drawer wide title={title} subtitle={subtitle} onClose={onClose} footer={footerOf(onClose, () => onSave(list))}>
      <Repeater value={list} onChange={setList} blank={blank} title={itemTitle} addLabel={addLabel} renderItem={fields} />
    </Drawer>
  );
}

function ScalarDrawer({ title, subtitle, label, hint, value, onSave, onClose }) {
  const [v, setV] = useState(value || "");
  return (
    <Drawer title={title} subtitle={subtitle} onClose={onClose} footer={footerOf(onClose, () => onSave(v))}>
      <Field label={label} hint={hint}><Input value={v} onChange={(e) => setV(e.target.value)} /></Field>
    </Drawer>
  );
}

// Each entry: how to render its editor drawer + a summary for the row.
const CONTENT_LISTS = {
  inclusions: {
    title: "Inclusions", group: "destination", summary: (v) => `${(v || []).length} item(s)`,
    render: (value, onSave, onClose) => <StringListDrawer title="Inclusions" subtitle="What's included" value={value} placeholder="Daily breakfast" addLabel="Add inclusion" onSave={onSave} onClose={onClose} />,
  },
  exclusions: {
    title: "Exclusions", group: "destination", summary: (v) => `${(v || []).length} item(s)`,
    render: (value, onSave, onClose) => <StringListDrawer title="Exclusions" subtitle="What's not included" value={value} placeholder="Airfare" addLabel="Add exclusion" onSave={onSave} onClose={onClose} />,
  },
  usps: {
    title: "USPs", group: "destination", summary: (v) => `${(v || []).length} item(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="USPs" subtitle="Selling points" value={value} blank={{ title: "", desc: "" }}
        itemTitle={(i, it) => it.title || `USP ${i + 1}`} addLabel="Add USP"
        fields={(it, u) => (
          <div className="col gap-2">
            <Field label="Title"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
            <Field label="Description"><Textarea value={it.desc} onChange={(e) => u({ desc: e.target.value })} rows={2} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  reviews: {
    title: "Reviews", group: "destination", summary: (v) => `${(v || []).length} review(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Reviews" subtitle="Trip reviews" value={value} blank={{ name: "", initials: "", city: "", rating: "", title: "", body: "", when: "" }}
        itemTitle={(i, it) => it.name || `Review ${i + 1}`} addLabel="Add review"
        fields={(it, u) => (
          <div className="col gap-2">
            <div className="form-grid">
              <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
              <Field label="Initials"><Input value={it.initials} onChange={(e) => u({ initials: e.target.value })} /></Field>
              <Field label="City"><Input value={it.city} onChange={(e) => u({ city: e.target.value })} /></Field>
              <Field label="Rating"><Input value={it.rating} onChange={(e) => u({ rating: e.target.value })} /></Field>
              <Field label="When"><Input value={it.when} onChange={(e) => u({ when: e.target.value })} /></Field>
              <Field label="Title"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
            </div>
            <Field label="Body"><Textarea value={it.body} onChange={(e) => u({ body: e.target.value })} rows={3} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  cancellation: {
    title: "Cancellation", group: "destination", summary: (v) => `${(v || []).length} row(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Cancellation" subtitle="Refund policy rows" value={value} blank={{ window: "", refund: "" }}
        itemTitle={(i, it) => it.window || `Row ${i + 1}`} addLabel="Add row"
        fields={(it, u) => (
          <div className="form-grid">
            <Field label="Window"><Input value={it.window} onChange={(e) => u({ window: e.target.value })} /></Field>
            <Field label="Refund"><Input value={it.refund} onChange={(e) => u({ refund: e.target.value })} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  payment: {
    title: "Payment", group: "destination", summary: (v) => `${(v || []).length} item(s)`,
    render: (value, onSave, onClose) => <StringListDrawer title="Payment" subtitle="Payment terms" value={value} placeholder="50% on booking" addLabel="Add term" onSave={onSave} onClose={onClose} />,
  },
  ageLimit: {
    title: "Age limit", group: "destination", summary: (v) => v || "Not set", scalar: true,
    render: (value, onSave, onClose) => <ScalarDrawer title="Age limit" subtitle="Single line" label="Age limit" hint="e.g. 18+ only" value={value} onSave={onSave} onClose={onClose} />,
  },
  cancellationTiers: {
    title: "Cancellation tiers", group: "destination", summary: (v) => `${(v || []).length} tier(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Cancellation tiers" subtitle="Tiered refunds" value={value} blank={{ window: "", pct: "", tone: "" }}
        itemTitle={(i, it) => it.window || `Tier ${i + 1}`} addLabel="Add tier"
        fields={(it, u) => (
          <div className="form-grid">
            <Field label="Window"><Input value={it.window} onChange={(e) => u({ window: e.target.value })} /></Field>
            <Field label="Percent"><Input value={it.pct} onChange={(e) => u({ pct: e.target.value })} /></Field>
            <Field label="Tone" hint="ok / warn / bad"><Input value={it.tone} onChange={(e) => u({ tone: e.target.value })} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  paymentMethods: {
    title: "Payment methods", group: "destination", summary: (v) => `${(v || []).length} method(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Payment methods" subtitle="Accepted methods" value={value} blank={{ label: "", icon: "" }}
        itemTitle={(i, it) => it.label || `Method ${i + 1}`} addLabel="Add method"
        fields={(it, u) => (
          <div className="form-grid">
            <Field label="Label"><Input value={it.label} onChange={(e) => u({ label: e.target.value })} /></Field>
            <Field label="Icon"><Input value={it.icon} onChange={(e) => u({ icon: e.target.value })} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  paymentStages: {
    title: "Payment stages", group: "destination", summary: (v) => `${(v || []).length} stage(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Payment stages" subtitle="Instalment timeline" value={value} blank={{ step: "", amount: "", title: "", sub: "", tone: "" }}
        itemTitle={(i, it) => it.title || `Stage ${i + 1}`} addLabel="Add stage"
        fields={(it, u) => (
          <div className="col gap-2">
            <div className="form-grid">
              <Field label="Step"><Input value={it.step} onChange={(e) => u({ step: e.target.value })} /></Field>
              <Field label="Amount"><Input value={it.amount} onChange={(e) => u({ amount: e.target.value })} /></Field>
              <Field label="Title"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
              <Field label="Tone" hint="ok / warn / bad"><Input value={it.tone} onChange={(e) => u({ tone: e.target.value })} /></Field>
            </div>
            <Field label="Sub"><Input value={it.sub} onChange={(e) => u({ sub: e.target.value })} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  travelDiaries: {
    title: "Travel diaries", group: "destination", summary: (v) => `${(v || []).length} entry(ies)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Travel diaries" subtitle="Diary entries" value={value} blank={{ name: "", initials: "", city: "", trip: "", body: "", when: "", color: "", accent: "" }}
        itemTitle={(i, it) => it.name || `Diary ${i + 1}`} addLabel="Add entry"
        fields={(it, u) => (
          <div className="col gap-2">
            <div className="form-grid">
              <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
              <Field label="Initials"><Input value={it.initials} onChange={(e) => u({ initials: e.target.value })} /></Field>
              <Field label="City"><Input value={it.city} onChange={(e) => u({ city: e.target.value })} /></Field>
              <Field label="Trip"><Input value={it.trip} onChange={(e) => u({ trip: e.target.value })} /></Field>
              <Field label="When"><Input value={it.when} onChange={(e) => u({ when: e.target.value })} /></Field>
              <Field label="Color"><Input value={it.color} onChange={(e) => u({ color: e.target.value })} /></Field>
              <Field label="Accent"><Input value={it.accent} onChange={(e) => u({ accent: e.target.value })} /></Field>
            </div>
            <Field label="Body"><Textarea value={it.body} onChange={(e) => u({ body: e.target.value })} rows={3} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  weekendInclusions: {
    title: "Weekend inclusions", group: "weekend", summary: (v) => `${(v || []).length} item(s)`,
    render: (value, onSave, onClose) => (
      <RepeaterDrawer title="Weekend inclusions" subtitle="Icon + text rows" value={value} blank={{ icon: "", text: "" }}
        itemTitle={(i, it) => it.text || `Inclusion ${i + 1}`} addLabel="Add inclusion"
        fields={(it, u) => (
          <div className="form-grid">
            <Field label="Icon"><Input value={it.icon} onChange={(e) => u({ icon: e.target.value })} /></Field>
            <Field label="Text"><Input value={it.text} onChange={(e) => u({ text: e.target.value })} /></Field>
          </div>
        )} onSave={onSave} onClose={onClose} />
    ),
  },
  weekendExclusions: {
    title: "Weekend exclusions", group: "weekend", summary: (v) => `${(v || []).length} item(s)`,
    render: (value, onSave, onClose) => <StringListDrawer title="Weekend exclusions" subtitle="What's not included" value={value} placeholder="Personal expenses" addLabel="Add exclusion" onSave={onSave} onClose={onClose} />,
  },
};

function ContentListCard({ icon, title, summary, onEdit }) {
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

export default function Content() {
  const [stored, setContent] = useSection("content");
  const toast = useToast();
  const c = stored || {};
  const intro = c.faqIntro || {};
  const categories = c.faqCategories || [];

  const [editCat, setEditCat] = useState(null);
  const [newCat, setNewCat] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [listKey, setListKey] = useState(null); // open trip-content list editor

  const totalQuestions = categories.reduce((n, cat) => n + (cat.items?.length || 0), 0);

  const listEntry = listKey ? CONTENT_LISTS[listKey] : null;
  const saveList = (key, value) => {
    setContent({ ...c, [key]: value });
    toast("Saved");
    setListKey(null);
  };
  const destinationKeys = Object.keys(CONTENT_LISTS).filter((k) => CONTENT_LISTS[k].group === "destination");
  const weekendKeys = Object.keys(CONTENT_LISTS).filter((k) => CONTENT_LISTS[k].group === "weekend");

  const saveCat = (cat) => {
    const exists = categories.some((x) => x.id === cat.id) && editCat && editCat.id === cat.id;
    const idClash = !editCat && categories.some((x) => x.id === cat.id);
    const final = idClash ? { ...cat, id: `${cat.id}-${Math.random().toString(36).slice(2, 5)}` } : cat;
    const next = exists ? categories.map((x) => (x.id === cat.id ? final : x)) : [...categories, final];
    setContent({ ...c, faqCategories: next });
    toast(exists ? "Category saved" : "Category added");
  };
  const removeCat = (id) => setContent({ ...c, faqCategories: categories.filter((x) => x.id !== id) });
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= categories.length) return;
    const next = [...categories];
    [next[i], next[j]] = [next[j], next[i]];
    setContent({ ...c, faqCategories: next });
  };

  const columns = [
    { key: "title", header: "Category", render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.title}</div><div className="tiny">#{r.id}</div></div>) },
    { key: "count", header: "Questions", render: (r) => <Badge tone="accent">{(r.items || []).length}</Badge> },
    { key: "preview", header: "First question", render: (r) => <span className="tiny truncate" style={{ display: "block", maxWidth: 380 }}>{r.items?.[0]?.q || "—"}</span> },
    {
      key: "actions", actions: true,
      render: (r) => {
        const i = categories.findIndex((x) => x.id === r.id);
        return (
          <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
            <IconButton name="chevronUp" size="sm" title="Move up" onClick={(e) => { e.stopPropagation(); move(i, -1); }} />
            <IconButton name="chevronDown" size="sm" title="Move down" onClick={(e) => { e.stopPropagation(); move(i, 1); }} />
            <IconButton name="edit" size="sm" title="Edit" onClick={(e) => { e.stopPropagation(); setEditCat(r); }} />
            <IconButton name="trash" size="sm" className="danger" title="Delete" onClick={(e) => { e.stopPropagation(); setConfirm(r); }} />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="FAQs" subtitle={`${categories.length} categories · ${totalQuestions} questions`}>
        <Button variant="ghost" icon="edit" onClick={() => setIntroOpen(true)}>Edit page header</Button>
        <Button variant="primary" icon="plus" onClick={() => setNewCat(true)}>New category</Button>
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState icon="doc" title="No FAQ categories" message="Add a category and its questions."
          action={<Button variant="secondary" icon="plus" onClick={() => setNewCat(true)}>New category</Button>} />
      ) : (
        <DataTable columns={columns} rows={categories} rowKey={(r) => r.id} onRowClick={(r) => setEditCat(r)} />
      )}

      <div style={{ marginTop: "var(--sp-8)" }}>
        <h2 style={{ fontSize: "var(--fs-h2, 20px)", marginBottom: 4 }}>Destination trip page</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: "var(--sp-4)" }}>Content blocks shown on a destination's trip detail page.</p>
        {destinationKeys.map((k) => (
          <ContentListCard key={k} icon="doc" title={CONTENT_LISTS[k].title} summary={CONTENT_LISTS[k].summary(c[k])} onEdit={() => setListKey(k)} />
        ))}
      </div>

      <div style={{ marginTop: "var(--sp-8)" }}>
        <h2 style={{ fontSize: "var(--fs-h2, 20px)", marginBottom: 4 }}>Weekend trip page</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: "var(--sp-4)" }}>Content blocks shown on a weekend's detail page.</p>
        {weekendKeys.map((k) => (
          <ContentListCard key={k} icon="calendar" title={CONTENT_LISTS[k].title} summary={CONTENT_LISTS[k].summary(c[k])} onEdit={() => setListKey(k)} />
        ))}
      </div>

      {(newCat || editCat) && <CategoryEditor value={editCat} onSave={saveCat} onClose={() => { setNewCat(false); setEditCat(null); }} />}
      {introOpen && <IntroEditor intro={intro} onSave={(v) => { setContent({ ...c, faqIntro: v }); toast("Page header saved"); }} onClose={() => setIntroOpen(false)} />}
      {listEntry && listEntry.render(
        listEntry.scalar ? (c[listKey] || "") : (c[listKey] || []),
        (v) => saveList(listKey, v),
        () => setListKey(null)
      )}
      {confirm && (
        <ConfirmDialog title="Delete category" message={`Delete “${confirm.title}” and its ${(confirm.items || []).length} question(s)?`}
          onConfirm={() => removeCat(confirm.id)} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
