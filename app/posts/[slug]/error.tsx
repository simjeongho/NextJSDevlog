// app/posts/[slug]/error.tsx
"use client"; // ⭐ error.tsx 는 반드시 Client Component

import { useEffect } from "react";
import Link from "next/link";
import Container from "@/components/Container";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 실제로는 에러 추적 시스템 (Sentry 등) 으로 보냄
    console.error("[글 상세 페이지 에러]", error);
  }, [error]);

  return (
    <Container>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 text-6xl opacity-50">⚠️</div>
        <h2 className="mb-3 text-2xl font-semibold">글을 불러오는 중 문제가 발생했습니다</h2>
        <p className="mb-8 max-w-md text-sm text-zinc-500">
          잠시 후 다시 시도해주시거나, 목록으로 돌아가 다른 글을 확인해보세요.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-lg border border-zinc-800 bg-transparent px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
          >
            목록으로
          </Link>
        </div>
      </div>
    </Container>
  );
}
