"use client";

import { useState } from "react";

type LikeButtonProps = {
  initial?: number;
};

export default function LikeButton({ initial = 0 }: LikeButtonProps) {
  const [likes, setLikes] = useState<number>(initial);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const handleClick = () => {
    if (isLiked) {
      setLikes((prev) => prev - 1); // ⭐ 업데이터 패턴
      setIsLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setIsLiked(true);
    }
  };
  console.log("♥ LikeButton 렌더링"); // ⚠️ 임시
  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        isLiked
          ? "inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-400 transition-colors"
          : "inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
      }
    >
      <span>{isLiked ? "♥" : "♡"}</span>
      <span>{likes}</span>
    </button>
  );
}
