"use client";

import { useEffect, useState } from "react";

/**
 * 店舗設定マスタ（単一オブジェクト）。
 *
 * 予約台帳・予約作成で使う営業時間や予約の時間単位を 1 か所に集約する。
 * 既存マスタ（staff/services/rooms/shifts）は配列だが、店舗設定は店舗ごとに 1 件の
 * 単一オブジェクトなので、配列前提の `useLocalCollection` は流用せず専用の保持方式にする。
 *
 * 今回（T002）は設定画面（UI）は作らない。型・初期値・読み出しヘルパまで。
 * 初期値は現行のハードコード値と同一にしてあり、見た目・挙動は変わらない。
 */
export type StoreSettings = {
  /** 営業開始時刻（"HH:mm"）。初期値 "10:00" */
  businessStartTime: string;
  /** 営業終了時刻（"HH:mm"）。初期値 "23:00" */
  businessEndTime: string;
  /** 予約受付開始時刻（"HH:mm"）。初期値 "10:00" */
  reservationAcceptStartTime: string;
  /**
   * 予約受付終了時刻（"HH:mm"）。初期値 "22:00"。
   * 要確認: 仕様に確定値が無いため暫定値。確定したら更新する。
   */
  reservationAcceptEndTime: string;
  /** タイムライン／予約の時間きざみ（分）。初期値 5 */
  slotMinutes: number;
  // --- T040 店舗設定の拡張セクション（すべて任意・実連携なし／ローカル保持のみ） ---
  /** 業務設定の運用メモ */
  businessNote?: string;
  /** 会員番号の採番: 接頭辞 */
  membershipPrefix?: string;
  /** 会員番号の採番: 桁数（ゼロ埋め） */
  membershipDigits?: number;
  /** 会員番号の採番: 次に発行する番号 */
  membershipNextNumber?: number;
  /** 予約用HP: 店舗説明 */
  hpDescription?: string;
  /** 予約用HP: 画像URL */
  hpImageUrl?: string;
  /** 予約用HP: 営業時間テキスト */
  hpBusinessHoursText?: string;
  /** 予約用HP: 定休日テキスト */
  hpClosedDaysText?: string;
  /** オンライン予約: 公開ON/OFF（実連携なし） */
  onlineReservationEnabled?: boolean;
  /** 店舗通知: 通知先メール（実送信なし） */
  notifyEmail?: string;
  /** インボイス: 登録番号 */
  invoiceRegistrationNumber?: string;
  // --- T058 PM店舗マスタ基本情報（すべて任意・表示/保持のみ・外部連携なし） ---
  companyId?: string;
  areaId?: string;
  storeId?: string;
  storeCode?: string;
  storeName?: string;
  storeShortName?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  address2?: string;
  phone?: string;
  fax?: string;
  email?: string;
  hpUrl?: string;
  department?: string;
  managerName?: string;
  /** 背景色設定（CSSカラー文字列） */
  themeColor?: string;
};

export const storeSettingsStorageKey = "luxas-store-settings";

/** 現行挙動を変えないための初期値（台帳のハードコードと同値）。 */
export const initialStoreSettings: StoreSettings = {
  businessStartTime: "10:00",
  businessEndTime: "23:00",
  reservationAcceptStartTime: "10:00",
  reservationAcceptEndTime: "22:00", // 要確認: 仕様に確定値が無いため暫定値
  slotMinutes: 5,
  // T040 拡張セクションの初期値（実連携なし）
  businessNote: "",
  membershipPrefix: "LX-",
  membershipDigits: 6,
  membershipNextNumber: 1,
  hpDescription: "",
  hpImageUrl: "",
  hpBusinessHoursText: "",
  hpClosedDaysText: "",
  onlineReservationEnabled: true, // プロトタイプ既定で公開（OFFにすると公開予約ページが受付停止表示）
  notifyEmail: "",
  invoiceRegistrationNumber: "",
  // T058 基本情報の初期値（単一店舗の既定）
  companyId: "",
  areaId: "",
  storeId: "store-shibuya",
  storeCode: "",
  storeName: "LUXAS",
  storeShortName: "LUXAS",
  postalCode: "",
  prefecture: "",
  city: "",
  address2: "",
  phone: "",
  fax: "",
  email: "",
  hpUrl: "",
  department: "",
  managerName: "",
  themeColor: ""
};

// 店舗別の保存キー。storeId 指定時は `luxas-store-settings::<storeId>`、
// 未指定時は従来のグローバルキー（後方互換）。
function storeSettingsKeyFor(storeId?: string): string {
  return storeId ? `${storeSettingsStorageKey}::${storeId}` : storeSettingsStorageKey;
}

function readAt(key: string): StoreSettings | null {
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<StoreSettings> | null;
    if (!parsed || typeof parsed !== "object") return null;
    // 欠損キーは初期値で補完する（後方互換）。
    return { ...initialStoreSettings, ...parsed };
  } catch {
    return null;
  }
}

// 店舗別キー → （無ければ）グローバルキー の順でフォールバック。
// これにより、既存のグローバル保存値が各店舗の初期表示としてそのまま効く（非破壊）。
function readStoredStoreSettings(storeId?: string): StoreSettings | null {
  if (storeId) {
    return readAt(storeSettingsKeyFor(storeId)) ?? readAt(storeSettingsStorageKey);
  }
  return readAt(storeSettingsStorageKey);
}

/**
 * 店舗設定を localStorage から読み出すフック。
 * storeId を渡すと店舗別に保持（未保存なら従来のグローバル値→初期値へフォールバック）。
 * storeId 省略時は従来どおりグローバル単一オブジェクト。
 * SSR では初期値、ハイドレーション後に保存値へ更新する。store 切替時は再読込する。
 */
export function useStoreSettings(storeId?: string) {
  const [settings, setSettings] = useState<StoreSettings>(initialStoreSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredStoreSettings(storeId);
    // store 切替時は、保存が無ければフォールバック（グローバル/初期）に戻す。
    setSettings(stored ?? initialStoreSettings);
    setIsHydrated(true);
  }, [storeId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storeSettingsKeyFor(storeId), JSON.stringify(settings));
  }, [isHydrated, settings, storeId]);

  return [settings, setSettings, isHydrated] as const;
}
