// app/sandbox/ch17/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// === 데모 ① 활동량 → 색 강도 매핑 ===
function IntensityMapDemo() {
  const levels = [
    { label: "0", desc: "학습 없음", seconds: 0 },
    { label: "1", desc: "< 30분", seconds: 1500 },
    { label: "2", desc: "30분 ~ 1시간", seconds: 2700 },
    { label: "3", desc: "1 ~ 2시간", seconds: 5400 },
    { label: "4", desc: "2시간 이상", seconds: 10800 },
  ];

  const colors = [
    "#1a1d23",
    "rgba(0, 217, 255, 0.18)",
    "rgba(0, 217, 255, 0.38)",
    "rgba(0, 217, 255, 0.65)",
    "rgba(0, 217, 255, 0.95)",
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">활동량 → 5단계 색 강도</h3>

      <div className="space-y-2">
        {levels.map((lv, i) => (
          <div key={lv.label} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded" style={{ backgroundColor: colors[i] }} />
            <div className="flex-1 text-xs">
              <span className="font-mono text-cyan-400">Level {lv.label}</span>
              <span className="ml-2 text-zinc-400">{lv.desc}</span>
              <span className="ml-2 text-zinc-600">({lv.seconds}초)</span>
            </div>
          </div>
        ))}
      </div>

      <pre className="mt-4 rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`function intensityForSeconds(seconds: number): number {
  if (seconds === 0) return 0;
  if (seconds < 1800) return 1;
  if (seconds < 3600) return 2;
  if (seconds < 7200) return 3;
  return 4;
}`}
      </pre>
    </div>
  );
}

// === 데모 ② 잔디밭 SVG (8주 × 7일 미니 버전) ===
function MiniContributionDemo() {
  const CELL = 14;
  const GAP = 3;
  const WEEKS = 8;
  const DAYS = 7;

  // 가짜 활동 데이터 (랜덤이지만 hydration 안전을 위해 mounted 후만 그림)
  const COLORS = [
    "#1a1d23",
    "rgba(0, 217, 255, 0.18)",
    "rgba(0, 217, 255, 0.38)",
    "rgba(0, 217, 255, 0.65)",
    "rgba(0, 217, 255, 0.95)",
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">잔디밭 — SVG 격자 (8주 × 7일 미니 데모)</h3>

      <div className="mb-3 rounded-lg border border-zinc-800 bg-black/40 p-4">
        <svg width={WEEKS * (CELL + GAP)} height={DAYS * (CELL + GAP)}>
          {Array.from({ length: WEEKS * DAYS }).map((_, i) => {
            const week = Math.floor(i / DAYS);
            const day = i % DAYS;
            const intensity = (week + day) % 5;
            return (
              <rect
                key={i}
                x={week * (CELL + GAP)}
                y={day * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={COLORS[intensity]}
              />
            );
          })}
        </svg>
      </div>

      <pre className="rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`// 각 칸 = <rect>
<rect x={week * 17} y={day * 17}
      width={14} height={14} rx={2}
      fill={COLORS[intensity]} />`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 26주 × 7일 = 182칸. mounted 패턴으로 Hydration mismatch 방지.
      </p>
    </div>
  );
}

// === 데모 ③ Recharts 막대 차트 ===
function ChartDemo() {
  const data = [
    { day: "월", minutes: 45 },
    { day: "화", minutes: 60 },
    { day: "수", minutes: 30 },
    { day: "목", minutes: 90 },
    { day: "금", minutes: 75 },
    { day: "토", minutes: 0 },
    { day: "일", minutes: 25 },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-3 text-sm text-zinc-500">Recharts — 컴포넌트 합성으로 차트 구성</h3>

      <div className="mb-3 h-48 rounded-lg border border-zinc-800 bg-black/40 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ch17-bar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00D9FF" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#56565E"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#56565E"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111318",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#F5F5F7" }}
              formatter={(value) => [`${value}분`, "학습"]}
            />
            <Bar dataKey="minutes" fill="url(#ch17-bar)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <pre className="rounded bg-black/60 p-3 text-[10px] text-zinc-400">
        {`<BarChart data={data}>
  <CartesianGrid />
  <XAxis dataKey="day" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="minutes" />
</BarChart>`}
      </pre>

      <p className="mt-3 text-xs text-zinc-600">
        💡 각 컴포넌트가 차트의 한 요소. 필요한 것만 조합.
      </p>
    </div>
  );
}

export default function Ch17SandboxPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">📦 Sandbox / 챕터 17</h1>
        <p className="mb-8 text-zinc-400">잔디밭 SVG + Recharts</p>

        <h2 className="mb-3 text-lg font-semibold">① 활동량 → 색 강도 매핑</h2>
        <div className="mb-8">
          <IntensityMapDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">② 잔디밭 SVG ⭐</h2>
        <div className="mb-8">
          <MiniContributionDemo />
        </div>

        <h2 className="mb-3 text-lg font-semibold">③ Recharts</h2>
        <ChartDemo />
      </div>
    </main>
  );
}
