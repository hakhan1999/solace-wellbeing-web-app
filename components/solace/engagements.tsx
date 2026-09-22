"use client";
import { useState } from "react";
import Link from "./navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "./navigation";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  CalendarDays,
  ClipboardCheck,
  Activity,
  ChartNoAxesCombined,
  Flag,
  Plus,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSolace } from "@/lib/solace/store";
import {
  Engagement,
  Phase,
  phases,
  stats,
  fmt,
  pct,
  audienceEmployees,
  day,
} from "@/lib/solace/data";
import {
  Heading,
  Add,
  Pick,
  SearchBox,
  Badge,
  Avatar,
  Meter,
  Action,
  Empty,
} from "./ui";
import { EditForm, Confirm } from "./forms";
import { EventsPanel } from "./program-content";
import { OutcomeChart } from "./charts";
import { ActivityForm } from "./activity-form";

import { EngagementDocuments } from "./engagement-documents";
export function activationIssues(
  data: ReturnType<typeof useSolace>["data"],
  id: string,
) {
  return [
    !data.employees.some((e) => e.engagementId === id && e.status === "Active")
      ? "Enroll at least one active employee"
      : null,
    !data.assessments.some(
      (a) => a.engagementId === id && a.phase === "Pre-assessment",
    )
      ? "Schedule a pre-assessment"
      : null,
    !data.assessments.some(
      (a) => a.engagementId === id && a.phase === "Post-assessment",
    )
      ? "Schedule a post-assessment"
      : null,
    !data.events.some((v) => v.engagementId === id)
      ? "Schedule an activity or session"
      : null,
  ].filter(Boolean) as string[];
}
export function Engagements() {
  const [activityEngagementId, setActivityEngagementId] = useState<
    string | null
  >(null);
  const { data, setData, clientId } = useSolace();
  const router = useRouter();
  const params = useSearchParams();
  const [create, setCreate] = useState(Boolean(params.get("new")));
  const [edit, setEdit] = useState<Engagement | undefined>();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [phaseSelection, setPhaseSelection] = useState<{
    id: string | null;
    phase: Phase;
  } | null>(null);
  const [complete, setComplete] = useState(false);
  const id = params.get("id");
  const engagement = data.engagements.find((e) => e.id === id);
  const phase =
    phaseSelection?.id === id
      ? phaseSelection.phase
      : params.has("phase")
        ? phases[Number(params.get("phase"))] || engagement?.phase || phases[0]
        : engagement?.phase || phases[0];
  const setPhase = (phase: Phase) => setPhaseSelection({ id, phase });
  const ens = data.engagements.filter(
    (e) =>
      (clientId === "all" || e.clientId === clientId) &&
      (status === "All statuses" || e.status === status) &&
      e.name.toLowerCase().includes(query.toLowerCase()),
  );
  const ss = stats(data, id || undefined);
  const client = data.clients.find((c) => c.id === engagement?.clientId);
  const issues = engagement ? activationIssues(data, engagement.id) : [];
  const finalA = data.assessments.filter(
    (a) => a.engagementId === id && a.phase === "Post-assessment",
  );
  const finalDone =
    finalA.length > 0 &&
    finalA.every(
      (a) =>
        audienceEmployees(data, a).length > 0 &&
        audienceEmployees(data, a).every((e) =>
          data.results.some(
            (r) => r.assessmentId === a.id && r.employeeId === e.id,
          ),
        ),
    );
  const phaseAssessments = data.assessments.filter(
    (a) => a.engagementId === id && a.phase === phase,
  );
  const phaseAssignments = phaseAssessments.reduce(
    (s, a) => s + audienceEmployees(data, a).length,
    0,
  );
  const phaseResults = phaseAssessments.reduce(
    (s, a) =>
      s +
      audienceEmployees(data, a).filter((e) =>
        data.results.some(
          (r) => r.assessmentId === a.id && r.employeeId === e.id,
        ),
      ).length,
    0,
  );
  return (
    <>
      {engagement ? (
        <>
          <button
            type="button"
            className="back-link"
            onClick={() => router.push("/engagements")}
          >
            <ArrowLeft size={15} />
            All engagements
          </button>

          <Heading
            eyebrow={client?.name}
            title={engagement.name}
            description={engagement.objective}
          />

          <Tabs
            key={engagement.id}
            defaultValue="activities"
            className="program-tabs"
          >
            <TabsList className="section-tabs">
              <TabsTrigger value="activities">Activities</TabsTrigger>

              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="activities">
              <EventsPanel engagementId={engagement.id} mode="activities" />
            </TabsContent>

            <TabsContent value="documents">
              <EngagementDocuments engagementId={engagement.id} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          <Heading
            eyebrow="PROGRESS WITH PURPOSE"
            title="Engagements"
            description="From the first check-in to lasting positive change."
            action={
              <Add onClick={() => setCreate(true)}>Create engagement</Add>
            }
          />
          <div className="toolbar">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search engagements…"
            />
            <Pick
              label="Engagement status"
              value={status}
              onChange={setStatus}
              options={["All statuses", "Active", "Draft", "Completed"]}
            />
            <span className="toolbar-count">{ens.length} engagements</span>
          </div>
          <div className="engagement-grid">
            {ens.map((e) => {
              const c = data.clients.find((c) => c.id === e.clientId);
              const st = stats(data, e.id);
              const employeeIds = new Set<string>();

              data.events
                .filter(
                  (activity) =>
                    activity.engagementId === e.id &&
                    activity.type === "Activity",
                )
                .forEach((activity) => {
                  const assignedIds =
                    activity.assignedEmployeeIds ??
                    data.employees
                      .filter(
                        (employee) =>
                          employee.clientId === e.clientId &&
                          employee.engagementId === e.id &&
                          employee.status === "Active" &&
                          (activity.audience === "All employees" ||
                            employee.department === activity.audience),
                      )
                      .map((employee) => employee.id);

                  assignedIds.forEach((employeeId) => {
                    if (
                      data.employees.some(
                        (employee) =>
                          employee.id === employeeId &&
                          employee.clientId === e.clientId,
                      )
                    ) {
                      employeeIds.add(employeeId);
                    }
                  });
                });

              const employeeCount = employeeIds.size;
              return (
                <Link
                  className="engagement-card"
                  key={e.id}
                  href={"/engagements?id=" + e.id}
                >
                  <div className="client-top">
                    <Avatar name={c?.name || ""} color={c?.color} />
                    <Badge>{e.status}</Badge>
                  </div>
                  <small>{c?.name}</small>
                  <h2>{e.name}</h2>
                  <p>{e.objective}</p>
                  <div className="eng-card-meta">
                    <span>
                      <Users size={15} />
                      {employeeCount}{" "}
                      {employeeCount === 1 ? "employee" : "employees"}
                    </span>
                    <span>
                      <CalendarDays size={15} />
                      {fmt(e.end)}
                    </span>
                  </div>
                  {/* <Meter value={st.completion} /> */}
                  <div className="eng-card-foot">
                    <span>Open engagement</span>
                    <ArrowRight size={17} />
                  </div>
                </Link>
              );
            })}
          </div>
          {!ens.length && (
            <Empty
              title="No matching engagements"
              text="Create an engagement or adjust your filters."
            />
          )}
        </>
      )}
      {(create || edit) && (
        <EditForm
          kind="engagement"
          initial={edit}
          clientId={params.get("client") || undefined}
          onClose={() => {
            setCreate(false);
            setEdit(undefined);
            if (params.get("new")) router.replace("/engagements");
          }}
          onSaved={(newId) => {
            setCreate(false);
            setEdit(undefined);
            router.push("/engagements?id=" + newId);
          }}
        />
      )}{" "}
      {activityEngagementId && (
        <ActivityForm
          key={activityEngagementId}
          engagementId={activityEngagementId}
          onClose={() => setActivityEngagementId(null)}
        />
      )}
      {complete && (
        <Confirm
          title="Complete this engagement?"
          text="The engagement will be marked completed. You can continue reviewing results and generating reports."
          onClose={() => setComplete(false)}
          onConfirm={() => {
            setData((d) => ({
              ...d,
              engagements: d.engagements.map((e) =>
                e.id === id
                  ? { ...e, status: "Completed", phase: "Post-assessment" }
                  : e,
              ),
            }));
            toast.success("Engagement completed");
          }}
        />
      )}
    </>
  );
}
function ArrowUpIcon() {
  return <ArrowRight size={16} />;
}
