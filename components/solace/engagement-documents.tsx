"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { useSolace } from "@/lib/solace/store";
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

export function EngagementDocuments({
  engagementId,
}: {
  engagementId: string;
}) {
  const { data } = useSolace();

  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const documents = data.events
    .filter(
      (activity) =>
        activity.engagementId === engagementId &&
        activity.type === "Activity"
    )
    .flatMap((activity) =>
      (activity.documents ?? []).map((document) => ({
        ...document,
        activityId: activity.id,
        activityName: activity.name,
      }))
    )
    .filter((document) =>
      `${document.name} ${document.activityName}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  async function downloadDocument(id: string, name: string) {
    setDownloadingId(id);

    try {
      const file = await getDocumentFile(id);
      const url = URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download this file."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="panel engagement-documents-panel">
      <div className="engagement-documents-toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search documents or activities..."
        />

        <span>
          {documents.length}{" "}
          {documents.length === 1 ? "document" : "documents"}
        </span>
      </div>

      <DataTable
        headers={["Document", "Activity", "Size", "Uploaded", "Action"]}
      >
        {documents.map((item) => (
          <Row key={`${item.activityId}-${item.id}`}>
            <Cell>
              <div className="cell-title">
                <span className="table-icon">
                  <FileText size={18} />
                </span>

                <strong className="document-name">{item.name}</strong>
              </div>
            </Cell>

            <Cell>{item.activityName}</Cell>

            <Cell>{formatFileSize(item.size)}</Cell>

            <Cell>
              {new Date(item.uploadedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Cell>

            <Cell>
              <button
                type="button"
                className="text-link"
                disabled={downloadingId !== null}
                onClick={() => downloadDocument(item.id, item.name)}
              >
                <Download size={15} />
                {downloadingId === item.id
                  ? "Downloading..."
                  : "Download"}
              </button>
            </Cell>
          </Row>
        ))}
      </DataTable>

      {documents.length === 0 && (
        <Empty
          title={query.trim() ? "No matching documents" : "No documents yet"}
          text={
            query.trim()
              ? "Try a different document or activity name."
              : "Upload files while creating or editing an activity."
          }
        />
      )}
    </div>
  );
}