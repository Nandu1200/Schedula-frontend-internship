"use client";

import { useEffect, useMemo, useState } from "react";

import { addNotification } from "@/lib/utils/notifications";

import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot } from "@/types/availability";
import PrescriptionForm from "./PrescriptionForm";

type LoggedInDoctor = {
  id: string;
  name: string;
};

type AppointmentFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "missed";

const hasAppointmentStarted = (
  appointment: Appointment,
  currentTime: number
) => {
  return (
    currentTime > 0 &&
    new Date(appointment.startsAt).getTime() <= currentTime
  );
};

const isUpcoming = (
  appointment: Appointment,
  currentTime: number
) => {
  return (
    appointment.status === "confirmed" &&
    currentTime > 0 &&
    new Date(appointment.startsAt).getTime() > currentTime
  );
};

const getAppointmentCategory = (
  appointment: Appointment,
  currentTime: number
): AppointmentFilter => {
  if (
    appointment.status === "confirmed" &&
    isUpcoming(appointment, currentTime)
  ) {
    return "upcoming";
  }

  if (appointment.status === "pending") {
    return "pending";
  }

  if (appointment.status === "confirmed") {
    return "confirmed";
  }

  if (appointment.status === "completed") {
    return "completed";
  }

  if (appointment.status === "cancelled") {
    return "cancelled";
  }

  if (appointment.status === "missed") {
    return "missed";
  }

  return "all";
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
};

const getDateFromAppointment = (startsAt: string) => {
  const date = new Date(startsAt);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTimeFromAppointment = (startsAt: string) => {
  const date = new Date(startsAt);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const createStartsAt = (date: string, time: string) => {
  const localDate = new Date(`${date}T${time}:00`);

  return localDate.toISOString();
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const [currentTime, setCurrentTime] = useState(0);

  const [activeFilter, setActiveFilter] =
    useState<AppointmentFilter>("all");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedDate, setSelectedDate] = useState("");

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [rescheduleAppointment, setRescheduleAppointment] =
    useState<Appointment | null>(null);

  const [availableSlots, setAvailableSlots] =
    useState<AvailabilitySlot[]>([]);

  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);

  const [rescheduleError, setRescheduleError] = useState("");

  /*
   * Load doctor appointments.
   */
  useEffect(() => {
    const loadAppointments = () => {
      const storedDoctor =
        localStorage.getItem("loggedInDoctor") ||
        localStorage.getItem("registeredDoctor");

      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedDoctor || !storedAppointments) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        const doctor =
          JSON.parse(storedDoctor) as LoggedInDoctor;

        const allAppointments =
          JSON.parse(storedAppointments) as Appointment[];

        const doctorAppointments = allAppointments.filter(
          (appointment) =>
            appointment.clinician.trim().toLowerCase() ===
            doctor.name.trim().toLowerCase()
        );

        doctorAppointments.sort(
          (first, second) =>
            new Date(first.startsAt).getTime() -
            new Date(second.startsAt).getTime()
        );

        setAppointments(doctorAppointments);
      } catch {
        setAppointments([]);
      }

      setLoading(false);
    };

    const timer = window.setTimeout(loadAppointments, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*
   * Keep current time updated.
   */
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(Date.now());
    };

    updateTime();

    const timer = window.setInterval(
      updateTime,
      60 * 1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
   * Filter appointments.
   */
  const filteredAppointments = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const category = getAppointmentCategory(
        appointment,
        currentTime
      );

      const matchesFilter =
        activeFilter === "all" ||
        category === activeFilter;

      if (!matchesFilter) {
        return false;
      }

      if (normalizedSearch) {
        const searchableText = [
          appointment.patient.name,
          appointment.clinician,
          appointment.specialty,
          appointment.reason,
          appointment.room,
          appointment.status,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(normalizedSearch)) {
          return false;
        }
      }

      if (selectedDate) {
        const appointmentDate =
          getDateFromAppointment(
            appointment.startsAt
          );

        if (appointmentDate !== selectedDate) {
          return false;
        }
      }

      return true;
    });
  }, [
    appointments,
    activeFilter,
    searchTerm,
    selectedDate,
    currentTime,
  ]);

  /*
   * Appointment counts.
   */
  const appointmentCounts = useMemo(() => {
    const counts: Record<AppointmentFilter, number> = {
      all: appointments.length,
      pending: 0,
      confirmed: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
      missed: 0,
    };

    appointments.forEach((appointment) => {
      const category = getAppointmentCategory(
        appointment,
        currentTime
      );

      if (category !== "all") {
        counts[category] += 1;
      }
    });

    return counts;
  }, [appointments, currentTime]);

  /*
   * Load doctor's availability slots.
   *
   * IMPORTANT:
   * No unused appointment parameter here.
   */
  const loadAvailabilitySlots = () => {
    setLoadingSlots(true);
    setRescheduleError("");
    setSelectedSlotId("");

    try {
      const storedDoctor =
        localStorage.getItem("loggedInDoctor") ||
        localStorage.getItem("registeredDoctor");

      if (!storedDoctor) {
        setRescheduleError(
          "Doctor information not found."
        );
        setLoadingSlots(false);
        return;
      }

      const doctor =
        JSON.parse(storedDoctor) as LoggedInDoctor;

      const storageKey =
        `availabilitySlots-${doctor.id}`;

      const storedSlots =
        localStorage.getItem(storageKey);

      if (!storedSlots) {
        setAvailableSlots([]);
        setRescheduleError(
          "No availability slots found. Please create availability first."
        );
        setLoadingSlots(false);
        return;
      }

      const slots =
        JSON.parse(
          storedSlots
        ) as AvailabilitySlot[];

      const filteredSlots = slots.filter(
        (slot) => slot.status === "available"
      );

      setAvailableSlots(filteredSlots);
    } catch {
      setAvailableSlots([]);
      setRescheduleError(
        "Unable to load available slots."
      );
    }

    setLoadingSlots(false);
  };

  /*
   * Open reschedule modal.
   */
  const openReschedule = (
    appointment: Appointment
  ) => {
    setSelectedAppointment(null);
    setRescheduleAppointment(appointment);

    loadAvailabilitySlots();
  };

  /*
   * Close reschedule modal.
   */
  const closeReschedule = () => {
    setRescheduleAppointment(null);
    setAvailableSlots([]);
    setSelectedSlotId("");
    setRescheduleError("");
  };

  /*
   * Reschedule appointment.
   */
  const handleReschedule = () => {
    if (!rescheduleAppointment) {
      return;
    }

    if (!selectedSlotId) {
      setRescheduleError(
        "Please select an available slot."
      );
      return;
    }

    const selectedSlot =
      availableSlots.find(
        (slot) => slot.id === selectedSlotId
      );

    if (!selectedSlot) {
      setRescheduleError(
        "Selected slot is no longer available."
      );
      return;
    }

    const shouldUpdate = window.confirm(
      "Are you sure you want to reschedule this appointment?"
    );

    if (!shouldUpdate) {
      return;
    }

    setActionId(rescheduleAppointment.id);
    setRescheduleError("");
    setError("");

    try {
      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedAppointments) {
        throw new Error(
          "Appointments not found."
        );
      }

      const allAppointments =
        JSON.parse(
          storedAppointments
        ) as Appointment[];

      const storedDoctor =
        localStorage.getItem("loggedInDoctor") ||
        localStorage.getItem("registeredDoctor");

      if (!storedDoctor) {
        throw new Error(
          "Doctor information not found."
        );
      }

      const doctor =
        JSON.parse(
          storedDoctor
        ) as LoggedInDoctor;

      const storageKey =
        `availabilitySlots-${doctor.id}`;

      const storedSlots =
        localStorage.getItem(storageKey);

      if (!storedSlots) {
        throw new Error(
          "Availability slots not found."
        );
      }

      const latestSlots =
        JSON.parse(
          storedSlots
        ) as AvailabilitySlot[];

      const latestSelectedSlot =
        latestSlots.find(
          (slot) => slot.id === selectedSlot.id
        );

      if (
        !latestSelectedSlot ||
        latestSelectedSlot.status !==
          "available"
      ) {
        throw new Error(
          "This slot is no longer available."
        );
      }

      /*
       * Find old appointment slot.
       */
      const oldAppointmentDate =
        getDateFromAppointment(
          rescheduleAppointment.startsAt
        );

      const oldAppointmentTime =
        getTimeFromAppointment(
          rescheduleAppointment.startsAt
        );

      const oldSlot = latestSlots.find(
        (slot) =>
          slot.doctorId === doctor.id &&
          slot.date === oldAppointmentDate &&
          slot.startTime === oldAppointmentTime
      );

      /*
       * Update appointment.
       */
      const updatedAppointments =
        allAppointments.map((appointment) => {
          if (
            appointment.id !==
            rescheduleAppointment.id
          ) {
            return appointment;
          }

          return {
            ...appointment,
            startsAt: createStartsAt(
              selectedSlot.date,
              selectedSlot.startTime
            ),
          };
        });

      /*
       * Update availability.
       *
       * New slot -> booked
       * Old slot -> available
       */
      const updatedSlots =
        latestSlots.map((slot) => {
          if (
            slot.id === selectedSlot.id
          ) {
            return {
              ...slot,
              status: "booked" as const,
            };
          }

          if (
            oldSlot &&
            slot.id === oldSlot.id
          ) {
            return {
              ...slot,
              status: "available" as const,
            };
          }

          return slot;
        });

          localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
      );

      localStorage.setItem(
        storageKey,
        JSON.stringify(updatedSlots)
      );

      /*
       * Notify patient about rescheduling.
       */
      if (rescheduleAppointment.patient.id) {
        addNotification({
          id: `notification-${Date.now()}`,
          userId: rescheduleAppointment.patient.id,
          type: "reschedule",
          title: "Appointment Rescheduled",
          message: `Your appointment with ${rescheduleAppointment.clinician} has been rescheduled to ${formatDateTime(
            createStartsAt(
              selectedSlot.date,
              selectedSlot.startTime
            )
          )}.`,
          appointmentId: rescheduleAppointment.id,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }

      /*
       * Update appointment list.
       */
      const updatedDoctorAppointments =
        updatedAppointments.filter(
          (appointment) =>
            appointment.clinician
              .trim()
              .toLowerCase() ===
            doctor.name
              .trim()
              .toLowerCase()
        );

      updatedDoctorAppointments.sort(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime()
      );

      setAppointments(
        updatedDoctorAppointments
      );

      setSelectedAppointment(null);

      closeReschedule();

      
    } catch (caughtError) {
      setRescheduleError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to reschedule appointment."
      );
    } finally {
      setActionId("");
    }
  };

  /*
   * Update appointment status.
   */
  const updateAppointmentStatus = (
    appointment: Appointment,
    status:
      | "confirmed"
      | "cancelled"
      | "completed"
      | "missed"
  ) => {
    let actionText = "update";

    if (status === "confirmed") {
      actionText = "confirm";
    }

    if (status === "cancelled") {
      actionText = "cancel";
    }

    if (status === "completed") {
      actionText =
        "mark this appointment as completed";
    }

    if (status === "missed") {
      actionText =
        "mark this appointment as missed";
    }

    const shouldUpdate = window.confirm(
      `Are you sure you want to ${actionText} this appointment?`
    );

    if (!shouldUpdate) {
      return;
    }

    setActionId(appointment.id);
    setError("");

    try {
      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedAppointments) {
        throw new Error(
          "Appointments not found."
        );
      }

      const allAppointments =
        JSON.parse(
          storedAppointments
        ) as Appointment[];

      const updatedAppointments =
  allAppointments.map((item) =>
    item.id === appointment.id
      ? {
          ...item,
          status,
          ...(status === "completed"
            ? {
             prescription: {
  id: `prescription-${Date.now()}`,
  appointmentId: appointment.id,
  diagnosis: "General consultation",
  medicines: [
    {
      name: "Paracetamol",
      dosage: "500mg",
      duration: "5 days",
    },
    {
      name: "Vitamin D3",
      dosage: "1 tablet",
      duration: "30 days",
    },
  ],
  instructions:
    "Take medicines as prescribed by the doctor.",
},
              }
            : {}),
        }
      : item
  );

      localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
      );

      if (status === "cancelled" && appointment.patient.id) {
  addNotification({
    id: `notification-${Date.now()}`,
    userId: appointment.patient.id,
    type: "cancellation",
    title: "Appointment Cancelled",
    message: `Your appointment with ${appointment.clinician} has been cancelled.`,
    appointmentId: appointment.id,
    createdAt: new Date().toISOString(),
    read: false,
  });
}
      if (status === "confirmed" && appointment.patient.id) {
  addNotification({
    id: `notification-${Date.now()}`,
    userId: appointment.patient.id,
    type: "confirmation",
    title: "Appointment Confirmed",
    message: `Your appointment with ${appointment.clinician} has been confirmed.`,
    appointmentId: appointment.id,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

     setAppointments((current) =>
  current.map((item) =>
    item.id === appointment.id
      ? updatedAppointments.find(
          (updatedItem) =>
            updatedItem.id === appointment.id
        ) ?? item
      : item
  )
);

      setSelectedAppointment((current) =>
        current?.id === appointment.id
          ? {
              ...current,
              status,
            }
          : current
      );

      /*
       * Cancelled appointment:
       * make its slot available again.
       */
      if (status === "cancelled") {
        const storedDoctor =
          localStorage.getItem("loggedInDoctor") ||
          localStorage.getItem("registeredDoctor");

        if (!storedDoctor) {
          return;
        }

        const doctor =
          JSON.parse(
            storedDoctor
          ) as LoggedInDoctor;

        const storageKey =
          `availabilitySlots-${doctor.id}`;

        const storedSlots =
          localStorage.getItem(storageKey);

        if (!storedSlots) {
          return;
        }

        const slots =
          JSON.parse(
            storedSlots
          ) as AvailabilitySlot[];

        const appointmentDate =
          getDateFromAppointment(
            appointment.startsAt
          );

        const appointmentTime =
          getTimeFromAppointment(
            appointment.startsAt
          );

        const updatedSlots =
          slots.map((slot) =>
            slot.date === appointmentDate &&
            slot.startTime === appointmentTime
              ? {
                  ...slot,
                  status:
                    "available" as const,
                }
              : slot
          );

        localStorage.setItem(
          storageKey,
          JSON.stringify(updatedSlots)
        );
      }
    } catch {
      setError(
        `Unable to ${actionText} the appointment. Please try again.`
      );
    } finally {
      setActionId("");
    }
  };

  const handleCancel = (
    appointment: Appointment
  ) => {
    updateAppointmentStatus(
      appointment,
      "cancelled"
    );
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchTerm("");
    setSelectedDate("");
  };

  const closeDetails = () => {
    setSelectedAppointment(null);
  };

  const openDetails = (
    appointment: Appointment
  ) => {
    setSelectedAppointment(appointment);
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
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Appointments
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your patient appointments and
            appointment status.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">

            <div>
              <label
                htmlFor="appointment-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="appointment-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search patient, reason, room..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="appointment-date"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Date
              </label>

              <input
                id="appointment-date"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:w-auto"
              >
                Clear Filters
              </button>
            </div>

          </div>

          {/* Status Tabs */}
          <div className="mt-5 border-t border-gray-100 pt-5">

            <p className="mb-3 text-sm font-semibold text-slate-700">
              Status
            </p>

            <div className="flex flex-wrap gap-2">

              {(
                [
                  ["all", "All"],
                  ["pending", "Pending"],
                  ["confirmed", "Confirmed"],
                  ["upcoming", "Upcoming"],
                  ["completed", "Completed"],
                  ["cancelled", "Cancelled"],
                  ["missed", "Missed"],
                ] as [
                  AppointmentFilter,
                  string
                ][]
              ).map(([filter, label]) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() =>
                    setActiveFilter(filter)
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === filter
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {label}

                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      activeFilter === filter
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {appointmentCounts[filter]}
                  </span>
                </button>
              ))}

            </div>
          </div>

        </section>

        {/* Result count */}
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredAppointments.length}
            </span>{" "}
            appointment
            {filteredAppointments.length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        {/* Empty */}
        {filteredAppointments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
              📅
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No appointments found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <div className="space-y-4">

            {filteredAppointments.map(
              (appointment) => {
                const appointmentStarted =
                  hasAppointmentStarted(
                    appointment,
                    currentTime
                  );

                const canMarkOutcome =
                  appointment.status ===
                    "confirmed" &&
                  appointmentStarted;

                const category =
                  getAppointmentCategory(
                    appointment,
                    currentTime
                  );

                const canReschedule =
                  appointment.status ===
                    "confirmed" &&
                  !appointmentStarted;

                return (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >

                    {/* Patient + Status */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {appointment.patient.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {appointment.patient.age}{" "}
                          years old
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {appointment.reason}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${
                            appointment.status ===
                            "cancelled"
                              ? "border-red-300 bg-red-50 text-red-700"
                              : appointment.status ===
                                "pending"
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                              : appointment.status ===
                                "completed"
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : appointment.status ===
                                "missed"
                              ? "border-gray-300 bg-gray-50 text-gray-700"
                              : "border-emerald-300 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {appointment.status}
                        </span>

                        {category === "upcoming" && (
                          <span className="w-fit rounded-full border border-purple-300 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
                            Upcoming
                          </span>
                        )}

                      </div>

                    </div>

                    {/* Appointment Information */}
                    <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                      <div>
                        <p className="text-sm text-gray-500">
                          Date & Time
                        </p>

                        <p className="mt-1 font-medium text-slate-900">
                          {formatDateTime(
                            appointment.startsAt
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Duration
                        </p>

                        <p className="mt-1 font-medium text-slate-900">
                          {
                            appointment.durationMinutes
                          }{" "}
                          minutes
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Appointment Type
                        </p>

                        <p className="mt-1 font-medium text-slate-900">
                          Consultation
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Room
                        </p>

                        <p className="mt-1 font-medium text-slate-900">
                          {appointment.room}
                        </p>
                      </div>

                    </div>

                    {/* Reason */}
                    <div className="mt-5 border-t border-gray-100 pt-5">

                      <p className="text-sm text-gray-500">
                        Reason
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {appointment.reason}
                      </p>

                    </div>

                    {/* View Details */}
                    <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">

                      <button
                        type="button"
                        onClick={() =>
                          openDetails(
                            appointment
                          )
                        }
                        className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        View Details
                      </button>

                      {canReschedule && (
                        <button
                          type="button"
                          onClick={() =>
                            openReschedule(
                              appointment
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Reschedule
                        </button>
                      )}

                    </div>

                    {/* Pending Actions */}
                    {appointment.status ===
                      "pending" && (
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment,
                              "confirmed"
                            )
                          }
                          disabled={
                            actionId ===
                            appointment.id
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Confirm Appointment
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment,
                              "cancelled"
                            )
                          }
                          disabled={
                            actionId ===
                            appointment.id
                          }
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Decline Appointment
                        </button>

                      </div>
                    )}

                    {/* Confirmed Actions */}
                    {appointment.status ===
                      "confirmed" && (
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">

                        {canMarkOutcome && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateAppointmentStatus(
                                  appointment,
                                  "completed"
                                )
                              }
                              disabled={
                                actionId ===
                                appointment.id
                              }
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Mark as Completed
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateAppointmentStatus(
                                  appointment,
                                  "missed"
                                )
                              }
                              disabled={
                                actionId ===
                                appointment.id
                              }
                              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Mark as Missed
                            </button>
                          </>
                        )}

                        {!appointmentStarted && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCancel(
                                appointment
                              )
                            }
                            disabled={
                              actionId ===
                              appointment.id
                            }
                            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel Appointment
                          </button>
                        )}

                      </div>
                    )}

                    {/* Completed */}
                    {appointment.status ===
                      "completed" && (
                      <div className="mt-3 border-t border-gray-100 pt-5">
                        <div className="rounded-lg bg-blue-50 px-4 py-3">
                          <p className="text-sm font-semibold text-blue-700">
                            Appointment Completed
                          </p>

                          <p className="mt-1 text-sm text-blue-600">
                            This appointment is
                            read-only.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Missed */}
                    {appointment.status ===
                      "missed" && (
                      <div className="mt-3 border-t border-gray-100 pt-5">
                        <div className="rounded-lg bg-gray-50 px-4 py-3">
                          <p className="text-sm font-semibold text-gray-700">
                            Appointment Missed
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            This appointment is
                            read-only.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cancelled */}
                    {appointment.status ===
                      "cancelled" && (
                      <div className="mt-3 border-t border-gray-100 pt-5">
                        <div className="rounded-lg bg-red-50 px-4 py-3">
                          <p className="text-sm font-semibold text-red-700">
                            Appointment Cancelled
                          </p>

                          <p className="mt-1 text-sm text-red-600">
                            This appointment is
                            read-only.
                          </p>
                        </div>
                      </div>
                    )}

                  </article>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* Appointment Details Modal */}
      {/* ================================================= */}

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointment-details-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-gray-100 p-6">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                  Appointment Details
                </p>

                <h2
                  id="appointment-details-title"
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  {
                    selectedAppointment.patient.name
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close appointment details"
                className="grid size-9 place-items-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* Patient */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Patient
                </h3>

                <div className="mt-3 flex items-center gap-4 rounded-xl bg-slate-50 p-4">

                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                    {
                      selectedAppointment.patient
                        .initials
                    }
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {
                        selectedAppointment.patient
                          .name
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedAppointment.patient
                          .age
                      }{" "}
                      years old
                    </p>
                  </div>

                </div>
              </section>

              {/* Appointment Information */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Appointment Information
                </h3>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Doctor
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedAppointment.clinician
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Specialty
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedAppointment.specialty
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Date & Time
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(
                        selectedAppointment.startsAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Duration
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedAppointment
                          .durationMinutes
                      }{" "}
                      minutes
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Appointment Type
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      Consultation
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">
                      Room
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedAppointment.room
                      }
                    </p>
                  </div>

                </div>
              </section>

              {/* Reason */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Reason for Visit
                </h3>

                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {
                      selectedAppointment.reason
                    }
                  </p>
                </div>
              </section>

              {/* Status */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </h3>

                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
                      selectedAppointment.status ===
                      "cancelled"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : selectedAppointment.status ===
                          "pending"
                        ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                        : selectedAppointment.status ===
                          "completed"
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : selectedAppointment.status ===
                          "missed"
                        ? "border-gray-300 bg-gray-50 text-gray-700"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {
                      selectedAppointment.status
                    }
                  </span>
                </div>
              </section>

            </div>

            {/* Details Actions */}
            <div className="flex flex-col gap-3 border-t border-gray-100 p-6 sm:flex-row sm:justify-end">

              {/* Pending */}
              {selectedAppointment.status ===
                "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      updateAppointmentStatus(
                        selectedAppointment,
                        "confirmed"
                      )
                    }
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Confirm Appointment
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateAppointmentStatus(
                        selectedAppointment,
                        "cancelled"
                      )
                    }
                    className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Decline Appointment
                  </button>
                </>
              )}

              {/* Confirmed Future */}
              {selectedAppointment.status ===
                "confirmed" &&
                !hasAppointmentStarted(
                  selectedAppointment,
                  currentTime
                ) && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        openReschedule(
                          selectedAppointment
                        )
                      }
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Reschedule
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCancel(
                          selectedAppointment
                        )
                      }
                      className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Cancel Appointment
                    </button>
                  </>
                )}

              {/* Confirmed Past */}
              {selectedAppointment.status ===
                "confirmed" &&
                hasAppointmentStarted(
                  selectedAppointment,
                  currentTime
                ) && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        updateAppointmentStatus(
                          selectedAppointment,
                          "completed"
                        )
                      }
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Mark as Completed
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateAppointmentStatus(
                          selectedAppointment,
                          "missed"
                        )
                      }
                      className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Mark as Missed
                    </button>
                  </>
                )}

              {/* Read only */}
         {selectedAppointment.status === "completed" && (
  <div className="mr-auto rounded-lg bg-blue-50 px-4 py-3">
    <p className="text-sm font-semibold text-blue-700">
      Appointment Completed
    </p>

    {selectedAppointment.prescription ? (
  <p className="mt-1 text-sm text-blue-600">
    Prescription is available for the patient.
  </p>
) : (
  <p className="mt-1 text-sm text-blue-600">
    Prescription is not available.
  </p>
)}
  </div>
)}

{(selectedAppointment.status === "cancelled" ||
  selectedAppointment.status === "missed") && (
  <p className="mr-auto self-center text-sm text-slate-500">
    This appointment is read-only.
  </p>
)}
<div className="w-full border-t border-gray-100 pt-4">
{selectedAppointment.status === "completed" && (
  <PrescriptionForm
    appointmentId={selectedAppointment.id}
    prescription={selectedAppointment.prescription}
    onSaved={(updatedAppointment) => {
      setSelectedAppointment(updatedAppointment);

      setAppointments((currentAppointments) =>
  currentAppointments.map((appointment) =>
    appointment.id === updatedAppointment.id
      ? updatedAppointment
      : appointment
  )
);
    }}
  />
)}

<div className="mt-4 flex justify-end">

<button
  type="button"
  onClick={closeDetails}
  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
>
  Close
</button>
</div>
</div>
            </div>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* Reschedule Modal */}
      {/* ================================================= */}

      {rescheduleAppointment && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeReschedule();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 p-6">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                  Reschedule Apointment
                </p>

                <h2
                  id="reschedule-title"
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  Choose a new slot
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Current appointment:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatDateTime(
                      rescheduleAppointment.startsAt
                    )}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeReschedule}
                aria-label="Close reschedule modal"
                className="grid size-9 place-items-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>

            </div>

            {/* Body */}
            <div className="p-6">

              {rescheduleError && (
                <div
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {rescheduleError}
                </div>
              )}

              {loadingSlots ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-500">
                    Loading available slots...
                  </p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">

                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-white text-xl">
                    📅
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">
                    No available slots
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    There are currently no available
                    slots for rescheduling.
                  </p>

                </div>
              ) : (
                <div>

                  <h3 className="text-sm font-semibold text-slate-700">
                    Available Slots
                  </h3>

                  <div className="mt-4 space-y-5">

                    {Object.entries(
                      availableSlots.reduce(
                        (
                          grouped,
                          slot
                        ) => {
                          if (
                            !grouped[slot.date]
                          ) {
                            grouped[slot.date] = [];
                          }

                          grouped[slot.date].push(
                            slot
                          );

                          return grouped;
                        },
                        {} as Record<
                          string,
                          AvailabilitySlot[]
                        >
                      )
                    ).map(
                      ([date, slots]) => (
                        <div key={date}>

                          <p className="mb-3 text-sm font-semibold text-slate-900">
                            {formatDate(date)}
                          </p>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                            {slots.map(
                              (slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSlotId(
                                      slot.id
                                    )
                                  }
                                  className={`rounded-xl border p-4 text-left transition ${
                                    selectedSlotId ===
                                    slot.id
                                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                                  }`}
                                >

                                  <div className="flex items-center justify-between">

                                    <span className="font-semibold text-slate-900">
                                      {slot.startTime}
                                    </span>

                                    {selectedSlotId ===
                                      slot.id && (
                                      <span className="text-sm font-bold text-emerald-600">
                                        ✓
                                      </span>
                                    )}

                                  </div>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {slot.startTime} –{" "}
                                    {slot.endTime}
                                  </p>

                                  <p className="mt-2 text-xs font-medium text-emerald-600">
                                    Available
                                  </p>

                                </button>
                              )
                            )}

                          </div>
                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-100 p-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeReschedule}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReschedule}
                disabled={
                  !selectedSlotId ||
                  availableSlots.length === 0 ||
                  actionId ===
                    rescheduleAppointment.id
                }
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionId ===
                rescheduleAppointment.id
                  ? "Rescheduling..."
                  : "Confirm Reschedule"}
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}