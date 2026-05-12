// hooks/useDebounce.ts
"use client";

import { useEffect, useState } from "react";

/**
 * 값이 안정될 때까지 기다렸다가 반환하는 훅.
 * @param value  추적할 값
 * @param delay  안정 대기 시간 (ms), 기본 300ms
 * @returns      delay 동안 변화가 없으면 비로소 반영된 값
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // value 가 바뀔 때마다 timeout 시작
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    // 클린업: value 가 또 바뀌면 이전 timeout 취소
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}
