import { appointments as mockAppointments } from "@/lib/mock-data/appointments";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

const isAppointmentStatus = (
  value: string
): value is AppointmentStatus => {
  return [
    "pending",
    "confirmed",
    "upcoming",
    "completed",
    "cancelled",
    "missed",
  ].includes(value);
};

const isValidAppointment = (
  value: unknown
): value is Appointment => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Appointment>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.clinician === "string" &&
    typeof candidate.startsAt === "string" &&
    typeof candidate.status === "string" &&
    isAppointmentStatus(candidate.status) &&
    typeof candidate.patient === "object" &&
    candidate.patient !== null &&
    typeof candidate.patient.name === "string"
  );
};

export const getAdminAppointments = (): Appointment[] => {
  const appointmentsById = new Map<string, Appointment>();

  mockAppointments.forEach((appointment) => {
    appointmentsById.set(appointment.id, appointment);
  });

  const storedAppointments = localStorage.getItem("appointments");

  if (storedAppointments) {
    try {
      const parsedAppointments = JSON.parse(
        storedAppointments
      ) as unknown;

      if (Array.isArray(parsedAppointments)) {
        parsedAppointments
          .filter(isValidAppointment)
          .forEach((appointment) => {
            appointmentsById.set(appointment.id, appointment);
          });
      }
    } catch {
      // Keep the built-in appointments when stored data is invalid.
    }
  }

  return Array.from(appointmentsById.values());
};
