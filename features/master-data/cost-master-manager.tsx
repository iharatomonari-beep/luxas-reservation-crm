"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { expenseAccountsStorageKey, initialExpenseAccounts, type ExpenseAccount } from "@/features/master-data/cost-master";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type AccForm = { name: string; subName: string; sortOrder: string; isActive: boolean };
const emptyForm: AccForm = { name: "", subName: "", sortOrder: "10", isActive: true };

export function CostMasterManager() {
  const [accounts, setAccounts] = useLocalCollection<ExpenseAccount>(expenseAccountsStorageKey, initialExpenseAccounts);
  const [form, setForm] = useState<AccForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name)) {
      setMessage({ type: "error", text: "勘定科目名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      subName: normalizeText(form.subName),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive
    };
    if (editingId) {
      setAccounts((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "勘定科目を更新しました。" });
    } else {
      setAccounts((current) => [{ id: makeLocalId("acc"), ...payload }, ...current]);
      setMessage({ type: "success", text: "勘定科目を追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: ExpenseAccount) {
    setEditingId(item.id);
    setForm({ name: item.name, subName: item.subName, sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setAccounts((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "勘定科目を削除しました。" });
  }

  return (
    <MasterPage title="経費マスタ（勘定科目）" description="経費登録で使う勘定科目・補助科目を管理します。">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "科目を編集" : "科目を追加"}</h2>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
                <RotateCcw size={14} aria-hidden="true" />
                解除
              </button>
            ) : null}
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label="勘定科目" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: 消耗品費" required />
            <TextField label="補助科目（任意）" value={form.subName} onChange={(v) => setForm((c) => ({ ...c, subName: v }))} placeholder="例: 備品" />
            <TextField label="表示順" value={form.sortOrder} onChange={(v) => setForm((c) => ({ ...c, sortOrder: v }))} type="number" min="0" />
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
            <h2 className="text-base font-semibold text-luxas-ink">勘定科目一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{accounts.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr>
                  <th className="px-5 py-3">勘定科目</th>
                  <th className="px-5 py-3">補助科目</th>
                  <th className="px-5 py-3">表示順</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {[...accounts].sort(compareBySortOrder).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.subName || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.sortOrder}</td>
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
