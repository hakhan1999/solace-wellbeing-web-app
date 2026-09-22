"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, Users } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Checkbox } from "@/components/ui/checkbox";
import { useSolace } from "@/lib/solace/store";
import { uid, type Event as ProgramEvent } from "@/lib/solace/data";
import { Action, Pick } from "./ui";
import {
  saveDocumentFiles,
  formatFileSize,
} from "@/lib/solace/document-storage";

const activityCategories = [
  "Yoga",
  "High-intensity workouts",
  "Learning",
  "Group activities",
  "Coaching",
  "Other",
];

type AssignmentMode = "single" | "multiple";

type ActivityFormProps = {
  engagementId: string;
  initial?: ProgramEvent;
  onClose: () => void;
};

export function ActivityForm({
  engagementId,
  initial,
  onClose,
}: ActivityFormProps) {
  const [pendingFiles, setPendingFiles] = useState<
    { id: string; file: File }[]
  >([]);

  const [saving, setSaving] = useState(false);
  const { data, setData } = useSolace();

  const engagement = data.engagements.find((item) => item.id === engagementId);

  // Resolve older activities that used department/all-employee audiences.
  const initialEmployeeIds =
    initial?.assignedEmployeeIds ??
    (initial
      ? data.employees
          .filter(
            (employee) =>
              employee.clientId === engagement?.clientId &&
              employee.engagementId === engagementId &&
              employee.status === "Active" &&
              (initial.audience === "All employees" ||
                employee.department === initial.audience),
          )
          .map((employee) => employee.id)
      : []);

  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(
    initial?.assignmentMode ??
      (initialEmployeeIds.length > 1 ? "multiple" : "single"),
  );

  const [selectedEmployeeIds, setSelectedEmployeeIds] =
    useState<string[]>(initialEmployeeIds);

  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category: initial?.category || activityCategories[0],
    date: initial?.date || engagement?.start || "",
    time: initial?.time || "09:00",
    duration: String(initial?.duration ?? 45),
    capacity: String(initial?.capacity ?? 25),
    facilitator: initial?.facilitator || engagement?.consultant || "",
    location: initial?.location || "",
    additionalDetails: initial?.additionalDetails || "",
  });

  // Existing assignments remain visible when editing, even if an
  // assigned employee has subsequently become inactive.
  const availableEmployees = data.employees.filter(
    (employee) =>
      employee.clientId === engagement?.clientId &&
      (employee.status === "Active" ||
        initialEmployeeIds.includes(employee.id)),
  );

  const allSelected =
    availableEmployees.length > 0 &&
    availableEmployees.every((employee) =>
      selectedEmployeeIds.includes(employee.id),
    );

  const someSelected = availableEmployees.some((employee) =>
    selectedEmployeeIds.includes(employee.id),
  );

  const categoryOptions = Array.from(
    new Set([...activityCategories, form.category]),
  );

  const selectedEmployee = availableEmployees.find(
    (employee) => employee.id === selectedEmployeeIds[0],
  );

  const employeeLabel =
    selectedEmployeeIds.length === 0
      ? assignmentMode === "single"
        ? "Select an employee"
        : "Select employees"
      : assignmentMode === "single"
        ? selectedEmployee?.name || "Select an employee"
        : allSelected
          ? `All employees (${selectedEmployeeIds.length})`
          : `${selectedEmployeeIds.length} employees selected`;

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function changeAssignmentMode(mode: AssignmentMode) {
    setAssignmentMode(mode);
    setError("");
    setEmployeePopoverOpen(false);

    // Switching to individual keeps only the first selected employee.
    if (mode === "single") {
      setSelectedEmployeeIds((previous) => previous.slice(0, 1));
    }
  }

  function toggleEmployee(employeeId: string, checked: boolean) {
    setSelectedEmployeeIds((previous) =>
      checked
        ? Array.from(new Set([...previous, employeeId]))
        : previous.filter((id) => id !== employeeId),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!engagement) {
      setError("This engagement could not be found.");
      return;
    }

    const employeeIds = Array.from(new Set(selectedEmployeeIds)).filter((id) =>
      availableEmployees.some((employee) => employee.id === id),
    );

    if (
      employeeIds.length === 0 ||
      employeeIds.length !== selectedEmployeeIds.length
    ) {
      setError("Please select valid employees for this company.");
      return;
    }

    if (assignmentMode === "single" && employeeIds.length !== 1) {
      setError("Select exactly one employee.");
      return;
    }

    if (assignmentMode === "multiple" && employeeIds.length < 2) {
      setError("Select at least two employees, or choose Individual employee.");
      return;
    }

    if (
      !form.category ||
      !form.date ||
      !form.time ||
      !form.facilitator.trim() ||
      !form.location.trim()
    ) {
      setError("Please complete all required activity fields.");
      return;
    }

    if (form.date < engagement.start || form.date > engagement.end) {
      setError("Choose a date within the engagement period.");
      return;
    }

    const duration = Number(form.duration);
    const capacity = Number(form.capacity);

    if (!Number.isInteger(duration) || duration < 5) {
      setError("Duration must be at least 5 minutes.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity < employeeIds.length) {
      setError(
        `Capacity must be at least ${employeeIds.length} to include the selected employees.`,
      );
      return;
    }

    const activity: ProgramEvent = {
      id: initial?.id || uid(),
      engagementId,
      type: "Activity",

      // The selected activity category is also the activity name.
      name: form.category,
      category: form.category,

      date: form.date,
      time: form.time,
      duration,
      capacity,
      facilitator: form.facilitator.trim(),
      location: form.location.trim(),

      audience: "Selected employees",
      assignmentMode,
      assignedEmployeeIds: employeeIds,
      additionalDetails:
        assignmentMode === "single" ? form.additionalDetails.trim() : "",

      // Assignment does not mark an employee as attended.
      attendees: (initial?.attendees || []).filter((id) =>
        employeeIds.includes(id),
      ),

      documents: [
        ...(initial?.documents ?? []),
        ...pendingFiles.map(({ id, file }) => ({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        })),
      ],
    };

    setSaving(true);

    try {
      // Save file contents before adding their references to the activity.
      await saveDocumentFiles(pendingFiles);

      setData((previous) => ({
        ...previous,
        events: initial
          ? previous.events.map((item) =>
              item.id === initial.id ? activity : item,
            )
          : [...previous.events, activity],
      }));

      toast.success(initial ? "Activity updated" : "Activity saved");
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save files. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit activity" : "Add activity"}
          </DialogTitle>

          <DialogDescription>
            {initial ? "Update" : "Create"} an activity for{" "}
            {engagement?.name || "this engagement"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <fieldset className="activity-assignment-mode activity-full-width">
              <legend>Assign to</legend>

              <div className="activity-mode-options">
                <label
                  className={assignmentMode === "single" ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="activityAssignmentMode"
                    value="single"
                    checked={assignmentMode === "single"}
                    onChange={() => changeAssignmentMode("single")}
                  />
                  <span>Individual employee</span>
                </label>

                <label
                  className={assignmentMode === "multiple" ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="activityAssignmentMode"
                    value="multiple"
                    checked={assignmentMode === "multiple"}
                    onChange={() => changeAssignmentMode("multiple")}
                  />
                  <span>Multiple employees</span>
                </label>
              </div>
            </fieldset>
            <div className="activity-field activity-half-field activLabel">
              <span>Activity</span>

              <Pick
                label="Activity"
                value={form.category}
                onChange={(value) => updateField("category", value)}
                options={categoryOptions}
              />
            </div>

            <div className="activity-field activity-half-field">
              <span id="activity-employees-label">
                {assignmentMode === "single" ? "Employee" : "Employees"}
              </span>

              <Popover
                open={employeePopoverOpen}
                onOpenChange={setEmployeePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="activity-employee-trigger"
                    aria-labelledby="activity-employees-label activity-employees-value"
                  >
                    <Users size={17} />

                    <span id="activity-employees-value">{employeeLabel}</span>

                    <ChevronDown size={16} />
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="activity-employee-popover"
                >
                  {assignmentMode === "multiple" && (
                    <label className="activity-person-row activity-select-all">
                      <Checkbox
                        checked={
                          allSelected
                            ? true
                            : someSelected
                              ? "indeterminate"
                              : false
                        }
                        disabled={availableEmployees.length === 0}
                        onCheckedChange={(checked) =>
                          setSelectedEmployeeIds(
                            checked === true
                              ? availableEmployees.map(
                                  (employee) => employee.id,
                                )
                              : [],
                          )
                        }
                      />

                      <strong>Select all employees</strong>
                    </label>
                  )}

                  <div className="activity-employee-options">
                    {availableEmployees.map((employee) => (
                      <label key={employee.id} className="activity-person-row">
                        {assignmentMode === "single" ? (
                          <input
                            type="radio"
                            name="activityEmployee"
                            checked={selectedEmployeeIds.includes(employee.id)}
                            onChange={() => {
                              setSelectedEmployeeIds([employee.id]);
                              setEmployeePopoverOpen(false);
                            }}
                          />
                        ) : (
                          <Checkbox
                            checked={selectedEmployeeIds.includes(employee.id)}
                            onCheckedChange={(checked) =>
                              toggleEmployee(employee.id, checked === true)
                            }
                          />
                        )}

                        <span>
                          <strong>{employee.name}</strong>
                          <small>{employee.department}</small>
                        </span>
                      </label>
                    ))}

                    {availableEmployees.length === 0 && (
                      <p className="activity-picker-empty">
                        Add active employees to this corporate client first.
                      </p>
                    )}
                  </div>

                  <div className="activity-picker-footer">
                    <span>{selectedEmployeeIds.length} selected</span>

                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeIds([])}
                      disabled={selectedEmployeeIds.length === 0}
                    >
                      Clear
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {assignmentMode === "single" && (
              <label className="activity-full-width">
                Additional details
                <textarea
                  rows={3}
                  value={form.additionalDetails}
                  onChange={(event) =>
                    updateField("additionalDetails", event.target.value)
                  }
                  placeholder="Add notes or instructions for this employee..."
                />
              </label>
            )}

            <label>
              Date
              <input
                type="date"
                required
                min={engagement?.start}
                max={engagement?.end}
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
              />
            </label>

            <label>
              Start time
              <input
                type="time"
                required
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
              />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                required
                min={5}
                step={1}
                value={form.duration}
                onChange={(event) =>
                  updateField("duration", event.target.value)
                }
              />
            </label>

            <label>
              Capacity
              <input
                type="number"
                required
                min={Math.max(1, selectedEmployeeIds.length)}
                step={1}
                value={form.capacity}
                onChange={(event) =>
                  updateField("capacity", event.target.value)
                }
              />
            </label>

            <label>
              Facilitator
              <input
                required
                value={form.facilitator}
                onChange={(event) =>
                  updateField("facilitator", event.target.value)
                }
              />
            </label>

            <label>
              Location or meeting link
              <input
                required
                value={form.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                placeholder="Meeting room or online meeting URL"
              />
            </label>
            <div className="activity-full-width activity-document-field">
              <label htmlFor="activity-documents">Documents</label>

              <input
                id="activity-documents"
                type="file"
                multiple
                disabled={saving}
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);

                  setPendingFiles((previous) => [
                    ...previous,
                    ...files.map((file) => ({
                      id: uid(),
                      file,
                    })),
                  ]);

                  // Allows selecting the same file again after removing it.
                  event.target.value = "";
                }}
              />

              <small>
                Select one or more files. Files are saved with this activity.
              </small>

              {!!initial?.documents?.length && (
                <div className="activity-upload-list">
                  {initial.documents.map((document) => (
                    <div className="activity-upload-item" key={document.id}>
                      <div>
                        <strong>{document.name}</strong>
                        <small>{formatFileSize(document.size)} · Saved</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingFiles.length > 0 && (
                <div className="activity-upload-list">
                  {pendingFiles.map(({ id, file }) => (
                    <div className="activity-upload-item" key={id}>
                      <div>
                        <strong>{file.name}</strong>
                        <small>
                          {formatFileSize(file.size)} · Ready to save
                        </small>
                      </div>

                      <button
                        type="button"
                        disabled={saving}
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          setPendingFiles((previous) =>
                            previous.filter((item) => item.id !== id),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="activity-form-error" role="alert">
              {error}
            </p>
          )}

          <div className="activity-form-footer">
            <Action secondary disabled={saving} onClick={onClose}>
              Cancel
            </Action>

            <Action type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save and close"}
            </Action>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
