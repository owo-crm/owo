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

  await runStep("events stream", async () => {
    const eventsResponse = await requestJson("/api/v1/events?limit=80", {
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

    const acquisition = stats.comparisons.find((item) => item.fieldKey === "acquisitionChannel");
    assert(acquisition, "acquisitionChannel comparison is missing");
    assert(acquisition.winner, "acquisitionChannel comparison winner is missing");
    assert(
      typeof acquisition.winner.share === "number" && acquisition.winner.share >= 0,
      "acquisitionChannel winner share should be numeric",
    );
  });

  console.log("Week3 integration finished successfully.");
}

main().catch((error) => {
  console.error("Week3 integration failed:", error.message);
  process.exit(1);
});
