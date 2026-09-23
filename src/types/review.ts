export type AdminReview = {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
  reported: boolean;
  reportReason?: string;
  hidden: boolean;
};
