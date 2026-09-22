export type PaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "upi"
  | "card"
  | "netbanking";

export type Payment = {
  id: string;
  transactionId: string;
  appointmentId: string;

  doctorId: string;
  doctorName: string;

  patientId: string;
  patientName: string;

  amount: number;

  method: PaymentMethod;
  status: PaymentStatus;

  appointmentDate: string;
  createdAt: string;

  paidAt?: string;

  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
};