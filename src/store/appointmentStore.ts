"use client";

import { create } from "zustand";
import type { Appointment } from "@/types/appointment";

type AppointmentStore = {
  appointments: Appointment[];

  setAppointments: (appointments: Appointment[]) => void;

  addAppointment: (appointment: Appointment) => void;

  updateAppointment: (
    appointmentId: string,
    updates: Partial<Appointment>
  ) => void;

  removeAppointment: (appointmentId: string) => void;

  clearAppointments: () => void;
};

export const useAppointmentStore =
  create<AppointmentStore>((set) => ({
    appointments: [],

    setAppointments: (appointments) =>
      set({
        appointments,
      }),

    addAppointment: (appointment) =>
      set((state) => ({
        appointments: [
          ...state.appointments,
          appointment,
        ],
      })),

    updateAppointment: (
      appointmentId,
      updates
    ) =>
      set((state) => ({
        appointments: state.appointments.map(
          (appointment) =>
            appointment.id === appointmentId
              ? {
                  ...appointment,
                  ...updates,
                }
              : appointment
        ),
      })),

    removeAppointment: (appointmentId) =>
      set((state) => ({
        appointments:
          state.appointments.filter(
            (appointment) =>
              appointment.id !== appointmentId
          ),
      })),

    clearAppointments: () =>
      set({
        appointments: [],
      }),
  }));