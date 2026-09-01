import type { AvailabilitySlot } from "@/types/availability";

export const availabilitySlots: AvailabilitySlot[] = [
  {
    id: "slot-001",
    doctorId: "doc-001",
    date: "2026-09-01",
    startTime: "10:00",
    endTime: "10:30",
    status: "available",
  },
  {
    id: "slot-002",
    doctorId: "doc-001",
    date: "2026-09-01",
    startTime: "11:00",
    endTime: "11:30",
    status: "available",
  },
  {
    id: "slot-003",
    doctorId: "doc-002",
    date: "2026-09-01",
    startTime: "14:00",
    endTime: "14:30",
    status: "available",
  },
  {
    id: "slot-004",
    doctorId: "doc-003",
    date: "2026-09-02",
    startTime: "16:00",
    endTime: "16:30",
    status: "available",
  },
];