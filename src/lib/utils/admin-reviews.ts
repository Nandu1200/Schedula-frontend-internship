import { appointments as mockAppointments } from "@/lib/mock-data/appointments";
import { getAdminAppointments } from "@/lib/utils/admin-appointments";
import type { Appointment } from "@/types/appointment";
import type { AdminReview } from "@/types/review";

const getDoctorIdFromAppointmentId = (
  appointmentId: string
) => {
  const parts = appointmentId.split("-");
  const slotIndex = parts.indexOf("slot");

  if (slotIndex <= 1) {
    return null;
  }

  return parts.slice(1, slotIndex).join("-") || null;
};

const getPatientId = (appointment: Appointment) => {
  if (appointment.patient.id) {
    return appointment.patient.id;
  }

  return `patient-${appointment.patient.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
};

const getStoredBoolean = (
  key: string,
  fallback: boolean
) => {
  const value = localStorage.getItem(key);

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

const getStoredString = (key: string) => {
  const value = localStorage.getItem(key);
  return value?.trim() || "";
};

const getMockReview = (appointmentId: string) => {
  const mockAppointment = mockAppointments.find(
    (appointment) => appointment.id === appointmentId
  );

  if (
    !mockAppointment ||
    mockAppointment.status !== "completed" ||
    typeof mockAppointment.review?.rating !== "number" ||
    mockAppointment.review.rating < 1 ||
    mockAppointment.review.rating > 5
  ) {
    return null;
  }

  return mockAppointment.review;
};

export const getAdminReviews = (): AdminReview[] => {
  const appointments = getAdminAppointments();

  return appointments
    .filter((appointment) => appointment.status === "completed")
    .flatMap((appointment): AdminReview[] => {
      const reviewId = `review-${appointment.id}`;

      if (
        getStoredBoolean(
          `reviewRemoved-${reviewId}`,
          false
        )
      ) {
        return [];
      }

      const review =
        appointment.review ??
        getMockReview(appointment.id);

      if (
        !review ||
        typeof review.rating !== "number" ||
        review.rating < 1 ||
        review.rating > 5
      ) {
        return [];
      }

      const doctorId =
        getDoctorIdFromAppointmentId(
          appointment.id
        ) ??
        `doctor-${appointment.clinician
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}`;

      const adminReview: AdminReview = {
        id: reviewId,
        appointmentId: appointment.id,
        doctorId,
        doctorName: appointment.clinician,
        patientId: getPatientId(appointment),
        patientName: appointment.patient.name,
        rating: review.rating,
        comment: review.comment?.trim() ?? "",
        createdAt: appointment.startsAt,
        reported: getStoredBoolean(
          `reviewReported-${reviewId}`,
          false
        ),
        hidden: getStoredBoolean(
          `reviewHidden-${reviewId}`,
          false
        ),
      };

      const reportReason = getStoredString(
        `reviewReportReason-${reviewId}`
      );

      if (reportReason) {
        adminReview.reportReason = reportReason;
      }

      return [adminReview];
    })
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
    );
};
