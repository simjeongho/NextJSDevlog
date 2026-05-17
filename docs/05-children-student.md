# 챕터 05: Children Prop & Layout 패턴

> **시간**: 약 30분 · **블록**: Day 1 / Block 2

---

## 🎯 이 챕터에서 다룰 내용

- React 의 특별한 prop **`children`** 개념 이해
- **Wrapper / Container 패턴** — 컴포넌트로 다른 컴포넌트를 감싸는 방법
- Next.js App Router 의 **`app/layout.tsx`** 활용 (모든 페이지 공통 레이아웃)
- 챕터 03~04 에서 만든 `<Header />` 를 **layout 으로 승격** → 페이지마다 안 적어도 됨

이번 챕터를 마치면 코드 구조가 한층 깔끔해집니다. 같은 화면이지만, **Header 가 자동으로 모든 페이지에 표시되는 구조** 가 만들어집니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/Container.tsx` — children 받는 wrapper (신규)
- `app/layout.tsx` — Header 를 여기로 옮김 (수정)
- `app/page.tsx` — Header 제거 + Container 사용 (수정)

---

## 🧠 핵심 개념

### 1. `children` 이란? — "JSX 사이에 끼워 넣는 prop"

지금까지 본 prop 은 `title="..."` 같이 **태그 속성** 으로 넘기는 방식이었습니다. React 에는 또 다른 prop 전달 방식이 있습니다 — **여는 태그와 닫는 태그 사이에 넣은 내용** 이 자동으로 `children` 이라는 prop 으로 전달됩니다.

#### HTML 에서의 자연스러운 동작

```html
<div>안녕</div>
<!-- div 사이의 "안녕"은 div 의 자식 콘텐츠 -->

<article>
  <h2>제목</h2>
  <p>본문</p>
</article>
<!-- article 사이의 h2, p 가 article 의 자식 -->
```

HTML 에선 너무나 당연한 패턴이죠. React 도 이걸 그대로 흉내 냈습니다.

#### React 에서의 `children`

```tsx
// 부모가 컴포넌트를 사용
<Card>
  <h2>제목</h2>
  <p>본문</p>
</Card>
// ↑ 이 사이의 모든 JSX가 자식 컴포넌트의 children prop 이 됨

// 자식 컴포넌트
function Card({ children }) {
  return <div className="card">{children}</div>;
  //                              ↑ 여기에 들어옴
}
```

`Card` 컴포넌트는 자신을 사용하는 쪽이 어떤 자식을 넣었든 받아서 `<div className="card">` 안에 그려줍니다.

#### 일반 prop 과 children 의 차이

```tsx
// 일반 prop — 정해진 데이터 전달
<Card title="안녕" />

// children prop — 자유로운 JSX 덩어리 전달
<Card>
  <h2>안녕</h2>
  <p>아무거나 넣을 수 있음</p>
  <button>클릭</button>
</Card>
```

- **일반 prop**: 컴포넌트가 미리 정해둔 모양 안에 데이터를 채워 넣음
- **children**: 컴포넌트는 **틀(wrapper)** 만 제공하고, 안에 들어갈 모양은 호출하는 쪽이 자유롭게 결정

children 은 **모양과 내용을 호출하는 쪽이 자유롭게 정할 수 있게** 해주는 강력한 패턴입니다. 그래서 wrapper/container/layout 패턴에 가장 적합합니다.

---

### 2. children 의 TypeScript 타입 — `React.ReactNode`

children 에는 정말 다양한 게 들어올 수 있습니다 — 텍스트, 숫자, JSX 요소, 컴포넌트, 배열, `null`, 심지어 boolean (렌더링 안 됨) 까지.

React 는 이걸 모두 받을 수 있는 타입을 미리 정의해뒀습니다 — **`React.ReactNode`**.

```tsx
type ContainerProps = {
  children: React.ReactNode;  // ⭐ children prop 의 거의 표준
};

function Container({ children }: ContainerProps) {
  return <div className="container">{children}</div>;
}
```

#### 다양한 사용이 모두 가능

```tsx
<Container>안녕</Container>                          // 문자열
<Container>{42}</Container>                          // 숫자
<Container><h1>제목</h1></Container>                  // 단일 JSX
<Container>
  <Header />
  <main>본문</main>
</Container>                                          // 여러 JSX
<Container>{posts.map(p => <Card key={p.id} />)}</Container>  // 배열
```

`React.ReactNode` 는 이 모두를 받아들입니다.

#### `ReactNode` vs `ReactElement` 차이

| 타입 | 받는 범위 | 언제 쓰나 |
|---|---|---|
| `React.ReactNode` | 가장 넓음 (문자열, 숫자, JSX, 배열, null 등) | **기본 선택** |
| `React.ReactElement` | JSX 요소만 | 특수한 경우 (children 이 반드시 한 개의 JSX 여야 할 때) |

대부분의 경우 `ReactNode` 를 쓰시면 됩니다. 외울 필요 없이 복붙해서 사용하세요.

---

### 3. Next.js `app/layout.tsx` — 모든 페이지의 공통 wrapper

지금까지는 `app/page.tsx` 에서 직접 `<Header />` 를 그렸습니다. 그런데 글 상세 페이지, 대시보드 페이지를 추가하시면 매번 `<Header />` 를 적어야 합니다. 번거롭고, 빠뜨릴 수 있고, 헤더 디자인을 바꿀 때 여러 파일을 수정해야 합니다.

Next.js 의 App Router 는 이 문제를 해결하는 표준 방식을 제공합니다 — **`app/layout.tsx`**.

#### `app/layout.tsx` 가 하는 일

```tsx
// app/layout.tsx
export default function RootLayout({
  children,  // ⭐ 여기 children 에 page.tsx 의 내용이 자동으로 들어옴
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Header />                  {/* 모든 페이지 공통 */}
        <main>{children}</main>     {/* 여기에 page.tsx 내용 */}
        <Footer />                  {/* 모든 페이지 공통 */}
      </body>
    </html>
  );
}
```

#### 동작 흐름

```
사용자가 / 로 접속
   ↓
Next.js 가 app/layout.tsx 를 가져옴
   ↓
Next.js 가 app/page.tsx 의 결과물을 layout.tsx 의 children 자리에 끼워 넣음
   ↓
완성된 HTML 화면
```

**`layout.tsx` 는 사실 page.tsx 를 children prop 으로 받는 wrapper 컴포넌트입니다.** 이걸 이해하시면 Next.js 의 layout 시스템이 명확해집니다.

#### `<html>` 과 `<body>` 는 layout 에서만

`layout.tsx` 에는 **반드시 `<html>` 과 `<body>` 태그** 가 들어가야 합니다. page.tsx 에는 들어가면 안 됩니다 (Next.js 가 자동으로 layout 의 html/body 안에 page 내용을 넣기 때문).

#### `metadata` — 페이지 정보

```tsx
export const metadata: Metadata = {
  title: "DevLog",
  description: "개발자를 위한 학습 기록 플랫폼",
};
```

- `title` — 브라우저 탭에 표시되는 제목, 검색 결과의 큰 글씨
- `description` — 검색 결과의 설명 글
- 페이지별로 다르게 설정하려면 각 `page.tsx` 에서도 metadata 를 export 할 수 있습니다 (그 페이지에 한해 layout 의 metadata 를 덮어씀)

---

### 4. 중첩 layout — App Router 의 강력한 기능 (살짝만)

참고로, Next.js 는 폴더마다 `layout.tsx` 를 둘 수 있습니다.

```
app/
├── layout.tsx              ← 모든 페이지에 적용
├── page.tsx                ← / 페이지
└── dashboard/
    ├── layout.tsx          ← /dashboard/* 페이지에만 추가 적용
    ├── page.tsx            ← /dashboard 페이지
    └── stats/
        └── page.tsx        ← /dashboard/stats 페이지
```

페이지 접속 시 layout 이 **위에서부터 차례로 중첩** 됩니다.

```
/dashboard/stats 접속 시:
[app/layout.tsx]
  └─ [app/dashboard/layout.tsx]
       └─ [app/dashboard/stats/page.tsx]
```

예를 들어 대시보드 페이지들에만 추가 사이드바를 두고 싶다면 `app/dashboard/layout.tsx` 에 정의하면 됩니다. 본 강의 프로젝트에선 안 쓰지만 **"이런 게 가능하다"** 정도만 기억해주시면 됩니다.

---

## 🛠 실습

이번 챕터는 세 가지 작업입니다.
1. `Container` 컴포넌트 생성 (children 받는 wrapper)
2. `app/layout.tsx` 에 Header 옮기기
3. `app/page.tsx` 정리 (Header 제거 + Container 적용)

---

### 1. `Container` 컴포넌트 생성

페이지마다 반복되던 `max-width + 좌우 패딩` 패턴을 별도 컴포넌트로 분리합니다.

```tsx
// components/Container.tsx
type ContainerProps = {
  children: React.ReactNode;
};

export default function Container({ children }: ContainerProps) {
  return (
    <div className="mx-auto max-w-5xl px-6">
      {children}
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

- **가운데 정렬** (`mx-auto`)
- **최대 너비 제한** (`max-w-5xl` = 1024px)
- **좌우 패딩** (`px-6` = 24px)
- 그 안에 children 을 그대로 그림

#### 왜 굳이 분리?

지금까지는 `<main className="mx-auto max-w-5xl px-6 py-12">` 처럼 페이지마다 직접 적었습니다. 페이지가 한두 개일 때는 괜찮지만:

- 페이지가 10개 넘어가면 같은 클래스를 매번 복붙
- max-width 를 1024px → 1200px 로 바꾸려면 10곳을 다 수정
- 페이지마다 미묘하게 다른 값이 들어가서 일관성이 깨짐

Container 한 곳으로 모으면 **한 줄만 고치면 모든 페이지가 함께 바뀝니다.** 이게 컴포넌트 분리의 진짜 가치입니다.

#### 코드 한 줄 한 줄 의미

```tsx
type ContainerProps = {
  children: React.ReactNode;
};
```

- children 만 받는 가장 단순한 타입 정의
- `React.ReactNode` 가 표준 children 타입 (앞 핵심 개념 2번 참조)

```tsx
<div className="mx-auto max-w-5xl px-6">
  {children}
</div>
```

- **`mx-auto`** — `margin-left: auto; margin-right: auto;` 즉 가로 가운데 정렬. `max-width` 와 함께 써야 의미가 있음
- **`max-w-5xl`** — 최대 너비 1024px. 화면이 더 넓어도 콘텐츠는 1024px 안쪽
- **`px-6`** — 좌우 패딩 24px. 모바일에서 콘텐츠가 화면 끝에 딱 붙지 않도록
- **`{children}`** — 호출하는 쪽이 넣은 JSX 가 그대로 들어감

---

### 2. `app/layout.tsx` 에 `<Header />` 옮기기

`app/layout.tsx` 를 열어보세요. `create-next-app` 이 만들어준 기본 코드가 있을 것입니다. 여기에 Header 컴포넌트를 넣어서, 앞으로 만들 모든 페이지에 자동으로 Header 가 표시되도록 만듭니다.

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevLog",
  description: "개발자를 위한 학습 기록 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-black text-white antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
```

#### 세 가지 변화점

**① Header import 후 layout 안에서 직접 그림**

```tsx
import Header from "@/components/Header";
// ...
<body>
  <Header />
  {children}
</body>
```

이제부터 **모든 페이지의 children 위쪽에 자동으로 Header 가 표시됩니다.** 글 상세 페이지를 만들든 대시보드를 만들든, layout 이 알아서 Header 를 깔아줍니다.

**② `<body>` 에 다크 테마 클래스 적용**

```tsx
<body className="min-h-screen bg-black text-white antialiased">
```

이전엔 `app/page.tsx` 의 wrapper div 에 들어있던 `bg-black text-white` 가 이제 `<body>` 로 이동했습니다.

- **`min-h-screen`** — 화면 높이만큼 최소 높이 보장 (콘텐츠가 짧아도 다크 배경이 화면 전체)
- **`bg-black`** — 다크 테마 배경
- **`text-white`** — 기본 텍스트 색 (자식 요소가 따로 색을 안 정하면 이 색 상속)
- **`antialiased`** — 폰트 안티앨리어싱 (글자가 부드러워짐)

**③ children 자리에 각 페이지가 자동으로 들어옴**

```tsx
<body>
  <Header />
  {children}   {/* ← 여기에 page.tsx 의 결과가 들어옴 */}
</body>
```

- `/` 접속 → `{children}` 에 `app/page.tsx` 의 JSX 가 들어감
- `/about` 접속 → `{children}` 에 `app/about/page.tsx` 의 JSX 가 들어감 (있다면)
- Next.js 가 자동으로 처리

#### `Readonly<...>` 는 뭔가요?

```tsx
}: Readonly<{ children: React.ReactNode }>) {
```

`Readonly<T>` 는 TypeScript 의 유틸리티 타입으로, **객체의 속성을 읽기 전용** 으로 만듭니다. 컴포넌트 함수 안에서 `props.children = ...` 같은 재할당을 막아 props 의 불변성을 보장합니다.

`create-next-app` 이 자동으로 넣어주는 패턴입니다. 의미만 아시고 그대로 두시면 됩니다.

---

### 3. `app/page.tsx` 정리 — Header 제거 + Container 적용

이제 `app/page.tsx` 에서 Header 와 다크 테마 wrapper 를 빼고, Container 로 감쌉니다.

```tsx
// app/page.tsx
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";

const posts = [
  {
    id: 1,
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt: "의존성 배열을 잘못 다루면 무한 루프가 납니다.",
    coverImage: "https://picsum.photos/seed/react/900/300",
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
    coverImage: "https://picsum.photos/seed/css/900/300",
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
    <Container>
      <div className="py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            최근 글
          </h1>
          <p className="text-zinc-400">개발자들의 학습 기록을 확인하세요</p>
        </div>

        <div className="grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      </div>
    </Container>
  );
}
```

#### 세 가지 변화점

**① `<Header />` 사라짐**

```diff
- import Header from "@/components/Header";
- <Header />
```

layout 이 책임지므로 페이지에서 빼도 됩니다.

**② 다크 테마 wrapper 사라짐**

```diff
- <div className="min-h-screen bg-black text-white">
-   ...
- </div>
+ <Container>
+   ...
+ </Container>
```

layout 의 `<body>` 가 책임지므로 페이지에서 빼도 됩니다.

**③ `<main>` 대신 `<Container>` 사용**

이전 `<main className="mx-auto max-w-5xl px-6 py-12">` 의 역할이 분리되었습니다:
- `mx-auto max-w-5xl px-6` → Container 가 담당
- `py-12` (상하 패딩) → Container 안의 내부 `<div className="py-12">` 가 담당

> 💡 **왜 `<main>` 을 굳이 안 쓰셨나요?** 의미론적으로 `<main>` 을 layout 으로 옮기는 것도 좋은 선택입니다. 다만 우선 단순함을 위해 일반 `<div>` 로 두었습니다. layout 으로 옮기시려면 `app/layout.tsx` 의 `{children}` 을 `<main>{children}</main>` 으로 감싸시면 됩니다.

#### 코드 흐름 정리

이번 챕터 끝의 결과 흐름은 다음과 같습니다.

```
사용자가 / 접속
   ↓
app/layout.tsx 실행
  - <html lang="ko">
  - <body className="min-h-screen bg-black text-white antialiased">
  - <Header />         ← layout 이 자동 표시
  - {children}         ← 여기에 page.tsx 결과 삽입
   ↓
app/page.tsx 실행
  - <Container>        ← 너비 제한 + 패딩
    - <div className="py-12">
      - 최근 글 헤딩
      - PostCard × 5
  - </Container>
   ↓
완성된 HTML 화면
```

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 →

화면은 **챕터 04 와 똑같이 보이면 정상** 입니다. 사용자 입장에서는 변화가 없습니다.

- 다크 테마, 헤더, 카드 5개, 호버 효과 모두 동일

다만 **코드 구조가 깔끔해졌습니다**:
- Header 는 layout 이 자동으로 띄움
- 페이지는 콘텐츠에만 집중
- Container 한 줄로 폭 제한 + 패딩 적용

#### Layout 이 정말 자동인지 확인 (선택 사항)

원하시면 `app/about/page.tsx` 같은 더미 페이지를 임시로 만들어보실 수 있습니다.

```tsx
// app/about/page.tsx (테스트용 — 끝나면 폴더째 삭제)
export default function AboutPage() {
  return <div className="p-8">About 페이지</div>;
}
```

http://localhost:3000/about 접속 시 **Header 가 자동으로 표시되는 것** 을 확인하실 수 있습니다. 이게 layout 의 힘입니다.

확인 후 about 폴더는 삭제하시면 됩니다 (지금 챕터에선 필요 없습니다).

---

## ❓ 흔한 실수

### Q1. `app/layout.tsx` 에 `<html>` 또는 `<body>` 누락
Next.js 가 빌드 시 에러를 발생시킵니다. layout 의 default export 함수는 **반드시 `<html>` 과 `<body>` 를 포함** 해야 합니다.

### Q2. `app/page.tsx` 에도 `<html>` 이나 `<body>` 가 들어감
layout 안에 page 가 들어가는 구조이므로 page 에는 html/body 가 들어가면 안 됩니다. 페이지는 **body 안에 들어갈 콘텐츠만** 그립니다.

### Q3. children 의 타입을 안 정의하고 사용
```tsx
// ❌ children 의 타입이 any 가 됨
function Container({ children }) { ... }

// ✅
function Container({ children }: { children: React.ReactNode }) { ... }
```

### Q4. layout 에 Tailwind 클래스 적용했는데 안 먹힘
`globals.css` 의 import 가 layout 에 있는지 확인해주세요. `import "./globals.css";` 가 layout 의 import 영역에 있어야 합니다 (`create-next-app` 이 기본으로 넣어줍니다).

### Q5. 메타데이터를 페이지마다 다르게 하고 싶음
각 `page.tsx` 에서 `export const metadata: Metadata = { ... }` 를 export 하시면 그 페이지에 한해 layout 의 metadata 가 덮어쓰입니다. 본 강의에선 챕터 13 의 글 상세 페이지에서 자연스럽게 활용하게 됩니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] `children` prop 이 일반 prop 과 어떻게 다른지 안다
- [ ] children 의 TypeScript 타입 `React.ReactNode` 의 의미를 안다
- [ ] `app/layout.tsx` 가 모든 페이지를 어떻게 감싸는지 설명할 수 있다
- [ ] 페이지 접속 시 layout 의 `{children}` 자리에 page 내용이 어떻게 들어가는지 안다
- [ ] http://localhost:3000 에서 챕터 04 와 동일한 화면이 보인다 (변화 없음이 정상)
- [ ] `app/page.tsx` 에 더 이상 `<Header />` 와 `<div className="min-h-screen bg-black">` 이 없다

---

## ✅ 다음 챕터 예고

> **챕터 06: 정적 글 목록 정리 + 부가 컴포넌트** ⭐
> 점심 직전 데모용 챕터입니다. PostCard 외에 TagFilter, EmptyState 같은 부속 컴포넌트들을 추가하면서, 컴포넌트 분리의 진가를 본격적으로 체감하게 됩니다.
