# 챕터 12: Server vs Client Components

> **시간**: 약 30분 · **블록**: Day 2 / Block 4 (시작)

---

## 🎯 이 챕터에서 다룰 내용

- Next.js App Router 의 **이중 컴포넌트 모델** — Server / Client
- 전통 웹 구조 (웹 서버 + WAS) 와 Next.js 의 통합 모델 비교
- `"use client"` 의 진짜 의미와 동작 방식
- **클라이언트 경계(Client Boundary)** 설계 원칙 — "필요한 곳만 클라이언트로"
- 챕터 11 까지 만든 `app/page.tsx` 를 **다시 Server Component 로 되돌리기** ⭐
- 인터랙션 부분만 `PostList` Client Component 로 분리

Day 2 의 첫 챕터입니다. 챕터 07 에서 처음 만났던 `"use client"` — "깊은 건 챕터 12 에서" 라고 미뤄뒀던 그 챕터입니다.

이번 챕터를 마치시면 Day 2 의 모든 챕터(DB, 인증, 대시보드) 의 토대가 깔립니다. **Server Component 가 아니면 DB 를 직접 호출할 수 없거든요.** 오늘의 작업이 다음 챕터들의 기반이 됩니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/PostList.tsx` — Client Component, 검색/필터/정렬 통합 (신규)
- `app/page.tsx` — `"use client"` 제거 → Server Component 로 복귀 (수정)

---

## 🧠 핵심 개념

### 1. 잠시 전통 웹 구조 짚고 가기

Next.js 의 이중 컴포넌트 모델을 이해하시려면, 먼저 **전통 웹 구조** 와의 차이를 짚는 게 좋습니다.

#### 전통적인 3티어 구조 (React + Spring Boot 등)

```
┌─────────────────────────────────────────────────────┐
│  웹 서버 (Nginx, Apache)                              │
│  - 정적 파일 서빙 (index.html, JS 번들)                 │
│  - 리버스 프록시                                        │
└──────────────┬──────────────────────────────────────┘
               │ /api/* 는 WAS 로 프록시
┌──────────────▼──────────────────────────────────────┐
│  WAS (Tomcat + Spring Boot 등)                        │
│  - 비즈니스 로직, REST API                              │
│  - DB 조회                                              │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  DB                                                   │
└─────────────────────────────────────────────────────┘
```

이 구조에서 사용자가 페이지를 요청하면:
1. Nginx 가 빈 HTML 던짐
2. 브라우저: JS 번들 다운로드 + 실행
3. React 가 `useEffect` 에서 `fetch("/api/posts")` 호출
4. Nginx → WAS → DB → WAS → Nginx → 브라우저 (왕복)
5. 그제야 데이터 표시

이걸 **CSR (Client-Side Rendering)** 이라고 부릅니다. 첫 화면이 늦게 보이고, SEO 가 약한 단점이 있었어요.

#### Next.js 의 통합 모델

```
┌─────────────────────────────────────────────────────┐
│  Next.js 서버 (Node.js 단일 프로세스)                  │
│  ─────────────────────────────────                    │
│  ✅ 정적 파일 서빙 (웹 서버 역할)                        │
│  ✅ HTML 생성 (Server Component 렌더링)                │
│  ✅ API 엔드포인트 + 비즈니스 로직 (WAS 역할)            │
│  ✅ DB 직접 조회                                        │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  DB                                                   │
└─────────────────────────────────────────────────────┘
```

**Next.js 는 웹 서버와 WAS 의 역할을 한 프로세스에서 통합합니다.** 그래서 풀스택 프레임워크라고 불립니다.

이 통합의 장점:
- **빠른 첫 화면** — 서버가 HTML 을 미리 만들어 보냄 (SSR)
- **빠른 데이터 페칭** — 서버 안에서 DB 와 직접 통신 (네트워크 왕복 X)
- **SEO 강함** — 검색엔진이 완성된 HTML 을 봄
- **TypeScript 한 언어로 끝** — 프론트/백 같은 코드베이스

여기까지 이해하셨다면 다음으로 가겠습니다.

---

### 2. Next.js App Router 의 이중 컴포넌트 모델

Next.js App Router 에선 모든 컴포넌트가 **두 종류 중 하나** 입니다.

- **Server Component (기본)** — `"use client"` 가 없는 컴포넌트
- **Client Component** — `"use client"` 가 있는 컴포넌트

이 둘은 같은 React 컴포넌트처럼 보이지만, **동작 방식이 완전히 다릅니다**.

#### 두 컴포넌트 비교

| 항목 | Server Component (기본) | Client Component (`"use client"`) |
|---|---|---|
| 어디서 실행? | **서버** (Node.js) | **서버 한 번 + 브라우저** |
| state (useState 등) | ❌ 사용 불가 | ✅ 가능 |
| 이벤트 (onClick 등) | ❌ 사용 불가 | ✅ 가능 |
| async 함수 | ✅ 가능 (`async function`) | ⚠️ 가능하지만 패턴 다름 |
| DB 직접 호출 | ✅ 가능 | ❌ 불가 (보안) |
| 환경변수 | ✅ 모두 접근 | ⚠️ `NEXT_PUBLIC_` 만 |
| 클라이언트 JS 번들 | ❌ 0 KB (브라우저에 안 보냄) | ⚠️ 번들에 포함됨 |

#### 시각적 비교

```
[Server Component]                  [Client Component]
┌──────────────────────┐           ┌──────────────────────┐
│ 서버에서만 실행       │           │ 서버에서 한 번 + 브라우저│
│  ↓                   │           │  ↓                   │
│ HTML 생성            │           │ HTML 생성 (1차 렌더)  │
│  ↓                   │           │  ↓                   │
│ 브라우저로 전송       │           │ JS 번들도 같이 전송   │
│ (HTML 만)            │           │  ↓                   │
│                      │           │ 브라우저에서 hydration│
│ JS 번들 0 KB         │           │ (이벤트, state 활성화)│
└──────────────────────┘           └──────────────────────┘
```

---

### 3. `"use client"` 의 진짜 의미

여기 흔한 오해가 있습니다.

```
❌ 오해: "use client" = 서버에서 안 돌아감, 브라우저에서만 동작
✅ 정답: "use client" = "이 컴포넌트부터는 클라이언트 영역" 이라는 경계 표시
```

#### 정확한 흐름

```
1. 서버: 모든 컴포넌트 (Server + Client 둘 다) 한 번 실행 → HTML 생성
2. 브라우저: HTML 받아서 화면 표시 (즉시 보임) ⭐
3. 브라우저: JS 번들 다운로드
4. 브라우저: 클라이언트 컴포넌트들만 hydration
   → state 활성화, 이벤트 핸들러 부착
5. 사용자가 클릭/입력 가능 (인터랙티브 상태)
```

**Client Component 도 서버에서 한 번 실행됩니다!** 그 결과로 만들어진 HTML 은 "초기 상태" 일 뿐이고, 브라우저에서 hydration 으로 살아나는 거예요.

> 💡 **hydration**: 서버가 만든 정적 HTML 에 JS 를 입혀 인터랙티브하게 만드는 과정. "마른 HTML 에 물 주기" 라고 비유하기도 합니다.

#### 한 파일의 첫 줄에 적기

```tsx
"use client";

import { useState } from "react";

export default function MyButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

이 한 줄의 의미:
- "이 파일과, 이 파일이 import 하는 모든 자식 컴포넌트는 클라이언트 측에서도 동작한다"
- "내 자식 컴포넌트들은 자동으로 클라이언트가 된다 (별도 `"use client"` 불필요)"

---

### 4. 클라이언트 경계의 전염성

여기가 중요합니다. **`"use client"` 는 위에서 아래로 전염됩니다.** 부모가 클라이언트면 자식들은 자동으로 클라이언트가 됩니다.

#### 전염성 시각화

```
Server                      Client
─────                       ──────
[layout.tsx]                              ← 서버 (기본)
   ↓
[page.tsx]            "use client" ←      ← 한 번 붙이면
   ↓                     ↓
[Container]              ↓                ← 자동으로 클라이언트
   ↓                     ↓
[PostCard]               ↓                ← 자동으로 클라이언트
   ↓                     ↓
[LikeButton]             ↓                ← 자동으로 클라이언트
```

#### 우리 page.tsx 가 이 상태

챕터 07 에서 useState 를 처음 도입할 때, `app/page.tsx` 최상단에 `"use client"` 를 붙였습니다. 그 결과 **페이지 전체가 클라이언트가 되었어요**. 히어로 섹션, 글 데이터 정의, 레이아웃 같은 부분도 모두 클라이언트 영역.

문제는:
- 클라이언트 컴포넌트는 JS 번들 크기에 포함됨 (느려짐)
- 서버에서 직접 DB 를 호출할 수 없음 (다음 챕터부터 필요)
- SEO 측면에서 손해

#### 그럼 어떻게 분리?

✅ **클라이언트 경계를 깊은 곳에 둔다** — 인터랙션이 필요한 컴포넌트만 클라이언트로, 나머지는 서버로 유지.

```
[layout.tsx]                              ← 서버
   ↓
[page.tsx]                                ← 서버 (DB 호출 가능!)
   ↓
[PostList]            "use client" ←      ← 여기부터 클라이언트
   ↓
[PostCard]               ↓                ← 클라이언트
   ↓
[LikeButton]             ↓                ← 클라이언트
```

**이번 챕터의 작업이 정확히 이 그림을 만드는 것** 입니다.

---

### 5. Server / Client 사이 props 전달의 제약

Server Component 가 Client Component 에 props 를 넘길 때 한 가지 제약이 있습니다.

**함수, Date, Map 같은 직렬화 안 되는 값은 못 넘깁니다.** Server → Client 는 네트워크를 건너는 셈이라, **JSON 으로 변환 가능한 값만** 가능합니다.

```tsx
// ✅ 가능 — JSON 직렬화 가능
<ClientChild
  text="hello"
  count={42}
  items={[1, 2, 3]}
  user={{ name: "길동" }}
/>

// ❌ 불가능 — 함수는 직렬화 안 됨
<ClientChild onClick={() => {}} />

// ❌ 불가능 — Date 객체 (ISO 문자열로 보내면 OK)
<ClientChild createdAt={new Date()} />
```

> 💡 우리 프로젝트에선 `posts` 배열이 plain object 라 OK. 함수를 자식에 넘기려면 그 자식을 Client Component 로 만들어야 합니다.

---

## 🛠 실습

세 단계로 진행됩니다.

1. 현재 코드 진단 — 무엇이 클라이언트 영역을 강제하고 있나
2. PostList 를 Client Component 로 추출
3. page.tsx 를 Server Component 로 되돌리기

---

### 1. 현재 코드 진단

`app/page.tsx` 를 열고 다음 요소들을 확인해보세요.

```tsx
"use client";  // ← 이게 왜 필요한가?

import { useMemo, useState } from "react";  // ← 이 두 훅 때문
// ...

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string>("all");  // ← useState
  const [query, setQuery] = useState<string>("");              // ← useState
  const debouncedQuery = useDebounce(query, 300);              // ← 내부에서 useState/useEffect
  const [sortBy, setSortBy] = useState<SortOption>("newest");  // ← useState

  const filteredPosts = useMemo(() => { ... }, [...]);         // ← useMemo
  // ...
}
```

#### 진단 결과

| 사용 중인 훅 | 클라이언트 강제 이유 |
|---|---|
| `useState` (4개) | 브라우저 메모리에 값 보관 |
| `useMemo` | 매 렌더 후 비교 — 클라이언트 렌더링 사이클 |
| `useDebounce` | 내부에서 setTimeout (브라우저 API) |

**"이 훅이 하나라도 있으면 그 컴포넌트는 클라이언트여야 한다"** — 그래서 우리는 컴포넌트를 잘게 나눠서 **"훅을 쓰는 부분만 클라이언트"** 로 만드는 전략을 씁니다.

그런데 잘 보면 — **히어로 섹션, 글 데이터 정의, 레이아웃** 은 인터랙션이 전혀 없어요. 이건 서버에서 그려줘도 충분하죠. 다음 단계에서 분리합니다.

---

### 2. `PostList` Client Component 추출

인터랙션이 모여있는 글 목록 영역을 별도 Client Component 로 분리합니다.

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

// Server Component 에서 받을 props 타입
type Post = {
  id: number;
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  readingTime?: number;
  coverImage?: string;
};

type PostListProps = {
  posts: Post[];   // ⭐ 서버에서 받음 (직렬화 가능한 plain object)
  tags: string[];  // ⭐ 서버에서 미리 추출
};

export default function PostList({ posts, tags }: PostListProps) {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const filteredPosts = useMemo(() => {
    let result =
      activeTag === "all"
        ? posts
        : posts.filter((p) => p.tag === activeTag);

    if (debouncedQuery.trim() !== "") {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.date.localeCompare(a.date);
        case "oldest":
          return a.date.localeCompare(b.date);
        case "shortest":
          return (a.readingTime ?? 0) - (b.readingTime ?? 0);
        case "longest":
          return (b.readingTime ?? 0) - (a.readingTime ?? 0);
      }
    });

    return result;
  }, [activeTag, debouncedQuery, sortBy, posts]);

  return (
    <section className="py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">최근 글</h2>
          <p className="mt-1 text-sm text-zinc-500">
            총 {filteredPosts.length}개의 글
          </p>
        </div>
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>

      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="제목이나 본문으로 검색..."
        />
      </div>

      <div className="mb-8">
        <TagFilter
          tags={tags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
        />
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          message={
            debouncedQuery
              ? `'${debouncedQuery}' 검색 결과가 없습니다`
              : `'${activeTag}' 태그의 글이 없습니다`
          }
          hint="다른 검색어나 태그를 시도해보세요"
        />
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}
    </section>
  );
}
```

#### 이 컴포넌트가 하는 일

챕터 11 까지의 `app/page.tsx` 에 있던 **모든 인터랙티브 부분을 그대로** 이 컴포넌트로 옮겼습니다. 동작은 완전히 동일하지만, 이제 이 부분만 클라이언트 영역으로 격리됩니다.

#### 변화점 짚기

- **`"use client"`** 가 이 파일에 위치 (page.tsx 가 아니라)
- **posts 와 tags 를 props 로 받음** (이전엔 page.tsx 안에 있던 데이터)
- 모든 useState/useMemo/useDebounce 가 이 안으로 이동
- useMemo 의존성 배열에 **`posts` 추가** (props 로 받았으니 의존성)

#### useMemo 의존성에 posts 가 추가된 이유

```tsx
}, [activeTag, debouncedQuery, sortBy, posts]);
```

이전 챕터까지는 posts 가 모듈 최상위 상수라 의존성에 안 넣어도 됐어요. 이제 **props 로 받으니까** 의존성에 포함해야 합니다. ESLint 의 `exhaustive-deps` 규칙이 잡아줍니다.

#### Post 타입 정의의 임시성

```tsx
type Post = {
  id: number;
  title: string;
  // ...
};
```

여기서 Post 타입을 직접 정의했지만, **챕터 15 (DB 연결)** 에서는 Drizzle 의 스키마에서 자동 추론된 타입으로 교체할 예정입니다. 그때 이 타입 정의가 사라지고 `import type { Post } from "@/lib/posts"` 로 바뀝니다.

---

### 3. `app/page.tsx` 를 Server Component 로 되돌리기

이제 page.tsx 에서 `"use client"` 를 제거하고, posts 데이터를 그대로 두되 인터랙티브 부분만 `<PostList>` 에 위임합니다.

```tsx
// app/page.tsx
import Container from "@/components/Container";
import StudyTimer from "@/components/StudyTimer";
import PostList from "@/components/PostList";

const posts = [
  // ... (기존 6개 글 그대로)
];

const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
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

가장 중요한 변화 — **`"use client"` 제거** 와 **`useState`/`useMemo`/`useDebounce` 모두 사라짐**.

| 챕터 11 page.tsx | 챕터 12 page.tsx |
|---|---|
| `"use client"` 있음 | **없음 (Server Component)** |
| `useState` 4개 | 없음 |
| `useMemo` 사용 | 없음 |
| `useDebounce` 사용 | 없음 |
| 200+ 줄 | 약 35 줄 |

훨씬 단순해졌습니다. **순수한 레이아웃 + 데이터 정의** 만 남았어요.

#### "이 컴포넌트는 서버에서 실행됩니다"

이제 `HomePage` 함수는 **서버에서만** 실행됩니다. 그 결과로 만들어진 HTML 이 브라우저로 전송되고, 그 안의 `<StudyTimer />` 와 `<PostList>` 만 브라우저에서 hydration 됩니다.

**나머지 부분 — 히어로 텍스트, 그라데이션 헤딩, Container** — 은 클라이언트 JS 번들에 포함되지 않습니다. 번들 크기가 줄어듭니다.

#### 함수형 컴포넌트인데 async 가 없는 이유

```tsx
export default function HomePage() {  // async 없음
  // ...
}
```

Server Component 는 **async 함수가 될 수 있지만, 필수는 아닙니다**. 우리 HomePage 는 현재 시점엔 비동기 작업이 없어요 — 데이터가 모듈 최상위 상수라 `await` 가 필요 없습니다.

**챕터 15 에서 DB 를 연결** 하면 이 함수가 `async` 가 됩니다:

```tsx
// 챕터 15 의 모습 (미리보기)
export default async function HomePage() {
  const posts = await getAllPosts();  // ⭐ DB 조회
  const tags = await getAllTags();
  return (
    <Container>
      {/* ... */}
      <PostList posts={posts} tags={tags} />
    </Container>
  );
}
```

이게 Server Component 의 진짜 매력이에요 — **컴포넌트 함수 안에서 직접 await 로 DB 조회**. 챕터 15 에서 만나요.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

- 화면은 챕터 11 과 **완전히 동일하게 보임** (검색/필터/정렬/좋아요 모두 동작)
- 다만 내부 구조가 바뀌었음 — 페이지의 일부만 클라이언트
- 브라우저 개발자 도구 → Network 탭에서 JS 번들 크기를 확인해보시면, 챕터 11 보다 약간 작아진 것을 볼 수 있습니다 (Container 등 정적 요소가 빠짐)

여기까지 확인되면 이번 챕터의 목표는 달성된 것입니다.

> 💡 **사용자 입장에선 변화가 없는 게 정상입니다.** 챕터 09 의 useMemo 적용과 비슷하게, 시각적으로는 동일하지만 **내부 구조와 성능 특성** 이 더 좋아진 상태입니다.

---

### Server / Client 컴포넌트 설계 원칙

이번 챕터의 작업이 보여주는 일반적인 패턴입니다.

#### ✅ Server Component 로 두기 좋은 것

- 페이지 전체 레이아웃
- 정적 콘텐츠 (히어로, 푸터, 헤더 일부)
- DB 조회가 필요한 데이터 페칭
- SEO 가 중요한 부분 (제목, 설명, 첫 콘텐츠)

#### ✅ Client Component 로 만들어야 하는 것

- 사용자 인터랙션 (onClick, onChange 등)
- useState, useEffect 등의 훅 사용
- 브라우저 API 사용 (localStorage, window 등)
- 실시간으로 변하는 UI (타이머, 애니메이션 등)

#### 일반적인 전략

1. **기본은 Server Component** 로 시작
2. **인터랙션이 필요한 부분만** Client Component 로 추출
3. 가능한 **클라이언트 경계를 깊은 곳에** 두기 (잎사귀 쪽)

이 원칙에 따라 우리는 `PostList` 를 추출했고, `StudyTimer`, `LikeButton`, `TagFilter`, `SearchInput`, `SortSelect` 가 모두 자연스럽게 클라이언트 영역에 위치합니다.

---

## ❓ 흔한 실수

### Q1. `"use client"` 가 "서버에선 안 돈다" 는 뜻이라고 오해
실제로는 Client Component 도 **서버에서 한 번 실행** 됩니다 (초기 HTML 생성). 그 후 브라우저에서 hydration 으로 활성화됩니다. `"use client"` 는 **"이 컴포넌트는 브라우저에서도 동작이 필요함"** 이라는 표시일 뿐입니다.

### Q2. Server Component 안에서 useState 사용
```tsx
// ❌ Server Component (use client 없음)
export default function HomePage() {
  const [count, setCount] = useState(0);  // 에러
  return ...;
}
```
빌드 에러. Server Component 에선 React 훅을 사용할 수 없습니다. 인터랙션이 필요하면 `"use client"` 를 추가하거나 그 부분을 별도 컴포넌트로 추출.

### Q3. Server → Client 에 함수 prop 전달
```tsx
// Server Component
export default async function Page() {
  const handleClick = () => {};  // ❌
  return <ClientChild onClick={handleClick} />;
}
```
함수는 직렬화 불가. Server Actions 를 쓰거나, 자식을 Client Component 로 만들어 자체적으로 함수 정의.

### Q4. Client Component 안에서 환경변수 사용
```tsx
"use client";
const apiKey = process.env.MY_SECRET_KEY;  // ❌ undefined
```
보안상 클라이언트엔 일반 환경변수가 전달되지 않습니다. 필요하면 `NEXT_PUBLIC_` 접두사를 붙여야 하지만, 그건 **누구나 볼 수 있는 값** 이라는 의미. 비밀 키는 절대 클라이언트로 보내면 안 됩니다.

### Q5. 모든 자식 컴포넌트에 `"use client"` 를 다시 붙임
한 번 `"use client"` 가 붙은 컴포넌트 트리 아래는 자동으로 클라이언트입니다. 자식들에 또 붙일 필요 없어요 (붙여도 에러는 안 나지만 의미 없음).

### Q6. 클라이언트 경계를 너무 위에 둠
```tsx
// ❌ page.tsx 전체를 클라이언트로
"use client";
export default function HomePage() { ... }
```
이렇게 하면 페이지 전체가 클라이언트 영역. JS 번들 커지고, SEO 약해지고, DB 직접 호출 불가. **가능한 깊은 곳에** 두세요.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] 전통 웹 구조 (웹 서버 + WAS) 와 Next.js 통합 모델의 차이를 안다
- [ ] Server Component 와 Client Component 의 차이를 표로 설명할 수 있다
- [ ] `"use client"` 는 "서버에서 안 돈다" 가 아닌 **"클라이언트 경계"** 임을 안다
- [ ] hydration 의 개념을 안다 (서버 HTML + 클라이언트 JS 결합)
- [ ] `"use client"` 의 전염성 (위→아래) 을 안다
- [ ] Server/Client props 전달 시 직렬화 제약을 안다
- [ ] "Server Component 기본 + 인터랙션만 Client" 전략의 의미를 안다
- [ ] http://localhost:3000 에서 화면 동작이 챕터 11 과 동일한지 확인했다

---

## ✅ 다음 챕터 예고

> **챕터 13: 동적 라우팅 + loading/error UI** ⭐
> 매끈함 마일스톤 챕터입니다. 글 카드를 클릭하면 글 상세 페이지로 자연스럽게 넘어가는 흐름을 만듭니다. Next.js 가 자랑하는 **`loading.tsx`** 와 **`error.tsx`** — 파일 하나 만드는 것만으로 페이지 전체에 스켈레톤 UI 와 에러 처리가 자동으로 붙는 강력한 기능을 다룹니다.
