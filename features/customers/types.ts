export type CustomerGender = "female" | "male" | "other" | "unspecified";

export type Customer = {
  id: string;
  peakManagerCustomerId?: string;
  name: string;
  nameKana: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: CustomerGender;
  address: string;
  membershipNumber?: string;
  occupation?: string;
  postalCode?: string;
  prefecture?: string;
  addressLine1?: string;
  addressLine2?: string;
  dmSend?: string;
  newsletterEmail?: string;
  rank?: string;
  caution1?: string;
  caution2?: string;
  firstVisitAt?: string;
  firstVisitStore?: string;
  lastVisitAt?: string;
  lastVisitStore?: string;
  totalVisits?: string;
  totalSalesExTax?: string;
  totalSalesIncTax?: string;
  phoneReservationCount?: string;
  pcOnlineReservationCount?: string;
  mobileOnlineReservationCount?: string;
  cancelCount?: string;
  noShowCount?: string;
  firstVisitDate: string;
  lastVisitDate: string;
  caution: string;
  chartMemo: string;
  tags: string[];
  isActive: boolean;
  // --- T067 顧客基本項目の拡張（すべて任意・非破壊。既存の name/phone/email 等は主項目として維持）---
  /** 電話番号2 */
  phone2?: string;
  /** 電話番号3 */
  phone3?: string;
  /** メールアドレス2 */
  email2?: string;
  /** メール受け取り可否 */
  acceptsEmail?: boolean;
  /** DM受け取り可否 */
  acceptsDm?: boolean;
  /** プッシュ通知受け取り可否 */
  acceptsPush?: boolean;
  /** コメント（一般） */
  comment?: string;
  /** 備考1 */
  note1?: string;
  /** 備考2 */
  note2?: string;
  /** 母店 / 所属店舗ID（T064 staff の homeStoreId と同命名）。未設定＝既定店舗扱い。店舗scopeとは独立。 */
  homeStoreId?: string;
  /** 適用開始日（"YYYY-MM-DD"） */
  effectiveStartDate?: string;
  /** 適用終了日（"YYYY-MM-DD"） */
  effectiveEndDate?: string;
  /** 作成日時（ISO・保存時に自動付与） */
  createdAt?: string;
  /** 更新日時（ISO・保存時に自動更新） */
  updatedAt?: string;
  /** 作成者ID（将来：認証ユーザー） */
  createdById?: string;
  /** 更新者ID（将来：認証ユーザー） */
  updatedById?: string;
};

export const customerGenderLabels: Record<CustomerGender, string> = {
  female: "女性",
  male: "男性",
  other: "その他",
  unspecified: "未回答"
};
