import type { Appointment } from "@/types/appointment";

/**
 * Returns the scheduled end time of an appointment.
 */
export const getScheduledEndAt = (
  appointment: Appointment
): number => {
  const startTime = new Date(
    appointment.startsAt
  ).getTime();

  return (
    startTime +
    appointment.durationMinutes * 60 * 1000
  );
};

/**
 * Returns the delay in milliseconds.
 *
 * Example:
 * Scheduled end: 10:30 AM
 * Actual end:    10:38 AM
 *
 * Delay: 8 minutes
 */
export const getConsultationDelayMs = (
  appointment: Appointment
): number => {
  if (!appointment.actualEndAt) {
    return 0;
  }

  const scheduledEndAt =
    getScheduledEndAt(appointment);

  const actualEndAt = new Date(
    appointment.actualEndAt
  ).getTime();

  return Math.max(
    0,
    actualEndAt - scheduledEndAt
  );
};

/**
 * Returns the delay in minutes.
 */
export const getConsultationDelayMinutes = (
  appointment: Appointment
): number => {
  return Math.ceil(
    getConsultationDelayMs(appointment) /
      (60 * 1000)
  );
};

/**
 * Checks whether an online consultation
 * finished later than its scheduled end time.
 */
export const hasConsultationDelay = (
  appointment: Appointment
): boolean => {
  return (
    appointment.consultationType === "online" &&
    getConsultationDelayMs(appointment) > 0
  );
};