import type { Prescription } from "@/types/prescription";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "missed";

export type ConsultationType = "online" | "in-person";

export type PaymentMethod = "upi" | "card" | "netbanking";

export type PaymentStatus = "pending" | "paid" | "failed";

export type AppointmentPayment = {
  status: PaymentStatus;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
};

export type Appointment = {
  id: string;

  patient: {
    id?: string;
    name: string;
    initials: string;
    age: number;
  };

  clinician: string;
  specialty: string;

  startsAt: string;
  durationMinutes: number;

  // Actual time when the doctor finishes the consultation.
  // Used to calculate consultation delay for online appointments.
  actualEndAt?: string;

  status: AppointmentStatus;
  consultationType?: ConsultationType;

  reason: string;
  room: string;

  payment?: AppointmentPayment;

  prescription?: Prescription;

  review?: {
    rating: number;
    comment: string;
  };

  actionBy?: "doctor" | "patient";
  actionType?: "cancelled" | "rescheduled";
  actionReason?: string;

  followUp?: {
    recommended: boolean;
    afterDays?: number;
    note?: string;
  };
};