import mongoose, { Schema, Document } from "mongoose";

export interface IFieldConfig extends Document {
  auditorId: mongoose.Types.ObjectId;
  module: "client" | "assets" | "liabilities" | "guarantor" | "certificate";
  fields: {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "dropdown" | "checkbox";
    mandatory: boolean;
    visible: boolean;
    isSystem: boolean;
    dropdownOptions?: string[];
    order: number;
  }[];
  updatedAt: Date;
}

const FieldConfigSchema = new Schema<IFieldConfig>(
  {
    auditorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    module: {
      type: String,
      enum: ["client", "assets", "liabilities", "guarantor", "certificate"],
      required: true,
    },
    fields: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, enum: ["text", "number", "date", "dropdown", "checkbox"], required: true },
        mandatory: { type: Boolean, default: false },
        visible: { type: Boolean, default: true },
        isSystem: { type: Boolean, default: false },
        dropdownOptions: [{ type: String }],
        order: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

FieldConfigSchema.index({ auditorId: 1, module: 1 }, { unique: true });

export default mongoose.models.FieldConfig || mongoose.model<IFieldConfig>("FieldConfig", FieldConfigSchema);
