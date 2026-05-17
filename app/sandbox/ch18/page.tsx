// app/sandbox/ch18/page.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// === 데모 ① Props Drilling vs Context ===
function PropsDrillingDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">Props Drilling — 중간 컴포넌트가 통과만 시킴</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <div className="mb-2 text-xs text-red-400">❌ Props Drilling</div>
          <pre className="text-[10px] text-zinc-400">
            {`<App user={user}>
  <Header user={user}>     {/* 안 씀 */}
    <Nav user={user}>       {/* 안 씀 */}
      <Menu user={user}>    {/* 안 씀 */}
        <Avatar user={user} />  {/* 마침내 사용 */}
      </Menu>
    </Nav>
  </Header>
</App>`}
          </pre>
        </div>

        <div className="rounded-lg border border-lime-500/30 bg-lime-500/5 p-3">
          <div className="mb-2 text-xs text-lime-400">✅ Context</div>
          <pre className="text-[10px] text-zinc-400">
            {`<UserContext.Provider value={user}>
  <App>
    <Header>
      <Nav>
        <Menu>
          <Avatar />  {/* useContext(UserContext) */}
        </Menu>
      </Nav>
    </Header>
  </App>
</UserContext.Provider>`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// === 데모 ② Context 3대 요소 — 다크모드 ===
type Ch18Theme = "light" | "dark";

const Ch18ThemeContext = createContext<{
  theme: Ch18Theme;
  toggle: () => void;
} | null>(null);

function Ch18ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Ch18Theme>("dark");
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return (
    <Ch18ThemeContext.Provider value={{ theme, toggle }}>{children}</Ch18ThemeContext.Provider>
  );
}

function useCh18Theme() {
  const ctx = useContext(Ch18ThemeContext);
  if (!ctx) throw new Error("useCh18Theme must be used within Ch18ThemeProvider");
  return ctx;
}

function Ch18ToggleButton() {
  const { theme, toggle } = useCh18Theme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
    >
      {theme === "dark" ? "🌙 다크" : "☀️ 라이트"}
    </button>
  );
}

function Ch18ThemedBox() {
  const { theme } = useCh18Theme();
  return (
    <div
      className={
        theme === "dark"
          ? "rounded-lg border border-zinc-700 bg-black p-4 text-white"
          : "rounded-lg border border-zinc-300 bg-white p-4 text-black"
      }
    >
      <div className="text-sm">현재 테마: {theme}</div>
      <div className="text-xs opacity-60">
        이 박스는 깊은 자식이지만 useContext 로 직접 테마 사용
      </div>
    </div>
  );
}

function ContextThreeElementsDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        Context 3대 요소 — createContext, Provider, useContext
      </h3>

      <Ch18ThemeProvider>
        <div className="mb-3 flex justify-end">
          <Ch18ToggleButton />
        </div>
        <Ch18ThemedBox />
      </Ch18ThemeProvider>

      <pre className="mt-3 rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`// 1. 정의
const ThemeContext = createContext<...>(null);

// 2. Provider — 값 공급
<ThemeContext.Provider value={{ theme, toggle }}>
  {children}
</ThemeContext.Provider>

// 3. 사용 — 어디서든 꺼내 씀
const { theme, toggle } = useContext(ThemeContext);`}
      </pre>
    </div>
  );
}

// === 데모 ③ 외부 라이브러리 비교 ===
function LibraryComparisonDemo() {
  const libs = [
    {
      name: "Context",
      verdict: "전역 + 변화 적음 (테마, 인증)",
      learn: "낮음",
    },
    {
      name: "Zustand",
      verdict: "가벼운 클라이언트 상태 + selector",
      learn: "낮음",
    },
    {
      name: "Jotai",
      verdict: "잘게 쪼개진 state, derived 많음",
      learn: "중간",
    },
    { name: "Redux Toolkit", verdict: "큰 앱, 시간여행 디버깅", learn: "높음" },
    { name: "TanStack Query", verdict: "서버 상태 (API) 전문", learn: "중간" },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">상태 관리 도구 비교</h3>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="bg-black/60">
            <tr>
              <th className="px-3 py-2 text-left text-zinc-400">도구</th>
              <th className="px-3 py-2 text-left text-zinc-400">적합 상황</th>
              <th className="px-3 py-2 text-left text-zinc-400">학습</th>
            </tr>
          </thead>
          <tbody>
            {libs.map((lib) => (
              <tr key={lib.name} className="border-t border-zinc-800">
                <td className="px-3 py-2 font-mono text-cyan-400">{lib.name}</td>
                <td className="px-3 py-2 text-zinc-300">{lib.verdict}</td>
                <td className="px-3 py-2 text-zinc-500">{lib.learn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 핵심: <strong>서버 상태 (TanStack Query)</strong> 와{" "}
        <strong>클라이언트 상태 (Context/Zustand)</strong> 의 구분.
      </p>
    </div>
  );
}

export default function Ch18SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 18</h1>
        <p className="mb-8 text-zinc-400">Context + 다크모드 + 상태관리 비교</p>

        <h2 className="mb-3 text-lg font-semibold">① Props Drilling 문제</h2>
        <div className="mb-8">
          <PropsDrillingDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② Context 3대 요소</h2>
        <div className="mb-8">
          <ContextThreeElementsDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 외부 라이브러리 비교</h2>
        <LibraryComparisonDemo />
      </div>
    </main>
  );
}
