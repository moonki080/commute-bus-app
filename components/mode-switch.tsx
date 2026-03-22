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

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              disabled={disabled}
              className={cn(
                "rounded-[22px] border px-5 py-5 text-left transition duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                isActive
                  ? "border-rose-400/60 bg-gradient-to-br from-rose-500/30 via-rose-400/18 to-orange-300/15 shadow-glow"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="text-[13px] font-medium text-zinc-400">
                빠른 전환
              </div>
              <div className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
                {preset.label}
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                {preset.distanceLabel} 도보
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
