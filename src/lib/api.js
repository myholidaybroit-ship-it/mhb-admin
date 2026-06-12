// MyHolidayBro admin API client.
//
// Talks to backend-mhb's /api/admin endpoints with a Bearer token. This is
// ADDITIVE — the localStorage CMS store (store.jsx) still works untouched.
// Wire a page to the API by calling these helpers in place of the store
// when you're ready to go live.
//
// Configure the base URL with VITE_API_URL (see .env.example).

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const TOKEN_KEY = "mhb_admin_token_v1";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  if (auth) {
    const token = getToken();
    if (token) opts.headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = payload?.error?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = payload?.error?.details;
    throw err;
  }
  return payload;
}

const get = (p, o) => request(p, { ...o, method: "GET" });
const post = (p, body, o) => request(p, { ...o, method: "POST", body });
const put = (p, body, o) => request(p, { ...o, method: "PUT", body });
const patch = (p, body, o) => request(p, { ...o, method: "PATCH", body });
const del = (p, o) => request(p, { ...o, method: "DELETE" });

// ── Auth (admin uses the /auth endpoints; role must be "admin") ─────────────
export const auth = {
  // Passwordless email-OTP login (preferred for the admin panel).
  requestOtp: (email) =>
    request("/auth/admin/otp/request", { method: "POST", body: { email }, auth: false }),
  async verifyOtp(email, code) {
    const r = await request("/auth/admin/otp/verify", { method: "POST", body: { email, code }, auth: false });
    setToken(r.token);
    return r;
  },
  // Password login is still available if ever needed.
  async login(email, password) {
    const r = await request("/auth/login", { method: "POST", body: { email, password }, auth: false });
    setToken(r.token);
    return r;
  },
  me: () => get("/auth/me"),
  logout: () => setToken(null),
};

// ── Generic CRUD against /api/admin/<resource> ──────────────────────────────
export function resource(path) {
  return {
    list: (query = "") => get(`/admin/${path}${query}`),
    get: (id) => get(`/admin/${path}/${id}`),
    create: (body) => post(`/admin/${path}`, body),
    replace: (id, body) => put(`/admin/${path}/${id}`, body), // full upsert
    update: (id, body) => patch(`/admin/${path}/${id}`, body), // partial
    remove: (id) => del(`/admin/${path}/${id}`),
  };
}

// Named resources matching the registry in backend-mhb/src/config/resources.js.
export const resources = {
  destinations: resource("destinations"),
  weekends: resource("weekends"),
  moments: resource("moments"),
  testimonials: resource("testimonials"),
  places: resource("places"),
  hotels: resource("hotels"),
  blocks: resource("blocks"),
  tripTemplates: resource("trip-templates"),
  itineraries: resource("itineraries"),
  tripQueries: resource("trip-queries"),
  teamMembers: resource("team-members"),
  customPackages: resource("custom-packages"),
  quoteTemplates: resource("quote-templates"),
};

// ── Singleton content sections ──────────────────────────────────────────────
export const content = {
  all: () => get("/admin/content"),
  section: (key) => get(`/admin/content/${key}`),
  save: (key, value) => put(`/admin/content/${key}`, { value }),
};

// ── Media library (S3) ──────────────────────────────────────────────────────
export const media = {
  status: () => get("/admin/media/status"),
  list: (query = "") => get(`/admin/media${query}`),
  update: (id, body) => patch(`/admin/media/${id}`, body),
  remove: (id) => del(`/admin/media/${id}`),

  // Flow A — presigned direct-to-S3 upload (recommended for large files).
  async upload(file, folder = "") {
    const { data: pre } = await post("/admin/media/presign", {
      filename: file.name,
      contentType: file.type,
      folder,
    });
    await fetch(pre.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    const { data } = await post("/admin/media", {
      key: pre.key,
      url: pre.publicUrl,
      name: file.name,
      mime: file.type,
      size: file.size,
      folder,
    });
    return data;
  },

  // Flow B — server-side multipart upload (small files).
  async uploadViaServer(file, folder = "") {
    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);
    const res = await fetch(`${BASE_URL}/admin/media/upload`, {
      method: "POST",
      headers: { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: fd,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error?.message || `Upload failed (${res.status})`);
    return payload.data;
  },
};

// ── Admin extras ────────────────────────────────────────────────────────────
export const admin = {
  stats: () => get("/admin/stats"),
  users: () => get("/admin/users"), // read-only — CRM traveller picker
  newsletter: () => get("/admin/newsletter"),
  removeSubscriber: (id) => del(`/admin/newsletter/${id}`),
  exportContent: () => get("/admin/export"),
  importContent: (data) => post("/admin/import", { data }),
};

export const apiBase = BASE_URL;
