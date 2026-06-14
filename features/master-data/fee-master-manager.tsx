"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type FeeMaster = { id: string; name: string; feePercent: number; sortOrder: number; isActive: boolean };
type FeeForm = { name: string; feePercent: string; sortOrder: string; isActive: boolean };
const emptyForm: FeeForm = { name: "", feePercent: "0", sortOrder: "10", isActive: true };

export function FeeMasterManager({
  title,
  description,
  storageKey,
  initial,
  idPrefix,
  nameLabel
}: {
  title: string;
  description: string;
  storageKey: string;
  initial: FeeMaster[];
  idPrefix: string;
  nameLabel: string;
}) {
  const [items, setItems] = useLocalCollection<FeeMaster>(storageKey, initial);
  const [form, setForm] = useState<FeeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name)) {
      setMessage({ type: "error", text: `${nameLabel}を入力してください。` });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      feePercent: Number(form.feePercent) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive
    };
    if (editingId) {
      setItems((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "更新しました。" });
    } else {
      setItems((current) => [{ id: makeLocalId(idPrefix), ...payload }, ...current]);
      setMessage({ type: "success", text: "追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: FeeMaster) {
    setEditingId(item.id);
    setForm({ name: item.name, feePercent: String(item.feePercent), sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "削除しました。" });
  }

  return (
    <MasterPage title={title} description={description}>
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "編集" : "追加"}</h2>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
                <RotateCcw size={14} aria-hidden="true" />
                解除
              </button>
            ) : null}
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label={nameLabel} value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} required />
            <TextField label="手数料率（%）" value={form.feePercent} onChange={(v) => setForm((c) => ({ ...c, feePercent: v }))} type="number" min="0" />
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
            <h2 className="text-base font-semibold text-luxas-ink">一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{items.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr>
                  <th className="px-5 py-3">{nameLabel}</th>
                  <th className="px-5 py-3">手数料率</th>
                  <th className="px-5 py-3">表示順</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {[...items].sort(compareBySortOrder).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.feePercent}%</td>
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
