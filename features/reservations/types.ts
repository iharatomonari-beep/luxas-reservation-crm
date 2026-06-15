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
  // --- T035 キャンセル管理（すべて任意・未設定は none 相当） ---
  /** キャンセル種別。none=未キャンセル / cancel=通常キャンセル / no_show=無断キャンセル / void=取消 */
  cancelType?: CancelType;
  /** キャンセル理由（自由記述） */
  cancelReason?: string;
  /** キャンセル日時（ISO文字列） */
  canceledAt?: string;
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
