// 予約台帳の日付バーに表示する天気。外部依存なしで Open-Meteo（無料・APIキー不要）を fetch する。
// 取得失敗・範囲外の日付ではプレースホルダ（status="unavailable"）にフォールバックする。
import { useEffect, useState } from "react";

// 店舗ごとの緯度経度（おおよその所在地）。未登録の店舗は東京（渋谷）を既定にする。
const STORE_COORDS: Record<string, { lat: number; lng: number }> = {
  "store-shibuya": { lat: 35.658, lng: 139.701 },
  "store-gotanda-east": { lat: 35.626, lng: 139.724 },
  "store-gotanda-west": { lat: 35.626, lng: 139.722 },
  "store-kinshicho": { lat: 35.697, lng: 139.814 },
  "store-mizonokuchi-premium": { lat: 35.6, lng: 139.611 },
  "store-motomachi-chukagai-plus": { lat: 35.443, lng: 139.646 },
  "store-nakameguro": { lat: 35.644, lng: 139.699 }
};

const DEFAULT_COORD = STORE_COORDS["store-shibuya"];

// WMO weather code → アイコン＋ラベル。Open-Meteo の daily.weather_code に対応。
function weatherCodeToInfo(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀", label: "快晴" };
  if (code === 1) return { icon: "🌤", label: "晴れ" };
  if (code === 2) return { icon: "⛅", label: "薄曇り" };
  if (code === 3) return { icon: "☁", label: "曇り" };
  if (code === 45 || code === 48) return { icon: "🌫", label: "霧" };
  if (code >= 51 && code <= 57) return { icon: "🌦", label: "霧雨" };
  if (code >= 61 && code <= 67) return { icon: "🌧", label: "雨" };
  if (code >= 71 && code <= 77) return { icon: "🌨", label: "雪" };
  if (code >= 80 && code <= 82) return { icon: "🌧", label: "にわか雨" };
  if (code >= 85 && code <= 86) return { icon: "🌨", label: "にわか雪" };
  if (code >= 95) return { icon: "⛈", label: "雷雨" };
  return { icon: "☁", label: "—" };
}

export type DailyWeather =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; icon: string; label: string; tempMax: number; tempMin: number };

// 指定店舗・指定日（YYYY-MM-DD）の天気を Open-Meteo から取得する表示専用フック。
export function useDailyWeather(storeId: string | undefined, dateValue: string): DailyWeather {
  const [weather, setWeather] = useState<DailyWeather>({ status: "loading" });

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      setWeather({ status: "unavailable" });
      return;
    }

    const coord = (storeId && STORE_COORDS[storeId]) || DEFAULT_COORD;
    let cancelled = false;
    const controller = new AbortController();
    // ネットワークが遮断・極端に遅い環境でも「取得中…」のまま固まらないよう8秒で打ち切る。
    const timeout = setTimeout(() => controller.abort(), 8000);
    setWeather({ status: "loading" });

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lng}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo` +
      `&start_date=${dateValue}&end_date=${dateValue}`;

    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("weather fetch failed"))))
      .then((data) => {
        if (cancelled) return;
        const code = data?.daily?.weather_code?.[0];
        const tempMax = data?.daily?.temperature_2m_max?.[0];
        const tempMin = data?.daily?.temperature_2m_min?.[0];

        if (typeof code !== "number" || typeof tempMax !== "number" || typeof tempMin !== "number") {
          setWeather({ status: "unavailable" });
          return;
        }

        const info = weatherCodeToInfo(code);
        setWeather({
          status: "ready",
          icon: info.icon,
          label: info.label,
          tempMax: Math.round(tempMax),
          tempMin: Math.round(tempMin)
        });
      })
      .catch(() => {
        // 取得失敗・タイムアウト（abort）はプレースホルダ表示にフォールバック。
        if (cancelled) return;
        setWeather({ status: "unavailable" });
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [storeId, dateValue]);

  return weather;
}
