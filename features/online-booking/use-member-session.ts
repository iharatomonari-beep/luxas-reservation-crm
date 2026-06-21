"use client";

// 公開サイトの会員ログイン状態（第2段はモック）。
// localStorage に「ログイン中の顧客ID」を保持するだけの簡易セッション。
// 第3段で本格認証に差し替える前提（同じ memberId 概念を流用できる）。
import { useEffect, useState } from "react";

const KEY = "luxas-book-member-id";
const EVENT = "luxas-member-change";

function read(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) ?? "";
}

export function useMemberSession() {
  const [memberId, setMemberId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMemberId(read());
    setHydrated(true);
    const sync = () => setMemberId(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function login(customerId: string) {
    window.localStorage.setItem(KEY, customerId);
    window.dispatchEvent(new Event(EVENT));
    setMemberId(customerId);
  }

  function logout() {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
    setMemberId("");
  }

  return { memberId, hydrated, login, logout };
}
