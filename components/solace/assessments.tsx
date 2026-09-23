"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useSolace } from "@/lib/solace/store";
import {
  uid,
  fmt,
  type ActivityAssessment,
} from "@/lib/solace/data";

import {
  Action,
  Add,
  Avatar,
  Cell,
  DataTable,
  Empty,
  Heading,
  Pick,
  Row,
  SearchBox,
} from "./ui";

export function Assessments() {
  const { data, clientId } = useSolace();

  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const assessments = (data.activityAssessments ?? [])
    .filter(
      (assessment) =>
        clientId === "all" || assessment.clientId === clientId
    )
    .map((assessment) => ({
      assessment,
      activity: data.events.find(
        (item) => item.id === assessment.activityId
      ),
      employee: data.employees.find(
        (item) =>
          item.id === assessment.employeeId &&
          item.clientId === assessment.clientId
      ),
      client: data.clients.find(
        (item) => item.id === assessment.clientId
      ),
      engagement: data.engagements.find(
        (item) => item.id === assessment.engagementId
      ),
    }))
    .filter(({ assessment, activity, employee, client, engagement }) =>
      [
        activity?.name,
        employee?.name,
        employee?.email,
        client?.name,
        engagement?.name,
        assessment.additionalDetails,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    )
    .sort((a, b) =>
      b.assessment.createdAt.localeCompare(a.assessment.createdAt)
    );

  return (
    <>
      <Heading
        eyebrow="EMPLOYEE WELLBEING"
        title="Assessments"
        description="Record an employee assessment against a scheduled activity."
        action={
          <Add onClick={() => setShowForm(true)}>
            Add assessment
          </Add>
        }
      />

      <div className="panel assessment-table-panel">
        <div className="assessment-table-toolbar">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search employee, activity or assessment..."
          />

          <span>
            {assessments.length}{" "}
            {assessments.length === 1 ? "assessment" : "assessments"}
          </span>
        </div>

        <DataTable
          headers={[
            "Employee",
            "Activity",
            "Corporate client",
            "Engagement",
            "Additional details",
            "Created",
          ]}
        >
          {assessments.map(
            ({ assessment, activity, employee, client, engagement }) => (
              <Row key={assessment.id}>
                <Cell>
                  <div className="cell-title">
                    <Avatar
                      name={employee?.name || "Unknown employee"}
                      small
                    />

                    <div>
                      <strong>
                        {employee?.name || "Employee unavailable"}
                      </strong>

                      {employee && (
                        <>
                          <small>{employee.email}</small>
                          <small>{employee.department}</small>
                        </>
                      )}
                    </div>
                  </div>
                </Cell>

                <Cell>
                  <strong>
                    {activity?.name || "Activity unavailable"}
                  </strong>

                  {activity && (
                    <small>
                      {fmt(activity.date)} · {activity.time}
                    </small>
                  )}
                </Cell>

                <Cell>{client?.name || "Client unavailable"}</Cell>

                <Cell>
                  {engagement?.name || "Engagement unavailable"}
                </Cell>

                <Cell>
                  <div className="assessment-details-cell">
                    {assessment.additionalDetails || "—"}
                  </div>
                </Cell>

                <Cell>
                  {new Date(assessment.createdAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </Cell>
              </Row>
            )
          )}
        </DataTable>

        {assessments.length === 0 && (
          <Empty
            title={
              query.trim()
                ? "No matching assessments"
                : "No assessments yet"
            }
            text={
              query.trim()
                ? "Try another employee or activity name."
                : "Add an assessment to record details for an employee."
            }
          />
        )}
      </div>

      {showForm && (
        <AssessmentForm
          key={clientId}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}

function AssessmentForm({ onClose }: { onClose: () => void }) {
  const { data, setData, clientId } = useSolace();

  const [activityId, setActivityId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [error, setError] = useState("");

  // Show actual created activities, scoped to the current client.
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
      (a.date + a.time).localeCompare(b.date + b.time)
    );

  const selectedActivity = activities.find(
    (activity) => activity.id === activityId
  );

  const selectedEngagement = data.engagements.find(
    (engagement) => engagement.id === selectedActivity?.engagementId
  );

  // Only employees belonging to the activity's company are selectable.
  const employees = selectedEngagement
    ? data.employees
        .filter(
          (employee) =>
            employee.clientId === selectedEngagement.clientId &&
            employee.status === "Active"
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const activityOptions = activities.map((activity) => {
    const engagement = data.engagements.find(
      (item) => item.id === activity.engagementId
    );

    const client = data.clients.find(
      (item) => item.id === engagement?.clientId
    );

    return {
      value: activity.id,
      label: [
        activity.name,
        engagement?.name,
        clientId === "all" ? client?.name : undefined,
        `${fmt(activity.date)} ${activity.time}`,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedActivity || !selectedEngagement) {
      setError("Please select an activity.");
      return;
    }

    const selectedEmployee = employees.find(
      (employee) => employee.id === employeeId
    );

    if (!selectedEmployee) {
      setError("Please select one employee.");
      return;
    }

    const assessment: ActivityAssessment = {
      id: uid(),
      activityId: selectedActivity.id,
      engagementId: selectedEngagement.id,
      clientId: selectedEngagement.clientId,
      employeeId: selectedEmployee.id,
      additionalDetails: additionalDetails.trim(),
      createdAt: new Date().toISOString(),
    };

    setData((previous) => ({
      ...previous,
      activityAssessments: [
        ...(previous.activityAssessments ?? []),
        assessment,
      ],
    }));

    toast.success("Assessment saved");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="form-dialog">
        <DialogHeader>
          <DialogTitle>Add assessment</DialogTitle>

          <DialogDescription>
            Select an activity and one employee, then add assessment details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="assessment-form-fields">
            <div className="assessment-form-field">
              <span>Activity</span>

              <Pick
                label="Activity"
                value={activityId}
                options={activityOptions}
                onChange={(value) => {
                  setActivityId(value);
                  setEmployeeId("");
                  setError("");
                }}
              />

              {activities.length === 0 && (
                <small>
                  Create an activity inside an engagement first.
                </small>
              )}
            </div>

            <div className="assessment-form-field">
              <span>Employee</span>

              {selectedEngagement && employees.length > 0 ? (
                <Pick
                  label="Select an employee"
                  value={employeeId}
                  options={employees.map((employee) => ({
                    value: employee.id,
                    label: `${employee.name} · ${employee.email}`,
                  }))}
                  onChange={(value) => {
                    setEmployeeId(value);
                    setError("");
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="assessment-disabled-select"
                  disabled
                >
                  {selectedEngagement
                    ? "No active employees in this company"
                    : "Select an activity first"}
                </button>
              )}
            </div>

            <label className="assessment-form-field">
             <span> Additional details</span>

              <textarea
                rows={4}
                value={additionalDetails}
                onChange={(event) =>
                  setAdditionalDetails(event.target.value)
                }
                placeholder="Enter assessment notes, observations or feedback..."
              />
            </label>
          </div>

          {error && (
            <p className="assessment-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="assessment-form-footer">
            <Action secondary onClick={onClose}>
              Close
            </Action>

            <Action
              type="submit"
              disabled={!selectedActivity || employees.length === 0}
            >
              Save and close
            </Action>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}