"use client";
import { useState, FormEvent } from "react";
import Image from "next/image";
import { flushSync } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSolace } from "@/lib/solace/store";
import {
  uid,
  day,
  templates,
  categories,
  phases,
  Client,
  Employee,
  Engagement,
  Assessment,
  Event,
  Resource,
} from "@/lib/solace/data";
import { Action, Pick } from "./ui";
export type FormKind =
  | "client"
  | "engagement"
  | "employee"
  | "assessment"
  | "event"
  | "resource";
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: (string | { value: string; label: string })[];
  optional?: boolean;
  wide?: boolean;
};
type EmployeeDraft = {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  status: string;
};
export function EditForm({
  kind,
  initial,
  engagementId,
  clientId: providedClient,
  onClose,
  onSaved,
  defaultPhase,
}: {
  defaultPhase?: Assessment["phase"];
  kind: FormKind;
  initial?: Client | Employee | Engagement | Assessment | Event | Resource;
  engagementId?: string;
  clientId?: string;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { data, setData, clientId } = useSolace();
  const [form, setForm] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {
      clientId:
        providedClient ||
        (clientId === "all" ? data.clients[0]?.id : clientId) ||
        "",
      engagementId: engagementId || "none",
      consultant: "Sarah Mitchell",
      status: kind === "engagement" ? "Draft" : "Active",
      start: day(),
      end: day(120),
      color: "#176456",
      size: "51–200",
      industry: "Technology",
      template: "Custom program",
      category: kind === "event" ? "Yoga" : "Physical",
      phase: defaultPhase || "Pre-assessment",
      date: day(1),
      frequency: "Once",
      audience: "All employees",
      type: kind === "event" ? "Activity" : "Guide",
      duration: "45",
      capacity: "25",
      time: "09:00",
      facilitator: "Sarah Mitchell",
      department: "Engineering",
    };
    if (initial)
      for (const [k, v] of Object.entries(initial)) {
        if (typeof v === "string" || typeof v === "number") base[k] = String(v);
      }
    return base;
  });
  const [logo, setLogo] = useState(
    initial && "logo" in initial ? initial.logo : "",
  );
  const [error, setError] = useState("");
  const [clientEmployees, setClientEmployees] = useState<EmployeeDraft[]>([]);

  function addClientEmployee() {
    setClientEmployees((previous) => [
      ...previous,
      {
        id: uid(),
        name: "",
        email: "",
        department: "",
        title: "",
        status: "Active",
      },
    ]);
  }

  function updateClientEmployee(
    employeeId: string,
    field: Exclude<keyof EmployeeDraft, "id">,
    value: string,
  ) {
    setClientEmployees((previous) =>
      previous.map((employee) =>
        employee.id === employeeId ? { ...employee, [field]: value } : employee,
      ),
    );
  }
  const update = (k: string, v: string) =>
    setForm((f) => ({
      ...f,
      [k]: v,
      ...(k === "clientId" ? { engagementId: "none" } : {}),
    }));
  const clients = data.clients.map((c) => ({ value: c.id, label: c.name }));
  const engs = data.engagements
    .filter((e) => e.clientId === form.clientId && e.status !== "Completed")
    .map((e) => ({ value: e.id, label: e.name }));
  const depts = [
    "All employees",
    ...Array.from(
      new Set(
        data.employees
          .filter((e) => e.engagementId === engagementId)
          .map((e) => e.department),
      ),
    ),
  ];
  const fields: Record<FormKind, Field[]> = {
    client: [
      { key: "name", label: "Company name", wide: true },
      { key: "industry", label: "Industry" },
      {
        key: "size",
        label: "Company size",
        options: ["1–50", "51–200", "201–500", "501–1000", "1000+"],
      },
      { key: "contact", label: "Primary contact" },
      { key: "email", label: "Contact email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      {
        key: "consultant",
        label: "Assigned consultant",
        options: ["Sarah Mitchell", "David Chen"],
      },
      { key: "address", label: "Address", wide: true },
      { key: "color", label: "Brand color", type: "color" },
      { key: "status", label: "Status", options: ["Active", "Inactive"] },
    ],
    engagement: [
      { key: "name", label: "Engagement name", wide: true },
      { key: "clientId", label: "Corporate client", options: clients },
      {
        key: "consultant",
        label: "Assigned consultant",
        options: ["Sarah Mitchell", "David Chen"],
      },
      {
        key: "objective",
        label: "Program objectives",
        type: "textarea",
        wide: true,
      },
      { key: "start", label: "Start date", type: "date" },
      { key: "end", label: "End date", type: "date" },
    ],
    employee: [
      { key: "name", label: "Full name" },
      { key: "email", label: "Email", type: "email" },
      { key: "clientId", label: "Corporate client", options: clients },
      {
        key: "engagementId",
        label: "Engagement enrollment",
        options: [
          { value: "none", label: "Not enrolled" },
          ...engs,
          ...(initial &&
          "engagementId" in initial &&
          !engs.some((e) => e.value === initial.engagementId) &&
          initial.engagementId
            ? [
                {
                  value: initial.engagementId,
                  label:
                    data.engagements.find((e) => e.id === initial.engagementId)
                      ?.name || "Existing engagement",
                },
              ]
            : []),
        ],
      },
      { key: "department", label: "Department" },
      { key: "title", label: "Job title" },
      { key: "status", label: "Status", options: ["Active", "Inactive"] },
    ],
    assessment: [
      { key: "name", label: "Assessment name", wide: true },
      { key: "category", label: "Category", options: categories },
      {
        key: "phase",
        label: "Lifecycle phase",
        options: [phases[0], phases[2], phases[3]],
      },
      { key: "date", label: "Due date", type: "date" },
      {
        key: "frequency",
        label: "Frequency",
        options: ["Once", "Weekly", "Monthly"],
      },
      { key: "audience", label: "Audience", options: depts, wide: true },
    ],
    event: [
      { key: "name", label: "Activity or session title", wide: true },
      {
        key: "type",
        label: "Format",
        options: ["Activity", "Group session", "One-to-one"],
      },
      {
        key: "category",
        label: "Category",
        options: [
          "Yoga",
          "High-intensity workouts",
          "Learning",
          "Group activities",
          "Coaching",
          "Other",
        ],
      },
      { key: "date", label: "Date", type: "date" },
      { key: "time", label: "Time", type: "time" },
      { key: "duration", label: "Duration (minutes)", type: "number" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "facilitator", label: "Facilitator" },
      { key: "location", label: "Location or meeting link" },
      { key: "audience", label: "Audience", options: depts, wide: true },
    ],
    resource: [
      { key: "name", label: "Resource name", wide: true },
      {
        key: "type",
        label: "Resource type",
        options: ["Guide", "Document", "Video", "Session material"],
      },
      {
        key: "url",
        label: "Resource URL",
        type: "url",
        optional: true,
        wide: true,
      },
    ],
  };
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const id = initial?.id || uid();
    if (kind === "engagement" && form.end <= form.start)
      return setError("End date must be after the start date.");
    if (
      kind === "employee" &&
      data.employees.some(
        (e) =>
          e.email.toLowerCase() === form.email.toLowerCase() && e.id !== id,
      )
    )
      return setError("An employee with this email already exists.");
    if (
      kind === "event" &&
      (Number(form.duration) < 5 || Number(form.capacity) < 1)
    )
      return setError(
        "Set a duration of at least 5 minutes and a capacity of at least 1.",
      );
    if (kind === "resource" && !form.url && !form.fileName)
      return setError("Add a resource URL or select a local file.");
    if (kind === "client") {
      const emails = new Set(
        data.employees.map((employee) => employee.email.trim().toLowerCase()),
      );

      for (const [index, employee] of clientEmployees.entries()) {
        const email = employee.email.trim().toLowerCase();

        if (
          !employee.name.trim() ||
          !employee.department.trim() ||
          !employee.title.trim()
        ) {
          return setError(
            `Complete all required fields for employee ${index + 1}.`,
          );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return setError(
            `Enter a valid email address for employee ${index + 1}.`,
          );
        }

        if (emails.has(email)) {
          return setError(
            `Employee ${index + 1}: this email address is already used.`,
          );
        }

        emails.add(email);
      }
    }
    flushSync(() =>
      setData((d) => {
        const n = { ...d };
        if (kind === "client") {
          const item = { ...form, id, logo } as unknown as Client;

          n.clients = initial
            ? d.clients.map((client) => (client.id === id ? item : client))
            : [...d.clients, item];

          const newEmployees: Employee[] = clientEmployees.map((employee) => ({
            id: employee.id,
            clientId: id,
            engagementId: "",
            name: employee.name.trim(),
            email: employee.email.trim().toLowerCase(),
            department: employee.department.trim(),
            title: employee.title.trim(),
            status: employee.status,
          }));

          n.employees = [...d.employees, ...newEmployees];
        }
        if (kind === "engagement") {
          const item = {
            ...form,
            id,
            status: initial && "status" in initial ? initial.status : "Draft",
            phase:
              initial && "phase" in initial ? initial.phase : "Pre-assessment",
          } as Engagement;
          n.engagements = initial
            ? d.engagements.map((v) => (v.id === id ? item : v))
            : [...d.engagements, item];
          if (!initial && form.template !== "Custom program") {
            n.assessments = [
              ...d.assessments,
              ...[phases[0], phases[2], phases[3]].flatMap((phase, pi) =>
                (form.template === templates[1].name
                  ? categories.slice(1, 3)
                  : form.template === templates[2].name
                    ? categories.slice(0, 1)
                    : categories.slice(0, 3)
                ).map((category) => ({
                  id: uid(),
                  engagementId: id,
                  name: [
                    "Movement & energy",
                    "Mind & resilience",
                    "Connection & balance",
                  ][categories.indexOf(category)],
                  category,
                  phase,
                  date: pi === 2 ? form.end : form.start,
                  frequency: pi === 1 ? "Monthly" : "Once",
                  audience: "All employees",
                })),
              ),
            ];
            n.resources = [
              ...d.resources,
              {
                id: uid(),
                engagementId: id,
                name: "Everyday wellbeing guide",
                type: "Guide",
                url: "/wellbeing-guide.html",
              },
            ];
          }
        }
        if (kind === "employee") {
          const item = {
            ...form,
            id,
            engagementId: form.engagementId === "none" ? "" : form.engagementId,
          } as unknown as Employee;
          n.employees = initial
            ? d.employees.map((v) => (v.id === id ? item : v))
            : [...d.employees, item];
        }
        if (kind === "assessment") {
          const item = { ...form, id, engagementId } as Assessment;
          n.assessments = initial
            ? d.assessments.map((v) => (v.id === id ? item : v))
            : [...d.assessments, item];
        }
        if (kind === "event") {
          const item = {
            ...form,
            id,
            engagementId,
            duration: Number(form.duration),
            capacity: form.type === "One-to-one" ? 1 : Number(form.capacity),
            attendees:
              initial && "attendees" in initial ? initial.attendees : [],
            assignedEmployeeIds:
              initial && "assignedEmployeeIds" in initial
                ? initial.assignedEmployeeIds
                : undefined,
          } as Event;
          n.events = initial
            ? d.events.map((v) => (v.id === id ? item : v))
            : [...d.events, item];
        }
        if (kind === "resource") {
          const item = { ...form, id, engagementId } as Resource;
          n.resources = initial
            ? d.resources.map((v) => (v.id === id ? item : v))
            : [...d.resources, item];
        }
        return n;
      }),
    );
    toast.success(
      initial
        ? "Changes saved"
        : kind === "engagement"
          ? "Engagement created. Configure your program next."
          : "Record added",
    );
    if (onSaved) onSaved(id);
    else onClose();
  }
  const labels = {
    client: "corporate client",
    engagement: "engagement",
    employee: "employee",
    assessment: "assessment",
    event: "activity or session",
    resource: "resource",
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="form-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit" : "Create"} {labels[kind]}
          </DialogTitle>
          <DialogDescription>
            {kind === "engagement"
              ? "Start with the essentials. Your engagement will be saved as a draft."
              : "Keep your program details connected and up to date."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="form-grid">
            {fields[kind].map((f) => (
              <label className={f.wide ? "wide" : ""} key={f.key}>
                <span>
                  {f.label}
                  {f.optional ? " (optional)" : ""}
                </span>
                {f.options ? (
                  <Pick
                    label={f.label}
                    value={form[f.key] || ""}
                    onChange={(v) => update(f.key, v)}
                    options={f.options}
                  />
                ) : f.type === "textarea" ? (
                  <textarea
                    required={!f.optional}
                    value={form[f.key] || ""}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    required={!f.optional}
                    type={f.type || "text"}
                    min={f.type === "number" ? 1 : undefined}
                    value={form[f.key] || ""}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                )}
              </label>
            ))}
            {kind === "client" && (
              <label className="wide">
                Logo preview (optional)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 300000)
                        return toast.error(
                          "Choose a logo smaller than 300 KB.",
                        );
                      const r = new FileReader();
                      r.onload = () => setLogo(String(r.result));
                      r.readAsDataURL(file);
                    }
                  }}
                />
                {logo && (
                  <Image
                    unoptimized
                    width={160}
                    height={45}
                    src={logo}
                    alt="Company logo preview"
                    className="logo-preview"
                  />
                )}
              </label>
            )}
            {kind === "resource" && (
              <label className="wide">
                Or select a local file
                <input
                  type="file"
                  onChange={(e) =>
                    update("fileName", e.target.files?.[0]?.name || "")
                  }
                />
                <small>
                  Only the filename is saved. File contents are not uploaded.
                </small>
              </label>
            )}
          </div>
          {kind === "client" && (
            <section className="client-employee-section">
              <div className="client-employee-header">
                <div>
                  <h3>Employees</h3>
                  <p>Add your employees while setting up the company.</p>
                </div>

                <Action secondary onClick={addClientEmployee}>
                  + Add employee
                </Action>
              </div>

              {clientEmployees.length === 0 && (
                <p className="client-employee-empty">
                  No employees added yet. You can also save the company without
                  employees.
                </p>
              )}

              {clientEmployees.map((employee, index) => (
                <fieldset className="client-employee-card" key={employee.id}>
                  <legend>Employee {index + 1}</legend>

                  <div className="client-employee-remove">
                    <button
                      type="button"
                      className="text-link"
                      aria-label={`Remove employee ${index + 1}`}
                      onClick={() =>
                        setClientEmployees((previous) =>
                          previous.filter((item) => item.id !== employee.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-grid">
                    <label>
                      <span>Full name</span>
                      <input
                        required
                        value={employee.name}
                        onChange={(event) =>
                          updateClientEmployee(
                            employee.id,
                            "name",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Email</span>
                      <input
                        required
                        type="email"
                        value={employee.email}
                        onChange={(event) =>
                          updateClientEmployee(
                            employee.id,
                            "email",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Corporate client</span>
                      <input
                        readOnly
                        value={form.name || "New corporate client"}
                      />
                    </label>

                    <label>
                      <span>Engagement enrollment</span>
                      <input readOnly value="Not enrolled" />
                    </label>

                    <label>
                      <span>Department</span>
                      <input
                        required
                        value={employee.department}
                        onChange={(event) =>
                          updateClientEmployee(
                            employee.id,
                            "department",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Job title</span>
                      <input
                        required
                        value={employee.title}
                        onChange={(event) =>
                          updateClientEmployee(
                            employee.id,
                            "title",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Status</span>
                      <Pick
                        label={`Employee ${index + 1} status`}
                        value={employee.status}
                        onChange={(value) =>
                          updateClientEmployee(employee.id, "status", value)
                        }
                        options={["Active", "Inactive"]}
                      />
                    </label>
                  </div>
                </fieldset>
              ))}

              {clientEmployees.length > 0 && (
                <Action secondary onClick={addClientEmployee}>
                  + Add another employee
                </Action>
              )}
            </section>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Action secondary onClick={onClose}>
              Cancel
            </Action>
            <Action type="submit">
              {initial
                ? "Save changes"
                : kind === "engagement"
                  ? "Create engagement"
                  : kind === "client" && clientEmployees.length > 0
                    ? `Save client & ${clientEmployees.length} employee${
                        clientEmployees.length === 1 ? "" : "s"
                      }`
                    : "Save " + labels[kind]}
            </Action>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function Confirm({
  title,
  text,
  onConfirm,
  onClose,
}: {
  title: string;
  text: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
