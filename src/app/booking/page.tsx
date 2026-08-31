"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Appointment } from "@/types/appointment";

function BookingContent() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");

  const [selectedDoctor, setSelectedDoctor] =
    useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const availableTimes = [
    "09:00 AM",
    "10:00 AM",
    "11:15 AM",
    "02:00 PM",
    "04:00 PM",
  ];

  useEffect(() => {
    fetch("/api/appointments")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load doctors");
        }

        return response.json() as Promise<{ data: Appointment[] }>;
      })
      .then(({ data }) => {
        const doctor = data.find((item) => item.id === doctorId);

        if (doctor) {
          setSelectedDoctor(doctor);
        }

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [doctorId]);

  const handleConfirm = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      return;
    }

    setConfirmed(true);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading booking details...</p>
      </main>
    );
  }

  if (!selectedDoctor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Doctor not found</h1>
          <p className="mt-2 text-gray-500">
            Please select a doctor from the doctor listing.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          {!confirmed ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Book Appointment</h1>
                <p className="mt-2 text-gray-500">
                  Select a date and time for your appointment.
                </p>
              </div>

              <section className="mb-8 rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500">Selected Doctor</p>
                <h2 className="mt-2 text-xl font-semibold">
                  {selectedDoctor.clinician}
                </h2>
                <p className="mt-1 text-gray-500">
                  {selectedDoctor.specialty}
                </p>
              </section>

              <section className="mb-8">
                <label
                  htmlFor="appointment-date"
                  className="mb-2 block text-sm font-semibold"
                >
                  Select Date
                </label>

                <input
                  id="appointment-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold">
                  Available Time Slots
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                        selectedTime === time
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white hover:border-black"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime}
                className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Confirm Appointment
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-2xl">
                ✓
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                Appointment Confirmed!
              </h1>

              <p className="mt-2 text-gray-500">
                Your appointment has been successfully confirmed.
              </p>

              <div className="mt-8 rounded-xl border border-gray-200 p-5 text-left">
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="mt-1 font-semibold">
                    {selectedDoctor.clinician}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">Specialty</p>
                  <p className="mt-1 font-semibold">
                    {selectedDoctor.specialty}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="mt-1 font-semibold">{selectedDate}</p>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="mt-1 font-semibold">{selectedTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading booking page...</p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}