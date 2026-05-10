import { Prisma } from "@/generated/prisma/client";
import type { LeadSource } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { buildLeadDedupeKey } from "@/lib/domain/common";
import { triggerAutomationForEvent } from "@/lib/domain/automation";
import { createBusinessEvent } from "@/lib/domain/events";
import { createDefaultFollowUpTask } from "@/lib/domain/tasks";
import type {
  LeadActivityItemDto,
  LeadDetailDto,
  LeadDto,
  LeadNoteItemDto,
  LeadOutcomePoint,
  LeadTaskProgressItemDto,
} from "@/lib/types/domain";

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

function getLeadNoteDelegateOrThrow() {
  const delegate = (prisma as unknown as { leadNote?: unknown }).leadNote as
    | {
        findMany?: (...args: unknown[]) => Promise<unknown>;
        findFirst?: (...args: unknown[]) => Promise<unknown>;
        create?: (...args: unknown[]) => Promise<unknown>;
        update?: (...args: unknown[]) => Promise<unknown>;
        delete?: (...args: unknown[]) => Promise<unknown>;
      }
    | undefined;

  if (
    !delegate ||
    typeof delegate.findMany !== "function" ||
    typeof delegate.findFirst !== "function" ||
    typeof delegate.create !== "function" ||
    typeof delegate.update !== "function" ||
    typeof delegate.delete !== "function"
  ) {
    throw new Error("LEAD_NOTES_NOT_READY");
  }
  return delegate as typeof prisma.leadNote;
}

function toJsonInput(value: Record<string, unknown> | null | undefined) {
  if (value === null) {
    return Prisma.JsonNull;
  }
  if (value === undefined) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

function toLeadDto(
  lead: LeadWithRelations,
  progress?: { completed: number; total: number; percent: number },
): LeadDto {
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
    progress: progress ?? {
      completed: 0,
      total: 0,
      percent: 0,
    },
    created_at: lead.createdAt.toISOString(),
    updated_at: lead.updatedAt.toISOString(),
  };
}

function mapLeadEventToActivity(event: {
  id: string;
  type: string;
  createdAt: Date;
  actorUser: { displayName: string } | null;
  taskId: string | null;
}): LeadActivityItemDto {
  const actor = event.actorUser?.displayName ?? "Team member";
  let text = `${actor} performed ${event.type.replaceAll(".", " ")}`;

  if (event.type === "lead.created") text = `${actor} created this lead`;
  else if (event.type === "lead.updated") text = `${actor} updated lead details`;
  else if (event.type === "lead.archived") text = `${actor} archived this lead`;
  else if (event.type === "lead.merged") text = `${actor} merged duplicate lead`;
  else if (event.type === "lead.note.created") text = `${actor} added a note`;
  else if (event.type === "lead.note.updated") text = `${actor} updated a note`;
  else if (event.type === "lead.note.deleted") text = `${actor} deleted a note`;

  return {
    id: event.id,
    type: event.type,
    text,
    actor_name: event.actorUser?.displayName ?? null,
    created_at: event.createdAt.toISOString(),
    task_id: event.taskId,
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
  const leadIds = leads.map((lead) => lead.id);

  const [allCounts, doneCounts] = await Promise.all([
    prisma.task.groupBy({
      by: ["leadId"],
      where: {
        businessId: input.businessId,
        leadId: { in: leadIds },
      },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["leadId"],
      where: {
        businessId: input.businessId,
        leadId: { in: leadIds },
        doneAt: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const allMap = new Map<string, number>();
  const doneMap = new Map<string, number>();
  for (const row of allCounts) if (row.leadId) allMap.set(row.leadId, row._count._all);
  for (const row of doneCounts) if (row.leadId) doneMap.set(row.leadId, row._count._all);

  return leads.map((lead) => {
    const total = allMap.get(lead.id) ?? 0;
    const completed = doneMap.get(lead.id) ?? 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return toLeadDto(lead as LeadWithRelations, { completed, total, percent });
  });
}

export async function getLeadByUid(uid: string, businessId: string) {
  const lead = await readLeadByUidOrThrow(uid, businessId);
  return toLeadDto(lead);
}

export async function getLeadDetailByUid(input: {
  uid: string;
  businessId: string;
}) {
  const lead = await readLeadByUidOrThrow(input.uid, input.businessId);

  const [tasks, events] = await Promise.all([
    prisma.task.findMany({
      where: {
        businessId: input.businessId,
        leadId: lead.id,
      },
      include: {
        assignee: {
          select: {
            displayName: true,
          },
        },
        createdBy: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.businessEvent.findMany({
      where: {
        businessId: input.businessId,
        leadId: lead.id,
        actorUserId: { not: null },
        NOT: {
          type: {
            startsWith: "task.",
          },
        },
      },
      include: {
        actorUser: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  let leadNotes: Array<{
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    authorUser: { displayName: string } | null;
  }> = [];

  try {
    const leadNote = getLeadNoteDelegateOrThrow();
    leadNotes = await leadNote.findMany({
      where: {
        businessId: input.businessId,
        leadId: lead.id,
      },
      include: {
        authorUser: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    console.warn("leadNote lookup failed in getLeadDetailByUid, fallback to empty notes", error);
  }

  const doneTasks = tasks.filter((task) => task.doneAt !== null).length;
  const allTasks = tasks.length;
  const progressPercent = allTasks > 0 ? Math.round((doneTasks / allTasks) * 100) : 0;

  const sortedProgressTasks = [...tasks].sort((a, b) => {
    const aOpen = a.doneAt === null;
    const bOpen = b.doneAt === null;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    if (aOpen && bOpen) return b.createdAt.getTime() - a.createdAt.getTime();
    return (b.doneAt?.getTime() ?? 0) - (a.doneAt?.getTime() ?? 0);
  });

  const progressTasks: LeadTaskProgressItemDto[] = sortedProgressTasks.map((task) => ({
    id: task.id,
    title: task.title,
    note: task.note,
    due_at: task.dueAt ? task.dueAt.toISOString() : null,
    done_at: task.doneAt ? task.doneAt.toISOString() : null,
    assignee_name: task.assignee?.displayName ?? null,
    created_by_name: task.createdBy?.displayName ?? null,
    created_at: task.createdAt.toISOString(),
  }));

  const latestActivities: LeadActivityItemDto[] = events.map(mapLeadEventToActivity);

  const notes: LeadNoteItemDto[] = leadNotes.map((note) => ({
    id: note.id,
    source: "lead_note",
    text: note.text,
    author_name: note.authorUser?.displayName ?? null,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  }));

  const result: LeadDetailDto = {
    lead: toLeadDto(lead),
    progress: {
      completed: doneTasks,
      total: allTasks,
      percent: progressPercent,
    },
    tasks: progressTasks,
    latest_activities: latestActivities,
    notes,
  };

  return result;
}

export async function listLeadNotes(input: { uid: string; businessId: string }) {
  const lead = await prisma.lead.findFirst({
    where: { uid: input.uid, businessId: input.businessId, archivedAt: null },
    select: { id: true },
  });

  if (!lead) throw new Error("LEAD_NOT_FOUND");

  let notes: Array<{
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    authorUser: { displayName: string } | null;
  }>;
  try {
    const leadNote = getLeadNoteDelegateOrThrow();
    notes = await leadNote.findMany({
      where: { businessId: input.businessId, leadId: lead.id },
      include: { authorUser: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      throw new Error("LEAD_NOTES_NOT_READY");
    }
    throw error;
  }

  return notes.map<LeadNoteItemDto>((note) => ({
    id: note.id,
    source: "lead_note",
    text: note.text,
    author_name: note.authorUser?.displayName ?? null,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  }));
}

export async function createLeadNote(input: {
  uid: string;
  businessId: string;
  actorUserId: string;
  text: string;
}) {
  const lead = await prisma.lead.findFirst({
    where: { uid: input.uid, businessId: input.businessId, archivedAt: null },
    select: { id: true },
  });
  if (!lead) throw new Error("LEAD_NOT_FOUND");

  let note: {
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    authorUser: { displayName: string } | null;
  };
  try {
    const leadNote = getLeadNoteDelegateOrThrow();
    note = await leadNote.create({
      data: {
        businessId: input.businessId,
        leadId: lead.id,
        authorUserId: input.actorUserId,
        text: input.text,
      },
      include: { authorUser: { select: { displayName: true } } },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOTES_NOT_READY") {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes("create")) {
      throw new Error("LEAD_NOTES_NOT_READY");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        throw new Error("LEAD_NOTES_NOT_READY");
      }
      if (error.code === "P2003") {
        throw new Error("INVALID_AUTHOR");
      }
    }
    throw error;
  }

  await createBusinessEvent({
    businessId: input.businessId,
    type: "lead.note.created",
    actorUserId: input.actorUserId,
    leadId: lead.id,
    payload: { note_id: note.id },
  });

  return {
    id: note.id,
    source: "lead_note" as const,
    text: note.text,
    author_name: note.authorUser?.displayName ?? null,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  };
}

export async function patchLeadNote(input: {
  uid: string;
  noteId: string;
  businessId: string;
  actorUserId: string;
  text: string;
}) {
  const lead = await prisma.lead.findFirst({
    where: { uid: input.uid, businessId: input.businessId, archivedAt: null },
    select: { id: true },
  });
  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const leadNote = getLeadNoteDelegateOrThrow();
  const existing = await leadNote.findFirst({
    where: { id: input.noteId, businessId: input.businessId, leadId: lead.id },
    select: { id: true },
  });
  if (!existing) throw new Error("LEAD_NOTE_NOT_FOUND");

  let note: {
    id: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
    authorUser: { displayName: string } | null;
  };
  try {
    note = await leadNote.update({
      where: { id: existing.id },
      data: { text: input.text, authorUserId: input.actorUserId },
      include: { authorUser: { select: { displayName: true } } },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") throw new Error("LEAD_NOTES_NOT_READY");
      if (error.code === "P2003") throw new Error("INVALID_AUTHOR");
    }
    throw error;
  }

  await createBusinessEvent({
    businessId: input.businessId,
    type: "lead.note.updated",
    actorUserId: input.actorUserId,
    leadId: lead.id,
    payload: { note_id: note.id },
  });

  return {
    id: note.id,
    source: "lead_note" as const,
    text: note.text,
    author_name: note.authorUser?.displayName ?? null,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  };
}

export async function deleteLeadNote(input: {
  uid: string;
  noteId: string;
  businessId: string;
  actorUserId: string;
}) {
  const lead = await prisma.lead.findFirst({
    where: { uid: input.uid, businessId: input.businessId, archivedAt: null },
    select: { id: true },
  });
  if (!lead) throw new Error("LEAD_NOT_FOUND");

  const leadNote = getLeadNoteDelegateOrThrow();
  const existing = await leadNote.findFirst({
    where: { id: input.noteId, businessId: input.businessId, leadId: lead.id },
    select: { id: true },
  });
  if (!existing) throw new Error("LEAD_NOTE_NOT_FOUND");

  try {
    await leadNote.delete({ where: { id: existing.id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      throw new Error("LEAD_NOTES_NOT_READY");
    }
    throw error;
  }

  await createBusinessEvent({
    businessId: input.businessId,
    type: "lead.note.deleted",
    actorUserId: input.actorUserId,
    leadId: lead.id,
    payload: { note_id: existing.id },
  });

  return { id: existing.id };
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
          automationEvent: null,
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

    const leadCreatedEvent = await tx.businessEvent.create({
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
      automationEvent: {
        id: leadCreatedEvent.id,
        businessId: input.businessId,
        type: "lead.created",
        actorUserId: input.actorUserId,
        leadId: created.id,
        taskId: null,
        payload: {
          source: "manual",
        },
      },
    };
  });

  if (result.automationEvent) {
    try {
      await triggerAutomationForEvent(result.automationEvent);
    } catch (error) {
      console.error("Automation trigger failed after lead create", error);
    }
  }

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
  const nextStatusId =
    input.statusId !== undefined ? input.statusId : existing.statusId;
  const statusChanged = nextStatusId !== existing.statusId;

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
    payload: {
      status_changed: statusChanged,
    },
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

function startOfOutcomePeriod(period: "weekly" | "monthly") {
  const now = new Date();
  if (period === "weekly") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 41, 0, 0, 0, 0);
  }
  return new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
}

function buildOutcomeBuckets(period: "weekly" | "monthly") {
  const now = new Date();
  const buckets: LeadOutcomePoint[] = [];

  if (period === "weekly") {
    for (let offset = 5; offset >= 0; offset -= 1) {
      const weekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset * 7);
      buckets.push({
        period: formatOutcomeBucket(weekDate, period),
        won: 0,
        lost: 0,
      });
    }
    return buckets;
  }

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      period: formatOutcomeBucket(monthDate, period),
      won: 0,
      lost: 0,
    });
  }
  return buckets;
}

function formatOutcomeBucket(date: Date, period: "weekly" | "monthly") {
  if (period === "weekly") {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - firstDay.getTime()) / 86_400_000) + 1;
    const week = Math.ceil(dayOfYear / 7);
    return `W${week}`;
  }
  return date.toLocaleDateString("en-US", { month: "short" });
}

export async function getLeadOutcomesSeries(input: {
  businessId: string;
  period: "weekly" | "monthly";
}) {
  const from = startOfOutcomePeriod(input.period);
  const leads = await prisma.lead.findMany({
    where: {
      businessId: input.businessId,
      archivedAt: null,
      updatedAt: { gte: from },
      status: {
        is: {
          OR: [{ isWon: true }, { isLost: true }],
        },
      },
    },
    select: {
      updatedAt: true,
      status: {
        select: {
          isWon: true,
          isLost: true,
        },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const buckets = new Map<string, { won: number; lost: number }>(
    buildOutcomeBuckets(input.period).map((bucket) => [bucket.period, { won: 0, lost: 0 }]),
  );

  for (const lead of leads) {
    const key = formatOutcomeBucket(lead.updatedAt, input.period);
    const bucket = buckets.get(key) ?? { won: 0, lost: 0 };
    if (lead.status?.isWon) bucket.won += 1;
    if (lead.status?.isLost) bucket.lost += 1;
    buckets.set(key, bucket);
  }

  const series = Array.from(buckets.entries()).map<LeadOutcomePoint>(([periodKey, counts]) => ({
    period: periodKey,
    won: counts.won,
    lost: counts.lost,
  }));

  return series;
}
