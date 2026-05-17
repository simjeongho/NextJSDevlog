# 챕터 08: 학습 타이머 — useEffect + useRef

> **시간**: 약 60분 · **블록**: Day 1 / Block 3 (가장 긴 챕터)

---

## 🎯 이 챕터에서 다룰 내용

- React 의 **사이드 이펙트(side effect)** 개념
- **`useEffect`** — 의존성 배열, 클린업 함수
- **`useRef`** — DOM 참조 / 값 저장 두 가지 용도
- `setInterval` 의 함정과 클린업의 중요성 (메모리 누수 방지)
- **SVG 원형 진행 게이지** 직접 그리기
- 25분 학습 타이머 (Pomodoro) 완성 — DevLog 의 트레이드마크 기능

이번 챕터는 60분으로 가장 깁니다. 그만큼 핵심 챕터입니다. 단순히 시간 재는 컴포넌트가 아니라, **useEffect 와 useRef 라는 두 가지 핵심 훅을 한 번에 익히는 자리** 이기도 합니다. 그리고 시각적으로도 가장 멋있는 컴포넌트가 만들어집니다 — SVG 로 직접 그리는 원형 진행 게이지에 시안→라임 그라데이션이 들어갑니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `components/CircularProgress.tsx` — SVG 원형 진행 게이지 (신규)
- `components/StudyTimer.tsx` — 학습 타이머 본체 (신규, 핵심)
- `app/page.tsx` — 히어로 섹션 옆에 타이머 배치 (수정)

---

## 🧠 핵심 개념

### 1. 사이드 이펙트(Side Effect) 란?

지금까지 만든 `useState` 는 컴포넌트 내부의 값을 다뤘습니다. 그런데 **컴포넌트 외부에 영향을 주는 작업들** 이 있습니다 — `setInterval`, `fetch`, `localStorage` 접근, DOM 조작 등. 이런 걸 **사이드 이펙트** 라고 부릅니다.

#### 사이드 이펙트의 예

| 작업 | 사이드 이펙트인가? | 이유 |
|---|---|---|
| `count = count + 1` | ❌ | 순수 계산. 외부에 영향 없음 |
| `setCount(count + 1)` | ❌ | React 의 정상 흐름 (state 업데이트) |
| `setInterval(...)` | ✅ | 컴포넌트와 무관하게 계속 동작 |
| `fetch('/api/posts')` | ✅ | 네트워크 요청 (외부 시스템) |
| `document.title = '...'` | ✅ | DOM 직접 조작 |
| `localStorage.setItem(...)` | ✅ | 외부 저장소 접근 |

#### 왜 "사이드(side)" 인가?

함수의 본래 목적(렌더링) 외에 **부수적(side)** 으로 일어나는 작업이라는 뜻입니다. React 컴포넌트의 본래 일은 "JSX 를 반환" 하는 것이지만, 그 과정에서 외부 시스템과 상호작용해야 할 때가 있습니다.

#### 왜 사이드 이펙트를 따로 다루나?

사이드 이펙트는 **시점 관리가 중요** 합니다. 컴포넌트가 화면에 나타날 때 시작하고, 사라질 때 정리해야 합니다. 잘못된 시점에 실행되면 메모리 누수, 무한 루프, 화면 깜빡임 같은 문제가 생깁니다.

React 는 이런 사이드 이펙트를 안전하게 다루기 위해 **`useEffect`** 라는 훅을 제공합니다.

---

### 2. `useEffect` — 사이드 이펙트 다루기

`useEffect` 는 세 가지를 결정합니다:
1. **무엇을** 할 건지 (effect 함수)
2. **언제** 할 건지 (의존성 배열)
3. **끝날 때 뭘** 할 건지 (클린업 함수, 선택)

#### 기본 구조

```tsx
useEffect(() => {
  // 1. effect 함수 (무엇을 할지)
  console.log("실행됨");

  // 3. 클린업 함수 (선택)
  return () => {
    console.log("정리 작업");
  };
}, [count]);  // 2. 의존성 배열 (언제 다시 실행할지)
```

#### 의존성 배열의 3가지 패턴

```tsx
// 패턴 A: 매 렌더마다 실행 (의존성 배열 자체가 없음)
useEffect(() => { ... });
// ⚠️ 거의 안 씁니다. 매 렌더마다 effect 가 돌아 무한 루프 위험이 큽니다.

// 패턴 B: 첫 렌더 한 번만 실행 (빈 배열)
useEffect(() => { ... }, []);
// 초기화 작업, 외부 데이터 한 번 불러오기 등에 사용

// 패턴 C: 특정 값이 바뀔 때만 실행
useEffect(() => { ... }, [count, name]);
// count 또는 name 이 바뀌면 다시 실행
```

이번 챕터에선 **패턴 C 위주** 로 사용합니다. `[isRunning]` 의존성으로 "시작/정지 상태가 바뀔 때마다" 인터벌을 켜고 끕니다.

---

### 3. 클린업 함수 — `setInterval` 의 함정

useEffect 안에서 `setInterval` 을 쓸 때 **반드시 `clearInterval` 로 정리** 해줘야 합니다. 안 그러면 컴포넌트가 사라진 뒤에도 인터벌이 살아있어요. **React 메모리 누수의 가장 흔한 패턴** 입니다.

#### 함정 시나리오 (잘못된 예)

```tsx
// ❌ 메모리 누수
function BadTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    // ❌ 클린업 없음 — interval 이 영원히 살아있음
  }, []);

  return <div>{seconds}s</div>;
}
```

이 코드의 증상:
- 컴포넌트가 사라진 후에도 콘솔에 1초마다 setSeconds 호출 시도
- 페이지 이동 후에도 백그라운드에서 메모리 점유
- 여러 번 마운트되면 인터벌이 누적되어 카운트가 빨라지는 듯한 버그

#### 올바른 패턴

```tsx
// ✅ 클린업으로 안전하게 정리
function GoodTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // ⭐ 클린업 — useEffect 가 반환하는 함수
    return () => clearInterval(id);
  }, []);

  return <div>{seconds}s</div>;
}
```

#### 클린업이 호출되는 시점

1. **컴포넌트 언마운트 시** — 화면에서 사라질 때
2. **의존성 배열이 바뀌어 effect 가 재실행되기 직전** — 이전 effect 정리 후 새 effect 시작

두 번째 시점이 중요합니다. 의존성이 자주 바뀌는 effect 라면, **매번 정리하고 새로 시작** 됩니다.

---

### 4. `useRef` — 두 가지 용도

`useRef` 는 헷갈리기 쉬운데, **두 가지 용도** 가 있다고 알아두시면 명료해집니다.
- **용도 A**: DOM 요소 직접 참조
- **용도 B**: 렌더와 무관하게 값을 저장

우리 타이머에선 **용도 B** 로 쓰입니다.

#### 용도 A — DOM 참조

```tsx
function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();  // 마운트되자마자 포커스
  }, []);

  return <input ref={inputRef} />;
}
```

`ref` 속성에 ref 객체를 넘기면, 마운트 후 `.current` 에 그 DOM 요소가 들어갑니다.

#### 용도 B — 렌더와 무관한 값 저장 (타이머에 쓰일 패턴)

```tsx
function Example() {
  const intervalIdRef = useRef<number | null>(null);

  const start = () => {
    intervalIdRef.current = window.setInterval(() => {
      console.log("tick");
    }, 1000);
  };

  const stop = () => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  return (
    <div>
      <button onClick={start}>시작</button>
      <button onClick={stop}>정지</button>
    </div>
  );
}
```

#### `useRef` vs `useState` — 핵심 차이

| 항목 | useState | useRef |
|---|---|---|
| 값 변경 시 | 컴포넌트 **리렌더** | 리렌더 안 함 |
| 읽기 / 쓰기 | `setX(v)` / `x` | `ref.current = v` / `ref.current` |
| 용도 | 화면에 보여줄 값 | 화면과 무관한 값 |

> 💡 **언제 무엇을 선택?**
> - **화면에 직접 보이는 값** (시간 표시, 버튼 텍스트) → `useState`
> - **컴포넌트가 기억은 해야 하지만 화면엔 안 보이는 값** (인터벌 ID, 이전 값) → `useRef`

타이머의 인터벌 ID 는 화면에 안 보이지만 정리(`clearInterval`)할 때 필요합니다. → `useRef` 가 적합.

---

### 5. SVG 원형 진행 게이지의 원리

타이머에 멋있는 원형 게이지를 그릴 건데, 사용하는 트릭이 흥미롭습니다. **SVG `<circle>` 의 `stroke-dasharray` 와 `stroke-dashoffset`** 두 속성으로 원의 일부분만 보이게 만드는 기법입니다.

#### 핵심 수식

```
원의 둘레 = 2 × π × 반지름
strokeDasharray = 둘레 (점선 길이 = 원 전체)
strokeDashoffset = 비워둘 양 (둘레 → 0 으로 줄이면 점점 채워짐)
```

- `dashoffset = 둘레` → 원이 안 보임 (0%)
- `dashoffset = 둘레 / 2` → 절반만 보임 (50%)
- `dashoffset = 0` → 원 전체가 보임 (100%)

#### 회전 트릭

기본 SVG 좌표는 **3시 방향** 에서 시작합니다. 12시 방향부터 시작하려면 **-90도 회전** 해야 합니다 (`-rotate-90` 클래스 또는 `transform="rotate(-90 cx cy)"`).

---

### 6. 시간 포맷팅 — 초를 `MM:SS` 로

화면에 시간을 표시하려면 단순 초 단위에서 사람이 읽기 좋은 형식으로 변환해야 합니다.

```tsx
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

formatTime(0);     // "00:00"
formatTime(65);    // "01:05"
formatTime(3725);  // "62:05"
```

**`padStart(2, "0")`**: 문자열 앞을 "0" 으로 채워서 최소 2자리 보장. `"5"` → `"05"`.

목표를 25분(1500초) 으로 잡을 거라 시 단위까지 안 가도 됩니다.

---

## 🛠 실습

이번 챕터는 네 단계로 진행됩니다. 골격을 먼저 만들고 useEffect 를 마지막에 붙이는 흐름입니다.

1. `CircularProgress` 컴포넌트 만들기 (SVG 원형 게이지)
2. `StudyTimer` 골격 만들기 (state + ref, 아직 시간 안 흐름)
3. useEffect 로 인터벌 + 클린업 붙이기 (살아 움직이기 시작)
4. 메인 페이지에 배치

---

### 1. `CircularProgress` 컴포넌트 만들기

먼저 시각적 부분 — 원형 게이지를 별도 컴포넌트로 만듭니다. 이렇게 분리하면 타이머 외에 다른 곳에서도 재사용할 수 있습니다.

```tsx
// components/CircularProgress.tsx
type CircularProgressProps = {
  progress: number;       // 0 ~ 1
  size?: number;          // 픽셀
  strokeWidth?: number;
  children?: React.ReactNode;  // 가운데 표시할 내용
};

export default function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 6,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#BEFC3D" />
          </linearGradient>
        </defs>
        {/* 배경 트랙 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* 진행 표시 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.5s ease",
            filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.4))",
          }}
        />
      </svg>
      {/* 가운데 children */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

부모로부터 `progress` 값(0~1) 을 받아 그 비율만큼 원호를 채워 표시합니다. 가운데에는 `children` 으로 받은 내용을 배치합니다 (시간 텍스트 등).

이 컴포넌트는 **순수한 표현(Presentational) 컴포넌트** 입니다. 자체적으로 기억할 값(state)이 없고, 부모가 전달한 props 만 받아 그립니다. 그래서 **훅이 하나도 등장하지 않습니다**.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
const radius = (size - strokeWidth) / 2;
```

반지름 계산. `strokeWidth` 를 빼는 이유: SVG 의 stroke 는 반지름의 안팎으로 절반씩 그려집니다. 빼지 않으면 stroke 가 SVG 경계 밖으로 튀어나갑니다.

```tsx
const circumference = 2 * Math.PI * radius;
```

원의 둘레 (수학 공식 그대로). 이 값이 `strokeDasharray` 에 들어가서 "전체 원 길이만큼의 점선" 을 설정합니다.

```tsx
const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
```

- `Math.max(0, Math.min(1, progress))` — progress 를 0~1 범위로 제한 (clamping). 잘못된 값(예: 1.5, -0.3)이 들어와도 안전.
- `1 - progress` — 비워둘 양. progress 가 0 이면 1 (전부 비움), 1 이면 0 (전부 채움).

```tsx
className="-rotate-90"
```

SVG 전체를 -90도 회전. 게이지 시작점을 3시 → 12시 방향으로 옮깁니다.

```tsx
<defs>
  <linearGradient id="progress-gradient" ...>
    <stop offset="0%" stopColor="#00D9FF" />
    <stop offset="100%" stopColor="#BEFC3D" />
  </linearGradient>
</defs>
```

선형 그라데이션 정의. ID 로 참조해서 stroke 색으로 사용 (`stroke="url(#progress-gradient)"`). 시안 → 라임 의 DevLog 시그니처 그라데이션입니다.

```tsx
strokeLinecap="round"
```

선의 끝을 둥글게. 부드러운 인상을 줍니다.

```tsx
strokeDasharray={circumference}
strokeDashoffset={offset}
```

이 두 줄이 **원형 게이지의 핵심**. dasharray 는 점선 패턴, dashoffset 은 시작 지점 오프셋. 둘이 조합되어 "원의 일부만 보이는" 효과를 만듭니다.

```tsx
style={{
  transition: "stroke-dashoffset 0.5s ease",
  filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.4))",
}}
```

- `transition` — offset 이 바뀔 때 0.5초에 걸쳐 부드럽게 변화 (1초 단위로 게이지가 톡톡 끊기지 않고 매끄럽게 흐름)
- `drop-shadow` — 게이지 주변 시안색 글로우 효과 (시각적 강조)

```tsx
<div className="absolute inset-0 flex flex-col items-center justify-center">
  {children}
</div>
```

SVG 위에 절대 위치로 children 을 배치. SVG 가운데에 시간 텍스트가 떠있는 것처럼 보이게 합니다.

---

### 2. `StudyTimer` 골격 만들기 (useState + useRef, 아직 시간 안 흐름)

타이머의 골격을 먼저 만듭니다. 시작/정지 버튼이 있고, useRef 로 인터벌 ID 보관할 자리를 준비합니다. **이 시점에선 아직 시간이 안 흐릅니다** — 다음 단계에서 useEffect 를 붙입니다.

```tsx
// components/StudyTimer.tsx
"use client";

import { useRef, useState } from "react";
import CircularProgress from "./CircularProgress";

const TARGET_SECONDS = 25 * 60;  // 25분 (Pomodoro)

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudyTimer() {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 인터벌 ID 보관 — useRef
  const intervalRef = useRef<number | null>(null);

  const handleStart = () => {
    setIsRunning(true);
    // setInterval 시작은 다음 단계에서 useEffect 로
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const progress = seconds / TARGET_SECONDS;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
      <div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">
        Study Timer
      </div>
      <div className="mb-6 text-sm text-zinc-400">
        목표: {TARGET_SECONDS / 60}분 집중
      </div>

      <div className="mb-6 flex justify-center">
        <CircularProgress progress={progress} size={220}>
          <div className="font-mono text-4xl font-medium tabular-nums text-white">
            {formatTime(seconds)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            {isRunning ? "● RECORDING" : "● STANDBY"}
          </div>
        </CircularProgress>
      </div>

      <div className="flex justify-center gap-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
          >
            시작
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="rounded-lg bg-zinc-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            정지
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-zinc-800 bg-transparent px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

이 시점의 StudyTimer 는 **3개 훅을 가지지만 아직 시간은 안 흐릅니다**. 시작 버튼을 누르면 `isRunning` 만 true 가 되고, 라벨이 `● STANDBY` 에서 `● RECORDING` 으로 바뀝니다. 다음 단계에서 useEffect 로 인터벌을 붙여 살아 움직이게 만듭니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

useState / useRef / onClick 을 쓰기 때문에 Client Component 필요 (챕터 07 에서 다룸).

```tsx
const TARGET_SECONDS = 25 * 60;
```

목표 시간을 컴포넌트 밖 상수로 정의. 25분 = 1500초.

> 💡 **왜 컴포넌트 밖에 두나?**: 컴포넌트 안에 두면 매 렌더마다 새로 만들어집니다. 변하지 않는 상수는 밖에 두는 게 효율적이고 의도도 명확합니다.

```tsx
const [seconds, setSeconds] = useState<number>(0);
const [isRunning, setIsRunning] = useState<boolean>(false);
```

두 개의 state 를 분리해서 관리:
- **`seconds`** — 흘러간 시간. 1초마다 변경되어 화면 텍스트와 게이지에 반영
- **`isRunning`** — 진행 중인지 여부. 버튼 모양과 라벨에 반영

> 💡 **왜 두 개로 분리?** 서로 다른 책임입니다. `seconds` 는 "얼마나 흘렀나", `isRunning` 은 "지금 흐르고 있나". 한 객체로 묶을 수도 있지만 따로가 단순합니다. 다음 단계의 useEffect 에서 의존성으로 `[isRunning]` 만 넣을 거라 분리해두는 게 유리합니다.

```tsx
const intervalRef = useRef<number | null>(null);
```

인터벌 ID 를 저장할 ref. 다음 단계에서 useEffect 안에서 `intervalRef.current = window.setInterval(...)` 으로 ID 를 저장하고, 클린업에서 `clearInterval(intervalRef.current)` 로 정리합니다.

- **타입 `number | null`** — 처음엔 null (인터벌 안 돌고 있음), 시작 후엔 number (브라우저의 setInterval 이 반환하는 ID)
- **왜 state 가 아닌 ref?** — ID 는 화면에 안 보이는 값. state 로 두면 ID 가 바뀔 때마다 불필요한 리렌더가 발생합니다.

```tsx
const progress = seconds / TARGET_SECONDS;
```

진행률 계산. state 가 아닌 **매 렌더마다 계산되는 변수**. seconds 가 바뀌면 컴포넌트가 리렌더되면서 자동으로 다시 계산됩니다.

```tsx
{!isRunning ? (
  <button onClick={handleStart}>시작</button>
) : (
  <button onClick={handleStop}>정지</button>
)}
```

isRunning 에 따라 시작/정지 버튼을 토글. 시작 버튼은 시안색(주요 행동), 정지 버튼은 회색(중성적).

```tsx
{isRunning ? "● RECORDING" : "● STANDBY"}
```

상태 라벨. ● 기호 + 대문자 + 좁은 자간으로 모니터링 화면 느낌 연출.

```tsx
className="font-mono text-4xl font-medium tabular-nums"
```

- **`font-mono`** — 모노스페이스(고정폭) 폰트. 숫자가 1초마다 바뀌어도 자리 변동 없음
- **`tabular-nums`** — 폰트가 모노스페이스가 아니어도 숫자만 고정폭으로. 이중 안전장치

---

### 3. `useEffect` 로 인터벌 + 클린업 붙이기

이번 단계가 이 챕터의 **가장 중요한 부분** 입니다. useEffect 안에서 setInterval 시작하고, 클린업으로 정리하는 패턴. **이 패턴 한 번 익혀두시면 평생 갑니다.**

`components/StudyTimer.tsx` 의 코드 일부를 다음과 같이 수정합니다.

```tsx
// components/StudyTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";  // ⭐ useEffect 추가
import CircularProgress from "./CircularProgress";

const TARGET_SECONDS = 25 * 60;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudyTimer() {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  // ⭐ 핵심: isRunning 이 바뀔 때마다 effect 실행
  useEffect(() => {
    if (!isRunning) return;  // 정지 상태면 아무것도 안 함

    // 인터벌 시작 — 1초마다 seconds + 1
    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);  // 업데이터 함수로 이전 값 안전하게 사용
    }, 1000);

    // ⭐ 클린업: 다음 effect 실행 전 또는 언마운트 시
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);  // ⭐ 의존성: isRunning

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const progress = seconds / TARGET_SECONDS;

  // 나머지 JSX 는 이전 단계와 동일
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
      {/* ... 이전과 동일 ... */}
    </div>
  );
}
```

> 💡 JSX 부분은 이전 단계와 동일합니다. **추가된 것은 `useEffect` 와 `import { useEffect }` 뿐** 입니다.

#### 동작 흐름 — 천천히 짚어보기

useEffect 가 어떻게 동작하는지 단계별로:

```
1. 컴포넌트 처음 마운트
   ↓
2. isRunning = false 라 effect 시작하자마자 return
   (인터벌 안 돌아감)
   ↓
3. 사용자가 "시작" 버튼 클릭
   ↓
4. setIsRunning(true) → React 리렌더 예약
   ↓
5. 컴포넌트 다시 렌더링 (isRunning = true)
   ↓
6. useEffect 가 의존성 변화 감지 → effect 함수 재실행
   ↓
7. 이번엔 isRunning 이 true → setInterval 시작 + ID 를 ref 에 저장
   ↓
8. 1초 후, setSeconds((prev) => prev + 1) 호출
   ↓
9. React 리렌더 (seconds = 1)
   ↓
10. 화면의 시간 텍스트와 게이지가 0:01 로 바뀜
    (이후 1초마다 8~10 반복)
   ↓
11. 사용자가 "정지" 버튼 클릭
   ↓
12. setIsRunning(false) → React 리렌더 예약
   ↓
13. useEffect 가 의존성 변화 감지 → 클린업 먼저 호출
   ↓
14. clearInterval(ID) 로 인터벌 정리
   ↓
15. 새 effect 실행되지만 isRunning = false 라 즉시 return
```

#### 코드의 핵심 포인트

**① `if (!isRunning) return`**

정지 상태일 때 아무것도 하지 않습니다. 클린업도 반환하지 않으니, 정지 상태에서는 useEffect 가 "껍데기만 실행되고 끝" 입니다.

**② `intervalRef.current = window.setInterval(...)`**

인터벌 ID 를 ref 에 저장. 이 ID 가 있어야 나중에 정확히 그 인터벌을 정리할 수 있습니다.

> 💡 **`window.setInterval` 쓰는 이유**: 브라우저 환경에선 `setInterval` 이 number 를 반환합니다. Node.js 환경의 setInterval 은 다른 객체를 반환해서 타입 충돌이 날 수 있습니다. `window.` 를 명시적으로 붙이면 TypeScript 가 브라우저 버전으로 인식합니다.

**③ `setSeconds((prev) => prev + 1)` — 업데이터 함수**

`setSeconds(seconds + 1)` 이 아니라 `setSeconds((prev) => prev + 1)` 을 쓴 이유가 있습니다.

useEffect 는 `[isRunning]` 의존성이라 isRunning 바뀔 때만 재실행됩니다. 그런데 effect 안의 `seconds` 변수는 **effect 실행 시점의 값** 으로 고정 (이걸 **클로저 캡처** 라고 부릅니다).

즉:
- 시작 시점에 `seconds = 0` 으로 캡처됨
- 1초 후, 2초 후, 3초 후 모두 `seconds = 0` 으로 보임
- 매번 `setSeconds(0 + 1)` → 결과는 항상 1

**업데이터 함수** `(prev) => prev + 1` 은 setState 가 호출되는 **시점의 최신 값** 을 인자로 받습니다. 클로저 캡처와 무관하게 항상 최신 값으로 업데이트됩니다.

> 💡 **이 패턴은 useEffect 안의 setInterval 에서 거의 항상 필요** 합니다. 외워두세요.

**④ 클린업 함수의 가드**

```tsx
return () => {
  if (intervalRef.current !== null) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};
```

`intervalRef.current` 가 null 일 수도 있으니 (early return 으로 setInterval 실행 안 된 경우), null 체크 후 clearInterval. 그리고 ID 를 null 로 다시 설정 (메모리 정리 + 다음 사이클을 위한 초기화).

**⑤ 의존성 배열 `[isRunning]`**

여기에 `seconds` 를 넣으면 안 됩니다. seconds 가 매 초 바뀌면서 effect 가 재실행 → 인터벌이 매 초 끊기고 재시작되는 끔찍한 일이 일어납니다.

`isRunning` 만 의존성으로 — "시작/정지 토글 순간만 effect 가 반응" 하는 게 의도입니다.

---

#### 클린업 동작 직접 보기 (선택 사항)

원하시면 useEffect 안에 임시로 `console.log` 를 추가해서 클린업이 실제로 호출되는지 확인하실 수 있습니다.

```tsx
useEffect(() => {
  if (!isRunning) return;
  console.log("⏱ 인터벌 시작");

  intervalRef.current = window.setInterval(() => {
    setSeconds((prev) => prev + 1);
  }, 1000);

  return () => {
    console.log("🧹 클린업 호출");
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [isRunning]);
```

브라우저 콘솔 (F12) 을 열어두고 시작/정지를 반복하면, 두 메시지가 번갈아 나타나는 걸 볼 수 있습니다. 확인하셨으면 console.log 들 제거해주세요.

---

### 4. 메인 페이지에 타이머 배치

`app/page.tsx` 의 히어로 섹션을 수정해서 왼쪽에는 텍스트, 오른쪽에는 타이머가 배치되도록 만듭니다.

```tsx
// app/page.tsx (수정)
"use client";

import { useState } from "react";
import Container from "@/components/Container";
import PostCard from "@/components/PostCard";
import TagFilter from "@/components/TagFilter";
import EmptyState from "@/components/EmptyState";
import StudyTimer from "@/components/StudyTimer";  // ⭐ 추가

// posts, tags 정의는 챕터 07 과 동일 (생략)

export default function HomePage() {
  const [activeTag, setActiveTag] = useState<string>("all");
  const filteredPosts = activeTag === "all"
    ? posts
    : posts.filter((p) => p.tag === activeTag);

  return (
    <Container>
      {/* ⭐ 히어로 섹션 + 타이머 — 좌우 2열 */}
      <section className="border-b border-zinc-900 py-16">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-3 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-400">
              개발자 학습 기록 · DevLog
            </div>
            <h1 className="mb-4 text-5xl font-semibold tracking-tight">
              매일 배우고,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-lime-300 bg-clip-text text-transparent">
                매일 기록합니다.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-zinc-400">
              개발자가 학습한 내용을 정리하고, 시간을 추적하고, 성장을
              시각화하는 공간입니다.
            </p>
          </div>

          {/* ⭐ 학습 타이머 */}
          <StudyTimer />
        </div>
      </section>

      {/* 글 목록 섹션 (챕터 07 과 동일) */}
      <section className="py-12">
        {/* ... 이전과 동일 ... */}
      </section>
    </Container>
  );
}
```

> 💡 글 목록 섹션 부분은 챕터 07 과 동일합니다. **변경된 것은 히어로 섹션 부분과 `import StudyTimer` 추가뿐** 입니다.

#### 반응형 레이아웃 살펴보기

```tsx
<div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
```

- **모바일 (기본)**: grid 의 기본은 한 열. 헤드라인 위, 타이머 아래로 자연스럽게 쌓임
- **데스크톱 (`md:` = 768px 이상)**: `grid-cols-[1fr_auto]` — 좌측은 남는 공간 전부(1fr), 우측은 콘텐츠 크기(auto)
- **`md:items-center`** — 데스크톱에서 세로 가운데 정렬 (타이머와 헤드라인의 중심선이 맞음)

이 한 줄로 데스크톱/모바일 모두 자연스러운 레이아웃이 만들어집니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

- 히어로 섹션 옆에 학습 타이머 등장 (데스크톱), 또는 아래에 (모바일)
- **"시작"** 클릭 → 시간이 흐르기 시작. 원형 게이지가 시안→라임 그라데이션으로 천천히 채워짐 ⭐
- 라벨이 `● STANDBY` → `● RECORDING` 로 전환
- **"정지"** 클릭 → 시간 멈춤. 게이지는 그대로 유지
- **"초기화"** 클릭 → 0:00 으로 리셋
- 25분 (1500초) 도달 시 게이지가 100% 채워짐

여기까지 정상 동작하면 이번 챕터의 목표는 달성된 것입니다.

> ⚠️ **참고**: 현재 학습 시간은 페이지 새로고침 시 사라집니다. **챕터 17 에서 DB 와 연결** 해서 영구 기록으로 만들 예정입니다.

---

## ❓ 흔한 실수

### Q1. 클린업 빠뜨려서 인터벌이 멈추지 않음
useEffect 의 return 문이 없으면 메모리 누수. 시작/정지를 반복하면 인터벌이 누적되어 시간이 빠르게 흐르는 듯한 버그가 발생합니다. 항상 `return () => clearInterval(...)` 패턴 기억하세요.

### Q2. 의존성 배열에 `seconds` 를 넣음
```tsx
}, [isRunning, seconds]);  // ❌
```
seconds 가 매 초 바뀌면서 effect 가 매 초 재실행 → 인터벌이 매 초 끊기고 재시작. 결과적으로 시간이 들쭉날쭉해집니다. **isRunning 만** 의존성으로.

### Q3. `setSeconds(seconds + 1)` 사용 (업데이터 함수 안 씀)
클로저 캡처 함정. effect 안의 seconds 는 effect 실행 시점의 값으로 고정되어 항상 0+1 = 1만 호출됩니다. **`(prev) => prev + 1`** 패턴 필수.

### Q4. `setInterval` 만 쓰고 ref 없이 정리하려 함
```tsx
useEffect(() => {
  setInterval(() => { ... }, 1000);
  return () => clearInterval();  // ❌ 어떤 ID를 정리할지 모름
}, []);
```
clearInterval 은 특정 ID 가 필요합니다. setInterval 의 반환값을 어딘가에 저장해야 합니다 (ref 또는 effect 안의 지역 변수).

### Q5. `useRef` 의 `.current` 접근 깜빡함
```tsx
clearInterval(intervalRef);  // ❌ ref 객체 자체를 전달
clearInterval(intervalRef.current);  // ✅
```
useRef 가 반환하는 건 `{ current: ... }` 객체. 값에 접근하려면 항상 `.current`.

### Q6. `"use client"` 빠뜨림
useEffect, useRef, useState, onClick 등 모두 클라이언트에서 동작. 파일 맨 위에 `"use client";` 한 줄 필수.

### Q7. SVG 게이지가 안 보이거나 위치가 어긋남
- `viewBox` 가 올바르게 설정되었는지 확인
- `cx`, `cy`, `r` 값이 SVG 크기와 맞는지 (지름이 너비를 넘으면 안 됨)
- `stroke="none"` 이거나 색상이 배경과 같진 않은지

### Q8. 시간이 1초가 아닌 단위로 깜빡거림
브라우저의 `setInterval` 은 정확한 1000ms 를 보장하지 않습니다 (탭이 백그라운드로 가면 느려지기도). 1초 단위가 살짝 흔들려도 정상입니다. 정밀한 타이밍이 필요하면 `Date.now()` 로 절대 시간 차이를 계산하는 패턴을 쓰시면 됩니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] 사이드 이펙트가 무엇이고 왜 따로 다뤄야 하는지 안다
- [ ] `useEffect` 의 세 부분 (effect 함수, 의존성 배열, 클린업) 의 역할을 안다
- [ ] 의존성 배열의 3가지 패턴 (없음, 빈 배열, 값 배열) 의 차이를 안다
- [ ] **클린업 함수가 언제 호출되는지** 두 시점을 설명할 수 있다
- [ ] `useRef` 의 두 가지 용도 (DOM 참조, 값 저장) 를 안다
- [ ] **`useRef` vs `useState`** 의 선택 기준을 안다 (화면에 보이는지 여부)
- [ ] setInterval 의 클로저 캡처 함정과 **업데이터 함수** 의 역할을 안다
- [ ] SVG `strokeDasharray` + `strokeDashoffset` 의 원리를 안다
- [ ] http://localhost:3000 에서 학습 타이머가 정상 동작한다 (시작/정지/초기화 + 게이지 채워짐)

---

## ✅ 다음 챕터 예고

> **챕터 09: useMemo + useCallback (성능 최적화)**
> React 의 또 다른 두 훅을 배웁니다. 비싼 계산 결과나 함수 참조를 캐시해서 불필요한 재계산을 피하는 패턴입니다. 글 목록에 검색어 필터를 추가하면서 useMemo 의 진가를 체감하게 됩니다.
