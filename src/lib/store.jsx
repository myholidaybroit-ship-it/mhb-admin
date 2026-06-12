// CMS data store — now backed by the backend-mhb API (was localStorage).
//
// The whole content tree is loaded once from `/api/admin/export`, held
// in React state, and every mutation is written through to the API while the
// local copy updates optimistically. The hook surface (useStore / useSection /
// upsert / remove / setSection / uid / slugify) is unchanged, so every admin
// page keeps working without edits.

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { admin, content as contentApi, resources } from "./api.js";
import { useToast } from "../ui/kit.jsx";

// Top-level singletons (one document each) vs. collections (arrays).
const SINGLETONS = new Set([
  "home", "nav", "footer", "content", "contact", "adventureStyles", "careers", "policies", "settings",
]);

// Collections whose natural key isn't "id".
const ID_KEY = { destinations: "slug" };
const keyOf = (section) => ID_KEY[section] || "id";

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const { data: tree } = await admin.exportContent();
      const { version, exportedAt, ...rest } = tree || {};
      setData(rest);
      setStatus("ready");
    } catch (e) {
      setError(e.message || "Couldn't load content from the server.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Surface save failures to the user instead of swallowing them — an optimistic
  // UI update that didn't reach the backend would otherwise look saved but be lost.
  const toast = useToast();
  const fail = (e) => {
    console.error("[store] save failed:", e?.message || e);
    toast(e?.message || "Couldn't save — check your connection and try again.", "error");
  };

  // Replace a whole top-level section (singleton → PUT; collection → reconcile).
  const setSection = useCallback((section, value) => {
    setData((d) => {
      const next = typeof value === "function" ? value(d[section]) : value;
      // Persist
      if (SINGLETONS.has(section)) {
        contentApi.save(section, next).catch(fail);
      } else if (resources[section] && Array.isArray(next)) {
        const k = keyOf(section);
        const prevIds = new Set((d[section] || []).map((x) => x[k]));
        const nextIds = new Set(next.map((x) => x[k]));
        next.forEach((item) => resources[section].replace(item[k], item).catch(fail));
        [...prevIds].filter((id) => !nextIds.has(id)).forEach((id) => resources[section].remove(id).catch(fail));
      }
      return { ...d, [section]: next };
    });
  }, []);

  // Insert or update one item in a collection.
  const upsert = useCallback((section, item, idKey = "id") => {
    const k = ID_KEY[section] || idKey;
    const id = item[k] ?? item.id ?? item.slug;

    setData((d) => {
      const list = d[section] || [];
      const idx = list.findIndex((x) => (x[k] ?? x.id) === id);
      const next = idx === -1 ? [...list, item] : list.map((x, i) => (i === idx ? item : x));
      return { ...d, [section]: next };
    });

    if (resources[section]) resources[section].replace(id, item).catch(fail);
  }, []);

  // Partial update of one item: merge `patch` locally and persist via PATCH
  // ($set), which — unlike `upsert`'s full PUT replace — preserves server-managed
  // fields like createdAt.
  const patchItem = useCallback((section, id, patch) => {
    const k = ID_KEY[section] || "id";
    setData((d) => ({
      ...d,
      [section]: (d[section] || []).map((x) => ((x[k] ?? x.id) === id ? { ...x, ...patch } : x)),
    }));
    if (resources[section]) resources[section].update(id, patch).catch(fail);
  }, []);

  // Remove one item from a collection.
  const remove = useCallback((section, id, idKey = "id") => {
    const k = ID_KEY[section] || idKey;
    setData((d) => ({ ...d, [section]: (d[section] || []).filter((x) => (x[k] ?? x.id) !== id) }));
    if (resources[section]) resources[section].remove(id).catch(fail);
  }, []);

  const reseed = useCallback(() => load(), [load]);
  const exportJSON = useCallback(() => JSON.stringify(data, null, 2), [data]);
  const importJSON = useCallback(async (text) => {
    await admin.importContent(JSON.parse(text));
    await load();
  }, [load]);

  const value = useMemo(
    () => ({ data, status, error, reload: load, setData, setSection, upsert, patchItem, remove, reseed, exportJSON, importJSON }),
    [data, status, error, load, setSection, upsert, patchItem, remove, reseed, exportJSON, importJSON]
  );

  if (status !== "ready" || !data) {
    return (
      <div className="login-screen">
        {status === "error" ? (
          <div className="login-card" style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Couldn't reach the API</h2>
            <p className="muted">{error}</p>
            <p className="tiny" style={{ marginTop: 8 }}>Is the backend running on its configured URL?</p>
            <button
              onClick={load}
              style={{ marginTop: 14, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--ink)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="spinner" />
        )}
      </div>
    );
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// Convenience hook for a single top-level section with a setter.
export function useSection(section) {
  const { data, setSection } = useStore();
  return [data[section], (v) => setSection(section, v)];
}

export const slugify = (s = "") =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
