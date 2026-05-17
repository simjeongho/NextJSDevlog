# 챕터 09: useMemo & useCallback (성능 최적화)

> **시간**: 약 30분 · **블록**: Day 1 / Block 3

---

## 🎯 이 챕터에서 다룰 내용

- React 의 **렌더링 모델** 다시 한 번 짚기 (왜 최적화가 필요한가)
- **`useMemo`** — 비싼 계산 결과 캐싱
- **`useCallback`** — 함수 자체 캐싱
- **언제 쓰고 언제 안 쓰나** 의 감각 (남용 경계)
- 챕터 07 의 `filteredPosts` 계산을 useMemo 로 최적화 — Before/After 직접 확인

이번 챕터의 진짜 목표는 두 훅을 외우는 게 아닙니다. **"언제 쓰고, 언제 안 쓰는지의 감각"** 을 잡는 게 핵심입니다. 솔직히 말씀드리면, 두 훅 모두 **무작정 쓰는 게 아닙니다** — 오히려 잘못 쓰면 코드만 복잡해지고 효과는 없거든요.

---

## 🖥️ 이 챕터에서 다룰 파일

- `app/page.tsx` — `filteredPosts` 계산을 `useMemo` 로 감싸기

---

## 🧠 핵심 개념

### 1. React 렌더링 모델 다시 보기

최적화 이야기 전에 React 가 어떻게 다시 그리는지 짚고 가겠습니다.

**`state` 가 바뀌면 그 컴포넌트 함수가 처음부터 끝까지 다시 실행됩니다.** 모든 변수가 다시 선언되고, 모든 계산이 다시 수행됩니다. 그래서 컴포넌트 안에 무거운 계산이 있으면 매 렌더마다 새로 합니다.

#### 매 렌더마다 일어나는 일

```tsx
function Example() {
  const [count, setCount] = useState(0);

  // ⚠️ count 가 바뀌어 다시 렌더될 때마다 모든 줄이 다시 실행됨
  console.log("렌더링 발생");

  // 매번 새로 계산됨
  const expensive = posts
    .filter((p) => p.tag === "React")
    .map((p) => transform(p))
    .reduce(...);

  // 매번 새 함수 객체 생성됨 (참조가 매번 다름!)
  const handleClick = () => setCount(count + 1);

  return <Child onClick={handleClick} data={expensive} />;
}
```

#### 잠재적 문제

- **`expensive` 계산이 무거우면** 클릭마다 화면이 굼떠짐
- **`handleClick` 이 매번 새 객체** 라, `Child` 컴포넌트가 `React.memo` 로 감싸여 있어도 **항상 다시 렌더링** 됨

#### 그런데 정말 매번 무거운가?

대부분은 아닙니다. **JavaScript 는 빠릅니다.** 1만 개 미만의 배열 `filter`/`map` 정도는 0.1ms 안에 끝나요. 사용자가 체감할 정도의 지연이 아닙니다.

**최적화는 진짜 느려졌을 때 시작** 하는 게 원칙입니다. 그렇지만 React 가 제공하는 두 최적화 도구를 알아두면, 진짜 필요한 순간에 손에 잡힙니다.

---

### 2. `useMemo` — 계산 결과 캐싱

`useMemo` 는 한 문장으로 표현하면 **"의존성이 안 바뀌면 이전 결과를 그대로 돌려줘"** 입니다.

```tsx
import { useMemo, useState } from "react";

function Example({ posts }: { posts: Post[] }) {
  const [activeTag, setActiveTag] = useState("all");
  const [unrelated, setUnrelated] = useState(0);

  // ⭐ activeTag 가 바뀔 때만 다시 계산
  const filteredPosts = useMemo(() => {
    return activeTag === "all"
      ? posts
      : posts.filter((p) => p.tag === activeTag);
  }, [activeTag]);

  // unrelated 가 바뀌어 컴포넌트가 리렌더 되어도
  // filteredPosts 는 캐시된 값 그대로 사용
  return <List posts={filteredPosts} />;
}
```

#### 동작 흐름

```
첫 렌더
  ↓
useMemo 가 함수 실행 → 결과를 메모리에 저장 (캐싱)
  ↓
재렌더 발생
  ↓
useMemo 가 의존성 배열 비교 (이전 [activeTag] vs 새 [activeTag])
  ├─ 같으면 → 캐싱된 결과 그대로 반환 (계산 X)
  └─ 다르면 → 함수 다시 실행 → 새 결과 캐싱
```

#### `useEffect` 와의 차이

`useMemo` 와 `useEffect` 는 의존성 배열을 사용한다는 점에서 비슷해 보이지만 역할이 완전히 다릅니다.

| 항목 | useEffect | useMemo |
|---|---|---|
| 목적 | 사이드 이펙트 실행 (외부에 영향) | 값을 계산해서 반환 |
| 반환 | 클린업 함수 (선택) | 계산된 값 |
| 실행 시점 | 렌더 **후** | 렌더 **중** |
| 예시 | setInterval, fetch, DOM 조작 | filter, sort, map 결과 |

`useMemo` 는 렌더 도중에 호출되어 값을 즉시 반환합니다. `useEffect` 는 렌더가 완료된 뒤 별도로 실행됩니다.

---

### 3. `useCallback` — 함수 자체 캐싱

`useCallback` 은 함수를 메모이제이션합니다. 매 렌더마다 새 함수가 만들어지는 걸 막아 같은 참조를 유지합니다.

```tsx
import { useCallback, useState } from "react";

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 매 렌더마다 새 함수 → Child 가 항상 리렌더 (메모이즈된 경우)
  const handleClick1 = () => setCount((c) => c + 1);

  // ✅ 의존성이 안 바뀌면 같은 함수 참조 유지
  const handleClick2 = useCallback(() => {
    setCount((c) => c + 1);
  }, []);  // 빈 배열 — 함수 본체가 외부 값에 의존 안 하면

  return <Child onClick={handleClick2} />;
}
```

#### useMemo vs useCallback — 사실 같은 것

```tsx
// 다음 두 코드는 완전히 동일
const fn = useCallback(() => doSomething(), [deps]);
const fn = useMemo(() => () => doSomething(), [deps]);
```

`useCallback(fn, deps)` 은 사실상 `useMemo(() => fn, deps)` 의 단축형입니다. 함수에 특화된 API 라고 보시면 됩니다.

---

### 4. 언제 쓰나? — 진짜 중요한 가이드라인

여기가 이 챕터의 핵심입니다. **무작정 다 `useMemo`/`useCallback` 으로 감싸지 마세요.** 이런 경우에만 의미가 있습니다.

#### ✅ `useMemo` 를 쓸 만한 경우

- **계산이 진짜 무거움** — 1000개 이상 항목 처리, 복잡한 정렬, 무거운 변환
- **결과 객체/배열의 참조 동일성이 중요** — `useEffect` 의 의존성 배열에 들어가는 경우 등

#### ✅ `useCallback` 을 쓸 만한 경우

- **자식이 `React.memo` 로 감싸여 있고, 그 자식이 자주 리렌더되어 성능 문제**
- **함수가 다른 훅(useEffect 등)의 의존성 배열에 들어감**

#### ❌ 쓰지 말아야 할 경우 (대부분이 여기 해당)

- "성능 좋아질까?" 막연한 기대만으로
- 단순 변수 할당, 가벼운 계산
- 자식이 `React.memo` 가 아닌 일반 컴포넌트 (어차피 부모 리렌더 시 자식도 리렌더됨)
- 자식이 매 렌더마다 어차피 다른 props 를 받음 (메모이제이션 무의미)

#### React 공식 문서의 권장

> **"필요할 때까지 쓰지 마라."**

코드 가독성을 해치는 비용이 더 클 수 있습니다. **먼저 측정하고, 진짜 병목일 때만 최적화** 하시는 게 원칙입니다.

---

### 5. `React.memo` 와 함께 — `useCallback` 의 진가

`useCallback` 은 단독으로 쓸 일이 거의 없습니다. **자식이 `React.memo` 로 감싸여 있을 때** 비로소 의미가 생깁니다.

```tsx
import { memo, useCallback, useState } from "react";

// 자식 — props 가 안 바뀌면 리렌더 X
const ExpensiveChild = memo(({ onAction }: { onAction: () => void }) => {
  console.log("ExpensiveChild 렌더링");
  return <button onClick={onAction}>action</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 매번 새 함수 → React.memo 가 의미 없음 (props 가 매번 다르다고 판단)
  // const handleAction = () => console.log("action");

  // ✅ useCallback 으로 안정화 → React.memo 발동
  const handleAction = useCallback(() => console.log("action"), []);

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <ExpensiveChild onAction={handleAction} />
    </>
  );
}
```

#### 결과

`count` 가 바뀌면 Parent 는 리렌더되지만, `ExpensiveChild` 는 **다시 렌더링되지 않습니다** — `handleAction` 의 참조가 그대로이므로 props 가 안 바뀌었다고 판단되어 React.memo 가 발동합니다.

> 💡 **세트로 묶어서 기억하세요**: `React.memo` + `useCallback` + `useMemo`. 셋이 협력해야 자식 리렌더가 막힙니다. 셋 중 하나라도 빠지면 무의미합니다.

---

## 🛠 실습

이번 챕터는 코드 변경이 적습니다. 챕터 07 에서 만든 `filteredPosts` 계산을 `useMemo` 로 감싸고, **`console.log` 로 Before/After 차이를 직접 확인** 하는 게 메인 작업입니다.

### Before — 현재 상태 관찰

먼저 useMemo 없이 어떻게 동작하는지 콘솔로 확인해보겠습니다. `app/page.tsx` 의 `filteredPosts` 계산 부분에 임시로 `console.log` 한 줄 추가해주세요.

```tsx
const filteredPosts =
  activeTag === "all"
    ? posts
    : posts.filter((p) => p.tag === activeTag);

console.log("⚙ filteredPosts 계산됨", filteredPosts.length);  // ⚠️ 임시 — 확인 후 제거
```

#### 동작 확인 흐름

```bash
npm run dev
```

브라우저에서 F12 (개발자 도구) → **Console 탭** 을 열어두고:

1. **페이지 로드** → "filteredPosts 계산됨" 1회 출력
2. **카드의 좋아요 버튼 클릭** → 또 출력
3. **다른 카드의 좋아요 클릭** → 또 출력
4. **타이머 시작** → **매 초마다** 출력 ⚠️

#### 왜 이런 일이?

좋아요 버튼이 자식 컴포넌트(PostCard 안의 LikeButton) 내부 상태를 바꾸지만, **부모 페이지 컴포넌트도 같이 리렌더링** 됩니다. 좋아요 버튼이 있는 PostCard 들이 자식이고, 부모(`HomePage`) 가 그 자식들을 다시 그리려고 호출되거든요.

매 렌더마다 `posts.filter(...)` 가 처음부터 끝까지 새로 실행됩니다. 타이머가 동작 중이면 1초마다 setSeconds 가 호출되면서 부모 페이지가 매 초 리렌더 → filter 가 매 초 호출됩니다.

지금은 글이 6개라 성능 문제는 없지만, **만약 글이 10,000개라면 어떨까요?** 화면이 굼떠질 수 있습니다. 또 진짜 무거운 계산이라면 더 심각합니다.

이런 의문이 들어야 다음 단계의 `useMemo` 가 의미를 가집니다.

---

### After — `useMemo` 로 감싸기

이제 `useMemo` 를 적용해봅시다. `activeTag` 가 바뀔 때만 다시 계산하도록 만듭니다.

```tsx
// app/page.tsx (수정)
"use client";

import { useMemo, useState } from "react";  // ⭐ useMemo 추가
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import StudyTimer from "@/components/StudyTimer";
import TagFilter from "@/components/TagFilter";
import EmptyState from "@/components/EmptyState";

const posts = [
  // ... 기존 6개 글 그대로
];

const tags = [...new Set(posts.map((p) => p.tag))];

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string>("all");

  // ⭐ useMemo 로 감싸기
  const filteredPosts = useMemo(() => {
    console.log("⚙ filteredPosts 계산됨");  // (확인 후 제거)
    return activeTag === "all"
      ? posts
      : posts.filter((p) => p.tag === activeTag);
  }, [activeTag]);  // activeTag 가 바뀔 때만 재계산

  return (
    <Container>
      {/* 히어로 + 타이머 (변경 없음) */}
      {/* ... 챕터 08 과 동일 ... */}

      <section className="py-12">
        {/* 글 목록 섹션 (변경 없음) */}
        {/* ... 챕터 07 과 동일 ... */}
      </section>
    </Container>
  );
}
```

> 💡 JSX 부분은 챕터 08 과 완전히 동일합니다. **변경된 것은 `filteredPosts` 정의 부분 + `import { useMemo }` 추가뿐** 입니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
import { useMemo, useState } from "react";
```

`useMemo` 도 `useState` 와 같은 위치에서 import. 둘 다 React 의 훅입니다.

```tsx
const filteredPosts = useMemo(() => {
  console.log("⚙ filteredPosts 계산됨");
  return activeTag === "all"
    ? posts
    : posts.filter((p) => p.tag === activeTag);
}, [activeTag]);
```

- **`useMemo(() => {...}, [deps])`** — 첫 번째 인자: 값을 계산하는 함수, 두 번째 인자: 의존성 배열
- **`return ...`** — 함수가 반환하는 값이 캐싱됩니다
- **`[activeTag]`** — activeTag 가 바뀔 때만 함수 재실행. 다른 state(이번 챕터엔 없음) 가 바뀌어도 영향 없음

#### Before/After 비교 — 콘솔에서 직접 확인

저장 후 다시 동작 확인:

1. **페이지 로드** → "filteredPosts 계산됨" 1회 (첫 캐싱)
2. **카드의 좋아요 버튼 클릭** → 출력 안 됨 ✨ (의존성 안 바뀜)
3. **다른 카드 좋아요 클릭** → 출력 안 됨 ✨
4. **타이머 시작** → 1초마다 setSeconds 로 부모가 리렌더되어도 출력 안 됨 ✨
5. **태그 필터 클릭** (예: "React" 선택) → 출력됨 (activeTag 가 바뀌었으니까)

#### 의미 있는 효과는?

`useMemo` 가 캐싱한 결과를 그대로 돌려주니, 글이 10,000개여도 매 초 filter 가 호출되지 않습니다. **활성 태그가 바뀐 순간에만** 계산이 일어납니다.

확인이 끝나셨으면 `console.log` 는 제거해주세요 (실제 운영 코드에 디버그 로그를 남기지 않는 게 좋습니다).

---

### 추가 관찰 (선택 사항) — `posts` 도 의존성에 포함할까?

```tsx
const filteredPosts = useMemo(() => {
  return activeTag === "all"
    ? posts
    : posts.filter((p) => p.tag === activeTag);
}, [activeTag]);  // posts 는 안 넣음
```

이론적으로는 함수 안에서 사용한 모든 값을 의존성에 넣는 게 정석입니다 (`[activeTag, posts]`). 하지만 우리 코드의 `posts` 는 **컴포넌트 밖의 상수** 라 절대 안 바뀝니다. 그래서 의존성에서 생략해도 동작에 차이가 없습니다.

ESLint 가 `exhaustive-deps` 규칙으로 경고를 띄울 수 있는데, 그런 경우에 두 가지 선택지가 있습니다.

```tsx
// 옵션 1: 정직하게 의존성에 추가
}, [activeTag, posts]);

// 옵션 2: 주석으로 의도 명시 (ESLint 비활성)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTag]);
```

본 강의에선 옵션 1을 권장드리지만, 챕터 15 에서 DB 에서 posts 를 받아오게 되면 자연스럽게 의존성에 포함될 것입니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

- 화면은 챕터 08 과 **완전히 동일하게 보임** (시각 변화 없음)
- 콘솔에서 `filteredPosts 계산됨` 메시지가 **태그 변경 시에만** 출력됨
- 좋아요 클릭, 타이머 동작 중에는 출력되지 않음

여기까지 확인되면 이번 챕터의 목표는 달성된 것입니다.

> 💡 **사용자 입장에선 아무 변화가 없습니다.** 이게 정상이에요. 최적화는 **무거운 계산일 때만** 사용자가 체감하는 효과가 있습니다. 우리 데이터는 6개라 효과가 안 보이지만, 코드 패턴은 익혀두는 게 좋습니다.

---

## ❓ 흔한 실수

### Q1. 모든 변수에 `useMemo` 를 감쌈
```tsx
const formatted = useMemo(() => `${name}님`, [name]);  // ❌ 과한 최적화
```
단순 문자열 결합 같은 가벼운 연산에 `useMemo` 를 쓰면 오히려 비교 비용이 더 듭니다. 무거운 계산일 때만 사용하세요.

### Q2. 의존성 배열 빠뜨림
```tsx
const result = useMemo(() => doSomething(value));  // ❌ 의존성 배열 없음
```
ESLint 가 경고합니다. 의존성 없이는 `useMemo` 의 의미가 없습니다. 명시적으로 `[value]` 또는 `[]` 를 넣으세요.

### Q3. 의존성 배열에 빠진 값
```tsx
const result = useMemo(() => a + b, [a]);  // ❌ b 누락
```
`b` 가 바뀌어도 캐시된 값이 반환되어 버그. 함수 안에서 사용하는 모든 외부 값을 의존성에 포함하세요. ESLint `exhaustive-deps` 규칙이 이걸 잡아줍니다.

### Q4. `useCallback` 만 쓰고 `React.memo` 는 안 씀
```tsx
function Parent() {
  const handleClick = useCallback(() => {...}, []);
  return <Child onClick={handleClick} />;  // Child 가 일반 컴포넌트
}
```
`Child` 가 `React.memo` 가 아니면 어차피 부모가 리렌더될 때 함께 리렌더됩니다. `useCallback` 의 효과가 사라집니다.

### Q5. `useMemo` 결과를 매 렌더 다른 값과 비교
```tsx
const filtered = useMemo(() => posts.filter(...), [...]);
const isEmpty = filtered.length === 0;  // OK — 캐시 무관, 매 렌더 계산
```
이건 실수가 아니라 정상입니다. `useMemo` 의 결과는 일반 변수처럼 사용할 수 있어요.

### Q6. 객체/함수의 참조 동일성 헷갈림
```tsx
const obj = { a: 1 };  // 매 렌더 새 객체
const obj = useMemo(() => ({ a: 1 }), []);  // 같은 객체 (캐시됨)
```
`useMemo` 는 값 자체가 아니라 **참조** 를 안정시킵니다. 의존성 배열에 들어가는 객체가 자주 새로 만들어지면 의존성 비교가 매번 실패합니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] React 의 렌더링 모델 — state 가 바뀌면 함수가 처음부터 다시 실행 — 을 이해한다
- [ ] `useMemo` 와 `useEffect` 의 차이를 안다 (렌더 중 vs 렌더 후)
- [ ] `useMemo` 와 `useCallback` 의 관계를 안다 (useCallback 은 함수 특화 단축형)
- [ ] **"필요할 때까지 쓰지 마라"** 의 원칙을 안다
- [ ] `React.memo` + `useCallback` 이 세트로 동작한다는 것을 안다
- [ ] http://localhost:3000 콘솔에서 `useMemo` 의 캐싱 효과를 직접 확인했다
- [ ] 좋아요 클릭이나 타이머 동작 중에는 `filteredPosts 계산됨` 메시지가 안 보인다

---

## ✅ 다음 챕터 예고

> **챕터 10: 커스텀 훅으로 로직 추출**
> 검색어 입력 + debounce 패턴을 추가하면서, 반복되는 훅 로직을 **커스텀 훅** 으로 분리하는 방법을 배웁니다. `useDebounce`, `useLocalStorage` 같은 자주 쓰는 훅을 직접 만들어보고, 다른 컴포넌트에서 재사용하는 패턴을 익힙니다.
