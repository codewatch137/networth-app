"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeep] = useState(true);
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      message.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* ── Aside (hero panel) ─────────────────────────── */}
      <aside className="login-aside">
        <div className="login-aside-brand">
          <div className="login-aside-mark">N</div>
          <div>
            NetWorth
            <span style={{ opacity: 0.6, fontWeight: 400 }}> · Studio</span>
          </div>
        </div>

        <div>
          <h2>
            The fastest way to issue
            <br />
            net worth certificates.
          </h2>
          <p>
            Build certified, audit-ready net worth statements in minutes — with
            configurable asset templates, automatic calculations, and
            UDIN-compliant output.
          </p>
        </div>

        <div className="login-aside-stats">
          <div className="login-aside-stat">
            <b>1,247</b>
            <span>Certificates issued</span>
          </div>
          <div className="login-aside-stat">
            <b>312</b>
            <span>Active practices</span>
          </div>
          <div className="login-aside-stat">
            <b>99.9%</b>
            <span>Uptime</span>
          </div>
        </div>
      </aside>

      {/* ── Form side ──────────────────────────────────── */}
      <section className="login-form-side">
        <div className="login-card">
          {/* Mobile brand */}
          <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--brand)", color: "white",
              display: "grid", placeItems: "center", fontWeight: 700,
            }}>N</div>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>
              NetWorth<span style={{ color: "var(--text-3)", fontWeight: 400 }}> · Studio</span>
            </span>
          </div>

          <h1>Welcome back</h1>
          <p className="subtitle">Sign in to continue to your auditor workspace.</p>

          <form className="login-form" onSubmit={submit}>
            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <div className="flex justify-between items-center">
                <label className="label">Password</label>
                <a href="#" style={{ fontSize: 12, color: "var(--brand)", textDecoration: "none", fontWeight: 500 }}
                  onClick={(e) => { e.preventDefault(); message.info("Password reset coming soon."); }}>
                  Forgot?
                </a>
              </div>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--text-2)" }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeep(e.target.checked)}
                style={{ accentColor: "var(--brand)" }}
              />
              Keep me signed in for 30 days
            </label>

            <button
              type="submit"
              className="btn btn-brand btn-lg"
              style={{ justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in to workspace"}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m0 0L9 4m4 4l-4 4"
                    stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <div className="login-divider">or</div>

            <button
              type="button"
              className="btn btn-lg"
              style={{ justifyContent: "center" }}
              onClick={() => message.info("ICAI ID sign-in coming soon.")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l5 2.2v3.6c0 3.4-2 6.4-5 7.2-3-.8-5-3.8-5-7.2V3.2L8 1z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M5.5 8l1.8 1.8L10.5 6.5"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign in with ICAI ID
            </button>

            <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginTop: 12 }}>
              Don&apos;t have an account?{" "}
              <a href="#" style={{ color: "var(--brand)", fontWeight: 500, textDecoration: "none" }}
                onClick={(e) => { e.preventDefault(); router.push("/register"); }}>
                Create one
              </a>
            </p>
          </form>

          <p style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", marginTop: 28 }}>
            Protected by 256-bit TLS · ISO 27001 · SOC 2 Type II
          </p>
        </div>
      </section>
    </div>
  );
}
