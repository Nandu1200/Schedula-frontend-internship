"use client";

import { useEffect, useMemo, useState } from "react";
import { doctors } from "@/lib/mock-data/doctors";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";
import StatusBadge from "@/components/admin/StatusBadge";
import type { Doctor } from "@/types/doctor";
import type { AdminDoctorStatus } from "@/types/admin";

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

  useEffect(() => {
    const loadRegisteredDoctor = () => {
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
          (doctor) => doctor.id === registeredDoctor.id
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
    };

    loadRegisteredDoctor();
  }, []);

  const getVerificationStatus = (
    doctorId: string
  ): AdminDoctorStatus => {
    const adminDoctor = adminDoctors.find(
      (doctor) => doctor.doctorId === doctorId
    );

    if (adminDoctor) {
      return adminDoctor.verificationStatus;
    }

    return "pending";
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
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
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSpecialtyFilter("all");
    setVerificationFilter("all");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    specialtyFilter !== "all" ||
    verificationFilter !== "all";

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
                    setSearchTerm(event.target.value)
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
                    setSpecialtyFilter(event.target.value)
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
                    setVerificationFilter(
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
          <table className="min-w-[1150px] w-full">
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
                    colSpan={9}
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
                filteredDoctors.map((doctor) => {
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

                      {/* Verification */}
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={verificationStatus}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewDoctor(doctor)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          View
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

                  <StatusBadge
                    status={getVerificationStatus(
                      selectedDoctor.id
                    )}
                  />
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
    </main>
  );
}