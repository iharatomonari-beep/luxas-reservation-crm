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

// 6区分の見た目・符号・担当要否。左カラムの入力ブロックと右カラムの反映に使う。
const CATEGORY_META: { kind: CheckoutItemKind; label: string; sign: 1 | -1; hint: string; needStaff: boolean }[] = [
  { kind: "discount", label: "割引", sign: -1, hint: "売上から−", needStaff: false },
  { kind: "couponUse", label: "回数券利用", sign: -1, hint: "売上から−・担当紐付け", needStaff: true },
  { kind: "ticketUse", label: "チケット利用", sign: -1, hint: "売上から−・担当紐付け", needStaff: true },
  { kind: "couponSale", label: "回数券販売", sign: 1, hint: "預り金に＋", needStaff: false },
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
  const [courseTotal, setCourseTotal] = useState("0");
  const [extraCourses, setExtraCourses] = useState<{ name: string; price: number }[]>([]);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [checkoutLines, setCheckoutLines] = useState<CheckoutLine[]>([]);
  // 現金以外の支払（手入力）。
  const [credit, setCredit] = useState("0");
  const [creditBrand, setCreditBrand] = useState("");
  const [emoney, setEmoney] = useState("0");
  const [emoneyBrand, setEmoneyBrand] = useState("");
  const [pointUse, setPointUse] = useState("0"); // ポイント利用（手入力・−）
  const [cashReceived, setCashReceived] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [creditCards] = useLocalCollection<CreditCardCompany>(creditCardsStorageKey, initialCreditCards);
  const [emoneyBrands] = useLocalCollection<EmoneyBrand>(emoneyStorageKey, initialEmoney);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [options] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const [checkoutItems] = useLocalCollection<CheckoutItem>(checkoutItemsStorageKey, initialCheckoutItems);
  const [staff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const activeCards = [...creditCards].sort(compareBySortOrder).filter((c) => c.isActive);
  const activeEmoney = [...emoneyBrands].sort(compareBySortOrder).filter((e) => e.isActive);
  const activeStaff = [...staff].sort(compareBySortOrder).filter((s) => s.isActive);
  const activeServices = [...services].sort(compareBySortOrder).filter((s) => s.isActive);
  const activeCheckoutItems = [...checkoutItems].sort(compareBySortOrder).filter((i) => i.isActive);

  const sumByKind = (kind: CheckoutItemKind) =>
    checkoutLines.filter((l) => l.kind === kind).reduce((s, l) => s + l.amount * l.qty, 0);
  const plusItems = sumByKind("couponSale") + sumByKind("ticketSale") + sumByKind("retail");
  const minusItems = sumByKind("discount") + sumByKind("couponUse") + sumByKind("ticketUse");

  useEffect(() => {
    if (!reservation) {
      return;
    }
    if (reservation.paymentStatus === "paid" && reservation.saleAmount != null) {
      const lines = reservation.checkoutLines ?? [];
      const sk = (k: CheckoutItemKind) => lines.filter((l) => l.kind === k).reduce((s, l) => s + l.amount * l.qty, 0);
      const net = sk("couponSale") + sk("ticketSale") + sk("retail") - sk("discount") - sk("couponUse") - sk("ticketUse");
      setCheckoutLines(lines);
      setExtraCourses([]);
      setCourseTotal(String(Math.max(0, reservation.saleAmount - net)));
      const p = reservation.payments ?? [];
      const sum = (m: PaymentMethod) => p.filter((x) => x.method === m).reduce((s, x) => s + x.amount, 0);
      setCredit(String(sum("credit")));
      setCreditBrand(p.find((x) => x.method === "credit")?.cardBrand ?? "");
      setEmoney(String(sum("emoney")));
      setEmoneyBrand(p.find((x) => x.method === "emoney")?.emoneyBrand ?? "");
      setPointUse(String(sum("point")));
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
    setCashReceived("");
  }, [reservation, services, options]);

  if (!reservation) {
    return null;
  }

  const totalSales = toNum(courseTotal) + plusItems - minusItems;
  const otherPaid = toNum(credit) + toNum(emoney) + toNum(pointUse);
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
      const needStaff = item.kind === "retail" || item.kind === "couponUse" || item.kind === "ticketUse";
      return [...cur, { itemId: item.id, kind: item.kind, name: item.name, amount: item.amount, qty: 1, staffId: needStaff ? reservation?.staffId : undefined }];
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
    if (toNum(pointUse) > 0) payments.push({ method: "point", amount: toNum(pointUse) });
    if (payments.length === 0) payments.push({ method: "cash", amount: 0 });
    onSave(reservation.id, totalSales, payments, checkoutLines);
    // 会計確定後はモーダルを閉じる。台帳に戻ると「会計を確定しました」表示＋会計済み状態が見え、
    // 確定したかどうかが分かるようにする（別の「完了」ボタンは不要）。
    onClose();
  }

  const selectedService = services.find((s) => s.id === reservation.serviceMenuId);
  const courseOptionNames = (reservation.optionIds ?? [])
    .map((id) => options.find((o) => o.id === id)?.name)
    .filter((n): n is string => Boolean(n));

  const minusCats = CATEGORY_META.filter((c) => c.sign < 0);
  const plusCats = CATEGORY_META.filter((c) => c.sign > 0);

  function renderCategory(cat: (typeof CATEGORY_META)[number]) {
    const items = activeCheckoutItems.filter((i) => i.kind === cat.kind);
    const lineEntries = checkoutLines.map((l, i) => ({ l, i })).filter((e) => e.l.kind === cat.kind);
    const sum = sumByKind(cat.kind);
    return (
      <section key={cat.kind} className="flex h-full flex-col rounded-md border border-amber-200">
        <div className="flex items-center justify-between gap-2 rounded-t-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
          <span>{cat.label}</span>
          <span className="font-medium text-amber-800">{cat.sign < 0 ? "−" : "＋"}¥{sum.toLocaleString()}</span>
        </div>
        <div className="flex-1 space-y-1.5 rounded-b-md bg-amber-50/40 p-2">
          <select value="" onChange={(e) => { const item = items.find((i) => i.id === e.target.value); if (item) addCheckoutItem(item); }} className="w-full rounded-md border border-luxas-line bg-white px-2 py-1 text-xs text-luxas-ink outline-none focus:border-luxas-green">
            <option value="">{cat.label}を追加…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name}（¥{i.amount.toLocaleString()}）</option>
            ))}
          </select>
          {lineEntries.length > 0 ? (
            <div className="space-y-1 rounded-md border border-luxas-line bg-white p-1.5">
              {lineEntries.map(({ l, i }) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate text-luxas-ink">{l.name}</span>
                  {cat.needStaff ? (
                    <select value={l.staffId ?? ""} onChange={(e) => updateLine(i, { staffId: e.target.value || undefined })} className="w-20 rounded-md border border-luxas-line bg-white px-1 py-0.5 text-[11px] text-luxas-ink outline-none focus:border-luxas-green" aria-label="担当">
                      <option value="">担当</option>
                      {activeStaff.map((s) => (
                        <option key={s.id} value={s.id}>{s.displayName}</option>
                      ))}
                    </select>
                  ) : null}
                  <input type="number" min="1" value={l.qty} onChange={(e) => updateLine(i, { qty: Math.max(1, Number(e.target.value)) })} className="w-10 rounded-md border border-luxas-line bg-white px-1 py-0.5 text-right text-[11px] text-luxas-ink outline-none focus:border-luxas-green" aria-label="数量" />
                  <span className="w-16 text-right font-medium text-luxas-ink">{cat.sign < 0 ? "−" : ""}¥{(l.amount * l.qty).toLocaleString()}</span>
                  <button type="button" onClick={() => removeLine(i)} className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50" aria-label="削除">
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/35 px-4 py-4">
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-luxas-line bg-white shadow-soft">
        <div className="flex shrink-0 items-center justify-between border-b border-luxas-line px-5 py-2.5">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">{reservation.customerName || "ゲスト"} 様</h2>
          </div>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-luxas-line text-stone-600 hover:bg-luxas-paper" onClick={onClose} aria-label="閉じる">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_300px]">
          {/* 左＋中：登録済みコースは全幅、以下は左右ペアで高さを揃える */}
          <div className="grid grid-cols-1 content-start gap-2 p-3 md:grid-cols-2 md:border-r border-luxas-line">
            <section className="rounded-md border border-amber-200 md:col-span-2">
              <div className="flex items-center justify-between gap-2 rounded-t-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                <span>登録済みコース</span>
                <button type="button" onClick={() => setShowCoursePicker((v) => !v)} title="コース・延長などを追加" className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-amber-300 bg-white text-amber-800 transition hover:bg-amber-50" aria-label="コースを追加">
                  <Plus size={13} aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-1.5 rounded-b-md bg-amber-50/40 p-2">
                {showCoursePicker ? (
                  <select value="" onChange={(e) => { const svc = activeServices.find((s) => s.id === e.target.value); if (svc) addExtraCourse(svc); }} className="w-full rounded-md border border-luxas-green bg-white px-2 py-1 text-xs text-luxas-ink outline-none focus:border-luxas-green">
                    <option value="">追加するコースを選択…</option>
                    {activeServices.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}（¥{(s.price ?? 0).toLocaleString()}）</option>
                    ))}
                  </select>
                ) : null}
                <div className="space-y-1 rounded-md border border-luxas-line bg-white p-2 text-xs text-stone-700">
                  {selectedService ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate">{selectedService.name}{courseOptionNames.length ? `（${courseOptionNames.join("、")}）` : ""}</span>
                      <span className="font-medium text-luxas-ink">¥{(selectedService.price ?? 0).toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-stone-400">コース未選択</span>
                  )}
                  {extraCourses.map((c, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 border-t border-luxas-line/60 pt-1">
                      <span className="min-w-0 flex-1 truncate">＋ {c.name}</span>
                      <span className="font-medium text-luxas-ink">¥{c.price.toLocaleString()}</span>
                      <button type="button" onClick={() => removeExtraCourse(index)} className="inline-flex h-5 w-5 items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50" aria-label="追加コースを削除">
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1.5 text-xs">
                  <span className="text-stone-600">コース合計:</span>
                  <input type="number" min="0" value={courseTotal} onChange={(e) => setCourseTotal(e.target.value)} className="w-28 rounded-md border border-luxas-line bg-white px-2 py-1 text-right text-luxas-ink outline-none focus:border-luxas-green" />
                  <span className="text-stone-600">円</span>
                </div>
              </div>
            </section>
            {/* 各行で 割引↔回数券販売 / 回数券利用↔チケット販売 / チケット利用↔物販 を同じ高さで並べる */}
            {minusCats.flatMap((cat, i) => [renderCategory(cat), plusCats[i] ? renderCategory(plusCats[i]) : null])}
          </div>

          {/* 右：利用反映／支払／販売反映／サマリ */}
          <div className="space-y-1.5 bg-luxas-paper/40 p-3 text-sm">
            <p className="text-[11px] font-semibold text-stone-500">利用（販売額から−）</p>
            <ReflectRow label="回数券利用" value={sumByKind("couponUse")} sign={-1} />
            <ReflectRow label="チケット利用" value={sumByKind("ticketUse")} sign={-1} />
            <ReflectRow label="割引" value={sumByKind("discount")} sign={-1} />
            <PayRow label="ポイント利用" value={pointUse} onChange={setPointUse} />

            <div className="my-1 border-t border-luxas-line" />
            <p className="text-[11px] font-semibold text-stone-500">支払（現金以外）</p>
            <PayRow label="クレジット" value={credit} onChange={setCredit} brand={{ value: creditBrand, onChange: setCreditBrand, options: activeCards.map((c) => c.name) }} />
            <PayRow label="電子マネー" value={emoney} onChange={setEmoney} brand={{ value: emoneyBrand, onChange: setEmoneyBrand, options: activeEmoney.map((e) => e.name) }} />

            <div className="my-1 border-t border-luxas-line" />
            <p className="text-[11px] font-semibold text-stone-500">販売（販売額に＋）</p>
            <ReflectRow label="回数券販売" value={sumByKind("couponSale")} sign={1} />
            <ReflectRow label="チケット販売" value={sumByKind("ticketSale")} sign={1} />
            <ReflectRow label="物販" value={sumByKind("retail")} sign={1} />

            <div className="my-1.5 border-t border-luxas-line" />
            <SummaryRow label="総販売額" value={totalSales} strong />
            <SummaryRow label="現金支払額" value={cashDue} strong />
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-luxas-ink">現金お預かり</span>
              <div className="flex items-center gap-1">
                <input type="number" min="0" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-24 rounded-md border border-luxas-line bg-white px-2 py-1 text-right text-luxas-ink outline-none focus:border-luxas-green" />
                <span className="text-stone-600">円</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-luxas-ink">お釣り</span>
              <span className="font-bold text-red-600">{change.toLocaleString()}円</span>
            </div>

            {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

            <button type="button" onClick={handleSave} className="mt-1.5 w-full rounded-md bg-red-500 px-4 py-2.5 text-base font-bold text-white transition hover:bg-red-600">
              会計
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReflectRow({ label, value, sign }: { label: string; value: number; sign: 1 | -1 }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-stone-700">{label}:</span>
      <span className={value > 0 ? (sign < 0 ? "font-medium text-red-600" : "font-medium text-luxas-ink") : "text-stone-400"}>
        {sign < 0 ? "−" : "＋"}¥{value.toLocaleString()}
      </span>
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
          <select value={brand.value} onChange={(e) => brand.onChange(e.target.value)} className="w-24 rounded-md border border-luxas-line bg-white px-1.5 py-1.5 text-xs text-luxas-ink outline-none focus:border-luxas-green" aria-label={`${label}種類`}>
            <option value="">種類</option>
            {brand.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : null}
        <input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 rounded-md border border-luxas-line bg-white px-2 py-1.5 text-right text-luxas-ink outline-none focus:border-luxas-green" />
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
