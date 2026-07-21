export const JOB_STATUSES = [
  { id: "initiation", label: "Initiation" },
  { id: "phone_screen", label: "Phone screen" },
  { id: "apply", label: "Apply" },
  { id: "interviewing", label: "Interviewing" },
  { id: "offer_accept", label: "Offer/accept" },
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number]["id"];

export type DashboardJob = {
  id: number;
  companyName: string | null;
  positionTitle: string | null;
  status: string | null;
  remote: string | null;
  applied: boolean | null;
  notes: string | null;
  jobUrl: string | null;
  recruiterName: string | null;
  recruitingAgency: string | null;
  recruiterEmail: string | null;
  recruiterPhone: string | null;
  recruiterLinkedin: string | null;
  dateAdded: Date | string;
  updatedAt: Date | string;
};

export type DashboardPerson = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  isRecruiter: boolean;
  linkedinUrl: string | null;
};

export type DashboardDataEntry = {
  id: number;
  name: string;
  companyInfo: string;
  url: string;
  industry: string;
};

export type PipelineItem = {
  id: JobStatus;
  label: string;
  count: number;
  percentage: number;
};

export type RecruiterContact = {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  source: "application" | "contact";
};

export type DashboardSummary = {
  metrics: {
    totalApplications: number;
    activePipeline: number;
    interviewing: number;
    applied: number;
    recruiters: number;
    targetCompanies: number;
  };
  pipeline: PipelineItem[];
  priorityApplications: DashboardJob[];
  recruiters: RecruiterContact[];
};

export type DashboardInput = {
  jobs: DashboardJob[];
  people: DashboardPerson[];
  dataEntries: DashboardDataEntry[];
};

const ACTIVE_STATUSES = new Set<JobStatus>([
  "initiation",
  "phone_screen",
  "apply",
  "interviewing",
]);

export function summarizeDashboard({
  jobs,
  people,
  dataEntries,
}: DashboardInput): DashboardSummary {
  const totalApplications = jobs.length;
  const pipeline = JOB_STATUSES.map((status) => {
    const count = jobs.filter((job) => job.status === status.id).length;
    const percentage =
      totalApplications === 0 ? 0 : Math.round((count / totalApplications) * 100);

    return {
      id: status.id,
      label: status.label,
      count,
      percentage,
    };
  });

  const priorityApplications = [...jobs]
    .sort((first, second) => {
      return toTime(second.updatedAt) - toTime(first.updatedAt);
    })
    .slice(0, 5);

  const recruiters = getRecruiterContacts(jobs, people);

  return {
    metrics: {
      totalApplications,
      activePipeline: jobs.filter((job) =>
        ACTIVE_STATUSES.has(job.status as JobStatus),
      ).length,
      interviewing: jobs.filter((job) => job.status === "interviewing").length,
      applied: jobs.filter((job) => Boolean(job.applied)).length,
      recruiters: recruiters.length,
      targetCompanies: dataEntries.length,
    },
    pipeline,
    priorityApplications,
    recruiters,
  };
}

export function getRecruiterContacts(
  jobs: DashboardJob[],
  people: DashboardPerson[],
): RecruiterContact[] {
  const contacts = new Map<string, RecruiterContact>();

  for (const job of jobs) {
    const name = clean(job.recruiterName);
    const email = clean(job.recruiterEmail);

    if (!name && !email) {
      continue;
    }

    const company =
      clean(job.recruitingAgency) || clean(job.companyName) || "Application contact";
    const key = contactKey(name, email, company);

    contacts.set(key, {
      id: key,
      name: name || email || "Recruiter",
      company,
      email,
      phone: clean(job.recruiterPhone),
      linkedinUrl: clean(job.recruiterLinkedin),
      source: "application",
    });
  }

  for (const person of people) {
    if (!person.isRecruiter) {
      continue;
    }

    const name = `${person.firstName} ${person.lastName}`.trim();
    const company = clean(person.company) || "Saved contact";
    const email = clean(person.email);
    const key = contactKey(name, email, company);
    const existing = contacts.get(key);

    if (existing) {
      contacts.set(key, {
        ...existing,
        email: existing.email || email,
        phone: existing.phone || clean(person.phone),
        linkedinUrl: existing.linkedinUrl || clean(person.linkedinUrl),
      });
    } else {
      contacts.set(key, {
        id: key,
        name,
        company,
        email,
        phone: clean(person.phone),
        linkedinUrl: clean(person.linkedinUrl),
        source: "contact",
      });
    }
  }

  return Array.from(contacts.values())
    .sort((first, second) => first.name.localeCompare(second.name))
    .slice(0, 6);
}

export function formatStatus(status: string | null) {
  return JOB_STATUSES.find((item) => item.id === status)?.label || "Untracked";
}

export function formatRemote(remote: string | null) {
  switch (remote) {
    case "yes":
      return "Remote";
    case "no":
      return "On-site";
    case "hybrid":
      return "Hybrid";
    default:
      return "Unknown";
  }
}

export function formatShortDate(date: Date | string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function toTime(date: Date | string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function contactKey(name: string | null, email: string | null, company: string) {
  return [email || name || "contact", company].join(":").toLowerCase();
}
