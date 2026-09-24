"use client";
import { useState } from "react";
import {
  Pencil,
  Trash2,
  CalendarDays,
  Clock3,
  Users,
  FileText,
  ExternalLink,
  Check,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSolace } from "@/lib/solace/store";
import {
  Assessment,
  Event,
  Resource,
  Phase,
  audienceEmployees,
  day,
  fmt,
  uid,
  pct,
} from "@/lib/solace/data";
import {
  Pick,
  Action,
  Add,
  Badge,
  Meter,
  DataTable,
  Row,
  Cell,
  Empty,
  Avatar,
  SearchBox,
} from "./ui";
import { EditForm, Confirm } from "./forms";
import { ActivityForm } from "./activity-form";
import { ActivityEmployeeTable } from "./activity-employee-table";
export function AssessmentPanel({
  engagementId,
  phase,
  configure = false,
}: {
  engagementId: string;
  phase?: Phase;
  configure?: boolean;
}) {
  const { data, setData } = useSolace();
  const [edit, setEdit] = useState<Assessment | null | undefined>();
  const [review, setReview] = useState<string | null>(null);
  const [remove, setRemove] = useState<Assessment | null>(null);
  const [category, setCategory] = useState("All categories");
  const [query, setQuery] = useState("");
  const assessments = data.assessments.filter(
    (a) =>
      a.engagementId === engagementId &&
      (!phase || a.phase === phase) &&
      (category === "All categories" || a.category === category) &&
      a.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="section-head">
        <div>
          <h2>
            {configure
              ? "Assessment plan"
              : phase === "Post-assessment"
                ? "Final assessments & feedback"
                : phase === "Ongoing assessments"
                  ? "Check in. See what’s changing."
                  : "Build a meaningful baseline"}
          </h2>
          <p>
            {configure
              ? "Choose what to measure, when, and with whom."
              : "Track completion and record fictional employee wellbeing results."}
          </p>
        </div>
        <Add onClick={() => setEdit(null)}>Schedule assessment</Add>
      </div>
      <div className="toolbar compact">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search assessments…"
        />
        <Pick
          value={category}
          onChange={setCategory}
          label="Assessment category"
          options={[
            "All categories",
            ...Array.from(
              new Set(
                data.assessments
                  .filter((a) => a.engagementId === engagementId)
                  .map((a) => a.category),
              ),
            ),
          ]}
        />
      </div>
      <div className="panel">
        <DataTable
          headers={[
            "Assessment",
            "Due date",
            "Audience",
            "Completion",
            "Actions",
          ]}
        >
          {assessments.map((a) => {
            const people = audienceEmployees(data, a);
            const done = people.filter((e) =>
              data.results.some(
                (r) => r.assessmentId === a.id && r.employeeId === e.id,
              ),
            ).length;
            return (
              <Row key={a.id}>
                <Cell>
                  <div className="cell-title">
                    <span className="table-icon">
                      <ClipboardCheck size={18} />
                    </span>
                    <div>
                      <strong>{a.name}</strong>
                      <small>
                        {a.category} · {configure ? a.phase : a.frequency}
                      </small>
                    </div>
                  </div>
                </Cell>
                <Cell>
                  {fmt(a.date)}
                  {a.date < day() && done < people.length && (
                    <small className="overdue">Overdue</small>
                  )}
                </Cell>
                <Cell>
                  {a.audience}
                  <small>{people.length} employees</small>
                </Cell>
                <Cell>
                  <Meter value={pct(done, people.length)} />
                  <small>
                    {done} of {people.length} results
                  </small>
                </Cell>
                <Cell>
                  <div className="row-actions">
                    <button
                      className="text-link"
                      onClick={() => setReview(a.id)}
                    >
                      Review <ArrowRight size={14} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Edit " + a.name}
                      onClick={() => setEdit(a)}
                    >
                      <Pencil size={15} />
                    </button>
                    {configure && (
                      <button
                        className="icon-button"
                        aria-label={"Remove " + a.name}
                        onClick={() => setRemove(a)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </Cell>
              </Row>
            );
          })}
        </DataTable>
        {!assessments.length && (
          <Empty
            title="No assessments scheduled"
            text="Add an assessment to shape this stage of the journey."
          />
        )}
      </div>
      {edit !== undefined && (
        <EditForm
          kind="assessment"
          defaultPhase={phase}
          initial={edit || undefined}
          engagementId={engagementId}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {review && (
        <ResultDialog assessmentId={review} onClose={() => setReview(null)} />
      )}{" "}
      {remove && (
        <Confirm
          title="Remove this assessment?"
          text="Its recorded demo results will also be removed."
          onClose={() => setRemove(null)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              assessments: d.assessments.filter((a) => a.id !== remove.id),
              results: d.results.filter((r) => r.assessmentId !== remove.id),
            }));
            toast.success("Assessment removed");
          }}
        />
      )}
    </>
  );
}
export function ResultDialog({
  assessmentId,
  onClose,
}: {
  assessmentId: string;
  onClose: () => void;
}) {
  const { data, setData } = useSolace();
  const a = data.assessments.find((a) => a.id === assessmentId)!;
  const people = audienceEmployees(data, a);
  const [employee, setEmployee] = useState(
    people.find(
      (e) =>
        !data.results.some(
          (r) => r.employeeId === e.id && r.assessmentId === a.id,
        ),
    )?.id ||
      people[0]?.id ||
      "",
  );
  const existing = data.results.find(
    (r) => r.assessmentId === assessmentId && r.employeeId === employee,
  );
  const [score, setScore] = useState(existing ? String(existing.score) : "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [filter, setFilter] = useState("All employees");
  function select(id: string) {
    setEmployee(id);
    const r = data.results.find(
      (r) => r.assessmentId === assessmentId && r.employeeId === id,
    );
    setScore(r ? String(r.score) : "");
    setNotes(r?.notes || "");
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="form-dialog wide-dialog">
        <DialogHeader>
          <DialogTitle>{a.name}</DialogTitle>
          <DialogDescription>
            {a.phase} · {a.category} · Due {fmt(a.date)}
          </DialogDescription>
        </DialogHeader>
        <div className="result-grid">
          <div>
            <Pick
              value={filter}
              onChange={setFilter}
              label="Completion status"
              options={["All employees", "Awaiting results", "Completed"]}
            />
            <div className="result-people">
              {people
                .filter(
                  (e) =>
                    filter === "All employees" ||
                    (filter === "Completed") ===
                      data.results.some(
                        (r) => r.employeeId === e.id && r.assessmentId === a.id,
                      ),
                )
                .map((e) => (
                  <button
                    key={e.id}
                    className={employee === e.id ? "selected" : ""}
                    onClick={() => select(e.id)}
                  >
                    <Avatar name={e.name} small />
                    <span>
                      {e.name}
                      <small>{e.department}</small>
                    </span>
                    {data.results.some(
                      (r) => r.employeeId === e.id && r.assessmentId === a.id,
                    ) ? (
                      <Check size={16} />
                    ) : (
                      <span className="pending-dot" />
                    )}
                  </button>
                ))}
            </div>
          </div>
          {people.length ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const result = {
                  id: existing?.id || uid(),
                  assessmentId,
                  employeeId: employee,
                  score: Number(score),
                  notes,
                  date: day(),
                };
                setData((d) => ({
                  ...d,
                  results: [
                    ...d.results.filter(
                      (r) =>
                        !(
                          r.assessmentId === assessmentId &&
                          r.employeeId === employee
                        ),
                    ),
                    result,
                  ],
                }));
                toast.success("Result recorded. Progress and reports updated.");
              }}
            >
              <h3>{people.find((e) => e.id === employee)?.name}</h3>
              <p className="muted">
                Illustrative wellbeing index. Higher means a more positive
                self-reported experience.
              </p>
              <label>
                Demo score (0–100)
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </label>
              <label>
                Consultant notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add context for this check-in…"
                />
              </label>
              <p className="field-note">
                Fictional demonstration measure, not a clinical assessment or
                medical diagnosis.
              </p>
              <Action type="submit">
                {existing ? "Update result" : "Record & mark complete"}
              </Action>
            </form>
          ) : (
            <Empty
              title="Enroll employees first"
              text="This assessment will become available when employees match its audience."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function EventsPanel({
  engagementId,
  mode = "all",
  hideHeader = false,
}: {
  engagementId?: string;
  mode?: "all" | "activities" | "sessions" | "calendar";
  hideHeader?: boolean;
}) {
  const [activityForm, setActivityForm] = useState<
    { activity: Event; employeeId: string } | null | undefined
  >();
  const { data, setData, clientId } = useSolace();
  const [edit, setEdit] = useState<Event | null | undefined>();
  const [details, setDetails] = useState<string | null>(null);
  const [remove, setRemove] = useState<Event | null>(null);
  const [filter, setFilter] = useState("All types");
  const events = data.events
    .filter((event) => {
      const parent = data.engagements.find(
        (item) => item.id === event.engagementId,
      );

      return (
        !!parent &&
        (!engagementId || event.engagementId === engagementId) &&
        (clientId === "all" || parent.clientId === clientId) &&
        (mode !== "activities" || event.type === "Activity") &&
        (mode !== "sessions" || event.type !== "Activity") &&
        (filter === "All types" || event.type === filter)
      );
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const ev = data.events.find((v) => v.id === details);
  return (
    <>
      {!hideHeader && (
        <div className="section-head">
          <div>
            <h2>
              {mode === "calendar"
                ? "Your program, in rhythm"
                : mode === "sessions"
                  ? "Space to connect"
                  : mode === "activities"
                    ? "Activities"
                    : "A little movement. A meaningful connection."}
            </h2>
            <p>
              {mode === "activities"
                ? "Create activities and manage employee assignments."
                : mode === "calendar"
                  ? "An agenda of assessments, activities and sessions."
                  : "Plan experiences that bring the program into everyday life."}
            </p>
          </div>
          <div className="row-actions">
            {mode !== "sessions" && (
              <Add onClick={() => setActivityForm(null)}>Add activity</Add>
            )}

            {mode !== "activities" && (
              <Action secondary onClick={() => setEdit(null)}>
                Add session
              </Action>
            )}
          </div>
        </div>
      )}
      {!hideHeader && (
        <div className="toolbar compact">
          {mode !== "activities" && (
            <Pick
              value={filter}
              onChange={setFilter}
              label="Event type"
              options={["All types", "Activity", "Group session", "One-to-one"]}
            />
          )}
          <span className="toolbar-count">
            {events.length}{" "}
            {mode === "activities"
              ? events.length === 1
                ? "activity"
                : "activities"
              : "scheduled experiences"}
          </span>
        </div>
    )}
      {mode !== "sessions" && (
        <ActivityEmployeeTable
          events={events}
          onView={setDetails}
          onEdit={(activity, employeeId) =>
            setActivityForm({ activity, employeeId })
          }
        />
      )}
      <div className="event-list">
        {events
          .filter((v) => v.type !== "Activity")
          .map((v) => (
            <article className="event-card" key={v.id}>
              <div className="date-tile">
                <span>
                  {new Date(v.date + "T12:00").toLocaleDateString("en", {
                    month: "short",
                  })}
                </span>
                <strong>{new Date(v.date + "T12:00").getDate()}</strong>
              </div>
              <div className="event-main">
                <div>
                  <Badge tone={v.type === "One-to-one" ? "violet" : "amber"}>
                    {v.type}
                  </Badge>
                  {v.date < day() && (
                    <span className="muted small">Past event</span>
                  )}
                </div>
                <h3>{v.name}</h3>
                <p>
                  <Clock3 size={14} />
                  {v.time} · {v.duration} min <span>·</span>
                  {v.facilitator}
                </p>
                <small>
                  {v.location} · {v.audience}
                </small>
              </div>
              <div className="event-actions">
                <span>
                  <Users size={15} />
                  {v.attendees.length} / {v.capacity} attended
                </span>
                <div className="row-actions">
                  <Action secondary onClick={() => setDetails(v.id)}>
                    View session
                  </Action>
                  <button
                    className="icon-button"
                    aria-label={"Edit " + v.name}
                    onClick={() => setEdit(v)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Remove " + v.name}
                    onClick={() => setRemove(v)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
      {!events.length && mode === "sessions" && (
        <Empty
          title="The calendar is yours to shape"
          text="Add your first activity or session to the program."
        />
      )}
      {mode === "calendar" && (
        <section className="panel agenda-assessments">
          <h3>Assessment deadlines</h3>
          {data.assessments
            .filter((a) => a.engagementId === engagementId)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((a) => (
              <div key={a.id}>
                <CalendarDays size={16} />
                <strong>{fmt(a.date)}</strong>
                <span>{a.name}</span>
                <Badge>{a.phase}</Badge>
              </div>
            ))}
        </section>
      )}
      {edit !== undefined && (
        <EditForm
          kind="event"
          initial={edit || undefined}
          engagementId={engagementId}
          onClose={() => setEdit(undefined)}
        />
      )}
      {activityForm !== undefined && (
        <ActivityForm
          key={
            activityForm
              ? `${activityForm.activity.id}-${activityForm.employeeId}`
              : `new-activity-${engagementId}`
          }
          engagementId={activityForm?.activity.engagementId || engagementId}
          initial={activityForm?.activity}
          employeeId={activityForm?.employeeId}
          onClose={() => setActivityForm(undefined)}
        />
      )}
      <Dialog open={!!ev} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="form-dialog">
          <DialogHeader>
            <DialogTitle>{ev?.name}</DialogTitle>
            <DialogDescription>
              {ev && `${fmt(ev.date)} · ${ev.time} · ${ev.duration} minutes`}
            </DialogDescription>
          </DialogHeader>
          {ev && (
            <>
              <div className="info-strip">
                <span>{ev.facilitator}</span>
                <span>{ev.location}</span>
              </div>
              <h3>Employee attendance</h3>
              <p className="muted">
                Select attendees to update participation. Capacity:{" "}
                {ev.capacity}.
              </p>
              <div className="attendance-list">
                {data.employees
                  .filter((employee) => {
                    const activityEngagement = data.engagements.find(
                      (item) => item.id === ev.engagementId,
                    );
                    if (employee.clientId !== activityEngagement?.clientId) {
                      return false;
                    }
                    if (ev.assignedEmployeeIds !== undefined) {
                      return ev.assignedEmployeeIds.includes(employee.id);
                    }
                    return (
                      employee.status === "Active" &&
                      employee.engagementId === ev.engagementId &&
                      (ev.audience === "All employees" ||
                        employee.department === ev.audience)
                    );
                  })
                  .map((e) => (
                    <label key={e.id}>
                      <Checkbox
                        checked={ev.attendees.includes(e.id)}
                        onCheckedChange={(checked) => {
                          if (checked && ev.attendees.length >= ev.capacity)
                            return toast.error(
                              "Session capacity reached. Edit capacity to add more attendees.",
                            );
                          setData((d) => ({
                            ...d,
                            events: d.events.map((v) =>
                              v.id === ev.id
                                ? {
                                    ...v,
                                    attendees: checked
                                      ? Array.from(
                                          new Set([...v.attendees, e.id]),
                                        )
                                      : v.attendees.filter((id) => id !== e.id),
                                  }
                                : v,
                            ),
                          }));
                        }}
                      />
                      <Avatar name={e.name} small />
                      <span>
                        {e.name}
                        <small>{e.department}</small>
                      </span>
                    </label>
                  ))}
              </div>
              <Action
                onClick={() => {
                  setDetails(null);
                  toast.success("Attendance saved");
                }}
              >
                Done
              </Action>
            </>
          )}
        </DialogContent>
      </Dialog>
      {remove && (
        <Confirm
          title="Remove this activity or session?"
          text="This also removes its demo attendance records."
          onClose={() => setRemove(null)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              events: d.events.filter((v) => v.id !== remove.id),
            }));
            toast.success("Event removed");
          }}
        />
      )}
    </>
  );
}
export function ResourcesPanel({ engagementId }: { engagementId: string }) {
  const { data, setData } = useSolace();
  const [edit, setEdit] = useState<Resource | null | undefined>();
  const [remove, setRemove] = useState<Resource | null>(null);
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Support beyond the session</h2>
          <p>Practical resources for everyday progress.</p>
        </div>
        <Add onClick={() => setEdit(null)}>Add resource</Add>
      </div>
      <div className="resource-grid">
        {data.resources
          .filter((r) => r.engagementId === engagementId)
          .map((r) => (
            <article className="panel resource-card" key={r.id}>
              <FileText size={27} />
              <Badge>{r.type}</Badge>
              <h3>{r.name}</h3>
              {r.url ? (
                <a
                  className="text-link"
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open resource <ExternalLink size={15} />
                </a>
              ) : (
                <p className="muted">
                  {r.fileName}
                  <small>Local file reference only · not uploaded</small>
                </p>
              )}
              <div className="row-actions">
                <button className="text-link" onClick={() => setEdit(r)}>
                  Edit
                </button>
                <button
                  className="icon-button"
                  aria-label={"Remove " + r.name}
                  onClick={() => setRemove(r)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
      </div>
      {!data.resources.some((r) => r.engagementId === engagementId) && (
        <Empty
          title="No resources yet"
          text="Add a guide, video or session material."
        />
      )}
      {edit !== undefined && (
        <EditForm
          kind="resource"
          initial={edit || undefined}
          engagementId={engagementId}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {remove && (
        <Confirm
          title="Remove this resource reference?"
          text="The original file or website will not be changed."
          onClose={() => setRemove(null)}
          onConfirm={() =>
            setData((d) => ({
              ...d,
              resources: d.resources.filter((r) => r.id !== remove.id),
            }))
          }
        />
      )}
    </>
  );
}
export function ProgramTabs({ engagementId }: { engagementId: string }) {
  return (
    <Tabs defaultValue="assessments" className="program-tabs">
      <TabsList className="section-tabs">
        {["Assessments", "Activities", "Sessions", "Calendar", "Resources"].map(
          (t) => (
            <TabsTrigger key={t} value={t.toLowerCase()}>
              {t}
            </TabsTrigger>
          ),
        )}
      </TabsList>
      <TabsContent value="assessments">
        <AssessmentPanel engagementId={engagementId} configure />
      </TabsContent>
      <TabsContent value="activities">
        <EventsPanel engagementId={engagementId} mode="activities" />
      </TabsContent>
      <TabsContent value="sessions">
        <EventsPanel engagementId={engagementId} mode="sessions" />
      </TabsContent>
      <TabsContent value="calendar">
        <EventsPanel engagementId={engagementId} mode="calendar" />
      </TabsContent>
      <TabsContent value="resources">
        <ResourcesPanel engagementId={engagementId} />
      </TabsContent>
    </Tabs>
  );
}
