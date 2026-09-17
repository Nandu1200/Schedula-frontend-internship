"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

const adminNotifications = [
  {
    id: "notification-1",
    title: "Doctor verification pending",
    message: "A doctor profile is waiting for verification.",
  },
  {
    id: "notification-2",
    title: "New appointment",
    message: "A new appointment has been booked on Schedula.",
  },
  {
    id: "notification-3",
    title: "Platform activity",
    message: "Recent activity is available in the Admin Portal.",
  },
];

export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] =
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
        {/* Notification */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setIsNotificationOpen(
                (current) => !current
              )
            }
            aria-label="Open notifications"
            aria-expanded={isNotificationOpen}
            className="relative grid size-11 place-items-center rounded-xl text-xl text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            🔔

            {/* Unread Badge */}
            <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {adminNotifications.length}
            </span>
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 top-14 z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Recent admin activity
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  {adminNotifications.length} New
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {adminNotifications.map(
                  (notification) => (
                    <div
                      key={notification.id}
                      className="border-b border-slate-100 px-4 py-4 last:border-b-0 hover:bg-slate-50"
                    >
                      <div className="flex gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm">
                          🔔
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {notification.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="border-t border-slate-100 px-4 py-3">
                <button
                  type="button"
                  className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

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