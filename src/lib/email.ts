import { Resend } from "resend";
import type { EarlyAccessPayload } from "@/lib/storage";
import { createEmailOutboxRecord, updateEmailOutboxRecord } from "@/lib/storage";

type EmailResult = {
  attempted: boolean;
  notificationSent: boolean;
  confirmationSent: boolean;
};

function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function splitRecipients(raw: string | undefined) {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildNotificationText(payload: EarlyAccessPayload, submissionId: string) {
  const utm = Object.entries(payload.utm)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const priorities =
    payload.survey.featurePriorities.length > 0
      ? payload.survey.featurePriorities.join(", ")
      : "-";

  return [
    `New early access submission (${submissionId})`,
    "",
    `Name: ${payload.contact.name}`,
    `Email: ${payload.contact.email}`,
    `Telegram: ${payload.contact.telegram || "-"}`,
    `Preferred contact: ${payload.contact.preferredContact}`,
    `Language: ${payload.language}`,
    `Source: ${payload.source}`,
    "",
    "Survey:",
    `Business type: ${payload.survey.businessType}`,
    `Team size: ${payload.survey.teamSize}`,
    `Current tools: ${payload.survey.currentTools}`,
    `Main pains: ${payload.survey.mainPains}`,
    `Feature priorities: ${priorities}`,
    `Preferred workspace: ${payload.survey.preferredWorkspace}`,
    `Ideal lead card notes: ${payload.survey.idealLeadCardNotes}`,
    `Preferred style: ${payload.survey.preferredStyle}`,
    `Willingness to pay: ${payload.survey.willingnessToPay}`,
    `Early access interest: ${payload.survey.earlyAccessInterest}`,
    "",
    "UTM:",
    utm || "-",
  ].join("\n");
}

function buildNotificationHtml(payload: EarlyAccessPayload, submissionId: string) {
  const rows = [
    ["Submission ID", submissionId],
    ["Name", payload.contact.name],
    ["Email", payload.contact.email],
    ["Telegram", payload.contact.telegram || "-"],
    ["Preferred contact", payload.contact.preferredContact],
    ["Language", payload.language],
    ["Source", payload.source],
    ["Business type", payload.survey.businessType],
    ["Team size", payload.survey.teamSize],
    ["Current tools", payload.survey.currentTools],
    ["Main pains", payload.survey.mainPains],
    [
      "Feature priorities",
      payload.survey.featurePriorities.length > 0
        ? payload.survey.featurePriorities.join(", ")
        : "-",
    ],
    ["Preferred workspace", payload.survey.preferredWorkspace],
    ["Ideal lead card notes", payload.survey.idealLeadCardNotes],
    ["Preferred style", payload.survey.preferredStyle],
    ["Willingness to pay", payload.survey.willingnessToPay],
    ["Early access interest", payload.survey.earlyAccessInterest],
    [
      "UTM",
      Object.entries(payload.utm)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ") || "-",
    ],
  ];

  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 10px;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 10px;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<h2>New early access submission</h2><table style="border-collapse:collapse;">${body}</table>`;
}

export async function sendEarlyAccessEmails(
  payload: EarlyAccessPayload,
  submissionId: string,
): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  const notifyTo = splitRecipients(process.env.EARLY_ACCESS_NOTIFY_TO);
  const sendConfirmation = parseBoolean(
    process.env.EARLY_ACCESS_SEND_CONFIRMATION,
    true,
  );

  const hasCoreConfig = Boolean(resendApiKey && resendFrom);

  if (!hasCoreConfig) {
    return { attempted: false, notificationSent: false, confirmationSent: false };
  }

  const resend = new Resend(resendApiKey);

  let confirmationSent = false;
  let notificationSent = false;

  if (notifyTo.length > 0) {
    const notificationSubject = `OWO early access: ${payload.contact.name} (${submissionId.slice(0, 8)})`;
    const notificationText = buildNotificationText(payload, submissionId);
    const notificationHtml = buildNotificationHtml(payload, submissionId);

    for (const recipient of notifyTo) {
      const outboxId = await createEmailOutboxRecord({
        submissionId,
        direction: "team_notification",
        toAddress: recipient,
        subject: notificationSubject,
        payload: {
          email_type: "team_notification",
        },
      });

      try {
        const response = await resend.emails.send({
          from: resendFrom!,
          to: recipient,
          subject: notificationSubject,
          text: notificationText,
          html: notificationHtml,
        });

        await updateEmailOutboxRecord(outboxId, {
          status: "sent",
          providerMessageId:
            "id" in response && typeof response.id === "string" ? response.id : null,
        });
        notificationSent = true;
      } catch (error) {
        await updateEmailOutboxRecord(outboxId, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        });
        console.error("Failed to send internal early access notification", error);
      }
    }
  }

  if (sendConfirmation) {
    const language = payload.language === "pl" ? "pl" : "en";
    const subject =
      language === "pl"
        ? "OWO CRM: early access confirmation"
        : "OWO CRM: early access submission confirmation";

    const text =
      language === "pl"
        ? `Dziekujemy za zgloszenie do early access OWO CRM.\n\nSubmission ID: ${submissionId}\nSkontaktujemy sie z Toba po weryfikacji.`
        : `Thanks for joining OWO CRM early access.\n\nSubmission ID: ${submissionId}\nWe will contact you after review.`;

    const outboxId = await createEmailOutboxRecord({
      submissionId,
      direction: "user_confirmation",
      toAddress: payload.contact.email,
      subject,
      payload: {
        email_type: "user_confirmation",
      },
    });

    try {
      const response = await resend.emails.send({
        from: resendFrom!,
        to: payload.contact.email,
        subject,
        text,
        html: `<p>${escapeHtml(text).replaceAll("\n", "<br/>")}</p>`,
      });

      await updateEmailOutboxRecord(outboxId, {
        status: "sent",
        providerMessageId:
          "id" in response && typeof response.id === "string" ? response.id : null,
      });
      confirmationSent = true;
    } catch (error) {
      await updateEmailOutboxRecord(outboxId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
      console.error("Failed to send user early access confirmation", error);
    }
  }

  return { attempted: true, notificationSent, confirmationSent };
}
