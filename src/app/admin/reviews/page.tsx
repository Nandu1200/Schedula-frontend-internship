"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAdminReviews } from "@/lib/utils/admin-reviews";
import { doctors as mockDoctors } from "@/lib/mock-data/doctors";
import type { AdminReview } from "@/types/review";
import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";

type RatingFilter =
  | "all"
  | "5"
  | "4"
  | "3"
  | "2"
  | "1";

type ReportFilter =
  | "all"
  | "reported"
  | "visible"
  | "hidden";

const reviewsPerPage = 5;

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getStars = (rating: number) => {
  return `${"★".repeat(rating)}${"☆".repeat(
    Math.max(0, 5 - rating)
  )}`;
};

const normalizeDoctorName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const mergeUniqueDoctors = (
  reviews: AdminReview[],
  registeredDoctor: Doctor | null
) => {
  const doctors = new Map<string, string>();

  mockDoctors.forEach((doctor) => {
    const normalizedName = normalizeDoctorName(
      doctor.name
    );

    if (normalizedName && !doctors.has(normalizedName)) {
      doctors.set(normalizedName, doctor.name.trim());
    }
  });

  if (registeredDoctor?.name) {
    const normalizedName = normalizeDoctorName(
      registeredDoctor.name
    );

    if (normalizedName && !doctors.has(normalizedName)) {
      doctors.set(normalizedName, registeredDoctor.name.trim());
    }
  }

  reviews.forEach((review) => {
    const normalizedName = normalizeDoctorName(
      review.doctorName
    );

    if (normalizedName && !doctors.has(normalizedName)) {
      doctors.set(normalizedName, review.doctorName.trim());
    }
  });

  return Array.from(doctors.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((first, second) =>
      first.name.localeCompare(second.name)
    );
};

const getDateKey = (value: string) => {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) {
    return match[0];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA").format(date);
};


export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<
    AdminReview[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] =
    useState("all");
  const [ratingFilter, setRatingFilter] =
    useState<RatingFilter>("all");
  const [reportFilter, setReportFilter] =
    useState<ReportFilter>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [registeredDoctor, setRegisteredDoctor] =
    useState<Doctor | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] =
    useState<AdminReview | null>(null);

  const [moderationAction, setModerationAction] =
    useState<"hide" | "unhide" | "remove" | null>(null);

  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] =
    useState("");

  const loadReviews = () => {
    setLoading(true);
    setError("");

    try {
      setReviews(getAdminReviews());
    } catch {
      setReviews([]);
      setError(
        "Unable to load reviews right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    try {
      const storedDoctor = localStorage.getItem(
        "registeredDoctor"
      );

      if (storedDoctor) {
        setRegisteredDoctor(
          JSON.parse(storedDoctor) as Doctor
        );
      }
    } catch {
      setRegisteredDoctor(null);
    }

    const handleReviewDataUpdate = () => {
      loadReviews();
    };

    window.addEventListener(
      "storage",
      handleReviewDataUpdate
    );

    window.addEventListener(
      "appointments-updated",
      handleReviewDataUpdate
    );

    window.addEventListener(
      "reviews-updated",
      handleReviewDataUpdate
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleReviewDataUpdate
      );

      window.removeEventListener(
        "appointments-updated",
        handleReviewDataUpdate
      );

      window.removeEventListener(
        "reviews-updated",
        handleReviewDataUpdate
      );
    };
  }, []);

  const doctorOptions = useMemo(
    () => mergeUniqueDoctors(reviews, registeredDoctor),
    [reviews, registeredDoctor]
  );

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return reviews.filter((review) => {
      const matchesSearch =
        !normalizedSearch ||
        review.doctorName
          .toLowerCase()
          .includes(normalizedSearch) ||
        review.patientName
          .toLowerCase()
          .includes(normalizedSearch) ||
        review.appointmentId
          .toLowerCase()
          .includes(normalizedSearch) ||
        review.comment
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDoctor =
        doctorFilter === "all" ||
        review.doctorName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ") ===
          doctorFilter;

      const matchesRating =
        ratingFilter === "all" ||
        review.rating ===
          Number(ratingFilter);

      const matchesReport =
        reportFilter === "all" ||
        (reportFilter === "reported" &&
          review.reported &&
          !review.hidden) ||
        (reportFilter === "visible" &&
          !review.hidden) ||
        (reportFilter === "hidden" &&
          review.hidden);

      const matchesDate =
        !selectedDate ||
        getDateKey(review.createdAt) === selectedDate;

      return (
        matchesSearch &&
        matchesDoctor &&
        matchesRating &&
        matchesReport &&
        matchesDate
      );
    });
  }, [
    reviews,
    searchTerm,
    doctorFilter,
    ratingFilter,
    reportFilter,
    selectedDate,
  ]);

  const totalPages = Math.ceil(
    filteredReviews.length / reviewsPerPage
  );

  const safeCurrentPage =
    totalPages === 0
      ? 1
      : Math.min(currentPage, totalPages);

  const paginatedReviews = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * reviewsPerPage;

    return filteredReviews.slice(
      startIndex,
      startIndex + reviewsPerPage
    );
  }, [filteredReviews, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    doctorFilter,
    ratingFilter,
    reportFilter,
    selectedDate,
  ]);

  const visibleReviews = useMemo(
    () =>
      reviews.filter(
        (review) => !review.hidden
      ),
    [reviews]
  );

  const totalReviews = visibleReviews.length;

  const averageRating = useMemo(() => {
    if (totalReviews === 0) {
      return 0;
    }

    const total = visibleReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return Number(
      (total / totalReviews).toFixed(1)
    );
  }, [totalReviews, visibleReviews]);

  const reportedCount = visibleReviews.filter(
    (review) => review.reported
  ).length;

  const hiddenCount = reviews.filter(
    (review) => review.hidden
  ).length;

  const fiveStarCount = visibleReviews.filter(
    (review) => review.rating === 5
  ).length;

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    doctorFilter !== "all" ||
    ratingFilter !== "all" ||
    reportFilter !== "all" ||
    selectedDate !== "";

  const handleOpenModeration = (
    review: AdminReview,
    action: "hide" | "unhide" | "remove"
  ) => {
    if (action === "hide" && review.hidden) {
      return;
    }

    if (action === "unhide" && !review.hidden) {
      return;
    }

    if (action === "remove" && !review.reported) {
      return;
    }

    setSelectedReview(review);
    setModerationAction(action);
    setModerationError("");
  };

  const handleCloseModeration = () => {
    if (moderating) {
      return;
    }

    setModerationAction(null);
    setModerationError("");
  };

  const handleConfirmModeration = () => {
    if (
      !selectedReview ||
      !moderationAction ||
      moderating
    ) {
      return;
    }

    setModerating(true);
    setModerationError("");

    try {
      const storedAppointments =
        localStorage.getItem("appointments");

      const allAppointments = storedAppointments
        ? (JSON.parse(storedAppointments) as Appointment[])
        : [];

      if (moderationAction === "hide") {
        localStorage.setItem(
          `reviewHidden-${selectedReview.id}`,
          "true"
        );
      } else if (moderationAction === "unhide") {
        localStorage.removeItem(
          `reviewHidden-${selectedReview.id}`
        );
      } else {
        const updatedAppointments =
          allAppointments.map((appointment) =>
            appointment.id ===
            selectedReview.appointmentId
              ? {
                  ...appointment,
                  review: undefined,
                }
              : appointment
          );

        if (storedAppointments) {
          localStorage.setItem(
            "appointments",
            JSON.stringify(updatedAppointments)
          );

          window.dispatchEvent(
            new Event("appointments-updated")
          );
        }

        localStorage.setItem(
          `reviewRemoved-${selectedReview.id}`,
          "true"
        );

        localStorage.removeItem(
          `reviewReported-${selectedReview.id}`
        );
        localStorage.removeItem(
          `reviewReportReason-${selectedReview.id}`
        );
        localStorage.removeItem(
          `reviewHidden-${selectedReview.id}`
        );
      }

      window.dispatchEvent(
        new Event("reviews-updated")
      );

      setModerationAction(null);
      setSelectedReview(null);
      loadReviews();
    } catch (error) {
      setModerationError(
        error instanceof Error
          ? error.message
          : "Unable to update this review."
      );
    } finally {
      setModerating(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDoctorFilter("all");
    setRatingFilter("all");
    setReportFilter("all");
    setSelectedDate("");
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold text-emerald-600">
          Admin Portal
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Reviews
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Manage doctor reviews, ratings and reported
          feedback.
        </p>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Reviews
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalReviews}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Visible reviews
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">
            Average Rating
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-3xl font-bold text-emerald-800">
              {averageRating.toFixed(1)}
            </p>
            <span className="text-lg tracking-wide text-amber-500">
              ★
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            Across visible reviews
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">
            Reported Reviews
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-800">
            {reportedCount}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Need admin attention
          </p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Hidden Reviews
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {hiddenCount}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Not visible to patients
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-purple-700">
            5-Star Reviews
          </p>
          <p className="mt-2 text-3xl font-bold text-purple-800">
            {fiveStarCount}
          </p>
          <p className="mt-1 text-xs text-purple-700">
            Visible five-star ratings
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Search & Filters
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Filter reviews by doctor, rating, report status
            or date.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-3">
            <label
              htmlFor="review-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search
            </label>

            <input
              id="review-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search doctor, patient, appointment or comment..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="review-doctor-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Doctor
            </label>

            <select
              id="review-doctor-filter"
              value={doctorFilter}
              onChange={(event) =>
                setDoctorFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">
                All Doctors
              </option>

              {doctorOptions.map((doctor) => (
                <option
                  key={doctor.id}
                  value={doctor.id}
                >
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="review-rating-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Rating
            </label>

            <select
              id="review-rating-filter"
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(
                  event.target.value as RatingFilter
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">
                All Ratings
              </option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="review-report-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Review Status
            </label>

            <select
              id="review-report-filter"
              value={reportFilter}
              onChange={(event) =>
                setReportFilter(
                  event.target.value as ReportFilter
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">
                All Reviews
              </option>
              <option value="reported">
                Reported
              </option>
              <option value="visible">
                Visible
              </option>
              <option value="hidden">
                Hidden
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="review-date-filter"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Date
            </label>

            <input
              id="review-date-filter"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredReviews.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {reviews.length}
            </span>{" "}
            reviews
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Doctor Reviews
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review patient ratings and feedback linked to
            completed appointments.
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">
              Loading reviews...
            </p>
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={loadReviews}
              className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-2xl">
              ★
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-800">
              No reviews found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {hasActiveFilters
                ? "Try changing or clearing the filters."
                : "Reviews from completed appointments will appear here."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Doctor
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Rating
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Review
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="align-top transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {review.doctorName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.doctorId}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {review.patientName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {review.patientId}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p
                          className="text-lg tracking-wide text-amber-500"
                          aria-label={`${review.rating} out of 5 stars`}
                        >
                          {getStars(review.rating)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {review.rating}/5
                        </p>
                      </td>

                      <td className="max-w-xs px-6 py-4">
                        <p className="line-clamp-2 text-sm text-slate-700">
                          {review.comment ||
                            "No written comment."}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">
                          {formatDate(
                            review.createdAt
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {review.hidden ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Hidden
                          </span>
                        ) : review.reported ? (
                          <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            Reported
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Visible
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReview(review)
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            View Details
                          </button>

                          {review.hidden ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenModeration(
                                  review,
                                  "unhide"
                                )
                              }
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Unhide
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenModeration(
                                  review,
                                  "hide"
                                )
                              }
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              Hide
                            </button>
                          )}

                          {review.reported &&
                            !review.hidden && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenModeration(
                                    review,
                                    "remove"
                                  )
                                }
                                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(safeCurrentPage - 1) *
                      reviewsPerPage +
                      1}
                  </span>
                  {"–"}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      safeCurrentPage *
                        reviewsPerPage,
                      filteredReviews.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredReviews.length}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(page - 1, 1)
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                    Page {safeCurrentPage} of{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          page + 1,
                          totalPages
                        )
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-details-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReview(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Review Details
                </p>

                <h2
                  id="review-details-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selectedReview.doctorName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDateTime(
                    selectedReview.createdAt
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReview(null)
                }
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close review details"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Doctor
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {selectedReview.doctorName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedReview.doctorId}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Patient
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {selectedReview.patientName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedReview.patientId}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rating
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl tracking-wide text-amber-500">
                    {getStars(
                      selectedReview.rating
                    )}
                  </span>

                  <span className="text-sm font-semibold text-slate-600">
                    {selectedReview.rating}/5
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Patient Review
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedReview.comment ||
                    "No written comment."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Review Status
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedReview.hidden && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Hidden
                    </span>
                  )}

                  {selectedReview.reported && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Reported
                    </span>
                  )}

                  {!selectedReview.hidden &&
                    !selectedReview.reported && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Visible
                      </span>
                    )}
                </div>

                {selectedReview.reportReason && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                      Report Reason
                    </p>
                    <p className="mt-2 text-sm text-red-800">
                      {selectedReview.reportReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Appointment
                </p>

                <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                  {selectedReview.appointmentId}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Review date:{" "}
                  {formatDateTime(
                    selectedReview.createdAt
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                {selectedReview.hidden ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenModeration(
                        selectedReview,
                        "unhide"
                      )
                    }
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Unhide Review
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenModeration(
                        selectedReview,
                        "hide"
                      )
                    }
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Hide Review
                  </button>
                )}

                {selectedReview.reported &&
                  !selectedReview.hidden && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenModeration(
                          selectedReview,
                          "remove"
                        )
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Remove Reported Review
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReview && moderationAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-moderation-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !moderating
            ) {
              handleCloseModeration();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Admin Action
            </p>

            <h2
              id="review-moderation-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {moderationAction === "hide"
                ? "Hide review?"
                : moderationAction === "unhide"
                  ? "Unhide review?"
                  : "Remove reported review?"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {moderationAction === "hide"
                ? "This review will be hidden from the visible review list. The original appointment and review data will remain intact."
                : moderationAction === "unhide"
                  ? "This review will become visible again in the review list. The original appointment and review data will remain intact."
                  : "This removes the reported review from the related appointment. The rating and comment will no longer appear in review calculations."}
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {selectedReview.doctorName}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {selectedReview.patientName} ·{" "}
                {selectedReview.rating}/5
              </p>

              {selectedReview.comment && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                  {selectedReview.comment}
                </p>
              )}
            </div>

            {moderationError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {moderationError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseModeration}
                disabled={moderating}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmModeration}
                disabled={moderating}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  moderationAction === "remove"
                    ? "bg-red-600 hover:bg-red-700"
                    : moderationAction === "unhide"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {moderating
                  ? "Processing..."
                  : moderationAction === "remove"
                    ? "Confirm Remove"
                    : moderationAction === "unhide"
                      ? "Confirm Unhide"
                      : "Confirm Hide"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
