"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot } from "@/types/availability";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = () => {
      const storedAppointments =
        localStorage.getItem("appointments");

      if (storedAppointments) {
        try {
          const parsedAppointments =
            JSON.parse(storedAppointments) as Appointment[];

          setAppointments(parsedAppointments);
        } catch {
          setAppointments([]);
        }
      } else {
        setAppointments([]);
      }

      setLoading(false);
    };

    const timer = window.setTimeout(loadAppointments, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleCancel = (appointment: Appointment) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    /*
     * Mark appointment as cancelled.
     */
    const updatedAppointments = appointments.map(
      (item) =>
        item.id === appointment.id
          ? {
              ...item,
              status: "cancelled" as const,
            }
          : item
    );

    /*
     * Save updated appointments.
     */
    localStorage.setItem(
      "appointments",
      JSON.stringify(updatedAppointments)
    );

    setAppointments(updatedAppointments);

    /*
     * Get appointment date and time.
     */
    const appointmentDate = new Date(
      appointment.startsAt
    );

    const year = appointmentDate.getFullYear();

    const month = String(
      appointmentDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      appointmentDate.getDate()
    ).padStart(2, "0");

    const date = `${year}-${month}-${day}`;

    const hours = String(
      appointmentDate.getHours()
    ).padStart(2, "0");

    const minutes = String(
      appointmentDate.getMinutes()
    ).padStart(2, "0");

    const startTime = `${hours}:${minutes}`;

    /*
     * Get logged-in / registered doctor.
     */
    const registeredDoctor =
      localStorage.getItem("registeredDoctor");

    if (!registeredDoctor) {
      return;
    }

    try {
      const doctor = JSON.parse(
        registeredDoctor
      ) as {
        id: string;
      };

      /*
       * Doctor ID must exist.
       */
      if (!doctor.id) {
        return;
      }

      /*
       * Get this doctor's availability slots.
       */
      const storageKey =
        `availabilitySlots-${doctor.id}`;

      const storedSlots =
        localStorage.getItem(storageKey);

      if (!storedSlots) {
        return;
      }

      const slots =
        JSON.parse(storedSlots) as AvailabilitySlot[];

      /*
       * Make only the cancelled appointment's
       * matching slot available again.
       */
      const updatedSlots = slots.map(
        (slot) =>
          slot.date === date &&
          slot.startTime === startTime &&
          slot.status === "booked"
            ? {
                ...slot,
                status: "available" as const,
              }
            : slot
      );

      /*
       * Save updated availability.
       */
      localStorage.setItem(
        storageKey,
        JSON.stringify(updatedSlots)
      );
    } catch {
      /*
       * Appointment cancellation has already
       * been saved even if slot update fails.
       */
    }
  };

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
            All Appointments
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your complete appointment schedule.
          </p>
        </header>

        {appointments.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-medium">
              No appointments found.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Your appointments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article
                key={`${appointment.id}-${appointment.status}`}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {appointment.patient.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {appointment.reason}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${
                      appointment.status === "cancelled"
                        ? "border-red-300 bg-red-50 text-red-700"
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
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(
                        new Date(appointment.startsAt)
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Duration
                    </p>

                    <p className="mt-1 font-medium">
                      {appointment.durationMinutes} minutes
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

                {appointment.status === "confirmed" && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCancel(appointment)
                      }
                      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}