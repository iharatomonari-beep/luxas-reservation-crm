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

export const initialStaff: StaffMember[] = [
  // 既存 id（staff-001/002）は予約が参照しているため維持。全員 isActive・両メニュー対応。
  {
    id: "staff-001",
    fullName: "青山 真央",
    displayName: "青山",
    role: "manager",
    sortOrder: 1,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-002",
    fullName: "佐伯 莉子",
    displayName: "佐伯",
    role: "therapist",
    sortOrder: 2,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-003",
    fullName: "高瀬 悠",
    displayName: "高瀬",
    role: "therapist",
    sortOrder: 3,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-004",
    fullName: "中村 杏",
    displayName: "中村",
    role: "therapist",
    sortOrder: 4,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-005",
    fullName: "小林 楓",
    displayName: "小林",
    role: "therapist",
    sortOrder: 5,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-006",
    fullName: "加藤 颯",
    displayName: "加藤",
    role: "therapist",
    sortOrder: 6,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-007",
    fullName: "山本 結",
    displayName: "山本",
    role: "therapist",
    sortOrder: 7,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  },
  {
    id: "staff-008",
    fullName: "渡辺 蓮",
    displayName: "渡辺",
    role: "therapist",
    sortOrder: 8,
    serviceMenuIds: ["service-001", "service-002"],
    isActive: true
  }
];

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

// --- シフト自動生成（T013）---
// スタッフ8人、各自 週5日・1日9時間。定休（週2日）は曜日固定。土日厚め（土7・日7／平日5〜6）。
// 期間: 2026-06-13 〜 2026-08-13。曜日番号は 0=日,1=月,2=火,3=水,4=木,5=金,6=土。
const SHIFT_STAFF_PLAN: { staffId: string; startTime: string; endTime: string; offDays: number[] }[] = [
  { staffId: "staff-001", startTime: "10:00", endTime: "19:00", offDays: [6, 0] }, // 休: 土日
  { staffId: "staff-002", startTime: "10:00", endTime: "19:00", offDays: [1, 2] }, // 休: 月火
  { staffId: "staff-003", startTime: "10:00", endTime: "19:00", offDays: [2, 3] }, // 休: 火水
  { staffId: "staff-004", startTime: "12:00", endTime: "21:00", offDays: [3, 4] }, // 休: 水木
  { staffId: "staff-005", startTime: "12:00", endTime: "21:00", offDays: [4, 5] }, // 休: 木金
  { staffId: "staff-006", startTime: "14:00", endTime: "23:00", offDays: [1, 5] }, // 休: 月金
  { staffId: "staff-007", startTime: "14:00", endTime: "23:00", offDays: [1, 4] }, // 休: 月木
  { staffId: "staff-008", startTime: "14:00", endTime: "23:00", offDays: [2, 5] }  // 休: 火金
];

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

    for (const plan of SHIFT_STAFF_PLAN) {
      if (plan.offDays.includes(dow)) {
        continue; // 定休日はシフトなし
      }

      shifts.push({
        id: `shift-${plan.staffId}-${yyyy}${mm}${dd}`,
        staffId: plan.staffId,
        workDate,
        startTime: plan.startTime,
        endTime: plan.endTime,
        breakStart: "",
        breakEnd: "",
        memo: "",
        isActive: true
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
