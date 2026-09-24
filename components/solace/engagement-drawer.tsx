"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useSolace } from "@/lib/solace/store";
import type { Engagement } from "@/lib/solace/data";
import { Action, Pick } from "./ui";

type Props = {
  engagement: Engagement;
  open: boolean;
  onClose: () => void;
};

export function EngagementDrawer({ engagement, open, onClose }: Props) {
  const { data, setData } = useSolace();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Engagement>({ ...engagement });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ ...engagement });
      setEditing(false);
      setError("");
    }
  }, [open, engagement]);

  const client = data.clients.find((item) => item.id === engagement.clientId);

  function update<K extends keyof Engagement>(field: K, value: Engagement[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) return;

    if (
      !form.name.trim() ||
      !form.consultant.trim() ||
      !form.start ||
      !form.end
    ) {
      setError("Complete the name, consultant, and dates.");
      return;
    }

    if (form.end < form.start) {
      setError("End date cannot be before start date.");
      return;
    }

    const dates = [
      ...data.events
        .filter((item) => item.engagementId === engagement.id)
        .map((item) => item.date),
      ...data.assessments
        .filter((item) => item.engagementId === engagement.id)
        .map((item) => item.date),
      ...(data.activityAssessments ?? [])
        .filter((item) => item.engagementId === engagement.id)
        .map((item) => item.date),
    ].filter((date): date is string => !!date);

    if (dates.some((date) => date < form.start || date > form.end)) {
      setError(
        "The engagement dates must include its scheduled activities and assessments.",
      );
      return;
    }

    setData((previous) => ({
      ...previous,
      engagements: previous.engagements.map((item) =>
        item.id === engagement.id
          ? {
              ...item,
              name: form.name.trim(),
              objective: form.objective.trim(),
              consultant: form.consultant.trim(),
              start: form.start,
              end: form.end,
              status: form.status,
            }
          : item,
      ),
    }));

    setEditing(false);
    toast.success("Engagement details updated");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="engagement-drawer">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit engagement" : "Engagement details"}
          </DialogTitle>
          <DialogDescription>
            {client?.name || "Corporate client unavailable"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="engagement-drawer-form">
          <div className="engagement-drawer-fields">
            <label>
              <span>Engagement name</span>
              <input
                required
                readOnly={!editing}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </label>

            <label>
              <span>Corporate client</span>
              <input readOnly value={client?.name || "Unavailable"} />
            </label>

            <label>
              <span>Assigned consultant</span>
              {editing ? (
                <Pick
                  label="Assigned consultant"
                  value={form.consultant}
                  options={Array.from(
                    new Set(["Sarah Mitchell", "David Chen", form.consultant]),
                  ).filter(Boolean)}
                  onChange={(value) => update("consultant", value)}
                />
              ) : (
                <input readOnly value={form.consultant} />
              )}
            </label>

            <label>
              <span>Program objectives</span>
              <textarea
                rows={4}
                readOnly={!editing}
                value={form.objective}
                onChange={(event) => update("objective", event.target.value)}
              />
            </label>

            <div className="engagement-date-fields">
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  required
                  readOnly={!editing}
                  value={form.start}
                  onChange={(event) => update("start", event.target.value)}
                />
              </label>

              <label>
                <span>End date</span>
                <input
                  type="date"
                  required
                  min={form.start}
                  readOnly={!editing}
                  value={form.end}
                  onChange={(event) => update("end", event.target.value)}
                />
              </label>
            </div>

            <label>
              <span>Status</span>
              {editing ? (
                <Pick
                  label="Engagement status"
                  value={form.status}
                  options={["Draft", "Active", "Completed"]}
                  onChange={(value) =>
                    update("status", value as Engagement["status"])
                  }
                />
              ) : (
                <input readOnly value={form.status} />
              )}
            </label>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            {editing ? (
              <>
                <Action
                  key="cancel-edit"
                  type="button"
                  secondary
                  onClick={() => {
                    setForm({ ...engagement });
                    setError("");
                    setEditing(false);
                  }}
                >
                  Cancel
                </Action>

                <Action key="save-details" type="submit">
                  Save changes
                </Action>
              </>
            ) : (
              <>
                <Action
                  key="close-drawer"
                  type="button"
                  secondary
                  onClick={onClose}
                >
                  Close
                </Action>

                <Action
                  key="edit-details"
                  type="button"
                  onClick={() => {
                    setError("");
                    setEditing(true);
                  }}
                >
                  Edit details
                </Action>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
