// app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/Container";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false, // ⭐ 직접 리다이렉트 처리
    });

    setPending(false);

    if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-sm py-24">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">로그인</h1>
        <p className="mb-10 text-sm text-zinc-500">DevLog 에 로그인하고 학습 기록을 남겨보세요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-300">
              아이디
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-cyan-500 px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-500">
          <p className="mb-2 font-medium text-zinc-400">데모용 계정</p>
          <p>심정호 / 심정호123</p>
          <p>bob / bob123</p>
          <p>kim / kim123</p>
        </div>
      </div>
    </Container>
  );
}
