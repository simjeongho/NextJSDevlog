// app/posts/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { getPostBySlug } from "@/lib/posts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PageProps) {
  // ⭐ Next.js 15: params 가 Promise — await 필수
  const { slug } = await params;

  // ⭐ Server Component 안에서 직접 데이터 조회
  const post = await getPostBySlug(slug);

  // ⭐ 글이 없으면 404 페이지로
  if (!post) {
    notFound();
  }

  return (
    <Container>
      <div className="py-12">
        {/* 뒤로가기 링크 */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-cyan-400"
        >
          <span>←</span>
          <span>목록으로</span>
        </Link>

        {/* 커버 이미지 */}
        {post.coverImage && (
          <div className="mb-8 aspect-[2/1] w-full overflow-hidden rounded-2xl">
            <img src={post.coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {/* 메타 영역 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
            {post.tag}
          </span>
          {post.readingTime !== undefined && (
            <span className="text-xs text-zinc-500">· {post.readingTime}분 읽기</span>
          )}
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-4xl font-semibold tracking-tight">{post.title}</h1>

        {/* 작성자 / 날짜 */}
        <div className="mb-10 flex items-center gap-2 border-b border-zinc-900 pb-6 text-sm text-zinc-500">
          <span className="font-medium text-zinc-300">{post.author}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>

        {/* 본문 */}
        <article className="prose prose-invert max-w-none">
          <p className="text-base leading-relaxed text-zinc-300">{post.content}</p>
        </article>
      </div>
    </Container>
  );
}
