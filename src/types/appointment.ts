export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "missed";
import type { Prescription } from "@/types/prescription";
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
  status: AppointmentStatus;
  reason: string;
  room: string;
  prescription?: Prescription;
review?: {
  rating: number;
  comment: string;
};
};