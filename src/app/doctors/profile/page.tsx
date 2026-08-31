"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { AvailabilitySlot } from "@/types/availability";

type DoctorProfile = {
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

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [formData, setFormData] = useState<DoctorProfile | null>(null);

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotMessage, setSlotMessage] = useState("");

  // Get today's date using local time.
  const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getTodayDate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedDoctor = localStorage.getItem("loggedInDoctor");

      if (storedDoctor) {
        const doctor = JSON.parse(storedDoctor) as DoctorProfile;

        setProfile(doctor);
        setFormData(doctor);

        const storedSlots = localStorage.getItem(
          `availabilitySlots-${doctor.id}`
        );

        if (storedSlots) {
          const doctorSlots = JSON.parse(
            storedSlots
          ) as AvailabilitySlot[];

          const validDoctorSlots = doctorSlots.filter(
            (slot) => slot.doctorId === doctor.id
          );

          setSlots(validDoctorSlots);
        }
      }

      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (
    field: keyof DoctorProfile,
    value: string
  ) => {
    if (!formData) {
      return;
    }

    setFormData({
      ...formData,
      [field]:
        field === "experienceYears" ||
        field === "consultationFee"
          ? Number(value)
          : value,
    });

    setMessage("");
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!formData) {
      return;
    }

    localStorage.setItem(
      "loggedInDoctor",
      JSON.stringify(formData)
    );

    localStorage.setItem(
      "registeredDoctor",
      JSON.stringify(formData)
    );

    setProfile(formData);
    setEditing(false);
    setMessage("Profile updated successfully.");
  };

  const handleAddSlot = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSlotMessage("");

    if (!profile) {
      return;
    }

    if (!slotDate || !startTime || !endTime) {
      setSlotMessage(
        "Please select date, start time and end time."
      );
      return;
    }

    // Past dates are not allowed.
    if (slotDate < today) {
      setSlotMessage(
        "Past dates are not allowed. Please select today or a future date."
      );
      return;
    }

    // End time must be after start time.
    if (startTime >= endTime) {
      setSlotMessage(
        "End time must be after start time."
      );
      return;
    }

    // Check duplicate slot.
    const duplicateSlot = slots.some(
      (slot) =>
        slot.date === slotDate &&
        slot.startTime === startTime &&
        slot.endTime === endTime
    );

    if (duplicateSlot) {
      setSlotMessage(
        "This availability slot already exists."
      );
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: `slot-${Date.now()}`,
      doctorId: profile.id,
      date: slotDate,
      startTime,
      endTime,
      status: "available",
    };

    const updatedSlots = [...slots, newSlot].sort(
      (first, second) => {
        const firstValue = `${first.date} ${first.startTime}`;
        const secondValue = `${second.date} ${second.startTime}`;

        return firstValue.localeCompare(secondValue);
      }
    );

    setSlots(updatedSlots);

    localStorage.setItem(
      `availabilitySlots-${profile.id}`,
      JSON.stringify(updatedSlots)
    );

    setSlotDate("");
    setStartTime("");
    setEndTime("");

    setSlotMessage(
      "Availability slot added successfully."
    );
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!profile) {
      return;
    }

    const updatedSlots = slots.filter(
      (slot) => slot.id !== slotId
    );

    setSlots(updatedSlots);

    localStorage.setItem(
      `availabilitySlots-${profile.id}`,
      JSON.stringify(updatedSlots)
    );

    setSlotMessage(
      "Availability slot removed."
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />

          <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white" />
        </div>
      </main>
    );
  }

  if (!profile || !formData) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Doctor login required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please login to access your profile.
          </p>

          <Link
            href="/doctors/login"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Doctor Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            href="/doctors/dashboard"
            className="flex items-center gap-3"
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

          <Link
            href="/doctors/dashboard"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        {/* Page Heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Doctor Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and update your professional information.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-emerald-50 px-6 py-7 sm:px-8">
            <div className="flex items-center gap-5">
              <div className="grid size-20 place-items-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
                {profile.name
                  .replace("Dr. ", "")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {profile.name}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {profile.specialty}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {profile.qualification} ·{" "}
                  {profile.experienceYears} years experience
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "name",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "email",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
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
                  value={formData.phone}
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "phone",
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Specialty */}
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "specialty",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Qualification */}
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "qualification",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Experience */}
              <div>
                <label
                  htmlFor="experienceYears"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Years of Experience
                </label>

                <input
                  id="experienceYears"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.experienceYears}
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "experienceYears",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Hospital */}
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "hospital",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Location */}
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "location",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Consultation Fee */}
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
                  disabled={!editing}
                  onChange={(event) =>
                    handleChange(
                      "consultationFee",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {message && (
              <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}

            {editing && (
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(profile);
                    setEditing(false);
                    setMessage("");
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Appointment Availability */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <p className="text-sm font-semibold text-emerald-600">
              Appointment Availability
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Create Available Slot
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add dates and times when patients can book an appointment.
            </p>
          </div>

          {/* Add Slot Form */}
          <form
            onSubmit={handleAddSlot}
            className="border-b border-slate-200 p-6 sm:p-8"
          >
            <div className="grid gap-5 md:grid-cols-3">
              {/* Date */}
              <div>
                <label
                  htmlFor="slotDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Date
                </label>

                <input
                  id="slotDate"
                  type="date"
                  min={today}
                  value={slotDate}
                  onChange={(event) => {
                    const selectedDate = event.target.value;

                    if (selectedDate < today) {
                      setSlotDate("");
                      setSlotMessage(
                        "Past dates are not allowed."
                      );
                      return;
                    }

                    setSlotDate(selectedDate);
                    setSlotMessage("");
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Today and future dates only.
                </p>
              </div>

              {/* Start Time */}
              <div>
                <label
                  htmlFor="startTime"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Start Time
                </label>

                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setSlotMessage("");
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* End Time */}
              <div>
                <label
                  htmlFor="endTime"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  End Time
                </label>

                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setSlotMessage("");
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {slotMessage && (
              <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {slotMessage}
              </div>
            )}

            <button
              type="submit"
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Add Availability Slot
            </button>
          </form>

          {/* Existing Slots */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Existing Slots
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your currently available appointment slots.
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {slots.length} slots
              </span>
            </div>

            {slots.length === 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  No availability slots yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first available slot above.
                </p>
              </div>
            )}

            {slots.length > 0 && (
              <div className="mt-6 space-y-3">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(
                          new Date(`${slot.date}T00:00:00`)
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                          slot.status === "available"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {slot.status}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSlot(slot.id)
                        }
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}