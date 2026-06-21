// 予約をカレンダーに追加するための iCalendar(.ics) 文字列を組み立てる（依存追加なし・外部送信なし）。
// 端末のカレンダーアプリにインポートできる最小フォーマット。

export type IcsEvent = {
  uid: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  title: string;
  description?: string;
  location?: string;
};

// "YYYY-MM-DD" + "HH:MM" → "YYYYMMDDTHHMMSS"（フローティングローカル時刻）。
function toIcsDateTime(date: string, time: string): string {
  const d = date.replace(/-/g, "");
  const t = `${(time || "00:00").replace(/:/g, "")}00`;
  return `${d}T${t}`;
}

// 改行・カンマ・セミコロンのエスケープ（RFC5545）。
function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(ev: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LUXAS//Reservation//JP",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ev.uid}@luxas`,
    `DTSTART:${toIcsDateTime(ev.date, ev.startTime)}`,
    `DTEND:${toIcsDateTime(ev.date, ev.endTime)}`,
    `SUMMARY:${escapeText(ev.title)}`,
    ...(ev.description ? [`DESCRIPTION:${escapeText(ev.description)}`] : []),
    ...(ev.location ? [`LOCATION:${escapeText(ev.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.join("\r\n");
}
