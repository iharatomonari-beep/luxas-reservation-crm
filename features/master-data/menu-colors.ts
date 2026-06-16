// メニュー色（予約カード配色）の共通定義（T066）。
// メニューごとに color キーを設定でき、予約カード背景に使う。
// 会計済み（paid）はメニュー色より優先してグレー表示。未設定はデフォルト色。
// Tailwind の content スキャンに載せるため、クラス名は必ずリテラルで持つ。

export type MenuColorStyle = { bg: string; text: string; border: string; swatch: string };

// 色キー → カード配色（薄い背景＋読みやすい濃色文字＋枠線）＋一覧スウォッチ。
const MENU_COLOR_STYLES: Record<string, MenuColorStyle> = {
  green: { bg: "bg-luxas-mist", text: "text-luxas-ink", border: "border-luxas-green/50", swatch: "bg-luxas-green" },
  rose: { bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-300", swatch: "bg-rose-500" },
  sky: { bg: "bg-sky-50", text: "text-sky-900", border: "border-sky-300", swatch: "bg-sky-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-300", swatch: "bg-amber-500" },
  violet: { bg: "bg-violet-50", text: "text-violet-900", border: "border-violet-300", swatch: "bg-violet-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-900", border: "border-teal-300", swatch: "bg-teal-500" },
  stone: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300", swatch: "bg-stone-500" }
};

// メニュー管理画面の色セレクト用（順序つき）。
export const MENU_COLOR_OPTIONS: { key: string; label: string }[] = [
  { key: "", label: "デフォルト" },
  { key: "green", label: "グリーン" },
  { key: "rose", label: "ローズ" },
  { key: "sky", label: "スカイ" },
  { key: "amber", label: "アンバー" },
  { key: "violet", label: "バイオレット" },
  { key: "teal", label: "ティール" },
  { key: "stone", label: "ストーン" }
];

// 色未設定（デフォルト）の配色。
const DEFAULT_STYLE: MenuColorStyle = { bg: "bg-white", text: "text-luxas-ink", border: "border-luxas-line", swatch: "bg-stone-300" };
// 会計済み（paid）の配色（メニュー色より優先）。
const PAID_STYLE: MenuColorStyle = { bg: "bg-stone-200", text: "text-stone-600", border: "border-stone-300", swatch: "bg-stone-400" };

/** 色キーから配色を返す（未設定/未知はデフォルト）。 */
export function menuColorStyle(colorKey?: string): MenuColorStyle {
  if (colorKey && MENU_COLOR_STYLES[colorKey]) {
    return MENU_COLOR_STYLES[colorKey];
  }
  return DEFAULT_STYLE;
}

/**
 * 予約カードの配色を決める（T066）。
 * paid=true なら常にグレー優先。それ以外はメニュー色（未設定はデフォルト）。
 */
export function reservationCardStyle(colorKey: string | undefined, paid: boolean): MenuColorStyle {
  if (paid) {
    return PAID_STYLE;
  }
  return menuColorStyle(colorKey);
}
