// components/ThemeToggle.tsx
"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="테마 전환"
      className="rounded-lg border border-zinc-800 px-3 py-2 text-sm transition-colors hover:border-zinc-700 hover:text-white"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
