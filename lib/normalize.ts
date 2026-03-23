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

export const UNKNOWN_ROUTE_LABEL = "노선 정보없음";

const ROUTE_LABEL_CANDIDATE_GROUPS = [
  ["ROUTE_NO", "ROUTENO", "routeNo", "route_no"],
  ["ROUTE_NAME", "ROUTENAME", "routeName", "route_name"],
  ["ROUTE_NM", "ROUTENM", "routeNm", "route_nm"],
  ["routeno"],
  ["LINE_NO", "LINENO", "lineNo", "line_no"],
  ["BUS_NO", "BUSNO", "busNo", "bus_no"],
  ["LINE", "line"],
  ["SHORT_NAME", "SHORTNAME", "shortName", "short_name"],
] as const;

function toRecord(item: unknown) {
  if (!item || typeof item !== "object") {
    return {} as Record<string, unknown>;
  }

  return item as Record<string, unknown>;
}

export function pickRouteDisplayName(record: Record<string, unknown>) {
  for (const candidateGroup of ROUTE_LABEL_CANDIDATE_GROUPS) {
    const value = safeString(pickFirstValue(record, [...candidateGroup]));

    if (value) {
      return value;
    }
  }

  return "";
}

export function isKnownRouteLabel(value: string | null | undefined) {
  return Boolean(value && value.trim() && value !== UNKNOWN_ROUTE_LABEL);
}

export function extractFirstRouteDisplayName(items: unknown[]) {
  for (const item of items) {
    const routeLabel = pickRouteDisplayName(toRecord(item));

    if (isKnownRouteLabel(routeLabel)) {
      return routeLabel;
    }
  }

  return null;
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
      const routeNo = pickRouteDisplayName(record);
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
              "REMAIND_SEAT",
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
        (item.routeId || isKnownRouteLabel(item.routeNo)) &&
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
      const routeNo =
        sorted.map((item) => item.routeNo).find((label) => isKnownRouteLabel(label)) ??
        UNKNOWN_ROUTE_LABEL;

      return {
        routeKey,
        routeNo,
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
          pickRouteDisplayName(record) || fallbackRouteNo || UNKNOWN_ROUTE_LABEL,
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
              "REMAIND_SEAT",
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
