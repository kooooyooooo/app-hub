import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "app_hub_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  iat: number;
};

function getSecret(): string {
  return process.env.APP_PASSWORD ?? "";
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isPasswordConfigured(): boolean {
  return getSecret().length > 0;
}

export function verifyPassword(password: string): boolean {
  const secret = getSecret();

  if (!secret) {
    return false;
  }

  return safeEquals(password, secret);
}

export function createSessionToken(): string {
  const secret = getSecret();

  if (!secret) {
    throw new Error("APP_PASSWORD is not configured.");
  }

  const payload = Buffer.from(
    JSON.stringify({ iat: Date.now() } satisfies SessionPayload),
  ).toString("base64url");
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = getSecret();

  if (!token || !secret) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [payload, signature] = parts;

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signPayload(payload, secret);

  if (!safeEquals(signature, expectedSignature)) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;

    if (typeof parsed.iat !== "number") {
      return false;
    }

    const ageMs = Date.now() - parsed.iat;

    return ageMs >= 0 && ageMs <= SESSION_MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

export async function isRequestAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}
