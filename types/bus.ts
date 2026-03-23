export type BusMode = "commute" | "return";

export type CongestionLevel = "여유" | "보통" | "혼잡" | "정보없음";

export type StopPreset = {
  mode: BusMode;
  label: string;
  title: string;
  stopName: string;
  shortStopId: string;
  directionLabel: string;
};

export type ResolvedStop = StopPreset & {
  resolvedBstopId: string;
  matchedStopName: string;
  adminName?: string;
  lat?: number;
  lng?: number;
};

export type ArrivalItem = {
  stopId: string;
  routeId: string;
  routeNo: string;
  busId: string;
  busPlate?: string;
  etaSec: number;
  etaMinText: string;
  etaExactText: string;
  remainingStops?: number;
  latestStopName?: string;
  lowFloor?: boolean;
  congestion: CongestionLevel;
  remainSeat?: number | null;
  lastBus?: boolean;
  dirCode?: string;
};

export type ArrivalGroup = {
  routeKey: string;
  routeNo: string;
  first?: ArrivalItem;
  second?: ArrivalItem;
};

export type ArrivalsApiResponse = {
  mode: BusMode;
  stop: {
    title: string;
    stopName: string;
    shortStopId: string;
    resolvedBstopId: string;
    directionLabel: string;
    lat?: number;
    lng?: number;
  };
  updatedAt: string;
  totalRoutes: number;
  arrivals: ArrivalGroup[];
};

export type ResolvedStopApiResponse = {
  mode?: BusMode;
  stopName: string;
  shortStopId: string;
  matchedStopName: string;
  resolvedBstopId: string;
  adminName?: string;
  lat?: number;
  lng?: number;
};

export type RouteLocationItem = {
  routeId: string;
  routeNo: string;
  busId: string;
  busPlate?: string;
  latestStopName?: string;
  remainingStops?: number;
  lowFloor?: boolean;
  congestion: CongestionLevel;
  remainSeat?: number | null;
  lat?: number;
  lng?: number;
  dirCode?: string;
};

export type RouteDetailApiResponse = {
  routeId: string;
  routeNo?: string;
  updatedAt: string;
  vehicles: RouteLocationItem[];
};

export type ApiErrorCode =
  | "INVALID_MODE"
  | "MISSING_SERVICE_KEY"
  | "STOP_RESOLVE_FETCH_FAILED"
  | "STOP_SEARCH_NO_RESULT"
  | "STOP_SHORT_ID_NOT_FOUND"
  | "ARRIVALS_FETCH_FAILED"
  | "ROUTE_DETAIL_FETCH_FAILED"
  | "XML_PARSE_FAILED"
  | "SERVICE_KEY_ERROR"
  | "UPSTREAM_RESPONSE_ERROR"
  | "INTERNAL_ERROR";

export type ApiErrorPayload = {
  error: {
    code: ApiErrorCode;
    message: string;
    debugMessage?: string;
  };
};
