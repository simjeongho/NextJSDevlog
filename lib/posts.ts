// lib/posts.ts

import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { posts } from "./db/schema";

// ⭐ 타입은 schema 에서 가져옴 (자동 추론)
export type { Post } from "./db/schema";

// ⭐ 신규 — 글 추가 함수
export async function addPost(input: {
  title: string;
  content: string;
  tag: string;
  author: string;
  excerpt: string;
}) {
  const slug = input.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");

  const [newPost] = await db
    .insert(posts)
    .values({
      slug,
      title: input.title,
      author: input.author,
      date: new Date().toISOString().split("T")[0],
      tag: input.tag,
      excerpt: input.excerpt,
      content: input.content,
      readingTime: Math.ceil(input.content.length / 500),
    })
    .returning();

  return newPost;
}

// ⭐ slug 로 글 하나 조회
export async function getPostBySlug(slug: string) {
  const result = await db.select().from(posts).where(eq(posts.slug, slug));
  return result[0]; // 없으면 undefined
}

// ⭐ 모든 글 조회(최신순)
export async function getAllPosts() {
  return await db.select().from(posts).orderBy(desc(posts.date));
}

// ⭐ 모든 태그 조회 (중복 제거)
export async function getAllTags(): Promise<string[]> {
  const rows = await db.selectDistinct({ tag: posts.tag }).from(posts);
  return rows.map((r) => r.tag);
}
