 "use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { getAdminAppointments } from "@/lib/utils/admin-appointments";
import { buildPaymentsFromAppointments } from "@/lib/mock-data/payments";
import { doctors } from "@/lib/mock-data/doctors";
import type {
  Appointment,
  AppointmentStatus,
  ConsultationType,
} from "@/types/appointment";
import type { PaymentStatus } from "@/types/payment";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminUserRole } from "@/types/admin";

type AppointmentTypeFilter = "all" | ConsultationType;
type AppointmentStatusFilter = "all" | AppointmentStatus;
type PaymentStatusFilter = "all" | PaymentStatus;

const appointmentStatusOptions: Array<{
  value: AppointmentStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed", label: "Missed" },
];

const paymentStatusOptions: Array<{
  value: PaymentStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All payment statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];


const escapeCsvValue = (value: string | number) => {
  const text = String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const downloadCsv = (
  appointments: Appointment[],
  payments: ReturnType<typeof buildPaymentsFromAppointments>
) => {
  const paymentMap = new Map(
    payments.map((payment) => [payment.appointmentId, payment])
  );

  const headers = [
    "Appointment ID",
    "Patient",
    "Doctor",
    "Date & Time",
    "Consultation Type",
    "Appointment Status",
    "Payment Status",
    "Payment Method",
    "Amount",
  ];

  const rows = appointments.map((appointment) => {
    const payment = paymentMap.get(appointment.id);

    return [
      appointment.id,
      appointment.patient.name,
      appointment.clinician,
      new Date(appointment.startsAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      (appointment.consultationType ?? "in-person") === "online"
        ? "Online"
        : "In-person",
      appointment.status,
      payment?.status ?? "No payment",
      payment?.method ?? "—",
      payment?.amount ?? "—",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `schedula-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};


const escapeXml = (value: string | number) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const sanitizeXmlText = (value: string | number) =>
  String(value).replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
    ""
  );

const buildWorksheetXml = (rows: Array<Array<string | number>>) => {
  const rowXml = rows
    .map(
      (row, rowIndex) => `
        <row r="${rowIndex + 1}">
          ${row
            .map(
              (value, columnIndex) => `
                <c r="${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}" t="inlineStr">
                  <is><t>${escapeXml(sanitizeXmlText(value))}</t></is>
                </c>
              `
            )
            .join("")}
        </row>
      `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
};

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;

  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];

    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (
  target: Uint8Array,
  offset: number,
  value: number
) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
};

const writeUint32 = (
  target: Uint8Array,
  offset: number,
  value: number
) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
};

const encodeUtf8 = (value: string) =>
  new TextEncoder().encode(value);

const createZipArchive = (
  files: Array<{ name: string; content: string }>
) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  files.forEach((file) => {
    const nameBytes = encodeUtf8(file.name);
    const contentBytes = encodeUtf8(file.content);
    const checksum = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);

    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);
    localOffset += localHeader.length + contentBytes.length;

    const centralHeader = new Uint8Array(46 + nameBytes.length);

    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, localOffset - localHeader.length - contentBytes.length);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
  });

  const centralDirectorySize = centralParts.reduce(
    (total, part) => total + part.length,
    0
  );

  const endOfCentralDirectory = new Uint8Array(22);

  writeUint32(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16(endOfCentralDirectory, 4, 0);
  writeUint16(endOfCentralDirectory, 6, 0);
  writeUint16(endOfCentralDirectory, 8, files.length);
  writeUint16(endOfCentralDirectory, 10, files.length);
  writeUint32(endOfCentralDirectory, 12, centralDirectorySize);
  writeUint32(endOfCentralDirectory, 16, localOffset);
  writeUint16(endOfCentralDirectory, 20, 0);

  return [...localParts, ...centralParts, endOfCentralDirectory];
};

const downloadExcel = (
  appointments: Appointment[],
  payments: ReturnType<typeof buildPaymentsFromAppointments>,
  summary: {
    totalAppointments: number;
    onlineAppointments: number;
    inPersonAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalPayments: number;
    revenue: number;
  },
  filters: {
    fromDate: string;
    toDate: string;
    appointmentType: string;
    appointmentStatus: string;
    paymentStatus: string;
  }
) => {
  const paymentMap = new Map(
    payments.map((payment) => [payment.appointmentId, payment])
  );

  const summaryRows: Array<Array<string | number>> = [
    ["Schedula Reports"],
    ["Report Filters"],
    ["From Date", filters.fromDate || "All"],
    ["To Date", filters.toDate || "All"],
    ["Appointment Type", filters.appointmentType],
    ["Appointment Status", filters.appointmentStatus],
    ["Payment Status", filters.paymentStatus],
    [],
    ["Summary"],
    ["Total Appointments", summary.totalAppointments],
    ["Online Appointments", summary.onlineAppointments],
    ["In-person Appointments", summary.inPersonAppointments],
    ["Completed Appointments", summary.completedAppointments],
    ["Cancelled Appointments", summary.cancelledAppointments],
    ["Total Payments", summary.totalPayments],
    ["Total Revenue", `INR ${summary.revenue.toLocaleString("en-IN")}`],
  ];

  const detailRows: Array<Array<string | number>> = [
    [
      "Appointment ID",
      "Patient",
      "Doctor",
      "Date & Time",
      "Consultation Type",
      "Appointment Status",
      "Payment Status",
      "Payment Method",
      "Amount",
    ],
    ...appointments.map((appointment) => {
      const payment = paymentMap.get(appointment.id);

      return [
        appointment.id,
        appointment.patient.name,
        appointment.clinician,
        new Date(appointment.startsAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        (appointment.consultationType ?? "in-person") === "online"
          ? "Online"
          : "In-person",
        appointment.status,
        payment?.status ?? "No payment",
        payment?.method ?? "—",
        payment?.amount ?? "—",
      ];
    }),
  ];

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Summary" sheetId="1" r:id="rId1"/>
    <sheet name="Detailed Report" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`;

  const files = [
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRels },
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRels },
    {
      name: "xl/worksheets/sheet1.xml",
      content: buildWorksheetXml(summaryRows),
    },
    {
      name: "xl/worksheets/sheet2.xml",
      content: buildWorksheetXml(detailRows),
    },
  ];

  const zipParts = createZipArchive(files);
  const totalLength = zipParts.reduce(
    (total, part) => total + part.byteLength,
    0
  );
  const zipBuffer = new ArrayBuffer(totalLength);
  const zipBytes = new Uint8Array(zipBuffer);

  let offset = 0;
  zipParts.forEach((part) => {
    zipBytes.set(part, offset);
    offset += part.byteLength;
  });

  const blob = new Blob([zipBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `schedula-report-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};


const formatReportFilterLabel = (value: string) => {
  if (!value || value === "all") {
    return "All";
  }

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const downloadPdf = (
  appointments: Appointment[],
  payments: ReturnType<typeof buildPaymentsFromAppointments>,
  summary: {
    totalAppointments: number;
    onlineAppointments: number;
    inPersonAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalPayments: number;
    revenue: number;
  },
  filters: {
    fromDate: string;
    toDate: string;
    appointmentType: string;
    appointmentStatus: string;
    paymentStatus: string;
  }
) => {
  const paymentMap = new Map(
    payments.map((payment) => [payment.appointmentId, payment])
  );

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const colors = {
    text: [30, 41, 59] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
    primary: [5, 150, 105] as [number, number, number],
    primaryLight: [236, 253, 245] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    header: [15, 23, 42] as [number, number, number],
    tableHeader: [241, 245, 249] as [number, number, number],
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncate = (value: string, maxLength: number) => {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
  };

  const drawPageHeader = () => {
    doc.setFillColor(...colors.header);
    doc.roundedRect(
      margin,
      10,
      contentWidth,
      24,
      4,
      4,
      "F"
    );

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Schedula", margin + 8, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Admin Reports", margin + 8, 26);

    doc.setFontSize(8);
    doc.text(
      `Generated: ${formatDateTime(
        new Date().toISOString()
      )}`,
      pageWidth - margin - 8,
      20,
      { align: "right" }
    );
  };

  const drawFooter = (pageNumber: number) => {
    doc.setDrawColor(...colors.border);
    doc.line(
      margin,
      pageHeight - 10,
      pageWidth - margin,
      pageHeight - 10
    );

    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      "Schedula Admin Report",
      margin,
      pageHeight - 5
    );
    doc.text(
      `Page ${pageNumber}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: "right" }
    );
  };

  const drawFilters = (startY: number) => {
    doc.setDrawColor(...colors.border);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(
      margin,
      startY,
      contentWidth,
      26,
      3,
      3,
      "FD"
    );

    doc.setTextColor(...colors.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Applied Filters", margin + 6, startY + 7);

    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const filterLines = [
      `From: ${filters.fromDate || "All"}`,
      `To: ${filters.toDate || "All"}`,
      `Type: ${formatReportFilterLabel(
        filters.appointmentType
      )}`,
      `Appointment Status: ${formatReportFilterLabel(
        filters.appointmentStatus
      )}`,
      `Payment Status: ${formatReportFilterLabel(
        filters.paymentStatus
      )}`,
    ];

    const columnWidth = contentWidth / 3;

    filterLines.forEach((line, index) => {
      const row = index < 3 ? 0 : 1;
      const column =
        index < 3 ? index : index - 3;

      doc.text(
        line,
        margin + 6 + column * columnWidth,
        startY + 14 + row * 7
      );
    });
  };

  const drawSummary = (startY: number) => {
    const gap = 4;
    const cardWidth =
      (contentWidth - gap * 3) / 4;
    const cardHeight = 27;

    const cards = [
      {
        label: "Total Appointments",
        value: String(summary.totalAppointments),
      },
      {
        label: "Online / In-person",
        value: `${summary.onlineAppointments} / ${summary.inPersonAppointments}`,
      },
      {
        label: "Completed / Cancelled",
        value: `${summary.completedAppointments} / ${summary.cancelledAppointments}`,
      },
      {
        label: "Total Revenue",
        value: `INR ${summary.revenue.toLocaleString("en-IN")}`,
      },
    ];

    cards.forEach((card, index) => {
      const x =
        margin + index * (cardWidth + gap);

      doc.setDrawColor(...colors.border);
      doc.setFillColor(
        ...(index === 3
          ? colors.primaryLight
          : ([255, 255, 255] as [
              number,
              number,
              number
            ]))
      );

      doc.roundedRect(
        x,
        startY,
        cardWidth,
        cardHeight,
        3,
        3,
        "FD"
      );

      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(
        card.label,
        x + 5,
        startY + 8
      );

      doc.setTextColor(
        ...(index === 3
          ? colors.primary
          : colors.text)
      );
      doc.setFontSize(15);
      doc.text(
        card.value,
        x + 5,
        startY + 19
      );
    });
  };

  drawPageHeader();
  drawFilters(39);
  drawSummary(70);

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    `Detailed Report (${appointments.length} records)`,
    margin,
    108
  );

  const columns = [
    { title: "Appointment", width: 29 },
    { title: "Patient", width: 29 },
    { title: "Doctor", width: 29 },
    { title: "Date & Time", width: 36 },
    { title: "Type", width: 24 },
    { title: "Appt. Status", width: 31 },
    { title: "Payment", width: 26 },
    { title: "Amount", width: 21 },
  ];

  const rows = appointments.map((appointment) => {
    const payment = paymentMap.get(
      appointment.id
    );

    return [
      truncate(appointment.id, 17),
      truncate(appointment.patient.name, 17),
      truncate(appointment.clinician, 17),
      truncate(
        formatDateTime(appointment.startsAt),
        22
      ),
      (
        appointment.consultationType ??
        "in-person"
      ) === "online"
        ? "Online"
        : "In-person",
      truncate(
        formatReportFilterLabel(
          appointment.status
        ),
        15
      ),
      truncate(
        payment
          ? formatReportFilterLabel(payment.status)
          : "No payment",
        14
      ),
      payment
        ? `INR ${payment.amount.toLocaleString("en-IN")}`
        : "—",
    ];
  });

  const drawTableHeader = (y: number) => {
    doc.setFillColor(...colors.tableHeader);
    doc.setDrawColor(...colors.border);
    doc.rect(
      margin,
      y,
      contentWidth,
      10,
      "FD"
    );

    doc.setTextColor(...colors.text);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let x = margin;

    columns.forEach((column) => {
      doc.text(
        column.title,
        x + 3,
        y + 6.5
      );
      x += column.width;
    });
  };

  let currentPage = 1;
  let currentY = 113;

  if (rows.length === 0) {
    doc.setDrawColor(...colors.border);
    doc.roundedRect(
      margin,
      currentY,
      contentWidth,
      22,
      3,
      3,
      "S"
    );

    doc.setTextColor(...colors.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "No records match the selected filters.",
      pageWidth / 2,
      currentY + 13,
      { align: "center" }
    );
  } else {
    drawTableHeader(currentY);
    currentY += 10;

    rows.forEach((row) => {
      const rowHeight = 9;

      if (
        currentY + rowHeight >
        pageHeight - 16
      ) {
        drawFooter(currentPage);
        doc.addPage();
        currentPage += 1;
        drawPageHeader();
        currentY = 42;
        drawTableHeader(currentY);
        currentY += 10;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...colors.border);
      doc.rect(
        margin,
        currentY,
        contentWidth,
        rowHeight,
        "FD"
      );

      doc.setTextColor(...colors.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);

      let x = margin;

      row.forEach((value, index) => {
        doc.text(
          String(value),
          x + 3,
          currentY + 6,
          {
            maxWidth:
              columns[index].width - 6,
          }
        );

        x += columns[index].width;
      });

      currentY += rowHeight;
    });
  }

  drawFooter(currentPage);

  const fileDate = new Date()
    .toISOString()
    .slice(0, 10);

  doc.save(
    `schedula-report-${fileDate}.pdf`
  );
};

export default function AdminReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appointmentType, setAppointmentType] =
    useState<AppointmentTypeFilter>("all");
  const [appointmentStatus, setAppointmentStatus] =
    useState<AppointmentStatusFilter>("all");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusFilter>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminRole, setAdminRole] = useState<AdminUserRole | null>(null);

  const reportsPerPage = 5;

  useEffect(() => {
    const storedRole = localStorage.getItem("admin_role") as AdminUserRole | null;
    setAdminRole(storedRole);
  }, []);

  const canViewReports =
    adminRole !== null && hasPermission(adminRole, "reports", "view");

  useEffect(() => {
    const loadAppointments = () => {
      try {
        setError("");
        setLoading(true);
        setAppointments(getAdminAppointments());
      } catch {
        setAppointments([]);
        setError("Unable to load report data.");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();

    window.addEventListener("storage", loadAppointments);
    window.addEventListener("appointments-updated", loadAppointments);

    return () => {
      window.removeEventListener("storage", loadAppointments);
      window.removeEventListener(
        "appointments-updated",
        loadAppointments
      );
    };
  }, []);

  const payments = useMemo(
    () => buildPaymentsFromAppointments(appointments, doctors),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = appointment.startsAt.slice(0, 10);

      const matchesFromDate =
        !fromDate || appointmentDate >= fromDate;

      const matchesToDate =
        !toDate || appointmentDate <= toDate;

      const matchesType =
        appointmentType === "all" ||
        (appointment.consultationType ?? "in-person") ===
          appointmentType;

      const matchesStatus =
        appointmentStatus === "all" ||
        appointment.status === appointmentStatus;

      return (
        matchesFromDate &&
        matchesToDate &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    appointments,
    fromDate,
    toDate,
    appointmentType,
    appointmentStatus,
  ]);

  const filteredAppointmentIds = useMemo(
    () => new Set(filteredAppointments.map((appointment) => appointment.id)),
    [filteredAppointments]
  );

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (paymentStatus !== "all" && payment.status !== paymentStatus) {
        return false;
      }

      return filteredAppointmentIds.has(payment.appointmentId);
    });
  }, [payments, filteredAppointmentIds, paymentStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    fromDate,
    toDate,
    appointmentType,
    appointmentStatus,
    paymentStatus,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / reportsPerPage)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedAppointments = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * reportsPerPage;

    return filteredAppointments.slice(
      startIndex,
      startIndex + reportsPerPage
    );
  }, [
    filteredAppointments,
    safeCurrentPage,
  ]);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setAppointmentType("all");
    setAppointmentStatus("all");
    setPaymentStatus("all");
    setError("");
  };

  const reportSummary = useMemo(() => {
    // Revenue = Total Paid Amount - Total Refund Amount.
    // A refunded payment is still included in Total Paid because
    // the payment was originally received before being refunded.
    const totalPaid = filteredPayments
      .filter(
        (payment) =>
          payment.status === "paid" || payment.status === "refunded"
      )
      .reduce((total, payment) => total + payment.amount, 0);

    const totalRefund = filteredPayments.reduce(
      (total, payment) => total + (payment.refundAmount ?? 0),
      0
    );

    const revenue = Math.max(0, totalPaid - totalRefund);

    return {
      totalAppointments: filteredAppointments.length,
      onlineAppointments: filteredAppointments.filter(
        (appointment) =>
          (appointment.consultationType ?? "in-person") === "online"
      ).length,
      inPersonAppointments: filteredAppointments.filter(
        (appointment) =>
          (appointment.consultationType ?? "in-person") === "in-person"
      ).length,
      completedAppointments: filteredAppointments.filter(
        (appointment) => appointment.status === "completed"
      ).length,
      cancelledAppointments: filteredAppointments.filter(
        (appointment) => appointment.status === "cancelled"
      ).length,
      totalPayments: filteredPayments.length,
      totalPaid,
      totalRefund,
      revenue,
    };
  }, [filteredAppointments, filteredPayments]);

  const paymentByAppointmentId = useMemo(
    () =>
      new Map(
        filteredPayments.map((payment) => [payment.appointmentId, payment])
      ),
    [filteredPayments]
  );

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatStatus = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  if (adminRole === null || !canViewReports) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Filter appointment and payment data to prepare detailed reports.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Report Filters
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose the date range and report criteria.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canViewReports && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      downloadCsv(filteredAppointments, filteredPayments)
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadExcel(
                        filteredAppointments,
                        filteredPayments,
                        reportSummary,
                        {
                          fromDate,
                          toDate,
                          appointmentType,
                          appointmentStatus,
                          paymentStatus,
                        }
                      )
                    }
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Export Excel
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadPdf(
                        filteredAppointments,
                        filteredPayments,
                        reportSummary,
                        {
                          fromDate,
                          toDate,
                          appointmentType,
                          appointmentStatus,
                          paymentStatus,
                        }
                      )
                    }
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Export PDF
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                From Date
              </span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                To Date
              </span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Appointment Type
              </span>
              <select
                value={appointmentType}
                onChange={(event) =>
                  setAppointmentType(
                    event.target.value as AppointmentTypeFilter
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All types</option>
                <option value="online">Online</option>
                <option value="in-person">In-person</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Appointment Status
              </span>
              <select
                value={appointmentStatus}
                onChange={(event) =>
                  setAppointmentStatus(
                    event.target.value as AppointmentStatusFilter
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {appointmentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Payment Status
              </span>
              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value as PaymentStatusFilter
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {paymentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Matching Appointments
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {filteredAppointments.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Matching Payments
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {filteredPayments.length}
              </p>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Report Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Summary values are calculated from the currently filtered data.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Appointments
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reportSummary.totalAppointments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Online Appointments
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reportSummary.onlineAppointments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                In-person Appointments
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reportSummary.inPersonAppointments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Payments
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reportSummary.totalPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Completed
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reportSummary.completedAppointments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Cancelled
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reportSummary.cancelledAppointments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
              <p className="text-sm font-semibold text-slate-500">
                Total Revenue
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                ₹{reportSummary.revenue.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total Paid − Total Refund.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Report Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Detailed Report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Appointment and payment details matching the selected filters.
            </p>
          </div>

          {loading ? (
            <div
              className="px-6 py-16 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Loading report
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while the report data is prepared.
              </p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-xl">
                —
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">
                No appointments found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing or clearing your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Appointment
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date &amp; Time
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Appointment Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedAppointments.map((appointment) => {
                    const payment = paymentByAppointmentId.get(
                      appointment.id
                    );
                    const consultationType =
                      appointment.consultationType ?? "in-person";

                    return (
                      <tr
                        key={appointment.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {appointment.id}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">
                            {appointment.patient.name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">
                            {appointment.clinician}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDateTime(appointment.startsAt)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {consultationType === "online"
                              ? "Online"
                              : "In-person"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {formatStatus(appointment.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {payment
                              ? formatStatus(payment.status)
                              : "No payment"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                          {payment
                            ? `INR ${payment.amount.toLocaleString("en-IN")}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredAppointments.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {(safeCurrentPage - 1) * reportsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(
                    safeCurrentPage * reportsPerPage,
                    filteredAppointments.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {filteredAppointments.length}
                </span>{" "}
                appointments
              </p>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(page - 1, 1)
                      )
                    }
                    disabled={safeCurrentPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={
                          safeCurrentPage === page
                            ? "page"
                            : undefined
                        }
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                          safeCurrentPage === page
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(page + 1, totalPages)
                      )
                    }
                    disabled={safeCurrentPage === totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
