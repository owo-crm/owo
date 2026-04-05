import { NextResponse } from "next/server";

export function ok<T extends object>(payload: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...payload }, init);
}

export function fail(
  error: string,
  status = 400,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...(details ?? {}),
    },
    { status },
  );
}

