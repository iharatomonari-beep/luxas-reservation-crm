import type { CustomerGender } from "@/features/customers/types";

export type ReservationStatus = "booked" | "completed" | "canceled";

export type Reservation = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  phone: string;
  serviceMenuId: string;
  staffId: string;
  roomId: string;
  status: ReservationStatus;
  memo: string;
  /** 所属店舗ID（T063・任意）。未設定＝既存データ扱い（既定店舗 store-shibuya でのみ表示）。新規作成時に現在店舗を付与。 */
  storeId?: string;
  /** 指名スタッフID（顧客が担当を指定）。未設定＝指名なし。指名時は担当スタッフ変更不可（T017） */
  nominatedStaffId?: string;
  /** 会計状況（T022）。未設定＝未会計扱い */
  paymentStatus?: "unpaid" | "paid";
  /** 売上額（円）。会計時に確定（T022） */
  saleAmount?: number;
  /** 支払明細（複数可）。会計時に記録（T022） */
  payments?: ReservationPayment[];
  // --- T030 予約データ完全化（すべて任意・未設定は既定値扱い） ---
  /** こだわり。none=希望なし / male=男性希望 */
  preference?: "none" | "male";
  /** 予約ルートタグID（MasterTag kind=route） */
  bookingTagIds?: string[];
  /** オプション商品ID（ServiceOption） */
  optionIds?: string[];
  /** 個別割引（％） */
  discountPercent?: number;
  /** 個別割引（円） */
  discountYen?: number;
  /** 一括割引（％） */
  bulkDiscountPercent?: number;
  /** 一括割引（円） */
  bulkDiscountYen?: number;
  /** 連続予約フラグ */
  isConsecutive?: boolean;
  /** インターバル（施術後に空ける分数）。同一スタッフの占有・重複判定に加算する（T037） */
  intervalMinutes?: number;
  /** インターバル（施術前に空ける分数）。開始時刻の前に占有を広げ、重複・空き判定に反映する（任意・非破壊） */
  intervalBeforeMinutes?: number;
  // --- T035 キャンセル管理（すべて任意・未設定は none 相当） ---
  /** キャンセル種別。none=未キャンセル / cancel=通常キャンセル / no_show=無断キャンセル / void=取消 */
  cancelType?: CancelType;
  /** キャンセル理由（自由記述） */
  cancelReason?: string;
  /** キャンセル日時（ISO文字列） */
  canceledAt?: string;
  /**
   * 予約以外のブロック（PM §2-3）。未設定=通常予約。
   * "break"=休憩 / "business"=業務。タイムラインの枠は占有するが、来店・売上・施術件数などの集計には含めない。
   */
  blockType?: "break" | "business";
  // --- T067.5-A 顧客紐づけ・性別の土台（すべて任意・非破壊。既存予約は未設定のまま動く） ---
  /** 紐づく既存顧客ID（T067.5-B の顧客検索で設定予定）。未設定＝ゲスト予約／電話・氏名照合 fallback。 */
  customerId?: string;
  /**
   * ゲスト予約の本人性別（顧客未紐づけ時の補助表示用）。
   * 正の性別は紐づく Customer.gender。これは Customer が取れないゲスト予約の fallback に留める。
   * Reservation.preference（男性スタッフ希望）とは無関係。
   */
  guestGender?: CustomerGender;
  /** 会計の物販購入明細（任意・非破壊・旧）。 */
  retailLines?: RetailLine[];
  /** 会計アイテム明細（物販/チケット販売/チケット利用/割引）。saleAmount は course＋物販＋チケット販売−チケット利用−割引。 */
  checkoutLines?: CheckoutLine[];
};

/** 会計の物販購入1行（マスタ商品 or 手入力）。 */
export type RetailLine = {
  /** マスタ商品ID（手入力は未設定）。 */
  itemId?: string;
  name: string;
  /** 単価（円・税込）。 */
  price: number;
  /** 数量。 */
  qty: number;
};

/** 会計アイテム1行。kind により会計での加減算・計上が変わる。 */
export type CheckoutLine = {
  /** 会計アイテムマスタID（手入力は未設定）。 */
  itemId?: string;
  /** retail=物販(+) / ticketSale=チケット販売(+) / ticketUse=チケット利用(-) / discount=割引(-) */
  kind: "retail" | "ticketSale" | "ticketUse" | "discount";
  name: string;
  /** 単価（円）。 */
  amount: number;
  /** 数量。 */
  qty: number;
  /** 物販・チケット利用の担当スタッフ（個人売上紐付け用・任意）。 */
  staffId?: string;
};

export type CancelType = "none" | "cancel" | "no_show" | "void";

export const cancelTypeLabels: Record<CancelType, string> = {
  none: "—",
  cancel: "キャンセル",
  no_show: "無断キャンセル",
  void: "取消"
};

export type PaymentMethod =
  | "cash"
  | "credit"
  | "emoney"
  | "ticket"
  | "prepaid"
  | "point"
  | "giftcard"
  | "epark";

export type ReservationPayment = {
  method: PaymentMethod;
  cardBrand?: string;
  emoneyBrand?: string;
  amount: number;
};

/** 返客記録（電話・飛び込みで受けられなかったお客様）。予約とは別の集計用。 */
export type TurnawayRecord = {
  id: string;
  date: string;
  startTime: string;
  /** 返客 / キャンセル待ち */
  kind: string;
  /** "male" | "female" | "" */
  gender: "male" | "female" | "";
  reason: string;
  comment: string;
  serviceMenuId?: string;
  optionIds?: string[];
  /** こだわり: none=希望なし / male=男性希望 / female=女性希望 */
  preference?: string;
  /** 指名スタッフID */
  nominatedStaffId?: string;
  storeId?: string;
  createdAt?: string;
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "現金",
  credit: "クレジット",
  emoney: "電子マネー",
  ticket: "回数券",
  prepaid: "プリペイド",
  point: "ポイント",
  giftcard: "商品券",
  epark: "EPARK"
};

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  booked: "予約中",
  completed: "完了",
  canceled: "キャンセル"
};
