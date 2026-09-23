import { patients as mockPatients } from "@/lib/mock-data/patients";
import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import {
  addNotification,
  type Notification,
} from "@/lib/utils/notifications";
import type {
  AdminNotificationHistory,
  AdminNotificationRecipient,
  AdminNotificationRecipientRole,
  AdminNotificationSendInput,
} from "@/types/adminNotification";

const ADMIN_NOTIFICATION_HISTORY_KEY =
  "adminNotificationHistory";

const getStoredUser = (
  storageKey: "registeredPatient" | "loggedInPatient" | "registeredDoctor" | "loggedInDoctor"
) => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem(storageKey);

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as {
      id?: unknown;
      name?: unknown;
    };

    if (
      typeof parsedUser.id !== "string" ||
      typeof parsedUser.name !== "string"
    ) {
      return null;
    }

    return {
      id: parsedUser.id,
      name: parsedUser.name,
    };
  } catch {
    return null;
  }
};

const mergeRecipients = (
  recipients: AdminNotificationRecipient[]
) => {
  const uniqueRecipients = new Map<
    string,
    AdminNotificationRecipient
  >();

  recipients.forEach((recipient) => {
    const id = recipient.id.trim();

    if (!id) {
      return;
    }

    if (!uniqueRecipients.has(id)) {
      uniqueRecipients.set(id, {
        id,
        name: recipient.name.trim() || "Unknown user",
        role: recipient.role,
      });
    }
  });

  return Array.from(uniqueRecipients.values()).sort(
    (first, second) =>
      first.name.localeCompare(second.name)
  );
};

export const getAdminNotificationRecipients = () => {
  const patients: AdminNotificationRecipient[] =
    mockPatients
      .filter(
        (patient) =>
          typeof patient.id === "string" &&
          typeof patient.name === "string"
      )
      .map((patient) => ({
        id: patient.id,
        name: patient.name,
        role: "patient" as const,
      }));

  const doctors: AdminNotificationRecipient[] =
    mockDoctors
      .filter(
        (doctor) =>
          typeof doctor.id === "string" &&
          typeof doctor.name === "string"
      )
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        role: "doctor" as const,
      }));

  const registeredPatient = getStoredUser(
    "registeredPatient"
  );
  const loggedInPatient = getStoredUser(
    "loggedInPatient"
  );
  const registeredDoctor = getStoredUser(
    "registeredDoctor"
  );
  const loggedInDoctor = getStoredUser(
    "loggedInDoctor"
  );

  if (registeredPatient) {
    patients.push({
      ...registeredPatient,
      role: "patient",
    });
  }

  if (loggedInPatient) {
    patients.push({
      ...loggedInPatient,
      role: "patient",
    });
  }

  if (registeredDoctor) {
    doctors.push({
      ...registeredDoctor,
      role: "doctor",
    });
  }

  if (loggedInDoctor) {
    doctors.push({
      ...loggedInDoctor,
      role: "doctor",
    });
  }

  return {
    patients: mergeRecipients(patients),
    doctors: mergeRecipients(doctors),
  };
};

export const getAdminNotificationHistory = (): AdminNotificationHistory[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedHistory = localStorage.getItem(
    ADMIN_NOTIFICATION_HISTORY_KEY
  );

  if (!storedHistory) {
    return [];
  }

  try {
    const parsedHistory = JSON.parse(
      storedHistory
    ) as AdminNotificationHistory[];

    if (!Array.isArray(parsedHistory)) {
      return [];
    }

    return parsedHistory
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          Array.isArray(item.recipients)
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );
  } catch {
    return [];
  }
};

const saveAdminNotificationHistory = (
  history: AdminNotificationHistory[]
) => {
  localStorage.setItem(
    ADMIN_NOTIFICATION_HISTORY_KEY,
    JSON.stringify(history)
  );
};

const getAudienceRecipients = (
  input: AdminNotificationSendInput
) => {
  const availableRecipients =
    getAdminNotificationRecipients();

  if (input.audience === "all-patients") {
    return availableRecipients.patients;
  }

  if (input.audience === "all-doctors") {
    return availableRecipients.doctors;
  }

  return mergeRecipients(input.recipients ?? []);
};

export const sendAdminNotification = (
  input: AdminNotificationSendInput
): AdminNotificationHistory => {
  if (typeof window === "undefined") {
    throw new Error(
      "Notifications can only be sent in the browser."
    );
  }

  const title = input.title.trim();
  const message = input.message.trim();

  if (!title) {
    throw new Error("Notification title is required.");
  }

  if (!message) {
    throw new Error("Notification message is required.");
  }

  const recipients = getAudienceRecipients(input);

  if (recipients.length === 0) {
    throw new Error(
      "At least one notification recipient is required."
    );
  }

  const notificationType =
    input.type ?? ("reminder" as Notification["type"]);

  const createdAt = new Date().toISOString();
  const historyId = `admin-notification-${Date.now()}`;

  try {
    recipients.forEach((recipient, index) => {
      const notification: Notification = {
        id: `${historyId}-${recipient.role}-${recipient.id}-${index}`,
        userId: recipient.id,
        type: notificationType,
        title,
        message,
        appointmentId: input.appointmentId,
        createdAt,
        read: false,
      };

      addNotification(notification);
    });

    const historyRecord: AdminNotificationHistory = {
      id: historyId,
      title,
      message,
      type: notificationType,
      audience: input.audience,
      recipients,
      recipientCount: recipients.length,
      createdAt,
      status: "sent",
    };

    const existingHistory = getAdminNotificationHistory();

    saveAdminNotificationHistory([
      historyRecord,
      ...existingHistory,
    ]);

    window.dispatchEvent(
      new Event("admin-notifications-updated")
    );

    return historyRecord;
  } catch (error) {
    const failedHistory: AdminNotificationHistory = {
      id: historyId,
      title,
      message,
      type: notificationType,
      audience: input.audience,
      recipients,
      recipientCount: recipients.length,
      createdAt,
      status: "failed",
    };

    const existingHistory = getAdminNotificationHistory();

    saveAdminNotificationHistory([
      failedHistory,
      ...existingHistory,
    ]);

    window.dispatchEvent(
      new Event("admin-notifications-updated")
    );

    throw error instanceof Error
      ? error
      : new Error("Unable to send notification.");
  }
};
