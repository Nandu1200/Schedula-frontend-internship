type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"
        />

        <p className="text-sm font-medium text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}