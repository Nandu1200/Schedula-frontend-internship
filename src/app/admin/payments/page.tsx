"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  buildPaymentsFromAppointments,
} from "@/lib/mock-data/payments";
import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import type {
  Payment,
  PaymentStatus,
} from "@/types/payment";
import type { Doctor } from "@/types/doctor";
import { getAdminAppointments } from "@/lib/utils/admin-appointments";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminUserRole } from "@/types/admin";

const getPaymentStatusLabel = (
  status: PaymentStatus
) => {
  switch (status) {
    case "paid":
      return "Paid";

    case "pending":
      return "Pending";

    case "failed":
      return "Failed";

    case "refunded":
      return "Refunded";

    default:
      return status;
  }
};

const getPaymentStatusClasses = (
  status: PaymentStatus
) => {
  switch (status) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "failed":
      return "border-red-200 bg-red-50 text-red-700";

    case "refunded":
      return "border-purple-200 bg-purple-50 text-purple-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const getPaymentMethodLabel = (
  method: Payment["method"]
) => {
  switch (method) {
    case "upi":
      return "UPI";

    case "card":
      return "Card";

    case "netbanking":
      return "Net Banking";

    default:
      return method;
  }
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

type FilterPerson = {
  id: string;
  name: string;
};

const normalizePersonName = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const mergeUniquePeople = (
  people: FilterPerson[]
) => {
  const uniquePeople = new Map<string, FilterPerson>();

  people.forEach((person) => {
    const normalizedName = normalizePersonName(
      person.name
    );

    if (!normalizedName) {
      return;
    }

    if (!uniquePeople.has(normalizedName)) {
      uniquePeople.set(normalizedName, {
        id: normalizedName,
        name: person.name.trim(),
      });
    }
  });

  return Array.from(uniquePeople.values()).sort(
    (first, second) =>
      first.name.localeCompare(second.name)
  );
};

export default function AdminPaymentsPage() {
  const [adminRole, setAdminRole] = useState<AdminUserRole | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [doctorFilter, setDoctorFilter] =
    useState("all");

  const [patientFilter, setPatientFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState<"all" | PaymentStatus>("all");

  const [dateFilter, setDateFilter] =
    useState("");

  const [doctorOptions, setDoctorOptions] =
    useState<FilterPerson[]>([]);

  const [patientOptions, setPatientOptions] =
    useState<FilterPerson[]>([]);

  const [adminPayments, setAdminPayments] =
    useState<Payment[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

  const paymentsPerPage = 5;

  useEffect(() => {
    const storedRole = localStorage.getItem("admin_role") as AdminUserRole | null;
    setAdminRole(storedRole);
  }, []);

  const canViewPayments =
    adminRole !== null &&
    hasPermission(adminRole, "payments", "view");

  const canEditPayments =
    adminRole !== null &&
    hasPermission(adminRole, "payments", "edit");

  useEffect(() => {
    const loadPaymentData = () => {
      try {
        const paymentDoctors: Array<
  Pick<Doctor, "id" | "name" | "consultationFee">
> = [...mockDoctors];

        const addStoredDoctor = (storageKey: string) => {
          const storedDoctor =
            localStorage.getItem(storageKey);

          if (!storedDoctor) {
            return;
          }

          try {
            const parsedDoctor = JSON.parse(
              storedDoctor
            ) as {
              id?: string;
              name?: string;
              consultationFee?: number;
            };

            if (!parsedDoctor.id || !parsedDoctor.name) {
              return;
            }

            const alreadyExists = paymentDoctors.some(
              (doctor) => doctor.id === parsedDoctor.id
            );

            if (alreadyExists) {
              return;
            }

            paymentDoctors.push({
              id: parsedDoctor.id,
              name: parsedDoctor.name,
              consultationFee:
                parsedDoctor.consultationFee ?? 0,
            });
          } catch {
            // Ignore invalid stored doctor data.
          }
        };

        addStoredDoctor("registeredDoctor");
        addStoredDoctor("loggedInDoctor");

        /*
         * Use the exact same appointment source as the
         * Admin Patients and Admin Appointments pages.
         */
        const adminAppointments =
          getAdminAppointments();

        const nextPayments =
          buildPaymentsFromAppointments(
            adminAppointments,
            paymentDoctors
          );

        setAdminPayments(nextPayments);

        setDoctorOptions(
          mergeUniquePeople(
            nextPayments.map((payment) => ({
              id: payment.doctorId,
              name: payment.doctorName,
            }))
          )
        );

        setPatientOptions(
          mergeUniquePeople(
            nextPayments.map((payment) => ({
              id: payment.patientId,
              name: payment.patientName,
            }))
          )
        );
      } catch {
        setAdminPayments([]);
        setDoctorOptions([]);
        setPatientOptions([]);
      }
    };

    loadPaymentData();

    const handlePaymentDataUpdate = () => {
      loadPaymentData();
    };

    window.addEventListener(
      "storage",
      handlePaymentDataUpdate
    );

    window.addEventListener(
      "appointments-updated",
      handlePaymentDataUpdate
    );

    window.addEventListener(
      "registered-user-updated",
      handlePaymentDataUpdate
    );

    return () => {
      window.removeEventListener(
        "storage",
        handlePaymentDataUpdate
      );

      window.removeEventListener(
        "appointments-updated",
        handlePaymentDataUpdate
      );

      window.removeEventListener(
        "registered-user-updated",
        handlePaymentDataUpdate
      );
    };
  }, []);

  const filteredPayments = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return adminPayments.filter((payment) => {
      const matchesSearch =
        !normalizedSearch ||
        payment.transactionId
          .toLowerCase()
          .includes(normalizedSearch) ||
        payment.appointmentId
          .toLowerCase()
          .includes(normalizedSearch) ||
        payment.doctorName
          .toLowerCase()
          .includes(normalizedSearch) ||
        payment.patientName
          .toLowerCase()
          .includes(normalizedSearch) ||
        payment.doctorId
          .toLowerCase()
          .includes(normalizedSearch) ||
        payment.patientId
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDoctor =
        doctorFilter === "all" ||
        normalizePersonName(payment.doctorName) ===
          doctorFilter;

      const matchesPatient =
        patientFilter === "all" ||
        normalizePersonName(payment.patientName) ===
          patientFilter;

      const matchesStatus =
        statusFilter === "all" ||
        payment.status === statusFilter;

      const paymentDate = new Date(
        payment.createdAt
      );

      const paymentDateKey = [
        paymentDate.getFullYear(),
        String(paymentDate.getMonth() + 1).padStart(2, "0"),
        String(paymentDate.getDate()).padStart(2, "0"),
      ].join("-");

      const matchesDate =
        !dateFilter || paymentDateKey === dateFilter;

      return (
        matchesSearch &&
        matchesDoctor &&
        matchesPatient &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    adminPayments,
    searchTerm,
    doctorFilter,
    patientFilter,
    statusFilter,
    dateFilter,
  ]);

  const totalPages = Math.ceil(
    filteredPayments.length / paymentsPerPage
  );

  const safeCurrentPage =
    totalPages === 0
      ? 1
      : Math.min(currentPage, totalPages);

  const paginatedPayments = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * paymentsPerPage;

    return filteredPayments.slice(
      startIndex,
      startIndex + paymentsPerPage
    );
  }, [
    filteredPayments,
    safeCurrentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    doctorFilter,
    patientFilter,
    statusFilter,
    dateFilter,
  ]);

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalAmount = adminPayments.reduce(
    (total, payment) =>
      total + payment.amount,
    0
  );

  const paidCount = adminPayments.filter(
    (payment) => payment.status === "paid"
  ).length;

  const pendingCount = adminPayments.filter(
    (payment) => payment.status === "pending"
  ).length;

  const refundedCount = adminPayments.filter(
    (payment) => payment.status === "refunded"
  ).length;

  const failedCount = adminPayments.filter(
    (payment) => payment.status === "failed"
  ).length;

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    doctorFilter !== "all" ||
    patientFilter !== "all" ||
    statusFilter !== "all" ||
    dateFilter !== "";

  const handleClearFilters = () => {
    setSearchTerm("");
    setDoctorFilter("all");
    setPatientFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  };

  const handleViewPayment = (
    payment: Payment
  ) => {
    setSelectedPayment(payment);
  };

  const handleClosePayment = () => {
    setSelectedPayment(null);
  };

  if (adminRole !== null && !canViewPayments) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Payments
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Manage platform payments, transactions and
          refund information.
        </p>
      </div>

      {/* Summary Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Payments
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {adminPayments.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Transactions recorded
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Transaction Value
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            ₹{totalAmount.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total recorded payment value
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">
            Paid
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-800">
            {paidCount}
          </p>

          <p className="mt-1 text-xs text-emerald-600">
            Successfully completed
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">
            Pending
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-800">
            {pendingCount}
          </p>

          <p className="mt-1 text-xs text-amber-600">
            Awaiting payment completion
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-700">
            Failed
          </p>

          <p className="mt-2 text-3xl font-bold text-red-800">
            {failedCount}
          </p>

          <p className="mt-1 text-xs text-red-600">
            Payment attempts failed
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-purple-700">
            Refunded
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-800">
            {refundedCount}
          </p>

          <p className="mt-1 text-xs text-purple-600">
            Payments returned
          </p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Search & Filters
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Find payments using transaction, doctor,
            patient, status or date.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-3">
            <label
              htmlFor="payment-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search
            </label>

            <input
              id="payment-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search transaction, appointment, doctor or patient..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="payment-doctor-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Doctor
            </label>

            <select
              id="payment-doctor-filter"
              value={doctorFilter}
              onChange={(event) =>
                setDoctorFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">
                All Doctors
              </option>

              {doctorOptions.map((doctor) => (
                <option
                  key={doctor.id}
                  value={doctor.id}
                >
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-patient-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Patient
            </label>

            <select
              id="payment-patient-filter"
              value={patientFilter}
              onChange={(event) =>
                setPatientFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">
                All Patients
              </option>

              {patientOptions.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-status-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Status
            </label>

            <select
              id="payment-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | PaymentStatus
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="paid">
                Paid
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="refunded">
                Refunded
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-date-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Date
            </label>

            <input
              id="payment-date-filter"
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredPayments.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {adminPayments.length}
            </span>{" "}
            payments
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Payments Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Payment Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View transaction and appointment payment
              details.
            </p>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-2xl">
              ₹
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-800">
              No payments found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing or clearing your filters.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Transaction
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Doctor
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Patient
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Method
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {payment.transactionId}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Appointment: {payment.appointmentId}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {payment.doctorName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {payment.doctorId}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {payment.patientName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {payment.patientId}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        ₹
                        {payment.amount.toLocaleString("en-IN")}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {getPaymentMethodLabel(payment.method)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStatusClasses(
                          payment.status
                        )}`}
                      >
                        {getPaymentStatusLabel(payment.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(payment.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      {canViewPayments && (
                        <button
                          type="button"
                          onClick={() =>
                            handleViewPayment(payment)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {(safeCurrentPage - 1) *
                  paymentsPerPage +
                  1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(
                  safeCurrentPage *
                    paymentsPerPage,
                  filteredPayments.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {filteredPayments.length}
              </span>{" "}
              payments
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(page - 1, 1)
                  )
                }
                disabled={safeCurrentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      setCurrentPage(page)
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

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      page + 1,
                      totalPages
                    )
                  )
                }
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
      </section>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-details-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClosePayment();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Payment Details
                </p>

                <h2
                  id="payment-details-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selectedPayment.transactionId}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Created {formatDateTime(selectedPayment.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClosePayment}
                aria-label="Close payment details"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Status
                    </p>

                    <span
                      className={`mt-2 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getPaymentStatusClasses(
                        selectedPayment.status
                      )}`}
                    >
                      {getPaymentStatusLabel(selectedPayment.status)}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      ₹
                      {selectedPayment.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Transaction Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Transaction ID
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {selectedPayment.transactionId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Payment Method
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {getPaymentMethodLabel(selectedPayment.method)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Created At
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {formatDateTime(selectedPayment.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Paid At
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {selectedPayment.paidAt
                        ? formatDateTime(selectedPayment.paidAt)
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Doctor
                  </h3>

                  <p className="mt-4 text-base font-semibold text-slate-900">
                    {selectedPayment.doctorName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Doctor ID: {selectedPayment.doctorId}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Patient
                  </h3>

                  <p className="mt-4 text-base font-semibold text-slate-900">
                    {selectedPayment.patientName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Patient ID: {selectedPayment.patientId}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Appointment Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Appointment ID
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {selectedPayment.appointmentId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Appointment Date
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {formatDateTime(selectedPayment.appointmentDate)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedPayment.status === "refunded" && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                  <h3 className="text-sm font-bold text-purple-900">
                    Refund Information
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                        Refund Amount
                      </p>

                      <p className="mt-1 text-lg font-bold text-purple-900">
                        ₹
                        {(
                          selectedPayment.refundAmount ?? 0
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                        Refunded At
                      </p>

                      <p className="mt-1 text-sm text-purple-900">
                        {selectedPayment.refundedAt
                          ? formatDateTime(
                              selectedPayment.refundedAt
                            )
                          : "Not available"}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                        Refund Reason
                      </p>

                      <p className="mt-1 text-sm text-purple-900">
                        {selectedPayment.refundReason ??
                          "No refund reason provided."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={handleClosePayment}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
