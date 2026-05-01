import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Certificate from "@/models/Certificate";
import { getAuthUser } from "@/lib/auth";

interface CertSlim {
  purpose?: string;
  netWorth?: number;
  totalA?: number;
  totalB?: number;
  totalC?: number;
  status?: "draft" | "issued";
  issuedAt?: Date | string;
  createdAt?: Date | string;
}

/** Compute the effective net worth for a cert.
 *  Prefers the persisted `netWorth` value, but falls back to totalA + totalB − totalC
 *  when `netWorth` is missing or zero (e.g. an old issue that was locked without
 *  a fresh recompute). */
function effectiveNetWorth(c: CertSlim): number {
  const stored = Number(c.netWorth) || 0;
  if (stored > 0) return stored;
  const a = Number(c.totalA) || 0;
  const b = Number(c.totalB) || 0;
  const cc = Number(c.totalC) || 0;
  return a + b - cc;
}

function categorisePurpose(p: string): string {
  const v = p.toLowerCase();
  if (v.includes("visa") || v.includes("immigration")) return "Visa applications";
  if (v.includes("loan"))                              return "Bank loans";
  if (v.includes("tender") || v.includes("government")) return "Govt. tenders";
  if (v.includes("court"))                              return "Court matters";
  return "Other";
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthFilter = {
      $or: [
        { issuedAt:  { $gte: startOfMonth } },
        { updatedAt: { $gte: startOfMonth } },
        { createdAt: { $gte: startOfMonth } },
      ],
    };

    const [totalClients, totalDrafts, recentCerts, allIssued, issuedThisMonth, monthCerts] = await Promise.all([
      Client.countDocuments({ auditorId: user.id }),
      Certificate.countDocuments({ auditorId: user.id, status: "draft" }),
      Certificate.find({ auditorId: user.id })
        .populate("clientId", "full_name pan")
        .sort({ createdAt: -1 })
        .limit(5),
      Certificate.find({ auditorId: user.id, status: "issued" })
        .select("netWorth totalA totalB totalC")
        .lean<CertSlim[]>(),
      Certificate.countDocuments({
        auditorId: user.id,
        status: "issued",
        ...monthFilter,
      }),
      // Include BOTH issued + drafts from this month so the breakdown reflects
      // current work-in-progress, not just historic issued certs.
      Certificate.find({ auditorId: user.id, ...monthFilter })
        .select("purpose status")
        .lean<CertSlim[]>(),
    ]);

    const totalIssued = allIssued.length;
    const totalNetWorth = allIssued.reduce((s, c) => s + effectiveNetWorth(c), 0);
    const avgNetWorth = totalIssued ? totalNetWorth / totalIssued : 0;

    const buckets: Record<string, number> = {
      "Visa applications": 0,
      "Bank loans":        0,
      "Govt. tenders":     0,
      "Court matters":     0,
      "Other":             0,
    };
    monthCerts.forEach((c) => {
      // Skip certs with no purpose at all — keeps the chart noise-free
      if (!c.purpose) return;
      const k = categorisePurpose(c.purpose);
      buckets[k] = (buckets[k] || 0) + 1;
    });
    const purposeBreakdown = Object.entries(buckets).map(([label, value]) => ({ label, value }));

    return NextResponse.json({
      totalClients,
      totalIssued,
      totalDrafts,
      issuedThisMonth,
      totalNetWorth, // in ₹ (rupees)
      avgNetWorth,
      purposeBreakdown,
      recentCerts,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
