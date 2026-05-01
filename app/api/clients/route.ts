import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { getAuthUser } from "@/lib/auth";

// GET all clients for the logged-in auditor
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const clients = await Client.find({ auditorId: user.id }).sort({ createdAt: -1 });
    return NextResponse.json({ clients });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new client
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const clientRef = `CLT-${Date.now()}`;
    const client = await Client.create({ ...body, auditorId: user.id, clientRef });
    return NextResponse.json({ client }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error && err.name === "ValidationError") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
