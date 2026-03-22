import type { ArrivalGroup, BusMode } from "@/types/bus";
import { cn, getEtaStatusLabel } from "@/lib/utils";

type ArrivalCardProps = {
  group: ArrivalGroup;
  mode: BusMode;
};

function getTone(etaSec: number, mode: BusMode) {
  const modePanel =
    mode === "commute"
      ? "from-cyan-300/18 via-sky-200/14 to-white/10"
      : "from-rose-300/18 via-orange-200/14 to-white/10";

  if (etaSec <= 60) {
    return {
      container:
        `border-rose-300/55 bg-gradient-to-br ${modePanel} from-rose-200/28 via-orange-200/20 to-white/10`,
      routeText: mode === "commute" ? "text-cyan-50" : "text-rose-50",
      primaryText: "text-rose-100",
      badge: "border-rose-200/45 bg-rose-200/28 text-rose-950",
    };
  }

  if (etaSec <= 180) {
    return {
      container:
        `border-orange-200/55 bg-gradient-to-br ${modePanel} from-orange-200/24 via-amber-100/18 to-white/10`,
      routeText: mode === "commute" ? "text-cyan-50" : "text-orange-50",
      primaryText: "text-orange-50",
      badge: "border-orange-100/55 bg-orange-100/38 text-orange-950",
    };
  }

  return {
    container: `border-white/20 bg-gradient-to-br ${modePanel}`,
    routeText: mode === "commute" ? "text-cyan-50" : "text-orange-50",
    primaryText: mode === "commute" ? "text-cyan-50" : "text-orange-50",
    badge: "border-white/30 bg-white/35 text-slate-900",
  };
}

export function ArrivalCard({ group, mode }: ArrivalCardProps) {
  const first = group.first;
  const second = group.second;

  if (!first) {
    return null;
  }

  const tone = getTone(first.etaSec, mode);
  const statusLabel = getEtaStatusLabel(first.etaSec);

  return (
    <article className={cn("soft-panel border p-5", tone.container)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200/80">
            Route
          </p>
          <h2
            className={cn(
              "metric-number mt-2 truncate font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl",
              tone.routeText,
            )}
          >
            {group.routeNo}
          </h2>
        </div>

        <div className="shrink-0 text-right">
          {statusLabel ? (
            <div className={cn("pill mb-2", tone.badge)}>{statusLabel}</div>
          ) : null}
          <div className={cn("metric-number font-display text-3xl font-bold", tone.primaryText)}>
            {first.etaMinText}
          </div>
          <div className="metric-number mt-1 text-xs text-slate-100/80">
            {first.etaExactText}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {second ? (
          <span className="pill">다음 {second.etaMinText}</span>
        ) : (
          <span className="pill">다음 차량 정보 없음</span>
        )}
        {typeof first.remainingStops === "number" ? (
          <span className="pill">남은 {first.remainingStops}정거장</span>
        ) : null}
        <span className="pill">혼잡도 {first.congestion}</span>
        {first.lowFloor ? <span className="pill">저상버스</span> : null}
        {first.lastBus ? (
          <span className="pill border-amber-300/25 bg-amber-300/10 text-amber-100">
            막차
          </span>
        ) : null}
      </div>

      {first.latestStopName ? (
        <p className="mt-4 text-sm text-slate-100/90">
          최근 통과: {first.latestStopName}
        </p>
      ) : null}
    </article>
  );
}
