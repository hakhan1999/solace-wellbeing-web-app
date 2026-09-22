"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useSolace } from "@/lib/solace/store";
import { Action, Heading } from "./ui";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ActivityCalendar() {
  const { data, clientId } = useSolace();

  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Only activities: assessments and sessions are excluded.
  const activities = data.events
    .filter((activity) => {
      if (activity.type !== "Activity") return false;

      const engagement = data.engagements.find(
        (item) => item.id === activity.engagementId
      );

      return (
        !!engagement &&
        (clientId === "all" || engagement.clientId === clientId)
      );
    })
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );

  const todayKey = dateKey(new Date());
  const monthPrefix = dateKey(month).slice(0, 7);

  const monthActivities = activities.filter((activity) =>
    activity.date.startsWith(monthPrefix)
  );

  // Monday-first calendar, with enough rows for the selected month.
  const offset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();

  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;

  const days = Array.from(
    { length: cellCount },
    (_, index) =>
      new Date(
        month.getFullYear(),
        month.getMonth(),
        index - offset + 1
      )
  );

  const selectedActivity = activities.find(
    (activity) => activity.id === selectedId
  );

  const selectedEngagement = data.engagements.find(
    (item) => item.id === selectedActivity?.engagementId
  );

  const selectedClient = data.clients.find(
    (item) => item.id === selectedEngagement?.clientId
  );

  const selectedEmployees = selectedActivity
    ? data.employees.filter((employee) => {
        if (employee.clientId !== selectedEngagement?.clientId) {
          return false;
        }

        if (selectedActivity.assignedEmployeeIds !== undefined) {
          return selectedActivity.assignedEmployeeIds.includes(employee.id);
        }

        // Support older activities that used audience rules.
        return (
          employee.status === "Active" &&
          employee.engagementId === selectedActivity.engagementId &&
          (selectedActivity.audience === "All employees" ||
            employee.department === selectedActivity.audience)
        );
      })
    : [];

  function changeMonth(direction: number) {
    setMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + direction,
          1
        )
    );
  }

  function goToToday() {
    const today = new Date();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <>
      <Heading
        eyebrow="YOUR ACTIVITY SCHEDULE"
        title="Calendar"
        description="See scheduled activities across your engagements."
      />

      <section className="solace-calendar">
        <div className="solace-calendar-toolbar">
          <div>
            <h2 aria-live="polite">
              {month.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <p>
              {monthActivities.length}{" "}
              {monthActivities.length === 1 ? "activity" : "activities"}{" "}
              this month
            </p>
          </div>

          <div className="solace-calendar-controls">
            <Action secondary onClick={goToToday}>
              Today
            </Action>

            <button
              type="button"
              className="solace-calendar-nav"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="solace-calendar-nav"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          className="solace-calendar-scroll"
          role="region"
          aria-label="Monthly activity calendar"
          tabIndex={0}
        >
          <div className="solace-calendar-weekdays">
            {weekdays.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div className="solace-calendar-grid">
            {days.map((date) => {
              const key = dateKey(date);
              const isCurrentMonth = date.getMonth() === month.getMonth();
              const isToday = key === todayKey;

              const dayActivities = activities.filter(
                (activity) => activity.date === key
              );

              return (
                <div
                  key={key}
                  className={[
                    "solace-calendar-day",
                    !isCurrentMonth ? "outside-month" : "",
                    isToday ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <time
                    dateTime={key}
                    className="solace-calendar-day-number"
                    aria-current={isToday ? "date" : undefined}
                    aria-label={formatDate(key)}
                  >
                    {date.getDate()}
                  </time>

                  <div className="solace-calendar-events">
                    {dayActivities.map((activity) => {
                      const engagement = data.engagements.find(
                        (item) => item.id === activity.engagementId
                      );

                      return (
                        <button
                          key={activity.id}
                          type="button"
                          className="solace-calendar-event"
                          onClick={() => setSelectedId(activity.id)}
                          aria-label={`${activity.name}, ${formatDate(
                            activity.date
                          )}, ${activity.time}, ${engagement?.name || ""}`}
                        >
                          <span className="solace-calendar-event-time">
                            {activity.time}
                          </span>

                          <strong>{activity.name}</strong>
                          <small>{engagement?.name}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {monthActivities.length === 0 && (
          <div className="solace-calendar-empty">
            No activities scheduled this month. Choose another month or add
            an activity inside an engagement.
          </div>
        )}
      </section>

      <Dialog
        open={!!selectedActivity}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className="form-dialog">
          <DialogHeader>
            <DialogTitle>
              {selectedActivity?.name || "Activity details"}
            </DialogTitle>

            <DialogDescription>
              {selectedActivity &&
                `${formatDate(selectedActivity.date)} · ${
                  selectedActivity.time
                }`}
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <>
              <dl className="solace-calendar-details">
                <div>
                  <dt>Corporate client</dt>
                  <dd>{selectedClient?.name || "—"}</dd>
                </div>

                <div>
                  <dt>Engagement</dt>
                  <dd>{selectedEngagement?.name || "—"}</dd>
                </div>

                <div>
                  <dt>Duration</dt>
                  <dd>{selectedActivity.duration} minutes</dd>
                </div>

                <div>
                  <dt>Facilitator</dt>
                  <dd>{selectedActivity.facilitator || "—"}</dd>
                </div>

                <div className="calendar-detail-wide">
                  <dt>Location or meeting link</dt>
                  <dd>{selectedActivity.location || "—"}</dd>
                </div>

                <div className="calendar-detail-wide">
                  <dt>Assigned employees</dt>
                  <dd>
                    {selectedEmployees.length
                      ? selectedEmployees
                          .map((employee) => employee.name)
                          .join(", ")
                      : "No available employee assignments"}
                  </dd>
                </div>

                {selectedActivity.additionalDetails && (
                  <div className="calendar-detail-wide">
                    <dt>Additional details</dt>
                    <dd>{selectedActivity.additionalDetails}</dd>
                  </div>
                )}
              </dl>

              <div className="solace-calendar-dialog-footer">
                <Action secondary onClick={() => setSelectedId(null)}>
                  Close
                </Action>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}