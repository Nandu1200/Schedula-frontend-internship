"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "@/types/appointment";
import PrescriptionForm from "../appointments/PrescriptionForm";

type LoggedInDoctor = {
  id: string;
  name: string;
};

export default function DoctorPrescriptionsPage() {
  const [doctor, setDoctor] =
    useState<LoggedInDoctor | null>(null);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [selectedPrescription, setSelectedPrescription] =
    useState<Appointment | null>(null);

  const [editingPrescription, setEditingPrescription] =
    useState(false);

  useEffect(() => {
  const timer = window.setTimeout(() => {
    const storedDoctor =
      localStorage.getItem("loggedInDoctor") ||
      localStorage.getItem("registeredDoctor");

    if (!storedDoctor) {
      return;
    }

    try {
      const parsedDoctor =
        JSON.parse(storedDoctor) as LoggedInDoctor;

      setDoctor(parsedDoctor);

      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedAppointments) {
        return;
      }

      const allAppointments =
        JSON.parse(storedAppointments) as Appointment[];

      const doctorAppointments =
        allAppointments.filter(
          (appointment) =>
            appointment.clinician.trim().toLowerCase() ===
            parsedDoctor.name.trim().toLowerCase()
        );

      setAppointments(doctorAppointments);
    } catch {
      setDoctor(null);
      setAppointments([]);
    }
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, []);

  const prescriptionAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "completed" &&
      Boolean(appointment.prescription)
  );

  const closePrescriptionModal = () => {
    setSelectedPrescription(null);
    setEditingPrescription(false);
  };

  const handleEditPrescription = () => {
    setEditingPrescription(true);
  };

  const handleCancelEdit = () => {
    setEditingPrescription(false);
  };

  const handlePrescriptionSaved = (
    updatedAppointment: Appointment
  ) => {
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === updatedAppointment.id
          ? updatedAppointment
          : appointment
      )
    );

    setSelectedPrescription(updatedAppointment);
    setEditingPrescription(false);
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Doctor Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Prescriptions
          </h1>

          <p className="mt-2 text-slate-500">
            View and manage prescriptions for your completed patient
            appointments.
          </p>

          {doctor && (
            <p className="mt-2 text-sm text-slate-400">
              Doctor: {doctor.name}
            </p>
          )}
        </div>

        {prescriptionAppointments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
              ✚
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No prescriptions found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Prescriptions for completed appointments will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptionAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {appointment.patient.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {appointment.specialty}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      {appointment.prescription?.diagnosis}
                    </p>
                  </div>

                  <div className="text-sm text-slate-500 sm:text-right">
                    <p className="font-medium text-slate-700">
                      Completed Appointment
                    </p>

                    <p className="mt-1">
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(
                        new Date(appointment.startsAt)
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPrescription(appointment);
                      setEditingPrescription(false);
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    View Prescription
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPrescription && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePrescriptionModal();
              }
            }}
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                    {editingPrescription
                      ? "Edit Prescription"
                      : "Prescription"}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {selectedPrescription.patient.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closePrescriptionModal}
                  className="grid size-9 place-items-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close prescription"
                >
                  ×
                </button>
              </div>

              {editingPrescription ? (
                <div className="p-6">
                  <PrescriptionForm
                    appointmentId={selectedPrescription.id}
                    prescription={
                      selectedPrescription.prescription
                    }
                    onSaved={handlePrescriptionSaved}
                  />

                  <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel Edit
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-6 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs text-slate-500">
                          Patient
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {selectedPrescription.patient.name}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs text-slate-500">
                          Appointment
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(
                            new Date(
                              selectedPrescription.startsAt
                            )
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                        Diagnosis
                      </h3>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm leading-6 text-slate-700">
                          {
                            selectedPrescription
                              .prescription?.diagnosis
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                        Medicines
                      </h3>

                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Medicine
                              </th>

                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Dosage
                              </th>

                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Duration
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-200">
                            {selectedPrescription.prescription?.medicines.map(
                              (medicine, index) => (
                                <tr
                                  key={`${medicine.name}-${index}`}
                                >
                                  <td className="px-4 py-3 text-slate-900">
                                    {medicine.name}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    {medicine.dosage}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    {medicine.duration}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                        Instructions
                      </h3>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm leading-6 text-slate-700">
                          {
                            selectedPrescription
                              .prescription?.instructions
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closePrescriptionModal}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      onClick={handleEditPrescription}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Edit Prescription
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}