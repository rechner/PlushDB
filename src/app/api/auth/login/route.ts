import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { getUserByUsername } from "@/lib/plushies";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username?.trim() || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = getUserByUsername(username.trim());
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.authMethod = "password";
    session.username = user.username;
    await session.save();

    return NextResponse.json({ success: true, username: user.username });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
