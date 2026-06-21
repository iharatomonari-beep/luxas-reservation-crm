"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  initialServices, initialStaff, initialRooms, servicesStorageKey, staffStorageKey, roomsStorageKey, shiftsStorageKey, initialShifts
} from "@/features/master-data/mock-data";
import { initialReservations, reservationsStorageKey } from "@/features/reservations/mock-data";
import { initialCustomers, customersStorageKey } from "@/features/customers/mock-data";
import { initialOnlineBlocks, onlineBlocksStorageKey } from "@/features/store-ops/online-blocks";
import { initialStores } from "@/features/org/mock-data";
import { useStoreSettings } from "@/features/master-data/store-settings";
import { stampCreate } from "@/features/master-data/timestamps";
import { compareBySortOrder, formatCurrency, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { minutesToTime, timeToMinutes, toDateInputValue } from "@/features/reservations/date-utils";
import { getOpenStartTimes, onlineMenusForStore, pickAutoStaff, type OpenSlot } from "@/features/reservations/availability";
import type { ServiceMenu, StaffMember } from "@/features/master-data/types";
import type { Reservation } from "@/features/reservations/types";
import type { CustomerGender } from "@/features/customers/types";

type Step = "menu" | "datetime" | "info" | "done";

function staffCanDoMenu(staff: StaffMember, menuId: string): boolean {
  const ids = staff.serviceMenuIds ?? [];
  return ids.length === 0 || ids.includes(menuId);
}

export function OnlineBookingPage({ storeId }: { storeId: string }) {
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [shifts] = useLocalCollection(shiftsStorageKey, initialShifts);
  const [rooms] = useLocalCollection(roomsStorageKey, initialRooms);
  const [reservations, setReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [, setCustomers] = useLocalCollection(customersStorageKey, initialCustomers);
  const [onlineBlocks] = useLocalCollection(onlineBlocksStorageKey, initialOnlineBlocks);
  const [settings] = useStoreSettings();

  const store = initialStores.find((s) => s.id === storeId);

  const [step, setStep] = useState<Step>("menu");
  const [category, setCategory] = useState<string>("");
  const [menuId, setMenuId] = useState<string>("");
  const [date, setDate] = useState<string>(toDateInputValue(new Date()));
  const [nominatedStaffId, setNominatedStaffId] = useState<string>(""); // ""=指名なし
  const [slot, setSlot] = useState<OpenSlot | null>(null);
  const [info, setInfo] = useState({ name: "", phone: "", email: "", gender: "unspecified" as CustomerGender });
  const [completedId, setCompletedId] = useState<string>("");

  const onlineMenus = useMemo(
    () => onlineMenusForStore(services, storeId).sort(compareBySortOrder),
    [services, storeId]
  );
  const categories = useMemo(() => [...new Set(onlineMenus.map((m) => m.category))], [onlineMenus]);
  const visibleMenus = category ? onlineMenus.filter((m) => m.category === category) : onlineMenus;
  const menu = onlineMenus.find((m) => m.id === menuId) ?? null;

  // 指名候補: 当該店舗所属・有効・このコース対応のスタッフ。
  const nominationStaff = useMemo(() => {
    if (!menu) return [];
    return [...staff]
      .filter((s) => s.isActive && (s.homeStoreId ?? "store-shibuya") === storeId && staffCanDoMenu(s, menu.id))
      .sort(compareBySortOrder);
  }, [staff, storeId, menu]);

  // 空き枠（無指名はコース対応スタッフ全員、指名ありはその人で計算）。
  const slots = useMemo(() => {
    if (!menu) return [];
    const staffForMenu = nominatedStaffId ? staff : nominationStaff;
    return getOpenStartTimes({
      storeId, date, menu,
      staff: staffForMenu, shifts, reservations, services, rooms, onlineBlocks,
      businessStartTime: settings.businessStartTime,
      businessEndTime: settings.reservationAcceptEndTime || settings.businessEndTime,
      nominatedStaffId: nominatedStaffId || undefined
    });
  }, [menu, nominatedStaffId, staff, nominationStaff, storeId, date, shifts, reservations, services, rooms, onlineBlocks, settings]);

  if (!store) {
    return <Centered title="店舗が見つかりません" body="URLの店舗IDが正しくありません。" />;
  }
  if (settings.onlineReservationEnabled === false) {
    return <Centered title={`${store.name} オンライン予約`} body="現在オンライン予約を受け付けていません。お電話にてお問い合わせください。" />;
  }

  function confirm() {
    if (!menu || !slot) return;
    const assignedStaffId = nominatedStaffId || pickAutoStaff(nominationStaff, slot.staffIds);
    if (!assignedStaffId) return;

    const startTime = slot.time;
    const endTime = minutesToTime(timeToMinutes(startTime) + menu.durationMinutes);
    const customerId = makeLocalId("customer");
    const name = normalizeText(info.name) || "オンライン予約のお客様";

    setCustomers((cur) => [
      {
        id: customerId,
        ...stampCreate({
          name, nameKana: "", phone: normalizeText(info.phone), email: normalizeText(info.email),
          birthDate: "", gender: info.gender, address: "", firstVisitDate: date, lastVisitDate: date,
          caution: "", chartMemo: "", tags: [], isActive: true, homeStoreId: storeId
        })
      },
      ...cur
    ]);

    const reservationId = makeLocalId("reservation");
    const reservation: Reservation = {
      id: reservationId, date, startTime, endTime,
      customerName: name, phone: normalizeText(info.phone),
      serviceMenuId: menu.id, staffId: assignedStaffId, roomId: "", status: "booked",
      memo: "", storeId, source: "online", customerId,
      nominatedStaffId: nominatedStaffId || undefined, guestGender: info.gender
    };
    setReservations((cur) => [reservation, ...cur]);
    setCompletedId(reservationId);
    setStep("done");
  }

  const assignedName = (() => {
    if (!slot) return "";
    const id = nominatedStaffId || pickAutoStaff(nominationStaff, slot.staffIds);
    return staff.find((s) => s.id === id)?.displayName ?? "スタッフ";
  })();

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-luxas-paper px-4 py-6">
      <header className="mb-5">
        <p className="text-xs font-medium text-luxas-green">{store.name}</p>
        <h1 className="text-xl font-bold text-luxas-ink">オンライン予約</h1>
        <StepBar step={step} />
      </header>

      {step === "menu" && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-700">1. コースを選ぶ</h2>
          {onlineMenus.length === 0 ? (
            <p className="rounded-md border border-luxas-line bg-white p-4 text-sm text-stone-500">この店舗のオンライン予約可能なコースがありません。</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={category === ""} onClick={() => setCategory("")}>すべて</Chip>
                {categories.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
                ))}
              </div>
              <ul className="space-y-2">
                {visibleMenus.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => { setMenuId(m.id); setNominatedStaffId(""); setSlot(null); setStep("datetime"); }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-luxas-line bg-white px-4 py-3 text-left hover:border-luxas-green"
                    >
                      <span>
                        <span className="block text-sm font-medium text-luxas-ink">{m.name}</span>
                        <span className="block text-xs text-stone-500">{m.durationMinutes}分 ・ {m.category}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-luxas-ink">{formatCurrency(m.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {step === "datetime" && menu && (
        <section className="space-y-4">
          <BackButton onClick={() => setStep("menu")} />
          <SelectedMenuCard menu={menu} />
          <h2 className="text-sm font-semibold text-stone-700">2. 日付・指名・時間を選ぶ</h2>

          <label className="block">
            <span className="text-xs font-medium text-stone-600">日付</span>
            <input
              type="date" value={date} min={toDateInputValue(new Date())}
              onChange={(e) => { setDate(e.target.value); setSlot(null); }}
              className="mt-1 w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm outline-none focus:border-luxas-green"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-stone-600">指名</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip active={nominatedStaffId === ""} onClick={() => { setNominatedStaffId(""); setSlot(null); }}>指名なし</Chip>
              {nominationStaff.map((s) => (
                <Chip key={s.id} active={nominatedStaffId === s.id} onClick={() => { setNominatedStaffId(s.id); setSlot(null); }}>{s.displayName}</Chip>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-stone-600">時間（空き枠）</span>
            {slots.length === 0 ? (
              <p className="mt-1 rounded-md border border-luxas-line bg-white p-3 text-sm text-stone-500">この日に空き枠がありません。日付や指名を変更してください。</p>
            ) : (
              <div className="mt-1 grid grid-cols-4 gap-2">
                {slots.map((sl) => (
                  <button
                    key={sl.time} type="button" onClick={() => setSlot(sl)}
                    className={["rounded-md border px-2 py-2 text-sm font-medium",
                      slot?.time === sl.time ? "border-luxas-green bg-luxas-mist text-luxas-green" : "border-luxas-line bg-white text-luxas-ink hover:border-luxas-green"].join(" ")}
                  >{sl.time}</button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button" disabled={!slot} onClick={() => setStep("info")}
            className="w-full rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >次へ（お客様情報）</button>
        </section>
      )}

      {step === "info" && menu && slot && (
        <section className="space-y-4">
          <BackButton onClick={() => setStep("datetime")} />
          <div className="rounded-lg border border-luxas-line bg-white p-4 text-sm">
            <p className="font-medium text-luxas-ink">{menu.name}</p>
            <p className="mt-1 text-stone-600">{date} {slot.time}〜 ／ 担当: {assignedName}{nominatedStaffId ? "（指名）" : "（指名なし）"}</p>
            <p className="mt-1 font-semibold text-luxas-ink">{formatCurrency(menu.price)}</p>
          </div>
          <h2 className="text-sm font-semibold text-stone-700">3. お客様情報</h2>
          <Field label="お名前"><input value={info.name} onChange={(e) => setInfo((c) => ({ ...c, name: e.target.value }))} className={inputCls} placeholder="例: 山田 太郎" /></Field>
          <Field label="電話番号"><input value={info.phone} onChange={(e) => setInfo((c) => ({ ...c, phone: e.target.value }))} className={inputCls} placeholder="09012345678" inputMode="tel" /></Field>
          <Field label="メールアドレス"><input value={info.email} onChange={(e) => setInfo((c) => ({ ...c, email: e.target.value }))} className={inputCls} placeholder="任意" inputMode="email" /></Field>
          <Field label="性別">
            <div className="flex gap-1.5">
              {([["female", "女性"], ["male", "男性"], ["unspecified", "未指定"]] as const).map(([v, label]) => (
                <Chip key={v} active={info.gender === v} onClick={() => setInfo((c) => ({ ...c, gender: v }))}>{label}</Chip>
              ))}
            </div>
          </Field>
          <button type="button" onClick={confirm} className="w-full rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white">この内容で予約する</button>
        </section>
      )}

      {step === "done" && (
        <section className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-luxas-mist"><Check className="text-luxas-green" size={28} /></div>
          <h2 className="text-lg font-bold text-luxas-ink">ご予約を受け付けました</h2>
          <p className="text-sm text-stone-600">受付番号: <span className="font-mono">{completedId.replace(/^reservation-?/, "")}</span></p>
          <p className="text-xs text-stone-500">{store.name} ／ {date} {slot?.time}〜 ／ 担当 {assignedName}</p>
          <button type="button" onClick={() => { setStep("menu"); setMenuId(""); setSlot(null); setNominatedStaffId(""); setInfo({ name: "", phone: "", email: "", gender: "unspecified" }); }}
            className="mx-auto mt-2 rounded-md border border-luxas-line bg-white px-4 py-2 text-sm font-medium text-stone-700">続けて予約する</button>
        </section>
      )}
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm outline-none focus:border-luxas-green";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-stone-600">{label}</span>{children}</label>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={["rounded-full border px-3 py-1.5 text-xs font-medium",
        active ? "border-luxas-green bg-luxas-mist text-luxas-green" : "border-luxas-line bg-white text-stone-600"].join(" ")}
    >{children}</button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-luxas-ink"><ChevronLeft size={14} />戻る</button>;
}

function SelectedMenuCard({ menu }: { menu: ServiceMenu }) {
  return (
    <div className="rounded-lg border border-luxas-line bg-white px-4 py-3 text-sm">
      <span className="font-medium text-luxas-ink">{menu.name}</span>
      <span className="ml-2 text-xs text-stone-500">{menu.durationMinutes}分 ・ {formatCurrency(menu.price)}</span>
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "menu", label: "コース" }, { key: "datetime", label: "日時" }, { key: "info", label: "情報" }, { key: "done", label: "完了" }
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="mt-3 flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s.key} className={["h-1.5 flex-1 rounded-full", i <= idx ? "bg-luxas-green" : "bg-luxas-line"].join(" ")} />
      ))}
    </div>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-2 bg-luxas-paper px-6 text-center">
      <h1 className="text-lg font-bold text-luxas-ink">{title}</h1>
      <p className="text-sm text-stone-600">{body}</p>
    </div>
  );
}
