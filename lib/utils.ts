import type { CongestionLevel } from "@/types/bus";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function safeString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).trim();
  return normalized;
}

export function safeNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function safeBoolean(
  value: unknown,
  truthy = ["Y", "y", "1", "true", "TRUE", "T"],
) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const normalized = safeString(value);
  return truthy.includes(normalized);
}

export function pickFirstValue(
  source: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (key in source && source[key] !== undefined && source[key] !== "") {
      return source[key];
    }
  }

  return undefined;
}

export function formatEtaMinText(etaSec: number) {
  if (etaSec <= 0) {
    return "곧 도착";
  }

  if (etaSec < 60) {
    return "1분 미만";
  }

  return `${Math.floor(etaSec / 60)}분`;
}

export function formatEtaExactText(etaSec: number) {
  if (etaSec <= 0) {
    return "곧 도착";
  }

  const minutes = Math.floor(etaSec / 60);
  const seconds = etaSec % 60;

  if (minutes === 0) {
    return `${seconds}초`;
  }

  if (seconds === 0) {
    return `${minutes}분`;
  }

  return `${minutes}분 ${seconds}초`;
}

export function getEtaStatusLabel(etaSec: number) {
  if (etaSec <= 60) {
    return "곧 도착";
  }

  if (etaSec <= 180) {
    return "임박";
  }

  return null;
}

export function mapCongestion(rawValue: unknown): CongestionLevel {
  const normalized = safeString(rawValue);

  if (!normalized) {
    return "정보없음";
  }

  if (["1", "여유", "원활", "쾌적"].includes(normalized)) {
    return "여유";
  }

  if (["2", "보통", "중간"].includes(normalized)) {
    return "보통";
  }

  if (["3", "혼잡", "복잡"].includes(normalized)) {
    return "혼잡";
  }

  return "정보없음";
}

export function formatUpdatedAt(value?: string) {
  if (!value) {
    return "갱신 대기 중";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "갱신 시각 확인 불가";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function devOnlyMessage(value?: string) {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  return value;
}
