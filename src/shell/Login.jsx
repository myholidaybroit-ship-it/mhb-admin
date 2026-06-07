import { useState } from "react";
import { useAuth } from "./auth.jsx";
import { Button, Field, Input } from "../ui/kit.jsx";
import Icon from "../ui/icons.jsx";

// Black logo — the login card is on a light background.
const LOGO_BLACK = "https://res.cloudinary.com/dyxxkrq8r/image/upload/v1779211833/MHB_Logo_Black_bdpszg.avif";

export default function Login() {
  const { requestOtp, verifyOtp, cancelOtp, pending } = useAuth();
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState(""); // only set in local dev (no Brevo)

  const sentTo = pending?.email || email;

  const submitEmail = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await requestOtp(email);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setDevCode(res.devCode || "");
    setNote(`We sent a 6-digit code to ${email}.`);
    setCode(""); setStep("otp");
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await verifyOtp(code);
    setBusy(false);
    if (!res.ok) setError(res.error);
    // on success the gate swaps this screen out automatically
  };

  const resend = async () => {
    setBusy(true); setError("");
    const res = await requestOtp(sentTo);
    setBusy(false);
    if (res.ok) { setDevCode(res.devCode || ""); setCode(""); setNote("Sent a new code."); }
    else setError(res.error);
  };

  const back = () => { cancelOtp(); setStep("email"); setError(""); setNote(""); setCode(""); setDevCode(""); };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <img src={LOGO_BLACK} alt="MyHolidayBro" className="login-brand-logo" />
        </div>

        {step === "email" ? (
          <>
            <h1 style={{ fontSize: 24, marginTop: 4 }}>Sign in</h1>
            <p className="muted" style={{ marginTop: 4 }}>Enter your admin email — we'll send a one-time code.</p>
            <form onSubmit={submitEmail} className="col gap-4" style={{ marginTop: "var(--sp-6)" }}>
              <Field label="Email" error={error}>
                <Input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="admin@myholidaybro.com"
                  invalid={!!error}
                />
              </Field>
              <Button type="submit" variant="primary" size="lg" className="btn-block" disabled={busy || !email}>
                {busy ? "Sending…" : "Send code"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, marginTop: 4 }}>Enter the code</h1>
            <p className="muted" style={{ marginTop: 4 }}>{note || <>We sent a 6-digit code to <strong>{sentTo}</strong>.</>}</p>

            {devCode && (
              <div className="otp-demo">
                <Icon name="bell" size={15} />
                <span>Dev code (no email configured) — <strong style={{ letterSpacing: 2, fontSize: 16 }}>{devCode}</strong></span>
              </div>
            )}

            <form onSubmit={submitOtp} className="col gap-4" style={{ marginTop: "var(--sp-5)" }}>
              <Field label="One-time code" error={error}>
                <Input
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="••••••"
                  invalid={!!error}
                  style={{ letterSpacing: 8, fontSize: 20, textAlign: "center" }}
                />
              </Field>
              <Button type="submit" variant="primary" size="lg" className="btn-block" disabled={busy || code.length < 6}>
                {busy ? "Verifying…" : "Verify & sign in"}
              </Button>
            </form>

            <div className="row-between" style={{ marginTop: "var(--sp-4)" }}>
              <button type="button" className="link-btn" onClick={back} disabled={busy}>← Change email</button>
              <button type="button" className="link-btn" onClick={resend} disabled={busy}>Resend code</button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .login-brand-logo { height:40px; width:auto; display:block; }
        .otp-demo { display:flex; align-items:center; gap:8px; margin-top:var(--sp-5); padding:10px 14px; border-radius:var(--r-md); background:var(--accent-soft); color:var(--accent-ink); font-size:var(--fs-sm); }
        .link-btn { background:none; border:none; color:var(--text-2); font-size:var(--fs-sm); font-weight:600; cursor:pointer; padding:0; }
        .link-btn:hover { color:var(--ink); }
        .link-btn:disabled { opacity:.5; cursor:default; }
      `}</style>
    </div>
  );
}
