export type PrescriptionMedicine = {
  name: string;
  dosage: string;
  duration: string;
};

export type Prescription = {
  id: string;
  appointmentId: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  instructions: string;
};