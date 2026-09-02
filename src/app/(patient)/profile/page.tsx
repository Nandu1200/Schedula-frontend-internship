"use client";

import { useState } from "react";

type StoredPatient = {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  currentMedications?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  insuranceStatus?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
};

type StoredAppointment = {
  patientName?: string;
  status?: string;
  prescription?: unknown;
};

const getAppointmentStats = () => {
  if (typeof window === "undefined") {
    return {
      totalPrescriptions: 0,
      completedAppointments: 0,
    };
  }

  const storedAppointments =
    localStorage.getItem("appointments");

  const storedPatient =
    localStorage.getItem("loggedInPatient");

  if (!storedAppointments) {
    return {
      totalPrescriptions: 0,
      completedAppointments: 0,
    };
  }

  try {
    const appointments =
      JSON.parse(storedAppointments) as StoredAppointment[];

    const patient = storedPatient
      ? (JSON.parse(storedPatient) as StoredPatient)
      : {};

    const loggedInPatientName =
      patient.name?.trim().toLowerCase();

    const patientAppointments =
      loggedInPatientName
        ? appointments.filter(
            (appointment) =>
              appointment.patientName
                ?.trim()
                .toLowerCase() === loggedInPatientName
          )
        : appointments;

    return {
      totalPrescriptions: patientAppointments.filter(
        (appointment) =>
          Boolean(appointment.prescription)
      ).length,

      completedAppointments: patientAppointments.filter(
        (appointment) =>
          appointment.status === "completed"
      ).length,
    };
  } catch {
    return {
      totalPrescriptions: 0,
      completedAppointments: 0,
    };
  }
};

const getStoredPatient = (): StoredPatient => {
  if (typeof window === "undefined") {
    return {};
  }

  const storedProfile =
    localStorage.getItem("patientProfile");

  const storedPatient =
    localStorage.getItem("loggedInPatient");

  try {
    const profile = storedProfile
      ? (JSON.parse(storedProfile) as StoredPatient)
      : {};

    const patient = storedPatient
      ? (JSON.parse(storedPatient) as StoredPatient)
      : {};

    return {
      ...patient,
      ...profile,
    };
  } catch {
    return {};
  }
};

export default function PatientProfilePage() {
  const storedPatient = getStoredPatient();
  const appointmentStats = getAppointmentStats();

  const [name, setName] = useState(
    storedPatient.name ?? ""
  );

  const [email, setEmail] = useState(
    storedPatient.email ?? ""
  );

  const [phone, setPhone] = useState(
    storedPatient.phone ?? ""
  );

  const [dateOfBirth, setDateOfBirth] = useState(
    storedPatient.dateOfBirth ?? ""
  );

  const [gender, setGender] = useState(
    storedPatient.gender ?? ""
  );

  const [height, setHeight] = useState(
    storedPatient.height ?? ""
  );

  const [weight, setWeight] = useState(
    storedPatient.weight ?? ""
  );

  const [bloodGroup, setBloodGroup] = useState(
    storedPatient.bloodGroup ?? ""
  );

  const [medicalConditions, setMedicalConditions] =
    useState(
      storedPatient.medicalConditions ?? ""
    );

  const [allergies, setAllergies] = useState(
    storedPatient.allergies ?? ""
  );

  const [currentMedications, setCurrentMedications] =
    useState(
      storedPatient.currentMedications ?? ""
    );

  const [insuranceProvider, setInsuranceProvider] =
    useState(
      storedPatient.insuranceProvider ?? ""
    );

  const [policyNumber, setPolicyNumber] =
    useState(
      storedPatient.policyNumber ?? ""
    );

  const [insuranceStatus, setInsuranceStatus] =
    useState(
      storedPatient.insuranceStatus ?? ""
    );

  const [
    emergencyContactName,
    setEmergencyContactName,
  ] = useState(
    storedPatient.emergencyContactName ?? ""
  );

  const [
    emergencyContactRelationship,
    setEmergencyContactRelationship,
  ] = useState(
    storedPatient.emergencyContactRelationship ?? ""
  );

  const [
    emergencyContactPhone,
    setEmergencyContactPhone,
  ] = useState(
    storedPatient.emergencyContactPhone ?? ""
  );

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const handleSaveProfile = () => {
    setSuccessMessage("");
        if (!name.trim()) {
      setSuccessMessage("Please enter your full name.");
      setIsSaving(false);
      return;
    }
        if (!email.trim()) {
      setSuccessMessage("Please enter your email address.");
      setIsSaving(false);
      return;
    }
        if (!phone.trim()) {
      setSuccessMessage("Please enter your phone number.");
      setIsSaving(false);
      return;
    }
    if (!dateOfBirth) {
  setSuccessMessage("Please select your date of birth.");
  setIsSaving(false);
  return;
}
if (!gender) {
  setSuccessMessage("Please select your gender.");
  setIsSaving(false);
  return;
}
if (!height.trim()) {
  setSuccessMessage("Please enter your height.");
  setIsSaving(false);
  return;
}
if (!weight.trim()) {
  setSuccessMessage("Please enter your weight.");
  setIsSaving(false);
  return;
}
if (!bloodGroup) {
  setSuccessMessage("Please select your blood group.");
  setIsSaving(false);
  return;
}
if (!medicalConditions.trim()) {
  setSuccessMessage("Please enter your medical conditions.");
  setIsSaving(false);
  return;
}
if (!allergies.trim()) {
  setSuccessMessage("Please enter your allergies.");
  setIsSaving(false);
  return;
}
if (!currentMedications.trim()) {
  setSuccessMessage("Please enter your current medications.");
  setIsSaving(false);
  return;
}
if (!insuranceProvider.trim()) {
  setSuccessMessage("Please enter your insurance provider.");
  setIsSaving(false);
  return;
}
if (!policyNumber.trim()) {
  setSuccessMessage("Please enter your policy number.");
  setIsSaving(false);
  return;
}
if (!insuranceStatus) {
  setSuccessMessage("Please select your insurance status.");
  setIsSaving(false);
  return;
}
if (!emergencyContactName.trim()) {
  setSuccessMessage("Please enter the emergency contact name.");
  setIsSaving(false);
  return;
}
if (!emergencyContactRelationship.trim()) {
  setSuccessMessage(
    "Please enter the emergency contact relationship."
  );
  setIsSaving(false);
  return;
}
if (!emergencyContactPhone.trim()) {
  setSuccessMessage(
    "Please enter the emergency contact phone number."
  );
  setIsSaving(false);
  return;
}
    setIsSaving(true);

    try {
      const profile: StoredPatient = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateOfBirth,
        gender,
        height: height.trim(),
        weight: weight.trim(),
        bloodGroup,
        medicalConditions:
          medicalConditions.trim(),
        allergies: allergies.trim(),
        currentMedications:
          currentMedications.trim(),
        insuranceProvider:
          insuranceProvider.trim(),
        policyNumber: policyNumber.trim(),
        insuranceStatus,
        emergencyContactName:
          emergencyContactName.trim(),
        emergencyContactRelationship:
          emergencyContactRelationship.trim(),
        emergencyContactPhone:
          emergencyContactPhone.trim(),
      };

      localStorage.setItem(
        "patientProfile",
        JSON.stringify(profile)
      );

      const storedPatient =
        localStorage.getItem("loggedInPatient");

      if (storedPatient) {
        const loggedInPatient =
          JSON.parse(
            storedPatient
          ) as StoredPatient;

        localStorage.setItem(
          "loggedInPatient",
          JSON.stringify({
            ...loggedInPatient,
            ...profile,
          })
        );
      }

      setSuccessMessage(
        "Profile saved successfully."
      );
    } catch {
      setSuccessMessage(
        "Unable to save profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2faf7] via-white to-[#eef9f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
            
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                👤
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Patient Portal
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  My Profile
                </h1>

                <p className="mt-1 text-sm text-slate-500 sm:text-base">
                  Manage your personal and medical information.
                </p>
              </div>
            </div>

            <div className="hidden rounded-2xl bg-emerald-50 px-5 py-4 sm:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Profile Status
              </p>

              <p className="mt-1 text-sm font-semibold text-emerald-800">
                Information Ready
              </p>
            </div>
          </div>
        </div>
                {/* Profile Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Total Prescriptions */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Prescriptions
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {appointmentStats.totalPrescriptions}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                💊
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-emerald-600">
              Prescriptions received
            </p>
          </div>

          {/* Completed Appointments */}
          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed Appointments
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {appointmentStats.completedAppointments}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-xl">
                📅
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-sky-600">
              Appointments completed
            </p>
          </div>

          {/* Test Reports */}
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Test Reports
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  0
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl">
                🧪
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-violet-600">
              Reports available
            </p>
          </div>

        </div>

        <div className="space-y-6">

          {/* Personal Information */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  🧑
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Keep your personal information up to date.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="Enter your phone number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="date-of-birth"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Date of Birth
                </label>

                <input
                  id="date-of-birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) =>
                    setDateOfBirth(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Gender
                </label>

                <select
                  id="gender"
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="male">
                    Male
                  </option>
                  <option value="female">
                    Female
                  </option>
                  <option value="other">
                    Other
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Physical Details */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50/70 to-white px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg">
                  ⚕️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Physical Details
                  </h2>

                  <p className="text-sm text-slate-500">
                    Add your basic physical information.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-3 sm:p-8">

              <div>
                <label
                  htmlFor="height"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Height
                </label>

                <div className="relative">
                  <input
                    id="height"
                    type="text"
                    value={height}
                    onChange={(event) =>
                      setHeight(event.target.value)
                    }
                    placeholder="e.g. 175"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="weight"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Weight
                </label>

                <div className="relative">
                  <input
                    id="weight"
                    type="text"
                    value={weight}
                    onChange={(event) =>
                      setWeight(event.target.value)
                    }
                    placeholder="e.g. 70"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="blood-group"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Blood Group
                </label>

                <select
                  id="blood-group"
                  value={bloodGroup}
                  onChange={(event) =>
                    setBloodGroup(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Select blood group
                  </option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </section>

          {/* Medical Information */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50/70 to-white px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-lg">
                  ❤️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Medical Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Add important medical information for doctors.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-8">

              <div>
                <label
                  htmlFor="medical-conditions"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Medical Conditions
                </label>

                <textarea
                  id="medical-conditions"
                  value={medicalConditions}
                  onChange={(event) =>
                    setMedicalConditions(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Diabetes, hypertension, asthma"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="allergies"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Allergies
                </label>

                <textarea
                  id="allergies"
                  value={allergies}
                  onChange={(event) =>
                    setAllergies(event.target.value)
                  }
                  placeholder="e.g. Penicillin, peanuts, dust"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="current-medications"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Current Medications
                </label>

                <textarea
                  id="current-medications"
                  value={currentMedications}
                  onChange={(event) =>
                    setCurrentMedications(
                      event.target.value
                    )
                  }
                  placeholder="List the medicines you currently take"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </section>

          {/* Insurance Information */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/70 to-white px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg">
                  🛡️
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Insurance Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Add your health insurance details.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">

              <div>
                <label
                  htmlFor="insurance-provider"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Insurance Provider
                </label>

                <input
                  id="insurance-provider"
                  type="text"
                  value={insuranceProvider}
                  onChange={(event) =>
                    setInsuranceProvider(
                      event.target.value
                    )
                  }
                  placeholder="Enter insurance provider"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="policy-number"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Policy Number
                </label>

                <input
                  id="policy-number"
                  type="text"
                  value={policyNumber}
                  onChange={(event) =>
                    setPolicyNumber(
                      event.target.value
                    )
                  }
                  placeholder="Enter policy number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="insurance-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Insurance Status
                </label>

                <select
                  id="insurance-status"
                  value={insuranceStatus}
                  onChange={(event) =>
                    setInsuranceStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Select status
                  </option>
                  <option value="active">
                    Active
                  </option>
                  <option value="expired">
                    Expired
                  </option>
                  <option value="not-insured">
                    Not Insured
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50/70 to-white px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                  🚨
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Emergency Contact
                  </h2>

                  <p className="text-sm text-slate-500">
                    Someone we can contact in case of an emergency.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-3 sm:p-8">

              <div>
                <label
                  htmlFor="emergency-contact-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Contact Name
                </label>

                <input
                  id="emergency-contact-name"
                  type="text"
                  value={emergencyContactName}
                  onChange={(event) =>
                    setEmergencyContactName(
                      event.target.value
                    )
                  }
                  placeholder="Enter contact name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="emergency-contact-relationship"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Relationship
                </label>

                <input
                  id="emergency-contact-relationship"
                  type="text"
                  value={emergencyContactRelationship}
                  onChange={(event) =>
                    setEmergencyContactRelationship(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Father, Mother, Spouse"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="emergency-contact-phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone Number
                </label>

                <input
                  id="emergency-contact-phone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(event) =>
                    setEmergencyContactPhone(
                      event.target.value
                    )
                  }
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          </section>

          {/* Save Changes */}
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col gap-5 bg-gradient-to-r from-emerald-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  ✓
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Save Your Changes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Keep your profile information updated for your future appointments.
                  </p>

                  {successMessage && (
                    <div
                      className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                        successMessage.startsWith(
                          "Profile saved"
                        )
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {successMessage}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSaving
                  ? "Saving..."
                  : "Save Profile"}
              </button>
            </div>
          </section>

        </div>

        <p className="py-6 text-center text-xs text-slate-400">
          Your profile information is stored securely for this frontend demo.
        </p>
      </div>
    </main>
  );
}