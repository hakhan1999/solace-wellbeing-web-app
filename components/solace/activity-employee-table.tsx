"use client";

import { useState } from "react";
import { Pencil, Users } from "lucide-react";

import { useSolace } from "@/lib/solace/store";
import { fmt, type Event as ProgramEvent } from "@/lib/solace/data";

import {
  Avatar,
  Badge,
  Cell,
  DataTable,
  Empty,
  Row,
  SearchBox,
} from "./ui";

type Props = {
  events: ProgramEvent[];
  onView: (activityId: string) => void;
  onEdit: (activity: ProgramEvent) => void;
};

export function ActivityEmployeeTable({
  events,
  onView,
  onEdit,
}: Props) {
  const { data } = useSolace();
  const [query, setQuery] = useState("");

  const rows = events
    .filter((activity) => activity.type === "Activity")
    .flatMap((activity) => {
      const engagement = data.engagements.find(
        (item) => item.id === activity.engagementId
      );

      const assignedIds =
        activity.assignedEmployeeIds !== undefined
          ? Array.from(new Set(activity.assignedEmployeeIds))
          : data.employees
              .filter(
                (employee) =>
                  employee.clientId === engagement?.clientId &&
                  employee.engagementId === activity.engagementId &&
                  employee.status === "Active" &&
                  (activity.audience === "All employees" ||
                    employee.department === activity.audience)
              )
              .map((employee) => employee.id);

      // Keep older activities without assignments visible for editing.
      if (assignedIds.length === 0) {
        return [
          {
            key: `${activity.id}-unassigned`,
            activity,
            employeeId: "",
            employee: undefined,
          },
        ];
      }

      return assignedIds.map((employeeId) => ({
        key: `${activity.id}-${employeeId}`,
        activity,
        employeeId,
        employee: data.employees.find(
          (employee) =>
            employee.id === employeeId &&
            employee.clientId === engagement?.clientId
        ),
      }));
    });

  const search = query.trim().toLowerCase();

  const filteredRows = rows.filter(({ activity, employee }) =>
    [
      activity.name,
      employee?.name,
      employee?.email,
      employee?.department,
      activity.facilitator,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search)
  );

  return (
    <div className="panel activity-table-panel">
      <div className="activity-table-toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search employee or activity..."
        />

        <span>{filteredRows.length} rows</span>
      </div>

      <DataTable
        headers={[
          "Employee",
          "Activity",
          "Date & time",
          "Facilitator",
          "Additional details",
          "Attendance",
          "Actions",
        ]}
      >
        {filteredRows.map(
          ({ key, activity, employeeId, employee }) => (
            <Row key={key}>
              <Cell>
                {employee ? (
                  <div className="cell-title">
                    <Avatar name={employee.name} small />

                    <div>
                      <strong>{employee.name}</strong>
                      <small>{employee.email}</small>
                      <small>{employee.department}</small>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong>
                      {employeeId
                        ? "Employee unavailable"
                        : "No employees assigned"}
                    </strong>
                    <small>Edit activity to update assignments</small>
                  </div>
                )}
              </Cell>

              <Cell>
                <strong>{activity.name}</strong>
                <small>{activity.duration} minutes</small>
                <small>{activity.location}</small>
              </Cell>

              <Cell>
                {fmt(activity.date)}
                <small>{activity.time}</small>
              </Cell>

              <Cell>{activity.facilitator}</Cell>

              <Cell>
                <div className="activity-details-cell">
                  {activity.assignmentMode === "single"
                    ? activity.additionalDetails || "—"
                    : "—"}
                </div>
              </Cell>

              <Cell>
                {employeeId ? (
                  <Badge
                    tone={
                      activity.attendees.includes(employeeId)
                        ? "green"
                        : "neutral"
                    }
                  >
                    {activity.attendees.includes(employeeId)
                      ? "Attended"
                      : "Not recorded"}
                  </Badge>
                ) : (
                  "—"
                )}
              </Cell>

              <Cell>
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Manage attendance for ${activity.name}`}
                    title="Manage activity attendance"
                    onClick={() => onView(activity.id)}
                  >
                    <Users size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Edit shared activity ${activity.name}`}
                    title="Edit activity for all assigned employees"
                    onClick={() => onEdit(activity)}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </Cell>
            </Row>
          )
        )}
      </DataTable>

      {filteredRows.length === 0 && (
        <Empty
          title="No activities found"
          text="Add an activity or adjust your search."
        />
      )}
    </div>
  );
}