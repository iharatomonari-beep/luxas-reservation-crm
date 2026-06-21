// PMオプションCSV → initialOptions を生成する補助スクリプト。
// 入力: docs/reference/pm-options.csv（CP932→UTF-8変換済み）
// 方針:
//  - 有効フラグ=有効 のみ。現役7店舗 + 本部 のみ（Fudan-Ism/新橋/L溝の口 は除外）。
//  - ServiceOption は店舗スコープを持たないため、名前+税込価格で重複排除して全店共通の1件にまとめる。
//  - kind 判定: 名前に「延長」→extension（分数=施術時間 or 名前の「N分」）／名前に N% →discount（率=N）／他=other。
//  - 表示順は kind→名前で安定ソートし 10 刻みで振り直す。
// 使い方: node scripts/gen-pm-options.mjs  → mock-data.ts の initialOptions を直接置換。

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

function isAdoptedStore(s) {
  s = s || "";
  if (s.includes("本部")) return true;
  if (s.includes("渋谷")) return true;
  if (s.includes("錦糸町")) return true;
  if (s.includes("中目黒")) return true;
  if (s.includes("五反田東")) return true;
  if (s.includes("五反田西")) return true;
  if (s.includes("横浜元町") || s.includes("元町中華街")) return true;
  if (s.includes("プレミアム") && s.includes("溝の口")) return true;
  return false;
}

// 列index: 2=カテゴリ 3=名前 5=店舗 6=税込 13=施術時間 21=オンライン端末 26=有効フラグ
const rows = parseCSV(fs.readFileSync("docs/reference/pm-options.csv", "utf8")).slice(1).filter((r) => r.length >= 27);

const seen = new Map();
for (const r of rows) {
  if (r[26] !== "有効") continue;
  if (!isAdoptedStore(r[5])) continue;
  const name = (r[3] || "").trim();
  const price = Number(r[6]);
  if (!name || !Number.isFinite(price)) continue;
  const key = `${name}|${price}`;
  if (seen.has(key)) continue;
  const category = (r[2] || "").trim() || "オプション";
  const dur = Number(r[13]) || 0;
  const online = r[21] === "有効";
  seen.set(key, { name, price, category, dur, online });
}

function classify(name, dur) {
  if (name.includes("延長")) {
    const m = dur > 0 ? dur : Number(name.match(/(\d+)\s*分/)?.[1]);
    return { kind: "extension", extensionMinutes: Number.isFinite(m) && m > 0 ? m : undefined };
  }
  const pct = name.match(/(\d+)\s*[%％]/);
  if (pct) return { kind: "discount", discountPercent: Number(pct[1]) };
  return { kind: "other" };
}

const kindRank = { extension: 0, discount: 1, other: 2 };
const opts = [...seen.values()]
  .map((o) => ({ ...o, ...classify(o.name, o.dur) }))
  .sort((a, b) => (kindRank[a.kind] - kindRank[b.kind]) || a.name.localeCompare(b.name, "ja"));

const pad4 = (n) => String(n).padStart(4, "0");
const esc = (s) => s.replace(/"/g, '\\"');

const lines = opts.map((o, idx) => {
  const parts = [
    `id: "option-pm-${pad4(idx + 1)}"`,
    `name: "${esc(o.name)}"`,
    `category: "${esc(o.category)}"`,
    `price: ${o.price}`,
    `sortOrder: ${(idx + 1) * 10}`,
    `onlineBookable: ${o.online}`,
    `kind: "${o.kind}"`
  ];
  if (o.kind === "extension" && o.extensionMinutes != null) parts.push(`extensionMinutes: ${o.extensionMinutes}`);
  if (o.kind === "discount" && o.discountPercent != null) parts.push(`discountPercent: ${o.discountPercent}`);
  parts.push("isActive: true");
  return `  { ${parts.join(", ")} }`;
}).join(",\n");

const block = `export const initialOptions: ServiceOption[] = [\n${lines}\n];`;

const MOCK = "features/master-data/mock-data.ts";
let src = fs.readFileSync(MOCK, "utf8");
src = src.replace(/export const initialOptions: ServiceOption\[\] = \[[\s\S]*?\n\];/, () => block);
fs.writeFileSync(MOCK, src);

const byKind = opts.reduce((a, o) => ((a[o.kind] = (a[o.kind] || 0) + 1), a), {});
console.log(`オプション ${opts.length}件を mock-data.ts に反映（延長${byKind.extension || 0} / 割引${byKind.discount || 0} / その他${byKind.other || 0}）。`);
