import type { Customer, CustomerGender } from "@/features/customers/types";
import type { DbContext, TableMapper } from "./types";

// 顧客は店舗専属ではなくテナント共有（参照=全スタッフ）。store_id は NOT NULL のため既定店舗で埋める。
function resolveDefaultStoreId(ctx: DbContext): string | null {
  return ctx.storeIdByCode[ctx.defaultStoreCode] ?? null;
}

// コアPII列は実列にマッピングし、テーブルに無い追加項目（visit/sales集計・T067拡張・各種日付 等）は
// profile(jsonb) に退避する（staff/services と同方式）。
// ★教訓: アプリで空になり得る列は DB で NULL 許容。空文字↔null の往復をここで吸収する。
//   - 任意項目（未設定＝キー無し）は null へ書き、読み戻しは undefined（= JSON.stringify で消える＝原本と一致）。
//   - 必須文字列項目（name 等）は "" を許容してそのまま往復する。
export const customerMapper: TableMapper<Customer> = {
  table: "customers",

  idOf: (item) => item.id,

  fromRow(row) {
    const profile = (row.profile as Partial<Customer>) ?? {};
    return {
      // profile を先に展開し、コア列で上書き（DB列を正とする）。
      ...profile,
      id: (row.legacy_id as string | null) ?? (row.id as string),
      // 必須文字列（"" を許容してそのまま往復）。
      name: (row.name as string | null) ?? "",
      nameKana: (row.name_kana as string | null) ?? "",
      phone: (row.phone as string | null) ?? "",
      email: (row.email as string | null) ?? "",
      birthDate: (row.birth_date as string | null) ?? "",
      gender: (row.gender as CustomerGender | null) ?? "unspecified",
      address: (row.address as string | null) ?? "",
      caution: (row.caution as string | null) ?? "",
      chartMemo: (row.chart_memo as string | null) ?? "",
      tags: (row.tags as string[] | null) ?? [],
      isActive: (row.is_active as boolean | null) ?? true,
      firstVisitDate: (profile.firstVisitDate as string | undefined) ?? "",
      lastVisitDate: (profile.lastVisitDate as string | undefined) ?? "",
      // 任意のコア列（null → undefined で原本と一致）。
      peakManagerCustomerId: (row.peak_manager_customer_id as string | null) ?? undefined,
      postalCode: (row.postal_code as string | null) ?? undefined,
      prefecture: (row.prefecture as string | null) ?? undefined,
      addressLine1: (row.address_line1 as string | null) ?? undefined,
      addressLine2: (row.address_line2 as string | null) ?? undefined,
      membershipNumber: (row.membership_number as string | null) ?? undefined,
      occupation: (row.occupation as string | null) ?? undefined
    } as Customer;
  },

  toRow(item, ctx) {
    // コア列を取り出し、残り（追加項目・各種集計・日付・T067拡張 等）は profile へ退避。
    const {
      id,
      name,
      nameKana,
      phone,
      email,
      birthDate,
      gender,
      address,
      caution,
      chartMemo,
      tags,
      isActive,
      peakManagerCustomerId,
      postalCode,
      prefecture,
      addressLine1,
      addressLine2,
      membershipNumber,
      occupation,
      ...rest
    } = item;

    const profile: Record<string, unknown> = { ...rest };

    return {
      legacy_id: id,
      tenant_id: ctx.tenantId,
      store_id: resolveDefaultStoreId(ctx),
      peak_manager_customer_id: peakManagerCustomerId ?? null,
      name,
      name_kana: nameKana ?? null,
      phone: phone ?? null,
      email: email ?? null,
      // date 列は空文字を受け付けないため "" → null。
      birth_date: birthDate ? birthDate : null,
      gender: gender ?? null,
      postal_code: postalCode ?? null,
      prefecture: prefecture ?? null,
      address_line1: addressLine1 ?? null,
      address_line2: addressLine2 ?? null,
      address: address ?? null,
      membership_number: membershipNumber ?? null,
      occupation: occupation ?? null,
      caution: caution ?? null,
      chart_memo: chartMemo ?? null,
      tags: tags ?? [],
      is_active: isActive ?? true,
      profile
    };
  }
};
