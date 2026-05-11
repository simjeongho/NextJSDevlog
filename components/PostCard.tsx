// components/PostCard.tsx
type PostCardProps = {
    title : string;
    author : string;
    date : string;
    tag : string;
    excerpt : string;
    coverImage?: string;
}

export default function PostCard({
    title,
    author,
    date,
    tag,
    excerpt,
    coverImage,
}: PostCardProps) {
  return (
    <article className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      {/* coverImage가 있을 때만 렌더링 */}
      {coverImage && (
        <div className="aspect-[3/1] w-full overflow-hidden bg-zinc-800">
          <img
            src={coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="mb-3 inline-block rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
        {tag}
      </div>
       <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-400">
        {title}
      </h2>
      <p className="mb-4 text-sm text-zinc-400">
        {excerpt}
      </p>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>{author}</span>
        <span>·</span>
        <span>{date}</span>
      </div>
    </article>
  );
}