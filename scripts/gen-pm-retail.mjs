// PM物販CSV → initialRetailCategories / initialRetailItems を生成する補助スクリプト。
// 入力: docs/reference/pm-retail-items.csv（CP932→UTF-8変換済み）, pm-retail-categories.csv
// 方針:
//  - 有効フラグ=有効 のみ。
//  - 現役7店舗 + 本部 の商品のみ（閉店/別ブランド = Fudan-Ism/新橋/L溝の口 は除外）。
//  - RetailItem は店舗スコープを持たない型のため、物販名+税込価格で重複排除して全店共通の1件にまとめる。
//  - カテゴリは商品の「物販カテゴリ」列。空は「物販」にフォールバック。
//  - 表示順は重複排除後に カテゴリ→名前 で安定ソートし 10 刻みで振り直す。
// 使い方: node scripts/gen-pm-retail.mjs  → 標準出力の2配列を mock-data.ts に貼る。

import fs from "node:fs";

function parseCSV(t) {
  const rows = [];
  let f = "", row = [], q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && t[i + 1] === "\n") i++;
        if (f !== "" || row.length) { row.push(f); rows.push(row); row = []; f = ""; }
      } else f += c;
    }
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

// 店舗名（PM表記）→ 現役7店舗の判定。本部=全店共通として採用。現役外は null（除外）。
function isAdoptedStore(storeName) {
  const s = storeName || "";
  if (s.includes("本部")) return true;
  if (s.includes("渋谷")) return true;
  if (s.includes("錦糸町")) return true;
  if (s.includes("中目黒")) return true;
  if (s.includes("五反田東")) return true;
  if (s.includes("五反田西")) return true;
  if (s.includes("横浜元町") || s.includes("元町中華街")) return true;
  // 「溝の口」はプレミアム溝の口のみ採用。「L 溝の口（ラクサスエル）」は別店舗で除外。
  if (s.includes("プレミアム") && s.includes("溝の口")) return true;
  return false; // Fudan-Ism / 新橋 / L溝の口 など
}

const itemRows = parseCSV(fs.readFileSync("docs/reference/pm-retail-items.csv", "utf8")).slice(1).filter((r) => r.length >= 16);

// 有効 & 採用店舗のみ。物販名+税込価格で重複排除。
const seen = new Map();
for (const r of itemRows) {
  const active = r[15] === "有効";
  if (!active) continue;
  if (!isAdoptedStore(r[5])) continue;
  const name = (r[3] || "").trim();
  const price = Number(r[8]);
  if (!name || !Number.isFinite(price)) continue;
  const category = (r[6] || "").trim() || "物販";
  const key = `${name}|${price}`;
  if (!seen.has(key)) seen.set(key, { name, price, category });
}

const items = [...seen.values()].sort((a, b) =>
  a.category === b.category ? a.name.localeCompare(b.name, "ja") : a.category.localeCompare(b.category, "ja")
);

// カテゴリは商品由来の集合。
const categoryNames = [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b, "ja"));

const pad4 = (n) => String(n).padStart(4, "0");
const esc = (s) => s.replace(/"/g, '\\"');

const catLines = categoryNames
  .map((name, idx) => `  { id: "retail-cat-pm-${pad4(idx + 1)}", name: "${esc(name)}", sortOrder: ${(idx + 1) * 10}, isActive: true }`)
  .join(",\n");

const itemLines = items
  .map((it, idx) => `  { id: "retail-pm-${pad4(idx + 1)}", name: "${esc(it.name)}", category: "${esc(it.category)}", price: ${it.price}, sortOrder: ${(idx + 1) * 10}, isActive: true }`)
  .join(",\n");

const catBlock = `export const initialRetailCategories: RetailCategory[] = [\n${catLines}\n];`;
const itemBlock = `export const initialRetailItems: RetailItem[] = [\n${itemLines}\n];`;

// mock-data.ts の該当2配列を直接置換（配列内に "];" を含まない前提の非貪欲マッチ）。
const MOCK = "features/master-data/mock-data.ts";
let src = fs.readFileSync(MOCK, "utf8");
src = src.replace(/export const initialRetailCategories: RetailCategory\[\] = \[[\s\S]*?\n\];/, () => catBlock);
src = src.replace(/export const initialRetailItems: RetailItem\[\] = \[[\s\S]*?\n\];/, () => itemBlock);
fs.writeFileSync(MOCK, src);

console.log(`物販カテゴリ ${categoryNames.length}件 / 物販商品 ${items.length}件を mock-data.ts に反映しました。`);
