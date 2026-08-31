export type AvailabilityStatus = "available" | "booked";

export type AvailabilitySlot = {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
};