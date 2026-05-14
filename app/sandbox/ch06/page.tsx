// app/sandbox/ch06/page.tsx
"use client";
import { useState } from "react";

// === 데모 ① 배열 → map → JSX ===
function Ch06MiniCard({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="mb-1 inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
        {tag}
      </div>
      <div className="text-sm text-white">{title}</div>
    </div>
  );
}

function ArrayMapDemo() {
  const items = [
    { id: 1, title: "useEffect 정복", tag: "React" },
    { id: 2, title: "Server Actions", tag: "Next.js" },
    { id: 3, title: "제네릭 잘 쓰기", tag: "TypeScript" },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">배열을 map 으로 펼쳐 JSX 로 변환</h3>

      <div className="grid gap-2">
        {items.map((item) => (
          <Ch06MiniCard key={item.id} title={item.title} tag={item.tag} />
        ))}
      </div>

      <pre className="mt-4 rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`{items.map((item) => (
  <Card key={item.id} title={item.title} tag={item.tag} />
))}`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 <code className="text-cyan-400">key</code> 는 React 가 각 요소를 식별하는 용도 — 챕터 11
        에서 자세히
      </p>
    </div>
  );
}

// === 데모 ② 빈 상태(empty state) UI ===
function Ch06EmptyState({ icon = "📭", message = "비어있습니다" }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 text-4xl opacity-50">{icon}</div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

function EmptyStateDemo() {
  const [hasItems, setHasItems] = useState(true);
  const items = [
    { id: 1, title: "글 1", tag: "React" },
    { id: 2, title: "글 2", tag: "CSS" },
  ];
  const visible = hasItems ? items : [];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">조건부 렌더링 — 비어있을 때 다른 UI</h3>

      <button
        type="button"
        onClick={() => setHasItems(!hasItems)}
        className="mb-3 rounded bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 hover:bg-cyan-500/20"
      >
        {hasItems ? "글 비우기" : "글 채우기"}
      </button>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
        {visible.length === 0 ? (
          <Ch06EmptyState icon="📭" message="아직 글이 없습니다" />
        ) : (
          <div className="grid gap-2">
            {visible.map((item) => (
              <Ch06MiniCard key={item.id} title={item.title} tag={item.tag} />
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 빈 상태도 사용자 경험의 일부. 무엇이 비어있고 어떻게 채우는지 안내.
      </p>
    </div>
  );
}

// === 데모 ③ 카드 시각 디테일 (호버 + 그라데이션) ===
function Ch06FancyCard({ title, tag }: { title: string; tag: string }) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-cyan-500/10">
      <div className="mb-2 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
        {tag}
      </div>
      <h4 className="text-base font-semibold text-white transition-colors group-hover:text-cyan-400">
        {title}
      </h4>
    </article>
  );
}

function FancyCardDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">호버 효과 + 그라데이션</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Ch06FancyCard title="마우스 올려보세요" tag="React" />
        <Ch06FancyCard title="-translate-y, border, shadow 동시 변화" tag="CSS" />
      </div>

      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-lime-500/5 p-3 text-xs text-zinc-300">
        💡 그라데이션 + 보더 변화로 &quot;뭔가 정성스럽다&quot; 는 인상을 만듭니다
      </div>
    </div>
  );
}

export default function Ch06SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 06</h1>
        <p className="mb-8 text-zinc-400">배열 렌더링 + 빈 상태 + 카드 디테일 — 1차 마일스톤</p>

        <h2 className="mb-3 text-lg font-semibold">① 배열 → map → JSX</h2>
        <div className="mb-8">
          <ArrayMapDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② 빈 상태 UI</h2>
        <div className="mb-8">
          <EmptyStateDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 카드 시각 디테일</h2>
        <FancyCardDemo />
      </div>
    </main>
  );
}
