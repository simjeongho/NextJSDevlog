// components/Header.tsx
export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black shadow-[0_0_16px_rgba(0,217,255,0.3)]">
            D
          </div>
          <span className="text-lg font-semibold italic text-white">
            DevLog
          </span>
        </div>

        {/* 메뉴 */}
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="#" className="transition-colors hover:text-white">
            글
          </a>
          <a href="#" className="transition-colors hover:text-white">
            대시보드
          </a>
          <a href="#" className="transition-colors hover:text-white">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}