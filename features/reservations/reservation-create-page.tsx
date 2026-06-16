"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Save, ChevronLeft } from "lucide-react";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import type { Customer } from "@/features/customers/types";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { useCurrentStore } from "@/features/org/use-current-store";
import { filterShiftsByStore } from "@/features/master-data/store-staff-scope";
import { filterMenusByStore } from "@/features/master-data/store-menu-scope";
import {
  hasBoothCapacity,
  initialRooms,
  initialServices,
  initialShifts,
  initialStaff,
  shiftsStorageKey,
  roomsStorageKey,
  servicesStorageKey,
  staffStorageKey
} from "@/features/master-data/mock-data";
import { initialStoreSettings } from "@/features/master-data/store-settings";
import type { ServiceMenu, ServiceRoom, StaffMember, StaffShift } from "@/features/master-data/types";
import { isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import {
  formatDayLabel,
  minutesToTime,
  normalizeDateInputValue,
  normalizeTimeInputValue,
  timeToMinutes
} from "@/features/reservations/date-utils";
import {
  initialReservations,
  reservationLedgerDateStorageKey,
  reservationLedgerUpdateStorageKey,
  reservationsStorageKey
} from "@/features/reservations/mock-data";
import { reservationStatusLabels, type Reservation, type ReservationStatus } from "@/features/reservations/types";
import { compareBySortOrder } from "@/features/master-data/utils";

const reservationTimeStepMinutes = 5;

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
};

type ReservationCreatePrefill = {
  staffId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  serviceMenuId?: string;
  customerName?: string;
  phone?: string;
};

type ReservationCreatePageProps = {
  initialPrefill: ReservationCreatePrefill;
};

type NormalizedReservationCreatePrefill = {
  staffId: string;
  roomId: string;
  date: string;
  startTime: string;
  serviceMenuId: string;
  customerName: string;
  phone: string;
};

export function ReservationCreatePage({ initialPrefill }: ReservationCreatePageProps) {
  const isDebugMode = process.env.NODE_ENV !== "production";
  const normalizedPrefill = useMemo(() => normalizeReservationCreatePrefill(initialPrefill), [initialPrefill]);
  const isTimelinePrefill = Boolean(normalizedPrefill.staffId && normalizedPrefill.date && normalizedPrefill.startTime);

  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [rooms] = useLocalCollection<ServiceRoom>(roomsStorageKey, initialRooms);
  const [shifts] = useLocalCollection<StaffShift>(shiftsStorageKey, initialShifts);
  const [customers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [reservations, setReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const { currentStoreId } = useCurrentStore();

  const activeStaff = useMemo(() => [...staff].sort(compareBySortOrder).filter((item) => item.isActive), [staff]);
  // メニュー選択候補＝有効かつ現在店舗で提供可能なメニューのみ（T065・非破壊）。lookup用 full services は絞らない。
  const activeServices = useMemo(
    () => filterMenusByStore([...services].sort(compareBySortOrder).filter((item) => item.isActive), currentStoreId),
    [services, currentStoreId]
  );

  const [form, setForm] = useState<ReservationForm>(() => createInitialForm(normalizedPrefill, activeServices, shifts));
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const [formMessage, setFormMessage] = useState<StatusMessageValue | null>(null);
  const [savedReservation, setSavedReservation] = useState<Reservation | null>(null);
  const [closeFallbackVisible, setCloseFallbackVisible] = useState(false);
  // コース選択のカテゴリタブ（PM風・T047）。
  const [courseTab, setCourseTab] = useState<string>("");

  const selectedService = services.find((service) => service.id === form.serviceMenuId) ?? null;
  const matchedCustomer = findCustomerForReservationForm(form, customers);
  // 担当候補＝現在店舗でフォーム日付に有効シフトがある有効スタッフ（T064・非破壊）。
  // 名前解決用の full `staff` は絞らない（候補のみ店舗スコープ）。storeId未設定シフトは既定店舗(渋谷)扱い。
  const candidateStaff = useMemo(() => {
    const normalizedFormDate = normalizeDateInputValue(form.date);
    if (!normalizedFormDate) {
      return [] as StaffMember[];
    }
    const storeShifts = filterShiftsByStore(shifts, currentStoreId);
    const workingStaffIds = new Set(
      storeShifts
        .filter(
          (shift) =>
            (shift.isActive ?? true) !== false &&
            normalizeDateInputValue(shift.workDate) === normalizedFormDate &&
            Boolean(normalizeTimeInputValue(shift.startTime) && normalizeTimeInputValue(shift.endTime))
        )
        .map((shift) => shift.staffId)
    );
    return activeStaff.filter((member) => workingStaffIds.has(member.id));
  }, [shifts, currentStoreId, form.date, activeStaff]);
  const staffOptions = buildSelectableStaff(candidateStaff, staff, form.serviceMenuId, form.staffId);
  const debugSavePayload = savedReservation
    ? {
        date: savedReservation.date,
        staffId: savedReservation.staffId,
        startTime: savedReservation.startTime,
        endTime: savedReservation.endTime
      }
    : null;

  // コースカテゴリの色（PM風・T047）。既存luxasカラーを流用・lib追加なし。
  function courseCategoryColor(category: string): { text: string; border: string; activeBg: string } {
    switch (category) {
      case "ボディケア":
        return { text: "text-luxas-green", border: "border-luxas-green/40", activeBg: "bg-luxas-green" };
      case "フェイシャル":
        return { text: "text-rose-700", border: "border-rose-300", activeBg: "bg-rose-600" };
      case "カウンセリング":
        return { text: "text-sky-700", border: "border-sky-300", activeBg: "bg-sky-600" };
      case "オプション":
        return { text: "text-amber-700", border: "border-amber-300", activeBg: "bg-amber-600" };
      default:
        return { text: "text-stone-700", border: "border-luxas-line", activeBg: "bg-stone-600" };
    }
  }

  function update<K extends keyof ReservationForm>(key: K, value: ReservationForm[K]) {
    const nextForm: ReservationForm = { ...form, [key]: value };

    if (key === "serviceMenuId" || key === "startTime") {
      const autoEndTime = getAutoEndTime(nextForm.startTime, nextForm.serviceMenuId, services);

      if (autoEndTime) {
        nextForm.endTime = autoEndTime;
      } else if (key === "startTime") {
        nextForm.endTime = getFallbackEndTime(nextForm.startTime) ?? nextForm.endTime;
      }
    }

    if (key === "serviceMenuId") {
      const nextStaffOptions = getSelectableStaffForService(staff, String(value));

      if (nextStaffOptions.length > 0 && !nextStaffOptions.some((item) => item.id === nextForm.staffId)) {
        nextForm.staffId = nextStaffOptions[0].id;
      }
    }

    setForm(nextForm);
  }

  function saveReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentReservations = readStoredReservations(reservations);
    const validationError = validateReservationForm(form, currentReservations, staff, rooms, shifts, services);
    if (validationError) {
      setFormMessage({ type: "error", text: validationError });
      setMessage(null);
      setSavedReservation(null);
      setCloseFallbackVisible(false);
      return;
    }

    const payload = normalizeForm(form);
    // 新規予約にだけ現在店舗の storeId を付与（T063）。既存データは触らない。
    const nextReservation = { id: makeLocalId("reservation"), ...payload, storeId: currentStoreId };
    const nextReservations = [nextReservation, ...currentReservations];
    const ledgerNotification = {
      type: "reservation-created",
      reservationId: nextReservation.id,
      date: payload.date,
      createdAt: Date.now()
    };

    try {
      window.localStorage.setItem(reservationsStorageKey, JSON.stringify(nextReservations));
      window.localStorage.setItem(reservationLedgerDateStorageKey, payload.date);
      window.localStorage.setItem(reservationLedgerUpdateStorageKey, JSON.stringify(ledgerNotification));
    } catch {
      setFormMessage({ type: "error", text: "ブラウザの保存領域に書き込めませんでした。空き容量または閲覧設定を確認してください。" });
      setMessage(null);
      setSavedReservation(null);
      setCloseFallbackVisible(false);
      return;
    }

    setReservations(nextReservations);
    setSavedReservation(nextReservation);
    setMessage({ type: "success", text: "予約を保存しました" });
    setFormMessage(null);
    setCloseFallbackVisible(false);

    const hasOpener = Boolean(window.opener && !window.opener.closed);

    try {
      if (hasOpener) {
        window.opener.postMessage(ledgerNotification, window.location.origin);
        window.opener.focus();
      }
    } catch {
      // noop: opener may be unavailable in some browsers.
    }

    if (!hasOpener) {
      setCloseFallbackVisible(true);
      return;
    }

    window.setTimeout(() => {
      window.close();

      window.setTimeout(() => {
        setCloseFallbackVisible(true);
      }, 700);
    }, 250);
  }

  const ledgerHref = buildLedgerHref(savedReservation?.date ?? form.date);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-luxas-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-luxas-green">Reservation Create</p>
          <h1 className="mt-2 text-2xl font-semibold text-luxas-ink">予約作成</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            予約台帳から開いた時間枠をもとに、別タブで予約を登録できます。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={ledgerHref}
            className="inline-flex items-center gap-2 rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-medium text-luxas-ink transition hover:bg-luxas-paper"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            予約台帳へ戻る
          </Link>
        </div>
      </section>

      <StatusMessage message={message} />

      {isDebugMode ? (
        <section className="rounded-md border border-dashed border-luxas-line bg-luxas-paper px-4 py-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2 py-0.5 font-medium text-stone-500">Debug</span>
            <span>received staffId: {normalizedPrefill.staffId || "未受信"}</span>
            <span>received date: {normalizedPrefill.date || "未受信"}</span>
            <span>received startTime: {normalizedPrefill.startTime || "未受信"}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span>save payload date: {debugSavePayload?.date || "未保存"}</span>
            <span>save payload staffId: {debugSavePayload?.staffId || "未保存"}</span>
            <span>save payload startTime: {debugSavePayload?.startTime || "未保存"}</span>
            <span>save payload endTime: {debugSavePayload?.endTime || "未保存"}</span>
          </div>
        </section>
      ) : null}

      {savedReservation ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
          <p className="font-semibold">予約を保存しました</p>
          <p className="mt-1">
            {savedReservation.customerName} / {formatDayLabel(savedReservation.date)} / {savedReservation.startTime} -{" "}
            {savedReservation.endTime}
          </p>
          {closeFallbackVisible ? (
            <p className="mt-2 text-sm">
              予約台帳タブに反映しました。このタブが自動で閉じない場合は、予約台帳へ戻ってください。
            </p>
          ) : (
            <p className="mt-2 text-sm">予約台帳タブへ反映しています。このタブは自動で閉じます。</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={ledgerHref}
              className="inline-flex items-center gap-2 rounded-md bg-luxas-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              予約台帳へ戻る
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
              onClick={() => window.location.reload()}
            >
              この画面を更新
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-luxas-line bg-white p-5 shadow-sm">
        <form className="space-y-5" onSubmit={saveReservation} noValidate>
          <FormSectionTitle index={1} title="顧客情報" />
          <div className="grid gap-4 md:grid-cols-2">
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

          {matchedCustomer ? (
            <section className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">顧客の注意事項</p>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-amber-800">
                  顧客管理と連動
                </span>
              </div>
              <p className="mt-2 leading-6">
                {matchedCustomer.caution ? matchedCustomer.caution : "注意事項は登録されていません。"}
              </p>
            </section>
          ) : (
            <section className="rounded-md border border-dashed border-luxas-line bg-luxas-paper px-4 py-3 text-sm text-stone-600">
              顧客名または電話番号が一致すると、注意事項を表示します。
            </section>
          )}

          <FormSectionTitle index={2} title="メニュー（コース）" />
          {(() => {
            // コースタブも店舗scope後の候補（activeServices）から導出する（T065）。
            const courseCategories = Array.from(
              new Set(activeServices.map((s) => s.category || "未分類"))
            );
            const selectedCategory = selectedService ? selectedService.category || "未分類" : "";
            const activeTab =
              courseTab && courseCategories.includes(courseTab)
                ? courseTab
                : selectedCategory || courseCategories[0] || "";
            const tabServices = activeServices.filter(
              (s) => (s.category || "未分類") === activeTab
            );
            return (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {courseCategories.map((category) => {
                    const color = courseCategoryColor(category);
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
                <div className="grid gap-2 sm:grid-cols-2">
                  {tabServices.map((service) => {
                    const color = courseCategoryColor(service.category || "未分類");
                    const active = form.serviceMenuId === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => update("serviceMenuId", service.id)}
                        className={[
                          "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition",
                          active
                            ? `${color.activeBg} border-transparent text-white`
                            : `bg-white ${color.text} ${color.border} hover:bg-luxas-paper`
                        ].join(" ")}
                      >
                        <span className="text-sm font-semibold">{service.name}</span>
                        <span className={["text-xs", active ? "text-white/85" : "text-stone-500"].join(" ")}>
                          ¥{service.price.toLocaleString()} / {service.durationMinutes}分
                        </span>
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

          <FormSectionTitle index={3} title="担当 / ブース種別" />
          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect
              label="担当スタッフ"
              value={form.staffId}
              onChange={(value) => update("staffId", value)}
              required
            >
              <option value="">選択してください</option>
              {staffOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                  {item.isActive ? "" : "（停止中）"}
                </option>
              ))}
            </FormSelect>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-luxas-ink">ブース種別</span>
              <div className="rounded-md border border-luxas-line bg-luxas-paper px-3 py-2.5 text-sm text-stone-700">
                {selectedService ? (selectedService.requiresPrivateRoom ? "個室" : "施術ブース") : "メニュー選択後に自動で決まります"}
              </div>
              <span className="text-xs text-stone-500">ブースは空き状況に応じて自動で割り当てられます（個別指定は不要）。</span>
            </div>
          </div>

          <FormSectionTitle index={4} title="日時" />
          {isTimelinePrefill ? (
            <p className="text-xs text-luxas-green">予約台帳で選択済みの日時と担当を引き継いでいます。</p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <FormInput
              label="日付"
              type="date"
              value={form.date}
              onChange={(value) => update("date", value)}
              required
            />
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

          <section className="rounded-md border border-luxas-line bg-luxas-paper px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-luxas-ink">保存前の要約</p>
                <p className="mt-1 text-xs text-stone-500">電話中の確認用です。内容がそろっているかを先に見られます。</p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-stone-600">
                {reservationStatusLabels.booked}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <SummaryLine label="顧客名" value={form.customerName || "未入力"} />
              <SummaryLine label="電話番号" value={form.phone || "未入力"} />
              <SummaryLine label="メニュー" value={selectedService?.name ?? "未選択"} />
              <SummaryLine label="担当" value={staff.find((item) => item.id === form.staffId)?.displayName ?? "未選択"} />
              <SummaryLine label="ブース種別" value={selectedService ? (selectedService.requiresPrivateRoom ? "個室" : "施術ブース") : "未選択"} />
              <SummaryLine
                label="日時"
                value={form.date ? `${formatDayLabel(form.date)} / ${form.startTime} - ${form.endTime}` : "未入力"}
              />
            </div>
            <div className="mt-3 rounded-md border border-dashed border-luxas-line bg-white px-3 py-2 text-xs leading-6 text-stone-600">
              {matchedCustomer?.caution
                ? `注意事項: ${matchedCustomer.caution}`
                : "注意事項: 顧客の注意事項は未登録、またはまだ顧客情報が一致していません。"}
            </div>
          </section>

          <FormSectionTitle index={5} title="メモ" />
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

          <StatusMessage message={formMessage} />

          <div className="flex flex-col gap-2 border-t border-luxas-line pt-4 sm:flex-row sm:justify-end">
            <Link
              href={ledgerHref}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink transition hover:bg-luxas-mist"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              キャンセル / 予約台帳へ戻る
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Save size={16} aria-hidden="true" />
              保存
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function createInitialForm(prefill: NormalizedReservationCreatePrefill, services: ServiceMenu[], shifts: StaffShift[]): ReservationForm {
  const staffId = prefill.staffId;
  const roomId = prefill.roomId;
  const prefillDate = prefill.date;
  const serviceMenuId = prefill.serviceMenuId;
  // 未指定時は店舗設定の受付開始時刻を既定に（固定の"10:00"を避ける・T003 方針A）
  const startTime = prefill.startTime || initialStoreSettings.reservationAcceptStartTime;
  const date = prefillDate || getFirstAvailableShiftDate(staffId, shifts) || getTodayDate();
  const endTime =
    getAutoEndTime(startTime, serviceMenuId, services) ??
    getFallbackEndTime(startTime) ??
    "11:00";

  return {
    // 顧客名は既定「ゲスト」（電話受けながら素早く取れるよう・T043）。prefillがあれば優先。
    customerName: prefill.customerName || "ゲスト",
    phone: prefill.phone || "",
    serviceMenuId,
    staffId,
    roomId,
    date,
    startTime,
    endTime,
    memo: "",
    status: "booked"
  };
}

function normalizeReservationCreatePrefill(prefill: ReservationCreatePrefill): NormalizedReservationCreatePrefill {
  return {
    staffId: optionalPrefillValue(prefill.staffId),
    roomId: optionalPrefillValue(prefill.roomId),
    date: normalizeDateInputValue(optionalPrefillValue(prefill.date)) ?? "",
    startTime: normalizeTimeInputValue(optionalPrefillValue(prefill.startTime)) ?? "",
    serviceMenuId: optionalPrefillValue(prefill.serviceMenuId),
    customerName: optionalPrefillValue(prefill.customerName),
    phone: optionalPrefillValue(prefill.phone)
  };
}

function validateReservationForm(
  value: ReservationForm,
  currentReservations: Reservation[],
  currentStaff: StaffMember[],
  currentRooms: ServiceRoom[],
  currentShifts: StaffShift[],
  currentServices: ServiceMenu[]
) {
  // 顧客名・電話番号はゲスト登録のため必須にしない（T043。空なら保存時に「ゲスト」補完）。

  const selectedStaff = currentStaff.find((item) => item.id === value.staffId);
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

  if (start % reservationTimeStepMinutes !== 0 || end % reservationTimeStepMinutes !== 0) {
    return "開始時刻と終了時刻は5分単位で入力してください。";
  }

  if (end <= start) {
    return "終了時刻を開始時刻より後にしてください。メニューの所要時間を確認して直してください。";
  }

  const shiftAvailability = findShiftForReservation({
    staffId: value.staffId,
    date: normalizedDate,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    shifts: currentShifts
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

  // スタッフ重複（同一スタッフ・時間重複）は従来どおりブロックする。
  const staffOverlap = currentReservations.find((reservation) => {
    if (reservation.status === "canceled" || normalizeDateInputValue(reservation.date) !== normalizedDate) {
      return false;
    }

    const reservationStart = timeToMinutes(reservation.startTime);
    const reservationEnd = timeToMinutes(reservation.endTime);
    const overlaps = start < reservationEnd && reservationStart < end;

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
    services: currentServices,
    rooms: currentRooms
  });

  if (!boothAvailable) {
    const menu = currentServices.find((item) => item.id === value.serviceMenuId);
    return menu?.requiresPrivateRoom
      ? "個室の空きがありません。時間をずらすか、別の時間帯にしてください。"
      : "施術ブースの空きがありません。時間をずらすか、別の時間帯にしてください。";
  }

  return null;
}

function normalizeForm(form: ReservationForm): Omit<Reservation, "id"> {
  return {
    customerName: normalizeText(form.customerName) || "ゲスト",
    phone: normalizeText(form.phone),
    serviceMenuId: normalizeText(form.serviceMenuId),
    staffId: normalizeText(form.staffId),
    roomId: normalizeText(form.roomId),
    date: normalizeDateInputValue(form.date) ?? form.date,
    startTime: normalizeTimeInputValue(form.startTime) ?? form.startTime,
    endTime: normalizeTimeInputValue(form.endTime) ?? form.endTime,
    memo: normalizeText(form.memo),
    status: form.status
  };
}

function readStoredReservations(fallback: Reservation[]) {
  try {
    const savedReservations = window.localStorage.getItem(reservationsStorageKey);

    if (!savedReservations) {
      return fallback;
    }

    const parsedReservations = JSON.parse(savedReservations);

    return Array.isArray(parsedReservations) ? (parsedReservations as Reservation[]) : fallback;
  } catch {
    return fallback;
  }
}

function buildLedgerHref(date: string) {
  const normalizedDate = normalizeDateInputValue(date);

  if (!normalizedDate) {
    return "/dashboard/reservations";
  }

  return `/dashboard/reservations?date=${encodeURIComponent(normalizedDate)}`;
}

function optionalPrefillValue(value: string | undefined) {
  return value && !isBlank(value) ? value : "";
}

function getFirstAvailableShiftDate(staffId: string | undefined, shifts: StaffShift[]) {
  const today = getTodayDate();
  const activeShifts = shifts
    .filter((shift) => (shift.isActive ?? true) && (!staffId || shift.staffId === staffId))
    .sort((left, right) => left.workDate.localeCompare(right.workDate));

  return activeShifts.find((shift) => shift.workDate >= today)?.workDate ?? activeShifts[0]?.workDate ?? null;
}

function getFallbackEndTime(startTime: string) {
  const start = timeToMinutes(startTime);

  return Number.isFinite(start) ? minutesToTime(start + 60) : null;
}

function buildSelectableStaff(activeStaff: StaffMember[], allStaff: StaffMember[], selectedServiceId: string, selectedStaffId: string) {
  const base = [...activeStaff];
  const currentStaff = allStaff.find((staff) => staff.id === selectedStaffId);

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

function findCustomerForReservationForm(form: ReservationForm, customers: Customer[]) {
  const phone = normalizeText(form.phone);
  const customerName = normalizeText(form.customerName);

  return (
    customers.find((customer) => phone.length > 0 && normalizeText(customer.phone) === phone) ??
    customers.find((customer) => customerName.length > 0 && normalizeText(customer.name) === customerName) ??
    null
  );
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

    if (shiftStart === null || shiftEnd === null) {
      continue;
    }

    if (start < shiftStart || end > shiftEnd) {
      continue;
    }

    const breakStart = timeToMinutes(shift.breakStart);
    const breakEnd = timeToMinutes(shift.breakEnd);

    if (breakStart !== null && breakEnd !== null && start < breakEnd && breakStart < end) {
      return { kind: "break", label: `${shift.startTime}-${shift.endTime} / 休憩 ${shift.breakStart}-${shift.breakEnd}` };
    }

    return { kind: "ok", label: `${shift.startTime}-${shift.endTime}`, shift };
  }

  return { kind: "outside", label: candidateShifts.map((shift) => `${shift.startTime}-${shift.endTime}`).join(" / ") };
}

function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
  step,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "time";
  required?: boolean;
  hint?: string;
  step?: number;
  disabled?: boolean;
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
        disabled={disabled}
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
  disabled = false,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
      >
        {children}
      </select>
    </label>
  );
}

function FormSectionTitle({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-luxas-mist text-sm font-semibold text-luxas-green">
        {index}
      </span>
      <div>
        <p className="text-sm font-semibold text-luxas-ink">{title}</p>
      </div>
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
