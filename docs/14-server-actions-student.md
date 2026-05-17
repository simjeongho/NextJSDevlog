# 챕터 14: 데이터 페칭 + Server Actions

> **시간**: 약 30분 · **블록**: Day 2 / Block 4

---

## 🎯 이 챕터에서 다룰 내용

- **Server Actions** — `"use server"` 지시문, API 라우트 없이 서버 함수 직접 호출
- **`<form action={action}>`** 폼 패턴 — 함수 자체를 action 에 전달하는 모던 방식
- **`useFormStatus`** 훅 — 폼 제출 상태 자동 감지
- **`revalidatePath`** 로 데이터 갱신
- **`redirect`** 로 작업 완료 후 페이지 이동
- 본 프로젝트에 **글 작성 페이지** 추가 + Server Action 으로 저장

지금까지는 글 데이터를 화면에 표시만 했어요. 이번 챕터에선 **글을 직접 작성** 할 수 있게 만듭니다.

Server Actions 는 Next.js 의 비교적 최신 기능입니다. 이전엔 폼 데이터를 서버로 보내려면 `/api/posts` 같은 API 라우트를 따로 만들고, fetch 로 호출하고, 결과를 처리해야 했어요. Server Actions 는 그걸 한 단계로 만듭니다 — **서버 함수를 그냥 import 해서 폼의 action 에 넘기면 끝**.

---

## 🖥️ 이 챕터에서 다룰 파일

- `lib/posts.ts` — 글 추가 함수 추가 (수정)
- `lib/actions.ts` — Server Action 모음 (신규)
- `app/write/page.tsx` — 글 작성 폼 페이지 (신규)
- `components/Header.tsx` — "글 작성" 링크 추가 (수정)

---

## 🧠 핵심 개념

### 1. 전통 방식 vs Server Actions

먼저 **왜 Server Actions 가 등장했는지** 짚고 가겠습니다.

#### 전통 방식 — API 라우트 + fetch

```tsx
// 1단계: API 라우트 정의 (app/api/posts/route.ts)
export async function POST(request: Request) {
  const body = await request.json();
  // 검증, DB 저장 등
  return Response.json({ ok: true });
}

// 2단계: 클라이언트 컴포넌트에서 fetch
"use client";
function MyForm() {
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.target);
    await fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        // ...
      }),
    });

    setPending(false);
    // 페이지 이동 처리
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

이 코드는 **3가지 곳에 정보를 분산** 시킵니다.
1. API 라우트 (서버 로직)
2. fetch 호출 (네트워크 코드)
3. 폼 핸들러 (UI 로직)

#### Server Actions 방식

```tsx
// 1단계: Server Action 정의 (lib/actions.ts)
"use server";
export async function createPost(formData: FormData) {
  // 검증, DB 저장 등
}

// 2단계: 폼의 action 에 그냥 전달
import { createPost } from "@/lib/actions";

function MyForm() {
  return <form action={createPost}>...</form>;
}
```

**두 곳만**, 그것도 매우 단순한 코드.

---

### 2. `"use server"` 지시문

`"use client"` 가 **"여기부터 클라이언트 영역"** 이라는 경계였다면, **`"use server"` 는 "이 함수는 서버에서만 실행"** 이라는 표시입니다.

#### 두 가지 작성 위치

```typescript
// 방식 A: 파일 맨 위 — 파일 안의 모든 export 함수가 Server Action
"use server";

export async function createPost(formData: FormData) { ... }
export async function deletePost(id: number) { ... }
```

```typescript
// 방식 B: 함수 본체 안 — 그 함수만 Server Action
export async function createPost(formData: FormData) {
  "use server";
  // ...
}
```

> 💡 **DevLog 컨벤션**: 방식 A. `lib/actions.ts` 파일에 모든 Server Action 을 모읍니다.

#### 클라이언트에서 호출

```tsx
"use client";
import { createPost } from "@/lib/actions";

export default function MyForm() {
  return (
    <form action={createPost}>  {/* ⭐ 함수 자체를 action 에 전달 */}
      <input name="title" />
      <button type="submit">저장</button>
    </form>
  );
}
```

폼 제출 시 Next.js 가 자동으로:
1. FormData 생성
2. 서버에 함수 호출 요청 (HTTP POST)
3. createPost 실행 (서버에서)
4. 결과 처리

**우리는 fetch / API 라우트 코드를 한 줄도 안 씁니다.** Next.js 가 알아서 처리합니다.

#### `"use server"` 의 안전장치

이 지시문이 붙은 함수는 **반드시 서버에서만 실행** 됩니다. 클라이언트에서 import 하더라도 함수 본체가 클라이언트로 전송되지 않습니다. 단지 **"이 함수를 서버에서 호출해줘" 라는 RPC 호출** 만 가는 거예요.

그래서 Server Action 안에서는:
- DB 비밀번호 같은 환경변수 접근 OK
- DB 직접 쿼리 OK
- 외부 API 키 사용 OK

모두 안전합니다.

---

### 3. FormData 다루기

Server Action 의 첫 번째 인자는 **`FormData` 객체** 입니다. 폼의 input 들을 `name` 속성으로 식별해서 꺼냅니다.

```typescript
"use server";

export async function createPost(formData: FormData) {
  // name 속성으로 값 꺼내기
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tag = formData.get("tag") as string;

  // 실제로는 검증 + DB 저장 등
  console.log({ title, content, tag });
}
```

> 💡 **왜 `as string` 이 필요한가?**: `formData.get()` 의 반환 타입은 `FormDataEntryValue | null` 입니다 (string 또는 File 또는 null). 우리는 input 이라 string 인 걸 알지만 TypeScript 는 모릅니다. 명시적 단언 (`as string`) 으로 좁혀줍니다.

---

### 4. `revalidatePath` — 캐시 무효화

Next.js 는 Server Component 의 결과를 **자동으로 캐싱** 합니다. 글을 새로 추가했는데 메인 페이지가 옛날 캐시를 그대로 보여주면 곤란하죠.

**`revalidatePath`** 로 "이 경로의 캐시를 비워줘" 라고 알려줍니다.

```typescript
"use server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  // ... DB 저장 ...
  revalidatePath("/");  // ⭐ 메인 페이지 캐시 무효화
}
```

다음에 사용자가 메인 페이지를 방문하면 **fresh 한 데이터로 다시 렌더링** 됩니다.

---

### 5. `redirect` — 작업 후 페이지 이동

글 저장 완료 후 메인 페이지나 상세 페이지로 자동 이동시키고 싶다면 **`redirect`** 함수를 사용합니다. 챕터 13 의 `notFound()` 와 비슷한 패턴 — 호출하면 즉시 흐름이 끊기고 redirect.

```typescript
"use server";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  // ... DB 저장 ...
  redirect(`/posts/${newPost.slug}`);  // ⭐ 새 글 상세 페이지로 이동
}
```

---

### 6. `useFormStatus` — 폼 상태 자동 감지

폼이 제출 중일 때 버튼을 비활성화하거나 "저장 중..." 텍스트로 바꾸려면 **`useFormStatus`** 훅을 씁니다. 챕터 09 까지의 패턴이라면 다음과 같이 했을 거예요.

```tsx
// ❌ 수동 패턴
const [pending, setPending] = useState(false);

const handleSubmit = async (e) => {
  setPending(true);
  await submitData(...);
  setPending(false);
};
```

`useFormStatus` 는 **폼의 자식 컴포넌트에서 자동으로** 폼 상태를 감지합니다.

```tsx
"use client";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();  // ⭐ 폼 제출 중 여부

  return (
    <button type="submit" disabled={pending}>
      {pending ? "저장 중..." : "저장"}
    </button>
  );
}
```

> 💡 **주의**: `useFormStatus` 는 **폼 안의 자식 컴포넌트** 에서만 동작합니다. 폼과 같은 컴포넌트에서 호출하면 항상 `pending: false` 가 반환됩니다. 그래서 SubmitButton 을 별도 컴포넌트로 분리하는 것이 패턴입니다.

#### `useState(isLoading)` 와의 비교

| 항목 | 수동 useState 패턴 | useFormStatus |
|---|---|---|
| 코드량 | useState + onSubmit 로직 직접 | 훅 한 줄 |
| 정확성 | 직접 setPending 호출 누락 시 버그 | 자동 추적 |
| 부모 컴포넌트 영향 | useState 가 부모에 위치 → 부모 리렌더 | 자식만 리렌더 (챕터 09) |

---

## 🛠 실습

네 단계로 진행됩니다.

1. `lib/posts.ts` 에 글 추가 함수 (`addPost`)
2. `lib/actions.ts` — Server Action 정의
3. `app/write/page.tsx` — 글 작성 폼 페이지
4. `components/Header.tsx` — "글 작성" 링크 추가

---

### 1. `lib/posts.ts` 에 글 추가 함수

기존 `lib/posts.ts` 의 일부를 수정합니다. 메모리에 글을 추가하는 함수를 새로 만듭니다.

```typescript
// lib/posts.ts (변경 부분만)

// ⭐ const → let (새 글 추가를 위해)
export let posts: Post[] = [
  // ... (기존 6개 글 그대로)
];

// ⭐ 신규 — 글 추가 함수
export async function addPost(input: {
  title: string;
  content: string;
  tag: string;
  author: string;
  excerpt: string;
}): Promise<Post> {
  // 시뮬레이션 지연 (실제 DB 저장 흉내)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const newPost: Post = {
    id: Math.max(...posts.map((p) => p.id)) + 1,
    slug: input.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, ""),
    title: input.title,
    author: input.author,
    date: new Date().toISOString().split("T")[0],  // YYYY-MM-DD
    tag: input.tag,
    excerpt: input.excerpt,
    content: input.content,
    readingTime: Math.ceil(input.content.length / 500),  // 대략 추정
  };

  posts = [newPost, ...posts];  // ⭐ 새 글을 맨 앞에
  return newPost;
}
```

#### 이 함수가 하는 일

사용자가 폼에 입력한 정보를 받아서:
1. 새 id 부여 (기존 최대 id + 1)
2. slug 자동 생성 (제목을 소문자 + 하이픈으로 변환)
3. 오늘 날짜 자동 입력
4. excerpt, readingTime 자동 계산
5. posts 배열 맨 앞에 추가
6. 추가된 글 반환

#### 코드 한 줄 한 줄 의미 짚기

```typescript
export let posts: Post[] = [ ... ];
```

`const` 를 `let` 으로 변경. 챕터 13 까지는 데이터 변경이 없었으니 const 였지만, 이제 글이 추가될 수 있으니 let 으로.

> ⚠️ **메모리 저장의 한계**: 서버를 재시작하면 추가된 글은 사라집니다. 그리고 프로덕션 환경 (여러 서버 인스턴스) 에서는 인스턴스마다 메모리가 분리되어 동작하지 않을 수 있어요. **이건 챕터 15 의 DB 교체 전 임시 단계** 입니다.

```typescript
await new Promise((resolve) => setTimeout(resolve, 500));
```

500ms 지연. 실제 DB 저장이 시간이 걸리는 걸 시뮬레이션. 학습자가 "저장 중..." 상태를 시각적으로 확인할 수 있게.

```typescript
slug: input.title
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9가-힣-]/g, ""),
```

slug 자동 생성 — 메서드 체이닝으로:
1. **`.toLowerCase()`** — 소문자로 변환
2. **`.replace(/\s+/g, "-")`** — 공백을 하이픈으로 (정규식: 하나 이상의 공백)
3. **`.replace(/[^a-z0-9가-힣-]/g, "")`** — 영문/숫자/한글/하이픈 외 모두 제거

예: `"useEffect 의존성 배열!"` → `"useeffect-의존성-배열"`

```typescript
id: Math.max(...posts.map((p) => p.id)) + 1,
```

- **`posts.map((p) => p.id)`** — 모든 id 추출
- **`Math.max(...)`** — 가장 큰 id 찾기 (스프레드로 배열을 인자들로 펼침)
- **`+ 1`** — 다음 id

```typescript
posts = [newPost, ...posts];
```

새 글을 **맨 앞에** 추가. 챕터 07 에서 배운 불변성 패턴 — `.push()` 가 아닌 스프레드로 새 배열 생성.

#### 챕터 15 와의 연결

이 함수는 챕터 15 에서 **Drizzle ORM 의 `db.insert(posts).values(...)`** 로 교체될 자리입니다. 함수 시그니처 (`async addPost(input): Promise<Post>`) 는 그대로 유지될 예정이에요. **호출하는 쪽 (Server Action) 의 코드는 안 바뀝니다.** 추상화의 가치입니다.

---

### 2. `lib/actions.ts` Server Actions

이제 **Server Action 파일** 을 새로 만듭니다. 프로젝트 루트의 `lib/` 폴더에 `actions.ts` 를 추가하세요.

```typescript
// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addPost } from "./posts";

export async function createPost(formData: FormData) {
  // FormData 에서 값 꺼내기
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tag = formData.get("tag") as string;

  // 간단한 검증
  if (!title?.trim() || !content?.trim() || !tag?.trim()) {
    throw new Error("제목, 본문, 태그는 모두 필수입니다.");
  }

  // 글 저장
  const newPost = await addPost({
    title: title.trim(),
    content: content.trim(),
    tag: tag.trim(),
    author: "익명",  // 챕터 16 에서 NextAuth 세션 사용자로 교체
    excerpt:
      content.trim().slice(0, 100) + (content.length > 100 ? "..." : ""),
  });

  // 메인 페이지 캐시 무효화
  revalidatePath("/");

  // 새 글 상세 페이지로 이동
  redirect(`/posts/${newPost.slug}`);
}
```

#### 이 모듈이 하는 일

폼에서 제출된 데이터를 받아서:
1. FormData 에서 title, content, tag 추출
2. 검증 (모두 필수)
3. addPost 함수로 저장
4. 메인 페이지 캐시 무효화
5. 새 글 상세 페이지로 redirect

#### 코드 한 줄 한 줄 의미 짚기

```typescript
"use server";
```

파일 맨 위. 이 파일의 모든 export 함수가 Server Action 으로 인식됩니다. 클라이언트에서 import 해서 호출해도 실제로는 서버에서 실행됩니다.

```typescript
const title = formData.get("title") as string;
```

`<input name="title">` 의 값을 꺼냅니다. `as string` 단언이 필요한 이유는 앞서 설명드린 대로 — TypeScript 는 반환 타입을 `FormDataEntryValue | null` 로 보기 때문.

```typescript
if (!title?.trim() || !content?.trim() || !tag?.trim()) {
  throw new Error("제목, 본문, 태그는 모두 필수입니다.");
}
```

검증 단계:
- **`title?.trim()`** — 옵셔널 체이닝 (참고자료 3번). title 이 null/undefined 면 trim() 호출 안 함
- **`!title?.trim()`** — trim 결과가 빈 문자열이면 truthy 가 아님 → 검증 실패
- **`throw new Error(...)`** — 에러 던지기. Next.js 가 자동으로 가까운 `error.tsx` 를 표시

```typescript
const newPost = await addPost({
  title: title.trim(),
  content: content.trim(),
  tag: tag.trim(),
  author: "익명",
  excerpt:
    content.trim().slice(0, 100) + (content.length > 100 ? "..." : ""),
});
```

- **`title.trim()`** — 앞뒤 공백 제거 (사용자가 실수로 공백 친 경우 대비)
- **`author: "익명"`** — 챕터 16 에서 NextAuth 로그인 사용자 이름으로 교체 예정
- **`excerpt`** — content 의 앞 100자. 100자 넘으면 "..." 추가

```typescript
revalidatePath("/");
```

메인 페이지의 캐시 무효화. 다음 방문 시 새 글이 보이도록.

```typescript
redirect(`/posts/${newPost.slug}`);
```

새 글의 상세 페이지로 이동. **사용자가 자기가 쓴 글을 바로 확인** 할 수 있어 UX 가 좋습니다.

#### `revalidatePath` vs `redirect` — 둘 다 호출하는 이유

```typescript
revalidatePath("/");
redirect(`/posts/${newPost.slug}`);
```

언뜻 보면 redirect 만 해도 될 것 같죠. 하지만:
- `redirect` 는 사용자를 **새 페이지로 이동시킬 뿐**, 메인 페이지의 캐시는 안 건드림
- 사용자가 나중에 "← 목록으로" 로 돌아가면 **캐시된 옛날 목록** 을 봄
- `revalidatePath("/")` 가 메인 페이지 캐시를 무효화 → 돌아갔을 때 fresh

두 작업은 **다른 일** 입니다. 함께 호출하는 게 맞아요.

---

### 3. `app/write/page.tsx` 글 작성 폼

이제 폼 페이지를 만듭니다. `app/write/page.tsx` 경로의 새 파일.

```tsx
// app/write/page.tsx
"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import Container from "@/components/Container";
import { createPost } from "@/lib/actions";

const tagOptions = ["React", "Next.js", "TypeScript", "CSS", "DB", "기타"];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "저장 중..." : "글 발행"}
    </button>
  );
}

export default function WritePage() {
  return (
    <Container>
      <div className="py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-cyan-400"
        >
          <span>←</span>
          <span>목록으로</span>
        </Link>

        <h1 className="mb-2 text-4xl font-semibold tracking-tight">
          새 글 작성
        </h1>
        <p className="mb-10 text-zinc-400">
          학습한 내용을 정리해서 동료들과 공유해보세요.
        </p>

        {/* form 의 action 에 Server Action 을 직접 전달 */}
        <form action={createPost} className="space-y-6">
          {/* 제목 */}
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              제목
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="제목을 입력해주세요"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
            />
          </div>

          {/* 태그 */}
          <div>
            <label
              htmlFor="tag"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              태그
            </label>
            <select
              id="tag"
              name="tag"
              required
              defaultValue=""
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
            >
              <option value="" disabled className="bg-zinc-900">
                태그를 선택해주세요
              </option>
              {tagOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-900">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 본문 */}
          <div>
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              본문
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={12}
              placeholder="학습한 내용을 자유롭게 작성해주세요"
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-600 transition-colors focus:border-cyan-400/40 focus:bg-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Link
              href="/"
              className="rounded-lg border border-zinc-800 bg-transparent px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              취소
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </Container>
  );
}
```

#### 이 페이지가 하는 일

제목, 태그, 본문 세 가지 입력을 받아 Server Action 으로 제출합니다. 제출 중에는 버튼이 비활성화되고 "저장 중..." 으로 표시됩니다.

#### 코드 한 줄 한 줄 의미 짚기

```tsx
"use client";
```

`useFormStatus` 가 클라이언트 훅이라 Client Component 필수.

```tsx
import { useFormStatus } from "react-dom";
```

`react-dom` 에서 import — `react` 가 아닙니다. 헷갈리기 쉬운 부분.

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  // ...
}
```

**SubmitButton 을 별도 컴포넌트로 분리** 했습니다. 이유는 앞서 설명드린 대로 — `useFormStatus` 는 폼의 자식 컴포넌트에서만 동작합니다.

```tsx
{pending ? "저장 중..." : "글 발행"}
```

- 평소: "글 발행"
- 제출 중 (서버 응답 대기): "저장 중..." + `disabled`

500ms 지연을 줬으니 사용자가 이 상태 변화를 시각적으로 확인할 수 있습니다.

```tsx
<form action={createPost} className="space-y-6">
```

**이 한 줄이 챕터의 핵심**. `action` 속성에 Server Action 함수를 **그대로 전달**. Next.js 가 알아서 처리해줍니다.

HTML 의 form action 은 원래 URL 문자열이었어요. React + Next.js 가 함수도 받을 수 있게 확장한 거예요.

```tsx
<input id="title" name="title" type="text" required ... />
<select id="tag" name="tag" required ... >
<textarea id="content" name="content" required rows={12} ... />
```

**각 입력의 `name` 속성이 FormData 의 키** 입니다. 서버 측 `formData.get("title")` 이 이 input 의 값을 꺼냅니다.

`required` 속성은 브라우저 기본 검증 — 빈 값 제출 시 브라우저가 경고를 띄웁니다. 추가로 서버 측에서도 검증 (이중 안전장치).

```tsx
<select defaultValue="">
  <option value="" disabled>태그를 선택해주세요</option>
  {tagOptions.map(...)}
</select>
```

- **`defaultValue=""`** — 초기에 빈 값
- **`<option value="" disabled>`** — 빈 값은 선택 불가 (placeholder 역할)
- 사용자가 반드시 태그 하나를 골라야 함

```tsx
<textarea rows={12} className="... resize-y ...">
```

- **`rows={12}`** — 기본 높이 12줄
- **`resize-y`** — 세로로만 크기 조절 가능 (가로는 컨테이너 고정)

#### 폼 제출 흐름

```
사용자 입력 + 제출 버튼 클릭
   ↓
브라우저: form 데이터를 FormData 로 직렬화
   ↓
Next.js: createPost 함수를 서버에 호출 요청 (네트워크)
   ↓
서버: createPost 실행
  - FormData 파싱
  - 검증
  - addPost 호출 (500ms 시뮬레이션 지연)
  - revalidatePath("/")
  - redirect(`/posts/${slug}`)
   ↓
브라우저: redirect 응답 받음 → /posts/[slug] 로 이동
   ↓
사용자: 새 글 상세 페이지 표시 ⭐
```

이 과정에서 우리가 작성한 코드:
- Server Action 함수 정의
- `<form action={createPost}>` 한 줄

**fetch, JSON.stringify, response.json(), 라우터 navigate 등 전혀 안 적었습니다.**

---

### 4. Header 에 "글 작성" 링크 추가

마지막으로 메인 페이지에서 글 작성 페이지로 가는 링크를 추가합니다.

```tsx
// components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-zinc-900 bg-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-lime-300 font-mono text-sm font-bold text-black shadow-[0_0_16px_rgba(0,217,255,0.3)]">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">DevLog</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/write"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
          >
            ✏️ 글 작성
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

#### 변화점

- 우측 nav 에 **"✏️ 글 작성"** 버튼 추가
- 시안색 강조 (주요 행동) — 사용자 시선을 끄는 디자인

#### 동작 확인

```bash
npm run dev
```

http://localhost:3000 에서 다음을 차례로 해보세요:

1. **우측 상단 "글 작성" 버튼** 클릭 → `/write` 페이지로 이동
2. **제목, 태그, 본문 입력** 후 "글 발행" 버튼 클릭
3. **버튼이 "저장 중..." 으로 바뀜** (500ms) ⭐
4. **자동으로 새 글 상세 페이지로 이동** (`/posts/[slug]`)
5. **"목록으로" 클릭** → 메인 페이지 → **새 글이 맨 위에 표시됨** ⭐

여기까지 정상 동작하면 이번 챕터의 목표는 달성된 것입니다.

> ⚠️ **메모리 저장의 한계 직접 체험**: 개발 서버를 한 번 재시작 (`Ctrl+C` 후 `npm run dev`) 해보세요. **방금 추가한 글이 사라집니다.** 이건 데이터가 메모리에만 있어서 그래요. 다음 챕터(15) 에서 PostgreSQL DB 로 교체하면 영구 저장됩니다.

---

## ❓ 흔한 실수

### Q1. `"use server"` 와 `"use client"` 헷갈림
```typescript
// ❌ "use client" — 이건 React 컴포넌트용 (브라우저)
// ✅ "use server" — Server Action 용 (서버)
"use server";
```
두 지시문은 정반대의 의미. 헷갈리시면 "이 코드가 어디서 돌아가야 하는가?" 를 떠올리세요.

### Q2. Server Action 안에서 React 훅 사용
```typescript
"use server";
export async function createPost(formData: FormData) {
  const [count] = useState(0);  // ❌ 에러
}
```
Server Action 은 서버에서 실행되는 함수. React 훅(useState, useEffect 등) 은 클라이언트 전용. 정반대 환경입니다.

### Q3. `input` 에 `name` 속성 빠뜨림
```tsx
<input type="text" placeholder="제목" />  {/* ❌ name 없음 */}
```
`name` 이 없으면 FormData 에 포함되지 않아서 `formData.get("title")` 이 null. 폼의 모든 입력에 반드시 `name` 속성.

### Q4. `useFormStatus` 를 폼과 같은 컴포넌트에서 호출
```tsx
function WritePage() {
  const { pending } = useFormStatus();  // ❌ 항상 false 반환
  return <form action={createPost}>...</form>;
}
```
`useFormStatus` 는 **폼의 자식 컴포넌트** 에서만 동작. SubmitButton 처럼 별도 컴포넌트로 분리하셔야 합니다.

### Q5. `formData.get()` 결과를 string 으로 가정
```typescript
const title = formData.get("title");  // FormDataEntryValue | null
title.trim();  // ❌ 타입 에러 — null 가능성
```
`as string` 단언 또는 null 체크 필요.

### Q6. `redirect()` 후 코드 작성
```typescript
redirect("/");
console.log("이건 실행됨?");  // ❌ 도달 불가
```
redirect 는 내부적으로 throw 를 발생시킵니다. 이후 코드는 실행되지 않아요.

### Q7. Server Action 에서 throw 한 에러가 사용자에게 그대로 노출
```typescript
throw new Error("DB 비밀번호: xxx");  // ❌ 클라이언트에 노출됨
```
프로덕션 환경에서 에러 메시지가 사용자에게 보일 수 있습니다. 민감한 정보는 절대 에러 메시지에 포함하지 마세요. **사용자용 메시지 + 내부 로그** 를 분리하시는 게 안전합니다.

### Q8. `revalidatePath` 누락
글을 추가했는데 메인 페이지에 안 보임 → revalidatePath 가 빠진 경우. 데이터 변경 후엔 영향받는 경로의 캐시 무효화 필수.

---

## 🎯 학습 체크리스트

이 챕터를 마치셨다면 다음을 확인해보세요.

- [ ] **전통 API 라우트 + fetch** 방식과 **Server Actions** 방식의 차이를 안다
- [ ] **`"use server"`** 의 두 가지 작성 위치 (파일 상단 vs 함수 본체) 를 안다
- [ ] **`<form action={함수}>`** 패턴의 동작 흐름을 설명할 수 있다
- [ ] **FormData** 에서 값을 꺼내는 방법 (`formData.get("name")`) 을 안다
- [ ] **`revalidatePath`** 의 역할 (캐시 무효화) 을 안다
- [ ] **`redirect`** 의 동작 (이후 코드 실행 X) 을 안다
- [ ] **`useFormStatus`** 가 폼의 자식 컴포넌트에서만 동작하는 이유를 안다
- [ ] http://localhost:3000 에서 글 작성 → 저장 → 자동 이동 → 메인 페이지에 새 글 확인 동작
- [ ] 서버 재시작 시 글이 사라지는 메모리 저장의 한계를 체험했다

---

## ✅ 다음 챕터 예고

> **챕터 15: Drizzle ORM + PostgreSQL**
> 메모리 저장을 **PostgreSQL 데이터베이스로 교체** 합니다. TypeScript 친화도가 매우 높은 ORM인 **Drizzle** 을 사용합니다. 스키마 정의 → 마이그레이션 → 쿼리의 흐름을 다루고, 챕터 13~14 에서 만든 함수들의 시그니처를 그대로 유지하면서 내부를 DB 쿼리로 교체합니다. 글이 영구 저장되어 서버 재시작에도 살아남습니다.
