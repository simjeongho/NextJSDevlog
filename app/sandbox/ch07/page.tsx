// app/sandbox/ch07/page.tsx
"use client";

import { useState } from "react";

// === 데모 ① useState 기본 — 카운터 ===
function CounterDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">useState — 상태가 바뀌면 자동으로 다시 그려짐</h3>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCount(count - 1)}
          className="rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-zinc-700"
        >
          -
        </button>
        <span className="min-w-[60px] text-center font-mono text-2xl tabular-nums text-cyan-400">
          {count}
        </span>
        <button
          type="button"
          onClick={() => setCount(count + 1)}
          className="rounded-lg border border-zinc-800 px-4 py-2 text-sm hover:border-zinc-700"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          className="ml-2 text-xs text-zinc-500 hover:text-zinc-300"
        >
          리셋
        </button>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 <code className="text-cyan-400">setCount</code> 호출 → React 가 컴포넌트 다시 실행 → 새
        count 로 렌더
      </p>
    </div>
  );
}

// === 데모 ② "use client" 의 의미 시각화 ===
function UseClientDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        &quot;use client&quot; — 이 컴포넌트는 브라우저에서도 동작
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs font-mono text-zinc-500">Server Component (기본)</div>
          <pre className="text-[10px] text-zinc-400">
            {`function Page() {
  // useState 사용 X
  return <h1>제목</h1>;
}`}
          </pre>
          <div className="mt-2 text-[10px] text-zinc-500">
            ✓ 서버에서만 실행
            <br />✓ JS 번들에 포함 X
          </div>
        </div>

        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="mb-2 text-xs font-mono text-cyan-400">&quot;use client&quot; 필요</div>
          <pre className="text-[10px] text-zinc-400">
            {`"use client";
function Counter() {
  const [n, setN] = useState(0);
  // ...
}`}
          </pre>
          <div className="mt-2 text-[10px] text-zinc-500">
            ✓ 서버 + 브라우저 둘 다 실행
            <br />✓ useState, onClick 사용 가능
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 useState/onClick 등 인터랙션 = &quot;use client&quot; 필요. 자세한 건 챕터 12.
      </p>
    </div>
  );
}

// === 데모 ③ 상태 불변성 ⭐ ===
function MutationDemo() {
  const [items, setItems] = useState<string[]>(["사과", "바나나"]);
  const [log, setLog] = useState<string>("");

  const handleMutate = () => {
    // ❌ 안티패턴: 원본 직접 수정
    items.push("포도"); // 배열을 직접 mutate
    setItems(items); // 같은 참조 → React 가 변화 감지 못 함
    setLog("❌ push 후 setItems: 화면 안 바뀜");
  }; //dev mode에서 한 번은 새로고침이 되는 점은 react-strict-mode 때문 두 번씩 호출한다.

  const handleImmutable = () => {
    // ✅ 새 배열로 교체
    setItems([...items, "포도"]);
    setLog("✅ 스프레드로 새 배열: 화면 갱신됨");
  };

  const handleReset = () => {
    setItems(["사과", "바나나"]);
    setLog("");
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">상태 불변성 — 원본 수정 X, 새 객체/배열로 교체</h3>

      <div className="mb-3 rounded-lg border border-zinc-800 bg-black/40 p-3">
        <div className="mb-1 text-xs text-zinc-500">현재 items 상태:</div>
        <div className="flex flex-wrap gap-1">
          {items.map((item, i) => (
            <span key={i} className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleMutate}
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
        >
          ❌ push() 로 추가
        </button>
        <button
          type="button"
          onClick={handleImmutable}
          className="rounded-lg border border-lime-500/40 bg-lime-500/10 px-3 py-1.5 text-xs text-lime-300"
        >
          ✅ 스프레드로 추가
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
        >
          리셋
        </button>
      </div>

      {log && <div className="rounded bg-black/40 p-2 text-xs text-zinc-300">{log}</div>}

      <p className="mt-4 text-xs text-zinc-600">
        💡 React 는 참조 비교로 변화 감지. <code className="text-cyan-400">push</code> 는 같은 참조
        → 변화 못 알아챔.
      </p>
    </div>
  );
}
function ShallowVsDeepDemo() {
  // ⭐ 원본 — 한 번만 만들어두고 두 데모가 공유
  const [original, setOriginal] = useState({
    name: "앨리스",
    address: { city: "서울", zipCode: "00000" },
  });

  // 얕은 복사 결과
  const [shallowCopy, setShallowCopy] = useState<typeof original | null>(null);

  // 깊은 복사 결과
  const [deepCopy, setDeepCopy] = useState<typeof original | null>(null);

  // === 얕은 복사 후 city 변경 ===
  const handleShallowDemo = () => {
    const copy = { ...original }; // 얕은 복사
    copy.address.city = "부산"; // 복사본 변경
    setShallowCopy(copy);
    setOriginal({ ...original }); // 화면 갱신용 (참조만 새로)
  };

  // === 깊은 복사 후 city 변경 ===
  const handleDeepDemo = () => {
    const copy = {
      ...original,
      address: { ...original.address }, // 안쪽도 새 객체
    };
    copy.address.city = "제주"; // 복사본 변경
    setDeepCopy(copy);
    setOriginal({ ...original });
  };

  const handleReset = () => {
    setOriginal({
      name: "앨리스",
      address: { city: "서울", zipCode: "00000" },
    });
    setShallowCopy(null);
    setDeepCopy(null);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        원본과 복사본 — 얕은 복사는 같이 변하고, 깊은 복사는 분리됨
      </h3>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleShallowDemo}
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
        >
          ❌ 얕은 복사 → copy.address.city = &quot;부산&quot;
        </button>
        <button
          type="button"
          onClick={handleDeepDemo}
          className="rounded-lg border border-lime-500/40 bg-lime-500/10 px-3 py-1.5 text-xs text-lime-300"
        >
          ✅ 깊은 복사 → copy.address.city = &quot;제주&quot;
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
        >
          리셋
        </button>
      </div>

      {/* === 얕은 복사 결과 === */}
      <div className="mb-3 rounded-lg border border-red-500/20 bg-black/40 p-3">
        <div className="mb-2 text-xs font-medium text-red-400">
          얕은 복사 결과 ({"{ ...original }"} 만 사용)
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded bg-zinc-900/50 p-2">
            <div className="mb-1 text-[10px] text-zinc-500">원본 original.address.city</div>
            <div className="font-mono text-sm text-white">{original.address.city}</div>
          </div>
          <div className="rounded bg-zinc-900/50 p-2">
            <div className="mb-1 text-[10px] text-zinc-500">복사본 shallowCopy.address.city</div>
            <div className="font-mono text-sm text-white">{shallowCopy?.address.city ?? "—"}</div>
          </div>
        </div>
        {shallowCopy && (
          <p className="mt-2 text-[10px] text-red-300">
            ⚠️ 복사본만 바꿨는데 원본도 함께 &quot;부산&quot; 으로 변경됨 — 안쪽 address 가 같은
            참조였기 때문
          </p>
        )}
      </div>

      {/* === 깊은 복사 결과 === */}
      <div className="rounded-lg border border-lime-500/20 bg-black/40 p-3">
        <div className="mb-2 text-xs font-medium text-lime-400">
          깊은 복사 결과 (address 도 새 객체로)
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded bg-zinc-900/50 p-2">
            <div className="mb-1 text-[10px] text-zinc-500">원본 original.address.city</div>
            <div className="font-mono text-sm text-white">{original.address.city}</div>
          </div>
          <div className="rounded bg-zinc-900/50 p-2">
            <div className="mb-1 text-[10px] text-zinc-500">복사본 deepCopy.address.city</div>
            <div className="font-mono text-sm text-white">{deepCopy?.address.city ?? "—"}</div>
          </div>
        </div>
        {deepCopy && (
          <p className="mt-2 text-[10px] text-lime-300">
            ✅ 복사본만 &quot;제주&quot; 로 변경, 원본은 그대로 — 안쪽 address 도 새 객체로 만들었기
            때문
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 <code className="text-cyan-400">{"{ ...obj }"}</code> 만으로는 한 단계만 복사. 중첩
        객체는 같은 참조 → 함께 변경됨. 안쪽 객체도{" "}
        <code className="text-cyan-400">{"{ ...obj.inner }"}</code> 로 새로 만들어야 진짜 분리.
      </p>
    </div>
  );
}

export default function Ch07SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 07</h1>
        <p className="mb-8 text-zinc-400">useState + 불변성 + 얕은/깊은 복사</p>

        <h2 className="mb-3 text-lg font-semibold">① useState 기본</h2>
        <div className="mb-8">
          <CounterDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② &quot;use client&quot; 의 의미</h2>
        <div className="mb-8">
          <UseClientDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 상태 불변성 ⭐</h2>
        <div className="mb-8">
          <MutationDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">④ 얕은 복사 vs 깊은 복사</h2>
        <ShallowVsDeepDemo />
      </div>
    </main>
  );
}
