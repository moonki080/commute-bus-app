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
          eyebrow: "text-cyan-100",
          badge:
            "border-cyan-200/45 bg-cyan-200/28 text-cyan-950 shadow-[0_10px_28px_rgba(34,211,238,0.16)]",
          direction: "border-cyan-200/40 bg-cyan-200/18 text-cyan-50",
          panel:
            "bg-gradient-to-br from-cyan-300/18 via-sky-200/12 to-white/12",
        }
      : {
          eyebrow: "text-orange-100",
          badge:
            "border-orange-200/45 bg-orange-200/28 text-orange-950 shadow-[0_10px_28px_rgba(251,146,60,0.16)]",
          direction: "border-rose-200/40 bg-rose-200/18 text-rose-50",
          panel:
            "bg-gradient-to-br from-rose-300/18 via-orange-200/12 to-white/12",
        };

  return (
    <section className={cn("glass-panel overflow-hidden p-6", theme.panel)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-xs font-semibold tracking-[0.18em]", theme.eyebrow)}>
            {title.toUpperCase()}
          </p>
          <h1 className="mt-3 max-w-[15ch] text-[32px] font-bold leading-[1.1] tracking-tight text-white">
            {stopName}
          </h1>
        </div>
        <div className={cn("rounded-full border px-4 py-2 text-right", theme.badge)}>
          <div className="text-[11px] uppercase tracking-[0.16em]">
            도보 거리
          </div>
          <div className="metric-number mt-1 font-display text-2xl font-bold">
            {distanceLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="pill">정류소 {shortStopId}</span>
        <span className={cn("pill", theme.direction)}>
          {directionLabel}
        </span>
      </div>

      {process.env.NODE_ENV === "development" && resolvedBstopId ? (
        <p className="mt-4 text-xs text-slate-200/70">
          Runtime BSTOPID: {resolvedBstopId}
        </p>
      ) : null}
    </section>
  );
}
