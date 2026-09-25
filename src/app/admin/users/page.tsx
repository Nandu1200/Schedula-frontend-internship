"use client";

import { useEffect, useMemo, useState } from "react";
import { adminUsers } from "@/lib/mock-data/admin/users";
import SearchFilter from "@/components/admin/SearchFilter";
import StatusBadge from "@/components/admin/StatusBadge";
import Pagination from "@/components/admin/Pagination";
import Modal from "@/components/admin/Modal";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminUser, AdminUserRole } from "@/types/admin";

const ADMIN_USERS_STORAGE_KEY = "schedula_admin_users";

const formatRole = (role: AdminUser["role"]) => {
  if (role === "super-admin") {
    return "Super Admin";
  }

  if (role === "support") {
    return "Support";
  }

  return "Admin";
};

const formatCreatedDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AdminUsersPage() {
  const [allAdminUsers, setAllAdminUsers] =
    useState<AdminUser[]>(adminUsers);

  const [isStorageLoaded, setIsStorageLoaded] =
    useState(false);

  const [adminRole, setAdminRole] =
    useState<AdminUserRole | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [roleFilter, setRoleFilter] =
    useState<"all" | AdminUser["role"]>("all");

  const [statusFilter, setStatusFilter] =
    useState<"all" | AdminUser["status"]>("all");

  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 5;

  // Add Admin
  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "admin" as AdminUser["role"],
  });

  const [formError, setFormError] = useState("");

  // Edit Admin
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const [editingAdminId, setEditingAdminId] =
    useState<string | null>(null);

  const [editAdmin, setEditAdmin] = useState({
    name: "",
    email: "",
    role: "admin" as AdminUser["role"],
    status: "active" as AdminUser["status"],
  });

  const [editFormError, setEditFormError] =
    useState("");

  // View Admin
  const [isViewModalOpen, setIsViewModalOpen] =
    useState(false);

  const [selectedAdmin, setSelectedAdmin] =
    useState<AdminUser | null>(null);

  // Activate / Deactivate
  const [isStatusModalOpen, setIsStatusModalOpen] =
    useState(false);

  const [statusChangeAdmin, setStatusChangeAdmin] =
    useState<AdminUser | null>(null);

  // Load current admin role and saved admin users from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("admin_role");

    if (
      storedRole === "super-admin" ||
      storedRole === "admin" ||
      storedRole === "support"
    ) {
      setAdminRole(storedRole);
    }

    try {
      const storedUsers = localStorage.getItem(
        ADMIN_USERS_STORAGE_KEY
      );

      if (storedUsers) {
        const parsedUsers: AdminUser[] =
          JSON.parse(storedUsers);

        setAllAdminUsers(parsedUsers);
      }
    } catch {
      setAllAdminUsers(adminUsers);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  // Save admin users to localStorage
  useEffect(() => {
    if (!isStorageLoaded) {
      return;
    }

    localStorage.setItem(
      ADMIN_USERS_STORAGE_KEY,
      JSON.stringify(allAdminUsers)
    );
  }, [allAdminUsers, isStorageLoaded]);

  const filteredAdminUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allAdminUsers.filter((admin) => {
      const matchesSearch =
        !search ||
        admin.name.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search);

      const matchesRole =
        roleFilter === "all" ||
        admin.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        admin.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    allAdminUsers,
    searchTerm,
    roleFilter,
    statusFilter,
  ]);

  const totalPages = Math.ceil(
    filteredAdminUsers.length / usersPerPage
  );

  const paginatedAdminUsers = useMemo(() => {
    const startIndex =
      (currentPage - 1) * usersPerPage;

    return filteredAdminUsers.slice(
      startIndex,
      startIndex + usersPerPage
    );
  }, [
    filteredAdminUsers,
    currentPage,
  ]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(
      value as "all" | AdminUser["role"]
    );
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(
      value as "all" | AdminUser["status"]
    );
    setCurrentPage(1);
  };

  // Add Admin
  const handleOpenAddModal = () => {
    setNewAdmin({
      name: "",
      email: "",
      role: "admin",
    });

    setFormError("");
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setFormError("");
  };

  const handleAddAdmin = () => {
    const name = newAdmin.name.trim();
    const email = newAdmin.email.trim().toLowerCase();

    if (!name || !email) {
      setFormError(
        "Name and email are required."
      );
      return;
    }

    const emailExists = allAdminUsers.some(
      (admin) =>
        admin.email.toLowerCase() === email
    );

    if (emailExists) {
      setFormError(
        "An admin with this email already exists."
      );
      return;
    }

    const createdAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      name,
      email,
      role: newAdmin.role,
      status: "active",
      createdAt: new Date()
        .toISOString()
        .split("T")[0],
    };

    setAllAdminUsers((currentUsers) => [
      ...currentUsers,
      createdAdmin,
    ]);

    setCurrentPage(1);
    setIsAddModalOpen(false);
    setFormError("");
  };

  // Edit Admin
  const handleOpenEditModal = (
    admin: AdminUser
  ) => {
    setEditingAdminId(admin.id);

    setEditAdmin({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    });

    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAdminId(null);
    setEditFormError("");
  };

  const handleEditAdmin = () => {
    if (!editingAdminId) {
      return;
    }

    const name = editAdmin.name.trim();
    const email = editAdmin.email.trim().toLowerCase();

    if (!name || !email) {
      setEditFormError(
        "Name and email are required."
      );
      return;
    }

    const emailExists = allAdminUsers.some(
      (admin) =>
        admin.id !== editingAdminId &&
        admin.email.toLowerCase() === email
    );

    if (emailExists) {
      setEditFormError(
        "Another admin already uses this email."
      );
      return;
    }

    setAllAdminUsers((currentUsers) =>
      currentUsers.map((admin) => {
        if (admin.id !== editingAdminId) {
          return admin;
        }

        return {
          ...admin,
          name,
          email,
          role: editAdmin.role,
          status: editAdmin.status,
        };
      })
    );

    setIsEditModalOpen(false);
    setEditingAdminId(null);
    setEditFormError("");
  };

  // View Admin
  const handleOpenViewModal = (
    admin: AdminUser
  ) => {
    setSelectedAdmin(admin);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAdmin(null);
  };

  // Activate / Deactivate
  const handleOpenStatusModal = (
    admin: AdminUser
  ) => {
    setStatusChangeAdmin(admin);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setStatusChangeAdmin(null);
  };

  const handleConfirmStatusChange = () => {
    if (!statusChangeAdmin) {
      return;
    }

    const nextStatus =
      statusChangeAdmin.status === "active"
        ? "inactive"
        : "active";

    setAllAdminUsers((currentUsers) =>
      currentUsers.map((admin) => {
        if (admin.id !== statusChangeAdmin.id) {
          return admin;
        }

        return {
          ...admin,
          status: nextStatus,
        };
      })
    );

    handleCloseStatusModal();
  };

  const canCreateAdmin =
    adminRole !== null &&
    hasPermission(adminRole, "admin-users", "create");

  const canEditAdmin =
    adminRole !== null &&
    hasPermission(adminRole, "admin-users", "edit");

  const canDeleteAdmin =
    adminRole !== null &&
    hasPermission(adminRole, "admin-users", "delete");

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Admin Users
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Manage administrators who have access to
              the Schedula platform.
            </p>
          </div>

          {canCreateAdmin && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              + Add Admin
            </button>
          )}
        </div>
      </div>

      {/* Admin Users Management */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Management Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Admin User Management
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredAdminUsers.length} of{" "}
                {allAdminUsers.length} admin{" "}
                {allAdminUsers.length !== 1
                  ? "users"
                  : "user"}
                .
              </p>
            </div>

            {/* Search + Role Filter */}
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={handleSearchChange}
              placeholder="Search name or email..."
              filterLabel="Role"
              filterValue={roleFilter}
              onFilterChange={handleRoleChange}
              filterOptions={[
                {
                  label: "All Roles",
                  value: "all",
                },
                {
                  label: "Super Admin",
                  value: "super-admin",
                },
                {
                  label: "Admin",
                  value: "admin",
                },
                {
                  label: "Support",
                  value: "support",
                },
              ]}
            />

            {/* Status Filter */}
            <div className="flex flex-col gap-2 sm:w-64">
              <label
                htmlFor="admin-status-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  handleStatusChange(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Admin Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Admin
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedAdminUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      No admin users found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or
                      filters.
                    </p>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedAdminUsers.map((admin) => (
                  <tr
                    key={admin.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    {/* Admin */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {admin.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {admin.email}
                        </p>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {formatRole(admin.role)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={admin.status}
                      />
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatCreatedDate(
                        admin.createdAt
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenViewModal(admin)
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          View
                        </button>

                        {canEditAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditModal(admin)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            Edit
                          </button>
                        )}

                        {canDeleteAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenStatusModal(admin)
                            }
                            className={
                              admin.status === "active"
                                ? "rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                : "rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            }
                          >
                            {admin.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-200 px-6 py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Add Admin Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Add Admin User"
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="admin-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full Name
            </label>

            <input
              id="admin-name"
              type="text"
              value={newAdmin.name}
              onChange={(event) =>
                setNewAdmin((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Enter admin name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="admin-email"
              type="email"
              value={newAdmin.email}
              onChange={(event) =>
                setNewAdmin((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Enter admin email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="admin-role"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Role
            </label>

            <select
              id="admin-role"
              value={newAdmin.role}
              onChange={(event) =>
                setNewAdmin((current) => ({
                  ...current,
                  role: event.target.value as AdminUser["role"],
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              <option value="admin">
                Admin
              </option>

              <option value="super-admin">
                Super Admin
              </option>

              <option value="support">
                Support
              </option>
            </select>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">
                {formError}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={handleCloseAddModal}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAddAdmin}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Add Admin
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Admin User"
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="edit-admin-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full Name
            </label>

            <input
              id="edit-admin-name"
              type="text"
              value={editAdmin.name}
              onChange={(event) =>
                setEditAdmin((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Enter admin name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="edit-admin-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="edit-admin-email"
              type="email"
              value={editAdmin.email}
              onChange={(event) =>
                setEditAdmin((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Enter admin email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="edit-admin-role"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Role
            </label>

            <select
              id="edit-admin-role"
              value={editAdmin.role}
              onChange={(event) =>
                setEditAdmin((current) => ({
                  ...current,
                  role: event.target.value as AdminUser["role"],
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              <option value="admin">
                Admin
              </option>

              <option value="super-admin">
                Super Admin
              </option>

              <option value="support">
                Support
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-admin-status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Status
            </label>

            <select
              id="edit-admin-status"
              value={editAdmin.status}
              onChange={(event) =>
                setEditAdmin((current) => ({
                  ...current,
                  status: event.target.value as AdminUser["status"],
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          {editFormError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">
                {editFormError}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={handleCloseEditModal}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleEditAdmin}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* View Admin Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Admin User Details"
        size="md"
      >
        {selectedAdmin && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                {selectedAdmin.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {selectedAdmin.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedAdmin.email}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Admin ID
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {selectedAdmin.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Name
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {selectedAdmin.name}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Email
                </span>

                <span className="break-all text-right text-sm font-semibold text-slate-900">
                  {selectedAdmin.email}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Role
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {formatRole(selectedAdmin.role)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Status
                </span>

                <StatusBadge
                  status={selectedAdmin.status}
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-slate-500">
                  Created
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {formatCreatedDate(
                    selectedAdmin.createdAt
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Activate / Deactivate Confirmation */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        title={
          statusChangeAdmin?.status === "active"
            ? "Deactivate Admin"
            : "Activate Admin"
        }
        size="sm"
      >
        {statusChangeAdmin && (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                {statusChangeAdmin.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {statusChangeAdmin.email}
              </p>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              {statusChangeAdmin.status === "active"
                ? "Are you sure you want to deactivate this admin? They will no longer be able to access the admin portal."
                : "Are you sure you want to activate this admin? They will regain access to the admin portal."}
            </p>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={handleCloseStatusModal}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={
                  statusChangeAdmin.status === "active"
                    ? "rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    : "rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                }
              >
                {statusChangeAdmin.status === "active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}