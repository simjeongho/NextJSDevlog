// components/PostCard.tsx
export default function PostCard() {
  return (
    <article className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <div className="mb-3 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
        React
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
        useEffect 의존성 배열 완전 정복
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        의존성 배열을 잘못 다루면 무한 루프가 납니다.
      </p>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>김개발</span>
        <span>·</span>
        <span>2025-04-30</span>
      </div>
    </article>
  );
}