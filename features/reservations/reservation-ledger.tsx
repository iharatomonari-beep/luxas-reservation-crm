"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { Ban, BookMarked, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, CreditCard, DoorOpen, Edit3, Plus, RotateCw, Save, Search, Trash2, Undo2, UserRound, Wallet, X } from "lucide-react";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import { customerGenderLabels, type Customer, type CustomerGender } from "@/features/customers/types";
import { searchCustomers } from "@/features/customers/customer-search";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  hasBoothCapacity,
  initialOptions,
  initialRetailSales,
  initialRooms,
  initialServices,
  initialShifts,
  initialStaff,
  initialTags,
  optionsStorageKey,
  retailSalesStorageKey,
  shiftsStorageKey,
  roomsStorageKey,
  servicesStorageKey,
  staffStorageKey,
  tagsStorageKey
} from "@/features/master-data/mock-data";
import type { MasterTag, RetailSale, ServiceMenu, ServiceOption, ServiceRoom, StaffMember, StaffShift } from "@/features/master-data/types";
import { initialStoreSettings, useStoreSettings } from "@/features/master-data/store-settings";
import { useCurrentStore } from "@/features/org/use-current-store";
import type { Store } from "@/features/org/types";
import { filterReservationsByStore } from "@/features/reservations/store-scope";
import { filterShiftsByStore } from "@/features/master-data/store-staff-scope";
import { filterMenusByStore } from "@/features/master-data/store-menu-scope";
import { menuColorStyle, reservationCardStyle } from "@/features/master-data/menu-colors";
import { isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import {
  addDays,
  buildTimeSlots,
  formatDayLabel,
  minutesToTime,
  normalizeDateInputValue,
  normalizeTimeInputValue,
  timeToMinutes
} from "@/features/reservations/date-utils";
import { useDailyWeather } from "@/features/reservations/weather";
import {
  initialReservations,
  reservationLedgerDateStorageKey,
  reservationLedgerUpdateStorageKey,
  reservationsStorageKey,
  turnawaysStorageKey
} from "@/features/reservations/mock-data";
import {
  cancelTypeLabels,
  reservationStatusLabels,
  type CancelType,
  type PaymentMethod,
  type Reservation,
  type ReservationStatus,
  type ReservationPayment,
  type CheckoutLine,
  type TurnawayRecord
} from "@/features/reservations/types";
import { CheckoutModal } from "@/features/reservations/checkout-modal";
import { compareBySortOrder } from "@/features/master-data/utils";

// 営業時間（businessStart/businessEnd）と時間きざみ（slotMinutes）は店舗設定 localStorage を
// ランタイム参照する（T031）。コンポーネント内で useStoreSettings から導出し、
// 時間軸に依存する純粋関数へは引数で渡す。未設定時は useStoreSettings が初期値へフォールバックする。
const slotWidth = 16;
const dragSnapThresholdPx = 4;
const staffColumnWidth = 168;
const timelineRowHeight = 64;
// 安定参照の空配列（useLocalCollection の initialItems に毎回 [] を渡すと無限ループになるため）。
const EMPTY_TURNAWAYS: TurnawayRecord[] = [];
const timelineHeaderHeight = 44;

type ReservationForm = {
  customerName: string;
  phone: string;
  serviceMenuId: string;
  staffId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  memo: string;
  status: ReservationStatus;
  /** 指名スタッフID（空＝指名なし）。T017改訂版 */
  nominatedStaffId: string;
  // --- T030 予約データ完全化 ---
  preference: "none" | "male";
  bookingTagIds: string[];
  optionIds: string[];
  discountPercent: string;
  discountYen: string;
  bulkDiscountPercent: string;
  bulkDiscountYen: string;
  isConsecutive: boolean;
  /** インターバル：施術後に空ける分（分）。空＝0（T037） */
  intervalMinutes: string;
  /** インターバル：施術前に空ける分（分）。空＝0 */
  intervalBeforeMinutes: string;
  // --- T067.5-A 顧客紐づけ・性別 ---
  /** 紐づく既存顧客ID（空＝未紐づけ。検索UIはT067.5-Bで追加） */
  customerId: string;
  /** ゲスト予約の本人性別（空＝未設定）。Customer.gender とは別物・preference は使わない */
  guestGender: CustomerGender | "";
};

const emptyExtraForm = {
  preference: "none" as const,
  customerId: "",
  guestGender: "" as CustomerGender | "",
  bookingTagIds: [] as string[],
  optionIds: [] as string[],
  discountPercent: "",
  discountYen: "",
  bulkDiscountPercent: "",
  bulkDiscountYen: "",
  isConsecutive: false,
  intervalMinutes: "",
  intervalBeforeMinutes: ""
};

type FormMode = "create" | "edit";

type ReservationCreatePrefill = {
  staffId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  serviceMenuId?: string;
  // 連続予約の続け取り用（T037）
  customerName?: string;
  phone?: string;
};

type ReservationDragState = {
  reservationId: string;
  pointerStartX: number;
  pointerStartY: number;
  originStartMinutes: number;
  startMinutes: number;
  durationMinutes: number;
  currentPointerX: number;
  currentPointerY: number;
  originStaffId: string;
  targetStaffId: string;
  isDragging: boolean;
};

type ReservationCreatedMessage = {
  type: "reservation-created";
  reservationId: string;
  date: string;
};

const statusOptions = Object.entries(reservationStatusLabels) as [ReservationStatus, string][];

function getDateParam(value: string | null) {
  return value ? normalizeDateInputValue(value) : null;
}

function getStoredSelectedDate() {
  if (typeof window === "undefined") {
    return null;
  }

  return getDateParam(window.localStorage.getItem(reservationLedgerDateStorageKey));
}

function normalizeReservationForDisplay(reservation: Reservation) {
  const date = normalizeDateInputValue(reservation.date);
  const startTime = normalizeTimeInputValue(reservation.startTime);
  const endTime = normalizeTimeInputValue(reservation.endTime);
  const start = startTime ? timeToMinutes(startTime) : Number.NaN;
  const end = endTime ? timeToMinutes(endTime) : Number.NaN;

  if (!date || !startTime || !endTime || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }

  return {
    ...reservation,
    phone: reservation.phone ?? "",
    serviceMenuId: normalizeText(reservation.serviceMenuId),
    staffId: normalizeText(reservation.staffId),
    roomId: normalizeText(reservation.roomId),
    date,
    startTime,
    endTime
  };
}

function readStoredReservations() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedReservations = window.localStorage.getItem(reservationsStorageKey);

    if (!savedReservations) {
      return null;
    }

    const parsedReservations = JSON.parse(savedReservations);

    return Array.isArray(parsedReservations) ? (parsedReservations as Reservation[]) : null;
  } catch {
    return null;
  }
}

function parseReservationCreatedMessage(value: unknown): ReservationCreatedMessage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = value as Record<string, unknown>;
  const date = typeof message.date === "string" ? normalizeDateInputValue(message.date) : null;

  if (message.type !== "reservation-created" || typeof message.reservationId !== "string" || !date) {
    return null;
  }

  return {
    type: "reservation-created",
    reservationId: message.reservationId,
    date
  };
}

function parseStoredReservationCreatedMessage(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return parseReservationCreatedMessage(JSON.parse(value));
  } catch {
    return null;
  }
}

function replaceLedgerDateInUrl(date: string) {
  const normalizedDate = normalizeDateInputValue(date);

  if (!normalizedDate) {
    return;
  }

  window.history.replaceState(null, "", `/dashboard/reservations?date=${encodeURIComponent(normalizedDate)}`);
}

function getVisibleStaffForSelectedDate(staffList: StaffMember[], selectedDate: string, shifts: StaffShift[]) {
  const normalizedDate = normalizeDateInputValue(selectedDate);

  if (!normalizedDate) {
    return [];
  }

  return staffList.filter((staff) =>
    shifts.some((shift) => {
      if ((shift.isActive ?? true) === false || shift.staffId !== staff.id) {
        return false;
      }

      if (normalizeDateInputValue(shift.workDate) !== normalizedDate) {
        return false;
      }

      const shiftStart = normalizeTimeInputValue(shift.startTime);
      const shiftEnd = normalizeTimeInputValue(shift.endTime);

      return Boolean(shiftStart && shiftEnd);
    })
  );
}

// 指定日のスタッフの最も早いシフト開始時刻（分）。出勤が無ければ Infinity（=最後尾）。
function getEarliestShiftStartMinutes(staffId: string, selectedDate: string, shifts: StaffShift[]): number {
  const normalizedDate = normalizeDateInputValue(selectedDate);
  if (!normalizedDate) {
    return Number.POSITIVE_INFINITY;
  }

  let earliest = Number.POSITIVE_INFINITY;
  for (const shift of shifts) {
    if ((shift.isActive ?? true) === false || shift.staffId !== staffId) {
      continue;
    }
    if (normalizeDateInputValue(shift.workDate) !== normalizedDate) {
      continue;
    }
    const shiftStart = normalizeTimeInputValue(shift.startTime);
    if (!shiftStart) {
      continue;
    }
    earliest = Math.min(earliest, timeToMinutes(shiftStart));
  }
  return earliest;
}

// 指定の予約日・開始時刻で、そのメニューが提供可能か（PM §4-1 時間・曜日限定／店舗適用期間）。
// 限定が未設定の項目はすべて「制限なし」として通す（後方互換）。
function isMenuAvailableForDateTime(menu: ServiceMenu, date: string, startTime: string): boolean {
  const normalizedDate = normalizeDateInputValue(date);
  if (!normalizedDate) {
    return true; // 日付未確定なら絞り込まない
  }

  // 店舗適用開始日/終了日（範囲外なら不可）。
  if (menu.startDate && normalizedDate < menu.startDate) {
    return false;
  }
  if (menu.endDate && normalizedDate > menu.endDate) {
    return false;
  }

  // 提供曜日（指定があり、当日の曜日が含まれなければ不可）。
  if (menu.availableDays && menu.availableDays.length > 0) {
    const dow = new Date(`${normalizedDate}T00:00:00`).getDay();
    if (!menu.availableDays.includes(dow)) {
      return false;
    }
  }

  // 提供時間帯（開始時刻が範囲外なら不可）。開始時刻が未確定ならスキップ。
  const normalizedStart = normalizeTimeInputValue(startTime);
  if (normalizedStart) {
    const startMin = timeToMinutes(normalizedStart);
    const from = menu.availableTimeStart ? timeToMinutes(menu.availableTimeStart) : null;
    const to = menu.availableTimeEnd ? timeToMinutes(menu.availableTimeEnd) : null;
    if (from != null && Number.isFinite(from) && startMin < from) {
      return false;
    }
    if (to != null && Number.isFinite(to) && startMin > to) {
      return false;
    }
  }

  return true;
}

export function ReservationLedger() {
  const isDebugMode = process.env.NODE_ENV !== "production";
  const searchParams = useSearchParams();
  const queryDate = getDateParam(searchParams.get("date"));
  const [selectedDate, setSelectedDate] = useState(() => queryDate ?? getTodayDate());
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [reservationFormMode, setReservationFormMode] = useState<FormMode | null>(null);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [isReservationFormOpen, setIsReservationFormOpen] = useState(false);
  const [dragState, setDragState] = useState<ReservationDragState | null>(null);
  const [form, setForm] = useState<ReservationForm>({
    customerName: "",
    phone: "",
    serviceMenuId: "",
    staffId: "",
    roomId: "",
    date: "2026-05-11",
    startTime: "10:00",
    endTime: "11:00",
    memo: "",
    status: "booked",
    nominatedStaffId: "",
    ...emptyExtraForm
  });
  const [holdShelf, setHoldShelf] = useState<string[]>([]);
  const [shelfPickedId, setShelfPickedId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const [formMessage, setFormMessage] = useState<StatusMessageValue | null>(null);
  // 下部ツールバーのカテゴリ絞り込み（""=すべて）。T018
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  // 会計モーダル対象の予約ID（T022）
  const [checkoutReservationId, setCheckoutReservationId] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  // 編集対象の返客記録（null=新規登録）。返客情報タブの行クリックで編集モードに入る。
  const [editingTurnaway, setEditingTurnaway] = useState<TurnawayRecord | null>(null);
  // 当日情報パネル（予約情報／販売情報／返客情報）の開閉。左レール「情報」ボタンで表示（PM準拠）。
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [turnaways, setTurnaways] = useLocalCollection<TurnawayRecord>(turnawaysStorageKey, EMPTY_TURNAWAYS);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [rooms] = useLocalCollection<ServiceRoom>(roomsStorageKey, initialRooms);
  const [shifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const [customers, setCustomers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [allTags] = useLocalCollection<MasterTag>(tagsStorageKey, initialTags);
  const [allOptions] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const [retailSales] = useLocalCollection<RetailSale>(retailSalesStorageKey, initialRetailSales);
  // 当日情報パネル（T036）のタブと顧客名クイック検索。
  const [dayPanelTab, setDayPanelTab] = useState<"reservation" | "sales" | "return">("reservation");
  const [dayPanelSearch, setDayPanelSearch] = useState("");
  const routeTags = useMemo(() => allTags.filter((t) => t.kind === "route" && t.isActive), [allTags]);
  const activeOptions = useMemo(() => allOptions.filter((o) => o.isActive), [allOptions]);
  const [reservations, setReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  // 現在店舗（T062）。新規予約への storeId 付与と表示の安全フィルタ（T063）に使う。
  const { currentStoreId, stores } = useCurrentStore();
  // 日付バーの天気（Open-Meteo・現在店舗の所在地×選択日）。表示専用。
  const weather = useDailyWeather(currentStoreId, selectedDate);
  // 店舗設定（営業時間・時間きざみ）をランタイム参照する（T031）。設定画面の保存値が台帳に反映される。
  const [storeSettings] = useStoreSettings();
  const businessStart = storeSettings.businessStartTime;
  const businessEnd = storeSettings.businessEndTime;
  const slotMinutes = storeSettings.slotMinutes;
  const slotsPerHour = 60 / slotMinutes;
  const slotsPerQuarterHour = 15 / slotMinutes;
  const dragSuppressClickRef = useRef(false);
  const dragStateRef = useRef<ReservationDragState | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  // ドラッグ確定時に最新データを参照するための ref（ステイルクロージャ回避）
  const dragDataRef = useRef({ reservations, staff, services, rooms, shifts });
  dragDataRef.current = { reservations, staff, services, rooms, shifts };
  // ドラッグ中に document へ登録したリスナーを保持
  const dragListenersRef = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(null);

  const normalizedReservations = useMemo(
    () =>
      // 現在店舗で安全フィルタ（T063・非破壊）。渋谷=storeId未設定の既存も表示／他店舗=storeId一致のみ。
      filterReservationsByStore(
        reservations
          .map(normalizeReservationForDisplay)
          .filter((reservation): reservation is Reservation => reservation !== null),
        currentStoreId
      ),
    [reservations, currentStoreId]
  );
  const activeStaff = useMemo(() => [...staff].sort(compareBySortOrder).filter((item) => item.isActive), [staff]);
  // メニュー選択候補＝有効かつ現在店舗で提供可能なメニューのみ（T065・非破壊）。
  // 名前解決用の full `services` 配列は絞らない（getServiceName 等は従来どおり）。
  const activeServices = useMemo(
    () => filterMenusByStore([...services].sort(compareBySortOrder).filter((item) => item.isActive), currentStoreId),
    [services, currentStoreId]
  );
  const slots = useMemo(() => buildTimeSlots(businessStart, businessEnd, slotMinutes), [businessStart, businessEnd, slotMinutes]);
  const hourSlots = useMemo(() => buildTimeSlots(businessStart, businessEnd, 60), [businessStart, businessEnd]);
  const dayReservations = normalizedReservations.filter((reservation) => reservation.date === selectedDate);
  // 集計用：休憩/業務ブロックを除いた当日予約（来店・売上・件数などの集計はこちらを使う）。
  const dayCustomerReservations = useMemo(() => dayReservations.filter((r) => !r.blockType), [dayReservations]);
  const dayReservationsForTimeline = useMemo(
    // キャンセル/削除した予約はタイムラインに薄枠を残さず消す（記録は返客情報タブに残る）。
    () => dayReservations.filter((r) => !holdShelf.includes(r.id) && r.status !== "canceled"),
    [dayReservations, holdShelf]
  );
  const heldReservations = useMemo(
    () => normalizedReservations.filter((r) => holdShelf.includes(r.id)),
    [normalizedReservations, holdShelf]
  );
  // 現在店舗のシフトだけに絞る（T064・非破壊）。storeId未設定の既存シフトは既定店舗(渋谷)扱い。
  // 名前解決用の full `staff` 配列は絞らない（縦軸・担当候補のみ店舗スコープ）。
  const storeShifts = useMemo(() => filterShiftsByStore(shifts, currentStoreId), [shifts, currentStoreId]);
  // 縦軸＝現在店舗で選択日に有効シフトがあるスタッフのみ（所属だけでは出さない／シフトが無ければ空）。
  // 並び順は「その日の出勤開始が早い人を上から」。同時刻は従来の表示順（order）を維持。
  const timelineStaff = useMemo(() => {
    const visible = getVisibleStaffForSelectedDate(activeStaff, selectedDate, storeShifts);
    return [...visible].sort((a, b) => {
      const startA = getEarliestShiftStartMinutes(a.id, selectedDate, storeShifts);
      const startB = getEarliestShiftStartMinutes(b.id, selectedDate, storeShifts);
      if (startA !== startB) {
        return startA - startB;
      }
      return compareBySortOrder(a, b);
    });
  }, [activeStaff, selectedDate, storeShifts]);
  // 担当候補＝現在店舗でフォーム日付に有効シフトがある有効スタッフ（編集時は選択中スタッフを別途保持）。
  const formCandidateStaff = useMemo(
    () => getVisibleStaffForSelectedDate(activeStaff, form.date, storeShifts),
    [activeStaff, form.date, storeShifts]
  );
  const selectedReservation =
    selectedReservationId ? normalizedReservations.find((reservation) => reservation.id === selectedReservationId) ?? null : null;
  const selectedReservationCustomer = getCustomerByReservation(selectedReservation);
  // 選択中予約の売上見込（T037）。割引・オプションを反映した参考値。
  const selectedReservationExpectedSale = selectedReservation
    ? computeReservationPricing(
        services.find((s) => s.id === selectedReservation.serviceMenuId)?.price ?? 0,
        selectedReservation.optionIds,
        allOptions,
        selectedReservation.discountPercent,
        selectedReservation.discountYen,
        selectedReservation.bulkDiscountPercent,
        selectedReservation.bulkDiscountYen
      ).net
    : null;
  // 表示モード（基本=5時間スケール／全体=終日を画面幅にフィット）。初期は基本。
  const [timelineView, setTimelineView] = useState<"basic" | "full">("basic");
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(0);
  // 現在時刻（HH:mm・JST）。1分ごとに更新する表示専用。
  const [currentTime, setCurrentTime] = useState("");
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  useEffect(() => {
    function updateClock() {
      const hhmm = new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tokyo"
      });
      setCurrentTime(hhmm);
      const m = timeToMinutes(hhmm);
      setNowMinutes(Number.isFinite(m) ? m : null);
    }
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // 表示モードに応じた1コマ幅。基本=16px固定。全体=営業時間全体を画面幅に収めるよう縮小。
  const fullCellWidth =
    timelineViewportWidth > 0 && slots.length > 0
      ? Math.max(4, Math.floor((timelineViewportWidth - staffColumnWidth) / slots.length))
      : slotWidth;
  const cellWidth = timelineView === "full" ? fullCellWidth : slotWidth;
  const timelineWidth = slots.length * cellWidth;
  // 末尾の時間（22時・23時等）でもスタッフ名の真横（左端）に寄せられるよう、右側に空白の余白を足す。
  // 基本表示のみ（全体表示は画面に収まるため不要）。
  const trailingPad =
    timelineView === "full" ? 0 : Math.max(0, timelineViewportWidth - staffColumnWidth - cellWidth * slotsPerHour);
  const timelineTotalWidth = staffColumnWidth + timelineWidth;
  const timelineContentWidth = timelineTotalWidth + trailingPad;
  const selectedDateIsToday = selectedDate === getTodayDate();
  // 各時間帯（時）の予約件数（ジャンプバーの小さい数字用）。キャンセル除外。
  const hourReservationCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const r of dayReservationsForTimeline) {
      if (r.blockType) continue;
      const h = Math.floor(timeToMinutes(r.startTime) / 60);
      if (Number.isFinite(h)) {
        counts[h] = (counts[h] ?? 0) + 1;
      }
    }
    return counts;
  }, [dayReservationsForTimeline]);
  // 現在時刻の赤い縦線（本日のみ・営業時間内）。1分ごとに nowMinutes 更新で自動移動。
  const tlStartMin = timeToMinutes(businessStart);
  const tlEndMin = timeToMinutes(businessEnd);
  const showNowLine = selectedDateIsToday && nowMinutes != null && nowMinutes >= tlStartMin && nowMinutes <= tlEndMin;
  const nowLineLeft = showNowLine && nowMinutes != null ? ((nowMinutes - tlStartMin) / slotMinutes) * cellWidth + 3 : 0;
  const reservationStats = useMemo(
    () =>
      dayCustomerReservations.reduce(
        (result, reservation) => {
          result[reservation.status] += 1;
          return result;
        },
        { booked: 0, completed: 0, canceled: 0 } as Record<ReservationStatus, number>
      ),
    [dayCustomerReservations]
  );
  // 会計（T022）確定データから当日の売上・支払方法別内訳・客単価・新規/リピートを集計（T033）。
  const checkoutSummary = useMemo(() => {
    const reservationKey = (r: Reservation) => r.phone.trim() || r.customerName.trim();
    const paidToday = dayCustomerReservations.filter((r) => r.paymentStatus === "paid");
    const totalSales = paidToday.reduce((sum, r) => sum + (r.saleAmount ?? 0), 0);
    // 物販分（会計アイテムの物販合計）と施術分（総販売額−物販）。
    const retailSales = paidToday.reduce(
      (sum, r) => sum + (r.checkoutLines ?? []).filter((l) => l.kind === "retail").reduce((s, l) => s + l.amount * l.qty, 0),
      0
    );
    const courseSales = Math.max(0, totalSales - retailSales);
    const methodTotals: Record<PaymentMethod, number> = {
      cash: 0,
      credit: 0,
      emoney: 0,
      ticket: 0,
      prepaid: 0,
      point: 0,
      giftcard: 0,
      epark: 0
    };
    for (const reservation of paidToday) {
      for (const payment of reservation.payments ?? []) {
        if (payment.method in methodTotals) {
          methodTotals[payment.method] += Number.isFinite(payment.amount) ? payment.amount : 0;
        }
      }
    }
    const paidCustomerKeys = new Set(paidToday.map(reservationKey).filter(Boolean));
    const avgPerCustomer = paidCustomerKeys.size > 0 ? Math.round(totalSales / paidCustomerKeys.size) : 0;

    // 新規/リピート: 当日来店（取消以外）の顧客が、過去（selectedDate より前）の会計済予約に居ればリピート（推奨定義）。
    const historyKeys = new Set(
      normalizedReservations
        .filter((r) => r.paymentStatus === "paid" && r.date < selectedDate)
        .map(reservationKey)
        .filter(Boolean)
    );
    const todayVisitKeys = new Set(
      dayCustomerReservations.filter((r) => r.status !== "canceled").map(reservationKey).filter(Boolean)
    );
    let newCount = 0;
    let repeatCount = 0;
    for (const key of todayVisitKeys) {
      if (historyKeys.has(key)) repeatCount += 1;
      else newCount += 1;
    }
    return { totalSales, retailSales, courseSales, methodTotals, avgPerCustomer, newCount, repeatCount };
  }, [dayCustomerReservations, normalizedReservations, selectedDate]);
  // キャンセル種別別の件数（T035）。無断キャンセル/取消を集計バーに実値表示。
  const cancelStats = useMemo(() => {
    let noShow = 0;
    let voided = 0;
    for (const reservation of dayCustomerReservations) {
      if (reservation.status !== "canceled") continue;
      if (reservation.cancelType === "no_show") noShow += 1;
      else if (reservation.cancelType === "void") voided += 1;
    }
    return { noShow, voided };
  }, [dayCustomerReservations]);
  // 当日情報パネル（T036）用の派生データ。
  const dayRetailTotal = useMemo(
    () => retailSales.filter((s) => s.saleDate === selectedDate).reduce((sum, s) => sum + s.quantity * s.unitPrice, 0),
    [retailSales, selectedDate]
  );
  const dayPanelReservations = useMemo(() => {
    const keyword = dayPanelSearch.trim().toLowerCase();
    return [...dayCustomerReservations]
      .filter((r) => (keyword ? r.customerName.toLowerCase().includes(keyword) : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [dayCustomerReservations, dayPanelSearch]);
  const dayCanceledReservations = useMemo(
    () => dayCustomerReservations.filter((r) => r.status === "canceled").sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [dayCustomerReservations]
  );
  // 返客記録（電話・飛び込みで受けられなかったお客様）。選択日の分。
  const dayTurnaways = useMemo(
    () => turnaways.filter((t) => t.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [turnaways, selectedDate]
  );
  const staffReservationCountMap = useMemo(
    () =>
      new Map(
        timelineStaff.map((item) => [
          item.id,
          dayCustomerReservations.filter((reservation) => reservation.staffId === item.id).length
        ])
      ),
    [dayCustomerReservations, timelineStaff]
  );
  const formServiceOptions = useMemo(
    () => buildSelectableServices(activeServices, services, form.serviceMenuId, reservationFormMode, form.date, form.startTime),
    [activeServices, form.serviceMenuId, reservationFormMode, services, form.date, form.startTime]
  );
  const formStaffOptions = useMemo(
    () => buildSelectableStaff(formCandidateStaff, staff, form.serviceMenuId, form.staffId, reservationFormMode),
    [formCandidateStaff, form.serviceMenuId, form.staffId, reservationFormMode, staff]
  );
  const debugCounts = {
    selectedDate,
    loadedReservationsCount: reservations.length,
    filteredReservationsCount: dayReservations.length,
    visibleStaffCount: timelineStaff.length
  };

  useEffect(() => {
    if (queryDate) {
      setSelectedDate(queryDate);
      return;
    }

    const storedDate = getStoredSelectedDate();
    if (storedDate) {
      setSelectedDate(storedDate);
    }
  }, [queryDate]);

  useEffect(() => {
    try {
      window.localStorage.setItem(reservationLedgerDateStorageKey, selectedDate);
    } catch {
      // Ignore localStorage failures; the selected date still works for the current view.
    }
  }, [selectedDate]);

  useEffect(() => {
    function syncReservationsFromStorage(nextDate?: string) {
      const storedReservations = readStoredReservations();

      if (storedReservations) {
        setReservations(storedReservations);
      }

      const normalizedDate = nextDate ? normalizeDateInputValue(nextDate) : null;
      if (!normalizedDate) {
        return;
      }

      setSelectedDate(normalizedDate);
      replaceLedgerDateInUrl(normalizedDate);

      try {
        window.localStorage.setItem(reservationLedgerDateStorageKey, normalizedDate);
      } catch {
        // Ignore localStorage failures; the current tab can still show the date.
      }
    }

    function handleReservationCreated(message: ReservationCreatedMessage) {
      syncReservationsFromStorage(message.date);
      setMessage({ type: "success", text: "新規予約を予約台帳に反映しました。" });
    }

    function handleReservationMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      const reservationMessage = parseReservationCreatedMessage(event.data);
      if (reservationMessage) {
        handleReservationCreated(reservationMessage);
      }
    }

    function handleReservationStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) {
        return;
      }

      if (event.key === reservationLedgerUpdateStorageKey) {
        const reservationMessage = parseStoredReservationCreatedMessage(event.newValue);

        if (reservationMessage) {
          handleReservationCreated(reservationMessage);
        }

        return;
      }

      if (event.key === reservationsStorageKey) {
        syncReservationsFromStorage();
      }
    }

    function handleLedgerFocus() {
      syncReservationsFromStorage();
    }

    window.addEventListener("message", handleReservationMessage);
    window.addEventListener("storage", handleReservationStorage);
    window.addEventListener("focus", handleLedgerFocus);
    window.addEventListener("pageshow", handleLedgerFocus);

    return () => {
      window.removeEventListener("message", handleReservationMessage);
      window.removeEventListener("storage", handleReservationStorage);
      window.removeEventListener("focus", handleLedgerFocus);
      window.removeEventListener("pageshow", handleLedgerFocus);
    };
  }, [setReservations]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // タイムライン表示領域の幅を計測（全体表示で画面幅にフィットさせるため）。
  useEffect(() => {
    const el = timelineScrollRef.current;
    if (!el) {
      return;
    }
    const updateWidth = () => setTimelineViewportWidth(el.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // アンマウント時にドラッグ用リスナーを確実に外す
  useEffect(() => {
    return () => {
      const listeners = dragListenersRef.current;
      if (!listeners) return;
      document.removeEventListener("pointermove", listeners.move);
      document.removeEventListener("pointerup", listeners.up);
      document.removeEventListener("pointercancel", listeners.up);
      dragListenersRef.current = null;
    };
  }, []);

  function processPointerMove(nextPointerX: number, nextPointerY: number) {
    const current = dragStateRef.current;
    if (!current) return;

    const movedPixels = nextPointerX - current.pointerStartX;
    const movedPixelsY = Math.abs(nextPointerY - current.pointerStartY);
    const isDragging =
      current.isDragging ||
      Math.abs(movedPixels) >= dragSnapThresholdPx ||
      movedPixelsY >= dragSnapThresholdPx;
    const snappedMinutes = Math.round(movedPixels / cellWidth) * slotMinutes;
    const rawStartMinutes = current.originStartMinutes + snappedMinutes;
    const clampedStartMinutes = clampReservationStartMinutes(rawStartMinutes, current.durationMinutes, businessStart, businessEnd);

    // ポインター下のスタッフ行を検出
    const el = document.elementFromPoint(nextPointerX, nextPointerY);
    const rowEl = el?.closest("[data-staff-id]") as HTMLElement | null;
    const targetStaffId = rowEl?.dataset.staffId ?? current.targetStaffId;

    console.log("[drag:move]", {
      dropX: nextPointerX,
      dropY: nextPointerY,
      movedPixels,
      slotWidth,
      slotMinutes,
      snappedMinutes,
      originStartMinutes: current.originStartMinutes,
      rawStartMinutes,
      clampedStartMinutes,
      clampedStartTime: minutesToTime(clampedStartMinutes),
      elementFromPoint: el?.tagName ?? null,
      rowFound: Boolean(rowEl),
      targetStaffId,
      isDragging
    });

    const nextState: ReservationDragState = {
      ...current,
      currentPointerX: nextPointerX,
      currentPointerY: nextPointerY,
      isDragging,
      startMinutes: clampedStartMinutes,
      targetStaffId
    };

    dragStateRef.current = nextState;
    setDragState(nextState);
  }

  function handleTimelinePointerUp() {
    const current = dragStateRef.current;
    if (!current) return;

    dragStateRef.current = null;
    setDragState(null);

    if (!current.isDragging) return;

    const data = dragDataRef.current;
    const movedReservation = data.reservations.find((r) => r.id === current.reservationId) ?? null;

    if (!movedReservation || movedReservation.status === "canceled") {
      setMessage({ type: "error", text: "キャンセル済みの予約は移動できません。" });
      dragSuppressClickRef.current = true;
      window.setTimeout(() => { dragSuppressClickRef.current = false; }, 0);
      return;
    }

    const movedStart = current.startMinutes;
    const movedEnd = movedStart + current.durationMinutes;
    const staffChanged = current.targetStaffId !== current.originStaffId;
    const validationError = validateDraggedReservation({
      reservation: {
        ...movedReservation,
        startTime: minutesToTime(movedStart),
        endTime: minutesToTime(movedEnd),
        ...(staffChanged ? { staffId: current.targetStaffId } : {})
      },
      currentReservations: data.reservations,
      staffList: data.staff,
      services: data.services,
      rooms: data.rooms,
      shifts: data.shifts
    });

    console.log("[drag:drop]", {
      reservationId: current.reservationId,
      originStaffId: current.originStaffId,
      targetStaffId: current.targetStaffId,
      staffChanged,
      movedStart,
      movedStartTime: minutesToTime(movedStart),
      movedEndTime: minutesToTime(movedEnd),
      validationError: validationError ?? "OK（移動を確定します）"
    });

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      dragSuppressClickRef.current = true;
      window.setTimeout(() => { dragSuppressClickRef.current = false; }, 0);
      return;
    }

    setReservations((currentReservations) =>
      currentReservations.map((r) =>
        r.id === movedReservation.id
          ? {
              ...r,
              startTime: minutesToTime(movedStart),
              endTime: minutesToTime(movedEnd),
              ...(staffChanged ? { staffId: current.targetStaffId } : {})
            }
          : r
      )
    );
    setMessage({
      type: "success",
      text: staffChanged ? "担当スタッフと時間を変更しました。" : "予約時間を変更しました。"
    });
    dragSuppressClickRef.current = true;
    window.setTimeout(() => { dragSuppressClickRef.current = false; }, 0);
  }

  function getServiceName(serviceMenuId: string) {
    return services.find((item) => item.id === serviceMenuId)?.name ?? "未設定メニュー";
  }

  // ブースは個別固定せず種別で表示する（T011）。メニューの個室必須フラグで判定。
  function getBoothKindLabel(serviceMenuId: string) {
    const menu = services.find((item) => item.id === serviceMenuId);
    return menu?.requiresPrivateRoom ? "個室" : "施術ブース";
  }

  function getStaffName(staffId: string) {
    return staff.find((item) => item.id === staffId)?.displayName ?? "未設定スタッフ";
  }

  function getCustomerByReservation(reservation: Reservation | null) {
    if (!reservation) {
      return null;
    }

    // 1) customerId があれば最優先で直引き（T067.5-A）。見つからなければ従来の照合に落ちる。
    if (reservation.customerId) {
      const byId = customers.find((customer) => customer.id === reservation.customerId);
      if (byId) {
        return byId;
      }
    }

    // 2) 既存予約のため、電話優先→氏名の照合 fallback は必ず維持する。
    const phone = normalizeText(reservation.phone ?? "");
    const customerName = normalizeText(reservation.customerName);

    return (
      customers.find((customer) => normalizeText(customer.phone) === phone && phone.length > 0) ??
      customers.find((customer) => normalizeText(customer.name) === customerName) ??
      null
    );
  }

  // 予約カードの表示補助（T066）。新規判定＝当日来店客で、selectedDate より前の会計済予約が無い（既存の新規/リピート定義に整合）。
  const cardHistoryKeys = useMemo(
    () =>
      new Set(
        normalizedReservations
          .filter((r) => r.paymentStatus === "paid" && r.date < selectedDate)
          .map((r) => (r.phone.trim() || r.customerName.trim()))
          .filter(Boolean)
      ),
    [normalizedReservations, selectedDate]
  );

  // 予約カードの追加表示プロップ（メニュー色・性別ラベル・新規・個室名）を算出する。
  function getReservationCardProps(reservation: Reservation) {
    // 休憩/業務ブロックはグレー固定・性別/新規/個室ラベルなし（顧客予約ではない）。
    if (reservation.blockType) {
      return { menuColorKey: "stone", genderLabel: "", isNew: false, privateRoomLabel: "" };
    }
    const menu = services.find((s) => s.id === reservation.serviceMenuId);
    const matchedCustomer = getCustomerByReservation(reservation);
    // 性別の優先順位（T067.5-A）: customerId/照合で取れた Customer.gender を最優先、
    // 取れないゲスト予約のみ reservation.guestGender を fallback。
    // Reservation.preference は男性スタッフ希望なので絶対に使わない。
    const effectiveGender = matchedCustomer?.gender ?? reservation.guestGender;
    const genderLabel = effectiveGender === "female" ? "女" : effectiveGender === "male" ? "男" : "";
    const key = (reservation.phone || "").trim() || reservation.customerName.trim();
    // 新規はゲスト/未照合では出さない（誤表示回避）。照合できた顧客で過去の会計済来店が無ければ新規。
    const isNew = Boolean(matchedCustomer) && Boolean(key) && !cardHistoryKeys.has(key);
    // 個室利用時のみ。roomId から個室名が安全に取れればそれ、無ければ汎用「個室」。通常ブースは空。
    let privateRoomLabel = "";
    if (menu?.requiresPrivateRoom) {
      const room = reservation.roomId ? rooms.find((r) => r.id === reservation.roomId) : null;
      privateRoomLabel = room?.name ?? "個室";
    }
    return { menuColorKey: menuColorKeyFor(menu), genderLabel, isNew, privateRoomLabel };
  }

  function openCreateForm(prefill: ReservationCreatePrefill = {}) {
    // 未指定時は店舗設定の受付開始時刻を既定に（固定の"10:00"を避ける・T003 方針A）
    const startTime = prefill.startTime ?? initialStoreSettings.reservationAcceptStartTime;
    const autoEnd = getAutoEndTime(startTime, prefill.serviceMenuId ?? "", services);
    const fallbackEnd = (() => {
      const m = timeToMinutes(startTime);
      return Number.isFinite(m) ? minutesToTime(m + 60) : "11:00";
    })();
    // 担当は予約時点で確定させない（T017改訂）。セルクリック時はその行のstaffId、
    // 「新規予約」ボタン（セル無し）はその日の先頭出勤スタッフを仮置き（後でドラッグ移動可）。
    const defaultStaffId = prefill.staffId ?? timelineStaff[0]?.id ?? activeStaff[0]?.id ?? "";
    setForm({
      customerName: prefill.customerName ?? "ゲスト",
      phone: prefill.phone ?? "",
      serviceMenuId: prefill.serviceMenuId ?? "",
      staffId: defaultStaffId,
      roomId: prefill.roomId ?? "",
      date: prefill.date ?? selectedDate,
      startTime,
      endTime: autoEnd ?? fallbackEnd,
      memo: "",
      status: "booked",
      nominatedStaffId: "",
      ...emptyExtraForm
    });
    setEditingReservationId(null);
    setSelectedReservationId(null);
    setReservationFormMode("create");
    setIsReservationFormOpen(true);
    setFormMessage(null);
    setMessage(null);
  }

  function openEditForm(reservation: Reservation) {
    setForm({
      customerName: reservation.customerName,
      phone: reservation.phone ?? "",
      serviceMenuId: reservation.serviceMenuId,
      staffId: reservation.staffId,
      roomId: reservation.roomId,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      memo: reservation.memo,
      status: reservation.status,
      nominatedStaffId: reservation.nominatedStaffId ?? "",
      preference: reservation.preference ?? "none",
      bookingTagIds: reservation.bookingTagIds ?? [],
      optionIds: reservation.optionIds ?? [],
      discountPercent: reservation.discountPercent != null ? String(reservation.discountPercent) : "",
      discountYen: reservation.discountYen != null ? String(reservation.discountYen) : "",
      bulkDiscountPercent: reservation.bulkDiscountPercent != null ? String(reservation.bulkDiscountPercent) : "",
      bulkDiscountYen: reservation.bulkDiscountYen != null ? String(reservation.bulkDiscountYen) : "",
      isConsecutive: reservation.isConsecutive ?? false,
      intervalMinutes: reservation.intervalMinutes != null ? String(reservation.intervalMinutes) : "",
      intervalBeforeMinutes: reservation.intervalBeforeMinutes != null ? String(reservation.intervalBeforeMinutes) : "",
      customerId: reservation.customerId ?? "",
      guestGender: reservation.guestGender ?? ""
    });
    setEditingReservationId(reservation.id);
    setSelectedReservationId(null);
    setReservationFormMode("edit");
    setIsReservationFormOpen(true);
    setFormMessage(null);
    setMessage(null);
  }

  function closeForm() {
    setIsReservationFormOpen(false);
    setReservationFormMode(null);
    setEditingReservationId(null);
    setFormMessage(null);
  }

  // 予約以外のブロック（休憩/業務）を登録（PM §2-3）。左レールの専用フォームから種別・担当・開始・分数を受け取る。
  function createTimeBlock(draft: { type: "break" | "business"; staffId: string; date: string; startTime: string; durationMinutes: number }) {
    const staffId = normalizeText(draft.staffId);
    const date = normalizeDateInputValue(draft.date) ?? draft.date;
    const startTime = normalizeTimeInputValue(draft.startTime) ?? draft.startTime;
    const startMin = timeToMinutes(startTime);
    if (!staffId) {
      setMessage({ type: "error", text: "担当スタッフを選択してください。" });
      return;
    }
    if (!date || !Number.isFinite(startMin) || !(draft.durationMinutes > 0)) {
      setMessage({ type: "error", text: "日付・開始時刻・所要時間を正しく入力してください。" });
      return;
    }
    const endTime = minutesToTime(startMin + draft.durationMinutes);
    const label = draft.type === "break" ? "休憩" : "業務";
    setReservations((current) => [
      {
        id: makeLocalId("reservation"),
        customerName: label,
        phone: "",
        serviceMenuId: "",
        staffId,
        roomId: "",
        date,
        startTime,
        endTime,
        status: "booked",
        memo: "",
        blockType: draft.type,
        storeId: currentStoreId
      },
      ...current
    ]);
    setSelectedDate(date);
    setIsBlockFormOpen(false);
    setMessage({ type: "success", text: `${label}を登録しました。` });
    scrollTimelineToTime(startTime);
  }

  // 休憩/業務ブロックの編集（種別・開始/終了時刻）。左パネルから呼ぶ。
  function updateTimeBlock(reservationId: string, patch: { blockType: "break" | "business"; startTime: string; endTime: string }) {
    const startTime = normalizeTimeInputValue(patch.startTime) ?? patch.startTime;
    const endTime = normalizeTimeInputValue(patch.endTime) ?? patch.endTime;
    if (!(timeToMinutes(endTime) > timeToMinutes(startTime))) {
      setMessage({ type: "error", text: "終了時刻は開始時刻より後にしてください。" });
      return;
    }
    setReservations((current) =>
      current.map((item) =>
        item.id === reservationId
          ? { ...item, blockType: patch.blockType, customerName: patch.blockType === "break" ? "休憩" : "業務", startTime, endTime }
          : item
      )
    );
    setMessage({ type: "success", text: "ブロックを更新しました。" });
  }

  // 休憩/業務ブロックの削除（顧客予約ではないので物理削除でよい）。
  function deleteTimeBlock(reservationId: string) {
    setReservations((current) => current.filter((item) => item.id !== reservationId));
    setSelectedReservationId(null);
    setMessage({ type: "success", text: "ブロックを削除しました。" });
  }

  function addToHoldShelf(reservationId: string) {
    if (holdShelf.includes(reservationId)) return;
    setHoldShelf((prev) => [...prev, reservationId]);
    setSelectedReservationId(null);
    setMessage({ type: "success", text: "保留棚に移動しました。日付を変えてから配置したい時間枠をクリックしてください。" });
  }

  function cancelHold(reservationId: string) {
    setHoldShelf((prev) => prev.filter((id) => id !== reservationId));
    if (shelfPickedId === reservationId) setShelfPickedId(null);
    setMessage({ type: "success", text: "保留を解除しました。" });
  }

  // 会計を確定（T022）。売上額・支払明細を保存し paymentStatus を paid に。
  function completeCheckout(reservationId: string, saleAmount: number, payments: ReservationPayment[], checkoutLines: CheckoutLine[]) {
    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? { ...reservation, paymentStatus: "paid", saleAmount, payments, checkoutLines: checkoutLines.length ? checkoutLines : undefined }
          : reservation
      )
    );
    setCheckoutReservationId(null);
    setMessage({ type: "success", text: `会計を確定しました（¥${saleAmount.toLocaleString()}）。` });
  }

  // 指名の設定/解除（T017）。設定時は担当スタッフを指名スタッフに合わせる。
  function setNomination(reservationId: string, staffId: string | null) {
    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? staffId
            ? { ...reservation, nominatedStaffId: staffId, staffId }
            : { ...reservation, nominatedStaffId: undefined }
          : reservation
      )
    );
    setMessage({
      type: "success",
      text: staffId ? "指名を設定しました。" : "指名を解除しました。"
    });
  }

  function placeFromShelf(staffId: string, startTime: string) {
    if (!shelfPickedId) return;
    const reservation = reservations.find((r) => r.id === shelfPickedId);
    if (!reservation) return;

    const start = timeToMinutes(reservation.startTime);
    const end = timeToMinutes(reservation.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setMessage({ type: "error", text: "予約の時間が正しくないため配置できません。" });
      return;
    }

    const duration = end - start;
    const newStart = timeToMinutes(startTime);
    const updatedReservation: Reservation = {
      ...reservation,
      date: selectedDate,
      startTime,
      endTime: minutesToTime(newStart + duration),
      staffId
    };

    const error = validateDraggedReservation({
      reservation: updatedReservation,
      currentReservations: reservations,
      staffList: staff,
      services,
      rooms,
      shifts
    });

    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    setReservations((prev) => prev.map((r) => (r.id === shelfPickedId ? updatedReservation : r)));
    setHoldShelf((prev) => prev.filter((id) => id !== shelfPickedId));
    setShelfPickedId(null);
    setMessage({ type: "success", text: `${formatDayLabel(selectedDate)} ${startTime} に配置しました。` });
  }

  function goToday() {
    setSelectedDate(getTodayDate());
  }

  function scrollTimelineToTime(startTime: string) {
    if (!timelineScrollRef.current) return;
    const start = timeToMinutes(startTime);
    const tlStart = timeToMinutes(businessStart);
    if (!Number.isFinite(start) || !Number.isFinite(tlStart)) return;
    // その時刻をスタッフ名列の真横（タイムライン左端）にぴったり合わせる（オフセットなし）。
    const x = Math.max(0, ((start - tlStart) / slotMinutes) * cellWidth);
    timelineScrollRef.current.scrollTo({ left: x, behavior: "smooth" });
  }

  function saveReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateReservationForm(form, normalizedReservations, editingReservationId);

    if (validationError) {
      setFormMessage({ type: "error", text: validationError });
      return;
    }

    const payload = normalizeForm(form);

    if (editingReservationId) {
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === editingReservationId ? { ...reservation, ...payload } : reservation
        )
      );
      setSelectedDate(payload.date);
      setMessage({ type: "success", text: "予約を更新しました。" });
      scrollTimelineToTime(payload.startTime);
    } else {
      // 新規予約にだけ現在店舗の storeId を付与（T063）。既存データは触らない。
      setReservations((current) => [{ id: makeLocalId("reservation"), ...payload, storeId: currentStoreId }, ...current]);
      setSelectedDate(payload.date);
      scrollTimelineToTime(payload.startTime);

      // 連続予約: 同じ顧客・担当・メニューで次の枠（開始＝今回終了＋インターバル）を続けて作成（T037）。
      if (form.isConsecutive) {
        const endMinutes = timeToMinutes(payload.endTime);
        const nextStart = Number.isFinite(endMinutes)
          ? minutesToTime(endMinutes + (payload.intervalMinutes ?? 0))
          : payload.startTime;
        setMessage({ type: "success", text: "予約を作成しました。連続予約: 次の枠を続けて入力してください。" });
        openCreateForm({
          date: payload.date,
          staffId: payload.staffId,
          serviceMenuId: payload.serviceMenuId,
          startTime: nextStart,
          customerName: payload.customerName,
          phone: payload.phone
        });
        return;
      }

      setMessage({ type: "success", text: "新規予約を作成しました。" });
    }

    closeForm();
  }

  function cancelReservation(reservation: Reservation, cancelType: CancelType = "cancel", cancelReason = "") {
    const canceledAt = new Date().toISOString();
    setReservations((current) =>
      current.map((item) =>
        item.id === reservation.id
          ? { ...item, status: "canceled", cancelType, cancelReason: cancelReason.trim(), canceledAt }
          : item
      )
    );
    setSelectedReservationId(null);
    setMessage({ type: "success", text: `予約を${cancelTypeLabels[cancelType]}にしました。` });
  }

  // 予約中／完了のステータス変更（T035）。キャンセルは cancelReservation で種別・理由・日時を記録。
  function changeReservationStatus(reservation: Reservation, status: ReservationStatus) {
    setReservations((current) =>
      current.map((item) =>
        item.id === reservation.id
          ? { ...item, status, ...(status === "booked" ? { cancelType: "none" as CancelType, cancelReason: "", canceledAt: "" } : {}) }
          : item
      )
    );
    setMessage({ type: "success", text: `ステータスを「${reservationStatusLabels[status]}」に変更しました。` });
  }

  // 左パネルの顧客検索から既存顧客を予約に紐づける（customerId を保存し、表示名・電話も顧客に合わせる）。
  // 顧客マスタ自体は変更しない（予約側だけ更新）。
  function linkCustomerToReservation(reservationId: string, customer: Customer) {
    setReservations((current) =>
      current.map((item) =>
        item.id === reservationId
          ? { ...item, customerId: customer.id, customerName: customer.name, phone: customer.phone }
          : item
      )
    );
    setMessage({ type: "success", text: `「${customer.name}」を予約に紐づけました。` });
  }

  // 既存顧客の紐づけを解除し、予約を再びゲストに戻す（customerId/氏名/電話をクリア）。顧客マスタは変更しない。
  function unlinkCustomerFromReservation(reservationId: string) {
    setReservations((current) =>
      current.map((item) =>
        item.id === reservationId
          ? { ...item, customerId: undefined, customerName: "ゲスト", phone: "" }
          : item
      )
    );
    setMessage({ type: "success", text: "顧客の紐づけを解除しました（ゲストに戻しました）。" });
  }

  // 左パネルの「＋新規」から最小項目で新規顧客を作成し、その予約に紐づける（顧客マスタへ非破壊追加）。
  function createCustomerAndLink(reservationId: string, draft: { name: string; phone: string; gender: CustomerGender }) {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: makeLocalId("customer"),
      name: draft.name,
      nameKana: "",
      phone: draft.phone,
      email: "",
      birthDate: "",
      gender: draft.gender,
      address: "",
      firstVisitDate: "",
      lastVisitDate: "",
      caution: "",
      chartMemo: "",
      tags: [],
      isActive: true,
      homeStoreId: currentStoreId,
      createdAt: now,
      updatedAt: now
    };
    setCustomers((current) => [newCustomer, ...current]);
    linkCustomerToReservation(reservationId, newCustomer);
  }

  function beginReservationDrag(event: ReactPointerEvent<HTMLButtonElement>, reservation: Reservation) {
    if (event.button !== 0 || reservation.status === "canceled") {
      return;
    }

    const start = timeToMinutes(reservation.startTime);
    const end = timeToMinutes(reservation.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setMessage({ type: "error", text: "予約の時刻が正しくないため移動できません。" });
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    console.log("[drag:start]", {
      reservationId: reservation.id,
      customerName: reservation.customerName,
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      originStartMinutes: start,
      durationMinutes: end - start,
      staffId: reservation.staffId
    });

    const nextState: ReservationDragState = {
      reservationId: reservation.id,
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      originStartMinutes: start,
      startMinutes: start,
      durationMinutes: end - start,
      currentPointerX: event.clientX,
      currentPointerY: event.clientY,
      originStaffId: reservation.staffId,
      targetStaffId: reservation.staffId,
      isDragging: false
    };

    dragStateRef.current = nextState;
    setDragState(nextState);

    // document に直接リスナーを登録（React 合成イベントやポインターキャプチャに依存しない最も確実な方法）
    detachDragListeners();
    const move = (e: PointerEvent) => {
      e.preventDefault();
      processPointerMove(e.clientX, e.clientY);
    };
    const up = () => {
      detachDragListeners();
      handleTimelinePointerUp();
    };
    dragListenersRef.current = { move, up };
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  }

  function detachDragListeners() {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    document.removeEventListener("pointermove", listeners.move);
    document.removeEventListener("pointerup", listeners.up);
    document.removeEventListener("pointercancel", listeners.up);
    dragListenersRef.current = null;
  }

  function validateReservationForm(
    value: ReservationForm,
    currentReservations: Reservation[],
    currentReservationId: string | null
  ) {
    // 顧客名・電話番号はゲスト登録のため必須にしない（T043。空なら保存時に「ゲスト」補完）。

    const selectedStaff = staff.find((item) => item.id === value.staffId);
    if (!selectedStaff) {
      return "担当スタッフを選択してください。";
    }

    if (!value.serviceMenuId) {
      return "メニューを選択してください。所要時間の確認に必要です。";
    }

    // ブースは個別固定せず種別の台数で判定するため、ブース選択の必須チェックは行わない（T011）。

    const staffMenuIds = selectedStaff.serviceMenuIds ?? [];
    if (staffMenuIds.length > 0 && !staffMenuIds.includes(value.serviceMenuId)) {
      return `このスタッフは選択中のメニューに対応していません。メニューか担当スタッフを変更してください: ${selectedStaff.displayName}`;
    }

    if (!value.date) {
      return "日付を選んでください。予約日が未入力です。";
    }

    const normalizedDate = normalizeDateInputValue(value.date);
    if (!normalizedDate) {
      return "日付をYYYY-MM-DD形式で選んでください。";
    }

    if (isBlank(value.startTime) || isBlank(value.endTime)) {
      return "開始時刻と終了時刻を入力してください。";
    }

    const normalizedStartTime = normalizeTimeInputValue(value.startTime);
    const normalizedEndTime = normalizeTimeInputValue(value.endTime);

    if (!normalizedStartTime || !normalizedEndTime) {
      return "開始時刻と終了時刻をHH:mm形式で入力してください。";
    }

    const start = timeToMinutes(normalizedStartTime);
    const end = timeToMinutes(normalizedEndTime);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return "開始時刻と終了時刻を正しい形式で入力してください。";
    }

    if (start % slotMinutes !== 0 || end % slotMinutes !== 0) {
      return "開始時刻と終了時刻は5分単位で入力してください。";
    }

    if (end <= start) {
      return "終了時刻を開始時刻より後にしてください。メニューの所要時間を確認して直してください。";
    }

    // 時間・曜日限定／店舗適用期間（PM §4-1）。選択日時で提供できないメニューは弾く。
    const selectedMenu = services.find((item) => item.id === value.serviceMenuId);
    if (selectedMenu && !isMenuAvailableForDateTime(selectedMenu, normalizedDate, normalizedStartTime)) {
      return `選択中のメニューはこの日時では提供できません（時間・曜日限定／適用期間）。日時かメニューを変更してください: ${selectedMenu.name}`;
    }

    const shiftAvailability = findShiftForReservation({
      staffId: value.staffId,
      date: normalizedDate,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      shifts
    });

    if (shiftAvailability.kind === "missing") {
      return "選択スタッフのシフトがありません。日付を変えるか、スタッフを変更してから予約してください。";
    }

    if (shiftAvailability.kind === "outside") {
      return `選択スタッフの勤務時間外です。シフト時間内に収まるように開始・終了時刻を見直してください: ${shiftAvailability.label}`;
    }

    if (shiftAvailability.kind === "break") {
      return `選択スタッフの休憩時間と重なっています。休憩を避けるか、時間をずらしてください: ${shiftAvailability.label}`;
    }

    if (value.status === "canceled") {
      return null;
    }

    // スタッフ重複（同一スタッフ・時間重複）は従来どおりブロックする。
    // 新規/編集予約・既存予約の双方のインターバルを占有時間に含める（T037）。
    const newInterval = parseOptionalNumber(value.intervalMinutes) ?? 0;
    const newIntervalBefore = parseOptionalNumber(value.intervalBeforeMinutes) ?? 0;
    const effectiveEnd = end + newInterval;
    const effectiveStart = start - newIntervalBefore;
    const staffOverlap = currentReservations.find((reservation) => {
      if (
        reservation.id === currentReservationId ||
        reservation.status === "canceled" ||
        normalizeDateInputValue(reservation.date) !== normalizedDate
      ) {
        return false;
      }

      const reservationStart = effectiveStartMinutes(reservation);
      const reservationEnd = effectiveEndMinutes(reservation);
      const overlaps = effectiveStart < reservationEnd && reservationStart < effectiveEnd;

      return overlaps && reservation.staffId === value.staffId;
    });

    if (staffOverlap) {
      return `担当スタッフが重複しています。時間をずらすかスタッフを変更してください: ${staffOverlap.customerName}`;
    }

    // ブースは個別固定せず、種別（個室/施術ブース）ごとの台数で空きを判定する（T011）。
    const boothAvailable = hasBoothCapacity({
      date: normalizedDate,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      serviceMenuId: value.serviceMenuId,
      currentReservations,
      services,
      rooms,
      excludeReservationId: currentReservationId ?? undefined
    });

    if (!boothAvailable) {
      const menu = services.find((item) => item.id === value.serviceMenuId);
      return menu?.requiresPrivateRoom
        ? "個室の空きがありません。時間をずらすか、別の時間帯にしてください。"
        : "施術ブースの空きがありません。時間をずらすか、別の時間帯にしてください。";
    }

    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="order-1 flex flex-wrap items-center gap-2 border-b border-luxas-line pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            onClick={() => openCreateForm({ date: selectedDate })}
          >
            <Plus size={17} aria-hidden="true" />
            新規予約
          </button>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-luxas-line bg-white p-1.5 shadow-sm">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-luxas-paper"
              onClick={() => setSelectedDate((current) => addDays(current, -1))}
            >
              <ChevronLeft size={17} aria-hidden="true" />
              前日
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-luxas-paper"
              onClick={goToday}
            >
              <CalendarDays size={17} className="text-luxas-green" aria-hidden="true" />
              今日へ戻る
            </button>
            {/* 日付表示は曜日付き1つに統一。透明オーバーレイのネイティブ入力でピッカー機能を維持。 */}
            <label
              className="relative flex cursor-pointer items-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 shadow-inner"
              onClick={(event) => {
                const input = event.currentTarget.querySelector("input[type='date']") as HTMLInputElement | null;
                try {
                  input?.showPicker?.();
                } catch {
                  /* showPicker 非対応・多重呼び出しは無視（クリックで通常どおり開く） */
                }
              }}
            >
              <CalendarDays size={17} className="text-luxas-green" aria-hidden="true" />
              <span className="text-sm font-semibold text-luxas-ink whitespace-nowrap">{formatDayLabel(selectedDate)}</span>
              <input
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                type="date"
                aria-label="日付を選択"
                value={selectedDate}
                onChange={(event) => {
                  const nextDate = normalizeDateInputValue(event.target.value);

                  if (nextDate) {
                    setSelectedDate(nextDate);
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-luxas-paper"
              onClick={() => setSelectedDate((current) => addDays(current, 1))}
            >
              翌日
              <ChevronRight size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-luxas-paper"
              onClick={() => window.location.reload()}
              title="最新データを再読込"
            >
              <RotateCw size={17} aria-hidden="true" />
              再読込
            </button>
          </div>
        </div>
        {/* 天気は実データ（Open-Meteo）。絞り込み／店舗はPM準拠の静的プレースホルダ。現在時刻は実値。 */}
        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs text-stone-500">
          {weather.status === "ready" ? (
            <span
              className="rounded-md border border-luxas-line bg-luxas-paper px-2 py-1"
              title={`${weather.label}（最低 ${weather.tempMin}℃ / 最高 ${weather.tempMax}℃）`}
            >
              {weather.icon} {weather.label} {weather.tempMax}℃
            </span>
          ) : (
            <span className="rounded-md border border-luxas-line bg-luxas-paper px-2 py-1" title="天気を取得できませんでした">
              {weather.status === "loading" ? "天気 取得中…" : "☀ 天気 --℃"}
            </span>
          )}
          <span className="rounded-md border border-luxas-line bg-white px-2 py-1" title="準備中">すべて ▾</span>
          <span className="rounded-md border border-luxas-line bg-white px-2 py-1" title="準備中">LUXAS 店舗 ▾</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-luxas-line bg-white px-2 py-1 font-mono text-sm font-semibold text-luxas-ink">
            <Clock3 size={14} className="text-luxas-green" aria-hidden="true" />
            {currentTime || "--:--"}
          </span>
        </div>
      </section>

      <div className="order-2 empty:hidden">
        <StatusMessage message={message} />
      </div>

      {isDebugMode ? (
        <section className="order-3 rounded-md border border-dashed border-luxas-line bg-luxas-paper px-4 py-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2 py-0.5 font-medium text-stone-500">Debug</span>
            <span>selectedDate: {debugCounts.selectedDate}</span>
            <span>loaded reservations count: {debugCounts.loadedReservationsCount}</span>
            <span>filtered reservations count: {debugCounts.filteredReservationsCount}</span>
            <span>visible shifted staff count: {debugCounts.visibleStaffCount}</span>
          </div>
        </section>
      ) : null}

      {/* 当日情報パネル（PM準拠・T036）。予約情報／販売情報／返客情報の3タブ。
          左レール「情報」ボタンで、予約詳細と同じ左スライドパネル（左ドロワー）として表示（T042）。 */}
      {isDayPanelOpen ? (
      <div className="fixed inset-0 z-50 flex bg-stone-950/35" onClick={() => setIsDayPanelOpen(false)}>
      <section className="relative flex h-full w-full max-w-[420px] flex-col overflow-hidden border-r border-luxas-line bg-white shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-luxas-line px-4 py-3">
          <p className="text-sm font-semibold text-luxas-green">当日情報</p>
          <button
            type="button"
            onClick={() => setIsDayPanelOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-luxas-line text-stone-600 transition hover:bg-luxas-paper"
            aria-label="情報パネルを閉じる"
            title="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-luxas-line px-3 py-2">
          {([
            { key: "reservation", label: "予約情報" },
            { key: "sales", label: "販売情報" },
            { key: "return", label: "返客情報" }
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setDayPanelTab(t.key)}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                dayPanelTab === t.key ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
          {dayPanelTab === "reservation" ? (
            <input
              type="text"
              value={dayPanelSearch}
              onChange={(event) => setDayPanelSearch(event.target.value)}
              placeholder="顧客名で絞り込み"
              className="ml-auto w-40 rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-sm">
          {dayPanelTab === "reservation" ? (
            dayPanelReservations.length > 0 ? (
              <ul className="divide-y divide-luxas-line">
                {dayPanelReservations.map((reservation) => (
                  <li key={reservation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedReservationId(reservation.id)}
                      className={[
                        "flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 text-left transition",
                        selectedReservationId === reservation.id ? "bg-luxas-mist ring-1 ring-inset ring-luxas-green/30" : "hover:bg-luxas-paper"
                      ].join(" ")}
                    >
                      <span className="font-mono text-xs text-stone-500">{reservation.startTime}-{reservation.endTime}</span>
                      <span className="font-semibold text-luxas-ink">{reservation.customerName || "（無名）"}</span>
                      <span className="text-xs text-stone-600">{getStaffName(reservation.staffId)} / {getServiceName(reservation.serviceMenuId)}</span>
                      <span className="ml-auto"><ReservationStatusPill status={reservation.status} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500">該当する予約がありません。</p>
            )
          ) : null}

          {dayPanelTab === "sales" ? (
            <div className="space-y-1.5 text-stone-700">
              <p>会計売上（当日）<b className="ml-1 text-luxas-ink">¥{checkoutSummary.totalSales.toLocaleString()}</b>
                <span className="ml-1 text-xs text-stone-500">（会計済 {dayCustomerReservations.filter((r) => r.paymentStatus === "paid").length}件）</span>
              </p>
              <p>物販売上（当日）<b className="ml-1 text-luxas-ink">¥{dayRetailTotal.toLocaleString()}</b>
                <span className="ml-1 text-xs text-stone-500">（物販販売画面の当日分）</span>
              </p>
              <p>合計 <b className="ml-1 text-luxas-ink">¥{(checkoutSummary.totalSales + dayRetailTotal).toLocaleString()}</b></p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-stone-600">
                <span>現金 ¥{checkoutSummary.methodTotals.cash.toLocaleString()}</span>
                <span>クレジット ¥{checkoutSummary.methodTotals.credit.toLocaleString()}</span>
                <span>電子マネー ¥{checkoutSummary.methodTotals.emoney.toLocaleString()}</span>
              </div>
              <p className="pt-1 text-[11px] text-stone-400">※ 会計＝予約詳細→会計の当日確定分（T022/T033）。物販＝物販販売（T032）の当日分。</p>
            </div>
          ) : null}

          {dayPanelTab === "return" ? (
            <>
              <p className="mb-2 text-xs text-stone-500">返客（受けられなかったお客様）{dayTurnaways.length}件 ／ キャンセル {dayCanceledReservations.length}件</p>
              {dayTurnaways.length > 0 ? (
                <ul className="divide-y divide-luxas-line">
                  {dayTurnaways.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTurnaway(t);
                          setIsReturnModalOpen(true);
                        }}
                        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 text-left transition hover:bg-luxas-paper"
                        title="クリックで編集"
                      >
                        <span className="font-mono text-xs text-stone-500">{t.startTime}</span>
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{t.kind}</span>
                        <span className="text-xs text-stone-600">{t.gender === "male" ? "男性" : t.gender === "female" ? "女性" : "—"}</span>
                        {t.reason ? <span className="text-xs text-stone-500">理由: {t.reason}</span> : null}
                        <span className="ml-auto text-xs text-luxas-green">編集</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTurnaways((current) => current.filter((x) => x.id !== t.id));
                          setMessage({ type: "success", text: "返客記録を削除しました。" });
                        }}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
                        aria-label="この返客記録を削除"
                        title="削除"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-500">当日の返客記録はありません（左の「返客」ボタンから登録）。</p>
              )}
            </>
          ) : null}
        </div>
      </section>
      </div>
      ) : null}

      {/* T067.5-B-1: 選択中予約の詳細は左スライドオーバー（ReservationDetailModal）に一本化したため、
          旧 order-6 サマリは削除（中央モーダルとの二重表示を解消）。 */}

      {heldReservations.length > 0 && (
        <section className="order-7 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <BookMarked size={16} className="text-amber-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-amber-900">保留棚</h2>
            <span className="text-xs text-amber-700">
              {shelfPickedId
                ? "↓ 選択中 — タイムラインの空き枠をクリックして配置してください"
                : "予約をクリックして選択 → 日付を変えて空き枠に配置できます"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {heldReservations.map((reservation) => (
              <div key={reservation.id} className="flex items-stretch overflow-hidden rounded-md border border-amber-200 bg-white shadow-sm">
                <button
                  type="button"
                  className={[
                    "px-3 py-2 text-left text-sm transition",
                    shelfPickedId === reservation.id
                      ? "bg-luxas-mist ring-2 ring-inset ring-luxas-green/40"
                      : "hover:bg-amber-50"
                  ].join(" ")}
                  onClick={() => setShelfPickedId((prev) => (prev === reservation.id ? null : reservation.id))}
                >
                  <p className="font-semibold text-luxas-ink">{reservation.customerName}</p>
                  <p className="mt-0.5 text-xs text-stone-600">
                    {getStaffName(reservation.staffId)} / {getServiceName(reservation.serviceMenuId)}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    元: {formatDayLabel(reservation.date)} {reservation.startTime}〜{reservation.endTime}
                  </p>
                </button>
                <button
                  type="button"
                  className="border-l border-amber-200 px-2 text-stone-400 hover:bg-red-50 hover:text-red-600 transition"
                  onClick={() => cancelHold(reservation.id)}
                  aria-label="保留を解除"
                  title="保留を解除して元の日付に戻す"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="order-4 flex items-stretch gap-3">
        {/* 左縦アクションレール（PM準拠・配置のみ）。既存導線のみ結線、無いものは準備中で無効。 */}
        <nav className="flex w-16 shrink-0 flex-col gap-1 self-start rounded-lg border border-luxas-line bg-white p-1.5">
          {[
            // 「予約」＋ボタンは廃止（新規予約はタイムラインの空き枠クリックから行う）。
            // 情報=当日情報パネル（予約情報／販売情報／返客情報）の表示切替（PM準拠）。
            { key: "情報", icon: CalendarDays, enabled: true, onClick: () => setIsDayPanelOpen((v) => !v) },
            // 開く=選択中予約の詳細モーダルを開く（未選択なら案内・落ちない）。
            {
              key: "開く",
              icon: DoorOpen,
              enabled: true,
              onClick: () => {
                if (!selectedReservation) {
                  setMessage({ type: "error", text: "予約カードを選択してから「開く」を押してください。" });
                  return;
                }
                setSelectedReservationId(selectedReservation.id);
              }
            },
            // 返客=電話・飛び込みで受けられなかったお客様の記録（予約とは別）。予約選択は不要・常に空フォームを開く。
            {
              key: "返客",
              icon: Undo2,
              enabled: true,
              onClick: () => {
                setSelectedReservationId(null);
                setEditingTurnaway(null);
                setIsReturnModalOpen(true);
              }
            },
            // 会計=選択中予約の会計モーダルを開く（未選択なら案内・落ちない）。
            {
              key: "会計",
              icon: Wallet,
              enabled: true,
              onClick: () => {
                if (!selectedReservation) {
                  setMessage({ type: "error", text: "予約カードを選択してから「会計」を押してください。" });
                  return;
                }
                setCheckoutReservationId(selectedReservation.id);
                setSelectedReservationId(null);
              }
            },
            { key: "顧客", icon: UserRound, enabled: true, href: "/dashboard/customers" },
            // 休憩/業務=予約以外のブロックを登録（種別・担当・開始・分数を専用フォームで指定）。
            {
              key: "休憩/業務",
              icon: Clock3,
              enabled: true,
              onClick: () => {
                setSelectedReservationId(null);
                setIsBlockFormOpen(true);
              }
            },
            // カード=回数券・プリペイド管理は未実装のため準備中（別タスクで対応）。
            { key: "カード", icon: CreditCard, enabled: false }
          ].map((item) => {
            const Icon = item.icon;
            const klass = [
              "flex flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[10px] font-medium transition",
              item.enabled ? "text-luxas-ink hover:bg-luxas-mist" : "cursor-not-allowed text-stone-300",
              item.key === "情報" && isDayPanelOpen ? "bg-luxas-mist text-luxas-green" : ""
            ].join(" ");
            if (item.href && item.enabled) {
              return (
                <Link key={item.key} href={item.href} className={klass}>
                  <Icon size={18} aria-hidden="true" />
                  {item.key}
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                type="button"
                className={klass}
                onClick={item.onClick}
                disabled={!item.enabled}
                title={item.enabled ? undefined : "準備中"}
              >
                <Icon size={18} aria-hidden="true" />
                {item.key}
              </button>
            );
          })}
        </nav>

      <section className="flex min-w-0 flex-1 flex-col rounded-lg border border-luxas-line bg-white">
        <div className="flex flex-col gap-1.5 border-b border-luxas-line px-3 py-1.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Clock3 size={16} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-luxas-ink">横向き予約タイムライン</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <div className="inline-flex overflow-hidden rounded-full border border-luxas-line">
              <button
                type="button"
                onClick={() => setTimelineView("basic")}
                className={[
                  "px-3 py-0.5 font-medium transition",
                  timelineView === "basic" ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"
                ].join(" ")}
              >
                基本
              </button>
              <button
                type="button"
                onClick={() => setTimelineView("full")}
                className={[
                  "px-3 py-0.5 font-medium transition",
                  timelineView === "full" ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"
                ].join(" ")}
              >
                全体
              </button>
              {["シフト", "ブース", "両方"].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  title="準備中"
                  className="cursor-not-allowed bg-white px-3 py-0.5 font-medium text-stone-300"
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="rounded-full border border-luxas-line bg-luxas-paper px-2 py-0.5">{businessStart} - {businessEnd}</span>
            <span className="rounded-full border border-luxas-line bg-white px-2 py-0.5">
              {selectedDateIsToday ? "本日表示" : "選択日表示"}
            </span>
          </div>
        </div>

        {/* ドラッグ用横長帯（PM準拠・T045）。日跨ぎ移動は保留棚へ誘導。 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-luxas-line bg-luxas-paper px-3 py-2 text-xs text-stone-500">
          <span>日付をまたいで予定を変更したい場合は、一旦このエリア（下部の「保留棚」）に置いてください。</span>
          <Link
            href="/dashboard/shifts/monthly"
            className="inline-flex items-center gap-1.5 rounded-md border border-luxas-line bg-white px-2.5 py-1 font-medium text-luxas-ink transition hover:bg-luxas-mist"
          >
            <CalendarDays size={14} className="text-luxas-green" aria-hidden="true" />
            シフト追加
          </Link>
        </div>

        {/* 予約集計バー（PM準拠・T019/T033）。売上・支払方法別・客単価・新規/リピートは会計（T022）確定データの実値。T045でタイムライン下部へ移動。 */}
        <div className="space-y-1 border-t border-luxas-line px-3 py-2 text-[11px] text-stone-600 order-last">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rounded-full bg-luxas-mist px-2 py-0.5 font-medium text-luxas-green">予約中 {reservationStats.booked}</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">完了 {reservationStats.completed}</span>
            <span>目標 <b className="text-stone-400">¥0</b></span>
            <span>総販売額 <b className="text-luxas-ink">¥{checkoutSummary.totalSales.toLocaleString()}</b></span>
            <span>新規 <b className="text-luxas-ink">{checkoutSummary.newCount}名</b></span>
            <span>リピート <b className="text-luxas-ink">{checkoutSummary.repeatCount}名</b></span>
            <span>総来店 <b className="text-luxas-ink">{new Set(dayCustomerReservations.filter((r) => r.status !== "canceled").map((r) => r.customerName.trim()).filter(Boolean)).size}名</b></span>
            <span>施術件数 <b className="text-luxas-ink">{reservationStats.booked + reservationStats.completed}件</b></span>
            <span>客単価 <b className="text-luxas-ink">¥{checkoutSummary.avgPerCustomer.toLocaleString()}</b></span>
            <span>取消 <b className="text-luxas-ink">{reservationStats.canceled}件</b></span>
            <span>無断キャンセル <b className="text-luxas-ink">{cancelStats.noShow}件</b></span>
            <span>返客 <b className="text-luxas-ink">{dayTurnaways.length}件</b></span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>施術売上 <b className="text-luxas-ink">¥{checkoutSummary.courseSales.toLocaleString()}</b></span>
            <span>物販 <b className="text-luxas-ink">¥{checkoutSummary.retailSales.toLocaleString()}</b><span className="ml-1 text-[11px] text-stone-400">（会計内・物販販売画面は別）</span></span>
            <span className="text-stone-400">回数券販売 ¥0</span>
            <span className="text-stone-400">プリペイド販売 ¥0</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>現金 ¥{checkoutSummary.methodTotals.cash.toLocaleString()}</span>
            <span>クレジット ¥{checkoutSummary.methodTotals.credit.toLocaleString()}</span>
            <span>回数券利用 ¥{checkoutSummary.methodTotals.ticket.toLocaleString()}</span>
            <span>プリペイド利用 ¥{checkoutSummary.methodTotals.prepaid.toLocaleString()}</span>
            <span>ポイント利用 ¥{checkoutSummary.methodTotals.point.toLocaleString()}</span>
            <span>商品券利用 ¥{checkoutSummary.methodTotals.giftcard.toLocaleString()}</span>
            <span>電子マネー ¥{checkoutSummary.methodTotals.emoney.toLocaleString()}</span>
            <span>EPARK ¥{checkoutSummary.methodTotals.epark.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-stone-400">
            ※ 総販売額・支払方法別・客単価・新規/リピートは会計（予約詳細→会計）確定分の当日集計。新規/リピート=当日来店客のうち過去の会計済来店有無で判定（電話番号優先・無ければ顧客名）。目標・物販・回数券/プリペイド販売・無断/返客は別管理または未整備のためダミー（0）。表示は5分刻み。
          </p>
        </div>

        {/* 時間ジャンプバー（PM準拠）。クリックでその時間へスクロール。小さい数字＝その時間帯の予約件数。 */}
        <div className="flex flex-wrap items-center gap-1 border-b border-luxas-line bg-luxas-paper/50 px-3 py-1.5">
          {hourSlots.map((slot) => {
            const hour = Math.floor(timeToMinutes(slot) / 60);
            const count = hourReservationCounts[hour] ?? 0;
            const isCurrentHour = selectedDateIsToday && nowMinutes != null && Math.floor(nowMinutes / 60) === hour;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => scrollTimelineToTime(slot)}
                title={`${hour}時へ移動（予約${count}件）`}
                className={[
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition",
                  isCurrentHour
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-mist"
                ].join(" ")}
              >
                <span>{hour}</span>
                {count > 0 ? (
                  <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-luxas-green px-1 text-[10px] font-bold leading-4 text-white">
                    {count}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-stone-300">0</span>
                )}
              </button>
            );
          })}
        </div>

        {timelineStaff.length === 0 ? (
          <div className="px-5 py-6 text-sm text-stone-600">この日に表示できるシフト中スタッフがいません。</div>
        ) : (
          <div
            className="overflow-x-auto"
            ref={timelineScrollRef}
            style={{ touchAction: dragState ? "none" : undefined }}
          >
            <div className="min-w-full" style={{ width: timelineContentWidth }}>
            <div className="flex border-b border-luxas-line">
              <div
                className="sticky left-0 z-30 flex shrink-0 items-center border-r border-luxas-line bg-white px-4 text-xs font-semibold text-stone-500 shadow-[1px_0_0_0_#e7e5e4]"
                style={{ width: staffColumnWidth, height: timelineHeaderHeight }}
              >
                スタッフ
              </div>
              <div className="flex shrink-0 overflow-hidden bg-white" style={{ width: timelineWidth, height: timelineHeaderHeight }}>
                {hourSlots.map((slot) => (
                  <div
                    key={slot}
                    className="relative flex h-full shrink-0 items-start border-l border-luxas-line bg-white px-2 pt-1.5 text-xs font-semibold leading-none text-stone-500"
                    style={{ width: cellWidth * slotsPerHour }}
                  >
                    <span className="text-sm font-semibold leading-none text-luxas-ink">{slot}</span>
                    <span className="absolute inset-x-0 bottom-0 border-b border-luxas-line/60" aria-hidden="true" />
                    <span className="absolute inset-y-2 left-1/4 border-l border-luxas-line/15" aria-hidden="true" />
                    <span className="absolute inset-y-2 left-1/2 border-l border-luxas-line/20" aria-hidden="true" />
                    <span className="absolute inset-y-2 left-3/4 border-l border-luxas-line/15" aria-hidden="true" />
                  </div>
                ))}
                <div className="h-full shrink-0 border-l border-luxas-line" aria-hidden="true" />
              </div>
            </div>

            {timelineStaff.map((item) => {
              const staffReservations = dayReservationsForTimeline.filter(
                (r) =>
                  r.staffId === item.id &&
                  (categoryFilter === "" ||
                    services.find((s) => s.id === r.serviceMenuId)?.category === categoryFilter)
              );
              // その日のこのスタッフのシフト時間帯（複数可）。シフト内=白／シフト外=グレーの判定に使う（T009）。
              const staffShiftWindows = shifts
                .filter(
                  (shift) =>
                    shift.staffId === item.id &&
                    (shift.isActive ?? true) &&
                    normalizeDateInputValue(shift.workDate) === normalizeDateInputValue(selectedDate)
                )
                .map((shift) => ({ start: timeToMinutes(shift.startTime), end: timeToMinutes(shift.endTime) }))
                .filter((window) => Number.isFinite(window.start) && Number.isFinite(window.end) && window.end > window.start);

              return (
                <div key={item.id} data-staff-id={item.id} className="flex border-b border-luxas-line last:border-b-0">
                  <div
                    className="sticky left-0 z-20 flex shrink-0 items-center border-r border-luxas-line bg-white px-3 shadow-[1px_0_0_0_#e7e5e4]"
                    style={{ width: staffColumnWidth, height: timelineRowHeight }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-luxas-mist text-xs font-semibold text-luxas-green">
                          {item.displayName.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-luxas-ink">{item.displayName}</p>
                          <p className="mt-0.5 text-xs text-stone-500">{item.isActive ? "対応中" : "無効"}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-stone-500">{staffReservationCountMap.get(item.id) ?? 0}件</p>
                    </div>
                  </div>

                  <div
                    className={[
                      "relative shrink-0 bg-white transition-colors",
                      dragState?.isDragging && dragState.targetStaffId === item.id
                        ? "ring-2 ring-inset ring-luxas-green/40 bg-luxas-mist/20"
                        : ""
                    ].join(" ")}
                    style={{ width: timelineWidth, height: timelineRowHeight }}
                  >
                    {showNowLine ? (
                      <div
                        className="pointer-events-none absolute top-0 z-20 w-0.5 bg-red-500"
                        style={{ left: nowLineLeft, height: timelineRowHeight }}
                        aria-hidden="true"
                      />
                    ) : null}
                    {slots.map((slot, index) => {
                      const endTime = slotEndTime(slot, slotMinutes) ?? slot;
                      const occupied = dayReservationsForTimeline.some(
                        (reservation) =>
                          reservation.status !== "canceled" &&
                          reservation.staffId === item.id &&
                          reservationOverlapsSlot(reservation, slot, endTime)
                      );
                      const isPlacingMode = Boolean(shelfPickedId);
                      // シフト時間内のセルか（開始時刻がいずれかのシフト窓に入るか）。シフト外は白でなくグレー＋クリック不可。
                      const slotStartMinutes = timeToMinutes(slot);
                      const inShift = staffShiftWindows.some(
                        (window) => slotStartMinutes >= window.start && slotStartMinutes < window.end
                      );
                      const clickable = inShift && !occupied;

                      return (
                        <button
                          key={slot}
                          type="button"
                          className={[
                            "group absolute inset-y-0 border-l text-[10px] font-semibold outline-none transition focus-visible:bg-luxas-mist/40",
                            index % slotsPerHour === 0
                              ? "border-luxas-line/55"
                              : index % slotsPerQuarterHour === 0
                                ? "border-luxas-line/30"
                                : "border-luxas-line/12",
                            !inShift
                              ? "cursor-not-allowed bg-stone-200"
                              : index % slotsPerHour === 0
                                ? "bg-luxas-paper/55"
                                : "bg-white",
                            !clickable
                              ? "cursor-default"
                              : isPlacingMode
                                ? "text-amber-600 hover:bg-amber-100/60"
                                : "text-luxas-green hover:bg-luxas-mist/30"
                          ].join(" ")}
                          style={{ left: index * cellWidth, width: cellWidth }}
                          onClick={() => {
                            if (!clickable) return;
                            if (isPlacingMode) {
                              placeFromShelf(item.id, slot);
                            } else {
                              openCreateForm({ date: selectedDate, staffId: item.id, startTime: slot });
                            }
                          }}
                          aria-label={
                            !inShift
                              ? `${item.displayName}の${slot}はシフト時間外です`
                              : isPlacingMode
                                ? `${item.displayName}の${slot}に保留中の予約を配置`
                                : `${item.displayName}の${slot}からの新規予約を作成`
                          }
                        >
                          {clickable ? (
                            <span className="inline-flex rounded-full bg-white/90 px-2 py-1 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                              {isPlacingMode ? "↓" : "＋"}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    <div className="absolute inset-y-0 right-0 border-l border-luxas-line" aria-hidden="true" />

                    {/* 移動中の時刻バッジ（T005）。ドロップ先行に、5分スナップ後の開始時刻を表示。 */}
                    {dragState?.isDragging && dragState.targetStaffId === item.id ? (
                      <div
                        className="pointer-events-none absolute z-30 rounded bg-luxas-green px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                        style={{
                          left: ((dragState.startMinutes - timeToMinutes(businessStart)) / slotMinutes) * cellWidth + 3,
                          top: 2
                        }}
                      >
                        {minutesToTime(dragState.startMinutes)}
                      </div>
                    ) : null}

                    {/* ゴーストカード: 別スタッフ行へのドラッグ中にターゲット行に表示 */}
                    {dragState &&
                      dragState.isDragging &&
                      dragState.targetStaffId === item.id &&
                      dragState.originStaffId !== item.id && (() => {
                        const srcReservation = reservations.find(r => r.id === dragState.reservationId);
                        if (!srcReservation) return null;
                        const ghostReservation = {
                          ...srcReservation,
                          staffId: item.id,
                          startTime: minutesToTime(dragState.startMinutes),
                          endTime: minutesToTime(dragState.startMinutes + dragState.durationMinutes)
                        };
                        return (
                          <ReservationCard
                            key={`ghost-${dragState.reservationId}`}
                            reservation={ghostReservation}
                            serviceName={getServiceName(srcReservation.serviceMenuId)}
                            {...getReservationCardProps(srcReservation)}
                            onClick={() => {}}
                            onPointerDown={() => {}}
                            isDragging={true}
                            cellWidth={cellWidth}
                            businessStart={businessStart}
                            businessEnd={businessEnd}
                            slotMinutes={slotMinutes}
                          />
                        );
                      })()}

                    {staffReservations.map((reservation) => {
                      const isDraggingCard = dragState?.reservationId === reservation.id;
                      // 別スタッフ行にドラッグ中は元の行でカードを薄く表示
                      const isDraggingToOtherRow = isDraggingCard && dragState.isDragging && dragState.targetStaffId !== dragState.originStaffId;
                      const displayReservation = isDraggingCard && !isDraggingToOtherRow
                        ? {
                            ...reservation,
                            startTime: minutesToTime(dragState.startMinutes),
                            endTime: minutesToTime(dragState.startMinutes + dragState.durationMinutes)
                          }
                        : reservation;

                      return (
                        <ReservationCard
                          key={reservation.id}
                          reservation={displayReservation}
                          serviceName={getServiceName(reservation.serviceMenuId)}
                          {...getReservationCardProps(reservation)}
                          onClick={() => {
                            if (dragSuppressClickRef.current) {
                              dragSuppressClickRef.current = false;
                              return;
                            }

                            setSelectedReservationId(reservation.id);
                          }}
                          onPointerDown={(event) => beginReservationDrag(event, reservation)}
                          isDragging={isDraggingCard}
                          fadedOut={isDraggingToOtherRow}
                          cellWidth={cellWidth}
                          businessStart={businessStart}
                          businessEnd={businessEnd}
                          slotMinutes={slotMinutes}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {dayReservations.length === 0 ? (
          <div className="border-t border-luxas-line px-5 py-6 text-sm text-stone-600">
            この日の予約はありません。「新規予約」から追加できます。
          </div>
        ) : null}

        {/* 下部ツールバー（PM準拠・配置）。機能はカテゴリ絞り込みのみ、他は準備中。 */}
        <div className="flex flex-wrap items-center gap-2 border-t border-luxas-line px-3 py-2 text-xs">
          <label className="flex items-center gap-1.5 text-stone-600">
            <span className="font-medium">カテゴリ絞り込み</span>
            <select
              className="rounded-md border border-luxas-line bg-white px-2 py-1 text-stone-700 outline-none focus:border-luxas-green"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">すべて</option>
              {Array.from(new Set(services.map((s) => s.category).filter(Boolean))).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1 font-medium text-stone-300" title="準備中">
            予約集計 ▼
          </button>
          <button type="button" disabled className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1 font-medium text-stone-300" title="準備中">
            インターバル:ON
          </button>
          <button type="button" disabled className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1 font-medium text-stone-300" title="準備中">
            ひな型登録
          </button>
          <button type="button" disabled className="cursor-not-allowed rounded-md border border-luxas-line bg-white px-2.5 py-1 font-medium text-stone-300" title="準備中">
            ひな型読込
          </button>
        </div>
      </section>
      </div>

      <ReservationDetailModal
        key={selectedReservationId ?? "none"}
        reservation={selectedReservation}
        customers={customers}
        stores={stores}
        currentStoreId={currentStoreId}
        serviceName={selectedReservation ? getServiceName(selectedReservation.serviceMenuId) : ""}
        roomName={selectedReservation ? getBoothKindLabel(selectedReservation.serviceMenuId) : ""}
        staffName={selectedReservation ? getStaffName(selectedReservation.staffId) : ""}
        customer={selectedReservationCustomer}
        onClose={() => setSelectedReservationId(null)}
        onEdit={openEditForm}
        onCancel={cancelReservation}
        onStatusChange={changeReservationStatus}
        expectedSale={selectedReservationExpectedSale}
        onHold={addToHoldShelf}
        staff={staff}
        onNominate={setNomination}
        onCheckout={(reservation) => {
          setCheckoutReservationId(reservation.id);
          setSelectedReservationId(null);
        }}
        routeTags={routeTags}
        options={activeOptions}
        onLinkCustomer={linkCustomerToReservation}
        onUnlinkCustomer={unlinkCustomerFromReservation}
        onCreateCustomer={createCustomerAndLink}
        onUpdateBlock={updateTimeBlock}
        onDeleteBlock={deleteTimeBlock}
      />

      <CheckoutModal
        reservation={normalizedReservations.find((r) => r.id === checkoutReservationId) ?? null}
        onClose={() => setCheckoutReservationId(null)}
        onSave={completeCheckout}
      />

      <ReturnModal
        key={isReturnModalOpen ? `open-${editingTurnaway?.id ?? "new"}` : "closed"}
        isOpen={isReturnModalOpen}
        editing={editingTurnaway}
        defaultDate={selectedDate}
        defaultTime={initialStoreSettings.reservationAcceptStartTime}
        services={services}
        options={activeOptions}
        staff={staff}
        onClose={() => {
          setIsReturnModalOpen(false);
          setEditingTurnaway(null);
        }}
        onSubmit={(record) => {
          if (editingTurnaway) {
            setTurnaways((current) =>
              current.map((t) => (t.id === editingTurnaway.id ? { ...t, ...record } : t))
            );
            setMessage({ type: "success", text: "返客記録を更新しました。" });
          } else {
            setTurnaways((current) => [
              { ...record, id: makeLocalId("turnaway"), storeId: currentStoreId, createdAt: new Date().toISOString() },
              ...current
            ]);
            setMessage({ type: "success", text: "返客を登録しました。" });
          }
          setIsReturnModalOpen(false);
          setEditingTurnaway(null);
        }}
        onDelete={(id) => {
          setTurnaways((current) => current.filter((t) => t.id !== id));
          setIsReturnModalOpen(false);
          setEditingTurnaway(null);
          setMessage({ type: "success", text: "返客記録を削除しました。" });
        }}
      />

      <BlockFormModal
        key={isBlockFormOpen ? "block-open" : "block-closed"}
        isOpen={isBlockFormOpen}
        staff={timelineStaff.length ? timelineStaff : activeStaff}
        defaultDate={selectedDate}
        defaultTime={initialStoreSettings.reservationAcceptStartTime}
        onClose={() => setIsBlockFormOpen(false)}
        onSubmit={createTimeBlock}
      />

      <ReservationFormModal
        isOpen={isReservationFormOpen}
        mode={reservationFormMode}
        form={form}
        formMessage={formMessage}
        staff={formStaffOptions}
        services={formServiceOptions}
        customers={customers}
        routeTags={routeTags}
        options={activeOptions}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={saveReservation}
      />
    </div>
  );
}

function buildSelectableServices(
  activeServices: ServiceMenu[],
  allServices: ServiceMenu[],
  selectedServiceId: string,
  mode: FormMode | null,
  date: string,
  startTime: string
) {
  // 時間・曜日限定／適用期間で、選択中の日時に提供できないコースは候補から外す。
  const base = activeServices.filter((service) => isMenuAvailableForDateTime(service, date, startTime));
  const currentService = mode === "edit" ? allServices.find((service) => service.id === selectedServiceId) : null;

  if (currentService && !base.some((service) => service.id === currentService.id)) {
    base.push(currentService);
  }

  return base.sort(compareBySortOrder);
}

function buildSelectableStaff(
  activeStaff: StaffMember[],
  allStaff: StaffMember[],
  selectedServiceId: string,
  selectedStaffId: string,
  mode: FormMode | null
) {
  const base = [...activeStaff];
  const currentStaff = mode === "edit" ? allStaff.find((staff) => staff.id === selectedStaffId) : null;

  if (currentStaff && !base.some((staff) => staff.id === currentStaff.id)) {
    base.push(currentStaff);
  }

  return getSelectableStaffForService(base, selectedServiceId).sort(compareBySortOrder);
}


function getSelectableStaffForService(staffList: StaffMember[], serviceMenuId: string) {
  if (isBlank(serviceMenuId)) {
    return [...staffList];
  }

  return staffList.filter((staff) => {
    const assignedServices = staff.serviceMenuIds ?? [];
    return assignedServices.length === 0 || assignedServices.includes(serviceMenuId);
  });
}

function slotEndTime(startTime: string, slotMinutes: number) {
  const start = timeToMinutes(startTime);
  if (!Number.isFinite(start)) {
    return null;
  }

  return minutesToTime(start + slotMinutes);
}

function reservationOverlapsSlot(reservation: Reservation, startTime: string, endTime: string) {
  const reservationStart = timeToMinutes(reservation.startTime);
  const reservationEnd = timeToMinutes(reservation.endTime);
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  if (
    !Number.isFinite(reservationStart) ||
    !Number.isFinite(reservationEnd) ||
    !Number.isFinite(slotStart) ||
    !Number.isFinite(slotEnd)
  ) {
    return false;
  }

  return slotStart < reservationEnd && reservationStart < slotEnd;
}

function reservationOverlapsMinutes(
  reservation: Reservation,
  startMinutes: number,
  endMinutes: number,
  excludedReservationId?: string
) {
  if (reservation.id === excludedReservationId || reservation.status === "canceled") {
    return false;
  }

  // 既存予約の前後インターバルを占有時間に含める（T037＋前インターバル）。
  const reservationStart = effectiveStartMinutes(reservation);
  const reservationEnd = effectiveEndMinutes(reservation);

  if (!Number.isFinite(reservationStart) || !Number.isFinite(reservationEnd)) {
    return false;
  }

  return startMinutes < reservationEnd && reservationStart < endMinutes;
}

function getReservationPlacement(
  reservation: Reservation,
  cellWidth: number,
  businessStart: string,
  businessEnd: string,
  slotMinutes: number
) {
  const start = timeToMinutes(reservation.startTime);
  const end = timeToMinutes(reservation.endTime);
  const timelineStart = timeToMinutes(businessStart);
  const timelineEnd = timeToMinutes(businessEnd);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(timelineStart) ||
    !Number.isFinite(timelineEnd) ||
    end <= start
  ) {
    return null;
  }

  const visibleStart = Math.max(start, timelineStart);
  const visibleEnd = Math.min(end, timelineEnd);

  if (visibleEnd <= visibleStart) {
    // Invalid or out-of-range data is skipped instead of rendering at a negative offset.
    return null;
  }

  const left = ((visibleStart - timelineStart) / slotMinutes) * cellWidth + 3;
  const width = Math.max(cellWidth - 6, ((visibleEnd - visibleStart) / slotMinutes) * cellWidth - 6);

  return { left, width };
}

function clampReservationStartMinutes(
  startMinutes: number,
  durationMinutes: number,
  businessStart: string,
  businessEnd: string
) {
  const timelineStart = timeToMinutes(businessStart);
  const timelineEnd = timeToMinutes(businessEnd);
  const maxStart = Math.max(timelineStart, timelineEnd - durationMinutes);

  if (!Number.isFinite(startMinutes) || !Number.isFinite(durationMinutes)) {
    return timelineStart;
  }

  if (!Number.isFinite(timelineStart) || !Number.isFinite(timelineEnd)) {
    return startMinutes;
  }

  return Math.max(timelineStart, Math.min(startMinutes, maxStart));
}

function validateDraggedReservation({
  reservation,
  currentReservations,
  staffList,
  services,
  rooms,
  shifts
}: {
  reservation: Reservation;
  currentReservations: Reservation[];
  staffList: StaffMember[];
  services: ServiceMenu[];
  rooms: ServiceRoom[];
  shifts: StaffShift[];
}) {
  if (reservation.status === "canceled") {
    return "キャンセル済みの予約は移動できません。";
  }

  const start = timeToMinutes(reservation.startTime);
  const end = timeToMinutes(reservation.endTime);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "移動先の時刻が正しくありません。";
  }

  if (end <= start) {
    return "移動先の終了時刻が開始時刻より前です。";
  }

  const selectedStaff = staffList.find((item) => item.id === reservation.staffId);
  if (!selectedStaff) {
    return "担当スタッフを選択してください。";
  }

  // 指名予約は担当スタッフ変更不可（時刻の移動は可）。移動先が指名スタッフと異なる場合はブロック（T017）。
  if (reservation.nominatedStaffId && reservation.nominatedStaffId !== reservation.staffId) {
    return "指名予約のため担当スタッフは変更できません。時刻の移動は同じ担当の行で行ってください。";
  }

  if (!services.find((item) => item.id === reservation.serviceMenuId)) {
    return "メニューが見つかりません。";
  }

  // ブースは個別固定しないため、ブース存在チェックは行わない（T011）。

  const staffMenuIds = selectedStaff.serviceMenuIds ?? [];
  if (staffMenuIds.length > 0 && !staffMenuIds.includes(reservation.serviceMenuId)) {
    return `このスタッフは選択中のメニューに対応していません。メニューか担当スタッフを変更してください: ${selectedStaff.displayName}`;
  }

  const shiftAvailability = findShiftForReservation({
    staffId: reservation.staffId,
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    shifts
  });

  if (shiftAvailability.kind === "missing") {
    return "選択スタッフのシフトがありません。";
  }

  if (shiftAvailability.kind === "outside") {
    return `選択スタッフの勤務時間外です。シフト時間内に収まるように開始・終了時刻を見直してください: ${shiftAvailability.label}`;
  }

  if (shiftAvailability.kind === "break") {
    return `選択スタッフの休憩時間と重なっています。休憩を避けるか、時間をずらしてください: ${shiftAvailability.label}`;
  }

  // スタッフ重複（同一スタッフ・時間重複）は従来どおりブロックする。
  const currentReservationsWithoutSelf = currentReservations.filter((item) => item.id !== reservation.id);
  // 移動中の予約の前後インターバルも占有に含める（T037＋前インターバル）。
  const draggedEffectiveEnd = end + (reservation.intervalMinutes ?? 0);
  const draggedEffectiveStart = start - (reservation.intervalBeforeMinutes ?? 0);
  const staffConflict = currentReservationsWithoutSelf.find(
    (item) =>
      item.date === reservation.date &&
      item.staffId === reservation.staffId &&
      reservationOverlapsMinutes(item, draggedEffectiveStart, draggedEffectiveEnd)
  );

  if (staffConflict) {
    return "同じスタッフの予約と重複しています。";
  }

  // ブースは個別固定せず、種別（個室/施術ブース）ごとの台数で空きを判定する（T011）。
  const boothAvailable = hasBoothCapacity({
    date: reservation.date,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    serviceMenuId: reservation.serviceMenuId,
    currentReservations,
    services,
    rooms,
    excludeReservationId: reservation.id
  });

  if (!boothAvailable) {
    const menu = services.find((item) => item.id === reservation.serviceMenuId);
    return menu?.requiresPrivateRoom
      ? "個室の空きがありません。時間をずらしてください。"
      : "施術ブースの空きがありません。時間をずらしてください。";
  }

  return null;
}

function findShiftForReservation({
  staffId,
  date,
  startTime,
  endTime,
  shifts
}: {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  shifts: StaffShift[];
}):
  | { kind: "ok"; label: string; shift: StaffShift }
  | { kind: "missing"; label: string }
  | { kind: "outside"; label: string }
  | { kind: "break"; label: string } {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { kind: "outside", label: "時刻が未入力です" };
  }

  const candidateShifts = shifts.filter((shift) => shift.staffId === staffId && shift.workDate === date && (shift.isActive ?? true));

  if (candidateShifts.length === 0) {
    return { kind: "missing", label: "シフト未設定" };
  }

  for (const shift of candidateShifts) {
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);

    if (!Number.isFinite(shiftStart) || !Number.isFinite(shiftEnd)) {
      continue;
    }

    if (start < shiftStart || end > shiftEnd) {
      continue;
    }

    const breakStart = timeToMinutes(shift.breakStart);
    const breakEnd = timeToMinutes(shift.breakEnd);

    if (Number.isFinite(breakStart) && Number.isFinite(breakEnd) && start < breakEnd && breakStart < end) {
      return { kind: "break", label: `${shift.startTime}-${shift.endTime} / 休憩 ${shift.breakStart}-${shift.breakEnd}` };
    }

    return { kind: "ok", label: `${shift.startTime}-${shift.endTime}`, shift };
  }

  return { kind: "outside", label: candidateShifts.map((shift) => `${shift.startTime}-${shift.endTime}`).join(" / ") };
}

// メニューのカテゴリ色分け（PM準拠・T020）。LUXASトーンで割り当て。
// メニューの色キーを決める：個別色（master の color）優先、未設定ならカテゴリ由来の色にフォールバック（白枠回避）。
function categoryToColorKey(category?: string): string {
  switch (category) {
    case "ボディケア":
      return "green";
    case "フェイシャル":
      return "rose";
    case "カウンセリング":
      return "sky";
    case "オプション":
      return "amber";
    // PM実データのカテゴリ（2026-06-20）
    case "ヘッド・頭ほぐし":
      return "violet";
    case "特別・スペシャル":
      return "rose";
    case "寄附金付き":
      return "amber";
    case "インバウンド":
      return "sky";
    case "外国人向け":
      return "teal";
    case "マタニティ":
      return "pink";
    case "鍼":
      return "stone";
    case "シャンプー":
      return "sky";
    case "出張":
      return "teal";
    case "HPB":
      return "amber";
    case "ClassPass":
      return "violet";
    case "TORICOM":
      return "stone";
    default:
      return "teal";
  }
}

function menuColorKeyFor(menu?: { color?: string; category?: string } | null): string {
  return menu?.color || categoryToColorKey(menu?.category);
}

function categoryColorClass(category: string): { tag: string; text: string; border: string; activeBg: string } {
  switch (category) {
    case "ボディケア":
      return { tag: "bg-luxas-mist text-luxas-green", text: "text-luxas-green", border: "border-luxas-green/40", activeBg: "bg-luxas-green" };
    case "フェイシャル":
      return { tag: "bg-rose-50 text-rose-700", text: "text-rose-700", border: "border-rose-300", activeBg: "bg-rose-600" };
    case "カウンセリング":
      return { tag: "bg-sky-50 text-sky-700", text: "text-sky-700", border: "border-sky-300", activeBg: "bg-sky-600" };
    case "オプション":
      return { tag: "bg-amber-50 text-amber-700", text: "text-amber-700", border: "border-amber-300", activeBg: "bg-amber-600" };
    // PM実データのカテゴリ（2026-06-20）
    case "ヘッド・頭ほぐし":
      return { tag: "bg-violet-50 text-violet-700", text: "text-violet-700", border: "border-violet-300", activeBg: "bg-violet-600" };
    case "特別・スペシャル":
      return { tag: "bg-rose-50 text-rose-700", text: "text-rose-700", border: "border-rose-300", activeBg: "bg-rose-600" };
    case "寄附金付き":
      return { tag: "bg-amber-50 text-amber-700", text: "text-amber-700", border: "border-amber-300", activeBg: "bg-amber-600" };
    case "インバウンド":
      return { tag: "bg-sky-50 text-sky-700", text: "text-sky-700", border: "border-sky-300", activeBg: "bg-sky-600" };
    case "外国人向け":
      return { tag: "bg-teal-50 text-teal-700", text: "text-teal-700", border: "border-teal-300", activeBg: "bg-teal-600" };
    case "マタニティ":
      return { tag: "bg-pink-50 text-pink-700", text: "text-pink-700", border: "border-pink-300", activeBg: "bg-pink-600" };
    case "鍼":
      return { tag: "bg-stone-100 text-stone-600", text: "text-stone-700", border: "border-stone-300", activeBg: "bg-stone-600" };
    case "シャンプー":
      return { tag: "bg-sky-50 text-sky-700", text: "text-sky-700", border: "border-sky-300", activeBg: "bg-sky-600" };
    case "出張":
      return { tag: "bg-teal-50 text-teal-700", text: "text-teal-700", border: "border-teal-300", activeBg: "bg-teal-600" };
    case "HPB":
      return { tag: "bg-amber-50 text-amber-700", text: "text-amber-700", border: "border-amber-300", activeBg: "bg-amber-600" };
    case "ClassPass":
      return { tag: "bg-violet-50 text-violet-700", text: "text-violet-700", border: "border-violet-300", activeBg: "bg-violet-600" };
    case "TORICOM":
      return { tag: "bg-stone-100 text-stone-600", text: "text-stone-700", border: "border-stone-300", activeBg: "bg-stone-600" };
    default:
      return { tag: "bg-stone-100 text-stone-600", text: "text-stone-700", border: "border-luxas-line", activeBg: "bg-stone-600" };
  }
}

function normalizeForm(form: ReservationForm): Omit<Reservation, "id"> {
  const nominatedStaffId = normalizeText(form.nominatedStaffId);
  // 指名あり（nominatedStaffId が空でない）なら担当を指名スタッフに合わせる。
  const staffId = nominatedStaffId || normalizeText(form.staffId);
  return {
    customerName: normalizeText(form.customerName) || "ゲスト",
    phone: normalizeText(form.phone),
    serviceMenuId: normalizeText(form.serviceMenuId),
    staffId,
    roomId: normalizeText(form.roomId),
    date: normalizeDateInputValue(form.date) ?? form.date,
    startTime: normalizeTimeInputValue(form.startTime) ?? form.startTime,
    endTime: normalizeTimeInputValue(form.endTime) ?? form.endTime,
    memo: normalizeText(form.memo),
    status: form.status,
    nominatedStaffId: nominatedStaffId || undefined,
    // --- T030 ---
    preference: form.preference === "male" ? "male" : "none",
    bookingTagIds: form.bookingTagIds.length ? form.bookingTagIds : undefined,
    optionIds: form.optionIds.length ? form.optionIds : undefined,
    discountPercent: parseOptionalNumber(form.discountPercent),
    discountYen: parseOptionalNumber(form.discountYen),
    bulkDiscountPercent: parseOptionalNumber(form.bulkDiscountPercent),
    bulkDiscountYen: parseOptionalNumber(form.bulkDiscountYen),
    isConsecutive: form.isConsecutive || undefined,
    intervalMinutes: parseOptionalNumber(form.intervalMinutes),
    intervalBeforeMinutes: parseOptionalNumber(form.intervalBeforeMinutes),
    // --- T067.5-A ---
    customerId: normalizeText(form.customerId) || undefined,
    guestGender: form.guestGender || undefined
  };
}

// 売上見込の計算（T037）。コース料金＋オプション−個別割引(%→円換算)−一括割引。端数は四捨五入。
function computeReservationPricing(
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

// インターバルを加算した実効終了（分）。占有・重複判定に使う（T037）。
function effectiveEndMinutes(reservation: Reservation) {
  const end = timeToMinutes(reservation.endTime);
  if (!Number.isFinite(end)) {
    return end;
  }
  return end + (reservation.intervalMinutes ?? 0);
}

// 施術前インターバルを差し引いた実効開始（分）。占有・重複判定に使う。
function effectiveStartMinutes(reservation: Reservation) {
  const start = timeToMinutes(reservation.startTime);
  if (!Number.isFinite(start)) {
    return start;
  }
  return start - (reservation.intervalBeforeMinutes ?? 0);
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

function ReservationStatusPill({ status }: { status: ReservationStatus }) {
  const styles: Record<ReservationStatus, string> = {
    booked: "bg-luxas-mist text-luxas-green",
    completed: "bg-emerald-50 text-emerald-800",
    canceled: "bg-stone-100 text-stone-500"
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium ${styles[status]}`}>
      {reservationStatusLabels[status]}
    </span>
  );
}

function ReservationCard({
  reservation,
  serviceName,
  menuColorKey,
  genderLabel,
  isNew = false,
  privateRoomLabel = "",
  onClick,
  onPointerDown,
  isDragging,
  fadedOut = false,
  cellWidth,
  businessStart,
  businessEnd,
  slotMinutes
}: {
  reservation: Reservation;
  serviceName: string;
  menuColorKey?: string;
  genderLabel?: string;
  isNew?: boolean;
  privateRoomLabel?: string;
  onClick: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  isDragging: boolean;
  fadedOut?: boolean;
  cellWidth: number;
  businessStart: string;
  businessEnd: string;
  slotMinutes: number;
}) {
  const placement = getReservationPlacement(reservation, cellWidth, businessStart, businessEnd, slotMinutes);
  const isCanceled = reservation.status === "canceled";
  const isCompleted = reservation.status === "completed";
  const isPaid = reservation.paymentStatus === "paid";
  const isNominated = Boolean(reservation.nominatedStaffId);
  // 背景色（T066）: 会計済み=グレー優先 ／ それ以外=メニュー色（未設定はデフォルト）。
  const cardStyle = reservationCardStyle(menuColorKey, isPaid);

  if (!placement) {
    return null;
  }

  // 施術前後インターバルのグレー枠（予約枠の外側）。インターバル時間に比例した幅で表示。
  const tlStart = timeToMinutes(businessStart);
  const tlEnd = timeToMinutes(businessEnd);
  const startMin = timeToMinutes(reservation.startTime);
  const endMin = timeToMinutes(reservation.endTime);
  const beforeMin = reservation.intervalBeforeMinutes ?? 0;
  const afterMin = reservation.intervalMinutes ?? 0;
  const pxFor = (m: number) => ((m - tlStart) / slotMinutes) * cellWidth + 3;
  const beforeFrom = Math.max(startMin - beforeMin, tlStart);
  const afterTo = Math.min(endMin + afterMin, tlEnd);
  const beforeBlock =
    beforeMin > 0 && startMin > tlStart ? { left: pxFor(beforeFrom), width: Math.max(0, pxFor(startMin) - pxFor(beforeFrom)) } : null;
  const afterBlock =
    afterMin > 0 && endMin < tlEnd ? { left: pxFor(endMin) - 6, width: Math.max(0, pxFor(afterTo) - pxFor(endMin)) } : null;
  const intervalBlockStyle = "pointer-events-none absolute z-[5] rounded-sm bg-stone-300/70 ring-1 ring-inset ring-stone-400/40";

  // 小ラベル（女/男・新・指）。
  const labelChip = (text: string) => (
    <span className="mr-1 inline-flex shrink-0 items-center rounded-sm bg-white/85 px-1 text-[9px] font-bold leading-[14px] text-stone-700 ring-1 ring-inset ring-stone-300">
      {text}
    </span>
  );

  return (
    <>
      {beforeBlock && beforeBlock.width > 0 ? (
        <div
          className={intervalBlockStyle}
          style={{ left: beforeBlock.left, top: 16, width: beforeBlock.width, height: timelineRowHeight - 32 }}
          title={`施術前インターバル ${beforeMin}分`}
        />
      ) : null}
      {afterBlock && afterBlock.width > 0 ? (
        <div
          className={intervalBlockStyle}
          style={{ left: afterBlock.left, top: 16, width: afterBlock.width, height: timelineRowHeight - 32 }}
          title={`施術後インターバル ${afterMin}分`}
        />
      ) : null}
    <button
      type="button"
      className={[
        "absolute z-10 overflow-hidden rounded-md border px-2 py-1.5 text-left text-xs shadow-sm transition hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-luxas-green",
        isCanceled ? "opacity-45 grayscale-[0.15]" : "",
        isCompleted ? "ring-1 ring-inset ring-emerald-300" : "",
        isDragging ? "cursor-grabbing opacity-80 shadow-soft ring-2 ring-luxas-green/25" : "cursor-grab",
        fadedOut ? "opacity-25" : "",
        cardStyle.bg,
        cardStyle.text,
        cardStyle.border
      ].join(" ")}
      style={{ left: placement.left, top: 7, width: placement.width, height: timelineRowHeight - 14, touchAction: "none", userSelect: "none" }}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {/* 1行目: [女/男] 顧客名（個室利用時のみ【個室名】、オンライン予約は[ネット]） */}
      <p className="flex min-w-0 items-center truncate text-xs font-semibold leading-tight">
        {genderLabel ? labelChip(genderLabel) : null}
        {reservation.source === "online" ? (
          <span className="mr-1 shrink-0 rounded bg-sky-100 px-1 text-[9px] font-medium text-sky-700">ネット</span>
        ) : null}
        <span className="truncate">{reservation.customerName}</span>
        {privateRoomLabel ? <span className="ml-1 shrink-0 text-[10px] font-medium text-stone-600">【{privateRoomLabel}】</span> : null}
      </p>
      {/* 2行目: [新] 開始〜終了 */}
      <p className="mt-0.5 flex items-center truncate whitespace-nowrap text-[11px] font-medium leading-tight">
        {isNew ? labelChip("新") : null}
        <span>{reservation.startTime} - {reservation.endTime}</span>
      </p>
      {/* 3行目: [指] メニュー名 */}
      <p className="flex items-center truncate whitespace-nowrap text-[10px] leading-tight">
        {isNominated ? labelChip("指") : null}
        <span className="truncate">{serviceName}</span>
      </p>
    </button>
    </>
  );
}

function ReservationDetailModal({
  reservation,
  serviceName,
  roomName,
  staffName,
  customer,
  onClose,
  onEdit,
  onCancel,
  onStatusChange,
  expectedSale,
  onHold,
  staff,
  onNominate,
  onCheckout,
  routeTags,
  options,
  customers,
  stores,
  currentStoreId,
  onLinkCustomer,
  onUnlinkCustomer,
  onCreateCustomer,
  onUpdateBlock,
  onDeleteBlock
}: {
  reservation: Reservation | null;
  serviceName: string;
  roomName: string;
  staffName: string;
  customer: Customer | null;
  onClose: () => void;
  onEdit: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation, cancelType: CancelType, cancelReason: string) => void;
  onStatusChange: (reservation: Reservation, status: ReservationStatus) => void;
  expectedSale: number | null;
  onHold: (reservationId: string) => void;
  staff: StaffMember[];
  onNominate: (reservationId: string, staffId: string | null) => void;
  onCheckout: (reservation: Reservation) => void;
  routeTags: MasterTag[];
  options: ServiceOption[];
  customers: Customer[];
  stores: Store[];
  currentStoreId?: string;
  onLinkCustomer: (reservationId: string, customer: Customer) => void;
  onUnlinkCustomer: (reservationId: string) => void;
  onCreateCustomer: (reservationId: string, draft: { name: string; phone: string; gender: CustomerGender }) => void;
  onUpdateBlock: (reservationId: string, patch: { blockType: "break" | "business"; startTime: string; endTime: string }) => void;
  onDeleteBlock: (reservationId: string) => void;
}) {
  const [showCancelPanel, setShowCancelPanel] = useState(false);
  const [cancelType, setCancelType] = useState<Exclude<CancelType, "none">>("cancel");
  const [cancelReason, setCancelReason] = useState("");
  // T067.5-B-2a 顧客検索（表示のみ・customerId書き込みなし）。state は予約ごとに key で初期化される。
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchHomeOnly, setSearchHomeOnly] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  // 新規顧客ミニフォーム（＋新規）。
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGender, setNewGender] = useState<CustomerGender>("unspecified");
  // 休憩/業務ブロック編集用（key で予約ごとに初期化される）。
  const [blockType, setBlockType] = useState<"break" | "business">(reservation?.blockType ?? "break");
  const [blockStart, setBlockStart] = useState(reservation?.startTime ?? "");
  const [blockEnd, setBlockEnd] = useState(reservation?.endTime ?? "");

  const storeName = (homeStoreId?: string) =>
    homeStoreId ? stores.find((store) => store.id === homeStoreId)?.name ?? "未設定" : "未設定";

  const runCustomerSearch = () => {
    const trimmed = searchKeyword.trim();
    if (trimmed.length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchMessage("検索項目を入力してください");
      return;
    }
    if (trimmed.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchMessage("2文字以上で検索してください");
      return;
    }
    const { results, total, isLimited } = searchCustomers(customers, {
      keyword: trimmed,
      homeOnly: searchHomeOnly,
      currentStoreId
    });
    setSearchResults(results);
    setHasSearched(true);
    if (total === 0) {
      setSearchMessage("該当する顧客が見つかりません");
    } else if (isLimited) {
      setSearchMessage(`30件以上ヒットしました（${total}件）。条件を絞ってください`);
    } else {
      setSearchMessage(`${total}件ヒットしました`);
    }
  };

  if (!reservation) {
    return null;
  }

  // 休憩/業務ブロックは専用の編集パネル（顧客/コース/会計は出さない）。
  if (reservation.blockType) {
    const label = reservation.blockType === "break" ? "休憩" : "業務";
    return (
      <div className="fixed inset-0 z-50 flex bg-stone-950/35">
        <section className="relative flex h-full w-full max-w-[400px] flex-col overflow-hidden border-r border-luxas-line bg-white shadow-soft">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-luxas-line px-4 py-3">
            <p className="text-sm font-semibold text-luxas-green">{label}（予約以外）</p>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
              onClick={onClose}
              aria-label="閉じる"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">種別</span>
              <div className="flex gap-2">
                {(["break", "business"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBlockType(t)}
                    className={[
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition",
                      blockType === t ? "border-luxas-green bg-luxas-green text-white" : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
                    ].join(" ")}
                  >
                    {t === "break" ? "休憩" : "業務"}
                  </button>
                ))}
              </div>
            </div>

            <dl className="grid gap-2">
              <DetailRow label="担当スタッフ" value={staffName} />
              <DetailRow label="日付" value={formatDayLabel(reservation.date)} />
            </dl>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="block font-medium text-stone-600">開始時刻</span>
                <input
                  type="time"
                  step={300}
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full rounded-md border border-luxas-line bg-white px-2.5 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                />
              </div>
              <div className="space-y-1.5">
                <span className="block font-medium text-stone-600">終了時刻</span>
                <input
                  type="time"
                  step={300}
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full rounded-md border border-luxas-line bg-white px-2.5 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-400">時刻は5分単位。タイムライン上のドラッグでも移動できます。集計（来店・売上など）には含まれません。</p>
          </div>

          <div className="shrink-0 border-t border-luxas-line bg-luxas-paper px-4 py-3">
            <button
              type="button"
              onClick={() => {
                onUpdateBlock(reservation.id, { blockType, startTime: blockStart, endTime: blockEnd });
                onClose();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Save size={16} aria-hidden="true" />
              保存
            </button>
            <button
              type="button"
              onClick={() => onDeleteBlock(reservation.id)}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <Ban size={16} aria-hidden="true" />
              削除
            </button>
          </div>
        </section>
      </div>
    );
  }

  const isCanceled = reservation.status === "canceled";
  // 予約情報ブロック用の表示補助（既存データの参照のみ・データ変更なし）。
  const bookingTagNames = (reservation.bookingTagIds ?? [])
    .map((id) => routeTags.find((tag) => tag.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const optionNames = (reservation.optionIds ?? [])
    .map((id) => options.find((option) => option.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const preferenceLabel = reservation.preference === "male" ? "男性スタッフ希望" : "希望なし";
  const guestGenderLabel =
    reservation.guestGender === "female" ? "女" : reservation.guestGender === "male" ? "男" : "未設定";

  return (
    // T067.5-B-1: 中央モーダル → 左スライドオーバー（左ドロワー）。タイムライン本体のレイアウトには影響しない。
    <div className="fixed inset-0 z-50 flex bg-stone-950/35">
      <section className="relative flex h-full w-full max-w-[400px] flex-col overflow-hidden border-r border-luxas-line bg-white shadow-soft">
        {/* ヘッダ（タイトル＋閉じる）。固定。 */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-luxas-line px-4 py-3">
          <p className="text-sm font-semibold text-luxas-green">予約詳細</p>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* T067.5-C-2: ヘッダ／フッターは固定し、中央のみスクロール。削除/キャンセル導線は下部固定フッターで常時表示。 */}
        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 1. 顧客検索エリア（最上部・PeakManager風）。検索本体はT067.5-B-2で実装＝現状は準備中。 */}
        <div data-section="customer-search" className="border-b border-luxas-line bg-luxas-paper/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-luxas-ink">顧客検索</span>
            <span className="rounded-full bg-luxas-green/10 px-2 py-0.5 text-[10px] font-medium text-luxas-green">表示のみ</span>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              name="customerSearchKeyword"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runCustomerSearch();
                }
              }}
              placeholder="顧客を検索"
              className="min-w-0 flex-1 rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-xs text-luxas-ink outline-none focus:border-luxas-green"
            />
            <button
              type="button"
              onClick={runCustomerSearch}
              className="inline-flex items-center gap-1 rounded-md border border-luxas-green bg-luxas-mist px-3 py-1.5 text-xs font-semibold text-luxas-green transition hover:bg-luxas-mist/70"
            >
              <Search size={13} aria-hidden="true" />
              検索
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewCustomer((v) => !v);
                if (!newName) setNewName(reservation.customerName && reservation.customerName !== "ゲスト" ? reservation.customerName : "");
                if (!newPhone) setNewPhone(reservation.phone ?? "");
              }}
              title="新規顧客を作成してこの予約に紐づける"
              className="rounded-md border border-luxas-green bg-white px-3 py-1.5 text-xs font-semibold text-luxas-green transition hover:bg-luxas-mist"
            >
              ＋新規
            </button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              name="customerSearchHomeOnly"
              checked={searchHomeOnly}
              onChange={(event) => setSearchHomeOnly(event.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-luxas-green"
            />
            自店のみ（未設定の顧客も含む）
          </label>

          {showNewCustomer ? (
            <div className="mt-2 rounded-md border border-luxas-green/40 bg-white p-3">
              <p className="text-[11px] font-semibold text-luxas-ink">新規顧客を作成して紐づけ</p>
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="氏名（必須）"
                  className="w-full rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-xs text-luxas-ink outline-none focus:border-luxas-green"
                />
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="電話番号（任意）"
                  className="w-full rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-xs text-luxas-ink outline-none focus:border-luxas-green"
                />
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ["male", customerGenderLabels.male],
                    ["female", customerGenderLabels.female],
                    ["unspecified", "未設定"]
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewGender(value)}
                      className={[
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                        newGender === value ? "border-luxas-green bg-luxas-green text-white" : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-paper"
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="rounded-md border border-luxas-line bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-luxas-paper"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    disabled={newName.trim().length === 0}
                    onClick={() => {
                      onCreateCustomer(reservation.id, { name: newName.trim(), phone: newPhone.trim(), gender: newGender });
                      setShowNewCustomer(false);
                      setNewName("");
                      setNewPhone("");
                      setNewGender("unspecified");
                    }}
                    className="rounded-md bg-luxas-green px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    作成して紐づけ
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {searchMessage ? (
            <p className="mt-2 text-[11px] font-medium text-stone-500">{searchMessage}</p>
          ) : null}

          {hasSearched && searchResults.length > 0 ? (
            <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <div className="rounded-md border border-luxas-line bg-white px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-luxas-green/10 px-2 py-0.5 text-[10px] font-semibold text-luxas-green">
                        {result.rank || "—"}
                      </span>
                      <span className="text-sm font-semibold text-luxas-ink">{result.name || "—"}</span>
                      <span className="rounded-full bg-luxas-paper px-2 py-0.5 text-[10px] font-medium text-stone-500">
                        {customerGenderLabels[result.gender]}
                      </span>
                      <button
                        type="button"
                        onClick={() => onLinkCustomer(reservation.id, result)}
                        title="この顧客を予約に紐づける"
                        className="ml-auto rounded-md border border-luxas-green bg-luxas-mist px-2.5 py-0.5 text-[10px] font-semibold text-luxas-green transition hover:bg-luxas-mist/70"
                      >
                        選択
                      </button>
                    </div>
                    <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-stone-600">
                      <div className="flex gap-1"><dt className="text-stone-400">店舗</dt><dd>{storeName(result.homeStoreId)}</dd></div>
                      <div className="flex gap-1"><dt className="text-stone-400">フリガナ</dt><dd>{result.nameKana || "—"}</dd></div>
                      <div className="flex gap-1"><dt className="text-stone-400">TEL</dt><dd>{result.phone || "—"}</dd></div>
                      <div className="flex gap-1"><dt className="text-stone-400">会員番号</dt><dd>{result.membershipNumber || "—"}</dd></div>
                      <div className="flex gap-1">
                        <dt className="text-stone-400">来店</dt>
                        <dd>{Number.isFinite(Number(result.totalVisits)) && result.totalVisits ? `${Number(result.totalVisits)}回` : "0回"}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* 2. 顧客サマリー（検索直下）。customerId優先→電話/氏名fallback の取得結果を表示するだけ。 */}
        <div data-section="customer-summary" className="border-b border-luxas-line px-4 py-3 text-sm">
          {customer ? (
            <div className="rounded-md border border-luxas-line bg-luxas-paper p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-luxas-green/10 px-2 py-0.5 text-[11px] font-semibold text-luxas-green">
                  {customer.rank || "ランク未設定"}
                </span>
                <h3 className="text-sm font-semibold text-luxas-ink">{customer.name || "未入力"}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-stone-500">
                  {customerGenderLabels[customer.gender]}
                </span>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-400">顧客管理と連動</span>
                <button
                  type="button"
                  onClick={() => onUnlinkCustomer(reservation.id)}
                  title="この顧客の紐づけを解除してゲストに戻す"
                  className="rounded-md border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 transition hover:bg-stone-100"
                >
                  解除
                </button>
              </div>
              <p className="mt-1 text-[10px] text-stone-400">別の顧客にする場合は上の「顧客検索」から選び直してください（付け替え）。</p>
              <dl className="mt-2 grid gap-1.5">
                <DetailRow label="フリガナ" value={customer.nameKana || "未入力"} />
                <DetailRow label="会員番号" value={customer.membershipNumber || "—"} />
                <DetailRow label="TEL" value={customer.phone || "未入力"} />
                <DetailRow label="来店回数" value={customer.totalVisits ? `${customer.totalVisits}回` : "—"} />
              </dl>
              {customer.caution || customer.chartMemo ? (
                <p className="mt-2 line-clamp-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-5 text-amber-900">
                  {customer.caution || customer.chartMemo}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-luxas-line bg-luxas-paper p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600">ゲスト予約</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-stone-500">顧客未紐づけ</span>
              </div>
              <dl className="mt-2 grid gap-1.5">
                <DetailRow label="氏名" value={reservation.customerName || "ゲスト"} />
                <DetailRow label="電話番号" value={reservation.phone || "未入力"} />
                <DetailRow label="性別" value={guestGenderLabel} />
              </dl>
              <div className="mt-2 rounded-md border border-dashed border-luxas-line bg-white px-3 py-3 text-center text-[11px] text-stone-400">
                上の「顧客検索」で既存顧客を探し、「選択」で紐づけできます。
              </div>
            </div>
          )}
        </div>

        {/* 3. 操作ボタン群（PeakManager風・2段グリッド）。既存機能は既存コールバックへ接続、無いものは準備中。 */}
        <div data-section="action-buttons" className="grid grid-cols-3 gap-2 border-b border-luxas-line px-4 py-3">
          <Link
            href="/dashboard/customers"
            className="flex flex-col items-center justify-center gap-1 rounded-md border border-luxas-line bg-white px-2 py-2 text-xs font-medium text-luxas-ink transition hover:bg-luxas-paper"
          >
            <UserRound size={16} aria-hidden="true" />
            顧客
          </Link>
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-luxas-line bg-luxas-paper px-2 py-2 text-xs font-medium text-stone-400"
            title="準備中"
          >
            <CreditCard size={16} aria-hidden="true" />
            カード
          </button>
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-luxas-line bg-luxas-paper px-2 py-2 text-xs font-medium text-stone-400"
            title="準備中"
          >
            <DoorOpen size={16} aria-hidden="true" />
            アプリ
          </button>
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-luxas-line bg-luxas-paper px-2 py-2 text-xs font-medium text-stone-400"
            title="準備中"
          >
            <Clock3 size={16} aria-hidden="true" />
            履歴
          </button>
          <button
            type="button"
            onClick={() => onCheckout(reservation)}
            disabled={isCanceled}
            className="flex flex-col items-center justify-center gap-1 rounded-md border border-luxas-green bg-luxas-mist px-2 py-2 text-xs font-semibold text-luxas-green transition hover:bg-luxas-mist/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wallet size={16} aria-hidden="true" />
            {reservation.paymentStatus === "paid" ? "会計修正" : "会計"}
          </button>
          <button
            type="button"
            disabled
            title="準備中（返客機能は未実装。キャンセルは下部のキャンセル操作から）"
            className="flex cursor-not-allowed flex-col items-center justify-center gap-1 rounded-md border border-luxas-line bg-luxas-paper px-2 py-2 text-xs font-medium text-stone-400"
          >
            <Undo2 size={16} aria-hidden="true" />
            返客
          </button>
        </div>

        {/* B. 予約情報ブロック（操作の下に詳細） */}
        <div data-section="reservation-info" className="px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-stone-500">ID: {reservation.id}</span>
            <ReservationStatusPill status={reservation.status} />
            {isCanceled ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                {cancelTypeLabels[reservation.cancelType ?? "cancel"]}
              </span>
            ) : null}
          </div>
          <dl className="mt-3 grid gap-2.5">
            <DetailRow label="日付" value={formatDayLabel(reservation.date)} />
            <DetailRow label="時間" value={`${reservation.startTime} - ${reservation.endTime}`} />
            <DetailRow label="ブース種別" value={roomName} />
            <DetailRow label="担当スタッフ" value={staffName} />
            <DetailRow label="コース" value={serviceName} />
            <DetailRow label="オプション" value={optionNames.length ? optionNames.join("、") : "—"} />
            <DetailRow label="こだわり" value={preferenceLabel} />
            <DetailRow label="予約タグ" value={bookingTagNames.length ? bookingTagNames.join("、") : "—"} />
            <DetailRow label="施術タグ" value="—（未対応）" />
            <DetailRow label="施術コメント" value={reservation.memo || "—"} />
            <DetailRow
              label="会計"
              value={
                reservation.paymentStatus === "paid"
                  ? `会計済${reservation.saleAmount != null ? `（¥${reservation.saleAmount.toLocaleString()}）` : ""}`
                  : "未会計"
              }
            />
            {expectedSale != null ? (
              <DetailRow label="売上見込（割引反映）" value={`¥${expectedSale.toLocaleString()}`} />
            ) : null}
            {reservation.intervalBeforeMinutes || reservation.intervalMinutes ? (
              <DetailRow
                label="インターバル"
                value={`前${reservation.intervalBeforeMinutes ?? 0}分 / 後${reservation.intervalMinutes ?? 0}分`}
              />
            ) : null}
            {isCanceled && reservation.canceledAt ? (
              <DetailRow label="キャンセル日時" value={formatDateTimeLabel(reservation.canceledAt)} />
            ) : null}
            {isCanceled && reservation.cancelReason ? (
              <DetailRow label="キャンセル理由" value={reservation.cancelReason} />
            ) : null}
          </dl>
        </div>

        <div className="border-t border-luxas-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-luxas-ink">指名</span>
            {reservation.nominatedStaffId ? (
              <span className="rounded-full bg-luxas-green/10 px-2 py-0.5 text-xs font-medium text-luxas-green">
                指名あり: {staff.find((item) => item.id === reservation.nominatedStaffId)?.displayName ?? "不明"}
              </span>
            ) : (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">指名なし</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={Boolean(reservation.nominatedStaffId)}
              onClick={() => onNominate(reservation.id, reservation.nominatedStaffId ? null : reservation.staffId)}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
                reservation.nominatedStaffId
                  ? "border-luxas-green bg-luxas-green text-white hover:bg-[#285f51]"
                  : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
              ].join(" ")}
            >
              {reservation.nominatedStaffId
                ? `★ 指名あり（${staff.find((item) => item.id === reservation.nominatedStaffId)?.displayName ?? "現担当"}）— 解除する`
                : "指名なし（押すと現在の担当を指名）"}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            指名予約はタイムラインで担当スタッフを変更できません（時刻の移動は可能です）。
          </p>
        </div>

        {/* ステータス変更（T035）。予約中／完了の切替。キャンセルは下のキャンセル操作で種別・理由を記録。 */}
        <div className="border-t border-luxas-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-luxas-ink">ステータス変更</span>
            {(["booked", "completed"] as ReservationStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={reservation.status === status}
                onClick={() => onStatusChange(reservation, status)}
                className={[
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                  reservation.status === status
                    ? "border-luxas-green bg-luxas-green text-white"
                    : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
                ].join(" ")}
              >
                {reservationStatusLabels[status]}
              </button>
            ))}
            {isCanceled ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                {cancelTypeLabels[reservation.cancelType ?? "cancel"]}（「予約中」で復帰可）
              </span>
            ) : null}
          </div>
        </div>
        </div>

        {showCancelPanel && !isCanceled ? (
          <div className="shrink-0 border-t border-red-100 bg-red-50/60 px-5 py-4">
            <p className="text-sm font-semibold text-red-800">キャンセル種別・理由</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(["cancel", "no_show", "void"] as Exclude<CancelType, "none">[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={cancelType === type}
                  onClick={() => setCancelType(type)}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                    cancelType === type
                      ? "border-red-400 bg-red-600 text-white"
                      : "border-red-200 bg-white text-red-700 hover:bg-red-100"
                  ].join(" ")}
                >
                  {cancelTypeLabels[type]}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="キャンセル理由（任意）"
              className="mt-3 w-full rounded-md border border-red-200 bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-red-400"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-luxas-line bg-white px-4 py-2 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist"
                onClick={() => setShowCancelPanel(false)}
              >
                戻る
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={() => onCancel(reservation, cancelType, cancelReason)}
              >
                <Ban size={16} aria-hidden="true" />
                {cancelTypeLabels[cancelType]}を確定
              </button>
            </div>
          </div>
        ) : null}

        {/* フッター操作（固定・常時表示）。会計/返客/顧客は上部の操作ボタン群に集約済み。
            ここは編集・保留棚・予約キャンセルを常時押せる位置に置く（物理削除はせず既存キャンセル処理に接続）。 */}
        <div className="shrink-0 border-t border-luxas-line bg-luxas-paper px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist"
              onClick={() => onEdit(reservation)}
            >
              <Edit3 size={16} aria-hidden="true" />
              編集
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:text-stone-400"
              onClick={() => { onHold(reservation.id); onClose(); }}
              disabled={isCanceled}
              title="別の日に移動するために一時保管します"
            >
              <BookMarked size={16} aria-hidden="true" />
              保留棚へ
            </button>
          </div>
          <button
            type="button"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-luxas-green bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200"
            onClick={() => { onStatusChange(reservation, "completed"); onClose(); }}
            disabled={isCanceled}
          >
            <Check size={16} aria-hidden="true" />
            完了
          </button>
          <button
            type="button"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-200"
            onClick={() => setShowCancelPanel(true)}
            disabled={isCanceled}
          >
            <Ban size={16} aria-hidden="true" />
            予約をキャンセル / 削除
          </button>
        </div>
      </section>
    </div>
  );
}

// 休憩/業務ブロック登録モーダル（左レールの「休憩/業務」から開く）。種別・担当・開始・所要(分)を指定。
const BLOCK_DURATIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

function BlockFormModal({
  isOpen,
  staff,
  defaultDate,
  defaultTime,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  staff: StaffMember[];
  defaultDate: string;
  defaultTime: string;
  onClose: () => void;
  onSubmit: (draft: { type: "break" | "business"; staffId: string; date: string; startTime: string; durationMinutes: number }) => void;
}) {
  const [type, setType] = useState<"break" | "business">("break");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const [duration, setDuration] = useState(60);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-luxas-line bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-luxas-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">休憩 / 業務の登録</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm">
          <div className="space-y-1.5">
            <span className="block font-medium text-stone-600">種別</span>
            <div className="flex gap-2">
              {(["break", "business"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={[
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition",
                    type === t ? "border-luxas-green bg-luxas-green text-white" : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
                  ].join(" ")}
                >
                  {t === "break" ? "休憩" : "業務"}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="block font-medium text-stone-600">担当スタッフ</span>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            >
              {staff.length === 0 ? <option value="">（出勤スタッフなし）</option> : null}
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.displayName}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 block space-y-1.5">
              <span className="block font-medium text-stone-600">開始時刻</span>
              <input
                type="time"
                step={300}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="block font-medium text-stone-600">所要(分)</span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-md border border-luxas-line bg-white px-2 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              >
                {BLOCK_DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}分</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="block font-medium text-stone-600">日付</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-luxas-line bg-luxas-paper px-5 py-4">
          <button
            type="button"
            className="rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            disabled={!staffId}
            onClick={() => onSubmit({ type, staffId, date, startTime, durationMinutes: duration })}
            className="inline-flex items-center gap-2 rounded-md bg-luxas-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <Save size={16} aria-hidden="true" />
            登録
          </button>
        </div>
      </section>
    </div>
  );
}

// 返客登録モーダル（PM準拠）。選択中予約を「返客 / キャンセル待ち」として登録（＝既存のキャンセル処理に接続）。
const RETURN_REASONS = [
  "スタッフに空きがない",
  "指名スタッフに空きがない",
  "男女希望スタッフに空きがない",
  "ベットに空きがない",
  "商品欠品",
  "時間外",
  "その他"
];

function ReturnModal({
  isOpen,
  editing,
  defaultDate,
  defaultTime,
  services,
  options,
  staff,
  onClose,
  onSubmit,
  onDelete
}: {
  isOpen: boolean;
  editing?: TurnawayRecord | null;
  defaultDate: string;
  defaultTime: string;
  services: ServiceMenu[];
  options: ServiceOption[];
  staff: StaffMember[];
  onClose: () => void;
  onSubmit: (record: Omit<TurnawayRecord, "id" | "storeId" | "createdAt">) => void;
  onDelete?: (id: string) => void;
}) {
  const [date, setDate] = useState(editing?.date ?? defaultDate);
  const [time, setTime] = useState(editing?.startTime ?? defaultTime);
  const [gender, setGender] = useState<"male" | "female" | "">(editing?.gender ?? "");
  const [kind, setKind] = useState<"返客" | "キャンセル待ち">(editing?.kind === "キャンセル待ち" ? "キャンセル待ち" : "返客");
  const [reason, setReason] = useState(editing?.reason ?? "");
  const [comment, setComment] = useState(editing?.comment ?? "");
  const [serviceMenuId, setServiceMenuId] = useState(editing?.serviceMenuId ?? "");
  const [optionIds, setOptionIds] = useState<string[]>(editing?.optionIds ?? []);
  const [courseTab, setCourseTab] = useState("");
  const [preference, setPreference] = useState(editing?.preference ?? "none");
  const [nominatedStaffId, setNominatedStaffId] = useState(editing?.nominatedStaffId ?? "");

  if (!isOpen) {
    return null;
  }

  const courseCategories = Array.from(new Set(services.filter((s) => s.isActive).map((s) => s.category || "未分類")));
  const activeTab = courseTab && courseCategories.includes(courseTab) ? courseTab : courseCategories[0] || "";
  const tabServices = services.filter((s) => s.isActive && (s.category || "未分類") === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-8">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-luxas-line bg-white shadow-soft">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-luxas-line px-5 py-4">
          <div>
            <p className="text-sm font-medium text-luxas-green">{editing ? "返客記録の編集" : "返客登録"}</p>
            <h2 className="mt-1 text-lg font-semibold text-luxas-ink">{editing ? "返客記録を修正" : "受けられなかったお客様を記録"}</h2>
            <p className="mt-1 text-xs text-stone-500">電話・飛び込みで満席等により受付できなかったお客様をカウントします（予約とは別管理）。</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">開始日時</span>
              <div className="flex gap-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green" />
                <input type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} className="w-28 rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green" />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">性別<span className="ml-1 text-red-600">*</span></span>
              <div className="flex gap-2">
                {([["male", "男性"], ["female", "女性"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setGender(v)}
                    className={[
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition",
                      gender === v ? "border-luxas-green bg-luxas-green text-white" : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">種別</span>
              <div className="flex gap-2">
                {(["返客", "キャンセル待ち"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={[
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition",
                      kind === k ? "border-luxas-green bg-luxas-green text-white" : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
                    ].join(" ")}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">返客理由 / キャンセル待ちステータス</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              >
                <option value="">選択してください</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block font-medium text-stone-600">コメント</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-16 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              placeholder="補足があれば入力"
            />
          </div>

          <div className="space-y-2">
            <span className="block font-medium text-stone-600">希望コース（任意）</span>
            <div className="flex flex-wrap gap-1.5">
              {courseCategories.map((category) => {
                const color = categoryColorClass(category);
                const isActive = category === activeTab;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCourseTab(category)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold transition",
                      isActive ? `${color.activeBg} border-transparent text-white` : `bg-white ${color.text} ${color.border} hover:bg-luxas-paper`
                    ].join(" ")}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tabServices.map((service) => {
                const color = categoryColorClass(service.category || "未分類");
                const active = serviceMenuId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceMenuId(active ? "" : service.id)}
                    className={[
                      "rounded-md border px-3 py-1.5 text-left text-xs font-semibold transition",
                      active ? `${color.activeBg} border-transparent text-white` : `bg-white ${color.text} ${color.border} hover:bg-luxas-paper`
                    ].join(" ")}
                  >
                    {service.name}
                  </button>
                );
              })}
              {tabServices.length === 0 ? <p className="text-xs text-stone-500">有効なコースがありません。</p> : null}
            </div>
          </div>

          {options.length > 0 ? (
            <div className="space-y-2">
              <span className="block font-medium text-stone-600">オプション（任意）</span>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                  const on = optionIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOptionIds((prev) => (on ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]))}
                      className={[
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        on ? "border-amber-400 bg-amber-50 text-amber-700" : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-paper"
                      ].join(" ")}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">こだわり</span>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              >
                <option value="none">希望なし</option>
                <option value="male">男性希望</option>
                <option value="female">女性希望</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="block font-medium text-stone-600">指名スタッフ</span>
              <select
                value={nominatedStaffId}
                onChange={(e) => setNominatedStaffId(e.target.value)}
                className="w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              >
                <option value="">指名なし</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.displayName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-luxas-line bg-luxas-paper px-5 py-4">
          {editing && onDelete ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              onClick={() => onDelete(editing.id)}
            >
              <Trash2 size={15} aria-hidden="true" />
              削除
            </button>
          ) : null}
          <button
            type="button"
            className="ml-auto rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist"
            onClick={onClose}
          >
            閉じる
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            onClick={() =>
              onSubmit({
                date,
                startTime: time,
                kind,
                gender,
                reason,
                comment: comment.trim(),
                serviceMenuId: serviceMenuId || undefined,
                optionIds: optionIds.length ? optionIds : undefined,
                preference: preference !== "none" ? preference : undefined,
                nominatedStaffId: nominatedStaffId || undefined
              })
            }
          >
            <Undo2 size={16} aria-hidden="true" />
            {editing ? "更新" : "登録"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ReservationFormModal({
  isOpen,
  mode,
  form,
  formMessage,
  staff,
  services,
  customers,
  routeTags,
  options,
  onChange,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  mode: FormMode | null;
  form: ReservationForm;
  formMessage: StatusMessageValue | null;
  staff: StaffMember[];
  services: ServiceMenu[];
  customers: Customer[];
  routeTags: MasterTag[];
  options: ServiceOption[];
  onChange: (value: ReservationForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  // コース選択のカテゴリタブ（PM風）。選択中コースのカテゴリを既定表示。
  const [courseTab, setCourseTab] = useState<string>("");

  if (!isOpen || !mode) {
    return null;
  }

  const selectedService = services.find((service) => service.id === form.serviceMenuId) ?? null;
  const matchedCustomer = findCustomerForReservationForm(form, customers);
  // 売上見込（T037）。コース＋オプション−割引。
  const pricing = selectedService
    ? computeReservationPricing(
        selectedService.price,
        form.optionIds,
        options,
        Number(form.discountPercent) || 0,
        Number(form.discountYen) || 0,
        Number(form.bulkDiscountPercent) || 0,
        Number(form.bulkDiscountYen) || 0
      )
    : null;
  const currentStaffName = staff.find((item) => item.id === form.staffId)?.displayName ?? "";
  // T067.5-C: タイムラインからの新規予約だけ横長・スクロール不要レイアウトにする（編集モードは従来どおり）。
  // 新規・編集とも PM風コンパクト1画面（保存前要約・割引・連続予約・メモ・予約状態は非表示）。
  const compactForm = true;

  function update<K extends keyof ReservationForm>(key: K, value: ReservationForm[K]) {
    const nextForm: ReservationForm = { ...form, [key]: value };

    if (key === "serviceMenuId" || key === "startTime") {
      const autoEndTime = getAutoEndTime(nextForm.startTime, nextForm.serviceMenuId, services);

      if (autoEndTime) {
        nextForm.endTime = autoEndTime;
      } else if (key === "startTime") {
        const start = timeToMinutes(nextForm.startTime);
        nextForm.endTime = Number.isFinite(start) ? minutesToTime(start + 60) : nextForm.endTime;
      }
    }

    if (key === "serviceMenuId") {
      const nextStaffOptions = getSelectableStaffForService(staff, String(value));

      if (nextStaffOptions.length > 0 && !nextStaffOptions.some((item) => item.id === nextForm.staffId)) {
        nextForm.staffId = nextStaffOptions[0].id;
      }

      // コース選択時に前後インターバルを初期反映（PM §4-1）。
      // メニューに個別設定があれば優先、無ければ既定（施術前5分／施術後10分）。
      const pickedMenu = services.find((s) => s.id === String(value));
      nextForm.intervalBeforeMinutes = String(pickedMenu?.prepMinutes ?? 5);
      nextForm.intervalMinutes = String(pickedMenu?.cleanupMinutes ?? 10);
    }

    onChange(nextForm);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-8">
      <section
        className={[
          "w-full rounded-lg border border-luxas-line bg-white shadow-soft",
          compactForm ? "flex max-h-[92vh] max-w-5xl flex-col overflow-hidden" : "max-h-[92vh] max-w-2xl overflow-y-auto"
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-4 border-b border-luxas-line px-5 py-4">
          <div>
            <p className="text-sm font-medium text-luxas-green">Reservation Form</p>
            <h2 className="mt-1 text-lg font-semibold text-luxas-ink">
              {mode === "create" ? "新規予約" : "予約を編集"}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className={compactForm ? "flex min-h-0 flex-1 flex-col" : ""}
        >
          <div
            className={
              compactForm
                ? "grid min-h-0 flex-1 content-start auto-rows-min gap-x-5 gap-y-3 overflow-y-auto px-4 py-3 lg:grid-cols-3"
                : "space-y-5 px-5 py-5"
            }
          >
          <div className="space-y-4">
          <FormSectionTitle index={1} title="顧客情報" compact={compactForm} />
          <div className={compactForm ? "grid gap-3" : "grid gap-4 md:grid-cols-2"}>
            <FormInput
              label="顧客名"
              value={form.customerName}
              onChange={(value) => update("customerName", value)}
              placeholder="例: 森下 彩（空欄ならゲスト）"
            />
            <FormInput
              label="電話番号"
              value={form.phone}
              onChange={(value) => update("phone", value)}
              placeholder="例: 090-1111-2222（任意）"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-stone-700">性別</span>
            <div className="flex flex-wrap items-center gap-2">
              {([
                ["", "未設定"],
                ["male", customerGenderLabels.male],
                ["female", customerGenderLabels.female],
                ["other", customerGenderLabels.other]
              ] as const).map(([value, label]) => (
                <button
                  key={value || "unset"}
                  type="button"
                  onClick={() => update("guestGender", value)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    form.guestGender === value
                      ? "border-luxas-green bg-luxas-green text-white"
                      : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-paper"
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
            {!compactForm ? (
              <p className="text-[11px] leading-5 text-stone-500">
                お客様本人の性別です（スタッフ指名希望ではありません）。既存顧客に紐づくと顧客マスタの性別が優先されます。
              </p>
            ) : null}
          </div>

          {matchedCustomer ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">顧客の注意事項</p>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-amber-800">
                  顧客管理と連動
                </span>
              </div>
              <p className="mt-1.5 leading-6">
                {matchedCustomer.caution ? matchedCustomer.caution : "注意事項は登録されていません。"}
              </p>
            </section>
          ) : !compactForm ? (
            <section className="rounded-md border border-dashed border-luxas-line bg-luxas-paper px-4 py-3 text-sm text-stone-600">
              顧客名または電話番号が一致すると、注意事項を表示します。
            </section>
          ) : null}
          </div>

          <div className="space-y-3">
          <FormSectionTitle index={2} title="メニュー（コース）" compact={compactForm} />
          {(() => {
            const courseCategories = Array.from(
              new Set(services.filter((s) => s.isActive).map((s) => s.category || "未分類"))
            );
            const selectedCategory = selectedService ? selectedService.category || "未分類" : "";
            const activeTab =
              courseTab && courseCategories.includes(courseTab)
                ? courseTab
                : selectedCategory || courseCategories[0] || "";
            const tabServices = services.filter(
              (s) => s.isActive && (s.category || "未分類") === activeTab
            );
            return (
              <div className="space-y-3">
                {/* カテゴリ色分けタブ（PM準拠・T047） */}
                <div className="flex flex-wrap gap-1.5">
                  {courseCategories.map((category) => {
                    const color = categoryColorClass(category);
                    const isActive = category === activeTab;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCourseTab(category)}
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          isActive
                            ? `${color.activeBg} border-transparent text-white`
                            : `bg-white ${color.text} ${color.border} hover:bg-luxas-paper`
                        ].join(" ")}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
                {/* PM準拠：カテゴリ色のソリッドボタンが折り返すグリッド。選択中はリングで強調。 */}
                <div className="flex flex-wrap gap-1.5">
                  {tabServices.map((service) => {
                    // コース個別色（マスタの color）を反映。未設定はカテゴリ由来色にフォールバック（白回避）。タイムラインカードと同じ配色。
                    const style = menuColorStyle(menuColorKeyFor(service));
                    const active = form.serviceMenuId === service.id;
                    // 選択中の性別に対してメニューが不可なら抑止（PM §4-1 男性可/女性可）。未設定=可。
                    const genderDisallowed =
                      (form.guestGender === "male" && service.maleAllowed === false) ||
                      (form.guestGender === "female" && service.femaleAllowed === false);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        disabled={genderDisallowed && !active}
                        onClick={() => update("serviceMenuId", service.id)}
                        title={
                          genderDisallowed
                            ? `${form.guestGender === "male" ? "男性" : "女性"}は対象外のコースです`
                            : `¥${service.price.toLocaleString()} / ${service.durationMinutes}分`
                        }
                        className={[
                          "rounded-md border px-2.5 py-1.5 text-xs font-bold shadow-sm transition",
                          genderDisallowed && !active
                            ? "cursor-not-allowed border-luxas-line bg-stone-100 text-stone-400 line-through"
                            : active
                              ? `${style.swatch} border-transparent text-white ring-2 ring-luxas-ink ring-offset-1`
                              : `${style.bg} ${style.text} ${style.border} hover:brightness-95`
                        ].join(" ")}
                      >
                        <span>{service.name}</span>
                        <span className={["ml-1 font-medium", active ? "text-white/85" : "opacity-70"].join(" ")}>¥{service.price.toLocaleString()}</span>
                      </button>
                    );
                  })}
                  {tabServices.length === 0 ? (
                    <p className="text-sm text-stone-500">このカテゴリに有効なコースがありません。</p>
                  ) : null}
                </div>
              </div>
            );
          })()}
          </div>

          <div className="space-y-4">
          <FormSectionTitle index={3} title="ブース種別 / 指名" compact={compactForm} />
          <div className={compactForm ? "grid gap-3" : "grid gap-4 md:grid-cols-2"}>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-luxas-ink">ブース種別</span>
              <div className="rounded-md border border-luxas-line bg-luxas-paper px-3 py-2.5 text-sm text-stone-700">
                {selectedService ? (selectedService.requiresPrivateRoom ? "個室" : "施術ブース") : "メニュー選択後に自動で決まります"}
              </div>
              {!compactForm ? (
                <span className="text-xs text-stone-500">ブースは空き状況に応じて自動で割り当てられます（個別指定は不要）。</span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-luxas-ink">指名</span>
              <button
                type="button"
                aria-pressed={Boolean(form.nominatedStaffId)}
                onClick={() => update("nominatedStaffId", form.nominatedStaffId ? "" : form.staffId)}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition",
                  form.nominatedStaffId
                    ? "border-luxas-green bg-luxas-green text-white hover:bg-[#285f51]"
                    : "border-luxas-line bg-white text-stone-700 hover:bg-luxas-paper"
                ].join(" ")}
              >
                {form.nominatedStaffId ? `★ 指名あり${currentStaffName ? `（${currentStaffName}）` : ""}` : "指名なし（押すと指名）"}
              </button>
              {!compactForm ? (
                <span className="text-xs text-stone-500">
                  指名すると現在の担当スタッフで固定され、タイムラインで担当変更できなくなります（時刻移動は可）。
                </span>
              ) : null}
            </div>
          </div>
          </div>

          <div className="space-y-4">
          <FormSectionTitle index={4} title="日時" compact={compactForm} />
          <div className={compactForm ? "grid gap-3" : "grid gap-4 md:grid-cols-3"}>
            <FormInput label="日付" type="date" value={form.date} onChange={(value) => update("date", value)} required />
            <FormInput
              label="開始時刻"
              type="time"
              value={form.startTime}
              onChange={(value) => update("startTime", value)}
              step={300}
              required
            />
            <FormInput
              label="終了時刻"
              type="time"
              value={form.endTime}
              onChange={(value) => update("endTime", value)}
              step={300}
              required
              hint={selectedService ? `${selectedService.durationMinutes}分から自動入力されます` : "メニュー選択後に自動入力されます"}
            />
          </div>
          </div>

          {!compactForm ? (
          <div className="space-y-4">
          <section className="rounded-md border border-luxas-line bg-luxas-paper px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-luxas-ink">保存前の要約</p>
                <p className="mt-1 text-xs text-stone-500">電話中の確認用です。内容がそろっているかを先に見られます。</p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-stone-600">
                {form.status === "booked" ? "予約中" : reservationStatusLabels[form.status]}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <SummaryLine label="顧客名" value={form.customerName || "未入力"} />
              <SummaryLine label="電話番号" value={form.phone || "未入力"} />
              <SummaryLine label="メニュー" value={selectedService?.name ?? "未選択"} />
              <SummaryLine label="担当" value={staff.find((item) => item.id === form.staffId)?.displayName ?? "未選択"} />
              <SummaryLine label="ブース種別" value={selectedService ? (selectedService.requiresPrivateRoom ? "個室" : "施術ブース") : "未選択"} />
              <SummaryLine label="日時" value={form.date ? `${formatDayLabel(form.date)} / ${form.startTime} - ${form.endTime}` : "未入力"} />
            </div>
            <div className="mt-3 rounded-md border border-dashed border-luxas-line bg-white px-3 py-2 text-xs leading-6 text-stone-600">
              {matchedCustomer?.caution
                ? `注意事項: ${matchedCustomer.caution}`
                : "注意事項: 顧客の注意事項は未登録、またはまだ顧客情報が一致していません。"}
            </div>
          </section>
          </div>
          ) : null}

          <div className="space-y-3">
          <FormSectionTitle index={5} title="オプション（PM準拠）" compact={compactForm} />
          <div className="space-y-3 rounded-md border border-luxas-line bg-luxas-paper/40 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-600">こだわり:</span>
              {(["none", "male"] as const).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => update("preference", pref)}
                  className={[
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    form.preference === pref ? "border-luxas-green bg-luxas-green text-white" : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-paper"
                  ].join(" ")}
                >
                  {pref === "none" ? "希望なし" : "男性希望"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <span className="pt-1 text-stone-600">予約タグ:</span>
              <div className="flex flex-wrap gap-1.5">
                {routeTags.length === 0 ? (
                  <span className="text-xs text-stone-400">予約ルートタグ未登録（タグ管理で追加）</span>
                ) : (
                  routeTags.map((tag) => {
                    const on = form.bookingTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          update("bookingTagIds", on ? form.bookingTagIds.filter((id) => id !== tag.id) : [...form.bookingTagIds, tag.id])
                        }
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                          on ? "border-luxas-green bg-luxas-mist text-luxas-green" : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-paper"
                        ].join(" ")}
                      >
                        {tag.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <span className="pt-1 text-stone-600">オプション:</span>
              <div className="flex flex-wrap gap-1.5">
                {options.length === 0 ? (
                  <span className="text-xs text-stone-400">オプション未登録（オプション管理で追加）</span>
                ) : (
                  options.map((opt) => {
                    const on = form.optionIds.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => update("optionIds", on ? form.optionIds.filter((id) => id !== opt.id) : [...form.optionIds, opt.id])}
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                          on ? "border-amber-400 bg-amber-50 text-amber-700" : "border-luxas-line bg-white text-stone-600 hover:bg-luxas-paper"
                        ].join(" ")}
                      >
                        {opt.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            {!compactForm ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-stone-600">個別割引</span>
                <input type="number" min="0" placeholder="%" value={form.discountPercent} onChange={(e) => update("discountPercent", e.target.value)} className="w-16 rounded-md border border-luxas-line bg-white px-2 py-1 text-xs" />
                <input type="number" min="0" placeholder="円" value={form.discountYen} onChange={(e) => update("discountYen", e.target.value)} className="w-20 rounded-md border border-luxas-line bg-white px-2 py-1 text-xs" />
                <span className="text-stone-600">一括割引</span>
                <input type="number" min="0" placeholder="%" value={form.bulkDiscountPercent} onChange={(e) => update("bulkDiscountPercent", e.target.value)} className="w-16 rounded-md border border-luxas-line bg-white px-2 py-1 text-xs" />
                <input type="number" min="0" placeholder="円" value={form.bulkDiscountYen} onChange={(e) => update("bulkDiscountYen", e.target.value)} className="w-20 rounded-md border border-luxas-line bg-white px-2 py-1 text-xs" />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-600">インターバル</span>
              <span className="text-xs text-stone-500">施術前</span>
              <input type="number" min="0" step="5" placeholder="分" value={form.intervalBeforeMinutes} onChange={(e) => update("intervalBeforeMinutes", e.target.value)} className="w-20 rounded-md border border-luxas-line bg-white px-2 py-1 text-xs" />
              <span className="text-xs text-stone-500">施術後</span>
              <input type="number" min="0" step="5" placeholder="分" value={form.intervalMinutes} onChange={(e) => update("intervalMinutes", e.target.value)} className="w-20 rounded-md border border-luxas-line bg-white px-2 py-1 text-xs" />
              {!compactForm ? (
                <span className="text-xs text-stone-400">前後に空ける時間（同一担当の占有・重複判定に加算）</span>
              ) : null}
            </div>
            {!compactForm ? (
              <label className="flex w-fit items-center gap-2 text-stone-700">
                <input type="checkbox" className="h-4 w-4 accent-luxas-green" checked={form.isConsecutive} onChange={(e) => update("isConsecutive", e.target.checked)} />
                連続予約（保存後に同じ顧客で次の枠を続けて作成）
              </label>
            ) : null}
            {!compactForm && pricing ? (
              <div className="rounded-md border border-luxas-line bg-white px-3 py-2 text-xs text-stone-600">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>コース ¥{pricing.coursePrice.toLocaleString()}</span>
                  <span>オプション ¥{pricing.optionsTotal.toLocaleString()}</span>
                  <span>小計 ¥{pricing.subtotal.toLocaleString()}</span>
                  <span>割引 −¥{pricing.discountTotal.toLocaleString()}</span>
                  <span className="font-semibold text-luxas-ink">売上見込 ¥{pricing.net.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-[11px] text-stone-400">※ 割引の％は小計に対して計算（四捨五入）。会計時に上書き可能。</p>
              </div>
            ) : null}
          </div>
          </div>

          {/* 施術コメント（独立セクション・オプションの右側に配置）。顧客に紐づく予約のコメントとして保存。 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FormSectionTitle index={6} title="施術コメント" compact={compactForm} />
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-500">
                {matchedCustomer ? `${matchedCustomer.name} 様に紐づけ` : "顧客に紐づけ"}
              </span>
            </div>
            <textarea
              value={form.memo}
              onChange={(e) => update("memo", e.target.value)}
              placeholder="施術内容・申し送りなど"
              className="min-h-28 w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          </div>

          {!compactForm ? (
          <div className="space-y-4">
          <FormSectionTitle index={7} title="施術コメント / メモ" />
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
              メモ
              <span className="rounded-full bg-luxas-paper px-2 py-0.5 text-[11px] font-medium text-stone-500">任意</span>
            </span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
              value={form.memo}
              onChange={(event) => update("memo", event.target.value)}
              placeholder="受付時の共有事項"
            />
          </label>

          <div className="rounded-md border border-luxas-line bg-white px-4 py-3">
            <FormSelect label="予約状態" value={form.status} onChange={(value) => update("status", value as ReservationStatus)}>
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>
          </div>
          </div>
          ) : null}
          </div>

          {/* T067.5-C: 新規予約は固定フッターで保存ボタンを常時表示（スクロール不要）。編集は従来の末尾配置。 */}
          <div className={compactForm ? "border-t border-luxas-line bg-white px-5 py-4" : "px-5 pb-5"}>
            <StatusMessage message={formMessage} />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist"
              onClick={onClose}
            >
              閉じる
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Save size={16} aria-hidden="true" />
              保存
            </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
  step
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "time";
  required?: boolean;
  hint?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
        {label}
        {required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">必須</span> : null}
      </span>
      <input
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        required={required}
      />
      {hint ? <p className="mt-1.5 text-xs text-stone-500">{hint}</p> : null}
    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  required = false,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
        {label}
        {required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">必須</span> : null}
      </span>
      <select
        className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition focus:border-luxas-green"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        {children}
      </select>
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 rounded-md border border-luxas-line bg-white px-3 py-2">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-luxas-ink">{value}</dd>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-luxas-line bg-white px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-medium text-luxas-ink">{value}</p>
    </div>
  );
}

function FormSectionTitle({ index, title, compact = false }: { index: number; title: string; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <span
        className={[
          "inline-flex items-center justify-center rounded-full bg-luxas-mist font-semibold text-luxas-green",
          compact ? "h-5 w-5 text-xs" : "h-7 w-7 text-sm"
        ].join(" ")}
      >
        {index}
      </span>
      <p className="text-sm font-semibold text-luxas-ink">{title}</p>
    </div>
  );
}

function findCustomerForReservationForm(form: ReservationForm, customers: Customer[]) {
  const phone = normalizeText(form.phone);
  const customerName = normalizeText(form.customerName);

  return (
    customers.find((customer) => phone.length > 0 && normalizeText(customer.phone) === phone) ??
    customers.find((customer) => customerName.length > 0 && normalizeText(customer.name) === customerName) ??
    null
  );
}

function getAutoEndTime(startTime: string, serviceMenuId: string, serviceList: ServiceMenu[]) {
  if (isBlank(startTime) || isBlank(serviceMenuId)) {
    return null;
  }

  const start = timeToMinutes(startTime);
  if (!Number.isFinite(start)) {
    return null;
  }

  const selectedService = serviceList.find((service) => service.id === serviceMenuId);

  if (!selectedService) {
    return null;
  }

  return minutesToTime(start + selectedService.durationMinutes);
}

function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

// ISO日時を「YYYY/MM/DD HH:mm」で表示（T035 キャンセル日時）。不正値はそのまま返す。
function formatDateTimeLabel(value: string) {
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
