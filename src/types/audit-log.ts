export type AuditLogActorRole = "admin" | "user";

export type AuditLogAction =
  | "doctor-approved"
  | "doctor-rejected"
  | "doctor-activated"
  | "doctor-deactivated"
  | "appointment-cancelled"
  | "appointment-confirmed"
  | "payment-refunded"
  | "patient-updated"
  | "profile-updated";

export type AuditLogEntityType =
  | "doctor"
  | "appointment"
  | "payment"
  | "patient"
  | "user"
  | "system";

export type AuditLog = {
  id: string;
  actorName: string;
  actorRole: AuditLogActorRole;
  action: AuditLogAction;
  affectedEntity: string;
  entityType: AuditLogEntityType;
  timestamp: string;
};
