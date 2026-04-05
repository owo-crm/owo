import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required for seeding");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

async function main() {
  const owner = await prisma.user.upsert({
    where: { telegramId: "seed-owner" },
    update: {
      displayName: "OWO Seed Owner",
      email: "owner@owo.local",
    },
    create: {
      telegramId: "seed-owner",
      displayName: "OWO Seed Owner",
      email: "owner@owo.local",
      isPlatformAdmin: true,
    },
  });

  const business = await prisma.business.upsert({
    where: { slug: "owo-demo" },
    update: {
      name: "OWO Demo Workspace",
      followUpTaskTitle: "Follow up lead",
      followUpTaskDueHours: 24,
    },
    create: {
      name: "OWO Demo Workspace",
      slug: "owo-demo",
      followUpTaskTitle: "Follow up lead",
      followUpTaskDueHours: 24,
    },
  });

  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: owner.id,
      },
    },
    update: {
      role: "OWNER",
    },
    create: {
      businessId: business.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  const statuses = [
    { key: "new", label: "New", colorHex: "#6b7ff0", position: 1 },
    { key: "contacted", label: "Contacted", colorHex: "#3b82f6", position: 2 },
    { key: "follow_up", label: "Follow-up", colorHex: "#e53b2e", position: 3, isFollowUp: true },
    { key: "won", label: "Won", colorHex: "#10b981", position: 4, isWon: true },
    { key: "lost", label: "Lost", colorHex: "#6b7280", position: 5, isLost: true },
  ] as const;

  for (const status of statuses) {
    await prisma.leadStatus.upsert({
      where: {
        businessId_key: {
          businessId: business.id,
          key: status.key,
        },
      },
      update: {
        label: status.label,
        colorHex: status.colorHex,
        position: status.position,
        isFollowUp: Boolean("isFollowUp" in status && status.isFollowUp),
        isWon: Boolean("isWon" in status && status.isWon),
        isLost: Boolean("isLost" in status && status.isLost),
      },
      create: {
        businessId: business.id,
        key: status.key,
        label: status.label,
        colorHex: status.colorHex,
        position: status.position,
        isFollowUp: Boolean("isFollowUp" in status && status.isFollowUp),
        isWon: Boolean("isWon" in status && status.isWon),
        isLost: Boolean("isLost" in status && status.isLost),
      },
    });
  }

  const statusByKey = new Map(
    (
      await prisma.leadStatus.findMany({
        where: { businessId: business.id },
        select: { id: true, key: true },
      })
    ).map((status) => [status.key, status.id]),
  );

  const leadSeeds = [
    {
      source: "manual" as const,
      sourceExternalKey: "seed-lead-01",
      fullName: "Anna Kowalska",
      phone: "+48 601 111 222",
      email: "anna@example.com",
      note: "Seed lead: Meta campaign",
      statusKey: "new",
    },
    {
      source: "google_sheet" as const,
      sourceExternalKey: "seed-lead-02",
      fullName: "Marek Nowak",
      phone: "+48 602 333 444",
      email: "marek@example.com",
      note: "Seed lead: imported from Google Sheet",
      statusKey: "contacted",
    },
    {
      source: "website_form" as const,
      sourceExternalKey: "seed-lead-03",
      fullName: "Julia Wisniewska",
      phone: "+48 603 555 666",
      email: "julia@example.com",
      note: "Seed lead: website form",
      statusKey: "follow_up",
    },
    {
      source: "api" as const,
      sourceExternalKey: "seed-lead-04",
      fullName: "Piotr Zielinski",
      phone: "+48 604 777 888",
      email: "piotr@example.com",
      note: "Seed lead: partner API",
      statusKey: "won",
    },
    {
      source: "meta_form_direct" as const,
      sourceExternalKey: "seed-lead-05",
      fullName: "Katarzyna Lewandowska",
      phone: "+48 605 999 000",
      email: "kasia@example.com",
      note: "Seed lead: direct Meta form",
      statusKey: "lost",
    },
  ];

  const leadIds: string[] = [];

  for (const lead of leadSeeds) {
    const existing = await prisma.lead.findFirst({
      where: {
        businessId: business.id,
        source: lead.source,
        sourceExternalKey: lead.sourceExternalKey,
      },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.lead.update({
          where: { id: existing.id },
          data: {
            fullName: lead.fullName,
            phone: lead.phone,
            email: lead.email,
            note: lead.note,
            ownerId: owner.id,
            statusId: statusByKey.get(lead.statusKey) ?? null,
            metadata: {
              seed: true,
              tag: "week3",
            },
          },
          select: { id: true },
        })
      : await prisma.lead.create({
          data: {
            businessId: business.id,
            source: lead.source,
            sourceExternalKey: lead.sourceExternalKey,
            fullName: lead.fullName,
            phone: lead.phone,
            email: lead.email,
            note: lead.note,
            ownerId: owner.id,
            statusId: statusByKey.get(lead.statusKey) ?? null,
            metadata: {
              seed: true,
              tag: "week3",
            },
          },
          select: { id: true },
        });

    leadIds.push(saved.id);
  }

  const openTaskLeadIds = leadIds.slice(0, 3);
  for (const [index, leadId] of openTaskLeadIds.entries()) {
    const title = `Seed task ${index + 1}: first follow-up`;
    const existingTask = await prisma.task.findFirst({
      where: {
        businessId: business.id,
        leadId,
        title,
        doneAt: null,
      },
      select: { id: true },
    });

    if (!existingTask) {
      await prisma.task.create({
        data: {
          businessId: business.id,
          leadId,
          assigneeId: owner.id,
          createdById: owner.id,
          title,
          dueAt: new Date(Date.now() + (index + 1) * 60 * 60 * 1000),
        },
      });
    }
  }

  const sources = [
    { family: "website_form", key: "owo-demo-website-form", isActive: true },
    { family: "api", key: "owo-demo-public-api", isActive: true },
    { family: "google_sheet", key: "owo-demo-google-sheet", isActive: true },
    { family: "meta_form_direct", key: "owo-demo-meta-form", isActive: true },
    { family: "import_file", key: "owo-demo-import-file", isActive: true },
  ] as const;

  for (const source of sources) {
    await prisma.ingestSource.upsert({
      where: { key: source.key },
      update: {
        isActive: source.isActive,
        name: `OWO Demo ${source.family}`,
      },
      create: {
        businessId: business.id,
        family: source.family,
        key: source.key,
        name: `OWO Demo ${source.family}`,
        isActive: source.isActive,
      },
    });
  }

  await prisma.businessEvent.create({
    data: {
      businessId: business.id,
      type: "seed.completed",
      actorUserId: owner.id,
      payload: {
        leads: leadSeeds.length,
      },
    },
  });

  console.log("Seed completed:", {
    businessId: business.id,
    ownerId: owner.id,
    leads: leadSeeds.length,
    openTasks: openTaskLeadIds.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
