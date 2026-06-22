"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SelectField, TextField } from "@/features/master-data/form-controls";
import {
  initialRetailItems,
  initialRetailSales,
  retailItemsStorageKey,
  retailSalesStorageKey
} from "@/features/master-data/mock-data";
import { MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { RetailItem, RetailSale } from "@/features/master-data/types";
import { compareBySortOrder, formatCurrency, makeLocalId } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { filterRecordsByStore } from "@/features/master-data/store-record-scope";
import { useCurrentStore } from "@/features/org/use-current-store";
import { toDateInputValue } from "@/features/reservations/date-utils";

type SaleForm = { saleDate: string; customerName: string; retailItemId: string; quantity: string; unitPrice: string };

function createEmptyForm(): SaleForm {
  return { saleDate: toDateInputValue(new Date()), customerName: "", retailItemId: "", quantity: "1", unitPrice: "0" };
}

export function RetailSales() {
  const [items] = useLocalCollection<RetailItem>(retailItemsStorageKey, initialRetailItems);
  const [sales, setSales] = useLocalCollection<RetailSale>(retailSalesStorageKey, initialRetailSales);
  const { currentStoreId } = useCurrentStore();
  const [form, setForm] = useState<SaleForm>(createEmptyForm);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  const activeItems = useMemo(() => [...items].sort(compareBySortOrder).filter((i) => i.isActive), [items]);
  const itemNameById = useMemo(() => new Map(items.map((i) => [i.id, i.name])), [items]);

  // 現在店舗の物販販売のみ表示・集計する（未設定の既存データは既定店舗扱い）。
  const storeSales = useMemo(() => filterRecordsByStore(sales, currentStoreId), [sales, currentStoreId]);

  const sortedSales = useMemo(
    () =>
      [...storeSales].sort((a, b) => {
        if (a.saleDate !== b.saleDate) return a.saleDate < b.saleDate ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      }),
    [storeSales]
  );

  const formSubtotal = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);
  const totalSales = storeSales.reduce((sum, sale) => sum + sale.quantity * sale.unitPrice, 0);

  function handleItemChange(retailItemId: string) {
    const selected = items.find((i) => i.id === retailItemId);
    setForm((c) => ({ ...c, retailItemId, unitPrice: selected ? String(selected.price) : c.unitPrice }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.retailItemId) {
      setMessage({ type: "error", text: "物販商品を選択してください。" });
      return;
    }
    const quantity = Number(form.quantity) || 0;
    if (quantity <= 0) {
      setMessage({ type: "error", text: "数量は1以上を入力してください。" });
      return;
    }
    const sale: RetailSale = {
      id: makeLocalId("retail-sale"),
      storeId: currentStoreId,
      saleDate: form.saleDate,
      customerName: form.customerName.trim(),
      retailItemId: form.retailItemId,
      quantity,
      unitPrice: Number(form.unitPrice) || 0
    };
    setSales((current) => [sale, ...current]);
    setMessage({ type: "success", text: "物販販売を登録しました。" });
    setForm((c) => ({ ...createEmptyForm(), saleDate: c.saleDate }));
  }

  function handleDelete(id: string) {
    setSales((current) => current.filter((sale) => sale.id !== id));
    setMessage({ type: "success", text: "物販販売を削除しました。" });
  }

  return (
    <MasterPage title="物販販売" description="店頭での物販販売を登録し、明細を一覧します。会計（レジ）との結合は今後対応予定です。">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-luxas-ink">物販販売を登録</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label="販売日" value={form.saleDate} onChange={(v) => setForm((c) => ({ ...c, saleDate: v }))} type="date" required />
            <TextField label="顧客名（任意）" value={form.customerName} onChange={(v) => setForm((c) => ({ ...c, customerName: v }))} placeholder="例: 山田 花子" />
            <SelectField label="物販商品" value={form.retailItemId} onChange={handleItemChange}>
              <option value="">選択してください</option>
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}（{formatCurrency(item.price)}）
                </option>
              ))}
            </SelectField>
            <TextField label="数量" value={form.quantity} onChange={(v) => setForm((c) => ({ ...c, quantity: v }))} type="number" min="1" />
            <TextField label="単価（円）" value={form.unitPrice} onChange={(v) => setForm((c) => ({ ...c, unitPrice: v }))} type="number" min="0" hint="商品選択で自動入力されます。変更も可能です。" />
            <div className="flex items-center justify-between rounded-md border border-luxas-line bg-luxas-paper px-3 py-2.5">
              <span className="text-sm font-medium text-stone-700">売上小計</span>
              <span className="text-base font-semibold text-luxas-ink">{formatCurrency(formSubtotal)}</span>
            </div>
            <StatusMessage message={message} />
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
              <Plus size={17} aria-hidden="true" />
              登録する
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-luxas-line bg-white">
          <div className="flex items-center justify-between border-b border-luxas-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-luxas-ink">物販販売明細</h2>
              <p className="mt-1 text-sm text-stone-500">{sales.length}件</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-stone-500">売上合計</p>
              <p className="text-lg font-semibold text-luxas-ink">{formatCurrency(totalSales)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr>
                  <th className="px-5 py-3">販売日</th>
                  <th className="px-5 py-3">顧客</th>
                  <th className="px-5 py-3">物販商品</th>
                  <th className="px-5 py-3 text-right">数量</th>
                  <th className="px-5 py-3 text-right">単価</th>
                  <th className="px-5 py-3 text-right">小計</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {sortedSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{sale.saleDate}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{sale.customerName || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{itemNameById.get(sale.retailItemId) ?? "（削除済み商品）"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-stone-700">{sale.quantity}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-stone-700">{formatCurrency(sale.unitPrice)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-luxas-ink">{formatCurrency(sale.quantity * sale.unitPrice)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(sale.id)}>
                        <Trash2 size={14} aria-hidden="true" />
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-stone-500">物販販売の登録がありません。</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MasterPage>
  );
}
