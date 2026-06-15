"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { TextField, ToggleField } from "@/features/master-data/form-controls";
import { MasterPage } from "@/features/master-data/master-page";
import { StatusMessage, type StatusMessageValue } from "@/features/master-data/status-message";
import { useStoreSettings, type StoreSettings } from "@/features/master-data/store-settings";
import { useLocalCollection } from "@/features/master-data/local-storage";
import {
  creditCardsStorageKey,
  emoneyStorageKey,
  initialCreditCards,
  initialEmoney
} from "@/features/master-data/mock-data";
import type { CreditCardCompany, EmoneyBrand } from "@/features/master-data/types";

const BASIC_FIELDS = [
  "companyId", "areaId", "storeId", "storeCode", "storeName", "storeShortName",
  "postalCode", "prefecture", "city", "address2", "phone", "fax", "email",
  "hpUrl", "department", "managerName", "themeColor"
] as const;
type BasicField = (typeof BASIC_FIELDS)[number];

type StoreSettingsForm = {
  businessStartTime: string;
  businessEndTime: string;
  reservationAcceptStartTime: string;
  reservationAcceptEndTime: string;
  slotMinutes: string;
  businessNote: string;
  membershipPrefix: string;
  membershipDigits: string;
  membershipNextNumber: string;
  hpDescription: string;
  hpImageUrl: string;
  hpBusinessHoursText: string;
  hpClosedDaysText: string;
  onlineReservationEnabled: boolean;
  notifyEmail: string;
  invoiceRegistrationNumber: string;
} & Record<BasicField, string>;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function toForm(settings: StoreSettings): StoreSettingsForm {
  return {
    businessStartTime: settings.businessStartTime,
    businessEndTime: settings.businessEndTime,
    reservationAcceptStartTime: settings.reservationAcceptStartTime,
    reservationAcceptEndTime: settings.reservationAcceptEndTime,
    slotMinutes: String(settings.slotMinutes),
    businessNote: settings.businessNote ?? "",
    membershipPrefix: settings.membershipPrefix ?? "",
    membershipDigits: settings.membershipDigits != null ? String(settings.membershipDigits) : "",
    membershipNextNumber: settings.membershipNextNumber != null ? String(settings.membershipNextNumber) : "",
    hpDescription: settings.hpDescription ?? "",
    hpImageUrl: settings.hpImageUrl ?? "",
    hpBusinessHoursText: settings.hpBusinessHoursText ?? "",
    hpClosedDaysText: settings.hpClosedDaysText ?? "",
    onlineReservationEnabled: settings.onlineReservationEnabled ?? false,
    notifyEmail: settings.notifyEmail ?? "",
    invoiceRegistrationNumber: settings.invoiceRegistrationNumber ?? "",
    ...Object.fromEntries(BASIC_FIELDS.map((f) => [f, (settings[f] as string | undefined) ?? ""])) as Record<BasicField, string>
  };
}

const BASIC_LABELS: Record<BasicField, string> = {
  companyId: "企業ID",
  areaId: "エリアID",
  storeId: "店舗ID",
  storeCode: "店舗コード",
  storeName: "店舗名",
  storeShortName: "略称",
  postalCode: "郵便番号",
  prefecture: "都道府県",
  city: "市区町村番地",
  address2: "住所2",
  phone: "電話",
  fax: "FAX",
  email: "メール",
  hpUrl: "HP URL",
  department: "担当部署",
  managerName: "担当者名",
  themeColor: "背景色設定"
};

function Section({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <details className="rounded-md border border-luxas-line bg-white open:bg-white">
      <summary className="cursor-pointer list-none px-4 py-3">
        <span className="text-sm font-semibold text-luxas-ink">{title}</span>
        <span className="ml-2 text-xs text-stone-500">{summary}</span>
      </summary>
      <div className="space-y-4 border-t border-luxas-line px-4 py-4">{children}</div>
    </details>
  );
}

export function StoreSettingsManager() {
  const [settings, setSettings, isHydrated] = useStoreSettings();
  const [form, setForm] = useState<StoreSettingsForm>(() => toForm(settings));
  const [message, setMessage] = useState<StatusMessageValue | null>(null);
  const [creditCards] = useLocalCollection<CreditCardCompany>(creditCardsStorageKey, initialCreditCards);
  const [emoney] = useLocalCollection<EmoneyBrand>(emoneyStorageKey, initialEmoney);

  // localStorage からの読み込み（ハイドレーション）後にフォームを最新値へ同期する。
  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    setForm(toForm(settings));
  }, [isHydrated, settings]);

  function update<K extends keyof StoreSettingsForm>(key: K, value: StoreSettingsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate(): string | null {
    if (!timePattern.test(form.businessStartTime) || !timePattern.test(form.businessEndTime)) {
      return "営業時間は HH:mm 形式で入力してください。";
    }
    if (form.businessEndTime <= form.businessStartTime) {
      return "営業終了時刻は営業開始時刻より後にしてください。";
    }
    if (!timePattern.test(form.reservationAcceptStartTime) || !timePattern.test(form.reservationAcceptEndTime)) {
      return "予約受付時間は HH:mm 形式で入力してください。";
    }
    if (form.reservationAcceptEndTime <= form.reservationAcceptStartTime) {
      return "予約受付終了は受付開始より後にしてください。";
    }
    const slot = Number(form.slotMinutes);
    if (!Number.isInteger(slot) || slot <= 0 || 60 % slot !== 0) {
      return "時間単位（分）は60を割り切れる正の整数（例: 5, 10, 15, 30）で入力してください。";
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

    const digits = Number(form.membershipDigits);
    const nextNumber = Number(form.membershipNextNumber);

    setSettings((current) => ({
      ...current,
      businessStartTime: form.businessStartTime,
      businessEndTime: form.businessEndTime,
      reservationAcceptStartTime: form.reservationAcceptStartTime,
      reservationAcceptEndTime: form.reservationAcceptEndTime,
      slotMinutes: Number(form.slotMinutes),
      businessNote: form.businessNote,
      membershipPrefix: form.membershipPrefix,
      membershipDigits: Number.isFinite(digits) && digits > 0 ? digits : current.membershipDigits,
      membershipNextNumber: Number.isFinite(nextNumber) && nextNumber > 0 ? nextNumber : current.membershipNextNumber,
      hpDescription: form.hpDescription,
      hpImageUrl: form.hpImageUrl,
      hpBusinessHoursText: form.hpBusinessHoursText,
      hpClosedDaysText: form.hpClosedDaysText,
      onlineReservationEnabled: form.onlineReservationEnabled,
      notifyEmail: form.notifyEmail,
      invoiceRegistrationNumber: form.invoiceRegistrationNumber,
      ...Object.fromEntries(BASIC_FIELDS.map((f) => [f, form[f]]))
    }));
    setMessage({ type: "success", text: "店舗設定を保存しました。" });
  }

  const membershipPreview = `${form.membershipPrefix}${String(Number(form.membershipNextNumber) || 0).padStart(Number(form.membershipDigits) || 0, "0")}`;

  return (
    <MasterPage
      title="店舗設定"
      description="営業時間・会員番号採番・予約用HP・オンライン予約/通知・インボイスをローカルに保持します。外部連携・実送信・決済は行いません（v0.1）。"
    >
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        ※ オンライン予約の公開・店舗通知・決済は実連携しません。設定値の保持のみです。各セクションの内部仕様はPM標準で設計（相違あれば実機再確認）。
      </div>

      <form className="grid gap-4 xl:grid-cols-[640px_1fr]" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <Section title="基本情報" summary="PM店舗マスタの基本フィールド（表示/保持のみ）">
            <div className="grid gap-4 sm:grid-cols-2">
              {BASIC_FIELDS.map((field) => (
                <TextField
                  key={field}
                  label={BASIC_LABELS[field]}
                  value={form[field]}
                  onChange={(v) => update(field, v)}
                  placeholder={field === "themeColor" ? "例: #2f6e5e" : undefined}
                />
              ))}
            </div>
          </Section>

          <Section title="業務設定（営業時間・予約単位）" summary="タイムラインに連動">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="営業開始時刻" type="time" value={form.businessStartTime} onChange={(v) => update("businessStartTime", v)} required />
              <TextField label="営業終了時刻" type="time" value={form.businessEndTime} onChange={(v) => update("businessEndTime", v)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="予約受付開始時刻" type="time" value={form.reservationAcceptStartTime} onChange={(v) => update("reservationAcceptStartTime", v)} required />
              <TextField label="予約受付終了時刻" type="time" value={form.reservationAcceptEndTime} onChange={(v) => update("reservationAcceptEndTime", v)} required />
            </div>
            <TextField label="時間表示単位（分）" type="number" min="1" value={form.slotMinutes} onChange={(v) => update("slotMinutes", v)} required hint="タイムラインの1コマの分数。例: 5" />
            <TextField label="業務メモ" value={form.businessNote} onChange={(v) => update("businessNote", v)} placeholder="運用上のメモ（任意）" />
          </Section>

          <Section title="会員番号の発行処理" summary="採番ルールを保持">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="接頭辞" value={form.membershipPrefix} onChange={(v) => update("membershipPrefix", v)} placeholder="例: LX-" />
              <TextField label="桁数（ゼロ埋め）" type="number" min="1" value={form.membershipDigits} onChange={(v) => update("membershipDigits", v)} />
              <TextField label="次の番号" type="number" min="1" value={form.membershipNextNumber} onChange={(v) => update("membershipNextNumber", v)} />
            </div>
            <p className="text-xs text-stone-500">発行プレビュー: <b className="text-luxas-ink">{membershipPreview}</b>（実発行は顧客作成時に利用する想定・最小実装）</p>
          </Section>

          <Section title="予約用ホームページ" summary="表示用テキストの保持">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">店舗説明</span>
              <textarea className="mt-2 min-h-24 w-full rounded-md border border-luxas-line bg-white px-3 py-2.5 text-sm text-luxas-ink outline-none focus:border-luxas-green" value={form.hpDescription} onChange={(e) => update("hpDescription", e.target.value)} placeholder="HPに掲載する店舗紹介文" />
            </label>
            <TextField label="画像URL" value={form.hpImageUrl} onChange={(v) => update("hpImageUrl", v)} placeholder="https://..." />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="営業時間テキスト" value={form.hpBusinessHoursText} onChange={(v) => update("hpBusinessHoursText", v)} placeholder="例: 10:00-23:00" />
              <TextField label="定休日テキスト" value={form.hpClosedDaysText} onChange={(v) => update("hpClosedDaysText", v)} placeholder="例: 不定休" />
            </div>
          </Section>

          <Section title="オンライン予約・店舗通知" summary="設定値のみ（実連携なし）">
            <ToggleField label="オンライン予約を公開する（モック）" checked={form.onlineReservationEnabled} onChange={(v) => update("onlineReservationEnabled", v)} />
            <TextField label="通知先メール" value={form.notifyEmail} onChange={(v) => update("notifyEmail", v)} placeholder="店舗の通知受信先（実送信なし）" />
          </Section>

          <Section title="インボイス設定" summary="登録番号の保持">
            <TextField label="適格請求書 登録番号" value={form.invoiceRegistrationNumber} onChange={(v) => update("invoiceRegistrationNumber", v)} placeholder="例: T1234567890123" />
          </Section>

          <Section title="利用可能クレジットカード会社一覧" summary="クレカ会社マスタを参照（編集はクレカ会社マスタで）">
            <ul className="space-y-1 text-sm text-stone-700">
              {creditCards.filter((c) => c.isActive).length === 0 ? (
                <li className="text-stone-500">有効なクレジットカード会社がありません。</li>
              ) : (
                creditCards.filter((c) => c.isActive).map((c) => (
                  <li key={c.id} className="flex items-center justify-between border-b border-luxas-line pb-1 last:border-0">
                    <span>{c.name}</span>
                    <span className="text-xs text-stone-500">手数料率 {c.feePercent}%</span>
                  </li>
                ))
              )}
            </ul>
          </Section>

          <Section title="利用可能電子マネー一覧" summary="電子マネーマスタを参照（編集は電子マネーマスタで）">
            <ul className="space-y-1 text-sm text-stone-700">
              {emoney.filter((e) => e.isActive).length === 0 ? (
                <li className="text-stone-500">有効な電子マネーがありません。</li>
              ) : (
                emoney.filter((e) => e.isActive).map((e) => (
                  <li key={e.id} className="flex items-center justify-between border-b border-luxas-line pb-1 last:border-0">
                    <span>{e.name}</span>
                    <span className="text-xs text-stone-500">手数料率 {e.feePercent}%</span>
                  </li>
                ))
              )}
            </ul>
          </Section>

          <Section title="店舗サマリ / ウィジェット" summary="表示のみ（PM準拠の枠）">
            <p className="text-sm text-stone-600">店舗サマリ・予約ウィジェットの設定枠です（v0.1 は表示のみ・外部連携なし）。</p>
          </Section>

          <StatusMessage message={message} />
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-luxas-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#285f51]">
            <Save size={17} aria-hidden="true" />
            すべての設定を保存する
          </button>
        </div>

        <section className="self-start rounded-lg border border-luxas-line bg-white p-5">
          <h2 className="text-base font-semibold text-luxas-ink">現在の設定</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="営業時間" value={`${settings.businessStartTime} - ${settings.businessEndTime}`} />
            <Row label="予約受付" value={`${settings.reservationAcceptStartTime} - ${settings.reservationAcceptEndTime}`} />
            <Row label="時間単位" value={`${settings.slotMinutes}分`} />
            <Row label="会員番号" value={`${settings.membershipPrefix ?? ""}（${settings.membershipDigits ?? "-"}桁 / 次番 ${settings.membershipNextNumber ?? "-"}）`} />
            <Row label="オンライン予約" value={settings.onlineReservationEnabled ? "公開（モック）" : "非公開"} />
            <Row label="インボイス登録番号" value={settings.invoiceRegistrationNumber || "未設定"} />
          </dl>
          <p className="mt-4 text-xs text-stone-500">
            営業時間はタイムラインの「全体」表示の範囲に使用されます（反映には予約台帳の再読み込みが必要な場合があります）。
          </p>
        </section>
      </form>
    </MasterPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-luxas-line pb-2 last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-luxas-ink">{value}</dd>
    </div>
  );
}
