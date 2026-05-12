"use client";
// components/TagFilter.tsx

import { useState } from "react";

type TagFilterProps = {
  tags: string[];
  //activeTag?: string; // ⭐ 옵셔널 — 없으면 'all' 취급 - chapter07에서 제거 useState로 관리
};

export default function TagFilter({ tags }: TagFilterProps) {
  // ⭐ 활성 태그 state. "all" 이 기본값.
  const [activeTag, setActiveTag] = useState<string>("all");

  // 'all' 을 맨 앞에 추가
  const allTags = ["all", ...tags];
  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isActive = (activeTag ?? "all") === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)} // ⭐ 클릭 시 state 변경
            className={
              isActive
                ? "rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400 transition-colors"
                : "rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            }
          >
            {tag === "all" ? "전체" : tag}
          </button>
        );
      })}
    </div>
  );
}
