import { prisma } from "@/lib/db";
import { ensureUserWithMembership } from "@/lib/domain/business";

export async function resolveShellBusiness() {
  try {
    const first = await prisma.business.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (first) {
      return first;
    }

    if (process.env.NODE_ENV === "production") {
      return null;
    }

    const bootstrapped = await ensureUserWithMembership({
      telegramId: "dev-shell-user",
      displayName: "OWO Dev",
      email: "dev@owo.local",
    });

    const createdBusiness = bootstrapped.memberships[0];
    if (!createdBusiness) {
      return null;
    }

    return {
      id: createdBusiness.businessId,
      name: createdBusiness.businessName,
    };
  } catch (error) {
    console.error("resolveShellBusiness failed: database is unavailable", error);
    return null;
  }
}
