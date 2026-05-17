# 챕터 04: Props + TypeScript 구조분해 할당

> **시간**: 약 30분 · **블록**: Day 1 / Block 2

---

## 🎯 이 챕터에서 다룰 내용

- React **Props 개념** 이해 — 컴포넌트에 데이터를 전달하는 방법
- TypeScript 로 **Props 타입 정의** (`type` / `interface`)
- 함수 인자 자리에서 **구조분해 할당** 으로 props 받기
- **옵셔널 prop** (`?`) 의 의미와 활용
- 챕터 03 의 "같은 카드 3개" → "다른 내용 5개" 로 진화시키기

이번 챕터에서 본격적으로 **참고자료 1번 (구조분해)** 과 **7번 (타입)** 이 등장합니다. 막연하셨던 분도 이 챕터를 마치시면 손에 익게 됩니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/PostCard.tsx` — props 받도록 수정
- `app/page.tsx` — 더미 데이터 부활 + PostCard 에 props 전달

---

## 🧠 핵심 개념

### 1. Props 란? — "컴포넌트의 입력값"

Props 는 **부모 컴포넌트가 자식 컴포넌트에 데이터를 내려주는 통로** 입니다. 함수의 인자(argument) 와 같다고 생각하시면 됩니다.

#### 데이터 흐름

```
[부모: app/page.tsx]
   |
   | posts 배열을 갖고 있음
   | PostCard 에 글 하나씩 전달
   ↓
[자식: PostCard.tsx]
   |
   | 받은 데이터로 화면을 그림
   ↓
화면에 카드 표시
```

**부모는 데이터를 갖고 있고, 자식은 그걸 받아서 그리기만 합니다.** 이 단방향 데이터 흐름이 React 의 핵심 원칙입니다.

#### 간단한 흐름 예시

```tsx
// 부모: "title" 이라는 prop 을 내려줌
<PostCard title="Hello React" />

// 자식: props 매개변수로 받음
function PostCard(props) {
  return <h1>{props.title}</h1>;
}
```

자식 함수의 첫 번째 인자가 `props` 라는 객체이고, 그 안에 부모가 넘긴 값들이 키-값 쌍으로 들어있습니다.

#### React 의 단방향 데이터 흐름

React 에서 데이터는 **항상 부모 → 자식 방향** 으로만 흐릅니다. 자식이 부모의 데이터를 직접 바꾸는 건 불가능합니다 (필요한 경우는 콜백 함수를 prop 으로 받는 패턴을 사용 — 챕터 07 에서 등장).

이 원칙 덕분에 데이터가 어디서 변경되는지 추적하기 쉽고, 버그를 찾기 수월합니다.

---

### 2. TypeScript 로 Props 타입 정의

타입 없이도 props 를 받을 수는 있습니다. 하지만 회사 코드는 거의 100% TypeScript 로 작성합니다.

#### 왜 타입을 정의하나?

- **컴포넌트가 어떤 props 를 받는지 명시적으로 선언** — 다른 분이 그 컴포넌트를 처음 봐도 사용법을 알 수 있음
- **잘못된 사용을 컴파일 시점에 차단** — 필수 prop 누락, 잘못된 타입 전달 등을 IDE 가 즉시 경고
- **자동완성 지원** — IDE 가 어떤 prop 을 넘겨야 하는지 자동으로 안내

#### `type` vs `interface` — 두 가지 방법

```tsx
// 방법 A: type 사용
type PostCardProps = {
  title: string;
  author: string;
};

// 방법 B: interface 사용
interface PostCardProps {
  title: string;
  author: string;
}

// 둘 다 동일하게 사용
function PostCard(props: PostCardProps) {
  return <h1>{props.title}</h1>;
}
```

둘 다 거의 같은 효과를 냅니다. 미세한 차이는 있지만 (interface 는 확장 가능, type 은 유니온 가능 등) 일반적인 컴포넌트 props 에선 어느 쪽을 써도 무방합니다.

**DevLog 컨벤션**: `type` 으로 통일합니다. 회사가 다른 컨벤션을 쓰신다면 그쪽을 따르시면 됩니다.

#### 타입을 외부로 export 하는 패턴

```tsx
// 이렇게 export 하면 다른 곳에서 import 해서 재사용 가능
export type PostCardProps = {
  title: string;
  author: string;
};
```

DevLog 에선 일단 컴포넌트 파일 안에서만 쓰일 거라 export 하지 않습니다. 필요해지면 그때 export 해도 늦지 않습니다.

---

### 3. 인자 자리에서 구조분해 ⭐ 핵심 패턴

함수 인자 자리에서 바로 구조분해 — **`props.title` 안 쓰고 `title` 만 써도 됩니다**. React 코드에서 가장 자주 보게 되실 패턴입니다.

#### 두 가지 방식 비교

```tsx
// 😐 방식 A: props 객체로 받기
function PostCard(props: PostCardProps) {
  return (
    <article>
      <h2>{props.title}</h2>
      <p>{props.author}</p>
    </article>
  );
}

// ✨ 방식 B: 인자 자리에서 바로 구조분해
function PostCard({ title, author }: PostCardProps) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{author}</p>
    </article>
  );
}
```

두 방식은 **결과가 완전히 동일** 합니다. 다만 방식 B 가:
- `props.` 를 매번 안 적어도 됨 → 코드가 짧아짐
- 컴포넌트가 어떤 props 를 사용하는지 함수 시그니처만 봐도 한눈에 보임

**앞으로 보게 될 React 코드 99%가 방식 B** 입니다. 이 패턴이 손에 익으시면 React 코드가 훨씬 편하게 읽힙니다.

#### 구조분해는 JavaScript 의 일반 문법

```tsx
// 일반 객체에서도 동일하게 동작
const user = { name: '길동', age: 25 };
const { name, age } = user;  // name = '길동', age = 25

// 함수 인자에서도 가능
function greet({ name, age }) {  // ← 인자 자리에서 분해
  console.log(`${name}, ${age}살`);
}
greet(user);
```

이건 React 만의 특수 문법이 아니라 **참고자료 1번 구조분해 할당** 그대로입니다. React 는 이 JavaScript 문법을 활용할 뿐입니다.

---

### 4. 옵셔널 prop (`?`)

어떤 prop 은 **있을 수도 있고 없을 수도** 있습니다. 예를 들어 글 썸네일 이미지 — 모든 글이 썸네일을 가진 건 아닐 수 있죠.

#### 물음표 `?` 의 의미

```tsx
type PostCardProps = {
  title: string;          // 필수
  author: string;         // 필수
  coverImage?: string;    // 옵셔널 — 있어도 되고 없어도 됨
};
```

`?` 를 붙이면 그 prop 은 **생략 가능** 해집니다. 옵셔널 prop 의 타입은 자동으로 `string | undefined` 가 됩니다.

#### 사용 시 주의 — `undefined` 체크 필요

```tsx
function PostCard({ title, author, coverImage }: PostCardProps) {
  return (
    <article>
      {/* ❌ 위험 — coverImage가 undefined 일 수 있음 */}
      <img src={coverImage} />

      {/* ✅ && 로 안전하게 — 있을 때만 렌더링 */}
      {coverImage && <img src={coverImage} />}

      <h2>{title}</h2>
      <p>{author}</p>
    </article>
  );
}
```

`coverImage` 가 없을 때 `<img src={undefined}>` 를 그리면 깨진 이미지 아이콘이 표시될 수 있습니다. **`&&` 로 존재 여부를 체크** 한 뒤 렌더링하시면 됩니다.

#### 사용 측에선

```tsx
<PostCard title="A" author="B" />                                  // OK (옵셔널 생략)
<PostCard title="A" author="B" coverImage="/img.png" />            // OK (옵셔널 전달)
<PostCard title="A" />                                             // ❌ author 필수
```

옵셔널 prop 의 진가는 **"있으면 보여주고, 없으면 깔끔하게 생략"** 하는 유연한 컴포넌트를 만들 수 있다는 점입니다.

---

### 5. 스프레드로 props 전달 단순화

이 챕터 후반부에 만나실 패턴입니다. **부모가 가진 객체의 모든 키를 한 번에 props 로 펼쳐서 전달** 하는 방법입니다.

#### Before — props 하나하나 명시

```tsx
{posts.map((post) => (
  <PostCard
    key={post.id}
    title={post.title}
    author={post.author}
    date={post.date}
    tag={post.tag}
    excerpt={post.excerpt}
  />
))}
```

5개 prop 을 일일이 적습니다. 새로운 prop 이 추가되면 여기도 같이 수정해야 합니다.

#### After — 스프레드 한 줄

```tsx
{posts.map((post) => (
  <PostCard key={post.id} {...post} />
))}
```

`{...post}` 는 **post 객체의 모든 키를 props 로 펼쳐서 전달** 한다는 의미입니다 (참고자료 2번 스프레드 문법).

#### 동작 조건 — 이름 일치

이 패턴이 동작하려면 **post 객체의 키 이름과 PostCardProps 의 prop 이름이 정확히 일치** 해야 합니다.

```tsx
// 데이터
const post = { title: "...", author: "...", date: "..." };

// PostCardProps
type PostCardProps = {
  title: string;   // ✓ 일치
  author: string;  // ✓ 일치
  date: string;    // ✓ 일치
};

// 스프레드 OK
<PostCard {...post} />
```

만약 이름이 다르면 스프레드를 못 쓰고 명시적으로 전달해야 합니다:

```tsx
// 데이터의 키는 name, when
const post = { name: "...", when: "..." };

// PostCardProps 는 author, date
// → 스프레드 불가, 매핑 필요
<PostCard author={post.name} date={post.when} />
```

#### `key` 는 왜 스프레드 밖에?

```tsx
<PostCard key={post.id} {...post} />
//        ↑ 스프레드 밖에 별도로 명시
```

`key` 는 React 가 가로채는 **특수 prop** 입니다. PostCardProps 에 정의하지 않아도 되고, 컴포넌트 내부에서 `key` 로 접근할 수도 없습니다. 챕터 02 에서 본 그 `key` 와 같은 역할입니다.

#### `id` 는 어떻게 되나?

```tsx
const post = { id: 1, title: "...", author: "...", ... };
// PostCardProps 에는 id 가 정의되어 있지 않음

<PostCard key={post.id} {...post} />  // id 도 스프레드로 함께 넘어감
```

`{...post}` 는 객체의 모든 키를 펼치므로 `id` 도 PostCard 에 전달됩니다. 다만 PostCardProps 에 `id` 가 없으니 PostCard 내부에서는 인식되지 않습니다. 동작에는 영향이 없습니다.

---

## 🛠 실습

이번 챕터는 네 단계로 진행됩니다.
1. PostCard 가 props 를 받도록 수정
2. app/page.tsx 에 더미 데이터 5개 부활 + map 으로 전달
3. 스프레드로 단순화
4. 옵셔널 prop (coverImage) 추가

---

### 1. PostCard 에 Props 받기

`components/PostCard.tsx` 를 props 받는 형태로 수정합니다.

```tsx
// components/PostCard.tsx
type PostCardProps = {
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
};

export default function PostCard({
  title,
  author,
  date,
  tag,
  excerpt,
}: PostCardProps) {
  return (
    <article className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <div className="mb-3 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
        {tag}
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
        {title}
      </h2>
      <p className="mb-4 text-sm text-zinc-400">{excerpt}</p>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>{author}</span>
        <span>·</span>
        <span>{date}</span>
      </div>
    </article>
  );
}
```

#### 변화점

챕터 03 에서 하드코딩이었던 부분이 **변수 참조** 로 바뀌었습니다.

| 챕터 03 (하드코딩) | 챕터 04 (Props) |
|---|---|
| `"React"` | `{tag}` |
| `"useEffect 의존성 배열 완전 정복"` | `{title}` |
| `"의존성 배열을..."` | `{excerpt}` |
| `"김개발"` | `{author}` |
| `"2025-04-30"` | `{date}` |

여러 줄의 props 타입 정의와 구조분해는 코드를 한 줄로 압축할 수도 있지만, **줄바꿈으로 정렬하면 읽기 훨씬 편합니다.** Prettier 가 자동으로 포맷팅해 줄 것입니다.

#### 이 시점에 동작 확인하면?

지금 `npm run dev` 하시면 **TypeScript 에러가 납니다.** `app/page.tsx` 에서 `<PostCard />` 를 props 없이 호출하고 있는데, PostCardProps 는 5개 필수 prop 을 요구하기 때문입니다.

다음 단계로 바로 넘어가시면 됩니다.

---

### 2. `app/page.tsx` 에 데이터 5개 부활 + map 으로 전달

챕터 02 에서 만들었던 더미 데이터 5개를 부활시키고, `map` 으로 PostCard 에 전달합니다.

```tsx
// app/page.tsx
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";

const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt: "의존성 배열을 잘못 다루면 무한 루프가 납니다.",
  },
  {
    id: 2,
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt: "API 라우트 없이 서버 함수를 호출하는 새로운 방식.",
  },
  {
    id: 3,
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt: "제네릭은 타입을 변수처럼 다루는 도구입니다.",
  },
  {
    id: 4,
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt: "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법.",
  },
  {
    id: 5,
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt: "조회 성능을 좌우하는 인덱스 설계.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            최근 글
          </h1>
          <p className="text-zinc-400">개발자들의 학습 기록을 확인하세요</p>
        </div>

        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              author={post.author}
              date={post.date}
              tag={post.tag}
              excerpt={post.excerpt}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

#### 코드의 흐름

1. `posts` 배열 정의 (5개 글)
2. `posts.map((post) => ...)` — 각 글에 대해 PostCard JSX 생성
3. 각 PostCard 에 글의 필드들을 prop 으로 전달
4. `key={post.id}` — React 가 리스트를 효율적으로 추적하도록

#### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에 접속하시면 이제 **5개 글이 각각 다른 내용** 으로 표시됩니다.

> 💡 props 를 하나하나 명시하는 게 좀 길어 보이지 않으신가요? 다음 단계에서 **한 줄로 압축** 하겠습니다.

---

### 3. 스프레드로 props 전달 단순화

`app/page.tsx` 의 `map` 부분만 수정합니다. 다른 부분은 그대로입니다.

```tsx
// 변경 전
<div className="grid gap-4">
  {posts.map((post) => (
    <PostCard
      key={post.id}
      title={post.title}
      author={post.author}
      date={post.date}
      tag={post.tag}
      excerpt={post.excerpt}
    />
  ))}
</div>

// 변경 후 — 스프레드 한 줄
<div className="grid gap-4">
  {posts.map((post) => (
    <PostCard key={post.id} {...post} />
  ))}
</div>
```

#### 어떻게 동작하나?

`{...post}` 는 `post` 객체의 모든 키-값을 PostCard 의 props 로 펼쳐서 전달합니다. 결과적으로 다음 두 코드는 **완전히 동일** 합니다.

```tsx
// 명시적
<PostCard key={post.id} title={post.title} author={post.author} ... />

// 스프레드
<PostCard key={post.id} {...post} />
```

#### 왜 좋은가

- **코드가 짧아짐** — 5개 prop 을 하나하나 적을 필요 없음
- **유지보수 쉬움** — PostCardProps 에 prop 이 추가/제거되어도 `{...post}` 는 자동으로 따라감 (이름이 일치하는 한)

#### 동작 확인

다시 새로고침해보세요. **결과는 변경 전과 똑같습니다** — 5개 글이 각각 다르게 표시됩니다. 코드만 짧아진 것입니다.

---

### 4. 옵셔널 prop 추가 — `coverImage`

이제 일부 글에만 커버 이미지를 추가해서, 옵셔널 prop 의 동작을 확인합니다.

#### PostCard 에 옵셔널 prop 추가

```tsx
// components/PostCard.tsx
type PostCardProps = {
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  coverImage?: string;  // ⭐ 옵셔널 — 있으면 표시, 없으면 안 표시
};

export default function PostCard({
  title,
  author,
  date,
  tag,
  excerpt,
  coverImage,
}: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      {/* coverImage 가 있을 때만 렌더링 */}
      {coverImage && (
        <div className="aspect-[3/1] w-full overflow-hidden bg-zinc-800">
          <img
            src={coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <div className="mb-3 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
          {tag}
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
          {title}
        </h2>
        <p className="mb-4 text-sm text-zinc-400">{excerpt}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{author}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
      </div>
    </article>
  );
}
```

#### 코드의 변화 살펴보기

**`overflow-hidden`** — `<article>` 자체에 추가. 이미지가 카드 모서리 (rounded-xl) 를 넘어 튀어나오지 않도록 자릅니다.

**`aspect-[3/1]`** — 가로:세로 = 3:1 비율 박스. 이미지 영역의 비율을 고정해서, 이미지가 늦게 로드되어도 레이아웃이 흔들리지 않게 합니다. **임의 값 표기법** (대괄호) 활용.

**`object-cover`** — 이미지가 박스 비율과 다를 때, 박스를 가득 채우면서 비율 유지 (잘리는 부분이 생기지만 깨지지 않음).

**`group-hover:scale-105`** — 카드 호버 시 이미지가 5% 확대됨. 살아있는 듯한 인터랙션을 위한 디테일.

**`<div className="p-5">`** — 이미지 영역에는 패딩을 안 주고, 텍스트 영역만 따로 padding 을 줍니다 (이미지는 카드 끝까지 꽉 차야 보기 좋음).

**조건부 렌더링 패턴 `{coverImage && ...}`** — coverImage 가 있으면 이미지 박스 전체를 그리고, 없으면 아무것도 안 그립니다 (챕터 02 에서 배운 `&&` 패턴).

#### 데이터에 coverImage 추가 — 일부 글에만

`app/page.tsx` 의 `posts` 배열에서 1번과 4번 글에만 `coverImage` 를 추가합니다.

```tsx
const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt: "의존성 배열을 잘못 다루면 무한 루프가 납니다.",
    coverImage: "https://picsum.photos/seed/react/900/300",  // ⭐ 추가
  },
  {
    id: 2,
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt: "API 라우트 없이 서버 함수를 호출하는 새로운 방식.",
    // coverImage 없음 — 옵셔널이라 OK
  },
  {
    id: 3,
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt: "제네릭은 타입을 변수처럼 다루는 도구입니다.",
    // coverImage 없음
  },
  {
    id: 4,
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt: "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법.",
    coverImage: "https://picsum.photos/seed/css/900/300",  // ⭐ 추가
  },
  {
    id: 5,
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt: "조회 성능을 좌우하는 인덱스 설계.",
  },
];
```

> 💡 `picsum.photos` 는 무료 랜덤 이미지 서비스입니다. `seed/{이름}` 으로 같은 이미지를 항상 받을 수 있어요.

#### 옵셔널 prop 의 진가

위 데이터로 화면을 보시면:
- **1번, 4번 글**: 커버 이미지 + 카드 (이미지 있음)
- **2, 3, 5번 글**: 이미지 없는 깔끔한 카드

같은 컴포넌트가 **데이터 유무에 따라 유연하게 적응** 합니다. 이게 옵셔널 prop 의 가치입니다.

> ⚠️ **참고**: 외부 이미지 URL 을 `<img>` 로 바로 쓰면 콘솔에 경고가 뜰 수 있습니다. Next.js 는 `next/image` 사용을 권장하지만, 학습 흐름을 위해 이번 챕터에선 일반 `<img>` 를 사용합니다. props 의 흐름에 집중해주세요.

---

### 최종 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 확인해주세요:

- 5개 글이 **각각 다른 내용** 으로 표시됨
- **1번, 4번 글에만 커버 이미지** 가 있음
- 2, 3, 5번 글은 **이미지 없는 깔끔한 카드**
- 모든 카드 호버 시 보더 + 제목 색 변화
- **이미지 있는 카드는 호버 시 이미지가 살짝 확대** (group-hover:scale-105 의 효과)

여기까지 잘 보이시면 이번 챕터의 목표는 달성되었습니다.

---

## ❓ 흔한 실수

### Q1. `key` prop 을 PostCardProps 타입에 넣으려 함
`key` 는 React 가 가로채는 **특수 prop** 입니다. 타입에 정의할 필요가 없으며, 컴포넌트 내부에서 `key` 로 접근할 수도 없습니다.

### Q2. 스프레드 `{...post}` 했는데 `id` 도 넘어감
동작에는 영향 없습니다. TypeScript 는 PostCardProps 에 정의된 prop 만 인식하고 나머지는 무시합니다. 다만 모르는 prop 을 DOM 요소에 직접 넘기면 React 가 콘솔 경고를 띄울 수 있습니다 (`<article id={1}>` 처럼 DOM 에 닿는 경우). 우리 PostCard 는 `id` 를 DOM 에 넘기지 않으니 OK 입니다.

### Q3. 옵셔널 prop 을 `&&` 없이 그냥 사용
```tsx
// ❌ 위험 — coverImage 가 undefined 일 때 <img src={undefined}> 됨
<img src={coverImage} />

// ✅
{coverImage && <img src={coverImage} />}
```
TypeScript 가 경고하지 않더라도, 런타임에 깨진 이미지 아이콘이 표시될 수 있습니다.

### Q4. `type` 과 `interface` 헷갈림
DevLog 는 `type` 으로 통일합니다. 둘 다 거의 같은 효과를 내니, 편한 것 하나 고르셔서 일관되게 쓰시면 됩니다.

### Q5. props 이름이 데이터 객체 키와 달라서 스프레드가 안 통함
```tsx
// 데이터: { name: '...', when: '...' }
// PostCardProps: { author: string; date: string }

<PostCard {...post} />  // ❌ name, when 은 author, date 자리에 안 들어감
```
→ 이름이 다르면 명시적으로 매핑하셔야 합니다: `<PostCard author={post.name} date={post.when} />`

### Q6. props 타입 import 에러
PostCardProps 를 다른 파일에서 import 하시려면 컴포넌트 파일에서 `export type PostCardProps = ...` 로 export 하셔야 합니다. 그냥 `type PostCardProps = ...` 는 파일 내부에서만 사용 가능합니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] Props 가 무엇이고 왜 필요한지 안다
- [ ] `type` 으로 PostCardProps 같은 타입을 정의할 수 있다
- [ ] 함수 인자 자리에서 `{ title, author }: Props` 형태로 구조분해해서 받을 수 있다
- [ ] 옵셔널 prop (`?`) 의 의미와 `&&` 체크가 왜 필요한지 안다
- [ ] `{...post}` 스프레드 패턴의 동작 조건 (이름 일치) 을 안다
- [ ] http://localhost:3000 에서 5개 글이 각각 다른 내용으로 표시되고, 1번/4번에만 이미지가 있다

---

## ✅ 다음 챕터 예고

> **챕터 05: Children Prop & Layout 패턴**
> 지금까지 본 prop 은 `title`, `author` 같은 **데이터** 였습니다. 다음 챕터에선 다른 종류의 prop — **`children`** — 을 봅니다. 컴포넌트로 다른 컴포넌트나 JSX 를 감싸는 패턴이고, Next.js 의 `app/layout.tsx` 가 활용하는 핵심 개념입니다.
