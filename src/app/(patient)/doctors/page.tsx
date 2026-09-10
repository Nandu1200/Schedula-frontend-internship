"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import type { Doctor } from "@/types/doctor";
import type { AvailabilitySlot } from "@/types/availability";

const getInitials = (name: string) => {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatSlotDate = (slot: AvailabilitySlot) => {
  const date = new Date(`${slot.date}T${slot.startTime}:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<
    Record<string, AvailabilitySlot[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctors = () => {
      try {
        /*
         * Start with the doctors from mock data.
         */
        const doctorList = [...mockDoctors];

        /*
         * Add the currently registered doctor.
         */
        const storedDoctor = localStorage.getItem("registeredDoctor");

        if (storedDoctor) {
          const registeredDoctor =
            JSON.parse(storedDoctor) as Doctor;

          const alreadyExists = doctorList.some(
            (doctor) => doctor.id === registeredDoctor.id
          );

          if (!alreadyExists) {
            doctorList.push(registeredDoctor);
          }
        }

        setDoctors(doctorList);

        /*
         * Load availability slots for every doctor.
         */
        const slotMap: Record<string, AvailabilitySlot[]> = {};

        doctorList.forEach((doctor) => {
          const storedSlots = localStorage.getItem(
            `availabilitySlots-${doctor.id}`
          );

          if (!storedSlots) {
            slotMap[doctor.id] = [];
            return;
          }

          try {
            const parsedSlots =
              JSON.parse(storedSlots) as AvailabilitySlot[];

            const doctorAvailableSlots = parsedSlots
              .filter(
                (slot) =>
                  slot.doctorId === doctor.id &&
                  slot.status === "available"
              )
              .sort((first, second) => {
                const firstValue = `${first.date} ${first.startTime}`;
                const secondValue = `${second.date} ${second.startTime}`;

                return firstValue.localeCompare(secondValue);
              });

            slotMap[doctor.id] = doctorAvailableSlots;
          } catch {
            slotMap[doctor.id] = [];
          }
        });

        setAvailableSlots(slotMap);
        setLoading(false);
      } catch {
        setError("We couldn't load doctors.");
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const doctorCountText = useMemo(() => {
    if (doctors.length === 1) {
      return "1 doctor available";
    }

    return `${doctors.length} doctors available`;
  }, [doctors.length]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/30 text-slate-900 transition-colors duration-300">
      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              S
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                Schedula
              </p>

              <p className="text-xs text-slate-500">
                Healthcare made simple
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/appointments"
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              My Appointments
            </Link>

           <Link
  href="/dashboard"
  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
>
  Dashboard
</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        {/* Page Header */}
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Find a Doctor
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose the right doctor for you
            </h1>

            <p className="mt-3 max-w-2xl text-slate-500">
              Browse doctors, check their availability, and view
              their profile before booking an appointment.
            </p>
          </div>

          {!loading && !error && (
            <div className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              {doctorCountText}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200" />

                <div className="mt-5 h-5 w-40 animate-pulse rounded bg-slate-200" />

                <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-200" />

                <div className="mt-6 h-20 animate-pulse rounded-xl bg-slate-100" />

                <div className="mt-5 h-11 animate-pulse rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="mt-8 rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm sm:mt-10 sm:p-10"
            role="alert"
          >
            <p className="font-semibold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Doctor List */}
        {!loading && !error && doctors.length > 0 && (
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => {
              const doctorSlots =
                availableSlots[doctor.id] ?? [];

              const firstAvailableSlot =
                doctorSlots[0];

              return (
                <article
                  key={doctor.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                >
                  {/* Doctor Header */}
                  <div className="flex items-start gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 ring-4 ring-emerald-50 transition-transform duration-200 group-hover:scale-105">
                      {getInitials(doctor.name)}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-slate-900">
                        {doctor.name}
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {doctor.specialty}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {doctor.experienceYears} years experience
                      </p>
                    </div>
                  </div>

                  {/* Doctor Information */}
                  <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Qualification
                      </span>

                      <span className="text-right text-sm font-semibold text-slate-700">
                        {doctor.qualification}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Hospital
                      </span>

                      <span className="text-right text-sm font-semibold text-slate-700">
                        {doctor.hospital}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Location
                      </span>

                      <span className="text-right text-sm font-semibold text-slate-700">
                        {doctor.location}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Consultation Fee
                      </span>

                      <span className="text-right text-sm font-bold text-slate-900">
                        ₹{doctor.consultationFee}
                      </span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm transition-shadow duration-200 group-hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">
                        Availability
                      </p>

                      {doctorSlots.length > 0 ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          Available
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          No slots
                        </span>
                      )}
                    </div>

                    {firstAvailableSlot ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatSlotDate(firstAvailableSlot)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {firstAvailableSlot.startTime} -{" "}
                          {firstAvailableSlot.endTime}
                        </p>

                        {doctorSlots.length > 1 && (
                          <p className="mt-2 text-xs font-semibold text-emerald-700">
                            + {doctorSlots.length - 1} more available{" "}
                            {doctorSlots.length - 1 === 1
                              ? "slot"
                              : "slots"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        This doctor has no available slots right
                        now.
                      </p>
                    )}
                  </div>

                  {/* View Profile */}
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="mt-6 flex w-full items-center justify-center rounded-xl border border-emerald-600 px-4 py-3 text-sm font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    View Doctor Profile
                    <span className="ml-2">→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* No Doctors */}
        {!loading && !error && doctors.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm sm:mt-10">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-xl">
              🩺
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No doctors available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              There are currently no doctors available in the
              system.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}