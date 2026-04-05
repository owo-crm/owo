import type { MemberRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/token";

export type ApiSession = {
  userId: string;
  businessId: string;
  role: MemberRole;
};

function parseBearerToken(request: Request) {
  const value = request.headers.get("authorization");
  if (!value) {
    return null;
  }

  const [kind, token] = value.split(" ");
  if (!kind || !token || kind.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export async function resolveSession(request: Request): Promise<ApiSession | null> {
  const token = parseBearerToken(request);
  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return null;
  }

  const membership = await prisma.businessMember.findFirst({
    where: {
      businessId: payload.business_id,
      userId: payload.sub,
      role: payload.role,
    },
    select: {
      userId: true,
      businessId: true,
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    userId: membership.userId,
    businessId: membership.businessId,
    role: membership.role,
  };
}

