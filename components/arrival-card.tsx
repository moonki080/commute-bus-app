import type { ArrivalGroup } from "@/types/bus";
import { cn, getEtaStatusLabel } from "@/lib/utils";

type ArrivalCardProps = {
  group: ArrivalGroup;
};

function getTone(etaSec: number) {
  if (etaSec <= 60) {
    return {
      container:
        "border-rose-400/40 bg-gradient-to-br from-rose-500/22 via-rose-400/12 to-orange-300/10",
      primaryText: "text-rose-300",
      badge: "border-rose-300/25 bg-rose-300/15 text-rose-100",
    };
  }

  if (etaSec <= 180) {
    return {
      container:
        "border-orange-300/35 bg-gradient-to-br from-orange-300/18 via-orange-200/7 to-transparent",
      primaryText: "text-orange-200",
      badge: "border-orange-200/25 bg-orange-200/10 text-orange-100",
    };
  }

  return {
    container: "border-white/10 bg-white/[0.03]",
    primaryText: "text-zinc-100",
    badge: "border-white/10 bg-white/5 text-zinc-200",
  };
}

export function ArrivalCard({ group }: ArrivalCardProps) {
  const first = group.first;
  const second = group.second;

  if (!first) {
    return null;
  }

  const tone = getTone(first.etaSec);
  const statusLabel = getEtaStatusLabel(first.etaSec);

  return (
    <article className={cn("soft-panel border p-5", tone.container)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Route
          </p>
          <h2 className="metric-number mt-2 truncate font-display text-4xl font-bold tracking-tight text-white">
            {group.routeNo}
          </h2>
        </div>

        <div className="text-right">
          {statusLabel ? (
            <div className={cn("pill mb-2", tone.badge)}>{statusLabel}</div>
          ) : null}
          <div className={cn("metric-number font-display text-4xl font-bold", tone.primaryText)}>
            {first.etaMinText}
          </div>
          <div className="metric-number mt-1 text-xs text-zinc-400">
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
        <p className="mt-4 text-sm text-zinc-300">
          최근 통과: {first.latestStopName}
        </p>
      ) : null}
    </article>
  );
}
