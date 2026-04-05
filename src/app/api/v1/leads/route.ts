import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createManualLead, listLeads } from "@/lib/domain/leads";

export const runtime = "nodejs";

type CreateLeadBody = {
  full_name?: string;
  phone?: string;
  email?: string;
  note?: string;
  owner_id?: string;
  status_id?: string;
  metadata?: Record<string, unknown>;
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const statusId = url.searchParams.get("status_id");
    const ownerId = url.searchParams.get("owner_id");
    const search = url.searchParams.get("search");
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);

    const leads = await listLeads({
      businessId: auth.session.businessId,
      statusId: statusId || null,
      ownerId: ownerId || null,
      search: search || null,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50,
      offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
    });

    return ok({ leads });
  } catch (error) {
    console.error("Failed to list leads", error);
    return fail("LEADS_LIST_FAILED", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as CreateLeadBody;
    const fullName = body.full_name?.trim();

    if (!fullName) {
      return fail("FULL_NAME_REQUIRED", 400);
    }

    const created = await createManualLead({
      businessId: auth.session.businessId,
      actorUserId: auth.session.userId,
      fullName,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      note: body.note?.trim() || null,
      ownerId: body.owner_id ?? null,
      statusId: body.status_id ?? null,
      metadata: body.metadata ?? null,
    });

    return ok(
      {
        action: created.action,
        lead: created.lead,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create lead", error);
    return fail("LEAD_CREATE_FAILED", 500);
  }
}

