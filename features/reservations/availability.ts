// オンライン予約の空き枠計算（公開予約ページと内部の可否判定で共用できる純粋関数群）。
// hooks を使わないので、呼び出し側で localStorage から読んだ配列をそのまま渡せる。

import type { ServiceMenu, ServiceRoom, StaffMember, StaffShift } from "@/features/master-data/types";
import type { Reservation } from "@/features/reservations/types";
import { hasBoothCapacity } from "@/features/master-data/mock-data";
import { filterShiftsByStore } from "@/features/master-data/store-staff-scope";
import { isMenuInStore } from "@/features/master-data/store-menu-scope";
import type { OnlineBlock } from "@/features/store-ops/online-blocks";
import { minutesToTime, normalizeDateInputValue, normalizeTimeInputValue, timeToMinutes } from "@/features/reservations/date-utils";

// メニューが指定日時に提供可能か（曜日・時間帯・適用期間の限定。未設定は制限なし）。
// reservation-ledger.tsx の同名ローカル関数と同一ロジックを共有化したもの。
export function isMenuAvailableForDateTime(menu: ServiceMenu, date: string, startTime: string): boolean {
  const normalizedDate = normalizeDateInputValue(date);
  if (!normalizedDate) {
    return true;
  }
  if (menu.startDate && normalizedDate < menu.startDate) return false;
  if (menu.endDate && normalizedDate > menu.endDate) return false;

  if (menu.availableDays && menu.availableDays.length > 0) {
    const dow = new Date(`${normalizedDate}T00:00:00`).getDay();
    if (!menu.availableDays.includes(dow)) return false;
  }

  const normalizedStart = normalizeTimeInputValue(startTime);
  if (normalizedStart) {
    const startMin = timeToMinutes(normalizedStart);
    const from = menu.availableTimeStart ? timeToMinutes(menu.availableTimeStart) : null;
    const to = menu.availableTimeEnd ? timeToMinutes(menu.availableTimeEnd) : null;
    if (from != null && Number.isFinite(from) && startMin < from) return false;
    if (to != null && Number.isFinite(to) && startMin > to) return false;
  }
  return true;
}

// 指定スタッフのその日のシフトに、予約時間が収まり休憩と重ならないか。
// reservation-ledger.tsx の findShiftForReservation と同一ロジックを共有化したもの。
export type ShiftStatus =
  | { kind: "ok"; label: string; shift: StaffShift }
  | { kind: "missing"; label: string }
  | { kind: "outside"; label: string }
  | { kind: "break"; label: string };

export function findStaffShiftStatus(params: {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  shifts: StaffShift[];
}): ShiftStatus {
  const { staffId, date, startTime, endTime, shifts } = params;
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
    if (!Number.isFinite(shiftStart) || !Number.isFinite(shiftEnd)) continue;
    if (start < shiftStart || end > shiftEnd) continue;

    const breakStart = timeToMinutes(shift.breakStart);
    const breakEnd = timeToMinutes(shift.breakEnd);
    if (Number.isFinite(breakStart) && Number.isFinite(breakEnd) && start < breakEnd && breakStart < end) {
      return { kind: "break", label: `休憩 ${shift.breakStart}-${shift.breakEnd}` };
    }
    return { kind: "ok", label: `${shift.startTime}-${shift.endTime}`, shift };
  }
  return { kind: "outside", label: candidateShifts.map((s) => `${s.startTime}-${s.endTime}`).join(" / ") };
}

// 公開オンライン予約で出すメニュー（当該店舗で提供＋オンライン掲載＋有効）。
export function onlineMenusForStore(services: ServiceMenu[], storeId: string): ServiceMenu[] {
  return services.filter((m) => m.isActive && m.onlineBooking === true && isMenuInStore(m, storeId));
}

// 指定スタッフがその日に出勤予定か（有効なシフトが1件以上あるか）。
// オンライン予約の指名候補を「その日に出勤しているスタッフ」だけに絞るのに使う。
export function isStaffWorkingOnDate(staffId: string, date: string, shifts: StaffShift[]): boolean {
  const normalizedDate = normalizeDateInputValue(date);
  if (!normalizedDate) return false;
  return shifts.some((s) => s.staffId === staffId && s.workDate === normalizedDate && (s.isActive ?? true));
}

// 指定スタッフが、その時間帯に既存予約と重なっていないか。
function staffHasReservationConflict(staffId: string, date: string, start: number, end: number, reservations: Reservation[]): boolean {
  return reservations.some((r) => {
    if (r.staffId !== staffId) return false;
    if (r.date !== date) return false;
    if (r.status === "canceled") return false;
    const rs = timeToMinutes(r.startTime);
    const re = timeToMinutes(r.endTime);
    if (!Number.isFinite(rs) || !Number.isFinite(re)) return false;
    return start < re && rs < end;
  });
}

// オンライン予約停止枠（同日・時間重複）に当たるか。
function isWithinOnlineBlock(date: string, start: number, end: number, blocks: OnlineBlock[]): boolean {
  return blocks.some((b) => {
    if (b.date !== date) return false;
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    if (!Number.isFinite(bs) || !Number.isFinite(be)) return false;
    return start < be && bs < end;
  });
}

export type OpenSlot = { time: string; staffIds: string[] };

// 指定店舗・日付・メニューで予約可能な開始時刻リストを返す。
// 各時刻について: メニュー限定OK / 停止枠外 / 担当（指名 or 出勤者）がシフト内かつ予約重複なし / ブース空きあり。
export function getOpenStartTimes(params: {
  storeId: string;
  date: string;
  menu: ServiceMenu;
  staff: StaffMember[];
  shifts: StaffShift[];
  reservations: Reservation[];
  services: ServiceMenu[];
  rooms: ServiceRoom[];
  onlineBlocks: OnlineBlock[];
  businessStartTime: string;
  businessEndTime: string;
  nominatedStaffId?: string;
  stepMinutes?: number;
}): OpenSlot[] {
  const {
    storeId, date, menu, staff, shifts, reservations, services, rooms, onlineBlocks,
    businessStartTime, businessEndTime, nominatedStaffId, stepMinutes = 30
  } = params;

  const normalizedDate = normalizeDateInputValue(date);
  if (!normalizedDate) return [];

  const open = timeToMinutes(businessStartTime);
  const close = timeToMinutes(businessEndTime);
  const duration = menu.durationMinutes;
  if (!Number.isFinite(open) || !Number.isFinite(close) || !(duration > 0)) return [];

  // 当該店舗のシフト・予約に絞る。
  const storeShifts = filterShiftsByStore(shifts, storeId);
  const storeReservations = reservations.filter((r) => (r.storeId ?? "store-shibuya") === storeId);
  // 候補スタッフ: 指名ありはその人のみ。無指名は有効スタッフ全員（シフト判定で出勤者に絞られる）。
  const candidateStaff = nominatedStaffId
    ? staff.filter((s) => s.id === nominatedStaffId)
    : staff.filter((s) => s.isActive);

  const slots: OpenSlot[] = [];
  for (let t = open; t + duration <= close; t += stepMinutes) {
    const startTime = minutesToTime(t);
    const endTime = minutesToTime(t + duration);
    const end = t + duration;

    if (!isMenuAvailableForDateTime(menu, normalizedDate, startTime)) continue;
    if (isWithinOnlineBlock(normalizedDate, t, end, onlineBlocks)) continue;

    // この時刻に対応できるスタッフ（シフトOK＆予約重複なし）。
    const okStaffIds = candidateStaff
      .filter((s) => findStaffShiftStatus({ staffId: s.id, date: normalizedDate, startTime, endTime, shifts: storeShifts }).kind === "ok")
      .filter((s) => !staffHasReservationConflict(s.id, normalizedDate, t, end, storeReservations))
      .map((s) => s.id);

    if (okStaffIds.length === 0) continue;

    // ブース（個室/施術台）の同時稼働上限に空きがあるか。
    const boothOk = hasBoothCapacity({
      date: normalizedDate,
      startTime,
      endTime,
      serviceMenuId: menu.id,
      currentReservations: storeReservations,
      services,
      rooms,
      intervalMinutes: menu.cleanupMinutes ?? 0
    });
    if (!boothOk) continue;

    slots.push({ time: startTime, staffIds: okStaffIds });
  }
  return slots;
}

// 無指名予約で自動割当するスタッフを選ぶ（staff の並び順＝表示順で先頭の対応可能者）。
export function pickAutoStaff(staff: StaffMember[], okStaffIds: string[]): string | null {
  const set = new Set(okStaffIds);
  const found = staff.find((s) => set.has(s.id));
  return found ? found.id : null;
}
