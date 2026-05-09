import { NextResponse } from "next/server";
import { isRequestAuthenticated } from "@/lib/auth";

export async function requireApiAuth(): Promise<NextResponse | null> {
  if (await isRequestAuthenticated()) {
    return null;
  }

  return NextResponse.json(
    { error: "認証が必要です。" },
    { status: 401 },
  );
}

export function routeErrorResponse(error: unknown): NextResponse {
  console.error(error);

  const message =
    error instanceof Error && error.message.includes("DATABASE_URL")
      ? "DATABASE_URLが設定されていません。"
      : "処理に失敗しました。時間を置いて再試行してください。";

  return NextResponse.json({ error: message }, { status: 500 });
}
