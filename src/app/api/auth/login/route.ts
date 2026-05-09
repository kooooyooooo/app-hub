import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isPasswordConfigured,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isPasswordConfigured()) {
    return NextResponse.json(
      { error: "APP_PASSWORDが設定されていません。" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { error: "パスワードを入力してください。" },
      { status: 400 },
    );
  }

  if (!verifyPassword(body.password)) {
    return NextResponse.json(
      { error: "パスワードが違います。" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
