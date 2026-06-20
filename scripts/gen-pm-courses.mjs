// PMコースJSON（docs/reference/pm-courses.json）から initialCategories / initialServices を生成し
// features/master-data/mock-data.ts の該当配列を差し替える。時間（分）は名前から推定し直す。
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = process.cwd() + "/";
const rows = JSON.parse(readFileSync(ROOT + "docs/reference/pm-courses.json", "utf8"));
if (!Array.isArray(rows) || rows.length === 0) throw new Error("pm-courses.json が空です");

const CAT_ORDER = ["ボディケア","ヘッド・頭ほぐし","特別・スペシャル","寄附金付き","インバウンド","外国人向け","マタニティ","鍼","シャンプー","出張","HPB","ClassPass","TORICOM","その他"];
const CAT_COLOR = {"ボディケア":"green","ヘッド・頭ほぐし":"violet","特別・スペシャル":"rose","寄附金付き":"amber","インバウンド":"sky","外国人向け":"teal","マタニティ":"pink","鍼":"stone","シャンプー":"sky","出張":"teal","HPB":"amber","ClassPass":"violet","TORICOM":"stone","その他":"stone"};

// 名前から施術時間（分）を推定。価格(¥/￥/円/→)は除外し、「N分」を優先、加算（＋）はsum。
function inferDuration(name) {
  let s = name.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
  s = s.replace(/[¥￥]\s*\d[\d,\.]*/g, " ").replace(/\d[\d,\.]*\s*円/g, " ").replace(/→\s*[¥￥]?\d[\d,\.]*/g, " ");
  const mins = [...s.matchAll(/(\d{1,3})\s*分/g)].map((m) => +m[1]).filter((n) => n >= 5 && n <= 240);
  let v;
  if (mins.length) {
    v = /[+＋]/.test(s) ? mins.reduce((a, b) => a + b, 0) : Math.max(...mins);
  } else {
    const mm = s.match(/(\d{1,3})\s*min/i);
    if (mm && +mm[1] >= 5 && +mm[1] <= 240) v = +mm[1];
    else {
      const any = [...s.matchAll(/(\d{2,3})/g)].map((m) => +m[1]).filter((n) => n >= 10 && n <= 240);
      v = any.length ? any[0] : 60;
    }
  }
  if (!(v >= 15 && v <= 240)) v = 60;
  return v;
}

// カテゴリ順→価格→名前で安定ソート
rows.sort((a, b) => (CAT_ORDER.indexOf(a.appCat) - CAT_ORDER.indexOf(b.appCat)) || (a.price - b.price) || a.name.localeCompare(b.name, "ja"));

// サービス行（レガシー service-001/002 は保持して先頭に置く）
const legacy = [
  `  { id: "service-001", name: "ボディケア 60分", durationMinutes: 60, price: 8800, category: "ボディケア", sortOrder: 0, isActive: true, requiresPrivateRoom: false },`,
  `  { id: "service-002", name: "フェイシャル 45分", durationMinutes: 45, price: 9900, category: "フェイシャル", sortOrder: 0, isActive: true, requiresPrivateRoom: false },`
];
let i = 0;
const svcLines = rows.map((r) => {
  i += 10;
  const id = "svc-pm-" + String(i / 10).padStart(4, "0");
  const dur = inferDuration(r.name);
  const sids = r.stores.map((s) => JSON.stringify(s)).join(", ");
  return `  { id: ${JSON.stringify(id)}, name: ${JSON.stringify(r.name)}, durationMinutes: ${dur}, price: ${r.price}, category: ${JSON.stringify(r.appCat)}, sortOrder: ${i}, isActive: true, requiresPrivateRoom: false, onlineBooking: ${!!r.online}, storeScope: "selected", storeIds: [${sids}] },`;
});
// 末尾カンマを除去
svcLines[svcLines.length - 1] = svcLines[svcLines.length - 1].replace(/,\s*$/, "");

const usedCats = [...new Set(rows.map((r) => r.appCat))].sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));
const catLines = usedCats.map((c, idx) =>
  `  { id: "category-pm-${String(idx + 1).padStart(3, "0")}", name: ${JSON.stringify(c)}, sortOrder: ${(idx + 1) * 10}, color: ${JSON.stringify(CAT_COLOR[c] || "stone")}, isActive: true }`
);

const catsBlock = `export const initialCategories: MenuCategory[] = [\n${catLines.join(",\n")}\n];`;
const svcsBlock = `export const initialServices: ServiceMenu[] = [\n  // --- PM実データ（7店舗・全カテゴリ ${rows.length}件）2026-06-21 ---\n${legacy.join("\n")}\n${svcLines.join("\n")}\n];`;

const path = ROOT + "features/master-data/mock-data.ts";
let content = readFileSync(path, "utf8");
const before = content;
content = content.replace(/export const initialCategories: MenuCategory\[\] = \[[\s\S]*?\n\];/, () => catsBlock);
content = content.replace(/export const initialServices: ServiceMenu\[\] = \[[\s\S]*?\n\];/, () => svcsBlock);
if (content === before) throw new Error("置換に失敗（アンカー不一致）");
writeFileSync(path, content);

const byCat = {};
rows.forEach((r) => (byCat[r.appCat] = (byCat[r.appCat] || 0) + 1));
console.log("SERVICES=" + rows.length + " (+2 legacy) CATEGORIES=" + usedCats.length);
console.log("BYCAT=" + JSON.stringify(byCat));
