"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { ArrivalCard } from "@/components/arrival-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ModeSwitch } from "@/components/mode-switch";
import { StopCard } from "@/components/stop-card";
import { DEFAULT_MODE, STOP_PRESETS } from "@/lib/presets";
import { cn, formatUpdatedAt } from "@/lib/utils";
import type {
  ApiErrorPayload,
  ArrivalsApiResponse,
  BusMode,
} from "@/types/bus";

const AUTO_REFRESH_MS = 30_000;

const MODE_THEME: Record<
  BusMode,
  {
    shell: string;
    refreshButton: string;
    accentText: string;
    orbPrimary: string;
    orbSecondary: string;
  }
> = {
  commute: {
    shell: "from-cyan-300/14 via-sky-200/8 to-transparent",
    refreshButton:
      "border-cyan-200/45 bg-cyan-200/25 text-cyan-950 hover:bg-cyan-100/40",
    accentText: "text-cyan-50",
    orbPrimary: "bg-cyan-300/30",
    orbSecondary: "bg-sky-200/20",
  },
  return: {
    shell: "from-rose-300/14 via-orange-200/8 to-transparent",
    refreshButton:
      "border-orange-200/45 bg-orange-200/25 text-orange-950 hover:bg-orange-100/40",
    accentText: "text-orange-50",
    orbPrimary: "bg-rose-300/28",
    orbSecondary: "bg-orange-200/22",
  },
};

type ViewError = {
  message: string;
  debugMessage?: string;
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

export default function HomePage() {
  const [mode, setMode] = useState<BusMode>(DEFAULT_MODE);
  const [dataByMode, setDataByMode] = useState<
    Partial<Record<BusMode, ArrivalsApiResponse>>
  >({});
  const [error, setError] = useState<ViewError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const dataByModeRef = useRef<Partial<Record<BusMode, ArrivalsApiResponse>>>({});

  useEffect(() => {
    dataByModeRef.current = dataByMode;
  }, [dataByMode]);

  const activePreset = STOP_PRESETS[mode];
  const activeData = dataByMode[mode] ?? null;
  const theme = MODE_THEME[mode];

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
    void requestArrivals(
      mode,
      dataByModeRef.current[mode] ? "auto" : "initial",
    );

    return () => {
      abortRef.current?.abort();
    };
  }, [mode, requestArrivals]);

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

  const isBusy = isLoading || isRefreshing;
  const renderedStop = activeData?.stop ?? {
    title: activePreset.title,
    stopName: activePreset.stopName,
    shortStopId: activePreset.shortStopId,
    directionLabel: activePreset.directionLabel,
    distanceLabel: activePreset.distanceLabel,
    resolvedBstopId: undefined,
  };

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden px-4 pb-10 pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64">
        <div className={cn("absolute -left-10 top-2 h-40 w-40 rounded-full blur-3xl", theme.orbPrimary)} />
        <div className={cn("absolute right-0 top-10 h-44 w-44 rounded-full blur-3xl", theme.orbSecondary)} />
      </div>

      <div className="relative space-y-4">
        <header
          className={cn(
            "glass-panel flex items-start justify-between gap-4 bg-gradient-to-br p-5",
            theme.shell,
          )}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-100/80">
              Commute Bus ETA
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-white">
              출퇴근 버스 도착
            </h1>
            <p className={cn("mt-2 text-sm font-medium", theme.accentText)}>
              {activeData
                ? `${formatUpdatedAt(activeData.updatedAt)} 기준 갱신`
                : "실시간 도착예정 조회"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void requestArrivals(mode, "manual")}
            disabled={isBusy}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
              theme.refreshButton,
            )}
          >
            {isRefreshing ? "갱신 중" : "새로고침"}
          </button>
        </header>

        <ModeSwitch
          activeMode={mode}
          disabled={isBusy}
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
          distanceLabel={renderedStop.distanceLabel}
          resolvedBstopId={renderedStop.resolvedBstopId}
        />

        <section className="space-y-3">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-100/80">
                Arrival Board
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                가장 빨리 오는 순
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-100/85">
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
      </div>
    </main>
  );
}
