"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DatePicker, message, Spin } from "antd";
import dayjs from "dayjs";
import { formatINRCompact, formatINRGroup } from "@/lib/formatINR";

/* ── Types ─────────────────────────────────────────────────── */
interface Client {
  _id: string; full_name: string; pan: string;
  dob?: string; permanent_address?: string; office_address?: string; mobile?: string;
}

interface ImmovableRow {
  key: string; ownershipType: "self" | "sharing"; nature: string; address: string;
  dateOfPurchase?: string; propertyCost: number; registrationCharges: number; stampCharges: number;
  vendor: string;
  // Source of Fund — Loan
  loanBank: string; loanReceived: number; sanctionRef: string; loanDate?: string; loanOutstanding: number;
  // Source of Fund — Own Funds
  srcSalary: number; srcSB: number; srcFD: number; srcOther: number;
}

interface MovableRow {
  key: string; holder: string;
  refNo: string; heldWith: string; dateOfInvestment?: string;
  value: number; soldAmount: number; soldDate?: string;
  // Source of Fund — Loan
  loanBank: string; loanReceived: number; sanctionRef: string; loanDate?: string; loanOutstanding: number;
  // Source of Fund — Own Funds
  srcSalary: number; srcSB: number; srcFD: number; srcOther: number;
}
interface LiabilityRow { key: string; borrowedFrom: string; securities: string; purpose: string; outstandingAmount: number; }
interface GuarantorRow { key: string; guaranteedTo: string; borrowingsBy: string; purpose: string; amountGuaranteed: number; }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sumRows = (rows: any[], field: string) =>
  rows.reduce((s: number, r: any) => s + (Number(r[field]) || 0), 0);

const blankImmovable = (type: "self" | "sharing"): ImmovableRow => ({
  key: uid(), ownershipType: type, nature: "", address: "", dateOfPurchase: "",
  propertyCost: 0, registrationCharges: 0, stampCharges: 0, vendor: "",
  loanBank: "", loanReceived: 0, sanctionRef: "", loanDate: "", loanOutstanding: 0,
  srcSalary: 0, srcSB: 0, srcFD: 0, srcOther: 0,
});

const blankMovable = (holder = "Self"): MovableRow => ({
  key: uid(), holder,
  refNo: "", heldWith: "", dateOfInvestment: "",
  value: 0, soldAmount: 0, soldDate: "",
  loanBank: "", loanReceived: 0, sanctionRef: "", loanDate: "", loanOutstanding: 0,
  srcSalary: 0, srcSB: 0, srcFD: 0, srcOther: 0,
});
const blankLiability = (): LiabilityRow => ({ key: uid(), borrowedFrom: "", securities: "", purpose: "", outstandingAmount: 0 });
const blankGuarantor = (): GuarantorRow => ({ key: uid(), guaranteedTo: "", borrowingsBy: "", purpose: "", amountGuaranteed: 0 });

const STEPS = ["Purpose", "(A) Immovable", "(B) Other Assets", "(C) Liabilities", "Guarantees", "Review"];

interface OtherAssetCat { id: string; label: string; holders: string[]; itemPrefix?: string; }
const OTHER_ASSET_CATS: OtherAssetCat[] = [
  { id: "ppf",                   label: "PPF",                                 holders: ["Self", "Spouse", "Children"] },
  { id: "pension",               label: "Pension Scheme",                      holders: ["Self", "Spouse", "Children"] },
  { id: "huf",                   label: "Investment in HUF",                   holders: ["—"] },
  { id: "shares",                label: "Shares",                              holders: ["—"], itemPrefix: "Company" },
  { id: "fd",                    label: "Fixed Deposit",                       holders: ["Self", "Spouse", "Children"] },
  { id: "rd",                    label: "Recurring Deposit",                   holders: ["Self", "Spouse", "Children"] },
  { id: "otherDeposit",          label: "Other Deposit",                       holders: ["Self", "Spouse", "Children"] },
  { id: "insurance",             label: "Insurance Policies",                  holders: ["Self", "Spouse", "Children"], itemPrefix: "Policy" },
  { id: "vehicleTwo",            label: "Vehicles — Two Wheeler",              holders: ["—"] },
  { id: "vehicleFour",           label: "Vehicles — Four Wheeler",             holders: ["—"] },
  { id: "capitalProprietorship", label: "Capital Investment in Proprietorship", holders: ["—"] },
  { id: "capitalFirm",           label: "Investment in Firm / Companies",      holders: ["—"] },
  { id: "cash",                  label: "Cash in Hand",                        holders: ["—"] },
  { id: "gold",                  label: "Gold & Jewellery",                    holders: ["Self", "Spouse", "Children"] },
  { id: "mf",                    label: "Mutual Funds",                        holders: ["Self", "Spouse", "Children"] },
];

type OtherAssetData = Record<string, Record<string, MovableRow[]>>;
const buildEmptyOtherAssets = (): OtherAssetData =>
  Object.fromEntries(OTHER_ASSET_CATS.map((c) => [
    c.id, Object.fromEntries(c.holders.map((h) => [h, []])),
  ]));

const PURPOSE_OPTIONS = [
  "Visa application — Schengen", "Visa application — USA", "Visa application — UK",
  "Bank loan — Home loan", "Bank loan — Vehicle loan", "Government tender",
  "Court submission", "Immigration — PR application", "Other",
];

/* ── Donut SVG ──────────────────────────────────────────────── */
function Donut({ groups }: { groups: { label: string; value: number; color: string }[] }) {
  const size = 100, r = 36, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const total = groups.reduce((s, g) => s + g.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth="14"/>
        {groups.map((g, i) => {
          const len = (g.value / total) * circ;
          const dash = `${len} ${circ - len}`;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={g.color} strokeWidth="14"
              strokeDasharray={dash} strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.4s ease" }}/>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ flex: 1 }}>
        {groups.map((g) => (
          <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, paddingBottom: 5, borderBottom: "1px dotted var(--border)", marginBottom: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color, flexShrink: 0 }}/>
            <span style={{ flex: 1, color: "var(--text-2)" }}>{g.label}</span>
            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {total > 1 ? Math.round((g.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Summary Panel ──────────────────────────────────────────── */
function SummaryPanel({ totalSelf, totalSharing, totalOther, totalC, totalGuaranteed }: {
  totalSelf: number; totalSharing: number; totalOther: number; totalC: number; totalGuaranteed: number;
}) {
  const totalA = totalSelf + totalSharing;
  const totalAssets = totalA + totalOther;
  const netWorth = totalAssets - totalC;

  const groups = [
    { label: "Immovable (Self)", value: totalSelf,    color: "var(--brand)" },
    { label: "Immovable (Sharing)", value: totalSharing, color: "#a78bfa" },
    { label: "Other Assets",     value: totalOther,   color: "#8b5cf6" },
  ];

  return (
    <div className="card summary-card">
      <div className="card-header"><h3>Live computation</h3></div>
      <div className="card-body">
        <div className="summary-row total">
          <span>Net Worth (D)</span>
          <span className="num" style={{ color: "var(--brand)" }}>{formatINRCompact(netWorth)}</span>
        </div>
        <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="muted text-xs" style={{ marginBottom: 10, lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
            {formatINRGroup(netWorth)}
          </div>
          <Donut groups={groups} />
        </div>
        <div className="summary-row">
          <span>(A) Immovable Property</span>
          <b className="num">{formatINRCompact(totalA)}</b>
        </div>
        <div className="summary-row indent">
          <span>By Self</span>
          <span className="num">{formatINRCompact(totalSelf)}</span>
        </div>
        <div className="summary-row indent">
          <span>By Sharing</span>
          <span className="num">{formatINRCompact(totalSharing)}</span>
        </div>
        <div className="summary-row">
          <span>(B) Other Assets</span>
          <b className="num">{formatINRCompact(totalOther)}</b>
        </div>
        <div className="summary-row">
          <span style={{ fontWeight: 500 }}>Total Assets (A+B)</span>
          <b className="num">{formatINRCompact(totalAssets)}</b>
        </div>
        <div className="summary-row">
          <span>(C) Liabilities</span>
          <b className="num" style={{ color: "var(--danger)" }}>−{formatINRCompact(totalC)}</b>
        </div>
        {totalGuaranteed > 0 && (
          <div className="summary-row">
            <span className="muted">Guarantees (memo)</span>
            <span className="num muted">{formatINRCompact(totalGuaranteed)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Steps bar ──────────────────────────────────────────────── */
function StepsBar({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <button
            className={`step ${i === current ? "active" : i < current ? "done" : ""}`}
            onClick={() => onJump(i)}
            style={{ background: "none", border: "none" }}
          >
            <span className="step-num">
              {i < current
                ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : i + 1}
            </span>
            <span>{label}</span>
          </button>
          {i < STEPS.length - 1 && <div className="step-divider" style={{ flex: 1 }}/>}
        </div>
      ))}
    </div>
  );
}

/* ── Form footer ────────────────────────────────────────────── */
function FormFooter({ onBack, onNext, nextLabel = "Continue →", saving = false }: {
  onBack?: () => void; onNext?: () => void; nextLabel?: string; saving?: boolean;
}) {
  return (
    <div className="form-footer">
      {onBack
        ? <button className="btn" onClick={onBack}>← Back</button>
        : <span/>}
      {onNext && (
        <button className="btn btn-brand" onClick={onNext} disabled={saving}>
          {saving ? "Saving…" : nextLabel}
        </button>
      )}
    </div>
  );
}

/* ── Collapsible property row ───────────────────────────────── */
function ImmovableRowEditor({
  row, idx, onUpdate, onRemove,
}: {
  row: ImmovableRow; idx: number;
  onUpdate: (r: ImmovableRow) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (k: keyof ImmovableRow, v: unknown) => onUpdate({ ...row, [k]: v });
  const sourceTotal = (row.loanReceived || 0) + (row.srcSalary || 0) + (row.srcSB || 0) + (row.srcFD || 0) + (row.srcOther || 0);

  return (
    <div className="detail-row">
      <div className="detail-row-head" onClick={() => setOpen((o) => !o)}>
        <div className="detail-row-num">{idx + 1}</div>
        <div className="detail-row-summary">
          <div className="detail-row-title">{row.nature || row.address || `Property ${idx + 1}`}</div>
          <div className="detail-row-meta">{row.address || row.dateOfPurchase || ""}</div>
        </div>
        <div className="detail-row-cost">
          <span className="muted text-xs">Cost</span>
          <b>{formatINRCompact(Number(row.propertyCost) || 0)}</b>
        </div>
        <button className="btn btn-icon btn-ghost"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-3)", flexShrink: 0 }}>
          {open
            ? <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
      </div>

      {open && (
        <div className="detail-row-body">
          {/* Particulars */}
          <div className="detail-block">
            <div className="detail-block-title">Particulars</div>
            <div className="detail-grid">
              <div className="field field-full">
                <label className="label">Nature of Property</label>
                <input className="input" value={row.nature} placeholder="e.g. Residential Flat / Land / Shop"
                  onChange={(e) => set("nature", e.target.value)}/>
              </div>
              <div className="field field-full">
                <label className="label">Location with Complete Address</label>
                <input className="input" value={row.address} placeholder="Door no., street, city, state, PIN"
                  onChange={(e) => set("address", e.target.value)}/>
              </div>
              <div className="field">
                <label className="label">Date of Purchase</label>
                <DatePicker size="small" format="DD/MM/YYYY" style={{ width: "100%" }}
                  value={row.dateOfPurchase && dayjs(row.dateOfPurchase).isValid() ? dayjs(row.dateOfPurchase) : null}
                  onChange={(d) => set("dateOfPurchase", d?.toISOString())}/>
              </div>
              <div className="field">
                <label className="label">Property Cost excl. Reg. &amp; Stamp (₹)</label>
                <input className="input" type="number" step="0.01" value={row.propertyCost || ""}
                  onChange={(e) => set("propertyCost", Number(e.target.value))} style={{ textAlign: "right" }}/>
              </div>
              <div className="field">
                <label className="label">Registration Charges (₹)</label>
                <input className="input" type="number" step="0.01" value={row.registrationCharges || ""}
                  onChange={(e) => set("registrationCharges", Number(e.target.value))} style={{ textAlign: "right" }}/>
              </div>
              <div className="field">
                <label className="label">Stamp Charges (₹)</label>
                <input className="input" type="number" step="0.01" value={row.stampCharges || ""}
                  onChange={(e) => set("stampCharges", Number(e.target.value))} style={{ textAlign: "right" }}/>
              </div>
              <div className="field field-full">
                <label className="label">Vendor / Seller Name, Address &amp; PAN</label>
                <input className="input" value={row.vendor} placeholder="e.g. M/s ABC Builders, Pune (PAN: AAACS1234B)"
                  onChange={(e) => set("vendor", e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Source of Fund */}
          <div className="detail-block detail-block-source">
            <div className="detail-block-title">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5h12" stroke="currentColor" strokeWidth="1.2"/></svg>
              Source of Fund
              <span className="source-total">Total {formatINRCompact(sourceTotal)}</span>
            </div>
            <div className="source-grid">
              <div className="source-col">
                <div className="source-col-head">Loan</div>
                <div className="field">
                  <label className="label">Loan Bank</label>
                  <input className="input" value={row.loanBank} placeholder="e.g. HDFC Bank"
                    onChange={(e) => set("loanBank", e.target.value)}/>
                </div>
                <div className="field">
                  <label className="label">Loan Amt. Received (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.loanReceived || ""} onChange={(e) => set("loanReceived", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Sanction Letter Ref. No.</label>
                  <input className="input" value={row.sanctionRef} placeholder="e.g. HDFC/PN/4521"
                    onChange={(e) => set("sanctionRef", e.target.value)}/>
                </div>
                <div className="field">
                  <label className="label">Date of Loan Received</label>
                  <DatePicker size="small" format="DD/MM/YYYY" style={{ width: "100%" }}
                    value={row.loanDate && dayjs(row.loanDate).isValid() ? dayjs(row.loanDate) : null}
                    onChange={(d) => set("loanDate", d?.toISOString())}/>
                </div>
                <div className="field">
                  <label className="label">Outstanding Loan as on date (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.loanOutstanding || ""} onChange={(e) => set("loanOutstanding", Number(e.target.value))}/>
                </div>
              </div>
              <div className="source-col">
                <div className="source-col-head">Own Funds</div>
                <div className="field">
                  <label className="label">Salary (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcSalary || ""} onChange={(e) => set("srcSalary", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Withdrawal from SB A/c (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcSB || ""} onChange={(e) => set("srcSB", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Withdrawal from FD A/c (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcFD || ""} onChange={(e) => set("srcFD", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Other Source (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcOther || ""} onChange={(e) => set("srcOther", Number(e.target.value))}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Bucket (By Self / By Sharing) ─────────────────────────── */
function BucketBlock({
  title, subtitle, items, onUpdate, onRemove, onAdd,
}: {
  title: string; subtitle: string; items: ImmovableRow[];
  onUpdate: (i: number, r: ImmovableRow) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  const total = items.reduce((s, r) => s + (Number(r.propertyCost) || 0) + (Number(r.registrationCharges) || 0) + (Number(r.stampCharges) || 0), 0);
  return (
    <div className="bucket">
      <div className="bucket-head">
        <div>
          <h5>{title} <span className="muted text-sm" style={{ fontWeight: 400 }}>· {items.length} {items.length === 1 ? "property" : "properties"}</span></h5>
          <p className="muted text-xs" style={{ margin: "2px 0 0" }}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-12">
          <div className="text-sm muted">Sub-total: <b style={{ color: "var(--text)" }}>{formatINRCompact(total)}</b></div>
          <button className="btn btn-sm" onClick={onAdd}>+ Add property</button>
        </div>
      </div>
      <div className="detail-list">
        {items.length === 0 && <div className="empty-row">No properties added yet.</div>}
        {items.map((row, i) => (
          <ImmovableRowEditor key={row.key} row={row} idx={i}
            onUpdate={(r) => onUpdate(i, r)} onRemove={() => onRemove(i)}/>
        ))}
      </div>
    </div>
  );
}

/* ── Other asset row (simple) ───────────────────────────────── */
function MovableRowEditor({ row, idx, onUpdate, onRemove }: {
  row: MovableRow; idx: number;
  onUpdate: (r: MovableRow) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (k: keyof MovableRow, v: unknown) => onUpdate({ ...row, [k]: v });
  const sourceTotal = (row.loanReceived || 0) + (row.srcSalary || 0) + (row.srcSB || 0) + (row.srcFD || 0) + (row.srcOther || 0);

  return (
    <div className="detail-row">
      <div className="detail-row-head" onClick={() => setOpen((o) => !o)}>
        <div className="detail-row-num">{idx + 1}</div>
        <div className="detail-row-summary">
          <div className="detail-row-title">{row.heldWith || row.refNo || `Item ${idx + 1}`}</div>
          <div className="detail-row-meta">{row.dateOfInvestment ? dayjs(row.dateOfInvestment).format("DD MMM YYYY") : ""}</div>
        </div>
        <div className="detail-row-cost">
          <span className="muted text-xs">Value</span>
          <b>{formatINRCompact(Number(row.value) || 0)}</b>
        </div>
        <button className="btn btn-icon btn-ghost"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-3)", flexShrink: 0 }}>
          {open
            ? <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
      </div>

      {open && (
        <div className="detail-row-body">
          {/* Particulars */}
          <div className="detail-block">
            <div className="detail-block-title">Particulars</div>
            <div className="detail-grid">
              <div className="field">
                <label className="label">Reference No.</label>
                <input className="input" value={row.refNo} placeholder="e.g. PPF-PN-21458"
                  onChange={(e) => set("refNo", e.target.value)}/>
              </div>
              <div className="field">
                <label className="label">Held With</label>
                <input className="input" value={row.heldWith} placeholder="e.g. SBI / HDFC / LIC"
                  onChange={(e) => set("heldWith", e.target.value)}/>
              </div>
              <div className="field">
                <label className="label">Date of Investment</label>
                <DatePicker size="small" format="DD/MM/YYYY" style={{ width: "100%" }}
                  value={row.dateOfInvestment && dayjs(row.dateOfInvestment).isValid() ? dayjs(row.dateOfInvestment) : null}
                  onChange={(d) => set("dateOfInvestment", d?.toISOString())}/>
              </div>
              <div className="field">
                <label className="label">Value at Cost (₹)</label>
                <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                  value={row.value || ""} onChange={(e) => set("value", Number(e.target.value))}/>
              </div>
              <div className="field">
                <label className="label">Sold / Withdrawn Amount (₹)</label>
                <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                  value={row.soldAmount || ""} onChange={(e) => set("soldAmount", Number(e.target.value))}/>
              </div>
              <div className="field">
                <label className="label">Date of Sold / Withdrawn</label>
                <DatePicker size="small" format="DD/MM/YYYY" style={{ width: "100%" }}
                  value={row.soldDate && dayjs(row.soldDate).isValid() ? dayjs(row.soldDate) : null}
                  onChange={(d) => set("soldDate", d?.toISOString())}/>
              </div>
            </div>
          </div>

          {/* Source of Fund */}
          <div className="detail-block detail-block-source">
            <div className="detail-block-title">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5h12" stroke="currentColor" strokeWidth="1.2"/></svg>
              Source of Fund
              <span className="source-total">Total {formatINRCompact(sourceTotal)}</span>
            </div>
            <div className="source-grid">
              <div className="source-col">
                <div className="source-col-head">Loan</div>
                <div className="field">
                  <label className="label">Loan Bank</label>
                  <input className="input" value={row.loanBank} placeholder="e.g. HDFC Bank"
                    onChange={(e) => set("loanBank", e.target.value)}/>
                </div>
                <div className="field">
                  <label className="label">Loan Amt. Received (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.loanReceived || ""} onChange={(e) => set("loanReceived", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Sanction Letter Ref. No.</label>
                  <input className="input" value={row.sanctionRef} placeholder="e.g. HDFC/PN/4521"
                    onChange={(e) => set("sanctionRef", e.target.value)}/>
                </div>
                <div className="field">
                  <label className="label">Date of Loan Received</label>
                  <DatePicker size="small" format="DD/MM/YYYY" style={{ width: "100%" }}
                    value={row.loanDate && dayjs(row.loanDate).isValid() ? dayjs(row.loanDate) : null}
                    onChange={(d) => set("loanDate", d?.toISOString())}/>
                </div>
                <div className="field">
                  <label className="label">Outstanding Loan as on date (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.loanOutstanding || ""} onChange={(e) => set("loanOutstanding", Number(e.target.value))}/>
                </div>
              </div>
              <div className="source-col">
                <div className="source-col-head">Own Funds</div>
                <div className="field">
                  <label className="label">Salary (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcSalary || ""} onChange={(e) => set("srcSalary", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Withdrawal from SB A/c (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcSB || ""} onChange={(e) => set("srcSB", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Withdrawal from FD A/c (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcFD || ""} onChange={(e) => set("srcFD", Number(e.target.value))}/>
                </div>
                <div className="field">
                  <label className="label">Other Source (₹)</label>
                  <input className="input" type="number" step="0.01" style={{ textAlign: "right" }}
                    value={row.srcOther || ""} onChange={(e) => set("srcOther", Number(e.target.value))}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Other asset category block (collapsible w/ holders) ───── */
function CategoryBlock({ category, data, onAdd, onUpdate, onRemove }: {
  category: OtherAssetCat;
  data: Record<string, MovableRow[]>;
  onAdd: (holder: string) => void;
  onUpdate: (holder: string, i: number, r: MovableRow) => void;
  onRemove: (holder: string, i: number) => void;
}) {
  const total = category.holders.reduce((s, h) => s + sumRows(data[h] || [], "value"), 0);
  const totalCount = category.holders.reduce((s, h) => s + (data[h] || []).length, 0);
  const [open, setOpen] = useState(total > 0);
  return (
    <div className="category-block">
      <div className="category-head" onClick={() => setOpen((o) => !o)}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-3)" }}>
          {open
            ? <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
        <h5>{category.label}</h5>
        <span className="muted text-xs">{totalCount} item(s)</span>
        <span className="category-total">{formatINRCompact(total)}</span>
      </div>
      {open && (
        <div className="category-body">
          {category.holders.map((holder) => {
            const rows = data[holder] || [];
            const holderTotal = sumRows(rows, "value");
            return (
              <div key={holder} className="holder-block">
                {category.holders.length > 1 && (
                  <div className="holder-head">
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 12c.5-2.2 2.4-3.5 4.5-3.5s4 1.3 4.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {holder}
                    </span>
                    <span className="muted text-xs">{rows.length} item(s) · {formatINRCompact(holderTotal)}</span>
                  </div>
                )}
                <div className="detail-list">
                  {rows.map((r, i) => (
                    <MovableRowEditor key={r.key} row={r} idx={i}
                      onUpdate={(nr) => onUpdate(holder, i, nr)}
                      onRemove={() => onRemove(holder, i)}/>
                  ))}
                </div>
                <div style={{ padding: "8px 16px" }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => onAdd(holder)}>
                    + Add {category.itemPrefix || "item"}{category.holders.length > 1 ? ` (${holder})` : ""}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Liab row ───────────────────────────────────────────────── */
function LiabRow({ row, onUpdate, onRemove }: {
  row: LiabilityRow;
  onUpdate: (r: LiabilityRow) => void;
  onRemove: () => void;
}) {
  const set = (k: keyof LiabilityRow, v: unknown) => onUpdate({ ...row, [k]: v });
  return (
    <div className="liab-row">
      <div><input className="input" value={row.borrowedFrom} placeholder="e.g. HDFC Bank" onChange={(e) => set("borrowedFrom", e.target.value)}/></div>
      <div><input className="input" value={row.securities} placeholder="e.g. Mortgage of flat…" onChange={(e) => set("securities", e.target.value)}/></div>
      <div><input className="input" value={row.purpose} placeholder="e.g. Home Loan" onChange={(e) => set("purpose", e.target.value)}/></div>
      <div className="num"><input className="input" type="number" step="0.01" style={{ textAlign: "right" }} value={row.outstandingAmount || ""} onChange={(e) => set("outstandingAmount", Number(e.target.value))}/></div>
      <button className="btn btn-icon btn-ghost" onClick={onRemove} style={{ width: 28, height: 28 }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

function GuarantorRowComp({ row, onUpdate, onRemove }: {
  row: GuarantorRow;
  onUpdate: (r: GuarantorRow) => void;
  onRemove: () => void;
}) {
  const set = (k: keyof GuarantorRow, v: unknown) => onUpdate({ ...row, [k]: v });
  return (
    <div className="liab-row">
      <div><input className="input" value={row.guaranteedTo} placeholder="e.g. Axis Bank" onChange={(e) => set("guaranteedTo", e.target.value)}/></div>
      <div><input className="input" value={row.borrowingsBy} placeholder="e.g. Brother's firm" onChange={(e) => set("borrowingsBy", e.target.value)}/></div>
      <div><input className="input" value={row.purpose} placeholder="e.g. Cash Credit" onChange={(e) => set("purpose", e.target.value)}/></div>
      <div className="num"><input className="input" type="number" step="0.01" style={{ textAlign: "right" }} value={row.amountGuaranteed || ""} onChange={(e) => set("amountGuaranteed", Number(e.target.value))}/></div>
      <button className="btn btn-icon btn-ghost" onClick={onRemove} style={{ width: 28, height: 28 }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

/* ── Review block ───────────────────────────────────────────── */
function ReviewBlock({ title, items, highlight }: {
  title: string; items: [string, string][]; highlight?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="muted text-xs" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {items.map(([k, v], i) => (
          <div key={k} style={{
            display: "flex", justifyContent: "space-between", padding: "10px 14px",
            borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
            background: highlight && i === items.length - 1 ? "var(--brand-soft)" : "white",
            fontWeight: highlight && i === items.length - 1 ? 600 : 400,
            fontSize: 13,
          }}>
            <span className={highlight && i === items.length - 1 ? "" : "muted"}>{k}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: highlight && i === items.length - 1 ? "var(--brand)" : "var(--text)" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ── Main Page ──────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────── */
export default function NewCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  /* Step 0 — Purpose */
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [issueDate, setIssueDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [asOnDate, setAsOnDate]   = useState<dayjs.Dayjs | null>(null);

  /* Step 1 — (A) Immovable */
  const [immSelf, setImmSelf] = useState<ImmovableRow[]>([]);
  const [immSharing, setImmSharing] = useState<ImmovableRow[]>([]);

  /* Step 2 — (B) Other Assets — keyed by category id → holder → rows[] */
  const [otherAssets, setOtherAssets] = useState<OtherAssetData>(buildEmptyOtherAssets);

  /* Step 3 — (C) Liabilities */
  const [liabilities, setLiabilities] = useState<LiabilityRow[]>([]);

  /* Step 4 — Guarantees */
  const [guarantors, setGuarantors] = useState<GuarantorRow[]>([]);
  const [includeGuarantees, setIncludeGuarantees] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then((r) => r.json())
      .then((d) => { if (d.client) setClient(d.client); })
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Totals ── */
  const totalSelf     = immSelf.reduce((s, r) => s + (Number(r.propertyCost) || 0) + (Number(r.registrationCharges) || 0) + (Number(r.stampCharges) || 0), 0);
  const totalSharing  = immSharing.reduce((s, r) => s + (Number(r.propertyCost) || 0) + (Number(r.registrationCharges) || 0) + (Number(r.stampCharges) || 0), 0);
  const totalA        = totalSelf + totalSharing;
  const totalOther    = Object.values(otherAssets).reduce(
    (s, byHolder) => s + Object.values(byHolder).reduce(
      (ss, rows) => ss + sumRows(rows, "value"), 0,
    ), 0,
  );
  const totalAssets   = totalA + totalOther;
  const totalC        = sumRows(liabilities, "outstandingAmount");
  const netWorth      = totalAssets - totalC;
  const totalGuaranteed = sumRows(guarantors, "amountGuaranteed");

  /* ── Save ── */
  const handleSave = async (status: "draft" | "issued") => {
    if (!asOnDate) { message.error("Please select the 'Net worth as on' date"); return; }
    setSaving(true);
    try {
      const allImmovable = [
        ...immSelf.map((r) => ({ ...r, ownershipType: "self" as const, valueAtCost: r.propertyCost })),
        ...immSharing.map((r) => ({ ...r, ownershipType: "sharing" as const, valueAtCost: r.propertyCost })),
      ];
      const flattenCat = (catId: string) =>
        Object.entries(otherAssets[catId] || {}).flatMap(
          ([holder, rows]) => rows.map((r) => ({ ...r, holder })),
        );

      const payload = {
        clientId: id, asOnDate: asOnDate.toISOString(),
        issueDate: issueDate?.toISOString(), purpose, status,
        immovableProperties: allImmovable,
        ppf:                   flattenCat("ppf"),
        pensionScheme:         flattenCat("pension"),
        huf:                   flattenCat("huf"),
        shares:                flattenCat("shares"),
        fixedDeposit:          flattenCat("fd"),
        recurringDeposit:      flattenCat("rd"),
        otherDeposit:          flattenCat("otherDeposit"),
        insurancePolicies:     flattenCat("insurance"),
        vehicleTwoWheeler:     flattenCat("vehicleTwo"),
        vehicleFourWheeler:    flattenCat("vehicleFour"),
        capitalProprietorship: flattenCat("capitalProprietorship"),
        capitalFirm:           flattenCat("capitalFirm"),
        cashInHand:            flattenCat("cash"),
        gold:                  flattenCat("gold"),
        mutualFunds:           flattenCat("mf"),
        liabilities, guarantors: includeGuarantees ? guarantors : [],
        totalA, totalB: totalOther, totalC, netWorth,
      };
      const res = await fetch("/api/certificates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success(status === "issued" ? "Certificate issued!" : "Draft saved!");
      router.push(`/certificates/${data.certificate._id}`);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center" style={{ paddingTop: 64 }}><Spin/></div>;
  if (!client)  return <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>Client not found.</div>;

  /* ── Step content ── */
  const steps: React.ReactNode[] = [

    /* 0 — Purpose */
    <div key="purpose" className="card">
      <div className="section-header">
        <div className="flex items-center gap-12">
          <div className="section-header-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 3H14l-3.5 2.5 1.3 3.5L8 8.5 4.2 10l1.3-3.5L2 4h4.5L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <div><h4>Certificate purpose &amp; dates</h4><p>These appear on the issued certificate.</p></div>
        </div>
      </div>
      <div className="card-body">
        <div className="form-row">
          <div className="field field-full">
            <label className="label">Purpose <span className="req">*</span></label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13.5, background: "var(--bg-elev)", color: "var(--text)", width: "100%", fontFamily: "inherit" }}>
              {PURPOSE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Date of issue <span className="req">*</span></label>
            <DatePicker value={issueDate} onChange={(d) => setIssueDate(d)} format="DD/MM/YYYY" style={{ width: "100%" }}/>
          </div>
          <div className="field">
            <label className="label">Net worth as on <span className="req">*</span></label>
            <DatePicker value={asOnDate} onChange={(d) => setAsOnDate(d)} format="DD/MM/YYYY" style={{ width: "100%" }}/>
          </div>
        </div>
      </div>
      <FormFooter onNext={() => setStep(1)}/>
    </div>,

    /* 1 — (A) Immovable */
    <div key="immovable" className="card">
      <div className="section-header">
        <div className="flex items-center gap-12">
          <div className="section-header-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 7L8 2l6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h4>(A) Total Value of Immovable Property</h4>
            <p>Land, Building, Flat, Shop, Factory — split as <b>By Self</b> &amp; <b>By Sharing</b> (Annexure-1)</p>
          </div>
        </div>
      </div>

      <BucketBlock
        title="By Self"
        subtitle="Properties owned 100% by the client"
        items={immSelf}
        onUpdate={(i, r) => setImmSelf((p) => p.map((x, j) => j === i ? r : x))}
        onRemove={(i) => setImmSelf((p) => p.filter((_, j) => j !== i))}
        onAdd={() => setImmSelf((p) => [...p, blankImmovable("self")])}
      />
      <BucketBlock
        title="By Sharing"
        subtitle="Properties co-owned with spouse, family, or partners"
        items={immSharing}
        onUpdate={(i, r) => setImmSharing((p) => p.map((x, j) => j === i ? r : x))}
        onRemove={(i) => setImmSharing((p) => p.filter((_, j) => j !== i))}
        onAdd={() => setImmSharing((p) => [...p, blankImmovable("sharing")])}
      />
      <FormFooter onBack={() => setStep(0)} onNext={() => setStep(2)}/>
    </div>,

    /* 2 — (B) Other Assets */
    <div key="other" className="card">
      <div className="section-header">
        <div className="flex items-center gap-12">
          <div className="section-header-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <h4>(B) Total Value of Other Assets</h4>
            <p>PPF, Pension, FDs, Shares, Insurance, Vehicles, Gold etc. (Annexure-2)</p>
          </div>
        </div>
      </div>
      {OTHER_ASSET_CATS.map((cat) => (
        <CategoryBlock
          key={cat.id}
          category={cat}
          data={otherAssets[cat.id] || {}}
          onAdd={(holder) => setOtherAssets((p) => ({
            ...p,
            [cat.id]: { ...(p[cat.id] || {}), [holder]: [...((p[cat.id] || {})[holder] || []), blankMovable(holder)] },
          }))}
          onUpdate={(holder, i, r) => setOtherAssets((p) => ({
            ...p,
            [cat.id]: { ...(p[cat.id] || {}), [holder]: ((p[cat.id] || {})[holder] || []).map((x, j) => j === i ? r : x) },
          }))}
          onRemove={(holder, i) => setOtherAssets((p) => ({
            ...p,
            [cat.id]: { ...(p[cat.id] || {}), [holder]: ((p[cat.id] || {})[holder] || []).filter((_, j) => j !== i) },
          }))}
        />
      ))}
      <FormFooter onBack={() => setStep(1)} onNext={() => setStep(3)}/>
    </div>,

    /* 3 — (C) Liabilities */
    <div key="liabilities" className="card">
      <div className="section-header">
        <div className="flex items-center gap-12">
          <div className="section-header-icon" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v7M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <div>
            <h4>(C) Total Liabilities</h4>
            <p>Borrowings outstanding as on the certificate date.</p>
          </div>
        </div>
      </div>

      <div className="liab-row head">
        <div>Borrowed From</div><div>Amount &amp; Securities</div>
        <div>Purpose</div><div className="num">O/s as on date (₹)</div><div/>
      </div>
      {liabilities.map((r) => (
        <LiabRow key={r.key} row={r}
          onUpdate={(nr) => setLiabilities((p) => p.map((x) => x.key === r.key ? nr : x))}
          onRemove={() => setLiabilities((p) => p.filter((x) => x.key !== r.key))}/>
      ))}
      <div style={{ padding: 12 }}>
        <button className="btn btn-sm" onClick={() => setLiabilities((p) => [...p, blankLiability()])}>+ Add liability</button>
      </div>
      {liabilities.length > 0 && (
        <div className="subsection-totalbar">
          <span className="muted">Total Liabilities (C)</span>
          <b style={{ color: "var(--danger)" }}>{formatINRCompact(totalC)}</b>
        </div>
      )}
      <FormFooter onBack={() => setStep(2)} onNext={() => setStep(4)}/>
    </div>,

    /* 4 — Guarantees */
    <div key="guarantees" className="card">
      <div className="section-header">
        <div className="flex items-center gap-12">
          <div className="section-header-icon">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2l4 2v4c0 3-4 6-4 6S4 11 4 8V4l4-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h4>Guarantees given by client</h4>
            <p>Borrowings by friends/relatives/firms for which the client is guarantor.</p>
          </div>
        </div>
        <label className="flex items-center gap-8 text-sm" style={{ fontWeight: 500, cursor: "pointer" }}>
          <input type="checkbox" checked={includeGuarantees} onChange={(e) => setIncludeGuarantees(e.target.checked)}/>
          Include in certificate
        </label>
      </div>

      {includeGuarantees && (
        <>
          <div className="liab-row head">
            <div>Guaranteed To</div><div>For the Borrowings by</div>
            <div>Purpose</div><div className="num">Amount Guaranteed (₹)</div><div/>
          </div>
          {guarantors.map((r) => (
            <GuarantorRowComp key={r.key} row={r}
              onUpdate={(nr) => setGuarantors((p) => p.map((x) => x.key === r.key ? nr : x))}
              onRemove={() => setGuarantors((p) => p.filter((x) => x.key !== r.key))}/>
          ))}
          <div style={{ padding: 12 }}>
            <button className="btn btn-sm" onClick={() => setGuarantors((p) => [...p, blankGuarantor()])}>+ Add guarantee</button>
          </div>
          {guarantors.length > 0 && (
            <div className="subsection-totalbar">
              <span className="muted">Total Guaranteed (memo)</span>
              <b>{formatINRCompact(totalGuaranteed)}</b>
            </div>
          )}
        </>
      )}
      <FormFooter onBack={() => setStep(3)} onNext={() => setStep(5)}/>
    </div>,

    /* 5 — Review */
    <div key="review" className="card">
      <div className="section-header">
        <div className="flex items-center gap-12">
          <div className="section-header-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div><h4>Review &amp; issue</h4><p>Confirm all details before generating the certificate.</p></div>
        </div>
      </div>
      <div className="card-body">
        <ReviewBlock title="Client" items={[
          ["Name", client.full_name],
          ["PAN", client.pan],
          ["DOB", client.dob ? dayjs(client.dob).format("DD MMM YYYY") : "—"],
        ]}/>
        <ReviewBlock title="Certificate" items={[
          ["Purpose", purpose],
          ["Date of issue", issueDate?.format("DD MMM YYYY") || "—"],
          ["Net worth as on", asOnDate?.format("DD MMM YYYY") || "—"],
        ]}/>
        <ReviewBlock title="Computation" highlight items={[
          ["(A) Immovable — By Self",      formatINRCompact(totalSelf)],
          ["(A) Immovable — By Sharing",   formatINRCompact(totalSharing)],
          ["(A) Total Immovable",          formatINRCompact(totalA)],
          ["(B) Total Other Assets",       formatINRCompact(totalOther)],
          ["Total Assets (A + B)",         formatINRCompact(totalAssets)],
          ["(C) Total Liabilities",        formatINRCompact(totalC)],
          ["(D) Net Worth (A + B − C)",    formatINRCompact(netWorth)],
        ]}/>
      </div>
      <div className="form-footer">
        <button className="btn" onClick={() => setStep(4)}>← Back</button>
        <div className="flex gap-8">
          <button className="btn" onClick={() => handleSave("draft")} disabled={saving}>Save draft</button>
          <button className="btn btn-brand" onClick={() => handleSave("issued")} disabled={saving}>
            {saving ? "Issuing…" : "Issue certificate →"}
          </button>
        </div>
      </div>
    </div>,
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/clients/${id}`)} style={{ marginBottom: 8, paddingLeft: 0 }}>
            ← Cancel
          </button>
          <h2>New net worth certificate</h2>
          <p>For <b>{client.full_name}</b> · PAN <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{client.pan}</span></p>
        </div>
        <div className="page-header-actions">
          <button className="btn" onClick={() => handleSave("draft")} disabled={saving}>Save draft</button>
          <button className="btn btn-brand" onClick={() => setStep(5)}>Preview →</button>
        </div>
      </div>

      {/* Steps */}
      <StepsBar current={step} onJump={setStep}/>

      {/* Two-column layout */}
      <div className="split-2-1">
        {/* Left: step content */}
        <div>
          {steps[step]}
        </div>

        {/* Right: summary panel (sticky) */}
        <SummaryPanel
          totalSelf={totalSelf}
          totalSharing={totalSharing}
          totalOther={totalOther}
          totalC={totalC}
          totalGuaranteed={includeGuarantees ? totalGuaranteed : 0}
        />
      </div>
    </div>
  );
}
