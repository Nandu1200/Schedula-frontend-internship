"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const ADMIN_EMAIL = "admin@schedula.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const ADMIN_PASSWORD_STORAGE_KEY = "registeredAdminPassword";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const storedPassword =
      localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) ??
      DEFAULT_ADMIN_PASSWORD;

    const isValidEmail =
      email.trim().toLowerCase() === ADMIN_EMAIL;

    const isValidPassword = password === storedPassword;

    if (isValidEmail && isValidPassword) {
      localStorage.setItem("admin_authenticated", "true");
      localStorage.setItem("admin_role", "super-admin");

      router.push("/admin/dashboard");
      return;
    }

    setError("Invalid admin email or password.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2faf7] via-white to-[#e7f7f1] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
          {/* Left Side */}
          <section className="relative hidden overflow-hidden bg-emerald-700 px-8 py-10 text-white sm:px-12 lg:flex lg:min-h-[650px] lg:px-14">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full border border-emerald-400/20" />
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-emerald-400/20" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-emerald-800/40" />

            <div className="relative flex h-full flex-col">
              <Link href="/" className="flex w-fit items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-700">
                  S
                </div>

                <div>
                  <p className="text-xl font-bold">Schedula</p>
                  <p className="text-sm text-emerald-50">
                    Admin Portal
                  </p>
                </div>
              </Link>

              <div className="mt-24">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-50">
                  Admin Access
                </p>

                <div className="mt-2 h-1 w-10 rounded-full bg-emerald-300" />

                <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                  Manage Schedula from one place.
                </h1>

                <p className="mt-6 max-w-md text-base leading-7 text-emerald-50 sm:text-lg">
                  Monitor doctors, patients, appointments and platform
                  activity through the Admin Portal.
                </p>
              </div>

              <div className="mt-auto hidden pt-12 xl:block">
                <div className="flex items-center gap-6 text-sm text-emerald-50">
                  <span>✓ Secure</span>
                  <span className="h-5 w-px bg-emerald-400/50" />
                  <span>◷ Centralized</span>
                  <span className="h-5 w-px bg-emerald-400/50" />
                  <span>● Organized</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Side */}
          <section className="px-7 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              <span className="text-lg">←</span>
              Back to Login
            </Link>

            <div className="mt-10">
              <div className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                A
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Admin Login
              </h2>

              <p className="mt-2 text-base text-slate-500">
                Sign in to access the Schedula Admin Portal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Admin Email
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@schedula.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Login as Admin
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}