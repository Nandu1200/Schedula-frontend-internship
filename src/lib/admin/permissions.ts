import type { AdminPermission } from "@/types/admin-permission";
import type { AdminUserRole } from "@/types/admin";

export const rolePermissions: Record<AdminUserRole, AdminPermission[]> = {
  "super-admin": [
    { module: "dashboard", actions: ["view"] },
    { module: "doctors", actions: ["view", "create", "edit", "delete"] },
    { module: "doctor-verification", actions: ["view", "approve-reject"] },
    { module: "patients", actions: ["view", "create", "edit", "delete"] },
    { module: "appointments", actions: ["view", "create", "edit", "delete"] },
    { module: "payments", actions: ["view", "edit"] },
    { module: "reviews", actions: ["view", "edit", "delete"] },
    {
      module: "notifications",
      actions: ["view", "create", "edit", "delete"],
    },
    { module: "reports", actions: ["view"] },
    { module: "audit-logs", actions: ["view"] },
    { module: "admin-users", actions: ["view", "create", "edit", "delete"] },
    { module: "settings", actions: ["view", "edit"] },
  ],

  admin: [
    { module: "dashboard", actions: ["view"] },
    { module: "doctors", actions: ["view", "create", "edit"] },
    { module: "doctor-verification", actions: ["view", "approve-reject"] },
    { module: "patients", actions: ["view", "create", "edit"] },
    { module: "appointments", actions: ["view", "create", "edit"] },
    { module: "payments", actions: ["view", "edit"] },
    { module: "reviews", actions: ["view", "edit"] },
    { module: "notifications", actions: ["view", "create", "edit"] },
    { module: "reports", actions: ["view"] },
    { module: "audit-logs", actions: ["view"] },
    { module: "admin-users", actions: ["view"] },
    { module: "settings", actions: ["view", "edit"] },
  ],

  support: [
    { module: "dashboard", actions: ["view"] },
    { module: "doctors", actions: ["view"] },
    { module: "doctor-verification", actions: ["view"] },
    { module: "patients", actions: ["view", "edit"] },
    { module: "appointments", actions: ["view", "edit"] },
    { module: "payments", actions: ["view"] },
    { module: "reviews", actions: ["view"] },
    { module: "notifications", actions: ["view"] },
    { module: "reports", actions: ["view"] },
    { module: "audit-logs", actions: ["view"] },
    { module: "settings", actions: ["view", "edit"] },
  ],
};

export function hasPermission(
  role: AdminUserRole,
  module: string,
  action: AdminPermission["actions"][number]
): boolean {
  const permissions = rolePermissions[role];

  const modulePermission = permissions.find(
    (permission) => permission.module === module
  );

  return modulePermission?.actions.includes(action) ?? false;
}

export function hasModuleAccess(
  role: AdminUserRole,
  module: string
): boolean {
  return hasPermission(role, module, "view");
}