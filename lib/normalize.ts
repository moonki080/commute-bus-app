import type {
  ArrivalGroup,
  ArrivalItem,
  RouteLocationItem,
} from "@/types/bus";
import {
  formatEtaExactText,
  formatEtaMinText,
  mapCongestion,
  pickFirstValue,
  safeBoolean,
  safeNumber,
  safeString,
} from "@/lib/utils";

function toRecord(item: unknown) {
  if (!item || typeof item !== "object") {
    return {} as Record<string, unknown>;
  }

  return item as Record<string, unknown>;
}

export function normalizeStopCandidates(items: unknown[]) {
  return items
    .map((item) => {
      const record = toRecord(item);

      return {
        bstopId: safeString(
          pickFirstValue(record, ["BSTOPID", "bstopId", "STOPID"]),
        ),
        shortStopId: safeString(
          pickFirstValue(record, ["SHORT_BSTOPID", "SHORTBSTOPID"]),
        ),
        stopName: safeString(
          pickFirstValue(record, ["BSTOPNM", "bstopNm", "STOP_NAME"]),
        ),
        adminName: safeString(
          pickFirstValue(record, ["ADMINNM", "adminNm", "DISTRICT_NM"]),
        ),
      };
    })
    .filter((item) => item.bstopId && item.shortStopId);
}

export function normalizeArrivalItems(
  items: unknown[],
  fallbackStopId: string,
): ArrivalItem[] {
  return items
    .map((item) => {
      const record = toRecord(item);
      const routeId = safeString(
        pickFirstValue(record, ["ROUTEID", "routeId", "LINE_ID"]),
      );
      const routeNo =
        safeString(
          pickFirstValue(record, [
            "ROUTENO",
            "ROUTE_NO",
            "routeNo",
            "LINENO",
            "ROUTENM",
            "BUSNO",
            "BUS_NO",
          ]),
        ) || "노선 정보없음";
      const etaSec =
        safeNumber(
          pickFirstValue(record, [
            "ARRIVALESTIMATETIME",
            "ARRIVAL_ESTIMATE_TIME",
            "ETA",
            "PREDICT_TRAV_TM",
          ]),
        ) ?? -1;

      return {
        stopId:
          safeString(
            pickFirstValue(record, ["BSTOPID", "STOPID", "bstopId"]),
          ) || fallbackStopId,
        routeId,
        routeNo,
        busId:
          safeString(
            pickFirstValue(record, ["BUSID", "VEHICLEID", "BUS_ID"]),
          ) || `${routeId}:${etaSec}`,
        busPlate: safeString(
          pickFirstValue(record, [
            "BUS_NUM_PLATE",
            "BUSPLATENO",
            "VEHICLENO",
            "PLATENO",
          ]),
        ),
        etaSec,
        etaMinText: formatEtaMinText(etaSec),
        etaExactText: formatEtaExactText(etaSec),
        remainingStops:
          safeNumber(
            pickFirstValue(record, [
              "REST_STOP_COUNT",
              "RESTSTOPCOUNT",
              "REMAIN_STOP_CNT",
            ]),
          ) ?? undefined,
        latestStopName: safeString(
          pickFirstValue(record, [
            "LATEST_STOP_NAME",
            "LATESTSTOPNAME",
            "PREVSTOPNM",
          ]),
        ),
        lowFloor: safeBoolean(
          pickFirstValue(record, ["LOW_TP_CD", "LOWTPCD", "LOW_FLOOR_YN"]),
        ),
        congestion: mapCongestion(
          pickFirstValue(record, ["CONGESTION", "CROWD_CD", "CROWDING"]),
        ),
        remainSeat:
          safeNumber(
            pickFirstValue(record, [
              "REMAIN_SEAT",
              "REMAIN_SEAT_CNT",
              "RESTSEATCNT",
            ]),
          ) ?? null,
        lastBus: safeBoolean(
          pickFirstValue(record, ["LASTBUSYN", "LAST_BUS_YN", "LASTBUS"]),
        ),
        dirCode: safeString(pickFirstValue(record, ["DIRCD", "DIR_CD"])),
      } satisfies ArrivalItem;
    })
    .filter(
      (item) =>
        (item.routeId || item.routeNo !== "노선 정보없음") &&
        Number.isFinite(item.etaSec) &&
        item.etaSec >= 0,
    )
    .sort((left, right) => left.etaSec - right.etaSec);
}

export function groupArrivalsByRoute(items: ArrivalItem[]): ArrivalGroup[] {
  const grouped = new Map<string, ArrivalItem[]>();

  for (const item of items) {
    const routeKey = item.routeId || item.routeNo;
    const existing = grouped.get(routeKey);

    if (existing) {
      existing.push(item);
      continue;
    }

    grouped.set(routeKey, [item]);
  }

  return [...grouped.entries()]
    .map(([routeKey, arrivals]) => {
      const sorted = arrivals.sort((left, right) => left.etaSec - right.etaSec);

      return {
        routeKey,
        routeNo: sorted[0]?.routeNo ?? "노선 정보없음",
        first: sorted[0],
        second: sorted[1],
      } satisfies ArrivalGroup;
    })
    .sort((left, right) => {
      const leftEta = left.first?.etaSec ?? Number.POSITIVE_INFINITY;
      const rightEta = right.first?.etaSec ?? Number.POSITIVE_INFINITY;

      return leftEta - rightEta;
    });
}

export function normalizeRouteLocations(
  items: unknown[],
  routeId: string,
  fallbackRouteNo?: string,
): RouteLocationItem[] {
  return items
    .map((item) => {
      const record = toRecord(item);

      return {
        routeId:
          safeString(pickFirstValue(record, ["ROUTEID", "routeId"])) || routeId,
        routeNo:
          safeString(
            pickFirstValue(record, [
              "ROUTENO",
              "ROUTE_NO",
              "routeNo",
              "LINENO",
            ]),
          ) || fallbackRouteNo || "노선 정보없음",
        busId:
          safeString(
            pickFirstValue(record, ["BUSID", "VEHICLEID", "BUS_ID"]),
          ) || "unknown-bus",
        busPlate: safeString(
          pickFirstValue(record, [
            "BUS_NUM_PLATE",
            "BUSPLATENO",
            "VEHICLENO",
            "PLATENO",
          ]),
        ),
        latestStopName: safeString(
          pickFirstValue(record, [
            "LATEST_STOP_NAME",
            "LATESTSTOPNAME",
            "PREVSTOPNM",
          ]),
        ),
        remainingStops:
          safeNumber(
            pickFirstValue(record, [
              "REST_STOP_COUNT",
              "RESTSTOPCOUNT",
              "REMAIN_STOP_CNT",
            ]),
          ) ?? undefined,
        lowFloor: safeBoolean(
          pickFirstValue(record, ["LOW_TP_CD", "LOWTPCD", "LOW_FLOOR_YN"]),
        ),
        congestion: mapCongestion(
          pickFirstValue(record, ["CONGESTION", "CROWD_CD", "CROWDING"]),
        ),
        remainSeat:
          safeNumber(
            pickFirstValue(record, [
              "REMAIN_SEAT",
              "REMAIN_SEAT_CNT",
              "RESTSEATCNT",
            ]),
          ) ?? null,
        lat:
          safeNumber(
            pickFirstValue(record, ["GPSY", "LAT", "YPOS", "WGS84LAT"]),
          ) ?? undefined,
        lng:
          safeNumber(
            pickFirstValue(record, ["GPSX", "LNG", "XPOS", "WGS84LON"]),
          ) ?? undefined,
        dirCode: safeString(pickFirstValue(record, ["DIRCD", "DIR_CD"])),
      } satisfies RouteLocationItem;
    })
    .filter((item) => item.routeId && item.busId);
}
