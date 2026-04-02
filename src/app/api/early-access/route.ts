import { NextResponse } from "next/server";
import { sendEarlyAccessEmails } from "@/lib/email";
import { persistEarlyAccessSubmission } from "@/lib/storage";

export const runtime = "nodejs";

type RequestBody = {
  language?: string;
  source?: string;
  utm?: Record<string, string>;
  contact?: {
    name?: string;
    email?: string;
    telegram?: string;
    preferredContact?: string;
    consentToContact?: boolean;
  };
  survey?: {
    businessType?: string;
    teamSize?: string;
    currentTools?: string;
    mainPains?: string;
    featurePriorities?: string[];
    preferredWorkspace?: string;
    idealLeadCardNotes?: string;
    preferredStyle?: string;
    willingnessToPay?: string;
    earlyAccessInterest?: string;
  };
};

function isValidPayload(body: RequestBody) {
  const contact = body.contact;
  const survey = body.survey;

  return Boolean(
      body.language &&
      contact?.name?.trim() &&
      contact.email?.trim() &&
      contact.consentToContact &&
      survey?.businessType &&
      survey.teamSize &&
      survey.currentTools?.trim() &&
      survey.mainPains?.trim() &&
      Array.isArray(survey.featurePriorities) &&
      survey.featurePriorities.length > 0 &&
      survey.preferredWorkspace &&
      survey.idealLeadCardNotes?.trim() &&
      survey.preferredStyle?.trim() &&
      survey.willingnessToPay &&
      survey.earlyAccessInterest,
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    const result = await persistEarlyAccessSubmission({
      language: body.language ?? "en",
      source: body.source ?? "landing",
      utm: body.utm ?? {},
      contact: {
        name: body.contact?.name?.trim() ?? "",
        email: body.contact?.email?.trim() ?? "",
        telegram: body.contact?.telegram?.trim() ?? "",
        preferredContact: body.contact?.preferredContact ?? "telegram",
        consentToContact: body.contact?.consentToContact ?? false,
      },
      survey: {
        businessType: body.survey?.businessType ?? "",
        teamSize: body.survey?.teamSize ?? "",
        currentTools: body.survey?.currentTools?.trim() ?? "",
        mainPains: body.survey?.mainPains?.trim() ?? "",
        featurePriorities: body.survey?.featurePriorities ?? [],
        preferredWorkspace: body.survey?.preferredWorkspace ?? "",
        idealLeadCardNotes: body.survey?.idealLeadCardNotes?.trim() ?? "",
        preferredStyle: body.survey?.preferredStyle?.trim() ?? "",
        willingnessToPay: body.survey?.willingnessToPay ?? "",
        earlyAccessInterest: body.survey?.earlyAccessInterest ?? "",
      },
    });

    let email = {
      attempted: false,
      notificationSent: false,
      confirmationSent: false,
    };

    try {
      email = await sendEarlyAccessEmails(
        {
          language: body.language ?? "en",
          source: body.source ?? "landing",
          utm: body.utm ?? {},
          contact: {
            name: body.contact?.name?.trim() ?? "",
            email: body.contact?.email?.trim() ?? "",
            telegram: body.contact?.telegram?.trim() ?? "",
            preferredContact: body.contact?.preferredContact ?? "telegram",
            consentToContact: body.contact?.consentToContact ?? false,
          },
          survey: {
            businessType: body.survey?.businessType ?? "",
            teamSize: body.survey?.teamSize ?? "",
            currentTools: body.survey?.currentTools?.trim() ?? "",
            mainPains: body.survey?.mainPains?.trim() ?? "",
            featurePriorities: body.survey?.featurePriorities ?? [],
            preferredWorkspace: body.survey?.preferredWorkspace ?? "",
            idealLeadCardNotes: body.survey?.idealLeadCardNotes?.trim() ?? "",
            preferredStyle: body.survey?.preferredStyle?.trim() ?? "",
            willingnessToPay: body.survey?.willingnessToPay ?? "",
            earlyAccessInterest: body.survey?.earlyAccessInterest ?? "",
          },
        },
        result.submissionId,
      );
    } catch (error) {
      console.error("Submission saved, but email sending failed", error);
    }

    return NextResponse.json({
      ok: true,
      submissionId: result.submissionId,
      email,
    });
  } catch (error) {
    console.error("Failed to save early access submission", error);

    return NextResponse.json(
      { ok: false, error: "SAVE_FAILED" },
      { status: 500 },
    );
  }
}
