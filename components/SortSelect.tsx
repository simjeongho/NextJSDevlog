// components/SortSelect.tsx
"use client";

import type { ChangeEvent } from "react";

export type SortOption = "newest" | "oldest" | "shortest" | "longest";

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

const options: { value: SortOption; label: string }[] = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "shortest", label: "읽기 시간 짧은 순" },
  { value: "longest", label: "읽기 시간 긴 순" },
];

export default function SortSelect({ value, onChange }: SortSelectProps) {
  // ⭐ TS 이벤트 타입의 자연스러운 등장
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as SortOption);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 transition-colors focus:border-cyan-400/40 focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-zinc-900">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
