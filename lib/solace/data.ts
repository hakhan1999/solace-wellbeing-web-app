export type Phase =
  | "Pre-assessment"
  | "Program activities"
  | "Ongoing assessments"
  | "Post-assessment";
export const phases: Phase[] = [
  "Pre-assessment",
  "Program activities",
  "Ongoing assessments",
  "Post-assessment",
];
export const categories = [
  "Physical",
  "Mental wellbeing",
  "Emotional wellbeing",
  "Medical / blood tests",
  "Other",
];
export interface Client {
  id: string;
  name: string;
  industry: string;
  size: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  consultant: string;
  color: string;
  status: string;
  logo?: string;
}
export interface Engagement {
  id: string;
  clientId: string;
  name: string;
  objective: string;
  start: string;
  end: string;
  consultant: string;
  status: "Draft" | "Active" | "Completed";
  phase: Phase;
  template: string;
}
export interface Employee {
  id: string;
  clientId: string;
  engagementId: string;
  name: string;
  email: string;
  department: string;
  title: string;
  status: string;
}
export interface Assessment {
  id: string;
  engagementId: string;
  name: string;
  category: string;
  phase: Phase;
  date: string;
  frequency: string;
  audience: string;
}
export interface Result {
  id: string;
  assessmentId: string;
  employeeId: string;
  score: number;
  notes: string;
  date: string;
}
export interface Event {
  id: string;
  engagementId: string;
  name: string;
  type: "Activity" | "Group session" | "One-to-one";
  category: string;
  date: string;
  time: string;
  duration: number;
  facilitator: string;
  capacity: number;
  location: string;
  audience: string;
  attendees: string[];
  assignedEmployeeIds?: string[];
  assignmentMode?: "single" | "multiple";
  additionalDetails?: string;
  documents?: ActivityDocument[];
}
export interface Resource {
  id: string;
  engagementId: string;
  name: string;
  type: string;
  url: string;
  fileName?: string;
}

export interface GeneralDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export const assessmentTypes = [
  "Physical",
  "Mental wellbeing",
  "Emotional wellbeing",
  "Medical/blood test",
  "Other",
] as const;

export interface ActivityAssessment {
  id: string;

  // Retained for older saved assessments.
  activityId?: string;

  engagementId: string;
  clientId: string;
  employeeId: string;
  additionalDetails: string;
  createdAt: string;

  // Optional so existing browser data remains compatible.
  category?: string;
  date?: string;
  time?: string;
  duration?: number;
  facilitator?: string;
  location?: string;
  documents?: ActivityDocument[];
}

export interface ActivityDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Store {
  clients: Client[];
  engagements: Engagement[];
  employees: Employee[];
  assessments: Assessment[];
  results: Result[];
  events: Event[];
  resources: Resource[];
  activityAssessments?: ActivityAssessment[];
  generalDocuments?: GeneralDocument[];
}
export const templates = [
  {
    name: "Whole-person wellbeing",
    description:
      "A balanced journey across physical, mental and emotional wellbeing.",
    duration: "4 months",
    tags: ["3 wellbeing dimensions", "Movement", "Group sessions"],
  },
  {
    name: "Resilience at work",
    description:
      "Build sustainable habits for focus, connection and emotional resilience.",
    duration: "3 months",
    tags: ["Mental wellbeing", "Learning", "1:1 coaching"],
  },
  {
    name: "Move & thrive",
    description:
      "An active program that makes everyday movement part of working life.",
    duration: "5 months",
    tags: ["Physical wellbeing", "Yoga", "Team activities"],
  },
];
export const uid = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
export function day(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
export const fmt = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
export const pct = (a: number, b: number) =>
  b ? Math.round((a / b) * 100) : 0;
export const initials = (name: string) =>
  name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
export function audienceEmployees(data: Store, a: Assessment) {
  return data.employees.filter(
    (e) =>
      e.engagementId === a.engagementId &&
      e.status === "Active" &&
      (a.audience === "All employees" || e.department === a.audience),
  );
}
export function stats(data: Store, engagementId?: string) {
  const employees = data.employees.filter(
    (e) =>
      (!engagementId || e.engagementId === engagementId) &&
      e.engagementId &&
      e.status === "Active",
  );
  const assessments = data.assessments.filter(
    (a) => !engagementId || a.engagementId === engagementId,
  );
  const assignments = assessments.reduce(
    (n, a) => n + audienceEmployees(data, a).length,
    0,
  );
  const results = data.results.filter((r) =>
    assessments.some(
      (a) =>
        a.id === r.assessmentId &&
        audienceEmployees(data, a).some((e) => e.id === r.employeeId),
    ),
  );
  const participated = employees.filter(
    (e) =>
      results.some((r) => r.employeeId === e.id) ||
      data.events.some(
        (v) =>
          (!engagementId || v.engagementId === engagementId) &&
          v.attendees.includes(e.id),
      ),
  ).length;
  return {
    employees: employees.length,
    assignments,
    completed: results.length,
    completion: pct(results.length, assignments),
    participation: pct(participated, employees.length),
    participated,
  };
}
export function comparisons(
  data: Store,
  engagementId?: string,
  department = "All departments",
  employeeId = "all",
  category = "All categories",
  from = "",
  to = "",
) {
  return categories
    .filter((c) => category === "All categories" || c === category)
    .map((cat) => {
      const average = (phase: Phase) => {
        const aa = data.assessments.filter(
          (a) =>
            (!engagementId || a.engagementId === engagementId) &&
            a.category === cat &&
            a.phase === phase,
        );
        const rr = data.results.filter(
          (r) =>
            aa.some((a) => a.id === r.assessmentId) &&
            data.employees.some(
              (e) =>
                e.id === r.employeeId &&
                (department === "All departments" ||
                  e.department === department) &&
                (employeeId === "all" || e.id === employeeId),
            ) &&
            (!from || r.date >= from) &&
            (!to || r.date <= to),
        );
        return rr.length
          ? Math.round(rr.reduce((s, r) => s + r.score, 0) / rr.length)
          : null;
      };
      return {
        name: cat.replace(" wellbeing", "").replace(" / blood tests", ""),
        Baseline: average("Pre-assessment"),
        Current: average("Ongoing assessments"),
        Final: average("Post-assessment"),
      };
    });
}
export function seed(): Store {
  const clients: Client[] = [
    {
      id: "c1",
      name: "Meridian Technologies",
      industry: "Technology",
      size: "201–500",
      contact: "Olivia Bennett",
      email: "olivia@meridian.example",
      phone: "+44 20 7946 0101",
      address: "18 Finsbury Square, London",
      consultant: "Sarah Mitchell",
      color: "#14675a",
      status: "Active",
    },
    {
      id: "c2",
      name: "Northstar Studio",
      industry: "Design & creative",
      size: "51–200",
      contact: "James Carter",
      email: "james@northstar.example",
      phone: "+44 20 7946 0202",
      address: "42 King Street, Manchester",
      consultant: "Sarah Mitchell",
      color: "#6e729c",
      status: "Active",
    },
    {
      id: "c3",
      name: "Evergreen Group",
      industry: "Professional services",
      size: "201–500",
      contact: "Aisha Rahman",
      email: "aisha@evergreen.example",
      phone: "+44 20 7946 0303",
      address: "8 Park Row, Bristol",
      consultant: "David Chen",
      color: "#aa744c",
      status: "Active",
    },
  ];
  const engagements: Engagement[] = [
    {
      id: "e1",
      clientId: "c1",
      name: "Thrive at Meridian",
      objective:
        "Build healthier habits, stronger connections and a more resilient team.",
      start: day(-42),
      end: day(78),
      consultant: "Sarah Mitchell",
      status: "Active",
      phase: "Program activities",
      template: templates[0].name,
    },
    {
      id: "e2",
      clientId: "c2",
      name: "The resilience project",
      objective: "Support creative teams with sustainable working habits.",
      start: day(-20),
      end: day(70),
      consultant: "Sarah Mitchell",
      status: "Active",
      phase: "Pre-assessment",
      template: templates[1].name,
    },
    {
      id: "e3",
      clientId: "c3",
      name: "Everyday energy",
      objective: "Make movement a natural part of the working day.",
      start: day(-160),
      end: day(-10),
      consultant: "David Chen",
      status: "Completed",
      phase: "Post-assessment",
      template: templates[2].name,
    },
    {
      id: "e4",
      clientId: "c1",
      name: "Winter wellbeing",
      objective: "Maintain momentum through a new season.",
      start: day(85),
      end: day(205),
      consultant: "Sarah Mitchell",
      status: "Draft",
      phase: "Pre-assessment",
      template: templates[0].name,
    },
  ];
  const names = [
    "Amelia Clarke",
    "Oliver James",
    "Sofia Patel",
    "Noah Williams",
    "Isla Thompson",
    "Ethan Wilson",
    "Maya Singh",
    "Leo Anderson",
    "Grace Chen",
    "Lucas Brown",
    "Zara Ahmed",
    "Henry Davies",
    "Ella Robinson",
    "Arjun Shah",
    "Freya Martin",
    "Oscar Taylor",
    "Ava Roberts",
    "Adam Khan",
    "Lily Lewis",
    "Finn Walker",
    "Mia Evans",
    "Daniel Harris",
    "Chloe Scott",
    "Ryan Moore",
    "Hana Ali",
    "Theo Wright",
    "Ruby Green",
    "Sam Hughes",
    "Nora King",
    "Ben Turner",
    "Emma Baker",
    "Alex Hill",
    "Layla Wood",
    "Jack White",
    "Ivy Hall",
    "Omar Malik",
  ];
  const employees: Employee[] = names.map((name, i) => ({
    id: "p" + i,
    name,
    email:
      name.toLowerCase().replace(" ", ".") +
      "@" +
      (i < 18 ? "meridian" : i < 28 ? "northstar" : "evergreen") +
      ".example",
    clientId: i < 18 ? "c1" : i < 28 ? "c2" : "c3",
    engagementId: i < 18 ? "e1" : i < 28 ? "e2" : "e3",
    department: ["Engineering", "People & Culture", "Marketing", "Operations"][
      i % 4
    ],
    title: ["Specialist", "Team Lead", "Manager", "Associate"][i % 4],
    status: "Active",
  }));
  const assessments: Assessment[] = [];
  const results: Result[] = [];
  for (const en of engagements.filter((e) => e.status !== "Draft"))
    for (const [pi, phase] of [phases[0], phases[2], phases[3]].entries())
      for (let ci = 0; ci < 3; ci++) {
        const id = `a-${en.id}-${pi}-${ci}`;
        assessments.push({
          id,
          engagementId: en.id,
          name: [
            "Movement & energy",
            "Mind & resilience",
            "Connection & balance",
          ][ci],
          category: categories[ci],
          phase,
          date: day(
            en.id === "e3"
              ? -150 + pi * 65
              : pi === 0
                ? -30
                : pi === 1
                  ? 7
                  : 70,
          ),
          frequency: pi === 1 ? "Monthly" : "Once",
          audience: "All employees",
        });
        employees
          .filter((e) => e.engagementId === en.id)
          .forEach((em, i) => {
            if (
              en.id === "e3" ||
              (pi === 0 && (en.id === "e1" ? i < 16 : i < 6)) ||
              (en.id === "e1" && pi === 1 && i < 10)
            ) {
              results.push({
                id: "r-" + id + "-" + em.id,
                assessmentId: id,
                employeeId: em.id,
                score: Math.min(96, 48 + ((i * 7 + ci * 5) % 25) + pi * 9),
                notes: "Fictional self-reported wellbeing check-in.",
                date: day(
                  en.id === "e3" ? -150 + pi * 65 : pi === 0 ? -32 : -2,
                ),
              });
            }
          });
      }
  const events: Event[] = [
    ["Morning reset: guided yoga", "Activity", "Yoga", 1, "09:00"],
    ["Building everyday resilience", "Group session", "Learning", 2, "14:00"],
    ["A conversation about balance", "One-to-one", "Coaching", 3, "11:30"],
    ["Move together challenge", "Activity", "Group activities", 5, "12:00"],
    ["Focus & energy workshop", "Group session", "Learning", 8, "10:00"],
  ].map((v, i) => ({
    id: "v" + i,
    engagementId: "e1",
    name: String(v[0]),
    type: v[1] as Event["type"],
    category: String(v[2]),
    date: day(Number(v[3])),
    time: String(v[4]),
    duration: 45,
    facilitator: i % 2 ? "David Chen" : "Sarah Mitchell",
    capacity: i === 2 ? 1 : 25,
    location: i % 2 ? "Online · demo session" : "Meridian · Wellness room",
    audience: "All employees",
    attendees: [],
  }));
  events.push({
    id: "v-past",
    engagementId: "e1",
    name: "Wellbeing kickoff",
    type: "Group session",
    category: "Learning",
    date: day(-7),
    time: "10:00",
    duration: 60,
    facilitator: "Sarah Mitchell",
    capacity: 25,
    location: "Meridian · Main hall",
    audience: "All employees",
    attendees: employees.slice(0, 15).map((e) => e.id),
  });
  return {
    clients,
    engagements,
    employees,
    assessments,
    results,
    events,
    resources: [
      {
        id: "res1",
        engagementId: "e1",
        name: "Your everyday wellbeing guide",
        type: "Guide",
        url: "/wellbeing-guide.html",
      },
      {
        id: "res2",
        engagementId: "e1",
        name: "Session reflection worksheet",
        type: "Document",
        url: "/reflection.html",
      },
    ],
  };
}


export function saveEmployeeActivity(
  store: Store,
  activityId: string,
  employeeId: string,
  edited: Event,
  splitId: string
): Pick<Store, "events" | "activityAssessments"> {
  const source = store.events.find(
    (event) => event.id === activityId
  );

  if (!source) {
    return {
      events: store.events,
      activityAssessments: store.activityAssessments,
    };
  }

  const engagement = store.engagements.find(
    (item) => item.id === source.engagementId
  );

  const assignedIds = Array.from(
    new Set(
      source.assignedEmployeeIds ??
        store.employees
          .filter(
            (employee) =>
              employee.clientId === engagement?.clientId &&
              employee.engagementId === source.engagementId &&
              employee.status === "Active" &&
              (source.audience === "All employees" ||
                employee.department === source.audience)
          )
          .map((employee) => employee.id)
    )
  );

  if (!assignedIds.includes(employeeId)) {
    return {
      events: store.events,
      activityAssessments: store.activityAssessments,
    };
  }

  const remainingIds = assignedIds.filter(
    (id) => id !== employeeId
  );

  // A shared activity becomes a separate entry for this employee.
  // An already individual activity keeps its existing ID.
  const savedId = remainingIds.length ? splitId : source.id;

  const individualActivity: Event = {
    ...source,
    ...edited,
    id: savedId,
    engagementId: source.engagementId,
    type: "Activity",
    assignmentMode: "single",
    audience: "Selected employees",
    assignedEmployeeIds: [employeeId],
    attendees: source.attendees.filter(
      (id) => id === employeeId
    ),
  };

  return {
    events: store.events.flatMap((event) => {
      if (event.id !== source.id) return [event];

      if (!remainingIds.length) {
        return [individualActivity];
      }

      return [
        {
          ...source,
          audience: "Selected employees",
          assignedEmployeeIds: remainingIds,
          attendees: source.attendees.filter(
            (id) => id !== employeeId
          ),
        },
        individualActivity,
      ];
    }),

    // Keep this employee's assessments linked to their edited activity.
    activityAssessments: store.activityAssessments?.map(
      (assessment) =>
        assessment.activityId === source.id &&
        assessment.employeeId === employeeId
          ? { ...assessment, activityId: savedId }
          : assessment
    ),
  };
}