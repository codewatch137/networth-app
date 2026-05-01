"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) {
      message.error("Please fill in all fields");
      return;
    }
    if (password !== confirm) {
      message.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
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
            Get started in
            <br />
            minutes.
          </h2>
          <p>
            Create your account and start managing certified net worth
            statements for your clients — with configurable asset templates,
            automatic calculations, and UDIN-compliant output.
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
          <div
            className="lg:hidden"
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--brand)", color: "white",
                display: "grid", placeItems: "center", fontWeight: 700,
              }}
            >
              N
            </div>
            <span style={{ fontWeight: 600, color: "var(--text)" }}>
              NetWorth<span style={{ color: "var(--text-3)", fontWeight: 400 }}> · Studio</span>
            </span>
          </div>

          <h1>Create account</h1>
          <p className="subtitle">Set up your auditor workspace in seconds.</p>

          <form className="login-form" onSubmit={submit}>
            <div className="field">
              <label className="label">Full Name</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. R. Kumar"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Create a password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Confirm Password</label>
              <input
                className="input"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-brand btn-lg"
              style={{ justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10m0 0L9 4m4 4l-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginTop: 12 }}>
              Already have an account?{" "}
              <a
                href="#"
                style={{ color: "var(--brand)", fontWeight: 500, textDecoration: "none" }}
                onClick={(e) => { e.preventDefault(); router.push("/login"); }}
              >
                Sign in
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
