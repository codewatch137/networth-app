"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Tag, Divider, Table, Spin, message, Modal } from "antd";
import {
  ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined,
  HomeOutlined, BankOutlined, SafetyOutlined, AuditOutlined, EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatINRCompact, formatINRGroup } from "@/lib/formatINR";

interface ClientPopulated {
  full_name: string;
  pan: string;
  dob?: string;
  permanent_address?: string;
  office_address?: string;
  mobile?: string;
  email?: string;
}

interface MovableEntryView {
  holder: string;
  refNo?: string;
  heldWith?: string;
  dateOfInvestment?: string;
  value?: number;
  /** legacy */
  presentValue?: number;
  /** legacy */
  valueAtCost?: number;
}

interface Certificate {
  _id: string;
  certNumber: string;
  asOnDate: string;
  status: "draft" | "issued";
  netWorth: number;
  totalA: number;
  totalB: number;
  totalC: number;
  clientId: ClientPopulated;
  immovableProperties: {
    nature: string; address: string; ownershipType: string;
    dateOfPurchase?: string; propertyCost?: number; valueAtCost?: number;
    loanOutstanding?: number;
  }[];
  ppf: MovableEntryView[];
  pensionScheme: MovableEntryView[];
  huf: MovableEntryView[];
  shares: MovableEntryView[];
  fixedDeposit: MovableEntryView[];
  recurringDeposit: MovableEntryView[];
  otherDeposit: MovableEntryView[];
  insurancePolicies: MovableEntryView[];
  vehicleTwoWheeler: MovableEntryView[];
  vehicleFourWheeler: MovableEntryView[];
  capitalProprietorship: MovableEntryView[];
  capitalFirm: MovableEntryView[];
  cashInHand: MovableEntryView[];
  gold: MovableEntryView[];
  mutualFunds: MovableEntryView[];
  // Legacy
  vehicles?: MovableEntryView[];
  liabilities: { borrowedFrom: string; purpose: string; outstandingAmount: number }[];
  guarantors: { guaranteedTo: string; borrowingsBy: string; purpose: string; amountGuaranteed: number }[];
  issuedAt?: string;
  createdAt: string;
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {icon} {label}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-800 mt-0.5">{value || "—"}</div>
    </div>
  );
}

export default function CertificateDetailPage() {
  const { certId } = useParams<{ certId: string }>();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    fetch(`/api/certificates/${certId}`)
      .then((r) => r.json())
      .then((d) => { if (d.certificate) setCert(d.certificate); })
      .catch(() => message.error("Failed to load certificate"))
      .finally(() => setLoading(false));
  }, [certId]);

  const handleIssue = () => {
    if (!cert) return;
    // Recompute totals from the in-memory certificate before issuing so the locked
    // record always reflects the latest sums (catches drafts saved before the
    // currency switch or any earlier schema bug).
    const totalA = Number(cert.totalA) || 0;
    const totalB = Number(cert.totalB) || 0;
    const totalC = Number(cert.totalC) || 0;
    const netWorth = totalA + totalB - totalC;

    Modal.confirm({
      title: "Issue Certificate?",
      content: "Once issued, the certificate cannot be edited. Are you sure?",
      okText: "Yes, Issue",
      okButtonProps: { style: { background: "#185FA5" } },
      onOk: async () => {
        setIssuing(true);
        try {
          const res = await fetch(`/api/certificates/${certId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "issued", totalA, totalB, totalC, netWorth }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setCert(data.certificate);
          message.success("Certificate issued successfully!");
        } catch {
          message.error("Failed to issue certificate");
        } finally {
          setIssuing(false);
        }
      },
    });
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="flex justify-center py-16"><Spin /></div>;
  if (!cert) return <div className="text-center py-16 text-gray-400">Certificate not found.</div>;

  // Client may be null if it was deleted after the certificate was issued
  const c = cert.clientId ?? {} as Partial<ClientPopulated>;
  const clientMissing = !cert.clientId;

  const movableRows = [
    { label: "PPF",                                  rows: cert.ppf },
    { label: "Pension Scheme",                       rows: cert.pensionScheme },
    { label: "Investment in HUF",                    rows: cert.huf },
    { label: "Shares",                               rows: cert.shares },
    { label: "Fixed Deposit",                        rows: cert.fixedDeposit },
    { label: "Recurring Deposit",                    rows: cert.recurringDeposit },
    { label: "Other Deposit",                        rows: cert.otherDeposit },
    { label: "Insurance Policies",                   rows: cert.insurancePolicies },
    { label: "Vehicles — Two Wheeler",               rows: cert.vehicleTwoWheeler },
    { label: "Vehicles — Four Wheeler",              rows: cert.vehicleFourWheeler },
    { label: "Capital Investment in Proprietorship", rows: cert.capitalProprietorship },
    { label: "Investment in Firm / Companies",       rows: cert.capitalFirm },
    { label: "Cash in Hand",                         rows: cert.cashInHand },
    { label: "Gold & Jewellery",                     rows: cert.gold },
    { label: "Mutual Funds",                         rows: cert.mutualFunds },
    { label: "Vehicles",                             rows: cert.vehicles },
  ].filter((g) => g.rows && g.rows.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => router.back()} />
          <div>
            <div className="text-base font-semibold text-gray-800">
              {cert.certNumber || "Certificate"}
              <Tag
                color={cert.status === "issued" ? "green" : "orange"}
                className="ml-2 align-middle"
              >
                {cert.status === "issued" ? "Issued" : "Draft"}
              </Tag>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">As on {dayjs(cert.asOnDate).format("DD MMM YYYY")}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/certificates/${certId}/edit`)}
          >
            {cert.status === "issued" ? "Amend" : "Edit"}
          </Button>
          {cert.status === "draft" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              style={{ background: "#16a34a" }}
              onClick={handleIssue}
              loading={issuing}
            >
              Issue Certificate
            </Button>
          )}
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
        </div>
      </div>

      <div ref={printRef} id="print-area">
        {/* Certificate Header - printable */}
        <div className="bg-white rounded-lg border border-gray-100 p-6 mb-4">
          <div className="text-center mb-4">
            <div className="text-lg font-bold text-gray-800 tracking-wide uppercase">Certificate of Net Worth</div>
            {cert.certNumber && <div className="text-xs text-gray-400 mt-1">Ref No: {cert.certNumber}</div>}
            {cert.status === "issued" && cert.issuedAt && (
              <div className="text-xs text-gray-400">Issued on: {dayjs(cert.issuedAt).format("DD MMM YYYY")}</div>
            )}
          </div>
          <Divider style={{ margin: "12px 0" }} />

          {/* Client Details */}
          {clientMissing && (
            <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              The client linked to this certificate has been deleted. Client details below will appear blank.
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <InfoRow label="Client Name" value={c.full_name} />
            <InfoRow label="PAN" value={c.pan} />
            <InfoRow label="Date of Birth" value={c.dob ? dayjs(c.dob).format("DD MMM YYYY") : null} />
            <InfoRow label="Permanent Address" value={c.permanent_address} />
            <InfoRow label="Office Address" value={c.office_address} />
            <InfoRow label="Certificate As on Date" value={dayjs(cert.asOnDate).format("DD MMMM YYYY")} />
          </div>
        </div>

        {/* Annexure A - Immovable */}
        {cert.immovableProperties?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-100 p-5 mb-4">
            <SectionTitle icon={<HomeOutlined />} label="Annexure 1 — Immovable Property" />
            <Table
              size="small"
              pagination={false}
              dataSource={cert.immovableProperties.map((r, i) => ({ ...r, _key: i }))}
              rowKey="_key"
              columns={[
                { title: "Ownership", dataIndex: "ownershipType", width: 100, render: (v: string) => v === "sharing" ? "Sharing" : "By Self" },
                { title: "Nature", dataIndex: "nature" },
                { title: "Address", dataIndex: "address" },
                { title: "Date of Purchase", dataIndex: "dateOfPurchase", width: 130, render: (v: string) => v ? dayjs(v).format("DD/MM/YYYY") : "—" },
                { title: "Property Cost", width: 160, align: "right",
                  render: (_, r: { propertyCost?: number; valueAtCost?: number }) =>
                    <span className="font-medium">{formatINRGroup(r.propertyCost ?? r.valueAtCost ?? 0)}</span> },
                { title: "Outstanding Loan", dataIndex: "loanOutstanding", width: 160, align: "right",
                  render: (v: number) => <span className="text-red-600">{formatINRGroup(v ?? 0)}</span> },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}><span className="font-semibold">Total (A)</span></Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right"><span className="font-bold text-blue-700">{formatINRCompact(cert.totalA)}</span></Table.Summary.Cell>
                  <Table.Summary.Cell index={5} />
                </Table.Summary.Row>
              )}
              className="border border-gray-100 rounded overflow-hidden"
            />
          </div>
        )}

        {/* Annexure B - Movable */}
        <div className="bg-white rounded-lg border border-gray-100 p-5 mb-4">
          <SectionTitle icon={<BankOutlined />} label="Annexure 2 — Movable Assets" />
          {movableRows.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">No movable assets recorded.</div>
          ) : (
            movableRows.map(({ label, rows }) => (
              <div key={label} className="mb-4">
                <div className="text-xs font-semibold text-gray-400 mb-1">{label}</div>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={(rows ?? []).map((r, i) => ({ ...r, _key: i }))}
                  rowKey="_key"
                  columns={[
                    { title: "Holder", dataIndex: "holder", render: (v: string) => v || "—" },
                    { title: "Reference / Held With", render: (_, r: MovableEntryView) => r.heldWith || r.refNo || "—" },
                    { title: "Value", align: "right", render: (_, r: MovableEntryView) =>
                        <span className="font-medium">{formatINRGroup(r.value ?? r.presentValue ?? r.valueAtCost ?? 0)}</span> },
                  ]}
                  className="border border-gray-100 rounded overflow-hidden"
                />
              </div>
            ))
          )}
          <div className="bg-blue-50 rounded p-2 text-sm font-semibold text-blue-700 text-right">Total (B) = {formatINRCompact(cert.totalB)}</div>
        </div>

        {/* Section C - Liabilities */}
        <div className="bg-white rounded-lg border border-gray-100 p-5 mb-4">
          <SectionTitle icon={<SafetyOutlined />} label="Section C — Liabilities" />
          {(!cert.liabilities || cert.liabilities.length === 0) ? (
            <div className="text-center text-gray-400 text-sm py-4">No liabilities recorded. (Nil)</div>
          ) : (
            <Table
              size="small"
              pagination={false}
              dataSource={cert.liabilities.map((r, i) => ({ ...r, _key: i }))}
              rowKey="_key"
              columns={[
                { title: "Borrowed From", dataIndex: "borrowedFrom" },
                { title: "Purpose", dataIndex: "purpose" },
                { title: "Outstanding Amount", dataIndex: "outstandingAmount", align: "right", render: (v: number) => <span className="text-red-600 font-medium">{formatINRGroup(v ?? 0)}</span> },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}><span className="font-semibold">Total (C)</span></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right"><span className="font-bold text-red-600">{formatINRCompact(cert.totalC)}</span></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              className="border border-gray-100 rounded overflow-hidden"
            />
          )}
        </div>

        {/* Guarantors */}
        {cert.guarantors?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-100 p-5 mb-4">
            <SectionTitle icon={<AuditOutlined />} label="Guarantor Details" />
            <Table
              size="small"
              pagination={false}
              dataSource={cert.guarantors.map((r, i) => ({ ...r, _key: i }))}
              rowKey="_key"
              columns={[
                { title: "Guaranteed To", dataIndex: "guaranteedTo" },
                { title: "Borrowings By", dataIndex: "borrowingsBy" },
                { title: "Purpose", dataIndex: "purpose" },
                { title: "Amount", dataIndex: "amountGuaranteed", align: "right", render: (v: number) => formatINRGroup(v ?? 0) },
              ]}
              className="border border-gray-100 rounded overflow-hidden"
            />
          </div>
        )}

        {/* Net Worth Summary Box */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
          <div className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Net Worth Calculation</div>
          <div className="max-w-md mx-auto space-y-2">
            {[
              { label: "(A) Total Immovable Property", value: cert.totalA, color: "text-gray-800" },
              { label: "(B) Total Movable Assets", value: cert.totalB, color: "text-gray-800" },
              { label: "(C) Total Liabilities (−)", value: cert.totalC, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${color}`}>{formatINRGroup(value)}</span>
              </div>
            ))}
            <Divider style={{ margin: "8px 0" }} />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800 text-sm">Net Worth (A + B − C)</span>
              <span className="text-xl font-bold text-blue-700">{formatINRCompact(cert.netWorth)}</span>
            </div>
            <div className="text-center mt-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-500 mb-1">Exact Amount</div>
                <div className="text-sm font-semibold text-blue-800" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatINRGroup(cert.netWorth)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #print-area { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
