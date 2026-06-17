// 顧客検索の純関数（T067.5-B-2a）。
// 予約台帳の左パネル「顧客を検索」から利用する表示専用ロジック。
// ここでは検索＝表示のみで、customerId 書き込み・紐づけ・新規作成などの副作用は一切持たない。

import type { Customer } from "@/features/customers/types";

/** 文字列の汎用正規化: NFKC（全角→半角等）→ trim → 小文字化。 */
export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase();
}

/** ひらがな→カタカナの簡易統一（カナ検索のゆれ吸収）。 */
function hiraganaToKatakana(value: string): string {
  return value.replace(/[ぁ-ゖ]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
}

/** カナ検索用の正規化: 汎用正規化＋ひらがな→カタカナ。 */
export function normalizeKana(value: string): string {
  return hiraganaToKatakana(normalizeSearchText(value));
}

/** 電話番号の正規化: 数字のみ。 */
export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export type CustomerSearchOptions = {
  keyword: string;
  homeOnly: boolean;
  currentStoreId?: string;
  /** 表示上限（既定30）。 */
  limit?: number;
};

export type CustomerSearchResult = {
  results: Customer[];
  /** 全ヒット件数（上限適用前）。 */
  total: number;
  /** total が limit を超えているか。 */
  isLimited: boolean;
};

const DEFAULT_LIMIT = 30;
const MIN_KEYWORD_LENGTH = 2;

/** 「自店のみ」フィルタ。homeStoreId 未設定の顧客は隠さない（既存顧客の取りこぼし防止）。 */
function matchesHomeScope(customer: Customer, homeOnly: boolean, currentStoreId?: string): boolean {
  if (!homeOnly) {
    return true;
  }
  // currentStoreId が無い場合は絞り込みできないので安全側で全件対象。
  if (!currentStoreId) {
    return true;
  }
  // 未設定顧客は隠さない。設定済みは現在店舗一致のみ。
  return !customer.homeStoreId || customer.homeStoreId === currentStoreId;
}

/** 1顧客がキーワードに一致するか（各項目の検索ルールを適用）。 */
function matchesKeyword(customer: Customer, keyword: string): boolean {
  const text = normalizeSearchText(keyword);
  const kana = normalizeKana(keyword);
  const digits = normalizePhoneDigits(keyword);

  // 氏名・メール: 部分一致（汎用正規化）。
  if (normalizeSearchText(customer.name).includes(text)) return true;
  if (customer.email && normalizeSearchText(customer.email).includes(text)) return true;

  // フリガナ: 部分一致（カナ正規化）。
  if (customer.nameKana && normalizeKana(customer.nameKana).includes(kana)) return true;

  // 電話番号（phone/phone2/phone3）: 数字正規化後の部分一致。
  if (digits.length > 0) {
    const phones = [customer.phone, customer.phone2, customer.phone3];
    if (phones.some((phone) => phone && normalizePhoneDigits(phone).includes(digits))) {
      return true;
    }
  }

  // 会員番号: 完全一致または前方一致（汎用正規化）。
  if (customer.membershipNumber) {
    const member = normalizeSearchText(customer.membershipNumber);
    if (member === text || member.startsWith(text)) return true;
  }

  return false;
}

/**
 * 顧客検索（表示専用）。
 * - 空文字や2文字未満は結果0件（total=0）。
 * - homeOnly は自店のみ（未設定顧客は隠さない）。
 * - limit（既定30）で表示件数を制限し、total は全ヒット件数を返す。
 */
export function searchCustomers(
  customers: Customer[],
  options: CustomerSearchOptions
): CustomerSearchResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const trimmed = options.keyword.trim();

  if (trimmed.length < MIN_KEYWORD_LENGTH) {
    return { results: [], total: 0, isLimited: false };
  }

  const matched = customers.filter(
    (customer) =>
      matchesHomeScope(customer, options.homeOnly, options.currentStoreId) &&
      matchesKeyword(customer, trimmed)
  );

  return {
    results: matched.slice(0, limit),
    total: matched.length,
    isLimited: matched.length > limit
  };
}
