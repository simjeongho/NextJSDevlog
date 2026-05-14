// app/sandbox/ch05/page.tsx

// === 데모 ① children 이란? — 특별한 prop ===
function Ch05Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
      <div className="mb-2 text-xs font-mono text-cyan-400">Box 컴포넌트 시작</div>
      <div className="rounded bg-black/40 p-3">{children}</div>
      <div className="mt-2 text-xs font-mono text-cyan-400">Box 컴포넌트 끝</div>
    </div>
  );
}

function ChildrenBasicDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">children = 컴포넌트 태그 사이에 넣은 모든 것</h3>

      <div className="space-y-3">
        <Ch05Box>
          <p className="text-sm text-zinc-300">단순한 텍스트 children</p>
        </Ch05Box>

        <Ch05Box>
          <h4 className="mb-1 text-base font-semibold text-white">제목</h4>
          <p className="text-xs text-zinc-400">여러 요소도 가능</p>
        </Ch05Box>

        <Ch05Box>
          <Ch05Box>중첩도 OK</Ch05Box>
        </Ch05Box>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 <code className="text-cyan-400">{`<Box>여기 내용</Box>`}</code> 의 &quot;여기 내용&quot;
        부분이 children
      </p>
    </div>
  );
}

// === 데모 ② Wrapper / Container 패턴 ===
function Ch05Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      {children}
    </div>
  );
}

function Ch05Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="mb-2 text-xs font-medium text-cyan-400">{title}</div>
      {children}
    </div>
  );
}

function WrapperPatternDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        Wrapper 패턴 — 공통 외형은 한 번, 내용은 자유롭게
      </h3>

      <Ch05Container>
        <div className="space-y-2">
          <Ch05Card title="첫 번째 카드">
            <p className="text-sm text-zinc-300">자유로운 내용</p>
          </Ch05Card>
          <Ch05Card title="두 번째 카드">
            <button className="rounded bg-cyan-500 px-3 py-1 text-xs text-black">버튼</button>
          </Ch05Card>
          <Ch05Card title="세 번째 카드">
            <div className="flex gap-1">
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">tag1</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">tag2</span>
            </div>
          </Ch05Card>
        </div>
      </Ch05Container>

      <p className="mt-4 text-xs text-zinc-600">
        💡 Container 의 padding/border 는 한 번 정의, 안의 내용은 자식이 자유롭게.
      </p>
    </div>
  );
}

// === 데모 ③ Layout 시뮬레이션 — Next.js layout.tsx 원리 ===
function Ch05Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <span className="text-xs font-medium text-cyan-400">⚡ Header (모든 페이지 공통)</span>
      </div>
      <div className="px-4 py-4">{children}</div>
      <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <span className="text-xs text-zinc-500">📌 Footer (모든 페이지 공통)</span>
      </div>
    </div>
  );
}

function Ch05PageA() {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-white">홈 페이지</h4>
      <p className="text-xs text-zinc-400">메인 콘텐츠 영역</p>
    </div>
  );
}

function Ch05PageB() {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-white">소개 페이지</h4>
      <p className="text-xs text-zinc-400">다른 페이지의 콘텐츠</p>
    </div>
  );
}

function LayoutDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">
        Layout 패턴 — Header/Footer 는 한 번, 페이지마다 children 만 바뀜
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <Ch05Layout>
          <Ch05PageA />
        </Ch05Layout>
        <Ch05Layout>
          <Ch05PageB />
        </Ch05Layout>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 Next.js 의 <code className="text-cyan-400">app/layout.tsx</code> 가 정확히 이 원리.
        Header/Footer 코드를 페이지마다 안 적어도 됨.
      </p>
    </div>
  );
}

export default function Ch05SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 05</h1>
        <p className="mb-8 text-zinc-400">children prop + Wrapper 패턴 + Layout 원리</p>

        <h2 className="mb-3 text-lg font-semibold">① children 이란?</h2>
        <div className="mb-8">
          <ChildrenBasicDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② Wrapper / Container 패턴</h2>
        <div className="mb-8">
          <WrapperPatternDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ Layout 패턴 (Next.js layout.tsx 원리)</h2>
        <LayoutDemo />
      </div>
    </main>
  );
}
