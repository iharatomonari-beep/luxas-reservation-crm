"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialRooms, roomsStorageKey } from "@/features/master-data/mock-data";
import { MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { roomKindLabels, type RoomKind, type ServiceRoom } from "@/features/master-data/types";
import { isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type RoomForm = {
  name: string;
  kind: RoomKind;
  memo: string;
  isActive: boolean;
};

const emptyForm: RoomForm = {
  name: "",
  kind: "treatment",
  memo: "",
  isActive: true
};

const roomKinds = Object.entries(roomKindLabels) as [RoomKind, string][];

export function RoomManager() {
  const [rooms, setRooms] = useLocalCollection<ServiceRoom>(roomsStorageKey, initialRooms);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function validate() {
    if (isBlank(form.name)) {
      return "ブース名を入力してください。";
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validate();

    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }

    const payload = {
      name: normalizeText(form.name),
      kind: form.kind,
      memo: normalizeText(form.memo),
      isActive: form.isActive
    };

    if (editingId) {
      setRooms((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "ブース情報を更新しました。" });
    } else {
      setRooms((current) => [{ id: makeLocalId("room"), ...payload }, ...current]);
      setMessage({ type: "success", text: "ブースを追加しました。" });
    }

    resetForm();
  }

  function handleEdit(item: ServiceRoom) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      kind: item.kind,
      memo: item.memo ?? "",
      isActive: item.isActive
    });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setRooms((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }

    setMessage({ type: "success", text: "ブースを削除しました。" });
  }

  return (
    <MasterPage
      title="ブース管理"
      description="施術ブース、個室、カウンセリングスペースなど、予約割り当てに使う場所を管理します。"
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">
              {editingId ? "ブースを編集" : "ブースを追加"}
            </h2>
            {editingId ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
                onClick={resetForm}
              >
                <RotateCcw size={14} aria-hidden="true" />
                解除
              </button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField
              label="ブース名"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="例: ブース A"
              required
            />
            <SelectField
              label="種別"
              value={form.kind}
              onChange={(value) => setForm((current) => ({ ...current, kind: value }))}
            >
              {roomKinds.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">メモ</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none transition placeholder:text-stone-400 focus:border-luxas-green"
                value={form.memo}
                onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
                placeholder="例: 入口近くの予約優先ブース"
              />
            </label>
            <ToggleField
              label="利用可能にする"
              checked={form.isActive}
              onChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
            />
            <StatusMessage message={message} />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-luxas-line bg-white">
          <div className="border-b border-luxas-line px-5 py-4">
            <h2 className="text-base font-semibold text-luxas-ink">ブース一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{rooms.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold uppercase tracking-normal text-stone-500">
                <tr>
                  <th className="px-5 py-3">ブース名</th>
                  <th className="px-5 py-3">種別</th>
                  <th className="px-5 py-3">メモ</th>
                  <th className="px-5 py-3">利用状況</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {rooms.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{roomKindLabels[item.kind]}</td>
                    <td className="px-5 py-4 text-stone-700">
                      <div className="max-w-[280px] truncate">{item.memo?.trim().length ? item.memo : "未設定"}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                        ].join(" ")}
                      >
                        {item.isActive ? "利用可能" : "停止中"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          編集
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                        >
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
