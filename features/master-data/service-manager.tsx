"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialServices, servicesStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { ServiceMenu } from "@/features/master-data/types";
import { compareBySortOrder, formatCurrency, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { formatTimestamp, stampCreate, stampUpdate } from "@/features/master-data/timestamps";
import { useCurrentStore } from "@/features/org/use-current-store";
import { MENU_COLOR_OPTIONS, menuColorStyle } from "@/features/master-data/menu-colors";

type ServiceForm = {
  name: string;
  durationMinutes: string;
  price: string;
  category: string;
  sortOrder: string;
  isActive: boolean;
  requiresPrivateRoom: boolean;
  onlineBooking: boolean;
  // 提供店舗範囲（T065）。"all"=全店共通／"selected"=指定店舗のみ。
  storeScope: "all" | "selected";
  storeIds: string[];
  // 予約カード背景色（T066）。空＝デフォルト。
  color: string;
};

const emptyForm: ServiceForm = {
  name: "",
  durationMinutes: "60",
  price: "0",
  category: "ボディケア",
  sortOrder: "10",
  isActive: true,
  requiresPrivateRoom: false,
  onlineBooking: false,
  storeScope: "all",
  storeIds: [],
  color: ""
};

const categories = ["ボディケア", "フェイシャル", "カウンセリング", "オプション", "その他"];

export function ServiceManager() {
  const [services, setServices] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  // 提供店舗の選択肢（T065）。localStorage補正後の有効な店舗一覧を参照。
  const { stores } = useCurrentStore();
  const storeOptions = [...stores].filter((s) => s.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id;
  function scopeLabel(item: ServiceMenu): string {
    if (item.storeScope !== "selected") {
      return "全店共通";
    }
    const names = (item.storeIds ?? []).map(storeName);
    return names.length ? names.join("、") : "（店舗未選択）";
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function validate() {
    const duration = Number(form.durationMinutes);
    const price = Number(form.price);
    const sortOrder = Number(form.sortOrder);

    if (isBlank(form.name)) {
      return "メニュー名を入力してください。";
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      return "所要時間は1以上の整数で入力してください。";
    }

    if (!Number.isInteger(price) || price < 0) {
      return "価格は0以上の整数で入力してください。";
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return "表示順は0以上の整数で入力してください。";
    }

    if (isBlank(form.category)) {
      return "カテゴリを選択してください。";
    }

    if (form.storeScope === "selected" && form.storeIds.length === 0) {
      return "「指定店舗のみ」の場合は、提供店舗を1つ以上選択してください。";
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
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
      category: normalizeText(form.category),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      requiresPrivateRoom: form.requiresPrivateRoom,
      onlineBooking: form.onlineBooking,
      // 提供店舗範囲（T065）。全店共通は storeIds を空に。
      storeScope: form.storeScope,
      storeIds: form.storeScope === "selected" ? form.storeIds : [],
      // 予約カード色（T066）。未設定は undefined（デフォルト色）。
      color: form.color || undefined
    };

    if (editingId) {
      setServices((current) => current.map((item) => (item.id === editingId ? { ...item, ...stampUpdate(payload, item) } : item)));
      setMessage({ type: "success", text: "メニューを更新しました。" });
    } else {
      setServices((current) => [{ id: makeLocalId("service"), ...stampCreate(payload) }, ...current]);
      setMessage({ type: "success", text: "メニューを追加しました。" });
    }

    resetForm();
  }

  function handleEdit(item: ServiceMenu) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      durationMinutes: String(item.durationMinutes),
      price: String(item.price),
      category: item.category,
      sortOrder: String(item.sortOrder ?? 10),
      isActive: item.isActive,
      requiresPrivateRoom: item.requiresPrivateRoom ?? false,
      onlineBooking: item.onlineBooking ?? false,
      // 未設定の既存メニューは「全店共通」として表示（保存するまでバックフィルしない）。
      storeScope: item.storeScope === "selected" ? "selected" : "all",
      storeIds: item.storeIds ?? [],
      color: item.color ?? ""
    });
    setMessage(null);
  }

  // 物理削除はしない（過去予約のメニュー名解決のためデータは残す）。提供停止＝isActive=false で新規候補から外す。
  function handleDeactivate(id: string) {
    setServices((current) =>
      current.map((item) => (item.id === id ? { ...item, ...stampUpdate({ ...item, isActive: false }, item) } : item))
    );
    setMessage({ type: "success", text: "メニューを提供停止（無効）にしました。過去予約のメニュー名は引き続き表示されます。" });
  }

  return (
    <MasterPage
      title="メニュー管理"
      description="予約作成時に使う施術メニューの名称、所要時間、価格、カテゴリを管理します。"
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-luxas-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-luxas-ink">
              {editingId ? "メニューを編集" : "メニューを追加"}
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

          {editingId ? (
            (() => {
              const editingService = services.find((s) => s.id === editingId);
              return editingService ? (
                <p className="mb-3 text-[11px] text-stone-400">
                  作成日: {formatTimestamp(editingService.createdAt)} ／ 最終更新日: {formatTimestamp(editingService.updatedAt)}
                </p>
              ) : null;
            })()
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField
              label="メニュー名"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="例: ボディケア 60分"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="所要時間（分）"
                value={form.durationMinutes}
                onChange={(value) => setForm((current) => ({ ...current, durationMinutes: value }))}
                type="number"
                min="1"
                required
              />
              <TextField
                label="価格（円）"
                value={form.price}
                onChange={(value) => setForm((current) => ({ ...current, price: value }))}
                type="number"
              min="0"
              required
            />
            </div>
            <TextField
              label="表示順"
              value={form.sortOrder}
              onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))}
              type="number"
              min="0"
              required
              hint="数値が小さいほど上に表示します"
            />
            <SelectField
              label="カテゴリ"
              value={form.category}
              onChange={(value) => setForm((current) => ({ ...current, category: value }))}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectField>
            <ToggleField
              label="個室必須メニュー"
              checked={form.requiresPrivateRoom}
              onChange={(value) => setForm((current) => ({ ...current, requiresPrivateRoom: value }))}
            />
            <ToggleField
              label="オンライン予約に掲載"
              checked={form.onlineBooking}
              onChange={(value) => setForm((current) => ({ ...current, onlineBooking: value }))}
            />
            <ToggleField
              label="有効にする"
              checked={form.isActive}
              onChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
            />

            <div>
              <SelectField
                label="予約カード色"
                value={form.color}
                onChange={(value) => setForm((current) => ({ ...current, color: value }))}
              >
                {MENU_COLOR_OPTIONS.map((option) => (
                  <option key={option.key || "default"} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                <span>予約枠の背景色:</span>
                <span className={["inline-block h-4 w-8 rounded border", menuColorStyle(form.color).bg, menuColorStyle(form.color).border].join(" ")} />
                <span>（会計済みの予約はグレー優先で表示されます）</span>
              </div>
            </div>

            <section className="rounded-md border border-luxas-line bg-white p-3">
              <p className="text-sm font-medium text-stone-700">提供店舗</p>
              <p className="mt-1 text-xs text-stone-500">
                未設定は全店共通です。予約作成の選択候補だけを店舗で絞ります（過去予約のメニュー名表示には影響しません）。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["all", "selected"] as const).map((scope) => (
                  <label
                    key={scope}
                    className={[
                      "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                      form.storeScope === scope ? "border-luxas-green bg-luxas-mist text-luxas-green" : "border-luxas-line bg-white text-stone-700"
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="storeScope"
                      className="h-4 w-4 accent-luxas-green"
                      checked={form.storeScope === scope}
                      onChange={() => setForm((current) => ({ ...current, storeScope: scope }))}
                    />
                    {scope === "all" ? "全店共通" : "指定店舗のみ"}
                  </label>
                ))}
              </div>
              {form.storeScope === "selected" ? (
                <div className="mt-3 grid gap-2">
                  {storeOptions.length === 0 ? (
                    <p className="text-sm text-stone-500">有効な店舗がありません（組織管理で店舗を有効化してください）。</p>
                  ) : (
                    storeOptions.map((store) => {
                      const checked = form.storeIds.includes(store.id);
                      return (
                        <label
                          key={store.id}
                          className={[
                            "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm",
                            checked ? "border-luxas-green bg-luxas-mist" : "border-luxas-line bg-white"
                          ].join(" ")}
                        >
                          <span className="font-medium text-luxas-ink">{store.name}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-luxas-green"
                            checked={checked}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                storeIds: event.target.checked
                                  ? [...current.storeIds, store.id]
                                  : current.storeIds.filter((id) => id !== store.id)
                              }))
                            }
                          />
                        </label>
                      );
                    })
                  )}
                  <p className="text-xs text-stone-500">1店舗＝店舗専用 ／ 複数選択＝複数店舗対応。</p>
                </div>
              ) : null}
            </section>

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
            <h2 className="text-base font-semibold text-luxas-ink">メニュー一覧</h2>
            <p className="mt-1 text-sm text-stone-500">{services.length}件</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-luxas-paper text-xs font-semibold uppercase tracking-normal text-stone-500">
                <tr>
                  <th className="px-5 py-3">メニュー名</th>
                  <th className="px-5 py-3">カテゴリ</th>
                  <th className="px-5 py-3">所要時間</th>
                  <th className="px-5 py-3">価格</th>
                  <th className="px-5 py-3">表示順</th>
                  <th className="px-5 py-3">個室</th>
                  <th className="px-5 py-3">オンライン予約</th>
                  <th className="px-5 py-3">提供店舗</th>
                  <th className="px-5 py-3">状態</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxas-line">
                {[...services].sort(compareBySortOrder).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-luxas-ink">
                      <span className="inline-flex items-center gap-2">
                        <span className={["inline-block h-3 w-3 shrink-0 rounded-sm border", menuColorStyle(item.color).bg, menuColorStyle(item.color).border].join(" ")} aria-hidden="true" />
                        {item.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.category}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.durationMinutes}分</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{formatCurrency(item.price)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">{item.sortOrder ?? 0}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">
                      {item.requiresPrivateRoom ? "個室必須" : "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">
                      {item.onlineBooking ? "○" : "×"}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      <span className="block max-w-[220px] truncate">{scopeLabel(item)}</span>
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
                        {item.isActive ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
                            onClick={() => handleDeactivate(item.id)}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            提供停止
                          </button>
                        ) : null}
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
