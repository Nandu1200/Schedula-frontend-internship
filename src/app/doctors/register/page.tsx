"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type DoctorFormData = {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualification: string;
  experience: string;
  hospital: string;
  location: string;
  consultationFee: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof DoctorFormData, string>>;

export default function DoctorRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<DoctorFormData>({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    qualification: "",
    experience: "",
    hospital: "",
    location: "",
    consultationFee: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState("");

  const handleChange = (
    field: keyof DoctorFormData,
    value: string
  ) => {
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

    if (!formData.specialty.trim()) {
      newErrors.specialty = "Specialty is required.";
    }

    if (!formData.qualification.trim()) {
      newErrors.qualification = "Qualification is required.";
    }

    if (!formData.experience) {
      newErrors.experience = "Experience is required.";
    } else if (
      Number(formData.experience) < 0 ||
      Number(formData.experience) > 60
    ) {
      newErrors.experience = "Enter valid years of experience.";
    }

    if (!formData.hospital.trim()) {
      newErrors.hospital = "Hospital/clinic name is required.";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required.";
    }

    if (!formData.consultationFee) {
      newErrors.consultationFee =
        "Consultation fee is required.";
    } else if (Number(formData.consultationFee) <= 0) {
      newErrors.consultationFee =
        "Enter a valid consultation fee.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const doctor = {
      id: `doctor-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      specialty: formData.specialty.trim(),
      qualification: formData.qualification.trim(),
      experienceYears: Number(formData.experience),
      hospital: formData.hospital.trim(),
      location: formData.location.trim(),
      consultationFee: Number(formData.consultationFee),
    };

    localStorage.setItem(
      "registeredDoctor",
      JSON.stringify(doctor)
    );

    localStorage.setItem(
      "registeredDoctorPassword",
      formData.password
    );

    setSuccess(
      "Doctor registration successful. Redirecting to login..."
    );

    setTimeout(() => {
      router.push("/doctors/login");
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-6 sm:px-10">
            <Link
              href="/"
              className="flex w-fit items-center gap-3"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
                S
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  Schedula
                </p>

                <p className="text-xs text-slate-500">
                  Doctor Portal
                </p>
              </div>
            </Link>
          </div>

          <div className="p-6 sm:p-10">

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Doctor Registration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Create your doctor account
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Enter your personal, professional, contact and
                account information to join Schedula.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-8"
            >

              {/* Personal Information */}
              <section>
                <h2 className="text-lg font-bold text-slate-900">
                  Personal Information
                </h2>

                <div className="mt-4 grid gap-5 md:grid-cols-2">

                  <div className="md:col-span-2">
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
                        handleChange(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Dr. John Smith"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.name && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.name}
                      </p>
                    )}
                  </div>

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
                        handleChange(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="doctor@example.com"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

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
                          event.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      placeholder="10-digit number"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.phone && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Professional Information */}
              <section>
                <h2 className="text-lg font-bold text-slate-900">
                  Professional Information
                </h2>

                <div className="mt-4 grid gap-5 md:grid-cols-2">

                  <div>
                    <label
                      htmlFor="specialty"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Specialty
                    </label>

                    <input
                      id="specialty"
                      type="text"
                      value={formData.specialty}
                      onChange={(event) =>
                        handleChange(
                          "specialty",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Cardiology"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.specialty && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.specialty}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="qualification"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Qualification
                    </label>

                    <input
                      id="qualification"
                      type="text"
                      value={formData.qualification}
                      onChange={(event) =>
                        handleChange(
                          "qualification",
                          event.target.value
                        )
                      }
                      placeholder="e.g. MBBS, MD"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.qualification && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.qualification}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="experience"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Years of Experience
                    </label>

                    <input
                      id="experience"
                      type="number"
                      min="0"
                      max="60"
                      value={formData.experience}
                      onChange={(event) =>
                        handleChange(
                          "experience",
                          event.target.value
                        )
                      }
                      placeholder="e.g. 10"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.experience && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.experience}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="consultationFee"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Consultation Fee (₹)
                    </label>

                    <input
                      id="consultationFee"
                      type="number"
                      min="1"
                      value={formData.consultationFee}
                      onChange={(event) =>
                        handleChange(
                          "consultationFee",
                          event.target.value
                        )
                      }
                      placeholder="e.g. 499"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.consultationFee && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.consultationFee}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Practice Information */}
              <section>
                <h2 className="text-lg font-bold text-slate-900">
                  Practice Information
                </h2>

                <div className="mt-4 grid gap-5 md:grid-cols-2">

                  <div>
                    <label
                      htmlFor="hospital"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Hospital / Clinic
                    </label>

                    <input
                      id="hospital"
                      type="text"
                      value={formData.hospital}
                      onChange={(event) =>
                        handleChange(
                          "hospital",
                          event.target.value
                        )
                      }
                      placeholder="Hospital or clinic name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.hospital && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.hospital}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Location
                    </label>

                    <input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(event) =>
                        handleChange(
                          "location",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.location && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Account Security */}
              <section>
                <h2 className="text-lg font-bold text-slate-900">
                  Account Security
                </h2>

                <div className="mt-4 grid gap-5 md:grid-cols-2">

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
                        handleChange(
                          "password",
                          event.target.value
                        )
                      }
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.password && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.password}
                      </p>
                    )}
                  </div>

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
                        handleChange(
                          "confirmPassword",
                          event.target.value
                        )
                      }
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    {errors.confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Success */}
              {success && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">
                  Already registered?{" "}
                  <Link
                    href="/doctors/login"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Doctor Login
                  </Link>
                </p>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Create Doctor Account
                </button>

              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}