import type { BusMode, StopPreset } from "@/types/bus";

export const STOP_PRESETS: Record<BusMode, StopPreset> = {
  commute: {
    mode: "commute",
    label: "출근",
    title: "출근 정류장",
    stopName: "신검단중앙역풍경채어바니티2차",
    shortStopId: "89579",
    directionLabel: "신검단중학교 방면",
  },
  return: {
    mode: "return",
    label: "퇴근",
    title: "퇴근 정류장",
    stopName: "신검단중앙역2번출구",
    shortStopId: "89588",
    directionLabel: "신검단중앙역풍경채어바니티 방면",
  },
};

export const ALLOWED_ROUTE_LABELS_BY_MODE: Record<BusMode, readonly string[]> = {
  commute: ["1", "76", "991", "인천e음88"],
  return: ["1", "76", "991", "인천e음88", "9902"],
};

export const DEFAULT_MODE: BusMode = "commute";

export function isBusMode(value: string | null | undefined): value is BusMode {
  return value === "commute" || value === "return";
}

export function getPreset(mode: BusMode): StopPreset {
  return STOP_PRESETS[mode];
}
