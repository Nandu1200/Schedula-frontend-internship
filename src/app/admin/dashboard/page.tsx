"use client";

import { useSyncExternalStore } from "react";
import { doctors } from "@/lib/mock-data/doctors";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";
import type { AdminDoctorStatus } from "@/types/admin";
import { patients } from "@/lib/mock-data/patients";
import { buildPaymentsFromAppointments } from "@/lib/mock-data/payments";
import { calculateAdminAnalytics } from "@/lib/utils/admin-analytics";
import { getAdminAppointments } from "@/lib/utils/admin-appointments";
import type { Appointment } from "@/types/appointment";
import type { AdminDoctor } from "@/types/admin";

let appointmentsSnapshot: Appointment[] = [];
let doctorsSnapshot = doctors;
let patientsSnapshot = patients;

const readAppointmentsFromStorage = (): Appointment[] => {
  try {
    return getAdminAppointments();
  } catch {
    return [];
  }
};

const readRegisteredDataFromStorage = () => {
  try {
    const registeredDoctor = localStorage.getItem(
      "registeredDoctor"
    );

    const registeredPatient = localStorage.getItem(
      "registeredPatient"
    );

    const parsedDoctor = registeredDoctor
      ? JSON.parse(registeredDoctor)
      : null;

    const parsedPatient = registeredPatient
      ? JSON.parse(registeredPatient)
      : null;

    doctorsSnapshot = parsedDoctor
      ? [...doctors, parsedDoctor]
      : doctors;

    patientsSnapshot = parsedPatient
      ? [...patients, parsedPatient]
      : patients;
  } catch {
    doctorsSnapshot = doctors;
    patientsSnapshot = patients;
  }
};

const subscribeToAppointments = (
  callback: () => void
) => {
  const handleAppointmentUpdate = () => {
    appointmentsSnapshot =
      readAppointmentsFromStorage();

    callback();
  };

  window.addEventListener(
    "storage",
    handleAppointmentUpdate
  );

  window.addEventListener(
    "appointments-updated",
    handleAppointmentUpdate
  );

  appointmentsSnapshot =
    readAppointmentsFromStorage();

  callback();

  return () => {
    window.removeEventListener(
      "storage",
      handleAppointmentUpdate
    );

    window.removeEventListener(
      "appointments-updated",
      handleAppointmentUpdate
    );
  };
};

const subscribeToRegisteredUsers = (
  callback: () => void
) => {
  const handleUserUpdate = () => {
    readRegisteredDataFromStorage();
    callback();
  };

  window.addEventListener(
    "storage",
    handleUserUpdate
  );

  window.addEventListener(
    "registered-user-updated",
    handleUserUpdate
  );

  readRegisteredDataFromStorage();

  callback();

  return () => {
    window.removeEventListener(
      "storage",
      handleUserUpdate
    );

    window.removeEventListener(
      "registered-user-updated",
      handleUserUpdate
    );
  };
};

let pendingVerificationSnapshot = 0;

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

const readPendingVerificationCount = () => {
  const doctorList = [...doctors];

  try {
    const storedDoctor =
      localStorage.getItem("registeredDoctor");

    if (storedDoctor) {
      const registeredDoctor = JSON.parse(
        storedDoctor
      ) as (typeof doctors)[number];

      const alreadyExists = doctorList.some(
        (doctor) => doctor.id === registeredDoctor.id
      );

      if (!alreadyExists) {
        doctorList.push(registeredDoctor);
      }
    }
  } catch {
    // Keep the mock doctor list when stored data is invalid.
  }

  pendingVerificationSnapshot = doctorList.filter(
    (doctor) =>
      getDoctorVerificationStatus(doctor.id) ===
      "pending"
  ).length;
};

const subscribeToVerificationStatus = (
  callback: () => void
) => {
  const handleVerificationUpdate = () => {
    readPendingVerificationCount();
    callback();
  };

  window.addEventListener(
    "storage",
    handleVerificationUpdate
  );

  window.addEventListener(
    "doctor-verification-changed",
    handleVerificationUpdate
  );

  readPendingVerificationCount();
  callback();

  return () => {
    window.removeEventListener(
      "storage",
      handleVerificationUpdate
    );

    window.removeEventListener(
      "doctor-verification-changed",
      handleVerificationUpdate
    );
  };
};

const getPendingVerificationSnapshot = () => {
  return pendingVerificationSnapshot;
};

const getServerPendingVerificationSnapshot = () => {
  return 0;
};

const getAppointmentsSnapshot = (): Appointment[] => {
  return appointmentsSnapshot;
};

const getServerAppointmentsSnapshot =
  (): Appointment[] => {
    return [];
  };

const getDoctorsSnapshot = () => {
  return doctorsSnapshot;
};

const getPatientsSnapshot = () => {
  return patientsSnapshot;
};

const getUpcomingAppointments = (
  appointments: Appointment[]
): number => {
  return appointments.filter(
    (appointment) =>
      appointment.status === "pending" ||
      appointment.status === "confirmed" ||
      appointment.status === "upcoming"
  ).length;
};

const getCompletedAppointments = (
  appointments: Appointment[]
): number => {
  return appointments.filter(
    (appointment) =>
      appointment.status === "completed"
  ).length;
};

const getAnalyticsVerificationDoctors = (
  registeredDoctors: typeof doctors
): AdminDoctor[] => {
  return registeredDoctors.map((doctor) => {
    const existingDoctor = adminDoctors.find(
      (adminDoctor) => adminDoctor.doctorId === doctor.id
    );

    return (
      existingDoctor ?? {
        doctorId: doctor.id,
        verificationStatus: getDoctorVerificationStatus(
          doctor.id
        ),
        registeredAt: "",
      }
    );
  });
};

const formatAnalyticsDate = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
};

export default function AdminDashboardPage() {
  const appointments = useSyncExternalStore(
    subscribeToAppointments,
    getAppointmentsSnapshot,
    getServerAppointmentsSnapshot
  );

  const registeredDoctors = useSyncExternalStore(
    subscribeToRegisteredUsers,
    getDoctorsSnapshot,
    () => doctors
  );

  const registeredPatients = useSyncExternalStore(
    subscribeToRegisteredUsers,
    getPatientsSnapshot,
    () => patients
  );

  const pendingVerifications = useSyncExternalStore(
    subscribeToVerificationStatus,
    getPendingVerificationSnapshot,
    getServerPendingVerificationSnapshot
  );

  const upcomingAppointments =
    getUpcomingAppointments(appointments);

  const completedAppointments =
    getCompletedAppointments(appointments);

  // Existing appointments without an explicit consultation type
  // are treated as in-person, matching the booking requirement.
  const analyticsAppointments = appointments.map(
    (appointment) => ({
      ...appointment,
      consultationType:
        appointment.consultationType ?? "in-person",
    })
  );

  const analyticsPayments =
    buildPaymentsFromAppointments(
      analyticsAppointments,
      registeredDoctors
    );

  const paymentTransactionValue =
    analyticsPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

  const paymentCounts = {
    total: analyticsPayments.length,
    paid: analyticsPayments.filter(
      (payment) => payment.status === "paid"
    ).length,
    pending: analyticsPayments.filter(
      (payment) => payment.status === "pending"
    ).length,
    failed: analyticsPayments.filter(
      (payment) => payment.status === "failed"
    ).length,
    refunded: analyticsPayments.filter(
      (payment) => payment.status === "refunded"
    ).length,
  };

  const analytics = calculateAdminAnalytics(
    analyticsAppointments,
    registeredDoctors,
    registeredPatients,
    getAnalyticsVerificationDoctors(registeredDoctors),
    analyticsPayments
  );

  const appointmentTrendDates = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toISOString().slice(0, 10);
    }
  );

  const appointmentTrend = appointmentTrendDates.map(
    (date) => ({
      date,
      count: appointments.filter(
        (appointment) =>
          appointment.startsAt.slice(0, 10) === date
      ).length,
    })
  );

  const maxAppointmentTrend = Math.max(
    ...appointmentTrend.map((item) => item.count),
    1
  );

  const doctorRegistrationDates = adminDoctors
    .filter((doctor) => doctor.registeredAt)
    .reduce<Record<string, number>>((counts, doctor) => {
      const date = doctor.registeredAt.slice(0, 10);
      counts[date] = (counts[date] ?? 0) + 1;
      return counts;
    }, {});

  // Include the real registered doctor from localStorage.
  // Existing Dr. Samta was registered before registeredAt was added,
  // so use the known 02 Sep 2026 account date without changing or
  // overwriting the existing localStorage record.
  try {
    const storedDoctor = localStorage.getItem(
      "registeredDoctor"
    );

    if (storedDoctor) {
      const registeredDoctor = JSON.parse(
        storedDoctor
      ) as { name?: string; registeredAt?: string };

      let registrationDate =
        typeof registeredDoctor.registeredAt === "string" &&
        registeredDoctor.registeredAt
          ? registeredDoctor.registeredAt.slice(0, 10)
          : "";

      if (
        !registrationDate &&
        typeof registeredDoctor.name === "string" &&
        registeredDoctor.name.trim().toLowerCase() ===
          "dr samta"
      ) {
        registrationDate = "2026-09-02";
      }

      if (registrationDate) {
        doctorRegistrationDates[registrationDate] =
          (doctorRegistrationDates[registrationDate] ?? 0) + 1;
      }
    }
  } catch {
    // Ignore invalid stored doctor data.
  }

  const registrationTrend = Object.entries(
    doctorRegistrationDates
  ) as [string, number][];

  registrationTrend.sort(([first], [second]) =>
    first.localeCompare(second)
  );

  registrationTrend.splice(0, Math.max(0, registrationTrend.length - 7));

  const doctorRegistrationNames: Record<string, string> = {
    "2026-08-15": "Dr. Aman",
    "2026-08-20": "Dr. Narendra",
    "2026-08-24": "Dr. Anika Rao",
    "2026-09-02": "Dr. Samta",
  };

  const maxRegistrationTrend = Math.max(
    ...registrationTrend.map(([, count]) => count),
    1
  );

  const stats = [
    {
      title: "Total Doctors",
      value: registeredDoctors.length,
      icon: "👨‍⚕️",
    },
    {
      title: "Total Patients",
      value: registeredPatients.length,
      icon: "👤",
    },
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: "📅",
    },
    {
      title: "Pending Verifications",
      value: pendingVerifications,
      icon: "✓",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Overview of the Schedula healthcare platform.
        </p>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>

              <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-xl">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Appointment Overview */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Appointment Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Upcoming and completed appointments.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Upcoming
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {upcomingAppointments}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {completedAppointments}
              </p>
            </div>
          </div>
        </div>

        {/* Appointment Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Appointment Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Appointments created across the last 7 days.
          </p>

          {appointmentTrend.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No appointment trend data available
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <div className="flex h-64 min-w-[560px] items-end gap-4 border-b border-slate-200 px-2">
                {appointmentTrend.map((item) => (
                  <div
                    key={item.date}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <span className="mb-2 text-xs font-semibold text-slate-500">
                      {item.count}
                    </span>

                    <div className="flex h-48 w-full max-w-14 items-end justify-center">
                      <div
                        className="w-full rounded-t-lg bg-emerald-400 transition-all"
                        style={{
                          height:
                            item.count === 0
                              ? "0%"
                              : `${Math.max(
                                  8,
                                  (item.count / maxAppointmentTrend) * 100
                                )}%`,
                        }}
                        title={`${item.count} appointments on ${formatAnalyticsDate(
                          item.date
                        )}`}
                      />
                    </div>

                    <span className="mt-3 whitespace-nowrap text-xs text-slate-500">
                      {formatAnalyticsDate(item.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Analytics */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Consultation Type */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Consultation Type
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Online versus in-person appointments.
          </p>

          <div className="mt-6 space-y-5">
            {[
              {
                label: "Online",
                value: analytics.appointments.online,
              },
              {
                label: "In-person",
                value: analytics.appointments.inPerson,
              },
            ].map((item) => {
              const percentage = analytics.appointments.total
                ? Math.round(
                    (item.value /
                      analytics.appointments.total) *
                      100
                  )
                : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.value} ({percentage}%)
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Appointment Status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current appointment status distribution.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              ["Completed", analytics.appointments.completed],
              ["Cancelled", analytics.appointments.cancelled],
              ["Upcoming", analytics.appointments.upcoming],
              ["Pending", analytics.appointments.pending],
              ["Missed", analytics.appointments.missed],
              ["Total", analytics.appointments.total],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-slate-50 p-4"
              >
                <p className="text-xs font-medium text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Doctor Registration Trend
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Registered doctors and their available registration dates.
          </p>

          {registrationTrend.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No registration trend data available
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {registrationTrend.map(([date, count]) => (
                <div key={date}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {doctorRegistrationNames[date] ??
                          "Registered Doctor"}
                      </span>
                      <span className="ml-2 text-slate-500">
                        {formatAnalyticsDate(date)}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${(count / maxRegistrationTrend) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-xs leading-5 text-slate-500">
              Doctors shown here: Dr. Aman, Dr. Narendra, Dr. Anika Rao and Dr. Samta. Existing Dr. Samta data remains in localStorage; no re-registration is required. New doctor registrations use their actual localStorage registration date.
            </p>
          </div>
        </div>

        {/* Payments & Verification */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Payments & Doctor Verification
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Total Payments
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {paymentCounts.total}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Transactions recorded
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Transaction Value
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ₹{paymentTransactionValue.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total recorded payment value
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">
                  Paid
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-800">
                  {paymentCounts.paid}
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Completed
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  Pending
                </p>
                <p className="mt-2 text-xl font-bold text-amber-800">
                  {paymentCounts.pending}
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  Awaiting
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  Failed
                </p>
                <p className="mt-2 text-xl font-bold text-red-800">
                  {paymentCounts.failed}
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Failed attempts
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-sm text-purple-700">
                  Refunded
                </p>
                <p className="mt-2 text-xl font-bold text-purple-800">
                  {paymentCounts.refunded}
                </p>
                <p className="mt-1 text-xs text-purple-600">
                  Payments returned
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-slate-700">
                Doctor Verification
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-emerald-700">
                    {analytics.doctorVerification.approved}
                  </p>
                  <p className="text-xs text-slate-500">Approved</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-700">
                    {analytics.doctorVerification.pending}
                  </p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-700">
                    {analytics.doctorVerification.rejected}
                  </p>
                  <p className="text-xs text-slate-500">Rejected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Appointments
          </h2>

          {appointments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No recent appointments
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Appointment activity will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {appointments
                .slice(-5)
                .reverse()
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {appointment.patient.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {appointment.clinician}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {appointment.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Recent Doctors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Doctors
          </h2>

          <div className="mt-6 space-y-3">
            {registeredDoctors
              .slice(-5)
              .reverse()
              .map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {doctor.name}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {doctor.specialty}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Doctor
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}