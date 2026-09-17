type EmptyStateProps = {
  title?: string;
  message?: string;
};

export default function EmptyState({
  title = "No data available",
  message = "There is nothing to display right now.",
}: EmptyStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6">
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-xl text-slate-400">
          —
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-700">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}