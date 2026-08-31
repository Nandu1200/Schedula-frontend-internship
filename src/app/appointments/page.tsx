"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "@/types/appointment";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = () => {
      const storedPatient =
        localStorage.getItem("loggedInPatient");

      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedPatient || !storedAppointments) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        const patient = JSON.parse(storedPatient) as {
          name: string;
          id: string;
        };

        const allAppointments =
          JSON.parse(storedAppointments) as Appointment[];

        const patientAppointments =
          allAppointments.filter(
            (appointment) =>
              appointment.patient.name === patient.name
          );

        setAppointments(patientAppointments);
      } catch {
        setAppointments([]);
      }

      setLoading(false);
    };

    const timer = window.setTimeout(
      loadAppointments,
      0
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Loading appointments...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            My Appointments
          </h1>

          <p className="mt-2 text-gray-500">
            View your upcoming and previous appointments.
          </p>
        </header>

        {appointments.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-medium">
              No appointments found.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Your booked appointments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {appointment.clinician}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {appointment.specialty}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${
                      appointment.status === "cancelled"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : appointment.status ===
                          "pending"
                        ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Date & Time
                    </p>

                    <p className="mt-1 font-medium">
                      {new Intl.DateTimeFormat(
                        "en-IN",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      ).format(
                        new Date(
                          appointment.startsAt
                        )
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Duration
                    </p>

                    <p className="mt-1 font-medium">
                      {appointment.durationMinutes}{" "}
                      minutes
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Room
                    </p>

                    <p className="mt-1 font-medium">
                      {appointment.room}
                    </p>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="text-sm text-gray-500">
                    Reason
                  </p>

                  <p className="mt-1 font-medium">
                    {appointment.reason}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}