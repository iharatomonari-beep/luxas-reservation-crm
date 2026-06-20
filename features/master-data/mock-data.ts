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
  { id: "category-001", name: "ボディケア", sortOrder: 10, color: "green", isActive: true },
  { id: "category-002", name: "フェイシャル", sortOrder: 20, color: "rose", isActive: true },
  { id: "category-003", name: "カウンセリング", sortOrder: 30, color: "sky", isActive: true },
  { id: "category-004", name: "オプション", sortOrder: 40, color: "amber", isActive: true },
  { id: "category-005", name: "その他", sortOrder: 50, color: "stone", isActive: true }
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

export const initialStaff: StaffMember[] = STAFF_SEED.map((s) => ({
  id: s.id,
  fullName: s.first ? `${s.last} ${s.first}` : s.last,
  displayName: s.last,
  role: "therapist",
  sortOrder: s.order,
  serviceMenuIds: [], // 対応コースは後でコースマスタと紐づけ（未選択=全コース対応）
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
  {
    id: "service-001",
    name: "ボディケア 60分",
    durationMinutes: 60,
    price: 8800,
    category: "ボディケア",
    sortOrder: 10,
    isActive: true,
    requiresPrivateRoom: false
  },
  {
    id: "service-002",
    name: "フェイシャル 45分",
    durationMinutes: 45,
    price: 9900,
    category: "フェイシャル",
    sortOrder: 20,
    isActive: true,
    requiresPrivateRoom: false
  }
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
// 各スタッフの定休曜日（regularDayOffs）以外の日に、店舗営業内の標準勤務 10:00〜20:00 を生成する。
// 期間: 2026-06-13 〜 2026-08-13。曜日番号は 0=日,1=月,2=火,3=水,4=木,5=金,6=土。
// 勤務店舗（storeId）は所属店舗（homeStoreId）を反映する。
function generateSeedShifts(): StaffShift[] {
  const shifts: StaffShift[] = [];
  const startMs = Date.UTC(2026, 5, 13); // 2026-06-13
  const endMs = Date.UTC(2026, 7, 13); // 2026-08-13（含む）
  const dayMs = 24 * 60 * 60 * 1000;

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

      shifts.push({
        id: `shift-${staff.id}-${yyyy}${mm}${dd}`,
        staffId: staff.id,
        workDate,
        startTime: "10:00",
        endTime: "20:00",
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
