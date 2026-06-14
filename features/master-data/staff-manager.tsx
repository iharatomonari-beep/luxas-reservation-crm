"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialServices, initialStaff, servicesStorageKey, staffStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { staffRoleLabels, type ServiceMenu, type StaffMember, type StaffRole } from "@/features/master-data/types";
import { compareBySortOrder, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";

type StaffForm = {
  fullName: string;
  displayName: string;
  role: StaffRole;
  sortOrder: string;
  serviceMenuIds: string[];
  isActive: boolean;
};

const emptyForm: StaffForm = {
  fullName: "",
  displayName: "",
  role: "therapist",
  sortOrder: "10",
  serviceMenuIds: [],
  isActive: true
};

const roles = Object.entries(staffRoleLabels) as [StaffRole, string][];

export function StaffManager() {
  const [staff, setStaff] = useLocalCollection<StaffMember>(staffStorageKey, initialStaff);
  const [services] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const sortedServices = useMemo(() => [...services].sort(compareBySortOrder), [services]);
  const sortedStaff = useMemo(() => [...staff].sort(compareBySortOrder), [staff]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function validate() {
    if (isBlank(form.fullName)) {
      return "氏名を入力してください。";
    }

    if (isBlank(form.displayName)) {
      return "表示名を入力してください。";
    }

    if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0) {
      return "表示順は0以上の整数で入力してください。";
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
      fullName: normalizeText(form.fullName),
      displayName: normalizeText(form.displayName),
      role: form.role,
      sortOrder: Number(form.sortOrder),
      serviceMenuIds: form.serviceMenuIds,
      isActive: form.isActive
    };

    if (editingId) {
      setStaff((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      setMessage({ type: "success", text: "スタッフ情報を更新しました。" });
    } else {
      setStaff((current) => [{ id: makeLocalId("staff"), ...payload }, ...current]);
      setMessage({ type: "success", text: "スタッフを追加しました。" });
    }

    resetForm();
  }

  function handleEdit(item: StaffMember) {
    setEditingId(item.id);
    setForm({
      fullName: item.fullName,
      displayName: item.displayName,
      role: item.role,
      sortOrder: String(item.sortOrder ?? 10),
      serviceMenuIds: item.serviceMenuIds ?? [],
      isActive: item.isActive
    });
    setMessage(null);
  }

  function handleDelete(id: string) {
    setStaff((current) => current.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }

    setMessage({ type: "success", text: "スタッフを削除しました。" });
  }

  return (
    <MasterPage
      title="スタッフ管理"
      description="予約担当者、受付、店長など、single store内で使うスタッフマスタを管理します。"
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">
              {editingId ? "スタッフを編集" : "スタッフを追加"}
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
              label="氏名"
              value={form.fullName}
              onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
              placeholder="例: 青山 真央"
              required
            />
            <TextField
              label="表示名"
              value={form.displayName}
              onChange={(value) => setForm((current) => ({ ...current, displayName: value }))}
              placeholder="例: 青山"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="役割"
                value={form.role}
                onChange={(value) => setForm((current) => ({ ...current, role: value }))}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="表示順"
                value={form.sortOrder}
                onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))}
                type="number"
                min="0"
                required
                hint="小さい番号を上に表示します"
              />
            </div>
            <section className="rounded-md border border-luxas-line bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-700">対応可能メニュー</p>
                  <p className="mt-1 text-xs text-stone-500">
                    未選択の場合は全メニュー対応として扱います。予約作成時の絞り込みに使います。
                  </p>
                </div>
                {form.serviceMenuIds.length > 0 ? (
                  <button
                    type="button"
                    className="rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
                    onClick={() => setForm((current) => ({ ...current, serviceMenuIds: [] }))}
                  >
                    解除
                  </button>
                ) : null}
              </div>
              {sortedServices.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {sortedServices.map((service) => {
                    const checked = form.serviceMenuIds.includes(service.id);

                    return (
                      <label
                        key={service.id}
                        className={[
                          "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm",
                          checked ? "border-luxas-green bg-luxas-mist" : "border-luxas-line bg-white"
                        ].join(" ")}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-luxas-ink">{service.name}</span>
                          <span className="mt-0.5 block text-xs text-stone-500">
                            {service.category} / {service.durationMinutes}分
                          </span>
                        </span>
                        <input
                          className="h-4 w-4 accent-luxas-green"
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              serviceMenuIds: event.target.checked
                                ? [...current.serviceMenuIds, service.id]
                                : current.serviceMenuIds.filter((id) => id !== service.id)
                            }))
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-500">先にメニューを作成すると対応可能メニューを設定できます。</p>
              )}
            </section>
            <ToggleField
              label="有効にする"
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
            <h2 className="text-base font-semibold text-luxas-ink">スタッフ一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{staff.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold uppercase tracking-normal text-stone-500">
                <tr>
                  <th className="px-5 py-3">氏名</th>
                  <th className="px-5 py-3">表示名</th>
                  <th className="px-5 py-3">役割</th>
                  <th className="px-5 py-3">表示順</th>
                  <th className="px-5 py-3">対応メニュー</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {sortedStaff.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">{item.fullName}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.displayName}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{staffRoleLabels[item.role]}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.sortOrder ?? 0}</td>
                    <td className="px-5 py-4 text-stone-700">
                      <div className="flex max-w-[260px] flex-wrap gap-1.5">
                        {renderServiceAssignments(item.serviceMenuIds ?? [], sortedServices)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <ActiveBadge isActive={item.isActive} />
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

function renderServiceAssignments(serviceMenuIds: string[], services: ServiceMenu[]) {
  if (serviceMenuIds.length === 0) {
    return <span className="rounded-full bg-luxas-paper px-2 py-1 text-xs font-medium text-stone-600">全メニュー対応</span>;
  }

  return serviceMenuIds.map((serviceId) => {
    const service = services.find((item) => item.id === serviceId);

    return (
      <span
        key={serviceId}
        className="rounded-full bg-luxas-mist px-2 py-1 text-xs font-medium text-luxas-green"
      >
        {service ? service.name : `${serviceId}（削除済み）`}
      </span>
    );
  });
}
