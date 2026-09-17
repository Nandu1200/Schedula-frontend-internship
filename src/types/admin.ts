export type AdminDoctorStatus =
  | "pending"
  | "approved"
  | "rejected";

export type AdminDoctor = {
  doctorId: string;
  verificationStatus: AdminDoctorStatus;
  registeredAt: string;
};

export type AdminPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  registeredAt: string;
  status: "active" | "inactive";
};

export type AdminAppointmentStatus =
  | "pending"
  | "confirmed"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "missed";

export type AdminAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  consultationType: "online" | "in-person";
  status: AdminAppointmentStatus;
  amount: number;
};

export type AdminPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type AdminPayment = {
  id: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  amount: number;
  method: "upi" | "card" | "netbanking";
  status: AdminPaymentStatus;
  paidAt?: string;
};

export type AdminReview = {
  id: string;
  patientName: string;
  doctorName: string;
  rating: number;
  comment: string;
  status: "published" | "hidden";
  createdAt: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "delay";
  createdAt: string;
  read: boolean;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "super-admin" | "admin";
  status: "active" | "inactive";
  createdAt: string;
};

export type AdminAuditLog = {
  id: string;
  adminName: string;
  action: string;
  module: string;
  description: string;
  createdAt: string;
};