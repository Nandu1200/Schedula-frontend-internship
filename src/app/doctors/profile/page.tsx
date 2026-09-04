"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

function formatDate(date: string) {
  if (!date) return "Select a date";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(value: string) {
  if (!value) return "--:--";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function parseTypedTime(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized) return "";

  const match = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const period = match[3];

  if (minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;
  } else {
    if (hours > 23) return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToInput(value: string) {
  if (!value) return "";
  return formatTime(value);
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
  const [startTimeText, setStartTimeText] = useState("");
  const [endTimeText, setEndTimeText] = useState("");
  const [slotMessage, setSlotMessage] = useState("");
  const [slotMessageType, setSlotMessageType] = useState<"success" | "error">("success");

  const startPickerRef = useRef<HTMLInputElement>(null);
  const endPickerRef = useRef<HTMLInputElement>(null);

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
        try {
          const doctor = JSON.parse(storedDoctor) as DoctorProfile;
          setProfile(doctor);
          setFormData(doctor);

          const storedSlots = localStorage.getItem(`availabilitySlots-${doctor.id}`);

          if (storedSlots) {
            const doctorSlots = JSON.parse(storedSlots) as AvailabilitySlot[];
            setSlots(doctorSlots.filter((slot) => slot.doctorId === doctor.id));
          } else {
            setSlots([]);
          }
        } catch {
          setProfile(null);
          setFormData(null);
          setSlots([]);
        }
      }

      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (field: keyof DoctorProfile, value: string) => {
    if (!formData) return;

    setFormData({
      ...formData,
      [field]:
        field === "experienceYears" || field === "consultationFee"
          ? Number(value)
          : value,
    });
    setMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData) return;

    localStorage.setItem("loggedInDoctor", JSON.stringify(formData));
    localStorage.setItem("registeredDoctor", JSON.stringify(formData));
    setProfile(formData);
    setEditing(false);
    setMessage("Profile updated successfully.");
  };

  const setTimeFromPicker = (
    value: string,
    type: "start" | "end"
  ) => {
    if (type === "start") {
      setStartTime(value);
      setStartTimeText(timeToInput(value));
    } else {
      setEndTime(value);
      setEndTimeText(timeToInput(value));
    }
    setSlotMessage("");
  };

  const handleTimeTextChange = (
    value: string,
    type: "start" | "end"
  ) => {
    if (type === "start") {
      setStartTimeText(value);
    } else {
      setEndTimeText(value);
    }

    const parsed = parseTypedTime(value);

    if (parsed) {
      if (type === "start") setStartTime(parsed);
      else setEndTime(parsed);
      setSlotMessage("");
    }
  };

  const normalizeTimeField = (type: "start" | "end") => {
    const text = type === "start" ? startTimeText : endTimeText;
    const parsed = parseTypedTime(text);

    if (parsed) {
      if (type === "start") {
        setStartTime(parsed);
        setStartTimeText(timeToInput(parsed));
      } else {
        setEndTime(parsed);
        setEndTimeText(timeToInput(parsed));
      }
      return true;
    }

    if (!text.trim()) {
      if (type === "start") setStartTime("");
      else setEndTime("");
      return true;
    }

    return false;
  };

  const handleAddSlot = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSlotMessage("");

    if (!profile) return;

    const startValid = normalizeTimeField("start");
    const endValid = normalizeTimeField("end");

    if (!slotDate || !startTime || !endTime || !startValid || !endValid) {
      setSlotMessageType("error");
      setSlotMessage("Please enter a valid date, start time and end time.");
      return;
    }

    if (slotDate < today) {
      setSlotMessageType("error");
      setSlotMessage("Past dates are not allowed. Please select today or a future date.");
      return;
    }

    if (startTime >= endTime) {
      setSlotMessageType("error");
      setSlotMessage("End time must be after start time.");
      return;
    }

    const duplicateSlot = slots.some(
      (slot) =>
        slot.date === slotDate &&
        slot.startTime === startTime &&
        slot.endTime === endTime
    );

    if (duplicateSlot) {
      setSlotMessageType("error");
      setSlotMessage("This availability slot already exists.");
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

    const updatedSlots = [...slots, newSlot].sort((first, second) => {
      const firstValue = `${first.date} ${first.startTime}`;
      const secondValue = `${second.date} ${second.startTime}`;
      return firstValue.localeCompare(secondValue);
    });

    setSlots(updatedSlots);
    localStorage.setItem(`availabilitySlots-${profile.id}`, JSON.stringify(updatedSlots));

    setSlotMessageType("success");
    setSlotMessage("Availability slot added successfully.");
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!profile) return;

    const slot = slots.find((item) => item.id === slotId);

    if (!slot) {
      setSlotMessageType("error");
      setSlotMessage("Availability slot not found.");
      return;
    }

    if (slot.status === "booked") {
      setSlotMessageType("error");
      setSlotMessage("Booked slots cannot be deleted. Cancel the appointment first.");
      return;
    }

    const updatedSlots = slots.filter((item) => item.id !== slotId);
    setSlots(updatedSlots);
    localStorage.setItem(`availabilitySlots-${profile.id}`, JSON.stringify(updatedSlots));
    setSlotMessageType("success");
    setSlotMessage("Availability slot removed.");
  };

  const handleDeleteDateSlots = (date: string) => {
    if (!profile) return;

    const dateSlots = slots.filter((slot) => slot.date === date);
    if (dateSlots.some((slot) => slot.status === "booked")) {
      setSlotMessageType("error");
      setSlotMessage("Booked slots cannot be removed. Cancel those appointments first.");
      return;
    }

    const updatedSlots = slots.filter((slot) => slot.date !== date);
    setSlots(updatedSlots);
    localStorage.setItem(`availabilitySlots-${profile.id}`, JSON.stringify(updatedSlots));
    setSlotMessageType("success");
    setSlotMessage(`All slots for ${formatDate(date)} were removed.`);
  };

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, AvailabilitySlot[]>();

    slots.forEach((slot) => {
      const existing = groups.get(slot.date) ?? [];
      groups.set(slot.date, [...existing, slot]);
    });

    return Array.from(groups.entries()).sort(([first], [second]) =>
      first.localeCompare(second)
    );
  }, [slots]);

  const activeDates = groupedSlots.length;
  const availableCount = slots.filter((slot) => slot.status === "available").length;
  const bookedCount = slots.filter((slot) => slot.status === "booked").length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2faf7] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-14 rounded-2xl bg-white/80" />
          <div className="mt-8 h-36 rounded-3xl bg-white/80" />
          <div className="mt-6 h-[500px] rounded-3xl bg-white/80" />
        </div>
      </main>
    );
  }

  if (!profile || !formData) {
    return (
      <main className="min-h-screen bg-[#f2faf7] px-4 py-8 sm:px-6">
        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">S</div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">Doctor login required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Please login to access your profile.</p>
          <Link
            href="/login/doctor"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Doctor Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2faf7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-[#f2faf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/doctors/dashboard" className="group flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-lg font-extrabold text-white shadow-sm transition group-hover:scale-105">S</div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">Schedula</p>
              <p className="text-xs font-medium text-emerald-700">Doctor Portal</p>
            </div>
          </Link>
          <Link
            href="/doctors/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3.5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
          >
            <span>←</span> Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/80 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.08)] sm:p-8">
          <div className="absolute -right-20 -top-20 size-56 rounded-full bg-emerald-100/50 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-600/15 sm:size-20 sm:text-2xl">
                {getInitials(profile.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600">Doctor Profile</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{profile.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{profile.specialty} · {profile.qualification}</p>
              </div>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => { setEditing(true); setMessage(""); }}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Edit Profile
              </button>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Professional details</p>
                <h2 className="mt-1 text-xl font-bold">Profile Information</h2>
              </div>
              <div className="hidden rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:block">Schedula Doctor</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {([
                ["name", "Full Name", "text"],
                ["email", "Email Address", "email"],
                ["phone", "Phone Number", "tel"],
                ["specialty", "Specialty", "text"],
                ["qualification", "Qualification", "text"],
                ["experienceYears", "Years of Experience", "number"],
                ["hospital", "Hospital / Clinic", "text"],
                ["location", "Location", "text"],
                ["consultationFee", "Consultation Fee (₹)", "number"],
              ] as const).map(([field, label, type]) => (
                <div key={field}>
                  <label htmlFor={field} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
                  <input
                    id={field}
                    type={type}
                    value={String(formData[field])}
                    disabled={!editing}
                    min={field === "experienceYears" ? 0 : field === "consultationFee" ? 1 : undefined}
                    max={field === "experienceYears" ? 60 : undefined}
                    onChange={(event) => handleChange(field, type === "tel" ? event.target.value.replace(/\D/g, "") : event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              ))}
            </div>

            {message && (
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>
            )}

            {editing && (
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setFormData(profile); setEditing(false); setMessage(""); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 hover:shadow-lg">Save Changes</button>
              </div>
            )}
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100/90 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.07)]">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50/90 to-white px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-100">⏱</span>
                  Appointment Availability
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Manage your schedule</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose a date and enter the appointment time range. You can type the time directly or use the clock picker.</p>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <div className="min-w-0 px-4 py-3 text-center sm:px-5">
                  <p className="text-xl font-bold text-slate-900">{activeDates}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Dates</p>
                </div>
                <div className="border-x border-emerald-100 px-4 py-3 text-center sm:px-5">
                  <p className="text-xl font-bold text-emerald-600">{availableCount}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Available</p>
                </div>
                <div className="min-w-0 px-4 py-3 text-center sm:px-5">
                  <p className="text-xl font-bold text-slate-700">{bookedCount}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Booked</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddSlot} className="border-b border-slate-100 bg-[#fbfefd] p-6 sm:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-end">
              <div>
                <label htmlFor="slotDate" className="mb-2 block text-sm font-bold text-slate-700">Appointment Date</label>
                <div className="relative">
                  <input
                    id="slotDate"
                    type="date"
                    min={today}
                    value={slotDate}
                    onChange={(event) => {
                      const selectedDate = event.target.value;
                      if (selectedDate < today) {
                        setSlotDate("");
                        setSlotMessageType("error");
                        setSlotMessage("Past dates are not allowed.");
                        return;
                      }
                      setSlotDate(selectedDate);
                      setSlotMessage("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">Today and future dates only</p>
              </div>

              <div>
                <label htmlFor="startTimeText" className="mb-2 block text-sm font-bold text-slate-700">Start Time</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50">
                  <input
                    id="startTimeText"
                    type="text"
                    inputMode="numeric"
                    placeholder="2:00 PM"
                    value={startTimeText}
                    onChange={(event) => handleTimeTextChange(event.target.value, "start")}
                    onBlur={() => normalizeTimeField("start")}
                    className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => startPickerRef.current?.showPicker?.()} className="mr-1.5 grid size-10 shrink-0 place-items-center rounded-lg text-emerald-600 transition hover:bg-emerald-50" aria-label="Open start time picker">🕐</button>
                  <input ref={startPickerRef} type="time" value={startTime} onChange={(event) => setTimeFromPicker(event.target.value, "start")} className="pointer-events-none absolute right-2 top-1/2 h-1 w-1 opacity-0" tabIndex={-1} aria-hidden="true" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Type time or use the clock</p>
              </div>

              <div>
                <label htmlFor="endTimeText" className="mb-2 block text-sm font-bold text-slate-700">End Time</label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50">
                  <input
                    id="endTimeText"
                    type="text"
                    inputMode="numeric"
                    placeholder="2:30 PM"
                    value={endTimeText}
                    onChange={(event) => handleTimeTextChange(event.target.value, "end")}
                    onBlur={() => normalizeTimeField("end")}
                    className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => endPickerRef.current?.showPicker?.()} className="mr-1.5 grid size-10 shrink-0 place-items-center rounded-lg text-emerald-600 transition hover:bg-emerald-50" aria-label="Open end time picker">🕐</button>
                  <input ref={endPickerRef} type="time" value={endTime} onChange={(event) => setTimeFromPicker(event.target.value, "end")} className="pointer-events-none absolute right-2 top-1/2 h-1 w-1 opacity-0" tabIndex={-1} aria-hidden="true" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Example: 2:30 PM</p>
              </div>

              <button type="submit" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                <span className="text-lg leading-none">+</span> Add Slot
              </button>
            </div>

            {slotMessage && (
              <div className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold ${slotMessageType === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`} role="status">
                <span className="mt-0.5">{slotMessageType === "success" ? "✓" : "!"}</span>
                <span>{slotMessage}</span>
              </div>
            )}
          </form>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Your calendar</p>
                <h3 className="mt-1 text-xl font-bold">Scheduled availability</h3>
                <p className="mt-1 text-sm text-slate-500">Each time range is added manually and can be managed independently.</p>
              </div>
              {slots.length > 0 && <span className="self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:self-auto">{slots.length} total slots</span>}
            </div>

            {groupedSlots.length === 0 && (
              <div className="mt-7 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 px-6 py-12 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-xl shadow-sm">📅</div>
                <h4 className="mt-4 font-bold text-slate-800">No availability added yet</h4>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">Select a date, enter your start and end time, then click Add Slot to make a time range bookable.</p>
              </div>
            )}

            {groupedSlots.length > 0 && (
              <div className="mt-7 space-y-5">
                {groupedSlots.map(([date, dateSlots]) => (
                  <div key={date} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">{new Date(`${date}T00:00:00`).getDate()}</div>
                        <div>
                          <p className="font-bold text-slate-900">{formatDate(date)}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{dateSlots.length} {dateSlots.length === 1 ? "slot" : "slots"}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleDeleteDateSlots(date)} className="self-start rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 sm:self-auto">Remove date</button>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
                      {dateSlots.map((slot) => (
                        <div key={slot.id} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/30">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">{formatTime(slot.startTime)}</p>
                            <p className="mt-1 text-xs font-medium text-slate-500">to {formatTime(slot.endTime)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${slot.status === "available" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{slot.status}</span>
                            {slot.status === "available" ? (
                              <button type="button" onClick={() => handleDeleteSlot(slot.id)} className="grid size-9 place-items-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${formatTime(slot.startTime)} slot`}>×</button>
                            ) : (
                              <span className="rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-bold text-slate-500">Booked</span>
                            )}
                          </div>
                        </div>
                      ))}
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
