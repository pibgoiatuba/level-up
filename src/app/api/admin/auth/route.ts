import { NextResponse } from "next/server";
import { checkAdminAuth, generateAdminToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isAuth = checkAdminAuth(request);
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const token = generateAdminToken();
    const response = NextResponse.json({ success: true });

    // Set HTTP-only cookie valid for 7 days
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Error in admin auth:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

