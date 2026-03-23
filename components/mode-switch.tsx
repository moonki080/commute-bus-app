"use client";

import type { BusMode } from "@/types/bus";
import { STOP_PRESETS } from "@/lib/presets";
import { cn } from "@/lib/utils";

type ModeSwitchProps = {
  activeMode: BusMode;
  distanceLabels: Record<BusMode, string>;
  disabled?: boolean;
  onChange: (mode: BusMode) => void;
};

export function ModeSwitch({
  activeMode,
  distanceLabels,
  disabled = false,
  onChange,
}: ModeSwitchProps) {
  return (
    <div className="glass-panel p-1.5">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(STOP_PRESETS) as BusMode[]).map((mode) => {
          const preset = STOP_PRESETS[mode];
          const isActive = mode === activeMode;
          const activeTone =
            mode === "commute"
              ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-50"
              : "border-orange-300/35 bg-orange-400/12 text-orange-50";

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              disabled={disabled}
              className={cn(
                "rounded-[16px] border px-4 py-3 text-left transition duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                isActive
                  ? activeTone
                  : "border-white/10 bg-transparent text-slate-200 hover:border-white/20 hover:bg-white/5",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.16em]",
                  isActive
                    ? mode === "commute"
                      ? "text-cyan-100/80"
                      : "text-orange-100/80"
                    : "text-slate-400",
                )}
              >
                모드
              </div>
              <div
                className={cn(
                  "mt-1 font-display text-2xl font-bold tracking-tight",
                  isActive
                    ? mode === "commute"
                      ? "text-cyan-50"
                      : "text-orange-50"
                    : "text-white",
                )}
              >
                {preset.label}
              </div>
              <div
                className={cn(
                  "mt-1 min-h-8 text-[11px] leading-4",
                  isActive
                    ? mode === "commute"
                      ? "text-cyan-100/75"
                      : "text-orange-100/75"
                    : "text-slate-400",
                )}
              >
                <span className="block text-[10px] uppercase tracking-[0.14em]">
                  현재 거리
                </span>
                <span className="block">{distanceLabels[mode]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
