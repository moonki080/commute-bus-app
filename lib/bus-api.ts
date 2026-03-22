import "server-only";

import type {
  ApiErrorCode,
  ApiErrorPayload,
  ArrivalsApiResponse,
  BusMode,
  ResolvedStop,
  ResolvedStopApiResponse,
  RouteDetailApiResponse,
  StopPreset,
} from "@/types/bus";
import { getPreset, isBusMode } from "@/lib/presets";
import {
  groupArrivalsByRoute,
  normalizeArrivalItems,
  normalizeRouteLocations,
  normalizeStopCandidates,
} from "@/lib/normalize";
import { extractItems, extractResultMeta, parseXml } from "@/lib/xml";

const DATA_GO_KR_BASE_URL = "https://apis.data.go.kr";
const STOP_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

const resolvedStopCache = new Map<
  string,
  {
    data: ResolvedStop;
    expiresAt: number;
  }
>();

const NORMAL_RESULT_CODES = new Set(["0", "00", "200", "INFO-000"]);
const NORMAL_RESULT_MESSAGE_PATTERNS = [/NORMAL SERVICE/i, /정상/i];
const AUTH_ERROR_PATTERNS = [
  /SERVICE_KEY/i,
  /인증키/i,
  /SERVICE ACCESS DENIED/i,
  /UNREGISTERED/i,
  /INVALID_REQUEST_PARAMETER_ERROR/i,
];

export class BusApiError extends Error {
  code: ApiErrorCode;
  status: number;
  debugMessage?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 500,
    debugMessage?: string,
  ) {
    super(message);
    this.name = "BusApiError";
    this.code = code;
    this.status = status;
    this.debugMessage = debugMessage;
  }
}

function getServiceKey() {
  const rawKey = process.env.DATA_GO_KR_SERVICE_KEY?.trim();

  if (!rawKey) {
    throw new BusApiError(
      "MISSING_SERVICE_KEY",
      "DATA_GO_KR_SERVICE_KEY 환경변수가 설정되지 않았습니다.",
      500,
    );
  }

  try {
    return rawKey.includes("%") ? decodeURIComponent(rawKey) : rawKey;
  } catch {
    return rawKey;
  }
}

function buildApiUrl(
  serviceRoot: string,
  endpoint: string,
  params: Record<string, string | number | undefined>,
) {
  const url = new URL(`${DATA_GO_KR_BASE_URL}${serviceRoot}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  const query = url.searchParams.toString();
  const encodedServiceKey = encodeURIComponent(getServiceKey());

  return `${url.origin}${url.pathname}?ServiceKey=${encodedServiceKey}${
    query ? `&${query}` : ""
  }`;
}

function detectServiceKeyProblem(message = "", xml = "") {
  return AUTH_ERROR_PATTERNS.some(
    (pattern) => pattern.test(message) || pattern.test(xml),
  );
}

function assertSuccessResponse(parsed: unknown, xml: string) {
  const { resultCode, resultMessage } = extractResultMeta(parsed);

  if (!resultCode && !resultMessage) {
    return;
  }

  if (resultCode && NORMAL_RESULT_CODES.has(resultCode)) {
    return;
  }

  if (
    !resultCode &&
    resultMessage &&
    NORMAL_RESULT_MESSAGE_PATTERNS.some((pattern) => pattern.test(resultMessage))
  ) {
    return;
  }

  const debugMessage = [resultCode, resultMessage].filter(Boolean).join(" / ");

  if (detectServiceKeyProblem(resultMessage, xml)) {
    throw new BusApiError(
      "SERVICE_KEY_ERROR",
      "공공데이터 인증키 또는 요청 인코딩을 확인해주세요.",
      502,
      debugMessage || "서비스키 관련 응답을 받았습니다.",
    );
  }

  throw new BusApiError(
    "UPSTREAM_RESPONSE_ERROR",
    "공공데이터 API 응답 상태를 확인해주세요.",
    502,
    debugMessage || "정상 응답 코드가 아닙니다.",
  );
}

async function fetchXmlFromApi(
  serviceRoot: string,
  endpoint: string,
  params: Record<string, string | number | undefined>,
  errorCode: ApiErrorCode,
) {
  const url = buildApiUrl(serviceRoot, endpoint, params);
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });

  const xml = await response.text();

  if (!response.ok) {
    const debugMessage = `HTTP ${response.status} ${response.statusText}`;

    if (detectServiceKeyProblem(xml, xml)) {
      throw new BusApiError(
        "SERVICE_KEY_ERROR",
        "공공데이터 인증키 또는 요청 인코딩을 확인해주세요.",
        502,
        debugMessage,
      );
    }

    throw new BusApiError(
      errorCode,
      "공공데이터 API 호출에 실패했습니다.",
      502,
      debugMessage,
    );
  }

  let parsed: unknown;

  try {
    parsed = parseXml(xml);
  } catch (error) {
    throw new BusApiError(
      "XML_PARSE_FAILED",
      "공공데이터 XML 응답 파싱에 실패했습니다.",
      502,
      error instanceof Error ? error.message : undefined,
    );
  }

  assertSuccessResponse(parsed, xml);

  return {
    xml,
    parsed,
  };
}

function getResolveCacheKey(preset: StopPreset) {
  return `${preset.stopName}:${preset.shortStopId}`;
}

export function assertBusMode(mode: string | null | undefined): BusMode {
  if (!isBusMode(mode)) {
    throw new BusApiError(
      "INVALID_MODE",
      "mode는 commute 또는 return 이어야 합니다.",
      400,
    );
  }

  return mode;
}

export async function resolveStopByPreset(
  preset: StopPreset,
): Promise<ResolvedStop> {
  const cacheKey = getResolveCacheKey(preset);
  const cached = resolvedStopCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const { parsed } = await fetchXmlFromApi(
    "/6280000/busStationService",
    "getBusStationNmList",
    {
      pageNo: 1,
      numOfRows: 200,
      bstopnm: preset.stopName,
    },
    "STOP_RESOLVE_FETCH_FAILED",
  );

  const rawItems = extractItems(parsed);
  const candidates = normalizeStopCandidates(rawItems);

  if (candidates.length === 0) {
    throw new BusApiError(
      "STOP_SEARCH_NO_RESULT",
      "정류소명 검색 결과가 없습니다.",
      404,
      `${preset.stopName} 검색 결과 없음`,
    );
  }

  const matched = candidates.find(
    (candidate) => candidate.shortStopId === preset.shortStopId,
  );

  if (!matched) {
    throw new BusApiError(
      "STOP_SHORT_ID_NOT_FOUND",
      "정류소는 조회됐지만 SHORT_BSTOPID 일치 항목을 찾지 못했습니다.",
      404,
      `후보 SHORT_BSTOPID: ${candidates
        .map((candidate) => candidate.shortStopId)
        .join(", ")}`,
    );
  }

  const resolved: ResolvedStop = {
    ...preset,
    resolvedBstopId: matched.bstopId,
    matchedStopName: matched.stopName || preset.stopName,
    adminName: matched.adminName || undefined,
  };

  resolvedStopCache.set(cacheKey, {
    data: resolved,
    expiresAt: Date.now() + STOP_CACHE_TTL_MS,
  });

  return resolved;
}

export async function resolveStopByInput(input: {
  stopName: string;
  shortStopId: string;
  mode?: BusMode;
}): Promise<ResolvedStopApiResponse> {
  const preset: StopPreset = {
    mode: input.mode ?? "commute",
    label: input.mode ? getPreset(input.mode).label : "직접 조회",
    title: input.mode ? getPreset(input.mode).title : "직접 조회 정류장",
    stopName: input.stopName,
    shortStopId: input.shortStopId,
    directionLabel: input.mode ? getPreset(input.mode).directionLabel : "",
    distanceLabel: input.mode ? getPreset(input.mode).distanceLabel : "",
  };

  const resolved = await resolveStopByPreset(preset);

  return {
    mode: input.mode,
    stopName: resolved.stopName,
    shortStopId: resolved.shortStopId,
    matchedStopName: resolved.matchedStopName,
    resolvedBstopId: resolved.resolvedBstopId,
    adminName: resolved.adminName,
  };
}

export async function getArrivalsByMode(mode: BusMode): Promise<ArrivalsApiResponse> {
  const preset = getPreset(mode);
  const stop = await resolveStopByPreset(preset);
  const { parsed } = await fetchXmlFromApi(
    "/6280000/busArrivalService",
    "getAllRouteBusArrivalList",
    {
      pageNo: 1,
      numOfRows: 300,
      bstopid: stop.resolvedBstopId,
    },
    "ARRIVALS_FETCH_FAILED",
  );

  const items = extractItems(parsed);
  const normalized = normalizeArrivalItems(items, stop.resolvedBstopId);
  const grouped = groupArrivalsByRoute(normalized);

  return {
    mode,
    stop: {
      title: stop.title,
      stopName: stop.stopName,
      shortStopId: stop.shortStopId,
      resolvedBstopId: stop.resolvedBstopId,
      directionLabel: stop.directionLabel,
      distanceLabel: stop.distanceLabel,
    },
    updatedAt: new Date().toISOString(),
    totalRoutes: grouped.length,
    arrivals: grouped,
  };
}

export async function getRouteDetail(
  routeId: string,
  routeNo?: string,
): Promise<RouteDetailApiResponse> {
  const normalizedRouteId = routeId.trim();

  if (!normalizedRouteId) {
    throw new BusApiError(
      "ROUTE_DETAIL_FETCH_FAILED",
      "routeId가 필요합니다.",
      400,
    );
  }

  const { parsed } = await fetchXmlFromApi(
    "/6280000/busLocationService",
    "getBusRouteLocation",
    {
      pageNo: 1,
      numOfRows: 200,
      routeid: normalizedRouteId,
    },
    "ROUTE_DETAIL_FETCH_FAILED",
  );

  const items = extractItems(parsed);
  const vehicles = normalizeRouteLocations(items, normalizedRouteId, routeNo);

  return {
    routeId: normalizedRouteId,
    routeNo,
    updatedAt: new Date().toISOString(),
    vehicles,
  };
}

export function toApiErrorResponse(error: unknown): {
  status: number;
  body: ApiErrorPayload;
} {
  if (error instanceof BusApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          debugMessage:
            process.env.NODE_ENV === "development"
              ? error.debugMessage
              : undefined,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "알 수 없는 서버 오류가 발생했습니다.",
        debugMessage:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
    },
  };
}
