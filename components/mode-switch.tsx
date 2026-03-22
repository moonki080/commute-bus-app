"use client";

import type { BusMode } from "@/types/bus";
import { STOP_PRESETS } from "@/lib/presets";
import { cn } from "@/lib/utils";

type ModeSwitchProps = {
  activeMode: BusMode;
  disabled?: boolean;
  onChange: (mode: BusMode) => void;
};

export function ModeSwitch({
  activeMode,
  disabled = false,
  onChange,
}: ModeSwitchProps) {
  return (
    <div className="glass-panel p-2">
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(STOP_PRESETS) as BusMode[]).map((mode) => {
          const preset = STOP_PRESETS[mode];
          const isActive = mode === activeMode;
          const activeTone =
            mode === "commute"
              ? "border-cyan-300/80 bg-gradient-to-br from-cyan-300/50 via-sky-300/34 to-white/20 text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.28)]"
              : "border-rose-300/80 bg-gradient-to-br from-rose-300/48 via-orange-300/38 to-white/20 text-slate-950 shadow-[0_18px_45px_rgba(251,146,60,0.24)]";

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              disabled={disabled}
              className={cn(
                "rounded-[24px] border px-5 py-5 text-left transition duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                isActive
                  ? activeTone
                  : "border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/20",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div
                className={cn(
                  "text-[13px] font-semibold",
                  isActive ? "text-slate-700" : "text-slate-200/80",
                )}
              >
                빠른 전환
              </div>
              <div
                className={cn(
                  "mt-2 font-display text-[34px] font-bold tracking-tight",
                  isActive ? "text-slate-950" : "text-white",
                )}
              >
                {preset.label}
              </div>
              <div
                className={cn(
                  "mt-2 text-xs",
                  isActive ? "text-slate-700" : "text-slate-200/75",
                )}
              >
                {preset.distanceLabel} 도보 · {preset.stopName}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
