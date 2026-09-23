"use client";
import { useState, ReactNode } from "react";
import Link from "./navigation";
import { usePathname } from "next/navigation";
import {
  Leaf,
  LayoutDashboard,
  Building2,
  Layers3,
  Users,
  Route,
  ChartNoAxesCombined,
  ChevronDown,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "sonner";
import { useSolace } from "@/lib/solace/store";
import { seed } from "@/lib/solace/data";
import { WebMCP } from "./webmcp";
import { Pick, Avatar, Action } from "./ui";
import { ClipboardCheck, CalendarDays } from "lucide-react";
const nav = [
  ["/", "Overview", LayoutDashboard],
  ["/clients", "Corporate clients", Building2],
  ["/employees", "Employees", Users],
  ["/engagements", "Engagements", Route],
  ["/assessments", "Assessments", ClipboardCheck],
  //   ["/programs", "Programs", Layers3],
  ["/calendar", "Calendar", CalendarDays],
  ["/reports", "Reports & insights", ChartNoAxesCombined],
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const path = pathname?.replace(/\/+$/, "") || "/";
  const { data, clientId, setClientId, setData } = useSolace();
  const [role, setRole] = useState("Consultant / Admin");
  const [reset, setReset] = useState(false);
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "242px" } as React.CSSProperties}
    >
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <Link className="brand" href="/">
            <span className="brand-symbol">
              <Leaf size={26} />
            </span>
            solace<span className="brand-period">.</span>
          </Link>
          <div className="workspace-label">CONSULTANT WORKSPACE</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {nav.map(([href, label, Icon]) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={path === href}>
                  <Link
                    href={href}
                    aria-current={path === href ? "page" : undefined}
                    onClick={() => setRole("Consultant / Admin")}
                  >
                    <Icon />
                    <span>{label}</span>
                    {/* {label === "Engagements" && (
                      <span className="nav-count">
                        {
                          data.engagements.filter((e) => e.status === "Active")
                            .length
                        }
                      </span>
                    )} */}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-note">
            <span className="mini-mark">
              <Leaf size={19} />
            </span>
            <strong>
              Small steps.
              <br />
              Lasting change.
            </strong>
            <p>A healthier workplace starts with your next engagement.</p>
            <Link href="/engagements">
              Explore engagements <ArrowRight size={15} />
            </Link>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="demo-label">
            <span />
            DEMO WORKSPACE
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="profile">
              <Avatar name="Sarah Mitchell" />
              <span>
                <strong>Sarah Mitchell</strong>
                <small>Wellbeing consultant</small>
              </span>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuLabel>Sarah Mitchell · Consultant</DropdownMenuLabel>
              <DropdownMenuLabel className="font-normal">
                Fictional presentation workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setReset(true)}>
                <RotateCcw size={15} />
                Reset demo data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <SidebarTrigger />
            <span className="breadcrumb">
              Workspace <span>/</span>{" "}
              <strong>
                {nav.find((n) => n[0] === path)?.[1] || "Overview"}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <Pick
              value={clientId}
              onChange={setClientId}
              label="Corporate client context"
              options={[
                { value: "all", label: "All corporate clients" },
                ...data.clients.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <span className="topbar-divider" />
            <div className="role-pick">
              <ShieldCheck size={16} />
              <Pick
                value={role}
                onChange={setRole}
                label="Switch role"
                options={["Consultant / Admin", "Corporate HR", "Employee"]}
              />
            </div>
          </div>
        </header>
        <main className="content">
          {role === "Consultant / Admin" ? (
            children
          ) : (
            <div className="role-preview">
              <span className="large-icon">
                <Users />
              </span>
              <div className="eyebrow">A CONNECTED PLATFORM</div>
              <h1>{role} experience</h1>
              <p>
                {role === "Corporate HR"
                  ? "Company-level participation, program progress and aggregated wellbeing insights. Individual sensitive records remain restricted."
                  : "A personal wellbeing journey with assessments, activities, sessions and resources."}
              </p>
              <span className="badge amber">Preview coming soon</span>
              <Action onClick={() => setRole("Consultant / Admin")}>
                Return to consultant workspace <ArrowRight size={16} />
              </Action>
            </div>
          )}
          <footer className="page-footer">
            <span>Solace · People first, always.</span>
            <span>Fictional data · Changes saved in this browser</span>
          </footer>
        </main>
      </div>
      <WebMCP />
      <Toaster position="bottom-right" richColors />
      <AlertDialog open={reset} onOpenChange={setReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this demo?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes changes made in this browser and restores all
              fictional clients, employees and engagements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep changes</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setData(seed());
                setClientId("all");
                toast.success("Original demo restored");
              }}
            >
              Reset demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
