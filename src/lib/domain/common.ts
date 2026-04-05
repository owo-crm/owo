import { createHash } from "node:crypto";

export function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

export function normalizePhone(value?: string | null) {
  return value?.replace(/[^\d+]/g, "")?.trim() || "";
}

export function buildLeadDedupeKey(input: { email?: string | null; phone?: string | null }) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!email && !phone) {
    return null;
  }

  return createHash("sha256").update(`${email}|${phone}`).digest("hex");
}

export function buildIdempotencyKey(input: {
  sourceKey: string;
  externalId?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}) {
  if (input.externalId && input.externalId.trim()) {
    return createHash("sha256")
      .update(`${input.sourceKey}|external|${input.externalId.trim()}`)
      .digest("hex");
  }

  return createHash("sha256")
    .update(
      `${input.sourceKey}|fallback|${normalizeEmail(input.email)}|${normalizePhone(
        input.phone,
      )}|${input.name?.trim().toLowerCase() || ""}`,
    )
    .digest("hex");
}

export function slugifyBusinessName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

