"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SchedulaAICareAssistant from "@/components/ai/SchedulaAICareAssistant";
import {
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Appointment } from "@/types/appointment";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from "@/lib/utils/notifications";

type LoggedInPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
};

const APPOINTMENTS_STORAGE_KEY = "appointments";
const PATIENT_STORAGE_KEY = "loggedInPatient";

const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_NOTIFICATIONS: Notification[] = [];

let patientSnapshot: LoggedInPatient | null = null;
let patientSnapshotInitialized = false;

let appointmentsSnapshot: Appointment[] =
  EMPTY_APPOINTMENTS;
let appointmentsSnapshotInitialized = false;

let notificationsSnapshot: Notification[] =
  EMPTY_NOTIFICATIONS;
let notificationsSnapshotInitialized = false;

/* -------------------- Patient Storage -------------------- */

const getStoredPatient = (): LoggedInPatient | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedPatient = localStorage.getItem(
    PATIENT_STORAGE_KEY
  );

  if (!storedPatient) {
    return null;
  }

  try {
    return JSON.parse(
      storedPatient
    ) as LoggedInPatient;
  } catch {
    return null;
  }
};

/* -------------------- Appointment Storage -------------------- */

const getStoredAppointments = (): Appointment[] => {
  if (typeof window === "undefined") {
    return EMPTY_APPOINTMENTS;
  }

  const storedAppointments = localStorage.getItem(
    APPOINTMENTS_STORAGE_KEY
  );

  if (!storedAppointments) {
    return EMPTY_APPOINTMENTS;
  }

  try {
    const parsedAppointments = JSON.parse(
      storedAppointments
    ) as Appointment[];

    return Array.isArray(parsedAppointments)
      ? parsedAppointments
      : EMPTY_APPOINTMENTS;
  } catch {
    return EMPTY_APPOINTMENTS;
  }
};

/* -------------------- Notification Storage -------------------- */

const getStoredNotifications = (): Notification[] => {
  if (typeof window === "undefined") {
    return EMPTY_NOTIFICATIONS;
  }

  return getNotifications();
};

/* -------------------- Patient Subscription -------------------- */

const subscribeToPatient = (
  callback: () => void
) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const syncPatient = () => {
    const nextPatient = getStoredPatient();

    const previousPatient = JSON.stringify(
      patientSnapshot
    );

    const nextPatientString = JSON.stringify(
      nextPatient
    );

    if (
      !patientSnapshotInitialized ||
      previousPatient !== nextPatientString
    ) {
      patientSnapshot = nextPatient;
      patientSnapshotInitialized = true;
      callback();
    }
  };

  window.addEventListener(
    "storage",
    syncPatient
  );

  window.addEventListener(
    "patient-auth-updated",
    syncPatient
  );

  syncPatient();

  return () => {
    window.removeEventListener(
      "storage",
      syncPatient
    );

    window.removeEventListener(
      "patient-auth-updated",
      syncPatient
    );
  };
};

const getPatientSnapshot = () => {
  if (!patientSnapshotInitialized) {
    patientSnapshot = getStoredPatient();
    patientSnapshotInitialized = true;
  }

  return patientSnapshot;
};

const getPatientServerSnapshot = () => {
  return null;
};

/* -------------------- Appointment Subscription -------------------- */

const subscribeToAppointments = (
  callback: () => void
) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const syncAppointments = () => {
    const nextAppointments =
      getStoredAppointments();

    const previousAppointments =
      JSON.stringify(
        appointmentsSnapshot
      );

    const nextAppointmentsString =
      JSON.stringify(
        nextAppointments
      );

    if (
      !appointmentsSnapshotInitialized ||
      previousAppointments !==
        nextAppointmentsString
    ) {
      appointmentsSnapshot =
        nextAppointments;

      appointmentsSnapshotInitialized =
        true;

      callback();
    }
  };

  window.addEventListener(
    "storage",
    syncAppointments
  );

  window.addEventListener(
    "appointments-updated",
    syncAppointments
  );

  syncAppointments();

  return () => {
    window.removeEventListener(
      "storage",
      syncAppointments
    );

    window.removeEventListener(
      "appointments-updated",
      syncAppointments
    );
  };
};

const getAppointmentsSnapshot = () => {
  if (!appointmentsSnapshotInitialized) {
    appointmentsSnapshot =
      getStoredAppointments();

    appointmentsSnapshotInitialized =
      true;
  }

  return appointmentsSnapshot;
};

const getAppointmentsServerSnapshot = () => {
  return EMPTY_APPOINTMENTS;
};

/* -------------------- Notification Subscription -------------------- */

const subscribeToNotifications = (
  callback: () => void
) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const syncNotifications = () => {
    const nextNotifications =
      getStoredNotifications();

    const previousNotifications =
      JSON.stringify(
        notificationsSnapshot
      );

    const nextNotificationsString =
      JSON.stringify(
        nextNotifications
      );

    if (
      !notificationsSnapshotInitialized ||
      previousNotifications !==
        nextNotificationsString
    ) {
      notificationsSnapshot =
        nextNotifications;

      notificationsSnapshotInitialized =
        true;

      callback();
    }
  };

  window.addEventListener(
    "notifications-updated",
    syncNotifications
  );

  window.addEventListener(
    "storage",
    syncNotifications
  );

  syncNotifications();

  return () => {
    window.removeEventListener(
      "notifications-updated",
      syncNotifications
    );

    window.removeEventListener(
      "storage",
      syncNotifications
    );
  };
};

const getNotificationsSnapshot = () => {
  if (!notificationsSnapshotInitialized) {
    notificationsSnapshot =
      getStoredNotifications();

    notificationsSnapshotInitialized =
      true;
  }

  return notificationsSnapshot;
};

const getNotificationsServerSnapshot = () => {
  return EMPTY_NOTIFICATIONS;
};

/* -------------------- Dashboard -------------------- */

export default function PatientDashboardPage() {
  const router = useRouter();
  const patient = useSyncExternalStore(
    subscribeToPatient,
    getPatientSnapshot,
    getPatientServerSnapshot
  );

  const appointments =
    useSyncExternalStore(
      subscribeToAppointments,
      getAppointmentsSnapshot,
      getAppointmentsServerSnapshot
    );

  const notifications =
    useSyncExternalStore(
      subscribeToNotifications,
      getNotificationsSnapshot,
      getNotificationsServerSnapshot
    );

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  /* -------------------- Patient Notifications -------------------- */

  const patientNotifications = useMemo(() => {
    if (!patient) {
      return [];
    }

    return notifications
      .filter(
        (notification) =>
          notification.userId ===
          patient.id
      )
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );
  }, [notifications, patient]);

  const unreadNotificationCount =
    useMemo(() => {
      if (!patient) {
        return 0;
      }

      return getUnreadNotificationCount(
        patient.id
      );
    }, [patient]);

  /* -------------------- Upcoming Appointments -------------------- */

  const upcomingAppointments = useMemo(() => {
    if (!patient) {
      return [];
    }

    const now = new Date();

    return appointments
      .filter((appointment) => {
        if (
          appointment.patient.id !==
          patient.id
        ) {
          return false;
        }

        const appointmentDate =
          new Date(
            appointment.startsAt
          );

        return (
          appointmentDate >= now &&
          appointment.status !==
            "cancelled" &&
          appointment.status !==
            "completed" &&
          appointment.status !==
            "missed"
        );
      })
      .sort(
        (a, b) =>
          new Date(
            a.startsAt
          ).getTime() -
          new Date(
            b.startsAt
          ).getTime()
      );
  }, [appointments, patient]);

  /* -------------------- Appointment Counts -------------------- */

  const completedCount =
    appointments.filter(
      (appointment) =>
        appointment.patient.id ===
          patient?.id &&
        appointment.status ===
          "completed"
    ).length;

  const cancelledCount =
    appointments.filter(
      (appointment) =>
        appointment.patient.id ===
          patient?.id &&
        appointment.status ===
          "cancelled"
    ).length;

  const missedCount =
    appointments.filter(
      (appointment) =>
        appointment.patient.id ===
          patient?.id &&
        appointment.status ===
          "missed"
    ).length;

  /* -------------------- Formatting -------------------- */

  const formatDate = (
    dateString: string
  ) => {
    return new Date(
      dateString
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (
    dateString: string
  ) => {
    return new Date(
      dateString
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const formatNotificationTime = (
    dateString: string
  ) => {
    return new Date(
      dateString
    ).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  /* -------------------- Appointment Status Style -------------------- */

  const getStatusStyle = (
    status: Appointment["status"]
  ) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700";

      case "pending":
        return "bg-amber-50 text-amber-700";

      case "upcoming":
        return "bg-blue-50 text-blue-700";

      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  /* -------------------- Notification Icon -------------------- */

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

  /* -------------------- Notification Actions -------------------- */

  const handleNotificationClick = (
  notification: Notification
) => {
  if (!notification.read) {
    markNotificationAsRead(
      notification.id
    );
  }

  if (notification.type === "reminder") {
    router.push("/appointments");
  }
};

  const handleMarkAllAsRead = () => {
    if (!patient) {
      return;
    }

    markAllNotificationsAsRead(
      patient.id
    );
  };

  /* -------------------- Login Required -------------------- */

  if (!patient) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-10">

          <div className="text-4xl">
            👤
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Patient Login Required
          </h1>

          <p className="mt-2 text-slate-500">
            Please login to access your
            patient dashboard.
          </p>

          <Link
            href="/login/patient"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Patient Login
          </Link>

        </div>
        <SchedulaAICareAssistant />
      </main>
    );
  }

  /* -------------------- Dashboard UI -------------------- */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[294px] shrink-0 bg-emerald-700 text-white lg:flex lg:flex-col">
          <div className="flex h-[103px] items-center border-b border-emerald-500/40 px-6">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-white text-xl font-extrabold text-emerald-700 shadow-sm">
                S
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight">Schedula</p>
                <p className="text-sm text-emerald-50">Patient Portal</p>
              </div>
            </div>
          </div>

          <div className="px-3 py-7">
            <p className="px-3 text-sm font-bold uppercase tracking-wide text-emerald-100">
              MENU
            </p>

            <nav className="mt-4 space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-4 rounded-2xl bg-emerald-600/70 px-5 py-4 text-sm font-bold shadow-sm transition-all duration-200 hover:bg-emerald-500"
              >
                <span className="text-lg">▦</span>
                Dashboard
              </Link>

              <Link
                href="/doctors"
                className="flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200 hover:bg-emerald-600/70"
              >
                <span className="text-lg">▣</span>
                Find a Doctor
              </Link>

              <Link
                href="/appointments"
                className="flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200 hover:bg-emerald-600/70"
              >
                <span className="text-lg">▤</span>
                Appointments
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200 hover:bg-emerald-600/70"
              >
                <span className="text-lg">♙</span>
                My Profile
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Area */}
        <div className="min-w-0 flex-1">
          {/* Top Bar */}
          <header className="flex min-h-[90px] items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm sm:px-8 lg:px-11">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 lg:hidden">
                Schedula
              </p>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((open) => !open)}
                  aria-label="Open notifications"
                  className="grid size-12 place-items-center rounded-xl border border-slate-200 bg-white text-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  🔔
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3.5">
                      <div>
                        <h2 className="font-bold tracking-tight text-slate-900">
                          Notifications
                        </h2>
                        <p className="text-xs text-slate-500">
                          {unreadNotificationCount} unread
                        </p>
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto overscroll-contain">
                      {patientNotifications.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                          <div className="text-3xl">🔔</div>
                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No notifications
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            You&apos;re all caught up.
                          </p>
                        </div>
                      ) : (
                        patientNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                              notification.read ? "bg-white" : "bg-emerald-50/50"
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-100 bg-white shadow-sm">
                                {getNotificationIcon(notification.type)}
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
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {notification.message}
                                </p>
                                <p className="mt-2 text-[11px] text-slate-400">
                                  {formatNotificationTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                <p className="text-xs text-slate-500">Patient</p>
              </div>

              <div className="grid size-12 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700 ring-4 ring-emerald-50">
                {patient.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8 lg:px-11 lg:py-11">
            <div className="mx-auto max-w-7xl">
              {/* Welcome */}
              <section className="mb-10">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-600">
                  Patient Dashboard
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Good day, {patient.name}
                </h2>
                <p className="mt-2 text-base text-slate-500 sm:text-lg">
                  Here&apos;s an overview of your appointments and healthcare journey.
                </p>
              </section>

              {/* Stats */}
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500">Upcoming Appointments</p>
                  <p className="mt-4 text-4xl font-extrabold text-slate-950">
                    {upcomingAppointments.length}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Scheduled appointments</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500">Completed</p>
                  <p className="mt-4 text-4xl font-extrabold text-emerald-600">{completedCount}</p>
                  <p className="mt-3 text-sm text-slate-400">Completed appointments</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500">Cancelled</p>
                  <p className="mt-4 text-4xl font-extrabold text-red-500">{cancelledCount}</p>
                  <p className="mt-3 text-sm text-slate-400">Cancelled appointments</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500">Missed</p>
                  <p className="mt-4 text-4xl font-extrabold text-amber-500">{missedCount}</p>
                  <p className="mt-3 text-sm text-slate-400">Missed appointments</p>
                </div>
              </section>

              {/* Quick Navigation */}
              <section className="mt-11">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Quick Navigation</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your patient portal.</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Link
                    href="/doctors"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">Find a Doctor</h3>
                      <p className="mt-1 text-sm text-slate-500">Browse doctors and book an appointment.</p>
                    </div>
                    <span className="text-2xl text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>

                  <Link
                    href="/appointments"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">Appointments</h3>
                      <p className="mt-1 text-sm text-slate-500">View and manage your appointments.</p>
                    </div>
                    <span className="text-2xl text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>

                  <Link
                    href="/appointments"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">Appointment History</h3>
                      <p className="mt-1 text-sm text-slate-500">View completed, cancelled and missed appointments.</p>
                    </div>
                    <span className="text-2xl text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>

                  <Link
                    href="/profile"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900">My Profile</h3>
                      <p className="mt-1 text-sm text-slate-500">View and manage your personal information.</p>
                    </div>
                    <span className="text-2xl text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </section>

              {/* Upcoming Appointments */}
              <section className="mt-11">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Upcoming Appointments</h2>
                    <p className="mt-1 text-sm text-slate-500">Your upcoming patient visits.</p>
                  </div>
                  <Link
                    href="/appointments"
                    className="inline-flex w-fit text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {upcomingAppointments.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                      <div className="text-4xl">📅</div>
                      <h3 className="mt-4 font-bold text-slate-900">No Upcoming Appointments</h3>
                      <p className="mt-2 text-sm text-slate-500">You don&apos;t have any upcoming appointments.</p>
                      <Link
                        href="/doctors"
                        className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        Book an Appointment
                      </Link>
                    </div>
                  ) : (
                    upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-100 font-bold text-emerald-700 ring-4 ring-emerald-50">
                              {appointment.clinician
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900">{appointment.clinician}</h3>
                              <p className="mt-1 text-sm text-slate-500">{appointment.specialty}</p>
                              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                                <span>📅 {formatDate(appointment.startsAt)}</span>
                                <span>🕐 {formatTime(appointment.startsAt)}</span>
                                <span>💻 Consultation</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <span
                              className={`inline-flex rounded-full border border-current/10 px-3 py-1.5 text-xs font-bold capitalize shadow-sm ${getStatusStyle(
                                appointment.status
                              )}`}
                            >
                              {appointment.status}
                            </span>
                            <Link
                              href="/appointments"
                              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                            >
                              View Appointment
                            </Link>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Duration</p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">{appointment.durationMinutes} minutes</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Appointment Type</p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">Consultation</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Room</p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">{appointment.room}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Additional Summary */}
              <section className="mt-11 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500">Missed Appointments</p>
                  <p className="mt-3 text-3xl font-extrabold text-slate-950">{missedCount}</p>
                  <Link
                    href="/appointments"
                    className="mt-3 inline-block text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    View Appointments
                  </Link>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <p className="text-sm font-semibold text-emerald-700">Need a Doctor?</p>
                  <p className="mt-1 text-sm text-emerald-800/80">Find a doctor and book your next appointment.</p>
                  <Link
                    href="/doctors"
                    className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
                  >
                    Find Doctor
                  </Link>
                </div>
              </section>

              <SchedulaAICareAssistant />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
