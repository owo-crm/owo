import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = process.env.WEEK3_BASE_URL ?? "http://127.0.0.1:3000";
const ROOT = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(path, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.ok === false) {
    throw new Error(`[${response.status}] ${path} failed: ${json.error ?? response.statusText}`);
  }

  return json;
}

function readEnvValueFromFile(filename, key) {
  const filePath = join(ROOT, filename);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const envKey = trimmed.slice(0, index).trim();
    if (envKey !== key) continue;
    const rawValue = trimmed.slice(index + 1).trim();
    return rawValue.replace(/^['"]|['"]$/g, "");
  }
  return null;
}

async function runStep(title, fn) {
  await fn();
  console.log(`✓ ${title}`);
}

async function main() {
  console.log(`Week3 integration starting against ${BASE_URL}`);

  const maybeDevBypassToken = process.env.DEV_AUTH_BYPASS_TOKEN;
  const authHeaders = {
    "content-type": "application/json",
    ...(maybeDevBypassToken ? { "x-dev-auth-token": maybeDevBypassToken } : {}),
  };

  let token = "";
  let leadUid = "";
  let taskId = "";
  let stockItemId = "";
  let automationScenarioId = "";

  const unique = Date.now();
  const leadPayload = {
    full_name: `Week3 Lead ${unique}`,
    email: `week3.lead.${unique}@owo.local`,
    phone: `+48${String(unique).slice(-9)}`,
    note: "Created by week3 integration script",
    metadata: {
      source: "week3-e2e",
      attempt: 1,
    },
  };

  await runStep("auth/validate", async () => {
    const auth = await requestJson("/api/v1/auth/validate", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        debug: {
          telegram_id: "week3-e2e-user",
          display_name: "Week3 E2E User",
          email: "week3.e2e@owo.local",
        },
      }),
    });

    token = auth.token;
    assert(typeof token === "string" && token.length > 20, "Auth token was not returned");
  });

  const securedHeaders = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  await runStep("lead create", async () => {
    const createdLeadResponse = await requestJson("/api/v1/leads", {
      method: "POST",
      headers: securedHeaders,
      body: JSON.stringify(leadPayload),
    });
    assert(createdLeadResponse.action === "created", "Lead should be created on first call");
    leadUid = createdLeadResponse.lead?.uid;
    assert(typeof leadUid === "string", "Lead uid missing after create");
  });

  await runStep("lead merge", async () => {
    const mergedLeadResponse = await requestJson("/api/v1/leads", {
      method: "POST",
      headers: securedHeaders,
      body: JSON.stringify({
        ...leadPayload,
        note: "Second send should merge by dedupe key",
        metadata: {
          source: "week3-e2e",
          attempt: 2,
        },
      }),
    });
    assert(mergedLeadResponse.action === "merged", "Lead should merge on duplicate call");
  });

  await runStep("lead patch", async () => {
    const patched = await requestJson(`/api/v1/leads/${leadUid}`, {
      method: "PATCH",
      headers: securedHeaders,
      body: JSON.stringify({
        full_name: `Week3 Lead Patched ${unique}`,
        note: "Patched by integration script",
      }),
    });
    assert(patched.lead?.full_name?.includes("Patched"), "Lead patch did not apply");
  });

  await runStep("lead detail + notes create", async () => {
    const detailBefore = await requestJson(`/api/v1/leads/${leadUid}/detail`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    assert(detailBefore.detail?.lead?.uid === leadUid, "Lead detail uid mismatch");

    const noteText = `Week3 note ${unique}`;
    const noteCreate = await requestJson(`/api/v1/leads/${leadUid}/notes`, {
      method: "POST",
      headers: securedHeaders,
      body: JSON.stringify({ text: noteText }),
    });
    assert(typeof noteCreate.note?.id === "string", "Lead note id missing after create");

    const detailAfter = await requestJson(`/api/v1/leads/${leadUid}/detail`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    assert(
      Array.isArray(detailAfter.detail?.notes) &&
        detailAfter.detail.notes.some((note) => note.text === noteText),
      "Lead detail should include created note",
    );
  });

  await runStep("automation scenarios list", async () => {
    const scenarios = await requestJson("/api/v1/settings/automation/scenarios", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    assert(Array.isArray(scenarios.scenarios), "Automation scenarios list missing");
    assert(scenarios.scenarios.length >= 1, "No automation scenarios available");
    automationScenarioId = scenarios.scenarios[0]?.id;
    assert(
      typeof automationScenarioId === "string" && automationScenarioId.length > 0,
      "Automation scenario id missing",
    );
  });

  await runStep("automation runs after lead create", async () => {
    const runs = await requestJson("/api/v1/settings/automation/runs?limit=80", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    assert(Array.isArray(runs.runs), "Automation runs payload missing");
    assert(
      runs.runs.some((run) => run.event_type === "lead.created"),
      "Expected automation run for lead.created",
    );
  });

  await runStep("automation dry-run", async () => {
    const dryRun = await requestJson(
      `/api/v1/settings/automation/scenarios/${automationScenarioId}/test-run`,
      {
        method: "POST",
        headers: securedHeaders,
        body: JSON.stringify({ lead_uid: leadUid }),
      },
    );
    assert(dryRun.result?.dry_run === true, "Dry-run flag should be true");
    assert(typeof dryRun.result?.matched === "boolean", "Dry-run should return match result");
  });

  await runStep("task create", async () => {
    const taskResponse = await requestJson("/api/v1/tasks", {
      method: "POST",
      headers: securedHeaders,
      body: JSON.stringify({
        title: `Week3 Task ${unique}`,
        lead_uid: leadUid,
      }),
    });
    taskId = taskResponse.task?.id;
    assert(typeof taskId === "string", "Task id missing after create");
  });

  await runStep("task done", async () => {
    const doneResponse = await requestJson(`/api/v1/tasks/${taskId}/done`, {
      method: "POST",
      headers: securedHeaders,
    });
    assert(doneResponse.task?.done_at, "Task done endpoint did not return done task");
  });

  await runStep("team list + create member", async () => {
    const before = await requestJson("/api/v1/team", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    const beforeCount = Array.isArray(before.members) ? before.members.length : 0;

    await requestJson("/api/v1/team/members", {
      method: "POST",
      headers: securedHeaders,
      body: JSON.stringify({
        display_name: `Week3 Team ${unique}`,
        email: `week3.team.${unique}@owo.local`,
        role: "OPERATOR",
      }),
    });

    const after = await requestJson("/api/v1/team", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    const afterCount = Array.isArray(after.members) ? after.members.length : 0;
    assert(afterCount >= beforeCount + 1, "Team member should be added");
  });

  await runStep("stock create + patch", async () => {
    const create = await requestJson("/api/v1/stock/items", {
      method: "POST",
      headers: securedHeaders,
      body: JSON.stringify({
        sku: `WK3-${String(unique).slice(-6)}`,
        name: `Week3 SKU ${unique}`,
        category: "Services",
        qty: 4,
        min_qty: 2,
        price: 199,
      }),
    });
    stockItemId = create.item?.id;
    assert(typeof stockItemId === "string", "Stock item id missing");

    const patched = await requestJson(`/api/v1/stock/items/${stockItemId}`, {
      method: "PATCH",
      headers: securedHeaders,
      body: JSON.stringify({
        qty: 7,
        price: 249,
      }),
    });
    assert(patched.item?.qty === 7, "Stock item qty patch failed");
    assert(Number(patched.item?.price) === 249, "Stock item price patch failed");
  });

  await runStep("settings read + patch", async () => {
    const read = await requestJson("/api/v1/settings", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    assert(read.settings?.company_name, "Settings read failed");

    const patched = await requestJson("/api/v1/settings", {
      method: "PATCH",
      headers: securedHeaders,
      body: JSON.stringify({
        company_name: `OWO Week3 ${unique}`,
        language: "English",
        notifications: {
          email_alerts: true,
          push_alerts: false,
          task_reminders: true,
        },
      }),
    });
    assert(patched.settings?.company_name === `OWO Week3 ${unique}`, "Settings patch failed");
    assert(
      patched.settings?.notifications?.push_alerts === false,
      "Settings patch notifications failed",
    );
  });

  await runStep("events stream", async () => {
    const eventsResponse = await requestJson("/api/v1/events?limit=100", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });

    const eventTypes = new Set((eventsResponse.events ?? []).map((event) => event.type));
    assert(eventTypes.has("lead.created") || eventTypes.has("lead.merged"), "Lead events missing");
    assert(eventTypes.has("task.done"), "task.done event missing");
  });

  await runStep("ingest website_form idempotency", async () => {
    const payload = {
      full_name: `Ingest Website ${unique}`,
      email: `ingest.website.${unique}@owo.local`,
      external_id: `website-${unique}`,
    };
    const first = await requestJson("/api/v1/ingest/website-form/owo-demo-website-form", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert(first.action === "created" || first.action === "merged", "First website ingest failed");

    const second = await requestJson("/api/v1/ingest/website-form/owo-demo-website-form", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert(second.action === "idempotent", "Second website ingest should be idempotent");
  });

  await runStep("ingest api idempotency", async () => {
    const payload = {
      full_name: `Ingest API ${unique}`,
      email: `ingest.api.${unique}@owo.local`,
      external_id: `api-${unique}`,
    };
    const first = await requestJson("/api/v1/ingest/api/owo-demo-public-api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert(first.action === "created" || first.action === "merged", "First API ingest failed");

    const second = await requestJson("/api/v1/ingest/api/owo-demo-public-api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert(second.action === "idempotent", "Second API ingest should be idempotent");
  });

  await runStep("early-access submit", async () => {
    const response = await requestJson("/api/early-access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        language: "en",
        source: "week3_integration",
        utm: {
          acquisition_channel: "youtube",
          acquisition_other: "",
        },
        contact: {
          name: `Integration User ${unique}`,
          email: `survey.integration.${unique}@owo.local`,
          telegram: "",
          preferredContact: "email",
          consentToContact: true,
        },
        survey: {
          businessType: "agency",
          teamSize: "2_5",
          currentTools: "google_sheets",
          mainPains: "lost_leads",
          featurePriorities: ["task_control"],
          preferredWorkspace: "browser",
          idealLeadCardNotes: "not_collected_v2",
          preferredStyle: "balanced",
          willingnessToPay: "50_100",
          earlyAccessInterest: "asap",
        },
      }),
    });

    assert(typeof response.submissionId === "string", "Survey submit did not return submissionId");
  });

  await runStep("stats filtered query + comparisons", async () => {
    const statsToken =
      process.env.EARLY_ACCESS_STATS_TOKEN ??
      readEnvValueFromFile(".env.local", "EARLY_ACCESS_STATS_TOKEN") ??
      readEnvValueFromFile(".env", "EARLY_ACCESS_STATS_TOKEN");

    const query = new URLSearchParams();
    query.set("language", "en");
    query.set("acquisition_channel", "youtube");
    query.set("business_type", "agency");
    query.set("willingness_to_pay", "50_100");
    if (statsToken) query.set("token", statsToken);

    const stats = await requestJson(`/api/early-access/stats?${query.toString()}`, {
      method: "GET",
    });

    assert(stats.totals?.submissions >= 1, "Filtered stats should include at least one row");
    assert(Array.isArray(stats.comparisons), "Comparisons payload should be present");
    assert(stats.comparisons.length > 0, "Comparisons payload should contain items");
  });

  console.log("Week3 integration finished successfully.");
}

main().catch((error) => {
  console.error("Week3 integration failed:", error.message);
  process.exit(1);
});
