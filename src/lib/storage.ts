import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

const dataDir = path.join(process.cwd(), "data");
const waitlistFile = path.join(dataDir, "waitlist_submissions.json");
const surveyFile = path.join(dataDir, "survey_responses.json");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readCollection<T>(filePath: string): Promise<T[]> {
  await ensureDataDir();

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

async function writeCollection<T>(filePath: string, records: T[]) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

export async function persistEarlyAccessSubmission(payload: EarlyAccessPayload) {
  const createdAt = new Date().toISOString();
  const submissionId = randomUUID();

  const waitlistRecord: WaitlistSubmission = {
    id: submissionId,
    name: payload.contact.name,
    email: payload.contact.email,
    telegram: payload.contact.telegram,
    preferredContact: payload.contact.preferredContact,
    consentToContact: payload.contact.consentToContact,
    language: payload.language,
    source: payload.source,
    utm: payload.utm,
    createdAt,
  };

  const surveyRecord: SurveyResponse = {
    id: randomUUID(),
    submissionId,
    createdAt,
    ...payload.survey,
  };

  const [waitlist, survey] = await Promise.all([
    readCollection<WaitlistSubmission>(waitlistFile),
    readCollection<SurveyResponse>(surveyFile),
  ]);

  waitlist.push(waitlistRecord);
  survey.push(surveyRecord);

  await Promise.all([
    writeCollection(waitlistFile, waitlist),
    writeCollection(surveyFile, survey),
  ]);

  return { submissionId };
}

export async function getEarlyAccessRecords() {
  const [waitlist, survey] = await Promise.all([
    readCollection<WaitlistSubmission>(waitlistFile),
    readCollection<SurveyResponse>(surveyFile),
  ]);

  const surveyBySubmission = new Map(survey.map((item) => [item.submissionId, item]));

  return waitlist
    .map((contact) => ({
      contact,
      survey: surveyBySubmission.get(contact.id) ?? null,
    }))
    .sort((a, b) => (a.contact.createdAt < b.contact.createdAt ? 1 : -1));
}

export async function getEarlyAccessStats() {
  const records = await getEarlyAccessRecords();
  const surveys = records
    .map((record) => record.survey)
    .filter((value): value is SurveyResponse => value !== null);

  return {
    totals: {
      submissions: records.length,
      withTelegram: records.filter((record) => Boolean(record.contact.telegram)).length,
      preferredTelegram: records.filter(
        (record) => record.contact.preferredContact === "telegram",
      ).length,
      preferredEmail: records.filter(
        (record) => record.contact.preferredContact === "email",
      ).length,
    },
    breakdowns: {
      language: countBy(records.map((record) => record.contact.language)),
      businessType: countBy(surveys.map((survey) => survey.businessType)),
      teamSize: countBy(surveys.map((survey) => survey.teamSize)),
      preferredWorkspace: countBy(surveys.map((survey) => survey.preferredWorkspace)),
      willingnessToPay: countBy(surveys.map((survey) => survey.willingnessToPay)),
      earlyAccessInterest: countBy(surveys.map((survey) => survey.earlyAccessInterest)),
    },
    recent: records.slice(0, 30),
  };
}
