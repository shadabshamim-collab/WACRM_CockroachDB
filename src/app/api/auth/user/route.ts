import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("auth_token")?.value;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookieToken;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      userId: string;
      email: string;
    };

    return NextResponse.json({
      user: {
        id: decoded.userId,
        email: decoded.email,
      },
    });
  } catch (error) {
    console.error("[/api/auth/user] Error:", error);
    return NextResponse.json({ user: null });
  }
}
