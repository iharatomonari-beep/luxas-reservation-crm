import type { Customer } from "@/features/customers/types";

// ⑤ 顧客の重複検出（PM流「同一人物では？」ポップ用の共通ロジック）。
// 電話・メール・氏名(カナ) のいずれかが一致したら「同一人物の可能性あり」とみなす。
// ★統合済み(mergedInto)・非アクティブは候補から除外。自分自身(excludeId)も除外。

export type CustomerMatchInput = {
  name?: string;
  nameKana?: string;
  phone?: string;
  email?: string;
};

export type DuplicateMatchKind = "phone" | "email" | "name";

export type DuplicateMatch = {
  customer: Customer;
  kinds: DuplicateMatchKind[];
};

function normalizePhone(value: string | undefined): string {
  return (value ?? "").replace(/[^0-9]/g, "");
}
function normalizeEmail(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}
function normalizeName(value: string | undefined): string {
  return (value ?? "").replace(/\s/g, "");
}

// 入力（電話/氏名/メール）に一致する既存顧客を返す。一致した観点(kinds)も付ける。
// ゲスト名（"ゲスト" や空）は氏名一致の対象にしない（全ゲストが誤検出されるのを防ぐ）。
export function findDuplicateCustomers(
  customers: Customer[],
  input: CustomerMatchInput,
  excludeId?: string
): DuplicateMatch[] {
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const kana = normalizeName(input.nameKana);
  const nameIsGuest = name === "" || input.name?.trim() === "ゲスト";

  const matches: DuplicateMatch[] = [];

  for (const customer of customers) {
    if (excludeId && customer.id === excludeId) continue;
    if (customer.mergedInto) continue;
    if (customer.isActive === false) continue;

    const kinds: DuplicateMatchKind[] = [];

    if (phone && normalizePhone(customer.phone) === phone) {
      kinds.push("phone");
    }
    if (email && normalizeEmail(customer.email) === email) {
      kinds.push("email");
    }
    if (!nameIsGuest) {
      const cName = normalizeName(customer.name);
      const cKana = normalizeName(customer.nameKana);
      // 氏名一致＝氏名が一致、またはカナが一致（どちらか）。
      if ((name && cName === name) || (kana && cKana === kana)) {
        kinds.push("name");
      }
    }

    if (kinds.length > 0) {
      matches.push({ customer, kinds });
    }
  }

  // 一致観点が多い順（電話＋氏名など強い一致を上に）。
  matches.sort((a, b) => b.kinds.length - a.kinds.length);
  return matches;
}

export const duplicateMatchKindLabel: Record<DuplicateMatchKind, string> = {
  phone: "電話番号",
  email: "メール",
  name: "氏名"
};
