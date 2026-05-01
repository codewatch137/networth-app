import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Certificate from "@/models/Certificate";
import { getAuthUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const certificate = await Certificate.findOne({ _id: id, auditorId: user.id })
      .populate("clientId", "full_name pan dob permanent_address office_address mobile email");
    if (!certificate) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ certificate });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Strip internal Mongoose fields and any fields the user shouldn't be able to overwrite
    const { _id, __v, auditorId, createdAt, updatedAt, clientId, ...safeBody } = body;
    void _id; void __v; void auditorId; void createdAt; void updatedAt; void clientId;

    // Editing is allowed on both drafts and issued certificates.
    // Editing an already-issued cert leaves its `status` as "issued" but bumps
    // `updatedAt` (timestamps:true on the schema) so the audit trail still shows it.
    // Only stamp `issuedAt` on the FIRST transition to "issued" — never on subsequent
    // edits of an already-issued cert (otherwise the original issue date drifts forward).
    if (safeBody.status === "issued") {
      const existing = await Certificate.findOne(
        { _id: id, auditorId: user.id },
        { issuedAt: 1, status: 1 },
      ).lean<{ issuedAt?: Date | string; status?: string }>();
      if (!existing?.issuedAt) safeBody.issuedAt = new Date();
      else delete safeBody.issuedAt; // preserve original issue timestamp
    }

    const certificate = await Certificate.findOneAndUpdate(
      { _id: id, auditorId: user.id },
      { $set: safeBody },
      { new: true, runValidators: true }
    ).populate("clientId", "full_name pan dob permanent_address office_address");

    if (!certificate) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ certificate });
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.name === "ValidationError") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { id } = await params;
    await Certificate.findOneAndDelete({ _id: id, auditorId: user.id, status: "draft" });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
