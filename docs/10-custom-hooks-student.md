# 챕터 10: 커스텀 훅 (useDebounce + useLocalStorage)

> **시간**: 약 30분 · **블록**: Day 1 / Block 3

---

## 🎯 이 챕터에서 다룰 내용

- **커스텀 훅** 의 개념 — 함수 컴포넌트의 로직을 재사용 가능한 함수로 추출
- 커스텀 훅 명명 규칙 (`use` 접두사) 의 의미
- **`useDebounce`** — 검색창 입력에 디바운스를 입히는 훅
- **`useLocalStorage`** — localStorage 와 state 를 자동 동기화하는 훅
- 본 프로젝트에 **검색 기능** 추가 (디바운스 적용)

지금까지는 React 가 미리 만들어둔 훅들 — `useState`, `useEffect`, `useRef`, `useMemo` — 을 썼습니다. 이번 챕터에선 **직접 훅을 만들어봅니다.** 두 가지 실용적인 커스텀 훅을 만드는데, DevLog 에 검색 기능을 붙이면서 자연스럽게 등장합니다.

`useLocalStorage` 는 챕터 18 의 다크모드 토글에서 재사용될 예정입니다 — 한 번 만들어둔 훅이 어떻게 다른 곳에서 다시 쓰이는지 체감하실 수 있습니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `hooks/useDebounce.ts` — 디바운스 커스텀 훅 (신규)
- `hooks/useLocalStorage.ts` — localStorage 동기화 훅 (신규)
- `components/SearchInput.tsx` — 검색 입력 컴포넌트 (신규)
- `app/page.tsx` — 검색 + 디바운스 통합 (수정)

---

## 🧠 핵심 개념

### 1. 커스텀 훅이란? — "재사용 가능한 훅 조합"

커스텀 훅은 그냥 **`use` 로 시작하는 함수** 입니다. 그 안에서 React 의 기본 훅들 (useState, useEffect 등) 을 호출하고, 결과를 반환합니다. 외부에선 그냥 또 하나의 훅처럼 사용할 수 있습니다.

#### 모양 비교

```tsx
// React 가 만든 훅 — 그냥 함수
const [count, setCount] = useState(0);

// 직접 만드는 훅 — 그냥 함수, 안에서 다른 훅 사용
function useCounter(initial: number) {
  const [count, setCount] = useState(initial);
  const inc = () => setCount((c) => c + 1);
  const dec = () => setCount((c) => c - 1);
  return { count, inc, dec };
}

// 사용
const { count, inc, dec } = useCounter(0);
```

본질적으로 **차이가 없습니다.** React 의 `useState` 도 그냥 함수, 우리가 만드는 `useCounter` 도 그냥 함수. 둘 다 컴포넌트 안에서 호출해서 state 와 동작을 받아옵니다.

#### 왜 만드나?

- **로직 재사용** — 같은 패턴(예: 검색 디바운스) 이 여러 곳에서 필요할 때
- **관심사 분리** — 컴포넌트가 "보여주는 일" 에 집중하고, 복잡한 상태 로직은 훅으로 빼기
- **테스트 용이성** — 훅 단위로 테스트 작성 가능
- **이름 짓기** — `useState + useEffect + setTimeout` 의 조합에 `useDebounce` 라는 의미 있는 이름을 부여

---

### 2. 커스텀 훅의 규칙

두 가지만 지키시면 됩니다.

#### 규칙 1 — `use` 접두사

```tsx
function useDebounce(...) { ... }    // ✅ 훅으로 인식됨
function debounce(...) { ... }       // ❌ 일반 함수처럼 동작
function getDebounced(...) { ... }   // ❌
```

ESLint 의 `react-hooks/rules-of-hooks` 룰이 **`use` 로 시작하는 함수만 훅으로 인식해서 검증** 해줍니다. 이름 규칙이 곧 의미 표시입니다.

#### 규칙 2 — Hook 사용 위치

```tsx
// ✅ 함수 컴포넌트 안에서
function MyComponent() {
  const value = useDebounce(...);
  return ...;
}

// ✅ 다른 커스텀 훅 안에서
function useSearch() {
  const debounced = useDebounce(...);
  return debounced;
}

// ❌ 일반 함수에서
function handleClick() {
  const v = useDebounce(...);  // 룰 위반
}

// ❌ 조건문/반복문 안에서
if (condition) {
  useState(0);  // 룰 위반
}
```

이게 챕터 07 에서 잠깐 언급한 **"Hook 사용 규칙"** 의 핵심입니다. React 는 훅이 매 렌더마다 **같은 순서로 호출** 될 거라고 가정하고 내부 상태를 추적합니다. 조건문 안에 두면 순서가 깨져서 React 가 헷갈립니다.

---

### 3. 디바운스(Debounce) 란?

검색창에 사용자가 한 글자 칠 때마다 즉시 서버로 검색 요청 보낸다고 가정해봅시다. 100자 입력하면 100번 요청 갑니다. 비효율적이죠.

**디바운스** 는 "입력이 멈춘 후 N밀리초가 지나면 그때 한 번만 처리하자" 라는 패턴입니다.

#### 시각적 흐름

```
사용자 입력:    r - e - a - c - t - (정지 0.3초)
즉시 처리:      O   O   O   O   O          (5번 요청 — 비효율)
디바운스:                              ✓   (마지막 입력 후 0.3초 → 1번만)
```

#### 일반 함수로 디바운스 구현 (참고)

```typescript
// 단순한 디바운스 함수 (React 와 무관)
function debounce(fn: () => void, ms: number) {
  let timeoutId: number;
  return () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(fn, ms);
  };
}
```

이 패턴을 **React 의 state 와 결합** 한 게 `useDebounce` 훅입니다.

---

### 4. localStorage 와 React 상태 동기화

사용자가 다크모드 토글을 했는데 새로고침하면 라이트로 돌아간다? 좋은 UX 가 아니죠. localStorage 에 설정을 저장해두면 새로고침해도 유지됩니다. 이걸 React state 와 매끄럽게 묶는 게 `useLocalStorage` 훅입니다.

#### localStorage 기본 사용 (훅 없이)

```tsx
// 저장
localStorage.setItem("theme", "dark");

// 읽기
const theme = localStorage.getItem("theme");  // "dark" 또는 null

// 삭제
localStorage.removeItem("theme");
```

#### Next.js 환경의 함정

```tsx
// ❌ Server Component 에서 호출하면 에러
const theme = localStorage.getItem("theme");
// ReferenceError: localStorage is not defined
```

`localStorage` 는 **브라우저 API** 입니다. 서버에서 HTML 을 그릴 때는 존재하지 않습니다. Next.js 의 App Router 는 기본이 Server Component 라서 잘못 호출하면 에러가 납니다.

→ 우리 훅은 **`"use client"` 컴포넌트에서만 호출** 되도록 만들고, 추가로 안전 장치를 둡니다.

---

## 🛠 실습

다섯 단계로 진행됩니다.

1. `useDebounce` 훅 만들기
2. `useLocalStorage` 훅 만들기 (챕터 18 에서 재사용)
3. `SearchInput` 컴포넌트 만들기
4. 메인 페이지에 검색 통합

---

### 1. `useDebounce` 훅

`hooks/` 폴더를 새로 만들고 첫 번째 커스텀 훅을 작성합니다.

```typescript
// hooks/useDebounce.ts
"use client";

import { useEffect, useState } from "react";

/**
 * 값이 안정될 때까지 기다렸다가 반환하는 훅.
 * @param value  추적할 값
 * @param delay  안정 대기 시간 (ms), 기본 300ms
 * @returns      delay 동안 변화가 없으면 비로소 반영된 값
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // value 가 바뀔 때마다 timeout 시작
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    // 클린업: value 가 또 바뀌면 이전 timeout 취소
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debounced;
}
```

#### 이 훅이 하는 일

값을 받아서 **delay 시간 동안 변화가 없을 때만** 반영된 값을 반환합니다. 사용 측에선 그냥 새 값처럼 받으면 되고, 내부 동작은 신경 쓸 필요가 없습니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

이 훅을 import 하는 컴포넌트도 자동으로 클라이언트가 되도록 표시. useState/useEffect 가 클라이언트 전용이라 필요합니다.

```tsx
export function useDebounce<T>(value: T, delay: number = 300): T {
```

- **`<T>`** — 제네릭. 어떤 타입이든 받을 수 있게 합니다 (참고자료 9번). string, number, 객체 등 모두 디바운스 가능
- **`delay: number = 300`** — 기본값 300ms. 호출 시 생략하면 0.3초로 동작
- **반환 타입 `: T`** — 받은 타입 그대로 반환. string 넣으면 string, number 넣으면 number

```tsx
const [debounced, setDebounced] = useState<T>(value);
```

- 디바운스된 결과를 보관할 state
- **초기값 = value** — 첫 렌더에는 디바운스할 게 없으니 그대로 시작
- 시간이 지난 후에야 setDebounced 로 업데이트됨

```tsx
useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setDebounced(value);
  }, delay);

  return () => clearTimeout(timeoutId);
}, [value, delay]);
```

이 부분이 디바운스의 핵심입니다.

- **value 가 바뀔 때마다** effect 가 재실행됨
- 매번 새 `setTimeout` 을 예약 (delay 후 setDebounced 호출)
- **클린업으로 이전 timeout 을 취소** ⭐ — 챕터 08 의 setInterval 클린업 패턴과 동일

#### 흐름 시각화

```
0ms:    "r" 입력      → value = "r" → effect 실행 → 300ms 후 setDebounced 예약
100ms:  "re" 입력     → value = "re" → 클린업: 이전 예약 취소 → 새 300ms 예약
200ms:  "rea" 입력    → value = "rea" → 클린업 → 새 예약
300ms:  "react" 입력  → value = "react" → 클린업 → 새 예약
600ms:                                ← 이때 비로소 setDebounced("react") 호출
       (300ms 동안 변화 없음 → debounced 업데이트)
```

마지막 입력 후 300ms 동안 변화가 없어야 setDebounced 가 호출됩니다. 빠르게 타이핑하는 동안엔 setTimeout 이 계속 취소되고 새로 예약됩니다.

#### 챕터 08 패턴의 재활용

```tsx
const timeoutId = window.setTimeout(() => { ... }, delay);
return () => clearTimeout(timeoutId);
```

이 구조는 챕터 08 의 setInterval 클린업과 완전히 같은 패턴입니다 — **사이드 이펙트(타이머 등록) → 클린업 함수(타이머 정리)**. 한 패턴을 익히시면 다른 사이드 이펙트 상황에도 그대로 적용 가능합니다.

---

### 2. `useLocalStorage` 훅

두 번째 커스텀 훅. 이번 챕터에선 만들기만 하고, **챕터 18 의 다크모드 토글에서 재사용** 됩니다.

```typescript
// hooks/useLocalStorage.ts
"use client";

import { useEffect, useState } from "react";

/**
 * state 를 localStorage 와 자동 동기화하는 훅.
 * @param key      localStorage 키
 * @param initial  값이 없을 때의 초기값
 */
export function useLocalStorage<T>(key: string, initial: T) {
  // 초기값: localStorage 에서 읽어오기 (없으면 initial)
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;  // SSR 안전 가드
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  // value 가 바뀔 때마다 localStorage 에 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 실패는 조용히 무시 (용량 초과 등)
    }
  }, [key, value]);

  return [value, setValue] as const;
}
```

#### 이 훅이 하는 일

사용 측에선 `useState` 와 동일한 형태로 쓰지만, **자동으로 localStorage 에 저장/복원** 됩니다. 새로고침해도 값이 유지됩니다.

```tsx
// 사용 예 (챕터 18 에서 등장)
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "dark");
```

useState 처럼 보이지만 페이지를 새로고침해도 마지막 선택이 유지됩니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
const [value, setValue] = useState<T>(() => {
  if (typeof window === "undefined") return initial;
  try {
    const stored = window.localStorage.getItem(key);
    return stored !== null ? (JSON.parse(stored) as T) : initial;
  } catch {
    return initial;
  }
});
```

useState 의 초기값을 **함수로** 전달했습니다. 이걸 **"함수형 초기값(Lazy Initial State)"** 이라고 부릅니다.

- **왜 함수로?** — 매 렌더마다 localStorage 읽기를 호출하면 성능 낭비. 함수로 전달하면 React 가 **첫 렌더에서만 호출** 합니다
- **`typeof window === "undefined"`** — 서버 환경 감지. 서버에선 window 가 없으니 초기값 반환만
- **`try/catch`** — JSON 파싱 실패, localStorage 접근 권한 거부 등의 예외에 대비

```tsx
useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 무시
  }
}, [key, value]);
```

value 또는 key 가 바뀔 때마다 localStorage 에 저장. SSR 가드와 try/catch 를 똑같이 둡니다.

```tsx
return [value, setValue] as const;
```

useState 와 같은 형태 `[현재값, setter함수]` 로 반환. **`as const`** 는 반환 타입을 정확한 튜플로 만들어줍니다 (배열이 아닌 고정 길이 튜플).

#### 두 가지 직렬화 — JSON.stringify / parse

```tsx
window.localStorage.setItem(key, JSON.stringify(value));
const stored = window.localStorage.getItem(key);
return stored !== null ? (JSON.parse(stored) as T) : initial;
```

localStorage 는 **문자열만 저장** 합니다. 객체나 배열을 저장하려면 JSON 으로 변환해야 합니다.

- `JSON.stringify(value)` — 값 → 문자열
- `JSON.parse(stored)` — 문자열 → 값

`"dark"` 같은 단순 문자열도 그대로 저장하면 안 됩니다 — `JSON.stringify("dark")` 는 `"\"dark\""` 가 되어 큰따옴표가 포함됩니다. 일관되게 stringify/parse 를 거치는 게 안전합니다.

#### SSR 안전 가드 두 번 등장

```tsx
if (typeof window === "undefined") return initial;
```

이 한 줄이 두 곳에 들어갑니다 (초기값 함수 + useEffect 안). Next.js 의 App Router 환경에서 안전합니다.

> 💡 **참고**: 사실 `useEffect` 는 서버에서 실행되지 않습니다 (브라우저 마운트 후에만 실행). 그래서 useEffect 안의 가드는 보수적인 안전장치입니다. 의도를 명확히 하려고 둡니다.

---

### 3. `SearchInput` 컴포넌트 만들기

검색 입력 UI 를 별도 컴포넌트로 만듭니다. 단순한 wrapper 지만, 디자인 일관성과 재사용을 위해 분리합니다.

```tsx
// components/SearchInput.tsx
"use client";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "검색...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
      />
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

검색 input 의 단순한 wrapper 입니다. 부모로부터 `value` 와 `onChange` 콜백을 받아서 **제어 컴포넌트(Controlled Component)** 로 동작합니다.

#### 제어 컴포넌트 패턴

```tsx
<input
  value={value}             // 부모가 값 결정
  onChange={(e) => onChange(e.target.value)}  // 변경 알림
/>
```

input 의 값을 **부모가 state 로 관리** 하고, input 은 부모의 state 를 그대로 반영. 변경 시 부모에게 알려서 state 를 업데이트하게 합니다.

이렇게 하면:
- 부모가 항상 input 의 현재 값을 알 수 있음
- 외부에서 값을 강제로 변경 가능 (예: "초기화" 버튼)
- 디바운스 등 추가 로직을 부모에서 처리 가능

#### `placeholder = "검색..."` — 기본값

옵셔널 prop + 기본값 패턴 (챕터 04 에서 다룸). 호출 측이 안 적으면 "검색..." 으로 표시됩니다.

#### 포커스 시각 효과

```tsx
className="... focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
```

- **`focus:border-cyan-400/40`** — 포커스 시 보더가 시안색 40% 투명도로
- **`focus:bg-zinc-900`** — 배경이 살짝 진해짐
- **`focus:outline-none`** — 브라우저 기본 outline 제거 (커스텀 디자인 적용했으니)

---

### 4. 메인 페이지에 검색 통합

`app/page.tsx` 에 검색 state 추가 + 디바운스 + 필터링을 통합합니다.

```tsx
// app/page.tsx (수정)
"use client";

import { useMemo, useState } from "react";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import StudyTimer from "@/components/StudyTimer";
import TagFilter from "@/components/TagFilter";
import EmptyState from "@/components/EmptyState";
import SearchInput from "@/components/SearchInput";  // ⭐ 신규
import { useDebounce } from "@/hooks/useDebounce";   // ⭐ 신규

const posts = [
  // ... 기존 6개 글 그대로
];

const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [query, setQuery] = useState<string>("");           // ⭐ 검색어
  const debouncedQuery = useDebounce(query, 300);           // ⭐ 디바운스 적용

  // ⭐ 검색 + 태그 필터 통합
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

    return result;
  }, [activeTag, debouncedQuery]);

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
        </div>

        {/* ⭐ 검색 입력 추가 */}
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
            hint="다른 검색어나 태그를 선택해보세요"
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
```

#### 코드 한 줄 한 줄 의미 짚기

```tsx
const [query, setQuery] = useState<string>("");
const debouncedQuery = useDebounce(query, 300);
```

두 state 가 협력합니다.

- **`query`** — 사용자가 매 글자 입력할 때마다 즉시 업데이트되는 값. input 에 바인딩
- **`debouncedQuery`** — 입력이 300ms 멈춘 후의 안정된 값. 필터링에 사용

`query` 와 `debouncedQuery` 는 보통 같지만, 사용자가 빠르게 타이핑할 때만 잠시 다릅니다.

```tsx
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

  return result;
}, [activeTag, debouncedQuery]);
```

필터링이 두 단계로 진행됩니다.

1. **태그 필터** — `activeTag` 가 "all" 이 아니면 그 태그만 필터링
2. **검색 필터** — `debouncedQuery` 가 비어있지 않으면 제목/요약 검색

**의존성 배열 `[activeTag, debouncedQuery]`** — 챕터 09 의 useMemo 적용. 두 값 중 하나가 바뀔 때만 재계산.

> 💡 **`query` 가 아닌 `debouncedQuery` 를 의존성에** — 매 키 입력마다 재계산하지 않고, 입력이 안정된 후에만 재계산.

```tsx
const q = debouncedQuery.toLowerCase();
result.filter(
  (p) =>
    p.title.toLowerCase().includes(q) ||
    p.excerpt.toLowerCase().includes(q)
);
```

대소문자 무관 검색. 비교 양쪽을 모두 소문자로 변환합니다. 검색어를 미리 한 번만 `toLowerCase` 해두면 매 글마다 다시 호출할 필요 없습니다 (작은 최적화).

```tsx
<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="제목이나 본문으로 검색..."
/>
```

`query` state 를 SearchInput 에 그대로 전달. setQuery 도 그대로 onChange 콜백으로 — 챕터 07 의 state lifting 패턴이 자연스럽게 적용됩니다.

```tsx
message={
  debouncedQuery
    ? `'${debouncedQuery}' 검색 결과가 없습니다`
    : `'${activeTag}' 태그의 글이 없습니다`
}
```

빈 결과일 때 안내 메시지를 상황에 맞게. 검색 중이면 검색어 표시, 아니면 태그 표시.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

- 글 목록 섹션에 **검색 입력** 추가
- 검색어 입력 시 즉시 글 목록이 필터링 ⭐
- 빠르게 타이핑하면 매 글자마다 필터링되지 않고, **300ms 멈춘 후 한 번에** 필터링됨 (디바운스 효과)
- 태그 필터와 함께 사용 가능 — "React" 선택 + "useEffect" 검색 등
- 검색 결과 없을 때 EmptyState 메시지가 검색어를 보여줌
- 검색어 지우면 다시 전체 표시

#### 디바운스 효과 직접 확인

`hooks/useDebounce.ts` 의 effect 안에 임시로 `console.log` 추가하시면 디바운스 효과를 콘솔로 확인할 수 있습니다.

```tsx
useEffect(() => {
  console.log("⏱ 디바운스 timeout 예약", value);  // 임시
  const timeoutId = window.setTimeout(() => {
    console.log("✓ 적용:", value);  // 임시
    setDebounced(value);
  }, delay);

  return () => {
    console.log("✗ 취소");  // 임시
    clearTimeout(timeoutId);
  };
}, [value, delay]);
```

빠르게 타이핑하시면:
- 매 글자마다 "timeout 예약" + "취소" 가 반복됨
- 마지막에 한 번만 "적용" 됨

확인 후 console.log 들은 제거해주세요.

---

## ❓ 흔한 실수

### Q1. 커스텀 훅 이름이 `use` 로 시작 안 함
```tsx
function debounce<T>(value: T, delay: number) {  // ❌
  const [v, setV] = useState(value);
  // ...
}
```
ESLint 가 훅 규칙 검증을 안 합니다. 또한 다른 개발자가 봤을 때 "이게 훅인지" 모릅니다. 반드시 `use` 로 시작하세요.

### Q2. 의존성 배열에 query 만 넣음
```tsx
const filteredPosts = useMemo(() => {
  // debouncedQuery 사용
}, [activeTag, query]);  // ❌ debouncedQuery 사용 중인데 query 의존성
```
함수 안에서 `debouncedQuery` 를 쓰는데 의존성엔 `query` 만 넣으면 stale closure 버그. ESLint exhaustive-deps 가 잡아줍니다.

### Q3. `useLocalStorage` 를 Server Component 에서 사용
```tsx
// app/some-page.tsx (Server Component)
export default function Page() {
  const [theme] = useLocalStorage("theme", "dark");  // ❌
}
```
`"use client"` 가 없는 컴포넌트에서 호출하면 에러. SSR 가드가 있어 빌드는 통과해도 의도와 다르게 동작합니다.

### Q4. JSON.stringify 안 거치고 저장
```tsx
window.localStorage.setItem(key, value);  // ❌ value 가 객체면 "[object Object]"
```
localStorage 는 문자열만 받습니다. 반드시 `JSON.stringify` 거치세요.

### Q5. 디바운스 delay 가 너무 길거나 짧음
- 100ms 미만 — 디바운스 효과 거의 없음 (사용자 인식 속도 한계)
- 1000ms 초과 — 사용자가 답답함 ("왜 안 나와?")
- 적정값: 200~500ms (검색은 보통 300ms)

### Q6. 매 키 입력마다 서버 요청 보냄
디바운스 안 적용한 input 의 onChange 에서 직접 fetch 호출하시면 안 됩니다. 항상 디바운스된 값에 대해 fetch 하세요. (이번 챕터는 클라이언트 필터링이라 fetch 없음. 서버 검색은 챕터 14~15 에서.)

### Q7. `as const` 빠뜨려서 타입이 배열로 인식
```tsx
return [value, setValue];  // 타입이 (T | Dispatch<...>)[]
return [value, setValue] as const;  // ✅ 정확한 튜플 타입
```
`as const` 가 없으면 호출 측에서 구조분해 시 타입이 헷갈리게 됩니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] 커스텀 훅이 그냥 `use` 로 시작하는 함수라는 것을 안다
- [ ] 커스텀 훅 두 가지 규칙 (`use` 접두사 + 호출 위치 제한) 을 안다
- [ ] 디바운스가 무엇인지, 왜 필요한지 안다
- [ ] `useDebounce` 의 클린업 함수가 어떻게 이전 timeout 을 취소하는지 안다
- [ ] localStorage 가 브라우저 API 라서 SSR 환경에서 가드가 필요한 이유를 안다
- [ ] **함수형 초기값(Lazy Initial State)** 패턴을 안다 (`useState(() => ...)`)
- [ ] 제어 컴포넌트(Controlled Component) 패턴을 안다
- [ ] http://localhost:3000 에서 검색 입력 시 디바운스가 동작한다 (빠르게 타이핑 → 300ms 정지 후 필터링)

---

## ✅ 다음 챕터 예고

> **챕터 11: 이벤트 + key + 가상 DOM**
> Day 1 의 마지막 챕터입니다. 정렬 기능을 추가하면서, React 의 이벤트 처리와 가상 DOM (Virtual DOM) 의 원리, 그리고 챕터 02 에서 잠깐 다룬 `key` 의 진짜 의미를 다룹니다. **잘못된 key 가 만드는 버그** 를 직접 체험하고 고치는 자리입니다.
