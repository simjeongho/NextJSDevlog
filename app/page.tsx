// app/page.tsx
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            최근 글
          </h1>
          <p className="text-zinc-400">
            개발자들의 학습 기록을 확인하세요
          </p>
        </div>

        <div className="grid gap-4">
          <PostCard />
          <PostCard />
          <PostCard />
        </div>
      </main>
    </div>
  );
}