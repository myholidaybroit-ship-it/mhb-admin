// Header & Footer editor — the `nav` and `footer` singletons that the public
// site's <Header/> and <Footer/> render. These previously had no admin surface.

import { useState } from "react";
import { useSection } from "../lib/store.jsx";
import {
  PageHeader, Tabs, Field, Input, Button, Repeater, Toggle, ImagePicker, useToast,
} from "../ui/kit.jsx";

const rid = (p = "id") => p + Math.random().toString(36).slice(2, 8);

function useDraft(initial) {
  const [d, setD] = useState(initial || {});
  return [d, (p) => setD((s) => ({ ...s, ...p }))];
}

/* ---------------- Header (nav singleton) ---------------- */
function HeaderEditor() {
  const [nav, setNav] = useSection("nav");
  const toast = useToast();
  const [d, set] = useDraft(nav);
  const save = () => { setNav(d); toast("Header saved — live on the site"); };

  return (
    <div className="col gap-5">
      <div className="card col gap-4">
        <h3 className="section-title">Logos</h3>
        <div className="form-grid">
          <ImagePicker label="Logo (dark, on light header)" value={d.logoBlack} onChange={(v) => set({ logoBlack: v })} />
          <ImagePicker label="Logo (light, on dark surfaces)" value={d.logoWhite} onChange={(v) => set({ logoWhite: v })} />
        </div>
      </div>

      <div className="card col gap-4">
        <h3 className="section-title">Menu items</h3>
        <Repeater value={d.items || []} onChange={(items) => set({ items })}
          blank={() => ({ label: "", href: "/", highlight: false })}
          title={(i, it) => it.label || `Item ${i + 1}`} addLabel="Add menu item"
          renderItem={(it, u) => (
            <div className="form-grid">
              <Field label="Label"><Input value={it.label} onChange={(e) => u({ label: e.target.value })} placeholder="Destinations" /></Field>
              <Field label="Link"><Input value={it.href} onChange={(e) => u({ href: e.target.value })} placeholder="/destinations" /></Field>
              <Field label="Highlight dot"><Toggle checked={!!it.highlight} onChange={(v) => u({ highlight: v })} label="Show accent dot" /></Field>
            </div>
          )} />
      </div>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button variant="primary" icon="check" onClick={save}>Save header</Button>
      </div>
    </div>
  );
}

/* ---------------- Footer (footer singleton) ---------------- */
function FooterEditor() {
  const [footer, setFooter] = useSection("footer");
  const toast = useToast();
  const [d, set] = useDraft(footer);
  const save = () => { setFooter(d); toast("Footer saved — live on the site"); };

  return (
    <div className="col gap-5">
      <div className="card col gap-4">
        <h3 className="section-title">Link columns</h3>
        <Repeater value={d.columns || []} onChange={(columns) => set({ columns })} collapsible
          blank={() => ({ title: "", links: [] })}
          title={(i, c) => c.title || `Column ${i + 1}`} addLabel="Add column"
          renderItem={(c, u) => (
            <div className="col gap-3">
              <Field label="Column title"><Input value={c.title} onChange={(e) => u({ title: e.target.value })} /></Field>
              <Field label="Links">
                <Repeater value={c.links || []} onChange={(links) => u({ links })}
                  blank={() => ({ label: "", href: "/" })}
                  title={(i, l) => l.label || `Link ${i + 1}`} addLabel="Add link"
                  renderItem={(l, ul) => (
                    <div className="form-grid">
                      <Field label="Label"><Input value={l.label} onChange={(e) => ul({ label: e.target.value })} /></Field>
                      <Field label="URL"><Input value={l.href} onChange={(e) => ul({ href: e.target.value })} placeholder="/faq or https://…" /></Field>
                    </div>
                  )} />
              </Field>
            </div>
          )} />
      </div>

      <div className="card col gap-4">
        <h3 className="section-title">Offices</h3>
        <Repeater value={d.offices || []} onChange={(offices) => set({ offices })}
          blank={() => ({ city: "", address: "" })}
          title={(i, o) => o.city || `Office ${i + 1}`} addLabel="Add office"
          renderItem={(o, u) => (
            <div className="form-grid">
              <Field label="City"><Input value={o.city} onChange={(e) => u({ city: e.target.value })} /></Field>
              <Field label="Address" className="span-2"><Input value={o.address} onChange={(e) => u({ address: e.target.value })} /></Field>
            </div>
          )} />
      </div>

      <div className="card col gap-4">
        <h3 className="section-title">Contact & social</h3>
        <div className="form-grid">
          <Field label="Phone"><Input value={d.contact?.phone || ""} onChange={(e) => set({ contact: { ...d.contact, phone: e.target.value } })} /></Field>
          <Field label="Email"><Input value={d.contact?.email || ""} onChange={(e) => set({ contact: { ...d.contact, email: e.target.value } })} /></Field>
          <Field label="WhatsApp link"><Input value={d.contact?.whatsapp || ""} onChange={(e) => set({ contact: { ...d.contact, whatsapp: e.target.value } })} /></Field>
        </div>
        <Repeater value={d.social || []} onChange={(social) => set({ social })}
          blank={() => ({ network: "", url: "" })}
          title={(i, s) => s.network || `Network ${i + 1}`} addLabel="Add social link"
          renderItem={(s, u) => (
            <div className="form-grid">
              <Field label="Network" hint="Instagram · Facebook · YouTube · WhatsApp"><Input value={s.network} onChange={(e) => u({ network: e.target.value })} /></Field>
              <Field label="URL"><Input value={s.url} onChange={(e) => u({ url: e.target.value })} /></Field>
            </div>
          )} />
        <Field label="Copyright line"><Input value={d.copyright || ""} onChange={(e) => set({ copyright: e.target.value })} /></Field>
      </div>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button variant="primary" icon="check" onClick={save}>Save footer</Button>
      </div>
    </div>
  );
}

export default function Navigation() {
  const [tab, setTab] = useState("header");
  return (
    <div>
      <PageHeader title="Header & Footer" subtitle="The site-wide navigation bar and footer — logos, menu, link columns, offices and socials." />
      <Tabs active={tab} onChange={setTab} tabs={[
        { value: "header", label: "Header / Navigation" },
        { value: "footer", label: "Footer" },
      ]} />
      <div className="mt-5">
        {tab === "header" ? <HeaderEditor /> : <FooterEditor />}
      </div>
    </div>
  );
}
