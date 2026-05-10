import { Prisma } from "@/generated/prisma/client";
import type { LeadSource } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { sendAutomationClientAutoReplyEmail, sendAutomationTeamAlertEmail } from "@/lib/automation-email";
import type {
  AutomationActionDto,
  AutomationActionType,
  AutomationRunDto,
  AutomationScenarioConfigDto,
  AutomationScenarioDto,
  AutomationTestRunResultDto,
  AutomationTriggerType,
} from "@/lib/types/domain";

type AutomationEventContext = {
  id?: string;
  businessId: string;
  type: string;
  actorUserId?: string | null;
  leadId?: string | null;
  taskId?: string | null;
  payload?: Record<string, unknown> | null;
};

type LeadContext = {
  id: string;
  uid: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  ownerId: string | null;
  statusId: string | null;
} | null;

type RunStatus = "succeeded" | "failed" | "skipped";

const SUPPORTED_TRIGGERS: AutomationTriggerType[] = [
  "lead.created",
  "lead.updated",
  "lead.note.created",
  "lead.note.updated",
  "lead.note.deleted",
  "task.created",
  "task.done",
];

const SUPPORTED_ACTIONS: AutomationActionType[] = [
  "assign_owner",
  "create_follow_up_task",
  "send_team_alert_email",
  "send_client_auto_reply_email",
];

const DEFAULT_SCENARIOS: Array<{
  key: string;
  name: string;
  triggerType: AutomationTriggerType;
  config: AutomationScenarioConfigDto;
}> = [
  {
    key: "new_lead_assign_owner",
    name: "New lead: assign owner",
    triggerType: "lead.created",
    config: {
      conditions: {
        only_if_unassigned: true,
      },
      actions: [
        {
          type: "assign_owner",
          policy: "round_robin",
        },
      ],
      state: {
        round_robin_cursor: 0,
      },
    },
  },
  {
    key: "new_lead_create_follow_up_task",
    name: "New lead: create follow-up task",
    triggerType: "lead.created",
    config: {
      actions: [
        {
          type: "create_follow_up_task",
        },
      ],
    },
  },
  {
    key: "new_lead_team_alert",
    name: "New lead: team alert email",
    triggerType: "lead.created",
    config: {
      actions: [
        {
          type: "send_team_alert_email",
        },
      ],
    },
  },
  {
    key: "new_lead_client_auto_reply",
    name: "New lead: client auto-reply",
    triggerType: "lead.created",
    config: {
      conditions: {
        only_if_lead_has_email: true,
      },
      actions: [
        {
          type: "send_client_auto_reply_email",
        },
      ],
    },
  },
  {
    key: "lead_status_changed_team_alert",
    name: "Lead status changed: team alert email",
    triggerType: "lead.updated",
    config: {
      conditions: {
        only_if_status_changed: true,
      },
      actions: [
        {
          type: "send_team_alert_email",
        },
      ],
    },
  },
];

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function isSupportedTrigger(value: string): value is AutomationTriggerType {
  return SUPPORTED_TRIGGERS.includes(value as AutomationTriggerType);
}

function normalizeAction(value: unknown): AutomationActionDto | null {
  const object = asObject(value);
  const type = typeof object.type === "string" ? object.type : "";
  if (!SUPPORTED_ACTIONS.includes(type as AutomationActionType)) {
    return null;
  }
  const action: AutomationActionDto = {
    type: type as AutomationActionType,
  };
  if (typeof object.policy === "string" && (object.policy === "round_robin" || object.policy === "fixed_owner")) {
    action.policy = object.policy;
  }
  if (typeof object.fixed_owner_id === "string" || object.fixed_owner_id === null) {
    action.fixed_owner_id = object.fixed_owner_id;
  }
  return action;
}

function normalizeScenarioConfig(value: unknown): AutomationScenarioConfigDto {
  const object = asObject(value);
  const conditionsRaw = asObject(object.conditions);
  const conditions = {
    only_if_unassigned:
      typeof conditionsRaw.only_if_unassigned === "boolean"
        ? conditionsRaw.only_if_unassigned
        : undefined,
    only_if_lead_has_email:
      typeof conditionsRaw.only_if_lead_has_email === "boolean"
        ? conditionsRaw.only_if_lead_has_email
        : undefined,
    only_if_status_changed:
      typeof conditionsRaw.only_if_status_changed === "boolean"
        ? conditionsRaw.only_if_status_changed
        : undefined,
  };

  const actionsRaw = Array.isArray(object.actions) ? object.actions : [];
  const actions = actionsRaw
    .map(normalizeAction)
    .filter((item): item is AutomationActionDto => Boolean(item));

  const stateRaw = asObject(object.state);
  const state = {
    round_robin_cursor:
      typeof stateRaw.round_robin_cursor === "number" && Number.isFinite(stateRaw.round_robin_cursor)
        ? Math.max(0, Math.floor(stateRaw.round_robin_cursor))
        : undefined,
  };

  return {
    conditions,
    actions: actions.length > 0 ? actions : [{ type: "send_team_alert_email" }],
    state,
  };
}

function countEnabledConditions(config: AutomationScenarioConfigDto) {
  return [
    config.conditions?.only_if_unassigned,
    config.conditions?.only_if_lead_has_email,
    config.conditions?.only_if_status_changed,
  ].filter(Boolean).length;
}

function assertScenarioGuardrails(config: AutomationScenarioConfigDto) {
  if (countEnabledConditions(config) > 2) {
    throw new Error("TOO_MANY_CONDITIONS");
  }
  if (!config.actions.length) {
    throw new Error("ACTION_REQUIRED");
  }
}

function toRunDto(run: {
  id: string;
  businessId: string;
  scenarioId: string;
  eventType: string;
  runKey: string;
  status: RunStatus;
  error: string | null;
  createdAt: Date;
  lead: { uid: string } | null;
}): AutomationRunDto {
  return {
    id: run.id,
    business_id: run.businessId,
    scenario_id: run.scenarioId,
    event_type: run.eventType,
    lead_uid: run.lead?.uid ?? null,
    run_key: run.runKey,
    status: run.status,
    error: run.error,
    created_at: run.createdAt.toISOString(),
  };
}

function toScenarioDto(
  scenario: {
    id: string;
    businessId: string;
    key: string;
    name: string;
    triggerType: string;
    isActive: boolean;
    configJson: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
  lastRun: AutomationRunDto | null,
): AutomationScenarioDto {
  return {
    id: scenario.id,
    business_id: scenario.businessId,
    key: scenario.key,
    name: scenario.name,
    trigger_type: scenario.triggerType as AutomationTriggerType,
    is_active: scenario.isActive,
    config: normalizeScenarioConfig(scenario.configJson),
    created_at: scenario.createdAt.toISOString(),
    updated_at: scenario.updatedAt.toISOString(),
    last_run: lastRun,
  };
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

async function resolveLeadContext(leadId: string | null | undefined) {
  if (!leadId) return null;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      uid: true,
      fullName: true,
      email: true,
      phone: true,
      source: true,
      ownerId: true,
      statusId: true,
    },
  });
  return lead;
}

function getEventPayloadValue<T>(payload: Record<string, unknown> | null | undefined, key: string): T | undefined {
  if (!payload) return undefined;
  if (!(key in payload)) return undefined;
  return payload[key] as T;
}

function evaluateScenario(
  config: AutomationScenarioConfigDto,
  context: { event: AutomationEventContext; lead: LeadContext },
) {
  if (config.conditions?.only_if_unassigned && context.lead?.ownerId) {
    return { matched: false, reason: "Lead already assigned" } as const;
  }
  if (config.conditions?.only_if_lead_has_email && !context.lead?.email) {
    return { matched: false, reason: "Lead has no email" } as const;
  }
  if (config.conditions?.only_if_status_changed) {
    const statusChanged = getEventPayloadValue<boolean>(context.event.payload, "status_changed");
    if (statusChanged !== true) {
      return { matched: false, reason: "Lead status did not change" } as const;
    }
  }
  return { matched: true, reason: null } as const;
}

function actionPreview(action: AutomationActionDto) {
  if (action.type === "assign_owner") {
    if (action.policy === "fixed_owner" && action.fixed_owner_id) {
      return "Assign owner (fixed owner)";
    }
    return "Assign owner (round robin)";
  }
  if (action.type === "create_follow_up_task") return "Create follow-up task";
  if (action.type === "send_team_alert_email") return "Send team alert email";
  if (action.type === "send_client_auto_reply_email") return "Send client auto-reply email";
  return action.type;
}

async function recordRun(input: {
  businessId: string;
  scenarioId: string;
  eventType: string;
  leadId?: string | null;
  eventId?: string | null;
  runKey: string;
  status: RunStatus;
  error?: string | null;
}) {
  try {
    await prisma.automationRun.create({
      data: {
        businessId: input.businessId,
        scenarioId: input.scenarioId,
        eventType: input.eventType,
        leadId: input.leadId ?? null,
        eventId: input.eventId ?? null,
        runKey: input.runKey,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }
    throw error;
  }
}

async function executeAssignOwnerAction(input: {
  scenario: { id: string; configJson: unknown };
  action: AutomationActionDto;
  context: { event: AutomationEventContext; lead: LeadContext };
}) {
  if (!input.context.lead) {
    return { status: "skipped" as const, message: "No lead context" };
  }

  if (input.context.lead.ownerId) {
    return { status: "skipped" as const, message: "Lead already has owner" };
  }

  const members = await prisma.businessMember.findMany({
    where: { businessId: input.context.event.businessId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!members.length) {
    return { status: "skipped" as const, message: "No team members available" };
  }

  let nextOwnerId: string | null = null;

  if (input.action.policy === "fixed_owner" && input.action.fixed_owner_id) {
    const fixed = members.find((member) => member.userId === input.action.fixed_owner_id);
    if (!fixed) {
      return { status: "failed" as const, message: "Fixed owner not found in business team" };
    }
    nextOwnerId = fixed.userId;
  } else {
    const config = normalizeScenarioConfig(input.scenario.configJson);
    const currentCursor = config.state?.round_robin_cursor ?? 0;
    const index = currentCursor % members.length;
    nextOwnerId = members[index]?.userId ?? null;
    const nextCursor = (currentCursor + 1) % members.length;
    const nextConfig = {
      ...config,
      state: {
        ...config.state,
        round_robin_cursor: nextCursor,
      },
    };
    await prisma.automationScenario.update({
      where: { id: input.scenario.id },
      data: {
        configJson: asJson(nextConfig),
      },
    });
  }

  if (!nextOwnerId) {
    return { status: "skipped" as const, message: "No owner selected" };
  }

  await prisma.lead.update({
    where: { id: input.context.lead.id },
    data: { ownerId: nextOwnerId },
  });

  await prisma.businessEvent.create({
    data: {
      businessId: input.context.event.businessId,
      type: "lead.updated",
      actorUserId: null,
      leadId: input.context.lead.id,
      payload: asJson({
        status_changed: false,
        owner_assigned_by_automation: true,
      }),
    },
  });

  return { status: "succeeded" as const, message: "Owner assigned" };
}

async function executeCreateFollowUpTaskAction(input: {
  context: { event: AutomationEventContext; lead: LeadContext };
}) {
  if (!input.context.lead) {
    return { status: "skipped" as const, message: "No lead context" };
  }

  const business = await prisma.business.findUnique({
    where: { id: input.context.event.businessId },
    select: {
      followUpTaskTitle: true,
      followUpTaskDueHours: true,
    },
  });

  const title = business?.followUpTaskTitle?.trim() || "Follow up lead";
  const dueHours = business?.followUpTaskDueHours ?? 24;
  const dueAt = new Date(Date.now() + dueHours * 60 * 60 * 1000);

  const existingTask = await prisma.task.findFirst({
    where: {
      businessId: input.context.event.businessId,
      leadId: input.context.lead.id,
      doneAt: null,
      title,
    },
    select: { id: true },
  });

  if (existingTask) {
    return { status: "skipped" as const, message: "Follow-up task already exists" };
  }

  const task = await prisma.task.create({
    data: {
      businessId: input.context.event.businessId,
      leadId: input.context.lead.id,
      createdById: input.context.event.actorUserId ?? null,
      title,
      dueAt,
      note: "Auto-created by scenario",
    },
    select: {
      id: true,
    },
  });

  await prisma.businessEvent.create({
    data: {
      businessId: input.context.event.businessId,
      type: "task.created",
      actorUserId: input.context.event.actorUserId ?? null,
      leadId: input.context.lead.id,
      taskId: task.id,
      payload: asJson({
        title,
        due_at: dueAt.toISOString(),
        automation: true,
      }),
    },
  });

  return { status: "succeeded" as const, message: "Follow-up task created" };
}

async function resolveTeamAlertRecipients(businessId: string) {
  const members = await prisma.businessMember.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const recipients = Array.from(
    new Set(
      members
        .map((member) => member.user.email?.trim().toLowerCase() ?? "")
        .filter((value) => value.length > 0),
    ),
  );

  if (recipients.length > 0) {
    return recipients;
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { businessId },
    select: { emailAddress: true },
  });

  if (settings?.emailAddress?.trim()) {
    return [settings.emailAddress.trim().toLowerCase()];
  }

  return [];
}

async function executeScenarioActions(input: {
  scenario: {
    id: string;
    name: string;
    configJson: unknown;
  };
  config: AutomationScenarioConfigDto;
  context: { event: AutomationEventContext; lead: LeadContext };
}) {
  const statuses: Array<"succeeded" | "skipped"> = [];
  const messages: string[] = [];

  for (const action of input.config.actions) {
    if (action.type === "assign_owner") {
      const result = await executeAssignOwnerAction({
        scenario: input.scenario,
        action,
        context: input.context,
      });
      if (result.status === "failed") throw new Error(result.message);
      statuses.push(result.status);
      messages.push(result.message);
      continue;
    }

    if (action.type === "create_follow_up_task") {
      const result = await executeCreateFollowUpTaskAction({
        context: input.context,
      });
      statuses.push(result.status);
      messages.push(result.message);
      continue;
    }

    if (action.type === "send_team_alert_email") {
      const recipients = await resolveTeamAlertRecipients(input.context.event.businessId);
      const result = await sendAutomationTeamAlertEmail({
        businessId: input.context.event.businessId,
        recipients,
        scenarioId: input.scenario.id,
        scenarioName: input.scenario.name,
        eventType: input.context.event.type,
        lead: input.context.lead
          ? {
              uid: input.context.lead.uid,
              fullName: input.context.lead.fullName,
              email: input.context.lead.email,
              phone: input.context.lead.phone,
              source: input.context.lead.source,
            }
          : null,
      });
      if (result.status === "failed") throw new Error(result.message);
      statuses.push(result.status);
      messages.push(result.message);
      continue;
    }

    if (action.type === "send_client_auto_reply_email") {
      const result = await sendAutomationClientAutoReplyEmail({
        businessId: input.context.event.businessId,
        recipient: input.context.lead?.email ?? null,
        recipientName: input.context.lead?.fullName ?? "there",
        scenarioId: input.scenario.id,
        scenarioName: input.scenario.name,
        eventType: input.context.event.type,
        leadUid: input.context.lead?.uid ?? null,
      });
      if (result.status === "failed") throw new Error(result.message);
      statuses.push(result.status);
      messages.push(result.message);
      continue;
    }
  }

  if (statuses.length === 0 || statuses.every((status) => status === "skipped")) {
    return { status: "skipped" as const, error: messages.join("; ") || "No actions executed" };
  }

  return { status: "succeeded" as const, error: null };
}

export async function ensureDefaultAutomationScenarios(businessId: string) {
  for (const scenario of DEFAULT_SCENARIOS) {
    await prisma.automationScenario.upsert({
      where: {
        businessId_key: {
          businessId,
          key: scenario.key,
        },
      },
      create: {
        businessId,
        key: scenario.key,
        name: scenario.name,
        triggerType: scenario.triggerType,
        isActive: true,
        configJson: asJson(scenario.config),
      },
      update: {},
    });
  }
}

export async function loadActiveScenarios(businessId: string, eventType: string) {
  return prisma.automationScenario.findMany({
    where: {
      businessId,
      triggerType: eventType,
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listAutomationScenarios(businessId: string) {
  await ensureDefaultAutomationScenarios(businessId);

  const scenarios = await prisma.automationScenario.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });

  const scenarioIds = scenarios.map((scenario) => scenario.id);
  const runs = scenarioIds.length
    ? await prisma.automationRun.findMany({
        where: {
          businessId,
          scenarioId: { in: scenarioIds },
        },
        include: {
          lead: {
            select: { uid: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    : [];

  const lastRunByScenario = new Map<string, AutomationRunDto>();
  for (const run of runs) {
    if (!lastRunByScenario.has(run.scenarioId)) {
      lastRunByScenario.set(run.scenarioId, toRunDto(run));
    }
  }

  return scenarios.map((scenario) =>
    toScenarioDto(scenario, lastRunByScenario.get(scenario.id) ?? null),
  );
}

export async function listAutomationRuns(input: {
  businessId: string;
  scenarioId?: string | null;
  limit?: number;
}) {
  const runs = await prisma.automationRun.findMany({
    where: {
      businessId: input.businessId,
      ...(input.scenarioId ? { scenarioId: input.scenarioId } : {}),
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
    take: input.limit ?? 50,
  });

  return runs.map(toRunDto);
}

export async function createAutomationScenario(input: {
  businessId: string;
  key: string;
  name: string;
  triggerType: string;
  isActive?: boolean;
  config?: unknown;
}) {
  if (!isSupportedTrigger(input.triggerType)) {
    throw new Error("INVALID_TRIGGER_TYPE");
  }

  const key = input.key.trim();
  const name = input.name.trim();
  if (!key) throw new Error("KEY_REQUIRED");
  if (!name) throw new Error("NAME_REQUIRED");

  const config = normalizeScenarioConfig(input.config ?? {});
  assertScenarioGuardrails(config);

  try {
    const created = await prisma.automationScenario.create({
      data: {
        businessId: input.businessId,
        key,
        name,
        triggerType: input.triggerType,
        isActive: input.isActive ?? true,
        configJson: asJson(config),
      },
    });
    return toScenarioDto(created, null);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("SCENARIO_KEY_EXISTS");
    }
    throw error;
  }
}

export async function patchAutomationScenario(input: {
  businessId: string;
  id: string;
  name?: string;
  triggerType?: string;
  isActive?: boolean;
  config?: unknown;
}) {
  const existing = await prisma.automationScenario.findFirst({
    where: {
      id: input.id,
      businessId: input.businessId,
    },
  });
  if (!existing) throw new Error("SCENARIO_NOT_FOUND");

  const triggerType = input.triggerType ?? existing.triggerType;
  if (!isSupportedTrigger(triggerType)) {
    throw new Error("INVALID_TRIGGER_TYPE");
  }

  const config = input.config !== undefined
    ? normalizeScenarioConfig(input.config)
    : normalizeScenarioConfig(existing.configJson);
  assertScenarioGuardrails(config);
  const nextName = input.name?.trim();
  if (input.name !== undefined && !nextName) {
    throw new Error("NAME_REQUIRED");
  }

  const updated = await prisma.automationScenario.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: nextName } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.triggerType !== undefined ? { triggerType } : {}),
      ...(input.config !== undefined
        ? { configJson: asJson(config) }
        : {}),
    },
  });

  const latestRun = await prisma.automationRun.findFirst({
    where: { scenarioId: updated.id },
    include: { lead: { select: { uid: true } } },
    orderBy: { createdAt: "desc" },
  });

  return toScenarioDto(updated, latestRun ? toRunDto(latestRun) : null);
}

export async function triggerAutomationForEvent(event: AutomationEventContext) {
  if (!isSupportedTrigger(event.type)) {
    return;
  }

  await ensureDefaultAutomationScenarios(event.businessId);
  const scenarios = await loadActiveScenarios(event.businessId, event.type);

  if (!scenarios.length) {
    return;
  }

  const lead = await resolveLeadContext(event.leadId);

  for (const scenario of scenarios) {
    const config = normalizeScenarioConfig(scenario.configJson);
    const runKey = event.id ?? `manual-${event.type}-${event.leadId ?? "no-lead"}-${Date.now()}`;

    if (event.id) {
      const existingRun = await prisma.automationRun.findFirst({
        where: {
          scenarioId: scenario.id,
          runKey,
        },
        select: { id: true },
      });
      if (existingRun) {
        continue;
      }
    }

    const evaluation = evaluateScenario(config, {
      event,
      lead,
    });

    if (!evaluation.matched) {
      await recordRun({
        businessId: event.businessId,
        scenarioId: scenario.id,
        eventType: event.type,
        leadId: event.leadId ?? null,
        eventId: event.id ?? null,
        runKey,
        status: "skipped",
        error: evaluation.reason,
      });
      continue;
    }

    try {
      const execution = await executeScenarioActions({
        scenario,
        config,
        context: {
          event,
          lead,
        },
      });

      await recordRun({
        businessId: event.businessId,
        scenarioId: scenario.id,
        eventType: event.type,
        leadId: event.leadId ?? null,
        eventId: event.id ?? null,
        runKey,
        status: execution.status,
        error: execution.error,
      });
    } catch (error) {
      await recordRun({
        businessId: event.businessId,
        scenarioId: scenario.id,
        eventType: event.type,
        leadId: event.leadId ?? null,
        eventId: event.id ?? null,
        runKey,
        status: "failed",
        error: error instanceof Error ? error.message : "AUTOMATION_EXECUTION_FAILED",
      });
    }
  }
}

export async function testAutomationScenario(input: {
  businessId: string;
  scenarioId: string;
  leadUid?: string | null;
}) {
  const scenario = await prisma.automationScenario.findFirst({
    where: {
      id: input.scenarioId,
      businessId: input.businessId,
    },
  });

  if (!scenario) throw new Error("SCENARIO_NOT_FOUND");

  const lead = input.leadUid
    ? await prisma.lead.findFirst({
        where: {
          businessId: input.businessId,
          uid: input.leadUid,
          archivedAt: null,
        },
        select: {
          id: true,
          uid: true,
          fullName: true,
          email: true,
          phone: true,
          source: true,
          ownerId: true,
          statusId: true,
        },
      })
    : await prisma.lead.findFirst({
        where: { businessId: input.businessId, archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          uid: true,
          fullName: true,
          email: true,
          phone: true,
          source: true,
          ownerId: true,
          statusId: true,
        },
      });

  const config = normalizeScenarioConfig(scenario.configJson);
  const payload =
    scenario.triggerType === "lead.updated"
      ? { status_changed: true }
      : {};

  const evaluation = evaluateScenario(config, {
    event: {
      id: `dry-run-${Date.now()}`,
      businessId: input.businessId,
      type: scenario.triggerType,
      leadId: lead?.id ?? null,
      payload,
    },
    lead,
  });

  const result: AutomationTestRunResultDto = {
    scenario_id: scenario.id,
    matched: evaluation.matched,
    dry_run: true,
    status: evaluation.matched ? "succeeded" : "skipped",
    reason: evaluation.reason,
    actions_preview: config.actions.map(actionPreview),
  };

  return result;
}
