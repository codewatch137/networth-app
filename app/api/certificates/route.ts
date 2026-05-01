import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Certificate from "@/models/Certificate";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const query: Record<string, unknown> = { auditorId: user.id };
    if (clientId) query.clientId = clientId;
    const certificates = await Certificate.find(query)
      .populate("clientId", "full_name pan")
      .sort({ createdAt: -1 });
    return NextResponse.json({ certificates });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const count = await Certificate.countDocuments({ auditorId: user.id });
    const certNumber = `NWC/${new Date().getFullYear()}/${String(count + 1).padStart(3, "0")}`;
    const certificate = await Certificate.create({ ...body, auditorId: user.id, certNumber });
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
