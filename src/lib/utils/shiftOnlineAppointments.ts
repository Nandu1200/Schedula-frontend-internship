import type { Appointment } from "@/types/appointment";

/**
 * Shifts the next online appointments of the same doctor
 * when a previous online consultation finishes late.
 *
 * The delay is propagated through the appointment chain.
 */
export const shiftOnlineAppointments = (
  appointments: Appointment[],
  completedAppointment: Appointment,
  delayMinutes: number
): Appointment[] => {
  if (
    delayMinutes <= 0 ||
    completedAppointment.consultationType !== "online"
  ) {
    return appointments;
  }

  const delayMs = delayMinutes * 60 * 1000;

  const completedStartAt = new Date(
    completedAppointment.startsAt
  ).getTime();

  return appointments.map((appointment) => {
    if (
      appointment.id === completedAppointment.id ||
      appointment.consultationType !== "online" ||
      appointment.clinician !== completedAppointment.clinician ||
      appointment.status === "cancelled" ||
      appointment.status === "completed"
    ) {
      return appointment;
    }

    const appointmentStartAt = new Date(
      appointment.startsAt
    ).getTime();

    if (appointmentStartAt <= completedStartAt) {
      return appointment;
    }

    return {
      ...appointment,
      startsAt: new Date(
        appointmentStartAt + delayMs
      ).toISOString(),
    };
  });
};