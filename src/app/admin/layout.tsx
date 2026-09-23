"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

const subscribeToAdminAuth = (
  callback: () => void
) => {
  window.addEventListener("storage", callback);
  window.addEventListener(
    "admin-auth-changed",
    callback
  );

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(
      "admin-auth-changed",
      callback
    );
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

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

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

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login/admin");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Checking admin access...
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