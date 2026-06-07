import { useState } from "react";
import { useSection } from "../lib/store.jsx";
import {
  PageHeader, Button, Badge, Drawer, Field, Input, Textarea, Repeater,
  StringList, ImagePicker, ImageGrid, VideoPicker, useToast,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

const rid = (p = "id") => p + Math.random().toString(36).slice(2, 8);

/* A simple list of section cards, each with an Edit button. */
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

/* Each editor takes the current section object, a draft state, and saves the full section. */
function useDraft(initial) {
  const [d, setD] = useState(() => structuredClone(initial ?? {}));
  const set = (p) => setD((s) => ({ ...s, ...p }));
  return [d, set, setD];
}

/* ---------------- Hero ---------------- */
function HeroDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer title="Hero" subtitle="Top-of-page banner" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <Field label="Headline"><Input value={d.headline || ""} onChange={(e) => set({ headline: e.target.value })} /></Field>
        <Field label="Accent word" hint="Highlighted word in the headline"><Input value={d.accentWord || ""} onChange={(e) => set({ accentWord: e.target.value })} /></Field>
        <Field label="Subheading"><Textarea value={d.subheading || ""} onChange={(e) => set({ subheading: e.target.value })} rows={2} /></Field>
        <Field label="Search placeholder"><Input value={d.searchPlaceholder || ""} onChange={(e) => set({ searchPlaceholder: e.target.value })} /></Field>
        <VideoPicker label="Background video" value={d.videoUrl || ""} onChange={(v) => set({ videoUrl: v })} hint="Or paste a URL below" />
        <Field label="Video URL"><Input value={d.videoUrl || ""} onChange={(e) => set({ videoUrl: e.target.value })} placeholder="https://…" /></Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Travelers ---------------- */
function TravelersDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Travelers" subtitle="Avatar strip" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Title"><Input value={d.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Subtitle"><Input value={d.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
        </div>
        <Field label="Travelers">
          <Repeater value={d.items || []} onChange={(items) => set({ items })} blank={{ name: "", image: "" }}
            title={(i, it) => it.name || `Traveler ${i + 1}`} addLabel="Add traveler"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                <ImagePicker label="Photo" value={it.image} onChange={(v) => u({ image: v })} />
                <Field label="Image URL"><Input value={it.image} onChange={(e) => u({ image: e.target.value })} placeholder="https://…" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Bookings ---------------- */
function BookingsDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Bookings" subtitle="Filters & live booking cards" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-5">
        <Field label="Title"><Input value={d.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Destination filters">
          <Repeater value={d.destinations || []} onChange={(destinations) => set({ destinations })} blank={() => ({ id: rid("d"), label: "" })}
            title={(i, it) => it.label || `Destination ${i + 1}`} addLabel="Add destination"
            renderItem={(it, u) => (
              <div className="form-grid">
                <Field label="ID"><Input value={it.id} onChange={(e) => u({ id: e.target.value })} /></Field>
                <Field label="Label"><Input value={it.label} onChange={(e) => u({ label: e.target.value })} /></Field>
              </div>
            )} />
        </Field>
        <Field label="Price ranges">
          <Repeater value={d.priceRanges || []} onChange={(priceRanges) => set({ priceRanges })} blank={() => ({ id: rid("p"), label: "", min: 0, max: 0 })}
            title={(i, it) => it.label || `Range ${i + 1}`} addLabel="Add price range"
            renderItem={(it, u) => (
              <div className="form-grid">
                <Field label="ID"><Input value={it.id} onChange={(e) => u({ id: e.target.value })} /></Field>
                <Field label="Label"><Input value={it.label} onChange={(e) => u({ label: e.target.value })} /></Field>
                <Field label="Min"><Input type="number" value={it.min} onChange={(e) => u({ min: Number(e.target.value) })} /></Field>
                <Field label="Max"><Input type="number" value={it.max} onChange={(e) => u({ max: Number(e.target.value) })} /></Field>
              </div>
            )} />
        </Field>
        <Field label="Booking cards" hint={`${(d.items || []).length} card(s)`}>
          <Repeater value={d.items || []} onChange={(items) => set({ items })}
            blank={() => ({ id: rid("b"), initial: "", name: "", city: "", timeAgo: "", title: "", location: "", tag: "", nights: "", priceText: "", priceNum: 0, image: "", dests: [] })}
            title={(i, it) => it.name || it.title || `Card ${i + 1}`} addLabel="Add booking card"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <div className="form-grid">
                  <Field label="Initial"><Input value={it.initial} onChange={(e) => u({ initial: e.target.value })} /></Field>
                  <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                  <Field label="City"><Input value={it.city} onChange={(e) => u({ city: e.target.value })} /></Field>
                  <Field label="Time ago"><Input value={it.timeAgo} onChange={(e) => u({ timeAgo: e.target.value })} /></Field>
                  <Field label="Title" className="span-2"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
                  <Field label="Location"><Input value={it.location} onChange={(e) => u({ location: e.target.value })} /></Field>
                  <Field label="Tag"><Input value={it.tag} onChange={(e) => u({ tag: e.target.value })} /></Field>
                  <Field label="Nights"><Input value={it.nights} onChange={(e) => u({ nights: e.target.value })} /></Field>
                  <Field label="Price text"><Input value={it.priceText} onChange={(e) => u({ priceText: e.target.value })} /></Field>
                  <Field label="Price (number)"><Input type="number" value={it.priceNum} onChange={(e) => u({ priceNum: Number(e.target.value) })} /></Field>
                </div>
                <ImagePicker label="Image" value={it.image} onChange={(v) => u({ image: v })} />
                <Field label="Image URL"><Input value={it.image} onChange={(e) => u({ image: e.target.value })} placeholder="https://…" /></Field>
                <Field label="Destination ids" hint="Match the filter ids above">
                  <StringList value={it.dests || []} onChange={(dests) => u({ dests })} placeholder="goa" addLabel="Add destination id" />
                </Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Packages ---------------- */
function PackagesDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Packages" subtitle="Tabbed package lists" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <Field label="Title"><Input value={d.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Tabs">
          <Repeater value={d.tabs || []} onChange={(tabs) => set({ tabs })} blank={() => ({ id: rid("t"), label: "", items: [] })}
            title={(i, it) => it.label || `Tab ${i + 1}`} addLabel="Add tab"
            renderItem={(tab, u) => (
              <div className="col gap-3">
                <div className="form-grid">
                  <Field label="ID"><Input value={tab.id} onChange={(e) => u({ id: e.target.value })} /></Field>
                  <Field label="Label"><Input value={tab.label} onChange={(e) => u({ label: e.target.value })} /></Field>
                </div>
                <Field label="Packages">
                  <Repeater value={tab.items || []} onChange={(items) => u({ items })} blank={{ name: "", price: "", image: "" }}
                    title={(i, p) => p.name || `Package ${i + 1}`} addLabel="Add package"
                    renderItem={(p, up) => (
                      <div className="col gap-2">
                        <div className="form-grid">
                          <Field label="Name"><Input value={p.name} onChange={(e) => up({ name: e.target.value })} /></Field>
                          <Field label="Price"><Input value={p.price} onChange={(e) => up({ price: e.target.value })} /></Field>
                        </div>
                        <ImagePicker label="Image" value={p.image} onChange={(v) => up({ image: v })} />
                        <Field label="Image URL"><Input value={p.image} onChange={(e) => up({ image: e.target.value })} placeholder="https://…" /></Field>
                      </div>
                    )} />
                </Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Stories ---------------- */
function StoriesDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Stories" subtitle="Video testimonials" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Title"><Input value={d.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Score"><Input value={d.score || ""} onChange={(e) => set({ score: e.target.value })} /></Field>
          <Field label="Rating text" className="span-2"><Input value={d.ratingText || ""} onChange={(e) => set({ ratingText: e.target.value })} /></Field>
        </div>
        <Field label="Story videos">
          <Repeater value={d.items || []} onChange={(items) => set({ items })} blank={() => ({ id: rid("s"), name: "", dest: "", video: "" })}
            title={(i, it) => it.name || `Story ${i + 1}`} addLabel="Add story"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <div className="form-grid">
                  <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                  <Field label="Destination"><Input value={it.dest} onChange={(e) => u({ dest: e.target.value })} /></Field>
                </div>
                <VideoPicker label="Video" value={it.video} onChange={(v) => u({ video: v })} />
                <Field label="Video URL"><Input value={it.video} onChange={(e) => u({ video: e.target.value })} placeholder="https://…" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Moments ---------------- */
function MomentsDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Moments" subtitle="Traveler review wall" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <Field label="Title"><Input value={d.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Moments" hint={`${(d.items || []).length} card(s)`}>
          <Repeater value={d.items || []} onChange={(items) => set({ items })}
            blank={() => ({ id: rid("m"), initial: "", name: "", city: "", caption: "", destination: "", duration: "", rating: "", title: "", review: "", date: "", image: "" })}
            title={(i, it) => it.name || `Moment ${i + 1}`} addLabel="Add moment"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <div className="form-grid">
                  <Field label="Initial"><Input value={it.initial} onChange={(e) => u({ initial: e.target.value })} /></Field>
                  <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                  <Field label="City"><Input value={it.city} onChange={(e) => u({ city: e.target.value })} /></Field>
                  <Field label="Destination"><Input value={it.destination} onChange={(e) => u({ destination: e.target.value })} /></Field>
                  <Field label="Duration"><Input value={it.duration} onChange={(e) => u({ duration: e.target.value })} /></Field>
                  <Field label="Rating"><Input value={it.rating} onChange={(e) => u({ rating: e.target.value })} /></Field>
                  <Field label="Date"><Input value={it.date} onChange={(e) => u({ date: e.target.value })} /></Field>
                  <Field label="Caption"><Input value={it.caption} onChange={(e) => u({ caption: e.target.value })} /></Field>
                  <Field label="Title" className="span-2"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
                </div>
                <Field label="Review"><Textarea value={it.review} onChange={(e) => u({ review: e.target.value })} rows={2} /></Field>
                <ImagePicker label="Image" value={it.image} onChange={(v) => u({ image: v })} />
                <Field label="Image URL"><Input value={it.image} onChange={(e) => u({ image: e.target.value })} placeholder="https://…" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Partners ---------------- */
function PartnersDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Partners" subtitle="Partner logos" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <Field label="Title"><Input value={d.title || ""} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Partners">
          <Repeater value={d.items || []} onChange={(items) => set({ items })} blank={() => ({ id: rid("pt"), name: "", logo: "", image: "" })}
            title={(i, it) => it.name || `Partner ${i + 1}`} addLabel="Add partner"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                <ImagePicker label="Logo" value={it.logo} onChange={(v) => u({ logo: v })} />
                <Field label="Logo URL"><Input value={it.logo} onChange={(e) => u({ logo: e.target.value })} placeholder="https://…" /></Field>
                <ImagePicker label="Image" value={it.image} onChange={(v) => u({ image: v })} />
                <Field label="Image URL"><Input value={it.image} onChange={(e) => u({ image: e.target.value })} placeholder="https://…" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Why Us ---------------- */
function WhyUsDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Why Us" subtitle="Brand story block" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Eyebrow"><Input value={d.eyebrow || ""} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
          <Field label="Heading"><Input value={d.heading || ""} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <Field label="Quote" className="span-2"><Textarea value={d.quote || ""} onChange={(e) => set({ quote: e.target.value })} rows={2} /></Field>
        </div>
        <Field label="Body paragraphs" hint="One paragraph per row">
          <StringList value={d.bodyParagraphs || []} onChange={(bodyParagraphs) => set({ bodyParagraphs })} placeholder="Paragraph…" addLabel="Add paragraph" />
        </Field>
        <Field label="Stats">
          <Repeater value={d.stats || []} onChange={(stats) => set({ stats })} blank={{ value: "", label: "" }}
            title={(i, it) => it.value || `Stat ${i + 1}`} addLabel="Add stat"
            renderItem={(it, u) => (
              <div className="form-grid">
                <Field label="Value"><Input value={it.value} onChange={(e) => u({ value: e.target.value })} /></Field>
                <Field label="Label"><Input value={it.label} onChange={(e) => u({ label: e.target.value })} /></Field>
              </div>
            )} />
        </Field>
        <ImageGrid label="Collage images" value={d.collage || []} onChange={(collage) => set({ collage })} />
        <Field label="Collage image URLs" hint="Or add by URL">
          <StringList value={d.collage || []} onChange={(collage) => set({ collage })} placeholder="https://…" addLabel="Add image URL" />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Featured On ---------------- */
function FeaturedOnDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Featured On" subtitle="Press logos" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Eyebrow"><Input value={d.eyebrow || ""} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
          <Field label="Heading"><Input value={d.heading || ""} onChange={(e) => set({ heading: e.target.value })} /></Field>
        </div>
        <Field label="Outlets">
          <Repeater value={d.items || []} onChange={(items) => set({ items })} blank={{ name: "", src: "", width: 0, height: 0, sub: "" }}
            title={(i, it) => it.name || `Outlet ${i + 1}`} addLabel="Add outlet"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <div className="form-grid">
                  <Field label="Name"><Input value={it.name} onChange={(e) => u({ name: e.target.value })} /></Field>
                  <Field label="Sub"><Input value={it.sub} onChange={(e) => u({ sub: e.target.value })} /></Field>
                  <Field label="Width"><Input type="number" value={it.width} onChange={(e) => u({ width: Number(e.target.value) })} /></Field>
                  <Field label="Height"><Input type="number" value={it.height} onChange={(e) => u({ height: Number(e.target.value) })} /></Field>
                </div>
                <ImagePicker label="Logo" value={it.src} onChange={(v) => u({ src: v })} />
                <Field label="Logo URL"><Input value={it.src} onChange={(e) => u({ src: e.target.value })} placeholder="https://…" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Blogs ---------------- */
function BlogsDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  const setFeatured = (p) => set({ featured: { ...(d.featured || {}), ...p } });
  const f = d.featured || {};
  return (
    <Drawer wide title="Blogs" subtitle="Featured post + grid" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-5">
        <div className="form-grid">
          <Field label="Eyebrow"><Input value={d.eyebrow || ""} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
          <Field label="Heading"><Input value={d.heading || ""} onChange={(e) => set({ heading: e.target.value })} /></Field>
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 8 }}>Featured post</div>
          <div className="col gap-2">
            <div className="form-grid">
              <Field label="Date"><Input value={f.date || ""} onChange={(e) => setFeatured({ date: e.target.value })} /></Field>
              <Field label="Read time"><Input value={f.read || ""} onChange={(e) => setFeatured({ read: e.target.value })} /></Field>
              <Field label="Title" className="span-2"><Input value={f.title || ""} onChange={(e) => setFeatured({ title: e.target.value })} /></Field>
              <Field label="Excerpt" className="span-2"><Textarea value={f.excerpt || ""} onChange={(e) => setFeatured({ excerpt: e.target.value })} rows={2} /></Field>
            </div>
            <ImagePicker label="Featured image" value={f.image || ""} onChange={(v) => setFeatured({ image: v })} />
            <Field label="Featured image URL"><Input value={f.image || ""} onChange={(e) => setFeatured({ image: e.target.value })} placeholder="https://…" /></Field>
          </div>
        </div>
        <Field label="Posts">
          <Repeater value={d.posts || []} onChange={(posts) => set({ posts })} blank={() => ({ id: rid("bl"), date: "", read: "", title: "", image: "" })}
            title={(i, it) => it.title || `Post ${i + 1}`} addLabel="Add post"
            renderItem={(it, u) => (
              <div className="col gap-2">
                <div className="form-grid">
                  <Field label="Date"><Input value={it.date} onChange={(e) => u({ date: e.target.value })} /></Field>
                  <Field label="Read time"><Input value={it.read} onChange={(e) => u({ read: e.target.value })} /></Field>
                  <Field label="Title" className="span-2"><Input value={it.title} onChange={(e) => u({ title: e.target.value })} /></Field>
                </div>
                <ImagePicker label="Image" value={it.image} onChange={(v) => u({ image: v })} />
                <Field label="Image URL"><Input value={it.image} onChange={(e) => u({ image: e.target.value })} placeholder="https://…" /></Field>
              </div>
            )} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Newsletter ---------------- */
function NewsletterDrawer({ value, onSave, onClose }) {
  const [d, set] = useDraft(value || {});
  return (
    <Drawer wide title="Newsletter" subtitle="Signup band" onClose={onClose} footer={footerOf(onClose, () => onSave(d))}>
      <div className="col gap-4">
        <div className="form-grid">
          <Field label="Eyebrow"><Input value={d.eyebrow || ""} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
          <Field label="Heading"><Input value={d.heading || ""} onChange={(e) => set({ heading: e.target.value })} /></Field>
          <Field label="Subheading" className="span-2"><Textarea value={d.subheading || ""} onChange={(e) => set({ subheading: e.target.value })} rows={2} /></Field>
          <Field label="Button label"><Input value={d.buttonLabel || ""} onChange={(e) => set({ buttonLabel: e.target.value })} /></Field>
          <Field label="Success message"><Input value={d.successMessage || ""} onChange={(e) => set({ successMessage: e.target.value })} /></Field>
          <Field label="Footnote" className="span-2"><Input value={d.footnote || ""} onChange={(e) => set({ footnote: e.target.value })} /></Field>
        </div>
        <ImagePicker label="Background image" value={d.backgroundImage || ""} onChange={(v) => set({ backgroundImage: v })} />
        <Field label="Background image URL"><Input value={d.backgroundImage || ""} onChange={(e) => set({ backgroundImage: e.target.value })} placeholder="https://…" /></Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Section registry ---------------- */
const SECTIONS = [
  { key: "hero", icon: "layout", title: "Hero", summary: (s) => s.headline || "Headline & background video", Drawer: HeroDrawer },
  { key: "travelers", icon: "users", title: "Travelers", summary: (s) => `${(s.items || []).length} traveler(s)`, Drawer: TravelersDrawer },
  { key: "bookings", icon: "calendar", title: "Bookings", summary: (s) => `${(s.items || []).length} card(s) · ${(s.destinations || []).length} filter(s)`, Drawer: BookingsDrawer },
  { key: "packages", icon: "tag", title: "Packages", summary: (s) => `${(s.tabs || []).length} tab(s)`, Drawer: PackagesDrawer },
  { key: "stories", icon: "star", title: "Stories", summary: (s) => `${(s.items || []).length} video(s)`, Drawer: StoriesDrawer },
  { key: "moments", icon: "image", title: "Moments", summary: (s) => `${(s.items || []).length} review(s)`, Drawer: MomentsDrawer },
  { key: "partners", icon: "briefcase", title: "Partners", summary: (s) => `${(s.items || []).length} partner(s)`, Drawer: PartnersDrawer },
  { key: "whyUs", icon: "sparkle", title: "Why Us", summary: (s) => s.heading || "Brand story block", Drawer: WhyUsDrawer },
  { key: "featuredOn", icon: "newspaper", title: "Featured On", summary: (s) => `${(s.items || []).length} outlet(s)`, Drawer: FeaturedOnDrawer },
  { key: "blogs", icon: "doc", title: "Blogs", summary: (s) => `${(s.posts || []).length} post(s)`, Drawer: BlogsDrawer },
  { key: "newsletter", icon: "mail", title: "Newsletter", summary: (s) => s.heading || "Signup band", Drawer: NewsletterDrawer },
];

export default function Home() {
  const [stored, setHome] = useSection("home");
  const toast = useToast();
  const home = stored || {};
  const [open, setOpen] = useState(null); // section key

  const current = SECTIONS.find((s) => s.key === open);

  const save = (key, value) => {
    setHome({ ...home, [key]: value });
    toast("Saved");
    setOpen(null);
  };

  return (
    <div>
      <PageHeader title="Home page" subtitle={`${SECTIONS.length} sections`} />
      {SECTIONS.map((s) => (
        <SectionCard key={s.key} icon={s.icon} title={s.title} summary={s.summary(home[s.key] || {})} onEdit={() => setOpen(s.key)} />
      ))}
      {current && (
        <current.Drawer value={home[current.key] || {}} onSave={(v) => save(current.key, v)} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
