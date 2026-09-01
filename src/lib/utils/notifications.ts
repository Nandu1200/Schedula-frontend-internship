export type NotificationType =
  | "booking"
  | "confirmation"
  | "reschedule"
  | "cancellation"
  | "reminder"
  | "missed"
  | "completed"
  | "prescription";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
  createdAt: string;
  read: boolean;
};

const NOTIFICATIONS_STORAGE_KEY = "notifications";

export const getNotifications = (): Notification[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedNotifications = localStorage.getItem(
    NOTIFICATIONS_STORAGE_KEY
  );

  if (!storedNotifications) {
    return [];
  }

  try {
    const notifications = JSON.parse(
      storedNotifications
    ) as Notification[];

    return Array.isArray(notifications)
      ? notifications
      : [];
  } catch {
    return [];
  }
};

export const addNotification = (
  notification: Notification
) => {
  if (typeof window === "undefined") {
    return;
  }

  const existingNotifications = getNotifications();

  const updatedNotifications = [
    notification,
    ...existingNotifications,
  ];

  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notifications-updated")
  );
};

export const markNotificationAsRead = (
  notificationId: string
) => {
  if (typeof window === "undefined") {
    return;
  }

  const notifications = getNotifications();

  const updatedNotifications = notifications.map(
    (notification) =>
      notification.id === notificationId
        ? {
            ...notification,
            read: true,
          }
        : notification
  );

  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notifications-updated")
  );
};

export const markAllNotificationsAsRead = (
  userId: string
) => {
  if (typeof window === "undefined") {
    return;
  }

  const notifications = getNotifications();

  const updatedNotifications = notifications.map(
    (notification) =>
      notification.userId === userId
        ? {
            ...notification,
            read: true,
          }
        : notification
  );

  localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(updatedNotifications)
  );

  window.dispatchEvent(
    new Event("notifications-updated")
  );
};

export const getUnreadNotificationCount = (
  userId: string
) => {
  const notifications = getNotifications();

  return notifications.filter(
    (notification) =>
      notification.userId === userId &&
      !notification.read
  ).length;
};