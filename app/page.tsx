"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { ArrivalCard } from "@/components/arrival-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ModeSwitch } from "@/components/mode-switch";
import { StopCard } from "@/components/stop-card";
import { SourceFooter } from "@/components/source-footer";
import {
  formatDistanceLabel,
  hasCoordinates,
  haversineDistanceMeters,
  type Coordinate,
  type LocationStatus,
} from "@/lib/location";
import { DEFAULT_MODE, STOP_PRESETS } from "@/lib/presets";
import { cn, formatUpdatedAt } from "@/lib/utils";
import type {
  ApiErrorPayload,
  ArrivalsApiResponse,
  BusMode,
  ResolvedStopApiResponse,
} from "@/types/bus";

const AUTO_REFRESH_MS = 30_000;
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 30_000,
} as const;

const MODE_THEME: Record<
  BusMode,
  {
    accentLine: string;
    refreshButton: string;
    accentText: string;
  }
> = {
  commute: {
    accentLine: "bg-cyan-300",
    refreshButton:
      "border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15",
    accentText: "text-cyan-200",
  },
  return: {
    accentLine: "bg-orange-300",
    refreshButton:
      "border-orange-300/20 bg-orange-400/10 text-orange-100 hover:bg-orange-400/15",
    accentText: "text-orange-200",
  },
};

type ViewError = {
  message: string;
  debugMessage?: string;
};

type StopViewModel = {
  title: string;
  stopName: string;
  shortStopId: string;
  directionLabel: string;
  resolvedBstopId?: string;
  lat?: number;
  lng?: number;
};

type DistanceView = {
  meters: number | null;
  label: string;
};

function normalizeClientError(error: unknown): ViewError {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null
  ) {
    const payload = error as ApiErrorPayload;

    return {
      message: payload.error.message || "잠시 후 다시 시도해주세요.",
      debugMessage: payload.error.debugMessage,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "잠시 후 다시 시도해주세요.",
  };
}

function getDistanceView(
  stop: Pick<StopViewModel, "lat" | "lng" | "resolvedBstopId">,
  userLocation: Coordinate | null,
  locationStatus: LocationStatus,
): DistanceView {
  if (locationStatus === "idle" || locationStatus === "loading") {
    return {
      meters: null,
      label: "위치 확인 중",
    };
  }

  if (locationStatus === "denied") {
    return {
      meters: null,
      label: "위치 권한 필요",
    };
  }

  if (!stop.resolvedBstopId) {
    return {
      meters: null,
      label: "위치 확인 중",
    };
  }

  if (!userLocation || !hasCoordinates(stop)) {
    return {
      meters: null,
      label: "위치 확인 불가",
    };
  }

  const meters = haversineDistanceMeters(userLocation, {
    lat: stop.lat,
    lng: stop.lng,
  });

  return {
    meters,
    label: formatDistanceLabel(meters),
  };
}

export default function HomePage() {
  const [mode, setMode] = useState<BusMode>(DEFAULT_MODE);
  const [dataByMode, setDataByMode] = useState<
    Partial<Record<BusMode, ArrivalsApiResponse>>
  >({});
  const [resolvedStopsByMode, setResolvedStopsByMode] = useState<
    Partial<Record<BusMode, ResolvedStopApiResponse>>
  >({});
  const [error, setError] = useState<ViewError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const locationRequestIdRef = useRef(0);
  const dataByModeRef = useRef<Partial<Record<BusMode, ArrivalsApiResponse>>>({});

  useEffect(() => {
    dataByModeRef.current = dataByMode;
  }, [dataByMode]);

  const activeData = dataByMode[mode] ?? null;
  const theme = MODE_THEME[mode];

  const requestStopMetadata = useCallback(async (targetMode: BusMode) => {
    const response = await fetch(`/api/stops/resolve?mode=${targetMode}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as
      | ResolvedStopApiResponse
      | ApiErrorPayload;

    if (!response.ok) {
      throw payload;
    }

    setResolvedStopsByMode((current) => ({
      ...current,
      [targetMode]: payload as ResolvedStopApiResponse,
    }));
  }, []);

  const requestUserLocation = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      setUserLocation(null);
      setLocationStatus("unavailable");
      setLocationErrorMessage("브라우저에서 위치 정보를 지원하지 않습니다.");
      return;
    }

    const requestId = locationRequestIdRef.current + 1;
    locationRequestIdRef.current = requestId;

    setLocationStatus("loading");
    setLocationErrorMessage(null);

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (locationRequestIdRef.current !== requestId) {
            resolve();
            return;
          }

          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationStatus("granted");
          setLocationErrorMessage(null);
          resolve();
        },
        (error) => {
          if (locationRequestIdRef.current !== requestId) {
            resolve();
            return;
          }

          setUserLocation(null);

          if (error.code === 1) {
            setLocationStatus("denied");
            setLocationErrorMessage("위치 권한이 필요합니다.");
          } else if (error.code === 2) {
            setLocationStatus("unavailable");
            setLocationErrorMessage("현재 위치를 확인할 수 없습니다.");
          } else if (error.code === 3) {
            setLocationStatus("error");
            setLocationErrorMessage("위치 확인 시간이 초과되었습니다.");
          } else {
            setLocationStatus("error");
            setLocationErrorMessage("위치 확인에 실패했습니다.");
          }

          resolve();
        },
        GEOLOCATION_OPTIONS,
      );
    });
  }, []);

  const requestArrivals = useCallback(
    async (targetMode: BusMode, reason: "initial" | "mode" | "manual" | "auto") => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const shouldShowBlockingLoading =
        reason === "initial" || !dataByModeRef.current[targetMode];

      setError(null);
      if (shouldShowBlockingLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(`/api/arrivals?mode=${targetMode}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | ArrivalsApiResponse
          | ApiErrorPayload;

        if (!response.ok) {
          throw payload;
        }

        setDataByMode((current) => ({
          ...current,
          [(payload as ArrivalsApiResponse).mode]: payload as ArrivalsApiResponse,
        }));
        setResolvedStopsByMode((current) => ({
          ...current,
          [(payload as ArrivalsApiResponse).mode]: {
            mode: (payload as ArrivalsApiResponse).mode,
            stopName: (payload as ArrivalsApiResponse).stop.stopName,
            shortStopId: (payload as ArrivalsApiResponse).stop.shortStopId,
            matchedStopName: (payload as ArrivalsApiResponse).stop.stopName,
            resolvedBstopId: (payload as ArrivalsApiResponse).stop.resolvedBstopId,
            lat: (payload as ArrivalsApiResponse).stop.lat,
            lng: (payload as ArrivalsApiResponse).stop.lng,
          },
        }));
        setError(null);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(normalizeClientError(caughtError));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void requestUserLocation();
  }, [requestUserLocation]);

  useEffect(() => {
    return () => {
      locationRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    void requestArrivals(
      mode,
      dataByModeRef.current[mode] ? "auto" : "initial",
    );

    return () => {
      abortRef.current?.abort();
    };
  }, [mode, requestArrivals]);

  useEffect(() => {
    (Object.keys(STOP_PRESETS) as BusMode[]).forEach((targetMode) => {
      void requestStopMetadata(targetMode).catch(() => undefined);
    });
  }, [requestStopMetadata]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible" && !abortRef.current) {
        void requestArrivals(mode, "auto");
      }
    };

    const intervalId = window.setInterval(() => {
      refreshWhenVisible();
    }, AUTO_REFRESH_MS);

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [mode, requestArrivals]);

  const stopByMode = (Object.keys(STOP_PRESETS) as BusMode[]).reduce(
    (result, currentMode) => {
      const preset = STOP_PRESETS[currentMode];
      const resolvedStop = resolvedStopsByMode[currentMode];
      const arrivalStop = dataByMode[currentMode]?.stop;

      result[currentMode] = {
        title: arrivalStop?.title ?? preset.title,
        stopName: arrivalStop?.stopName ?? resolvedStop?.stopName ?? preset.stopName,
        shortStopId:
          arrivalStop?.shortStopId ??
          resolvedStop?.shortStopId ??
          preset.shortStopId,
        directionLabel: arrivalStop?.directionLabel ?? preset.directionLabel,
        resolvedBstopId:
          arrivalStop?.resolvedBstopId ?? resolvedStop?.resolvedBstopId,
        lat: arrivalStop?.lat ?? resolvedStop?.lat,
        lng: arrivalStop?.lng ?? resolvedStop?.lng,
      };

      return result;
    },
    {} as Record<BusMode, StopViewModel>,
  );

  const distanceByMode = (Object.keys(STOP_PRESETS) as BusMode[]).reduce(
    (result, currentMode) => {
      result[currentMode] = getDistanceView(
        stopByMode[currentMode],
        userLocation,
        locationStatus,
      );

      return result;
    },
    {} as Record<BusMode, DistanceView>,
  );

  const renderedStop = stopByMode[mode];
  const selectedStopDistanceLabel = distanceByMode[mode].label;
  const isDataBusy = isLoading || isRefreshing;
  const isRefreshBusy = isDataBusy || locationStatus === "loading";

  const handleManualRefresh = useCallback(async () => {
    await Promise.all([
      requestArrivals(mode, "manual"),
      requestUserLocation(),
    ]);
  }, [mode, requestArrivals, requestUserLocation]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-8 pt-5">
      <div className="space-y-3">
        <header
          className={cn(
            "glass-panel relative flex items-start justify-between gap-4 p-4",
          )}
        >
          <div className={cn("absolute inset-x-0 top-0 h-1 rounded-t-[22px]", theme.accentLine)} />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Commute Bus ETA
            </p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-white">
              출퇴근 버스 도착
            </h1>
            <p className={cn("mt-1 text-[12px] font-medium", theme.accentText)}>
              {activeData
                ? `${formatUpdatedAt(activeData.updatedAt)} 업데이트`
                : "실시간 도착예정 조회"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleManualRefresh()}
            disabled={isRefreshBusy}
            className={cn(
              "rounded-xl border px-3 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
              theme.refreshButton,
            )}
          >
            {isRefreshing ? "갱신 중" : "새로고침"}
          </button>
        </header>

        <ModeSwitch
          activeMode={mode}
          distanceLabels={{
            commute: distanceByMode.commute.label,
            return: distanceByMode.return.label,
          }}
          disabled={isDataBusy}
          onChange={(nextMode) => {
            if (nextMode === mode) {
              return;
            }

            startTransition(() => {
              setMode(nextMode);
            });
          }}
        />

        <StopCard
          mode={mode}
          title={renderedStop.title}
          stopName={renderedStop.stopName}
          shortStopId={renderedStop.shortStopId}
          directionLabel={renderedStop.directionLabel}
          distanceLabel={selectedStopDistanceLabel}
          resolvedBstopId={renderedStop.resolvedBstopId}
        />

        {locationStatus !== "granted" && locationErrorMessage ? (
          <p className="px-1 text-[12px] text-slate-400">
            {locationErrorMessage}
          </p>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Arrival Board
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-white">
                가장 빨리 오는 순
              </h2>
            </div>
            <p className="text-[12px] font-medium text-slate-300">
              {activeData ? `${activeData.totalRoutes}개 노선` : ""}
            </p>
          </div>

          {isLoading ? <LoadingState /> : null}

          {!isLoading && error && !activeData ? (
            <ErrorState
              message={error.message}
              debugMessage={error.debugMessage}
            />
          ) : null}

          {!isLoading && !error && activeData && activeData.arrivals.length === 0 ? (
            <EmptyState stopName={activeData.stop.stopName} />
          ) : null}

          {!isLoading && activeData?.arrivals.length ? (
            <div className="space-y-4">
              {activeData.arrivals.map((group) => (
                <ArrivalCard key={group.routeKey} group={group} mode={mode} />
              ))}
            </div>
          ) : null}

          {!isLoading && error && activeData ? (
            <ErrorState
              message={error.message}
              debugMessage={error.debugMessage}
            />
          ) : null}
        </section>

        <SourceFooter />
      </div>
    </main>
  );
}
