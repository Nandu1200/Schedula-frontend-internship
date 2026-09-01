"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot } from "@/types/availability";

type LoggedInPatient = {
  name: string;
  id: string;
};

type AppointmentTab =
  | "upcoming"
  | "completed"
  | "cancelled"
  | "missed";

const tabLabels: {
  key: AppointmentTab;
  label: string;
}[] = [
  {
    key: "upcoming",
    label: "Upcoming",
  },
  {
    key: "completed",
    label: "Completed",
  },
  {
    key: "cancelled",
    label: "Cancelled",
  },
  {
    key: "missed",
    label: "Missed",
  },
];

const statusStyles: Record<
  Appointment["status"],
  string
> = {
  pending:
    "border-yellow-300 bg-yellow-50 text-yellow-700",
  confirmed:
    "border-emerald-300 bg-emerald-50 text-emerald-700",
  upcoming:
    "border-blue-300 bg-blue-50 text-blue-700",
  completed:
    "border-slate-300 bg-slate-50 text-slate-700",
  cancelled:
    "border-red-300 bg-red-50 text-red-700",
  missed:
    "border-orange-300 bg-orange-50 text-orange-700",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getAppointmentType = (
  appointment: Appointment
) => {
  return (
    (appointment as Appointment & {
      appointmentType?: string;
    }).appointmentType ?? "Consultation"
  );
};

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [cancellingId, setCancellingId] =
    useState("");

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<AppointmentTab>("upcoming");

  useEffect(() => {
    const loadAppointments = () => {
      const storedPatient =
        localStorage.getItem("loggedInPatient");

      const storedAppointments =
        localStorage.getItem("appointments");

      if (
        !storedPatient ||
        !storedAppointments
      ) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        const patient =
          JSON.parse(
            storedPatient
          ) as LoggedInPatient;

        const allAppointments =
          JSON.parse(
            storedAppointments
          ) as Appointment[];

        /*
         * Show only appointments belonging
         * to the currently logged-in patient.
         */
        const patientAppointments =
          allAppointments.filter(
            (appointment) =>
              appointment.patient.name
                .trim()
                .toLowerCase() ===
              patient.name.trim().toLowerCase()
          );

        /*
         * Sort latest appointments first.
         */
        patientAppointments.sort(
          (first, second) =>
            new Date(
              second.startsAt
            ).getTime() -
            new Date(
              first.startsAt
            ).getTime()
        );

        setAppointments(
          patientAppointments
        );
      } catch {
        setAppointments([]);
      }

      setLoading(false);
    };

    const timer =
      window.setTimeout(
        loadAppointments,
        0
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const tabCounts = useMemo(() => {
    return {
      upcoming: appointments.filter(
        (appointment) =>
          appointment.status ===
            "pending" ||
          appointment.status ===
            "confirmed" ||
          appointment.status ===
            "upcoming"
      ).length,

      completed: appointments.filter(
        (appointment) =>
          appointment.status ===
          "completed"
      ).length,

      cancelled: appointments.filter(
        (appointment) =>
          appointment.status ===
          "cancelled"
      ).length,

      missed: appointments.filter(
        (appointment) =>
          appointment.status ===
          "missed"
      ).length,
    };
  }, [appointments]);

  const filteredAppointments =
    useMemo(() => {
      switch (activeTab) {
        case "completed":
          return appointments.filter(
            (appointment) =>
              appointment.status ===
              "completed"
          );

        case "cancelled":
          return appointments.filter(
            (appointment) =>
              appointment.status ===
              "cancelled"
          );

        case "missed":
          return appointments.filter(
            (appointment) =>
              appointment.status ===
              "missed"
          );

        case "upcoming":
        default:
          return appointments.filter(
            (appointment) =>
              appointment.status ===
                "pending" ||
              appointment.status ===
                "confirmed" ||
              appointment.status ===
                "upcoming"
          );
      }
    }, [
      activeTab,
      appointments,
    ]);

  const handleCancelAppointment = (
    appointment: Appointment
  ) => {
    if (cancellingId) {
      return;
    }

    const shouldCancel =
      window.confirm(
        "Are you sure you want to cancel this appointment?"
      );

    if (!shouldCancel) {
      return;
    }

    setCancellingId(
      appointment.id
    );

    setError("");

    try {
      /*
       * Get appointments.
       */
      const storedAppointments =
        localStorage.getItem(
          "appointments"
        );

      if (!storedAppointments) {
        throw new Error(
          "Appointments could not be found."
        );
      }

      const allAppointments =
        JSON.parse(
          storedAppointments
        ) as Appointment[];

      /*
       * Mark appointment as cancelled.
       */
      const updatedAppointments =
        allAppointments.map(
          (item) =>
            item.id === appointment.id
              ? {
                  ...item,
                  status:
                    "cancelled" as const,
                }
              : item
        );

      localStorage.setItem(
        "appointments",
        JSON.stringify(
          updatedAppointments
        )
      );

      /*
       * Appointment IDs created during booking
       * follow this format:
       *
       * appointment-doctorId-slotId
       */
      const appointmentIdParts =
        appointment.id.split("-");

      const slotIndex =
        appointmentIdParts.indexOf(
          "slot"
        );

      const doctorIndex =
        appointmentIdParts.indexOf(
          "doctor"
        );

      if (
        doctorIndex !== -1 &&
        slotIndex !== -1
      ) {
        const doctorId =
          appointmentIdParts
            .slice(
              doctorIndex,
              slotIndex
            )
            .join("-");

        const slotId =
          appointmentIdParts
            .slice(slotIndex)
            .join("-");

        /*
         * Get doctor's availability slots.
         */
        const storageKey =
          `availabilitySlots-${doctorId}`;

        const storedSlots =
          localStorage.getItem(
            storageKey
          );

        if (storedSlots) {
          const doctorSlots =
            JSON.parse(
              storedSlots
            ) as AvailabilitySlot[];

          /*
           * Make the cancelled slot
           * available again.
           */
          const updatedSlots =
            doctorSlots.map(
              (slot) =>
                slot.id === slotId
                  ? {
                      ...slot,
                      status:
                        "available" as const,
                    }
                  : slot
            );

          localStorage.setItem(
            storageKey,
            JSON.stringify(
              updatedSlots
            )
          );
        }
      }

      /*
       * Update the UI immediately.
       */
      setAppointments(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              appointment.id
                ? {
                    ...item,
                    status:
                      "cancelled" as const,
                  }
                : item
          )
      );
    } catch {
      setError(
        "Unable to cancel the appointment. Please try again."
      );
    }

    setCancellingId("");
  };

  const handleViewPrescription = (
    appointment: Appointment
  ) => {
    /*
     * Prescription UI will be connected
     * when prescription data is added.
     */
    window.alert(
      `Prescription for ${appointment.clinician} is not available yet.`
    );
  };

  const handleDownloadPrescription = (
    appointment: Appointment
  ) => {
    /*
     * PDF generation will be connected
     * when prescription data is added.
     */
    window.alert(
      `Prescription PDF for ${appointment.clinician} is not available yet.`
    );
  };

  const handleReviewDoctor = (
    appointment: Appointment
  ) => {
    /*
     * Review flow will be connected
     * in the Review Doctor step.
     */
    window.alert(
      `Review Doctor: ${appointment.clinician}`
    );
  };

 const handleRebookAppointment = (
  appointment: Appointment
) => {
  /*
   * Rebooking opens the same doctor's
   * profile so the patient can choose
   * a new available slot.
   */
  const appointmentIdParts =
    appointment.id.split("-");

  const slotIndex =
    appointmentIdParts.indexOf("slot");

  const doctorIndex =
    appointmentIdParts.indexOf("doctor");

  if (
    doctorIndex === -1 ||
    slotIndex === -1
  ) {
    setError(
      "Unable to rebook this appointment because the doctor information could not be found."
    );
    return;
  }

  const doctorId =
    appointmentIdParts
      .slice(
        doctorIndex,
        slotIndex
      )
      .join("-");

  if (!doctorId) {
    setError(
      "Unable to rebook this appointment because the doctor information could not be found."
    );
    return;
  }

  router.push(
  `/doctors/${encodeURIComponent(doctorId)}`
);
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

        {/* Header */}
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Patient Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My Appointments
          </h1>

          <p className="mt-2 text-slate-500">
            View and manage your upcoming and previous appointments.
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

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {tabLabels.map(
              (tab) => {
                const isActive =
                  activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.key
                      )
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {
                        tabCounts[
                          tab.key
                        ]
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Empty */}
        {filteredAppointments.length ===
        0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-xl text-emerald-600">
              ✓
            </div>

            <p className="mt-4 font-semibold text-slate-900">
              No{" "}
              {activeTab}{" "}
              appointments
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Appointments in this category will appear here.
            </p>

          </div>
        ) : (
          <div className="space-y-5">

            {filteredAppointments.map(
              (appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >

                  {/* Doctor + Status */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                    <div className="flex items-center gap-4">

                      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                        {appointment.clinician
                          .replace(
                            /^Dr\.?\s*/i,
                            ""
                          )
                          .split(" ")
                          .map(
                            (part) =>
                              part[0]
                          )
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {appointment.clinician}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {appointment.specialty}
                        </p>
                      </div>

                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-sm font-medium capitalize ${
                        statusStyles[
                          appointment.status
                        ]
                      }`}
                    >
                      {appointment.status}
                    </span>

                  </div>

                  {/* Details */}
                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Date */}
                    <div>
                      <p className="text-sm text-slate-500">
                        Date & Time
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {formatDateTime(
                          appointment.startsAt
                        )}
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-sm text-slate-500">
                        Appointment Type
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {getAppointmentType(
                          appointment
                        )}
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <p className="text-sm text-slate-500">
                        Duration
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {
                          appointment.durationMinutes
                        }{" "}
                        minutes
                      </p>
                    </div>

                    {/* Room */}
                    <div>
                      <p className="text-sm text-slate-500">
                        Room
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {appointment.room}
                      </p>
                    </div>

                  </div>

                  {/* Reason */}
                  <div className="mt-5 border-t border-slate-100 pt-5">

                    <p className="text-sm text-slate-500">
                      Reason
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {appointment.reason}
                    </p>

                  </div>

                  {/* Upcoming Actions */}
                  {(
                    appointment.status ===
                      "confirmed" ||
                    appointment.status ===
                      "upcoming"
                  ) && (
                    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">

                      <button
                        type="button"
                        onClick={() =>
                          handleCancelAppointment(
                            appointment
                          )
                        }
                        disabled={
                          cancellingId ===
                          appointment.id
                        }
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingId ===
                        appointment.id
                          ? "Cancelling..."
                          : "Cancel Appointment"}
                      </button>

                    </div>
                  )}

                  {/* Pending */}
                  {appointment.status ===
                    "pending" && (
                    <div className="mt-5 border-t border-slate-100 pt-5">

                      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                        Waiting for doctor confirmation.
                      </p>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleCancelAppointment(
                              appointment
                            )
                          }
                          disabled={
                            cancellingId ===
                            appointment.id
                          }
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingId ===
                          appointment.id
                            ? "Cancelling..."
                            : "Cancel Request"}
                        </button>
                      </div>

                    </div>
                  )}

                  {/* Completed Appointment Actions */}
                  {appointment.status ===
                    "completed" && (
                    <div className="mt-5 border-t border-slate-100 pt-5">

                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="font-semibold text-slate-900">
                            Prescription
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Prescription availability for this appointment.
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          Prescription Not Available
                        </span>

                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleViewPrescription(
                              appointment
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          View Prescription
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadPrescription(
                              appointment
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Download Prescription PDF
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleReviewDoctor(
                              appointment
                            )
                          }
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Review Doctor
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRebookAppointment(
                              appointment
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Rebook Appointment
                        </button>

                      </div>

                    </div>
                  )}

                  {/* Cancelled / Missed */}
                  {(
                    appointment.status ===
                      "cancelled" ||
                    appointment.status ===
                      "missed"
                  ) && (
                    <div className="mt-5 border-t border-slate-100 pt-5">

                      <p className="text-sm text-slate-500">
                        This appointment is read-only.
                      </p>

                    </div>
                  )}

                </article>
              )
            )}

          </div>
        )}

      </div>
    </main>
  );
}