// lib/posts.ts

export type Post = {
  id: number;
  slug: string; // ⭐ 신규 — URL 경로용 고유 식별자
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  content: string; // ⭐ 신규 — 상세 페이지 본문
  readingTime?: number;
  coverImage?: string;
};

export let posts: Post[] = [
  {
    id: 1,
    slug: "use-effect-deps-guide",
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt:
      "의존성 배열을 잘못 다루면 무한 루프가 납니다. 가장 흔한 함정 5가지와 해결법을 정리했습니다.",
    content: `의존성 배열은 useEffect 의 핵심입니다. 빈 배열은 첫 렌더에만 실행, 의존성을 명시하면 그 값이 바뀔 때만 재실행됩니다. 가장 흔한 실수는 객체나 배열을 의존성에 넣고 매 렌더마다 재실행되는 케이스입니다. useMemo 와 useCallback 으로 참조를 안정화하거나, primitive 값으로 분해해서 넣는 방법으로 해결합니다.`,
    readingTime: 7,
    coverImage: "https://picsum.photos/seed/react/1200/600",
  },
  {
    id: 2,
    slug: "server-actions-patterns",
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt: "API 라우트 없이 서버 함수를 호출하는 새로운 방식. 폼 제출과 데이터 변경을 한 번에.",
    content: `Server Actions 는 'use server' 지시문이 붙은 함수입니다. 폼의 action prop 에 직접 전달하거나, 클라이언트 컴포넌트에서 import 해서 호출할 수 있습니다. 핵심 장점은 API 라우트 정의 없이도 서버 로직을 호출할 수 있다는 점, 그리고 자동으로 직렬화와 보안이 처리된다는 점입니다.`,
    readingTime: 12,
  },
  {
    id: 3,
    slug: "typescript-generics-guide",
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt: "제네릭은 타입을 변수처럼 다루는 도구입니다. 처음엔 어려워 보여도 패턴은 단순합니다.",
    content: `제네릭은 함수나 클래스가 다루는 타입을 호출 시점에 결정하게 합니다. 가장 흔한 패턴은 입력 타입과 출력 타입의 관계를 표현하는 것입니다. 예: function first<T>(arr: T[]): T | undefined. T 라는 타입 변수가 호출 시점에 number, string 등으로 채워집니다.`,
    readingTime: 9,
  },
  {
    id: 4,
    slug: "tailwind-layout-patterns",
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt: "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법. 자주 쓰는 5가지 패턴을 모았습니다.",
    content: `Flexbox 의 flex-1, justify-between, items-center 조합은 반응형 헤더의 기본입니다. Grid 의 grid-cols-[1fr_auto] 는 메인 + 사이드바 패턴에 적합합니다. min-h-screen 으로 풀 페이지를, max-w-* 와 mx-auto 로 콘텐츠 폭 제한을 만듭니다. aspect-ratio 유틸리티는 이미지 비율 유지에 필수입니다.`,
    readingTime: 5,
    coverImage: "https://picsum.photos/seed/css/1200/600",
  },
  {
    id: 5,
    slug: "postgresql-index-optimization",
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt: "조회 성능을 좌우하는 인덱스 설계. 언제 만들고 언제 안 만들어야 하는가.",
    content: `인덱스는 조회 속도를 빠르게 하지만 INSERT/UPDATE 비용을 증가시킵니다. WHERE 절에 자주 등장하는 컬럼, JOIN 키, ORDER BY 컬럼이 인덱스 후보입니다. 다만 카디널리티가 낮은 컬럼(예: 성별)에는 인덱스가 오히려 손해입니다. EXPLAIN ANALYZE 로 실제 쿼리 플랜을 확인하는 습관이 중요합니다.`,
    readingTime: 11,
  },
  {
    id: 6,
    slug: "react-suspense-in-practice",
    title: "React 18 Suspense 실전 활용",
    author: "김개발",
    date: "2025-04-12",
    tag: "React",
    excerpt: "로딩 UI를 선언적으로 처리하는 Suspense. 데이터 페칭과 함께 쓰는 진짜 활용법.",
    content: `Suspense 는 자식 컴포넌트가 데이터나 코드를 기다리는 동안 fallback 을 보여주는 경계입니다. Next.js App Router 의 loading.tsx 는 내부적으로 Suspense 를 활용합니다. 컴포넌트 단위로 로딩 경계를 잘게 나누면, 화면 일부만 로딩 표시가 보이고 나머지는 즉시 표시되는 매끈한 UX 를 만들 수 있습니다.`,
    readingTime: 8,
  },
];

// ⭐ 신규 — 글 추가 함수
export async function addPost(input: {
  title: string;
  content: string;
  tag: string;
  author: string;
  excerpt: string;
}): Promise<Post> {
  //시뮬레이션 지연
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newPost: Post = {
    id: Math.max(...posts.map((p) => p.id)) + 1,
    slug: input.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, ""),
    title: input.title,
    author: input.author,
    date: new Date().toISOString().split("T")[0], //YYYY-MM-DD
    tag: input.tag,
    excerpt: input.excerpt,
    content: input.content,
    readingTime: Math.ceil(input.content.length / 500),
  };

  posts = [newPost, ...posts]; // 얕은 복사 새 글을 맨 앞에
  return newPost;
}

// ⭐ slug 로 글 하나 조회
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  // 실제 DB 가 들어올 자리 — 챕터 15에서 Drizzle 쿼리로 교체
  // 학습 목적 로딩 시뮬레이션 (loading.tsx 동작 확인용)
  await new Promise((resolve) => setTimeout(resolve, 600));
  return posts.find((p) => p.slug === slug);
}

// ⭐ 모든 글 조회
export async function getAllPosts(): Promise<Post[]> {
  return posts;
}

// ⭐ 모든 태그 조회 (중복 제거)
export async function getAllTags(): Promise<string[]> {
  return [...new Set(posts.map((p) => p.tag))];
}
