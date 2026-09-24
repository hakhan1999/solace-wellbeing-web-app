"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProgramDocuments } from "./program-documents";

import { useSolace } from "@/lib/solace/store";
import {
  assessmentTypes,
  uid,
  fmt,
  type ActivityAssessment,
} from "@/lib/solace/data";

import {
  saveDocumentFiles,
  getDocumentFile,
  formatFileSize,
} from "@/lib/solace/document-storage";

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
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<ActivityAssessment | null | undefined>();

  const rows = (data.activityAssessments ?? [])
    .filter((item) => clientId === "all" || item.clientId === clientId)
    .map((assessment) => ({
      assessment,
      employee: data.employees.find(
        (item) =>
          item.id === assessment.employeeId &&
          item.clientId === assessment.clientId,
      ),
      engagement: data.engagements.find(
        (item) => item.id === assessment.engagementId,
      ),
      legacyActivity: data.events.find(
        (item) => item.id === assessment.activityId,
      ),
    }))
    .filter(({ assessment, employee, engagement, legacyActivity }) =>
      [
        assessment.category,
        assessment.additionalDetails,
        assessment.facilitator,
        employee?.name,
        employee?.email,
        engagement?.name,
        legacyActivity?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      b.assessment.createdAt.localeCompare(a.assessment.createdAt),
    );

  async function downloadDocument(
    document: NonNullable<ActivityAssessment["documents"]>[number],
  ) {
    try {
      const blob = await getDocumentFile(document.id);
      const url = URL.createObjectURL(blob);
      const link = documentOwnerLink(url, document.name);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("This document is unavailable in this browser.");
    }
  }

  return (
    <>
      <Heading
        eyebrow="ENGAGEMENT MANAGEMENT"
        title="Assessments"
        description="Manage employee assessments and their documents."
        action={<Add onClick={() => setForm(null)}>Add assessment</Add>}
      />

      <Tabs defaultValue="assessments" className="program-tabs">
        <TabsList className="section-tabs">
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments">
          <div className="panel assessment-table-panel">
            <div className="panel assessment-table-panel">
              <div className="assessment-table-toolbar">
                <SearchBox
                  value={query}
                  onChange={setQuery}
                  placeholder="Search employee, engagement or assessment..."
                />
                <span>{rows.length} assessments</span>
              </div>

              <DataTable
                headers={[
                  "Employee",
                  "Engagement",
                  "Assessment",
                  "Date & time",
                  "Facilitator",
                  "Additional details",
                  "Documents",
                  "Actions",
                ]}
              >
                {rows.map(
                  ({ assessment, employee, engagement, legacyActivity }) => (
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
                            <small>{employee?.email}</small>
                            <small>{employee?.department}</small>
                          </div>
                        </div>
                      </Cell>

                      <Cell>
                        {engagement?.name || "Engagement unavailable"}
                      </Cell>

                      <Cell>
                        <strong>
                          {assessment.category ||
                            legacyActivity?.name ||
                            "Legacy assessment"}
                        </strong>
                        {assessment.duration !== undefined && (
                          <small>{assessment.duration} minutes</small>
                        )}
                        <small>{assessment.location}</small>
                      </Cell>

                      <Cell>
                        {assessment.date
                          ? fmt(assessment.date)
                          : "Not scheduled"}
                        <small>{assessment.time || "—"}</small>
                      </Cell>

                      <Cell>{assessment.facilitator || "—"}</Cell>

                      <Cell>
                        <div className="assessment-details-cell">
                          {assessment.additionalDetails || "—"}
                        </div>
                      </Cell>

                      <Cell>
                        {assessment.documents?.length ? (
                          <div className="assessment-document-links">
                            {assessment.documents.map((document) => (
                              <button
                                key={document.id}
                                type="button"
                                onClick={() => downloadDocument(document)}
                              >
                                {document.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </Cell>

                      <Cell>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Edit assessment for ${
                            employee?.name || "employee"
                          }`}
                          onClick={() => setForm(assessment)}
                        >
                          <Pencil size={16} />
                        </button>
                      </Cell>
                    </Row>
                  ),
                )}
              </DataTable>

              {!rows.length && (
                <Empty
                  title="No assessments found"
                  text="Add an assessment or adjust your search."
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <ProgramDocuments key={clientId} kind="assessments" />
        </TabsContent>
      </Tabs>

      {form !== undefined && (
        <AssessmentForm
          key={`${form?.id || "new"}-${clientId}`}
          initial={form || undefined}
          onClose={() => setForm(undefined)}
        />
      )}
    </>
  );
}

function documentOwnerLink(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  return link;
}

function AssessmentForm({
  initial,
  onClose,
}: {
  initial?: ActivityAssessment;
  onClose: () => void;
}) {
  const { data, setData, clientId } = useSolace();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingFiles, setPendingFiles] = useState<
    { id: string; file: File }[]
  >([]);

  const [form, setForm] = useState({
    engagementId: initial?.engagementId || "",
    employeeId: initial?.employeeId || "",
    category: initial?.category || "",
    date: initial?.date || "",
    time: initial?.time || "09:00",
    duration: String(initial?.duration ?? 45),
    facilitator: initial?.facilitator || "",
    location: initial?.location || "",
    additionalDetails: initial?.additionalDetails || "",
  });

  const engagements = data.engagements.filter(
    (item) =>
      clientId === "all" ||
      item.clientId === clientId ||
      item.id === initial?.engagementId,
  );

  const engagement = engagements.find((item) => item.id === form.engagementId);

  const employees = engagement
    ? data.employees
        .filter(
          (item) =>
            item.clientId === engagement.clientId &&
            (item.status === "Active" || item.id === initial?.employeeId),
        )
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setError("");

    if (!engagement) {
      setError("Select an engagement.");
      return;
    }

    if (!employees.some((item) => item.id === form.employeeId)) {
      setError("Select one employee from this company.");
      return;
    }

    if (
      !assessmentTypes.some((type) => type === form.category) ||
      !form.date ||
      !form.time ||
      !form.facilitator.trim() ||
      !form.location.trim()
    ) {
      setError("Complete all required assessment fields.");
      return;
    }

    if (form.date < engagement.start || form.date > engagement.end) {
      setError("Choose a date within the engagement period.");
      return;
    }

    const duration = Number(form.duration);

    if (!Number.isInteger(duration) || duration < 5) {
      setError("Duration must be at least 5 minutes.");
      return;
    }

    const assessment: ActivityAssessment = {
      id: initial?.id || uid(),
      engagementId: engagement.id,
      clientId: engagement.clientId,
      employeeId: form.employeeId,
      category: form.category,
      date: form.date,
      time: form.time,
      duration,
      facilitator: form.facilitator.trim(),
      location: form.location.trim(),
      additionalDetails: form.additionalDetails.trim(),
      createdAt: initial?.createdAt || new Date().toISOString(),
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
      if (pendingFiles.length > 0) {
        await saveDocumentFiles(pendingFiles);
      }

      setData((previous) => ({
        ...previous,
        activityAssessments: initial
          ? (previous.activityAssessments ?? []).map((item) =>
              item.id === initial.id ? assessment : item,
            )
          : [...(previous.activityAssessments ?? []), assessment],
      }));

      toast.success(initial ? "Assessment updated" : "Assessment saved");
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save assessment documents.",
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
            {initial ? "Edit assessment" : "Add assessment"}
          </DialogTitle>
          <DialogDescription>
            Choose an engagement and schedule an assessment for one employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save}>
          <fieldset disabled={saving} className="assessment-fields-reset">
            <div className="assessment-edit-grid">
              <label className="assessment-span-full">
                <span>Engagement</span>
                <Pick
                  label="Select engagement"
                  value={form.engagementId}
                  options={engagements.map((item) => ({
                    value: item.id,
                    label: `${item.name} · ${
                      data.clients.find((client) => client.id === item.clientId)
                        ?.name || "Unknown company"
                    }`,
                  }))}
                  onChange={(value) => {
                    const selected = engagements.find(
                      (item) => item.id === value,
                    );

                    setForm((previous) => ({
                      ...previous,
                      engagementId: value,
                      employeeId: "",
                      date: selected?.start || "",
                      facilitator: selected?.consultant || "",
                    }));
                    setError("");
                  }}
                />
              </label>

              <label>
                <span>Assessment type</span>
                <Pick
                  label="Select assessment type"
                  value={form.category}
                  options={[...assessmentTypes]}
                  onChange={(value) => update("category", value)}
                />
              </label>

              <label>
                <span>Employee</span>
                {employees.length ? (
                  <Pick
                    label="Select one employee"
                    value={form.employeeId}
                    options={employees.map((item) => ({
                      value: item.id,
                      label: `${item.name} · ${item.email}`,
                    }))}
                    onChange={(value) => update("employeeId", value)}
                  />
                ) : (
                  <input
                    readOnly
                    value={
                      engagement
                        ? "No active employees in this company"
                        : "Select an engagement first"
                    }
                  />
                )}
              </label>

              <label className="assessment-span-full">
                <span>Additional details</span>
                <textarea
                  rows={4}
                  value={form.additionalDetails}
                  placeholder="Add notes, observations or instructions..."
                  onChange={(event) =>
                    update("additionalDetails", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  required
                  min={engagement?.start}
                  max={engagement?.end}
                  value={form.date}
                  onChange={(event) => update("date", event.target.value)}
                />
              </label>

              <label>
                <span>Start time</span>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(event) => update("time", event.target.value)}
                />
              </label>

              <label>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min={5}
                  step={1}
                  required
                  value={form.duration}
                  onChange={(event) => update("duration", event.target.value)}
                />
              </label>

              <label>
                <span>Facilitator</span>
                <input
                  required
                  value={form.facilitator}
                  onChange={(event) =>
                    update("facilitator", event.target.value)
                  }
                />
              </label>

              <label className="assessment-span-full">
                <span>Location or meeting link</span>
                <input
                  required
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                />
              </label>

              <div className="assessment-span-full">
                <label>
                  <span>Documents</span>
                  <input
                    type="file"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);

                      setPendingFiles((previous) => [
                        ...previous,
                        ...files.map((file) => ({ id: uid(), file })),
                      ]);

                      event.target.value = "";
                    }}
                  />
                </label>

                {initial?.documents?.map((document) => (
                  <p key={document.id}>
                    {document.name} · {formatFileSize(document.size)}
                  </p>
                ))}

                {pendingFiles.map(({ id, file }) => (
                  <div key={id} className="assessment-upload-row">
                    <span>
                      {file.name} · {formatFileSize(file.size)}
                    </span>
                    <button
                      type="button"
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
            </div>
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <Action secondary disabled={saving} onClick={onClose}>
              Close
            </Action>
            <Action
              type="submit"
              disabled={saving || !engagement || !employees.length}
            >
              {saving ? "Saving..." : "Save and close"}
            </Action>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
