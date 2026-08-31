"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Appointment } from "@/types/appointment";

type LoggedInDoctor = {
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

const statusStyles = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

/*
 * Normalize doctor names so that:
 * "Dr. Narendra Singh"
 * and
 * "dr narendra singh"
 * can still be compared safely.
 */
const normalizeDoctorName = (name: string) =>
  name
    .toLowerCase()
    .replace(/^dr\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

export default function DoctorDashboardPage() {
  const [doctor, setDoctor] =
    useState<LoggedInDoctor | null>(null);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [doctorLoading, setDoctorLoading] =
    useState(true);

  const [appointmentsLoading, setAppointmentsLoading] =
    useState(true);

  const [currentTime] = useState(() => Date.now());

  /*
   * Load logged-in doctor.
   *
   * First check loggedInDoctor.
   * If it doesn't exist, use registeredDoctor.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const loggedInDoctor =
          localStorage.getItem("loggedInDoctor");

        const registeredDoctor =
          localStorage.getItem("registeredDoctor");

        if (loggedInDoctor) {
          const parsedDoctor =
            JSON.parse(loggedInDoctor) as LoggedInDoctor;

          setDoctor(parsedDoctor);
        } else if (registeredDoctor) {
          const parsedDoctor =
            JSON.parse(
              registeredDoctor
            ) as LoggedInDoctor;

          setDoctor(parsedDoctor);
        } else {
          setDoctor(null);
        }
      } catch {
        setDoctor(null);
      }

      setDoctorLoading(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*
   * Load appointments.
   *
   * Prefer localStorage because newly booked
   * appointments are stored there.
   */
  useEffect(() => {
    const loadAppointments = () => {
      try {
        const storedAppointments =
          localStorage.getItem("appointments");

        if (storedAppointments) {
          const parsedAppointments =
            JSON.parse(
              storedAppointments
            ) as Appointment[];

          setAppointments(parsedAppointments);
          setAppointmentsLoading(false);
          return;
        }
      } catch {
        // Continue to API fallback.
      }

      /*
       * Fallback to API appointments.
       */
      fetch("/api/appointments")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Failed to load appointments"
            );
          }

          return response.json() as Promise<{
            data: Appointment[];
          }>;
        })
        .then(({ data }) => {
          setAppointments(data);
          setAppointmentsLoading(false);
        })
        .catch(() => {
          setAppointments([]);
          setAppointmentsLoading(false);
        });
    };

    const timer = window.setTimeout(
      loadAppointments,
      0
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*
   * Get appointments belonging to this doctor.
   *
   * We compare normalized names instead of exact
   * string comparison.
   */
  const doctorAppointments = useMemo(() => {
    if (!doctor) {
      return [];
    }

    const doctorName =
      normalizeDoctorName(doctor.name);

    return appointments.filter((appointment) => {
      const appointmentDoctorName =
        normalizeDoctorName(
          appointment.clinician
        );

      return (
        appointmentDoctorName === doctorName
      );
    });
  }, [appointments, doctor]);

  /*
   * Upcoming appointments.
   *
   * Cancelled appointments are excluded.
   */
  const upcomingAppointments = useMemo(() => {
    return doctorAppointments
      .filter(
        (appointment) =>
          appointment.status !== "cancelled"
      )
      .filter(
        (appointment) =>
          new Date(
            appointment.startsAt
          ).getTime() >= currentTime
      )
      .sort(
        (first, second) =>
          new Date(
            first.startsAt
          ).getTime() -
          new Date(
            second.startsAt
          ).getTime()
      );
  }, [doctorAppointments, currentTime]);

  /*
   * Confirmed appointment count.
   */
  const confirmedCount =
    doctorAppointments.filter(
      (appointment) =>
        appointment.status === "confirmed"
    ).length;

  /*
   * Pending appointment count.
   */
  const pendingCount =
    doctorAppointments.filter(
      (appointment) =>
        appointment.status === "pending"
    ).length;

  /*
   * Loading doctor.
   */
  if (doctorLoading) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  /*
   * Doctor login required.
   */
  if (!doctor) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Doctor login required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please login to access your doctor dashboard.
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
            href="/"
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

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {doctor.name}
              </p>

              <p className="text-xs text-slate-500">
                {doctor.specialty}
              </p>
            </div>

            <div className="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {doctor.name
                .replace(/^Dr\.?\s*/i, "")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Welcome */}
        <section>
          <p className="text-sm font-semibold text-emerald-600">
            Doctor Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Good day, {doctor.name}
          </h1>

          <p className="mt-2 text-slate-500">
            Here&apos;s an overview of your upcoming appointments.
          </p>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Upcoming appointments
            </p>

            <p className="mt-2 text-3xl font-bold">
              {upcomingAppointments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Confirmed
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <h2 className="text-lg font-bold">
            Quick Actions
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/doctors/profile"
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-sm"
            >
              <p className="font-bold">
                My Profile
              </p>

              <p className="mt-1 text-sm text-slate-500">
                View and update your professional information.
              </p>
            </Link>

            <Link
              href="/doctors/appointments"
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-sm"
            >
              <p className="font-bold">
                View All Appointments
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Manage your complete appointment schedule.
              </p>
            </Link>
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Upcoming Appointments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your upcoming patient visits.
                </p>
              </div>

              <Link
                href="/doctors/appointments"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all →
              </Link>
            </div>
          </div>

          {appointmentsLoading && (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          )}

          {!appointmentsLoading &&
            upcomingAppointments.length === 0 && (
              <div className="p-10 text-center">
                <p className="font-semibold">
                  No upcoming appointments
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your upcoming appointments will appear here.
                </p>
              </div>
            )}

          {!appointmentsLoading &&
            upcomingAppointments.length > 0 && (
              <div className="divide-y divide-slate-100">
                {upcomingAppointments
                  .slice(0, 5)
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                          {appointment.patient.initials}
                        </div>

                        <div>
                          <p className="font-semibold">
                            {appointment.patient.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {appointment.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <div className="text-sm sm:text-right">
                          <p className="font-semibold">
                            {formatDate(
                              appointment.startsAt
                            )}
                          </p>

                          <p className="mt-1 text-slate-500">
                            {formatTime(
                              appointment.startsAt
                            )}{" "}
                            ·{" "}
                            {appointment.durationMinutes}{" "}
                            min
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                            statusStyles[
                              appointment.status
                            ]
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}