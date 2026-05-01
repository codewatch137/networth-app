"use client";

import { useState, useEffect, createContext, useContext } from "react";
import {
  Tabs,
  Table,
  Switch,
  Select,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tooltip,
  Space,
  message,
  Alert,
} from "antd";
import {
  LockOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { useFieldConfig, ModuleKey, FieldConfig, FieldValidation } from "@/lib/fieldConfigContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FieldType = "text" | "number" | "date" | "dropdown" | "checkbox" | "photo";

const fieldTypeOptions: { label: string; value: FieldType }[] = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Photo Upload", value: "photo" },
];


interface DragHandleContextType {
  listeners?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}
const DragHandleContext = createContext<DragHandleContextType>({});

function DragHandle() {
  const { listeners, attributes } = useContext(DragHandleContext);
  return (
    <HolderOutlined
      {...(attributes as object)}
      {...(listeners as object)}
      style={{ cursor: "grab", color: "#d1d5db", fontSize: 14 }}
    />
  );
}

function SortableRow({ children, id, ...props }: { children: React.ReactNode; id: string; [key: string]: unknown }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <DragHandleContext.Provider value={{ listeners: listeners as Record<string, unknown>, attributes: attributes as Record<string, unknown> }}>
      <tr
        ref={setNodeRef}
        {...props}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          background: isDragging ? "#f0f7ff" : undefined,
          ...((props.style as React.CSSProperties) ?? {}),
        }}
      >
        {children}
      </tr>
    </DragHandleContext.Provider>
  );
}

function FieldConfigSection({ module }: { module: ModuleKey }) {
  const { configs, setModuleConfig, saveConfigs } = useFieldConfig();
  const fields = configs[module];

  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { setMounted(true); }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.key === active.id);
      const newIndex = fields.findIndex((f) => f.key === over?.id);
      setModuleConfig(module, arrayMove(fields, oldIndex, newIndex));
    }
  };

  const updateField = (key: string, changes: Partial<FieldConfig>) => {
    setModuleConfig(module, fields.map((f) => (f.key === key ? { ...f, ...changes } : f)));
  };

  const deleteField = (key: string) => {
    setModuleConfig(module, fields.filter((f) => f.key !== key));
  };

  const openAddModal = () => {
    setEditingField(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (field: FieldConfig) => {
    setEditingField(field);
    form.setFieldsValue({
      label:              field.label,
      type:               field.type,
      placeholder:        field.placeholder ?? "",
      dropdownOptions:    field.dropdownOptions ?? [],
      val_minLength:      field.validation?.minLength,
      val_maxLength:      field.validation?.maxLength,
      val_pattern:        field.validation?.pattern,
      val_patternMessage: field.validation?.patternMessage,
      val_min:            field.validation?.min,
      val_max:            field.validation?.max,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const opts: string[] = values.type === "dropdown" ? (values.dropdownOptions ?? []) : [];

      const validation: FieldValidation = {};
      if (values.type === "text") {
        if (values.val_minLength != null && values.val_minLength !== "")
          validation.minLength = Number(values.val_minLength);
        if (values.val_maxLength != null && values.val_maxLength !== "")
          validation.maxLength = Number(values.val_maxLength);
        if (values.val_pattern?.trim())
          validation.pattern = values.val_pattern.trim();
        if (values.val_patternMessage?.trim())
          validation.patternMessage = values.val_patternMessage.trim();
      }
      if (values.type === "number") {
        if (values.val_min != null && values.val_min !== "")
          validation.min = Number(values.val_min);
        if (values.val_max != null && values.val_max !== "")
          validation.max = Number(values.val_max);
      }

      const placeholder = values.placeholder?.trim() || undefined;

      if (editingField) {
        updateField(editingField.key, {
          label: values.label,
          type: values.type,
          placeholder,
          dropdownOptions: opts,
          validation: Object.keys(validation).length ? validation : undefined,
        });
      } else {
        const newField: FieldConfig = {
          key: `custom_${Date.now()}`,
          label: values.label,
          type: values.type,
          mandatory: false,
          visible: true,
          isSystem: false,
          placeholder,
          dropdownOptions: opts,
          validation: Object.keys(validation).length ? validation : undefined,
        };
        setModuleConfig(module, [...fields, newField]);
      }
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const columns = [
    {
      title: "",
      key: "drag",
      width: 32,
      render: () => <DragHandle />,
    },
    {
      title: "Field Label",
      dataIndex: "label",
      key: "label",
      render: (label: string, record: FieldConfig) => (
        <div className="flex items-center gap-2">
          {record.isSystem && (
            <Tooltip title="System field — cannot be deleted">
              <LockOutlined className="text-gray-300" style={{ fontSize: 11 }} />
            </Tooltip>
          )}
          <span className="text-sm text-gray-700">{label}</span>
        </div>
      ),
    },
    {
      title: "Field Type",
      dataIndex: "type",
      key: "type",
      render: (type: FieldType, record: FieldConfig) => (
        <div>
          <Select
            size="small"
            value={type}
            style={{ width: 110 }}
            options={fieldTypeOptions}
            onChange={(val) => updateField(record.key, { type: val, dropdownOptions: val !== "dropdown" ? [] : record.dropdownOptions })}
          />
          {type === "dropdown" && (
            <div className="mt-1 flex flex-wrap gap-1">
              {(record.dropdownOptions ?? []).length > 0 ? (
                (record.dropdownOptions ?? []).map((opt) => (
                  <Tag key={opt} color="cyan" style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}>{opt}</Tag>
                ))
              ) : (
                <span className="text-xs text-orange-400">No options — click Edit</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Visible",
      dataIndex: "visible",
      key: "visible",
      render: (visible: boolean, record: FieldConfig) => (
        <Switch
          size="small"
          checked={visible}
          onChange={(val) => updateField(record.key, { visible: val })}
          style={{ background: visible ? "#185FA5" : undefined }}
        />
      ),
    },
    {
      title: "Mandatory",
      dataIndex: "mandatory",
      key: "mandatory",
      render: (mandatory: boolean, record: FieldConfig) => (
        <Switch
          size="small"
          checked={mandatory}
          onChange={(val) => updateField(record.key, { mandatory: val })}
          style={{ background: mandatory ? "#185FA5" : undefined }}
        />
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: FieldConfig) => (
        <Space size={4}>
          {record.isSystem
            ? <Tag color="default" style={{ fontSize: 11 }}>System</Tag>
            : <Tag color="geekblue" style={{ fontSize: 11 }}>Custom</Tag>}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: FieldConfig) => (
        <Space>
          <Tooltip title="Edit label / type">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          {!record.isSystem && (
            <Tooltip title="Delete custom field">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => deleteField(record.key)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const handleSave = async () => {
    try {
      saveConfigs(configs);
      await fetch(`/api/field-config/${module}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      message.success("Field configuration saved");
    } catch {
      message.error("Failed to save configuration");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-gray-700">
            {module.charAt(0).toUpperCase() + module.slice(1)} Fields
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Configure which fields appear in the {module} form. System fields cannot be deleted.
          </div>
        </div>
        <Space>
          <Button
            icon={<PlusOutlined />}
            size="small"
            onClick={openAddModal}
          >
            Add Custom Field
          </Button>
          <Button
            type="primary"
            size="small"
            style={{ background: "#185FA5" }}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Space>
      </div>

      {mounted ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
            <Table
              dataSource={fields}
              columns={columns}
              rowKey="key"
              size="small"
              pagination={false}
              className="border border-gray-100 rounded-lg overflow-hidden"
              components={{
                body: {
                  row: (props: { children: React.ReactNode; "data-row-key": string; [key: string]: unknown }) => (
                    <SortableRow id={props["data-row-key"]} {...props} />
                  ),
                },
              }}
            />
          </SortableContext>
        </DndContext>
      ) : (
        <Table
          dataSource={fields}
          columns={columns}
          rowKey="key"
          size="small"
          pagination={false}
          className="border border-gray-100 rounded-lg overflow-hidden"
        />
      )}

      <Modal
        title={editingField ? "Edit Field" : "Add Custom Field"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        okText={editingField ? "Save Changes" : "Add Field"}
        okButtonProps={{ style: { background: "#185FA5" } }}
        width={480}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Field Label"
            name="label"
            rules={[{ required: true, message: "Please enter a field label" }]}
          >
            <Input placeholder="e.g. GST Number" />
          </Form.Item>
          <Form.Item
            label="Field Type"
            name="type"
            rules={[{ required: true, message: "Please select a field type" }]}
          >
            <Select options={fieldTypeOptions} placeholder="Select type" />
          </Form.Item>
          <Form.Item label="Placeholder text" name="placeholder">
            <Input placeholder="e.g. Enter GST number (22AAAAA0000A1Z5)" />
          </Form.Item>

          {/* Dropdown options — shown only when type = dropdown */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) =>
              getFieldValue("type") === "dropdown" ? (
                <Form.Item
                  label={
                    <span>
                      Dropdown Options
                      <span className="text-xs font-normal text-gray-400 ml-2">
                        Type an option and press Enter to add
                      </span>
                    </span>
                  }
                  name="dropdownOptions"
                  rules={[
                    {
                      validator: (_, value) =>
                        value && value.length > 0
                          ? Promise.resolve()
                          : Promise.reject("Add at least one option"),
                    },
                  ]}
                >
                  <Select
                    mode="tags"
                    placeholder='Type an option and press Enter — e.g. "Salaried"'
                    tokenSeparators={[","]}
                    style={{ width: "100%" }}
                    open={false}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) =>
              getFieldValue("type") === "dropdown" ? (
                <Alert
                  type="info"
                  showIcon
                  className="mb-2"
                  style={{ fontSize: 12 }}
                  message="Type each option and press Enter (or comma) to add it. Click the × on a tag to remove it."
                />
              ) : null
            }
          </Form.Item>

          {/* Validation rules — shown based on type */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue("type");
              if (type === "text") return (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "16px 0 10px", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    Validation
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Form.Item label="Min length" name="val_minLength" style={{ marginBottom: 8 }}>
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 2" />
                    </Form.Item>
                    <Form.Item label="Max length" name="val_maxLength" style={{ marginBottom: 8 }}>
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 100" />
                    </Form.Item>
                  </div>
                  <Form.Item label="Pattern (regex)" name="val_pattern" style={{ marginBottom: 8 }}>
                    <Select
                      allowClear
                      showSearch
                      placeholder="Choose preset or type custom regex"
                      options={[
                        { label: "PAN — ABCDE1234F", value: "^[A-Z]{5}[0-9]{4}[A-Z]$" },
                        { label: "Aadhaar — 12 digits", value: "^[0-9]{12}$" },
                        { label: "Mobile — 10 digits", value: "^[6-9][0-9]{9}$" },
                        { label: "Email", value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
                        { label: "GSTIN", value: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$" },
                        { label: "PIN code — 6 digits", value: "^[1-9][0-9]{5}$" },
                      ]}
                      mode={undefined}
                      onChange={(val) => {
                        if (!val) form.setFieldValue("val_patternMessage", undefined);
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="Pattern error message" name="val_patternMessage" style={{ marginBottom: 0 }}>
                    <Input placeholder="e.g. Enter a valid PAN (ABCDE1234F)" />
                  </Form.Item>
                </>
              );
              if (type === "number") return (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "16px 0 10px", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    Validation
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Form.Item label="Min value" name="val_min" style={{ marginBottom: 0 }}>
                      <InputNumber style={{ width: "100%" }} placeholder="e.g. 0" />
                    </Form.Item>
                    <Form.Item label="Max value" name="val_max" style={{ marginBottom: 0 }}>
                      <InputNumber style={{ width: "100%" }} placeholder="e.g. 9999" />
                    </Form.Item>
                  </div>
                </>
              );
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

const sectionTabs: { key: ModuleKey; label: string }[] = [
  { key: "client", label: "Client" },
  { key: "assets", label: "Assets" },
  { key: "liabilities", label: "Liabilities" },
  { key: "guarantor", label: "Guarantor" },
  { key: "certificate", label: "Certificate" },
];

export default function SettingsPage() {
  const settingsTabs = [
    {
      key: "field_config",
      label: "Field Configuration",
      children: (
        <div>
          <Tabs
            defaultActiveKey="client"
            size="small"
            items={sectionTabs.map((s) => ({
              key: s.key,
              label: s.label,
              children: <FieldConfigSection module={s.key} />,
            }))}
          />
        </div>
      ),
    },
    {
      key: "firm_profile",
      label: "Firm Profile",
      children: (
        <div className="text-sm text-gray-400 py-8 text-center">
          Firm Profile — coming soon
        </div>
      ),
    },
    {
      key: "auditor_profile",
      label: "Auditor Profile",
      children: (
        <div className="text-sm text-gray-400 py-8 text-center">
          Auditor Profile — coming soon
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6">
      <div className="mb-6">
        <div className="text-base font-semibold text-gray-800">Settings</div>
        <div className="text-xs text-gray-400 mt-1">
          Manage field configurations, firm profile, and auditor details.
        </div>
      </div>
      <Tabs defaultActiveKey="field_config" items={settingsTabs} />
    </div>
  );
}
