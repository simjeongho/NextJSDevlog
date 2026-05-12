"use client"; // ⭐ 부모도 useState 쓰려면 필요
import { useState } from "react";
// app/page.tsx
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import TagFilter from "@/components/TagFilter";
import EmptyState from "@/components/EmptyState";
import StudyTimer from "@/components/StudyTimer";

const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt: "의존성 배열을 잘못 다루면 무한 루프가 납니다.",
    readingTime: 7,
    coverImage: "https://picsum.photos/seed/react/900/300", // ⭐ 추가
  },
  {
    id: 2,
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt: "API 라우트 없이 서버 함수를 호출하는 새로운 방식.",
    readingTime: 12,
  },
  {
    id: 3,
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt: "제네릭은 타입을 변수처럼 다루는 도구입니다.",
    readingTime: 9,
  },
  {
    id: 4,
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt: "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법.",
    readingTime: 5,
    coverImage: "https://picsum.photos/seed/css/900/300", // ⭐ 추가
  },
  {
    id: 5,
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt: "조회 성능을 좌우하는 인덱스 설계. 언제 만들고 언제 안 만들어야 하는가.",
    readingTime: 11,
  },
  {
    id: 6,
    title: "React 18 Suspense 실전 활용",
    author: "김개발",
    date: "2025-04-12",
    tag: "React",
    excerpt: "로딩 UI를 선언적으로 처리하는 Suspense. 데이터 페칭과 함께 쓰는 진짜 활용법.",
    readingTime: 8,
  },
];

// 태그 목록 추출 (중복 제거)
const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
  // ⭐ 활성 태그 state — 부모에서 보유
  const [activeTag, setActiveTag] = useState<string>("all");
  // ⭐ 필터링된 글 목록 (state 아니고 매 렌더마다 계산)
  const filteredPosts = activeTag === "all" ? posts : posts.filter((p) => p.tag === activeTag);

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
      {/* 글 목록 섹션 */}
      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">최근 글</h2>
            <p className="mt-1 text-sm text-zinc-500">총 {filteredPosts.length} 개의 글</p>
          </div>
        </div>

        {/* 태그 필터 (정적 UI) */}
        <div className="mb-8">
          <TagFilter tags={tags} activateTag={activeTag} onTagChange={setActiveTag} />
        </div>

        {/* 카드 그리도 또는 빈 상태 */}
        {filteredPosts.length == 0 ? (
          <EmptyState
            message={`'${activeTag}' 태그의 글이 없습니다.`}
            hint="다른 태그를 선택해보세요"
          />
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
