// app/sandbox/ch14/page.tsx
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// === 데모 ① 전통 fetch vs Server Action ===
function ComparisonDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">전통 fetch 패턴 vs Server Actions</h3>

      <div className="grid gap-3 md:grid-cols-2">
        {/* ⭐ 전통 fetch — 3계층 */}
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-red-400">❌ 전통 — API 라우트 + 래퍼 + 컴포넌트</div>
          <pre className="text-[10px] text-zinc-400">
            {`// 1. app/api/posts/route.ts (서버 핸들러)
export async function POST(req: Request) {
  const body = await req.json();
  // DB 저장 등
  return Response.json({ ok: true });
}

// 2. lib/api/posts.ts (래퍼 — fetch 캡슐화)
export async function createPost(data) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// 3. 컴포넌트 (래퍼 사용)
const handleSubmit = async (e) => {
  e.preventDefault();
  await createPost({ title, content });
};`}
          </pre>
        </div>

        {/* ⭐ Server Action — 2계층 */}
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="mb-2 text-xs text-cyan-400">✅ Server Action — 함수 + 컴포넌트</div>
          <pre className="text-[10px] text-zinc-400">
            {`// 1. lib/actions.ts (서버 함수)
"use server";
// server Action에서는 데이터 wrapping 과정을 Next.js가 통째로 대신 해준다. -> fetch 코드를 안짜도 된다. 
export async function createPost(formData: FormData) {
  // DB 저장 등 — 서버에서 직접 실행
}

// 2. 컴포넌트 (직접 사용)
<form action={createPost}>
  <input name="title" />
  <button>저장</button>
</form>`}
          </pre>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 text-[10px] text-zinc-500">
        <div className="rounded border border-red-500/20 bg-red-500/5 p-2">
          <div className="font-mono text-red-300">3계층 필요</div>
          <div>API 라우트 + 래퍼 + 컴포넌트</div>
        </div>
        <div className="rounded border border-lime-500/20 bg-lime-500/5 p-2">
          <div className="font-mono text-lime-300">2계층으로 단순화</div>
          <div>서버 함수 + 컴포넌트</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 양쪽 모두 같은 <code className="text-cyan-400">createPost</code> 함수. Server Action 은
        API 라우트 + 래퍼 + 직렬화 코드를 자동화.
      </p>
    </div>
  );
}

// === 데모 ② form action 패턴 시뮬레이션 ===
function FormActionDemo() {
  const [submitted, setSubmitted] = useState<string[]>([]);

  // 데모에선 실제 Server Action 없이 시뮬레이션
  async function fakeServerAction(formData: FormData) {
    await new Promise((r) => setTimeout(r, 800)); // 서버 응답 흉내
    const title = formData.get("title") as string;
    setSubmitted((prev) => [title, ...prev].slice(0, 5));
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        &lt;form action={`{fn}`}&gt; — 함수를 action 에 직접 전달
      </h3>

      <form action={fakeServerAction} className="mb-3 flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="제목 입력..."
          required
          className="flex-1 rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
        <Ch14SubmitButton />
      </form>

      <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
        <div className="mb-2 text-xs text-zinc-500">제출된 항목 (최근 5개):</div>
        {submitted.length === 0 ? (
          <div className="text-xs text-zinc-600">아직 없음</div>
        ) : (
          <ul className="space-y-1 text-xs text-cyan-400">
            {submitted.map((s, i) => (
              <li key={i}>· {s}</li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 입력 후 제출 → 0.8초 동안 버튼이 비활성화 (useFormStatus 의 pending)
      </p>
    </div>
  );
}

function Ch14SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
    >
      {pending ? "저장 중..." : "발행"}
    </button>
  );
}

// === 데모 ③ Server Action 의 흐름 ===
function FlowDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">Server Action 의 내부 흐름</h3>

      <ol className="space-y-2 text-xs">
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">1.</span>폼 제출 → 브라우저가 FormData 자동
          직렬화
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">2.</span>
          Next.js 가 서버로 RPC 호출 (자동 라우팅)
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">3.</span>
          서버에서 createPost(formData) 실행 — DB 저장, 세션 검증 등
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">4.</span>
          revalidatePath() / redirect() 로 후처리
        </li>
      </ol>

      <p className="mt-3 text-xs text-zinc-600">
        💡 우리는 fetch 호출 / 응답 처리 코드 한 줄도 안 적음.
      </p>
    </div>
  );
}

export default function Ch14SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 14</h1>
        <p className="mb-8 text-zinc-400">Server Actions — &quot;use server&quot; + form action</p>

        <h2 className="mb-3 text-lg font-semibold">① 전통 fetch vs Server Action</h2>
        <div className="mb-8">
          <ComparisonDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② form action 패턴</h2>
        <div className="mb-8">
          <FormActionDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 내부 흐름</h2>
        <FlowDemo />
      </div>
    </main>
  );
}
