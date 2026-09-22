"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "./navigation";
import {
  Upload,
  Download,
  Mail,
  Pencil,
  Users,
  FileText,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useSolace } from "@/lib/solace/store";
import { Employee, uid, fmt, pct } from "@/lib/solace/data";
import { parseCSV, download } from "@/lib/solace/csv";
import {
  Heading,
  Add,
  Action,
  Pick,
  SearchBox,
  DataTable,
  Row,
  Cell,
  Avatar,
  Badge,
  Empty,
  Meter,
} from "./ui";
import { EditForm } from "./forms";
export function Employees() {
  const { data, clientId } = useSolace();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All departments");
  const [status, setStatus] = useState("All statuses");
  const [enrollment, setEnrollment] = useState("All enrollments");
  const [localClient, setLocalClient] = useState(params.get("client") || "all");
  const [edit, setEdit] = useState<Employee | null | undefined>();
  //   const [imp, setImp] = useState(false);
  const [selected, setSelected] = useState<string | null>(
    params.get("employee"),
  );
  const [page, setPage] = useState(0);
  const effectiveClient = localClient === "all" ? clientId : localClient;
  const employees = data.employees.filter(
    (e) =>
      (effectiveClient === "all" || e.clientId === effectiveClient) &&
      (e.name + " " + e.email).toLowerCase().includes(query.toLowerCase()) &&
      (dept === "All departments" || dept === e.department) &&
      (status === "All statuses" || e.status === status) &&
      (enrollment === "All enrollments" ||
        (enrollment === "Enrolled" ? !!e.engagementId : !e.engagementId)),
  );
  const employee = data.employees.find((e) => e.id === selected);
  const pageNum = Math.min(
    page,
    Math.max(0, Math.ceil(employees.length / 10) - 1),
  );
  return (
    <>
      <Heading
        eyebrow="PEOPLE AT THE HEART OF IT ALL"
        title="Employees"
        description="View employees across your corporate clients and engagements."
      />
      <div className="employee-summary">
        <div>
          <Users size={21} />
          <strong>{employees.length}</strong>
          <span>employees in view</span>
        </div>
        <div>
          <CheckCircle2 size={21} />
          <strong>{employees.filter((e) => e.engagementId).length}</strong>
          <span>enrolled in an engagement</span>
        </div>
        <div>
          <span className="status-dot" />
          <strong>
            {employees.filter((e) => e.status === "Active").length}
          </strong>
          <span>active employees</span>
        </div>
      </div>
      <div className="panel directory">
        <div className="toolbar">
          <SearchBox
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(0);
            }}
            placeholder="Search name or email…"
          />
          <Pick
            value={localClient}
            onChange={(v) => {
              setLocalClient(v);
              setPage(0);
            }}
            label="Employee company"
            options={[
              { value: "all", label: "Current client context" },
              ...data.clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Pick
            value={dept}
            onChange={setDept}
            label="Department"
            options={[
              "All departments",
              ...Array.from(new Set(data.employees.map((e) => e.department))),
            ]}
          />
          <Pick
            value={status}
            onChange={setStatus}
            label="Employee status"
            options={["All statuses", "Active", "Inactive"]}
          />
          <Pick
            value={enrollment}
            onChange={setEnrollment}
            label="Enrollment"
            options={["All enrollments", "Enrolled", "Not enrolled"]}
          />
        </div>
        <DataTable
          headers={[
            "Employee",
            "Corporate client",
            "Department",
            "Engagement",
            "Assessments",
            "Status",
            "",
          ]}
        >
          {employees.slice(pageNum * 10, pageNum * 10 + 10).map((e) => {
            const aa = data.assessments.filter(
              (a) =>
                a.engagementId === e.engagementId &&
                (a.audience === "All employees" || a.audience === e.department),
            );
            const completed = aa.filter((a) =>
              data.results.some(
                (r) => r.assessmentId === a.id && r.employeeId === e.id,
              ),
            ).length;
            return (
              <Row key={e.id}>
                <Cell>
                  <button
                    className="cell-title employee-button"
                    onClick={() => setSelected(e.id)}
                  >
                    <Avatar name={e.name} />
                    <span>
                      <strong>{e.name}</strong>
                      <small>{e.email}</small>
                    </span>
                  </button>
                </Cell>
                <Cell>
                  {data.clients.find((c) => c.id === e.clientId)?.name}
                </Cell>
                <Cell>
                  {e.department}
                  <small>{e.title}</small>
                </Cell>
                <Cell>
                  {data.engagements.find((v) => v.id === e.engagementId)
                    ?.name || "Not enrolled"}
                </Cell>
                <Cell>
                  <Meter value={pct(completed, aa.length)} />
                  <small>
                    {completed} / {aa.length} completed
                  </small>
                </Cell>
                <Cell>
                  <Badge>{e.status}</Badge>
                </Cell>
                <Cell>
                  <button
                    className="icon-button"
                    aria-label={"Edit " + e.name}
                    onClick={() => setEdit(e)}
                  >
                    <Pencil size={15} />
                  </button>
                </Cell>
              </Row>
            );
          })}
        </DataTable>
        {!employees.length && (
          <Empty
            title="No employees match your filters"
            text="Adjust your filters. New employees are added when creating a corporate client."
          />
        )}
        <div className="pagination">
          <span>
            {employees.length
              ? `${pageNum * 10 + 1}–${Math.min((pageNum + 1) * 10, employees.length)}`
              : "0"}{" "}
            of {employees.length} employees
          </span>
          <div>
            <Action
              secondary
              disabled={pageNum === 0}
              onClick={() => setPage(pageNum - 1)}
            >
              Previous
            </Action>
            <span>Page {pageNum + 1}</span>
            <Action
              secondary
              disabled={(pageNum + 1) * 10 >= employees.length}
              onClick={() => setPage(pageNum + 1)}
            >
              Next
            </Action>
          </div>
        </div>
      </div>
      {edit !== undefined && (
        <EditForm
          kind="employee"
          initial={edit || undefined}
          clientId={effectiveClient === "all" ? undefined : effectiveClient}
          onClose={() => setEdit(undefined)}
        />
      )}{" "}
      {/* {imp && <ImportDialog onClose={() => setImp(false)} />} */}
      <Sheet open={!!employee} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="detail-sheet">
          <SheetHeader>
            <SheetTitle>Employee profile</SheetTitle>
            <SheetDescription>
              Consultant view · Fictional employee information
            </SheetDescription>
          </SheetHeader>
          {employee && (
            <div className="sheet-body">
              <div className="profile-title">
                <Avatar name={employee.name} />
                <div>
                  <h2>{employee.name}</h2>
                  <p>
                    {employee.title} · {employee.department}
                  </p>
                </div>
              </div>
              <Badge>{employee.status}</Badge>
              <p>
                <Mail size={16} />
                {employee.email}
              </p>
              <div className="detail-grid">
                <span>
                  Employee ID<strong>{employee.id}</strong>
                </span>
                <span>
                  Corporate client
                  <strong>
                    {data.clients.find((c) => c.id === employee.clientId)?.name}
                  </strong>
                </span>
              </div>
              <Action secondary onClick={() => setEdit(employee)}>
                <Pencil size={15} />
                Edit profile & enrollment
              </Action>
              <div className="section-divider" />
              <h3>Engagement journey</h3>
              {employee.engagementId ? (
                <Link
                  className="sheet-engagement"
                  href={"/engagements?id=" + employee.engagementId}
                >
                  <strong>
                    {
                      data.engagements.find(
                        (e) => e.id === employee.engagementId,
                      )?.name
                    }
                    <ArrowRight size={16} />
                  </strong>
                  <small>
                    {
                      data.engagements.find(
                        (e) => e.id === employee.engagementId,
                      )?.phase
                    }
                  </small>
                </Link>
              ) : (
                <p>Not enrolled yet.</p>
              )}
              <h3>Assessment records</h3>
              <p className="field-note">
                Illustrative wellbeing index / 100. Not medical results.
              </p>
              {data.results
                .filter((r) => r.employeeId === employee.id)
                .map((r) => (
                  <div className="record-row" key={r.id}>
                    <span>
                      {
                        data.assessments.find((a) => a.id === r.assessmentId)
                          ?.name
                      }
                      <small>
                        {
                          data.assessments.find((a) => a.id === r.assessmentId)
                            ?.phase
                        }{" "}
                        · {fmt(r.date)}
                      </small>
                    </span>
                    <strong>{r.score}</strong>
                  </div>
                ))}
              {!data.results.some((r) => r.employeeId === employee.id) && (
                <p className="muted">No results recorded yet.</p>
              )}
              <h3>Upcoming sessions</h3>
              {data.events
                .filter((v) => v.engagementId === employee.engagementId)
                .slice(0, 4)
                .map((v) => (
                  <div className="record-row" key={v.id}>
                    <span>
                      {v.name}
                      <small>
                        {fmt(v.date)} · {v.time}
                      </small>
                    </span>
                  </div>
                ))}
              <h3>Documents</h3>
              <p className="muted">
                <FileText size={16} />
                No personal documents attached.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
