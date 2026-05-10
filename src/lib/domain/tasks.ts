import { prisma } from "@/lib/db";
import { createBusinessEvent } from "@/lib/domain/events";
import type { TaskDto } from "@/lib/types/domain";

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

export function toTaskDto(task: {
  id: string;
  businessId: string;
  title: string;
  note: string | null;
  dueAt: Date | null;
  doneAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lead: { uid: string; fullName: string } | null;
  assignee: { id: string; displayName: string } | null;
}): TaskDto {
  return {
    id: task.id,
    business_id: task.businessId,
    lead_uid: task.lead?.uid ?? null,
    lead_name: task.lead?.fullName ?? null,
    title: task.title,
    note: task.note,
    due_at: toIso(task.dueAt),
    done_at: toIso(task.doneAt),
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          display_name: task.assignee.displayName,
        }
      : null,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
}

export async function createTask(input: {
  businessId: string;
  title: string;
  note?: string | null;
  leadId?: string | null;
  assigneeId?: string | null;
  createdById?: string | null;
  dueAt?: Date | null;
}) {
  const task = await prisma.task.create({
    data: {
      businessId: input.businessId,
      title: input.title,
      note: input.note ?? null,
      leadId: input.leadId ?? null,
      assigneeId: input.assigneeId ?? null,
      createdById: input.createdById ?? null,
      dueAt: input.dueAt ?? null,
    },
    include: {
      assignee: {
        select: {
          id: true,
          displayName: true,
        },
      },
      lead: {
        select: {
          uid: true,
          fullName: true,
        },
      },
    },
  });

  await createBusinessEvent({
    businessId: input.businessId,
    type: "task.created",
    actorUserId: input.createdById ?? null,
    leadId: task.leadId,
    taskId: task.id,
    payload: {
      title: task.title,
      due_at: toIso(task.dueAt),
    },
  });

  return toTaskDto(task);
}

export async function createDefaultFollowUpTask(
  tx: Pick<typeof prisma, "business" | "task" | "businessEvent">,
  input: {
    businessId: string;
    leadId: string;
    assigneeId?: string | null;
    createdById?: string | null;
  },
) {
  const business = await tx.business.findUnique({
    where: { id: input.businessId },
    select: {
      followUpTaskTitle: true,
      followUpTaskDueHours: true,
    },
  });

  const title = business?.followUpTaskTitle?.trim() || "Follow up lead";
  const dueHours = business?.followUpTaskDueHours ?? 24;
  const dueAt = new Date(Date.now() + dueHours * 60 * 60 * 1000);

  const task = await tx.task.create({
    data: {
      businessId: input.businessId,
      leadId: input.leadId,
      assigneeId: input.assigneeId ?? null,
      createdById: input.createdById ?? null,
      title,
      dueAt,
    },
  });

  await tx.businessEvent.create({
    data: {
      businessId: input.businessId,
      type: "task.created.default_follow_up",
      actorUserId: input.createdById ?? null,
      leadId: input.leadId,
      taskId: task.id,
      payload: {
        title,
        due_at: dueAt.toISOString(),
      },
    },
  });

  return task;
}

export async function listTasks(input: {
  businessId: string;
  includeDone?: boolean;
  assigneeId?: string | null;
  leadUid?: string | null;
  limit?: number;
}) {
  const tasks = await prisma.task.findMany({
    where: {
      businessId: input.businessId,
      ...(input.includeDone ? {} : { doneAt: null }),
      ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
      ...(input.leadUid
        ? {
            lead: {
              uid: input.leadUid,
            },
          }
        : {}),
    },
    include: {
      assignee: {
        select: {
          id: true,
          displayName: true,
        },
      },
      lead: {
        select: {
          uid: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ doneAt: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: input.limit ?? 100,
  });

  return tasks.map(toTaskDto);
}

export async function patchTask(
  taskId: string,
  businessId: string,
  actorUserId: string,
  patch: {
    title?: string;
    note?: string | null;
    dueAt?: Date | null;
    assigneeId?: string | null;
    leadId?: string | null;
  },
) {
  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      businessId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("TASK_NOT_FOUND");
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.note !== undefined ? { note: patch.note } : {}),
      ...(patch.dueAt !== undefined ? { dueAt: patch.dueAt } : {}),
      ...(patch.assigneeId !== undefined ? { assigneeId: patch.assigneeId } : {}),
      ...(patch.leadId !== undefined ? { leadId: patch.leadId } : {}),
    },
    include: {
      assignee: {
        select: {
          id: true,
          displayName: true,
        },
      },
      lead: {
        select: {
          uid: true,
          fullName: true,
        },
      },
    },
  });

  await createBusinessEvent({
    businessId,
    type: "task.updated",
    actorUserId,
    leadId: task.leadId,
    taskId: task.id,
  });

  return toTaskDto(task);
}

export async function markTaskDone(taskId: string, businessId: string, actorUserId: string) {
  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      businessId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("TASK_NOT_FOUND");
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      doneAt: new Date(),
    },
    include: {
      assignee: {
        select: {
          id: true,
          displayName: true,
        },
      },
      lead: {
        select: {
          uid: true,
          fullName: true,
        },
      },
    },
  });

  await createBusinessEvent({
    businessId,
    type: "task.done",
    actorUserId,
    leadId: task.leadId,
    taskId: task.id,
  });

  return toTaskDto(task);
}
