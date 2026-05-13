import Link from "next/link";

// components/Header.tsx
export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* 로고 */}
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black shadow-[0_0_16px_rgba(0,217,255,0.3)]">
              D
            </div>
            <span className="text-lg font-semibold italic text-white">DevLog</span>
          </div>
        </Link>

        {/* 메뉴 */}
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <Link
            href="/write"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
          >
            ✏️ 글 작성
          </Link>
        </nav>
      </div>
    </header>
  );
}
