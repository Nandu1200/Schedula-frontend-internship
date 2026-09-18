"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import type { Appointment } from "@/types/appointment";

export default function DoctorRatingsPage() {
  const appointments = useAppSelector(
    (state) => state.appointments.appointments
  );

  const doctorAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) => appointment.status === "completed"
    );
  }, [appointments]);

  const reviewedAppointments = useMemo(() => {
    return doctorAppointments.filter(
      (appointment) =>
        appointment.review &&
        appointment.review.rating >= 1 &&
        appointment.review.rating <= 5
    );
  }, [doctorAppointments]);

  const ratingAnalyzer = useMemo(() => {
    const totalReviews = reviewedAppointments.length;

    const averageRating =
      totalReviews > 0
        ? reviewedAppointments.reduce(
            (sum, appointment) =>
              sum + (appointment.review?.rating ?? 0),
            0
          ) / totalReviews
        : 0;

    const starDistribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviewedAppointments.filter(
        (appointment) => appointment.review?.rating === star
      ).length;

      const percentage =
        totalReviews > 0 ? (count / totalReviews) * 100 : 0;

      return {
        star,
        count,
        percentage,
      };
    });

    const monthlyRatings = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();

      date.setMonth(date.getMonth() - (5 - index));

      const year = date.getFullYear();
      const month = date.getMonth();

      const monthReviews = reviewedAppointments.filter((appointment) => {
        if (!appointment.review) return false;

        const appointmentDate = new Date(appointment.startsAt);

        return (
          appointmentDate.getFullYear() === year &&
          appointmentDate.getMonth() === month
        );
      });

      const average =
        monthReviews.length > 0
          ? monthReviews.reduce(
              (sum, appointment) =>
                sum + (appointment.review?.rating ?? 0),
              0
            ) / monthReviews.length
          : 0;

      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
        }),
        average,
        count: monthReviews.length,
      };
    });

    const recentReviews = [...reviewedAppointments]
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() -
          new Date(a.startsAt).getTime()
      )
      .slice(0, 10);

    return {
      totalReviews,
      averageRating,
      starDistribution,
      monthlyRatings,
      recentReviews,
    };
  }, [reviewedAppointments]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/doctors/dashboard"
                className="transition hover:text-emerald-600"
              >
                Doctor Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-700">Ratings</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Patient Ratings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Analyze your patient feedback, ratings, and review trends.
            </p>
          </div>

          <Link
            href="/doctors/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Summary Cards */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Average Rating
            </p>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {ratingAnalyzer.averageRating > 0
                  ? ratingAnalyzer.averageRating.toFixed(1)
                  : "0.0"}
              </span>

              <div>
                <div className="flex text-lg text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index}>
                      {index <
                      Math.round(ratingAnalyzer.averageRating)
                        ? "★"
                        : "☆"}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  Overall patient rating
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Reviews
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {ratingAnalyzer.totalReviews}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Patient reviews received
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              5 Star Reviews
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {ratingAnalyzer.starDistribution.find(
                (item) => item.star === 5
              )?.count ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Excellent patient feedback
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Latest Feedback
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {ratingAnalyzer.recentReviews.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Recent reviews available
            </p>
          </div>
        </section>

        {/* Star Distribution */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Star Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Breakdown of patient ratings from 1 to 5 stars.
            </p>
          </div>

          <div className="space-y-4">
            {ratingAnalyzer.starDistribution.map((item) => (
              <div
                key={item.star}
                className="grid grid-cols-[70px_1fr_50px] items-center gap-3"
              >
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                  <span>{item.star}</span>
                  <span className="text-amber-400">★</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <span className="text-right text-sm font-semibold text-slate-700">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Rating Trend */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Monthly Rating Trend
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Average patient rating over the last six months.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {ratingAnalyzer.monthlyRatings.map((month) => (
              <div
                key={month.label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"
              >
                <p className="text-sm font-semibold text-slate-600">
                  {month.label}
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {month.average > 0
                    ? month.average.toFixed(1)
                    : "—"}
                </p>

                <div className="mt-1 text-sm text-amber-400">
                  {month.average > 0 ? "★" : "☆"}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {month.count}{" "}
                  {month.count === 1 ? "review" : "reviews"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Patient Reviews */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Patient Reviews
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest feedback submitted by your patients.
            </p>
          </div>

          {ratingAnalyzer.recentReviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <div className="text-4xl">⭐</div>

              <h3 className="mt-3 text-base font-semibold text-slate-900">
                No reviews yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Patient reviews will appear here after completed
                appointments are reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratingAnalyzer.recentReviews.map(
                (appointment: Appointment) => {
                  const review = appointment.review;

                  if (!review) return null;

                  return (
                    <div
                      key={appointment.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            {getInitials(
                              appointment.patient.name
                            )}
                          </div>

                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {appointment.patient.name}
                            </h3>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {new Date(
                                appointment.startsAt
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex text-lg text-amber-400">
                            {Array.from({ length: 5 }).map(
                              (_, index) => (
                                <span key={index}>
                                  {index < review.rating
                                    ? "★"
                                    : "☆"}
                                </span>
                              )
                            )}
                          </div>

                          <span className="text-sm font-semibold text-slate-700">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>

                      {review.comment ? (
                        <p className="mt-4 rounded-lg bg-white p-3 text-sm leading-6 text-slate-600">
                          “{review.comment}”
                        </p>
                      ) : (
                        <p className="mt-4 text-sm italic text-slate-400">
                          No written comment provided.
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}