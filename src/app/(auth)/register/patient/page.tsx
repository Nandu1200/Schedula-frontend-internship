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

export default function PatientRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    password: "",
    confirmPassword: "",
    general: "",
  });

  const [loading, setLoading] = useState(false);

  const resetErrors = () => {
    setErrors({
      name: "",
      email: "",
      phone: "",
      age: "",
      password: "",
      confirmPassword: "",
      general: "",
    });
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const newErrors = {
      name: "",
      email: "",
      phone: "",
      age: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    if (!name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email =
        "Enter a valid email address.";
    }

    if (!phone.trim()) {
      newErrors.phone =
        "Phone number is required.";
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone =
        "Enter a valid 10-digit phone number.";
    }

    const numericAge = Number(age);

    if (!age.trim()) {
      newErrors.age = "Age is required.";
    } else if (
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 120
    ) {
      newErrors.age = "Enter a valid age.";
    }

    if (!password) {
      newErrors.password =
        "Password is required.";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      password !== confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (
      newErrors.name ||
      newErrors.email ||
      newErrors.phone ||
      newErrors.age ||
      newErrors.password ||
      newErrors.confirmPassword
    ) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const initials = name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join("");

    const patient: RegisteredPatient = {
      id: `patient-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: `+91 ${phone.trim()}`,
      age: numericAge,
      initials,
    };

    localStorage.setItem(
      "registeredPatient",
      JSON.stringify(patient)
    );

    localStorage.setItem(
      "registeredPatientPassword",
      password
    );

    localStorage.setItem(
      "loggedInPatient",
      JSON.stringify(patient)
    );

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2faf7] via-white to-[#e7f7f1] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">

          {/* Left Side */}
          <section className="relative overflow-hidden bg-emerald-700 px-8 py-10 text-white sm:px-12 lg:min-h-[700px] lg:px-14">

            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full border border-emerald-400/20" />

            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-emerald-400/20" />

            <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-emerald-800/40" />

            <div className="relative flex h-full flex-col">

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

              <div className="mt-20 lg:mt-24">

                <p className="text-sm font-bold uppercase tracking-wide text-emerald-50">
                  Get Started
                </p>

                <div className="mt-2 h-1 w-10 rounded-full bg-emerald-300" />

                <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                  Healthcare made simple for everyone.
                </h1>

                <p className="mt-6 max-w-md text-base leading-7 text-emerald-50 sm:text-lg">
                  Create your patient account and get
                  started with convenient healthcare
                  appointments.
                </p>

              </div>

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

            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              <span className="text-lg">←</span>
              Back to registration
            </Link>

            <div className="mt-8">

              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-2 text-base text-slate-500">
                Register as a patient to book
                appointments.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 space-y-5"
            >

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    resetErrors();
                  }}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>

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

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setPhone(value);
                    resetErrors();
                  }}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.phone && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label
                  htmlFor="age"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Age
                </label>

                <input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(event) => {
                    setAge(event.target.value);
                    resetErrors();
                  }}
                  placeholder="Enter your age"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.age && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.age}
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
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(
                      event.target.value
                    );
                    resetErrors();
                  }}
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create Patient Account"}
              </button>

            </form>

            <div className="mt-6 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?{" "}

                <Link
                  href="/login"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Login
                </Link>
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Want to register as a doctor?{" "}

                <Link
                  href="/register/doctor"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Register as Doctor
                </Link>
              </p>

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}