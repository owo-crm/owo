import { Prisma } from "@/generated/prisma/client";
import type { EmailOutboxStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { SurveyStatsDto } from "@/lib/types/domain";

export type WaitlistSubmission = {
  id: string;
  name: string;
  email: string;
  telegram: string;
  preferredContact: string;
  consentToContact: boolean;
  language: string;
  source: string;
  utm: Record<string, string>;
  createdAt: string;
};

export type SurveyResponse = {
  id: string;
  submissionId: string;
  businessType: string;
  teamSize: string;
  currentTools: string;
  mainPains: string;
  featurePriorities: string[];
  preferredWorkspace: string;
  idealLeadCardNotes: string;
  preferredStyle: string;
  willingnessToPay: string;
  earlyAccessInterest: string;
  createdAt: string;
};

export type EarlyAccessPayload = {
  language: string;
  source: string;
  utm: Record<string, string>;
  contact: {
    name: string;
    email: string;
    telegram: string;
    preferredContact: string;
    consentToContact: boolean;
  };
  survey: Omit<SurveyResponse, "id" | "submissionId" | "createdAt">;
};

export type EarlyAccessStatsFilters = {
  from?: Date | null;
  to?: Date | null;
  language?: string | null;
  acquisitionChannel?: string | null;
  businessType?: string | null;
  willingnessToPay?: string | null;
};

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function parseFeaturePriorities(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : ""))
      .filter((item) => item.length > 0);
  }
  return [];
}

function incrementCount(target: Record<string, number>, value: string) {
  const key = value.trim() || "__empty__";
  target[key] = (target[key] ?? 0) + 1;
}

function buildComparisons(questionBreakdowns: Record<string, Record<string, number>>) {
  return Object.entries(questionBreakdowns)
    .map(([fieldKey, values]) => {
      const ranked = Object.entries(values).sort((a, b) => b[1] - a[1]);
      const sampleSize = ranked.reduce((acc, [, votes]) => acc + votes, 0);
      const winner = ranked[0] ?? null;
      const runnerUp = ranked[1] ?? null;

      const winnerVotes = winner?.[1] ?? 0;
      const runnerUpVotes = runnerUp?.[1] ?? 0;
      const winnerShare = sampleSize > 0 ? Math.round((winnerVotes / sampleSize) * 100) : 0;
      const runnerUpShare = sampleSize > 0 ? Math.round((runnerUpVotes / sampleSize) * 100) : 0;

      return {
        fieldKey,
        sampleSize,
        winner: winner
          ? {
              value: winner[0],
              votes: winnerVotes,
              share: winnerShare,
            }
          : null,
        runnerUp: runnerUp
          ? {
              value: runnerUp[0],
              votes: runnerUpVotes,
              share: runnerUpShare,
            }
          : null,
        marginVotes: Math.max(0, winnerVotes - runnerUpVotes),
        marginShare: Math.max(0, winnerShare - runnerUpShare),
      };
    })
    .sort((a, b) => b.marginVotes - a.marginVotes);
}

export async function persistEarlyAccessSubmission(payload: EarlyAccessPayload) {
  const submission = await prisma.surveySubmission.create({
    data: {
      language: payload.language,
      source: payload.source,
      utm: payload.utm as Prisma.InputJsonValue,
      name: payload.contact.name,
      email: payload.contact.email,
      telegram: payload.contact.telegram || null,
      preferredContact: payload.contact.preferredContact,
      consentToContact: payload.contact.consentToContact,
      businessType: payload.survey.businessType,
      teamSize: payload.survey.teamSize,
      currentTools: payload.survey.currentTools,
      mainPains: payload.survey.mainPains,
      featurePriorities: payload.survey.featurePriorities as Prisma.InputJsonValue,
      preferredWorkspace: payload.survey.preferredWorkspace,
      idealLeadCardNotes: payload.survey.idealLeadCardNotes,
      preferredStyle: payload.survey.preferredStyle,
      willingnessToPay: payload.survey.willingnessToPay,
      earlyAccessInterest: payload.survey.earlyAccessInterest,
    },
    select: {
      id: true,
    },
  });

  return { submissionId: submission.id };
}

export async function getEarlyAccessRecords(filters?: EarlyAccessStatsFilters) {
  const where: Prisma.SurveySubmissionWhereInput = {};
  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }
  if (filters?.language) {
    where.language = filters.language;
  }
  if (filters?.businessType) {
    where.businessType = filters.businessType;
  }
  if (filters?.willingnessToPay) {
    where.willingnessToPay = filters.willingnessToPay;
  }

  const submissions = await prisma.surveySubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const mapped = submissions.map((submission) => ({
    contact: {
      id: submission.id,
      name: submission.name,
      email: submission.email,
      telegram: submission.telegram ?? "",
      preferredContact: submission.preferredContact,
      consentToContact: submission.consentToContact,
      language: submission.language,
      source: submission.source,
      utm: (submission.utm as Record<string, string> | null) ?? {},
      createdAt: submission.createdAt.toISOString(),
    },
    survey: {
      id: submission.id,
      submissionId: submission.id,
      businessType: submission.businessType,
      teamSize: submission.teamSize,
      currentTools: submission.currentTools,
      mainPains: submission.mainPains,
      featurePriorities: parseFeaturePriorities(submission.featurePriorities),
      preferredWorkspace: submission.preferredWorkspace,
      idealLeadCardNotes: submission.idealLeadCardNotes,
      preferredStyle: submission.preferredStyle,
      willingnessToPay: submission.willingnessToPay,
      earlyAccessInterest: submission.earlyAccessInterest,
      createdAt: submission.createdAt.toISOString(),
    },
  }));

  if (!filters?.acquisitionChannel) {
    return mapped;
  }

  return mapped.filter((record) => {
    const channel = String(record.contact.utm.acquisition_channel ?? "unknown");
    return channel === filters.acquisitionChannel;
  });
}

export async function getEarlyAccessStats(
  filters?: EarlyAccessStatsFilters,
): Promise<SurveyStatsDto> {
  const records = await getEarlyAccessRecords(filters);
  const surveys = records.map((record) => record.survey);
  const questionBreakdowns: Record<string, Record<string, number>> = {};

  for (const record of records) {
    const survey = record.survey;
    const scalarEntries: Array<[key: string, value: string]> = [
      ["businessType", survey.businessType],
      ["teamSize", survey.teamSize],
      ["preferredWorkspace", survey.preferredWorkspace],
      ["preferredStyle", survey.preferredStyle],
      ["willingnessToPay", survey.willingnessToPay],
      ["earlyAccessInterest", survey.earlyAccessInterest],
      ["preferredContact", record.contact.preferredContact],
      ["mainPain", survey.mainPains],
      ["currentToolStack", survey.currentTools],
      ["primaryPriority", survey.featurePriorities[0] ?? ""],
      ["acquisitionChannel", String(record.contact.utm.acquisition_channel ?? "unknown")],
    ];

    for (const [key, value] of scalarEntries) {
      if (!questionBreakdowns[key]) {
        questionBreakdowns[key] = {};
      }
      incrementCount(questionBreakdowns[key], value);
    }

    if (!questionBreakdowns.featurePriorities) {
      questionBreakdowns.featurePriorities = {};
    }
    for (const priority of survey.featurePriorities) {
      incrementCount(questionBreakdowns.featurePriorities, priority);
    }
  }

  return {
    totals: {
      submissions: records.length,
      withTelegram: records.filter((record) => Boolean(record.contact.telegram)).length,
      preferredTelegram: records.filter(
        (record) => record.contact.preferredContact === "telegram",
      ).length,
      preferredEmail: records.filter((record) => record.contact.preferredContact === "email")
        .length,
    },
    breakdowns: {
      language: countBy(records.map((record) => record.contact.language)),
      businessType: countBy(surveys.map((survey) => survey.businessType)),
      teamSize: countBy(surveys.map((survey) => survey.teamSize)),
      preferredWorkspace: countBy(surveys.map((survey) => survey.preferredWorkspace)),
      willingnessToPay: countBy(surveys.map((survey) => survey.willingnessToPay)),
      earlyAccessInterest: countBy(surveys.map((survey) => survey.earlyAccessInterest)),
    },
    comparisons: buildComparisons(questionBreakdowns),
    questionBreakdowns,
    recent: records.slice(0, 30).map((record) => ({
      contact: {
        id: record.contact.id,
        name: record.contact.name,
        email: record.contact.email,
        telegram: record.contact.telegram,
        preferredContact: record.contact.preferredContact,
        language: record.contact.language,
        createdAt: record.contact.createdAt,
      },
      survey: record.survey
        ? {
            businessType: record.survey.businessType,
            teamSize: record.survey.teamSize,
            preferredWorkspace: record.survey.preferredWorkspace,
            willingnessToPay: record.survey.willingnessToPay,
            earlyAccessInterest: record.survey.earlyAccessInterest,
          }
        : null,
    })),
  };
}

export async function createEmailOutboxRecord(input: {
  submissionId?: string;
  direction: string;
  toAddress: string;
  subject: string;
  payload?: Record<string, unknown>;
}) {
  const record = await prisma.emailOutbox.create({
    data: {
      submissionId: input.submissionId,
      direction: input.direction,
      toAddress: input.toAddress,
      subject: input.subject,
      payload: input.payload
        ? (input.payload as Prisma.InputJsonValue)
        : undefined,
      status: "queued",
    },
    select: {
      id: true,
    },
  });

  return record.id;
}

export async function updateEmailOutboxRecord(
  id: string,
  patch: {
    status: EmailOutboxStatus;
    providerMessageId?: string | null;
    errorMessage?: string | null;
  },
) {
  await prisma.emailOutbox.update({
    where: { id },
    data: {
      status: patch.status,
      providerMessageId: patch.providerMessageId ?? null,
      errorMessage: patch.errorMessage ?? null,
      sentAt: patch.status === "sent" ? new Date() : null,
    },
  });
}
