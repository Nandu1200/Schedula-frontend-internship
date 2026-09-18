"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { doctors } from "@/lib/mock-data/doctors";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";

import type { Doctor } from "@/types/doctor";
import type { AdminDoctorStatus } from "@/types/admin";

/* -------------------------------------------------------------------------- */
/* Registered Doctor Store                                                    */
/* -------------------------------------------------------------------------- */

const subscribeToRegisteredDoctor = (
  callback: () => void
) => {
  window.addEventListener("storage", callback);

  window.addEventListener(
    "registered-doctor-changed",
    callback
  );

  window.addEventListener(
    "doctor-verification-changed",
    callback
  );

  return () => {
    window.removeEventListener("storage", callback);

    window.removeEventListener(
      "registered-doctor-changed",
      callback
    );

    window.removeEventListener(
      "doctor-verification-changed",
      callback
    );
  };
};

const getRegisteredDoctorSnapshot = () => {
  return localStorage.getItem("registeredDoctor") ?? "";
};

const getServerRegisteredDoctorSnapshot = () => {
  return "";
};

/* -------------------------------------------------------------------------- */
/* Verification Helpers                                                       */
/* -------------------------------------------------------------------------- */

const getVerificationStatus = (
  doctorId: string,
  verificationOverrides: Record<
    string,
    AdminDoctorStatus
  >
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

  if (verificationOverrides[doctorId]) {
    return verificationOverrides[doctorId];
  }

  const adminDoctor = adminDoctors.find(
    (doctor) => doctor.doctorId === doctorId
  );

  return adminDoctor?.verificationStatus ?? "pending";
};

const getStatusLabel = (
  status: AdminDoctorStatus
): string => {
  switch (status) {
    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "pending":
    default:
      return "Pending";
  }
};

/* -------------------------------------------------------------------------- */
/* Verification Badge                                                         */
/* -------------------------------------------------------------------------- */

function VerificationBadge({
  status,
}: {
  status: AdminDoctorStatus;
}) {
  const statusClasses: Record<
    AdminDoctorStatus,
    string
  > = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700",

    approved:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    rejected:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function DoctorVerificationPage() {
  const [selectedDoctor, setSelectedDoctor] =
    useState<Doctor | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | AdminDoctorStatus
  >("pending");

  const [verificationOverrides, setVerificationOverrides] =
    useState<Record<string, AdminDoctorStatus>>({});

  const [rejectionReasons, setRejectionReasons] =
    useState<Record<string, string>>({});

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [rejectionError, setRejectionError] =
    useState("");

  const [confirmationAction, setConfirmationAction] =
    useState<"approve" | "reject" | null>(null);

  const [viewingDocument, setViewingDocument] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  /* ------------------------------------------------------------------------ */
  /* Read Registered Doctor                                                   */
  /* ------------------------------------------------------------------------ */

  const registeredDoctorSnapshot =
    useSyncExternalStore(
      subscribeToRegisteredDoctor,
      getRegisteredDoctorSnapshot,
      getServerRegisteredDoctorSnapshot
    );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsLoading(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const loadError = useMemo(() => {
    if (!registeredDoctorSnapshot) {
      return "";
    }

    try {
      JSON.parse(registeredDoctorSnapshot);
      return "";
    } catch {
      return "We couldn't load doctor verification data.";
    }
  }, [registeredDoctorSnapshot]);

  /* ------------------------------------------------------------------------ */
  /* Build Doctor List                                                        */
  /* ------------------------------------------------------------------------ */

  const allDoctors = useMemo<Doctor[]>(() => {
    const doctorList = [...doctors];

    if (!registeredDoctorSnapshot) {
      return doctorList;
    }

    try {
      const registeredDoctor =
        JSON.parse(
          registeredDoctorSnapshot
        ) as Doctor;

      const doctorExists = doctorList.some(
        (doctor) =>
          doctor.id === registeredDoctor.id
      );

      if (!doctorExists) {
        doctorList.push(registeredDoctor);
      }
    } catch {
      return doctorList;
    }

    return doctorList;
  }, [registeredDoctorSnapshot]);

  /* ------------------------------------------------------------------------ */
  /* Filter Doctors                                                           */
  /* ------------------------------------------------------------------------ */

  const filteredDoctors = useMemo(() => {
    if (statusFilter === "all") {
      return allDoctors;
    }

    return allDoctors.filter(
      (doctor) =>
        getVerificationStatus(
          doctor.id,
          verificationOverrides
        ) === statusFilter
    );
  }, [
    allDoctors,
    statusFilter,
    verificationOverrides,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Verification Counts                                                      */
  /* ------------------------------------------------------------------------ */

  const pendingCount = useMemo(() => {
    return allDoctors.filter(
      (doctor) =>
        getVerificationStatus(
          doctor.id,
          verificationOverrides
        ) === "pending"
    ).length;
  }, [allDoctors, verificationOverrides]);

  const approvedCount = useMemo(() => {
    return allDoctors.filter(
      (doctor) =>
        getVerificationStatus(
          doctor.id,
          verificationOverrides
        ) === "approved"
    ).length;
  }, [allDoctors, verificationOverrides]);

  const rejectedCount = useMemo(() => {
    return allDoctors.filter(
      (doctor) =>
        getVerificationStatus(
          doctor.id,
          verificationOverrides
        ) === "rejected"
    ).length;
  }, [allDoctors, verificationOverrides]);

  /* ------------------------------------------------------------------------ */
  /* Modal Handlers                                                           */
  /* ------------------------------------------------------------------------ */

  const handleViewDoctor = (doctor: Doctor) => {
    const currentStatus = getVerificationStatus(
      doctor.id,
      verificationOverrides
    );

    setSelectedDoctor(doctor);

    if (currentStatus === "rejected") {
      const storedReason = localStorage.getItem(
        `doctorVerificationRejectionReason-${doctor.id}`
      );

      setRejectionReason(
        rejectionReasons[doctor.id] ??
          storedReason ??
          ""
      );
    } else {
      setRejectionReason("");
    }

    setRejectionError("");
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
    setRejectionReason("");
    setRejectionError("");
  };

  /* ------------------------------------------------------------------------ */
  /* Approve Doctor                                                           */
  /* ------------------------------------------------------------------------ */

  const handleApproveDoctor = () => {
    setConfirmationAction("approve");
  };

  const confirmApproveDoctor = (doctorId: string) => {
    localStorage.setItem(
      `doctorVerificationStatus-${doctorId}`,
      "approved"
    );

    localStorage.removeItem(
      `doctorVerificationRejectionReason-${doctorId}`
    );

    setVerificationOverrides((currentStatuses) => ({
      ...currentStatuses,
      [doctorId]: "approved",
    }));

    window.dispatchEvent(
      new Event("doctor-verification-changed")
    );

    setRejectionReason("");
    setRejectionError("");
    setConfirmationAction(null);
    setSelectedDoctor(null);
  };

  /* ------------------------------------------------------------------------ */
  /* Reject Doctor                                                            */
  /* ------------------------------------------------------------------------ */

  const handleRejectDoctor = () => {
    const trimmedReason = rejectionReason.trim();

    if (!trimmedReason) {
      setRejectionError("Rejection reason is required.");
      return;
    }

    setConfirmationAction("reject");
  };

  const confirmRejectDoctor = (doctorId: string) => {
    const trimmedReason = rejectionReason.trim();

    localStorage.setItem(
      `doctorVerificationStatus-${doctorId}`,
      "rejected"
    );

    localStorage.setItem(
      `doctorVerificationRejectionReason-${doctorId}`,
      trimmedReason
    );

    setVerificationOverrides((currentStatuses) => ({
      ...currentStatuses,
      [doctorId]: "rejected",
    }));

    window.dispatchEvent(
      new Event("doctor-verification-changed")
    );

    setRejectionReasons((currentReasons) => ({
      ...currentReasons,
      [doctorId]: trimmedReason,
    }));

    setRejectionReason("");
    setRejectionError("");
    setConfirmationAction(null);
    setSelectedDoctor(null);
  };

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <p className="mt-4 text-sm font-semibold text-slate-800">
            Loading doctor verification...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Please wait while verification data is loaded.
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div
          className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"
          role="alert"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
            !
          </div>

          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Doctor Verification
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Review doctor registrations and verification
          status.
        </p>
      </div>

      {/* Verification Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {/* Pending */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter("pending")
          }
          className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
            statusFilter === "pending"
              ? "border-amber-300 ring-2 ring-amber-100"
              : "border-slate-200 hover:border-amber-200"
          }`}
        >
          <p className="text-sm font-semibold text-slate-500">
            Pending Verification
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {pendingCount}
          </p>
        </button>

        {/* Approved */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter("approved")
          }
          className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
            statusFilter === "approved"
              ? "border-emerald-300 ring-2 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-200"
          }`}
        >
          <p className="text-sm font-semibold text-slate-500">
            Approved
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {approvedCount}
          </p>
        </button>

        {/* Rejected */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter("rejected")
          }
          className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
            statusFilter === "rejected"
              ? "border-red-300 ring-2 ring-red-100"
              : "border-slate-200 hover:border-red-200"
          }`}
        >
          <p className="text-sm font-semibold text-slate-500">
            Rejected
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {rejectedCount}
          </p>
        </button>
      </div>

      {/* Verification Requests */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Verification Requests
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredDoctors.length} doctor
              {filteredDoctors.length !== 1
                ? "s"
                : ""}
              .
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "all"
                  | AdminDoctorStatus
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="all">
              All Status
            </option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full">
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
                  Hospital
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      No doctors found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      There are no doctors with this
                      verification status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => {
                  const verificationStatus =
                    getVerificationStatus(
                      doctor.id,
                      verificationOverrides
                    );

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

                      {/* Hospital */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.hospital}
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {doctor.location}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <VerificationBadge
                          status={verificationStatus}
                        />
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewDoctor(
                              doctor
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationAction && selectedDoctor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setConfirmationAction(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900">
              {confirmationAction === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmationAction === "approve"
                ? `Are you sure you want to approve ${selectedDoctor.name} for verification?`
                : `Are you sure you want to reject ${selectedDoctor.name}'s verification?`}
            </p>

            {confirmationAction === "reject" && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Rejection Reason
                </p>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  {rejectionReason.trim()}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmationAction(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirmationAction === "approve") {
                    confirmApproveDoctor(selectedDoctor.id);
                  } else {
                    confirmRejectDoctor(selectedDoctor.id);
                  }
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  confirmationAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmationAction === "approve"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Review Modal */}
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
                  Review Doctor
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Review the registered doctor&apos;s
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close doctor review"
              >
                ×
              </button>
            </div>

            {/* Doctor Information */}
            <div className="space-y-6 p-6">
              {/* Summary */}
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

                  <VerificationBadge
                    status={getVerificationStatus(
                      selectedDoctor.id,
                      verificationOverrides
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Contact Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedDoctor.email}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
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
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Specialty
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedDoctor.specialty}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Qualification
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedDoctor.qualification}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Experience
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedDoctor.experienceYears}{" "}
                      years
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Hospital
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedDoctor.hospital}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                    <p className="text-xs text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedDoctor.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Documents */}
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Verification Documents
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Qualification Document
                    </p>

                    {selectedDoctor.qualificationDocument ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {selectedDoctor.qualificationDocument}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setViewingDocument(
                              selectedDoctor.qualificationDocument ?? null
                            )
                          }
                          className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          View Document
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Not provided
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Medical License Document
                    </p>

                    {selectedDoctor.licenseDocument ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {selectedDoctor.licenseDocument}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setViewingDocument(
                              selectedDoctor.licenseDocument ?? null
                            )
                          }
                          className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          View Document
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>

                {viewingDocument && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Mock Document Preview
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {viewingDocument}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          This is a mock document for the frontend
                          verification flow. No real file is attached.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingDocument(null)}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
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

                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {selectedDoctor.bio}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {getVerificationStatus(
                selectedDoctor.id,
                verificationOverrides
              ) === "pending" && (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                    Rejection Reason
                  </h3>

                  <textarea
                    value={rejectionReason}
                    onChange={(event) => {
                      setRejectionReason(
                        event.target.value
                      );

                      if (
                        rejectionError
                      ) {
                        setRejectionError("");
                      }
                    }}
                    placeholder="Enter the reason for rejecting this doctor's verification..."
                    rows={4}
                    className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                      rejectionError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                    }`}
                  />

                  {rejectionError && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {rejectionError}
                    </p>
                  )}
                </div>
              )}

              {/* Existing Rejection Reason */}
              {getVerificationStatus(
                selectedDoctor.id,
                verificationOverrides
              ) === "rejected" &&
                (rejectionReasons[selectedDoctor.id] ||
                  localStorage.getItem(
                    `doctorVerificationRejectionReason-${selectedDoctor.id}`
                  )) && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                      Rejection Reason
                    </h3>

                    <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                      {rejectionReasons[selectedDoctor.id] ||
                        localStorage.getItem(
                          `doctorVerificationRejectionReason-${selectedDoctor.id}`
                        )}
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                {getVerificationStatus(
                  selectedDoctor.id,
                  verificationOverrides
                ) === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleApproveDoctor()
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Approve Verification
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleRejectDoctor()
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Reject Verification
                    </button>
                  </>
                )}
              </div>

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
    </main>
  );
}