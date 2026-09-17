"use client";

import { useSyncExternalStore } from "react";
import { doctors } from "@/lib/mock-data/doctors";
import { patients } from "@/lib/mock-data/patients";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";
import type { Appointment } from "@/types/appointment";

let appointmentsSnapshot: Appointment[] = [];
let doctorsSnapshot = doctors;
let patientsSnapshot = patients;

const readAppointmentsFromStorage = (): Appointment[] => {
  try {
    const storedAppointments =
      localStorage.getItem("appointments");

    if (!storedAppointments) {
      return [];
    }

    const parsedAppointments = JSON.parse(
      storedAppointments
    ) as unknown;

    return Array.isArray(parsedAppointments)
      ? (parsedAppointments as Appointment[])
      : [];
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

const getPendingVerifications = (
  registeredDoctors: typeof doctors
): number => {
  return registeredDoctors.filter((doctor) => {
    const adminDoctor = adminDoctors.find(
      (item) => item.doctorId === doctor.id
    );

    return (
      !adminDoctor ||
      adminDoctor.verificationStatus === "pending"
    );
  }).length;
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

  const upcomingAppointments =
    getUpcomingAppointments(appointments);

  const completedAppointments =
    getCompletedAppointments(appointments);

  const pendingVerifications =
    getPendingVerifications(registeredDoctors);

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
            Basic appointment activity overview.
          </p>

          <div className="mt-6 flex h-40 items-end justify-between gap-3">
            {[35, 55, 45, 70, 50, 80, 65].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className="w-full max-w-10 rounded-t-lg bg-emerald-200"
                    style={{ height: `${height}%` }}
                  />

                  <span className="text-xs text-slate-400">
                    {
                      [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                      ][index]
                    }
                  </span>
                </div>
              )
            )}
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