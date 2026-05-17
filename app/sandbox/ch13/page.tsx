// app/sandbox/ch13/page.tsx
"use client";

import { useState } from "react";

// === 데모 ① 동적 라우팅 패턴 ===
function RoutingPatternDemo() {
  // ⭐ 가짜 slug 6개 — 실제 URL 라우팅 시뮬레이션
  const slugs = [
    "use-effect-deps-guide",
    "server-actions-patterns",
    "typescript-generics-guide",
    "tailwind-layout-patterns",
    "react-suspense-in-practice",
    "nonexistent-slug", // 404 시뮬레이션용
  ];

  // 가짜 DB
  const fakePosts: Record<string, { title: string; tag: string }> = {
    "use-effect-deps-guide": { title: "useEffect 의존성 배열 완전 정복", tag: "React" },
    "server-actions-patterns": { title: "Server Actions 실전 패턴", tag: "Next.js" },
    "typescript-generics-guide": { title: "TypeScript 제네릭 잘 쓰는 법", tag: "TypeScript" },
    "tailwind-layout-patterns": { title: "Tailwind 레이아웃 패턴 5가지", tag: "CSS" },
    "react-suspense-in-practice": { title: "React 18 Suspense 실전 활용", tag: "React" },
  };

  const [currentSlug, setCurrentSlug] = useState<string>(slugs[0]);
  const post = fakePosts[currentSlug];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        Next.js App Router — 같은 page.tsx 가 다양한 slug 처리
      </h3>

      {/* ⭐ 폴더 구조 (기존) */}
      <pre className="mb-4 rounded bg-black/60 p-3 text-xs text-zinc-400">
        {`app/
└── posts/
    └── [slug]/                       ⭐ 대괄호 = 동적
        └── page.tsx                  →  /posts/abc, /posts/xyz, ...`}
      </pre>

      {/* ⭐ 시뮬레이션 — URL slug 선택 */}
      <div className="mb-3">
        <div className="mb-2 text-xs text-zinc-500">
          아래 slug 중 클릭 → URL 이 바뀐 것처럼 페이지가 반응
        </div>
        <div className="flex flex-wrap gap-2">
          {slugs.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCurrentSlug(slug)}
              className={
                currentSlug === slug
                  ? "rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400"
                  : "rounded-lg border border-zinc-800 px-3 py-1 text-xs font-mono text-zinc-500 hover:border-zinc-700"
              }
            >
              {slug}
            </button>
          ))}
        </div>
      </div>

      {/* ⭐ 가짜 브라우저 주소창 */}
      <div className="mb-3 rounded-lg border border-zinc-800 bg-black/40 p-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-600">🌐</span>
          <span className="font-mono text-zinc-500">localhost:3000/posts/</span>
          <span className="font-mono text-cyan-400">{currentSlug}</span>
        </div>
      </div>

      {/* ⭐ 페이지 컴포넌트 시뮬레이션 */}
      <div className="mb-3 rounded-lg border border-zinc-800 bg-black/40 p-4">
        <div className="mb-2 text-[10px] font-mono text-zinc-600">
          {/* app/posts/[slug]/page.tsx 실행 결과*/}
        </div>
        <div className="mb-2 text-[10px] font-mono text-zinc-500">
          const &#123; slug &#125; = await params;
          <br />
          {/*// slug*/} = <span className="text-cyan-400">&quot;{currentSlug}&quot;</span>
        </div>

        <div className="mt-3 border-t border-zinc-800 pt-3">
          {post ? (
            <div>
              <div className="mb-1 inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                {post.tag}
              </div>
              <h4 className="text-base font-semibold text-white">{post.title}</h4>
              <p className="mt-1 text-xs text-zinc-500">
                ✅ getPostBySlug(&quot;{currentSlug}&quot;) → 글 발견
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 text-center">
              <div className="mb-2 text-2xl">🔍</div>
              <div className="text-sm font-semibold text-white">404 Not Found</div>
              <p className="mt-1 text-xs text-zinc-500">
                getPostBySlug(&quot;{currentSlug}&quot;) → undefined
                <br />→ notFound() 호출됨
              </p>
            </div>
          )}
        </div>
      </div>

      <pre className="rounded bg-black/60 p-3 text-xs text-zinc-400">
        {`// app/posts/[slug]/page.tsx (실제 코드)
type PageProps = {
  params: Promise<{ slug: string }>;  // ⭐ Next.js 15+
};

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;       // ⭐ await
  const post = await getPostBySlug(slug);

  if (!post) notFound();               // ⭐ 404

  return <article>{post.title}</article>;
}`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 URL 의 <code className="text-cyan-400">[slug]</code> 부분이 함수의 params 로 전달. 같은
        page.tsx 가 다양한 URL 을 처리. <br /> - 서버 컴포넌트의 경우 : searchParam async/await
        문으로 처리 - posts/[slug]/page.tsx <br /> - 클라이언트 컴포넌트의 경우 : useSearchParams()
        훅으로 처리 - login.tsx
      </p>
    </div>
  );
}

// === 데모 ② loading.tsx 스켈레톤 시뮬레이션 ===
function LoadingDemo() {
  const [loading, setLoading] = useState(false);

  const simulate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">loading.tsx — 페이지 단위 자동 스켈레톤</h3>

      <button
        type="button"
        onClick={simulate}
        disabled={loading}
        className="mb-3 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400 disabled:opacity-50"
      >
        {loading ? "로딩 중..." : "페이지 진입 시뮬레이션"}
      </button>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
            <div className="aspect-[3/1] w-full animate-pulse rounded-xl bg-zinc-800" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-1 text-xs text-cyan-400">React</div>
            <h4 className="mb-2 text-base font-semibold text-white">실제 글 제목</h4>
            <p className="text-xs text-zinc-400">
              로딩이 완료되면 이런 콘텐츠가 표시됩니다. 스켈레톤 UI 는 사용자에게 곧 무엇이 보일지
              미리 알려줍니다.
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 같은 폴더에 <code className="text-cyan-400">loading.tsx</code> 만 있으면 자동 표시.
        Suspense 내부에 자동 wrap 됨.
      </p>
    </div>
  );
}

// === 데모 ③ error.tsx + notFound 시뮬레이션 ===
function ErrorAndNotFoundDemo() {
  const [state, setState] = useState<"normal" | "error" | "notfound">("normal");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">error.tsx 와 notFound() — 자동 에러 경계</h3>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setState("normal")}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
        >
          정상
        </button>
        <button
          type="button"
          onClick={() => setState("error")}
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
        >
          에러 발생
        </button>
        <button
          type="button"
          onClick={() => setState("notfound")}
          className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300"
        >
          404
        </button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-4">
        {state === "normal" && (
          <div>
            <h4 className="mb-2 text-base font-semibold text-white">정상 상태</h4>
            <p className="text-xs text-zinc-400">데이터 로딩 성공</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 text-3xl">⚠️</div>
            <h4 className="mb-1 text-sm font-semibold text-white">문제가 발생했습니다</h4>
            <p className="mb-3 text-xs text-zinc-500">잠시 후 다시 시도해주세요</p>
            <button
              type="button"
              onClick={() => setState("normal")}
              className="rounded bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300"
            >
              다시 시도
            </button>
          </div>
        )}

        {state === "notfound" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 text-3xl">🔍</div>
            <h4 className="mb-1 text-sm font-semibold text-white">
              404 — 페이지를 찾을 수 없습니다
            </h4>
            <p className="text-xs text-zinc-500">slug 에 해당하는 글이 없습니다</p>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 같은 폴더의 <code className="text-cyan-400">error.tsx</code> 가 자동으로 Error Boundary
        역할. <code className="text-cyan-400">notFound()</code> 호출 시 not-found.tsx 표시.
      </p>
    </div>
  );
}

export default function Ch13SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 13</h1>
        <p className="mb-8 text-zinc-400">동적 라우팅 + loading + error</p>

        <h2 className="mb-3 text-lg font-semibold">① 동적 라우팅 패턴</h2>
        <div className="mb-8">
          <RoutingPatternDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② loading.tsx 스켈레톤 ⭐</h2>
        <div className="mb-8">
          <LoadingDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ error.tsx + notFound</h2>
        <ErrorAndNotFoundDemo />
      </div>
    </main>
  );
}
