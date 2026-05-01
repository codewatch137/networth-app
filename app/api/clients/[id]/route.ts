import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Certificate from "@/models/Certificate";
import { getAuthUser } from "@/lib/auth";

// GET single client
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const client = await Client.findOne({ _id: id, auditorId: user.id });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json({ client });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update client
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Strip internal / immutable fields before updating
    const { _id, __v, auditorId, createdAt, updatedAt, ...safeBody } = body;
    void _id; void __v; void auditorId; void createdAt; void updatedAt;

    const client = await Client.findOneAndUpdate(
      { _id: id, auditorId: user.id },
      { $set: safeBody },
      { new: true, runValidators: true }
    );
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json({ client });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE client (cascades: removes all certificates owned by this client)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const client = await Client.findOneAndDelete({ _id: id, auditorId: user.id });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // Cascade delete: remove every certificate that referenced this client.
    // Scoped by auditorId as a safety net so we never touch another auditor's data.
    const { deletedCount } = await Certificate.deleteMany({
      clientId: id,
      auditorId: user.id,
    });

    return NextResponse.json({
      message: "Client deleted",
      deletedCertificates: deletedCount ?? 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
