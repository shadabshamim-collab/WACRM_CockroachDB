import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/cockroachdb/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const db = createClient();

    // Check if user exists
    const profile = await db
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (!profile.data) {
      // Return success anyway for security (don't reveal if email exists)
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // In a real implementation, you would:
    // 1. Generate a reset token
    // 2. Store it in the database with an expiry
    // 3. Send an email with a link containing the token
    // 4. User clicks the link and sets a new password

    // For now, we'll just return success
    console.log(
      `[/api/auth/forgot-password] Password reset requested for: ${email}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/auth/forgot-password] Error:", error);
    return NextResponse.json(
      { error: "An error occurred during password reset" },
      { status: 500 }
    );
  }
}
