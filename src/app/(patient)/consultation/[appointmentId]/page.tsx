"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function OnlineConsultationPage() {
  const params = useParams();
  const router = useRouter();

  const appointmentId = String(params.appointmentId);

  const appointments = useAppSelector(
    (state) => state.appointments.appointments
  );

  const appointment = useMemo(
    () =>
      appointments.find(
        (item) => item.id === appointmentId
      ),
    [appointments, appointmentId]
  );

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [consultationEnded, setConsultationEnded] =
    useState(false);

  if (!appointment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Appointment Not Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            We could not find the appointment you are trying
            to join.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/appointments")
            }
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Back to Appointments
          </button>
        </div>
      </main>
    );
  }

  if (appointment.consultationType !== "online") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-amber-50 text-2xl text-amber-600">
            ℹ
          </div>

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            In-person Consultation
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This appointment is scheduled as an
            in-person consultation and does not have an
            online consultation room.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/appointments")
            }
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Back to Appointments
          </button>
        </div>
      </main>
    );
  }

  if (consultationEnded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Consultation Ended
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your mock online consultation with{" "}
            <span className="font-semibold text-slate-700">
              {appointment.clinician}
            </span>{" "}
            has ended.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/appointments")
            }
            className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Back to My Appointments
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Online Consultation
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              {appointment.clinician}
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              {appointment.specialty}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <span className="size-2.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">
              Live Consultation
            </span>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Video Area */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-800">
              {/* Doctor Video */}
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto grid size-24 place-items-center rounded-full bg-emerald-600 text-3xl font-bold shadow-lg ring-8 ring-emerald-500/10">
                    {appointment.clinician
                      .replace(/^Dr\.?\s*/i, "")
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <h2 className="mt-4 text-lg font-bold">
                    {appointment.clinician}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Doctor&apos;s camera
                  </p>
                </div>
              </div>

              {/* Patient Preview */}
              <div className="absolute bottom-4 right-4 h-28 w-44 overflow-hidden rounded-xl border border-slate-600 bg-slate-950 shadow-lg sm:h-32 sm:w-52">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-700 text-sm font-bold">
                      YOU
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-300">
                      Your camera
                    </p>
                  </div>
                </div>

                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90">
                    <span className="text-xs font-semibold text-slate-400">
                      Camera Off
                    </span>
                  </div>
                )}
              </div>

              {/* Mock badge */}
              <div className="absolute left-4 top-4 rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur">
                Mock Consultation
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMicEnabled((value) => !value)
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  micEnabled
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {micEnabled
                  ? "🎙️ Mic On"
                  : "🔇 Mic Off"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCameraEnabled((value) => !value)
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  cameraEnabled
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {cameraEnabled
                  ? "📹 Camera On"
                  : "🚫 Camera Off"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setConsultationEnded(true)
                }
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Leave Consultation
              </button>
            </div>
          </section>

          {/* Appointment Details */}
          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <h2 className="text-lg font-bold">
              Appointment Details
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Doctor
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.clinician}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Patient
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.patient.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date & Time
                </p>

                <p className="mt-1 font-semibold text-white">
                  {new Intl.DateTimeFormat(
                    "en-IN",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  ).format(
                    new Date(appointment.startsAt)
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Consultation Type
                </p>

                <p className="mt-1 font-semibold text-emerald-400">
                  Online Consultation
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Duration
                </p>

                <p className="mt-1 font-semibold text-white">
                  {appointment.durationMinutes} minutes
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Room
                </p>

                <p className="mt-1 font-semibold text-white">
                  Online Consultation
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-semibold text-emerald-300">
                Consultation is active
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                This is a frontend-only mock consultation
                screen. No real video or WebSocket connection
                is being used.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/appointments")
              }
              className="mt-5 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Back to Appointments
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}