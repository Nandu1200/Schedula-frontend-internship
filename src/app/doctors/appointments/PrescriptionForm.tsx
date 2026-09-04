"use client";

import { useState } from "react";
import type { Appointment } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";

type PrescriptionFormProps = {
  appointmentId: string;
  prescription?: Prescription;
  onSaved?: (appointment: Appointment) => void;
};

export default function PrescriptionForm({
  appointmentId,
  prescription,
  onSaved,
}: PrescriptionFormProps) {
  const firstMedicine = prescription?.medicines[0];

  const [diagnosis, setDiagnosis] = useState(
    prescription?.diagnosis ?? ""
  );

  const [medicineName, setMedicineName] = useState(
    firstMedicine?.name ?? ""
  );

  const [dosage, setDosage] = useState(
    firstMedicine?.dosage ?? ""
  );

  const [duration, setDuration] = useState(
    firstMedicine?.duration ?? ""
  );

  const [instructions, setInstructions] = useState(
    prescription?.instructions ?? ""
  );

  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setSuccessMessage("");

    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis.");
      return;
    }

    if (!medicineName.trim()) {
      alert("Please enter a medicine name.");
      return;
    }

    if (!dosage.trim()) {
      alert("Please enter the dosage.");
      return;
    }

    if (!duration.trim()) {
      alert("Please enter the duration.");
      return;
    }

    if (!instructions.trim()) {
      alert("Please enter the instructions.");
      return;
    }

    setIsSaving(true);

    try {
      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedAppointments) {
        throw new Error("Appointments not found.");
      }

      const appointments = JSON.parse(
        storedAppointments
      ) as Appointment[];

      const updatedAppointments = appointments.map(
        (appointment) => {
          if (appointment.id !== appointmentId) {
            return appointment;
          }

          return {
            ...appointment,
            prescription: {
              id:
                prescription?.id ??
                `prescription-${Date.now()}`,
              appointmentId,
              diagnosis: diagnosis.trim(),
              medicines: [
                {
                  name: medicineName.trim(),
                  dosage: dosage.trim(),
                  duration: duration.trim(),
                },
              ],
              instructions: instructions.trim(),
            },
          };
        }
      );

      const updatedAppointment =
        updatedAppointments.find(
          (appointment) =>
            appointment.id === appointmentId
        );

      if (!updatedAppointment) {
        throw new Error(
          "Appointment could not be updated."
        );
      }

      localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
      );

      onSaved?.(updatedAppointment);

      setSuccessMessage(
        prescription
          ? "Prescription updated successfully."
          : "Prescription saved successfully."
      );

      setIsSaving(false);
    } catch (caughtError) {
      setIsSaving(false);

      alert(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save prescription."
      );
    }
  };

  return (
    <div className="w-full">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Prescription Form
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Appointment ID: {appointmentId}
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="diagnosis"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Diagnosis
        </label>

        <input
          id="diagnosis"
          type="text"
          placeholder="Enter diagnosis"
          value={diagnosis}
          onChange={(event) =>
            setDiagnosis(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="medicine-name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Medicine Name
        </label>

        <input
          id="medicine-name"
          type="text"
          placeholder="Enter medicine name"
          value={medicineName}
          onChange={(event) =>
            setMedicineName(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="medicine-dosage"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Dosage
        </label>

        <input
          id="medicine-dosage"
          type="text"
          placeholder="e.g. 500mg, 1 tablet"
          value={dosage}
          onChange={(event) =>
            setDosage(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="medicine-duration"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Duration
        </label>

        <input
          id="medicine-duration"
          type="text"
          placeholder="e.g. 5 days, 2 weeks"
          value={duration}
          onChange={(event) =>
            setDuration(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="instructions"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Instructions
        </label>

        <textarea
          id="instructions"
          rows={4}
          placeholder="Enter instructions for the patient"
          value={instructions}
          onChange={(event) =>
            setInstructions(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {successMessage && (
        <p className="mt-4 text-sm font-medium text-emerald-600">
          {successMessage}
        </p>
      )}

      <div className="mt-6 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? "Saving..."
            : prescription
              ? "Update Prescription"
              : "Save Prescription"}
        </button>
      </div>
    </div>
  );
}