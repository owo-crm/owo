import { describe, expect, it } from "vitest";
import {
  buildIdempotencyKey,
  buildLeadDedupeKey,
  normalizeEmail,
  normalizePhone,
} from "@/lib/domain/common";

describe("domain/common", () => {
  it("normalizes email and phone consistently", () => {
    expect(normalizeEmail("  Test@Example.COM ")).toBe("test@example.com");
    expect(normalizePhone(" +48 600-111-222 ")).toBe("+48600111222");
  });

  it("produces stable dedupe key from contact inputs", () => {
    const a = buildLeadDedupeKey({
      email: "name@example.com",
      phone: "+48 700 111 333",
    });
    const b = buildLeadDedupeKey({
      email: "NAME@example.com ",
      phone: "+48700111333",
    });

    expect(a).toBeTruthy();
    expect(a).toBe(b);
  });

  it("idempotency key prefers external id when present", () => {
    const first = buildIdempotencyKey({
      sourceKey: "my-source",
      externalId: "abc-123",
      email: "one@example.com",
      phone: "123",
      name: "One",
    });
    const second = buildIdempotencyKey({
      sourceKey: "my-source",
      externalId: "abc-123",
      email: "other@example.com",
      phone: "999",
      name: "Other",
    });

    expect(first).toBe(second);
  });
});

