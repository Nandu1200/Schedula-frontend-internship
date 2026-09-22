"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getAdminNotificationHistory,
  getAdminNotificationRecipients,
  sendAdminNotification,
} from "@/lib/utils/admin-notifications";
import type {
  AdminNotificationAudience,
  AdminNotificationHistory,
  AdminNotificationRecipient,
} from "@/types/adminNotification";
import type { NotificationType } from "@/lib/utils/notifications";

type RecipientRoleFilter = "all" | "patient" | "doctor";

const notificationTypes: NotificationType[] = [
  "booking",
  "confirmation",
  "reschedule",
  "cancellation",
  "reminder",
  "missed",
  "completed",
  "prescription",
];

const audienceLabels: Record<AdminNotificationAudience, string> = {
  "all-patients": "All Patients",
  "all-doctors": "All Doctors",
  "selected-users": "Selected Users",
};

const roleLabels: Record<AdminNotificationRecipient["role"], string> = {
  patient: "Patient",
  doctor: "Doctor",
};

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

const getNotificationTypeLabel = (value: NotificationType) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getHistoryStatusClasses = (
  status: AdminNotificationHistory["status"]
) => {
  return status === "sent"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";
};

export default function AdminNotificationsPage() {
  const [history, setHistory] = useState<AdminNotificationHistory[]>([]);
  const [patients, setPatients] = useState<AdminNotificationRecipient[]>([]);
  const [doctors, setDoctors] = useState<AdminNotificationRecipient[]>([]);

  const [audience, setAudience] =
    useState<AdminNotificationAudience>("all-patients");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("reminder");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);

  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientRoleFilter, setRecipientRoleFilter] =
    useState<RecipientRoleFilter>("all");
  const [historySearch, setHistorySearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadNotificationData = () => {
    setLoading(true);
    setError("");

    try {
      const recipientData = getAdminNotificationRecipients();

      setPatients(recipientData.patients);
      setDoctors(recipientData.doctors);
      setHistory(getAdminNotificationHistory());
    } catch {
      setPatients([]);
      setDoctors([]);
      setHistory([]);
      setError("Unable to load notification data right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationData();

    const handleNotificationUpdate = () => {
      loadNotificationData();
    };

    window.addEventListener(
      "admin-notifications-updated",
      handleNotificationUpdate
    );
    window.addEventListener("storage", handleNotificationUpdate);

    return () => {
      window.removeEventListener(
        "admin-notifications-updated",
        handleNotificationUpdate
      );
      window.removeEventListener("storage", handleNotificationUpdate);
    };
  }, []);

  const allRecipients = useMemo(
    () => [...patients, ...doctors],
    [patients, doctors]
  );

  const selectedRecipients = useMemo(() => {
    return allRecipients.filter((recipient) =>
      selectedRecipientIds.includes(recipient.id)
    );
  }, [allRecipients, selectedRecipientIds]);

  const filteredRecipients = useMemo(() => {
    const search = recipientSearch.trim().toLowerCase();

    return allRecipients
      .filter((recipient) => {
        const matchesSearch =
          !search || recipient.name.toLowerCase().includes(search);
        const matchesRole =
          recipientRoleFilter === "all" ||
          recipient.role === recipientRoleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [allRecipients, recipientSearch, recipientRoleFilter]);

  const filteredHistory = useMemo(() => {
    const search = historySearch.trim().toLowerCase();

    if (!search) {
      return history;
    }

    return history.filter((item) => {
      return (
        item.title.toLowerCase().includes(search) ||
        item.message.toLowerCase().includes(search) ||
        audienceLabels[item.audience].toLowerCase().includes(search) ||
        item.recipients.some((recipient) =>
          recipient.name.toLowerCase().includes(search)
        )
      );
    });
  }, [history, historySearch]);

  const totalSent = history.filter((item) => item.status === "sent").length;
  const totalFailed = history.filter((item) => item.status === "failed").length;
  const totalRecipients = history
    .filter((item) => item.status === "sent")
    .reduce((sum, item) => sum + item.recipientCount, 0);

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipientIds((current) => {
      if (current.includes(recipientId)) {
        return current.filter((id) => id !== recipientId);
      }

      return [...current, recipientId];
    });
  };

  const selectFilteredRecipients = () => {
    setSelectedRecipientIds((current) => {
      const next = new Set(current);

      filteredRecipients.forEach((recipient) => {
        next.add(recipient.id);
      });

      return Array.from(next);
    });
  };

  const clearSelectedRecipients = () => {
    setSelectedRecipientIds([]);
  };

  const clearForm = () => {
    setTitle("");
    setMessage("");
    setAudience("all-patients");
    setNotificationType("reminder");
    setSelectedRecipientIds([]);
    setRecipientSearch("");
    setRecipientRoleFilter("all");
    setError("");
    setSuccessMessage("");
  };

  const handleSendNotification = () => {
    setSending(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = sendAdminNotification({
        title,
        message,
        type: notificationType,
        audience,
        recipients:
          audience === "selected-users" ? selectedRecipients : undefined,
      });

      setHistory(getAdminNotificationHistory());
      setSuccessMessage(
        `Notification sent successfully to ${result.recipientCount} recipient${
          result.recipientCount === 1 ? "" : "s"
        }.`
      );

      setTitle("");
      setMessage("");
      setSelectedRecipientIds([]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send notification."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">Admin Portal</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Notifications
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Send system notifications to patients and doctors and review notification history.
        </p>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Notifications Sent</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalSent}</p>
          <p className="mt-1 text-xs text-slate-500">Successful send operations</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Recipients Reached</p>
          <p className="mt-2 text-3xl font-bold text-blue-800">{totalRecipients}</p>
          <p className="mt-1 text-xs text-blue-700">Recipient deliveries recorded</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-700">Failed Sends</p>
          <p className="mt-2 text-3xl font-bold text-red-800">{totalFailed}</p>
          <p className="mt-1 text-xs text-red-700">Send operations that failed</p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Send Notification</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose recipients and send a notification through the existing Schedula notification system.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="notification-title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Title
            </label>
            <input
              id="notification-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter notification title..."
              maxLength={100}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="notification-type"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Notification Type
            </label>
            <select
              id="notification-type"
              value={notificationType}
              onChange={(event) =>
                setNotificationType(event.target.value as NotificationType)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {notificationTypes.map((type) => (
                <option key={type} value={type}>
                  {getNotificationTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="notification-message"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Message
            </label>
            <textarea
              id="notification-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the notification message..."
              rows={5}
              maxLength={500}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Recipients</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["all-patients", "All Patients"],
                ["all-doctors", "All Doctors"],
                ["selected-users", "Selected Users"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAudience(value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  audience === value
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
                }`}
              >
                {label}
                {value === "all-patients" && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {patients.length} available
                  </span>
                )}
                {value === "all-doctors" && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {doctors.length} available
                  </span>
                )}
                {value === "selected-users" && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {selectedRecipientIds.length} selected
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {audience === "selected-users" && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label
                  htmlFor="recipient-search"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Search Users
                </label>
                <input
                  id="recipient-search"
                  type="search"
                  value={recipientSearch}
                  onChange={(event) => setRecipientSearch(event.target.value)}
                  placeholder="Search patient or doctor..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="sm:w-44">
                <label
                  htmlFor="recipient-role-filter"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Role
                </label>
                <select
                  id="recipient-role-filter"
                  value={recipientRoleFilter}
                  onChange={(event) =>
                    setRecipientRoleFilter(
                      event.target.value as RecipientRoleFilter
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="all">All Users</option>
                  <option value="patient">Patients</option>
                  <option value="doctor">Doctors</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectFilteredRecipients}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Select Filtered
              </button>
              <button
                type="button"
                onClick={clearSelectedRecipients}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear Selection
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  Loading users...
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No users match the current filter.
                </div>
              ) : (
                filteredRecipients.map((recipient) => {
                  const selected = selectedRecipientIds.includes(recipient.id);

                  return (
                    <label
                      key={`${recipient.role}-${recipient.id}`}
                      className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {recipient.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {roleLabels[recipient.role]} · {recipient.id}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500">
              {selectedRecipientIds.length} user
              {selectedRecipientIds.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Notifications are delivered to the selected users through the existing notification store.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={clearForm}
              disabled={sending}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSendNotification}
              disabled={
                sending ||
                !title.trim() ||
                !message.trim() ||
                (audience === "selected-users" &&
                  selectedRecipientIds.length === 0)
              }
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Notification History</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review previous admin notification send operations.
              </p>
            </div>

            <div className="lg:w-80">
              <label
                htmlFor="history-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search History
              </label>
              <input
                id="history-search"
                type="search"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search title, message or recipient..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm font-medium text-slate-500">
            Loading notification history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-2xl">
              🔔
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-800">
              No notification history
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Sent notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notification
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Audience
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recipients
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-slate-50">
                    <td className="max-w-sm px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {item.message}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {audienceLabels[item.audience]}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.recipientCount} recipient{item.recipientCount === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {item.recipients.map((recipient) => recipient.name).join(", ")}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {getNotificationTypeLabel(item.type)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDateTime(item.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getHistoryStatusClasses(
                          item.status
                        )}`}
                      >
                        {item.status === "sent" ? "Sent" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
