import type { MedicalCartItem } from "./medicalCart";

export type MedicalOrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type MedicalOrderPaymentMethod =
  | "cod"
  | "upi"
  | "card";

export type MedicalOrder = {
  id: string;
  patientId: string;
  items: MedicalCartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: MedicalOrderPaymentMethod;
  paymentStatus: "pending" | "paid";
  prescriptionId?: string;
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  status: MedicalOrderStatus;
  createdAt: string;
  estimatedDeliveryDate: string;
};
