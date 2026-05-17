# 챕터 13: 동적 라우팅 + loading/error UI

> **시간**: 약 30분 · **블록**: Day 2 / Block 4

---

## 🎯 이 챕터에서 다룰 내용

- Next.js App Router 의 **동적 라우팅** — `[slug]` 폴더 패턴
- **`loading.tsx`** — 페이지 단위 자동 스켈레톤 UI ⭐
- **`error.tsx`** — 페이지 단위 에러 경계 (Error Boundary)
- **`notFound()`** — 글이 없을 때 404 처리
- 본 프로젝트에 **글 상세 페이지** 추가 + 카드 클릭 시 이동
- 데이터 모듈 분리 (`lib/posts.ts`) — 챕터 15 의 DB 교체를 위한 토대

이번 챕터는 **매끈함 마일스톤** 입니다. 지금까지 글 카드를 클릭해도 아무 일도 일어나지 않았는데, 이제 글 상세 페이지로 자연스럽게 넘어갑니다.

그리고 Next.js 가 자랑하는 두 가지 기능 — **`loading.tsx`** 와 **`error.tsx`** — 를 만납니다. **파일 하나 만드는 것만으로** 페이지 전체에 스켈레톤 UI 와 에러 처리가 자동으로 붙어요. 직접 만들려면 useState + useEffect + Error Boundary 가 다 필요한 작업이 단 한 파일로 끝납니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `lib/posts.ts` — posts 데이터 + 조회 함수 모듈 (신규)
- `app/posts/[slug]/page.tsx` — 글 상세 페이지 (신규)
- `app/posts/[slug]/loading.tsx` — 스켈레톤 UI (신규)
- `app/posts/[slug]/error.tsx` — 에러 UI (신규)
- `components/PostCard.tsx` — Link 로 감싸기 (수정)
- `components/PostList.tsx` — Post 타입 재사용 (수정)
- `app/page.tsx` — async 함수로 변환 + lib/posts 사용 (수정)

---

## 🧠 핵심 개념

### 1. 동적 라우팅 — 폴더 이름이 곧 URL 파라미터

Next.js App Router 의 라우팅은 **폴더 구조 = URL 구조** 입니다. 챕터 05 에서 layout.tsx 를 배울 때 처음 만난 패턴이죠.

그런데 글 상세 페이지처럼 **URL 의 일부가 동적으로 바뀌어야** 할 때는 어떻게 할까요? 이때 **대괄호 폴더 `[slug]`** 를 만듭니다.

#### 폴더와 URL 매핑

```
app/
├── page.tsx                        →  /
├── posts/
│   └── [slug]/
│       ├── page.tsx                →  /posts/use-effect-guide
│       │                              /posts/server-actions-patterns
│       │                              /posts/typescript-generics-guide
│       │                              (어떤 slug 든 이 페이지가 처리)
│       ├── loading.tsx             →     자동 로딩 UI
│       └── error.tsx               →     자동 에러 UI
```

`[slug]` 부분에 들어가는 모든 문자열이 **`slug`** 라는 파라미터로 페이지 컴포넌트에 전달됩니다.

#### 페이지에서 파라미터 받기

```tsx
// app/posts/[slug]/page.tsx
type PageProps = {
  params: Promise<{ slug: string }>;  // ⭐ Next.js 15+ 에선 params 가 Promise
};

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;  // ⭐ await 로 풀어야 함
  return <h1>슬러그: {slug}</h1>;
}
```

> 💡 **Next.js 15 변경점**: `params` 가 동기 객체에서 **Promise** 로 바뀌었습니다. `await` 필수. 이전 버전(14 이하) 에서는 그냥 `params.slug` 로 직접 접근했어요. 회사 코드가 Next.js 14 이하라면 다르게 보일 수 있습니다.

---

### 2. `loading.tsx` — 페이지 로딩 자동 처리

이게 진짜 멋있는 기능입니다. 같은 폴더에 **`loading.tsx`** 만 있으면, **그 페이지가 로딩되는 동안 자동으로 표시** 됩니다. 우리가 직접 isLoading state 만들 필요 없어요. Next.js 가 내부적으로 React Suspense 로 감싸주는 셈입니다.

#### 동작 방식

```
사용자가 /posts/abc 클릭
   ↓
Next.js: page.tsx 실행 시작 (DB 쿼리 등 비동기 작업)
   ↓ (동시에)
Next.js: loading.tsx 를 즉시 화면에 표시  ← 사용자에게 "로딩 중" 보임
   ↓
page.tsx 완료
   ↓
loading.tsx 사라지고 실제 콘텐츠 표시
```

#### 수동 패턴 vs loading.tsx

수동으로 만들려면:

```tsx
// ❌ 수동 패턴 — useState/useEffect 가 필요
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then(d => {
    setData(d);
    setIsLoading(false);
  });
}, []);

if (isLoading) return <SkeletonUI />;
return <ActualContent data={data} />;
```

Next.js 의 loading.tsx 패턴:

```
// ✅ 파일 하나만 만들면 끝
app/posts/[slug]/loading.tsx
```

훅 코드 없이 파일 컨벤션만으로 같은 결과를 얻습니다.

---

### 3. `error.tsx` — 페이지 단위 에러 경계

에러가 났을 때 화면 전체가 하얗게 되는 건 최악의 사용자 경험이죠. `error.tsx` 도 같은 방식으로 동작합니다.

이 파일이 있으면 **그 페이지에서 에러가 발생할 때 자동으로 보여줍니다**. React 의 **Error Boundary** 가 자동 적용되는 셈이에요.

#### 한 가지 주의

- `error.tsx` 는 **반드시 Client Component** (`"use client"` 필수)
- 이유: 에러 복구를 위한 `reset()` 함수가 클릭 핸들러로 동작해야 함

#### Error Boundary 의 진짜 이름

React 에서 Error Boundary 를 직접 만들려면 클래스 컴포넌트 + `componentDidCatch` 가 필요합니다 (복잡). Next.js 의 error.tsx 는 **파일 컨벤션으로 Error Boundary 를 자동 생성** 해주는 셈이에요. 함수 컴포넌트 + 훅만으로 충분합니다.

---

### 4. `notFound()` — 데이터 없을 때 404

URL 의 slug 에 해당하는 글이 없으면? 빈 화면을 보여주는 건 좋지 않죠.

Next.js 의 `notFound()` 함수를 호출하면 **자동으로 404 페이지** 로 넘어갑니다.

```tsx
import { notFound } from "next/navigation";

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();  // ⭐ 404 페이지로
  }

  return <article>{post.title}</article>;
}
```

`notFound()` 호출 후 코드는 더 실행되지 않습니다 — TypeScript 가 알아서 그 이후 `post` 를 non-null 로 인식해줍니다. 깔끔합니다.

---

### 5. 데이터 모듈 분리 — 미래의 DB 교체를 위한 토대

지금까지 `app/page.tsx` 안에 `posts` 배열이 박혀있었어요. 챕터 15 에서 DB 를 연결할 거라, 그 전에 **데이터 접근 로직을 별도 모듈로 분리** 해둡니다.

```tsx
// 챕터 12 까지의 page.tsx
const posts = [
  { id: 1, title: "...", ... },
  { id: 2, title: "...", ... },
  // ... 6개
];
// + 컴포넌트 JSX
```

이걸 다음과 같이 분리합니다.

```tsx
// lib/posts.ts
export const posts = [ ... ];
export async function getAllPosts() { ... }
export async function getPostBySlug(slug) { ... }
export async function getAllTags() { ... }
```

```tsx
// app/page.tsx
import { getAllPosts, getAllTags } from "@/lib/posts";

export default async function HomePage() {
  const posts = await getAllPosts();
  const tags = await getAllTags();
  // ...
}
```

이렇게 분리하면:
- **데이터 출처가 한 곳** — 변경 시 모든 페이지에 적용
- **함수가 async** — 챕터 15 에서 DB 쿼리로 교체할 때 시그니처 그대로
- **컴포넌트는 데이터 출처를 모름** — 추상화 계층

---

## 🛠 실습

다섯 단계로 진행됩니다.

1. `lib/posts.ts` 데이터 모듈 분리
2. `app/posts/[slug]/page.tsx` 글 상세 페이지
3. `app/posts/[slug]/loading.tsx` 스켈레톤 UI
4. `app/posts/[slug]/error.tsx` 에러 UI
5. PostCard 에 Link + page.tsx 에서 lib/posts 사용

---

### 1. `lib/posts.ts` 데이터 모듈 분리

지금까지 `app/page.tsx` 에 박혀있던 posts 데이터를 별도 모듈로 빼냅니다. **`slug`** 와 **`content`** 필드도 추가합니다.

```typescript
// lib/posts.ts
export type Post = {
  id: number;
  slug: string;          // ⭐ 신규 — URL 경로용 고유 식별자
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  content: string;       // ⭐ 신규 — 상세 페이지 본문
  readingTime?: number;
  coverImage?: string;
};

export const posts: Post[] = [
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
    excerpt:
      "API 라우트 없이 서버 함수를 호출하는 새로운 방식. 폼 제출과 데이터 변경을 한 번에.",
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
    excerpt:
      "제네릭은 타입을 변수처럼 다루는 도구입니다. 처음엔 어려워 보여도 패턴은 단순합니다.",
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
    excerpt:
      "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법. 자주 쓰는 5가지 패턴을 모았습니다.",
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
    excerpt:
      "조회 성능을 좌우하는 인덱스 설계. 언제 만들고 언제 안 만들어야 하는가.",
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
    excerpt:
      "로딩 UI를 선언적으로 처리하는 Suspense. 데이터 페칭과 함께 쓰는 진짜 활용법.",
    content: `Suspense 는 자식 컴포넌트가 데이터나 코드를 기다리는 동안 fallback 을 보여주는 경계입니다. Next.js App Router 의 loading.tsx 는 내부적으로 Suspense 를 활용합니다. 컴포넌트 단위로 로딩 경계를 잘게 나누면, 화면 일부만 로딩 표시가 보이고 나머지는 즉시 표시되는 매끈한 UX 를 만들 수 있습니다.`,
    readingTime: 8,
  },
];

// slug 로 글 하나 조회
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  // 실제 DB 가 들어올 자리 — 챕터 15 에서 Drizzle 쿼리로 교체
  // 학습 목적 로딩 시뮬레이션 (loading.tsx 동작 확인용)
  await new Promise((resolve) => setTimeout(resolve, 600));
  return posts.find((p) => p.slug === slug);
}

// 모든 글 조회
export async function getAllPosts(): Promise<Post[]> {
  return posts;
}

// 모든 태그 조회 (중복 제거)
export async function getAllTags(): Promise<string[]> {
  return [...new Set(posts.map((p) => p.tag))];
}
```

#### 이 모듈이 하는 일

이 파일은 **데이터 + 데이터 접근 함수** 를 모아둔 모듈입니다. 컴포넌트들은 이제 데이터가 어디서 오는지 신경 안 쓰고 함수 호출만 하면 됩니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
export type Post = { ... };
```

Post 타입을 **export** 해서 다른 파일들이 import 해서 쓸 수 있게 합니다. 챕터 12 에서 PostList 가 자체 정의한 Post 타입을 이걸로 교체할 예정.

```tsx
slug: string;
```

URL 경로용 고유 식별자. `/posts/use-effect-deps-guide` 의 마지막 부분이 됩니다. id 만 있어도 되지만, **사람이 읽기 좋은 URL** 을 위해 slug 사용. (SEO 에도 좋음)

```tsx
content: string;
```

상세 페이지의 본문 텍스트. 챕터 12 까지의 데이터엔 excerpt(요약) 만 있었어요. 상세 페이지를 만들려면 본문이 필요해서 추가합니다.

```tsx
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return posts.find((p) => p.slug === slug);
}
```

- **`async` 함수**: 챕터 12 의 Server Component 와 자연스럽게 결합. 컴포넌트 본체에서 `await` 로 호출 가능
- **`await new Promise(setTimeout)`**: 600ms 인위적 지연. loading.tsx 의 동작을 시각적으로 확인하기 위함
- **`posts.find((p) => p.slug === slug)`**: 화살표 함수로 첫 번째 일치 글 반환. 없으면 `undefined`
- **반환 타입 `Promise<Post | undefined>`**: 글이 없을 때 undefined 가능성 명시 → 호출하는 쪽이 안전하게 체크

> 💡 챕터 15 에서 이 함수가 **Drizzle ORM 의 DB 쿼리** 로 교체될 예정입니다. 그때 함수 시그니처는 그대로 유지되니, 호출하는 컴포넌트 코드는 안 바뀝니다.

```tsx
export async function getAllTags(): Promise<string[]> {
  return [...new Set(posts.map((p) => p.tag))];
}
```

챕터 06 에서 다룬 `[...new Set(...)]` 패턴. 중복 제거 + 배열로 변환.

---

### 2. `app/posts/[slug]/page.tsx` 글 상세 페이지

이제 동적 라우트 페이지를 만듭니다. `app/posts/[slug]/page.tsx` 경로의 파일을 새로 만들어주세요.

```tsx
// app/posts/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { getPostBySlug } from "@/lib/posts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PageProps) {
  // Next.js 15: params 가 Promise — await 필수
  const { slug } = await params;

  // Server Component 안에서 직접 데이터 조회
  const post = await getPostBySlug(slug);

  // 글이 없으면 404 페이지로
  if (!post) {
    notFound();
  }

  return (
    <Container>
      <div className="py-12">
        {/* 뒤로가기 링크 */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-cyan-400"
        >
          <span>←</span>
          <span>목록으로</span>
        </Link>

        {/* 커버 이미지 */}
        {post.coverImage && (
          <div className="mb-8 aspect-[2/1] w-full overflow-hidden rounded-2xl">
            <img
              src={post.coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* 메타 영역 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
            {post.tag}
          </span>
          {post.readingTime !== undefined && (
            <span className="text-xs text-zinc-500">
              · {post.readingTime}분 읽기
            </span>
          )}
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-4xl font-semibold tracking-tight">
          {post.title}
        </h1>

        {/* 작성자 / 날짜 */}
        <div className="mb-10 flex items-center gap-2 border-b border-zinc-900 pb-6 text-sm text-zinc-500">
          <span className="font-medium text-zinc-300">{post.author}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>

        {/* 본문 */}
        <article className="prose prose-invert max-w-none">
          <p className="text-base leading-relaxed text-zinc-300">
            {post.content}
          </p>
        </article>
      </div>
    </Container>
  );
}
```

#### 이 컴포넌트가 하는 일

URL 의 slug 파라미터를 받아서, 해당 글의 상세 정보를 화면에 표시합니다. 글이 없으면 404 페이지로 자동 이동.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
type PageProps = {
  params: Promise<{ slug: string }>;
};
```

Next.js 15 부터 **`params` 가 Promise 로 변경** 되었습니다. 동기 객체가 아닙니다. 타입에 명시적으로 표현.

```tsx
export default async function PostPage({ params }: PageProps) {
```

**함수 자체가 `async`** 입니다. Server Component 의 특권 — 컴포넌트 함수가 async 일 수 있어요. 챕터 12 에서 페이지를 Server Component 로 되돌렸기 때문에 가능합니다.

```tsx
const { slug } = await params;
```

Promise 를 풀어서 slug 값을 꺼냅니다. **`await` 없이 `params.slug` 하면 안 됩니다** — Promise 객체에 직접 접근하는 셈이라 에러.

```tsx
const post = await getPostBySlug(slug);
```

**Server Component 의 데이터 페칭** — 함수 본체에서 직접 await. useState + useEffect 가 필요 없는 깔끔한 패턴.

```tsx
if (!post) {
  notFound();
}
```

post 가 undefined 면 404 페이지로 이동. `notFound()` 이후 코드는 실행 안 됨 — TypeScript 가 자동으로 post 를 Post 타입으로 좁힘 (non-null).

```tsx
<Link href="/" ...>
  <span>←</span>
  <span>목록으로</span>
</Link>
```

**`<Link>` 컴포넌트** — Next.js 의 클라이언트 사이드 라우팅. 일반 `<a>` 태그와 다르게 **페이지를 새로고침하지 않고** 다른 페이지로 이동. SPA 느낌의 매끄러운 전환.

```tsx
<article className="prose prose-invert max-w-none">
```

`prose` 클래스는 Tailwind Typography 플러그인의 것입니다 (있다면). 우리 프로젝트엔 없지만 클래스를 미리 적어둬도 무해합니다.

#### Server Component 의 단순함

만약 이 페이지가 Client Component 였다면 이런 식이 됐을 거예요:

```tsx
// ❌ Client Component 였다면
const [post, setPost] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchPost(slug)
    .then(p => { setPost(p); setIsLoading(false); })
    .catch(e => { setError(e); setIsLoading(false); });
}, [slug]);

if (isLoading) return <SkeletonUI />;
if (error) return <ErrorUI />;
if (!post) return <NotFoundUI />;
return <ActualContent post={post} />;
```

Server Component 라서:

```tsx
// ✅ Server Component 의 단순함
const { slug } = await params;
const post = await getPostBySlug(slug);
if (!post) notFound();
return <ActualContent post={post} />;
```

- **훅 0개**. 변수 하나로 끝.
- 로딩 처리는 `loading.tsx` 가 자동 (다음 단계)
- 에러 처리는 `error.tsx` 가 자동 (다음 단계)
- 404 는 `notFound()` 한 줄로

---

### 3. `loading.tsx` 스켈레톤 UI ⭐

같은 폴더(`app/posts/[slug]/`) 에 `loading.tsx` 를 만듭니다.

```tsx
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
```

#### 이 컴포넌트가 하는 일

`/posts/[slug]` 페이지가 로딩되는 동안 (600ms) 사용자에게 보여주는 스켈레톤 UI 입니다.

#### 코드 한 줄 한 줄 의미 짚기

각 div 가 **실제 콘텐츠의 자리** 를 표현합니다:
- 뒤로가기 링크 자리, 커버 이미지 자리, 태그 자리, 제목 자리, 메타 자리, 본문 자리

**`animate-pulse`** — Tailwind 의 빌트인 애니메이션. 부드럽게 깜빡이는 효과 (투명도가 1.0 → 0.5 → 1.0 반복). 로딩 중임을 시각적으로 알림.

**`bg-zinc-900`** — 짙은 회색 배경. 실제 콘텐츠가 들어갈 영역.

**`h-4 w-24`** — 각 요소의 크기. 실제 콘텐츠 크기와 비슷하게 맞추면 자연스럽습니다.

#### 좋은 스켈레톤 UI 의 원칙

- 실제 콘텐츠의 **레이아웃 골격** 과 비슷하게 만들기
- 사용자가 "로딩 중인 게 무엇인지" 미리 파악 가능
- 콘텐츠가 도착했을 때 위치 이동 (layout shift) 최소화

#### loading.tsx 가 자동으로 동작하는 이유

```
app/posts/[slug]/
├── page.tsx       ← 600ms 걸리는 페이지
└── loading.tsx    ← 같은 폴더에 있으면 자동 적용
```

Next.js 가 내부적으로 다음과 같이 처리합니다:

```tsx
// Next.js 가 자동 생성하는 코드 (개념적으로)
<Suspense fallback={<Loading />}>
  <PostPage />
</Suspense>
```

**React Suspense** 메커니즘이 자동으로 적용되는 거예요. 우리는 그저 두 파일을 같은 폴더에 두기만 하면 됩니다.

---

### 4. `error.tsx` 에러 UI

같은 폴더에 `error.tsx` 를 만듭니다.

```tsx
// app/posts/[slug]/error.tsx
"use client";  // ⭐ error.tsx 는 반드시 Client Component

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
        <h2 className="mb-3 text-2xl font-semibold">
          글을 불러오는 중 문제가 발생했습니다
        </h2>
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
```

#### 이 컴포넌트가 하는 일

페이지에서 에러가 발생했을 때 자동으로 표시되는 UI 입니다. 사용자에게 친근한 안내 + 다시 시도 / 목록으로 돌아가기 두 가지 선택지를 제공합니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

**error.tsx 는 반드시 Client Component**. 이유는 `reset()` 이 클릭 핸들러로 동작해야 하기 때문 (챕터 12 에서 다룬 "이벤트 핸들러는 Client" 원칙).

```tsx
type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};
```

Next.js 가 error.tsx 에 전달하는 두 props:
- **`error`**: 발생한 에러 객체. `digest` 는 프로덕션에서 에러 ID 추적용
- **`reset`**: 컴포넌트 트리를 다시 렌더링해서 에러 복구를 시도하는 함수

```tsx
useEffect(() => {
  console.error("[글 상세 페이지 에러]", error);
}, [error]);
```

**에러 로깅 사이드 이펙트**. 챕터 08 의 useEffect 패턴.
- 의존성 배열에 `[error]` — 같은 에러로 여러 번 리렌더되어도 로그는 에러가 바뀔 때만
- 실무에서는 `console.error` 자리에 Sentry, Datadog 같은 에러 추적 서비스 호출이 들어갑니다

```tsx
<button onClick={reset}>다시 시도</button>
```

`reset()` 을 호출하면 Next.js 가 컴포넌트 트리를 다시 렌더링합니다. 일시적인 네트워크 오류 같은 경우 한 번 더 시도하면 성공할 수 있어요.

#### Server / Client 혼재해도 OK

`app/posts/[slug]/` 폴더 안에:
- `page.tsx` (Server Component)
- `loading.tsx` (Server Component)
- `error.tsx` (Client Component — `"use client"`)

서로 다른 종류가 한 폴더에 섞여 있어도 Next.js 가 알아서 분리해서 처리합니다.

---

### 5. PostCard 에 Link + page.tsx 에서 lib/posts 사용

이제 카드를 클릭하면 상세 페이지로 가도록 하고, 기존 페이지들이 `lib/posts` 를 사용하도록 정리합니다.

#### 5-1. PostCard 에 Link 추가

`components/PostCard.tsx` 를 다음과 같이 수정합니다.

```tsx
// components/PostCard.tsx
import Link from "next/link";
import LikeButton from "./LikeButton";

type PostCardProps = {
  slug: string;          // ⭐ 신규 — Link 경로용
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  readingTime?: number;
  coverImage?: string;
  initialLikes?: number;
};

export default function PostCard({
  slug,
  title,
  author,
  date,
  tag,
  excerpt,
  readingTime,
  coverImage,
  initialLikes = 0,
}: PostCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-cyan-500/5">
      {/* ⭐ 본문 영역만 Link 로 감쌈 (LikeButton 클릭 보호) */}
      <Link href={`/posts/${slug}`} className="block">
        {coverImage && (
          <div className="aspect-[3/1] w-full overflow-hidden bg-zinc-800">
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5 pb-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
              {tag}
            </span>
            {readingTime !== undefined && (
              <span className="text-xs text-zinc-500">
                · {readingTime}분 읽기
              </span>
            )}
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
            {title}
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-400">{excerpt}</p>
        </div>
      </Link>

      {/* ⭐ 메타 + LikeButton 영역은 Link 밖에 배치 */}
      <div className="flex items-center justify-between px-5 pb-5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">{author}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <LikeButton initial={initialLikes} />
      </div>
    </article>
  );
}
```

#### 변화점 짚기

- **`slug` prop 추가** — Link 경로 생성용
- **본문 영역만 Link 로 감쌈** — 커버 이미지부터 excerpt 까지
- **메타 + LikeButton 은 Link 밖** — 좋아요 클릭 시 페이지 이동 방지

#### 본문만 Link 로 감싼 이유 — 챕터 11 의 버블링이 여기서 연결됨

만약 카드 전체를 Link 로 감싸면:

```tsx
<Link href={`/posts/${slug}`}>
  <article>
    <h2>{title}</h2>
    <LikeButton />  {/* ← 클릭하면? */}
  </article>
</Link>
```

LikeButton 클릭 시:
1. LikeButton 의 onClick 실행 (좋아요 토글)
2. 이벤트가 부모로 버블링 (챕터 11)
3. Link 가 페이지 이동 트리거 → **상세 페이지로 점프해버림** 😱

해결책 두 가지:
- **본문만 Link 로 감싸기** (우리가 한 방법)
- **LikeButton 의 onClick 에서 `e.stopPropagation()` + `e.preventDefault()`** (이중 안전장치)

본 프로젝트의 LikeButton 은 이미 `stopPropagation` + `preventDefault` 가 들어 있습니다 (챕터 11 에서 추가). 그래서 LikeButton 이 Link 안에 있어도 안전하지만, **구조적으로 명확하게 분리하는 게 더 좋다** 는 판단으로 영역을 나눴어요.

#### 5-2. PostList 에서 Post 타입 재사용

`components/PostList.tsx` 의 일부만 수정합니다.

```tsx
// components/PostList.tsx
"use client";

import { useMemo, useState } from "react";
import PostCard from "./PostCard";
import TagFilter from "./TagFilter";
import EmptyState from "./EmptyState";
import SearchInput from "./SearchInput";
import SortSelect, { type SortOption } from "./SortSelect";
import { useDebounce } from "@/hooks/useDebounce";
import type { Post } from "@/lib/posts";  // ⭐ 타입 재사용

type PostListProps = {
  posts: Post[];
  tags: string[];
};

// 자체 정의했던 Post 타입은 제거

export default function PostList({ posts, tags }: PostListProps) {
  // ... (이하 기존 코드와 동일)
}
```

#### 변화점

- **`import type { Post } from "@/lib/posts"`** 추가
- 챕터 12 에서 PostList 가 자체 정의했던 `type Post = { ... }` 부분 제거

이제 Post 타입이 **한 곳(lib/posts.ts)에서만 관리** 됩니다. 챕터 15 에서 DB 스키마를 만들면, 거기서 자동 추론된 타입으로 또 한 번 교체됩니다.

#### 5-3. `app/page.tsx` 를 async 로 변환

```tsx
// app/page.tsx
import Container from "@/components/Container";
import StudyTimer from "@/components/StudyTimer";
import PostList from "@/components/PostList";
import { getAllPosts, getAllTags } from "@/lib/posts";

export default async function HomePage() {  // ⭐ async 함수로 변환
  // ⭐ Server Component 에서 데이터 조회
  const posts = await getAllPosts();
  const tags = await getAllTags();

  return (
    <Container>
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
              개발자가 학습한 내용을 정리하고, 시간을 추적하고, 성장을 시각화하는
              공간입니다.
            </p>
          </div>
          <StudyTimer />
        </div>
      </section>

      <PostList posts={posts} tags={tags} />
    </Container>
  );
}
```

#### 변화점 짚기

**큰 변화** — posts 배열 정의 60+ 줄이 사라지고 함수 호출 두 줄로 단순화.

```tsx
// 챕터 12 까지
const posts = [
  { id: 1, ... },
  { id: 2, ... },
  // ... 6개
];
const tags = [...new Set(posts.map((p) => p.tag))];

// 챕터 13
const posts = await getAllPosts();
const tags = await getAllTags();
```

| 항목 | 챕터 12 | 챕터 13 |
|---|---|---|
| 데이터 출처 | 컴포넌트 안 | `lib/posts.ts` |
| 함수 타입 | 일반 함수 | **`async` 함수** ⭐ |
| useState/useMemo | 없음 (챕터 12 에서 PostList 로 이동) | 없음 |
| 코드 길이 | ~80 줄 | ~35 줄 |

**`async function HomePage()`** — 챕터 12 에서 약속했던 "페이지 컴포넌트가 진짜 async 가 되는 순간" 이 실현됐습니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

1. **메인 페이지** — 챕터 12 와 동일하게 보임
2. **글 카드의 본문 영역을 클릭** → `/posts/[slug]` 로 이동
3. **이동 직후 600ms 동안 스켈레톤 UI** 표시 ⭐ (loading.tsx 동작)
4. **글 상세 페이지** 정상 표시 — 커버 이미지, 제목, 본문 등
5. **"목록으로" 링크** 클릭 → 메인 페이지로 즉시 복귀
6. **존재하지 않는 slug** 직접 URL 입력 (예: `/posts/nonexistent`) → 404 페이지
7. **카드의 좋아요 버튼** 클릭 → 토글만 동작, 상세 페이지로 이동 X

여기까지 잘 동작하면 이번 챕터의 목표는 모두 달성된 것입니다.

> 💡 **임원분들께 데모하실 때 "로딩이 매끈하네요" 라는 반응이 나올 만한 챕터** 입니다. 단순한 isLoading state 가 아닌, **프레임워크 차원의 자동 처리** 가 만드는 차이입니다.

---

## ❓ 흔한 실수

### Q1. `params.slug` 직접 접근
```tsx
// ❌ Next.js 15+ 에서는 에러
const slug = params.slug;

// ✅ await 필수
const { slug } = await params;
```
Next.js 15 부터 params 가 Promise 로 변경. 14 이하 코드를 그대로 가져오시면 에러납니다.

### Q2. `loading.tsx` 가 안 보임
- 같은 폴더에 있는지 확인 (`app/posts/[slug]/loading.tsx`)
- 페이지가 너무 빨리 로딩되면 안 보일 수 있음 (개발 모드에선 600ms 지연이 있어야 보임)
- 브라우저 캐시 클리어 후 재시도

### Q3. `error.tsx` 에 `"use client"` 빼먹음
빌드 에러. error.tsx 는 `reset()` 을 클릭 핸들러로 받아야 하니 반드시 Client Component.

### Q4. `notFound()` 호출 후 추가 코드 실행 기대
```tsx
if (!post) {
  notFound();
  return <div>이건 안 보임</div>;  // ⚠️ 도달 불가
}
```
`notFound()` 가 호출되면 그 즉시 404 페이지로 이동, 이후 코드는 무시됩니다.

### Q5. Server Component 안에서 `useEffect` 사용
```tsx
// ❌ Server Component
export default async function Page() {
  useEffect(() => { ... });  // 에러
  // ...
}
```
훅은 Client Component 전용. 데이터 페칭은 그냥 `await` 로.

### Q6. 카드 전체를 Link 로 감싸서 좋아요 클릭 시 페이지 이동
```tsx
// ❌ 카드 전체를 Link 로
<Link href={`/posts/${slug}`}>
  <article>
    <LikeButton />  {/* 클릭하면 페이지 이동도 발생 */}
  </article>
</Link>
```
해결: 영역을 분리하거나 LikeButton 에 `stopPropagation` + `preventDefault` (챕터 11).

### Q7. `<Link href="/posts/abc">` 대신 `<a href="/posts/abc">` 사용
일반 `<a>` 태그는 **페이지 전체 새로고침** 됨. SPA 의 매끄러운 전환을 잃습니다. Next.js 의 `<Link>` 컴포넌트가 클라이언트 사이드 네비게이션 처리.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] **동적 라우팅** 의 폴더 패턴 (`[slug]`) 을 안다
- [ ] Next.js 15 의 **`params` 가 Promise** 임을 안다 (`await params`)
- [ ] **`loading.tsx`** 의 자동 동작 원리 (Suspense 내부 사용) 를 안다
- [ ] **`error.tsx`** 가 반드시 Client Component 인 이유를 안다
- [ ] **`notFound()`** 의 동작 (이후 코드 실행 X, 404 페이지로) 을 안다
- [ ] **Server Component 의 async 함수** 패턴을 안다 (useState/useEffect 없는 데이터 페칭)
- [ ] **데이터 모듈 분리** (`lib/posts.ts`) 의 이유 (DB 교체 대비, 추상화) 를 안다
- [ ] http://localhost:3000 에서 글 상세 페이지 + 스켈레톤 + 404 모두 정상 동작 확인

---

## ✅ 다음 챕터 예고

> **챕터 14: Server Actions** (글 작성 폼)
> 지금까지는 글 데이터를 화면에 표시만 했습니다. 이제 **글을 작성** 할 수 있게 만듭니다. **Server Actions** — API 라우트 정의 없이 서버 함수를 직접 호출하는 Next.js 의 모던 패턴을 다룹니다. 폼 제출과 서버 데이터 변경을 한 번에 처리하는 깔끔한 방식입니다.
