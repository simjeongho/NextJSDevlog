// app/sandbox/ch02/page.tsx
"use client";

import { useState } from "react";

// 데모 ①
function ExpressionDemo() {
  const name = "길동";
  const age = 25;
  return (
    <section
      className="text-white"
      style={{ padding: 16, border: "1px solid #ddd", marginBottom: 16 }}
    >
      <h2>① JSX 표현식 데모</h2>
      <p>{name}님 안녕하세요</p>
      <p>나이: {age + 1}살이 됩니다</p>
      <p>대문자: {name.toUpperCase()}</p>
    </section>
  );
}

// 데모 ②
function ConditionalDemo() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("ok");
  const posts = ["Hello", "World"];

  let statusContent;
  if (status === "loading") statusContent = <span>⏳ 로딩 중...</span>;
  else if (status === "error") statusContent = <span>❌ 에러</span>;
  else statusContent = <span>✅ 정상</span>;

  return (
    <section
      className="text-white"
      style={{ padding: 16, border: "1px solid #ddd", marginBottom: 16 }}
    >
      <h2>② 조건부 렌더링 3가지 패턴</h2>
      <div>
        <strong>패턴 1 (&amp;&amp;):</strong>{" "}
        {posts.length === 0 && <span>아직 글이 없습니다</span>}
        {posts.length > 0 && <span>글 {posts.length}개</span>}
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>패턴 2 (삼항):</strong>{" "}
        {isLoggedIn ? <span>👤 사용자메뉴</span> : <span>🔒 로그인 버튼</span>}{" "}
        <button onClick={() => setIsLoggedIn((v) => !v)}>토글</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>패턴 3 (변수):</strong> {statusContent}{" "}
        <button onClick={() => setStatus("loading")}>로딩</button>
        <button onClick={() => setStatus("error")}>에러</button>
        <button onClick={() => setStatus("ok")}>정상</button>
      </div>
    </section>
  );
}

// 데모 ③
function ListDemo() {
  const posts = [
    { id: 1, title: "Hello" },
    { id: 2, title: "World" },
    { id: 3, title: "React" },
  ];
  return (
    <section
      className="text-white"
      style={{ padding: 16, border: "1px solid #ddd", marginBottom: 16 }}
    >
      <h2>③ map + key 리스트 렌더링</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            #{post.id} — {post.title}
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 12, color: "#888" }}>
        💡 강사 시연: <code>key=&#123;post.id&#125; 지우고</code> 콘솔 확인
      </p>
    </section>
  );
}

export default function Ch02SandboxPage() {
  return (
    <main
      className="text-white"
      style={{
        padding: 24,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1>📦 Sandbox / 챕터 02</h1>
      <p>JSX 기초 + 조건부 렌더링 + 리스트 렌더링 라이브 데모</p>
      <ExpressionDemo />
      <ConditionalDemo />
      <ListDemo />
    </main>
  );
}
