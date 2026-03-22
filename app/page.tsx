"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { ArrivalCard } from "@/components/arrival-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ModeSwitch } from "@/components/mode-switch";
import { StopCard } from "@/components/stop-card";
import { DEFAULT_MODE, STOP_PRESETS } from "@/lib/presets";
import { formatUpdatedAt } from "@/lib/utils";
import type {
  ApiErrorPayload,
  ArrivalsApiResponse,
  BusMode,
} from "@/types/bus";

const AUTO_REFRESH_MS = 30_000;

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
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-10 pt-6">
      <div className="space-y-4">
        <header className="glass-panel flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Commute Bus ETA
            </p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-white">
              출퇴근 버스 도착
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {activeData
                ? `${formatUpdatedAt(activeData.updatedAt)} 기준 갱신`
                : "실시간 도착예정 조회"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void requestArrivals(mode, "manual")}
            disabled={isBusy}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Arrival Board
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                가장 빨리 오는 순
              </h2>
            </div>
            <p className="text-sm text-zinc-400">
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
                <ArrivalCard key={group.routeKey} group={group} />
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
