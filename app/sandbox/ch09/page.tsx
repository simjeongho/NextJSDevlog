// app/sandbox/ch09/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

function ChildA({ parentRenderTick }: { parentRenderTick: number }) {
  // parentRenderTick 이 바뀌면 이 컴포넌트도 리렌더됨
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="text-xs text-zinc-500">ChildA (자식 state 없음)</div>
      <div className="font-mono text-sm text-cyan-400">
        부모 리렌더 신호 수신: {parentRenderTick} 회
      </div>
    </div>
  );
}

function ChildB({ parentRenderTick }: { parentRenderTick: number }) {
  const [n, setN] = useState(0);
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="text-xs text-zinc-500">ChildB (자기 state 있음)</div>
      <div className="mb-1 font-mono text-sm text-cyan-400">
        부모 리렌더 신호 수신: {parentRenderTick} 회
      </div>
      <button
        type="button"
        onClick={() => setN(n + 1)}
        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
      >
        ChildB 자체 state: {n} (+1)
      </button>
      <div className="mt-1 text-[10px] text-zinc-600">
        💡 이 버튼은 부모 신호와 무관하게 자기만 리렌더
      </div>
    </div>
  );
}

function RenderModelDemo() {
  const [parentN, setParentN] = useState(0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        리렌더링 모델 — setState 한 컴포넌트와 자식들만 리렌더
      </h3>

      <div className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
        <div className="text-xs text-cyan-400">Parent (이 박스)</div>
        <div className="mb-2 font-mono text-sm text-white">parentN: {parentN}</div>
        <button
          type="button"
          onClick={() => setParentN(parentN + 1)}
          className="rounded bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300"
        >
          Parent state +1 (자식까지 모두 리렌더)
        </button>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <ChildA parentRenderTick={parentN} />
          <ChildB parentRenderTick={parentN} />
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        💡 <strong>Parent state +1</strong> → ChildA, ChildB 의 &quot;부모 신호 수신&quot; 숫자 증가
        <br />
        💡 <strong>ChildB state +1</strong> → ChildB 내부만 갱신, 부모 신호는 그대로
      </p>
    </div>
  );
}

// === 데모 ② useMemo — 비싼 계산 캐싱 ===
function expensiveCalculation(n: number): number {
  let sum = 0;
  for (let i = 0; i < n * 100000; i++) sum += i;
  return sum;
}

function UseMemoDemo() {
  const [num, setNum] = useState(1);
  const [other, setOther] = useState(0);

  const memoized = useMemo(() => expensiveCalculation(num), [num]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">useMemo — 의존성 안 바뀌면 캐시된 값 반환</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs text-zinc-500">num (의존성)</div>
          <button
            type="button"
            onClick={() => setNum(num + 1)}
            className="rounded bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400"
          >
            num + 1 → {num} (계산 다시)
          </button>
        </div>
        <div>
          <div className="mb-1 text-xs text-zinc-500">other (의존성 아님)</div>
          <button
            type="button"
            onClick={() => setOther(other + 1)}
            className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400"
          >
            other + 1 → {other} (캐시 사용)
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-800 bg-black/40 p-3">
        <div className="text-xs text-zinc-500">계산 결과:</div>
        <div className="font-mono text-sm text-cyan-400">{memoized.toLocaleString()}</div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 other 만 바뀌면 expensiveCalculation 다시 실행 X. num 의존성이 같으니까.
      </p>
    </div>
  );
}

// === 데모 ③ 남용 경계 ===
function NoOveruseDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        언제 useMemo 를 안 쓰나? 캐싱 비용과 계산 비용을 판단해서 결정
      </h3>

      <div className="space-y-2 text-xs">
        <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
          <span className="font-mono text-red-400">❌ 남용</span>
          <code className="ml-2 text-zinc-400">const sum = useMemo(() =&gt; a + b, [a, b]);</code>
          <div className="ml-12 mt-1 text-zinc-500">→ 단순 덧셈은 캐싱 비용 &gt; 재계산 비용</div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
          <span className="font-mono text-red-400">❌ 남용</span>
          {/* ⭐ name → userName */}
          <code className="ml-2 text-zinc-400">
            {"const str = useMemo(() => `${userName}님`, [userName]);"}
          </code>
          <div className="ml-12 mt-1 text-zinc-500">→ 문자열 결합은 가벼움</div>
        </div>
        <div className="rounded border border-lime-500/30 bg-lime-500/5 p-2">
          <span className="font-mono text-lime-400">✅ 적합</span>
          <code className="ml-2 text-zinc-400">
            {"const filtered = useMemo(() => bigArr.filter(...), [bigArr])"}
          </code>
          <div className="ml-12 mt-1 text-zinc-500">→ 큰 배열 처리는 캐싱 효과 큼</div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 &quot;필요할 때까지 쓰지 마라&quot; — React 공식 권장.
      </p>
    </div>
  );
}

export default function Ch09SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 09</h1>
        <p className="mb-8 text-zinc-400">리렌더링 모델 + useMemo + 남용 경계</p>

        <h2 className="mb-3 text-lg font-semibold">① 리렌더링 모델 ⭐</h2>
        <div className="mb-8">
          <RenderModelDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② useMemo</h2>
        <div className="mb-8">
          <UseMemoDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 남용 경계</h2>
        <NoOveruseDemo />
      </div>
    </main>
  );
}
