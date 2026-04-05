import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthSessionPayload } from "@/lib/types/domain";

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized.padEnd(normalized.length + (4 - pad), "=") : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function getAuthSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (secret && secret.trim().length >= 24) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_TOKEN_SECRET must be configured in production (min 24 chars).",
    );
  }

  return "owo-dev-auth-secret-not-for-production";
}

function sign(unsignedToken: string) {
  return createHmac("sha256", getAuthSecret()).update(unsignedToken).digest("base64url");
}

export function createAuthToken(payload: Omit<AuthSessionPayload, "exp" | "iat">) {
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = Number.parseInt(process.env.AUTH_TOKEN_TTL_SECONDS ?? "86400", 10);
  const safeTtl = Number.isFinite(ttlSeconds) ? Math.max(ttlSeconds, 900) : 86400;

  const fullPayload: AuthSessionPayload = {
    ...payload,
    iat: now,
    exp: now + safeTtl,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const unsignedToken = `${header}.${body}`;
  const signature = sign(unsignedToken);
  return `${unsignedToken}.${signature}`;
}

export function verifyAuthToken(token: string): AuthSessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, providedSignature] = parts;
  const unsignedToken = `${header}.${body}`;
  const expectedSignature = sign(unsignedToken);

  const left = Buffer.from(expectedSignature, "utf8");
  const right = Buffer.from(providedSignature, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AuthSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || !payload.business_id || !payload.role) {
      return null;
    }
    if (!payload.exp || payload.exp <= now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

