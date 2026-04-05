import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { IngestFamily, LeadSource } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { buildIdempotencyKey, buildLeadDedupeKey } from "@/lib/domain/common";
import { createDefaultFollowUpTask } from "@/lib/domain/tasks";
import type { IngestionRequest, IngestionResult } from "@/lib/types/domain";

function familyToLeadSource(family: IngestFamily): LeadSource {
  if (family === "api") return "api";
  if (family === "website_form") return "website_form";
  if (family === "google_sheet") return "google_sheet";
  if (family === "meta_form_direct") return "meta_form_direct";
  return "import_file";
}

function buildPayloadHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

export async function ingestLead(input: {
  family: IngestFamily;
  sourceKey: string;
  payload: IngestionRequest;
}) {
  const source = await prisma.ingestSource.findFirst({
    where: {
      key: input.sourceKey,
      family: input.family,
      isActive: true,
    },
    select: {
      key: true,
      family: true,
      businessId: true,
    },
  });

  if (!source) {
    throw new Error("SOURCE_NOT_FOUND_OR_INACTIVE");
  }

  const fullName = input.payload.full_name?.trim();
  if (!fullName) {
    throw new Error("FULL_NAME_REQUIRED");
  }

  const dedupeKey = buildLeadDedupeKey({
    email: input.payload.email,
    phone: input.payload.phone,
  });
  const idempotencyKey = buildIdempotencyKey({
    sourceKey: source.key,
    externalId: input.payload.external_id,
    email: input.payload.email,
    phone: input.payload.phone,
    name: input.payload.full_name,
  });

  const result = await prisma.$transaction(async (tx) => {
    const existingReceipt = await tx.ingestReceipt.findFirst({
      where: {
        businessId: source.businessId,
        sourceKey: source.key,
        idempotencyKey,
      },
      include: {
        lead: {
          select: {
            uid: true,
          },
        },
      },
    });

    if (existingReceipt?.lead?.uid) {
      return {
        action: "idempotent" as const,
        leadUid: existingReceipt.lead.uid,
      };
    }

    const existingLead =
      dedupeKey &&
      (await tx.lead.findFirst({
        where: {
          businessId: source.businessId,
          dedupeKey,
          archivedAt: null,
        },
      }));

    const payloadHash = buildPayloadHash(input.payload);

    if (existingLead) {
      const merged = await tx.lead.update({
        where: { id: existingLead.id },
        data: {
          fullName: existingLead.fullName || fullName,
          email: existingLead.email || input.payload.email || null,
          phone: existingLead.phone || input.payload.phone || null,
          note: input.payload.note
            ? `${existingLead.note ?? ""}\n${input.payload.note}`.trim()
            : existingLead.note,
          metadata: {
            ...(existingLead.metadata as Record<string, unknown> | null),
            ...(input.payload.metadata ?? {}),
            source_created_at: input.payload.source_created_at ?? null,
          } as Prisma.InputJsonValue,
          sourcePayloadHash: payloadHash,
        },
      });

      await tx.ingestReceipt.create({
        data: {
          businessId: source.businessId,
          sourceKey: source.key,
          sourceFamily: source.family,
          idempotencyKey,
          leadId: merged.id,
          rawPayload: asJson(input.payload),
        },
      });

      await tx.businessEvent.create({
        data: {
          businessId: source.businessId,
          type: "lead.ingested.merged",
          leadId: merged.id,
          payload: {
            source_key: source.key,
            source_family: source.family,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        action: "merged" as const,
        leadUid: merged.uid,
      };
    }

    const defaultStatus = await tx.leadStatus.findFirst({
      where: { businessId: source.businessId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const statusId = defaultStatus?.id ?? null;

    const created = await tx.lead.create({
      data: {
        businessId: source.businessId,
        source: familyToLeadSource(source.family),
        sourceExternalKey: input.payload.external_id?.trim() || null,
        sourcePayloadHash: payloadHash,
        dedupeKey,
        fullName,
        email: input.payload.email?.trim() || null,
        phone: input.payload.phone?.trim() || null,
        note: input.payload.note?.trim() || null,
        statusId,
        metadata: {
          ...(input.payload.metadata ?? {}),
          source_key: source.key,
          source_family: source.family,
          source_created_at: input.payload.source_created_at ?? null,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.ingestReceipt.create({
      data: {
        businessId: source.businessId,
        sourceKey: source.key,
        sourceFamily: source.family,
        idempotencyKey,
        leadId: created.id,
        rawPayload: asJson(input.payload),
      },
    });

    await createDefaultFollowUpTask(tx, {
      businessId: source.businessId,
      leadId: created.id,
    });

    await tx.businessEvent.create({
      data: {
        businessId: source.businessId,
        type: "lead.ingested.created",
        leadId: created.id,
        payload: {
          source_key: source.key,
          source_family: source.family,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      action: "created" as const,
      leadUid: created.uid,
    };
  });

  const response: IngestionResult = {
    accepted: true,
    action: result.action,
    lead_uid: result.leadUid,
    warnings: [],
  };

  return response;
}
