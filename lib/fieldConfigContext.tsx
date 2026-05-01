"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FieldType = "text" | "number" | "date" | "dropdown" | "checkbox" | "photo";

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  min?: number;
  max?: number;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  mandatory: boolean;
  visible: boolean;
  isSystem: boolean;
  placeholder?: string;
  dropdownOptions?: string[];
  validation?: FieldValidation;
}

export type ModuleKey = "client" | "assets" | "liabilities" | "guarantor" | "certificate";

type FieldConfigMap = Record<ModuleKey, FieldConfig[]>;

const defaultConfigs: FieldConfigMap = {
  client: [
    { key: "full_name", label: "Full Name", type: "text", mandatory: true, visible: true, isSystem: true },
    { key: "pan", label: "PAN", type: "text", mandatory: true, visible: true, isSystem: true },
    { key: "dob", label: "Date of Birth", type: "date", mandatory: true, visible: true, isSystem: true },
    { key: "aadhaar", label: "Aadhaar Number", type: "text", mandatory: true, visible: true, isSystem: true },
    { key: "father_name", label: "Father's Name", type: "text", mandatory: true, visible: true, isSystem: true },
    { key: "gender", label: "Gender", type: "dropdown", mandatory: true, visible: true, isSystem: true, dropdownOptions: ["Male", "Female", "Other"] },
    { key: "marital_status", label: "Marital Status", type: "dropdown", mandatory: true, visible: true, isSystem: true, dropdownOptions: ["Single", "Married", "Divorced", "Widowed"] },
    { key: "mobile", label: "Mobile Number", type: "text", mandatory: true, visible: true, isSystem: true },
    { key: "email", label: "Email ID", type: "text", mandatory: false, visible: true, isSystem: true },
    { key: "permanent_address", label: "Permanent Address", type: "text", mandatory: true, visible: true, isSystem: true },
    { key: "office_address", label: "Office Address", type: "text", mandatory: false, visible: true, isSystem: true },
    { key: "occupation", label: "Occupation", type: "dropdown", mandatory: true, visible: true, isSystem: true, dropdownOptions: ["Salaried", "Business", "Professional", "Other"] },
    { key: "annual_income", label: "Annual Income (₹ Lacs)", type: "number", mandatory: false, visible: true, isSystem: true },
    { key: "profile_photo", label: "Profile Photo", type: "photo", mandatory: false, visible: true, isSystem: true },
  ],
  assets: [],
  liabilities: [],
  guarantor: [],
  certificate: [],
};

interface FieldConfigContextType {
  configs: FieldConfigMap;
  setModuleConfig: (module: ModuleKey, fields: FieldConfig[]) => void;
  saveConfigs: (current: FieldConfigMap) => void;
}

const FieldConfigContext = createContext<FieldConfigContextType | null>(null);

/**
 * Merge a saved snapshot of field configs with the latest `defaultConfigs`.
 *
 * Why this is needed: if the user saved their preferences before we added a
 * new system field (e.g. `profile_photo`) — or before we changed an existing
 * field's `isSystem`/`type`/`label` — the stored version would otherwise
 * "stick" forever and the field would show up as Custom in Settings.
 *
 * Rules:
 *  - System fields are recognised by their `key`. Their `isSystem`, `type`,
 *    and default `label` always come from `defaultConfigs` (source of truth).
 *  - User overrides for `mandatory`, `visible`, `placeholder`, `dropdownOptions`,
 *    and `validation` are preserved.
 *  - Non-system (custom) fields the user added are kept as-is.
 *  - Any system field the user reordered keeps its position; new system
 *    fields introduced in code are appended at the end.
 */
function mergeModule(
  stored: FieldConfig[] | undefined,
  defaults: FieldConfig[],
): FieldConfig[] {
  const safeStored = Array.isArray(stored) ? stored : [];
  const defaultsByKey = new Map(defaults.map((f) => [f.key, f]));
  const merged: FieldConfig[] = [];
  const seen = new Set<string>();

  for (const s of safeStored) {
    if (!s || typeof s !== "object" || !s.key) continue;
    const def = defaultsByKey.get(s.key);
    if (def) {
      // System field — trust source-of-truth metadata, keep user overrides.
      merged.push({
        ...def,
        mandatory: s.mandatory ?? def.mandatory,
        visible: s.visible ?? def.visible,
        placeholder: s.placeholder ?? def.placeholder,
        dropdownOptions: s.dropdownOptions ?? def.dropdownOptions,
        validation: s.validation ?? def.validation,
      });
    } else {
      // User-defined custom field — keep as-is, but force isSystem=false.
      merged.push({ ...s, isSystem: false });
    }
    seen.add(s.key);
  }

  // Append any system fields introduced in code that the saved snapshot didn't have yet.
  for (const def of defaults) {
    if (!seen.has(def.key)) merged.push(def);
  }
  return merged;
}

export function FieldConfigProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<FieldConfigMap>(defaultConfigs);

  // Load from localStorage only after mount to avoid SSR/client mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fieldConfigs");
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<FieldConfigMap>;
      setConfigs((prev) => {
        const next: FieldConfigMap = { ...prev };
        (Object.keys(prev) as ModuleKey[]).forEach((mod) => {
          next[mod] = mergeModule(parsed[mod], defaultConfigs[mod]);
        });
        return next;
      });
    } catch {}
  }, []);

  const setModuleConfig = (module: ModuleKey, fields: FieldConfig[]) => {
    setConfigs((prev) => ({ ...prev, [module]: fields }));
  };

  const saveConfigs = (current: FieldConfigMap) => {
    localStorage.setItem("fieldConfigs", JSON.stringify(current));
  };

  return (
    <FieldConfigContext.Provider value={{ configs, setModuleConfig, saveConfigs }}>
      {children}
    </FieldConfigContext.Provider>
  );
}

export function useFieldConfig() {
  const ctx = useContext(FieldConfigContext);
  if (!ctx) throw new Error("useFieldConfig must be used within FieldConfigProvider");
  return ctx;
}
