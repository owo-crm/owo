import { fail } from "@/lib/api/http";
import { resolveSession } from "@/lib/auth/session";

export async function requireSession(request: Request) {
  const session = await resolveSession(request);
  if (!session) {
    return { session: null, response: fail("UNAUTHORIZED", 401) } as const;
  }

  return { session, response: null } as const;
}

