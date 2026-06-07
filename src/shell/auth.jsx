// Admin auth — passwordless email OTP against the backend-mhb API.
//
//   1. requestOtp(email)  → backend emails a 6-digit code (Brevo)
//   2. verifyOtp(code)    → backend returns a JWT; we store it and unlock the panel
//
// The session is the JWT (in localStorage via the api client). On boot we call
// /auth/me to restore + confirm the token is still a valid admin session.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth as authApi, getToken, setToken } from "../lib/api.js";

const USER_KEY = "mhb_admin_user_v1";
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(null); // { email }

  // Restore session from a stored token on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) { setReady(true); return; }
      try {
        const { user: me } = await authApi.me();
        if (cancelled) return;
        if (me?.role === "admin") {
          setUser(me);
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        } else {
          setToken(null);
        }
      } catch {
        setToken(null); // expired / invalid
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Step 1 — ask the backend to email a code.
  const requestOtp = useCallback(async (email) => {
    const e = (email || "").trim().toLowerCase();
    if (!e) return { ok: false, error: "Enter your email." };
    try {
      const res = await authApi.requestOtp(e);
      setPending({ email: e });
      // devCode is only present in local dev when Brevo isn't configured.
      return { ok: true, devCode: res?.devCode };
    } catch (err) {
      return { ok: false, error: err.message || "Couldn't send the code." };
    }
  }, []);

  // Step 2 — verify the code and open the session.
  const verifyOtp = useCallback(async (code) => {
    if (!pending) return { ok: false, error: "Request a code first." };
    try {
      const { user: me } = await authApi.verifyOtp(pending.email, String(code).trim());
      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      setPending(null);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Incorrect code." };
    }
  }, [pending]);

  const cancelOtp = useCallback(() => setPending(null), []);

  const logout = useCallback(() => {
    authApi.logout();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setPending(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, pending, requestOtp, verifyOtp, cancelOtp, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
