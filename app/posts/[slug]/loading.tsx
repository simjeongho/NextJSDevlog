// app/posts/[slug]/loading.tsx
import Container from "@/components/Container";

export default function Loading() {
  return (
    <Container>
      <div className="py-12">
        {/* 뒤로가기 자리 */}
        <div className="mb-8 h-4 w-24 animate-pulse rounded bg-zinc-900" />

        {/* 커버 이미지 자리 */}
        <div className="mb-8 aspect-[2/1] w-full animate-pulse rounded-2xl bg-zinc-900" />

        {/* 메타 영역 자리 */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-900" />
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-900" />
        </div>

        {/* 제목 자리 */}
        <div className="mb-4 space-y-3">
          <div className="h-9 w-3/4 animate-pulse rounded bg-zinc-900" />
          <div className="h-9 w-1/2 animate-pulse rounded bg-zinc-900" />
        </div>

        {/* 메타 자리 */}
        <div className="mb-10 flex items-center gap-2 border-b border-zinc-900 pb-6">
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-900" />
          <span className="text-zinc-700">·</span>
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-900" />
        </div>

        {/* 본문 자리 */}
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-900" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-900" />
        </div>
      </div>
    </Container>
  );
}
