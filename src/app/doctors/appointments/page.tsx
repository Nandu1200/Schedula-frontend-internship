"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAppointments,
  updateAppointment as updateAppointmentAction,
} from "@/store/appointmentSlice";

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
  const appointments = useAppSelector(
    (state) => state.appointments.appointments
  );

  const dispatch = useAppDispatch();
  const router = useRouter();

  const setStoreAppointments = (appointments: Appointment[]) => {
    dispatch(setAppointments(appointments));
  };

  const updateStoreAppointment = (
    appointmentId: string,
    updates: Partial<Appointment>
  ) => {
    dispatch(
      updateAppointmentAction({
        appointmentId,
        updates,
      })
    );
  };

  const [doctorName, setDoctorName] = useState("");

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

  const [actionReason, setActionReason] = useState("");

  const [reasonDialog, setReasonDialog] = useState<{
    appointment: Appointment;
    reason: string;
  } | null>(null);

  const [reasonError, setReasonError] = useState("");

  const [followUpAppointment, setFollowUpAppointment] =
    useState<Appointment | null>(null);

  const [followUpDays, setFollowUpDays] = useState("7");
  const [followUpNote, setFollowUpNote] = useState("");

  const [confirmation, setConfirmation] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

      if (!storedDoctor) {
        dispatch(setAppointments([]));
        setDoctorName("");
        setLoading(false);
        return;
      }

      try {
        const doctor =
          JSON.parse(storedDoctor) as LoggedInDoctor;

        setDoctorName(doctor.name);

        if (storedAppointments) {
          const allAppointments =
            JSON.parse(storedAppointments) as Appointment[];

          dispatch(setAppointments(allAppointments));
        }
      } catch {
        dispatch(setAppointments([]));
        setDoctorName("");
      }

      setLoading(false);
    };
    const timer = window.setTimeout(loadAppointments, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dispatch]);

  const doctorAppointments = useMemo(() => {
    const normalizedDoctorName =
      doctorName.trim().toLowerCase();

    const filtered = normalizedDoctorName
      ? appointments.filter(
          (appointment) =>
            appointment.clinician.trim().toLowerCase() ===
            normalizedDoctorName
        )
      : [];

    return [...filtered].sort(
      (first, second) =>
        new Date(first.startsAt).getTime() -
        new Date(second.startsAt).getTime()
    );
  }, [appointments, doctorName]);

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

    return doctorAppointments.filter((appointment) => {
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
  doctorAppointments,
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
      all: doctorAppointments.length,
      pending: 0,
      confirmed: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
      missed: 0,
    };

    doctorAppointments.forEach((appointment) => {
      const category = getAppointmentCategory(
        appointment,
        currentTime
      );

      if (category !== "all") {
        counts[category] += 1;
      }
    });

    return counts;
  }, [doctorAppointments, currentTime]);

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
    setActionReason("");
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

    const trimmedReason = actionReason.trim();

    if (!trimmedReason) {
      setRescheduleError(
        "Please provide a reason for rescheduling."
      );
      return;
    }

    setConfirmation({
      message:
        "Are you sure you want to reschedule this appointment?",
      onConfirm: () => {
        setConfirmation(null);
        performReschedule(selectedSlot, trimmedReason);
      },
    });
  };

  const performReschedule = (
    selectedSlot: AvailabilitySlot,
    reason: string
  ) => {
    if (!rescheduleAppointment) {
      return;
    }

    setActionId(rescheduleAppointment.id);
    setRescheduleError("");
    setError("");

    try {
      const allAppointments = appointments;

      if (allAppointments.length === 0) {
        throw new Error(
          "Appointments not found."
        );
      }

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
            actionBy: "doctor" as const,
            actionType: "rescheduled" as const,
            actionReason: reason,
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

      setStoreAppointments(updatedAppointments)

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
       * Update appointment list in Redux.
       */
      setStoreAppointments(updatedAppointments);

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

    if (status === "cancelled") {
      setReasonError("");
      setReasonDialog({
        appointment,
        reason: "",
      });
      return;
    }

    setConfirmation({
      message: `Are you sure you want to ${actionText} this appointment?`,
      onConfirm: () => {
        setConfirmation(null);
        performAppointmentStatusUpdate(
          appointment,
          status,
          actionText
        );
      },
    });
  };

  const performAppointmentStatusUpdate = (
    appointment: Appointment,
    status:
      | "confirmed"
      | "cancelled"
      | "completed"
      | "missed",
    actionText: string,
    reason?: string
  ) => {

    setActionId(appointment.id);
    setError("");

    try {
      const allAppointments = appointments;

      if (allAppointments.length === 0) {
        throw new Error(
          "Appointments not found."
        );
      }

      const updatedAppointments =
  allAppointments.map((item) =>
    item.id === appointment.id
      ? {
          ...item,
          status,
          ...(status === "cancelled"
            ? {
                actionBy: "doctor" as const,
                actionType: "cancelled" as const,
                actionReason: reason,
              }
            : {}),
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

      setStoreAppointments(updatedAppointments)

      if (status === "cancelled" && appointment.patient.id) {
  addNotification({
    id: `notification-${Date.now()}`,
    userId: appointment.patient.id,
    type: "cancellation",
    title: "Appointment Cancelled",
    message: `Your appointment with ${appointment.clinician} has been cancelled. Reason: ${reason ?? "No reason provided."}`,
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

      const updatedStatusAppointment =
        updatedAppointments.find(
          (item) => item.id === appointment.id
        );

      if (updatedStatusAppointment) {
        setSelectedAppointment(updatedStatusAppointment);
      }

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

  const handleCancelReasonSubmit = () => {
    if (!reasonDialog) {
      return;
    }

    const trimmedReason = reasonDialog.reason.trim();

    if (!trimmedReason) {
      setReasonError(
        "Please provide a reason for cancelling the appointment."
      );
      return;
    }

    setReasonError("");
    setError("");
    const appointment = reasonDialog.appointment;
    setReasonDialog(null);

    setConfirmation({
      message: "Are you sure you want to cancel this appointment?",
      onConfirm: () => {
        setConfirmation(null);
        performAppointmentStatusUpdate(
          appointment,
          "cancelled",
          "cancel",
          trimmedReason
        );
      },
    });
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchTerm("");
    setSelectedDate("");
  };

  const closeDetails = () => {
    setSelectedAppointment(null);
  };

  const openFollowUp = (appointment: Appointment) => {
    setSelectedAppointment(null);
    setFollowUpAppointment(appointment);
    setFollowUpDays("7");
    setFollowUpNote("");
  };

  const closeFollowUp = () => {
    setFollowUpAppointment(null);
    setFollowUpDays("7");
    setFollowUpNote("");
  };

  const handleRecommendFollowUp = () => {
    if (!followUpAppointment) return;

    try {
      const allAppointments = appointments;

      if (allAppointments.length === 0) {
        throw new Error("Appointments not found.");
      }

      const afterDays = Number(followUpDays);

      const updatedAppointments =
        allAppointments.map((appointment) =>
          appointment.id === followUpAppointment.id
            ? {
                ...appointment,
                followUp: {
                  recommended: true,
                  afterDays,
                  note:
                    followUpNote.trim() || undefined,
                },
              }
            : appointment
        );

      const updatedAppointment =
        updatedAppointments.find(
          (appointment) =>
            appointment.id === followUpAppointment.id
        );

      if (!updatedAppointment) {
        throw new Error("Appointment not found.");
      }

      localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
      );

      setStoreAppointments(updatedAppointments);

      window.dispatchEvent(
        new Event("appointments-updated")
      );

      /*
       * Notify patient about the recommended follow-up.
       */
      if (followUpAppointment.patient.id) {
        addNotification({
          id: `notification-${Date.now()}`,
          userId: followUpAppointment.patient.id,
          type: "reminder",
          title: "Follow-up Recommended",
          message: `Dr. ${followUpAppointment.clinician.replace(
            /^Dr\.?\s*/i,
            ""
          )} recommends a follow-up after ${afterDays} days.${
            followUpNote.trim()
              ? ` Note: ${followUpNote.trim()}`
              : ""
          }`,
          appointmentId: followUpAppointment.id,
          createdAt: new Date().toISOString(),
          read: false,
        });

        window.dispatchEvent(
          new Event("notifications-updated")
        );
      }

      setSelectedAppointment(updatedAppointment);
      closeFollowUp();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the follow-up recommendation. Please try again."
      );
    }
  };

  const openDetails = (
    appointment: Appointment
  ) => {
    setSelectedAppointment(appointment);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf9]">
        <p className="text-gray-500">
          Loading appointments...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 transition-colors duration-200 sm:px-8">
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
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">

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
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm transition-shadow duration-200 hover:shadow-md">

            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
              📅
            </div>

            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              No appointments found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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

                const consultationStartsAt =
                  new Date(appointment.startsAt).getTime();

                const minutesUntilConsultation =
                  (consultationStartsAt - currentTime) /
                  (60 * 1000);

                const canStartOnlineConsultation =
                  appointment.status === "confirmed" &&
                  appointment.consultationType === "online" &&
                  currentTime > 0 &&
                  minutesUntilConsultation <= 5;

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
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
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
                          className={`w-fit rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200 ${
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
                          <span className="w-fit rounded-full border border-purple-300 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 transition-all duration-200">
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
                          {appointment.consultationType === "online"
                            ? "Online Consultation"
                            : "In-person Consultation"}
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

                    {/* Payment */}
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            Payment
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                                appointment.payment?.status === "paid"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : appointment.payment?.status === "failed"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {appointment.payment?.status === "paid"
                                ? "Paid"
                                : appointment.payment?.status === "failed"
                                ? "Failed"
                                : "Pending"}
                            </span>

                            {appointment.payment && (
                              <span className="text-xs text-slate-500">
                                {appointment.payment.method === "netbanking"
                                  ? "Net Banking"
                                  : appointment.payment.method.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-sm text-gray-500">
                            Amount
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {appointment.payment
                              ? `₹${appointment.payment.amount}`
                              : "Not available"}
                          </p>
                        </div>
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

                    {appointment.actionReason && appointment.actionBy && (
                      <div className="mt-5 border-t border-gray-100 pt-5">
                        <p className="text-sm text-gray-500">
                          {appointment.actionType === "cancelled"
                            ? "Cancellation Reason"
                            : "Reschedule Reason"}{" • "}
                          {appointment.actionBy === "doctor"
                            ? "Doctor"
                            : "Patient"}
                        </p>
                        <p className="mt-1 font-medium text-slate-900">
                          {appointment.actionReason}
                        </p>
                      </div>
                    )}

                    {/* View Details */}
                    <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">

                      <button
                        type="button"
                        onClick={() =>
                          openDetails(
                            appointment
                          )
                        }
                        className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                          Reschedule
                        </button>
                      )}

                      {canStartOnlineConsultation && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/doctors/consultation/${encodeURIComponent(appointment.id)}`
                            )
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          Start Consultation
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
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 transition-colors duration-200 hover:bg-blue-100/60">
                          <p className="text-sm font-semibold text-blue-700">
                            Appointment Completed
                          </p>

                          <p className="mt-1 text-sm text-blue-600">
                            This appointment is
                            read-only.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              openFollowUp(appointment)
                            }
                            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                          >
                            Recommend Follow-up
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Missed */}
                    {appointment.status ===
                      "missed" && (
                      <div className="mt-3 border-t border-gray-100 pt-5">
                        <div className="rounded-lg border border-slate-200 bg-gray-50 px-4 py-3 transition-colors duration-200 hover:bg-slate-100/70">
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
                        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 transition-colors duration-200 hover:bg-red-100/60">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/50 p-6">

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
                className="grid size-9 place-items-center rounded-full text-xl text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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

                <div className="mt-3 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/40">

                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700 transition-transform duration-200 hover:scale-105">
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

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-sm text-slate-500">
                      Doctor
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedAppointment.clinician
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-sm text-slate-500">
                      Specialty
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        selectedAppointment.specialty
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-sm text-slate-500">
                      Date & Time
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDateTime(
                        selectedAppointment.startsAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
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

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                    <p className="text-sm text-slate-500">
                      Appointment Type
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedAppointment.consultationType === "online"
                        ? "Online Consultation"
                        : "In-person Consultation"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
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

                <div className="mt-3 rounded-xl border border-slate-200 p-4 transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">
                  <p className="text-sm leading-6 text-slate-700">
                    {
                      selectedAppointment.reason
                    }
                  </p>
                </div>
              </section>

              {selectedAppointment.actionReason && selectedAppointment.actionBy && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {selectedAppointment.actionType === "cancelled"
                      ? "Cancellation Details"
                      : "Reschedule Details"}
                  </h3>
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      {selectedAppointment.actionType === "cancelled"
                        ? "Cancelled"
                        : "Rescheduled"}{" "}
                      by {selectedAppointment.actionBy === "doctor" ? "Doctor" : "Patient"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      {selectedAppointment.actionReason}
                    </p>
                  </div>
                </section>
              )}

              {/* Payment Details */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Payment Details
                </h3>

                {selectedAppointment.payment ? (
                  <div className="mt-3 grid gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">
                        Payment Status
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          selectedAppointment.payment.status === "paid"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                            : selectedAppointment.payment.status === "failed"
                            ? "border-red-200 bg-red-100 text-red-700"
                            : "border-amber-200 bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedAppointment.payment.status === "paid"
                          ? "Paid"
                          : selectedAppointment.payment.status === "failed"
                          ? "Failed"
                          : "Pending"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Amount
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        ₹{selectedAppointment.payment.amount}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Payment Method
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedAppointment.payment.method === "netbanking"
                          ? "Net Banking"
                          : selectedAppointment.payment.method.toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Transaction ID
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                        {selectedAppointment.payment.transactionId}
                      </p>
                    </div>

                    {selectedAppointment.payment.paidAt && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-slate-500">
                          Paid At
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDateTime(
                            selectedAppointment.payment.paidAt
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      No payment information is available for this appointment.
                    </p>
                  </div>
                )}
              </section>

              {/* Status */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </h3>

                <div className="mt-3">
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
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
              {/* Patient Review */}
{selectedAppointment.review && (
  <section>
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      Patient Review
    </h3>

    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors duration-200 hover:bg-amber-100/60">
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {"★".repeat(selectedAppointment.review.rating)}
        </span>

        <span className="text-sm font-semibold text-slate-700">
          {selectedAppointment.review.rating}/5
        </span>
      </div>

      {selectedAppointment.review.comment && (
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {selectedAppointment.review.comment}
        </p>
      )}
    </div>
  </section>
)}

            </div>

            {/* Details Actions */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:justify-end">

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
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                    className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                      className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                      className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
                      className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                    >
                      Mark as Missed
                    </button>
                  </>
                )}

              {/* Read only */}
         {selectedAppointment.status === "completed" && (
  <div className="mr-auto rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 transition-colors duration-200 hover:bg-blue-100/60">
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
  <p className="mr-auto self-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
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

      updateStoreAppointment(
        updatedAppointment.id,
        updatedAppointment
      );
    }}
  />
)}

<div className="mt-4 flex justify-end">

<button
  type="button"
  onClick={closeDetails}
  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
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
      {/* Follow-up Recommendation Modal */}
      {/* ================================================= */}

      {followUpAppointment && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="follow-up-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeFollowUp();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="border-b border-slate-200 bg-slate-50/50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                    Follow-up Recommendation
                  </p>

                  <h2
                    id="follow-up-title"
                    className="mt-1 text-2xl font-bold text-slate-900"
                  >
                    Recommend a follow-up
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose when the patient should return for a follow-up appointment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeFollowUp}
                  aria-label="Close follow-up recommendation"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Patient
                </p>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid size-11 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                    {followUpAppointment.patient.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {followUpAppointment.patient.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {followUpAppointment.specialty}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Follow-up after
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {["7", "15", "30"].map((days) => (
                    <label
                      key={days}
                      className={`cursor-pointer rounded-xl border p-4 text-center transition-all duration-200 ${
                        followUpDays === days
                          ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="follow-up-days"
                        value={days}
                        checked={followUpDays === days}
                        onChange={(event) =>
                          setFollowUpDays(event.target.value)
                        }
                        className="sr-only"
                      />
                      <span className="block text-lg font-bold text-slate-900">
                        {days}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">
                        days
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="follow-up-note"
                  className="text-sm font-semibold text-slate-700"
                >
                  Note
                </label>
                <textarea
                  id="follow-up-note"
                  value={followUpNote}
                  onChange={(event) =>
                    setFollowUpNote(event.target.value)
                  }
                  rows={4}
                  placeholder="Add an optional follow-up note for the patient..."
                  className="mt-3 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeFollowUp}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRecommendFollowUp}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Recommend Follow-up
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* Reschedule Modal */}
      {/* ================================================= */}

      {rescheduleAppointment && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
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

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/50 p-6">

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
                className="grid size-9 place-items-center rounded-full text-xl text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                ×
              </button>

            </div>

            {/* Body */}
            <div className="p-6">

              {rescheduleError && (
                <div
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-200"
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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/30">

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
                                  className={`rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
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

            {/* Reschedule Reason */}
            <div className="border-t border-slate-200 p-6">
              <label
                htmlFor="doctor-reschedule-reason"
                className="text-sm font-semibold text-slate-700"
              >
                Reason for Rescheduling
              </label>
              <textarea
                id="doctor-reschedule-reason"
                value={actionReason}
                onChange={(event) => {
                  setActionReason(event.target.value);
                  if (rescheduleError) {
                    setRescheduleError("");
                  }
                }}
                rows={4}
                placeholder="Please explain why this appointment needs to be rescheduled..."
                className="mt-3 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                This reason will be shared with the patient.
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeReschedule}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
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
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* ================================================= */}
      {/* Action Reason Modal */}
      {/* ================================================= */}

      {reasonDialog && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-reason-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setReasonDialog(null);
              setReasonError("");
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/50 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                  Cancellation Reason
                </p>
                <h2
                  id="cancel-reason-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  Why are you cancelling this appointment?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This reason will be shared with the patient.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReasonDialog(null);
                  setReasonError("");
                }}
                aria-label="Close cancellation reason"
                className="grid size-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <label
                htmlFor="doctor-cancellation-reason"
                className="text-sm font-semibold text-slate-700"
              >
                Reason
              </label>
              {reasonError && (
                <div
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {reasonError}
                </div>
              )}

              <textarea
                id="doctor-cancellation-reason"
                value={reasonDialog.reason}
                onChange={(event) =>
                  setReasonDialog({
                    ...reasonDialog,
                    reason: event.target.value,
                  })
                }
                rows={5}
                placeholder="e.g. Emergency surgery scheduled."
                className="mt-3 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setReasonDialog(null);
                  setReasonError("");
                }}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelReasonSubmit}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* Confirmation Modal */}
      {/* ================================================= */}

      {confirmation && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmation(null);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50/50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                    Confirmation
                  </p>

                  <h2
                    id="confirmation-title"
                    className="mt-1 text-xl font-bold text-slate-900"
                  >
                    Confirm Action
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  aria-label="Close confirmation"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xl text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600">
                {confirmation.message}
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmation.onConfirm}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}