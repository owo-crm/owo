import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { prisma } from "@/lib/db";
import type { BusinessEventDto } from "@/lib/types/domain";

export const runtime = "nodejs";

function toEventDto(event: {
  id: string;
  businessId: string;
  type: string;
  actorUserId: string | null;
  taskId: string | null;
  payload: unknown;
  createdAt: Date;
  lead: { uid: string } | null;
}): BusinessEventDto {
  return {
    id: event.id,
    business_id: event.businessId,
    type: event.type,
    actor_user_id: event.actorUserId,
    lead_uid: event.lead?.uid ?? null,
    task_id: event.taskId,
    payload: (event.payload as Record<string, unknown> | null) ?? null,
    created_at: event.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "100", 10);
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 100;

    const events = await prisma.businessEvent.findMany({
      where: {
        businessId: auth.session.businessId,
      },
      include: {
        lead: {
          select: {
            uid: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: safeLimit,
    });

    return ok({ events: events.map(toEventDto) });
  } catch (error) {
    console.error("Failed to load events", error);
    return fail("EVENTS_LIST_FAILED", 500);
  }
}

