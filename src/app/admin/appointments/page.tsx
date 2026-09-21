"use client";

import { useEffect, useMemo, useState } from "react";

import { appointments as mockAppointments } from "@/lib/mock-data/appointments";
import type {
  Appointment,
  AppointmentStatus,
  ConsultationType,
} from "@/types/appointment";

const appointmentsPerPage = 5;

type AppointmentDisplayStatus =
  | "Confirmed"
  | "Upcoming"
  | "Completed"
  | "Cancelled"
  | "Rescheduled"
  | "Pending"
  | "Missed";

const getDisplayStatus = (
  appointment: Appointment
): AppointmentDisplayStatus => {
  if (
    appointment.actionType === "rescheduled" &&
    appointment.status !== "cancelled"
  ) {
    return "Rescheduled";
  }

  if (appointment.status === "upcoming") {
    return "Upcoming";
  }

  if (appointment.status === "confirmed") {
    const startTime = new Date(appointment.startsAt).getTime();

    if (startTime > Date.now()) {
      return "Upcoming";
    }

    return "Confirmed";
  }

  if (appointment.status === "completed") {
    return "Completed";
  }

  if (appointment.status === "cancelled") {
    return "Cancelled";
  }

  if (appointment.status === "missed") {
    return "Missed";
  }

  return "Pending";
};

const statusClassMap: Record<AppointmentDisplayStatus, string> = {
  Confirmed: "bg-blue-50 text-blue-700",
  Upcoming: "bg-emerald-50 text-emerald-700",
  Completed: "bg-slate-100 text-slate-700",
  Cancelled: "bg-red-50 text-red-700",
  Rescheduled: "bg-amber-50 text-amber-700",
  Pending: "bg-yellow-50 text-yellow-700",
  Missed: "bg-orange-50 text-orange-700",
};

const consultationTypeClassMap: Record<ConsultationType, string> = {
  online: "bg-violet-50 text-violet-700",
  "in-person": "bg-cyan-50 text-cyan-700",
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatStatusFilterValue = (status: AppointmentDisplayStatus) => {
  return status.toLowerCase();
};

const isAppointmentStatus = (
  value: string
): value is AppointmentStatus => {
  return [
    "pending",
    "confirmed",
    "upcoming",
    "completed",
    "cancelled",
    "missed",
  ].includes(value);
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadAppointments = () => {
      try {
        const storedAppointments =
          localStorage.getItem("appointments");

        if (!storedAppointments) {
          setAppointments(mockAppointments);
          setLoading(false);
          return;
        }

        const parsedAppointments = JSON.parse(
          storedAppointments
        ) as unknown;

        if (!Array.isArray(parsedAppointments)) {
          throw new Error("Invalid appointments data");
        }

        const validAppointments = parsedAppointments.filter(
          (appointment): appointment is Appointment => {
            if (
              typeof appointment !== "object" ||
              appointment === null
            ) {
              return false;
            }

            const candidate =
              appointment as Partial<Appointment>;

            return (
              typeof candidate.id === "string" &&
              typeof candidate.clinician === "string" &&
              typeof candidate.startsAt === "string" &&
              typeof candidate.status === "string" &&
              isAppointmentStatus(candidate.status)
            );
          }
        );

        setAppointments(
          validAppointments.length > 0
            ? validAppointments
            : mockAppointments
        );
        setLoading(false);
      } catch {
        setAppointments([]);
        setError("We couldn't load appointments.");
        setLoading(false);
      }
    };

    loadAppointments();

    const handleAppointmentChange = () => {
      loadAppointments();
    };

    window.addEventListener(
      "appointments-changed",
      handleAppointmentChange
    );
    window.addEventListener(
      "storage",
      handleAppointmentChange
    );

    return () => {
      window.removeEventListener(
        "appointments-changed",
        handleAppointmentChange
      );
      window.removeEventListener(
        "storage",
        handleAppointmentChange
      );
    };
  }, []);

  const doctors = useMemo(() => {
    return Array.from(
      new Set(
        appointments
          .map((appointment) => appointment.clinician)
          .filter(Boolean)
      )
    ).sort();
  }, [appointments]);

  const patients = useMemo(() => {
    return Array.from(
      new Set(
        appointments
          .map((appointment) => appointment.patient.name)
          .filter(Boolean)
      )
    ).sort();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return appointments
      .filter((appointment) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          appointment.id,
          appointment.clinician,
          appointment.patient.name,
          appointment.specialty,
          appointment.reason,
          appointment.room,
        ]
          .filter(Boolean)
          .some((value) =>
            value.toLowerCase().includes(normalizedSearch)
          );
      })
      .filter((appointment) => {
        return (
          doctorFilter === "all" ||
          appointment.clinician === doctorFilter
        );
      })
      .filter((appointment) => {
        return (
          patientFilter === "all" ||
          appointment.patient.name === patientFilter
        );
      })
      .filter((appointment) => {
        if (!dateFilter) {
          return true;
        }

        return (
          appointment.startsAt.slice(0, 10) === dateFilter
        );
      })
      .filter((appointment) => {
        if (statusFilter === "all") {
          return true;
        }

        return (
          getDisplayStatus(appointment).toLowerCase() ===
          statusFilter
        );
      })
      .filter((appointment) => {
        if (typeFilter === "all") {
          return true;
        }

        return appointment.consultationType === typeFilter;
      })
      .sort(
        (first, second) =>
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime()
      );
  }, [
    appointments,
    dateFilter,
    doctorFilter,
    patientFilter,
    searchTerm,
    statusFilter,
    typeFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAppointments.length / appointmentsPerPage
    )
  );

  useEffect(() => {
    setCurrentPage((page) =>
      Math.min(Math.max(page, 1), totalPages)
    );
  }, [totalPages]);

  const paginatedAppointments = useMemo(() => {
    const startIndex =
      (currentPage - 1) * appointmentsPerPage;

    return filteredAppointments.slice(
      startIndex,
      startIndex + appointmentsPerPage
    );
  }, [currentPage, filteredAppointments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    doctorFilter,
    patientFilter,
    dateFilter,
    statusFilter,
    typeFilter,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setDoctorFilter("all");
    setPatientFilter("all");
    setDateFilter("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    doctorFilter !== "all" ||
    patientFilter !== "all" ||
    dateFilter !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  const renderLoadingState = () => {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section>
          <p className="text-sm font-semibold text-emerald-600">
            Admin Management
          </p>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Appointments
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage all patient appointments.
              </p>
            </div>

            <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              {filteredAppointments.length} appointment
              {filteredAppointments.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label
                htmlFor="appointment-search"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <input
                id="appointment-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Doctor, patient, ID..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="appointment-doctor"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Doctor
              </label>

              <select
                id="appointment-doctor"
                value={doctorFilter}
                onChange={(event) =>
                  setDoctorFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All doctors</option>

                {doctors.map((doctor) => (
                  <option key={doctor} value={doctor}>
                    {doctor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="appointment-patient"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Patient
              </label>

              <select
                id="appointment-patient"
                value={patientFilter}
                onChange={(event) =>
                  setPatientFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All patients</option>

                {patients.map((patient) => (
                  <option key={patient} value={patient}>
                    {patient}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="appointment-date"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Date
              </label>

              <input
                id="appointment-date"
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="appointment-status"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="appointment-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All statuses</option>

                {(
                  [
                    "Confirmed",
                    "Upcoming",
                    "Completed",
                    "Cancelled",
                    "Rescheduled",
                    "Pending",
                    "Missed",
                  ] as AppointmentDisplayStatus[]
                ).map((status) => (
                  <option
                    key={status}
                    value={formatStatusFilterValue(status)}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="appointment-type"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Consultation
              </label>

              <select
                id="appointment-type"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All types</option>
                <option value="online">Online</option>
                <option value="in-person">In-person</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5">
                {renderLoadingState()}
              </div>
            ) : error ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">
                  !
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  Unable to load appointments
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {error}
                </p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                  ▣
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  No appointments found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {hasActiveFilters
                    ? "Try changing or clearing the filters."
                    : "There are no appointments to display."}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-[1080px] w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Appointment
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Doctor
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Date & Time
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedAppointments.map(
                    (appointment) => {
                      const displayStatus =
                        getDisplayStatus(appointment);

                      const consultationType =
                        appointment.consultationType ??
                        "in-person";

                      return (
                        <tr
                          key={appointment.id}
                          className="align-top hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {appointment.id}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {appointment.specialty}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {appointment.patient.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Age {appointment.patient.age}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {appointment.clinician}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {appointment.specialty}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDateTime(
                                appointment.startsAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {appointment.durationMinutes} min
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                consultationTypeClassMap[
                                  consultationType
                                ]
                              }`}
                            >
                              {consultationType === "online"
                                ? "Online"
                                : "In-person"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                statusClassMap[displayStatus]
                              }`}
                            >
                              {displayStatus}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAppointment(
                                  appointment
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading &&
            !error &&
            filteredAppointments.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(currentPage - 1) *
                      appointmentsPerPage +
                      1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      currentPage * appointmentsPerPage,
                      filteredAppointments.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredAppointments.length}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(page - 1, 1)
                      )
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm font-semibold text-slate-600">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(page + 1, totalPages)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      {/* Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Appointment Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedAppointment.id}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close appointment details"
                onClick={() =>
                  setSelectedAppointment(null)
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Patient
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedAppointment.patient.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Age {selectedAppointment.patient.age}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Doctor
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedAppointment.clinician}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedAppointment.specialty}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Consultation Type
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      consultationTypeClassMap[
                        selectedAppointment.consultationType ??
                          "in-person"
                      ]
                    }`}
                  >
                    {selectedAppointment.consultationType ===
                    "online"
                      ? "Online"
                      : "In-person"}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(
                      selectedAppointment.startsAt
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Start Time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {new Intl.DateTimeFormat("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(
                      new Date(selectedAppointment.startsAt)
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedAppointment.durationMinutes}{" "}
                    minutes
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusClassMap[
                          getDisplayStatus(
                            selectedAppointment
                          )
                        ]
                      }`}
                    >
                      {getDisplayStatus(
                        selectedAppointment
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Location / Room
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedAppointment.room || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Appointment Reason
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {selectedAppointment.reason ||
                    "No reason provided."}
                </p>
              </div>

              {(selectedAppointment.actionType ||
                selectedAppointment.actionReason) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    {selectedAppointment.actionType ===
                    "rescheduled"
                      ? "Reschedule Information"
                      : "Cancellation Information"}
                  </p>

                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    {selectedAppointment.actionBy && (
                      <p>
                        <span className="font-semibold">
                          Action by:
                        </span>{" "}
                        {selectedAppointment.actionBy ===
                        "doctor"
                          ? "Doctor"
                          : "Patient"}
                      </p>
                    )}

                    {selectedAppointment.actionReason && (
                      <p>
                        <span className="font-semibold">
                          Reason:
                        </span>{" "}
                        {selectedAppointment.actionReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedAppointment.actualEndAt && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                    Actual Consultation End
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDateTime(
                      selectedAppointment.actualEndAt
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
