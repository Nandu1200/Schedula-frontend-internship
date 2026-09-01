"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RegisteredPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  initials: string;
};

export default function PatientLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);

  const resetErrors = () => {
    setErrors({
      email: "",
      password: "",
      general: "",
    });
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email =
        "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password =
        "Password is required.";
    }

    if (
      newErrors.email ||
      newErrors.password
    ) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const storedPatient =
      localStorage.getItem(
        "registeredPatient"
      );

    const storedPassword =
      localStorage.getItem(
        "registeredPatientPassword"
      );

    if (!storedPatient) {
      setErrors({
        email: "",
        password: "",
        general:
          "No registered patient account found. Please register first.",
      });

      setLoading(false);
      return;
    }

    try {
      const patient =
        JSON.parse(
          storedPatient
        ) as RegisteredPatient;

      const emailMatches =
        patient.email
          .trim()
          .toLowerCase() ===
        email.trim().toLowerCase();

      const passwordMatches =
        storedPassword === password;

      if (
        !emailMatches ||
        !passwordMatches
      ) {
        setErrors({
          email: "",
          password: "",
          general:
            "Invalid email or password.",
        });

        setLoading(false);
        return;
      }

      localStorage.setItem(
        "loggedInPatient",
        JSON.stringify(patient)
      );

      router.push("/dashboard");
    } catch {
      setErrors({
        email: "",
        password: "",
        general:
          "Unable to login. Please try again.",
      });

      setLoading(false);
    }
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

            <div className="relative flex h-full w-full flex-col">

              {/* Logo */}
              <Link
                href="/"
                className="flex w-fit items-center gap-3"
              >
                <div className="grid size-12 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-700">
                  S
                </div>

                <div>
                  <p className="text-xl font-bold">
                    Schedula
                  </p>

                  <p className="text-sm text-emerald-50">
                    Healthcare made simple
                  </p>
                </div>
              </Link>

              {/* Main Message */}
              <div className="mt-20 lg:mt-24">

                <p className="text-sm font-bold uppercase tracking-wide text-emerald-50">
                  Patient Portal
                </p>

                <div className="mt-2 h-1 w-10 rounded-full bg-emerald-300" />

                <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                  Your healthcare, all in one place.
                </h1>

                <p className="mt-6 max-w-md text-base leading-7 text-emerald-50 sm:text-lg">
                  Login to find doctors, book appointments
                  and manage your healthcare journey.
                </p>

              </div>

              {/* Features */}
              <div className="mt-auto hidden pt-12 sm:block">

                <div className="flex items-center gap-6 text-sm text-emerald-50">

                  <span>✓ Simple</span>

                  <span className="h-5 w-px bg-emerald-400/50" />

                  <span>♙ Secure</span>

                  <span className="h-5 w-px bg-emerald-400/50" />

                  <span>◷ Convenient</span>

                </div>

              </div>

            </div>
          </section>

          {/* Right Side */}
          <section className="px-7 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">

            {/* Back */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              <span className="text-lg">←</span>
              Back to Login
            </Link>

            {/* Heading */}
            <div className="mt-10">

              <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
                Patient Login
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-2 text-base text-slate-500">
                Login to access your patient account.
              </p>

            </div>

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 space-y-5"
            >

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetErrors();
                  }}
                  placeholder="patient@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email}
                  </p>
                )}

              </div>

              {/* Password */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    resetErrors();
                  }}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}

              </div>

              {/* General Error */}
              {errors.general && (
                <div
                  className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {errors.general}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : "Patient Login"}
              </button>

            </form>

            {/* Register */}
            <div className="mt-7 text-center">

              <p className="text-sm text-slate-500">
                Don&apos;t have a patient account?{" "}

                <Link
                  href="/register/patient"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Register as Patient
                </Link>
              </p>

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}