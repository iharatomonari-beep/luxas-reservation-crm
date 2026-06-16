"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { SelectField } from "@/features/master-data/form-controls";
import { initialShifts, initialStaff, shiftsStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import { MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { StaffMember, StaffShift } from "@/features/master-data/types";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { useCurrentStore } from "@/features/org/use-current-store";
import { stampCreate } from "@/features/master-data/timestamps";

// 曜日: 0=日,1=月,...6=土。UIは月→日の順で並べる。
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABEL: Record<number, string> = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土"
};

type DayPattern = { enabled: boolean; start: string; end: string };
type WeeklyPattern = Record<number, DayPattern>;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toYmd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function weekdayOf(workDate: string) {
  const date = new Date(`${workDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? -1 : date.getDay();
}

function makeDefaultPattern(): WeeklyPattern {
  const pattern: WeeklyPattern = {};
  for (let day = 0; day <= 6; day += 1) {
    pattern[day] = { enabled: day >= 1 && day <= 5, start: "10:00", end: "19:00" };
  }
  return pattern;
}

export function ShiftManager() {
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [shifts, setShifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const { currentStoreId } = useCurrentStore();
  const activeStaff = useMemo(() => staff.filter((item) => item.isActive), [staff]);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(activeStaff[0]?.id ?? "");
  const [pattern, setPattern] = useState<WeeklyPattern>(makeDefaultPattern());
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  // 選択スタッフが無効になったら先頭へ。
  useEffect(() => {
    if (activeStaff.length === 0) {
      return;
    }
    if (!activeStaff.some((item) => item.id === selectedStaffId)) {
      setSelectedStaffId(activeStaff[0].id);
    }
  }, [activeStaff, selectedStaffId]);

  // 既存シフト（今日以降）から週次パターンを復元する。週次パターン型は新設せず、シフトから推定する方式。
  useEffect(() => {
    if (!selectedStaffId) {
      return;
    }
    const todayStr = toYmd(new Date());
    const next = makeDefaultPattern();
    for (let day = 0; day <= 6; day += 1) {
      next[day] = { ...next[day], enabled: false };
    }
    for (const shift of shifts) {
      if (shift.staffId !== selectedStaffId || shift.workDate < todayStr || (shift.isActive ?? true) === false) {
        continue;
      }
      const wd = weekdayOf(shift.workDate);
      if (wd < 0) {
        continue;
      }
      // その曜日の代表として最初に見つかった勤務時間を採用。
      if (!next[wd].enabled) {
        next[wd] = { enabled: true, start: shift.startTime, end: shift.endTime };
      }
    }
    setPattern(next);
    setMessage(null);
  }, [selectedStaffId, shifts]);

  function updateDay(day: number, patch: Partial<DayPattern>) {
    setPattern((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  }

  function validate(): string | null {
    if (!selectedStaffId) {
      return "スタッフを選択してください。";
    }
    const enabledDays = WEEKDAY_ORDER.filter((day) => pattern[day].enabled);
    if (enabledDays.length === 0) {
      return "少なくとも1つの曜日を出勤にしてください。";
    }
    for (const day of enabledDays) {
      const { start, end } = pattern[day];
      if (!timePattern.test(start) || !timePattern.test(end)) {
        return `${WEEKDAY_LABEL[day]}曜の時刻は HH:mm 形式で入力してください。`;
      }
      if (end <= start) {
        return `${WEEKDAY_LABEL[day]}曜の終了時刻は開始時刻より後にしてください。`;
      }
    }
    return null;
  }

  function generateForRange() {
    const error = validate();
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 2);
    const startStr = toYmd(start);
    const endStr = toYmd(end);

    const generated: StaffShift[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const wd = cursor.getDay();
      const day = pattern[wd];
      if (day.enabled) {
        const dateStr = toYmd(cursor);
        generated.push(stampCreate({
          id: `shift-${selectedStaffId}-${dateStr.replace(/-/g, "")}`,
          staffId: selectedStaffId,
          workDate: dateStr,
          startTime: day.start,
          endTime: day.end,
          breakStart: "",
          breakEnd: "",
          memo: "",
          isActive: true,
          // 新規生成シフトに現在店舗を付与（T064）。既存シフトへの一括付与はしない。
          storeId: currentStoreId
        }));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // 対象スタッフの期間内（今日〜2ヶ月後）を全上書き。期間外・他スタッフは保持。
    setShifts((current) => {
      const kept = current.filter(
        (shift) =>
          !(shift.staffId === selectedStaffId && shift.workDate >= startStr && shift.workDate <= endStr)
      );
      return [...kept, ...generated];
    });

    setMessage({
      type: "success",
      text: `${startStr}〜${endStr} のシフトを${generated.length}件作成しました（期間内を上書き）。`
    });
  }

  const selectedStaffShiftCount = useMemo(() => {
    const todayStr = toYmd(new Date());
    return shifts.filter((shift) => shift.staffId === selectedStaffId && shift.workDate >= todayStr).length;
  }, [shifts, selectedStaffId]);

  return (
    <MasterPage
      title="シフト管理"
      description="スタッフごとに曜日別の出勤と勤務時間を設定し、今日から2ヶ月分のシフトを生成します（期間内は上書き）。予約台帳の可否判定に使います。"
    >
      <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-luxas-ink">曜日別シフトパターン</h2>

          <SelectField label="スタッフ" value={selectedStaffId} onChange={(value) => setSelectedStaffId(value)}>
            {activeStaff.length === 0 ? (
              <option value="">有効なスタッフがありません</option>
            ) : (
              activeStaff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))
            )}
          </SelectField>

          <div className="mt-4 space-y-2">
            {WEEKDAY_ORDER.map((day) => {
              const value = pattern[day];
              const isWeekend = day === 0 || day === 6;
              return (
                <div
                  key={day}
                  className="flex items-center gap-3 rounded-md border border-luxas-line bg-white px-3 py-2"
                >
                  <label className="flex w-16 shrink-0 items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-luxas-green"
                      checked={value.enabled}
                      onChange={(event) => updateDay(day, { enabled: event.target.checked })}
                    />
                    <span className={["text-sm font-semibold", isWeekend ? "text-luxas-green" : "text-luxas-ink"].join(" ")}>
                      {WEEKDAY_LABEL[day]}
                    </span>
                  </label>
                  <input
                    type="time"
                    step={300}
                    className="w-full rounded-md border border-luxas-line bg-white px-2 py-1.5 text-sm text-luxas-ink outline-none transition focus:border-luxas-green disabled:bg-stone-100 disabled:text-stone-400"
                    value={value.start}
                    disabled={!value.enabled}
                    onChange={(event) => updateDay(day, { start: event.target.value })}
                  />
                  <span className="text-stone-400">-</span>
                  <input
                    type="time"
                    step={300}
                    className="w-full rounded-md border border-luxas-line bg-white px-2 py-1.5 text-sm text-luxas-ink outline-none transition focus:border-luxas-green disabled:bg-stone-100 disabled:text-stone-400"
                    value={value.end}
                    disabled={!value.enabled}
                    onChange={(event) => updateDay(day, { end: event.target.value })}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <StatusMessage message={message} />
          </div>

          <button
            type="button"
            onClick={generateForRange}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
          >
            <CalendarRange size={17} aria-hidden="true" />
            今日から2ヶ月分を作成
          </button>
          <p className="mt-2 text-xs text-stone-500">
            作成すると、このスタッフの今日〜2ヶ月後のシフトはこのパターンで置き換わります（他スタッフ・期間外は変更しません）。
          </p>
        </section>

        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <h2 className="text-base font-semibold text-luxas-ink">現在のシフト（今日以降）</h2>
          <p className="mt-1 text-sm text-stone-500">
            選択中スタッフの今日以降のシフト: {selectedStaffShiftCount}件 / 全{shifts.length}件
          </p>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            曜日のチェックを入れて勤務時間を設定し、「今日から2ヶ月分を作成」を押すと、per-date のシフトが生成されて予約台帳に反映されます。
            既存のパターンは現在のシフトから自動復元されます。
          </p>
          <p className="mt-3 text-xs text-stone-500">休憩は設定しません（休憩なし運用）。</p>
        </section>
      </div>
    </MasterPage>
  );
}
