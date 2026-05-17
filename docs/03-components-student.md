# 챕터 03: 컴포넌트 분리 + Tailwind 기초

> **시간**: 약 30분 · **블록**: Day 1 / Block 2

---

## 🎯 이 챕터에서 다룰 내용

- "컴포넌트 분리는 언제 하는가" 의 감각 잡기
- `components/` 폴더에 **PostCard**, **Header** 컴포넌트 만들기
- Tailwind CSS 기본 패턴 (다크 배경, 카드, 호버 효과)
- DevLog 디자인 톤 (시안/라임 액센트) 처음 적용

이번 챕터를 마치면 화면에 다크 테마가 입혀지고, 호버 효과까지 갖춘 카드가 표시됩니다. **"DevLog 답다"** 라는 첫인상이 만들어지는 챕터입니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/PostCard.tsx` — 글 카드 (신규)
- `components/Header.tsx` — 상단 네비게이션 (신규)
- `app/page.tsx` — 위 두 컴포넌트를 사용하도록 수정
- `app/layout.tsx` — 확인만 (변경 거의 없음)

---

## 🧠 핵심 개념

### 1. 컴포넌트 분리는 언제 하는가?

React 에서는 **모든 것을 컴포넌트로 만들 수 있지만, 그래야 한다는 뜻은 아닙니다**. 너무 일찍 분리하면 오히려 코드가 복잡해지고, 적절한 시점에 분리하지 않으면 한 파일이 비대해집니다.

기준은 두 가지입니다 — **재사용** 과 **가독성**.

| 분리해야 할 때 | 그대로 둬도 될 때 |
|---|---|
| 같은 마크업이 두 번 이상 등장 | 한 곳에서만 쓰임 |
| 한 파일이 100줄 넘어가 스크롤해야 보임 | 짧고 응집도 높음 |
| 독립된 책임이 명확히 구분됨 | 항상 같이 변하는 부분 |
| 다른 페이지에서도 쓸 예정 | 이 페이지 전용 |

> ⚠️ **Rule of Three**: 일반적으로 **"두 번 쓰일 때 분리"** 가 적당한 시점입니다. 한 번 쓰일 때 미리 분리하면 추상화가 잘못될 가능성이 높습니다.

이번 챕터의 PostCard 와 Header 는 **앞으로 여러 페이지에서 재사용될 것이 확실** 하기 때문에 미리 분리합니다.

---

### 2. 컴포넌트 만드는 패턴

컴포넌트 분리는 단순합니다. 별도 파일에 함수를 만들고, `export default` 한 뒤, 사용하는 쪽에서 `import` 합니다.

```tsx
// components/PostCard.tsx — 컴포넌트 정의 파일
export default function PostCard() {
  return (
    <article>
      <h2>제목</h2>
      <p>본문</p>
    </article>
  );
}

// app/page.tsx — 사용하는 파일
import PostCard from "@/components/PostCard";

export default function HomePage() {
  return <PostCard />;
}
```

#### `@/` 의 의미

import 경로 앞의 **`@/`** 는 **프로젝트 루트** 를 가리키는 별칭(alias) 입니다. `tsconfig.json` 에 미리 설정되어 있어요.

```tsx
// 절대 경로 (alias 사용)
import PostCard from "@/components/PostCard";

// 상대 경로 (alias 없이)
import PostCard from "../../components/PostCard";
```

상대 경로 (`../../`) 는 파일이 어디 있느냐에 따라 점의 개수가 달라져서 헷갈리기 쉽고, 파일 이동 시 깨지기도 쉽습니다. **alias 를 사용하면 어디서든 같은 경로** 로 import 할 수 있습니다.

#### `export default` vs named export

```tsx
// default export
export default function PostCard() { ... }
import PostCard from "@/components/PostCard";     // 중괄호 없음

// named export
export function PostCard() { ... }
import { PostCard } from "@/components/PostCard"; // 중괄호 있음
```

- **default export** 는 한 파일에 **하나만** 가능. 이름은 import 시 자유롭게 정할 수 있음
- **named export** 는 한 파일에 **여러 개** 가능. import 시 정확한 이름으로 가져와야 함

**DevLog 컨벤션**: 컴포넌트는 `default export` 로 통일합니다. 헬퍼 함수가 여러 개 있을 땐 named export 를 섞어 쓰기도 합니다.

---

### 3. Tailwind CSS 기초 패턴

Tailwind 는 **유틸리티 클래스** 방식의 CSS 프레임워크입니다. 일반 CSS 처럼 별도 클래스를 정의하지 않고, **HTML 안에 미리 정의된 작은 클래스들을 조합** 해서 스타일을 만듭니다.

```tsx
// 일반 CSS 방식
<div className="card">...</div>
// + CSS 파일에서 .card { padding: 16px; background: #111; ... } 따로 작성

// Tailwind 방식
<div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">...</div>
// 클래스 이름 자체가 스타일을 직접 표현
```

#### 가장 많이 쓰는 클래스 분류

| 분류 | 예시 |
|---|---|
| 배경 | `bg-black`, `bg-zinc-900`, `bg-cyan-500/20` |
| 텍스트 색 | `text-white`, `text-zinc-400`, `text-cyan-400` |
| 폰트 | `text-sm`, `text-2xl`, `font-bold`, `font-mono` |
| 여백 | `p-4` (padding), `px-6 py-3`, `m-2`, `gap-4` |
| 레이아웃 | `flex`, `grid`, `grid-cols-3`, `items-center` |
| 보더/모서리 | `border`, `border-zinc-800`, `rounded-xl` |
| 호버 | `hover:bg-zinc-800`, `transition-colors` |
| 반응형 | `md:flex`, `lg:grid-cols-3` |

#### 색상 명명 규칙

```
{색상}-{밝기}/{투명도?}

zinc-900       → 어두운 회색
cyan-400       → 시안색
cyan-500/20    → 시안색 20% 투명도
```

밝기는 `50, 100, 200, ..., 900, 950` 단위로 올라갑니다. 숫자가 클수록 어둡습니다.

#### Tailwind 의 장점

- **CSS 파일을 따로 안 건드림** — 유틸리티 클래스 이름만 갈아끼우면 디자인이 바뀝니다
- **클래스 이름 짓기 고민 X** — `.card`, `.card-header` 같은 이름 짓는 시간이 사라집니다
- **사용 안 하는 클래스는 빌드 시 자동 제거** — 최종 CSS 파일이 매우 가벼움

#### 처음엔 길어 보이지만

```tsx
<article className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
```

처음 보시면 클래스가 너무 길게 느껴지실 수 있습니다. 2시간 정도 작업하시면 손이 외워집니다. 그리고 **CSS 파일과 HTML 파일을 왔다 갔다 안 해도 된다** 는 장점이 매우 큽니다.

---

### 4. 호버 효과와 `group` 패턴

이 챕터에서 처음 만나실 Tailwind 의 흥미로운 패턴입니다.

```tsx
<article className="group ...">
  <h2 className="... group-hover:text-cyan-400">제목</h2>
</article>
```

#### 동작 원리

- 부모에 `group` 클래스를 부여
- 자식에 `group-hover:...` 클래스를 부여
- **부모에 마우스가 올라가면** 자식의 `group-hover:` 스타일이 활성화

#### 왜 유용한가

```tsx
// ❌ 자식 hover 만으로는 부모 영역까지 감지 못함
<article>
  <h2 className="hover:text-cyan-400">  {/* 제목 글자 위에 직접 마우스가 와야만 동작 */}
    제목
  </h2>
</article>

// ✅ group 패턴: 카드 어디에 마우스가 와도 제목 색이 바뀜
<article className="group">
  <h2 className="group-hover:text-cyan-400">제목</h2>
</article>
```

UX 측면에서 카드 전체 영역에 마우스를 올렸을 때 통째로 반응하는 게 자연스럽습니다. `group` 패턴이 이걸 가능하게 해줍니다.

---

## 🛠 실습

이번 챕터는 세 가지 작업입니다.
1. `components/PostCard.tsx` 생성
2. `components/Header.tsx` 생성
3. `app/page.tsx` 수정 (위 두 컴포넌트 사용)

순서대로 따라하시면 됩니다.

---

### 1. `components/PostCard.tsx` 생성

먼저 프로젝트 루트 (`devlog/`) 에 `components/` 폴더를 만들어주세요. 그 안에 첫 번째 컴포넌트 파일을 만듭니다.

```tsx
// components/PostCard.tsx
export default function PostCard() {
  return (
    <article className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <div className="mb-3 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
        React
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
        useEffect 의존성 배열 완전 정복
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        의존성 배열을 잘못 다루면 무한 루프가 납니다.
      </p>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>김개발</span>
        <span>·</span>
        <span>2025-04-30</span>
      </div>
    </article>
  );
}
```

#### 이 컴포넌트가 하는 일

지금은 **데이터를 하드코딩** 했습니다. 제목도 "useEffect 의존성 배열 완전 정복", 태그도 "React" 로 고정. 모든 카드가 똑같이 보일 거예요.

이게 일부러 그런 겁니다. **다음 챕터(04)에서 Props 로 데이터를 받게 만들어서** "다른 내용의 카드"를 띄울 예정입니다. 지금은 **컴포넌트 분리 자체** 에 집중하시기 바랍니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
<article className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
```

- **`<article>`** — 의미론적 HTML 태그. 독립적인 콘텐츠 (블로그 글, 뉴스 기사 등) 에 적합
- **`group`** — 호버 패턴을 위한 표시
- **`rounded-xl`** — 둥근 모서리 (크게)
- **`border border-zinc-800`** — 어두운 회색 1px 보더
- **`bg-zinc-900/50`** — 어두운 회색 50% 투명도 배경 (살짝 비치는 효과)
- **`p-5`** — 안쪽 여백 (padding) 20px (Tailwind 의 1단위 = 4px)
- **`transition-colors`** — 색 변경에 부드러운 트랜지션 (약 150ms)
- **`hover:border-zinc-700`** — 마우스 호버 시 보더 색 변경
- **`hover:bg-zinc-900`** — 마우스 호버 시 배경 색 변경

```tsx
<div className="mb-3 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
  React
</div>
```

- 태그 배지 (badge) 라고 부르는 디자인 요소
- **`mb-3`** — 아래쪽 여백 12px
- **`inline-block`** — 콘텐츠 크기만큼만 차지하는 박스
- **`bg-cyan-500/10`** — 시안색 10% 투명도 (배지 특유의 살짝 빛나는 느낌)
- **`text-cyan-400`** — 글자색 시안

```tsx
<h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
```

- **`group-hover:text-cyan-400`** — 부모 (article) 호버 시 제목이 시안색으로

```tsx
<div className="flex items-center gap-2 text-xs text-zinc-500">
  <span>김개발</span>
  <span>·</span>
  <span>2025-04-30</span>
</div>
```

- **`flex items-center gap-2`** — 가로 배치 + 세로 가운데 정렬 + 8px 간격
- 작성자와 날짜를 가운뎃점 (·) 으로 구분하는 흔한 메타 정보 패턴

---

### 2. `components/Header.tsx` 생성

상단 네비게이션 바를 별도 컴포넌트로 만듭니다.

```tsx
// components/Header.tsx
export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black shadow-[0_0_16px_rgba(0,217,255,0.3)]">
            D
          </div>
          <span className="text-lg font-semibold italic text-white">
            DevLog
          </span>
        </div>

        {/* 메뉴 */}
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="#" className="transition-colors hover:text-white">
            글
          </a>
          <a href="#" className="transition-colors hover:text-white">
            대시보드
          </a>
          <a href="#" className="transition-colors hover:text-white">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
```

#### 이 컴포넌트가 하는 일

상단 네비게이션 바입니다. 좌측에 로고 (시안→라임 그라데이션 + 글로우), 우측에 메뉴 링크 3개가 배치됩니다.

#### 흥미로운 부분 짚기

**`backdrop-blur`** — 헤더 뒤의 배경을 흐리게 처리하는 효과. 스크롤 시 콘텐츠가 헤더 뒤로 비치면서 흐릿하게 보이는, 요즘 디자인에서 자주 보는 패턴입니다 (macOS 의 메뉴바, 모던 웹사이트 등).

**`mx-auto max-w-5xl`** — 가운데 정렬 + 최대 너비 제한. 화면이 아무리 넓어도 헤더 콘텐츠는 1024px 안쪽에만 표시됩니다. 큰 모니터에서도 콘텐츠가 한쪽으로 치우치지 않게 합니다.

**로고의 그라데이션 + 글로우**:
```tsx
className="... bg-gradient-to-br from-cyan-400 to-lime-300 ... shadow-[0_0_16px_rgba(0,217,255,0.3)]"
```
- **`bg-gradient-to-br`** — 좌상단에서 우하단(bottom-right) 으로 그라데이션
- **`from-cyan-400 to-lime-300`** — 시안에서 라임으로
- **`shadow-[0_0_16px_rgba(0,217,255,0.3)]`** — 임의 그림자 (16px 흩어짐, 시안색 30% 투명도). 로고 주위에 부드러운 빛 효과
- **`shadow-[...]`** 같은 대괄호 표기는 Tailwind 의 **임의 값 표기법(arbitrary value)** — 미리 정의된 값 외에 원하는 값을 직접 넣을 때 사용

이 시안→라임 그라데이션은 본 강의 내내 **DevLog 의 시그니처 색상** 으로 일관되게 사용됩니다.

**`<nav>` 태그** — 의미론적 HTML 로 네비게이션 영역임을 명시. 시각적으로는 그냥 `<div>` 와 같지만, 스크린리더나 검색엔진이 "이건 메뉴구나" 라고 인식합니다.

> 💡 메뉴의 `href="#"` 는 임시 입니다. 챕터 13(동적 라우팅), 챕터 17(대시보드) 에서 실제 페이지로 연결할 예정입니다.

---

### 3. `app/page.tsx` 수정

이제 `app/page.tsx` 에서 Header 와 PostCard 를 import 하고, 다크 테마를 입혀줍니다.

```tsx
// app/page.tsx
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            최근 글
          </h1>
          <p className="text-zinc-400">
            개발자들의 학습 기록을 확인하세요
          </p>
        </div>

        <div className="grid gap-4">
          <PostCard />
          <PostCard />
          <PostCard />
        </div>
      </main>
    </div>
  );
}
```

#### 코드의 흐름

1. `Header`, `PostCard` 두 컴포넌트를 import
2. 전체를 `min-h-screen bg-black text-white` 로 다크 테마 wrapper 안에 배치
3. `<Header />` 로 상단 네비 표시
4. `<main>` 안에 "최근 글" 섹션 헤딩 + 카드 3개

#### "PostCard 3개를 모두 같은 데이터로 띄우는 이유"

```tsx
<PostCard />
<PostCard />
<PostCard />
```

PostCard 안의 데이터가 하드코딩되어 있으니, 3개 카드 모두 똑같은 내용이 표시됩니다. 일부러 그렇게 둔 거예요.

- **챕터 02 에서** 더미 5개 데이터로 글 목록을 만들었었습니다
- **이번 챕터에서** 그 데이터를 일단 제거하고 PostCard 3개를 같은 내용으로 띄움
- **다음 챕터(04)에서** Props 로 다시 데이터를 흘려보내 5개 글이 각각 다르게 표시되도록 진화

이렇게 단계별로 진행하는 이유는 **"Props 없이 컴포넌트만 분리하면 다 똑같이 보인다"** 라는 점을 한 번 체감하시고, **Props 의 필요성을 절실히 느끼게** 하기 위함입니다.

#### `<main>` 태그

의미론적 HTML 에서 페이지의 **주요 콘텐츠** 를 감싸는 태그입니다. 한 페이지에 하나만 있어야 합니다 (헤더/푸터 제외). 스크린리더가 "본문으로 건너뛰기" 같은 기능을 제공할 수 있게 됩니다.

#### `tracking-tight`

```tsx
className="... text-4xl font-semibold tracking-tight"
```

**`tracking-tight`** 는 자간(letter-spacing) 을 살짝 좁힙니다. 큰 헤딩에서 자간이 너무 넓으면 흐리멍덩해 보이는데, 살짝 좁히면 묵직한 느낌이 됩니다. 시각적 디테일이지만 전문적인 인상을 만드는 요소입니다.

---

### `app/layout.tsx` 확인

`create-next-app` 이 만들어준 기본 layout 이면 이번 챕터에선 손대지 않으셔도 됩니다. 다만 `body` 에 `bg-black` 같은 클래스가 들어 있다면 제거해주세요 (페이지에서 처리하니까요).

기본 형태는 다음과 같이 생겼을 것입니다:

```tsx
// app/layout.tsx
import type { Metadata } from "next";
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

> 💡 `metadata` 의 `title`, `description` 은 검색엔진과 브라우저 탭에 표시되는 정보입니다. 본인이 원하는 텍스트로 바꾸셔도 됩니다.

`layout.tsx` 와 `children` 의 의미는 **챕터 05 에서 본격적으로** 다룰 예정입니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 확인해주세요:

- 다크 테마 (검정 배경 + 흰 글씨)
- 상단 DevLog 헤더 (시안→라임 그라데이션 로고 + "글 / 대시보드 / About" 메뉴)
- "최근 글" 큰 헤딩 + "개발자들의 학습 기록을 확인하세요" 부제
- 같은 내용의 카드 3개
- **카드에 마우스를 올리시면** 보더 색이 밝아지고 제목이 시안색으로 전환됨 ⭐

호버 효과까지 확인되면 이번 챕터의 목표는 달성된 것입니다.

---

## ❓ 흔한 실수

### Q1. `import PostCard from "components/PostCard"` 에러
앞에 **`@/`** 를 붙여야 합니다 (`@/components/PostCard`). 이건 `tsconfig.json` 의 path alias 입니다.

### Q2. Tailwind 클래스가 안 먹힘
`app/globals.css` 에 다음 세 줄이 있는지 확인해주세요.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`create-next-app` 시 `--tailwind` 옵션을 주셨다면 자동으로 설정되어 있습니다. 그래도 안 보이면 개발 서버를 한 번 재시작해보세요.

### Q3. 컴포넌트 파일명을 소문자로 (`postcard.tsx`) 만듦
동작은 합니다. 하지만 **컴포넌트 파일명은 PascalCase 가 컨벤션** 입니다 (`PostCard.tsx`). 다른 분이 보면 어색하게 느낄 수 있습니다.

### Q4. `export default` 깜빡함
import 시 에러가 납니다. 또는 `import { PostCard }` 형태로 가져와야 합니다 (named export). 더 헷갈리니 **컴포넌트는 default export 로 통일** 하시는 걸 권장드립니다.

### Q5. `group-hover:` 가 동작 안 함
부모 요소에 `group` 클래스를 넣었는지 확인해주세요. 자식의 `group-hover:` 만 있고 부모에 `group` 이 없으면 동작하지 않습니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] `components/` 폴더에 PostCard, Header 두 파일이 있다
- [ ] `@/components/...` 라는 import 경로의 의미를 안다
- [ ] `export default` 와 `named export` 의 차이를 안다
- [ ] Tailwind 의 자주 쓰는 클래스 (배경/텍스트/여백/호버) 의 명명 규칙을 안다
- [ ] `group` + `group-hover:` 패턴이 왜 유용한지 안다
- [ ] http://localhost:3000 에서 다크 테마 + 헤더 + 카드 3개가 보인다
- [ ] 카드에 마우스를 올리면 호버 효과가 동작한다

---

## ✅ 다음 챕터 예고

> **챕터 04: Props + TypeScript 구조분해 할당**
> 지금은 PostCard 3개가 모두 같은 내용입니다. 이걸 5개의 글 데이터를 받아 각각 다르게 보여주는 컴포넌트로 진화시킵니다. Props 와 TypeScript 타입을 함께 적용합니다.
