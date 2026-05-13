// app/write/page.tsx
"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import Container from "@/components/Container";
import { createPost } from "@/lib/actions";

const tagOptions = ["React", "Next.js", "TypeScript", "CSS", "DB", "기타"];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "저장 중..." : "글 발행"}
    </button>
  );
}

export default function WritePage() {
  return (
    <Container>
      <div className="py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-cyan-400"
        >
          <span>←</span>
          <span>목록으로</span>
        </Link>

        <h1 className="mb-2 text-4xl font-semibold tracking-tight">새 글 작성</h1>
        <p className="mb-10 text-zinc-400">학습한 내용을 정리해서 동료들과 공유해보세요.</p>

        {/* ⭐ form 의 action 에 Server Action 을 직접 전달 */}
        <form action={createPost} className="space-y-6">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-zinc-300">
              제목
            </label>
            <input
              id="title"
              name="title" // ⭐ FormData 키
              type="text"
              required
              placeholder="제목을 입력해주세요"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
            />
          </div>

          {/* 태그 */}
          <div>
            <label htmlFor="tag" className="mb-2 block text-sm font-medium text-zinc-300">
              태그
            </label>
            <select
              id="tag"
              name="tag"
              required
              defaultValue=""
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
            >
              <option value="" disabled className="bg-zinc-900">
                태그를 선택해주세요
              </option>
              {tagOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-900">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 본문 */}
          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium text-zinc-300">
              본문
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={12}
              placeholder="학습한 내용을 자유롭게 작성해주세요"
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Link
              href="/"
              className="rounded-lg border border-zinc-800 bg-transparent px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              취소
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </Container>
  );
}
