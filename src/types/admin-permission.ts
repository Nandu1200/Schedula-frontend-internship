export type AdminPermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve-reject";

export type AdminPermission = {
  module: string;
  actions: AdminPermissionAction[];
};