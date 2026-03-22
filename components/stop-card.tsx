import { cn } from "@/lib/utils";

type StopCardProps = {
  title: string;
  stopName: string;
  shortStopId: string;
  directionLabel: string;
  distanceLabel: string;
  resolvedBstopId?: string;
};

export function StopCard({
  title,
  stopName,
  shortStopId,
  directionLabel,
  distanceLabel,
  resolvedBstopId,
}: StopCardProps) {
  return (
    <section className="glass-panel overflow-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-cyan-200/80">
            {title.toUpperCase()}
          </p>
          <h1 className="mt-3 max-w-[15ch] text-[30px] font-bold leading-[1.1] tracking-tight text-white">
            {stopName}
          </h1>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">
            도보 거리
          </div>
          <div className="metric-number mt-1 font-display text-2xl font-bold text-cyan-100">
            {distanceLabel}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="pill">정류소 {shortStopId}</span>
        <span className={cn("pill", "border-rose-300/20 bg-rose-300/10 text-rose-100")}>
          {directionLabel}
        </span>
      </div>

      {process.env.NODE_ENV === "development" && resolvedBstopId ? (
        <p className="mt-4 text-xs text-zinc-500">
          Runtime BSTOPID: {resolvedBstopId}
        </p>
      ) : null}
    </section>
  );
}
