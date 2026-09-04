"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { addNotification } from "@/lib/utils/notifications";
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
    const [reviewAppointment, setReviewAppointment] =
  useState<Appointment | null>(null);

const [reviewRating, setReviewRating] =
  useState(0);

const [reviewComment, setReviewComment] =
  useState("");

  const [prescriptionAppointment, setPrescriptionAppointment] =
  useState<Appointment | null>(null);

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
  if (!appointment.prescription) {
    window.alert(
      `Prescription for ${appointment.clinician} is not available.`
    );
    return;
  }

  setPrescriptionAppointment(appointment);
};

const handleDownloadPrescription = (
  appointment: Appointment
) => {
  if (!appointment.prescription) { 
    window.alert(
      `Prescription for ${appointment.clinician} is not available.`
    );
    return;
  }

  const prescription = appointment.prescription;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Prescription", 20, 20);

  doc.setFontSize(12);
  doc.text(
    `Doctor: ${appointment.clinician}`,
    20,
    35
  );

  doc.text(
    `Specialty: ${appointment.specialty}`,
    20,
    45
  );

  doc.text(
    `Date: ${formatDateTime(appointment.startsAt)}`,
    20,
    55
  );

  doc.setFontSize(14);
  doc.text("Medicines", 20, 75);

  doc.setFontSize(12);

  prescription.medicines.forEach(
  (medicine, index) => {
    doc.text(
      `${index + 1}. ${medicine.name} - ${medicine.dosage} - ${medicine.duration}`,
      25,
      88 + index * 10
    );
  }
);

  const instructionsY =
    95 + prescription.medicines.length * 10;

  doc.setFontSize(14);
  doc.text("Instructions", 20, instructionsY);

  doc.setFontSize(12);
  doc.text(
    prescription.instructions,
    20,
    instructionsY + 12,
    {
      maxWidth: 170,
    }
  );

  doc.save(
    `prescription-${appointment.id}.pdf`
  );
};

  const handleReviewDoctor = (
  appointment: Appointment
) => {
  setReviewAppointment(appointment);

  setReviewRating(
    appointment.review?.rating ?? 0
  );

  setReviewComment(
    appointment.review?.comment ?? ""
  );
};

const handleSubmitReview = () => {
  if (!reviewAppointment) {
    return;
  }

  if (reviewRating === 0) {
    window.alert("Please select a rating.");
    return;
  }
  const appointmentIdParts =
  reviewAppointment.id.split("-");

const slotIndex =
  appointmentIdParts.indexOf("slot");

const doctorIndex =
  appointmentIdParts.indexOf("doctor");

const doctorId =
  doctorIndex !== -1 && slotIndex !== -1
    ? appointmentIdParts
        .slice(doctorIndex, slotIndex)
        .join("-")
    : null;

  const allAppointments = JSON.parse(
    localStorage.getItem("appointments") || "[]"
  ) as Appointment[];

  const updatedAppointments = allAppointments.map(
    (appointment) =>
      appointment.id === reviewAppointment.id
        ? {
            ...appointment,
            review: {
              rating: reviewRating,
              comment: reviewComment.trim(),
            },
          }
        : appointment
  );

  localStorage.setItem(
    "appointments",
    JSON.stringify(updatedAppointments)
  );

  if (doctorId) {
  addNotification({
    id: `notification-${Date.now()}-review`,
    userId: doctorId,
    type: "completed",
    title: "New Patient Review",
    message: `${reviewAppointment.patient.name} has submitted a review for your appointment.`,
    appointmentId: reviewAppointment.id,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

  const storedPatient =
  localStorage.getItem("loggedInPatient");

if (storedPatient) {
  const patient = JSON.parse(
    storedPatient
  ) as LoggedInPatient;

  setAppointments(
    updatedAppointments.filter(
      (appointment) =>
        appointment.patient.name
          .trim()
          .toLowerCase() ===
        patient.name.trim().toLowerCase()
    )
  );
}

  setReviewAppointment(null);
  setReviewRating(0);
  setReviewComment("");

  window.alert("Review submitted successfully.");
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
        doctorIndex ,
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
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf9]">
        <p className="text-sm font-medium text-slate-500">
          Loading appointments...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7faf9] via-white to-emerald-50/30 px-4 py-8 transition-colors duration-200 sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Patient Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Appointments
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View and manage your upcoming and previous appointments.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition-shadow duration-200"
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
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
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
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-10">

            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-600 ring-8 ring-emerald-50/70">
              ✓
            </div>

            <p className="mt-4 text-lg font-bold tracking-tight text-slate-900">
              No{" "}
              {activeTab}{" "}
              appointments
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Appointments in this category will appear here.
            </p>

          </div>
        ) : (
          <div className="space-y-5">

            {filteredAppointments.map(
              (appointment) => (
                <article
                  key={appointment.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6"
                >

                  {/* Doctor + Status */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                    <div className="flex items-center gap-4">

                      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-700 shadow-sm ring-4 ring-emerald-50 transition-transform duration-200 group-hover:scale-105">
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
                        <h2 className="text-lg font-bold tracking-tight text-slate-900">
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
                  <div className="mt-5 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Date */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date & Time
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDateTime(
                          appointment.startsAt
                        )}
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Appointment Type
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {getAppointmentType(
                          appointment
                        )}
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Duration
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {
                          appointment.durationMinutes
                        }{" "}
                        minutes
                      </p>
                    </div>

                    {/* Room */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Room
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {appointment.room}
                      </p>
                    </div>

                  </div>

                  {/* Reason */}
                  <div className="mt-5 border-t border-slate-100 pt-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reason
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {appointment.reason}
                    </p>

                  </div>

                  {/* Follow-up Recommendation */}
                  {appointment.followUp?.recommended && (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-emerald-800">
                            Follow-up Recommended
                          </p>
                          <p className="mt-1 text-sm leading-6 text-emerald-700">
                            Your doctor recommends a follow-up after{" "}
                            <span className="font-bold">
                              {appointment.followUp.afterDays} days
                            </span>
                            .
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          {appointment.followUp.afterDays} days
                        </span>
                      </div>

                      {appointment.followUp.note && (
                        <div className="mt-3 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Doctor&apos;s Note
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {appointment.followUp.note}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleRebookAppointment(appointment)
                        }
                        className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        Book Follow-up
                      </button>
                    </div>
                  )}

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
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 shadow-sm">
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
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

                      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="font-semibold text-slate-900">
                            Prescription
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Prescription availability for this appointment.
                          </p>
                        </div>

                        <span
  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
    appointment.prescription
      ?"bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-amber-50 text-amber-700 ring-amber-200"
  }`}
>
  {appointment.prescription
    ? "Prescription Available"
    : "Prescription Not Available"}
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
                          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
>
  {appointment.review
    ? "Edit Review"
    : "Review Doctor"}
</button>
{appointment.review && (
  <div className="col-span-full rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
    <p className="text-sm font-semibold text-emerald-800">
      Your Review
    </p>

    <p className="mt-1 text-yellow-500">
      {"★".repeat(appointment.review.rating)}
      {"☆".repeat(5 - appointment.review.rating)}
    </p>

    {appointment.review.comment && (
      <p className="mt-2 text-sm text-slate-600">
        {appointment.review.comment}
      </p>
    )}
  </div>
)}

                        <button
                          type="button"
                          onClick={() =>
                            handleRebookAppointment(
                              appointment
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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

                      <p className="text-sm leading-6 text-slate-500">
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
              {reviewAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Review Doctor
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {reviewAppointment.clinician}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReviewAppointment(null);
                    setReviewRating(0);
                    setReviewComment("");
                  }}
                  className="grid size-9 place-items-center rounded-lg text-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  ×
                </button>
              </div>

              <div className="mb-5">
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Your Rating
                </p>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className={`text-3xl transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                        rating <= reviewRating
                          ? "text-yellow-400"
                          : "text-slate-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="review-comment"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Your Review
                </label>

                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(event) =>
                    setReviewComment(event.target.value)
                  }
                  placeholder="Write your experience..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReviewAppointment(null);
                    setReviewRating(0);
                    setReviewComment("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}

        {prescriptionAppointment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
      {/* Modal Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Patient Prescription
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Prescription
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setPrescriptionAppointment(null)}
          className="grid size-9 place-items-center rounded-lg text-2xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label="Close prescription"
        >
          ×
        </button>
      </div>

      {/* Prescription Content */}
      <div className="space-y-6 bg-gradient-to-b from-white to-slate-50/40 px-6 py-6 sm:px-7">
        {/* Doctor Information */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">
            Doctor
          </p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {prescriptionAppointment.clinician}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {prescriptionAppointment.specialty}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {formatDateTime(
              prescriptionAppointment.startsAt
            )}
          </p>
        </div>

        {/* Diagnosis */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Diagnosis
          </h3>

          <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-slate-800">
              {prescriptionAppointment.prescription?.diagnosis}
            </p>
          </div>
        </div>

        {/* Medicines */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Medicines
          </h3>

          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 gap-2 border-b border-slate-200 bg-slate-100/70 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600 sm:grid-cols-3 sm:gap-0">
              <span>Medicine</span>
              <span>Dosage</span>
              <span>Duration</span>
            </div>

            {prescriptionAppointment.prescription?.medicines.map(
              (medicine, index) => (
                <div
                  key={`${medicine.name}-${index}`}
                  className="grid grid-cols-1 gap-2 border-b border-slate-100 px-4 py-3 text-sm transition-colors duration-200 hover:bg-slate-50 last:border-b-0 sm:grid-cols-3 sm:gap-3"
                >
                  <span className="font-medium text-slate-900">
                    {medicine.name}
                  </span>

                  <span className="text-slate-600">
                    {medicine.dosage}
                  </span>

                  <span className="text-slate-600">
                    {medicine.duration}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            Instructions
          </h3>

          <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm leading-6 text-slate-700">
              {prescriptionAppointment.prescription?.instructions}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-6 py-5 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
        <button
          type="button"
          onClick={() => setPrescriptionAppointment(null)}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Close
        </button>

        <button
          type="button"
          onClick={() => {
            handleDownloadPrescription(
              prescriptionAppointment
            );
          }}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Download PDF
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}
