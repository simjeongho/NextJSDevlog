// components/ContributionGraph.tsx
type ContributionGraphProps = {
  // 키: "YYYY-MM-DD", 값: 그날 학습 시간(초)
  data: Map<string, number>;
  weeks?: number;
};

const CELL_SIZE = 12;
const CELL_GAP = 3;
const COLORS = [
  "#1a1d23", // 0
  "rgba(0, 217, 255, 0.18)", // 1
  "rgba(0, 217, 255, 0.38)", // 2
  "rgba(0, 217, 255, 0.65)", // 3
  "rgba(0, 217, 255, 0.95)", // 4
];

function intensityForSeconds(seconds: number): number {
  if (seconds === 0) return 0;
  if (seconds < 1800) return 1;
  if (seconds < 3600) return 2;
  if (seconds < 7200) return 3;
  return 4;
}

export default function ContributionGraph({ data, weeks = 26 }: ContributionGraphProps) {
  // 오늘부터 거꾸로 weeks*7 일 만들기
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 토요일까지 채우기 위해 약간 미래까지 포함
  const totalDays = weeks * 7;
  const cells: { date: Date; week: number; day: number; seconds: number }[] = [];

  // 오늘이 속한 주의 토요일을 찾기
  const dayOfWeek = today.getDay(); // 0 = 일
  const daysToSaturday = (6 - dayOfWeek + 7) % 7;
  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() + daysToSaturday);

  // 마지막 칸이 lastSaturday 가 되도록 거꾸로
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(lastSaturday);
    date.setDate(lastSaturday.getDate() - i);

    const week = Math.floor((totalDays - 1 - i) / 7);
    const day = date.getDay(); // 0 = 일

    const dateKey = date.toISOString().split("T")[0];
    const seconds = data.get(dateKey) ?? 0;

    cells.push({ date, week, day, seconds });
  }

  const svgWidth = weeks * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {cells.map((cell, idx) => {
          // 미래 날짜는 가장 흐린 색
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
          <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}
