// pm-staff-courses.txt（スタッフ→除外コース）から各スタッフの serviceMenuIds(svc-pm) を生成し、
// mock-data.ts に STAFF_COURSE_MAP を注入＋ initialStaff の serviceMenuIds を割当に差し替える。
// svc-pm ID は gen-pm-courses.mjs と同一ソートで再現する。
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = process.cwd() + "/";
const rows = JSON.parse(readFileSync(ROOT + "docs/reference/pm-courses.json", "utf8"));

const CAT_ORDER = ["ボディケア","ヘッド・頭ほぐし","特別・スペシャル","寄附金付き","インバウンド","外国人向け","マタニティ","鍼","シャンプー","出張","HPB","ClassPass","TORICOM","その他"];
rows.sort((a, b) => (CAT_ORDER.indexOf(a.appCat) - CAT_ORDER.indexOf(b.appCat)) || (a.price - b.price) || a.name.localeCompare(b.name, "ja"));

// svc-pm 割当（gen-pm-courses.mjs と一致）。各 svc に key=name||price と stores を持たせる。
const svc = rows.map((r, idx) => ({ id: "svc-pm-" + String(idx + 1).padStart(4, "0"), key: r.name + "||" + r.price, stores: r.stores }));
// 店舗 → その店舗で提供する svc 一覧
const storeSvc = {};
for (const s of svc) for (const st of s.stores) (storeSvc[st] = storeSvc[st] || []).push(s);

// 全 svc key 集合（除外キーの突合チェック用）
const allKeys = new Set(svc.map((s) => s.key));

const lines = readFileSync(ROOT + "docs/reference/pm-staff-courses.txt", "utf8").split("\n").filter((l) => l.trim());
const map = {};          // "storeId#order" -> [svcId]
let partial = 0, unmatchedExcluded = 0;
for (const line of lines) {
  const [storeId, order, rest] = line.split("\t");
  if (!storeId || !order || !rest) continue;
  if (rest.trim() === "ALL") continue; // 全コース対応 → serviceMenuIds=[]（既定）
  const excluded = new Set(rest.split(";;").map((s) => s.trim()).filter(Boolean));
  for (const k of excluded) if (!allKeys.has(k)) unmatchedExcluded++;
  const store = storeSvc[storeId] || [];
  const included = store.filter((s) => !excluded.has(s.key)).map((s) => s.id);
  map[storeId + "#" + order] = included;
  partial++;
}

// STAFF_COURSE_MAP の TS（partial スタッフのみ）
const entries = Object.entries(map).map(([k, ids]) => `  ${JSON.stringify(k)}: [${ids.map((i) => JSON.stringify(i)).join(", ")}]`);
const mapBlock =
  `// PM準拠: スタッフ×対応コース（一部のみ提供のスタッフだけ列挙。未掲載=全コース対応）。2026-06-21\n` +
  `// キー = "storeId#表示順序"。値 = 提供する svc-pm の id。生成: scripts/gen-staff-courses.mjs\n` +
  `const STAFF_COURSE_MAP: Record<string, string[]> = {\n${entries.join(",\n")}\n};`;

const path = ROOT + "features/master-data/mock-data.ts";
let content = readFileSync(path, "utf8");
const before = content;

// 1) initialStaff 宣言の直前に STAFF_COURSE_MAP を挿入（既存があれば置換）
if (content.includes("const STAFF_COURSE_MAP:")) {
  content = content.replace(/\/\/ PM準拠: スタッフ×対応コース[\s\S]*?const STAFF_COURSE_MAP: Record<string, string\[\]> = \{[\s\S]*?\n\};/, () => mapBlock);
} else {
  content = content.replace(/export const initialStaff: StaffMember\[\] =/, () => mapBlock + "\n\nexport const initialStaff: StaffMember[] =");
}
// 2) serviceMenuIds の割当に差し替え
content = content.replace(
  /serviceMenuIds: \[\], \/\/ 対応コースは後でコースマスタと紐づけ（未選択=全コース対応）/,
  'serviceMenuIds: STAFF_COURSE_MAP[`${s.storeId}#${s.order}`] ?? [], // PM準拠の対応コース（未掲載=全コース対応）'
);

if (content === before) throw new Error("置換に失敗（アンカー不一致）");
writeFileSync(path, content);

console.log("PARTIAL_STAFF=" + partial + " (ALL staff omitted) UNMATCHED_EXCLUDED_KEYS=" + unmatchedExcluded);
console.log("SAMPLE motomachi#7 included=" + (map["store-motomachi-chukagai-plus#7"]?.length ?? "n/a") + " / store total=" + (storeSvc["store-motomachi-chukagai-plus"]?.length ?? 0));
console.log("SAMPLE kinshicho#1 included=" + (map["store-kinshicho#1"]?.length ?? "n/a") + " / store total=" + (storeSvc["store-kinshicho"]?.length ?? 0));
