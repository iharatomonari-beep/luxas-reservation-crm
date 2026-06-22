"use client";

// PWA まわりのクライアント処理: Service Worker 登録＋「ホーム画面に追加」ボタン。
import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { PM_NAVY } from "@/features/online-booking/public-shell";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Service Worker を登録する（描画なし）。
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      // 旧版で root スコープ("/")に登録された Service Worker が残っていると、管理画面を含む
      // 全ナビゲーションをキャッシュし得る。まず /book/ 以外のスコープの登録を解除してから登録し直す（移行）。
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            if (!registration.scope.endsWith("/book/")) {
              registration.unregister().catch(() => {});
            }
          }
        })
        .catch(() => {});

      // 公開予約サイト配下のみを Service Worker のスコープにする。
      navigator.serviceWorker.register("/sw.js", { scope: "/book/" }).catch(() => {});
    }
  }, []);
  return null;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// 「ホーム画面に追加」案内。Android/PC Chrome は1タップ、iOS は手順を表示。
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIos());
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  // iOS でも Android対応端末でもない（=対応プロンプト無し）の場合は何も出さない。
  if (!ios && !deferred) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    setShowIosHint((v) => !v);
  }

  return (
    <div className="rounded-lg border border-luxas-line bg-white p-4">
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: PM_NAVY }}
      >
        <Download size={16} />
        ホーム画面に追加（アプリとして使う）
      </button>
      {ios && showIosHint && (
        <p className="mt-3 flex items-start gap-1 text-xs leading-5 text-stone-600">
          <Share size={14} className="mt-0.5 shrink-0" />
          <span>
            Safari下部の共有ボタン
            <Share size={11} className="mx-0.5 inline" />
            から「ホーム画面に追加」を選ぶと、アプリのように使えます。
          </span>
        </p>
      )}
    </div>
  );
}
