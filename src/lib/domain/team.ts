import type { MemberRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { TeamMemberDto } from "@/lib/types/domain";

function toTeamMemberDto(member: {
  role: MemberRole;
  createdAt: Date;
  user: {
    id: string;
    displayName: string;
    email: string | null;
    telegramId: string | null;
  };
}): TeamMemberDto {
  return {
    user_id: member.user.id,
    display_name: member.user.displayName,
    email: member.user.email,
    telegram_id: member.user.telegramId,
    role: member.role,
    created_at: member.createdAt.toISOString(),
  };
}

export async function listTeamMembers(businessId: string) {
  const members = await prisma.businessMember.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          telegramId: true,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  return members.map((member) => toTeamMemberDto(member));
}

export async function addTeamMember(input: {
  businessId: string;
  displayName: string;
  email?: string | null;
  telegramId?: string | null;
  role?: MemberRole;
}) {
  const role = input.role ?? "OPERATOR";

  const user = await prisma.$transaction(async (tx) => {
    const byTelegram = input.telegramId
      ? await tx.user.findUnique({
          where: { telegramId: input.telegramId },
        })
      : null;

    if (byTelegram) return byTelegram;

    const byEmail = input.email
      ? await tx.user.findFirst({
          where: {
            email: input.email,
          },
          orderBy: { createdAt: "asc" },
        })
      : null;

    if (byEmail) {
      return tx.user.update({
        where: { id: byEmail.id },
        data: {
          displayName: input.displayName || byEmail.displayName,
          telegramId: input.telegramId ?? byEmail.telegramId,
        },
      });
    }

    return tx.user.create({
      data: {
        displayName: input.displayName,
        email: input.email ?? null,
        telegramId: input.telegramId ?? null,
      },
    });
  });

  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: input.businessId,
        userId: user.id,
      },
    },
    update: {
      role,
    },
    create: {
      businessId: input.businessId,
      userId: user.id,
      role,
    },
  });

  const membership = await prisma.businessMember.findUnique({
    where: {
      businessId_userId: {
        businessId: input.businessId,
        userId: user.id,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          telegramId: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("TEAM_MEMBER_CREATE_FAILED");
  }

  return toTeamMemberDto(membership);
}
