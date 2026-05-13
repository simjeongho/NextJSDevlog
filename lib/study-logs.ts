// lib/study-logs.ts
import { eq, gte, desc } from "drizzle-orm";
import { db } from "./db";
import { studyLogs } from "./db/schema";

/**
 * 로컬 시각 기준 YYYY-MM-DD 키 생성.
 *
 * toISOString().split("T")[0] 는 UTC 변환이라
 * 한국 시간 자정 근처에서 키가 어긋남.
 * Date 객체의 getFullYear/Month/Date 는 로컬 시각(KST) 기준이라 안전.
 */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

// ⭐ 사용자의 최근 N일 로그 조회
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
  days: number = 182,
): Promise<Map<string, number>> {
  const logs = await getRecentStudyLogs(userId, days);
  const map = new Map<string, number>();

  for (const log of logs) {
    const dateKey = toLocalDateKey(log.startedAt);
    map.set(dateKey, (map.get(dateKey) ?? 0) + log.durationSeconds);
  }

  return map;
}

// ⭐ 통계: 누적 시간, streak, 이번 주
export async function getStudyStats(userId: string) {
  const allLogs = await db.select().from(studyLogs).where(eq(studyLogs.userId, userId));

  const totalSeconds = allLogs.reduce((sum, log) => sum + log.durationSeconds, 0);

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
    const key = toLocalDateKey(log.startedAt);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + log.durationSeconds);
  }

  let streak = 0;
  const checkDate = new Date();
  while (true) {
    const key = toLocalDateKey(checkDate);
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
    const key = toLocalDateKey(date);
    const dayLabel = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    const seconds = dailyMap.get(key) ?? 0;
    result.push({
      day: dayLabel,
      minutes: Math.round(seconds / 60),
    });
  }

  return result;
}
