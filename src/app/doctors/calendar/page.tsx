"use client";

import {
  DragEvent,
   useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import type { Appointment } from "@/types/appointment";
import type { AvailabilitySlot } from "@/types/availability";

type CalendarView = "day" | "week" | "month";

type Doctor = {
  id: string;
  name: string;
};

type CalendarData = {
  doctor: Doctor | null;
  appointments: Appointment[];
  availability: AvailabilitySlot[];
};

const EMPTY_CALENDAR_DATA: CalendarData = {
  doctor: null,
  appointments: [],
  availability: [],
};

let cachedCalendarData = EMPTY_CALENDAR_DATA;
let cachedStorageSnapshot = "";

function getCalendarData(): CalendarData {
  if (typeof window === "undefined") {
    return EMPTY_CALENDAR_DATA;
  }

  const storedDoctor =
    localStorage.getItem("loggedInDoctor") ||
    localStorage.getItem("registeredDoctor");

  const storedAppointments =
    localStorage.getItem("appointments") || "";

  const currentDoctor = storedDoctor
    ? (JSON.parse(storedDoctor) as Doctor)
    : null;

  const availabilityKey = currentDoctor
    ? `availabilitySlots-${currentDoctor.id}`
    : "";

  const storedAvailability = availabilityKey
    ? localStorage.getItem(availabilityKey) || ""
    : "";

  const storageSnapshot = [
    storedDoctor || "",
    storedAppointments,
    storedAvailability,
  ].join("|");

  if (storageSnapshot === cachedStorageSnapshot) {
    return cachedCalendarData;
  }

  cachedStorageSnapshot = storageSnapshot;

  if (!currentDoctor) {
    cachedCalendarData = EMPTY_CALENDAR_DATA;
    return cachedCalendarData;
  }

  try {
    let doctorAppointments: Appointment[] = [];

    if (storedAppointments) {
      const allAppointments = JSON.parse(
        storedAppointments,
      ) as Appointment[];

      doctorAppointments = allAppointments.filter(
        (appointment) =>
          appointment.clinician.trim().toLowerCase() ===
          currentDoctor.name.trim().toLowerCase(),
      );
    }

    let doctorAvailability: AvailabilitySlot[] = [];

    if (storedAvailability) {
      const allSlots = JSON.parse(
        storedAvailability,
      ) as AvailabilitySlot[];

      doctorAvailability = allSlots.filter(
        (slot) => slot.doctorId === currentDoctor.id,
      );
    }

    cachedCalendarData = {
      doctor: currentDoctor,
      appointments: doctorAppointments,
      availability: doctorAvailability,
    };

    return cachedCalendarData;
  } catch {
    cachedCalendarData = EMPTY_CALENDAR_DATA;
    return cachedCalendarData;
  }
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
}

function getServerCalendarData() {
  return EMPTY_CALENDAR_DATA;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStartOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - day);

  return result;
}

function getWeekDates(date: Date) {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const result = new Date(start);
    result.setDate(start.getDate() + index);

    return result;
  });
}

function getMonthDates(date: Date) {
  const firstDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  );

  const startDate = new Date(firstDay);

  startDate.setDate(
    firstDay.getDate() - firstDay.getDay(),
  );

  const endDate = new Date(lastDay);

  endDate.setDate(
    lastDay.getDate() + (6 - lastDay.getDay()),
  );

  const dates: Date[] = [];

  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatAppointmentTime(startsAt: string) {
  return new Date(startsAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createStartsAt(
  date: string,
  time: string,
) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export default function DoctorCalendarPage() {
  const [view, setView] =
    useState<CalendarView>("week");

  const [selectedDate, setSelectedDate] = useState(
    new Date(),
  );
  const [currentTime] = useState(
  () => Date.now(),
);

  const [selectedTime, setSelectedTime] = useState<string | null>(
  null,
);
  
useEffect(() => {
  const timer = window.setTimeout(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    const dateParam = params.get("date");
    const timeParam = params.get("time");

    if (!dateParam) {
      return;
    }

    const appointmentDate = new Date(
      `${dateParam}T00:00:00`,
    );

    if (Number.isNaN(appointmentDate.getTime())) {
      return;
    }

    setSelectedDate(appointmentDate);
    setSelectedTime(timeParam);
    setView("day");
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, []);

  const [draggedAppointmentId, setDraggedAppointmentId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");

  const calendarData = useSyncExternalStore(
    subscribeToStorage,
    getCalendarData,
    getServerCalendarData,
  );

  const {
    doctor,
    appointments,
    availability,
  } = calendarData;

  const todayKey = formatDateKey(new Date());

  function goPrevious() {
    const newDate = new Date(selectedDate);

    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1);
    }

    if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    }

    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    }

    setSelectedDate(newDate);
  }

  function goNext() {
    const newDate = new Date(selectedDate);

    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1);
    }

    if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    }

    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    setSelectedDate(newDate);
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  function getAppointmentsForDate(date: Date) {
    const dateKey = formatDateKey(date);

    return appointments.filter(
      (appointment) =>
        formatDateKey(
          new Date(appointment.startsAt),
        ) === dateKey,
    );
  }

  function getAvailabilityForDate(date: Date) {
    const dateKey = formatDateKey(date);

    return availability.filter(
      (slot) => slot.date === dateKey,
    );
  }

  function canDragAppointment(
    appointment: Appointment,
  ) {
    if (
      appointment.status !== "confirmed" &&
      appointment.status !== "upcoming"
    ) {
      return false;
    }

    return new Date(appointment.startsAt) > new Date();
  }

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    appointment: Appointment,
  ) {
    if (!canDragAppointment(appointment)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData(
      "appointmentId",
      appointment.id,
    );

    event.dataTransfer.effectAllowed = "move";

    setDraggedAppointmentId(appointment.id);
    setMessage("");
  }

  function handleDragEnd() {
    setDraggedAppointmentId(null);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    slot: AvailabilitySlot,
  ) {
    if (slot.status !== "available") {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    targetSlot: AvailabilitySlot,
  ) {
    event.preventDefault();

    setDraggedAppointmentId(null);
    setMessage("");

    if (targetSlot.status !== "available") {
      setMessage(
        "This slot is already booked.",
      );
      return;
    }

    const appointmentId =
      event.dataTransfer.getData(
        "appointmentId",
      );

    if (!appointmentId) {
      return;
    }

    const currentAppointmentsRaw =
      localStorage.getItem("appointments");

    const currentAvailabilityRaw =
      localStorage.getItem(
        `availabilitySlots-${targetSlot.doctorId}`,
      );

    if (
      !currentAppointmentsRaw ||
      !currentAvailabilityRaw
    ) {
      setMessage(
        "Unable to reschedule appointment.",
      );
      return;
    }

    try {
      const currentAppointments =
        JSON.parse(
          currentAppointmentsRaw,
        ) as Appointment[];

      const currentAvailability =
        JSON.parse(
          currentAvailabilityRaw,
        ) as AvailabilitySlot[];

      const appointmentIndex =
        currentAppointments.findIndex(
          (appointment) =>
            appointment.id === appointmentId,
        );

      if (appointmentIndex === -1) {
        setMessage(
          "Appointment could not be found.",
        );
        return;
      }

      const appointment =
        currentAppointments[appointmentIndex];

      if (!canDragAppointment(appointment)) {
        setMessage(
          "Only confirmed or upcoming appointments can be rescheduled.",
        );
        return;
      }

      const latestTargetSlot =
        currentAvailability.find(
          (slot) =>
            slot.id === targetSlot.id,
        );

      if (
        !latestTargetSlot ||
        latestTargetSlot.status !== "available"
      ) {
        setMessage(
          "This slot is no longer available.",
        );
        return;
      }

      const oldStartDate =
        new Date(appointment.startsAt);

      const oldDate = formatDateKey(
        oldStartDate,
      );

      const oldTime =
        oldStartDate.toTimeString().slice(0, 5);

      const oldSlotIndex =
        currentAvailability.findIndex(
          (slot) =>
            slot.doctorId === targetSlot.doctorId &&
            slot.date === oldDate &&
            slot.startTime === oldTime &&
            slot.status === "booked",
        );

      const newStartsAt = createStartsAt(
        latestTargetSlot.date,
        latestTargetSlot.startTime,
      );

      currentAppointments[
        appointmentIndex
      ] = {
        ...appointment,
        startsAt: newStartsAt,
      };

      const targetSlotIndex =
        currentAvailability.findIndex(
          (slot) =>
            slot.id === latestTargetSlot.id,
        );

      currentAvailability[targetSlotIndex] = {
        ...latestTargetSlot,
        status: "booked",
      };

      if (
        oldSlotIndex !== -1 &&
        oldSlotIndex !== targetSlotIndex
      ) {
        currentAvailability[oldSlotIndex] = {
          ...currentAvailability[oldSlotIndex],
          status: "available",
        };
      }

      localStorage.setItem(
        "appointments",
        JSON.stringify(currentAppointments),
      );

      localStorage.setItem(
        `availabilitySlots-${targetSlot.doctorId}`,
        JSON.stringify(currentAvailability),
      );

      setMessage(
        `Appointment rescheduled to ${latestTargetSlot.date} at ${latestTargetSlot.startTime}.`,
      );

      window.dispatchEvent(
        new Event("storage"),
      );
    } catch {
      setMessage(
        "Something went wrong while rescheduling.",
      );
    }
  }
const upcomingAppointments = appointments
  .filter(
    (appointment) =>
      new Date(appointment.startsAt).getTime() >
        currentTime &&
      appointment.status !== "cancelled" &&
      appointment.status !== "missed" &&
      appointment.status !== "completed"
  )
  .sort(
    (first, second) =>
      new Date(first.startsAt).getTime() -
      new Date(second.startsAt).getTime()
  );

  const weekDates = getWeekDates(selectedDate);
  const monthDates = getMonthDates(selectedDate);

  return (
    <main className="min-h-screen bg-[#f7faf9] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Calendar
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage your appointments and availability.
            </p>

            {doctor && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {doctor.name}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevious}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                ←
              </button>

              <button
                type="button"
                onClick={goToday}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Today
              </button>

              <button
                type="button"
                onClick={goNext}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                →
              </button>

              <div className="ml-2 text-sm font-semibold text-slate-800">
                {view === "month" &&
                  selectedDate.toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    },
                  )}

                {view === "day" &&
                  formatDisplayDate(selectedDate)}

                {view === "week" &&
                  `${formatDisplayDate(
                    weekDates[0],
                  )} - ${formatDisplayDate(
                    weekDates[6],
                  )}`}
              </div>
            </div>

            <div className="flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
              {(
                ["day", "week", "month"] as CalendarView[]
              ).map((calendarView) => (
                <button
                  key={calendarView}
                  type="button"
                  onClick={() =>
                    setView(calendarView)
                  }
                  className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                    view === calendarView
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {calendarView}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reschedule Message */}
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm transition-colors duration-200">
            {message}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-slate-500">
              Appointments
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {appointments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
  <div className="flex items-center justify-between gap-3">
  <p className="text-sm font-semibold text-emerald-800">
    Upcoming Appointments
  </p>

  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
    {upcomingAppointments.length}
  </span>
</div>

  {upcomingAppointments.length === 0 ? (
    <p className="mt-3 text-sm text-slate-500">
      No upcoming appointments.
    </p>
  ) : (
   <div className="mt-3 max-h-56 space-y-3 overflow-y-auto pr-1">
      {upcomingAppointments.map((appointment) => (
       <div
  key={appointment.id}
  onClick={() => {
    setSelectedDate(new Date(appointment.startsAt));
    setSelectedTime(
      new Date(appointment.startsAt)
        .toTimeString()
        .slice(0, 5)
    );
    setView("day");
  }}
  className="cursor-pointer rounded-xl border border-emerald-100 bg-white/60 p-4 transition hover:border-emerald-300 hover:bg-white/80"
>
          <p className="text-sm font-semibold text-slate-900">
            {appointment.patient.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {formatDisplayDate(
              new Date(appointment.startsAt)
            )}{" "}
            ·{" "}
            {formatAppointmentTime(
              appointment.startsAt
            )}
          </p>

          <p className="mt-1 text-xs font-medium capitalize text-emerald-700">
            {appointment.status}
          </p>

          <p className="mt-2 text-xs text-slate-500">
  {appointment.reason} · {appointment.durationMinutes} min
</p>
        </div>
      ))}
    </div>
  )}
</div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <p className="text-sm text-slate-500">
              Availability Slots
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {availability.length}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          {/* Month View */}
          {view === "month" && (
            <div>
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDates.map((date) => {
                  const dateKey =
                    formatDateKey(date);

                  const dayAppointments =
                    getAppointmentsForDate(date);

                  const dayAvailability =
                    getAvailabilityForDate(date);

                  const isCurrentMonth =
                    date.getMonth() ===
                      selectedDate.getMonth() &&
                    date.getFullYear() ===
                      selectedDate.getFullYear();

                  const isToday =
                    dateKey === todayKey;

                  return (
                    <div
                      key={dateKey}
                      className={`min-h-[150px] border-b border-r border-slate-200 p-2 align-top transition-colors duration-200 ${
                        !isCurrentMonth
                          ? "bg-slate-50/60"
                          : "bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setView("day");
                        }}
                        className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
                          isToday
                            ? "bg-emerald-600 text-white"
                            : isCurrentMonth
                              ? "text-slate-700"
                              : "text-slate-400"
                        }`}
                      >
                        {date.getDate()}
                      </button>

                      <div className="space-y-1">
                        {dayAppointments.map(
                          (appointment) => (
                            <div
                              key={appointment.id}
                              draggable={canDragAppointment(
                                appointment,
                              )}
                              onDragStart={(event) =>
                                handleDragStart(
                                  event,
                                  appointment,
                                )
                              }
                              onDragEnd={
                                handleDragEnd
                              }
                              className={`rounded-lg border p-2 text-[11px] transition-all duration-200 hover:shadow-sm ${
                                canDragAppointment(
                                  appointment,
                                )
                                  ? "cursor-grab border-blue-200 bg-blue-50 text-blue-700 active:cursor-grabbing"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                              } ${
                                draggedAppointmentId ===
                                appointment.id
                                  ? "opacity-50"
                                  : ""
                              }`}
                            >
                              <p className="font-semibold">
                                {formatAppointmentTime(
                                  appointment.startsAt,
                                )}
                              </p>

                              <p className="truncate">
                                {
                                  appointment.patient
                                    .name
                                }
                              </p>

                              <p className="capitalize">
                                {
                                  appointment.status
                                }
                              </p>
                            </div>
                          ),
                        )}

                        {dayAvailability.map(
                          (slot) => (
                            <div
                              key={slot.id}
                              onDragOver={(event) =>
                                handleDragOver(
                                  event,
                                  slot,
                                )
                              }
                              onDrop={(event) =>
                                handleDrop(
                                  event,
                                  slot,
                                )
                              }
                              className={`rounded-lg border p-2 text-[11px] transition-all duration-200 hover:shadow-sm ${
                                slot.status ===
                                "available"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              <p className="font-semibold">
                                {slot.startTime} -{" "}
                                {slot.endTime}
                              </p>

                              <p className="capitalize">
                                {slot.status}
                              </p>

                              {slot.status ===
                                "available" &&
                                draggedAppointmentId && (
                                  <p className="mt-1 text-[10px] font-semibold">
                                    Drop here
                                  </p>
                                )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {view === "week" && (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {weekDates.map((date) => {
                    const dateKey =
                      formatDateKey(date);

                    const isToday =
                      dateKey === todayKey;

                    return (
                      <div
                        key={dateKey}
                        className="border-r border-slate-200 p-3 text-center last:border-r-0"
                      >
                        <p className="text-xs font-medium text-slate-500">
                          {date.toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                            },
                          )}
                        </p>

                        <p
                          className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                            isToday
                              ? "bg-emerald-600 text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {date.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-7">
                  {weekDates.map((date) => {
                    const dateKey =
                      formatDateKey(date);

                    const dayAppointments =
                      getAppointmentsForDate(date);

                    const dayAvailability =
                      getAvailabilityForDate(date);

                    return (
                      <div
                        key={dateKey}
                        className="min-h-[500px] border-r border-slate-200 p-3 last:border-r-0"
                      >
                        <div className="space-y-2">
                          {dayAppointments.map(
                            (appointment) => (
                              <div
                                key={appointment.id}
                                draggable={canDragAppointment(
                                  appointment,
                                )}
                                onDragStart={(event) =>
                                  handleDragStart(
                                    event,
                                    appointment,
                                  )
                                }
                                onDragEnd={
                                  handleDragEnd
                                }
                                className={`rounded-lg border p-2 transition-all duration-200 hover:shadow-sm ${
                                  canDragAppointment(
                                    appointment,
                                  )
                                    ? "cursor-grab border-blue-200 bg-blue-50 active:cursor-grabbing"
                                    : "border-slate-200 bg-slate-100"
                                } ${
                                  draggedAppointmentId ===
                                  appointment.id
                                    ? "opacity-50"
                                    : ""
                                }`}
                              >
                                <p className="text-xs font-semibold text-blue-800">
                                  {formatAppointmentTime(
                                    appointment.startsAt,
                                  )}
                                </p>

                                <p className="mt-1 truncate text-xs font-medium text-slate-800">
                                  {
                                    appointment.patient
                                      .name
                                  }
                                </p>

                                <p className="mt-1 text-[10px] capitalize text-blue-700">
                                  {
                                    appointment.status
                                  }
                                </p>
                              </div>
                            ),
                          )}

                          {dayAvailability.map(
                            (slot) => (
                              <div
                                key={slot.id}
                                onDragOver={(event) =>
                                  handleDragOver(
                                    event,
                                    slot,
                                  )
                                }
                                onDrop={(event) =>
                                  handleDrop(
                                    event,
                                    slot,
                                  )
                                }
                                className={`rounded-lg border p-2 transition-all duration-200 hover:shadow-sm ${
                                  slot.status ===
                                  "available"
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-slate-200 bg-slate-100"
                                }`}
                              >
                                <p className="text-xs font-semibold text-slate-800">
                                  {slot.startTime} -{" "}
                                  {slot.endTime}
                                </p>

                                <p
                                  className={`mt-1 text-[10px] font-medium capitalize ${
                                    slot.status ===
                                    "available"
                                      ? "text-emerald-700"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {slot.status}
                                </p>

                                {slot.status ===
                                  "available" &&
                                  draggedAppointmentId && (
                                    <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                                      Drop appointment
                                      here
                                    </p>
                                  )}
                              </div>
                            ),
                          )}

                          {dayAppointments.length ===
                            0 &&
                            dayAvailability.length ===
                              0 && (
                              <p className="pt-4 text-center text-xs text-slate-400">
                                No events
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Day View */}
          {view === "day" && (
            <div>
              <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {getAppointmentsForDate(
                  selectedDate,
                ).map((appointment) => (
                  <div
                    key={appointment.id}
                    draggable={canDragAppointment(
                      appointment,
                    )}
                    onDragStart={(event) =>
                      handleDragStart(
                        event,
                        appointment,
                      )
                    }
                    onDragEnd={handleDragEnd}
                    className={`flex flex-col gap-3 border-b border-slate-100 p-5 transition-colors duration-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                      canDragAppointment(
                        appointment,
                      )
                        ? "cursor-grab active:cursor-grabbing"
                        : ""
                    } ${
                      draggedAppointmentId ===
                      appointment.id
                        ? "opacity-50"
                        : ""
                    }${
  selectedTime ===
  new Date(appointment.startsAt)
    .toTimeString()
    .slice(0, 5)
    ? "bg-emerald-50"
    : ""
}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatAppointmentTime(
                          appointment.startsAt,
                        )}
                      </p>

                      <p className="mt-1 font-medium text-slate-800">
                        {appointment.patient.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.reason}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700 transition-colors duration-200">
                      {appointment.status}
                    </span>
                  </div>
                ))}

                {getAvailabilityForDate(
                  selectedDate,
                ).map((slot) => (
                  <div
                    key={slot.id}
                    onDragOver={(event) =>
                      handleDragOver(event, slot)
                    }
                    onDrop={(event) =>
                      handleDrop(event, slot)
                    }
                    className={`border-b border-slate-100 p-5 transition-colors duration-200 hover:bg-slate-50 ${
                      slot.status === "available"
                        ? "bg-emerald-50/40"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {slot.startTime} -{" "}
                          {slot.endTime}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Doctor availability
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors duration-200 ${
                          slot.status === "available"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>

                    {slot.status === "available" &&
                      draggedAppointmentId && (
                        <p className="mt-2 text-xs font-semibold text-emerald-700">
                          Drop appointment here
                        </p>
                      )}
                  </div>
                ))}

                {getAppointmentsForDate(
                  selectedDate,
                ).length === 0 &&
                  getAvailabilityForDate(
                    selectedDate,
                  ).length === 0 && (
                    <div className="rounded-xl bg-slate-50 p-10 text-center transition-colors duration-200">
                      <p className="text-sm text-slate-500">
                        No appointments or availability
                        for this day.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </section>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-100 ring-1 ring-blue-200" />
            Draggable appointment
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-100 ring-1 ring-emerald-200" />
            Available drop slot
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-100 ring-1 ring-slate-200" />
            Read-only / booked
          </div>
        </div>
      </div>
    </main>
  );
}