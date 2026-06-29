"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { DbContext, TableMapper } from "./mappers/types";

const DEFAULT_STORE_CODE = "store-shibuya";

// ログイン中ユーザーのテナントと、店舗code→uuid の対応を読む（RLSで自テナントに限定される）。
export async function loadDbContext(): Promise<DbContext> {
  const sb = createSupabaseBrowserClient();
  const [users, stores, staff, services, rooms, retailItems, expenseAccounts, mailTemplates] = await Promise.all([
    sb.from("users").select("tenant_id").limit(1),
    sb.from("stores").select("id, code"),
    sb.from("staff").select("id, legacy_id"),
    sb.from("services").select("id, legacy_id"),
    sb.from("rooms").select("id, legacy_id"),
    sb.from("retail_items").select("id, legacy_id"),
    sb.from("expense_accounts").select("id, legacy_id"),
    sb.from("mail_templates").select("id, legacy_id")
  ]);
  if (users.error) throw users.error;
  if (stores.error) throw stores.error;
  if (staff.error) throw staff.error;
  if (services.error) throw services.error;
  if (rooms.error) throw rooms.error;
  if (retailItems.error) throw retailItems.error;
  if (expenseAccounts.error) throw expenseAccounts.error;
  if (mailTemplates.error) throw mailTemplates.error;

  const tenantId = (users.data?.[0]?.tenant_id as string | undefined) ?? null;
  const storeIdByCode: Record<string, string> = {};
  for (const s of (stores.data ?? []) as Array<{ id: string; code: string | null }>) {
    if (s.code) {
      storeIdByCode[s.code] = s.id;
    }
  }

  const buildLegacyMap = (rows: Array<{ id: string; legacy_id: string | null }> | null) => {
    const map: Record<string, string> = {};
    for (const r of rows ?? []) {
      if (r.legacy_id) {
        map[r.legacy_id] = r.id;
      }
    }
    return map;
  };
  const staffIdByLegacy = buildLegacyMap(staff.data as Array<{ id: string; legacy_id: string | null }>);
  const serviceIdByLegacy = buildLegacyMap(services.data as Array<{ id: string; legacy_id: string | null }>);
  const roomIdByLegacy = buildLegacyMap(rooms.data as Array<{ id: string; legacy_id: string | null }>);
  const retailItemIdByLegacy = buildLegacyMap(retailItems.data as Array<{ id: string; legacy_id: string | null }>);
  const expenseAccountIdByLegacy = buildLegacyMap(expenseAccounts.data as Array<{ id: string; legacy_id: string | null }>);
  const mailTemplateIdByLegacy = buildLegacyMap(mailTemplates.data as Array<{ id: string; legacy_id: string | null }>);

  return {
    tenantId,
    storeIdByCode,
    defaultStoreCode: DEFAULT_STORE_CODE,
    staffIdByLegacy,
    serviceIdByLegacy,
    roomIdByLegacy,
    retailItemIdByLegacy,
    expenseAccountIdByLegacy,
    mailTemplateIdByLegacy
  };
}

// ---- singleton 設定（useLocalCollection でない・1テナント1行の jsonb）----
// テナント1行の settings(jsonb) を読む（無ければ null）。
export async function loadTenantSettings(table: string): Promise<Record<string, unknown> | null> {
  const ctx = await loadDbContext();
  if (!ctx.tenantId) {
    return null;
  }
  const sb = createSupabaseBrowserClient();
  const { data, error } = await sb.from(table).select("settings").eq("tenant_id", ctx.tenantId).limit(1);
  if (error) throw error;
  const row = (data ?? [])[0] as { settings?: Record<string, unknown> } | undefined;
  return row?.settings ?? null;
}

// テナント1行の settings(jsonb) を upsert（tenant_id 突き合わせ）。
export async function saveTenantSettings(table: string, settings: Record<string, unknown>): Promise<void> {
  const ctx = await loadDbContext();
  if (!ctx.tenantId) {
    throw new Error("DB tenant not ready");
  }
  const sb = createSupabaseBrowserClient();
  const { error } = await sb.from(table).upsert({ tenant_id: ctx.tenantId, settings }, { onConflict: "tenant_id" });
  if (error) throw error;
}

// 店舗設定（店舗ごと1行 jsonb）の読み。
// セッション有り（管理画面・authenticated）→ store_settings テーブルを直読み＝全項目。
// セッション無し（公開ページ・anon）→ 公開RPC get_store_public_settings＝安全フィールドのみ。
export async function loadStoreSettings(
  storeCode: string | undefined
): Promise<{ settings: Record<string, unknown> | null; canWrite: boolean }> {
  const sb = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await sb.auth.getSession();

  if (session) {
    const ctx = await loadDbContext();
    const code = storeCode || ctx.defaultStoreCode;
    const storeUuid = ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode];
    if (!storeUuid) {
      return { settings: null, canWrite: true };
    }
    const { data, error } = await sb.from("store_settings").select("settings").eq("store_id", storeUuid).limit(1);
    if (error) throw error;
    return { settings: ((data ?? [])[0]?.settings as Record<string, unknown>) ?? null, canWrite: true };
  }

  // anon: 公開RPC（安全フィールドのみ）。ctx/loadDbContext は使わない（認証不要）。
  const code = storeCode || "store-shibuya";
  const { data, error } = await sb.rpc("get_store_public_settings", { p_store_code: code });
  if (error) throw error;
  return { settings: (data as Record<string, unknown> | null) ?? null, canWrite: false };
}

// 店舗設定の保存（管理画面のみ・authenticated）。store_id 突き合わせで upsert。
export async function saveStoreSettings(storeCode: string | undefined, settings: Record<string, unknown>): Promise<void> {
  const ctx = await loadDbContext();
  const code = storeCode || ctx.defaultStoreCode;
  const storeUuid = ctx.storeIdByCode[code] ?? ctx.storeIdByCode[ctx.defaultStoreCode];
  if (!ctx.tenantId || !storeUuid) {
    throw new Error("store/tenant not ready");
  }
  const sb = createSupabaseBrowserClient();
  const { error } = await sb
    .from("store_settings")
    .upsert({ tenant_id: ctx.tenantId, store_id: storeUuid, settings }, { onConflict: "store_id" });
  if (error) throw error;
}

// 監査ログを best-effort で記録する（フェーズ4 S2）。
// - セッション有り（管理画面・authenticated）のときのみ記録。local/未ログイン/Supabase未設定は no-op。
// - ★失敗してもUXを止めない（握り潰して console に出すだけ）。
// - ★PII は渡さない（呼び出し側は target_id と非PIIメタのみ。RPC側もホワイトリストで構造的に排除）。
//   actor/role/tenant/store は RPC が auth から解決する（クライアントは偽装できない）。
export async function logAudit(
  actionType: string,
  targetType: string,
  targetId: string | null,
  detail: Record<string, unknown> = {}
): Promise<void> {
  try {
    const sb = createSupabaseBrowserClient();
    const {
      data: { session }
    } = await sb.auth.getSession();
    if (!session) {
      return; // local / 未ログインは記録しない
    }
    const { error } = await sb.rpc("log_audit", {
      p_action_type: actionType,
      p_target_type: targetType,
      p_target_id: targetId,
      p_detail: detail,
      p_result: "success"
    });
    if (error) {
      console.error("[supabase] log_audit failed", error);
    }
  } catch (error) {
    console.error("[supabase] log_audit error", error);
  }
}

// 現在ログイン中ユーザーが owner ロールか（UIの表示制御用・フェーズ4 S3）。
// セッション無し（local/未ログイン/Supabase未設定）は false。判定は app_is_owner() RPC（auth解決）。
export async function isOwner(): Promise<boolean> {
  try {
    const sb = createSupabaseBrowserClient();
    const {
      data: { session }
    } = await sb.auth.getSession();
    if (!session) {
      return false;
    }
    const { data, error } = await sb.rpc("app_is_owner");
    if (error) {
      console.error("[supabase] app_is_owner failed", error);
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}

// 顧客CSV一括出力（★owner限定・サーバー強制）。フェーズ4 S3。
// export_customers() RPC を呼ぶ。non-owner はサーバーで拒否され throw する（UI迂回しても出力不可）。
// 監査記録は RPC 内部で必ず行われる（クライアントからは別途記録しない）。
export async function exportCustomersViaRpc(): Promise<Array<Record<string, unknown>>> {
  const sb = createSupabaseBrowserClient();
  const { data, error } = await sb.rpc("export_customers");
  if (error) {
    throw error;
  }
  return (data ?? []) as Array<Record<string, unknown>>;
}

// 1件を即時 INSERT して完了を待つ（作成ページのように直後にウィンドウを閉じる画面で、
// 非同期の保存がabortされて消えるのを防ぐ。呼び出し側で await する）。
export async function insertViaMapper<T>(mapper: TableMapper<T>, item: T): Promise<void> {
  const ctx = await loadDbContext();
  const sb = createSupabaseBrowserClient();
  const row = mapper.toRow(item, ctx);
  const { error } = await sb.from(mapper.table).insert(row);
  if (error) {
    console.error(`[supabase] insert ${mapper.table} failed: ${error.message} (${error.code})`);
    throw error;
  }
}

// テーブルの全行を読む（RLSで自テナント/店舗に限定される）。
export async function loadRows(table: string): Promise<Array<Record<string, unknown>>> {
  const sb = createSupabaseBrowserClient();
  const { data, error } = await sb.from(table).select("*");
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}

// 直前の配列(prev)と現在の配列(next)を突き合わせ、変更分を upsert・消えた分を delete する。
// 突き合わせキーは legacy_id（JS側の文字列ID）。
export async function syncToSupabase<T>(
  mapper: TableMapper<T>,
  ctx: DbContext | null,
  prev: T[],
  next: T[]
): Promise<void> {
  if (!ctx) {
    throw new Error("DB context not ready");
  }
  const sb = createSupabaseBrowserClient();

  const prevById = new Map(prev.map((item) => [mapper.idOf(item), item] as const));
  const nextIds = new Set(next.map((item) => mapper.idOf(item)));

  const changed = next.filter((item) => {
    const before = prevById.get(mapper.idOf(item));
    return !before || JSON.stringify(before) !== JSON.stringify(item);
  });
  const deletedIds = prev
    .map((item) => mapper.idOf(item))
    .filter((id) => !nextIds.has(id));

  // 新規は INSERT、既存は legacy_id で UPDATE に分離する。
  // upsert(onConflict=legacy_id) だと「既存行の更新」でも一旦 INSERT を試みるため、
  // reservations の二重予約防止(EXCLUDE)制約に自分自身が抵触して更新が失敗する。
  // UPDATE は対象行を除外して制約評価するため安全。
  const toInsert = changed.filter((item) => !prevById.has(mapper.idOf(item)));
  const toUpdate = changed.filter((item) => prevById.has(mapper.idOf(item)));

  if (toInsert.length > 0) {
    const rows = toInsert.map((item) => mapper.toRow(item, ctx));
    const { error } = await sb.from(mapper.table).insert(rows);
    if (error) {
      console.error(`[supabase] insert ${mapper.table} failed: ${error.message} (${error.code})`);
      throw error;
    }
  }

  for (const item of toUpdate) {
    const row = mapper.toRow(item, ctx);
    const { error } = await sb.from(mapper.table).update(row).eq("legacy_id", mapper.idOf(item));
    if (error) {
      console.error(`[supabase] update ${mapper.table} failed: ${error.message} (${error.code})`);
      throw error;
    }
  }

  if (deletedIds.length > 0) {
    const { error } = await sb.from(mapper.table).delete().in("legacy_id", deletedIds);
    if (error) throw error;
  }
}
