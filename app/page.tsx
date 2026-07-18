import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileText,
  Send,
  UserRoundSearch,
  Users,
} from "lucide-react";

import DashboardPipelineChart from "@/app/components/DashboardPipelineChart";
import {
  formatRemote,
  formatShortDate,
  formatStatus,
  summarizeDashboard,
  type DashboardDataEntry,
  type DashboardJob,
  type DashboardPerson,
  type DashboardSummary,
  type PipelineItem,
  type RecruiterContact,
} from "@/app/dashboard-data";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await loadDashboardSummary();

  return <HomeDashboard summary={summary} />;
}

export async function loadDashboardSummary() {
  const [jobs, people, dataEntries] = await Promise.all([
    prisma.jobApplication.findMany({
      orderBy: { updatedAt: "desc" },
    }),
    prisma.person.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.dataEntry.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return summarizeDashboard({
    jobs: jobs as DashboardJob[],
    people: people as DashboardPerson[],
    dataEntries: dataEntries as DashboardDataEntry[],
  });
}

export function HomeDashboard({ summary }: { summary: DashboardSummary }) {
  const metrics = [
    {
      label: "Applications",
      value: summary.metrics.totalApplications,
      description: "All tracked opportunities",
      icon: BriefcaseBusiness,
    },
    {
      label: "Active pipeline",
      value: summary.metrics.activePipeline,
      description: "Before offer/accept",
      icon: ClipboardList,
    },
    {
      label: "Interviewing",
      value: summary.metrics.interviewing,
      description: "Current interview loops",
      icon: UserRoundSearch,
    },
    {
      label: "Recruiters",
      value: summary.metrics.recruiters,
      description: "Application and people contacts",
      icon: Users,
    },
    {
      label: "Applied",
      value: summary.metrics.applied,
      description: "Submitted applications",
      icon: Send,
    },
    {
      label: "Target companies",
      value: summary.metrics.targetCompanies,
      description: "Saved research entries",
      icon: Building2,
    },
  ];

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-[90%] flex-col gap-6 py-5">
          <header className="flex flex-col gap-5 rounded-lg border bg-card px-5 py-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <Badge variant="secondary" className="w-fit">
                Job search command center
              </Badge>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Dashboard
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Review application momentum, recruiter coverage, target
                  companies, and resume follow-up from one operational view.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[30rem]">
              <Button asChild>
                <Link href="/kanban">
                  <ClipboardList data-icon="inline-start" />
                  Manage jobs
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/people">
                  <Users data-icon="inline-start" />
                  Recruiters
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/data">
                  <Building2 data-icon="inline-start" />
                  Research
                </Link>
              </Button>
            </div>
          </header>

          <section
            aria-label="Job search metrics"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          >
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
            <div className="flex min-w-0 flex-col gap-6">
              <PipelineCard pipeline={summary.pipeline} />
              <PriorityApplicationsCard
                applications={summary.priorityApplications}
              />
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              <ResumeCard />
              <RecruiterCard recruiters={summary.recruiters} />
              <QuickActionsCard />
            </aside>
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        </CardAction>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PipelineCard({ pipeline }: { pipeline: PipelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline overview</CardTitle>
        <CardDescription>
          Applications grouped by the current kanban statuses.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DashboardPipelineChart pipeline={pipeline} />
        <div className="flex flex-col gap-4">
          {pipeline.map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {item.count}
                </span>
              </div>
              <Progress
                value={item.percentage}
                aria-label={`${item.label} pipeline share`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityApplicationsCard({
  applications,
}: {
  applications: DashboardJob[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority applications</CardTitle>
        <CardDescription>
          Recently updated opportunities that are most likely to need attention.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="min-w-56">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {application.positionTitle || "Untitled position"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {application.companyName || "Unknown company"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatStatus(application.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRemote(application.remote)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatShortDate(application.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyPanel
            icon={BriefcaseBusiness}
            title="No applications yet"
            description="Start the kanban board by adding a role, company, status, and recruiter details."
            href="/kanban"
            action="Open kanban"
          />
        )}
      </CardContent>
    </Card>
  );
}

function ResumeCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume changes</CardTitle>
        <CardDescription>
          Static v1 tracking until resume history exists in the data model.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-background text-foreground">
              <FileText className="size-4" aria-hidden="true" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Last tailored resume</p>
                <Badge variant="outline">Placeholder</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Track the latest resume version here once resume history is
                added.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-dashed p-4">
          <AlertCircle className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Needs refresh</p>
            <p className="text-sm text-muted-foreground">
              Review bullets against active interviewing roles and recruiter
              feedback before the next submission.
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/kanban">
                Review roles for tailoring
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Uses active jobs as the source for resume tailoring priorities.
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}

function RecruiterCard({ recruiters }: { recruiters: RecruiterContact[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current recruiters</CardTitle>
        <CardDescription>
          Contacts pulled from applications and saved people.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recruiters.length > 0 ? (
          recruiters.map((recruiter, index) => (
            <div key={recruiter.id} className="flex flex-col gap-4">
              {index > 0 ? <Separator /> : null}
              <div className="flex items-start gap-3">
                <Avatar className="size-9">
                  <AvatarFallback>{initials(recruiter.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium leading-none">{recruiter.name}</p>
                    <Badge variant="outline">
                      {recruiter.source === "application"
                        ? "Application"
                        : "Contact"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {recruiter.company}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {recruiter.email || recruiter.phone || "No direct contact"}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyPanel
            icon={Users}
            title="No recruiters yet"
            description="Add recruiter details to a job or save people contacts to see coverage here."
            href="/people"
            action="Open people"
          />
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const actions = [
    {
      href: "/kanban",
      label: "Move applications",
      description: "Update stages and add new opportunities.",
      icon: ClipboardList,
    },
    {
      href: "/people",
      label: "Update recruiters",
      description: "Keep contact info and notes current.",
      icon: Users,
    },
    {
      href: "/data",
      label: "Review companies",
      description: "Refresh target-company research.",
      icon: Building2,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump to the working surfaces.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Button
              key={action.href}
              asChild
              variant="ghost"
              className="h-auto justify-start px-3 py-3 text-left"
            >
              <Link href={action.href}>
                <Icon data-icon="inline-start" />
                <span className="flex min-w-0 flex-col">
                  <span>{action.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-md border border-dashed p-5">
      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={href}>
          {action}
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  );
}

function initials(name: string) {
  const value = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return value || "R";
}
