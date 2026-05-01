"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message } from "antd";
import dayjs from "dayjs";
import { useFieldConfig } from "@/lib/fieldConfigContext";

interface Client {
  _id: string;
  full_name: string;
  pan?: string;
  dob?: string;
  aadhaar?: string;
  father_name?: string;
  gender?: string;
  marital_status?: string;
  mobile?: string;
  email?: string;
  permanent_address?: string;
  office_address?: string;
  occupation?: string;
  annual_income?: string;
  profile_photo?: string;
  clientRef?: string;
  createdAt?: string;
  customFields?: Record<string, string>;
  [key: string]: string | Record<string, string> | undefined;
}

interface Certificate {
  _id: string;
  certNumber: string;
  asOnDate: string;
  issueDate?: string;
  status: "draft" | "issued";
  netWorth: number;
  createdAt: string;
}


function Avatar({ name, size = 48, photoUrl }: { name: string; size?: number; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "2px solid var(--border)" }}>
        <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const colors = ["#f59e0b,#ef4444", "#06b6d4,#6366f1", "#10b981,#059669", "#8b5cf6,#ec4899"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${colors[idx]})`,
      display: "grid", placeItems: "center",
      color: "white", fontSize: size * 0.36, fontWeight: 600,
    }}>{initials}</div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="muted text-xs" style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13 }}>{value || "—"}</div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { configs } = useFieldConfig();
  const [client, setClient]     = useState<Client | null>(null);
  const [certs, setCerts]       = useState<Certificate[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cr, certr] = await Promise.all([
          fetch(`/api/clients/${id}`),
          fetch(`/api/certificates?clientId=${id}`),
        ]);
        const cd    = await cr.json();
        const certd = await certr.json();
        if (cr.ok) setClient(cd.client);
        else message.error("Client not found");
        if (certr.ok) setCerts(certd.certificates || []);
      } catch {
        message.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      const removed = Number(data?.deletedCertificates ?? 0);
      message.success(
        removed > 0
          ? `Client deleted along with ${removed} certificate${removed === 1 ? "" : "s"}`
          : "Client deleted"
      );
      router.push("/clients");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to delete client");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>
      Loading…
    </div>
  );
  if (!client) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)" }}>
      Client not found.
    </div>
  );

  const photoField = configs.client.find((f) => f.type === "photo" && f.visible);
  const photoUrl =
    client.profile_photo ||
    (photoField ? client.customFields?.[photoField.key] : undefined);

  return (
    <div>
      {/* ── Page header ─────────────────────────────────── */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/clients")}
            style={{ marginBottom: 8, paddingLeft: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
            Registry
          </button>
          <div className="flex items-center gap-16">
            <Avatar name={client.full_name} size={48} photoUrl={photoUrl} />
            <div>
              <h2>{client.full_name}</h2>
              <p>
                {client.occupation && <>{client.occupation} · </>}
                PAN <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{client.pan || "—"}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={() => router.push(`/clients/${id}/edit`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit details
          </button>
          <button className="btn btn-brand" onClick={() => router.push(`/clients/${id}/certificates/new`)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            New certificate
          </button>
        </div>
      </div>

      {/* ── Split layout ─────────────────────────────────── */}
      <div className="split-2-1">

        {/* LEFT — Certificates ──────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <h3>Certificates issued</h3>
            <span className="muted text-sm">{certs.length} total</span>
          </div>

          {certs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: "var(--brand-soft)",
                display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--brand)",
              }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="2" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5.5 6h5M5.5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>No certificates yet</h3>
              <p className="muted text-sm" style={{ maxWidth: 320, margin: "0 auto 16px" }}>
                Issue your first net worth certificate for this client.
              </p>
              <button className="btn btn-brand" onClick={() => router.push(`/clients/${id}/certificates/new`)}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Create certificate
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Purpose</th>
                  <th className="num">Net worth</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((cert) => (
                  <tr
                    key={cert._id}
                    onClick={() => router.push(`/certificates/${cert._id}`)}
                  >
                    <td className="text-mono text-xs" style={{ fontWeight: 600 }}>
                      {cert.certNumber || "—"}
                    </td>
                    <td>Net Worth Statement</td>
                    <td className="num">
                      {cert.status === "draft" ? "—" : cert.netWorth ? `₹${cert.netWorth.toFixed(2)}` : "—"}
                    </td>
                    <td className="muted">
                      {cert.issueDate
                        ? dayjs(cert.issueDate).format("DD MMM YYYY")
                        : cert.status === "draft" ? "Draft" : cert.asOnDate ? dayjs(cert.asOnDate).format("DD MMM YYYY") : "—"}
                    </td>
                    <td>
                      {cert.status === "issued"
                        ? <span className="badge badge-success"><span className="badge-dot" /> Issued</span>
                        : <span className="badge badge-warning"><span className="badge-dot" /> Draft</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT — Profile ──────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <h3>Profile</h3>
          </div>
          <div className="card-body flex-col gap-16">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <ProfileRow
                  label="Date of birth"
                  value={client.dob ? dayjs(client.dob).format("D MMMM YYYY") : undefined}
                />
                <ProfileRow label="Phone" value={client.mobile} />
                <ProfileRow label="Email" value={client.email} />
                <ProfileRow label="Permanent address" value={client.permanent_address} />
                <ProfileRow label="Office address" value={client.office_address} />
                <ProfileRow
                  label="Onboarded"
                  value={client.createdAt ? dayjs(client.createdAt).format("DD MMM YYYY") : undefined}
                />
              </div>
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={client.full_name}
                  style={{ width: 96, height: 96, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                />
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <span
                style={{ fontSize: 12, color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}
                onClick={() => router.push(`/clients/${id}/edit`)}
              >
                Edit details
              </span>

              {confirmDelete ? (
                <div className="flex gap-8 items-center" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className="muted text-xs" style={{ maxWidth: 240, textAlign: "right" }}>
                    {certs.length > 0
                      ? `This will also remove ${certs.length} certificate${certs.length === 1 ? "" : "s"}. Continue?`
                      : "Permanently delete this client?"}
                  </span>
                  <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button className="btn btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              ) : (
                <span
                  style={{ fontSize: 12, color: "var(--danger)", cursor: "pointer" }}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
