import type { AuditLog } from "@/types/audit-log";

export const AUDIT_LOGS_STORAGE_KEY = "auditLogs";

export type NewAuditLog = Omit<AuditLog, "id" | "timestamp">;

const createAuditLogId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `audit-${crypto.randomUUID()}`;
  }

  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const readStoredAuditLogs = (): AuditLog[] => {
  try {
    const storedLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);

    if (!storedLogs) {
      return [];
    }

    const parsedLogs = JSON.parse(storedLogs) as unknown;

    return Array.isArray(parsedLogs)
      ? (parsedLogs as AuditLog[])
      : [];
  } catch {
    return [];
  }
};

export const addAuditLog = (log: NewAuditLog) => {
  const nextLog: AuditLog = {
    ...log,
    id: createAuditLogId(),
    timestamp: new Date().toISOString(),
  };

  const updatedLogs = [nextLog, ...readStoredAuditLogs()];

  localStorage.setItem(
    AUDIT_LOGS_STORAGE_KEY,
    JSON.stringify(updatedLogs)
  );

  window.dispatchEvent(new Event("audit-logs-updated"));

  return nextLog;
};
