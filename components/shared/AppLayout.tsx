"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/userContext";

/* ── Icons (inline SVG, no dep) ─────────────────────────── */
function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    home: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15v-5h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    users: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 7c1.66 0 3 1.34 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
    file: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="5.5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    settings: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    bell: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 1a5 5 0 00-5 5v3l-1.5 2h13L13 9V6a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    search: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    logout: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 11l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><line x1="7" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    user: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 13.5c0-2.5 2.4-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    chevron_right: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    chevron_up: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return <>{icons[name] ?? null}</>;
}

/* ── Nav items ───────────────────────────────────────────── */
const NAV_ITEMS = [
  { key: "/dashboard",      label: "Dashboard",    icon: "home" },
  { key: "/clients",        label: "Clients",      icon: "users" },
  { key: "/certificates",   label: "Certificates", icon: "file" },
  { key: "/settings",       label: "Settings",     icon: "settings" },
];

function getBreadcrumbs(pathname: string): string[] {
  if (pathname === "/dashboard") return ["Dashboard"];
  if (pathname === "/clients") return ["Clients", "Registry"];
  if (pathname.includes("/clients/") && pathname.includes("/edit")) return ["Clients", "Edit client"];
  if (pathname.includes("/clients/") && pathname.includes("/certificates")) return ["Clients", "New certificate"];
  if (pathname.includes("/clients/") && pathname !== "/clients") return ["Clients", "Client details"];
  if (pathname.includes("/certificates/") && pathname.includes("/edit")) return ["Certificates", "Edit"];
  if (pathname.includes("/certificates/new")) return ["Certificates", "New"];
  if (pathname.includes("/certificates/")) return ["Certificates", "Preview"];
  if (pathname === "/certificates") return ["Certificates"];
  if (pathname === "/settings") return ["Settings"];
  return ["NetWorth Studio"];
}

/* ── Avatar ──────────────────────────────────────────────── */
function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
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

/* ── Shared styles ───────────────────────────────────────── */
const menuItemStyle: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", gap: 10,
  padding: "8px 10px", fontSize: 13, fontWeight: 500,
  border: "none", borderRadius: "var(--radius-sm)",
  background: "transparent", cursor: "pointer", textAlign: "left",
  color: "var(--text)",
  transition: "background 0.15s",
};

/* ── Main layout ─────────────────────────────────────────── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close the user menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const displayName = user?.name ?? "Loading...";
  const displaySub  = user?.membershipNo ? `Partner · M.No. ${user.membershipNo}` : (user?.email ?? "");

  const isActive = (key: string) => {
    if (key === "/certificates") return pathname === "/certificates" || (pathname.startsWith("/certificates") && !pathname.includes("/new"));
    if (key === "/clients") return pathname === "/clients" || (pathname.startsWith("/clients") && !pathname.includes("/certificates"));
    return pathname === key || pathname.startsWith(key + "/");
  };

  const crumbs = getBreadcrumbs(pathname);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: sidebarOpen ? 240 : 0,
        flexShrink: 0,
        background: "var(--bg-elev)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}>

        {/* Brand */}
        <div style={{ padding: "20px 14px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
            {/* Gradient logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, var(--brand) 0%, #8b5cf6 100%)",
              display: "grid", placeItems: "center",
              color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em",
            }}>N</div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text)", whiteSpace: "nowrap" }}>NetWorth Studio</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                {user?.firmName ?? "Auditor Workspace"}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: "10px 14px", flex: 1, overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.key);
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", fontSize: 13.5, fontWeight: 500,
                  border: "none", borderRadius: "var(--radius-sm)",
                  background: active ? "var(--brand-soft)" : "transparent",
                  color: active ? "var(--brand)" : "var(--text-2)",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s ease",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
              >
                <Icon name={item.icon} size={15} />
                <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>
                {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom — user chip */}
        <div style={{ padding: "14px", borderTop: "1px solid var(--border)", position: "relative" }} ref={userMenuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((o) => !o)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: 8, borderRadius: "var(--radius)", cursor: "pointer",
              background: userMenuOpen ? "var(--bg-subtle)" : "transparent",
              border: "none", textAlign: "left", color: "var(--text)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!userMenuOpen) (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
            onMouseLeave={(e) => { if (!userMenuOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Avatar initials={initials} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displaySub}</div>
            </div>
            <span style={{ color: "var(--text-3)", display: "flex" }}>
              <Icon name={userMenuOpen ? "chevron_up" : "chevron_right"} size={14} />
            </span>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                bottom: "calc(100% - 6px)",
                left: 14, right: 14,
                background: "var(--bg-elev)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.12))",
                padding: 6,
                zIndex: 30,
              }}
            >
              <button
                role="menuitem"
                onClick={() => { setUserMenuOpen(false); router.push("/profile"); }}
                style={menuItemStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon name="user" size={14} />
                <span>View profile</span>
              </button>
              <div style={{ height: 1, background: "var(--border)", margin: "4px 6px" }} />
              <button
                role="menuitem"
                onClick={handleLogout}
                style={{ ...menuItemStyle, color: "var(--danger)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon name="logout" size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 60, background: "var(--bg-elev)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 28px", gap: 16,
          position: "sticky", top: 0, zIndex: 20, flexShrink: 0,
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-3)", display: "flex", borderRadius: "var(--radius-sm)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontSize: 13 }}>
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <Icon name="chevron_right" size={12} />}
                <span style={{ color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-3)", fontWeight: i === crumbs.length - 1 ? 600 : 500 }}>{c}</span>
              </span>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ position: "relative", maxWidth: 260 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Search… ⌘K"
                style={{
                  padding: "7px 12px 7px 32px", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", fontSize: 13, background: "var(--bg-elev)",
                  color: "var(--text)", width: 220, outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Bell */}
            <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", width: 32, height: 32, display: "grid", placeItems: "center", color: "var(--text-3)", cursor: "pointer" }}>
              <Icon name="bell" size={15} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: 28, maxWidth: 1280, width: "100%" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
