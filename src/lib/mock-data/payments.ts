import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@/types/payment";

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

const getFallbackPatientId = (name: string) => {
  return `patient-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
};

const getCreatedAt = (appointment: Appointment) => {
  const appointmentStart = new Date(appointment.startsAt);

  appointmentStart.setHours(
    appointmentStart.getHours() - 2
  );

  return appointmentStart.toISOString();
};

const getMockTransactionId = (appointmentId: string) => {
  return `TXN-${appointmentId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")}`;
};

const getDoctorForAppointment = (
  appointment: Appointment,
  doctors: Array<
    Pick<Doctor, "id" | "name" | "consultationFee">
  >
) => {
  const doctorIdFromAppointment =
    getDoctorIdFromAppointmentId(appointment.id);

  return (
    (doctorIdFromAppointment
      ? doctors.find(
          (doctor) =>
            doctor.id === doctorIdFromAppointment
        )
      : undefined) ??
    doctors.find(
      (doctor) => doctor.name === appointment.clinician
    )
  );
};

const paymentMethods: PaymentMethod[] = [
  "upi",
  "card",
  "netbanking",
];

/*
 * Payment records are derived one-to-one from appointments.
 */
export const payments: Payment[] = [];

export const buildPaymentsFromAppointments = (
  appointments: Appointment[],
  doctors: Array<
    Pick<Doctor, "id" | "name" | "consultationFee">
  >
): Payment[] => {
  return appointments
    .map((appointment, index) => {
      const doctor = getDoctorForAppointment(
        appointment,
        doctors
      );

      const doctorIdFromAppointment =
        getDoctorIdFromAppointmentId(appointment.id);

      const doctorId =
        doctor?.id ??
        doctorIdFromAppointment ??
        `doctor-${appointment.clinician
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}`;

      const sourcePayment = appointment.payment;

      const status: PaymentStatus =
        appointment.status === "cancelled" &&
        sourcePayment?.status === "paid"
          ? "refunded"
          : sourcePayment?.status ?? "pending";

      const amount =
        sourcePayment?.amount ??
        doctor?.consultationFee ??
        500;

      const method =
        sourcePayment?.method ??
        paymentMethods[index % paymentMethods.length];

      const createdAt =
        sourcePayment?.paidAt ??
        getCreatedAt(appointment);

      const transactionId =
        sourcePayment?.transactionId ??
        getMockTransactionId(appointment.id);

      const paidAt =
        status === "paid" || status === "refunded"
          ? sourcePayment?.paidAt ?? createdAt
          : undefined;

      const refundedAt =
        status === "refunded"
          ? new Date(
              new Date(createdAt).getTime() +
                24 * 60 * 60 * 1000
            ).toISOString()
          : undefined;

      const refundAmount =
        status === "refunded" ? amount : undefined;

      const refundReason =
        status === "refunded"
          ? appointment.actionReason ??
            "Payment refunded after appointment cancellation."
          : undefined;

      return {
        id: `payment-${appointment.id}`,
        transactionId,
        appointmentId: appointment.id,
        doctorId,
        doctorName:
          doctor?.name ?? appointment.clinician,
        patientId:
          appointment.patient.id ??
          getFallbackPatientId(
            appointment.patient.name
          ),
        patientName: appointment.patient.name,
        amount,
        method,
        status,
        appointmentDate: appointment.startsAt,
        createdAt,
        paidAt,
        refundedAt,
        refundAmount,
        refundReason,
      };
    })
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
    );
};
