// contexts/ThemeContext.tsx
"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

// ⭐ 1. Context 정의
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ⭐ 2. Provider 컴포넌트
export function ThemeProvider({ children }: { children: ReactNode }) {
  // useLocalStorage 로 새로고침해도 유지 (챕터 10 재활용)
  const [theme, setTheme] = useLocalStorage<Theme>("devlog-theme", "dark");

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  // <html> 태그에 클래스 적용 (Tailwind dark: 변형 활용)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

// ⭐ 3. 커스텀 훅
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme 은 ThemeProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
