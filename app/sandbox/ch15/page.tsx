// app/sandbox/ch15/page.tsx
"use client";

import { useState } from "react";

// === 데모 ① ORM 의 가치 — SQL 직접 작성 vs ORM ===
function OrmValueDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">SQL 직접 작성 vs Drizzle</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-red-400">❌ 문자열 SQL</div>
          <pre className="text-[10px] text-zinc-400">
            {`const result = await sql\`
  SELECT * FROM posts
  WHERE slug = \${slug}
\`;
// 타입 추론 X — result 가 any[]
// 컬럼명 오타도 런타임에 발견`}
          </pre>
        </div>

        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="mb-2 text-xs text-cyan-400">✅ Drizzle</div>
          <pre className="text-[10px] text-zinc-400">
            {`const result = await db
  .select()
  .from(posts)
  .where(eq(posts.slug, slug));
// 타입 추론 ✓ — result: Post[]
// 컬럼명 자동완성 + 오타 즉시 잡힘`}
          </pre>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 SQL 인젝션 자동 방어 + 타입 안전성 + IDE 자동완성.
      </p>
    </div>
  );
}

// === 데모 ② 스키마 = 타입 ===
function SchemaIsTypeDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">스키마 정의 한 번 → 타입까지 자동 생성</h3>

      <pre className="rounded bg-black/60 p-3 text-xs text-zinc-400">
        {`// lib/db/schema.ts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  readingTime: integer("reading_time"),   // nullable
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ⭐ 타입 자동 추론
export type Post = typeof posts.$inferSelect;
//   = { id: number; slug: string; title: string; ...
//       readingTime: number | null;       ← nullable 컬럼은 | null
//       createdAt: Date; }

export type NewPost = typeof posts.$inferInsert;
//   ← id, createdAt 같은 default 컬럼은 optional`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">💡 별도 interface 파일 X. 스키마가 곧 타입.</p>
    </div>
  );
}

// === 데모 ③ 함수 시그니처 보존의 가치 ===
function SignatureMigrationDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        함수 시그니처 보존 — 호출 측 코드 안 바뀜 - 아키텍쳐적 설명 Drizzle-orm x Repository 로직
        부분 분리 <br /> 개발 시 <br /> - 데이터 Mocking 이 때 mock 데이터로 실험을 해본다. 실제 DB
        연결 x <br /> - Before : 실제 데이터 베이스를 연결해도 느슨한 결합을 통해 데이터를 가져오는
        부분만 변경하면 된다.{" "}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-zinc-500">Before (메모리)</div>
          <pre className="text-[10px] text-zinc-400">
            {`export const posts: Post[] = [
  { id: 1, slug: "...", ... },
];

export async function getPostBySlug(slug: string) {
  return posts.find(p => p.slug === slug);
}`}
          </pre>
        </div>

        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="mb-2 text-xs text-cyan-400">After (Drizzle)</div>
          <pre className="text-[10px] text-zinc-400">
            {`export async function getPostBySlug(slug: string) {
  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug));
  return result[0];
}`}
          </pre>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-lime-500/30 bg-lime-500/5 p-3">
        <div className="mb-1 text-xs font-mono text-lime-400">호출하는 쪽 코드</div>
        <pre className="text-[10px] text-zinc-400">
          {`// app/posts/[slug]/page.tsx
const post = await getPostBySlug(slug);   // ← 변경 X`}
        </pre>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 함수 시그니처가 같으면 내부 구현 (메모리/Drizzle/외부 API) 교체가 깔끔.
      </p>
    </div>
  );
}

export default function Ch15SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 15</h1>
        <p className="mb-8 text-zinc-400">Drizzle ORM — 스키마 = 타입 + 함수 시그니처 보존</p>

        <h2 className="mb-3 text-lg font-semibold">① ORM 의 가치</h2>
        <div className="mb-8">
          <OrmValueDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② 스키마 = 타입</h2>
        <div className="mb-8">
          <SchemaIsTypeDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 시그니처 보존 ⭐</h2>
        <SignatureMigrationDemo />
      </div>
    </main>
  );
}
