"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  name: string;
  email: string;
  phone: string;
  age: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    setSuccess("");
  };

  const validate = () => {
    const newErrors: Errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number.";
    }

    if (!formData.age) {
      newErrors.age = "Age is required.";
    } else {
      const age = Number(formData.age);

      if (age < 1 || age > 120) {
        newErrors.age = "Enter a valid age.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const patient = {
      id: `patient-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      age: Number(formData.age),
    };

    localStorage.setItem("registeredPatient", JSON.stringify(patient));
    localStorage.setItem("registeredPatientPassword", formData.password);

    setSuccess("Registration successful. Redirecting to login...");

    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
          {/* Left Side */}
          <div className="hidden bg-emerald-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-700">
                  S
                </div>

                <div>
                  <p className="text-lg font-bold">Schedula</p>
                  <p className="text-sm text-emerald-100">
                    Healthcare made simple
                  </p>
                </div>
              </Link>

              <div className="mt-20">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">
                  Get started
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight">
                  Your healthcare journey starts here.
                </h1>

                <p className="mt-5 max-w-md leading-7 text-emerald-50">
                  Create your account to discover doctors, check availability,
                  and book appointments easily.
                </p>
              </div>
            </div>

            <p className="text-sm text-emerald-100">
              Simple · Secure · Convenient
            </p>
          </div>

          {/* Form Side */}
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mb-8">
              <Link
                href="/"
                className="text-sm font-semibold text-emerald-700 lg:hidden"
              >
                ← Back to Schedula
              </Link>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Register as a patient to book your appointments.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  value={formData.name}
                  onChange={(event) =>
                    handleChange("name", event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>
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
                  value={formData.email}
                  onChange={(event) =>
                    handleChange("email", event.target.value)
                  }
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone + Age */}
              <div className="grid gap-5 sm:grid-cols-2">
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
                    value={formData.phone}
                    onChange={(event) =>
                      handleChange(
                        "phone",
                        event.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="10-digit number"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>

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
                    value={formData.age}
                    onChange={(event) =>
                      handleChange("age", event.target.value)
                    }
                    placeholder="Your age"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                  {errors.age && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.age}</p>
                  )}
                </div>
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
                  value={formData.password}
                  onChange={(event) =>
                    handleChange("password", event.target.value)
                  }
                  placeholder="At least 6 characters"
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
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    handleChange("confirmPassword", event.target.value)
                  }
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {success && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}