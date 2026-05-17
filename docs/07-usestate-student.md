# 챕터 07: useState + 얕은 복사 / 깊은 복사

> **시간**: 약 30분 · **블록**: Day 1 / Block 3 (점심 후 시작)

---

## 🎯 이 챕터에서 다룰 내용

- React **훅(Hook)** 이 뭔지, **`useState`** 개념과 사용법
- `"use client"` 가 왜 필요한지 (살짝만 — 깊은 건 챕터 12)
- **상태 불변성** 규칙 — "state 를 직접 수정하면 안 된다" 의 의미
- **얕은 복사 vs 깊은 복사** — 객체 안에 객체가 있을 때의 함정
- 챕터 06 에서 만든 **TagFilter 를 동작하게 만들기** ⭐
- 좋아요 버튼으로 불변성과 업데이터 패턴 체감

점심 직전에 만든 정적 화면이 **살아 움직이는 화면** 으로 진화하는 챕터입니다. React 의 가장 핵심 훅인 `useState` 를 만나게 됩니다.

이번 챕터는 **참고자료 1번(구조분해), 2번(스프레드), 4번(화살표 함수), 9번(제네릭)** 이 한꺼번에 등장하는 가장 짙은 챕터 중 하나입니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/TagFilter.tsx` — Client Component 로 변환 + onClick (수정)
- `app/page.tsx` — 활성 태그 상태 + 필터링 (수정)
- `components/LikeButton.tsx` — 좋아요 카운터 (신규)
- `components/PostCard.tsx` — LikeButton 통합 (수정)

---

## 🧠 핵심 개념

### 1. React Hook 이란?

Hook 은 **함수 컴포넌트에 React 기능을 갈고리로 걸어 끌어다 쓰는 함수** 입니다. 이름이 모두 `use` 로 시작합니다.

```tsx
// 앞으로 만날 대표 Hook 들
useState   // 상태 (이 챕터)
useEffect  // 사이드 이펙트 (챕터 08)
useRef     // ref (챕터 08)
useMemo    // 메모이제이션 (챕터 09)
useCallback // 콜백 메모이제이션 (챕터 09)
```

이름이 `use` 로 시작하면 "이건 Hook 이구나, React 의 특별한 기능을 쓰는구나" 라고 인지하시면 됩니다.

#### Hook 사용 규칙 (간단히)

- ✅ **함수 컴포넌트의 최상단에서만** 호출
- ❌ `if` / `for` 안에서 호출 X
- ❌ 일반 JS 함수에서 호출 X (커스텀 훅은 예외 — 챕터 10)

왜 이런 규칙이 있는지는 챕터 09 에서 useMemo 를 다룰 때 자연스럽게 짚어드릴 예정입니다. 지금은 **"훅은 컴포넌트 위에서만 호출한다"** 정도로 기억해주시면 됩니다.

---

### 2. `useState` — 상태(state) 다루기

`useState` 는 **컴포넌트가 기억하는 값** 을 만드는 훅입니다. 클릭 횟수, 입력한 글자, 활성화된 탭… 사용자 인터랙션으로 **변하는 모든 것** 이 state 입니다.

#### 기본 사용법

```tsx
import { useState } from "react";

function Counter() {
  // [현재 값, 값을 바꾸는 함수] = useState(초기값)
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      클릭한 횟수: {count}
    </button>
  );
}
```

`useState` 는 **배열 두 개짜리** 를 반환합니다.
- **첫 번째**: 현재 값 (여기선 `count`)
- **두 번째**: 값을 바꾸는 함수 (여기선 `setCount`)

배열 구조분해 (참고자료 1번) 로 두 개를 한 줄에 받습니다.

#### 동작 흐름

```
1. useState(0) 호출 → React 가 0 을 컴포넌트의 "기억" 에 저장
2. count 변수에 현재 값(0) 들어옴
3. setCount 함수로 값을 바꿀 수 있음
4. setCount(1) 호출 → React 가 컴포넌트를 다시 그림 (re-render)
5. 다시 useState(0) 호출되지만, React 가 "아 이 컴포넌트는 1을 기억하고 있지" → 1을 돌려줌
```

핵심: **`useState(초기값)` 의 인자는 첫 렌더 시에만 의미** 가 있습니다. 이후 렌더에선 React 가 기억하는 값을 그대로 돌려줍니다.

---

### 3. TypeScript 와 useState — 제네릭

TypeScript 에선 `useState` 옆에 꺾쇠 괄호로 타입을 명시할 수 있습니다. **참고자료 9번** 제네릭 패턴입니다.

```tsx
// 타입 추론 — 초기값이 0 이니까 자동으로 number
const [count, setCount] = useState(0);

// 명시적 타입 — 더 명확
const [count, setCount] = useState<number>(0);

// 초기값이 null 인데 나중에 객체가 들어올 수 있는 경우 — 명시 필수
type User = { name: string; age: number };
const [user, setUser] = useState<User | null>(null);
```

#### 언제 타입을 명시하나?

- **초기값으로 추론이 충분한 경우** — 생략 가능 (`useState(0)`)
- **`null` 시작 + 나중에 다른 타입 들어오는 경우** — 명시 필수 (`useState<User | null>(null)`)
- **명확성이 중요한 경우** — 명시 권장 (`useState<string>("all")`)

본 강의에선 **명시적 타입** 을 자주 사용합니다. 코드를 읽는 사람이 state 의 타입을 즉시 알 수 있어 좋습니다.

---

### 4. `"use client"` — useState 쓰기 위한 첫 관문

Next.js App Router 에선 컴포넌트가 기본적으로 **서버 컴포넌트(Server Component)** 입니다. 서버에서 미리 HTML 을 만들어 브라우저로 보내는 방식입니다.

그런데 `useState` 같은 훅이나 `onClick` 같은 이벤트는 **브라우저에서만 동작** 합니다. 그래서 그런 컴포넌트의 파일 맨 위에 **`"use client"`** 한 줄을 적어야 합니다.

```tsx
"use client";  // ⭐ 이 한 줄이 핵심

import { useState } from "react";

export default function MyButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### 안 붙이면?

```
Error: useState only works in Client Components.
Add the "use client" directive at the top of the file to use it.
```

Next.js 가 친절하게 알려줍니다.

#### 지금은 이 정도만

지금은 **"훅이나 이벤트를 쓰려면 파일 맨 위에 `\"use client\"` 한 줄"** 정도로만 알아두시면 됩니다. 깊은 원리는 **챕터 12 (Server vs Client Components)** 에서 본격적으로 다룰 예정입니다.

---

### 5. 상태 불변성 (Immutability) ⭐ 가장 중요

여기가 React 초보자들이 가장 많이 헤매는 지점입니다. **State 는 직접 수정하면 안 됩니다.** 항상 **새 객체/배열을 만들어서** setState 해야 합니다.

#### 규칙

```tsx
const [user, setUser] = useState({ name: "길동", age: 25 });

// ❌ 절대 금지 — 직접 수정
user.age = 26;
setUser(user);  // React 가 변화를 못 알아챔!

// ✅ 올바른 방법 — 새 객체 만들기
setUser({ ...user, age: 26 });  // 스프레드로 복사 + 일부 덮어쓰기
```

#### 왜 직접 수정하면 안 되나?

**① React 가 변화를 감지하지 못함**

React 는 "이전 state === 새 state" **참조 비교** 로 변화를 감지합니다.

```
직접 수정:
  user 객체의 age 만 26 으로 바뀜
  하지만 user 변수가 가리키는 주소는 그대로
  → React: "참조가 같네? 안 바뀐 거구나" → 화면 안 다시 그림

새 객체 만들기:
  새 객체 { ...user, age: 26 } 가 메모리 어딘가에 생성
  setUser 가 그 새 주소를 가리키게 함
  → React: "참조가 다르네! 바뀐 거구나" → 화면 다시 그림
```

**② 버그 추적이 어려워짐**

같은 객체를 여기저기서 수정하면 **어디서 망가졌는지** 찾기 매우 어렵습니다. 불변성을 지키면 "이 state 는 setState 호출 시점에만 바뀐다" 라는 예측이 가능해집니다.

> 💡 **이 원칙은 React 의 가장 중요한 규칙 중 하나** 입니다. 회사 코드 리뷰에서 `state.user.profile.name = ...` 같은 직접 수정 코드를 보시면 빨간 깃발입니다.

#### 배열도 마찬가지

```tsx
const [items, setItems] = useState(["a", "b"]);

// ❌ 직접 수정
items.push("c");
setItems(items);

// ✅ 새 배열 만들기
setItems([...items, "c"]);                          // 추가
setItems(items.filter((x) => x !== "a"));            // 제거
setItems(items.map((x) => (x === "a" ? "z" : x)));   // 변경
```

**참고자료 2번 (스프레드)** 가 진가를 발휘하는 곳이 바로 여기입니다.

---

### 6. 얕은 복사의 함정 — 객체 안에 객체

스프레드 (`...`) 는 **얕은 복사(shallow copy)** 입니다. 한 단계만 복사합니다. 객체 안에 또 객체가 있으면 **그 안쪽은 원본과 공유** 됩니다.

```tsx
const [data, setData] = useState({
  user: { name: "길동", age: 25 },
  tags: ["js", "react"],
});

// ❌ 함정! 얕은 복사라 안쪽 객체는 공유됨
const copy = { ...data };
copy.user.age = 26;  // 원본 data.user.age 도 26으로 바뀜!

// ✅ 안쪽까지 새로 만들기
setData({
  ...data,
  user: { ...data.user, age: 26 },
});
```

#### 시각적으로 이해하기

```
원본:                            얕은 복사:
{                                {
  user: ────┐                      user: ────┐
  tags: ────┼─────→ { name: '길동', age: 25 }  ← 같은 객체!
}         └─────→ ['js', 'react'] ← 같은 배열!
```

- 바깥 객체 (`{ ... }`) 는 새로 만들어짐
- 하지만 안쪽의 `user` 와 `tags` 는 **같은 메모리 주소를 가리킴**
- 한 쪽에서 `copy.user.age = 26` 하면 양쪽 다 영향 받음

이게 **얕은 복사의 함정** 입니다. 객체 안에 객체/배열이 있다면 그 안쪽까지 새로 만들어야 안전합니다.

---

### 7. 깊은 복사 — 정말 필요할 때만

그럼 처음부터 깊은 복사를 하면 되지 않을까요? 깊은 복사는 **느립니다**. 그리고 React 패턴 상 **필요한 부분만 새로 만드는 게 표준** 입니다. 깊은 복사는 진짜 가끔 쓸 일이 있을 때만 사용합니다.

#### 깊은 복사 방법들 (참고)

```tsx
// 1. JSON 트릭 (가장 간단, 단점: 함수/Date 등 손실)
const deepCopy1 = JSON.parse(JSON.stringify(original));

// 2. structuredClone (모던 브라우저 표준, 권장)
const deepCopy2 = structuredClone(original);

// 3. 라이브러리 (lodash 등)
import _ from "lodash";
const deepCopy3 = _.cloneDeep(original);
```

본 강의에선 **거의 안 씁니다**. 챕터 07~19 통틀어 깊은 복사가 한 번 등장할까 말까 합니다. 보통은 **필요한 깊이까지만 스프레드** 로 충분합니다.

---

### 8. setState 업데이터 함수 — `prev` 패턴

`setState` 에 값을 직접 주는 대신, **이전 값을 받는 함수** 를 줄 수도 있습니다. 안전한 패턴입니다.

```tsx
const [count, setCount] = useState(0);

// 방식 A — 값 직접 전달
setCount(count + 1);

// 방식 B — 업데이터 함수 (이전 값을 인자로 받음)
setCount((prev) => prev + 1);
```

#### 두 방식의 차이가 드러나는 순간

```tsx
const handleTripleClick = () => {
  // ❌ 방식 A — 결과는 +1 (count 가 클로저에 캡처됨)
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  // 세 번 모두 같은 count 값을 보고 있어서 결과는 +1

  // ✅ 방식 B — 결과는 +3 (각 호출이 직전 결과를 인자로 받음)
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
  setCount((prev) => prev + 1);
};
```

방식 A 는 setState 호출 시점의 `count` 변수 값(0) 을 기준으로 합니다. 세 번 호출해도 모두 `0 + 1 = 1` 만 계산해서 결과는 1.

방식 B 는 React 가 내부적으로 큐에 쌓아두고, 직전 결과를 `prev` 로 넘겨줍니다. 그래서 세 번 호출하면 `0 → 1 → 2 → 3` 으로 누적됩니다.

#### 언제 어느 걸 쓰나?

- **새 state 가 이전 state 에 의존** 할 때 → 무조건 업데이터 함수 (`prev =>`)
- 그 외엔 둘 다 OK

좋아요 토글, 카운터 증감 같은 경우는 거의 항상 **업데이터 함수** 를 사용하시는 게 안전합니다.

---

## 🛠 실습

이번 챕터는 세 단계로 진행됩니다.

1. TagFilter 를 Client Component 로 변환 + 활성 태그 state
2. State lifting — 활성 태그를 부모로 끌어올리고 글 목록 필터링
3. LikeButton 으로 좋아요 카운터 + 업데이터 패턴 체감

---

### 1. TagFilter 를 Client Component 로 변환 + activeTag 상태

먼저 챕터 06 에서 만든 TagFilter 에 클릭 동작을 붙입니다. 첫 시도로는 TagFilter 가 **자체적으로** 활성 태그를 관리하게 만들어 봅니다.

```tsx
// components/TagFilter.tsx
"use client";  // ⭐ useState / onClick 쓰려면 필수

import { useState } from "react";

type TagFilterProps = {
  tags: string[];
  // activeTag prop 제거 — 이제 자체 state 로 관리
};

export default function TagFilter({ tags }: TagFilterProps) {
  // ⭐ 활성 태그 state. "all" 이 기본값
  const [activeTag, setActiveTag] = useState<string>("all");

  const allTags = ["all", ...tags];

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isActive = activeTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}  // ⭐ 클릭 시 state 변경
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

#### 챕터 06 TagFilter 와의 변화점

| 변경 | 의미 |
|---|---|
| 파일 맨 위에 `"use client"` | useState 와 onClick 을 쓰기 위해 |
| `import { useState } from "react"` | useState 훅 사용 |
| `useState<string>("all")` 추가 | 자체 활성 태그 state |
| `<button>` 에 `onClick` 추가 | 클릭 시 setActiveTag 호출 |
| 타입에서 `activeTag` prop 제거 | 자체 state 로 관리하니 부모에게 안 받음 |

#### 코드의 흐름

```tsx
const [activeTag, setActiveTag] = useState<string>("all");
```

배열 구조분해 (참고자료 1번) + 제네릭 (참고자료 9번) 이 한 줄에 등장합니다.

```tsx
onClick={() => setActiveTag(tag)}
```

화살표 함수 (참고자료 4번) 안에서 setActiveTag 호출. **`onClick={setActiveTag(tag)}` 가 아닌** 점에 주의해주세요 — 그러면 렌더 시점에 즉시 호출되어버립니다.

#### 이 시점의 동작 확인

```bash
npm run dev
```

태그 버튼을 클릭하시면 **시각적으로 활성 상태가 바뀝니다** (시안색으로 강조). 다만 **글 목록은 아직 안 필터링** 됩니다.

이유는 단순합니다. 활성 태그를 **TagFilter 안에서만** 알고 있고, 글 목록을 그리는 부모 (`app/page.tsx`) 는 모르기 때문입니다.

다음 단계에서 이 문제를 해결합니다.

---

### 2. State Lifting — 활성 태그를 부모로 끌어올리기

지금 활성 태그를 TagFilter 안에서만 알고 있습니다. 하지만 글 목록 필터링은 **부모 (`app/page.tsx`) 에서** 해야 합니다. 그래서 state 를 **부모로 이동** 시킵니다.

이걸 **state lifting (상태 끌어올리기)** 이라고 부릅니다. React 에서 자주 쓰는 패턴입니다.

#### 패턴 — "부모가 보유, 자식이 알림"

부모가 state 를 갖고, 자식에게는 **값과 setter 함수 둘 다** 를 prop 으로 전달합니다.

```
[부모: app/page.tsx]
  ├── useState<string>("all") 보유
  └── TagFilter 에 두 가지 prop 전달:
       1. activeTag (현재 값)
       2. onTagChange (값을 바꾸는 함수)

[자식: TagFilter]
  ├── activeTag 받아서 어느 버튼이 활성인지 표시
  └── onTagChange 받아서 클릭 시 호출 → 부모에게 알림
```

#### 자식 (TagFilter) 수정

```tsx
// components/TagFilter.tsx
"use client";

type TagFilterProps = {
  tags: string[];
  activeTag: string;                  // ⭐ 부모에서 받음
  onTagChange: (tag: string) => void; // ⭐ 부모에게 알리는 콜백
};

export default function TagFilter({
  tags,
  activeTag,
  onTagChange,
}: TagFilterProps) {
  const allTags = ["all", ...tags];

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isActive = activeTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onTagChange(tag)}  // ⭐ 부모 콜백 호출
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

**변화점**: useState 제거. 대신 부모로부터 `activeTag` 값과 `onTagChange` 콜백을 받음.

`"use client"` 는 그대로 유지합니다 — onClick 을 쓰니까 여전히 클라이언트 컴포넌트 필요.

#### `onTagChange: (tag: string) => void` 타입의 의미

```tsx
onTagChange: (tag: string) => void;
```

이건 **함수 타입** 입니다.
- `(tag: string) =>` — 문자열 인자 하나를 받는 함수
- `void` — 반환값이 없음 (반환값을 신경 안 씀)

이런 함수를 부모에게서 받아서 클릭 시 호출하면, 부모가 받은 값으로 자신의 state 를 업데이트합니다.

#### 부모 (app/page.tsx) 수정

```tsx
// app/page.tsx
"use client";  // ⭐ 부모도 useState 쓰려면 필요

import { useState } from "react";
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

const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
  // ⭐ 활성 태그 state — 부모에서 보유
  const [activeTag, setActiveTag] = useState<string>("all");

  // ⭐ 필터링된 글 목록 (state 아니고 매 렌더마다 계산)
  const filteredPosts =
    activeTag === "all"
      ? posts
      : posts.filter((p) => p.tag === activeTag);

  return (
    <Container>
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

      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">최근 글</h2>
            <p className="mt-1 text-sm text-zinc-500">
              총 {filteredPosts.length}개의 글
            </p>
          </div>
        </div>

        <div className="mb-8">
          <TagFilter
            tags={tags}
            activeTag={activeTag}
            onTagChange={setActiveTag}  // ⭐ setter 를 그대로 콜백으로
          />
        </div>

        {filteredPosts.length === 0 ? (
          <EmptyState
            message={`'${activeTag}' 태그의 글이 없습니다`}
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
```

#### 두 가지 흥미로운 패턴

**① `onTagChange={setActiveTag}` — setter 를 그대로 전달**

```tsx
<TagFilter
  tags={tags}
  activeTag={activeTag}
  onTagChange={setActiveTag}  // ⭐ 함수 자체를 전달
/>
```

`setActiveTag` 는 `(value: string) => void` 형태의 함수입니다. TagFilter 가 받는 `onTagChange` 도 같은 형태입니다. 그래서 **setter 함수를 그대로 콜백으로 넘기는** 단축이 가능합니다.

만약 추가 로직을 끼우고 싶다면:
```tsx
onTagChange={(tag) => {
  console.log("태그 선택:", tag);
  setActiveTag(tag);
}}
```

이렇게 화살표 함수로 감싸면 됩니다.

**② `filteredPosts` 는 state 가 아닙니다**

```tsx
const filteredPosts =
  activeTag === "all"
    ? posts
    : posts.filter((p) => p.tag === activeTag);
```

이건 `useState` 가 아닙니다. **매 렌더마다 다시 계산** 되는 일반 변수입니다.

> 💡 **"state 는 최소화하라"** — React 의 격언입니다. **다른 state 로부터 계산 가능한 값은 state 로 만들지 않고, 렌더 함수 안에서 계산** 하시면 됩니다. activeTag 가 바뀌면 컴포넌트가 다시 그려지면서 filteredPosts 도 자동으로 다시 계산됩니다.

#### `"use client"` 가 page.tsx 전체에 붙음

```tsx
// app/page.tsx
"use client";
```

이건 **임시 조치** 입니다. 페이지 전체가 클라이언트 컴포넌트가 되어서 SEO 와 성능에 좋지 않습니다.

**챕터 12** 에서 더 잘게 쪼개는 법 (인터랙티브 부분만 분리하고 나머진 서버 컴포넌트로 유지) 을 배웁니다. 지금은 일단 동작하게 만드는 게 우선입니다.

#### 이 시점의 동작 확인

```bash
npm run dev
```

- 태그 버튼 클릭 → 글 목록이 **즉시 필터링** 됩니다 ⭐
- "전체" 누르면 6개 다 보임
- 빈 결과일 때 EmptyState 가 적절한 메시지로 표시됨

축하드립니다! 첫 번째 인터랙티브 기능이 동작합니다.

---

### 3. LikeButton — 단순 number state + 업데이터 패턴

이제 보조 예제로 좋아요 버튼을 만들어 보겠습니다. 카드마다 좋아요 카운트 + 토글 기능. **업데이터 함수 패턴** 을 실전에서 체감하는 자리입니다.

#### LikeButton 컴포넌트 생성

```tsx
// components/LikeButton.tsx
"use client";

import { useState } from "react";

type LikeButtonProps = {
  initial?: number;
};

export default function LikeButton({ initial = 0 }: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(initial);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const handleClick = () => {
    if (isLiked) {
      setLikes((prev) => prev - 1);  // ⭐ 업데이터 패턴
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        isLiked
          ? "inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-400 transition-colors"
          : "inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
      }
    >
      <span>{isLiked ? "♥" : "♡"}</span>
      <span>{likes}</span>
    </button>
  );
}
```

#### 이 컴포넌트가 하는 일

좋아요 버튼입니다. 두 가지 state 를 동시에 관리합니다.
- **`likes`** — 좋아요 개수 (number)
- **`isLiked`** — 사용자가 좋아요를 눌렀는지 여부 (boolean)

클릭 시:
- isLiked === false → 카운트 +1, 하트 채우기
- isLiked === true → 카운트 -1, 하트 비우기

#### 왜 `setLikes((prev) => prev - 1)` 인가?

```tsx
setLikes((prev) => prev - 1);
setIsLiked(false);
```

업데이터 함수 패턴 (`prev =>`) 을 사용했습니다. 이유는 **새 값이 이전 값에 의존** 하기 때문입니다 (`prev - 1`, `prev + 1`).

만약 이렇게 쓰면:
```tsx
setLikes(likes - 1);
setIsLiked(false);
```

대부분 잘 동작하지만, 만약 사용자가 매우 빠르게 두 번 클릭하거나, 부모 컴포넌트가 batch 업데이트로 여러 setLikes 를 묶어 처리할 때 의도와 다른 결과가 나올 수 있습니다. **이전 값에 의존하는 업데이트는 항상 업데이터 함수** 가 안전합니다.

#### 두 state 의 동기화

```tsx
if (isLiked) {
  setLikes((prev) => prev - 1);
  setIsLiked(false);
} else {
  setLikes((prev) => prev + 1);
  setIsLiked(true);
}
```

두 state 가 항상 같이 바뀝니다 (toggle 시점에). React 는 같은 이벤트 핸들러 안의 여러 setState 를 **하나로 묶어서 처리(batching)** 합니다. 한 번의 리렌더로 두 state 가 함께 업데이트됩니다.

#### `inline-flex items-center gap-1.5`

```tsx
className="inline-flex items-center gap-1.5 ..."
```

- **`inline-flex`** — flex 컨테이너지만 inline 으로 동작 (옆 요소와 같은 줄에 배치 가능)
- **`items-center`** — 자식들을 세로 가운데 정렬 (하트 ♥ 와 숫자가 같은 높이로)
- **`gap-1.5`** — 자식들 사이 6px 간격

---

#### PostCard 에 LikeButton 통합

```tsx
// components/PostCard.tsx
import LikeButton from "./LikeButton";

type PostCardProps = {
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  readingTime?: number;
  coverImage?: string;
  initialLikes?: number;  // ⭐ 신규
};

export default function PostCard({
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-medium text-zinc-400">{author}</span>
            <span>·</span>
            <span>{date}</span>
          </div>
          <LikeButton initial={initialLikes} />  {/* ⭐ 추가 */}
        </div>
      </div>
    </article>
  );
}
```

#### 변화점

- **`initialLikes?` prop 추가** — 초기 좋아요 수를 부모로부터 받을 수 있게
- **메타 영역을 `flex justify-between` 으로** — 작성자/날짜는 왼쪽, LikeButton 은 오른쪽
- **`<LikeButton initial={initialLikes} />`** 추가

원하시면 `app/page.tsx` 의 posts 데이터에 `initialLikes` 필드를 추가하실 수도 있습니다:

```tsx
{ id: 1, title: "...", initialLikes: 12, ... },
{ id: 2, title: "...", initialLikes: 5, ... },
// ...
```

안 적으시면 모두 0 부터 시작합니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 확인해주세요:

- **태그 버튼** 클릭 → 글 목록이 즉시 필터링됨
- **"전체"** 누르면 6개 다 보임
- **각 카드의 좋아요 버튼** 클릭 → ♡ ↔ ♥ 토글 + 카운트 변화
- 좋아요는 **카드별로 독립** 적임 (한 카드의 좋아요가 다른 카드에 영향 안 줌)
- 빈 결과 태그가 있다면 EmptyState 가 표시됨

각 LikeButton 이 **독립적인 state** 를 갖는다는 점을 주목해주세요. PostCard 가 5개 있으면 LikeButton 도 5개, 그 안의 useState 도 5개씩 독립적으로 존재합니다.

---

## ❓ 흔한 실수

### Q1. `"use client"` 빼먹어서 빌드 에러
useState/useEffect/onClick 등은 모두 클라이언트에서 동작합니다. 파일 맨 위에 `"use client";` 한 줄 잊지 마세요. 보통 에러 메시지가 친절하게 알려줍니다.

### Q2. setState 직후 새 값을 즉시 읽으려 함
```tsx
setCount(count + 1);
console.log(count);  // ❌ 아직 옛날 값!
```
setState 는 **다음 렌더에 반영** 됩니다. 같은 함수 안에서 직접 읽을 수 없습니다. 새 값을 알아야 한다면 변수에 따로 저장하세요.

```tsx
const newCount = count + 1;
setCount(newCount);
console.log(newCount);  // ✅
```

### Q3. 객체 state 를 직접 수정
```tsx
user.age = 26;     // ❌ React 못 알아챔
setUser(user);
```
항상 **새 객체** 만들어서 setState 하세요: `setUser({ ...user, age: 26 })`.

### Q4. 얕은 복사로 안쪽 수정
```tsx
const copy = { ...user };
copy.profile.name = "철수";  // ❌ 원본도 영향
```
안쪽까지 다 새로 만들어야 합니다: `{ ...user, profile: { ...user.profile, name: "철수" } }`.

### Q5. `useState(initialValue)` 의 인자가 매 렌더 호출되는 줄 앎
초기값은 **첫 렌더 시에만** 사용됩니다. 무거운 계산이 초기값이면 `useState(() => 무거운계산())` 처럼 함수 형태로 전달하시면 첫 렌더에서만 호출됩니다.

### Q6. setActiveTag 호출 시 즉시 실행됨
```tsx
onClick={setActiveTag(tag)}  // ❌ 렌더 시점에 즉시 호출됨
onClick={() => setActiveTag(tag)}  // ✅ 클릭 시 호출
```
화살표 함수로 감싸지 않으면 렌더 시점에 즉시 실행되어 무한 렌더링 루프가 발생할 수 있습니다.

### Q7. 한 컴포넌트의 useState 가 다른 인스턴스에 영향?
영향 없습니다. PostCard 가 5개면 그 안의 LikeButton 도 5개, 각각 독립적인 state 를 가집니다. 컴포넌트 인스턴스마다 자기만의 "기억" 이 있습니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] React Hook 의 이름 규칙 (`use` 로 시작) 과 사용 규칙을 안다
- [ ] `useState` 의 동작 흐름을 안다 (초기값은 첫 렌더에만 의미)
- [ ] `useState<T>(...)` 의 제네릭 타입 명시법을 안다
- [ ] `"use client"` 가 왜 필요한지 안다 (자세한 건 챕터 12)
- [ ] **State 를 직접 수정하면 안 되는 이유** 두 가지를 안다
- [ ] 얕은 복사의 함정 — 객체 안에 객체가 있을 때 — 을 안다
- [ ] **업데이터 함수 패턴** (`setX(prev => prev + 1)`) 을 언제 쓰는지 안다
- [ ] **State Lifting** 패턴이 왜 필요한지 안다
- [ ] http://localhost:3000 에서 태그 필터 클릭 시 글 목록이 필터링된다
- [ ] 각 카드의 좋아요 버튼이 독립적으로 동작한다

---

## ✅ 다음 챕터 예고

> **챕터 08: 학습 타이머 — useEffect + useRef ⭐**
> 60분짜리 긴 챕터입니다. React 의 다른 핵심 훅 두 가지 — **`useEffect`** 와 **`useRef`** — 를 한꺼번에 만납니다. 학습 시간을 측정하는 원형 게이지 타이머를 만들면서, 사이드 이펙트 처리와 DOM/값 참조를 다룹니다. 시각적으로 가장 화려한 챕터 중 하나입니다.
