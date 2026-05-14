// app/sandbox/ch03/page.tsx

// === 데모 ① 분리 전: 한 파일에 모두 ===
function MonolithicVersion() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">분리 전 (한 덩어리)</h3>
      <article className="rounded-lg border border-zinc-800 bg-black/40 p-4">
        <div className="mb-2 inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
          React
        </div>
        <h4 className="mb-1 text-base font-semibold text-white">한 파일에 다 박힌 카드</h4>
        <p className="text-sm text-zinc-400">분리 안 한 상태</p>
      </article>
    </div>
  );
}

// === 데모 ① 분리 후: 컴포넌트로 추출 ===
function MiniPostCard({ title, tag }: { title: string; tag: string }) {
  return (
    <article className="group rounded-lg border border-zinc-800 bg-black/40 p-4 transition-colors hover:border-cyan-500/50">
      <div className="mb-2 inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
        {tag}
      </div>
      <h4 className="mb-1 text-base font-semibold text-white transition-colors group-hover:text-cyan-400">
        {title}
      </h4>
      <p className="text-sm text-zinc-400">분리 + 호버 효과</p>
    </article>
  );
}

function ExtractedVersion() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">분리 후 (재사용 + 호버)</h3>
      <div className="grid gap-3">
        <MiniPostCard title="추출된 카드 1" tag="React" />
        <MiniPostCard title="추출된 카드 2" tag="Next.js" />
      </div>
      <p className="mt-3 text-xs text-zinc-600">💡 마우스 올려보세요 — 보더와 제목 색 전환</p>
    </div>
  );
}

// === 데모 ② Tailwind 변형 실험 카드 ===
function TailwindPlayground() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">Tailwind 변형 실험</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-cyan-500/20 p-3 text-center text-xs text-cyan-300">
          bg-cyan-500/20
        </div>
        <div className="rounded-lg bg-lime-500/20 p-3 text-center text-xs text-lime-300">
          bg-lime-500/20
        </div>
        <div className="rounded-lg bg-orange-500/20 p-3 text-center text-xs text-orange-300">
          bg-orange-500/20
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        💡 강사 시연: 위 색상 클래스 중 하나 다른 걸로 바꿔보고 즉시 반영 확인
      </p>
    </div>
  );
}

export default function Ch03SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 03</h1>
        <p className="mb-8 text-zinc-400">컴포넌트 분리 비교 + Tailwind 호버 실험</p>

        {/* 데모 ①: 분리 전/후 */}
        <h2 className="mb-3 text-lg font-semibold">① 컴포넌트 분리 비교</h2>
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <MonolithicVersion />
          <ExtractedVersion />
        </div>

        {/* 데모 ②: Tailwind 변형 */}
        <h2 className="mb-3 text-lg font-semibold">② Tailwind 변형</h2>
        <TailwindPlayground />
      </div>
    </main>
  );
}
