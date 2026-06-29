export function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function isBlank(value: string) {
  return value.trim().length === 0;
}

export function normalizeText(value?: string | null) {
  // undefined/null でも落ちないようにする（DB由来やオンライン予約で欠損し得るため）。
  return (value ?? "").trim();
}

// 利用者/店舗が入力したURLを表示・遷移に使う前に、http(s) スキームのみ許可する（XSS対策）。
// javascript:, data:, vbscript: などのスキームや不正値は null を返す（許可リスト方式）。
// スキーム省略（例: "luxas.jp"）は https:// を補う。コロンを含む文字列はスキーム指定とみなし補完しない
// （"javascript:..." 等が https:// 補完で素通りするのを防ぐ）。
export function safeHttpUrl(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  const candidate = hasScheme || trimmed.includes(":") ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function compareBySortOrder<T extends { sortOrder?: number }>(left: T, right: T) {
  return (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER);
}
