"use client";

import Link from "next/link";
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
    }, [notifications, patient]);

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
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">

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
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Patient Login
          </Link>

        </div>
      </main>
    );
  }

  /* -------------------- Dashboard UI -------------------- */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Patient Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome, {patient.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your appointments and
              healthcare journey.
            </p>
          </div>

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
                className="relative grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50"
              >
                🔔

                {unreadNotificationCount >
                  0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadNotificationCount >
                    9
                      ? "9+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                    <div>
                      <h2 className="font-bold text-slate-900">
                        Notifications
                      </h2>

                      <p className="text-xs text-slate-500">
                        {unreadNotificationCount}{" "}
                        unread
                      </p>
                    </div>

                    {unreadNotificationCount >
                      0 && (
                      <button
                        type="button"
                        onClick={
                          handleMarkAllAsRead
                        }
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Mark all as read
                      </button>
                    )}

                  </div>

                  {/* Notification List */}
                  <div className="max-h-[420px] overflow-y-auto">

                    {patientNotifications.length ===
                    0 ? (
                      <div className="px-5 py-10 text-center">

                        <div className="text-3xl">
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
                      patientNotifications.map(
                        (notification) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            className={`w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                              notification.read
                                ? "bg-white"
                                : "bg-emerald-50/50"
                            }`}
                          >

                            <div className="flex gap-3">

                              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-sm">
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
                                    {
                                      notification.title
                                    }
                                  </p>

                                  {!notification.read && (
                                    <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />
                                  )}

                                </div>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {
                                    notification.message
                                  }
                                </p>

                                <p className="mt-2 text-[11px] text-slate-400">
                                  {formatNotificationTime(
                                    notification.createdAt
                                  )}
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

            {/* Find Doctor */}
            <Link
              href="/doctors"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Find a Doctor
            </Link>

          </div>

        </header>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Upcoming Appointments
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {upcomingAppointments.length}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {completedCount}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Cancelled
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {cancelledCount}
            </p>

          </div>

        </section>

        {/* Quick Actions */}
        <section className="mt-8">

          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

         <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/doctors"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="text-2xl">
                👨‍⚕️
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Find a Doctor
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Browse doctors and book an
                appointment.
              </p>

            </Link>

            <Link
              href="/appointments"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="text-2xl">
                📅
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                My Appointments
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your
                appointments.
              </p>

            </Link>

            <Link
              href="/appointments"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <div className="text-2xl">
                📋
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Appointment History
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View completed, cancelled and
                missed appointments.
              </p>

            </Link>
                        <Link
              href="/profile"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-2xl">
                👤
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                My Profile
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your personal information.
              </p>
            </Link>

          </div>

        </section>

        {/* Upcoming Appointments */}
        <section className="mt-8">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-bold text-slate-900">
              Upcoming Appointments
            </h2>

            <Link
              href="/appointments"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </Link>

          </div>

          <div className="mt-4 space-y-4">

            {upcomingAppointments.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">

                <div className="text-4xl">
                  📅
                </div>

                <h3 className="mt-3 font-bold text-slate-900">
                  No Upcoming Appointments
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  You don&apos;t have any
                  upcoming appointments.
                </p>

                <Link
                  href="/doctors"
                  className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Book an Appointment
                </Link>

              </div>
            ) : (
              upcomingAppointments.map(
                (appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* Doctor Information */}
                      <div className="flex items-start gap-4">

                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                          {appointment.clinician
                            .split(" ")
                            .map(
                              (part) =>
                                part[0]
                            )
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div>

                          <h3 className="font-bold text-slate-900">
                            {
                              appointment.clinician
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              appointment.specialty
                            }
                          </p>

                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">

                            <span>
                              📅{" "}
                              {formatDate(
                                appointment.startsAt
                              )}
                            </span>

                            <span>
                              🕐{" "}
                              {formatTime(
                                appointment.startsAt
                              )}
                            </span>

                            <span>
                              💻 Consultation
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* Status + Action */}
                      <div className="flex flex-col items-start gap-3 lg:items-end">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(
                            appointment.status
                          )}`}
                        >
                          {
                            appointment.status
                          }
                        </span>

                        <Link
                          href="/appointments"
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View Appointment
                        </Link>

                      </div>

                    </div>

                    {/* Appointment Details */}
                    <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">

                      <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Duration
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {
                            appointment.durationMinutes
                          }{" "}
                          minutes
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Appointment Type
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          Consultation
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Room
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {
                            appointment.room
                          }
                        </p>

                      </div>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </section>

        {/* Additional Summary */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Missed Appointments
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {missedCount}
            </p>

            <Link
              href="/appointments"
              className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View Appointments
            </Link>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

            <p className="text-sm font-semibold text-emerald-700">
              Need a Doctor?
            </p>

            <p className="mt-1 text-sm text-emerald-800/80">
              Find a doctor and book your next
              appointment.
            </p>

            <Link
              href="/doctors"
              className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Find Doctor
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}