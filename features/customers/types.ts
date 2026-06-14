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
};

export const customerGenderLabels: Record<CustomerGender, string> = {
  female: "女性",
  male: "男性",
  other: "その他",
  unspecified: "未回答"
};
