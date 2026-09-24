"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { useSolace } from "@/lib/solace/store";
import type { ActivityDocument } from "@/lib/solace/data";
import {
  getDocumentFile,
  formatFileSize,
} from "@/lib/solace/document-storage";

import {
  Cell,
  DataTable,
  Empty,
  Row,
  SearchBox,
} from "./ui";

type Props = {
  kind: "activities" | "assessments";
};

type DocumentRow = {
  key: string;
  document: ActivityDocument;
  parentName: string;
  engagementName: string;
  employeeNames: string;
  date?: string;
};

export function ProgramDocuments({ kind }: Props) {
  const { data, clientId } = useSolace();
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  const rows: DocumentRow[] = [];

  if (kind === "activities") {
    data.events
      .filter((activity) => activity.type === "Activity")
      .forEach((activity) => {
        const engagement = data.engagements.find(
          (item) => item.id === activity.engagementId,
        );

        if (
          !engagement ||
          (clientId !== "all" && engagement.clientId !== clientId)
        ) {
          return;
        }

        const employeeIds =
          activity.assignedEmployeeIds ??
          data.employees
            .filter(
              (employee) =>
                employee.clientId === engagement.clientId &&
                employee.engagementId === engagement.id &&
                employee.status === "Active" &&
                (activity.audience === "All employees" ||
                  employee.department === activity.audience),
            )
            .map((employee) => employee.id);

        const employeeNames = Array.from(new Set(employeeIds))
          .map((id) =>
            data.employees.find(
              (employee) =>
                employee.id === id &&
                employee.clientId === engagement.clientId,
            )?.name,
          )
          .filter(Boolean)
          .join(", ");

        (activity.documents ?? []).forEach((document) => {
          rows.push({
            key: `${activity.id}-${document.id}`,
            document,
            parentName: activity.name,
            engagementName: engagement.name,
            employeeNames: employeeNames || "No available employees",
            date: activity.date,
          });
        });
      });
  } else {
    (data.activityAssessments ?? []).forEach((assessment) => {
      if (
        clientId !== "all" &&
        assessment.clientId !== clientId
      ) {
        return;
      }

      const engagement = data.engagements.find(
        (item) => item.id === assessment.engagementId,
      );

      const employee = data.employees.find(
        (item) =>
          item.id === assessment.employeeId &&
          item.clientId === assessment.clientId,
      );

      // Support assessment records saved before the new form.
      const legacyActivity = data.events.find(
        (item) => item.id === assessment.activityId,
      );

      (assessment.documents ?? []).forEach((document) => {
        rows.push({
          key: `${assessment.id}-${document.id}`,
          document,
          parentName:
            assessment.category ||
            legacyActivity?.name ||
            "Legacy assessment",
          engagementName:
            engagement?.name || "Engagement unavailable",
          employeeNames: employee?.name || "Employee unavailable",
          date: assessment.date,
        });
      });
    });
  }

  const filteredRows = rows
    .filter((row) =>
      [
        row.document.name,
        row.parentName,
        row.engagementName,
        row.employeeNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      b.document.uploadedAt.localeCompare(a.document.uploadedAt),
    );

  async function download(row: DocumentRow) {
    if (downloading) return;

    setDownloading(row.key);

    try {
      const file = await getDocumentFile(row.document.id);
      const url = URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = row.document.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("This document is unavailable in this browser.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="panel">
      <div className="program-documents-toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={`Search documents, ${
            kind === "activities" ? "activities" : "assessments"
          }, or employees...`}
        />

        <span>
          {filteredRows.length} document
          {filteredRows.length === 1 ? "" : "s"}
        </span>
      </div>

      <DataTable
        headers={[
          "Document",
          kind === "activities" ? "Activity" : "Assessment",
          "Engagement",
          "Employees",
          "Uploaded",
          "Download",
        ]}
      >
        {filteredRows.map((row) => (
          <Row key={row.key}>
            <Cell>
              <div className="cell-title">
                <FileText size={20} />

                <div>
                  <strong>{row.document.name}</strong>
                  <small>{formatFileSize(row.document.size)}</small>
                </div>
              </div>
            </Cell>

            <Cell>
              <strong>{row.parentName}</strong>
              {row.date && <small>{row.date}</small>}
            </Cell>

            <Cell>{row.engagementName}</Cell>

            <Cell>
              <div className="document-employees">
                {row.employeeNames}
              </div>
            </Cell>

            <Cell>
              {new Date(row.document.uploadedAt).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              )}
            </Cell>

            <Cell>
              <button
                type="button"
                className="document-download-button"
                disabled={downloading !== null}
                onClick={() => download(row)}
                aria-label={`Download ${row.document.name}`}
              >
                <Download size={16} />
                {downloading === row.key ? "Downloading..." : "Download"}
              </button>
            </Cell>
          </Row>
        ))}
      </DataTable>

      {!filteredRows.length && (
        <Empty
          title={query ? "No matching documents" : "No documents yet"}
          text={
            query
              ? "Try another document, employee, or engagement name."
              : `Files uploaded when adding or editing ${
                  kind === "activities" ? "activities" : "assessments"
                } will appear here.`
          }
        />
      )}
    </div>
  );
}