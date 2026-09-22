"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const GLOBAL_THEME_STORAGE_KEY = "schedulaTheme";
const PATIENT_THEME_STORAGE_KEY = "schedulaPatientTheme";

const ThemeContext = createContext<
  ThemeContextValue | undefined
>(undefined);

const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const globalTheme = localStorage.getItem(
    GLOBAL_THEME_STORAGE_KEY
  );

  const patientTheme = localStorage.getItem(
    PATIENT_THEME_STORAGE_KEY
  );

  // The global theme is the single source of truth.
  // Use the old patient theme key only as a fallback when
  // the global key does not exist yet.
  if (globalTheme === "dark" || globalTheme === "light") {
    return globalTheme;
  }

  if (patientTheme === "dark") {
    return "dark";
  }

  if (patientTheme === "light") {
    return "light";
  }

  return "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
};

const persistTheme = (theme: Theme) => {
  localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, theme);

  /*
   * Keep the old patient-dashboard preference in sync
   * so the dashboard and global theme never disagree.
   */
  localStorage.setItem(
    PATIENT_THEME_STORAGE_KEY,
    theme
  );

  applyTheme(theme);
};

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = readStoredTheme();

      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    syncTheme();
    setMounted(true);

    const handleThemeUpdated = () => {
      syncTheme();
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === GLOBAL_THEME_STORAGE_KEY ||
        event.key === PATIENT_THEME_STORAGE_KEY
      ) {
        syncTheme();
      }
    };

    /*
     * Browser back/forward can restore a page from the
     * back-forward cache without remounting React.
     * pageshow ensures the saved theme is reapplied.
     */
    const handlePageShow = () => {
      syncTheme();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncTheme();
      }
    };

    window.addEventListener(
      "schedula-theme-updated",
      handleThemeUpdated
    );
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "schedula-theme-updated",
        handleThemeUpdated
      );
      window.removeEventListener(
        "storage",
        handleStorage
      );
      window.removeEventListener(
        "pageshow",
        handlePageShow
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    persistTheme(theme);

    window.dispatchEvent(
      new Event("schedula-theme-updated")
    );
  }, [mounted, theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}

      {mounted && pathname !== "/dashboard" && (
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          className="schedula-theme-toggle fixed bottom-5 right-5 z-[9998] grid size-12 place-items-center rounded-full border border-slate-200 bg-white text-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      )}

      <style jsx global>{`
        html {
          transition:
            background-color 180ms ease,
            color 180ms ease;
        }

        body {
          transition:
            background-color 180ms ease,
            color 180ms ease;
        }

        html[data-theme="dark"] {
          color-scheme: dark;
          background: #020617 !important;
        }

        html[data-theme="dark"] body {
          background: #020617 !important;
          color: #e2e8f0 !important;
        }

        html[data-theme="dark"]
          [class*="bg-gradient-to-"] {
          background-image: none !important;
          background-color: #020617 !important;
        }

        html[data-theme="dark"] [class~="bg-white"],
        html[data-theme="dark"] [class*="bg-white/"] {
          background-color: #0f172a !important;
        }

        html[data-theme="dark"] [class~="bg-slate-50"],
        html[data-theme="dark"] [class*="bg-slate-50/"] {
          background-color: #111827 !important;
        }

        html[data-theme="dark"] [class~="bg-slate-100"] {
          background-color: #1e293b !important;
        }

        html[data-theme="dark"] [class*="bg-[#f7faf9]"] {
          background-color: #020617 !important;
          background-image: none !important;
        }

        html[data-theme="dark"] [class~="bg-gray-50"] {
          background-color: #020617 !important;
        }

        html[data-theme="dark"] [class~="bg-emerald-50"],
        html[data-theme="dark"] [class*="bg-emerald-50/"] {
          background-color: #123c36 !important;
        }

        html[data-theme="dark"] [class~="bg-emerald-100"] {
          background-color: #174036 !important;
        }

        html[data-theme="dark"] [class~="bg-amber-50"] {
          background-color: #3b2a0f !important;
        }

        html[data-theme="dark"] [class~="bg-blue-50"] {
          background-color: #172554 !important;
        }

        html[data-theme="dark"] [class~="bg-red-50"] {
          background-color: #3f1d24 !important;
        }

        html[data-theme="dark"] [class~="text-slate-950"],
        html[data-theme="dark"] [class~="text-slate-900"] {
          color: #f8fafc !important;
        }

        html[data-theme="dark"] [class~="text-slate-800"] {
          color: #e2e8f0 !important;
        }

        html[data-theme="dark"] [class~="text-slate-700"] {
          color: #cbd5e1 !important;
        }

        html[data-theme="dark"] [class~="text-slate-600"],
        html[data-theme="dark"] [class~="text-slate-500"] {
          color: #94a3b8 !important;
        }

        html[data-theme="dark"] [class~="text-slate-400"] {
          color: #64748b !important;
        }

        html[data-theme="dark"] [class~="text-gray-900"] {
          color: #f8fafc !important;
        }

        html[data-theme="dark"] [class~="text-gray-700"] {
          color: #cbd5e1 !important;
        }

        html[data-theme="dark"] [class~="text-gray-600"],
        html[data-theme="dark"] [class~="text-gray-500"] {
          color: #94a3b8 !important;
        }

        html[data-theme="dark"] [class~="border-slate-200"],
        html[data-theme="dark"] [class~="border-slate-100"] {
          border-color: #334155 !important;
        }

        html[data-theme="dark"]
          [class~="border-emerald-100"] {
          border-color: #14532d !important;
        }

        html[data-theme="dark"]
          [class~="border-emerald-200"] {
          border-color: #166534 !important;
        }

        html[data-theme="dark"] input,
        html[data-theme="dark"] textarea,
        html[data-theme="dark"] select {
          background-color: #0f172a !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }

        html[data-theme="dark"]
          input::placeholder,
        html[data-theme="dark"]
          textarea::placeholder {
          color: #64748b !important;
        }

        html[data-theme="dark"]
          [class~="hover:bg-slate-50"]:hover {
          background-color: #1e293b !important;
        }

        html[data-theme="dark"]
          [class~="hover:bg-emerald-50"]:hover {
          background-color: #123c36 !important;
        }

        html[data-theme="dark"]
          .schedula-theme-toggle {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border-color: #334155 !important;
        }
      `}</style>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider."
    );
  }

  return context;
}
