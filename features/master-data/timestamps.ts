// マスタ監査項目（作成日 createdAt・最終更新日 updatedAt）の共通付与ヘルパ（T064.5）。
// 注意: useLocalCollection の読み込み・同期では使わない（読込/マウント/hydration で updatedAt を変えない）。
// 保存ボタン等の明示的な保存処理（handleSubmit）でのみ呼ぶこと。

type Stamped = { createdAt: string; updatedAt: string };

function nowIso(): string {
  return new Date().toISOString();
}

function readCreatedAt(value: unknown): string | undefined {
  if (value && typeof value === "object" && "createdAt" in value) {
    const created = (value as { createdAt?: unknown }).createdAt;
    return typeof created === "string" ? created : undefined;
  }
  return undefined;
}

/** 新規作成時: createdAt と updatedAt を現在時刻で付与する。 */
export function stampCreate<T extends object>(payload: T): T & Stamped {
  const ts = nowIso();
  return { ...payload, createdAt: ts, updatedAt: ts };
}

/**
 * 更新時: updatedAt を現在時刻に更新し、createdAt は保持する。
 * 既存レコードに createdAt が無い場合（旧データ）は、この保存時点で createdAt も補う。
 */
export function stampUpdate<T extends object>(payload: T, existing?: unknown): T & Stamped {
  const ts = nowIso();
  const createdAt = readCreatedAt(payload) ?? readCreatedAt(existing) ?? ts;
  return { ...payload, createdAt, updatedAt: ts };
}

/** 表示用フォーマット（"YYYY/MM/DD HH:mm"・JST）。未設定は「未記録」。 */
export function formatTimestamp(value?: string): string {
  if (!value) {
    return "未記録";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
