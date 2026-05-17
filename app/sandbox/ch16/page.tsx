// app/sandbox/ch16/page.tsx
"use client";

import { useState } from "react";

// === 데모 ① NextAuth 5가지 구성 요소 ===
function StructureDemo() {
  const parts = [
    {
      name: "Provider",
      desc: "인증 방식 정의 (Credentials, OAuth 등)",
      file: "lib/auth.ts",
    },
    {
      name: "Callbacks",
      desc: "JWT 생성, 세션 직렬화 커스터마이즈",
      file: "lib/auth.ts",
    },
    {
      name: "API Route",
      desc: "자동 핸들러 (signin/signout 등)",
      file: "app/api/auth/[...nextauth]/route.ts",
    },
    {
      name: "SessionProvider",
      desc: "클라이언트에서 useSession 가능",
      file: "components/AuthProvider.tsx",
    },
    {
      name: "getServerSession",
      desc: "Server Component / Action 에서 세션",
      file: "(import)",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">NextAuth 5가지 구성 요소</h3>

      <div className="space-y-2">
        {parts.map((p) => (
          <div key={p.name} className="rounded-lg border border-zinc-800 bg-black/40 p-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm text-cyan-400">{p.name}</span>
              <span className="text-[10px] text-zinc-600">{p.file}</span>
            </div>
            <div className="text-xs text-zinc-400">{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === 데모 ② 서버 vs 클라이언트 세션 접근 ===
function SessionAccessDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">세션 접근 — 환경별 두 가지 방법</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-cyan-400">서버 (Server Component / Action)</div>
          <pre className="text-[10px] text-zinc-400">
            {`import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session?.user) redirect("/login");`}
          </pre>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-lime-400">클라이언트 (use client)</div>
          <pre className="text-[10px] text-zinc-400">
            {`"use client";
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
if (status === "loading") return <Spinner />;
if (!session) return <LoginButton />;`}
          </pre>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 같은 세션 데이터, 환경에 맞는 도구. 미들웨어가 1차 차단, Action 이 2차 검증 (다층 방어).
      </p>
    </div>
  );
}

// === 데모 ③ 보호 라우트 시뮬레이션 ===
function ProtectedRouteDemo() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [path, setPath] = useState<string | null>(null);

  const tryAccess = (route: string, requiresAuth: boolean) => {
    if (requiresAuth && !isLoggedIn) {
      setPath("/login?callbackUrl=" + encodeURIComponent(route));
    } else {
      setPath(route);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">middleware.ts — 보호 라우트 자동 차단</h3>

      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs text-zinc-500">현재 상태:</span>
        <button
          type="button"
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className={
            isLoggedIn
              ? "rounded-lg border border-lime-500/40 bg-lime-500/10 px-3 py-1 text-xs text-lime-300"
              : "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400"
          }
        >
          {isLoggedIn ? "✅ 로그인됨" : "❌ 비로그인"}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => tryAccess("/", false)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
        >
          / 접근 (공개)
        </button>
        <button
          type="button"
          onClick={() => tryAccess("/write", true)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
        >
          /write 접근 (보호)
        </button>
        <button
          type="button"
          onClick={() => tryAccess("/dashboard", true)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
        >
          /dashboard 접근 (보호)
        </button>
      </div>

      {path && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="text-xs text-zinc-500">최종 도착 경로:</div>
          <div className="font-mono text-xs text-cyan-400">{path}</div>
        </div>
      )}

      <pre className="mt-3 rounded bg-black/60 p-3 text-xs text-zinc-400">
        {`// middleware.ts
export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/write", "/dashboard/:path*"],   // 보호 경로
};`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 비로그인이 /write 시도 → 자동으로 /login?callbackUrl=/write 로 리다이렉트. 로그인 후
        callbackUrl 로 자동 복귀.
      </p>
    </div>
  );
}

export default function Ch16SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 16</h1>
        <p className="mb-8 text-zinc-400">NextAuth — 인증 + 보호 라우트</p>

        <h2 className="mb-3 text-lg font-semibold">① NextAuth 구성 요소</h2>
        <div className="mb-8">
          <StructureDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② 서버/클라이언트 세션 접근</h2>
        <div className="mb-8">
          <SessionAccessDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 보호 라우트</h2>
        <ProtectedRouteDemo />
      </div>
    </main>
  );
}
