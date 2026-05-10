import { fail, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/api/session";
import { createAutomationScenario, listAutomationScenarios } from "@/lib/domain/automation";

export const runtime = "nodejs";

type CreateScenarioBody = {
  key?: string;
  name?: string;
  trigger_type?: string;
  is_active?: boolean;
  config?: unknown;
};

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const scenarios = await listAutomationScenarios(auth.session.businessId);
    return ok({ scenarios });
  } catch (error) {
    console.error("Failed to list automation scenarios", error);
    return fail("AUTOMATION_SCENARIOS_READ_FAILED", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = (await request.json()) as CreateScenarioBody;
    const key = body.key?.trim();
    const name = body.name?.trim();
    const triggerType = body.trigger_type?.trim();

    if (!key) return fail("KEY_REQUIRED", 400);
    if (!name) return fail("NAME_REQUIRED", 400);
    if (!triggerType) return fail("TRIGGER_TYPE_REQUIRED", 400);

    const scenario = await createAutomationScenario({
      businessId: auth.session.businessId,
      key,
      name,
      triggerType,
      isActive: body.is_active,
      config: body.config,
    });

    return ok({ scenario }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_TRIGGER_TYPE") {
      return fail("INVALID_TRIGGER_TYPE", 400);
    }
    if (error instanceof Error && error.message === "SCENARIO_KEY_EXISTS") {
      return fail("SCENARIO_KEY_EXISTS", 409);
    }
    if (error instanceof Error && error.message === "TOO_MANY_CONDITIONS") {
      return fail("TOO_MANY_CONDITIONS", 400);
    }
    if (error instanceof Error && error.message === "ACTION_REQUIRED") {
      return fail("ACTION_REQUIRED", 400);
    }
    console.error("Failed to create automation scenario", error);
    return fail("AUTOMATION_SCENARIO_CREATE_FAILED", 500);
  }
}
