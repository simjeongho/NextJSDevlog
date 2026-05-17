# 챕터 17: 잔디밭 + 차트 대시보드 ⭐⭐⭐

> **시간**: 약 30분 · **블록**: Day 2 / Block 5

---

## 🎯 이 챕터에서 다룰 내용

- **GitHub 스타일 잔디밭(Contribution Graph)** 을 SVG 로 직접 구현 ⭐
- **Recharts** 라이브러리로 주간 학습 시간 차트
- 학습 타이머를 DB 와 연결 — 학습 로그 영구 저장
- `/dashboard` 페이지 — 미들웨어로 보호되는 개인 대시보드
- 누적 학습 시간, 연속 학습 일수(streak), 통계 카드

이번 챕터가 **메인 데모** 입니다. GitHub 의 그 잔디밭 — 일별 학습량을 색깔 진하기로 표현하는 위젯 — 을 SVG 로 직접 만듭니다. 그리고 Recharts 로 주간 차트도 띄워요.

지금까지 만든 모든 게 여기서 합쳐집니다. **타이머(Ch.08) → DB 저장(Ch.15) → 잔디밭 시각화** 의 흐름이에요. Day 2 의 정점입니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `lib/db/schema.ts` — `studyLogs` 테이블 추가 (수정)
- `lib/study-logs.ts` — 학습 로그 데이터 모듈 (신규)
- `lib/actions.ts` — `saveStudySession` Server Action 추가 (수정)
- `components/StudyTimer.tsx` — 정지 시 DB 저장 (수정)
- `components/ContributionGraph.tsx` — 잔디밭 SVG (신규)
- `components/WeeklyChart.tsx` — Recharts 막대 차트 (신규)
- `components/StatCard.tsx` — 통계 카드 (신규)
- `app/dashboard/page.tsx` — 대시보드 (신규, Server Component)

---

## 🧠 핵심 개념

### 1. 잔디밭(Contribution Graph) 의 구조

GitHub 의 그 잔디밭, 다들 보셨죠. 한 해 동안의 활동량을 격자 형태로 보여주는 위젯입니다. 사실 **구조는 매우 단순** 합니다.

**26주 × 7일 = 182개의 작은 사각형**. 각 칸의 색깔이 그 날의 활동량을 나타냅니다.

#### 데이터 → 시각화 매핑

```
DB 의 study_logs:
[
  { startedAt: "2025-04-30T...", durationSeconds: 1500 },
  { startedAt: "2025-04-30T...", durationSeconds: 900 },
  { startedAt: "2025-04-29T...", durationSeconds: 2700 },
  ...
]
       ↓ 날짜별 집계
Map: { "2025-04-30" → 2400, "2025-04-29" → 2700, ... }
       ↓ 26주 격자에 매핑
SVG: 각 칸의 색깔이 시간에 비례 (0 → 어두움, 많음 → 진한 시안)
```

같은 날에 여러 번 학습한 기록은 **합산** 됩니다. 그 합계에 따라 색의 진하기가 결정됩니다.

---

### 2. SVG 좌표 시스템

잔디밭을 SVG 로 그리려면 좌표를 알아야 합니다.

**SVG 의 (0, 0) 은 좌상단** 입니다. x 가 오른쪽 방향, y 가 **아래 방향** 이에요 (수학 좌표계와 y 가 반대).

#### 격자 좌표 계산

```typescript
const CELL_SIZE = 12;
const CELL_GAP = 3;

// week: 0 ~ 25 (가로, 왼쪽이 옛날)
// day:  0 ~ 6  (세로, 0 = 일요일)

const x = week * (CELL_SIZE + CELL_GAP);
const y = day * (CELL_SIZE + CELL_GAP);

<rect x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} ... />
```

각 칸은 12px × 12px, 칸 사이 3px 여백.

```
week=0    week=1    week=2    ...
┌──┐     ┌──┐     ┌──┐
│일│ ←── │일│ ←── │일│        ← day=0
└──┘     └──┘     └──┘
┌──┐     ┌──┐     ┌──┐
│월│     │월│     │월│        ← day=1
└──┘     └──┘     └──┘
 ...
```

---

### 3. 활동량 → 색 강도 매핑

활동량이 0 부터 매우 많음까지 5단계로 나뉩니다. 각 단계마다 색을 다르게 줘서 시각적으로 한눈에 파악되게 합니다.

```typescript
function intensityForSeconds(seconds: number): 0 | 1 | 2 | 3 | 4 {
  if (seconds === 0) return 0;       // 없음
  if (seconds < 1800) return 1;       // < 30분
  if (seconds < 3600) return 2;       // 30분 ~ 1시간
  if (seconds < 7200) return 3;       // 1 ~ 2시간
  return 4;                            // 2시간+
}

const COLORS = [
  "#1a1d23",                       // 0 - 어두운 회색
  "rgba(0, 217, 255, 0.18)",       // 1 - 매우 흐린 시안
  "rgba(0, 217, 255, 0.38)",       // 2
  "rgba(0, 217, 255, 0.65)",       // 3
  "rgba(0, 217, 255, 0.95)",       // 4 - 진한 시안
];
```

`rgba()` 의 마지막 숫자가 투명도 (alpha). 높을수록 진합니다.

---

### 4. Recharts — React 의 차트 라이브러리

**Recharts** 는 React 답게 **컴포넌트 합성** 으로 차트를 만듭니다. 명령형으로 그리지 않고, 선언적으로 조합해요.

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

<BarChart width={500} height={200} data={data}>
  <XAxis dataKey="day" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="minutes" fill="#00D9FF" />
</BarChart>
```

각 컴포넌트가 차트의 한 요소를 담당합니다 — X축, Y축, 툴팁, 막대. 필요한 것만 조합해서 차트를 구성합니다.

> 💡 **다른 차트 라이브러리** (Chart.js, D3 등) 와 달리 Recharts 는 **JSX 그대로** 사용 가능. React 개발자에게 가장 친화적입니다.

---

### 5. Server Component 의 정점

이번 챕터의 대시보드 페이지가 우리 프로젝트에서 **Server Component 의 진가가 가장 잘 드러나는 페이지** 입니다.

```tsx
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session.user.id;

  // 3개 쿼리 병렬 실행
  const [dailyMap, stats, weeklyData] = await Promise.all([
    getDailyStudyMap(userId, 26 * 7),
    getStudyStats(userId),
    getWeeklyData(userId),
  ]);

  return (
    <Container>
      <ContributionGraph data={dailyMap} />
      <WeeklyChart data={weeklyData} />
      <StatCard ... />
    </Container>
  );
}
```

만약 이게 Client Component 였다면:
- useState 여러 개 (data, isLoading, error)
- useEffect 안에서 3개 fetch
- 각 fetch 의 로딩/에러 처리
- 코드량이 몇 배로

Server Component 라서:
- **한 줄로 세션 확인**
- **`Promise.all` 로 병렬 쿼리**
- **HTML 에 완성된 결과 포함**

지금까지 챕터 12 → 13 → 15 → 16 에서 쌓은 모든 패턴이 이 한 페이지에 결합합니다.

---

### 6. Hydration mismatch 회피 패턴 — `useSyncExternalStore`

이번 챕터의 잔디밭(`ContributionGraph`) 에서 실제로 마주치는 이슈입니다. 개념을 먼저 짚고 갑니다.

#### Hydration 이 뭐였더라

챕터 12 에서 다룬 내용을 짧게 복습합니다.

1. **서버** 가 컴포넌트를 실행해 **HTML 을 생성** → 브라우저로 전송
2. 브라우저가 HTML 을 일단 화면에 그림 (사용자는 빠르게 본다)
3. JS 번들이 도착하면 React 가 **같은 컴포넌트를 클라이언트에서 다시 실행**
4. 그 결과와 서버 HTML 을 매칭 → 이벤트 핸들러 연결 (이 과정이 **Hydration**)

이때 **3번의 클라이언트 결과** 와 **1번의 서버 HTML** 이 **일치해야 합니다.** 다르면 React 가 경고를 띄워요.

```
Error: Hydration failed because the server rendered HTML
didn't match the client.
```

#### 무엇이 두 결과를 다르게 만드는가

서버와 클라이언트의 환경이 다르기 때문입니다.

- **`new Date()`** — 서버 시각 ≠ 클라이언트 시각 (1초만 차이 나도 다른 결과)
- **`Math.random()`** — 매번 다른 값
- **타임존** — 서버는 UTC, 클라이언트는 한국 시간일 수 있음
- **`window`, `localStorage`** — 서버엔 존재하지 않음

특히 **`new Date().toISOString().split("T")[0]`** 패턴은 한국 시간 자정 근처에서 위험합니다.

```typescript
// 한국 시간 2025-04-30 23:50:00 일 때
new Date().toISOString()
// 서버 (UTC):    "2025-04-30T14:50:00.000Z"  → "2025-04-30"
// 클라이언트도 같은 시점이면 결과 같음 ✓

// 한국 시간 2025-05-01 00:05:00 일 때
new Date().toISOString()  
// 서버 (UTC):    "2025-04-30T15:05:00.000Z"  → "2025-04-30" ⚠️
// 클라이언트: 한국 시간으로는 5/1 인데 UTC 변환하면 4/30
// 그리고 더 위험한 건: 서버와 클라이언트 실행 시점이 자정을 가로지르면 날짜가 어긋남
```

#### 표준 해결책 — `useSyncExternalStore`

React 18 에 도입된 `useSyncExternalStore` 가 **공식 권장** 패턴입니다.

```tsx
"use client";

import { useSyncExternalStore } from "react";

// 모듈 레벨 — 한 번만 정의
const emptySubscribe = () => () => {};
const getSnapshot = () => true;          // 클라이언트에선 항상 true
const getServerSnapshot = () => false;   // 서버 + Hydration 시점엔 false

export default function MyComponent() {
  // mounted = 서버 false / Hydration 시점 false / 그 후 클라이언트 true
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <div />;  // 또는 스켈레톤 — 서버 + Hydration 시점 출력
  }

  // 여기서부터는 클라이언트 — new Date() 안전
  const today = new Date();
  // ... 환경 의존 코드 마음껏 사용
}
```

**시점별 동작**:
- 서버 렌더: `getServerSnapshot()` 호출 → `false` → 빈 화면 HTML
- 클라이언트 Hydration: `getServerSnapshot()` 또 호출 → `false` → 빈 화면 (서버와 일치 ✓)
- 그 후 클라이언트 렌더: `getSnapshot()` 호출 → `true` → 진짜 내용

**왜 이 API 인가**:
- 세 번째 인자 `getServerSnapshot` 이 **"서버 + Hydration 시점 전용 값"** 을 명시적으로 받음. React 가 이 시점에는 이 값을 쓴다고 보장
- 서버와 클라이언트에서 다른 값을 반환해도 **React 가 미스매치 처리를 내부적으로 안전하게 수행**
- 첫 번째 인자 `subscribe` 는 외부 스토어 구독용. 우리는 "외부 변화" 가 없으므로 빈 함수 반환

> 💡 **흔히 보이는 mounted 패턴 (`useState + useEffect`) 과의 차이**: 옛날엔 `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])` 패턴을 많이 썼습니다. 이 패턴은 React 19 에서 **"effect 안에서 setState 동기 호출 = cascading render"** 라는 경고를 띄웁니다. `useSyncExternalStore` 는 이 문제 없이 동일한 효과를 냅니다.

> 💡 **트레이드오프**: 사용자는 첫 화면에서 빈 영역을 잠깐 보게 됩니다 (Hydration 직후 즉시 채워짐). SEO 가 중요한 콘텐츠 (글 제목, 본문) 에는 부적절. **사용자별 위젯 (잔디밭, 다크모드 토글 등)** 에 적합한 패턴입니다.

이번 챕터의 `ContributionGraph` 에 이 패턴을 적용합니다.

---

## 🛠 실습

여덟 단계로 진행됩니다. 빠르게 가요.

1. Recharts 설치 + studyLogs 테이블 추가
2. `lib/study-logs.ts` 데이터 모듈
3. `lib/actions.ts` 에 `saveStudySession` 추가
4. `StudyTimer` 수정 — 정지 시 DB 저장
5. `ContributionGraph` 잔디밭 컴포넌트 ⭐
6. `WeeklyChart` Recharts 막대 차트
7. `StatCard` 통계 카드
8. `app/dashboard/page.tsx` 대시보드 페이지

---

### 1. Recharts 설치 + DB 스키마 확장

먼저 Recharts 패키지를 설치합니다.

```bash
npm install recharts
```

그리고 `lib/db/schema.ts` 에 **`studyLogs` 테이블** 을 추가합니다 (기존 posts 테이블 아래에).

```typescript
// lib/db/schema.ts (추가 부분)
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// ... 기존 posts 테이블 그대로 유지 ...

// ⭐ 학습 로그 테이블 추가
export const studyLogs = pgTable("study_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StudyLog = typeof studyLogs.$inferSelect;
export type NewStudyLog = typeof studyLogs.$inferInsert;
```

DB 에 적용:

```bash
npx drizzle-kit push
```

#### 스키마 설계 의미 짚기

```typescript
userId: varchar("user_id", { length: 100 }).notNull(),
```

NextAuth 세션의 user.id (챕터 16 의 callbacks 에서 추가했던 그 필드). varchar 100 자면 충분.

```typescript
startedAt: timestamp("started_at").notNull(),
```

학습 시작 시각. **시작** 시각만 저장하는 이유:
- 학습 종료 시각 = startedAt + durationSeconds 로 자동 계산
- 시간대 변환 등에 timestamp 하나로 충분

```typescript
durationSeconds: integer("duration_seconds").notNull(),
```

학습 시간을 초 단위 정수로. 1분 = 60, 25분 = 1500 같이.

```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
```

**자동 채워지는 생성 시각**. 챕터 15 의 posts 와 같은 패턴. INSERT 시 따로 안 넘겨도 자동.

> 💡 **`startedAt` vs `createdAt` 의 차이**: 
> - `startedAt`: 학습이 실제로 시작된 시점 (사용자가 시작 버튼 누른 시점)
> - `createdAt`: DB row 가 만들어진 시점 (사용자가 정지 버튼 누른 시점)
> 보통 두 시각은 거의 같지만 약간 차이가 있을 수 있어 분리.

---

### 2. `lib/study-logs.ts` 데이터 모듈

학습 로그 관련 함수들을 모은 모듈입니다. `lib/study-logs.ts` 를 새로 만들어주세요.

```typescript
// lib/study-logs.ts
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { studyLogs } from "./db/schema";

// ⭐ 학습 로그 추가
export async function addStudyLog(input: {
  userId: string;
  startedAt: Date;
  durationSeconds: number;
}) {
  const [log] = await db
    .insert(studyLogs)
    .values({
      userId: input.userId,
      startedAt: input.startedAt,
      durationSeconds: input.durationSeconds,
    })
    .returning();
  return log;
}

// ⭐ 사용자의 최근 로그 조회
export async function getRecentStudyLogs(userId: string, days: number = 182) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return await db
    .select()
    .from(studyLogs)
    .where(eq(studyLogs.userId, userId))
    .orderBy(desc(studyLogs.startedAt));
}

// ⭐ 날짜별 학습 시간 집계 (잔디밭용)
export async function getDailyStudyMap(
  userId: string,
  days: number = 182
): Promise<Map<string, number>> {
  const logs = await getRecentStudyLogs(userId, days);
  const map = new Map<string, number>();

  for (const log of logs) {
    const dateKey = log.startedAt.toISOString().split("T")[0]; // YYYY-MM-DD
    map.set(dateKey, (map.get(dateKey) ?? 0) + log.durationSeconds);
  }

  return map;
}

// ⭐ 통계: 누적 시간, 이번 주, streak
export async function getStudyStats(userId: string) {
  const allLogs = await db
    .select()
    .from(studyLogs)
    .where(eq(studyLogs.userId, userId));

  const totalSeconds = allLogs.reduce(
    (sum, log) => sum + log.durationSeconds,
    0
  );

  // 이번 주 (월요일~) 계산
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekSeconds = allLogs
    .filter((log) => log.startedAt >= weekStart)
    .reduce((sum, log) => sum + log.durationSeconds, 0);

  // streak 계산 (오늘부터 거꾸로 연속 학습 일수)
  const dailyMap = new Map<string, number>();
  for (const log of allLogs) {
    const key = log.startedAt.toISOString().split("T")[0];
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + log.durationSeconds);
  }

  let streak = 0;
  const checkDate = new Date();
  while (true) {
    const key = checkDate.toISOString().split("T")[0];
    if ((dailyMap.get(key) ?? 0) > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { totalSeconds, weekSeconds, streak };
}

// ⭐ 주간 차트용 (최근 7일)
export async function getWeeklyData(userId: string) {
  const dailyMap = await getDailyStudyMap(userId, 7);
  const result: { day: string; minutes: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    const dayLabel = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    const seconds = dailyMap.get(key) ?? 0;
    result.push({
      day: dayLabel,
      minutes: Math.round(seconds / 60),
    });
  }

  return result;
}
```

#### 이 모듈이 하는 일

학습 로그 데이터에 대한 **5가지 작업** 을 제공합니다. 각각 다른 화면 요소에서 필요로 하는 형태로 데이터를 변환해줍니다.

#### 5개 함수 한눈에 보기

| 함수 | 입력 | 출력 | 어디서 쓰나 |
|---|---|---|---|
| `addStudyLog` | userId, startedAt, durationSeconds | 저장된 row | 타이머 정지 시 |
| `getRecentStudyLogs` | userId, days | StudyLog[] | 다른 함수의 기반 |
| `getDailyStudyMap` | userId, days | Map<날짜, 초> | 잔디밭 |
| `getStudyStats` | userId | { 누적, 주간, streak } | 통계 카드 |
| `getWeeklyData` | userId | [{ day, minutes }] | 주간 차트 |

각 화면 요소가 필요한 형태로 데이터가 미리 가공되어 있어, 페이지 컴포넌트는 단순히 호출만 하면 됩니다.

#### 코드 한 줄 한 줄 의미 짚기 — `getDailyStudyMap` (잔디밭의 핵심)

```typescript
const logs = await getRecentStudyLogs(userId, days);
const map = new Map<string, number>();

for (const log of logs) {
  const dateKey = log.startedAt.toISOString().split("T")[0];
  map.set(dateKey, (map.get(dateKey) ?? 0) + log.durationSeconds);
}
```

**날짜별 합산** 의 표준 패턴.

- **`Map<string, number>`** — 날짜 문자열을 키로, 초를 값으로
- **`log.startedAt.toISOString().split("T")[0]`** — Date 객체를 `"YYYY-MM-DD"` 문자열로 변환
  - `.toISOString()` → `"2025-04-30T13:42:00.000Z"`
  - `.split("T")[0]` → `"2025-04-30"`
- **`(map.get(dateKey) ?? 0) + log.durationSeconds`** — 기존 값 + 새 값. 없으면 0 부터 시작

같은 날짜에 여러 학습 세션이 있어도 자연스럽게 합산됩니다.

#### 코드 한 줄 한 줄 의미 짚기 — streak 계산

```typescript
let streak = 0;
const checkDate = new Date();
while (true) {
  const key = checkDate.toISOString().split("T")[0];
  if ((dailyMap.get(key) ?? 0) > 0) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    break;
  }
}
```

**연속 학습 일수** 계산. 오늘부터 거꾸로 하루씩 검사:
- 그 날 학습이 있으면 → streak++ + 어제로 이동
- 없으면 → 중단

예: 오늘, 어제, 그저께 모두 학습 → streak = 3.

> 💡 **이 알고리즘이 사용자 동기 부여의 핵심**. GitHub 의 streak 도 같은 방식.

#### 이번 주 (월요일~) 계산

```typescript
const dayOfWeek = now.getDay();           // 0(일) ~ 6(토)
const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
const weekStart = new Date(now);
weekStart.setDate(now.getDate() - diffToMonday);
weekStart.setHours(0, 0, 0, 0);
```

- 오늘이 수요일 (dayOfWeek=3) → diffToMonday=2 → 2일 전 = 월요일
- 오늘이 일요일 (dayOfWeek=0) → diffToMonday=6 → 6일 전 = 월요일
- **`setHours(0, 0, 0, 0)`** — 시/분/초/밀리초 모두 0 → 월요일 00:00:00

이 시각 이후의 학습 로그가 "이번 주" 입니다.

---

### 3. `lib/actions.ts` 에 `saveStudySession` 추가

기존 `lib/actions.ts` 에 학습 세션 저장 Server Action 을 추가합니다.

```typescript
// lib/actions.ts (추가)
import { addStudyLog } from "./study-logs";

export async function saveStudySession(input: {
  startedAt: string;  // ISO string
  durationSeconds: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  if (input.durationSeconds < 60) {
    return { ok: false, message: "최소 1분 이상 학습해야 저장됩니다." };
  }

  await addStudyLog({
    userId: session.user.id,
    startedAt: new Date(input.startedAt),
    durationSeconds: input.durationSeconds,
  });

  return { ok: true };
}
```

#### 이 함수가 하는 일

타이머에서 호출하는 Server Action. 세션 검증, 최소 시간 체크, DB 저장.

#### 코드 한 줄 한 줄 의미 짚기

```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  throw new Error("로그인이 필요합니다.");
}
```

**세션 재검증** — 챕터 16 의 다층 방어 원칙. 비로그인 사용자는 타이머는 쓸 수 있지만 DB 저장은 차단.

```typescript
if (input.durationSeconds < 60) {
  return { ok: false, message: "최소 1분 이상 학습해야 저장됩니다." };
}
```

**1분 미만 학습은 저장 안 함** — 실수로 시작/정지 버튼 클릭한 경우 방지.

```typescript
await addStudyLog({
  userId: session.user.id,
  startedAt: new Date(input.startedAt),
  durationSeconds: input.durationSeconds,
});
```

- `userId` — NextAuth 세션의 user.id
- `startedAt` — 문자열로 받은 ISO 시각을 Date 객체로 변환
- `durationSeconds` — 그대로 저장

```typescript
return { ok: true };
```

`createPost` 와 달리 `redirect()` 없음. 타이머 정지 후 페이지 이동시킬 필요 없으니까. 결과 객체만 반환.

#### `createPost` vs `saveStudySession` 비교

| 항목 | createPost | saveStudySession |
|---|---|---|
| 인자 | FormData | 일반 객체 |
| 호출자 | `<form action={createPost}>` | 코드에서 직접 호출 |
| 반환 | redirect (이후 코드 X) | `{ ok, message }` |
| 사용 컨텍스트 | 폼 제출 | 버튼 클릭 후 |

**Server Action 은 폼만이 아니라 일반 함수처럼도 호출 가능합니다.** 이번이 그 패턴.

---

### 4. `StudyTimer` 수정 — 정지 시 DB 저장

기존 `components/StudyTimer.tsx` 를 수정합니다. 정지 버튼 클릭 시 학습 시간을 DB 에 저장하도록.

```tsx
// components/StudyTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";  // ⭐
import CircularProgress from "./CircularProgress";
import { saveStudySession } from "@/lib/actions";  // ⭐

const TARGET_SECONDS = 25 * 60;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudyTimer() {
  const { data: session } = useSession();  // ⭐
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>("");  // ⭐

  const intervalRef = useRef<number | null>(null);
  const startedAtRef = useRef<Date | null>(null);  // ⭐ 시작 시각 보관

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    startedAtRef.current = new Date();  // ⭐ 시작 시각 기록
    setIsRunning(true);
    setSavedMessage("");
  };

  const handleStop = async () => {
    setIsRunning(false);

    // ⭐ 로그인 + 1분 이상이면 DB 저장
    if (session?.user && seconds >= 60 && startedAtRef.current) {
      const result = await saveStudySession({
        startedAt: startedAtRef.current.toISOString(),
        durationSeconds: seconds,
      });
      if (result.ok) {
        setSavedMessage(`✓ ${Math.round(seconds / 60)}분 학습 기록됨`);
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setSavedMessage("");
    startedAtRef.current = null;
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

      <div className="flex justify-center mb-6">
        <CircularProgress progress={progress} size={220}>
          <div className="font-mono text-4xl font-medium tabular-nums text-white">
            {formatTime(seconds)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            {isRunning ? "● RECORDING" : "● STANDBY"}
          </div>
        </CircularProgress>
      </div>

      <div className="flex justify-center gap-2 mb-3">
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

      {/* ⭐ 저장 결과 메시지 */}
      {savedMessage && (
        <p className="text-center text-xs text-lime-400">{savedMessage}</p>
      )}
      {!session?.user && seconds > 0 && (
        <p className="text-center text-xs text-zinc-500">
          로그인하면 학습 시간이 기록됩니다
        </p>
      )}
    </div>
  );
}
```

#### 변화점

| 항목 | 챕터 08 | 챕터 17 |
|---|---|---|
| 세션 사용 | X | useSession 추가 |
| 저장 메시지 state | X | `savedMessage` 추가 |
| 시작 시각 ref | X | `startedAtRef` 추가 |
| DB 저장 | X | `handleStop` 에서 호출 |

#### 코드 한 줄 한 줄 의미 짚기

```tsx
const startedAtRef = useRef<Date | null>(null);
```

**챕터 08 의 `intervalRef` 와 같은 패턴**. 화면과 무관한 값 보관.

- **왜 state 가 아닌가?**: 시작 시각이 바뀌어도 화면 다시 그릴 필요 없음. ref 가 정답
- **타입 `Date | null`**: 챕터 08 의 `number | null` 과 동일 패턴

```tsx
const handleStart = () => {
  startedAtRef.current = new Date();
  setIsRunning(true);
  setSavedMessage("");
};
```

시작 버튼 클릭 시:
- 현재 시각을 ref 에 저장 (나중에 startedAt 으로 사용)
- 타이머 시작
- 이전 저장 메시지 초기화

```tsx
const handleStop = async () => {
  setIsRunning(false);

  if (session?.user && seconds >= 60 && startedAtRef.current) {
    const result = await saveStudySession({
      startedAt: startedAtRef.current.toISOString(),
      durationSeconds: seconds,
    });
    if (result.ok) {
      setSavedMessage(`✓ ${Math.round(seconds / 60)}분 학습 기록됨`);
    }
  }
};
```

정지 버튼 클릭 시:
- 타이머 멈춤
- **로그인 + 1분 이상 + 시작 시각 있음** 모두 만족 시 DB 저장
- `startedAtRef.current.toISOString()` → 문자열로 변환 (Server Action 의 인자 타입에 맞춤)
- 저장 성공 시 사용자에게 메시지 표시

```tsx
{!session?.user && seconds > 0 && (
  <p className="text-center text-xs text-zinc-500">
    로그인하면 학습 시간이 기록됩니다
  </p>
)}
```

비로그인 사용자에겐 안내 메시지. 타이머는 쓸 수 있지만 기록 안 된다고 알림.

#### `useSession` + Server Action 의 협업

```tsx
// 클라이언트
const { data: session } = useSession();
if (session?.user) {
  await saveStudySession({ ... });
}
```

```typescript
// 서버 (saveStudySession 안)
const session = await getServerSession(authOptions);
if (!session?.user?.id) throw new Error("...");
```

**이중 검증** — 클라이언트는 UI 분기용, 서버는 진짜 권한 검증. 챕터 16 의 다층 방어 원칙.

---

### 5. `ContributionGraph` 잔디밭 컴포넌트 ⭐

드디어 메인 컴포넌트. `components/ContributionGraph.tsx` 를 새로 만들어주세요.

내부에서 `new Date()` 를 쓰기 때문에, 핵심 개념 6번에서 다룬 **`useSyncExternalStore` 패턴** 을 적용합니다. 파일 상단의 `"use client"` 와 `useSyncExternalStore` import 가 그래서 들어갑니다.

```tsx
// components/ContributionGraph.tsx
"use client";

import { useSyncExternalStore } from "react";

type ContributionGraphProps = {
  // 키: "YYYY-MM-DD", 값: 그날 학습 시간(초)
  data: Map<string, number>;
  weeks?: number;
};

const CELL_SIZE = 12;
const CELL_GAP = 3;
const COLORS = [
  "#1a1d23",                       // 0 - 활동 없음
  "rgba(0, 217, 255, 0.18)",       // 1 - < 30분
  "rgba(0, 217, 255, 0.38)",       // 2 - 30분~1시간
  "rgba(0, 217, 255, 0.65)",       // 3 - 1~2시간
  "rgba(0, 217, 255, 0.95)",       // 4 - 2시간+
];

// useSyncExternalStore 용 헬퍼 — 모듈 레벨에 한 번만 정의
const emptySubscribe = () => () => {};
const getSnapshot = () => true;          // 클라이언트
const getServerSnapshot = () => false;   // 서버 + Hydration 시점

function intensityForSeconds(seconds: number): number {
  if (seconds === 0) return 0;
  if (seconds < 1800) return 1;
  if (seconds < 3600) return 2;
  if (seconds < 7200) return 3;
  return 4;
}

export default function ContributionGraph({
  data,
  weeks = 26,
}: ContributionGraphProps) {
  // Hydration-safe 클라이언트 감지
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  const svgWidth = weeks * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP);

  // 서버 + Hydration 시점엔 빈 격자만
  if (!mounted) {
    return (
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} />
      </div>
    );
  }

  // 여기서부터는 클라이언트 — new Date() 안전하게 사용 가능
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = weeks * 7;
  const cells: { date: Date; week: number; day: number; seconds: number }[] = [];

  // 오늘이 속한 주의 토요일을 찾기
  const dayOfWeek = today.getDay(); // 0 = 일
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;
  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() + daysToSaturday);

  // 마지막 칸이 lastSaturday 가 되도록 거꾸로 채움
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(lastSaturday);
    date.setDate(lastSaturday.getDate() - i);

    const week = Math.floor((totalDays - 1 - i) / 7);
    const day = date.getDay(); // 0 = 일

    const dateKey = date.toISOString().split("T")[0];
    const seconds = data.get(dateKey) ?? 0;

    cells.push({ date, week, day, seconds });
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {cells.map((cell, idx) => {
          const isFuture = cell.date > today;
          const intensity = isFuture ? 0 : intensityForSeconds(cell.seconds);
          const x = cell.week * (CELL_SIZE + CELL_GAP);
          const y = cell.day * (CELL_SIZE + CELL_GAP);
          const minutes = Math.round(cell.seconds / 60);
          const dateLabel = cell.date.toISOString().split("T")[0];

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={COLORS[intensity]}
              opacity={isFuture ? 0.3 : 1}
            >
              <title>
                {dateLabel}
                {minutes > 0 ? ` — ${minutes}분 학습` : ""}
              </title>
            </rect>
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-zinc-500">
        <span>적음</span>
        {COLORS.map((c, i) => (
          <div
            key={i}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: c }}
          />
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

날짜별 학습 시간 Map 을 받아서, GitHub 스타일 격자로 시각화합니다. `new Date()` 로 오늘 날짜 기준의 격자를 만들기 때문에, **`useSyncExternalStore` 로 Hydration mismatch 를 회피** 합니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";

import { useSyncExternalStore } from "react";
```

이 파일은 **Client Component**. `useSyncExternalStore` 를 쓰기 위해서이기도 하지만, 더 본질적인 이유는 **`new Date()` 가 클라이언트에서만 안전하게 동작** 해야 하기 때문입니다. 핵심 개념 6번 참고.

```tsx
type ContributionGraphProps = {
  data: Map<string, number>;
  weeks?: number;
};
```

- **`data: Map<string, number>`** — 날짜별 학습 시간. `lib/study-logs.ts` 의 `getDailyStudyMap` 이 만든 형태
- **`weeks?: number`** — 표시할 주 수. 기본 26 (반년)

```tsx
const emptySubscribe = () => () => {};
const getSnapshot = () => true;          // 클라이언트
const getServerSnapshot = () => false;   // 서버 + Hydration 시점
```

`useSyncExternalStore` 에 넘길 헬퍼 함수들. **모듈 레벨에 정의** 하는 게 중요합니다 — 컴포넌트 안에 두면 매 렌더마다 새 함수가 만들어져 `useSyncExternalStore` 가 매번 재구독을 시도해요.

- `emptySubscribe`: "외부 스토어" 가 변할 일이 없으니 빈 구독자. unsubscribe 도 빈 함수
- `getSnapshot`: 클라이언트 렌더 시 호출되어 `true` 반환
- `getServerSnapshot`: **서버 렌더 + Hydration 직후** 에 호출되어 `false` 반환

```tsx
const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
```

**Hydration-safe 클라이언트 감지의 핵심**.

- 서버 렌더: `getServerSnapshot()` → `false`
- 클라이언트 Hydration 시점: 또 `getServerSnapshot()` → `false` (서버와 일치 ✓)
- 그 후 클라이언트 일반 렌더: `getSnapshot()` → `true`

> 💡 **왜 `useState + useEffect` 가 아닌가?** 옛날 mounted 패턴 (`const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])`) 은 React 19 에서 **"effect 안에서 setState 동기 호출 = cascading render"** 경고를 띄웁니다. `useSyncExternalStore` 는 같은 효과를 cascading 없이 한 번에 처리하는 React 의 공식 API 예요.

```tsx
const svgWidth = weeks * (CELL_SIZE + CELL_GAP);
const svgHeight = 7 * (CELL_SIZE + CELL_GAP);

if (!mounted) {
  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} />
    </div>
  );
}
```

**서버 + 클라이언트 Hydration 시점의 출력**. 빈 SVG 격자만 그립니다. 크기는 미리 계산해서 레이아웃 점프 방지 (격자가 차지할 자리는 확보).

`new Date()` 같은 환경 의존 코드는 이 시점에는 절대 실행 안 함 — 그래서 서버와 클라이언트의 결과가 무조건 같습니다.

```tsx
const today = new Date();
today.setHours(0, 0, 0, 0);
```

여기서부터 mounted 후 영역. 오늘 자정 (00:00:00). 시간 정보 제거.

```tsx
const dayOfWeek = today.getDay();        // 0 = 일
const daysToSaturday = (6 - dayOfWeek + 7) % 7;
const lastSaturday = new Date(today);
lastSaturday.setDate(today.getDate() + daysToSaturday);
```

**격자의 마지막 칸이 이번 주 토요일이 되도록 정렬**. GitHub 스타일에 맞춰서.

- 오늘이 수요일 (3) → `(6-3+7)%7 = 3` → 3일 후 = 토요일
- 오늘이 일요일 (0) → `(6-0+7)%7 = 6` → 6일 후 = 토요일
- 오늘이 토요일 (6) → `(6-6+7)%7 = 0` → 오늘이 토요일

```tsx
for (let i = totalDays - 1; i >= 0; i--) {
  const date = new Date(lastSaturday);
  date.setDate(lastSaturday.getDate() - i);

  const week = Math.floor((totalDays - 1 - i) / 7);
  const day = date.getDay();

  const dateKey = date.toISOString().split("T")[0];
  const seconds = data.get(dateKey) ?? 0;

  cells.push({ date, week, day, seconds });
}
```

182개 셀 정보 생성. 각 셀은:
- **`date`** — 그 날짜
- **`week`** — 가로 위치 (0~25)
- **`day`** — 세로 위치 (0=일, ..., 6=토)
- **`seconds`** — 그 날의 학습 시간

```tsx
<rect
  key={idx}
  x={x}
  y={y}
  width={CELL_SIZE}
  height={CELL_SIZE}
  rx={2}
  fill={COLORS[intensity]}
  opacity={isFuture ? 0.3 : 1}
>
  <title>
    {dateLabel}
    {minutes > 0 ? ` — ${minutes}분 학습` : ""}
  </title>
</rect>
```

각 셀 = `<rect>` (SVG 사각형):
- **`x, y`** — 좌표 (좌상단 기준)
- **`rx={2}`** — 모서리 둥글기 2px (살짝 둥근 사각형)
- **`fill`** — 강도에 따른 색
- **`opacity`** — 미래 날짜는 흐리게
- **`<title>`** — hover 시 자동 툴팁 (브라우저 기본 동작)

```tsx
<div className="overflow-x-auto">
```

가로 스크롤. 26주가 화면 폭보다 클 수 있으니.

#### `<title>` 의 마법 — 무료 툴팁

`<title>` 은 SVG 표준 태그. 브라우저가 자동으로 hover 툴팁을 표시해줍니다.

```svg
<rect>
  <title>2025-04-30 — 42분 학습</title>
</rect>
```

`onMouseEnter`/`onMouseLeave`/`useState` 같은 거 안 만들어도 됩니다. **SVG 표준 + 브라우저 기본 동작** 만으로 충분.

#### 이 컴포넌트의 훅 사용

`useSyncExternalStore` 는 **Hydration 회피 전용** 으로 쓰였습니다. 잔디밭의 본질(데이터를 받아 SVG 로 그림) 자체는 여전히 **순수 표현 컴포넌트** 예요. 챕터 08 의 CircularProgress 와 같은 패턴이고, 훅은 Hydration 이슈를 피하기 위한 보조 장치일 뿐입니다.

`"use client"` 를 붙여 Client Component 로 만들고 `useSyncExternalStore` 로 클라이언트 감지를 하면, **첫 HTML 은 빈 격자만 출력되고 → 클라이언트에서 진짜 격자를 그립니다.** 서버와 클라이언트의 시각 차이로 인한 미스매치 가능성을 원천 차단하는 표준 방법이에요.

**책임 분리는 그대로**:
- 데이터 조회/집계 → `lib/study-logs.ts`
- 시각화 → `ContributionGraph`

---

### 6. `WeeklyChart` Recharts 막대 차트

`components/WeeklyChart.tsx` 를 새로 만듭니다.

```tsx
// components/WeeklyChart.tsx
"use client";  // ⭐ Recharts 는 클라이언트 라이브러리

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WeeklyChartProps = {
  data: { day: string; minutes: number }[];
};

export default function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke="#56565E"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#56565E"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}m`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111318",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#F5F5F7" }}
            formatter={(value: number) => [`${value}분`, "학습 시간"]}
          />
          <Bar
            dataKey="minutes"
            fill="url(#bar-gradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

지난 7일의 일별 학습 시간을 막대 차트로 표시합니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

**Recharts 는 내부에서 useEffect 등을 사용** 하므로 클라이언트 컴포넌트 필수.

```tsx
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
```

Recharts 의 컴포넌트들. 각각이 차트의 한 요소.

```tsx
<ResponsiveContainer width="100%" height="100%">
```

**부모 폭에 맞춰 자동 크기 조정**. 모바일/데스크탑 대응에 필수.

```tsx
<BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
```

막대 차트 컨테이너. `data` 가 핵심 — `[{ day: "월", minutes: 60 }, ...]` 형태.

```tsx
<defs>
  <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.9} />
    <stop offset="100%" stopColor="#00D9FF" stopOpacity={0.3} />
  </linearGradient>
</defs>
```

**SVG 그라데이션 정의**. 위는 진한 시안, 아래는 흐린 시안. 막대 위쪽이 빛나는 느낌.

`id="bar-gradient"` 로 정의하고 나중에 `fill="url(#bar-gradient)"` 로 참조.

```tsx
<CartesianGrid
  strokeDasharray="3 3"
  stroke="rgba(255, 255, 255, 0.05)"
  vertical={false}
/>
```

**격자선**:
- `strokeDasharray="3 3"` — 점선
- 매우 흐림 (alpha 0.05)
- `vertical={false}` — 가로선만 (세로선 X)

```tsx
<XAxis dataKey="day" .../>
```

X축. `dataKey="day"` 가 핵심 — data 배열의 어떤 필드를 X축 라벨로 쓸지.

```tsx
<YAxis tickFormatter={(v) => `${v}m`} ... />
```

Y축. `tickFormatter` 로 숫자 옆에 "m" 단위 표시 (`30m`, `60m` 등).

```tsx
<Tooltip
  contentStyle={{ backgroundColor: "#111318", ... }}
  formatter={(value: number) => [`${value}분`, "학습 시간"]}
/>
```

hover 시 표시되는 툴팁. DevLog 테마 (다크 시안) 에 맞춰 커스터마이즈.

```tsx
<Bar dataKey="minutes" fill="url(#bar-gradient)" radius={[4, 4, 0, 0]} />
```

실제 막대:
- **`dataKey="minutes"`** — data 의 minutes 필드 값으로 막대 높이 결정
- **`fill="url(#bar-gradient)"`** — 위에서 정의한 그라데이션 적용
- **`radius={[4, 4, 0, 0]}`** — `[좌상, 우상, 우하, 좌하]` 모서리 둥글기. 위만 둥근 사각형

#### 컴포넌트 합성의 장점

```tsx
<BarChart>
  <CartesianGrid />
  <XAxis />
  <YAxis />
  <Tooltip />
  <Bar />
</BarChart>
```

**필요한 것만 추가하고, 안 쓰는 건 빼면 됩니다.** 격자선 없애려면 `<CartesianGrid />` 삭제. 툴팁 없애려면 `<Tooltip />` 삭제.

선언적이라 읽기 쉽고 수정도 쉽습니다.

---

### 7. `StatCard` 통계 카드

`components/StatCard.tsx` 를 새로 만듭니다.

```tsx
// components/StatCard.tsx
type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
};

export default function StatCard({ label, value, unit, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-4xl font-semibold tabular-nums text-white">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-zinc-500">{unit}</span>
        )}
      </div>
      {hint && (
        <p className="mt-2 text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
```

#### 이 컴포넌트가 하는 일

라벨 + 큰 숫자 + 단위 + 힌트 의 통계 카드. 대시보드 상단에 3개 나란히 배치할 예정.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
type StatCardProps = {
  label: string;          // "누적 학습 시간"
  value: string;          // "12h 30m"
  unit?: string;          // "일" (선택)
  hint?: string;          // "가입 이후" (선택)
};
```

옵셔널 두 개 (`?`) — unit 과 hint 는 카드에 따라 있을 수도 없을 수도.

```tsx
<div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">
  {label}
</div>
```

상단 라벨. **monospace + uppercase + tracking-widest** 의 조합이 "데이터 대시보드" 느낌의 폰트 스타일.

```tsx
<span className="font-mono text-4xl font-semibold tabular-nums text-white">
  {value}
</span>
```

큰 숫자:
- **`text-4xl`** — 큰 크기
- **`font-mono`** — 모노스페이스 (숫자 정렬 일관성)
- **`tabular-nums`** — 숫자 간격 균등 (시계나 카운터에서 자주 사용)

```tsx
{unit && (
  <span className="text-sm text-zinc-500">{unit}</span>
)}
```

조건부 렌더링 — unit 있으면 표시, 없으면 안 표시.

---

### 8. `app/dashboard/page.tsx` 대시보드 페이지

드디어 모든 게 합쳐지는 페이지. `app/dashboard/page.tsx` 를 새로 만들어주세요.

```tsx
// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getDailyStudyMap,
  getStudyStats,
  getWeeklyData,
} from "@/lib/study-logs";
import Container from "@/components/Container";
import ContributionGraph from "@/components/ContributionGraph";
import WeeklyChart from "@/components/WeeklyChart";
import StatCard from "@/components/StatCard";

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // 미들웨어가 1차 차단하지만 안전 차원에서
    redirect("/login?callbackUrl=/dashboard");
  }

  const userId = session.user.id;

  // ⭐ 모든 데이터를 서버에서 병렬 조회
  const [dailyMap, stats, weeklyData] = await Promise.all([
    getDailyStudyMap(userId, 26 * 7),
    getStudyStats(userId),
    getWeeklyData(userId),
  ]);

  return (
    <Container>
      <div className="py-12">
        {/* 헤더 */}
        <div className="mb-10">
          <div className="mb-3 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-400">
            {session.user.name}님의 대시보드
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">학습 통계</h1>
          <p className="mt-2 text-zinc-400">
            지금까지의 학습 기록과 추이를 한눈에 확인해보세요.
          </p>
        </div>

        {/* 통계 카드 3개 */}
        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <StatCard
            label="누적 학습 시간"
            value={formatHours(stats.totalSeconds)}
            hint="가입 이후 총 시간"
          />
          <StatCard
            label="이번 주"
            value={formatHours(stats.weekSeconds)}
            hint="월요일부터 지금까지"
          />
          <StatCard
            label="연속 학습 일수"
            value={String(stats.streak)}
            unit="일"
            hint={stats.streak > 0 ? "잘 하고 계세요 🔥" : "오늘부터 시작!"}
          />
        </div>

        {/* 잔디밭 ⭐ */}
        <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">
            Activity Graph
          </div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight">지난 26주</h2>
          <ContributionGraph data={dailyMap} weeks={26} />
        </section>

        {/* 주간 차트 */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">
            Weekly Pattern
          </div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight">최근 7일</h2>
          <WeeklyChart data={weeklyData} />
        </section>
      </div>
    </Container>
  );
}
```

#### 이 페이지가 하는 일

로그인한 사용자의 학습 통계를 모두 한 페이지에 표시합니다. **Server Component** 로 모든 DB 조회가 서버에서 직접 일어납니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
```

초 → "Hh Mm" 형식. 예: 5400 → "1h 30m".

```tsx
export default async function DashboardPage() {
```

**async 함수** — Server Component 의 데이터 페칭 패턴. 챕터 13 에서 처음 등장.

```tsx
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  redirect("/login?callbackUrl=/dashboard");
}
```

세션 확인. **미들웨어가 1차 차단** 하지만 안전 차원의 2차 검증.

```tsx
const [dailyMap, stats, weeklyData] = await Promise.all([
  getDailyStudyMap(userId, 26 * 7),
  getStudyStats(userId),
  getWeeklyData(userId),
]);
```

**`Promise.all` 로 3개 쿼리 병렬 실행** ⭐

순차 실행 (`await` 3번) 대신 병렬:

```
순차: dailyMap (200ms) → stats (150ms) → weeklyData (100ms) = 450ms
병렬: 모두 동시에 시작                              = 200ms (최대값)
```

각 쿼리가 독립적이라 병렬 가능. 페이지 로딩 시간 크게 단축.

```tsx
<div className="mb-10 grid gap-4 md:grid-cols-3">
  <StatCard ... />
  <StatCard ... />
  <StatCard ... />
</div>
```

3개 카드 가로 배치. `md:grid-cols-3` — 모바일에선 세로 1열, 중간 크기 이상에선 3열.

```tsx
hint={stats.streak > 0 ? "잘 하고 계세요 🔥" : "오늘부터 시작!"}
```

streak 에 따라 다른 격려 메시지. 사용자 동기 부여 디테일.

```tsx
<ContributionGraph data={dailyMap} weeks={26} />
```

서버에서 만든 Map 을 그대로 전달.

> 💡 **Server → Client props 의 직렬화**: 부모 (`DashboardPage`) 는 Server Component, 자식 (`ContributionGraph`) 은 Client Component (`useSyncExternalStore` 때문). 이 경계에서 props 는 직렬화되어 클라이언트로 전송됩니다. **다행히 Next.js 의 RSC 직렬화는 일반 JSON 보다 넓어서 Map, Date, Set 등도 지원** 합니다. 그래서 별도 변환 없이 그대로 넘겨도 동작해요. 단, **함수, 클래스 인스턴스, Symbol** 같은 건 여전히 전달 불가 — 챕터 12 의 제약이 그쪽에 적용됩니다.

#### `useEffect` + `fetch` 없는 깔끔함

만약 Client Component 였다면:

```tsx
// 비교용 (실제로는 안 씀)
"use client";
const [dailyMap, setDailyMap] = useState(new Map());
const [stats, setStats] = useState(null);
const [weeklyData, setWeeklyData] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  Promise.all([
    fetch("/api/study-logs/daily").then(r => r.json()),
    fetch("/api/study-logs/stats").then(r => r.json()),
    fetch("/api/study-logs/weekly").then(r => r.json()),
  ]).then(([d, s, w]) => {
    setDailyMap(new Map(d));
    setStats(s);
    setWeeklyData(w);
    setIsLoading(false);
  });
}, []);

if (isLoading) return <Skeleton />;
```

Server Component 라서:

```tsx
// 실제 코드
const [dailyMap, stats, weeklyData] = await Promise.all([...]);
```

**훅 0개. 변수 하나로 끝.**

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 차례로 해보세요.

#### 첫 실행 — 데이터 쌓기
1. 로그인 (alice / alice123)
2. 메인 페이지의 **타이머 시작** → 1분 이상 기다림 → **정지**
3. **"✓ N분 학습 기록됨"** 메시지 확인 ⭐
4. 타이머를 **여러 번 반복** 해서 데이터 쌓기 (시간을 다르게)

#### 대시보드 확인
5. 주소창에 `/dashboard` 입력 또는 (Header 에 링크 추가했다면) 클릭
6. **3개 통계 카드** 표시 — 누적, 이번 주, 연속 일수
7. **잔디밭** 표시 ⭐ — 오늘 칸이 색깔 있음
8. 잔디밭의 칸에 **마우스 hover** → 툴팁으로 날짜 + 학습 시간 표시
9. **주간 차트** 표시 — 막대 그래프

#### Header 에 대시보드 링크 추가 (선택)

`components/Header.tsx` 의 nav 부분에 추가하면 편합니다 (이미 챕터 16 에서 만든 Header):

```tsx
// 로그인 상태 분기 안에 추가
<Link
  href="/dashboard"
  className="text-sm text-zinc-400 transition-colors hover:text-cyan-400"
>
  대시보드
</Link>
```

여기까지 정상 동작하면 이번 챕터의 목표는 모두 달성된 것입니다.

> 💡 **임원분들께 데모하실 때**: 잔디밭이 가장 시선을 끕니다. "GitHub 처럼 학습 활동을 시각화" 라고 설명하시면 호응이 좋아요. 그리고 streak (연속 학습 일수) 가 사용자 동기 부여의 핵심 지표입니다.

---

## ❓ 흔한 실수

### Q1. `WeeklyChart` 에 `"use client"` 누락
```
Error: useEffect / useRef can only be used in client components
```
Recharts 내부에서 클라이언트 훅을 사용. 파일 상단에 `"use client"` 필수.

### Q2. 잔디밭이 안 보임 (빈 격자만)
- 학습 기록을 1분 이상 쌓아야 색이 나타남
- `saveStudySession` 의 `< 60` 조건 확인
- DB 의 study_logs 테이블에 row 확인 (pgAdmin)

### Q3. ContributionGraph 의 `data` 가 plain object
```tsx
// ❌ 잘못 — Object 가 아니라 Map 필요
<ContributionGraph data={{ "2025-04-30": 1500 }} />

// ✅ Map 객체
<ContributionGraph data={new Map([["2025-04-30", 1500]])} />
```
타입이 `Map<string, number>` 이라 Map 인스턴스 필요.

### Q4. Promise.all 안에서 한 쿼리 에러 시 전체 실패
`Promise.all` 은 하나라도 reject 되면 전체 reject. 견고하게 하려면 `Promise.allSettled` 사용.

### Q5. `startedAt` 시각이 잘못됨 (UTC vs 로컬)
```typescript
// 클라이언트
startedAtRef.current = new Date();  // 로컬 시각 (브라우저 기준)
startedAt: startedAtRef.current.toISOString()  // UTC 로 변환됨

// 서버에서
new Date(input.startedAt)  // UTC 로 해석 후 Date 객체
```
DB 에는 UTC 로 저장됨. 표시할 때 시간대 변환 주의.

### Q6. SVG `<title>` 이 안 보임
- `<rect>` 의 **자식** 으로 들어가야 함 (속성 아님)
- 텍스트는 자식 노드 안에. 예: `<rect><title>내용</title></rect>`
- 브라우저 기본 동작이라 즉시 보임. 안 보이면 구조 확인.

### Q7. `tabular-nums` 가 적용 안 됨
Tailwind 의 `tabular-nums` 는 폰트에 따라 효과가 다릅니다. monospace 폰트와 같이 쓰는 게 가장 안전 (`font-mono tabular-nums`).

### Q8. 미들웨어가 `/dashboard` 차단 안 함
챕터 16 의 `middleware.ts` 의 `matcher` 에 `/dashboard/:path*` 가 포함되어 있는지 확인.

### Q9. Hydration mismatch 에러가 발생함
```
Error: Hydration failed because the server rendered HTML
didn't match the client.
```

**원인**: `ContributionGraph` 안에서 `new Date()` 와 `toISOString().split("T")[0]` 을 쓰는데, 서버 시각과 클라이언트 시각이 다르거나 UTC 변환이 한국 시간 자정 근처에서 어긋나면서 서버 HTML 과 클라이언트 첫 렌더 결과가 달라집니다.

**해결**: 핵심 개념 6번의 **`useSyncExternalStore` 패턴** 적용. 본 챕터의 ContributionGraph 코드에 이미 반영되어 있습니다.

```tsx
"use client";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ContributionGraph(...) {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <빈 SVG />;  // 서버 + Hydration 시점 출력
  }

  // 여기서부터 new Date() 안전
}
```

만약 코드를 따라 쳤는데도 같은 에러가 나면:
- 파일 상단에 `"use client"` 있는지 확인
- `useSyncExternalStore` import 했는지 확인
- 세 헬퍼 함수 (`emptySubscribe`, `getSnapshot`, `getServerSnapshot`) 가 **모듈 레벨** 에 있는지 (컴포넌트 안에 두면 매 렌더마다 새로 만들어져 동작 이상)
- `if (!mounted) return ...` 가 `new Date()` 보다 **앞** 에 있는지 확인 (위치가 중요)

> 💡 **옛날 mounted 패턴은 안 되나요?** `useState(false) + useEffect(() => setMounted(true), [])` 도 동일한 효과를 내지만, React 19 에서 **"effect 안에서 setState 동기 호출은 cascading render 를 유발한다"** 는 경고를 띄웁니다. 같은 문제를 `useSyncExternalStore` 가 cascading 없이 해결해주는 React 의 공식 API 예요.

> 💡 **`new Date()` 외의 후보**: `Math.random()`, `localStorage.getItem(...)`, `window.innerWidth` 등 — 환경 의존 코드 전반에 같은 패턴 적용 가능. 챕터 18 의 다크모드 토글에서 또 만나게 됩니다.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] **잔디밭 (Contribution Graph)** 의 구조 (26주 × 7일 = 182칸) 를 안다
- [ ] **SVG 좌표 시스템** (좌상단 0,0, y 가 아래 방향) 을 안다
- [ ] **활동량 → 색 강도 매핑** 의 개념을 안다
- [ ] **`<title>` 태그** 로 SVG 툴팁 무료 구현
- [ ] **Recharts 의 컴포넌트 합성** 패턴을 안다 (`<BarChart><Bar /></BarChart>`)
- [ ] **`ResponsiveContainer`** 로 차트 반응형 만드는 법을 안다
- [ ] **`Promise.all` 로 병렬 DB 쿼리** 를 통한 성능 최적화를 안다
- [ ] **useRef 를 시작 시각 보관** 에 활용 (state 가 아닌 ref 인 이유)
- [ ] **`useSession` + Server Action** 의 다층 검증 패턴
- [ ] **streak (연속 학습 일수) 알고리즘** 의 원리를 안다
- [ ] **Hydration mismatch** 가 왜 일어나는지 (서버/클라이언트 환경 차이) 설명할 수 있다
- [ ] **`useSyncExternalStore` 패턴** 으로 Hydration 이슈를 회피하는 법을 안다 (서버/Hydration 시점엔 false, 클라이언트에선 true)
- [ ] http://localhost:3000/dashboard 에서 잔디밭, 차트, 통계 모두 표시 확인 ⭐

---

## ✅ 다음 챕터 예고

> **챕터 18: Context API + 다크모드 + 상태관리 비교**
> React 의 **Context API** 를 다룹니다. 챕터 16 의 `SessionProvider` 가 사실 Context API 의 한 예였어요. 챕터 10 의 `useLocalStorage` 와 결합하여 **다크/라이트 테마 토글** 을 구현합니다. 그리고 마지막으로 **Zustand, Jotai, Redux Toolkit, TanStack Query** 같은 외부 상태관리 라이브러리들과의 비교 — "언제 Context, 언제 외부 라이브러리?" 의 감각을 짚어드립니다.
