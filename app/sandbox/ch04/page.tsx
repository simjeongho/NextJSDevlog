// app/sandbox/ch04/page.tsx

// === 데모 ① Props 란? — 컴포넌트의 입력값 ===
// 함수의 인자처럼 부모가 자식에게 데이터를 내려주는 통로
function Ch04Greeting(props: { name: string; emoji: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3 text-sm text-zinc-300">
      {props.emoji} 안녕하세요, <span className="text-cyan-400">{props.name}</span>님!
    </div>
  );
}

function PropsBasicDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">같은 컴포넌트 + 다른 props → 다른 결과</h3>
      <div className="space-y-2">
        <Ch04Greeting name="앨리스" emoji="👋" />
        <Ch04Greeting name="밥" emoji="🙌" />
        <Ch04Greeting name="김개발" emoji="✨" />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        💡 부모가 데이터를 갖고 있고, 자식은 받아서 그리기만 함. 같은 컴포넌트인데 props 만 바뀌어
        3가지 결과.
      </p>
    </div>
  );
}

// === 데모 ② TypeScript 로 Props 타입 정의 ===
// type 으로 props 모양 명시 — 잘못 쓰면 빨간줄
type Ch04ButtonProps = {
  label: string;
  variant: "primary" | "ghost";
};

function Ch04Button(props: Ch04ButtonProps) {
  const colorClass =
    props.variant === "primary"
      ? "bg-cyan-500 text-black hover:bg-cyan-400"
      : "border border-zinc-700 text-zinc-300 hover:border-zinc-500";

  return (
    <button
      type="button"
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${colorClass}`}
    >
      {props.label}
    </button>
  );
}

function TypeDefinitionDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">TypeScript 가 props 의 형태를 보장</h3>
      <div className="flex gap-2">
        <Ch04Button label="저장" variant="primary" />
        <Ch04Button label="취소" variant="ghost" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded border border-red-500/30 bg-red-500/5 p-2 text-xs">
          <span className="font-mono text-red-400">❌ 빨간줄</span>
          <code className="ml-2 text-zinc-400">
            &lt;Ch04Button label=&quot;test&quot; variant=&quot;danger&quot; /&gt;
          </code>
          <span className="ml-2 text-zinc-500">→ variant 허용값 외</span>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/5 p-2 text-xs">
          <span className="font-mono text-red-400">❌ 빨간줄</span>
          <code className="ml-2 text-zinc-400">
            &lt;Ch04Button variant=&quot;primary&quot; /&gt;
          </code>
          <span className="ml-2 text-zinc-500">→ label 누락</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 props 타입 정의 = 컴포넌트의 사용 계약. 잘못 사용하면 컴파일 시점에 즉시 잡힘.
      </p>
    </div>
  );
}

// === 데모 ③ 인자 자리에서 구조분해 ⭐ 핵심 ===
// props 객체를 받아서 .name 으로 접근 vs 인자 자리에서 바로 꺼냄

// Before: props.name, props.tag 로 접근
function Ch04CardBefore(props: { title: string; tag: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="text-xs text-cyan-400">{props.tag}</div>
      <div className="text-sm text-white">{props.title}</div>
    </div>
  );
}

// After: 인자 자리에서 { title, tag } 로 바로 분해
function Ch04CardAfter({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="text-xs text-cyan-400">{tag}</div>
      <div className="text-sm text-white">{title}</div>
    </div>
  );
}

function DestructuringDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">인자 자리에서 구조분해 — 코드가 간결해짐</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs text-zinc-500">Before: props.xxx 접근</div>
          <pre className="mb-3 rounded bg-black/60 p-2 text-[10px] text-zinc-400">
            {`function Card(props: ...) {
  return <div>
    {props.tag}
    {props.title}
  </div>;
}`}
          </pre>
          <Ch04CardBefore title="구조분해 전" tag="Before" />
        </div>

        <div>
          <div className="mb-2 text-xs text-zinc-500">After: 인자 자리 구조분해</div>
          <pre className="mb-3 rounded bg-black/60 p-2 text-[10px] text-zinc-400">
            {`function Card({ title, tag }: ...) {
  return <div>
    {tag}
    {title}
  </div>;
}`}
          </pre>
          <Ch04CardAfter title="구조분해 후" tag="After" />
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 결과는 동일. 하지만 후자가 React 표준 컨벤션. props 접두사 없이 변수처럼 사용.
      </p>
    </div>
  );
}

// === 데모 ④ 옵셔널 prop (?) ===
// 있을 수도 없을 수도 있는 props
type Ch04AvatarProps = {
  name: string;
  badge?: string; // 옵셔널 — 없어도 OK
  isOnline?: boolean; // 옵셔널
};

function Ch04Avatar({ name, badge, isOnline }: Ch04AvatarProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-black/40 p-3">
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black">
          {name[0]}
        </div>
        {isOnline && (
          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-lime-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{name}</div>
        {badge && (
          <span className="inline-block rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function OptionalPropsDemo() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">옵셔널 prop — 줘도 되고 안 줘도 됨</h3>

      <div className="grid gap-2 sm:grid-cols-2">
        <Ch04Avatar name="앨리스" />
        <Ch04Avatar name="밥" isOnline />
        <Ch04Avatar name="김개발" badge="ADMIN" />
        <Ch04Avatar name="이코드" badge="PM" isOnline />
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        💡 <code className="text-cyan-400">badge?: string</code> 의{" "}
        <code className="text-cyan-400">?</code> 가 옵셔널 표시. 안 넘기면{" "}
        <code className="text-cyan-400">undefined</code>, 컴포넌트가 조건부 렌더링으로 처리.
      </p>
    </div>
  );
}

export default function Ch04SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 04</h1>
        <p className="mb-8 text-zinc-400">Props 기초 → 타입 정의 → 구조분해 → 옵셔널 prop</p>

        <h2 className="mb-3 text-lg font-semibold">① Props 란? — 컴포넌트의 입력값</h2>
        <div className="mb-8">
          <PropsBasicDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② TypeScript 로 Props 타입 정의</h2>
        <div className="mb-8">
          <TypeDefinitionDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ 인자 자리에서 구조분해 ⭐</h2>
        <div className="mb-8">
          <DestructuringDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">④ 옵셔널 prop (?)</h2>
        <OptionalPropsDemo />
      </div>
    </main>
  );
}
