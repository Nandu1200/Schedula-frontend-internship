"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/types/appointment";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from "@/lib/utils/notifications";

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

const statusStyles: Record<Appointment["status"], string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-slate-50 text-slate-700 ring-slate-200",
  missed: "bg-orange-50 text-orange-700 ring-orange-200",
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

const normalizeDoctorName = (name: string) =>
  name
    .toLowerCase()
    .replace(/^dr\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

export default function DoctorDashboardPage() {
  const router = useRouter();

  const [doctor, setDoctor] =
    useState<LoggedInDoctor | null>(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

    const [notifications, setNotifications] =
  useState<Notification[]>([]);

const [notificationOpen, setNotificationOpen] =
  useState(false);

  const [doctorLoading, setDoctorLoading] =
    useState(true);

  const [appointmentsLoading, setAppointmentsLoading] =
    useState(true);

  const [currentTime] =
    useState(() => Date.now());

  // Load logged-in doctor
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const loggedInDoctor =
          localStorage.getItem("loggedInDoctor");

        const registeredDoctor =
          localStorage.getItem("registeredDoctor");

        if (loggedInDoctor) {
          const parsedDoctor =
            JSON.parse(
              loggedInDoctor
            ) as LoggedInDoctor;

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

  // Load appointments
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

    const timer =
      window.setTimeout(
        loadAppointments,
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

    // Load doctor notifications
  useEffect(() => {
    const loadNotifications = () => {
      setNotifications(getNotifications());
    };

    const timer = window.setTimeout(
      loadNotifications,
      0
    );

    window.addEventListener(
      "notifications-updated",
      loadNotifications
    );

    window.addEventListener(
      "storage",
      loadNotifications
    );

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "notifications-updated",
        loadNotifications
      );

      window.removeEventListener(
        "storage",
        loadNotifications
      );
    };
  }, []);

  // Close details modal with Escape key
  useEffect(() => {
    if (!selectedAppointment) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAppointment(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedAppointment]);

  // Appointments belonging to logged-in doctor
  const doctorAppointments = useMemo(() => {
    if (!doctor) {
      return [];
    }

    const doctorName =
      normalizeDoctorName(doctor.name);

    return appointments.filter(
      (appointment) => {
        const appointmentDoctorName =
          normalizeDoctorName(
            appointment.clinician
          );

        return (
          appointmentDoctorName ===
          doctorName
        );
      }
    );
  }, [appointments, doctor]);

    const doctorNotifications = useMemo(() => {
    if (!doctor) {
      return [];
    }

    return notifications
      .filter(
        (notification) =>
          notification.userId === doctor.id
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [notifications, doctor]);

  const unreadNotificationCount = useMemo(() => {
    return doctorNotifications.filter(
      (notification) => !notification.read
    ).length;
  }, [doctorNotifications]);

    const handleNotificationClick = (
    notification: Notification
  ) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (!doctor) {
      return;
    }

    markAllNotificationsAsRead(doctor.id);
  };

  const getNotificationIcon = (
    type: Notification["type"]
  ) => {
    switch (type) {
      case "booking":
        return "📅";
      case "confirmation":
        return "✅";
      case "reschedule":
        return "🔄";
      case "cancellation":
        return "❌";
      case "reminder":
        return "⏰";
      case "missed":
        return "⚠️";
      case "completed":
        return "🎉";
      case "prescription":
        return "📄";
      default:
        return "🔔";
    }
  };

  // Upcoming appointments
  //
  // Dashboard should show only future appointments.
  // Cancelled/completed/missed appointments are excluded.
  const upcomingAppointments = useMemo(() => {
    return doctorAppointments
      .filter((appointment) => {
        const appointmentTime =
          new Date(
            appointment.startsAt
          ).getTime();

        const isFuture =
          appointmentTime >= currentTime;

        const isActiveStatus =
          appointment.status === "confirmed" ||
          appointment.status === "upcoming" ||
          appointment.status === "pending";

        return (
          isFuture &&
          isActiveStatus
        );
      })
      .sort(
        (first, second) =>
          new Date(
            first.startsAt
          ).getTime() -
          new Date(
            second.startsAt
          ).getTime()
      );
  }, [
    doctorAppointments,
    currentTime,
  ]);

  const handleSelectAppointment = (
    appointment: Appointment
  ) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseAppointmentModal = () => {
    setSelectedAppointment(null);
  };

  const handleAppointmentCalendarClick = (
  appointment: Appointment
) => {
  const date = new Date(
    appointment.startsAt
  );

  const dateParam = date
    .toISOString()
    .slice(0, 10);

  const timeParam = date
    .toTimeString()
    .slice(0, 5);

  router.push(
    `/doctors/calendar?date=${dateParam}&time=${encodeURIComponent(
      timeParam
    )}`
  );
};

  const confirmedCount =
    doctorAppointments.filter(
      (appointment) =>
        appointment.status ===
        "confirmed"
    ).length;

  const pendingCount =
    doctorAppointments.filter(
      (appointment) =>
        appointment.status ===
        "pending"
    ).length;

  const cancelledCount =
    doctorAppointments.filter(
      (appointment) =>
        appointment.status ===
        "cancelled"
    ).length;

  // Doctor initials
  const doctorInitials = doctor
    ? doctor.name
        .replace(/^Dr\.?\s*/i, "")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem(
      "loggedInDoctor"
    );

    router.push("/");
  };

  // Loading
  if (doctorLoading) {
    return (
      <main className="min-h-screen bg-[#f7faf9]">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 bg-emerald-700 p-5 lg:block">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-emerald-600" />
          </aside>

          <div className="flex-1 p-6 lg:p-10">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />

            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Login required
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
            href="/login/doctor"
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
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 bg-emerald-700 text-white lg:flex lg:flex-col">

          {/* Logo */}
          <div className="border-b border-emerald-600 px-6 py-5">
            <Link
              href="/doctors/dashboard"
              className="flex items-center gap-3"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-700">
                S
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight">
                  Schedula
                </p>

                <p className="text-xs text-emerald-100">
                  Doctor Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Menu
            </p>

            <div className="mt-3 space-y-2">

              {/* Dashboard */}
              <Link
                href="/doctors/dashboard"
                className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold text-white"
              >
                <span className="text-lg">
                  ▦
                </span>

                Dashboard
              </Link>

              {/* Appointments */}
              <Link
                href="/doctors/appointments"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10"
              >
                <span className="text-lg">
                  ▣
                </span>

                Appointments
              </Link>

              {/* Profile */}
              <Link
                href="/doctors/profile"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10"
              >
                <span className="text-lg">
                  ♙
                </span>

                My Profile
              </Link>
{/* Prescriptions */}
<Link
  href="/doctors/prescriptions"
  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/10"
>
  <span className="text-lg">
    ▤
  </span>

  Prescriptions
</Link>
            </div>
          </nav>

          {/* Doctor Info */}
          <div className="border-t border-emerald-600 p-4">

            <div className="flex items-center gap-3 rounded-xl bg-emerald-800/40 p-3 transition-all duration-200 hover:bg-emerald-800/60">

              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-2 ring-emerald-200 transition-transform duration-200 hover:scale-105">
                {doctorInitials}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">
                  {doctor.name}
                </p>

                <p className="truncate text-xs text-emerald-200">
                  {doctor.specialty}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              <span>
                ↪
              </span>

              Sign Out
            </button>

          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">

          {/* Top Header */}
          <header className="border-b border-slate-200 bg-white">

            <div className="flex items-center justify-between px-5 py-4 sm:px-8 lg:px-10">

              {/* Mobile Logo */}
              <Link
                href="/doctors/dashboard"
                className="group flex items-center gap-3 lg:hidden"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white transition-transform duration-200 group-hover:scale-105">
                  S
                </div>

                <div>
                  <p className="font-bold">
                    Schedula
                  </p>

                  <p className="text-xs text-slate-500">
                    Doctor Portal
                  </p>
                </div>
              </Link>

              {/* Desktop title */}
              <div className="hidden lg:block">
                  <p className="text-lg font-bold tracking-tight">
                  Dashboard
                </p>
              </div>

              {/* Doctor */}
             <div className="flex items-center gap-3">

  {/* Notification Bell */}
  <div className="relative">
    <button
      type="button"
      onClick={() =>
        setNotificationOpen(
          (open) => !open
        )
      }
      aria-label="Open notifications"
      className="relative grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      🔔

      {unreadNotificationCount > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white transition-transform duration-200 hover:scale-110">
          {unreadNotificationCount > 9
            ? "9+"
            : unreadNotificationCount}
        </span>
      )}
    </button>

    {notificationOpen && (
      <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 sm:right-0">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div>
            <h2 className="font-bold tracking-tight text-slate-900">
              Notifications
            </h2>

            <p className="text-xs font-medium text-slate-500">
              {unreadNotificationCount} unread
            </p>
          </div>

          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-600 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {doctorNotifications.length === 0 ? (
            <div className="px-5 py-10 text-center transition-colors duration-200 hover:bg-slate-50/50">
              <div className="text-3xl transition-transform duration-200 hover:scale-110">
               🔔
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No notifications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                You&apos;re all caught up.
              </p>
            </div>
          ) : (
            doctorNotifications.map(
              (notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                  className={`w-full border-b border-slate-100 px-4 py-4 text-left transition-all duration-200 hover:bg-slate-50 hover:pl-5 sm:px-5 ${
                    notification.read
                      ? "bg-white"
                      : "bg-emerald-50/50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-200 hover:scale-105 hover:ring-emerald-200">
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${
                            notification.read
                              ? "font-medium text-slate-700"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {notification.title}
                        </p>

                        {!notification.read && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {new Date(
                          notification.createdAt
                        ).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              )
            )
          )}
        </div>
      </div>
    )}
  </div>

  <div className="hidden text-right sm:block transition-opacity duration-200">
    <p className="text-sm font-semibold tracking-tight">
      {doctor.name}
    </p>

    <p className="text-xs text-slate-500">
      {doctor.specialty}
    </p>
  </div>

  <div className="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
    {doctorInitials}
  </div>

</div>

            </div>

          </header>

          {/* Dashboard Body */}
          <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9 2xl:px-12">

            {/* Welcome */}
            <section>

              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Doctor Dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Good day, {doctor.name}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Here&apos;s an overview of your appointments and practice.
              </p>

            </section>

            {/* Stats */}
            <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6">

              {/* Upcoming */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">

                <p className="text-sm font-medium text-slate-500">
                  Upcoming Appointments
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {upcomingAppointments.length}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Scheduled patient visits
                </p>

              </div>

              {/* Confirmed */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">

                <p className="text-sm font-medium text-slate-500">
                  Confirmed
                </p>

                <p className="mt-3 text-3xl font-bold text-emerald-600">
                  {confirmedCount}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Confirmed appointments
                </p>

              </div>

              {/* Pending */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">

                <p className="text-sm font-medium text-slate-500">
                  Pending
                </p>

                <p className="mt-3 text-3xl font-bold text-amber-600">
                  {pendingCount}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Waiting for confirmation
                </p>

              </div>

              {/* Cancelled */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">

                <p className="text-sm font-medium text-slate-500">
                  Cancelled
                </p>

                <p className="mt-3 text-3xl font-bold text-red-500">
                  {cancelledCount}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Cancelled appointments
                </p>

              </div>

            </section>

            {/* Quick Navigation */}
            <section className="mt-8">

              <div className="mb-4">

                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Quick Navigation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your doctor portal.
                </p>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Profile */}
                <Link
                  href="/doctors/profile"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-bold">
                        My Profile
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Update your professional information and manage availability.
                      </p>

                    </div>

                    <span className="text-xl text-emerald-600 transition group-hover:translate-x-1">
                      →
                    </span>

                  </div>
                </Link>

                {/* Appointments */}
                <Link
                  href="/doctors/appointments"
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-bold">
                        Appointments
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        View and manage all patient appointments.
                      </p>

                    </div>

                    <span className="text-xl text-emerald-600 transition group-hover:translate-x-1">
                      →
                    </span>

                  </div>
                </Link>

              </div>

            </section>

            {/* Upcoming Appointments */}
            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">

              {/* Header */}
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      Upcoming Appointments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Your upcoming patient visits.
                    </p>

                  </div>

                  <Link
                    href="/doctors/appointments"
                    className="rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-sm"
                  >
                    View all →
                  </Link>

                </div>

              </div>

              {/* Loading */}
              {appointmentsLoading && (
                <div className="space-y-4 p-6">

                  {[1, 2, 3].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                      />
                    )
                  )}

                </div>
              )}

              {/* Empty */}
              {!appointmentsLoading &&
                upcomingAppointments.length ===
                  0 && (
                  <div className="px-6 py-14 text-center">

                    <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-xl text-emerald-600 ring-4 ring-emerald-50/60 transition-transform duration-200 hover:scale-105">
                      ✓
                    </div>

                    <p className="mt-4 font-semibold tracking-tight text-slate-900">
                      No upcoming appointments
                    </p>

                    <p className="mt-1 max-w-md mx-auto text-sm leading-6 text-slate-500">
                      Your upcoming patient appointments will appear here.
                    </p>

                    <Link
                      href="/doctors/profile"
                      className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
                    >
                      Manage Availability
                    </Link>

                  </div>
                )}

              {/* Appointment List */}
              {!appointmentsLoading &&
                upcomingAppointments.length >
                  0 && (
                  <div className="divide-y divide-slate-100 bg-white">

                    {upcomingAppointments
                      .slice(0, 5)
                      .map((appointment) => (
                        <div
  key={appointment.id}
  onClick={() =>
    handleAppointmentCalendarClick(
      appointment
    )
  }
  className="group cursor-pointer px-6 py-5 transition-colors duration-200 hover:bg-slate-50"
>

                          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                            {/* Patient */}
                            <div className="flex items-center gap-4">

                              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 ring-4 ring-emerald-50 transition-transform duration-200 group-hover:scale-105">
                                {appointment.patient.initials}
                              </div>

                              <div className="min-w-0 flex-1">

                                <p className="font-semibold">
                                  {appointment.patient.name}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {appointment.reason}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    Consultation
                                  </span>

                                  <span className="text-xs text-slate-400">
                                    Patient age: {appointment.patient.age}
                                  </span>

                                </div>

                              </div>

                            </div>

                            {/* Date / Status / Actions */}
                            <div className="flex flex-col gap-4 xl:items-end">

                              {/* Date and Status */}
                              <div className="flex flex-wrap items-center gap-3">

                                <div className="text-sm xl:min-w-44 xl:text-right">

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
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset transition-transform duration-200 hover:scale-105 ${
                                    statusStyles[
                                      appointment.status
                                    ]
                                  }`}
                                >
                                  {appointment.status}
                                </span>

                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2">

                                {/* Patient Details */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectAppointment(
                                      appointment
                                    )
                                  }
                                  title="Patient Details"
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                >
                                  <span className="text-base">
                                    👤
                                  </span>

                                  <span className="hidden sm:inline">
                                    Patient Details
                                  </span>
                                </button>

                                {/* View Details */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectAppointment(
                                      appointment
                                    )
                                  }
                                  className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                                >
                                  View Details
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>
                      ))}

                  </div>
                )}

            </section>

          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseAppointmentModal();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-5">

              <div>

                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                  Appointment Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedAppointment.patient.name}
                </h2>

              </div>

              <button
                type="button"
                onClick={handleCloseAppointmentModal}
                className="grid size-9 place-items-center rounded-lg text-xl text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* Modal Body */}
           <div className="space-y-6 bg-white p-6 sm:p-7">

              {/* Patient */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">

                  <div className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700 ring-4 ring-emerald-50 transition-transform duration-200 hover:scale-105">
                    {selectedAppointment.patient.initials}
                  </div>

                  <div>

                    <p className="font-bold text-slate-900">
                      {selectedAppointment.patient.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Age: {selectedAppointment.patient.age}
                    </p>

                  </div>

                </div>

              </div>

              {/* Appointment Information */}
              <div>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Appointment Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-xs text-slate-500">
                      Date
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatDate(
                        selectedAppointment.startsAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-xs text-slate-500">
                      Time
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatTime(
                        selectedAppointment.startsAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-xs text-slate-500">
                      Appointment Type
                    </p>

                    <p className="mt-1 font-semibold">
                      Consultation
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-xs text-slate-500">
                      Duration
                    </p>

                    <p className="mt-1 font-semibold">
                      {selectedAppointment.durationMinutes} minutes
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">
                      Room
                    </p>

                    <p className="mt-1 font-semibold">
                      {selectedAppointment.room}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                        statusStyles[
                          selectedAppointment.status
                        ]
                      }`}
                    >
                      {selectedAppointment.status}
                    </span>
                  </div>

                </div>

              </div>

              {/* Reason */}
              <div>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Reason for Visit
                </h3>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedAppointment.reason}
                  </p>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/50 px-6 py-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={handleCloseAppointmentModal}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}