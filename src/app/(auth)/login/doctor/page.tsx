"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type RegisteredDoctor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  hospital: string;
  location: string;
  consultationFee: number;
};

export default function DoctorLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required.";
    }

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    // Get registered doctor
    const storedDoctor = localStorage.getItem("registeredDoctor");

    if (!storedDoctor) {
      setErrors({
        email: "",
        password: "",
        general:
          "No registered doctor account found. Please register first.",
      });

      setLoading(false);
      return;
    }

    const doctor: RegisteredDoctor = JSON.parse(storedDoctor);

    const storedPassword = localStorage.getItem(
      "registeredDoctorPassword"
    );

    // Check login credentials
    if (
      doctor.email.toLowerCase() !== email.trim().toLowerCase() ||
      storedPassword !== password
    ) {
      setErrors({
        email: "",
        password: "",
        general: "Invalid email or password.",
      });

      setLoading(false);
      return;
    }

    // Save logged-in doctor
    localStorage.setItem(
      "loggedInDoctor",
      JSON.stringify({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialty: doctor.specialty,
        qualification: doctor.qualification,
        experienceYears: doctor.experienceYears,
        hospital: doctor.hospital,
        location: doctor.location,
        consultationFee: doctor.consultationFee,
      })
    );

    // Doctor goes to dashboard after login
    router.push("/doctors/dashboard");
  };

  const resetErrors = () => {
    setErrors({
      email: "",
      password: "",
      general: "",
    });
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">

          {/* Left Side */}
          <div className="hidden bg-emerald-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-700">
                  S
                </div>

                <div>
                  <p className="text-lg font-bold">
                    Schedula
                  </p>

                  <p className="text-sm text-emerald-100">
                    Doctor Portal
                  </p>
                </div>
              </Link>

              <div className="mt-20">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">
                  Doctor Portal
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight">
                  Manage your appointments with ease.
                </h1>

                <p className="mt-5 max-w-md leading-7 text-emerald-50">
                  Login to manage your profile, availability,
                  appointments, and patient visits.
                </p>
              </div>
            </div>

            <p className="text-sm text-emerald-100">
              Simple · Professional · Connected
            </p>
          </div>

          {/* Login Form */}
          <div className="p-6 sm:p-10 lg:p-12">

            {/* Mobile Back Link */}
            <div className="mb-8">
              <Link
                href="/"
                className="text-sm font-semibold text-emerald-700 lg:hidden"
              >
                ← Back to Schedula
              </Link>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Doctor Login
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Login to access your doctor dashboard.
              </p>
            </div>

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
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
                  placeholder="doctor@example.com"
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

              {/* Error */}
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
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Doctor Login"}
              </button>
            </form>

            {/* Doctor Register */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have a doctor account?{" "}
                <Link
                  href="/register/doctor"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Register as Doctor
                </Link>
              </p>

              {/* Patient Login */}
              <p className="mt-4 text-sm text-slate-500">
                Are you a patient?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Login here →
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}