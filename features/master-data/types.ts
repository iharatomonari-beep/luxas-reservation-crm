export type StaffRole = "owner" | "manager" | "therapist" | "reception";

export type StaffMember = {
  id: string;
  fullName: string;
  displayName: string;
  role: StaffRole;
  sortOrder: number;
  serviceMenuIds: string[];
  isActive: boolean;
  /** 所属店舗ID（T064・任意）。未設定＝既定店舗 store-shibuya 扱い。台帳縦軸はシフト基準で表示し、所属だけでは表示しない。 */
  homeStoreId?: string;
  /** 在籍 開始日（"YYYY-MM-DD"・任意・T064）。 */
  startDate?: string;
  /** 在籍 終了日（"YYYY-MM-DD"・任意・T064）。在籍終了後は新規候補・台帳縦軸に出さない運用（過去予約の名前解決のためデータは残す）。 */
  endDate?: string;
  /** 作成日時（ISO・任意・T064.5）。保存時に自動付与（表示のみ）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。保存時に自動更新（表示のみ）。 */
  updatedAt?: string;
};

export type ServiceMenu = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  category: string;
  sortOrder: number;
  isActive: boolean;
  /**
   * 個室必須メニューかどうか。true=個室枠、false/未設定=施術ブース枠で空きを判定する（T010）。
   * 任意フィールド: 既存のメニュー生成箇所（service-manager 等・本タスクでは変更不可）を壊さないため optional。
   */
  requiresPrivateRoom?: boolean;
  /** オンライン予約に掲載するか（PM準拠・T053）。任意・未設定は非掲載扱い。 */
  onlineBooking?: boolean;
  /** 男性可（PM §4-1・任意）。未設定=可。新規予約で性別=男性のとき不可コースを抑止する。 */
  maleAllowed?: boolean;
  /** 女性可（PM §4-1・任意）。未設定=可。新規予約で性別=女性のとき不可コースを抑止する。 */
  femaleAllowed?: boolean;
  /** 事前準備時間（分・PM §4-1・任意）。コース選択時に予約の「施術前インターバル」へ初期反映。 */
  prepMinutes?: number;
  /** 片付け時間（分・PM §4-1・任意）。コース選択時に予約の「施術後インターバル」へ初期反映。 */
  cleanupMinutes?: number;
  /**
   * 提供店舗範囲（T065・任意）。未設定 or "all" =全店共通。"selected" のとき storeIds の店舗のみで提供。
   * 予約作成の「選択候補」だけを店舗で絞るために使う。過去予約のメニュー名 lookup（full配列）には使わない（履歴を壊さない）。
   */
  storeScope?: "all" | "selected";
  /** storeScope="selected" のときの提供店舗ID一覧（T065・任意）。1件=店舗専用、複数=複数店舗対応。 */
  storeIds?: string[];
  /** 予約カードの背景色（T066・任意・色キー: green/rose/sky/amber/violet/teal/stone）。未設定はカテゴリ色→デフォルト。 */
  color?: string;
  /** 作成日時（ISO・任意・T064.5）。保存時に自動付与（表示のみ）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。保存時に自動更新（表示のみ）。 */
  updatedAt?: string;
};

// セット商品マスタ（PM準拠・T053）。コースの組み合わせ等を1商品として扱う。既存ServiceMenuとは別管理。
export type CourseSet = {
  id: string;
  name: string;
  category: string;
  price: number;
  sortOrder: number;
  onlineBooking?: boolean;
  isActive: boolean;
  /** 作成日時（ISO・任意・T064.5）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。 */
  updatedAt?: string;
};

export type RoomKind = "treatment" | "private" | "counseling" | "other";

export type ServiceRoom = {
  id: string;
  name: string;
  kind: RoomKind;
  memo: string;
  isActive: boolean;
};

export type StaffShift = {
  id: string;
  staffId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  memo: string;
  isActive: boolean;
  /** 勤務店舗ID（T064・任意）。未設定＝既定店舗 store-shibuya のシフト扱い。ヘルプ勤務は応援先店舗の storeId を持つシフトで表現する。 */
  storeId?: string;
  /** 作成日時（ISO・任意・T064.5）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。 */
  updatedAt?: string;
};

export const staffRoleLabels: Record<StaffRole, string> = {
  owner: "責任者",
  manager: "店長",
  therapist: "施術スタッフ",
  reception: "受付"
};

export const roomKindLabels: Record<RoomKind, string> = {
  treatment: "施術ブース",
  private: "個室",
  counseling: "カウンセリング",
  other: "その他"
};

// メニューカテゴリマスタ（T024）。既存の service.category(文字列) と並存（name で対応）。
export type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  color: string;
  isActive: boolean;
  /** 作成日時（ISO・任意・T064.5）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。 */
  updatedAt?: string;
};

// オプション商品マスタ（T024）
export type OptionKind = "extension" | "discount" | "other";

export type ServiceOption = {
  id: string;
  name: string;
  category: string;
  price: number;
  sortOrder: number;
  onlineBookable: boolean;
  kind: OptionKind;
  /** kind=extension のときの延長分数 */
  extensionMinutes?: number;
  /** kind=discount のときの割引率(%) */
  discountPercent?: number;
  isActive: boolean;
  /** 作成日時（ISO・任意・T064.5）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。 */
  updatedAt?: string;
};

export const optionKindLabels: Record<OptionKind, string> = {
  extension: "延長",
  discount: "割引",
  other: "その他"
};

// 会計アイテムマスタ。会計画面の4区分（物販/チケット販売/チケット利用/割引）の事前登録アイテム。
// kind により会計での加減算と計上が変わる:
//  retail      物販        … 支払金額に+ / 売上計上 / 担当スタッフ紐付け（個人物販売上）
//  ticketSale  チケット販売 … 支払金額に+ / 預り金として計上
//  ticketUse   チケット利用 … 支払金額から- / 売上計上（個人売上にも紐付け）
//  discount    割引        … 支払金額から- / 売上マイナス
export type CheckoutItemKind =
  | "discount" // 割引（−）
  | "couponUse" // 回数券利用（−）
  | "ticketUse" // チケット利用（−）
  | "couponSale" // 回数券販売（＋・預り）
  | "ticketSale" // チケット販売（＋・預り）
  | "retail"; // 物販（＋・売上）

export type CheckoutItem = {
  id: string;
  kind: CheckoutItemKind;
  name: string;
  /** プリセット金額（円・税込）。 */
  amount: number;
  sortOrder: number;
  isActive: boolean;
  /** 作成日時（ISO・任意）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意）。 */
  updatedAt?: string;
};

export const checkoutItemKindLabels: Record<CheckoutItemKind, string> = {
  discount: "割引",
  couponUse: "回数券利用",
  ticketUse: "チケット利用",
  couponSale: "回数券販売",
  ticketSale: "チケット販売",
  retail: "物販"
};

// タグマスタ（T025）。種別=顧客タグ/予約ルートタグ/施術カルテタグ。
export type TagKind = "customer" | "route" | "karte";

export type MasterTag = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  kind: TagKind;
  isActive: boolean;
};

export const tagKindLabels: Record<TagKind, string> = {
  customer: "顧客タグ",
  route: "予約ルートタグ",
  karte: "施術カルテタグ"
};

// 決済マスタ（T029）。会計の支払種類の選択肢に使う想定。
export type CreditCardCompany = {
  id: string;
  name: string;
  feePercent: number;
  sortOrder: number;
  isActive: boolean;
};

export type EmoneyBrand = {
  id: string;
  name: string;
  feePercent: number;
  sortOrder: number;
  isActive: boolean;
};

// 物販マスタ（T032）。物販カテゴリ／物販商品。
export type RetailCategory = {
  id: string;
  name: string;
  /** 省略名（PM準拠・T053・任意）。 */
  shortName?: string;
  sortOrder: number;
  isActive: boolean;
};

export type RetailItem = {
  id: string;
  name: string;
  /** 物販カテゴリ名（RetailCategory.name と対応。既存マスタと同様に文字列で並存） */
  category: string;
  /** 単価（円・税込） */
  price: number;
  sortOrder: number;
  isActive: boolean;
  /** 作成日時（ISO・任意・T064.5）。 */
  createdAt?: string;
  /** 最終更新日時（ISO・任意・T064.5）。 */
  updatedAt?: string;
};

// 物販販売（T032）。会計(T022)との結合は将来。まずは物販単体で記録する。
export type RetailSale = {
  id: string;
  /** 販売日（"YYYY-MM-DD"） */
  saleDate: string;
  /** 顧客名（任意・空文字可） */
  customerName: string;
  retailItemId: string;
  quantity: number;
  /** 販売時点の単価（マスタ変更の影響を受けないようスナップショット） */
  unitPrice: number;
};
