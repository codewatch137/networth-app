"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { formatINRCompact } from "@/lib/formatINR";
import dayjs from "dayjs";

interface Certificate {
  _id: string;
  certNumber: string;
  asOnDate: string;
  status: "draft" | "issued";
  netWorth: number;
  clientId: { _id: string; full_name: string; pan: string };
  createdAt: string;
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const colors = ["#f59e0b,#ef4444", "#06b6d4,#6366f1", "#10b981,#059669", "#8b5cf6,#ec4899"];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${colors[idx]})`, display: "grid", placeItems: "center", color: "white", fontSize: size * 0.36, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [filtered, setFiltered] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((d) => { if (d.certificates) { setCerts(d.certificates); setFiltered(d.certificates); } })
      .catch(() => message.error("Failed to load certificates"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(certs); return; }
    const q = search.toLowerCase();
    setFiltered(certs.filter((c) =>
      c.certNumber?.toLowerCase().includes(q) ||
      c.clientId?.full_name?.toLowerCase().includes(q) ||
      c.clientId?.pan?.toLowerCase().includes(q)
    ));
  }, [search, certs]);

  const issued = certs.filter((c) => c.status === "issued").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>All certificates</h2>
          <p>{certs.length} certificates · {issued} issued</p>
        </div>
        <div className="page-header-actions">
          <button className="btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v7M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Export
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input
              placeholder="Search cert no., client name or PAN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Certificate</th>
              <th>Client</th>
              <th>As on date</th>
              <th className="num">Net worth</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-3)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--brand-soft)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--brand)" }}>
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{search ? "No results" : "No certificates yet"}</div>
                <div className="muted text-sm">{search ? "Try a different search." : "Open a client to issue a certificate."}</div>
              </td></tr>
            ) : filtered.map((cert) => (
              <tr key={cert._id} onClick={() => router.push(`/certificates/${cert._id}`)}>
                <td>
                  <div className="text-mono text-xs" style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{cert.certNumber || "—"}</div>
                  <div className="muted text-xs">{cert.asOnDate ? dayjs(cert.asOnDate).format("DD MMM YYYY") : "Draft"}</div>
                </td>
                <td>
                  <div className="flex items-center gap-8">
                    <Avatar name={cert.clientId?.full_name ?? ""} size={28} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{cert.clientId?.full_name || "—"}</div>
                      <div className="muted text-xs" style={{ fontFamily: "var(--font-mono)" }}>{cert.clientId?.pan || "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="muted">{cert.asOnDate ? dayjs(cert.asOnDate).format("DD MMM YYYY") : "—"}</td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {formatINRCompact(cert.netWorth)}
                </td>
                <td>
                  {cert.status === "issued"
                    ? <span className="badge badge-success"><span className="badge-dot"/> Issued</span>
                    : <span className="badge badge-warning"><span className="badge-dot"/> Draft</span>}
                </td>
                <td className="muted">{cert.createdAt ? dayjs(cert.createdAt).format("DD MMM YYYY") : "—"}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-8">
                    <button className="btn btn-sm" onClick={() => router.push(`/certificates/${cert._id}`)}>View</button>
                    <button className="btn btn-sm" onClick={() => router.push(`/certificates/${cert._id}/edit`)}>
                      {cert.status === "issued" ? "Amend" : "Edit"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
