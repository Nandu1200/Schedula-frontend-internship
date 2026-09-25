"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import { patients as mockPatients } from "@/lib/mock-data/patients";
import { adminDoctors } from "@/lib/mock-data/admin/doctors";
import { buildPaymentsFromAppointments } from "@/lib/mock-data/payments";
import { getAdminAppointments } from "@/lib/utils/admin-appointments";
import type { Appointment } from "@/types/appointment";
import type { AdminDoctorStatus } from "@/types/admin";
import type { Payment } from "@/types/payment";

const localDateKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const dateKey = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const formatDateTimeForAnalytics = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatMonth = (value: string) => {
  const date = new Date(`${value}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(date);
};

const formatCurrency = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₹${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return formatCurrency(value);
};

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const map = new Map<string, T>();

  items.forEach((item) => {
    map.set(item.id, item);
  });

  return Array.from(map.values());
};

const readStoredDoctor = () => {
  try {
    const raw = localStorage.getItem("registeredDoctor");

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as (typeof mockDoctors)[number] & {
      registeredAt?: string;
    };
  } catch {
    return null;
  }
};

const readStoredPatient = () => {
  try {
    const raw = localStorage.getItem("registeredPatient");

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as (typeof mockPatients)[number];
  } catch {
    return null;
  }
};

const getVerificationStatus = (doctorId: string): AdminDoctorStatus => {
  const storedStatus = localStorage.getItem(
    `doctorVerificationStatus-${doctorId}`
  );

  if (
    storedStatus === "pending" ||
    storedStatus === "approved" ||
    storedStatus === "rejected"
  ) {
    return storedStatus;
  }

  return (
    adminDoctors.find((doctor) => doctor.doctorId === doctorId)
      ?.verificationStatus ?? "pending"
  );
};

let appointmentsSnapshot: Appointment[] = [];
let doctorsSnapshot = mockDoctors;
let patientsSnapshot = mockPatients;
let refreshSnapshot = 0;

const refreshAnalyticsSnapshots = () => {
  try {
    const registeredDoctor = readStoredDoctor();
    const registeredPatient = readStoredPatient();

    doctorsSnapshot = registeredDoctor
      ? uniqueById([...mockDoctors, registeredDoctor])
      : mockDoctors;

    patientsSnapshot = registeredPatient
      ? uniqueById([...mockPatients, registeredPatient])
      : mockPatients;

    appointmentsSnapshot = getAdminAppointments();
  } catch {
    doctorsSnapshot = mockDoctors;
    patientsSnapshot = mockPatients;
    appointmentsSnapshot = [];
  }

  refreshSnapshot += 1;
};

const subscribeToAnalytics = (callback: () => void) => {
  const handleUpdate = () => {
    refreshAnalyticsSnapshots();
    callback();
  };

  window.addEventListener("storage", handleUpdate);
  window.addEventListener("appointments-updated", handleUpdate);
  window.addEventListener("registered-user-updated", handleUpdate);
  window.addEventListener("doctor-verification-changed", handleUpdate);

  refreshAnalyticsSnapshots();
  callback();

  return () => {
    window.removeEventListener("storage", handleUpdate);
    window.removeEventListener("appointments-updated", handleUpdate);
    window.removeEventListener("registered-user-updated", handleUpdate);
    window.removeEventListener("doctor-verification-changed", handleUpdate);
  };
};

const getAnalyticsSnapshot = () => refreshSnapshot;
const getServerAnalyticsSnapshot = () => 0;

const getAppointmentLabel = (status: Appointment["status"]) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "upcoming":
      return "Upcoming";
    case "missed":
      return "Missed";
    default:
      return status;
  }
};

type Point = {
  label: string;
  value: number;
};

type DonutItem = {
  label: string;
  value: number;
  className: string;
};

function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

type ChartSelection = {
  title: string;
  label: string;
  value: number;
  unit: string;
  detail: string;
  rows: Array<{ label: string; value: string }>;
};

function ChartSelectionModal({
  selection,
  onClose,
}: {
  selection: ChartSelection | null;
  onClose: () => void;
}) {
  if (!selection) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close analytics details"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Interactive Analytics
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {selection.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selection.detail}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-500">{selection.label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {selection.value.toLocaleString("en-IN")}
            <span className="ml-2 text-base font-semibold text-slate-500">
              {selection.unit}
            </span>
          </p>
        </div>

        {selection.rows.length > 0 ? (
          <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200">
            {selection.rows.map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <span className="text-sm text-slate-500">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
            No additional records are available for this selection.
          </p>
        )}
      </div>
    </div>
  );
}

function LineChart({
  points,
  onSelect,
}: {
  points: Point[];
  onSelect?: (point: Point) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 760;
  const height = 260;
  const padding = { top: 18, right: 20, bottom: 40, left: 48 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  const coords = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1
        ? innerWidth / 2
        : (index / (points.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - (point.value / maxValue) * innerHeight;

    return { ...point, x, y };
  });

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${coords.at(-1)?.x ?? padding.left} ${
    padding.top + innerHeight
  } L ${coords[0]?.x ?? padding.left} ${padding.top + innerHeight} Z`;

  const hoveredPoint = hoveredIndex === null ? null : coords[hoveredIndex];

  return (
    <div className="relative overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 min-w-[680px] w-full"
        role="img"
        aria-label="Revenue trend. Hover points for details and click a point to inspect the selected period."
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + innerHeight - ratio * innerHeight;
          const labelValue = maxValue * ratio;

          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 6"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
              >
                {formatCompactCurrency(labelValue)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="#10b981" opacity="0.10" />
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" />

        {coords.map((point, index) => (
          <g key={`${point.label}-${point.x}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 8 : 5}
              fill="#10b981"
              className="cursor-pointer transition-all"
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => onSelect?.(point)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(point);
                }
              }}
            />
            <circle cx={point.x} cy={point.y} r="2" fill="#ffffff" pointerEvents="none" />
            <text
              x={point.x}
              y={height - 14}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {hoveredPoint ? (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-white shadow-lg"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <p className="text-xs font-semibold text-slate-300">{hoveredPoint.label}</p>
          <p className="mt-0.5 text-sm font-bold">{formatCurrency(hoveredPoint.value)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-300">Click for details</p>
        </div>
      ) : null}
    </div>
  );
}

function BarChart({
  points,
  onSelect,
  valueLabel = "Appointments",
}: {
  points: Point[];
  onSelect?: (point: Point) => void;
  valueLabel?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const hoveredPoint = hoveredIndex === null ? null : points[hoveredIndex];

  return (
    <div className="overflow-x-auto">
      <div className="relative flex h-64 min-w-[620px] items-end gap-3 border-b border-slate-200 px-2 pb-2">
        {points.map((point, index) => {
          const percent = point.value === 0 ? 0 : (point.value / maxValue) * 100;

          return (
            <div
              key={point.label}
              className="flex h-full min-w-[52px] flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-bold text-slate-500">{point.value}</span>
              <div className="flex h-48 w-full items-end justify-center">
                <button
                  type="button"
                  aria-label={`${point.label}: ${point.value} ${valueLabel}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  onClick={() => onSelect?.(point)}
                  className={`w-full max-w-12 rounded-t-xl bg-emerald-400 transition-all duration-300 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                    hoveredIndex === index ? "-translate-y-1 shadow-lg" : ""
                  }`}
                  style={{
                    height: `${percent}%`,
                    minHeight: point.value > 0 ? "8px" : "0px",
                  }}
                />
              </div>
              <span className="text-center text-xs text-slate-500">{point.label}</span>
            </div>
          );
        })}

        {hoveredPoint ? (
          <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-white shadow-lg">
            <p className="text-xs font-semibold text-slate-300">{hoveredPoint.label}</p>
            <p className="mt-0.5 text-sm font-bold">
              {hoveredPoint.value} {valueLabel.toLowerCase()}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-300">Click for details</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DonutChart({
  items,
  totalLabel,
  onSelect,
}: {
  items: DonutItem[];
  totalLabel: string;
  onSelect?: (item: DonutItem) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  const circumference = 2 * Math.PI * 46;
  let offset = 0;

  const hoveredItem = hoveredIndex === null ? null : items[hoveredIndex];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative size-44 shrink-0">
        <svg
          viewBox="0 0 120 120"
          className="size-full -rotate-90"
          role="img"
          aria-label={`${totalLabel} distribution. Hover or click a segment for details.`}
        >
          <circle cx="60" cy="60" r="46" fill="none" stroke="#e2e8f0" strokeWidth="14" />
          {total > 0
            ? items.map((item, index) => {
                const segment = (item.value / total) * circumference;
                const currentOffset = offset;
                offset += segment;

                const color =
                  item.className.includes("emerald")
                    ? "#10b981"
                    : item.className.includes("amber")
                      ? "#f59e0b"
                      : item.className.includes("red")
                        ? "#ef4444"
                        : item.className.includes("indigo")
                          ? "#6366f1"
                          : "#64748b";

                return (
                  <circle
                    key={item.label}
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke={color}
                    strokeWidth={hoveredIndex === index ? "18" : "14"}
                    strokeDasharray={`${segment} ${circumference - segment}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="butt"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelect?.(item)}
                    tabIndex={0}
                    role="button"
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect?.(item);
                      }
                    }}
                  />
                );
              })
            : null}
        </svg>

        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {total.toLocaleString("en-IN")}
            </p>
            <p className="text-xs font-medium text-slate-500">{totalLabel}</p>
          </div>
        </div>

        {hoveredItem ? (
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2 rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-center text-white shadow-lg">
            <p className="text-xs font-semibold text-slate-300">{hoveredItem.label}</p>
            <p className="mt-0.5 text-sm font-bold">{hoveredItem.value.toLocaleString("en-IN")}</p>
            <p className="mt-0.5 text-[11px] text-emerald-300">Click for details</p>
          </div>
        ) : null}
      </div>

      <div className="w-full max-w-xs space-y-3">
        {items.map((item, index) => {
          const percentage = total ? Math.round((item.value / total) * 100) : 0;

          return (
            <button
              key={item.label}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => onSelect?.(item)}
              className={`flex w-full items-center justify-between gap-4 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                hoveredIndex === index ? "bg-slate-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${item.className}`} />
                <span className="text-sm text-slate-600">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {item.value.toLocaleString("en-IN")} ({percentage}%)
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [selectedChart, setSelectedChart] = useState<ChartSelection | null>(null);

  const analyticsVersion = useSyncExternalStore(
    subscribeToAnalytics,
    getAnalyticsSnapshot,
    getServerAnalyticsSnapshot
  );

  const appointments = appointmentsSnapshot;
  const registeredDoctors = doctorsSnapshot;
  const registeredPatients = patientsSnapshot;

  const analyticsAppointments = useMemo(
    () =>
      appointments.map((appointment) => ({
        ...appointment,
        consultationType: appointment.consultationType ?? "in-person",
      })),
    [appointments]
  );

  const payments = useMemo(
    () => buildPaymentsFromAppointments(analyticsAppointments, registeredDoctors),
    [analyticsAppointments, registeredDoctors]
  );

  const verificationItems = useMemo(() => {
    return registeredDoctors.map((doctor) => ({
      doctor,
      status: getVerificationStatus(doctor.id),
    }));
  }, [registeredDoctors]);

  const totals = useMemo(() => {
    const online = analyticsAppointments.filter(
      (appointment) => appointment.consultationType === "online"
    ).length;
    const inPerson = analyticsAppointments.length - online;

    return {
      doctors: registeredDoctors.length,
      patients: registeredPatients.length,
      appointments: analyticsAppointments.length,
      online,
      inPerson,
      completed: analyticsAppointments.filter((item) => item.status === "completed").length,
      cancelled: analyticsAppointments.filter((item) => item.status === "cancelled").length,
      upcoming: analyticsAppointments.filter(
        (item) => item.status === "pending" || item.status === "confirmed" || item.status === "upcoming"
      ).length,
      pending: analyticsAppointments.filter((item) => item.status === "pending").length,
      missed: analyticsAppointments.filter((item) => item.status === "missed").length,
      revenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      paidPayments: payments.filter((payment) => payment.status === "paid").length,
      pendingPayments: payments.filter((payment) => payment.status === "pending").length,
      failedPayments: payments.filter((payment) => payment.status === "failed").length,
      refundedPayments: payments.filter((payment) => payment.status === "refunded").length,
    };
  }, [analyticsAppointments, payments, registeredDoctors, registeredPatients]);

  const appointmentTrend = useMemo(() => {
    const lastSevenDays: Point[] = [];
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      const key = localDateKey(date);

      lastSevenDays.push({
        label: formatDate(key),
        value: analyticsAppointments.filter(
          (appointment) => dateKey(appointment.startsAt) === key
        ).length,
      });
    }

    return lastSevenDays;
  }, [analyticsAppointments]);

  const revenueTrend = useMemo(() => {
    const monthly = new Map<string, number>();

    payments.forEach((payment) => {
      const date = new Date(payment.createdAt);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthly.set(key, (monthly.get(key) ?? 0) + payment.amount);
    });

    const keys = Array.from(monthly.keys()).sort();
    const selectedKeys = keys.slice(-6);

    return selectedKeys.map((key) => ({
      label: formatMonth(key),
      value: monthly.get(key) ?? 0,
    }));
  }, [payments]);

  const paymentMethodItems = useMemo(() => {
    const amounts: Record<Payment["method"], number> = {
      card: 0,
      upi: 0,
      netbanking: 0,
    };

    payments.forEach((payment) => {
      amounts[payment.method] += payment.amount;
    });

    return [
      { label: "Card", value: amounts.card, className: "bg-indigo-500" },
      { label: "UPI", value: amounts.upi, className: "bg-amber-500" },
      { label: "Net Banking", value: amounts.netbanking, className: "bg-emerald-500" },
    ];
  }, [payments]);

  const appointmentStatusItems = useMemo(
    () => [
      { label: "Completed", value: totals.completed, className: "bg-emerald-500" },
      { label: "Cancelled", value: totals.cancelled, className: "bg-red-500" },
      { label: "Pending", value: totals.pending, className: "bg-amber-500" },
      { label: "Upcoming", value: totals.upcoming, className: "bg-indigo-500" },
      { label: "Missed", value: totals.missed, className: "bg-slate-500" },
    ],
    [totals]
  );

  const consultationItems = useMemo(
    () => [
      { label: "Online", value: totals.online, className: "bg-indigo-500" },
      { label: "In-person", value: totals.inPerson, className: "bg-emerald-500" },
    ],
    [totals]
  );

  const verificationStats = useMemo(
    () => [
      {
        label: "Approved",
        value: verificationItems.filter((item) => item.status === "approved").length,
        className: "bg-emerald-500",
      },
      {
        label: "Pending",
        value: verificationItems.filter((item) => item.status === "pending").length,
        className: "bg-amber-500",
      },
      {
        label: "Rejected",
        value: verificationItems.filter((item) => item.status === "rejected").length,
        className: "bg-red-500",
      },
    ],
    [verificationItems]
  );

  const topDoctors = useMemo(() => {
    const counts = new Map<string, number>();

    analyticsAppointments.forEach((appointment) => {
      counts.set(
        appointment.clinician,
        (counts.get(appointment.clinician) ?? 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((first, second) => second.value - first.value)
      .slice(0, 5);
  }, [analyticsAppointments]);

  const doctorRegistrationTrend = useMemo(() => {
    const rows: Point[] = [];

    const registered = adminDoctors
      .filter((doctor) => doctor.registeredAt)
      .map((doctor) => ({
        label: formatDate(doctor.registeredAt.slice(0, 10)),
        value: 1,
      }));

    const storedDoctor = readStoredDoctor();

    if (storedDoctor) {
      const registrationDate =
        typeof storedDoctor.registeredAt === "string" && storedDoctor.registeredAt
          ? storedDoctor.registeredAt.slice(0, 10)
          : storedDoctor.name?.trim().toLowerCase() === "dr samta"
            ? "2026-09-02"
            : "";

      if (registrationDate) {
        registered.push({ label: formatDate(registrationDate), value: 1 });
      }
    }

    const grouped = new Map<string, number>();
    registered.forEach((item) => {
      grouped.set(item.label, (grouped.get(item.label) ?? 0) + item.value);
    });

    grouped.forEach((value, label) => rows.push({ label, value }));

    return rows.slice(-7);
  }, [analyticsVersion]);

  const appointmentDetailsByLabel = useMemo(() => {
    const details = new Map<string, Appointment[]>();

    analyticsAppointments.forEach((appointment) => {
      const label = formatDate(dateKey(appointment.startsAt));
      const current = details.get(label) ?? [];
      current.push(appointment);
      details.set(label, current);
    });

    return details;
  }, [analyticsAppointments]);

  const revenueDetailsByLabel = useMemo(() => {
    const details = new Map<string, { amount: number; count: number }>();

    payments.forEach((payment) => {
      const date = new Date(payment.createdAt);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = formatMonth(key);
      const current = details.get(label) ?? { amount: 0, count: 0 };
      current.amount += payment.amount;
      current.count += 1;
      details.set(label, current);
    });

    return details;
  }, [payments]);

  const paymentMethodDetails = useMemo(() => {
    const details = new Map<string, { amount: number; count: number }>();

    payments.forEach((payment) => {
      const label =
        payment.method === "card"
          ? "Card"
          : payment.method === "upi"
            ? "UPI"
            : "Net Banking";
      const current = details.get(label) ?? { amount: 0, count: 0 };
      current.amount += payment.amount;
      current.count += 1;
      details.set(label, current);
    });

    return details;
  }, [payments]);

  const statusDetails = useMemo(() => {
    const details = new Map<string, Appointment[]>();

    analyticsAppointments.forEach((appointment) => {
      const label = getAppointmentLabel(appointment.status);
      const current = details.get(label) ?? [];
      current.push(appointment);
      details.set(label, current);
    });

    return details;
  }, [analyticsAppointments]);

  const consultationDetails = useMemo(() => {
    const details = new Map<string, Appointment[]>();

    analyticsAppointments.forEach((appointment) => {
      const label = appointment.consultationType === "online" ? "Online" : "In-person";
      const current = details.get(label) ?? [];
      current.push(appointment);
      details.set(label, current);
    });

    return details;
  }, [analyticsAppointments]);

  const verificationDetails = useMemo(() => {
    const details = new Map<string, string[]>();

    verificationItems.forEach(({ doctor, status }) => {
      const label = status === "approved" ? "Approved" : status === "pending" ? "Pending" : "Rejected";
      const current = details.get(label) ?? [];
      current.push(doctor.name);
      details.set(label, current);
    });

    return details;
  }, [verificationItems]);

  const registrationDetails = useMemo(() => {
    const details = new Map<string, string[]>();

    adminDoctors
      .filter((doctor) => doctor.registeredAt)
      .forEach((doctor) => {
        const label = formatDate(doctor.registeredAt.slice(0, 10));
        const current = details.get(label) ?? [];
        current.push(registeredDoctors.find((registeredDoctor) => registeredDoctor.id === doctor.doctorId)?.name ?? doctor.doctorId);
        details.set(label, current);
      });

    const storedDoctor = readStoredDoctor();
    if (storedDoctor) {
      const registrationDate =
        typeof storedDoctor.registeredAt === "string" && storedDoctor.registeredAt
          ? storedDoctor.registeredAt.slice(0, 10)
          : storedDoctor.name?.trim().toLowerCase() === "dr samta"
            ? "2026-09-02"
            : "";

      if (registrationDate) {
        const label = formatDate(registrationDate);
        const current = details.get(label) ?? [];
        current.push(storedDoctor.name);
        details.set(label, current);
      }
    }

    return details;
  }, [analyticsVersion]);

  const kpis = [
    { title: "Total Doctors", value: totals.doctors, caption: "Registered doctors", icon: "👨‍⚕️" },
    { title: "Total Patients", value: totals.patients, caption: "Registered patients", icon: "👤" },
    { title: "Appointments", value: totals.appointments, caption: "All recorded appointments", icon: "📅" },
    { title: "Revenue", value: formatCurrency(totals.revenue), caption: "Total recorded payment value", icon: "₹" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600">
            Admin Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            A live view of Schedula activity using the same appointment, doctor, patient and payment data used across the admin portal.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm lg:self-auto">
          <span className="size-2 rounded-full bg-emerald-500" />
          Live from current project data
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{kpi.title}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-400">{kpi.caption}</p>
              </div>
              <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-lg">{kpi.icon}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <ChartCard title="Revenue Trend" description="Payment value generated from the current appointment/payment data.">
          {revenueTrend.length > 0 ? (
            <LineChart
              points={revenueTrend}
              onSelect={(point) => {
                const detail = revenueDetailsByLabel.get(point.label);
                setSelectedChart({
                  title: "Revenue Trend",
                  label: point.label,
                  value: point.value,
                  unit: "revenue",
                  detail: "Payment activity recorded for the selected month.",
                  rows: [
                    { label: "Payments", value: String(detail?.count ?? 0) },
                    { label: "Recorded value", value: formatCurrency(detail?.amount ?? point.value) },
                  ],
                });
              }}
            />
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
              No revenue data available.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Payment Methods" description="Payment value grouped by payment method.">
          <DonutChart
            totalLabel="value"
            items={paymentMethodItems.map((item) => ({
              ...item,
              value: Math.round(item.value),
            }))}
            onSelect={(item) => {
              const detail = paymentMethodDetails.get(item.label);
              setSelectedChart({
                title: "Payment Methods",
                label: item.label,
                value: item.value,
                unit: "payment value",
                detail: "Payment activity grouped by the selected method.",
                rows: [
                  { label: "Transactions", value: String(detail?.count ?? 0) },
                  { label: "Recorded value", value: formatCurrency(detail?.amount ?? item.value) },
                ],
              });
            }}
          />
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Appointment Trend" description="Appointments created across the latest seven calendar days.">
          <BarChart
            points={appointmentTrend}
            valueLabel="appointments"
            onSelect={(point) => {
              const detail = appointmentDetailsByLabel.get(point.label) ?? [];
              setSelectedChart({
                title: "Appointment Trend",
                label: point.label,
                value: point.value,
                unit: "appointments",
                detail: "Appointments scheduled on the selected day.",
                rows: detail.map((appointment) => ({
                  label: appointment.patient.name,
                  value: `${appointment.clinician} • ${getAppointmentLabel(appointment.status)}`,
                })),
              });
            }}
          />
        </ChartCard>

        <ChartCard title="Appointment Status" description="Current distribution across all appointment statuses.">
          <DonutChart
            totalLabel="appointments"
            items={appointmentStatusItems}
            onSelect={(item) => {
              const detail = statusDetails.get(item.label) ?? [];
              setSelectedChart({
                title: "Appointment Status",
                label: item.label,
                value: item.value,
                unit: "appointments",
                detail: "Appointments currently in the selected status.",
                rows: detail.map((appointment) => ({
                  label: appointment.patient.name,
                  value: `${appointment.clinician} • ${formatDateTimeForAnalytics(appointment.startsAt)}`,
                })),
              });
            }}
          />
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Consultation Type" description="Online versus in-person appointments from current data.">
          <DonutChart
            totalLabel="appointments"
            items={consultationItems}
            onSelect={(item) => {
              const detail = consultationDetails.get(item.label) ?? [];
              setSelectedChart({
                title: "Consultation Type",
                label: item.label,
                value: item.value,
                unit: "appointments",
                detail: "Appointments grouped by consultation mode.",
                rows: detail.map((appointment) => ({
                  label: appointment.patient.name,
                  value: `${appointment.clinician} • ${formatDateTimeForAnalytics(appointment.startsAt)}`,
                })),
              });
            }}
          />
        </ChartCard>

        <ChartCard title="Doctor Verification" description="Current verification status of registered doctors.">
          <DonutChart
            totalLabel="doctors"
            items={verificationStats}
            onSelect={(item) => {
              const names = verificationDetails.get(item.label) ?? [];
              setSelectedChart({
                title: "Doctor Verification",
                label: item.label,
                value: item.value,
                unit: "doctors",
                detail: "Doctors currently in the selected verification status.",
                rows: names.map((name) => ({ label: "Doctor", value: name })),
              });
            }}
          />
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Doctor Registration Trend" description="Doctor registrations with available registration dates.">
          {doctorRegistrationTrend.length > 0 ? (
            <BarChart
              points={doctorRegistrationTrend}
              valueLabel="registrations"
              onSelect={(point) => {
                const names = registrationDetails.get(point.label) ?? [];
                setSelectedChart({
                  title: "Doctor Registration Trend",
                  label: point.label,
                  value: point.value,
                  unit: "registrations",
                  detail: "Doctor registrations recorded for the selected date.",
                  rows: names.map((name) => ({ label: "Doctor", value: name })),
                });
              }}
            />
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
              No doctor registration dates are available.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top Doctors by Appointments" description="Doctors with the highest number of recorded appointments.">
          {topDoctors.length > 0 ? (
            <div className="space-y-4">
              {topDoctors.map((doctor) => {
                const max = Math.max(...topDoctors.map((item) => item.value), 1);
                const percent = (doctor.value / max) * 100;

                return (
                  <button
                    key={doctor.label}
                    type="button"
                    onClick={() => {
                      const detail = analyticsAppointments.filter(
                        (appointment) => appointment.clinician === doctor.label
                      );
                      setSelectedChart({
                        title: "Top Doctors by Appointments",
                        label: doctor.label,
                        value: doctor.value,
                        unit: "appointments",
                        detail: "Recorded appointments for the selected doctor.",
                        rows: detail.map((appointment) => ({
                          label: appointment.patient.name,
                          value: `${formatDateTimeForAnalytics(appointment.startsAt)} • ${getAppointmentLabel(appointment.status)}`,
                        })),
                      });
                    }}
                    className="block w-full rounded-2xl p-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-700">{doctor.label}</span>
                      <span className="text-sm font-bold text-slate-900">{doctor.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500" style={{ width: `${percent}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
              No appointment data available.
            </div>
          )}
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Online", value: totals.online, note: "consultations" },
          { label: "In-person", value: totals.inPerson, note: "consultations" },
          { label: "Completed", value: totals.completed, note: "appointments" },
          { label: "Cancelled", value: totals.cancelled, note: "appointments" },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-slate-400">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Payment & Verification Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Quick operational metrics pulled from the same live admin data.</p>
          </div>
          <span className="text-xs font-medium text-slate-400">Updates with project events</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Paid", totals.paidPayments, "bg-emerald-50 text-emerald-700"],
            ["Pending", totals.pendingPayments, "bg-amber-50 text-amber-700"],
            ["Failed", totals.failedPayments, "bg-red-50 text-red-700"],
            ["Refunded", totals.refundedPayments, "bg-purple-50 text-purple-700"],
            ["Approved Doctors", verificationStats[0].value, "bg-emerald-50 text-emerald-700"],
            ["Pending Doctors", verificationStats[1].value, "bg-amber-50 text-amber-700"],
          ].map(([label, value, className]) => (
            <div key={label} className={`rounded-2xl p-4 ${className}`}>
              <p className="text-xs font-semibold">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <ChartSelectionModal
        selection={selectedChart}
        onClose={() => setSelectedChart(null)}
      />
    </main>
  );
}
