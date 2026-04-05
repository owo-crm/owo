import { Prisma } from "@/generated/prisma/client";
import type { LeadSource } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { buildLeadDedupeKey } from "@/lib/domain/common";
import { createBusinessEvent } from "@/lib/domain/events";
import { createDefaultFollowUpTask } from "@/lib/domain/tasks";
import type { LeadDto } from "@/lib/types/domain";

type LeadWithRelations = {
  id: string;
  uid: string;
  businessId: string;
  source: LeadSource;
  fullName: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    displayName: string;
  } | null;
  status: {
    id: string;
    key: string;
    label: string;
    colorHex: string;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    dueAt: Date | null;
  }>;
};

function toJsonInput(value: Record<string, unknown> | null | undefined) {
  if (value === null) {
    return Prisma.JsonNull;
  }
  if (value === undefined) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

function toLeadDto(lead: LeadWithRelations): LeadDto {
  const nextTask = lead.tasks[0] ?? null;

  return {
    id: lead.id,
    uid: lead.uid,
    business_id: lead.businessId,
    source: lead.source,
    full_name: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    note: lead.note,
    metadata: (lead.metadata as Record<string, unknown> | null) ?? null,
    owner: lead.owner
      ? {
          id: lead.owner.id,
          display_name: lead.owner.displayName,
        }
      : null,
    status: lead.status
      ? {
          id: lead.status.id,
          key: lead.status.key,
          label: lead.status.label,
          color_hex: lead.status.colorHex,
        }
      : null,
    next_task: nextTask
      ? {
          id: nextTask.id,
          title: nextTask.title,
          due_at: nextTask.dueAt ? nextTask.dueAt.toISOString() : null,
        }
      : null,
    created_at: lead.createdAt.toISOString(),
    updated_at: lead.updatedAt.toISOString(),
  };
}

async function readLeadByUidOrThrow(uid: string, businessId: string) {
  const lead = await prisma.lead.findFirst({
    where: {
      uid,
      businessId,
      archivedAt: null,
    },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
        },
      },
      status: {
        select: {
          id: true,
          key: true,
          label: true,
          colorHex: true,
        },
      },
      tasks: {
        where: { doneAt: null },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
      },
    },
  });

  if (!lead) {
    throw new Error("LEAD_NOT_FOUND");
  }

  return lead as LeadWithRelations;
}

export async function listLeads(input: {
  businessId: string;
  statusId?: string | null;
  ownerId?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}) {
  const leads = await prisma.lead.findMany({
    where: {
      businessId: input.businessId,
      archivedAt: null,
      ...(input.statusId ? { statusId: input.statusId } : {}),
      ...(input.ownerId ? { ownerId: input.ownerId } : {}),
      ...(input.search
        ? {
            OR: [
              { fullName: { contains: input.search, mode: "insensitive" } },
              { email: { contains: input.search, mode: "insensitive" } },
              { phone: { contains: input.search } },
            ],
          }
        : {}),
    },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
        },
      },
      status: {
        select: {
          id: true,
          key: true,
          label: true,
          colorHex: true,
        },
      },
      tasks: {
        where: { doneAt: null },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 100,
    skip: input.offset ?? 0,
  });

  return leads.map((lead) => toLeadDto(lead as LeadWithRelations));
}

export async function getLeadByUid(uid: string, businessId: string) {
  const lead = await readLeadByUidOrThrow(uid, businessId);
  return toLeadDto(lead);
}

export async function createManualLead(input: {
  businessId: string;
  actorUserId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  ownerId?: string | null;
  statusId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const dedupeKey = buildLeadDedupeKey({
    email: input.email,
    phone: input.phone,
  });

  const result = await prisma.$transaction(async (tx) => {
    if (dedupeKey) {
      const existing = await tx.lead.findFirst({
        where: {
          businessId: input.businessId,
          dedupeKey,
          archivedAt: null,
        },
      });

      if (existing) {
        const merged = await tx.lead.update({
          where: { id: existing.id },
          data: {
            fullName: existing.fullName || input.fullName,
            phone: existing.phone || input.phone || null,
            email: existing.email || input.email || null,
            note: input.note ? `${existing.note ?? ""}\n${input.note}`.trim() : existing.note,
            ownerId: input.ownerId ?? existing.ownerId,
            statusId: input.statusId ?? existing.statusId,
            metadata: toJsonInput({
              ...((existing.metadata as Record<string, unknown> | null) ?? {}),
              ...(input.metadata ?? {}),
            }),
          },
        });

        await tx.businessEvent.create({
          data: {
            businessId: input.businessId,
            type: "lead.merged",
            actorUserId: input.actorUserId,
            leadId: merged.id,
          },
        });

        return {
          action: "merged" as const,
          leadId: merged.id,
          uid: merged.uid,
        };
      }
    }

    const defaultStatus = await tx.leadStatus.findFirst({
      where: { businessId: input.businessId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const statusId = input.statusId ?? defaultStatus?.id ?? null;
    const created = await tx.lead.create({
      data: {
        businessId: input.businessId,
        source: "manual",
        fullName: input.fullName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        note: input.note ?? null,
        metadata: toJsonInput(input.metadata ?? undefined),
        ownerId: input.ownerId ?? null,
        statusId,
        dedupeKey,
      },
    });

    await tx.businessEvent.create({
      data: {
        businessId: input.businessId,
        type: "lead.created",
        actorUserId: input.actorUserId,
        leadId: created.id,
        payload: {
          source: "manual",
        } as Prisma.InputJsonValue,
      },
    });

    await createDefaultFollowUpTask(tx, {
      businessId: input.businessId,
      leadId: created.id,
      assigneeId: input.ownerId ?? null,
      createdById: input.actorUserId,
    });

    return {
      action: "created" as const,
      leadId: created.id,
      uid: created.uid,
    };
  });

  const lead = await readLeadByUidOrThrow(result.uid, input.businessId);
  return {
    action: result.action,
    lead: toLeadDto(lead),
  };
}

export async function patchLead(input: {
  uid: string;
  businessId: string;
  actorUserId: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  ownerId?: string | null;
  statusId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const existing = await prisma.lead.findFirst({
    where: { uid: input.uid, businessId: input.businessId, archivedAt: null },
  });

  if (!existing) {
    throw new Error("LEAD_NOT_FOUND");
  }

  const lead = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      ...(input.statusId !== undefined ? { statusId: input.statusId } : {}),
      ...(input.metadata !== undefined ? { metadata: toJsonInput(input.metadata) } : {}),
      dedupeKey:
        input.phone !== undefined || input.email !== undefined
          ? buildLeadDedupeKey({
              email: input.email ?? existing.email,
              phone: input.phone ?? existing.phone,
            })
          : existing.dedupeKey,
    },
  });

  await createBusinessEvent({
    businessId: input.businessId,
    type: "lead.updated",
    actorUserId: input.actorUserId,
    leadId: lead.id,
  });

  const hydrated = await readLeadByUidOrThrow(input.uid, input.businessId);
  return toLeadDto(hydrated);
}

export async function archiveLead(uid: string, businessId: string, actorUserId: string) {
  const existing = await prisma.lead.findFirst({
    where: { uid, businessId, archivedAt: null },
  });

  if (!existing) {
    throw new Error("LEAD_NOT_FOUND");
  }

  const archived = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      archivedAt: new Date(),
    },
  });

  await createBusinessEvent({
    businessId,
    type: "lead.archived",
    actorUserId,
    leadId: archived.id,
  });

  return { uid: archived.uid };
}
