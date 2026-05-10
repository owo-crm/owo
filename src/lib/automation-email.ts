import { Resend } from "resend";
import type { LeadSource } from "@/generated/prisma/enums";
import { createEmailOutboxRecord, updateEmailOutboxRecord } from "@/lib/storage";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function prettySource(source: LeadSource) {
  return source.replaceAll("_", " ");
}

function ensureResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  if (!resendApiKey || !resendFrom) {
    return null;
  }
  return {
    resend: new Resend(resendApiKey),
    from: resendFrom,
  };
}

export async function sendAutomationTeamAlertEmail(input: {
  businessId: string;
  recipients: string[];
  scenarioId: string;
  scenarioName: string;
  eventType: string;
  lead: {
    uid: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    source: LeadSource;
  } | null;
}) {
  if (input.recipients.length === 0) {
    return {
      status: "skipped" as const,
      message: "No team recipients configured",
    };
  }

  const client = ensureResendClient();
  if (!client) {
    return {
      status: "failed" as const,
      message: "RESEND_NOT_CONFIGURED",
    };
  }

  const subject = input.lead
    ? `OWO Automation: ${input.scenarioName} for ${input.lead.fullName}`
    : `OWO Automation: ${input.scenarioName}`;
  const leadLine = input.lead
    ? [
        `Lead: ${input.lead.fullName}`,
        `Lead UID: ${input.lead.uid}`,
        `Source: ${prettySource(input.lead.source)}`,
        `Email: ${input.lead.email ?? "-"}`,
        `Phone: ${input.lead.phone ?? "-"}`,
      ].join("\n")
    : "Lead: not linked";

  const text = [
    "Automation alert",
    "",
    `Scenario: ${input.scenarioName}`,
    `Event: ${input.eventType}`,
    leadLine,
  ].join("\n");

  const html = `<h2>Automation alert</h2><p><strong>Scenario:</strong> ${escapeHtml(
    input.scenarioName,
  )}<br/><strong>Event:</strong> ${escapeHtml(input.eventType)}</p><p>${escapeHtml(
    leadLine,
  ).replaceAll("\n", "<br/>")}</p>`;

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of input.recipients) {
    const outboxId = await createEmailOutboxRecord({
      direction: "automation_team_alert",
      toAddress: recipient,
      subject,
      payload: {
        email_type: "automation_team_alert",
        business_id: input.businessId,
        scenario_id: input.scenarioId,
        event_type: input.eventType,
        lead_uid: input.lead?.uid ?? null,
      },
    });

    try {
      const response = await client.resend.emails.send({
        from: client.from,
        to: recipient,
        subject,
        text,
        html,
      });

      await updateEmailOutboxRecord(outboxId, {
        status: "sent",
        providerMessageId:
          "id" in response && typeof response.id === "string" ? response.id : null,
      });
      sentCount += 1;
    } catch (error) {
      await updateEmailOutboxRecord(outboxId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
      failedCount += 1;
    }
  }

  if (sentCount === 0) {
    return {
      status: "failed" as const,
      message: failedCount > 0 ? "TEAM_ALERT_SEND_FAILED" : "TEAM_ALERT_NOT_SENT",
    };
  }

  return {
    status: "succeeded" as const,
    message: `Team alerts sent: ${sentCount}`,
  };
}

export async function sendAutomationClientAutoReplyEmail(input: {
  businessId: string;
  recipient: string | null;
  recipientName: string;
  scenarioId: string;
  scenarioName: string;
  eventType: string;
  leadUid: string | null;
}) {
  if (!input.recipient) {
    return {
      status: "skipped" as const,
      message: "Lead has no email address",
    };
  }

  const client = ensureResendClient();
  if (!client) {
    return {
      status: "failed" as const,
      message: "RESEND_NOT_CONFIGURED",
    };
  }

  const subject = "OWO CRM: We received your inquiry";
  const text = [
    `Hi ${input.recipientName},`,
    "",
    "Thanks for contacting us. Your request has been received and assigned.",
    "Our team will follow up shortly.",
    "",
    "OWO CRM Team",
  ].join("\n");

  const html = `<p>Hi ${escapeHtml(
    input.recipientName,
  )},</p><p>Thanks for contacting us. Your request has been received and assigned.<br/>Our team will follow up shortly.</p><p>OWO CRM Team</p>`;

  const outboxId = await createEmailOutboxRecord({
    direction: "automation_client_auto_reply",
    toAddress: input.recipient,
    subject,
    payload: {
      email_type: "automation_client_auto_reply",
      business_id: input.businessId,
      scenario_id: input.scenarioId,
      event_type: input.eventType,
      lead_uid: input.leadUid,
    },
  });

  try {
    const response = await client.resend.emails.send({
      from: client.from,
      to: input.recipient,
      subject,
      text,
      html,
    });

    await updateEmailOutboxRecord(outboxId, {
      status: "sent",
      providerMessageId:
        "id" in response && typeof response.id === "string" ? response.id : null,
    });

    return {
      status: "succeeded" as const,
      message: "Client auto-reply sent",
    };
  } catch (error) {
    await updateEmailOutboxRecord(outboxId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    });
    return {
      status: "failed" as const,
      message: "CLIENT_AUTO_REPLY_FAILED",
    };
  }
}
