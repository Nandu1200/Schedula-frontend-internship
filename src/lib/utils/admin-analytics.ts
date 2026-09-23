import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";
import type { Patient } from "@/types/patient";
import type { AdminDoctor } from "@/types/admin";
import type { Payment } from "@/types/payment";

export type AdminAnalytics = {
  appointments: {
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    pending: number;
    missed: number;
    online: number;
    inPerson: number;
  };

  users: {
    totalDoctors: number;
    totalPatients: number;
  };

  doctorVerification: {
    approved: number;
    pending: number;
    rejected: number;
  };

  payments: {
    totalRevenue: number;
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
  };
};

export const calculateAdminAnalytics = (
  appointments: Appointment[],
  doctors: Doctor[],
  patients: Patient[],
  adminDoctors: AdminDoctor[],
  payments: Payment[]
): AdminAnalytics => {
  const appointmentStats = appointments.reduce(
    (stats, appointment) => {
      stats.total += 1;

      if (
        appointment.status === "pending"
      ) {
        stats.pending += 1;
      }

      if (
        appointment.status === "confirmed" ||
        appointment.status === "upcoming"
      ) {
        stats.upcoming += 1;
      }

      if (
        appointment.status === "completed"
      ) {
        stats.completed += 1;
      }

      if (
        appointment.status === "cancelled"
      ) {
        stats.cancelled += 1;
      }

      if (
        appointment.status === "missed"
      ) {
        stats.missed += 1;
      }

      if (
        appointment.consultationType === "online"
      ) {
        stats.online += 1;
      }

      if (
        appointment.consultationType === "in-person"
      ) {
        stats.inPerson += 1;
      }

      return stats;
    },
    {
      total: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      missed: 0,
      online: 0,
      inPerson: 0,
    }
  );

  const doctorVerification = adminDoctors.reduce(
    (stats, doctor) => {
      if (
        doctor.verificationStatus === "approved"
      ) {
        stats.approved += 1;
      }

      if (
        doctor.verificationStatus === "pending"
      ) {
        stats.pending += 1;
      }

      if (
        doctor.verificationStatus === "rejected"
      ) {
        stats.rejected += 1;
      }

      return stats;
    },
    {
      approved: 0,
      pending: 0,
      rejected: 0,
    }
  );

  const paymentStats = payments.reduce(
    (stats, payment) => {
      if (payment.status === "paid") {
        stats.paid += 1;
        stats.totalRevenue += payment.amount;
      }

      if (payment.status === "pending") {
        stats.pending += 1;
      }

      if (payment.status === "failed") {
        stats.failed += 1;
      }

      if (payment.status === "refunded") {
        stats.refunded += 1;
      }

      return stats;
    },
    {
      totalRevenue: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
    }
  );

  return {
    appointments: appointmentStats,

    users: {
      totalDoctors: doctors.length,
      totalPatients: patients.length,
    },

    doctorVerification,

    payments: paymentStats,
  };
};