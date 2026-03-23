import type { ArrivalGroup, BusMode } from "@/types/bus";
import { cn, getEtaStatusLabel } from "@/lib/utils";

type ArrivalCardProps = {
  group: ArrivalGroup;
  mode: BusMode;
};

function getTone(etaSec: number, mode: BusMode) {
  const modeTone =
    mode === "commute"
      ? {
          panel: "border-cyan-300/18",
          accent: "border-l-cyan-300",
          route: "text-white",
          eta: "text-cyan-100",
          meta: "text-cyan-100/80",
        }
      : {
          panel: "border-orange-300/18",
          accent: "border-l-orange-300",
          route: "text-white",
          eta: "text-orange-100",
          meta: "text-orange-100/80",
        };

  if (etaSec <= 60) {
    return {
      container: `${modeTone.panel} ${modeTone.accent}`,
      routeText: modeTone.route,
      primaryText: "text-rose-200",
      metaText: modeTone.meta,
      badge: "border-rose-300/25 bg-rose-400/12 text-rose-100",
    };
  }

  if (etaSec <= 180) {
    return {
      container: `${modeTone.panel} ${modeTone.accent}`,
      routeText: modeTone.route,
      primaryText: "text-amber-100",
      metaText: modeTone.meta,
      badge: "border-amber-300/25 bg-amber-400/12 text-amber-100",
    };
  }

  return {
    container: `${modeTone.panel} ${modeTone.accent}`,
    routeText: modeTone.route,
    primaryText: modeTone.eta,
    metaText: modeTone.meta,
    badge: "border-white/10 bg-slate-800/80 text-slate-100",
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
    <article className={cn("soft-panel border border-l-4 p-4", tone.container)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className={cn(
              "metric-number truncate font-display text-[34px] font-bold tracking-[-0.04em]",
              tone.routeText,
            )}
          >
            {group.routeNo}
          </h2>
          {first.latestStopName ? (
            <p className={cn("mt-1 text-[12px]", tone.metaText)}>
              최근 통과 {first.latestStopName}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          {statusLabel ? (
            <div className={cn("pill mb-2", tone.badge)}>{statusLabel}</div>
          ) : null}
          <div className={cn("metric-number font-display text-[26px] font-bold", tone.primaryText)}>
            {first.etaMinText}
          </div>
          <div className={cn("metric-number mt-1 text-[11px]", tone.metaText)}>
            {first.etaExactText}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
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
          <span className="pill border-amber-300/20 bg-amber-400/10 text-amber-100">
            막차
          </span>
        ) : null}
      </div>
    </article>
  );
}
