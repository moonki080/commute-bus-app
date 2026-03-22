import { NextRequest, NextResponse } from "next/server";

import { getRouteDetail, toApiErrorResponse } from "@/lib/bus-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const routeId = request.nextUrl.searchParams.get("routeId") ?? "";
  const routeNo = request.nextUrl.searchParams.get("routeNo") ?? undefined;

  try {
    const data = await getRouteDetail(routeId, routeNo);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const { status, body } = toApiErrorResponse(error);

    return NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
