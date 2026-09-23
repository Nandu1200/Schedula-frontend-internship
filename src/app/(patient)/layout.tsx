"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const PATIENT_THEME_STORAGE_KEY = "schedulaPatientTheme";

type PatientTheme = "light" | "dark";

export default function PatientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<PatientTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme =
      localStorage.getItem(PATIENT_THEME_STORAGE_KEY);

    const nextTheme: PatientTheme =
      storedTheme === "dark" ? "dark" : "light";

    setTheme(nextTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    localStorage.setItem(
      PATIENT_THEME_STORAGE_KEY,
      theme
    );

    window.dispatchEvent(
      new Event("patient-theme-updated")
    );
  }, [mounted, theme]);

  const isDark = theme === "dark";

  return (
    <div
      className={
        isDark
          ? "patient-theme-root patient-theme-dark"
          : "patient-theme-root"
      }
      data-patient-theme={theme}
    >
      {children}

      {mounted && (
        <button
          type="button"
          onClick={() =>
            setTheme((currentTheme) =>
              currentTheme === "dark"
                ? "light"
                : "dark"
            )
          }
          aria-label={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          className="patient-theme-toggle fixed bottom-5 left-5 z-[9998] grid size-12 place-items-center rounded-full border border-slate-200 bg-white text-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      )}

      <style>{`
        .patient-theme-root {
          min-height: 100vh;
        }

        .patient-theme-dark {
          min-height: 100vh;
          background-color: #0f172a;
          color: #e2e8f0;
        }

        .patient-theme-dark [class~="bg-white"] {
          background-color: #111827 !important;
        }

        .patient-theme-dark [class~="bg-slate-50"] {
          background-color: #0f172a !important;
        }

        .patient-theme-dark [class~="bg-slate-100"] {
          background-color: #1e293b !important;
        }

        .patient-theme-dark [class~="bg-slate-50/50"] {
          background-color: #172033 !important;
        }

        .patient-theme-dark [class~="bg-slate-50/60"] {
          background-color: #172033 !important;
        }

        .patient-theme-dark [class~="bg-slate-50/70"] {
          background-color: #182234 !important;
        }

        .patient-theme-dark [class~="bg-[#f7faf9]"] {
          background-color: #0f172a !important;
        }

        .patient-theme-dark [class~="bg-emerald-50"] {
          background-color: #123c36 !important;
        }

        .patient-theme-dark [class~="bg-emerald-50/50"] {
          background-color: rgba(16, 185, 129, 0.08) !important;
        }

        .patient-theme-dark [class~="bg-emerald-50/70"] {
          background-color: rgba(16, 185, 129, 0.1) !important;
        }

        .patient-theme-dark [class~="bg-amber-50"] {
          background-color: #3b2a0f !important;
        }

        .patient-theme-dark [class~="bg-blue-50"] {
          background-color: #172554 !important;
        }

        .patient-theme-dark [class~="bg-red-50"] {
          background-color: #3f1d24 !important;
        }

        .patient-theme-dark [class~="text-slate-950"] {
          color: #f8fafc !important;
        }

        .patient-theme-dark [class~="text-slate-900"] {
          color: #f8fafc !important;
        }

        .patient-theme-dark [class~="text-slate-800"] {
          color: #e2e8f0 !important;
        }

        .patient-theme-dark [class~="text-slate-700"] {
          color: #cbd5e1 !important;
        }

        .patient-theme-dark [class~="text-slate-600"] {
          color: #94a3b8 !important;
        }

        .patient-theme-dark [class~="text-slate-500"] {
          color: #94a3b8 !important;
        }

        .patient-theme-dark [class~="text-slate-400"] {
          color: #64748b !important;
        }

        .patient-theme-dark [class~="border-slate-200"] {
          border-color: #334155 !important;
        }

        .patient-theme-dark [class~="border-slate-100"] {
          border-color: #334155 !important;
        }

        .patient-theme-dark [class~="border-emerald-100"] {
          border-color: #14532d !important;
        }

        .patient-theme-dark [class~="border-emerald-200"] {
          border-color: #166534 !important;
        }

        .patient-theme-dark [class~="divide-slate-100"] > :not([hidden]) ~ :not([hidden]) {
          border-color: #334155 !important;
        }

        .patient-theme-dark [class~="hover:bg-slate-50"]:hover {
          background-color: #1e293b !important;
        }

        .patient-theme-dark [class~="hover:bg-emerald-50"]:hover {
          background-color: #123c36 !important;
        }

        .patient-theme-dark input,
        .patient-theme-dark textarea,
        .patient-theme-dark select {
          background-color: #111827 !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }

        .patient-theme-dark input::placeholder,
        .patient-theme-dark textarea::placeholder {
          color: #64748b !important;
        }

        .patient-theme-dark .patient-theme-toggle {
          background-color: #111827 !important;
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
      `}</style>
    </div>
  );
}
