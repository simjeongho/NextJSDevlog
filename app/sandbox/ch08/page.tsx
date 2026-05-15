"use client";

import { useEffect, useRef, useState } from "react";

// === 데모 ① useEffect 의존성 배열 ===
function EffectDepsDemo() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("앨리스");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    //setLog((prev) => [...prev, `count 가 ${count} 로 변경됨`].slice(-5));
  }, [count]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">의존성 배열 — count 변할 때만 effect 실행</h3>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCount(count + 1)}
          className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/20"
        >
          count + 1 ({count})
        </button>
        <button
          type="button"
          onClick={() => setName(name === "앨리스" ? "밥" : "앨리스")}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
        >
          name 토글 ({name})
        </button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
        <div className="mb-1 text-xs text-zinc-500">최근 effect 로그:</div>
        {log.length === 0 ? (
          <div className="text-xs text-zinc-600">아직 없음</div>
        ) : (
          <ul className="space-y-1 text-xs text-cyan-400">
            {log.map((line, i) => (
              <li key={i}>· {line}</li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 name 만 토글하면 로그 X. count 가 변할 때만 effect 실행.
      </p>
    </div>
  );
}

// === 데모 ② 클린업의 중요성 — setInterval 함정 ===
function CleanupDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // ⭐ 클린업: 다음 effect 실행 전 또는 unmount 시 호출
    return () => clearInterval(id); // 있었다 지웠다
  }, [isRunning]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        클린업 함수 — return 문이 unmount/재실행 시 호출
      </h3>

      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-2xl text-cyan-400 tabular-nums">{seconds}s</span>
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          className={
            isRunning
              ? "rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white"
              : "rounded-lg bg-cyan-500 px-3 py-1.5 text-xs text-black"
          }
        >
          {isRunning ? "정지" : "시작"}
        </button>
        <button
          type="button"
          onClick={() => setSeconds(0)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
        >
          리셋
        </button>
      </div>

      <pre className="rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`useEffect(() => {
  if (!isRunning) return;
  const id = setInterval(() => setSeconds(s => s + 1), 1000);
  return () => clearInterval(id);  // ⭐ 안 하면 인터벌 누적
}, [isRunning]);`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 클린업 누락 시 인터벌이 계속 쌓여 시간이 빠르게 흐름 = 메모리 누수.
      </p>
    </div>
  );
}

// === 데모 ③ useRef — state 와의 차이 ===
function RefVsStateDemo() {
  const [stateCount, setStateCount] = useState(0);
  const refCount = useRef(0);
  const [, forceUpdate] = useState({});

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">useRef vs useState — 변화 시 리렌더되는가?</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-cyan-400">useState</div>
          <div className="mb-2 font-mono text-2xl text-white tabular-nums">{stateCount}</div>
          <button
            type="button"
            onClick={() => setStateCount(stateCount + 1)}
            className="rounded bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400"
          >
            +1 (화면 갱신)
          </button>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-orange-400">useRef</div>
          {/*<div className="mb-2 font-mono text-2xl text-white tabular-nums">{refCount.current}</div> 빌드 시 에러*/}
          <button
            type="button"
            onClick={() => {
              refCount.current += 1;
            }}
            className="rounded bg-orange-500/10 px-3 py-1 text-xs text-orange-400"
          >
            +1 (화면 안 바뀜)
          </button>
          <button
            type="button"
            onClick={() => forceUpdate({})}
            className="ml-2 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400"
          >
            강제 리렌더
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 useRef 값을 바꿔도 컴포넌트는 리렌더 안 됨. 강제 리렌더 시키면 보임. 타이머 ID 같은
        &quot;화면에 표시되지 않는 값&quot; 저장에 적합.
      </p>
    </div>
  );
}

export default function Ch08SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 08</h1>
        <p className="mb-8 text-zinc-400">useEffect 의존성 + 클린업 + useRef</p>

        <h2 className="mb-3 text-lg font-semibold">① useEffect 의존성 배열</h2>
        <div className="mb-8">
          <EffectDepsDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② 클린업의 중요성</h2>
        <div className="mb-8">
          <CleanupDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ useRef vs useState</h2>
        <RefVsStateDemo />
      </div>
    </main>
  );
}
