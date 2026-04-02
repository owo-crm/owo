import { NextResponse } from "next/server";
import { getEarlyAccessStats } from "@/lib/storage";

export const runtime = "nodejs";

function hasAccess(request: Request) {
  const requiredToken = process.env.EARLY_ACCESS_STATS_TOKEN?.trim();

  if (!requiredToken) {
    return true;
  }

  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get("token");
  const tokenFromHeader = request.headers.get("x-admin-token");

  return tokenFromQuery === requiredToken || tokenFromHeader === requiredToken;
}

export async function GET(request: Request) {
  if (!hasAccess(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const stats = await getEarlyAccessStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error("Failed to load early access stats", error);
    return NextResponse.json({ ok: false, error: "LOAD_FAILED" }, { status: 500 });
  }
}

