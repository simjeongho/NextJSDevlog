// app/page.tsx
import Container from "@/components/Container";
import StudyTimer from "@/components/StudyTimer";
import PostList from "@/components/PostList";
import { getAllPosts, getAllTags } from "@/lib/posts";

export default async function HomePage() {
  // ⭐ async 함수로 변환
  // ⭐ Server Component 에서 데이터 조회
  const posts = await getAllPosts();
  const tags = await getAllTags();

  return (
    <Container>
      {/* 히어로 섹션 */}
      <section className="border-b border-zinc-900 py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-3 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-400">
              개발자 학습 기록 · DevLog
            </div>
            <h1 className="mb-4 text-5xl font-semibold tracking-tight">
              매일 배우고,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-lime-300 bg-clip-text text-transparent">
                매일 기록합니다.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-zinc-400">
              개발자가 학습한 내용을 정리하고, 시간을 추적하고, 성장을 시각화하는 공간입니다.
            </p>
          </div>
          <StudyTimer />
        </div>
      </section>
      {/* 글 목록 — 클라이언트 경계 (PostList 안이 클라이언트) */}
      <PostList posts={posts} tags={tags} />
    </Container>
  );
}
