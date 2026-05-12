// hooks/useLocalStorage.ts
"use client";

import { useEffect, useState } from "react";

/**
 * state 를 localStorage 와 자동 동기화하는 훅.
 * @param key      localStorage 키
 * @param initial  값이 없을 때의 초기값
 */
export function useLocalStorage<T>(key: string, initial: T) {
  // 초기값: localStorage 에서 읽어오기 (없으면 initial)
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial; // SSR 안전 가드
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  // value 가 바뀔 때마다 localStorage 에 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 실패는 조용히 무시 (용량 초과 등)
    }
  }, [key, value]);

  return [value, setValue] as const;
}
