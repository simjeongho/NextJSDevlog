// components/StudyTimer.tsx
"use client";

import { useRef, useState } from "react";
import CircularProgress from "./CircularProgress";

const TARGET_SECONDS = 25 * 60; // 기본 목표 25분 (1500초)

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudyTimer() {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 인터벌 ID 보관 — useRef
  const intervalRef = useRef<number | null>(null);

  const handleStart = () => {
    setIsRunning(true);
    // setInterval 시작은 다음 step 에서 useEffect 로
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const progress = seconds / TARGET_SECONDS;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
      <div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">
        Study Timer
      </div>
      <div className="mb-6 text-sm text-zinc-400">목표: {TARGET_SECONDS / 60}분 집중</div>

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

      <div className="flex justify-center gap-2">
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
    </div>
  );
}
