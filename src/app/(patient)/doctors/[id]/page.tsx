"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

export default function DoctorDetailsPage() {
  const params = useParams();

  const doctorId =
    typeof params.id === "string" ? params.id : "";

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      return;
    }

    const loadDoctor = () => {
      try {
        const doctorList = [...mockDoctors];

        const storedDoctor =
          localStorage.getItem("registeredDoctor");

        if (storedDoctor) {
          const registeredDoctor =
            JSON.parse(storedDoctor) as Doctor;

          const alreadyExists = doctorList.some(
            (item) => item.id === registeredDoctor.id
          );

          if (!alreadyExists) {
            doctorList.push(registeredDoctor);
          }
        }

        const selectedDoctor = doctorList.find(
          (item) => item.id === doctorId
        );

        if (!selectedDoctor) {
          setDoctor(null);
          setLoading(false);
          return;
        }

        setDoctor(selectedDoctor);

        const storedSlots = localStorage.getItem(
          `availabilitySlots-${selectedDoctor.id}`
        );

        if (storedSlots) {
          const parsedSlots =
            JSON.parse(storedSlots) as AvailabilitySlot[];

          const availableSlots = parsedSlots
            .filter(
              (slot) =>
                slot.doctorId === selectedDoctor.id &&
                slot.status === "available"
            )
            .sort((first, second) => {
              const firstValue =
                `${first.date} ${first.startTime}`;

              const secondValue =
                `${second.date} ${second.startTime}`;

              return firstValue.localeCompare(secondValue);
            });

          setSlots(availableSlots);
        } else {
          setSlots([]);
        }

        setLoading(false);
      } catch {
        setDoctor(null);
        setSlots([]);
        setLoading(false);
      }
    };

    loadDoctor();
  }, [doctorId]);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, AvailabilitySlot[]> = {};

    slots.forEach((slot) => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }

      grouped[slot.date].push(slot);
    });

    return grouped;
  }, [slots]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/40">
        <p className="text-slate-500">
          Loading doctor profile...
        </p>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/40 px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md transition-shadow duration-200 hover:shadow-lg">
          <h1 className="text-2xl font-bold">
            Doctor not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The doctor you are looking for could not be found.
          </p>

          <Link
            href="/doctors"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Back to Doctors
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/30 text-slate-900">

      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

          <Link
            href="/"
            className="group flex items-center gap-3"
          >
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

          <nav className="flex items-center gap-2">
            <Link
              href="/appointments"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              My Appointments
            </Link>

            <Link
              href="/doctors"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Doctors
            </Link>
          </nav>

        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8 lg:py-12">

        {/* Back */}
        <Link
          href="/doctors"
          className="inline-flex rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          ← Back to Doctors
        </Link>

        {/* Doctor Profile */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg sm:p-8">

          <div className="flex flex-col gap-6 md:flex-row">

            <div className="grid size-24 shrink-0 place-items-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 shadow-sm ring-8 ring-emerald-50 transition-transform duration-200 hover:scale-105">
              {getInitials(doctor.name)}
            </div>

            <div className="flex-1">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                    Doctor Profile
                  </p>

                  <h1 className="mt-2 text-3xl font-bold">
                    {doctor.name}
                  </h1>

                  <p className="mt-2 text-lg font-semibold text-emerald-700">
                    {doctor.specialty}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/70 px-5 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">
                    Consultation Fee
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    ₹{doctor.consultationFee}
                  </p>
                </div>

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm">
                  <p className="text-xs text-slate-500">
                    Qualification
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {doctor.qualification}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm">
                  <p className="text-xs text-slate-500">
                    Experience
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {doctor.experienceYears} years
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm">
                  <p className="text-xs text-slate-500">
                    Hospital
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {doctor.hospital}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50/40 hover:shadow-sm">
                  <p className="text-xs text-slate-500">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {doctor.location}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {doctor.bio && (
            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="text-lg font-bold">
                About the Doctor
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                {doctor.bio}
              </p>
            </div>
          )}

        </section>

        {/* Availability */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">

          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-6 sm:px-8">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Availability
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Available Appointment Slots
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Choose an available time to continue with your booking.
            </p>
          </div>

          {slots.length === 0 ? (
            <div className="px-6 py-14 text-center sm:px-8">

              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-xl shadow-sm ring-8 ring-emerald-50/60">
                📅
              </div>

              <h3 className="mt-4 font-bold">
                No available slots
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                This doctor currently has no available appointment slots.
              </p>

            </div>
          ) : (
            <div className="space-y-6 p-6 sm:p-8">

              {Object.entries(slotsByDate).map(
                ([date, dateSlots]) => (
                  <div
                    key={date}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >

                    <div>
                      <h3 className="font-bold">
                        {formatDate(date)}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {dateSlots.length} available{" "}
                        {dateSlots.length === 1
                          ? "slot"
                          : "slots"}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                      {dateSlots.map((slot) => (
                        <Link
                          key={slot.id}
                          href={`/booking?doctorId=${doctor.id}&slotId=${slot.id}`}
                          className="group/slot rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                          <p className="text-sm font-bold text-emerald-800">
                            {slot.startTime} - {slot.endTime}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-emerald-700 transition-colors duration-200 group-hover/slot:text-emerald-800">
                            Book this slot →
                          </p>
                        </Link>
                      ))}

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </section>
    </main>
  );
}