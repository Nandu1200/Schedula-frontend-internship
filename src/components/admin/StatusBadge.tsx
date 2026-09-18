type StatusBadgeProps = {
  status: string;
};

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "completed":
    case "approved":
    case "active":
    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
    case "starting soon":
    case "processing":
      return "bg-amber-50 text-amber-700";

    case "cancelled":
    case "rejected":
    case "failed":
    case "inactive":
      return "bg-red-50 text-red-700";

    case "upcoming":
    case "live":
      return "bg-blue-50 text-blue-700";

    case "missed":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyles(
        status
      )}`}
    >
      {status}
    </span>
  );
}