import type { BusMode } from "@/types/bus";
import { cn } from "@/lib/utils";

type StopCardProps = {
  mode: BusMode;
  title: string;
  stopName: string;
  shortStopId: string;
  directionLabel: string;
  distanceLabel: string;
  resolvedBstopId?: string;
};

export function StopCard({
  mode,
  title,
  stopName,
  shortStopId,
  directionLabel,
  distanceLabel,
  resolvedBstopId,
}: StopCardProps) {
  const theme =
    mode === "commute"
      ? {
          eyebrow: "text-cyan-200",
          badge:
            "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
          direction: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
        }
      : {
          eyebrow: "text-orange-200",
          badge:
            "border-orange-300/20 bg-orange-400/10 text-orange-100",
          direction: "border-orange-300/20 bg-orange-400/10 text-orange-100",
        };

  return (
    <section className="glass-panel overflow-hidden p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-[11px] font-semibold tracking-[0.18em]", theme.eyebrow)}>
            {title}
          </p>
          <h1 className="mt-2 max-w-[17ch] text-[24px] font-bold leading-[1.15] tracking-tight text-white">
            {stopName}
          </h1>
        </div>
        <div className={cn("rounded-full border px-3 py-2 text-right", theme.badge)}>
          <div className="text-[10px] uppercase tracking-[0.16em]">
            현재 직선 거리
          </div>
          <div
            className={cn(
              "mt-1 max-w-[96px] text-right leading-4",
              /\d/.test(distanceLabel)
                ? "metric-number font-display text-lg font-bold"
                : "text-[12px] font-semibold",
            )}
          >
            {distanceLabel}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="pill">정류소 {shortStopId}</span>
        <span className={cn("pill", theme.direction)}>
          {directionLabel}
        </span>
      </div>

      {process.env.NODE_ENV === "development" && resolvedBstopId ? (
        <p className="mt-3 text-[11px] text-slate-400">
          Runtime BSTOPID: {resolvedBstopId}
        </p>
      ) : null}
    </section>
  );
}
