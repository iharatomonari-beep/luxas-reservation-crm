"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
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
import { menuColorStyle } from "@/features/master-data/menu-colors";
import { minutesToTime, timeToMinutes, toDateInputValue } from "@/features/reservations/date-utils";
import { getOpenStartTimes, isStaffWorkingOnDate, onlineMenusForStore, pickAutoStaff, type OpenSlot } from "@/features/reservations/availability";
import { filterShiftsByStore } from "@/features/master-data/store-staff-scope";
import type { ServiceMenu, StaffMember } from "@/features/master-data/types";
import type { Reservation } from "@/features/reservations/types";
import type { Customer, CustomerGender } from "@/features/customers/types";
import { useMemberSession } from "@/features/online-booking/use-member-session";
import { buildReservationEmail } from "@/features/online-booking/confirmation-email";
import { buildIcs } from "@/features/online-booking/ics";
import { signInWithProvider } from "@/features/online-booking/public-sidebar";
import { PM_NAVY } from "@/features/online-booking/public-shell";

type Step = "menu" | "datetime" | "info" | "done";

function staffCanDoMenu(staff: StaffMember, menuId: string): boolean {
  const ids = staff.serviceMenuIds ?? [];
  return ids.length === 0 || ids.includes(menuId);
}

export function OnlineBookingPage({ storeId, initialMenuId }: { storeId: string; initialMenuId?: string }) {
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [shifts] = useLocalCollection(shiftsStorageKey, initialShifts);
  const [rooms] = useLocalCollection(roomsStorageKey, initialRooms);
  const [reservations, setReservations] = useLocalCollection<Reservation>(reservationsStorageKey, initialReservations);
  const [customers, setCustomers] = useLocalCollection<Customer>(customersStorageKey, initialCustomers);
  const [onlineBlocks] = useLocalCollection(onlineBlocksStorageKey, initialOnlineBlocks);
  const [settings] = useStoreSettings(storeId);

  // ⑤-公開: 匿名(anon)モード。Supabase接続あり＆セッション無し（実顧客）のとき、生テーブル不可のため
  // メニュー/スタッフ/空き枠/予約確定をすべて公開RPC経由にする（時間帯ブロック・スタッフロックを反映）。
  // ローカル開発(未設定)やログイン中プレビューは false ＝従来のclient計算のまま（壊さない）。
  const [rpcMode, setRpcMode] = useState(false);
  const [rpcMenus, setRpcMenus] = useState<ServiceMenu[]>([]);
  const [rpcStaff, setRpcStaff] = useState<StaffMember[]>([]);
  const [rpcSlots, setRpcSlots] = useState<OpenSlot[]>([]);
  useEffect(() => {
    let cancelled = false;
    try {
      const sb = createSupabaseBrowserClient();
      sb.auth.getSession().then(({ data }) => {
        if (!cancelled) setRpcMode(!data.session);
      });
    } catch {
      if (!cancelled) setRpcMode(false); // Supabase未設定（ローカル）＝client計算
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // ログイン中の会員（いれば、お客様情報入力をスキップしこの会員に予約を紐付ける）。
  const { memberId, login } = useMemberSession();
  const member = useMemo(() => customers.find((c) => c.id === memberId) ?? null, [customers, memberId]);

  const store = initialStores.find((s) => s.id === storeId);

  // メニュー画面から ?menu= 付きで来たら、そのコースを選択済みで日時選択から開始する。
  const [step, setStep] = useState<Step>(initialMenuId ? "datetime" : "menu");
  const [category, setCategory] = useState<string>("");
  const [menuId, setMenuId] = useState<string>(initialMenuId ?? "");
  const [date, setDate] = useState<string>(toDateInputValue(new Date()));
  const [nominatedStaffId, setNominatedStaffId] = useState<string>(""); // ""=指名なし
  const [nominationPicked, setNominationPicked] = useState(false); // 指名/指名なしを選んだか（選ぶまで時間は出さない）
  const [slot, setSlot] = useState<OpenSlot | null>(null);
  const [info, setInfo] = useState({ name: "", phone: "", email: "", gender: "unspecified" as CustomerGender });
  const [completedId, setCompletedId] = useState<string>("");
  const [confirmedEmail, setConfirmedEmail] = useState<string>(""); // 確認メール（モック）の送信先
  // 未ログインで予約に進んだ時の「ログイン/新規登録」ゲートウェイ。
  const [guestStep, setGuestStep] = useState<"gateway" | "register">("gateway");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ゲスト入力時の既存会員照合（電話 or メール一致）。一致すれば重複登録せずその会員に紐付ける。
  const matchedCustomer = useMemo(() => {
    if (member) return null;
    const p = normalizeText(info.phone);
    const e = normalizeText(info.email).toLowerCase();
    if (!p && !e) return null;
    return (
      customers.find(
        (c) => (p && normalizeText(c.phone) === p) || (e && (c.email ?? "").toLowerCase() === e)
      ) ?? null
    );
  }, [customers, member, info.phone, info.email]);

  const onlineMenusClient = useMemo(
    () => onlineMenusForStore(services, storeId).sort(compareBySortOrder),
    [services, storeId]
  );
  // 匿名: get_online_menus(店舗code) でオンライン対象メニューを取得。
  useEffect(() => {
    if (!rpcMode) return;
    let cancelled = false;
    createSupabaseBrowserClient()
      .rpc("get_online_menus", { p_store_code: storeId })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setRpcMenus(
          (data as Array<{ service_id: string; name: string; category: string | null; duration_minutes: number; price: number }>).map((r) => ({
            id: r.service_id,
            name: r.name,
            category: r.category ?? "",
            durationMinutes: r.duration_minutes,
            price: r.price,
            sortOrder: 0,
            isActive: true,
            onlineBooking: true
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, [rpcMode, storeId]);
  const onlineMenus = rpcMode ? rpcMenus : onlineMenusClient;
  const categories = useMemo(() => [...new Set(onlineMenus.map((m) => m.category))], [onlineMenus]);
  const visibleMenus = category ? onlineMenus.filter((m) => m.category === category) : onlineMenus;
  const menu = onlineMenus.find((m) => m.id === menuId) ?? null;

  // PM寄せ: カテゴリ見出しごとにコースをまとめて表示する（カテゴリ絞り込み時は1グループ）。
  const groupedMenus = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, ServiceMenu[]>();
    for (const m of visibleMenus) {
      if (!map.has(m.category)) { map.set(m.category, []); order.push(m.category); }
      map.get(m.category)!.push(m);
    }
    return order.map((c) => ({ category: c, items: map.get(c)! }));
  }, [visibleMenus]);

  // 当該店舗のシフトに絞る（指名候補の出勤判定に使う）。
  const storeShifts = useMemo(() => filterShiftsByStore(shifts, storeId), [shifts, storeId]);

  // 指名候補: 当該店舗所属・有効・このコース対応で、かつ選択日に出勤予定のスタッフのみ。
  // 出勤していないスタッフは指名候補に出さない。
  const nominationStaffClient = useMemo(() => {
    if (!menu) return [];
    return [...staff]
      .filter((s) => s.isActive && (s.homeStoreId ?? "store-shibuya") === storeId && staffCanDoMenu(s, menu.id))
      .filter((s) => isStaffWorkingOnDate(s.id, date, storeShifts))
      .sort(compareBySortOrder);
  }, [staff, storeId, menu, date, storeShifts]);
  // 匿名: get_online_staff(店舗code,日付) で「出勤あり＆ロックなし」スタッフを取得（ロック中は構造的に除外）。
  useEffect(() => {
    if (!rpcMode) return;
    let cancelled = false;
    createSupabaseBrowserClient()
      .rpc("get_online_staff", { p_store_code: storeId, p_date: date })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setRpcStaff(
          (data as Array<{ staff_legacy_id: string; display_name: string }>).map((r) => ({
            id: r.staff_legacy_id,
            fullName: r.display_name,
            displayName: r.display_name,
            role: "therapist",
            sortOrder: 0,
            isActive: true,
            serviceMenuIds: []
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, [rpcMode, storeId, date]);
  const nominationStaff = rpcMode ? rpcStaff : nominationStaffClient;

  // 指名（または指名なし）を選んでから時間を出す。
  // 指名なし=対応スタッフ全員 / 指名あり=その人 の空き枠を表示する。
  const slotsClient = useMemo(() => {
    if (!menu || !nominationPicked) return [];
    const staffForMenu = nominatedStaffId ? staff : nominationStaff;
    return getOpenStartTimes({
      storeId, date, menu,
      staff: staffForMenu, shifts, reservations, services, rooms, onlineBlocks,
      businessStartTime: settings.businessStartTime,
      businessEndTime: settings.reservationAcceptEndTime || settings.businessEndTime,
      nominatedStaffId: nominatedStaffId || undefined
    });
  }, [menu, nominationPicked, nominatedStaffId, staff, nominationStaff, storeId, date, shifts, reservations, services, rooms, onlineBlocks, settings]);
  // 匿名: get_open_slots(店舗code,日付,メニュー,任意指名) で空き時刻を取得（時間帯ブロック/スタッフロックを反映）。
  useEffect(() => {
    if (!rpcMode || !menu || !nominationPicked) {
      setRpcSlots([]);
      return;
    }
    let cancelled = false;
    createSupabaseBrowserClient()
      .rpc("get_open_slots", { p_store_code: storeId, p_date: date, p_service_id: menu.id, p_staff_legacy: nominatedStaffId || null })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setRpcSlots([]);
          return;
        }
        setRpcSlots((data as string[]).map((t) => ({ time: String(t).slice(0, 5), staffIds: [] })));
      });
    return () => {
      cancelled = true;
    };
  }, [rpcMode, menu, nominationPicked, nominatedStaffId, storeId, date]);
  const slots = rpcMode ? rpcSlots : slotsClient;

  // 指名を選び直したら、選択中の時間は一旦クリア（その人の空き枠で取り直す）。
  function pickNomination(staffId: string) {
    setNominatedStaffId(staffId);
    setNominationPicked(true);
    setSlot(null);
  }

  if (!store) {
    return <Centered title="店舗が見つかりません" body="URLの店舗IDが正しくありません。" />;
  }
  if (settings.onlineReservationEnabled === false) {
    return <Centered title={`${store.name} オンライン予約`} body="現在オンライン予約を受け付けていません。お電話にてお問い合わせください。" />;
  }

  // 会員ログイン（モック）。メール一致でログイン → member が立ち予約確認へ進む。
  function handleGuestLogin() {
    const e = normalizeText(loginEmail).toLowerCase();
    if (!e) return;
    const found = customers.find((c) => (c.email ?? "").toLowerCase() === e);
    if (!found) {
      window.alert("メールアドレスが見つかりません。初めての方は新規登録してください。");
      return;
    }
    login(found.id);
  }

  async function confirm() {
    if (!menu || !slot) return;

    // 匿名: 予約確定は create_online_booking_v2（サーバー側で空き再検証・指名なしは自動割当・room容量ベース）。
    if (rpcMode) {
      const { data, error } = await createSupabaseBrowserClient().rpc("create_online_booking_v2", {
        p_store_code: storeId,
        p_service_id: menu.id,
        p_date: date,
        p_start: slot.time,
        p_customer_name: normalizeText(info.name) || "オンライン予約のお客様",
        p_staff_legacy: nominatedStaffId || null,
        p_customer_phone: normalizeText(info.phone) || null,
        p_customer_email: normalizeText(info.email) || null
      });
      if (error || !data) {
        window.alert("申し訳ありません。空き状況が変わったため予約できませんでした。お手数ですが時間を選び直してください。");
        return;
      }
      setCompletedId(String(data));
      setConfirmedEmail(normalizeText(info.email) || "");
      setStep("done");
      return;
    }

    const assignedStaffId = nominatedStaffId || pickAutoStaff(nominationStaff, slot.staffIds);
    if (!assignedStaffId) return;

    const startTime = slot.time;
    const endTime = minutesToTime(timeToMinutes(startTime) + menu.durationMinutes);

    // ログイン会員はその顧客に紐付け（新規作成しない）。ゲストは新規顧客を作成。
    let customerId: string;
    let name: string;
    let phone: string;
    let gender: CustomerGender;

    if (member) {
      // ログイン会員
      customerId = member.id;
      name = member.name;
      phone = member.phone;
      gender = member.gender;
    } else if (matchedCustomer) {
      // 入力情報が登録済み会員と一致 → その会員に紐付け（重複登録しない）
      customerId = matchedCustomer.id;
      name = matchedCustomer.name;
      phone = matchedCustomer.phone;
      gender = matchedCustomer.gender;
    } else {
      // 新規顧客として登録
      customerId = makeLocalId("customer");
      name = normalizeText(info.name) || "オンライン予約のお客様";
      phone = normalizeText(info.phone);
      gender = info.gender;
      setCustomers((cur) => [
        {
          id: customerId,
          ...stampCreate({
            name, nameKana: "", phone, email: normalizeText(info.email),
            birthDate: "", gender, address: "", firstVisitDate: date, lastVisitDate: date,
            caution: "", chartMemo: "", tags: [], isActive: true, homeStoreId: storeId
          })
        },
        ...cur
      ]);
    }

    const reservationId = makeLocalId("reservation");
    const reservation: Reservation = {
      id: reservationId, date, startTime, endTime,
      customerName: name, phone,
      serviceMenuId: menu.id, staffId: assignedStaffId, roomId: "", status: "booked",
      memo: "", storeId, source: "online", customerId,
      nominatedStaffId: nominatedStaffId || undefined, guestGender: gender
    };
    setReservations((cur) => [reservation, ...cur]);
    setCompletedId(reservationId);
    // 確認メール送信先（モック・実送信なし）。会員/照合済み顧客/ゲスト入力の順で決定。
    const toEmail = member?.email ?? matchedCustomer?.email ?? normalizeText(info.email);
    setConfirmedEmail(toEmail || "");
    setStep("done");
  }

  const assignedName = (() => {
    if (!slot) return "";
    if (rpcMode) {
      // 匿名: 指名ありはその名前、指名なしはサーバー自動割当（事前には未確定）。
      return nominatedStaffId ? nominationStaff.find((s) => s.id === nominatedStaffId)?.displayName ?? "スタッフ" : "スタッフ（自動割当）";
    }
    const id = nominatedStaffId || pickAutoStaff(nominationStaff, slot.staffIds);
    return staff.find((s) => s.id === id)?.displayName ?? "スタッフ";
  })();

  // 予約をカレンダー(.ics)としてダウンロードする（端末カレンダーに追加）。
  function downloadCalendar() {
    if (!menu || !slot) return;
    const endTime = minutesToTime(timeToMinutes(slot.time) + menu.durationMinutes);
    const ics = buildIcs({
      uid: completedId,
      date, startTime: slot.time, endTime,
      title: `${store?.name ?? "LUXAS"} ${menu.name}`,
      description: `担当: ${assignedName}　受付番号: ${completedId.replace(/^reservation-?/, "")}`,
      location: store?.name
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `luxas-reservation-${date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <header className="mb-5">
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
              <div className="space-y-5">
                {groupedMenus.map(({ category: cat, items }) => (
                  <div key={cat} className="space-y-2">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-stone-600">
                      <span className={["inline-block h-3 w-3 rounded-sm border", menuColorStyle(items[0]?.color).bg, menuColorStyle(items[0]?.color).border].join(" ")} aria-hidden="true" />
                      {cat}
                      <span className="font-normal text-stone-400">（{items.length}件）</span>
                    </h3>
                    <ul className="space-y-2">
                      {items.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => { setMenuId(m.id); setNominatedStaffId(""); setNominationPicked(false); setSlot(null); setStep("datetime"); }}
                            className="flex w-full items-stretch gap-3 overflow-hidden rounded-lg border border-luxas-line bg-white text-left hover:border-luxas-green"
                          >
                            <span className={["w-1.5 shrink-0", menuColorStyle(m.color).bg].join(" ")} aria-hidden="true" />
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-md bg-luxas-mist text-[10px] text-stone-400" aria-hidden="true">写真</span>
                            <span className="min-w-0 flex-1 py-3">
                              <span className="block truncate text-sm font-medium text-luxas-ink">{m.name}</span>
                              {m.description ? (
                                <span className="block truncate text-xs text-stone-400">{m.description}</span>
                              ) : null}
                              <span className="mt-0.5 block text-xs text-stone-500">{m.durationMinutes}分</span>
                            </span>
                            <span className="shrink-0 self-center px-4 text-sm font-semibold text-luxas-ink">{formatCurrency(m.price)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
              onChange={(e) => { setDate(e.target.value); setSlot(null); setNominatedStaffId(""); setNominationPicked(false); }}
              className="mt-1 w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm outline-none focus:border-luxas-green"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-stone-600">指名</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Chip active={nominationPicked && nominatedStaffId === ""} onClick={() => pickNomination("")}>指名なし</Chip>
              {nominationStaff.map((s) => (
                <Chip key={s.id} active={nominationPicked && nominatedStaffId === s.id} onClick={() => pickNomination(s.id)}>{s.displayName}</Chip>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-stone-600">時間（空き枠）</span>
            {!nominationPicked ? (
              <p className="mt-1 rounded-md border border-dashed border-luxas-line bg-white p-3 text-sm text-stone-400">先に「指名」または「指名なし」を選ぶと、空き時間が表示されます。</p>
            ) : slots.length === 0 ? (
              <p className="mt-1 rounded-md border border-luxas-line bg-white p-3 text-sm text-stone-500">
                {date === toDateInputValue(new Date())
                  ? "本日の受付は終了しました。別の日付を選んでください。"
                  : "この指名・この日に空き枠がありません。指名や日付を変更してください。"}
              </p>
            ) : (
              <div className="mt-1 space-y-3">
                {groupSlotsByHalfDay(slots).map(({ label, items }) => (
                  <div key={label}>
                    <p className="mb-1 text-[11px] font-semibold text-stone-400">{label}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {items.map((sl) => (
                        <button
                          key={sl.time} type="button" onClick={() => setSlot(sl)}
                          className={["rounded-md border px-2 py-2 text-sm font-medium",
                            slot?.time === sl.time ? "border-luxas-green bg-luxas-mist text-luxas-green" : "border-luxas-line bg-white text-luxas-ink hover:border-luxas-green"].join(" ")}
                        >{sl.time}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button" disabled={!slot} onClick={() => setStep("info")}
            className="w-full rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >次へ（予約確認）</button>
        </section>
      )}

      {step === "info" && menu && slot && (
        <section className="space-y-4">
          <BackButton onClick={() => setStep("datetime")} />
          <div className="rounded-lg border border-luxas-line bg-white p-4 text-sm">
            <p className="font-medium text-luxas-ink">{menu.name}</p>
            <p className="text-xs text-stone-400">{menu.category}</p>
            <dl className="mt-2 space-y-1 text-stone-600">
              <div className="flex justify-between"><dt>日時</dt><dd className="text-luxas-ink">{date} {slot.time}〜{minutesToTime(timeToMinutes(slot.time) + menu.durationMinutes)}</dd></div>
              <div className="flex justify-between"><dt>所要時間</dt><dd className="text-luxas-ink">{menu.durationMinutes}分</dd></div>
              <div className="flex justify-between"><dt>担当</dt><dd className="text-luxas-ink">{assignedName}{nominatedStaffId ? "（指名）" : "（指名なし）"}</dd></div>
            </dl>
            <p className="mt-2 flex justify-between border-t border-luxas-line pt-2 text-base font-semibold text-luxas-ink"><span className="text-sm font-normal text-stone-500">料金</span>{formatCurrency(menu.price)}</p>
          </div>
          {member ? (
            <>
              <h2 className="text-sm font-semibold text-stone-700">3. 予約確認</h2>
              <div className="rounded-lg border border-luxas-line bg-white p-4 text-sm">
                <p className="text-xs text-stone-500">ご予約者</p>
                <p className="mt-1 font-medium text-luxas-ink">{member.name}</p>
                {member.phone && <p className="mt-0.5 text-stone-600">{member.phone}</p>}
                <p className="mt-2 text-[11px] text-stone-400">ログイン中のため、お客様情報の入力は不要です。</p>
              </div>
              <button type="button" onClick={confirm} className="w-full rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white">この内容で予約する</button>
            </>
          ) : guestStep === "gateway" ? (
            <>
              <h2 className="text-sm font-semibold text-stone-700">3. ログイン / 新規登録</h2>
              <p className="text-xs text-stone-500">ご予約にはログインまたは新規登録が必要です。</p>

              {/* ログイン（アカウントをお持ちの方） */}
              <div className="space-y-3 rounded-lg border border-luxas-line bg-white p-4">
                <p className="text-sm font-semibold text-luxas-ink">アカウントをお持ちの方</p>
                <Field label="メールアドレス"><input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputCls} placeholder="メールアドレス" inputMode="email" /></Field>
                <Field label="パスワード"><input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputCls} type="password" placeholder="パスワード" /></Field>
                <button type="button" onClick={handleGuestLogin} className="w-full rounded-md py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: PM_NAVY }}>ログイン</button>
              </div>

              {/* 新規登録（初めての方） */}
              <div className="rounded-lg border border-luxas-line bg-white p-4">
                <p className="text-sm font-semibold text-luxas-ink">初めてご利用のお客様</p>
                <button type="button" onClick={() => setGuestStep("register")} className="mt-3 w-full rounded-md border border-luxas-line py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist/50">新規登録</button>
              </div>

              {/* ソーシャル（アカウントで登録/ログイン） */}
              <div className="rounded-lg border border-luxas-line bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-luxas-ink">アカウントで登録 / ログイン</p>
                <div className="space-y-2">
                  <button type="button" onClick={() => signInWithProvider("google", storeId)} className="w-full rounded-md border border-luxas-line bg-white py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist/50">Googleで続ける</button>
                  <button type="button" onClick={() => signInWithProvider("apple", storeId)} className="w-full rounded-md border border-luxas-line bg-white py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist/50">Appleで続ける</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setGuestStep("gateway")} className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-luxas-ink"><ChevronLeft size={14} />ログイン / 新規登録に戻る</button>
              <h2 className="text-sm font-semibold text-stone-700">3. 新規登録（お客様情報）</h2>
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

              {/* 既存会員の照合結果（重複登録防止） */}
              {matchedCustomer && (
                <div className="rounded-md border border-luxas-green bg-luxas-mist/40 p-3 text-sm">
                  <p className="text-luxas-ink">登録済みのお客様が見つかりました：<span className="font-semibold">{matchedCustomer.name}</span> 様</p>
                  <p className="mt-0.5 text-xs text-stone-500">この方の会員情報で予約します（重複して登録しません）。</p>
                </div>
              )}

              <button type="button" onClick={confirm} className="w-full rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white">
                {matchedCustomer ? `${matchedCustomer.name} 様として予約する` : "この内容で登録して予約する"}
              </button>
            </>
          )}
        </section>
      )}

      {step === "done" && (
        <section className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-luxas-mist"><Check className="text-luxas-green" size={28} /></div>
          <h2 className="text-lg font-bold text-luxas-ink">ご予約を受け付けました</h2>
          <p className="text-sm text-stone-600">受付番号: <span className="font-mono">{completedId.replace(/^reservation-?/, "")}</span></p>
          <p className="text-xs text-stone-500">{store.name} ／ {date} {slot?.time}〜 ／ 担当 {assignedName}</p>

          {/* 予約確認メール（モック・実送信なし）。登録メール宛に送った体で内容を表示する。 */}
          <div className="mx-auto max-w-md rounded-lg border border-luxas-line bg-white p-4 text-left">
            {confirmedEmail ? (
              <p className="text-xs font-medium text-luxas-green">確認メールを <span className="font-mono">{confirmedEmail}</span> に送信しました</p>
            ) : (
              <p className="text-xs font-medium text-stone-500">メールアドレスのご登録がないため、確認メールは送信されません。</p>
            )}
            {(() => {
              const email = buildReservationEmail("confirm", {
                storeName: store.name,
                receiptNo: completedId.replace(/^reservation-?/, ""),
                menuName: menu?.name,
                dateTimeLabel: `${date} ${slot?.time ?? ""}〜${slot && menu ? minutesToTime(timeToMinutes(slot.time) + menu.durationMinutes) : ""}`,
                staffName: assignedName
              });
              return (
                <div className="mt-3 space-y-1 border-t border-luxas-line pt-3 text-xs text-stone-600">
                  <p className="font-semibold text-luxas-ink">{email.subject}</p>
                  {email.lines.map((ln, i) => (
                    <p key={i} className={i === email.lines.length - 1 ? "pt-1 text-[11px] text-stone-400" : ""}>{ln}</p>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={downloadCalendar}
              className="rounded-md border border-luxas-line bg-white px-4 py-2 text-sm font-medium text-luxas-ink hover:bg-luxas-mist/50">カレンダーに追加</button>
            <Link href={`/book/${storeId}/mypage/reservations`}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: PM_NAVY }}>マイページで予約を確認</Link>
            <button type="button" onClick={() => { setStep("menu"); setMenuId(""); setSlot(null); setNominatedStaffId(""); setNominationPicked(false); setInfo({ name: "", phone: "", email: "", gender: "unspecified" }); setGuestStep("gateway"); setLoginEmail(""); setLoginPassword(""); setConfirmedEmail(""); }}
              className="rounded-md border border-luxas-line bg-white px-4 py-2 text-sm font-medium text-stone-700">続けて予約する</button>
          </div>
        </section>
      )}
    </div>
  );
}

// 空き枠を午前/午後に分けて表示する（PM寄せ）。空のグループは返さない。
function groupSlotsByHalfDay(slots: OpenSlot[]): { label: string; items: OpenSlot[] }[] {
  const am: OpenSlot[] = [];
  const pm: OpenSlot[] = [];
  for (const s of slots) {
    (timeToMinutes(s.time) < 12 * 60 ? am : pm).push(s);
  }
  const groups: { label: string; items: OpenSlot[] }[] = [];
  if (am.length) groups.push({ label: "午前", items: am });
  if (pm.length) groups.push({ label: "午後", items: pm });
  return groups;
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
    { key: "menu", label: "メニュー選択" }, { key: "datetime", label: "日時選択" }, { key: "info", label: "予約確認" }, { key: "done", label: "予約完了" }
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
