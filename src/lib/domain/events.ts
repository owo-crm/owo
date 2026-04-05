import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function createBusinessEvent(input: {
  businessId: string;
  type: string;
  actorUserId?: string | null;
  leadId?: string | null;
  taskId?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  return prisma.businessEvent.create({
    data: {
      businessId: input.businessId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      leadId: input.leadId ?? null,
      taskId: input.taskId ?? null,
      payload: (input.payload as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}
