# 챕터 19: Standalone 빌드 + PM2 배포 (마무리)

> **시간**: 약 30분 · **블록**: Day 2 / Block 6 (마지막)

---

## 🎯 이 챕터에서 다룰 내용

- Next.js 의 **Standalone 빌드** 옵션 이해 (서버 배포 최적화)
- **PM2** 로 Node.js 프로세스 관리
- 환경별 `.env` 분리 (`.env.production`)
- 사내 서버에 띄우는 가장 단순한 형태 시연
- **18챕터 동안 만든 결과물** 을 production 모드로 띄우기

드디어 마지막 챕터입니다. 18챕터 동안 만든 DevLog 를 — 이제 **production 모드로 띄워봅니다.** 개발 모드(`npm run dev`) 와는 다르게, 실제 서비스에 가까운 형태로 동작하는 걸 보실 거예요.

Next.js 의 **Standalone 빌드** 옵션을 켜면, 빌드 결과가 서버 배포에 최적화된 형태로 나옵니다. 그리고 **PM2** 라는 도구로 그 빌드 결과를 띄우고 관리합니다. 회사 서버에 올리시거나 사내 PC 에 24시간 띄워두실 때 모두 같은 패턴입니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `next.config.ts` — `output: "standalone"` 추가 (수정)
- `ecosystem.config.js` — PM2 설정 파일 (신규)

그리고 명령어 위주 — `npm run build`, `node ...`, `pm2 ...` 입니다.

> 💡 **사내 서버 배포 자체는 회사 인프라 정책에 따라 다를 수 있어**, 학습용으로는 **본인 노트북에서 production 모드로 띄우는 시연** 까지만 다룹니다. 실제 서버 배포는 회사 가이드 별도 참고하세요.

---

## 🧠 핵심 개념

### 1. 개발 모드 vs Production 모드

지금까지 우리는 `npm run dev` 로만 앱을 띄웠습니다. 개발 모드는 편의 기능이 많은 대신 — 무겁고 느립니다.

| 항목                  | `npm run dev` (개발)   | `npm run start` (production) |
| --------------------- | ---------------------- | ---------------------------- |
| 코드 변경 감지        | ✅ 자동 새로고침 (HMR) | ❌ 없음                      |
| 에러 메시지           | 상세, 스택 트레이스    | 간결 (사용자 노출 최소화)    |
| 번들 크기             | 큼 (소스맵 포함)       | 작음 (압축, minify)          |
| 첫 로딩 속도          | 느림                   | 빠름                         |
| Server Component 캐싱 | 매번 새로              | 적극 캐시                    |

회사 서비스에 띄우는 건 **항상 production 모드** 입니다. 그러려면 먼저 **빌드** 를 해야 합니다.

---

### 2. Next.js 의 빌드 결과물

기본 `npm run build` 의 결과는 `.next/` 폴더에 들어 있어요. 그런데 이 폴더만 서버에 옮긴다고 동작하지 않습니다. **node_modules 와 package.json 도 같이** 있어야 해요. 용량이 크고 (수백 MB), 설정도 번거롭습니다.

#### Standalone 빌드의 가치

```
일반 빌드 (서버에 올릴 것):
.next/                ← 빌드 결과
node_modules/         ← 800MB+ ⚠️
package.json
package-lock.json
public/
→ 위 전부를 서버에 옮겨야 동작

Standalone 빌드 (서버에 올릴 것):
.next/standalone/     ← 자동으로 필요한 것만 모아둠
  ├── server.js       ← 진입점
  ├── node_modules/   ← 정말 필요한 것만 (50MB 수준)
  ├── package.json
  └── .next/

→ standalone 폴더 하나만 서버에 옮기면 동작
```

#### 한 가지 짚을 점 — Standalone 의 정확한 의미

Standalone 은 **"서버에 올릴 파일 묶음을 가볍게 만든다"** 의 의미일 뿐, 우리 앱의 동작 구조와는 무관합니다.

- ❌ 잘못된 이해: "Standalone 이니까 서버랑 클라이언트가 분리됨"
- ✅ 정확한 이해: "어차피 한 Node.js 프로세스가 서버 측 동작을 다 함. Standalone 은 그 프로세스를 띄우기 위한 **파일 묶음의 형태** 일 뿐."

챕터 12 ~ 13 에서 다뤘듯, Next.js 앱은 **웹 서버 + WAS 가 통합된 하나의 Node.js 프로세스** 입니다. Standalone 은 그 프로세스를 실행하는 데 필요한 파일만 추려내는 옵션입니다.

#### 활성화 방법

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

이 한 줄로 끝납니다.

---

### 3. PM2 — Node.js 프로세스 매니저

빌드가 끝나면 `node .next/standalone/server.js` 명령으로 그냥 띄울 수 있어요. 그런데 이 방식엔 문제가 많습니다.

- 터미널 닫으면 꺼짐 → 24시간 운영 불가
- 에러로 죽으면 그냥 멈춤 → 자동 재시작 안 됨
- 모니터링 / 로그 관리 도구 없음
- 메모리 누수 시 대응 불가

**PM2** 가 이 모든 걸 해결합니다. PM2 는 Node.js 의 표준적인 **프로세스 매니저** 예요.

- ✅ 백그라운드 실행 (터미널 닫아도 살아 있음)
- ✅ 죽으면 자동 재시작
- ✅ 실시간 로그 확인 (`pm2 logs`)
- ✅ 메모리/CPU 모니터링
- ✅ OS 부팅 시 자동 시작 등록 가능
- ✅ 여러 앱 동시 관리

회사 서버 운영 환경에서 매우 자주 보실 도구입니다.

#### 핵심 명령어

```bash
pm2 start app.js          # 실행
pm2 list                  # 실행 중 프로세스 목록
pm2 logs                  # 실시간 로그
pm2 stop <id|name>        # 정지
pm2 restart <id|name>     # 재시작
pm2 delete <id|name>      # 삭제
pm2 startup               # OS 부팅 시 자동 시작 등록
```

#### `ecosystem.config.js` 설정 파일

`pm2 start app.js` 처럼 명령줄에 다 적기엔 옵션이 많을 수 있어요. **설정 파일** 로 관리하는 게 표준입니다.

```javascript
// ecosystem.config.js (예시)
module.exports = {
  apps: [
    {
      name: "devlog",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

`pm2 start ecosystem.config.js` 한 번이면 설정 그대로 실행됩니다.

---

### 4. 환경 변수 분리

개발용 `.env` 와 production 용 환경변수는 다를 수 있습니다. NextAuth secret, DB URL 등 — 실무에선 production 값을 별도 관리해요.

#### Next.js 의 `.env` 파일 우선순위

```
.env.production.local  (production 빌드 시 최우선, gitignore)
.env.production        (production 모드)
.env.local             (모든 모드, gitignore)
.env                   (기본)
```

`npm run build` / `npm run start` 시점에는 `.env.production` 과 `.env.production.local` 도 같이 읽힙니다.

#### 빌드 시점 vs 런타임

환경변수가 어느 시점에 주입되는지 구분이 중요합니다.

- **빌드 시점 환경변수**: `NEXT_PUBLIC_*` 로 시작하는 변수. 빌드 결과물에 박혀 들어감 (클라이언트 번들에 포함)
- **런타임 환경변수**: 서버 실행 시점에 주입. PM2 의 `env` 옵션 또는 시스템 환경변수

> 💡 **포인트**: 빌드한 결과물을 다른 서버에 올릴 때, `NEXT_PUBLIC_*` 변수는 **빌드 시점의 값** 이 박혀 있습니다. 환경별로 값이 달라야 한다면 빌드도 환경별로 따로 해야 해요. 반대로 런타임 환경변수는 같은 빌드 결과물에 다른 값을 주입할 수 있습니다.

---

## 🛠 실습 단계

다섯 단계입니다. next.config 수정, build, 직접 실행 테스트, PM2 설치, ecosystem 설정 후 PM2 로 띄우기. 본인 노트북에서 직접 해보세요.

---

### 1. `next.config.ts` 에 standalone 추가

`next.config.ts` 파일을 엽니다.

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ⭐ 추가
};

export default nextConfig;
```

#### 이 파일이 하는 일

`next.config.ts` 는 Next.js 의 **프로젝트 설정 파일** 입니다. 빌드 동작, 라우팅, 이미지 최적화 등 다양한 옵션을 여기서 제어합니다.

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import type { NextConfig } from "next";
```

`NextConfig` 타입을 import. `type` 키워드는 **타입만 가져오기** 의 표시 — 런타임에는 아무 코드도 안 들어갑니다 (트리쉐이킹 대상).

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
};
```

`output: "standalone"` 이 핵심. 이 옵션이 켜져 있으면 `npm run build` 의 결과로 `.next/standalone/` 폴더가 추가로 생성됩니다.

만약 다른 옵션 (예: `images`, `experimental` 등) 이 이미 있다면 그 옆에 한 줄 추가하시면 됩니다.

```typescript
export default nextConfig;
```

설정 객체를 default export. Next.js 가 빌드 시점에 이 파일을 읽어 설정 객체를 가져갑니다.

### Step 01.2 - 19-deploy: step01.2 - 빌드 전 PostCatd Prop 문제 해결하기 Drizzle ORM이 생성한 POST 타입과 맞추기(Null 추가)

** ✅ 본 프로젝트** (`chap-19-deploy` 태그, step01) — `PostCard.tsx` 파일 수정 -> `PostCardProps` 타입 수정

drizzle-orm이 만든

```
// components/PostCard.tsx
type PostCardProps = {
  slug: string;
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  readingTime?: number | null; // null 타입 추가
  coverImage?: string | null; // null 타입 추가
  initialLikes?: number;
};
```

### Step 01.3 - 19-deploy: step01.3 - middleware re-export 구문 명시적으로 import 후 export로 변경(빌드 문제 해결)

** ✅ 본 프로젝트** (`chap-19-deploy` 태그, step01) — `middleware.ts` 파일 수정

```
// 기존 코드
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/write", "/dashboard/:path*"], // ⭐ 보호할 경로
};


// 변경 코드
// middleware.ts
import { default as middleware } from "next-auth/middleware";

export default middleware;

export const config = {
  matcher: ["/write", "/dashboard/:path*"], // ⭐ 보호할 경로
};

```

### Step 01.4 - 19-deploy: step01.4 - React - Suspense 태그로 Login Form 감싸기 -> useSearchParams() 빌드 시점엔 URL이 없기 대문에 클라이언트 훅을 쓰는 페이지는 Suspense로 감싸줘야함

** ✅ 본 프로젝트** (`chap-19-deploy` 태그, step01) — `React-Suspense 훅`

`React Suspense`란?

- `선언적 로딩 상태 관리` : 기존에는 `if(Loading) return <Spinner />`같은 조건문을 컴포넌트마다 작성해야 했다. 하지만 `Suspense`를 사용하면 로딩 로직을 UI 구조 밖으로 분리하는 것이 가능하다.
- `폭포수 현상 방지` : 여러 개의 비동기 데이터를 불러올 때, `Suspense`는 데이터가 준비되는 대로 부분적으로 화면을 채우거나, 전체가 준비될 때까지 기다리는 단꼐를 조절할 수 있게 해준다.
- `React 19의 개선 사항` : react19에서는 서버 사이드 렌더링(SSR)과의 통합이 더 강력해졌다. 서버에서 데이터를 스트리밍할 때, <Suspense> 경계를 기준으로 HTML 조각을 클라이언트에 먼저 보내주고, 뎅터가 준비되면 해당 위치의 HTML을 교체하는 방식이 더 효율적으로 작동한다.

```
// app/login/page.tsx
"use client";

import { Suspense, useState } from "react";  // ⭐ Suspense 추가
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/Container";

// ⭐ 내부 컴포넌트로 분리 (useSearchParams 가 여기로 이동)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    // ... 기존 로직 그대로 ...
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 기존 폼 JSX 그대로 */}
    </form>
  );
}

// ⭐ 페이지는 Suspense 로 LoginForm 을 감싸기만
export default function LoginPage() {
  return (
    <Container>
      <div className="mx-auto max-w-sm py-24">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">로그인</h1>
        <p className="mb-10 text-sm text-zinc-500">
          DevLog 에 로그인하고 학습 기록을 남겨보세요.
        </p>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-900" />}>
          <LoginForm />
        </Suspense>

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

```
//완성 코드

"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/Container";

function LoginForm() {
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
      redirect: false, // ⭐ 직접 리다이렉트 처리
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-300">
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
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
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
  );
}

export default function LoginPage() {
  return (
    <Container>
      <div className="mx-auto max-w-sm py-24">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">로그인</h1>
        <p className="mb-10 text-sm text-zinc-500">DevLog 에 로그인하고 학습 기록을 남겨보세요.</p>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-900" />}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs text-zinc-500">
          <p className="mb-2 font-medium text-zinc-400">데모용 계정</p>
          <p>jeongho / jeongho123</p>
          <p>bob / bob123</p>
          <p>kim / kim123</p>
        </div>
      </div>
    </Container>
  );
}

```

---

### 2. Production Build

이제 빌드해봅시다. 첫 빌드는 좀 시간이 걸려요 — 1~2분 정도.

```bash
npm run build
```

#### 빌드 결과 확인

빌드가 끝나면 `.next/standalone/` 폴더가 생성되어 있을 거예요. 확인해봅시다.

Windows (PowerShell 또는 cmd):

```bash
dir .next\standalone
```

macOS / Linux:

```bash
ls .next/standalone/
```

다음과 같은 구조가 보이면 성공입니다.

```
.next/standalone/
├── .next/
├── node_modules/   ← 자동 추출된 의존성
├── package.json
├── server.js       ← 실행 진입점
└── ...
```

`server.js` 가 실제 진입점입니다. 이 파일을 `node` 로 실행하면 우리 앱이 켜져요.

#### 정적 파일 + public 복사

한 가지 빠진 게 있어요. Standalone 폴더엔 `.next/static` 과 `public/` 이 **자동으로 안 들어갑니다.** 별도로 복사해줘야 해요.

> 💡 **왜 자동이 아닐까?** 정적 파일은 CDN 으로 따로 서빙하는 운영 환경도 많아서, Next.js 가 자동 복사를 안 합니다. 회사 배포 스크립트에는 보통 이 복사 단계가 포함되어 있어요.

Windows PowerShell:

```powershell
Copy-Item -Recurse .next\static .next\standalone\.next\static
Copy-Item -Recurse public .next\standalone\public
```

macOS / Linux:

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

> 💡 **실무 팁**: 매번 손으로 복사하기 번거로우면 `package.json` 의 `scripts` 에 `build` 뒤에 자동 복사 명령을 붙이기도 합니다. 학습용으로는 손으로 한 번 해보는 게 좋아요.

---

### 3. Standalone 직접 실행 테스트

PM2 없이 standalone 이 잘 동작하는지 먼저 확인해봅시다.

```bash
node .next/standalone/server.js
```

콘솔에 다음과 같이 표시되면 OK 입니다.

```
Listening on http://localhost:3000
```

브라우저에서 http://localhost:3000 로 접속해보세요. 글 목록, 로그인, 대시보드 — 모든 기능이 정상 동작하는지 확인합니다. 개발 모드와 화면상의 차이는 거의 없어 보이지만, 실제로는 **production 최적화가 적용된 버전** 이에요.

> 💡 **차이 확인**: dev 모드와 production 의 가장 큰 차이는 **번들 크기와 첫 로딩 속도** 입니다. 브라우저 DevTools 의 Network 탭을 열고 JS 번들 크기를 비교해보세요. production 에서 훨씬 작습니다 (보통 30~50%).

종료는 `Ctrl + C`.

> ⚠️ **환경변수 확인**: `.env.local` 은 dev/prod 모두에서 읽히므로 DATABASE_URL, NEXTAUTH_SECRET 등은 그대로 동작합니다. 만약 production 전용 값을 넣고 싶으시면 `.env.production` 을 따로 만드세요.

---

### 4. PM2 설치 + `ecosystem.config.js`

#### PM2 전역 설치

PM2 는 명령줄 도구라서 전역 설치를 추천합니다.

```bash
npm install -g pm2
```

> 💡 **Windows 권한 이슈**: 전역 설치가 막혀 있으면 **관리자 권한으로 PowerShell 열고** 다시 시도하세요. 또는 `npx pm2` 형태로 임시 실행해도 됩니다.

설치 확인:

```bash
pm2 --version
```

버전 번호가 나오면 정상.

#### ecosystem 파일 생성

프로젝트 루트에 `ecosystem.config.js` 파일을 새로 만듭니다.

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "devlog",
      script: ".next/standalone/server.js",
      cwd: ".",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
```

#### 이 파일이 하는 일

PM2 에게 "이런 옵션으로 우리 앱을 띄워" 라고 알려주는 설정 파일입니다. 명령줄 옵션을 매번 길게 적는 대신 파일 하나로 관리할 수 있어요.

#### 코드 한 줄 한 줄 의미 짚기

```javascript
module.exports = {
  apps: [
    { ... },
  ],
};
```

`apps` 배열 안에 앱들을 정의합니다. 한 PM2 인스턴스가 **여러 앱을 동시에 관리** 할 수 있어요. 우리는 devlog 하나만 띄웁니다.

```javascript
name: "devlog",
```

PM2 의 프로세스 목록에 표시되는 **이름**. `pm2 list`, `pm2 logs devlog`, `pm2 restart devlog` 처럼 이 이름으로 참조합니다.

```javascript
script: ".next/standalone/server.js",
```

실행할 진입점. Standalone 빌드의 결과물입니다.

```javascript
cwd: ".",
```

작업 디렉토리 (current working directory). 프로젝트 루트 기준으로 동작. 환경변수 파일 (`.env.production` 등) 을 찾을 때 이 경로를 기준으로 합니다.

```javascript
env: {
  NODE_ENV: "production",
  PORT: 3000,
  HOSTNAME: "0.0.0.0",
},
```

**런타임 환경변수**. PM2 가 프로세스 띄울 때 이 값들을 환경변수로 주입합니다.

- `NODE_ENV: "production"` — Next.js 가 production 모드로 동작
- `PORT: 3000` — 어떤 포트에 띄울지
- `HOSTNAME: "0.0.0.0"` — **모든 네트워크 인터페이스에서 접근 허용**. 기본값인 `localhost` 면 같은 PC 에서만 접근 가능. `0.0.0.0` 으로 두면 사내 네트워크의 다른 PC 에서 IP 로 접근 가능 (예: `http://192.168.1.x:3000`)

```javascript
instances: 1,
exec_mode: "fork",
```

- `instances: 1` — 한 개 인스턴스만 띄움. 멀티 코어 활용하려면 `"max"` 로 설정해 코어 수만큼 띄울 수 있음 (cluster 모드 필요)
- `exec_mode: "fork"` — 일반 모드. cluster 모드(`"cluster"`) 와 대비됨. 단일 인스턴스에선 fork 가 표준

```javascript
autorestart: true,
max_memory_restart: "500M",
```

- `autorestart: true` — 프로세스가 죽으면 PM2 가 **자동 재시작**. 운영 안정성의 핵심
- `max_memory_restart: "500M"` — 메모리 사용량이 500MB 를 넘으면 자동 재시작. 메모리 누수 대응

---

### 5. PM2 로 실행

이제 PM2 로 띄워봅니다.

```bash
pm2 start ecosystem.config.js
```

콘솔에 다음과 같이 표시됩니다.

```
┌────┬────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name   │ pid      │ cpu  │ memory    │ uptime   │ status   │
├────┼────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ devlog │ 12345    │ 0.5% │ 84.5 MB   │ 3s       │ online   │
└────┴────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

`status` 가 `online` 이면 정상 실행 중.

#### 동작 확인

브라우저에서 http://localhost:3000 로 접속 → 모든 기능 정상 동작 확인.

이때 터미널을 닫아도 PM2 가 백그라운드에서 계속 돌립니다. **이게 진짜 운영 모드** 입니다.

#### PM2 명령어 시연

다음 명령들을 차례로 해보세요.

```bash
# 프로세스 목록 보기
pm2 list

# 실시간 로그 (Ctrl+C 로 빠져나옴 — 프로세스는 계속 실행)
pm2 logs devlog

# 재시작 (무중단에 가까움)
pm2 restart devlog

# 정지 (프로세스 종료, 등록은 유지)
pm2 stop devlog

# 다시 시작
pm2 start devlog

# 완전 삭제 (PM2 목록에서도 제거)
pm2 delete devlog
```

`pm2 list` 로 띄워둔 앱 목록 보고, `pm2 logs` 로 실시간 로그 보고, `pm2 restart` 한 번이면 무중단에 가까운 재시작. 회사 서버에서도 똑같이 동작합니다.

#### OS 부팅 시 자동 시작 (선택)

PC 를 껐다 켜도 PM2 가 자동으로 devlog 를 띄우게 하려면:

```bash
pm2 startup
# 위 명령이 출력하는 또 하나의 명령을 복사 → 관리자 권한으로 실행
pm2 save
```

`pm2 startup` 이 OS 별로 다른 등록 명령을 출력해줘요. 그걸 그대로 실행하면 부팅 자동 시작이 등록됩니다. 그 다음 `pm2 save` 로 현재 상태를 저장하면, 부팅 시 그 상태로 복원됩니다.

> ⚠️ **회사 정책 확인**: 사내 PC 의 부팅 시 자동 실행은 보안 정책에 따라 제한될 수 있습니다. 사내 인프라 가이드나 IT 팀에 먼저 확인하세요.

---

## 🔍 더 알아보기 (선택)

### Docker 로 한 단계 더

Standalone 빌드는 Docker 와 잘 어울립니다. 회사가 컨테이너 환경이라면:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone .
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

이미지 크기가 매우 작아집니다 (200MB 수준). Kubernetes / ECS 등으로 운영하는 환경에 잘 맞아요.

### 사내 SSO 연동

챕터 16 의 NextAuth Credentials Provider 자리에 회사 OAuth / SAML Provider 를 끼워 넣으면 됩니다. NextAuth 가 다양한 Provider 를 **표준 인터페이스로 제공** 하므로, 회사 IdP (Identity Provider) 와 연동이 비교적 깔끔해요.

### 모니터링 / 로그 집계

운영 환경에서 더 챙길 만한 것들:

- **`pm2-logrotate`** — PM2 의 로그 파일 자동 회전 모듈. 로그가 무한히 커지는 걸 방지
- **사내 모니터링** (Datadog, New Relic 등) SDK 추가 — 응답시간, 에러율 추적
- **Sentry** — 에러 추적 전용 서비스. Next.js 와 연동 잘 되어 있음

---

## ❓ 흔한 실수

### Q1. `output: "standalone"` 추가 후 빌드가 안 됩니다

A. Next.js 버전이 너무 낮으면 미지원이에요. 14+ 권장. `package.json` 확인.

### Q2. `node .next/standalone/server.js` 실행 시 파일 없음 / 정적 파일 안 보임

A. `.next/static` 과 `public/` 을 standalone 폴더로 복사 안 하신 경우입니다. 2단계의 복사 명령 실행 확인하세요.

### Q3. PM2 명령어를 인식 못 합니다 (Windows)

A. 전역 설치 경로가 PATH 에 없는 경우. PowerShell 재시작 또는 시스템 PATH 확인. 또는 `npx pm2 ...` 로 임시 실행해보세요.

### Q4. PM2 시작 시 즉시 `errored` 상태가 됩니다

A. `pm2 logs devlog` 로 에러 메시지를 먼저 확인하세요. 환경변수 누락 (DATABASE_URL, NEXTAUTH_SECRET 등) 가능성이 가장 높습니다. `.env.local` 또는 `.env.production` 에 필요한 값이 다 있는지 확인.

### Q5. 다른 PC 에서 사내 IP 로 접근이 안 됩니다

A. 두 가지 확인하세요.

- `ecosystem.config.js` 의 `HOSTNAME: "0.0.0.0"` 설정 확인
- Windows 방화벽에서 3000 포트 인바운드 허용 (제어판 → Windows Defender 방화벽 → 고급 설정)
- 사내 보안 정책에 따라 추가 설정이 필요할 수 있음

### Q6. 빌드 시 `dynamic = "force-dynamic"` 경고가 떠요

A. Server Component 가 매 요청마다 동적 렌더링되는 경우 나오는 경고입니다. 우리 앱은 **사용자별 콘텐츠 (학습 로그, 대시보드)** 가 많아 동적 렌더링이 자연스러워요. 기본적으로 문제 없습니다. 정적 페이지가 많은 앱에서는 캐싱 전략 검토가 필요할 수 있습니다.

### Q7. PM2 가 옛날 빌드 결과로 실행되고 있는 것 같아요

A. 코드 변경 → 다시 빌드 → PM2 재시작이 흐름입니다.

```bash
npm run build
# (정적 파일 복사 다시)
pm2 restart devlog
```

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] **개발 모드 vs production 모드** 의 차이를 설명할 수 있다
- [ ] **`output: "standalone"`** 의 효과 (서버 배포용 파일 묶음 최소화) 를 안다
- [ ] Standalone 빌드 후 `.next/static` 과 `public/` 을 **별도 복사** 해야 하는 이유를 안다
- [ ] **PM2** 의 역할 (백그라운드 실행, 자동 재시작, 로그 관리) 을 안다
- [ ] **`ecosystem.config.js`** 의 주요 옵션 (`name`, `script`, `env`, `autorestart`) 을 이해한다
- [ ] **`HOSTNAME: "0.0.0.0"`** 의 의미 (외부 접근 허용) 를 안다
- [ ] `pm2 start / list / logs / restart / delete` 명령을 사용할 수 있다
- [ ] PM2 로 띄운 DevLog 를 http://localhost:3000 에서 정상 동작 확인 ⭐

---

## 🎉 19챕터 완주를 축하드립니다

12시간의 여정이 여기서 끝납니다. 처음 `create-next-app` 으로 빈 프로젝트를 시작했던 게 까마득하실 거예요. 잠시 돌아봅시다.

### Day 1 — 기초부터 첫 통합까지

**챕터 02 ~ 10: React 기본기**

- JSX, 컴포넌트, Props, State (`useState`)
- 이벤트 핸들링, 조건부 / 리스트 렌더링
- `useEffect`, `useRef`, `useMemo`, 커스텀 훅
- React 의 **리렌더링 모델** — setState 한 컴포넌트와 그 자식들만 리렌더, 부모는 영향 없음

**챕터 11 ~ 13: Next.js 진입**

- 가상 DOM 의 개념과 한계
- **Server Component** — async / await 가 컴포넌트 안에서 자연스럽게 동작
- App Router 와 동적 라우팅 (`[id]`)
- 글 목록 → 글 상세 페이지 흐름

### Day 2 — 풀스택의 완성

**챕터 14 ~ 16: 실제 서비스의 모습**

- **Server Actions** — `form action={함수}` 한 줄로 서버 함수 호출
- **Drizzle ORM + PostgreSQL** — 함수 시그니처는 그대로, 내부만 DB 로 교체
- **NextAuth** — 인증 + 미들웨어 + 다층 방어 (Server Action 내부 재검증)

**챕터 17 ~ 18: 사용자가 좋아하는 부분**

- **잔디밭 대시보드** — SVG 직접 그리기, Recharts 차트, streak 알고리즘
- **Context API + 다크모드** — 서버 상태 vs 클라이언트 상태의 구분

**챕터 19: 사용자에게 도달**

- **Standalone 빌드 + PM2** — production 모드 + 운영 환경

### 12시간에 손에 익히신 것들

- ✅ **React 의 사고 방식** — 상태와 리렌더링, 단방향 데이터 흐름
- ✅ **Server Component 의 진가** — async 함수가 컴포넌트, 훅 없이 깔끔
- ✅ **추상화의 힘** — `lib/posts.ts` 의 시그니처는 그대로, 내부만 mock → DB 로 교체
- ✅ **풀스택 통합** — 웹 서버 + WAS 가 한 Node.js 프로세스로 합쳐진 모델
- ✅ **다층 방어** — 미들웨어(1차) + Server Action 내부 검증(2차)
- ✅ **서버 상태 vs 클라이언트 상태** — 글 목록은 서버, 다크모드 토글은 클라이언트
- ✅ **production 배포** — Standalone 빌드 + PM2 로 24시간 운영 가능

회사 실무에서 마주칠 거의 모든 패턴이 이 프로젝트에 들어 있어요.

### 교육이 끝난 후에도

이 레포는 여러분의 GitHub 에 남아 있을 거예요. 챕터별 태그 (`chap-XX-name`) 가 있어, 언제든 다시 펼쳐보실 수 있습니다.

```bash
git tag -l                       # 모든 태그 보기
git checkout chap-13-data        # 특정 챕터 시점으로 이동
git checkout main                # 다시 최신으로
```

새 기능을 시도해보고 싶으시면 — 기존 코드를 기준으로 자신 있게 변경해보세요. 회사 코드에서도 같은 패턴이 반복됩니다.

긴 시간 함께해 주셔서 감사합니다.
