import Link from "next/link";
import LikeButton from "./LikeButton";

// components/PostCard.tsx
type PostCardProps = {
  slug: string;
  title: string;
  author: string;
  date: string;
  tag: string;
  excerpt: string;
  readingTime?: number | null;
  coverImage?: string | null;
  initialLikes?: number;
};

export default function PostCard({
  slug,
  title,
  author,
  date,
  tag,
  excerpt,
  readingTime,
  coverImage,
  initialLikes,
}: PostCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-cyan-500/5">
      {/* 카드 전체를 Link로 감싸지 않고, 본문 영역만 Link로 (LikeButton 클릭 보호) */}
      <Link href={`/posts/${slug}`} className="block">
        {coverImage && (
          <div className="aspect-[3/1] w-full overflow-hidden bg-zinc-800">
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
              {tag}
            </span>
            {readingTime !== undefined && (
              <span className="text-xs text-zinc-500">· {readingTime}분 읽기</span>
            )}
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
            {title}
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-400">{excerpt}</p>
        </div>
      </Link>

      {/* ⭐ 메타 + LikeButton 영역은 Link 밖에 배치 (좋아요 클릭 시 페이지 이동 방지) */}
      <div className="flex items-center justify-between px-5 pb-5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">{author}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <LikeButton initial={initialLikes} />
      </div>
    </article>
  );
}
