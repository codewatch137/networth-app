import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FieldConfig from "@/models/FieldConfig";
import { getAuthUser } from "@/lib/auth";

// GET field config for a module
export async function GET(_req: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { module } = await params;
    const config = await FieldConfig.findOne({ auditorId: user.id, module });
    return NextResponse.json({ fields: config?.fields ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST save/update field config for a module
export async function POST(req: NextRequest, { params }: { params: Promise<{ module: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { module } = await params;
    const { fields } = await req.json();

    const config = await FieldConfig.findOneAndUpdate(
      { auditorId: user.id, module },
      { auditorId: user.id, module, fields },
      { upsert: true, new: true }
    );

    return NextResponse.json({ config });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
