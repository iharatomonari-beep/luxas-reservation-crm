"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Wallet, X } from "lucide-react";
import {
  paymentMethodLabels,
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

const METHOD_ORDER: PaymentMethod[] = ["cash", "credit", "emoney", "ticket", "prepaid", "point", "giftcard", "epark"];

export function CheckoutModal({
  reservation,
  onClose,
  onSave
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onSave: (reservationId: string, saleAmount: number, payments: ReservationPayment[]) => void;
}) {
  const [saleAmount, setSaleAmount] = useState<string>("0");
  const [payments, setPayments] = useState<ReservationPayment[]>([{ method: "cash", amount: 0 }]);
  const [error, setError] = useState<string | null>(null);
  // 支払種類（クレカ/電子マネー）は決済マスタ（T029）の有効項目から選ぶ（T033）。
  const [creditCards] = useLocalCollection<CreditCardCompany>(creditCardsStorageKey, initialCreditCards);
  const [emoneyBrands] = useLocalCollection<EmoneyBrand>(emoneyStorageKey, initialEmoney);
  // 売上見込のプリフィル（T041）に使うメニュー/オプションマスタ。
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [options] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const activeCards = [...creditCards].sort(compareBySortOrder).filter((c) => c.isActive);
  const activeEmoney = [...emoneyBrands].sort(compareBySortOrder).filter((c) => c.isActive);

  // 会計を開いたら売上額を初期化（T041）。会計済の修正時は既存値を復元、未会計は売上見込（T037と一致）をプリフィル。
  useEffect(() => {
    if (!reservation) {
      return;
    }
    if (reservation.paymentStatus === "paid" && reservation.saleAmount != null) {
      setSaleAmount(String(reservation.saleAmount));
      setPayments(
        reservation.payments && reservation.payments.length > 0
          ? reservation.payments
          : [{ method: "cash", amount: reservation.saleAmount }]
      );
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
    setSaleAmount(String(pricing.net));
    setPayments([{ method: "cash", amount: pricing.net }]);
  }, [reservation, services, options]);

  if (!reservation) {
    return null;
  }

  const paymentsTotal = payments.reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0);

  function updatePayment(index: number, patch: Partial<ReservationPayment>) {
    setPayments((current) => current.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  // 支払方法を切り替えたら、対応しないブランド指定はクリアする。
  function changeMethod(index: number, method: PaymentMethod) {
    updatePayment(index, {
      method,
      cardBrand: method === "credit" ? activeCards[0]?.name : undefined,
      emoneyBrand: method === "emoney" ? activeEmoney[0]?.name : undefined
    });
  }

  function handleSave() {
    if (!reservation) {
      return;
    }
    const sale = Number(saleAmount);
    if (!Number.isFinite(sale) || sale < 0) {
      setError("売上額は0以上の数値で入力してください。");
      return;
    }
    if (payments.some((p) => !Number.isFinite(p.amount) || p.amount < 0)) {
      setError("支払金額は0以上の数値で入力してください。");
      return;
    }
    if (paymentsTotal !== sale) {
      setError(`支払合計(¥${paymentsTotal.toLocaleString()})が売上額(¥${sale.toLocaleString()})と一致しません。`);
      return;
    }
    onSave(reservation.id, sale, payments);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/35 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-luxas-line bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-luxas-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-luxas-green" aria-hidden="true" />
            <h2 className="text-base font-semibold text-luxas-ink">会計：{reservation.customerName}</h2>
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

        <div className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">売上額（円）</span>
            <input
              type="number"
              min="0"
              value={saleAmount}
              onChange={(event) => setSaleAmount(event.target.value)}
              className="mt-2 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium text-stone-700">支払方法（複数可）</span>
            {payments.map((payment, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-luxas-line bg-white px-2 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                  value={payment.method}
                  onChange={(event) => changeMethod(index, event.target.value as PaymentMethod)}
                >
                  {METHOD_ORDER.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
                {payment.method === "credit" ? (
                  <select
                    className="rounded-md border border-luxas-line bg-white px-2 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                    value={payment.cardBrand ?? ""}
                    onChange={(event) => updatePayment(index, { cardBrand: event.target.value || undefined })}
                    aria-label="クレジット会社"
                  >
                    <option value="">カード会社</option>
                    {activeCards.map((card) => (
                      <option key={card.id} value={card.name}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                {payment.method === "emoney" ? (
                  <select
                    className="rounded-md border border-luxas-line bg-white px-2 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                    value={payment.emoneyBrand ?? ""}
                    onChange={(event) => updatePayment(index, { emoneyBrand: event.target.value || undefined })}
                    aria-label="電子マネー種類"
                  >
                    <option value="">電子マネー</option>
                    {activeEmoney.map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="number"
                  min="0"
                  value={payment.amount}
                  onChange={(event) => updatePayment(index, { amount: Number(event.target.value) })}
                  className="w-28 rounded-md border border-luxas-line bg-white px-2 py-1.5 text-sm text-luxas-ink outline-none focus:border-luxas-green"
                  placeholder="金額"
                />
                {payments.length > 1 ? (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setPayments((current) => current.filter((_, i) => i !== index))}
                    aria-label="削除"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
              onClick={() => setPayments((current) => [...current, { method: "cash", amount: 0 }])}
            >
              <Plus size={14} aria-hidden="true" />
              支払方法を追加
            </button>
          </div>

          <p className="text-sm text-stone-600">
            支払合計: <b className="text-luxas-ink">¥{paymentsTotal.toLocaleString()}</b>
          </p>
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-luxas-line bg-luxas-paper px-5 py-4">
          <button
            type="button"
            className="rounded-md border border-luxas-line bg-white px-4 py-2.5 text-sm font-semibold text-luxas-ink hover:bg-luxas-mist"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-luxas-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            onClick={handleSave}
          >
            <Wallet size={16} aria-hidden="true" />
            会計を確定
          </button>
        </div>
      </section>
    </div>
  );
}
