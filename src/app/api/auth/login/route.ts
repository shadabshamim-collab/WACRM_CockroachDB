import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/cockroachdb/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const db = createClient();

    // Find user by email
    const profile = await db
      .from("profiles")
      .select("id, email, password_hash, account_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile.data) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // In production, use bcrypt.compare() instead of plain comparison
    if (profile.data.password_hash !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: profile.data.id,
        email: profile.data.email,
        accountId: profile.data.account_id,
      },
      process.env.JWT_SECRET || "",
      { expiresIn: "7d" }
    );

    // Set auth cookie
    const response = NextResponse.json(
      { success: true, user: { id: profile.data.id, email } },
      { status: 200 }
    );

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[/api/auth/login] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
