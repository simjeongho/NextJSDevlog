// app/sandbox/ch12/page.tsx

// === 데모 ① Server / Client 비교표 ===
function ComparisonDemo() {
  const rows = [
    {
      feature: "어디서 실행?",
      server: "서버에서만",
      client: "서버 한 번 + 브라우저",
    },
    {
      feature: "useState/useEffect",
      server: "❌ 사용 불가",
      client: "✅ 가능",
    },
    { feature: "onClick 핸들러", server: "❌ 사용 불가", client: "✅ 가능" },
    {
      feature: "async/await DB 조회",
      server: "✅ 컴포넌트가 async",
      client: "⚠ useEffect 패턴 필요",
    },
    {
      feature: "JS 번들 포함",
      server: "❌ 0 KB (HTML 만)",
      client: "✅ 브라우저로 전송",
    },
    {
      feature: "환경 변수",
      server: "✅ 모두 접근",
      client: "⚠ NEXT_PUBLIC_ 만",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">Server vs Client Component</h3>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="bg-black/60">
            <tr>
              <th className="px-3 py-2 text-left text-zinc-400">기능</th>
              <th className="px-3 py-2 text-left text-cyan-400">Server (기본)</th>
              <th className="px-3 py-2 text-left text-lime-400">Client (use client)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="px-3 py-2 text-zinc-300">{row.feature}</td>
                <td className="px-3 py-2 text-zinc-400">{row.server}</td>
                <td className="px-3 py-2 text-zinc-400">{row.client}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// === 데모 ② "use client" 의 진짜 의미 ===
function UseClientMeaningDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">흔한 오해 vs 정답</h3>

      <div className="space-y-3 text-xs">
        <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
          <div className="mb-1 font-mono text-red-400">❌ 오해</div>
          <div className="text-zinc-300">
            &quot;use client&quot; = 서버에서 안 돌아감, 브라우저에서만 실행
          </div>
        </div>

        <div className="rounded border border-lime-500/30 bg-lime-500/5 p-3">
          <div className="mb-1 font-mono text-lime-400">✅ 정답</div>
          <div className="text-zinc-300">
            &quot;use client&quot; = 이 컴포넌트부터는 클라이언트 경계 (서버 + 브라우저)
          </div>
        </div>
      </div>

      <ol className="mt-4 space-y-2 text-xs">
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">1.</span>
          서버: 모든 컴포넌트 (Server + Client) 한 번 실행 → HTML 생성
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">2.</span>
          브라우저: HTML 받아 즉시 표시 ⭐
        </li>
        <li className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">3.</span>
          브라우저: JS 번들 받아 Client Component 만 hydration (이벤트 활성화)
        </li>
      </ol>
    </div>
  );
}

// === 데모 ③ 클라이언트 경계 설계 — 어디서 자르나? ===
function BoundaryDesignDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">클라이언트 경계 — 가능한 깊은 곳에 두기</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs text-red-400">❌ 페이지 최상단</div>
          <div className="space-y-1 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs font-mono">
            <div className="text-red-300">&quot;use client&quot;</div>
            <div className="text-zinc-400">└ Page</div>
            <div className="text-zinc-400 ml-3">└ Header (불필요한 client)</div>
            <div className="text-zinc-400 ml-3">└ Hero (불필요한 client)</div>
            <div className="text-zinc-400 ml-3">└ InteractiveList</div>
          </div>
          <p className="mt-2 text-[10px] text-zinc-500">전체가 클라이언트 = JS 번들 큼</p>
        </div>

        <div>
          <div className="mb-2 text-xs text-lime-400">✅ 인터랙션 부분만</div>
          <div className="space-y-1 rounded-lg border border-lime-500/30 bg-lime-500/5 p-3 text-xs font-mono">
            <div className="text-zinc-400">Page (server)</div>
            <div className="text-zinc-400 ml-3">└ Header (server)</div>
            <div className="text-zinc-400 ml-3">└ Hero (server)</div>
            <div className="text-lime-300 ml-3">└ &quot;use client&quot; InteractiveList</div>
          </div>
          <p className="mt-2 text-[10px] text-zinc-500">JS 번들 최소화 + SEO 친화</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 원칙: 기본은 Server, 인터랙션 필요한 곳만 Client 로 격리.
      </p>
    </div>
  );
}

export default function Ch12SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 12</h1>
        <p className="mb-8 text-zinc-400">Server vs Client Components</p>

        <h2 className="mb-3 text-lg font-semibold">① Server / Client 비교</h2>
        <div className="mb-8">
          <ComparisonDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② &quot;use client&quot; 의 진짜 의미</h2>
        <div className="mb-8">
          <UseClientMeaningDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 클라이언트 경계 설계</h2>
        <BoundaryDesignDemo />
      </div>
    </main>
  );
}
