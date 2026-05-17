// app/sandbox/ch10/page.tsx
"use client";

import { useEffect, useState } from "react";

// === 커스텀 훅 정의 (한 파일 안) ===
function useCh10Debounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useCh10LocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    // ⭐ 함수형 초기화 — 첫 렌더에만 실행
    if (typeof window === "undefined") return initial; // SSR 안전 서버에서 렌더링 중일 때는 initial을 리턴하여 불일치 방지
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = (v: T) => {
    setValue(v);
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };

  return [value, set];
}

// === 데모 ① 즉시 값 vs 디바운스 값 ===
function DebounceDemo() {
  const [input, setInput] = useState("");
  const debounced = useCh10Debounce(input, 500);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        useDebounce — 빠르게 변하는 값을 500ms 후 안정화
      </h3>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="여기에 빠르게 타이핑..."
        className="mb-3 w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-cyan-400/40 focus:outline-none"
      />

      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-1 text-xs text-zinc-500">즉시 값 (input)</div>
          <div className="font-mono text-sm text-cyan-400">{input || "—"}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-1 text-xs text-zinc-500">디바운스 값 (debounced, 500ms)</div>
          <div className="font-mono text-sm text-lime-400">{debounced || "—"}</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 타이핑 멈춘 후 500ms 가 지나면 debounced 갱신. 검색 API 호출 횟수 줄이는 데 적합.
      </p>
    </div>
  );
}

// === 데모 ② localStorage 자동 동기화 ===
function LocalStorageDemo() {
  const [name, setName] = useCh10LocalStorage<string>("ch10-demo-name", "");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        useLocalStorage — useState 처럼 쓰면 localStorage 도 자동 저장
      </h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력..."
        className="mb-3 w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
        <div className="mb-1 text-xs text-zinc-500">현재 값:</div>
        <div className="font-mono text-sm text-cyan-400">{name || "—"}</div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 입력 후 새로고침 (F5) → 값이 그대로! localStorage 에 자동 저장됨.
        <br />
        useState 인터페이스 그대로 — 호출하는 쪽은 차이를 모름.
      </p>
    </div>
  );
}

// === 데모 ③ use 접두사 규칙 ===
function NamingRuleDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">use 접두사 — 그저 컨벤션이 아닌 React 의 약속</h3>

      <div className="space-y-2 text-xs">
        <div className="rounded border border-lime-500/30 bg-lime-500/5 p-3">
          <code className="text-lime-300">function useDebounce(value, delay) {`{...}`}</code>
          <div className="mt-1 text-zinc-500">
            ✓ React 가 &quot;이건 훅이다&quot; 인식 → 훅 규칙 검사
          </div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
          <code className="text-red-300">function debounce(value, delay) {`{...}`}</code>
          <div className="mt-1 text-zinc-500">
            ✗ React 는 일반 함수로 봄 → 내부에 useState 쓰면 에러
          </div>
        </div>
      </div>

      <pre className="mt-3 rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`// React 의 훅 규칙:
// 1. use 로 시작하는 이름
// 2. 컴포넌트 최상위 또는 다른 훅 안에서만 호출
// 3. 조건문/반복문 안에서 호출 X`}
      </pre>
    </div>
  );
}

export default function Ch10SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 10</h1>
        <p className="mb-8 text-zinc-400">커스텀 훅 — useDebounce, useLocalStorage</p>

        <h2 className="mb-3 text-lg font-semibold">① useDebounce</h2>
        <div className="mb-8">
          <DebounceDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② useLocalStorage</h2>
        <div className="mb-8">
          <LocalStorageDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ use 접두사 규칙</h2>
        <NamingRuleDemo />
      </div>
    </main>
  );
}
