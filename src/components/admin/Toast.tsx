"use client";

import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

type ToastProps = {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  action?: ReactNode;
};

const toastStyles: Record<
  ToastType,
  {
    container: string;
    icon: string;
    iconStyle: string;
  }
> = {
  success: {
    container: "border-emerald-100 bg-emerald-50",
    icon: "✓",
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
  error: {
    container: "border-red-100 bg-red-50",
    icon: "!",
    iconStyle: "bg-red-100 text-red-700",
  },
  info: {
    container: "border-blue-100 bg-blue-50",
    icon: "i",
    iconStyle: "bg-blue-100 text-blue-700",
  },
  warning: {
    container: "border-amber-100 bg-amber-50",
    icon: "!",
    iconStyle: "bg-amber-100 text-amber-700",
  },
};

export default function Toast({
  message,
  type = "success",
  onClose,
  action,
}: ToastProps) {
  const style = toastStyles[type];

  return (
    <div
      role="status"
      className={`flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg shadow-slate-900/10 ${style.container}`}
    >
      <div
        className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${style.iconStyle}`}
      >
        {style.icon}
      </div>

      <p className="flex-1 pt-1 text-sm font-semibold text-slate-700">
        {message}
      </p>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
        >
          ✕
        </button>
      )}
    </div>
  );
}