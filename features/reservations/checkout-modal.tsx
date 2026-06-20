"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Wallet, X } from "lucide-react";
import {
  type CheckoutLine,
  type PaymentMethod,
  type Reservation,
  type ReservationPayment
} from "@/features/reservations/types";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  checkoutItemsStorageKey,
  computeReservationPricing,
  creditCardsStorageKey,
  emoneyStorageKey,
  initialCheckoutItems,
  initialCreditCards,
  initialEmoney,
  initialOptions,
  initialServices,
  initialStaff,
  optionsStorageKey,
  servicesStorageKey,
  staffStorageKey
} from "@/features/master-data/mock-data";
import type {
  CheckoutItem,
  CheckoutItemKind,
  CreditCardCompany,
  EmoneyBrand,
  ServiceMenu,
  ServiceOption,
  StaffMember
} from "@/features/master-data/types";
import { compareBySortOrder } from "@/features/master-data/utils";

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// 各区分の見た目と符号（会計金額への加減算）。
const CATEGORY_META: { kind: CheckoutItemKind; label: string; sign: 1 | -1; hint: string; needStaff: boolean }[] = [
  { kind: "discount", label: "割引", sign: -1, hint: "売上から−", needStaff: false },
  { kind: "ticketUse", label: "チケット利用", sign: -1, hint: "売上から−・担当紐付け", needStaff: true },
  { kind: "ticketSale", label: "チケット販売", sign: 1, hint: "預り金に＋", needStaff: false },
  { kind: "retail", label: "物販", sign: 1, hint: "売上に＋・担当紐付け", needStaff: true }
];

export function CheckoutModal({
  reservation,
  onClose,
  onSave
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onSave: (reservationId: string, saleAmount: number, payments: ReservationPayment[], checkoutLines: CheckoutLine[]) => void;
}) {
  // 登録済みコース合計（売上見込をプリフィル・編集可）。
  const [courseTotal, setCourseTotal] = useState("0");
  // 各支払方法の利用額（PM準拠）。
  const [ticket, setTicket] = useState("0");
  const [prepaid, setPrepaid] = useState("0");
  const [point, setPoint] = useState("0");
  const [giftcard, setGiftcard] = useState("0");
  const [credit, setCredit] = useState("0");
  const [creditBrand, setCreditBrand] = useState("");
  const [emoney, setEmoney] = useState("0");
  const [emoneyBrand, setEmoneyBrand] = useState("");
  const [epark, setEpark] = useState("0");
  const [cashReceived, setCashReceived] = useState("0");
  const [error, setError] = useState<string | null>(null);
  // 会計アイテム明細（物販/チケット販売/チケット利用/割引）。
  const [checkoutLines, setCheckoutLines] = useState<CheckoutLine[]>([]);
  // 登録済みコースに後から追加したコース（延長・施術後追加など）。合計は courseTotal に加算済み。
  const [extraCourses, setExtraCourses] = useState<{ name: string; price: number }[]>([]);
  const [showCoursePicker, setShowCoursePicker] = useState(false);

  const [creditCards] = useLocalCollection<CreditCardCompany>(creditCardsStorageKey, initialCreditCards);
  const [emoneyBrands] = useLocalCollection<EmoneyBrand>(emoneyStorageKey, initialEmoney);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [options] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const [checkoutItems] = useLocalCollection<CheckoutItem>(checkoutItemsStorageKey, initialCheckoutItems);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const activeCards = [...creditCards].sort(compareBySortOrder).filter((c) => c.isActive);
  const activeEmoney = [...emoneyBrands].sort(compareBySortOrder).filter((c) => c.isActive);
  const activeStaff = [...staff].sort(compareBySortOrder).filter((s) => s.isActive);
  const activeServices = [...services].sort(compareBySortOrder).filter((s) => s.isActive);
  const activeCheckoutItems = [...checkoutItems].sort(compareBySortOrder).filter((i) => i.isActive);

  // 区分ごとの合計（符号適用前の純額）。
  const sumByKind = (kind: CheckoutItemKind) =>
    checkoutLines.filter((l) => l.kind === kind).reduce((s, l) => s + l.amount * l.qty, 0);
  const linesNet =
    sumByKind("retail") + sumByKind("ticketSale") - sumByKind("ticketUse") - sumByKind("discount");

  useEffect(() => {
    if (!reservation) {
      return;
    }
    if (reservation.paymentStatus === "paid" && reservation.saleAmount != null) {
      const lines = reservation.checkoutLines ?? [];
      const net =
        lines.filter((l) => l.kind === "retail").reduce((s, l) => s + l.amount * l.qty, 0) +
        lines.filter((l) => l.kind === "ticketSale").reduce((s, l) => s + l.amount * l.qty, 0) -
        lines.filter((l) => l.kind === "ticketUse").reduce((s, l) => s + l.amount * l.qty, 0) -
        lines.filter((l) => l.kind === "discount").reduce((s, l) => s + l.amount * l.qty, 0);
      setCheckoutLines(lines);
      setExtraCourses([]);
      // saleAmount = コース + 会計アイテム純額。コース合計 = saleAmount − 純額。
      setCourseTotal(String(Math.max(0, reservation.saleAmount - net)));
      const p = reservation.payments ?? [];
      const sum = (m: PaymentMethod) => p.filter((x) => x.method === m).reduce((s, x) => s + x.amount, 0);
      setTicket(String(sum("ticket")));
      setPrepaid(String(sum("prepaid")));
      setPoint(String(sum("point")));
      setGiftcard(String(sum("giftcard")));
      setCredit(String(sum("credit")));
      setCreditBrand(p.find((x) => x.method === "credit")?.cardBrand ?? "");
      setEmoney(String(sum("emoney")));
      setEmoneyBrand(p.find((x) => x.method === "emoney")?.emoneyBrand ?? "");
      setEpark(String(sum("epark")));
      setCashReceived(String(sum("cash")));
      return;
    }
    const pricing = computeReservationPricing(
      services.find((s) => s.id === reservation.serviceMenuId)?.price ?? 0,
      reservation.optionIds,
      options,
      reservation.discountPercent,
      reservation.discountYen,
      reservation.bulkDiscountPercent,
      reservation.bulkDiscountYen
    );
    setCheckoutLines([]);
    setExtraCourses([]);
    setCourseTotal(String(pricing.net));
    // お預かりは初期空欄（受付で打ち込む）。
    setCashReceived("");
  }, [reservation, services, options]);

  if (!reservation) {
    return null;
  }

  const totalSales = toNum(courseTotal) + linesNet;
  const otherPaid = toNum(ticket) + toNum(prepaid) + toNum(point) + toNum(giftcard) + toNum(credit) + toNum(emoney) + toNum(epark);
  const cashDue = Math.max(0, totalSales - otherPaid);
  const change = Math.max(0, toNum(cashReceived) - cashDue);

  function addExtraCourse(service: ServiceMenu) {
    setExtraCourses((cur) => [...cur, { name: service.name, price: service.price ?? 0 }]);
    setCourseTotal((prev) => String(toNum(prev) + (service.price ?? 0)));
    setShowCoursePicker(false);
  }

  function removeExtraCourse(index: number) {
    const price = extraCourses[index]?.price ?? 0;
    setExtraCourses((cur) => cur.filter((_, i) => i !== index));
    setCourseTotal((prev) => String(Math.max(0, toNum(prev) - price)));
  }

  function addCheckoutItem(item: CheckoutItem) {
    setCheckoutLines((cur) => {
      const idx = cur.findIndex((l) => l.itemId === item.id);
      if (idx >= 0) {
        return cur.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
      }
      const needStaff = item.kind === "retail" || item.kind === "ticketUse";
      return [
        ...cur,
        { itemId: item.id, kind: item.kind, name: item.name, amount: item.amount, qty: 1, staffId: needStaff ? reservation?.staffId : undefined }
      ];
    });
  }

  function updateLine(index: number, patch: Partial<CheckoutLine>) {
    setCheckoutLines((cur) => cur.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setCheckoutLines((cur) => cur.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!reservation) {
      return;
    }
    if (otherPaid > totalSales) {
      setError(`現金以外の支払合計(¥${otherPaid.toLocaleString()})が総販売額(¥${totalSales.toLocaleString()})を超えています。`);
      return;
    }
    const payments: ReservationPayment[] = [];
    if (cashDue > 0) payments.push({ method: "cash", amount: cashDue });
    if (toNum(credit) > 0) payments.push({ method: "credit", amount: toNum(credit), cardBrand: creditBrand || undefined });
    if (toNum(emoney) > 0) payments.push({ method: "emoney", amount: toNum(emoney), emoneyBrand: emoneyBrand || undefined });
    if (toNum(ticket) > 0) payments.push({ method: "ticket", amount: toNum(ticket) });
    if (toNum(prepaid) > 0) payments.push({ method: "prepaid", amount: toNum(prepaid) });
    if (toNum(point) > 0) payments.push({ method: "point", amount: toNum(point) });
    if (toNum(giftcard) > 0) payments.push({ method: "giftcard", amount: toNum(giftcard) });
    if (toNum(epark) > 0) payments.push({ method: "epark", amount: toNum(epark) });
    if (payments.length === 0) payments.push({ method: "cash", amount: 0 });
    onSave(reservation.id, totalSales, payments, checkoutLines);
  }

  const selectedService = services.find((s) => s.id === reservation.serviceMenuId);
  const courseOptionNames = (reservation.optionIds ?? [])
    .map((id) => options.find((o) => o.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/35 px-4 py-6">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-luxas-line bg-white shadow-soft">
        <div className="flex shrink-0 items-center justify-between border-b border-luxas-line px-5 py-3">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">{reservation.customerName || "ゲスト"} 様</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_320px]">
          {/* 左：登録済みコース / 会計アイテム（4区分） */}
          <div className="space-y-4 border-luxas-line p-5 md:border-r">
            <section className="rounded-md border border-amber-200">
              <div className="flex items-center justify-between gap-2 rounded-t-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                <span>登録済みコース</span>
                <button
                  type="button"
                  onClick={() => setShowCoursePicker((v) => !v)}
                  title="コース・延長などを追加"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-amber-300 bg-white text-amber-800 transition hover:bg-amber-50"
                  aria-label="コースを追加"
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-2 bg-amber-50/40 p-4">
                {showCoursePicker ? (
                  <select
                    value=""
                    onChange={(e) => {
                      const svc = activeServices.find((s) => s.id === e.target.value);
                      if (svc) addExtraCourse(svc);
                    }}
                    className="w-full rounded-md border border-luxas-green bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                  >
                    <option value="">追加するコースを選択…</option>
                    {activeServices.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}（¥{(s.price ?? 0).toLocaleString()}）</option>
                    ))}
                  </select>
                ) : null}
                <div className="min-h-16 space-y-1.5 rounded-md border border-luxas-line bg-white p-3 text-sm text-stone-700">
                  {selectedService ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {selectedService.name}
                        {courseOptionNames.length ? `（${courseOptionNames.join("、")}）` : ""}
                      </span>
                      <span className="font-medium text-luxas-ink">¥{(selectedService.price ?? 0).toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-stone-400">コース未選択</span>
                  )}
                  {extraCourses.map((c, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 border-t border-luxas-line/60 pt-1.5">
                      <span className="min-w-0 flex-1 truncate">＋ {c.name}</span>
                      <span className="font-medium text-luxas-ink">¥{c.price.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => removeExtraCourse(index)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label="追加コースを削除"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 text-sm">
                  <span className="text-stone-600">合計:</span>
                  <input
                    type="number"
                    min="0"
                    value={courseTotal}
                    onChange={(e) => setCourseTotal(e.target.value)}
                    className="w-32 rounded-md border border-luxas-line bg-white px-2 py-1.5 text-right text-luxas-ink outline-none focus:border-luxas-green"
                  />
                  <span className="text-stone-600">円</span>
                </div>
              </div>
            </section>

            {CATEGORY_META.map((cat) => {
              const items = activeCheckoutItems.filter((i) => i.kind === cat.kind);
              const lineEntries = checkoutLines.map((l, i) => ({ l, i })).filter((e) => e.l.kind === cat.kind);
              const sum = sumByKind(cat.kind);
              return (
                <section key={cat.kind} className="rounded-md border border-amber-200">
                  <div className="flex items-center justify-between gap-2 rounded-t-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                    <span>{cat.label}<span className="ml-2 text-[11px] font-normal text-amber-800">{cat.hint}</span></span>
                    <span className="text-xs font-medium text-amber-800">{cat.sign < 0 ? "−" : "＋"}¥{sum.toLocaleString()}</span>
                  </div>
                  <div className="space-y-2 bg-amber-50/40 p-3">
                    <select
                      value=""
                      onChange={(e) => {
                        const item = items.find((i) => i.id === e.target.value);
                        if (item) addCheckoutItem(item);
                      }}
                      className="w-full rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                    >
                      <option value="">{cat.label}を選択して追加…</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>{i.name}（¥{i.amount.toLocaleString()}）</option>
                      ))}
                      {items.length === 0 ? <option value="" disabled>（会計アイテムマスタで登録してください）</option> : null}
                    </select>

                    {lineEntries.length > 0 ? (
                      <div className="space-y-1.5 rounded-md border border-luxas-line bg-white p-2">
                        {lineEntries.map(({ l, i }) => (
                          <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="min-w-0 flex-1 truncate text-luxas-ink">{l.name}</span>
                            {cat.needStaff ? (
                              <select
                                value={l.staffId ?? ""}
                                onChange={(e) => updateLine(i, { staffId: e.target.value || undefined })}
                                className="w-24 rounded-md border border-luxas-line bg-white px-1.5 py-1 text-xs text-luxas-ink outline-none focus:border-luxas-green"
                                aria-label="担当"
                              >
                                <option value="">担当</option>
                                {activeStaff.map((s) => (
                                  <option key={s.id} value={s.id}>{s.displayName}</option>
                                ))}
                              </select>
                            ) : null}
                            <input
                              type="number"
                              min="1"
                              value={l.qty}
                              onChange={(e) => updateLine(i, { qty: Math.max(1, Number(e.target.value)) })}
                              className="w-12 rounded-md border border-luxas-line bg-white px-1 py-1 text-right text-xs text-luxas-ink outline-none focus:border-luxas-green"
                              aria-label="数量"
                            />
                            <span className="w-20 text-right text-xs font-medium text-luxas-ink">{cat.sign < 0 ? "−" : ""}¥{(l.amount * l.qty).toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => removeLine(i)}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                              aria-label="削除"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>

          {/* 右：支払方法内訳 */}
          <div className="space-y-2.5 bg-luxas-paper/40 p-5 text-sm">
            <PayRow label="回数券利用" value={ticket} onChange={setTicket} />
            <PayRow label="プリペイド利用" value={prepaid} onChange={setPrepaid} />
            <PayRow label="ポイント利用" value={point} onChange={setPoint} />
            <PayRow label="商品券利用" value={giftcard} onChange={setGiftcard} />
            <PayRow
              label="クレジット"
              value={credit}
              onChange={setCredit}
              brand={{ value: creditBrand, onChange: setCreditBrand, options: activeCards.map((c) => c.name) }}
            />
            <PayRow
              label="電子マネー"
              value={emoney}
              onChange={setEmoney}
              brand={{ value: emoneyBrand, onChange: setEmoneyBrand, options: activeEmoney.map((b) => b.name) }}
            />
            <PayRow label="EPARKサービス" value={epark} onChange={setEpark} />

            <div className="my-2 border-t border-luxas-line" />

            <SummaryRow label="総販売額" value={totalSales} strong />
            <SummaryRow label="現金支払額" value={cashDue} strong />
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-luxas-ink">お預かり</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-28 rounded-md border border-luxas-line bg-white px-2 py-1.5 text-right text-luxas-ink outline-none focus:border-luxas-green"
                />
                <span className="text-stone-600">円</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-luxas-ink">お釣り</span>
              <span className="font-bold text-red-600">{change.toLocaleString()}円</span>
            </div>

            {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleSave}
              className="mt-2 w-full rounded-md bg-red-500 px-4 py-3 text-base font-bold text-white transition hover:bg-red-600"
            >
              会計
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PayRow({
  label,
  value,
  onChange,
  brand
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  brand?: { value: string; onChange: (v: string) => void; options: string[] };
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-stone-700">{label}:</span>
      <div className="flex items-center gap-1">
        {brand ? (
          <select
            value={brand.value}
            onChange={(e) => brand.onChange(e.target.value)}
            className="w-24 rounded-md border border-luxas-line bg-white px-1.5 py-1.5 text-xs text-luxas-ink outline-none focus:border-luxas-green"
            aria-label={`${label}種類`}
          >
            <option value="">種類</option>
            {brand.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : null}
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded-md border border-luxas-line bg-white px-2 py-1.5 text-right text-luxas-ink outline-none focus:border-luxas-green"
        />
        <span className="text-stone-600">円</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={strong ? "font-semibold text-luxas-ink" : "text-stone-700"}>{label}</span>
      <span className={strong ? "text-base font-bold text-luxas-ink" : "text-luxas-ink"}>{value.toLocaleString()} 円</span>
    </div>
  );
}
