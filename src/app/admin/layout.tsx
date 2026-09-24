"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { hasModuleAccess } from "@/lib/admin/permissions";
import type { AdminUserRole } from "@/types/admin";

const subscribeToAdminAuth = (
  callback: () => void
) => {
  window.addEventListener("storage", callback);
  window.addEventListener("admin-auth-changed", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("admin-auth-changed", callback);
  };
};

const getAdminAuthSnapshot = () => {
  return (
    localStorage.getItem("admin_authenticated") ===
    "true"
  );
};

const getServerAdminAuthSnapshot = () => {
  return false;
};

const subscribeToHydration = () => {
  return () => {};
};

const getHydrationSnapshot = () => {
  return true;
};

const getServerHydrationSnapshot = () => {
  return false;
};

const getAdminRole = (): AdminUserRole => {
  const storedRole = localStorage.getItem("admin_role");

  if (
    storedRole === "super-admin" ||
    storedRole === "admin" ||
    storedRole === "support"
  ) {
    return storedRole;
  }

  return "super-admin";
};

const getModuleFromPathname = (
  pathname: string
): string | null => {
  const routeModules: Record<string, string> = {
    "/admin/dashboard": "dashboard",
    "/admin/doctors": "doctors",
    "/admin/doctor-verification": "doctor-verification",
    "/admin/patients": "patients",
    "/admin/appointments": "appointments",
    "/admin/payments": "payments",
    "/admin/reviews": "reviews",
    "/admin/notifications": "notifications",
    "/admin/reports": "reports",
    "/admin/audit-logs": "audit-logs",
    "/admin/users": "admin-users",
    "/admin/settings": "settings",
  };

  const matchedRoute = Object.keys(routeModules).find(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  return matchedRoute
    ? routeModules[matchedRoute]
    : null;
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  );

  const isAuthenticated = useSyncExternalStore(
    subscribeToAdminAuth,
    getAdminAuthSnapshot,
    getServerAdminAuthSnapshot
  );

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [adminRole, setAdminRole] =
    useState<AdminUserRole | null>(null);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    setAdminRole(getAdminRole());
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login/admin");
    }
  }, [
    isHydrated,
    isAuthenticated,
    router,
  ]);

  useEffect(() => {
    if (
      !isHydrated ||
      !isAuthenticated ||
      !adminRole
    ) {
      return;
    }

    const module = getModuleFromPathname(pathname);

    if (!module) {
      return;
    }

    const hasAccess = hasModuleAccess(
      adminRole,
      module
    );

    if (!hasAccess) {
      router.replace("/admin/dashboard");
    }
  }, [
    isHydrated,
    isAuthenticated,
    adminRole,
    pathname,
    router,
  ]);

  if (
    !isHydrated ||
    !isAuthenticated ||
    !adminRole
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Checking admin access...
        </p>
      </main>
    );
  }

  const currentModule =
    getModuleFromPathname(pathname);

  if (
    currentModule &&
    !hasModuleAccess(adminRole, currentModule)
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Checking permission...
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar
        mobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}