// components/StudyTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import CircularProgress from "./CircularProgress";
import { saveStudySession } from "@/lib/actions";
import { useSession } from "next-auth/react";

const TARGET_SECONDS = 25 * 60; // 기본 목표 25분 (1500초)

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudyTimer() {
  const { data: session } = useSession();
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>("");
  // 인터벌 ID 보관 — useRef
  const intervalRef = useRef<number | null>(null);

  //시작 시간 보관
  const startedAtRef = useRef<Date | null>(null);

  // ⭐ 핵심: isRunning 이 바뀔 때마다 effect 실행
  useEffect(() => {
    if (!isRunning) return;

    //인터벌 시작 - 1초마다 seconds + 1
    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1); // 업데이터 함수로 이전 값 안전하게 사용
    }, 1000);

    //⭐ 클린업: 다음 effect 실행 전 또는 언마운트 시
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]); // ⭐ 의존성: isRunning

  const handleStart = () => {
    startedAtRef.current = new Date(); //⭐ 시작 시각 기록
    setIsRunning(true);
    setSavedMessage("");
  };

  const handleStop = async () => {
    setIsRunning(false);

    // 로그인 + 1분 이상이면 DB 저장
    if (session?.user && seconds >= 60 && startedAtRef.current) {
      const result = await saveStudySession({
        startedAt: startedAtRef.current.toISOString(),
        durationSeconds: seconds,
      });

      if (result.ok) {
        setSavedMessage(`✓ ${Math.round(seconds / 60)}분 학습 기록됨`);
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setSavedMessage("");
    startedAtRef.current = null; // 시작 시간 초기화
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

      {/* ⭐ 저장 결과 메시지  */}
      {savedMessage && <p className="text-center text-xs text-lime-400">{savedMessage}</p>}
      {!session?.user && seconds > 0 && (
        <p className="text-center text-xs text-zinc-500">로그인하면 학습 시간이 기록됩니다</p>
      )}
    </div>
  );
}
