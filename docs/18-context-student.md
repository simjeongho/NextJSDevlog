# 챕터 18: Context API + 다크모드 + 상태관리 비교

> **시간**: 약 30분 · **블록**: Day 2 / Block 6

---

## 🎯 이 챕터에서 다룰 내용

- React **Context API** 의 개념과 동작 방식
- **`createContext`, `Provider`, `useContext`** 3대 요소
- 챕터 10 의 `useLocalStorage` 와 결합한 **다크모드 토글** 구현
- 외부 상태관리 라이브러리들과의 비교 (개관)
- "Context vs Zustand vs Jotai vs RTK vs TanStack Query" 의 선택 기준

이번 챕터는 **Context API** 입니다. 챕터 16 의 `SessionProvider` 가 사실 Context API 의 한 예였어요. 컴포넌트 트리 깊은 곳까지 props 를 일일이 넘기지 않고, **한 곳에서 값을 정의하고 어디서든 꺼내 쓰는** 패턴입니다.

데모로는 **다크모드 토글** 을 만듭니다. 챕터 10 에서 만든 `useLocalStorage` 와 결합하면 — 새로고침해도 테마가 유지되는, 실제로 쓸 만한 토글이 됩니다.

그리고 마지막으로 — **"언제 Context 쓰고 언제 외부 라이브러리 쓰나"** 의 감각을 짚어드립니다. 회사에서 Zustand, Jotai, Redux Toolkit, TanStack Query 등을 마주치실 텐데, 어떤 상황에 어떤 도구가 적합한지 정리합니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `contexts/ThemeContext.tsx` — 다크/라이트 테마 컨텍스트 (신규)
- `app/layout.tsx` — ThemeProvider 추가 (수정)
- `components/ThemeToggle.tsx` — 테마 토글 버튼 (신규)
- `components/Header.tsx` — 토글 버튼 배치 (수정)

> 💡 **현재 프로젝트는 다크 테마 위주**로 만들어왔어요. 챕터 18 에선 토글 가능하게 만들고, 라이트 테마로의 전환 데모를 보여드립니다. 모든 컴포넌트의 색을 라이트 대응시키는 것까지는 시간상 무리니, **주요 영역만 토글 가능** 하게 만듭니다.

---

## 🧠 핵심 개념

### 1. Props Drilling 의 문제

여러 단계 깊은 컴포넌트에 값을 전달하려고 props 를 줄줄이 넘긴 적 있으실 거예요. 이걸 **props drilling** 이라고 합니다.

중간 컴포넌트들은 그 값에 관심도 없는데 통과만 시켜요. Context 가 이걸 해결합니다.

#### 시각화

```
Props Drilling (문제):
[App]
  ↓ user
[Header]              ← user 안 씀, 그냥 전달
  ↓ user
[Nav]                 ← user 안 씀, 그냥 전달
  ↓ user
[UserMenu]            ← user 안 씀, 그냥 전달
  ↓ user
[Avatar]
  → 마침내 사용

Context (해결):
[App]
  └─ <UserContext.Provider value={user}>
        [Header]      ← user 모름, 통과만
          [Nav]       ← user 모름, 통과만
            [UserMenu] ← user 모름, 통과만
              [Avatar]
                → useContext(UserContext) 로 직접 꺼내 씀 ⭐
```

Context 는 **공급(Provider)** 과 **사용(useContext)** 사이의 중간 단계들이 그 값을 모르고 통과시킬 수 있게 합니다.

---

### 2. Context 의 3대 요소

Context 는 세 가지로 구성됩니다.
- **`createContext`** — 정의
- **`Provider`** — 값 공급
- **`useContext`** — 값 꺼내 쓰기

#### 골격

```tsx
import { createContext, useContext, useState } from "react";

// 1. 정의
type ThemeContextValue = {
  theme: "light" | "dark";
  toggle: () => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);

// 2. Provider — 값 공급
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 사용 — 어디서든 꺼내 씀
function MyButton() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("ThemeProvider 안에서 호출해주세요");

  return <button onClick={ctx.toggle}>{ctx.theme}</button>;
}
```

세 요소가 협력하는 흐름:

```
ThemeProvider 가 useState 로 theme 관리
   ↓
Provider 가 value={...} 로 자식 트리에 공급
   ↓
어떤 깊이의 컴포넌트든 useContext 로 꺼내 씀
```

---

### 3. Context 는 "전역 상태" 가 아니다

여기 흔한 오해가 있어요. **Context = 전역 상태 관리** 라고 생각하시는 분이 계신데, 정확히는 아닙니다.

Context 는 **"props 를 트리 깊은 곳까지 운반하는 도구"** 일 뿐, 상태 관리는 그 안의 useState 가 합니다. 그래서 Context 자체는 가볍지만, 큰 앱에선 단점도 있어요.

#### Context 의 단점

- **모든 자식이 리렌더링**: Provider 의 value 가 바뀌면 useContext 호출하는 **모든** 자식이 리렌더 (React.memo 로 부분 차단 가능하지만 한계)
- **selector 패턴 부재**: "이 부분만 구독" 이 어려움. value 의 일부만 바뀌어도 전체 리렌더
- **여러 도메인 = 여러 Provider**: 인증, 테마, 언어, 모달... 각각 Provider 만들면 트리가 깊어짐 ("Provider Hell")

#### 그래서 외부 라이브러리?

규모가 커지면 다음 도구들 검토:
- **Zustand** — 가벼운 store, selector 지원
- **Jotai** — atom 기반, 잘게 쪼개진 state
- **Redux Toolkit** — 큰 앱, 시간여행 디버깅 필요할 때
- **TanStack Query** — 서버 상태 (캐싱, 동기화) 전문

이 챕터의 다크모드 정도는 Context 로 충분합니다. 외부 라이브러리는 챕터 마지막에서 비교만.

---

### 4. Custom Provider + Custom Hook 패턴

Context 를 외부에 노출하지 않고, **커스텀 훅으로 감싸서 사용** 하는 게 표준 패턴입니다. 챕터 10 의 `useDebounce`, `useLocalStorage` 와 같은 사고 — 외부에선 훅만 쓰고, 내부 구현은 캡슐화.

```tsx
// 외부에 ThemeContext 자체는 export 안 함
// 대신 useTheme 훅만 export

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("ThemeProvider 안에서 호출해주세요");
  return ctx;
}

// 사용 측
function MyButton() {
  const { theme, toggle } = useTheme();  // ⭐ 깔끔
  return <button onClick={toggle}>{theme}</button>;
}
```

#### 이 패턴의 장점

- **사용 측 부담 0**: createContext, useContext 같은 React 상세를 몰라도 사용 가능
- **null 가드 자동**: Provider 밖에서 호출하면 즉시 에러 (디버깅 친화)
- **타입 안정성**: useTheme 반환 타입이 명확

---

## 🛠 실습

네 단계로 진행됩니다.

1. `contexts/ThemeContext.tsx` — Context + Provider + useTheme 훅
2. `app/layout.tsx` — ThemeProvider 추가
3. `components/ThemeToggle.tsx` — 토글 버튼
4. `components/Header.tsx` — 토글 버튼 배치

---

### 1. `contexts/ThemeContext.tsx`

먼저 `contexts/` 폴더를 새로 만들고, 그 안에 `ThemeContext.tsx` 를 만들어주세요.

```tsx
// contexts/ThemeContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

// ⭐ 1. Context 정의
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ⭐ 2. Provider 컴포넌트
export function ThemeProvider({ children }: { children: ReactNode }) {
  // useLocalStorage 로 새로고침해도 유지 (챕터 10 재활용)
  const [theme, setTheme] = useLocalStorage<Theme>("devlog-theme", "dark");

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  // <html> 태그에 클래스 적용 (Tailwind dark: 변형 활용)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ⭐ 3. 커스텀 훅
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme 은 ThemeProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
```

#### 이 모듈이 하는 일

다크/라이트 테마 시스템 전체를 캡슐화합니다.
- **Provider** 가 테마 상태를 localStorage 와 동기화 + `<html>` 클래스 적용
- **useTheme** 훅이 깔끔한 API 로 사용 측에 노출

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

useState (useLocalStorage 안) + useEffect 사용. Client Component 필수.

```tsx
type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};
```

**타입 정의 우선** — 참고자료 8번 리터럴 유니온. theme 이 "light" 또는 "dark" 만 가능.

`ThemeContextValue` 는 Provider 가 공급할 객체의 형태. 세 가지 제공:
- `theme` — 현재 값
- `setTheme` — 직접 설정 (특정 값으로)
- `toggle` — 반대로 토글 (자주 쓰는 패턴이라 따로 제공)

```tsx
const ThemeContext = createContext<ThemeContextValue | null>(null);
```

- **`createContext<T>(default)`** — Context 객체 생성
- **제네릭 `<ThemeContextValue | null>`** — value 타입 또는 null
- **`null` 기본값** — Provider 밖에서 useContext 호출 시 null 반환
- useTheme 의 null 가드에 활용

```tsx
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>("devlog-theme", "dark");
```

**챕터 10 의 useLocalStorage 재사용!** 새 챕터에서 새 훅을 만드는 게 아니라, 이미 만든 도구를 조합합니다.

- 키: `"devlog-theme"` (다른 앱과 충돌 안 나도록 prefix)
- 기본값: `"dark"` (처음 방문자는 다크 테마)
- **양방향 동기화**: theme 변경 → localStorage 자동 저장 / 페이지 로드 → localStorage 에서 자동 복원

```tsx
const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
```

토글 함수. 현재 다크면 라이트로, 라이트면 다크로.

```tsx
useEffect(() => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
  }
}, [theme]);
```

**`<html>` 태그에 클래스 동기화**. Tailwind 의 `dark:` variant 가 이 클래스를 감지해서 색을 변경합니다.

- **`document.documentElement`** — `<html>` 태그 자체
- **useEffect 가 사이드 이펙트**: 챕터 08 패턴. DOM 조작은 useEffect 안에서
- **의존성 `[theme]`**: theme 변경 시에만 클래스 갱신
- **클린업 불필요**: 다음 effect 가 자동으로 덮어쓰니까

```tsx
return (
  <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
    {children}
  </ThemeContext.Provider>
);
```

자식 트리에 `{ theme, setTheme, toggle }` 객체 공급. 자식의 어디에서든 useContext 또는 useTheme 으로 꺼내 쓸 수 있음.

```tsx
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme 은 ThemeProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
```

**커스텀 훅** — useContext 를 직접 노출하지 않고 useTheme 으로 감싸서 제공.

- **null 체크 + 즉시 에러**: 잘못된 사용 (Provider 밖) 을 디버깅 친화적으로 알림
- **반환 타입이 non-null**: TypeScript 가 `ctx` 를 `ThemeContextValue` 로 좁힘. 사용 측에서 안전하게 `.theme`, `.toggle` 접근 가능

#### 여러 훅의 협업 흐름

```
ThemeProvider 마운트
  ↓
useLocalStorage 가 localStorage 에서 theme 복원 ("dark" 또는 "light")
  ↓
useEffect 가 <html class="dark"> 또는 <html class="light"> 적용
  ↓
ThemeContext.Provider 가 { theme, setTheme, toggle } 공급
  ↓
자식에서 useTheme() 호출 → 위 객체 반환
  ↓
자식이 toggle() 호출
  ↓
setTheme("light") → useLocalStorage 가 자동 저장
  ↓
theme 변화 감지 → useEffect 재실행 → <html class="light"> 변경
  ↓
useTheme 호출하는 모든 컴포넌트가 자동 리렌더
```

> 💡 **이 한 파일에서 챕터 07 (useState), 챕터 08 (useEffect), 챕터 10 (useLocalStorage), 챕터 18 (Context) 가 모두 협력합니다.** 각 챕터가 쌓아온 도구의 누적 효과 — 이게 우리 12시간 커리큘럼의 진짜 가치예요.

---

### 2. `app/layout.tsx` 에 ThemeProvider

이제 `app/layout.tsx` 에 ThemeProvider 를 추가해서 앱 전체에 테마 Context 를 공급합니다.

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";  // ⭐
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
      <body className="min-h-screen bg-black text-white antialiased dark:bg-black dark:text-white">
        <AuthProvider>
          <ThemeProvider>  {/* ⭐ 트리 전체 감싸기 */}
            <Header />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### 변화점

- `ThemeProvider` import 추가
- `<AuthProvider>` 안쪽에 `<ThemeProvider>` 중첩

#### Provider 중첩의 의미

```tsx
<AuthProvider>          // SessionProvider — useSession 가능
  <ThemeProvider>       // ThemeContext.Provider — useTheme 가능
    {children}
  </ThemeProvider>
</AuthProvider>
```

**각 Provider 가 자기 Context 의 value 를 트리에 주입** 합니다.

- 자식에서 `useSession()` + `useTheme()` 동시 호출 가능
- 각 Context 가 **독립** — 한쪽 변화가 다른 쪽에 영향 없음

> 💡 **순서는 큰 의미 없음** (`AuthProvider 안의 ThemeProvider` 와 `ThemeProvider 안의 AuthProvider` 둘 다 동작). 다만 한쪽이 다른 쪽 값을 사용한다면 의미가 생깁니다. 우리 두 Provider 는 서로 무관.

#### Provider Hell 의 시작

큰 앱에선 이런 식이 됩니다:

```tsx
<ErrorBoundary>
  <AuthProvider>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <ModalProvider>
            <FeatureFlagProvider>
              {children}
            </FeatureFlagProvider>
          </ModalProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </AuthProvider>
</ErrorBoundary>
```

이걸 **Provider Hell** 이라고 부릅니다. Zustand 같은 라이브러리가 인기있는 이유 중 하나 — Provider 없이 store 사용 가능.

---

### 3. `ThemeToggle` 컴포넌트

테마 전환 버튼입니다. `components/ThemeToggle.tsx` 를 새로 만들어주세요.

```tsx
// components/ThemeToggle.tsx
"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="테마 전환"
      className="rounded-lg border border-zinc-800 px-3 py-2 text-sm transition-colors hover:border-zinc-700 hover:text-white"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
```

#### 이 컴포넌트가 하는 일

useTheme 한 줄로 현재 테마와 토글 함수를 받아서, 버튼 클릭 시 테마 전환.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

useTheme 이 클라이언트 훅. + onClick 이벤트 핸들러도 클라이언트.

```tsx
const { theme, toggle } = useTheme();
```

**구조 분해로 한 줄에 두 가지 받음**. 챕터 10 의 useDebounce, useLocalStorage 와 같은 깔끔한 API.

- `theme` — 현재 값 (이모지 결정용)
- `toggle` — 클릭 핸들러로 사용

```tsx
<button
  type="button"
  onClick={toggle}
  aria-label="테마 전환"
  className="..."
>
  {theme === "dark" ? "🌙" : "☀️"}
</button>
```

- **`type="button"`** — form 안에 있어도 submit 안 되도록
- **`onClick={toggle}`** — useTheme 에서 받은 토글 함수 그대로 전달
- **`aria-label="테마 전환"`** — 접근성. 스크린리더가 버튼의 역할 안내
- **삼항으로 이모지** — 다크면 🌙 (달), 라이트면 ☀️ (해)

#### 컴포넌트가 매우 단순

훅 1개 호출, JSX 한 줄. **복잡한 로직은 훅과 Context 안에 캡슐화**, 컴포넌트는 본 책임 (렌더링) 에만 집중. 챕터 10 의 SearchInput 과 비슷한 사상.

---

### 4. Header 에 토글 배치

기존 `components/Header.tsx` 에 ThemeToggle 을 추가합니다. 챕터 17 이후의 Header 에 대시보드 링크도 있다고 가정합니다.

```tsx
// components/Header.tsx
"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";  // ⭐

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-zinc-900 bg-black/50 backdrop-blur dark:bg-black/50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black shadow-[0_0_16px_rgba(0,217,255,0.3)]">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">DevLog</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />  {/* ⭐ 추가 */}
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-900" />
          ) : session?.user ? (
            <>
              <span className="text-sm text-zinc-400">
                <span className="text-zinc-200">{session.user.name}</span>
                <span className="ml-1 text-zinc-600">님</span>
              </span>
              <Link
                href="/dashboard"
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                📊 대시보드
              </Link>
              <Link
                href="/write"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
              >
                ✏️ 글 작성
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

#### 변화점

- `import ThemeToggle from "./ThemeToggle";` 추가
- nav 의 가장 앞에 `<ThemeToggle />` 배치 (로그인 여부와 무관하게 항상 보임)

가장 앞에 둔 이유: 로그인 상태에 따라 다른 버튼들은 바뀌지만 **테마 토글은 항상 동일** 합니다. 위치 일관성.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 차례로 해보세요.

1. Header 우측에 **🌙 아이콘** 등장
2. **클릭** → ☀️ 으로 변경 + 약간의 시각 변화 (`<html class="light">` 적용됨)
3. **브라우저 개발자 도구** 의 `<html>` 태그 확인 → class 가 dark ↔ light 토글
4. **새로고침** → 라이트 테마 유지 ⭐ (localStorage 영구 저장)
5. 다시 클릭 → 🌙 → 새로고침 → 다크 유지

여기까지 정상 동작하면 이번 챕터의 목표는 달성된 것입니다.

> 💡 **시각 변화가 적은 이유**: 현재 본 프로젝트의 모든 컴포넌트가 다크 색상으로 하드코딩되어 있어서요. **Tailwind 의 `dark:` variant 를 활용해서 컴포넌트들을 라이트/다크 양쪽 대응** 하는 작업은 학습자 추가 과제로 남깁니다. 예를 들어 `bg-zinc-900` 대신 `bg-zinc-100 dark:bg-zinc-900` 식으로 모든 색을 양쪽 정의.

---

## 🔄 외부 상태관리 라이브러리 비교 (개관)

이번 챕터의 마지막은 강의 모드입니다. 회사에서 마주칠 외부 라이브러리들의 차이를 짚어드릴게요.

### 4가지 도구의 비교 표

| 도구 | 패러다임 | 학습 곡선 | 적합한 상황 |
|---|---|---|---|
| **React Context** | Provider/Consumer | 낮음 | 인증, 테마, 언어 등 변화가 적은 앱-wide 값 |
| **Zustand** | Store + 훅 | 낮음 | 가벼운 클라이언트 상태, selector 필요 |
| **Jotai** | Atom | 중간 | 잘게 쪼개진 state, derived state |
| **Redux Toolkit (RTK)** | Reducer + Action | 높음 | 큰 앱, 복잡한 상태 흐름, 시간 여행 디버깅 |
| **TanStack Query** | Query/Mutation | 중간 | **서버 상태** (API 데이터 캐싱/동기화) 전문 |

### 각 도구의 사용 예시 한 줄

#### React Context (지금 만든 것)
```tsx
const { theme, toggle } = useTheme();  // Provider 안에서 사용
```

#### Zustand
```tsx
import { create } from "zustand";

const useCountStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

function Counter() {
  const { count, increment } = useCountStore();  // Provider 불필요!
  return <button onClick={increment}>{count}</button>;
}
```

**Provider Hell 해결** — store 만 import 하면 끝.

#### Jotai
```tsx
import { atom, useAtom } from "jotai";

const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**원자(atom) 단위로 상태 분할** — useState 와 유사한 API.

#### Redux Toolkit
```tsx
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
  },
});

function Counter() {
  const value = useSelector((s) => s.counter.value);
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(increment())}>{value}</button>;
}
```

**구조적이고 예측 가능**, 그러나 boilerplate 많음.

#### TanStack Query
```tsx
function Posts() {
  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetch("/api/posts").then(r => r.json()),
  });

  if (isLoading) return <Skeleton />;
  return <PostList posts={data} />;
}
```

**서버 데이터 전문** — 캐싱, 재요청, optimistic update 자동.

### 선택 가이드

```
앱 전역 + 가끔 변화 (테마, 인증 사용자)
  → Context 충분 ✓

클라이언트 상태가 많고 selector 필요 (필터, UI 토글)
  → Zustand

state 가 잘게 쪼개져야 하고 derived 가 많음
  → Jotai

대규모 + 팀 컨벤션이 Redux 위주
  → RTK

서버 데이터 캐싱/재요청/optimistic update
  → TanStack Query
```

### 가장 중요한 통찰 — 서버 상태 vs 클라이언트 상태

여기서 가장 중요한 건 **'서버 상태' 와 '클라이언트 상태' 를 구분** 하는 것입니다.

- **글 목록** = 서버 상태 (DB 에 있는 진실)
- **다크모드 토글** = 클라이언트 상태 (브라우저에만 존재)
- **검색어 입력** = 클라이언트 상태
- **로그인 사용자 정보** = 서버 상태 (NextAuth 가 캐싱)

**서버 상태는 TanStack Query 가 거의 표준**이고, **클라이언트 상태는 Context/Zustand/Jotai 중 선택**. 큰 앱은 두 도구를 같이 씁니다 (서버 상태용 + 클라이언트 상태용).

### 우리 DevLog 에선?

우리는 Next.js App Router 의 **Server Component + Server Actions** 덕분에 서버 상태 관리 라이브러리가 거의 필요 없었습니다:
- 글 목록 → Server Component 가 직접 DB 조회 (TanStack Query 없이도)
- 새 글 작성 → Server Action + revalidatePath
- 캐시 → Next.js 가 자동 관리

**클라이언트 상태** (검색, 필터, 정렬, 좋아요, 타이머, 테마) 도 useState + Context 로 충분했어요. 우리 규모의 앱은 외부 라이브러리 없이도 깔끔하게 만들어집니다.

큰 규모에서 외부 라이브러리가 필요해지는 시점을 알아두시면 됩니다.

---

## ❓ 흔한 실수

### Q1. Provider 밖에서 useContext 사용
value 가 default (null) 로 들어옴 → 사용 측에서 null 접근 에러. **커스텀 훅 안에 null 체크** 가 표준 패턴.

### Q2. Context value 객체를 매 렌더 새로 생성
```tsx
// ❌ 매 렌더 새 객체 → 모든 자식 리렌더
<ThemeContext.Provider value={{ theme, toggle }}>
```
value 가 자주 바뀌면 useMemo 로 안정화. 우리 코드는 toggle 이 자주 안 바뀌니 큰 문제는 없지만, value 가 크고 자주 변하면 성능 이슈.

```tsx
// ✅ useMemo 로 안정화
const value = useMemo(() => ({ theme, toggle }), [theme]);
<ThemeContext.Provider value={value}>
```

### Q3. Tailwind `dark:` variant 가 안 먹힘
Tailwind config 의 `darkMode` 가 `"class"` 모드여야 함 (Next.js 기본 설정). `<html class="dark">` 가 적용되어 있는지 DevTools 로 확인.

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",  // ⭐
  // ...
};
```

### Q4. SSR 시 테마 깜빡임 (FOUC)
첫 로드 시 서버는 dark 로 렌더 → 클라이언트가 useEffect 로 light 적용 → 잠깐 깜빡임. 실무에선 `<html class={...}>` 을 layout 에서 미리 주입하거나 `next-themes` 라이브러리 사용. 학습용으론 무시.

### Q5. 모든 걸 Context 로 만들고 싶어짐
props drilling 이 진짜 문제일 때만 Context. **1~2단계 깊이는 props 가 더 명확**.

### Q6. 여러 Context 를 한 객체에 합침
```tsx
// ❌ 모든 걸 하나에
<AppContext.Provider value={{ user, theme, language, modal, ... }}>
```
어느 하나만 바뀌어도 모든 사용자 리렌더. **도메인별로 Provider 분리** 가 원칙.

### Q7. Provider 안 컴포넌트에서 default 값 의존
```tsx
// ❌ 잘못된 가정
const ThemeContext = createContext({ theme: "dark", toggle: () => {} });
// 이러면 Provider 없이 사용해도 에러 없이 동작 → 디버깅 어려움
```
default 를 `null` 로 두고 useTheme 에서 명시적 에러가 안전.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] **Props Drilling** 의 문제를 안다 (중간 컴포넌트가 통과만 시키는 부담)
- [ ] **Context API 의 3대 요소** (createContext, Provider, useContext) 를 안다
- [ ] **Context ≠ 전역 상태 관리** 임을 안다 (값 전달 도구일 뿐)
- [ ] **Custom Provider + Custom Hook** 패턴의 장점을 안다
- [ ] **null 가드** 가 잘못된 사용을 즉시 잡아주는 이유를 안다
- [ ] **`<html>` 클래스 동기화 + Tailwind `dark:` variant** 의 동작 원리를 안다
- [ ] **챕터 10 의 useLocalStorage** 와 Context 의 자연스러운 결합을 안다
- [ ] **Zustand, Jotai, RTK, TanStack Query** 의 적합 상황을 구분할 수 있다
- [ ] **서버 상태 vs 클라이언트 상태** 의 구분이 중요한 이유를 안다
- [ ] http://localhost:3000 에서 🌙 ↔ ☀️ 토글 + 새로고침 시 유지 확인

---

## ✅ 다음 챕터 예고

> **챕터 19: Standalone 빌드 + PM2 배포** (Day 2 마무리)
> 드디어 마지막 챕터입니다. 지금까지 만든 모든 걸 **회사 서버에 배포** 합니다. Next.js 의 **`standalone` 빌드** 로 가벼운 산출물을 만들고, **PM2** 로 프로세스 관리하면서 무중단 운영을 다룹니다. 그리고 Day 2 전체와 12시간 커리큘럼을 마무리하는 회고로 마칩니다.
