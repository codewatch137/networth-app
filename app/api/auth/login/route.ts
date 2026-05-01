import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({ id: user._id, email: user.email });

    const res = NextResponse.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
    res.cookies.set("auth_token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
