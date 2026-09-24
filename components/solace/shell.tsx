"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "./navigation";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
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
import { ClipboardCheck, CalendarDays, FolderOpen } from "lucide-react";
import Image from "next/image";
const nav = [
  ["/", "Overview", LayoutDashboard],
  ["/clients", "Corporate clients", Building2],
  ["/employees", "Employees", Users],
  ["/engagements", "Engagements", Route],
  ["/calendar", "Calendar", CalendarDays],
  ["/reports", "Reports & insights", ChartNoAxesCombined],
  ["/documents", "Documents", FolderOpen],
] as const;

const engagementNav = [
  ["/engagements", "All engagements", Route],
  ["/activities", "Activities", Activity],
  ["/assessments", "Assessments", ClipboardCheck],
] as const;

function matchesRoute(path: string, href: string) {
  return path === href || (href !== "/" && path.startsWith(`${href}/`));
}
export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let hasSession = false;

    try {
      hasSession = sessionStorage.getItem("solace-demo-auth") === "admin";
    } catch {
      hasSession = false;
    }

    if (!hasSession) {
      router.replace("/login");
      return;
    }

    setAuthenticated(true);
  }, [router]);

  if (!authenticated) {
    return (
      <div className="login-loading" role="status">
        Opening your workspace…
      </div>
    );
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const path = pathname?.replace(/\/+$/, "") || "/";
  const { data, clientId, setClientId, setData } = useSolace();
  const [role, setRole] = useState("Consultant / Admin");
  const [reset, setReset] = useState(false);
  const inEngagementSection = engagementNav.some(([href]) =>
    matchesRoute(path, href),
  );

  const [engagementMenuOpen, setEngagementMenuOpen] =
    useState(inEngagementSection);

  useEffect(() => {
    if (inEngagementSection) {
      setEngagementMenuOpen(true);
    }
  }, [path, inEngagementSection]);

  const breadcrumbLabel =
    engagementNav.find(([href]) => matchesRoute(path, href))?.[1] ||
    nav.find(([href]) => matchesRoute(path, href))?.[1] ||
    "Overview";
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "252px" } as React.CSSProperties}
    >
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <Link className="brand" href="/">
            <Image
              src="/logo.png"
              alt="Solace logo"
              width={190}
              height={51}
              priority
            />
            {/* <span className="brand-symbol">
              <Leaf size={26} />
            </span>
            solace<span className="brand-period">.</span> */}
          </Link>
          <div className="workspace-label">CONSULTANT WORKSPACE</div>
        </SidebarHeader>
        <SidebarContent className="sidebar-scroll">
          <SidebarMenu>
            {nav.map(([href, label, Icon]) => {
              if (href === "/engagements") {
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      type="button"
                      isActive={inEngagementSection}
                      aria-expanded={engagementMenuOpen}
                      aria-controls="engagement-submenu"
                      onClick={() => setEngagementMenuOpen((open) => !open)}
                    >
                      <Icon />
                      <span>{label}</span>

                      <ChevronDown
                        size={16}
                        style={{
                          marginLeft: "auto",
                          transform: engagementMenuOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 180ms ease",
                        }}
                      />
                    </SidebarMenuButton>

                    {engagementMenuOpen && (
                      <ul
                        id="engagement-submenu"
                        className="engagement-submenu"
                      >
                        {engagementNav.map(
                          ([childHref, childLabel, ChildIcon]) => {
                            const active = matchesRoute(path, childHref);

                            return (
                              <li key={childHref}>
                                <Link
                                  href={childHref}
                                  className={active ? "is-active" : ""}
                                  aria-current={active ? "page" : undefined}
                                  onClick={() => setRole("Consultant / Admin")}
                                >
                                  <ChildIcon size={16} />
                                  <span>{childLabel}</span>
                                </Link>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    )}
                  </SidebarMenuItem>
                );
              }

              const active = matchesRoute(path, href);

              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={active}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setRole("Consultant / Admin")}
                    >
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
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
              <DropdownMenuItem
                onClick={() => {
                  sessionStorage.removeItem("solace-demo-auth");
                  router.replace("/login");
                }}
              >
                <LogOut size={15} />
                Sign out
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
              Workspace <span>/</span> <strong>{breadcrumbLabel}</strong>
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
