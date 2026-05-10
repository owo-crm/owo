import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { triggerAutomationForEvent } from "@/lib/domain/automation";

export async function createBusinessEvent(input: {
  businessId: string;
  type: string;
  actorUserId?: string | null;
  leadId?: string | null;
  taskId?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  const event = await prisma.businessEvent.create({
    data: {
      businessId: input.businessId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      leadId: input.leadId ?? null,
      taskId: input.taskId ?? null,
      payload: (input.payload as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });

  try {
    await triggerAutomationForEvent({
      id: event.id,
      businessId: event.businessId,
      type: event.type,
      actorUserId: event.actorUserId,
      leadId: event.leadId,
      taskId: event.taskId,
      payload: (event.payload as Record<string, unknown> | null) ?? null,
    });
  } catch (error) {
    console.error("Automation trigger failed for business event", error);
  }

  return event;
}
