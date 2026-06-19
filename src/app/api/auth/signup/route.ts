import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/cockroachdb/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = createClient();

    // Check if user already exists
    const existingProfile = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile.data) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Create account
    const accountId = randomUUID();
    const userId = randomUUID();

    // Insert account
    await db.from("accounts").insert({
      id: accountId,
      owner_id: userId,
      display_name: email.split("@")[0],
      created_at: new Date().toISOString(),
    });

    // Insert profile (user)
    const nameParts = fullName.split(" ");
    await db.from("profiles").insert({
      id: userId,
      account_id: accountId,
      email,
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" ") || "",
      password_hash: password, // In production, hash this with bcrypt
      created_at: new Date().toISOString(),
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email,
        accountId,
      },
      process.env.JWT_SECRET || "",
      { expiresIn: "7d" }
    );

    // Set auth cookie
    const response = NextResponse.json(
      { success: true, user: { id: userId, email } },
      { status: 201 }
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
    console.error("[/api/auth/signup] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
