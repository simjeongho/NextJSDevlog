// lib/db/seed.ts
import "dotenv/config"; // ⭐ tsx 직접 실행 시 .env 로드용
import { db } from "./index";
import { posts } from "./schema";

const seedPosts = [
  {
    slug: "use-effect-deps-guide",
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt:
      "의존성 배열을 잘못 다루면 무한 루프가 납니다. 가장 흔한 함정 5가지와 해결법을 정리했습니다.",
    content:
      "의존성 배열은 useEffect 의 핵심입니다. 빈 배열은 첫 렌더에만 실행, 의존성을 명시하면 그 값이 바뀔 때만 재실행됩니다. 가장 흔한 실수는 객체나 배열을 의존성에 넣고 매 렌더마다 재실행되는 케이스입니다.",
    readingTime: 7,
    coverImage: "https://picsum.photos/seed/react/1200/600",
  },
  {
    slug: "server-actions-patterns",
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt: "API 라우트 없이 서버 함수를 호출하는 새로운 방식. 폼 제출과 데이터 변경을 한 번에.",
    content:
      "Server Actions 는 'use server' 지시문이 붙은 함수입니다. 폼의 action prop 에 직접 전달하거나, 클라이언트 컴포넌트에서 import 해서 호출할 수 있습니다.",
    readingTime: 12,
  },
  {
    slug: "typescript-generics-guide",
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt: "제네릭은 타입을 변수처럼 다루는 도구입니다. 처음엔 어려워 보여도 패턴은 단순합니다.",
    content:
      "제네릭은 함수나 클래스가 다루는 타입을 호출 시점에 결정하게 합니다. 가장 흔한 패턴은 입력 타입과 출력 타입의 관계를 표현하는 것입니다.",
    readingTime: 9,
  },
  {
    slug: "tailwind-layout-patterns",
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt: "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법. 자주 쓰는 5가지 패턴을 모았습니다.",
    content:
      "Flexbox 의 flex-1, justify-between, items-center 조합은 반응형 헤더의 기본입니다. Grid 의 grid-cols-[1fr_auto] 는 메인 + 사이드바 패턴에 적합합니다.",
    readingTime: 5,
    coverImage: "https://picsum.photos/seed/css/1200/600",
  },
  {
    slug: "postgresql-index-optimization",
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt: "조회 성능을 좌우하는 인덱스 설계. 언제 만들고 언제 안 만들어야 하는가.",
    content:
      "인덱스는 조회 속도를 빠르게 하지만 INSERT/UPDATE 비용을 증가시킵니다. WHERE 절에 자주 등장하는 컬럼, JOIN 키, ORDER BY 컬럼이 인덱스 후보입니다.",
    readingTime: 11,
  },
  {
    slug: "react-suspense-in-practice",
    title: "React 18 Suspense 실전 활용",
    author: "김개발",
    date: "2025-04-12",
    tag: "React",
    excerpt: "로딩 UI를 선언적으로 처리하는 Suspense. 데이터 페칭과 함께 쓰는 진짜 활용법.",
    content:
      "Suspense 는 자식 컴포넌트가 데이터나 코드를 기다리는 동안 fallback 을 보여주는 경계입니다. Next.js App Router 의 loading.tsx 는 내부적으로 Suspense 를 활용합니다.",
    readingTime: 8,
  },
];

async function main() {
  console.log("🌱 시드 시작...");
  await db.delete(posts); // 기존 데이터 비우기
  await db.insert(posts).values(seedPosts);
  console.log(`✓ ${seedPosts.length}개 글 추가됨`);
  process.exit(0);
}

main().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
