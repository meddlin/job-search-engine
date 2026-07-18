import { describe, expect, it } from "vitest";

import {
  formatRemote,
  formatStatus,
  getRecruiterContacts,
  summarizeDashboard,
  type DashboardDataEntry,
  type DashboardJob,
  type DashboardPerson,
} from "./dashboard-data";

const jobs: DashboardJob[] = [
  {
    id: 1,
    companyName: "Acme",
    positionTitle: "Frontend Engineer",
    status: "interviewing",
    remote: "hybrid",
    applied: true,
    notes: null,
    jobUrl: null,
    recruiterName: "Sam Recruiter",
    recruitingAgency: "Talent Co",
    recruiterEmail: "sam@example.com",
    recruiterPhone: "555-0101",
    recruiterLinkedin: null,
    dateAdded: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: 2,
    companyName: "Globex",
    positionTitle: "Platform Engineer",
    status: "apply",
    remote: "yes",
    applied: false,
    notes: null,
    jobUrl: null,
    recruiterName: null,
    recruitingAgency: null,
    recruiterEmail: null,
    recruiterPhone: null,
    recruiterLinkedin: null,
    dateAdded: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: 3,
    companyName: "Initech",
    positionTitle: "Staff Engineer",
    status: "offer_accept",
    remote: "no",
    applied: true,
    notes: null,
    jobUrl: null,
    recruiterName: "Alex Hiring",
    recruitingAgency: null,
    recruiterEmail: "alex@example.com",
    recruiterPhone: null,
    recruiterLinkedin: null,
    dateAdded: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
];

const people: DashboardPerson[] = [
  {
    id: 1,
    firstName: "Sam",
    lastName: "Recruiter",
    email: "sam@example.com",
    phone: "555-0101",
    company: "Talent Co",
    notes: null,
  },
  {
    id: 2,
    firstName: "Priya",
    lastName: "Sourcer",
    email: "priya@example.com",
    phone: "555-0102",
    company: "Search Partners",
    notes: null,
  },
];

const dataEntries: DashboardDataEntry[] = [
  {
    id: 1,
    name: "Acme",
    companyInfo: "SaaS",
    url: "https://example.com",
    industry: "Software",
  },
  {
    id: 2,
    name: "Globex",
    companyInfo: "Infrastructure",
    url: "https://globex.example",
    industry: "Cloud",
  },
];

describe("dashboard data", () => {
  it("summarizes applications, pipeline status, recruiters, and targets", () => {
    const summary = summarizeDashboard({ jobs, people, dataEntries });

    expect(summary.metrics).toEqual({
      totalApplications: 3,
      activePipeline: 2,
      interviewing: 1,
      applied: 2,
      recruiters: 3,
      targetCompanies: 2,
    });
    expect(summary.pipeline).toEqual([
      { id: "initiation", label: "Initiation", count: 0, percentage: 0 },
      { id: "phone_screen", label: "Phone screen", count: 0, percentage: 0 },
      { id: "apply", label: "Apply", count: 1, percentage: 33 },
      { id: "interviewing", label: "Interviewing", count: 1, percentage: 33 },
      { id: "offer_accept", label: "Offer/accept", count: 1, percentage: 33 },
    ]);
    expect(summary.priorityApplications.map((job) => job.id)).toEqual([2, 1, 3]);
  });

  it("deduplicates recruiter contacts from applications and saved people", () => {
    const recruiters = getRecruiterContacts(jobs, people);

    expect(recruiters).toHaveLength(3);
    expect(recruiters.map((recruiter) => recruiter.email).sort()).toEqual([
      "alex@example.com",
      "priya@example.com",
      "sam@example.com",
    ]);
  });

  it("formats known and unknown job labels", () => {
    expect(formatStatus("interviewing")).toBe("Interviewing");
    expect(formatStatus("unexpected")).toBe("Untracked");
    expect(formatRemote("yes")).toBe("Remote");
    expect(formatRemote(null)).toBe("Unknown");
  });
});
