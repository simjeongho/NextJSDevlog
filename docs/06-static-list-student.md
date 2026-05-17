# 챕터 06: 정적 글 목록 화면 완성

> **시간**: 약 45분 · **블록**: Day 1 / Block 2 (마지막)

---

## 🎯 이 챕터에서 다룰 내용

- 챕터 02~05 에서 배운 **JSX, 컴포넌트, Props, children/Layout** 을 한 번에 통합
- 카드 시각 디테일 업그레이드 — 호버 효과, 그라데이션, 뱃지
- **빈 상태(empty state)** UI 추가 — "글이 없을 때" 보이는 화면
- **태그별 필터 UI** 1차 (UI만, 동작은 챕터 07 에서 useState 로)
- 화면이 **"DevLog 답다"** 라고 느껴지는 첫 번째 마일스톤 완성

이번 챕터는 새로운 React 개념이 거의 없습니다. 대신 **앞서 배운 도구들을 차곡차곡 쌓아 한 화면으로 완성** 하는 통합 챕터입니다. 실무에서 화면 만드는 흐름이 정확히 이런 식으로 진행됩니다.

이 챕터는 45분으로 다른 챕터보다 깁니다 (다른 챕터는 보통 30분). 큰 골격부터 만들고 디테일을 채워나가는 흐름을 따라가실 거예요.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/EmptyState.tsx` — 빈 상태 UI (신규)
- `components/TagFilter.tsx` — 태그 필터 UI (신규, 정적)
- `components/PostCard.tsx` — 디테일 업그레이드 (수정)
- `app/page.tsx` — 메인 페이지 통합 리뉴얼 (수정)

---

## 🧠 핵심 개념

### 1. "통합 챕터" 의 사고법

이번 챕터엔 새 React 개념이 거의 없습니다. 대신 **여러 작은 디테일을 차곡차곡 쌓는 연습** 입니다. 실무에서 화면 만드는 흐름이 딱 이런 식이에요.

#### 작업 흐름

```
1. 큰 골격 → (히어로 + 필터 + 카드 그리드 + 빈 상태)
2. 각 부분 디테일 채우기
3. 호버, 트랜지션 같은 마이크로 인터랙션
4. 빈 상태 / 에러 상태 같은 엣지 케이스
```

이 사고 패턴이 실무 화면 만들기의 90%를 차지합니다. 한 번에 완성하려 하지 마시고 **단계별로 쌓아 올리는 게 핵심** 입니다.

---

### 2. 빈 상태 (Empty State) 의 중요성

데이터가 0개일 때 화면이 그냥 비어 있으면 사용자는 **"망했나? 로딩 중인가?"** 라고 혼동합니다. 빈 상태도 디자인의 일부입니다.

좋은 빈 상태 UI 의 요소:
- **아이콘** — 상황을 직관적으로 표현 (📭, 🔍, ✨ 등)
- **메시지** — "아직 글이 없습니다"
- **다음 행동 안내** — "첫 번째 글을 작성해보세요"

#### 옵셔널 prop + 기본값 패턴

```tsx
function EmptyState({ message }: { message?: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-zinc-500">
        {message ?? '아직 글이 없습니다'}
      </p>
    </div>
  );
}
```

- **`message?`** — 옵셔널 prop (챕터 04 에서 다룸)
- **`message ?? '기본값'`** — Nullish Coalescing (참고자료 3번). `message` 가 `undefined` 면 기본값 사용
- **결과**: 사용자(컴포넌트 호출 측) 가 자유롭게 메시지를 바꾸되, 안 적어도 합리적 기본값이 나옴

#### 인자 자리에서 기본값 지정 (또 다른 패턴)

```tsx
function EmptyState({ message = '아직 글이 없습니다' }: { message?: string }) {
  return <p>{message}</p>;
}
```

이렇게도 동일한 효과입니다. **본 강의에선 이 패턴을 자주 사용** 합니다 — 함수 인자 자리에 기본값을 명시하는 게 더 직관적이라는 의견이 많습니다.

---

### 3. 태그 추출 트릭 — 스프레드 + Set

태그별 필터를 만들려면 먼저 **데이터에 어떤 태그들이 있는지** 알아야 합니다. 그것도 **중복 제거된** 상태로요.

#### 단계별 풀이

```tsx
const posts = [
  { tag: 'React' },
  { tag: 'Next.js' },
  { tag: 'React' },     // 중복
  { tag: 'CSS' },
];

// 1. 모든 태그를 배열로
const allTags = posts.map(p => p.tag);
// ['React', 'Next.js', 'React', 'CSS']

// 2. Set 으로 중복 제거
const uniqueSet = new Set(allTags);
// Set { 'React', 'Next.js', 'CSS' }

// 3. 다시 배열로 변환 (스프레드)
const uniqueTags = [...uniqueSet];
// ['React', 'Next.js', 'CSS']

// 4. 한 줄로 합치기
const tags = [...new Set(posts.map(p => p.tag))];
```

#### 동작 원리

- **`Set`** — JavaScript 내장 자료구조. **중복을 허용하지 않습니다**. 같은 값을 여러 번 추가해도 한 번만 저장됨
- **`[...someSet]`** — 스프레드 (참고자료 2번) 로 Set 을 배열로 펼침. `.map()`, `.filter()` 같은 배열 메서드를 쓸 수 있게 됨

이 한 줄짜리 패턴은 **외워두실 만한 자주 쓰는 트릭** 입니다.

---

### 4. 정적 UI 의 의미 — "동작은 다음 챕터에"

이번 챕터의 태그 필터 버튼들은 **시각적으로만 만들고, 클릭해도 아무 일이 일어나지 않습니다**. 의도된 것입니다.

#### 왜 이렇게 단계를 나눌까?

- **챕터 06**: 디자인과 컴포넌트 구조에 집중
- **챕터 07**: useState 를 배우고 클릭 동작을 붙임

UI 구조와 인터랙션 로직을 한꺼번에 다루면 학습 부하가 너무 커집니다. **먼저 화면이 어떻게 생겼는지 짚고, 그다음 인터랙션을 얹는** 흐름이 훨씬 자연스럽습니다.

실무에서도 디자인 시안 → 정적 마크업 → 인터랙션 순서로 작업하는 경우가 많습니다.

---

### 5. 카드 디테일 — 마이크로 인터랙션

"잘 만든 앱" 의 느낌을 만드는 건 큰 기능이 아니라 작은 디테일들입니다. 이번 챕터에서 카드에 추가할 디테일들:

- **호버 시 살짝 위로 이동** (`hover:-translate-y-0.5`) — 카드가 "들리는" 듯한 느낌
- **시안 글로우 그림자** (`hover:shadow-lg hover:shadow-cyan-500/5`) — 부드러운 빛 효과
- **이미지 호버 확대** (`group-hover:scale-105`) — 살아있는 듯한 반응
- **부드러운 트랜지션** (`transition-all duration-300`) — 모든 변화가 0.3초에 걸쳐 자연스럽게

각각은 미세하지만, 합쳐지면 **"섬세하게 만들어진 앱"** 이라는 인상을 줍니다.

---

## 🛠 실습

이번 챕터는 네 단계로 진행됩니다. 큰 골격부터 만들고 디테일을 채우는 순서입니다.

1. EmptyState 컴포넌트 생성
2. TagFilter 컴포넌트 생성 (정적 UI)
3. PostCard 디테일 업그레이드
4. app/page.tsx 메인 페이지 통합

---

### 1. `EmptyState` 컴포넌트 생성

빈 상태를 표현하는 작은 컴포넌트입니다. 챕터 후반에 글 목록이 0개일 때 표시하기 위해 미리 만들어 둡니다.

```tsx
// components/EmptyState.tsx
type EmptyStateProps = {
  icon?: string;
  message?: string;
  hint?: string;
};

export default function EmptyState({
  icon = "📭",
  message = "아직 글이 없습니다",
  hint = "첫 번째 글을 작성해보세요",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-6xl opacity-50">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-300">{message}</h3>
      <p className="text-sm text-zinc-500">{hint}</p>
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

빈 상태일 때 보여줄 안내 UI 입니다. 세 가지 정보 — 아이콘, 주 메시지, 보조 안내 — 를 받아 화면 가운데에 표시합니다.

#### 세 prop 모두 옵셔널 + 기본값

```tsx
{
  icon = "📭",
  message = "아직 글이 없습니다",
  hint = "첫 번째 글을 작성해보세요",
}: EmptyStateProps
```

세 prop 모두에 **기본값** 이 들어있습니다. 호출 측은 다음과 같이 자유롭게 사용할 수 있습니다.

```tsx
<EmptyState />                                          // 모두 기본값
<EmptyState message="검색 결과가 없습니다" />              // message 만 커스텀
<EmptyState icon="🔍" message="..." hint="..." />        // 모두 커스텀
```

**기본값 + 옵셔널 prop** 의 조합은 **재사용성이 매우 높은 컴포넌트** 를 만드는 핵심 패턴입니다. 호출 측의 자유도를 최대화하면서도, 안 적어도 합리적인 결과를 보장합니다.

#### 코드 살펴보기

```tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
```

- **`flex flex-col`** — 세로 방향 배치 (아이콘 → 메시지 → 힌트 순)
- **`items-center justify-center`** — 가로/세로 모두 가운데 정렬
- **`py-20`** — 상하 패딩 80px (충분한 여백으로 시선 집중)
- **`text-center`** — 텍스트도 가운데 정렬

```tsx
<div className="mb-4 text-6xl opacity-50">{icon}</div>
```

- **`text-6xl`** — 큰 폰트 (이모지를 크게)
- **`opacity-50`** — 50% 투명도. 너무 강조하지 않고 부드러운 인상

---

### 2. `TagFilter` 컴포넌트 생성 (정적 UI)

태그별 필터링 UI 입니다. **이번 챕터에선 클릭 동작 없이 시각적인 모양만** 만듭니다. 동작은 챕터 07 에서 useState 를 배운 뒤 붙입니다.

```tsx
// components/TagFilter.tsx
type TagFilterProps = {
  tags: string[];
  activeTag?: string;  // 옵셔널 — 없으면 'all' 취급
};

export default function TagFilter({ tags, activeTag }: TagFilterProps) {
  // 'all' 을 맨 앞에 추가해서 "전체" 옵션 만들기
  const allTags = ["all", ...tags];

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isActive = (activeTag ?? "all") === tag;
        return (
          <button
            key={tag}
            type="button"
            className={
              isActive
                ? "rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400 transition-colors"
                : "rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            }
          >
            {tag === "all" ? "전체" : tag}
          </button>
        );
      })}
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

- 부모에게서 태그 배열 (`["React", "Next.js", "CSS", ...]`) 을 받음
- 맨 앞에 **"all"** (= "전체") 옵션 추가
- 각 태그를 둥근 버튼으로 표시
- **활성화된 태그** 는 시안색으로 강조

#### 코드의 흐름

```tsx
const allTags = ["all", ...tags];
```

스프레드로 `"all"` 을 맨 앞에 붙입니다. 결과: `["all", "React", "Next.js", "CSS", "TypeScript", "DB"]`

```tsx
{allTags.map((tag) => {
  const isActive = (activeTag ?? "all") === tag;
```

- 각 태그마다 버튼을 그림
- **`activeTag ?? "all"`** — activeTag 가 undefined 면 "all" 로 간주 (Nullish Coalescing, 참고자료 3번)
- **`isActive`** 라는 boolean 변수에 결과 저장 → JSX 안에서 분기에 사용

```tsx
className={
  isActive
    ? "...활성화 스타일..."
    : "...비활성화 스타일..."
}
```

조건부 className 패턴. `isActive` 가 true 면 시안색 배지, false 면 회색 버튼.

```tsx
{tag === "all" ? "전체" : tag}
```

내부 값은 `"all"` 이지만 사용자에게 보일 때는 `"전체"` 로 번역해서 표시. UX 디테일입니다.

#### 클릭은 왜 안 붙이나?

```tsx
<button type="button" className={...}>
  {/* onClick 없음 */}
</button>
```

`onClick` 핸들러가 없습니다. **챕터 07 에서 useState 를 배운 뒤** 붙일 예정입니다. 지금은 시각적인 모양만 만드는 단계입니다.

> 💡 클릭해도 아무 일도 일어나지 않는 게 정상입니다. 챕터 07 에서 살아 움직이게 만듭니다.

---

### 3. `PostCard` 디테일 업그레이드

지금의 PostCard 도 나쁘진 않지만, 좀 더 풍부하게 — 호버 시 살짝 이동, 글로우 그림자, 읽기 시간 표시.

```tsx
// components/PostCard.tsx
type PostCardProps = {
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  readingTime?: number;  // ⭐ 신규 옵셔널 — 분 단위
  coverImage?: string;
};

export default function PostCard({
  title,
  author,
  date,
  tag,
  excerpt,
  readingTime,
  coverImage,
}: PostCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-cyan-500/5">
      {coverImage && (
        <div className="aspect-[3/1] w-full overflow-hidden bg-zinc-800">
          <img
            src={coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
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
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">{author}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
      </div>
    </article>
  );
}
```

#### 챕터 04 PostCard 와의 변화점

| 항목 | 챕터 04 | 챕터 06 |
|---|---|---|
| 호버 효과 | 보더/배경 색만 변경 | + 살짝 위로 이동 + 글로우 그림자 |
| `readingTime` prop | 없음 | 옵셔널로 추가 |
| 이미지 호버 확대 속도 | 기본 | 500ms 로 부드럽게 |
| 메타 영역 | `gap-2 text-xs` | + 작성자 글자색 살짝 강조 |

#### 새 클래스 분석

```tsx
className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-cyan-500/5"
```

새로 추가된 것들:

- **`transition-all duration-300`** — 모든 속성 변화에 300ms 트랜지션. 챕터 03 의 `transition-colors` (색만 트랜지션) 보다 넓은 범위
- **`hover:-translate-y-0.5`** — 호버 시 Y축으로 -2px 이동 (위로 살짝). 카드가 "들리는" 느낌
- **`hover:shadow-lg hover:shadow-cyan-500/5`** — 호버 시 큰 그림자 + 시안색 5% 투명도 그림자. 부드러운 글로우 효과

```tsx
{readingTime !== undefined && (
  <span className="text-xs text-zinc-500">
    · {readingTime}분 읽기
  </span>
)}
```

**왜 `readingTime !== undefined` 인가?**

옵셔널 prop 의 안전한 체크 방법입니다.

```tsx
{readingTime && <span>...</span>}      // ❌ readingTime 이 0 이면 표시 안 됨
{readingTime !== undefined && <span>}  // ✅ 0 이어도 표시됨
```

`readingTime` 이 `0` 일 때 `{readingTime && ...}` 패턴은 `0` 을 falsy 로 평가해서 안 표시됩니다 (챕터 02 의 함정). 명시적 비교가 안전합니다.

#### `transition-all` 의 비용

`transition-all` 은 **모든 속성 변화에 트랜지션을 적용** 합니다. 편하지만 성능에 약간 부담이 됩니다. 정말 신경 쓰일 정도의 컴포넌트라면 `transition-[transform,box-shadow,border-color,background-color]` 처럼 명시적으로 지정하는 게 좋습니다.

본 강의에선 단순함을 위해 `transition-all` 사용합니다.

---

### 4. `app/page.tsx` 메인 페이지 통합

이제 모든 걸 합쳐서 메인 페이지를 완성합니다. 히어로 섹션 추가 + 데이터 6개로 확장 + 필터 + 빈 상태 분기.

```tsx
// app/page.tsx
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import TagFilter from "@/components/TagFilter";
import EmptyState from "@/components/EmptyState";

const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt:
      "의존성 배열을 잘못 다루면 무한 루프가 납니다. 가장 흔한 함정 5가지와 해결법을 정리했습니다.",
    readingTime: 7,
    coverImage: "https://picsum.photos/seed/react/900/300",
  },
  {
    id: 2,
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt:
      "API 라우트 없이 서버 함수를 호출하는 새로운 방식. 폼 제출과 데이터 변경을 한 번에.",
    readingTime: 12,
  },
  {
    id: 3,
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt:
      "제네릭은 타입을 변수처럼 다루는 도구입니다. 처음엔 어려워 보여도 패턴은 단순합니다.",
    readingTime: 9,
  },
  {
    id: 4,
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt:
      "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법. 자주 쓰는 5가지 패턴을 모았습니다.",
    readingTime: 5,
    coverImage: "https://picsum.photos/seed/css/900/300",
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
    excerpt:
      "로딩 UI를 선언적으로 처리하는 Suspense. 데이터 페칭과 함께 쓰는 진짜 활용법.",
    readingTime: 8,
  },
];

// 태그 목록 추출 (중복 제거)
const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
  // 챕터 06 에선 정적 — 챕터 07 에서 useState 로 동적 전환
  const filteredPosts = posts;

  return (
    <Container>
      {/* 히어로 섹션 */}
      <section className="border-b border-zinc-900 py-16">
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
      </section>

      {/* 글 목록 섹션 */}
      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">최근 글</h2>
            <p className="mt-1 text-sm text-zinc-500">
              총 {filteredPosts.length}개의 글
            </p>
          </div>
        </div>

        {/* 태그 필터 (정적 UI) */}
        <div className="mb-8">
          <TagFilter tags={tags} />
        </div>

        {/* 카드 그리드 또는 빈 상태 */}
        {filteredPosts.length === 0 ? (
          <EmptyState />
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
```

#### 코드의 전체 구조

```
Container
├── <section> 히어로 섹션
│   ├── 작은 배지 ("개발자 학습 기록 · DevLog")
│   ├── 큰 헤딩 (그라데이션 텍스트 포함)
│   └── 설명 문단
└── <section> 글 목록 섹션
    ├── 섹션 헤더 (제목 + 총 개수)
    ├── 태그 필터
    └── 카드 그리드 또는 빈 상태 (조건부)
```

#### 새로운 시각 요소 살펴보기

**① 작은 배지 (히어로 상단)**

```tsx
<div className="mb-3 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-400">
  개발자 학습 기록 · DevLog
</div>
```

- **`rounded-full`** — 알약 모양 (완전 둥근 모서리)
- **`border-cyan-500/20`** — 시안색 20% 보더 (매우 흐릿)
- **`bg-cyan-500/5`** — 시안색 5% 배경 (거의 안 보일 정도)
- 매우 은은한 강조로 "이 페이지는 DevLog 입니다" 라는 정체성 표현

**② 그라데이션 텍스트**

```tsx
<span className="bg-gradient-to-r from-cyan-400 to-lime-300 bg-clip-text text-transparent">
  매일 기록합니다.
</span>
```

요즘 가장 트렌디한 텍스트 효과입니다.

- **`bg-gradient-to-r from-cyan-400 to-lime-300`** — 왼쪽에서 오른쪽으로 시안→라임 그라데이션을 텍스트 배경에 적용
- **`bg-clip-text`** — 배경을 텍스트 모양으로 자름 (텍스트 영역에만 그라데이션이 보임)
- **`text-transparent`** — 글자 자체는 투명하게 (그래야 배경이 보임)

이 세 클래스의 조합이 **"그라데이션 텍스트"** 의 표준 패턴입니다. 다른 곳에서도 재사용 가능합니다.

**③ "총 N개의 글" 카운트**

```tsx
<p className="mt-1 text-sm text-zinc-500">
  총 {filteredPosts.length}개의 글
</p>
```

작은 디테일이지만 사용자가 데이터 규모를 즉시 파악할 수 있게 합니다.

**④ 빈 상태 분기**

```tsx
{filteredPosts.length === 0 ? (
  <EmptyState />
) : (
  <div className="grid gap-4">
    {filteredPosts.map((post) => (
      <PostCard key={post.id} {...post} />
    ))}
  </div>
)}
```

챕터 02 에서 배운 삼항 연산자 + 챕터 04 에서 만든 옵셔널 prop EmptyState 가 만나는 지점입니다. **여러 개념이 자연스럽게 결합** 되고 있죠.

#### `const filteredPosts = posts` 의 의미

```tsx
// 챕터 06 에선 정적 — 챕터 07 에서 useState 로 동적 전환
const filteredPosts = posts;
```

지금은 그냥 `posts` 를 그대로 사용합니다. 변수명만 `filteredPosts` 입니다.

**의도**: 챕터 07 에서 이 변수의 정의 부분이 다음과 같이 바뀔 예정입니다.

```tsx
// 챕터 07 의 모습 (미리보기)
const filteredPosts =
  activeTag === "all"
    ? posts
    : posts.filter((p) => p.tag === activeTag);
```

지금부터 변수명을 `filteredPosts` 로 두면, 챕터 07 에서 **변수 정의 한 줄만 바꾸면 모든 게 작동** 합니다. 미래의 변화를 미리 고려한 명명입니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 확인해주세요:

- ✨ **히어로 섹션** — 시안→라임 그라데이션 헤드라인
- 🏷 **태그 필터** — 6개 버튼 (전체 + tag 별) 표시. 클릭해도 아무 일 안 일어남 (정상)
- 📰 **글 6개** — 카드 그리드로 표시
- **호버 시 카드가 살짝 위로 + 시안 글로우** ⭐
- 1번, 4번 글에만 **커버 이미지**
- 모든 글에 **"N분 읽기"** 표시
- 우측 상단에 "총 6개의 글" 카운트

#### 빈 상태 테스트 (선택 사항)

`posts` 배열을 잠깐 `[]` 로 비우고 새로고침해보세요. **EmptyState 컴포넌트가 가운데에** 표시됩니다. 확인 후 원래대로 6개 데이터를 복원해주세요.

---

## ❓ 흔한 실수

### Q1. EmptyState 의 기본값이 안 적용됨
인자 자리 기본값 (`message = "..."`) 은 **호출 측에서 `undefined` 를 넘기거나 prop 자체를 안 적었을 때** 만 적용됩니다. `null` 이나 빈 문자열 (`""`) 을 넘기면 그 값이 그대로 사용됩니다.

### Q2. `[...new Set(...)]` 이 작동하지 않음
배열 메서드 (`.map()`, `.filter()`) 의 결과가 배열이 아닌 경우 (`forEach` 등) 였을 가능성이 있습니다. `.map()` 은 반드시 새 배열을 반환합니다.

### Q3. 태그 버튼 클릭해도 변화 없음
정상입니다. 챕터 07 에서 동작을 붙입니다.

### Q4. `readingTime: 0` 인 글에 "0분 읽기" 가 안 표시됨
`{readingTime && ...}` 패턴을 쓰셨을 가능성이 큽니다. `{readingTime !== undefined && ...}` 로 명시적 체크하세요.

### Q5. 그라데이션 텍스트가 안 보이고 검은색으로 표시
`text-transparent` 가 누락되었거나, `bg-clip-text` 가 누락된 경우입니다. 세 클래스 (`bg-gradient-to-r ...`, `bg-clip-text`, `text-transparent`) 가 모두 필요합니다.

### Q6. 카드 호버 시 그림자가 안 보임
`transition-all` 이 빠졌거나, `hover:shadow-cyan-500/5` 의 투명도가 너무 낮아 잘 안 보일 수 있습니다. 조명이 밝은 환경에선 미세하게 보이는 정도가 정상입니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] EmptyState 처럼 **모든 prop 이 옵셔널 + 기본값** 인 컴포넌트의 가치를 안다
- [ ] `[...new Set(arr)]` 패턴으로 중복 제거하는 방법을 안다
- [ ] `transition-all duration-300` + `hover:-translate-y-0.5` 같은 마이크로 인터랙션 클래스를 안다
- [ ] 그라데이션 텍스트의 세 클래스 (`bg-gradient-to-r`, `bg-clip-text`, `text-transparent`) 조합을 안다
- [ ] `readingTime !== undefined` 와 `readingTime` (truthy 체크) 의 차이를 안다
- [ ] http://localhost:3000 에서 히어로 + 필터 + 카드 6개 + 호버 효과가 모두 잘 보인다
- [ ] `posts = []` 로 비웠을 때 EmptyState 가 표시되는 것을 확인했다

---

## ✅ 다음 챕터 예고

> **챕터 07: useState + 얕은 복사 / 깊은 복사**
> 점심 직후 시작입니다. 지금까지 만든 **정적 화면을 살아 움직이게** 만듭니다. React 의 핵심 훅 `useState` 를 배우고, 태그 필터에 진짜 클릭 동작을 붙입니다. 그리고 React 초보가 가장 많이 헤매는 함정 — **얕은 복사 vs 깊은 복사** — 도 함께 다룹니다.
