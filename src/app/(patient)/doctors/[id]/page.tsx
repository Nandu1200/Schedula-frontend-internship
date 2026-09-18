"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useSearchParams,
} from "next/navigation";

import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";
import type { Doctor } from "@/types/doctor";
import type { AdminDoctorStatus } from "@/types/admin";
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


type DoctorRating = {
  average: number;
  count: number;
};

const getDoctorIdFromAppointmentId = (appointmentId: string) => {
  const appointmentIdParts = appointmentId.split("-");
  const slotIndex = appointmentIdParts.indexOf("slot");
  const doctorIndex = appointmentIdParts.indexOf("doctor");

  if (doctorIndex === -1 || slotIndex === -1) {
    return null;
  }

  const doctorId = appointmentIdParts
    .slice(doctorIndex, slotIndex)
    .join("-");

  return doctorId || null;
};

const getDoctorVerificationStatus = (
  doctorId: string
): AdminDoctorStatus => {
  const storedStatus = localStorage.getItem(
    `doctorVerificationStatus-${doctorId}`
  );

  if (
    storedStatus === "pending" ||
    storedStatus === "approved" ||
    storedStatus === "rejected"
  ) {
    return storedStatus;
  }

  const adminDoctor = adminDoctors.find(
    (doctor) => doctor.doctorId === doctorId
  );

  return adminDoctor?.verificationStatus ?? "pending";
};

const getMockDoctorRatings = () => {
  const demoRatings = [
    { average: 4.5, count: 24 },
    { average: 4.7, count: 31 },
    { average: 4.3, count: 18 },
    { average: 4.8, count: 27 },
    { average: 4.1, count: 15 },
  ];

  return mockDoctors.reduce<Record<string, DoctorRating>>(
    (ratings, doctor, index) => {
      ratings[doctor.id] =
        demoRatings[index % demoRatings.length];
      return ratings;
    },
    {}
  );
};

export default function DoctorDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const doctorId =
    typeof params.id === "string" ? params.id : "";

  const followUpDate =
    searchParams.get("followUpDate");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [doctorRating, setDoctorRating] =
    useState<DoctorRating | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<AdminDoctorStatus>("pending");
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

        const storedAppointments =
          localStorage.getItem("appointments");

        if (storedAppointments) {
          try {
            const parsedAppointments = JSON.parse(
              storedAppointments
            ) as Array<{
              id?: string;
              status?: string;
              review?: { rating?: number };
            }>;

            let totalRating = 0;
            let reviewCount = 0;

            parsedAppointments.forEach((appointment) => {
              const rating = appointment.review?.rating;

              if (
                appointment.status !== "completed" ||
                typeof rating !== "number" ||
                rating < 1 ||
                rating > 5 ||
                !appointment.id
              ) {
                return;
              }

              const appointmentDoctorId =
                getDoctorIdFromAppointmentId(
                  appointment.id
                );

              if (
                appointmentDoctorId !== selectedDoctor.id
              ) {
                return;
              }

              totalRating += rating;
              reviewCount += 1;
            });

            const calculatedRating =
              reviewCount > 0
                ? {
                    average: Number(
                      (totalRating / reviewCount).toFixed(1)
                    ),
                    count: reviewCount,
                  }
                : null;

            const mockRating =
              getMockDoctorRatings()[selectedDoctor.id];

            setDoctorRating(calculatedRating ?? mockRating ?? null);
          } catch {
            setDoctorRating(
              getMockDoctorRatings()[selectedDoctor.id] ?? null
            );
          }
        } else {
          setDoctorRating(
            getMockDoctorRatings()[selectedDoctor.id] ?? null
          );
        }

        const storedSlots = localStorage.getItem(
          `availabilitySlots-${selectedDoctor.id}`
        );

        if (storedSlots) {
          const parsedSlots =
            JSON.parse(storedSlots) as AvailabilitySlot[];

          const storedAppointments =
            localStorage.getItem("appointments");

          let bookedSlotKeys = new Set<string>();

          if (storedAppointments) {
            try {
              const parsedAppointments = JSON.parse(
                storedAppointments
              ) as Array<{
                id?: string;
                status?: string;
                startsAt?: string;
              }>;

              bookedSlotKeys = new Set(
                parsedAppointments
                  .filter(
                    (appointment) =>
                      appointment.status !== "cancelled" &&
                      typeof appointment.id === "string" &&
                      typeof appointment.startsAt === "string" &&
                      getDoctorIdFromAppointmentId(
                        appointment.id
                      ) === selectedDoctor.id
                  )
                  .map((appointment) => {
                    const startsAt = new Date(
                      appointment.startsAt as string
                    );

                    const date = startsAt
                      .toISOString()
                      .slice(0, 10);

                    const time = startsAt
                      .toTimeString()
                      .slice(0, 5);

                    return `${date}|${time}`;
                  })
              );
            } catch {
              bookedSlotKeys = new Set<string>();
            }
          }

          const availableSlots = parsedSlots
            .filter(
              (slot) =>
                slot.doctorId === selectedDoctor.id &&
                slot.status === "available" &&
                !bookedSlotKeys.has(
                  `${slot.date}|${slot.startTime}`
                ) &&
                (!followUpDate ||
                  slot.date >= followUpDate)
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
  }, [doctorId, followUpDate]);

  useEffect(() => {
    if (!doctorId) {
      return;
    }

    const syncVerificationStatus = () => {
      setVerificationStatus(
        getDoctorVerificationStatus(doctorId)
      );
    };

    syncVerificationStatus();

    window.addEventListener(
      "storage",
      syncVerificationStatus
    );

    window.addEventListener(
      "doctor-verification-changed",
      syncVerificationStatus
    );

    return () => {
      window.removeEventListener(
        "storage",
        syncVerificationStatus
      );

      window.removeEventListener(
        "doctor-verification-changed",
        syncVerificationStatus
      );
    };
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

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold">
                      {doctor.name}
                    </h1>

                    {verificationStatus === "approved" && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                        aria-label="Verified Doctor"
                      >
                        <span aria-hidden="true">✓</span>
                        Verified Doctor
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-lg font-semibold text-emerald-700">
                    {doctor.specialty}
                  </p>

                  {doctorRating ? (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        {doctorRating.average.toFixed(1)}
                      </span>

                      <span
                        className="text-base tracking-wide text-yellow-500"
                        aria-label={`${doctorRating.average} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }, (_, index) =>
                          index < Math.round(doctorRating.average)
                            ? "★"
                            : "☆"
                        ).join("")}
                      </span>

                      <span className="text-sm text-slate-500">
                        ({doctorRating.count}{" "}
                        {doctorRating.count === 1
                          ? "review"
                          : "reviews"}
                        )
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-slate-400">
                      No ratings yet
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/70 px-5 py-3 shadow-sm">
                  <p className="text-xs text-slate-500">
                    Consultation Fees
                  </p>

                  <div className="mt-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      Online:{" "}
                      <span className="text-lg font-bold text-slate-900">
                        ₹{doctor.onlineFee}
                      </span>
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      In-person:{" "}
                      <span className="text-lg font-bold text-slate-900">
                        ₹{doctor.inPersonFee}
                      </span>
                    </p>
                  </div>
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

            {followUpDate ? (
              <>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Follow-up appointment
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Showing availability only for {formatDate(followUpDate)}.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Choose an available time to continue with your booking.
              </p>
            )}
          </div>

          {slots.length === 0 ? (
            <div className="px-6 py-14 text-center sm:px-8">

              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-xl shadow-sm ring-8 ring-emerald-50/60">
                📅
              </div>

              <h3 className="mt-4 font-bold">
                {followUpDate
                  ? "No availability for follow-up date"
                  : "No available slots"}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {followUpDate
                  ? `This doctor has no available appointment slots on ${formatDate(
                      followUpDate
                    )}.`
                  : "This doctor currently has no available appointment slots."}
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