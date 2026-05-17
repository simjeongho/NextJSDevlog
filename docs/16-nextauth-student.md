# 챕터 16: NextAuth + 미들웨어 (인증 + 보호 라우트)

> **시간**: 약 30분 · **블록**: Day 2 / Block 5

---

## 🎯 이 챕터에서 다룰 내용

- **NextAuth v4** 의 기본 구조 이해 (회사가 가장 많이 쓰는 버전)
- **Credentials Provider** — 간단한 ID/비밀번호 로그인 (사내 데모용)
- **세션 관리** — 서버/클라이언트 모두에서 세션 접근
- **`middleware.ts`** — 보호 라우트 (`/write`, `/dashboard`)
- 글 작성 시 **세션 사용자 이름** 을 author 로 저장
- Header 에 로그인/로그아웃 UI

이번 챕터는 인증입니다. 회사 환경에선 SSO 가 표준이지만, 사내망에서 OAuth 콜백이 까다로운 경우가 많아서 오늘은 **Credentials Provider** — 간단한 ID/비밀번호 로그인 — 으로 데모합니다.

실제 SSO 연동도 같은 NextAuth 위에서 Provider 만 바꿔 끼우면 됩니다. **학습 목표는 두 가지** 예요:
1. 세션을 서버와 클라이언트에서 어떻게 가져와 쓰는지
2. `middleware.ts` 로 비로그인 사용자를 어떻게 차단하는지

> 💡 회사 코드에서 자주 보실 패턴입니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `.env` — `NEXTAUTH_SECRET` 추가 (수정)
- `lib/auth.ts` — NextAuth 설정 (신규)
- `app/api/auth/[...nextauth]/route.ts` — NextAuth API 라우트 (신규)
- `app/login/page.tsx` — 로그인 페이지 (신규)
- `middleware.ts` — 보호 라우트 (신규)
- `components/AuthProvider.tsx` — SessionProvider 래퍼 (신규)
- `app/layout.tsx` — AuthProvider 추가 (수정)
- `components/Header.tsx` — 로그인/로그아웃 UI (수정)
- `lib/actions.ts` — 세션 사용자로 글 작성 (수정)

---

## 🧠 핵심 개념

### 1. NextAuth 의 구조

**NextAuth** 는 Next.js 에 인증을 붙이는 가장 표준적인 라이브러리입니다. 이메일/비밀번호, OAuth (구글, GitHub, 카카오 등), SAML 등 **거의 모든 인증 방식을 같은 인터페이스** 로 제공합니다.

#### 핵심 구성 요소

```
1. Provider 정의       → 어떤 방식으로 로그인할지 (Credentials/OAuth/etc)
2. Callbacks           → JWT 생성/세션 직렬화 등 커스터마이즈
3. API 라우트          → /api/auth/[...nextauth]/route.ts (자동 핸들러)
4. SessionProvider     → 클라이언트에서 세션 사용 가능하게
5. getServerSession    → 서버에서 세션 조회
```

이 다섯 가지가 어떻게 협력하는지를 보시면 NextAuth 가 명확해집니다.

---

### 2. Credentials Provider — 간단한 데모용

**Credentials Provider** 는 사용자명/비밀번호를 직접 받아서 검증하는 방식입니다. 사내 데모용으론 충분합니다. 실무에선 보통 OAuth 나 SAML 을 쓰지만 코드 구조는 비슷합니다.

#### 데모용 사용자 (하드코딩)

```typescript
// 실무에서는 DB 의 users 테이블에서 조회
const DEMO_USERS = [
  { id: "1", username: "alice", password: "alice123", name: "앨리스" },
  { id: "2", username: "bob",   password: "bob123",   name: "밥" },
];
```

> ⚠️ **실무 금기**: 비밀번호를 평문 저장은 절대 금지입니다. 이번 챕터는 **학습용 데모**예요. 실제론 bcrypt 등으로 해시 저장 + 비교해야 합니다.

---

### 3. 세션 접근 — 서버 vs 클라이언트

세션 정보를 가져오는 방법이 두 가지 있습니다. **서버 컴포넌트/Action 에선 `getServerSession`**, **클라이언트 컴포넌트에선 `useSession`** 훅. 둘 다 결과는 같은 세션 객체입니다.

#### 서버 측

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ServerPage() {
  const session = await getServerSession(authOptions);
  return <div>안녕하세요, {session?.user?.name ?? "게스트"}</div>;
}
```

#### 클라이언트 측

```tsx
"use client";
import { useSession } from "next-auth/react";

export default function ClientComponent() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>로딩 중...</p>;
  return <div>안녕하세요, {session?.user?.name ?? "게스트"}</div>;
}
```

**같은 NextAuth 시스템 안의 두 입구** 입니다. 서버에선 `getServerSession`, 클라이언트에선 `useSession` — 환경에 맞는 도구를 쓰시면 됩니다.

---

### 4. `middleware.ts` — 보호 라우트

특정 경로에 비로그인 사용자가 접근하면 자동으로 로그인 페이지로 보내고 싶을 때 사용합니다.

`middleware.ts` 는 **모든 요청이 페이지에 도달하기 전에 거치는 관문** 입니다.

#### 동작 흐름

```
사용자가 /write 요청
   ↓
middleware.ts 실행
   ↓
세션 확인
   ├─ 있음 → 그대로 페이지로 통과
   └─ 없음 → /login 으로 redirect (callbackUrl 자동 첨부)
```

NextAuth 가 미들웨어 헬퍼를 제공하므로 **한 줄 import** 로 가능합니다.

#### 클라이언트 체크 vs 미들웨어 — 보안 차이

```tsx
// ❌ 클라이언트에서만 체크하는 방식 (안전하지 않음)
"use client";
useEffect(() => {
  if (!session) router.push("/login");
}, []);
```

이 방식은 **페이지가 이미 브라우저에 도달** 한 후 체크합니다. 그 짧은 시간에 콘텐츠가 잠깐 보일 수도 있고, JS 가 꺼져 있으면 통과되기도 해요.

**미들웨어** 는 페이지가 브라우저에 도달하기 전 서버에서 차단합니다. 진정한 보안의 첫 번째 관문입니다.

---

## 🛠 실습

여덟 단계로 진행됩니다. 빠르게 진행할게요.

1. 패키지 설치 + `NEXTAUTH_SECRET`
2. `lib/auth.ts` — NextAuth 설정
3. API 라우트 핸들러
4. `app/login/page.tsx` — 로그인 페이지
5. `middleware.ts` — 보호 라우트
6. `app/layout.tsx` — SessionProvider 추가
7. Header 에 로그인/로그아웃 UI
8. `lib/actions.ts` — 세션 사용자로 글 작성

---

### 1. 패키지 설치 + `NEXTAUTH_SECRET`

```bash
npm install next-auth@4
```

> 💡 **`@4` 명시**: NextAuth 는 v5 (Auth.js) 가 있지만 베타입니다. 회사에서 안정성을 위해 **v4 가 표준** 이라 명시적으로 설치합니다.

`.env` 파일에 다음 두 줄 추가:

```
NEXTAUTH_SECRET="개발용-임의-시크릿-32자-이상-적당히-길게"
NEXTAUTH_URL="http://localhost:3000"
```

#### 두 환경변수의 역할

**`NEXTAUTH_SECRET`** — JWT 서명용 비밀 키입니다. 이 키로 발급된 토큰을 서버가 검증할 때 사용해요.
- 실무에선 `openssl rand -base64 32` 등으로 안전한 랜덤 문자열 생성
- 학습용으론 임의 문자열 32자 정도면 충분

**`NEXTAUTH_URL`** — NextAuth 가 콜백 URL 등을 만들 때 기준이 되는 주소.
- 개발: `http://localhost:3000`
- 프로덕션: 실제 도메인

---

### 2. `lib/auth.ts` NextAuth 설정

NextAuth 의 핵심 설정 파일입니다. `lib/auth.ts` 를 새로 만들어주세요.

```typescript
// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 데모용 사용자 (실무에선 DB 의 users 테이블 + bcrypt 비교)
const DEMO_USERS = [
  { id: "1", username: "alice", password: "alice123", name: "앨리스" },
  { id: "2", username: "bob", password: "bob123", name: "밥" },
  { id: "3", username: "kim", password: "kim123", name: "김개발" },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = DEMO_USERS.find(
          (u) =>
            u.username === credentials.username &&
            u.password === credentials.password
        );

        if (!user) return null;
        return { id: user.id, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",  // 커스텀 로그인 페이지
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
```

#### 이 모듈이 하는 일

NextAuth 의 동작 방식을 결정하는 **설정 객체** 를 export 합니다. 어떤 인증 방식 (Provider) 을 쓸지, 세션을 어떻게 저장할지, 로그인 페이지가 어디인지 등을 정의합니다.

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import type { NextAuthOptions } from "next-auth";
```

타입만 import. NextAuth 의 설정 객체 타입.

```typescript
import CredentialsProvider from "next-auth/providers/credentials";
```

Credentials Provider import. OAuth Provider 가 필요하면 `next-auth/providers/google`, `next-auth/providers/github` 등으로 바꾸기만 하면 됩니다.

```typescript
const DEMO_USERS = [ ... ];
```

학습용 가짜 사용자 데이터. 실무에서는 이 부분이 **DB 의 users 테이블 조회** 로 교체됩니다.

```typescript
export const authOptions: NextAuthOptions = {
  providers: [ ... ],
  pages: { ... },
  session: { ... },
  callbacks: { ... },
};
```

NextAuth 의 핵심 설정 네 가지:

```typescript
providers: [
  CredentialsProvider({
    name: "Credentials",
    credentials: { ... },
    async authorize(credentials) { ... },
  }),
],
```

- **`name`** — 로그인 페이지에 표시될 Provider 이름
- **`credentials`** — 폼 필드 정의 (기본 로그인 페이지에서 사용. 우리는 커스텀 페이지 만들 거라 큰 의미 없음)
- **`authorize`** — 핵심 검증 함수. NextAuth 가 자동으로 호출

```typescript
async authorize(credentials) {
  if (!credentials?.username || !credentials?.password) return null;

  const user = DEMO_USERS.find(
    (u) =>
      u.username === credentials.username &&
      u.password === credentials.password
  );

  if (!user) return null;
  return { id: user.id, name: user.name };
},
```

**검증 로직**:
- 사용자명/비밀번호가 없으면 `null` 반환 (실패)
- DEMO_USERS 에서 일치하는 사용자 찾기
- 없으면 `null` 반환 (실패)
- 있으면 `{ id, name }` 반환 (성공)

**`null` 반환 = 로그인 실패**, **객체 반환 = 로그인 성공**. NextAuth 가 이 결과를 보고 세션을 만들지 결정합니다.

> 💡 실무에선 `authorize` 안에서 DB 조회 + bcrypt.compare 로 비밀번호 검증. 패턴은 동일.

```typescript
pages: {
  signIn: "/login",
},
```

기본 로그인 페이지 대신 우리가 만든 `/login` 페이지를 사용. 미들웨어가 비로그인 시 이 경로로 자동 리다이렉트합니다.

```typescript
session: {
  strategy: "jwt",
},
```

**JWT 전략** — 세션 정보를 JWT 토큰으로 만들어 쿠키에 저장. 서버 메모리에 세션 저장 안 함 (스케일링 친화).

대안인 `database` 전략은 세션 정보를 DB 에 저장하는데, 별도 어댑터 설정이 필요. JWT 가 단순하고 일반적.

```typescript
callbacks: {
  async session({ session, token }) {
    if (session.user && token.sub) {
      (session.user as { id?: string }).id = token.sub;
    }
    return session;
  },
},
```

세션 객체에 **`user.id`** 추가. 기본 NextAuth 세션엔 name, email 만 있고 id 는 없는데, 우리는 학습 로그 저장 등에 user.id 가 필요해서 추가.

- **`token.sub`** — JWT 의 subject 필드. authorize 가 반환한 id 가 여기 들어감
- **`as { id?: string }`** — TypeScript 한테 "user 객체에 id 가 있을 수 있다" 고 알림

---

### 3. API 라우트 핸들러

NextAuth 가 모든 인증 엔드포인트 (signin, signout, callback 등) 를 자동으로 처리하게 합니다. `app/api/auth/[...nextauth]/route.ts` 경로의 파일을 새로 만들어주세요.

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

#### 폴더 이름 `[...nextauth]` 의 의미

대괄호 + 점 세 개 = **catch-all 라우트**. 챕터 13 의 `[slug]` 가 한 단계만 받았다면, `[...nextauth]` 는 **여러 단계의 경로 모두** 를 받습니다.

```
/api/auth/signin       → 이 핸들러 처리
/api/auth/signout      → 이 핸들러 처리
/api/auth/callback/...  → 이 핸들러 처리
/api/auth/session      → 이 핸들러 처리
/api/auth/csrf         → 이 핸들러 처리
```

**한 파일로 모든 NextAuth 엔드포인트 처리**. NextAuth 가 내부적으로 라우팅합니다.

#### `export { handler as GET, handler as POST };`

같은 핸들러를 GET 과 POST 두 메서드로 export. NextAuth 의 일부 엔드포인트는 GET (세션 조회), 일부는 POST (로그인). 둘 다 같은 함수가 처리합니다.

---

### 4. `app/login/page.tsx` 로그인 페이지

이제 사용자가 실제로 보는 로그인 페이지를 만듭니다.

```tsx
// app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/Container";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,  // 직접 리다이렉트 처리
    });

    setPending(false);

    if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-sm py-24">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">로그인</h1>
        <p className="mb-10 text-sm text-zinc-500">
          DevLog 에 로그인하고 학습 기록을 남겨보세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              아이디
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-cyan-500 px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-500">
          <p className="mb-2 font-medium text-zinc-400">데모용 계정</p>
          <p>alice / alice123</p>
          <p>bob / bob123</p>
          <p>kim / kim123</p>
        </div>
      </div>
    </Container>
  );
}
```

#### 이 페이지가 하는 일

사용자명/비밀번호를 받아 NextAuth 의 `signIn` 함수를 호출합니다. 성공 시 callbackUrl (또는 메인 페이지) 로 이동, 실패 시 에러 메시지 표시.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

useState, useRouter, signIn 모두 클라이언트 훅/함수. Client Component 필수.

```tsx
const router = useRouter();
const searchParams = useSearchParams();
const callbackUrl = searchParams.get("callbackUrl") ?? "/";
```

**Next.js 네비게이션 훅 두 가지**:
- **`useRouter`** — 프로그래밍 방식 페이지 이동 (`router.push("/")`)
- **`useSearchParams`** — URL 쿼리 파라미터 접근

`callbackUrl` 은 미들웨어가 비로그인 시 부착하는 파라미터입니다.
- 비로그인 상태로 `/write` 접근 → 미들웨어가 `/login?callbackUrl=/write` 로 리다이렉트
- 로그인 성공 시 callbackUrl 인 `/write` 로 자동 복귀

이 흐름이 사용자 경험을 매끄럽게 만듭니다.

```tsx
const callbackUrl = searchParams.get("callbackUrl") ?? "/";
```

옵셔널 체이닝 + Nullish Coalescing (참고자료 3번). callbackUrl 이 없으면 `/` 로 fallback.

```tsx
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [pending, setPending] = useState(false);
```

**useState 4개**. 챕터 14 의 글 작성 폼은 Server Action + useFormStatus 로 처리했는데, 여기는 NextAuth 의 `signIn` 함수를 직접 호출해야 해서 클라이언트 상태로 관리합니다.

`pending` 도 직접 관리 — useFormStatus 와 같은 효과를 수동 구현 (signIn 호출 전후로 setPending).

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError("");
  setPending(true);

  const res = await signIn("credentials", {
    username,
    password,
    redirect: false,
  });

  setPending(false);

  if (res?.ok) {
    router.push(callbackUrl);
    router.refresh();
  } else {
    setError("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
}
```

- **`e.preventDefault()`** — 폼 기본 동작 (페이지 새로고침) 막기. 챕터 11 의 합성 이벤트 패턴
- **`signIn("credentials", {...})`** — NextAuth 의 로그인 함수. 첫 인자가 Provider 이름
- **`redirect: false`** — 자동 리다이렉트 끄기. 우리가 직접 라우팅하려고
- **`router.push(callbackUrl)`** — 성공 시 원래 가려던 곳으로
- **`router.refresh()`** — Server Component 들도 새로 렌더링 (세션 정보 반영)

```tsx
<input type="password" autoComplete="current-password" />
```

**`autoComplete="current-password"`** — 브라우저의 비밀번호 매니저 동작을 도움. UX 친화.

```tsx
<p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
  {error}
</p>
```

에러 메시지 박스. 빨간 색조로 시각적 강조.

```tsx
<div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-500">
  <p className="mb-2 font-medium text-zinc-400">데모용 계정</p>
  <p>alice / alice123</p>
  ...
</div>
```

학습 편의용 데모 계정 안내 박스. 실무에선 절대 안 됩니다 (보안). 학습용에 한해.

---

### 5. `middleware.ts` 보호 라우트

비로그인 사용자를 자동으로 차단합니다. 프로젝트 루트 (app 폴더와 같은 레벨) 에 `middleware.ts` 를 만들어주세요.

```typescript
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/write", "/dashboard/:path*"],  // 보호할 경로
};
```

**고작 5줄** 입니다. NextAuth 가 기본 미들웨어를 제공해줘서 import 한 줄로 끝.

#### 코드 한 줄 한 줄 의미 짚기

```typescript
export { default } from "next-auth/middleware";
```

NextAuth 가 만들어둔 기본 미들웨어를 그대로 export. 이 미들웨어가:
- 요청에서 세션 토큰 확인
- 토큰이 없으면 `pages.signIn` 으로 리다이렉트 (`/login`)
- callbackUrl 자동 부착

```typescript
export const config = {
  matcher: ["/write", "/dashboard/:path*"],
};
```

**matcher** — 어떤 경로에 미들웨어를 적용할지 패턴 정의:
- **`/write`** — 정확히 이 경로
- **`/dashboard/:path*`** — `/dashboard` 와 그 하위 모든 경로 (`*` = 0개 이상)

이 외의 경로 (메인, 글 상세 등) 는 미들웨어가 건너뜁니다. 모두에게 공개.

#### 동작 확인

이 시점에서 (서버 띄운 후) `/write` 로 접근하면:
1. 미들웨어 발동 → 세션 없음 확인
2. `/login?callbackUrl=%2Fwrite` 로 자동 리다이렉트
3. 로그인 페이지에서 callbackUrl 을 읽어 보관
4. 로그인 성공 시 `/write` 로 자동 복귀

`useEffect` 로 클라이언트에서 체크하는 방식보다 안전합니다 — 브라우저가 페이지 받기 전에 차단됩니다.

---

### 6. `app/layout.tsx` 에 SessionProvider

클라이언트 컴포넌트에서 `useSession` 을 쓰려면 **SessionProvider** 가 트리 위에 있어야 합니다.

#### 6-1. `AuthProvider` 컴포넌트 만들기

`components/AuthProvider.tsx` 를 새로 만들어주세요.

```tsx
// components/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

#### 왜 별도 컴포넌트로 감싸나?

`SessionProvider` 는 Client Component 입니다. 그런데 `app/layout.tsx` 는 기본이 Server Component.

만약 layout 에서 `SessionProvider` 를 직접 import 하면 Next.js 가 경고합니다 — "Server Component 가 Client Component 를 직접 사용한다" 는 식. 그래서 **한 번 감싼 wrapper** 를 만듭니다.

이런 wrapper 패턴은 NextAuth 뿐 아니라 **다른 Context Provider** (챕터 18 의 ThemeProvider 등) 에도 종종 적용되는 패턴이에요.

#### 6-2. `app/layout.tsx` 수정

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";  // ⭐
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
        <AuthProvider>  {/* ⭐ 트리 전체 감싸기 */}
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### 변화점

- `AuthProvider` import
- Header 와 children 을 `<AuthProvider>` 로 감쌈
- 이제 트리 안의 어떤 클라이언트 컴포넌트에서든 `useSession()` 호출 가능

---

### 7. Header 에 로그인/로그아웃 UI

Header 를 Client Component 로 변환해서 `useSession` 을 사용합니다.

```tsx
// components/Header.tsx
"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-zinc-900 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black shadow-[0_0_16px_rgba(0,217,255,0.3)]">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">DevLog</span>
        </Link>

        <nav className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-900" />
          ) : session?.user ? (
            <>
              <span className="text-sm text-zinc-400">
                <span className="text-zinc-200">{session.user.name}</span>
                <span className="ml-1 text-zinc-600">님</span>
              </span>
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

- **`"use client"`** 추가 (useSession 때문에)
- **세 가지 상태 처리**: 로딩 / 로그인됨 / 비로그인
- 로딩 시 스켈레톤 표시 (깜빡임 방지)
- 로그인 시 사용자 이름 + 글 작성 + 로그아웃
- 비로그인 시 로그인 버튼

#### 코드 한 줄 한 줄 의미 짚기

```tsx
const { data: session, status } = useSession();
```

- **`status`**: `"loading" | "authenticated" | "unauthenticated"`
- **`data`** (= session): 세션 객체 또는 null
- **자동 갱신**: 로그인/로그아웃 시 자동으로 리렌더 — useState 직접 관리 안 해도 됨

```tsx
{status === "loading" ? (
  <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-900" />
) : session?.user ? ( ... ) : ( ... )}
```

**3단계 조건부 렌더링** — 중첩 삼항 연산자:
- 로딩 중 → 스켈레톤 (`animate-pulse`)
- 로그인 → 사용자 정보 + 글 작성 + 로그아웃
- 비로그인 → 로그인 버튼

> 💡 **왜 로딩 스켈레톤?**: 첫 페이지 진입 시 `useSession` 이 세션 확인하는 짧은 시간 동안 "로그인됨" 인지 "비로그인" 인지 모릅니다. 그 사이에 "로그인" 버튼이 잠깐 보였다가 "로그아웃" 으로 바뀌면 깜빡임이 생겨요. 스켈레톤으로 그 깜빡임을 방지합니다.

```tsx
onClick={() => signOut({ callbackUrl: "/" })}
```

**`signOut`** — NextAuth 의 로그아웃 함수. callbackUrl 은 로그아웃 후 이동할 곳.

#### `useSession` 의 내부 동작

`useSession` 은 SessionProvider 가 제공한 React Context 를 구독합니다 — **챕터 18 에서 다룰 Context API 의 실전 활용 예** 이기도 합니다. SessionProvider 가 세션 변경을 감지하면 useSession 호출자 모두가 자동으로 리렌더됩니다.

---

### 8. `lib/actions.ts` 에서 세션 사용자로 글 작성

지금까지 글 작성 시 author 를 `"익명"` 으로 하드코딩했어요. 이제 **로그인된 사용자 이름** 을 사용합니다.

```typescript
// lib/actions.ts (수정)
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";  // ⭐ 추가
import { authOptions } from "./auth";          // ⭐ 추가
import { addPost } from "./posts";

export async function createPost(formData: FormData) {
  // ⭐ 세션 검증 (미들웨어가 1차 차단하지만 Action 도 자체 검증)
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    throw new Error("로그인이 필요합니다.");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tag = formData.get("tag") as string;

  if (!title?.trim() || !content?.trim() || !tag?.trim()) {
    throw new Error("제목, 본문, 태그는 모두 필수입니다.");
  }

  const newPost = await addPost({
    title: title.trim(),
    content: content.trim(),
    tag: tag.trim(),
    author: session.user.name,  // ⭐ "익명" → 세션 사용자
    excerpt:
      content.trim().slice(0, 100) + (content.length > 100 ? "..." : ""),
  });

  revalidatePath("/");
  redirect(`/posts/${newPost.slug}`);
}
```

#### 변화점

- `getServerSession` 과 `authOptions` import
- **함수 시작 시 세션 검증** — 미들웨어가 1차 차단하지만 Action 도 직접 검증
- `author: "익명"` → `author: session.user.name`

#### 왜 Server Action 에서도 세션을 검증하나?

**미들웨어가 이미 비로그인 차단** 하는데 왜 또?

이유 두 가지:
1. **미들웨어 우회 가능성** — 누군가 미들웨어 matcher 를 잘못 설정하거나, Server Action 을 직접 호출하면? 미들웨어가 통과될 수도
2. **세션 정보 사용** — author 에 사용자 이름을 넣으려면 세션 객체를 꺼내야 함

**보안의 원칙: 다층 방어 (Defense in Depth)**. 미들웨어는 1차 방어, Server Action 검증은 2차 방어. 둘 다 있어야 안전합니다.

#### `getServerSession(authOptions)`

서버 환경에서 세션을 가져오는 함수. 클라이언트의 `useSession()` 과 같은 정보를 반환하지만:
- async 함수 (서버에서 쿠키 + JWT 검증)
- 첫 인자로 `authOptions` 필요

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 차례로 해보세요.

#### 비로그인 흐름
1. 메인 페이지 → 우측 상단 **"로그인"** 버튼만 보임
2. 주소창에 `/write` 직접 입력 → **자동으로 `/login?callbackUrl=%2Fwrite` 로 리다이렉트** ⭐
3. 로그인 페이지의 데모 계정 (예: `alice` / `alice123`) 입력 → 로그인
4. 자동으로 `/write` 페이지로 복귀 ⭐ (callbackUrl 의 힘)

#### 로그인 후 흐름
5. Header 우상단에 **"앨리스님 · 글 작성 · 로그아웃"** 표시
6. 글 작성 → 발행 → 새 글에 **author 가 "앨리스"** 로 저장됨 ⭐
7. 메인 페이지 카드와 글 상세 페이지 모두에 "앨리스" 표시
8. **"로그아웃"** 클릭 → 메인 페이지로 + 다시 비로그인 상태

여기까지 정상 동작하면 이번 챕터의 목표는 달성된 것입니다.

---

## ❓ 흔한 실수

### Q1. `NEXTAUTH_SECRET` 누락
```
[next-auth][error][JWT_SESSION_ERROR]
```
`.env` 에 `NEXTAUTH_SECRET` 이 없으면 JWT 서명이 실패합니다. 반드시 설정.

### Q2. `[...nextauth]` 폴더 이름 오타
```
/api/auth/[nextauth]/route.ts  ❌
/api/auth/[...nextauth]/route.ts  ✅
```
점 세 개 + 대괄호. 빠지면 catch-all 이 안 됨.

### Q3. SessionProvider 없이 `useSession` 호출
```tsx
const { data } = useSession();
// 항상 { data: null, status: "unauthenticated" } 반환
```
layout 에 `AuthProvider`(SessionProvider) 추가 누락. 트리 위에 Provider 있어야 함.

### Q4. 미들웨어가 동작 안 함
- `middleware.ts` 가 프로젝트 루트 (app 폴더 옆) 에 있는지 확인 — app 안에 있으면 무시됨
- `matcher` 의 경로가 정확한지 확인
- 서버 재시작 필요할 수도 있음

### Q5. Server Action 에서 세션을 useSession 으로 가져오려 함
```typescript
"use server";
import { useSession } from "next-auth/react";  // ❌
```
Server Action 은 서버. `useSession` 은 클라이언트 훅. **`getServerSession(authOptions)`** 사용.

### Q6. callbackUrl 무한 루프
```
/login?callbackUrl=/login → 로그인 → /login → 또 /login ...
```
미들웨어 matcher 에 `/login` 을 넣으면 발생. **로그인 페이지는 보호 대상이 아님**. matcher 에서 제외.

### Q7. 비밀번호 평문 저장
실무에서 절대 금지. 학습용에 한해. 실제로는 `bcrypt.hash`/`bcrypt.compare` 사용.

### Q8. `router.refresh()` 누락
로그인 후 Server Component 들이 옛날 데이터를 보여줄 수 있습니다. `router.refresh()` 가 Server Component 들도 다시 가져오게 만듭니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] NextAuth 의 5가지 구성 요소 (Provider, Callbacks, API 라우트, SessionProvider, getServerSession) 를 안다
- [ ] **`authorize` 함수** 의 검증 결과 의미 (null = 실패, 객체 = 성공) 를 안다
- [ ] **JWT 전략** vs database 전략의 차이를 안다
- [ ] **서버에서 `getServerSession`**, **클라이언트에서 `useSession`** 의 구분을 안다
- [ ] **`[...nextauth]` catch-all 라우트** 의 동작을 안다
- [ ] **`middleware.ts`** 의 보호 라우트 패턴 (`matcher`) 을 안다
- [ ] **callbackUrl** 흐름 (비로그인 차단 → 로그인 → 원래 페이지 복귀) 을 안다
- [ ] **SessionProvider 를 AuthProvider 로 감싸는 이유** (Server / Client 경계) 를 안다
- [ ] **다층 방어** 의 원칙 — 미들웨어 + Server Action 양쪽에서 세션 검증 — 을 안다
- [ ] http://localhost:3000 에서 로그인/로그아웃/보호 라우트 흐름 모두 정상 동작 확인

---

## ✅ 다음 챕터 예고

> **챕터 17: 잔디밭 + 차트 대시보드** ⭐⭐⭐
> 메인 데모 챕터입니다. **GitHub 스타일 잔디밭** (Contribution Graph) 을 SVG 로 직접 만들고, **Recharts** 로 주간 학습 시간 차트를 띄웁니다. 학습 타이머가 챕터 17 에서 드디어 **DB 와 연결** 되어 학습 시간이 영구 기록되고, 그 데이터가 대시보드에 시각화됩니다. 임원분들께 데모하실 때 가장 호응이 좋을 부분이에요.
