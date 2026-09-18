"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    router.replace("/login/admin");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="grid size-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
        >
          ☰
        </button>

        <div>
          <p className="text-sm font-semibold text-slate-500">
            Welcome back
          </p>

          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Admin
          </h2>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Admin Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setIsProfileOpen((current) => !current)
            }
            aria-expanded={isProfileOpen}
            aria-label="Open admin profile menu"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
          >
            <div className="grid size-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">
              A
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-slate-900">
                Admin
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <span className="hidden text-xs text-slate-400 sm:block">
              ▼
            </span>
          </button>

          {/* Profile Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-sm font-bold text-slate-900">
                  Admin
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  admin@schedula.com
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <span>↪</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}