"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MasterPage } from "@/features/master-data/master-page";
import {
  initialShifts,
  initialStaff,
  shiftsStorageKey,
  staffStorageKey
} from "@/features/master-data/mock-data";
import type { StaffMember, StaffShift } from "@/features/master-data/types";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { useCurrentStore } from "@/features/org/use-current-store";
import { isRecordInStore } from "@/features/master-data/store-record-scope";
import { isShiftInStore, isStaffHomeStore } from "@/features/master-data/store-staff-scope";
import { stampCreate, stampUpdate } from "@/features/master-data/timestamps";

export const dailyTargetsStorageKey = "luxas-daily-targets";

type DailyTarget = { date: string; amount: number; comment: string; storeId?: string };

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// 安定参照の空配列（インライン [] は毎レンダー新参照→無限ループの原因になる）。
const EMPTY_TARGETS: DailyTarget[] = [];

export function MonthlyShiftGrid() {
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [shifts, setShifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const [targets, setTargets] = useLocalCollection<DailyTarget>(dailyTargetsStorageKey, EMPTY_TARGETS);
  const { currentStoreId } = useCurrentStore();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  // 現在店舗にシフトを持つスタッフID（ヘルプ勤務＝他店所属でも応援シフトがあれば表示・編集できるように）。
  const staffIdsWithShiftHere = useMemo(
    () => new Set(shifts.filter((s) => isShiftInStore(s, currentStoreId)).map((s) => s.staffId)),
    [shifts, currentStoreId]
  );
  // 表示対象＝現在店舗の所属スタッフ ＋ 現在店舗に応援シフトを持つスタッフ（未設定の既存は既定店舗扱い）。
  const activeStaff = useMemo(
    () => staff.filter((s) => s.isActive && (isStaffHomeStore(s, currentStoreId) || staffIdsWithShiftHere.has(s.id))),
    [staff, currentStoreId, staffIdsWithShiftHere]
  );

  const dates = useMemo(() => {
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const dateStr = `${year}-${pad2(month + 1)}-${pad2(i + 1)}`;
      const dow = new Date(year, month, i + 1).getDay();
      return { dateStr, day: i + 1, dow };
    });
  }, [year, month]);

  // 検索/削除/更新はすべて現在店舗のシフトに限定する（他店の同一スタッフ・同日シフトを巻き込まない）。
  function isThisCell(s: StaffShift, staffId: string, dateStr: string) {
    return s.staffId === staffId && s.workDate === dateStr && isShiftInStore(s, currentStoreId);
  }

  function shiftFor(staffId: string, dateStr: string) {
    return shifts.find((s) => isThisCell(s, staffId, dateStr)) ?? null;
  }

  function toggleShift(staffId: string, dateStr: string, enabled: boolean) {
    setShifts((current) => {
      // 現在店舗の当該セルだけを除去し、他店のシフトは温存する。
      const others = current.filter((s) => !isThisCell(s, staffId, dateStr));
      if (!enabled) {
        return others;
      }
      const existing = current.find((s) => isThisCell(s, staffId, dateStr));
      return [
        ...others,
        existing ?? stampCreate({
          // ID に店舗を含め、店舗間のID衝突を防ぐ。
          id: `shift-${currentStoreId}-${staffId}-${dateStr.replace(/-/g, "")}`,
          staffId,
          workDate: dateStr,
          startTime: "10:00",
          endTime: "19:00",
          breakStart: "",
          breakEnd: "",
          memo: "",
          isActive: true,
          // 新規シフトに現在店舗を付与（T064）。既存シフトには一括付与しない。
          storeId: currentStoreId
        })
      ];
    });
  }

  function updateShiftTime(staffId: string, dateStr: string, field: "startTime" | "endTime", value: string) {
    setShifts((current) =>
      current.map((s) => (isThisCell(s, staffId, dateStr) ? stampUpdate({ ...s, [field]: value }, s) : s))
    );
  }

  // 日次目標は店舗ごとに保持する。現在店舗のレコード（未設定の既存データは既定店舗扱い）だけを対象にする。
  function targetFor(dateStr: string) {
    return targets.find((t) => t.date === dateStr && isRecordInStore(t, currentStoreId)) ?? null;
  }

  function updateTarget(dateStr: string, patch: Partial<DailyTarget>) {
    setTargets((current) => {
      const existing = current.find((t) => t.date === dateStr && isRecordInStore(t, currentStoreId));
      if (existing) {
        return current.map((t) => (t === existing ? { ...t, ...patch } : t));
      }
      return [...current, { date: dateStr, amount: 0, comment: "", storeId: currentStoreId, ...patch }];
    });
  }

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <MasterPage
      title="月間シフト・目標"
      description="日付ごとに各スタッフの出勤と勤務時間、日次目標を編集します。曜日別パターン（シフト管理）で作ったシフトもここで微調整できます。保存は即時です。"
    >
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="inline-flex items-center gap-1 rounded-md border border-luxas-line bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-luxas-paper"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          前月
        </button>
        <span className="text-base font-semibold text-luxas-ink">
          {year}年{month + 1}月
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="inline-flex items-center gap-1 rounded-md border border-luxas-line bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-luxas-paper"
        >
          翌月
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-luxas-line bg-white">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="bg-luxas-paper text-[11px] font-semibold text-stone-500">
            <tr>
              <th className="sticky left-0 z-10 border-b border-luxas-line bg-luxas-paper px-2 py-2">日付</th>
              <th className="border-b border-luxas-line px-2 py-2">日次目標(¥)</th>
              <th className="border-b border-luxas-line px-2 py-2">目標コメント</th>
              {activeStaff.map((s) => (
                <th key={s.id} className="border-b border-l border-luxas-line px-2 py-2 text-center">
                  {s.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-luxas-line">
            {dates.map(({ dateStr, day, dow }) => {
              const isWeekend = dow === 0 || dow === 6;
              const target = targetFor(dateStr);
              return (
                <tr key={dateStr} className={isWeekend ? "bg-luxas-paper/40" : ""}>
                  <td className="sticky left-0 z-10 whitespace-nowrap border-r border-luxas-line bg-inherit px-2 py-1.5 font-medium text-luxas-ink">
                    {month + 1}/{day}
                    <span className={["ml-1", dow === 0 ? "text-rose-500" : dow === 6 ? "text-sky-500" : "text-stone-400"].join(" ")}>
                      ({WEEKDAY[dow]})
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={target?.amount ?? 0}
                      onChange={(event) => updateTarget(dateStr, { amount: Number(event.target.value) })}
                      className="w-24 rounded border border-luxas-line bg-white px-1.5 py-1 text-xs outline-none focus:border-luxas-green"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={target?.comment ?? ""}
                      onChange={(event) => updateTarget(dateStr, { comment: event.target.value })}
                      placeholder="—"
                      className="w-32 rounded border border-luxas-line bg-white px-1.5 py-1 text-xs outline-none focus:border-luxas-green"
                    />
                  </td>
                  {activeStaff.map((s) => {
                    const shift = shiftFor(s.id, dateStr);
                    const on = Boolean(shift);
                    return (
                      <td key={s.id} className="border-l border-luxas-line px-1.5 py-1.5 align-top">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-luxas-green"
                            checked={on}
                            onChange={(event) => toggleShift(s.id, dateStr, event.target.checked)}
                          />
                          {on ? (
                            <div className="flex flex-col gap-0.5">
                              <input
                                type="time"
                                step={300}
                                value={shift?.startTime ?? "10:00"}
                                onChange={(event) => updateShiftTime(s.id, dateStr, "startTime", event.target.value)}
                                className="w-[5.5rem] rounded border border-luxas-line bg-white px-1 py-0.5 text-[11px] outline-none focus:border-luxas-green"
                              />
                              <input
                                type="time"
                                step={300}
                                value={shift?.endTime ?? "19:00"}
                                onChange={(event) => updateShiftTime(s.id, dateStr, "endTime", event.target.value)}
                                className="w-[5.5rem] rounded border border-luxas-line bg-white px-1 py-0.5 text-[11px] outline-none focus:border-luxas-green"
                              />
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-500">※ チェックで出勤、時刻はその場で編集・即保存。日次目標は別キー（{dailyTargetsStorageKey}）に保存します。</p>
    </MasterPage>
  );
}
