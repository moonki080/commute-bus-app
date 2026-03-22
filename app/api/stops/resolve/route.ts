import { NextRequest, NextResponse } from "next/server";

import {
  assertBusMode,
  resolveStopByInput,
  toApiErrorResponse,
} from "@/lib/bus-api";
import { getPreset } from "@/lib/presets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const modeParam = request.nextUrl.searchParams.get("mode");
  const stopNameParam = request.nextUrl.searchParams.get("stopName");
  const shortStopIdParam = request.nextUrl.searchParams.get("shortStopId");

  try {
    const mode = modeParam ? assertBusMode(modeParam) : undefined;
    const preset = mode ? getPreset(mode) : undefined;
    const stopName = stopNameParam ?? preset?.stopName;
    const shortStopId = shortStopIdParam ?? preset?.shortStopId;

    if (!stopName || !shortStopId) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_MODE",
            message:
              "mode 또는 stopName + shortStopId 조합이 필요합니다.",
          },
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const data = await resolveStopByInput({
      mode,
      stopName,
      shortStopId,
    });

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
