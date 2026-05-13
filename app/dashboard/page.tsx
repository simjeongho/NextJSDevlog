// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDailyStudyMap, getStudyStats, getWeeklyData } from "@/lib/study-logs";
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
          <p className="mt-2 text-zinc-400">지금까지의 학습 기록과 추이를 한눈에 확인해보세요.</p>
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
