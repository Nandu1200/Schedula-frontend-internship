"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import { addNotification } from "@/lib/utils/notifications";
import { useAppDispatch } from "@/store/hooks";
import { setAppointments } from "@/store/appointmentSlice";

import type { Doctor } from "@/types/doctor";
import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot } from "@/types/availability";

type LoggedInPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
};

function BookingContent() {
  const searchParams = useSearchParams();

  const dispatch = useAppDispatch();

  const doctorId = searchParams.get("doctorId");
  const slotId = searchParams.get("slotId");

  const [selectedDoctor, setSelectedDoctor] =
    useState<Doctor | null>(null);

  const [selectedSlot, setSelectedSlot] =
    useState<AvailabilitySlot | null>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "upi" | "card" | "netbanking"
  >("upi");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentTransactionId, setPaymentTransactionId] = useState("");

  const confirmLock = useRef(false);

  useEffect(() => {
    const loadBookingData = () => {
      try {
        if (!doctorId || !slotId) {
          setMessage(
            "Doctor or appointment slot was not selected."
          );
          setLoading(false);
          return;
        }

        /*
         * Get all doctors.
         */
        const doctorList = [...mockDoctors];

        /*
         * Add currently registered doctor.
         */
        const storedDoctor =
          localStorage.getItem("registeredDoctor");

        if (storedDoctor) {
          const registeredDoctor =
            JSON.parse(storedDoctor) as Doctor;

          const alreadyExists = doctorList.some(
            (doctor) => doctor.id === registeredDoctor.id
          );

          if (!alreadyExists) {
            doctorList.push(registeredDoctor);
          }
        }

        /*
         * Find selected doctor.
         */
        const doctor = doctorList.find(
          (item) => item.id === doctorId
        );

        if (!doctor) {
          setMessage("Doctor not found.");
          setLoading(false);
          return;
        }

        setSelectedDoctor(doctor);

        /*
         * Get this doctor's availability.
         */
        const storedSlots = localStorage.getItem(
          `availabilitySlots-${doctor.id}`
        );

        if (!storedSlots) {
          setMessage(
            "No availability slots found for this doctor."
          );
          setLoading(false);
          return;
        }

        const parsedSlots =
          JSON.parse(storedSlots) as AvailabilitySlot[];

        /*
         * Find the exact selected slot.
         */
        const slot = parsedSlots.find(
          (item) =>
            item.id === slotId &&
            item.doctorId === doctor.id &&
            item.status === "available"
        );

        if (!slot) {
          setMessage(
            "This appointment slot is no longer available."
          );
          setLoading(false);
          return;
        }

        setSelectedSlot(slot);
        setLoading(false);
      } catch {
        setMessage(
          "Unable to load booking details."
        );
        setLoading(false);
      }
    };

    loadBookingData();
  }, [doctorId, slotId]);

  const createAppointmentWithPayment = (transactionId: string) => {
    if (confirmLock.current) {
      return;
    }

    if (!selectedDoctor || !selectedSlot) {
      return;
    }

    confirmLock.current = true;
    setConfirming(true);
    setMessage("");

    /*
     * Check patient login.
     */
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
      setMessage(
        "Please login as a patient before booking an appointment."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    /*
     * Re-check the slot from localStorage.
     *
     * This prevents booking a slot that was
     * already booked.
     */
    const storedDoctorSlots =
      localStorage.getItem(
        `availabilitySlots-${selectedDoctor.id}`
      );

    if (!storedDoctorSlots) {
      setMessage(
        "This appointment slot is no longer available."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    let doctorSlots: AvailabilitySlot[];

    try {
      doctorSlots = JSON.parse(
        storedDoctorSlots
      ) as AvailabilitySlot[];
    } catch {
      setMessage(
        "Unable to verify appointment availability."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    const currentSlot = doctorSlots.find(
      (slot) =>
        slot.id === selectedSlot.id &&
        slot.doctorId === selectedDoctor.id
    );

    if (!currentSlot || currentSlot.status !== "available") {
      setMessage(
        "This appointment slot is no longer available."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    /*
     * Appointment ID is based on the slot itself.
     */
    const appointmentId =
      `appointment-${selectedDoctor.id}-${selectedSlot.id}`;

    /*
     * Calculate appointment duration.
     */
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time
        .split(":")
        .map(Number);

      return hours * 60 + minutes;
    };

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

    const startsAt = new Date(
      `${selectedSlot.date}T${selectedSlot.startTime}:00`
    );

    /*
     * Create appointment.
     *
     * Appointment starts as pending.
     * Doctor will confirm or decline it.
     */
    const newAppointment: Appointment = {
      id: appointmentId,
      clinician: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      startsAt: startsAt.toISOString(),
      durationMinutes,
      status: "pending",
      room: "Consultation Room",

      patient: {
        id: patient.id,
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

      payment: {
        status: "paid",
        amount: selectedDoctor.consultationFee,
        method: paymentMethod,
        transactionId,
        paidAt: new Date().toISOString(),
      },
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
     * Remove duplicate appointment records.
     */
    const uniqueAppointments =
      appointments.filter(
        (appointment, index, array) =>
          array.findIndex(
            (item) => item.id === appointment.id
          ) === index
      );

    /*
     * Check if slot is already booked.
     */
    const alreadyBooked =
      uniqueAppointments.some(
        (appointment) =>
          appointment.id === newAppointment.id &&
          appointment.status !== "cancelled"
      );

    if (alreadyBooked) {
      setMessage(
        "This appointment slot is already booked."
      );

      confirmLock.current = false;
      setConfirming(false);
      return;
    }

    /*
     * Save new appointment.
     */
    const updatedAppointments =
      uniqueAppointments.filter(
        (appointment) =>
          appointment.id !== newAppointment.id
      );

    updatedAppointments.push(newAppointment);

    localStorage.setItem(
      "appointments",
      JSON.stringify(updatedAppointments)
    );

    /*
     * Keep Redux in sync with the
     * appointments stored in localStorage.
     */
    dispatch(setAppointments(updatedAppointments));

    /*
     * Mark selected slot as booked.
     */
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

    /*
     * Create patient notification.
     */
    addNotification({
      id: `notification-${Date.now()}`,
      userId: patient.id,
      type: "booking",
      title: "Appointment Requested",
      message: `Your appointment with ${selectedDoctor.name} has been requested and is waiting for doctor confirmation.`,
      appointmentId: newAppointment.id,
      createdAt: new Date().toISOString(),
      read: false,
    });

    /*
     * Create doctor notification.
     */
    addNotification({
      id: `notification-${Date.now()}-doctor`,
      userId: selectedDoctor.id,
      type: "booking",
      title: "New Appointment Request",
      message: `${patient.name} has requested an appointment with you.`,
      appointmentId: newAppointment.id,
      createdAt: new Date().toISOString(),
      read: false,
    });

    /*
     * Update selected slot state.
     */
    setSelectedSlot({
      ...selectedSlot,
      status: "booked",
    });

    setConfirmed(true);
    setConfirming(false);
    setPaymentSuccess(true);
  };

  const handleProceedToPayment = () => {
    if (!selectedDoctor || !selectedSlot) {
      return;
    }

    const storedPatient = localStorage.getItem("loggedInPatient");

    if (!storedPatient) {
      setMessage(
        "Please login as a patient before booking an appointment."
      );
      return;
    }

    setMessage("");
    setPaymentOpen(true);
  };

  const handlePayment = () => {
    if (paymentProcessing || !selectedDoctor || !selectedSlot) {
      return;
    }

    setPaymentProcessing(true);
    setMessage("");

    window.setTimeout(() => {
      const transactionId = `TXN-${Date.now().toString().slice(-8)}`;

      setPaymentTransactionId(transactionId);
      setPaymentProcessing(false);

      createAppointmentWithPayment(transactionId);
    }, 1200);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/30 px-4">
        <p className="text-sm text-slate-500">
          Loading booking details...
        </p>
      </main>
    );
  }

  if (!selectedDoctor || !selectedSlot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50 transition-shadow duration-200 hover:shadow-xl">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-red-100 bg-red-50 text-xl font-bold text-red-600 shadow-sm">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Unable to book appointment
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {message ||
              "The selected doctor or appointment slot could not be found."}
          </p>

          <Link
            href="/doctors"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Back to Doctors
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/30 text-slate-900">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm transition-transform duration-200 hover:scale-105">
              S
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                Schedula
              </p>

              <p className="text-xs text-slate-500">
                Healthcare made simple
              </p>
            </div>
          </Link>

          <Link
            href="/doctors"
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Back to Doctors
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {!confirmed ? (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-shadow duration-200 hover:shadow-xl sm:p-8">
            {/* Heading */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Appointment Booking
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Confirm your appointment
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review the doctor and selected appointment slot before confirming.
              </p>
            </div>

            {/* Doctor */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Doctor
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                {selectedDoctor.name}
              </h2>

              <p className="mt-1 font-semibold text-emerald-700">
                {selectedDoctor.specialty}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-colors duration-200 hover:bg-emerald-50/40">
                  <p className="text-xs text-slate-500">
                    Qualification
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedDoctor.qualification}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition-colors duration-200 hover:bg-emerald-50/40">
                  <p className="text-xs text-slate-500">
                    Consultation Fee
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    ₹{selectedDoctor.consultationFee}
                  </p>
                </div>
              </div>
            </section>

            {/* Selected Slot */}
            <section className="mt-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-all duration-200 hover:shadow-md sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Selected Slot
                  </p>

                  <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    {new Intl.DateTimeFormat("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(
                      new Date(
                        `${selectedSlot.date}T00:00:00`
                      )
                    )}
                  </h2>

                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {selectedSlot.startTime} -{" "}
                    {selectedSlot.endTime}
                  </p>
                </div>

                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                  Available
                </span>
              </div>
            </section>

            {/* Message */}
            {message && (
              <div
                className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 shadow-sm"
                role="alert"
              >
                {message}
              </div>
            )}

            {/* Confirm */}
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={confirming || paymentProcessing}
              className="mt-7 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              Continue to Payment
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 text-center shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-shadow duration-200 hover:shadow-xl sm:p-8">
            {/* Success */}
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-emerald-200 bg-emerald-100 text-2xl font-bold text-emerald-700 shadow-sm">
              ✓
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-emerald-600">
              Booking Successful
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Appointment Requested!
            </h1>

            <p className="mx-auto mt-3 max-w-2xl leading-6 text-slate-500">
              Your appointment request has been submitted successfully and is waiting for doctor confirmation.
            </p>

            {/* Confirmation Details */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-left shadow-sm sm:p-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Doctor
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {selectedDoctor.name}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Specialty
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedDoctor.specialty}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Date
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {new Intl.DateTimeFormat("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(
                    new Date(
                      `${selectedSlot.date}T00:00:00`
                    )
                  )}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Time
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {selectedSlot.startTime} -{" "}
                  {selectedSlot.endTime}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Status
                </p>

                <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
                  Pending
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link
                href="/appointments"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                My Appointments
              </Link>

              <Link
                href="/doctors"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Find Another Doctor
              </Link>
            </div>
          </div>
        )}
      </section>

      {paymentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {!paymentSuccess ? (
              <>
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                        Secure Checkout
                      </p>
                      <h2
                        id="payment-title"
                        className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
                      >
                        Complete Payment
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPaymentOpen(false)}
                      disabled={paymentProcessing}
                      aria-label="Close payment"
                      className="grid size-9 place-items-center rounded-full border border-slate-200 text-lg font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Doctor Consultation
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedDoctor.name}
                        </p>
                      </div>

                      <p className="text-xl font-bold text-slate-900">
                        ₹{selectedDoctor.consultationFee}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-bold text-slate-900">
                      Select payment method
                    </p>

                    <div className="mt-3 grid gap-3">
                      {[
                        {
                          value: "upi" as const,
                          title: "UPI",
                          description: "Pay using UPI",
                        },
                        {
                          value: "card" as const,
                          title: "Card",
                          description: "Credit or debit card",
                        },
                        {
                          value: "netbanking" as const,
                          title: "Net Banking",
                          description: "Pay through your bank",
                        },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          disabled={paymentProcessing}
                          className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                            paymentMethod === method.value
                              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                              : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {method.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {method.description}
                            </p>
                          </div>

                          <span
                            className={`grid size-5 place-items-center rounded-full border ${
                              paymentMethod === method.value
                                ? "border-emerald-600"
                                : "border-slate-300"
                            }`}
                          >
                            {paymentMethod === method.value && (
                              <span className="size-2.5 rounded-full bg-emerald-600" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={paymentProcessing}
                    className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {paymentProcessing
                      ? "Processing Payment..."
                      : `Pay ₹${selectedDoctor.consultationFee}`}
                  </button>

                  <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    This is a secure payment simulation for the application.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-6 text-center sm:p-8">
                <div className="mx-auto grid size-16 place-items-center rounded-full border border-emerald-200 bg-emerald-100 text-2xl font-bold text-emerald-700">
                  ✓
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Payment Successful
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  Payment Completed
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your payment has been recorded and your appointment request has been submitted.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Amount Paid</span>
                    <span className="text-sm font-bold text-slate-900">
                      ₹{selectedDoctor.consultationFee}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Method</span>
                    <span className="text-sm font-semibold uppercase text-slate-900">
                      {paymentMethod === "netbanking"
                        ? "Net Banking"
                        : paymentMethod}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Transaction ID</span>
                    <span className="text-right text-xs font-semibold text-slate-900">
                      {paymentTransactionId}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                  className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/30 px-4">
          <p className="text-sm text-slate-500">
            Loading booking page...
          </p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}