# 챕터 15: Drizzle ORM + PostgreSQL

> **시간**: 약 30분 · **블록**: Day 2 / Block 4

---

## 🎯 이 챕터에서 다룰 내용

- **Drizzle ORM** 의 개념과 장점 (TypeScript 친화 ORM)
- PostgreSQL 연결 셋업 (챕터 00 에서 이미 설치 완료)
- 스키마 정의 → 마이그레이션 → 쿼리의 흐름
- 본 프로젝트의 **메모리 저장을 PostgreSQL 로 교체** ⭐
- `lib/posts.ts` 의 함수들이 DB 쿼리로 진화

지금까지 메모리 배열에 글을 저장했죠. 서버 재시작하면 사라지는 임시 저장소. 이번 챕터에서 **PostgreSQL 로 교체** 합니다.

ORM 으로는 **Drizzle** 을 사용해요. TypeScript 친화도가 매우 높고, 회사에서 점차 채택이 늘어나는 추세입니다.

30분 안에 DB 까지 다뤄야 해서 좀 빠르게 갑니다. 모든 코드를 일일이 이해하기보단 **흐름을 따라가는 데 집중** 해주세요. 자료에 다 적혀있으니 나중에 천천히 보셔도 됩니다.

---

## 🖥️ 이 챕터에서 다룰 파일

- `.env` — DB 연결 정보 (신규)
- `drizzle.config.ts` — Drizzle 설정 (신규)
- `lib/db/schema.ts` — posts 테이블 스키마 (신규)
- `lib/db/index.ts` — DB 클라이언트 (신규)
- `lib/db/seed.ts` — 초기 데이터 시드 스크립트 (신규)
- `lib/posts.ts` — 메모리 → DB 쿼리로 전체 교체

---

## 🧠 핵심 개념

### 1. ORM 이란? — SQL 안 쓰고 DB 다루는 도구

먼저 ORM 이 무엇인지부터 짚고 가겠습니다. **ORM (Object-Relational Mapping)** 은 SQL 대신 객체나 함수로 데이터베이스를 다룰 수 있게 해주는 도구입니다.

#### SQL 직접 작성 vs ORM 사용

```sql
-- ❌ SQL 직접 작성 (전통적)
SELECT * FROM posts WHERE tag = 'React' ORDER BY date DESC LIMIT 10;
```

```typescript
// ✅ ORM 사용 (Drizzle)
const result = await db
  .select()
  .from(posts)
  .where(eq(posts.tag, 'React'))
  .orderBy(desc(posts.date))
  .limit(10);
```

#### ORM 의 장점

- **타입 안정성** — TypeScript 가 컬럼 이름, 타입 모두 추적 → 오타 즉시 잡힘
- **자동완성** — IDE 가 테이블/컬럼 이름 추천
- **DB 종류 추상화** — PostgreSQL, MySQL, SQLite 등 같은 코드로 다룸
- **SQL 인젝션 자동 방어** — 매개변수 자동 escape

#### Drizzle 의 위치 (다른 ORM 과 비교)

| ORM | 특징 |
|---|---|
| **Prisma** | 별도 스키마 파일 (.prisma) + 코드 생성. 강력하지만 무거움 |
| **TypeORM** | 데코레이터 기반. NestJS 등에서 자주 쓰임 |
| **Drizzle** ⭐ | **순수 TS 객체로 스키마**. 가벼움. **SQL-like API** |

> 💡 **Drizzle 을 선택한 이유**: Next.js + Server Actions + TypeScript 환경에 가장 잘 맞습니다. 가볍고, 타입 추론이 강력하고, SQL 과 비슷한 API 라 SQL 에 익숙한 분들이 쉽게 적응합니다.

---

### 2. Drizzle 의 전체 흐름

```
1. 스키마 정의 (lib/db/schema.ts)
   ↓
2. 마이그레이션 생성 (drizzle-kit generate)
   ↓
3. DB 에 적용 (drizzle-kit push 또는 migrate)
   ↓
4. 쿼리 작성 (db.select().from(posts) 등)
```

#### 스키마 예시

```typescript
import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**TypeScript 객체로 표현된 DB 테이블** 입니다. 각 컬럼은 함수 호출 (`serial(...)`, `varchar(...)`) 로 정의되고, 메서드 체이닝 (`.primaryKey()`, `.notNull()`) 으로 제약을 추가합니다. 마법 없이 순수 JS 객체입니다.

#### 쿼리 예시

```typescript
// SELECT 전체
const all = await db.select().from(posts);

// SELECT WHERE
const one = await db.select().from(posts).where(eq(posts.slug, "my-slug"));

// INSERT (그리고 결과 반환)
const [newPost] = await db.insert(posts).values({ ... }).returning();

// UPDATE
await db.update(posts).set({ title: "new" }).where(eq(posts.id, 1));

// DELETE
await db.delete(posts).where(eq(posts.id, 1));
```

**SQL 의 단어들 (`select`, `from`, `where`, `insert`, `values`, `update`, `set`, `delete`) 이 그대로** 메서드 이름. SQL 을 알고 계시면 거의 직관적으로 읽힙니다.

---

### 3. 환경 변수와 DB URL

DB 비밀번호 같은 **민감 정보는 코드에 직접 박지 않습니다**. `.env` 파일에 분리하고, `.gitignore` 로 git 추적에서 제외합니다.

#### `.env` 형식

```
DATABASE_URL="postgresql://postgres:devlog@localhost:5432/devlog"
```

URL 의 의미:
- 형식: `postgresql://사용자:비밀번호@호스트:포트/DB이름`
- **`postgres`** — PostgreSQL 의 기본 관리자 계정
- **`devlog`** — 챕터 00 에서 설정한 비밀번호
- **`localhost:5432`** — PostgreSQL 기본 호스트/포트
- **`/devlog`** — 챕터 00 에서 생성한 DB 이름

> ⚠️ **본인이 다른 비밀번호 쓰셨다면**: 위 URL 의 `devlog` 자리에 본인 비밀번호로 변경해주세요.

> 💡 **`.gitignore` 자동 보호**: Next.js 의 기본 .gitignore 에 `.env*.local` 같은 패턴이 들어있습니다. `.env` 파일은 git 에서 자동 제외됩니다.

---

### 4. 추상화 계층의 가치 — 핵심 통찰

이번 챕터에서 가장 멋진 부분이 있어요. **`lib/posts.ts` 의 함수 시그니처가 챕터 13~14 와 동일하게 유지** 됩니다.

#### 챕터 13 의 함수들

```typescript
export async function getAllPosts(): Promise<Post[]>;
export async function getPostBySlug(slug: string): Promise<Post | undefined>;
export async function addPost(input): Promise<Post>;
```

#### 챕터 15 의 함수들 (DB 교체 후)

```typescript
// 시그니처 완전 동일
export async function getAllPosts(): Promise<Post[]>;
export async function getPostBySlug(slug: string): Promise<Post | undefined>;
export async function addPost(input): Promise<Post>;
```

**내부 구현만 바뀝니다** — 메모리 배열 조작 → SQL 쿼리. **호출하는 쪽 코드는 한 줄도 안 바뀝니다.**

- `app/page.tsx` — 그대로
- `app/posts/[slug]/page.tsx` — 그대로
- `lib/actions.ts` — 그대로

이게 **추상화의 힘** 이에요. 챕터 13 에서 데이터 모듈을 분리해두고, 함수 시그니처를 잘 설계해둔 덕분에, 데이터 출처가 바뀌어도 다른 코드는 영향 없습니다.

회사 코드에서 "지금은 Redis 캐시 쓰는데 나중에 다른 걸로 바꿔야 할 수도..." 같은 상황이 자주 옵니다. **함수 시그니처가 같은 추상화 계층** 을 미리 만들어두면 이런 교체가 깔끔하게 끝납니다.

---

## 🛠 실습

여섯 단계로 진행됩니다. 빠르게 갈게요.

1. 패키지 설치 + `.env`
2. `drizzle.config.ts` 설정
3. `lib/db/schema.ts` 스키마 정의
4. `lib/db/index.ts` DB 클라이언트
5. 마이그레이션 + 시드 데이터
6. `lib/posts.ts` 를 Drizzle 쿼리로 전체 교체

---

### 1. 패키지 설치 + `.env`

먼저 필요한 패키지들을 설치합니다.

```bash
# 의존성 설치
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

**세 패키지의 역할**:
- `drizzle-orm` — Drizzle ORM 본체 (런타임에 쓰는 쿼리 도구)
- `postgres` — PostgreSQL 연결 드라이버 (Drizzle 이 내부적으로 사용)
- `drizzle-kit` — 마이그레이션 도구 (개발 시에만 사용 — `-D` 옵션)

그리고 프로젝트 루트에 **`.env`** 파일을 새로 만들어주세요.

```
DATABASE_URL="postgresql://postgres:devlog@localhost:5432/devlog"
```

> ⚠️ **비밀번호 확인**: 챕터 00 에서 다른 비밀번호를 설정하셨다면 `devlog` 자리를 본인 비밀번호로 변경해주세요.

> 💡 **`.env` 가 git 에서 제외되는지 확인**: `.gitignore` 파일을 열어 `.env` 또는 `.env*.local` 같은 패턴이 있는지 확인. Next.js 기본 .gitignore 에 포함되어 있을 거예요. 비밀번호가 git 으로 새는 걸 방지하기 위함입니다.

---

### 2. `drizzle.config.ts` 설정

프로젝트 루트에 **`drizzle.config.ts`** 를 새로 만듭니다. Drizzle Kit (마이그레이션 도구) 이 이 파일을 보고 동작 방식을 결정합니다.

```typescript
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import type { Config } from "drizzle-kit";
```

타입만 import (`import type`). 런타임에 drizzle-kit 패키지가 번들에 포함되지 않음.

```typescript
schema: "./lib/db/schema.ts",
```

스키마 파일 경로. Drizzle Kit 이 이 파일을 읽어서 DB 구조를 파악합니다.

```typescript
out: "./drizzle",
```

마이그레이션 SQL 파일이 생성될 폴더. 자동으로 `drizzle/0000_xxxx.sql` 같은 파일들이 생깁니다.

```typescript
dialect: "postgresql",
```

DB 종류. Drizzle 은 PostgreSQL, MySQL, SQLite 등을 지원하는데 우리는 PostgreSQL.

```typescript
dbCredentials: {
  url: process.env.DATABASE_URL!,
},
```

DB 연결 정보. `.env` 파일에서 자동으로 로드됩니다.
- **`!`** — Non-null assertion. "이 값은 반드시 있다" 고 TypeScript 에게 알림
- 실제로 환경변수가 비어있으면 런타임 에러가 나니, 첫 실행 시 명확히 알 수 있음

```typescript
} satisfies Config;
```

**`satisfies Config`** — 객체가 Config 타입에 부합하는지 검사하되, **객체의 더 정확한 타입은 유지**. `as Config` 보다 안전합니다 (오타 등을 잡아줌).

---

### 3. `lib/db/schema.ts` 스키마 정의

`lib/db/` 폴더를 새로 만들고, 그 안에 **`schema.ts`** 를 만듭니다. **이 파일이 DB 테이블 구조의 진실 (Single Source of Truth)** 이 됩니다.

```typescript
// lib/db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  tag: varchar("tag", { length: 50 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  readingTime: integer("reading_time"),
  coverImage: varchar("cover_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ⭐ 타입 자동 추론 — Drizzle 의 매력
export type Post = typeof posts.$inferSelect;    // SELECT 결과 타입
export type NewPost = typeof posts.$inferInsert; // INSERT 시 필요한 타입
```

#### 이 모듈이 하는 일

`posts` 라는 PostgreSQL 테이블의 구조를 TypeScript 로 표현합니다. 이 파일 하나로:
- DB 마이그레이션 SQL 생성 (Drizzle Kit 이 자동)
- 쿼리 시 자동완성 + 타입 검사
- `Post` 타입 자동 추론

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
```

PostgreSQL 컬럼 타입들을 import. **`pg-core`** 는 PostgreSQL 전용 모듈. MySQL 이면 `mysql-core` 를 썼을 거예요.

```typescript
export const posts = pgTable("posts", { ... });
```

- **`pgTable(테이블이름, 컬럼정의)`** — 테이블 정의
- 첫 번째 인자 `"posts"` 가 실제 DB 테이블 이름
- 변수명도 `posts` 로 통일하면 헷갈리지 않음

```typescript
id: serial("id").primaryKey(),
```

- **`serial`** — PostgreSQL 의 자동 증가 정수 (1, 2, 3, ... 자동 부여)
- **`"id"`** — DB 컬럼 이름
- **`.primaryKey()`** — 기본 키 (Primary Key) 로 지정

```typescript
slug: varchar("slug", { length: 200 }).notNull().unique(),
```

- **`varchar`** — 가변 길이 문자열
- **`length: 200`** — 최대 200자
- **`.notNull()`** — NULL 불가
- **`.unique()`** — 중복 불가 (UNIQUE 제약). URL 의 일부니까 중복되면 안 됨

```typescript
date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
```

날짜를 `timestamp` 가 아닌 **문자열** 로 저장. 시간 정보가 필요 없고 정렬도 문자열 비교로 충분하기 때문입니다 (`"2025-04-30" > "2025-04-27"` 이 자연스럽게 성립).

```typescript
content: text("content").notNull(),
```

**`text`** — 길이 제한 없는 문자열. 글 본문은 길 수 있으니 varchar(200) 같은 제한 X.

```typescript
readingTime: integer("reading_time"),
```

`integer` — 정수형. `.notNull()` 이 없으니 NULL 가능 (옵셔널).

> 💡 **JavaScript camelCase ↔ DB snake_case**: TS 코드에서는 `readingTime`, DB 에서는 `reading_time`. Drizzle 이 자동 매핑.

```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
```

- **`timestamp`** — 날짜 + 시간
- **`.defaultNow()`** — 기본값으로 INSERT 시점의 현재 시각
- INSERT 시 따로 값을 지정 안 해도 자동으로 채워짐

```typescript
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

**Drizzle 의 핵심 매력**. 스키마 정의에서 자동으로 타입을 추론:
- **`$inferSelect`** — SELECT 결과 타입 (id, createdAt 등 모든 필드 포함)
- **`$inferInsert`** — INSERT 시 필요한 타입 (id, createdAt 등은 자동이라 옵셔널)

**별도의 타입 정의 파일이 불필요** — 스키마 = 타입. 같은 정보를 두 번 적지 않습니다.

---

### 4. `lib/db/index.ts` DB 클라이언트

DB 와 통신할 클라이언트를 만듭니다. `lib/db/index.ts` 를 새로 만들어주세요.

```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Next.js 개발 모드의 hot reload 시 연결 누수 방지
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

const client = globalForDb.client ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
```

#### 이 모듈이 하는 일

DB 연결 클라이언트 (`db`) 를 만들어 export 합니다. 모든 곳에서 `import { db } from "@/lib/db"` 로 가져와서 쓰면 됩니다.

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
```

- `drizzle` — Drizzle ORM 의 핵심 함수. Drizzle 의 쿼리 API 제공
- `postgres` — 실제 PostgreSQL 연결 드라이버

```typescript
const connectionString = process.env.DATABASE_URL!;
```

`.env` 의 DATABASE_URL 을 읽음. `!` 는 "반드시 있다" 단언.

```typescript
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};
```

여기서부터 약간 복잡한데, **개발 모드의 hot reload 문제** 를 해결하는 트릭입니다.

#### Hot reload 문제와 globalThis 트릭

Next.js 의 개발 모드에선 파일을 수정할 때마다 모듈이 다시 평가됩니다 (hot reload). 그러면 다음 일이 일어나요:

```
1. lib/db/index.ts 가 처음 로드 → postgres(...) 호출 → 연결 1개 생성
2. 코드 수정 → 모듈 재평가 → postgres(...) 다시 호출 → 연결 2개
3. 또 수정 → 연결 3개
... (이걸 매번 반복)
```

매 수정마다 DB 연결이 누적되어 DB 가 "너무 많은 연결" 에러를 낼 수 있어요.

해결: **`globalThis` (전역 객체) 에 연결을 저장**. 모듈이 재평가되어도 globalThis 는 그대로니까 기존 연결을 재사용.

```typescript
const client = globalForDb.client ?? postgres(connectionString);
```

- `globalForDb.client` 가 있으면 그걸 재사용
- 없으면 새로 `postgres(...)` 호출

```typescript
if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}
```

**개발 모드에서만** globalThis 에 저장. 프로덕션에선 hot reload 가 없으니 trick 필요 없음 (그리고 깔끔함 유지).

```typescript
export const db = drizzle(client, { schema });
```

postgres 드라이버를 Drizzle 로 감쌈. `{ schema }` 를 넘기면 Drizzle 이 스키마 정보를 알고 자동완성/타입 검사 제공.

> 💡 **이 trick 은 보일러플레이트** 입니다. Drizzle 공식 가이드에도 거의 그대로 등장. 외울 필요 없이 복사해서 쓰시면 됩니다.

---

### 5. 마이그레이션 + 시드 데이터

이제 DB 에 테이블을 만들고, 초기 데이터를 넣습니다.

#### 5-1. 마이그레이션 생성 + 적용

```bash
# 스키마 → SQL 마이그레이션 파일 생성
npx drizzle-kit generate

# DB 에 적용
npx drizzle-kit push
```

#### `generate` vs `push` — 두 명령어의 차이

- **`generate`**: 스키마 → SQL 마이그레이션 파일 생성. `drizzle/` 폴더에 `0000_xxxx.sql` 같은 파일이 생김. **DB 는 아직 변경 안 됨**.
- **`push`**: 그 SQL 을 **DB 에 직접 적용**. 즉시 테이블 생성됨.

> 💡 **실무에서는** `migrate` 명령어로 마이그레이션을 단계적으로 적용합니다 (롤백 가능, 히스토리 추적). 학습용으론 `push` 가 단순하고 빠릅니다.

**확인**: pgAdmin 4 (또는 다른 PostgreSQL GUI) 에서 `devlog` DB → Schemas → public → Tables → `posts` 테이블이 생성된 것을 확인할 수 있습니다.

#### 5-2. 시드 데이터 스크립트

빈 테이블에 초기 6개 글을 넣어주는 스크립트를 만듭니다. `lib/db/seed.ts` 를 새로 만들어주세요.

```typescript
// lib/db/seed.ts
import "dotenv/config"; // ⭐ tsx 직접 실행 시 .env 로드용
import { db } from "./index";
import { posts } from "./schema";

const seedPosts = [
  {
    slug: "use-effect-deps-guide",
    title: "useEffect 의존성 배열 완전 정복",
    author: "김개발",
    date: "2025-04-30",
    tag: "React",
    excerpt:
      "의존성 배열을 잘못 다루면 무한 루프가 납니다. 가장 흔한 함정 5가지와 해결법을 정리했습니다.",
    content:
      "의존성 배열은 useEffect 의 핵심입니다. 빈 배열은 첫 렌더에만 실행, 의존성을 명시하면 그 값이 바뀔 때만 재실행됩니다. 가장 흔한 실수는 객체나 배열을 의존성에 넣고 매 렌더마다 재실행되는 케이스입니다.",
    readingTime: 7,
    coverImage: "https://picsum.photos/seed/react/1200/600",
  },
  {
    slug: "server-actions-patterns",
    title: "Server Actions 실전 패턴",
    author: "이코드",
    date: "2025-04-27",
    tag: "Next.js",
    excerpt:
      "API 라우트 없이 서버 함수를 호출하는 새로운 방식. 폼 제출과 데이터 변경을 한 번에.",
    content:
      "Server Actions 는 'use server' 지시문이 붙은 함수입니다. 폼의 action prop 에 직접 전달하거나, 클라이언트 컴포넌트에서 import 해서 호출할 수 있습니다.",
    readingTime: 12,
  },
  {
    slug: "typescript-generics-guide",
    title: "TypeScript 제네릭 잘 쓰는 법",
    author: "박타입",
    date: "2025-04-25",
    tag: "TypeScript",
    excerpt:
      "제네릭은 타입을 변수처럼 다루는 도구입니다. 처음엔 어려워 보여도 패턴은 단순합니다.",
    content:
      "제네릭은 함수나 클래스가 다루는 타입을 호출 시점에 결정하게 합니다. 가장 흔한 패턴은 입력 타입과 출력 타입의 관계를 표현하는 것입니다.",
    readingTime: 9,
  },
  {
    slug: "tailwind-layout-patterns",
    title: "Tailwind 레이아웃 패턴 5가지",
    author: "정스타일",
    date: "2025-04-20",
    tag: "CSS",
    excerpt:
      "유틸리티 클래스로 빠르게 레이아웃을 잡는 방법. 자주 쓰는 5가지 패턴을 모았습니다.",
    content:
      "Flexbox 의 flex-1, justify-between, items-center 조합은 반응형 헤더의 기본입니다. Grid 의 grid-cols-[1fr_auto] 는 메인 + 사이드바 패턴에 적합합니다.",
    readingTime: 5,
    coverImage: "https://picsum.photos/seed/css/1200/600",
  },
  {
    slug: "postgresql-index-optimization",
    title: "PostgreSQL 인덱스 최적화 노트",
    author: "최쿼리",
    date: "2025-04-15",
    tag: "DB",
    excerpt:
      "조회 성능을 좌우하는 인덱스 설계. 언제 만들고 언제 안 만들어야 하는가.",
    content:
      "인덱스는 조회 속도를 빠르게 하지만 INSERT/UPDATE 비용을 증가시킵니다. WHERE 절에 자주 등장하는 컬럼, JOIN 키, ORDER BY 컬럼이 인덱스 후보입니다.",
    readingTime: 11,
  },
  {
    slug: "react-suspense-in-practice",
    title: "React 18 Suspense 실전 활용",
    author: "김개발",
    date: "2025-04-12",
    tag: "React",
    excerpt:
      "로딩 UI를 선언적으로 처리하는 Suspense. 데이터 페칭과 함께 쓰는 진짜 활용법.",
    content:
      "Suspense 는 자식 컴포넌트가 데이터나 코드를 기다리는 동안 fallback 을 보여주는 경계입니다. Next.js App Router 의 loading.tsx 는 내부적으로 Suspense 를 활용합니다.",
    readingTime: 8,
  },
];

async function main() {
  console.log("🌱 시드 시작...");
  await db.delete(posts); // 기존 데이터 모두 삭제 (선택)
  await db.insert(posts).values(seedPosts);
  console.log(`✓ ${seedPosts.length}개 글 추가됨`);
  process.exit(0);
}

main().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
```

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import "dotenv/config";
```

**중요한 한 줄**. tsx 로 직접 실행할 때 `.env` 파일을 자동으로 로드하기 위함. 이 줄이 없으면 `process.env.DATABASE_URL` 이 undefined.

> 💡 Next.js dev 서버는 자동으로 .env 를 로드하지만, **tsx 단독 실행은 그렇지 않아요**. 이 import 가 필요한 이유.

```typescript
const seedPosts = [ ... ];
```

6개의 글 데이터. 챕터 13 의 lib/posts.ts 에 있던 데이터와 동일.

```typescript
async function main() {
  await db.delete(posts);
  await db.insert(posts).values(seedPosts);
}
```

- **`db.delete(posts)`** — 기존 데이터 모두 삭제. 시드 재실행 시 중복 방지 (선택사항)
- **`db.insert(posts).values(seedPosts)`** — 배열 한 번에 INSERT

```typescript
process.exit(0);
```

성공 종료. 0 은 "정상 종료" 의 관례적인 코드.

```typescript
main().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
```

에러 처리. 1 은 "비정상 종료" 코드.

#### 5-3. 시드 실행

```bash
# tsx 가 없으면 설치
npm install -D tsx

# 시드 실행
npx tsx lib/db/seed.ts
```

**`tsx`** 는 TypeScript 파일을 컴파일 없이 즉시 실행해주는 도구입니다. ts-node 와 비슷한데 더 빠르고 가볍습니다.

콘솔에 `✓ 6개 글 추가됨` 보이면 성공. pgAdmin 에서 posts 테이블 row 6개 확인할 수 있습니다.

---

### 6. `lib/posts.ts` 를 Drizzle 쿼리로 전체 교체 ⭐

드디어 메인 이벤트입니다. 메모리 배열을 완전히 제거하고 DB 쿼리로 교체합니다.

```typescript
// lib/posts.ts (전체 교체)
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { posts } from "./db/schema";

// 타입은 schema 에서 가져옴 (자동 추론)
export type { Post } from "./db/schema";

// slug 로 글 하나 조회
export async function getPostBySlug(slug: string) {
  const result = await db.select().from(posts).where(eq(posts.slug, slug));
  return result[0]; // 없으면 undefined
}

// 모든 글 조회 (최신순)
export async function getAllPosts() {
  return await db.select().from(posts).orderBy(desc(posts.date));
}

// 모든 태그 조회 (중복 제거)
export async function getAllTags(): Promise<string[]> {
  const rows = await db.selectDistinct({ tag: posts.tag }).from(posts);
  return rows.map((r) => r.tag);
}

// 글 추가
export async function addPost(input: {
  title: string;
  content: string;
  tag: string;
  author: string;
  excerpt: string;
}) {
  // slug 생성: 소문자 + 공백→하이픈 + 특수문자 제거
  const slug =
    input.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "") || `post-${Date.now()}`;

  const [newPost] = await db
    .insert(posts)
    .values({
      slug,
      title: input.title,
      author: input.author,
      date: new Date().toISOString().split("T")[0],
      tag: input.tag,
      excerpt: input.excerpt,
      content: input.content,
      readingTime: Math.ceil(input.content.length / 500),
    })
    .returning();

  return newPost;
}
```

#### 이 모듈이 하는 일

겉으로 보면 챕터 13/14 와 함수 이름, 시그니처 모두 동일합니다. **내부 구현만 Drizzle 쿼리로 교체** 됐어요.

- 메모리 배열 (`let posts = [...]`) 완전 제거
- 모든 함수가 `db.xxx()` 쿼리
- `Post` 타입을 schema 에서 직접 export

#### 코드 한 줄 한 줄 의미 짚기

```typescript
import { eq, desc } from "drizzle-orm";
```

- **`eq`** — equal. WHERE 절의 `=` 비교
- **`desc`** — descending. ORDER BY 의 내림차순

```typescript
export type { Post } from "./db/schema";
```

`Post` 타입을 재export. **타입 한 곳에서 관리** — 챕터 13/14 의 자체 정의 타입이 사라지고 스키마가 진실의 원천.

```typescript
export async function getPostBySlug(slug: string) {
  const result = await db.select().from(posts).where(eq(posts.slug, slug));
  return result[0];
}
```

SQL 로 표현하면:
```sql
SELECT * FROM posts WHERE slug = '...' LIMIT 1;
```

- **`db.select()`** — SELECT 시작
- **`.from(posts)`** — FROM posts
- **`.where(eq(posts.slug, slug))`** — WHERE slug = ?
- **`result[0]`** — 배열의 첫 번째 (없으면 undefined). LIMIT 1 효과

```typescript
export async function getAllPosts() {
  return await db.select().from(posts).orderBy(desc(posts.date));
}
```

SQL:
```sql
SELECT * FROM posts ORDER BY date DESC;
```

`desc(posts.date)` 가 ORDER BY DESC 부분.

```typescript
export async function getAllTags(): Promise<string[]> {
  const rows = await db.selectDistinct({ tag: posts.tag }).from(posts);
  return rows.map((r) => r.tag);
}
```

SQL:
```sql
SELECT DISTINCT tag FROM posts;
```

- **`selectDistinct`** — 중복 제거
- **`{ tag: posts.tag }`** — tag 컬럼만 선택
- `rows.map((r) => r.tag)` — 객체 배열 → 문자열 배열 변환

```typescript
const [newPost] = await db
  .insert(posts)
  .values({
    slug,
    // ...
  })
  .returning();
```

SQL:
```sql
INSERT INTO posts (slug, title, ...) VALUES (...) RETURNING *;
```

- **`db.insert(posts)`** — INSERT INTO posts
- **`.values({...})`** — VALUES (...)
- **`.returning()`** — RETURNING * (INSERT 직후 그 row 반환)
- **`const [newPost] = ...`** — 배열 구조분해. .returning() 은 배열을 반환하니까 첫 번째 꺼냄

```typescript
const slug =
  input.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "") || `post-${Date.now()}`;
```

챕터 14 와 같은 slug 생성 로직 + 안전장치 추가:
- 만약 모든 문자가 제거되어 빈 문자열이 되면 `post-${타임스탬프}` 사용
- 예: 제목이 `"!!!"` 같이 모두 특수문자면 slug 가 빈 문자열이 되는데, slug 는 unique 제약이 있어서 빈 문자열도 한 번만 허용. fallback 으로 안전 확보.

#### 호출하는 쪽 코드는 한 줄도 안 바뀜 ⭐

```tsx
// app/page.tsx (변경 없음)
export default async function HomePage() {
  const posts = await getAllPosts();  // 이제 진짜 DB 쿼리!
  const tags = await getAllTags();
  // ...
}
```

```tsx
// app/posts/[slug]/page.tsx (변경 없음)
const post = await getPostBySlug(slug);
```

```typescript
// lib/actions.ts (변경 없음)
const newPost = await addPost({ ... });
```

함수 이름도, 시그니처도, 반환 타입도 모두 같습니다. 호출하는 쪽에선 그저 함수 호출만 하면 되고, 내부가 메모리 배열인지 DB 인지 신경 쓸 필요가 없습니다.

**이게 추상화의 힘** 이에요. 챕터 13 에서 미리 함수로 분리해둔 결정이 챕터 15 의 DB 교체를 깔끔하게 만듭니다.

---

### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 확인할 것:

1. **메인 페이지**: 시드된 6개 글 표시 (DB 에서 조회됨) ⭐
2. **카드 클릭** → 상세 페이지 (DB 에서 조회)
3. **글 작성 → 발행** → 새 글이 DB 에 저장됨
4. **`Ctrl+C` 로 서버 끄고 `npm run dev` 재시작** → **새 글이 그대로 유지됨** ⭐ (메모리 저장과의 결정적 차이!)
5. **pgAdmin** 에서 posts 테이블 row 확인 — 새로 추가된 글의 row 보임

여기까지 정상 동작하면 이번 챕터의 목표는 달성된 것입니다.

> 💡 **이게 영구 저장의 힘** 입니다. 서버를 100번 재시작해도, 회사 서버에 배포해도, 누군가 다른 곳에서 접속해도 — 모두가 같은 DB 의 같은 데이터를 봅니다. 진짜 서비스의 모습이에요.

---

## ❓ 흔한 실수

### Q1. `.env` 의 비밀번호가 틀림
```
ECONNREFUSED 또는 password authentication failed
```
챕터 00 에서 설정한 비밀번호를 정확히 확인하세요. 기본은 `devlog` 이지만 본인이 다른 값으로 설정했을 수도 있어요.

### Q2. `.env` 가 git 에 커밋됨
```bash
git rm --cached .env  # 추적 해제
echo ".env" >> .gitignore  # gitignore 에 추가
```
이미 push 된 상태라면 비밀번호를 **즉시 변경** 하세요. git history 에 남아있을 수 있습니다.

### Q3. `push` 와 `generate` 차이 헷갈림
- `generate` — SQL 파일 생성만 (DB 미변경)
- `push` — DB 에 즉시 적용
- 둘 다 필요. `generate` 로 만든 파일을 git 추적하면 마이그레이션 히스토리 유지 가능.

### Q4. `dotenv/config` 누락
```bash
$ npx tsx lib/db/seed.ts
Error: DATABASE_URL is undefined
```
시드 스크립트 첫 줄에 `import "dotenv/config";` 가 빠진 경우. tsx 직접 실행은 .env 자동 로드 안 함.

### Q5. PostgreSQL 서비스가 안 켜져 있음
```
ECONNREFUSED localhost:5432
```
Windows: 서비스 관리자에서 PostgreSQL 서비스 시작
macOS: `brew services start postgresql@17`
Linux: `sudo systemctl start postgresql`

### Q6. 스키마 변경 후 `push` 안 함
스키마를 수정했는데 DB 에 반영 안 되면 쿼리가 실패. **스키마 수정 → `npx drizzle-kit push` 잊지 말기**.

### Q7. `serial` vs `integer` 헷갈림
- `serial` — 자동 증가 (1, 2, 3, ...). PRIMARY KEY 에 자주 사용
- `integer` — 일반 정수. 직접 값을 지정해야 함

### Q8. `.returning()` 빼먹음
```typescript
// ❌ 추가는 되지만 새 row 반환 안 됨 → 사용 측에서 redirect 등에 사용 못 함
await db.insert(posts).values({...});

// ✅ 새 row 반환
const [newPost] = await db.insert(posts).values({...}).returning();
```

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] **ORM** 이 무엇이고, 왜 SQL 직접 작성보다 나은지 안다
- [ ] **Drizzle 의 흐름** (스키마 → 마이그레이션 → 쿼리) 을 안다
- [ ] **스키마 정의** 가 곧 **타입 정의** (`$inferSelect`, `$inferInsert`) 라는 것을 안다
- [ ] **`.env`** 의 DATABASE_URL 형식을 안다 (`postgresql://user:pw@host:port/db`)
- [ ] **`generate` 와 `push`** 의 차이를 안다
- [ ] **`globalThis` 트릭** 이 hot reload 시 연결 누수를 막는 이유를 안다
- [ ] **Drizzle 쿼리 메서드** (`select`, `from`, `where`, `insert`, `values`, `returning`) 의 SQL 매핑을 안다
- [ ] **함수 시그니처 보존** 의 가치 — 호출 측 코드 변경 없이 데이터 출처 교체
- [ ] http://localhost:3000 에서 글 작성 → 서버 재시작 → 글 유지 확인 ⭐

---

## ✅ 다음 챕터 예고

> **챕터 16: NextAuth 인증 + 미들웨어**
> 지금까지는 누구나 글을 쓸 수 있었습니다. 이제 **로그인 시스템** 을 추가합니다. **NextAuth v4** 의 Credentials Provider 로 사내용 로그인을 구현하고, **`middleware.ts`** 로 `/write` 같은 보호 라우트를 만듭니다. 그리고 글 작성 시 author 가 자동으로 로그인 사용자가 되도록 챕터 14 의 Server Action 을 살짝 업데이트합니다.
