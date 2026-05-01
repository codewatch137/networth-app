"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Form, Row, Col, message } from "antd";
import { useFieldConfig } from "@/lib/fieldConfigContext";
import DynamicField from "@/components/ui/DynamicField";
import dayjs from "dayjs";

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { configs } = useFieldConfig();
  const clientFields = configs.client.filter((f) => f.visible);

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [rawClient, setRawClient] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/clients/${id}`);
        const data = await res.json();
        if (res.ok) setRawClient(data.client);
        else message.error("Client not found");
      } catch {
        message.error("Failed to load client");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Populate form: merge top-level fields + customFields sub-object
  useEffect(() => {
    if (!rawClient || !configs.client.length) return;

    const dateFields = configs.client.filter((f) => f.type === "date").map((f) => f.key);

    // Flatten customFields to top level so DynamicField name bindings work
    const customFields = (rawClient.customFields ?? {}) as Record<string, unknown>;
    const formValues: Record<string, unknown> = { ...rawClient, ...customFields };

    dateFields.forEach((key) => {
      if (formValues[key] && typeof formValues[key] === "string") {
        const parsed = dayjs(formValues[key] as string);
        formValues[key] = parsed.isValid() ? parsed : undefined;
      }
    });

    form.setFieldsValue(formValues);
  }, [rawClient, configs.client, form]);

  const handleSave = () => {
    form.validateFields().then(async (values) => {
      setSaving(true);
      try {
        const dateFields = configs.client.filter((f) => f.type === "date").map((f) => f.key);

        // Separate system fields (top-level schema fields) from custom fields
        const systemPayload: Record<string, unknown> = {};
        const customPayload: Record<string, unknown> = {
          ...((rawClient?.customFields ?? {}) as Record<string, unknown>),
        };

        clientFields.forEach((f) => {
          if (!(f.key in values)) return;
          if (f.isSystem) {
            systemPayload[f.key] = values[f.key];
          } else {
            customPayload[f.key] = values[f.key];
          }
        });

        // Convert dayjs → ISO string
        dateFields.forEach((key) => {
          const target = key in systemPayload ? systemPayload : customPayload;
          if (target[key] && dayjs.isDayjs(target[key])) {
            target[key] = (target[key] as ReturnType<typeof dayjs>).toISOString();
          } else if (!target[key]) {
            target[key] = null;
          }
        });

        const payload = {
          ...systemPayload,
          customFields: customPayload,
        };

        const res  = await fetch(`/api/clients/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        message.success("Client updated successfully");
        router.push(`/clients/${id}`);
      } catch (err: unknown) {
        message.error(err instanceof Error ? err.message : "Failed to update client");
      } finally {
        setSaving(false);
      }
    });
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>
      Loading…
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push(`/clients/${id}`)}
            style={{ marginBottom: 8, paddingLeft: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
            Back to client
          </button>
          <h2>Edit client</h2>
          <p>Update identity, contact, and address details.</p>
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
              <h4>Client details</h4>
              <p>Information that appears on all certificates.</p>
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
          <button className="btn" onClick={() => router.push(`/clients/${id}`)}>Cancel</button>
          <button className="btn btn-brand" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}
