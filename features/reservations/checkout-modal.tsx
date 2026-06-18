"use client";

import { useEffect, useState } from "react";
import { Wallet, X } from "lucide-react";
import {
  type PaymentMethod,
  type Reservation,
  type ReservationPayment
} from "@/features/reservations/types";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  computeReservationPricing,
  creditCardsStorageKey,
  emoneyStorageKey,
  initialCreditCards,
  initialEmoney,
  initialOptions,
  initialServices,
  optionsStorageKey,
  servicesStorageKey
} from "@/features/master-data/mock-data";
import type { CreditCardCompany, EmoneyBrand, ServiceMenu, ServiceOption } from "@/features/master-data/types";
import { compareBySortOrder } from "@/features/master-data/utils";

function toNum(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function CheckoutModal({
  reservation,
  onClose,
  onSave
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onSave: (reservationId: string, saleAmount: number, payments: ReservationPayment[]) => void;
}) {
  // 登録済みコース合計（売上見込をプリフィル・編集可）。
  const [courseTotal, setCourseTotal] = useState("0");
  // 各支払方法の利用額（PM準拠）。
  const [ticket, setTicket] = useState("0"); // 回数券利用
  const [prepaid, setPrepaid] = useState("0"); // プリペイド利用
  const [point, setPoint] = useState("0"); // ポイント利用
  const [giftcard, setGiftcard] = useState("0"); // 商品券利用
  const [credit, setCredit] = useState("0");
  const [creditBrand, setCreditBrand] = useState("");
  const [emoney, setEmoney] = useState("0");
  const [emoneyBrand, setEmoneyBrand] = useState("");
  const [epark, setEpark] = useState("0");
  const [cashReceived, setCashReceived] = useState("0"); // お預かり
  const [error, setError] = useState<string | null>(null);

  const [creditCards] = useLocalCollection<CreditCardCompany>(creditCardsStorageKey, initialCreditCards);
  const [emoneyBrands] = useLocalCollection<EmoneyBrand>(emoneyStorageKey, initialEmoney);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [options] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const activeCards = [...creditCards].sort(compareBySortOrder).filter((c) => c.isActive);
  const activeEmoney = [...emoneyBrands].sort(compareBySortOrder).filter((c) => c.isActive);

  useEffect(() => {
    if (!reservation) {
      return;
    }
    if (reservation.paymentStatus === "paid" && reservation.saleAmount != null) {
      setCourseTotal(String(reservation.saleAmount));
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
    setCourseTotal(String(pricing.net));
    setCashReceived(String(pricing.net));
  }, [reservation, services, options]);

  if (!reservation) {
    return null;
  }

  const totalSales = toNum(courseTotal);
  const otherPaid = toNum(ticket) + toNum(prepaid) + toNum(point) + toNum(giftcard) + toNum(credit) + toNum(emoney) + toNum(epark);
  const cashDue = Math.max(0, totalSales - otherPaid); // 現金支払額
  const change = Math.max(0, toNum(cashReceived) - cashDue); // お釣り

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
    onSave(reservation.id, totalSales, payments);
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
          {/* 左：登録済みコース / 物販購入 */}
          <div className="space-y-4 border-luxas-line p-5 md:border-r">
            <section className="rounded-md border border-amber-200">
              <div className="flex items-center justify-between gap-2 rounded-t-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                <span>登録済みコース</span>
                <span className="text-xs font-medium text-amber-800">コース個別値引一括設定</span>
              </div>
              <div className="space-y-2 bg-amber-50/40 p-4">
                <div className="min-h-24 rounded-md border border-luxas-line bg-white p-3 text-sm text-stone-700">
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

            <section className="rounded-md border border-amber-200">
              <div className="flex items-center gap-2 rounded-t-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                <span>物販購入</span>
                <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-medium text-amber-800">準備中</span>
              </div>
              <div className="bg-amber-50/40 p-4 text-sm text-stone-400">
                <div className="min-h-16 rounded-md border border-luxas-line bg-white p-3">物販の追加は次工程で対応します。</div>
              </div>
            </section>
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
