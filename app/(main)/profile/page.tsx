"use client";

import { useUser } from "@/lib/userContext";
import { useRouter } from "next/navigation";

function Avatar({ initials, size = 64 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
      display: "grid", placeItems: "center",
      color: "white", fontSize: size * 0.36, fontWeight: 600,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="muted text-xs" style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13 }}>{value || "—"}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: "var(--text-3)" }}>Loading…</div>;
  }
  if (!user) {
    return <div style={{ padding: 60, textAlign: "center", color: "var(--text-3)" }}>Not signed in.</div>;
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My profile</h2>
          <p>Your auditor identity and workspace details.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: "flex", gap: 20, alignItems: "center", padding: 20 }}>
          <Avatar initials={initials} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{user.name}</div>
            <div className="muted text-sm">{user.email}</div>
            {user.firmName && (
              <div className="muted text-xs" style={{ marginTop: 4 }}>{user.firmName}</div>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            <InfoRow label="Full name"      value={user.name} />
            <InfoRow label="Email"          value={user.email} />
            <InfoRow label="Firm"           value={user.firmName} />
            <InfoRow label="ICAI Membership No." value={user.membershipNo} />
          </div>
        </div>

        <div className="form-footer">
          <button className="btn" onClick={() => router.push("/settings")}>Open settings</button>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
