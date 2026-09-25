import type { Notification } from "@/lib/utils/notifications";

export type AdminNotificationAudience =
  | "all-patients"
  | "all-doctors"
  | "selected-users";

export type AdminNotificationRecipientRole =
  | "patient"
  | "doctor";

export type AdminNotificationRecipient = {
  id: string;
  name: string;
  role: AdminNotificationRecipientRole;
};

export type AdminNotificationSendInput = {
  title: string;
  message: string;
  type?: Notification["type"];
  appointmentId?: string;
  audience: AdminNotificationAudience;
  recipients?: AdminNotificationRecipient[];
};

export type AdminNotificationHistoryStatus =
  | "sent"
  | "failed";

export type AdminNotificationHistory = {
  id: string;
  title: string;
  message: string;
  type: Notification["type"];
  audience: AdminNotificationAudience;
  recipients: AdminNotificationRecipient[];
  recipientCount: number;
  createdAt: string;
  status: AdminNotificationHistoryStatus;
};
