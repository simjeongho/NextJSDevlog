// components/CircularProgress.tsx
type CircularProgressProps = {
  progress: number; // 0 ~ 1
  size?: number; // 픽셀
  strokeWidth?: number;
  children?: React.ReactNode; // 가운데 표시할 내용 (시간 텍스트 등)
};

export default function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 6,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#BEFC3D" />
          </linearGradient>
        </defs>
        {/* 배경 트랙 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* 진행 표시 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.5s ease",
            filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.4))",
          }}
        />
      </svg>
      {/* 가운데 children */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
