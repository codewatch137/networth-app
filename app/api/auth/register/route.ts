import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = signToken({ id: user._id, email: user.email });

    const res = NextResponse.json({ message: "Registered successfully", user: { id: user._id, name: user.name, email: user.email } });
    res.cookies.set("auth_token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
