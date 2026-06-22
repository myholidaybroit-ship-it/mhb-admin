import { useMemo, useState } from "react";
import { useStore, slugify } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Drawer, Field, Input, Textarea, Select, Toggle, Repeater,
  Button, Badge, ConfirmDialog, useToast, ImagePicker, TagInput, SearchInput, EmptyState,
} from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

const CATEGORIES = ["Travel Guide", "Tips", "Stories", "News", "Destinations", "How-to"];
const BLOCK_TYPES = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "quote", label: "Quote" },
  { value: "image", label: "Image" },
  { value: "list", label: "Bullet list" },
];

const blankBlog = () => ({
  slug: "", title: "", excerpt: "", coverImage: "", author: "MyHolidayBro Team",
  authorRole: "", category: "Travel Guide", tags: [], status: "draft", featured: false,
  publishedAt: "", readTime: "", body: [], seoTitle: "", seoDescription: "",
});

function blockSummary(b, i) {
  const txt = b.text || b.caption || (b.items && b.items[0]) || "";
  return `${b.type || "paragraph"}${txt ? " — " + String(txt).slice(0, 44) : ` ${i + 1}`}`;
}

/* ---------------- Blog editor drawer ---------------- */
function BlogEditor({ value, onClose }) {
  const { data, upsert } = useStore();
  const toast = useToast();
  const [b, setB] = useState(() => (value ? { ...blankBlog(), ...value } : blankBlog()));
  const set = (p) => setB((s) => ({ ...s, ...p }));
  const isNew = !value;

  const publicUrl = `/blog/${slugify(b.slug || b.title) || "…"}`;

  const save = () => {
    if (!b.title.trim()) return toast("Title is required", "error");
    const slug = slugify(b.slug || b.title);
    const dup = (data.blogs || []).find((x) => x.slug === slug && x.slug !== value?.slug);
    if (dup) return toast("A post with this slug already exists", "error");

    const next = { ...b, slug };
    // Stamp a publish date the moment a post goes live (if not set already).
    if (next.status === "published" && !next.publishedAt) {
      next.publishedAt = new Date().toISOString();
    }
    upsert("blogs", next, "slug");
    toast(isNew ? "Post created" : "Post saved");
    onClose();
  };

  return (
    <Drawer
      wide
      title={value ? b.title || "Edit post" : "New blog post"}
      subtitle={b.status === "published" ? "Published" : "Draft"}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={save}>Save post</Button>
      </>}
    >
      <div className="col gap-5">
        <ImagePicker label="Cover image" value={b.coverImage} onChange={(v) => set({ coverImage: v })} hint="Shown on the blog list + article hero" />

        <div className="form-grid">
          <Field label="Title" className="span-2" required>
            <Input value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="Best Time to Visit Bali" />
          </Field>
          <Field label="URL slug" className="span-2" hint="Auto from title if blank. Public URL below.">
            <Input value={b.slug} onChange={(e) => set({ slug: e.target.value })} onBlur={(e) => set({ slug: slugify(e.target.value) })} placeholder={slugify(b.title) || "post-slug"} />
          </Field>
          <div className="span-2 tiny muted" style={{ wordBreak: "break-all", marginTop: -6 }}>
            Public URL: <strong>{publicUrl}</strong>
          </div>
          <Field label="Excerpt" className="span-2" hint="Short summary for cards & search results">
            <Textarea value={b.excerpt} onChange={(e) => set({ excerpt: e.target.value })} rows={2} placeholder="One or two lines that sell the post." />
          </Field>
          <Field label="Category"><Select value={b.category} options={CATEGORIES} onChange={(e) => set({ category: e.target.value })} /></Field>
          <Field label="Tags"><TagInput value={b.tags || []} onChange={(tags) => set({ tags })} placeholder="Add a tag" /></Field>
          <Field label="Author"><Input value={b.author} onChange={(e) => set({ author: e.target.value })} placeholder="MyHolidayBro Team" /></Field>
          <Field label="Author role"><Input value={b.authorRole} onChange={(e) => set({ authorRole: e.target.value })} placeholder="Travel Editors" /></Field>
          <Field label="Read time" hint="Auto-estimated if blank"><Input value={b.readTime} onChange={(e) => set({ readTime: e.target.value })} placeholder="7 min read" /></Field>
          <Field label="Publish date" hint="Set automatically when published">
            <Input type="date" value={(b.publishedAt || "").slice(0, 10)} onChange={(e) => set({ publishedAt: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          </Field>
        </div>

        {/* Status + featured */}
        <div className="card-soft row-between" style={{ alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Field label="Status">
            <Select value={b.status} options={[{ value: "draft", label: "Draft (hidden)" }, { value: "published", label: "Published (live)" }]} onChange={(e) => set({ status: e.target.value })} />
          </Field>
          <Toggle checked={!!b.featured} onChange={(v) => set({ featured: v })} label="Feature on home page" />
        </div>

        {/* Content blocks */}
        <div>
          <div className="field-label" style={{ marginBottom: 8 }}>Article content</div>
          <Repeater
            value={b.body}
            onChange={(body) => set({ body })}
            blank={{ type: "paragraph", text: "" }}
            title={(i, it) => blockSummary(it, i)}
            addLabel="Add content block"
            renderItem={(blk, update) => (
              <div className="col gap-3">
                <Field label="Block type">
                  <Select value={blk.type || "paragraph"} options={BLOCK_TYPES} onChange={(e) => update({ type: e.target.value })} />
                </Field>
                {blk.type === "image" ? (
                  <>
                    <ImagePicker label="Image" value={blk.url} onChange={(url) => update({ url })} />
                    <Field label="Caption (optional)"><Input value={blk.caption || ""} onChange={(e) => update({ caption: e.target.value })} placeholder="Photo credit / caption" /></Field>
                  </>
                ) : blk.type === "list" ? (
                  <Field label="List items" hint="Press Enter after each point">
                    <TagInput value={blk.items || []} onChange={(items) => update({ items })} placeholder="Add a point" />
                  </Field>
                ) : (
                  <Field label="Text">
                    <Textarea value={blk.text || ""} onChange={(e) => update({ text: e.target.value })} rows={blk.type === "heading" ? 2 : 5} placeholder={blk.type === "quote" ? "A pull-quote that stands out…" : blk.type === "heading" ? "Section heading" : "Write a paragraph…"} />
                  </Field>
                )}
              </div>
            )}
          />
        </div>

        {/* SEO */}
        <div className="card-soft col gap-3">
          <div className="field-label">SEO</div>
          <Field label="SEO title" hint="Blank = the post title"><Input value={b.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} placeholder={b.title} /></Field>
          <Field label="Meta description" hint="Blank = the excerpt"><Textarea value={b.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} rows={2} placeholder={b.excerpt} /></Field>
        </div>
      </div>
    </Drawer>
  );
}

/* ---------------- Blogs list page ---------------- */
export default function Blogs() {
  const { data, remove } = useStore();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const posts = data.blogs || [];

  const filtered = useMemo(() => {
    let list = posts;
    if (tab === "published") list = list.filter((p) => p.status === "published");
    if (tab === "draft") list = list.filter((p) => p.status !== "published");
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.title} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q));
    return [...list].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  }, [posts, tab, search]);

  const counts = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status !== "published").length,
  };

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <div>
      <PageHeader title="Blog" subtitle="Write, publish and manage travel guides and stories.">
        <Button variant="primary" icon="plus" onClick={() => { setIsNew(true); setEdit(null); }}>New post</Button>
      </PageHeader>

      <div className="row-between gap-4" style={{ alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <Tabs active={tab} onChange={setTab} tabs={[
          { value: "all", label: `All (${counts.all})` },
          { value: "published", label: `Published (${counts.published})` },
          { value: "draft", label: `Drafts (${counts.draft})` },
        ]} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search posts…" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="newspaper" title="No posts yet" message="Write your first travel guide or story." action={<Button variant="secondary" icon="plus" onClick={() => { setIsNew(true); setEdit(null); }}>New post</Button>} />
      ) : (
        <div className="blog-grid">
          {filtered.map((p) => (
            <div className="blog-card" key={p.slug} onClick={() => { setEdit(p); setIsNew(false); }}>
              <div className="blog-thumb">
                {p.coverImage ? <img src={p.coverImage} alt="" /> : <div className="blog-empty"><Icon name="image" size={22} /></div>}
                <span className={`blog-status ${p.status === "published" ? "live" : "draft"}`}>{p.status === "published" ? "Live" : "Draft"}</span>
                <div className="blog-tools" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="blog-del" title="Delete" onClick={() => setConfirm(p)}><Icon name="trash" size={14} /></button>
                </div>
              </div>
              <div className="blog-body">
                <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
                  {p.category ? <Badge tone="neutral">{p.category}</Badge> : null}
                  {p.featured ? <Badge tone="success" dot>Featured</Badge> : null}
                </div>
                <strong className="truncate-2">{p.title}</strong>
                <div className="tiny muted">{fmtDate(p.publishedAt)} · {p.readTime || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isNew || edit) && <BlogEditor value={edit} onClose={() => { setIsNew(false); setEdit(null); }} />}
      {confirm && (
        <ConfirmDialog
          title="Delete post"
          message={`Delete “${confirm.title}”? This cannot be undone.`}
          onConfirm={() => { remove("blogs", confirm.slug); setConfirm(null); }}
          onClose={() => setConfirm(null)}
        />
      )}

      <style>{`
        .blog-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:var(--sp-4); }
        .blog-card { border:1px solid var(--line); border-radius:var(--r-lg); background:var(--surface); overflow:hidden; cursor:pointer; transition:box-shadow .15s, transform .15s; }
        .blog-card:hover { box-shadow:var(--sh-3); transform:translateY(-2px); }
        .blog-thumb { position:relative; aspect-ratio:16/9; background:var(--panel-soft); }
        .blog-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .blog-empty { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-3); }
        .blog-status { position:absolute; top:8px; left:8px; font-size:11px; font-weight:700; padding:3px 9px; border-radius:var(--r-pill); color:#fff; }
        .blog-status.live { background:#16a34a; }
        .blog-status.draft { background:#6b7280; }
        .blog-tools { position:absolute; top:8px; right:8px; }
        .blog-del { width:28px; height:28px; border-radius:var(--r-sm); background:rgba(255,255,255,.92); border:1px solid var(--line); color:var(--text-2); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
        .blog-del:hover { color:var(--danger); border-color:var(--danger); }
        .blog-body { padding:var(--sp-3); display:flex; flex-direction:column; gap:7px; }
        .truncate-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.35; }
      `}</style>
    </div>
  );
}
