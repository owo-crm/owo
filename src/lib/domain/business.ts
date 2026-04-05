import type { IngestFamily, MemberRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { slugifyBusinessName } from "@/lib/domain/common";

const DEFAULT_STATUSES = [
  { key: "new", label: "New", colorHex: "#6b7ff0", position: 1 },
  { key: "contacted", label: "Contacted", colorHex: "#3b82f6", position: 2 },
  { key: "follow_up", label: "Follow-up", colorHex: "#e53b2e", position: 3, isFollowUp: true },
  { key: "won", label: "Won", colorHex: "#10b981", position: 4, isWon: true },
  { key: "lost", label: "Lost", colorHex: "#6b7280", position: 5, isLost: true },
] as const;

const DEFAULT_INGEST_FAMILIES: IngestFamily[] = [
  "website_form",
  "api",
  "google_sheet",
  "meta_form_direct",
  "import_file",
];

function uniqueSlug(base: string, suffix?: string) {
  return suffix ? `${base}-${suffix}` : base;
}

export async function ensureUserWithMembership(input: {
  telegramId: string;
  displayName: string;
  email?: string | null;
  role?: MemberRole;
}) {
  const role = input.role ?? "OWNER";

  const user = await prisma.user.upsert({
    where: {
      telegramId: input.telegramId,
    },
    update: {
      displayName: input.displayName,
      email: input.email ?? null,
    },
    create: {
      telegramId: input.telegramId,
      displayName: input.displayName,
      email: input.email ?? null,
    },
  });

  const memberships = await prisma.businessMember.findMany({
    where: { userId: user.id },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length > 0) {
    return {
      user,
      memberships: memberships.map((item) => ({
        businessId: item.businessId,
        businessName: item.business.name,
        role: item.role,
      })),
    };
  }

  const created = await prisma.$transaction(async (tx) => {
    const baseSlug = slugifyBusinessName(`${input.displayName} workspace`) || "owo-workspace";

    let slug = baseSlug;
    for (let i = 1; i < 20; i += 1) {
      const exists = await tx.business.findFirst({
        where: { slug },
        select: { id: true },
      });
      if (!exists) {
        break;
      }
      slug = uniqueSlug(baseSlug, String(i));
    }

    const business = await tx.business.create({
      data: {
        name: `${input.displayName} workspace`,
        slug,
      },
    });

    await tx.businessMember.create({
      data: {
        businessId: business.id,
        userId: user.id,
        role,
      },
    });

    await tx.leadStatus.createMany({
      data: DEFAULT_STATUSES.map((status) => ({
        businessId: business.id,
        key: status.key,
        label: status.label,
        colorHex: status.colorHex,
        position: status.position,
        isFollowUp: "isFollowUp" in status ? status.isFollowUp : false,
        isWon: "isWon" in status ? status.isWon : false,
        isLost: "isLost" in status ? status.isLost : false,
      })),
    });

    await tx.ingestSource.createMany({
      data: DEFAULT_INGEST_FAMILIES.map((family) => ({
        businessId: business.id,
        family,
        key: `${slug}-${family}`,
        name: `${family} default source`,
        isActive: family !== "google_sheet",
      })),
    });

    return business;
  });

  return {
    user,
    memberships: [
      {
        businessId: created.id,
        businessName: created.name,
        role,
      },
    ],
  };
}

export async function getDefaultLeadStatusId(businessId: string) {
  const status = await prisma.leadStatus.findFirst({
    where: { businessId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  return status?.id ?? null;
}
