"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "▦",
    implemented: true,
  },
  {
    label: "Doctors",
    href: "/admin/doctors",
    icon: "👨‍⚕️",
    implemented: true,
  },
  {
    label: "Doctor Verification",
    href: "/admin/doctor-verification",
    icon: "✓",
    implemented: true,
  },
  {
    label: "Patients",
    href: "/admin/patients",
    icon: "♟",
    implemented: true,
  },
  {
    label: "Appointments",
    href: "/admin/appointments",
    icon: "▣",
    implemented: true,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: "₹",
    implemented: true,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: "★",
    implemented: true,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: "🔔",
    implemented: true,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: "▥",
    implemented: true,
  },
  {
    label: "Admin Users",
    href: "/admin/users",
    icon: "♟",
    implemented: true,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: "◉",
    implemented: true,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "⚙",
    implemented: true,
  },
];

export default function AdminSidebar({
  mobileOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Schedula
            </h1>

            <p className="text-sm font-medium text-emerald-600">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wide text-slate-400">
          Main Menu
        </p>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            if (item.implemented) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex w-5 items-center justify-center text-base ${
                        isActive
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="text-sm font-semibold">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-slate-400"
              >
                <div className="flex items-center gap-4">
                  <span className="flex w-5 items-center justify-center text-base">
                    {item.icon}
                  </span>

                  <span className="text-sm font-semibold">
                    {item.label}
                  </span>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                  Soon
                </span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
            N
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              Admin
            </p>

            <p className="truncate text-xs text-slate-400">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-80 shrink-0 border-r border-slate-200 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40"
          />

          {/* Sidebar */}
          <aside className="relative h-full w-80 max-w-[85vw] border-r border-slate-200 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}