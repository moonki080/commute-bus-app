import { NextRequest, NextResponse } from "next/server";

import {
  assertBusMode,
  getArrivalsByMode,
  toApiErrorResponse,
} from "@/lib/bus-api";
import { DEFAULT_MODE } from "@/lib/presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const modeParam = request.nextUrl.searchParams.get("mode") ?? DEFAULT_MODE;

  try {
    const mode = assertBusMode(modeParam);
    const data = await getArrivalsByMode(mode);

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
