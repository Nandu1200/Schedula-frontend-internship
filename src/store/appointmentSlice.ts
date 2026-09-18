import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Appointment } from "@/types/appointment";

type AppointmentState = {
  appointments: Appointment[];
};

const initialState: AppointmentState = {
  appointments: [],
};

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setAppointments: (
      state,
      action: PayloadAction<Appointment[]>
    ) => {
      state.appointments = action.payload;
    },

    addAppointment: (
      state,
      action: PayloadAction<Appointment>
    ) => {
      state.appointments.push(action.payload);
    },

    updateAppointment: (
      state,
      action: PayloadAction<{
        appointmentId: string;
        updates: Partial<Appointment>;
      }>
    ) => {
      const appointment = state.appointments.find(
        (item) => item.id === action.payload.appointmentId
      );

      if (appointment) {
        Object.assign(
          appointment,
          action.payload.updates
        );
      }
    },

    removeAppointment: (
      state,
      action: PayloadAction<string>
    ) => {
      state.appointments =
        state.appointments.filter(
          (appointment) =>
            appointment.id !== action.payload
        );
    },

    clearAppointments: (state) => {
      state.appointments = [];
    },
  },
});

export const {
  setAppointments,
  addAppointment,
  updateAppointment,
  removeAppointment,
  clearAppointments,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;