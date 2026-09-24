"use client";

import { useEffect, useMemo, useState } from "react";

import { patients as mockPatients } from "@/lib/mock-data/patients";
import { getAdminAppointments } from "@/lib/utils/admin-appointments";
import { hasPermission } from "@/lib/admin/permissions";
import type { Appointment } from "@/types/appointment";
import type { Patient } from "@/types/patient";
import type { AdminUserRole } from "@/types/admin";

type PatientAction = {
  patient: Patient;
  nextStatus: Patient["status"];
} | null;

const patientsPerPage = 5;

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getAppointmentStatusLabel = (
  appointment: Appointment
): string => {
  const isFutureConfirmed =
    appointment.status === "confirmed" &&
    new Date(appointment.startsAt).getTime() >
      Date.now();

  if (isFutureConfirmed) {
    return "Upcoming";
  }

  switch (appointment.status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "missed":
      return "Missed";
    default:
      return "Unknown";
  }
};

const getAppointmentStatusClass = (
  appointment: Appointment
): string => {
  const label = getAppointmentStatusLabel(appointment);

  if (label === "Upcoming") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (label === "Confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (label === "Completed") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (label === "Cancelled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (label === "Missed") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
};

const getInitials = (name: string) => {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function AdminPatientsPage() {
  const [allPatients, setAllPatients] = useState<Patient[]>(
    []
  );
  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);
  const [patientAction, setPatientAction] =
    useState<PatientAction>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Patient["status"]
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminRole, setAdminRole] = useState<AdminUserRole | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("admin_role");

    if (
      storedRole === "super-admin" ||
      storedRole === "admin" ||
      storedRole === "support"
    ) {
      setAdminRole(storedRole);
    }
  }, []);

  const canViewPatients =
    adminRole !== null &&
    hasPermission(adminRole, "patients", "view");

  const canEditPatients =
    adminRole !== null &&
    hasPermission(adminRole, "patients", "edit");

  useEffect(() => {
    const loadPatientData = () => {
      setLoading(true);
      setError("");

      try {
        const patientList = [...mockPatients];

        const registeredPatientData =
          localStorage.getItem("registeredPatient");

        if (registeredPatientData) {
          const parsedPatient = JSON.parse(
            registeredPatientData
          ) as Partial<Patient>;

          if (
            parsedPatient.id &&
            !patientList.some(
              (patient) => patient.id === parsedPatient.id
            )
          ) {
            const registeredPatient: Patient = {
              id: parsedPatient.id,
              name:
                parsedPatient.name ?? "Registered Patient",
              email:
                parsedPatient.email ??
                "No email available",
              phone:
                parsedPatient.phone ??
                "No phone available",
              age:
                typeof parsedPatient.age === "number"
                  ? parsedPatient.age
                  : 0,
              initials:
                parsedPatient.initials ??
                getInitials(
                  parsedPatient.name ??
                    "Registered Patient"
                ),
              status:
                parsedPatient.status === "inactive"
                  ? "inactive"
                  : "active",
            };

            patientList.push(registeredPatient);
          }
        }

        const normalizedPatients = patientList.map(
          (patient) => {
            const storedStatus = localStorage.getItem(
              `patientStatus-${patient.id}`
            );

            const status =
              storedStatus === "inactive"
                ? "inactive"
                : storedStatus === "active"
                  ? "active"
                  : patient.status;

            return {
              ...patient,
              status,
            };
          }
        );

        const appointmentList = getAdminAppointments();

        setAllPatients(normalizedPatients);
        setAppointments(appointmentList);
      } catch {
        setAllPatients([]);
        setAppointments([]);
        setError(
          "We couldn't load patient management data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    const frameId = window.requestAnimationFrame(
      loadPatientData
    );

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allPatients.filter((patient) => {
      const matchesSearch =
        !search ||
        patient.name.toLowerCase().includes(search) ||
        patient.email.toLowerCase().includes(search) ||
        patient.phone.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allPatients, searchTerm, statusFilter]);

  const totalPages = Math.ceil(
    filteredPatients.length / patientsPerPage
  );

  const safeCurrentPage =
    totalPages === 0
      ? 1
      : Math.min(currentPage, totalPages);

  const startIndex =
    (safeCurrentPage - 1) * patientsPerPage;

  const paginatedPatients = filteredPatients.slice(
    startIndex,
    startIndex + patientsPerPage
  );

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return appointments
      .filter(
        (appointment) =>
          appointment.patient?.id ===
            selectedPatient.id ||
          appointment.patient?.name ===
            selectedPatient.name
      )
      .sort(
        (first, second) =>
          new Date(second.startsAt).getTime() -
          new Date(first.startsAt).getTime()
      );
  }, [appointments, selectedPatient]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "all";

  const handleSearchChange = (
    value: string
  ) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (
    value: "all" | Patient["status"]
  ) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleViewPatient = (
    patient: Patient
  ) => {
    setSelectedPatient(patient);
  };

  const handleClosePatientModal = () => {
    setSelectedPatient(null);
  };

  const handleOpenPatientAction = (
    patient: Patient
  ) => {
    setPatientAction({
      patient,
      nextStatus:
        patient.status === "active"
          ? "inactive"
          : "active",
    });
  };

  const handleClosePatientAction = () => {
    setPatientAction(null);
  };

  const handleConfirmPatientAction = () => {
    if (!patientAction) {
      return;
    }

    const { patient, nextStatus } = patientAction;

    setAllPatients((currentPatients) =>
      currentPatients.map((item) =>
        item.id === patient.id
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );

    if (selectedPatient?.id === patient.id) {
      setSelectedPatient({
        ...selectedPatient,
        status: nextStatus,
      });
    }

    localStorage.setItem(
      `patientStatus-${patient.id}`,
      nextStatus
    );

    const registeredPatientData =
      localStorage.getItem("registeredPatient");

    if (registeredPatientData) {
      try {
        const parsedPatient =
          JSON.parse(registeredPatientData) as Record<
            string,
            unknown
          >;

        if (parsedPatient.id === patient.id) {
          localStorage.setItem(
            "registeredPatient",
            JSON.stringify({
              ...parsedPatient,
              status: nextStatus,
            })
          );

          window.dispatchEvent(
            new Event("registered-user-updated")
          );

          window.dispatchEvent(
            new Event("registered-patient-changed")
          );
        }
      } catch {
        // Ignore invalid registered patient storage.
      }
    }

    setPatientAction(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Patients
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Manage patient accounts and review appointment
          history.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-lg font-semibold text-slate-900">
            Patient Management
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {filteredPatients.length} patient
            {filteredPatients.length !== 1 ? "s" : ""}{" "}
            shown.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_200px_auto]">
            <div>
              <label
                htmlFor="patient-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <input
                id="patient-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  handleSearchChange(
                    event.target.value
                  )
                }
                placeholder="Search by name, email or phone"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="patient-status-filter"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Account Status
              </label>

              <select
                id="patient-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  handleStatusFilterChange(
                    event.target
                      .value as "all" | Patient["status"]
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">
                  All Statuses
                </option>
                <option value="active">
                  Active
                </option>
                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            {hasActiveFilters ? (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 md:w-auto"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={`patient-skeleton-${index}`}
                  className="grid gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-5"
                >
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                </div>
              )
            )}
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-red-600">
              Unable to load patients
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[850px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Age
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Appointments
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedPatients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          No patients found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {hasActiveFilters
                            ? "Try changing your search or filters."
                            : "No patient accounts are currently available."}
                        </p>

                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={
                              handleClearFilters
                            }
                            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Clear Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedPatients.map(
                      (patient) => {
                        const appointmentCount =
                          appointments.filter(
                            (appointment) =>
                              appointment.patient?.id ===
                                patient.id ||
                              appointment.patient?.name ===
                                patient.name
                          ).length;

                        return (
                          <tr
                            key={patient.id}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                                  {patient.initials}
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {patient.name}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {patient.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-700">
                                {patient.email}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {patient.phone}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-sm text-slate-700">
                              {patient.age} years
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                              {appointmentCount}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  patient.status ===
                                  "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {patient.status ===
                                "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                {canViewPatients && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleViewPatient(
                                        patient
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                  >
                                    View
                                  </button>
                                )}

                                {canEditPatients && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenPatientAction(
                                        patient
                                      )
                                    }
                                    className={`rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition ${
                                      patient.status ===
                                      "active"
                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                  >
                                    {patient.status ===
                                    "active"
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {startIndex + 1}
                  </span>
                  –
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      startIndex +
                        patientsPerPage,
                      filteredPatients.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredPatients.length}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage(
                        (page) => Math.max(page - 1, 1)
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    Page {safeCurrentPage} of{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          page + 1,
                          totalPages
                        )
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleClosePatientModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Patient Details
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Complete patient profile and appointment history.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePatientModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close patient details"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="rounded-xl bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                      {selectedPatient.initials}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedPatient.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedPatient.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                      selectedPatient.status ===
                      "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedPatient.status ===
                    "active"
                      ? "Active Account"
                      : "Inactive Account"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Personal Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Full Name
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedPatient.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Age
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedPatient.age} years
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                      {selectedPatient.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedPatient.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Appointment History
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedPatientAppointments.length}{" "}
                      appointment
                      {selectedPatientAppointments.length !==
                      1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>

                {selectedPatientAppointments.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No appointment history
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Appointments for this patient will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPatientAppointments.map(
                      (appointment) => (
                        <div
                          key={appointment.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {appointment.clinician}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {appointment.specialty}
                              </p>

                              <p className="mt-2 text-sm text-slate-700">
                                {formatDateTime(
                                  appointment.startsAt
                                )}
                              </p>
                            </div>

                            <span
                              className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${getAppointmentStatusClass(
                                appointment
                              )}`}
                            >
                              {getAppointmentStatusLabel(
                                appointment
                              )}
                            </span>
                          </div>

                          {appointment.actionType ===
                            "rescheduled" && (
                            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                              <span className="font-semibold">
                                Rescheduled
                              </span>

                              {appointment.actionReason
                                ? ` — ${appointment.actionReason}`
                                : ""}
                            </div>
                          )}

                          {appointment.status ===
                            "cancelled" &&
                            appointment.actionReason && (
                              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                                <span className="font-semibold">
                                  Cancellation reason:
                                </span>{" "}
                                {appointment.actionReason}
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClosePatientModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

              {canEditPatients && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenPatientAction(
                      selectedPatient
                    )
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    selectedPatient.status ===
                    "active"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {selectedPatient.status ===
                  "active"
                    ? "Deactivate Patient"
                    : "Activate Patient"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {patientAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleClosePatientAction}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="p-6">
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                  patientAction.nextStatus ===
                  "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {patientAction.nextStatus ===
                "active"
                  ? "✓"
                  : "!"}
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                {patientAction.nextStatus ===
                "active"
                  ? "Activate Patient?"
                  : "Deactivate Patient?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to{" "}
                {patientAction.nextStatus ===
                "active"
                  ? "activate"
                  : "deactivate"}{" "}
                <span className="font-semibold text-slate-700">
                  {patientAction.patient.name}
                </span>
                ? The patient account will be marked as{" "}
                <span className="font-semibold text-slate-700">
                  {patientAction.nextStatus}
                </span>
                .
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleClosePatientAction}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmPatientAction
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  patientAction.nextStatus ===
                  "active"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {patientAction.nextStatus ===
                "active"
                  ? "Activate"
                  : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
