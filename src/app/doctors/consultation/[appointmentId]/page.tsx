"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateAppointment } from "@/store/appointmentSlice";
import type { Appointment } from "@/types/appointment";

export default function DoctorConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const appointmentId = String(params.appointmentId ?? "");

  const appointment = useAppSelector((state) =>
    state.appointments.appointments.find(
      (item) => item.id === appointmentId
    )
  );

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [consultationEnded, setConsultationEnded] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const appointmentTime = useMemo(() => {
    if (!appointment) {
      return "";
    }

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(appointment.startsAt));
  }, [appointment]);

  const handleFinishConsultation = () => {
    if (!appointment || finishing) {
      return;
    }

    setFinishing(true);

    /*
     * Update appointment status in Redux.
     */
    dispatch(
      updateAppointment({
        appointmentId: appointment.id,
        updates: {
          status: "completed",
        },
      })
    );

    /*
     * Persist completed status in localStorage.
     */
    try {
      const storedAppointments =
        localStorage.getItem("appointments");

      if (storedAppointments) {
        const allAppointments =
          JSON.parse(storedAppointments) as Appointment[];

        const updatedAppointments =
          allAppointments.map((item) =>
            item.id === appointment.id
              ? {
                  ...item,
                  status: "completed" as const,
                }
              : item
          );

        localStorage.setItem(
          "appointments",
          JSON.stringify(updatedAppointments)
        );
      }
    } catch {
      /*
       * Redux state is already updated.
       * Ignore localStorage parsing errors.
       */
    }

    setConsultationEnded(true);
    setFinishing(false);
  };

  /*
   * Appointment not found.
   */
  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-2xl text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Appointment Not Found
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The appointment you are trying to access could not
              be found.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/doctors/appointments")
              }
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * In-person appointments should not open
   * the online consultation screen.
   */
  if (appointment.consultationType !== "online") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 text-2xl">
              🏥
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              In-person Consultation
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This appointment is scheduled as an in-person
              consultation and does not have an online
              consultation room.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Patient
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {appointment.patient.name}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Appointment Time
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {appointmentTime}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Clinic / Room
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {appointment.room ||
                  "Clinic / Consultation Room"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/doctors/appointments")
              }
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Consultation completed screen.
   */
  if (consultationEnded) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-12">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/15 text-4xl text-emerald-400">
              ✓
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Consultation Completed
            </p>

            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Consultation Ended
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300">
              The online consultation with{" "}
              <span className="font-semibold text-white">
                {appointment.patient.name}
              </span>{" "}
              has been completed successfully.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Patient
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {appointment.patient.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Appointment
                  </p>

                  <p className="mt-1 font-semibold text-white">
                    {appointmentTime}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Consultation Type
                  </p>

                  <p className="mt-1 font-semibold text-emerald-400">
                    Online Consultation
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <p className="mt-1 font-semibold text-emerald-400">
                    Completed
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/doctors/appointments")
              }
              className="mt-8 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Main online consultation screen.
   */
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold sm:text-3xl">
                Live Consultation
              </h1>

              <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
                LIVE
              </span>

              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                Mock Consultation
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Online Consultation
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/doctors/appointments")
            }
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Back to Appointments
          </button>
        </div>

        {/* Consultation Area */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Video Area */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="relative min-h-[520px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
              {/* Top Information */}
              <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3">
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-slate-400">
                    Patient
                  </p>

                  <p className="text-sm font-bold text-white">
                    {appointment.patient.name}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-right backdrop-blur-sm">
                  <p className="text-xs text-slate-400">
                    Appointment
                  </p>

                  <p className="text-sm font-bold text-white">
                    {appointmentTime}
                  </p>
                </div>
              </div>

              {/* Patient Video Placeholder */}
              <div className="flex min-h-[520px] items-center justify-center p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="grid size-32 place-items-center rounded-full border-4 border-white/10 bg-emerald-600/20 text-5xl font-bold text-emerald-300 shadow-2xl sm:size-40 sm:text-6xl">
                    {appointment.patient.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h2 className="mt-6 text-xl font-bold text-white sm:text-2xl">
                    {appointment.patient.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Patient video preview
                  </p>

                  <span className="mt-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Connected
                  </span>
                </div>
              </div>

              {/* Doctor Preview */}
              <div className="absolute bottom-5 right-5 h-32 w-48 overflow-hidden rounded-2xl border border-white/15 bg-slate-800 shadow-xl sm:h-36 sm:w-56">
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="grid size-12 place-items-center rounded-full bg-emerald-600/20 text-lg font-bold text-emerald-300">
                    D
                  </div>

                  <p className="mt-2 text-xs font-semibold text-white">
                    Doctor Preview
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Camera {cameraOn ? "On" : "Off"}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-slate-900 p-5">
              <button
                type="button"
                onClick={() =>
                  setMicOn((value) => !value)
                }
                className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                  micOn
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                }`}
              >
                {micOn ? "🎙 Mic On" : "🔇 Mic Off"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCameraOn((value) => !value)
                }
                className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                  cameraOn
                    ? "bg-white/10 text-white hover:bg-white/15"
                    : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                }`}
              >
                {cameraOn
                  ? "📹 Camera On"
                  : "🚫 Camera Off"}
              </button>

              <button
                type="button"
                onClick={handleFinishConsultation}
                disabled={finishing}
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {finishing
                  ? "Finishing..."
                  : "Finish Consultation"}
              </button>
            </div>
          </section>

          {/* Appointment Details */}
          <aside className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
                Appointment Details
              </p>

              <h2 className="mt-2 text-xl font-bold text-white">
                Online Consultation
              </h2>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Patient
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.patient.name}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Age
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.patient.age} years
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Date & Time
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointmentTime}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Duration
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.durationMinutes} minutes
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Reason for Visit
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.reason}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/5 p-4">
                <p className="text-xs text-slate-400">
                  Status
                </p>

                <p className="mt-1 font-semibold text-emerald-400">
                  Live / Consultation
                </p>
              </div>
            </div>

            {/* Mock Notice */}
            <div className="mt-5 rounded-2xl border border-blue-400/15 bg-blue-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-300">
                Mock Consultation
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                This is a frontend-only consultation screen.
                No real video call, WebSocket, or external
                communication service is connected.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}