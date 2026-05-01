import mongoose, { Schema, Document } from "mongoose";

export interface IImmovableProperty {
  nature: string;
  address: string;
  dateOfPurchase?: string;
  propertyCost: number;
  registrationCharges?: number;
  stampCharges?: number;
  vendor?: string;
  // Source of Fund — Loan
  loanBank?: string;
  loanReceived?: number;
  sanctionRef?: string;
  loanDate?: string;
  loanOutstanding?: number;
  // Source of Fund — Own Funds
  srcSalary?: number;
  srcSB?: number;
  srcFD?: number;
  srcOther?: number;

  ownershipType: "self" | "sharing";
  /** @deprecated mirror of propertyCost for legacy compat */
  valueAtCost?: number;
}

export interface IMovableAssetEntry {
  holder: string; // Self / Spouse / Children / "—"
  refNo?: string;
  heldWith?: string;
  dateOfInvestment?: string;
  value?: number;            // value at cost (₹ Lacs)
  soldAmount?: number;
  soldDate?: string;
  // Source of Fund — Loan
  loanBank?: string;
  loanReceived?: number;
  sanctionRef?: string;
  loanDate?: string;
  loanOutstanding?: number;
  // Source of Fund — Own Funds
  srcSalary?: number;
  srcSB?: number;
  srcFD?: number;
  srcOther?: number;

  /** @deprecated use `value` */
  valueAtCost?: number;
  /** @deprecated use `value` */
  presentValue?: number;
}

export interface ILiability {
  borrowedFrom: string;
  securities?: string;
  purpose: string;
  outstandingAmount: number;
}

export interface IGuarantor {
  guaranteedTo: string;
  borrowingsBy: string;
  purpose: string;
  amountGuaranteed: number;
}

export interface ICertificate extends Document {
  auditorId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  certNumber: string;
  asOnDate:  string;
  issueDate?: string;
  purpose?:  string;
  status: "draft" | "issued";

  // Annexure 1 - Immovable
  immovableProperties: IImmovableProperty[];

  // Annexure 2 - Other Assets
  ppf: IMovableAssetEntry[];
  pensionScheme: IMovableAssetEntry[];
  huf: IMovableAssetEntry[];
  shares: IMovableAssetEntry[];
  fixedDeposit: IMovableAssetEntry[];
  recurringDeposit: IMovableAssetEntry[];
  otherDeposit: IMovableAssetEntry[];
  insurancePolicies: IMovableAssetEntry[];
  vehicleTwoWheeler: IMovableAssetEntry[];
  vehicleFourWheeler: IMovableAssetEntry[];
  capitalProprietorship: IMovableAssetEntry[];
  capitalFirm: IMovableAssetEntry[];
  cashInHand: IMovableAssetEntry[];
  gold: IMovableAssetEntry[];
  mutualFunds: IMovableAssetEntry[];

  // C - Liabilities
  liabilities: ILiability[];

  // Guarantor
  guarantors: IGuarantor[];

  // Computed totals
  totalA: number;
  totalB: number;
  totalC: number;
  netWorth: number;

  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MovableEntrySchema = new Schema({
  holder: { type: String },
  refNo: { type: String },
  heldWith: { type: String },
  dateOfInvestment: { type: String },
  value: { type: Number, default: 0 },
  soldAmount: { type: Number, default: 0 },
  soldDate: { type: String },
  // Source of Fund — Loan
  loanBank: { type: String },
  loanReceived: { type: Number, default: 0 },
  sanctionRef: { type: String },
  loanDate: { type: String },
  loanOutstanding: { type: Number, default: 0 },
  // Source of Fund — Own Funds
  srcSalary: { type: Number, default: 0 },
  srcSB: { type: Number, default: 0 },
  srcFD: { type: Number, default: 0 },
  srcOther: { type: Number, default: 0 },
  // Legacy aliases — accepted for backward compat
  valueAtCost: { type: Number },
  presentValue: { type: Number },
}, { _id: false });

const CertificateSchema = new Schema<ICertificate>(
  {
    auditorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    certNumber: { type: String },
    asOnDate:  { type: String, required: true },
    issueDate: { type: String },
    purpose:   { type: String },
    status: { type: String, enum: ["draft", "issued"], default: "draft" },

    immovableProperties: [
      {
        nature: { type: String },
        address: { type: String },
        dateOfPurchase: { type: String },
        propertyCost: { type: Number, default: 0 },
        registrationCharges: { type: Number, default: 0 },
        stampCharges: { type: Number, default: 0 },
        vendor: { type: String },
        // Source of Fund — Loan
        loanBank: { type: String },
        loanReceived: { type: Number, default: 0 },
        sanctionRef: { type: String },
        loanDate: { type: String },
        loanOutstanding: { type: Number, default: 0 },
        // Source of Fund — Own Funds
        srcSalary: { type: Number, default: 0 },
        srcSB: { type: Number, default: 0 },
        srcFD: { type: Number, default: 0 },
        srcOther: { type: Number, default: 0 },
        ownershipType: { type: String, enum: ["self", "sharing"], default: "self" },
        // Legacy mirror
        valueAtCost: { type: Number },
      },
    ],

    ppf:                   [MovableEntrySchema],
    pensionScheme:         [MovableEntrySchema],
    huf:                   [MovableEntrySchema],
    shares:                [MovableEntrySchema],
    fixedDeposit:          [MovableEntrySchema],
    recurringDeposit:      [MovableEntrySchema],
    otherDeposit:          [MovableEntrySchema],
    insurancePolicies:     [MovableEntrySchema],
    vehicleTwoWheeler:     [MovableEntrySchema],
    vehicleFourWheeler:    [MovableEntrySchema],
    capitalProprietorship: [MovableEntrySchema],
    capitalFirm:           [MovableEntrySchema],
    cashInHand:            [MovableEntrySchema],
    gold:                  [MovableEntrySchema],
    mutualFunds:           [MovableEntrySchema],

    liabilities: [
      {
        borrowedFrom: { type: String },
        securities: { type: String },
        purpose: { type: String },
        outstandingAmount: { type: Number, default: 0 },
      },
    ],

    guarantors: [
      {
        guaranteedTo: { type: String },
        borrowingsBy: { type: String },
        purpose: { type: String },
        amountGuaranteed: { type: Number, default: 0 },
      },
    ],

    totalA: { type: Number, default: 0 },
    totalB: { type: Number, default: 0 },
    totalC: { type: Number, default: 0 },
    netWorth: { type: Number, default: 0 },
    issuedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Certificate ||
  mongoose.model<ICertificate>("Certificate", CertificateSchema);
