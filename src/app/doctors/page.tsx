"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/types/appointment";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetch("/api/appointments")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load doctors");
        }

        return response.json() as Promise<{ data: Appointment[] }>;
      })
      .then(({ data }) => {
        setDoctors(data);
        setLoading(false);
      })
      .catch(() => {
        setError("We couldn't load doctors.");
        setLoading(false);
      });
  }, []);

  const handleBooking = (doctorId: string) => {
  router.push(`/booking?doctorId=${doctorId}`);

  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Doctors</h1>

          <p className="mt-2 text-gray-500">
            Select a doctor to book an appointment.
          </p>
        </header>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">Loading doctors...</p>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl bg-white p-8 text-center shadow-sm"
            role="alert"
          >
            <p className="font-medium text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                    {doctor.patient.initials}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      {doctor.clinician}
                    </h2>

                    <p className="text-sm text-gray-500">
                      {doctor.specialty}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500">
                    Available appointment
                  </p>

                  <p className="mt-1 font-medium">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(doctor.startsAt))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleBooking(doctor.id)}
                  className="mt-6 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Book Appointment
                </button>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center">
            <p className="font-medium">No doctors available.</p>
          </div>
        )}
      </div>
    </main>
  );
}