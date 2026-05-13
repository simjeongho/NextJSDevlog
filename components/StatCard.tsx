// components/StatCard.tsx
type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
};

export default function StatCard({ label, value, unit, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-1 text-xs font-mono uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-4xl font-semibold tabular-nums text-white">{value}</span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
