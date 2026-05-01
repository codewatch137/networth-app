"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Form, message, Row, Col } from "antd";
import { useFieldConfig } from "@/lib/fieldConfigContext";
import DynamicField from "@/components/ui/DynamicField";
import dayjs from "dayjs";

interface Client {
  _id: string;
  full_name: string;
  pan: string;
  dob?: string;
  mobile: string;
  email?: string;
  occupation?: string;
  profile_photo?: string;
  clientRef: string;
  createdAt: string;
  [key: string]: string | undefined;
}

type View = "list" | "add";
type SortKey = "recent" | "name";

function Avatar({ name, size = 32, photoUrl }: { name: string; size?: number; photoUrl?: string }) {
  if (photoUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
        <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const colors = ["#f59e0b,#ef4444", "#06b6d4,#6366f1", "#10b981,#059669", "#8b5cf6,#ec4899"];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${colors[idx]})`,
      display: "grid", placeItems: "center",
      color: "white", fontSize: size * 0.36, fontWeight: 600,
    }}>{initials}</div>
  );
}

function exportCSV(clients: Client[], certCounts: Record<string, number>) {
  const headers = ["Name", "PAN", "Occupation", "Mobile", "Email", "Certificates", "Added On"];
  const rows = clients.map((c) => [
    c.full_name || "",
    c.pan || "",
    c.occupation || "",
    c.mobile || "",
    c.email || "",
    String(certCounts[c._id] ?? 0),
    c.createdAt ? dayjs(c.createdAt).format("DD MMM YYYY") : "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `clients-${dayjs().format("YYYY-MM-DD")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClientsPage() {
  const router = useRouter();
  const { configs } = useFieldConfig();
  const clientFields = configs.client.filter((f) => f.visible);

  const [clients, setClients]       = useState<Client[]>([]);
  const [filtered, setFiltered]     = useState<Client[]>([]);
  const [certCounts, setCertCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [sort, setSort]             = useState<SortKey>("recent");
  const [view, setView]             = useState<View>("list");
  const [form] = Form.useForm();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const [clientRes, certRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/certificates"),
      ]);
      const clientData = await clientRes.json();
      const certData   = await certRes.json();

      if (clientRes.ok) {
        const list = Array.isArray(clientData?.clients) ? clientData.clients : [];
        setClients(list);
        setFiltered(list);
      }
      if (certRes.ok) {
        const counts: Record<string, number> = {};
        for (const cert of certData?.certificates ?? []) {
          // clientId may be null (client deleted), an ObjectId string, or a populated object
          if (!cert?.clientId) continue;
          const cid = typeof cert.clientId === "object"
            ? (cert.clientId._id ?? null)
            : cert.clientId;
          if (!cid) continue;
          counts[cid] = (counts[cid] ?? 0) + 1;
        }
        setCertCounts(counts);
      }
    } catch (err) {
      console.error("fetchClients failed", err);
      message.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    let list = [...clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.pan?.toLowerCase().includes(q) ||
        c.mobile?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.clientRef?.toLowerCase().includes(q)
      );
    }
    if (sort === "name") list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    setFiltered(list);
  }, [search, sort, clients]);

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      setSaving(true);
      try {
        const dateFields = clientFields.filter((f) => f.type === "date").map((f) => f.key);

        const systemPayload: Record<string, unknown> = {};
        const customPayload: Record<string, unknown> = {};
        clientFields.forEach((f) => {
          if (!(f.key in values)) return;
          if (f.isSystem) systemPayload[f.key] = values[f.key];
          else customPayload[f.key] = values[f.key];
        });

        dateFields.forEach((key) => {
          const target = key in systemPayload ? systemPayload : customPayload;
          if (target[key] && dayjs.isDayjs(target[key]))
            target[key] = (target[key] as ReturnType<typeof dayjs>).toISOString();
        });

        const payload = { ...systemPayload, customFields: customPayload };
        const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        message.success("Client added successfully");
        setView("list"); form.resetFields(); fetchClients();
      } catch (err: unknown) {
        message.error(err instanceof Error ? err.message : "Failed to save client");
      } finally { setSaving(false); }
    });
  };

  /* ── Add form ── */
  if (view === "add") {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => { form.resetFields(); setView("list"); }} style={{ marginBottom: 8, paddingLeft: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
              </svg>
              Back to registry
            </button>
            <h2>Add new client</h2>
            <p>Capture identity, contact, and address details. You&apos;ll be able to issue certificates immediately after.</p>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div className="flex items-center gap-12">
              <div className="section-header-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h4>Identity</h4>
                <p>Personal information that appears on all certificates.</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <Form form={form} layout="vertical" requiredMark={false}>
              <Row gutter={24}>
                {clientFields.map((field) => (
                  <Col key={field.key} xs={24} sm={12}>
                    <DynamicField field={field} />
                  </Col>
                ))}
              </Row>
            </Form>
          </div>
          <div className="form-footer">
            <button className="btn" onClick={() => { form.resetFields(); setView("list"); }}>Cancel</button>
            <button className="btn btn-brand" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save & continue →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Client registry</h2>
          <p>{clients.length} client{clients.length !== 1 ? "s" : ""} · {clients.length} active</p>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={() => exportCSV(filtered, certCounts)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button className="btn btn-brand" onClick={() => setView("add")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New client
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input
              placeholder="Search by name or PAN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-8">
            <select
              className="input"
              style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All clients</option>
              <option value="active">Active</option>
            </select>
            <select
              className="input"
              style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="recent">Sort: Recent</option>
              <option value="name">Sort: Name A→Z</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>PAN</th>
              <th>Occupation</th>
              <th>Contact</th>
              <th className="num">Certificates</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-3)" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--brand-soft)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--brand)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{search ? "No results" : "No clients yet"}</div>
                <div className="muted text-sm">{search ? "Try a different name or PAN." : "Add your first client to get started."}</div>
              </td></tr>
            ) : filtered.map((client) => (
              <tr key={client._id} onClick={() => router.push(`/clients/${client._id}`)}>
                <td>
                  <div className="flex items-center gap-12">
                    <Avatar name={client.full_name} size={34} photoUrl={client.profile_photo} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{client.full_name || "—"}</div>
                      <div className="muted text-xs">
                        {client.dob
                          ? `DOB ${dayjs(client.dob).format("DD MMM YYYY")}`
                          : client.clientRef ? `Ref ${client.clientRef}` : "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>
                    {client.pan || "—"}
                  </span>
                </td>
                <td className="muted">{client.occupation || "—"}</td>
                <td>
                  <div className="text-xs">{client.mobile || "—"}</div>
                  <div className="muted text-xs">{client.email || "—"}</div>
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {certCounts[client._id] ?? 0}
                </td>
                <td>
                  <span className="badge badge-success">
                    <span className="badge-dot" />
                    Active
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/clients/${client._id}`); }}>
                    Open
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
