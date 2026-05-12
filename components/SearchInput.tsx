// components/SearchInput.tsx
"use client";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "검색...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 pl-10 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
      />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
        🔍
      </span>
    </div>
  );
}
