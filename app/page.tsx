import Image from "next/image";

// app/page.tsx
const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt: "의존성 배열을 잘못 다루면 무한 루프가 납니다.",
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
    <main>
      <h1>DevLog</h1>
      <p>개발자를 위한 학습 기록 플랫폼</p>

      {posts.length === 0 ? (
        <p>아직 작성된 글이 없습니다</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <span>[{post.tag}]</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <small>
                {post.author} · {post.date}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}