// メニューのジャンル・コース種別の共通定義（PM通常商品マスタ §4-1 準拠）。
// メニュー管理フォームの選択肢として使う。menu-colors.ts の MENU_COLOR_OPTIONS と同じ定数パターン。

// ジャンル選択肢（PM §4-1 列挙の18種）。先頭の "" は「未設定」。
export const GENRE_OPTIONS: { key: string; label: string }[] = [
  { key: "", label: "未設定" },
  { key: "整体", label: "整体" },
  { key: "リンパ", label: "リンパ" },
  { key: "足つぼ", label: "足つぼ" },
  { key: "カイロ", label: "カイロ" },
  { key: "ヘッドスパ", label: "ヘッドスパ" },
  { key: "タイ", label: "タイ" },
  { key: "アロマ", label: "アロマ" },
  { key: "オイル", label: "オイル" },
  { key: "妊婦", label: "妊婦" },
  { key: "フェイシャル", label: "フェイシャル" },
  { key: "鍼灸", label: "鍼灸" },
  { key: "ブライダル", label: "ブライダル" },
  { key: "脱毛", label: "脱毛" },
  { key: "リラクゼーション", label: "リラクゼーション" },
  { key: "ストレッチ", label: "ストレッチ" },
  { key: "痩身", label: "痩身" },
  { key: "小顔", label: "小顔" },
  { key: "リフレ", label: "リフレ" }
];

// コース種別の選択肢（PM実態は「通常コース」のみ。将来拡張可）。
export const COURSE_TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: "通常コース", label: "通常コース" }
];

// 曜日（0=日〜6=土）。提供曜日トグルの表示用。
export const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "日" },
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" }
];
