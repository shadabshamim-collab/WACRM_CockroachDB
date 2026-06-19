import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@/lib/cockroachdb/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("auth_token")?.value;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookieToken;

    if (!token) {
      return NextResponse.json({ profile: null, account: null }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      userId: string;
    };

    const db = createClient();

    // Get profile with account info
    const profileResult = await db
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url, role, beta_features, account_id, account_role")
      .eq("user_id", decoded.userId)
      .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json({ profile: null, account: null }, { status: 404 });
    }

    const profile = profileResult.data;

    // Get account info
    let account = null;
    if (profile.account_id) {
      const accountResult = await db
        .from("accounts")
        .select("id, name, default_currency")
        .eq("id", profile.account_id)
        .single();

      if (accountResult.data) {
        account = accountResult.data;
      }
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        full_name: profile.first_name
          ? `${profile.first_name} ${profile.last_name || ""}`.trim()
          : null,
        email: profile.email,
        avatar_url: profile.avatar_url,
        role: profile.role,
        beta_features: profile.beta_features || [],
        account_id: profile.account_id,
        account_role: profile.account_role,
      },
      account,
    });
  } catch (error) {
    console.error("[/api/auth/profile] Error:", error);
    return NextResponse.json({ profile: null, account: null }, { status: 500 });
  }
}
