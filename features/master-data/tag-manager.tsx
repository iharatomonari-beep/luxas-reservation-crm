"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialTags, tagsStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { tagKindLabels, type MasterTag, type TagKind } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

const KINDS: TagKind[] = ["customer", "route", "karte"];

type TagForm = { name: string; code: string; sortOrder: string; isActive: boolean };
const emptyForm: TagForm = { name: "", code: "", sortOrder: "10", isActive: true };

export function TagManager() {
  const [tags, setTags] = useLocalCollection<MasterTag>(tagsStorageKey, initialTags);
  const [kind, setKind] = useState<TagKind>("customer");
  const [form, setForm] = useState<TagForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  const shown = tags.filter((t) => t.kind === kind).sort(compareBySortOrder);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBlank(form.name)) {
      setMessage({ type: "error", text: "タグ名を入力してください。" });
      return;
    }
    const payload = {
      name: normalizeText(form.name),
      code: normalizeText(form.code),
      sortOrder: Number(form.sortOrder) || 0,
      kind,
      isActive: form.isActive
    };
    if (editingId) {
      setTags((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "タグを更新しました。" });
    } else {
      setTags((current) => [{ id: makeLocalId("tag"), ...payload }, ...current]);
      setMessage({ type: "success", text: "タグを追加しました。" });
    }
    resetForm();
  }

  function handleEdit(item: MasterTag) {
    setEditingId(item.id);
    setForm({ name: item.name, code: item.code, sortOrder: String(item.sortOrder), isActive: item.isActive });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setTags((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: "タグを削除しました。" });
  }

  return (
    <MasterPage title="タグ管理" description="顧客タグ／予約ルートタグ／施術カルテタグを管理します。予約受付や顧客検索で参照します。">
      <div className="mb-4 inline-flex overflow-hidden rounded-md border border-luxas-line">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              resetForm();
            }}
            className={["px-4 py-2 text-sm font-medium transition", kind === k ? "bg-luxas-green text-white" : "bg-white text-stone-600 hover:bg-luxas-paper"].join(" ")}
          >
            {tagKindLabels[k]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">
              {editingId ? "タグを編集" : "タグを追加"}（{tagKindLabels[kind]}）
            </h2>
            {editingId ? (
              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper" onClick={resetForm}>
                <RotateCcw size={14} aria-hidden="true" />
                解除
              </button>
            ) : null}
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField label="タグ名" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} placeholder="例: VIP / Instagram" required />
            <TextField label="管理コード（任意）" value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} placeholder="例: IG" />
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
            <h2 className="text-base font-semibold text-luxas-ink">{tagKindLabels[kind]}一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{shown.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold text-stone-500">
                <tr>
                  <th className="px-5 py-3">タグ名</th>
                  <th className="px-5 py-3">コード</th>
                  <th className="px-5 py-3">表示順</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.code || "—"}</td>
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
