// components/WeeklyChart.tsx
"use client"; // ⭐ Recharts 는 클라이언트 라이브러리

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
            formatter={(value) => [`${Number(value)}분`, "학습 시간"]}
          />
          <Bar dataKey="minutes" fill="url(#bar-gradient)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
