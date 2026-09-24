"use client";

import { useEffect, useMemo, useState } from "react";
import { doctors } from "@/lib/mock-data/doctors";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";
import StatusBadge from "@/components/admin/StatusBadge";
import { hasPermission } from "@/lib/admin/permissions";
import type { Doctor } from "@/types/doctor";
import type {
  AdminDoctorStatus,
  AdminUserRole,
} from "@/types/admin";
import { addAuditLog } from "@/lib/utils/audit-logs";

const getVerificationStatus = (
  doctorId: string
): AdminDoctorStatus => {
  const storedStatus = localStorage.getItem(
    `doctorVerificationStatus-${doctorId}`
  );

  if (
    storedStatus === "pending" ||
    storedStatus === "approved" ||
    storedStatus === "rejected"
  ) {
    return storedStatus;
  }

  const adminDoctor = adminDoctors.find(
    (doctor) => doctor.doctorId === doctorId
  );

  return adminDoctor?.verificationStatus ?? "pending";
};

export default function AdminDoctorsPage() {
  const [allDoctors, setAllDoctors] =
    useState<Doctor[]>(doctors);

  const [selectedDoctor, setSelectedDoctor] =
    useState<Doctor | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [specialtyFilter, setSpecialtyFilter] =
    useState("all");

  const [verificationFilter, setVerificationFilter] =
    useState<"all" | AdminDoctorStatus>("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [doctorToDeactivate, setDoctorToDeactivate] =
    useState<Doctor | null>(null);

  const [doctorToActivate, setDoctorToActivate] =
    useState<Doctor | null>(null);

  const [verificationRefreshKey, setVerificationRefreshKey] =
    useState(0);

  const [adminRole, setAdminRole] =
    useState<AdminUserRole | null>(null);

  const doctorsPerPage = 5;

  useEffect(() => {
    const storedRole = localStorage.getItem("admin_role");

    if (
      storedRole === "super-admin" ||
      storedRole === "admin" ||
      storedRole === "support"
    ) {
      setAdminRole(storedRole);
    }

    const loadFrameId =
      window.requestAnimationFrame(() => {
        try {
          const storedDoctor =
            localStorage.getItem("registeredDoctor");

          if (!storedDoctor) {
            setAllDoctors(doctors);
            return;
          }

          const registeredDoctor = JSON.parse(
            storedDoctor
          ) as Doctor;

          const doctorExists = doctors.some(
            (doctor) =>
              doctor.id === registeredDoctor.id
          );

          if (doctorExists) {
            setAllDoctors(doctors);
          } else {
            setAllDoctors([
              ...doctors,
              registeredDoctor,
            ]);
          }
        } catch {
          setAllDoctors(doctors);
        }
      });

    const handleVerificationChange = () => {
      setVerificationRefreshKey(
        (currentKey) => currentKey + 1
      );
    };

    window.addEventListener(
      "doctor-verification-changed",
      handleVerificationChange
    );

    window.addEventListener(
      "storage",
      handleVerificationChange
    );

    return () => {
      window.cancelAnimationFrame(loadFrameId);

      window.removeEventListener(
        "doctor-verification-changed",
        handleVerificationChange
      );

      window.removeEventListener(
        "storage",
        handleVerificationChange
      );
    };
  }, []);

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
  };

  const handleOpenActivateModal = (
    doctor: Doctor
  ) => {
    setDoctorToActivate(doctor);
  };

  const handleCloseActivateModal = () => {
    setDoctorToActivate(null);
  };

  const handleConfirmActivate = () => {
    if (!doctorToActivate) {
      return;
    }

    const doctorId = doctorToActivate.id;

    setAllDoctors((currentDoctors) =>
      currentDoctors.map((doctor) =>
        doctor.id === doctorId
          ? {
              ...doctor,
              status: "active",
            }
          : doctor
      )
    );

    if (selectedDoctor?.id === doctorId) {
      setSelectedDoctor({
        ...selectedDoctor,
        status: "active",
      });
    }

    const storedDoctor =
      localStorage.getItem("registeredDoctor");

    if (storedDoctor) {
      try {
        const registeredDoctor = JSON.parse(
          storedDoctor
        ) as Doctor;

        if (registeredDoctor.id === doctorId) {
          localStorage.setItem(
            "registeredDoctor",
            JSON.stringify({
              ...registeredDoctor,
              status: "active",
            })
          );

          window.dispatchEvent(
            new Event("registered-doctor-changed")
          );
        }
      } catch {
        // Ignore invalid localStorage data.
      }
    }

    addAuditLog({
      actorName: "Admin",
      actorRole: "admin",
      action: "doctor-activated",
      affectedEntity: doctorToActivate.name,
      entityType: "doctor",
    });

    setDoctorToActivate(null);
  };

  const handleOpenDeactivateModal = (
    doctor: Doctor
  ) => {
    setDoctorToDeactivate(doctor);
  };

  const handleCloseDeactivateModal = () => {
    setDoctorToDeactivate(null);
  };

  const handleConfirmDeactivate = () => {
    if (!doctorToDeactivate) {
      return;
    }

    const doctorId = doctorToDeactivate.id;

    setAllDoctors((currentDoctors) =>
      currentDoctors.map((doctor) =>
        doctor.id === doctorId
          ? {
              ...doctor,
              status: "inactive",
            }
          : doctor
      )
    );

    if (selectedDoctor?.id === doctorId) {
      setSelectedDoctor({
        ...selectedDoctor,
        status: "inactive",
      });
    }

    const storedDoctor =
      localStorage.getItem("registeredDoctor");

    if (storedDoctor) {
      try {
        const registeredDoctor = JSON.parse(
          storedDoctor
        ) as Doctor;

        if (registeredDoctor.id === doctorId) {
          localStorage.setItem(
            "registeredDoctor",
            JSON.stringify({
              ...registeredDoctor,
              status: "inactive",
            })
          );

          window.dispatchEvent(
            new Event("registered-doctor-changed")
          );
        }
      } catch {
        // Ignore invalid localStorage data.
      }
    }

    addAuditLog({
      actorName: "Admin",
      actorRole: "admin",
      action: "doctor-deactivated",
      affectedEntity: doctorToDeactivate.name,
      entityType: "doctor",
    });

    setDoctorToDeactivate(null);
  };

  const specialties = useMemo(() => {
    return Array.from(
      new Set(
        allDoctors
          .map((doctor) => doctor.specialty)
          .filter(Boolean)
      )
    ).sort();
  }, [allDoctors]);

  const filteredDoctors = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allDoctors.filter((doctor) => {
      const matchesSearch =
        !search ||
        doctor.name.toLowerCase().includes(search) ||
        doctor.email.toLowerCase().includes(search) ||
        doctor.specialty.toLowerCase().includes(search) ||
        doctor.hospital.toLowerCase().includes(search) ||
        doctor.location.toLowerCase().includes(search);

      const matchesSpecialty =
        specialtyFilter === "all" ||
        doctor.specialty === specialtyFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        getVerificationStatus(doctor.id) ===
          verificationFilter;

      return (
        matchesSearch &&
        matchesSpecialty &&
        matchesVerification
      );
    });
  }, [
    allDoctors,
    searchTerm,
    specialtyFilter,
    verificationFilter,
    verificationRefreshKey,
  ]);

  const totalPages = Math.ceil(
    filteredDoctors.length / doctorsPerPage
  );

  const safeCurrentPage =
    totalPages === 0
      ? 1
      : Math.min(currentPage, totalPages);

  const startIndex =
    (safeCurrentPage - 1) * doctorsPerPage;

  const paginatedDoctors = filteredDoctors.slice(
    startIndex,
    startIndex + doctorsPerPage
  );

  const handleSearchChange = (
    value: string
  ) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSpecialtyChange = (
    value: string
  ) => {
    setSpecialtyFilter(value);
    setCurrentPage(1);
  };

  const handleVerificationChange = (
    value: "all" | AdminDoctorStatus
  ) => {
    setVerificationFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSpecialtyFilter("all");
    setVerificationFilter("all");
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(page - 1, 1)
    );
  };

  const handleNextPage = () => {
    setCurrentPage((page) =>
      Math.min(page + 1, totalPages)
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    specialtyFilter !== "all" ||
    verificationFilter !== "all";

  const canViewDoctors =
    adminRole !== null &&
    hasPermission(adminRole, "doctors", "view");

  const canEditDoctor =
    adminRole !== null &&
    hasPermission(adminRole, "doctors", "edit");

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Doctors
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Manage and verify doctors registered on Schedula.
        </p>
      </div>

      {/* Doctors Management */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Management Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Doctors Management
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredDoctors.length} doctor
                {filteredDoctors.length !== 1
                  ? "s"
                  : ""}.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label
                  htmlFor="doctor-search"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Search Doctors
                </label>

                <input
                  id="doctor-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    handleSearchChange(
                      event.target.value
                    )
                  }
                  placeholder="Search name, email, specialty..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Specialty Filter */}
              <div>
                <label
                  htmlFor="specialty-filter"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Specialty
                </label>

                <select
                  id="specialty-filter"
                  value={specialtyFilter}
                  onChange={(event) =>
                    handleSpecialtyChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">
                    All Specialties
                  </option>

                  {specialties.map((specialty) => (
                    <option
                      key={specialty}
                      value={specialty}
                    >
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label
                  htmlFor="verification-filter"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Verification
                </label>

                <select
                  id="verification-filter"
                  value={verificationFilter}
                  onChange={(event) =>
                    handleVerificationChange(
                      event.target.value as
                        | "all"
                        | AdminDoctorStatus
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">
                    All Status
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="approved">
                    Approved
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Doctors Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Doctor
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Specialty
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qualification
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Experience
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hospital
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fee
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verification
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      No doctors found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filters.
                    </p>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedDoctors.map((doctor) => {
                  const verificationStatus =
                    getVerificationStatus(doctor.id);

                  return (
                    <tr
                      key={doctor.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      {/* Doctor */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {doctor.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {doctor.email}
                          </p>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.specialty}
                      </td>

                      {/* Qualification */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.qualification}
                      </td>

                      {/* Experience */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.experienceYears} years
                      </td>

                      {/* Hospital */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.hospital}
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.location}
                      </td>

                      {/* Fee */}
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ₹{doctor.consultationFee}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            doctor.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {doctor.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Verification */}
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={verificationStatus}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {canViewDoctors && (
                            <button
                              type="button"
                              onClick={() =>
                                handleViewDoctor(doctor)
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              View
                            </button>
                          )}

                          {canEditDoctor && (
                            <>
                              {doctor.status === "active" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDeactivateModal(
                                  doctor
                                )
                              }
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenActivateModal(
                                  doctor
                                )
                              }
                              className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                            >
                              Activate
                            </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  startIndex + doctorsPerPage,
                  filteredDoctors.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredDoctors.length}
              </span>{" "}
              doctors
            </p>

            <div className="flex items-center gap-2">
              {/* Previous */}
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={safeCurrentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      handlePageChange(page)
                    }
                    aria-current={
                      safeCurrentPage === page
                        ? "page"
                        : undefined
                    }
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                      safeCurrentPage === page
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next */}
              <button
                type="button"
                onClick={handleNextPage}
                disabled={
                  safeCurrentPage === totalPages
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Doctor Details
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Complete information about this doctor.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close doctor details"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-6">
              {/* Doctor Summary */}
              <div className="rounded-xl bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedDoctor.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDoctor.specialty}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        selectedDoctor.status ===
                        "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedDoctor.status ===
                      "active"
                        ? "Active"
                        : "Inactive"}
                    </span>

                    <StatusBadge
                      status={getVerificationStatus(
                        selectedDoctor.id
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Personal Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Professional Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Specialty
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.specialty}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Qualification
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.qualification}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Experience
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.experienceYears} years
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Hospital
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.hospital}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedDoctor.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consultation Fees */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Consultation Fees
                </h3>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Consultation
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      ₹{selectedDoctor.consultationFee}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Online
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      ₹{selectedDoctor.onlineFee}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      In-person
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      ₹{selectedDoctor.inPersonFee}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedDoctor.bio && (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                    Bio
                  </h3>

                  <p className="text-sm leading-6 text-slate-600">
                    {selectedDoctor.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {doctorToActivate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleCloseActivateModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-600">
                ✓
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Activate Doctor?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to activate{" "}
                <span className="font-semibold text-slate-700">
                  {doctorToActivate.name}
                </span>
                ? The doctor will be marked as active.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseActivateModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmActivate}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {doctorToDeactivate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          onClick={handleCloseDeactivateModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
                !
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Deactivate Doctor?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-slate-700">
                  {doctorToDeactivate.name}
                </span>
                ? The doctor will be marked as inactive.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDeactivateModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}