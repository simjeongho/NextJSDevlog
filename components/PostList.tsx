// components/PostList.tsx
"use client";

import { useMemo, useState } from "react";
import PostCard from "./PostCard";
import TagFilter from "./TagFilter";
import EmptyState from "./EmptyState";
import SearchInput from "./SearchInput";
import SortSelect, { type SortOption } from "./SortSelect";
import { useDebounce } from "@/hooks/useDebounce";
import type { Post } from "@/lib/posts";

type PostListProps = {
  posts: Post[]; // ⭐ 서버에서 받음 (직렬화 가능한 plain object)
  tags: string[]; // ⭐ 서버에서 미리 추출
};

export default function PostList({ posts, tags }: PostListProps) {
  // ⭐ 활성 태그 state — 부모에서 보유
  const [activeTag, setActiveTag] = useState<string>("all");
  //⭐ 즉시 반영되는 입력값
  const [query, setQuery] = useState<string>("");
  //⭐ 디바운스된 값
  const debouncedQuery = useDebounce(query, 300);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  // ⭐ 필터링: 태그 + 검색어 (디바운스된)
  const filteredPosts = useMemo(() => {
    let result = activeTag === "all" ? posts : posts.filter((p) => p.tag === activeTag);

    if (debouncedQuery.trim() !== "") {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q),
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.date.localeCompare(a.date);
        case "oldest":
          return a.date.localeCompare(b.date);
        case "shortest":
          return (a.readingTime ?? 0) - (b.readingTime ?? 0);
        case "longest":
          return (b.readingTime ?? 0) - (a.readingTime ?? 0);
      }
    });

    return result;
  }, [activeTag, debouncedQuery, sortBy, posts]);

  return (
    <section className="py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">최근 글</h2>
          <p className="mt-1 text-sm text-zinc-500">총 {filteredPosts.length}개의 글</p>
        </div>
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="제목이나 본문으로 검색..." />
      </div>

      <div className="mb-8">
        <TagFilter tags={tags} activateTag={activeTag} onTagChange={setActiveTag} />
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          message={
            debouncedQuery
              ? `'${debouncedQuery}' 검색 결과가 없습니다`
              : `'${activeTag}' 태그의 글이 없습니다`
          }
          hint="다른 검색어나 태그를 시도해보세요"
        />
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      )}
    </section>
  );
}
