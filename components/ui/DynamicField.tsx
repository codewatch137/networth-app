"use client";

import { Form, Input, InputNumber, DatePicker, Select, Checkbox, Upload, message as antMsg } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { Rule } from "antd/es/form";
import { FieldConfig } from "@/lib/fieldConfigContext";

function PhotoUploadInput({ value, onChange }: { value?: string; onChange?: (val: string | undefined) => void }) {
  const handleBeforeUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      antMsg.error("Image must be under 2 MB");
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange?.(e.target?.result as string);
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <div className="flex items-center gap-3">
      <Upload
        accept="image/*"
        showUploadList={false}
        beforeUpload={handleBeforeUpload}
      >
        {value ? (
          <div style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
            <img
              src={value}
              alt="photo"
              style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
            />
            <span
              style={{
                position: "absolute", top: -6, right: -6,
                background: "#ef4444", color: "white", borderRadius: "50%",
                width: 18, height: 18, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, cursor: "pointer",
              }}
              onClick={(e) => { e.stopPropagation(); onChange?.(undefined); }}
            >
              ×
            </span>
          </div>
        ) : (
          <div style={{
            width: 80, height: 80, border: "1px dashed #d1d5db", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4, cursor: "pointer", background: "#f9fafb",
          }}>
            <PlusOutlined style={{ fontSize: 16, color: "#9ca3af" }} />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Upload</span>
          </div>
        )}
      </Upload>
      {value && (
        <span
          style={{ fontSize: 12, color: "#ef4444", cursor: "pointer" }}
          onClick={() => onChange?.(undefined)}
        >
          Remove
        </span>
      )}
    </div>
  );
}

interface DynamicFieldProps {
  field: FieldConfig;
}

export default function DynamicField({ field }: DynamicFieldProps) {
  if (!field.visible) return null;

  const v   = field.validation ?? {};
  const ph  = field.placeholder;

  const rules: Rule[] = [];

  if (field.mandatory) {
    rules.push({ required: true, message: `${field.label} is required` });
  }

  if (field.type === "text") {
    if (v.minLength != null) {
      rules.push({ min: v.minLength, message: `Minimum ${v.minLength} characters` });
    }
    if (v.maxLength != null) {
      rules.push({ max: v.maxLength, message: `Maximum ${v.maxLength} characters` });
    }
    if (v.pattern) {
      rules.push({
        pattern: new RegExp(v.pattern),
        message: v.patternMessage || "Invalid format",
      });
    }
  }

  if (field.type === "number") {
    if (v.min != null) {
      rules.push({ type: "number", min: v.min, message: `Minimum value is ${v.min}` });
    }
    if (v.max != null) {
      rules.push({ type: "number", max: v.max, message: `Maximum value is ${v.max}` });
    }
  }

  const renderInput = () => {
    switch (field.type) {
      case "text":
        return <Input placeholder={ph || `Enter ${field.label}`} />;

      case "number":
        return (
          <InputNumber
            style={{ width: "100%" }}
            placeholder={ph || `Enter ${field.label}`}
            min={v.min}
            max={v.max}
          />
        );

      case "date":
        return (
          <DatePicker
            className="w-full"
            placeholder={ph || `Select ${field.label}`}
            format="DD/MM/YYYY"
          />
        );

      case "dropdown":
        return (
          <Select
            placeholder={ph || `Select ${field.label}`}
            options={(field.dropdownOptions ?? []).map((opt) => ({ label: opt, value: opt }))}
          />
        );

      case "checkbox":
        return <Checkbox>{field.label}</Checkbox>;

      case "photo":
        return <PhotoUploadInput />;

      default:
        return <Input placeholder={`Enter ${field.label}`} />;
    }
  };

  return (
    <Form.Item
      name={field.key}
      label={
        field.type !== "checkbox" ? (
          <span className="text-sm font-medium text-gray-700">
            {field.label}
            {field.mandatory && <span className="text-red-400 ml-0.5">*</span>}
          </span>
        ) : undefined
      }
      rules={rules}
      valuePropName={field.type === "checkbox" ? "checked" : "value"}
    >
      {renderInput()}
    </Form.Item>
  );
}
