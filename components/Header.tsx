"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

// components/Header.tsx
export default function Header() {
  const { data: session, status } = useSession();

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
          {status === "loading" ? (
            //loading 중이라면?
            <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-900" />
          ) : session?.user ? (
            // 세션이 있고, 유저가 있다면 글작성, 로그아웃
            <>
              <span className="text-sm text-zinc-400">
                <span className="text-zinc-200">{session.user.name}</span>
                <span className="ml-1 text-zinc-600">님</span>
              </span>
              <Link
                href="/write"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
              >
                ✏️ 글 작성
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                로그아웃
              </button>
            </>
          ) : (
            //세션이나 유저 정보가 없다면 로그인 버튼
            <Link
              href="/login"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
