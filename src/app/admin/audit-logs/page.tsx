"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { auditLogs } from "@/lib/mock-data/audit-logs";
import type { AuditLog } from "@/types/audit-log";
import { readStoredAuditLogs } from "@/lib/utils/audit-logs";

const PAGE_SIZE = 5;

const formatAction = (action: AuditLog["action"]) => {
  return action
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatEntityType = (entityType: AuditLog["entityType"]) => {
  return entityType
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getRoleClasses = (role: AuditLog["actorRole"]) => {
  if (role === "admin") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
};

const getActionClasses = (action: AuditLog["action"]) => {
  if (
    action === "doctor-approved" ||
    action === "doctor-activated" ||
    action === "appointment-confirmed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    action === "doctor-rejected" ||
    action === "doctor-deactivated" ||
    action === "appointment-cancelled"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (action === "payment-refunded") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
};

const actionOptions: AuditLog["action"][] = [
  "doctor-approved",
  "doctor-rejected",
  "doctor-activated",
  "doctor-deactivated",
  "appointment-cancelled",
  "appointment-confirmed",
  "payment-refunded",
  "patient-updated",
  "profile-updated",
];

const sortLogs = (logs: AuditLog[]) => {
  return [...logs].sort(
    (first, second) =>
      new Date(second.timestamp).getTime() -
      new Date(first.timestamp).getTime()
  );
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | AuditLog["action"]>(
    "all"
  );
  const [userFilter, setUserFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = useCallback(() => {
    setIsLoading(true);
    setError(null);

    window.setTimeout(() => {
      try {
        if (!Array.isArray(auditLogs)) {
          throw new Error("Audit logs data is unavailable.");
        }

        const storedLogs = readStoredAuditLogs();
        const mergedLogs = new Map<string, AuditLog>();

        [...auditLogs, ...storedLogs].forEach((log) => {
          mergedLogs.set(log.id, log);
        });

        setLogs(sortLogs(Array.from(mergedLogs.values())));
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load audit logs.";

        setError(message);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }, []);

  useEffect(() => {
    loadLogs();

    const handleAuditLogUpdate = () => {
      loadLogs();
    };

    window.addEventListener(
      "audit-logs-updated",
      handleAuditLogUpdate
    );

    window.addEventListener(
      "storage",
      handleAuditLogUpdate
    );

    return () => {
      window.removeEventListener(
        "audit-logs-updated",
        handleAuditLogUpdate
      );

      window.removeEventListener(
        "storage",
        handleAuditLogUpdate
      );
    };
  }, [loadLogs]);

  const users = useMemo(
    () =>
      [...new Set(logs.map((log) => log.actorName))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      if (normalizedQuery) {
        const searchableText = [
          log.actorName,
          log.action,
          formatAction(log.action),
          log.affectedEntity,
          log.entityType,
          formatEntityType(log.entityType),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(normalizedQuery)) {
          return false;
        }
      }

      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }

      if (userFilter !== "all" && log.actorName !== userFilter) {
        return false;
      }

      const logDate = log.timestamp.slice(0, 10);

      if (fromDate && logDate < fromDate) {
        return false;
      }

      if (toDate && logDate > toDate) {
        return false;
      }

      return true;
    });
  }, [actionFilter, fromDate, logs, searchQuery, toDate, userFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredLogs]);

  const clearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setUserFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleActionChange = (value: "all" | AuditLog["action"]) => {
    setActionFilter(value);
    setCurrentPage(1);
  };

  const handleUserChange = (value: string) => {
    setUserFilter(value);
    setCurrentPage(1);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setCurrentPage(1);

    if (toDate && value && value > toDate) {
      setToDate(value);
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      actionFilter !== "all" ||
      userFilter !== "all" ||
      fromDate ||
      toDate
  );

  const firstVisibleEntry =
    filteredLogs.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisibleEntry = Math.min(currentPage * PAGE_SIZE, filteredLogs.length);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-600">Admin Portal</p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Audit Logs
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Track important admin and user actions performed across Schedula.
          </p>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Search & Filters
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter audit activity by keyword, action, user, or date range.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-start rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label
                htmlFor="audit-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>
              <input
                id="audit-search"
                type="search"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search user, action, or entity..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="audit-action"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Action
              </label>
              <select
                id="audit-action"
                value={actionFilter}
                onChange={(event) =>
                  handleActionChange(
                    event.target.value as "all" | AuditLog["action"]
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {formatAction(action)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-user"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                User
              </label>
              <select
                id="audit-user"
                value={userFilter}
                onChange={(event) => handleUserChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All users</option>
                {users.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-from-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                From Date
              </label>
              <input
                id="audit-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => handleFromDateChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="audit-to-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                To Date
              </label>
              <input
                id="audit-to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => handleToDateChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        {/* Log Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Activity History</h2>

              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading audit activity..."
                  : `${filteredLogs.length} audit ${
                      filteredLogs.length === 1 ? "entry" : "entries"
                    } matching your filters.`}
              </p>
            </div>

            {!isLoading && !error && filteredLogs.length > 0 && (
              <p className="text-sm text-slate-500">
                Showing {firstVisibleEntry}-{lastVisibleEntry} of {filteredLogs.length}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="px-6 py-16 text-center" role="status" aria-live="polite">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Loading audit logs
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while the activity history is loaded.
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center" role="alert">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 4.9 2.8 18a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.7 4.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Unable to load audit logs
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={loadLogs}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19a8.5 8.5 0 1 1 6.01-2.49L21 21"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 8.5h5M8 12h3"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No audit logs found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Try changing your search text or filters to see matching activity.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        User
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Role
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Affected Entity
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Entity Type
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date & Time
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{log.actorName}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getRoleClasses(
                              log.actorRole
                            )}`}
                          >
                            {log.actorRole}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getActionClasses(
                              log.action
                            )}`}
                          >
                            {formatAction(log.action)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">
                            {log.affectedEntity}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {formatEntityType(log.entityType)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDateTime(log.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            aria-current={page === currentPage ? "page" : undefined}
                            className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              page === currentPage
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
