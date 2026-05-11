// app/page.tsx
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";

const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt: "의존성 배열을 잘못 다루면 무한 루프가 납니다.",
    coverImage: "https://picsum.photos/seed/react/900/300",  // ⭐ 추가
  },
  {
    id: 2,
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt: "API 라우트 없이 서버 함수를 호출하는 새로운 방식.",
  },
  {
    id: 3,
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt: "제네릭은 타입을 변수처럼 다루는 도구입니다.",

  },
  {
    id: 4,
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt: "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법.",
    coverImage: "https://picsum.photos/seed/css/900/300",  // ⭐ 추가
  },
  {
    id: 5,
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt: "조회 성능을 좌우하는 인덱스 설계.",
  },
];

export default function HomePage() {
  return (
    <Container>
      <main className="py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            최근 글
          </h1>
          <p className="text-zinc-400">
            개발자들의 학습 기록을 확인하세요
          </p>
        </div>

        <div className="grid gap-4">
          {posts.map((post) => (
          <PostCard key={post.id} {...post} />
          ))}
        </div>
      </main>
    </Container>   
  );
}