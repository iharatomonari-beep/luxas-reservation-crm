import type {
  CheckoutItem,
  CourseSet,
  CreditCardCompany,
  EmoneyBrand,
  MasterTag,
  MenuCategory,
  RetailCategory,
  RetailItem,
  RetailSale,
  ServiceMenu,
  ServiceOption,
  ServiceRoom,
  StaffMember,
  StaffShift
} from "@/features/master-data/types";
import type { Reservation } from "@/features/reservations/types";

export const staffStorageKey = "luxas-master-staff";
export const servicesStorageKey = "luxas-master-services";
export const roomsStorageKey = "luxas-master-rooms-v2";
export const shiftsStorageKey = "luxas-master-shifts-v2";
export const categoriesStorageKey = "luxas-master-categories";
export const optionsStorageKey = "luxas-master-options";
export const tagsStorageKey = "luxas-master-tags";
export const creditCardsStorageKey = "luxas-master-creditcards";
export const emoneyStorageKey = "luxas-master-emoney";
export const courseSetsStorageKey = "luxas-master-course-sets";
export const retailCategoriesStorageKey = "luxas-retail-categories";
export const retailItemsStorageKey = "luxas-retail-items";
export const retailSalesStorageKey = "luxas-retail-sales";
export const checkoutItemsStorageKey = "luxas-checkout-items";

export const initialCheckoutItems: CheckoutItem[] = [
  // 割引（−）
  { id: "coi-d-001", kind: "discount", name: "500円クーポン", amount: 500, sortOrder: 10, isActive: true },
  { id: "coi-d-002", kind: "discount", name: "リピート割引", amount: 1000, sortOrder: 20, isActive: true },
  { id: "coi-d-003", kind: "discount", name: "社割60分", amount: 2000, sortOrder: 30, isActive: true },
  // 回数券利用（−）
  { id: "coi-cu-001", kind: "couponUse", name: "回数券利用", amount: 5000, sortOrder: 10, isActive: true },
  // チケット利用（−）
  { id: "coi-tu-001", kind: "ticketUse", name: "チケット利用", amount: 6000, sortOrder: 10, isActive: true },
  // 回数券販売（＋）
  { id: "coi-cs-001", kind: "couponSale", name: "回数券", amount: 30000, sortOrder: 10, isActive: true },
  // チケット販売（＋）
  { id: "coi-ts-001", kind: "ticketSale", name: "60分チケット", amount: 6000, sortOrder: 10, isActive: true },
  // 物販（＋）
  { id: "coi-r-001", kind: "retail", name: "シャンプー", amount: 2200, sortOrder: 10, isActive: true },
  { id: "coi-r-002", kind: "retail", name: "福袋", amount: 5000, sortOrder: 20, isActive: true }
];

export const initialCreditCards: CreditCardCompany[] = [
  { id: "cc-001", name: "VISA", feePercent: 3.25, sortOrder: 10, isActive: true },
  { id: "cc-002", name: "Mastercard", feePercent: 3.25, sortOrder: 20, isActive: true },
  { id: "cc-003", name: "JCB", feePercent: 3.74, sortOrder: 30, isActive: true },
  { id: "cc-004", name: "AMEX", feePercent: 3.74, sortOrder: 40, isActive: true }
];

export const initialEmoney: EmoneyBrand[] = [
  { id: "em-001", name: "Suica", feePercent: 3.0, sortOrder: 10, isActive: true },
  { id: "em-002", name: "iD", feePercent: 3.0, sortOrder: 20, isActive: true },
  { id: "em-003", name: "QUICPay", feePercent: 3.0, sortOrder: 30, isActive: true },
  { id: "em-004", name: "PayPay", feePercent: 1.98, sortOrder: 40, isActive: true }
];

export const initialTags: MasterTag[] = [
  { id: "tag-001", name: "VIP", code: "", sortOrder: 10, kind: "customer", isActive: true },
  { id: "tag-002", name: "アレルギーあり", code: "", sortOrder: 20, kind: "customer", isActive: true },
  { id: "tag-101", name: "ホームページ", code: "HP", sortOrder: 10, kind: "route", isActive: true },
  { id: "tag-102", name: "メール", code: "MAIL", sortOrder: 20, kind: "route", isActive: true },
  { id: "tag-103", name: "Instagram", code: "IG", sortOrder: 30, kind: "route", isActive: true },
  { id: "tag-104", name: "多言語看板", code: "SIGN", sortOrder: 40, kind: "route", isActive: true },
  { id: "tag-201", name: "肩こり", code: "", sortOrder: 10, kind: "karte", isActive: true },
  { id: "tag-202", name: "腰痛", code: "", sortOrder: 20, kind: "karte", isActive: true }
];

export const initialCourseSets: CourseSet[] = [
  { id: "set-001", name: "ボディ+フェイシャル 90分セット", category: "セット", price: 14000, sortOrder: 10, onlineBooking: true, isActive: true },
  { id: "set-002", name: "カウンセリング+ボディ 120分セット", category: "セット", price: 17000, sortOrder: 20, onlineBooking: false, isActive: true }
];

export const initialRetailCategories: RetailCategory[] = [
  { id: "retail-cat-001", name: "ホームケア", sortOrder: 10, isActive: true },
  { id: "retail-cat-002", name: "サプリメント", sortOrder: 20, isActive: true },
  { id: "retail-cat-003", name: "物販その他", sortOrder: 30, isActive: true }
];

export const initialRetailItems: RetailItem[] = [
  { id: "retail-001", name: "ホームケアオイル", category: "ホームケア", price: 3300, sortOrder: 10, isActive: true },
  { id: "retail-002", name: "マッサージクリーム", category: "ホームケア", price: 2200, sortOrder: 20, isActive: true },
  { id: "retail-003", name: "美容サプリ（30日分）", category: "サプリメント", price: 4800, sortOrder: 30, isActive: true }
];

// 物販販売の履歴は初期は空（実データはユーザーが登録する）。
export const initialRetailSales: RetailSale[] = [];

export const initialCategories: MenuCategory[] = [
  { id: "category-pm-001", name: "ボディケア", sortOrder: 10, color: "green", isActive: true },
  { id: "category-pm-002", name: "ヘッド・頭ほぐし", sortOrder: 20, color: "violet", isActive: true },
  { id: "category-pm-003", name: "特別・スペシャル", sortOrder: 30, color: "rose", isActive: true },
  { id: "category-pm-004", name: "寄附金付き", sortOrder: 40, color: "amber", isActive: true },
  { id: "category-pm-005", name: "インバウンド", sortOrder: 50, color: "sky", isActive: true },
  { id: "category-pm-006", name: "外国人向け", sortOrder: 60, color: "teal", isActive: true },
  { id: "category-pm-007", name: "マタニティ", sortOrder: 70, color: "pink", isActive: true },
  { id: "category-pm-008", name: "鍼", sortOrder: 80, color: "stone", isActive: true },
  { id: "category-pm-009", name: "シャンプー", sortOrder: 90, color: "sky", isActive: true },
  { id: "category-pm-010", name: "出張", sortOrder: 100, color: "teal", isActive: true },
  { id: "category-pm-011", name: "HPB", sortOrder: 110, color: "amber", isActive: true },
  { id: "category-pm-012", name: "ClassPass", sortOrder: 120, color: "violet", isActive: true },
  { id: "category-pm-013", name: "TORICOM", sortOrder: 130, color: "stone", isActive: true },
  { id: "category-pm-014", name: "その他", sortOrder: 140, color: "stone", isActive: true }
];

export const initialOptions: ServiceOption[] = [
  {
    id: "option-001",
    name: "延長15分",
    category: "オプション",
    price: 2200,
    sortOrder: 10,
    onlineBookable: true,
    kind: "extension",
    extensionMinutes: 15,
    isActive: true
  },
  {
    id: "option-002",
    name: "学割",
    category: "オプション",
    price: 0,
    sortOrder: 20,
    onlineBookable: false,
    kind: "discount",
    discountPercent: 10,
    isActive: true
  }
];

// --- スタッフ シード（PeakManager 実データ・7店舗）---
// PM の各店舗「スタッフ情報」一覧から取得（非表示=退職等は除外）。
// off=定休曜日（0=日,1=月,2=火,3=水,4=木,5=金,6=土）。「出勤=◯のみ」は off に残り全曜日を入れて表現。
// 予約 mock が参照する staff-001 / staff-002 は渋谷の先頭2名に割り当てて温存。
type StaffSeed = {
  id: string;
  storeId: string;
  last: string;
  first?: string;
  nickname: string;
  order: number;
  off: number[];
  gender?: "male" | "female";
  note?: string;
};

const ALL = [0, 1, 2, 3, 4, 5, 6];
const only = (...days: number[]) => ALL.filter((d) => !days.includes(d));

const STAFF_SEED: StaffSeed[] = [
  // === LUXAS渋谷（store-shibuya）===
  { id: "staff-001", storeId: "store-shibuya", last: "王凡", nickname: "王凡(定休日→日月)", order: 1, off: [0, 1] },
  { id: "staff-002", storeId: "store-shibuya", last: "西村", first: "里呼", nickname: "西村(定休日→木金土)", order: 2, off: [4, 5, 6] },
  { id: "staff-shibuya-03", storeId: "store-shibuya", last: "高松", nickname: "高松(定休日→日月)", order: 3, off: [0, 1] },
  { id: "staff-shibuya-07", storeId: "store-shibuya", last: "八田", first: "和貴", nickname: "八田(定休日→火金)", order: 7, off: [2, 5] },
  { id: "staff-shibuya-08", storeId: "store-shibuya", last: "橋爪", first: "雅史", nickname: "橋爪(定休日→木金)", order: 8, off: [4, 5] },
  { id: "staff-shibuya-09", storeId: "store-shibuya", last: "長谷川", first: "智哉", nickname: "長谷川(定休日→水日)", order: 9, off: [3, 0] },
  { id: "staff-shibuya-10", storeId: "store-shibuya", last: "初見", first: "耕二", nickname: "初見(定休日→火土)", order: 10, off: [2, 6] },
  { id: "staff-shibuya-11", storeId: "store-shibuya", last: "難波", first: "英生", nickname: "難波(定休日→日月)", order: 11, off: [0, 1] },
  { id: "staff-shibuya-20", storeId: "store-shibuya", last: "郷", first: "由梨", nickname: "ゆり(月のみ)", order: 20, off: only(1), note: "月のみ出勤" },

  // === LUXAS錦糸町（store-kinshicho）===
  { id: "staff-kinshicho-01", storeId: "store-kinshicho", last: "村野", nickname: "村野(定休日→水)", order: 1, off: [3] },
  { id: "staff-kinshicho-03", storeId: "store-kinshicho", last: "大平", nickname: "大平(定休日→月木)", order: 3, off: [1, 4] },
  { id: "staff-kinshicho-05", storeId: "store-kinshicho", last: "梶", first: "聖子", nickname: "梶(定休日→火水金)", order: 5, off: [2, 3, 5], gender: "female" },
  { id: "staff-kinshicho-12", storeId: "store-kinshicho", last: "石野", first: "正明", nickname: "石野(定休日→月土日)", order: 12, off: [1, 6, 0], gender: "male" },
  { id: "staff-kinshicho-13", storeId: "store-kinshicho", last: "戸門", nickname: "戸門(定休日→木金)", order: 13, off: [4, 5], gender: "male" },
  { id: "staff-kinshicho-14", storeId: "store-kinshicho", last: "森", first: "泰輔", nickname: "森(定休日→火水)", order: 14, off: [2, 3], gender: "male" },

  // === LUXASプレミアム溝の口（store-mizonokuchi-premium）===
  { id: "staff-mizonokuchi-01", storeId: "store-mizonokuchi-premium", last: "堤", first: "祐司", nickname: "堤(定休日→火金)弱揉み", order: 1, off: [2, 5], note: "弱揉み" },
  { id: "staff-mizonokuchi-04", storeId: "store-mizonokuchi-premium", last: "光原", first: "保", nickname: "光原(定休日→金土)強揉み", order: 4, off: [5, 6], note: "強揉み" },
  { id: "staff-mizonokuchi-06", storeId: "store-mizonokuchi-premium", last: "近藤", first: "尚廣", nickname: "近藤(定休日→水木)強揉み", order: 6, off: [3, 4], note: "強揉み" },
  { id: "staff-mizonokuchi-07", storeId: "store-mizonokuchi-premium", last: "大澤", first: "梨絵", nickname: "大澤 予約は当日のみ可能 火日休", order: 7, off: [2, 0], note: "予約は当日のみ可能" },
  { id: "staff-mizonokuchi-09", storeId: "store-mizonokuchi-premium", last: "中山", first: "政憲", nickname: "中山(定休日→月木)強揉み", order: 9, off: [1, 4], note: "強揉み" },
  { id: "staff-mizonokuchi-32", storeId: "store-mizonokuchi-premium", last: "石井", first: "由茉", nickname: "石井S(定休日→月火)中揉み", order: 32, off: [1, 2], note: "中揉み" },
  { id: "staff-mizonokuchi-33", storeId: "store-mizonokuchi-premium", last: "稲葉", nickname: "稲葉S(定休日→木金)", order: 33, off: [4, 5] },

  // === LUXAS+横浜元町中華街（store-motomachi-chukagai-plus）===
  { id: "staff-motomachi-02", storeId: "store-motomachi-chukagai-plus", last: "工藤", nickname: "工藤(定休日→水)金〜17:30", order: 2, off: [3], note: "金は〜17:30" },
  { id: "staff-motomachi-03", storeId: "store-motomachi-chukagai-plus", last: "宮内", nickname: "宮内(定休日→火水)", order: 3, off: [2, 3] },
  { id: "staff-motomachi-07", storeId: "store-motomachi-chukagai-plus", last: "加世田", nickname: "加世田(定休日→火水)", order: 7, off: [2, 3] },
  { id: "staff-motomachi-08", storeId: "store-motomachi-chukagai-plus", last: "小澤", nickname: "小澤(定休日→水木)", order: 8, off: [3, 4] },
  { id: "staff-motomachi-09", storeId: "store-motomachi-chukagai-plus", last: "吉川", nickname: "吉川(定休日→水木)", order: 9, off: [3, 4] },

  // === LUXAS五反田東口（store-gotanda-east）===
  { id: "staff-gotanda-east-01", storeId: "store-gotanda-east", last: "相野", nickname: "相野(出勤日:日金のみ)", order: 1, off: only(0, 5), note: "出勤=日金のみ" },
  { id: "staff-gotanda-east-02", storeId: "store-gotanda-east", last: "清水", nickname: "清水(定休日:水木金)", order: 2, off: [3, 4, 5] },
  { id: "staff-gotanda-east-05", storeId: "store-gotanda-east", last: "生田", nickname: "生田(定休日:月土)", order: 5, off: [1, 6] },
  { id: "staff-gotanda-east-06", storeId: "store-gotanda-east", last: "内田", nickname: "内田(定休日:日火金)", order: 6, off: [0, 2, 5] },
  { id: "staff-gotanda-east-08", storeId: "store-gotanda-east", last: "有馬", nickname: "有馬(※男性 定休日:月木)", order: 8, off: [1, 4], gender: "male" },
  { id: "staff-gotanda-east-09", storeId: "store-gotanda-east", last: "北澤", nickname: "北澤(定休日:火金)", order: 9, off: [2, 5] },
  { id: "staff-gotanda-east-11", storeId: "store-gotanda-east", last: "辻井", nickname: "辻井(出勤日:日水土)", order: 11, off: only(0, 3, 6), note: "出勤=日水土のみ" },
  { id: "staff-gotanda-east-12", storeId: "store-gotanda-east", last: "宮下", nickname: "宮下(定休日:水木)", order: 12, off: [3, 4] },

  // === LUXAS五反田西口（store-gotanda-west）===
  { id: "staff-gotanda-west-03", storeId: "store-gotanda-west", last: "山口", first: "堯士", nickname: "山口(定休日:金,偶数週土曜)", order: 3, off: [5], note: "偶数週は土曜も休" },
  { id: "staff-gotanda-west-05", storeId: "store-gotanda-west", last: "池田", first: "修", nickname: "池田(定休日:水日)", order: 5, off: [3, 0] },
  { id: "staff-gotanda-west-06", storeId: "store-gotanda-west", last: "崔", first: "今連", nickname: "崔(定休日:月火木金)", order: 6, off: [1, 2, 4, 5] },
  { id: "staff-gotanda-west-07", storeId: "store-gotanda-west", last: "篠宮", first: "城光", nickname: "篠宮(定休日:水木)", order: 7, off: [3, 4] },
  { id: "staff-gotanda-west-08", storeId: "store-gotanda-west", last: "宮川", first: "優作", nickname: "宮川(定休日:火,第一日曜)", order: 8, off: [2], note: "第1日曜も休" },

  // === LUXAS中目黒（store-nakameguro）===
  { id: "staff-nakameguro-01", storeId: "store-nakameguro", last: "小杉", nickname: "小杉(定休日:火)", order: 1, off: [2] },
  { id: "staff-nakameguro-02", storeId: "store-nakameguro", last: "大田", nickname: "大田(定休日:木金)", order: 2, off: [4, 5] },
  { id: "staff-nakameguro-03", storeId: "store-nakameguro", last: "山田", nickname: "山田(定休日:水土)", order: 3, off: [3, 6] },
  { id: "staff-nakameguro-04", storeId: "store-nakameguro", last: "岩下", nickname: "岩下(定休日:月)", order: 4, off: [1] },
  { id: "staff-nakameguro-07", storeId: "store-nakameguro", last: "冨山", nickname: "冨山(定休日:木金)", order: 7, off: [4, 5] },
  { id: "staff-nakameguro-11", storeId: "store-nakameguro", last: "秋本", nickname: "秋本(定休日:月木金)", order: 11, off: [1, 4, 5] },
  { id: "staff-nakameguro-12", storeId: "store-nakameguro", last: "徳川", nickname: "徳川(出勤日:土)", order: 12, off: only(6), note: "出勤=土のみ" },
  { id: "staff-nakameguro-13", storeId: "store-nakameguro", last: "間庭", nickname: "間庭(定休日:水木日)", order: 13, off: [3, 4, 0] },
  { id: "staff-nakameguro-14", storeId: "store-nakameguro", last: "福原", nickname: "福原(定休日:火・第1.3水)", order: 14, off: [2], note: "第1・3水も休" },
  { id: "staff-nakameguro-18", storeId: "store-nakameguro", last: "野表", nickname: "野表(定休日:火水)", order: 18, off: [2, 3] },
  { id: "staff-nakameguro-21", storeId: "store-nakameguro", last: "堀口", nickname: "堀口(定休日:土)", order: 21, off: [6] },
  { id: "staff-nakameguro-30", storeId: "store-nakameguro", last: "大城", nickname: "オオシロ(出勤日:土)", order: 30, off: only(6), note: "出勤=土のみ" },
  { id: "staff-nakameguro-36", storeId: "store-nakameguro", last: "上山", nickname: "上山(定休日:月火)", order: 36, off: [1, 2] },
  { id: "staff-nakameguro-38", storeId: "store-nakameguro", last: "城戸", nickname: "城戸(出勤日:月土)", order: 38, off: only(1, 6), note: "出勤=月土のみ" },
  { id: "staff-nakameguro-41", storeId: "store-nakameguro", last: "秋山", nickname: "秋山(出勤日:土)", order: 41, off: only(6), note: "出勤=土のみ" },
  { id: "staff-nakameguro-50", storeId: "store-nakameguro", last: "鈴木", first: "栄", nickname: "鈴木(出勤日:木)", order: 50, off: only(4), note: "出勤=木のみ" },
  { id: "staff-nakameguro-51", storeId: "store-nakameguro", last: "小須田", nickname: "小須田(定休日:月金土)", order: 51, off: [1, 5, 6] },
  { id: "staff-nakameguro-52", storeId: "store-nakameguro", last: "中島", nickname: "中島(不定期出勤)", order: 52, off: [0], note: "不定期出勤" },
  { id: "staff-nakameguro-54", storeId: "store-nakameguro", last: "蛭間", nickname: "蛭間(定休日:火水)", order: 54, off: [2, 3] }
];

// PM準拠: スタッフ×対応コース（一部のみ提供のスタッフだけ列挙。未掲載=全コース対応）。2026-06-21
// キー = "storeId#表示順序"。値 = 提供する svc-pm の id。生成: scripts/gen-staff-courses.mjs
const STAFF_COURSE_MAP: Record<string, string[]> = {
  "store-shibuya#8": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0034", "svc-pm-0043", "svc-pm-0050", "svc-pm-0096", "svc-pm-0105", "svc-pm-0109", "svc-pm-0110", "svc-pm-0131", "svc-pm-0135", "svc-pm-0148", "svc-pm-0149", "svc-pm-0166", "svc-pm-0170", "svc-pm-0174", "svc-pm-0182", "svc-pm-0186", "svc-pm-0191", "svc-pm-0192", "svc-pm-0193", "svc-pm-0194", "svc-pm-0195", "svc-pm-0196", "svc-pm-0197", "svc-pm-0198", "svc-pm-0202", "svc-pm-0206", "svc-pm-0207", "svc-pm-0211", "svc-pm-0216", "svc-pm-0276", "svc-pm-0278", "svc-pm-0279", "svc-pm-0283", "svc-pm-0285", "svc-pm-0286", "svc-pm-0287", "svc-pm-0288", "svc-pm-0289", "svc-pm-0290", "svc-pm-0292", "svc-pm-0294", "svc-pm-0297", "svc-pm-0298", "svc-pm-0299", "svc-pm-0301", "svc-pm-0302", "svc-pm-0303", "svc-pm-0304", "svc-pm-0305", "svc-pm-0308", "svc-pm-0309", "svc-pm-0312", "svc-pm-0313", "svc-pm-0314", "svc-pm-0315", "svc-pm-0316", "svc-pm-0317", "svc-pm-0318", "svc-pm-0321", "svc-pm-0323", "svc-pm-0325", "svc-pm-0326", "svc-pm-0327", "svc-pm-0328", "svc-pm-0332", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0349", "svc-pm-0351", "svc-pm-0354"],
  "store-shibuya#10": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0034", "svc-pm-0043", "svc-pm-0050", "svc-pm-0096", "svc-pm-0105", "svc-pm-0109", "svc-pm-0110", "svc-pm-0131", "svc-pm-0135", "svc-pm-0148", "svc-pm-0149", "svc-pm-0166", "svc-pm-0170", "svc-pm-0174", "svc-pm-0182", "svc-pm-0186", "svc-pm-0192", "svc-pm-0193", "svc-pm-0194", "svc-pm-0195", "svc-pm-0196", "svc-pm-0197", "svc-pm-0198", "svc-pm-0202", "svc-pm-0206", "svc-pm-0207", "svc-pm-0211", "svc-pm-0216", "svc-pm-0276", "svc-pm-0278", "svc-pm-0285", "svc-pm-0286", "svc-pm-0287", "svc-pm-0288", "svc-pm-0289", "svc-pm-0290", "svc-pm-0294", "svc-pm-0297", "svc-pm-0299", "svc-pm-0301", "svc-pm-0302", "svc-pm-0303", "svc-pm-0304", "svc-pm-0305", "svc-pm-0308", "svc-pm-0309", "svc-pm-0313", "svc-pm-0314", "svc-pm-0316", "svc-pm-0317", "svc-pm-0318", "svc-pm-0321", "svc-pm-0323", "svc-pm-0325", "svc-pm-0326", "svc-pm-0327", "svc-pm-0328", "svc-pm-0332", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351", "svc-pm-0354"],
  "store-shibuya#11": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0034", "svc-pm-0043", "svc-pm-0050", "svc-pm-0105", "svc-pm-0109", "svc-pm-0110", "svc-pm-0131", "svc-pm-0135", "svc-pm-0148", "svc-pm-0149", "svc-pm-0166", "svc-pm-0170", "svc-pm-0174", "svc-pm-0182", "svc-pm-0186", "svc-pm-0191", "svc-pm-0192", "svc-pm-0193", "svc-pm-0194", "svc-pm-0195", "svc-pm-0196", "svc-pm-0197", "svc-pm-0198", "svc-pm-0202", "svc-pm-0206", "svc-pm-0207", "svc-pm-0211", "svc-pm-0216", "svc-pm-0276", "svc-pm-0278", "svc-pm-0279", "svc-pm-0283", "svc-pm-0287", "svc-pm-0288", "svc-pm-0289", "svc-pm-0290", "svc-pm-0292", "svc-pm-0294", "svc-pm-0297", "svc-pm-0299", "svc-pm-0301", "svc-pm-0302", "svc-pm-0303", "svc-pm-0304", "svc-pm-0305", "svc-pm-0308", "svc-pm-0309", "svc-pm-0312", "svc-pm-0313", "svc-pm-0314", "svc-pm-0315", "svc-pm-0316", "svc-pm-0317", "svc-pm-0318", "svc-pm-0321", "svc-pm-0323", "svc-pm-0325", "svc-pm-0326", "svc-pm-0328", "svc-pm-0332", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351", "svc-pm-0354"],
  "store-shibuya#20": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0034", "svc-pm-0043", "svc-pm-0050", "svc-pm-0096", "svc-pm-0105", "svc-pm-0109", "svc-pm-0110", "svc-pm-0131", "svc-pm-0135", "svc-pm-0148", "svc-pm-0149", "svc-pm-0166", "svc-pm-0170", "svc-pm-0174", "svc-pm-0182", "svc-pm-0186", "svc-pm-0191", "svc-pm-0192", "svc-pm-0193", "svc-pm-0194", "svc-pm-0195", "svc-pm-0196", "svc-pm-0197", "svc-pm-0198", "svc-pm-0202", "svc-pm-0206", "svc-pm-0207", "svc-pm-0211", "svc-pm-0216", "svc-pm-0276", "svc-pm-0278", "svc-pm-0279", "svc-pm-0283", "svc-pm-0285", "svc-pm-0286", "svc-pm-0287", "svc-pm-0288", "svc-pm-0289", "svc-pm-0290", "svc-pm-0292", "svc-pm-0294", "svc-pm-0297", "svc-pm-0298", "svc-pm-0299", "svc-pm-0301", "svc-pm-0302", "svc-pm-0303", "svc-pm-0304", "svc-pm-0305", "svc-pm-0308", "svc-pm-0309", "svc-pm-0312", "svc-pm-0313", "svc-pm-0314", "svc-pm-0315", "svc-pm-0316", "svc-pm-0317", "svc-pm-0318", "svc-pm-0321", "svc-pm-0323", "svc-pm-0325", "svc-pm-0326", "svc-pm-0327", "svc-pm-0328", "svc-pm-0332", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351", "svc-pm-0354"],
  "store-nakameguro#11": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#13": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0055", "svc-pm-0079", "svc-pm-0106", "svc-pm-0127", "svc-pm-0128", "svc-pm-0130", "svc-pm-0137", "svc-pm-0152", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#14": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#18": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#38": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#41": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#51": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-nakameguro#52": ["svc-pm-0005", "svc-pm-0007", "svc-pm-0013", "svc-pm-0015", "svc-pm-0021", "svc-pm-0022", "svc-pm-0028", "svc-pm-0030", "svc-pm-0040", "svc-pm-0041", "svc-pm-0046", "svc-pm-0048", "svc-pm-0055", "svc-pm-0056", "svc-pm-0059", "svc-pm-0061", "svc-pm-0079", "svc-pm-0106", "svc-pm-0108", "svc-pm-0127", "svc-pm-0128", "svc-pm-0129", "svc-pm-0130", "svc-pm-0137", "svc-pm-0147", "svc-pm-0152", "svc-pm-0169", "svc-pm-0178", "svc-pm-0179", "svc-pm-0180", "svc-pm-0181", "svc-pm-0189", "svc-pm-0204", "svc-pm-0205", "svc-pm-0213", "svc-pm-0214", "svc-pm-0215", "svc-pm-0221", "svc-pm-0222", "svc-pm-0223", "svc-pm-0268", "svc-pm-0329", "svc-pm-0331", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0345", "svc-pm-0346", "svc-pm-0348", "svc-pm-0353", "svc-pm-0354", "svc-pm-0355", "svc-pm-0356", "svc-pm-0357", "svc-pm-0358", "svc-pm-0359", "svc-pm-0360", "svc-pm-0361", "svc-pm-0362", "svc-pm-0363", "svc-pm-0364", "svc-pm-0365", "svc-pm-0366", "svc-pm-0367", "svc-pm-0368", "svc-pm-0369"],
  "store-kinshicho#1": ["svc-pm-0001", "svc-pm-0011", "svc-pm-0016", "svc-pm-0023", "svc-pm-0024", "svc-pm-0031", "svc-pm-0032", "svc-pm-0042", "svc-pm-0049", "svc-pm-0058", "svc-pm-0060", "svc-pm-0064", "svc-pm-0067", "svc-pm-0071", "svc-pm-0077", "svc-pm-0164", "svc-pm-0173", "svc-pm-0183", "svc-pm-0185", "svc-pm-0188", "svc-pm-0199", "svc-pm-0206", "svc-pm-0207", "svc-pm-0208", "svc-pm-0217", "svc-pm-0227", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0339", "svc-pm-0341", "svc-pm-0342", "svc-pm-0347", "svc-pm-0351"],
  "store-kinshicho#3": ["svc-pm-0001", "svc-pm-0011", "svc-pm-0016", "svc-pm-0023", "svc-pm-0024", "svc-pm-0031", "svc-pm-0032", "svc-pm-0042", "svc-pm-0049", "svc-pm-0058", "svc-pm-0064", "svc-pm-0067", "svc-pm-0071", "svc-pm-0077", "svc-pm-0164", "svc-pm-0173", "svc-pm-0183", "svc-pm-0185", "svc-pm-0188", "svc-pm-0199", "svc-pm-0206", "svc-pm-0207", "svc-pm-0208", "svc-pm-0217", "svc-pm-0227", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0339", "svc-pm-0341", "svc-pm-0342", "svc-pm-0347", "svc-pm-0351"],
  "store-kinshicho#5": ["svc-pm-0001", "svc-pm-0011", "svc-pm-0016", "svc-pm-0023", "svc-pm-0024", "svc-pm-0031", "svc-pm-0032", "svc-pm-0042", "svc-pm-0049", "svc-pm-0058", "svc-pm-0064", "svc-pm-0067", "svc-pm-0071", "svc-pm-0077", "svc-pm-0164", "svc-pm-0173", "svc-pm-0183", "svc-pm-0185", "svc-pm-0188", "svc-pm-0199", "svc-pm-0206", "svc-pm-0207", "svc-pm-0208", "svc-pm-0217", "svc-pm-0227", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0339", "svc-pm-0341", "svc-pm-0342", "svc-pm-0347", "svc-pm-0351"],
  "store-kinshicho#12": ["svc-pm-0001", "svc-pm-0011", "svc-pm-0016", "svc-pm-0023", "svc-pm-0024", "svc-pm-0031", "svc-pm-0032", "svc-pm-0042", "svc-pm-0049", "svc-pm-0058", "svc-pm-0064", "svc-pm-0067", "svc-pm-0071", "svc-pm-0077", "svc-pm-0164", "svc-pm-0173", "svc-pm-0183", "svc-pm-0185", "svc-pm-0188", "svc-pm-0199", "svc-pm-0206", "svc-pm-0207", "svc-pm-0208", "svc-pm-0217", "svc-pm-0227", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0339", "svc-pm-0341", "svc-pm-0342", "svc-pm-0347", "svc-pm-0351"],
  "store-kinshicho#13": ["svc-pm-0001", "svc-pm-0011", "svc-pm-0016", "svc-pm-0023", "svc-pm-0024", "svc-pm-0031", "svc-pm-0032", "svc-pm-0042", "svc-pm-0049", "svc-pm-0058", "svc-pm-0064", "svc-pm-0067", "svc-pm-0071", "svc-pm-0077", "svc-pm-0164", "svc-pm-0173", "svc-pm-0183", "svc-pm-0185", "svc-pm-0188", "svc-pm-0199", "svc-pm-0206", "svc-pm-0207", "svc-pm-0208", "svc-pm-0217", "svc-pm-0227", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0339", "svc-pm-0341", "svc-pm-0342", "svc-pm-0347", "svc-pm-0351"],
  "store-kinshicho#14": ["svc-pm-0001", "svc-pm-0011", "svc-pm-0016", "svc-pm-0023", "svc-pm-0024", "svc-pm-0031", "svc-pm-0032", "svc-pm-0042", "svc-pm-0049", "svc-pm-0058", "svc-pm-0064", "svc-pm-0067", "svc-pm-0071", "svc-pm-0077", "svc-pm-0164", "svc-pm-0173", "svc-pm-0183", "svc-pm-0185", "svc-pm-0188", "svc-pm-0199", "svc-pm-0206", "svc-pm-0207", "svc-pm-0208", "svc-pm-0217", "svc-pm-0227", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0339", "svc-pm-0341", "svc-pm-0342", "svc-pm-0347", "svc-pm-0351"],
  "store-mizonokuchi-premium#1": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0018", "svc-pm-0025", "svc-pm-0027", "svc-pm-0034", "svc-pm-0036", "svc-pm-0065", "svc-pm-0066", "svc-pm-0069", "svc-pm-0070", "svc-pm-0076", "svc-pm-0081", "svc-pm-0083", "svc-pm-0084", "svc-pm-0092", "svc-pm-0093", "svc-pm-0094", "svc-pm-0095", "svc-pm-0097", "svc-pm-0098", "svc-pm-0099", "svc-pm-0100", "svc-pm-0103", "svc-pm-0104", "svc-pm-0112", "svc-pm-0113", "svc-pm-0115", "svc-pm-0116", "svc-pm-0117", "svc-pm-0118", "svc-pm-0119", "svc-pm-0122", "svc-pm-0124", "svc-pm-0132", "svc-pm-0134", "svc-pm-0140", "svc-pm-0141", "svc-pm-0142", "svc-pm-0162", "svc-pm-0163", "svc-pm-0165", "svc-pm-0168", "svc-pm-0171", "svc-pm-0172", "svc-pm-0174", "svc-pm-0176", "svc-pm-0251", "svc-pm-0277", "svc-pm-0291", "svc-pm-0293", "svc-pm-0295", "svc-pm-0296", "svc-pm-0306", "svc-pm-0307", "svc-pm-0319", "svc-pm-0320"],
  "store-mizonokuchi-premium#4": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0018", "svc-pm-0025", "svc-pm-0027", "svc-pm-0034", "svc-pm-0036", "svc-pm-0043", "svc-pm-0050", "svc-pm-0065", "svc-pm-0066", "svc-pm-0069", "svc-pm-0070", "svc-pm-0076", "svc-pm-0081", "svc-pm-0083", "svc-pm-0084", "svc-pm-0092", "svc-pm-0093", "svc-pm-0094", "svc-pm-0095", "svc-pm-0097", "svc-pm-0098", "svc-pm-0099", "svc-pm-0100", "svc-pm-0103", "svc-pm-0104", "svc-pm-0112", "svc-pm-0113", "svc-pm-0115", "svc-pm-0116", "svc-pm-0117", "svc-pm-0118", "svc-pm-0119", "svc-pm-0122", "svc-pm-0124", "svc-pm-0132", "svc-pm-0134", "svc-pm-0140", "svc-pm-0141", "svc-pm-0142", "svc-pm-0162", "svc-pm-0163", "svc-pm-0165", "svc-pm-0168", "svc-pm-0171", "svc-pm-0172", "svc-pm-0174", "svc-pm-0176", "svc-pm-0251", "svc-pm-0277", "svc-pm-0291", "svc-pm-0293", "svc-pm-0295", "svc-pm-0296", "svc-pm-0306", "svc-pm-0307", "svc-pm-0319", "svc-pm-0320"],
  "store-mizonokuchi-premium#6": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0018", "svc-pm-0025", "svc-pm-0027", "svc-pm-0034", "svc-pm-0036", "svc-pm-0043", "svc-pm-0050", "svc-pm-0065", "svc-pm-0066", "svc-pm-0069", "svc-pm-0070", "svc-pm-0076", "svc-pm-0081", "svc-pm-0083", "svc-pm-0084", "svc-pm-0092", "svc-pm-0093", "svc-pm-0094", "svc-pm-0095", "svc-pm-0097", "svc-pm-0098", "svc-pm-0099", "svc-pm-0100", "svc-pm-0103", "svc-pm-0104", "svc-pm-0112", "svc-pm-0113", "svc-pm-0115", "svc-pm-0116", "svc-pm-0117", "svc-pm-0118", "svc-pm-0119", "svc-pm-0122", "svc-pm-0124", "svc-pm-0132", "svc-pm-0134", "svc-pm-0140", "svc-pm-0141", "svc-pm-0142", "svc-pm-0162", "svc-pm-0163", "svc-pm-0165", "svc-pm-0168", "svc-pm-0171", "svc-pm-0172", "svc-pm-0174", "svc-pm-0176", "svc-pm-0251", "svc-pm-0277", "svc-pm-0291", "svc-pm-0293", "svc-pm-0295", "svc-pm-0296", "svc-pm-0306", "svc-pm-0307", "svc-pm-0319", "svc-pm-0320"],
  "store-mizonokuchi-premium#7": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0018", "svc-pm-0025", "svc-pm-0027", "svc-pm-0034", "svc-pm-0036", "svc-pm-0043", "svc-pm-0050", "svc-pm-0065", "svc-pm-0066", "svc-pm-0069", "svc-pm-0070", "svc-pm-0076", "svc-pm-0081", "svc-pm-0083", "svc-pm-0084", "svc-pm-0092", "svc-pm-0093", "svc-pm-0094", "svc-pm-0095", "svc-pm-0097", "svc-pm-0098", "svc-pm-0099", "svc-pm-0100", "svc-pm-0103", "svc-pm-0104", "svc-pm-0112", "svc-pm-0113", "svc-pm-0115", "svc-pm-0116", "svc-pm-0117", "svc-pm-0118", "svc-pm-0119", "svc-pm-0122", "svc-pm-0124", "svc-pm-0132", "svc-pm-0134", "svc-pm-0140", "svc-pm-0141", "svc-pm-0142", "svc-pm-0162", "svc-pm-0163", "svc-pm-0165", "svc-pm-0168", "svc-pm-0171", "svc-pm-0172", "svc-pm-0174", "svc-pm-0176", "svc-pm-0251", "svc-pm-0277", "svc-pm-0291", "svc-pm-0293", "svc-pm-0295", "svc-pm-0296", "svc-pm-0306", "svc-pm-0307", "svc-pm-0319", "svc-pm-0320"],
  "store-mizonokuchi-premium#9": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0018", "svc-pm-0025", "svc-pm-0027", "svc-pm-0034", "svc-pm-0036", "svc-pm-0043", "svc-pm-0050", "svc-pm-0065", "svc-pm-0066", "svc-pm-0069", "svc-pm-0070", "svc-pm-0076", "svc-pm-0081", "svc-pm-0083", "svc-pm-0084", "svc-pm-0092", "svc-pm-0093", "svc-pm-0094", "svc-pm-0095", "svc-pm-0097", "svc-pm-0098", "svc-pm-0099", "svc-pm-0100", "svc-pm-0103", "svc-pm-0104", "svc-pm-0112", "svc-pm-0113", "svc-pm-0115", "svc-pm-0116", "svc-pm-0117", "svc-pm-0118", "svc-pm-0119", "svc-pm-0122", "svc-pm-0124", "svc-pm-0132", "svc-pm-0134", "svc-pm-0140", "svc-pm-0141", "svc-pm-0142", "svc-pm-0162", "svc-pm-0163", "svc-pm-0165", "svc-pm-0168", "svc-pm-0171", "svc-pm-0172", "svc-pm-0174", "svc-pm-0176", "svc-pm-0251", "svc-pm-0277", "svc-pm-0291", "svc-pm-0293", "svc-pm-0295", "svc-pm-0296", "svc-pm-0306", "svc-pm-0307", "svc-pm-0319", "svc-pm-0320"],
  "store-mizonokuchi-premium#33": ["svc-pm-0073", "svc-pm-0074", "svc-pm-0080", "svc-pm-0088", "svc-pm-0089", "svc-pm-0090", "svc-pm-0155", "svc-pm-0156", "svc-pm-0236", "svc-pm-0237", "svc-pm-0238", "svc-pm-0239", "svc-pm-0240", "svc-pm-0241", "svc-pm-0242", "svc-pm-0243", "svc-pm-0244", "svc-pm-0245", "svc-pm-0246", "svc-pm-0247", "svc-pm-0248", "svc-pm-0249", "svc-pm-0250", "svc-pm-0252", "svc-pm-0253", "svc-pm-0254", "svc-pm-0255", "svc-pm-0270", "svc-pm-0271", "svc-pm-0272", "svc-pm-0273", "svc-pm-0274", "svc-pm-0275", "svc-pm-0280", "svc-pm-0281", "svc-pm-0282", "svc-pm-0284", "svc-pm-0310", "svc-pm-0311", "svc-pm-0324"],
  "store-motomachi-chukagai-plus#2": ["svc-pm-0004", "svc-pm-0006", "svc-pm-0008", "svc-pm-0012", "svc-pm-0014", "svc-pm-0019", "svc-pm-0020", "svc-pm-0029", "svc-pm-0037", "svc-pm-0038", "svc-pm-0039", "svc-pm-0045", "svc-pm-0047", "svc-pm-0053", "svc-pm-0054", "svc-pm-0057", "svc-pm-0059", "svc-pm-0061", "svc-pm-0062", "svc-pm-0063", "svc-pm-0072", "svc-pm-0078", "svc-pm-0087", "svc-pm-0107", "svc-pm-0125", "svc-pm-0126", "svc-pm-0146", "svc-pm-0157", "svc-pm-0159", "svc-pm-0161", "svc-pm-0177", "svc-pm-0184", "svc-pm-0187", "svc-pm-0190", "svc-pm-0203", "svc-pm-0212", "svc-pm-0220", "svc-pm-0228", "svc-pm-0256", "svc-pm-0258", "svc-pm-0260", "svc-pm-0262", "svc-pm-0264", "svc-pm-0266", "svc-pm-0268", "svc-pm-0330", "svc-pm-0331", "svc-pm-0335", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0343", "svc-pm-0345", "svc-pm-0348", "svc-pm-0350", "svc-pm-0352"],
  "store-motomachi-chukagai-plus#3": ["svc-pm-0004", "svc-pm-0006", "svc-pm-0012", "svc-pm-0014", "svc-pm-0019", "svc-pm-0020", "svc-pm-0029", "svc-pm-0037", "svc-pm-0038", "svc-pm-0039", "svc-pm-0047", "svc-pm-0054", "svc-pm-0059", "svc-pm-0061", "svc-pm-0062", "svc-pm-0063", "svc-pm-0072", "svc-pm-0078", "svc-pm-0087", "svc-pm-0107", "svc-pm-0126", "svc-pm-0157", "svc-pm-0159", "svc-pm-0161", "svc-pm-0177", "svc-pm-0184", "svc-pm-0187", "svc-pm-0190", "svc-pm-0203", "svc-pm-0212", "svc-pm-0220", "svc-pm-0228", "svc-pm-0330", "svc-pm-0331", "svc-pm-0335", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0343", "svc-pm-0345", "svc-pm-0348", "svc-pm-0350", "svc-pm-0352"],
  "store-motomachi-chukagai-plus#7": ["svc-pm-0004", "svc-pm-0006", "svc-pm-0012", "svc-pm-0014", "svc-pm-0019", "svc-pm-0020", "svc-pm-0029", "svc-pm-0037", "svc-pm-0038", "svc-pm-0039", "svc-pm-0047", "svc-pm-0054", "svc-pm-0059", "svc-pm-0061", "svc-pm-0062", "svc-pm-0063", "svc-pm-0072", "svc-pm-0078", "svc-pm-0087", "svc-pm-0107", "svc-pm-0125", "svc-pm-0126", "svc-pm-0146", "svc-pm-0157", "svc-pm-0159", "svc-pm-0161", "svc-pm-0177", "svc-pm-0184", "svc-pm-0187", "svc-pm-0190", "svc-pm-0203", "svc-pm-0212", "svc-pm-0220", "svc-pm-0228", "svc-pm-0229", "svc-pm-0230", "svc-pm-0231", "svc-pm-0232", "svc-pm-0233", "svc-pm-0234", "svc-pm-0235", "svc-pm-0256", "svc-pm-0258", "svc-pm-0260", "svc-pm-0262", "svc-pm-0264", "svc-pm-0266", "svc-pm-0268", "svc-pm-0330", "svc-pm-0331", "svc-pm-0335", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0343", "svc-pm-0345", "svc-pm-0348", "svc-pm-0350", "svc-pm-0352"],
  "store-motomachi-chukagai-plus#8": ["svc-pm-0004", "svc-pm-0006", "svc-pm-0008", "svc-pm-0012", "svc-pm-0014", "svc-pm-0019", "svc-pm-0020", "svc-pm-0029", "svc-pm-0037", "svc-pm-0038", "svc-pm-0039", "svc-pm-0045", "svc-pm-0047", "svc-pm-0053", "svc-pm-0054", "svc-pm-0057", "svc-pm-0059", "svc-pm-0061", "svc-pm-0062", "svc-pm-0063", "svc-pm-0072", "svc-pm-0078", "svc-pm-0087", "svc-pm-0107", "svc-pm-0126", "svc-pm-0157", "svc-pm-0159", "svc-pm-0161", "svc-pm-0177", "svc-pm-0184", "svc-pm-0187", "svc-pm-0190", "svc-pm-0203", "svc-pm-0212", "svc-pm-0220", "svc-pm-0228", "svc-pm-0330", "svc-pm-0331", "svc-pm-0335", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0343", "svc-pm-0345", "svc-pm-0348", "svc-pm-0350", "svc-pm-0352"],
  "store-motomachi-chukagai-plus#9": ["svc-pm-0004", "svc-pm-0006", "svc-pm-0008", "svc-pm-0012", "svc-pm-0014", "svc-pm-0019", "svc-pm-0020", "svc-pm-0029", "svc-pm-0037", "svc-pm-0038", "svc-pm-0039", "svc-pm-0045", "svc-pm-0047", "svc-pm-0053", "svc-pm-0054", "svc-pm-0057", "svc-pm-0059", "svc-pm-0061", "svc-pm-0062", "svc-pm-0063", "svc-pm-0072", "svc-pm-0078", "svc-pm-0087", "svc-pm-0107", "svc-pm-0126", "svc-pm-0157", "svc-pm-0159", "svc-pm-0161", "svc-pm-0177", "svc-pm-0184", "svc-pm-0187", "svc-pm-0190", "svc-pm-0203", "svc-pm-0212", "svc-pm-0220", "svc-pm-0228", "svc-pm-0256", "svc-pm-0258", "svc-pm-0260", "svc-pm-0262", "svc-pm-0264", "svc-pm-0266", "svc-pm-0268", "svc-pm-0330", "svc-pm-0331", "svc-pm-0335", "svc-pm-0336", "svc-pm-0337", "svc-pm-0340", "svc-pm-0343", "svc-pm-0345", "svc-pm-0348", "svc-pm-0350", "svc-pm-0352"],
  "store-gotanda-east#1": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#2": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#5": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#6": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#8": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#9": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#11": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0136", "svc-pm-0138", "svc-pm-0139", "svc-pm-0150", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-east#12": ["svc-pm-0002", "svc-pm-0009", "svc-pm-0016", "svc-pm-0025", "svc-pm-0035", "svc-pm-0043", "svc-pm-0051", "svc-pm-0068", "svc-pm-0075", "svc-pm-0114", "svc-pm-0121", "svc-pm-0138", "svc-pm-0139", "svc-pm-0167", "svc-pm-0174", "svc-pm-0175", "svc-pm-0182", "svc-pm-0186", "svc-pm-0201", "svc-pm-0206", "svc-pm-0207", "svc-pm-0210", "svc-pm-0219", "svc-pm-0224", "svc-pm-0226", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-west#3": ["svc-pm-0003", "svc-pm-0010", "svc-pm-0017", "svc-pm-0026", "svc-pm-0033", "svc-pm-0044", "svc-pm-0052", "svc-pm-0068", "svc-pm-0075", "svc-pm-0082", "svc-pm-0085", "svc-pm-0086", "svc-pm-0091", "svc-pm-0101", "svc-pm-0102", "svc-pm-0120", "svc-pm-0123", "svc-pm-0133", "svc-pm-0143", "svc-pm-0144", "svc-pm-0145", "svc-pm-0154", "svc-pm-0158", "svc-pm-0200", "svc-pm-0206", "svc-pm-0207", "svc-pm-0209", "svc-pm-0218", "svc-pm-0225", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-west#5": ["svc-pm-0003", "svc-pm-0010", "svc-pm-0017", "svc-pm-0026", "svc-pm-0033", "svc-pm-0044", "svc-pm-0052", "svc-pm-0068", "svc-pm-0075", "svc-pm-0082", "svc-pm-0085", "svc-pm-0086", "svc-pm-0091", "svc-pm-0101", "svc-pm-0102", "svc-pm-0120", "svc-pm-0123", "svc-pm-0133", "svc-pm-0143", "svc-pm-0144", "svc-pm-0154", "svc-pm-0158", "svc-pm-0200", "svc-pm-0206", "svc-pm-0207", "svc-pm-0209", "svc-pm-0218", "svc-pm-0225", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-west#6": ["svc-pm-0003", "svc-pm-0010", "svc-pm-0017", "svc-pm-0026", "svc-pm-0033", "svc-pm-0044", "svc-pm-0052", "svc-pm-0068", "svc-pm-0075", "svc-pm-0082", "svc-pm-0085", "svc-pm-0086", "svc-pm-0091", "svc-pm-0101", "svc-pm-0102", "svc-pm-0120", "svc-pm-0123", "svc-pm-0133", "svc-pm-0143", "svc-pm-0144", "svc-pm-0154", "svc-pm-0158", "svc-pm-0200", "svc-pm-0206", "svc-pm-0207", "svc-pm-0209", "svc-pm-0218", "svc-pm-0225", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-west#7": ["svc-pm-0003", "svc-pm-0010", "svc-pm-0017", "svc-pm-0026", "svc-pm-0033", "svc-pm-0044", "svc-pm-0052", "svc-pm-0068", "svc-pm-0075", "svc-pm-0082", "svc-pm-0085", "svc-pm-0086", "svc-pm-0091", "svc-pm-0101", "svc-pm-0102", "svc-pm-0120", "svc-pm-0123", "svc-pm-0133", "svc-pm-0143", "svc-pm-0144", "svc-pm-0154", "svc-pm-0158", "svc-pm-0200", "svc-pm-0206", "svc-pm-0207", "svc-pm-0209", "svc-pm-0218", "svc-pm-0225", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"],
  "store-gotanda-west#8": ["svc-pm-0003", "svc-pm-0010", "svc-pm-0017", "svc-pm-0026", "svc-pm-0033", "svc-pm-0044", "svc-pm-0052", "svc-pm-0068", "svc-pm-0075", "svc-pm-0082", "svc-pm-0085", "svc-pm-0086", "svc-pm-0091", "svc-pm-0101", "svc-pm-0102", "svc-pm-0120", "svc-pm-0123", "svc-pm-0133", "svc-pm-0143", "svc-pm-0144", "svc-pm-0151", "svc-pm-0154", "svc-pm-0158", "svc-pm-0160", "svc-pm-0200", "svc-pm-0206", "svc-pm-0207", "svc-pm-0209", "svc-pm-0218", "svc-pm-0225", "svc-pm-0257", "svc-pm-0259", "svc-pm-0261", "svc-pm-0263", "svc-pm-0265", "svc-pm-0267", "svc-pm-0269", "svc-pm-0327", "svc-pm-0328", "svc-pm-0333", "svc-pm-0334", "svc-pm-0338", "svc-pm-0341", "svc-pm-0342", "svc-pm-0344", "svc-pm-0351"]
};

export const initialStaff: StaffMember[] = STAFF_SEED.map((s) => ({
  id: s.id,
  fullName: s.first ? `${s.last} ${s.first}` : s.last,
  displayName: s.last,
  role: "therapist",
  sortOrder: s.order,
  serviceMenuIds: STAFF_COURSE_MAP[`${s.storeId}#${s.order}`] ?? [], // PM準拠の対応コース（未掲載=全コース対応）
  isActive: true,
  homeStoreId: s.storeId,
  lastName: s.last,
  firstName: s.first,
  nickname: s.nickname,
  gender: s.gender,
  regularDayOffs: s.off,
  personalNomination: true,
  genderNomination: true,
  freeMessage: s.note
}));

export const initialServices: ServiceMenu[] = [
  // --- PM実データ（7店舗・全カテゴリ 375件）2026-06-21 ---
  { id: "service-001", name: "ボディケア 60分", durationMinutes: 60, price: 8800, category: "ボディケア", sortOrder: 0, isActive: true, requiresPrivateRoom: false },
  { id: "service-002", name: "フェイシャル 45分", durationMinutes: 45, price: 9900, category: "フェイシャル", sortOrder: 0, isActive: true, requiresPrivateRoom: false },
  { id: "svc-pm-0001", name: "ピンポイント集中30分", durationMinutes: 30, price: 3410, category: "ボディケア", sortOrder: 10, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0002", name: "ボディケア30分", durationMinutes: 30, price: 3410, category: "ボディケア", sortOrder: 20, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0003", name: "ボディケア30分 ~クイック集中ケア~", durationMinutes: 30, price: 3410, category: "ボディケア", sortOrder: 30, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0004", name: "キッズルーム30分", durationMinutes: 30, price: 3630, category: "ボディケア", sortOrder: 40, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0005", name: "ピンポイント30分【ショートコース】", durationMinutes: 30, price: 3630, category: "ボディケア", sortOrder: 50, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0006", name: "マッサージ30分（Body Massage30mins）", durationMinutes: 30, price: 3630, category: "ボディケア", sortOrder: 60, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0007", name: "別館30分", durationMinutes: 30, price: 3630, category: "ボディケア", sortOrder: 70, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0008", name: "フット深層筋クリームケア30分", durationMinutes: 30, price: 4730, category: "ボディケア", sortOrder: 80, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0009", name: "ボディケア45分", durationMinutes: 45, price: 5115, category: "ボディケア", sortOrder: 90, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0010", name: "ボディケア45分 ~全身ライトケア~", durationMinutes: 45, price: 5115, category: "ボディケア", sortOrder: 100, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0011", name: "全身クイック45分", durationMinutes: 45, price: 5115, category: "ボディケア", sortOrder: 110, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0012", name: "キッズルーム45分", durationMinutes: 45, price: 5445, category: "ボディケア", sortOrder: 120, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0013", name: "クイックリフレッシュ45分", durationMinutes: 45, price: 5445, category: "ボディケア", sortOrder: 130, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0014", name: "マッサージ45分（Body Massage 45mins）", durationMinutes: 45, price: 5445, category: "ボディケア", sortOrder: 140, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0015", name: "別館45分", durationMinutes: 45, price: 5445, category: "ボディケア", sortOrder: 150, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0016", name: "ボディケア60分", durationMinutes: 60, price: 6820, category: "ボディケア", sortOrder: 160, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-kinshicho", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0017", name: "ボディケア60分 ~全身スタンダード~", durationMinutes: 60, price: 6820, category: "ボディケア", sortOrder: 170, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0018", name: "誕生月割引60分 ¥6220", durationMinutes: 60, price: 6820, category: "ボディケア", sortOrder: 180, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0019", name: "キッズルーム60分", durationMinutes: 60, price: 7260, category: "ボディケア", sortOrder: 190, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0020", name: "マッサージ60分（Body Massage 60mins）", durationMinutes: 60, price: 7260, category: "ボディケア", sortOrder: 200, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0021", name: "マッサージ60分【スタンダード全身】", durationMinutes: 60, price: 7260, category: "ボディケア", sortOrder: 210, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0022", name: "別館60分", durationMinutes: 60, price: 7260, category: "ボディケア", sortOrder: 220, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0023", name: "\"全身しっかり\"75分！", durationMinutes: 75, price: 8525, category: "ボディケア", sortOrder: 230, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0024", name: "《肩甲骨リセット》超回復75分", durationMinutes: 75, price: 8525, category: "ボディケア", sortOrder: 240, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0025", name: "ボディケア75分", durationMinutes: 75, price: 8525, category: "ボディケア", sortOrder: 250, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0026", name: "ボディケア75分 ~全身＋重点ケア~", durationMinutes: 75, price: 8525, category: "ボディケア", sortOrder: 260, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0027", name: "誕生月割引75分 ¥7925", durationMinutes: 75, price: 8525, category: "ボディケア", sortOrder: 270, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0028", name: "マッサージ75分", durationMinutes: 75, price: 9075, category: "ボディケア", sortOrder: 280, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0029", name: "マッサージ75分（Body Massage 75mins）", durationMinutes: 75, price: 9075, category: "ボディケア", sortOrder: 290, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0030", name: "別館75分", durationMinutes: 75, price: 9075, category: "ボディケア", sortOrder: 300, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0031", name: "\"全身集中\"90分！", durationMinutes: 90, price: 10230, category: "ボディケア", sortOrder: 310, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0032", name: "《肩甲骨リセット》超回復90分", durationMinutes: 90, price: 10230, category: "ボディケア", sortOrder: 320, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0033", name: "V字回復90分 ~人気No.1徹底改善~", durationMinutes: 90, price: 10230, category: "ボディケア", sortOrder: 330, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0034", name: "ボディケア90分", durationMinutes: 90, price: 10230, category: "ボディケア", sortOrder: 340, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0035", name: "ボディケア90分（オススメ！人気No.1）", durationMinutes: 90, price: 10230, category: "ボディケア", sortOrder: 350, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0036", name: "誕生月割引90分 ¥9330", durationMinutes: 90, price: 10230, category: "ボディケア", sortOrder: 360, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0037", name: "キッズルーム90分", durationMinutes: 90, price: 10890, category: "ボディケア", sortOrder: 370, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0038", name: "フット＆ボディー90分", durationMinutes: 90, price: 10890, category: "ボディケア", sortOrder: 380, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0039", name: "マッサージ90分（Body Massage 90mins）", durationMinutes: 90, price: 10890, category: "ボディケア", sortOrder: 390, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0040", name: "マッサージ90分【おすすめ！人気NO.1】", durationMinutes: 90, price: 10890, category: "ボディケア", sortOrder: 400, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0041", name: "別館90分", durationMinutes: 90, price: 10890, category: "ボディケア", sortOrder: 410, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0042", name: "\"\"ご褒美リセット\"\"105分！", durationMinutes: 105, price: 11935, category: "ボディケア", sortOrder: 420, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0043", name: "ボディケア105分", durationMinutes: 105, price: 11935, category: "ボディケア", sortOrder: 430, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0044", name: "全身疲労回復スペシャル105分 ~いつもより強い疲労感に~", durationMinutes: 105, price: 11935, category: "ボディケア", sortOrder: 440, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0045", name: "全身＋フット深層クリームケア90分", durationMinutes: 90, price: 11990, category: "ボディケア", sortOrder: 450, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0046", name: "マッサージ105分", durationMinutes: 105, price: 12705, category: "ボディケア", sortOrder: 460, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0047", name: "マッサージ105分（Body Massage 105mins）", durationMinutes: 105, price: 12705, category: "ボディケア", sortOrder: 470, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0048", name: "別館105分", durationMinutes: 105, price: 12705, category: "ボディケア", sortOrder: 480, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0049", name: "\"\"全身徹底ケア\"\"120分！", durationMinutes: 120, price: 13640, category: "ボディケア", sortOrder: 490, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0050", name: "ボディケア120分", durationMinutes: 120, price: 13640, category: "ボディケア", sortOrder: 500, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-mizonokuchi-premium"] },
  { id: "svc-pm-0051", name: "ボディケア120分（全身大満足）", durationMinutes: 120, price: 13640, category: "ボディケア", sortOrder: 510, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0052", name: "起死回生120分 ~全身徹底リセット~", durationMinutes: 120, price: 13640, category: "ボディケア", sortOrder: 520, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0053", name: "全身＋フット深層クリームケア105分", durationMinutes: 105, price: 13805, category: "ボディケア", sortOrder: 530, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0054", name: "マッサージ120分（Body Massage 120mins）", durationMinutes: 120, price: 14520, category: "ボディケア", sortOrder: 540, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0055", name: "マッサージ120分【ロングコース】", durationMinutes: 120, price: 14520, category: "ボディケア", sortOrder: 550, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0056", name: "別館120分", durationMinutes: 120, price: 14520, category: "ボディケア", sortOrder: 560, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0057", name: "全身＋フット深層クリームケア120分", durationMinutes: 120, price: 15620, category: "ボディケア", sortOrder: 570, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0058", name: "《徹底メンテナンス》150分！", durationMinutes: 150, price: 17050, category: "ボディケア", sortOrder: 580, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0059", name: "マッサージ150分", durationMinutes: 150, price: 18150, category: "ボディケア", sortOrder: 590, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0060", name: "村野限定！ プレミアムメンテナンス180分", durationMinutes: 180, price: 20640, category: "ボディケア", sortOrder: 600, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0061", name: "マッサージ180分", durationMinutes: 180, price: 21780, category: "ボディケア", sortOrder: 610, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0062", name: "マッサージ210分", durationMinutes: 210, price: 25410, category: "ボディケア", sortOrder: 620, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0063", name: "マッサージ240分", durationMinutes: 240, price: 29040, category: "ボディケア", sortOrder: 630, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0064", name: "快眠!!頭ほぐし30分", durationMinutes: 30, price: 4180, category: "ヘッド・頭ほぐし", sortOrder: 640, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0065", name: "ボディー30分+ヘッド15分", durationMinutes: 45, price: 5775, category: "ヘッド・頭ほぐし", sortOrder: 650, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0066", name: "ボディー45分+ヘッド15分", durationMinutes: 60, price: 7480, category: "ヘッド・頭ほぐし", sortOrder: 660, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0067", name: "脳リフレ！\"超\"回復60分", durationMinutes: 60, price: 7480, category: "ヘッド・頭ほぐし", sortOrder: 670, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0068", name: "\"ほっと\" 頭ほぐし75分コース", durationMinutes: 75, price: 9185, category: "ヘッド・頭ほぐし", sortOrder: 680, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0069", name: "ボディー60分+ヘッド15分", durationMinutes: 75, price: 9185, category: "ヘッド・頭ほぐし", sortOrder: 690, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0070", name: "超・眼精疲労回復術 整体＋頭ほぐしトータル75分 ¥9185", durationMinutes: 75, price: 9185, category: "ヘッド・頭ほぐし", sortOrder: 700, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0071", name: "脳リフレ！全身\"超\"回復75分", durationMinutes: 75, price: 9185, category: "ヘッド・頭ほぐし", sortOrder: 710, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0072", name: "全身＋ヘッドマッサージ75分", durationMinutes: 75, price: 9735, category: "ヘッド・頭ほぐし", sortOrder: 720, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0073", name: "HPB極・眼精疲労ヘッドスパ", durationMinutes: 60, price: 9900, category: "ヘッド・頭ほぐし", sortOrder: 730, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0074", name: "極・眼精疲労回復ヘッドスパ", durationMinutes: 60, price: 9900, category: "ヘッド・頭ほぐし", sortOrder: 740, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0075", name: "\"ほっと\" 頭ほぐし90分コース", durationMinutes: 90, price: 10890, category: "ヘッド・頭ほぐし", sortOrder: 750, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0076", name: "ボディー75分+ヘッド15分", durationMinutes: 90, price: 10890, category: "ヘッド・頭ほぐし", sortOrder: 760, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0077", name: "脳リフレ！全身\"超\"回復90分", durationMinutes: 90, price: 10890, category: "ヘッド・頭ほぐし", sortOrder: 770, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0078", name: "全身＋ヘッドマッサージ90分", durationMinutes: 90, price: 11550, category: "ヘッド・頭ほぐし", sortOrder: 780, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0079", name: "ヘッドマッサージ15分", durationMinutes: 15, price: 2475, category: "特別・スペシャル", sortOrder: 790, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0080", name: "【新規限定】スパシャン+ブロー45分 3300円→2860円（LUXASグループを初めてご利用限定）", durationMinutes: 45, price: 3300, category: "特別・スペシャル", sortOrder: 800, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0081", name: "学割U24", durationMinutes: 24, price: 3410, category: "特別・スペシャル", sortOrder: 810, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0082", name: "肩コリ集中アプローチ30分コース", durationMinutes: 30, price: 3410, category: "特別・スペシャル", sortOrder: 820, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0083", name: "デスクワーク45分", durationMinutes: 45, price: 5115, category: "特別・スペシャル", sortOrder: 830, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0084", name: "マタニティ45分", durationMinutes: 45, price: 5115, category: "特別・スペシャル", sortOrder: 840, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0085", name: "寄附金付新規体験45分4,500円", durationMinutes: 45, price: 5115, category: "特別・スペシャル", sortOrder: 850, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0086", name: "昼割 45分ボディケアコース", durationMinutes: 45, price: 5115, category: "特別・スペシャル", sortOrder: 860, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0087", name: "マッサージ45分（Body Massage 45mins）", durationMinutes: 45, price: 5445, category: "特別・スペシャル", sortOrder: 870, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0088", name: "【ご新規様 当店１番人気☆】至福の夢見心地ヘッドスパ ＋ブロー60分 ¥4840", durationMinutes: 60, price: 5500, category: "特別・スペシャル", sortOrder: 880, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0089", name: "お父さんいつもありがとう『心を込めて夢スパ』¥5200", durationMinutes: 60, price: 5500, category: "特別・スペシャル", sortOrder: 890, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0090", name: "天使の輪シャンプー", durationMinutes: 60, price: 5630, category: "特別・スペシャル", sortOrder: 900, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0091", name: "頭肩Wスッキリ45分コース", durationMinutes: 45, price: 5775, category: "特別・スペシャル", sortOrder: 910, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0092", name: "【初回限定 整体】マタニティーサポートコース 60分 6820円→6220円（LUXASグループを初めてご利用限定）", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 920, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0093", name: "【初回限定 整体】産後ケアコース 60分 6820円→6220円（LUXASグループを初めてご利用限定）", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 930, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0094", name: "デスクワーク60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 940, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0095", name: "マタニティ60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 950, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0096", name: "マタニティコース60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 960, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0097", name: "リフレッシュ60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 970, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0098", name: "リラックス60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 980, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0099", name: "腰ガチ揉み60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 990, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0100", name: "産後ケア60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 1000, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0101", name: "新規体験寄附金付60分5,980円", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 1010, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0102", name: "昼割 60分ボディケアコース", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 1020, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0103", name: "天使の羽整体", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 1030, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0104", name: "疲労超回復60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 1040, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0105", name: "平日10時限定60分", durationMinutes: 60, price: 6820, category: "特別・スペシャル", sortOrder: 1050, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0106", name: "マタニティケア60分", durationMinutes: 60, price: 7260, category: "特別・スペシャル", sortOrder: 1060, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0107", name: "寄附金付新規60分コース", durationMinutes: 60, price: 7260, category: "特別・スペシャル", sortOrder: 1070, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0108", name: "初めてのお客さま限定 寄附金付マッサージ60分コース￥6,534", durationMinutes: 60, price: 7260, category: "特別・スペシャル", sortOrder: 1080, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0109", name: "『月替』疲労超回復60分", durationMinutes: 60, price: 7480, category: "特別・スペシャル", sortOrder: 1090, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0110", name: "疲労超回復60分（身体を温めながら施術）", durationMinutes: 60, price: 7480, category: "特別・スペシャル", sortOrder: 1100, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0111", name: "カッピング60分", durationMinutes: 60, price: 8470, category: "特別・スペシャル", sortOrder: 1110, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0112", name: "[平日限定]寄附金付75分コース ¥8025", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1120, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0113", name: "【初回限定 整体】デスクワークコース75分8525円→7825円／首の疲れ解消♪（LUXASグループを初めてご利用限定）", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1130, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0114", name: "☆ご新規様限定☆お試し全身ボディケア75分（⬇︎7,700円）", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1140, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0115", name: "HPB整体75", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1150, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0116", name: "お父さんいつもありがとう整体75分コース¥8025", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1160, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0117", name: "デスクワーク75分", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1170, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0118", name: "リフレッシュ75分", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1180, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0119", name: "リラックス75分", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1190, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0120", name: "寄附金付75分コース300円引き", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1200, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0121", name: "肩・腰集中75分コース", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1210, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0122", name: "腰ガチ揉み75分", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1220, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0123", name: "昼割 75分ボディケアコース", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1230, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0124", name: "疲労超回復75分", durationMinutes: 75, price: 8525, category: "特別・スペシャル", sortOrder: 1240, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0125", name: "漢（オトコ）のガチ揉み75分", durationMinutes: 75, price: 9075, category: "特別・スペシャル", sortOrder: 1250, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0126", name: "寄附金付新規75分コース", durationMinutes: 75, price: 9075, category: "特別・スペシャル", sortOrder: 1260, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0127", name: "肩・首リフレッシュスペシャル75分【A・上半身集中】", durationMinutes: 75, price: 9075, category: "特別・スペシャル", sortOrder: 1270, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0128", name: "腰・脚リフレッシュプレミアム75分【B・下半身集中】", durationMinutes: 75, price: 9075, category: "特別・スペシャル", sortOrder: 1280, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0129", name: "初めてのお客さま限定 寄附金付マッサージ75分コース￥8.167", durationMinutes: 75, price: 9075, category: "特別・スペシャル", sortOrder: 1290, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0130", name: "冷え解消！ほっこりあったかリラックス75分", durationMinutes: 75, price: 9075, category: "特別・スペシャル", sortOrder: 1300, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0131", name: "『月替』頭ほぐし75分", durationMinutes: 75, price: 9185, category: "特別・スペシャル", sortOrder: 1310, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0132", name: "レディースプラン揉みほぐし60分+頭ほぐし15分 8745円", durationMinutes: 75, price: 9185, category: "特別・スペシャル", sortOrder: 1320, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0133", name: "寄附金付頭ほぐし75分コース300円引き", durationMinutes: 75, price: 9185, category: "特別・スペシャル", sortOrder: 1330, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0134", name: "深眠サポート 整体60分+頭ほぐし15分 ¥8885", durationMinutes: 75, price: 9185, category: "特別・スペシャル", sortOrder: 1340, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0135", name: "頭ほぐし75分", durationMinutes: 75, price: 9185, category: "特別・スペシャル", sortOrder: 1350, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0136", name: "全身リフトアップコース75分", durationMinutes: 75, price: 9625, category: "特別・スペシャル", sortOrder: 1360, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0137", name: "すっきり“ヘッドケア”75分", durationMinutes: 75, price: 9735, category: "特別・スペシャル", sortOrder: 1370, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0138", name: "【 当店人気No.1 】ボディケア90分", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1380, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0139", name: "☆ご新規様限定☆お試し全身ボディケア90分（⬇︎8,800円）", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1390, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0140", name: "デスクワーク90分", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1400, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0141", name: "リフレッシュ90分", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1410, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0142", name: "リラックス９０分", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1420, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0143", name: "寄附金付90分コース 300円引き（オススメ！人気No.1）\"", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1430, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0144", name: "昼割 90分ボディケアコース", durationMinutes: 90, price: 10230, category: "特別・スペシャル", sortOrder: 1440, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0145", name: "もみのばし90分コース(山口のみ)", durationMinutes: 90, price: 10890, category: "特別・スペシャル", sortOrder: 1450, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0146", name: "漢（オトコ）のガチ揉み90分", durationMinutes: 90, price: 10890, category: "特別・スペシャル", sortOrder: 1460, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0147", name: "初めてのお客さま限定 寄附金付マッサージ90分コース￥9,801", durationMinutes: 90, price: 10890, category: "特別・スペシャル", sortOrder: 1470, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0148", name: "頭ほぐし90分", durationMinutes: 90, price: 10890, category: "特別・スペシャル", sortOrder: 1480, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0149", name: "疲労超回復90分（身体を温めながら施術）", durationMinutes: 90, price: 10890, category: "特別・スペシャル", sortOrder: 1490, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0150", name: "全身リフトアップコース90分", durationMinutes: 90, price: 11330, category: "特別・スペシャル", sortOrder: 1500, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0151", name: "膝下解放足ツボ90分コース(宮川のみ)", durationMinutes: 90, price: 11330, category: "特別・スペシャル", sortOrder: 1510, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0152", name: "すっきり“ヘッドケア”90分", durationMinutes: 90, price: 11550, category: "特別・スペシャル", sortOrder: 1520, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0153", name: "カッピング90分", durationMinutes: 90, price: 11880, category: "特別・スペシャル", sortOrder: 1530, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0154", name: "昼割 105分ボディケアコース", durationMinutes: 105, price: 11935, category: "特別・スペシャル", sortOrder: 1540, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0155", name: "[1回限定]深層ヘッドセラピーが初めての方¥13200→¥12200", durationMinutes: 60, price: 13200, category: "特別・スペシャル", sortOrder: 1550, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0156", name: "深層ヘッドセラピー ¥13200", durationMinutes: 60, price: 13200, category: "特別・スペシャル", sortOrder: 1560, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0157", name: "全身＋ヘッドマッサージ105分", durationMinutes: 105, price: 13365, category: "特別・スペシャル", sortOrder: 1570, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0158", name: "昼割 120分ボディケアコース", durationMinutes: 120, price: 13640, category: "特別・スペシャル", sortOrder: 1580, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0159", name: "スーパーデラックス120分", durationMinutes: 120, price: 14520, category: "特別・スペシャル", sortOrder: 1590, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0160", name: "膝下解放足ツボ120分コース(宮川のみ)", durationMinutes: 120, price: 14740, category: "特別・スペシャル", sortOrder: 1600, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0161", name: "全身＋ヘッドマッサージ120分", durationMinutes: 120, price: 15180, category: "特別・スペシャル", sortOrder: 1610, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0162", name: "[特別プライス 整体]寄附金付新規60分コース（LUXASグループを初めてご利用限定）¥6,220", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1620, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0163", name: "寄附金付デスクワーク60分コース", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1630, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0164", name: "寄附金付新規60分（初来店のお客様限定）", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1640, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0165", name: "寄附金付新規60分コース", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1650, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0166", name: "寄附金付新規60分コース （初めての方限定）", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1660, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0167", name: "寄附金付新規60分コース（初めての方限定）", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1670, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0168", name: "寄附金付疲労超回復60分コース", durationMinutes: 60, price: 6820, category: "寄附金付き", sortOrder: 1680, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0169", name: "初めてのお客様限定 寄附金付き60分コース", durationMinutes: 60, price: 7260, category: "寄附金付き", sortOrder: 1690, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0170", name: "寄附金付疲労超回復60分コース", durationMinutes: 60, price: 7480, category: "寄附金付き", sortOrder: 1700, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0171", name: "[特別プライス 整体]寄附金付新規75分コース（LUXASグループを初めてご利用限定）¥7,825", durationMinutes: 75, price: 8525, category: "寄附金付き", sortOrder: 1710, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0172", name: "{特別プライス]寄附金付新規75分コース（初めての方限定）¥7825", durationMinutes: 75, price: 8525, category: "寄附金付き", sortOrder: 1720, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0173", name: "寄附金付75分！", durationMinutes: 75, price: 8525, category: "寄附金付き", sortOrder: 1730, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0174", name: "寄附金付75分コース", durationMinutes: 75, price: 8525, category: "寄附金付き", sortOrder: 1740, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-mizonokuchi-premium", "store-gotanda-east"] },
  { id: "svc-pm-0175", name: "寄附金付新規75分コース（初めての方限定）", durationMinutes: 75, price: 8525, category: "寄附金付き", sortOrder: 1750, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0176", name: "寄附金付疲労超回復75分コース", durationMinutes: 75, price: 8525, category: "寄附金付き", sortOrder: 1760, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0177", name: "寄附金付75分コース", durationMinutes: 75, price: 9075, category: "寄附金付き", sortOrder: 1770, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0178", name: "寄附金付き75分コース", durationMinutes: 75, price: 9075, category: "寄附金付き", sortOrder: 1780, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0179", name: "寄附金付スッキリA（上半身中心）75分コース", durationMinutes: 75, price: 9075, category: "寄附金付き", sortOrder: 1790, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0180", name: "寄附金付スッキリB（下半身中心）75分コース", durationMinutes: 75, price: 9075, category: "寄附金付き", sortOrder: 1800, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0181", name: "初めてのお客様限定 寄附金付き75分コース", durationMinutes: 75, price: 9075, category: "寄附金付き", sortOrder: 1810, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0182", name: "寄附金付頭ほぐし75分コース", durationMinutes: 75, price: 9185, category: "寄附金付き", sortOrder: 1820, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east"] },
  { id: "svc-pm-0183", name: "寄附金付脳リフレ！超回復75分！", durationMinutes: 75, price: 9185, category: "寄附金付き", sortOrder: 1830, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0184", name: "寄附金付全身＋頭ほぐし75分コース", durationMinutes: 75, price: 9735, category: "寄附金付き", sortOrder: 1840, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0185", name: "寄附金付90分！", durationMinutes: 90, price: 10230, category: "寄附金付き", sortOrder: 1850, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0186", name: "寄附金付90分コース", durationMinutes: 90, price: 10230, category: "寄附金付き", sortOrder: 1860, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east"] },
  { id: "svc-pm-0187", name: "寄附金付90分コース", durationMinutes: 90, price: 10890, category: "寄附金付き", sortOrder: 1870, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0188", name: "寄附金付脳リフレ！超回復90分！", durationMinutes: 90, price: 10890, category: "寄附金付き", sortOrder: 1880, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0189", name: "初めてのお客様限定 寄附金付き90分コース", durationMinutes: 90, price: 10890, category: "寄附金付き", sortOrder: 1890, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0190", name: "寄附金付全身＋頭ほぐし90分コース", durationMinutes: 90, price: 11550, category: "寄附金付き", sortOrder: 1900, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0191", name: "インバウンド頭ほぐし", durationMinutes: 60, price: 2365, category: "インバウンド", sortOrder: 1910, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0192", name: "インバウンド30", durationMinutes: 30, price: 3410, category: "インバウンド", sortOrder: 1920, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0193", name: "インバウンド45", durationMinutes: 45, price: 5115, category: "インバウンド", sortOrder: 1930, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0194", name: "インバウンド60", durationMinutes: 60, price: 6820, category: "インバウンド", sortOrder: 1940, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0195", name: "インバウンド75", durationMinutes: 75, price: 8525, category: "インバウンド", sortOrder: 1950, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0196", name: "インバウンド90", durationMinutes: 90, price: 10230, category: "インバウンド", sortOrder: 1960, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0197", name: "インバウンド105", durationMinutes: 105, price: 11935, category: "インバウンド", sortOrder: 1970, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0198", name: "インバウンド120", durationMinutes: 120, price: 13640, category: "インバウンド", sortOrder: 1980, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0199", name: "Body Massage 60min/按摩療程 60分", durationMinutes: 60, price: 6820, category: "外国人向け", sortOrder: 1990, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0200", name: "Body Massage 60minutes//按摩療程 60分", durationMinutes: 60, price: 6820, category: "外国人向け", sortOrder: 2000, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0201", name: "Body Massage 60minutes/按摩療程 60分", durationMinutes: 60, price: 6820, category: "外国人向け", sortOrder: 2010, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0202", name: "Body Massage 60分/按摩療程 60分", durationMinutes: 60, price: 6820, category: "外国人向け", sortOrder: 2020, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0203", name: "Body Massage 60分/按摩療程 60分", durationMinutes: 60, price: 7260, category: "外国人向け", sortOrder: 2030, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0204", name: "指圧マッサージ 60分", durationMinutes: 60, price: 7260, category: "外国人向け", sortOrder: 2040, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0205", name: "和のクイックリフレッシュ60分コース", durationMinutes: 60, price: 7260, category: "外国人向け", sortOrder: 2050, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0206", name: "Body Massage 75 with donation/【愛心公益基金捐款】按摩療程", durationMinutes: 75, price: 8525, category: "外国人向け", sortOrder: 2060, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0207", name: "Body Massage 90 with donation/【愛心公益基金捐款】按摩療程", durationMinutes: 90, price: 10230, category: "外国人向け", sortOrder: 2070, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0208", name: "Body Massage 90min/按摩療程 90分", durationMinutes: 90, price: 10230, category: "外国人向け", sortOrder: 2080, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0209", name: "Body Massage 90minutes//按摩療程 90分", durationMinutes: 90, price: 10230, category: "外国人向け", sortOrder: 2090, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0210", name: "Body Massage 90minutes/按摩療程 90分", durationMinutes: 90, price: 10230, category: "外国人向け", sortOrder: 2100, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0211", name: "Body Massage 90分/按摩療程 90分", durationMinutes: 90, price: 10230, category: "外国人向け", sortOrder: 2110, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0212", name: "Body Massage 90分/按摩療程 90分", durationMinutes: 90, price: 10890, category: "外国人向け", sortOrder: 2120, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0213", name: "指圧マッサージ 90分", durationMinutes: 90, price: 10890, category: "外国人向け", sortOrder: 2130, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0214", name: "濃密ボディケア90分コース", durationMinutes: 90, price: 10890, category: "外国人向け", sortOrder: 2140, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0215", name: "極みのマッサージ＆お土産付き90分コース", durationMinutes: 90, price: 13200, category: "外国人向け", sortOrder: 2150, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0216", name: "Body Massage 120/按摩療程 120分", durationMinutes: 120, price: 13640, category: "外国人向け", sortOrder: 2160, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0217", name: "Body Massage 120min/按摩療程 120分", durationMinutes: 120, price: 13640, category: "外国人向け", sortOrder: 2170, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0218", name: "Body Massage 120minutes//按摩療程 120分", durationMinutes: 120, price: 13640, category: "外国人向け", sortOrder: 2180, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0219", name: "Body Massage 120minutes/按摩療程 120分", durationMinutes: 120, price: 13640, category: "外国人向け", sortOrder: 2190, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0220", name: "Body Massage 120/按摩療程 120分", durationMinutes: 120, price: 14520, category: "外国人向け", sortOrder: 2200, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0221", name: "プレミアムボディリセット120分コース", durationMinutes: 120, price: 14520, category: "外国人向け", sortOrder: 2210, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0222", name: "指圧マッサージ 120分", durationMinutes: 120, price: 14520, category: "外国人向け", sortOrder: 2220, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0223", name: "至福のマッサージ120分＆お土産付きコース", durationMinutes: 120, price: 16500, category: "外国人向け", sortOrder: 2230, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0224", name: "マタニティ45分コース", durationMinutes: 45, price: 5115, category: "マタニティ", sortOrder: 2240, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0225", name: "マタニティ60分(安定期・妊娠16週以降の方)", durationMinutes: 60, price: 6820, category: "マタニティ", sortOrder: 2250, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0226", name: "マタニティ60分コース", durationMinutes: 60, price: 6820, category: "マタニティ", sortOrder: 2260, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-east"] },
  { id: "svc-pm-0227", name: "マタニティケア60分(安定期のお客様)", durationMinutes: 60, price: 6820, category: "マタニティ", sortOrder: 2270, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0228", name: "マタニティ60分", durationMinutes: 60, price: 7260, category: "マタニティ", sortOrder: 2280, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0229", name: "鍼30分", durationMinutes: 30, price: 4290, category: "鍼", sortOrder: 2290, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0230", name: "出張鍼60分", durationMinutes: 60, price: 8580, category: "鍼", sortOrder: 2300, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0231", name: "鍼60分", durationMinutes: 60, price: 8580, category: "鍼", sortOrder: 2310, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0232", name: "出張鍼90分", durationMinutes: 90, price: 12870, category: "鍼", sortOrder: 2320, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0233", name: "鍼90分", durationMinutes: 90, price: 12870, category: "鍼", sortOrder: 2330, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0234", name: "出張鍼120分", durationMinutes: 120, price: 17160, category: "鍼", sortOrder: 2340, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0235", name: "鍼120分", durationMinutes: 120, price: 17160, category: "鍼", sortOrder: 2350, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0236", name: "2回目チケットシャンプー", durationMinutes: 60, price: 2300, category: "シャンプー", sortOrder: 2360, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0237", name: "ヘルプシャンプー", durationMinutes: 60, price: 2310, category: "シャンプー", sortOrder: 2370, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0238", name: "スパシャン11回券をお持ちの方限定", durationMinutes: 60, price: 2700, category: "シャンプー", sortOrder: 2380, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0239", name: "スパシャン5回券をお持ちの方限定", durationMinutes: 60, price: 3100, category: "シャンプー", sortOrder: 2390, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0240", name: "セットシャンプー3回券", durationMinutes: 60, price: 3100, category: "シャンプー", sortOrder: 2400, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0241", name: "スパシャン", durationMinutes: 60, price: 3300, category: "シャンプー", sortOrder: 2410, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0242", name: "メンズ スパシャン", durationMinutes: 60, price: 3300, category: "シャンプー", sortOrder: 2420, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0243", name: "スパシャン+肩もみ5分", durationMinutes: 60, price: 3850, category: "シャンプー", sortOrder: 2430, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0244", name: "ミント スパシャン", durationMinutes: 60, price: 3850, category: "シャンプー", sortOrder: 2440, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0245", name: "Wスパシャン", durationMinutes: 60, price: 4400, category: "シャンプー", sortOrder: 2450, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0246", name: "ミント スパシャン＋肩もみ5分", durationMinutes: 60, price: 4400, category: "シャンプー", sortOrder: 2460, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0247", name: "炭酸 スパシャン", durationMinutes: 60, price: 4400, category: "シャンプー", sortOrder: 2470, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0248", name: "炭酸頭皮ケア スパシャン", durationMinutes: 60, price: 4400, category: "シャンプー", sortOrder: 2480, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0249", name: "2回目チケット夢", durationMinutes: 60, price: 4500, category: "シャンプー", sortOrder: 2490, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0250", name: "至福の「夢ヘッドスパ」", durationMinutes: 60, price: 5500, category: "シャンプー", sortOrder: 2500, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0251", name: "セット整体3回券", durationMinutes: 60, price: 6520, category: "シャンプー", sortOrder: 2510, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0252", name: "夢スパ プレミアム¥7200", durationMinutes: 60, price: 7200, category: "シャンプー", sortOrder: 2520, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0253", name: "2回目眼精スパ", durationMinutes: 60, price: 8900, category: "シャンプー", sortOrder: 2530, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0254", name: "2回目チケット深層", durationMinutes: 60, price: 12200, category: "シャンプー", sortOrder: 2540, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0255", name: "深層ヘッドセラピー ¥13200", durationMinutes: 60, price: 13200, category: "シャンプー", sortOrder: 2550, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0256", name: "出張マッサージ60分", durationMinutes: 60, price: 7260, category: "出張", sortOrder: 2560, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0257", name: "出張マッサージ60分", durationMinutes: 60, price: 7370, category: "出張", sortOrder: 2570, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0258", name: "出張マッサージ90分", durationMinutes: 90, price: 10890, category: "出張", sortOrder: 2580, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0259", name: "出張マッサージ90分", durationMinutes: 90, price: 11055, category: "出張", sortOrder: 2590, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0260", name: "出張マッサージ120分", durationMinutes: 120, price: 14520, category: "出張", sortOrder: 2600, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0261", name: "出張マッサージ120分", durationMinutes: 120, price: 14740, category: "出張", sortOrder: 2610, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0262", name: "出張マッサージ150分", durationMinutes: 150, price: 18150, category: "出張", sortOrder: 2620, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0263", name: "出張マッサージ150分", durationMinutes: 150, price: 18425, category: "出張", sortOrder: 2630, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0264", name: "出張マッサージ180分", durationMinutes: 180, price: 21780, category: "出張", sortOrder: 2640, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0265", name: "出張マッサージ180分", durationMinutes: 180, price: 22110, category: "出張", sortOrder: 2650, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0266", name: "出張マッサージ210分", durationMinutes: 210, price: 25410, category: "出張", sortOrder: 2660, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0267", name: "出張マッサージ210分", durationMinutes: 210, price: 25795, category: "出張", sortOrder: 2670, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0268", name: "出張マッサージ240分", durationMinutes: 240, price: 29040, category: "出張", sortOrder: 2680, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0269", name: "出張マッサージ240分", durationMinutes: 240, price: 29480, category: "出張", sortOrder: 2690, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0270", name: "【眼のお疲れ・日々の疲れ】マッサージシャンプー＋ブロー", durationMinutes: 60, price: 3300, category: "HPB", sortOrder: 2700, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0271", name: "HPBシャンプー＆ドライ", durationMinutes: 60, price: 3300, category: "HPB", sortOrder: 2710, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0272", name: "HPBスパシャン", durationMinutes: 60, price: 3300, category: "HPB", sortOrder: 2720, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0273", name: "HPBメンズシャンプー", durationMinutes: 60, price: 3300, category: "HPB", sortOrder: 2730, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0274", name: "新新規スパシャン+ブロー30分", durationMinutes: 30, price: 3300, category: "HPB", sortOrder: 2740, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0275", name: "HPBダブルシャンプー", durationMinutes: 60, price: 4400, category: "HPB", sortOrder: 2750, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0276", name: "HPB45分", durationMinutes: 45, price: 5115, category: "HPB", sortOrder: 2760, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0277", name: "HPB新規45分", durationMinutes: 45, price: 5115, category: "HPB", sortOrder: 2770, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0278", name: "HPB新規5％OFF45分", durationMinutes: 45, price: 5115, category: "HPB", sortOrder: 2780, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0279", name: "新社会人U24", durationMinutes: 24, price: 5115, category: "HPB", sortOrder: 2790, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0280", name: "HPB新規夢スパ¥4840", durationMinutes: 60, price: 5500, category: "HPB", sortOrder: 2800, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0281", name: "HPB夢スパ", durationMinutes: 60, price: 5500, category: "HPB", sortOrder: 2810, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0282", name: "新新規至 福の夢スパ", durationMinutes: 60, price: 5500, category: "HPB", sortOrder: 2820, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0283", name: "HPB 温感ヘット肩Wスッキリ", durationMinutes: 60, price: 5775, category: "HPB", sortOrder: 2830, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0284", name: "HPB新規 夢スパプレミアム¥6600", durationMinutes: 60, price: 6600, category: "HPB", sortOrder: 2840, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0285", name: "HPB 60分マタニティ下半身", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2850, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0286", name: "HPB 60分マタニティ上半身", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2860, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0287", name: "HPB 60分産後ケア", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2870, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0288", name: "HPB 60分上半身集中", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2880, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0289", name: "HPB 60分足中心", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2890, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0290", name: "HPB60分", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2900, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0291", name: "HPBビビビ60分", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2910, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0292", name: "HPB月限定(840円割引)60分目の疲労集中", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2920, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0293", name: "HPB口コミ60分", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2930, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0294", name: "HPB新規15％OFF60分", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2940, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0295", name: "HPB新規60分", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2950, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0296", name: "HPB整体60", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2960, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0297", name: "HPB平日10時限定60分", durationMinutes: 60, price: 6820, category: "HPB", sortOrder: 2970, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0298", name: "HPB660円OFF疲労超回復60分", durationMinutes: 60, price: 7480, category: "HPB", sortOrder: 2980, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0299", name: "HPB疲労超回復60分", durationMinutes: 60, price: 7480, category: "HPB", sortOrder: 2990, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0300", name: "HPB吸玉60分", durationMinutes: 60, price: 8470, category: "HPB", sortOrder: 3000, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0301", name: "HPB75分", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3010, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0302", name: "HPB75分（ヘッド15分）", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3020, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0303", name: "HPB75分（首肩15分）", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3030, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0304", name: "HPB75分（足裏ふくらはぎ15分）", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3040, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0305", name: "HPB新規15％OFF75分", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3050, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0306", name: "HPB新規75分", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3060, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0307", name: "HPB整体75", durationMinutes: 75, price: 8525, category: "HPB", sortOrder: 3070, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0308", name: "HPB 頭ほぐし75分", durationMinutes: 75, price: 9185, category: "HPB", sortOrder: 3080, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0309", name: "HPB頭ほぐし75分660円OFF", durationMinutes: 75, price: 9185, category: "HPB", sortOrder: 3090, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0310", name: "HPB眼精疲労スパ", durationMinutes: 60, price: 9900, category: "HPB", sortOrder: 3100, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0311", name: "HPB新規眼精シャンプー", durationMinutes: 60, price: 9900, category: "HPB", sortOrder: 3110, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0312", name: "HPB 90分骨盤矯正", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3120, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0313", name: "HPB 90分首肩甲骨集中", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3130, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0314", name: "HPB 90分理想のボディ", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3140, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0315", name: "HPB10%OFF骨盤矯正90分", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3150, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0316", name: "HPB10%OFF首肩集中90分", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3160, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0317", name: "HPB90分", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3170, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0318", name: "HPB新規15％OFF90分", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3180, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0319", name: "HPB新規90分", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3190, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0320", name: "HPB整体90", durationMinutes: 90, price: 10230, category: "HPB", sortOrder: 3200, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0321", name: "HPB疲労超回復90分", durationMinutes: 90, price: 10890, category: "HPB", sortOrder: 3210, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0322", name: "HPB吸玉90分", durationMinutes: 90, price: 11880, category: "HPB", sortOrder: 3220, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0323", name: "HPB105分", durationMinutes: 105, price: 11935, category: "HPB", sortOrder: 3230, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0324", name: "HPB深層スパ", durationMinutes: 60, price: 13200, category: "HPB", sortOrder: 3240, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-mizonokuchi-premium"] },
  { id: "svc-pm-0325", name: "HPB10%OFF120分", durationMinutes: 120, price: 13640, category: "HPB", sortOrder: 3250, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0326", name: "HPB120分", durationMinutes: 120, price: 13640, category: "HPB", sortOrder: 3260, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0327", name: "Cマタニティ整体60分 （安定期のみ）", durationMinutes: 60, price: 5456, category: "ClassPass", sortOrder: 3270, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0328", name: "C全身マッサージ60分", durationMinutes: 60, price: 5456, category: "ClassPass", sortOrder: 3280, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0329", name: "Cマタニティ60分", durationMinutes: 60, price: 5808, category: "ClassPass", sortOrder: 3290, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0330", name: "Cマタニティ整体60分 （安定期のみ）", durationMinutes: 60, price: 5808, category: "ClassPass", sortOrder: 3300, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0331", name: "C全身マッサージ60分", durationMinutes: 60, price: 5808, category: "ClassPass", sortOrder: 3310, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0332", name: "C疲労超回復60分", durationMinutes: 60, price: 5984, category: "ClassPass", sortOrder: 3320, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0333", name: "C下半身中心75分", durationMinutes: 75, price: 6820, category: "ClassPass", sortOrder: 3330, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0334", name: "C上半身中心75分", durationMinutes: 75, price: 6820, category: "ClassPass", sortOrder: 3340, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0335", name: "C鍼60分", durationMinutes: 60, price: 6864, category: "ClassPass", sortOrder: 3350, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0336", name: "C下半身中心75分", durationMinutes: 75, price: 7260, category: "ClassPass", sortOrder: 3360, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0337", name: "C上半身中心75分", durationMinutes: 75, price: 7260, category: "ClassPass", sortOrder: 3370, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0338", name: "Cヘッドマッサージ15分付75分", durationMinutes: 75, price: 7348, category: "ClassPass", sortOrder: 3380, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0339", name: "C脳リフレ！全身\"超\"回復75分", durationMinutes: 75, price: 7348, category: "ClassPass", sortOrder: 3390, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0340", name: "Cヘッドマッサージ15分付75分", durationMinutes: 75, price: 7788, category: "ClassPass", sortOrder: 3400, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0341", name: "C寄附金付きリラクゼーション90分コース", durationMinutes: 90, price: 8184, category: "ClassPass", sortOrder: 3410, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0342", name: "C全身マッサージプレミアム 90分コース", durationMinutes: 90, price: 8184, category: "ClassPass", sortOrder: 3420, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0343", name: "\"C全身マッサージプレミアム 90分コース\"", durationMinutes: 90, price: 8712, category: "ClassPass", sortOrder: 3430, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0344", name: "Cヘッドマッサージ15分付90分", durationMinutes: 90, price: 8712, category: "ClassPass", sortOrder: 3440, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0345", name: "C寄附金付きリラクゼーション90分コース", durationMinutes: 90, price: 8712, category: "ClassPass", sortOrder: 3450, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0346", name: "C全身マッサージプレミアム 90分コース", durationMinutes: 90, price: 8712, category: "ClassPass", sortOrder: 3460, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0347", name: "C脳リフレ！全身\"超\"回復90分", durationMinutes: 90, price: 8712, category: "ClassPass", sortOrder: 3470, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-kinshicho"] },
  { id: "svc-pm-0348", name: "Cヘッドマッサージ15分付90分", durationMinutes: 90, price: 9240, category: "ClassPass", sortOrder: 3480, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro", "store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0349", name: "Cカッピング90分", durationMinutes: 90, price: 9504, category: "ClassPass", sortOrder: 3490, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya"] },
  { id: "svc-pm-0350", name: "C鍼90分", durationMinutes: 90, price: 10296, category: "ClassPass", sortOrder: 3500, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0351", name: "C至福のマッサージ120分コース", durationMinutes: 120, price: 10912, category: "ClassPass", sortOrder: 3510, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-kinshicho", "store-gotanda-east", "store-gotanda-west"] },
  { id: "svc-pm-0352", name: "C至福のマッサージ120分コース", durationMinutes: 120, price: 11616, category: "ClassPass", sortOrder: 3520, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-motomachi-chukagai-plus"] },
  { id: "svc-pm-0353", name: "C至福のマッサージ120分＆お土産付きコース", durationMinutes: 120, price: 13200, category: "ClassPass", sortOrder: 3530, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0354", name: "【変換不可】", durationMinutes: 60, price: 0, category: "TORICOM", sortOrder: 3540, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-shibuya", "store-nakameguro"] },
  { id: "svc-pm-0355", name: "HPB口コミ", durationMinutes: 60, price: 0, category: "TORICOM", sortOrder: 3550, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0356", name: "HB【ご新規様限定10%OFF】マタニティサポートコース60分 ￥7260→￥6534", durationMinutes: 60, price: 6534, category: "TORICOM", sortOrder: 3560, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0357", name: "HB【ご新規様限定10%OFF】リピーター続出 マッサージ60分 ￥7260→￥6534", durationMinutes: 60, price: 6534, category: "TORICOM", sortOrder: 3570, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0358", name: "産後の辛い肩こり・腰痛に◎産後ケアコース60分￥6820", durationMinutes: 60, price: 6820, category: "TORICOM", sortOrder: 3580, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0359", name: "HBマタニティサポートコース マッサージ60分￥7260", durationMinutes: 60, price: 7260, category: "TORICOM", sortOrder: 3590, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0360", name: "HPスタンダード全身マッサージ６０分コース￥7260", durationMinutes: 60, price: 7260, category: "TORICOM", sortOrder: 3600, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0361", name: "HB【ご新規様限定10%OFF】 リピーター続出 マッサージ75分￥9075→￥8168", durationMinutes: 75, price: 8168, category: "TORICOM", sortOrder: 3610, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0362", name: "HB【ご新規様限定10%OFF】肩・首リフレッシュSP75分￥9075→￥8168", durationMinutes: 75, price: 8168, category: "TORICOM", sortOrder: 3620, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0363", name: "HB【ご新規様限定10%OFF】腰・脚リフレッシュPR75分￥9075→￥8168", durationMinutes: 75, price: 8168, category: "TORICOM", sortOrder: 3630, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0364", name: "HBプチ贅沢マッサージ７５分コース￥9075", durationMinutes: 75, price: 9075, category: "TORICOM", sortOrder: 3640, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0365", name: "HBすっきりヘッドケア７５分コース￥9735", durationMinutes: 75, price: 9735, category: "TORICOM", sortOrder: 3650, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0366", name: "HB【ご新規様限定10%OFF】リピーター続出 マッサージ90分 ￥10890→￥9801", durationMinutes: 90, price: 9801, category: "TORICOM", sortOrder: 3660, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0367", name: "HB新規10%OFF ヘッドケア90分", durationMinutes: 90, price: 10395, category: "TORICOM", sortOrder: 3670, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0368", name: "HP至福のヘッドケアコース90分￥11550", durationMinutes: 90, price: 11550, category: "TORICOM", sortOrder: 3680, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0369", name: "ポイント30分無料", durationMinutes: 30, price: 0, category: "その他", sortOrder: 3690, isActive: true, requiresPrivateRoom: false, onlineBooking: false, storeScope: "selected", storeIds: ["store-nakameguro"] },
  { id: "svc-pm-0370", name: "新規体験寄附金付45分コース", durationMinutes: 45, price: 5115, category: "その他", sortOrder: 3700, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0371", name: "新規体験寄附金付60分コース", durationMinutes: 60, price: 6820, category: "その他", sortOrder: 3710, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0372", name: "寄附金付75分コース", durationMinutes: 75, price: 8525, category: "その他", sortOrder: 3720, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0373", name: "寄附金付頭ほぐし75分コース", durationMinutes: 75, price: 9185, category: "その他", sortOrder: 3730, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0374", name: "寄附金付90分コース （オススメ！人気No.1）\"", durationMinutes: 90, price: 10230, category: "その他", sortOrder: 3740, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-gotanda-west"] },
  { id: "svc-pm-0375", name: "《肩甲骨リセット》超回復75分", durationMinutes: 75, price: 11935, category: "その他", sortOrder: 3750, isActive: true, requiresPrivateRoom: false, onlineBooking: true, storeScope: "selected", storeIds: ["store-kinshicho"] }
];

export const initialRooms: ServiceRoom[] = [
  // 施術ブース 8件（既存 room-001 の id を維持し、表示名を「ブース1」に変更）
  {
    id: "room-001",
    name: "ブース1",
    kind: "treatment",
    memo: "メイン施術席",
    isActive: true
  },
  {
    id: "room-003",
    name: "ブース2",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  {
    id: "room-004",
    name: "ブース3",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  {
    id: "room-005",
    name: "ブース4",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  {
    id: "room-006",
    name: "ブース5",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  {
    id: "room-007",
    name: "ブース6",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  {
    id: "room-008",
    name: "ブース7",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  {
    id: "room-009",
    name: "ブース8",
    kind: "treatment",
    memo: "",
    isActive: true
  },
  // 個室 2件（既存 room-002 の id を維持し、表示名を「個室1」に変更）
  {
    id: "room-002",
    name: "個室1",
    kind: "private",
    memo: "静かな個室",
    isActive: true
  },
  {
    id: "room-010",
    name: "個室2",
    kind: "private",
    memo: "",
    isActive: true
  }
];

// --- シフト自動生成 ---
// 各スタッフの定休曜日（regularDayOffs）以外の日に、早番/中番/遅番のいずれかの勤務帯を生成する。
// 期間: 2026-06-13 〜 2026-08-13。曜日番号は 0=日,1=月,2=火,3=水,4=木,5=金,6=土。
// 勤務店舗（storeId）は所属店舗（homeStoreId）を反映する。
// 勤務帯は実勤務時間データが無いため、各店舗内の表示順で 早→中→遅 を循環割り当てして時間にばらつきを持たせる。
const SHIFT_BANDS = [
  { startTime: "10:00", endTime: "19:00" }, // 早番
  { startTime: "12:00", endTime: "21:00" }, // 中番
  { startTime: "14:00", endTime: "23:00" } // 遅番
];

// 各スタッフへ勤務帯を割り当てる（店舗ごとに表示順で早→中→遅を循環）。
function buildStaffBandMap(): Record<string, (typeof SHIFT_BANDS)[number]> {
  const bandOf: Record<string, (typeof SHIFT_BANDS)[number]> = {};
  const storeCounter: Record<string, number> = {};
  for (const staff of initialStaff) {
    const store = staff.homeStoreId ?? "";
    const idx = storeCounter[store] ?? 0;
    bandOf[staff.id] = SHIFT_BANDS[idx % SHIFT_BANDS.length];
    storeCounter[store] = idx + 1;
  }
  return bandOf;
}

function generateSeedShifts(): StaffShift[] {
  const shifts: StaffShift[] = [];
  const startMs = Date.UTC(2026, 5, 13); // 2026-06-13
  const endMs = Date.UTC(2026, 7, 13); // 2026-08-13（含む）
  const dayMs = 24 * 60 * 60 * 1000;
  const bandOf = buildStaffBandMap();

  for (let t = startMs; t <= endMs; t += dayMs) {
    const date = new Date(t);
    const dow = date.getUTCDay();
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const workDate = `${yyyy}-${mm}-${dd}`;

    for (const staff of initialStaff) {
      const offDays = staff.regularDayOffs ?? [];
      if (offDays.includes(dow)) {
        continue; // 定休日はシフトなし
      }

      const band = bandOf[staff.id] ?? SHIFT_BANDS[0];
      shifts.push({
        id: `shift-${staff.id}-${yyyy}${mm}${dd}`,
        staffId: staff.id,
        workDate,
        startTime: band.startTime,
        endTime: band.endTime,
        breakStart: "",
        breakEnd: "",
        memo: "",
        isActive: true,
        storeId: staff.homeStoreId
      });
    }
  }

  return shifts;
}

export const initialShifts: StaffShift[] = generateSeedShifts();

// --- ブース容量判定ヘルパ（T010）---
// 個別ブースを固定せず、メニュー種別（個室必須 or 施術ブース）ごとの台数に空きがあるかを判定する。
// この時点では呼び出さず、エクスポートのみ（接続は T011）。

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = (value ?? "").split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : Number.NaN;
}

/**
 * 指定の予約（日付・時間・メニュー）に対し、必要なブース種別（個室必須なら private、それ以外は treatment）の
 * 空き台数があるかを判定する。同時刻に時間が重なる同種予約の件数が、その種別のブース台数未満なら true。
 * @returns 空きがあれば true（予約可）、無ければ false。
 */
export function hasBoothCapacity(params: {
  date: string;
  startTime: string;
  endTime: string;
  serviceMenuId: string;
  currentReservations: Reservation[];
  services: ServiceMenu[];
  rooms: ServiceRoom[];
  /** 編集中の予約など、件数から除外したい予約ID */
  excludeReservationId?: string;
  /** 判定対象予約のインターバル（分）。占有時間に加算する（T041／T037と整合） */
  intervalMinutes?: number;
}): boolean {
  const { date, startTime, endTime, serviceMenuId, currentReservations, services, rooms, excludeReservationId, intervalMinutes } = params;

  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return false;
  }
  // 判定対象のインターバルを占有時間に加算（未指定=0で従来どおり）。
  const effectiveEnd = end + (intervalMinutes ?? 0);

  const targetMenu = services.find((menu) => menu.id === serviceMenuId);
  const requiredKind: ServiceRoom["kind"] = targetMenu?.requiresPrivateRoom ? "private" : "treatment";

  const capacity = rooms.filter((room) => room.kind === requiredKind && (room.isActive ?? true)).length;
  if (capacity <= 0) {
    return false;
  }

  const overlappingSameKind = currentReservations.filter((reservation) => {
    if (reservation.id === excludeReservationId) return false;
    if (reservation.date !== date) return false;
    if (reservation.status === "canceled") return false;

    const otherMenu = services.find((menu) => menu.id === reservation.serviceMenuId);
    const otherKind: ServiceRoom["kind"] = otherMenu?.requiresPrivateRoom ? "private" : "treatment";
    if (otherKind !== requiredKind) return false;

    const otherStart = parseTimeToMinutes(reservation.startTime);
    const otherEnd = parseTimeToMinutes(reservation.endTime);
    if (!Number.isFinite(otherStart) || !Number.isFinite(otherEnd)) return false;
    // 既存予約のインターバルも占有時間に含める。
    const otherEffectiveEnd = otherEnd + (reservation.intervalMinutes ?? 0);

    return start < otherEffectiveEnd && otherStart < effectiveEnd; // 時間が重なる
  }).length;

  return overlappingSameKind < capacity;
}

// 売上見込の計算（T037 と一致＝コース＋オプション−個別割引(%→円・四捨五入)−一括割引・端数四捨五入・小計基準）。
// 会計モーダルのプリフィル（T041）と台帳の表示で共用するため、ここ（マスタ層）に集約する。
export function computeReservationPricing(
  coursePrice: number,
  optionIds: string[] | undefined,
  options: ServiceOption[],
  discountPercent?: number,
  discountYen?: number,
  bulkDiscountPercent?: number,
  bulkDiscountYen?: number
) {
  const ids = optionIds ?? [];
  const optionsTotal = ids.reduce((sum, id) => sum + (options.find((o) => o.id === id)?.price ?? 0), 0);
  const subtotal = coursePrice + optionsTotal;
  const individualPctYen = Math.round(subtotal * ((discountPercent ?? 0) / 100));
  const afterIndividual = subtotal - individualPctYen - (discountYen ?? 0);
  const bulkPctYen = Math.round(Math.max(0, afterIndividual) * ((bulkDiscountPercent ?? 0) / 100));
  const net = Math.max(0, Math.round(afterIndividual - bulkPctYen - (bulkDiscountYen ?? 0)));
  return { coursePrice, optionsTotal, subtotal, discountTotal: subtotal - net, net };
}
