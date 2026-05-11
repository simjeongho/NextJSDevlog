// components/EmptyState.tsx
type EmptyStateProps = {
  icon?: string;
  message?: string;
  hint?: string;
};

export default function EmptyState({
  icon = "📭",
  message = "아직 글이 없습니다",
  hint = "첫 번째 글을 작성해보세요",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-6xl opacity-50">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-300">{message}</h3>
      <p className="text-sm text-zinc-500">{hint}</p>
    </div>
  );
}
