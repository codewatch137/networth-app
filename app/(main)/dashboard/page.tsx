"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/userContext";
import { formatINRCompact } from "@/lib/formatINR";
import dayjs from "dayjs";

interface RecentCert {
  _id: string;
  certNumber?: string;
  asOnDate: string;
  issueDate?: string;
  issuedAt?: string;
  createdAt?: string;
  status: "draft" | "issued";
  netWorth: number;
  purpose?: string;
  clientId: { _id: string; full_name: string; pan: string };
}

interface PurposeBucket { label: string; value: number; }

interface Stats {
  totalClients: number;
  totalIssued: number;
  totalDrafts: number;
  issuedThisMonth: number;
  totalNetWorth: number; // ₹ (rupees)
  avgNetWorth: number;
  purposeBreakdown: PurposeBucket[];
  recentCerts: RecentCert[];
}

const EMPTY: Stats = {
  totalClients: 0, totalIssued: 0, totalDrafts: 0, issuedThisMonth: 0,
  totalNetWorth: 0, avgNetWorth: 0,
  purposeBreakdown: [
    { label: "Visa applications", value: 0 },
    { label: "Bank loans",        value: 0 },
    { label: "Govt. tenders",     value: 0 },
    { label: "Court matters",     value: 0 },
    { label: "Other",             value: 0 },
  ],
  recentCerts: [],
};

/* Initials avatar */
function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = (name || "?")
    .split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--brand-soft)", color: "var(--brand)",
      display: "grid", placeItems: "center",
      fontSize: size * 0.42, fontWeight: 600, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 16 16", fill: "none" };
  switch (name) {
    case "trending_up":
      return <svg {...props}><path d="M2 12L6 7l3 3 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "users":
      return <svg {...props}><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="11.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M14.5 13c0-2-1.3-3.2-3.2-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case "file":
      return <svg {...props}><path d="M3 1.5h6l4 4V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
    case "edit":
      return <svg {...props}><path d="M2.5 13.5L3 10.5l7-7 3 3-7 7-3 .5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
    case "user_plus":
      return <svg {...props}><circle cx="6" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12 6.5v4M14 8.5h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3"/><path d="M13 8l-1.2-.6.4-1.4-1.3-.7L10.4 4 9 4.4 8.5 3 7.5 3 7 4.4 5.6 4l-.5 1.3-1.3.7.4 1.4L3 8l1.2.6-.4 1.4 1.3.7.5 1.3L7 11.6 7.5 13l1 0L9 11.6l1.4.4.5-1.3 1.3-.7-.4-1.4L13 8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>;
    case "upload":
      return <svg {...props}><path d="M8 11V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 11.5v2a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case "download":
      return <svg {...props}><path d="M8 3v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 13.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
    case "plus":
      return <svg {...props}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
    case "chevron_right":
      return <svg {...props}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    default:
      return null;
  }
}

function StatCard({ label, value, delta, deltaUp, icon }: {
  label: string; value: string; delta?: string; deltaUp?: boolean; icon: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-label"><Icon name={icon} size={13}/> {label}</div>
      <div className="stat-card-value">{value}</div>
      {delta && (
        <div className="stat-card-meta">
          <span className={deltaUp ? "delta-up" : "muted"}>
            {deltaUp && <Icon name="trending_up" size={11}/>}
            <span style={{ marginLeft: deltaUp ? 4 : 0 }}>{delta}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, hint, onClick }: {
  icon: string; label: string; hint: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12,
      padding: 10, border: "none", borderRadius: "var(--radius-sm)",
      background: "transparent", cursor: "pointer", textAlign: "left",
      transition: "background 0.15s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: "var(--brand-soft)", color: "var(--brand)",
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={15}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{label}</div>
        <div className="muted text-xs">{hint}</div>
      </div>
      <span style={{ color: "var(--text-3)" }}><Icon name="chevron_right" size={14}/></span>
    </button>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }}/></div>
      <span className="num">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.recentCerts)) setStats({ ...EMPTY, ...d });
      })
      .catch(() => { /* keep EMPTY */ })
      .finally(() => setLoaded(true));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const firmName  = user?.firmName || "your practice";

  const breakdownMax = Math.max(1, ...stats.purposeBreakdown.map((b) => b.value));

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2>{greeting()}, {firstName} 👋</h2>
          <p>Here&apos;s what&apos;s happening at <b>{firmName}</b> today.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn"><Icon name="download" size={14}/> Export report</button>
          <button className="btn btn-brand" onClick={() => router.push("/clients")}>
            <Icon name="plus" size={14}/> New certificate
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard
          icon="trending_up"
          label="Total certified net worth"
          value={loaded ? formatINRCompact(stats.totalNetWorth) : "—"}
          delta={stats.totalIssued > 0 ? `Across ${stats.totalIssued} issued` : "No issued yet"}
          deltaUp={stats.totalIssued > 0}
        />
        <StatCard
          icon="users"
          label="Active clients"
          value={loaded ? String(stats.totalClients) : "—"}
          delta="Client registry"
          deltaUp={stats.totalClients > 0}
        />
        <StatCard
          icon="file"
          label="Issued this month"
          value={loaded ? String(stats.issuedThisMonth) : "—"}
          delta={stats.issuedThisMonth > 0 ? "On track" : "None yet"}
        />
        <StatCard
          icon="edit"
          label="Pending drafts"
          value={loaded ? String(stats.totalDrafts) : "—"}
          delta={stats.totalDrafts === 1 ? "1 awaiting review" : `${stats.totalDrafts} awaiting review`}
        />
      </div>

      {/* Two-column layout */}
      <div className="split-2-1">

        {/* Recent certificates */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Recent certificates</h3>
              <p>Latest 5 certificates issued or drafted.</p>
            </div>
            <button className="btn btn-sm" onClick={() => router.push("/certificates")}>View all</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Certificate</th>
                <th>Client</th>
                <th>Purpose</th>
                <th className="num">Net worth</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCerts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                    No certificates yet. Open a client to create one.
                  </td>
                </tr>
              ) : stats.recentCerts.map((cert) => {
                const dateLabel = cert.status === "draft"
                  ? "Draft"
                  : (cert.issueDate || cert.issuedAt || cert.createdAt)
                    ? dayjs(cert.issueDate || cert.issuedAt || cert.createdAt).format("DD MMM YYYY")
                    : "—";
                return (
                  <tr key={cert._id} onClick={() => router.push(`/certificates/${cert._id}`)} style={{ cursor: "pointer" }}>
                    <td>
                      <div style={{ fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {cert.certNumber || "—"}
                      </div>
                      <div className="muted text-xs">{dateLabel}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-8">
                        <Avatar name={cert.clientId?.full_name || "?"}/>
                        <span style={{ fontWeight: 500 }}>{cert.clientId?.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="muted">{cert.purpose || "—"}</td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {cert.status === "draft" ? "—" : formatINRCompact(cert.netWorth || 0)}
                    </td>
                    <td>
                      {cert.status === "issued"
                        ? <span className="badge badge-success"><span className="badge-dot"/> Issued</span>
                        : <span className="badge badge-warning"><span className="badge-dot"/> Draft</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="flex-col gap-16">
          {/* Quick actions */}
          <div className="card">
            <div className="card-header"><h3>Quick actions</h3></div>
            <div className="flex-col gap-8" style={{ padding: 12 }}>
              <QuickAction icon="user_plus"  label="Add new client"          hint="Capture PAN, address, contact"   onClick={() => router.push("/clients")}/>
              <QuickAction icon="file"       label="New certificate"         hint="From existing client"            onClick={() => router.push("/clients")}/>
              <QuickAction icon="settings"   label="Configure fields"        hint="Customise asset templates"       onClick={() => router.push("/settings")}/>
              <QuickAction icon="upload"     label="Upload firm letterhead"  hint="Used in certificates"/>
            </div>
          </div>

          {/* This month — purpose breakdown */}
          <div className="card">
            <div className="card-header"><h3>This month</h3></div>
            <div className="card-body">
              <div className="bar-chart">
                {stats.purposeBreakdown.map((b) => (
                  <BarRow key={b.label} label={b.label} value={b.value} max={breakdownMax}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
