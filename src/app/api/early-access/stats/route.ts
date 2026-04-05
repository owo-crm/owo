import { NextResponse } from "next/server";
import { getEarlyAccessStats, type EarlyAccessStatsFilters } from "@/lib/storage";

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
    const url = new URL(request.url);
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const language = url.searchParams.get("language");
    const acquisitionChannel = url.searchParams.get("acquisition_channel");
    const businessType = url.searchParams.get("business_type");
    const willingnessToPay = url.searchParams.get("willingness_to_pay");

    const from = fromRaw ? new Date(`${fromRaw}T00:00:00.000Z`) : null;
    const to = toRaw ? new Date(`${toRaw}T23:59:59.999Z`) : null;

    const filters: EarlyAccessStatsFilters = {
      from: from && !Number.isNaN(from.getTime()) ? from : null,
      to: to && !Number.isNaN(to.getTime()) ? to : null,
      language: language && language !== "all" ? language : null,
      acquisitionChannel:
        acquisitionChannel && acquisitionChannel !== "all" ? acquisitionChannel : null,
      businessType: businessType && businessType !== "all" ? businessType : null,
      willingnessToPay:
        willingnessToPay && willingnessToPay !== "all" ? willingnessToPay : null,
    };

    const stats = await getEarlyAccessStats(filters);
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error("Failed to load early access stats", error);
    return NextResponse.json({ ok: false, error: "LOAD_FAILED" }, { status: 500 });
  }
}

