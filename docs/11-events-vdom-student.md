# 챕터 11: 이벤트 핸들링 + 가상 DOM + key 의 중요성

> **시간**: 약 30분 · **블록**: Day 1 / Block 3 (Day 1 마지막)

---

## 🎯 이 챕터에서 다룰 내용

- React **합성 이벤트(SyntheticEvent)** — 브라우저 네이티브 이벤트를 React 가 감싼 것
- 이벤트 **버블링** 과 `stopPropagation` / `preventDefault`
- **가상 DOM(Virtual DOM)** 의 개념과 reconciliation 흐름
- **`key` prop 의 중요성** — 잘못 주면 생기는 버그 직접 체험 ⭐
- 본 프로젝트에 **글 정렬 기능** 추가 (최신순/오래된순/읽기시간순)

Day 1 의 마지막 챕터입니다. 세 가지를 묶어서 다룰 텐데, 사실 이게 **React 가 화면을 그리는 방식의 핵심 메커니즘** 입니다. 특히 key 는 잘못 주면 진짜 골치 아픈 버그가 나는 부분이에요. **직접 버그를 만들어보고 고쳐보면서** 왜 중요한지 체감하시게 됩니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/SortSelect.tsx` — 정렬 옵션 선택 컴포넌트 (신규)
- `app/page.tsx` — 정렬 state 추가 + key 버그 시연 + 수정

---

## 🧠 핵심 개념

### 1. React 합성 이벤트 (SyntheticEvent)

지금까지 `onClick`, `onChange` 같은 이벤트 핸들러를 자연스럽게 써왔습니다. 사실 이것들은 **브라우저 네이티브 이벤트가 아니라, React 가 한 번 감싼 객체** 입니다. 이걸 **합성 이벤트(SyntheticEvent)** 라고 부릅니다.

#### 합성 이벤트의 모양

```tsx
function MyButton() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    //                  ↑ 이게 합성 이벤트 객체
    console.log(e.target);         // 클릭된 요소
    console.log(e.currentTarget);  // 핸들러가 붙은 요소
    e.preventDefault();            // 기본 동작 막기
    e.stopPropagation();           // 이벤트 전파 막기
  };

  return <button onClick={handleClick}>클릭</button>;
}
```

겉보기엔 일반 DOM 이벤트와 똑같이 동작합니다 — `preventDefault()`, `stopPropagation()`, `target`, `currentTarget` 등 모두 사용 가능. 하지만 내부적으론 React 가 만든 wrapper 객체입니다.

#### 왜 React 가 굳이 감쌌나?

세 가지 이유입니다.

**① 브라우저 호환성** — 옛날 IE 와 모던 브라우저의 이벤트 API 차이를 React 가 흡수해서 어느 브라우저에서든 같은 코드가 동작하게 만듭니다.

**② 이벤트 위임 (Event Delegation) — 성능** — React 는 컴포넌트마다 이벤트 리스너를 직접 붙이지 않습니다. **앱의 root DOM 한 곳에만** 리스너를 두고, 거기서 모든 이벤트를 잡습니다. 그러고 나서 "이 이벤트가 어느 컴포넌트의 핸들러를 호출할지" React 가 추적합니다. 버튼이 1000개여도 실제 DOM 리스너는 단 하나라 메모리 효율이 좋습니다.

**③ 일관된 동작 보장** — 예를 들어 React 의 `onChange` 는 HTML 의 `onchange` 와 다르게 **매 키 입력마다** 발생합니다 (HTML 은 포커스 잃을 때). React 가 더 직관적인 동작으로 정규화한 예시입니다.

#### 자주 쓰는 TypeScript 이벤트 타입

| 이벤트 | 타입 |
|---|---|
| 클릭 | `React.MouseEvent<HTMLButtonElement>` |
| 입력 변경 | `React.ChangeEvent<HTMLInputElement>` |
| select 변경 | `React.ChangeEvent<HTMLSelectElement>` |
| 폼 제출 | `React.FormEvent<HTMLFormElement>` |
| 키보드 | `React.KeyboardEvent<HTMLInputElement>` |
| 포커스 | `React.FocusEvent<HTMLInputElement>` |

> 💡 외울 필요 없습니다. **VSCode 가 자동완성** 해줍니다. 핸들러 자리에 화살표 함수를 쓰면 타입을 추론해 보여줍니다.

---

### 2. 이벤트 버블링 — 자식 클릭이 부모도 클릭한 셈

브라우저의 표준 동작입니다. DOM 이벤트는 **클릭된 요소에서 시작해서 부모 → 조상 방향으로 거품처럼 올라갑니다**. 이게 "버블링" 이라는 이름의 유래입니다.

#### 시각화

```
        ┌─ <article>           ← 3단계
        │   └─ <div>           ← 2단계  
        │       └─ <button>    ← 1단계 (클릭됨)
        │
이벤트   ↑ 클릭 시 이렇게 위로 올라감
```

`<button>` 을 클릭하면:
1. 먼저 `<button>` 의 onClick 실행
2. 그다음 `<div>` 의 onClick 실행
3. 그다음 `<article>` 의 onClick 실행

**중간에 핸들러가 있는 요소들이 모두 차례로 실행** 됩니다.

#### 우리 DevLog 의 PostCard 가 정확히 이 상황

본 프로젝트의 PostCard 안에는 LikeButton 이 있고, 다음 챕터(13) 부터는 PostCard 전체가 Link 로 감싸집니다. 사용자가 LikeButton 을 클릭했을 때:

- **버블링이 일어나면**: LikeButton 클릭 + 상위 Link 클릭 → **페이지가 이동해버림** 😱
- **버블링을 막으면**: LikeButton 만 동작 ✅

그래서 `LikeButton` 의 handleClick 에 이 두 줄이 들어있습니다:

```tsx
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();    // ⭐ Link 의 페이지 이동 막기
  e.stopPropagation();   // ⭐ 부모로 이벤트 버블링 막기
  // 좋아요 토글 로직
};
```

#### `preventDefault` vs `stopPropagation`

비슷해 보이지만 완전히 다른 일을 합니다.

| 메서드 | 막는 것 |
|---|---|
| `preventDefault()` | 브라우저의 **기본 동작** (폼 제출 시 새로고침, Link 의 페이지 이동, 우클릭 메뉴 등) |
| `stopPropagation()` | **부모로의 이벤트 전파** (부모 onClick 실행을 막음) |

LikeButton 에 두 개 다 쓴 이유는:
- `preventDefault`: 만약 LikeButton 이 `<Link>` 안에 들어있으면, 클릭 시 페이지 이동이 일어남 → 이걸 막기
- `stopPropagation`: 부모 요소들 중 어느 곳에 onClick 이 있으면 그것도 실행됨 → 이걸 막기

---

### 3. 가상 DOM (Virtual DOM) — React 의 비밀

React 가 빠른 이유 중 하나가 가상 DOM 입니다. 한 번 짚고 가겠습니다.

#### 직접 DOM 조작 vs 가상 DOM

```
┌─────────────────────────────────────────┐
│ jQuery 시대 — 직접 DOM 조작              │
├─────────────────────────────────────────┤
│ $('#count').text(newValue);             │
│   ↓                                     │
│ 브라우저가 즉시 DOM 업데이트 + 리렌더    │
│   ↓                                     │
│ 매번 직접 호출 — 비싼 작업              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ React 시대 — 가상 DOM                   │
├─────────────────────────────────────────┤
│ setState 호출                           │
│   ↓                                     │
│ React: 새 가상 DOM 트리 생성            │
│   ↓                                     │
│ React: 이전 가상 DOM 과 비교 (diff)     │
│   ↓                                     │
│ React: 변한 부분만 실제 DOM 에 적용     │
│   ↓                                     │
│ 브라우저는 최소한의 작업만 수행         │
└─────────────────────────────────────────┘
```

#### 핵심 메시지

- **가상 DOM 자체가 빠른 게 아닙니다** — JS 객체일 뿐
- **빠른 이유는 "변한 부분만 실제 DOM 에 반영"** 하기 때문입니다
- 이 비교 과정을 **reconciliation(재조정)** 이라고 부릅니다
- **key prop 은 reconciliation 의 핵심 힌트** — 다음 섹션의 주제

> 💡 **개발자가 신경 쓸 일은 거의 없습니다**. 단, **key prop 만은 예외** — 잘못 주면 reconciliation 이 망가집니다.

---

### 4. key prop — 가장 중요한 한 가지

이번 챕터의 메인 이벤트입니다. key prop 을 왜 줘야 하는지, 잘못 주면 어떤 버그가 나는지 직접 보시게 됩니다.

#### React 가 리스트를 어떻게 비교하나?

```
[A] [B] [C]   ← 이전 렌더
 ↓   ↓   ↓
[X] [B] [C]   ← 새 렌더
```

질문: A 가 X 로 **바뀐** 건가, 아니면 A 가 **사라지고** X 가 **추가된** 건가?

**key 가 없으면**: React 는 **순서대로** 비교. 위 예에선 "0번째가 A→X 로 바뀌었다" 로 판단.

**key 가 있으면**: React 는 **key 로** 비교. key 가 같으면 "같은 컴포넌트인데 props 만 바뀐 것", key 가 다르면 "완전히 다른 컴포넌트" 로 판단.

#### 좋은 key vs 나쁜 key

```tsx
// ✅ 가장 좋음 — 데이터의 고유 ID
{posts.map((post) => <PostCard key={post.id} {...post} />)}

// ⚠️ 정적 리스트만 OK — 정렬/추가/삭제 시 버그 가능성
{posts.map((post, index) => <PostCard key={index} {...post} />)}

// ❌ 절대 안 됨 — 매 렌더마다 다른 값
{posts.map((post) => <PostCard key={Math.random()} {...post} />)}
```

이번 챕터의 실습에서 `key={index}` 의 함정을 직접 만나시게 됩니다.

---

## 🛠 실습

세 단계로 진행됩니다.

1. SortSelect 컴포넌트 생성 (TS 이벤트 타입 자연스러운 등장)
2. 메인 페이지에 정렬 통합 — **의도적으로 `key={index}` 버그 만들기** ⚠️
3. key 를 `post.id` 로 수정 — 버그 해결

이 흐름을 따라가시면 "왜 key 가 중요한지" 절대 잊지 않으실 겁니다.

---

### 1. `SortSelect` 컴포넌트 생성

정렬 옵션 select 박스입니다. 합성 이벤트와 TypeScript 타입의 자연스러운 등장 자리예요.

```tsx
// components/SortSelect.tsx
"use client";

import type { ChangeEvent } from "react";

export type SortOption = "newest" | "oldest" | "shortest" | "longest";

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

const options: { value: SortOption; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "shortest", label: "읽기 시간 짧은 순" },
  { value: "longest", label: "읽기 시간 긴 순" },
];

export default function SortSelect({ value, onChange }: SortSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as SortOption);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 transition-colors focus:border-cyan-400/40 focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-zinc-900">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

#### 이 컴포넌트가 하는 일

정렬 옵션 4개를 보여주는 select 박스입니다. 부모로부터 현재 정렬값(`value`)과 변경 콜백(`onChange`)을 받습니다. 챕터 10 의 `SearchInput` 과 같은 **제어 컴포넌트** 패턴입니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

`onChange` 이벤트 핸들러를 쓰기 때문에 클라이언트 컴포넌트 필요. 챕터 07 에서 다룬 패턴.

```tsx
export type SortOption = "newest" | "oldest" | "shortest" | "longest";
```

**리터럴 유니온 타입** (참고자료 8번). 네 가지 문자열 중 하나만 받습니다. 이런 식으로 정의하면:
- `setSortBy("invalid")` 같은 실수가 컴파일 타임에 차단됨
- IDE 가 4가지 옵션을 자동완성으로 제안

```tsx
export type SortOption = ...
```

`export` 를 붙인 이유는 부모(`app/page.tsx`) 가 같은 타입을 useState 의 제네릭에 쓰기 위해서입니다. 챕터 04 에서 다룬 타입 재사용 패턴.

```tsx
const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
  onChange(e.target.value as SortOption);
};
```

이번 챕터의 핵심 — **합성 이벤트의 TypeScript 타입화**.

- **`ChangeEvent<HTMLSelectElement>`** — select 의 값 변경은 input 의 변경과 같은 카테고리. React 가 `ChangeEvent` 로 감싸줍니다
- **제네릭 `<HTMLSelectElement>`** — `e.target` 의 타입이 정확히 `HTMLSelectElement` 가 되어야 `e.target.value` 가 string 으로 추론됨
- **`as SortOption`** — `e.target.value` 의 타입은 string. 우리 onChange 는 SortOption 만 받음. 실제 select 의 option 들이 SortOption 값들로만 구성되어 있으니 안전한 타입 단언

```tsx
{options.map((opt) => (
  <option key={opt.value} value={opt.value} className="bg-zinc-900">
    {opt.label}
  </option>
))}
```

리스트 렌더링 + key. SortOption 의 4개 값이 모두 고유한 문자열이라 자연스럽게 key 로 사용. **이게 좋은 key 의 예** — 데이터 자체에 고유성이 있을 때 그것을 그대로 사용.

---

### 2. 메인 페이지에 정렬 통합 — 의도적 `key={index}` 버그 ⚠️

이 단계의 코드에는 **의도적인 버그** 가 들어갑니다. 다음 단계(3) 에서 수정합니다. 일부러 버그를 만들어 보면서 key 의 중요성을 직접 체감하는 게 목적입니다.

```tsx
// app/page.tsx
"use client";

import { useMemo, useState } from "react";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import StudyTimer from "@/components/StudyTimer";
import TagFilter from "@/components/TagFilter";
import EmptyState from "@/components/EmptyState";
import SearchInput from "@/components/SearchInput";
import SortSelect, { type SortOption } from "@/components/SortSelect";  // ⭐
import { useDebounce } from "@/hooks/useDebounce";

const posts = [
  // ... (기존 6개 글 그대로)
];

const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce(query, 300);
  const [sortBy, setSortBy] = useState<SortOption>("newest");  // ⭐ 정렬 state

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

    // ⭐ 정렬 — 스프레드로 복사 후 sort (원본 변경 방지)
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
  }, [activeTag, debouncedQuery, sortBy]);

  return (
    <Container>
      {/* 히어로 + 타이머 (변경 없음) */}
      {/* ... 챕터 08 과 동일 ... */}

      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">최근 글</h2>
            <p className="mt-1 text-sm text-zinc-500">
              총 {filteredPosts.length}개의 글
            </p>
          </div>
          {/* ⭐ 정렬 select 추가 */}
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>

        {/* 검색 (챕터 10) */}
        <div className="mb-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="제목이나 본문으로 검색..."
          />
        </div>

        {/* 태그 필터 (챕터 07) */}
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
            {filteredPosts.map((post, index) => (
              // ⚠️ 의도적 버그: key 를 index 로 (다음 단계에서 수정)
              <PostCard key={index} {...post} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
```

#### 변화점 짚기

- **`useState<SortOption>("newest")`** 추가 — 현재 정렬 옵션 관리
- **useMemo 의존성 배열** 에 `sortBy` 추가 (의존성 추적 정확성)
- **`[...result].sort(...)`** — 정렬 로직 (스프레드로 복사 후)
- **`<SortSelect />`** 컴포넌트 사용 (글 목록 헤더 우측)
- **`key={index}`** — ⚠️ 의도적인 버그 부분

#### `[...result].sort(...)` — 불변성 패턴

```tsx
result = [...result].sort((a, b) => { ... });
```

`Array.prototype.sort` 는 **원본 배열을 변경** 합니다 (mutation). React state 의 불변성 규칙을 어기는 동작이에요.

```tsx
// ❌ 원본 변경 — 다음 렌더에서 예측 불가능
result.sort((a, b) => ...);

// ✅ 스프레드로 복사 후 정렬
[...result].sort((a, b) => ...);
```

챕터 07 에서 배운 **불변성 패턴** (참고자료 2번 스프레드) 의 실전 응용입니다. `result` 가 결국 `posts` 의 참조를 가질 수도 있는데, 직접 sort 하면 원본 `posts` 가 변경됨 → 다음 렌더에서 깨진 결과.

#### `localeCompare` — 문자열 비교

```tsx
return b.date.localeCompare(a.date);
```

문자열을 비교해서 정렬 순서를 결정합니다. `"2025-04-30".localeCompare("2025-04-27")` 는 양수 (전자가 후자보다 큼).

날짜 문자열이 `YYYY-MM-DD` 형식이라 단순 문자열 비교만으로도 시간순 정렬이 됩니다.

#### 버그 시연 — 직접 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 차례로 해보세요.

1. **첫 글에 좋아요 클릭** (♥ + 카운트 1)
2. 우상단 정렬 옵션을 **"오래된순"** 으로 변경
3. **❗ 좋아요가 다른 글에 가있음** (배열의 0번째 위치엔 그대로지만, 그 위치에 있는 글이 바뀜)
4. 정렬을 다시 **"최신순"** 으로
5. **❗ 좋아요가 또 다른 글로 이동**

**이게 `key={index}` 의 함정** 입니다.

React 입장에서 보면, 배열의 0번째 1번째 2번째 위치는 그대로인데 **각 위치에 들어가는 데이터만 바뀐 것** 처럼 보입니다. 그래서 React 는 PostCard 컴포넌트를 새로 만들지 않고, **기존 컴포넌트의 props 만 갈아끼웁니다**.

그 결과:
- 컴포넌트는 **위치 기반으로 식별** 됨 (key 가 인덱스니까)
- 컴포넌트 인스턴스가 그대로면 **그 안의 useState 도 그대로 유지**
- LikeButton 의 `isLiked`, `likes` state 가 **위치에 묶임**
- 사용자는 첫 번째 글에 좋아요를 눌렀는데, 정렬을 바꾸니 첫 번째 위치엔 다른 글이 와있는데도 그 위치의 좋아요는 유지됨

직접 보시면 "어, 이거 진짜 이상한데?" 하실 거예요. 다음 단계에서 한 줄 수정으로 고칩니다.

---

### 3. `key={post.id}` 로 버그 수정

이제 한 줄만 고치면 됩니다. `key={index}` 를 `key={post.id}` 로 바꾸세요.

```tsx
// 변경 전 (버그)
<div className="grid gap-4">
  {filteredPosts.map((post, index) => (
    <PostCard key={index} {...post} />
  ))}
</div>

// 변경 후 (수정)
<div className="grid gap-4">
  {filteredPosts.map((post) => (
    <PostCard key={post.id} {...post} />
  ))}
</div>
```

#### 변화점

- `(post, index)` → `(post)` — index 변수 더 이상 안 필요
- `key={index}` → `key={post.id}`

#### 수정 후 동작 확인

```bash
npm run dev
```

1. 첫 글에 좋아요 클릭 → ♥
2. 정렬을 바꿈 → **좋아요가 그 글을 따라감** ✅
3. 다른 정렬로 바꿔도 동일하게 따라감 ✅

이제 좋아요가 글을 따라다닙니다. React 가 "id 가 같으면 같은 글" 로 추적하기 때문에, 위치는 바뀌어도 PostCard 인스턴스는 동일하게 유지됩니다. 그 결과 LikeButton 의 state 도 같이 따라가요.

#### 핵심 통찰 — useState 와 key 의 관계

이 한 줄 변경이 어떤 일을 했는지 깊게 짚어봅니다.

```
정렬 전:  [post-1] [post-2] [post-3]   key: 1, 2, 3
정렬 후:  [post-3] [post-1] [post-2]   key: 3, 1, 2

React 의 reconciliation:
  "key=1 인 컴포넌트가 0번 → 1번 위치로 이동"
  "key=2 인 컴포넌트가 1번 → 2번 위치로 이동"
  "key=3 인 컴포넌트가 2번 → 0번 위치로 이동"

→ DOM 노드 순서만 재배치, 컴포넌트는 재사용
→ 각 컴포넌트의 useState 도 그대로 따라감 ✅
```

**"컴포넌트 인스턴스 = state 를 보관하는 통"** 이라고 생각하시면 명확합니다.

- useState 의 값은 **컴포넌트 인스턴스에 묶여** 있음
- 컴포넌트 인스턴스는 **key 로 식별** 됨
- **따라서 useState 가 어떤 데이터에 묶일지는 key 가 결정**

잘못된 key (예: index) 는 "이 통(state)이 어떤 데이터에 묶여야 하는지" 를 React 에게 잘못 알려주는 것. 결과적으로 state 가 엉뚱한 데이터에 들러붙습니다.

> 💡 **챕터 07 의 LikeButton 이 이 시점에 진짜 의미를 가집니다.** 챕터 07 단독으로는 좋아요 버튼이 잘 동작했어요 (정렬이 없으니까). 챕터 11 의 정렬과 만났을 때 비로소 key 의 중요성이 드러납니다. **이게 React 컴포넌트 설계의 디테일** — 단독으로 잘 동작해도, 다른 기능과 만나면 새로운 요구사항이 드러납니다.

#### 한 줄 변경의 깊은 의미

```tsx
- {filteredPosts.map((post, index) => (
-   <PostCard key={index} {...post} />
+ {filteredPosts.map((post) => (
+   <PostCard key={post.id} {...post} />
```

- **변경된 글자**: 약 20자
- **변경된 의미**: React 가 컴포넌트 인스턴스를 식별하는 기준
- **결과**: 모든 자식 컴포넌트의 useState/useEffect/useRef 가 정확한 데이터에 묶임

이 한 줄이 챕터 02~10 에서 배운 모든 훅의 동작 정확성을 보장합니다.

---

### 동작 확인 — Day 1 마무리

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

- 우상단에 **정렬 select** 표시
- 4가지 정렬 옵션 모두 동작
- **좋아요 누른 글이 정렬 바뀌어도 따라감** ✅
- 검색 + 태그 필터 + 정렬 **모두 동시 적용** 가능

여기까지 확인되면 Day 1 의 모든 목표가 달성된 것입니다.

#### Day 1 정리

지금 노트북에서 동작하는 것들:
- ✨ 글 목록 + 카드 호버 효과
- 🔍 검색 (디바운스 적용)
- 🏷 태그 필터
- ↕ 정렬 (4가지 옵션)
- ♥ 좋아요 버튼 (정렬 시 글을 따라감)
- ⏱ 학습 타이머 (Pomodoro)

처음 시작할 때 막막했을 텐데, 이만큼 만들어내셨습니다. 정적 화면 → 인터랙티브 화면 → React 핵심 메커니즘까지 — 챕터 02~11 의 흐름이 자연스럽게 누적되었습니다.

**Day 2 부터는** Next.js 의 진짜 차별점들을 다룹니다. Server Components, Server Actions, 동적 라우팅, DB 연결, 인증, 그리고 잔디밭 대시보드까지.

---

## ❓ 흔한 실수

### Q1. `key={Math.random()}` 으로 매 렌더 다른 key
매 렌더마다 React 가 "완전히 새 컴포넌트" 로 인식 → 컴포넌트가 사라졌다 새로 만들어짐 → **모든 state 잃음 + 입력 포커스 잃음 + 성능 저하**. 절대 금지.

### Q2. `key` 를 PostCard 안쪽에 줌
```tsx
// ❌ 안쪽 div 에 key
<PostCard {...post}>
  <div key={post.id}>...</div>
</PostCard>

// ✅ map 의 직속 자식에 key
<PostCard key={post.id} {...post} />
```
key 는 **map 의 결과 배열의 직접 요소** 에 줘야 합니다.

### Q3. 정렬 시 `posts.sort()` 직접 호출 (원본 변경)
```tsx
// ❌ 원본 mutation
posts.sort((a, b) => ...);

// ✅ 복사 후 정렬
[...posts].sort((a, b) => ...);
```
챕터 07 의 불변성 규칙. sort 는 원본을 변경하는 메서드라 반드시 복사 후 사용.

### Q4. 이벤트 핸들러에 함수 호출 결과를 직접 전달
```tsx
// ❌ 렌더 시점에 즉시 호출됨 → 무한 렌더링 또는 의도와 다른 동작
<button onClick={setActiveTag("all")}>

// ✅ 함수 자체를 전달
<button onClick={() => setActiveTag("all")}>
```
챕터 07 에서 다룬 onClick 함정.

### Q5. 합성 이벤트의 `e.target` 와 `e.currentTarget` 혼동
- **`e.target`**: 실제로 이벤트가 발생한 요소 (자식일 수 있음)
- **`e.currentTarget`**: 핸들러가 붙은 요소 (항상 onClick 단 그 요소)
- 보통 **`e.currentTarget`** 이 안전합니다.

### Q6. `stopPropagation` 안 쓰고 자식 클릭이 부모로 전파됨
카드형 UI 안에 버튼이 있을 때 자주 발생합니다. 자식 버튼의 핸들러에 `e.stopPropagation()` 추가하면 해결.

### Q7. `preventDefault` vs `stopPropagation` 혼동
- **`preventDefault`**: 브라우저 기본 동작 막기 (폼 새로고침, Link 이동 등)
- **`stopPropagation`**: 부모로 이벤트 전파 막기
- 둘은 완전히 다른 일을 합니다. 헷갈리시면 위 "이벤트 버블링" 섹션 다시 보세요.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] React 합성 이벤트가 무엇인지, 왜 존재하는지 안다 (이벤트 위임 등)
- [ ] 이벤트 버블링의 동작 (자식 → 부모 방향) 을 안다
- [ ] `preventDefault` 와 `stopPropagation` 의 차이를 구분할 수 있다
- [ ] 가상 DOM 의 동작 원리 (reconciliation) 를 안다
- [ ] **key prop 이 React 의 컴포넌트 인스턴스 식별 기준** 임을 안다
- [ ] `key={index}` 의 버그를 직접 체험했다 (좋아요가 엉뚱한 글에 남음)
- [ ] `key={post.id}` 로 수정 후 정상 동작 확인했다
- [ ] **useState 와 key 의 관계** — "state 는 컴포넌트 인스턴스에 묶이고, 인스턴스는 key 로 식별된다" 를 설명할 수 있다

---

## ✅ 다음 챕터 예고

> **챕터 12: Server vs Client Components** (Day 2 시작)
> 챕터 07 에서 살짝 만났던 `"use client"` — 그 정체를 본격적으로 다룹니다. Next.js App Router 의 진짜 핵심 설계 결정입니다. 현재 페이지 전체가 클라이언트로 되어 있는 걸, **인터랙션 부분만 분리** 해서 메인 페이지를 다시 Server Component 로 되돌립니다.
