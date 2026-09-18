type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  message = "We could not load the requested information.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
      <div className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-xl text-red-500">
          !
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-800">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}