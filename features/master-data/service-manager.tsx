"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { SelectField, TextField, ToggleField } from "@/features/master-data/form-controls";
import { initialCategories, initialServices, servicesStorageKey } from "@/features/master-data/mock-data";
import { ActiveBadge, MasterPage } from "@/features/master-data/master-page";
import { MasterSplitPanel, type MasterColumn } from "@/components/master/master-split-panel";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import type { ServiceMenu } from "@/features/master-data/types";
import { compareBySortOrder, formatCurrency, isBlank, makeLocalId, normalizeText } from "@/features/master-data/utils";
import { useLocalCollection } from "@/features/master-data/local-storage";
import { formatTimestamp, stampCreate, stampUpdate } from "@/features/master-data/timestamps";
import { useCurrentStore } from "@/features/org/use-current-store";
import { MENU_COLOR_OPTIONS, menuColorStyle } from "@/features/master-data/menu-colors";
import { COURSE_TYPE_OPTIONS, GENRE_OPTIONS, WEEKDAY_OPTIONS } from "@/features/master-data/menu-genres";

type ServiceForm = {
  name: string;
  durationMinutes: string;
  price: string;
  category: string;
  sortOrder: string;
  isActive: boolean;
  requiresPrivateRoom: boolean;
  onlineBooking: boolean;
  // 性別可否（PM §4-1）。既定はどちらも可。
  maleAllowed: boolean;
  femaleAllowed: boolean;
  // 事前準備時間 / 片付け時間（分・PM §4-1）。空＝0。コース選択時に予約の前後インターバルへ反映。
  prepMinutes: string;
  cleanupMinutes: string;
  // 提供店舗範囲（T065）。"all"=全店共通／"selected"=指定店舗のみ。
  storeScope: "all" | "selected";
  storeIds: string[];
  // 予約カード背景色（T066）。空＝デフォルト。
  color: string;
  // --- PM通常商品マスタ準拠の追加項目 ---
  managementCode: string;
  shortName: string;
  priceExcludingTax: string;
  regularPrice: string;
  requiredTrainers: string;
  description: string;
  reservationTerminal: boolean;
  googleBooking: boolean;
  storeApp: boolean;
  eparkListing: boolean;
  // PM §4-1 追加（コース種別 / ジャンル1-3 / 適用日 / 時間・曜日限定）
  courseType: string;
  genre1: string;
  genre2: string;
  genre3: string;
  startDate: string;
  endDate: string;
  availableDays: number[];
  availableTimeStart: string;
  availableTimeEnd: string;
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
  maleAllowed: true,
  femaleAllowed: true,
  prepMinutes: "5",
  cleanupMinutes: "10",
  storeScope: "all",
  storeIds: [],
  color: "",
  managementCode: "",
  shortName: "",
  priceExcludingTax: "",
  regularPrice: "",
  requiredTrainers: "1",
  description: "",
  reservationTerminal: true,
  googleBooking: false,
  storeApp: false,
  eparkListing: false,
  courseType: "通常コース",
  genre1: "",
  genre2: "",
  genre3: "",
  startDate: "",
  endDate: "",
  availableDays: [],
  availableTimeStart: "",
  availableTimeEnd: ""
};

export function ServiceManager() {
  const [services, setServices] = useLocalCollection<ServiceMenu>(servicesStorageKey, initialServices);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  // PM準拠の「全カテゴリ」絞り込み（一覧上部）。""=全件。
  const [categoryFilter, setCategoryFilter] = useState("");
  // 提供店舗の選択肢（T065）。localStorage補正後の有効な店舗一覧を参照。
  const { stores } = useCurrentStore();
  const storeOptions = [...stores].filter((s) => s.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // カテゴリ選択肢＝カテゴリマスタ ∪ 既存メニューのカテゴリ（重複排除・表示順）。
  const categoryOptions = useMemo(() => {
    const fromMaster = [...initialCategories].sort(compareBySortOrder).map((c) => c.name);
    const fromServices = services.map((s) => s.category).filter(Boolean);
    return [...new Set([...fromMaster, ...fromServices])];
  }, [services]);

  // 一覧（表示順）＋カテゴリ絞り込み。名前検索は MasterSplitPanel が担当。
  const visibleServices = useMemo(() => {
    const sorted = [...services].sort(compareBySortOrder);
    return categoryFilter ? sorted.filter((s) => s.category === categoryFilter) : sorted;
  }, [services, categoryFilter]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingId("");
    setMessage(null);
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
      maleAllowed: form.maleAllowed,
      femaleAllowed: form.femaleAllowed,
      prepMinutes: form.prepMinutes.trim() ? Number(form.prepMinutes) : undefined,
      cleanupMinutes: form.cleanupMinutes.trim() ? Number(form.cleanupMinutes) : undefined,
      // 提供店舗範囲（T065）。全店共通は storeIds を空に。
      storeScope: form.storeScope,
      storeIds: form.storeScope === "selected" ? form.storeIds : [],
      // 予約カード色（T066）。未設定は undefined（デフォルト色）。
      color: form.color || undefined,
      // PM通常商品マスタ準拠の追加項目（空は undefined で保存）。
      managementCode: form.managementCode.trim() || undefined,
      shortName: form.shortName.trim() || undefined,
      priceExcludingTax: form.priceExcludingTax.trim() ? Number(form.priceExcludingTax) : undefined,
      regularPrice: form.regularPrice.trim() ? Number(form.regularPrice) : undefined,
      requiredTrainers: form.requiredTrainers.trim() ? Number(form.requiredTrainers) : undefined,
      description: form.description.trim() || undefined,
      reservationTerminal: form.reservationTerminal,
      googleBooking: form.googleBooking,
      storeApp: form.storeApp,
      eparkListing: form.eparkListing,
      // PM §4-1 追加（空は undefined で保存）。
      courseType: form.courseType.trim() || undefined,
      genre1: form.genre1 || undefined,
      genre2: form.genre2 || undefined,
      genre3: form.genre3 || undefined,
      startDate: form.startDate.trim() || undefined,
      endDate: form.endDate.trim() || undefined,
      availableDays: form.availableDays.length > 0 ? [...form.availableDays].sort((a, b) => a - b) : undefined,
      availableTimeStart: form.availableTimeStart.trim() || undefined,
      availableTimeEnd: form.availableTimeEnd.trim() || undefined
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
      maleAllowed: item.maleAllowed ?? true,
      femaleAllowed: item.femaleAllowed ?? true,
      prepMinutes: item.prepMinutes != null ? String(item.prepMinutes) : "",
      cleanupMinutes: item.cleanupMinutes != null ? String(item.cleanupMinutes) : "",
      // 未設定の既存メニューは「全店共通」として表示（保存するまでバックフィルしない）。
      storeScope: item.storeScope === "selected" ? "selected" : "all",
      storeIds: item.storeIds ?? [],
      color: item.color ?? "",
      managementCode: item.managementCode ?? "",
      shortName: item.shortName ?? "",
      priceExcludingTax: item.priceExcludingTax != null ? String(item.priceExcludingTax) : "",
      regularPrice: item.regularPrice != null ? String(item.regularPrice) : "",
      requiredTrainers: item.requiredTrainers != null ? String(item.requiredTrainers) : "1",
      description: item.description ?? "",
      reservationTerminal: item.reservationTerminal ?? true,
      googleBooking: item.googleBooking ?? false,
      storeApp: item.storeApp ?? false,
      eparkListing: item.eparkListing ?? false,
      courseType: item.courseType ?? "通常コース",
      genre1: item.genre1 ?? "",
      genre2: item.genre2 ?? "",
      genre3: item.genre3 ?? "",
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      availableDays: item.availableDays ?? [],
      availableTimeStart: item.availableTimeStart ?? "",
      availableTimeEnd: item.availableTimeEnd ?? ""
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

  // 提供停止（無効）にしたメニューを再び有効化する。
  function handleReactivate(id: string) {
    setServices((current) =>
      current.map((item) => (item.id === id ? { ...item, ...stampUpdate({ ...item, isActive: true }, item) } : item))
    );
    setForm((current) => ({ ...current, isActive: true }));
    setMessage({ type: "success", text: "メニューを再開（有効）にしました。" });
  }

  // PM準拠の一覧列: ID / カテゴリ / 名前 / 施術料金（税込） / 表示順序 / オンライン予約 / 状態。
  const columns: MasterColumn<ServiceMenu>[] = [
    { key: "id", header: "ID", render: (s) => <span className="font-mono text-xs text-stone-400">{s.id.replace(/^service-?/, "")}</span> },
    { key: "category", header: "カテゴリ", render: (s) => <span className="text-stone-700">{s.category}</span> },
    {
      key: "name",
      header: "名前",
      render: (s) => (
        <span className="inline-flex items-center gap-2">
          <span className={["inline-block h-3 w-3 shrink-0 rounded-sm border", menuColorStyle(s.color).bg, menuColorStyle(s.color).border].join(" ")} aria-hidden="true" />
          <span className="font-medium text-rose-600 underline-offset-2 hover:underline">{s.name}</span>
          {s.genre1 ? <span className="rounded bg-stone-100 px-1 text-[10px] text-stone-500">{s.genre1}</span> : null}
          {(s.availableDays?.length || s.availableTimeStart || s.availableTimeEnd) ? (
            <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">限定</span>
          ) : null}
        </span>
      )
    },
    { key: "price", header: "施術料金（税込）", className: "text-right", render: (s) => <span className="text-stone-700">{formatCurrency(s.price)}</span> },
    { key: "sortOrder", header: "表示順序", className: "text-right", render: (s) => <span className="text-stone-600">{s.sortOrder ?? 0}</span> },
    { key: "online", header: "オンライン予約", className: "text-center", render: (s) => <span className={s.onlineBooking ? "text-luxas-green" : "text-stone-300"}>{s.onlineBooking ? "○" : "×"}</span> },
    { key: "status", header: "状態", render: (s) => <ActiveBadge isActive={s.isActive} /> }
  ];

  function renderDetail() {
    const editingService = editingId ? services.find((s) => s.id === editingId) ?? null : null;
    return (
      <div>
        {editingService ? (
          <p className="mb-3 text-[11px] text-stone-400">
            作成日: {formatTimestamp(editingService.createdAt)} ／ 最終更新日: {formatTimestamp(editingService.updatedAt)}
          </p>
        ) : null}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-luxas-ink">{editingId ? "メニューを編集" : "メニューを追加"}</h2>
          {editingId !== null ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-luxas-line px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-luxas-paper"
              onClick={resetForm}
            >
              <RotateCcw size={14} aria-hidden="true" />
              閉じる
            </button>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="管理コード（バーコード）"
              value={form.managementCode}
              onChange={(value) => setForm((current) => ({ ...current, managementCode: value }))}
              placeholder="任意"
            />
            <SelectField
              label="カテゴリ（商品の紐付け先）"
              value={form.category}
              onChange={(value) => setForm((current) => ({ ...current, category: value }))}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="メニュー名"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="例: ボディケア 60分"
              required
            />
            <TextField
              label="略称"
              value={form.shortName}
              onChange={(value) => setForm((current) => ({ ...current, shortName: value }))}
              placeholder="一覧・カード短縮表示用（任意）"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="施術料金（税込・円）"
              value={form.price}
              onChange={(value) => setForm((current) => ({ ...current, price: value }))}
              type="number"
              min="0"
              required
            />
            <TextField
              label="施術料金（税抜・円）"
              value={form.priceExcludingTax}
              onChange={(value) => setForm((current) => ({ ...current, priceExcludingTax: value }))}
              type="number"
              min="0"
            />
            <TextField
              label="通常価格（円）"
              value={form.regularPrice}
              onChange={(value) => setForm((current) => ({ ...current, regularPrice: value }))}
              type="number"
              min="0"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="必要なトレーナ"
              value={form.requiredTrainers}
              onChange={(value) => setForm((current) => ({ ...current, requiredTrainers: value }))}
            >
              {["0", "1", "2", "3"].map((n) => (
                <option key={n} value={n}>
                  {n}人
                </option>
              ))}
            </SelectField>
            <TextField
              label="表示順序"
              value={form.sortOrder}
              onChange={(value) => setForm((current) => ({ ...current, sortOrder: value }))}
              type="number"
              min="0"
              required
              hint="数値が小さいほど上に表示します"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="施術時間（分）"
              value={form.durationMinutes}
              onChange={(value) => setForm((current) => ({ ...current, durationMinutes: value }))}
              type="number"
              min="1"
              required
            />
            <TextField
              label="事前準備時間（分）"
              value={form.prepMinutes}
              onChange={(value) => setForm((current) => ({ ...current, prepMinutes: value }))}
              type="number"
              min="0"
              hint="施術前インターバルへ反映"
            />
            <TextField
              label="片付け時間（分）"
              value={form.cleanupMinutes}
              onChange={(value) => setForm((current) => ({ ...current, cleanupMinutes: value }))}
              type="number"
              min="0"
              hint="施術後インターバルへ反映"
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">説明（100字程度）</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={2}
              maxLength={200}
              className="w-full rounded-md border border-luxas-line bg-white px-3 py-2 text-sm text-luxas-ink outline-none focus:border-luxas-green"
              placeholder="コースの説明（任意）"
            />
          </label>

          <div className="grid gap-3 rounded-md border border-luxas-line bg-luxas-paper/40 p-3 sm:grid-cols-2">
            <ToggleField
              label="男性可"
              checked={form.maleAllowed}
              onChange={(value) => setForm((current) => ({ ...current, maleAllowed: value }))}
            />
            <ToggleField
              label="女性可"
              checked={form.femaleAllowed}
              onChange={(value) => setForm((current) => ({ ...current, femaleAllowed: value }))}
            />
            <ToggleField
              label="予約端末に掲載"
              checked={form.reservationTerminal}
              onChange={(value) => setForm((current) => ({ ...current, reservationTerminal: value }))}
            />
            <ToggleField
              label="オンライン予約に掲載"
              checked={form.onlineBooking}
              onChange={(value) => setForm((current) => ({ ...current, onlineBooking: value }))}
            />
            <ToggleField
              label="Google予約に掲載"
              checked={form.googleBooking}
              onChange={(value) => setForm((current) => ({ ...current, googleBooking: value }))}
            />
            <ToggleField
              label="お店アプリに掲載"
              checked={form.storeApp}
              onChange={(value) => setForm((current) => ({ ...current, storeApp: value }))}
            />
            <ToggleField
              label="EPARK掲載"
              checked={form.eparkListing}
              onChange={(value) => setForm((current) => ({ ...current, eparkListing: value }))}
            />
            <ToggleField
              label="個室必須メニュー"
              checked={form.requiresPrivateRoom}
              onChange={(value) => setForm((current) => ({ ...current, requiresPrivateRoom: value }))}
            />
            <ToggleField
              label="有効にする"
              checked={form.isActive}
              onChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
            />
          </div>

          <div>
            <SelectField
              label="ボタンの色（予約カード・コース選択に反映）"
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
              <span>背景色:</span>
              <span className={["inline-block h-4 w-8 rounded border", menuColorStyle(form.color).bg, menuColorStyle(form.color).border].join(" ")} />
              <span>（会計済みの予約はグレー優先）</span>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="コース種別"
              value={form.courseType}
              onChange={(value) => setForm((current) => ({ ...current, courseType: value }))}
            >
              {COURSE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(["genre1", "genre2", "genre3"] as const).map((field, index) => (
              <SelectField
                key={field}
                label={`ジャンル${index + 1}`}
                value={form[field]}
                onChange={(value) => setForm((current) => ({ ...current, [field]: value }))}
              >
                {GENRE_OPTIONS.map((opt) => (
                  <option key={opt.key || "none"} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </SelectField>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="店舗適用開始日"
              value={form.startDate}
              onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
              type="date"
              hint="未指定=制限なし"
            />
            <TextField
              label="店舗適用終了日"
              value={form.endDate}
              onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
              type="date"
              hint="未指定=制限なし"
            />
          </div>

          <section className="rounded-md border border-luxas-line bg-white p-3">
            <p className="text-sm font-medium text-stone-700">時間・曜日限定</p>
            <p className="mt-1 text-xs text-stone-500">
              未指定=制限なし（全曜日・終日）。設定すると、予約作成で限定外の曜日・時間ではこのコースを選べません。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((day) => {
                const checked = form.availableDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={[
                      "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-sm font-medium",
                      checked ? "border-luxas-green bg-luxas-mist text-luxas-green" : "border-luxas-line bg-white text-stone-600"
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          availableDays: event.target.checked
                            ? [...current.availableDays, day.value]
                            : current.availableDays.filter((d) => d !== day.value)
                        }))
                      }
                    />
                    {day.label}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <TextField
                label="提供開始時刻"
                value={form.availableTimeStart}
                onChange={(value) => setForm((current) => ({ ...current, availableTimeStart: value }))}
                type="time"
                hint="未指定=終日"
              />
              <TextField
                label="提供終了時刻"
                value={form.availableTimeEnd}
                onChange={(value) => setForm((current) => ({ ...current, availableTimeEnd: value }))}
                type="time"
                hint="未指定=終日"
              />
            </div>
          </section>

          <StatusMessage message={message} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]"
            >
              <Plus size={17} aria-hidden="true" />
              {editingId ? "更新する" : "追加する"}
            </button>
            {editingId && form.isActive ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-3 py-3 text-sm font-medium text-amber-800 hover:bg-amber-50"
                onClick={() => handleDeactivate(editingId)}
              >
                <Trash2 size={15} aria-hidden="true" />
                提供停止
              </button>
            ) : null}
            {editingId && !form.isActive ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-luxas-green px-3 py-3 text-sm font-medium text-luxas-green hover:bg-luxas-mist"
                onClick={() => handleReactivate(editingId)}
              >
                <RotateCcw size={15} aria-hidden="true" />
                再開（有効化）
              </button>
            ) : null}
          </div>
        </form>
      </div>
    );
  }

  return (
    <MasterPage
      title="メニュー管理（通常商品）"
      description="予約作成時に使う施術メニューの名称、施術料金、時間、カテゴリを管理します。左の一覧から選ぶと右に明細が開きます。"
    >
      <p className="mb-3 text-sm text-stone-500">{visibleServices.length}件{categoryFilter ? `（${categoryFilter}）` : ""}</p>
      <MasterSplitPanel
        items={visibleServices}
        columns={columns}
        searchKeys={["name", "category"]}
        selectedId={editingId}
        onSelect={handleEdit}
        onCreate={startCreate}
        renderDetail={renderDetail}
        searchPlaceholder="メニュー名で検索"
        detailTitle="明細設定"
        emptyDetail="左の一覧から選択するか「新規作成」を押してください。"
        gridClassName="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
        listMaxHeightClassName="max-h-[72vh]"
        filterSlot={
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-md border border-luxas-line bg-white px-2.5 py-1.5 text-sm text-luxas-ink outline-none"
            aria-label="カテゴリで絞り込み"
          >
            <option value="">全カテゴリ</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        }
      />
    </MasterPage>
  );
}
