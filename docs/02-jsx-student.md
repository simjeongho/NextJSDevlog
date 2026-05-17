# 챕터 02: JSX 기초 + App Router 구조

> **시간**: 약 30분 · **블록**: Day 1 / Block 2

---

## 🎯 이 챕터에서 다룰 내용

- JSX 의 기초 문법 (표현식 삽입, 속성, 자식 요소)
- **조건부 렌더링** 3가지 패턴 (`&&`, 삼항, 변수 분리)
- **리스트 렌더링** (`.map()` + `key`)
- Next.js **App Router 폴더 구조** 한 번 투어
- `app/page.tsx` 에 더미 글 목록 5개 렌더링

이번 챕터를 마치면 화면에 글 목록 5개가 표시되는 첫 번째 페이지가 만들어집니다. 디자인은 아직 단순합니다 — 다음 챕터에서 Tailwind 를 입혀나갈 예정입니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `app/page.tsx` — 메인 페이지. 이 챕터에서 처음부터 다시 작성합니다.

---

## 🧠 핵심 개념

### 1. JSX 란?

JSX 는 JavaScript 안에서 **HTML 처럼 마크업을 쓸 수 있게 해주는 문법** 입니다. React 컴포넌트가 화면에 무엇을 그릴지를 표현하는 방식입니다.

```tsx
const element = <h1 className="title">Hello</h1>;
```

이 코드는 사실 다음과 같이 변환됩니다.

```tsx
const element = React.createElement('h1', { className: 'title' }, 'Hello');
```

즉 JSX 는 **`React.createElement` 호출을 보기 좋게 쓰는 문법 설탕(syntactic sugar)** 입니다. 브라우저는 JSX 를 직접 이해하지 못하기 때문에, Next.js 가 빌드 시점에 위와 같은 일반 JavaScript 로 변환해줍니다.

#### JSX 의 4가지 규칙

HTML 과 비슷하지만 몇 가지 다른 규칙이 있습니다.

| 규칙 | HTML | JSX | 이유 |
|---|---|---|---|
| 클래스 속성 | `class="..."` | `className="..."` | `class` 는 JS 의 예약어 |
| 인라인 스타일 | `style="color:red"` | `style={{ color: 'red' }}` | JS 객체로 표현 |
| 닫는 태그 | `<input>` 가능 | `<input />` 필수 | 모든 태그가 명시적으로 닫혀야 함 |
| 한 컴포넌트가 반환하는 최상위 요소 | 여러 개 가능 | **하나여야 함** | 함수가 단일 값만 반환 가능하므로 |

**최상위 요소 규칙 예시**

```tsx
// ❌ 안 됨 — 최상위 요소가 두 개
return (
  <h1>제목</h1>
  <p>본문</p>
);

// ✅ Fragment 로 감싸기 (가장 간결)
return (
  <>
    <h1>제목</h1>
    <p>본문</p>
  </>
);

// ✅ div 로 감싸기 (실제 DOM 요소가 생김)
return (
  <div>
    <h1>제목</h1>
    <p>본문</p>
  </div>
);
```

`<>...</>` 는 **Fragment** 라고 부릅니다. 실제 DOM 에 요소를 추가하지 않고 그룹화만 하는 빈 wrapper 입니다. 굳이 `<div>` 로 감싸지 않아도 될 때 사용하시면 됩니다.

---

### 2. JSX 안에 JavaScript 값 넣기 — 중괄호 `{}`

JSX 안에서 중괄호 `{}` 를 만나면 React 는 **"여기에 JavaScript 표현식이 들어간다"** 라고 이해합니다.

```tsx
const name = '길동';
const age = 25;

return (
  <section>
    <p>{name}님 안녕하세요</p>           {/* 변수 */}
    <p>나이: {age + 1}살이 됩니다</p>     {/* 계산식 */}
    <p>대문자: {name.toUpperCase()}</p>   {/* 메서드 호출 */}
    <p>동전: {Math.random() > 0.5 ? '앞' : '뒤'}</p>  {/* 삼항 연산자 */}
  </section>
);
```

#### 표현식 vs 문장 — 중요한 구분

중괄호 안에는 **표현식(expression)** 만 들어갈 수 있습니다. **문장(statement)** 은 들어갈 수 없습니다.

| 분류 | 예시 | 가능? |
|---|---|---|
| 표현식 | `name`, `age + 1`, `arr.map(...)`, `cond ? a : b` | ✅ |
| 문장 | `if (...) {...}`, `for (...) {...}`, `const x = 1` | ❌ |

> 💡 **표현식** 은 "값으로 평가되는 코드" 이고, **문장** 은 "동작을 수행하는 코드" 입니다. `if` 같은 제어 흐름은 JSX 밖에서 처리한 뒤, 결과만 중괄호 안에 넣는 식으로 사용하시면 됩니다.

---

### 3. 조건부 렌더링 — 3가지 패턴

화면에 무언가를 **조건에 따라 보여주거나 숨기는** 방법입니다. 상황에 따라 가장 깔끔한 패턴을 골라 쓰시면 됩니다.

#### 패턴 ① `&&` — "조건이 참이면 렌더링"

```tsx
{posts.length === 0 && <p>아직 작성된 글이 없습니다</p>}
```

**동작 원리**: JavaScript 의 `&&` 연산자는 왼쪽 값이 truthy 일 때 오른쪽 값을 반환합니다. 왼쪽이 falsy 면 왼쪽 값 자체를 반환하는데, React 는 `false`, `null`, `undefined` 를 **화면에 아무것도 그리지 않음** 으로 처리합니다.

**언제 쓰나**: "조건이 만족될 때만 표시" 하고, **거짓일 때는 아무것도 안 보여주는** 경우.

> ⚠️ **함정**: `{posts.length && <List />}` 처럼 숫자를 쓰시면, `posts.length` 가 `0` 일 때 화면에 `0` 이 그대로 출력됩니다 (React 는 0 을 텍스트로 봄). `posts.length > 0 && ...` 처럼 명시적으로 boolean 비교를 권장드립니다.

#### 패턴 ② 삼항 연산자 — "둘 중 하나"

```tsx
{isLoggedIn ? <UserMenu /> : <LoginButton />}
```

**동작 원리**: `조건 ? 참일때 : 거짓일때` 형식. JavaScript 의 삼항 연산자 그대로입니다.

**언제 쓰나**: 두 가지 결과 중 하나를 반드시 보여줘야 할 때.

#### 패턴 ③ 변수로 분리 — "복잡한 분기"

```tsx
let content;
if (status === 'loading') content = <Spinner />;
else if (status === 'error') content = <ErrorMsg />;
else content = <PostList posts={posts} />;

return <main>{content}</main>;
```

**동작 원리**: JSX 밖에서 `if/else` 로 변수에 담은 뒤, 중괄호로 그 변수만 꽂아 넣습니다.

**언제 쓰나**: 분기가 3가지 이상이라 삼항 중첩이 보기 어려울 때.

#### 세 패턴 비교 — 같은 결과, 다른 표현

세 패턴 모두 **결과는 동일** 합니다. 다만 **읽기 쉬운 패턴이 상황마다 다릅니다**. 단순할수록 `&&` 또는 삼항을, 복잡할수록 변수 분리를 선택하시면 됩니다.

---

### 4. 리스트 렌더링 — `.map()` + `key`

데이터 배열을 받아 화면에 여러 개를 그릴 때 사용합니다. JavaScript 배열 메서드인 `.map()` 으로 각 데이터를 JSX 요소로 변환합니다.

```tsx
const posts = [
  { id: 1, title: 'Hello' },
  { id: 2, title: 'World' },
];

return (
  <ul>
    {posts.map(post => (
      <li key={post.id}>{post.title}</li>
    ))}
  </ul>
);
```

#### 코드의 흐름

1. `posts.map(post => ...)` — 배열의 각 요소(post)에 대해 화살표 함수를 실행 (참고자료 4번)
2. 각 호출의 반환값(`<li>...</li>`)이 새 배열로 모임
3. JSX 의 중괄호 안에 배열을 넣으면 React 가 **배열 안의 모든 요소를 차례로 화면에 그림**

#### `key` 가 왜 필요한가?

`.map()` 으로 그려진 각 요소에는 **`key` 속성** 을 반드시 붙여야 합니다.

```tsx
<li key={post.id}>{post.title}</li>
//   ↑ 이 한 글자가 빠지면 React 가 콘솔에 경고 표시
```

**역할**: React 는 화면을 다시 그릴 때 이전 결과와 새 결과를 비교합니다. 리스트의 요소가 추가/삭제/순서 변경되었을 때 **어떤 요소가 어떤 요소에 대응되는지** 를 React 에게 알려주는 식별자가 `key` 입니다.

지금 단계에선 일단 **"고유한 id 를 key 로 쓴다"** 만 기억해주시면 됩니다. 왜 중요한지, 잘못된 key 가 어떤 버그를 만드는지는 **챕터 11 에서 직접 버그를 체험** 하면서 깊게 다룰 예정입니다.

> ⚠️ **자주 보는 안티패턴**: `key={index}` 로 배열 인덱스를 사용하는 경우가 흔한데, 리스트 순서가 변하거나 중간에 추가/삭제되면 버그의 원인이 됩니다. 가능하면 데이터 자체의 고유 ID 를 사용하시기 바랍니다.

---

### 5. Next.js App Router 폴더 구조

`create-next-app` 으로 만든 직후 폴더가 어떻게 생겼는지 살펴보겠습니다. 핵심은 **`app/` 폴더가 라우팅(URL 경로)의 전부** 라는 점입니다.

```
devlog/
├── app/                     ← App Router 의 루트
│   ├── layout.tsx           ← 모든 페이지를 감싸는 공통 레이아웃
│   ├── page.tsx             ← '/' 경로의 페이지
│   ├── globals.css          ← 전역 CSS (Tailwind 도 여기서 import)
│   └── favicon.ico
├── docs/                    ← 학습자 참고자료
├── public/                  ← 정적 파일 (이미지 등)
├── next.config.ts           ← Next.js 설정
├── tailwind.config.ts       ← Tailwind 설정
├── tsconfig.json            ← TypeScript 설정
└── package.json
```

#### 파일 기반 라우팅 규칙

App Router 의 가장 강력한 특징은 **폴더 이름이 곧 URL 경로** 가 된다는 점입니다.

| 폴더 구조 | 접근 URL |
|---|---|
| `app/page.tsx` | `/` |
| `app/about/page.tsx` | `/about` |
| `app/posts/page.tsx` | `/posts` |
| `app/posts/[slug]/page.tsx` | `/posts/내-첫-글` (동적, 챕터 13) |
| `app/dashboard/page.tsx` | `/dashboard` (챕터 17) |

#### 두 가지 핵심 파일

- **`page.tsx`** — 그 경로에서 실제로 보여줄 페이지. **이 파일이 있어야 그 경로가 살아있습니다.**
- **`layout.tsx`** — 그 경로와 하위 경로 모두를 감싸는 공통 UI (헤더, 푸터 등). 페이지가 바뀌어도 layout 은 유지됩니다.

> 💡 **왜 이런 구조인가**: 폴더 구조만 봐도 사이트 전체 구조가 한눈에 들어옵니다. 라우팅 설정 파일을 따로 만들 필요가 없어요. Next.js 13 부터 도입된 App Router 의 큰 장점입니다.

---

## 🛠 실습 — `app/page.tsx` 처음부터 다시 작성

`create-next-app` 이 만들어준 `app/page.tsx` 의 기본 템플릿 (Next.js 로고와 링크들이 들어있을 것입니다) 을 모두 지우고, 아래 코드로 교체해주세요.

```tsx
// app/page.tsx
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
    <main>
      <h1>DevLog</h1>
      <p>개발자를 위한 학습 기록 플랫폼</p>

      {posts.length === 0 ? (
        <p>아직 작성된 글이 없습니다</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <span>[{post.tag}]</span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <small>
                {post.author} · {post.date}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

### 코드 한 줄 한 줄 의미 짚기

이 파일이 무엇을 하는지 부분별로 살펴보겠습니다.

#### ① 더미 데이터 정의

```tsx
const posts = [ { id: 1, title: "...", ... }, ... ];
```

- 5개의 글 데이터를 JavaScript 배열로 정의합니다.
- 각 글은 `id`, `title`, `author`, `date`, `tag`, `excerpt` 6개 필드를 가진 객체입니다.
- 실제 서비스에선 DB 에서 가져오겠지만, 지금은 학습을 위해 **하드코딩** 했습니다. 챕터 15 에서 PostgreSQL 로 교체될 예정입니다.

#### ② 컴포넌트 함수 정의

```tsx
export default function HomePage() {
  return ( ... );
}
```

- React 컴포넌트는 **JSX 를 반환하는 함수** 입니다. 그 이상도 이하도 아닙니다.
- `export default` 는 "이 파일의 대표 export" 를 의미합니다. App Router 에서 **`page.tsx` 의 default export 가 그 경로의 페이지** 가 됩니다.
- 함수 이름 (`HomePage`) 은 자유롭게 지으셔도 됩니다. App Router 는 함수 이름이 아니라 default export 인지 만 봅니다.

#### ③ 조건부 렌더링 — 글이 있을 때 vs 없을 때

```tsx
{posts.length === 0 ? (
  <p>아직 작성된 글이 없습니다</p>
) : (
  <ul>...</ul>
)}
```

- 삼항 연산자를 사용해 두 가지 화면을 분기합니다.
- 글이 0개면 안내 문구, 1개 이상이면 목록을 표시합니다.
- 이번 데이터는 5개라 항상 `<ul>` 이 표시되지만, 빈 상태 대비 코드를 미리 넣어두는 게 좋은 습관입니다.

#### ④ 리스트 렌더링

```tsx
{posts.map((post) => (
  <li key={post.id}>
    ...
  </li>
))}
```

- `posts` 배열의 각 글에 대해 `<li>` 요소를 생성합니다.
- 화살표 함수 `(post) => (...)` 가 각 항목을 받아 JSX 로 변환합니다.
- `key={post.id}` — 각 항목에 고유 식별자 부착. React 가 효율적으로 변경 사항을 추적하는 데 사용됩니다.

#### ⑤ 각 글 내부 구성

```tsx
<li key={post.id}>
  <span>[{post.tag}]</span>      {/* 태그 — [React] 같은 형태 */}
  <h2>{post.title}</h2>           {/* 제목 */}
  <p>{post.excerpt}</p>           {/* 요약 */}
  <small>
    {post.author} · {post.date}   {/* 작성자 · 날짜 */}
  </small>
</li>
```

- 각 `{}` 안에서 JavaScript 표현식 (객체 속성 접근) 으로 값을 꺼내 화면에 넣습니다.
- HTML 의 의미론적 태그 (`<h2>`, `<p>`, `<small>`) 를 의도에 맞게 사용합니다.

---

### 동작 확인

VSCode 의 터미널에서 개발 서버를 실행해주세요.

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 다음을 확인해주시기 바랍니다.

- 5개의 글이 목록으로 표시되는가
- 각 글에 태그, 제목, 요약, 작성자, 날짜가 모두 나오는가

디자인은 아직 단순한 HTML 그대로입니다. 다음 챕터에서 Tailwind 로 입혀나갈 예정이니, **지금은 데이터가 잘 보이는지만 확인** 하시면 됩니다.

#### 빈 상태도 한 번 확인해보세요

`posts` 배열을 잠깐 `[]` (빈 배열) 로 바꿔서 새로고침하시면 "아직 작성된 글이 없습니다" 가 표시됩니다. 조건부 렌더링이 잘 동작하는지 확인하신 뒤, 원래대로 5개 데이터를 복원해두시기 바랍니다.

---

## ❓ 흔한 실수

### Q1. `class="..."` 라고 썼다가 빨간 줄
JSX 에서는 **`className`** 입니다. JavaScript 의 예약어 `class` 와 충돌을 피하려는 React 의 선택입니다. 머슬 메모리가 잡힐 때까지 자주 틀리는 부분입니다.

### Q2. JSX 안에서 `if` 문 쓰려다 에러
JSX 의 중괄호 안에는 **표현식만** 들어갈 수 있습니다. `if` 는 문장이라 사용할 수 없습니다. **삼항 연산자**, **`&&`**, 또는 **JSX 밖에서 if 로 변수에 담은 뒤 그 변수만 꽂는** 방식을 사용하시면 됩니다.

### Q3. `key` 빼먹어서 콘솔에 빨간 경고
`.map()` 으로 그리는 각 요소에는 `key` 가 필수입니다. 동작 자체는 되지만 React 가 효율을 잃습니다. **고유 ID 사용** 권장드립니다. (인덱스를 쓰면 챕터 11 에서 다룰 버그를 만나게 됩니다.)

### Q4. 화면이 빈 페이지로 나옴
`export default` 가 빠졌을 가능성이 높습니다. App Router 에서 `page.tsx` 는 default export 가 필수입니다. 콘솔에 에러 메시지가 표시되어 있는지도 확인해주시기 바랍니다.

### Q5. 최상위 요소를 두 개 반환
```tsx
return (
  <h1>제목</h1>
  <p>본문</p>
);
```
이러면 에러가 납니다. **하나의 요소만 반환** 해야 하므로, `<>...</>` 또는 `<div>...</div>` 로 감싸주세요.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] JSX 의 4가지 규칙 (`className`, `style`, 닫는 태그, 단일 최상위) 을 안다
- [ ] 중괄호 `{}` 안에 들어갈 수 있는 것 / 없는 것을 구분한다
- [ ] 조건부 렌더링 3가지 패턴의 차이를 안다
- [ ] `.map()` 으로 리스트를 그릴 때 `key` 가 왜 필요한지 안다 (자세한 이유는 챕터 11)
- [ ] App Router 의 "폴더 = URL" 매핑 규칙을 안다
- [ ] http://localhost:3000 에서 5개의 글 목록이 보인다
- [ ] `posts = []` 로 바꿨을 때 빈 상태 메시지가 보이는 것을 확인했다

---

## ✅ 다음 챕터 예고

> **챕터 03: 컴포넌트 분리 + Tailwind 기초**
> 지금은 `page.tsx` 하나에 모든 게 들어있습니다. 이걸 PostCard, Header 같은 컴포넌트로 쪼개고, Tailwind 로 다크 테마 디자인을 입혀나갑니다. **"DevLog 답다"** 라는 첫인상이 만들어지는 챕터입니다.
