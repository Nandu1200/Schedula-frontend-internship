"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

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

type LoggedInPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
};

function BookingContent() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");

  const [selectedDoctor, setSelectedDoctor] =
    useState<Appointment | null>(null);

  const [availableSlots, setAvailableSlots] = useState<
    AvailabilitySlot[]
  >([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slotMessage, setSlotMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const confirmLock = useRef(false);

  const getTodayDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getTodayDate();

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const response = await fetch("/api/appointments");

        let apiDoctor: Appointment | undefined;

        if (response.ok) {
          const result = (await response.json()) as {
            data: Appointment[];
          };

          apiDoctor = result.data.find(
            (item) => item.id === doctorId
          );
        }

        if (apiDoctor) {
          setSelectedDoctor(apiDoctor);

          const storedSlots = localStorage.getItem(
            `availabilitySlots-${apiDoctor.id}`
          );

          if (storedSlots) {
            const parsedSlots = JSON.parse(
              storedSlots
            ) as AvailabilitySlot[];

            const doctorSlots = parsedSlots.filter(
              (slot) =>
                slot.doctorId === apiDoctor!.id &&
                slot.status === "available" &&
                slot.date >= today
            );

            doctorSlots.sort((first, second) => {
              const firstValue =
                `${first.date} ${first.startTime}`;

              const secondValue =
                `${second.date} ${second.startTime}`;

              return firstValue.localeCompare(secondValue);
            });

            setAvailableSlots(doctorSlots);

            if (doctorSlots.length > 0) {
              setSelectedDate(doctorSlots[0].date);
            }
          }
        } else {
          const storedDoctor =
            localStorage.getItem("registeredDoctor");

          if (storedDoctor) {
            const registeredDoctor =
              JSON.parse(storedDoctor) as RegisteredDoctor;

            if (registeredDoctor.id === doctorId) {
              const initials = registeredDoctor.name
                .replace(/^Dr\.\s*/i, "")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const doctorForBooking = {
                id: registeredDoctor.id,
                clinician: registeredDoctor.name,
                specialty: registeredDoctor.specialty,
                startsAt: new Date().toISOString(),
                patient: {
                  initials,
                },
                room: "Consultation Room",
              } as Appointment;

              setSelectedDoctor(doctorForBooking);

              const storedSlots = localStorage.getItem(
                `availabilitySlots-${registeredDoctor.id}`
              );

              if (storedSlots) {
                const parsedSlots = JSON.parse(
                  storedSlots
                ) as AvailabilitySlot[];

                const doctorSlots = parsedSlots.filter(
                  (slot) =>
                    slot.doctorId === registeredDoctor.id &&
                    slot.status === "available" &&
                    slot.date >= today
                );

                doctorSlots.sort((first, second) => {
                  const firstValue =
                    `${first.date} ${first.startTime}`;

                  const secondValue =
                    `${second.date} ${second.startTime}`;

                  return firstValue.localeCompare(
                    secondValue
                  );
                });

                setAvailableSlots(doctorSlots);

                if (doctorSlots.length > 0) {
                  setSelectedDate(doctorSlots[0].date);
                }
              }
            }
          }
        }
      } catch {
        setSlotMessage(
          "Unable to load booking details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [doctorId, today]);

  const selectedDateSlots = availableSlots
    .filter(
      (slot) =>
        slot.date === selectedDate &&
        slot.status === "available"
    )
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const date = event.target.value;

    if (date < today) {
      return;
    }

    setSelectedDate(date);
    setSelectedTime("");
    setSlotMessage("");
  };

  const handleTimeSelect = (time: string) => {
    if (confirmLock.current) {
      return;
    }

    setSelectedTime(time);
    setSlotMessage("");
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time
      .split(":")
      .map(Number);

    return hours * 60 + minutes;
  };

  const handleConfirm = () => {
    if (confirmLock.current) {
      return;
    }

    if (
      !selectedDoctor ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    confirmLock.current = true;
    setConfirming(true);

    if (selectedDate < today) {
      setSlotMessage(
        "Past dates are not allowed."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    const selectedSlot = selectedDateSlots.find(
      (slot) => slot.startTime === selectedTime
    );

    if (!selectedSlot) {
      setSlotMessage(
        "This slot is no longer available."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    const storedPatient =
      localStorage.getItem("loggedInPatient");

    let patient: LoggedInPatient | null = null;

    if (storedPatient) {
      try {
        patient = JSON.parse(
          storedPatient
        ) as LoggedInPatient;
      } catch {
        patient = null;
      }
    }

    if (!patient) {
      setSlotMessage(
        "Please login as a patient before booking an appointment."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    const startsAt = new Date(
      `${selectedSlot.date}T${selectedSlot.startTime}:00`
    );

    const startMinutes = timeToMinutes(
      selectedSlot.startTime
    );

    const endMinutes = timeToMinutes(
      selectedSlot.endTime
    );

    const durationMinutes =
      endMinutes > startMinutes
        ? endMinutes - startMinutes
        : 30;

    /*
     * Same doctor + same date + same time
     * represents the same appointment slot.
     */
    const appointmentId =
      `appointment-${selectedDoctor.id}-${selectedDate}-${selectedTime}`;

    const newAppointment: Appointment = {
      id: appointmentId,
      clinician: selectedDoctor.clinician,
      specialty: selectedDoctor.specialty,
      startsAt: startsAt.toISOString(),
      durationMinutes,
      status: "confirmed",
      room: "Consultation Room",

      patient: {
        name: patient.name,

        initials: patient.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),

        age: patient.age,
      },

      reason: "General consultation",
    };

    /*
     * Get existing appointments.
     */
    const storedAppointments =
      localStorage.getItem("appointments");

    let appointments: Appointment[] = [];

    if (storedAppointments) {
      try {
        appointments = JSON.parse(
          storedAppointments
        ) as Appointment[];
      } catch {
        appointments = [];
      }
    }

    /*
     * Remove old duplicate appointment records.
     */
    const uniqueAppointments =
      appointments.filter(
        (appointment, index, array) =>
          array.findIndex(
            (item) =>
              item.id === appointment.id
          ) === index
      );

    /*
     * Check whether this slot already has
     * an active appointment.
     *
     * Cancelled appointments are allowed
     * to be booked again.
     */
    const alreadyBooked =
      uniqueAppointments.some(
        (appointment) =>
          appointment.id === newAppointment.id &&
          appointment.status !== "cancelled"
      );

    if (alreadyBooked) {
      setSlotMessage(
        "This appointment slot is already booked."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    /*
     * IMPORTANT:
     *
     * Remove the old appointment with the same ID.
     *
     * If the old appointment was cancelled,
     * it will be removed and replaced with
     * the new confirmed appointment.
     */
    const updatedAppointments =
      uniqueAppointments.filter(
        (appointment) =>
          appointment.id !== newAppointment.id
      );

    /*
     * Add the new confirmed appointment.
     */
    updatedAppointments.push(newAppointment);

    /*
     * Save appointments.
     */
    localStorage.setItem(
      "appointments",
      JSON.stringify(updatedAppointments)
    );

    /*
     * Mark selected slot as booked.
     */
    const storedDoctorSlots =
      localStorage.getItem(
        `availabilitySlots-${selectedDoctor.id}`
      );

    if (storedDoctorSlots) {
      try {
        const doctorSlots = JSON.parse(
          storedDoctorSlots
        ) as AvailabilitySlot[];

        const updatedSlots = doctorSlots.map(
          (slot) =>
            slot.id === selectedSlot.id
              ? {
                  ...slot,
                  status: "booked" as const,
                }
              : slot
        );

        localStorage.setItem(
          `availabilitySlots-${selectedDoctor.id}`,
          JSON.stringify(updatedSlots)
        );

        setAvailableSlots(
          updatedSlots.filter(
            (slot) =>
              slot.status === "available" &&
              slot.date >= today
          )
        );
      } catch {
        // Appointment is already saved.
      }
    }

    /*
     * Show confirmation screen.
     */
    setConfirmed(true);
    setConfirming(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Loading booking details...
        </p>
      </main>
    );
  }

  if (!selectedDoctor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Doctor not found
          </h1>

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
                <h1 className="text-3xl font-bold">
                  Book Appointment
                </h1>

                <p className="mt-2 text-gray-500">
                  Select a date and time for your appointment.
                </p>
              </div>

              <section className="mb-8 rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500">
                  Selected Doctor
                </p>

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
                  min={today}
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled={confirming}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Today and future dates only.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-sm font-semibold">
                  Available Time Slots
                </h2>

                {!selectedDate && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">
                      Please select a date first.
                    </p>
                  </div>
                )}

                {selectedDate &&
                  selectedDateSlots.length === 0 && (
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        No available slots for this date.
                      </p>
                    </div>
                  )}

                {selectedDate &&
                  selectedDateSlots.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedDateSlots.map(
                        (slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={confirming}
                            onClick={() =>
                              handleTimeSelect(
                                slot.startTime
                              )
                            }
                            className={`rounded-lg border px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                              selectedTime ===
                              slot.startTime
                                ? "border-black bg-black text-white"
                                : "border-gray-300 bg-white hover:border-black"
                            }`}
                          >
                            {slot.startTime}
                            {" - "}
                            {slot.endTime}
                          </button>
                        )
                      )}
                    </div>
                  )}
              </section>

              {slotMessage && (
                <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {slotMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !selectedDate ||
                  !selectedTime ||
                  selectedDate < today ||
                  confirming
                }
                className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {confirming
                  ? "Confirming..."
                  : "Confirm Appointment"}
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
                  <p className="text-sm text-gray-500">
                    Doctor
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedDoctor.clinician}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">
                    Specialty
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedDoctor.specialty}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">
                    Date
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedDate}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-gray-500">
                    Time
                  </p>

                  <p className="mt-1 font-semibold">
                    {selectedTime}
                  </p>
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
          <p className="text-gray-500">
            Loading booking page...
          </p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}