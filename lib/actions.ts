// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addPost } from "./posts";
import { authOptions } from "./auth";
import { getServerSession } from "next-auth";
import { addStudyLog } from "./study-logs";

export async function createPost(formData: FormData) {
  // ⭐ 세션 검증(미들웨어가 1차 차단하지만 Action도 자체 검증)
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    throw new Error("로그인이 필요합니다.");
  }
  // ⭐ FormData 에서 값 꺼내기
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tag = formData.get("tag") as string;

  // ⭐ 간단한 검증
  if (!title?.trim() || !content?.trim() || !tag?.trim()) {
    throw new Error("제목, 본문, 태그는 모두 필수입니다.");
  }

  // ⭐ 글 저장
  const newPost = await addPost({
    title: title.trim(),
    content: content.trim(),
    tag: tag.trim(),
    author: "익명", // 챕터 16 에서 NextAuth 세션 사용자로 교체
    excerpt: content.trim().slice(0, 100) + (content.length > 100 ? "..." : ""),
  });

  // ⭐ 메인 페이지 캐시 무효화
  revalidatePath("/");

  // ⭐ 새 글 상세 페이지로 이동
  redirect(`/posts/${newPost.slug}`);
}

export async function saveStudySession(input: {
  startedAt: string; //ISO string
  durationSeconds: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다. ");
  }

  if (input.durationSeconds < 60) {
    return { ok: false, message: "최소 1분 이상 학습해야 저장됩니다." };
  }

  await addStudyLog({
    userId: session.user.id,
    startedAt: new Date(input.startedAt),
    durationSeconds: input.durationSeconds,
  });

  return { ok: true };
}
