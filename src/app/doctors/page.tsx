"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot } from "@/types/availability";

type RegisteredDoctor = {
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

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch("/api/appointments");

        if (!response.ok) {
          throw new Error("Failed to load doctors");
        }

        const result = (await response.json()) as {
          data: Appointment[];
        };

        let doctorList = result.data;

        /*
         * Get registered doctor from localStorage.
         */
        const storedDoctor =
          localStorage.getItem("registeredDoctor");

        if (storedDoctor) {
          const registeredDoctor =
            JSON.parse(storedDoctor) as RegisteredDoctor;

          /*
           * Get this doctor's availability slots.
           */
          const storedSlots = localStorage.getItem(
            `availabilitySlots-${registeredDoctor.id}`
          );

          let doctorSlots: AvailabilitySlot[] = [];

          if (storedSlots) {
            const parsedSlots = JSON.parse(
              storedSlots
            ) as AvailabilitySlot[];

            doctorSlots = parsedSlots.filter(
              (slot) =>
                slot.doctorId === registeredDoctor.id
            );
          }

          /*
           * Only use available slots for showing
           * the appointment date/time.
           */
          const availableSlots = doctorSlots.filter(
            (slot) => slot.status === "available"
          );

          /*
           * Sort all slots by date and time.
           */
          doctorSlots.sort((first, second) => {
            const firstValue =
              `${first.date} ${first.startTime}`;

            const secondValue =
              `${second.date} ${second.startTime}`;

            return firstValue.localeCompare(secondValue);
          });

          /*
           * Sort available slots separately.
           */
          availableSlots.sort((first, second) => {
            const firstValue =
              `${first.date} ${first.startTime}`;

            const secondValue =
              `${second.date} ${second.startTime}`;

            return firstValue.localeCompare(secondValue);
          });

          /*
           * If an available slot exists,
           * show that slot.
           *
           * If everything is booked, use the
           * latest slot only for displaying the doctor.
           */
          const displaySlot =
            availableSlots[0] ?? doctorSlots[0];

          let startsAt = new Date().toISOString();

          if (displaySlot) {
            startsAt = new Date(
              `${displaySlot.date}T${displaySlot.startTime}:00`
            ).toISOString();
          }

          /*
           * Create registered doctor object.
           */
          const registeredDoctorAppointment =
            {
              id: registeredDoctor.id,

              clinician: registeredDoctor.name,

              specialty: registeredDoctor.specialty,

              startsAt,

              room: "Consultation Room",

              durationMinutes: 30,

              status: "confirmed",

              reason: "Doctor availability",

              patient: {
                name: registeredDoctor.name,

                initials: registeredDoctor.name
                  .replace(/^Dr\.\s*/i, "")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase(),

                age: 0,
              },
            } as Appointment;

          /*
           * Prevent duplicate doctor.
           */
          const alreadyExists = doctorList.some(
            (doctor) =>
              doctor.id === registeredDoctor.id
          );

          if (!alreadyExists) {
            doctorList = [
              ...doctorList,
              registeredDoctorAppointment,
            ];
          }
        }

        setDoctors(doctorList);
        setLoading(false);
      } catch {
        setError("We couldn't load doctors.");
        setLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const handleBooking = (doctorId: string) => {
    router.push(`/booking?doctorId=${doctorId}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            Doctors
          </h1>

          <p className="mt-2 text-gray-500">
            Select a doctor to book an appointment.
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">
              Loading doctors...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl bg-white p-8 text-center shadow-sm"
            role="alert"
          >
            <p className="font-medium text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* Doctors */}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                {/* Doctor Information */}
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

                {/* Appointment */}
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500">
                    Available appointment
                  </p>

                  <p className="mt-1 font-medium">
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(
                      new Date(doctor.startsAt)
                    )}
                  </p>
                </div>

                {/* Booking Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleBooking(doctor.id)
                  }
                  className="mt-6 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Book Appointment
                </button>
              </article>
            ))}
          </div>
        )}

        {/* No Doctors */}
        {!loading &&
          !error &&
          doctors.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center">
              <p className="font-medium">
                No doctors available.
              </p>
            </div>
          )}
      </div>
    </main>
  );
}