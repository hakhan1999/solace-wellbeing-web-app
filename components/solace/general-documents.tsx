"use client";

import { useRef, useState } from "react";
import { Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { useSolace } from "@/lib/solace/store";
import { uid, type GeneralDocument } from "@/lib/solace/data";

import {
  saveDocumentFiles,
  getDocumentFile,
  formatFileSize,
} from "@/lib/solace/document-storage";

import {
  Action,
  Cell,
  DataTable,
  Empty,
  Heading,
  Row,
  SearchBox,
} from "./ui";

export function GeneralDocuments() {
  const { data, setData } = useSolace();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const documents = (data.generalDocuments ?? [])
    .filter((document) =>
      document.name.toLowerCase().includes(query.trim().toLowerCase())
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const totalDocuments = data.generalDocuments?.length ?? 0;

  async function uploadFiles(files: File[]) {
    if (!files.length || uploading) return;

    setUploading(true);

    const uploads = files.map((file) => ({
      id: uid(),
      file,
    }));

    try {
      await saveDocumentFiles(uploads);

      const records: GeneralDocument[] = uploads.map(({ id, file }) => ({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      }));

      setData((previous) => ({
        ...previous,
        generalDocuments: [
          ...(previous.generalDocuments ?? []),
          ...records,
        ],
      }));

      toast.success(
        `${records.length} ${
          records.length === 1 ? "document uploaded" : "documents uploaded"
        }`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to upload documents. Please try again."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function downloadDocument(item: GeneralDocument) {
    setDownloadingId(item.id);

    try {
      const file = await getDocumentFile(item.id);
      const url = URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download this document."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <Heading
        eyebrow="WORKSPACE LIBRARY"
        title="Documents"
        description="Keep company guides, policies and reference files in one place."
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        disabled={uploading}
        aria-label="Upload general documents"
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
        }}
      />

      <section
        className="general-document-upload"
        aria-busy={uploading}
      >
        <div className="general-document-upload-content">
          <span className="general-document-upload-icon">
            <Upload size={25} />
          </span>

          <div>
            <h2>Your shared workspace library</h2>
            <p>
              Upload one or more documents to keep them easy to find.
            </p>

            <span className="general-document-total">
              {totalDocuments}{" "}
              {totalDocuments === 1 ? "document" : "documents"} saved
            </span>
          </div>
        </div>

        <Action
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={17} />
          {uploading ? "Uploading..." : "Upload documents"}
        </Action>

        <span className="sr-only" role="status">
          {uploading ? "Uploading documents. Please wait." : ""}
        </span>
      </section>

      <div className="panel general-document-panel">
        <div className="general-document-toolbar">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search documents..."
          />

          <span>
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </span>
        </div>

        <DataTable headers={["Document", "Size", "Uploaded", "Action"]}>
          {documents.map((item) => (
            <Row key={item.id}>
              <Cell>
                <div className="cell-title">
                  <span className="general-document-file-icon">
                    <FileText size={20} />
                  </span>

                  <strong className="general-document-name">
                    {item.name}
                  </strong>
                </div>
              </Cell>

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
                  onClick={() => void downloadDocument(item)}
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

        {!documents.length && (
          <Empty
            title={
              query.trim()
                ? "No matching documents"
                : "Your document library is ready"
            }
            text={
              query.trim()
                ? "Try a different file name."
                : "Upload your first document using the button above."
            }
          />
        )}
      </div>
    </>
  );
}