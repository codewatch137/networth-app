import mongoose, { Schema, Document } from "mongoose";

export interface IIdProof {
  idType: string;
  idNumber: string;
  documentUrl?: string;
}

export interface IClient extends Document {
  auditorId: mongoose.Types.ObjectId;
  clientRef: string;
  full_name: string;
  pan: string;
  dob?: string;
  aadhaar?: string;
  father_name?: string;
  gender?: string;
  marital_status?: string;
  mobile: string;
  email?: string;
  permanent_address?: string;
  office_address?: string;
  occupation?: string;
  annual_income?: number;
  profile_photo?: string;
  idProofs: IIdProof[];
  customFields: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    auditorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientRef: { type: String },
    full_name: { type: String, required: true },
    pan: { type: String },
    dob: { type: String },
    aadhaar: { type: String },
    father_name: { type: String },
    gender: { type: String },
    marital_status: { type: String },
    mobile: { type: String },
    email: { type: String },
    permanent_address: { type: String },
    office_address: { type: String },
    occupation: { type: String },
    annual_income: { type: Number },
    profile_photo: { type: String },
    idProofs: [
      {
        idType: { type: String },
        idNumber: { type: String },
        documentUrl: { type: String },
      },
    ],
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
