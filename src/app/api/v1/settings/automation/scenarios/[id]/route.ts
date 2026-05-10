import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { patchAutomationScenario } from "@/lib/domain/automation";

export const runtime = "nodejs";

type PatchScenarioBody = {
  name?: string;
  trigger_type?: string;
  is_active?: boolean;
  config?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id) return fail("SCENARIO_ID_REQUIRED", 400);

  try {
    const body = (await request.json()) as PatchScenarioBody;
    const scenario = await patchAutomationScenario({
      businessId: auth.session.businessId,
      id,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.trigger_type !== undefined ? { triggerType: body.trigger_type } : {}),
      ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
      ...(body.config !== undefined ? { config: body.config } : {}),
    });

    return ok({ scenario });
  } catch (error) {
    if (error instanceof Error && error.message === "SCENARIO_NOT_FOUND") {
      return fail("SCENARIO_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "INVALID_TRIGGER_TYPE") {
      return fail("INVALID_TRIGGER_TYPE", 400);
    }
    if (error instanceof Error && error.message === "TOO_MANY_CONDITIONS") {
      return fail("TOO_MANY_CONDITIONS", 400);
    }
    if (error instanceof Error && error.message === "ACTION_REQUIRED") {
      return fail("ACTION_REQUIRED", 400);
    }
    if (error instanceof Error && error.message === "NAME_REQUIRED") {
      return fail("NAME_REQUIRED", 400);
    }
    console.error("Failed to patch automation scenario", error);
    return fail("AUTOMATION_SCENARIO_PATCH_FAILED", 500);
  }
}
