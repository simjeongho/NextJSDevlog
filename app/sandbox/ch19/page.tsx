// app/sandbox/ch19/page.tsx

// === 데모 ① 일반 빌드 vs Standalone ===
function BuildComparisonDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">일반 빌드 vs Standalone 빌드</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-red-400">기본 빌드</div>
          <pre className="text-[10px] text-zinc-400">
            {`프로젝트/
├── .next/
├── node_modules/    ← 의존성 422개
├── package.json
├── app/             ← 소스 코드
├── components/
└── ...

배포 시 전체 폴더 업로드
용량: 약 1 GB
실행: npm run start`}
          </pre>
        </div>

        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <div className="mb-2 text-xs text-cyan-400">Standalone 빌드</div>
          <pre className="text-[10px] text-zinc-400">
            {`.next/standalone/   ← 자급자족 폴더
├── server.js        ← 진입점
├── package.json
├── node_modules/    ← 진짜 필요한 것만
└── .next/server/    ← 컴파일된 서버 코드

배포 시 이 폴더만 업로드
용량: 약 100 MB (10배 작음)
실행: node server.js`}
          </pre>
        </div>
      </div>

      <pre className="mt-3 rounded bg-black/60 p-3 text-xs text-zinc-400">
        {`// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",  // ⭐ 이 한 줄
};`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 Standalone = &quot;실행에 필요한 최소한&quot; 추출. 서버 / 클라이언트 분리와는 무관.
      </p>
    </div>
  );
}

// === 데모 ② PM2 의 역할 ===
function Pm2Demo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">PM2 — Node.js 프로세스 매니저</h3>

      <div className="mb-3 space-y-2 text-xs">
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">✓</span>
          서버 시작 / 정지 / 재시작 명령
        </div>
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">✓</span>
          크래시 시 자동 재시작 (무중단)
        </div>
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">✓</span>
          로그 파일 자동 회전
        </div>
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">✓</span>
          서버 재부팅 시 자동 시작 (pm2 startup)
        </div>
      </div>

      <pre className="rounded bg-black/60 p-3 text-xs text-zinc-400">
        {`// ecosystem.config.js
module.exports = {
  apps: [{
    name: "devlog",
    script: ".next/standalone/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "0.0.0.0",
    },
  }],
};

# 명령어
pm2 start ecosystem.config.js
pm2 status
pm2 logs devlog
pm2 reload devlog    # 무중단 재시작`}
      </pre>
    </div>
  );
}

// === 데모 ③ 환경 변수 분리 ===
function EnvDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">환경 변수 — 개발 / 프로덕션 분리</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
          <div className="mb-2 text-xs text-cyan-400">개발 (.env.local)</div>
          <pre className="text-[10px] text-zinc-400">
            {`DATABASE_URL="postgresql://...
   @localhost:5432/devlog"
NEXTAUTH_SECRET="dev-secret"
NEXTAUTH_URL="http://localhost:3000"`}
          </pre>
        </div>

        <div className="rounded-lg border border-lime-500/30 bg-lime-500/5 p-3">
          <div className="mb-2 text-xs text-lime-400">프로덕션 (.env.production)</div>
          <pre className="text-[10px] text-zinc-400">
            {`DATABASE_URL="postgresql://...
   @사내DB:5432/devlog"
NEXTAUTH_SECRET="<강력한 비밀>"
NEXTAUTH_URL="https://devlog.사내도메인"`}
          </pre>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 .env 는 절대 git 추적 X. .env.example 만 git 에 두기.
      </p>
    </div>
  );
}

// === 데모 ④ 전체 배포 흐름 ===
function DeployFlowDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">배포 흐름 — 개발자 노트북 → 서버 → 사용자</h3>

      <div className="space-y-2 text-xs">
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">1.</span>
          <span className="text-zinc-300">개발자 노트북</span> — npm run build → standalone 폴더
          생성
        </div>
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">2.</span>
          <span className="text-zinc-300">사내 서버</span> — standalone 폴더 + .env.production
          업로드
        </div>
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">3.</span>
          <span className="text-zinc-300">사내 서버</span> — pm2 start ecosystem.config.js
        </div>
        <div className="rounded border border-zinc-800 bg-black/40 p-2">
          <span className="mr-2 font-mono text-cyan-400">4.</span>
          <span className="text-zinc-300">사내 서버</span> — 3000 포트에서 대기
        </div>
        <div className="rounded border border-cyan-500/30 bg-cyan-500/5 p-2">
          <span className="mr-2 font-mono text-cyan-400">5.</span>
          <span className="text-zinc-300">사용자</span> — https://devlog.사내도메인 접속 → 완성된
          DevLog!
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        💡 12시간 동안 만든 모든 것이 사용자에게 도달하는 마지막 단계.
      </p>
    </div>
  );
}

export default function Ch19SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 19</h1>
        <p className="mb-8 text-zinc-400">Standalone 빌드 + PM2 + 배포 흐름</p>

        <h2 className="mb-3 text-lg font-semibold">① Standalone 빌드</h2>
        <div className="mb-8">
          <BuildComparisonDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② PM2 의 역할</h2>
        <div className="mb-8">
          <Pm2Demo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 환경 변수</h2>
        <div className="mb-8">
          <EnvDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">④ 전체 배포 흐름</h2>
        <DeployFlowDemo />
      </div>
    </main>
  );
}
