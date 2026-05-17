# 📖 JS/TS 핵심 문법 치트시트

> **DevLog 교육 참고자료 #1**
> 본 강의(챕터 01)에서는 **라이브 코딩 없이 이 자료를 배포**합니다.
> 프로젝트를 진행하면서 관련 개념이 등장하면 강사가 **"참고자료 N번"** 으로 가리킵니다.
> 그때 필요한 항목만 골라서 보세요. 처음부터 다 외울 필요 없습니다.

---

## 📑 목차

1. [구조분해 할당 (Destructuring)](#1-구조분해-할당-destructuring)
2. [스프레드 / 레스트 연산자 (`...`)](#2-스프레드--레스트-연산자-)
3. [옵셔널 체이닝 (`?.`) / Nullish Coalescing (`??`)](#3-옵셔널-체이닝---nullish-coalescing-)
4. [화살표 함수](#4-화살표-함수)
5. [async / await](#5-async--await)
6. [import / export](#6-import--export)
7. [interface vs type](#7-interface-vs-type)
8. [유니온 / 리터럴 타입](#8-유니온--리터럴-타입)
9. [제네릭](#9-제네릭)

> 💡 **직접 실행해보고 싶다면**: [TypeScript Playground](https://www.typescriptlang.org/play) 에 코드를 붙여넣으면 결과가 바로 보입니다.

---

## 1. 구조분해 할당 (Destructuring)

> **React에서 어디 만나나**: Props 받을 때, useState 결과 받을 때, useEffect 안에서 — 거의 매 줄.

### 객체 구조분해

```typescript
const user = { name: "길동", age: 25, email: "a@b.com" };

// 기본
const { name, age } = user;
// name === '길동', age === 25

// 이름 바꿔서 받기
const { name: userName } = user;
// userName === '길동'

// 기본값 (값이 undefined일 때만 적용)
const { name = "익명", role = "user" } = user;
// name === '길동' (원래 값 유지), role === 'user' (기본값)
```

### 배열 구조분해

```typescript
const colors = ["red", "green", "blue"];
const [first, second, third] = colors;
// first === 'red', second === 'green', third === 'blue'

// useState가 바로 이 패턴!
const [count, setCount] = useState(0);
```

### 함수 인자에서 구조분해 — Props에서 가장 자주

```typescript
type PostCardProps = {
  title: string;
  author: string;
  date: string;
};

function PostCard({ title, author, date }: PostCardProps) {
  return <h1>{title}</h1>;
}
```

### ⚠️ 흔한 실수

```typescript
// 같은 스코프에서 같은 이름 두 번 → SyntaxError
const { name } = user1;
const { name } = user2; // ❌

// 이름 바꿔서 해결
const { name: name1 } = user1;
const { name: name2 } = user2; // ✅
```

---

## 2. 스프레드 / 레스트 연산자 (`...`)

> **React에서 어디 만나나**: state 업데이트 시 무조건. "기존 상태를 직접 수정하지 말고 새 객체/배열을 만들어라" 는 React 규칙을 지키는 도구.

### 스프레드 — "펼치기"

```typescript
// 객체 합치기
const base = { name: "길동", age: 25 };
const extra = { email: "a@b.com" };
const merged = { ...base, ...extra };
// 결과: { name: '길동', age: 25, email: 'a@b.com' }

// 일부만 덮어쓰기 (불변성 업데이트의 핵심!)
const updated = { ...base, age: 26 };
// 결과: { name: '길동', age: 26 }

// 배열 합치기
const a = [1, 2];
const b = [3, 4];
const c = [...a, ...b];
// 결과: [1, 2, 3, 4]

// 배열에 항목 추가 (불변성 유지)
const newList = [...c, 5];
// 결과: [1, 2, 3, 4, 5]
```

### 레스트 — "나머지 모으기"

```typescript
// 함수 인자
function sum(...numbers: number[]) {
  return numbers.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4);
// 반환값: 10

// 구조분해에서 나머지
const { name, ...rest } = { name: "길동", age: 25, email: "a@b.com" };
// name === '길동'
// rest === { age: 25, email: 'a@b.com' }
```

### ⚠️ 스프레드는 **얕은 복사**

```typescript
const original = { user: { name: "길동" } };
const copy = { ...original };

copy.user.name = "철수";
console.log(original.user.name);
// 출력: '철수' — 원본도 바뀜!
```

→ **챕터 07에서 깊은 복사 다룸**.

---

## 3. 옵셔널 체이닝 (`?.`) / Nullish Coalescing (`??`)

> **React에서 어디 만나나**: API 응답 다룰 때, 폼 데이터 다룰 때 매번. null/undefined 체크를 한 줄로 끝냄.

### 옵셔널 체이닝 — "있으면 읽고, 없으면 undefined"

```typescript
const user = { profile: { name: "길동" } };

// ✅ 옵셔널 체이닝
const name = user?.profile?.name;
// name === '길동'

// 중간 값이 없을 때 — 에러 안 남, undefined 반환
const empty = { profile: null };
const result = empty?.profile?.name;
// result === undefined

// 함수 호출에도 가능
user.callback?.();
// callback이 함수면 호출, 아니면 무시
```

### Nullish Coalescing — "null/undefined일 때만 기본값"

```typescript
// ❌ ||는 0이나 ''까지 falsy로 처리해서 위험
const userCount = 0;
const a = userCount || 10;
// a === 10 (의도와 다름!)

// ✅ ??는 null/undefined만 fallback
const b = userCount ?? 10;
// b === 0 (0은 nullish 아님)
```

### 자주 쓰는 조합

```typescript
const data = { user: null };
const displayName = data?.user?.name ?? "익명";
// displayName === '익명'
```

---

## 4. 화살표 함수

> **React에서 어디 만나나**: 콜백, 이벤트 핸들러, map/filter 안 — 압도적 다수.

```typescript
// 일반 함수
function add1(a: number, b: number) {
  return a + b;
}

// 화살표 함수
const add2 = (a: number, b: number) => a + b;

// 인자 하나면 괄호 생략 가능
const double = (n) => n * 2;
double(7); // 반환값: 14

// 한 줄 표현식이면 return 생략
const square = (n: number) => n * n;
square(4); // 반환값: 16

// 여러 줄이면 중괄호 + return
const greet = (name: string) => {
  const trimmed = name.trim();
  return `Hello, ${trimmed}!`;
};
greet("  길동  "); // 반환값: 'Hello, 길동!'
```

### `map`, `filter`, `reduce` — React 리스트 렌더링의 필수

```typescript
const posts = [
  { id: 1, title: "Hello", published: true },
  { id: 2, title: "World", published: false },
  { id: 3, title: "React", published: true },
];

// map: 변환
const titles = posts.map((p) => p.title);
// 결과: ['Hello', 'World', 'React']

// filter: 거르기
const published = posts.filter((p) => p.published);
// 결과: [{ id: 1, ... }, { id: 3, ... }]

// 체이닝
const publishedTitles = posts.filter((p) => p.published).map((p) => p.title);
// 결과: ['Hello', 'React']
```

---

## 5. async / await

> **React에서 어디 만나나**: fetch, useEffect 내부 비동기, Next.js Server Components(함수 자체가 async).

```typescript
// fetch는 Promise를 돌려줌 → await로 결과 받기
async function loadPosts() {
  const res = await fetch("/api/posts");
  const data = await res.json();
  return data;
}

// async 함수는 항상 Promise를 돌려줌
loadPosts().then((posts) => console.log(posts));

// 또는 다른 async 함수에서 await
async function show() {
  const posts = await loadPosts();
  console.log(posts);
}
```

### Next.js Server Component 패턴 (챕터 14에서 만남)

```typescript
// 컴포넌트 자체가 async!
export default async function PostsPage() {
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}
```

---

## 6. import / export

```typescript
// === 내보내기 ===

// named export (여러 개 가능)
export function Button() { ... }
export const PI = 3.14;

// default export (파일당 하나)
export default function Page() { ... }

// === 가져오기 ===

import Page from './Page';                    // default
import { Button, PI } from './utils';         // named
import Page, { Button } from './everything';  // 같이
```

### Next.js App Router 규칙

- **`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` 는 default export 필수**
- 일반 컴포넌트는 default든 named든 자유

---

## 7. `interface` vs `type`

> **언제 뭘 쓰나**: 객체 모양만 정의하면 `interface`, 유니온이나 별칭이 필요하면 `type`. **둘 다 익숙해야 함**.

```typescript
// interface — 객체 모양 정의용
interface User {
  name: string;
  age: number;
}

// type — 더 범용
type User = {
  name: string;
  age: number;
};

// type만 가능한 것들
type Status = "idle" | "loading" | "success" | "error"; // 유니온
type ID = string | number;
type Callback = (data: User) => void; // 함수 타입
```

### 타입 어노테이션 기본

```typescript
const name: string = "길동";
const age: number = 25;
const isAdmin: boolean = false;
const tags: string[] = ["ts", "react"];
const user: { name: string; age: number } = { name: "길동", age: 25 };
```

---

## 8. 유니온 / 리터럴 타입

> **React에서 어디 만나나**: 컴포넌트 variant prop (`size: 'sm' | 'md' | 'lg'`), API 상태 (`'idle' | 'loading' | 'success'`).

```typescript
// 여러 타입 중 하나
type ID = string | number;

// 정해진 값들 중 하나 (리터럴 타입)
type Theme = 'light' | 'dark' | 'system';

function setTheme(t: Theme) { ... }
setTheme('dark');     // OK
setTheme('blue');     // ❌ 컴파일 에러: '"blue"' is not assignable to type 'Theme'
```

### 실전 패턴 — 컴포넌트 variant

```typescript
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
};

function Button({ variant, size }: ButtonProps) { ... }
```

---

## 9. 제네릭

> **React에서 어디 만나나**: `useState<number>(0)` 같은 훅, `Array<T>`, 커스텀 훅 만들 때.

### 사용하는 쪽 — 훅에서 많이 봄

```typescript
// useState도 제네릭!
const [count, setCount] = useState<number>(0);
// count: number 타입

const [user, setUser] = useState<User | null>(null);
// user: User | null 타입
```

### 직접 만드는 쪽

```typescript
// 어떤 타입의 배열이든 첫 번째 요소를 돌려주는 함수
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);
// n === 1 (타입: number | undefined)

const s = first(["a", "b"]);
// s === 'a' (타입: string | undefined)

const e = first([]);
// e === undefined
```

`<T>` 는 "어떤 타입이든 들어올 수 있는 자리"를 뜻함. 호출 시 타입이 자동으로 채워짐.

---

## 🔍 더 알아보기

- [MDN — 구조분해 할당](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
- [TypeScript Handbook (한국어)](https://typescript-kr.github.io/)
- [TypeScript Playground](https://www.typescriptlang.org/play) — 브라우저에서 TS 실행해보기
