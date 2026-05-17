// app/sandbox/ch11/page.tsx
"use client";

import { useState } from "react";

// === 데모 ① 이벤트 버블링 + stopPropagation ===
function BubblingDemo() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 6));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        이벤트 버블링 — 자식 클릭이 부모까지 전파 만약 부모 컴포넌트에 click Listener가 있다면 부모
        컴포넌트 클릭 이벤트도 실행
      </h3>

      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <div
          onClick={() => addLog("🔴 부모 클릭됨")}
          className="cursor-pointer rounded-lg border border-zinc-800 bg-black/40 p-4"
        >
          <div className="mb-2 text-xs text-zinc-500">부모 div (onClick)</div>
          <button
            type="button"
            onClick={() => addLog("🔵 자식 클릭 — 버블링 발생")}
            className="rounded bg-cyan-500/20 px-3 py-1.5 text-xs text-cyan-300"
          >
            자식 (버블링 막지 않음)
          </button>
        </div>

        <div
          onClick={() => addLog("🔴 부모 클릭됨")}
          className="cursor-pointer rounded-lg border border-zinc-800 bg-black/40 p-4"
        >
          <div className="mb-2 text-xs text-zinc-500">부모 div (onClick)</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addLog("🟢 자식 클릭 — stopPropagation 호출");
            }}
            className="rounded bg-lime-500/20 px-3 py-1.5 text-xs text-lime-300"
          >
            자식 (stopPropagation)
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
        <div className="mb-1 text-xs text-zinc-500">이벤트 로그 (최근 6개):</div>
        {log.length === 0 ? (
          <div className="text-xs text-zinc-600">자식 버튼들을 눌러보세요</div>
        ) : (
          <ul className="space-y-1 text-xs text-zinc-300">
            {log.map((l, i) => (
              <li key={i}>· {l}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// === 데모 ② key prop 버그 시연 ⭐ ===
function Ch11Row({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/40 px-3 py-2">
      <span className="text-sm text-white">{label}</span>
      <button
        type="button"
        onClick={() => setCount(count + 1)}
        className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-300"
      >
        클릭: {count}
      </button>
    </div>
  );
}

function KeyBugDemo() {
  const [items, setItems] = useState([
    { id: 1, label: "사과" },
    { id: 2, label: "바나나" },
    { id: 3, label: "포도" },
  ]);

  const reverse = () => setItems([...items].reverse());

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        key 버그 시연 — 각 행의 카운터를 +1 한 후 &quot;뒤집기&quot; 클릭
      </h3>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={reverse}
          className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400"
        >
          순서 뒤집기
        </button>
        <button
          type="button"
          onClick={() =>
            setItems([
              { id: 1, label: "사과" },
              { id: 2, label: "바나나" },
              { id: 3, label: "포도" },
            ])
          }
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
        >
          리셋
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs text-red-400">❌ key={`{index}`}</div>
          <div className="space-y-2">
            {items.map((item, index) => (
              <Ch11Row key={index} label={item.label} />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-zinc-500">카운터가 자리에 묶여 따라가지 못함</p>
        </div>

        <div>
          <div className="mb-2 text-xs text-lime-400">✅ key={`{item.id}`}</div>
          <div className="space-y-2">
            {items.map((item) => (
              <Ch11Row key={item.id} label={item.label} />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-zinc-500">카운터가 데이터를 따라 이동</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 시연: 양쪽 모두 카운터 +1 → 뒤집기 → 왼쪽은 카운터가 자리에 남고, 오른쪽은 항목과 함께
        이동.
      </p>
    </div>
  );
}

// === 데모 ③ 가상 DOM 흐름 (개념) ===
function VirtualDomDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">가상 DOM — React 가 빠른 이유</h3>

      <ol className="space-y-2 text-xs">
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">1.</span>
          setState 호출 → React 가 새 가상 DOM 트리 생성 (JS 객체)
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">2.</span>
          이전 가상 DOM 과 비교 (diffing, reconciliation)
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">3.</span>
          변한 부분만 실제 DOM 에 패치
        </li>
        <li className="rounded border border-cyan-500/30 bg-cyan-500/5 p-2">
          <span className="mr-2 font-mono text-cyan-400">⭐</span>이 비교 과정에서{" "}
          <strong className="text-cyan-300">key</strong> 가 컴포넌트의 정체성을 판단하는 기준
        </li>
      </ol>

      <p className="mt-3 text-xs text-zinc-600">
        💡 가상 DOM 자체가 빠른 게 아님. &quot;변한 부분만 적용&quot; 이 빠른 이유.
      </p>
    </div>
  );
}

export default function Ch11SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 11</h1>
        <p className="mb-8 text-zinc-400">이벤트 버블링 + 가상 DOM + key prop</p>

        <h2 className="mb-3 text-lg font-semibold">① 이벤트 버블링 + stopPropagation</h2>
        <div className="mb-8">
          <BubblingDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② key prop 버그 시연 ⭐</h2>
        <div className="mb-8">
          <KeyBugDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 가상 DOM 흐름</h2>
        <VirtualDomDemo />
      </div>
    </main>
  );
}
