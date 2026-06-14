"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { categoriesStorageKey, initialCategories, initialOptions, optionsStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { optionKindLabels, type MenuCategory, type OptionKind, type ServiceOption } from "@/features/master-data/types";
import { compareBySortOrder, formatCurrency, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type OptionForm = {
  name: string;
  category: string;
  price: string;
  sortOrder: string;
  onlineBookable: boolean;
  kind: OptionKind;
  extensionMinutes: string;
  discountPercent: string;
  isActive: boolean;
};

const emptyForm: OptionForm = {
  name: "",
  category: "オプション",
  price: "0",
  sortOrder: "10",
  onlineBookable: true,
  kind: "extension",
  extensionMinutes: "15",
  discountPercent: "0",
  isActive: true
};

export function OptionManager() {
  const [options, setOptions] = useLocalCollection<ServiceOption>(optionsStorageKey, initialOptions);
  const [categories] = useLocalCollection<MenuCategory>(categoriesStorageKey, initialCategories);
  const [form, setForm] = useState<OptionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name)) {
      setMessage({ type: "error", text: "オプション名を入力してください。" });
      return;
    }
    const payload: Omit<ServiceOption, "id"> = {
      name: normalizeText(form.name),
      category: form.category,
      price: Number(form.price) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      onlineBookable: form.onlineBookable,
      kind: form.kind,
      extensionMinutes: form.kind === "extension" ? Number(form.extensionMinutes) || 0 : undefined,
      discountPercent: form.kind === "discount" ? Number(form.discountPercent) || 0 : undefined,
      isActive: form.isActive
    };
    if (editingId) {
      setOptions((current) => current.map((item) => (item.id === editingId ? { id: item.id, ...payload } : item)));
      setMessage({ type: "success", text: "オプションを更新しました。" });
    } else {
      setOptions((current) => [{ id: makeLocalId("option"), ...payload }, ...current]);
      setMessage({ type: "success", text: "オプションを追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: ServiceOption) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      sortOrder: String(item.sortOrder),
      onlineBookable: item.onlineBookable,
      kind: item.kind,
      extensionMinutes: String(item.extensionMinutes ?? 15),
      discountPercent: String(item.discountPercent ?? 0),
      isActive: item.isActive
    });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setOptions((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "オプションを削除しました。" });
  }

  return (
    <MasterPage title="オプション商品管理" description="延長・割引などのオプション商品を管理します。予約受付の参照元になります。">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "オプションを編集" : "オプションを追加"}</h2>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
                <RotateCcw size={14} aria-hidden="true" />
                解除
              </button>
            ) : null}
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label="オプション名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 延長15分" required />
            <SelectField label="カテゴリ" value={form.category} onChange={(v) => setForm((c) => ({ ...c, category: v }))}>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="料金（税込）" value={form.price} onChange={(v) => setForm((c) => ({ ...c, price: v }))} type="number" min="0" />
              <TextField label="表示順" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
            </div>
            <SelectField label="種別" value={form.kind} onChange={(v) => setForm((c) => ({ ...c, kind: v as OptionKind }))}>
              <option value="extension">延長（時間＋料金）</option>
              <option value="discount">割引（%）</option>
              <option value="other">その他</option>
            </SelectField>
            {form.kind === "extension" ? (
              <TextField label="延長（分）" value={form.extensionMinutes} onChange={(v) => setForm((c) => ({ ...c, extensionMinutes: v }))} type="number" min="0" />
            ) : null}
            {form.kind === "discount" ? (
              <TextField label="割引率（%）" value={form.discountPercent} onChange={(v) => setForm((c) => ({ ...c, discountPercent: v }))} type="number" min="0" />
            ) : null}
            <ToggleField label="オンライン予約可" checked={form.onlineBookable} onChange={(v) => setForm((c) => ({ ...c, onlineBookable: v }))} />
            <ToggleField label="有効にする" checked={form.isActive} onChange={(v) => setForm((c) => ({ ...c, isActive: v }))} />
            <StatusMessage message={message} />
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-luxas-line bg-white">
          <div className="border-b border-luxas-line px-5 py-4">
            <h2 className="text-base font-semibold text-luxas-ink">オプション一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{options.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr>
                  <th className="px-5 py-3">名称</th>
                  <th className="px-5 py-3">カテゴリ</th>
                  <th className="px-5 py-3">種別</th>
                  <th className="px-5 py-3">料金</th>
                  <th className="px-5 py-3">オンライン</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {[...options].sort(compareBySortOrder).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.category}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">
                      {optionKindLabels[item.kind]}
                      {item.kind === "extension" && item.extensionMinutes ? `(${item.extensionMinutes}分)` : ""}
                      {item.kind === "discount" && item.discountPercent ? `(${item.discountPercent}%)` : ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{formatCurrency(item.price)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.onlineBookable ? "可" : "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <ActiveBadge isActive={item.isActive} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={() => handleEdit(item)}>
                          <Pencil size={14} aria-hidden="true" />
                          編集
                        </button>
                        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={14} aria-hidden="true" />
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MasterPage>
  );
}
