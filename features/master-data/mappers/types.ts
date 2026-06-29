// データ移行（第3区切り）の切替層で使う共通型。
// 画面は触らず、localStorage ⇄ Supabase の差分をここの「マッパー」で吸収する。

/** マッパーが書き込み時に必要とする実行コンテキスト（テナント・店舗・他テーブル参照の解決）。 */
export type DbContext = {
  /** ログイン中ユーザーのテナントID（DBのuuid）。 */
  tenantId: string | null;
  /** stores.code → stores.id(uuid) の対応（店舗をcodeで解決するため）。 */
  storeIdByCode: Record<string, string>;
  /** 店舗未設定時の既定店舗code。 */
  defaultStoreCode: string;
  /** staff.legacy_id（JS文字列ID）→ staff.id(uuid) の対応（shifts等のFK解決用）。 */
  staffIdByLegacy: Record<string, string>;
  /** services.legacy_id → services.id(uuid) の対応（reservations のFK解決用）。 */
  serviceIdByLegacy: Record<string, string>;
  /** rooms.legacy_id → rooms.id(uuid) の対応（reservations のFK解決用）。 */
  roomIdByLegacy: Record<string, string>;
  /** retail_items.legacy_id → retail_items.id(uuid) の対応（retail_sales のFK解決用）。 */
  retailItemIdByLegacy: Record<string, string>;
  /** expense_accounts.legacy_id → expense_accounts.id(uuid) の対応（expense_entries のFK解決用）。 */
  expenseAccountIdByLegacy: Record<string, string>;
  /** mail_templates.legacy_id → mail_templates.id(uuid) の対応（配信/自動ルールのFK解決用）。 */
  mailTemplateIdByLegacy: Record<string, string>;
};

/** 1テーブルぶんの localStorage(JS型T) ⇄ DB行 の対応。 */
export type TableMapper<T> = {
  /** DBテーブル名。 */
  table: string;
  /** JS側の安定キー（差分検出・突き合わせに使う）。 */
  idOf(item: T): string;
  /** DB行 → JS型。 */
  fromRow(row: Record<string, unknown>): T;
  /** JS型 → DB行（upsert用）。tenant/storeはctxで解決。 */
  toRow(item: T, ctx: DbContext): Record<string, unknown>;
};
