import type { Customer } from "@/features/customers/types";

export const customersStorageKey = "luxas-customers-sample";

export const initialCustomers: Customer[] = [
  {
    id: "customer-001",
    name: "森下 彩",
    nameKana: "モリシタ アヤ",
    phone: "090-1111-2222",
    email: "aya.morishita@example.jp",
    birthDate: "1995-04-18",
    gender: "female",
    address: "東京都渋谷区神宮前1-1-1",
    firstVisitDate: "2026-05-11",
    lastVisitDate: "2026-05-11",
    caution: "肩まわりに強い刺激は避ける。",
    chartMemo: "初回。カウンセリング時に睡眠不足の相談あり。",
    tags: ["初回", "肩", "保湿"],
    isActive: true
  },
  {
    id: "customer-002",
    name: "神谷 玲奈",
    nameKana: "カミヤ レイナ",
    phone: "080-3333-4444",
    email: "reina.kamiya@example.jp",
    birthDate: "1992-09-02",
    gender: "female",
    address: "東京都港区南青山2-3-4",
    firstVisitDate: "2026-05-11",
    lastVisitDate: "2026-05-11",
    caution: "乾燥しやすい。施術後の保湿案内を毎回確認。",
    chartMemo: "次回来店時に保湿ケアを提案。",
    tags: ["再来", "乾燥", "提案記録"],
    isActive: true
  },
  {
    id: "customer-003",
    name: "井上 航",
    nameKana: "イノウエ ワタル",
    phone: "070-5555-6666",
    email: "wataru.inoue@example.jp",
    birthDate: "1988-12-09",
    gender: "male",
    address: "東京都目黒区中目黒3-5-6",
    firstVisitDate: "2026-05-11",
    lastVisitDate: "2026-05-11",
    caution: "当日連絡が入りやすい。受付時に確認を丁寧に行う。",
    chartMemo: "当日キャンセル履歴あり。",
    tags: ["キャンセル注意", "電話確認"],
    isActive: true
  },
  {
    id: "customer-004",
    name: "長谷川 綾",
    nameKana: "ハセガワ アヤ",
    phone: "090-7777-8888",
    email: "aya.hasegawa@example.jp",
    birthDate: "1990-01-27",
    gender: "female",
    address: "東京都新宿区西新宿4-2-8",
    firstVisitDate: "2026-05-12",
    lastVisitDate: "2026-05-12",
    caution: "前回と同じ内容を希望。",
    chartMemo: "前回施術の継続提案が有効。",
    tags: ["継続", "指名あり"],
    isActive: true
  },
  {
    id: "customer-005",
    name: "小林 涼",
    nameKana: "コバヤシ リョウ",
    phone: "090-2222-8888",
    email: "ryo.kobayashi@example.jp",
    birthDate: "1985-07-15",
    gender: "male",
    address: "東京都世田谷区代田1-8-9",
    firstVisitDate: "2026-04-28",
    lastVisitDate: "2026-05-01",
    caution: "現在は無効。過去対応の参照用に残す。",
    chartMemo: "来店停止中。営業連絡不要。",
    tags: ["無効", "参照用"],
    isActive: false
  }
];
