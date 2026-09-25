import type { AdminUser } from "@/types/admin";

export const adminUsers: AdminUser[] = [
  {
    id: "admin-001",
    name: "Naren Singh",
    email: "naren.admin@schedula.com",
    role: "super-admin",
    status: "active",
    createdAt: "2026-01-15",
  },
  {
    id: "admin-002",
    name: "Rahul Sharma",
    email: "rahul.sharma@schedula.com",
    role: "admin",
    status: "active",
    createdAt: "2026-02-10",
  },
  {
    id: "admin-003",
    name: "Priya Verma",
    email: "priya.verma@schedula.com",
    role: "admin",
    status: "active",
    createdAt: "2026-03-05",
  },
  {
    id: "admin-004",
    name: "Amit Gupta",
    email: "amit.gupta@schedula.com",
    role: "admin",
    status: "inactive",
    createdAt: "2026-04-18",
  },
  {
    id: "admin-005",
    name: "Sneha Kapoor",
    email: "sneha.kapoor@schedula.com",
    role: "admin",
    status: "active",
    createdAt: "2026-05-22",
  },
  {
    id: "admin-006",
    name: "Vikram Mehta",
    email: "vikram.mehta@schedula.com",
    role: "admin",
    status: "inactive",
    createdAt: "2026-06-14",
  },
];